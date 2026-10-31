// دمج بيانات المزامنة — نفس الملف بيشتغل بالمتصفح وعلى السيرفر.
// كل عميل إله "u" (وقت آخر تعديل): الأحدث بيكسب، والملاحظات والنشاطات بتنجمع.
// board = تعليمات المدير للكول سنتر (الأحدث بيكسب، والممسوحة بتضل كعلامة del).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZLMerge = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SYNC_SETTINGS = ['name', 'agency', 'revenueTarget', 'waTemplate'];
  const MAX_ACTIVITY = 5000;

  function emptyState() {
    return { v: 2, meta: {}, custom: [], deleted: {}, activity: [], board: [], settings: {}, settingsU: 0 };
  }

  function mergeNotes(a, b) {
    const m = new Map();
    for (const n of [...(a || []), ...(b || [])]) {
      if (!n || !n.text) continue;
      const k = n.t + '|' + n.text, p = m.get(k);
      if (!p || !p.sig || n.sig) m.set(k, n); // النسخة الموقّعة من السيرفر بتكسب
    }
    return [...m.values()].sort((x, y) => x.t - y.t);
  }

  function mergeState(A, B) {
    A = A || {};
    B = B || {};
    const out = emptyState();

    for (const src of [A.deleted, B.deleted]) {
      for (const [id, t] of Object.entries(src || {})) out.deleted[id] = Math.max(out.deleted[id] || 0, +t || 0);
    }

    const ids = new Set([...Object.keys(A.meta || {}), ...Object.keys(B.meta || {})]);
    for (const id of ids) {
      const a = (A.meta || {})[id], b = (B.meta || {})[id];
      let m;
      if (!a || !b) m = { ...(a || b) };
      else {
        const win = (b.u || 0) > (a.u || 0) ? b : a;
        m = { ...win, notes: mergeNotes(a.notes, b.notes) };
      }
      if (out.deleted[id] && out.deleted[id] >= (m.u || 0)) continue;
      out.meta[id] = m;
    }

    const cm = new Map();
    for (const c of [...(A.custom || []), ...(B.custom || [])]) {
      if (!c || !c.id) continue;
      const p = cm.get(c.id);
      if (!p || (c.u || 0) > (p.u || 0)) cm.set(c.id, c);
    }
    out.custom = [...cm.values()].filter((c) => !(out.deleted[c.id] && out.deleted[c.id] >= (c.u || 0)));

    const am = new Map();
    for (const a of [...(A.activity || []), ...(B.activity || [])]) {
      if (a && a.t) am.set(`${a.t}|${a.id || ''}|${a.type}|${a.to || ''}`, a);
    }
    out.activity = [...am.values()].sort((x, y) => x.t - y.t).slice(-MAX_ACTIVITY);

    const bm = new Map();
    for (const b of [...(A.board || []), ...(B.board || [])]) {
      if (!b || !b.id) continue;
      const p = bm.get(b.id), bu = b.u || 0, pu = p ? p.u || 0 : -1;
      if (!p || bu > pu || (bu === pu && b.sig && !p.sig)) bm.set(b.id, b);
    }
    out.board = [...bm.values()].sort((x, y) => (x.t || 0) - (y.t || 0));

    const sa = A.settingsU || 0, sb = B.settingsU || 0;
    const s = sb > sa ? B.settings : A.settings;
    for (const k of SYNC_SETTINGS) if (s && s[k] !== undefined) out.settings[k] = s[k];
    out.settingsU = Math.max(sa, sb);
    return out;
  }

  return { mergeState, emptyState, SYNC_SETTINGS };
});
