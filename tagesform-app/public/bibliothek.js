/* Dreiklang · Trainingsbibliothek (Version 20)
   Jede Einheit, die der Plan vergeben kann, einmal in Ruhe erklärt: Form, Wozu, So geht's, Zielbereich aus deinem Profil,
   Studie. Die Beschreibungen kommen aus derselben Funktion wie im Plan (plan.js „beschreiben“), damit nichts auseinanderläuft. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svgIco, rowsOf } = T.ui;
  const S = window.tfSeiten || {};
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  // Beispiel-Einheiten je Sportart: [typ, Minuten, hart (0–2), Wissens-Begriff]
  const SPORT = [
    ['laufen', 'Laufen', 'i-run', 'mint', [['locker', 50, 0, 'zone2'], ['steiger', 40, 0, 'steigerungen'], ['fahrtspiel', 45, 1, 'intervalle'], ['schwelle', 55, 2, 'schwellentraining'], ['vo2', 50, 2, 'vo2max'], ['renntempo', 60, 2, 'pacing'], ['lang', 110, 0, 'lange_einheit'], ['koppel', 30, 1, 'koppeltraining'], ['laufgehen', 35, 0, 'wiedereinstieg_laufen'], ['opener', 30, 0, 'tapering'], ['test', 45, 2, 'leistungstest']]],
    ['rad', 'Rad', 'i-bike', 'orange', [['locker', 75, 0, 'zone2'], ['kadenz', 60, 0, 'trittfrequenz'], ['sweetspot', 70, 2, 'sweetspot'], ['schwelle', 70, 2, 'ftp'], ['vo2', 60, 2, 'vo2max'], ['renntempo', 90, 2, 'pacing'], ['lang', 180, 0, 'lange_einheit'], ['opener', 40, 0, 'tapering'], ['test', 60, 2, 'ftp']]],
    ['schwimmen', 'Schwimmen', 'i-swim', 'blue', [['technik', 45, 0, 'schwimmtechnik'], ['css', 50, 2, 'css'], ['ausdauer', 55, 1, 'freiwasser'], ['lang', 60, 0, 'css'], ['sprint', 45, 2, 'css'], ['opener', 25, 0, 'tapering'], ['test', 45, 2, 'css']]],
    ['kraft', 'Kraft', 'i-dumbbell', 'purple', [['kraft_ganz', 45, 1, 'maximalkraft'], ['kraft_lauf', 40, 1, 'concurrent'], ['kraft_unten', 45, 1, 'maximalkraft'], ['kraft_oben', 40, 1, 'maximalkraft']]],
    ['mobil', 'Pilates & Yoga', 'i-lotus', 'teal', [['mobil', 25, 0, 'pilates'], ['mobil_yoga', 25, 0, 'pilates']]],
  ];
  const ART_NAME = { locker: 'locker', mittel: 'zügig', schwelle: 'Schwelle', sweetspot: 'Sweet Spot', hart: 'hart', renn: 'Renntempo', test: 'Test', kraft: 'Kraft' };
  const ART_FARBE = { locker: 'green', mittel: 'yellow', schwelle: 'orange', sweetspot: 'orange', hart: 'red', renn: 'pink', test: 'purple', kraft: 'purple' };
  let sport = 'laufen', offen = null;
  function planStub() { // reicht für „beschreiben“: Ziel, Distanz, Phase
    const PLN = window.tfPlan, echt = PLN && PLN.planJetzt ? sicher(() => PLN.planJetzt()) : null;
    if (echt && echt.W && echt.W.length) { const i = Math.min(echt.W.length - 1, Math.max(0, echt.W.findIndex((w) => w.phase === 'aufbau'))); return { PL: echt, w: echt.W[i >= 0 ? i : 0] }; }
    const item = window.tfDistanz ? tfDistanz('tri', 'ld') : null;
    return { PL: { P: { ziel: 'schneller', sport: 'tri', distanz: 'ld' }, key: 'tri_ld', item, E: [], niv: 1, N: 20, W: [] }, w: { phase: 'aufbau', i: 4, wp: 1, leicht: false, start: T.ui.localDate() } };
  }
  function einheit(spId, typ, min, hart) {
    const { PL, w } = planStub();
    const s = { sport: spId, typ, min, hart, lang: typ === 'lang', q: hart === 2, nach: 'rad' };
    return sicher(() => window.tfPlan.beschreiben(s, PL, w)) ? { s, D: window.tfPlan.beschreiben(s, PL, w) } : null;
  }
  function karte(spId, typ, min, hart, begriff) {
    const E = einheit(spId, typ, min, hart); if (!E || !E.D || !E.D.titel) return null;
    const { s, D } = E, key = spId + ':' + typ, auf = offen === key;
    const RF = sicher(() => window.tfPlan.profil(s, D)), variiert = window.tfPlan.formVariiert(RF);
    const c = el('article', { class: 'tf-card tf-bib' + (auf ? ' auf' : '') });
    const kopf = el('button', { type: 'button', class: 'tf-bib-k', 'aria-expanded': String(auf) },
      el('span', { class: 'tf-bib-t' }, el('b', { text: D.titel }), el('small', null, (spId === 'schwimmen' && D.km ? T.ui.nf(D.km) + ' m' : min + ' min'), el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + (ART_FARBE[D.art] || 'gray') + ')' }), ART_NAME[D.art] || '')),
      variiert ? el('span', { class: 'tf-pl-mini' }, window.tfPlan.formMini(RF, D)) : null, svgIco('i-chev'));
    kopf.lastChild.classList.add('tf-chev');
    kopf.addEventListener('click', () => { offen = auf ? null : key; render(); if (!auf) requestAnimationFrame(() => { const e = $('#bibliothek .tf-bib.auf'); if (e) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); });
    c.appendChild(kopf);
    if (auf) {
      const d = el('div', { class: 'tf-bib-d' });
      if (variiert) d.appendChild(el('div', { class: 'tf-form-box' }, window.tfPlan.formChart(RF, D, s)));
      if (D.warum) d.appendChild(el('p', { class: 'tf-bib-p' }, el('b', { text: 'Wozu' }), el('span', { text: D.warum })));
      d.appendChild(el('div', { class: 'tf-bib-p' }, el('b', { text: 'So geht’s' + (spId === 'schwimmen' ? '' : ' · Beispiel ' + min + ' min') }), el('ol', { class: 'tf-steps tf-pl-bau' }, ...D.bau.map((t) => el('li', { text: t })))));
      if ((D.ziele && D.ziele.length) || D.fuehl) d.appendChild(el('div', { class: 'tf-pl-ziel-box' }, el('small', { text: 'Zielbereich aus deinem Profil' }), D.ziele && D.ziele.length ? el('b', { text: D.ziele.join(' · ') }) : null, D.fuehl ? el('span', { text: D.fuehl }) : null));
      if (D.tipp) d.appendChild(el('p', { class: 'tf-pl-tipp' }, svgIco('i-drop'), D.tipp));
      const z = el('div', { class: 'tf-bib-z' });
      if (D.quelle) z.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: D.quelle })));
      if (begriff && window.tfWissen && tfWissen.begriff(begriff)) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, svgIco('i-book'), ' ' + tfWissen.begriff(begriff).name + ' im Wissen'); b.addEventListener('click', () => tfWissen.zeige(begriff)); z.appendChild(b); }
      d.appendChild(z);
      c.appendChild(d);
    }
    return c;
  }
  function render() {
    const box = $('#bibliothek-box'); if (!box) return;
    if (!window.tfPlan || !window.tfPlan.beschreiben) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Die Bibliothek braucht den Plan-Baustein.' })); return; }
    const Sp = T.sportarten ? T.sportarten() : ['laufen', 'rad', 'schwimmen'];
    const sportarten = SPORT.filter(([id]) => ['kraft', 'mobil'].includes(id) || Sp.includes(id) || Sp.length === 0);
    if (!sportarten.some(([id]) => id === sport)) sport = sportarten[0][0];
    const frag = [];
    // Einstieg: wie man eine Einheit liest
    const I = rowsOf('intensitaet') || [], Is = I.find((r) => r.id === 'saison');
    frag.push(el('article', { class: 'tf-card tf-bib-intro' },
      el('div', { class: 'tf-card-head' }, S.badge ? S.badge('gold', 'i-book') : null, el('div', null, el('h2', { text: 'So liest du eine Einheit' }), el('div', { class: 'tf-sub', text: 'Form, Farbe und Zielbereich' }))),
      el('div', { class: 'tf-bib-legende' },
        ...[['green', 'locker', 'ganze Sätze sprechen geht'], ['yellow', 'zügig', 'nur noch kurze Sätze'], ['orange', 'Schwelle · Sweet Spot', 'angenehm hart, einzelne Sätze'], ['red', 'hart', 'nur noch einzelne Worte'], ['pink', 'Renntempo', 'dein geplantes Tempo'], ['purple', 'Test · Kraft', 'alles, was du hast – oder schwer']].map(([f, n, t]) => el('span', null, el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + f + ')' }), el('b', { text: n }), el('small', { text: t })))),
      el('p', { class: 'tf-bib-text', text: 'Die Form zeigt die Einheit von links nach rechts: Breite ist Zeit, Höhe ist Anstrengung, die Farbe steht für die Art. Die meisten Einheiten bleiben niedrig – das ist Absicht: Etwa 80 Prozent locker und 20 Prozent hart bringt bei Ausdauersportlern die größte Wirkung pro Stunde' + (Is && Is.z1_pct != null ? ' (bei dir in den letzten 12 Monaten ' + Is.z1_pct + ' % locker)' : '') + '. Zielbereiche rechnet die Bibliothek aus deinem Athletenprofil.' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014' }))));
    // Sportarten
    const seg = el('div', { class: 'tf-seg tf-bib-seg', role: 'tablist' });
    sportarten.forEach(([id, name, icon]) => { const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(sport === id), 'aria-pressed': String(sport === id) }, svgIco(icon), el('span', { text: name })); b.addEventListener('click', () => { sport = id; offen = null; render(); }); seg.appendChild(b); });
    frag.push(seg);
    const sp = sportarten.find(([id]) => id === sport);
    const karten = sp[4].map(([typ, min, hart, begriff]) => karte(sp[0], typ, min, hart, begriff)).filter(Boolean);
    frag.push(el('div', { class: 'tf-bib-liste' }, ...karten));
    frag.push(el('p', { class: 'tf-note', text: 'Im Plan passen sich Dauer, Wiederholungen und Zielbereiche an deine Woche an – hier siehst du die Grundform jeder Einheit.' }));
    box.replaceChildren(el('div', { class: 'tf-hub tf-bib-hub' }, ...frag));
  }
  T.seite('bibliothek', render);
  window.tfBibliothek = { render };
})();
