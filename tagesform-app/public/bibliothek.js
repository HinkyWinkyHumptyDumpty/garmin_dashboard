/* Dreiklang · Trainingsbibliothek (Version 20, Version 24: 64 Einheiten in Gruppen, Dauer wählbar, „diese Woche im Plan“)
   Jede Einheit, die der Plan vergeben kann, einmal in Ruhe erklärt: Form, Wozu, So geht's, Zielbereich aus deinem Profil,
   Studie. Die Beschreibungen kommen aus derselben Funktion wie im Plan (plan.js „beschreiben“), damit nichts auseinanderläuft. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svgIco, rowsOf } = T.ui;
  const S = window.tfSeiten || {};
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  // Gruppen: Kennung, Name, Untertitel
  const GRUPPEN = [['basis', 'Grundlage & locker', 'Der größte Teil jeder Woche'], ['qual', 'Qualität', 'Der Reiz, der schneller macht'], ['lang', 'Lang', 'Ausdauer, Verpflegung, Kopf'], ['spezial', 'Rennwoche & Test', 'Kurz, wach, messbar']];
  // Einheiten je Sportart: [typ, Beispiel-Minuten, hart (0–2), Wissens-Begriff, Gruppe, Dauern zur Auswahl]
  const SPORT = [
    ['laufen', 'Laufen', 'i-run', 'mint', [
      ['locker', 50, 0, 'zone2', 'basis', [30, 45, 60, 75]], ['regeneration', 30, 0, 'aktive_erholung', 'basis', [20, 30, 40]], ['steiger', 40, 0, 'steigerungen', 'basis', [30, 40, 50]], ['lauf_abc', 45, 0, 'lauftechnik', 'basis', [35, 45, 55]], ['laufgehen', 35, 0, 'wiedereinstieg_laufen', 'basis', [25, 35, 45]],
      ['fahrtspiel', 45, 1, 'intervalle', 'qual', [40, 45, 55]], ['progressiv', 55, 1, 'progressionslauf', 'qual', [45, 55, 70]], ['schwelle', 55, 2, 'schwellentraining', 'qual', [50, 55, 65]], ['cruise', 55, 2, 'cruise_intervalle', 'qual', [50, 55, 65]], ['vo2', 50, 2, 'vo2max', 'qual', [45, 50, 60]], ['huegel', 50, 2, 'huegellauf', 'qual', [45, 50, 60]], ['renntempo', 60, 2, 'pacing', 'qual', [50, 60, 75]], ['tempowechsel', 55, 2, 'tempowechsel', 'qual', [50, 55, 65]], ['koppel', 30, 1, 'koppeltraining', 'qual', [15, 20, 30, 45]],
      ['lang', 120, 0, 'lange_einheit', 'lang', [90, 120, 150, 180, 210, 240]], ['lang_progressiv', 120, 1, 'lange_einheit', 'lang', [90, 120, 150, 180]], ['lang_renn', 140, 2, 'lange_einheit', 'lang', [100, 120, 150, 180]],
      ['opener', 30, 0, 'tapering', 'spezial', [20, 30]], ['test', 45, 2, 'leistungstest', 'spezial', [45]]]],
    ['rad', 'Rad', 'i-bike', 'orange', [
      ['locker', 75, 0, 'zone2', 'basis', [45, 60, 75, 90, 120]], ['regeneration', 40, 0, 'aktive_erholung', 'basis', [30, 40, 60]], ['kadenz', 60, 0, 'trittfrequenz', 'basis', [45, 60, 75]], ['tempo', 75, 1, 'zone3', 'basis', [60, 75, 90]],
      ['sweetspot', 70, 2, 'sweetspot', 'qual', [60, 70, 90]], ['berg', 75, 2, 'kraftausdauer', 'qual', [60, 75, 90]], ['schwelle', 70, 2, 'ftp', 'qual', [70, 80, 90]], ['ueber_unter', 75, 2, 'over_under', 'qual', [60, 75, 90]], ['vo2', 60, 2, 'vo2max', 'qual', [60, 70]], ['sprint', 60, 2, 'vo2max', 'qual', [45, 60]], ['renntempo', 90, 2, 'pacing', 'qual', [75, 90, 120]], ['aero', 80, 2, 'aerodynamik', 'qual', [60, 80, 100]],
      ['lang', 180, 0, 'lange_einheit', 'lang', [120, 180, 240, 300, 360, 420]], ['lang_berg', 180, 0, 'lange_einheit', 'lang', [120, 180, 240, 300]], ['lang_renn', 210, 2, 'lange_einheit', 'lang', [150, 180, 240, 300]],
      ['opener', 40, 0, 'tapering', 'spezial', [30, 40]], ['test', 60, 2, 'ftp', 'spezial', [60]]]],
    ['schwimmen', 'Schwimmen', 'i-swim', 'blue', [
      ['technik', 45, 0, 'schwimmtechnik', 'basis', [35, 45, 60]], ['beine', 45, 0, 'schwimmtechnik', 'basis', [35, 45, 55]], ['zugkraft', 50, 1, 'zugkraft', 'basis', [40, 50, 60]], ['ausdauer', 55, 1, 'freiwasser', 'basis', [45, 55, 70]], ['freiwasser', 55, 1, 'freiwasser', 'basis', [45, 55, 70]],
      ['css', 50, 2, 'css', 'qual', [40, 50, 60]], ['pyramide', 50, 2, 'css', 'qual', [45, 50, 60]], ['tempowechsel', 50, 2, 'css', 'qual', [40, 50, 60]], ['sprint', 45, 2, 'css', 'qual', [40, 45]], ['rennsim', 55, 2, 'pacing', 'qual', [45, 55, 65]],
      ['lang', 60, 0, 'css', 'lang', [45, 60, 75, 90, 120]],
      ['opener', 25, 0, 'tapering', 'spezial', [20, 25]], ['test', 45, 2, 'css', 'spezial', [45]]]],
    ['kraft', 'Kraft', 'i-dumbbell', 'purple', [
      ['kraft_ganz', 45, 1, 'maximalkraft', 'basis', [30, 45, 60]], ['kraft_lauf', 40, 1, 'concurrent', 'basis', [30, 40, 50]], ['kraft_rad', 45, 1, 'maximalkraft', 'basis', [30, 45, 60]], ['kraft_schwimm', 40, 1, 'maximalkraft', 'basis', [30, 40, 50]], ['kraft_unten', 45, 1, 'maximalkraft', 'basis', [30, 45, 60]], ['kraft_oben', 40, 1, 'maximalkraft', 'basis', [30, 40, 50]],
      ['kraft_rumpf', 30, 1, 'rumpfstabilitaet', 'qual', [20, 30, 40]], ['kraft_explosiv', 40, 1, 'plyometrie', 'qual', [30, 40, 50]],
      ['kraft_erhalt', 25, 1, 'tapering', 'spezial', [20, 25, 30]]]],
    ['mobil', 'Pilates & Yoga', 'i-lotus', 'teal', [
      ['mobil_pilates', 20, 0, 'pilates', 'basis', [10, 20, 30]], ['mobil_yoga', 20, 0, 'pilates', 'basis', [10, 20, 30]], ['mobil_ruecken', 20, 0, 'pilates', 'basis', [10, 20, 30]], ['mobil_balance', 20, 0, 'pilates', 'basis', [10, 20, 30]],
      ['mobil_schulter', 20, 0, 'pilates', 'qual', [10, 20, 30]], ['mobil_abend', 20, 0, 'schlafhygiene', 'spezial', [10, 20, 30]]]],
  ];
  const ANZAHL = SPORT.reduce((n, sp) => n + sp[4].length, 0);
  const ART_NAME = { locker: 'locker', mittel: 'zügig', schwelle: 'Schwelle', sweetspot: 'Sweet Spot', hart: 'hart', renn: 'Renntempo', test: 'Test', kraft: 'Kraft' };
  const ART_FARBE = { locker: 'green', mittel: 'yellow', schwelle: 'orange', sweetspot: 'orange', hart: 'red', renn: 'pink', test: 'purple', kraft: 'purple' };
  let sport = 'laufen', offen = null, gruppe = 'alle';
  const dauer = {}; // gewählte Dauer je Einheit (nur in dieser Sitzung)
  function planStub() { // reicht für „beschreiben“: Ziel, Distanz, Phase
    const PLN = window.tfPlan, echt = PLN && PLN.planJetzt ? sicher(() => PLN.planJetzt()) : null;
    if (echt && echt.W && echt.W.length) { const i = Math.min(echt.W.length - 1, Math.max(0, echt.W.findIndex((w) => w.phase === 'aufbau'))); return { PL: echt, w: echt.W[i >= 0 ? i : 0] }; }
    const item = window.tfDistanz ? tfDistanz('tri', 'ld') : null;
    return { PL: { P: { ziel: 'schneller', sport: 'tri', distanz: 'ld' }, key: 'tri_ld', item, E: [], niv: 1, N: 20, W: [] }, w: { phase: 'aufbau', i: 4, wp: 1, leicht: false, start: T.ui.localDate() } };
  }
  function einheit(spId, typ, min, hart) {
    const { PL, w } = planStub();
    const s = { sport: spId, typ, min, hart, lang: /^lang/.test(typ), q: hart === 2, nach: 'rad' };
    const D = sicher(() => window.tfPlan.beschreiben(s, PL, w));
    return D ? { s, D } : null;
  }
  // Welche Einheiten stehen diese Woche im Plan? (sport:typ → Wochentag)
  function imPlan() {
    const out = {};
    const PLN = window.tfPlan; if (!PLN || !PLN.tag) return out;
    const h = T.ui.localDate(), mo = T.ui.toDay(h), wd = (mo.getUTCDay() + 6) % 7;
    for (let d = 0; d < 7; d++) {
      const dt = T.ui.iso(new Date(+mo + (d - wd) * T.ui.DAY));
      (sicher(() => PLN.tag(dt)) || []).forEach((s) => { if (s && s.sport && s.typ && !s.eigen) out[s.sport + ':' + s.typ] = out[s.sport + ':' + s.typ] || ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][d]; });
    }
    return out;
  }
  function karte(spId, typ, min0, hart, begriff, dauern, plan) {
    const key = spId + ':' + typ, min = dauer[key] || min0, auf = offen === key;
    const E = einheit(spId, typ, min, hart); if (!E || !E.D || !E.D.titel) return null;
    const { s, D } = E;
    const RF = sicher(() => window.tfPlan.profil(s, D)), variiert = window.tfPlan.formVariiert(RF);
    const c = el('article', { class: 'tf-card tf-bib' + (auf ? ' auf' : '') + (plan[key] ? ' tf-bib-plan' : '') });
    // Version 24: jede Einheit trägt ihre Form als Wellenform über die ganze Breite – auf einen Blick sichtbar, was sie ist
    const welle = RF && window.tfPlan.formWelle ? el('span', { class: 'tf-bib-welle' }, window.tfPlan.formWelle(RF, D)) : null;
    const chev = svgIco('i-chev'); chev.classList.add('tf-chev');
    const kopf = el('button', { type: 'button', class: 'tf-bib-k' + (welle ? ' mit-welle' : ''), 'aria-expanded': String(auf) },
      el('span', { class: 'tf-bib-t' }, el('b', { text: D.titel }), el('small', null, el('span', { class: 'tnum', text: spId === 'schwimmen' && D.km ? T.ui.nf(D.km) + ' m' : min >= 120 ? T.ui.nf(min / 60, min % 60 ? 1 : 0) + ' h' : min + ' min' }), el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + (ART_FARBE[D.art] || 'gray') + ')' }), ART_NAME[D.art] || '', plan[key] ? el('em', { class: 'tf-bib-im', text: 'im Plan · ' + plan[key] }) : null)),
      chev, welle);
    kopf.addEventListener('click', () => { offen = auf ? null : key; render(); if (!auf) requestAnimationFrame(() => { const e = $('#bibliothek .tf-bib.auf'); if (e) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); });
    c.appendChild(kopf);
    if (auf) {
      const d = el('div', { class: 'tf-bib-d' });
      // Version 24: Dauer wählen – die Beschreibung rechnet mit
      if (dauern && dauern.length > 1) {
        const ch = el('div', { class: 'tf-chipset tf-bib-dauer', role: 'group', 'aria-label': 'Dauer' });
        dauern.forEach((v) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === min), class: 'tnum' }, v >= 120 ? T.ui.nf(v / 60, v % 60 ? 1 : 0) + ' h' : v + ' min'); b.addEventListener('click', () => { dauer[key] = v; render(); }); ch.appendChild(b); });
        d.appendChild(el('div', { class: 'tf-bib-dauer-z' }, el('small', { text: 'Dauer' }), ch));
      }
      if (variiert) d.appendChild(el('div', { class: 'tf-form-box' }, window.tfPlan.formChart(RF, D, s)));
      if (D.warum) d.appendChild(el('p', { class: 'tf-bib-p' }, el('b', { text: 'Wozu' }), el('span', { text: D.warum })));
      d.appendChild(el('div', { class: 'tf-bib-p' }, el('b', { text: 'So geht’s' + (spId === 'schwimmen' ? '' : ' · ' + (min >= 120 ? T.ui.nf(min / 60, min % 60 ? 1 : 0) + ' h' : min + ' min')) }), el('ol', { class: 'tf-steps tf-pl-bau' }, ...D.bau.map((t) => el('li', { text: t })))));
      if ((D.ziele && D.ziele.length) || D.fuehl) d.appendChild(el('div', { class: 'tf-pl-ziel-box' }, el('small', { text: 'Zielbereich aus deinem Profil' }), D.ziele && D.ziele.length ? el('b', { text: D.ziele.join(' · ') }) : null, D.fuehl ? el('span', { text: D.fuehl }) : null));
      if (D.tipp) d.appendChild(el('p', { class: 'tf-pl-tipp' }, svgIco('i-drop'), D.tipp));
      const z = el('div', { class: 'tf-bib-z' });
      if (D.quelle) z.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: D.quelle })));
      if (begriff && window.tfWissen && tfWissen.begriff(begriff)) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, svgIco('i-book'), ' ' + tfWissen.begriff(begriff).name + ' im Wissen'); b.addEventListener('click', () => tfWissen.zeige(begriff)); z.appendChild(b); }
      if (D.link && D.link.fn) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, svgIco('i-play'), ' ' + D.link.text); b.addEventListener('click', () => { D.link.fn(); T.geh(D.link.ziel); }); z.appendChild(b); }
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
    const plan = imPlan();
    const frag = [];
    // Einstieg: wie man eine Einheit liest
    const I = rowsOf('intensitaet') || [], Is = I.find((r) => r.id === 'saison');
    frag.push(el('article', { class: 'tf-card tf-bib-intro' },
      el('div', { class: 'tf-card-head' }, S.badge ? S.badge('gold', 'i-book') : null, el('div', null, el('h2', { text: 'So liest du eine Einheit' }), el('div', { class: 'tf-sub', text: ANZAHL + ' Einheiten · Form, Farbe und Zielbereich' }))),
      el('div', { class: 'tf-bib-legende' },
        ...[['green', 'locker', 'ganze Sätze sprechen geht'], ['yellow', 'zügig', 'nur noch kurze Sätze'], ['orange', 'Schwelle · Sweet Spot', 'angenehm hart, einzelne Sätze'], ['red', 'hart', 'nur noch einzelne Worte'], ['pink', 'Renntempo', 'dein geplantes Tempo'], ['purple', 'Test · Kraft', 'alles, was du hast – oder schwer']].map(([f, n, t]) => el('span', null, el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + f + ')' }), el('b', { text: n }), el('small', { text: t })))),
      el('p', { class: 'tf-bib-text', text: 'Die Form zeigt die Einheit von links nach rechts: Breite ist Zeit, Höhe ist Anstrengung, die Farbe steht für die Art. Die meisten Einheiten bleiben niedrig – das ist Absicht: Etwa 80 Prozent locker und 20 Prozent hart bringt bei Ausdauersportlern die größte Wirkung pro Stunde' + (Is && Is.z1_pct != null ? ' (bei dir in den letzten 12 Monaten ' + Is.z1_pct + ' % locker)' : '') + '. Zielbereiche rechnet die Bibliothek aus deinem Athletenprofil; der Plan wechselt die Einheiten von Woche zu Woche ab.' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014' }))));
    // Sportarten
    const seg = el('div', { class: 'tf-seg tf-bib-seg', role: 'tablist' });
    sportarten.forEach(([id, name, icon, , L]) => { const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(sport === id), 'aria-pressed': String(sport === id) }, svgIco(icon), el('span', { text: name }), el('small', { class: 'tnum', text: String(L.length) })); b.addEventListener('click', () => { sport = id; offen = null; render(); }); seg.appendChild(b); });
    frag.push(seg);
    const sp = sportarten.find(([id]) => id === sport);
    const vorhanden = GRUPPEN.filter(([g]) => sp[4].some((e) => e[4] === g));
    if (vorhanden.length > 1) {
      const ch = el('div', { class: 'tf-chipset tf-bib-gruppen', role: 'group', 'aria-label': 'Gruppe' });
      [['alle', 'Alle']].concat(vorhanden.map(([g, n]) => [g, n])).forEach(([g, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(gruppe === g) }, n); b.addEventListener('click', () => { gruppe = g; render(); }); ch.appendChild(b); });
      frag.push(ch);
    }
    vorhanden.filter(([g]) => gruppe === 'alle' || gruppe === g).forEach(([g, name, sub]) => {
      const karten = sp[4].filter((e) => e[4] === g).map(([typ, min, hart, begriff, , dauern]) => karte(sp[0], typ, min, hart, begriff, dauern, plan)).filter(Boolean);
      if (!karten.length) return;
      frag.push(el('h3', { class: 'tf-hub-sek tf-bib-sek' }, el('span', { text: name }), el('small', { text: sub + ' · ' + karten.length })));
      frag.push(el('div', { class: 'tf-bib-liste' }, ...karten));
    });
    frag.push(el('p', { class: 'tf-note', text: 'Im Plan passen sich Dauer, Wiederholungen und Zielbereiche an deine Woche an – hier siehst du die Grundform jeder Einheit. Längste Einheiten stellst du im Plan unter „Feinschliff“ ein.' }));
    box.replaceChildren(el('div', { class: 'tf-hub tf-bib-hub' }, ...frag));
  }
  T.seite('bibliothek', render);
  window.tfBibliothek = { render, anzahl: ANZAHL, katalog: SPORT };
})();
