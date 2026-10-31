'use strict';
// سيرفر لوحة العملاء: بيخدم الواجهة، بيحمي البيانات بكلمة سر، بيزامن بين الأجهزة، وبيمرر طلبات Gemini.
// بدون مكتبات خارجية (pg اختياري لو بدك قاعدة بيانات).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { mergeState, emptyState } = require('./public/merge.js');

loadDotEnv(path.join(__dirname, '.env'));

const PORT = +process.env.PORT || 3000;
const PASSWORD = process.env.APP_PASSWORD || '';
const HR_PASSWORD = process.env.HR_PASSWORD || ''; // حساب عرض فقط (تقارير)
const SECRET = process.env.SESSION_SECRET || 'zl-local-secret';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const MODELS = (process.env.GEMINI_MODELS || 'gemini-3.6-flash,gemini-3.8-flash,gemini-3.5-flash,gemini-3.1-flash-lite,gemini-flash-lite-latest')
  .split(',').map((s) => s.trim()).filter(Boolean);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data-store');
const PUBLIC = path.join(__dirname, 'public');
const SEED = fs.readFileSync(path.join(__dirname, 'server', 'leads.json'));
// أصول تطبيق الأندرويد (Capacitor) + أي دومين إضافي
const ORIGINS = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost',
  ...(process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)]);

function loadDotEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (e) { /* no .env */ }
}

// ---------- storage ----------
function fileStore() {
  const file = path.join(DATA_DIR, 'state.json');
  return {
    kind: 'file',
    async get() { try { return JSON.parse(await fs.promises.readFile(file, 'utf8')); } catch (e) { return null; } },
    async put(s) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await fs.promises.writeFile(file + '.tmp', JSON.stringify(s));
      await fs.promises.rename(file + '.tmp', file);
    },
  };
}
function pgStore() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'off' ? false : { rejectUnauthorized: false } });
  const ready = pool.query('CREATE TABLE IF NOT EXISTS app_state (id int PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
  return {
    kind: 'postgres',
    async get() { await ready; const r = await pool.query('SELECT data FROM app_state WHERE id = 1'); return r.rows[0] ? r.rows[0].data : null; },
    async put(s) { await ready; await pool.query('INSERT INTO app_state (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()', [s]); },
  };
}
const store = process.env.DATABASE_URL ? pgStore() : fileStore();
let queue = Promise.resolve();
const serialized = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };

// ---------- auth ----------
// admin = كل شي، viewer = قراءة التقارير بس
const ROLE_PASSWORDS = () => ({ admin: PASSWORD, viewer: HR_PASSWORD });
const sessionToken = (role) => role + '.' + crypto.createHmac('sha256', SECRET).update(`zl-v2:${role}:${ROLE_PASSWORDS()[role]}`).digest('base64url');
const safeEqual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
function roleOf(req) {
  const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const role = tok.split('.')[0];
  if ((role !== 'admin' && role !== 'viewer') || !ROLE_PASSWORDS()[role]) return null;
  return safeEqual(tok, sessionToken(role)) ? role : null;
}
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 60000);
  attempts.set(ip, list);
  return list.length >= 8;
}

// ---------- gemini ----------
async function gemini(system, contents) {
  let last = 'ما في رد';
  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(90000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.7 } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        last = (j.error && j.error.message) || `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403 || /API key/i.test(last)) return { error: 'مفتاح Gemini مرفوض: ' + last };
        continue; // 404 / 429 / 503 → الموديل اللي بعده
      }
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
      if (text) return { text, model };
      last = 'رد فاضي';
    } catch (e) {
      last = e.name === 'TimeoutError' ? 'Gemini طوّل كثير' : e.message;
    }
  }
  return { error: last };
}

// ---------- http helpers ----------
function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('الطلب كبير كثير'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(Object.assign(new Error('JSON غلط'), { status: 400 })); } });
    req.on('error', reject);
  });
}

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/status') return sendJson(res, 200, { ok: true, auth: !!PASSWORD, hr: !!HR_PASSWORD, ai: !!GEMINI_KEY, storage: store.kind });
  if (route === 'POST /api/login') {
    if (!PASSWORD) return sendJson(res, 503, { error: 'السيرفر ما إله كلمة سر — حط APP_PASSWORD' });
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (tooMany(ip)) return sendJson(res, 429, { error: 'محاولات كثيرة، استنى دقيقة' });
    attempts.get(ip).push(Date.now());
    const body = await readJson(req, 10000);
    const pw = String(body.password || '');
    const role = safeEqual(pw, PASSWORD) ? 'admin' : HR_PASSWORD && safeEqual(pw, HR_PASSWORD) ? 'viewer' : null;
    if (!role) return sendJson(res, 401, { error: 'كلمة السر غلط' });
    return sendJson(res, 200, { token: sessionToken(role), role });
  }
  const role = roleOf(req);
  if (!role) return sendJson(res, 401, { error: 'لازم تسجّل دخول' });
  if (route === 'GET /api/leads') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(SEED);
  }
  if (route === 'GET /api/state') return sendJson(res, 200, { state: (await store.get()) || emptyState() });
  if (route === 'PUT /api/state') {
    if (role !== 'admin') return sendJson(res, 403, { error: 'حساب الـ HR للعرض بس' });
    const body = await readJson(req, 8e6);
    const merged = await serialized(async () => {
      const m = mergeState((await store.get()) || emptyState(), body.state || {});
      await store.put(m);
      return m;
    });
    return sendJson(res, 200, { state: merged });
  }
  if (route === 'POST /api/ai') {
    if (!GEMINI_KEY) return sendJson(res, 503, { error: 'GEMINI_API_KEY مش محطوط على السيرفر' });
    const body = await readJson(req, 2e6);
    const r = await gemini(String(body.system || ''), Array.isArray(body.contents) ? body.contents : []);
    return sendJson(res, r.error ? 502 : 200, r);
  }
  return sendJson(res, 404, { error: 'not found' });
}

// ---------- static ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('مش موجود'); }
    const ext = path.extname(file);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.png' ? 'public, max-age=604800' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname.startsWith('/api/')) {
    const origin = req.headers.origin;
    if (origin && ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    try { await api(req, res, url); }
    catch (e) { if (!res.headersSent) sendJson(res, e.status || 500, { error: e.status ? e.message : 'خطأ بالسيرفر' }); if (!e.status) console.error(e); }
    return;
  }
  if (url.pathname === '/healthz') return sendJson(res, 200, { ok: true });
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`لوحة العملاء شغالة على http://localhost:${PORT}  (storage: ${store.kind}, ai: ${GEMINI_KEY ? 'on' : 'off'}, password: ${PASSWORD ? 'set' : 'MISSING'}, hr: ${HR_PASSWORD ? 'set' : 'off'})`);
});
