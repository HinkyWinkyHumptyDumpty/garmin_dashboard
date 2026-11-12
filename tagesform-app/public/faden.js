/* Dreiklang · Der Faden (Version 20)
   Der rote Faden der App: eine dünne Linie vom Saisonstart bis zum Renntag mit den Trainingsphasen, deinem heutigen Punkt
   (Pink = du) und der Flagge am Ende. Steht auf Heute unter dem Datum und führt zum Bereich Rennen; im Training trägt
   das Plan-Poster denselben Faden, im Bereich Rennen die Ziel-Bühne.
   Ohne Ziel zeigt der Faden den Weg dorthin. Daten aus der Saison-Rechnung (calcs.js „saison“). */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svg, nf, rowsOf, localDate, col } = T.ui;
  const DAY = 864e5;
  const PH = { vorbereitung: .22, grundlage: .32, aufbau: .44, spitze: .58, taper: .72, rennwoche: .86, rennen: 1, uebergang: .2 };
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  function bauen(box, o) {
    o = o || {};
    const sz = (rowsOf('saison') || [])[0];
    box.replaceChildren();
    const w = Math.max(280, box.clientWidth || 340), h = 22;
    const b = el('button', { type: 'button', class: 'tf-faden-b', 'aria-label': sz && sz.ziel_id ? 'Saison: ' + sz.ziel_name + ' in ' + nf(sz.ziel_tage) + ' Tagen' : 'Rennen aussuchen' });
    b.addEventListener('click', () => T.geh(sz && sz.ziel_id ? 'rennen' : 'rennen'));
    const s = svg('svg', { class: 'tf-faden-svg', viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h, 'aria-hidden': 'true' });
    const x0 = 6, x1 = w - 22, y = 11;
    if (sz && sz.ziel_id && Array.isArray(sz.phasen) && sz.phasen.length) {
      const P0 = sz.phasen.filter((p) => p.id !== 'uebergang'), t0 = Date.parse(P0[0].von), t1 = Date.parse(P0[P0.length - 1].bis) + DAY;
      const xs = (t) => x0 + ((x1 - x0) * (t - t0)) / Math.max(1, t1 - t0);
      P0.forEach((p, i) => {
        const a = xs(Date.parse(p.von)), bb = xs(Date.parse(p.bis) + DAY);
        svg('line', { x1: a + 1, x2: Math.max(a + 1, bb - 1), y1: y, y2: y, stroke: col('fg'), 'stroke-opacity': PH[p.id] || .3, 'stroke-width': p.id === sz.phase ? 3 : 2, 'stroke-linecap': 'round', pathLength: 1, class: 'tf-zieh', style: 'animation-delay:' + (i * 90) + 'ms' }, s);
      });
      const th = Date.parse(localDate()), xh = Math.max(x0, Math.min(x1, xs(th)));
      svg('circle', { cx: xh, cy: y, r: 5.5, fill: col('pink'), stroke: col('card'), 'stroke-width': 2, class: 'tf-faden-du' }, s);
      // Flagge am Ziel
      svg('path', { d: 'M' + (x1 + 6) + ',' + (y - 8) + ' v16 M' + (x1 + 6) + ',' + (y - 8) + ' h9 l-2.5,3.5 2.5,3.5 h-9', fill: 'none', stroke: col('fg'), 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
      const tg = sz.ziel_tage, wo = sz.ziel_wochen != null ? sz.ziel_wochen : Math.floor(tg / 7);
      b.append(s, el('span', { class: 'tf-faden-t' }, el('b', { text: tg === 0 ? 'Heute: ' + sz.ziel_name : sz.ziel_name + ' in ' + (tg === 1 ? 'einem Tag' : nf(tg) + ' Tagen') }),
        el('span', { text: (sz.phase_txt ? sz.phase_txt + (sz.phase_sub && !/Trage|Lege/.test(sz.phase_sub) ? ' · ' + sz.phase_sub : '') : '') + (wo >= 1 && tg > 7 ? ' · ' + wo + (wo === 1 ? ' Woche' : ' Wochen') + ' bis zum Start' : '') })));
    } else {
      svg('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: col('fg'), 'stroke-opacity': .14, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '2 6' }, s);
      svg('circle', { cx: x0 + 2, cy: y, r: 5.5, fill: col('pink'), stroke: col('card'), 'stroke-width': 2 }, s);
      svg('path', { d: 'M' + (x1 + 6) + ',' + (y - 8) + ' v16 M' + (x1 + 6) + ',' + (y - 8) + ' h9 l-2.5,3.5 2.5,3.5 h-9', fill: 'none', stroke: col('fg3'), 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
      b.append(s, el('span', { class: 'tf-faden-t' }, el('b', { text: sz && sz.naechstes ? sz.naechstes.name + ' in ' + nf(sz.naechstes.in_tagen) + ' Tagen – noch kein Hauptrennen' : 'Noch kein Ziel' }), el('span', { text: 'Such dir ein Rennen – Karte, Höhenprofil und deine Prognose' })));
    }
    if (o.klein) b.classList.add('klein');
    box.appendChild(b);
    return b;
  }
  function heute() { const box = $('#home-faden'); if (box) bauen(box); }
  T.zusatz('heute', () => sicher(heute));
  window.tfFaden = { bauen };
})();
