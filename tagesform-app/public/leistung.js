/* Tagesform · Leistung (Version 8): Material (Kette wachsen, Laufschuh-Kilometer), Schweißraten-Tests und der Renntag
   mit Race Card zum Ausdrucken und Packliste für die Wechselzonen. Rechnungen in alltag-motor.js, Splits und
   Verpflegung aus dem Rennrechner (tfApp.rrKarte). */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, nf, iso, toDay, localDate, DAY, rowsOf, svgIco, setMsg, hms, mmss } = T.ui;
  const { karte, dot } = S;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const plusTage = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const datumKurz = (d) => +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.';
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const zahl = (t) => { const n = Number(String(t == null ? '' : t).replace(',', '.').trim()); return String(t == null ? '' : t).trim() === '' || !isFinite(n) ? null : n; };
  const neueId = (L) => { let id; do { id = Math.random().toString(36).slice(2, 8); } while ((L || []).some((x) => x.id === id)); return id; };
  function rechnerTeil(key, wert, ms) { // einen Teil von rechner speichern (gerätübergreifend)
    A().setRechner(Object.assign({}, A().state.rechner || {}, { [key]: wert }));
    clearTimeout(rechnerTeil.t[key]);
    rechnerTeil.t[key] = setTimeout(() => A().api('POST', '/api/rechner', { [key]: wert }).catch((e) => A().toast('Nicht gespeichert: ' + e.message)), ms == null ? 500 : ms);
  }
  rechnerTeil.t = {};

  /* =====================================================================
     MATERIAL: Räder (Kette wachsen) und Laufschuhe
     ===================================================================== */
  const WO_RAD = [['beides', 'Draußen & Rolle'], ['draussen', 'Nur draußen'], ['rolle', 'Nur Rolle']];
  const WO_SCHUH = [['alle', 'Straße & Trail'], ['strasse', 'Straße & Bahn'], ['trail', 'Nur Trail']];
  function material() { const m = (A().state.rechner || {}).material; return { items: m && Array.isArray(m.items) ? JSON.parse(JSON.stringify(m.items)) : [], zu: m && m.zu && typeof m.zu === 'object' ? Object.assign({}, m.zu) : {} }; }
  function materialSpeichern(m) {
    const ids = new Set((A().raw('garmin_einheiten') || []).map((e) => String(e.id))); // Zuordnungen zu gelöschten Einheiten aufräumen
    Object.keys(m.zu).forEach((k) => { if (!ids.has(k)) delete m.zu[k]; });
    const zk = Object.keys(m.zu); if (zk.length > 300) zk.slice(0, zk.length - 300).forEach((k) => delete m.zu[k]);
    rechnerTeil('material', m);
  }
  const stand = () => M().materialStand({ material: material(), einheiten: A().raw('garmin_einheiten') || [], heute: localDate() });
  const jetztLokal = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0') + 'T' + String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };
  let matForm = null, matZeigeAlle = false;
  function renderMaterial() {
    const box = $('#material-box'); if (!box) return;
    const st = stand(), mat = material(), R = st.items.filter((x) => x.art === 'rad'), Sch = st.items.filter((x) => x.art === 'schuh');
    const teile = [];
    const zeile = (it) => {
      const voll = Math.min(1, it.anteil), farbe = it.aus ? 'gray' : it.art === 'rad' ? (it.anteil >= 1 ? 'red' : it.anteil >= 0.8 ? 'orange' : 'teal') : it.anteil >= 1 ? 'red' : it.anteil >= 0.9 ? 'orange' : 'mint';
      const kopf = el('div', { class: 'tf-mat-k' }, el('b', { text: it.name + (it.std ? ' · Standard' : '') + (it.aus ? ' · ausgemustert' : '') }),
        el('span', { class: 'num', text: it.art === 'rad' ? nf(it.kmWachs) + ' / ' + nf(it.zielKm) + ' km' : nf(it.km) + ' / ' + nf(it.zielKm) + ' km' }));
      const unter = it.art === 'rad'
        ? 'seit dem Wachsen' + (it.wachs ? ' am ' + datumKurz(it.wachs) : ' (noch nie eingetragen)') + ' · gesamt ' + nf(it.km) + ' km, davon ' + nf(it.kmRolle) + ' km Rolle' + (it.geschaetzt ? ' (teils aus der Zeit geschätzt)' : '')
        : it.n + (it.n === 1 ? ' Lauf' : ' Läufe') + (it.letzte ? ' · zuletzt ' + datumKurz(it.letzte) : '') + (it.km0 ? ' · ' + nf(it.km0) + ' km vorher' : '');
      const akt = el('div', { class: 'tf-mat-a' });
      if (it.art === 'rad' && !it.aus) { const w = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' + (it.anteil >= 1 ? ' tf-btn-primary' : '') }, svgIco('i-check'), ' Gerade gewachst'); w.addEventListener('click', () => { const m = material(), x = m.items.find((y) => y.id === it.id); x.wachs = jetztLokal(); materialSpeichern(m); T.neu(); A().toast(it.name + ': Kette gewachst – Zähler läuft neu'); }); akt.appendChild(w); }
      const ed = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-plain' }, svgIco('i-edit'), ' Ändern'); ed.addEventListener('click', () => { matForm = Object.assign({}, mat.items.find((y) => y.id === it.id)); T.neu(); });
      akt.appendChild(ed);
      return el('div', { class: 'tf-mat-z' + (it.aus ? ' aus' : ''), style: '--c:var(--tf-' + farbe + ')' }, kopf, el('span', { class: 'tf-mat-bar' }, el('i', { style: 'width:' + (voll * 100).toFixed(1) + '%' })), el('small', { text: unter }), akt);
    };
    const c1 = karte({ farbe: 'teal', icon: 'i-chain', titel: 'Räder', sub: R.length ? 'Kilometer seit dem letzten Wachsen – automatisch aus Garmin' : 'Trag dein Rad ein – die App zählt die Kilometer bis zum nächsten Wachsen', id: 'karte-mat-rad' });
    R.filter((x) => !x.aus || matZeigeAlle).forEach((it) => c1.appendChild(zeile(it)));
    c1.appendChild(el('p', { class: 'tf-note', text: 'Heißwachs hält meist 300–500 km, Tropfwachs eher 150–300 km – trag ein, was der Hersteller deines Wachses sagt. Fahrten auf der Rolle zählen mit, verschmutzen die Kette aber weniger.' }));
    const c2 = karte({ farbe: 'mint', icon: 'i-shoe', titel: 'Laufschuhe', sub: Sch.length ? 'Kilometer je Paar – automatisch aus Garmin' : 'Trag deine Schuhe ein – auch für die Rotation', id: 'karte-mat-schuh' });
    Sch.filter((x) => !x.aus || matZeigeAlle).forEach((it) => c2.appendChild(zeile(it)));
    c2.appendChild(el('p', { class: 'tf-note', text: 'Wie lange ein Schuh hält, ist sehr verschieden – häufig genannt werden 500–800 km. Die Zahl ist ein Richtwert, den du selbst festlegst. Wer zwei Paare abwechselt, verletzt sich in Studien etwas seltener.' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Malisoux et al., Scand J Med Sci Sports 2015 (Schuhrotation)' })));
    teile.push(c1, c2);
    // Formular
    const c3 = karte({ farbe: 'gray', icon: matForm && matForm.id ? 'i-edit' : 'i-plus', titel: matForm && matForm.id ? 'Ändern: ' + matForm.name : 'Neu eintragen', id: 'karte-mat-form' });
    c3.appendChild(materialFormular());
    teile.push(c3);
    // letzte Einheiten zuordnen
    const L = st.einheiten.slice(0, 15), items = st.items.filter((x) => !x.aus || L.some((e) => e.item === x.id));
    if (L.length && st.items.length) {
      const c4 = karte({ farbe: 'indigo', icon: 'i-list', titel: 'Letzte Einheiten', sub: 'Falsches Rad oder anderer Schuh? Hier umstellen', span2: true, id: 'karte-mat-einheiten' });
      const tab = el('div', { class: 'tf-mat-liste' });
      L.forEach((e) => {
        const sel = el('select', { class: 'tf-input tf-input-klein', 'aria-label': 'Material für die Einheit vom ' + datumKurz(e.date) });
        sel.appendChild(el('option', { value: '', text: e.item && !e.fest ? (items.find((x) => x.id === e.item) || {}).name + ' · automatisch' : 'automatisch' }));
        items.filter((x) => x.art === e.art).forEach((x) => sel.appendChild(el('option', { value: x.id, text: x.name })));
        sel.appendChild(el('option', { value: 'x', text: 'keins' }));
        sel.value = e.fest ? (material().zu[e.id] || '') : '';
        sel.addEventListener('change', () => { const m = material(); if (sel.value) m.zu[e.id] = sel.value; else delete m.zu[e.id]; materialSpeichern(m); T.neu(); });
        tab.appendChild(el('div', { class: 'tf-mat-e' }, el('span', { text: datumKurz(e.date) }), el('span', { text: { draussen: 'Rad', rolle: 'Rolle', strasse: 'Lauf', trail: 'Trail' }[e.kat] }), el('b', { class: 'num', text: nf(e.km, e.km < 10 ? 1 : 0) + ' km' + (e.geschaetzt ? '*' : '') }), sel));
      });
      c4.appendChild(tab);
      if (L.some((e) => e.geschaetzt)) c4.appendChild(el('p', { class: 'tf-note', text: '* Rolle ohne Strecke: aus der Zeit geschätzt (etwa 30 km/h).' }));
      teile.push(c4);
    }
    const aus = st.items.filter((x) => x.aus).length;
    const extra = [];
    if (aus) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, matZeigeAlle ? 'Ausgemusterte ausblenden' : aus + ' ausgemusterte zeigen'); b.addEventListener('click', () => { matZeigeAlle = !matZeigeAlle; T.neu(); }); extra.push(el('div', { class: 'tf-form-actions' }, b)); }
    box.replaceChildren(el('div', { class: 'tf-grid' }, ...teile), ...extra);
  }
  function materialFormular() {
    const F = matForm || { art: 'rad', wo: 'beides', ziel: 300, seit: localDate() };
    const wrap = el('div', { class: 'tf-mat-form' });
    const artSeg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Art' });
    [['rad', 'Rad'], ['schuh', 'Laufschuh']].forEach(([v, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(F.art === v), disabled: !!F.id }, t); b.addEventListener('click', () => { matForm = Object.assign({}, F, { art: v, wo: v === 'rad' ? 'beides' : 'alle', ziel: v === 'rad' ? 300 : 700 }); T.neu(); }); artSeg.appendChild(b); });
    const name = el('input', { class: 'tf-input', maxlength: 40, value: F.name || '', placeholder: F.art === 'rad' ? 'z. B. Zeitfahrrad' : 'z. B. Daily Trainer', 'aria-label': 'Name' });
    const wo = el('select', { class: 'tf-input', 'aria-label': 'Wofür' }, ...(F.art === 'rad' ? WO_RAD : WO_SCHUH).map(([v, t]) => el('option', { value: v, text: t })));
    wo.value = F.wo || (F.art === 'rad' ? 'beides' : 'alle');
    const ziel = el('input', { class: 'tf-input', inputmode: 'numeric', value: F.ziel ? String(F.ziel) : '', 'aria-label': F.art === 'rad' ? 'Wachs-Intervall in km' : 'Lebensdauer in km' });
    const km0 = el('input', { class: 'tf-input', inputmode: 'numeric', value: F.km0 ? String(F.km0) : '', placeholder: '0', 'aria-label': 'Kilometer vorher' });
    const seit = el('input', { class: 'tf-input', type: 'date', value: F.seit || '', max: localDate(), 'aria-label': 'Zählen ab' });
    const std = el('input', { type: 'checkbox', checked: !!F.std });
    const aus = el('input', { type: 'checkbox', checked: !!F.aus });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, F.id ? 'Speichern' : 'Hinzufügen');
    ok.addEventListener('click', () => {
      const n = name.value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40), z = Math.round(zahl(ziel.value) || 0), k0 = Math.round(zahl(km0.value) || 0);
      if (!n) { setMsg(msg, 'Bitte einen Namen eintragen.', true); return; }
      if (!(z >= 50 && z <= 5000)) { setMsg(msg, F.art === 'rad' ? 'Wachs-Intervall bitte zwischen 50 und 5.000 km.' : 'Lebensdauer bitte zwischen 50 und 5.000 km.', true); return; }
      if (!(k0 >= 0 && k0 <= 100000)) { setMsg(msg, 'Kilometer vorher: bitte 0 bis 100.000.', true); return; }
      const m = material();
      if (!F.id && m.items.length >= 20) { setMsg(msg, 'Höchstens 20 Einträge – lösch bitte alte.', true); return; }
      const x = F.id ? m.items.find((y) => y.id === F.id) : { id: neueId(m.items), art: F.art };
      Object.assign(x, { name: n, wo: wo.value, ziel: z, km0: k0, seit: seit.value || null, std: std.checked, aus: aus.checked });
      if (x.std) m.items.forEach((y) => { if (y !== x && y.art === x.art && y.wo === x.wo) y.std = false; }); // je Art und Einsatz nur ein Standard
      if (!F.id) m.items.push(x);
      matForm = null; materialSpeichern(m); T.neu(); A().toast(F.id ? 'Gespeichert' : n + ' eingetragen');
    });
    const abb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen'); abb.addEventListener('click', () => { matForm = null; T.neu(); });
    const weg = F.id ? el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-danger' }, 'Löschen') : null;
    let sicherFrage = false;
    if (weg) weg.addEventListener('click', () => { if (!sicherFrage) { sicherFrage = true; weg.textContent = 'Wirklich löschen?'; setTimeout(() => { sicherFrage = false; weg.textContent = 'Löschen'; }, 4000); return; } const m = material(); m.items = m.items.filter((y) => y.id !== F.id); Object.keys(m.zu).forEach((k) => { if (m.zu[k] === F.id) delete m.zu[k]; }); matForm = null; materialSpeichern(m); T.neu(); });
    wrap.append(...[el('div', { class: 'tf-field' }, el('span', { text: 'Was?' }), artSeg),
      el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Name' }), name), el('label', { class: 'tf-field' }, el('span', { text: F.art === 'rad' ? 'Fährst du es …' : 'Läufst du ihn …' }), wo)),
      el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: F.art === 'rad' ? 'Wachsen alle … km' : 'Lebensdauer in km' }), ziel), el('label', { class: 'tf-field' }, el('span', { text: 'Schon gefahren/gelaufen (km)' }), km0)),
      el('label', { class: 'tf-field' }, el('span', { text: 'Einheiten zählen ab' }), seit),
      el('label', { class: 'tf-gym-check' }, std, ' Standard für ' + (F.art === 'rad' ? 'diesen Einsatz – bekommt alle passenden Fahrten' : 'diesen Untergrund – bekommt alle passenden Läufe')),
      F.id ? el('label', { class: 'tf-gym-check' }, aus, ' Ausgemustert – zählt nicht mehr mit') : null,
      el('div', { class: 'tf-form-actions' }, ok, F.id || matForm ? abb : null, weg, msg)].filter(Boolean));
    return wrap;
  }

  /* =====================================================================
     SCHWEISSRATE: wiegen vor und nach dem Training
     ===================================================================== */
  function tests() { const c = (A().state.rechner || {}).schweiss; return c && Array.isArray(c.tests) ? JSON.parse(JSON.stringify(c.tests)) : []; }
  let swForm = null;
  function renderSchweiss() {
    const box = $('#schweiss-box'); if (!box) return;
    const L = tests(), P = M().schweissProfil(L), kg = athlet().gewicht_ref_kg || 75;
    const F = swForm || (swForm = { b: 'mild', sport: 'rad', d: localDate() });
    const c1 = karte({ farbe: 'blue', icon: 'i-drop', titel: 'Test eintragen', sub: 'Etwa 1 Stunde im Renntempo, vorher und nachher wiegen', id: 'karte-sw-neu' });
    const seg = (items, cur, on, label) => { const b = el('div', { class: 'tf-seg', role: 'group', 'aria-label': label }); items.forEach(([v, t]) => { const x = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, t); x.addEventListener('click', () => on(v)); b.appendChild(x); }); return b; };
    const feld = (t, inp) => el('label', { class: 'tf-field' }, el('span', { text: t }), inp);
    const ein = (k, ph, mode) => { const i = el('input', { class: 'tf-input', inputmode: mode || 'decimal', placeholder: ph, value: F[k] != null ? String(F[k]).replace('.', ',') : '', 'aria-label': ph }); i.addEventListener('input', () => { F[k] = zahl(i.value); rechne(); }); return i; };
    const erg = el('p', { class: 'tf-kw-erg', 'aria-live': 'polite' });
    function rechne() {
      const r = M().schweissRate({ min: F.min, vor: F.vor, nach: F.nach, ml: F.ml, pipi: F.pipi });
      erg.textContent = !r ? 'Trag Dauer und Gewicht vorher und nachher ein.' : !r.ok ? 'Das Ergebnis (' + nf(r.lh, 2) + ' l/h) wirkt unrealistisch – stimmen Gewicht und Getrunkenes?' : 'Schweißrate: ' + nf(r.lh, 2) + ' l pro Stunde · Gewichtsverlust ' + nf(r.pct, 1) + ' %' + (r.pct > 2 ? ' – mehr als 2 %, da hätte mehr Trinken geholfen.' : '.');
    }
    const b = el('div', { class: 'tf-field' }, el('span', { text: 'Bedingungen' }), seg(Object.entries(M().BEDINGUNG).map(([k, t]) => [k, t.replace(/ \(.*\)/, '')]), F.b, (v) => { F.b = v; T.neu(); }, 'Bedingungen'));
    const sp = el('div', { class: 'tf-field' }, el('span', { text: 'Sport' }), seg([['rad', 'Rad'], ['lauf', 'Laufen']], F.sport, (v) => { F.sport = v; T.neu(); }, 'Sport'));
    const dIn = el('input', { class: 'tf-input', type: 'date', value: F.d, max: localDate(), 'aria-label': 'Datum' }); dIn.addEventListener('input', () => { F.d = dIn.value; });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Test speichern');
    ok.addEventListener('click', () => {
      const r = M().schweissRate({ min: F.min, vor: F.vor, nach: F.nach, ml: F.ml, pipi: F.pipi });
      if (!r) { setMsg(msg, 'Bitte Dauer (ab 20 min) und beide Gewichte eintragen.', true); return; }
      if (!r.ok) { setMsg(msg, 'Das Ergebnis wirkt unrealistisch – bitte prüfen.', true); return; }
      if (!/^\d{4}-\d\d-\d\d$/.test(F.d || '')) { setMsg(msg, 'Bitte ein Datum wählen.', true); return; }
      const L2 = tests(); L2.push({ d: F.d, b: F.b, sport: F.sport, min: Math.round(F.min), vor: +F.vor, nach: +F.nach, ml: Math.round(F.ml || 0), pipi: Math.round(F.pipi || 0) });
      L2.sort((x, y) => (x.d < y.d ? -1 : 1));
      rechnerTeil('schweiss', { tests: L2.slice(-40) }, 300); swForm = null; T.neu(); A().toast('Gespeichert: ' + nf(r.lh, 2) + ' l/h');
    });
    c1.append(b, sp,
      el('div', { class: 'tf-gym-2' }, feld('Dauer (min)', ein('min', 'z. B. 60', 'numeric')), feld('Datum', dIn)),
      el('div', { class: 'tf-gym-2' }, feld('Gewicht vorher (kg)', ein('vor', 'z. B. 80,4')), feld('Gewicht nachher (kg)', ein('nach', 'z. B. 79,3'))),
      el('div', { class: 'tf-gym-2' }, feld('Getrunken (ml)', ein('ml', 'z. B. 500', 'numeric')), feld('Toilette (ml, falls)', ein('pipi', 'meist 0', 'numeric'))),
      erg, el('div', { class: 'tf-form-actions' }, ok, msg));
    rechne();
    const c2 = karte({ farbe: 'indigo', icon: 'i-list', titel: 'So machst du den Test', id: 'karte-sw-anleitung' });
    c2.append(el('ol', { class: 'tf-steps' }, ...['Vorher zur Toilette, dann ohne Kleidung wiegen.', 'Etwa 60 Minuten im Renntempo trainieren, unter den Bedingungen, die du messen willst.', 'Alles, was du trinkst, messen – am einfachsten die Flasche vorher und nachher wiegen.', 'Danach abtrocknen und wieder ohne Kleidung wiegen.', 'Schweißrate = Gewicht vorher − nachher + Getrunkenes (− Toilette), pro Stunde.'].map((t) => el('li', { text: t }))),
      el('p', { class: 'tf-note', text: 'Die Schweißrate schwankt mit Hitze, Tempo und Fitness stark – zwischen 0,5 und über 2 Litern pro Stunde. Deshalb je Bedingung messen. Ziel im Rennen: höchstens etwa 2 % des Körpergewichts verlieren, aber nie mehr trinken, als du schwitzt.' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Sawka et al., Med Sci Sports Exerc 2007 (ACSM) · Baker, Sports Med 2017' })));
    const teile = [c1, c2];
    if (L.length) {
      const c3 = karte({ farbe: 'blue', icon: 'i-drop', titel: 'Deine Schweißraten', sub: P.gesamt ? 'Im Mittel ' + nf(P.gesamt.lh, 2) + ' l/h – fließt in Rennrechner und Trinkziel ein' : 'Noch kein gültiger Test', span2: true, id: 'karte-sw-profil' });
      const je = Object.entries(M().BEDINGUNG).map(([k, t]) => { const x = P.je[k]; return el('div', { class: 'tf-sw-b' + (x ? '' : ' leer') }, el('small', { text: t }), el('b', { class: 'num', text: x ? nf(x.lh, 2) + ' l/h' : '–' }), el('em', { text: x ? (x.n === 1 ? '1 Test' : x.n + ' Tests') + ' · trinken ≈ ' + nf(Math.max(0, Math.round((x.lh * 1000 - (20 * kg) / 3) / 50) * 50)) + ' ml/h im 3-h-Rennen' : 'noch kein Test' })); });
      c3.appendChild(el('div', { class: 'tf-sw-raster' }, ...je));
      const liste = el('div', { class: 'tf-lab-liste' });
      P.tests.forEach((t) => {
        const x = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': 'Test vom ' + datumKurz(t.d) + ' löschen' }, svgIco('i-x'));
        x.addEventListener('click', () => { const L2 = tests().filter((y) => !(y.d === t.d && y.b === t.b && y.min === t.min && y.vor === t.vor && y.nach === t.nach)); rechnerTeil('schweiss', { tests: L2 }, 300); T.neu(); });
        liste.appendChild(el('div', { class: 'tf-lab-z' }, el('span', { text: datumKurz(t.d) + t.d.slice(2, 4) }), el('b', { class: 'num', text: nf(t.r.lh, 2) + ' l/h' }), el('small', { text: M().BEDINGUNG[t.b].replace(/ \(.*\)/, '') + ' · ' + (t.sport === 'lauf' ? 'Laufen' : 'Rad') + ' · ' + t.min + ' min · −' + nf(t.r.pct, 1) + ' %' }), x));
      });
      c3.appendChild(liste);
      teile.push(c3);
    }
    box.replaceChildren(el('div', { class: 'tf-grid' }, ...teile));
  }

  /* =====================================================================
     RENNTAG: Race Card und Packliste
     ===================================================================== */
  const PACK = { // Gruppen und Einträge je Sportart
    tri: [
      ['vorher', 'Vor dem Start', ['Startunterlagen und Ausweis', 'Zeitmess-Chip mit Band', 'Startnummernband', 'Einteiler oder Wettkampfkleidung', 'Frühstück und Getränk für den Morgen', 'Luftpumpe', 'Sonnencreme', 'Anti-Scheuer-Creme', 'Uhr und Radcomputer geladen']],
      ['schwimmen', 'Schwimmen', ['Neoprenanzug', 'Schwimmbrille (getönt und klar)', 'Badekappe vom Veranstalter', 'Gleitmittel für den Neo']],
      ['t1', 'Wechsel 1 · Rad', ['Helm mit Startnummer', 'Radschuhe', 'Sonnenbrille', 'Flaschen nach Rezept gefüllt', 'Gels und Riegel am Rad', 'Ersatzschlauch, CO₂ und Reifenheber', 'Startnummer an der Sattelstütze', 'Kleines Handtuch']],
      ['t2', 'Wechsel 2 · Laufen', ['Laufschuhe mit Schnellschnürung', 'Kappe oder Visor', 'Startnummer vorne am Band', 'Gels für den Lauf', 'Socken (falls gewohnt)']],
      ['danach', 'Danach', ['Warme Kleidung', 'Wechselkleidung', 'Essen und Getränk', 'Badelatschen']],
    ],
    lauf: [
      ['vorher', 'Vor dem Start', ['Startnummer und Sicherheitsnadeln', 'Zeitmess-Chip', 'Laufschuhe (eingelaufen)', 'Wettkampfkleidung', 'Uhr geladen', 'Frühstück für den Morgen', 'Anti-Scheuer-Creme', 'Gels für unterwegs']],
      ['danach', 'Danach', ['Warme Kleidung', 'Wechselkleidung', 'Essen und Getränk']],
    ],
    rad: [
      ['vorher', 'Vor dem Start', ['Startnummer und Chip', 'Helm', 'Radschuhe', 'Sonnenbrille', 'Flaschen nach Rezept gefüllt', 'Gels und Riegel', 'Ersatzschlauch, CO₂ und Reifenheber', 'Luftpumpe', 'Radcomputer und Powermeter geladen']],
      ['danach', 'Danach', ['Warme Kleidung', 'Essen und Getränk']],
    ],
    schwimmen: [
      ['vorher', 'Vor dem Start', ['Schwimmbrille und Ersatzbrille', 'Badekappe', 'Neoprenanzug (Freiwasser)', 'Gleitmittel', 'Zeitmess-Chip', 'Handtuch']],
      ['danach', 'Danach', ['Warme Kleidung', 'Essen und Getränk']],
    ],
  };
  PACK.mehr = PACK.tri;
  const packKey = (txt) => txt.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '').slice(0, 24);
  function renntag() { const r = (A().state.rechner || {}).renntag; return { pack: r && r.pack && typeof r.pack === 'object' ? JSON.parse(JSON.stringify(r.pack)) : {}, eigene: r && Array.isArray(r.eigene) ? r.eigene.slice() : [] }; }
  function renderRenntag() {
    const box = $('#renntag-box'); if (!box) return;
    const K = sicher(() => (T.rrKarte ? T.rrKarte() : null));
    if (!K) { box.replaceChildren(el('p', { class: 'tf-note', text: 'Der Rennrechner ist noch nicht bereit.' })); return; }
    T.kopf({ sub: (K.item.lang || K.item.name) + ' – wie im Rennrechner eingestellt' });
    const wahl = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-clock'), ' Im Rennrechner ändern');
    wahl.addEventListener('click', () => T.geh('training/rechner'));
    const druck = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-print'), ' Drucken oder als PDF');
    druck.addEventListener('click', () => { document.body.classList.add('tf-druck-rc'); const weg = () => { document.body.classList.remove('tf-druck-rc'); window.removeEventListener('afterprint', weg); }; window.addEventListener('afterprint', weg); setTimeout(() => { window.print(); setTimeout(weg, 1500); }, 50); });
    box.replaceChildren(el('div', { class: 'tf-form-actions tf-rc-akt' }, druck, wahl), raceCard(K), packliste(K));
  }
  const warnung = (t) => [el('span', { class: 'tf-rc-warn', text: t })];
  function raceCard(K) {
    const a = K.a, s = K.s, item = K.item, g = K.g;
    const sz = (rowsOf('saison') || [])[0];
    const titel = sz && sz.ziel_sport === item.sport && sz.ziel_distanz === item.id && sz.ziel_name ? sz.ziel_name : item.lang || item.name;
    const c = el('article', { class: 'tf-card tf-span2 tf-rc', id: 'race-card' });
    const kurz = (t) => (t >= 3600 ? hms(t) : mmss(t));
    const strecken = [g.swim ? nf(g.swim.km, g.swim.km % 1 ? 1 : 0) + ' km Schwimmen' : null, g.bike ? nf(g.bike.km) + ' km Rad' : null, g.run1 ? nf(g.run1.km, g.run1.km % 1 ? 1 : 0) + ' km Lauf 1' : null, g.run ? nf(g.run.km, g.run.km % 1 ? 1 : 0) + ' km ' + (g.run1 ? 'Lauf 2' : 'Laufen') : null].filter(Boolean).join(' · ');
    const unter = [titel !== (item.lang || item.name) ? item.lang || item.name : null, strecken, sz && sz.ziel_datum && sz.ziel_sport === item.sport ? datumKurz(sz.ziel_datum) + sz.ziel_datum.slice(0, 4) : null].filter(Boolean).join(' · ');
    c.appendChild(el('div', { class: 'tf-rc-kopf' }, el('div', null, el('small', { text: 'Race Card' }), el('h2', { text: titel }), el('p', { text: unter })),
      el('div', { class: 'tf-rc-ziel' }, el('small', { text: 'Prognose' }), el('b', { class: 'num', text: hms(K.total) }), s.ziel_s ? el('span', { text: 'Ziel ' + hms(s.ziel_s) }) : null)));
    // Splits
    const NAME = { swim: 'Schwimmen', t1: 'Wechsel 1', bike: 'Rad', t2: 'Wechsel 2', run: 'Laufen' };
    let uhr = 0;
    c.appendChild(el('div', { class: 'tf-rc-splits' }, ...K.legs.map((l) => { uhr += l.t || 0; return el('div', { class: 'tf-rc-s tf-rc-' + l.typ }, el('small', { text: l.typ === 'run' && g.run1 ? (l.run1 ? 'Lauf 1' : 'Lauf 2') : NAME[l.typ] }), el('b', { class: 'num', text: kurz(l.t || 0) }), el('span', { text: 'Uhr ' + hms(uhr) })); })));
    const teil = (cls, titel2, zeilen) => c.appendChild(el('div', { class: 'tf-rc-teil ' + cls }, el('h3', { text: titel2 }), el('ul', null, ...zeilen.filter(Boolean).map((z) => el('li', null, ...[].concat(z))))));
    if (g.swim) {
      const pace = s.swim_s / (g.swim.km * 10);
      teil('swim', 'Schwimmen · ' + nf(g.swim.km, 1) + ' km', [['Tempo ', el('b', { text: mmss(pace) + ' /100 m' }), s.neo ? ' mit Neo' : ''], 'Die ersten 200 m kontrolliert, dann in deinen Rhythmus – Orientierung alle 6–8 Züge.']);
    }
    if (g.bike && K.bkr) {
      const D = g.bike.km, lang = D >= 90, cap = Math.round(s.watt * (lang ? 1.1 : 1.15) / 5) * 5, IF = K.bkr.np / K.ftp;
      teil('bike', 'Rad · ' + nf(D) + ' km', [
        ['Flach: ', el('b', { text: Math.round(s.watt) + ' W' }), ' (' + Math.round(IF * 100) + ' % FTP' + (K.bikeBand ? ', Korridor ' + Math.round(K.bikeBand[0] * 100) + '–' + Math.round(K.bikeBand[1] * 100) + ' %' : '') + ')'],
        ['Bergauf höchstens ', el('b', { text: cap + ' W' }), ' – Spitzen kosten im Lauf mehr, als sie auf dem Rad bringen.'],
        'Bergab weiter treten bis etwa 50 km/h, dann in der Aero-Position rollen.',
        ['Tempo etwa ', el('b', { text: nf((D / K.bkr.t) * 3600, 1) + ' km/h' }), ' · NP ' + Math.round(K.bkr.np) + ' W · ' + nf(K.bkr.kj) + ' kJ'],
        K.bikeBand && IF > K.bikeBand[1] + 0.005 ? warnung('Achtung: ' + Math.round(IF * 100) + ' % FTP liegen über deinem Korridor (bis ' + Math.round(K.bikeBand[1] * 100) + ' %) – das kostet im Lauf. Passt die Zielzeit zu deiner Form?') : null,
      ]);
    }
    if (g.run && K.rnr) {
      const band = g.run.band, lo = K.runRef / band[1], hi = K.runRef / band[0];
      teil('run', (g.run1 ? 'Lauf 2' : 'Laufen') + ' · ' + nf(g.run.km, g.run.km % 1 ? 1 : 0) + ' km', [
        ['Ziel-Tempo ', el('b', { text: mmss(s.run_pace) + ' /km' }), ' · Korridor ' + mmss(lo) + '–' + mmss(hi) + ' /km (' + Math.round(band[0] * 100) + '–' + Math.round(band[1] * 100) + ' % ' + K.runRefName + ')'],
        g.run.km >= 15 ? 'Die ersten Kilometer bewusst am langsamen Ende – „bis km 15 geduldig“.' : 'Den ersten Kilometer kontrolliert, dann ins Renntempo.',
        g.run.km >= 10 && s.fade_s ? 'Eingeplant: ab km ' + s.fade_ab + ' bis zu ' + s.fade_s + ' s/km langsamer.' : null,
        K.runRef && s.run_pace && K.runRef / s.run_pace > band[1] + 0.02 ? warnung('Achtung: Dein Ziel-Tempo liegt bei ' + Math.round((100 * K.runRef) / s.run_pace) + ' % deines ' + K.runRefName + '-Tempos – schneller als der Rennbereich. Passt die Zielzeit zu deiner Form, oder stimmt ' + K.runRefName + ' im Profil noch?') : null,
      ]);
    }
    // Verpflegung alle 20 Minuten
    if (K.fuel) {
      const f = K.fuel, rows = [];
      let start = 0; const off = {}; K.legs.forEach((l) => { off[l.typ + (l.run1 ? '1' : '')] = start; start += l.t || 0; });
      f.F.forEach((x) => {
        const radStart = x.leg === 'rad' ? off.bike : x.name === 'Lauf 1' ? off.run1 : off.run;
        for (let t = 20; t <= x.T - 5; t += 20) {
          const gels = x.gels.filter((m) => m > t - 20 && m <= t).length;
          const fl = x.leg === 'rad' ? f.flH / 3 : 0, g2 = Math.round(fl * (K.s.fu_flasche_g || 0) + gels * f.gel);
          const was = [fl ? '⅓ Flasche (' + Math.round(fl * 750) + ' ml)' : (f.trinken >= 150 ? 'Wasser an der Verpflegung' : null), gels ? (gels === 1 ? 'Gel' : gels + ' Gels') : null].filter(Boolean).join(' + ');
          rows.push([x.name, Math.round(t), hms((radStart || 0) + t * 60), was || 'Trinken nach Durst', g2]);
        }
      });
      const tab = el('table', { class: 'tf-rc-tab' }, el('thead', null, el('tr', null, ...['Abschnitt', 'Min.', 'Rennuhr', 'Was', 'KH'].map((t) => el('th', { text: t })))),
        el('tbody', null, ...rows.map((r) => el('tr', null, el('td', { text: r[0] }), el('td', { class: 'num', text: String(r[1]) }), el('td', { class: 'num', text: r[2] }), el('td', { text: r[3] }), el('td', { class: 'num', text: r[4] ? r[4] + ' g' : '' })))));
      c.appendChild(el('div', { class: 'tf-rc-teil fuel' }, el('h3', { text: 'Verpflegung alle 20 Minuten' }),
        el('p', { class: 'tf-rc-fl', text: (K.g.bike ? 'Flasche: ' + (K.s.fu_flasche_g ? K.s.fu_flasche_g + ' g Kohlenhydrate auf 750 ml (' + M().flasche(K.s.fu_flasche_g).malto + ' g Maltodextrin + ' + M().flasche(K.s.fu_flasche_g).frukt + ' g Fruktose)' : 'nur Wasser') + ' · ' : '') + 'Gel: ' + f.gel + ' g · Trinken: ' + (f.trinken < 150 ? 'nach Durst' : 'etwa ' + nf(f.trinken) + ' ml/h') + ' · Gesamt: ' + nf(f.khR + f.khL) + ' g Kohlenhydrate' }),
        tab));
    }
    c.appendChild(el('p', { class: 'tf-rc-fuss', text: 'Tagesform · Werte aus deinem Rennrechner und Profil (FTP ' + K.ftp + ' W, CSS ' + mmss(a.css_s_100m) + ', ' + K.runRefName + '-Tempo ' + mmss(K.runRef || 0) + ') · Pacing: Swain, Med Sci Sports Exerc 1997 · Atkinson et al., Sports Med 2007' }));
    return c;
  }
  function packliste(K) {
    const sport = K.item.sport, key = K.item.sport + '_' + K.item.id, R = renntag(), haken = R.pack[key] || {};
    const gruppen = (PACK[sport] || PACK.tri).map(([gid, name, L]) => [gid, name, L.map((t) => ({ id: packKey(t), t })).concat(R.eigene.filter((e) => e.g === gid && (!e.s || e.s === sport)).map((e) => ({ id: 'e' + e.id, t: e.t, eigen: e.id })))]);
    const alle = gruppen.flatMap((x) => x[2]), fertig = alle.filter((x) => haken[x.id]).length;
    const c = karte({ farbe: 'orange', icon: 'i-bag', titel: 'Packliste', sub: fertig + ' von ' + alle.length + ' gepackt', span2: true, id: 'karte-packliste' });
    const umschalten = (id) => { const R2 = renntag(); R2.pack[key] = Object.assign({}, R2.pack[key] || {}); if (R2.pack[key][id]) delete R2.pack[key][id]; else R2.pack[key][id] = 1; rechnerTeil('renntag', R2, 600); T.neu(); };
    gruppen.forEach(([gid, name, L]) => {
      c.appendChild(el('h3', { class: 'tf-pack-g', text: name }));
      c.appendChild(el('div', { class: 'tf-pack' }, ...L.map((x) => {
        const b = el('button', { type: 'button', class: 'tf-pack-i' + (haken[x.id] ? ' an' : ''), 'aria-pressed': String(!!haken[x.id]) }, el('span', { class: 'tf-pack-box', 'aria-hidden': 'true' }, haken[x.id] ? svgIco('i-check') : null), el('span', { text: x.t }));
        b.addEventListener('click', () => umschalten(x.id));
        if (!x.eigen) return b;
        const weg = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': x.t + ' entfernen' }, svgIco('i-x'));
        weg.addEventListener('click', () => { const R2 = renntag(); R2.eigene = R2.eigene.filter((e) => e.id !== x.eigen); rechnerTeil('renntag', R2, 300); T.neu(); });
        return el('div', { class: 'tf-pack-eigen' }, b, weg);
      })));
    });
    const tIn = el('input', { class: 'tf-input', maxlength: 40, placeholder: 'Eigener Eintrag', 'aria-label': 'Eigener Eintrag' });
    const gSel = el('select', { class: 'tf-input', 'aria-label': 'Gruppe' }, ...gruppen.map(([gid, name]) => el('option', { value: gid, text: name })));
    const dazu = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-plus'), ' Dazu');
    dazu.addEventListener('click', () => { const t = tIn.value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40); if (!t) { tIn.focus(); return; } const R2 = renntag(); if (R2.eigene.length >= 30) return; R2.eigene.push({ id: neueId(R2.eigene), t, g: gSel.value, s: sport }); rechnerTeil('renntag', R2, 300); T.neu(); });
    const leer = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Alle Haken entfernen');
    leer.addEventListener('click', () => { const R2 = renntag(); delete R2.pack[key]; rechnerTeil('renntag', R2, 300); T.neu(); });
    c.append(el('div', { class: 'tf-pack-neu' }, tIn, gSel, dazu), el('div', { class: 'tf-form-actions' }, leer));
    return c;
  }

  /* =====================================================================
     Kurzinfos für Übersicht und Heute
     ===================================================================== */
  function kurz() {
    const out = {};
    const st = sicher(stand);
    if (st && st.items.length) {
      const f = st.items.filter((x) => x.faellig && !x.aus), r = st.items.filter((x) => x.art === 'rad' && !x.aus)[0];
      out.material = f.length ? { wert: f.length === 1 ? f[0].name : f.length + ' fällig', txt: true, sub: f.map((x) => (x.art === 'rad' ? 'Kette wachsen' : nf(x.km) + ' km')).join(' · '), ampel: 'orange', cta: false }
        : r ? { wert: nf(r.kmWachs), u: 'km', sub: r.name + ' seit dem Wachsen · von ' + nf(r.zielKm), cta: false, txt: false } : { wert: st.items.length, u: st.items.length === 1 ? 'Paar' : 'Einträge', sub: 'alles im grünen Bereich', cta: false, txt: false };
    }
    const P = sicher(() => M().schweissProfil(tests()));
    if (P && P.gesamt) out.schweiss = { wert: nf(P.gesamt.lh, 2), u: 'l/h', sub: P.gesamt.n === 1 ? '1 Test' : P.gesamt.n + ' Tests · im Mittel', cta: false, txt: false };
    const R = renntag(), n = Object.values(R.pack).reduce((x, p) => x + Object.keys(p || {}).length, 0);
    if (n) out.renntag = { sub: n + ' Dinge gepackt' };
    return out;
  }
  function heuteHinweise() {
    const st = sicher(stand); if (!st) return [];
    return st.items.filter((x) => x.faellig && !x.aus).slice(0, 2).map((x) => {
      const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + (x.art === 'rad' ? 'teal' : 'mint') + ')' }, svgIco(x.art === 'rad' ? 'i-chain' : 'i-shoe')),
        el('span', { class: 'tf-zeile-t' }, el('small', { text: x.art === 'rad' ? 'Kette wachsen' : 'Laufschuh' }), el('b', { text: x.name + ': ' + nf(x.art === 'rad' ? x.kmWachs : x.km) + ' von ' + nf(x.zielKm) + ' km' })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => T.geh('training/material'));
      return b;
    });
  }

  T.seite('material', renderMaterial);
  T.seite('schweiss', renderSchweiss);
  T.seite('renntag', renderRenntag);
  window.tfLeistung = { kurz, heuteHinweise, stand };
})();
