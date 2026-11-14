/* Dreiklang · Startseite (Version 10, ergänzt in 11 und 12 – neu geordnet in Version 51)
   Heute zeigt drei Dinge, immer in dieser Reihenfolge: den Tune, was heute ansteht (und was schon war, mit dem Weg in
   die Analyse) und die Woche (Karten „Heute“ und „Diese Woche“ aus plan.js). Die Reihenfolge ändert sich nie.
   1. Ganz oben nur, was den Tune betrifft: veraltete Daten, Warnungen (Schutzmodus, Überlastung), der Pause-Modus.
      Direkt am Tune hängt der Check-in, solange er fehlt – er macht den Wert genauer.
   2. „Jetzt dran“: Was gerade etwas von dir will – Körper-Check, dein Abend, „Heute wichtig“, Nachtragen, Willkommen
      zurück, Schnellstart, Tour, Profil –, steht als schmale Zeile unter der Woche. Ein Tipp klappt die Karte auf.
      Höchstens drei Zeilen, der Rest liegt hinter „Weitere“.
   3. Favoriten: Mit der Stecknadel bestimmst du bis zu 4 Bereiche, die offen darunter stehen. Alles andere liegt
      eingeklappt unter „Mehr für heute“ – in der Reihenfolge der Tageszeit. Gespeichert in rechner.start. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { el, svgIco } = T.ui;
  const A = () => dash.app;
  const q = (s) => document.querySelector('#heute ' + s);

  // Bausteine hinter „Mehr für heute“: Kennung, Name, Symbol, Knoten (Überschrift gehört zu ihrem Inhalt)
  const TEILE = [
    ['kennzahlen', 'Kennzahlen', 'i-gauge', () => [q('#home-facts')]], // Version 21: Kacheln eigener Block, liegt hinter „Mehr“
    ['wichtig', 'Heute wichtig', 'i-list', () => [q('#home-morgen')]],
    ['koerper', 'Körper-Check', 'i-body', () => [q('#home-koerper')]], // Version 24: abends „jetzt dran“, bis er notiert ist
    ['abend', 'Dein Abend', 'i-moon', () => [q('#home-abend')]],
    ['mittag', 'Nachmittagstief', 'i-coffee', () => [q('#home-mittag')]],
    ['tag', 'Dein Tag', 'i-sun', () => [q('#home-tag')]],
    ['notiert', 'Wasser, Protein & Koffein', 'i-glass', () => [q('#home-notiert')]],
    ['spiel', 'Level & Quests', 'i-star', () => [q('#home-spiel')]],
    ['hinweise', 'Tipps & Wissen für heute', 'i-book', () => [q('#home-hinweise2')]],
    ['rueckblick', 'Rückblicke', 'i-karten', () => [q('#home-rueckblick')]],
    ['bereiche', 'Bereiche', 'i-list', () => { const n = q('#home-apps'); return [n && n.previousElementSibling && n.previousElementSibling.matches('h2') ? n.previousElementSibling : null, n]; }],
    ['empfehlung', 'Empfehlung fürs Training', 'i-target', () => [q('#karte-empfehlung')]],
    ['erkenntnisse', 'Was deine Daten sagen', 'i-muster', () => [q('#erkenntnisse-heute-titel'), q('#erkenntnisse-heute')]],
  ];
  const NAME = Object.fromEntries(TEILE.map((t) => [t[0], t]));
  const OBEN = ['#home-datenstand', '#home-hinweise', '#home-pause', '#home-hero']; // was den Tune betrifft – und der Tune
  const KERN = ['#home-kern']; // „Heute“ und „Diese Woche“ (#home-plan, #home-woche) – am Laptop nebeneinander
  // feste Hinweise, die nur da sind, wenn sie etwas wollen: Kennung, Name, Symbol, Knoten, Unterzeile
  const HINWEIS = [
    ['zurueck', 'Willkommen zurück', 'i-sun', '#home-zurueck', 'Sanft wieder einsteigen?'],
    ['nachtrag', 'Gestern nachtragen', 'i-clock', '#home-nachtrag', 'Bis 12 Uhr – Serie und Statistik bleiben ganz'],
    ['schnell', 'Schnellstart', 'i-play', '#home-schnell', 'Zu deiner gewohnten Zeit'],
    ['tutorial', 'Geführte Tour', 'i-book', '#home-tutorial', 'Die App in ein paar Minuten erklärt'],
  ];
  const DRAN_SUB = { wichtig: 'Deine Punkte von gestern Abend', koerper: 'Wie fühlt sich dein Körper an?', abend: 'Tagesabschluss in zwei Minuten', hinweise: 'Dein Experiment läuft' };
  const BANNER = ['#checkin-banner', '#profil-banner']; // schon Zeilen: führen direkt zum Check-in (hängt am Tune) und zum Profil
  const MAX_PINS = 4, MAX_DRAN = 3;
  // Reihenfolge je Tageszeit – für „Jetzt dran“ und für das, was hinter „Mehr“ liegt
  const ZEIT = {
    morgen: ['wichtig', 'kennzahlen', 'tag', 'notiert', 'koerper', 'spiel', 'hinweise', 'empfehlung', 'rueckblick', 'bereiche', 'erkenntnisse', 'mittag', 'abend'],
    tag: ['wichtig', 'mittag', 'kennzahlen', 'koerper', 'tag', 'notiert', 'spiel', 'empfehlung', 'hinweise', 'rueckblick', 'bereiche', 'erkenntnisse', 'abend'],
    abend: ['koerper', 'abend', 'wichtig', 'kennzahlen', 'tag', 'notiert', 'spiel', 'rueckblick', 'hinweise', 'bereiche', 'empfehlung', 'erkenntnisse', 'mittag'], // Version 24: Körper-Check vor dem Abend
  };
  // Version 19: Der Abend beginnt drei Stunden vor deiner eigenen Bettzeit (Profil → Schlaf & Abend), sonst um 19 Uhr
  const abendAb = () => { try { return window.tfTageslauf && tfTageslauf.abendAb ? tfTageslauf.abendAb() : 19 * 60; } catch (e) { return 19 * 60; } };
  const tageszeit = (d) => { const x = d || new Date(), h = x.getHours(), m = h * 60 + x.getMinutes(); return m >= abendAb() || h < 4 ? 'abend' : h < 11 ? 'morgen' : 'tag'; };

  function einstellung() {
    const s = (A().state.rechner || {}).start;
    const pins = s && Array.isArray(s.pins) ? s.pins.filter((p) => NAME[p]).slice(0, MAX_PINS) : [];
    return { pins, zeit: !(s && s.zeit === false) };
  }
  let saveT = null;
  function speichern(neu) {
    A().setRechner(Object.assign({}, A().state.rechner || {}, { start: neu }));
    clearTimeout(saveT);
    saveT = setTimeout(() => A().api('POST', '/api/rechner', { start: neu }).catch((e) => A().toast('Nicht gespeichert: ' + e.message)), 400);
  }
  let offen = false; // „Mehr für heute“ aufgeklappt (bis zum nächsten Öffnen der App)
  let aufDran = null, mehrDran = false; // welche Zeile unter „Jetzt dran“ offen ist · ob „Weitere“ aufgeklappt ist
  let verlassen = false; // Heute wurde verlassen – beim Zurückkommen klappt eine erledigte Karte zu
  const JETZT = ['wichtig', 'abend']; // gibt es nur, wenn sie gerade dran sind (das Nachmittagstief ist ein Angebot, kein Termin – es liegt unter „Mehr“)
  const ZEILEN = new Map(); // die Zeilen bleiben dieselben Knoten – Fokus und Tastatur springen nicht

  function dranZeile(id, name, icon, sub) {
    let b = ZEILEN.get(id);
    if (!b) {
      b = el('button', { type: 'button', class: 'tf-card tf-banner tf-dran', 'data-dran': id },
        el('span', { class: 'tf-badge' }, svgIco(icon)), el('span', { class: 'tf-banner-t' }, el('b'), el('small')), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev');
      b.addEventListener('click', () => {
        aufDran = aufDran === id ? null : id; ordnen();
        if (aufDran) requestAnimationFrame(() => b.scrollIntoView({ block: 'nearest', behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
      });
      ZEILEN.set(id, b);
    }
    b.querySelector('b').textContent = name;
    const s = b.querySelector('small'); s.textContent = sub || ''; s.hidden = !sub;
    b.setAttribute('aria-expanded', String(aufDran === id));
    return b;
  }

  function ordnen() {
    const sec = document.getElementById('heute'); if (!sec) return;
    const E = einstellung(), zeit = tageszeit();
    sec.dataset.tageszeit = zeit;
    const reihe = (E.zeit ? ZEIT[zeit] : ZEIT.tag).filter((id) => !E.pins.includes(id));
    const knoten = (id) => NAME[id][3]().filter(Boolean);
    const voll = (n) => !!n && !n.hidden && (n.childElementCount > 0 || n.matches('button, nav, h2'));
    const bekannt = new Set();
    OBEN.concat(KERN, BANNER, HINWEIS.map((h) => h[3])).forEach((s) => { const n = q(s); if (n) bekannt.add(n); });
    TEILE.forEach((t) => knoten(t[0]).forEach((n) => bekannt.add(n)));
    ZEILEN.forEach((b) => bekannt.add(b));
    let kopf = sec.querySelector('.tf-start-kopf'), trenner = sec.querySelector('.tf-start-alle'), fuss = sec.querySelector('.tf-start-fuss'), weitere = sec.querySelector('.tf-dran-mehr');
    if (!kopf) kopf = el('div', { class: 'tf-start-kopf' });
    if (!trenner) trenner = el('div', { class: 'tf-start-alle' });
    if (!fuss) fuss = el('div', { class: 'tf-start-fuss' });
    if (!weitere) { weitere = el('button', { type: 'button', class: 'tf-gym-link tf-dran-mehr' }); weitere.addEventListener('click', () => { mehrDran = !mehrDran; ordnen(); }); }
    const fremd = [...sec.children].filter((n) => !bekannt.has(n) && n !== kopf && n !== trenner && n !== fuss && n !== weitere);
    // „Jetzt dran“: was nur zu dieser Tageszeit da ist, feste Hinweise und das Profil – der Check-in hängt am Tune
    const dranJetzt = (id) => JETZT.includes(id) || knoten(id).some((n) => n.querySelector('#karte-exp-heute, .tf-jetzt, .tf-zeile-ank')); // laufendes Experiment und Renn-Ankündigung (7, 2, 1 Tag vorher) zählen auch
    if (verlassen) { verlassen = false; if (aufDran && NAME[aufDran] && !dranJetzt(aufDran)) aufDran = null; } // zurück auf Heute: Erledigtes klappt zu
    // Eine offene Zeile bleibt, auch wenn ihre Karte gerade erledigt wurde (Körper-Check notiert) – sie verschwindet nicht unter dem Finger
    const istJetzt = (id) => knoten(id).some(voll) && (dranJetzt(id) || id === aufDran);
    const dran = []; // [Zeile, Knoten der Karte | null]
    const fest = (h) => { const n = q(h[3]); if (voll(n)) dran.push({ id: h[0], zeile: dranZeile(h[0], h[1], h[2], h[4]), karten: [n] }); };
    const ank = (id) => { const a = knoten(id).map((n) => n.querySelector('.tf-zeile-ank b')).find(Boolean); return a ? a.textContent : null; }; // die Ankündigung selbst ist die Unterzeile
    const teil = (id) => dran.push({ id, zeile: dranZeile(id, NAME[id][1], NAME[id][2], ank(id) || DRAN_SUB[id]), karten: knoten(id) });
    const jetztIds = reihe.filter(istJetzt);
    jetztIds.forEach(teil); HINWEIS.forEach(fest);
    const profil = q('#profil-banner'); if (profil && !profil.hidden) dran.push({ zeile: profil, karten: [] });
    if (aufDran && !dran.some((d) => d.id === aufDran)) aufDran = null; // die Karte ist erledigt oder weg
    const zeigen = mehrDran || dran.length <= MAX_DRAN ? dran : dran.slice(0, MAX_DRAN - 1).concat(dran.filter((d, i) => i >= MAX_DRAN - 1 && d.id && d.id === aufDran));
    const rest = dran.filter((d) => !zeigen.includes(d));
    weitere.textContent = mehrDran ? 'Weniger anzeigen' : rest.length === 1 ? 'Eine weitere' : rest.length + ' weitere';
    weitere.setAttribute('aria-expanded', String(mehrDran));
    // Kopf über den Favoriten
    kopf.replaceChildren();
    if (E.pins.length) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, 'Bearbeiten');
      b.addEventListener('click', anpassen);
      kopf.append(el('h2', { class: 'tf-start-t' }, svgIco('i-nadel'), ' Favoriten'), b);
    }
    // Trenner „Mehr“: alles Übrige liegt eingeklappt darunter (Version 20)
    trenner.replaceChildren();
    const zu = reihe.filter((id) => !jetztIds.includes(id)).filter((id) => knoten(id).some(voll));
    if (zu.length) { // die Unterzeile sagt, was darunter liegt – keine nackte Zahl
      const namen = zu.map((id) => NAME[id][1]), sub = namen.slice(0, 2).concat(namen.length > 2 ? [(namen.length - 2) + ' weitere'] : []).join(' · ');
      const b = el('button', { type: 'button', class: 'tf-start-alle-b', 'aria-expanded': String(offen) }, el('span', { class: 'tf-start-alle-t' }, el('b', { text: offen ? 'Weniger anzeigen' : 'Mehr für heute' }), offen ? null : el('small', { text: sub })), svgIco('i-chev'));
      b.addEventListener('click', () => { offen = !offen; ordnen(); if (offen) b.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      trenner.appendChild(b);
    }
    const anpassK = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-start-anpassen' }, svgIco('i-nadel'), ' Startseite anpassen');
    anpassK.addEventListener('click', anpassen);
    fuss.replaceChildren(anpassK);
    // neu aufbauen: oben · Tune · Check-in · Heute · Diese Woche · jetzt dran · Favoriten · Mehr · Fremdes · Fuß
    // Klassen nur anfassen, wenn sich etwas ändert – jedes Schreiben weckt sonst den Beobachter unten (Dauerschleife)
    const klasse = (n, k, an) => { if (n.classList.contains(k) !== an) n.classList.toggle(k, an); };
    const folge = [], zuKlasse = (n, an) => { klasse(n, 'tf-start-pin', false); klasse(n, 'tf-start-zu', an); };
    OBEN.forEach((s) => { const n = q(s); if (n) folge.push(n); });
    const ck = q('#checkin-banner'); if (ck) folge.push(ck);
    KERN.forEach((s) => { const n = q(s); if (n) folge.push(n); });
    zeigen.forEach((d) => { klasse(d.zeile, 'tf-start-zu', false); folge.push(d.zeile); d.karten.forEach((n) => { zuKlasse(n, d.id !== aufDran); folge.push(n); }); });
    if (rest.length || (mehrDran && dran.length > MAX_DRAN)) folge.push(weitere);
    rest.forEach((d) => { klasse(d.zeile, 'tf-start-zu', true); folge.push(d.zeile); d.karten.forEach((n) => { zuKlasse(n, true); folge.push(n); }); });
    ZEILEN.forEach((b, id) => { if (!dran.some((d) => d.id === id)) b.remove(); }); // Zeilen ohne Karte verschwinden
    BANNER.concat(HINWEIS.map((h) => h[3])).forEach((s) => { const n = q(s); if (n && !folge.includes(n)) folge.push(n); }); // leer oder ausgeblendet – bleiben an ihrem Platz im Dokument
    if (E.pins.length) folge.push(kopf);
    E.pins.forEach((id) => knoten(id).forEach((n) => { klasse(n, 'tf-start-zu', false); klasse(n, 'tf-start-pin', true); folge.push(n); }));
    if (zu.length) folge.push(trenner);
    reihe.filter((id) => !jetztIds.includes(id)).forEach((id) => knoten(id).forEach((n) => { zuKlasse(n, !offen); folge.push(n); }));
    fremd.forEach((n) => folge.push(n));
    folge.push(fuss);
    // nur umhängen, was nicht schon an der richtigen Stelle steht (Fokus und Scroll bleiben ruhig)
    let vor = null;
    folge.forEach((n) => { const soll = vor ? vor.nextSibling : sec.firstChild; if (n !== soll) sec.insertBefore(n, soll); vor = n; });
    if (!folge.includes(weitere)) weitere.remove();
    if (!folge.includes(kopf)) kopf.remove();
    if (!folge.includes(trenner)) trenner.remove();
    beobachten(sec);
    if (waechter) waechter.takeRecords(); // was dieses Ordnen selbst geändert hat, ist kein Anlass, noch einmal zu ordnen
  }
  /* Karten kommen und gehen, ohne dass Heute neu gezeichnet wird (Körper-Check notiert, Abend ausgeblendet, Nachmittagstief
     weggeklickt). Dann zieht die Zeile mit: ein Beobachter ordnet neu, sobald sich der Inhalt einer Karte ändert. */
  let waechter = null, wartet = false;
  function beobachten(sec) {
    if (waechter || typeof MutationObserver !== 'function') return;
    waechter = new MutationObserver(() => {
      if (wartet) return; wartet = true;
      requestAnimationFrame(() => { wartet = false; if (!T.tab || T.tab() === 'heute') ordnen(); });
    });
    HINWEIS.map((h) => h[3]).concat(['#home-morgen', '#home-koerper', '#home-abend', '#home-mittag', '#home-hinweise2']).forEach((s) => { const n = sec.querySelector(s); if (n) waechter.observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); });
    BANNER.forEach((s) => { const n = sec.querySelector(s); if (n) waechter.observe(n, { attributes: true, attributeFilter: ['hidden'] }); });
  }

  // Blatt „Startseite anpassen“: Stecknadeln setzen, Reihenfolge nach Tageszeit an/aus
  function anpassen() {
    const E = einstellung(), pins = E.pins.slice();
    let zeit = E.zeit;
    const box = el('div', { class: 'tf-rm tf-start-blatt' });
    const liste = el('div', { class: 'tf-start-l' });
    const hinweis = el('p', { class: 'tf-note' });
    const malen = () => {
      liste.replaceChildren(...TEILE.map(([id, name, icon]) => {
        const an = pins.includes(id), voll = !an && pins.length >= MAX_PINS;
        const b = el('button', { type: 'button', class: 'tf-start-z' + (an ? ' an' : ''), 'aria-pressed': String(an), disabled: voll },
          el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + (an ? 'pink' : 'blue') + ')' }, svgIco(icon)),
          el('span', { class: 'tf-start-zn' }, el('b', { text: name }), an ? el('small', { text: 'Favorit ' + (pins.indexOf(id) + 1) }) : null),
          el('span', { class: 'tf-start-nadel', 'aria-hidden': 'true' }, svgIco('i-nadel')));
        b.addEventListener('click', () => { const i = pins.indexOf(id); if (i >= 0) pins.splice(i, 1); else if (pins.length < MAX_PINS) pins.push(id); malen(); });
        return b;
      }));
      hinweis.textContent = pins.length ? pins.length + ' von ' + MAX_PINS + ' Favoriten – sie stehen in dieser Reihenfolge offen unter deiner Woche. Alles andere liegt unter „Mehr für heute“.' : 'Tippe auf bis zu ' + MAX_PINS + ' Bereiche, die immer offen unter deiner Woche stehen sollen.';
    };
    const sw = el('label', { class: 'tf-switch' }, el('input', { type: 'checkbox', checked: zeit }), el('span', { class: 'tf-switch-ui' }), el('span', null, 'Nach Tageszeit ordnen', el('small', { text: 'Was zur Tageszeit passt, steht unter „Mehr für heute“ zuerst' })));
    sw.querySelector('input').addEventListener('change', (e) => { zeit = e.target.checked; });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Fertig');
    ok.addEventListener('click', () => { speichern({ pins: pins.slice(0, MAX_PINS), zeit }); offen = false; if (window.tfWissen) tfWissen.schliessen(); ordnen(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    const weg = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Alle Favoriten entfernen');
    weg.addEventListener('click', () => { pins.splice(0, pins.length); malen(); });
    malen();
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Startseite anpassen' }), el('p', { class: 'tf-rm-sub', text: 'Tune, Heute und Diese Woche stehen immer oben – in dieser Reihenfolge. Mit der Stecknadel legst du fest, was darunter offen bleibt.' }), liste, hinweis, sw, el('div', { class: 'tf-form-actions' }, ok, weg));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  // zur vollen Stunde neu ordnen, wenn die Tageszeit wechselt (App bleibt oft lange offen)
  let zuletzt = tageszeit();
  setInterval(() => { const z = tageszeit(); if (z !== zuletzt) { zuletzt = z; aufDran = null; if (T.tab && T.tab() === 'heute') T.neu(); } }, 60 * 1000);

  /* ---------- Seitenleiste am Laptop (Version 15) ----------
     Oben die Marke, darunter die Bereiche. Unten die Zeitnahme-Tafel – wie an der Startlinie: die Tage bis zu deinem
     Rennen in Punkt-Ziffern, darunter, wo du im Plan stehst (der pinke Punkt bist du, heute), und dein Nordstern –
     die eine Zahl, auf die du hinarbeitest (FTP, sonst Fitness-Alter, sonst Tune). Ganz unten die Verbindung. */
  const DATUM = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  const sicherS = (fn) => { try { return fn(); } catch (e) { return null; } };
  let tafelAn = false;
  function seitenleiste() {
    const d = document.getElementById('seite-datum'); if (d) d.textContent = DATUM.format(new Date());
    const v = document.getElementById('seite-verbindung'), ohne = !!(T.ohne && T.ohne());
    if (v) v.replaceChildren(el('i', { class: 'tf-seite-punkt' + (ohne ? '' : ' an'), 'aria-hidden': 'true' }), el('span', null, el('b', { text: ohne ? 'Ohne Garmin' : 'Garmin verbunden' }), el('small', { text: 'Nur für dich sichtbar' })));
    const n = document.getElementById('nordstern'), S = window.tfSeiten; if (!n || !S || !S.punktMatrix) return;
    const a = (T.ui.rowsOf('athlet') || [])[0] || {}, FA = T.ui.rowsOf('fitness_alter'), fa = FA && FA[FA.length - 1];
    let wert = null, u = '', sub = '';
    if (a.ftp_ref_w && (!window.tfAlltag || !tfAlltag.modus || tfAlltag.modus() !== 'alltag')) { wert = String(Math.round(a.ftp_ref_w)); u = 'W'; sub = 'Schwellenleistung (FTP)'; }
    else if (fa && fa.status === 'ok' && fa.fitness_alter != null) { wert = String(Math.round(fa.fitness_alter)); u = 'Jahre'; sub = 'Fitness-Alter'; }
    else { const h = (T.ui.rowsOf('heute') || [])[0]; if (h && h.score != null) { wert = String(h.score); u = '%'; sub = 'Tune heute'; } }
    const sz = (T.ui.rowsOf('saison') || [])[0];
    const renn = sz && sz.ziel_tage != null && sz.ziel_tage >= 0 ? { tage: sz.ziel_tage, name: sz.ziel_name, datum: sz.ziel_datum_txt }
      : sz && sz.naechstes && sz.naechstes.in_tagen >= 0 ? { tage: sz.naechstes.in_tagen, name: sz.naechstes.name, datum: sz.naechstes.datum_txt } : null;
    n.hidden = !wert && !renn;
    if (n.hidden) return;
    const teile = [];
    if (renn) {
      const tage = Math.round(renn.tage);
      teile.push(el('div', { class: 'tf-tafel-kopf' }, el('span', { text: renn.name || 'Dein Rennen' }), el('small', { text: renn.datum || '' })),
        el('div', { class: 'tf-tafel-z' }, S.punktMatrix(String(tage), (renn.name || 'Rennen') + ': noch ' + tage + (tage === 1 ? ' Tag' : ' Tage')), el('small', { text: tage === 0 ? 'Renntag' : tage === 1 ? 'Tag' : 'Tage' })));
      const I = window.tfPlan && tfPlan.info ? sicherS(() => tfPlan.info()) : null;
      if (I && I.woche && I.N && I.start) {
        const tg = (Date.parse(T.ui.localDate() + 'T12:00:00Z') - Date.parse(I.start + 'T12:00:00Z')) / 864e5, anteil = Math.max(0, Math.min(1, tg / (I.N * 7)));
        const spur = el('div', { class: 'tf-tafel-spur', role: 'img', 'aria-label': 'Plan: Woche ' + I.woche + ' von ' + I.N }, el('i', { class: 'fort' }), el('i', { class: 'du' }));
        spur.style.setProperty('--anteil', (anteil * 100).toFixed(1) + '%');
        teile.push(spur, el('small', { class: 'tf-tafel-u', text: 'Woche ' + I.woche + ' von ' + I.N + (I.phase ? ' · ' + I.phase : '') }));
      }
    }
    if (wert) teile.push(el('div', { class: 'tf-tafel-ns' + (renn ? '' : ' allein') }, el('span', { class: 'tf-tafel-nst' }, el('span', { text: 'Nordstern' }), el('small', { text: sub === 'Schwellenleistung (FTP)' ? 'FTP' : sub })),
      el('span', { class: 'tf-tafel-nsz' }, S.punktMatrix(wert, sub + ': ' + wert + ' ' + u), el('small', { text: u }))));
    n.replaceChildren(...teile);
    // Einmal pro Sitzung schalten sich die Punkte der Tage von links nach rechts ein – wie eine Anzeige an der Startlinie
    if (renn && !tafelAn) {
      tafelAn = true;
      n.querySelectorAll('.tf-tafel-z .an').forEach((k) => k.style.setProperty('--x', Math.round(+k.getAttribute('cx') || 0)));
      n.classList.add('tf-tafel-erst'); setTimeout(() => n.classList.remove('tf-tafel-erst'), 1800);
    }
  }
  T.zusatz('heute', ordnen);
  T.zusatz('*', seitenleiste);
  T.zusatz('*', (seite) => { if (seite !== 'heute') verlassen = true; }); // jede andere Seite zählt als „Heute verlassen“
  function aufklappen(n) { // Version 20: ein Element hinter „Mehr für heute“ sichtbar machen (Tour, Links) – true, wenn geöffnet wurde
    const zu = n && n.closest ? n.closest('#heute .tf-start-zu') : null; if (!zu) return false;
    const z = zu.previousElementSibling && zu.previousElementSibling.matches('.tf-dran[data-dran]') ? zu.previousElementSibling : null; // Version 51: die Karte hängt an einer Zeile unter „Jetzt dran“
    if (z) { if (z.classList.contains('tf-start-zu')) mehrDran = true; aufDran = z.dataset.dran; ordnen(); return true; }
    if (offen) return false;
    offen = true; ordnen(); return true;
  }
  window.tfStart = { ordnen, anpassen, tageszeit, einstellung, aufklappen };
})();
