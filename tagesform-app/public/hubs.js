/* Dreiklang · Bereichs-Übersichten: Training, Gesundheit, Profil.
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
      el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-blue)' }, svgIco('i-sync')), el('div', null, el('h2', { text: 'Mit Garmin kommt mehr dazu' }), el('div', { class: 'tf-sub', text: 'Dreiklang wertet deine Uhr jeden Morgen automatisch aus' }))),
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
  /* Version 12: oben „Mein Plan“, darunter ein Untermenü Gym | Pilates & Yoga | Ausdauer (gemerkt auf dem Gerät) */
  const SEGS = [['gym', 'Gym', 'i-dumbbell'], ['flow', 'Pilates & Yoga', 'i-lotus'], ['ausdauer', 'Ausdauer', 'i-run']];
  function segWahl() {
    let v = null; try { v = localStorage.getItem('tf:training-seg'); } catch (e) { /* egal */ }
    if (SEGS.some((x) => x[0] === v)) return v;
    const Sp = T.sportarten();
    return fokus() === 'performance' && Sp.some((x) => ['laufen', 'rad', 'schwimmen'].includes(x)) ? 'ausdauer' : 'gym';
  }
  function meinPlan() {
    const I = window.tfPlan && tfPlan.info ? sicher(() => tfPlan.info()) : null;
    const c = el('article', { class: 'tf-card tf-held tf-meinplan tf-buehne tf-b-plan', id: 'karte-meinplan' }, el('span', { class: 'tf-augenbraue', text: 'Mein Plan' }));
    const knoepfe = el('div', { class: 'tf-held-k' });
    const auf = el('button', { type: 'button', class: 'tf-btn tf-held-los' }, I ? 'Plan öffnen' : 'Plan erstellen');
    auf.addEventListener('click', () => T.geh('training/plan'));
    knoepfe.appendChild(auf);
    if (!I) {
      c.append(el('h2', { class: 'tf-held-t', text: 'Noch kein Plan' }), el('p', { class: 'tf-held-f', text: 'Ziel, Zeit und Sportarten wählen – du bekommst jede Woche fertig geplant, passend zu deinem Tune. In 2 Minuten erledigt.' }), knoepfe);
      return c;
    }
    const kal = el('button', { type: 'button', class: 'tf-btn tf-held-det' }, svgIco('i-cal'), ' In Kalender');
    kal.addEventListener('click', () => window.tfPlan && tfPlan.kalender && tfPlan.kalender());
    knoepfe.appendChild(kal);
    const [t1, ...t2] = String(I.titel || 'Dein Plan').split(' · '); // „Ironman Frankfurt · Langdistanz“ → Titel und Zusatz
    c.append(el('h2', { class: 'tf-held-t', text: t1.replace(/[.!]$/, '') }),
      el('p', { class: 'tf-held-u', text: (t2.length ? t2.join(' · ') + ' · ' : '') + (I.woche ? 'Woche ' + I.woche + ' von ' + I.N + ' · ' + I.phase : I.bald ? 'Startet am ' + I.start.slice(8, 10) + '.' + I.start.slice(5, 7) + '.' : 'Abgeschlossen') }), el('hr'));
    if (I.woche) {
      const punkte = el('span', { class: 'tf-held-punkte', 'aria-hidden': 'true' }); for (let k = 0; k < I.geplant; k++) punkte.appendChild(el('i', { class: k < I.erledigt ? 'an' : '' }));
      c.append(el('div', { class: 'tf-held-z' },
        el('div', null, el('b', { class: 'num' }, String(I.erledigt), el('span', { class: 'tf-u', text: 'von ' + I.geplant })), el('small', null, 'Diese Woche erledigt ', punkte)),
        el('div', null, el('b', { class: 'num tf-held-heute', text: I.heute.length ? I.heute.map((x) => x.titel).join(' + ') : 'Ruhetag' }), el('small', { text: I.heute.length ? 'Heute · ' + I.heute.reduce((x, y) => x + y.min, 0) + ' min' : 'Heute' }))));
    }
    c.appendChild(knoepfe);
    return c;
  }
  function segKnopf(seg) {
    const g = el('div', { class: 'tf-seg tf-train-seg', role: 'tablist', 'aria-label': 'Training' });
    SEGS.forEach(([id, name, icon]) => {
      const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(seg === id), 'aria-pressed': String(seg === id), 'data-seg': id }, svgIco(icon), el('span', { text: name }));
      b.addEventListener('click', () => { try { localStorage.setItem('tf:training-seg', id); } catch (e) { /* egal */ } renderTraining(); });
      g.appendChild(b);
    });
    return g;
  }
  function gymTeil() {
    const G = window.tfGym && tfGym.kurz ? tfGym.kurz() : null, out = [sek('Gym', 'Muskeln antippen, Workout bekommen, Sätze abhaken')];
    out.push(raster(
      kachel(Object.assign({ ziel: 'training/gym', titel: 'Workout', icon: 'i-dumbbell', farbe: 'purple', erkl: 'Tippe die Muskeln an, die du trainieren willst – du bekommst Übungen, Sätze und Gewichte.' }, G || { wert: 'Muskeln antippen', cta: true, sub: 'Studio, zuhause mit oder ohne Hanteln' })),
      kachel({ ziel: 'training/gym/uebungen', titel: 'Alle Übungen', icon: 'i-list', farbe: 'purple', wert: 'Mit Anleitung', txt: true, sub: 'Zum Nachlesen und Austauschen' }),
      kachel({ ziel: 'wissen/maximalkraft', titel: 'Kraft verstehen', icon: 'i-book', farbe: 'gold', wert: 'Wissen', txt: true, sub: 'Maximalkraft, RIR, Muskelaufbau' })));
    return out;
  }
  function flowTeil() {
    const F = window.tfFlow && tfFlow.kurz ? tfFlow.kurz() : null, out = [sek('Pilates & Yoga', 'Rumpf, Rücken, Beweglichkeit, Entspannung')];
    out.push(raster(
      kachel(Object.assign({ ziel: 'training/flow', titel: 'Einheit', icon: 'i-lotus', farbe: 'teal', erkl: 'Geführt mit Timer, Seitenwechsel und Atemkreis.' }, F || { wert: 'Einheit wählen', cta: true, sub: 'Rumpf, Rücken, Hüfte, Entspannung' })),
      kachel({ ziel: 'training/flow/uebungen', titel: 'Alle Übungen', icon: 'i-list', farbe: 'teal', wert: 'Mit Anleitung', txt: true, sub: 'Pilates, Yoga und Kurz-Routinen' }),
      kachel({ ziel: 'wissen/pilates', titel: 'Warum es wirkt', icon: 'i-book', farbe: 'gold', wert: 'Wissen', txt: true, sub: 'Pilates, Yoga und Atmung' })));
    return out;
  }
  function renderTraining() {
    const box = $('#training-hub-box'); if (!box) return;
    const fk = fokus(), seg = segWahl();
    if (fk === 'alltag') T.kopf({ titel: 'Bewegung', sub: 'Plan, Gym, Pilates & Yoga und Ausdauer' });
    const frag = [meinPlan(), segKnopf(seg)];
    if (seg === 'gym') frag.push(...gymTeil());
    else if (seg === 'flow') frag.push(...flowTeil());
    else if (fk === 'alltag') frag.push(...bewegungTeil());
    else frag.push(...ausdauerTeil());
    box.replaceChildren(el('div', { class: 'tf-hub tf-train' }, ...frag));
  }
  function ausdauerTeil() {
    const H = heute(), a = athlet() || {}, PD = rowsOf('pmc_disziplin') || [], pd = PD[PD.length - 1] || {}, Sp = T.sportarten();
    const E7 = einheiten7(), min7 = E7.reduce((x, b) => x + (+b.min || 0), 0);
    const frag = [], fk = fokus();
    if (!ohne()) frag.push(summe([
      { label: 'Letzte 7 Tage', wert: ohne() ? null : hmin(min7 * 60), u: 'h', sub: ohne() ? ohneSub : E7.length + (E7.length === 1 ? ' Einheit' : ' Einheiten'), ziel: 'training/umfang' },
      { label: fach('Fitness', 'CTL'), wert: H ? H.ctl : null, sub: H ? 'Spitze ' + H.ctl_peak : ohne() ? ohneSub : '', ziel: 'training/form' },
      { label: fach('Form', 'TSB'), wert: H ? H.tsb_txt : null, sub: H ? formText(H.tsb).replace(/ –.*/, '') : '', ziel: 'training/form' },
    ]));
    const L = window.tfLeistung && tfLeistung.kurz ? sicher(() => tfLeistung.kurz()) || {} : {};
    // Sportarten
    const SPORT = [['schwimmen', 'Schwimmen', 'i-swim', 'blue', 'swim'], ['rad', 'Rad', 'i-bike', 'orange', 'bike'], ['laufen', 'Laufen', 'i-run', 'mint', 'run']].filter(([id]) => Sp.includes(id));
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
      fk === 'performance' ? kachel({ ziel: 'training/fueling', titel: 'Fueling', icon: 'i-drop', farbe: 'orange', wert: f0 ? f0.g_h : null, u: 'g/h', sub: f0 ? f0.datum + ' · ' + f0.sportart + ' · Ziel ' + f0.ziel : ohne() ? ohneSub : 'Kohlenhydrate in langen Einheiten', erkl: 'Kohlenhydrate pro Stunde – der Treibstoff für lange Einheiten.' }) : null,
      leistungsTrend()));
    }
    // Version 20: Ziele, Rennrechner und Renntag wohnen jetzt im Bereich „Rennen“ – hier nur der Weg dorthin
    const sz = (rowsOf('saison') || [])[0];
    frag.push(sek('Dein Rennen & dein Wissen'));
    frag.push(raster(kachel(Object.assign({ ziel: 'rennen', titel: 'Rennen', icon: 'i-flag', farbe: 'pink', erkl: 'Ziel, Strecke, Prognose und Pacing – der ganze Bereich.' },
      sz && sz.ziel_tage != null ? { wert: sz.ziel_tage === 0 ? 'Heute' : nf(sz.ziel_tage), u: sz.ziel_tage === 0 ? '' : 'Tage', sub: sz.ziel_name + (sz.phase_txt ? ' · ' + sz.phase_txt : '') } : { wert: 'Ziel wählen', cta: true, sub: 'Weltkarte mit 130 Strecken' })),
      kachel({ ziel: 'training/bibliothek', titel: 'Trainingsbibliothek', icon: 'i-book', farbe: 'gold', wert: 'Jede Einheit', txt: true, sub: 'Form, Wozu und So geht’s', erkl: 'Alle Einheiten des Plans erklärt – mit Zielbereichen aus deinem Profil.' }),
      fk === 'performance' ? kachel({ ziel: 'training/werkzeuge', titel: 'Werkzeuge', icon: 'i-tool', farbe: 'gray', wert: 'W/kg · CdA · TSS', cta: true, sub: 'Rechner für Rad und Rennen', erkl: 'Kleine Rechner für Leistung, Aerodynamik und Belastung.' }) : null));
    // Material und Schweiß
    frag.push(sek('Material & Körper'));
    frag.push(raster(
      kachel(Object.assign({ ziel: 'training/material', titel: 'Material', icon: 'i-chain', farbe: 'teal', wert: 'Rad & Schuhe', cta: true, sub: 'Kette wachsen, Laufschuh-Kilometer', erkl: 'Zählt die Kilometer aus Garmin automatisch mit.' }, L.material || {})),
      fk === 'performance' ? kachel(Object.assign({ ziel: 'rennen/schweiss', titel: 'Schweißrate', icon: 'i-drop', farbe: 'blue', wert: 'Test machen', cta: true, sub: 'Wiegen vor und nach dem Training', erkl: 'Wie viel du pro Stunde verlierst – für Trinken und Verpflegung.' }, L.schweiss || {})) : null));
    return frag;
  }
  // Alltag & Energie: im Untermenü „Ausdauer“ Schritte, Gehen und die gewählten Sportarten statt Trainingsauswertung
  function bewegungTeil() {
    const out = [sek('Ausdauer im Alltag', 'Schritte, Gehen und deine Sportarten')], Sp = T.sportarten();
    sicher(() => {
      const T14 = alltag14(), z = window.tfGesund && tfGesund.schrittZiel ? tfGesund.schrittZiel() : (athlet() || {}).schritte_ziel || 8000, h = localDate();
      const sHeute = (T14.find((r) => r.date === h) || {}).steps;
      const SPORT = [['laufen', 'Laufen', 'i-run', 'mint'], ['rad', 'Rad', 'i-bike', 'orange'], ['schwimmen', 'Schwimmen', 'i-swim', 'blue']].filter(([id]) => Sp.includes(id));
      out.push(raster(
        kachel({ ziel: 'gesundheit/aktivitaet', titel: 'Schritte & Bewegung', icon: 'i-steps', farbe: 'green', wert: sHeute > 0 ? nf(+sHeute) : null, u: sHeute > 0 ? 'heute' : '', sub: ohne() ? 'mit Garmin automatisch' : 'Ziel ' + nf(z), spark: T14.map((r) => (+r.steps > 0 ? +r.steps : null)), erkl: 'Schon 7.000–8.000 Schritte am Tag senken das Risiko für Herz-Kreislauf-Erkrankungen deutlich.' }),
        ...SPORT.map(([id, name, icon, farbe]) => kachel({ ziel: 'training/' + id, titel: name, icon, farbe, wert: ohne() ? null : 'Deine Einheiten', txt: true, sub: ohne() ? ohneSub : 'Verlauf und Tipps' })),
        kachel({ ziel: 'wissen/zone2', titel: 'Ausdauer verstehen', icon: 'i-book', farbe: 'gold', wert: 'Wissen', txt: true, sub: 'Locker, Zone 2 und 80/20' })));
    });
    return out;
  }

  /* =====================================================================
     GESUNDHEIT
     ===================================================================== */
  const checkinKachel = (b0) => kachel(b0 ? { ziel: 'gesundheit/checkin', titel: 'Check-in', icon: 'i-smile', farbe: 'green', wert: b0.summe, u: '/25', sub: b0.schmerz >= 3 ? 'Schmerz ' + b0.schmerz + '/10 notiert' : 'heute erledigt', spark: letzte(rowsOf('befinden'), 14).map((r) => r.summe), erkl: 'Fünf Fragen zu Schlaf, Energie, Muskeln, Stress und Stimmung.' }
        : { ziel: 'gesundheit/checkin', titel: 'Check-in', icon: 'i-smile', farbe: 'green', wert: 'Wie geht’s dir?', cta: true, sub: '20 Sekunden – fließt in deinen Tune ein', erkl: 'Fünf Fragen zu Schlaf, Energie, Muskeln, Stress und Stimmung.' });
  // Version 9: Was dich beeinflusst – Muster aus den eigenen Daten
  const einflussKachel = () => { const k = sicher(() => (window.tfEinblick && tfEinblick.kurz ? tfEinblick.kurz() : null)); return kachel(Object.assign({ ziel: 'gesundheit/einfluss', titel: 'Was dich beeinflusst', icon: 'i-muster', farbe: 'gold', erkl: 'Welche Gewohnheiten mit besserem oder schlechterem Schlaf und Befinden am nächsten Morgen zusammenhängen.' }, k || { wert: 'Muster finden', cta: true, sub: 'aus deinen eigenen Daten' })); };
  // Version 10: Trends – letzte 4 Wochen gegen die Monate davor, dazu 30/90/365 Tage
  // Version 10: Lauftempo, Rad-Leistung und Kraft – letzte 4 Wochen gegen die Monate davor
  const leistungsTrend = () => {
    const L = sicher(() => (window.tfRueckblick ? tfRueckblick.trends().filter((t) => ['tempo', 'rad', 'kraft'].includes(t.id)) : null)) || [];
    if (!L.length) return null;
    const B = L.filter((t) => t.richtung !== 0), gut = B.filter((t) => t.besser).length;
    const wort = (t) => (t.richtung === 0 ? 'stabil' : t.id === 'tempo' ? (t.besser ? 'schneller' : 'langsamer') : t.besser ? 'stärker' : 'schwächer');
    return kachel({ ziel: 'gesundheit/trends', titel: 'Leistungs-Trends', icon: 'i-pfeil', farbe: 'blue', wert: !B.length ? 'Stabil' : gut ? gut + ' von ' + B.length + ' besser' : B.length + (B.length === 1 ? ' Trend' : ' Trends'), txt: true,
      sub: L.map((t) => t.name.replace(/ \(NP\)/, '') + ' ' + wort(t)).join(' · '), erkl: 'Letzte 4 Wochen gegen die Monate davor – ruhig, ohne täglichen Alarm.' });
  };
  const trendKachel = () => { const k = sicher(() => (window.tfRueckblick && tfRueckblick.kurz ? tfRueckblick.kurz() : null)); return kachel(Object.assign({ ziel: 'gesundheit/trends', titel: 'Deine Trends', icon: 'i-pfeil', farbe: 'blue', erkl: 'Was sich über Wochen und Monate verändert – ruhig, ohne täglichen Alarm.' }, k || { wert: 'Ansehen', txt: true, sub: '30, 90 und 365 Tage im Vergleich' })); };
  function renderGesundheit() {
    const box = $('#gesundheit-hub-box'); if (!box) return;
    if (ohne()) { // ohne Garmin: Check-in, Tune nach Gefühl, Protokoll und Laborwerte – der Rest kommt mit der Uhr
      const B0 = (rowsOf('befinden') || []).find((r) => r.date === localDate()), G0 = (rowsOf('gefuehl') || []).find((r) => r.date === localDate());
      box.replaceChildren(el('div', { class: 'tf-hub' }, sek('Jeden Tag'), raster(checkinKachel(B0),
        kachel({ ziel: 'gesundheit/checkin', titel: 'Tune nach Gefühl', icon: 'i-ring', farbe: 'blue', wert: G0 ? G0.score : null, u: '%', sub: G0 ? G0.label + (G0.grund ? ' · ' + G0.grund.replace('Begrenzt durch ', '') : '') : 'aus deinem Check-in', ampel: G0 ? AMPEL[G0.ampel] : null, spark: letzte(rowsOf('gefuehl'), 14).map((r) => r.score), erkl: 'Ohne Uhr: Befinden, Ruhepuls und Schlaf aus dem Check-in gegen dein eigenes Normal.' }),
        notiertKachel()), sek('Körper'), raster(einflussKachel(), laborKachel(), kachel({ ziel: 'heute/tag', titel: 'Dein Tag', icon: 'i-sun', farbe: 'yellow', wert: 'Zeitfenster', txt: true, sub: 'Koffein, Essen, Schlafenszeit', erkl: 'Wann Koffein, Essen und Licht deinem Schlaf helfen.' })), sek('Erholung & Schlaf'),
        garminKarte(['HRV', 'Ruhepuls & Atmung', 'Schlaf mit Phasen', 'Fitness-Alter', 'Körper & Energie'])));
      return;
    }
    const H = heute(), E = rowsOf('erholung') || [], E14 = letzte(E, 14);
    const frag = [];
    const bild = sicher(() => (window.tfGesund && tfGesund.bildKarte ? tfGesund.bildKarte() : null)); // alle Werte auf einen Blick
    if (bild) frag.push(bild);
    else frag.push(summe([
      { label: 'Tune', wert: H && H.score != null ? H.score : null, u: '%', sub: H ? H.label : ohne() ? ohneSub : '', ziel: 'heute/tagesform' },
      { label: 'HRV', wert: H ? H.hrv : null, u: 'ms', sub: H ? H.hrv_delta_txt || '' : '', ziel: 'gesundheit/hrv' },
      { label: 'Schlaf', wert: H ? H.schlaf_hm : null, u: 'h', sub: H && H.leistung_pct != null ? H.leistung_pct + ' % des Bedarfs' : '', ziel: 'gesundheit/schlaf' },
    ]));
    // Check-in
    const B = rowsOf('befinden') || [], b0 = B.find((r) => r.date === localDate());
    frag.push(sek('Jeden Morgen'));
    frag.push(raster(
      notiertKachel(),
      checkinKachel(b0),
      kachel({ ziel: 'heute/tagesform', titel: 'Tune', icon: 'i-ring', farbe: 'blue', wert: H && H.score != null ? H.score : null, u: '%', sub: H ? H.grund || 'Kein limitierender Faktor' : ohne() ? ohneSub : '', ampel: H ? AMPEL[H.ampel] : null, spark: E14.map((r) => r.score), erkl: 'Wie bereit dein Körper heute für Belastung ist – aus HRV, Ruhepuls, Schlaf und Befinden.' })));
    // Erholung & Schlaf
    const K = (rowsOf('hrv_korridor') || []).slice().reverse().find((r) => r.hrv7 != null), KF = T.farben.korridor;
    const SM = (rowsOf('schlafmuster') || []).find((r) => r.id === '14') || (rowsOf('schlafmuster') || [])[0];
    frag.push(sek('Erholung & Schlaf'));
    frag.push(raster(
      kachel({ ziel: 'gesundheit/hrv', titel: 'HRV', icon: 'i-wave', farbe: 'purple', wert: K ? K.hrv7 : H ? H.hrv : null, u: 'ms', sub: K ? '7-Tage-Schnitt · ' + K.titel : ohne() ? ohneSub : 'Basis entsteht', ampel: K && K.klasse ? KF[K.klasse] : null, spark: E14.map((r) => r.hrv), erkl: 'Herzfrequenzvariabilität: Je höher gegen dein Normal, desto erholter.' }),
      kachel({ ziel: 'gesundheit/puls', titel: 'Ruhepuls & Atmung', icon: 'i-heart', farbe: 'pink', wert: H ? H.rhr : null, u: 'bpm', sub: H ? 'Basis ' + H.rhr_basis_txt + ' · Atem ' + H.atem_txt + '/min' : ohne() ? ohneSub : '', spark: E14.map((r) => r.rhr), erkl: 'Ein Ruhepuls über deinem Normal kann Ermüdung oder einen Infekt anzeigen.' }),
      kachel({ ziel: 'gesundheit/schlaf', titel: 'Schlaf', icon: 'i-moon', farbe: 'indigo', wert: SM ? SM.schlaf_hm : null, u: 'h', sub: SM ? 'Ø ' + SM.naechte + ' Nächte · Bedarf ' + SM.bedarf_hm + ' h' : ohne() ? ohneSub : '', spark: E14.map((r) => r.schlaf_h), erkl: 'Erwachsene brauchen meist 7–9 Stunden – Sportler eher mehr.' }),
      einflussKachel(), trendKachel()));
    const bilanz = sicher(() => (window.tfGesund && tfGesund.bilanzKarte ? tfGesund.bilanzKarte() : null)); if (bilanz) frag.push(raster(bilanz)); // Version 20
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
  // Version 19: eigene Bett- und Schlafenszeit – oder automatisch
  function schlafZeile(a) {
    const M = window.tfAlltagMotor, u = (m) => { const t = M.uhrzeit(m); return t.charAt(0) === '0' ? t.slice(1) : t; };
    if (!M || (a.bett_min == null && a.schlafen_min == null)) return 'Automatisch aus Aufstehzeit und Schlafbedarf';
    const b = a.bett_min != null ? +a.bett_min : +a.schlafen_min - 15, s = a.schlafen_min != null ? +a.schlafen_min : b + 15;
    return 'Ins Bett ' + u(b) + ' · Schlafen ' + u(s);
  }
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
      zeile('profil/push', 'Morgen-Push', 'i-bell', 'red', 'Dein Tune jeden Morgen als Mitteilung'),
      zeile('profil/darstellung', 'Darstellung', 'i-sun', 'indigo', { auto: 'wie dein Gerät', light: 'hell', dark: 'dunkel' }[A().theme()] || ''),
      zeile('profil/bedienung', 'Bedienungshilfen', 'i-schrift', 'gray', window.tfBedienung ? window.tfBedienung.name() : 'Schriftgröße und Textmenge'), // Version 19
      zeile('profil/abend', 'Schlaf & Abend', 'i-moon', 'indigo', schlafZeile(a)));
    const g3 = el('div', { class: 'tf-links' },
      zeile('profil/konto', 'Konto & Datenschutz', 'i-lock', 'gray', 'Passwort, Garmin-Schlüssel, Daten herunterladen'),
      zeile('profil/teilen', 'Dreiklang teilen', 'i-share', 'green', 'Für Freunde und Trainingspartner'),
      zeile('wissen/methodik', 'So rechnet Dreiklang', 'i-book', 'gold', 'Jede Kennzahl mit Formel und Studie'));
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
      el('span', { class: 'tf-badge', style: '--c:var(--tf-blue)' }, svgIco('i-sync')),
      el('div', null, el('b', { text: 'Verbinde Garmin für deinen Tune' }), el('p', { text: 'Mit HRV, Ruhepuls, Schlaf und deinen Einheiten bekommst du jeden Morgen deinen Tune, Fitness, Form und Laufbudget.' }), el('div', { class: 'tf-form-actions' }, b)));
    box.prepend(h);
  }

  T.seite('training-hub', renderTraining);
  T.seite('gesundheit-hub', renderGesundheit);
  T.seite('profil-hub', renderProfilHub);
  T.zusatz('heute', heuteHinweise);
  window.tfHubs = { kachel, spark, fach };
})();
