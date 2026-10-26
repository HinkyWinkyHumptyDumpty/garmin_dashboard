/* Tagesform · App-Hülle
   Stellt die Schnittstelle `dash` bereit (Datensätze, Berechnungen, Ansichts-Parameter),
   kümmert sich um Anmeldung, Laden, Zwischenspeicher und Garmin-Aktualisierung. */
(function () {
  'use strict';
  const LS = { params: 'tf:params', cache: 'tf:cache:v1', theme: 'tf:theme', auth: 'tf:angemeldet' };
  const safe = (fn, d) => { try { return fn(); } catch (e) { return d; } };
  const $ = (id) => document.getElementById(id);
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Darstellung früh setzen (kein Aufblitzen) ---------- */
  function applyThemePref() {
    const t = safe(() => localStorage.getItem(LS.theme), null);
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    const dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { if (t) m.setAttribute('content', dark ? '#000000' : '#f2f2f7'); else m.setAttribute('content', m.media.includes('dark') ? '#000000' : '#f2f2f7'); });
  }
  applyThemePref();

  /* ---------- Datensätze & Berechnungen ---------- */
  const calcs = {}, datasets = {}, listeners = [];
  const state = { status: 'loading', stand: null, fehler: null, rechner: {}, laeuft: false, offline: false, etag: null };
  let cache = {};
  let params = safe(() => JSON.parse(localStorage.getItem(LS.params)) || {}, {});
  delete params.tag;

  function compute(id) {
    if (cache[id]) return cache[id];
    if (Object.prototype.hasOwnProperty.call(datasets, id)) return (cache[id] = { status: 'ok', data: datasets[id] });
    if (state.status !== 'ok') return { status: state.status };
    const c = calcs[id];
    if (!c) return { status: 'missing' };
    try {
      const ins = c.inputs.map(compute), bad = ins.find((r) => r.status !== 'ok');
      if (bad) return (cache[id] = { status: bad.status === 'loading' ? 'loading' : 'error' });
      return (cache[id] = { status: 'ok', data: c.fn(...ins.map((r) => r.data)) });
    } catch (e) {
      console.error('Berechnung „' + id + '“ fehlgeschlagen', e);
      return (cache[id] = { status: 'error', error: String(e) });
    }
  }
  let pending = false;
  function emit() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; listeners.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } }); });
  }
  function setDatasets(obj) { Object.assign(datasets, obj); cache = {}; }

  /* ---------- Server ---------- */
  async function api(method, url, body, headers) {
    let r;
    try {
      r = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store', headers: Object.assign(body ? { 'Content-Type': 'application/json' } : {}, headers || {}), body: body ? JSON.stringify(body) : undefined });
    } catch (e) { setOffline(true); const err = new Error('Keine Verbindung zum Server.'); err.offline = true; throw err; }
    setOffline(false);
    if (r.status === 304) return { unveraendert: true };
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && url.indexOf('/api/login') !== 0) { safe(() => localStorage.removeItem(LS.auth)); showLogin(); }
    if (!r.ok) { const err = new Error(j.fehler || 'Fehler ' + r.status); err.status = r.status; throw err; }
    return j;
  }

  /* ---------- Meldungen ---------- */
  let toastTimer = null;
  function toast(text, ms, act) { // act: { text, fn } macht die Meldung antippbar
    const t = $('toast'); if (!t) return;
    t.replaceChildren(document.createTextNode(text)); t.onclick = null;
    t.classList.toggle('tf-toast-act', !!act);
    if (act) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tf-toast-a'; b.textContent = act.text; t.appendChild(b); t.onclick = () => { t.classList.remove('on'); act.fn(); }; }
    t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), ms || 3200);
  }
  function relTime(iso) {
    if (!iso) return 'nie';
    const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (min < 1) return 'gerade eben';
    if (min < 60) return 'vor ' + min + ' min';
    const d = new Date(iso), heute = new Date();
    const uhr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === heute.toDateString()) return 'heute ' + uhr;
    const gestern = new Date(Date.now() - 864e5);
    if (d.toDateString() === gestern.toDateString()) return 'gestern ' + uhr;
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }) + ' ' + uhr;
  }
  function syncUi() {
    const b = $('sync-knopf'), t = $('sync-text');
    if (!b) return;
    const off = state.offline && !state.laeuft, u = b.querySelector('use');
    b.classList.toggle('on', state.laeuft); b.classList.toggle('off', off); b.disabled = state.laeuft || off;
    if (u) u.setAttribute('href', off ? '#i-cloud' : '#i-sync');
    if (t) t.textContent = state.laeuft ? 'Lädt …' : off ? 'Offline' : 'Aktualisieren';
    b.setAttribute('aria-label', off ? 'Offline – letzter Stand' : 'Garmin-Daten aktualisieren');
    b.title = (off ? 'Offline – du siehst den Stand von ' : 'Zuletzt geholt: ') + relTime(state.stand && state.stand.at) + (state.fehler ? ' · letzter Versuch fehlgeschlagen: ' + state.fehler.text : '');
  }
  function setOffline(v) { if (state.offline !== v) { state.offline = v; syncUi(); } }

  /* ---------- Zwischenspeicher auf dem Gerät ---------- */
  function saveCache() {
    safe(() => localStorage.setItem(LS.cache, JSON.stringify({ at: Date.now(), stand: state.stand, rechner: state.rechner, etag: state.etag, datasets })));
  }
  function loadCache() {
    const c = safe(() => JSON.parse(localStorage.getItem(LS.cache)), null);
    if (!c || !c.datasets) return false;
    setDatasets(c.datasets); state.stand = c.stand; state.rechner = c.rechner || {}; state.etag = c.etag || null;
    return true;
  }

  /* ---------- Anmeldung ---------- */
  function showLogin(msg) {
    const o = $('login'); if (!o) return;
    o.hidden = false; $('import').hidden = true;
    $('login-msg').textContent = msg || ''; $('login-msg').classList.toggle('err', !!msg);
    setTimeout(() => { const p = $('login-pw'); if (p) p.focus(); }, 50);
  }
  function hideLogin() { const o = $('login'); if (o) o.hidden = true; }

  /* ---------- Laden & Aktualisieren ---------- */
  async function reload() {
    const j = await api('GET', '/api/data', null, state.etag && state.status === 'ok' ? { 'If-None-Match': state.etag } : null);
    if (j.unveraendert) { syncUi(); return { stand: state.stand }; } // nichts Neues: Gerätespeicher ist aktuell
    setDatasets(j.datasets);
    state.stand = j.stand; state.fehler = j.fehler; state.rechner = j.rechner || {}; state.etag = j.etag || null;
    state.status = j.stand ? 'ok' : 'loading'; // ohne ersten Import nichts rechnen
    saveCache(); syncUi(); emit();
    return j;
  }
  async function refresh(opt) {
    opt = opt || {};
    if (state.laeuft) return;
    state.laeuft = true; syncUi();
    try {
      let j = await api('POST', '/api/refresh', { voll: !!opt.voll });
      for (let n = 0; j.stand && (j.stand.offen > 0 || !j.stand.import_fertig) && n < 12; n++) { // Rest nachladen (Garmin: 100 Abrufe pro Minute)
        await pause(1000 * (1 + (j.stand.bereit_in_s || 0)));
        j = await api('POST', '/api/refresh', {});
      }
      await reload();
      if (!opt.leise) toast('Garmin-Daten aktualisiert');
    } catch (e) {
      if (e.status === 409) { setTimeout(() => reload().catch(() => {}), 25000); if (!opt.leise) toast(e.message); }
      else { state.fehler = { at: new Date().toISOString(), text: e.message }; toast(e.message, 6000); }
    } finally { state.laeuft = false; syncUi(); }
  }
  async function firstImport() {
    const o = $('import'); o.hidden = false;
    try {
      state.laeuft = true; syncUi();
      let j = await api('POST', '/api/refresh', { voll: true });
      for (let n = 0; j.stand && (j.stand.offen > 0 || !j.stand.import_fertig) && n < 14; n++) {
        const was = j.stand.import_fertig ? 'Schlaf, HRV und Einheiten sind da – jetzt noch die Abschnitte deiner Wettkämpfe.' : 'Daten bis ' + j.stand.import_ab.split('-').reverse().join('.') + ' sind da – es geht weiter zurück.';
        for (let w = 1 + (j.stand.bereit_in_s || 0); w > 0; w--) { // Garmin erlaubt 100 Abrufe pro Minute
          $('import-text').textContent = was + (w > 2 ? ' Garmin braucht eine kurze Pause: noch ' + w + ' s.' : '');
          await pause(1000);
        }
        $('import-text').textContent = was;
        j = await api('POST', '/api/refresh', {});
      }
      await reload();
      o.hidden = true;
    } catch (e) {
      $('import-text').textContent = 'Der Import hat nicht geklappt: ' + e.message + ' – lade die Seite in einer Minute neu.';
    } finally { state.laeuft = false; syncUi(); }
  }
  function staleCheck() {
    const s = state.stand; if (!s || state.laeuft) return;
    const age = Date.now() - Date.parse(s.at), h = new Date().getHours();
    if (age > 2 * 3600e3 || (!s.schlaf_heute && h >= 6 && age > 30 * 60e3)) refresh({ leise: true });
  }
  async function start(cacheDa) {
    hideLogin();
    if (!cacheDa && loadCache()) { state.status = 'ok'; syncUi(); emit(); }
    try {
      const j = await reload();
      if (!j.stand) return firstImport();
      staleCheck();
    } catch (e) {
      if (e.status === 401) return;
      if (state.status === 'ok') toast(e.offline ? 'Offline – du siehst den letzten Stand.' : e.message, 5000);
      else { state.status = 'error'; emit(); toast(e.message, 8000); }
    }
  }
  async function boot() {
    // Schneller Start: Wer schon angemeldet war, sieht sofort den letzten Stand – geprüft wird im Hintergrund
    const sofort = safe(() => localStorage.getItem(LS.auth), null) === '1' && loadCache();
    if (sofort) { state.status = 'ok'; syncUi(); emit(); }
    let st;
    try { st = await api('GET', '/api/login'); }
    catch (e) {
      if (sofort || loadCache()) { state.status = 'ok'; emit(); toast('Offline – du siehst den letzten Stand.', 5000); }
      else showLogin(e.offline ? 'Keine Verbindung – Tagesform braucht beim ersten Start Internet.' : e.message);
      return;
    }
    if (!st.angemeldet) { safe(() => localStorage.removeItem(LS.auth)); return showLogin(st.passwort_gesetzt === false ? 'In Vercel fehlt noch die Variable APP_PASSWORD.' : ''); }
    safe(() => localStorage.setItem(LS.auth, '1'));
    start(sofort);
  }

  /* ---------- Service Worker: Offline-Start, neue Versionen, Mitteilungen ---------- */
  function swStart() {
    if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) return;
    const hatte = !!navigator.serviceWorker.controller;
    const neu = () => toast('Neue Version da', 20000, { text: 'Neu laden', fn: () => location.reload() });
    navigator.serviceWorker.addEventListener('message', (ev) => {
      const m = ev.data || {};
      if (m.typ === 'update') neu();
      if (m.typ === 'oeffne' && m.hash && location.hash !== m.hash) location.hash = m.hash;
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hatte) neu(); });
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e.message));
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('login-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msg = $('login-msg'), btn = ev.target.querySelector('button');
      btn.disabled = true; msg.textContent = ''; msg.classList.remove('err');
      try { await api('POST', '/api/login', { passwort: $('login-pw').value }); $('login-pw').value = ''; safe(() => localStorage.setItem(LS.auth, '1')); start(); }
      catch (e) { msg.textContent = e.message; msg.classList.add('err'); }
      finally { btn.disabled = false; }
    });
    $('sync-knopf').addEventListener('click', () => refresh());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state.status === 'ok') staleCheck(); });
    window.addEventListener('offline', () => setOffline(true));
    window.addEventListener('online', () => { if (!state.offline) return; setOffline(false); if (state.status === 'ok') reload().then(staleCheck).catch(() => {}); });
    syncUi();
    boot();
    swStart();
  });

  /* ---------- Öffentliche Schnittstelle ---------- */
  window.dash = {
    calc(id, spec) { calcs[id] = spec; },
    data(id) { return compute(id); },
    onData(cb) { listeners.push(cb); if (state.status !== 'loading') emit(); },
    params() { return Object.assign({}, params); },
    setParams(p) {
      Object.keys(p).forEach((k) => { if (p[k] == null) delete params[k]; else params[k] = p[k]; });
      const keep = Object.assign({}, params); delete keep.tag;
      safe(() => localStorage.setItem(LS.params, JSON.stringify(keep)));
      emit();
    },
    setLink(t) { if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t); },
    app: {
      state, api, toast, refresh, reload, relTime,
      // Datensatz lokal ersetzen (nach dem Speichern) und neu rechnen
      patch(name, rows) { datasets[name] = rows; cache = {}; saveCache(); emit(); },
      setRechner(obj) { state.rechner = obj; saveCache(); },
      raw(name) { return datasets[name]; },
      setTheme(t) { safe(() => (t === 'auto' ? localStorage.removeItem(LS.theme) : localStorage.setItem(LS.theme, t))); applyThemePref(); emit(); },
      theme() { return safe(() => localStorage.getItem(LS.theme), null) || 'auto'; },
      async logout() {
        try { await api('DELETE', '/api/login'); } catch (e) { /* trotzdem lokal abmelden */ }
        safe(() => localStorage.removeItem(LS.cache)); safe(() => localStorage.removeItem(LS.auth)); state.etag = null;
        Object.keys(datasets).forEach((k) => delete datasets[k]); cache = {}; state.status = 'loading';
        showLogin('Abgemeldet.');
      },
    },
  };
})();
