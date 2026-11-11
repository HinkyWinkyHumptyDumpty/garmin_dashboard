/* Dreiklang · Gesundheitsbild, Schritte & Bewegung, Stress & Body Battery, Sauerstoff im Schlaf.
   Das Gesundheitsbild fasst zwölf Werte aus Garmin zusammen – jeder gegen dein eigenes Normal oder
   gegen eine anerkannte Empfehlung – und zeigt auf einen Blick, wo du gut liegst und was auffällt. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, svg, nf, rowsOf, svgIco, localDate, iso, toDay, DAY, plot, roundTop, hoverBands, refLine, col, hm, setMsg, segButtons } = T.ui;
  const { karte } = S;
  const A = () => dash.app;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const mittel = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
  const median = (v) => { const x = v.slice().sort((p, q) => p - q); return x.length ? x[x.length >> 1] : null; };
  const sd = (v) => { const m = mittel(v); return v.length > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1)) : null; };
  const sg = (x, d) => (x == null || !isFinite(x) ? '' : (x > 0 ? '+' : x < 0 ? '−' : '±') + nf(Math.abs(x), d || 0));
  const plusT = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const tm = (d) => +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.';
  const STATUS_FARBE = { gut: 'green', mittel: 'yellow', achtung: 'red', leer: 'gray', info: 'gray' }; // Version 42: info = Messwert ohne Bewertung (SpO₂)

  /* =====================================================================
     Rohwerte je Tag
     ===================================================================== */
  function tage() { const m = new Map(); (A().raw('garmin_tage') || []).forEach((r) => { if (r && r.date) m.set(r.date, r); }); return m; }
  const zahl = (x) => (x == null || x === '' || !isFinite(+x) ? null : +x);
  const schritte = (r) => (r && zahl(r.steps) > 0 ? +r.steps : null);
  const stress = (r) => (r && zahl(r.stress_avg) != null && +r.stress_avg >= 0 ? +r.stress_avg : null); // −1/−2: zu wenig Messzeit
  const bewegt = (r) => (r && (r.im_moderate != null || r.im_vigorous != null) ? (+r.im_moderate || 0) + 2 * (+r.im_vigorous || 0) : null);
  function bezugsTag(D) { // jüngster Tag mit Messwerten – darauf beziehen sich die Fenster
    const h = localDate(); let best = null;
    D.forEach((r, d) => { if (d <= h && (zahl(r.hrv) || zahl(r.rhr) || schritte(r) || zahl(r.sleep_s)) && (!best || d > best)) best = d; });
    return best;
  }
  const zielFest = () => Math.round(athlet().schritte_ziel || 8000);
  // Schrittziel: fest – oder auf Wunsch dynamisch (Median der 4 Wochen davor + 500, 5.000–12.000, an roten Tagen × 0,8)
  function zielInfo(d) {
    const a = athlet(), fest = zielFest(), M = window.tfAlltagMotor;
    if (!a.schritte_dyn || !M) return { ziel: fest, art: 'fest' };
    const D = tage(), tag = d || localDate();
    const e = (rowsOf('erholung') || []).find((r) => r.date === tag && r.score != null);
    return M.schrittZiel({ basis: fest, dyn: true, datum: tag, schritte: (x) => schritte(D.get(x)), ampel: e ? e.ampel : null });
  }
  const ziel = () => zielInfo().ziel;

  /* =====================================================================
     Gesundheitsbild: zwölf Werte in vier Bereichen
     ===================================================================== */
  const BEREICHE = [['erholung', 'Erholung', 'purple'], ['schlaf', 'Schlaf', 'indigo'], ['aktiv', 'Aktivität', 'green'], ['stress', 'Stress & Energie', 'orange']];
  function werte() {
    const D = tage(), bez = bezugsTag(D); if (!bez) return null;
    const E = new Map((rowsOf('erholung') || []).map((r) => [r.date, r])), a = athlet();
    const tag = (i) => plusT(bez, -i);
    const reihe = (n, fn, ab) => { const v = []; for (let i = ab || 0; i < (ab || 0) + n; i++) { const x = fn(tag(i)); if (x != null && isFinite(x)) v.push(x); } return v; };
    const r7 = (fn, ab) => { const v = []; for (let i = 6 + (ab || 0); i >= (ab || 0); i--) { const x = fn(tag(i)); v.push(x != null && isFinite(x) ? x : null); } return v; }; // Version 21: 7 Tage, ältester zuerst, Lücken als null
    const eNeu = (feld) => { for (let i = 0; i < 4; i++) { const r = E.get(tag(i)); if (r && r[feld] != null) return r; } return null; };
    const W = [];
    const add = (o) => W.push(Object.assign({ status: 'leer', wert: '–', u: '', trend: '' }, o));
    // Erholung
    { const r = eNeu('hrv7'); const o = { id: 'hrv', bereich: 'erholung', name: 'HRV', ziel: 'gesundheit/hrv', tipp: 'HRV unter deinem Normal: heute lieber locker trainieren und früh ins Bett.', r7: r7((d) => { const x = E.get(d); return x ? x.hrv : null; }), basis: r && r.hrv_basis };
      if (r) { o.wert = nf(r.hrv7); o.u = 'ms'; if (r.hrv_basis != null && r.z_hrv7 != null) { const p = Math.round(100 * (r.hrv7 / r.hrv_basis - 1)); o.trend = Math.abs(r.z_hrv7) < 0.5 ? 'im Normalbereich' : sg(p) + ' % zu normal'; o.status = r.z_hrv7 >= -0.5 ? 'gut' : r.z_hrv7 >= -1.5 ? 'mittel' : 'achtung'; } else o.trend = 'Normal entsteht'; }
      add(o); }
    { const r = eNeu('rhr7'); const o = { id: 'puls', bereich: 'erholung', name: 'Ruhepuls', ziel: 'gesundheit/puls', tipp: 'Ruhepuls über deinem Normal – oft Ermüdung, Stress, Alkohol oder ein beginnender Infekt.', r7: r7((d) => { const x = E.get(d); return x ? x.rhr : null; }), basis: r && r.rhr_basis, umgekehrt: true };
      if (r) { o.wert = nf(r.rhr7); o.u = 'bpm'; if (r.rhr_basis != null && r.z_rhr7 != null) { const dlt = Math.round(r.rhr7 - r.rhr_basis); o.trend = Math.abs(r.z_rhr7) < 0.5 ? 'im Normalbereich' : sg(dlt) + ' zu normal'; o.status = r.z_rhr7 <= 0.5 ? 'gut' : r.z_rhr7 <= 1.5 ? 'mittel' : 'achtung'; } else o.trend = 'Normal entsteht'; }
      add(o); }
    { const B = (rowsOf('befinden') || []).filter((b) => b.date > plusT(bez, -7) && b.date <= localDate()); const o = { id: 'befinden', bereich: 'erholung', name: 'Befinden', ziel: 'gesundheit/checkin', tipp: 'Dein Befinden ist gedämpft – gönn dir Erholung und nimm Beschwerden ernst.' };
      if (B.length) { const p = Math.round(mittel(B.map((b) => b.pct))); o.wert = String(p); o.u = '%'; o.trend = B.length + (B.length === 1 ? ' Check-in' : ' Check-ins') + ' in 7 Tagen'; o.status = p >= 60 ? 'gut' : p >= 40 ? 'mittel' : 'achtung'; }
      else o.trend = 'kein Check-in in 7 Tagen';
      add(o); }
    // Schlaf
    const bedarf = (a.schlafbedarf_min || 480) / 60;
    { const v = reihe(7, (d) => { const r = E.get(d); return r ? r.schlaf_h : null; }); const o = { r7: r7((d) => { const r = E.get(d); return r ? r.schlaf_h : null; }), basis: bedarf, id: 'schlaf', bereich: 'schlaf', name: 'Dauer', ziel: 'gesundheit/schlaf', tipp: 'Weniger Schlaf als dein Ziel – eine feste Bettzeit hilft am meisten.' };
      if (v.length >= 2) { const m = mittel(v), q = m / bedarf; o.wert = hm(m); o.u = 'h'; o.trend = 'Ø ' + v.length + ' Nächte · Ziel ' + hm(bedarf); o.status = q >= 0.95 ? 'gut' : q >= 0.85 ? 'mittel' : 'achtung'; }
      add(o); }
    { const v = reihe(14, (d) => { const r = E.get(d); return r ? r.start_h : null; }); const o = { id: 'rhythmus', bereich: 'schlaf', name: 'Rhythmus', ziel: 'gesundheit/schlaf', tipp: 'Deine Einschlafzeit schwankt stark – gleiche Zeiten, auch am Wochenende, machen Schlaf erholsamer.' };
      if (v.length >= 5) { const s = sd(v) * 60; o.wert = '± ' + nf(s); o.u = 'min'; o.trend = 'Einschlafzeit, ' + v.length + ' Nächte'; o.status = s <= 30 ? 'gut' : s <= 60 ? 'mittel' : 'achtung'; }
      add(o); }
    { const r = eNeu('atem'); const o = { id: 'atmung', bereich: 'schlaf', name: 'Atmung', ziel: 'gesundheit/puls', tipp: 'Eine höhere nächtliche Atemfrequenz kann viele Ursachen haben. Beobachte den Verlauf zusammen mit Schlaf, Befinden und Belastung – sie ist allein kein Infekt-Nachweis.' }; // Version 42 (aus V33)
      if (r) { o.wert = nf(r.atem, 1); o.u = '/min'; if (r.atem_basis != null) { const dl = r.atem - r.atem_basis; o.trend = r.atem_alarm ? 'deutlich über normal' : Math.abs(dl) < 0.5 ? 'im Normalbereich' : sg(dl, 1) + ' zu normal'; o.status = r.atem_alarm ? 'achtung' : Math.abs(dl) < 1 ? 'gut' : 'mittel'; } else o.trend = 'Normal entsteht'; }
      add(o); }
    // Aktivität
    { const z = ziel(), v = reihe(7, (d) => schritte(D.get(d)), bez === localDate() ? 1 : 0), alt = reihe(28, (d) => schritte(D.get(d)), 8); const o = { r7: r7((d) => schritte(D.get(d)), bez === localDate() ? 1 : 0), basis: z, id: 'schritte', bereich: 'aktiv', name: 'Schritte', ziel: 'gesundheit/aktivitaet', tipp: 'Unter deinem Schrittziel – kurze Wege zu Fuß und ein Spaziergang nach dem Essen summieren sich.' };
      if (v.length >= 2) { const m = mittel(v); o.wert = nf(Math.round(m / 10) * 10); o.u = 'Ø'; o.trend = alt.length >= 7 ? sg(Math.round((100 * m) / mittel(alt) - 100)) + ' % zu den Wochen davor' : 'Ziel ' + nf(z); o.status = m >= z ? 'gut' : m >= 0.7 * z ? 'mittel' : 'achtung'; }
      add(o); }
    { const v = reihe(7, (d) => bewegt(D.get(d))); const o = { id: 'bewegung', bereich: 'aktiv', name: 'Bewegung', ziel: 'gesundheit/aktivitaet', tipp: 'Unter 150 Bewegungsminuten in 7 Tagen – das empfiehlt die WHO mindestens.' };
      if (v.length >= 3) { const s = v.reduce((x, y) => x + y, 0); o.wert = nf(s); o.u = 'min'; o.trend = '7 Tage · WHO: 150–300'; o.status = s >= 150 ? 'gut' : s >= 75 ? 'mittel' : 'achtung'; }
      add(o); }
    { const FA = (rowsOf('fitness_alter') || []).filter((r) => r.status === 'ok'), f = FA[FA.length - 1]; const o = { id: 'fitness', bereich: 'aktiv', name: 'Fitness-Alter', ziel: 'gesundheit/fitness', tipp: 'Das Fitness-Alter ist eine modellbasierte Schätzung aus deinen verfügbaren Daten, kein medizinischer Messwert. Regelmäßiges, passendes Training kann deine Ausdauerwerte verbessern.' }; // Version 42 (aus V33)
      if (f) { o.wert = nf(f.fitness_alter, 1); o.u = 'J.'; o.trend = Math.abs(f.diff) < 0.5 ? 'wie dein Alter' : nf(Math.abs(f.diff), 1) + ' J. ' + (f.diff < 0 ? 'jünger' : 'älter'); o.status = f.diff <= 0 ? 'gut' : f.diff <= 3 ? 'mittel' : 'achtung'; }
      else o.trend = (rowsOf('fitness_alter') || []).some((r) => r.status === 'profil') ? 'Geburtsjahr eintragen' : 'zu wenig Daten';
      add(o); }
    // Stress & Energie
    { const v = reihe(7, (d) => stress(D.get(d))), b = reihe(28, (d) => stress(D.get(d)), 7); const o = { r7: r7((d) => stress(D.get(d))), basis: b.length >= 7 ? mittel(b) : null, umgekehrt: true, id: 'stress', bereich: 'stress', name: 'Stress', ziel: 'gesundheit/stress', tipp: 'Mehr Stress als sonst – kurze Atempausen, Bewegung draußen und ein ruhiger Abend helfen.' };
      if (v.length >= 2) { const m = mittel(v), base = b.length >= 10 ? median(b) : null; o.wert = nf(m); o.u = 'Ø'; if (base != null) { const dl = m - base; o.trend = Math.abs(dl) < 2 ? 'wie üblich' : sg(dl) + ' zu normal'; o.status = dl <= 3 && m <= 50 ? 'gut' : dl <= 8 && m <= 60 ? 'mittel' : 'achtung'; } else { o.trend = m <= 25 ? 'entspannt' : m <= 50 ? 'niedrig' : m <= 75 ? 'mittel' : 'hoch'; o.status = m <= 30 ? 'gut' : m <= 45 ? 'mittel' : 'achtung'; } }
      add(o); }
    { const v = reihe(7, (d) => { const r = D.get(d); return r && zahl(r.bb_max) > 0 ? +r.bb_max : null; }), b = reihe(28, (d) => { const r = D.get(d); return r && zahl(r.bb_max) > 0 ? +r.bb_max : null; }, 7); const o = { id: 'energie', bereich: 'stress', name: 'Body Battery', ziel: 'gesundheit/stress', tipp: 'Deine Body Battery lädt schlechter als sonst – Schlaf, wenig Alkohol und ruhige Abende helfen.' };
      if (v.length >= 2) { const m = mittel(v), base = b.length >= 10 ? median(b) : null; o.wert = nf(m); o.u = 'Ø max'; if (base != null) { const dl = m - base; o.trend = Math.abs(dl) < 3 ? 'wie üblich' : sg(dl) + ' zu normal'; o.status = dl >= -5 || m >= 80 ? 'gut' : dl >= -15 ? 'mittel' : 'achtung'; } else { o.trend = 'morgens geladen'; o.status = m >= 70 ? 'gut' : m >= 50 ? 'mittel' : 'achtung'; } }
      add(o); }
    { const v = reihe(7, (d) => { const r = D.get(d); return r && zahl(r.sleep_spo2) > 50 ? +r.sleep_spo2 : null; }); const o = { id: 'spo2', bereich: 'stress', name: 'SpO₂', ziel: 'gesundheit/puls', tipp: 'Sauerstoff nachts niedriger als üblich. Uhren schätzen ihn nur – bei Atemnot oder Schnarchen mit Aussetzern ärztlich abklären.' };
      // Version 42 (aus V33, ergänzt): Uhren schätzen SpO₂ nur – keine Ampel, aber der Vergleich mit deinem eigenen Normal steht als Text da
      if (v.length >= 2) { const m = mittel(v), b = reihe(28, (d) => { const r = D.get(d); return r && zahl(r.sleep_spo2) > 50 ? +r.sleep_spo2 : null; }, 7), base = b.length >= 10 ? median(b) : null; o.wert = nf(m); o.u = '%'; o.trend = (base != null ? (Math.abs(m - base) < 1 ? 'wie üblich' : sg(m - base, 1) + ' zu normal') + ' · ' : 'Ø ' + v.length + ' Nächte · ') + 'Uhr-Schätzung'; o.status = 'info'; }
      add(o); }
    return { bezug: bez, alt: (toDay(localDate()) - toDay(bez)) / DAY, liste: W };
  }

  function rad(W) { // zwölf Felder im Kreis, in vier Bereichen
    const s = svg('svg', { viewBox: '0 0 200 200', class: 'tf-gb-rad', role: 'img', 'aria-label': W.filter((w) => w.status === 'gut').length + ' von ' + W.filter((w) => w.status !== 'leer').length + ' Werten im grünen Bereich' });
    const pol = (r, a) => [100 + r * Math.sin(a), 100 - r * Math.cos(a)];
    const bogen = (r0, r1, a0, a1) => { const [x0, y0] = pol(r1, a0), [x1, y1] = pol(r1, a1), [x2, y2] = pol(r0, a1), [x3, y3] = pol(r0, a0), g = a1 - a0 > Math.PI ? 1 : 0; return 'M' + x0 + ' ' + y0 + 'A' + r1 + ' ' + r1 + ' 0 ' + g + ' 1 ' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + 'A' + r0 + ' ' + r0 + ' 0 ' + g + ' 0 ' + x3 + ' ' + y3 + 'Z'; };
    const G = (Math.PI * 2) / 12, luecke = 0.035, bereichsLuecke = 0.07;
    W.forEach((w, i) => {
      const b = i % 3 === 0 ? bereichsLuecke : luecke, e = i % 3 === 2 ? bereichsLuecke : luecke;
      const p = svg('path', { d: bogen(64, 92, i * G + b, (i + 1) * G - e), fill: col(STATUS_FARBE[w.status]), opacity: w.status === 'leer' ? 0.28 : w.status === 'info' ? 0.55 : 1, class: 'tf-gb-feld' }, s);
      const t = svg('title', null, p); t.textContent = w.name + ': ' + w.wert + ' ' + w.u;
    });
    BEREICHE.forEach((b, k) => svg('path', { d: bogen(95, 98.5, k * 3 * G + bereichsLuecke, (k + 1) * 3 * G - bereichsLuecke), fill: col('fg3') }, s)); // Version 14: Bereiche nur als Lücken, die Farbe gehört dem Zustand
    const gut = W.filter((w) => w.status === 'gut').length, da = W.filter((w) => w.status !== 'leer' && w.status !== 'info').length; // Version 42: nur bewertete Werte
    const z = svg('text', { x: 100, y: 96, 'text-anchor': 'middle', class: 'tf-gb-zahl' }, s); z.textContent = da ? gut + '/' + da : '–';
    const u = svg('text', { x: 100, y: 118, 'text-anchor': 'middle', class: 'tf-gb-unter' }, s); u.textContent = 'im grünen';
    const u2 = svg('text', { x: 100, y: 132, 'text-anchor': 'middle', class: 'tf-gb-unter' }, s); u2.textContent = 'Bereich';
    return s;
  }
  function mini7(w) { // sieben Tage als kleine Balken: Höhe = Wert, Linie = dein Normal, der letzte Balken in der Statusfarbe
    const V = w.r7, vals = V.filter((x) => x != null), lo0 = Math.min(...vals, w.basis != null ? w.basis : Infinity), hi = Math.max(...vals, w.basis != null ? w.basis : -Infinity), lo = lo0 - Math.max(1e-6, hi - lo0) * 0.6, span = Math.max(1e-6, hi - lo); // unten Luft, damit Unterschiede lesbar bleiben und kein Balken verschwindet
    const W = 140, H = 14, bw = W / 7;
    const sv = svg('svg', { class: 'tf-gb-mini', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const y = (v) => 2 + (H - 4) * (1 - (v - lo) / span);
    V.forEach((v, i) => { if (v == null) return; const yy = y(v), hh = Math.max(1.5, H - yy); svg('rect', { x: (i * bw + 3).toFixed(1), y: (H - hh).toFixed(1), width: (bw - 6).toFixed(1), height: hh.toFixed(1), rx: 1, fill: i === V.length - 1 ? col(STATUS_FARBE[w.status] || 'gray') : col('fg3'), opacity: i === V.length - 1 ? 1 : 0.45 }, sv); });
    if (w.basis != null && isFinite(w.basis)) svg('line', { x1: 0, x2: W, y1: y(w.basis).toFixed(1), y2: y(w.basis).toFixed(1), stroke: col('fg2'), 'stroke-width': 1, 'stroke-dasharray': '2 2' }, sv);
    return sv;
  }
  function bildKarte() {
    if (A().state.ohne) return null;
    const R = werte(); if (!R) return null;
    const W = R.liste, n = (st) => W.filter((w) => w.status === st).length;
    const da = n('gut') + n('mittel') + n('achtung'); // Version 42 (aus V33): nur Werte, die wirklich bewertet sind
    const kopfzeile = !da ? 'Noch zu wenige Daten' : n('achtung') >= 2 ? 'Mehrere Werte weichen ab' : n('achtung') === 1 ? 'Ein Wert weicht deutlich ab' : n('mittel') >= 3 ? 'Ein gemischtes Bild' : n('mittel') ? 'Fast alles im Orientierungsbereich' : 'Erfasste Werte im Orientierungsbereich';
    const auffaellig = W.filter((w) => w.status === 'achtung').concat(W.filter((w) => w.status === 'mittel')).slice(0, 2);
    const seitlich = el('div', { class: 'tf-gb-s' },
      el('b', { class: 'tf-gb-titel', text: kopfzeile }),
      el('div', { class: 'tf-gb-zaehl' }, ...[['gut', 'gut'], ['mittel', 'mittel'], ['achtung', 'Achtung']].filter(([st]) => n(st)).map(([st, t]) => el('span', null, el('i', { class: 'tf-ampel', style: 'background:var(--tf-' + STATUS_FARBE[st] + ')' }), n(st) + ' ' + t))),
      n('leer') ? el('small', { class: 'tf-gb-leer-t', text: n('leer') + (n('leer') === 1 ? ' Wert braucht' : ' Werte brauchen') + ' noch mehr Daten' }) : null);
    const hinweise = auffaellig.length ? el('div', { class: 'tf-gb-auf' }, ...auffaellig.map((w) => { const b = el('button', { type: 'button' }, el('i', { class: 'tf-ampel', style: 'background:var(--tf-' + STATUS_FARBE[w.status] + ')' }), el('span', null, el('b', { text: w.name + ': ' }), w.tipp), svgIco('i-chev')); b.addEventListener('click', () => T.geh(w.ziel)); return b; })) : el('p', { class: 'tf-gb-ok', text: da ? 'Die erfassten Werte liegen in ihren Orientierungsbereichen. Fehlende Werte werden nicht bewertet.' : 'Trag deine Uhr ein paar Tage und Nächte – dann füllt sich dein Bild.' });
    const bl = el('div', { class: 'tf-gb-bereiche' }, ...BEREICHE.map(([id, name]) => el('div', { class: 'tf-gb-b' },
      el('h3', null, name),
      ...W.filter((w) => w.bereich === id).map((w) => {
        const b = el('button', { type: 'button', class: 'tf-gb-w tf-gb-' + w.status, 'data-w': w.id, 'aria-label': w.name + ': ' + w.wert + ' ' + w.u + (w.trend ? ', ' + w.trend : '') },
          el('i', { class: 'tf-ampel', style: 'background:var(--tf-' + STATUS_FARBE[w.status] + ')' }),
          el('span', { class: 'tf-gb-n', text: w.name }),
          el('span', { class: 'tf-gb-v num' }, w.wert, w.wert !== '–' && w.u ? el('small', { text: ' ' + w.u }) : null),
          el('small', { class: 'tf-gb-t', text: w.trend }),
          w.r7 && w.r7.filter((x) => x != null).length >= 3 ? mini7(w) : null);
        b.addEventListener('click', () => T.geh(w.ziel));
        return b;
      }))));
    const stand = R.alt <= 0 ? 'heute' : R.alt === 1 ? 'gestern' : 'vom ' + tm(R.bezug);
    const c = karte({ id: 'karte-gesundheitsbild', farbe: 'pink', icon: 'i-heart', titel: 'Dein Gesundheitsbild', sub: 'Zwölf Werte gegen dein eigenes Normal · Stand ' + stand, span2: true, cls: 'tf-gb' });
    if (R.alt > 3) c.appendChild(el('p', { class: 'tf-gb-alt' }, svgIco('i-alert'), ' Die letzten Messwerte sind ' + R.alt + ' Tage alt. Trag deine Uhr und synchronisiere sie mit Garmin Connect.'));
    c.append(el('p', { class: 'tf-gb-einordnung', text: 'Orientierung statt Diagnose: Die Ampel vergleicht Messwerte mit deinem persönlichen Normal oder einem App-Ziel. Wearable-Daten können unvollständig oder ungenau sein. Einzelne Werte sagen nicht aus, ob du gesund oder krank bist.' }), // Version 42 (aus V33)
      el('div', { class: 'tf-gb-oben' }, rad(W), seitlich), hinweise, bl);
    return c;
  }

  /* =====================================================================
     Heute: Schritte als Key Fact
     ===================================================================== */
  function heuteSchritte() {
    const k = $('#kachel-schritte'); if (!k) return;
    const D = tage(), h = localDate(), r = D.get(h), z = ziel();
    let d = h, s = schritte(r);
    if (s == null) { const bz = bezugsTag(D); if (bz && (toDay(h) - toDay(bz)) / DAY <= 1) { d = bz; s = schritte(D.get(bz)); } }
    k.hidden = !!A().state.ohne;
    $('#ks-wert').textContent = s == null ? '–' : nf(s);
    const p = s == null ? 0 : Math.min(1, s / z);
    $('#ks-sub').textContent = s == null ? 'Ziel ' + nf(z) : s >= z ? 'Ziel ' + nf(z) + ' geschafft' : (d === h ? 'noch ' + nf(z - s) : 'gestern') + ' · Ziel ' + nf(z);
    $('#ks-bar').style.width = Math.round(p * 100) + '%';
    k.classList.toggle('tf-ks-ok', s != null && s >= z);
  }

  /* =====================================================================
     Seite: Schritte & Bewegung
     ===================================================================== */
  const ZIELE = [6000, 7500, 8000, 10000, 12000];
  function renderAktivitaet() {
    const box = $('#aktivitaet-box'); if (!box) return;
    const D = tage(), h = localDate(), z = ziel(), bez = bezugsTag(D);
    if (!bez) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Noch keine Schrittdaten von Garmin.' })); return; }
    const heuteS = schritte(D.get(h));
    const reihe = (n, ab) => { const v = []; for (let i = ab; i < ab + n; i++) { const x = schritte(D.get(plusT(h, -i))); if (x != null) v.push(x); } return v; };
    const v7 = reihe(7, 1), v30 = reihe(30, 1), ok30 = v30.filter((x) => x >= z).length;
    const best = [...D.values()].reduce((m, r) => (schritte(r) > (m ? schritte(m) : 0) ? r : m), null);
    const grid = el('div', { class: 'tf-grid' });
    // Heute
    const ringS = (() => {
      const s = svg('svg', { viewBox: '0 0 120 120', class: 'tf-ak-ring', 'aria-hidden': 'true' }), r = 50, u = 2 * Math.PI * r, p = heuteS == null ? 0 : Math.min(1, heuteS / z);
      svg('circle', { cx: 60, cy: 60, r, fill: 'none', stroke: col('fill'), 'stroke-width': 12 }, s);
      if (p > 0) svg('circle', { cx: 60, cy: 60, r, fill: 'none', stroke: col('green'), 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': (u * p).toFixed(1) + ' ' + u.toFixed(1), transform: 'rotate(-90 60 60)' }, s);
      if (heuteS != null && heuteS > z) svg('circle', { cx: 60, cy: 60, r, fill: 'none', stroke: col('mint'), 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': (u * Math.min(1, heuteS / z - 1)).toFixed(1) + ' ' + u.toFixed(1), transform: 'rotate(-90 60 60)', opacity: 0.9 }, s);
      return s;
    })();
    const c1 = karte({ id: 'karte-schritte-heute', farbe: 'green', icon: 'i-steps', titel: 'Schritte heute', sub: heuteS == null ? 'Noch keine Daten für heute' : heuteS >= z ? 'Tagesziel geschafft' : 'Noch ' + nf(z - heuteS) + ' bis zu deinem Ziel', span2: true });
    c1.appendChild(el('div', { class: 'tf-ak-held' },
      el('div', { class: 'tf-ak-ringbox' }, ringS, el('div', { class: 'tf-ak-ringz' }, el('b', { class: 'num', text: heuteS == null ? '–' : nf(heuteS) }), el('small', { text: 'von ' + nf(z) }))),
      el('div', { class: 'tf-ak-stats' },
        stat('Ø 7 Tage', v7.length ? nf(Math.round(mittel(v7) / 10) * 10) : '–', v7.length && mittel(v7) >= z ? 'über deinem Ziel' : 'Schritte'),
        stat('Ø 30 Tage', v30.length ? nf(Math.round(mittel(v30) / 10) * 10) : '–', 'Schritte'),
        stat('Ziel geschafft', v30.length ? ok30 + ' von ' + v30.length : '–', 'Tagen (30 T.)'),
        stat('Bester Tag', best ? nf(schritte(best)) : '–', best ? tm(best.date) + best.date.slice(2, 4) : ''))));
    // Ziel einstellen
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const seg = el('div', { class: 'tf-seg tf-ak-ziele', role: 'group', 'aria-label': 'Schrittziel' });
    const zf = zielFest(), zi = zielInfo();
    if (zi.art === 'dynamisch' && T.ui.warum) { // Version 11: ein Satz, warum das Ziel heute so ist
      const sub = c1.querySelector('.tf-card-head .tf-sub');
      if (sub) sub.append(' ', T.ui.warum(zi.rot ? 'Heute 20 % weniger, weil dein Tune rot ist – Erholung geht vor.' : 'Dein Ziel wächst mit deinem Alltag: Schnitt der letzten 4 Wochen plus 500 Schritte.', 'Paluch et al., Lancet Public Health 2022'));
    }
    segButtons(seg, ZIELE.map((x) => [x, nf(x)]), ZIELE.includes(zf) ? zf : null, (v) => zielSpeichern(v, msg));
    const eig = el('input', { class: 'tf-input tf-ak-eigen', type: 'number', inputmode: 'numeric', min: 2000, max: 30000, step: 500, value: zf, 'aria-label': 'Eigenes Schrittziel' });
    eig.addEventListener('change', () => { const n = Math.round(+eig.value / 100) * 100; if (!(n >= 2000 && n <= 30000)) { setMsg(msg, 'Bitte ein Ziel zwischen 2.000 und 30.000 Schritten.', true); return; } zielSpeichern(n, msg); });
    // dynamisch: Ziel wächst mit deinem Alltag
    const dynCb = el('input', { type: 'checkbox', checked: !!athlet().schritte_dyn });
    dynCb.addEventListener('change', async () => {
      try { setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', { schritte_dyn: dynCb.checked ? 1 : 0 }); A().patch('athlet', [j.profil]); setMsg(msg, dynCb.checked ? 'Dynamisches Ziel an.' : 'Festes Ziel: ' + nf(zielFest()) + ' Schritte.'); }
      catch (e) { dynCb.checked = !dynCb.checked; setMsg(msg, e.message, true); }
    });
    const dynTxt = zi.art === 'dynamisch' ? 'Heute ' + nf(zi.ziel) + ' – aus deinem Schnitt der letzten 4 Wochen (' + nf(zi.median) + ') plus 500' + (zi.rot ? ', bei rotem Tune 20 % weniger' : '') + '.'
      : athlet().schritte_dyn ? (zi.grund || 'Es gilt dein festes Ziel.') : 'Passt sich deinem Alltag an: Schnitt der letzten 4 Wochen plus 500 (5.000–12.000), an roten Tagen 20 % weniger.';
    const dyn = el('label', { class: 'tf-switch tf-ak-dyn' }, dynCb, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Dynamisches Ziel', el('small', { text: dynTxt })));
    c1.appendChild(el('div', { class: 'tf-ak-ziel' }, el('span', { class: 'tf-ctrl-l', text: athlet().schritte_dyn ? 'Dein festes Ziel (Grundlage)' : 'Dein Tagesziel' }), el('div', { class: 'tf-ak-ziel-r' }, seg, eig), dyn, msg,
      el('p', { class: 'tf-note', text: 'Für die meisten Erwachsenen unter 60 sind 8.000–10.000 Schritte ein guter Richtwert, ab 60 eher 6.000–8.000. Das Ziel gilt auch für Quests und XP.' })));
    grid.appendChild(c1);
    // Verlauf 30 Tage
    const c2 = karte({ id: 'karte-schritte-verlauf', farbe: 'green', icon: 'i-bars', titel: 'Schritte, letzte 30 Tage', sub: 'Grün: Ziel geschafft · Linie: dein Ziel', span2: true });
    const ch2 = el('div', { class: 'tf-chart', id: 'chart-schritte', style: 'min-height:210px' });
    c2.appendChild(ch2); grid.appendChild(c2);
    // Bewegungsminuten pro Woche
    const c3 = karte({ id: 'karte-bewegung-woche', farbe: 'orange', icon: 'i-heart', titel: 'Bewegungsminuten pro Woche', sub: 'Intensitätsminuten deiner Uhr: intensiv zählt doppelt · Band: WHO-Empfehlung 150–300', span2: true });
    const ch3 = el('div', { class: 'tf-chart', id: 'chart-bewegung', style: 'min-height:210px' });
    c3.append(ch3, el('div', { class: 'tf-legend' }, el('span', null, el('i', { class: 'tf-key', style: 'background:var(--tf-orange);opacity:.55' }), 'moderat'), el('span', null, el('i', { class: 'tf-key', style: 'background:var(--tf-orange)' }), 'intensiv (×2)'), el('span', null, el('i', { class: 'tf-band', style: 'background:var(--tf-green)' }), 'WHO 150–300 min')));
    grid.appendChild(c3);
    // Wissen
    const c4 = karte({ id: 'karte-schritte-warum', farbe: 'teal', icon: 'i-book', titel: 'Warum jeder Schritt zählt', sub: 'Was Studien zu Schritten und Bewegung zeigen', span2: true });
    c4.append(el('div', { class: 'tf-ak-wissen' },
      el('p', { text: 'Mehr Schritte am Tag hängen klar mit einem längeren, gesünderen Leben zusammen. In einer Auswertung von 15 Studien mit fast 50.000 Erwachsenen sank das Sterberisiko mit jeder zusätzlichen Schrittzahl – bis etwa 8.000–10.000 Schritte bei unter 60-Jährigen und 6.000–8.000 ab 60. Danach flacht der Nutzen ab.' }),
      el('p', { text: 'Auch wer gerade keinen Sport machen kann, tut mit Gehen viel: Schon 1.000 Schritte mehr pro Tag machen einen messbaren Unterschied. Das Tempo spielt eine kleinere Rolle als die Menge.' }),
      el('p', { text: 'Zusätzlich empfiehlt die WHO für Erwachsene 150–300 Minuten moderate oder 75–150 Minuten intensive Bewegung pro Woche und an zwei Tagen Krafttraining. Deine Uhr zählt das als Intensitätsminuten – intensive Minuten doppelt.' }),
      el('p', { class: 'tf-ak-xp' }, svgIco('i-star'), ' Schritte bringen in Dreiklang XP: 1 XP je 200 Schritte bis 10.000, danach 1 XP je 400 – dazu Schritt-Quests. ', (() => { const b = el('button', { type: 'button', class: 'tf-linkbtn' }, 'Zu deinen Quests'); b.addEventListener('click', () => T.geh('profil/quests')); return b; })())),
      el('p', { class: 'tf-note tf-quelle', text: 'Paluch et al., Lancet Public Health 2022 · Saint-Maurice et al., JAMA 2020 · Banach et al., Eur J Prev Cardiol 2023 · Bull et al., Br J Sports Med 2020 (WHO-Leitlinien)' }));
    grid.appendChild(c4);
    box.replaceChildren(grid);
    schritteChart(ch2, D, h, z);
    bewegungChart(ch3, D, h);
  }
  function stat(t, w, u) { return el('div', { class: 'tf-ak-stat' }, el('small', { text: t }), el('b', { class: 'num', text: w }), el('span', { text: u })); }
  async function zielSpeichern(v, msg) {
    try { setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', { schritte_ziel: v }); A().patch('athlet', [j.profil]); setMsg(msg, 'Ziel gespeichert: ' + nf(v) + ' Schritte.'); }
    catch (e) { setMsg(msg, e.message, true); }
  }
  function schritteChart(elm, D, h, z) {
    const keys = []; for (let i = 29; i >= 0; i--) keys.push(plusT(h, -i));
    const V = keys.map((d) => schritte(D.get(d)));
    const top = Math.max(z * 1.25, ...V.filter((x) => x != null)) * 1.06;
    const P = plot(elm, { h: 210, y: [0, top], ny: 4, yfmt: (t) => (t >= 1000 ? nf(t / 1000) + 'k' : nf(t)), xband: keys, xfmt: (d) => tm(d), xlabw: 44, label: 'Schritte pro Tag' });
    const bw = Math.min(14, P.xs.bandwidth());
    keys.forEach((d, i) => { const v = V[i]; if (v == null) return; const x = P.xs(d) + (P.xs.bandwidth() - bw) / 2, y = P.ys(v); svg('path', { d: roundTop(x, y, bw, P.ys(0) - y, Math.min(4, bw / 2)), fill: col(v >= z ? 'green' : 'gray'), opacity: d === h ? 0.55 : v >= z ? 0.95 : 0.45 }, P.g); });
    refLine(P, z, col('green'));
    hoverBands(elm, P, keys, (d) => WT[toDay(d).getUTCDay()] + ', ' + tm(d) + (d === h ? ' (bisher)' : ''), (d) => { const v = V[keys.indexOf(d)]; return [{ label: 'Schritte', value: v == null ? '–' : nf(v), color: col(v >= z ? 'green' : 'gray') }, { label: 'Ziel', value: nf(z) }]; });
  }
  function bewegungChart(elm, D, h) {
    const mo = (d) => { const wd = (toDay(d).getUTCDay() + 6) % 7; return plusT(d, -wd); };
    const W = []; for (let i = 11; i >= 0; i--) W.push(plusT(mo(h), -7 * i));
    const rows = W.map((m) => { let mod = 0, vig = 0, n = 0; for (let i = 0; i < 7; i++) { const r = D.get(plusT(m, i)); if (r && (r.im_moderate != null || r.im_vigorous != null)) { mod += +r.im_moderate || 0; vig += +r.im_vigorous || 0; n++; } } return { m, mod, vig, sum: mod + 2 * vig, n }; });
    const top = Math.max(330, ...rows.map((r) => r.sum)) * 1.06;
    const P = plot(elm, { h: 210, y: [0, top], ny: 4, xband: W, xfmt: (d) => tm(d), xlabw: 46, label: 'Bewegungsminuten pro Woche' });
    svg('rect', { x: P.ml, y: P.ys(300), width: P.w - P.mr - P.ml + 4, height: P.ys(150) - P.ys(300), fill: col('green'), opacity: 0.1 }, P.g);
    const bw = Math.min(26, P.xs.bandwidth());
    rows.forEach((r) => {
      if (!r.n) return;
      const x = P.xs(r.m) + (P.xs.bandwidth() - bw) / 2, y1 = P.ys(r.mod), y2 = P.ys(r.sum);
      svg('rect', { x, y: y1, width: bw, height: Math.max(0, P.ys(0) - y1), fill: col('orange'), opacity: 0.5 }, P.g);
      if (r.vig) svg('path', { d: roundTop(x, y2, bw, Math.max(0, y1 - y2 - 1.5), 5), fill: col('orange') }, P.g);
      else if (r.mod) svg('path', { d: roundTop(x, y1, bw, P.ys(0) - y1, 5), fill: col('orange'), opacity: 0.5 }, P.g);
    });
    refLine(P, 150, col('green'));
    hoverBands(elm, P, W, (m) => 'Woche ab ' + tm(m) + (m === mo(h) ? ' (läuft)' : ''), (m) => { const r = rows[W.indexOf(m)]; return [{ label: 'Gesamt', value: nf(r.sum) + ' min' }, { label: 'Moderat', value: nf(r.mod) + ' min', color: col('orange') }, { label: 'Intensiv (×2)', value: nf(r.vig) + ' min' }]; });
  }

  /* =====================================================================
     Seite: Stress & Body Battery
     ===================================================================== */
  function renderStress() {
    const box = $('#stress-box'); if (!box) return;
    const D = tage(), h = localDate(), bez = bezugsTag(D);
    if (!bez) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Noch keine Stress- und Body-Battery-Daten von Garmin.' })); return; }
    const r0 = D.get(h) || D.get(bez), d0 = D.get(h) ? h : bez;
    const keys = []; for (let i = 29; i >= 0; i--) keys.push(plusT(h, -i));
    const sv7 = keys.slice(-7).map((d) => stress(D.get(d))).filter((x) => x != null), base = keys.slice(0, 23).map((d) => stress(D.get(d))).filter((x) => x != null);
    const grid = el('div', { class: 'tf-grid' });
    const st = stress(r0), kat = (x) => (x == null ? ['–', 'gray'] : x <= 25 ? ['Ruhe', 'teal'] : x <= 50 ? ['niedrig', 'green'] : x <= 75 ? ['mittel', 'orange'] : ['hoch', 'red']);
    const c1 = karte({ id: 'karte-stress-heute', farbe: 'orange', icon: 'i-brain', titel: d0 === h ? 'Heute' : 'Zuletzt am ' + tm(d0), sub: 'Stress und Energie laut deiner Uhr', span2: true });
    const bb = (k) => (r0 && zahl(r0[k]) != null && +r0[k] >= 0 ? +r0[k] : null);
    c1.appendChild(el('div', { class: 'tf-sr-held' },
      el('div', { class: 'tf-sr-k' }, el('small', { text: 'Ø Stress' }), el('b', { class: 'num', text: st == null ? '–' : nf(st) }), el('span', null, el('i', { class: 'tf-ampel', style: 'background:var(--tf-' + kat(st)[1] + ')' }), ' ' + kat(st)[0])),
      el('div', { class: 'tf-sr-k' }, el('small', { text: 'Ø 7 Tage' }), el('b', { class: 'num', text: sv7.length ? nf(mittel(sv7)) : '–' }), el('span', { text: base.length >= 10 ? 'sonst ' + nf(median(base)) : 'Skala 0–100' })),
      el('div', { class: 'tf-sr-k' }, el('small', { text: 'Body Battery' }), el('b', { class: 'num', text: bb('bb_max') == null ? '–' : nf(bb('bb_max')) }), el('span', { text: 'morgens, tiefster Wert ' + (bb('bb_min') == null ? '–' : nf(bb('bb_min'))) })),
      el('div', { class: 'tf-sr-k' }, el('small', { text: 'Geladen · verbraucht' }), el('b', { class: 'num', text: (bb('bb_charged') == null ? '–' : '+' + nf(bb('bb_charged'))) + ' · ' + (bb('bb_drained') == null ? '–' : '−' + nf(bb('bb_drained'))) }), el('span', { text: 'nachts geladen, über den Tag verbraucht' }))));
    grid.appendChild(c1);
    const c2 = karte({ id: 'karte-stress-verlauf', farbe: 'orange', icon: 'i-bars', titel: 'Stress, letzte 30 Tage', sub: 'Tagesdurchschnitt · Linie: dein üblicher Wert', span2: true });
    const ch2 = el('div', { class: 'tf-chart', id: 'chart-stress', style: 'min-height:200px' });
    c2.append(ch2, el('div', { class: 'tf-legend' }, ...[['teal', '0–25 Ruhe'], ['green', '26–50 niedrig'], ['orange', '51–75 mittel'], ['red', '76–100 hoch']].map(([c, t]) => el('span', null, el('i', { class: 'tf-key', style: 'background:var(--tf-' + c + ')' }), t))));
    grid.appendChild(c2);
    const c3 = karte({ id: 'karte-bb-verlauf', farbe: 'green', icon: 'i-battery', titel: 'Body Battery, letzte 30 Tage', sub: 'Balken: tiefster bis höchster Wert des Tages', span2: true });
    const ch3 = el('div', { class: 'tf-chart', id: 'chart-bb', style: 'min-height:200px' });
    c3.appendChild(ch3); grid.appendChild(c3);
    const c4 = karte({ id: 'karte-stress-wissen', farbe: 'teal', icon: 'i-book', titel: 'Was die Werte bedeuten', sub: 'Schätzungen deiner Uhr – gut für Trends, keine Diagnose', span2: true });
    c4.append(el('div', { class: 'tf-ak-wissen' },
      el('p', null, el('b', { text: 'Stress' }), ' schätzt Garmin aus deiner Herzfrequenzvariabilität: Ist dein Nervensystem angespannt, sinkt die HRV und der Wert steigt. 0–25 heißt Ruhe, 26–50 niedrig, 51–75 mittel, über 75 hoch. Auch Training, Kaffee, Alkohol oder ein Infekt treiben ihn hoch – nicht nur Ärger.'),
      el('p', null, el('b', { text: 'Body Battery' }), ' ist eine Energiereserve von 0 bis 100. Sie lädt im Schlaf und in ruhigen Phasen und sinkt durch Bewegung und Stress. Wacht sie morgens deutlich unter deinem Üblichen auf, war die Nacht weniger erholsam.'),
      el('p', null, el('b', { text: 'Was hilft: ' }), 'langsames Atmen mit langer Ausatmung (etwa 6 Atemzüge pro Minute, 5 Minuten), Bewegung draußen, feste Schlafzeiten, wenig Alkohol am Abend. Pilates & Yoga hat dafür eigene Entspannungseinheiten.'),
      (() => { const b = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-lotus'), ' Entspannungseinheit'); b.addEventListener('click', () => T.geh('training/flow')); return el('div', { class: 'tf-form-actions' }, b); })(),
      el('p', { class: 'tf-note tf-quelle', text: 'Firstbeat Technologies: Stress- und Recovery-Analyse auf HRV-Basis · Zaccaro et al., Front Hum Neurosci 2018 · Pascoe et al., Psychoneuroendocrinology 2017' })));
    grid.appendChild(c4);
    box.replaceChildren(grid);
    stressChart(ch2, D, keys, base.length >= 10 ? median(base) : null, h);
    bbChart(ch3, D, keys, h);
  }
  function stressChart(elm, D, keys, base, h) {
    const V = keys.map((d) => stress(D.get(d)));
    if (!V.some((x) => x != null)) { T.ui.emptyNote(elm, 'Keine Stresswerte in diesem Zeitraum.'); return; }
    const P = plot(elm, { h: 200, y: [0, 100], yticks: [0, 25, 50, 75, 100], xband: keys, xfmt: (d) => tm(d), xlabw: 44, label: 'Stress pro Tag' });
    const bw = Math.min(14, P.xs.bandwidth()), f = (x) => (x <= 25 ? 'teal' : x <= 50 ? 'green' : x <= 75 ? 'orange' : 'red');
    keys.forEach((d, i) => { const v = V[i]; if (v == null) return; const x = P.xs(d) + (P.xs.bandwidth() - bw) / 2, y = P.ys(v); svg('path', { d: roundTop(x, y, bw, P.ys(0) - y, Math.min(4, bw / 2)), fill: col(f(v)), opacity: d === h ? 0.5 : 0.9 }, P.g); });
    if (base != null) refLine(P, base, col('fg3'));
    hoverBands(elm, P, keys, (d) => WT[toDay(d).getUTCDay()] + ', ' + tm(d), (d) => { const r = D.get(d), v = V[keys.indexOf(d)]; return [{ label: 'Ø Stress', value: v == null ? '–' : nf(v), color: v == null ? null : col(f(v)) }, { label: 'Im Schlaf', value: r && zahl(r.sleep_stress) != null && +r.sleep_stress >= 0 ? nf(+r.sleep_stress) : '–' }].concat(base != null ? [{ label: 'Üblich', value: nf(base) }] : []); });
  }
  function bbChart(elm, D, keys, h) {
    const R = keys.map((d) => { const r = D.get(d); return r && zahl(r.bb_max) > 0 ? { d, max: +r.bb_max, min: Math.max(0, +r.bb_min || 0), auf: +r.bb_charged || 0, ab: +r.bb_drained || 0 } : null; });
    if (!R.some(Boolean)) { T.ui.emptyNote(elm, 'Keine Body-Battery-Werte in diesem Zeitraum.'); return; }
    const P = plot(elm, { h: 200, y: [0, 100], yticks: [0, 25, 50, 75, 100], xband: keys, xfmt: (d) => tm(d), xlabw: 44, label: 'Body Battery pro Tag' });
    const bw = Math.min(12, P.xs.bandwidth()), id = 'tfbb' + Math.round(Math.random() * 1e6);
    const g = svg('linearGradient', { id, x1: 0, y1: 1, x2: 0, y2: 0 }, svg('defs', null, P.s));
    svg('stop', { offset: 0, 'stop-color': col('orange') }, g); svg('stop', { offset: 0.5, 'stop-color': col('yellow') }, g); svg('stop', { offset: 1, 'stop-color': col('green') }, g);
    R.forEach((r) => { if (!r) return; const x = P.xs(r.d) + (P.xs.bandwidth() - bw) / 2, y0 = P.ys(r.max), y1 = P.ys(r.min); svg('rect', { x, y: y0, width: bw, height: Math.max(2, y1 - y0), rx: bw / 2, fill: 'url(#' + id + ')', opacity: r.d === h ? 0.55 : 0.95 }, P.g); });
    hoverBands(elm, P, keys, (d) => WT[toDay(d).getUTCDay()] + ', ' + tm(d), (d) => { const r = R[keys.indexOf(d)]; return r ? [{ label: 'Höchster Wert', value: nf(r.max), color: col('green') }, { label: 'Tiefster Wert', value: nf(r.min), color: col('orange') }, { label: 'Geladen', value: '+' + nf(r.auf) }, { label: 'Verbraucht', value: '−' + nf(r.ab) }] : [{ label: 'Keine Daten', value: '' }]; });
  }

  /* =====================================================================
     Ruhepuls & Atmung: Sauerstoff im Schlaf
     ===================================================================== */
  function spo2Karte() {
    const sec = $('#erholung'); if (!sec || A().state.ohne) return;
    const grid = sec.querySelector('.tf-grid'); if (!grid) return;
    let c = sec.querySelector('#karte-spo2');
    if (!c) {
      c = karte({ id: 'karte-spo2', farbe: 'blue', icon: 'i-lungs', titel: 'Sauerstoff im Schlaf (SpO₂)', sub: 'Durchschnitt pro Nacht · gestrichelt: 95 %', span2: true });
      c.dataset.thema = 'puls';
      c.append(el('div', { class: 'tf-chart', id: 'chart-spo2', style: 'min-height:170px' }), el('p', { class: 'tf-note tf-bleibt', text: 'Gesunde Menschen liegen nachts meist bei 95–100 %. Uhren messen am Handgelenk nur ungefähr – einzelne tiefe Werte sind oft Messfehler. Fällt der Schnitt über Wochen, oder schnarchst du mit Atemaussetzern und bist tagsüber müde: ärztlich abklären lassen.' }));
      const atem = sec.querySelector('#karte-atmung'); if (atem) atem.after(c); else grid.appendChild(c);
      const R = T.routeInfo(T.route()); if (R && R.thema) c.classList.toggle('tf-aus', R.thema !== 'puls');
    }
    const elm = c.querySelector('#chart-spo2'); if (!elm || c.classList.contains('tf-aus')) return;
    const D = tage(), h = localDate(), keys = []; for (let i = 59; i >= 0; i--) keys.push(plusT(h, -i));
    const V = keys.map((d) => { const r = D.get(d); return r && zahl(r.sleep_spo2) > 50 ? +r.sleep_spo2 : null; });
    if (!V.some((x) => x != null)) { T.ui.emptyNote(elm, 'Deine Uhr hat in den letzten 60 Tagen keine Sauerstoffwerte gemessen.'); return; }
    const lo = Math.min(90, ...V.filter((x) => x != null)) - 1;
    const P = plot(elm, { h: 170, y: [lo, 100], ny: 4, yfmt: (t) => t + ' %', xband: keys, xfmt: (d) => tm(d), xlabw: 44, label: 'SpO₂ im Schlaf' });
    const bw = Math.max(2, Math.min(8, P.xs.bandwidth()));
    keys.forEach((d, i) => { const v = V[i]; if (v == null) return; svg('circle', { cx: P.xs(d) + P.xs.bandwidth() / 2, cy: P.ys(v), r: bw / 2 + 1, fill: col(v >= 95 ? 'blue' : v >= 92 ? 'yellow' : 'red'), opacity: 0.85 }, P.g); });
    refLine(P, 95, col('fg3'));
    hoverBands(elm, P, keys, (d) => WT[toDay(d).getUTCDay()] + ', ' + tm(d), (d) => { const v = V[keys.indexOf(d)]; return [{ label: 'SpO₂', value: v == null ? '–' : nf(v) + ' %' }]; });
  }

  const ks = $('#kachel-schritte'); if (ks) ks.addEventListener('click', () => T.geh('gesundheit/aktivitaet'));
  T.seite('aktivitaet', renderAktivitaet);
  T.seite('stress', renderStress);
  T.zusatz('heute', heuteSchritte);
  T.zusatz('erholung', spo2Karte);
  /* =====================================================================
     Version 20: Bilanz – Belastung gegen Erholung, 28 Tage, und was dein Körper daraus macht
     Oben die Trainingslast je Tag (TSS), unten der Schlaf der folgenden Nacht; dazu die Morgen nach harten
     und nach ruhigen Tagen im Vergleich (HRV, Ruhepuls, Schlaf) und die Anpassung über 12 Wochen (Fitness gegen Ruhepuls).
     ===================================================================== */
  function bilanzKarte() {
    if (A().state.ohne) return null;
    const E = rowsOf('erholung') || [], PM = rowsOf('pmc') || []; if (E.length < 14 || PM.length < 14) return null;
    const h = localDate(), von = iso(toDay(h) - 27 * DAY);
    const EM = new Map(E.map((r) => [r.date, r])), PMM = new Map(PM.map((r) => [r.date, r]));
    const T28 = []; for (let i = 27; i >= 0; i--) { const d = iso(toDay(h) - i * DAY), p = PMM.get(d), n = EM.get(iso(toDay(d) + DAY)); T28.push({ date: d, tss: p ? p.tss : 0, schlaf: n && n.schlaf_h != null ? n.schlaf_h : null, nacht: n }); }
    const mit = T28.filter((t) => t.schlaf != null); if (mit.length < 10) return null;
    const tssMittel = T28.reduce((x, t) => x + t.tss, 0) / 28, hart = T28.filter((t) => t.tss >= Math.max(60, tssMittel * 1.5) && t.nacht), ruhig = T28.filter((t) => t.tss <= Math.max(10, tssMittel * 0.5) && t.nacht);
    const mw = (L, f) => { const v = L.map(f).filter((x) => x != null && isFinite(x)); return v.length >= 3 ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const c = karte({ id: 'karte-bilanz', farbe: 'indigo', icon: 'i-wave', titel: 'Belastung und Erholung', sub: 'Letzte 28 Tage · Last je Tag oben, Schlaf der Nacht danach unten', span2: true, cls: 'tf-bilanz' });
    // Diagramm
    const W = 340, Hh = 168, mitte = 76, pl = 34, pr = 6, pb = 16, bw = (W - pl - pr) / 28, maxT = Math.max(50, ...T28.map((t) => t.tss)), maxS = Math.max(8, ...mit.map((t) => t.schlaf)), unten = Hh - pb - mitte - 4;
    const sv = svg('svg', { class: 'tf-svg tf-bilanz-svg', viewBox: '0 0 ' + W + ' ' + Hh, width: '100%', height: Hh, role: 'img', 'aria-label': 'Belastung und Schlaf der letzten 28 Tage' });
    svg('line', { x1: pl, x2: W - pr, y1: mitte, y2: mitte, stroke: col('fg3'), 'stroke-width': 1 }, sv);
    const tS = svg('text', { x: pl - 6, y: 12, 'text-anchor': 'end', class: 'tf-tick' }, sv); tS.textContent = 'TSS';
    const tN = svg('text', { x: pl - 6, y: mitte + unten, 'text-anchor': 'end', class: 'tf-tick' }, sv); tN.textContent = 'h';
    const bedarf = mw(mit, (t) => t.nacht.bedarf_h);
    if (bedarf) { const y = mitte + (unten * bedarf) / maxS; svg('line', { x1: pl, x2: W - pr, y1: y, y2: y, stroke: col('indigo'), 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: .7 }, sv); const tb = svg('text', { x: W - pr, y: y - 3, 'text-anchor': 'end', class: 'tf-tick' }, sv); tb.textContent = 'Bedarf ' + hm(bedarf) + ' h'; }
    T28.forEach((t, i) => {
      const x = pl + i * bw + 1, w = Math.max(2, bw - 2), istHart = hart.includes(t);
      if (t.tss > 0) { const hh = ((mitte - 16) * t.tss) / maxT; svg('rect', { x, y: mitte - hh, width: w, height: hh, rx: 1.5, fill: istHart ? col('fg') : col('fg3'), opacity: istHart ? .9 : .5 }, sv); }
      if (t.schlaf != null) { const hh = (unten * t.schlaf) / maxS; svg('rect', { x, y: mitte + 1, width: w, height: hh, rx: 1.5, fill: col('indigo'), opacity: t.schlaf >= (t.nacht.bedarf_h || 7.5) ? .85 : .4 }, sv); }
      if (t.date === h) svg('circle', { cx: x + w / 2, cy: mitte, r: 2.5, fill: col('pink') }, sv);
    });
    [0, 7, 14, 21, 27].forEach((i) => { const t = T28[i], tt = svg('text', { x: pl + i * bw + bw / 2, y: Hh - 3, 'text-anchor': i === 27 ? 'end' : i === 0 ? 'start' : 'middle', class: 'tf-tick' }, sv); tt.textContent = i === 27 ? 'heute' : t.date.slice(8, 10) + '.' + t.date.slice(5, 7) + '.'; });
    c.appendChild(el('div', { class: 'tf-chart' }, sv));
    c.appendChild(el('div', { class: 'tf-legend tf-bilanz-leg' }, el('span', null, el('i', { style: 'background:var(--tf-fg)' }), 'Harter Tag'), el('span', null, el('i', { style: 'background:var(--tf-fg3)' }), 'Belastung (TSS)'), el('span', null, el('i', { style: 'background:var(--tf-indigo)' }), 'Schlaf'), el('span', null, el('i', { style: 'background:var(--tf-pink)' }), 'heute')));
    // Vergleich: Morgen nach harten gegen Morgen nach ruhigen Tagen
    const zeilen = [];
    const hrvH = mw(hart, (t) => t.nacht.z_hrv), hrvR = mw(ruhig, (t) => t.nacht.z_hrv);
    const rhrH = mw(hart, (t) => t.nacht.rhr_delta), rhrR = mw(ruhig, (t) => t.nacht.rhr_delta);
    const schH = mw(hart, (t) => t.schlaf), schR = mw(ruhig, (t) => t.schlaf);
    const zs = (v) => (v == null ? '–' : (v >= 0.5 ? 'über' : v <= -0.5 ? 'unter' : 'im') + ' Normal');
    if (hart.length >= 3 && ruhig.length >= 3) {
      zeilen.push(['Morgen nach harten Tagen', hart.length + ' Nächte', 'HRV ' + zs(hrvH) + (rhrH != null ? ' · Ruhepuls ' + (rhrH > 0 ? '+' : '') + nf(rhrH, 1) : '') + (schH != null ? ' · Schlaf ' + hm(schH) + ' h' : '')]);
      zeilen.push(['Morgen nach ruhigen Tagen', ruhig.length + ' Nächte', 'HRV ' + zs(hrvR) + (rhrR != null ? ' · Ruhepuls ' + (rhrR > 0 ? '+' : '') + nf(rhrR, 1) : '') + (schR != null ? ' · Schlaf ' + hm(schR) + ' h' : '')]);
    }
    // Anpassung über 12 Wochen: Fitness (CTL) gegen Ruhepuls-7-Tage-Schnitt
    const PM84 = PM.filter((r) => r.date >= iso(toDay(h) - 83 * DAY)), E84 = E.filter((r) => r.date >= iso(toDay(h) - 83 * DAY) && r.rhr7 != null);
    let anpassung = null;
    if (PM84.length >= 56 && E84.length >= 40) {
      const c0 = PM84[0].ctl, c1 = PM84[PM84.length - 1].ctl, r0 = E84.slice(0, 7).reduce((x, r) => x + r.rhr7, 0) / Math.min(7, E84.length), r1 = E84.slice(-7).reduce((x, r) => x + r.rhr7, 0) / Math.min(7, E84.length);
      const dC = c1 - c0, dR = r1 - r0;
      anpassung = { dC, dR, text: Math.abs(dC) < 5 ? 'Deine Fitness ist in 12 Wochen etwa gleich geblieben (' + nf(c0) + ' → ' + nf(c1) + ').' + (Math.abs(dR) < 1.5 ? ' Dein Ruhepuls auch – stabil.' : dR < 0 ? ' Dein Ruhepuls ist um ' + nf(-dR, 1) + ' gesunken – gute Erholung.' : ' Dein Ruhepuls ist um ' + nf(dR, 1) + ' gestiegen – schau auf Schlaf, Stress und Infekte.')
        : dC > 0 ? 'Deine Fitness ist in 12 Wochen von ' + nf(c0) + ' auf ' + nf(c1) + ' gestiegen' + (dR <= -1 ? ', dein Ruhepuls dabei um ' + nf(-dR, 1) + ' gesunken – so sieht Anpassung aus.' : dR >= 1.5 ? ', dein Ruhepuls dabei um ' + nf(dR, 1) + ' gestiegen – die Erholung kommt nicht ganz mit. Eine ruhigere Woche lohnt.' : ', dein Ruhepuls ist stabil – der Körper trägt die Last.')
        : 'Deine Fitness ist in 12 Wochen von ' + nf(c0) + ' auf ' + nf(c1) + ' gesunken' + (dR <= -1 ? ', dein Ruhepuls um ' + nf(-dR, 1) + ' – erholt und bereit für mehr.' : '.') };
    }
    const liste = el('div', { class: 'tf-bilanz-liste' });
    zeilen.forEach(([t, n, v]) => liste.appendChild(el('div', { class: 'tf-bilanz-z' }, el('b', { text: t }), el('small', { text: n }), el('span', { text: v }))));
    if (anpassung) liste.appendChild(el('div', { class: 'tf-bilanz-z' }, el('b', { text: 'Anpassung · 12 Wochen' }), el('small', { text: 'Fitness (CTL) gegen Ruhepuls' }), el('span', { text: anpassung.text })));
    if (!zeilen.length && !anpassung) liste.appendChild(el('p', { class: 'tf-note', text: 'Für den Vergleich braucht es je drei harte und drei ruhige Tage mit Nachtwerten.' }));
    c.appendChild(liste);
    c.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Plews et al., Sports Med 2013 · Buchheit, Front Physiol 2014 · Fullagar et al., Sports Med 2015' })));
    const rg = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-bilanz-rg' }, svgIco('i-feder'), ' Wo es zwickt – Regeneration'); // Version 23
    rg.addEventListener('click', (e) => { e.stopPropagation(); T.geh('training/regeneration'); });
    c.appendChild(rg);
    return c;
  }
  window.tfGesund = { bildKarte, bilanzKarte, werte, schrittZiel: ziel };
})();
