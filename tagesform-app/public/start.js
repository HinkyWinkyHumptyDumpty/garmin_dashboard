/* Dreiklang · Startseite (Version 10, ergänzt in 11 und 12)
   1. Karten, die mit der Tageszeit atmen: Morgens stehen Check-in, Tune und dein Plan oben, tagsüber dein Tag,
      ab 19 Uhr rücken Trainings-Empfehlung und Plan nach unten – oben stehen dann Abend-Rückblick und Schlafenszeit.
   2. Favoriten: Mit der Stecknadel bestimmst du bis zu 4 Bereiche, die immer ganz oben stehen. Alles andere liegt
      aufgeräumt unter „Alle Kategorien einblenden“. Gespeichert in rechner.start (geräteübergreifend).
   Hinweise, die wichtig sind (Check-in, Frühwarnung, Pause-Modus), bleiben immer oben und lassen sich nicht wegklappen. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { el, svgIco } = T.ui;
  const A = () => dash.app;
  const q = (s) => document.querySelector('#heute ' + s);

  // Bausteine: Kennung, Name, Symbol, Knoten (Überschrift gehört zu ihrem Inhalt)
  const TEILE = [
    ['tagesform', 'Tune', 'i-ring', () => [q('#home-hero')]],
    ['kennzahlen', 'Kennzahlen', 'i-gauge', () => [q('#home-facts')]], // Version 21: Kacheln eigener Block, liegt hinter „Mehr“
    ['wichtig', 'Heute wichtig (von gestern Abend)', 'i-list', () => [q('#home-morgen')]],
    ['koerper', 'Körper-Check (Regeneration)', 'i-body', () => [q('#home-koerper')]], // Version 24: abends zuerst, bis er notiert ist
    ['abend', 'Dein Abend & Tagesabschluss', 'i-moon', () => [q('#home-abend')]],
    ['mittag', 'Nachmittagstief', 'i-coffee', () => [q('#home-mittag')]],
    ['tag', 'Dein Tag', 'i-sun', () => [q('#home-tag')]],
    ['notiert', 'Wasser, Protein & Koffein', 'i-glass', () => [q('#home-notiert')]],
    ['spiel', 'Level & Quests', 'i-star', () => [q('#home-spiel')]],
    ['plan', 'Heute im Plan', 'i-cal', () => [q('#home-plan')]],
    ['hinweise', 'Tipps & Wissen für heute', 'i-book', () => [q('#home-hinweise2')]],
    ['rueckblick', 'Rückblicke', 'i-karten', () => [q('#home-rueckblick')]],
    ['bereiche', 'Bereiche', 'i-list', () => { const n = q('#home-apps'); return [n && n.previousElementSibling && n.previousElementSibling.matches('h2') ? n.previousElementSibling : null, n]; }],
    ['empfehlung', 'Empfehlung fürs Training', 'i-target', () => [q('#karte-empfehlung')]],
    ['erkenntnisse', 'Was deine Daten sagen', 'i-muster', () => [q('#erkenntnisse-heute-titel'), q('#erkenntnisse-heute')]],
  ];
  const NAME = Object.fromEntries(TEILE.map((t) => [t[0], t]));
  const FEST = ['#home-zurueck', '#home-datenstand', '#checkin-banner', '#home-trainiert', '#home-tutorial', '#home-planbanner', '#profil-banner', '#home-hinweise', '#home-pause', '#home-nachtrag', '#home-schnell']; // immer oben (Version 11: Willkommen zurück; Pause und Warnungen vor Nachtragen und Schnellstart) // Version 25: „Heute trainiert“ steht oben, sobald es eine Einheit gibt
  const MAX_PINS = 4;
  // Reihenfolge je Tageszeit – was gerade dran ist, steht oben
  const ZEIT = {
    morgen: ['tagesform', 'plan', 'wichtig', 'kennzahlen', 'tag', 'notiert', 'koerper', 'spiel', 'hinweise', 'empfehlung', 'rueckblick', 'bereiche', 'erkenntnisse', 'mittag', 'abend'], // Version 21: Tune, dann die Einheit – alles Weitere hinter „Mehr“
    tag: ['tagesform', 'plan', 'wichtig', 'mittag', 'kennzahlen', 'koerper', 'tag', 'notiert', 'spiel', 'empfehlung', 'hinweise', 'rueckblick', 'bereiche', 'erkenntnisse', 'abend'],
    abend: ['koerper', 'abend', 'tagesform', 'plan', 'wichtig', 'kennzahlen', 'tag', 'notiert', 'spiel', 'rueckblick', 'hinweise', 'bereiche', 'empfehlung', 'erkenntnisse', 'mittag'], // Version 24: Körper-Check vor dem Abend
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
  let offen = false; // „Alle Kategorien“ aufgeklappt (bis zum nächsten Öffnen der App)
  const SICHTBAR = 2; // Version 21: Heute zeigt nur die Key Facts – Tune und die Einheit des Tages; alles Weitere liegt hinter „Mehr“
  const JETZT = ['wichtig', 'mittag', 'abend']; // gibt es nur, wenn sie gerade dran sind – dann stehen sie immer offen

  function ordnen() {
    const sec = document.getElementById('heute'); if (!sec) return;
    const E = einstellung(), zeit = tageszeit();
    sec.dataset.tageszeit = zeit;
    // Version 11: Morgens liegt der Fokus auf dem Check-in – größer und ganz oben (ohne Tastatur-Fokus, der nur einen Rahmen zeichnen würde)
    const ckB = q('#checkin-banner');
    if (ckB) {
      const fokus = zeit === 'morgen' && !ckB.hidden;
      ckB.classList.toggle('tf-banner-fokus', fokus);
    }
    const reihe = (E.zeit ? ZEIT[zeit] : ZEIT.tag).filter((id) => !E.pins.includes(id));
    const knoten = (id) => NAME[id][3]().filter(Boolean);
    const bekannt = new Set();
    FEST.forEach((s) => { const n = q(s); if (n) bekannt.add(n); });
    TEILE.forEach((t) => knoten(t[0]).forEach((n) => bekannt.add(n)));
    let kopf = sec.querySelector('.tf-start-kopf'), trenner = sec.querySelector('.tf-start-alle'), fuss = sec.querySelector('.tf-start-fuss');
    if (!kopf) kopf = el('div', { class: 'tf-start-kopf' });
    if (!trenner) trenner = el('div', { class: 'tf-start-alle' });
    if (!fuss) fuss = el('div', { class: 'tf-start-fuss' });
    const fremd = [...sec.children].filter((n) => !bekannt.has(n) && n !== kopf && n !== trenner && n !== fuss);
    // Kopf über den Favoriten
    kopf.replaceChildren();
    if (E.pins.length) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, 'Bearbeiten');
      b.addEventListener('click', anpassen);
      kopf.append(el('h2', { class: 'tf-start-t' }, svgIco('i-nadel'), ' Favoriten'), b);
    }
    // Trenner „Mehr“: was nicht zur Tageszeit gehört, liegt eingeklappt darunter (Version 20)
    trenner.replaceChildren();
    const istJetzt = (id) => JETZT.includes(id) || knoten(id).some((n) => n.querySelector('#karte-exp-heute, .tf-jetzt')); // laufendes Experiment zählt auch
    const obenIds = E.pins.length ? [] : reihe.filter((id) => istJetzt(id) || knoten(id).length).filter((id, i, L) => istJetzt(id) || L.filter((x) => !istJetzt(x)).indexOf(id) < SICHTBAR); // Version 20
    const zu = reihe.filter((id) => !obenIds.includes(id)).filter((id) => knoten(id).length);
    if (zu.length) {
      const b = el('button', { type: 'button', class: 'tf-start-alle-b', 'aria-expanded': String(offen) }, el('span', { text: offen ? 'Weniger anzeigen' : 'Mehr für heute' }), el('small', { class: 'num', text: offen ? '' : String(zu.length) }), svgIco('i-chev'));
      b.addEventListener('click', () => { offen = !offen; ordnen(); if (offen) b.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      trenner.appendChild(b);
    }
    const anpassK = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-start-anpassen' }, svgIco('i-nadel'), ' Startseite anpassen');
    anpassK.addEventListener('click', anpassen);
    fuss.replaceChildren(anpassK, el('small', { text: E.zeit ? zeitText(zeit) : 'Feste Reihenfolge' }));
    // neu aufbauen: feste Hinweise · Favoriten · Trenner · Rest nach Tageszeit · Fremdes · Fuß
    const folge = [];
    FEST.forEach((s) => { const n = q(s); if (n) folge.push(n); });
    if (E.pins.length) folge.push(kopf);
    E.pins.forEach((id) => knoten(id).forEach((n) => { n.classList.remove('tf-start-zu'); n.classList.add('tf-start-pin'); folge.push(n); }));
    const oben = obenIds; // ohne Favoriten: die ersten drei Blöcke der Tageszeit und alles, was nur jetzt da ist (Heute wichtig, Nachmittagstief, Dein Abend)
    oben.forEach((id) => knoten(id).forEach((n) => { n.classList.remove('tf-start-pin', 'tf-start-zu'); folge.push(n); }));
    if (zu.length) folge.push(trenner);
    reihe.filter((id) => !oben.includes(id)).forEach((id) => knoten(id).forEach((n) => { n.classList.remove('tf-start-pin'); n.classList.toggle('tf-start-zu', !offen); folge.push(n); }));
    fremd.forEach((n) => folge.push(n));
    folge.push(fuss);
    // nur umhängen, was nicht schon an der richtigen Stelle steht (Fokus und Scroll bleiben ruhig)
    let vor = null;
    folge.forEach((n) => { const soll = vor ? vor.nextSibling : sec.firstChild; if (n !== soll) sec.insertBefore(n, soll); vor = n; });
  }
  const zeitText = (z) => (z === 'morgen' ? 'Morgens: Check-in, Tune und dein Plan zuerst' : z === 'abend' ? 'Abends: Rückblick und Schlafenszeit zuerst' : 'Tagsüber: dein Tag und dein Plan zuerst');

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
      hinweis.textContent = pins.length ? pins.length + ' von ' + MAX_PINS + ' Favoriten – sie stehen in dieser Reihenfolge ganz oben. Alles andere liegt unter „Mehr für heute“.' : 'Tippe auf bis zu ' + MAX_PINS + ' Bereiche, die immer ganz oben stehen sollen.';
    };
    const sw = el('label', { class: 'tf-switch' }, el('input', { type: 'checkbox', checked: zeit }), el('span', { class: 'tf-switch-ui' }), el('span', null, 'Nach Tageszeit ordnen', el('small', { text: 'Morgens Check-in und Plan, abends Rückblick und Schlafenszeit zuerst' })));
    sw.querySelector('input').addEventListener('change', (e) => { zeit = e.target.checked; });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Fertig');
    ok.addEventListener('click', () => { speichern({ pins: pins.slice(0, MAX_PINS), zeit }); offen = false; if (window.tfWissen) tfWissen.schliessen(); ordnen(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    const weg = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Alle Favoriten entfernen');
    weg.addEventListener('click', () => { pins.splice(0, pins.length); malen(); });
    malen();
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Startseite anpassen' }), el('p', { class: 'tf-rm-sub', text: 'Mit der Stecknadel legst du fest, was ganz oben steht.' }), liste, hinweis, sw, el('div', { class: 'tf-form-actions' }, ok, weg));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  // zur vollen Stunde neu ordnen, wenn die Tageszeit wechselt (App bleibt oft lange offen)
  let zuletzt = tageszeit();
  setInterval(() => { const z = tageszeit(); if (z !== zuletzt) { zuletzt = z; if (T.tab && T.tab() === 'heute') T.neu(); } }, 60 * 1000);

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
  function aufklappen(n) { // Version 20: ein Element hinter „Mehr für heute“ sichtbar machen (Tour, Links) – true, wenn geöffnet wurde
    if (!n || offen || !n.closest || !n.closest('#heute .tf-start-zu')) return false;
    offen = true; ordnen(); return true;
  }
  window.tfStart = { ordnen, anpassen, tageszeit, einstellung, aufklappen };
})();
