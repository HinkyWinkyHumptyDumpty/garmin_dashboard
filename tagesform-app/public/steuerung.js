/* Dreiklang · Steuerung (Version 13)
   Was die Belastung gerade mit dir macht – und was eine Änderung bewirken würde:
   · Überlastungs-Wächter: Tune drei Tage in Folge gesunken bei hoher Last → ein Entlastungstag (Heute, Plan)
   · Beine gegen Kreislauf: mechanische Last (Laufen, Beintraining) getrennt von der metabolischen (Rad, Schwimmen),
     je mit akuter gegen chronischer Last – Sehnen und Knochen passen sich langsamer an als Herz und Lunge
   · Was wäre, wenn …? Eine Einheit dieser Woche verschieben und live sehen, wie frisch du am Wochenende bist
     (Formprognose nach Banister) und wie sich die Woche neu ordnet (Domino-Vorschau).
   Rechnungen in alltag-motor.js (einheitLast, lastKanaele, formPrognose, ueberlastung). */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, svg, nf, iso, toDay, fmtDay, col, rowsOf, localDate, DAY, svgIco, plot, line, hoverTime, params, windowRows } = T.ui;
  const { dot } = S;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const plus = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const WT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], WT_LANG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const wt = (d) => (toDay(d).getUTCDay() + 6) % 7;
  const sg = (x) => (x == null || !isFinite(x) ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '±') + nf(Math.abs(Math.round(x))));
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const lsLesen = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSchreiben = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* nur Komfort */ } };
  const warum = (t, q) => (T.ui.warum ? T.ui.warum(t, q) : null);
  const MEMO = new Map();
  function merk(key, teile, fn) { const m = MEMO.get(key); if (m && m.teile.length === teile.length && m.teile.every((x, i) => x === teile[i])) return m.r; const r = fn(); MEMO.set(key, { teile, r }); return r; }

  /* =====================================================================
     Beine gegen Kreislauf
     ===================================================================== */
  const gymLog = () => { const g = (A().state.rechner || {}).gym; return g && Array.isArray(g.log) ? g.log : []; };
  function kanaele(tage) {
    const h = localDate(), n = tage || 120;
    return merk('kanaele:' + n, [rowsOf('belastung'), (A().state.rechner || {}).gym, (A().state.rechner || {}).plan, h], () => sicher(() => M().lastKanaele({
      heute: h, tage: n, belastung: rowsOf('belastung') || [], gym: gymLog(),
      plan: window.tfPlan && tfPlan.lastPlan ? tfPlan.lastPlan(plus(h, 1), 7) : [],
    }))) || { rows: [], jetzt: null, deutung: null };
  }
  const zone = (v) => (v == null ? { c: 'gray', t: 'kein Wert' } : v > 1.5 ? { c: 'red', t: 'Sprung' } : v > 1.3 ? { c: 'yellow', t: 'erhöht' } : v >= 0.8 ? { c: 'green', t: 'günstig' } : { c: 'gray', t: 'Entlastung' });
  const DEUTUNG = {
    bein: (r) => 'Deine Beine bekommen gerade schneller mehr als dein Kreislauf (' + nf(r.bein_acwr, 2) + ' gegen ' + nf(r.kreis_acwr, 2) + ') – typisch nach mehr Laufen oder schweren Beintagen. Sehnen, Knochen und Schienbein passen sich langsamer an als Herz und Lunge: Lauf-Umfang diese Woche nicht weiter steigern, Ausdauer lieber auf dem Rad oder im Wasser.',
    kreis: (r) => 'Dein Kreislauf ist gerade stärker gefordert als deine Beine (' + nf(r.kreis_acwr, 2) + ' gegen ' + nf(r.bein_acwr, 2) + ') – viel Rad oder Schwimmen. Für Sehnen unkritisch; achte auf Schlaf und Essen, die Ermüdung sitzt eher im ganzen Körper.',
    beide: (r) => 'Beine und Kreislauf bekommen beide deutlich mehr als gewohnt (' + nf(r.bein_acwr, 2) + ' und ' + nf(r.kreis_acwr, 2) + '). So ein Sprung ist für ein paar Tage in Ordnung – danach eine leichtere Phase einplanen.',
    frisch: () => 'Beide Lasten liegen unter deinem Gewohnten – du bist gerade in einer leichten Phase. Gut vor einem Rennen; sonst kannst du langsam wieder steigern.',
    ok: () => 'Ausgewogen: Beine und Kreislauf bekommen etwa so viel wie in den letzten vier Wochen.',
  };
  function kanalKarte() {
    const sec = $('#belastung'); if (!sec) return;
    const c = $('#karte-kanaele'); if (!c || c.classList.contains('tf-aus')) return;
    const p = params(), rng = Math.max(28, +p.range || 90), K = kanaele(Math.max(120, rng + 30)), jetzt = K.jetzt;
    const kopf = el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-mint)' }, svgIco('i-run')),
      el('div', null, el('h2', { text: 'Beine gegen Kreislauf' }), el('div', { class: 'tf-sub', text: 'Was Beine und Sehnen tragen, getrennt von dem, was Herz und Stoffwechsel leisten · 7 gegen 28 Tage' })));
    if (!jetzt || (jetzt.bein_acwr == null && jetzt.kreis_acwr == null)) {
      c.replaceChildren(kopf, el('p', { class: 'tf-note', text: T.ohne() ? 'Mit Garmin-Daten siehst du hier, wie viel deine Beine (Laufen, Beintraining) gegen deinen Kreislauf (Rad, Schwimmen) tragen.' : 'Für den Vergleich braucht es ein paar Wochen Training mit Laufen oder Rad.' }));
      return;
    }
    const zb = zone(jetzt.bein_acwr), zk = zone(jetzt.kreis_acwr);
    const sieben = K.rows.filter((r) => r.date > plus(localDate(), -7) && !r.geplant), sb = sieben.reduce((x, r) => x + r.bein, 0), sk = sieben.reduce((x, r) => x + r.kreis, 0);
    const chips = el('div', { class: 'tf-acwr-chips tf-kan-chips' },
      el('div', { class: 'tf-acwr-chip tf-kan-chip' }, el('i', { class: 'tf-line', style: 'background:' + col('mint') }), el('span', { text: 'Beine' }), el('b', { class: 'num', text: jetzt.bein_acwr == null ? '–' : nf(jetzt.bein_acwr, 2) }), el('small', null, dot(zb.c), zb.t)),
      el('div', { class: 'tf-acwr-chip tf-kan-chip' }, el('i', { class: 'tf-line', style: 'background:' + col('indigo') }), el('span', { text: 'Kreislauf' }), el('b', { class: 'num', text: jetzt.kreis_acwr == null ? '–' : nf(jetzt.kreis_acwr, 2) }), el('small', null, dot(zk.c), zk.t)),
      el('div', { class: 'tf-acwr-chip tf-kan-chip' }, el('span', { text: 'Letzte 7 Tage' }), el('b', { class: 'num', text: sb + sk ? Math.round((100 * sb) / (sb + sk)) + ' %' : '–' }), el('small', { text: 'Anteil Beine' })));
    const box = el('div', { class: 'tf-chart', id: 'chart-kanaele', style: 'min-height:200px' });
    const D = K.deutung, text = D && DEUTUNG[D.art] ? DEUTUNG[D.art](jetzt) : '';
    c.replaceChildren(kopf, chips, box,
      el('div', { class: 'tf-legend' }, ...[['mint', 'Beine & Sehnen (Laufen, Beintraining)'], ['indigo', 'Kreislauf (alle Ausdauer)']].map(([f, t]) => el('span', null, el('i', { class: 'tf-line', style: 'background:' + col(f) }), t)), el('span', null, el('i', { class: 'tf-line tf-line-gestr' }), 'geplant')),
      text ? el('p', { class: 'tf-kan-text' }, dot(D.stufe === 'rot' ? 'red' : D.stufe === 'gelb' ? 'yellow' : D.stufe === 'blau' ? 'blue' : 'green'), el('span', { text })) : null,
      el('p', { class: 'tf-caption', text: 'Beine: Lauf-TSS voll, Rad-TSS zu 15 %, harte Beinsätze im Gym je 4 Punkte. Kreislauf: TSS aller Ausdauereinheiten. Je Kanal die letzten 7 gegen die letzten 28 Tage, exponentiell gewichtet – grün 0,8–1,3.' }));
    const { from, to } = windowRows(K.rows, rng); if (!from) return;
    const bis = (K.rows.filter((r) => r.geplant).pop() || {}).date || to;
    const R = K.rows.filter((r) => r.date >= from && r.date <= bis), vals = R.flatMap((r) => [r.bein_acwr, r.kreis_acwr]).filter((x) => x != null);
    if (!vals.length) return;
    const top = Math.min(3, Math.max(1.8, ...vals) * 1.08);
    requestAnimationFrame(() => {
      const P = plot(box, { h: 200, y: [0, top], yticks: [0.8, 1.3, 2].filter((t) => t < top), yfmt: (t) => nf(t, t % 1 ? 1 : 0), x: [toDay(from), toDay(bis)], label: 'ACWR Beine und Kreislauf' });
      const zoneR = (a0, a1, f, o) => { const y0 = P.ys(Math.min(a1, top)), y1 = P.ys(a0); svg('rect', { x: P.ml, y: y0, width: P.w - P.mr - P.ml, height: Math.max(0, y1 - y0), fill: col(f), opacity: o }, P.g); };
      zoneR(0.8, 1.3, 'green', 0.1); zoneR(1.3, 1.5, 'yellow', 0.14); if (top > 1.5) zoneR(1.5, top, 'red', 0.08);
      const xf = (r) => toDay(r.date), ist = R.filter((r) => !r.geplant), plan = R.filter((r, j) => r.geplant || (R[j + 1] && R[j + 1].geplant));
      if (plan.length > 1) { svg('rect', { x: P.xs(toDay(plan[0].date)), y: P.top, width: Math.max(0, P.xs(toDay(bis)) - P.xs(toDay(plan[0].date))), height: P.xb - P.top, fill: col('fg3'), opacity: 0.06 }, P.g); }
      const kb = (v) => (v == null ? null : Math.min(v, top)), yb = (r) => kb(r.bein_acwr), yk = (r) => kb(r.kreis_acwr); // Ausreißer (nach Pausen) am oberen Rand halten
      line(P, ist, xf, yk, col('indigo'), 2.2); line(P, ist, xf, yb, col('mint'), 2.4);
      if (plan.length > 1) { line(P, plan, xf, yk, col('indigo'), 2, '4 4'); line(P, plan, xf, yb, col('mint'), 2, '4 4'); }
      hoverTime(box, P, R, xf, (r) => WT[wt(r.date)] + ', ' + fmtDay(toDay(r.date)) + (r.geplant ? ' · geplant' : ''), (r) => [
        { label: 'Beine', value: (r.bein_acwr == null ? '–' : nf(r.bein_acwr, 2)) + ' · ' + r.bein + ' Punkte', color: col('mint') },
        { label: 'Kreislauf', value: (r.kreis_acwr == null ? '–' : nf(r.kreis_acwr, 2)) + ' · ' + r.kreis + ' Punkte', color: col('indigo') }], [{ y: yb, color: col('mint') }, { y: yk, color: col('indigo') }]);
    });
  }

  /* =====================================================================
     Überlastungs-Wächter
     ===================================================================== */
  function ueberlastungRoh() {
    if (T.ohne()) return null;
    const h = localDate();
    return merk('ueber', [rowsOf('erholung'), rowsOf('pmc'), h], () => sicher(() => M().ueberlastung({ heute: h, erholung: rowsOf('erholung') || [], pmc: rowsOf('pmc') || [] })));
  }
  function ueberlastung() { // null, wenn für heute weggeklickt
    const u = ueberlastungRoh(); if (!u) return null;
    return lsLesen('tf:ueber-weg') === localDate() ? null : u;
  }
  function ueberBanner() {
    const box = $('#home-hinweise'); if (!box) return;
    const alt = box.querySelector('#hinweis-ueber'), u = ueberlastung();
    if (!u) { if (alt) alt.remove(); return; }
    const hatPlan = window.tfPlan && tfPlan.hat && tfPlan.hat(), h = localDate(), morgen = plus(h, 1);
    const schon = hatPlan && (tfPlan.entlastet(h) || tfPlan.entlastet(morgen));
    const last = [u.acwr != null ? 'ACWR ' + nf(u.acwr, 2) : null, u.tsb != null ? 'Form ' + sg(u.tsb) : null, u.s7 > u.schnitt7 ? nf(u.s7) + ' statt ' + nf(u.schnitt7) + ' TSS in 7 Tagen' : null].filter(Boolean).join(' · ');
    const knoepfe = el('div', { class: 'tf-form-actions' });
    if (schon) knoepfe.appendChild(el('span', { class: 'tf-chip', text: 'Entlastungstag ist eingeplant' }));
    else if (hatPlan) {
      [[h, 'Heute entlasten'], [morgen, 'Morgen entlasten']].forEach(([d, t], j) => {
        const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' + (j === 0 ? ' tf-btn-primary' : '') }, t);
        b.addEventListener('click', () => { tfPlan.entlasten(d); A().toast('Entlastungstag am ' + WT_LANG[wt(d)] + ' – im Plan steht jetzt höchstens 30 min locker'); T.neu(); });
        knoepfe.appendChild(b);
      });
    }
    const nein = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-plain' }, 'Nicht jetzt');
    nein.addEventListener('click', () => { lsSchreiben('tf:ueber-weg', h); T.neu(); });
    knoepfe.appendChild(nein);
    const art = el('article', { class: 'tf-card tf-hinweis tf-hinweis-ueber', id: 'hinweis-ueber', role: 'status' },
      el('span', { class: 'tf-badge', style: '--c:var(--tf-orange)' }, svgIco('i-alert')),
      el('div', null, el('b', { text: 'Tune fällt, Belastung ist hoch' }), // Version 42 (aus V35): Warnmuster statt Vorhersage
        el('p', null, 'Dein Tune ist an drei aufeinanderfolgenden Tagen gefallen (' + u.werte.join(' → ') + '), gleichzeitig zeigen deine Belastungsdaten eine erhöhte Beanspruchung' + (last ? ' (' + last + ')' : '') + '. ' + (hatPlan ? 'Ein lockerer oder freier Tag ist jetzt eine vorsichtige Option.' : 'Erwäge heute eine lockere Einheit oder einen Ruhetag.') + ' ',
          warum('Das ist ein Warnmuster aus deinen Daten, keine Diagnose und kein Beweis für Übertraining. Prüfe auch dein Befinden, Schmerzen und ungewöhnliche Symptome. Bei anhaltenden Beschwerden oder Krankheitszeichen Training pausieren und ärztlich abklären lassen.', 'Meeusen et al., Med Sci Sports Exerc 2013 · Plews et al., IJSPP 2012')),
        el('p', { class: 'tf-caption tf-ueber-kontext', text: 'Warum diese Meldung? Tune ist an drei Tagen in Folge gefallen, insgesamt um mindestens 10 Punkte, und liegt unter deinem Normal. Dazu kommt mindestens ein Belastungszeichen: ACWR ab 1,2, Form unter −15 oder deutlich mehr Wochenlast als im Schnitt.' }),
        knoepfe));
    if (alt) alt.replaceWith(art); else box.appendChild(art);
  }

  /* =====================================================================
     Was wäre, wenn …? – Einheit verschieben, Form und Woche live
     ===================================================================== */
  function formStart() {
    const PMC = rowsOf('pmc') || [], h = localDate();
    const L = PMC.filter((r) => r.date <= h); const p = L[L.length - 1];
    return p ? { date: p.date, ctl: +p.ctl, atl: +p.atl } : null;
  }
  function prognose(Z, tage, bis) {
    const st = formStart(); if (!st) return null;
    const h = localDate(), last = {};
    (rowsOf('belastung') || []).forEach((b) => { if (b.date > st.date && b.date < h && b.sport !== 'wechsel') last[b.date] = (last[b.date] || 0) + (+b.tss || 0); });
    tage.concat(Z.spaeter).forEach((t) => { if (t.datum >= h && t.datum > st.date) last[t.datum] = t.L.reduce((x, s) => x + (s.last ? s.last.tss : 0), 0); });
    return M().formPrognose({ start: st, last, bis });
  }
  function wasWaere() {
    const Z = window.tfPlan && tfPlan.simDaten ? tfPlan.simDaten() : null;
    if (!Z) { A().toast('Dafür braucht es einen Plan mit einer laufenden Woche.'); return; }
    const h = localDate(), frei = (d) => d >= Z.heute && !Z.tage[d].L.some((s) => s.typ === 'rennen');
    const kandidaten = Z.tage.filter((t) => frei(t.d) && t.L.length);
    if (!kandidaten.length) { A().toast('Diese Woche steht nichts mehr zum Verschieben an.'); return; }
    let von = (kandidaten.find((t) => t.L.some((s) => s.hart >= 2 || s.lang)) || kandidaten[0]).d, nach = von;
    const sonntag = plus(Z.start, 6), naechsterSo = plus(Z.start, 13);
    const bis = Z.renn && Z.renn > sonntag && Z.renn <= plus(h, 21) ? Z.renn : wt(h) >= 4 ? naechsterSo : sonntag;
    const box = el('div', { class: 'tf-rm tf-ww' });
    const chips = el('div', { class: 'tf-ww-chips', role: 'radiogroup', 'aria-label': 'Welche Einheit?' });
    const titelVon = (t) => t.L.filter((s) => s.sport !== 'mobil').map((s) => s.titel).join(' + ') || t.L.map((s) => s.titel).join(' + ');
    kandidaten.forEach((t) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(t.d === von), class: 'tf-ww-chip' + (t.L.some((s) => s.hart >= 2 || s.lang) ? ' hart' : '') }, el('b', { text: WT[t.d] }), el('span', { text: titelVon(t) }));
      b.addEventListener('click', () => { von = t.d; nach = t.d; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b))); regler.value = String(nach); zeichnen(); });
      chips.appendChild(b);
    });
    const regler = el('input', { type: 'range', class: 'tf-ww-regler', min: '0', max: '6', step: '1', value: String(nach), 'aria-label': 'Auf welchen Tag?' });
    const tagLeiste = el('div', { class: 'tf-ww-tage', 'aria-hidden': 'true' }, ...WT.map((t, d) => el('span', { class: d < Z.heute ? 'vorbei' : '', text: t })));
    regler.addEventListener('input', () => { let x = +regler.value; if (x < Z.heute) { x = Z.heute; regler.value = String(x); } nach = x; zeichnen(); });
    const chart = el('div', { class: 'tf-chart tf-ww-chart', style: 'min-height:190px' });
    const lesen = el('div', { class: 'tf-ww-lesen', 'aria-live': 'polite' });
    const domino = el('div', { class: 'tf-ww-domino' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', disabled: true }, svgIco('i-tausch'), ' So verschieben');
    ok.addEventListener('click', () => { if (nach === von) return; Z.uebernehmen(von, nach); if (window.tfWissen) tfWissen.schliessen(); A().toast(WT_LANG[von] + ' ↔ ' + WT_LANG[nach] + ' – nur diese Woche'); });
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Schließen');
    ab.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Was wäre, wenn …?' }),
      el('p', { class: 'tf-rm-sub', text: 'Verschieb eine Einheit dieser Woche und sieh sofort, wie frisch du ' + (bis === Z.renn ? 'am Renntag' : 'am Wochenende') + ' bist – und wie sich die Woche neu ordnet.' }),
      el('div', { class: 'tf-field' }, el('span', { text: 'Welche Einheit?' }), chips),
      el('div', { class: 'tf-field' }, el('span', { text: 'Auf welchen Tag?' }), regler, tagLeiste),
      lesen, chart, domino,
      el('p', { class: 'tf-note', text: 'Tune misst deine Uhr jede Nacht neu – vorhersagen lässt er sich nicht. Die Form (Fitness minus Ermüdung) zeigt, wie frisch du nach Plan wärst. Übernimmst du, gilt der Tausch nur für diese Woche.' }),
      el('div', { class: 'tf-form-actions' }, ok, ab));
    const ziel = [plus(Z.start, 5), plus(Z.start, 6)].concat(bis === Z.renn ? [Z.renn] : bis === naechsterSo ? [plus(Z.start, 12), naechsterSo] : []);
    function zeichnen() {
      const V = nach === von ? { tage: Z.tage, notizen: [] } : Z.vorschau(von, nach);
      const P0 = prognose(Z, Z.tage, bis), P1 = nach === von ? P0 : prognose(Z, V.tage, bis);
      ok.disabled = nach === von || !frei(nach);
      domino.replaceChildren(nach === von ? el('p', { class: 'tf-note', text: 'Zieh den Regler auf einen anderen Tag – die Vorschau zeigt, was dann passiert.' }) : Z.domino(von, nach));
      if (!P0 || !P0.length) { chart.replaceChildren(el('p', { class: 'tf-note', text: 'Mit Garmin-Daten siehst du hier auch, wie frisch du am Wochenende wärst.' })); lesen.replaceChildren(); return; }
      const m0 = new Map(P0.map((r) => [r.date, r])), m1 = new Map(P1.map((r) => [r.date, r]));
      lesen.replaceChildren(...ziel.filter((d) => m0.has(d)).map((d) => {
        const a = m0.get(d).tsb, b = m1.get(d).tsb, diff = b - a;
        return el('div', { class: 'tf-ww-z' + (Math.abs(diff) >= 1 ? (diff > 0 ? ' besser' : ' schlechter') : '') }, el('small', { text: (d === Z.renn ? 'Renntag' : WT_LANG[wt(d)]) + ' ' + fmtDay(toDay(d)) }), el('b', { class: 'num', text: sg(b) }), el('span', { text: nach === von ? 'Form' : Math.abs(diff) < 1 ? 'Form wie geplant' : 'geplant ' + sg(a) }));
      }));
      zeichneChart(chart, P0, P1, nach !== von);
    }
    zeichnen();
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
    requestAnimationFrame(zeichnen); // Breite des Blatts steht erst jetzt fest
  }
  function zeichneChart(box, P0, P1, anders) {
    const R0 = P0, R1 = P1, vals = R0.concat(R1).map((r) => r.tsb);
    const lo = Math.min(-10, ...vals) - 4, hi = Math.max(10, ...vals) + 4;
    const P = plot(box, { h: 190, y: [lo, hi], ny: 4, yfmt: (t) => (t === 0 ? '0' : sg(t)), x: [toDay(R0[0].date), toDay(R0[R0.length - 1].date)], label: 'Form der nächsten Tage' });
    R0.forEach((r) => { if (wt(r.date) >= 5) { const x0 = P.xs(toDay(r.date)) - 8; svg('rect', { x: x0, y: P.top, width: 16, height: P.xb - P.top, fill: col('pink'), opacity: 0.07, rx: 4 }, P.g); } });
    svg('line', { x1: P.ml, x2: P.w - P.mr + 4, y1: P.ys(0), y2: P.ys(0), stroke: col('fg3'), 'stroke-width': 1 }, P.g);
    const xf = (r) => toDay(r.date);
    line(P, R0, xf, (r) => r.tsb, col('fg3'), 2, anders ? '5 4' : null);
    if (anders) line(P, R1, xf, (r) => r.tsb, col('pink'), 2.6);
    hoverTime(box, P, R1, xf, (r) => WT[wt(r.date)] + ', ' + fmtDay(toDay(r.date)), (r) => {
      const a = R0.find((x) => x.date === r.date);
      return [{ label: anders ? 'Verschoben' : 'Form', value: sg(r.tsb), color: col(anders ? 'pink' : 'fg3') }].concat(anders && a ? [{ label: 'Wie geplant', value: sg(a.tsb), color: col('fg3') }] : []).concat([{ label: 'Last an dem Tag', value: nf(r.tss) + ' TSS' }]);
    }, [{ y: (r) => r.tsb, color: col(anders ? 'pink' : 'fg3') }]);
  }

  T.zusatz('belastung', kanalKarte);
  T.zusatz('heute', ueberBanner);
  window.tfSteuerung = { kanaele: () => kanaele(120), ueberlastung, ueberlastungRoh, wasWaere, prognose: (bis) => { const Z = window.tfPlan && tfPlan.simDaten ? tfPlan.simDaten() : null; return Z ? prognose(Z, Z.tage, bis) : null; } };
})();
