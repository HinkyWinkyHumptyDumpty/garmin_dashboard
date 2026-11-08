/* Dreiklang · Einheit im Blick (Version 25)
   1. „Heute trainiert“ ganz oben auf Heute: jede Einheit des Tages als Kachel – Sportart, Uhrzeit, Dauer, Strecke,
      Belastung, die Einheit als Wellenform (echter Verlauf, sonst Zeit in den Pulszonen) und ein kurzer Befund.
      Antippen öffnet die Analyse.
   2. Analyse (#heute/einheit/<id>): die Bühne mit Zahlen und der Signatur (der echte Verlauf als Wellenform),
      Wirkung (Trainingseffekt aerob und anaerob als Zifferblätter, Hauptreiz), Fitness-Konto (Impuls-Antwort-Modell:
      Gewinn und Ermüdung über vier Wochen, ab wann sich die Einheit auszahlt), Plan (Soll und Ist als Wellenformen,
      Woche, Phase), Einordnung (alle Einheiten der Sportart aus zwölf Wochen als Schwarm, Bestmarken), Technik
      (Laufdynamik, Rad mit Leistungskurve, Schwimmen), Erholung (Zeitachse, morgen im Plan) und der Verlauf im Detail.
   Alles kommt aus Daten, die die App schon hat: Belastung (calcs „belastung“), Garmin-Rohwerte, Einheiten-Check
   (Sekundendaten vom Server) und der Plan. Nichts wird erfunden – fehlt ein Wert, fehlt der Teil. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svg, svgIco, nf, iso, toDay, DAY, localDate, rowsOf, col, mmss, hm, plot, line, refLine, hoverTime, emptyNote, kv } = T.ui;
  const A = () => dash.app;
  const kart = (o) => window.tfSeiten.karte(o);
  const sicher = (fn, ersatz) => { try { return fn(); } catch (e) { console.error(e); return ersatz === undefined ? null : ersatz; } };
  const NS = 'http://www.w3.org/2000/svg';
  const plus = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  const tagText = (d) => WT[toDay(d).getUTCDay()] + ' ' + +d.slice(8, 10) + '. ' + MON[+d.slice(5, 7) - 1];
  const dauer = (min) => (min >= 60 ? hm(min / 60) + ' h' : Math.round(min) + ' min');
  const sg = (x, d) => (x == null || !isFinite(x) ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '±') + nf(Math.abs(x), d || 0));
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const zahl = (x) => (x == null || !isFinite(+x) || +x <= 0 ? null : +x);

  /* ---------- Sportarten ---------- */
  const SPORT = {
    run: { name: 'Laufen', kein: 'kein Lauf', icon: 'i-run', farbe: 'mint', buehne: 'lauf', lang: 'Längster Lauf', hart: 'Härtester Lauf', weit: 'Weitester Lauf', mehrz: 'Läufe' },
    bike: { name: 'Rad', kein: 'keine Radeinheit', icon: 'i-bike', farbe: 'orange', buehne: 'rad', lang: 'Längste Ausfahrt', hart: 'Härteste Ausfahrt', weit: 'Weiteste Ausfahrt', mehrz: 'Ausfahrten' },
    swim: { name: 'Schwimmen', kein: 'keine Schwimmeinheit', icon: 'i-swim', farbe: 'blue', buehne: 'schwimm', lang: 'Längste Schwimmeinheit', hart: 'Härteste Schwimmeinheit', weit: 'Weiteste Schwimmeinheit', mehrz: 'Schwimmeinheiten' },
    kraft: { name: 'Kraft', kein: 'keine Krafteinheit', icon: 'i-dumbbell', farbe: 'purple', buehne: 'kraft', lang: 'Längste Krafteinheit', hart: 'Härteste Krafteinheit', weit: null, mehrz: 'Krafteinheiten' },
    other: { name: 'Sport', kein: 'keine solche Einheit', icon: 'i-body', farbe: 'teal', buehne: 'sonst', lang: 'Längste Einheit', hart: 'Härteste Einheit', weit: 'Weiteste Einheit', mehrz: 'Einheiten' },
  };
  // Garmin-Aktivität → Sportart (wie calcs „belastung“)
  const TYP = { lap_swimming: 'swim', open_water_swimming: 'swim', cycling: 'bike', indoor_cycling: 'bike', virtual_ride: 'bike', road_biking: 'bike', gravel_cycling: 'bike', mountain_biking: 'bike', running: 'run', treadmill_running: 'run', trail_running: 'run', track_running: 'run', strength_training: 'kraft', hiit: 'kraft', transition_v2: 'wechsel' };
  const sportVon = (t) => TYP[t] || 'other';

  /* ---------- Daten einer Einheit ---------- */
  function alle() { return (rowsOf('belastung') || []).filter((b) => b && b.date && b.sport !== 'wechsel' && (+b.min || 0) >= 5); }
  let rohC = { q: null, m: null };
  function rohListe() { return (A().raw && A().raw('garmin_einheiten')) || []; }
  function roh(id) {
    const R = rohListe();
    if (rohC.q !== R) rohC = { q: R, m: new Map(R.map((e) => [String(e.id), e])) };
    return rohC.m.get(String(id)) || null;
  }
  const analyse = (id) => (rowsOf('einheiten_check') || []).find((c) => String(c.id) === String(id)) || null;
  const zeitVon = (G) => (G && G.start && String(G.start).length >= 16 ? String(G.start).replace(' ', 'T').slice(11, 16) : null);
  function planFuer(B, min) { // die geplante Einheit desselben Tages und derselben Sportart, bei mehreren die mit der ähnlichsten Dauer
    const P = window.tfPlan; if (!P || !P.tagStatus) return null;
    const st = P.tagStatus(B.date); if (!st) return null; // kein Plan angelegt
    if (!st.imPlan) return { st, e: null, s: null };
    const kand = st.einheiten.map((e, i) => Object.assign({ i }, e)).filter((e) => !e.rennen && e.garmin && e.garmin === B.sport);
    const e = kand.length ? kand.slice().sort((x, y) => Math.abs(x.min - min) - Math.abs(y.min - min))[0] : null;
    const L = e && P.tag ? P.tag(B.date) || [] : [];
    return { st, e, s: e ? L[e.i] || null : null };
  }
  // Kraft und Sonstiges: die ganze Einheit mit Pausen zählt – „in Bewegung“ misst die Uhr dort nur während der Sätze
  function minuten(B) {
    const netto = +B.min || 0; if (B.sport !== 'kraft' && B.sport !== 'other') return netto;
    const G = roh(B.id), brutto = G && +G.dur_s > 0 ? +G.dur_s / 60 : null;
    return brutto && brutto >= netto + 3 ? Math.round(brutto) : netto;
  }
  function holen(id) {
    const B = alle().find((b) => String(b.id) === String(id)); if (!B) return null;
    const G = roh(B.id), C = analyse(B.id), sp = SPORT[B.sport] || SPORT.other, eigen = String(B.id).indexOf('eigen:') === 0;
    const E = { id: String(B.id), B, G, C, sp, eigen, zeit: zeitVon(G) };
    E.min = minuten(B); E.aktiv = E.min !== (+B.min || 0) ? Math.round(+B.min || 0) : null;
    E.plan = sicher(() => planFuer(B, E.min));
    E.titel = (E.plan && E.plan.e && E.plan.e.titel) || (G && G.name ? String(G.name) : '') || (B.name || '') || sp.name;
    return E;
  }
  function tagesListe(d) { return alle().filter((b) => b.date === d).map((b) => holen(b.id)).filter(Boolean).sort((x, y) => String(x.zeit || '99').localeCompare(String(y.zeit || '99'))); }
  function zuPlan(datum, planSport) { // id der gemessenen Einheit zu einer geplanten (für Plan und Bühne)
    const g = { laufen: 'run', rad: 'bike', schwimmen: 'swim', kraft: 'kraft' }[planSport]; if (!g) return null;
    const L = alle().filter((b) => b.date === datum && b.sport === g && String(b.id).indexOf('eigen:') !== 0).sort((x, y) => y.min - x.min);
    return L.length ? String(L[0].id) : null;
  }

  /* ---------- Verlauf (Sekundendaten, verdichtet vom Server) ---------- */
  const SERIE = new Map(), LAEDT = new Set(), FEHL = new Map();
  function serie(E, fertig) {
    if (!E.C || E.eigen || !/^\d{1,20}$/.test(E.id)) return null; // nur Rad und Laufen mit Auswertung haben einen Verlauf
    if (SERIE.get(E.id) === false && Date.now() - (FEHL.get(E.id) || 0) > 20000) SERIE.delete(E.id); // war offline: beim nächsten Öffnen neu versuchen
    if (SERIE.has(E.id)) return SERIE.get(E.id);
    if (!LAEDT.has(E.id)) {
      LAEDT.add(E.id);
      A().api('GET', '/api/data?serie=' + encodeURIComponent(E.id))
        .then((j) => { SERIE.set(E.id, j && j.serie && j.serie.m && j.serie.m.length > 5 ? j.serie : null); })
        .catch(() => { SERIE.set(E.id, false); FEHL.set(E.id, Date.now()); })
        .finally(() => { LAEDT.delete(E.id); if (fertig) sicher(fertig); });
    }
    return undefined; // lädt noch
  }
  // Signatur: der Verlauf als 96 Striche – Höhe aus Leistung (Rad), Tempo (Laufen) oder Puls, Farbe nach Zone
  function signatur(E, S, n) {
    const a = athlet(), N = n || 96, M = S.m, T0 = M[M.length - 1] || 1, rad = E.B.sport === 'bike';
    const hasP = rad && S.p && S.p.some((x) => x > 0) && a.ftp_ref_w, hasV = !rad && S.v && S.v.some((x) => x > 1.5) && a.vt1_pace_s_km && a.vt2_pace_s_km;
    const hasH = S.hr && S.hr.some((x) => x > 60) && a.vt1_hf && a.vt2_hf;
    if (!hasP && !hasV && !hasH) return null;
    // Höhe: Leistung (Rad), Tempo (Laufen) oder Puls. Farbe: beim Rad die Leistungszone, beim Laufen die Pulszone –
    // wie der Befund (Puls entscheidet; Tempo schwankt mit Gelände und GPS)
    const hoehe = (i) => (hasP ? S.p[i] : hasV ? S.v[i] : S.hr[i]), zone = (i) => (hasP ? S.p[i] : hasH ? S.hr[i] : S.v[i]);
    let lo, hi;
    if (hasP) { lo = 0.3 * a.ftp_ref_w; hi = 1.3 * a.ftp_ref_w; }
    else if (hasV) { lo = 0.62 * (1000 / a.vt1_pace_s_km); hi = 1.12 * (1000 / a.vt2_pace_s_km); }
    else { lo = Math.max(70, a.vt1_hf - 45); hi = Math.min(a.hf_max || a.vt2_hf + 15, a.vt2_hf + 12); }
    const g = hasP ? [0.76 * a.ftp_ref_w, a.ftp_ref_w] : hasH ? [a.vt1_hf, a.vt2_hf] : [1000 / a.vt1_pace_s_km, 1000 / a.vt2_pace_s_km];
    const bins = Array.from({ length: N }, () => ({ s: 0, k: 0, z: 0, zk: 0, still: 0 }));
    M.forEach((m, i) => {
      const b = bins[Math.min(N - 1, Math.max(0, Math.floor((m / T0) * N)))], v = hoehe(i), w = zone(i);
      if (v != null && v > 0) { b.s += v; b.k++; } else if (v === 0) b.still++;
      if (w != null && w > 0) { b.z += w; b.zk++; }
    });
    let last = null, lastZ = null;
    const bars = bins.map((b) => {
      if (b.k) last = b.s / b.k; if (b.zk) lastZ = b.z / b.zk;
      const w = b.zk ? b.z / b.zk : lastZ, z = w == null ? 0 : w < g[0] ? 0 : w < g[1] ? 1 : 2;
      if (!b.k && b.still) return { h: 0.08, z }; // Stillstand – am Start, an der Ampel: als flacher Strich, nicht als Lücke
      const v = b.k ? b.s / b.k : last;
      return v == null ? null : { h: Math.max(0.08, Math.min(1, (v - lo) / (hi - lo))), z };
    });
    // beginnt der Verlauf später (Uhr ohne Werte), füllt der erste Wert die Lücke – die Welle startet immer links
    for (let i = 0, f = bars.find((x) => x); f && i < N && !bars[i]; i++) bars[i] = f;
    return { bars, art: hasP ? 'Leistung' : hasV ? 'Tempo' : 'Puls', farbe: hasP ? 'Leistungszone' : hasH ? 'Pulszone' : 'Tempozone', T: T0 };
  }
  function welle(D, o) { // wie die Wellenform der Bibliothek – nur mit dem, was wirklich passiert ist
    o = o || {};
    const n = D.bars.length, sw = 4, H = o.h || 44, W = n * sw;
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H); s.setAttribute('preserveAspectRatio', 'none');
    s.setAttribute('class', 'tf-welle tf-ei-welle' + (o.cls ? ' ' + o.cls : '')); s.setAttribute('aria-hidden', 'true');
    D.bars.forEach((b, i) => {
      if (!b) return;
      const hh = Math.max(2.5, (H - 1) * b.h), r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', (i * sw + sw * 0.18).toFixed(2)); r.setAttribute('y', (H - hh).toFixed(2)); r.setAttribute('width', (sw * 0.64).toFixed(2)); r.setAttribute('height', hh.toFixed(2)); r.setAttribute('rx', (sw * 0.32).toFixed(2));
      r.setAttribute('class', 'z' + b.z); s.appendChild(r);
    });
    return s;
  }
  // Zeit in den fünf Pulszonen der Uhr (für Einheiten ohne Verlauf: Schwimmen, Kraft, Sonstiges)
  function zonen5(E) {
    const G = E.G; if (!G) return null;
    const t = [1, 2, 3, 4, 5].map((i) => +G['z' + i + '_s'] || 0), s = t.reduce((x, y) => x + y, 0);
    return s >= 120 ? t.map((x) => ({ min: x / 60, anteil: x / s })) : null;
  }
  function zonenBand(E, gross) {
    const Z = zonen5(E); if (!Z) return null;
    const box = el('div', { class: 'tf-ei-band' + (gross ? ' gross' : ''), role: 'img', 'aria-label': 'Zeit in den Pulszonen: ' + Z.map((x, i) => 'Zone ' + (i + 1) + ' ' + Math.round(x.min) + ' min').join(', ') });
    Z.forEach((x, i) => { if (x.anteil <= 0.004) return; const d = el('i', { class: 'z' + (i + 1) }); d.style.flex = x.anteil + ' 1 0'; box.appendChild(d); });
    return box;
  }

  /* ---------- Einordnung des Reizes ---------- */
  const HART = ['mittel', 'schwelle', 'sweetspot', 'hart', 'renn', 'test'];
  const REIZ = {
    erholung: { name: 'Erholung', farbe: 'teal', text: 'Locker und kurz: mehr Durchblutung, kaum neue Ermüdung – so verarbeitet der Körper die harten Tage.', quelle: 'Seiler, IJSPP 2010' },
    grundlage: { name: 'Grundlage', farbe: 'green', text: 'Fast alles unter der ersten Schwelle: mehr Mitochondrien und Kapillaren, bessere Fettverbrennung – das Fundament, auf dem alles Schnelle steht.', quelle: 'Seiler, IJSPP 2010' },
    lang: { name: 'Lange Grundlage', farbe: 'green', text: 'Lange und ruhig: Neben der Grundlage gewöhnen sich Glykogenspeicher, Sehnen und Kopf an die Dauer – genau das braucht ein langes Rennen.', quelle: 'Seiler, IJSPP 2010' },
    tempo: { name: 'Tempo', farbe: 'yellow', text: 'Viel Zeit zwischen den Schwellen: hält ein zügiges Tempo länger, kostet aber mehr Erholung als Grundlage. Als Ausnahme gut, als Gewohnheit die Grauzone.', quelle: 'Esteve-Lanao et al., J Strength Cond Res 2007' },
    schwelle: { name: 'Schwelle', farbe: 'orange', text: 'Genug Zeit über der zweiten Schwelle: hebt das Tempo, das du lange halten kannst, ohne dass Laktat überläuft.', quelle: 'Seiler, IJSPP 2010' },
    vo2: { name: 'VO2max', farbe: 'red', text: 'Mehrere Minuten nahe am Maximum: vergrößert die maximale Sauerstoffaufnahme – dein Motor wird größer.', quelle: 'Buchheit & Laursen, Sports Med 2013' },
    anaerob: { name: 'Anaerob & Spitzen', farbe: 'pink', text: 'Kurze, sehr harte Spitzen: Sprintkraft und Laktattoleranz. Für Ausdauerrennen die Würze, nicht das Hauptgericht.', quelle: 'Buchheit & Laursen, Sports Med 2013' },
    renntempo: { name: 'Renntempo', farbe: 'pink', text: 'Gleichmäßig im Korridor deines Rennens: Körper und Kopf lernen das Tempo, das du am Renntag halten willst.', quelle: 'Allen & Coggan 2010' },
    kraft: { name: 'Kraft', farbe: 'purple', text: 'Schützt Sehnen und Gelenke und macht jeden Schritt und Tritt ökonomischer – ohne dass die Ausdauer leidet, wenn Umfang und Pausen stimmen.', quelle: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014' },
    gemischt: { name: 'Gemischt', farbe: 'gray', text: 'Von allem etwas, ohne klaren Schwerpunkt – fürs Training in Ordnung, für einen gezielten Reiz zu unscharf.', quelle: 'Seiler, IJSPP 2010' },
    allgemein: { name: 'Bewegung', farbe: 'teal', text: 'Ohne Pulszonen lässt sich der Reiz nicht genauer einordnen – sie zählt trotzdem mit ihrer Belastung.', quelle: null },
  };
  function anteile(E) { // locker · dazwischen · hart – aus dem Einheiten-Check (VT1/VT2 bzw. FTP), sonst aus den Pulszonen der Uhr
    if (E.C && E.C.z1_pct != null) return { lo: E.C.z1_pct / 100, mid: (E.C.z2_pct || 0) / 100, hi: (E.C.z3_pct || 0) / 100, quelle: E.C.zonen === 'Leistung' ? 'leistung' : 'puls' };
    const Z = zonen5(E); if (!Z) return null;
    return { lo: Z[0].anteil + Z[1].anteil, mid: Z[2].anteil, hi: Z[3].anteil + Z[4].anteil, quelle: 'uhr' };
  }
  function reizVon(E) {
    const B = E.B, G = E.G, te = G && G.te_aer != null ? +G.te_aer : null, ta = G && G.te_ana != null ? +G.te_ana : null;
    if (B.sport === 'kraft') return REIZ.kraft;
    if (E.C && E.C.typ === 'renntempo') return REIZ.renntempo;
    const Z = anteile(E), Z5 = zonen5(E), z5 = Z5 ? Z5[4].anteil : 0;
    if (!Z) return te != null && te >= 2 ? REIZ.grundlage : REIZ.allgemein;
    const lang = (B.sport === 'run' && B.min >= 90) || (B.sport === 'bike' && B.min >= 150) || (B.sport === 'swim' && B.min >= 75);
    if (ta != null && ta >= 2.5 && Z.hi >= 0.05) return REIZ.anaerob;
    if (Z.hi >= 0.12 && (z5 >= 0.06 || (ta != null && ta >= 1.5))) return REIZ.vo2;
    if (Z.hi >= 0.08 || (E.C && E.C.typ === 'qualitaet')) return REIZ.schwelle; // wie der Einheiten-Check: Qualität ab 8 % über VT2
    if (Z.mid >= 0.3) return REIZ.tempo;
    if (Z.lo >= 0.75 && B.min < 45 && (te == null || te < 2)) return REIZ.erholung;
    if (Z.lo >= 0.7) return lang ? REIZ.lang : REIZ.grundlage;
    return REIZ.gemischt;
  }
  // Soll und Ist: Dauer und Reiz gegen die geplante Einheit
  function sollIst(E) {
    const P = E.plan; if (!P || !P.e) return null;
    const e = P.e, r = e.min ? E.min / e.min : 1;
    const dauerS = r < 0.8 ? 'kuerzer' : r > 1.2 ? 'laenger' : 'passt';
    let reiz = null;
    const typ = E.C ? (E.C.ego ? 'spitzen' : E.C.typ) : null;
    if (typ && e.art) {
      const planHart = HART.includes(e.art);
      if (!planHart) reiz = typ === 'locker' ? 'passt' : typ === 'spitzen' ? 'spitzen' : 'haerter';
      else reiz = typ === 'qualitaet' || typ === 'renntempo' || typ === 'gemischt' ? 'passt' : typ === 'grauzone' ? (e.art === 'mittel' ? 'passt' : 'grau') : 'lockerer';
    }
    return { e, r, dauer: dauerS, reiz };
  }
  // Befund in einem Satz – für die Kachel und die Bühne
  function befund(E) {
    const SI = sollIst(E), C = E.C;
    if (SI) {
      const d = SI.dauer, z = SI.reiz;
      if (z === 'haerter') return { farbe: 'yellow', kurz: 'Härter als geplant', text: 'Geplant war locker – lockere Tage locker lassen, dann sitzen die harten.' };
      if (z === 'spitzen') return { farbe: 'yellow', kurz: 'Locker mit Spitzen', text: C ? C.text : 'Im Kern locker, aber mit harten Spitzen.' };
      if (z === 'lockerer') return { farbe: 'yellow', kurz: 'Lockerer als geplant', text: 'Der harte Teil fehlt – der geplante Reiz kam nicht an. An einem müden Tag ist das die richtige Wahl.' };
      if (z === 'grau') return { farbe: 'yellow', kurz: 'Zwischen den Zonen', text: 'Zu locker für den geplanten Reiz, zu hart für Grundlage – die Grauzone.' };
      if (d === 'kuerzer') return { farbe: z === 'passt' ? 'green' : 'blue', kurz: z === 'passt' ? 'Reiz getroffen, kürzer' : 'Kürzer als geplant', text: Math.round(SI.r * 100) + ' % der geplanten Dauer' + (z === 'passt' ? ' – der Reiz war da.' : '.') };
      if (d === 'laenger') return { farbe: z === 'passt' ? 'green' : 'blue', kurz: z === 'passt' ? 'Reiz getroffen, länger' : 'Länger als geplant', text: Math.round(SI.r * 100) + ' % der geplanten Dauer – zählt voll für deine Woche.' };
      return { farbe: 'green', kurz: z === 'passt' ? 'Genau wie geplant' : 'Plan erfüllt', text: z === 'passt' ? 'Dauer und Reiz passen zum Plan.' : 'Dauer passt zum Plan.' };
    }
    if (E.plan && E.plan.st && E.plan.st.imPlan) return { farbe: 'blue', kurz: 'Zusätzlich zum Plan', text: 'Nicht geplant – zählt mit ihrer Belastung in deine Woche.' };
    if (C) return { farbe: { gut: 'green', achtung: 'yellow', neutral: 'gray' }[C.ton] || 'gray', kurz: C.titel, text: String(C.text || '').replace(/,\s*IF\s*\d+[,.]\d+,\s*\d+\s*TSS/, '') }; // TSS und IF stehen auf der Bühne und unter Technik – keine zweite, leicht andere Zahl
    const R = reizVon(E);
    return { farbe: R.farbe, kurz: R.name, text: R.text };
  }

  /* ---------- Heute: „Heute trainiert“ ---------- */
  function signaturKlein(E, neu) {
    const S = serie(E, neu);
    if (S) { const D = signatur(E, S, BREIT && BREIT.matches ? 96 : 64); if (D) return welle(D, { h: 28, cls: 'tf-ht-welle' }); } // am Laptop feiner, wie die Bühne
    return zonenBand(E) || el('span', { class: 'tf-ht-leer', text: E.eigen ? 'Eigene Einheit – von Hand abgehakt' : 'Ohne Puls aufgezeichnet' });
  }
  function kmText(E) { const B = E.B; if (!B.km) return null; return B.sport === 'swim' ? nf(Math.round(B.km * 1000)) + ' m' : nf(B.km, 1) + ' km'; }
  function kachel(E, neu) {
    const B = E.B, f = befund(E), chev = svgIco('i-chev'); chev.classList.add('tf-chev');
    const meta = [E.zeit, dauer(E.min), kmText(E)].filter(Boolean).join(' · ');
    const b = el('button', { type: 'button', class: 'tf-ht-e', style: '--c:var(--tf-' + E.sp.farbe + ')', 'aria-label': E.titel + ', ' + meta + ', ' + Math.round(B.tss || 0) + ' TSS – Analyse öffnen' },
      el('span', { class: 'tf-ht-i' }, svgIco(E.sp.icon)),
      el('span', { class: 'tf-ht-t' }, el('b', { text: E.titel }), el('small', { class: 'tnum', text: meta })),
      el('span', { class: 'tf-ht-z' }, el('b', { class: 'num', text: String(Math.round(B.tss || 0)) }), el('small', { text: 'TSS' })),
      el('span', { class: 'tf-ht-w' }, signaturKlein(E, neu)),
      el('span', { class: 'tf-ht-f' }, el('i', { style: 'background:var(--tf-' + f.farbe + ')' }), el('span', { text: f.kurz }), el('em', null, 'Analyse', chev)));
    b.addEventListener('click', () => T.geh('heute/einheit/' + E.id));
    return b;
  }
  function heuteKarte() {
    const box = $('#home-trainiert'); if (!box) return;
    const L = sicher(() => tagesListe(localDate()), []);
    if (!L.length) { box.replaceChildren(); box.hidden = true; return; }
    box.hidden = false;
    const sum = L.reduce((s, E) => s + (+E.min || 0), 0), tss = L.reduce((s, E) => s + (+E.B.tss || 0), 0);
    const c = kart({ id: 'karte-trainiert', cls: 'tf-ht', farbe: 'pink', icon: 'i-flame', titel: 'Heute trainiert', sub: (L.length === 1 ? '1 Einheit' : L.length + ' Einheiten') + ' · ' + dauer(sum) + ' · ' + Math.round(tss) + ' TSS' });
    const neu = () => { if (T.route && T.route() === 'heute') heuteKarte(); };
    c.appendChild(el('div', { class: 'tf-ht-liste' }, ...L.map((E) => kachel(E, neu))));
    box.replaceChildren(c);
  }

  /* ---------- Analyse: 1. Bühne ---------- */
  function hauptZahlen(E) {
    const B = E.B, G = E.G || {}, sec = +G.moving_s || +G.dur_s || B.min * 60, Z = [];
    Z.push([dauer(E.min).replace(/ (h|min)$/, ''), E.min >= 60 ? 'h' : 'min', 'Dauer']);
    if (E.aktiv) Z.push([dauer(E.aktiv).replace(/ (h|min)$/, ''), E.aktiv >= 60 ? 'h' : 'min', 'davon aktiv']);
    if (B.km) Z.push(B.sport === 'swim' ? [nf(Math.round(B.km * 1000)), 'm', 'Strecke'] : [nf(B.km, B.km >= 100 ? 0 : 1), 'km', 'Strecke']);
    if (B.sport === 'run' && zahl(G.dist_m)) Z.push([mmss(sec / (G.dist_m / 1000)), '/km', 'Ø Tempo']);
    else if (B.sport === 'bike' && zahl(G.np_w)) Z.push([String(G.np_w), 'W', 'Normalized Power']);
    else if (B.sport === 'bike' && zahl(G.avg_w)) Z.push([String(G.avg_w), 'W', 'Ø Leistung']);
    else if (B.sport === 'bike' && zahl(G.dist_m)) Z.push([nf((G.dist_m / sec) * 3.6, 1), 'km/h', 'Ø Tempo']);
    else if (B.sport === 'swim' && zahl(G.dist_m)) Z.push([mmss(sec / (G.dist_m / 100)), '/100 m', 'Ø Tempo']);
    else if (zahl(G.avg_hr)) Z.push([String(G.avg_hr), 'bpm', 'Ø Puls']);
    Z.push([String(Math.round(B.tss || 0)), 'TSS', 'Belastung']);
    if (Z.length < 4 && zahl(G.avg_hr) && !Z.some((z) => z[1] === 'bpm')) Z.splice(Z.length - 1, 0, [String(G.avg_hr), 'bpm', 'Ø Puls']);
    return Z.slice(0, 4);
  }
  function held(E, S) {
    const B = E.B, f = befund(E);
    const c = el('article', { class: 'tf-card tf-buehne tf-ei-held tf-b-' + E.sp.buehne, 'aria-label': 'Deine Einheit' });
    const ende = E.zeit && E.G && E.G.dur_s ? (() => { const [h, m] = E.zeit.split(':').map(Number), t = h * 60 + m + Math.round(+E.G.dur_s / 60); return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); })() : null;
    c.append(el('div', { class: 'tf-ei-o' }, el('span', { class: 'tf-augenbraue' }, svgIco(E.sp.icon), ' ' + (E.zeit ? E.zeit + (ende ? '–' + ende : '') + ' Uhr' : tagText(B.date))), E.eigen ? el('span', { class: 'tf-ei-marke', text: 'Eigene Einheit' }) : null),
      el('h2', { class: 'tf-ei-t', text: E.titel }));
    const HZ = hauptZahlen(E);
    c.appendChild(el('div', { class: 'tf-ei-zahlen' + (HZ.length === 3 ? ' drei' : '') }, ...HZ.map(([v, u, l]) => el('div', null, el('b', { class: 'num' }, v, el('span', { class: 'tf-u', text: u })), el('small', { text: l })))));
    // Signatur: der echte Verlauf – sonst die Zeit in den Pulszonen
    const D = S ? signatur(E, S) : null;
    if (D) {
      const ticks = [0, D.T / 2, D.T].map((m) => (m >= 60 ? hm(m / 60) + ' h' : Math.round(m) + ' min'));
      c.appendChild(el('div', { class: 'tf-ei-sig' }, el('span', { class: 'tf-ei-sig-k' }, el('span', { text: 'Signatur' }), el('small', { text: 'Höhe ' + D.art + ' · Farbe ' + D.farbe })), welle(D, { h: 56 }),
        el('div', { class: 'tf-ei-achse tnum' }, ...ticks.map((t) => el('span', { text: t })))));
    } else if (S === undefined) c.appendChild(el('div', { class: 'tf-ei-sig' }, el('span', { class: 'tf-ei-sig-k' }, el('span', { text: 'Signatur' }), el('small', { text: 'Verlauf wird geladen …' })), el('div', { class: 'tf-ei-sig-platz' })));
    else { const Z = zonenBand(E, true); if (Z) c.appendChild(el('div', { class: 'tf-ei-sig' }, el('span', { class: 'tf-ei-sig-k' }, el('span', { text: 'Zeit in den Pulszonen' }), el('small', { text: 'Minuten je Zone der Uhr' })), Z, zonenLegende(E))); }
    c.appendChild(el('p', { class: 'tf-ei-befund' }, el('i', { style: 'background:var(--tf-' + f.farbe + ')' }), el('b', { text: f.kurz }), el('span', { text: f.text })));
    return c;
  }
  function zonenLegende(E) {
    const Z = zonen5(E); if (!Z) return null;
    return el('div', { class: 'tf-ei-zleg tnum' }, ...Z.map((x, i) => el('span', null, el('i', { class: 'z' + (i + 1) }), 'Z' + (i + 1) + ' ' + Math.round(x.min))));
  }

  /* ---------- 2. Wirkung: Trainingseffekt und Hauptreiz ---------- */
  const TE_STUFE = [[1, 'keine Wirkung'], [2, 'geringe Wirkung'], [3, 'erhaltend'], [4, 'verbessernd'], [5, 'stark verbessernd'], [Infinity, 'überlastend']];
  const teText = (x) => TE_STUFE.find(([g]) => x < g)[1];
  function skala(wert, max, farbe, titel) { // kleines Zifferblatt wie der Tune: Striche, pinker Punkt auf dem Wert
    const S = 132, c = S / 2, a0 = -120, sweep = 240, N = 40, frac = Math.max(0, Math.min(1, (wert || 0) / max)), an = Math.round(frac * N);
    const s = svg('svg', { viewBox: '0 0 ' + S + ' 108', class: 'tf-ei-skala-svg', 'aria-hidden': 'true' }); // unten offen – der untere Rand wird nicht gebraucht
    const pt = (a, r) => [c + r * Math.sin((a * Math.PI) / 180), c - r * Math.cos((a * Math.PI) / 180)];
    for (let i = 0; i <= N; i++) {
      const a = a0 + (sweep * i) / N, gross = i % 8 === 0, lit = an > 0 && i <= an, p0 = pt(a, gross ? 46 : 50), p1 = pt(a, 60);
      svg('path', { d: 'M' + p0[0].toFixed(2) + ',' + p0[1].toFixed(2) + 'L' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2), stroke: lit ? col(farbe) : col('fill'), 'stroke-width': gross ? 3 : 2.4, 'stroke-linecap': 'round', opacity: lit ? (0.4 + (0.6 * i) / Math.max(1, an)).toFixed(2) : 1 }, s);
    }
    if (wert != null) { const m = pt(a0 + sweep * frac, 55); svg('circle', { cx: m[0].toFixed(2), cy: m[1].toFixed(2), r: 5, fill: col('pink'), stroke: col('card'), 'stroke-width': 2 }, s); }
    return el('div', { class: 'tf-ei-skala', role: 'img', 'aria-label': titel + ' ' + (wert == null ? 'unbekannt' : nf(wert, 1) + ' von ' + max) }, s,
      el('span', { class: 'tf-ei-skala-z' }, el('b', { class: 'num', text: wert == null ? '–' : nf(wert, 1) }), el('small', { text: 'von ' + max })));
  }
  function wirkung(E) {
    const G = E.G || {}, R = reizVon(E), te = G.te_aer != null ? +G.te_aer : null, ta = G.te_ana != null ? +G.te_ana : null;
    const c = kart({ cls: 'tf-ei-wirk', farbe: R.farbe, icon: 'i-bolt', titel: 'Was sie dir gebracht hat', sub: 'Hauptreiz: ' + R.name });
    c.appendChild(el('p', { class: 'tf-ei-reiz' }, el('i', { style: 'background:var(--tf-' + R.farbe + ')' }), el('span', { text: R.text })));
    if (te != null || ta != null) {
      c.appendChild(el('div', { class: 'tf-ei-te' },
        el('div', null, skala(te, 5, 'green', 'Aerober Trainingseffekt'), el('b', { text: 'Aerob' }), el('small', { text: te == null ? '–' : teText(te) })),
        el('div', null, skala(ta, 5, 'orange', 'Anaerober Trainingseffekt'), el('b', { text: 'Anaerob' }), el('small', { text: ta == null ? '–' : teText(ta) }))));
      c.appendChild(el('p', { class: 'tf-note', text: 'Trainingseffekt der Uhr von 0 bis 5: aerob steht für Ausdauer und Grundlage, anaerob für harte, kurze Teile. Ab 3 verbessert eine Einheit, unter 2 erhält sie.' }));
    }
    const Z = anteile(E);
    if (Z) {
      const zt = { leistung: ['unter 76 % FTP', '76–100 % FTP', 'über FTP'], puls: ['unter VT1', 'VT1 bis VT2', 'über VT2'], uhr: ['Zone 1–2', 'Zone 3', 'Zone 4–5'] }[Z.quelle];
      const bar = el('div', { class: 'tf-ei-drei', role: 'img', 'aria-label': 'Intensität: ' + Math.round(Z.lo * 100) + ' % locker, ' + Math.round(Z.mid * 100) + ' % dazwischen, ' + Math.round(Z.hi * 100) + ' % hart' });
      [['lo', 'z0'], ['mid', 'z1'], ['hi', 'z2']].forEach(([k, cl]) => { if (Z[k] <= 0.004) return; const d = el('i', { class: cl }); d.style.flex = Z[k] + ' 1 0'; bar.appendChild(d); });
      c.append(el('div', { class: 'tf-ei-drei-k' }, el('span', { text: 'Intensität' }), el('small', { text: Z.quelle === 'uhr' ? 'Pulszonen der Uhr' : Z.quelle === 'leistung' ? 'nach Leistung' : 'nach Puls zu deinen Schwellen' })), bar,
        el('div', { class: 'tf-ei-drei-l' }, ...[['z0', 'Locker', Z.lo, zt[0]], ['z1', 'Dazwischen', Z.mid, zt[1]], ['z2', 'Hart', Z.hi, zt[2]]].map(([cl, n, v, u]) => el('span', null, el('i', { class: cl }), el('b', { text: Math.round(v * 100) + ' %' }), ' ' + n + ' · ' + u))));
    }
    if (E.C && E.C.decoupling_pct != null) {
      const d = E.C.decoupling_pct;
      c.appendChild(el('p', { class: 'tf-ei-zeile' }, el('i', { style: 'background:var(--tf-' + (d < 5 ? 'green' : d < 8 ? 'yellow' : 'red') + ')' }), el('b', { text: 'Puls stabil? ' }), el('span', { text: 'Decoupling ' + (d <= 0 ? '≤ 0' : nf(d, 1)) + ' % – ' + (d < 5 ? 'die Ausdauer trägt, der Puls blieb beim gleichen Tempo ruhig.' : d < 8 ? 'leicht erhöht: der Puls stieg in der zweiten Hälfte etwas.' : 'hoch: der Puls driftete deutlich – Hitze, wenig Trinken oder die Ausdauer reicht noch nicht für diese Dauer.') })));
    }
    if (R.quelle) c.appendChild(quelle(R.quelle + (te != null ? ' · Firstbeat, Training Effect 2014' : '')));
    if (te != null) { const w = wissen('trainingseffekt', 'Trainingseffekt im Wissen'); if (w) c.appendChild(w); }
    return c;
  }
  const quelle = (t) => el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: t }));
  const wissen = (id, text) => { // Begriff im Wissen öffnen, ohne die Seite zu verlassen
    if (!window.tfWissen || !tfWissen.begriff || !tfWissen.begriff(id)) return null;
    const b = el('button', { type: 'button', class: 'tf-gym-link tf-ei-wissen' }, svgIco('i-book'), ' ' + text);
    b.addEventListener('click', () => tfWissen.zeige(id));
    return b;
  };

  /* ---------- 3. Fitness-Konto: Impuls-Antwort ---------- */
  const KC = 1 - Math.exp(-1 / 42), KA = 1 - Math.exp(-1 / 7);
  function kontoBild(tss) {
    const TAGE = 28, W = 320, H = 150, ml = 8, mr = 8, mt = 18, mb = 26, P = [];
    for (let t = 0; t <= TAGE; t++) P.push({ t, f: tss * KC * Math.pow(1 - KC, t), m: tss * KA * Math.pow(1 - KA, t) });
    let tx = null; for (let t = 1; t < P.length; t++) if (P[t].f >= P[t].m && P[t - 1].f < P[t - 1].m) { const a = P[t - 1], b = P[t], q = (a.m - a.f) / (a.m - a.f - (b.m - b.f)); tx = a.t + q; break; }
    const top = P[0].m * 1.08, xs = (t) => ml + ((W - ml - mr) * t) / TAGE, ys = (v) => mt + (H - mt - mb) * (1 - v / top);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tf-ei-konto', role: 'img', 'aria-label': 'Wirkung der Einheit über vier Wochen: Ermüdung fällt schnell, Fitness bleibt' + (tx ? ', ab Tag ' + Math.ceil(tx) + ' überwiegt der Gewinn' : '') });
    const pfad = (k) => P.map((p, i) => (i ? 'L' : 'M') + xs(p.t).toFixed(1) + ',' + ys(p[k]).toFixed(1)).join('');
    const flaeche = (k) => pfad(k) + 'L' + xs(TAGE).toFixed(1) + ',' + ys(0).toFixed(1) + 'L' + xs(0).toFixed(1) + ',' + ys(0).toFixed(1) + 'Z';
    [7, 14, 21].forEach((t) => svg('line', { x1: xs(t), x2: xs(t), y1: mt - 4, y2: H - mb, class: 'tf-ei-konto-netz' }, s));
    svg('line', { x1: ml, x2: W - mr, y1: ys(0), y2: ys(0), class: 'tf-ei-konto-null' }, s);
    svg('path', { d: flaeche('m'), class: 'tf-ei-konto-mf' }, s); svg('path', { d: flaeche('f'), class: 'tf-ei-konto-ff' }, s);
    svg('path', { d: pfad('m'), class: 'tf-ei-konto-m' }, s); svg('path', { d: pfad('f'), class: 'tf-ei-konto-f' }, s);
    if (tx) {
      const x = xs(tx), y = ys(tss * KC * Math.pow(1 - KC, tx));
      svg('line', { x1: x, x2: x, y1: mt - 6, y2: H - mb, class: 'tf-ei-konto-x' }, s);
      svg('circle', { cx: x, cy: y, r: 4.5, class: 'tf-ei-konto-p' }, s);
      const t = svg('text', { x: Math.min(x + 6, W - 96), y: mt - 6, class: 'tf-ei-konto-t' }, s); t.textContent = 'ab Tag ' + Math.ceil(tx) + ' im Plus';
    }
    [[0, 'heute'], [7, '1 Wo'], [14, '2 Wo'], [21, '3 Wo'], [28, '4 Wo']].forEach(([t, l]) => { const x = svg('text', { x: xs(t), y: H - 8, 'text-anchor': t === 0 ? 'start' : t === 28 ? 'end' : 'middle', class: 'tf-tick' }, s); x.textContent = l; });
    return { s, tx };
  }
  function konto(E) {
    const tss = +E.B.tss || 0;
    const c = kart({ cls: 'tf-ei-konto-k', farbe: 'indigo', icon: 'i-gauge', titel: 'Dein Fitness-Konto', sub: 'Was diese Einheit über vier Wochen bewirkt' });
    if (tss < 3) { c.appendChild(el('p', { class: 'tf-note', text: 'Zu wenig Belastung, um im Fitness-Modell etwas zu bewegen.' })); return c; }
    const B = kontoBild(tss), dF = tss * KC, dA = tss * KA;
    c.appendChild(el('div', { class: 'tf-ei-konto-box' }, B.s));
    const pm = (rowsOf('pmc') || []).find((r) => r.date === E.B.date);
    // Legende: Schlüssel der beiden Linien – die Zahlen nur, wenn darunter keine Werte mit „dadurch“ stehen
    c.appendChild(el('div', { class: 'tf-ei-konto-leg' }, el('span', null, el('i', { class: 'f' }), 'Fitness-Gewinn', pm ? null : el('b', { class: 'num', text: sg(dF, 1) })), el('span', null, el('i', { class: 'm' }), 'Ermüdung', pm ? null : el('b', { class: 'num', text: sg(dA, 1) }))));
    if (pm) {
      const kvb = el('div', { class: 'tf-kv tf-ei-kv' }), fm = pm.ctl - pm.atl;
      kv(kvb, [['Fitness (CTL)', nf(pm.ctl, 1), '', { c: 'blue', label: sg(dF, 1) + ' dadurch' }], ['Ermüdung (ATL)', nf(pm.atl, 1), '', { c: 'pink', label: sg(dA, 1) + ' dadurch' }], ['Form morgen (TSB)', sg(fm, 1), '', { c: fm >= -10 ? 'green' : fm >= -30 ? 'yellow' : 'red', label: fm >= 15 ? 'sehr frisch' : fm >= 5 ? 'frisch' : fm >= -10 ? 'ausgeglichen' : fm >= -25 ? 'hart trainiert' : 'sehr müde' }]]);
      c.appendChild(kvb);
    }
    const tx = B.tx ? Math.ceil(B.tx) : null;
    c.appendChild(el('p', { class: 'tf-ei-text', text: 'Die Ermüdung ist sofort da und nach einer Woche zu zwei Dritteln weg; der Fitness-Gewinn ist kleiner, hält aber sechsmal so lange.' + (tx ? ' Ab etwa Tag ' + tx + ' überwiegt der Gewinn – deshalb wirkt Training mit Verzögerung, und deshalb hilft Tapering vor dem Rennen.' : '') }));
    c.appendChild(quelle('Banister et al., Aust J Sports Med 1975 · Allen & Coggan 2010'));
    const w = wissen('impuls_antwort', 'Impuls-Antwort-Modell im Wissen'); if (w) c.appendChild(w);
    return c;
  }

  /* ---------- 4. Plan: Soll und Ist, Woche, Phase ---------- */
  function wocheStreifen(datum) {
    const P = window.tfPlan, mo = plus(datum, -((toDay(datum).getUTCDay() + 6) % 7)), heute = localDate();
    const box = el('div', { class: 'tf-ei-woche', role: 'list', 'aria-label': 'Deine Woche' });
    let planMin = 0, istMin = 0, nPlan = 0, nOk = 0;
    for (let k = 0; k < 7; k++) {
      const d = plus(mo, k), st = P && P.tagStatus ? sicher(() => P.tagStatus(d)) : null, plan = st && st.imPlan ? st.einheiten.filter((e) => !e.rennen) : [];
      const ist = alle().filter((b) => b.date === d), punkte = el('span', { class: 'tf-ei-wp' });
      plan.forEach((e) => { planMin += e.min; nPlan++; if (e.ok) nOk++; punkte.appendChild(el('i', { class: 'plan' + (e.ok ? ' ok' : d < heute ? ' weg' : ''), style: '--c:var(--tf-' + ({ laufen: 'mint', rad: 'orange', schwimmen: 'blue', kraft: 'purple', mobil: 'teal' }[e.sport] || 'gray') + ')', title: e.titel + ' · ' + e.min + ' min' })); });
      ist.forEach((b) => { istMin += +b.min || 0; const geplant = plan.some((e) => e.garmin === b.sport && e.ok); if (!geplant) punkte.appendChild(el('i', { class: 'extra', style: '--c:var(--tf-' + (SPORT[b.sport] || SPORT.other).farbe + ')', title: (SPORT[b.sport] || SPORT.other).name + ' · ' + b.min + ' min' })); });
      box.appendChild(el('div', { class: 'tf-ei-wt' + (d === datum ? ' du' : '') + (d > heute ? ' bald' : ''), role: 'listitem', 'aria-label': WT[toDay(d).getUTCDay()] + ': ' + plan.length + ' geplant, ' + ist.length + ' gemacht' }, el('small', { text: WT[toDay(d).getUTCDay()] }), el('span', { class: 'tnum', text: String(+d.slice(8, 10)) }), punkte));
    }
    return { box, planMin, istMin, nPlan, nOk };
  }
  function planTeil(E, S) {
    const P = E.plan, SI = sollIst(E);
    const c = kart({ cls: 'tf-ei-plan', farbe: 'blue', icon: 'i-cal', titel: 'Was sie deinem Plan bringt', sub: P && P.st && P.st.imPlan ? 'Woche ' + P.st.woche + ' von ' + P.st.N + ' · ' + P.st.phase : P ? 'Dieser Tag liegt außerhalb deines Plans' : 'Ohne Trainingsplan' });
    if (!P) {
      const b = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-cal'), ' Plan erstellen');
      b.addEventListener('click', () => T.geh('training/plan'));
      c.append(el('p', { class: 'tf-ei-text', text: 'Mit einem Plan siehst du hier, ob die Einheit den geplanten Reiz getroffen hat und wie weit deine Woche ist.' }), b);
      return c;
    }
    if (SI) {
      const sD = P.s && P.s.D && window.tfPlan.profil ? sicher(() => window.tfPlan.profil(P.s, P.s.D)) : null;
      const max = Math.max(SI.e.min, E.min), soll = el('div', { class: 'tf-ei-soll' });
      const zeile = (name, sub, bild, min, art) => { // Beschriftung oben, darunter die Spur: so lang wie die längere der beiden
        const w = el('div', { class: 'tf-ei-soll-w' + (bild ? '' : ' block'), style: bild ? null : '--c:var(--tf-' + E.sp.farbe + ')' }, bild || el('i', { class: art }));
        w.style.width = Math.max(12, (100 * min) / max).toFixed(1) + '%';
        return el('div', { class: 'tf-ei-soll-z' }, el('span', { class: 'tf-ei-soll-n' }, el('b', { text: name }), el('small', { text: sub })), el('div', { class: 'tf-ei-soll-spur' }, w));
      };
      const sollBild = sD && window.tfPlan.formWelle ? window.tfPlan.formWelle(sD, P.s.D, { n: 64, h: 32 }) : null;
      const D = S ? signatur(E, S, 64) : null;
      soll.append(zeile('Geplant', SI.e.titel + ' · ' + SI.e.min + ' min', sollBild, SI.e.min, 'geplant'), zeile('Gemacht', dauer(E.min) + (E.aktiv ? ' · davon ' + dauer(E.aktiv) + ' aktiv' : '') + (kmText(E) ? ' · ' + kmText(E) : ''), D ? welle(D, { h: 32 }) : null, E.min, 'gemacht'));
      c.appendChild(soll);
      const chips = el('div', { class: 'tf-ei-chips' });
      const chip = (farbe, t) => chips.appendChild(el('span', { class: 'tf-ei-chip' }, el('i', { style: 'background:var(--tf-' + farbe + ')' }), t));
      chip(SI.dauer === 'passt' ? 'green' : 'yellow', 'Dauer ' + Math.round(SI.r * 100) + ' %');
      if (SI.reiz) chip(SI.reiz === 'passt' ? 'green' : 'yellow', { passt: 'Reiz getroffen', haerter: 'härter als geplant', lockerer: 'lockerer als geplant', grau: 'Grauzone', spitzen: 'mit Spitzen' }[SI.reiz]);
      else if (['run', 'bike', 'swim'].includes(E.B.sport)) chip('gray', 'Reiz ohne Sekundendaten nicht prüfbar');
      if (SI.e.angepasst) chip('blue', 'an deinen Tune angepasst');
      c.appendChild(chips);
    } else if (P.st && P.st.imPlan) c.appendChild(el('p', { class: 'tf-ei-text', text: 'An diesem Tag war ' + E.sp.kein + ' geplant. Sie zählt mit ' + Math.round(E.B.tss || 0) + ' Punkten in deine Woche – der Plan rechnet sie bei der Belastung mit.' }));
    else if (P.st && !P.st.imPlan) c.appendChild(el('p', { class: 'tf-ei-text', text: 'Ihre Belastung steckt trotzdem in deiner Fitness (CTL) – und mit der rechnet der Plan.' }));
    if (P.st && P.st.imPlan) {
      const W = wocheStreifen(E.B.date);
      c.append(el('div', { class: 'tf-ei-woche-k' }, el('span', { text: 'Deine Woche' }), el('small', { text: W.nOk + ' von ' + W.nPlan + ' erledigt' })), W.box,
        el('p', { class: 'tf-ei-woche-s' }, el('span', null, el('i', { class: 'voll' }), 'gemacht ', el('b', { class: 'num', text: dauer(W.istMin) })), el('span', null, el('i', { class: 'leer' }), 'geplant ', el('b', { class: 'num', text: dauer(W.planMin) }))));
      const sz = (rowsOf('saison') || [])[0];
      if (sz && sz.ziel_name && sz.ziel_tage != null && sz.ziel_tage >= 0) c.appendChild(el('p', { class: 'tf-ei-zeile' }, el('i', { style: 'background:var(--tf-pink)' }), el('b', { text: sz.ziel_name + ' ' }), el('span', { text: 'in ' + sz.ziel_tage + ' Tagen – jede Einheit dieser Phase (' + P.st.phase + ') baut darauf hin.' })));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, 'Plan öffnen');
      b.addEventListener('click', () => T.geh('training/plan'));
      c.appendChild(el('div', { class: 'tf-ei-akt' }, b));
    }
    return c;
  }

  /* ---------- 5. Einordnung: Schwarm, Rang, Bestmarken ---------- */
  let metrik = 'tss';
  function schwarmBild(L, B, wert, einheit) {
    const W = 320, H = 118, ml = 12, mr = 12, r = 4.6, base = 66, max = Math.max(...L.map(wert), 1) * 1.04, xs = (v) => ml + ((W - ml - mr) * v) / max;
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tf-ei-schwarm', role: 'img', 'aria-label': L.length + ' Einheiten nach ' + einheit + ', diese Einheit markiert' });
    const pos = []; // einfacher Schwarm: jeder Punkt so nah an der Mitte wie möglich, ohne Nachbarn zu berühren
    L.slice().sort((x, y) => wert(x) - wert(y)).forEach((b) => {
      const x = xs(wert(b)); let y = 0, k = 0;
      while (pos.some((p) => Math.abs(p.x - x) < 2 * r + 0.8 && Math.abs(p.y - y) < 2 * r + 0.8) && k < 40) { k++; y = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (2 * r + 0.8); }
      pos.push({ x, y, b });
    });
    svg('line', { x1: ml, x2: W - mr, y1: base, y2: base, class: 'tf-ei-schwarm-achse' }, s);
    pos.forEach((p) => { if (p.b === B) return; svg('circle', { cx: p.x.toFixed(1), cy: (base + p.y).toFixed(1), r, class: 'tf-ei-schwarm-p' }, s); });
    const du = pos.find((p) => p.b === B);
    if (du) {
      svg('circle', { cx: du.x.toFixed(1), cy: (base + du.y).toFixed(1), r: r + 3.5, class: 'tf-ei-schwarm-hof' }, s);
      svg('circle', { cx: du.x.toFixed(1), cy: (base + du.y).toFixed(1), r: r + 1, class: 'tf-ei-schwarm-du' }, s);
      const t = svg('text', { x: Math.max(ml, Math.min(W - mr, du.x)).toFixed(1), y: 12, 'text-anchor': du.x < 60 ? 'start' : du.x > W - 60 ? 'end' : 'middle', class: 'tf-ei-schwarm-t' }, s); t.textContent = 'diese Einheit';
      svg('line', { x1: du.x.toFixed(1), x2: du.x.toFixed(1), y1: 17, y2: (base + du.y - r - 4).toFixed(1), class: 'tf-ei-schwarm-l' }, s);
    }
    const ticks = [0, max / 2, max / 1.04].map((v) => Math.round(v));
    ticks.forEach((v, i) => { const t = svg('text', { x: xs(v).toFixed(1), y: H - 4, 'text-anchor': i === 0 ? 'start' : i === 2 ? 'end' : 'middle', class: 'tf-tick' }, s); t.textContent = metrik === 'min' ? (v >= 60 ? hm(v / 60) + ' h' : v + ' min') : nf(v) + (metrik === 'km' ? ' km' : ' TSS'); });
    return s;
  }
  function bestmarken(E) {
    const B = E.B, sp = E.sp, vor = alle().filter((b) => b.sport === B.sport && b.date < B.date).sort((x, y) => y.date.localeCompare(x.date));
    const out = [];
    const seit = (f, name) => {
      const v = +B[f] || 0; if (!v || !name) return;
      const x = vor.find((b) => (+b[f] || 0) >= v);
      if (!x) { if (vor.length >= 10) out.push(name + ' in deinen Daten'); return; }
      const tage = Math.round((toDay(B.date) - toDay(x.date)) / DAY);
      if (tage >= 21) out.push(name + ' seit ' + (tage >= 60 ? Math.round(tage / 30.4) + ' Monaten' : Math.round(tage / 7) + ' Wochen'));
    };
    seit('min', sp.lang); seit('tss', sp.hart); if (B.km) seit('km', sp.weit);
    if (B.sport === 'bike' && E.G) { // Leistungsspitzen gegen die letzten 90 Tage
      const von = plus(B.date, -90), R = rohListe().filter((g) => sportVon(g.type) === 'bike' && g.date >= von && g.date < B.date);
      [['p300', '5 min'], ['p1200', '20 min'], ['p60', '1 min'], ['p3600', '60 min']].forEach(([k, l]) => {
        const v = zahl(E.G[k]); if (!v) return; const best = Math.max(0, ...R.map((g) => +g[k] || 0));
        if (best > 0 && v >= best) out.push('Beste ' + l + ' seit 90 Tagen: ' + v + ' W');
      });
    }
    return out.slice(0, 4);
  }
  function einordnung(E) {
    const B = E.B, von = plus(B.date, -83), L = alle().filter((b) => b.sport === B.sport && b.date >= von && b.date <= B.date);
    const c = kart({ cls: 'tf-ei-ord', farbe: 'pink', icon: 'i-trophy', titel: 'Wo sie steht', sub: 'Deine ' + E.sp.mehrz + ' der letzten 12 Wochen' });
    const box = el('div', { class: 'tf-ei-ord-box' });
    const malen = () => {
      if (metrik === 'km' && !B.km) metrik = 'tss';
      const wert = (b) => (metrik === 'tss' ? +b.tss || 0 : metrik === 'km' ? +b.km || 0 : +b.min || 0), name = { tss: 'Belastung', min: 'Dauer', km: 'Strecke' }[metrik];
      const seg = el('div', { class: 'tf-seg tf-ei-seg', role: 'group', 'aria-label': 'Vergleichen nach' });
      [['tss', 'Belastung'], ['min', 'Dauer']].concat(B.km ? [['km', 'Strecke']] : []).forEach(([k, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(metrik === k) }, n); b.addEventListener('click', () => { metrik = k; malen(); }); seg.appendChild(b); });
      const teile = [seg];
      if (L.length >= 4) {
        const v = wert(B), unter = L.filter((b) => b !== B && wert(b) < v).length, anteil = Math.round((100 * unter) / Math.max(1, L.length - 1));
        teile.push(schwarmBild(L, B, wert, name), el('p', { class: 'tf-ei-rang' }, el('b', { class: 'num' }, String(anteil), el('span', { class: 'tf-u', text: '%' })), el('span', { text: anteil >= 100 ? '– Höchstwert der letzten 12 Wochen' : anteil <= 0 ? '– Tiefstwert der letzten 12 Wochen' : 'deiner ' + E.sp.mehrz + ' lagen bei der ' + name + ' darunter' })));
      } else teile.push(el('p', { class: 'tf-ei-text', text: 'Noch zu wenige ' + E.sp.mehrz + ' in den letzten 12 Wochen für einen Vergleich – ab vier geht es los.' }));
      box.replaceChildren(...teile);
    };
    malen();
    c.appendChild(box);
    const M = bestmarken(E);
    if (M.length) c.appendChild(el('div', { class: 'tf-ei-marken' }, ...M.map((t) => el('span', { class: 'tf-ei-marke2' }, svgIco('i-medal'), t))));
    return c;
  }

  /* ---------- 6. Technik je Sportart ---------- */
  function schnitt(E, f, tage, fn) { // Median der Einheiten derselben Sportart davor (ohne diese)
    const von = plus(E.B.date, -(tage || 42)), V = rohListe().filter((g) => g.date >= von && g.date < E.B.date && sportVon(g.type) === E.B.sport).map((g) => (fn ? fn(g) : +g[f])).filter((x) => x != null && isFinite(x) && x > 0).sort((x, y) => x - y);
    return V.length >= 3 ? V[V.length >> 1] : null;
  }
  function vergleich(wert, ref, richtung, einheit, dez) { // Chip: Abweichung zum Schnitt der letzten 6 Wochen
    if (wert == null || ref == null) return null;
    const d = wert - ref, rel = Math.abs(d) / ref;
    if (rel < 0.015) return { c: 'gray', label: 'wie immer' };
    const gut = richtung === 0 ? null : (d > 0) === (richtung > 0);
    return { c: gut == null ? 'gray' : gut ? 'green' : 'orange', label: sg(d, dez || 0) + (einheit ? ' ' + einheit : '') };
  }
  function leistungskurve(E, box) {
    const G = E.G, DUR = [[5, 'p5', '5 s'], [10, 'p10', '10 s'], [20, 'p20', '20 s'], [30, 'p30', '30 s'], [60, 'p60', '1 min'], [120, 'p120', '2 min'], [300, 'p300', '5 min'], [600, 'p600', '10 min'], [1200, 'p1200', '20 min'], [1800, 'p1800', '30 min'], [3600, 'p3600', '60 min'], [7200, 'p7200', '2 h'], [18000, 'p18000', '5 h']];
    const von = plus(E.B.date, -90), R = rohListe().filter((g) => sportVon(g.type) === 'bike' && g.date >= von && g.date < E.B.date);
    const rows = DUR.map(([s, k, l]) => ({ s, l, heute: zahl(G[k]), best: Math.max(0, ...R.map((g) => +g[k] || 0)) || null })).filter((r) => r.heute);
    if (rows.length < 4) return false;
    const top = Math.max(...rows.map((r) => Math.max(r.heute, r.best || 0))) * 1.08;
    const P = plot(box, { h: 170, y: [0, top], ny: 4, yfmt: (t) => t + ' W', xlog: true, x: [rows[0].s, rows[rows.length - 1].s], xtv: rows.filter((r, i) => i % 2 === 0 || i === rows.length - 1).map((r) => r.s), xfmt: (v) => (rows.find((r) => r.s === v) || {}).l || '', label: 'Leistungskurve: heute gegen deine Bestwerte der letzten 90 Tage' });
    const mitBest = rows.filter((r) => r.best);
    if (mitBest.length >= 2) line(P, mitBest, (r) => r.s, (r) => r.best, col('fg3'), 1.6, '4 4');
    line(P, rows, (r) => r.s, (r) => r.heute, col('orange'), 2.4);
    rows.forEach((r) => { if (r.best && r.heute >= r.best) svg('circle', { cx: P.xs(r.s), cy: P.ys(r.heute), r: 4.5, fill: col('pink'), stroke: col('card'), 'stroke-width': 2 }, P.g); });
    hoverTime(box, P, rows, (r) => r.s, (r) => 'Beste ' + r.l, (r) => [{ label: 'Heute', value: r.heute + ' W', color: col('orange') }, { label: 'Bestwert 90 Tage', value: r.best ? r.best + ' W' : '–', color: col('fg3') }], [{ y: (r) => r.heute, color: col('orange') }]);
    return true;
  }
  function technik(E) {
    const B = E.B, G = E.G, a = athlet();
    if (!G) return null;
    const sec = +G.moving_s || +G.dur_s || B.min * 60, Z = [];
    const add = (l, v, u, z) => { if (v != null && v !== '–') Z.push([l, v, u, z || null]); };
    let titel = 'Technik & Effizienz', sub = 'Gegen deinen Schnitt aus 6 Wochen';
    if (B.sport === 'run') {
      const pace = zahl(G.dist_m) ? sec / (G.dist_m / 1000) : null, gap = zahl(G.gap_speed) ? 1000 / G.gap_speed : null;
      if (pace) add('Ø Tempo', mmss(pace), '/km', gap && Math.abs(gap - pace) >= 4 ? { c: 'gray', label: 'bergbereinigt ' + mmss(gap) } : null);
      const ef = (g) => (zahl(g.dist_m) && zahl(g.avg_hr) ? ((g.dist_m / (+g.moving_s || +g.dur_s)) * 60) / g.avg_hr : null), efH = ef(G);
      if (efH) add('Meter pro Herzschlag', nf(efH, 2), 'm', vergleich(efH, schnitt(E, null, 42, ef), 1, 'm', 2));
      if (zahl(G.run_cad)) add('Schrittfrequenz', String(Math.round(G.run_cad)), 'spm', vergleich(+G.run_cad, schnitt(E, 'run_cad'), 1, 'spm'));
      if (zahl(G.step_cm)) add('Schrittlänge', nf(G.step_cm / 100, 2), 'm', vergleich(G.step_cm / 100, schnitt(E, 'step_cm') ? schnitt(E, 'step_cm') / 100 : null, 0, 'm', 2));
      if (zahl(G.gct_ms)) add('Bodenkontakt', String(Math.round(G.gct_ms)), 'ms', vergleich(+G.gct_ms, schnitt(E, 'gct_ms'), -1, 'ms'));
      if (zahl(G.vo_cm)) add('Auf und ab', nf(G.vo_cm, 1), 'cm', vergleich(+G.vo_cm, schnitt(E, 'vo_cm'), -1, 'cm', 1));
      if (zahl(G.vr_pct)) add('Vertikales Verhältnis', nf(G.vr_pct, 1), '%', vergleich(+G.vr_pct, schnitt(E, 'vr_pct'), -1, '%', 1));
      if (zahl(G.elev_m)) add('Höhenmeter', nf(G.elev_m), 'm');
      titel = 'Laufdynamik & Effizienz';
    } else if (B.sport === 'bike') {
      const np = zahl(G.np_w), avg = zahl(G.avg_w), kg = zahl(a.gewicht_ref_kg);
      if (np) add('Normalized Power', String(np), 'W', kg ? { c: 'gray', label: nf(np / kg, 2) + ' W/kg (' + nf(kg, 0) + ' kg)' } : null);
      if (avg) add('Ø Leistung', String(avg), 'W');
      if (B.if != null) add('Intensität (IF)', nf(B.if, 2), '', a.rad_if_min && a.rad_if_max ? { c: B.if >= a.rad_if_min && B.if <= a.rad_if_max ? 'pink' : 'gray', label: B.if >= a.rad_if_min && B.if <= a.rad_if_max ? 'dein Renntempo' : 'Renntempo ' + nf(a.rad_if_min, 2) + '–' + nf(a.rad_if_max, 2) } : null);
      if (np && avg) { const vi = np / avg; add('Gleichmäßigkeit (VI)', nf(vi, 2), '', vi <= 1.05 ? { c: 'green', label: 'gleichmäßig' } : vi <= 1.1 ? { c: 'gray', label: 'wechselnd' } : { c: 'orange', label: 'stark wechselnd' }); }
      const ef = (g) => (zahl(g.np_w) && zahl(g.avg_hr) ? g.np_w / g.avg_hr : null), efH = ef(G);
      if (efH) add('Watt pro Herzschlag', nf(efH, 2), 'W', vergleich(efH, schnitt(E, null, 42, ef), 1, 'W', 2));
      if (zahl(G.bike_cad)) add('Trittfrequenz', String(Math.round(G.bike_cad)), 'U/min', vergleich(+G.bike_cad, schnitt(E, 'bike_cad'), 0, 'U/min'));
      if (zahl(G.elev_m)) add('Höhenmeter', nf(G.elev_m), 'm');
      titel = 'Leistung & Effizienz';
    } else if (B.sport === 'swim') {
      const p100 = zahl(G.dist_m) ? sec / (G.dist_m / 100) : null, css = zahl(a.css_s_100m);
      if (p100) add('Ø Tempo', mmss(p100), '/100 m', css ? { c: p100 <= css * 1.02 ? 'pink' : 'gray', label: p100 <= css ? Math.round(css - p100) + ' s schneller als deine CSS' : Math.round(p100 - css) + ' s langsamer als deine CSS (' + mmss(css) + ')' } : null);
      if (zahl(G.swolf)) add('SWOLF', String(G.swolf), '', vergleich(+G.swolf, schnitt(E, 'swolf'), -1, ''));
      if (zahl(G.zuege_laenge)) add('Züge pro Bahn', nf(G.zuege_laenge, 1), '', vergleich(+G.zuege_laenge, schnitt(E, 'zuege_laenge'), -1, '', 1));
      if (zahl(G.swim_cad)) add('Zugfrequenz', String(Math.round(G.swim_cad)), '/min');
      if (zahl(G.laengen) && zahl(G.pool_m)) add('Bahnen', String(G.laengen), '× ' + G.pool_m + ' m');
      if (zahl(G.fs400)) add('Schnellste 400 m', mmss(G.fs400), '');
      titel = 'Schwimmen im Detail';
    } else {
      if (zahl(G.avg_hr)) add('Ø Puls', String(G.avg_hr), 'bpm');
      if (zahl(G.max_hr)) add('Höchster Puls', String(G.max_hr), 'bpm');
      titel = 'Puls'; sub = 'Aus der Aufzeichnung der Uhr';
    }
    if (zahl(G.schweiss_ml) && G.schweiss_ml >= 150) add('Schweißverlust', nf(G.schweiss_ml / 1000, 1), 'Liter', { c: 'blue', label: 'Schätzung der Uhr' });
    if (!Z.length) return null;
    const c = kart({ cls: 'tf-ei-tech', farbe: E.sp.farbe, icon: B.sport === 'run' ? 'i-shoe' : B.sport === 'bike' ? 'i-bolt' : B.sport === 'swim' ? 'i-wave' : 'i-heart', titel, sub });
    const kvb = el('div', { class: 'tf-kv tf-ei-kv' }); kv(kvb, Z); c.appendChild(kvb);
    if (B.sport === 'bike') { const lk = el('div', { class: 'tf-chart tf-ei-lk', style: 'min-height:170px' }); c.append(el('div', { class: 'tf-ei-drei-k' }, el('span', { text: 'Leistungskurve' }), el('small', { text: 'gestrichelt: Bestwerte aus 90 Tagen' })), lk); requestAnimationFrame(() => { if (!sicher(() => leistungskurve(E, lk), false)) lk.remove(); }); }
    if (B.sport === 'run' && (zahl(G.run_cad) || zahl(G.gct_ms))) c.appendChild(el('p', { class: 'tf-note', text: 'Höhere Schrittfrequenz bei gleichem Tempo senkt die Last auf Knie und Hüfte; kürzerer Bodenkontakt und weniger Auf und Ab sparen Energie. Schrittlänge folgt Körpergröße und Tempo – sie hat kein festes Ziel.' }));
    if (B.sport === 'run' || B.sport === 'bike') { c.appendChild(quelle(B.sport === 'run' ? 'Heiderscheit et al., Med Sci Sports Exerc 2011 · Moore, Sports Med 2016' : 'Allen & Coggan 2010')); const w = B.sport === 'run' ? wissen('laufdynamik', 'Laufdynamik im Wissen') : wissen('leistungskurve', 'Leistungskurve im Wissen'); if (w) c.appendChild(w); }
    return c;
  }

  /* ---------- 7. Erholung ---------- */
  function erholung(E) {
    const B = E.B, a = athlet(), tag = alle().filter((b) => b.date === B.date), tagTss = tag.reduce((s, b) => s + (+b.tss || 0), 0);
    const BAND = tagTss < 150 ? { h: 24, t: 'Bis morgen meist erholt', x: 'Unter 150 Punkten an einem Tag ist die Ermüdung am nächsten Morgen meist verflogen.' }
      : tagTss < 300 ? { h: 48, t: 'Morgen noch etwas müde, übermorgen frisch', x: '150 bis 300 Punkte an einem Tag: Restmüdigkeit am nächsten Tag ist normal, am übernächsten meist weg.' }
        : tagTss < 450 ? { h: 72, t: 'Auch übermorgen noch Restmüdigkeit', x: '300 bis 450 Punkte an einem Tag wirken mehrere Tage nach – plane danach locker.' }
          : { h: 96, t: 'Mehrere Tage Restmüdigkeit', x: 'Über 450 Punkte an einem Tag: wie ein langes Rennen – mehrere ruhige Tage einplanen.' };
    const c = kart({ cls: 'tf-ei-erh', farbe: 'teal', icon: 'i-moon', titel: 'Erholung ab jetzt', sub: BAND.t });
    const spur = el('div', { class: 'tf-ei-erh-spur', role: 'img', 'aria-label': BAND.t }, el('i', { class: 'f' }), el('i', { class: 'frisch' }));
    spur.style.setProperty('--weit', ((100 * BAND.h) / 96).toFixed(1) + '%');
    c.append(spur, el('div', { class: 'tf-ei-erh-l tnum' }, ...['jetzt', '+24 h', '+48 h', '+72 h'].map((t, i) => el('span', { style: 'left:' + (i * 25) + '%', text: t }))),
      el('p', { class: 'tf-ei-text', text: BAND.x + (tag.length > 1 ? ' Gezählt ist der ganze Tag: ' + Math.round(tagTss) + ' Punkte aus ' + tag.length + ' Einheiten.' : '') }));
    const P = window.tfPlan, m = P && P.tagStatus ? sicher(() => P.tagStatus(plus(B.date, 1))) : null, morgen = m && m.imPlan ? m.einheiten.filter((e) => !e.rennen) : null;
    if (morgen) {
      const hart = morgen.some((e) => HART.includes(e.art));
      c.appendChild(el('p', { class: 'tf-ei-zeile' }, el('i', { style: 'background:var(--tf-' + (hart && tagTss >= 150 ? 'yellow' : 'blue') + ')' }), el('b', { text: 'Morgen im Plan: ' }), el('span', { text: morgen.length ? morgen.map((e) => e.titel + ' · ' + e.min + ' min').join(', ') + (hart && tagTss >= 150 ? ' – morgen früh prüft die Auto-Anpassung deinen Tune und kürzt, wenn nötig.' : '') : 'Ruhetag – genau richtig nach dieser Einheit.' })));
    }
    if (a.schlafbedarf_min) c.appendChild(el('p', { class: 'tf-ei-zeile' }, el('i', { style: 'background:var(--tf-indigo)' }), el('b', { text: 'Heute Nacht: ' }), el('span', { text: 'mindestens ' + hm(a.schlafbedarf_min / 60) + ' h Schlaf – im Schlaf passiert die Anpassung.' })));
    const akt = el('div', { class: 'tf-ei-akt' });
    const rg = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-feder'), ' Körper-Check');
    rg.addEventListener('click', () => T.geh('training/regeneration'));
    akt.appendChild(rg);
    if (zahl(E.G && E.G.schweiss_ml) && B.min >= 60) { const sw = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-drop'), ' Schweißrate'); sw.addEventListener('click', () => T.geh('rennen/schweiss')); akt.appendChild(sw); }
    c.append(akt, quelle('Allen & Coggan 2010'));
    return c;
  }

  /* ---------- 8. Verlauf im Detail ---------- */
  function verlauf(E, S) {
    if (!E.C || E.eigen) return null;
    const c = kart({ cls: 'tf-ei-verl', farbe: 'gray', icon: 'i-wave', titel: 'Verlauf im Detail', sub: 'Antippen und wischen für die Werte' });
    const cA = el('div', { class: 'tf-chart', style: 'min-height:160px' }), cB = el('div', { class: 'tf-chart', style: 'min-height:130px' }), cap = el('p', { class: 'tf-caption' });
    c.append(cA, cB, cap);
    if (S === undefined) { emptyNote(cA, 'Verlauf wird geladen …'); return c; }
    if (S === false) { emptyNote(cA, 'Verlauf gerade nicht erreichbar – bist du offline? Später noch einmal öffnen.'); return c; }
    if (!S) { emptyNote(cA, 'Für diese Einheit ist kein Verlauf gespeichert.'); return c; }
    requestAnimationFrame(() => sicher(() => verlaufZeichnen(E, S, cA, cB, cap)));
    return c;
  }
  function verlaufZeichnen(E, S, cA, cB, cap) {
    const a = athlet(), rad = E.B.sport === 'bike';
    const rows = S.m.map((m, i) => ({ m, p: S.p ? S.p[i] : null, hr: S.hr ? S.hr[i] : null, pace: S.v && S.v[i] > 1.5 ? 1000 / S.v[i] : null }));
    const Tm = rows[rows.length - 1].m, step = Tm > 200 ? 60 : Tm > 100 ? 30 : Tm > 45 ? 15 : 10;
    const xo = { xlin: true, x: [0, Math.max(1, Tm)], xtv: d3.range(0, Tm + 0.01, step), xfmt: (v) => (v >= 60 ? hm(v / 60) + ' h' : Math.round(v) + ' min') };
    const kopf = (q) => 'nach ' + (q.m >= 60 ? hm(q.m / 60) + ' h' : Math.round(q.m) + ' min');
    const hasP = rad && rows.some((q) => q.p > 0) && a.ftp_ref_w, hasV = !rad && rows.some((q) => q.pace) && a.vt1_pace_s_km && a.vt2_pace_s_km;
    const werte = (q) => [hasP ? { label: 'Leistung', value: q.p == null ? '–' : q.p + ' W', color: col('orange') } : hasV ? { label: 'Tempo', value: q.pace ? mmss(q.pace) + ' /km' : '–', color: col('mint') } : null, { label: 'Puls', value: q.hr ? q.hr + ' bpm' : '–', color: col('pink') }].filter(Boolean);
    if (hasP) {
      const ftp = a.ftp_ref_w, ps = rows.map((q) => q.p).filter((x) => x != null).sort(d3.ascending);
      const P = plot(cA, Object.assign({ h: 160, y: [0, Math.max(ftp * 1.08, d3.quantile(ps, 0.995) || 0) * 1.05], ny: 4, yfmt: (t) => t + ' W', label: 'Leistung im Verlauf' }, xo));
      refLine(P, 0.76 * ftp, col('blue')); refLine(P, ftp, col('red'));
      line(P, rows, (q) => q.m, (q) => q.p, col('orange'), 1.8);
      hoverTime(cA, P, rows, (q) => q.m, kopf, werte, [{ y: (q) => q.p, color: col('orange') }]);
    } else if (hasV) {
      const pv = rows.map((q) => q.pace).filter(Boolean).sort(d3.ascending);
      const lo = Math.floor((Math.min(d3.quantile(pv, 0.02), a.vt2_pace_s_km) - 10) / 5) * 5, hi = Math.ceil((Math.max(d3.quantile(pv, 0.98), a.vt1_pace_s_km) + 15) / 5) * 5;
      const pst = hi - lo > 120 ? 60 : 30, ptk = d3.range(Math.ceil(lo / pst) * pst, hi + 0.1, pst);
      const P = plot(cA, Object.assign({ h: 160, y: [lo, hi], yinvert: true, yticks: ptk, yfmt: mmss, label: 'Tempo im Verlauf' }, xo));
      refLine(P, a.vt1_pace_s_km, col('blue')); refLine(P, a.vt2_pace_s_km, col('red'));
      const R2 = rows.map((q) => Object.assign({}, q, { pk: q.pace == null ? null : Math.max(lo, Math.min(hi, q.pace)) }));
      line(P, R2, (q) => q.m, (q) => q.pk, col('mint'), 1.9);
      hoverTime(cA, P, R2, (q) => q.m, kopf, werte, [{ y: (q) => q.pk, color: col('mint') }]);
    } else emptyNote(cA, rad ? 'Keine Leistungsdaten – die Einordnung kommt aus dem Puls.' : 'Keine Tempodaten.');
    const hs = rows.map((q) => q.hr).filter((x) => x);
    if (hs.length && a.vt1_hf && a.vt2_hf) {
      const lo = Math.floor((Math.min(...hs, a.vt1_hf) - 8) / 5) * 5, hi = Math.ceil((Math.max(...hs, a.vt2_hf) + 6) / 5) * 5;
      const P = plot(cB, Object.assign({ h: 130, y: [lo, hi], ny: 3, label: 'Puls im Verlauf' }, xo));
      refLine(P, a.vt1_hf, col('blue')); refLine(P, a.vt2_hf, col('red'));
      line(P, rows, (q) => q.m, (q) => q.hr, col('pink'), 1.8);
      hoverTime(cB, P, rows, (q) => q.m, kopf, werte, [{ y: (q) => q.hr, color: col('pink') }]);
    } else emptyNote(cB, 'Keine Pulsdaten.');
    cap.textContent = (hasP ? 'Oben Leistung – gestrichelt blau 76 % FTP (Grenze locker), rot FTP ' + a.ftp_ref_w + ' W. ' : hasV ? 'Oben Tempo, oben ist schneller – blau VT1 ' + mmss(a.vt1_pace_s_km) + ', rot VT2 ' + mmss(a.vt2_pace_s_km) + ' /km. ' : '') + (a.vt1_hf ? 'Unten Puls – blau VT1 ' + a.vt1_hf + ', rot VT2 ' + a.vt2_hf + ' bpm.' : '');
  }

  /* ---------- Seite ---------- */
  function render() {
    const box = $('#einheit-box'); if (!box) return;
    const RI = T.routeInfo(T.route()) || {}, id = RI.einheit;
    const E = id ? sicher(() => holen(id)) : null;
    if (!E) { T.kopf({ titel: 'Einheit', sub: '' }); box.replaceChildren(el('p', { class: 'tf-empty', text: 'Diese Einheit ist nicht (mehr) in deinen Daten – ältere Einheiten fallen nach 12 Monaten heraus.' })); return; }
    T.kopf({ titel: 'Analyse', sub: E.sp.name + ' · ' + tagText(E.B.date) });
    const route = T.route(), S = serie(E, () => { if (T.route() === route) render(); });
    const oben = [sicher(() => held(E, S)), sicher(() => planTeil(E, S))].filter(Boolean);
    const mitte = [sicher(() => wirkung(E)), sicher(() => konto(E)), sicher(() => einordnung(E)), sicher(() => technik(E)), sicher(() => erholung(E))].filter(Boolean);
    const unten = sicher(() => verlauf(E, S));
    if (!BREIT || !BREIT.matches || mitte.length < 3) { box.replaceChildren(el('div', { class: 'tf-ei' }, ...oben, ...mitte, ...(unten ? [unten] : []))); return; }
    // Laptop: zwei Spalten, die sich unabhängig füllen – jede Karte kommt in die gerade kürzere, so bleibt kein leeres Band
    const sp = [el('div', { class: 'tf-ei-sp' }), el('div', { class: 'tf-ei-sp' })];
    box.replaceChildren(el('div', { class: 'tf-ei' }, ...oben, ...sp, ...(unten ? [unten] : [])));
    mitte.forEach((k, i) => { const h0 = sp[0].offsetHeight, h1 = sp[1].offsetHeight; (h0 || h1 ? (h0 <= h1 ? sp[0] : sp[1]) : sp[i % 2]).appendChild(k); });
  }
  const BREIT = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  if (BREIT && BREIT.addEventListener) BREIT.addEventListener('change', () => { if (/^heute\/einheit\//.test(T.route() || '')) sicher(render); });
  T.seite('einheit', render);
  T.routen('heute/einheit', (id) => (/^[\w:.-]{1,48}$/.test(id) ? { seite: 'einheit', titel: 'Analyse', sub: 'Einheit', eltern: 'heute', einheit: id } : null));
  T.zusatz('heute', () => { sicher(heuteKarte); if (window.tfStart && tfStart.ordnen) sicher(() => tfStart.ordnen()); });
  window.tfEinheit = { heuteKarte, holen, tagesListe, zuPlan, befund, reizVon, render, minuten };
})();
