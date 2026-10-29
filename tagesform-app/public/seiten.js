/* Tagesform · weitere Seiten: Fitness-Alter, Saison, Werkzeuge – und Zusätze für Heute, Erholung, Belastung und Profil.
   Alle Zahlen kommen aus den Berechnungen in calcs.js; hier wird nur dargestellt und eingegeben. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svg, nf, iso, toDay, fmtDay, hms, hmin, mmss, kurz, parseTime, col, clear, failed, emptyNote, tip, plot, line, band, dots, endDot, refLine, roundTop, hoverTime, kv, segButtons, setMsg, rowsOf, failedAny, params, heute, windowRows, median, localDate, DAY } = T.ui;
  const A = () => dash.app;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- kleine Bausteine ---------- */
  function ico(name, cls) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'tf-ico' + (cls ? ' ' + cls : '')); const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#' + name); s.appendChild(u); return s; }
  function dot(c) { const i = el('i', { class: 'tf-ampel' }); i.style.background = col(c); return i; }
  function badge(farbe, icon) { const b = el('span', { class: 'tf-badge' }, ico(icon)); b.style.background = 'var(--tf-' + farbe + ')'; return b; }
  function karte(o) { // { id, farbe, icon, titel, sub, kpi, span2, cls }
    const head = el('div', { class: 'tf-card-head' }, badge(o.farbe, o.icon), el('div', null, el('h2', { text: o.titel }), o.sub ? el('div', { class: 'tf-sub', text: o.sub }) : null), o.kpi || null);
    return el('article', { class: 'tf-card' + (o.span2 ? ' tf-span2' : '') + (o.cls ? ' ' + o.cls : ''), id: o.id || null }, head);
  }
  const de = (d) => d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(2, 4); // 2027-07-04 → 04.07.27
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const wtag = (d) => WT[toDay(d).getUTCDay()];
  const sg = (x, d) => (x == null || !isFinite(x) ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '±') + nf(Math.abs(x), d || 0));
  const jahre = (x) => nf(Math.abs(x), 1) + ' Jahre';
  const tageTxt = (n) => (n === 1 ? '1 Tag' : nf(n) + ' Tage');
  const erf = (x) => { const s = Math.sign(x), t = 1 / (1 + 0.3275911 * Math.abs(x)); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); };
  const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const athlet = () => (rowsOf('athlet') || [])[0] || null;
  function aktuell(rows, feld, maxTage) { // letzte Zeile mit Wert, höchstens maxTage vor dem Datenstand
    const H = heute(); if (!rows || !H) return null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i]; if (r.date > H.date) continue;
      if ((toDay(H.date) - toDay(r.date)) / DAY > maxTage) return null;
      if (r[feld] != null) return r;
    }
    return null;
  }
  const letzteMit = (rows, feld) => { const H = heute(); if (!rows) return null; for (let i = rows.length - 1; i >= 0; i--) if (rows[i][feld] != null && (!H || rows[i].date <= H.date)) return rows[i]; return null; };
  function speicher(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
  function merke(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* nur Komfort */ } }
  function zahlFeld(label, o) { // beschriftetes Zahlenfeld; o: value, step, min, max, unit, onChange(n), width
    const inp = el('input', { class: 'tf-input', type: 'number', inputmode: 'decimal', step: o.step || 1, min: o.min, max: o.max, value: o.value == null ? '' : o.value, placeholder: o.ph || null, 'aria-label': label });
    inp.addEventListener('change', () => { const n = parseFloat(String(inp.value).replace(',', '.')); if (!isFinite(n)) return; const v = Math.min(o.max == null ? Infinity : o.max, Math.max(o.min == null ? -Infinity : o.min, n)); if (v !== n) inp.value = v; o.onChange(v); });
    return el('label', { class: 'tf-field tf-wz-f' }, el('span', { text: label }), el('span', { class: 'tf-wz-in' }, inp, o.unit ? el('em', { text: o.unit }) : null));
  }

  /* ---------- Farben und Texte ---------- */
  const LB = { systemisch: 'red', muskulaer: 'orange', ausserhalb: 'yellow', frisch: 'teal', balance: 'green' };
  const LB_KURZ = { systemisch: 'Systemisch müde', muskulaer: 'Muskulär müde', ausserhalb: 'Innere Last', frisch: 'Frisch', balance: 'Im Gleichgewicht' };
  const stufeExt = (z) => (z == null ? '–' : z >= 1.5 ? 'hoch' : z <= -1 ? 'niedrig' : 'normal');
  const stufeInt = (z) => (z == null ? '–' : z >= 0.6 ? 'hoch' : z <= -0.5 ? 'niedrig' : 'normal');
  const PH_FARBE = { vorbereitung: 'gray', grundlage: 'blue', aufbau: 'orange', spitze: 'red', taper: 'teal', rennwoche: 'mint', rennen: 'pink', uebergang: 'purple', ohne_a: 'gray', offen: 'gray' };
  const PH_TEXT = {
    vorbereitung: 'Allgemeine Fitness, Technik, Beweglichkeit und Kraft – noch ohne harte Blöcke.',
    grundlage: 'Aerobe Basis: viel locker unter VT1, der Umfang steigt, dazu schwere Kraft. Jede 4. Woche leichter.',
    aufbau: 'Rennspezifisch: Abschnitte im Renntempo, Koppeleinheiten, Verpflegung üben.',
    spitze: 'Die härtesten Wochen, mit einer Generalprobe – danach beginnt das Tapering.',
    taper: 'Umfang um 40–60 % senken, Intensität halten: Die Ermüdung sinkt schneller als die Fitness.',
    rennwoche: 'Kurze Einheiten mit ein paar Steigerungen, viel Schlaf, nichts Neues.',
    rennen: 'Renntag – Pacing und Verpflegung nach Plan.',
    uebergang: 'Erholung ohne Plan – Bewegung nach Lust, erst danach neu planen.',
  };
  const PRIO = { A: ['pink', 'Saisonhöhepunkt – die App plant rückwärts auf dieses Rennen.'], B: ['orange', 'Wichtiger Test – kurzes Mini-Tapering.'], C: ['gray', 'Trainingsrennen – durchtrainieren.'] };
  const SPORT_NAME = { tri: 'Triathlon', lauf: 'Laufen', rad: 'Rad', schwimmen: 'Schwimmen', mehr: 'Weitere' };
  const SPORT_ICON = { tri: 'i-tri', lauf: 'i-run', rad: 'i-bike', schwimmen: 'i-swim', mehr: 'i-target' };

  /* =====================================================================
     HEUTE: Countdown, Fitness-Alter, interne gegen externe Last
     ===================================================================== */
  function heuteZusatz() {
    const sz = (rowsOf('saison') || [])[0], kc = $('#kachel-countdown');
    if (kc) {
      const z = sz && sz.ziel_tage != null ? { tage: sz.ziel_tage, name: sz.ziel_name, sub: (sz.phase_txt ? sz.phase_txt + ' · ' : '') + sz.ziel_datum_txt }
        : sz && sz.naechstes ? { tage: sz.naechstes.in_tagen, name: sz.naechstes.name, sub: 'Prio ' + sz.naechstes.prio + ' · ' + sz.naechstes.datum_txt } : null;
      kc.hidden = !z;
      if (z) {
        $('#kc-label').textContent = z.name; $('#kc-wert').textContent = z.tage === 0 ? 'Heute' : nf(z.tage);
        kc.querySelector('.tf-u').textContent = z.tage === 0 ? '' : z.tage === 1 ? 'Tag' : 'Tage'; $('#kc-sub').textContent = z.sub;
      }
    }
    const FA = rowsOf('fitness_alter'), fr = FA && FA[FA.length - 1];
    if (fr && $('#kf-wert')) {
      if (fr.status === 'ok') { $('#kf-wert').textContent = nf(fr.fitness_alter, 1); $('#kf-sub').textContent = Math.abs(fr.diff) < 0.5 ? 'so alt wie du bist' : jahre(fr.diff) + (fr.diff < 0 ? ' jünger' : ' älter') + ' als du'; }
      else { $('#kf-wert').textContent = '–'; $('#kf-sub').textContent = fr.status === 'profil' ? 'Geburtsjahr und Geschlecht eintragen' : 'Noch zu wenig Daten'; }
    }
    if ($('#kachel-bilanz')) {
      const r = aktuell(rowsOf('last_bilanz'), 'typ', 3);
      $('#kb-ampel').style.background = col(r ? LB[r.typ] : 'gray');
      $('#kb-wert').textContent = r ? LB_KURZ[r.typ] : '–';
      $('#kb-sub').textContent = r ? 'Training ' + stufeExt(r.ext_z) + ' · Körper ' + stufeInt(r.intern) : 'braucht Training und HRV-Basis';
    }
  }
  if ($('#kachel-countdown')) $('#kachel-countdown').addEventListener('click', () => T.zeige('saison'));
  if ($('#kachel-fitnessalter')) $('#kachel-fitnessalter').addEventListener('click', () => T.zeige('fitness'));
  if ($('#kachel-bilanz')) $('#kachel-bilanz').addEventListener('click', () => T.zeige('training/last'));

  /* =====================================================================
     ERHOLUNG: HRV-Korridor
     ===================================================================== */
  function erholungZusatz() {
    const box = $('#korridor-box'); if (!box) return;
    const KO = rowsOf('hrv_korridor');
    if (!KO) { if (failedAny('hrv_korridor')) failed(box); return; }
    box.replaceChildren();
    const H = heute(); if (!H) return;
    const F = T.farben.korridor, r = aktuell(KO, 'klasse', 4);
    if (!r) {
      const last = letzteMit(KO, 'klasse');
      box.append(el('div', { class: 'tf-korr-kopf' }, dot('gray'), el('b', { text: last ? 'Gerade keine Einordnung' : 'Basis entsteht' })),
        el('p', { class: 'tf-korr-text', text: last ? 'In den letzten Tagen fehlen HRV-Nächte. Zuletzt am ' + last.datum + ': ' + last.titel + '.' : 'Für den Korridor braucht die App mindestens 14 Nächte mit HRV.' }));
      korridorErklaerung(box);
      return;
    }
    const seit = (r.tage > 1 ? 'seit ' + tageTxt(r.tage) : 'neu') + (r.date !== H.date ? ' · Stand ' + r.datum : '');
    box.append(el('div', { class: 'tf-korr-kopf' }, dot(F[r.klasse]), el('b', { text: r.titel }), el('span', { class: 'tf-korr-seit', text: seit })), el('p', { class: 'tf-korr-text', text: r.text }));
    // Skala: Korridor, 7-Tage-Schnitt und die einzelnen Nächte der letzten 7 Tage
    const N = KO.filter((x) => x.date <= r.date && (toDay(r.date) - toDay(x.date)) / DAY < 7 && x.hrv > 0);
    const vals = [r.lo, r.hi, r.hrv7].concat(N.map((x) => x.hrv)).filter((x) => x > 0), lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.08;
    const g = el('div', { class: 'tf-korr-skala tf-chart' }); box.appendChild(g);
    const w = Math.max(260, g.clientWidth || 320), h = 74, xs = d3.scaleLog().domain([lo, hi]).range([12, w - 12]);
    const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'HRV-Korridor' }, g);
    svg('rect', { x: 12, y: 36, width: w - 24, height: 8, rx: 4, fill: col('fill') }, s);
    svg('rect', { x: xs(r.lo), y: 31, width: Math.max(2, xs(r.hi) - xs(r.lo)), height: 18, rx: 9, fill: col('green'), opacity: 0.25 }, s);
    [[r.lo, 'end'], [r.hi, 'start']].forEach(([v, anc]) => { const t = svg('text', { x: xs(v) + (anc === 'end' ? -4 : 4), y: 66, 'text-anchor': anc, class: 'tf-tick' }, s); t.textContent = v + ' ms'; });
    const kt = svg('text', { x: (xs(r.lo) + xs(r.hi)) / 2, y: 66, 'text-anchor': 'middle', class: 'tf-tick', 'font-weight': 600 }, s); kt.textContent = 'Korridor';
    if (xs(r.hi) - xs(r.lo) < 70) kt.remove();
    N.forEach((x) => svg('line', { x1: xs(x.hrv), x2: xs(x.hrv), y1: 33, y2: 47, stroke: col('purple'), 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.45 }, s));
    svg('circle', { cx: xs(r.hrv7), cy: 40, r: 9, fill: col(F[r.klasse]), stroke: col('card'), 'stroke-width': 3 }, s);
    const lab = svg('text', { x: Math.min(w - 12, Math.max(12, xs(r.hrv7))), y: 18, 'text-anchor': xs(r.hrv7) < 60 ? 'start' : xs(r.hrv7) > w - 60 ? 'end' : 'middle', class: 'tf-tick', 'font-weight': 700, fill: col('fg') }, s);
    lab.textContent = 'Ø 7 Tage ' + r.hrv7 + ' ms';
    const T1 = tip(g), ov = svg('rect', { x: 0, y: 0, width: w, height: h, fill: 'transparent' }, s);
    ov.addEventListener('pointermove', (ev) => { const bb = s.getBoundingClientRect(), k = w / bb.width, x = (ev.clientX - bb.left) * k; const best = N.reduce((m, n) => (Math.abs(xs(n.hrv) - x) < Math.abs(xs(m.hrv) - x) ? n : m), N[0] || { hrv: r.hrv7 }); if (!N.length) return; T1.show(xs(best.hrv) / k, 30 / k, wtag(best.date) + ', ' + best.datum, [{ label: 'Nacht', value: best.hrv + ' ms', color: col('purple') }, { label: '7-Tage-Schnitt', value: r.hrv7 + ' ms' }]); });
    ov.addEventListener('pointerleave', () => T1.hide());
    g.appendChild(el('div', { class: 'tf-caption', text: 'Punkt: 7-Tage-Schnitt · Striche: einzelne Nächte der letzten Woche · grün: dein Normalbereich (Mittel ± 0,5 SD der letzten 60 Nächte)' }));
    const kvb = el('div', { class: 'tf-kv' }); box.appendChild(kvb);
    kv(kvb, [
      ['HRV 7 Tage', String(r.hrv7), 'ms', { c: F[r.klasse], label: 'Korridor ' + r.lo + '–' + r.hi + ' ms' }],
      ['Ruhepuls 7 Tage', r.rhr7 == null ? '–' : nf(r.rhr7, 1), 'bpm', { c: r.z_rhr7 > 1 ? 'orange' : r.z_rhr7 < -0.5 ? 'teal' : 'gray', label: 'Basis ' + nf(r.rhr_basis, 1) + ' bpm' }],
      ['Trainingslast', r.acwr == null ? '–' : nf(r.acwr, 2), r.acwr == null ? '' : 'ACWR', { c: r.last_hoch ? 'orange' : 'gray', label: (r.last_hoch ? 'hoch' : 'im Rahmen') + ' · Form ' + sg(Math.round(r.tsb)) }],
    ]);
    if (r.cv_hoch) box.appendChild(el('p', { class: 'tf-korr-warn', text: 'Die HRV schwankt gerade stark (Variationskoeffizient ' + nf(r.cv7, 1) + ' % statt sonst ' + nf(r.cv_basis, 1) + ' %). Steigende Schwankung zeigt Ermüdung oft früher als ein sinkender Mittelwert.' }));
    // Verteilung der letzten 28 Tage
    const L = KO.filter((x) => x.klasse && x.date <= r.date && (toDay(r.date) - toDay(x.date)) / DAY < 28), cnt = {};
    L.forEach((x) => { cnt[x.klasse] = (cnt[x.klasse] || 0) + 1; });
    if (L.length >= 5) {
      const bar = el('div', { class: 'tf-vert-bar' }), leg = el('div', { class: 'tf-legend' });
      Object.keys(F).filter((k) => cnt[k]).forEach((k) => { const d = el('div', { title: T.farben.korridorKurz[k] + ': ' + cnt[k] }); d.style.flex = cnt[k] + ' 1 0'; d.style.background = col(F[k]); bar.appendChild(d); const i = el('i'); i.style.background = col(F[k]); leg.appendChild(el('span', null, i, T.farben.korridorKurz[k] + ' ' + cnt[k])); });
      box.append(el('div', { class: 'tf-ctrl-l tf-vert-l', text: 'Letzte ' + L.length + ' Tage mit Einordnung' }), bar, leg);
    }
    korridorErklaerung(box);
  }
  function korridorErklaerung(box) {
    const d = el('details', { class: 'tf-mehr' }, el('summary', { text: 'So liest du den Korridor' }));
    [['red', 'Sympathische Überlastung', 'HRV unter dem Korridor, Ruhepuls nicht gesunken. Das Stresssystem dominiert – Intensität raus, mehr Schlaf, an einen Infekt denken.'],
      ['indigo', 'Parasympathische Sättigung', 'HRV unter dem Korridor, aber der Ruhepuls ist sehr niedrig. Bei sehr niedrigem Puls kann die Variabilität nicht weiter steigen – bei hohen Umfängen normal, solange Leistung und Befinden stimmen.'],
      ['teal', 'Parasympathisch erholt', 'HRV über dem Korridor bei niedrigem Ruhepuls – das Muster guter Erholung.'],
      ['orange', 'Parasympathische Hyperaktivität', 'Wie „erholt“, aber unter hoher Last und mit sinkendem Befinden: So kann Overreaching aussehen. 2–3 lockere Tage, dann neu bewerten.'],
      ['yellow', 'Ruhepuls erhöht', 'HRV noch im Korridor, der Ruhepuls steigt – oft das erste Zeichen von Ermüdung, Hitze oder Infekt.'],
    ].forEach(([c, t, x]) => d.appendChild(el('div', { class: 'tf-mehr-z' }, dot(c), el('div', null, el('b', { text: t }), el('p', { text: x })))));
    d.appendChild(el('p', { class: 'tf-note', text: 'Warum 7 Tage? Einzelne Nächte schwanken stark. Der Wochenschnitt gegen den eigenen Normalbereich zeigt Trends verlässlicher (Plews et al. 2012, 2013).' }));
    box.appendChild(d);
  }

  /* =====================================================================
     BELASTUNG: Sportarten, interne gegen externe Last, ACWR je Disziplin
     ===================================================================== */
  const SPORTE = [['schwimmen', 'Schwimmen', 'i-swim', 'blue', 'swim'], ['rad', 'Rad', 'i-bike', 'orange', 'bike'], ['laufen', 'Laufen', 'i-run', 'mint', 'run'], ['gym', 'Gym', 'i-dumbbell', 'purple', 'kraft']];
  function gewaehlteSporte() { const a = athlet(); return a && Array.isArray(a.sportarten) && a.sportarten.length ? a.sportarten : SPORTE.map((x) => x[0]); }
  function sportKacheln() {
    const box = $('#sport-kacheln'), H = heute(); if (!box || !H) return;
    const B = rowsOf('belastung') || [], PD = rowsOf('pmc_disziplin') || [], pd = PD.find((r) => r.date === H.date) || PD[PD.length - 1] || {}, von = iso(toDay(H.date) - 6 * DAY), S = gewaehlteSporte();
    box.replaceChildren();
    SPORTE.filter(([id]) => S.includes(id)).forEach(([id, name, icon, farbe, k]) => {
      const R = B.filter((b) => b.sport === k && b.date >= von && b.date <= H.date), min = R.reduce((x, b) => x + (+b.min || 0), 0);
      const letzte = B.filter((b) => b.sport === k).pop();
      const sub = R.length ? '7 Tage: ' + R.length + (R.length === 1 ? ' Einheit · ' : ' Einheiten · ') + hmin(min * 60) + ' h' : id === 'gym' ? 'Workout zusammenstellen' : letzte ? 'zuletzt am ' + letzte.datum : 'noch keine Einheit';
      const ctl = pd[k + '_ctl'], acwr = pd[k + '_acwr'];
      const rechts = id === 'gym' && !(ctl >= 1) ? ico('i-chev', 'tf-chev') : el('span', { class: 'tf-sk-k' }, el('span', { class: 'num', text: ctl == null ? '–' : nf(ctl) }), el('small', null, acwr != null ? dot(acwrZone(acwr).c) : null, 'Fitness'));
      const b = el('button', { type: 'button', class: 'tf-sk', 'aria-label': name + ' öffnen' }, badge(farbe, icon), el('span', { class: 'tf-sk-t' }, el('b', { text: name }), el('small', { text: sub })), rechts);
      b.style.setProperty('--c', 'var(--tf-' + farbe + ')');
      b.addEventListener('click', () => T.zeige(id));
      box.appendChild(b);
    });
  }
  const acwrZone = (v) => (v == null ? { c: 'gray', label: 'kein Wert' } : v > 1.5 ? { c: 'red', label: 'Sprung' } : v > 1.3 ? { c: 'yellow', label: 'erhöht' } : v >= 0.8 ? { c: 'green', label: 'günstig' } : { c: 'gray', label: 'Entlastung' });
  const xLast = (r) => { let x = r.ext_z; if (r.tsb != null && r.tsb < -25 && x < 1.5) x = 1.5 + Math.min(1.5, (-25 - r.tsb) / 10); return Math.max(-3, Math.min(3, x)); };
  function bilanzBox() {
    const box = $('#bilanz-box'); if (!box) return;
    const LBR = rowsOf('last_bilanz');
    if (!LBR) { if (failedAny('last_bilanz')) failed(box); return; }
    box.replaceChildren();
    const H = heute(); if (!H) return;
    const cur = aktuell(LBR, 'typ', 3), last = cur || letzteMit(LBR, 'typ');
    if (!last) { box.appendChild(el('p', { class: 'tf-korr-text', text: 'Für den Vergleich braucht die App einige Wochen Trainingslast und eine HRV-Basis (mindestens 14 Nächte).' })); return; }
    box.append(el('div', { class: 'tf-korr-kopf' }, dot(LB[last.typ]), el('b', { text: last.titel }), el('span', { class: 'tf-korr-seit', text: cur ? (last.date === H.date ? 'heute' : 'Stand ' + fmtDay(toDay(last.date))) : 'zuletzt am ' + fmtDay(toDay(last.date)) })),
      el('p', { class: 'tf-korr-text', text: cur ? last.text : 'Gerade fehlen Trainingslast oder HRV für eine Einordnung. Letzter Stand: ' + last.text }));
    const kvb = el('div', { class: 'tf-kv' }); box.appendChild(kvb);
    kv(kvb, [
      ['Extern · Training', last.ext == null ? '–' : nf(last.ext, 2), 'ACWR', { c: last.ext_z >= 1.5 || last.tsb < -25 ? 'orange' : 'gray', label: stufeExt(last.ext_z) + ' · Form ' + sg(Math.round(last.tsb)) }],
      ['Intern · Körper', last.intern == null ? '–' : sg(last.intern, 1), 'SD', { c: last.intern >= 0.6 ? 'red' : last.intern <= -0.5 ? 'teal' : 'gray', label: stufeInt(last.intern) + ' (HRV, Puls, Schlaf)' }],
      last.treiber ? ['Größter Sprung', last.treiber_txt, '', { c: acwrZone(last.treiber_acwr).c, label: 'ACWR ' + nf(last.treiber_acwr, 2) }] : ['Größter Sprung', '–', ''],
    ]);
    const wrap = el('div', { class: 'tf-bil-grid' }), q = el('div', { class: 'tf-chart tf-bil-q' }), v = el('div', { class: 'tf-chart tf-bil-v' });
    wrap.append(el('div', null, el('div', { class: 'tf-ctrl-l', text: 'Einordnung der letzten 4 Wochen' }), q), el('div', null, el('div', { class: 'tf-ctrl-l', text: 'Verlauf: Training gegen Körper' }), v));
    box.appendChild(wrap);
    bilanzQuadrant(q, LBR, last);
    bilanzVerlauf(v, LBR);
  }
  function bilanzQuadrant(box, LBR, last) {
    const Q = LBR.filter((r) => r.typ && r.date <= last.date && (toDay(last.date) - toDay(r.date)) / DAY < 28);
    clear(box);
    const w = Math.max(260, box.clientWidth || 320), h = 250, pad = 6, bot = 22;
    const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'Interne gegen externe Last' }, box);
    const xs = d3.scaleLinear().domain([-3, 3]).range([pad, w - pad]).clamp(true), ys = d3.scaleLinear().domain([-3, 3]).range([h - bot, pad]).clamp(true);
    const reg = (x0, x1, y0, y1, c) => svg('rect', { x: xs(x0), y: ys(y1), width: xs(x1) - xs(x0), height: ys(y0) - ys(y1), fill: col(c), opacity: 0.09 }, s);
    reg(1.5, 3, 0.6, 3, 'red'); reg(1.5, 3, -3, 0.6, 'orange'); reg(-3, 1.5, 0.75, 3, 'yellow'); reg(-3, 1.5, -3, -0.5, 'teal'); reg(-3, 1.5, -0.5, 0.75, 'green');
    const lab = (x, y, t, anc) => { const e = svg('text', { x, y, 'text-anchor': anc, class: 'tf-tick', 'font-weight': 650 }, s); e.textContent = t; };
    lab(w - pad - 6, pad + 15, 'Systemisch', 'end'); lab(w - pad - 6, h - bot - 8, 'Muskulär', 'end'); lab(pad + 6, pad + 15, 'Innere Last', 'start'); lab(pad + 6, h - bot - 8, 'Frisch', 'start'); lab(xs(1.5) - 6, ys(-0.5) - 6, 'Gleichgewicht', 'end');
    const dl = (x1, x2, y1, y2) => svg('line', { x1, x2, y1, y2, stroke: col('fg3'), 'stroke-width': 1, 'stroke-dasharray': '3 3' }, s);
    dl(xs(1.5), xs(1.5), pad, h - bot); dl(xs(1.5), w - pad, ys(0.6), ys(0.6)); dl(pad, xs(1.5), ys(0.75), ys(0.75)); dl(pad, xs(1.5), ys(-0.5), ys(-0.5));
    const ax = svg('text', { x: w / 2, y: h - 5, 'text-anchor': 'middle', class: 'tf-tick' }, s); ax.textContent = 'weniger ← Trainingslast → mehr';
    const pts = Q.map((r) => [xs(xLast(r)), ys(r.intern)]);
    if (pts.length > 1) svg('path', { d: d3.line()(pts), fill: 'none', stroke: col('fg3'), 'stroke-width': 1, 'stroke-linejoin': 'round', opacity: 0.6 }, s);
    pts.forEach((p, i) => { const end = i === pts.length - 1; svg('circle', { cx: p[0], cy: p[1], r: end ? 7 : 3.6, fill: col(end ? LB[Q[i].typ] : 'indigo'), opacity: end ? 1 : 0.22 + (0.6 * i) / pts.length, stroke: end ? col('card') : null, 'stroke-width': 2 }, s); });
    if (!pts.length) return;
    const T1 = tip(box), del = d3.Delaunay.from(pts);
    const mv = (ev) => { const bb = s.getBoundingClientRect(), k = w / bb.width, i = del.find((ev.clientX - bb.left) * k, (ev.clientY - bb.top) * k), r = Q[i]; T1.show(pts[i][0] / k, pts[i][1] / k, wtag(r.date) + ', ' + fmtDay(toDay(r.date)), [{ label: 'Einordnung', value: LB_KURZ[r.typ], color: col(LB[r.typ]) }, { label: 'ACWR · Form', value: nf(r.ext, 2) + ' · ' + sg(Math.round(r.tsb)) }, { label: 'Körper (SD)', value: sg(r.intern, 1) }]); };
    s.addEventListener('pointermove', mv); s.addEventListener('pointerdown', mv); s.addEventListener('pointerleave', () => T1.hide());
    box.appendChild(el('div', { class: 'tf-caption', text: 'Rechts: Last über deinem Gewohnten (ACWR über 1,3 oder Form unter −25) · oben: HRV, Ruhepuls und Schlaf zeigen Belastung · großer Punkt: aktuell' }));
  }
  function bilanzVerlauf(box, LBR) {
    const p = params(), { rows, from, to } = windowRows(LBR, +p.range), R = rows.filter((r) => r.ext_z != null || r.intern != null);
    if (!R.length) { emptyNote(box, 'In diesem Zeitraum fehlen Trainingslast oder HRV.'); return; }
    const P = plot(box, { h: 220, y: [-3, 3], yticks: [-2, 0, 2], yfmt: (t) => (t === 0 ? '0' : sg(t)), x: [toDay(from), toDay(to)], label: 'Training gegen Körper' });
    svg('line', { x1: P.ml, x2: P.w - P.mr + 4, y1: P.ys(0), y2: P.ys(0), stroke: col('fg3'), 'stroke-width': 1 }, P.g);
    const xf = (r) => toDay(r.date), dw = Math.max(1, (P.xs(toDay(to)) - P.xs(toDay(from))) / Math.max(1, +p.range - 1));
    R.forEach((r) => { if (r.typ) svg('rect', { x: P.xs(xf(r)) - dw / 2, y: P.xb - 7, width: Math.max(1, dw - (dw > 5 ? 1 : 0)), height: 6, fill: col(LB[r.typ]), opacity: 0.85 }, P.g); });
    // Training als 7-Tage-Mittel (der Tageswert springt mit jedem harten Tag), Körper ist schon ein 7-Tage-Wert
    const ext7 = new Map(R.map((r) => { const v = R.filter((x) => x.date <= r.date && (toDay(r.date) - toDay(x.date)) / DAY < 7 && x.ext_z != null).map(xLast); return [r.date, v.length >= 4 ? v.reduce((a, b) => a + b, 0) / v.length : null]; }));
    line(P, R, xf, (r) => ext7.get(r.date), col('orange'), 2.2);
    line(P, R, xf, (r) => r.intern, col('indigo'), 2.2);
    hoverTime(box, P, R, xf, (r) => wtag(r.date) + ', ' + fmtDay(xf(r)), (r) => [{ label: 'Training (extern)', value: r.ext == null ? '–' : 'ACWR ' + nf(r.ext, 2), color: col('orange') }, { label: 'Körper (intern)', value: sg(r.intern, 1) + ' SD', color: col('indigo') }, r.typ ? { label: 'Einordnung', value: LB_KURZ[r.typ], color: col(LB[r.typ]) } : null].filter(Boolean), [{ y: (r) => ext7.get(r.date), color: col('orange') }, { y: (r) => r.intern, color: col('indigo') }]);
    const lg = el('div', { class: 'tf-legend' }); [['orange', 'Training (ACWR, Form · 7-Tage-Mittel)'], ['indigo', 'Körper (HRV, Puls, Schlaf)']].forEach(([c, t]) => { const i = el('i', { class: 'tf-line' }); i.style.background = col(c); lg.appendChild(el('span', null, i, t)); });
    box.appendChild(lg);
    box.appendChild(el('div', { class: 'tf-caption', text: 'Beide Linien in Standardabweichungen gegen dein Normal: Steigt nur die orange Linie, sitzt die Ermüdung eher in Muskeln und Sehnen; steigt die blaue mit, kommt sie im Nervensystem an.' }));
  }
  const ACWR_D = [['gesamt', 'Gesamt', '', 'indigo'], ['swim', 'Schwimmen', 'swim_', 'blue'], ['bike', 'Rad', 'bike_', 'orange'], ['run', 'Laufen', 'run_', 'mint'], ['kraft', 'Kraft', 'kraft_', 'purple']];
  const ACWR_AUS = new Set(speicher('tf:acwr-aus', []));
  function acwrKarte() {
    const chips = $('#acwr-chips'), box = $('#chart-acwr'), leg = $('#acwr-legende'), H = heute(); if (!chips || !box || !H) return;
    const PD = rowsOf('pmc_disziplin'); if (!PD) { if (failedAny('pmc_disziplin')) failed(box); return; }
    const p = params(), { rows, from, to } = windowRows(PD, +p.range), cur = PD.find((r) => r.date === H.date) || PD[PD.length - 1];
    const D = ACWR_D.filter(([, , pre]) => rows.some((r) => r[pre + 'acwr'] != null));
    chips.replaceChildren(); leg.replaceChildren();
    if (!D.length) { emptyNote(box, 'Für die ACWR braucht es regelmäßiges Training über mindestens vier Wochen – in diesem Zeitraum reicht die Last nicht.'); return; }
    D.forEach(([k, name, pre, c]) => {
      const v = cur[pre + 'acwr'], z = acwrZone(v), i = el('i', { class: 'tf-line' }); i.style.background = col(c);
      const b = el('button', { type: 'button', class: 'tf-acwr-chip', 'aria-pressed': String(!ACWR_AUS.has(k)), title: 'Im Diagramm ein- oder ausblenden' }, i, el('span', { text: name }), el('b', { text: v == null ? '–' : nf(v, 2) }), el('small', null, dot(z.c), z.label));
      b.addEventListener('click', () => { if (ACWR_AUS.has(k)) ACWR_AUS.delete(k); else if (D.filter(([x]) => !ACWR_AUS.has(x)).length > 1) ACWR_AUS.add(k); merke('tf:acwr-aus', [...ACWR_AUS]); acwrKarte(); });
      chips.appendChild(b);
    });
    const vis = D.filter(([k]) => !ACWR_AUS.has(k)), vals = rows.flatMap((r) => vis.map(([, , pre]) => r[pre + 'acwr'])).filter((x) => x != null);
    const top = Math.min(3, Math.max(1.8, ...vals) * 1.08);
    const P = plot(box, { h: 210, y: [0, top], yticks: [0.8, 1.3, 2, 3].filter((t) => t < top), yfmt: (t) => nf(t, t % 1 ? 1 : 0), x: [toDay(from), toDay(to)], label: 'ACWR je Disziplin' });
    const zone = (a0, a1, c, o) => { const y0 = P.ys(Math.min(a1, top)), y1 = P.ys(a0); svg('rect', { x: P.ml, y: y0, width: P.w - P.mr - P.ml, height: Math.max(0, y1 - y0), fill: col(c), opacity: o }, P.g); };
    zone(0.8, 1.3, 'green', 0.1); zone(1.3, 1.5, 'yellow', 0.14); if (top > 1.5) zone(1.5, top, 'red', 0.08);
    const xf = (r) => toDay(r.date);
    vis.forEach(([k, , pre, c]) => line(P, rows, xf, (r) => r[pre + 'acwr'], col(c), k === 'gesamt' ? 2.6 : 2));
    hoverTime(box, P, rows, xf, (r) => wtag(r.date) + ', ' + fmtDay(xf(r)), (r) => vis.map(([, name, pre, c]) => ({ label: name, value: r[pre + 'acwr'] == null ? '–' : nf(r[pre + 'acwr'], 2) + ' · ' + acwrZone(r[pre + 'acwr']).label, color: col(c) })), vis.map(([, , pre, c]) => ({ y: (r) => r[pre + 'acwr'], color: col(c) })));
    [['green', '0,8–1,3 günstig'], ['yellow', '1,3–1,5 erhöht'], ['red', 'über 1,5 Belastungssprung']].forEach(([c, t]) => { const i = el('i', { class: 'tf-band' }); i.style.background = col(c); leg.appendChild(el('span', null, i, t)); });
    leg.appendChild(el('span', { text: 'Tippe auf eine Disziplin, um sie aus- oder einzublenden.' }));
  }

  /* =====================================================================
     PROFIL: Über dich (Geburtsjahr, Geschlecht, Sportarten)
     ===================================================================== */
  async function ichSpeichern(body, msg) {
    try { if (msg) setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', body); A().patch('athlet', [j.profil]); if (msg) setMsg(msg, 'Gespeichert.'); return true; }
    catch (e) { if (msg) setMsg(msg, e.message, true); return false; }
  }
  const JAHR_MAX = () => new Date().getFullYear() - 10;
  function ichFelder(mitSport) { // baut die Felder einmal; .fuellen(a) setzt die Werte
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const jahr = el('input', { class: 'tf-input', type: 'number', inputmode: 'numeric', min: 1920, max: JAHR_MAX(), placeholder: 'z. B. 1995', 'aria-label': 'Geburtsjahr' });
    jahr.addEventListener('change', () => {
      const v = jahr.value.trim(), n = v === '' ? null : Math.round(+v);
      if (n != null && !(n >= 1920 && n <= JAHR_MAX())) { setMsg(msg, 'Bitte ein Jahr zwischen 1920 und ' + JAHR_MAX() + ' eingeben.', true); return; }
      ichSpeichern({ geburtsjahr: n }, msg);
    });
    const gs = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Geschlecht' });
    const sp = el('div', { class: 'tf-chipset', role: 'group', 'aria-label': 'Sportarten' });
    const wrap = el('div', { class: 'tf-ich-felder' },
      el('label', { class: 'tf-field' }, el('span', { text: 'Geburtsjahr' }), jahr),
      el('div', { class: 'tf-field' }, el('span', { text: 'Geschlecht' }), gs, el('small', { class: 'tf-ich-hint', text: 'Für die Normwerte der VO2max. Nochmal tippen = keine Angabe.' })),
      mitSport ? el('div', { class: 'tf-field tf-ich-sport' }, el('span', { text: 'Deine Sportarten' }), sp, el('small', { class: 'tf-ich-hint', text: 'Nur diese erscheinen unter Training.' })) : null,
      msg);
    wrap.fuellen = (a) => {
      if (document.activeElement !== jahr) jahr.value = a.geburtsjahr || '';
      segButtons(gs, [['m', 'Männlich'], ['w', 'Weiblich'], ['d', 'Divers']], a.geschlecht, (v) => ichSpeichern({ geschlecht: v === a.geschlecht ? null : v }, msg));
      if (!mitSport) return;
      const S = Array.isArray(a.sportarten) && a.sportarten.length ? a.sportarten : SPORTE.map((x) => x[0]);
      sp.replaceChildren();
      SPORTE.forEach(([id, name, icon]) => {
        const on = S.includes(id), b = el('button', { type: 'button', 'aria-pressed': String(on) }, ico(icon), ' ' + name);
        b.addEventListener('click', () => {
          const neu = on ? S.filter((x) => x !== id) : S.concat([id]);
          if (!neu.length) { setMsg(msg, 'Mindestens eine Sportart bleibt ausgewählt.', true); return; }
          ichSpeichern({ sportarten: neu }, msg);
        });
        sp.appendChild(b);
      });
    };
    return wrap;
  }
  let ichBox = null;
  function profilZusatz() {
    const box = $('#ich-box'), a = athlet(); if (!box || !a) return;
    if (!ichBox || !box.contains(ichBox)) { ichBox = ichFelder(true); box.replaceChildren(ichBox); }
    ichBox.fuellen(a);
  }

  /* =====================================================================
     FITNESS-ALTER
     ===================================================================== */
  const QUELLE = { training: 'aus deinen Einheiten', pause: 'ältere Schätzung, für die Pause abgewertet', puls: 'aus Ruhe- und Maximalpuls' };
  const FA_TIPP = {
    vo2: ['VO2max steigern', 'Zweimal pro Woche Intervalle wie 4 × 4 min bei 85–95 % der maximalen Herzfrequenz, dazwischen 3 min locker – das hebt die VO2max am stärksten. Der Rest der Woche bleibt locker.'],
    ruhepuls: ['Ruhepuls senken', 'Mehr lockere Ausdauer senkt den Ruhepuls über Monate. Auch Schlaf, wenig Alkohol und weniger Stress helfen.'],
    intensitaet: ['Mehr aktive Minuten', '150–300 Minuten pro Woche moderat oder 75–150 intensiv. Intensive Minuten zählen doppelt.'],
    schlaf: ['Länger schlafen', '7,5 bis 9 Stunden: feste Zeiten, ein dunkles, kühles Zimmer und wenig helles Licht am späten Abend.'],
    rhythmus: ['Regelmäßiger schlafen', 'Jeden Tag ungefähr zur gleichen Zeit ins Bett – auch am Wochenende (± 30 Minuten).'],
    schritte: ['Mehr Alltagsbewegung', 'Wege zu Fuß, kurze Gehpausen: 8.000–10.000 Schritte pro Tag senken das Sterberisiko deutlich.'],
    koerper: ['Körperzusammensetzung', 'Krafttraining erhalten und langsam vorgehen – ohne Crash-Diät.'],
    hrv: ['HRV verbessern', 'Regelmäßiger Schlaf, wenig Alkohol, Stress abbauen und Ausdauertraining heben die HRV.'],
  };
  function faTipps(r, a) {
    const F = Object.fromEntries(r.faktoren.map((f) => [f.id, f])), K = TF_FA, out = [];
    const add = (id, besser) => { const f = F[id]; if (!f || f.jahre == null) return; const g = f.jahre - besser; if (g > 0.15) out.push({ id, titel: FA_TIPP[id][0], text: FA_TIPP[id][1], gewinn: g }); };
    if (F.vo2) add('vo2', Math.max(-10, F.vo2.jahre - 1.6)); // 1 MET (3,5 ml/kg/min) mehr
    if (F.ruhepuls) add('ruhepuls', tfKurve(K.ruhepuls, Math.max(40, F.ruhepuls.wert - 5)));
    if (F.intensitaet) add('intensitaet', tfKurve(K.intensitaet, Math.max(F.intensitaet.wert, 300)));
    if (F.schlaf) add('schlaf', tfKurve(K.schlaf, Math.min(9, Math.max(7.5, F.schlaf.wert))));
    if (F.rhythmus) add('rhythmus', tfKurve(K.rhythmus, Math.min(F.rhythmus.wert, 30)));
    if (F.schritte) add('schritte', tfKurve(K.schritte, Math.max(F.schritte.wert, 10000)));
    if (F.koerper) add('koerper', 0);
    if (F.hrv && F.hrv.diff != null) add('hrv', tfKurve(K.hrv, F.hrv.diff + 0.2));
    return out.sort((x, y) => y.gewinn - x.gewinn).slice(0, 4);
  }
  function renderFitness() {
    const box = $('#fitness-box'); if (!box) return;
    const FA = rowsOf('fitness_alter'), a = athlet();
    if (!FA || !a) { if (failedAny('fitness_alter')) failed(box); return; }
    box.replaceChildren();
    const grid = el('div', { class: 'tf-grid' }); box.appendChild(grid);
    const r = FA[FA.length - 1];
    if (r.status !== 'ok') {
      const c = karte({ farbe: 'green', icon: 'i-heart', titel: 'Dein Fitness-Alter', sub: 'Wie alt dein Körper nach deinen Messwerten wirkt', span2: true, cls: 'tf-fa-leer' });
      if (r.status === 'profil') {
        c.append(el('p', { class: 'tf-fa-intro', text: 'Für das Fitness-Alter braucht die App dein Geburtsjahr und dein Geschlecht – die Normwerte der VO2max hängen von beidem ab. Die Angaben bleiben in deinem Konto.' }));
        const f = ichFelder(false); c.appendChild(f); f.fuellen(a);
      } else c.append(el('p', { class: 'tf-fa-intro', text: 'Noch zu wenig Daten: Es braucht Ruhepuls-Werte oder Läufe und Radeinheiten mit Puls.' }));
      grid.appendChild(c);
      grid.appendChild(faMethode());
      return;
    }
    grid.appendChild(faHero(r, FA));
    const fk = karte({ farbe: 'indigo', icon: 'i-gauge', titel: 'Was dein Fitness-Alter ausmacht', sub: 'Jeder Faktor in Lebensjahren: links jünger, rechts älter' });
    grid.appendChild(fk); faFaktoren(fk, r);
    const vk = karte({ farbe: 'red', icon: 'i-lungs', titel: 'VO2max', sub: 'Maximale Sauerstoffaufnahme, ' + QUELLE[r.vo2_quelle] + ' – der stärkste einzelne Faktor' });
    grid.appendChild(vk); faVo2(vk, r, a);
    const tk = karte({ farbe: 'green', icon: 'i-wave', titel: 'Verlauf', sub: 'Fitness-Alter pro Woche gegen dein Kalenderalter', span2: true });
    grid.appendChild(tk); faVerlauf(tk, FA);
    const tipps = faTipps(r, a);
    if (tipps.length) {
      const pk = karte({ farbe: 'orange', icon: 'i-spark', titel: 'So wirst du jünger', sub: 'Die größten Hebel nach deinen Werten', span2: true });
      const ul = el('div', { class: 'tf-tipps' });
      tipps.forEach((t) => ul.appendChild(el('div', { class: 'tf-tipp' }, el('div', { class: 'tf-tipp-h' }, el('b', { text: t.titel }), el('span', { class: 'tf-tipp-g', text: 'bis zu −' + nf(t.gewinn, 1) + ' J' })), el('p', { text: t.text }))));
      pk.appendChild(ul); grid.appendChild(pk);
    }
    grid.appendChild(faMethode());
  }
  function faHero(r, FA) {
    const jung = r.diff <= 0, c = Math.abs(r.diff) < 0.5 ? 'gray' : jung ? 'green' : 'orange';
    const card = el('article', { class: 'tf-card tf-span2 tf-fa-hero', id: 'karte-fitnessalter' });
    card.style.setProperty('--acc', 'var(--tf-' + c + ')');
    const zahl = el('div', { class: 'tf-fa-zahl' }, el('div', { class: 'tf-fa-label', text: 'Dein Fitness-Alter' }), el('div', { class: 'tf-fa-big' }, el('span', { class: 'num', text: nf(r.fitness_alter, 1) }), el('span', { class: 'tf-u', text: 'Jahre' })),
      el('div', { class: 'tf-fa-pill' }, dot(c), Math.abs(r.diff) < 0.5 ? 'genau dein Alter' : jahre(r.diff) + (jung ? ' jünger' : ' älter') + ' als dein Kalenderalter (' + nf(r.alter, 1) + ')'));
    const lin = el('div', { class: 'tf-fa-lineal tf-chart' });
    card.append(el('div', { class: 'tf-fa-top' }, zahl, lin));
    // Kennzahlen darunter
    const R = FA.filter((x) => x.status === 'ok'), vor = R.length > 26 ? R[R.length - 27] : R[0];
    const stats = el('div', { class: 'tf-fa-stats' });
    const stat = (l, v, s, farbe) => stats.appendChild(el('div', { class: 'tf-fa-stat' }, el('small', { text: l }), el('b', { class: 'num', text: v }), el('span', { text: s, style: farbe ? 'color:var(--tf-' + farbe + ')' : null })));
    if (r.tempo != null) stat('Alterungstempo', nf(r.tempo, 1).replace('-', '−') + '×', r.tempo < 0 ? 'du wirst gerade jünger' : r.tempo < 0.95 ? 'langsamer als die Zeit' : r.tempo <= 1.05 ? 'so schnell wie die Zeit' : 'schneller als die Zeit', r.tempo < 0.95 ? 'green' : r.tempo <= 1.05 ? null : 'orange');
    if (vor && vor !== r) { const d = r.fitness_alter - vor.fitness_alter - (r.alter - vor.alter); stat('Seit ' + fmtDay(toDay(vor.date)), sg(r.fitness_alter - vor.fitness_alter, 1) + ' J', 'Kalender ' + sg(r.alter - vor.alter, 1) + ' J', d <= 0 ? 'green' : 'orange'); }
    const pz = Math.round(100 * phi(r.vo2_z));
    stat('VO2max', nf(r.vo2, 1), 'besser als ' + Math.max(1, Math.min(99, pz)) + ' % deiner Altersgruppe', pz >= 50 ? 'green' : 'orange');
    card.appendChild(stats);
    requestAnimationFrame(() => faLineal(lin, r.alter, r.fitness_alter, c));
    return card;
  }
  function faLineal(box, alter, fa, c) {
    clear(box);
    const w = Math.max(260, box.clientWidth || 320), h = 92, lo = Math.floor(Math.min(alter, fa) - 6), hi = Math.ceil(Math.max(alter, fa) + 6);
    const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'Fitness-Alter ' + nf(fa, 1) + ' gegen Kalenderalter ' + nf(alter, 1) }, box);
    const xs = d3.scaleLinear().domain([lo, hi]).range([16, w - 16]), yb = 46;
    svg('rect', { x: 16, y: yb - 3, width: w - 32, height: 6, rx: 3, fill: col('fill') }, s);
    for (let y = Math.ceil(lo); y <= hi; y++) {
      const x = xs(y), major = y % 5 === 0;
      svg('line', { x1: x, x2: x, y1: yb + (major ? 8 : 10), y2: yb + 14, stroke: col(major ? 'fg2' : 'fg3'), 'stroke-width': 1 }, s);
      if (major) { const t = svg('text', { x, y: yb + 30, 'text-anchor': 'middle', class: 'tf-tick' }, s); t.textContent = y; }
    }
    const farbe = col(c), gid = 'tf-fa-grad', defs = svg('defs', null, s), lg = svg('linearGradient', { id: gid, x1: fa < alter ? 1 : 0, x2: fa < alter ? 0 : 1, y1: 0, y2: 0 }, defs);
    svg('stop', { offset: 0, 'stop-color': farbe, 'stop-opacity': 0.12 }, lg); svg('stop', { offset: 1, 'stop-color': farbe, 'stop-opacity': 0.95 }, lg);
    svg('rect', { x: Math.min(xs(alter), xs(fa)), y: yb - 5, width: Math.max(2, Math.abs(xs(fa) - xs(alter))), height: 10, rx: 5, fill: 'url(#' + gid + ')' }, s);
    svg('line', { x1: xs(alter), x2: xs(alter), y1: yb - 14, y2: yb + 14, stroke: col('fg2'), 'stroke-width': 2.5, 'stroke-linecap': 'round' }, s);
    svg('circle', { cx: xs(fa), cy: yb, r: 10, fill: farbe, stroke: col('card'), 'stroke-width': 3.5 }, s);
    const links = fa < alter, la = svg('text', { x: xs(alter) + (links ? 6 : -6), y: yb - 20, 'text-anchor': links ? 'start' : 'end', class: 'tf-tick', 'font-weight': 600 }, s); la.textContent = 'Kalenderalter ' + nf(alter, 1);
    const lf = svg('text', { x: xs(fa) + (links ? -6 : 6), y: yb - 20, 'text-anchor': links ? 'end' : 'start', class: 'tf-tick', 'font-weight': 700, fill: farbe }, s); lf.textContent = 'Fitness ' + nf(fa, 1);
  }
  function faFaktoren(card, r) {
    const F = r.faktoren.slice().sort((x, y) => (x.id === 'vo2' ? -1 : y.id === 'vo2' ? 1 : Math.abs(y.jahre) - Math.abs(x.jahre)));
    const max = Math.max(2, ...F.map((f) => Math.abs(f.jahre || 0))), box = el('div', { class: 'tf-fa-faktoren' });
    box.appendChild(el('div', { class: 'tf-fa-f tf-fa-achse' }, el('span'), el('div', null, el('span', { text: '← jünger' }), el('span', { text: 'älter →' })), el('span')));
    F.forEach((f) => {
      const bar = el('div', { class: 'tf-fa-bar' }), i = el('i'), pct = (50 * Math.min(max, Math.abs(f.jahre || 0))) / max;
      i.style.width = Math.max(pct, f.jahre ? 1.5 : 0) + '%';
      if ((f.jahre || 0) < 0) { i.style.right = '50%'; i.style.background = col('green'); } else { i.style.left = '50%'; i.style.background = col('orange'); }
      bar.appendChild(i);
      const v = Math.abs(f.jahre || 0) < 0.05 ? '±0' : sg(f.jahre, 1);
      box.appendChild(el('div', { class: 'tf-fa-f' }, el('div', { class: 'tf-fa-fn' }, el('b', { text: f.name }), el('small', { text: f.txt })), bar, el('div', { class: 'tf-fa-fv num', text: v + ' J' })));
    });
    card.appendChild(box);
    const ALLE_F = [['ruhepuls', 'Ruhepuls'], ['intensitaet', 'Intensitätsminuten'], ['schlaf', 'Schlafdauer'], ['rhythmus', 'Schlafrhythmus'], ['schritte', 'Schritte'], ['koerper', 'Körperfett oder BMI'], ['hrv', 'HRV']], fehlt = ALLE_F.filter(([id]) => !r.faktoren.some((f) => f.id === id)).map(([, n]) => n);
    card.appendChild(el('p', { class: 'tf-note', text: 'Summe ' + sg(r.summe, 1) + ' Jahre: VO2max ' + sg(r.vo2_jahre, 1) + ' (höchstens ±10), Lebensstil ' + sg(r.leben_jahre, 1) + ' (zusammen höchstens ±6).' + (fehlt.length ? ' Noch nicht dabei, weil in den letzten 30 Tagen zu wenig Daten da sind: ' + fehlt.join(', ') + '.' : '') }));
  }
  function faVo2(card, r, a) {
    const pz = Math.max(1, Math.min(99, Math.round(100 * phi(r.vo2_z)))), alterTxt = r.vo2_basis_alter < 20 ? 'über jedem Altersschnitt' : 'Schnitt der ' + Math.round(r.vo2_basis_alter) + '-Jährigen';
    const kvb = el('div', { class: 'tf-kv' }); card.appendChild(kvb);
    kv(kvb, [['Deine VO2max', nf(r.vo2, 1), 'ml/kg/min', { c: pz >= 50 ? 'green' : 'orange', label: 'besser als ' + pz + ' %' }], ['Schnitt deines Alters', nf(r.vo2_norm, 1), 'ml/kg/min', { c: 'gray', label: (a.geschlecht === 'w' ? 'Frauen' : a.geschlecht === 'd' ? 'Mittel' : 'Männer') + ', ' + Math.round(r.alter) + ' J.' }], ['Entspricht', r.vo2_basis_alter < 20 ? 'unter 20' : String(Math.round(r.vo2_basis_alter)), 'Jahre', { c: 'gray', label: alterTxt }]]);
    const V = rowsOf('vo2max') || [], H = heute(), box = el('div', { class: 'tf-chart', style: 'min-height:190px' }); card.appendChild(box);
    if (!H) return;
    const from = iso(toDay(H.date) - 364 * DAY), R = V.filter((v) => v.date >= from && v.date <= H.date);
    if (!R.length) { emptyNote(box, r.vo2_quelle === 'puls' ? 'Keine passenden Einheiten: Die VO2max kommt hier aus Ruhe- und Maximalpuls (Uth et al. 2004) – Läufe ab 20 min und Radeinheiten ab 30 min mit gleichmäßigem Puls machen sie genauer.' : 'In den letzten 12 Monaten keine passenden Einheiten.'); return; }
    const fk = r.rad_faktor || 1, wert = (v) => (v.sport === 'bike' ? v.vo2 * fk : v.vo2);
    requestAnimationFrame(() => {
      const ys = R.map(wert).concat([r.vo2_norm]), P = plot(box, { h: 190, y: [Math.floor(Math.min(...ys) - 3), Math.ceil(Math.max(...ys) + 3)], ny: 4, x: [toDay(from), toDay(H.date)], label: 'VO2max-Schätzungen' }), xf = (v) => toDay(v.date);
      refLine(P, r.vo2_norm, col('fg3'));
      dots(P, R.filter((v) => v.sport === 'run'), xf, wert, col('mint'), 3, 0.65);
      dots(P, R.filter((v) => v.sport === 'bike'), xf, wert, col('orange'), 3, 0.65);
      const M = R.map((v) => ({ date: v.date, m: median(R.filter((x) => x.date <= v.date && (toDay(v.date) - toDay(x.date)) / DAY < 90).map(wert)) }));
      line(P, M, xf, (v) => v.m, col('red'), 2.4);
      hoverTime(box, P, R, xf, (v) => fmtDay(xf(v)) + ' · ' + (v.sport === 'run' ? 'Lauf' : 'Rad'), (v) => [{ label: 'VO2max', value: nf(wert(v), 1) + ' ml/kg/min', color: col(v.sport === 'run' ? 'mint' : 'orange') }, v.sport === 'bike' && fk !== 1 ? { label: 'Rad gemessen', value: nf(v.vo2, 1) + ' × ' + nf(fk, 2) } : null, { label: 'Puls', value: v.hrr_pct + ' % der Reserve' }].filter(Boolean), [{ y: wert, color: col('fg2') }]);
      const lg = el('div', { class: 'tf-legend' }); [['mint', 'Lauf', 'dot'], ['orange', 'Rad', 'dot'], ['red', '90-Tage-Median', 'tf-line']].forEach(([c, t, k]) => { const i = el('i', { class: k === 'dot' ? null : k }); i.style.background = col(c); if (k === 'dot') { i.style.borderRadius = '50%'; i.style.width = '8px'; i.style.height = '8px'; } lg.appendChild(el('span', null, i, t)); });
      const ig = el('i', { class: 'tf-dash' }); ig.style.borderColor = col('fg3'); lg.appendChild(el('span', null, ig, 'Schnitt deines Alters'));
      box.appendChild(lg);
      if (fk !== 1) box.appendChild(el('div', { class: 'tf-caption', text: 'Rad-Schätzungen liegen meist unter Lauf-Werten (weniger Muskelmasse arbeitet). Die App rechnet sie mit deinem persönlichen Faktor × ' + nf(fk, 2) + ' auf Laufniveau um – das passt zu den Normwerten, die aus Laufband-Tests stammen.' }));
    });
  }
  function faVerlauf(card, FA) {
    const R = FA.filter((x) => x.status === 'ok'), box = el('div', { class: 'tf-chart', style: 'min-height:210px' }); card.appendChild(box);
    if (R.length < 2) { emptyNote(box, 'Der Verlauf erscheint ab der zweiten Woche.'); return; }
    requestAnimationFrame(() => {
      const v = R.flatMap((x) => [x.fitness_alter, x.alter]), P = plot(box, { h: 210, y: [Math.floor(Math.min(...v) - 2), Math.ceil(Math.max(...v) + 2)], ny: 4, yfmt: (t) => t + ' J', x: [toDay(R[0].date), toDay(R[R.length - 1].date)], label: 'Fitness-Alter pro Woche' }), xf = (x) => toDay(x.date);
      const gid = 'tf-fa-area', defs = svg('defs', null, P.s), lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, 'stop-color': col('green'), 'stop-opacity': 0.05 }, lg); svg('stop', { offset: 1, 'stop-color': col('green'), 'stop-opacity': 0.3 }, lg);
      band(P, R, xf, (x) => Math.min(x.alter, x.fitness_alter), (x) => x.alter, 'url(#' + gid + ')', 1);
      band(P, R, xf, (x) => x.alter, (x) => Math.max(x.alter, x.fitness_alter), col('orange'), 0.18);
      line(P, R, xf, (x) => x.alter, col('fg3'), 1.6, '5 4');
      line(P, R, xf, (x) => x.fitness_alter, col('green'), 2.6);
      const last = R[R.length - 1]; endDot(P, xf(last), last.fitness_alter, col('green'));
      hoverTime(box, P, R, xf, (x) => 'Woche bis ' + fmtDay(xf(x)), (x) => [{ label: 'Fitness-Alter', value: nf(x.fitness_alter, 1) + ' J', color: col('green') }, { label: 'Kalenderalter', value: nf(x.alter, 1) + ' J' }, { label: 'VO2max', value: nf(x.vo2, 1) + ' · ' + (x.vo2_quelle === 'training' ? 'Training' : x.vo2_quelle === 'pause' ? 'Pause' : 'Puls') }], [{ y: (x) => x.fitness_alter, color: col('green') }]);
      const l2 = el('div', { class: 'tf-legend' }), i1 = el('i', { class: 'tf-line' }), i2 = el('i', { class: 'tf-dash' }); i1.style.background = col('green'); i2.style.borderColor = col('fg3');
      l2.append(el('span', null, i1, 'Fitness-Alter'), el('span', null, i2, 'Kalenderalter')); box.appendChild(l2);
    });
  }
  function faMethode() {
    const c = karte({ farbe: 'gray', icon: 'i-info', titel: 'Wie das berechnet wird', sub: 'Schätzung aus deinen Daten – keine medizinische Diagnose', span2: true });
    c.appendChild(el('div', { class: 'tf-fa-methode' },
      el('p', { text: 'Ausgangspunkt ist dein Kalenderalter. Jeder Messwert verschiebt es um so viele Jahre, wie er dein statistisches Sterberisiko verändert – das Risiko verdoppelt sich ungefähr alle acht Lebensjahre.' }),
      el('p', { text: 'Den größten Einfluss hat die VO2max: Jede Stufe von 3,5 ml/kg/min (1 MET) über dem Schnitt deines Alters und Geschlechts (norwegische HUNT-Studie) senkt das Risiko um rund 13 % – etwa 1,6 Lebensjahre. Dazu kommen Ruhepuls, Intensitätsminuten, Schlafdauer und -rhythmus, Schritte, Körperfett oder BMI und HRV.' }),
      el('p', { text: 'Die VO2max schätzt die App aus Tempo bzw. Leistung und Puls deiner Einheiten (ACSM-Gleichungen). Ohne passende Einheiten nimmt sie Ruhe- und Maximalpuls. Mit einem Labortest wäre sie genauer.' }),
      el('p', { class: 'tf-quelle', text: 'Nes et al., Med Sci Sports Exerc 2013 · Kodama et al., JAMA 2009 · Mandsager et al., JAMA Netw Open 2018 · Swain & Leutholtz, Med Sci Sports Exerc 1997 · Uth et al., Eur J Appl Physiol 2004' })));
    return c;
  }

  /* =====================================================================
     SAISON: Countdown, Phasen, Fahrplan, Rennen
     ===================================================================== */
  const SZ = { form: null, loeschen: null };
  const zielTxt = (z) => (z < 3600 ? mmss(z) + ' min' : z % 60 ? hms(z) + ' h' : hmin(z) + ' h');
  function renderSaison() {
    const box = $('#saison-box'); if (!box) return;
    const SR = rowsOf('saison');
    if (!SR) { if (failedAny('saison')) failed(box); return; }
    const s = SR[0];
    box.replaceChildren();
    const grid = el('div', { class: 'tf-grid' }); box.appendChild(grid);
    if (s.ziel_id) { szHero(grid, s); szFahrplan(grid, s); }
    else szLeer(grid, s);
    szEmpfehlung(grid, s);
    szRennen(grid, s);
  }
  function prioBadge(p) { const b = el('span', { class: 'tf-prio', text: p, title: PRIO[p][1] }); b.style.background = 'var(--tf-' + PRIO[p][0] + ')'; return b; }
  function szLeer(grid, s) {
    const c = el('article', { class: 'tf-card tf-span2 tf-sz-hero tf-sz-leer' });
    c.style.setProperty('--acc', 'var(--tf-' + (s.phase === 'uebergang' ? 'purple' : 'pink') + ')');
    c.append(el('div', { class: 'tf-sz-leer-t' }, badge('pink', 'i-flag'), el('div', null, el('h2', { text: s.phase === 'uebergang' ? 'Übergang' : s.phase === 'ohne_a' ? 'Noch kein Hauptrennen' : 'Plane deine Saison' }), el('p', { text: s.phase === 'uebergang' ? s.phase_sub + ' – Tag ' + s.phase_tag + ' von ' + s.phase_tage + '.' : s.phase_sub }))));
    if (s.phase === 'ohne_a' && s.naechstes) c.appendChild(el('p', { class: 'tf-note', text: 'Nächstes Rennen: ' + s.naechstes.name + ' in ' + tageTxt(s.naechstes.in_tagen) + ' (' + s.naechstes.art + ').' }));
    const btn = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, ico('i-plus'), ' Rennen eintragen');
    btn.addEventListener('click', () => { SZ.form = neuesRennen(); renderSaison(); requestAnimationFrame(() => { const f = $('#sz-name'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.focus({ preventScroll: true }); } }); });
    c.appendChild(el('div', { class: 'tf-form-actions', style: 'margin-top:14px' }, btn));
    c.appendChild(el('div', { class: 'tf-sz-abc' }, ...['A', 'B', 'C'].map((p) => el('div', null, prioBadge(p), el('span', { text: PRIO[p][1] })))));
    grid.appendChild(c);
  }
  function szHero(grid, s) {
    const c = el('article', { class: 'tf-card tf-span2 tf-sz-hero', id: 'karte-countdown' });
    c.style.setProperty('--acc', 'var(--tf-' + (PH_FARBE[s.phase] || 'pink') + ')');
    const tg = s.ziel_tage, count = el('div', { class: 'tf-sz-count' }, el('span', { class: 'num', text: tg === 0 ? 'Heute' : nf(tg) }), tg === 0 ? null : el('span', { class: 'tf-u', text: tg === 1 ? 'Tag' : 'Tage' }));
    const ziel = el('div', { class: 'tf-sz-ziel' }, el('div', { class: 'tf-sz-name' }, prioBadge(s.ziel_prio), el('b', { text: s.ziel_name })), el('div', { class: 'tf-sz-art', text: s.ziel_art + ' · ' + wtag(s.ziel_datum) + ', ' + s.ziel_datum_txt + (s.ziel_s ? ' · Ziel ' + zielTxt(s.ziel_s) : '') }),
      el('div', { class: 'tf-sz-wochen', text: tg >= 7 ? s.ziel_wochen + (s.ziel_wochen === 1 ? ' Woche' : ' Wochen') + (s.ziel_resttage ? ' und ' + tageTxt(s.ziel_resttage) : '') : tg > 0 ? 'Rennwoche' : 'Viel Erfolg!' }));
    const pct = s.phase_tage ? Math.min(100, (100 * (s.phase_tag || 0)) / s.phase_tage) : 0, pbar = el('div', { class: 'tf-sz-pbar' }), pin = el('i'); pin.style.width = pct + '%'; pin.style.background = 'var(--tf-' + (PH_FARBE[s.phase] || 'gray') + ')'; pbar.appendChild(pin);
    const phase = el('div', { class: 'tf-sz-phase' }, el('small', { text: 'Trainingsphase jetzt' }), el('div', { class: 'tf-sz-ph' }, dot(PH_FARBE[s.phase] || 'gray'), el('b', { text: s.phase_txt })), el('span', { text: s.phase_sub || '' }), pbar, s.entlastung ? el('span', { class: 'tf-sz-entl', text: 'Entlastungswoche: etwa 30–40 % weniger Umfang' }) : null);
    c.append(el('div', { class: 'tf-sz-top' }, el('div', { class: 'tf-sz-links' }, count, ziel), phase));
    const zl = el('div', { class: 'tf-sz-zeitleiste tf-chart' }); c.appendChild(zl);
    const lg = el('div', { class: 'tf-legend' });
    s.phasen.forEach((p) => { const i = el('i'); i.style.background = col(PH_FARBE[p.id]); lg.appendChild(el('span', null, i, p.name)); });
    c.appendChild(lg);
    grid.appendChild(c);
    szZeitleiste(zl, s);
  }
  function szZeitleiste(box, s) {
    clear(box);
    const P0 = s.phasen, t0 = Date.parse(P0[0].von), t1 = Date.parse(P0[P0.length - 1].bis) + DAY;
    const w = Math.max(280, box.clientWidth || 320), h = 70, xs = d3.scaleUtc().domain([t0, t1]).range([2, w - 2]);
    const sv = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'Phasen bis zum Rennen' }, box);
    P0.forEach((p) => {
      const x0 = xs(Date.parse(p.von)), x1 = xs(Date.parse(p.bis) + DAY), wd = Math.max(2, x1 - x0 - 2);
      svg('rect', { x: x0 + 1, y: 22, width: wd, height: 22, rx: Math.min(6, wd / 2), fill: col(PH_FARBE[p.id]), opacity: p.id === s.phase ? 1 : 0.78, stroke: p.id === s.phase ? col('fg') : null, 'stroke-width': p.id === s.phase ? 2 : null }, sv);
      const kurzName = { vorbereitung: 'Vorb.', grundlage: 'Grundlage', aufbau: 'Aufbau', spitze: 'Spitze', taper: 'Taper', rennwoche: 'RW', rennen: '', uebergang: 'Üb.' }[p.id];
      if (wd > 44 && kurzName) { const t = svg('text', { x: x0 + 1 + wd / 2, y: 37, 'text-anchor': 'middle', class: 'tf-tick', fill: '#fff', 'font-weight': 650 }, sv); t.textContent = wd > 76 ? p.name : kurzName; if (t.getComputedTextLength() > wd - 6) t.remove(); }
    });
    // Monate
    d3.utcMonth.range(new Date(t0), new Date(t1)).forEach((m, i, arr) => { if (arr.length > 9 && i % 2) return; const x = xs(m); const t = svg('text', { x, y: 62, 'text-anchor': 'middle', class: 'tf-tick' }, sv); t.textContent = T.ui.MON[m.getUTCMonth()]; if (x < 12 || x > w - 12) t.remove(); });
    // Heute
    const th = Date.parse(localDate());
    if (th >= t0 && th <= t1) { const x = xs(th); svg('line', { x1: x, x2: x, y1: 14, y2: 50, stroke: col('fg'), 'stroke-width': 2, 'stroke-linecap': 'round' }, sv); const t = svg('text', { x: Math.max(18, Math.min(w - 18, x)), y: 10, 'text-anchor': 'middle', class: 'tf-tick', 'font-weight': 700, fill: col('fg') }, sv); t.textContent = 'Heute'; }
    // weitere Rennen
    (s.liste || []).filter((r) => r.in_tagen >= 0 && Date.parse(r.datum) >= t0 && Date.parse(r.datum) <= t1).forEach((r) => {
      const x = xs(Date.parse(r.datum) + DAY / 2), c = col(PRIO[r.prio][0]);
      if (r.prio === 'A') svg('path', { d: 'M' + x + ',16 l6,6 -6,6 -6,-6 z', fill: c, stroke: col('card'), 'stroke-width': 1.5 }, sv);
      else svg('circle', { cx: x, cy: 22, r: 5, fill: c, stroke: col('card'), 'stroke-width': 1.5 }, sv);
    });
    const T1 = tip(box), ov = svg('rect', { x: 0, y: 0, width: w, height: h, fill: 'transparent' }, sv);
    const mv = (ev) => {
      const bb = sv.getBoundingClientRect(), k = w / bb.width, t = xs.invert((ev.clientX - bb.left) * k), d = iso(t);
      const p = P0.find((x) => x.von <= d && x.bis >= d); if (!p) { T1.hide(); return; }
      const rr = (s.liste || []).filter((r) => r.in_tagen >= 0 && Math.abs(Date.parse(r.datum) - t) < 4 * DAY);
      T1.show(xs(t) / k, 20 / k, p.name, [{ label: 'Zeitraum', value: de(p.von) + '–' + de(p.bis), color: col(PH_FARBE[p.id]) }, { label: 'Dauer', value: p.tage >= 14 ? Math.round(p.tage / 7) + ' Wochen' : tageTxt(p.tage) }].concat(rr.map((r) => ({ label: 'Rennen (' + r.prio + ')', value: r.name + ', ' + r.datum_txt, color: col(PRIO[r.prio][0]) }))));
    };
    ov.addEventListener('pointermove', mv); ov.addEventListener('pointerdown', mv); ov.addEventListener('pointerleave', () => T1.hide());
  }
  function szFahrplan(grid, s) {
    const c = karte({ farbe: 'blue', icon: 'i-flame', titel: 'Fahrplan Fitness', sub: 'Deine Fitness (CTL) bis zum Renntag – Prognose aus den Steigerungen je Phase', span2: true });
    grid.appendChild(c);
    const kvb = el('div', { class: 'tf-kv tf-kv-sz' }); c.appendChild(kvb);
    kv(kvb, [
      ['Fitness heute', String(s.ctl), 'CTL'],
      ['Am Renntag', String(s.ctl_prognose), 'CTL', { c: 'blue', label: 'Prognose' }],
      ['Steigerung jetzt', (s.rampe_lo >= 0 ? '+' : '−') + Math.abs(s.rampe_lo) + '–' + Math.abs(s.rampe_hi), 'CTL/Woche', { c: 'gray', label: s.phase_txt }],
      ['Tapering ab', de(s.taper_ab), '', { c: 'teal', label: s.taper_tage + ' Tage vorher' }],
      ['Form am Renntag', '+' + s.tsb_ziel_lo + '–' + s.tsb_ziel_hi, 'TSB', { c: 'green', label: 'frisch, aber fit' }],
      ['Bis zum Tapering', nf(s.wochen_bis_taper, 0), s.wochen_bis_taper === 1 ? 'Woche' : 'Wochen'],
    ]);
    const box = el('div', { class: 'tf-chart', style: 'min-height:220px' }); c.appendChild(box);
    const PM = rowsOf('pmc') || [], H = heute(), proj = s.projektion || [];
    if (!proj.length) return;
    const from = iso(Date.parse(s.heute) - 120 * DAY), hist = PM.filter((r) => r.date >= from && r.date <= (H ? H.date : s.heute));
    const top = Math.max(20, ...proj.map((p) => p.hi), ...hist.map((r) => r.ctl)) * 1.08;
    const P = plot(box, { h: 220, y: [0, top], ny: 4, x: [toDay(from), toDay(s.ziel_datum)], label: 'CTL-Fahrplan' }), xf = (r) => toDay(r.date);
    const tx = P.xs(toDay(s.taper_ab)), rx = P.xs(toDay(s.ziel_datum));
    svg('rect', { x: tx, y: P.top, width: Math.max(0, rx - tx), height: P.xb - P.top, fill: col('teal'), opacity: 0.08 }, P.g);
    band(P, proj, xf, (p) => p.lo, (p) => p.hi, col('blue'), 0.12);
    line(P, hist, xf, (r) => r.ctl, col('blue'), 2.4);
    line(P, proj, xf, (p) => p.ctl, col('blue'), 2, '6 5');
    const hx = P.xs(toDay(s.heute)); svg('line', { x1: hx, x2: hx, y1: P.top, y2: P.xb, stroke: col('fg3'), 'stroke-width': 1.2, 'stroke-dasharray': '2 3' }, P.g);
    const last = proj[proj.length - 1]; endDot(P, xf(last), last.ctl, col('pink'));
    const pts = hist.map((r) => ({ date: r.date, ctl: r.ctl, art: 'ist' })).concat(proj.slice(1).map((p) => Object.assign({ art: 'plan' }, p)));
    hoverTime(box, P, pts, xf, (p) => fmtDay(xf(p)) + (p.art === 'plan' ? ' · Prognose' : ''), (p) => (p.art === 'plan' ? [{ label: 'CTL (Mitte)', value: nf(p.ctl), color: col('blue') }, { label: 'Spanne', value: nf(p.lo) + '–' + nf(p.hi) }] : [{ label: 'CTL', value: nf(p.ctl), color: col('blue') }]), [{ y: (p) => p.ctl, color: col('blue') }]);
    const lg = el('div', { class: 'tf-legend' }), i1 = el('i', { class: 'tf-line' }), i2 = el('i', { class: 'tf-dash' }), i3 = el('i', { class: 'tf-band' }), i4 = el('i', { class: 'tf-band' });
    i1.style.background = col('blue'); i2.style.borderColor = col('blue'); i3.style.background = col('blue'); i4.style.background = col('teal');
    lg.append(el('span', null, i1, 'bisher'), el('span', null, i2, 'Prognose'), el('span', null, i3, 'Spanne'), el('span', null, i4, 'Tapering'));
    box.appendChild(lg);
    c.appendChild(el('p', { class: 'tf-note', text: 'Die Prognose nimmt je Phase eine Steigerung der CTL an (Grundlage +3 bis +5, Aufbau +4 bis +7 pro Woche) und rund 10 % Abfall im Tapering. Steigt deine CTL schneller als +7 pro Woche, wächst das Verletzungsrisiko.' }));
  }
  function szEmpfehlung(grid, s) {
    const c = karte({ farbe: PH_FARBE[s.phase] || 'gray', icon: 'i-target', titel: 'Was jetzt zählt', sub: s.phase_txt ? s.phase_txt + (PH_TEXT[s.phase] ? ' – ' + PH_TEXT[s.phase] : '') : '' });
    const ul = el('div', { class: 'tf-sz-tipps' });
    (s.empfehlungen || []).forEach((e) => ul.appendChild(el('div', { class: 'tf-tipp' }, el('b', { text: e.titel }), el('p', { text: e.text }))));
    c.appendChild(ul);
    if (gewaehlteSporte().includes('gym') && ['vorbereitung', 'grundlage', 'aufbau', 'spitze', 'taper'].includes(s.phase)) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'padding-left:0' }, ico('i-dumbbell'), ' Krafttraining passend zur Phase');
      b.addEventListener('click', () => T.zeige('gym')); c.appendChild(b);
    }
    grid.appendChild(c);
    if (s.zwischen && s.zwischen.length) {
      const z = karte({ farbe: 'orange', icon: 'i-flag', titel: 'Rennen davor', sub: 'B- und C-Rennen bis zum Hauptziel' });
      s.zwischen.forEach((r) => z.appendChild(el('div', { class: 'tf-sz-zw' }, prioBadge(r.prio), el('div', null, el('b', { text: r.name }), el('small', { text: r.art + ' · ' + r.datum_txt + ' · in ' + tageTxt(r.in_tagen) }), el('p', { text: r.hinweis })))));
      grid.appendChild(z);
    }
  }
  // Zielzeit: "36:30" ist bei 10 km min:s, bei der Langdistanz h:min – genommen wird die Lesart, die zur erwarteten Renndauer passt
  const grobH = (sp, di) => { const it = tfDistanz(sp, di); return it ? it.legs.reduce((x, l) => x + (l.typ === 'bike' ? l.km / 32 : l.typ === 'run' ? l.km / 12 : l.typ === 'swim' ? l.km / 3.3 : (l.s || 0) / 3600), 0) : 2; };
  function zielZeit(txt, sp, di) {
    if (String(txt).trim().replace(/[.,;]/g, ':').split(':').length !== 2) return parseTime(txt, 'hm');
    const a = parseTime(txt, 'hm'), b = parseTime(txt, 'ms'), e = grobH(sp, di) * 3600;
    if (!(a > 0) || !(b > 0)) return a || b;
    return Math.abs(Math.log(a / e)) <= Math.abs(Math.log(b / e)) ? a : b;
  }
  function neuesRennen() { const S = gewaehlteSporte(), sp = S.includes('schwimmen') && S.includes('rad') && S.includes('laufen') ? 'tri' : S.includes('laufen') ? 'lauf' : S.includes('rad') ? 'rad' : 'schwimmen'; return { id: null, name: '', datum: '', sport: sp, distanz: Object.keys(TF_DISTANZEN[sp].items)[sp === 'tri' ? 3 : 1], prio: 'A', ziel_s: null, notiz: '' }; }
  function szRennen(grid, s) {
    const neu = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, ico('i-plus'), ' Neu');
    const c = karte({ farbe: 'pink', icon: 'i-cal', titel: 'Deine Rennen', sub: 'A = Saisonhöhepunkt · B = wichtiger Test · C = Trainingsrennen', span2: true, kpi: el('div', { class: 'tf-kpi' }, neu), id: 'karte-rennliste' });
    neu.addEventListener('click', () => { SZ.form = neuesRennen(); SZ.loeschen = null; renderSaison(); requestAnimationFrame(() => { const f = $('#sz-name'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.focus({ preventScroll: true }); } }); });
    grid.appendChild(c);
    if (SZ.form) c.appendChild(szForm(SZ.form));
    const L = s.liste || [], kommend = L.filter((r) => r.in_tagen >= 0), vorbei = L.filter((r) => r.in_tagen < 0).reverse().slice(0, 4);
    if (!L.length && !SZ.form) { c.appendChild(el('p', { class: 'tf-empty', text: 'Noch keine Rennen eingetragen.' })); return; }
    const list = el('div', { class: 'tf-sz-liste' });
    const zeile = (r, alt) => {
      const rech = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', title: 'Im Rennrechner öffnen' }, ico('i-gauge'), el('span', { class: 'tf-hide-s', text: ' Rechner' }));
      rech.addEventListener('click', () => T.rrWahl(r.sport, r.distanz, r.ziel_s));
      const bea = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', title: 'Bearbeiten' }, ico('i-edit'), el('span', { class: 'tf-hide-s', text: ' Bearbeiten' }));
      bea.addEventListener('click', () => { const w = (A().raw('wettkaempfe') || []).find((x) => x.id === r.id) || r; SZ.form = Object.assign({}, w); SZ.loeschen = null; renderSaison(); requestAnimationFrame(() => { const f = $('#sz-name'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });
      const wann = r.in_tagen === 0 ? 'heute' : r.in_tagen > 0 ? 'in ' + tageTxt(r.in_tagen) : 'vor ' + tageTxt(-r.in_tagen);
      return el('div', { class: 'tf-sz-rennen' + (alt ? ' tf-sz-alt' : '') }, prioBadge(r.prio), el('div', { class: 'tf-sz-r-t' }, el('b', { text: r.name }), el('small', { text: r.art + ' · ' + wtag(r.datum) + ', ' + r.datum_txt + (r.ziel_s ? ' · Ziel ' + zielTxt(r.ziel_s) : '') }), r.notiz ? el('small', { class: 'tf-sz-notiz', text: r.notiz }) : null), el('span', { class: 'tf-sz-wann', text: wann }), el('div', { class: 'tf-sz-akt' }, tfDistanz(r.sport, r.distanz) ? rech : null, bea));
    };
    kommend.forEach((r) => list.appendChild(zeile(r, false)));
    if (vorbei.length) { list.appendChild(el('div', { class: 'tf-ctrl-l tf-sz-vorbei', text: 'Vorbei' })); vorbei.forEach((r) => list.appendChild(zeile(r, true))); }
    c.appendChild(list);
  }
  function szForm(st) {
    const f = el('form', { class: 'tf-form tf-sz-form', autocomplete: 'off', novalidate: true }), msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const name = el('input', { class: 'tf-input', id: 'sz-name', maxlength: 60, placeholder: 'z. B. Ironman Frankfurt', value: st.name || '' });
    const datum = el('input', { class: 'tf-input', id: 'sz-datum', type: 'date', value: st.datum || '', min: iso(Date.now() - 365 * DAY), max: iso(Date.now() + 3 * 365 * DAY) });
    name.addEventListener('input', () => { st.name = name.value; });
    datum.addEventListener('input', () => { st.datum = datum.value; });
    const sport = el('div', { class: 'tf-sportwahl tf-sportwahl-klein', role: 'group', 'aria-label': 'Sportart' }), dist = el('div', { class: 'tf-chipset', role: 'group', 'aria-label': 'Distanz' }), prio = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Priorität' }), prioTxt = el('small', { class: 'tf-ich-hint' });
    const zeichne = () => {
      sport.replaceChildren();
      Object.keys(TF_DISTANZEN).forEach((k) => { const b = el('button', { type: 'button', 'aria-pressed': String(k === st.sport) }, ico(SPORT_ICON[k]), el('span', { text: SPORT_NAME[k] })); b.style.setProperty('--c', 'var(--tf-' + { tri: 'pink', lauf: 'mint', rad: 'orange', schwimmen: 'blue', mehr: 'purple' }[k] + ')'); b.addEventListener('click', () => { if (st.sport === k) return; st.sport = k; st.distanz = Object.keys(TF_DISTANZEN[k].items)[0]; zeichne(); }); sport.appendChild(b); });
      dist.replaceChildren();
      Object.entries(TF_DISTANZEN[st.sport].items).forEach(([id, it]) => { const b = el('button', { type: 'button', 'aria-pressed': String(id === st.distanz), title: it.lang }, it.name); b.addEventListener('click', () => { st.distanz = id; zeichne(); }); dist.appendChild(b); });
      segButtons(prio, [['A', 'A'], ['B', 'B'], ['C', 'C']], st.prio, (v) => { st.prio = v; zeichne(); });
      prioTxt.textContent = PRIO[st.prio][1];
    };
    zeichne();
    const ziel = el('input', { class: 'tf-input', id: 'sz-ziel', inputmode: 'numeric', placeholder: 'optional, h:mm:ss', value: st.ziel_s ? hms(st.ziel_s) : '' });
    ziel.addEventListener('input', () => { st.ziel_txt = ziel.value; });
    const notiz = el('input', { class: 'tf-input', id: 'sz-notiz', maxlength: 300, placeholder: 'optional', value: st.notiz || '' });
    notiz.addEventListener('input', () => { st.notiz = notiz.value; });
    const speichern = el('button', { type: 'submit', class: 'tf-btn tf-btn-primary' }, 'Speichern'), abbr = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    abbr.addEventListener('click', () => { SZ.form = null; SZ.loeschen = null; renderSaison(); });
    const act = el('div', { class: 'tf-form-actions' }, speichern, abbr);
    if (st.id) {
      const weg = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-danger' }, SZ.loeschen === st.id ? 'Wirklich löschen?' : 'Löschen');
      weg.addEventListener('click', async () => {
        if (SZ.loeschen !== st.id) { SZ.loeschen = st.id; weg.textContent = 'Wirklich löschen?'; return; }
        weg.disabled = true;
        try { await A().api('DELETE', '/api/wettkampf?id=' + encodeURIComponent(st.id)); SZ.form = null; SZ.loeschen = null; A().patch('wettkaempfe', (A().raw('wettkaempfe') || []).filter((w) => w.id !== st.id)); A().toast('Rennen gelöscht'); }
        catch (e) { setMsg(msg, e.message, true); weg.disabled = false; }
      });
      act.appendChild(weg);
    }
    f.append(el('h3', { class: 'tf-h3', style: 'margin-top:0', text: st.id ? 'Rennen bearbeiten' : 'Neues Rennen' }),
      el('div', { class: 'tf-sz-f2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Name' }), name), el('label', { class: 'tf-field' }, el('span', { text: 'Datum' }), datum)),
      el('div', { class: 'tf-field' }, el('span', { text: 'Sportart' }), sport), el('div', { class: 'tf-field' }, el('span', { text: 'Distanz' }), dist),
      el('div', { class: 'tf-field' }, el('span', { text: 'Priorität' }), prio, prioTxt),
      el('div', { class: 'tf-sz-f2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Zielzeit' }), ziel), el('label', { class: 'tf-field' }, el('span', { text: 'Notiz' }), notiz)),
      act, msg);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const zt = ziel.value.trim(), zs = zt ? zielZeit(zt, st.sport, st.distanz) : null;
      if (!name.value.trim()) { setMsg(msg, 'Bitte einen Namen eingeben.', true); name.focus(); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datum.value)) { setMsg(msg, 'Bitte ein Datum wählen.', true); datum.focus(); return; }
      if (zt && !zs) { setMsg(msg, 'Zielzeit bitte als h:mm:ss eingeben, zum Beispiel 1:25:00.', true); ziel.focus(); return; }
      speichern.disabled = true; setMsg(msg, 'Speichert …');
      try {
        const j = await A().api('POST', '/api/wettkampf', { id: st.id || undefined, name: name.value.trim(), datum: datum.value, sport: st.sport, distanz: st.distanz, prio: st.prio, ziel_s: zs, notiz: notiz.value.trim() });
        const W = (A().raw('wettkaempfe') || []).filter((w) => w.id !== j.row.id).concat([j.row]).sort((x, y) => (x.datum < y.datum ? -1 : 1));
        SZ.form = null; SZ.loeschen = null; A().patch('wettkaempfe', W); A().toast(st.id ? 'Rennen gespeichert' : 'Rennen eingetragen');
      } catch (e) { setMsg(msg, e.message, true); speichern.disabled = false; }
    });
    return f;
  }

  /* =====================================================================
     WERKZEUGE: W/kg, CdA und TT-Setups, NP/IF/TSS für Rennen
     ===================================================================== */
  const WZ = { st: null };
  function wz() { if (!WZ.st) WZ.st = Object.assign({ wkg_w: null, wkg_kg: null, wkg_tab: null, cda_km: 180, cda_hm: 0, cda_w: null, cda_temp: 20, cda_hoehe: 400, setups: null, test_w: 250, test_kmh: 38, tss_key: null, tss: {} }, speicher('tf:werkzeuge', {})); return WZ.st; }
  function wzSave() { merke('tf:werkzeuge', WZ.st); }
  const STUFEN = { m: [2.23, 2.79, 3.93, 5.05], w: [1.9, 2.36, 3.33, 4.3] }, STUFEN_NAME = ['Untrainiert', 'Ausreichend', 'Gut', 'Sehr gut', 'Herausragend'], STUFEN_FARBE = ['gray', 'yellow', 'teal', 'blue', 'purple'];
  function renderWerkzeuge() {
    const box = $('#werkzeuge-box'), a = athlet(); if (!box || !a) return;
    box.replaceChildren();
    const nav = el('div', { class: 'tf-chipset tf-wz-nav' });
    [['wz-wkg', 'W/kg'], ['wz-cda', 'CdA & Setups'], ['wz-tss', 'TSS-Planer']].forEach(([id, t]) => { const b = el('button', { type: 'button' }, t); b.addEventListener('click', () => { const k = $('#' + id); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); nav.appendChild(b); });
    box.appendChild(nav);
    const grid = el('div', { class: 'tf-grid' }); box.appendChild(grid);
    wzWkg(grid, a); wzCda(grid, a); wzTss(grid, a);
  }
  function wzWkg(grid, a) {
    const st = wz(), c = karte({ id: 'wz-wkg', farbe: 'orange', icon: 'i-bolt', titel: 'Watt pro Kilo', sub: 'Leistung im Verhältnis zum Gewicht – entscheidend am Berg', span2: true });
    grid.appendChild(c);
    const W = st.wkg_w || a.ftp_ref_w, KG = st.wkg_kg || a.gewicht_ref_kg, tab = st.wkg_tab || (a.geschlecht === 'w' ? 'w' : 'm');
    const ftp = rowsOf('ftp') || [], best20 = ((rowsOf('leistung') || []).find((r) => r.sek === 1200) || {}).watt;
    const ein = el('div', { class: 'tf-wz-ein' });
    ein.append(zahlFeld('Leistung', { value: W, min: 30, max: 2500, unit: 'W', onChange: (v) => { st.wkg_w = v; wzSave(); renderWerkzeuge(); } }), zahlFeld('Gewicht', { value: KG, min: 30, max: 200, step: 0.1, unit: 'kg', onChange: (v) => { st.wkg_kg = Math.abs(v - a.gewicht_ref_kg) < 0.05 ? null : v; wzSave(); renderWerkzeuge(); } }));
    const vorl = el('div', { class: 'tf-chipset' });
    [['FTP Referenz', a.ftp_ref_w], ['FTP aus Daten', (ftp.find((f) => f.id === 'p20') || {}).watt], ['20 min Bestwert', best20], ['FTP genannt', a.ftp_genannt_w]].filter(([, v]) => v).forEach(([l, v]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === W) }, l + ' ' + v + ' W'); b.addEventListener('click', () => { st.wkg_w = v === a.ftp_ref_w ? null : v; wzSave(); renderWerkzeuge(); }); vorl.appendChild(b); });
    const tabSeg = el('div', { class: 'tf-seg' }); segButtons(tabSeg, [['m', 'Männer'], ['w', 'Frauen']], tab, (v) => { st.wkg_tab = v; wzSave(); renderWerkzeuge(); });
    ein.append(el('div', { class: 'tf-field tf-wz-voll' }, el('span', { text: 'Schnell wählen' }), vorl), el('div', { class: 'tf-field tf-wz-voll' }, el('span', { text: 'Vergleichstabelle' }), tabSeg));
    const wkg = W / KG, S = STUFEN[tab], stufe = S.filter((x) => wkg >= x).length;
    const aus = el('div', { class: 'tf-wz-aus' });
    aus.append(el('div', { class: 'tf-wz-gross' }, el('span', { class: 'num', text: nf(wkg, 2) }), el('span', { class: 'tf-u', text: 'W/kg' }), el('span', { class: 'tf-pill' }, dot(STUFEN_FARBE[stufe]), STUFEN_NAME[stufe])));
    const sk = el('div', { class: 'tf-wz-skala tf-chart' }); aus.appendChild(sk);
    const abw = Math.abs(KG - a.gewicht_ref_kg) >= 0.05;
    aus.appendChild(el('p', { class: abw ? 'tf-korr-warn' : 'tf-note', text: abw ? 'Achtung: ' + nf(KG, 1) + ' kg weichen von deinem Referenzgewicht (' + nf(a.gewicht_ref_kg, 1) + ' kg) ab. Vergleiche W/kg nur mit derselben Gewichtsbasis – sonst mischst du zwei Rechnungen.' : 'Mit deinem Referenzgewicht von ' + nf(a.gewicht_ref_kg, 1) + ' kg – derselben Basis wie alle W/kg-Werte der App.' }));
    const kvb = el('div', { class: 'tf-kv' }); aus.appendChild(kvb);
    kv(kvb, [['1 kg weniger', '+' + nf(W / (KG - 1) - wkg, 3), 'W/kg', { c: 'gray', label: 'so viel wie +' + nf(W / KG, 1) + ' W' }], ['W/CdA', nf(W / a.cda_m2), 'W/m²', { c: 'gray', label: 'zählt im Flachen (CdA ' + nf(a.cda_m2, 3) + ')' }], ['Nächste Stufe', stufe < 4 ? nf(S[stufe] * KG - W) : '–', stufe < 4 ? 'W mehr' : '', { c: STUFEN_FARBE[Math.min(4, stufe + 1)], label: stufe < 4 ? STUFEN_NAME[stufe + 1] + ' ab ' + nf(S[stufe], 2) + ' W/kg' : 'höchste Stufe' }]]);
    c.appendChild(el('div', { class: 'tf-wz-body' }, ein, aus));
    // Bestwerte als W/kg
    const L = (rowsOf('leistung') || []).filter((r) => [5, 60, 300, 1200, 3600].includes(r.sek));
    if (L.length) {
      const t = el('div', { class: 'tf-wz-best' });
      L.forEach((r) => t.appendChild(el('div', null, el('small', { text: r.dauer }), el('b', { class: 'num', text: nf(r.watt / a.gewicht_ref_kg, 2) }), el('span', { text: r.watt + ' W' }))));
      c.append(el('div', { class: 'tf-ctrl-l', style: 'margin-top:16px', text: 'Deine Bestwerte (12 Monate) in W/kg bei ' + nf(a.gewicht_ref_kg, 1) + ' kg' }), t);
    }
    c.appendChild(el('p', { class: 'tf-quelle tf-note', text: 'Stufen für die FTP nach Allen & Coggan, Training and Racing with a Power Meter (2010), wie in Garmin-Geräten. Auf flachen Strecken – etwa der Langdistanz – zählen Watt pro CdA mehr als Watt pro Kilo.' }));
    requestAnimationFrame(() => wkgSkala(sk, wkg, S));
  }
  function wkgSkala(box, wkg, S) {
    clear(box);
    const w = Math.max(260, box.clientWidth || 320), h = 50, lo = 1, hi = Math.max(S[3] + 1, wkg + 0.4), xs = d3.scaleLinear().domain([lo, hi]).range([4, w - 4]).clamp(true);
    const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'Einordnung ' + nf(wkg, 2) + ' W/kg' }, box);
    const grenzen = [lo].concat(S).concat([hi]);
    grenzen.slice(0, -1).forEach((g0, i) => { const x0 = xs(g0), x1 = xs(grenzen[i + 1]); svg('rect', { x: x0 + 1, y: 12, width: Math.max(1, x1 - x0 - 2), height: 10, rx: 4, fill: col(STUFEN_FARBE[i]), opacity: 0.55 }, s); });
    S.forEach((g) => { const t = svg('text', { x: xs(g), y: 40, 'text-anchor': 'middle', class: 'tf-tick' }, s); t.textContent = nf(g, 2); });
    const x = xs(wkg); svg('path', { d: 'M' + x + ',24 l6,8 h-12 z', fill: col('fg') }, s); svg('line', { x1: x, x2: x, y1: 6, y2: 26, stroke: col('fg'), 'stroke-width': 2.5, 'stroke-linecap': 'round' }, s);
  }
  // Luftdichte trockener Luft aus Temperatur und Höhe (internationale Standardatmosphäre)
  const rhoAus = (temp, hoehe) => (101325 * Math.pow(1 - 2.25577e-5 * hoehe, 5.25588)) / (287.05 * (temp + 273.15));
  function wzCda(grid, a) {
    const st = wz(), c = karte({ id: 'wz-cda', farbe: 'blue', icon: 'i-wave', titel: 'CdA & Zeitfahr-Setups', sub: 'Was Position, Helm und Anzug an Zeit und Watt bringen – gleiche Leistung, gleiche Strecke', span2: true });
    grid.appendChild(c);
    const W = st.cda_w || Math.round(a.ftp_ref_w * (a.rad_if_min + a.rad_if_max) / 2), rho = rhoAus(st.cda_temp, st.cda_hoehe), m = a.gewicht_ref_kg + a.rad_kg;
    if (!st.setups) st.setups = [{ n: 'Aktuell', cda: a.cda_m2 }, { n: 'Aero-Helm', cda: Math.round((a.cda_m2 - 0.012) * 1000) / 1000 }, { n: 'Tiefer und enger', cda: Math.round((a.cda_m2 - 0.025) * 1000) / 1000 }];
    const ein = el('div', { class: 'tf-wz-ein tf-wz-ein3' });
    const neu = () => { wzSave(); renderWerkzeuge(); requestAnimationFrame(() => { const k = $('#wz-cda'); if (k && k.getBoundingClientRect().top < 0) k.scrollIntoView({ block: 'start' }); }); };
    ein.append(
      zahlFeld('Strecke', { value: st.cda_km, min: 1, max: 400, step: 1, unit: 'km', onChange: (v) => { st.cda_km = v; neu(); } }),
      zahlFeld('Höhenmeter', { value: st.cda_hm, min: 0, max: 5000, step: 50, unit: 'm', onChange: (v) => { st.cda_hm = v; neu(); } }),
      zahlFeld('Leistung', { value: W, min: 50, max: 600, unit: 'W', onChange: (v) => { st.cda_w = v; neu(); } }),
      zahlFeld('Temperatur', { value: st.cda_temp, min: -10, max: 45, unit: '°C', onChange: (v) => { st.cda_temp = v; neu(); } }),
      zahlFeld('Höhe über NN', { value: st.cda_hoehe, min: 0, max: 3000, step: 50, unit: 'm', onChange: (v) => { st.cda_hoehe = v; neu(); } }),
      el('div', { class: 'tf-field' }, el('span', { text: 'Luftdichte' }), el('b', { class: 'tf-wz-wert', text: nf(rho, 3) + ' kg/m³' }), el('small', { class: 'tf-ich-hint', text: 'Systemgewicht ' + nf(m, 1) + ' kg · Crr ' + nf(a.crr, 4) })));
    c.appendChild(ein);
    // Setups mit Ergebnis
    const { rrBike } = T.rr(), base = { hm: st.cda_hm, pacing: 'gleich' }, ph = (cda) => ({ cda, crr: a.crr, m, rho, eta: a.antrieb_eta });
    const zeitFuer = (P, cda) => rrBike(P, base, ph(cda), st.cda_km).t;
    const wattFuer = (t, cda) => { let lo = 30, hi = 1200; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (zeitFuer(mid, cda) > t) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    const t0 = zeitFuer(W, st.setups[0].cda);
    const tab = el('div', { class: 'tf-wz-setups' });
    tab.appendChild(el('div', { class: 'tf-wz-s tf-wz-sh' }, el('span', { text: 'Setup' }), el('span', { text: 'CdA m²' }), el('span', { class: 'r', text: 'Tempo' }), el('span', { class: 'r', text: 'Zeit' }), el('span', { class: 'r', text: 'Vorteil' }), el('span')));
    st.setups.forEach((u, i) => {
      const t = zeitFuer(W, u.cda), dt = t - t0, wEq = wattFuer(t, st.setups[0].cda) - W; // so viele Watt bräuchte Setup 1 für dieselbe Zeit mehr
      const nm = el('input', { class: 'tf-input', value: u.n, maxlength: 24, 'aria-label': 'Name des Setups' }), cd = el('input', { class: 'tf-input', type: 'number', step: 0.005, min: 0.15, max: 0.5, value: u.cda, inputmode: 'decimal', 'aria-label': 'CdA' });
      nm.addEventListener('change', () => { u.n = nm.value.trim() || 'Setup ' + (i + 1); wzSave(); });
      cd.addEventListener('change', () => { const v = parseFloat(String(cd.value).replace(',', '.')); if (!(v >= 0.15 && v <= 0.5)) { cd.value = u.cda; return; } u.cda = Math.round(v * 1000) / 1000; neu(); });
      const x = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-wz-x', 'aria-label': 'Setup entfernen', disabled: st.setups.length <= 1 }, ico('i-x'));
      x.addEventListener('click', () => { st.setups.splice(i, 1); neu(); });
      tab.appendChild(el('div', { class: 'tf-wz-s' + (i === 0 ? ' tf-wz-s0' : '') }, nm, cd, el('span', { class: 'r num', text: nf((st.cda_km / t) * 3600, 1) + ' km/h' }), el('span', { class: 'r num', text: hms(t) }), el('span', { class: 'r tf-wz-vorteil' }, i === 0 ? el('small', { text: 'Bezug' }) : el('b', { text: (dt <= 0 ? '−' : '+') + kurz(Math.abs(dt)), style: 'color:var(--tf-' + (dt <= 0 ? 'green' : 'red') + ')' }), i === 0 ? null : el('small', { text: 'wie ' + (wEq >= 0 ? '+' : '−') + nf(Math.abs(wEq)) + ' W' })), x));
    });
    c.appendChild(tab);
    if (st.setups.length < 5) { const add = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'padding-left:0' }, ico('i-plus'), ' Setup hinzufügen'); add.addEventListener('click', () => { st.setups.push({ n: 'Setup ' + (st.setups.length + 1), cda: st.setups[st.setups.length - 1].cda }); neu(); }); c.appendChild(add); }
    // Empfindlichkeit
    const c1 = st.setups[0].cda, gain = zeitFuer(W, c1) - zeitFuer(W, c1 - 0.01), wGain = wattFuer(zeitFuer(W, c1 - 0.01), c1) - W;
    c.appendChild(el('p', { class: 'tf-korr-text', style: 'margin-top:10px', text: 'Bei ' + W + ' W über ' + nf(st.cda_km) + ' km spart jede 0,01 m² weniger CdA rund ' + kurz(gain) + ' min – so viel, wie ' + nf(Math.abs(wGain)) + ' W mehr Leistung bringen würden.' }));
    // Pacing für eine Zielzeit: Watt je Setup und der CdA, den der eigene Korridor verlangt
    const zielT = st.cda_ziel || (Math.abs(st.cda_km - 180) < 0.5 ? a.ziel_rad_min * 60 : Math.round(zeitFuer(W, c1) / 60) * 60), ftp = a.ftp_ref_w, pMax = Math.round(ftp * a.rad_if_max);
    const cdaFuer = (t, P) => { let lo = 0.12, hi = 0.6; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (zeitFuer(P, mid) > t) hi = mid; else lo = mid; } return (lo + hi) / 2; };
    const pz = el('div', { class: 'tf-wz-pacing' });
    pz.append(el('div', { class: 'tf-wz-ein' }, el('label', { class: 'tf-field' }, el('span', { text: 'Zielzeit Rad' }), zeitInput(hms(zielT), 'hm', '', (v) => { st.cda_ziel = v; neu(); })), el('div', { class: 'tf-field' }, el('span', { text: 'Dein Korridor' }), el('b', { class: 'tf-wz-wert', text: Math.round(100 * a.rad_if_min) + '–' + Math.round(100 * a.rad_if_max) + ' % FTP' }), el('small', { class: 'tf-ich-hint', text: 'bis ' + pMax + ' W bei FTP ' + ftp + ' W' }))));
    const kvp = el('div', { class: 'tf-kv' }); pz.appendChild(kvp);
    const lage = (q) => (q > a.rad_if_max + 0.03 ? 'red' : q > a.rad_if_max + 0.005 ? 'orange' : q < a.rad_if_min - 0.005 ? 'gray' : 'green');
    kv(kvp, st.setups.slice(0, 6).map((u) => { const p = wattFuer(zielT, u.cda), q = p / ftp; return [u.n, nf(p), 'W', { c: lage(q), label: Math.round(100 * q) + ' % FTP' }]; }));
    const noetig = cdaFuer(zielT, pMax), p1 = wattFuer(zielT, c1), q1 = p1 / ftp, n1 = '„' + st.setups[0].n + '“';
    pz.appendChild(el('p', { class: q1 > a.rad_if_max + 0.005 ? 'tf-korr-warn' : 'tf-note', text: q1 > a.rad_if_max + 0.005
      ? 'Für ' + hmin(zielT) + ' h brauchst du mit ' + n1 + ' ' + nf(p1) + ' W – ' + Math.round(100 * q1) + ' % deiner FTP, über deinem Korridor. Der Luftwiderstand wächst mit der dritten Potenz des Tempos: Mit höchstens ' + pMax + ' W schaffst du die Zeit erst ab CdA ' + nf(noetig, 3) + ' m²' + (noetig < c1 ? ' – also ' + nf(c1 - noetig, 3) + ' m² weniger als jetzt.' : '.')
      : q1 < a.rad_if_min - 0.005 ? 'Mit ' + n1 + ' reichen ' + nf(p1) + ' W (' + Math.round(100 * q1) + ' % FTP) für ' + hmin(zielT) + ' h – weniger, als dein Korridor vorsieht. Mit ' + Math.round(100 * a.rad_if_min) + '–' + Math.round(100 * a.rad_if_max) + ' % wärst du schneller.'
      : 'Mit ' + n1 + ' reichen ' + nf(p1) + ' W (' + Math.round(100 * q1) + ' % FTP) für ' + hmin(zielT) + ' h – das passt in deinen Korridor.' }));
    const ch = el('div', { class: 'tf-chart', style: 'min-height:200px' }); c.appendChild(ch);
    c.append(el('h3', { class: 'tf-h3', text: 'Watt für eine Zielzeit' }), pz);
    requestAnimationFrame(() => {
      const xs0 = 0.18, xs1 = 0.42, pts = []; for (let x = xs0; x <= xs1 + 1e-9; x += 0.01) pts.push({ cda: +x.toFixed(2), t: zeitFuer(W, x) / 60 });
      const ys = pts.map((p) => p.t), P = plot(ch, { h: 200, y: [Math.floor(Math.min(...ys) * 0.98), Math.ceil(Math.max(...ys) * 1.02)], ny: 4, yfmt: (t) => (st.cda_km >= 60 ? hmin(t * 60) : Math.round(t) + ' min'), xlin: true, x: [xs0, xs1], xtv: [0.2, 0.25, 0.3, 0.35, 0.4], xfmt: (v) => nf(v, 2), label: 'Zeit je CdA' });
      line(P, pts, (p) => p.cda, (p) => p.t, col('blue'), 2.2);
      st.setups.forEach((u, i) => { const t = zeitFuer(W, u.cda) / 60; svg('circle', { cx: P.xs(u.cda), cy: P.ys(t), r: i === 0 ? 6 : 5, fill: col(i === 0 ? 'blue' : 'teal'), stroke: col('card'), 'stroke-width': 2 }, P.g); });
      hoverTime(ch, P, pts, (p) => p.cda, (p) => 'CdA ' + nf(p.cda, 2) + ' m²', (p) => [{ label: 'Zeit', value: hms(p.t * 60), color: col('blue') }, { label: 'Tempo', value: nf((st.cda_km / (p.t * 60)) * 3600, 1) + ' km/h' }], [{ y: (p) => p.t, color: col('blue') }]);
      ch.appendChild(el('div', { class: 'tf-caption', text: 'Zeit über die Strecke je CdA bei ' + W + ' W · Punkte: deine Setups · windstill, Höhenmeter als gleichmäßige Wellen (Martin et al. 1998).' }));
    });
    // CdA aus einer Testfahrt
    const tw = st.test_w, tv = st.test_kmh / 3.6, cdaTest = (a.antrieb_eta * tw - a.crr * m * 9.81 * tv) / (0.5 * rho * tv * tv * tv);
    const test = el('div', { class: 'tf-wz-test' });
    const ueb = el('button', { type: 'button', class: 'tf-btn', disabled: !(cdaTest > 0.15 && cdaTest < 0.6) }, 'Als Setup übernehmen');
    ueb.addEventListener('click', () => { st.setups.push({ n: 'Testfahrt', cda: Math.round(cdaTest * 1000) / 1000 }); if (st.setups.length > 5) st.setups.shift(); neu(); });
    test.append(el('h3', { class: 'tf-h3', style: 'margin-top:0', text: 'CdA aus einer Testfahrt' }), el('p', { class: 'tf-note', style: 'margin-top:2px', text: 'Flache Strecke, Windstille, konstante Leistung – am besten hin und zurück und beide Richtungen mitteln.' }),
      el('div', { class: 'tf-wz-ein' }, zahlFeld('Ø Leistung', { value: tw, min: 50, max: 600, unit: 'W', onChange: (v) => { st.test_w = v; neu(); } }), zahlFeld('Ø Tempo', { value: st.test_kmh, min: 15, max: 60, step: 0.1, unit: 'km/h', onChange: (v) => { st.test_kmh = v; neu(); } }),
        el('div', { class: 'tf-field' }, el('span', { text: 'Dein CdA' }), el('b', { class: 'tf-wz-wert num', text: cdaTest > 0 ? nf(cdaTest, 3) + ' m²' : '–' }), el('small', { class: 'tf-ich-hint', text: cdaTest > 0.6 || cdaTest < 0.15 ? 'unplausibel – Wind oder Gefälle?' : 'mit deinem Crr und Gewicht' }))),
      ueb);
    c.appendChild(test);
  }
  function wzTss(grid, a) {
    const st = wz(), sz = (rowsOf('saison') || [])[0], kommend = sz && sz.liste ? sz.liste.filter((r) => r.in_tagen >= 0 && tfDistanz(r.sport, r.distanz)) : [];
    const c = karte({ id: 'wz-tss', farbe: 'pink', icon: 'i-flag', titel: 'NP, IF und TSS fürs Rennen', sub: 'Wie stark ein geplantes Rennen dich belastet – und ob das Rad-Pacing den Lauf schützt', span2: true });
    grid.appendChild(c);
    let key = st.tss_key;
    const vorn = kommend.find((r) => r.prio === 'A') || kommend[0];
    if (!key || !tfDistanz(...key.split(':'))) key = vorn ? vorn.sport + ':' + vorn.distanz : 'tri:ld';
    const [sp, di] = key.split(':'), item = tfDistanz(sp, di);
    // Auswahl: geplante Rennen, sonst jede Distanz
    const wahl = el('div', { class: 'tf-chipset' });
    kommend.slice(0, 4).forEach((r) => { const k = r.sport + ':' + r.distanz, b = el('button', { type: 'button', 'aria-pressed': String(k === key) }, r.name); b.addEventListener('click', () => { st.tss_key = k; wzSave(); renderWerkzeuge(); }); wahl.appendChild(b); });
    const alle = el('select', { class: 'tf-input tf-wz-select', 'aria-label': 'Distanz wählen' });
    Object.entries(TF_DISTANZEN).forEach(([s0, S]) => { const og = el('optgroup', { label: S.name }); Object.entries(S.items).forEach(([d0, it]) => { const o = el('option', { value: s0 + ':' + d0, text: it.lang }); if (s0 + ':' + d0 === key) o.selected = true; og.appendChild(o); }); alle.appendChild(og); });
    alle.addEventListener('change', () => { st.tss_key = alle.value; wzSave(); renderWerkzeuge(); });
    c.appendChild(el('div', { class: 'tf-wz-ein' }, kommend.length ? el('div', { class: 'tf-field tf-wz-voll' }, el('span', { text: 'Deine Rennen' }), wahl) : null, el('label', { class: 'tf-field tf-wz-voll' }, el('span', { text: 'Distanz' }), alle)));
    // Abschnitte: gespeicherte Eingaben, sonst aus dem Rennrechner
    const vor = T.rrSplits(sp, di); if (!vor) return;
    const eig = st.tss[key] || {}, ftp = vor.ftp, css = a.css_s_100m, thr = a.vt2_pace_s_km;
    const legs = vor.legs.filter((l) => ['swim', 'bike', 'run'].includes(l.typ)).map((l, i) => Object.assign({}, l, eig[i] || {}, { i }));
    const reset = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'padding-left:0', disabled: !st.tss[key] }, ico('i-sync'), ' Aus dem Rennrechner übernehmen');
    reset.addEventListener('click', () => { delete st.tss[key]; wzSave(); renderWerkzeuge(); });
    const setLeg = (i, f, v) => { st.tss[key] = st.tss[key] || {}; st.tss[key][i] = Object.assign({}, st.tss[key][i] || {}, { [f]: v }); wzSave(); renderWerkzeuge(); requestAnimationFrame(() => { const k = $('#wz-tss'); if (k && k.getBoundingClientRect().top < 0) k.scrollIntoView({ block: 'start' }); }); };
    const tab = el('div', { class: 'tf-wz-tss' }); let summe = 0, stunden = 0, radTss = null, radIF = null;
    tab.appendChild(el('div', { class: 'tf-wz-t tf-wz-sh' }, el('span', { text: 'Abschnitt' }), el('span', { text: 'Zeit' }), el('span', { text: 'Intensität' }), el('span', { class: 'r', text: 'IF' }), el('span', { class: 'r', text: 'TSS' })));
    legs.forEach((l) => {
      const h = l.t / 3600; let IF, tss, inp, name, farbe;
      if (l.typ === 'swim') { IF = css / l.pace; tss = h * IF ** 3 * 100; name = 'Schwimmen'; farbe = 'blue'; inp = zeitInput(mmss(l.pace), 'ms', '/100 m', (v) => setLeg(l.i, 'pace', v)); }
      else if (l.typ === 'bike') { IF = l.np / ftp; tss = h * IF * IF * 100; name = 'Rad'; farbe = 'orange'; inp = zahlInput(Math.round(l.np), 'W NP', (v) => setLeg(l.i, 'np', v), 50, 700); radTss = tss; radIF = IF; }
      else { IF = thr / l.pace; tss = h * IF * IF * 100; name = legs.filter((x) => x.typ === 'run').length > 1 ? (l === legs.find((x) => x.typ === 'run') ? 'Lauf 1' : 'Lauf 2') : 'Laufen'; farbe = 'mint'; inp = zeitInput(mmss(l.pace), 'ms', '/km', (v) => setLeg(l.i, 'pace', v)); }
      summe += tss; stunden += h;
      const zeit = zeitInput(l.t < 3600 ? mmss(l.t) : hms(l.t), l.t < 3600 ? 'ms' : 'hm', '', (v) => setLeg(l.i, 't', v));
      const i0 = el('i'); i0.style.background = col(farbe);
      tab.appendChild(el('div', { class: 'tf-wz-t' }, el('span', { class: 'tf-wz-tn' }, i0, name), zeit, inp, el('span', { class: 'r num', text: nf(IF, 2) }), el('b', { class: 'r num', text: nf(tss) })));
    });
    c.appendChild(tab);
    c.appendChild(el('div', { class: 'tf-form-actions' }, reset, el('span', { class: 'tf-note', style: 'margin:0', text: st.tss[key] ? 'Eigene Werte' : vor.eigen ? 'Werte aus deinem Rennrechner' : 'Werte aus deinem Profil (Mitte des Rennbereichs)' })));
    // Einordnung
    const pm = rowsOf('pmc') || [], ctl = pm.length ? pm[pm.length - 1].ctl : null;
    const erh = summe < 150 ? ['green', 'gering', 'meist bis zum nächsten Tag erholt'] : summe < 300 ? ['yellow', 'mittel', 'Restmüdigkeit am nächsten Tag, nach 2 Tagen meist weg'] : summe < 450 ? ['orange', 'hoch', 'auch nach 2 Tagen noch Restmüdigkeit'] : ['red', 'sehr hoch', 'Erholung über mehrere Tage'];
    const items = [['Gesamt', nf(summe), 'TSS', { c: erh[0], label: erh[1] + ' – ' + erh[2] }], ['Dauer', hmin(stunden * 3600), 'h', { c: 'gray', label: 'ohne Wechsel' }]];
    if (ctl >= 5) items.push(['Bezug zur Fitness', nf(summe / ctl, 1), '× CTL', { c: 'gray', label: 'wie ' + Math.round(summe / ctl) + ' Trainingstage' }]);
    if (radIF != null) {
      const b = item.legs.find((l) => l.typ === 'bike'), band0 = b.band === 'profil' ? [a.rad_if_min, a.rad_if_max] : b.band, imBand = radIF >= band0[0] - 0.005 && radIF <= band0[1] + 0.005;
      items.push(['Rad IF', nf(radIF, 2), '', { c: imBand ? 'green' : radIF > band0[1] ? 'red' : 'gray', label: 'Korridor ' + nf(band0[0], 2) + '–' + nf(band0[1], 2) }]);
      if (sp === 'tri' && di === 'ld') items.push(['Rad TSS', nf(radTss), '', { c: radTss <= 285 ? (radTss >= 200 ? 'green' : 'gray') : 'red', label: radTss > 285 ? 'über 285: der Marathon leidet' : 'gut: etwa 250–285' }]);
    }
    const kvb = el('div', { class: 'tf-kv', style: 'margin-top:14px' }); c.appendChild(kvb); kv(kvb, items);
    c.appendChild(el('p', { class: 'tf-note', text: 'Rad: TSS = Stunden × IF² × 100 mit IF = NP / FTP (' + ftp + ' W). Laufen: IF = VT2-Tempo (' + mmss(thr) + ' /km) / Renntempo. Schwimmen: IF = CSS (' + mmss(css) + ' /100 m) / Renntempo, TSS mit IF³. Für die Langdistanz gilt ein Rad-TSS von etwa 250–285 bei IF 0,68–0,72 als guter Bereich für gut vorbereitete Altersklassen-Athleten (Tabelle von Rick Ashburn nach Joe Friel).' }));
  }
  function zeitInput(txt, two, unit, on) {
    const i = el('input', { class: 'tf-input', inputmode: 'numeric', value: txt, 'aria-label': 'Zeit' });
    i.addEventListener('change', () => { const v = parseTime(i.value, two); if (!v) { A().toast(two === 'ms' ? 'Bitte als m:ss eingeben' : 'Bitte als h:mm:ss eingeben'); i.value = txt; return; } on(v); });
    return el('span', { class: 'tf-wz-in' }, i, unit ? el('em', { text: unit }) : null);
  }
  function zahlInput(v0, unit, on, min, max) {
    const i = el('input', { class: 'tf-input', type: 'number', inputmode: 'numeric', value: v0, min, max, 'aria-label': unit });
    i.addEventListener('change', () => { const v = +i.value; if (!(v >= min && v <= max)) { i.value = v0; return; } on(v); });
    return el('span', { class: 'tf-wz-in' }, i, el('em', { text: unit }));
  }

  /* ---------- Anmelden ---------- */
  T.seite('fitness', renderFitness);
  T.seite('saison', renderSaison);
  T.seite('werkzeuge', renderWerkzeuge);
  T.zusatz('heute', heuteZusatz);
  T.zusatz('erholung', erholungZusatz);
  T.zusatz('belastung', () => { sportKacheln(); bilanzBox(); acwrKarte(); });
  T.zusatz('profil', profilZusatz);
  window.tfSeiten = { gewaehlteSporte, karte, ico, badge, dot, aktuell, speicher, merke };
})();
