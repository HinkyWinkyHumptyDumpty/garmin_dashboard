/* Dreiklang · Geführte Tour im Beispielmodus (Version 16)
   Vorher eine Frage: Wie gut kennst du dich mit Training aus? Danach läuft die App mit Lisas ausgedachten Daten
   (beispiel.js, nur in diesem Tab) und die Tour führt über die echten Seiten: Ein Ausschnitt bleibt hell, daneben steht,
   was er zeigt – für Einsteiger in Alltagssprache, für Profis mit Formeln. Nichts wird gespeichert; „Beenden“ lädt die
   App mit den eigenen Daten neu. Der Schritt steht im Beispielmodus (sessionStorage), damit ein Neuladen weitermacht. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $$, el, svgIco } = T.ui;
  const A = () => dash.app;
  const wurzel = () => document.getElementById('tf') || document.body; // $ sucht nur innerhalb von #tf

  const STUFEN = [
    { id: 'einsteiger', name: 'Einsteiger', sub: 'Ich fange gerade an oder trainiere nach Gefühl.', wissen: 'einsteiger' },
    { id: 'grundlagen', name: 'Grundkenntnisse', sub: 'Ich kenne Puls und Zonen, plane aber selten.', wissen: 'fortgeschritten' },
    { id: 'fortgeschritten', name: 'Fortgeschritten', sub: 'Ich trainiere nach Plan und kenne FTP und Co.', wissen: 'fortgeschritten' },
    { id: 'profi', name: 'Profi', sub: 'Ich steuere mit TSS, Schwellen und Pacing.', wissen: 'profi' },
  ];
  const WILLKOMMEN = [null, null, 'Willkommen bei Dreiklang', 'Das ist Lisa. Ihre Daten sind ausgedacht – so siehst du die App, wie sie nach ein paar Monaten mit einer Uhr aussieht. Was du hier antippst oder änderst, wird nicht gespeichert.'];
  // [Route, Ausschnitt (null = ohne), Titel, Text]
  const SCHRITTE = {
    einsteiger: [WILLKOMMEN,
      ['heute', '#home-hero', 'Tune: deine Zahl für heute', 'Von 1 bis 99: wie gut dein Körper heute für Training gestimmt ist. Grün heißt: Training wie geplant. Gelb: lieber etwas lockerer. Rot: Erholung zuerst.'],
      ['heute', '#checkin-banner', 'Der Check-in am Morgen', 'Fünf kurze Fragen zu Schlaf, Energie, Muskeln, Stress und Stimmung – in 20 Sekunden. Dein Gefühl fließt in Tune ein, auch ganz ohne Uhr.'],
      ['heute', '#karte-held', 'Deine Einheit für heute', 'Hier steht, was heute dran ist: wie lange und wie hart. Tippst du darauf, siehst du jeden Abschnitt der Einheit.'],
      ['training/plan', '#plan-woche .tf-pl-tag.heute', 'Dein Plan für die Woche', 'Jede Woche ist fertig geplant. Erledigte Einheiten bekommen einen Haken – von der Uhr oder von dir.'],
      ['training/plan', '#plan-eigen', 'Spontan trainiert?', 'Ein spontanes Gym-Training, eine Wanderung oder Tennis trägst du hier selbst ein. Es zählt dann in deiner Woche mit.'],
      ['training/gym', '#karte-gym-koerper', 'Gym: Muskeln antippen', 'Tipp die Muskeln an, die du trainieren willst. Die App stellt dir ein passendes Workout zusammen – mit Erklärung zu jeder Übung.'],
      ['gesundheit', '#karte-gesundheitsbild', 'Gesundheit auf einen Blick', 'Schlaf, Ruhepuls und Schritte – immer verglichen mit deinem eigenen Normal, nicht mit anderen.'],
      ['wissen', '#wissen-suche', 'Fragen? Einfach suchen', 'Jeder Begriff ist in einfachen Worten erklärt. Such zum Beispiel nach „Tune“ oder „Zonen“.'],
    ],
    grundlagen: [WILLKOMMEN,
      ['heute', '#home-hero', 'Tune: deine Zahl für heute', 'Aus HRV, Ruhepuls, Schlaf und deinem Check-in – jeweils gegen dein eigenes Normal. Grün: wie geplant, gelb: lockerer, rot: Erholung zuerst.'],
      ['heute/tagesform', '#karte-tagesform', 'Woraus Tune entsteht', 'Jeder Treiber zeigt, ob er heute über oder unter deinem Normal liegt. So siehst du, ob der Schlaf oder die HRV den Ausschlag gibt.'],
      ['heute', '#karte-held', 'Die Einheit passt sich an', 'Ist Tune gelb oder rot, wird nur die heutige Einheit leichter – der Plan bleibt. Mit „Original zeigen“ siehst du, was geplant war.'],
      ['training/plan', '#plan-woche .tf-pl-tag.heute', 'Harte Tage hart, lockere locker', 'Zwischen zwei harten Einheiten liegt immer ein lockerer Tag. Einen Tag verschiebst du mit dem Pfeil neben dem Datum.'],
      ['training/plan', '#plan-eigen', 'Eigene Einheiten', 'Spontan im Gym oder beim Tennis? Trag es hier ein. Es zählt in deiner Woche – und abgehakt auch in Fitness und Form.'],
      ['training/form', '#karte-pmc', 'Fitness, Ermüdung und Form', 'Fitness wächst langsam mit deinem Training, Ermüdung schnell. Form ist der Unterschied: über null bist du frisch, deutlich darunter müde.'],
      ['gesundheit/schlaf', '#karte-phasen', 'Schlaf im Detail', 'Tief-, REM- und Leichtschlaf jeder Nacht. Darüber siehst du, ob dir über die Woche Schlaf fehlt.'],
      ['wissen', '#wissen-suche', 'Alles nachlesen', 'Jeder Begriff mit kurzer Erklärung und der Studie dahinter. Such zum Beispiel nach „HRV“ oder „Form“.'],
    ],
    fortgeschritten: [WILLKOMMEN,
      ['heute', '#home-hero', 'Tune', 'Wie bereit du heute bist – aus HRV, Ruhepuls, Schlaf und Check-in gegen deine eigene Basis. Bei Gelb oder Rot passt sich die Einheit des Tages von selbst an.'],
      ['training/plan', '#plan-woche .tf-pl-chips', 'Phasen und Woche', 'Grundlage, Aufbau, Spitze, Tapering – mit einer leichteren Woche alle drei bis vier Wochen. Oben stehen Umfang, Anteil locker und was erledigt ist.'],
      ['training/plan', '#plan-prognose', 'Deine Werte am Renntag', 'FTP, Schwellentempo und CSS als Spanne bis zum Rennen – dazu die Zielzeit, die zu diesen Werten passt. Nach jedem Test siehst du, ob du im erwarteten Bereich liegst.'],
      ['training/plan', '#plan-waswaere', 'Was wäre, wenn …?', 'Verschieb eine Einheit und sieh vorher, wie frisch du am Wochenende oder am Renntag wärst.'],
      ['training/form', '#karte-pmc', 'Fitness, Ermüdung, Form', 'CTL über 42 Tage, ATL über 7 Tage, TSB als Differenz. Eigene Einheiten ohne Uhr zählen geschätzt mit.'],
      ['training/last', '#karte-kanaele', 'Beine gegen Kreislauf', 'Laufen belastet Sehnen und Knochen anders als Rad oder Schwimmen. Die App zählt beides getrennt und warnt, wenn die Beine schneller zulegen als der Kreislauf.'],
      ['rennen/rechner', '#karte-rr-gesamt', 'Rennrechner', 'Zielzeit aus Watt, Schwimm- und Lauftempo, Wechseln und Strecke – mit einem Pacing-Korridor für jede Disziplin.'],
    ],
    profi: [[null, null, 'Willkommen bei Dreiklang', 'Lisa ist ausgedacht, die Rechnungen sind echt. Wir zeigen dir, woher die Zahlen kommen und wo du sie steuerst. Nichts wird gespeichert.'],
      ['heute/tagesform', '#karte-tagesform', 'Tune im Detail', 'HRV (ln RMSSD), Ruhepuls, Schlaf und Befinden als Abweichung von deiner eigenen Basis – mit festen Grenzen bei sehr kurzem Schlaf, Infektzeichen und starkem Schmerz.'],
      ['training/form', '#karte-pmc', 'Banister-Modell', 'CTL 42 Tage, ATL 7 Tage, TSB = CTL − ATL des Vortags. TSS je Einheit aus Leistung, Tempo zur CSS oder hrTSS – mit den Schwellen, die an dem Tag galten.'],
      ['training/last', '#karte-kanaele', 'Zwei Last-Kanäle', 'Bein-Last (Lauf-TSS × 1, Rad × 0,15, harte Beinsätze) und Kreislauf-Last, je akut gegen chronisch, exponentiell gewichtet über 7 und 28 Tage.'],
      ['training/plan', '#plan-prognose', 'Leistungsprognose', 'Zuwachs je Niveau mit abnehmendem Ertrag, 1 − e^(−Wochen/12), bis zum Tapering. Das untere Ende skaliert mit deiner Plan-Treue der letzten vier Wochen, die Zielzeit kommt aus dem Rennrechner-Modell.'],
      ['training/plan', '#plan-eigen', 'Eigene Einheiten', 'Abgehakt und ohne Aufzeichnung der Uhr zählen sie geschätzt: IF² × 100 je Stunde, Kraft 30–60. Trägst du eine harte ein, wird die harte Plan-Einheit daneben locker.'],
      ['rennen/rechner', '#rr-bike-ctrl', 'Rad-Pacing', 'Watt, CdA und Höhenmeter: Tempo aus dem Leistungsmodell nach Martin et al. 1998, dazu der IF-Korridor aus deinem Profil.'],
      ['rennen/rechner', '#rr-fu-ctrl', 'Fueling', 'Kohlenhydrate pro Stunde für Rad und Lauf, Flasche und Gels. Die Race Card plant daraus die Verpflegung alle 20 Minuten.'],
      ['profil/athlet', '#profil-ab', 'Schwellen mit Datum', 'Neue FTP oder CSS gelten ab einem Datum. Alte Einheiten behalten ihre Werte von damals – TSS und IF springen nicht rückwirkend.'],
    ],
  };
  const stufeVon = (id) => STUFEN.find((s) => s.id === id) || STUFEN[1];
  const reduziert = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eigenesKonto = () => { try { return !!localStorage.getItem('tf:konto'); } catch (e) { return false; } };

  /* ---------- Die Frage vorher ---------- */
  function frage() {
    const a = (T.ui.rowsOf('athlet') || [])[0] || {};
    let wahl = a.wissen === 'einsteiger' ? 'einsteiger' : a.wissen === 'profi' ? 'profi' : a.modus === 'performance' ? 'fortgeschritten' : 'grundlagen';
    const box = el('div', { class: 'tf-rm tf-tour-frage' });
    const liste = el('div', { class: 'tf-tour-stufen', role: 'radiogroup', 'aria-label': 'Wie gut kennst du dich mit Training aus?' });
    STUFEN.forEach((s) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(s.id === wahl), class: 'tf-tour-stufe', 'data-stufe': s.id }, el('b', { text: s.name }), el('small', { text: s.sub }));
      b.addEventListener('click', () => { wahl = s.id; $$('button', liste).forEach((y) => y.setAttribute('aria-checked', String(y === b))); });
      liste.appendChild(b);
    });
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'tour-los' }, svgIco('i-play'), ' Tour starten');
    los.addEventListener('click', () => { const s = stufeVon(wahl); A().beispielStarten({ tour: true, stufe: s.id, wissen: s.wissen, schritt: 0 }); });
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    ab.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Geführte Tour' }),
      el('p', { class: 'tf-rm-sub', text: 'Mit Beispieldaten von Lisa – ausgedacht. Deine eigenen Daten bleiben, wie sie sind.' }),
      el('div', { class: 'tf-field' }, el('span', { text: 'Wie gut kennst du dich mit Training aus?' }), liste),
      el('p', { class: 'tf-note', text: 'Etwa zwei bis vier Minuten. Du kannst jederzeit beenden.' }),
      el('div', { class: 'tf-form-actions' }, los, ab));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  /* ---------- Die Tour über den echten Seiten ---------- */
  let L = null; // { stufe, i, root, spot, blase, ziel, nr }
  const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const sichtbar = (x) => { if (!x || !x.isConnected) return false; const b = x.getBoundingClientRect(); return b.width > 0 && b.height > 0 && x.offsetParent !== null; };
  async function finden(sel, ms) {
    const bis = Date.now() + ms;
    for (;;) { const x = document.querySelector(sel); if (sichtbar(x)) return x; if (x && window.tfStart && tfStart.aufklappen && tfStart.aufklappen(x)) continue; if (Date.now() > bis) return null; await warte(90); }
  }
  function aufbauen() {
    const root = el('div', { class: 'tf-tour', id: 'tf-tour' });
    const spot = el('div', { class: 'tf-tour-spot', 'aria-hidden': 'true' });
    const blase = el('div', { class: 'tf-tour-blase', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tour-titel', tabindex: '-1' });
    root.append(spot, blase);
    root.addEventListener('click', (e) => { if (e.target === root) e.stopPropagation(); }); // daneben tippen tut nichts
    wurzel().appendChild(root);
    document.body.classList.add('tf-tour-an');
    return { root, spot, blase };
  }
  // Am Handy steht die Karte unten (Daumen) – nur wenn das Element dort liegt und sich nicht weiter hochscrollen lässt, oben.
  // Am Laptop unter oder über dem Element, sonst unten rechts in der Ecke.
  const handy = () => window.innerWidth < 700;
  function lagern() { // Ausschnitt und Karte an die Stelle des Elements
    if (!L) return;
    const { spot, blase, ziel, root } = L, vw = window.innerWidth, vh = window.innerHeight, rand = 8;
    const da = ziel && sichtbar(ziel);
    root.classList.toggle('ohne', !da);
    blase.classList.toggle('mitte', !da);
    blase.style.left = blase.style.right = blase.style.top = blase.style.bottom = '';
    if (!da) return;
    const b = ziel.getBoundingClientRect(), x = Math.max(4, b.left - rand), y = Math.max(4, b.top - rand);
    Object.assign(spot.style, { left: x + 'px', top: y + 'px', width: Math.max(0, Math.min(vw - x - 4, b.right + rand - x)) + 'px', height: Math.max(0, Math.min(vh - y - 4, b.bottom + rand - y)) + 'px' });
    const bh = blase.offsetHeight, bw = blase.offsetWidth;
    if (handy()) {
      if (b.top > vh - bh - 48) blase.style.top = 'calc(12px + env(safe-area-inset-top))';
      else blase.style.bottom = 'calc(12px + env(safe-area-inset-bottom))';
      return;
    }
    if (vh - b.bottom >= bh + 24 || b.top >= bh + 24) {
      blase.style.left = Math.min(Math.max(12, b.left), vw - bw - 12) + 'px';
      blase.style.top = (vh - b.bottom >= bh + 24 ? b.bottom + 16 : b.top - bh - 16) + 'px';
    } else { blase.style.right = '24px'; blase.style.bottom = '24px'; }
  }
  function hinScrollen(ziel) { // so weit scrollen, dass das Element neben der Karte Platz hat – große Elemente von oben
    const b = ziel.getBoundingClientRect(), vh = window.innerHeight, bh = Math.max(160, L.blase.offsetHeight || 0);
    const frei = handy() ? vh - bh - 40 : vh - bh - 56;
    const oben = b.height + 16 <= frei ? Math.max(16, (frei - b.height) / 2) : 16;
    const dy = Math.round(b.top - oben);
    if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: reduziert() ? 'auto' : 'smooth' });
  }
  async function ruhig() { // warten, bis die Seite nicht mehr scrollt
    let y = window.scrollY, gleich = 0;
    for (let k = 0; k < 30 && gleich < 3; k++) { await warte(50); gleich = window.scrollY === y ? gleich + 1 : 0; y = window.scrollY; }
  }
  let rafN = 0;
  const neuLagern = () => { if (rafN) return; rafN = requestAnimationFrame(() => { rafN = 0; lagern(); }); };
  function taste(e) {
    if (!L) return;
    if (e.key === 'Escape') { e.preventDefault(); beenden(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); weiter(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); zurueck(); }
  }
  async function zeigen(i) {
    const S = SCHRITTE[L.stufe], nr = ++L.nr;
    L.i = Math.max(0, Math.min(i, S.length));
    A().beispielSetzen({ schritt: L.i });
    if (L.i === S.length) { ende(); return; }
    const [route, sel, titel, text] = S[L.i];
    L.blase.classList.add('wechsel');
    if (window.tfWissen && tfWissen.schliessen) tfWissen.schliessen();
    if (route && T.route() !== route) T.geh(route);
    // Karte schon füllen (noch unsichtbar) – ihre Höhe bestimmt, wohin gescrollt wird
    const zur = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', disabled: L.i === 0, style: L.i === 0 ? 'visibility:hidden' : null }, 'Zurück');
    zur.addEventListener('click', zurueck);
    const vor = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'tour-weiter' }, L.i === S.length - 1 ? 'Fertig' : 'Weiter');
    vor.addEventListener('click', weiter);
    const zu = el('button', { type: 'button', class: 'tf-tour-x', 'aria-label': 'Tour beenden' }, svgIco('i-x'));
    zu.addEventListener('click', beenden);
    L.blase.replaceChildren(zu, el('small', { class: 'tf-tour-nr', text: (L.i + 1) + ' von ' + S.length }), el('h2', { id: 'tour-titel', text: titel }), el('p', { text: text }),
      el('div', { class: 'tf-tour-a' }, zur, vor));
    let ziel = null;
    if (sel) {
      ziel = await finden(sel, 3500);
      if (!L || nr !== L.nr) return; // inzwischen weitergetippt
      if (ziel) { hinScrollen(ziel); await ruhig(); }
    } else window.scrollTo({ top: 0 });
    if (!L || nr !== L.nr) return;
    L.ziel = ziel;
    lagern();
    L.blase.classList.remove('wechsel');
    L.blase.dataset.schritt = String(L.i);
    L.blase.focus({ preventScroll: true });
  }
  function weiter() { if (L) zeigen(L.i + 1); }
  function zurueck() { if (L && L.i > 0) zeigen(L.i - 1); }
  function ende() {
    L.ziel = null;
    const zuMir = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'tour-ende' }, eigenesKonto() ? 'Zu meinen Daten' : 'Beispiel beenden');
    zuMir.addEventListener('click', () => A().beispielEnde());
    const bleiben = el('button', { type: 'button', class: 'tf-btn' }, 'Weiter umsehen');
    bleiben.addEventListener('click', () => { A().beispielSetzen({ tour: false }); schliessen(); });
    L.blase.replaceChildren(el('h2', { id: 'tour-titel', text: 'Das war die Tour' }),
      el('p', { text: 'Sieh dich gern weiter um – Lisas Daten bleiben, bis du den Beispielmodus beendest. Die Tour findest du jederzeit unter Wissen → Tutorial.' }),
      el('div', { class: 'tf-tour-a' }, bleiben, zuMir));
    lagern(); L.blase.focus({ preventScroll: true });
  }
  function schliessen() {
    if (!L) return;
    L.root.remove(); L = null;
    document.body.classList.remove('tf-tour-an');
    window.removeEventListener('resize', neuLagern); window.removeEventListener('scroll', neuLagern, true); document.removeEventListener('keydown', taste, true);
    leiste();
  }
  function beenden() { // Tour zu, Beispielmodus bleibt – oben steht „Beenden“
    A().beispielSetzen({ tour: false });
    schliessen();
  }
  function starten(stufe, i) {
    if (L) schliessen();
    L = Object.assign({ stufe: SCHRITTE[stufe] ? stufe : 'grundlagen', i: 0, nr: 0, ziel: null }, aufbauen());
    window.addEventListener('resize', neuLagern); window.addEventListener('scroll', neuLagern, true); document.addEventListener('keydown', taste, true);
    A().beispielSetzen({ tour: true, stufe: L.stufe });
    leiste();
    zeigen(i || 0);
  }

  /* ---------- Leiste im Beispielmodus: was hier läuft und wie man rauskommt ---------- */
  function leiste() {
    const B = A().beispiel && A().beispiel(); let x = document.getElementById('tf-bsp');
    if (!B) { if (x) x.remove(); return; }
    if (!x) {
      x = el('div', { class: 'tf-bsp', id: 'tf-bsp', role: 'status' });
      wurzel().appendChild(x);
    }
    const tour = el('button', { type: 'button', class: 'tf-bsp-k', hidden: !!L }, 'Tour');
    tour.addEventListener('click', () => starten(B.stufe || 'grundlagen', 0));
    const raus = el('button', { type: 'button', class: 'tf-bsp-k', id: 'bsp-beenden' }, 'Beenden');
    raus.addEventListener('click', () => A().beispielEnde());
    x.replaceChildren(el('span', null, el('b', { text: 'Beispieldaten' })), tour, raus);
  }

  // Nach dem Neuladen im Beispielmodus: Leiste zeigen und die Tour dort fortsetzen, wo sie war
  let gestartet = false;
  dash.onData(() => {
    const B = A().beispiel && A().beispiel();
    if (!B || gestartet || A().state.status !== 'ok') return;
    gestartet = true;
    leiste();
    if (B.tour) setTimeout(() => starten(B.stufe || 'grundlagen', B.schritt || 0), 700);
  });
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('login-beispiel');
    if (b) b.addEventListener('click', frage);
  });

  window.tfTour = { frage, starten, beenden, STUFEN, SCHRITTE };
})();
