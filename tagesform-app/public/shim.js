/* Tagesform · App-Hülle
   Stellt die Schnittstelle `dash` bereit (Datensätze, Berechnungen, Ansichts-Parameter),
   kümmert sich um Anmeldung, Laden, Zwischenspeicher und Garmin-Aktualisierung. */
(function () {
  'use strict';
  const LS = { params: 'tf:params', cache: 'tf:cache:v2', theme: 'tf:theme', auth: 'tf:konto', pushUid: 'tf:push-konto' };
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
  function setDatasets(obj) { Object.assign(datasets, obj); if (!datasets.wettkaempfe) datasets.wettkaempfe = []; cache = {}; }

  /* ---------- Server ---------- */
  async function api(method, url, body, headers) {
    let r;
    try {
      r = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store', headers: Object.assign(body ? { 'Content-Type': 'application/json' } : {}, headers || {}), body: body ? JSON.stringify(body) : undefined });
    } catch (e) { setOffline(true); const err = new Error('Keine Verbindung zum Server.'); err.offline = true; throw err; }
    setOffline(false);
    if (r.status === 304) return { unveraendert: true };
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && url.indexOf('/api/login') !== 0 && konto.uid) { vergessen(); emit(); showLogin({ msg: 'Bitte melde dich neu an.' }); } // Sitzung abgelaufen oder Passwort anderswo geändert
    if (!r.ok) { const err = new Error(j.fehler || 'Fehler ' + r.status); err.status = r.status; err.code = j.code || null; throw err; }
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

  /* ---------- Zwischenspeicher auf dem Gerät (je Konto) ---------- */
  function saveCache() {
    if (!konto.uid) return;
    safe(() => localStorage.setItem(LS.cache, JSON.stringify({ uid: konto.uid, at: Date.now(), stand: state.stand, rechner: state.rechner, etag: state.etag, datasets })));
  }
  function loadCache(uid) {
    const c = safe(() => JSON.parse(localStorage.getItem(LS.cache)), null);
    if (!uid || !c || c.uid !== uid || !c.datasets) return false;
    setDatasets(c.datasets); state.stand = c.stand; state.rechner = c.rechner || {}; state.etag = c.etag || null;
    return true;
  }
  // Alles vom Gerät entfernen, was zu einem Konto gehört
  function vergessen() {
    ['cache', 'auth', 'pushUid'].forEach((k) => safe(() => localStorage.removeItem(LS[k])));
    Object.keys(datasets).forEach((k) => delete datasets[k]); cache = {};
    Object.assign(state, { status: 'loading', stand: null, fehler: null, rechner: {}, etag: null });
    konto = {};
  }

  /* ---------- Konto ---------- */
  let konto = {}, STATUS = null, MODUS = 'anmelden';
  const ANLEITUNG = 'https://github.com/HinkyWinkyHumptyDumpty/garmin_dashboard/tree/main/tagesform-app#eigene-kopie-einrichten';
  function setKonto(j) {
    if (j.uid && j.uid !== konto.uid && safe(() => localStorage.getItem(LS.auth), null) !== j.uid) vergessen(); // anderes Konto als zuletzt auf diesem Gerät
    ['uid', 'email', 'garmin', 'garmin_seit'].forEach((k) => { if (j[k] !== undefined) konto[k] = j[k]; });
    if (konto.uid) safe(() => localStorage.setItem(LS.auth, konto.uid));
  }
  const overlays = ['login', 'notfall', 'garmin', 'import'];
  function zeige(id) { overlays.forEach((o) => { const e = $(o); if (e) e.hidden = o !== id; }); }
  function msg(id, text, err) { const m = $(id); if (!m) return; m.textContent = text || ''; m.classList.toggle('err', !!err); }

  function setModus(m) {
    MODUS = m;
    const reg = (STATUS && STATUS.registrierung) || 'offen', zu = m === 'registrieren' && reg === 'zu';
    $('login-form').dataset.modus = m;
    $('login-tabs').hidden = m === 'zuruecksetzen';
    document.querySelectorAll('#login-tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modus === m)));
    $('login-form').hidden = zu; $('login-zu').hidden = !zu;
    document.querySelectorAll('#login-form [data-nur]').forEach((e) => {
      const nur = e.dataset.nur.split(' ');
      e.hidden = nur.includes('einladung') ? !(m === 'registrieren' && reg === 'code') : !nur.includes(m);
    });
    $('login-titel').hidden = m !== 'zuruecksetzen';
    const info = m === 'zuruecksetzen' ? 'Mit deinem Notfall-Code legst du ein neues Passwort fest.'
      : m === 'registrieren' && reg === 'erstes' ? 'Noch gibt es hier kein Konto – leg das erste an.'
      : m === 'registrieren' && reg === 'code' ? 'Neue Konten gibt es hier nur mit Einladungscode.' : '';
    $('login-info').textContent = info; $('login-info').hidden = !info;
    $('login-pw-l').textContent = m === 'zuruecksetzen' ? 'Neues Passwort' : 'Passwort';
    $('login-pw').setAttribute('autocomplete', m === 'anmelden' ? 'current-password' : 'new-password');
    $('login-submit').textContent = { anmelden: 'Anmelden', registrieren: 'Konto erstellen', zuruecksetzen: 'Passwort neu setzen' }[m];
    msg('login-msg', '');
  }
  const EINRICHTUNG = /[?&]einrichtung\b/.test(location.search); // …/?einrichtung zeigt frische Zufallswerte für Vercel
  function setupText(st) {
    const fehlt = [];
    $('login-setup-titel').textContent = EINRICHTUNG ? 'Neue Zufallswerte für Vercel' : 'Noch nicht fertig eingerichtet';
    $('setup-neu').hidden = EINRICHTUNG; $('setup-zur-app').hidden = !EINRICHTUNG;
    if (EINRICHTUNG) {
      fehlt.push('In Vercel unter <b>Settings → Environment Variables</b> bei <code>AUTH_SECRET</code> den Vorschlag unten eintragen. <b>Nur, solange es noch keine Konten gibt</b> – danach müssten sich alle neu anmelden und ihren Garmin-Schlüssel neu eintragen.');
      fehlt.push('Bei <code>CRON_SECRET</code> ebenso (kann jederzeit gewechselt werden).');
      st = Object.assign({}, st, { auth_secret: false, cron_secret: false });
    } else {
      if (!st.speicher) fehlt.push('In Vercel unter <b>Storage</b> eine kostenlose <b>Upstash Redis</b>-Datenbank anlegen und mit diesem Projekt verbinden.');
      if (!st.auth_secret) fehlt.push(st.auth_schwach
        ? 'Dein <code>AUTH_SECRET</code> ist zu leicht zu erraten (zum Beispiel nur Ziffern oder sehr wenige verschiedene Zeichen). Ersetze ihn in Vercel unter <b>Settings → Environment Variables</b> durch den Vorschlag unten.'
        : 'In Vercel unter <b>Settings → Environment Variables</b> die Variable <code>AUTH_SECRET</code> anlegen (mindestens 32 zufällige Zeichen, Vorschlag unten).');
      if (!st.cron_secret) fehlt.push('Für die automatischen Abrufe am Morgen ebenso <code>CRON_SECRET</code> anlegen (mindestens 16 Zeichen, Vorschlag unten).');
    }
    fehlt.push('Danach unter <b>Deployments</b> die neueste Version mit <b>Redeploy</b> neu starten.');
    $('login-setup-text').innerHTML = '<ol>' + fehlt.map((t) => '<li>' + t + '</li>').join('') + '</ol>';
    // Vorschläge entstehen nur hier im Browser (crypto.getRandomValues) und werden nirgends hingeschickt
    const zufall = (n) => { const z = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', r = new Uint8Array(n); crypto.getRandomValues(r); return Array.from(r, (x) => z[x % z.length]).join(''); };
    $('login-setup-secret').hidden = !!st.auth_secret;
    $('login-setup-cron').hidden = !!st.cron_secret;
    if (!st.auth_secret && !$('setup-secret').textContent) $('setup-secret').textContent = zufall(40);
    if (!st.cron_secret && !$('setup-cron').textContent) $('setup-cron').textContent = zufall(32);
  }
  function showLogin(opt) {
    opt = opt || {};
    if (!$('login')) return;
    zeige('login');
    const bereit = !STATUS || STATUS.bereit !== false;
    $('login-setup').hidden = bereit;
    if (!bereit) setupText(STATUS);
    $('login-tabs').hidden = !bereit; $('login-form').hidden = !bereit; $('login-zu').hidden = true;
    $('login-anleitung').href = ANLEITUNG;
    if (bereit) setModus(opt.modus || (STATUS && STATUS.registrierung === 'erstes' ? 'registrieren' : 'anmelden'));
    if (opt.msg) msg('login-msg', opt.msg, !!opt.err);
    setTimeout(() => { const f = $(bereit ? (MODUS === 'anmelden' && $('login-mail').value ? 'login-pw' : 'login-mail') : 'setup-neu'); if (f && !f.closest('[hidden]')) f.focus(); }, 50);
  }
  function hideLogin() { zeige(null); }

  async function loginSenden(ev) {
    ev.preventDefault();
    const mail = $('login-mail').value.trim(), pw = $('login-pw').value, pw2 = $('login-pw2').value, btn = $('login-submit');
    const fehler = (t) => msg('login-msg', t, true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fehler('Bitte eine gültige E-Mail-Adresse eingeben.');
    if (MODUS === 'zuruecksetzen' && !$('login-notfall').value.trim()) return fehler('Bitte den Notfall-Code eingeben.');
    if (!pw) return fehler('Bitte das Passwort eingeben.');
    if (MODUS !== 'anmelden') {
      if (pw.length < 10) return fehler('Das Passwort braucht mindestens 10 Zeichen.');
      if (pw !== pw2) return fehler('Die beiden Passwörter sind nicht gleich.');
    }
    btn.disabled = true; msg('login-msg', MODUS === 'anmelden' ? 'Melde an …' : 'Einen Moment …');
    try {
      const body = MODUS === 'registrieren' ? { aktion: 'registrieren', email: mail, passwort: pw, code: $('login-einladung').value.trim() }
        : MODUS === 'zuruecksetzen' ? { aktion: 'zuruecksetzen', email: mail, notfallcode: $('login-notfall').value, passwort: pw }
        : { email: mail, passwort: pw };
      const j = await api('POST', '/api/login', body);
      ['login-pw', 'login-pw2', 'login-notfall', 'login-einladung'].forEach((id) => { $(id).value = ''; });
      setKonto(j); msg('login-msg', '');
      if (j.notfallcode) zeigeNotfall(j.notfallcode, weiter); else weiter();
    } catch (e) {
      fehler(e.message);
      if (e.code === 'zu' && STATUS) { STATUS.registrierung = 'zu'; setModus('registrieren'); }
    } finally { btn.disabled = false; }
  }
  // Nach dem Anmelden: ohne Garmin-Schlüssel erst verbinden, sonst starten
  function weiter() { if (!konto.garmin) showGarmin(); else start(); }

  function zeigeNotfall(code, danach) {
    $('notfall-code').textContent = code;
    $('notfall-ok').checked = false; $('notfall-weiter').disabled = true;
    zeige('notfall');
    $('notfall-weiter').onclick = () => { $('notfall-code').textContent = ''; zeige(null); if (danach) danach(); };
  }

  function showGarmin(opt) {
    opt = opt || {};
    $('garmin-titel').textContent = opt.erneuern ? 'Neuen Garmin-Schlüssel eintragen' : 'Garmin verbinden';
    $('garmin-lede').textContent = opt.erneuern
      ? 'Garmin nimmt den gespeicherten Schlüssel nicht mehr an – meist ist seine Laufzeit abgelaufen. So erstellst du einen neuen:'
      : 'Tagesform liest deine Daten mit deinem persönlichen Garmin-Schlüssel – nur lesend, nur deine eigenen.';
    $('garmin-spaeter').textContent = state.stand ? 'Später' : 'Abmelden';
    const schonOffen = !$('garmin').hidden; // ein zweiter Aufruf (z. B. nach dem Nachladen) soll Eingaben nicht wegwischen
    $('garmin-weg').hidden = !!state.stand;
    if (!schonOffen) { $('garmin-weg').open = false; msg('garmin-weg-msg', ''); }
    if (!schonOffen || opt.msg) msg('garmin-msg', opt.msg || '', !!opt.msg);
    zeige('garmin');
    if (!schonOffen) setTimeout(() => $('garmin-key').focus(), 50);
  }
  async function garminSenden(ev) {
    ev.preventDefault();
    const k = $('garmin-key').value.trim(), btn = $('garmin-submit');
    if (!k) return msg('garmin-msg', 'Bitte zuerst den Schlüssel einfügen.', true);
    btn.disabled = true; msg('garmin-msg', 'Frage bei Garmin nach, ob der Schlüssel passt …');
    try {
      const j = await api('POST', '/api/konto', { aktion: 'garmin', schluessel: k });
      $('garmin-key').value = ''; msg('garmin-msg', '');
      setKonto({ garmin: true, garmin_seit: j.garmin_seit || new Date().toISOString() });
      if (!state.stand) { start(); return; }
      zeige(null); toast('Garmin-Schlüssel gespeichert'); refresh({ leise: true }); emit();
    } catch (e) { msg('garmin-msg', e.message, true); }
    finally { btn.disabled = false; }
  }

  /* ---------- Laden & Aktualisieren ---------- */
  async function reload() {
    const j = await api('GET', '/api/data', null, state.etag && state.status === 'ok' ? { 'If-None-Match': state.etag } : null);
    if (j.unveraendert) { syncUi(); return { stand: state.stand }; } // nichts Neues: Gerätespeicher ist aktuell
    if (j.konto) setKonto(j.konto);
    setDatasets(j.datasets);
    state.stand = j.stand; state.fehler = j.fehler; state.rechner = j.rechner || {}; state.etag = j.etag || null;
    state.status = j.stand ? 'ok' : 'loading'; // ohne ersten Import nichts rechnen
    saveCache(); syncUi(); emit();
    return j;
  }
  const garminProblem = (e) => e && (e.code === 'garmin_fehlt' || e.code === 'garmin_abgelehnt');
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
      if (garminProblem(e)) {
        state.fehler = { at: new Date().toISOString(), text: e.message };
        toast(e.code === 'garmin_fehlt' ? 'Kein Garmin-Schlüssel hinterlegt' : 'Garmin nimmt den Schlüssel nicht mehr an', 12000, { text: 'Neuen eintragen', fn: () => showGarmin({ erneuern: e.code === 'garmin_abgelehnt' }) });
      } else if (e.status === 409) { setTimeout(() => reload().catch(() => {}), 25000); if (!opt.leise) toast(e.message); }
      else if (e.status !== 401) { state.fehler = { at: new Date().toISOString(), text: e.message }; toast(e.message, 6000); }
    } finally { state.laeuft = false; syncUi(); emit(); }
  }
  async function firstImport() {
    zeige('import');
    $('import-text').textContent = 'Tagesform holt deine letzten 12 Monate aus Garmin. Das dauert zwei bis drei Minuten – Garmin lässt nur 100 Abrufe pro Minute zu.';
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
      zeige(null);
    } catch (e) {
      if (garminProblem(e)) { state.laeuft = false; showGarmin({ erneuern: e.code === 'garmin_abgelehnt', msg: e.message }); return; }
      if (e.status !== 401) $('import-text').textContent = 'Der Import hat nicht geklappt: ' + e.message + ' – lade die Seite in einer Minute neu, dann geht es weiter.';
    } finally { state.laeuft = false; syncUi(); }
  }
  function staleCheck() {
    const s = state.stand; if (!s || state.laeuft || konto.garmin === false) return;
    const age = Date.now() - Date.parse(s.at), h = new Date().getHours();
    if (age > 2 * 3600e3 || (!s.schlaf_heute && h >= 6 && age > 30 * 60e3)) refresh({ leise: true });
  }
  async function start(cacheDa) {
    hideLogin();
    if (!cacheDa && loadCache(konto.uid)) { state.status = 'ok'; syncUi(); emit(); }
    try {
      const j = await reload();
      if (!j.stand) return konto.garmin ? firstImport() : showGarmin();
      staleCheck();
    } catch (e) {
      if (e.status === 401) return;
      if (state.status === 'ok') toast(e.offline ? 'Offline – du siehst den letzten Stand.' : e.message, 5000);
      else { state.status = 'error'; emit(); toast(e.message, 8000); }
    }
  }
  async function status() {
    STATUS = await api('GET', '/api/login');
    return STATUS;
  }
  async function boot() {
    // Schneller Start: Wer auf diesem Gerät angemeldet war, sieht sofort den letzten Stand – geprüft wird im Hintergrund
    const uid = safe(() => localStorage.getItem(LS.auth), null);
    const sofort = !!uid && loadCache(uid);
    if (sofort) { konto.uid = uid; state.status = 'ok'; syncUi(); emit(); }
    let st;
    try { st = await status(); }
    catch (e) {
      if (sofort) toast('Offline – du siehst den letzten Stand.', 5000);
      else showLogin({ msg: e.offline ? 'Keine Verbindung – Tagesform braucht beim ersten Start Internet.' : e.message, err: true });
      return;
    }
    if (EINRICHTUNG) { STATUS = Object.assign({}, st, { bereit: false }); return showLogin(); }
    if (!st.angemeldet) { vergessen(); emit(); return showLogin(); }
    setKonto(st);
    start(sofort && uid === st.uid);
  }
  // Mitteilungen dieses Geräts vom Konto lösen (beim Abmelden und Löschen)
  async function pushWeg(server) {
    try {
      if (!('serviceWorker' in navigator)) return;
      const reg = await Promise.race([navigator.serviceWorker.getRegistration(), pause(3000).then(() => null)]);
      const abo = reg && reg.pushManager ? await reg.pushManager.getSubscription() : null;
      if (!abo) return;
      if (server) await api('POST', '/api/push', { aktion: 'ab', endpoint: abo.endpoint }).catch(() => {});
      await abo.unsubscribe().catch(() => {});
    } catch (e) { /* egal */ } finally { safe(() => localStorage.removeItem(LS.pushUid)); }
  }
  function kopiere(id) {
    const e = $(id), t = e ? (e.getAttribute('href') && e.tagName === 'A' ? e.href : e.textContent || '').trim() : '';
    if (!t) return;
    const ok = () => toast('Kopiert');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, () => markiere(e));
    else markiere(e);
  }
  function markiere(e) {
    const r = document.createRange(); r.selectNodeContents(e);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    toast('Markiert – jetzt kopieren');
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
    safe(() => { localStorage.removeItem('tf:cache:v1'); localStorage.removeItem('tf:angemeldet'); }); // Reste der Ein-Personen-Version
    $('login-form').addEventListener('submit', loginSenden);
    document.querySelectorAll('#login-tabs button').forEach((b) => b.addEventListener('click', () => setModus(b.dataset.modus)));
    $('login-wechsel').addEventListener('click', () => setModus('zuruecksetzen'));
    $('login-zurueck').addEventListener('click', () => setModus('anmelden'));
    $('setup-neu').addEventListener('click', () => boot());
    $('notfall-ok').addEventListener('change', (e) => { $('notfall-weiter').disabled = !e.target.checked; });
    $('garmin-form').addEventListener('submit', garminSenden);
    $('garmin-spaeter').addEventListener('click', () => { if (state.stand) zeige(null); else window.dash.app.logout(); });
    $('garmin-weg-ok').addEventListener('click', async () => {
      const pw = $('garmin-weg-pw').value, b = $('garmin-weg-ok');
      if (!pw) return msg('garmin-weg-msg', 'Bitte dein Passwort eingeben.', true);
      b.disabled = true;
      try { await api('POST', '/api/konto', { aktion: 'loeschen', passwort: pw }); $('garmin-weg-pw').value = ''; await window.dash.app.geloescht(); }
      catch (e) { msg('garmin-weg-msg', e.message, true); } finally { b.disabled = false; }
    });
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-kopiere]'); if (b) kopiere(b.dataset.kopiere); });
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
      konto() { return Object.assign({}, konto); },
      setKonto(j) { setKonto(j); emit(); },
      status() { return STATUS ? Object.assign({}, STATUS) : null; },
      anleitung: ANLEITUNG,
      showGarmin, zeigeNotfall,
      pushKonto(set) { if (set) safe(() => localStorage.setItem(LS.pushUid, konto.uid)); return safe(() => localStorage.getItem(LS.pushUid), null) === konto.uid; },
      async logout() {
        await pushWeg(true); // Morgen-Push dieses Geräts gehört zum Konto
        try { await api('DELETE', '/api/login'); } catch (e) { /* trotzdem lokal abmelden */ }
        const mail = konto.email;
        vergessen(); emit();
        showLogin({ modus: 'anmelden', msg: 'Abgemeldet.' });
        if (mail) $('login-mail').value = mail;
      },
      // nach dem Löschen des Kontos: nur noch lokal aufräumen
      async geloescht() {
        await pushWeg(false);
        vergessen(); emit();
        await status().catch(() => null);
        showLogin({ modus: 'anmelden', msg: 'Dein Konto und alle Daten sind gelöscht.' });
      },
    },
  };
})();
