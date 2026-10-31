(() => {
  'use strict';

  const CFG = window.APP_CONFIG || {};
  const M = window.ZLMerge;
  const STORE_KEY = 'zl-crm-v1';
  const SEED_KEY = 'zl-seed-v1';
  const AUTH_KEY = 'zl-auth-v1';
  const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  let SEED = [];

  const STATUSES = [
    { id: 'new', label: 'جديد' },
    { id: 'noanswer', label: 'ما رد' },
    { id: 'contacted', label: 'تم التواصل' },
    { id: 'interested', label: 'مهتم' },
    { id: 'proposal', label: 'عرض سعر' },
    { id: 'won', label: 'تم الإغلاق' },
    { id: 'lost', label: 'مرفوض' },
  ];
  const ST = Object.fromEntries(STATUSES.map((s, i) => [s.id, { ...s, i }]));
  const CLOSED = new Set(['won', 'lost']);
  const CITIES = ['الزرقاء', 'الرصيفة', 'عمان'];
  const AV_COLORS = ['#6F9476', '#56709A', '#BC5B3B', '#8B6A4C', '#85638E', '#45634F'];
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const SERVICE_KEYS = [
    ['إعلانات ممولة', /إعلان/],
    ['سوشال ميديا', /سوشال|بوستات|تصميم/],
    ['فيديوهات وريلز', /فيديو|ريلز/],
    ['تصوير', /تصوير/],
    ['موقع / متجر', /موقع|متجر|كتالوج/],
    ['أنظمة حجز وكاشير', /نظام|حجز|كاشير|مواعيد|اشتراكات/],
    ['تحسين السمعة', /سمعة/],
    ['باقة كاملة', /باقة/],
  ];
  const DEFAULT_TEMPLATE = 'مرحبا 👋\nمعك {اسمي} من {الوكالة}. شفت {العميل} على قوقل ماب وعجبني شغلكم.\nعنا فكرة ممكن تزيد زباينكم من خلال {الخدمة}.\nبتحب أبعتلك أمثلة عن شغلنا؟';

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    columns: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
    sparkles: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    wa: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
    map: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    up: '<path d="M7 17 17 7M8 7h9v9"/>',
    down: '<path d="M17 7 7 17M16 17H7V8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/>',
    announce: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  // ---------- utils ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');
  const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
  const today = () => iso(new Date());
  const arDate = (s) => { if (!s) return '—'; const d = new Date(s + (s.length === 10 ? 'T00:00' : '')); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const norm = (s) => String(s || '').toLowerCase()
    .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const intl = (p) => p ? '962' + p.replace(/^0/, '') : '';
  const isMobile = (p) => /^07[789]\d{7}$/.test(p || '');
  const normPhone = (p) => {
    let d = String(p ?? '').replace(/\D/g, '');
    if (!d) return null;
    if (d.startsWith('00962')) d = d.slice(5); else if (d.startsWith('962')) d = d.slice(3);
    if (!d.startsWith('0')) d = '0' + d;
    return d.length >= 9 ? d : null;
  };
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const avColor = (s) => AV_COLORS[hash(s) % AV_COLORS.length];
  const STOP = new Set(['مفروشات', 'معرض', 'شركة', 'مؤسسة', 'مطابخ', 'مطعم', 'عيادة', 'مركز', 'محطة', 'مجوهرات', 'سجاد', 'the', 'al']);
  const initials = (name) => {
    const w = String(name || '?').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    const k = w.filter((x) => !STOP.has(x.toLowerCase()));
    const use = (k.length ? k : w).slice(0, 2);
    return use.map((x) => x[0]).join('').toUpperCase() || '؟';
  };
  const relTime = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'هسا';
    if (m < 60) return `قبل ${m} د`;
    const h = Math.round(m / 60);
    if (h < 24) return `قبل ${h} س`;
    if (h < 48) return 'مبارح';
    return arDate(iso(new Date(t)));
  };
  const cleanService = (s) => String(s || '').replace(/^باقة كامل[ة]?\s*(\([^)]*\))?\s*[–-]\s*/, '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  // ---------- state ----------
  const DEFAULT_STATE = {
    v: 2, meta: {}, custom: [], deleted: {}, activity: [], board: [], boardSeen: 0, chat: [], chatLead: '', settingsU: 0,
    settings: { name: '', agency: '', revenueTarget: 3000, theme: 'auto', aiData: true, waTemplate: DEFAULT_TEMPLATE },
  };
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.v) {
        const st = { ...structuredClone(DEFAULT_STATE), ...s, settings: { ...DEFAULT_STATE.settings, ...(s.settings || {}) } };
        if (s.v < 2) { // ترحيل من النسخة الأولى: علّم كل التعديلات القديمة عشان تنرفع للسيرفر
          const now = Date.now();
          for (const m of Object.values(st.meta)) m.u = m.u || now;
          for (const c of st.custom) c.u = c.u || now;
          st.settingsU = now; st.v = 2;
        }
        delete st.settings.apiKey; delete st.settings.models;
        return st;
      }
    } catch (e) { /* storage blocked or corrupt */ }
    return structuredClone(DEFAULT_STATE);
  }
  let saveWarned = false;
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { if (!saveWarned) { saveWarned = true; toast('المتصفح مش سامح بالحفظ — خذ نسخة احتياطية من الإعدادات'); } }
  }
  function save() { persist(); scheduleSync(); }
  let state = load();

  // ---------- server / auth / sync ----------
  const normBase = (b) => { b = String(b || '').trim().replace(/\/+$/, ''); return b && !/^https?:\/\//i.test(b) ? 'https://' + b : b; };
  let AUTH = { base: normBase(CFG.apiBase), token: '', role: 'admin', user: '' };
  try { AUTH = { ...AUTH, ...JSON.parse(localStorage.getItem(AUTH_KEY) || '{}') }; } catch (e) { /* ignore */ }
  const saveAuth = () => { try { localStorage.setItem(AUTH_KEY, JSON.stringify(AUTH)); } catch (e) { /* ignore */ } };
  if (AUTH.role === 'viewer') { AUTH.token = ''; AUTH.role = 'admin'; } // حساب الـ HR القديم انلغى → دخول من جديد
  const isManager = () => AUTH.role === 'manager';
  let SERVER_STATUS = null;

  async function apiFetch(p, opts = {}) {
    let res;
    try {
      res = await fetch(AUTH.base + p, {
        ...opts,
        signal: opts.signal || AbortSignal.timeout(opts.timeout || 60000),
        headers: { 'Content-Type': 'application/json', ...(AUTH.token ? { Authorization: 'Bearer ' + AUTH.token } : {}), ...(opts.headers || {}) },
      });
    } catch (e) {
      throw new Error(e.name === 'TimeoutError' ? 'السيرفر ما رد (ممكن يكون نايم، جرّب كمان شوي)' : 'ما في اتصال بالسيرفر');
    }
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 && AUTH.token) { logout('انتهت الجلسة، سجّل دخول من جديد'); throw new Error('انتهت الجلسة'); }
    if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
    return j;
  }

  function loadSeedCache() {
    try { const s = JSON.parse(localStorage.getItem(SEED_KEY) || 'null'); if (Array.isArray(s)) { SEED = s; invalidate(); } } catch (e) { /* ignore */ }
  }
  async function loadLeads() {
    const data = await apiFetch('/api/leads', { timeout: 90000 });
    if (!Array.isArray(data)) throw new Error('بيانات العملاء مش صالحة');
    SEED = data; invalidate();
    try { localStorage.setItem(SEED_KEY, JSON.stringify(data)); } catch (e) { /* cache optional */ }
  }

  const SYNC = { timer: 0, busy: false, dirty: false, last: 0, err: '' };
  function syncPayload() {
    const settings = {};
    for (const k of M.SYNC_SETTINGS) settings[k] = state.settings[k];
    return { v: 2, meta: state.meta, custom: state.custom, deleted: state.deleted, activity: state.activity, board: state.board, settings, settingsU: state.settingsU };
  }
  function applyRemote(remote) {
    // ادمج اللي جاي من السيرفر مع النسخة المحلية (عشان أي تعديل صار أثناء الطلب ما يضيع)
    const before = JSON.stringify(syncPayload());
    const m = M.mergeState(syncPayload(), remote);
    state.meta = m.meta; state.custom = m.custom; state.deleted = m.deleted; state.activity = m.activity; state.board = m.board; state.settingsU = m.settingsU;
    for (const k of M.SYNC_SETTINGS) if (m.settings[k] !== undefined) state.settings[k] = m.settings[k];
    invalidate(); persist();
    return before !== JSON.stringify(syncPayload());
  }
  function scheduleSync(ms = 1200) {
    SYNC.dirty = true;
    clearTimeout(SYNC.timer);
    if (AUTH.token) SYNC.timer = setTimeout(syncNow, ms);
  }
  async function syncNow() {
    if (!AUTH.token) return;
    if (SYNC.busy) { SYNC.dirty = true; return; }
    SYNC.busy = true; SYNC.dirty = false; updateSyncUi();
    let fresh = false;
    try {
      const r = await apiFetch('/api/state', { method: 'PUT', body: JSON.stringify({ state: syncPayload() }) });
      const unseen = unseenBoard();
      const changed = applyRemote(r.state);
      SYNC.last = Date.now(); SYNC.err = '';
      if (changed) softRefresh();
      if (unseenBoard() > unseen) { fresh = true; toast('في تعليمات جديدة من المدير', { label: 'اقرأها', fn: () => { location.hash = '#overview'; } }); }
    } catch (e) { SYNC.err = e.message; }
    finally {
      SYNC.busy = false; updateSyncUi();
      if (SYNC.dirty) scheduleSync(4000);
    }
    return fresh; // true = وصلت تعليمات جديدة من المدير (وطلع تنبيهها)
  }
  function syncText() {
    if (!AUTH.token) return 'مش مسجّل دخول';
    if (SYNC.busy) return 'عم يزامن...';
    if (SYNC.err) return 'مش متصل — التعديلات محفوظة على الجهاز';
    return SYNC.last ? `متزامن · ${relTime(SYNC.last)}` : 'لسا ما زامن';
  }
  function updateSyncUi() {
    for (const id of ['sync-status', 'sync-status-2']) { const el = document.getElementById(id); if (el) el.textContent = syncText(); }
    const card = document.querySelector('.side-card');
    if (card) card.classList.toggle('offline', !!SYNC.err);
  }
  function softRefresh() {
    if (!document.getElementById('main').innerHTML) return;
    if (view !== 'assistant' && view !== 'settings') refresh();
    updateBadge();
  }

  // ---------- leads model ----------
  let cache = null;
  const invalidate = () => { cache = null; };
  function score(l) {
    let s = 30;
    if (l.mobile) s += 25; else if (l.phone) s += 8; else s -= 20;
    const r = l.reviews ?? 60; // عدد التقييمات مش معروف → اعتبره متوسط
    s += 18 * (1 - Math.min(r, 300) / 300); // تقييمات قليلة = فرصة باقة كاملة
    s += Math.min(10, Math.log10(r + 1) * 4); // في زباين فعلاً = في ميزانية
    if (l.rating != null && l.rating < 4.3) s += Math.min(16, (4.3 - l.rating) * 12); // فرصة تحسين سمعة
    if (String(l.service || '').includes('سلسلة')) s -= 30;
    if (l.sector === 'مفروشات') s += 8;
    return Math.round(Math.max(0, Math.min(100, s)));
  }
  const heatOf = (s) => (s >= 82 ? 'hot' : s >= 62 ? 'warm' : 'cold');
  const HEAT_LABEL = { hot: 'ساخن', warm: 'دافئ', cold: 'بارد' };
  function leads() {
    if (cache) return cache;
    cache = [...SEED, ...state.custom].map((l) => {
      const m = state.meta[l.id] || {};
      const sc = score(l);
      const notes = m.notes || [];
      return { ...l, status: m.status || 'new', notes, mgrNotes: notes.filter((n) => n.mgr), followUp: m.followUp || '', deal: +m.deal || 0, lastContact: m.lastContact || '', wonAt: m.wonAt || '', score: sc, heat: heatOf(sc) };
    });
    return cache;
  }
  const byId = (id) => leads().find((l) => l.id === id);
  const isCustom = (id) => state.custom.some((c) => c.id === id);
  function log(entry) { state.activity.push({ t: Date.now(), by: AUTH.user || '', ...entry }); if (state.activity.length > 3000) state.activity = state.activity.slice(-3000); }
  function setMeta(id, patch) { state.meta[id] = { ...(state.meta[id] || {}), ...patch, u: Date.now() }; invalidate(); save(); }
  function setStatus(id, status, { silent } = {}) {
    const l = byId(id);
    if (!l || l.status === status) return;
    log({ id, type: 'status', from: l.status, to: status });
    const patch = { status };
    if (status !== 'new') patch.lastContact = today();
    if (status === 'won') patch.wonAt = today();
    setMeta(id, patch);
    if (!silent && status === 'won' && !l.deal) toast('مبروك! حط قيمة الصفقة من صفحة العميل عشان تنحسب بالهدف');
  }
  function contactAttempt(id, type) {
    const l = byId(id);
    if (!l) return;
    log({ id, type });
    if (l.status === 'new') {
      setStatus(id, 'contacted', { silent: true });
      toast(`انحطت حالة "${l.name}" على: تم التواصل`, {
        label: 'تراجع',
        fn: () => {
          const i = state.activity.findLastIndex((a) => a.id === id && a.type === 'status');
          if (i >= 0) state.activity.splice(i, 1);
          setMeta(id, { status: 'new' }); refresh();
        },
      });
    } else { setMeta(id, { lastContact: today() }); }
    refresh();
  }
  // ----- تعليمات المدير -----
  const activeBoard = () => (state.board || []).filter((b) => !b.del && b.text);
  const unseenBoard = () => activeBoard().filter((b) => b.t > (state.boardSeen || 0)).length;
  const mgrFlag = (l) => {
    const n = l.mgrNotes[l.mgrNotes.length - 1];
    return n ? `<span class="mgr-flag" data-tip="${esc(`<span class='tip-eyebrow'>ملاحظة المدير</span>${esc(n.text.slice(0, 140))}`)}">${icon('pin')}</span>` : '';
  };
  function due(L = leads()) { const t = today(); return L.filter((l) => l.followUp && l.followUp <= t && !CLOSED.has(l.status)); }

  function stats(L = leads()) {
    const ym = today().slice(0, 7);
    const s = { total: L.length, furniture: 0, withPhone: 0, mobile: 0, touched: 0, won: 0, wonMonth: 0, revenueMonth: 0, revenueAll: 0, pipelineValue: 0, zarqa: 0, amman: 0 };
    for (const l of L) {
      if (l.sector === 'مفروشات') s.furniture++;
      if (l.phone) s.withPhone++;
      if (l.mobile) s.mobile++;
      if (l.status !== 'new') s.touched++;
      if (l.city === 'عمان') s.amman++; else s.zarqa++;
      if (l.status === 'won') {
        s.won++; s.revenueAll += l.deal;
        if ((l.wonAt || '').startsWith(ym)) { s.wonMonth++; s.revenueMonth += l.deal; }
      }
      if (l.status === 'interested' || l.status === 'proposal') s.pipelineValue += l.deal;
    }
    s.pctPhone = s.total ? Math.round((s.withPhone / s.total) * 100) : 0;
    const weekAgo = Date.now() - 7 * 864e5;
    s.weekTouches = new Set(state.activity.filter((a) => a.t >= weekAgo && a.id && a.type !== 'add').map((a) => a.id)).size;
    s.due = due(L).length;
    return s;
  }
  const countBy = (L, key) => { const m = new Map(); for (const l of L) m.set(l[key], (m.get(l[key]) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const sectors = () => countBy(leads(), 'sector').map(([k]) => k);

  // ---------- theme ----------
  function applyTheme() {
    const t = state.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }

  // ---------- toast / tooltip ----------
  let toastTimer;
  function toast(msg, action) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    if (action) el.querySelector('button').onclick = () => { action.fn(); el.classList.remove('show'); };
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), action ? 6000 : 3200);
  }
  const tipEl = () => $('#tip');
  function showTip(html, x, y) {
    const t = tipEl();
    t.innerHTML = html;
    t.classList.add('show');
    const r = t.getBoundingClientRect();
    let left = x - r.width / 2, top = y - r.height - 12;
    left = Math.max(8, Math.min(window.innerWidth - r.width - 8, left));
    if (top < 8) top = y + 16;
    t.style.left = left + 'px'; t.style.top = top + 'px';
  }
  const hideTip = () => tipEl().classList.remove('show');
  document.addEventListener('mousemove', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (el) showTip(el.getAttribute('data-tip'), e.clientX, e.clientY);
    else if (!e.target.closest('.chart-wrap')) hideTip();
  });

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('انتسخ ✓');
  }
  function download(name, content, type) {
    if (IS_NATIVE) { toast('التنزيل متاح من نسخة الويب على الكمبيوتر — بياناتك متزامنة هناك'); return; }
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- small components ----------
  const avatar = (name, cls = 'avatar') => `<span class="${cls}" style="background:${avColor(name)}">${esc(initials(name))}</span>`;
  const pill = (st) => `<span class="pill s-${st}">${ST[st].label}</span>`;
  const heat = (l) => `<span class="heat ${l.heat}" data-tip="${esc(`<span class='tip-eyebrow'>الأولوية</span><b>${l.score}</b> / 100 · ${HEAT_LABEL[l.heat]}`)}"><i><b style="width:${l.score}%"></b></i><span class="num">${l.score}</span></span>`;
  const stars = (l) => l.rating ? `<span class="stars"><span class="star">★</span> <span class="num">${l.rating}</span>${l.reviews != null ? ` <small class="num">(${fmt(l.reviews)})</small>` : ''}</span>` : '<span class="hint">بدون تقييم</span>';
  const phoneCell = (l) => l.phone ? `<span class="num">${esc(l.phone)}</span>` : '<span class="hint">غير مسجّل</span>';
  function kpi(label, value, ic, chip) {
    return `<section class="card kpi kpi-card span-3"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon">${icon(ic)}</span></div>
      <div class="kpi-value num">${value}</div>${chip}</section>`;
  }
  function header(eyebrow, title, opts = {}) {
    const d = stats().due;
    const themeLbl = { auto: 'تلقائي', dark: 'داكن', light: 'فاتح' }[state.settings.theme] || 'تلقائي';
    return `<header class="header">
      <div class="header-titles"><p class="eyebrow">${eyebrow}</p><h1 class="title">${title}</h1></div>
      ${opts.search === false ? '' : `<label class="search">${icon('search')}<input id="global-search" type="search" placeholder="دوّر على عميل، رقم، أو منطقة..." autocomplete="off"></label>`}
      <button class="icon-btn" data-action="theme" aria-label="تبديل الوضع" data-tip="الوضع: ${themeLbl}">${icon('moon')}</button>
      <button class="icon-btn" data-action="due" aria-label="المتابعات" data-tip="${d ? `${d} متابعة مستحقة` : 'ما في متابعات مستحقة'}">${icon('bell')}${d ? '<span class="dot"></span>' : ''}</button>
      ${isManager() ? `<span class="role-badge" data-tip="حساب المدير: كل الصلاحيات، وملاحظاتك بتبين للكول سنتر">${icon('shield')} مدير</span>` : ''}
      ${opts.actions ?? `<button class="btn btn-primary btn-lg" data-action="add-lead">${icon('plus')}<span class="lbl">إضافة عميل</span></button>`}
    </header>`;
  }
  function bars(items) {
    const max = Math.max(1, ...items.map((i) => i.v));
    return `<div class="bars">${items.map((i) => `
      <div class="bar-row ${i.go ? 'clickable' : ''}" ${i.go ? `data-go="${esc(i.go)}"` : ''} data-tip="${esc(`<span class='tip-eyebrow'>${esc(i.label)}</span><b>${fmt(i.v)}</b> ${i.unit || 'عميل'}${i.extra ? ' · ' + i.extra : ''}`)}">
        <span class="bar-label">${esc(i.label)}</span>
        <div class="bar-track">${i.v ? `<div class="bar-fill" style="width:${((i.v / max) * 100).toFixed(1)}%"></div>` : ''}</div>
        <span class="bar-val">${fmt(i.v)}</span>
      </div>`).join('')}</div>`;
  }

  // ---------- charts ----------
  function monotonePath(p) {
    const n = p.length;
    if (n < 2) return '';
    const dx = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    const r = (v) => Math.round(v * 10) / 10;
    let d = `M${r(p[0][0])},${r(p[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += ` C${r(p[i][0] + h)},${r(p[i][1] + t[i] * h)} ${r(p[i + 1][0] - h)},${r(p[i + 1][1] - t[i + 1] * h)} ${r(p[i + 1][0])},${r(p[i + 1][1])}`;
    }
    return d;
  }
  const niceMax = (v) => { if (v <= 4) return 4; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= v) return k * p; return 10 * p; };
  function activitySeries(days) {
    const counts = new Map();
    for (const a of state.activity) if (a.id && a.type !== 'add') { const k = iso(new Date(a.t)); counts.set(k, (counts.get(k) || 0) + 1); }
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const k = iso(d);
      out.push({ k, label: `${d.getDate()}/${d.getMonth() + 1}`, v: counts.get(k) || 0 });
    }
    return out;
  }
  let areaDays = 30;
  function areaChart() {
    const S = activitySeries(areaDays);
    const W = 860, H = 250, pl = 30, pr = 12, pt = 16, pb = 30;
    const max = niceMax(Math.max(...S.map((d) => d.v)));
    const n = S.length;
    const X = (i) => pl + (W - pl - pr) * (i / (n - 1));
    const Y = (v) => pt + (H - pt - pb) * (1 - v / max);
    const pts = S.map((d, i) => [X(i), Y(d.v)]);
    const line = monotonePath(pts);
    const step = Math.max(1, Math.ceil(n / 8));
    const xl = S.map((d, i) => ((n - 1 - i) % step === 0 ? `<text class="axis-text ${i === n - 1 ? 'strong' : ''}" x="${X(i)}" y="${H - 8}" text-anchor="middle">${i === n - 1 ? 'اليوم' : d.label}</text>` : '')).join('');
    const grid = [0, max / 2, max].map((v) => `<line class="grid-line" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis-text" x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');
    const empty = S.every((d) => !d.v);
    return `<div class="chart-wrap" id="area-chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="نشاط التواصل اليومي آخر ${areaDays} يوم">
        <defs><linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--chart-fill-a)"/><stop offset="1" style="stop-color:var(--chart-fill-b)"/></linearGradient></defs>
        ${grid}
        <path d="${line} L${X(n - 1)},${Y(0)} L${X(0)},${Y(0)} Z" fill="url(#area-grad)"/>
        <path d="${line}" class="area-line"/>
        <line id="area-cross" class="cross" x1="0" x2="0" y1="${pt}" y2="${H - pb}" visibility="hidden"/>
        <circle id="area-dot" class="dot-mark" r="5.5" cx="0" cy="0" visibility="hidden"/>
        ${xl}
        <rect id="area-hit" x="${pl}" y="0" width="${W - pl - pr}" height="${H - pb}" fill="transparent"/>
      </svg>
      ${empty ? '<div class="empty-note"><span>لسا ما في نشاط — غيّر حالة أي عميل أو راسله وبيبين هون</span></div>' : ''}
    </div>`;
    // hover is bound in mountArea()
  }
  function mountArea() {
    const wrap = $('#area-chart');
    if (!wrap) return;
    const S = activitySeries(areaDays);
    const svg = wrap.querySelector('svg');
    const W = 860, H = 250, pl = 30, pr = 12, pt = 16, pb = 30, n = S.length;
    const max = niceMax(Math.max(...S.map((d) => d.v)));
    const X = (i) => pl + (W - pl - pr) * (i / (n - 1));
    const Y = (v) => pt + (H - pt - pb) * (1 - v / max);
    const cross = $('#area-cross', svg), dot = $('#area-dot', svg);
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(n - 1, Math.round(((vx - pl) / (W - pl - pr)) * (n - 1))));
      const d = S[i];
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(d.v)); dot.setAttribute('visibility', 'visible');
      showTip(`<span class="tip-eyebrow">${arDate(d.k)}</span><b class="num">${d.v}</b> عملية تواصل`, r.left + (X(i) / W) * r.width, r.top + (Y(d.v) / H) * r.height);
    };
    const leave = () => { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); hideTip(); };
    svg.addEventListener('mousemove', move);
    svg.addEventListener('mouseleave', leave);
  }
  function gauge(p) {
    p = Math.max(0, Math.min(1, p || 0));
    const cx = 100, cy = 96, r = 76;
    const pt = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
    const arc = (from, to) => { const [x1, y1] = pt(from), [x2, y2] = pt(to); return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)}`; };
    return `<svg viewBox="0 0 200 170" role="img" aria-label="${Math.round(p * 100)}% من الهدف">
      <path d="${arc(150, 390)}" class="gauge-track" stroke-width="16" fill="none" stroke-linecap="round"/>
      ${p > 0.005 ? `<path d="${arc(150, 150 + 240 * p)}" class="gauge-val" stroke-width="16" fill="none" stroke-linecap="round"/>` : ''}
      <text x="100" y="102" text-anchor="middle" class="gauge-pct">${Math.round(p * 100)}%</text>
      <text x="100" y="126" text-anchor="middle" class="gauge-cap">من هدف الشهر</text>
    </svg>`;
  }

  // ---------- views ----------
  const mounts = [];
  const VIEWS = {};

  VIEWS.overview = () => {
    const L = leads(), s = stats(L);
    const name = state.settings.name || 'صديقي';
    const target = +state.settings.revenueTarget || 0;
    const month = MONTHS[new Date().getMonth()];
    const hot = L.filter((l) => l.status === 'new' && l.mobile).sort((a, b) => b.score - a.score).slice(0, 5);
    const acts = state.activity.slice(-6).reverse();
    const funnel = STATUSES.map((st) => ({ label: st.label, v: L.filter((l) => l.status === st.id).length, go: `status=${st.id}` }));
    const sec = countBy(L, 'sector').map(([k, v]) => ({ label: k, v, go: `sector=${encodeURIComponent(k)}` }));
    const board = boardCard();
    mounts.push(mountArea);
    return `
    ${header('نظرة عامة على العملاء', `أهلاً، ${esc(name)}`)}
    <div class="grid">
      ${board}
      ${kpi('إجمالي العملاء', fmt(s.total), 'users', `<span class="chip">${icon('up')} ${fmt(s.furniture)} مفروشات</span>`)}
      ${kpi('معهم رقم', fmt(s.withPhone), 'phone', `<span class="chip">${s.pctPhone}% · ${fmt(s.mobile)} واتساب</span>`)}
      ${kpi('تم التواصل', fmt(s.touched), 'send', s.weekTouches ? `<span class="chip">${icon('up')} ${s.weekTouches} هالأسبوع</span>` : '<span class="chip neutral">لسا ما بلّشت</span>')}
      ${kpi('صفقات مغلقة', fmt(s.won), 'check', `<span class="chip gold">${fmt(s.revenueMonth)} د.أ هالشهر</span>`)}

      <section class="card span-9 r-span-8">
        <div class="card-head"><div><h3>نشاط التواصل</h3><p class="sub">كم مرة تواصلت أو حدّثت عميل كل يوم</p></div><span class="spacer"></span>
          <div class="seg" role="tablist">${[7, 30, 90].map((d) => `<button class="${areaDays === d ? 'on' : ''}" data-action="area-days" data-days="${d}">${d} يوم</button>`).join('')}</div>
        </div>
        ${areaChart()}
      </section>

      <section class="card span-3 r-span-4 gauge">
        <div class="card-head" style="width:100%"><h3>هدف الشهر</h3><span class="spacer"></span><a class="icon-btn" style="width:32px;height:32px;border:0" href="#settings" aria-label="تعديل الهدف" data-tip="عدّل الهدف">${icon('dots')}</a></div>
        ${gauge(target ? s.revenueMonth / target : 0)}
        <div class="gauge-foot"><strong class="num">${fmt(s.revenueMonth)} <small style="font-size:13px">د.أ</small></strong><span class="gauge-cap">محصّل في ${month} من أصل ${fmt(target)} د.أ</span></div>
      </section>

      <section class="card span-5 r-span-12">
        <div class="stack-card">
          <div>
            <div class="card-head" style="margin-bottom:6px"><h3>متابعات اليوم</h3></div>
            <p style="color:var(--ink-2);margin:0 0 16px;line-height:1.8">${s.due ? `عندك <b>${s.due}</b> عميل موعد متابعتهم اليوم أو فات. ابدأ فيهم قبل ما يبردوا.` : 'ما في متابعات مستحقة. حدّد موعد متابعة لأي عميل من صفحته وبيطلعلك هون.'}</p>
            <div class="row-btns">
              <button class="btn btn-primary" data-action="due">${icon('calendar')} افتح المتابعات</button>
              <button class="btn btn-ghost" data-go="heat=hot&status=new">${icon('flame')} الساخنين</button>
            </div>
          </div>
          <div class="stack-art" aria-hidden="true"><i></i><i></i><i></i></div>
        </div>
      </section>

      <section class="card span-4 r-span-6">
        <div class="card-head"><div><h3>ابدأ فيهم</h3><p class="sub">أعلى أولوية وما حدا حكى معهم</p></div></div>
        <div class="list">${hot.length ? hot.map((l) => `
          <div class="list-item clickable" data-open="${l.id}">
            ${avatar(l.name)}
            <div class="li-body"><div class="li-title">${esc(l.name)}</div><div class="li-sub">${esc(l.type || l.sector)} · ${esc(l.city)}</div></div>
            <button class="act wa" data-action="wa" data-id="${l.id}" aria-label="واتساب" data-tip="راسله واتساب">${icon('wa')}</button>
          </div>`).join('') : '<div class="empty">تواصلت مع كل الأولويات 👏</div>'}
        </div>
      </section>

      <section class="card card-dark span-3 r-span-6">
        <span class="avatar-lg">${esc(initials(state.settings.name || 'أنا'))}</span>
        <h3>${esc(state.settings.name || 'حسابك')}</h3>
        <p class="role">${esc(state.settings.agency || 'مبيعات')} · الزرقاء وعمان</p>
        <div class="trio">
          <div><strong class="num">${fmt(s.furniture)}</strong><span>مفروشات</span></div>
          <div><strong class="num">${fmt(s.zarqa)}</strong><span>الزرقاء</span></div>
          <div><strong class="num">${fmt(s.amman)}</strong><span>عمان</span></div>
        </div>
        <div class="ledger"><button class="ledger-card" data-go-view="pipeline"><strong class="num">${fmt(s.pipelineValue)} د.أ</strong><span>قيمة العروض المفتوحة</span></button></div>
      </section>

      <section class="card span-4 r-span-6"><div class="card-head"><div><h3>حسب القطاع</h3><p class="sub">اضغط على أي قطاع لتفتح عملائه</p></div></div>${bars(sec)}</section>
      <section class="card span-4 r-span-6"><div class="card-head"><div><h3>مسار المبيعات</h3><p class="sub">وين واصل كل عميل</p></div></div>${bars(funnel)}</section>
      <section class="card span-4 r-span-12">
        <div class="card-head"><h3>آخر النشاطات</h3></div>
        <div class="list">${acts.length ? acts.map(activityItem).join('') : '<div class="empty">أول ما تغيّر حالة أو تضيف ملاحظة بتطلع هون</div>'}</div>
      </section>
    </div>`;
  };

  // لوحة تعليمات المدير: المدير بيكتب وبيشيل، والكول سنتر بيقرأ
  function boardCard() {
    const mgr = isManager();
    const items = activeBoard().slice().sort((a, b) => b.t - a.t);
    const seen = state.boardSeen || 0;
    if (items.length && items[0].t > seen) { state.boardSeen = items[0].t; persist(); } // فتح اللوحة = قرأ التعليمات
    if (!items.length && !mgr) return '';
    const typing = $('#board-text') ? $('#board-text').value : ''; // ما نمسح اللي عم ينكتب لما توصل مزامنة
    return `<section class="card span-12 board">
      <div class="card-head"><span class="board-icon">${icon('announce')}</span><div><h3>تعليمات المدير</h3><p class="sub">${mgr ? 'اللي بتنشره هون بيبين لكل الكول سنتر أول ما يفتحوا اللوحة' : 'اقرأها قبل ما تبلّش اتصالات'}</p></div></div>
      ${mgr ? `<div class="board-compose">
        <textarea class="textarea" id="board-text" rows="2" placeholder="مثلاً: اليوم ركّزوا على معارض المفروشات بالرصيفة، وعرض الإعلانات عليه خصم 20%">${esc(typing)}</textarea>
        <button class="btn btn-primary" data-action="board-post">${icon('send')} انشر للفريق</button>
      </div>` : ''}
      <div class="board-list">${items.map((b) => `<div class="board-item ${b.t > seen ? 'new' : ''}">
        <div class="board-text">${esc(b.text)}</div>
        <div class="board-meta">${byTag(b.by || 'المدير')}<span class="hint">${relTime(b.t)}</span>${mgr ? `<button class="btn btn-sm btn-ghost" data-action="board-del" data-bid="${esc(b.id)}">${icon('trash')} شيلها</button>` : ''}</div>
      </div>`).join('') || '<div class="empty">لسا ما نشرت تعليمات للفريق</div>'}</div>
    </section>`;
  }

  function activityItem(a) {
    const l = a.id ? byId(a.id) : null;
    const name = l ? l.name : (a.type === 'import' ? 'استيراد ملف' : 'عميل محذوف');
    const desc = {
      status: () => `${ST[a.from]?.label || ''} ← ${ST[a.to]?.label || ''}`,
      note: () => 'أضاف ملاحظة',
      wa: () => 'راسله واتساب',
      call: () => 'اتصل فيه',
      add: () => 'عميل جديد',
      import: () => `انضاف ${a.count || 0} عميل`,
    }[a.type]?.() || '';
    const end = a.type === 'status' && ST[a.to] ? pill(a.to) : `<span class="hint">${relTime(a.t)}</span>`;
    return `<div class="list-item ${l ? 'clickable' : ''}" ${l ? `data-open="${l.id}"` : ''}>
      ${avatar(name)}
      <div class="li-body"><div class="li-title">${esc(name)}</div><div class="li-sub">${desc}${a.type === 'status' ? ' · ' + relTime(a.t) : ''}${a.by ? ' · ' + esc(a.by) : ''}</div></div>
      <div class="li-end">${end}</div></div>`;
  }

  // ----- leads view -----
  const F = { q: '', sector: '', city: '', status: '', heat: '', source: '', wa: false, due: false, sort: 'score', dir: -1, page: 1 };
  const PAGE = 60;
  function filtered() {
    const q = norm(F.q.trim()), qd = F.q.replace(/\D/g, '');
    const t = today();
    let L = leads().filter((l) =>
      (!F.sector || l.sector === F.sector) &&
      (!F.city || l.city === F.city) &&
      (!F.status || l.status === F.status) &&
      (!F.heat || l.heat === F.heat) &&
      (!F.source || l.source === F.source) &&
      (!F.wa || l.mobile) &&
      (!F.due || (l.followUp && l.followUp <= t && !CLOSED.has(l.status))) &&
      (!q || norm([l.name, l.type, l.address, l.service, l.city, l.sector].join(' ')).includes(q) || (qd.length >= 3 && (l.phone || '').includes(qd))));
    const k = F.sort, dir = F.dir;
    const val = (l) => k === 'status' ? ST[l.status].i : k === 'name' || k === 'city' ? norm(l[k]) : (l[k] ?? -1);
    L = [...L].sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
    return L;
  }
  VIEWS.leads = () => {
    const secs = sectors();
    const sel = (key, label, opts) => `<select class="select" data-filter="${key}" aria-label="${label}"><option value="">${label}</option>${opts.map(([v, t]) => `<option value="${esc(v)}" ${F[key] === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    mounts.push(renderLeadsTable);
    return `
    ${header('قاعدة البيانات', 'العملاء المحتملين', {
      search: false,
      actions: `<button class="btn btn-ghost" data-action="import-excel">${icon('upload')} استيراد Excel</button>
        <button class="btn btn-ghost" data-action="export-excel">${icon('download')} تصدير</button>
        <button class="btn btn-primary btn-lg" data-action="add-lead">${icon('plus')}<span class="lbl">إضافة عميل</span></button>`,
    })}
    <section class="card">
      <div class="toolbar" style="margin-bottom:14px">
        <label class="search">${icon('search')}<input id="leads-search" type="search" placeholder="اسم، رقم، شارع، خدمة..." value="${esc(F.q)}" autocomplete="off"></label>
        ${sel('sector', 'كل القطاعات', secs.map((s) => [s, s]))}
        ${sel('city', 'كل المدن', CITIES.map((c) => [c, c]))}
        ${sel('status', 'كل الحالات', STATUSES.map((s) => [s.id, s.label]))}
        ${sel('heat', 'كل الأولويات', [['hot', 'ساخن'], ['warm', 'دافئ'], ['cold', 'بارد']])}
        ${sel('source', 'كل المصادر', countBy(leads(), 'source').map(([s, n]) => [s, `${s || 'غير معروف'} (${n})`]))}
        <label class="toggle"><input type="checkbox" data-filter="wa" ${F.wa ? 'checked' : ''}> واتساب فقط</label>
        <label class="toggle"><input type="checkbox" data-filter="due" ${F.due ? 'checked' : ''}> متابعات مستحقة</label>
        <button class="btn btn-sm btn-ghost" data-action="clear-filters">مسح الفلاتر</button>
      </div>
      <div class="toolbar" style="margin-bottom:6px"><span class="count-note" id="leads-count"></span></div>
      <div class="table-wrap"><table class="t">
        <thead><tr>
          ${[['name', 'العميل'], ['city', 'المدينة'], [null, 'الهاتف'], ['rating', 'التقييم'], ['score', 'الأولوية'], ['status', 'الحالة'], [null, 'الخدمة المقترحة'], [null, 'تواصل']]
            .map(([k, t]) => `<th ${k ? `data-sort="${k}"` : ''} class="${F.sort === k ? 'sorted' : ''}">${t}${F.sort === k ? (F.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}
        </tr></thead>
        <tbody id="leads-body"></tbody>
      </table></div>
      <div class="pager" id="leads-pager"></div>
    </section>`;
  };
  function renderLeadsTable() {
    const body = $('#leads-body');
    if (!body) return;
    const L = filtered();
    const pages = Math.max(1, Math.ceil(L.length / PAGE));
    F.page = Math.min(F.page, pages);
    const rows = L.slice((F.page - 1) * PAGE, F.page * PAGE);
    body.innerHTML = rows.length ? rows.map((l) => `
      <tr data-open="${l.id}">
        <td class="c-name"><div class="cell-name">${avatar(l.name)}<div><b>${esc(l.name)}</b><small>${esc(l.type || l.sector)}</small></div>${mgrFlag(l)}</div></td>
        <td class="c-city">${esc(l.city)}</td>
        <td class="c-phone">${phoneCell(l)}</td>
        <td class="c-rate">${stars(l)}</td>
        <td class="c-score">${heat(l)}</td>
        <td class="c-status"><select class="status-select pill s-${l.status}" data-status-for="${l.id}" aria-label="الحالة">${STATUSES.map((s) => `<option value="${s.id}" ${l.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></td>
        <td class="c-svc"><div class="svc" title="${esc(l.service)}">${esc(cleanService(l.service) || '—')}</div></td>
        <td class="c-acts"><div class="acts">
          <button class="act wa" data-action="wa" data-id="${l.id}" aria-label="واتساب" ${l.mobile ? '' : 'aria-disabled="true"'} data-tip="واتساب">${icon('wa')}</button>
          <a class="act" href="${l.phone ? 'tel:' + l.phone : '#'}" data-action="call" data-id="${l.id}" aria-label="اتصال" ${l.phone ? '' : 'aria-disabled="true"'} data-tip="اتصال">${icon('phone')}</a>
          <a class="act" href="${esc(l.maps || '#')}" target="_blank" rel="noopener" aria-label="الخريطة" ${l.maps ? '' : 'aria-disabled="true"'} data-tip="قوقل ماب">${icon('map')}</a>
        </div></td>
      </tr>`).join('') : `<tr><td colspan="8"><div class="empty">ما في نتائج بهالفلاتر</div></td></tr>`;
    $('#leads-count').textContent = `${fmt(L.length)} عميل من أصل ${fmt(leads().length)}`;
    $('#leads-pager').innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="btn btn-sm ${F.page === i + 1 ? 'btn-primary' : 'btn-ghost'}" data-page="${i + 1}">${i + 1}</button>`).join('') : '';
  }

  // ----- pipeline -----
  const P = { sector: '', city: '', limits: {} };
  VIEWS.pipeline = () => {
    const L = leads().filter((l) => (!P.sector || l.sector === P.sector) && (!P.city || l.city === P.city));
    mounts.push(mountKanban);
    const sel = (key, label, opts) => `<select class="select" data-pfilter="${key}" style="width:auto;border-radius:99px"><option value="">${label}</option>${opts.map((o) => `<option ${P[key] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    return `
    ${header('اسحب البطاقة لتغيّر الحالة', 'مسار المتابعة', { search: false, actions: `${sel('sector', 'كل القطاعات', sectors())}${sel('city', 'كل المدن', CITIES)}<button class="btn btn-primary btn-lg" data-action="add-lead">${icon('plus')}<span class="lbl">إضافة عميل</span></button>` })}
    <div class="kanban">
      ${STATUSES.map((st) => {
        const items = L.filter((l) => l.status === st.id).sort((a, b) => b.score - a.score);
        const lim = P.limits[st.id] || 30;
        const sum = items.reduce((t, l) => t + l.deal, 0);
        return `<div class="col" data-col="${st.id}">
          <div class="col-head">${pill(st.id)}<b class="num">${items.length}</b><small>${sum ? fmt(sum) + ' د.أ' : ''}</small></div>
          <div class="col-body">
            ${items.slice(0, lim).map((l) => `
              <div class="kcard" draggable="true" data-card="${l.id}" data-open="${l.id}">
                <b>${esc(l.name)}</b><small>${esc(l.type || l.sector)} · ${esc(l.city)}</small>
                <div class="row">${heat(l)}${mgrFlag(l)}${l.deal ? `<small class="num">${fmt(l.deal)} د.أ</small>` : l.followUp ? `<small>${icon('calendar')} ${arDate(l.followUp)}</small>` : ''}</div>
              </div>`).join('')}
            ${items.length > lim ? `<button class="more-btn" data-action="more" data-col="${st.id}">+ ${items.length - lim} كمان</button>` : ''}
            ${!items.length ? '<div class="empty">فاضي</div>' : ''}
          </div></div>`;
      }).join('')}
    </div>`;
  };
  function mountKanban() {
    let dragId = null;
    $$('.kcard').forEach((c) => {
      c.addEventListener('dragstart', (e) => { dragId = c.dataset.card; c.classList.add('dragging'); e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
    });
    $$('.col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drop'); });
      col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop'); });
      col.addEventListener('drop', (e) => {
        e.preventDefault(); col.classList.remove('drop');
        const id = e.dataTransfer.getData('text/plain') || dragId;
        if (id) { setStatus(id, col.dataset.col); render(); }
      });
    });
  }

  // ----- inventory -----
  const I = { sector: '', city: '', status: '', onlyMobile: true };
  VIEWS.inventory = () => {
    const L = leads();
    const secs = sectors();
    const withRating = L.filter((l) => l.rating);
    const avg = withRating.length ? (withRating.reduce((t, l) => t + l.rating, 0) / withRating.length).toFixed(2) : '—';
    const mini = (label, v) => `<div class="mini"><span>${label}</span><strong class="num">${v}</strong></div>`;
    const maxCell = Math.max(1, ...secs.flatMap((sc) => STATUSES.map((st) => L.filter((l) => l.sector === sc && l.status === st.id).length)));
    const shade = (v, max) => v ? `background:color-mix(in srgb, var(--chart) ${Math.round(8 + (v / max) * 40)}%, transparent)` : '';
    const matrix = `<table class="mx"><thead><tr><th class="rowh">القطاع</th>${STATUSES.map((s) => `<th>${s.label}</th>`).join('')}<th>المجموع</th></tr></thead><tbody>
      ${secs.map((sc) => {
        const row = L.filter((l) => l.sector === sc);
        return `<tr><th class="rowh">${esc(sc)}</th>${STATUSES.map((st) => { const v = row.filter((l) => l.status === st.id).length; return `<td class="${v ? '' : 'zero'}" style="${shade(v, maxCell)}" ${v ? `data-go="sector=${encodeURIComponent(sc)}&status=${st.id}"` : ''}>${v || '·'}</td>`; }).join('')}<td class="tot" data-go="sector=${encodeURIComponent(sc)}">${row.length}</td></tr>`;
      }).join('')}
      <tr class="tot"><th class="rowh">المجموع</th>${STATUSES.map((st) => `<td data-go="status=${st.id}">${L.filter((l) => l.status === st.id).length}</td>`).join('')}<td>${L.length}</td></tr>
    </tbody></table>`;
    const cityMax = Math.max(1, ...secs.flatMap((sc) => CITIES.map((c) => L.filter((l) => l.sector === sc && l.city === c).length)));
    const cityTable = `<table class="mx"><thead><tr><th class="rowh">القطاع</th>${CITIES.map((c) => `<th>${c}</th>`).join('')}<th>بدون رقم</th></tr></thead><tbody>
      ${secs.map((sc) => {
        const row = L.filter((l) => l.sector === sc);
        return `<tr><th class="rowh">${esc(sc)}</th>${CITIES.map((c) => { const v = row.filter((l) => l.city === c).length; return `<td class="${v ? '' : 'zero'}" style="${shade(v, cityMax)}" ${v ? `data-go="sector=${encodeURIComponent(sc)}&city=${encodeURIComponent(c)}"` : ''}>${v || '·'}</td>`; }).join('')}<td class="${row.filter((l) => !l.phone).length ? '' : 'zero'}">${row.filter((l) => !l.phone).length || '·'}</td></tr>`;
      }).join('')}</tbody></table>`;
    const svc = SERVICE_KEYS.map(([label, re]) => ({ label, v: L.filter((l) => re.test(l.service || '')).length, unit: 'عميل محتاجها' })).sort((a, b) => b.v - a.v);
    const ratingBins = [['أقل من 3.5', (r) => r < 3.5], ['3.5 لـ 3.9', (r) => r >= 3.5 && r < 4], ['4.0 لـ 4.4', (r) => r >= 4 && r < 4.5], ['4.5 لـ 4.7', (r) => r >= 4.5 && r < 4.8], ['4.8 فأكثر', (r) => r >= 4.8]]
      .map(([label, fn]) => ({ label, v: withRating.filter((l) => fn(l.rating)).length }));
    mounts.push(renderPhones);
    const sel = (key, label, opts) => `<select class="select" data-ifilter="${key}" style="width:auto;border-radius:99px"><option value="">${label}</option>${opts.map(([v, t]) => `<option value="${esc(v)}" ${I[key] === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    return `
    ${header('كل الأرقام بمكان واحد', 'الجرد', { search: false, actions: `<button class="btn btn-primary btn-lg" data-action="export-excel">${icon('download')} تصدير Excel كامل</button>` })}
    <section class="card"><div class="mini-stats">
      ${mini('إجمالي العملاء', fmt(L.length))}
      ${mini('موبايل / واتساب', fmt(L.filter((l) => l.mobile).length))}
      ${mini('أرضي فقط', fmt(L.filter((l) => l.phone && !l.mobile).length))}
      ${mini('بدون رقم', fmt(L.filter((l) => !l.phone).length))}
      ${mini('متوسط التقييم', avg)}
      ${mini('مجموع التقييمات', fmt(L.reduce((t, l) => t + (l.reviews || 0), 0)))}
      ${mini('تقييمات قليلة (أقل من 30)', fmt(L.filter((l) => l.reviews != null && l.reviews < 30).length))}
      ${mini('تقييم ضعيف (أقل من 4)', fmt(L.filter((l) => l.rating && l.rating < 4).length))}
    </div></section>
    <div class="grid">
      <section class="card span-12"><div class="card-head"><div><h3>جرد القطاعات × الحالات</h3><p class="sub">اضغط أي رقم بيفتحلك العملاء</p></div></div><div class="table-wrap">${matrix}</div></section>
      <section class="card span-7 r-span-12"><div class="card-head"><div><h3>التوزيع حسب المدينة</h3><p class="sub">كم عميل بكل مدينة لكل قطاع</p></div></div><div class="table-wrap">${cityTable}</div></section>
      <section class="card span-5 r-span-12"><div class="card-head"><div><h3>الخدمات المطلوبة</h3><p class="sub">حسب الخدمة المقترحة لكل عميل</p></div></div>${bars(svc)}</section>
      <section class="card span-5 r-span-12"><div class="card-head"><div><h3>توزيع التقييمات</h3><p class="sub">على قوقل ماب</p></div></div>${bars(ratingBins)}</section>
      <section class="card span-7 r-span-12">
        <div class="card-head"><div><h3>دليل الأرقام</h3><p class="sub">للنسخ أو لقوائم البث على واتساب</p></div></div>
        <div class="toolbar" style="margin-bottom:12px">
          ${sel('sector', 'كل القطاعات', secs.map((s) => [s, s]))}
          ${sel('city', 'كل المدن', CITIES.map((c) => [c, c]))}
          ${sel('status', 'كل الحالات', STATUSES.map((s) => [s.id, s.label]))}
          <label class="toggle"><input type="checkbox" data-ifilter="onlyMobile" ${I.onlyMobile ? 'checked' : ''}> موبايل فقط</label>
        </div>
        <div class="phones" id="phones"></div>
        <div class="row-btns" style="margin-top:12px">
          <button class="btn btn-primary btn-sm" data-action="copy-phones">${icon('copy')} انسخ الأرقام</button>
          <button class="btn btn-ghost btn-sm" data-action="copy-phones-names">${icon('copy')} انسخ مع الأسماء</button>
          <button class="btn btn-ghost btn-sm" data-action="csv-phones">${icon('download')} CSV</button>
          <span class="count-note" id="phones-count"></span>
        </div>
      </section>
    </div>`;
  };
  const phoneList = () => leads().filter((l) => l.phone && (!I.onlyMobile || l.mobile) && (!I.sector || l.sector === I.sector) && (!I.city || l.city === I.city) && (!I.status || l.status === I.status));
  function renderPhones() {
    const el = $('#phones');
    if (!el) return;
    const L = phoneList();
    el.textContent = L.map((l) => `${l.phone}   ${l.name}`).join('\n') || '—';
    $('#phones-count').textContent = `${L.length} رقم`;
  }

  // ----- assistant -----
  const QUICK = [
    'عميل قالي "السعر غالي"، شو أرد عليه؟',
    'اكتبلي رسالة واتساب أولى لمعرض مفروشات تقييماته قليلة',
    'مين أحسن 10 عملاء مفروشات أبدأ فيهم هالأسبوع وليش؟',
    'عميل شاف الرسالة وما رد من 3 أيام، كيف أتابعه؟',
    'كيف أسعّر باقة سوشال + إعلانات لمعرض بالزرقاء؟',
    'اعملي خطة أسبوع: كم رسالة باليوم وكيف أوزعهم؟',
  ];
  let chatBusy = false;
  VIEWS.assistant = () => {
    const opts = leads().slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    mounts.push(() => { renderChat(); const ta = $('#chat-input'); if (ta && pendingPrompt) { ta.value = pendingPrompt; pendingPrompt = ''; ta.focus(); } });
    return `
    ${header('Gemini', 'المساعد الذكي', { search: false, actions: `<button class="btn btn-ghost" data-action="clear-chat">${icon('trash')} محادثة جديدة</button>` })}
    <div class="chat-layout">
      <section class="card chat">
        <div class="chat-head"><span class="ai-badge">${icon('sparkles')}</span><div><h3>مساعد المبيعات</h3><small id="chat-model">احكيلي عن أي مشكلة واجهتك وبعطيك الحل</small></div></div>
        <div class="chat-log" id="chat-log"></div>
        <form class="composer" id="composer">
          <textarea id="chat-input" class="textarea" rows="1" placeholder="اكتب مشكلتك أو سؤالك... (Enter للإرسال)"></textarea>
          <button class="btn btn-primary btn-lg" type="submit" id="chat-send">${icon('send')} إرسال</button>
        </form>
      </section>
      <aside class="stack">
        <section class="card">
          <div class="card-head"><h3>عن عميل معيّن؟</h3></div>
          <select class="select" id="chat-lead"><option value="">بدون — سؤال عام</option>${opts.map((l) => `<option value="${l.id}" ${state.chatLead === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
          <label class="toggle" style="margin-top:12px"><input type="checkbox" id="chat-data" ${state.settings.aiData ? 'checked' : ''}> خليه يشوف بيانات كل العملاء</label>
          <p class="hint" style="margin:6px 0 0">بيبعت ملخص وقائمة العملاء لـ Gemini عشان يجاوب بأرقام حقيقية.</p>
        </section>
        <section class="card">
          <div class="card-head"><h3>أسئلة جاهزة</h3></div>
          <div class="quick-prompts">${QUICK.map((q) => `<button class="qp" data-qp="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        </section>
      </aside>
    </div>`;
  };
  let pendingPrompt = '';
  function md(src) {
    let html = '', list = null;
    const close = () => { if (list) { html += `</${list}>`; list = null; } };
    const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
    for (const raw of esc(src).split('\n')) {
      const line = raw.trimEnd();
      let m;
      if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = line.match(/^\s*(\d+)[.)]\s+(.*)/))) { if (list !== 'ol') { close(); html += `<ol start="${m[1]}">`; list = 'ol'; } html += `<li>${inline(m[2])}</li>`; continue; }
      close();
      if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { html += '<hr>'; continue; }
      if ((m = line.match(/^#{1,4}\s+(.*)/))) { html += `<h4>${inline(m[1])}</h4>`; continue; }
      if (line.trim()) html += `<p>${inline(line)}</p>`;
    }
    close();
    return html;
  }
  function renderChat() {
    const log = $('#chat-log');
    if (!log) return;
    if (!state.chat.length && !chatBusy) {
      log.innerHTML = `<div class="chat-welcome"><span class="ai-badge">${icon('sparkles')}</span><h3>شو المشكلة اللي واجهتك؟</h3><p>اسألني عن رد على اعتراض، رسالة واتساب، تسعير، أولويات العملاء، أو أي إشي علق معك.</p></div>`;
      return;
    }
    log.innerHTML = state.chat.map((m, i) => m.role === 'user'
      ? `<div class="msg user">${esc(m.text)}</div>`
      : m.role === 'error'
        ? `<div class="msg error">${esc(m.text)}</div>`
        : `<div class="msg model">${md(m.text)}<div class="msg-meta"><button data-action="copy-msg" data-i="${i}">نسخ</button><span>${esc(m.model || '')}</span></div></div>`).join('')
      + (chatBusy ? '<div class="typing"><i></i><i></i><i></i></div>' : '');
    log.scrollTop = log.scrollHeight;
  }
  async function askGemini(contents, system) {
    if (!AUTH.token) throw new Error('سجّل دخول أول');
    const r = await apiFetch('/api/ai', { method: 'POST', timeout: 180000, body: JSON.stringify({ system, contents }) });
    if (!r.text) throw new Error(r.error || 'ما في رد');
    return r;
  }
  function leadLine(l) {
    return [l.name, l.sector, l.type, l.city, l.phone || '-', l.rating ?? '-', l.reviews ?? '-', ST[l.status].label, l.score, cleanService(l.service) || '-', l.followUp || '-', l.deal || '-'].join(' | ');
  }
  function systemPrompt(lead) {
    const L = leads(), s = stats(L);
    const name = state.settings.name || 'صاحب اللوحة';
    let p = `أنت "مساعد المبيعات" داخل لوحة تحكم لإدارة العملاء المحتملين لوكالة تسويق رقمي في الأردن (الزرقاء، الرصيفة، عمان). اسم المستخدم: ${name}${state.settings.agency ? '، الوكالة: ' + state.settings.agency : ''}.
الوكالة بتبيع: إدارة سوشال ميديا وتصميم، تصوير وفيديوهات وريلز (منها فيديوهات AI)، إعلانات ممولة، مواقع وكتالوجات ومتاجر إلكترونية، أنظمة حجز وكاشير ومواعيد، وتحسين السمعة والتقييمات على قوقل.
مهمتك: لما يحكيلك عن أي مشكلة واجهها (عميل ما رد، اعتراض على السعر، تسعير، كتابة رسالة، خطة متابعة، ترتيب أولويات، أو مشكلة تقنية) اعطيه حل عملي مباشر بخطوات واضحة.
قواعد:
- احكي باللهجة الأردنية، مختصر ومرتب بنقاط، بدون مقدمات طويلة.
- لما يطلب رسالة، اكتبها جاهزة للنسخ على واتساب، قصيرة وودية ومش رسمية زيادة.
- الأسعار بالدينار الأردني ومنطقية لسوق الأردن.
- اعتمد على بيانات العملاء المرفقة لما تفيد، ولا تخترع عملاء أو أرقام مش موجودة.
- "الأولوية" رقم من 100 محسوب من: وجود واتساب، قلة التقييمات (فرصة باقة كاملة)، التقييم الضعيف (فرصة تحسين سمعة)، وقطاع المفروشات.
تاريخ اليوم: ${today()}.

## ملخص الأرقام
- إجمالي العملاء: ${s.total} (معهم رقم ${s.withPhone}، واتساب ${s.mobile})
- حسب القطاع: ${countBy(L, 'sector').map(([k, v]) => `${k} ${v}`).join('، ')}
- حسب المدينة: ${countBy(L, 'city').map(([k, v]) => `${k} ${v}`).join('، ')}
- حسب الحالة: ${STATUSES.map((st) => `${st.label} ${L.filter((l) => l.status === st.id).length}`).join('، ')}
- صفقات مغلقة: ${s.won} بقيمة ${s.revenueAll} د.أ (هالشهر ${s.revenueMonth} من هدف ${state.settings.revenueTarget} د.أ)
- متابعات مستحقة اليوم: ${s.due}`;
    if (state.settings.aiData) {
      p += `\n\n## قائمة العملاء\nالاسم | القطاع | النوع | المدينة | الهاتف | التقييم | عدد التقييمات | الحالة | الأولوية | الخدمة المقترحة | موعد المتابعة | قيمة الصفقة\n${L.map(leadLine).join('\n')}`;
    }
    if (lead) {
      p += `\n\n## العميل اللي بنحكي عنه هلأ\n${leadLine(lead)}\nالعنوان: ${lead.address || '-'}\nالدوام: ${lead.hours || '-'}\nالملاحظات: ${lead.notes.map((n) => (n.mgr ? '(ملاحظة المدير) ' : '') + n.text).join(' / ') || 'ما في'}`;
    }
    return p;
  }
  async function sendChat(text) {
    text = text.trim();
    if (!text || chatBusy) return;
    state.chat.push({ role: 'user', text, t: Date.now() });
    chatBusy = true; persist(); renderChat();
    const btn = $('#chat-send'); if (btn) btn.disabled = true;
    const lead = state.chatLead ? byId(state.chatLead) : null;
    const contents = [];
    for (const m of state.chat.filter((x) => x.role === 'user' || x.role === 'model').slice(-20)) {
      const last = contents[contents.length - 1];
      if (last && last.role === m.role) last.parts[0].text += '\n\n' + m.text;
      else contents.push({ role: m.role, parts: [{ text: m.text }] });
    }
    try {
      const r = await askGemini(contents, systemPrompt(lead));
      state.chat.push({ role: 'model', text: r.text, model: r.model, t: Date.now() });
    } catch (e) {
      state.chat.push({ role: 'error', text: 'ما قدرت أوصل لـ Gemini: ' + e.message, t: Date.now() });
    }
    if (state.chat.length > 60) state.chat = state.chat.slice(-60);
    chatBusy = false; persist(); renderChat();
    const b2 = $('#chat-send'); if (b2) b2.disabled = false;
  }

  // ----- report (تقرير الإدارة) -----
  const R = { period: 'month', by: '', logAll: false };
  const PERIODS = [['today', 'اليوم'], ['week', 'آخر 7 أيام'], ['month', 'هالشهر'], ['all', 'كل الوقت']];
  const ACT_LABEL = { call: 'اتصال', wa: 'واتساب', note: 'ملاحظة', status: 'تغيير حالة' };
  const CONTACT_TYPES = new Set(['call', 'wa', 'note', 'status']);
  function periodStart(p) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (p === 'today') return d.getTime();
    if (p === 'week') { d.setDate(d.getDate() - 6); return d.getTime(); }
    if (p === 'month') { d.setDate(1); return d.getTime(); }
    return 0;
  }
  const byTag = (name) => name ? `<span class="by"><i style="background:${avColor(name)}">${esc(initials(name))}</i>${esc(name)}</span>` : '<span class="hint">—</span>';
  const fmtTime = (t) => { const d = new Date(t); return `${arDate(iso(d))} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const actDesc = (a) => a.type === 'status' ? `${ST[a.from]?.label || ''} ← ${ST[a.to]?.label || ''}` : ACT_LABEL[a.type] || a.type;

  function reportData() {
    const L = leads();
    const idx = new Map(L.map((l) => [l.id, l]));
    const t0 = periodStart(R.period);
    const isTouch = (a) => a.type !== 'status' || a.to !== 'new';
    const inPeriod = state.activity.filter((a) => a.t >= t0 && a.id && idx.has(a.id) && CONTACT_TYPES.has(a.type));
    const acts = inPeriod.filter((a) => !R.by || (a.by || '') === R.by);
    const touched = new Set(acts.filter(isTouch).map((a) => a.id));
    // آخر مرة انحطت الحالة "تم الإغلاق" لكل عميل
    const wonAct = new Map();
    for (const a of state.activity) if (a.type === 'status' && a.to === 'won') wonAct.set(a.id, a);
    const wonLeads = L.filter((l) => l.status === 'won');
    const won = wonLeads.map((l) => {
      const a = wonAct.get(l.id);
      return { l, t: a ? a.t : (l.wonAt ? new Date(l.wonAt + 'T12:00').getTime() : 0), by: a ? a.by || '' : '' };
    }).filter((w) => w.t >= t0 && (!R.by || w.by === R.by)).sort((x, y) => y.t - x.t);
    // أداء كل شخص بالفترة
    const people = new Map();
    const P = (name) => {
      if (!people.has(name)) people.set(name, { name, call: 0, wa: 0, note: 0, status: 0, touched: new Set(), won: 0, revenue: 0 });
      return people.get(name);
    };
    for (const a of inPeriod) { const p = P(a.by || ''); p[a.type]++; if (isTouch(a)) p.touched.add(a.id); }
    for (const l of wonLeads) {
      const a = wonAct.get(l.id);
      if (a && a.t >= t0) { const p = P(a.by || ''); p.won++; p.revenue += l.deal; }
    }
    const allTouched = new Set(state.activity.filter((a) => a.id && CONTACT_TYPES.has(a.type) && isTouch(a)).map((a) => a.id));
    const t = today();
    const toCall = L.filter((l) => !CLOSED.has(l.status) && ((l.followUp && l.followUp <= t) || l.status === 'noanswer'))
      .sort((a, b) => ((a.followUp || '9') < (b.followUp || '9') ? -1 : 1));
    const open = L.filter((l) => l.status === 'interested' || l.status === 'proposal').sort((a, b) => b.deal - a.deal);
    return {
      L, idx, acts, touched, won, toCall, open,
      people: [...people.values()].sort((a, b) => b.won - a.won || b.touched.size - a.touched.size),
      calls: acts.filter((a) => a.type === 'call').length,
      was: acts.filter((a) => a.type === 'wa').length,
      revenue: won.reduce((s, w) => s + w.l.deal, 0),
      allTouched: allTouched.size, allWon: wonLeads.length,
      conversion: allTouched.size ? Math.round((wonLeads.length / allTouched.size) * 100) : 0,
      names: [...new Set(state.activity.map((a) => a.by || '').filter(Boolean))].sort(),
    };
  }

  VIEWS.report = () => {
    const D = reportData();
    const periodLbl = PERIODS.find((p) => p[0] === R.period)[1];
    const log = D.acts.slice().sort((a, b) => b.t - a.t);
    const shownLog = R.logAll ? log : log.slice(0, 40);
    mounts.push(mountArea);
    const row = (l, cells) => `<tr data-open="${l.id}">${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    const nameCell = (l) => `<div class="cell-name" style="min-width:180px">${avatar(l.name)}<div><b>${esc(l.name)}</b><small>${esc(l.type || l.sector)} · ${esc(l.city)}</small></div></div>`;
    const empty = (cols, msg) => `<tr><td colspan="${cols}"><div class="empty">${msg}</div></td></tr>`;
    const team = D.people.map((p) => `<tr>
        <td>${p.name ? byTag(p.name) : '<span class="hint">بدون اسم</span>'}</td>
        <td class="strong num">${p.touched.size}</td><td class="num">${p.call}</td><td class="num">${p.wa}</td>
        <td class="num">${p.note}</td><td class="num">${p.status}</td>
        <td class="strong num">${p.won}</td><td class="strong num">${fmt(p.revenue)} د.أ</td></tr>`).join('');
    return `
    ${header(`تقرير ${periodLbl}`, 'تقرير الإدارة', { search: false, actions: `<button class="btn btn-ghost" data-action="report-export">${icon('download')} تصدير التقرير</button>` })}
    <section class="card"><div class="report-filters">
      <div class="seg">${PERIODS.map(([k, t]) => `<button class="${R.period === k ? 'on' : ''}" data-action="report-period" data-p="${k}">${t}</button>`).join('')}</div>
      <select class="select" data-rfilter="by" aria-label="الموظف"><option value="">كل الفريق</option>${D.names.map((n) => `<option ${R.by === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <span class="count-note">${R.by ? `تقرير ${esc(R.by)}` : 'كل الفريق'} · ${periodLbl}</span>
    </div></section>
    <div class="grid">
      ${kpi('تواصلنا معهم', fmt(D.touched.size), 'users', `<span class="chip">${fmt(D.acts.length)} عملية</span>`)}
      ${kpi('اتصالات', fmt(D.calls), 'phone', `<span class="chip slate">${fmt(D.was)} واتساب</span>`)}
      ${kpi('صفقات مغلقة', fmt(D.won.length), 'check', `<span class="chip gold">${fmt(D.revenue)} د.أ</span>`)}
      ${kpi('نسبة التحويل', D.conversion + '%', 'up', `<span class="chip neutral">${fmt(D.allWon)} من ${fmt(D.allTouched)} · كل الوقت</span>`)}

      <section class="card span-12">
        <div class="card-head"><div><h3>أداء الفريق</h3><p class="sub">${periodLbl} — مين اتصل، مين راسل، ومين سكّر صفقات</p></div></div>
        <div class="rt-wrap"><table class="rt wide">
          <thead><tr><th>الموظف</th><th>تواصل مع</th><th>اتصالات</th><th>واتساب</th><th>ملاحظات</th><th>تغيير حالات</th><th>صفقات</th><th>الإيرادات</th></tr></thead>
          <tbody>${team || empty(8, 'ما في نشاط بهالفترة')}</tbody>
        </table></div>
      </section>

      <section class="card span-6 r-span-12">
        <div class="card-head"><div><h3>صفقات مغلقة</h3><p class="sub">${fmt(D.won.length)} صفقة · ${fmt(D.revenue)} د.أ</p></div></div>
        <div class="rt-wrap"><table class="rt">
          <thead><tr><th>العميل</th><th>القيمة</th><th>التاريخ</th><th>سكّرها</th></tr></thead>
          <tbody>${D.won.map((w) => row(w.l, [nameCell(w.l), w.l.deal ? `<b class="num">${fmt(w.l.deal)} د.أ</b>` : '<span class="hint">بدون قيمة</span>', w.t ? arDate(iso(new Date(w.t))) : '—', byTag(w.by)])).join('') || empty(4, 'ما في صفقات مغلقة بهالفترة')}</tbody>
        </table></div>
      </section>

      <section class="card span-6 r-span-12">
        <div class="card-head"><div><h3>لازم نتصل فيهم</h3><p class="sub">متابعات مستحقة + اللي ما ردوا (${fmt(D.toCall.length)})</p></div></div>
        <div class="rt-wrap"><table class="rt">
          <thead><tr><th>العميل</th><th>الهاتف</th><th>السبب</th><th>آخر تواصل</th></tr></thead>
          <tbody>${D.toCall.slice(0, 60).map((l) => row(l, [nameCell(l), phoneCell(l), l.followUp && l.followUp <= today() ? `<span class="pill s-proposal">متابعة ${arDate(l.followUp)}</span>` : pill('noanswer'), arDate(l.lastContact)])).join('') || empty(4, 'ما في حدا مستني اتصال 👏')}</tbody>
        </table></div>
      </section>

      <section class="card span-12">
        <div class="card-head"><div><h3>سجل التواصل</h3><p class="sub">${fmt(log.length)} عملية · ${periodLbl}</p></div></div>
        <div class="rt-wrap"><table class="rt wide">
          <thead><tr><th>الوقت</th><th>العميل</th><th>شو صار</th><th>مين</th><th>الحالة هلأ</th></tr></thead>
          <tbody>${shownLog.map((a) => { const l = D.idx.get(a.id); return row(l, [`<span class="num">${fmtTime(a.t)}</span>`, nameCell(l), actDesc(a), byTag(a.by), pill(l.status)]); }).join('') || empty(5, 'ما في تواصل بهالفترة')}</tbody>
        </table></div>
        ${log.length > shownLog.length ? `<div class="pager"><button class="btn btn-ghost btn-sm" data-action="report-more">اعرض الكل (${fmt(log.length)})</button></div>` : ''}
      </section>

      <section class="card span-8 r-span-12">
        <div class="card-head"><div><h3>بالمتابعة</h3><p class="sub">مهتمين وعروض سعر مفتوحة (${fmt(D.open.length)})</p></div></div>
        <div class="rt-wrap"><table class="rt wide">
          <thead><tr><th>العميل</th><th>الحالة</th><th>القيمة المتوقعة</th><th>موعد المتابعة</th><th>آخر تواصل</th></tr></thead>
          <tbody>${D.open.map((l) => row(l, [nameCell(l), pill(l.status), l.deal ? `<b class="num">${fmt(l.deal)} د.أ</b>` : '—', arDate(l.followUp), arDate(l.lastContact)])).join('') || empty(5, 'ما في عروض مفتوحة')}</tbody>
        </table></div>
      </section>

      <section class="card span-4 r-span-12"><div class="card-head"><div><h3>مسار المبيعات</h3><p class="sub">كل العملاء حسب الحالة</p></div></div>
        ${bars(STATUSES.map((st) => ({ label: st.label, v: D.L.filter((l) => l.status === st.id).length })))}
      </section>

      <section class="card span-12">
        <div class="card-head"><div><h3>النشاط اليومي</h3><p class="sub">كل الفريق</p></div><span class="spacer"></span>
          <div class="seg">${[7, 30, 90].map((d) => `<button class="${areaDays === d ? 'on' : ''}" data-action="area-days" data-days="${d}">${d} يوم</button>`).join('')}</div></div>
        ${areaChart()}
      </section>
    </div>`;
  };

  function exportReport() {
    const D = reportData();
    if (!window.XLSX) { toast('مكتبة Excel ما حمّلت — تأكد من الإنترنت'); return; }
    const wb = XLSX.utils.book_new();
    const add = (name, rows, widths) => {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '-': 'ما في بيانات' }]);
      ws['!cols'] = widths.map((w) => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add('الفريق', D.people.map((p) => ({ 'الموظف': p.name || 'بدون اسم', 'تواصل مع': p.touched.size, 'اتصالات': p.call, 'واتساب': p.wa, 'ملاحظات': p.note, 'تغيير حالات': p.status, 'صفقات': p.won, 'الإيرادات (د.أ)': p.revenue })), [16, 10, 10, 10, 10, 12, 8, 14]);
    add('الصفقات', D.won.map((w) => ({ 'العميل': w.l.name, 'القطاع': w.l.sector, 'المدينة': w.l.city, 'الهاتف': w.l.phone || '', 'القيمة (د.أ)': w.l.deal, 'التاريخ': w.t ? iso(new Date(w.t)) : '', 'سكّرها': w.by })), [34, 14, 10, 13, 12, 12, 14]);
    add('سجل التواصل', D.acts.slice().sort((a, b) => b.t - a.t).map((a) => {
      const l = D.idx.get(a.id);
      return { 'الوقت': new Date(a.t).toLocaleString('en-GB'), 'العميل': l.name, 'الهاتف': l.phone || '', 'شو صار': actDesc(a), 'مين': a.by || '', 'الحالة هلأ': ST[l.status].label };
    }), [20, 34, 13, 20, 14, 12]);
    add('لازم نتصل', D.toCall.map((l) => ({ 'العميل': l.name, 'الهاتف': l.phone || '', 'السبب': l.status === 'noanswer' ? 'ما رد' : 'متابعة ' + l.followUp, 'آخر تواصل': l.lastContact })), [34, 13, 18, 12]);
    add('بالمتابعة', D.open.map((l) => ({ 'العميل': l.name, 'الحالة': ST[l.status].label, 'القيمة المتوقعة': l.deal, 'موعد المتابعة': l.followUp, 'آخر تواصل': l.lastContact })), [34, 12, 14, 13, 12]);
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.writeFile(wb, `report-${R.period}-${today()}.xlsx`);
    toast('انصدّر التقرير ✓');
  }

  // ----- settings -----
  VIEWS.settings = () => {
    const st = state.settings;
    const ss = SERVER_STATUS;
    if (!ss) apiFetch('/api/status').then((r) => { SERVER_STATUS = r; if (view === 'settings') render(); }).catch(() => {});
    const info = (k, v) => `<div class="info"><span>${k}</span><b>${v}</b></div>`;
    return `
    ${header('تخصيص اللوحة', 'الإعدادات', { search: false, actions: '' })}
    <div class="settings-grid">
      <section class="card stack">
        <div class="card-head"><h3>حسابك</h3></div>
        <div class="form-grid">
          <div class="field"><label>اسمك على هالجهاز (للتقارير)</label><input class="input" data-auth-user value="${esc(AUTH.user)}" placeholder="مثلاً: عمر"></div>
          <div class="field"><label>اسم صاحب اللوحة</label><input class="input" data-setting="name" value="${esc(st.name)}" placeholder="بيظهر بالترحيب والرسائل"></div>
          <div class="field"><label>اسم الوكالة / البراند</label><input class="input" data-setting="agency" value="${esc(st.agency)}"></div>
          <div class="field"><label>هدف الشهر (د.أ)</label><input class="input num" type="number" min="0" data-setting="revenueTarget" value="${esc(st.revenueTarget)}"></div>
          <div class="field"><label>الوضع</label><select class="select" data-setting="theme">${[['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(([v, t]) => `<option value="${v}" ${st.theme === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        </div>
      </section>
      <section class="card stack">
        <div class="card-head"><h3>السيرفر والمزامنة</h3></div>
        <div class="info-grid">
          ${info('الحساب', isManager() ? 'مدير' : 'كول سنتر')}
          ${info('السيرفر', `<span class="ltr">${esc(AUTH.base || location.host)}</span>`)}
          ${info('المزامنة', `<span id="sync-status-2">${esc(syncText())}</span>`)}
          ${info('Gemini', ss ? (ss.ai ? 'شغّال ✓' : 'مش مفعّل على السيرفر') : '...')}
          ${info('التخزين', ss ? (ss.storage === 'postgres' ? 'قاعدة بيانات دائمة' : 'ملف على السيرفر + نسخة بكل جهاز') : '...')}
        </div>
        <div class="row-btns">
          <button class="btn btn-soft" data-action="sync-now">زامن هسا</button>
          <button class="btn btn-ghost" data-action="test-ai">${icon('sparkles')} جرّب Gemini</button>
          <button class="btn btn-ghost" data-action="logout">تسجيل خروج</button>
        </div>
        <span class="hint" id="ai-test"></span>
      </section>
      <section class="card stack">
        <div class="card-head"><div><h3>رسالة واتساب الجاهزة</h3><p class="sub">بتنفتح لما تضغط زر واتساب. المتغيرات: {اسمي} {الوكالة} {العميل} {الخدمة}</p></div></div>
        <textarea class="textarea" rows="6" data-setting="waTemplate">${esc(st.waTemplate)}</textarea>
        <div class="row-btns"><button class="btn btn-ghost btn-sm" data-action="reset-template">رجّع الافتراضي</button></div>
      </section>
      <section class="card stack">
        <div class="card-head"><h3>البيانات</h3></div>
        <div class="row-btns">
          <button class="btn btn-primary" data-action="export-excel">${icon('download')} تصدير Excel</button>
          <button class="btn btn-ghost" data-action="import-excel">${icon('upload')} استيراد Excel (نفس شكل ملف الليدز)</button>
        </div>
        <div class="row-btns">
          <button class="btn btn-soft" data-action="backup">${icon('download')} نسخة احتياطية</button>
          <button class="btn btn-ghost" data-action="restore">${icon('upload')} استرجاع نسخة</button>
          <button class="btn btn-danger" data-action="reset">${icon('trash')} احذف النسخة المحلية ونزّل من السيرفر</button>
        </div>
        <p class="hint">العملاء الأساسيين جايين من السيرفر. الحالات والملاحظات والعملاء الجدد بتنحفظ على جهازك وبتتزامن مع السيرفر تلقائياً.</p>
      </section>
    </div>`;
  };

  // ---------- drawer ----------
  let drawerId = null;
  const aiDrafts = {};
  function openLead(id) {
    drawerId = id;
    renderDrawer();
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#drawer-backdrop').hidden = false;
  }
  function closeDrawer() {
    drawerId = null;
    $('#drawer').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
    $('#drawer-backdrop').hidden = true;
  }
  function renderDrawer() {
    const l = drawerId && byId(drawerId);
    if (!l) { closeDrawer(); return; }
    const info = (k, v, wide) => `<div class="info ${wide ? 'wide' : ''}"><span>${k}</span><b>${v}</b></div>`;
    const draft = aiDrafts[l.id];
    const mgr = isManager();
    const typing = $('#note-text') ? $('#note-text').value : ''; // ما نمسح ملاحظة نص كتابة لما توصل مزامنة
    $('#drawer').innerHTML = `
      <div class="drawer-head">
        ${avatar(l.name)}
        <div style="flex:1;min-width:0"><h2>${esc(l.name)}</h2><p>${esc(l.type || l.sector)} · ${esc(l.city)} · ${esc(l.source || '')}</p></div>
        <button class="icon-btn" data-action="close-drawer" aria-label="إغلاق">${icon('x')}</button>
      </div>
      <div class="drawer-body">
        ${l.mgrNotes.length ? `<div class="mgr-box" role="note">
          <h4>${icon('pin')} ملاحظة المدير</h4>
          ${l.mgrNotes.slice().reverse().map((n) => `<div class="mgr-note">${esc(n.text)}<small>${esc(n.by || 'المدير')} · ${relTime(n.t)}</small></div>`).join('')}
        </div>` : ''}
        <div class="quick">
          <button class="btn btn-primary" data-action="wa" data-id="${l.id}" ${l.mobile ? '' : 'disabled'}>${icon('wa')} واتساب</button>
          ${l.phone ? `<a class="btn btn-ghost" href="tel:${l.phone}" data-action="call" data-id="${l.id}">${icon('phone')} اتصال</a>
          <button class="btn btn-ghost" data-action="copy" data-text="${esc(l.phone)}">${icon('copy')} نسخ الرقم</button>` : ''}
          ${l.maps ? `<a class="btn btn-ghost" href="${esc(l.maps)}" target="_blank" rel="noopener">${icon('map')} الخريطة</a>` : ''}
        </div>
        <div class="drawer-section"><h4>الحالة</h4><div class="status-grid">${STATUSES.map((s) => `<button class="${l.status === s.id ? 'on' : ''}" data-action="set-status" data-id="${l.id}" data-status="${s.id}">${s.label}</button>`).join('')}</div></div>
        <div class="info-grid">
          ${info('الهاتف', phoneCell(l))}
          ${info('التقييم', stars(l))}
          ${info('الأولوية', heat(l))}
          ${info('الدوام', esc(l.hours || '—'))}
          ${info('آخر تواصل', arDate(l.lastContact))}
          ${info('انضاف', arDate(l.added))}
          ${info('العنوان', esc(l.address || '—'), true)}
          ${info('الخدمة المقترحة', esc(l.service || '—'), true)}
        </div>
        <div class="form-grid">
          <div class="field"><label>موعد المتابعة</label><input class="input" type="date" data-meta="followUp" data-id="${l.id}" value="${esc(l.followUp)}"></div>
          <div class="field"><label>قيمة الصفقة (د.أ)</label><input class="input num" type="number" min="0" step="10" data-meta="deal" data-id="${l.id}" value="${l.deal || ''}" placeholder="0"></div>
        </div>
        <div class="drawer-section">
          <h4>المساعد الذكي</h4>
          <div class="quick">
            <button class="btn btn-soft" data-action="ai-draft" data-id="${l.id}">${icon('sparkles')} اكتبلي رسالة أولى</button>
            <button class="btn btn-ghost" data-action="ask-about" data-id="${l.id}">اسأل عن هالعميل</button>
          </div>
          ${draft ? `<div class="ai-box" style="margin-top:10px">${draft === '…' ? 'لحظة، عم بكتب...' : esc(draft)}</div>
            ${draft !== '…' ? `<div class="quick" style="margin-top:8px"><button class="btn btn-sm btn-ghost" data-action="copy" data-text="${esc(draft)}">${icon('copy')} نسخ</button>${l.mobile ? `<button class="btn btn-sm btn-primary" data-action="wa-draft" data-id="${l.id}">${icon('wa')} ابعتها واتساب</button>` : ''}</div>` : ''}` : ''}
        </div>
        <div class="drawer-section">
          <h4>${mgr ? 'ملاحظة للكول سنتر' : 'الملاحظات'}</h4>
          <textarea class="textarea" id="note-text" placeholder="${mgr ? 'شو لازم يعرف الموظف قبل ما يتصل؟ (بتبين مميّزة لكل الفريق)' : 'شو صار بالمكالمة؟ شو طلب؟'}"></textarea>
          <div class="quick" style="margin-top:8px"><button class="btn btn-sm btn-primary" data-action="add-note" data-id="${l.id}">${mgr ? `${icon('pin')} ثبّت ملاحظة للفريق` : 'إضافة ملاحظة'}</button></div>
          <div class="notes">${l.notes.filter((n) => !n.mgr).reverse().map((n) => `<div class="note">${esc(n.text)}<small>${relTime(n.t)}${n.by ? ' · ' + esc(n.by) : ''}</small></div>`).join('')}</div>
        </div>
        ${isCustom(l.id) ? `<button class="btn btn-danger btn-sm" data-action="delete-lead" data-id="${l.id}" style="align-self:flex-start">${icon('trash')} حذف العميل</button>` : ''}
      </div>`;
    if (typing) $('#note-text').value = typing;
  }
  function waText(l, override) {
    if (override) return override;
    const st = state.settings;
    const me = st.name || st.agency, ag = st.agency || 'فريق التسويق';
    return String(st.waTemplate || DEFAULT_TEMPLATE).split('\n')
      .filter((line) => !(line.includes('{اسمي}') && !me))
      .join('\n')
      .replaceAll('{اسمي}', me).replaceAll('{الوكالة}', ag)
      .replaceAll('{العميل}', l.name).replaceAll('{الخدمة}', cleanService(l.service) || 'تسويق رقمي');
  }
  function openWa(id, text) {
    const l = byId(id);
    if (!l || !l.mobile) return;
    const url = `https://wa.me/${intl(l.phone)}?text=${encodeURIComponent(waText(l, text))}`;
    if (IS_NATIVE) window.location.href = url; // التطبيق بيفتحها بواتساب مباشرة
    else window.open(url, '_blank', 'noopener');
    contactAttempt(id, 'wa');
  }

  // ---------- modal ----------
  function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; const f = m.querySelector('input'); if (f) f.focus(); }
  const closeModal = () => { $('#modal').hidden = true; $('#modal').innerHTML = ''; };
  function addLeadModal() {
    const secs = [...new Set([...sectors(), 'مفروشات'])];
    openModal(`<h2>إضافة عميل</h2>
      <form id="add-form" class="form-grid">
        <div class="field wide"><label>الاسم *</label><input class="input" name="name" required></div>
        <div class="field"><label>القطاع</label><select class="select" name="sector">${secs.map((s) => `<option>${esc(s)}</option>`).join('')}<option>أخرى</option></select></div>
        <div class="field"><label>النوع</label><input class="input" name="type" placeholder="معرض مفروشات، مطابخ..."></div>
        <div class="field"><label>المدينة</label><select class="select" name="city">${CITIES.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>الهاتف</label><input class="input ltr" name="phone" placeholder="07XXXXXXXX"></div>
        <div class="field"><label>التقييم</label><input class="input num" name="rating" type="number" step="0.1" min="0" max="5"></div>
        <div class="field"><label>عدد التقييمات</label><input class="input num" name="reviews" type="number" min="0"></div>
        <div class="field wide"><label>العنوان</label><input class="input" name="address"></div>
        <div class="field wide"><label>رابط قوقل ماب</label><input class="input ltr" name="maps" type="url"></div>
        <div class="field wide"><label>الخدمة المقترحة</label><input class="input" name="service" placeholder="فيديوهات AI + إعلانات"></div>
      </form>
      <div class="modal-foot"><button class="btn btn-ghost" data-action="close-modal">إلغاء</button><button class="btn btn-primary" data-action="save-lead">حفظ</button></div>`);
  }
  function saveLeadFromModal() {
    const f = $('#add-form');
    if (!f.reportValidity()) return;
    const d = Object.fromEntries(new FormData(f).entries());
    const phone = normPhone(d.phone);
    if (phone && leads().some((l) => l.phone === phone)) { toast('هالرقم موجود عندك من قبل'); return; }
    const lead = {
      id: 'c' + Date.now().toString(36), name: d.name.trim(), sector: d.sector, type: d.type.trim() || null, city: d.city,
      phone, mobile: isMobile(phone), rating: d.rating ? +d.rating : null, reviews: d.reviews ? +d.reviews : 0,
      address: d.address.trim() || null, hours: null, service: d.service.trim() || null, maps: d.maps.trim() || null, source: 'يدوي', added: today(), u: Date.now(),
    };
    state.custom.push(lead);
    log({ id: lead.id, type: 'add' });
    invalidate(); save(); closeModal(); render();
    toast('انضاف العميل ✓');
  }

  // ---------- excel / backup ----------
  function exportExcel() {
    if (IS_NATIVE) { download(); return; }
    const L = leads();
    const rows = L.map((l, i) => ({
      '#': i + 1, 'الاسم': l.name, 'القطاع': l.sector, 'النوع': l.type || '', 'المدينة': l.city, 'رقم الهاتف': l.phone || 'غير مسجّل',
      'واتساب': l.mobile ? 'https://wa.me/' + intl(l.phone) : '', 'التقييم': l.rating ?? '', 'عدد التقييمات': l.reviews ?? '', 'العنوان': l.address || '',
      'الدوام': l.hours || '', 'الخدمة المقترحة': l.service || '', 'رابط قوقل ماب': l.maps || '', 'الحالة': ST[l.status].label, 'الأولوية': l.score,
      'موعد المتابعة': l.followUp, 'قيمة الصفقة': l.deal || '', 'آخر تواصل': l.lastContact, 'ملاحظات': l.notes.map((n) => (n.mgr ? '[المدير] ' : '') + n.text).join(' | '), 'المصدر': l.source || '',
    }));
    const name = `leads-${today()}`;
    if (!window.XLSX) {
      const head = Object.keys(rows[0]);
      const csv = [head, ...rows.map((r) => head.map((h) => r[h]))].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      download(name + '.csv', '﻿' + csv, 'text/csv;charset=utf-8');
      toast('مكتبة Excel ما حمّلت (إنترنت؟) — نزّلته CSV');
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [4, 34, 14, 18, 10, 13, 10, 7, 10, 34, 16, 34, 16, 11, 8, 12, 10, 11, 40, 12].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'العملاء');
    const secs = sectors();
    const sum = [['القطاع', ...STATUSES.map((s) => s.label), 'المجموع', 'معهم رقم']].concat(
      secs.map((sc) => { const r = L.filter((l) => l.sector === sc); return [sc, ...STATUSES.map((s) => r.filter((l) => l.status === s.id).length), r.length, r.filter((l) => l.phone).length]; }),
      [['المجموع', ...STATUSES.map((s) => L.filter((l) => l.status === s.id).length), L.length, L.filter((l) => l.phone).length]]);
    const ws2 = XLSX.utils.aoa_to_sheet(sum);
    ws2['!cols'] = [{ wch: 18 }, ...STATUSES.map(() => ({ wch: 11 })), { wch: 9 }, { wch: 9 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'الجرد');
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.writeFile(wb, name + '.xlsx');
    toast('انصدّر الملف ✓');
  }
  function pickFile(accept, cb) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => inp.files[0] && cb(inp.files[0]);
    inp.click();
  }
  function sectorFromSheet(name, typ) {
    const n = name || '', t = typ || '';
    if (/مفروشات|سجاد|مطابخ|ستائر|أثاث|اثاث/.test(n + t)) return 'مفروشات';
    if (/غسيل/.test(n + t)) return 'غسيل سيارات';
    if (/صالون/.test(n + t)) return 'صالونات';
    if (/ذهب|مجوهرات/.test(t)) return 'ذهب ومجوهرات';
    if (/عيادة|طبي|أسنان/.test(t)) return 'عيادات';
    if (/بلياردو|بلايستيشن|ألعاب|VR/.test(t)) return 'ألعاب وترفيه';
    if (/مطعم|كافيه|مطبخ|لاونج/.test(t)) return 'مطاعم وكافيهات';
    return n.replace(/\s*[–-].*$/, '').trim() || 'أخرى';
  }
  function importExcel(file) {
    if (!window.XLSX) { toast('مكتبة Excel ما حمّلت — تأكد من الإنترنت'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: 'array' });
        const L = leads();
        const phones = new Set(L.map((l) => l.phone).filter(Boolean));
        const names = new Set(L.map((l) => norm(l.name).replace(/\s+/g, '')));
        let added = 0, skipped = 0, statusUpdated = 0;
        const labelToStatus = Object.fromEntries(STATUSES.map((s) => [s.label, s.id]));
        for (const sn of wb.SheetNames) {
          const ws = wb.Sheets[sn];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
          const hi = rows.findIndex((r) => r && r.includes('الاسم'));
          if (hi < 0) continue;
          const H = rows[hi].map((h) => String(h || '').trim());
          const col = (k) => H.indexOf(k);
          const cMaps = col('رابط قوقل ماب');
          for (let ri = hi + 1; ri < rows.length; ri++) {
            const r = rows[ri];
            const name = r?.[col('الاسم')];
            if (!name) continue;
            const phone = normPhone(r[col('رقم الهاتف')]);
            const nk = norm(name).replace(/\s+/g, '');
            const existing = L.find((l) => (phone && l.phone === phone) || norm(l.name).replace(/\s+/g, '') === nk);
            const stLabel = col('الحالة') >= 0 ? r[col('الحالة')] : null;
            if (existing || phones.has(phone) || names.has(nk)) {
              // ملف مصدّر من اللوحة: رجّع الحالة لو تغيّرت
              if (existing && stLabel && labelToStatus[stLabel] && labelToStatus[stLabel] !== existing.status) { setMeta(existing.id, { status: labelToStatus[stLabel] }); statusUpdated++; }
              skipped++; continue;
            }
            let maps = null;
            if (cMaps >= 0) {
              const cell = ws[XLSX.utils.encode_cell({ r: ri, c: cMaps })];
              maps = cell?.l?.Target || (/^https?:/.test(String(cell?.v || '')) ? cell.v : null);
            }
            const typ = r[col('النوع')] || null;
            const addr = r[col('العنوان')] || null;
            const cityRaw = col('المدينة') >= 0 ? r[col('المدينة')] : null;
            const city = CITIES.includes(cityRaw) ? cityRaw : /Russeifa|الرصيفة/.test(String(addr)) ? 'الرصيفة' : /عمان|عمّان|Amman/.test(sn + typ + addr) ? 'عمان' : 'الزرقاء';
            const lead = {
              id: 'i' + hash(name + phone + sn).toString(36) + ri, name: String(name).trim(),
              sector: (col('القطاع') >= 0 && r[col('القطاع')]) || sectorFromSheet(sn, typ), type: typ, city, phone, mobile: isMobile(phone),
              rating: typeof r[col('التقييم')] === 'number' ? r[col('التقييم')] : null,
              reviews: typeof r[col('عدد التقييمات')] === 'number' ? r[col('عدد التقييمات')] : 0,
              address: addr, hours: r[col('الدوام')] && r[col('الدوام')] !== '—' ? r[col('الدوام')] : null,
              service: r[col('الخدمة المقترحة')] || null, maps, source: 'استيراد: ' + file.name, added: today(), u: Date.now(),
            };
            state.custom.push(lead);
            if (stLabel && labelToStatus[stLabel]) state.meta[lead.id] = { status: labelToStatus[stLabel], u: Date.now() };
            phones.add(phone); names.add(nk); added++;
          }
        }
        if (added) log({ type: 'import', count: added });
        invalidate(); save(); render();
        toast(`انضاف ${added} عميل جديد · ${skipped} مكرر${statusUpdated ? ` · ${statusUpdated} حالة تحدّثت` : ''}`);
      } catch (e) { toast('ما قدرت أقرأ الملف: ' + e.message); }
    };
    reader.readAsArrayBuffer(file);
  }
  function backup() { download(`leads-backup-${today()}.json`, JSON.stringify(state, null, 1), 'application/json'); toast('نزلت النسخة الاحتياطية ✓'); }
  function restore(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const s = JSON.parse(reader.result);
        if (!s || !s.v || typeof s.meta !== 'object') throw new Error('مش ملف نسخة احتياطية');
        applyRemote(s); // دمج النسخة الاحتياطية مع الموجود
        if (Array.isArray(s.chat) && !state.chat.length) state.chat = s.chat;
        save(); render();
        toast('رجعت البيانات ✓');
      } catch (e) { toast('الملف مش صالح: ' + e.message); }
    };
    reader.readAsText(file);
  }

  // ---------- render / router ----------
  let view = 'overview';
  function render() {
    mounts.length = 0;
    hideTip();
    $('#main').innerHTML = (VIEWS[view] || VIEWS.overview)();
    $$('#nav a, .nav-settings').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    updateBadge();
    updateSyncUi();
    mounts.forEach((fn) => fn());
    if (drawerId) renderDrawer();
  }
  function updateBadge() {
    const d = stats().due;
    const b = $('#badge-due'); b.hidden = !d; b.textContent = d;
    const u = unseenBoard();
    const nb = $('#badge-board'); nb.hidden = !u; nb.textContent = u;
  }
  function refresh() {
    if (view === 'leads' && $('#leads-body')) { renderLeadsTable(); if (drawerId) renderDrawer(); }
    else render();
  }
  function route() {
    if (!AUTH.token) return;
    const v = (location.hash || '#overview').slice(1).split('?')[0];
    view = VIEWS[v] ? v : 'overview';
    render();
    window.scrollTo(0, 0);
  }
  function goLeads(params) {
    Object.assign(F, { q: '', sector: '', city: '', status: '', heat: '', source: '', wa: false, due: false, page: 1 });
    for (const [k, v] of params) F[k] = v === 'true' ? true : v;
    if (location.hash === '#leads') render(); else location.hash = '#leads';
  }

  // ---------- events ----------
  document.addEventListener('click', (e) => {
    const t = e.target;
    const actEl = t.closest('[data-action]');
    if (actEl && !actEl.disabled && actEl.getAttribute('aria-disabled') !== 'true') {
      const a = actEl.dataset.action, id = actEl.dataset.id;
      switch (a) {
        case 'wa': e.preventDefault(); e.stopPropagation(); openWa(id); return;
        case 'call': e.stopPropagation(); contactAttempt(id, 'call'); return; // href=tel: يكمل طبيعي
        case 'copy': copy(actEl.dataset.text || ''); return;
        case 'set-status': setStatus(id, actEl.dataset.status); refresh(); return;
        case 'close-drawer': closeDrawer(); return;
        case 'add-note': {
          const txt = $('#note-text').value.trim();
          if (!txt) return;
          $('#note-text').value = '';
          const l = byId(id);
          const note = { t: Date.now(), text: txt, by: AUTH.user || (isManager() ? 'المدير' : '') };
          if (isManager()) note.mgr = true; // بتبين مميّزة لكل الكول سنتر (والسيرفر بيوقّعها)
          setMeta(id, { notes: [...l.notes, note], lastContact: today() });
          log({ id, type: 'note' }); save(); refresh();
          if (note.mgr) toast('انثبتت الملاحظة للفريق ✓');
          return;
        }
        case 'board-post': {
          const ta = $('#board-text');
          const txt = ta ? ta.value.trim() : '';
          if (!isManager() || !txt) return;
          const now = Date.now();
          state.board.push({ id: 'b' + now.toString(36) + Math.random().toString(36).slice(2, 6), t: now, u: now, text: txt, by: AUTH.user || 'المدير' });
          ta.value = '';
          save(); render(); toast('انتشرت التعليمات لكل الفريق ✓'); return;
        }
        case 'board-del': {
          const b = state.board.find((x) => x.id === actEl.dataset.bid);
          if (!isManager() || !b || !confirm('أكيد بدك تشيل هالتعليمات عن كل الفريق؟')) return;
          Object.assign(b, { del: true, text: '', u: Date.now() }); delete b.sig;
          save(); render(); return;
        }
        case 'delete-lead':
          if (!confirm('أكيد بدك تحذف هالعميل؟')) return;
          state.custom = state.custom.filter((c) => c.id !== id); delete state.meta[id];
          state.deleted[id] = Date.now();
          invalidate(); save(); closeDrawer(); render(); return;
        case 'ai-draft': aiDraft(id); return;
        case 'wa-draft': openWa(id, aiDrafts[id]); return;
        case 'ask-about':
          state.chatLead = id; save(); closeDrawer();
          pendingPrompt = 'عندي هالعميل، شو أحسن طريقة أبدأ معه وشو أعرض عليه بالضبط؟';
          location.hash = '#assistant'; return;
        case 'add-lead': addLeadModal(); return;
        case 'save-lead': saveLeadFromModal(); return;
        case 'close-modal': closeModal(); return;
        case 'theme': {
          const order = ['auto', 'dark', 'light'];
          state.settings.theme = order[(order.indexOf(state.settings.theme) + 1) % 3];
          save(); applyTheme(); render(); toast('الوضع: ' + { auto: 'تلقائي', dark: 'داكن', light: 'فاتح' }[state.settings.theme]); return;
        }
        case 'due': goLeads([['due', 'true']]); return;
        case 'area-days': areaDays = +actEl.dataset.days; render(); return;
        case 'report-period': R.period = actEl.dataset.p; R.logAll = false; render(); return;
        case 'report-more': R.logAll = true; render(); return;
        case 'report-export': if (IS_NATIVE) { download(); return; } exportReport(); return;
        case 'clear-filters': goLeads([]); return;
        case 'more': P.limits[actEl.dataset.col] = (P.limits[actEl.dataset.col] || 30) + 60; render(); return;
        case 'export-excel': exportExcel(); return;
        case 'import-excel': pickFile('.xlsx,.xls,.csv', importExcel); return;
        case 'backup': backup(); return;
        case 'restore': pickFile('.json,application/json', restore); return;
        case 'reset':
          if (!confirm('بنمسح النسخة اللي على هالجهاز وبننزّل نسخة السيرفر بدالها. أي تعديل ما تزامن بيروح. متأكد؟')) return;
          apiFetch('/api/state').then((r) => {
            const m = r.state || M.emptyState();
            state.meta = m.meta || {}; state.custom = m.custom || []; state.deleted = m.deleted || {}; state.activity = m.activity || []; state.board = m.board || [];
            state.settingsU = m.settingsU || 0;
            for (const k of M.SYNC_SETTINGS) if (m.settings && m.settings[k] !== undefined) state.settings[k] = m.settings[k];
            invalidate(); persist(); render(); toast('نزلت نسخة السيرفر ✓');
          }).catch((e) => toast(e.message));
          return;
        case 'sync-now': syncNow().then((fresh) => { if (!fresh) toast(SYNC.err ? SYNC.err : 'تمت المزامنة ✓'); }); return;
        case 'logout': if (confirm('بدك تسجّل خروج؟ بياناتك بتضل محفوظة على الجهاز.')) logout(); return;
        case 'reset-template': state.settings.waTemplate = DEFAULT_TEMPLATE; state.settingsU = Date.now(); save(); render(); return;
        case 'test-ai': testAi(); return;
        case 'clear-chat': state.chat = []; persist(); renderChat(); return;
        case 'copy-msg': copy(state.chat[+actEl.dataset.i]?.text || ''); return;
        case 'copy-phones': copy(phoneList().map((l) => l.phone).join('\n')); return;
        case 'copy-phones-names': copy(phoneList().map((l) => `${l.name} - ${l.phone}`).join('\n')); return;
        case 'csv-phones': download(`phones-${today()}.csv`, '﻿' + ['الاسم,الرقم,واتساب,القطاع,المدينة', ...phoneList().map((l) => `"${l.name.replace(/"/g, '""')}",${l.phone},${l.mobile ? intl(l.phone) : ''},${l.sector},${l.city}`)].join('\n'), 'text/csv;charset=utf-8'); return;
      }
    }
    const sortEl = t.closest('th[data-sort]');
    if (sortEl) { const k = sortEl.dataset.sort; F.dir = F.sort === k ? -F.dir : (k === 'name' || k === 'city' || k === 'status' ? 1 : -1); F.sort = k; render(); return; }
    const pg = t.closest('[data-page]');
    if (pg) { F.page = +pg.dataset.page; renderLeadsTable(); $('.table-wrap')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    const go = t.closest('[data-go]');
    if (go) { goLeads(new URLSearchParams(go.dataset.go)); return; }
    const gv = t.closest('[data-go-view]');
    if (gv) { location.hash = '#' + gv.dataset.goView; return; }
    const qp = t.closest('[data-qp]');
    if (qp) { sendChat(qp.dataset.qp); return; }
    if (t.closest('select, a, input, textarea, button')) return;
    const op = t.closest('[data-open]');
    if (op) openLead(op.dataset.open);
    if (t.id === 'drawer-backdrop') closeDrawer();
    if (t.id === 'modal') closeModal();
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.rfilter) { R[t.dataset.rfilter] = t.value; render(); return; }
    if (t.dataset.statusFor) { setStatus(t.dataset.statusFor, t.value); refresh(); return; }
    if (t.dataset.filter) { F[t.dataset.filter] = t.type === 'checkbox' ? t.checked : t.value; F.page = 1; renderLeadsTable(); return; }
    if (t.dataset.pfilter) { P[t.dataset.pfilter] = t.value; render(); return; }
    if (t.dataset.ifilter) { I[t.dataset.ifilter] = t.type === 'checkbox' ? t.checked : t.value; renderPhones(); return; }
    if (t.dataset.meta) {
      const v = t.dataset.meta === 'deal' ? Math.max(0, +t.value || 0) : t.value;
      setMeta(t.dataset.id, { [t.dataset.meta]: v });
      toast(t.dataset.meta === 'deal' ? 'انحفظت القيمة ✓' : v ? `المتابعة يوم ${arDate(v)} ✓` : 'انشال موعد المتابعة');
      if (view !== 'leads') render(); else renderLeadsTable();
      return;
    }
    if (t.dataset.setting) {
      const k = t.dataset.setting;
      state.settings[k] = k === 'revenueTarget' ? Math.max(0, +t.value || 0) : t.value;
      if (M.SYNC_SETTINGS.includes(k)) state.settingsU = Date.now();
      save();
      if (k === 'theme') applyTheme();
      toast('انحفظ ✓');
      return;
    }
    if (t.hasAttribute('data-auth-user')) { AUTH.user = t.value.trim(); saveAuth(); toast('انحفظ ✓ — العمليات الجاية بتنسجل باسمك'); return; }
    if (t.id === 'chat-lead') { state.chatLead = t.value; save(); return; }
    if (t.id === 'chat-data') { state.settings.aiData = t.checked; save(); return; }
  });

  let searchTimer;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'leads-search') { clearTimeout(searchTimer); searchTimer = setTimeout(() => { F.q = t.value; F.page = 1; renderLeadsTable(); }, 150); }
    if (t.id === 'chat-input') { t.style.height = 'auto'; t.style.height = Math.min(160, t.scrollHeight) + 'px'; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else if (drawerId) closeDrawer(); }
    if (e.target.id === 'global-search' && e.key === 'Enter') goLeads([['q', e.target.value]]);
    if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); const v = e.target.value; e.target.value = ''; sendChat(v); }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'composer') { e.preventDefault(); const ta = $('#chat-input'); const v = ta.value; ta.value = ''; sendChat(v); }
  });

  async function aiDraft(id) {
    const l = byId(id);
    aiDrafts[id] = '…'; renderDrawer();
    try {
      const prompt = `اكتب رسالة واتساب أولى (3-5 أسطر) لهالعميل باللهجة الأردنية، ودية ومش رسمية، بتلفت انتباهه لفرصة محددة من بياناته (التقييمات/الخدمة المقترحة) وبتنتهي بسؤال بسيط. ${state.settings.name ? 'المرسل: ' + state.settings.name : ''}${state.settings.agency ? ' من ' + state.settings.agency : ''}. اكتب الرسالة بس بدون أي شرح.`;
      const r = await askGemini([{ role: 'user', parts: [{ text: prompt }] }], systemPrompt(l));
      aiDrafts[id] = r.text;
    } catch (e) { aiDrafts[id] = null; toast('Gemini: ' + e.message); }
    if (drawerId === id) renderDrawer();
  }
  async function testAi() {
    const el = $('#ai-test');
    el.textContent = 'عم بجرب...';
    try { const r = await askGemini([{ role: 'user', parts: [{ text: 'رد بكلمة وحدة: تمام' }] }], 'رد باختصار.'); el.textContent = `شغّال ✓ (${r.model}): ${r.text.slice(0, 40)}`; }
    catch (e) { el.textContent = '✗ ' + e.message; }
  }

  // ---------- login ----------
  function showLogin(msg) {
    closeDrawer();
    $('.app').hidden = true;
    const box = $('#login');
    box.hidden = false;
    const showServer = IS_NATIVE || !!AUTH.base;
    $('#server-field').hidden = !showServer;
    $('#login-server').value = AUTH.base || normBase(CFG.apiBase) || '';
    $('#login-user').value = AUTH.user || state.settings.name || '';
    $('#login-msg').textContent = msg || '';
    setTimeout(() => $('#login-pass').focus(), 50);
  }
  function showApp() {
    $('#login').hidden = true;
    $('.app').hidden = false;
  }
  function logout(msg) {
    AUTH.token = ''; saveAuth();
    clearTimeout(SYNC.timer);
    showLogin(msg);
  }
  async function doLogin(e) {
    e.preventDefault();
    const btn = $('#login-btn'), msg = $('#login-msg');
    const base = $('#server-field').hidden ? AUTH.base : normBase($('#login-server').value);
    const password = $('#login-pass').value;
    btn.disabled = true;
    msg.textContent = 'عم بتصل...';
    const slow = setTimeout(() => { msg.textContent = 'السيرفر عم يصحى (أول مرة ممكن ياخذ دقيقة)...'; }, 6000);
    try {
      const res = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }), signal: AbortSignal.timeout(90000) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      const user = $('#login-user').value.trim() || (j.role === 'manager' ? 'المدير' : state.settings.name || '');
      AUTH = { base, token: j.token, role: j.role || 'admin', user }; saveAuth();
      $('#login-pass').value = '';
      msg.textContent = 'عم بنزّل العملاء...';
      await loadLeads();
      showApp(); route();
      syncNow();
    } catch (err) {
      msg.textContent = err.name === 'TimeoutError' ? 'السيرفر ما رد، جرّب كمان مرة' : err.message === 'Failed to fetch' ? 'ما قدرت أوصل للسيرفر — تأكد من العنوان والنت' : err.message;
    } finally { clearTimeout(slow); btn.disabled = false; }
  }

  // ---------- boot ----------
  $$('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
  window.addEventListener('hashchange', route);
  $('#login-form').addEventListener('submit', doLogin);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
  window.addEventListener('online', () => syncNow());
  setInterval(() => { if (document.visibilityState === 'visible' && !SYNC.busy) syncNow(); }, 60000);
  if ('serviceWorker' in navigator && !IS_NATIVE && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  loadSeedCache();
  if (!AUTH.token) showLogin();
  else {
    showApp(); route();
    loadLeads().then(() => { render(); return syncNow(); }).catch((e) => { SYNC.err = e.message; updateSyncUi(); if (!SEED.length) toast(e.message); });
  }
})();
