/* Dreiklang · Alltag & Energie (Version 8, ergänzt in 9): Fokus der App, „Dein Tag“ mit Zeitfenstern und Kohlenhydraten,
   „Heute notiert“ (Wasser, Eiweiß, Koffein, eigener Stack), Vergleich „mit / ohne“, Laborwerte, Wissen für heute
   und der Wochenrückblick. Die Rechnungen stehen in alltag-motor.js. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, nf, iso, toDay, localDate, DAY, rowsOf, heute, svgIco, col, setMsg, AMPEL } = T.ui;
  const warum = (t, q) => (T.ui.warum ? T.ui.warum(t, q) : null); // Version 11: (i) mit einem Satz
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
      el('span', { class: 'tf-badge', style: '--c:var(--tf-teal)' }, svgIco('i-target')),
      el('div', null, el('b', { text: 'Wofür nutzt du Dreiklang?' }), el('p', { text: 'Dann zeigt die App nur, was zu dir passt. Ändern kannst du das jederzeit unter Profil → Über dich.' })),
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
      const j = await A().api('POST', '/api/checkin', { art: 'tagebuch', date: d, w: r.w || 0, p: r.p || 0, k: r.k || [], s: r.s || {}, v: r.v || 0 });
      if (OFFEN[d] === r) delete OFFEN[d];
      const rest = (A().raw('tagebuch') || []).filter((x) => x && x.date !== d);
      A().patch('tagebuch', (j.row ? rest.concat([j.row]) : rest).sort((x, y) => (x.date < y.date ? -1 : 1)));
    } catch (e) { A().toast('Nicht gespeichert: ' + e.message); }
  }
  const jetztUhr = () => { const n = new Date(); return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };

  /* =====================================================================
     Tagesdaten: Tune, Schlaf, Check-in, Zeitfenster, Ziele
     ===================================================================== */
  function planTag(d) { return sicher(() => (window.tfPlan && tfPlan.tag ? tfPlan.tag(d) : [])) || []; }
  function trainingMin(d) { // geplant oder schon trainiert – das Größere zählt
    const geplant = planTag(d).filter((s) => s.sport !== 'mobil' && s.typ !== 'rennen').reduce((x, s) => x + (+s.min || 0), 0);
    const getan = (rowsOf('belastung') || []).filter((b) => b.date === d && b.sport !== 'wechsel').reduce((x, b) => x + (+b.min || 0), 0);
    return Math.max(geplant, getan);
  }
  function schweissLh(heiss) { // an heißen Tagen die Schweißrate aus Tests bei Hitze, wenn es welche gibt
    const c = (A().state.rechner || {}).schweiss; const p = M().schweissProfil(c && Array.isArray(c.tests) ? c.tests : []);
    if (heiss && p.je && p.je.hitze) return p.je.hitze.lh;
    return p.gesamt ? p.gesamt.lh : null;
  }
  const heissHeute = (d) => d === localDate() && !!sicher(() => window.tfEinblick && tfEinblick.hitze());
  function ziele(d) {
    const a = athlet(), alter = a.geburtsjahr ? new Date().getFullYear() - a.geburtsjahr : null;
    return {
      w: M().wasserZiel({ geschlecht: a.geschlecht, eigen: a.wasser_ml, trainingMin: trainingMin(d || localDate()), schweissLh: schweissLh(heissHeute(d || localDate())) }),
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
    const am = sicher(() => (window.tfEinblick ? tfEinblick.aufMorgen() : null)); // morgen früher raus: Termin oder Montag
    const aufJetzt = auf != null ? auf : 420, morgenFrueher = am && am.min < aufJetzt ? aufJetzt - am.min : 0;
    const f = M().tagesFenster({ aufwachMin: auf, schlafbedarfMin: bedarf, ampel, quelle, aufMorgenMin: morgenFrueher ? am.min : null, bettMin: a.bett_min, schlafenMin: a.schlafen_min }); // Version 19: eigene Bett- und Schlafenszeit
    const typ = M().tagesTyp({ ampel, schlafMin, schlafbedarfMin: bedarf, krank: ck && ck.krank, stress: ck ? ck.stress : null });
    // Version 11: Nach einer schlechten Nacht oder viel Stress (Check-in 1–2) ist der Koffein-Stopp 2 Stunden früher – nicht vor 11 Uhr
    const roh = (A().raw('checkins') || []).find((c) => c && c.date === h) || null;
    const kGrund = roh && +roh.stress > 0 && +roh.stress <= 2 ? 'stress' : roh && +roh.schlaf > 0 && +roh.schlaf <= 2 ? 'schlaf' : null;
    f.koffeinNormal = f.koffein;
    if (kGrund) { f.koffein = Math.max(11 * 60, f.koffein - 120); f.koffeinGrund = kGrund; }
    return { h, ampel, f, typ, ck, schlafMin, bedarf, quelle, e, g, voll: +(tb(h).v || 0), morgen: morgenFrueher ? am : null };
  }
  const bettHeute = (f) => (f.tipp != null ? f.tipp : f.bett); // Version 19: bei eigener Bettzeit gilt sie – außer es gibt heute einen früheren Vorschlag
  // Version 19: Schlaffenster vom Einschlafen bis zum Aufstehen gegen den Bedarf
  function schlafSatz(f, bedarf) {
    const auf = f.auf - (f.morgen || 0) + 1440, dauer = auf - f.schlafen, fehlt = Math.round(bedarf - dauer);
    const hm = (m) => Math.floor(m / 60) + ':' + String(Math.round(m % 60)).padStart(2, '0') + '\u00a0h';
    return 'Bis zum Aufstehen um ' + uhr(auf) + ' Uhr sind das ' + hm(dauer) + (fehlt >= 15 ? ' – ' + fehlt + '\u00a0min unter deinem Bedarf von ' + hm(bedarf) + '.' : fehlt <= -15 ? ' – mehr als dein Bedarf von ' + hm(bedarf) + '.' : ', so viel wie dein Bedarf.');
  }
  function tipps(D) {
    const f = D.f, m = modus(), L = [];
    if (D.voll === 3) { // vollgepackter Tag: Mini-Pausen und kurze Formate statt unerreichbarer Ziele
      L.push(['i-lotus', 'Voller Tag: Zwischen zwei Terminen 2 Minuten Atem-Seufzer – zweimal ein, lange aus. Das senkt die Anspannung.']);
      L.push(['i-walk', 'Bewegung in kleinen Stücken: 3 × 5 Minuten gehen zählen auch.']);
      if (m !== 'alltag') L.push(['i-bolt', D.typ.id === 'schon' ? 'Training heute weglassen oder 20 Minuten ganz locker.' : 'Training kurz halten: 20–30 Minuten locker statt der langen Einheit.']);
      L.push(['i-food', 'Einen festen Block fürs Essen freihalten – auch an vollen Tagen.']);
      if (D.morgen) L.push(['i-moon', D.morgen.grund + ' – heute um ' + uhr(bettHeute(f)) + ' ins Bett.']);
      return L;
    }
    if (D.morgen) L.push(['i-moon', D.morgen.grund + ' – heute um ' + uhr(bettHeute(f)) + ' Uhr ins Bett.']);
    if (D.voll === 1 && D.typ.id === 'fokus' && m !== 'alltag') L.push(['i-cal', 'Ruhiger Tag und gute Form: ein guter Tag für die lange oder harte Einheit.']);
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
      L.push(['i-moon', f.eigen && f.tipp == null ? 'Heute pünktlich ins Bett: ' + uhr(f.bett) + ' Uhr.' : 'Heute früher ins Bett: ' + uhr(bettHeute(f)) + ' Uhr.']);
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
      el('span', { class: 'tf-badge', style: '--c:var(--tf-' + TYP_FARBE[D.typ.id] + ')' }, svgIco(D.typ.id === 'schon' ? 'i-shield' : D.typ.id === 'fokus' ? 'i-target' : 'i-sun')),
      el('div', null, el('b', { text: D.typ.titel }), el('small', { text: D.ampel ? D.typ.grund : 'Mach den Check-in – dann passt der Tag zu deinem Tune' })), svgIco('i-chev')));
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
    const c1 = karte({ farbe: TYP_FARBE[D.typ.id], icon: D.typ.id === 'schon' ? 'i-shield' : 'i-target', titel: D.typ.titel, sub: D.ampel ? 'Aus Tune ' + (D.ampel === 'gruen' ? 'grün' : D.ampel === 'gelb' ? 'gelb' : 'rot') + (D.typ.grund && !/Tune/.test(D.typ.grund) ? ' und ' + D.typ.grund : '') : 'Ohne Tune: Mach den Check-in für einen passenden Tag', span2: true, id: 'karte-tag-typ' });
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
      ['i-coffee', 'Letztes Koffein', 'bis ' + uhr(f.koffein), (f.koffeinGrund ? 'Heute 2 Stunden früher als sonst. ' : '') + 'Kaffee wirkt lange: Getrunken weniger als etwa 9 Stunden vor dem Schlafen, verkürzt er den Schlaf. Starke Pre-Workout-Booster brauchen noch mehr Abstand.', 'Gardiner et al., Sleep Med Rev 2023 · Drake et al., J Clin Sleep Med 2013',
        f.koffeinGrund ? (f.koffeinGrund === 'stress' ? 'Du hast im Check-in viel Stress angegeben – Koffein verstärkt die Stressreaktion, deshalb heute schon um ' + uhr(f.koffein) + ' statt ' + uhr(f.koffeinNormal) + '.' : 'Du hast schlecht geschlafen – ein früher Koffein-Stopp schützt die nächste Nacht, deshalb heute schon um ' + uhr(f.koffein) + ' statt ' + uhr(f.koffeinNormal) + '.') : null],
      ['i-food', 'Letzte große Mahlzeit', 'bis ' + uhr(f.essen), 'Ein schweres Essen kurz vor dem Schlafen kann den Schlaf stören – ein kleiner Snack ist in Ordnung.', 'St-Onge et al., Adv Nutr 2016'],
      ['i-monitor', 'Licht dimmen, Bildschirm weg', 'ab ' + uhr(f.dimmen), 'Helles Licht und Bildschirme am späten Abend verzögern das Schlafhormon Melatonin.', 'Chang et al., PNAS 2015'],
      f.eigen // Version 19: eigene Bettzeit bleibt stehen – an roten Tagen oder vor einem frühen Morgen nur ein Vorschlag
        ? ['i-moon', 'Ins Bett', uhr(f.bett) + ' Uhr', (f.tipp != null ? (f.frueher ? 'Dein Tune ist rot – heute lieber schon um ' + uhr(f.tipp) + ' Uhr. ' : D.morgen.grund + ' – heute lieber schon um ' + uhr(f.tipp) + ' Uhr. ') : '') + 'Deine eigene Zeit, einzustellen unter Profil → Schlaf & Abend.', 'Watson et al., Sleep 2015 (AASM)', f.tipp != null ? (f.frueher ? 'Dein Tune ist heute rot – 30 Minuten mehr Schlaf helfen der Erholung am meisten.' : D.morgen.grund + ' – damit du trotzdem auf deinen Schlafbedarf kommst.') : null]
        : ['i-moon', 'Ins Bett', uhr(f.bett) + ' Uhr', (f.frueher ? 'Heute 30 Minuten früher als sonst, weil dein Tune niedrig ist. ' : '') + (D.morgen ? D.morgen.grund + ' – deshalb früher ins Bett als sonst. ' : '') + 'So kommst du auf deinen Schlafbedarf – Einschlafen braucht etwa eine Viertelstunde.', 'Watson et al., Sleep 2015 (AASM)', f.frueher || D.morgen ? (f.frueher ? 'Dein Tune ist heute rot – 30 Minuten mehr Schlaf helfen der Erholung am meisten.' : D.morgen.grund + ' – damit du trotzdem auf deinen Schlafbedarf kommst.') : null],
      ['i-moon', 'Schlafen', uhr(f.schlafen) + ' Uhr', schlafSatz(f, D.bedarf), 'Watson et al., Sleep 2015 (AASM)'],
    ];
    c2.appendChild(el('div', { class: 'tf-tag-liste' }, ...F.map(([i, t, z, txt, q, w]) => el('div', { class: 'tf-tag-zeile' }, el('span', { class: 'tf-tag-zi' }, svgIco(i)), el('div', null, el('div', { class: 'tf-tag-zk' }, el('b', { text: t }), el('span', { class: 'num' }, z, w ? warum(w) : null)), el('p', { text: txt }), el('small', { class: 'tf-tag-q', text: q }))))));
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
    const zuAbend = el('button', { type: 'button', class: 'tf-linkbtn tf-tag-zuabend' }, f.eigen ? 'Bett- und Schlafenszeit ändern' : 'Bett- und Schlafenszeit selbst festlegen'); // Version 19
    zuAbend.addEventListener('click', () => T.geh('profil/abend'));
    c2.appendChild(zuAbend);
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
      el('div', null, el('small', { text: 'Trinken' }), el('span', { class: 'num' }, literTxt(Z.w.ml), Z.w.extra ? warum('Grundbedarf ' + literTxt(Z.w.basis) + ' plus ' + literTxt(Z.w.extra) + ' für dein Training heute – gerechnet mit ' + (Z.w.quelle === 'test' ? 'deiner gemessenen Schweißrate.' : 'etwa 0,5 l pro Trainingsstunde. Mit einem Schweißraten-Test wird es genauer.')) : null), el('em', { text: Z.w.quelle === 'eigen' ? 'dein Ziel' : 'Grundbedarf ' + literTxt(Z.w.basis) + (Z.w.extra ? ' + ' + literTxt(Z.w.extra) + ' Training' : '') })),
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
      el('p', { class: 'tf-note', text: 'Dreiklang gibt keine Empfehlungen zu Nahrungsergänzung – hier notierst du nur, was du selbst nimmst. Mit Bestand warnt die App, bevor eine Packung leer ist.' }));
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
    const stoppN = D.f.koffeinNormal != null ? D.f.koffeinNormal : D.f.koffein; // Vergleich immer mit dem üblichen Stopp
    if (k.zeigen.k) merkmale.push({ id: 'koffein', name: 'Koffein nach ' + uhr(stoppN), hat: (d) => { const kk = tb(d).k || []; return kk.length ? kk.some((t) => M().minVon(t) > stoppN) : false; } });
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
      const kopf = el('div', { class: 'tf-vg-k' }, el('b', { text: mk.name }), el('small', { text: fertig.length ? fertig[0].r.n1 + ' Tage mit · ' + fertig[0].r.n2 + ' ohne' : 'Je mindestens 8 Tage mit und ohne' }));
      const body = el('div', { class: 'tf-vg-b' });
      if (!fertig.length && zeilen.length && S.fortschritt) { // Version 11: wie weit der Vergleich ist
        const z = zeilen.slice().sort((x, y) => x.fehlt - y.fehlt)[0], n1 = Math.min(8, z.r.n1 || 0), n2 = Math.min(8, z.r.n2 || 0);
        const tg = (n) => n + (n === 1 ? ' Tag' : ' Tage');
        const t = n1 < 8 && n2 < 8 ? 'Noch ' + tg(8 - n1) + ' mit und ' + (8 - n2) + ' ohne, bis der Vergleich steht.' : n1 < 8 ? 'Noch ' + tg(8 - n1) + ' mit, bis der Vergleich steht.' : 'Noch ' + tg(8 - n2) + ' ohne, bis der Vergleich steht.';
        body.appendChild(S.fortschritt({ ist: n1 + n2, soll: 16, text: t, sub: n1 + ' von 8 mit · ' + n2 + ' von 8 ohne' }));
      }
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
      el('p', { class: 'tf-note tf-bleibt', text: 'Nur zum Mitschreiben über die Saison. Die Einordnung deiner Werte gehört zu deiner Ärztin oder deinem Arzt – Dreiklang bewertet sie nicht und gibt keine Empfehlungen.' }));
  }

  /* =====================================================================
     Wissen für heute: eine passende Karte je nach Tag
     ===================================================================== */
  function wissenHeute() {
    const W = window.tfWissen; if (!W || !W.begriff) return null;
    const h = localDate(), D = tagDaten(), L = planTag(h);
    const e = D.e, ck = D.ck, EB = window.tfEinblick;
    const fwS = EB ? sicher(() => EB.fw().stufe) : null; // Version 9: Frühwarnung, Termin, Hitze, voller Tag
    if (fwS && W.begriff(fwS === 'warnung' ? 'krank' : 'fruehwarnung')) return fwS === 'warnung' ? ['krank', 'Schutzmodus: So kommst du gut zurück ins Training'] : ['fruehwarnung', 'Frühwarnung: Was deine Nachtwerte sagen'];
    const tn = EB ? sicher(() => EB.naechster()) : null;
    if (tn && (toDay(tn.d) - toDay(h)) / DAY <= 7 && W.begriff('wichtiger_tag')) return ['wichtiger_tag', 'Bald ist es so weit: So nutzt du die Tage davor'];
    if (L.some((s) => ['schwelle', 'vo2', 'css', 'sweetspot', 'renntempo', 'sprint', 'test'].includes(s.typ)) && W.begriff('intervall_pausen')) return ['intervall_pausen', 'Heute Intervalle: Wie lang sollen die Pausen sein?'];
    if (EB && sicher(() => EB.hitze()) && W.begriff('hitze')) return ['hitze', 'Heute heiß: Worauf du beim Training achtest'];
    if (D.voll === 3 && W.begriff('mikropausen')) return ['mikropausen', 'Voller Tag: Warum kurze Pausen helfen'];
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
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => { berichtArt = 'woche'; T.geh('heute/woche'); });
      L.push(b);
    }
    sicher(() => (window.tfRennen && tfRennen.ankuendigungen ? tfRennen.ankuendigungen(localDate()) : []).forEach((a) => { // Version 45: Ankündigung 7, 2 und 1 Tag vor dem Rennen
      const b = el('button', { type: 'button', class: 'tf-zeile tf-zeile-ank', 'data-ank': String(a.tage) }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-pink)' }, svgIco('i-flag')), el('span', { class: 'tf-zeile-t' }, el('b', { text: a.titel }), el('small', { text: a.text })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => T.geh(a.tage === 1 ? 'rennen/renntag' : 'training/plan'));
      L.unshift(b);
    }));
    if (new Date().getDate() <= 3) { // Version 29: der Monatsbericht kommt von selbst
      const vm = vormonat(localDate().slice(0, 7));
      const b = el('button', { type: 'button', class: 'tf-zeile', id: 'zeile-monatsbericht' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-blue)' }, svgIco('i-bars')), el('span', { class: 'tf-zeile-t' }, el('small', { text: 'Neuer Monat' }), el('b', { text: 'Dein Monatsbericht ' + MON_L[+vm.slice(5, 7) - 1] + ' ist da' })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => { berichtArt = 'monat'; monatWahl = vm; T.geh('heute/woche'); });
      L.push(b);
    }
    sicher(() => { if (window.tfEinblick && tfEinblick.heuteZeilen) tfEinblick.heuteZeilen().forEach((x, i) => (x.id === 'zeile-morgen' ? L.splice(i, 0, x) : L.push(x))); });
    sicher(() => { if (window.tfLeistung && tfLeistung.heuteHinweise) tfLeistung.heuteHinweise().forEach((x) => L.push(x)); });
    sicher(() => { if (window.tfTageslauf && tfTageslauf.heuteZeilen) tfTageslauf.heuteZeilen().forEach((x) => L.unshift(x)); }); // Version 11: Kontext aus dem Check-in zuerst
    let liste = box.querySelector('#home-zeilen');
    if (!L.length) { if (liste) liste.remove(); return; }
    if (!liste) { liste = el('div', { class: 'tf-links', id: 'home-zeilen' }); box.appendChild(liste); }
    liste.replaceChildren(...L);
  }

  /* =====================================================================
     Version 29: Bericht – Woche oder Monat. Training (Zeit, Einheiten, Belastung, Plan), Erholung (Tune, HRV, Ruhepuls,
     Schlaf gegen dein Normal), Form, neue Bestwerte und Datenlage – mit Vergleich zum gleich langen Zeitraum davor
     (läuft der Zeitraum noch, bis zum selben Tag). Als PDF über tfTeilen.berichtPdf.
     ===================================================================== */
  let berichtArt = 'woche', monatWahl = null; // monatWahl: 'JJJJ-MM'
  const MON_L = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const tageZw = (a, b) => Math.round((toDay(b) - toDay(a)) / DAY);
  const monatEnde = (m) => iso(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0));
  const vormonat = (m) => iso(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 2, 1)).slice(0, 7);
  const hmin = (min) => Math.floor(min / 60) + ':' + String(Math.round(min % 60)).padStart(2, '0');
  function zeitraum(art, wahl) {
    const h = localDate();
    if (art === 'monat') {
      const m = wahl || h.slice(0, 7), von = m + '-01', ende = monatEnde(m), bis = ende < h ? ende : h, n = tageZw(von, bis);
      const vm = vormonat(m), vVon = vm + '-01', vEnde = monatEnde(vm), vBis = plusTage(vVon, n) < vEnde ? plusTage(vVon, n) : vEnde;
      return { art, wahl: m, von, bis, ende, vorVon: vVon, vorBis: vBis, titel: 'Monatsbericht ' + MON_L[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4), kurz: MON_L[+m.slice(5, 7) - 1], vorName: 'Vormonat', vorIn: 'im Vormonat', fertig: bis >= ende,
        spanne: '1.–' + +ende.slice(8, 10) + '. ' + MON_L[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4) };
    }
    const von = wahl || M().montag(h), ende = plusTage(von, 6), bis = ende < h ? ende : h, n = tageZw(von, bis);
    return { art: 'woche', wahl: von, von, bis, ende, vorVon: plusTage(von, -7), vorBis: plusTage(von, -7 + n), titel: 'Wochenbericht KW ' + T.ui.kwOf(von), kurz: 'KW ' + T.ui.kwOf(von), vorName: 'Vorwoche', vorIn: 'in der Vorwoche', fertig: bis >= ende,
      spanne: datumKurz(von) + '–' + datumKurz(ende) + ' ' + ende.slice(0, 4) };
  }
  function bericht(art, wahl) {
    const Z = zeitraum(art || berichtArt, wahl), X = window.tfEinheit, P = window.tfPlan, h = localDate();
    const inZ = (d, a, b) => d >= a && d <= b, minVon = (b) => (X ? X.minuten(b) : +b.min || 0);
    const U = X ? X.alle() : [], u = U.filter((b) => inZ(b.date, Z.von, Z.bis)), uv = U.filter((b) => inZ(b.date, Z.vorVon, Z.vorBis));
    const SP = X ? X.SPORT : {}, sp = (b) => (SP[b.sport] ? b.sport : 'other');
    const sum = (L, f) => L.reduce((a, b) => a + (f(b) || 0), 0);
    const je = {}; u.forEach((b) => { const k = sp(b); je[k] = je[k] || { n: 0, min: 0, km: 0, vor: 0 }; je[k].n++; je[k].min += minVon(b); je[k].km += +b.km || 0; });
    uv.forEach((b) => { const k = sp(b); if (je[k]) je[k].vor += minVon(b); });
    const training = { n: u.length, min: Math.round(sum(u, minVon)), tss: Math.round(sum(u, (b) => +b.tss)), nVor: uv.length, minVor: Math.round(sum(uv, minVon)), tssVor: Math.round(sum(uv, (b) => +b.tss)),
      je: Object.entries(je).map(([k, v]) => ({ k, name: (SP[k] || {}).name || k, farbe: (SP[k] || {}).farbe || 'gray', n: v.n, min: Math.round(v.min), km: v.km, vor: Math.round(v.vor) })).sort((a, b) => b.min - a.min) };
    // Plan: vergangene Tage ganz, heute nur Erledigtes
    let soll = 0, ist = 0;
    if (P && P.tagStatus) for (let d = Z.von; d <= Z.bis; d = plusTage(d, 1)) { const st = sicher(() => P.tagStatus(d)); if (!st || !st.imPlan) continue; st.einheiten.filter((e) => !e.rennen).forEach((e) => { if (d < h || e.ok) { soll++; if (e.ok) ist++; } }); }
    // Erholung
    const E = rowsOf('erholung') || [], e = E.filter((r) => inZ(r.date, Z.von, Z.bis)), ev = E.filter((r) => inZ(r.date, Z.vorVon, Z.vorBis));
    const mw = (L, f) => { const v = L.map(f).filter((x) => x != null && isFinite(x)); return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null; };
    const sc = e.filter((r) => r.score != null), ref = [...E].reverse().find((r) => r.date <= Z.bis && r.hrv_lo != null) || {};
    const byE = new Map(e.map((r) => [r.date, r])), tage = [];
    for (let d = Z.von; d <= Z.ende; d = plusTage(d, 1)) { const r = byE.get(d); tage.push({ d, score: r ? r.score : null, ampel: r && r.score != null ? r.ampel : null, kuenftig: d > Z.bis }); }
    const ck = (A().raw('checkins') || []).filter((c) => c && inZ(c.date, Z.von, Z.bis));
    const erholung = { tune: mw(sc, (r) => r.score), tuneVor: mw(ev.filter((r) => r.score != null), (r) => r.score), gruen: sc.filter((r) => r.ampel === 'gruen').length, gelb: sc.filter((r) => r.ampel === 'gelb').length, rot: sc.filter((r) => r.ampel === 'rot').length, n: sc.length, tage,
      hrv: mw(e, (r) => r.hrv), hrvLo: ref.hrv_lo, hrvHi: ref.hrv_hi, rhr: mw(e, (r) => r.rhr), rhrLo: ref.rhr_lo, rhrHi: ref.rhr_hi, schlaf: mw(e, (r) => r.schlaf_h), bedarf: mw(e, (r) => r.bedarf_h),
      naechte: e.filter((r) => r.hrv != null).length, tageN: tageZw(Z.von, Z.bis) + 1, checkins: ck.length };
    // Form: Fitness (CTL) vom Tag vor dem Zeitraum bis zum Ende, Form (TSB) am Ende
    const PM = rowsOf('pmc') || [], p0 = [...PM].reverse().find((r) => r.date < Z.von), p1 = [...PM].reverse().find((r) => r.date <= Z.bis);
    const form = p1 ? { ctl0: p0 ? p0.ctl : null, ctl1: p1.ctl, tsb: p1.tsb } : null;
    // Neue Bestwerte im Zeitraum – gegen alles davor (ab 5 Vergleichswerten) oder die 90 Tage davor (ab 3)
    const best = [];
    if (X) {
      const vor = U.filter((b) => b.date < Z.von), v90 = vor.filter((b) => b.date >= plusTage(Z.von, -90));
      const feld = (k) => (b) => { const G = X.roh(b.id); return G && +G[k] > 0 ? +G[k] : null; };
      [['run', 'Schnellster Lauf ab 5 km', (b) => { const G = X.roh(b.id); return G && +G.dist_m >= 5000 ? X.tempoLauf(G) : null; }, true, (v) => T.ui.mmss(v) + ' /km'],
        ['bike', 'Beste 5 Minuten', feld('p300'), false, (v) => Math.round(v) + ' W'], ['bike', 'Beste 20 Minuten', feld('p1200'), false, (v) => Math.round(v) + ' W'], ['bike', 'Beste 60 Minuten', feld('p3600'), false, (v) => Math.round(v) + ' W'],
        ['swim', 'Schnellste 400 m', feld('fs400'), true, (v) => T.ui.mmss(v)]].forEach(([s2, name, f, klein, fmt]) => {
        const besser = (a, b) => (klein ? a < b : a > b), im = u.filter((b) => b.sport === s2).map((b) => [b, sicher(() => f(b))]).filter((x) => x[1]);
        if (!im.length) return;
        const [bb, bv] = im.reduce((m, x) => (!m || besser(x[1], m[1]) ? x : m), null);
        const alt = vor.filter((b) => b.sport === s2).map((b) => sicher(() => f(b))).filter(Boolean), alt90 = v90.filter((b) => b.sport === s2).map((b) => sicher(() => f(b))).filter(Boolean);
        if (alt.length >= 5 && alt.every((v) => besser(bv, v))) best.push({ name, wert: fmt(bv), datum: bb.date, id: bb.id, art: 'Bestwert in deinen Daten' });
        else if (alt90.length >= 3 && alt90.every((v) => besser(bv, v))) best.push({ name, wert: fmt(bv), datum: bb.date, id: bb.id, art: 'bester Wert seit 90 Tagen' });
      });
    }
    // Drei bis vier Sätze, die den Zeitraum zusammenfassen
    const S = [], dm = training.min - training.minVor;
    S.push(training.n ? hmin(training.min) + ' h Training in ' + training.n + (training.n === 1 ? ' Einheit' : ' Einheiten') + (training.nVor || training.minVor ? ' – ' + (Math.abs(dm) < 10 ? 'etwa so viel wie ' + Z.vorIn : hmin(Math.abs(dm)) + ' h ' + (dm > 0 ? 'mehr' : 'weniger') + ' als ' + Z.vorIn) + (Z.fertig ? '' : ' bis zum selben Tag') : '') + '.' : 'Keine Einheiten in diesem Zeitraum.');
    if (soll) S.push('Plan zu ' + Math.round((100 * ist) / soll) + ' % erledigt (' + ist + ' von ' + soll + ').');
    if (erholung.tune != null) S.push('Tune im Schnitt ' + Math.round(erholung.tune) + (erholung.tuneVor != null ? ' (' + Z.vorName + ' ' + Math.round(erholung.tuneVor) + ')' : '') + ' – ' + erholung.gruen + (erholung.gruen === 1 ? ' grüner, ' : ' grüne, ') + erholung.rot + (erholung.rot === 1 ? ' roter Tag.' : ' rote Tage.'));
    if (best.length) S.push(best.length === 1 ? 'Ein neuer Bestwert: ' + best[0].name + ' ' + best[0].wert + '.' : best.length + ' neue Bestwerte, darunter ' + best[0].name + ' ' + best[0].wert + '.');
    else if (form && form.ctl0 != null) S.push('Fitness ' + (form.ctl1 - form.ctl0 >= 0 ? '+' : '−') + nf(Math.abs(form.ctl1 - form.ctl0), 1) + ' (CTL ' + nf(form.ctl0, 0) + ' → ' + nf(form.ctl1, 0) + ').');
    const lage = erholung.tageN ? 'HRV in ' + erholung.naechte + ' von ' + erholung.tageN + ' Nächten, ' + erholung.checkins + (erholung.checkins === 1 ? ' Check-in' : ' Check-ins') : '';
    return { Z, training, plan: soll ? [soll, ist] : null, erholung, form, best, saetze: S, lage, erstellt: h };
  }
  const vergleich = (a, b, f, u) => (a == null || b == null ? '' : Math.abs(a - b) < 0.5 ? 'wie davor' : (a > b ? '+' : '−') + f(Math.abs(a - b)) + (u || '') + ' zum Zeitraum davor');
  function berichtKopf(B) {
    const art = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Bericht für' }, ...[['woche', 'Woche'], ['monat', 'Monat']].map(([k, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(berichtArt === k) }, t); b.addEventListener('click', () => { berichtArt = k; T.neu(); }); return b; }));
    const h = localDate(), m0 = h.slice(0, 7);
    const wahl = berichtArt === 'monat' ? el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Monat' }, ...[[m0, 'Dieser Monat'], [vormonat(m0), 'Letzter Monat']].map(([x, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(x === B.Z.wahl) }, t); b.addEventListener('click', () => { monatWahl = x; T.neu(); }); return b; })) : null;
    const pdf = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'bericht-pdf' }, svgIco('i-download'), ' Als PDF sichern');
    pdf.addEventListener('click', () => { if (window.tfTeilen && tfTeilen.berichtPdf) tfTeilen.berichtPdf(bericht(berichtArt, berichtArt === 'monat' ? B.Z.wahl : B.Z.wahl)); });
    return el('article', { class: 'tf-card tf-span2 tf-bericht', id: 'karte-bericht' },
      el('div', { class: 'tf-bericht-k' }, art, wahl),
      el('h2', { class: 'tf-bericht-t', text: B.Z.titel }),
      el('p', { class: 'tf-sub', text: B.Z.spanne + (B.Z.fertig ? '' : ' · läuft noch, Vergleich bis zum selben Tag') }),
      el('ul', { class: 'tf-bericht-s' }, ...B.saetze.map((t) => el('li', { text: t }))),
      B.lage ? el('p', { class: 'tf-note', text: 'Datenlage: ' + B.lage + '.' }) : null,
      el('div', { class: 'tf-form-actions' }, pdf));
  }
  function berichtKarten(B) {
    const out = [], E = B.erholung;
    // Erholung: Tune je Tag als Band, Schnitt gegen davor, Messwerte gegen dein Normal
    const c = karte({ farbe: 'green', icon: 'i-heart', titel: 'Erholung', sub: E.n ? 'Tune im Schnitt ' + Math.round(E.tune) + ' · ' + E.gruen + ' grün, ' + E.gelb + ' gelb, ' + E.rot + ' rot' : 'Keine Tune-Werte in diesem Zeitraum', id: 'karte-bericht-erholung' });
    c.appendChild(el('div', { class: 'tf-bericht-band', role: 'img', 'aria-label': 'Tune je Tag' }, ...E.tage.map((t) => el('span', { class: 'tf-bb-t ' + (t.kuenftig ? 'bald' : t.ampel || 'leer'), title: datumKurz(t.d) + (t.score != null ? ' · Tune ' + t.score : t.kuenftig ? '' : ' · keine Daten') }, B.Z.art === 'woche' ? el('small', { text: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][tageZw(B.Z.von, t.d)] }) : null))));
    const zeile = (n, w, sub) => el('div', { class: 'tf-bericht-z' }, el('span', { text: n }), el('b', { class: 'num', text: w }), el('small', { text: sub }));
    c.appendChild(el('div', { class: 'tf-bericht-zl' },
      zeile('Tune Ø', E.tune != null ? String(Math.round(E.tune)) : '–', vergleich(E.tune, E.tuneVor, (x) => nf(x, 0))),
      zeile('HRV Ø', E.hrv != null ? Math.round(E.hrv) + ' ms' : '–', E.hrvLo != null ? 'normal ' + E.hrvLo + '–' + E.hrvHi + ' ms' : ''),
      zeile('Ruhepuls Ø', E.rhr != null ? nf(E.rhr, 0) + ' bpm' : '–', E.rhrLo != null ? 'normal ' + Math.round(E.rhrLo) + '–' + Math.round(E.rhrHi) + ' bpm' : ''),
      zeile('Schlaf Ø', E.schlaf != null ? hmin(E.schlaf * 60) + ' h' : '–', E.bedarf != null ? 'Bedarf ' + hmin(E.bedarf * 60) + ' h' : '')));
    out.push(c);
    // Form und Belastung
    const F = B.form, t = B.training;
    const f = karte({ farbe: 'blue', icon: 'i-gauge', titel: 'Belastung und Form', sub: 'Aus deinen Einheiten (TSS) und dem Fitness-Konto', id: 'karte-bericht-form' });
    f.appendChild(el('div', { class: 'tf-bericht-zl' },
      zeile('Belastung', nf(t.tss) + ' TSS', vergleich(t.tss, t.tssVor, (x) => nf(x, 0), ' TSS')),
      F && F.ctl0 != null ? zeile('Fitness (CTL)', nf(F.ctl0, 0) + ' → ' + nf(F.ctl1, 0), (F.ctl1 - F.ctl0 >= 0 ? '+' : '−') + nf(Math.abs(F.ctl1 - F.ctl0), 1) + ' im Zeitraum') : null,
      F ? zeile('Form (TSB)', (F.tsb >= 0 ? '+' : '−') + nf(Math.abs(F.tsb), 0), 'am ' + datumKurz(B.Z.bis) + ' · ' + T.ui.formText(F.tsb)) : null,
      B.plan ? zeile('Plan', Math.round((100 * B.plan[1]) / B.plan[0]) + ' %', B.plan[1] + ' von ' + B.plan[0] + ' Einheiten erledigt') : null));
    out.push(f);
    // Neue Bestwerte
    const b = karte({ farbe: 'gold', icon: 'i-medal', titel: 'Neue Bestwerte', sub: B.best.length ? 'Gegen alles davor oder die 90 Tage davor' : 'Diesmal keine', id: 'karte-bericht-best' });
    if (B.best.length) b.appendChild(el('div', { class: 'tf-bericht-zl' }, ...B.best.map((x) => { const z = zeile(x.name, x.wert, x.art + ' · ' + datumKurz(x.datum)); z.classList.add('tf-bericht-best'); z.addEventListener('click', () => T.geh('training/buch/' + x.id)); return z; })));
    else b.appendChild(el('p', { class: 'tf-note', text: 'Bestwerte zählen für Läufe ab 5 km, beste 5, 20 und 60 Minuten auf dem Rad und 400 m im Wasser – gegen deine Daten davor.' }));
    out.push(b);
    return out;
  }
  function monatKarten(B) { // Monat: Zahlen und Sportarten wie im Wochenrückblick
    const t = B.training;
    const kachel = (titel, wert, u, sub, farbe, icon) => el('div', { class: 'tf-wr-k', style: '--c:var(--tf-' + farbe + ')' }, el('span', { class: 'tf-wr-i' }, svgIco(icon)), el('small', { text: titel }), el('b', { class: 'num' }, wert == null ? '–' : String(wert), u && wert != null ? el('span', { class: 'tf-u', text: u }) : null), el('em', { text: sub || '' }));
    const K = [kachel('Training', hmin(t.min), 'h', vergleich(t.min, t.minVor, (x) => hmin(x), ' h'), 'orange', 'i-bolt'), kachel('Einheiten', t.n, '', vergleich(t.n, t.nVor, (x) => nf(x, 0)), 'orange', 'i-bars'),
      B.plan ? kachel('Plan erledigt', B.plan[1] + '/' + B.plan[0], '', Math.round((100 * B.plan[1]) / B.plan[0]) + ' %', 'blue', 'i-cal') : null,
      kachel('Check-ins', B.erholung.checkins, '', 'an ' + B.erholung.tageN + ' Tagen', 'green', 'i-smile')].filter(Boolean);
    const c1 = el('article', { class: 'tf-card tf-span2 tf-wr', id: 'karte-monat' }, el('div', { class: 'tf-wr-raster' }, ...K));
    let c2 = null;
    if (t.je.length) {
      const max = Math.max(...t.je.map((x) => x.min));
      c2 = karte({ farbe: 'orange', icon: 'i-bars', titel: 'Wofür du dir Zeit genommen hast', sub: 'Je Sportart, ' + B.Z.vorName + ' zum Vergleich', id: 'karte-monat-sport' });
      c2.appendChild(el('div', { class: 'tf-gym-balken' }, ...t.je.map((x) => { const i = el('i'); i.style.width = (100 * x.min) / max + '%'; i.style.background = 'var(--tf-' + x.farbe + ')'; return el('div', { class: 'tf-gym-bz' }, el('span', { text: x.name }), el('span', { class: 'tf-gym-bar' }, i), el('b', { class: 'num', text: hmin(x.min) })); })));
    }
    return [c1, c2].filter(Boolean);
  }

  /* =====================================================================
     Wochenrückblick
     ===================================================================== */
  let wocheWahl = null; // Montag der gezeigten Woche
  const wocheStandard = () => { const m0 = M().montag(localDate()), wtag = (new Date().getDay() + 6) % 7; return wtag === 0 && new Date().getHours() < 12 ? plusTage(m0, -7) : m0; }; // Montagvormittag zeigt noch die letzte Woche
  function renderWoche() {
    if (berichtArt === 'monat') { // Version 29: Monatsbericht
      const box = $('#woche-box'); if (!box) return;
      const B = bericht('monat', monatWahl);
      T.kopf({ titel: 'Bericht', sub: B.Z.spanne + (B.Z.fertig ? '' : ' · läuft noch') });
      box.replaceChildren(el('div', { class: 'tf-grid' }, berichtKopf(B), ...monatKarten(B), ...berichtKarten(B)));
      return;
    }
    const box = $('#woche-box'); if (!box) return;
    const h = localDate(), m0 = M().montag(h);
    const start = wocheWahl || wocheStandard();
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
    const B0 = sicher(() => bericht('woche', start)), t0 = B0 && B0.training; // Version 29: dieselben Zahlen wie im Bericht (Kraft mit Pausen, Vergleich bis zum selben Tag)
    const K = [
      t0 ? kachel('Einheiten', t0.n, '', (t0.min ? hm(t0.min) + ' h · ' : '') + (t0.n - t0.nVor >= 0 ? '+' : '−') + Math.abs(t0.n - t0.nVor) + ' zur Vorwoche' + (b.fertig ? '' : ' bis heute'), 'orange', 'i-bolt')
        : kachel('Einheiten', b.einheiten, '', b.minuten ? hm(b.minuten) + ' h · ' + diff(b.einheiten, vor.einheiten) : diff(b.einheiten, vor.einheiten), 'orange', 'i-bolt'),
      (B0 && B0.plan) || b.plan ? (() => { const pp = (B0 && B0.plan) || b.plan; return kachel('Plan erledigt', pp[1] + '/' + pp[0], '', Math.round((100 * pp[1]) / pp[0]) + ' %', 'blue', 'i-cal'); })() : null, // Version 29: wie im Bericht (heute zählt nur Erledigtes)
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
      : b.checkins < 4 ? ['i-smile', 'Check-in an mindestens 5 Tagen – dein Gefühl macht deinen Tune genauer.']
        : b.plan && b.plan[1] < 0.8 * b.plan[0] ? ['i-cal', 'Plan anpassen: Lieber eine Einheit weniger planen und alle schaffen als viele verpassen.']
          : modus() !== 'performance' && !b.gym ? ['i-dumbbell', 'Zwei kurze Kraft-Einheiten – die WHO empfiehlt Kraft an zwei Tagen pro Woche.']
            : b.schritte != null && b.schritte < 6000 ? ['i-steps', 'Mehr Alltagsbewegung: Ein Spaziergang nach dem Essen bringt schnell 2.000 Schritte.']
              : ['i-star', 'Weiter so – halte den Rhythmus und plane auch einen echten Ruhetag ein.'];
    const c3 = karte({ farbe: 'green', icon: 'i-target', titel: 'Für nächste Woche', sub: 'Eine Sache reicht', id: 'karte-woche-tipp' });
    c3.appendChild(el('p', { class: 'tf-wr-tipp' }, svgIco(tipp[0]), el('span', { text: tipp[1] })));
    if (trophaeen.length) c3.appendChild(el('p', { class: 'tf-note', text: 'Neue Trophäen: ' + trophaeen.map((t) => t.name).join(', ') + '.' }));
    const B = B0; // Version 29: Bericht mit Erholung, Form, Bestwerten und PDF
    T.kopf({ titel: 'Bericht' });
    box.replaceChildren(el('div', { class: 'tf-grid' }, B ? berichtKopf(B) : null, c1, c2, ...(B ? berichtKarten(B) : []), c3));
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
  window.tfAlltag = { bericht, berichtWoche: () => bericht('woche', wocheStandard()), berichtZeigen: (art, wahl) => { berichtArt = art === 'monat' ? 'monat' : 'woche'; if (berichtArt === 'monat') monatWahl = wahl || null; else wocheWahl = wahl || null; T.geh('heute/woche'); }, // Version 29
    modus, modusGesetzt, MODI, tb, tbAendern, ziele, tagDaten, tipps, khHeute, briefingMorgen, wissenHeute, cfg, cfgSpeichern,
    protokollFuer: (d) => { protokollTag = d; T.geh('gesundheit/protokoll'); } }; // Version 11: „Für gestern nachtragen“
})();
