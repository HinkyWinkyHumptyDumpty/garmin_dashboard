/* Tagesform · Bereichs-Übersichten: Training, Gesundheit, Profil.
   Jede Kachel zeigt den wichtigsten Live-Wert ihres Themas und führt eine Ebene tiefer. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, svg, nf, iso, toDay, hmin, mmss, col, rowsOf, heute, info, localDate, DAY, AMPEL, svgIco, zeile, formText } = T.ui;
  const { dot } = S;
  const A = () => dash.app;
  const athlet = () => (rowsOf('athlet') || [])[0] || null;
  const ohne = () => T.ohne();
  const fach = (einfach, kurz) => { const w = (athlet() || {}).wissen; return w === 'profi' ? kurz : w === 'einsteiger' ? einfach : einfach + ' (' + kurz + ')'; };

  /* ---------- Bausteine ---------- */
  function spark(werte, farbe) { // kleine Verlaufslinie oben rechts in der Kachel
    const v = werte.filter((x) => x != null && isFinite(x));
    if (v.length < 4) return null;
    const W = 64, H = 26, lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1;
    const pts = werte.map((x, i) => (x == null || !isFinite(x) ? null : [(i / (werte.length - 1)) * (W - 4) + 2, H - 3 - ((x - lo) / sp) * (H - 6)])).filter(Boolean);
    const s = svg('svg', { class: 'tf-kachel-spark', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const d = 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
    svg('path', { d: d + 'L' + pts[pts.length - 1][0].toFixed(1) + ',' + H + 'L' + pts[0][0].toFixed(1) + ',' + H + 'Z', fill: col(farbe), opacity: 0.12 }, s);
    svg('path', { d, fill: 'none', stroke: col(farbe), 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, s);
    return s;
  }
  function kachel(o) { // { ziel, titel, icon, farbe, wert, u, txt, sub, ampel, erkl, cta, spark, gross }
    const wert = o.wert == null || o.wert === '' ? '–' : String(o.wert);
    const b = el('button', { type: 'button', class: 'tf-kachel' + (o.cta ? ' tf-cta' : '') + (o.gross ? ' tf-gross' : ''), style: '--c:var(--tf-' + o.farbe + ')', id: o.id || null },
      el('span', { class: 'tf-kachel-kopf' }, el('span', { class: 'tf-kachel-ico' }, svgIco(o.icon)), el('b', { text: o.titel })),
      el('span', { class: 'tf-kachel-wert' + (o.txt ? ' tf-txt' : '') }, wert, o.u && wert !== '–' ? el('span', { class: 'tf-u', text: o.u }) : null),
      el('span', { class: 'tf-kachel-sub' }, o.ampel ? dot(o.ampel) : null, el('span', { text: o.sub || '' })),
      o.erkl ? el('span', { class: 'tf-kachel-erkl', text: o.erkl }) : null);
    if (o.spark) { const s = spark(o.spark, o.farbe); if (s) b.appendChild(s); }
    b.addEventListener('click', () => T.geh(o.ziel));
    return b;
  }
  const sek = (titel, sub) => el('h2', { class: 'tf-hub-sek' }, titel, sub ? el('small', { text: sub }) : null);
  const raster = (...k) => { const L = k.filter(Boolean); if (L.length % 2 === 1) L[0].classList.add('tf-gross'); return el('div', { class: 'tf-kacheln' }, ...L); }; // ungerade Zahl: erste Kachel breit
  function summe(items) { // drei Kennzahlen nebeneinander
    return el('div', { class: 'tf-hub-sum' }, ...items.map((i) => {
      const b = el('button', { type: 'button' }, el('small', { text: i.label }), el('span', { class: 'num' }, i.wert == null ? '–' : String(i.wert), i.u && i.wert != null ? el('span', { class: 'tf-u', text: i.u }) : null), el('em', { text: i.sub || '' }));
      if (i.ziel) b.addEventListener('click', () => T.geh(i.ziel)); else b.disabled = true;
      return b;
    }));
  }
  const ohneSub = 'braucht Garmin-Daten';
  function garminKarte(liste) { // ohne Garmin: statt vieler leerer Kacheln eine Karte, was mit Garmin dazukommt
    const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-sync'), ' Garmin verbinden');
    b.addEventListener('click', () => A().showGarmin());
    return el('article', { class: 'tf-card tf-hub-garmin' },
      el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: 'background:var(--tf-blue)' }, svgIco('i-sync')), el('div', null, el('h2', { text: 'Mit Garmin kommt mehr dazu' }), el('div', { class: 'tf-sub', text: 'Tagesform wertet deine Uhr jeden Morgen automatisch aus' }))),
      el('ul', { class: 'tf-hub-garmin-l' }, ...liste.map((t) => el('li', { text: t }))), b);
  }
  const letzte = (rows, n) => (rows || []).slice(-n);
  const fokus = () => (window.tfAlltag && tfAlltag.modus ? tfAlltag.modus() : 'performance'); // Alltag & Energie · Fitness & Gym · Performance
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } }; // ein Fehler in einem Zusatz lässt die Übersicht nicht leer
  function alltag14() { const h = localDate(), von = iso(toDay(h) - 13 * DAY); return (A().raw('garmin_tage') || []).filter((r) => r && r.date >= von && r.date <= h).sort((x, y) => (x.date < y.date ? -1 : 1)); }
  function tage7() { const H = heute(); const bis = H ? H.date : localDate(); return { von: iso(toDay(bis) - 6 * DAY), bis }; }
  function einheiten7(sport) { const { von, bis } = tage7(); return (rowsOf('belastung') || []).filter((b) => (!sport || b.sport === sport) && b.date >= von && b.date <= bis); }

  /* =====================================================================
     TRAINING
     ===================================================================== */
  function renderTraining() {
    const box = $('#training-hub-box'); if (!box) return;
    const H = heute(), a = athlet() || {}, PD = rowsOf('pmc_disziplin') || [], pd = PD[PD.length - 1] || {}, Sp = T.sportarten();
    const E7 = einheiten7(), min7 = E7.reduce((x, b) => x + (+b.min || 0), 0);
    const frag = [], fk = fokus();
    if (fk === 'alltag') { T.kopf({ titel: 'Bewegung', sub: 'Kurze Routinen, Gym und Alltag' }); return renderBewegung(box); }
    if (!ohne()) frag.push(summe([
      { label: 'Letzte 7 Tage', wert: ohne() ? null : hmin(min7 * 60), u: 'h', sub: ohne() ? ohneSub : E7.length + (E7.length === 1 ? ' Einheit' : ' Einheiten'), ziel: 'training/umfang' },
      { label: fach('Fitness', 'CTL'), wert: H ? H.ctl : null, sub: H ? 'Spitze ' + H.ctl_peak : ohne() ? ohneSub : '', ziel: 'training/form' },
      { label: fach('Form', 'TSB'), wert: H ? H.tsb_txt : null, sub: H ? formText(H.tsb).replace(/ –.*/, '') : '', ziel: 'training/form' },
    ]));
    // Planen & trainieren
    const P = window.tfPlan && tfPlan.kurz ? tfPlan.kurz() : null, G = window.tfGym && tfGym.kurz ? tfGym.kurz() : null, F = window.tfFlow && tfFlow.kurz ? tfFlow.kurz() : null;
    frag.push(sek('Planen & trainieren'));
    frag.push(raster(
      kachel(Object.assign({ ziel: 'training/plan', titel: 'Trainingsplan', icon: 'i-cal', farbe: 'blue', erkl: 'Ziel, Zeit und Sportarten wählen – du bekommst jede Woche fertig geplant.' }, P || { wert: 'Plan erstellen', cta: true, sub: 'für Laufen, Rad, Schwimmen, Triathlon oder Fitness' })),
      kachel(Object.assign({ ziel: 'training/gym', titel: 'Gym', icon: 'i-dumbbell', farbe: 'purple', erkl: 'Tippe die Muskeln an, die du trainieren willst.' }, G || { wert: 'Muskeln antippen', cta: true, sub: 'Studio, zuhause mit oder ohne Hanteln' })),
      kachel(Object.assign({ ziel: 'training/flow', titel: 'Pilates & Yoga', icon: 'i-lotus', farbe: 'teal', erkl: 'Für Rumpf, Rücken, Beweglichkeit und Entspannung.' }, F || { wert: 'Einheit wählen', cta: true, sub: 'Rumpf, Rücken, Hüfte, Entspannung' }))));
    // Sportarten
    const SPORT = [['schwimmen', 'Schwimmen', 'i-swim', 'blue', 'swim'], ['rad', 'Rad', 'i-bike', 'orange', 'bike'], ['laufen', 'Laufen', 'i-run', 'mint', 'run']].filter(([id]) => Sp.includes(id));
    const L = window.tfLeistung && tfLeistung.kurz ? sicher(() => tfLeistung.kurz()) || {} : {};
    if (SPORT.length && !ohne()) {
      frag.push(sek('Deine Sportarten'));
      const LW = (rowsOf('laufwaechter') || [])[0];
      frag.push(raster(...SPORT.map(([id, name, icon, farbe, k]) => {
        const R = einheiten7(k), km = R.reduce((x, b) => x + (+b.km || 0), 0), m = R.reduce((x, b) => x + (+b.min || 0), 0), ctl = pd[k + '_ctl'];
        const spk = letzte(PD, 42).map((r) => r[k + '_ctl']);
        if (ohne()) return kachel({ ziel: 'training/' + id, titel: name, icon, farbe, wert: null, sub: ohneSub });
        if (id === 'rad') return kachel({ ziel: 'training/rad', titel: name, icon, farbe, wert: hmin(m * 60), u: 'h', sub: '7 Tage · FTP ' + (a.ftp_ref_w || '–') + ' W', spark: spk, erkl: 'Leistungskurve, FTP und Effizienz.' });
        if (id === 'schwimmen') return kachel({ ziel: 'training/schwimmen', titel: name, icon, farbe, wert: nf(km, 1), u: 'km', sub: '7 Tage · CSS ' + (a.css_s_100m ? mmss(a.css_s_100m) + '/100 m' : '–'), spark: spk, erkl: 'Tempo, Technik und dein Schwellentempo (CSS).' });
        return kachel({ ziel: 'training/laufen', titel: name, icon, farbe, wert: nf(km, 1), u: 'km', sub: LW ? LW.titel : '7 Tage · ' + R.length + ' Läufe', ampel: LW ? AMPEL[LW.ampel] : null, spark: spk, erkl: 'Laufbudget gegen Überlastung, Schrittfrequenz, Effizienz.' });
      })));
    }
    // Auswertung
    frag.push(sek('Auswertung'));
    if (ohne()) frag.push(garminKarte(['Fitness & Form', 'Belastungssprünge', 'Umfang & Intensität', 'Einheiten-Check', 'Fueling', 'Laufen, Rad, Schwimmen']));
    else {
    const ac = pd.acwr, acZ = ac == null ? ['gray', 'zu wenig Daten'] : ac > 1.5 ? ['red', 'Belastungssprung'] : ac > 1.3 ? ['yellow', 'erhöht'] : ac >= 0.8 ? ['green', 'günstiger Bereich'] : ['gray', 'Entlastung'];
    const W = rowsOf('wochen') || [], w0 = W[W.length - 1], I = (rowsOf('intensitaet') || []).find((r) => r.id === 'saison');
    const C = rowsOf('einheiten_check') || [], c0 = C[0], FU = (rowsOf('fueling') || []).filter((f) => f.g_h != null), f0 = FU[0];
    frag.push(raster(
      kachel({ ziel: 'training/form', titel: 'Fitness & Form', icon: 'i-flame', farbe: 'indigo', wert: H ? H.ctl : null, sub: H ? fach('Form', 'TSB') + ' ' + H.tsb_txt + ' · ' + formText(H.tsb).replace(/ –.*/, '') : ohne() ? ohneSub : '', spark: letzte(rowsOf('pmc'), 56).map((r) => r.ctl), erkl: 'Fitness = Trainingslast der letzten 6 Wochen, Form = Fitness minus Ermüdung.' }),
      kachel({ ziel: 'training/last', titel: 'Belastungs\u00adsprünge', icon: 'i-wave', farbe: 'orange', wert: ac == null ? null : nf(ac, 2), sub: ohne() ? ohneSub : fach('Akut zu chronisch', 'ACWR') + ' · ' + acZ[1], ampel: ohne() ? null : acZ[0], erkl: 'Steigt die Last zu schnell, steigt das Verletzungsrisiko.' }),
      kachel({ ziel: 'training/umfang', titel: 'Umfang & Intensität', icon: 'i-bars', farbe: 'teal', wert: w0 ? nf(w0.gesamt_h, 1) : null, u: 'h', sub: ohne() ? ohneSub : (I ? I.z1_pct + ' % locker · 12 Monate' : 'diese Woche'), spark: letzte(W, 12).map((r) => r.gesamt_h), erkl: 'Wie viel du trainierst – und wie viel davon locker ist.' }),
      kachel({ ziel: 'training/einheiten', titel: 'Einheiten-Check', icon: 'i-target', farbe: 'mint', wert: c0 ? c0.typ_txt : null, txt: true, sub: c0 ? c0.datum + ' · ' + c0.sportart : ohne() ? ohneSub : 'noch keine Einheit', ampel: c0 ? { gut: 'green', achtung: 'orange', kritisch: 'red', neutral: 'gray' }[c0.ton] || 'gray' : null, erkl: 'Hat die Einheit den Reiz getroffen, den sie setzen sollte?' }),
      fk === 'performance' ? kachel({ ziel: 'training/fueling', titel: 'Fueling', icon: 'i-drop', farbe: 'orange', wert: f0 ? f0.g_h : null, u: 'g/h', sub: f0 ? f0.datum + ' · ' + f0.sportart + ' · Ziel ' + f0.ziel : ohne() ? ohneSub : 'Kohlenhydrate in langen Einheiten', erkl: 'Kohlenhydrate pro Stunde – der Treibstoff für lange Einheiten.' }) : null));
    }
    // Ziele & Rennen
    frag.push(sek('Ziele & Rennen'));
    const sz = (rowsOf('saison') || [])[0];
    const zielK = sz && sz.ziel_tage != null ? { wert: sz.ziel_tage === 0 ? 'Heute' : nf(sz.ziel_tage), u: sz.ziel_tage === 0 ? '' : 'Tage', sub: sz.ziel_name + (sz.phase_txt ? ' · ' + sz.phase_txt : '') }
      : sz && sz.naechstes ? { wert: nf(sz.naechstes.in_tagen), u: 'Tage', sub: sz.naechstes.name } : { wert: 'Rennen eintragen', cta: true, sub: 'Countdown, Phasen und Tapering' };
    const perf = fk === 'performance';
    frag.push(raster(
      kachel(Object.assign({ ziel: 'training/saison', titel: 'Saison', icon: 'i-flag', farbe: 'pink', erkl: 'Deine Rennen mit Countdown und Trainingsphasen.' }, zielK)),
      perf ? kachel({ ziel: 'training/rechner', titel: 'Rennrechner', icon: 'i-clock', farbe: 'red', wert: 'Splits & Pacing', cta: true, sub: 'Zeiten, Watt, Tempo, Verpflegung', erkl: 'Was du für deine Zielzeit in jeder Disziplin brauchst.' }) : null,
      perf ? kachel(Object.assign({ ziel: 'training/renntag', titel: 'Renntag', icon: 'i-print', farbe: 'orange', wert: 'Race Card', cta: true, sub: 'Zum Ausdrucken, dazu die Packliste', erkl: 'Alle Splits, Watt-Grenzen und Verpflegungszeiten auf einer Karte.' }, L.renntag || {})) : null,
      perf ? kachel({ ziel: 'training/werkzeuge', titel: 'Werkzeuge', icon: 'i-tool', farbe: 'gray', wert: 'W/kg · CdA · TSS', cta: true, sub: 'Rechner für Rad und Rennen', erkl: 'Kleine Rechner für Leistung und Aerodynamik.' }) : null));
    // Material und Schweiß
    frag.push(sek('Material & Körper'));
    frag.push(raster(
      kachel(Object.assign({ ziel: 'training/material', titel: 'Material', icon: 'i-chain', farbe: 'teal', wert: 'Rad & Schuhe', cta: true, sub: 'Kette wachsen, Laufschuh-Kilometer', erkl: 'Zählt die Kilometer aus Garmin automatisch mit.' }, L.material || {})),
      perf ? kachel(Object.assign({ ziel: 'training/schweiss', titel: 'Schweißrate', icon: 'i-drop', farbe: 'blue', wert: 'Test machen', cta: true, sub: 'Wiegen vor und nach dem Training', erkl: 'Wie viel du pro Stunde verlierst – für Trinken und Verpflegung.' }, L.schweiss || {})) : null));
    box.replaceChildren(el('div', { class: 'tf-hub' }, ...frag));
  }
  // Alltag & Energie: Bewegung statt Trainingsauswertung
  function renderBewegung(box) {
    const G = window.tfGym && tfGym.kurz ? tfGym.kurz() : null, F = window.tfFlow && tfFlow.kurz ? tfFlow.kurz() : null, P = window.tfPlan && tfPlan.kurz ? tfPlan.kurz() : null;
    const frag = [sek('Kurz & einfach', '5–15 Minuten zwischendurch')];
    frag.push(raster(
      kachel({ ziel: 'training/flow', titel: 'Kurz-Routinen', icon: 'i-lotus', farbe: 'teal', wert: 'Nacken, Schreibtisch, Atmen', txt: true, sub: '5–10 Minuten, geführt mit Timer', erkl: 'Für morgens, zwischendurch im Büro oder abends zum Runterkommen.' }),
      kachel(Object.assign({ ziel: 'training/gym', titel: 'Gym', icon: 'i-dumbbell', farbe: 'purple', erkl: 'Kraft an zwei Tagen pro Woche empfiehlt die WHO.' }, G || { wert: 'Muskeln antippen', cta: true, sub: 'Studio, zuhause mit oder ohne Hanteln' })),
      kachel(Object.assign({ ziel: 'training/plan', titel: 'Plan', icon: 'i-cal', farbe: 'blue', erkl: 'Ein einfacher Wochenplan für Bewegung und Kraft.' }, P || { wert: 'Plan erstellen', cta: true, sub: 'Fit & gesund – Woche für Woche' }))));
    frag.push(sek('Im Alltag'));
    sicher(() => {
      const T14 = alltag14(), z = window.tfGesund && tfGesund.schrittZiel ? tfGesund.schrittZiel() : (athlet() || {}).schritte_ziel || 8000, h = localDate();
      const sHeute = (T14.find((r) => r.date === h) || {}).steps;
      frag.push(raster(
        kachel({ ziel: 'gesundheit/aktivitaet', titel: 'Schritte & Bewegung', icon: 'i-steps', farbe: 'green', wert: sHeute > 0 ? nf(+sHeute) : null, u: sHeute > 0 ? 'heute' : '', sub: ohne() ? 'mit Garmin automatisch' : 'Ziel ' + nf(z), spark: T14.map((r) => (+r.steps > 0 ? +r.steps : null)), erkl: '6.000–10.000 Schritte am Tag senken das Sterberisiko deutlich – auch ganz ohne Sport.' }),
        kachel(Object.assign({ ziel: 'training/flow', titel: 'Pilates & Yoga', icon: 'i-lotus', farbe: 'indigo', erkl: 'Für Rücken, Beweglichkeit und Entspannung.' }, F || { wert: 'Einheit wählen', cta: true, sub: 'Rumpf, Rücken, Hüfte, Entspannung' }))));
    });
    box.replaceChildren(el('div', { class: 'tf-hub' }, ...frag));
  }

  /* =====================================================================
     GESUNDHEIT
     ===================================================================== */
  const checkinKachel = (b0) => kachel(b0 ? { ziel: 'gesundheit/checkin', titel: 'Check-in', icon: 'i-smile', farbe: 'green', wert: b0.summe, u: '/25', sub: b0.schmerz >= 3 ? 'Schmerz ' + b0.schmerz + '/10 notiert' : 'heute erledigt', spark: letzte(rowsOf('befinden'), 14).map((r) => r.summe), erkl: 'Fünf Fragen zu Schlaf, Energie, Muskeln, Stress und Stimmung.' }
        : { ziel: 'gesundheit/checkin', titel: 'Check-in', icon: 'i-smile', farbe: 'green', wert: 'Wie geht’s dir?', cta: true, sub: '20 Sekunden – fließt in die Tagesform ein', erkl: 'Fünf Fragen zu Schlaf, Energie, Muskeln, Stress und Stimmung.' });
  function renderGesundheit() {
    const box = $('#gesundheit-hub-box'); if (!box) return;
    if (ohne()) { // ohne Garmin: Check-in, Tagesform nach Gefühl, Protokoll und Laborwerte – der Rest kommt mit der Uhr
      const B0 = (rowsOf('befinden') || []).find((r) => r.date === localDate()), G0 = (rowsOf('gefuehl') || []).find((r) => r.date === localDate());
      box.replaceChildren(el('div', { class: 'tf-hub' }, sek('Jeden Tag'), raster(checkinKachel(B0),
        kachel({ ziel: 'gesundheit/checkin', titel: 'Tagesform nach Gefühl', icon: 'i-ring', farbe: 'blue', wert: G0 ? G0.score : null, u: '%', sub: G0 ? G0.label + (G0.grund ? ' · ' + G0.grund.replace('Begrenzt durch ', '') : '') : 'aus deinem Check-in', ampel: G0 ? AMPEL[G0.ampel] : null, spark: letzte(rowsOf('gefuehl'), 14).map((r) => r.score), erkl: 'Ohne Uhr: Befinden, Ruhepuls und Schlaf aus dem Check-in gegen dein eigenes Normal.' }),
        notiertKachel()), sek('Körper'), raster(laborKachel(), kachel({ ziel: 'heute/tag', titel: 'Dein Tag', icon: 'i-sun', farbe: 'yellow', wert: 'Zeitfenster', txt: true, sub: 'Koffein, Essen, Schlafenszeit', erkl: 'Wann Koffein, Essen und Licht deinem Schlaf helfen.' })), sek('Erholung & Schlaf'),
        garminKarte(['HRV', 'Ruhepuls & Atmung', 'Schlaf mit Phasen', 'Fitness-Alter', 'Körper & Energie'])));
      return;
    }
    const H = heute(), E = rowsOf('erholung') || [], E14 = letzte(E, 14);
    const frag = [];
    const bild = sicher(() => (window.tfGesund && tfGesund.bildKarte ? tfGesund.bildKarte() : null)); // alle Werte auf einen Blick
    if (bild) frag.push(bild);
    else frag.push(summe([
      { label: 'Tagesform', wert: H && H.score != null ? H.score : null, u: '%', sub: H ? H.label : ohne() ? ohneSub : '', ziel: 'heute/tagesform' },
      { label: 'HRV', wert: H ? H.hrv : null, u: 'ms', sub: H ? H.hrv_delta_txt || '' : '', ziel: 'gesundheit/hrv' },
      { label: 'Schlaf', wert: H ? H.schlaf_hm : null, u: 'h', sub: H && H.leistung_pct != null ? H.leistung_pct + ' % des Bedarfs' : '', ziel: 'gesundheit/schlaf' },
    ]));
    // Check-in
    const B = rowsOf('befinden') || [], b0 = B.find((r) => r.date === localDate());
    frag.push(sek('Jeden Morgen'));
    frag.push(raster(
      notiertKachel(),
      checkinKachel(b0),
      kachel({ ziel: 'heute/tagesform', titel: 'Tagesform', icon: 'i-ring', farbe: 'blue', wert: H && H.score != null ? H.score : null, u: '%', sub: H ? H.grund || 'Kein limitierender Faktor' : ohne() ? ohneSub : '', ampel: H ? AMPEL[H.ampel] : null, spark: E14.map((r) => r.score), erkl: 'Wie bereit dein Körper heute für Belastung ist – aus HRV, Ruhepuls, Schlaf und Befinden.' })));
    // Erholung & Schlaf
    const K = (rowsOf('hrv_korridor') || []).slice().reverse().find((r) => r.hrv7 != null), KF = T.farben.korridor;
    const SM = (rowsOf('schlafmuster') || []).find((r) => r.id === '14') || (rowsOf('schlafmuster') || [])[0];
    frag.push(sek('Erholung & Schlaf'));
    frag.push(raster(
      kachel({ ziel: 'gesundheit/hrv', titel: 'HRV', icon: 'i-wave', farbe: 'purple', wert: K ? K.hrv7 : H ? H.hrv : null, u: 'ms', sub: K ? '7-Tage-Schnitt · ' + K.titel : ohne() ? ohneSub : 'Basis entsteht', ampel: K && K.klasse ? KF[K.klasse] : null, spark: E14.map((r) => r.hrv), erkl: 'Herzfrequenzvariabilität: Je höher gegen dein Normal, desto erholter.' }),
      kachel({ ziel: 'gesundheit/puls', titel: 'Ruhepuls & Atmung', icon: 'i-heart', farbe: 'pink', wert: H ? H.rhr : null, u: 'bpm', sub: H ? 'Basis ' + H.rhr_basis_txt + ' · Atem ' + H.atem_txt + '/min' : ohne() ? ohneSub : '', spark: E14.map((r) => r.rhr), erkl: 'Ein Ruhepuls über deinem Normal kann Ermüdung oder einen Infekt anzeigen.' }),
      kachel({ ziel: 'gesundheit/schlaf', titel: 'Schlaf', icon: 'i-moon', farbe: 'indigo', wert: SM ? SM.schlaf_hm : null, u: 'h', sub: SM ? 'Ø ' + SM.naechte + ' Nächte · Bedarf ' + SM.bedarf_hm + ' h' : ohne() ? ohneSub : '', spark: E14.map((r) => r.schlaf_h), erkl: 'Erwachsene brauchen meist 7–9 Stunden – Sportler eher mehr.' })));
    // Alltag: Schritte, Bewegung, Stress und Body Battery
    sicher(() => {
      const T14 = alltag14(), z = window.tfGesund && tfGesund.schrittZiel ? tfGesund.schrittZiel() : (athlet() || {}).schritte_ziel || 8000, h = localDate();
      const sHeute = (T14.find((r) => r.date === h) || {}).steps, v7 = T14.filter((r) => r.date < h && r.steps > 0).slice(-7).map((r) => +r.steps);
      const st7 = T14.slice(-7).map((r) => +r.stress_avg).filter((x) => x >= 0), bb = T14.slice().reverse().find((r) => +r.bb_max > 0);
      frag.push(sek('Alltag & Stress'));
      frag.push(raster(
        kachel({ ziel: 'gesundheit/aktivitaet', titel: 'Schritte & Bewegung', icon: 'i-steps', farbe: 'green', wert: sHeute > 0 ? nf(+sHeute) : v7.length ? nf(Math.round(v7.reduce((a, b) => a + b, 0) / v7.length / 10) * 10) : null, u: sHeute > 0 ? 'heute' : 'Ø', sub: 'Ziel ' + nf(z) + (v7.length ? ' · Ø 7 Tage ' + nf(Math.round(v7.reduce((a, b) => a + b, 0) / v7.length / 10) * 10) : ''), spark: T14.map((r) => (+r.steps > 0 ? +r.steps : null)), erkl: '8.000–10.000 Schritte am Tag senken das Sterberisiko deutlich – auch ganz ohne Sport.' }),
        kachel({ ziel: 'gesundheit/stress', titel: 'Stress & Body Battery', icon: 'i-brain', farbe: 'orange', wert: st7.length ? nf(st7.reduce((a, b) => a + b, 0) / st7.length) : null, u: 'Ø Stress', sub: bb ? 'Body Battery morgens ' + bb.bb_max : 'Body Battery: keine Daten', spark: T14.map((r) => (+r.stress_avg >= 0 ? +r.stress_avg : null)), erkl: 'Stress schätzt die Uhr aus deiner HRV, die Body Battery zeigt deine Energiereserve.' })));
    });
    // Körper & Fitness
    const FA = rowsOf('fitness_alter') || [], fa = FA[FA.length - 1], GW = (rowsOf('gewicht_stand') || [])[0];
    frag.push(sek('Körper & Fitness'));
    frag.push(raster(
      kachel({ ziel: 'gesundheit/fitness', titel: 'Fitness-Alter', icon: 'i-hourglass', farbe: 'green', wert: fa && fa.status === 'ok' ? nf(fa.fitness_alter, 1) : null, u: 'Jahre', sub: fa && fa.status === 'ok' ? (Math.abs(fa.diff) < 0.5 ? 'so alt wie du bist' : nf(Math.abs(fa.diff), 1) + ' Jahre ' + (fa.diff < 0 ? 'jünger' : 'älter') + ' als du') : fa && fa.status === 'profil' ? 'Geburtsjahr im Profil eintragen' : ohne() ? ohneSub : 'noch zu wenig Daten', spark: letzte(FA.filter((r) => r.status === 'ok'), 26).map((r) => r.fitness_alter), erkl: 'Wie alt dein Herz-Kreislauf-System ist – vor allem aus deiner VO2max.' }),
      kachel({ ziel: 'gesundheit/koerper', titel: 'Körper & Energie', icon: 'i-scale', farbe: 'orange', wert: GW && GW.mittel7 && GW.mittel7 !== '–' ? GW.mittel7 : null, u: 'kg', sub: GW ? (fokus() === 'alltag' ? '' : 'W/kg ' + GW.wkg_ref + ' · ') + (GW.frisch ? '7-Tage-Mittel' : 'letzte Messung ' + GW.letzte_datum) : ohne() ? ohneSub : '', erkl: fokus() === 'alltag' ? 'Gewicht und Ernährung aus Garmin Connect.' : 'Gewicht, Watt pro Kilo und Kohlenhydrate für deinen Trainingstag.' }),
      laborKachel()));
    box.replaceChildren(el('div', { class: 'tf-hub' }, ...frag));
  }

  function notiertKachel() { // Trinken, Eiweiß, Koffein und Stack von heute
    const t = sicher(() => (window.tfAlltag ? { r: tfAlltag.tb(localDate()), z: tfAlltag.ziele() } : null));
    const r = t ? t.r : {}, w = +r.w || 0, p = +r.p || 0;
    const sp = []; for (let i = 13; i >= 0; i--) { const d = iso(toDay(localDate()) - i * DAY); const x = sicher(() => tfAlltag.tb(d)) || {}; sp.push(x.w ? +x.w : null); }
    return kachel({ ziel: 'gesundheit/protokoll', titel: 'Heute notiert', icon: 'i-glass', farbe: 'blue', wert: w ? nf(w / 1000, 1) : 'Antippen', u: w ? 'l' : '', txt: !w, cta: !w, sub: t ? (w ? 'von ' + nf(t.z.w.ml / 1000, 1) + ' l' : 'Trinken, Eiweiß, Koffein') + (p ? ' · ' + p + ' g Eiweiß' : '') : '', spark: sp, erkl: 'Trinken, Eiweiß, Koffein und dein eigener Stack – mit einem Tipp.' });
  }
  function laborKachel() {
    const L = ((A().state.rechner || {}).labor || {}).werte || [];
    const last = L.length ? L[L.length - 1] : null;
    return kachel({ ziel: 'gesundheit/labor', titel: 'Laborwerte', icon: 'i-flask', farbe: 'red', wert: last ? L.length : 'Eintragen', u: last ? (L.length === 1 ? 'Wert' : 'Werte') : '', txt: !last, cta: !last, sub: last ? 'zuletzt ' + +last.d.slice(8, 10) + '.' + +last.d.slice(5, 7) + '.' : 'Ferritin, Vitamin D & Co.', erkl: 'Deine Blutwerte über die Saison – nur zum Mitschreiben.' });
  }

  /* =====================================================================
     PROFIL
     ===================================================================== */
  const WISSEN_NAME = { einsteiger: 'Einsteiger', fortgeschritten: 'Fortgeschritten', profi: 'Profi' };
  function renderProfilHub() {
    const box = $('#profil-hub-box'); if (!box) return;
    const a = athlet() || {}, k = A().konto(), mail = k.email || '';
    const SN = { schwimmen: 'Schwimmen', rad: 'Rad', laufen: 'Laufen', gym: 'Gym' };
    const kopf = el('div', { class: 'tf-card tf-pf-kopf' },
      el('span', { class: 'tf-pf-avatar', text: (mail[0] || '?').toUpperCase() }),
      el('div', { class: 'tf-pf-kopf-t' }, el('b', { text: mail || 'Dein Konto' }),
        el('small', { text: [a.wissen ? WISSEN_NAME[a.wissen] : 'Wissenslevel offen', (T.sportarten() || []).map((x) => SN[x]).filter(Boolean).join(', ')].filter(Boolean).join(' · ') })));
    const stand = A().state.stand;
    const g1 = el('div', { class: 'tf-links' },
      zeile('profil/ich', 'Über dich', 'i-user', 'green', 'Fokus der App, Alter, Sportarten, Wissenslevel'),
      zeile('profil/athlet', 'Athletenprofil', 'i-gauge', 'gray', 'Gewicht, FTP, Pulszonen, Ziele', a.bestaetigt === false ? 'prüfen' : ''));
    const g2 = el('div', { class: 'tf-links' },
      zeile('profil/garmin', 'Garmin & Daten', 'i-sync', 'blue', ohne() ? 'Noch nicht verbunden' : stand ? 'Zuletzt geholt ' + A().relTime(stand.at) : 'Abruf und Aktualisierung'),
      zeile('profil/push', 'Morgen-Push', 'i-bell', 'red', 'Deine Tagesform jeden Morgen als Mitteilung'),
      zeile('profil/darstellung', 'Darstellung', 'i-sun', 'indigo', { auto: 'wie dein Gerät', light: 'hell', dark: 'dunkel' }[A().theme()] || ''));
    const g3 = el('div', { class: 'tf-links' },
      zeile('profil/konto', 'Konto & Datenschutz', 'i-lock', 'gray', 'Passwort, Garmin-Schlüssel, Daten herunterladen'),
      zeile('profil/teilen', 'Tagesform teilen', 'i-share', 'green', 'Für Freunde und Trainingspartner'),
      zeile('wissen/methodik', 'So rechnet Tagesform', 'i-book', 'gold', 'Jede Kennzahl mit Formel und Studie'));
    const karte = sicher(() => (window.tfSpiel && tfSpiel.spielerKarte ? tfSpiel.spielerKarte() : null));
    const spiel = sicher(() => (window.tfSpiel && tfSpiel.profilKacheln ? tfSpiel.profilKacheln() : null));
    box.replaceChildren(el('div', { class: 'tf-hub' }, karte || kopf, spiel ? sek('Spiel', 'XP sammeln und freischalten') : null, spiel, spiel ? sek('Einstellungen') : null, g1, g2, g3));
  }

  /* ---------- Heute: Hinweis ohne Garmin ---------- */
  function heuteHinweise() {
    const box = $('#home-hinweise'); if (!box) return;
    let h = box.querySelector('#hinweis-garmin');
    if (!ohne()) { if (h) h.remove(); return; }
    if (h) return;
    const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Garmin verbinden');
    b.addEventListener('click', () => A().showGarmin());
    h = el('article', { class: 'tf-card tf-hinweis', id: 'hinweis-garmin' },
      el('span', { class: 'tf-badge', style: 'background:var(--tf-blue)' }, svgIco('i-sync')),
      el('div', null, el('b', { text: 'Verbinde Garmin für deine Tagesform' }), el('p', { text: 'Mit HRV, Ruhepuls, Schlaf und deinen Einheiten bekommst du jeden Morgen deine Tagesform, Fitness, Form und Laufbudget.' }), el('div', { class: 'tf-form-actions' }, b)));
    box.prepend(h);
  }

  T.seite('training-hub', renderTraining);
  T.seite('gesundheit-hub', renderGesundheit);
  T.seite('profil-hub', renderProfilHub);
  T.zusatz('heute', heuteHinweise);
  window.tfHubs = { kachel, spark, fach };
})();
