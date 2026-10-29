/* Tagesform · Alltag & Energie (Version 8): Fokus der App, „Dein Tag“ mit Zeitfenstern und Kohlenhydraten,
   „Heute notiert“ (Wasser, Eiweiß, Koffein, eigener Stack), Vergleich „mit / ohne“, Laborwerte, Wissen für heute
   und der Wochenrückblick. Die Rechnungen stehen in alltag-motor.js. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, nf, iso, toDay, localDate, DAY, rowsOf, heute, svgIco, col, setMsg, AMPEL } = T.ui;
  const { karte, dot } = S;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const uhr = (min) => { const t = M().uhrzeit(min); return t.charAt(0) === '0' ? t.slice(1) : t; };
  const kgTxt = (g) => nf(g) + ' g';
  const literTxt = (ml) => nf(ml / 1000, ml % 1000 ? (ml % 100 ? 2 : 1) : 0) + ' l';
  const plusTage = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const datumKurz = (d) => +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.';
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };

  /* =====================================================================
     Fokus der App: Alltag & Energie · Fitness & Gym · Performance
     ===================================================================== */
  const MODI = {
    alltag: ['Alltag & Energie', 'Schlaf, Schritte, Stress und Energie im Alltag – ohne Trainingszahlen', 'i-sun', 'teal'],
    fitness: ['Fitness & Gym', 'Krafttraining und 2–3 × Sport pro Woche – ohne Renn-Werkzeuge', 'i-dumbbell', 'purple'],
    performance: ['Performance', 'Ausdauersport mit Plan, Rennen und allen Rechnern', 'i-bolt', 'orange'],
  };
  const modus = () => { const m = athlet().modus; return MODI[m] ? m : 'performance'; }; // ohne Wahl: alles wie bisher
  const modusGesetzt = () => !!MODI[athlet().modus];
  async function setzeModus(v, msg) {
    try { if (msg) setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', { modus: v }); A().patch('athlet', [j.profil]); if (msg) setMsg(msg, 'Gespeichert.'); return true; }
    catch (e) { if (msg) setMsg(msg, e.message, true); else A().toast(e.message); return false; }
  }
  function modusWahl(msg, nachher) {
    const box = el('div', { class: 'tf-modi', role: 'group', 'aria-label': 'Fokus der App' });
    Object.entries(MODI).forEach(([k, [name, sub, icon, farbe]]) => {
      const b = el('button', { type: 'button', class: 'tf-modus', 'aria-pressed': String(modusGesetzt() && modus() === k), style: '--c:var(--tf-' + farbe + ')' },
        el('span', { class: 'tf-modus-i' }, svgIco(icon)), el('span', { class: 'tf-modus-t' }, el('b', { text: name }), el('small', { text: sub })));
      b.addEventListener('click', async () => { if (await setzeModus(k, msg) && nachher) nachher(k); });
      box.appendChild(b);
    });
    return box;
  }
  // Markierung am Wurzelelement – die Stile blenden damit Kacheln aus; der Tab „Training“ heißt im Alltag „Bewegung“
  function modusAnwenden() {
    const root = document.getElementById('tf'); if (!root) return;
    const m = modus();
    if (root.dataset.modus !== m) root.dataset.modus = m;
    $$('#bottom-nav button[data-group="training"] span, #gruppen button[data-group="training"] span').forEach((s) => { s.textContent = m === 'alltag' ? 'Bewegung' : 'Training'; });
  }
  // Heute: einmal fragen, wofür jemand die App nutzt
  function modusFrage() {
    const box = $('#home-hinweise'); if (!box) return;
    let h = box.querySelector('#hinweis-modus');
    let gefragt = false; try { gefragt = localStorage.getItem('tf:modus-gefragt') === '1'; } catch (e) { /* egal */ }
    if (modusGesetzt() || gefragt || !(rowsOf('athlet') || []).length) { if (h) h.remove(); return; }
    if (h) return;
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Später' }, svgIco('i-x'));
    x.addEventListener('click', () => { try { localStorage.setItem('tf:modus-gefragt', '1'); } catch (e) { /* egal */ } h.remove(); });
    h = el('article', { class: 'tf-card tf-hinweis tf-hinweis-modus', id: 'hinweis-modus' },
      el('span', { class: 'tf-badge', style: 'background:var(--tf-teal)' }, svgIco('i-target')),
      el('div', null, el('b', { text: 'Wofür nutzt du Tagesform?' }), el('p', { text: 'Dann zeigt die App nur, was zu dir passt. Ändern kannst du das jederzeit unter Profil → Über dich.' })),
      modusWahl(msg, (k) => { h.remove(); A().toast('Fokus: ' + MODI[k][0]); }), msg, x);
    box.prepend(h);
  }
  // Profil „Über dich“: Fokus und Aufstehzeit
  function profilFokus() {
    const k = $('#karte-ich'); if (!k) return;
    let w = k.querySelector('#ich-fokus');
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const neu = el('div', { class: 'tf-field tf-ich-fokus', id: 'ich-fokus' }, el('span', { text: 'Fokus der App' }), modusWahl(msg, () => T.neu()),
      el('small', { class: 'tf-ich-hint', text: modusGesetzt() ? 'Bestimmt, welche Bereiche und Kacheln die App zeigt – deine Daten bleiben immer erhalten.' : 'Noch nicht gewählt – die App zeigt alles.' }), msg);
    if (w) w.replaceWith(neu); else { const box = $('#ich-box', k); if (box) box.before(neu); else k.appendChild(neu); }
  }

  /* =====================================================================
     Einstellungen „Heute notiert“ (rechner.alltag): eigener Stack, sichtbare Zähler
     ===================================================================== */
  const STD_CFG = { stack: [], zeigen: { w: 1, p: 1, k: 1, s: 1 } };
  function cfg() { const c = (A().state.rechner || {}).alltag; return Object.assign({}, STD_CFG, c && typeof c === 'object' ? JSON.parse(JSON.stringify(c)) : {}, { zeigen: Object.assign({}, STD_CFG.zeigen, (c && c.zeigen) || {}) }); }
  let cfgT = null;
  function cfgSpeichern(c) {
    A().setRechner(Object.assign({}, A().state.rechner || {}, { alltag: c }));
    clearTimeout(cfgT);
    cfgT = setTimeout(() => A().api('POST', '/api/rechner', { alltag: c }).catch((e) => A().toast('Nicht gespeichert: ' + e.message)), 500);
  }

  /* =====================================================================
     Tagesprotokoll: Einträge je Tag (Wasser ml, Eiweiß g, Koffein-Uhrzeiten, Stack)
     ===================================================================== */
  const OFFEN = {}, SENDE = {};
  function tb(d) {
    if (OFFEN[d]) return OFFEN[d];
    const r = (A().raw('tagebuch') || []).find((x) => x && x.date === d);
    return r ? JSON.parse(JSON.stringify(r)) : { date: d };
  }
  function tbAendern(d, fn) {
    const r = JSON.parse(JSON.stringify(tb(d)));
    fn(r);
    OFFEN[d] = r;
    clearTimeout(SENDE[d]); SENDE[d] = setTimeout(() => tbSenden(d), 700);
    zeichneNotiert(); zeichneProtokollHeute();
  }
  async function tbSenden(d) {
    const r = OFFEN[d]; if (!r) return;
    try {
      const j = await A().api('POST', '/api/checkin', { art: 'tagebuch', date: d, w: r.w || 0, p: r.p || 0, k: r.k || [], s: r.s || {} });
      if (OFFEN[d] === r) delete OFFEN[d];
      const rest = (A().raw('tagebuch') || []).filter((x) => x && x.date !== d);
      A().patch('tagebuch', (j.row ? rest.concat([j.row]) : rest).sort((x, y) => (x.date < y.date ? -1 : 1)));
    } catch (e) { A().toast('Nicht gespeichert: ' + e.message); }
  }
  const jetztUhr = () => { const n = new Date(); return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };

  /* =====================================================================
     Tagesdaten: Tagesform, Schlaf, Check-in, Zeitfenster, Ziele
     ===================================================================== */
  function planTag(d) { return sicher(() => (window.tfPlan && tfPlan.tag ? tfPlan.tag(d) : [])) || []; }
  function trainingMin(d) { // geplant oder schon trainiert – das Größere zählt
    const geplant = planTag(d).filter((s) => s.sport !== 'mobil' && s.typ !== 'rennen').reduce((x, s) => x + (+s.min || 0), 0);
    const getan = (rowsOf('belastung') || []).filter((b) => b.date === d && b.sport !== 'wechsel').reduce((x, b) => x + (+b.min || 0), 0);
    return Math.max(geplant, getan);
  }
  function schweissLh() { const c = (A().state.rechner || {}).schweiss; const p = M().schweissProfil(c && Array.isArray(c.tests) ? c.tests : []); return p.gesamt ? p.gesamt.lh : null; }
  function ziele(d) {
    const a = athlet(), alter = a.geburtsjahr ? new Date().getFullYear() - a.geburtsjahr : null;
    return {
      w: M().wasserZiel({ geschlecht: a.geschlecht, eigen: a.wasser_ml, trainingMin: trainingMin(d || localDate()), schweissLh: schweissLh() }),
      p: M().proteinZiel({ gewicht: a.gewicht_ref_kg, modus: modus(), alter, eigen: a.protein_g }),
    };
  }
  function tagDaten() {
    const h = localDate(), a = athlet(), ohne = T.ohne();
    const E = rowsOf('erholung') || [], e = E.find((r) => r.date === h) || null;
    const g = (rowsOf('gefuehl') || []).find((r) => r.date === h) || null;
    const H = heute(), ampel = !ohne && H && H.date === h && H.score != null ? H.ampel : g ? g.ampel : null;
    let auf = null, quelle = 'standard';
    if (e && e.aufwach) { auf = M().minVon(e.aufwach); quelle = 'uhr'; }
    else if (a.aufstehen_min) { auf = +a.aufstehen_min; quelle = 'profil'; }
    else { const v = E.slice(-14).map((r) => (r.aufwach ? M().minVon(r.aufwach) : null)).filter((x) => x != null); if (v.length >= 5) { auf = M().median(v); quelle = 'schnitt'; } }
    const bedarf = (e && e.bedarf_h ? e.bedarf_h * 60 : null) || a.schlafbedarf_min || 480;
    const ck = (rowsOf('befinden') || []).find((r) => r.date === h) || null;
    const schlafMin = e && e.schlaf_h != null ? e.schlaf_h * 60 : ck && ck.schlaf_h ? ck.schlaf_h * 60 : null;
    const f = M().tagesFenster({ aufwachMin: auf, schlafbedarfMin: bedarf, ampel, quelle });
    const typ = M().tagesTyp({ ampel, schlafMin, schlafbedarfMin: bedarf, krank: ck && ck.krank, stress: ck ? ck.stress : null });
    return { h, ampel, f, typ, ck, schlafMin, bedarf, quelle, e, g };
  }
  function tipps(D) {
    const f = D.f, m = modus(), L = [];
    if (D.typ.id === 'fokus') {
      L.push(['i-target', 'Anspruchsvolles in dein Fokus-Fenster legen: ' + uhr(f.fokus[0]) + '–' + uhr(f.fokus[1]) + ' Uhr.']);
      L.push(['i-walk', 'Nach dem Mittag kommt das Tief (' + uhr(f.tief[0]) + '–' + uhr(f.tief[1]) + ') – gut für Routine und ein paar Minuten draußen.']);
      if (m !== 'alltag') L.push(['i-bolt', 'Gute Voraussetzungen für eine harte Einheit.']);
    } else if (D.typ.id === 'normal') {
      L.push(['i-target', 'Wichtiges eher am Vormittag: ' + uhr(f.fokus[0]) + '–' + uhr(f.fokus[1]) + ' Uhr.']);
      L.push(['i-walk', 'Alle 30–60 Minuten kurz aufstehen – 2–3 Minuten Gehen reichen schon.']);
      if (m !== 'alltag') L.push(['i-heart', 'Training eher locker bis mittel.']);
    } else {
      if (D.ck && D.ck.krank) L.push(['i-shield', 'Krankheitsgefühl: kein Training, viel trinken, Ruhe.']);
      L.push(['i-clock', 'Termine kurz halten – nur das Nötigste.']);
      L.push(['i-sun', '15 Minuten Spaziergang draußen: Licht und lockere Bewegung tun gut.']);
      L.push(['i-moon', 'Heute früher ins Bett: ' + uhr(f.bett) + ' Uhr.']);
    }
    return L;
  }
  function fensterChips(f, kurz) {
    const k = cfg(), L = [['i-sun', 'Tageslicht bis ' + uhr(f.licht)], ['i-coffee', 'Koffein bis ' + uhr(f.koffein)], ['i-food', (kurz ? 'Essen bis ' : 'Letzte große Mahlzeit bis ') + uhr(f.essen)], ['i-moon', 'Bett ' + uhr(f.bett)]];
    if (!k.zeigen.k) L.splice(1, 1);
    return el('div', { class: 'tf-tag-fenster' }, ...L.map(([i, t]) => el('span', { class: 'tf-chip' }, svgIco(i), el('span', { text: t }))));
  }
  const TYP_FARBE = { fokus: 'green', normal: 'yellow', schon: 'red' };

  /* ---------- Kohlenhydrate und Briefing vor Schlüsseleinheiten ---------- */
  function khHeute() {
    const h = localDate(), a = athlet();
    const geplant = planTag(h).filter((s) => s.typ !== 'rennen').map((s) => ({ sport: s.sport, min: s.min, hart: s.hart }));
    const getan = (rowsOf('belastung') || []).filter((b) => b.date === h && b.sport !== 'wechsel').map((b) => ({ sport: b.sport === 'kraft' ? 'kraft' : 'ausdauer', min: b.min }));
    const L = getan.reduce((x, b) => x + b.min, 0) > geplant.reduce((x, s) => x + s.min, 0) ? getan : geplant;
    return Object.assign(M().khBedarf({ einheiten: L, gewicht: a.gewicht_ref_kg }), { geplant: geplant.length > 0, quelle: L === getan && getan.length ? 'garmin' : geplant.length ? 'plan' : 'ruhe' });
  }
  function briefingMorgen() {
    const m = plusTage(localDate(), 1), a = athlet();
    const L = planTag(m).filter((s) => M().schluessel(s));
    if (!L.length) return null;
    const s = L.sort((x, y) => y.min - x.min)[0], rr = (A().state.rechner || {});
    const fl = Object.keys(rr).filter((k) => /^(tri|rad|mehr)_/.test(k) && rr[k] && rr[k].fu_flasche_g > 0).map((k) => +rr[k].fu_flasche_g)[0];
    const b = M().briefing({ einheit: { sport: s.sport, typ: s.typ, min: s.min, hart: s.hart }, gewicht: a.gewicht_ref_kg, khMin: a.kh_g_h_min, khMax: a.kh_g_h_max, flascheG: fl || 60, schweissLh: schweissLh() });
    return b ? Object.assign(b, { titel: (s.D && s.D.titel) || 'Schlüsseleinheit', datum: m }) : null;
  }
  function briefingBlatt(b) {
    const a = athlet(), u = b.unterwegs, std = (h) => nf(h, h % 1 ? 1 : 0) + ' h';
    const box = el('div', { class: 'tf-brief' },
      el('h2', { text: 'Morgen: ' + b.titel }),
      el('p', { class: 'tf-brief-sub', text: std(Math.round(b.stunden * 4) / 4) + ' · ' + (b.art === 'rennen' ? 'Rennen' : b.art === 'lang' ? 'lange Einheit' : 'harte Einheit') + ' – damit der Tank voll ist.' }));
    const teil = (icon, titel, ...kids) => box.appendChild(el('div', { class: 'tf-brief-teil' }, el('span', { class: 'tf-brief-i' }, svgIco(icon)), el('div', null, el('b', { text: titel }), ...kids)));
    teil('i-moon', 'Heute', el('p', { text: (b.abend.loading ? 'Kohlenhydrate laden: 36–48 h vor dem Rennen ' : 'Gut auffüllen: ') + b.abend.gkg[0] + '–' + b.abend.gkg[1] + ' g pro kg, also ' + nf(b.abend.g[0]) + '–' + nf(b.abend.g[1]) + ' g über den Tag. Abends Reis, Nudeln, Kartoffeln oder Brot – Ballaststoffe und Fett eher sparsam, damit der Magen morgen ruhig bleibt.' }));
    teil('i-sun', 'Morgen früh', el('p', { text: b.frueh.vorher + ' vorher ' + nf(b.frueh.g[0]) + '–' + nf(b.frueh.g[1]) + ' g Kohlenhydrate (1–2 g pro kg) – etwa Haferflocken mit Banane und Honig, Brötchen mit Marmelade. Dazu 300–500 ml trinken.' }));
    const fl = u.flasche;
    const kids = [el('p', { text: u.ziel > 0 ? 'Etwa ' + u.ziel + ' g pro Stunde (' + u.gh[0] + '–' + u.gh[1] + ' g/h), insgesamt rund ' + nf(u.gesamt) + ' g. Ab der ersten halben Stunde regelmäßig, alle 20 Minuten ein Teil.' : 'Unter einer Stunde braucht es unterwegs keine Kohlenhydrate.' })];
    if (u.ziel > 0) {
      kids.push(el('div', { class: 'tf-brief-rezept' }, el('small', { text: 'Flaschenrezept (750 ml)' }), el('b', { text: fl.malto + ' g Maltodextrin + ' + fl.frukt + ' g Fruktose' }), el('span', { text: '≈ ' + fl.g + ' g Kohlenhydrate, Verhältnis 1 : 0,8 – pro Stunde eine Flasche' + (u.rest > 0 ? ', dazu ' + u.rest + ' g aus Gel oder Riegel' : '') + '.' })));
      if (b.trinkenMlH) kids.push(el('p', { class: 'tf-note', text: 'Trinken: etwa ' + nf(b.trinkenMlH) + ' ml pro Stunde – aus deiner Schweißrate, damit du unter 2 % Gewichtsverlust bleibst.' }));
    }
    teil('i-drop', 'Unterwegs', ...kids);
    box.append(el('p', { class: 'tf-note', text: 'Ungewohnt hohe Mengen erst im Training testen – der Darm gewöhnt sich mit der Zeit an mehr Kohlenhydrate.' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Thomas, Erdman & Burke, Med Sci Sports Exerc 2016 (ACSM) · Jeukendrup, Sports Med 2014 · Rowlands et al., Sports Med 2015 · Cox et al., J Appl Physiol 2010' })));
    if (a.kh_g_h_min && b.rad) box.appendChild(el('p', { class: 'tf-note', text: 'Rad-Ziel aus deinem Profil: ' + a.kh_g_h_min + '–' + a.kh_g_h_max + ' g pro Stunde.' }));
    return box;
  }

  /* ---------- Heute: Karte „Dein Tag“ ---------- */
  function heuteTag() {
    const box = $('#home-tag'); if (!box) return;
    const D = tagDaten(), m = modus();
    const c = el('article', { class: 'tf-card tf-tag', id: 'karte-tag', role: 'link', tabindex: '0', 'aria-label': 'Dein Tag – Zeitfenster und Tipps' });
    const auf = () => T.geh('heute/tag');
    c.addEventListener('click', (e) => { if (e.target.closest('button')) return; auf(); });
    c.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); auf(); } });
    c.appendChild(el('div', { class: 'tf-tag-kopf' },
      el('span', { class: 'tf-badge', style: 'background:var(--tf-' + TYP_FARBE[D.typ.id] + ')' }, svgIco(D.typ.id === 'schon' ? 'i-shield' : D.typ.id === 'fokus' ? 'i-target' : 'i-sun')),
      el('div', null, el('b', { text: D.typ.titel }), el('small', { text: D.ampel ? D.typ.grund : 'Mach den Check-in – dann passt der Tag zu deiner Tagesform' })), svgIco('i-chev')));
    c.appendChild(el('ul', { class: 'tf-tag-tipps' }, ...tipps(D).slice(0, 3).map(([i, t]) => el('li', null, svgIco(i), el('span', { text: t })))));
    c.appendChild(fensterChips(D.f, true));
    if (m !== 'alltag') {
      const kh = khHeute();
      if (m === 'performance' || kh.quelle !== 'ruhe') c.appendChild(el('p', { class: 'tf-tag-kh' }, svgIco('i-flame'), el('span', null, el('b', { text: 'Kohlenhydrate heute: ' + nf(kh.g[0]) + '–' + nf(kh.g[1]) + ' g' }), ' · ' + kh.gkg[0] + '–' + kh.gkg[1] + ' g/kg, ' + (kh.quelle === 'ruhe' ? 'Ruhetag' : kh.name))));
      const b = briefingMorgen();
      if (b) {
        const btn = el('button', { type: 'button', class: 'tf-tag-brief' }, svgIco('i-flag'), el('span', null, el('b', { text: 'Morgen: ' + b.titel }), el('small', { text: 'Heute auffüllen – Briefing mit Flaschenrezept' })), svgIco('i-chev'));
        btn.addEventListener('click', () => { if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(briefingBlatt(b)); });
        c.appendChild(btn);
      }
    }
    box.replaceChildren(c);
  }

  /* ---------- Seite „Dein Tag“ ---------- */
  function renderTag() {
    const box = $('#tag-box'); if (!box) return;
    const D = tagDaten(), m = modus(), a = athlet(), f = D.f;
    const c1 = karte({ farbe: TYP_FARBE[D.typ.id], icon: D.typ.id === 'schon' ? 'i-shield' : 'i-target', titel: D.typ.titel, sub: D.ampel ? 'Aus Tagesform ' + (D.ampel === 'gruen' ? 'grün' : D.ampel === 'gelb' ? 'gelb' : 'rot') + (D.typ.grund && !/Tagesform/.test(D.typ.grund) ? ' und ' + D.typ.grund : '') : 'Ohne Tagesform: Mach den Check-in für einen passenden Tag', span2: true, id: 'karte-tag-typ' });
    c1.appendChild(el('ul', { class: 'tf-tag-tipps gross' }, ...tipps(D).map(([i, t]) => el('li', null, svgIco(i), el('span', { text: t })))));
    if (D.typ.id === 'schon') c1.appendChild(el('p', { class: 'tf-note', text: 'Nach schlechtem Schlaf leiden vor allem Aufmerksamkeit und Reaktion – Routinearbeit klappt meist noch gut.' }));
    // Kurz-Routinen für zwischendurch: passende zuerst
    const RT = sicher(() => (window.tfFlow && tfFlow.routinen ? tfFlow.routinen() : [])) || [];
    if (RT.length) {
      const std = new Date().getHours(), vorschlag = D.typ.id === 'schon' ? 'seufzer' : std < 11 ? 'nacken' : std >= 20 ? 'box' : 'buero';
      RT.sort((x, y) => (x.id === vorschlag ? -1 : y.id === vorschlag ? 1 : 0));
      c1.appendChild(el('div', { class: 'tf-tag-routinen' }, el('span', { class: 'tf-form-l', text: 'Zwischendurch: 5–10 Minuten, geführt mit Timer' }),
        el('div', { class: 'tf-chipset' }, ...RT.map((r) => { const b = el('button', { type: 'button' }, svgIco(r.icon), ' ' + r.titel + ' · ' + r.min + ' min'); b.addEventListener('click', () => tfFlow.routine(r.id)); return b; }))));
    }
    c1.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Lim & Dinges, Psychol Bull 2010 · Dunstan et al., Diabetes Care 2012 · Monk, Clin Sports Med 2005' })));
    // Zeitfenster
    const c2 = karte({ farbe: 'indigo', icon: 'i-clock', titel: 'Zeitfenster für heute', sub: D.quelle === 'uhr' ? 'Aufgewacht um ' + uhr(f.auf) + ' (Garmin) · Schlafbedarf ' + Math.floor(D.bedarf / 60) + ':' + String(Math.round(D.bedarf % 60)).padStart(2, '0') + ' h' : D.quelle === 'profil' ? 'Deine Aufstehzeit ' + uhr(f.auf) + ' Uhr' : D.quelle === 'schnitt' ? 'Deine übliche Aufwachzeit ' + uhr(f.auf) + ' Uhr' : 'Angenommen: 7 Uhr aufstehen – trag unten deine Zeit ein', span2: true, id: 'karte-tag-fenster' });
    const F = [
      ['i-sun', 'Tageslicht', 'bis ' + uhr(f.licht), 'Licht in der ersten Stunde nach dem Aufstehen stellt die innere Uhr – du wirst abends früher müde und schläfst besser ein.', 'Wright et al., Curr Biol 2013'],
      ['i-target', 'Konzentration', uhr(f.fokus[0]) + '–' + uhr(f.fokus[1]), 'Am späten Vormittag sind Aufmerksamkeit und Gedächtnis bei den meisten am besten.', 'Valdez et al., Chronophysiol Ther 2012'],
      ['i-walk', 'Tief nach dem Mittag', uhr(f.tief[0]) + '–' + uhr(f.tief[1]), 'Das Nachmittagstief ist normal. Ein paar Minuten Gehen helfen mehr als der nächste Kaffee.', 'Monk, Clin Sports Med 2005'],
      ['i-coffee', 'Letztes Koffein', 'bis ' + uhr(f.koffein), 'Kaffee wirkt lange: Getrunken weniger als etwa 9 Stunden vor dem Schlafen, verkürzt er den Schlaf. Starke Pre-Workout-Booster brauchen noch mehr Abstand.', 'Gardiner et al., Sleep Med Rev 2023 · Drake et al., J Clin Sleep Med 2013'],
      ['i-food', 'Letzte große Mahlzeit', 'bis ' + uhr(f.essen), 'Ein schweres Essen kurz vor dem Schlafen kann den Schlaf stören – ein kleiner Snack ist in Ordnung.', 'St-Onge et al., Adv Nutr 2016'],
      ['i-monitor', 'Licht dimmen, Bildschirm weg', 'ab ' + uhr(f.dimmen), 'Helles Licht und Bildschirme am späten Abend verzögern das Schlafhormon Melatonin.', 'Chang et al., PNAS 2015'],
      ['i-moon', 'Ins Bett', uhr(f.bett) + ' Uhr', (f.frueher ? 'Heute 30 Minuten früher als sonst, weil deine Tagesform niedrig ist. ' : '') + 'So kommst du auf deinen Schlafbedarf – Einschlafen braucht etwa eine Viertelstunde.', 'Watson et al., Sleep 2015 (AASM)'],
    ];
    c2.appendChild(el('div', { class: 'tf-tag-liste' }, ...F.map(([i, t, z, txt, q]) => el('div', { class: 'tf-tag-zeile' }, el('span', { class: 'tf-tag-zi' }, svgIco(i)), el('div', null, el('div', { class: 'tf-tag-zk' }, el('b', { text: t }), el('span', { class: 'num', text: z })), el('p', { text: txt }), el('small', { class: 'tf-tag-q', text: q }))))));
    // Aufstehzeit
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const inp = el('input', { class: 'tf-input', type: 'time', step: 900, value: a.aufstehen_min ? M().uhrzeit(a.aufstehen_min) : '', 'aria-label': 'Übliche Aufstehzeit' });
    const sp = el('button', { type: 'button', class: 'tf-btn' }, 'Speichern');
    sp.addEventListener('click', async () => {
      const v = M().minVon(inp.value);
      try { setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', { aufstehen_min: v == null ? null : v }); A().patch('athlet', [j.profil]); setMsg(msg, v == null ? 'Entfernt.' : 'Gespeichert.'); }
      catch (e) { setMsg(msg, e.message, true); }
    });
    c2.appendChild(el('div', { class: 'tf-tag-auf' }, el('label', { class: 'tf-field' }, el('span', { text: T.ohne() ? 'Übliche Aufstehzeit' : 'Aufstehzeit, wenn die Uhr nichts weiß' }), inp), sp, msg));
    const teile = [c1, c2];
    // Kohlenhydrate
    if (m !== 'alltag') {
      const kh = khHeute(), kg = Math.round(kh.kg);
      const c3 = karte({ farbe: 'orange', icon: 'i-flame', titel: 'Kohlenhydrate nach Trainingslast', sub: 'Heute: ' + nf(kh.g[0]) + '–' + nf(kh.g[1]) + ' g (' + kh.gkg[0] + '–' + kh.gkg[1] + ' g/kg bei ' + kg + ' kg)', span2: true, id: 'karte-tag-kh' });
      const tb2 = el('div', { class: 'tf-kh-stufen' }, ...M().KH_STUFEN.map((s) => el('div', { class: 'tf-kh-stufe' + (s.id === kh.stufe ? ' an' : '') }, el('b', { text: s.gkg[0] + '–' + s.gkg[1] + ' g/kg' }), el('span', { text: s.name }), el('small', { class: 'num', text: nf(s.gkg[0] * kg) + '–' + nf(s.gkg[1] * kg) + ' g' }))));
      c3.append(el('p', { class: 'tf-note', style: 'margin-top:0', text: kh.quelle === 'plan' ? 'Aus deinem Trainingsplan für heute (' + kh.minuten + ' min).' : kh.quelle === 'garmin' ? 'Aus deinen Einheiten heute (' + kh.minuten + ' min).' : 'Heute steht kein Training an.' }), tb2,
        el('p', { class: 'tf-note', text: '„Fuel for the work required“: An leichten Tagen reichen moderate Mengen, vor und an harten oder langen Tagen braucht der Körper deutlich mehr. Eiweiß bleibt jeden Tag gleich wichtig.' }),
        el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Thomas, Erdman & Burke, Med Sci Sports Exerc 2016 · Burke et al., J Sports Sci 2011 · Impey et al., Sports Med 2018' })));
      const b = briefingMorgen();
      if (b) { const bt = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-flag'), ' Briefing für morgen'); bt.addEventListener('click', () => tfWissen.blatt(briefingBlatt(b))); c3.appendChild(el('div', { class: 'tf-form-actions' }, bt)); }
      teile.push(c3);
    }
    // Ziele für Wasser und Eiweiß
    const Z = ziele(), c4 = karte({ farbe: 'blue', icon: 'i-drop', titel: 'Trinken & Eiweiß', sub: 'Richtwerte für heute – im Tagesprotokoll abhaken', id: 'karte-tag-ziele' });
    c4.append(el('div', { class: 'tf-kv tf-kv-2' },
      el('div', null, el('small', { text: 'Trinken' }), el('span', { class: 'num', text: literTxt(Z.w.ml) }), el('em', { text: Z.w.quelle === 'eigen' ? 'dein Ziel' : 'Grundbedarf ' + literTxt(Z.w.basis) + (Z.w.extra ? ' + ' + literTxt(Z.w.extra) + ' Training' : '') })),
      el('div', null, el('small', { text: 'Eiweiß' }), el('span', { class: 'num', text: kgTxt(Z.p.g) }), el('em', { text: Z.p.quelle === 'eigen' ? 'dein Ziel' : nf(Z.p.gkg, 1) + ' g pro kg' }))));
    const zum = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-list'), ' Heute notiert');
    zum.addEventListener('click', () => T.geh('gesundheit/protokoll'));
    c4.appendChild(el('div', { class: 'tf-form-actions' }, zum));
    teile.push(c4);
    box.replaceChildren(el('div', { class: 'tf-grid' }, ...teile));
  }

  /* =====================================================================
     Heute notiert: Karte auf Heute und Seite unter Gesundheit
     ===================================================================== */
  function stackRest(item) { // noch übrig: Bestand minus Einnahmen seit „seit“
    if (!(+item.b > 0)) return null;
    const seit = item.seit || '0000-00-00';
    const genommen = (A().raw('tagebuch') || []).concat(Object.values(OFFEN)).reduce((x, r) => {
      if (!r || r.date < seit || (OFFEN[r.date] && OFFEN[r.date] !== r)) return x; return x + ((r.s && +r.s[item.id]) || 0);
    }, 0);
    const v14 = []; for (let i = 0; i < 14; i++) { const r = tb(plusTage(localDate(), -i)); v14.push((r.s && +r.s[item.id]) || 0); }
    const proTag = v14.reduce((x, y) => x + y, 0) / 14;
    const rest = Math.max(0, +item.b - genommen);
    return { rest, tage: proTag > 0 ? Math.floor(rest / proTag) : null, knapp: proTag > 0 ? rest <= Math.max(3, 7 * proTag) : rest <= 3 };
  }
  function tracker(d, kompakt) {
    const r = tb(d), Z = ziele(d), k = cfg(), D = tagDaten(), stopp = D.f.koffein;
    const L = [];
    if (k.zeigen.w) {
      const w = +r.w || 0, an = Math.min(1, w / Z.w.ml);
      const plus = el('button', { type: 'button', class: 'tf-nt-plus', 'aria-label': 'Ein Glas Wasser (250 ml) dazu' }, svgIco('i-plus'));
      plus.addEventListener('click', () => tbAendern(d, (x) => { x.w = Math.min(10000, (+x.w || 0) + 250); }));
      L.push(el('div', { class: 'tf-nt', style: '--c:var(--tf-blue);--an:' + an.toFixed(3) },
        el('span', { class: 'tf-nt-i' }, svgIco('i-glass')),
        el('span', { class: 'tf-nt-t' }, el('b', { class: 'num', text: literTxt(w) }), el('small', { text: 'von ' + literTxt(Z.w.ml) })),
        el('span', { class: 'tf-nt-bar', 'aria-hidden': 'true' }, el('i')), plus));
    }
    if (k.zeigen.p) {
      const p = +r.p || 0, an = Math.min(1, p / Z.p.g);
      const plus = el('button', { type: 'button', class: 'tf-nt-plus', 'aria-label': '20 g Eiweiß dazu' }, el('span', { class: 'tf-nt-plus-t', text: '+20' }));
      plus.addEventListener('click', () => tbAendern(d, (x) => { x.p = Math.min(500, (+x.p || 0) + 20); }));
      L.push(el('div', { class: 'tf-nt', style: '--c:var(--tf-purple);--an:' + an.toFixed(3) },
        el('span', { class: 'tf-nt-i' }, svgIco('i-egg')),
        el('span', { class: 'tf-nt-t' }, el('b', { class: 'num', text: kgTxt(p) }), el('small', { text: (kompakt ? 'von ' : 'Eiweiß von ') + kgTxt(Z.p.g) })),
        el('span', { class: 'tf-nt-bar', 'aria-hidden': 'true' }, el('i')), plus));
    }
    if (k.zeigen.k) {
      const kk = (r.k || []).slice(), spaet = kk.filter((t) => M().minVon(t) > stopp);
      const plus = el('button', { type: 'button', class: 'tf-nt-plus', 'aria-label': 'Kaffee jetzt notieren' }, svgIco('i-plus'));
      plus.addEventListener('click', () => { tbAendern(d, (x) => { x.k = (x.k || []).concat([d === localDate() ? jetztUhr() : '12:00']).slice(-12).sort(); }); if (d === localDate() && M().minVon(jetztUhr()) > stopp) A().toast('Nach ' + uhr(stopp) + ' Uhr kann Koffein deinen Schlaf verkürzen.'); });
      L.push(el('div', { class: 'tf-nt' + (spaet.length ? ' warn' : ''), style: '--c:var(--tf-orange);--an:' + Math.min(1, kk.length / 4).toFixed(3) },
        el('span', { class: 'tf-nt-i' }, svgIco('i-coffee')),
        el('span', { class: 'tf-nt-t' }, el('b', { class: 'num', text: kk.length ? kk.length + '×' : '–' }), el('small', { text: kk.length ? 'zuletzt ' + kk[kk.length - 1] + (spaet.length ? ' – nach ' + uhr(stopp) : '') : (kompakt ? 'bis ' : 'Koffein bis ') + uhr(stopp) })),
        el('span', { class: 'tf-nt-bar', 'aria-hidden': 'true' }, el('i')), plus));
    }
    const box = el('div', { class: 'tf-nt-raster' + (kompakt ? ' kompakt' : '') }, ...L);
    if (k.zeigen.s && k.stack.length) { // Stack unter den Kacheln, nicht im Raster – sonst bleiben am Laptop leere Spalten
      const st = el('div', { class: 'tf-nt-stack', role: 'group', 'aria-label': 'Dein Stack' });
      k.stack.forEach((it) => {
        const n = (r.s && +r.s[it.id]) || 0, rest = stackRest(it);
        const b = el('button', { type: 'button', class: 'tf-nt-s' + (n ? ' an' : '') + (rest && rest.knapp ? ' knapp' : ''), 'aria-pressed': String(n > 0), title: rest ? 'Noch ' + rest.rest + (rest.tage != null ? ' – reicht etwa ' + rest.tage + ' Tage' : '') : '' }, n ? svgIco('i-check') : svgIco('i-pill'), ' ' + it.n + (n > 1 ? ' ×' + n : ''));
        b.addEventListener('click', () => tbAendern(d, (x) => { x.s = Object.assign({}, x.s || {}); if (x.s[it.id]) delete x.s[it.id]; else x.s[it.id] = 1; }));
        st.appendChild(b);
      });
      return L.length ? el('div', { class: 'tf-nt-wrap' }, box, st) : st;
    }
    return box;
  }
  function zeichneNotiert() {
    const box = $('#home-notiert'); if (!box) return;
    const k = cfg();
    if (!(k.zeigen.w || k.zeigen.p || k.zeigen.k || (k.zeigen.s && k.stack.length))) { box.replaceChildren(); return; }
    const c = el('article', { class: 'tf-card tf-notiert', id: 'karte-notiert' });
    const mehr = el('button', { type: 'button', class: 'tf-notiert-mehr', 'aria-label': 'Tagesprotokoll öffnen' }, 'Alles', svgIco('i-chev'));
    mehr.addEventListener('click', () => T.geh('gesundheit/protokoll'));
    c.append(el('div', { class: 'tf-notiert-kopf' }, el('b', { text: 'Heute notiert' }), mehr), tracker(localDate(), true));
    const knapp = k.stack.map((it) => [it, stackRest(it)]).filter(([, r]) => r && r.knapp);
    if (knapp.length) c.appendChild(el('p', { class: 'tf-nt-warn' }, dot('orange'), el('span', { text: knapp.map(([it, r]) => it.n + ': noch ' + r.rest + (r.tage != null ? ' (≈ ' + r.tage + ' Tage)' : '')).join(' · ') + ' – Zeit zum Nachkaufen.' })));
    box.replaceChildren(c);
  }

  /* ---------- Seite „Heute notiert“ ---------- */
  let protokollTag = null;
  function zeichneProtokollHeute() {
    const box = $('#protokoll-heute'); if (!box) return;
    box.replaceChildren(protokollHeute());
  }
  function protokollHeute() {
    const h = localDate(), gestern = plusTage(h, -1), d = protokollTag && protokollTag >= plusTage(h, -6) ? protokollTag : h;
    const r = tb(d), k = cfg(), stopp = tagDaten().f.koffein;
    const wrap = el('div');
    const tage = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Tag' }, ...[[h, 'Heute'], [gestern, 'Gestern']].map(([x, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(x === d) }, t); b.addEventListener('click', () => { protokollTag = x; zeichneProtokollHeute(); }); return b; }));
    wrap.append(el('div', { class: 'tf-form-row' }, el('span', { class: 'tf-form-l' }, 'Tag'), tage), tracker(d, false));
    const knopf = (t, fn) => { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, t); b.addEventListener('click', fn); return b; };
    if (k.zeigen.w) wrap.appendChild(el('div', { class: 'tf-nt-zeile' }, el('span', { text: 'Trinken' }), ...[[150, '+150 ml'], [250, '+250'], [500, '+500'], [-250, '−250']].map(([n, t]) => knopf(t, () => tbAendern(d, (x) => { x.w = Math.max(0, Math.min(10000, (+x.w || 0) + n)); })))));
    if (k.zeigen.p) wrap.appendChild(el('div', { class: 'tf-nt-zeile' }, el('span', { text: 'Eiweiß' }), ...[[10, '+10 g'], [20, '+20'], [30, '+30'], [-10, '−10']].map(([n, t]) => knopf(t, () => tbAendern(d, (x) => { x.p = Math.max(0, Math.min(500, (+x.p || 0) + n)); })))));
    if (k.zeigen.k) {
      const zeit = el('input', { class: 'tf-input', type: 'time', value: d === h ? jetztUhr() : '12:00', 'aria-label': 'Uhrzeit Koffein' });
      const dazu = knopf('Koffein notieren', () => { const t = zeit.value; if (!/^\d\d:\d\d$/.test(t)) return; tbAendern(d, (x) => { x.k = (x.k || []).concat([t]).slice(-12).sort(); }); });
      const liste = el('div', { class: 'tf-chipset' }, ...(r.k || []).map((t, i) => { const b = el('button', { type: 'button', class: M().minVon(t) > stopp ? 'tf-spaet' : '', 'aria-label': t + ' entfernen' }, t, ' ×'); b.addEventListener('click', () => tbAendern(d, (x) => { x.k = (x.k || []).filter((_, j) => j !== i); })); return b; }));
      wrap.appendChild(el('div', { class: 'tf-nt-zeile' }, el('span', { text: 'Koffein' }), zeit, dazu, (r.k || []).length ? liste : el('small', { class: 'tf-note', text: 'Dein Koffein-Stopp heute: ' + uhr(stopp) + ' Uhr' })));
    }
    wrap.appendChild(el('details', { class: 'tf-nt-portionen' }, el('summary', null, 'Wie viel Eiweiß steckt drin?'),
      el('ul', null, ...[['250 g Magerquark', '30 g'], ['3 Eier', '20 g'], ['100 g Hähnchenbrust', '23 g'], ['150 g Linsen, gekocht', '13 g'], ['1 Messlöffel Proteinpulver', '20–25 g'], ['200 g Skyr', '22 g'], ['100 g Tofu', '12–15 g'], ['1 Glas Milch (250 ml)', '8 g']].map(([t, g]) => el('li', null, el('span', { text: t }), el('b', { text: g }))))));
    return wrap;
  }
  function renderProtokoll() {
    const box = $('#protokoll-box'); if (!box) return;
    const k = cfg(), Z = ziele(), D = tagDaten();
    const c1 = karte({ farbe: 'blue', icon: 'i-glass', titel: 'Heute notiert', sub: 'Tippen genügt – gespeichert wird automatisch', span2: true, id: 'karte-protokoll' });
    c1.appendChild(el('div', { id: 'protokoll-heute' }, protokollHeute()));
    // Ziele
    const c2 = karte({ farbe: 'teal', icon: 'i-target', titel: 'Deine Ziele', sub: 'Richtwerte – oder deine eigenen', id: 'karte-protokoll-ziele' });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const a = athlet();
    const wIn = el('input', { class: 'tf-input', inputmode: 'numeric', placeholder: nf(Z.w.ml) + ' (automatisch)', value: a.wasser_ml ? String(a.wasser_ml) : '', 'aria-label': 'Eigenes Trinkziel in ml' });
    const pIn = el('input', { class: 'tf-input', inputmode: 'numeric', placeholder: Z.p.g + ' (automatisch)', value: a.protein_g ? String(a.protein_g) : '', 'aria-label': 'Eigenes Eiweißziel in g' });
    const sp = el('button', { type: 'button', class: 'tf-btn' }, 'Ziele speichern');
    sp.addEventListener('click', async () => {
      const w = wIn.value.trim() ? Math.round(+wIn.value.replace(/\D/g, '')) : null, p = pIn.value.trim() ? Math.round(+pIn.value.replace(/\D/g, '')) : null;
      try { setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', { wasser_ml: w, protein_g: p }); A().patch('athlet', [j.profil]); setMsg(msg, 'Gespeichert.'); }
      catch (e) { setMsg(msg, e.message, true); }
    });
    const zeig = el('div', { class: 'tf-chipset', role: 'group', 'aria-label': 'Was du notierst' }, ...[['w', 'Trinken'], ['p', 'Eiweiß'], ['k', 'Koffein'], ['s', 'Stack']].map(([id, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(!!k.zeigen[id]) }, t);
      b.addEventListener('click', () => { const c = cfg(); c.zeigen[id] = c.zeigen[id] ? 0 : 1; cfgSpeichern(c); T.neu(); });
      return b;
    }));
    c2.append(el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Trinken pro Tag (ml)' }), wIn), el('label', { class: 'tf-field' }, el('span', { text: 'Eiweiß pro Tag (g)' }), pIn)),
      el('div', { class: 'tf-form-actions' }, sp, msg),
      el('div', { class: 'tf-field tf-nt-zeigen' }, el('span', { text: 'Was willst du notieren?' }), zeig),
      el('p', { class: 'tf-note', text: 'Trinken: ' + (Z.w.quelle === 'eigen' ? 'dein Ziel. ' : 'Grundbedarf ' + literTxt(Z.w.basis) + ' (EFSA – ein Teil des Wassers kommt mit dem Essen)' + (Z.w.extra ? ' plus ' + literTxt(Z.w.extra) + ' für dein Training' + (Z.w.quelle === 'test' ? ' aus deiner Schweißrate' : '') : '') + '. ') + 'Durst und heller Urin sind gute Wegweiser. Eiweiß: ' + (Z.p.quelle === 'eigen' ? 'dein Ziel.' : nf(Z.p.gkg, 1) + ' g pro kg Körpergewicht' + (modus() === 'alltag' ? ' (DGE).' : ' – mit Kraft- oder viel Ausdauertraining (Morton et al. 2018).')) }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'EFSA, EFSA J 2010 · DGE-Referenzwerte · Morton et al., Br J Sports Med 2018 · Sawka et al., Med Sci Sports Exerc 2007' })));
    const teile = [c1, c2, stackKarte(), verlaufKarte(Z), vergleichKarte(D)];
    const lab = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-red)' }, svgIco('i-flask')), el('span', { class: 'tf-zeile-t' }, el('b', { text: 'Laborwerte' }), el('small', { text: 'Ferritin, Vitamin D & Co. über die Saison' })), svgIco('i-chev'));
    lab.lastChild.classList.add('tf-chev'); lab.addEventListener('click', () => T.geh('gesundheit/labor'));
    box.replaceChildren(el('div', { class: 'tf-grid' }, ...teile.filter(Boolean)), el('div', { class: 'tf-links' }, lab));
  }
  let nachkauf = null; // Eintrag, dessen Bestand gerade aufgefüllt wird
  function stackKarte() {
    const k = cfg();
    const c = karte({ farbe: 'green', icon: 'i-pill', titel: 'Dein Stack', sub: k.stack.length ? k.stack.length + (k.stack.length === 1 ? ' Eintrag' : ' Einträge') + ' – mit einem Tipp abhaken' : 'Was du regelmäßig nimmst – nur zum Mitschreiben', id: 'karte-stack' });
    const L = el('div', { class: 'tf-kw-liste' });
    k.stack.forEach((it, i) => {
      const r = stackRest(it);
      const nach = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, r ? 'Nachgekauft' : 'Bestand');
      nach.addEventListener('click', () => { nachkauf = nachkauf === it.id ? null : it.id; T.neu(); });
      const weg = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': it.n + ' entfernen' }, svgIco('i-x'));
      weg.addEventListener('click', () => { const c2 = cfg(); c2.stack.splice(i, 1); cfgSpeichern(c2); T.neu(); });
      L.appendChild(el('div', { class: 'tf-kw-z' }, el('span', { class: 'tf-kw-n' }, el('b', { text: it.n }), el('small', { text: r ? 'Noch ' + r.rest + (r.tage != null ? ' · reicht etwa ' + r.tage + ' Tage' : '') : 'ohne Bestand' })), r && r.knapp ? el('span', { class: 'tf-pill-warn', text: 'bald leer' }) : null, nach, weg));
      if (nachkauf === it.id) { // neue Packung: Portionen dazu
        const nIn = el('input', { class: 'tf-input', inputmode: 'numeric', placeholder: 'z. B. 60', 'aria-label': 'Neue Portionen' });
        const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, 'Dazu');
        ok.addEventListener('click', () => {
          const n = Math.round(+nIn.value.replace(/\D/g, '')); if (!(n > 0 && n <= 1000)) { nIn.focus(); return; }
          const c2 = cfg(), x = c2.stack[i], rest = stackRest(x); x.b = (rest ? rest.rest : 0) + n; x.seit = localDate(); nachkauf = null; cfgSpeichern(c2); T.neu(); A().toast(x.n + ': ' + x.b + ' Portionen');
        });
        L.appendChild(el('div', { class: 'tf-kw-nach' }, el('span', { text: r ? 'Wie viele Portionen kommen dazu?' : 'Wie viele Portionen hast du?' }), nIn, ok));
      }
    });
    c.appendChild(L);
    const nIn = el('input', { class: 'tf-input', maxlength: 30, placeholder: 'z. B. Magnesium', 'aria-label': 'Name' });
    const bIn = el('input', { class: 'tf-input', inputmode: 'numeric', placeholder: 'Bestand (optional)', 'aria-label': 'Bestand in Portionen' });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const dazu = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-plus'), ' Hinzufügen');
    dazu.addEventListener('click', () => {
      const n = nIn.value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 30), b = Math.round(+bIn.value.replace(/\D/g, '')) || 0;
      if (!n) { setMsg(msg, 'Bitte einen Namen eintragen.', true); return; }
      const c2 = cfg(); if (c2.stack.length >= 12) { setMsg(msg, 'Höchstens 12 Einträge.', true); return; }
      let id; do { id = Math.random().toString(36).slice(2, 8); } while (c2.stack.some((x) => x.id === id));
      c2.stack.push(Object.assign({ id, n }, b > 0 ? { b, seit: localDate() } : {})); cfgSpeichern(c2); T.neu();
    });
    c.append(el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Name' }), nIn), el('label', { class: 'tf-field' }, el('span', { text: 'Bestand in Portionen' }), bIn)), el('div', { class: 'tf-form-actions' }, dazu, msg),
      el('p', { class: 'tf-note', text: 'Tagesform gibt keine Empfehlungen zu Nahrungsergänzung – hier notierst du nur, was du selbst nimmst. Mit Bestand warnt die App, bevor eine Packung leer ist.' }));
    return c;
  }
  function verlaufKarte(Z) {
    const T14 = []; for (let i = 13; i >= 0; i--) T14.push(plusTage(localDate(), -i));
    const rows = T14.map((d) => tb(d));
    if (!rows.some((r) => r.w || r.p || (r.k && r.k.length))) return null;
    const c = karte({ farbe: 'indigo', icon: 'i-bars', titel: 'Die letzten 14 Tage', sub: 'Trinken und Eiweiß gegen dein Ziel', span2: true, id: 'karte-protokoll-verlauf' });
    const balken = (wert, ziel, farbe, txt) => { const an = Math.min(1.25, (wert || 0) / ziel); return el('span', { class: 'tf-nv-b', style: '--c:var(--tf-' + farbe + ');--h:' + (an * 80).toFixed(1) + '%', title: txt }, el('i')); };
    const ZT = T14.map((d) => ziele(d)); // Ziel je Tag: an Trainingstagen mehr Wasser
    const raster = el('div', { class: 'tf-nv' });
    rows.forEach((r, i) => raster.appendChild(el('div', { class: 'tf-nv-tag' + (T14[i] === localDate() ? ' heute' : '') }, el('div', { class: 'tf-nv-bs' }, balken(r.w, ZT[i].w.ml, 'blue', literTxt(r.w || 0) + ' von ' + literTxt(ZT[i].w.ml)), balken(r.p, ZT[i].p.g, 'purple', (r.p || 0) + ' von ' + ZT[i].p.g + ' g')), el('small', { text: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][(toDay(T14[i]).getUTCDay() + 6) % 7] }))));
    const zw = rows.filter((r, i) => (r.w || 0) >= ZT[i].w.ml).length, zp = rows.filter((r, i) => (r.p || 0) >= ZT[i].p.g).length;
    c.append(raster, el('div', { class: 'tf-nv-leg' }, el('span', null, el('i', { style: 'background:var(--tf-blue)' }), 'Trinken · Ziel an ' + zw + ' Tagen'), el('span', null, el('i', { style: 'background:var(--tf-purple)' }), 'Eiweiß · Ziel an ' + zp + ' Tagen'), el('span', { text: 'Linie = Ziel des Tages' })));
    return c;
  }

  /* ---------- Vergleich „mit / ohne“ ---------- */
  function vergleichKarte(D) {
    const k = cfg(), rows = A().raw('tagebuch') || [];
    const von = plusTage(localDate(), -120), tage = rows.filter((r) => r && r.date >= von && r.date < localDate()).map((r) => r.date);
    const merkmale = k.stack.map((it) => ({ id: it.id, name: it.n, hat: (d) => !!(tb(d).s && tb(d).s[it.id]) }));
    if (k.zeigen.k) merkmale.push({ id: 'koffein', name: 'Koffein nach ' + uhr(D.f.koffein), hat: (d) => { const kk = tb(d).k || []; return kk.length ? kk.some((t) => M().minVon(t) > D.f.koffein) : false; } });
    if (!merkmale.length) return null;
    const E = new Map((rowsOf('erholung') || []).map((r) => [r.date, r])), B = new Map((rowsOf('befinden') || []).map((r) => [r.date, r]));
    const garmin = !T.ohne();
    const WERTE = [
      garmin ? ['HRV', 'ms', (d) => { const e = E.get(plusTage(d, 1)); return e && e.hrv ? e.hrv : null; }, 0, true] : null,
      garmin ? ['Tiefschlaf', 'min', (d) => { const e = E.get(plusTage(d, 1)); return e && e.tief_h != null ? Math.round(e.tief_h * 60) : null; }, 0, true] : null,
      ['Schlafdauer', 'h', (d) => { const e = E.get(plusTage(d, 1)); if (e && e.schlaf_h != null) return e.schlaf_h; const b = B.get(plusTage(d, 1)); return b && b.schlaf_h ? b.schlaf_h : null; }, 1, true],
      ['Befinden am Morgen', '/25', (d) => { const b = B.get(plusTage(d, 1)); return b ? b.summe : null; }, 1, true],
    ].filter(Boolean);
    const c = karte({ farbe: 'gold', icon: 'i-scale', titel: 'Mit und ohne – ein Vergleich', sub: 'Die Nacht nach Tagen mit gegen Tage ohne', span2: true, id: 'karte-vergleich' });
    const liste = el('div', { class: 'tf-vg' });
    merkmale.forEach((mk) => {
      const zeilen = WERTE.map(([name, einheit, wert, dez]) => {
        const r = M().mitOhne({ tage, hat: (d) => (tb(d).date ? mk.hat(d) : null), wert, min: 8 });
        if (!r.genug) return { name, fehlt: Math.max(0, 8 - r.n1) + Math.max(0, 8 - r.n2), r };
        return { name, einheit, dez, r };
      });
      const fertig = zeilen.filter((z) => !z.fehlt);
      const kopf = el('div', { class: 'tf-vg-k' }, el('b', { text: mk.name }), el('small', { text: fertig.length ? fertig[0].r.n1 + ' Tage mit · ' + fertig[0].r.n2 + ' ohne' : 'Noch zu wenige Tage – je mindestens 8 mit und ohne' }));
      const body = el('div', { class: 'tf-vg-b' });
      fertig.forEach((z) => {
        const v = z.r.v, f = (x) => nf(x, z.dez);
        const klar = v.klar, gut = v.diff > 0; // höher ist bei allen vier Werten besser
        body.appendChild(el('div', { class: 'tf-vg-z' + (klar ? ' klar' : '') },
          el('span', { text: z.name }),
          el('span', { class: 'num', text: f(v.m1) + ' vs. ' + f(v.m2) + ' ' + z.einheit }),
          el('span', { class: 'tf-vg-d ' + (klar ? (gut ? 'gut' : 'schlecht') : ''), text: klar ? (v.diff > 0 ? '+' : '−') + f(Math.abs(v.diff)) + ' – klarer Unterschied' : 'kein klarer Unterschied' })));
      });
      liste.appendChild(el('div', { class: 'tf-vg-m' }, kopf, body));
    });
    c.append(liste, el('p', { class: 'tf-note', text: 'Eine Beobachtung, kein Beweis: Tage mit und ohne unterscheiden sich oft auch sonst – etwa durch Training, Stress oder Alkohol. „Klar“ heißt: Das 95-%-Intervall des Unterschieds schließt null aus. Gezählt werden nur Tage, an denen du etwas notiert hast.' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Welch-Test mit 95-%-Intervall · Koffein und Schlaf: Gardiner et al., Sleep Med Rev 2023' })));
    return c;
  }

  /* =====================================================================
     Laborwerte (rechner.labor) – nur Mitschreiben, keine Bewertung
     ===================================================================== */
  const MARKER = [
    ['ferritin', 'Ferritin', 'ng/ml'], ['haemoglobin', 'Hämoglobin', 'g/dl'], ['haematokrit', 'Hämatokrit', '%'], ['vitd', 'Vitamin D (25-OH)', 'ng/ml'],
    ['b12', 'Vitamin B12', 'pg/ml'], ['tsh', 'TSH', 'mU/l'], ['crp', 'CRP', 'mg/l'], ['magnesium', 'Magnesium', 'mmol/l'], ['zink', 'Zink', 'µg/dl'],
    ['testosteron', 'Testosteron', 'ng/ml'], ['ck', 'CK', 'U/l'], ['hba1c', 'HbA1c', '%'],
  ];
  const MK = Object.fromEntries(MARKER.map((x) => [x[0], x]));
  function laborDaten() { const l = (A().state.rechner || {}).labor; return { werte: l && Array.isArray(l.werte) ? l.werte.filter((w) => w && w.d && w.m && isFinite(+w.v)) : [] }; }
  let laborT = null;
  function laborSpeichern(L) {
    A().setRechner(Object.assign({}, A().state.rechner || {}, { labor: L }));
    clearTimeout(laborT); laborT = setTimeout(() => A().api('POST', '/api/rechner', { labor: L }).catch((e) => A().toast('Nicht gespeichert: ' + e.message)), 400);
  }
  const markerName = (w) => (MK[w.m] ? MK[w.m][1] : w.n || w.m);
  function renderLabor() {
    const box = $('#labor-box'); if (!box) return;
    const L = laborDaten(), gruppen = {};
    L.werte.forEach((w, i) => { const k = MK[w.m] ? w.m : 'x:' + (w.n || w.m); (gruppen[k] = gruppen[k] || []).push(Object.assign({ i }, w)); });
    const c0 = karte({ farbe: 'red', icon: 'i-flask', titel: 'Wert eintragen', sub: 'Aus deinem Laborbericht', id: 'karte-labor-neu' });
    const sel = el('select', { class: 'tf-input', 'aria-label': 'Wert' }, ...MARKER.map(([id, n]) => el('option', { value: id, text: n })), el('option', { value: 'eigen', text: 'Anderer Wert …' }));
    const nIn = el('input', { class: 'tf-input', maxlength: 30, placeholder: 'Name', hidden: true, 'aria-label': 'Name des Werts' });
    const vIn = el('input', { class: 'tf-input', inputmode: 'decimal', placeholder: 'Wert', 'aria-label': 'Wert' });
    const uIn = el('input', { class: 'tf-input', maxlength: 12, value: MARKER[0][2], 'aria-label': 'Einheit' });
    const dIn = el('input', { class: 'tf-input', type: 'date', value: localDate(), max: localDate(), 'aria-label': 'Datum' });
    const loIn = el('input', { class: 'tf-input', inputmode: 'decimal', placeholder: 'von', 'aria-label': 'Referenzbereich von' }), hiIn = el('input', { class: 'tf-input', inputmode: 'decimal', placeholder: 'bis', 'aria-label': 'Referenzbereich bis' });
    sel.addEventListener('change', () => { const m = MK[sel.value]; nIn.hidden = sel.value !== 'eigen'; uIn.value = m ? m[2] : ''; });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const zahl = (t) => { const n = Number(String(t).replace(',', '.').trim()); return t.trim() === '' || !isFinite(n) ? null : n; };
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Speichern');
    ok.addEventListener('click', () => {
      const v = zahl(vIn.value), lo = zahl(loIn.value), hi = zahl(hiIn.value), d = dIn.value;
      if (v == null) { setMsg(msg, 'Bitte einen Wert eintragen.', true); return; }
      if (!/^\d{4}-\d\d-\d\d$/.test(d)) { setMsg(msg, 'Bitte ein Datum wählen.', true); return; }
      const eigen = sel.value === 'eigen', n = nIn.value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 30);
      if (eigen && !n) { setMsg(msg, 'Wie heißt der Wert?', true); return; }
      const L2 = laborDaten(); if (L2.werte.length >= 60) { setMsg(msg, 'Höchstens 60 Werte – lösch bitte alte.', true); return; }
      L2.werte.push(Object.assign({ d, m: eigen ? 'eigen' : sel.value, v, u: uIn.value.trim().slice(0, 12) }, eigen ? { n } : {}, lo != null ? { lo } : {}, hi != null ? { hi } : {}));
      L2.werte.sort((x, y) => (x.d < y.d ? -1 : 1)); laborSpeichern(L2); T.neu(); A().toast('Gespeichert');
    });
    c0.append(el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Wert' }), sel, nIn), el('label', { class: 'tf-field' }, el('span', { text: 'Datum' }), dIn)),
      el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Ergebnis' }), vIn), el('label', { class: 'tf-field' }, el('span', { text: 'Einheit' }), uIn)),
      el('div', { class: 'tf-field' }, el('span', { text: 'Referenzbereich laut Labor (optional)' }), el('div', { class: 'tf-gym-2' }, loIn, hiIn)),
      el('div', { class: 'tf-form-actions' }, ok, msg));
    const karten = Object.entries(gruppen).map(([k, W]) => {
      const last = W[W.length - 1], ref = W.slice().reverse().find((w) => w.lo != null || w.hi != null);
      const lage = ref && ((ref.lo != null && last.v < ref.lo) || (ref.hi != null && last.v > ref.hi)) ? 'außerhalb' : ref ? 'im Bereich' : null;
      const c = karte({ farbe: lage === 'außerhalb' ? 'orange' : 'gray', icon: 'i-flask', titel: markerName(last), sub: 'Zuletzt ' + datumKurz(last.d) + last.d.slice(2, 4) + (lage ? ' · laut deinem Labor ' + lage : ''), kpi: el('div', { class: 'tf-kpi' }, el('span', { class: 'num', text: nf(last.v, last.v % 1 ? (last.v * 10 % 1 ? 2 : 1) : 0) }), el('span', { class: 'tf-u', text: last.u || '' })) });
      if (W.length >= 2 && window.tfHubs) { const sp = tfHubs.spark(W.map((w) => +w.v), lage === 'außerhalb' ? 'orange' : 'blue'); if (sp) c.appendChild(el('div', { class: 'tf-lab-spark' }, sp)); }
      c.appendChild(el('div', { class: 'tf-lab-liste' }, ...W.slice().reverse().map((w) => {
        const x = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': 'Eintrag vom ' + datumKurz(w.d) + ' löschen' }, svgIco('i-x'));
        x.addEventListener('click', () => { const L2 = laborDaten(); L2.werte.splice(w.i, 1); laborSpeichern(L2); T.neu(); });
        return el('div', { class: 'tf-lab-z' }, el('span', { text: datumKurz(w.d) + w.d.slice(2, 4) }), el('b', { class: 'num', text: nf(w.v, w.v % 1 ? 2 : 0).replace(/,?0+$/, '') + ' ' + (w.u || '') }), el('small', { text: w.lo != null || w.hi != null ? 'Ref. ' + (w.lo != null ? nf(w.lo, w.lo % 1 ? 1 : 0) : '') + '–' + (w.hi != null ? nf(w.hi, w.hi % 1 ? 1 : 0) : '') : '' }), x);
      })));
      return c;
    });
    box.replaceChildren(el('div', { class: 'tf-grid' }, c0, ...karten),
      el('p', { class: 'tf-note', text: 'Nur zum Mitschreiben über die Saison. Die Einordnung deiner Werte gehört zu deiner Ärztin oder deinem Arzt – Tagesform bewertet sie nicht und gibt keine Empfehlungen.' }));
  }

  /* =====================================================================
     Wissen für heute: eine passende Karte je nach Tag
     ===================================================================== */
  function wissenHeute() {
    const W = window.tfWissen; if (!W || !W.begriff) return null;
    const h = localDate(), D = tagDaten(), L = planTag(h);
    const e = D.e, ck = D.ck;
    if (L.some((s) => ['schwelle', 'vo2', 'css', 'sweetspot', 'renntempo', 'sprint', 'test'].includes(s.typ)) && W.begriff('intervall_pausen')) return ['intervall_pausen', 'Heute Intervalle: Wie lang sollen die Pausen sein?'];
    if (sicher(() => window.tfAlltagMotor && tfPlan && tfPlan.tag && M().interferenz({ gym: tfGym.log(), datum: h, einheiten: L })) && W.begriff('concurrent')) return ['concurrent', 'Kraft und Laufen am selben oder nächsten Tag – was gilt?'];
    if (((e && e.leistung_pct != null && e.leistung_pct < 80) || (ck && ck.schlaf <= 2) || (ck && ck.schlaf_h && ck.schlaf_h < 6)) && W.begriff('schlafhygiene')) return ['schlafhygiene', 'Kurze Nacht – sechs Hebel für besseren Schlaf'];
    if (e && e.z_hrv != null && e.z_hrv <= -1 && W.begriff('hrv_alltag')) return ['hrv_alltag', 'HRV im Keller – die häufigsten Gründe aus dem Alltag'];
    if (briefingMorgen() && W.begriff('ffwr')) return ['ffwr', 'Morgen wird es lang: Kohlenhydrate nach Bedarf'];
    if (D.typ.id === 'schon' && W.begriff('hrv_alltag')) return ['hrv_alltag', 'Schon-Tag: Was dich heute ausbremst'];
    return null;
  }
  function hinweiseHeute() {
    const box = $('#home-hinweise2'); if (!box) return;
    const L = [];
    const w = sicher(wissenHeute);
    if (w) {
      const b = el('button', { type: 'button', class: 'tf-zeile tf-wissen-heute' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-gold)' }, svgIco('i-book')), el('span', { class: 'tf-zeile-t' }, el('small', { text: 'Wissen für heute' }), el('b', { text: w[1] })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => tfWissen.zeige(w[0]));
      L.push(b);
    }
    const wt = (new Date().getDay() + 6) % 7, std = new Date().getHours();
    if ((wt === 6 && std >= 17) || wt === 0) {
      const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-blue)' }, svgIco('i-cal')), el('span', { class: 'tf-zeile-t' }, el('small', { text: wt === 6 ? 'Sonntag' : 'Neue Woche' }), el('b', { text: 'Dein Wochenrückblick ist da' })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => T.geh('heute/woche'));
      L.push(b);
    }
    sicher(() => { if (window.tfLeistung && tfLeistung.heuteHinweise) tfLeistung.heuteHinweise().forEach((x) => L.push(x)); });
    let liste = box.querySelector('#home-zeilen');
    if (!L.length) { if (liste) liste.remove(); return; }
    if (!liste) { liste = el('div', { class: 'tf-links', id: 'home-zeilen' }); box.appendChild(liste); }
    liste.replaceChildren(...L);
  }

  /* =====================================================================
     Wochenrückblick
     ===================================================================== */
  let wocheWahl = null; // Montag der gezeigten Woche
  function renderWoche() {
    const box = $('#woche-box'); if (!box) return;
    const h = localDate(), m0 = M().montag(h), wtag = (new Date().getDay() + 6) % 7;
    const start = wocheWahl || (wtag === 0 && new Date().getHours() < 12 ? plusTage(m0, -7) : m0);
    const bis = plusTage(start, 6) < h ? plusTage(start, 6) : h;
    const rr = A().state.rechner || {}, Z = ziele();
    const plan = sicher(() => (window.tfPlan && tfPlan.bilanz ? tfPlan.bilanz(h) : null));
    const wasserAm = {}; for (let d = start; d <= bis; d = plusTage(d, 1)) wasserAm[d] = ziele(d).w.ml;
    const b = M().wochenBilanz({ montag: start, bis, einheiten: A().raw('garmin_einheiten') || [], tage: A().raw('garmin_tage') || [], checkins: A().raw('checkins') || [], tagebuch: A().raw('tagebuch') || [], gym: (rr.gym && rr.gym.log) || [], flow: (rr.flow && rr.flow.log) || [], plan: plan ? plan.tage : null, wasserZiel: Z.w.ml, wasserAm, proteinZiel: Z.p.g });
    const vor = M().wochenBilanz({ montag: plusTage(start, -7), bis: plusTage(start, -1), einheiten: A().raw('garmin_einheiten') || [], tage: A().raw('garmin_tage') || [], checkins: A().raw('checkins') || [], tagebuch: A().raw('tagebuch') || [], gym: (rr.gym && rr.gym.log) || [], flow: (rr.flow && rr.flow.log) || [] });
    const sp = sicher(() => (window.tfSpiel && tfSpiel.stand ? tfSpiel.stand() : null));
    const xp = sp && sp.verlauf ? sp.verlauf.filter((v) => v.datum >= start && v.datum <= bis).reduce((x, v) => x + v.summe, 0) : null;
    const trophaeen = sp && sp.trophaeen ? sp.trophaeen.filter((t) => t.erreicht && t.erreicht >= start && t.erreicht <= bis) : [];
    const hm = (min) => Math.floor(min / 60) + ':' + String(Math.round(min % 60)).padStart(2, '0');
    T.kopf({ sub: datumKurz(start) + ' – ' + datumKurz(plusTage(start, 6)) + (b.fertig ? '' : ' · läuft noch') });
    const wahl = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Woche' }, ...[[m0, 'Diese Woche'], [plusTage(m0, -7), 'Letzte Woche']].map(([x, t]) => { const k = el('button', { type: 'button', 'aria-pressed': String(x === start) }, t); k.addEventListener('click', () => { wocheWahl = x; T.neu(); }); return k; }));
    const kachel = (titel, wert, u, sub, farbe, icon) => el('div', { class: 'tf-wr-k', style: '--c:var(--tf-' + farbe + ')' }, el('span', { class: 'tf-wr-i' }, svgIco(icon)), el('small', { text: titel }), el('b', { class: 'num' }, wert == null ? '–' : String(wert), u && wert != null ? el('span', { class: 'tf-u', text: u }) : null), el('em', { text: sub || '' }));
    const diff = (a, b2, d) => (a == null || b2 == null ? '' : (a - b2 >= 0 ? '+' : '−') + nf(Math.abs(a - b2), d || 0) + ' zur Vorwoche');
    const K = [
      kachel('Einheiten', b.einheiten, '', b.minuten ? hm(b.minuten) + ' h · ' + diff(b.einheiten, vor.einheiten) : diff(b.einheiten, vor.einheiten), 'orange', 'i-bolt'),
      b.plan ? kachel('Plan erledigt', b.plan[1] + '/' + b.plan[0], '', Math.round((100 * b.plan[1]) / b.plan[0]) + ' %', 'blue', 'i-cal') : null,
      kachel('Schlaf Ø', b.schlaf_h == null ? null : hm(b.schlaf_h * 60), 'h', b.schlaf_n ? b.schlaf_n + ' Nächte' + (b.schlaf_quelle === 'checkin' ? ' (Check-in)' : '') : 'keine Daten', 'indigo', 'i-moon'),
      b.schritte != null ? kachel('Schritte Ø', nf(b.schritte), '', diff(b.schritte, vor.schritte), 'green', 'i-steps') : null,
      kachel('Check-in Ø', b.befinden == null ? null : nf(b.befinden, 1), '/25', b.checkins + ' von ' + b.tage + ' Tagen' + (b.befinden != null && vor.befinden != null ? ' · ' + diff(b.befinden, vor.befinden, 1) : ''), 'green', 'i-smile'),
      b.gym ? kachel('Gym', b.gym, b.gym === 1 ? ' Workout' : ' Workouts', b.saetze + ' Sätze · ' + b.beine + ' für die Beine', 'purple', 'i-dumbbell') : null,
      b.wasser_tage != null && b.protokoll_tage ? kachel('Trinkziel', b.wasser_tage, ' Tage', 'an ' + b.protokoll_tage + ' Tagen notiert', 'blue', 'i-glass') : null,
      xp != null ? kachel('XP', nf(xp), '', trophaeen.length ? trophaeen.length + (trophaeen.length === 1 ? ' Trophäe' : ' Trophäen') : 'gesammelt', 'gold', 'i-star') : null,
    ].filter(Boolean);
    const c1 = el('article', { class: 'tf-card tf-span2 tf-wr', id: 'karte-woche' }, wahl, el('div', { class: 'tf-wr-raster' }, ...K));
    // Sportarten
    const NAME = { lauf: ['Laufen', 'mint'], rad: ['Rad', 'orange'], schwimmen: ['Schwimmen', 'blue'], kraft: ['Kraft', 'purple'], mobil: ['Mobilität', 'teal'], gehen: ['Gehen', 'green'], sonst: ['Sonstiges', 'gray'] };
    const je = Object.entries(b.je).sort((x, y) => y[1].min - x[1].min);
    let c2 = null;
    if (je.length) {
      const max = Math.max(...je.map(([, v]) => v.min));
      c2 = karte({ farbe: 'orange', icon: 'i-bars', titel: 'Wofür du dir Zeit genommen hast', sub: 'Einheiten von der Uhr', id: 'karte-woche-sport' });
      c2.appendChild(el('div', { class: 'tf-gym-balken' }, ...je.map(([k, v]) => { const i = el('i'); i.style.width = (100 * v.min) / max + '%'; i.style.background = 'var(--tf-' + NAME[k][1] + ')'; return el('div', { class: 'tf-gym-bz' }, el('span', { text: NAME[k][0] }), el('span', { class: 'tf-gym-bar' }, i), el('b', { class: 'num', text: hm(v.min) })); })));
    }
    // Ausblick: eine Sache für nächste Woche
    const tipp = b.schlaf_h != null && b.schlaf_h < 7 ? ['i-moon', 'Mehr Schlaf: An drei Abenden 30 Minuten früher ins Bett – Schlaf ist das billigste Leistungsmittel.']
      : b.checkins < 4 ? ['i-smile', 'Check-in an mindestens 5 Tagen – dein Gefühl macht die Tagesform genauer.']
        : b.plan && b.plan[1] < 0.8 * b.plan[0] ? ['i-cal', 'Plan anpassen: Lieber eine Einheit weniger planen und alle schaffen als viele verpassen.']
          : modus() !== 'performance' && !b.gym ? ['i-dumbbell', 'Zwei kurze Kraft-Einheiten – die WHO empfiehlt Kraft an zwei Tagen pro Woche.']
            : b.schritte != null && b.schritte < 6000 ? ['i-steps', 'Mehr Alltagsbewegung: Ein Spaziergang nach dem Essen bringt schnell 2.000 Schritte.']
              : ['i-star', 'Weiter so – halte den Rhythmus und plane auch einen echten Ruhetag ein.'];
    const c3 = karte({ farbe: 'green', icon: 'i-target', titel: 'Für nächste Woche', sub: 'Eine Sache reicht', id: 'karte-woche-tipp' });
    c3.appendChild(el('p', { class: 'tf-wr-tipp' }, svgIco(tipp[0]), el('span', { text: tipp[1] })));
    if (trophaeen.length) c3.appendChild(el('p', { class: 'tf-note', text: 'Neue Trophäen: ' + trophaeen.map((t) => t.name).join(', ') + '.' }));
    box.replaceChildren(el('div', { class: 'tf-grid' }, c1, c2, c3));
  }

  /* =====================================================================
     Anmelden
     ===================================================================== */
  T.seite('tag', renderTag);
  T.seite('protokoll', renderProtokoll);
  T.seite('labor', renderLabor);
  T.seite('woche', renderWoche);
  T.zusatz('heute', () => { modusFrage(); sicher(heuteTag); sicher(zeichneNotiert); sicher(hinweiseHeute); });
  T.zusatz('profil', profilFokus);
  T.zusatz('*', modusAnwenden);
  window.tfAlltag = { modus, modusGesetzt, MODI, tb, ziele, tagDaten, khHeute, briefingMorgen, wissenHeute, cfg };
})();
