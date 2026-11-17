/* Cozy Life OS – lớp lưu trữ
   Dữ liệu nằm trong IndexedDB ngay trên máy (không gửi đi đâu).
   Kho (object store):
     settings  : 1 bản ghi 'main' – tên, tủ đồ, giờ ngủ mục tiêu, ...
     days      : mỗi ngày 1 bản ghi, khóa = 'YYYY-MM-DD'
     sleeps    : mỗi đêm ngủ 1 bản ghi, khóa = id
     snapshots : bản chụp toàn bộ dữ liệu (tự động mỗi ngày + trước khi khôi phục/xóa)
   Nếu trình duyệt không cho dùng IndexedDB thì tạm lưu vào localStorage. */
(function () {
  const NAME = 'cozy-life-os', VERSION = 1, FALLBACK_KEY = 'cozy-life-os-fallback';
  const STORES = ['settings', 'days', 'sleeps', 'snapshots'];
  let dbp = null, useFallback = false;
  const cache = { settings: null, days: {}, sleeps: {} };

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in self)) return rej(new Error('no-idb'));
      const r = indexedDB.open(NAME, VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        if (!db.objectStoreNames.contains('days')) db.createObjectStore('days');
        if (!db.objectStoreNames.contains('sleeps')) db.createObjectStore('sleeps');
        if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots');
      };
      r.onsuccess = () => {
        const db = r.result;
        db.onversionchange = () => db.close();
        res(db);
      };
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    });
    return dbp;
  }

  const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const txDone = tx => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('abort')); });

  async function getAll(db, store) {
    const tx = db.transaction(store, 'readonly'), os = tx.objectStore(store);
    const [keys, vals] = await Promise.all([reqP(os.getAllKeys()), reqP(os.getAll())]);
    return keys.map((k, i) => [k, vals[i]]);
  }

  const sleepId = s => s.id || (s.bed + '|' + s.wake);

  function split(S) {
    const settings = {};
    for (const k in S) if (k !== 'days' && k !== 'sleeps') settings[k] = S[k];
    const sleeps = {};
    (S.sleeps || []).forEach(s => { sleeps[sleepId(s)] = s; });
    return { settings, days: S.days || {}, sleeps };
  }

  function rememberAll(S) {
    const p = split(S);
    cache.settings = JSON.stringify(p.settings);
    cache.days = {}; for (const k in p.days) cache.days[k] = JSON.stringify(p.days[k]);
    cache.sleeps = {}; for (const k in p.sleeps) cache.sleeps[k] = JSON.stringify(p.sleeps[k]);
  }

  /* Đọc toàn bộ dữ liệu. Trả về null nếu máy này chưa có gì. */
  async function loadState() {
    try {
      const db = await open();
      const [st, days, sleeps] = await Promise.all([getAll(db, 'settings'), getAll(db, 'days'), getAll(db, 'sleeps')]);
      const main = (st.find(([k]) => k === 'main') || [])[1];
      if (!main && !days.length && !sleeps.length) return null;
      const S = Object.assign({}, main || {});
      S.days = {}; days.forEach(([k, v]) => { S.days[k] = v; });
      S.sleeps = sleeps.map(([, v]) => v).sort((a, b) => String(a.bed).localeCompare(String(b.bed)));
      rememberAll(S);
      return S;
    } catch (e) {
      console.warn('IndexedDB không dùng được, chuyển sang localStorage', e);
      useFallback = true;
      try { const r = localStorage.getItem(FALLBACK_KEY); return r ? JSON.parse(r) : null; } catch (_) { return null; }
    }
  }

  /* Ghi những phần đã thay đổi (so với lần ghi trước). */
  let chain = Promise.resolve();
  function saveState(S) {
    const snap = JSON.parse(JSON.stringify(S));
    chain = chain.then(() => doSave(snap)).catch(e => console.error('Lưu thất bại', e));
    return chain;
  }
  async function doSave(S) {
    if (useFallback) { localStorage.setItem(FALLBACK_KEY, JSON.stringify(S)); return; }
    const db = await open(), p = split(S);
    const tx = db.transaction(['settings', 'days', 'sleeps'], 'readwrite');
    const next = { settings: cache.settings, days: Object.assign({}, cache.days), sleeps: Object.assign({}, cache.sleeps) };
    const sj = JSON.stringify(p.settings);
    if (sj !== cache.settings) { tx.objectStore('settings').put(p.settings, 'main'); next.settings = sj; }
    for (const kind of ['days', 'sleeps']) {
      const os = tx.objectStore(kind), cur = p[kind];
      for (const k in cur) { const j = JSON.stringify(cur[k]); if (j !== cache[kind][k]) { os.put(cur[k], k); next[kind][k] = j; } }
      for (const k in cache[kind]) if (!(k in cur)) { os.delete(k); delete next[kind][k]; }
    }
    await txDone(tx);
    Object.assign(cache, next);
  }

  /* Thay toàn bộ dữ liệu (dùng khi khôi phục hoặc xóa hết). */
  async function replaceAll(S) {
    await chain;
    if (useFallback) { localStorage.setItem(FALLBACK_KEY, JSON.stringify(S)); return; }
    const db = await open(), p = split(S);
    const tx = db.transaction(['settings', 'days', 'sleeps'], 'readwrite');
    ['settings', 'days', 'sleeps'].forEach(n => tx.objectStore(n).clear());
    tx.objectStore('settings').put(p.settings, 'main');
    for (const k in p.days) tx.objectStore('days').put(p.days[k], k);
    for (const k in p.sleeps) tx.objectStore('sleeps').put(p.sleeps[k], k);
    await txDone(tx);
    rememberAll(S);
  }

  /* ---------- Bản chụp ---------- */
  async function putSnapshot(key, state, label) {
    if (useFallback) return;
    const db = await open(), tx = db.transaction('snapshots', 'readwrite');
    tx.objectStore('snapshots').put({ createdAt: new Date().toISOString(), label: label || '', state: JSON.parse(JSON.stringify(state)) }, key);
    await txDone(tx);
    await prune();
  }
  async function listSnapshots() {
    if (useFallback) return [];
    const db = await open();
    const all = await getAll(db, 'snapshots');
    return all.map(([key, v]) => ({ key, createdAt: v.createdAt, label: v.label, days: Object.keys(v.state.days || {}).length, sleeps: (v.state.sleeps || []).length }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async function getSnapshot(key) {
    const db = await open();
    return reqP(db.transaction('snapshots', 'readonly').objectStore('snapshots').get(key));
  }
  /* Giữ 7 bản chụp tự động gần nhất và 3 bản "an toàn" gần nhất */
  async function prune() {
    const list = await listSnapshots();
    const autos = list.filter(s => s.key.startsWith('auto-')), safes = list.filter(s => s.key.startsWith('safe-'));
    const drop = autos.slice(7).concat(safes.slice(3));
    if (!drop.length) return;
    const db = await open(), tx = db.transaction('snapshots', 'readwrite');
    drop.forEach(s => tx.objectStore('snapshots').delete(s.key));
    await txDone(tx);
  }

  /* Xin trình duyệt đừng tự xóa dữ liệu khi máy đầy bộ nhớ */
  async function persist() {
    try {
      if (!navigator.storage || !navigator.storage.persist) return 'unknown';
      if (await navigator.storage.persisted()) return 'yes';
      return (await navigator.storage.persist()) ? 'yes' : 'no';
    } catch (e) { return 'unknown'; }
  }

  self.CozyDB = { loadState, saveState, replaceAll, putSnapshot, listSnapshots, getSnapshot, persist, get fallback() { return useFallback; } };
})();
