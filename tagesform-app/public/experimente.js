/* Dreiklang · Mini-Experimente (Version 10)
   Sieben Tage lang eine Sache ausprobieren – passend zu einem Artikel unter Wissen – und dann in den eigenen Daten
   nachsehen, was sich verändert hat: die Experiment-Tage gegen die 14 Tage davor, jeweils die Nacht und der Morgen danach.
   Ein Selbstversuch über 7 Tage ist ein Hinweis, kein Beweis – „deutlich“ heißt erst ein großer Unterschied (Hedges g ≥ 0,8, p < 0,1).
   Gespeichert in rechner.wissen.exp (läuft) und rechner.wissen.expAlt (fertig: [Kennung, Start, Tage als 0/1, Ende, 'x' = abgebrochen]). */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, nf, localDate, rowsOf, svgIco, wischen } = T.ui;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const RE = /^\d{4}-\d\d-\d\d$/;
  const DAUER = 7;
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const wtag = (d) => WT[new Date(d + 'T12:00:00Z').getUTCDay()];
  const datum = (d) => +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.';

  const EXP = [
    { id: 'koffein14', name: 'Koffein nur bis 14 Uhr', begriff: 'koffein', icon: 'i-coffee', farbe: 'orange', aufgabe: 'Nach 14 Uhr kein Kaffee, schwarzer oder grüner Tee, Cola oder Energydrink.', warum: 'Koffein wirkt viele Stunden nach. Ein früher Schluss verbessert bei vielen das Einschlafen und den Tiefschlaf.', quelle: 'Drake et al., J Clin Sleep Med 2013' },
    { id: 'bildschirm', name: 'Die letzte Stunde ohne Bildschirm', begriff: 'schlafhygiene', icon: 'i-moon', farbe: 'indigo', aufgabe: 'Die letzte Stunde vor dem Schlafen ohne Handy, Laptop und Fernseher.', warum: 'Helles Bildschirmlicht am Abend verschiebt die innere Uhr – du wirst später müde und schläfst schlechter ein.', quelle: 'Chang et al., PNAS 2015' },
    { id: 'gleichzeit', name: 'Jeden Abend zur gleichen Zeit ins Bett', begriff: 'schlafrhythmus', icon: 'i-clock', farbe: 'blue', aufgabe: 'Zur selben Zeit ins Bett – höchstens 30 Minuten Abweichung, auch am Wochenende.', warum: 'Ein regelmäßiger Rhythmus macht den Schlaf erholsamer, auch wenn die Dauer gleich bleibt.', quelle: 'Phillips et al., Sci Rep 2017' },
    { id: 'atmen', name: '5 Minuten langsam atmen', begriff: 'atmung', icon: 'i-lotus', farbe: 'teal', aufgabe: 'Am Abend 5 Minuten ruhig atmen – etwa 5 Sekunden ein, 5 Sekunden aus.', warum: 'Langsames Atmen mit etwa 6 Zügen pro Minute beruhigt das Nervensystem – messbar an der HRV.', quelle: 'Laborde et al., Neurosci Biobehav Rev 2022', timer: 300 },
    { id: 'trinken', name: 'Jeden Tag dein Trinkziel', begriff: 'trinken_alltag', icon: 'i-glass', farbe: 'blue', aufgabe: 'Dein Trinkziel erreichen – über den Tag verteilt, nicht alles am Abend.', warum: 'Schon leichter Flüssigkeitsmangel drückt Stimmung, Konzentration und Energie.', quelle: 'Armstrong et al., J Nutr 2012' },
    { id: 'pausen', name: 'Jede Stunde kurz aufstehen', begriff: 'mikropausen', icon: 'i-walk', farbe: 'green', aufgabe: 'Im Sitzen jede Stunde 2–3 Minuten aufstehen und ein paar Schritte gehen.', warum: 'Kurze Pausen halten wacher und senken die Erschöpfung am Abend.', quelle: 'Albulescu et al., PLoS One 2022' },
    { id: 'alkohol', name: 'Eine Woche ohne Alkohol', begriff: 'hrv_alltag', icon: 'i-heart', farbe: 'pink', aufgabe: 'Heute keinen Alkohol.', warum: 'Schon wenig Alkohol am Abend senkt die HRV in der Nacht und macht den Schlaf weniger erholsam.', quelle: 'Pietilä et al., JMIR Ment Health 2018' },
  ];
  const BY = Object.fromEntries(EXP.map((x) => [x.id, x]));

  /* ---------- Stand ---------- */
  const WS = () => (window.tfWissen && tfWissen.stand ? tfWissen.stand() : {});
  const plus = (d, n) => M().plus(d, n);
  const ende = (e) => plus(e.start, DAUER - 1);
  function laeuft() {
    const e = WS().exp;
    if (!e || typeof e !== 'object' || !BY[e.id] || !RE.test(e.start || '')) return null;
    const im = (d) => typeof d === 'string' && RE.test(d) && d >= e.start && d <= plus(e.start, DAUER - 1);
    const tage = (Array.isArray(e.tage) ? e.tage : []).filter(im), nein = (Array.isArray(e.nein) ? e.nein : []).filter((d) => im(d) && !tage.includes(d));
    return { id: e.id, start: e.start, tage: [...new Set(tage)].sort(), nein: [...new Set(nein)].sort() };
  }
  const bits = (e) => { let s = ''; for (let i = 0; i < DAUER; i++) s += e.tage.includes(plus(e.start, i)) ? '1' : '0'; return s; };
  const ausBits = (start, b) => { const L = []; for (let i = 0; i < DAUER; i++) if (String(b).charAt(i) === '1') L.push(plus(start, i)); return L; };
  function frueher() {
    const L = Array.isArray(WS().expAlt) ? WS().expAlt : [];
    return L.filter((x) => Array.isArray(x) && BY[x[0]] && RE.test(x[1] || '') && /^[01]{7}$/.test(x[2] || '')).map((x) => ({ id: x[0], start: x[1], tage: ausBits(x[1], x[2]), ende: RE.test(x[3] || '') ? x[3] : ende({ start: x[1] }), abgebrochen: x[4] === 'x' }));
  }
  // alle erledigten Tage (für die XP im Spiel) – auch aus fertigen Experimenten, damit gesammelte XP bleiben
  function tage() {
    const S2 = new Set(), e = laeuft();
    if (e) e.tage.forEach((d) => S2.add(d));
    frueher().forEach((x) => x.tage.forEach((d) => S2.add(d)));
    return [...S2].filter((d) => d <= localDate()).sort();
  }
  const speichern = (patch) => { if (window.tfWissen && tfWissen.speichern) tfWissen.speichern(patch); T.neu(); };
  function starten(id) {
    if (!BY[id]) return;
    const alt = laeuft();
    const patch = { exp: { id, start: localDate(), tage: [] } };
    if (alt) patch.expAlt = archiv(alt, true);
    speichern(patch);
    A().toast('Gestartet – du findest dein Experiment auf Heute und bei den Quests');
  }
  function archiv(e, abgebrochen) {
    const L = (Array.isArray(WS().expAlt) ? WS().expAlt : []).filter((x) => Array.isArray(x) && !(x[0] === e.id && x[1] === e.start));
    if (e.tage.length || !abgebrochen) L.push([e.id, e.start, bits(e), localDate()].concat(abgebrochen ? ['x'] : []));
    return L.slice(-20);
  }
  function umschalten(d) {
    const e = laeuft(); if (!e || d < e.start || d > ende(e) || d > localDate()) return;
    const neu = e.tage.includes(d) ? e.tage.filter((x) => x !== d) : e.tage.concat([d]).sort();
    speichern({ exp: { id: e.id, start: e.start, tage: neu, nein: e.nein.filter((x) => x !== d) } });
    if (!e.tage.includes(d) && d === localDate()) A().toast('Tag ' + (Math.round((Date.parse(d) - Date.parse(e.start)) / 864e5) + 1) + ' geschafft · +' + ((window.tfSpielMotor && tfSpielMotor.EXP_XP) || 15) + ' XP');
  }
  // Version 11: im Morgen-Check-in „Gestern eingehalten? Ja / Nein“ – ein Schalter statt eines eigenen Menüs
  function setzen(d, an) {
    const e = laeuft(); if (!e || d < e.start || d > ende(e) || d > localDate()) return;
    const tage = an ? [...new Set(e.tage.concat([d]))].sort() : e.tage.filter((x) => x !== d);
    const nein = an ? e.nein.filter((x) => x !== d) : [...new Set(e.nein.concat([d]))].sort();
    speichern({ exp: { id: e.id, start: e.start, tage, nein } });
  }
  function checkinBlock(datum) {
    const e = laeuft(); if (!e || !RE.test(datum || '')) return null;
    const d = plus(datum, -1); if (d < e.start || d > ende(e) || d > localDate()) return null;
    const def = BY[e.id], ja = e.tage.includes(d), nein = e.nein.includes(d);
    const seg = el('div', { class: 'tf-seg tf-ck-exp-seg', role: 'group', 'aria-label': 'Gestern eingehalten?' });
    [[true, 'Ja'], [false, 'Nein']].forEach(([v, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v ? ja : nein) }, t);
      b.addEventListener('click', () => setzen(d, v));
      seg.appendChild(b);
    });
    const tagNr = Math.round((Date.parse(d) - Date.parse(e.start)) / 864e5) + 1;
    return el('div', { class: 'tf-ck-exp-in' },
      el('div', { class: 'tf-form-l2' }, el('span', { text: 'Mini-Experiment: ' + def.name }), el('b', { text: 'Tag ' + tagNr + ' von ' + DAUER })),
      el('div', { class: 'tf-ck-exp-z' }, el('span', { text: 'Gestern eingehalten?' }), seg));
  }
  function abbrechen() {
    const e = laeuft(); if (!e) return;
    speichern({ exp: null, expAlt: archiv(e, true) });
    A().toast('Experiment beendet');
  }

  /* ---------- Auswertung ---------- */
  function vergleich(x) {
    return sicher(() => M().experimentVergleich({ start: x.start, tage: x.tage, erholung: rowsOf('erholung') || [], checkins: A().raw('checkins') || [] })) || [];
  }
  // Version 11: fehlende Messungen als ruhiger Fortschritt (3 Morgen im Experiment, 5 aus den 14 Tagen davor)
  function zuWenig(r) {
    const nA = Math.min(r.nA, 3), nB = Math.min(r.nB, 5), S = window.tfSeiten;
    const text = r.nA < 3 && r.nB < 5 ? 'Noch ' + (3 - nA) + ' Morgen im Experiment und ' + (5 - nB) + ' aus den 14 Tagen davor.' : r.nA < 3 ? (3 - nA === 1 ? 'Noch 1 Morgen' : 'Noch ' + (3 - nA) + ' Morgen') + ' im Experiment, dann steht der Vergleich.' : 'Zum Vergleich fehlen ' + (5 - nB) + ' Messungen aus den 14 Tagen davor.';
    if (!S || !S.fortschritt) return el('small', { text });
    return S.fortschritt({ ist: nA + nB, soll: 8, text, sub: 'Im Experiment ' + nA + ' von 3 · davor ' + nB + ' von 5' });
  }
  function ergebnisBlatt(x) {
    const def = BY[x.id], R = vergleich(x), n = x.tage.length;
    const box = el('div', { class: 'tf-rm tf-exp-erg' });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: def.name }),
      el('p', { class: 'tf-rm-sub', text: n + ' von ' + DAUER + ' Tagen geschafft · ' + datum(x.start) + '–' + datum(plus(x.start, DAUER - 1)) + ' · verglichen mit den 14 Tagen davor, jeweils die Nacht und der Morgen danach' }));
    const fmt = (r, v) => nf(v, r.dez) + (r.einheit ? (r.einheit.charAt(0) === '/' ? r.einheit : ' ' + r.einheit) : '');
    const zeilen = R.map((r) => {
      const urteil = r.zuWenig ? ['gray', 'Zu wenig Daten'] : r.deutlich ? (r.gut ? ['green', 'Deutlich besser'] : ['orange', 'Deutlich schlechter']) : ['gray', 'Kein klarer Unterschied'];
      return el('div', { class: 'tf-exp-z' },
        el('div', { class: 'tf-exp-zk' }, el('b', { text: r.name }), el('span', { class: 'tf-exp-u', style: '--c:var(--tf-' + urteil[0] + ')', text: urteil[1] })),
        r.zuWenig ? zuWenig(r)
          : el('small', { text: 'Im Experiment ' + fmt(r, r.m1) + ' · vorher ' + fmt(r, r.m2) + (Math.abs(r.diff) > 0 ? ' (' + (r.diff > 0 ? '+' : '−') + fmt(r, Math.abs(r.diff)) + ')' : '') }));
    });
    const gut = R.filter((r) => !r.zuWenig && r.deutlich && r.gut), schlecht = R.filter((r) => !r.zuWenig && r.deutlich && !r.gut), da = R.filter((r) => !r.zuWenig);
    const fazit = !da.length ? 'Für ein Ergebnis fehlen noch Daten – trag dich morgens im Check-in ein oder synchronisiere deine Uhr. Das Ergebnis rechnet Dreiklang jedes Mal neu.'
      : gut.length ? 'Das scheint dir gutzutun: ' + gut.map((r) => r.name).join(', ') + ' deutlich besser als vorher.' + (schlecht.length ? ' Dafür ' + schlecht.map((r) => r.name).join(', ') + ' schlechter.' : '')
        : schlecht.length ? 'In diesen 7 Tagen war ' + schlecht.map((r) => r.name).join(', ') + ' schlechter als vorher – vielleicht spielte etwas anderes mit (Training, Stress, ein Infekt).'
          : 'Kein klarer Unterschied – auch das ist ein Ergebnis. In 7 Tagen zeigen sich nur große Wirkungen; kleine brauchen länger.';
    box.append(el('p', { class: 'tf-exp-fazit', text: fazit }), el('div', { class: 'tf-exp-liste' }, ...zeilen),
      el('p', { class: 'tf-note', text: 'Ein Selbstversuch ist ein Hinweis, kein Beweis: Wetter, Stress oder Training können mitspielen. „Deutlich“ heißt hier ein großer Unterschied (Effektstärke ab 0,8).' }),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: def.quelle + ' · Methode: Welch-Test, Hedges g' })));
    const nochmal = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Noch einmal 7 Tage');
    nochmal.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); starten(x.id); });
    const zu = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Fertig');
    zu.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    box.appendChild(el('div', { class: 'tf-form-actions' }, laeuft() ? null : nochmal, zu));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }
  function abschliessen() { // nach Tag 7: Ergebnis zeigen, ins Archiv, Auszeichnung ab 5 Tagen
    const e = laeuft(); if (!e) return;
    const x = { id: e.id, start: e.start, tage: e.tage, ende: localDate(), abgebrochen: false };
    speichern({ exp: null, expAlt: archiv(e, false) });
    if (e.tage.length >= 5 && window.tfSpiel && tfSpiel.auszeichnung) tfSpiel.auszeichnung({ id: 'exp:' + e.id + ':' + e.start, art: 'quest', titel: 'Mini-Experiment geschafft', name: BY[e.id].name, wert: e.tage.length + ' von ' + DAUER + ' Tagen', sub: 'Selbstversuch abgeschlossen' }, true);
    ergebnisBlatt(x);
  }

  /* ---------- Karten ---------- */
  function punkte(e) {
    const h = localDate(), box = el('div', { class: 'tf-exp-tage', role: 'group', 'aria-label': 'Deine 7 Tage' });
    for (let i = 0; i < DAUER; i++) {
      const d = plus(e.start, i), ok = e.tage.includes(d), zukunft = d > h;
      const b = el('button', { type: 'button', class: 'tf-exp-tag' + (ok ? ' ok' : '') + (d === h ? ' heute' : ''), disabled: zukunft, 'aria-pressed': String(ok), 'aria-label': wtag(d) + ', ' + datum(d) + (ok ? ': geschafft' : zukunft ? '' : ': offen') },
        el('small', { text: wtag(d) }), el('span', { class: 'tf-exp-p' }, ok ? svgIco('i-check') : null));
      if (!zukunft) b.addEventListener('click', () => umschalten(d));
      box.appendChild(b);
    }
    return box;
  }
  function karte(ort) {
    const e = laeuft(); if (!e) return null;
    const def = BY[e.id], h = localDate(), tagNr = Math.min(DAUER, Math.round((Date.parse(h) - Date.parse(e.start)) / 864e5) + 1), fertig = h > ende(e);
    const c = el('article', { class: 'tf-card tf-exp', id: ort === 'heute' ? 'karte-exp-heute' : null, style: '--c:var(--tf-' + def.farbe + ')' });
    const kopf = el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-' + def.farbe + ')' }, svgIco(def.icon)),
      el('div', null, el('h2', { text: fertig ? 'Dein Experiment ist fertig' : 'Mini-Experiment · Tag ' + tagNr + ' von ' + DAUER }), el('div', { class: 'tf-sub', text: def.name })));
    c.appendChild(kopf);
    if (fertig) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-bars'), ' Ergebnis ansehen');
      b.addEventListener('click', abschliessen);
      c.append(el('p', { class: 'tf-exp-t', text: e.tage.length + ' von ' + DAUER + ' Tagen geschafft. Jetzt zeigt Dreiklang, was sich in deinen Daten verändert hat.' }), el('div', { class: 'tf-form-actions' }, b));
      return c;
    }
    const heuteOk = e.tage.includes(h);
    const zeile = el('button', { type: 'button', class: 'tf-ab-c tf-exp-heute' + (heuteOk ? ' ok' : ''), 'aria-pressed': String(heuteOk) }, el('span', { class: 'tf-ab-box' }, svgIco('i-check')), el('span', null, el('b', { text: heuteOk ? 'Heute geschafft' : 'Heute' }), el('small', { text: def.aufgabe })));
    zeile.addEventListener('click', () => umschalten(h));
    if (wischen && !heuteOk) wischen(zeile, () => umschalten(h), { text: 'Geschafft' });
    c.append(zeile, punkte(e));
    const akt = el('div', { class: 'tf-form-actions' });
    if (def.timer && window.tfTimer) { const t = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, svgIco('i-timer'), ' 5-Minuten-Timer'); t.addEventListener('click', () => tfTimer.start({ titel: 'Langsam atmen', sub: 'Etwa 5 Sekunden ein, 5 Sekunden aus', phasen: [{ name: 'Atmen', sek: def.timer, art: 'arbeit' }], farbe: 'teal' })); akt.appendChild(t); }
    const w = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, svgIco('i-book'), ' Worum geht’s?');
    w.addEventListener('click', () => (window.tfWissen ? tfWissen.zeige(def.begriff) : null));
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, 'Beenden');
    ab.addEventListener('click', abbrechen);
    akt.append(w, ab);
    c.appendChild(akt);
    return c;
  }
  // unter einem Wissen-Artikel: das passende Experiment
  function zuBegriff(bid) {
    const def = EXP.find((x) => x.begriff === bid); if (!def) return null;
    const e = laeuft(), auch = e && e.id === def.id;
    const c = el('div', { class: 'tf-exp-mini', style: '--c:var(--tf-' + def.farbe + ')' },
      el('div', { class: 'tf-exp-mini-k' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + def.farbe + ')' }, svgIco('i-flask')), el('small', { text: 'Mini-Experiment · 7 Tage' })),
      el('b', { text: def.name }), el('p', { text: def.aufgabe + ' ' + def.warum }));
    if (auch) c.appendChild(el('p', { class: 'tf-exp-mini-s', text: 'Läuft gerade – Tag ' + (Math.min(DAUER, Math.round((Date.parse(localDate()) - Date.parse(e.start)) / 864e5) + 1)) + ' von ' + DAUER + '.' }));
    else {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-btn-klein' }, svgIco('i-flask'), ' 7 Tage ausprobieren');
      b.addEventListener('click', () => { starten(def.id); if (window.tfWissen) tfWissen.schliessen(); }); // ein laufendes Experiment endet dabei (Hinweis darunter)
      c.append(el('div', { class: 'tf-form-actions' }, b));
      if (e) c.append(el('small', { class: 'tf-ich-hint', text: 'Dein laufendes Experiment „' + BY[e.id].name + '“ wird dann beendet.' }));
    }
    return c;
  }
  // Wissen → Schnellfilter „Mini-Experimente“
  function liste() {
    const box = el('div', { class: 'tf-exp-uebersicht' });
    box.appendChild(el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Mini-Experimente', el('small', { text: '7 Tage ausprobieren, dann zeigen deine Daten, was es bringt' })));
    const k = karte('wissen'); if (k) box.appendChild(k);
    const e = laeuft();
    const L = el('div', { class: 'tf-links tf-exp-l' });
    EXP.forEach((def) => {
      const an = e && e.id === def.id;
      const z = el('div', { class: 'tf-zeile tf-exp-r' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + def.farbe + ')' }, svgIco(def.icon)),
        el('span', { class: 'tf-zeile-t' }, el('b', { text: def.name }), el('small', { text: def.aufgabe })));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' + (an ? '' : ' tf-btn-primary'), disabled: an }, an ? 'Läuft' : 'Starten');
      b.setAttribute('aria-label', (an ? 'Läuft: ' : 'Starten: ') + def.name);
      if (!an) b.addEventListener('click', () => starten(def.id));
      z.appendChild(b);
      L.appendChild(z);
    });
    box.appendChild(L);
    if (e) box.appendChild(el('p', { class: 'tf-note', text: 'Es läuft immer nur ein Experiment – startest du ein neues, endet das alte.' }));
    const F = frueher().slice().reverse();
    if (F.length) {
      box.appendChild(el('h2', { class: 'tf-hub-sek tf-w-sek2 tf-sek-unter' }, 'Deine Ergebnisse', el('small', { text: F.length + (F.length === 1 ? ' Experiment' : ' Experimente') })));
      box.appendChild(el('div', { class: 'tf-links' }, ...F.map((x) => {
        const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + BY[x.id].farbe + ')' }, svgIco(BY[x.id].icon)),
          el('span', { class: 'tf-zeile-t' }, el('b', { text: BY[x.id].name }), el('small', { text: datum(x.start) + ' · ' + x.tage.length + ' von ' + DAUER + ' Tagen' + (x.abgebrochen ? ' · vorzeitig beendet' : '') })), svgIco('i-chev'));
        b.lastChild.classList.add('tf-chev');
        b.addEventListener('click', () => ergebnisBlatt(x));
        return b;
      })));
    }
    box.appendChild(el('p', { class: 'tf-note', text: 'Für jeden geschafften Tag gibt es ' + ((window.tfSpielMotor && tfSpielMotor.EXP_XP) || 15) + ' XP. Verglichen werden Schlaf, HRV, Ruhepuls, Tune und dein Befinden im Check-in – jeweils am Morgen danach.' }));
    return box;
  }

  /* ---------- Heute ---------- */
  function heute() {
    const box = $('#home-hinweise2'); if (!box) return;
    const alt = box.querySelector('#karte-exp-heute');
    const k = karte('heute');
    if (!k) { if (alt) alt.remove(); return; }
    if (alt) alt.replaceWith(k); else box.prepend(k);
  }

  T.zusatz('heute', () => sicher(heute));
  window.tfExperimente = { EXP, laeuft, tage, starten, abbrechen, umschalten, setzen, checkinBlock, karte, zuBegriff, liste, ergebnis: ergebnisBlatt, frueher };
})();
