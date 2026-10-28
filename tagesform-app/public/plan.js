/* Tagesform · Trainingsplan
   In vier Schritten zum Plan: Sportarten → Ziel → Zeit → Erfahrung. Daraus entstehen Phasen, Wochenumfänge und
   jeden Tag konkrete Einheiten mit Aufbau, Zielbereich und Begründung.
   Grundsätze (Quellen in der App): etwa 80 % locker (Seiler 2010), höchstens ~10 % mehr pro Woche und keine
   Sprünge (Gabbett 2016, Nielsen 2014), alle 3–4 Wochen leichter, Tapering 40–60 % weniger bei gleicher
   Intensität (Bosquet 2007), Kraft 1–2× pro Woche (Rønnestad & Mujika 2014), Fit & gesund nach WHO (Bull 2020). */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, svg, nf, iso, hmin, mmss, col, rowsOf, heute, localDate, DAY, svgIco, setMsg } = T.ui;
  const { karte, dot } = S;
  const A = () => dash.app;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};

  /* ---------- Datum ---------- */
  const tag = (d) => new Date(d + 'T00:00:00Z');
  const plus = (d, n) => iso(tag(d).getTime() + n * DAY);
  const wt = (d) => (tag(d).getUTCDay() + 6) % 7; // 0 = Montag
  const montag = (d) => plus(d, -wt(d));
  const WT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], WT_LANG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const dm = (d) => +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.';
  const kw = (d) => { const t = tag(d); t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7)); const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t - j) / DAY - 3 + ((j.getUTCDay() + 6) % 7)) / 7); };
  const zwischen = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r5 = (m) => Math.max(5, Math.round(m / 5) * 5);
  const dauer = (m) => (m >= 60 ? hmin(m * 60) + ' h' : m + ' min');

  /* ---------- Sportarten, Vorlagen, Ziele ---------- */
  const SP = {
    laufen: { name: 'Laufen', icon: 'i-run', farbe: 'mint', garmin: 'run' },
    rad: { name: 'Rad', icon: 'i-bike', farbe: 'orange', garmin: 'bike' },
    schwimmen: { name: 'Schwimmen', icon: 'i-swim', farbe: 'blue', garmin: 'swim' },
    kraft: { name: 'Kraft', icon: 'i-dumbbell', farbe: 'purple', garmin: 'kraft' },
    mobil: { name: 'Pilates & Yoga', icon: 'i-lotus', farbe: 'teal', garmin: null },
  };
  const AUSDAUER = ['schwimmen', 'rad', 'laufen'];
  const VORLAGEN = [['tri', 'Triathlon', ['schwimmen', 'rad', 'laufen', 'kraft']], ['lauf', 'Laufen', ['laufen', 'kraft']], ['rad', 'Radfahren', ['rad', 'kraft']], ['schwimmen', 'Schwimmen', ['schwimmen', 'kraft']], ['du', 'Duathlon', ['laufen', 'rad', 'kraft']], ['fit', 'Fit & gesund', ['laufen', 'kraft', 'mobil']]];
  const ZIELE = {
    rennen: ['Auf einen Wettkampf hin', 'Mit Datum: Phasen, Tapering und Renntempo', 'i-flag', 'pink'],
    schneller: ['Schneller werden', 'Mehr Tempo über deine Lieblingsstrecke', 'i-bolt', 'orange'],
    basis: ['Ausdauer aufbauen', 'Länger durchhalten, Grundlage verbessern', 'i-wave', 'blue'],
    fit: ['Fit und gesund bleiben', 'Nach WHO: Ausdauer, Kraft und Beweglichkeit', 'i-heart', 'green'],
  };
  const NIV = ['einsteiger', 'fortgeschritten', 'ambitioniert'];
  const NIV_TXT = {
    einsteiger: ['Einsteiger', 'Du fängst an oder trainierst noch nicht lange regelmäßig.'],
    fortgeschritten: ['Fortgeschritten', 'Du trainierst seit etwa einem Jahr regelmäßig.'],
    ambitioniert: ['Ambitioniert', 'Du trainierst seit Jahren strukturiert, mit Wettkampferfahrung.'],
  };
  const PHASE = {
    vorbereitung: ['Vorbereitung', 'gray', 'Allgemeine Fitness, Technik und Kraft – noch ohne harte Blöcke.'],
    grundlage: ['Grundlage', 'blue', 'Viel locker, der Umfang steigt langsam, dazu Kraft.'],
    aufbau: ['Aufbau', 'orange', 'Mehr Tempo und Rennspezifisches, Koppeleinheiten, Verpflegung üben.'],
    spitze: ['Spitze', 'red', 'Die härtesten Wochen – rennnah und konkret.'],
    taper: ['Tapering', 'teal', 'Umfang runter, Intensität halten: Die Müdigkeit geht, die Fitness bleibt.'],
    rennwoche: ['Rennwoche', 'mint', 'Kurz, locker, ein paar Steigerungen – viel Schlaf, nichts Neues.'],
    fit: ['Fit & gesund', 'green', 'Abwechslungsreich in Bewegung bleiben – locker, zügig und Kraft.'],
    test: ['Testwoche', 'purple', 'Leichtere Woche mit einem Test, der zeigt, was du gewonnen hast.'],
  };
  // Je Distanz: Zeitanteile der Ausdauer, maximale Länge der langen Einheit (min) nach Niveau, Koppeln
  const RENN = {
    tri_sprint: { anteil: { schwimmen: 0.22, rad: 0.43, laufen: 0.35 }, lang: { rad: [75, 100, 120], laufen: [50, 65, 75], schwimmen: [40, 50, 55] }, koppel: 'rad', koppelMin: 15, prio: ['rad', 'laufen'] },
    tri_od: { anteil: { schwimmen: 0.22, rad: 0.45, laufen: 0.33 }, lang: { rad: [105, 150, 180], laufen: [65, 85, 100], schwimmen: [45, 60, 65] }, koppel: 'rad', koppelMin: 20, prio: ['rad', 'laufen'] },
    tri_md: { anteil: { schwimmen: 0.2, rad: 0.48, laufen: 0.32 }, lang: { rad: [150, 210, 240], laufen: [80, 105, 120], schwimmen: [55, 65, 75] }, koppel: 'rad', koppelMin: 25, prio: ['rad', 'laufen'] },
    tri_ld: { anteil: { schwimmen: 0.18, rad: 0.52, laufen: 0.3 }, lang: { rad: [210, 300, 360], laufen: [110, 140, 165], schwimmen: [65, 80, 90] }, koppel: 'rad', koppelMin: 30, prio: ['rad', 'laufen'] },
    lauf_5k: { lang: { laufen: [50, 70, 80] }, prio: ['laufen'] },
    lauf_10k: { lang: { laufen: [60, 85, 100] }, prio: ['laufen'] },
    lauf_hm: { lang: { laufen: [100, 120, 135] }, prio: ['laufen'] },
    lauf_m: { lang: { laufen: [150, 165, 180] }, prio: ['laufen'] },
    rad_ezf20: { lang: { rad: [90, 120, 150] }, prio: ['rad'] },
    rad_ezf40: { lang: { rad: [105, 150, 180] }, prio: ['rad'] },
    rad_r90: { lang: { rad: [150, 210, 240] }, prio: ['rad'] },
    rad_r180: { lang: { rad: [240, 330, 390] }, prio: ['rad'] },
    schwimmen_s400: { lang: { schwimmen: [40, 50, 60] }, prio: ['schwimmen'] },
    schwimmen_s1500: { lang: { schwimmen: [50, 60, 75] }, prio: ['schwimmen'] },
    schwimmen_ow38: { lang: { schwimmen: [70, 90, 100] }, prio: ['schwimmen'] },
    schwimmen_ow5: { lang: { schwimmen: [80, 100, 120] }, prio: ['schwimmen'] },
    mehr_du_s: { anteil: { rad: 0.5, laufen: 0.5 }, lang: { rad: [75, 100, 120], laufen: [50, 65, 75] }, koppel: 'rad', koppelMin: 15, prio: ['laufen', 'rad'] },
    mehr_du_std: { anteil: { rad: 0.55, laufen: 0.45 }, lang: { rad: [105, 150, 180], laufen: [70, 90, 105] }, koppel: 'rad', koppelMin: 20, prio: ['laufen', 'rad'] },
    mehr_aqua: { anteil: { schwimmen: 0.4, laufen: 0.6 }, lang: { schwimmen: [45, 55, 65], laufen: [50, 65, 75] }, koppel: 'schwimmen', koppelMin: 15, prio: ['laufen', 'schwimmen'] },
    mehr_swimrun: { anteil: { schwimmen: 0.45, laufen: 0.55 }, lang: { schwimmen: [50, 65, 75], laufen: [65, 85, 100] }, koppel: 'schwimmen', koppelMin: 20, prio: ['laufen', 'schwimmen'] },
  };
  // sinnvolle Wochenstunden je Ziel: [Einsteiger, Fortgeschritten, Ambitioniert] – mehr bringt für dieses Ziel kaum etwas
  const MAXH = { tri_sprint: [6, 8, 10], tri_od: [7, 10, 13], tri_md: [9, 12, 16], tri_ld: [11, 15, 22], lauf_5k: [4, 6, 8], lauf_10k: [5, 7, 9], lauf_hm: [6, 8, 11], lauf_m: [7, 10, 13], rad_ezf20: [6, 8, 12], rad_ezf40: [6, 9, 12], rad_r90: [6, 9, 12], rad_r180: [8, 11, 15], schwimmen_s400: [3, 4, 6], schwimmen_s1500: [4, 5, 8], schwimmen_ow38: [5, 7, 9], schwimmen_ow5: [5, 7, 10], mehr_du_s: [5, 7, 9], mehr_du_std: [6, 9, 12], mehr_aqua: [4, 6, 8], mehr_swimrun: [7, 10, 14], fit: [4, 6, 8], basis: [5, 9, 13], schneller: [5, 9, 13] };
  const MINH = { tri_ld: 8, tri_md: 6, tri_od: 4, lauf_m: 4, lauf_hm: 3, rad_r180: 6, schwimmen_ow5: 3, mehr_swimrun: 4, mehr_du_std: 4 };
  const distKey = (P) => P.ziel === 'rennen' && P.rsport && P.rdist ? P.rsport + '_' + P.rdist : null;

  /* =====================================================================
     Plan rechnen: Wochen mit Phase, Umfang und Entlastung
     ===================================================================== */
  function startMontag() { const h = localDate(); return wt(h) <= 2 ? montag(h) : plus(montag(h), 7); }
  function aktuellH() { // Ø Stunden der letzten 4 Wochen (ohne die laufende); nach einer Pause die letzten 8
    const W = (rowsOf('wochen') || []).filter((w) => !w.aktuell && w.woche < montag(localDate()));
    const mit = (n) => { const L = W.slice(-n); return L.length ? L.reduce((x, w) => x + (+w.gesamt_h || 0), 0) / L.length : null; };
    const v4 = mit(4); if (v4 == null) return null;
    return Math.round((v4 >= 0.5 ? v4 : mit(8) || 0) * 2) / 2;
  }
  function rechnen(P) {
    const niv = Math.max(0, NIV.indexOf(P.niveau)), key = distKey(P), item = key ? tfDistanz(P.rsport, P.rdist) : null;
    const E = AUSDAUER.filter((s) => P.sporte.includes(s));
    let start = P.start || startMontag(), N;
    const rennen = !!(item && P.rdatum && P.rdatum >= start);
    if (rennen) { const rm = montag(P.rdatum); N = Math.round((tag(rm) - tag(start)) / (7 * DAY)) + 1; if (N > 52) { start = plus(rm, -51 * 7); N = 52; } N = Math.max(1, N); }
    else N = zwischen(P.wochen || 12, 4, 26);
    const W = Array.from({ length: N }, (_, i) => ({ i, start: plus(start, i * 7), phase: null, leicht: false, h: 0 }));
    // Phasen
    if (rennen) {
      const tw = Math.min(N, Math.max(1, Math.ceil((item.taper || 7) / 7)));
      const R = N - tw, spitze = R >= 10 ? 2 : R >= 5 ? 1 : 0, aufbau = Math.round((R - spitze) * (R > 20 ? 0.35 : 0.4));
      let grund = R - spitze - aufbau, vorb = 0;
      if (grund > 16) { vorb = grund - 12; grund = 12; }
      const seq = [].concat(Array(vorb).fill('vorbereitung'), Array(grund).fill('grundlage'), Array(aufbau).fill('aufbau'), Array(spitze).fill('spitze'), Array(tw - 1).fill('taper'), ['rennwoche']);
      W.forEach((w, i) => { w.phase = seq[i]; });
      // Gleiche Phasen wie in der Saison, wenn der Plan auf das A-Rennen zielt
      const sz = (rowsOf('saison') || [])[0];
      if (sz && sz.ziel_datum === P.rdatum && Array.isArray(sz.phasen)) W.forEach((w) => {
        const mitte = plus(w.start, 3), f = sz.phasen.find((x) => x.von <= mitte && x.bis >= mitte);
        if (f && PHASE[f.id] && f.id !== 'rennwoche') w.phase = f.id;
        if (f && (f.id === 'rennen' || f.id === 'rennwoche' || f.id === 'uebergang')) w.phase = 'rennwoche';
      });
      W[N - 1].phase = 'rennwoche';
    } else if (P.ziel === 'schneller' && E.length) {
      const g = Math.max(2, Math.round((N - 1) * 0.45));
      W.forEach((w, i) => { w.phase = i === N - 1 ? 'test' : i < g ? 'grundlage' : 'aufbau'; });
    } else if (P.ziel === 'basis' && E.length) W.forEach((w) => { w.phase = 'grundlage'; });
    else W.forEach((w) => { w.phase = 'fit'; });
    // Entlastung: nach 2 (Einsteiger) bzw. 3 Belastungswochen
    const zyklus = niv === 0 ? 3 : 4, belastbar = new Set(['vorbereitung', 'grundlage', 'aufbau', 'fit']);
    let k = 0;
    W.forEach((w, i) => {
      if (!belastbar.has(w.phase)) { k = 0; return; }
      k++;
      const naechste = W[i + 1];
      if (k % zyklus === 0 && naechste && belastbar.has(naechste.phase)) w.leicht = true;
    });
    // Umfang: Start bei deinem aktuellen Training, höchstens ~10 % mehr pro Belastungswoche
    const cap = MAXH[key || P.ziel] ? MAXH[key || P.ziel][niv] : 10;
    const ziel = Math.min(P.stunden, cap);
    const boden = Math.min(ziel, [1.5, 2.5, 3.5][niv]);
    const h0 = zwischen(P.aktuell != null ? P.aktuell : ziel * [0.55, 0.7, 0.8][niv], boden, ziel);
    const rate = niv === 0 ? 0.08 : 0.1;
    let last = h0, spitzeH = h0, tIdx = 0;
    const taperN = W.filter((w) => w.phase === 'taper').length;
    W.forEach((w, i) => {
      if (w.phase === 'taper') { const f = taperN >= 2 ? [0.75, 0.6, 0.5][Math.min(2, tIdx)] : 0.7; w.h = spitzeH * f; w.taperIdx = tIdx++; }
      else if (w.phase === 'rennwoche') w.h = spitzeH * (taperN >= 2 ? 0.4 : taperN === 1 ? 0.5 : 0.6);
      else if (w.phase === 'test') w.h = last * 0.7;
      else if (w.leicht) w.h = last * 0.65;
      else if (w.phase === 'spitze') { w.h = Math.min(ziel, last * 1.04); last = w.h; }
      else { w.h = i === 0 ? h0 : Math.min(ziel, last * (1 + rate)); last = w.h; }
      if (!['taper', 'rennwoche', 'test'].includes(w.phase) && !w.leicht) spitzeH = Math.max(spitzeH, w.h);
      w.h = Math.round(w.h * 4) / 4;
    });
    // Woche innerhalb der Phase (für Steigerungen der Intervalle)
    W.forEach((w, i) => { let n = 0; for (let j = i - 1; j >= 0 && W[j].phase === w.phase; j--) if (!W[j].leicht) n++; w.wp = n; });
    const hinweise = [];
    if (P.stunden > cap) hinweise.push('Für dieses Ziel plant Tagesform bis ' + nf(cap, 0) + ' h pro Woche – mehr Umfang bringt hier wenig zusätzlich. Die übrige Zeit ist gute Erholung.');
    if (key && MINH[key] && P.stunden < MINH[key]) hinweise.push('Für ' + item.lang + ' sind ' + nf(P.stunden, 1) + ' h pro Woche sehr knapp – realistisch sind eher ' + MINH[key] + ' h oder mehr. Der Plan nutzt deine Zeit so gut es geht.');
    if (rennen && N < 6) hinweise.push('Bis zum Rennen bleiben nur ' + N + ' Wochen – genug, um frisch an den Start zu gehen, aber kaum Zeit für Aufbau.');
    const maxW = Math.max(...W.map((w) => w.h));
    if (ziel - maxW > 0.75 && !hinweise.length) hinweise.push('Von ' + nf(h0, 1) + ' h steigt der Umfang bis ' + nf(maxW, 1) + ' h pro Woche – ein schnellerer Anstieg würde das Verletzungsrisiko erhöhen.');
    return { P, niv, key, item, rennen, start, N, W, ziel, h0, cap, hinweise, E };
  }

  /* =====================================================================
     Eine Woche zusammenstellen: Einheiten wählen, Dauer verteilen, auf Tage legen
     ===================================================================== */
  const QT = { vorbereitung: [0, 1, 1], grundlage: [0, 1, 2], aufbau: [1, 2, 2], spitze: [1, 2, 3], taper: [1, 1, 2], rennwoche: [1, 1, 1], test: [1, 1, 1], fit: [0, 1, 1] };
  const TYPMIN = { laufen: [30, 45, 45], rad: [55, 75, 80], schwimmen: [40, 50, 50] };
  const MINMIN = { laufen: [20, 30, 30], rad: [40, 45, 50], schwimmen: [30, 35, 35] };
  const NMAX = { laufen: [4, 5, 6], rad: [3, 4, 4], schwimmen: [2, 3, 4] };
  const SESSMAX = { laufen: [60, 75, 90], rad: [90, 120, 150], schwimmen: [45, 60, 75] }; // längste normale (nicht lange) Einheit
  // Anteil der langen Einheit am Wochenumfang der Sportart – lange Rennen brauchen längere lange Einheiten
  function langAnteil(x, key) {
    const k = key || '';
    if (x === 'rad') return /ld|r180/.test(k) ? 0.45 : /md|r90|du_std/.test(k) ? 0.4 : 0.36;
    if (x === 'laufen') return /_m$|ld/.test(k) ? 0.42 : /hm|md|swimrun/.test(k) ? 0.38 : 0.34;
    return /ld|ow/.test(k) ? 0.42 : 0.38;
  }
  const LANG_STD = { basis: { laufen: [60, 90, 120], rad: [120, 180, 240], schwimmen: [45, 60, 75] }, schneller: { laufen: [60, 80, 100], rad: [100, 150, 180], schwimmen: [45, 55, 65] }, fit: { laufen: [45, 60, 75], rad: [90, 120, 150], schwimmen: [40, 50, 60] } };
  // Mindestdauer harter Einheiten (min), damit Einlaufen, Hauptteil und Auslaufen hineinpassen
  const QMIN = { laufen: { schwelle: 50, vo2: 45, renntempo: 50, fahrtspiel: 40, test: 45 }, rad: { sweetspot: 60, schwelle: 70, vo2: 60, renntempo: 70, kadenz_q: 45, test: 60 }, schwimmen: { css: 45, sprint: 45, test: 40 } };
  const RW_CAP = { laufen: 40, rad: 60, schwimmen: 40 }; // Rennwoche: kurz und knackig
  const LEG = { swim: 'schwimmen', bike: 'rad', run: 'laufen' };
  function wocheBauen(PL, i) {
    const P = PL.P, w = PL.W[i], niv = PL.niv, E = PL.E, R = PL.key ? RENN[PL.key] : null;
    const ph = w.phase, leicht = w.leicht, tage = (P.tage || []).slice().sort((a, b) => a - b), tageN = tage.length || 7;
    const ES = [];
    let min = Math.round(w.h * 60);
    // Pilates & Yoga
    if (P.sporte.includes('mobil')) {
      const m = !E.length || leicht || ph === 'taper' ? 2 : 1;
      for (let j = 0; j < m; j++) ES.push({ sport: 'mobil', typ: j % 2 ? 'mobil_pilates' : 'mobil_yoga', min: 20, hart: 0, nr: j });
      min -= m * 20;
    }
    // Kraft
    if (P.sporte.includes('kraft')) {
      let k, dk;
      if (!E.length) { // reiner Kraftplan: 2–4 Einheiten à 30–60 min, passend zur Zeit
        k = zwischen(tageN - (P.sporte.includes('mobil') ? 1 : 0), 2, 4);
        while (k > 2 && min / k < 30) k--;
        dk = r5(zwischen(min / k, 25, 60));
      } else {
        const T0 = { vorbereitung: 2, grundlage: 2, aufbau: 1, spitze: 1, taper: 1, rennwoche: 0, test: 1, fit: 2 };
        k = P.ziel === 'fit' ? 2 : (T0[ph] != null ? T0[ph] : 1);
        if (niv === 2 && ph === 'aufbau' && w.h >= 9) k = 2;
        if (leicht) k = Math.min(k, 1);
        if (ph === 'taper' && w.taperIdx > 0) k = 0;
        dk = ph === 'taper' ? 25 : [30, 35, 40][niv];
        if (min - k * dk < 30 * E.length) k = Math.min(k, 1); // Ausdauer geht vor
      }
      for (let j = 0; j < k; j++) ES.push({ sport: 'kraft', typ: !E.length && k >= 4 ? (j % 2 ? 'kraft_unten' : 'kraft_oben') : E.includes('laufen') && j % 2 === 1 ? 'kraft_lauf' : 'kraft_ganz', min: dk, hart: 1, nr: j });
      min -= k * dk;
    }
    // Ausdauer
    if (E.length && min > 0) {
      const pflicht = PL.item ? [...new Set(PL.item.legs.map((l) => LEG[l.typ]).filter(Boolean))].filter((x) => E.includes(x)) : [];
      const haupt = R ? R.prio.filter((x) => E.includes(x)) : E.includes(P.haupt) ? [P.haupt] : [];
      const ant = {};
      if (R && R.anteil) E.forEach((x) => { ant[x] = R.anteil[x] || 0.12; });
      else if (haupt.length) { const hA = P.ziel === 'fit' ? 0.5 : 0.68; E.forEach((x) => { ant[x] = x === haupt[0] ? (E.length === 1 ? 1 : hA) : (1 - hA) / (E.length - 1); }); } // fit: mehr Abwechslung
      else E.forEach((x) => { ant[x] = { laufen: 1, rad: 1.25, schwimmen: 0.8 }[x]; });
      const sum = Object.values(ant).reduce((x, y) => x + y, 0), ms = {}, n = {};
      E.forEach((x) => { ms[x] = (min * ant[x]) / sum; });
      // fit ohne Rennen: jede gewählte Sportart mindestens einmal pro Woche, wenn die Zeit dafür reicht
      const alle = P.ziel === 'fit' && E.length > 1 && E.reduce((x, y) => x + MINMIN[y][niv], 0) <= min;
      if (alle) E.forEach((x) => { const fehlt = MINMIN[x][niv] - ms[x]; if (fehlt > 0) { const z = E.slice().sort((a, b) => ms[b] - ms[a])[0]; if (z !== x && ms[z] - fehlt >= MINMIN[z][niv]) { ms[z] -= fehlt; ms[x] += fehlt; } } });
      const muss = (x) => pflicht.includes(x) || haupt.includes(x) || E.length === 1 || alle;
      const proSport = niv === 2 ? 99 : tageN; // höchstens einmal pro Tag dieselbe Sportart (außer Ambitionierte)
      E.forEach((x) => { n[x] = ms[x] < MINMIN[x][niv] ? (muss(x) ? 1 : 0) : zwischen(Math.round(ms[x] / TYPMIN[x][niv]), 1, Math.min(NMAX[x][niv], proSport)); });
      if (ph === 'rennwoche') E.forEach((x) => { n[x] = Math.max(1, Math.min(n[x], x === (haupt[0] || E[0]) ? [2, 3, 3][niv] : [1, 1, 2][niv])); });
      const maxE = niv === 0 ? tageN : Math.round(tageN * (niv === 1 ? 1.5 : 2.1));
      const anz = () => E.reduce((x, y) => x + n[y], 0);
      while (anz() > maxE) { const x = E.filter((y) => n[y] > 1).sort((a, b) => n[b] - n[a] || (muss(a) ? 1 : -1))[0]; if (!x) break; n[x]--; }
      E.forEach((x) => { if (!n[x] && ms[x]) { const z = haupt.find((y) => n[y]) || E.find((y) => n[y]); if (z) ms[z] += ms[x]; ms[x] = 0; } });
      // Qualität: wie viele harte Einheiten diese Woche?
      let q = (P.ziel === 'rennen' && PL.rennen) || P.ziel === 'schneller' ? (QT[ph] || [0, 1, 1])[niv] : P.ziel === 'basis' ? [0, 0, 1][niv] : QT.fit[niv];
      if (P.ziel === 'schneller' && ph === 'grundlage') q = Math.max(q, 1);
      if ((P.ziel === 'fit' || P.ziel === 'basis') && niv === 0 && i < 4) q = 0;
      if (leicht) q = Math.max(0, q - 1);
      const koppelOk = R && R.koppel && E.includes(R.koppel) && E.includes('laufen') && ['aufbau', 'spitze'].concat(niv === 2 ? ['grundlage'] : []).concat(w.taperIdx === 0 ? ['taper'] : []).includes(ph) && !(leicht && niv === 0);
      // Minuten je Sportart: eine lange Einheit (1,5–2× so lang wie die übrigen), ggf. ein Koppellauf, der Rest gleichmäßig
      E.forEach((x) => {
        if (!n[x]) return;
        const cap0 = R && R.lang[x] ? R.lang[x][niv] : (LANG_STD[P.ziel] || LANG_STD.fit)[x][niv];
        const cap = leicht ? cap0 * 0.7 : ph === 'taper' ? cap0 * (w.taperIdx === 0 ? 0.65 : 0.5) : cap0;
        const langOk = !['rennwoche', 'test'].includes(ph) && (muss(x) || (!haupt.length && x === E[0]));
        let slots = n[x];
        const koppel = x === 'laufen' && koppelOk && slots >= 2 ? r5(Math.min(ms[x] * 0.25, (R.koppelMin || 20) * (niv === 0 ? 0.8 : 1) * (leicht ? 0.7 : 1) * (ph === 'taper' ? 0.7 : 1))) : 0;
        if (koppel) slots--;
        const rest = ms[x] - koppel;
        let lang = 0, je = 0;
        for (;;) {
          if (langOk && slots >= 2) { lang = Math.max(MINMIN[x][niv] + 10, Math.min(cap, rest * Math.max(langAnteil(x, PL.key), 1.3 / slots))); je = (rest - lang) / (slots - 1); }
          else if (langOk && slots === 1 && n[x] >= 2) { lang = Math.min(Math.max(cap, MINMIN[x][niv]), rest); je = 0; }
          else { lang = 0; je = rest / slots; }
          if (je && je < Math.max(MINMIN[x][niv], TYPMIN[x][niv] * 0.85) && slots > (lang ? 2 : 1)) { slots--; continue; } // lieber weniger, dafür sinnvolle Einheiten
          break;
        }
        if (lang && je > lang * 0.8) je = lang * 0.8; // die lange Einheit bleibt die längste
        je = Math.min(je, SESSMAX[x][niv]);
        if (ph === 'rennwoche') je = Math.min(je, RW_CAP[x]);
        if (lang) ES.push({ sport: x, typ: 'lang', min: r5(lang), hart: 2, lang: true });
        if (koppel) ES.push({ sport: 'laufen', typ: 'koppel', min: koppel, hart: 1, nach: R.koppel });
        const anzahl = slots - (lang ? 1 : 0);
        for (let j = 0; j < anzahl; j++) ES.push({ sport: x, typ: 'locker', min: r5(Math.max(MINMIN[x][niv] * (ph === 'rennwoche' ? 0.7 : 1), je)), hart: 0, nr: j });
      });
      // Qualität verteilen: Rennen nach Disziplin-Priorität, sonst nur die Hauptsportart; Schwimmen bekommt eine Schwelleneinheit extra
      const prio = R ? haupt.filter((x) => x !== 'schwimmen' || E.length === 1) : haupt.length ? haupt : [E[0]];
      for (let round = 0; round < 3 && q > 0; round++) prio.forEach((x) => {
        if (q <= 0) return;
        const frei = ES.filter((e) => e.sport === x && e.typ === 'locker');
        const schon = ES.filter((e) => e.sport === x && e.q).length;
        if (!frei.length || schon >= (x === 'laufen' && niv === 0 ? 1 : 2) || frei.length < (round === 0 ? 1 : 2)) return;
        const e = frei[frei.length - 1];
        e.q = true; e.typ = qualTyp(x, ph, schon, PL); e.hart = ['fahrtspiel', 'kadenz_q'].includes(e.typ) ? 1 : 2; q--;
        mindestens(ES, e, x, niv, ph);
      });
      if (E.includes('schwimmen') && !(E.length === 1 && ES.some((e) => e.sport === 'schwimmen' && e.q))) {
        const fr = ES.filter((e) => e.sport === 'schwimmen' && e.typ === 'locker');
        if (fr.length >= (niv === 2 ? 1 : 2) && ph !== 'vorbereitung' && (ph !== 'grundlage' || niv > 0) && P.ziel !== 'fit' && !(leicht && niv === 0)) {
          const e = fr[fr.length - 1]; e.q = true;
          if (ph === 'rennwoche') { e.typ = 'opener'; e.hart = 0; } else { e.typ = ph === 'spitze' && PL.key && /s400|sprint|aqua/.test(PL.key) ? 'sprint' : 'css'; e.hart = 2; mindestens(ES, e, 'schwimmen', niv, ph); }
        }
      }
      // Steigerungen im lockeren Lauf; Einsteiger ohne Laufbasis: Laufen und Gehen
      const lauf = ES.filter((e) => e.sport === 'laufen' && e.typ === 'locker');
      if (lauf.length && !leicht && (niv > 0 || i >= 4) && !['rennwoche', 'taper'].includes(ph)) lauf[0].typ = 'steiger';
      if (niv === 0 && (P.aktuell == null || P.aktuell < 1.5) && i < 6 && !(PL.key && /hm|_m$|md|ld/.test(PL.key))) ES.forEach((e) => { if (e.sport === 'laufen' && ['locker', 'steiger', 'lang'].includes(e.typ)) { e.typ = 'laufgehen'; e.hart = e.lang ? 1 : 0; } });
      const radL = ES.filter((e) => e.sport === 'rad' && e.typ === 'locker');
      if (radL.length >= 2 && i % 2 === 0) radL[0].typ = 'kadenz';
      const sw = ES.filter((e) => e.sport === 'schwimmen' && e.typ === 'locker');
      sw.forEach((e, j) => { e.typ = j === 1 && niv > 0 && PL.key && /ld|md|ow|swimrun/.test(PL.key) ? 'ausdauer' : 'technik'; });
      if (ph === 'rennwoche') ES.forEach((e) => { if (e.q && e.sport !== 'schwimmen') { e.typ = 'opener'; e.hart = 0; e.min = Math.min(e.min, RW_CAP[e.sport] || 40); } });
    }
    // Test zum Abschluss (Ziel „schneller“)
    if (ph === 'test') { const h = ES.find((e) => e.sport === (P.haupt || E[0]) && e.q) || ES.find((e) => e.sport === (P.haupt || E[0])); if (h) { h.typ = 'test'; h.hart = 2; h.q = true; mindestens(ES, h, h.sport, niv, ph); } }
    return { w, ES: platzieren(ES, PL, tage, i) };
  }
  function mindestens(ES, e, x, niv, ph) { // harte Einheit auf ihre Mindestdauer bringen, Zeit von lockeren Einheiten nehmen
    const soll = Math.round(((QMIN[x] || {})[e.typ] || 0) * (niv === 0 ? 0.85 : 1) * (ph === 'taper' ? 0.8 : 1));
    if (!soll || e.min >= soll) return;
    let fehlt = soll - e.min; e.min = r5(soll);
    ES.filter((y) => y.sport === x && y.typ === 'locker' && y !== e).forEach((y) => { const ab = Math.min(fehlt, Math.max(0, y.min - MINMIN[x][niv])); y.min = r5(y.min - ab); fehlt -= ab; });
  }
  function qualTyp(s, ph, nr, PL) {
    const k = PL.key || '', kurz = /5k|10k|sprint|od|ezf|s400|s1500|du_s|aqua/.test(k), lang = /hm|_m$|md|ld|r90|r180|ow|swimrun|du_std/.test(k);
    if (ph === 'taper') return nr === 0 ? (lang ? 'renntempo' : 'vo2') : 'schwelle';
    if (s === 'laufen') {
      if (ph === 'vorbereitung' || ph === 'fit') return 'fahrtspiel';
      if (ph === 'grundlage') return PL.niv === 2 || PL.P.ziel === 'schneller' ? (nr === 0 ? 'schwelle' : 'fahrtspiel') : 'fahrtspiel';
      if (ph === 'aufbau') return kurz || PL.P.ziel === 'schneller' ? (nr === 0 ? 'vo2' : 'schwelle') : nr === 0 ? 'schwelle' : 'renntempo';
      if (ph === 'spitze') return kurz ? (nr === 0 ? 'vo2' : 'renntempo') : nr === 0 ? 'renntempo' : 'schwelle';
      return 'schwelle';
    }
    if (s === 'rad') {
      if (ph === 'vorbereitung' || ph === 'fit') return 'kadenz_q';
      if (ph === 'grundlage') return 'sweetspot';
      if (ph === 'aufbau') return lang ? (nr === 0 ? 'renntempo' : 'sweetspot') : nr === 0 ? 'schwelle' : 'vo2';
      if (ph === 'spitze') return nr === 0 ? 'renntempo' : 'vo2';
      return 'sweetspot';
    }
    return ph === 'spitze' && kurz ? 'sprint' : 'css';
  }
  // Einheiten auf Tage legen: lange Einheit auf den langen Tag, harte Tage nicht nebeneinander, Kraft an harten Tagen
  function platzieren(ES, PL, tage, wi) {
    const P = PL.P, niv = PL.niv, fitPlan = P.ziel === 'fit' || !PL.E.length;
    const verf = new Set(tage.length ? tage : [0, 1, 2, 3, 4, 5, 6]);
    const L = verf.has(P.lang) ? P.lang : Math.max(...verf);
    const day = Array.from({ length: 7 }, () => []);
    const hart = (d) => day[(d + 7) % 7].reduce((m, s) => Math.max(m, s.sport === 'schwimmen' ? Math.min(1, s.hart) : s.hart), 0); // Schwimmen belastet den Körper weniger
    const maxTag = [2, 2, 3][niv];
    const VOR = [1, 3, 5, 2, 4, 6, 0]; // bei Gleichstand: Di, Do, Sa, Mi, Fr, So, Mo
    function wert(s, d) {
      if (!verf.has(d)) return -1e9;
      const n = day[d].filter((x) => x.sport !== 'mobil').length + (s.sport === 'mobil' ? 0 : 0);
      let sc = -day[d].length * 8;
      if (day[d].length >= maxTag + (s.sport === 'mobil' ? 1 : 0)) sc -= 1e6;
      if (day[d].some((x) => x.sport === s.sport)) sc -= 40;
      const v = (d + 6) % 7, nx = (d + 1) % 7;
      if (s.hart === 2 && s.sport === 'schwimmen') { if (day[d].some((x) => x.lang && x.sport !== 'schwimmen')) sc -= 20; if (day[d].some((x) => x.hart === 2 && x.sport !== 'schwimmen')) sc -= 6; }
      else if (s.hart === 2) {
        if (hart(d) === 2) sc -= 30;
        if (day[d].some((x) => x.lang)) sc -= 60; // am langen Tag keine zweite harte Einheit
        if (hart(v) === 2) sc -= 14; if (hart(nx) === 2) sc -= 14;
        if (day[v].concat(day[nx]).some((x) => x.sport === s.sport && x.hart === 2)) sc -= 12;
        if (nx === L && s.sport !== 'schwimmen') sc -= 8;
      }
      if (s.sport === 'kraft') {
        if (day[d].some((x) => x.sport === 'kraft')) sc -= 60;
        if (fitPlan) { if (day[v].concat(day[nx]).some((x) => x.sport === 'kraft')) sc -= 22; }
        else {
          if (hart(d) === 2 && !day[d].some((x) => x.lang)) sc += 14; // harte Tage hart, lockere locker
          if (d === L || nx === L) sc -= 16;
          if (day[v].concat(day[nx]).some((x) => x.sport === 'kraft')) sc -= 10;
        }
      }
      if (s.hart === 0 && s.sport !== 'mobil' && hart(d) === 2) sc -= 6;
      if (s.sport === 'mobil') { if (hart(d) === 0) sc += 6; if (day[d].some((x) => x.lang)) sc += 3; if (day[d].some((x) => x.sport === 'mobil')) sc -= 50; }
      if (s.sport === 'schwimmen' && n === 1 && hart(d) < 2) sc += 3; // Schwimmen passt gut als zweite Einheit
      return sc - VOR.indexOf(d) * 0.01;
    }
    const best = (s) => { let bd = null, bw = -Infinity; for (let d = 0; d < 7; d++) { const v = wert(s, d); if (v > bw) { bw = v; bd = d; } } if (bw <= -1e8) { bd = [...verf].sort((a, b) => day[a].length - day[b].length)[0]; } return bd; };
    const setze = (s, d) => { s.tag = d; day[d].push(s); };
    const langs = ES.filter((s) => s.lang).sort((a, b) => b.min - a.min);
    const L2 = [(L + 1) % 7, (L + 6) % 7].find((d) => verf.has(d) && d !== L); // zweite lange Einheit am Folgetag (klassisch: Sa Rad, So Lauf)
    langs.forEach((s, j) => setze(s, j === 0 ? L : j === 1 && L2 != null && !day[L2].length ? L2 : best(s)));
    const koppel = (s) => { const host = ES.find((x) => x.sport === s.nach && x.lang) || ES.find((x) => x.sport === s.nach && x.tag != null); setze(s, host && host.tag != null ? host.tag : best(s)); };
    ES.filter((s) => s.typ === 'koppel' && ES.some((x) => x.sport === s.nach && x.lang)).forEach(koppel);
    ES.filter((s) => s.hart === 2 && s.tag == null && s.sport !== 'schwimmen').forEach((s) => setze(s, best(s)));
    ES.filter((s) => s.sport === 'kraft' && s.tag == null).forEach((s) => setze(s, best(s)));
    ES.filter((s) => s.tag == null && s.sport !== 'mobil' && s.typ !== 'koppel').sort((a, b) => b.min - a.min).forEach((s) => setze(s, best(s)));
    ES.filter((s) => s.tag == null && s.typ === 'koppel').forEach(koppel);
    ES.filter((s) => s.tag == null).forEach((s) => setze(s, best(s)));
    // Rennen in der Rennwoche: am Renntag nur das Rennen, am Vortag höchstens kurz locker
    const w = PL.W[wi];
    if (w.phase === 'rennwoche' && PL.rennen && P.rdatum >= w.start && P.rdatum <= plus(w.start, 6)) {
      const rd = wt(P.rdatum);
      for (let d = 0; d < 7; d++) {
        if (d === rd) { day[d] = []; continue; }
        if (d > rd) { day[d] = []; continue; } // nach dem Rennen: Erholung
        if (d === rd - 1) day[d] = day[d].filter((s) => s.sport !== 'kraft').slice(0, 1).map((s) => Object.assign(s, { typ: 'opener', min: Math.min(s.min, 25), hart: 0 }));
      }
      const hs = (RENN[PL.key] || {}).prio || [PL.E[0]];
      day[rd] = [{ sport: hs[0] || 'laufen', typ: 'rennen', min: rennDauer(PL), hart: 2, tag: rd }];
    }
    // Reihenfolge am Tag: Schwimmen, dann Rad und Koppellauf, Laufen, Kraft, Mobilität
    const ord = { schwimmen: 0, rad: 1, laufen: 2, kraft: 4, mobil: 5 };
    day.forEach((L2d) => L2d.sort((a, b) => (a.typ === 'koppel' ? 1.5 : ord[a.sport]) - (b.typ === 'koppel' ? 1.5 : ord[b.sport])));
    return day;
  }
  function rennDauer(PL) { // Renndauer in Minuten: aus dem Rennrechner, sonst grob aus dem Distanz-Katalog
    const it = PL.item; if (!it) return 60;
    try { const sp = T.rrSplits && T.rrSplits(PL.P.rsport, PL.P.rdist); if (sp && sp.legs) { const t = sp.legs.reduce((x, l) => x + (+l.t || 0), 0); if (t > 300) return Math.round(t / 60); } } catch (e) { /* Rechner noch nicht bereit */ }
    const a = athlet(), css = a.css_s_100m || 120, vt2 = a.vt2_pace_s_km || 300;
    return Math.round(it.legs.reduce((x, l) => x + (l.typ === 'swim' ? (l.km * 10 * css * 1.05) / 60 : l.typ === 'bike' ? (l.km / 32) * 60 : l.typ === 'run' ? (l.km * vt2 * (l.km > 21 ? 1.15 : l.km > 10 ? 1.05 : 1)) / 60 : (l.s || 0) / 60), 0));
  }

  /* =====================================================================
     Einheiten beschreiben: Aufbau, Zielbereich, Warum
     ===================================================================== */
  const FUEHL = { locker: 'Ganze Sätze sprechen geht · Anstrengung 3–4 von 10', mittel: 'Nur noch kurze Sätze · 5–6 von 10', schwelle: 'Angenehm hart, nur einzelne Sätze · 7 von 10', hart: 'Nur noch einzelne Worte · 8–9 von 10', renn: 'Dein geplantes Renntempo', test: 'So schnell, wie du die Strecke gleichmäßig schaffst' };
  function ziele(sport, art, PL) { // Zielbereich aus dem Profil
    const a = athlet(), std = new Set(a.standard || []), out = [];
    if (sport === 'laufen') {
      const puls = !std.has('vt1_hf'), tempo = !std.has('vt1_pace_s_km') || !std.has('vt2_pace_s_km'), t = (x) => (tempo ? x : null), j = (...x) => x.filter(Boolean).join(' · ');
      let z = null;
      if (art === 'locker') z = j(puls && 'Puls unter ' + a.vt1_hf, t('langsamer als ' + mmss(a.vt1_pace_s_km) + '/km'));
      if (art === 'mittel') z = j(puls && 'Puls ' + a.vt1_hf + '–' + (a.vt2_hf - 5), t(mmss(a.vt2_pace_s_km + 15) + '–' + mmss(a.vt1_pace_s_km) + '/km'));
      if (art === 'schwelle') z = j(puls && 'Puls ' + (a.vt2_hf - 5) + '–' + a.vt2_hf, t('etwa ' + mmss(a.vt2_pace_s_km) + '/km'));
      if (art === 'hart') z = j(puls && 'Puls über ' + a.vt2_hf, '90–95 % HFmax (' + Math.round(a.hf_max * 0.9) + '–' + Math.round(a.hf_max * 0.95) + ')');
      if (art === 'renn' && tempo) { const leg = PL.item && PL.item.legs.find((l) => l.typ === 'run'); if (leg && Array.isArray(leg.band)) { const ref = leg.ref === 'vt1' ? a.vt1_pace_s_km : a.vt2_pace_s_km; z = 'etwa ' + mmss(ref / leg.band[1]) + '–' + mmss(ref / leg.band[0]) + '/km'; } }
      if (z) out.push(z);
    }
    if (sport === 'rad' && a.ftp_ref_w) {
      const f = a.ftp_ref_w, w = (lo, hi) => Math.round(f * lo) + '–' + Math.round(f * hi) + ' W';
      if (art === 'locker') out.push('55–75 % FTP · ' + w(0.55, 0.75));
      if (art === 'mittel') out.push('76–87 % FTP · ' + w(0.76, 0.87));
      if (art === 'sweetspot') out.push('88–94 % FTP · ' + w(0.88, 0.94));
      if (art === 'schwelle') out.push('95–100 % FTP · ' + w(0.95, 1.0));
      if (art === 'hart') out.push('106–120 % FTP · ' + w(1.06, 1.2));
      if (art === 'renn') { const leg = PL.item && PL.item.legs.find((l) => l.typ === 'bike'); const b = leg && Array.isArray(leg.band) ? leg.band : [a.rad_if_min || 0.65, a.rad_if_max || 0.75]; out.push(Math.round(b[0] * 100) + '–' + Math.round(b[1] * 100) + ' % FTP · ' + w(b[0], b[1])); }
    }
    if (sport === 'schwimmen' && a.css_s_100m) {
      const c = a.css_s_100m;
      if (art === 'locker') out.push(mmss(c + 10) + '–' + mmss(c + 15) + '/100 m (CSS + 10–15 s)');
      if (art === 'schwelle') out.push(mmss(c) + '/100 m (CSS)');
      if (art === 'hart') out.push('schneller als ' + mmss(c - 3) + '/100 m');
      if (art === 'renn') out.push(mmss(c + 3) + '–' + mmss(c + 6) + '/100 m');
    }
    return out;
  }
  const stufe = (arr, w) => arr[Math.min(arr.length - 1, w.leicht ? 0 : w.wp || 0)];
  function beschreiben(s, PL, w) {
    const P = PL.P, a = athlet(), m = s.min, kh = a.kh_g_h_min && a.kh_g_h_max ? a.kh_g_h_min + '–' + a.kh_g_h_max : '60–90';
    const D = { titel: '', art: 'locker', bau: [], warum: '', quelle: '', tipp: '', link: null };
    const ein = Math.min(15, Math.round(m * 0.25)), aus = Math.min(10, Math.round(m * 0.15));
    if (s.sport === 'laufen') {
      if (s.typ === 'locker') Object.assign(D, { titel: 'Lockerer Lauf', bau: [m + ' min gleichmäßig locker'], warum: 'Baut die Ausdauer deiner Muskeln auf – mehr Mitochondrien und Kapillaren –, ohne dich zu ermüden. Der größte Teil deines Trainings sieht so aus.', quelle: 'Seiler, IJSPP 2010' });
      if (s.typ === 'steiger') Object.assign(D, { titel: 'Locker mit Steigerungen', bau: [Math.max(10, m - 8) + ' min locker', '6 × 20 s Steigerung bis fast zum Sprint, locker bleiben – dazwischen 60–90 s gehen oder traben', '3 min austraben'], warum: 'Steigerungen schulen Technik und Schnelligkeit, ohne müde zu machen – das hält dich auch in der Grundlage spritzig.' });
      if (s.typ === 'laufgehen') { const lauf = Math.min(10, 1 + (w.i || 0)), geh = lauf >= 6 ? 1 : 2, n = Math.max(3, Math.floor((m - 10) / (lauf + geh))); Object.assign(D, { titel: s.lang ? 'Längeres Laufen und Gehen' : 'Laufen und Gehen', bau: ['5 min zügig gehen', n + ' × ' + lauf + ' min locker laufen, ' + geh + ' min gehen', '5 min gehen'], warum: 'Der sichere Einstieg: Die Gehpausen schonen Sehnen und Knochen, die sich langsamer anpassen als Herz und Lunge. Jede Woche werden die Laufabschnitte länger.', quelle: 'Nielsen et al., J Orthop Sports Phys Ther 2014' }); }
      if (s.typ === 'fahrtspiel') { const n = stufe([6, 8, 10], w); Object.assign(D, { titel: 'Fahrtspiel', art: 'mittel', bau: [ein + ' min einlaufen', n + ' × 1 min zügig, 2 min locker – nach Gefühl, gern an kleinen Hügeln', aus + ' min auslaufen'], warum: 'Spielerischer Tempowechsel – der sanfte Einstieg in schnelleres Laufen, ohne Uhr und Druck.' }); }
      if (s.typ === 'schwelle') { const v = stufe(['3 × 6 min', '3 × 8 min', '3 × 10 min', '2 × 15 min', '25 min am Stück'], w); Object.assign(D, { titel: 'Schwellenlauf', art: 'schwelle', bau: [ein + ' min einlaufen', v + ' an der Schwelle, dazwischen 2 min traben', aus + ' min auslaufen'], warum: 'Hebt deine Schwelle – das Tempo, das du lange halten kannst. Wichtig von 10 km bis zur Langdistanz.', quelle: 'Seiler, IJSPP 2010' }); }
      if (s.typ === 'vo2') { const v = stufe(['5 × 2 min', '5 × 3 min', '4 × 4 min', '5 × 4 min', '6 × 3 min'], w); Object.assign(D, { titel: 'Intervalle', art: 'hart', bau: [ein + ' min einlaufen, dazu 3 Steigerungen', v + ' hart, dazwischen gleich lang traben', aus + ' min auslaufen'], warum: 'Harte Abschnitte von 3–4 Minuten heben die VO2max am stärksten – dein Motor wird größer.', quelle: 'Helgerud et al., Med Sci Sports Exerc 2007' }); }
      if (s.typ === 'renntempo') { const k = PL.key || '', v = /_m$|ld/.test(k) ? stufe(['2 × 15 min', '2 × 20 min', '3 × 15 min', '2 × 25 min'], w) : /hm|md/.test(k) ? stufe(['3 × 8 min', '3 × 10 min', '2 × 15 min', '3 × 12 min'], w) : stufe(['5 × 1 km', '6 × 1 km', '4 × 1,5 km', '3 × 2 km'], w); Object.assign(D, { titel: 'Renntempo', art: 'renn', bau: [ein + ' min einlaufen', v + ' im Renntempo, dazwischen 2–3 min locker', aus + ' min auslaufen'], warum: 'Du lernst dein Renntempo kennen und gewöhnst Beine und Kopf daran – so läufst du es am Renntag ruhig an.' }); }
      if (s.typ === 'lang') { const spez = ['aufbau', 'spitze'].includes(w.phase) && PL.key && /hm|_m$|md|ld/.test(PL.key); Object.assign(D, { titel: 'Langer Lauf', bau: spez ? [(m - 25) + ' min locker', 'die letzten 20–25 min im Renntempo, dann 5 min austraben'] : [m + ' min gleichmäßig locker – bergauf ruhig langsamer'], warum: 'Macht Muskeln, Sehnen und Stoffwechsel fit für die lange Dauer. Die Länge steigt langsam, damit dein Körper mitkommt.', tipp: m >= 75 ? 'Ab etwa 75 min: 30–60 g Kohlenhydrate pro Stunde mitnehmen und Trinken üben.' : '', quelle: 'Jeukendrup, Sports Med 2014' }); }
      if (s.typ === 'koppel') Object.assign(D, { titel: 'Koppellauf', art: ['aufbau', 'spitze'].includes(w.phase) ? 'renn' : 'locker', bau: ['Direkt nach dem ' + (s.nach === 'schwimmen' ? 'Schwimmen' : 'Rad') + ' loslaufen – Wechsel üben', m + ' min ' + (['aufbau', 'spitze'].includes(w.phase) ? 'davon die Hälfte im Renntempo' : 'locker') + ', die ersten Minuten mit kurzen, schnellen Schritten'], warum: 'Gewöhnt deine Beine an das Laufen nach dem Radfahren – das „Gummibein“-Gefühl wird mit jeder Koppeleinheit kleiner.' });
      if (s.typ === 'opener') Object.assign(D, { titel: 'Kurz & locker', bau: [Math.max(15, m - 8) + ' min locker', '4 × 15 s zügig, dazwischen voll erholen'], warum: 'Hält die Beine wach, ohne zu ermüden – genau richtig für die Rennwoche.' });
      if (s.typ === 'test') Object.assign(D, { titel: P.ziel === 'schneller' ? '5-km-Test' : 'Test', art: 'test', bau: ['15 min einlaufen mit 3 Steigerungen', '5 km so schnell, wie du sie gleichmäßig schaffst – erster Kilometer bewusst kontrolliert', '10 min auslaufen'], warum: 'Zeigt, was du in den letzten Wochen gewonnen hast – und gibt dir neue Werte fürs Training.' });
    }
    if (s.sport === 'rad') {
      if (s.typ === 'locker') Object.assign(D, { titel: 'Lockere Ausfahrt', bau: [m + ' min locker, Trittfrequenz 85–95'], warum: 'Grundlage mit wenig Belastung für Gelenke – ideal, um Umfang aufzubauen.', quelle: 'Seiler, IJSPP 2010' });
      if (s.typ === 'kadenz' || s.typ === 'kadenz_q') Object.assign(D, { titel: 'Locker mit Kadenz', bau: [Math.max(10, m - 20) + ' min locker', '6 × 1 min sehr hohe Trittfrequenz (110+), ruhiger Oberkörper – 2 min normal', '5 min ausrollen'], warum: 'Hohe Trittfrequenz schult einen runden, ökonomischen Tritt – ohne dich müde zu machen.' });
      if (s.typ === 'sweetspot') { const v = stufe(['3 × 10 min', '3 × 12 min', '3 × 15 min', '2 × 20 min', '3 × 20 min'], w); Object.assign(D, { titel: 'Sweet Spot', art: 'sweetspot', bau: [ein + ' min einfahren', v + ' zügig, dazwischen 5 min locker', aus + ' min ausfahren'], warum: 'Hart genug, um die Schwelle zu heben, und gut zu erholen – viel Wirkung pro Stunde.', quelle: 'Allen & Coggan 2010' }); }
      if (s.typ === 'schwelle') { const v = stufe(['2 × 12 min', '2 × 15 min', '2 × 20 min', '3 × 15 min'], w); Object.assign(D, { titel: 'Schwellen-Intervalle', art: 'schwelle', bau: [ein + ' min einfahren', v + ' an der Schwelle, dazwischen 5 min locker', aus + ' min ausfahren'], warum: 'Hebt deine FTP – die Leistung, die du lange halten kannst.', quelle: 'Allen & Coggan 2010' }); }
      if (s.typ === 'vo2') { const v = stufe(['5 × 3 min', '5 × 4 min', '6 × 4 min', '5 × 5 min'], w); Object.assign(D, { titel: 'VO2max-Intervalle', art: 'hart', bau: [ein + ' min einfahren', v + ' hart, dazwischen gleich lang locker', aus + ' min ausfahren'], warum: 'Kurze, harte Intervalle vergrößern deinen Motor – davon profitiert auch die Schwelle.', quelle: 'Helgerud et al., Med Sci Sports Exerc 2007' }); }
      if (s.typ === 'renntempo') { const v = /ld|r180/.test(PL.key || '') ? stufe(['2 × 20 min', '2 × 30 min', '3 × 25 min', '2 × 45 min'], w) : stufe(['3 × 10 min', '3 × 12 min', '2 × 20 min', '3 × 15 min'], w); Object.assign(D, { titel: 'Renntempo', art: 'renn', bau: [ein + ' min einfahren', v + ' im Renntempo – in der Aero-Position, wenn du eine hast', aus + ' min ausfahren'], warum: 'Du fährst genau die Leistung, die du im Rennen halten willst – und lernst, sie gleichmäßig zu fahren.' }); }
      if (s.typ === 'lang') { const spez = ['aufbau', 'spitze'].includes(w.phase) && PL.key && /md|ld|r90|r180/.test(PL.key); Object.assign(D, { titel: 'Lange Ausfahrt', bau: spez ? [Math.round(m * 0.3) + ' min locker', '2–3 × 20–30 min im Renntempo, dazwischen 10 min locker', 'Rest locker – Verpflegung wie im Rennen'] : [m + ' min locker, gleichmäßig – auch bergauf nicht überziehen'], warum: 'Die wichtigste Einheit für lange Rennen: Ausdauer, Fettstoffwechsel, Sitzfleisch – und der Ort, um die Verpflegung zu üben.', tipp: m >= 90 ? 'Kohlenhydrate: ' + kh + ' g pro Stunde, ab der ersten halben Stunde regelmäßig. Trinken nach Durst und Schweiß.' : '', quelle: 'Jeukendrup, Sports Med 2014 · Jeukendrup, Sports Med 2017' }); }
      if (s.typ === 'opener') Object.assign(D, { titel: 'Kurz mit Antritten', bau: [Math.max(20, m - 10) + ' min locker', '3 × 1 min zügig, dazwischen 2 min locker'], warum: 'Weckt die Beine vor dem Rennen, ohne Müdigkeit zu hinterlassen.' });
      if (s.typ === 'test') Object.assign(D, { titel: '20-Minuten-Test', art: 'test', bau: ['20 min einfahren mit 3 × 1 min zügig', '20 min so gleichmäßig und hart wie möglich', '15 min ausfahren'], warum: '95 % deiner Durchschnittsleistung sind deine neue FTP – trag sie im Profil ein.', quelle: 'Allen & Coggan 2010' });
    }
    if (s.sport === 'schwimmen') {
      const c = a.css_s_100m || 120, gesamt = Math.round(((m * 60) / (c + 18)) * 100 / 100) * 100, haupt = Math.max(300, gesamt - 900);
      if (s.typ === 'technik' || s.typ === 'locker') Object.assign(D, { titel: 'Technik & Grundlage', bau: ['300 m einschwimmen', '8 × 50 m Technik (Abschlag, Seitlage, Faust), 15 s Pause', Math.max(2, Math.round(haupt / 200)) + ' × 200 m locker, 20 s Pause', '200 m ausschwimmen'], warum: 'Im Wasser entscheidet die Technik mehr als die Kraft. Saubere Züge machen dich schneller und sparen Energie.', quelle: 'Costill et al., Int J Sports Med 1985', km: gesamt });
      if (s.typ === 'css') { const n = Math.max(6, Math.min(20, Math.round(haupt / 100))); Object.assign(D, { titel: 'CSS-Intervalle', art: 'schwelle', bau: ['400 m einschwimmen, davon 4 × 50 m steigernd', n + ' × 100 m im CSS-Tempo, 15 s Pause', '200 m ausschwimmen'], warum: 'Schwimmen an der Schwelle verbessert genau das Tempo, das du über die Rennstrecke halten kannst.', quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', km: gesamt }); }
      if (s.typ === 'ausdauer') Object.assign(D, { titel: 'Ausdauer lang', bau: ['300 m einschwimmen', Math.max(2, Math.round(haupt / 400)) + ' × 400 m gleichmäßig, 30 s Pause – alle 6–8 Züge nach vorn schauen wie im Freiwasser', '200 m ausschwimmen'], warum: 'Gewöhnt dich an lange, gleichmäßige Strecken – mit Orientierung wie im See.', km: gesamt });
      if (s.typ === 'lang') Object.assign(D, { titel: 'Langes Schwimmen', bau: ['300 m einschwimmen', Math.round(haupt / 100) * 100 + ' m am Stück oder in 500-m-Blöcken, gleichmäßig', '200 m ausschwimmen'], warum: 'Die Ausdauer für lange Schwimmstrecken – ruhig und technisch sauber.', km: gesamt });
      if (s.typ === 'sprint') Object.assign(D, { titel: 'Tempo', art: 'hart', bau: ['400 m einschwimmen', '12 × 50 m schnell, 30 s Pause', '4 × 100 m locker', '200 m ausschwimmen'], warum: 'Kurze schnelle Strecken verbessern Tempo und Zugkraft.', km: gesamt });
      if (s.typ === 'opener') Object.assign(D, { titel: 'Kurz & locker', bau: ['600–1000 m locker', '4 × 50 m zügig, dazwischen voll erholen'], warum: 'Wassergefühl für das Rennen – ohne Müdigkeit.' });
      if (s.typ === 'test') Object.assign(D, { titel: 'CSS-Test', art: 'test', bau: ['400 m einschwimmen, 4 × 50 m steigernd', '400 m so schnell wie gleichmäßig möglich', '5–10 min locker', '200 m so schnell wie möglich', '200 m ausschwimmen'], warum: 'Aus beiden Zeiten berechnet Tagesform deine neue CSS – trag sie unter Schwimmen ein.', quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', link: { ziel: 'training/schwimmen', text: 'CSS eintragen' } });
    }
    if (s.sport === 'kraft') {
      const ziel = w.phase === 'taper' || w.phase === 'rennwoche' ? 'stabil' : !PL.E.length ? (PL.niv === 0 ? 'aufbau' : 'aufbau') : w.phase === 'spitze' ? 'power' : w.phase === 'aufbau' ? 'kraft' : PL.niv === 0 ? 'aufbau' : P.ziel === 'fit' ? 'aufbau' : 'kraft';
      const vor = s.typ === 'kraft_lauf' ? 'laeufer' : s.typ === 'kraft_oben' ? 'oben' : s.typ === 'kraft_unten' ? 'beine' : 'ganz';
      const NAME = { ganz: 'Kraft: Ganzkörper', laeufer: 'Kraft: Beine & Rumpf', oben: 'Kraft: Oberkörper', beine: 'Kraft: Beine & Gesäß' };
      Object.assign(D, { titel: NAME[vor], art: 'kraft', bau: ['5–8 min aufwärmen', ziel === 'kraft' ? '4–5 Übungen schwer: 3–4 × 4–6 Wdh., 2–3 min Pause' : ziel === 'power' ? 'wenige explosive Sätze: 3–4 × 3–5 Wdh., volle Pausen' : ziel === 'stabil' ? 'leichte Aktivierung: 2 × 10–12 kontrolliert' : '5–6 Übungen: 3 × 8–12 Wdh., 1–3 Wdh. Reserve', 'Workout mit Erklärungen öffnen – Übungen passend zu deinem Ort'], warum: PL.E.length ? 'Schweres Krafttraining verbessert die Lauf- und Radökonomie und senkt das Verletzungsrisiko deutlich.' : 'Kraft an mindestens zwei Tagen pro Woche empfiehlt die WHO – für Muskeln, Knochen und Stoffwechsel.', quelle: PL.E.length ? 'Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Lauersen et al., Br J Sports Med 2014' : 'Bull et al., Br J Sports Med 2020', link: { ziel: 'training/gym/workout', text: 'Workout öffnen', fn: () => window.tfGym && tfGym.vorlage && tfGym.vorlage({ vorlage: vor, ziel, dauer: s.min }) } });
    }
    if (s.sport === 'mobil') {
      const yoga = s.typ === 'mobil_yoga';
      Object.assign(D, { titel: yoga ? 'Yoga: Hüfte & Rücken' : 'Pilates: Rumpf & Haltung', bau: [s.min + ' min ruhig und kontrolliert, mit langsamer Atmung', 'Einheit mit Anleitung öffnen'], warum: yoga ? 'Löst Hüfte, Beinrückseite und Rücken – gut an lockeren Tagen und nach langen Einheiten.' : 'Kräftigt die tiefe Rumpfmuskulatur, die Kraft von den Beinen überträgt und den Rücken schützt.', quelle: yoga ? 'Polsgrove et al., Int J Yoga 2016' : 'Kloubec, J Strength Cond Res 2010', link: { ziel: 'training/flow/einheit', text: 'Einheit öffnen', fn: () => window.tfFlow && tfFlow.vorlage && tfFlow.vorlage({ stil: yoga ? 'yoga' : 'pilates', fokus: yoga ? 'huefte' : 'rumpf', dauer: s.min }) } });
    }
    if (s.typ === 'rennen') Object.assign(D, { titel: (P.rname || (PL.item && PL.item.lang) || 'Rennen'), art: 'renn', bau: ['Aufwärmen wie geübt', 'Pacing und Verpflegung nach Plan – die ersten Minuten bewusst kontrolliert', 'Genießen!'], warum: 'Dafür hast du trainiert.', link: { ziel: 'training/rechner', text: 'Rennrechner öffnen' } });
    D.ziele = ziele(s.sport, D.art === 'sweetspot' ? 'sweetspot' : D.art, PL);
    D.fuehl = FUEHL[{ locker: 'locker', mittel: 'mittel', schwelle: 'schwelle', sweetspot: 'schwelle', hart: 'hart', renn: 'renn', test: 'test' }[D.art]] || '';
    return D;
  }
  const ART_FARBE = { locker: 'green', mittel: 'yellow', schwelle: 'orange', sweetspot: 'orange', hart: 'red', renn: 'pink', test: 'purple', kraft: 'purple' };
  const ART_NAME = { locker: 'locker', mittel: 'zügig', schwelle: 'Schwelle', sweetspot: 'Sweet Spot', hart: 'hart', renn: 'Renntempo', test: 'Test', kraft: 'Kraft' };

  /* =====================================================================
     Zustand, Speichern, Abgleich mit Garmin
     ===================================================================== */
  let P = null, E = null, schritt = 0, woche = null, offen = null, saveT = null, offenSpeichern = false, kontoVon = null;
  function laden() {
    const uid = A().konto().uid || null;
    if (uid !== kontoVon) { kontoVon = uid; offenSpeichern = false; E = null; schritt = 0; woche = null; offen = null; }
    if (offenSpeichern) return; // eigene Änderung ist unterwegs zum Server – nicht mit älterem Stand überschreiben
    const r = A().state.rechner || {}; P = r.plan && r.plan.v === 1 && Array.isArray(r.plan.sporte) ? JSON.parse(JSON.stringify(r.plan)) : null; if (P && !P.erledigt) P.erledigt = {};
  }
  function speichern(sofort) {
    const r = Object.assign({}, A().state.rechner || {}); if (P) r.plan = JSON.parse(JSON.stringify(P)); else delete r.plan;
    A().setRechner(r);
    clearTimeout(saveT); offenSpeichern = true;
    saveT = setTimeout(() => A().api('POST', '/api/rechner', { plan: P ? JSON.parse(JSON.stringify(P)) : null })
      .then(() => { offenSpeichern = false; })
      .catch((e) => { offenSpeichern = false; A().toast('Plan nicht gespeichert: ' + e.message); }), sofort ? 0 : 700);
  }
  const schluessel = (datum, s) => datum + '#' + s.sport + '#' + s.typ + (s.nr ? s.nr : '');
  function garminTag(datum, s) {
    const g = SP[s.sport] && SP[s.sport].garmin; if (!g) return null;
    const B = (rowsOf('belastung') || []).filter((b) => b.date === datum && b.sport === g);
    if (!B.length) return null;
    const m = B.reduce((x, b) => x + (+b.min || 0), 0);
    return m >= Math.min(15, s.min * 0.5) ? m : null;
  }
  function status(datum, s) {
    const k = schluessel(datum, s), manuell = P.erledigt[k];
    const g = garminTag(datum, s);
    if (manuell === 1) return { ok: true, quelle: g ? 'garmin' : 'du', min: g };
    if (manuell === 0) return { ok: false, verpasst: datum < localDate() };
    if (g) return { ok: true, quelle: 'garmin', min: g };
    return { ok: false, verpasst: datum < localDate() };
  }
  let cache = { k: null, PL: null };
  function planJetzt() { if (!P) return null; const k = JSON.stringify([P.sporte, P.ziel, P.haupt, P.rsport, P.rdist, P.rdatum, P.wochen, P.start, P.stunden, P.tage, P.lang, P.niveau, P.aktuell, (athlet().standard || []).length]); if (cache.k !== k) cache = { k, PL: rechnen(P), W: {} }; return cache.PL; }
  function wocheVon(PL, i) { if (!cache.W[i]) cache.W[i] = wocheBauen(PL, i); return cache.W[i]; }
  const wocheIndex = (PL, datum) => { const i = Math.floor((tag(datum) - tag(PL.start)) / (7 * DAY)); return i >= 0 && i < PL.N ? i : null; };

  /* =====================================================================
     Assistent: Sportarten → Ziel → Zeit → Erfahrung
     ===================================================================== */
  function neuerEntwurf() {
    const a = athlet(), Sp = T.sportarten(), sz = (rowsOf('saison') || [])[0];
    const sporte = AUSDAUER.filter((x) => Sp.includes(x)); if (Sp.includes('gym')) sporte.push('kraft'); if (!sporte.length) sporte.push('laufen', 'kraft');
    const akt = aktuellH(), wiss = a.wissen;
    const e = { v: 1, sporte, ziel: 'fit', haupt: sporte.find((x) => AUSDAUER.includes(x)) || null, rsport: null, rdist: null, rdatum: '', rname: '', wochen: 12, start: startMontag(), stunden: akt ? zwischen(Math.round(akt * 1.3 * 2) / 2, 3, 15) : 5, tage: [1, 2, 3, 5, 6], lang: 6, niveau: wiss === 'einsteiger' ? 'einsteiger' : wiss === 'profi' ? 'ambitioniert' : 'fortgeschritten', aktuell: akt, erledigt: {} };
    if (sz && sz.ziel_datum && sz.ziel_tage > 14 && sz.ziel_sport && rennSporte(sporte).includes(sz.ziel_sport)) Object.assign(e, { ziel: 'rennen', rsport: sz.ziel_sport, rdist: sz.ziel_distanz, rdatum: sz.ziel_datum, rname: sz.ziel_name || '' });
    return e;
  }
  function rennSporte(sporte) {
    const E2 = AUSDAUER.filter((s) => sporte.includes(s)), L = [];
    if (E2.length === 3) L.push('tri');
    if (E2.includes('laufen')) L.push('lauf');
    if (E2.includes('rad')) L.push('rad');
    if (E2.includes('schwimmen')) L.push('schwimmen');
    if (E2.includes('laufen') && (E2.includes('rad') || E2.includes('schwimmen'))) L.push('mehr');
    return L;
  }
  const mehrOk = (id, sporte) => (/^du/.test(id) ? sporte.includes('rad') && sporte.includes('laufen') : sporte.includes('schwimmen') && sporte.includes('laufen'));
  const SCHRITTE = ['Was trainierst du?', 'Was ist dein Ziel?', 'Wie viel Zeit hast du?', 'Wie erfahren bist du?'];
  function assistent(box) {
    if (!E) E = P ? JSON.parse(JSON.stringify(P)) : neuerEntwurf();
    const c = el('article', { class: 'tf-card tf-pa' });
    const fort = el('div', { class: 'tf-pa-fort', 'aria-hidden': 'true' }, ...SCHRITTE.map((_, i) => el('i', { class: i <= schritt ? 'an' : '' })));
    c.append(fort, el('div', { class: 'tf-pa-nr', text: 'Schritt ' + (schritt + 1) + ' von 4' }), el('h2', { class: 'tf-pa-h', text: SCHRITTE[schritt] }));
    const inhalt = el('div', { class: 'tf-pa-inhalt' }); c.appendChild(inhalt);
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const neu = () => { const y = window.scrollY; renderPlan(); window.scrollTo(0, y); };
    if (schritt === 0) {
      const ch = el('div', { class: 'tf-chipset' });
      VORLAGEN.forEach(([id, name, L]) => { const on = L.length === E.sporte.length && L.every((x) => E.sporte.includes(x)); const b = el('button', { type: 'button', 'aria-pressed': String(on) }, name); b.addEventListener('click', () => { E.sporte = L.slice(); if (id === 'fit') E.ziel = 'fit'; neu(); }); ch.appendChild(b); });
      inhalt.append(el('p', { class: 'tf-pa-t', text: 'Wähle eine Vorlage oder kombiniere frei – auch nur eine Sportart ist ein guter Plan.' }), ch);
      const grid = el('div', { class: 'tf-pa-sporte' });
      Object.entries(SP).forEach(([id, s]) => {
        const on = E.sporte.includes(id);
        const b = el('button', { type: 'button', class: 'tf-pa-sport', 'aria-pressed': String(on), style: '--c:var(--tf-' + s.farbe + ')' }, el('span', { class: 'tf-pa-sport-i' }, svgIco(s.icon)), el('b', { text: s.name }), el('span', { class: 'tf-pa-haken' }, svgIco('i-check')));
        b.addEventListener('click', () => { E.sporte = on ? E.sporte.filter((x) => x !== id) : E.sporte.concat(id); neu(); });
        grid.appendChild(b);
      });
      inhalt.appendChild(grid);
    }
    if (schritt === 1) {
      const E2 = AUSDAUER.filter((s) => E.sporte.includes(s));
      if (!E2.length) { E.ziel = 'fit'; inhalt.appendChild(el('p', { class: 'tf-pa-t', text: 'Ohne Ausdauersportart wird es ein Plan für Kraft und Beweglichkeit – mit dem Ziel „Fit und gesund“.' })); }
      const zl = el('div', { class: 'tf-pa-ziele' });
      Object.entries(ZIELE).forEach(([id, [name, sub, icon, farbe]]) => {
        if (!E2.length && id !== 'fit') return;
        const b = el('button', { type: 'button', class: 'tf-pa-ziel', 'aria-pressed': String(E.ziel === id), style: '--c:var(--tf-' + farbe + ')' }, el('span', { class: 'tf-pa-sport-i' }, svgIco(icon)), el('span', { class: 'tf-pa-ziel-t' }, el('b', { text: name }), el('small', { text: sub })));
        b.addEventListener('click', () => { E.ziel = id; E.hfix = false; neu(); });
        zl.appendChild(b);
      });
      inhalt.appendChild(zl);
      if (E.ziel === 'rennen') {
        const RS = rennSporte(E.sporte); if (!RS.includes(E.rsport)) { E.rsport = RS[0]; E.rdist = null; }
        const sz = (rowsOf('saison') || [])[0];
        if (sz && sz.ziel_datum && sz.ziel_tage > 7 && RS.includes(sz.ziel_sport) && !(E.rdatum === sz.ziel_datum && E.rdist === sz.ziel_distanz)) {
          const b = el('button', { type: 'button', class: 'tf-pa-a' }, svgIco('i-flag'), el('span', null, el('b', { text: 'Dein A-Rennen übernehmen' }), el('small', { text: sz.ziel_name + ' · ' + sz.ziel_datum_txt + ' · noch ' + sz.ziel_tage + ' Tage' })));
          b.addEventListener('click', () => { Object.assign(E, { rsport: sz.ziel_sport, rdist: sz.ziel_distanz, rdatum: sz.ziel_datum, rname: sz.ziel_name || '', hfix: false }); neu(); });
          inhalt.appendChild(b);
        }
        const sp = el('div', { class: 'tf-chipset' });
        RS.forEach((r) => { const b = el('button', { type: 'button', 'aria-pressed': String(E.rsport === r) }, r === 'mehr' ? 'Duathlon & Co.' : TF_DISTANZEN[r].name); b.addEventListener('click', () => { E.rsport = r; E.rdist = null; neu(); }); sp.appendChild(b); });
        const ds = el('div', { class: 'tf-chipset' });
        Object.entries(TF_DISTANZEN[E.rsport].items).filter(([id]) => E.rsport !== 'mehr' || mehrOk(id, E.sporte)).forEach(([id, it]) => { const b = el('button', { type: 'button', 'aria-pressed': String(E.rdist === id) }, it.name); b.addEventListener('click', () => { E.rdist = id; E.hfix = false; neu(); }); ds.appendChild(b); });
        const dat = el('input', { class: 'tf-input', type: 'date', value: E.rdatum || '', min: plus(localDate(), 7), 'aria-label': 'Renndatum' });
        dat.addEventListener('change', () => { E.rdatum = dat.value; });
        const nm = el('input', { class: 'tf-input', type: 'text', maxlength: 40, value: E.rname || '', placeholder: 'Name (optional), z. B. Ironman Frankfurt', 'aria-label': 'Name des Rennens' });
        nm.addEventListener('input', () => { E.rname = nm.value.slice(0, 40); });
        inhalt.append(el('div', { class: 'tf-field' }, el('span', { text: 'Sportart' }), sp), el('div', { class: 'tf-field' }, el('span', { text: 'Distanz' }), ds), el('div', { class: 'tf-pa-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Renndatum' }), dat), el('label', { class: 'tf-field' }, el('span', { text: 'Name' }), nm)));
      } else if (E.ziel !== 'fit' && E2.length) {
        if (!E2.includes(E.haupt)) E.haupt = E2[0];
        const hs = el('div', { class: 'tf-seg tf-pa-seg' });
        E2.forEach((s) => { const b = el('button', { type: 'button', 'aria-pressed': String(E.haupt === s) }, SP[s].name); b.addEventListener('click', () => { E.haupt = s; neu(); }); hs.appendChild(b); });
        inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', { text: 'Worin vor allem?' }), hs));
      }
      if (E.ziel !== 'rennen') {
        const wl = el('div', { class: 'tf-seg tf-pa-seg' });
        [8, 12, 16].forEach((n) => { const b = el('button', { type: 'button', 'aria-pressed': String(E.wochen === n) }, n + ' Wochen'); b.addEventListener('click', () => { E.wochen = n; neu(); }); wl.appendChild(b); });
        inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', { text: 'Wie lange?' }), wl));
      }
    }
    if (schritt === 2) {
      if (!E.hfix) { // Vorschlag passend zum Ziel – wer weniger Zeit hat, schiebt den Regler nach links
        const k = distKey(E), nv = Math.max(0, NIV.indexOf(E.niveau)), m = MAXH[k || E.ziel];
        if (m) E.stunden = Math.max(E.stunden, Math.round(m[nv] * 0.7 * 2) / 2);
        E.hfix = true;
      }
      const lab = el('b', { class: 'num tf-pa-zahl', text: nf(E.stunden, E.stunden % 1 ? 1 : 0) + ' h' });
      const rg = el('input', { class: 'tf-range', type: 'range', min: 1, max: 20, step: 0.5, value: E.stunden, 'aria-label': 'Stunden pro Woche' });
      const hint = el('small', { class: 'tf-ich-hint' });
      const hinw = () => { const k = distKey(E), cap = MAXH[k || E.ziel] ? MAXH[k || E.ziel][Math.max(0, NIV.indexOf(E.niveau))] : 99; hint.textContent = E.stunden < 2.5 ? 'Die WHO empfiehlt mindestens 2,5 Stunden Bewegung pro Woche – jede Minute zählt.' : k && MINH[k] && E.stunden < MINH[k] ? 'Für ' + tfDistanz(E.rsport, E.rdist).lang + ' wird es mit weniger als ' + MINH[k] + ' h knapp.' : E.stunden > cap ? 'Für dieses Ziel reichen meist ' + cap + ' h – der Plan bleibt darunter.' : 'Gemeint ist die Zeit, die du realistisch jede Woche hast – nicht die beste Woche.'; };
      hinw();
      rg.addEventListener('input', () => { E.stunden = +rg.value; lab.textContent = nf(E.stunden, E.stunden % 1 ? 1 : 0) + ' h'; hinw(); });
      inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', { class: 'tf-pa-zl' }, 'Stunden pro Woche', lab), rg, hint));
      const tg = el('div', { class: 'tf-pa-tage', role: 'group', 'aria-label': 'Trainingstage' });
      WT.forEach((n, d) => { const on = E.tage.includes(d); const b = el('button', { type: 'button', 'aria-pressed': String(on) }, n); b.addEventListener('click', () => { E.tage = on ? E.tage.filter((x) => x !== d) : E.tage.concat(d).sort(); if (!E.tage.includes(E.lang)) E.lang = E.tage.includes(6) ? 6 : E.tage.includes(5) ? 5 : E.tage[E.tage.length - 1]; neu(); }); tg.appendChild(b); });
      inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', { text: 'An welchen Tagen kannst du trainieren? (' + E.tage.length + ')' }), tg, el('small', { class: 'tf-ich-hint', text: E.tage.length >= 7 ? 'Plane trotzdem einen lockeren Tag – der Plan hält manche Tage sehr leicht.' : (7 - E.tage.length) + (7 - E.tage.length === 1 ? ' Ruhetag' : ' Ruhetage') + ' – Erholung gehört zum Training.' })));
      if (E.tage.length && AUSDAUER.some((s) => E.sporte.includes(s))) {
        const lt = el('div', { class: 'tf-seg tf-pa-seg' });
        E.tage.forEach((d) => { const b = el('button', { type: 'button', 'aria-pressed': String(E.lang === d) }, WT[d]); b.addEventListener('click', () => { E.lang = d; neu(); }); lt.appendChild(b); });
        inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', { text: 'Tag für die lange Einheit' }), lt));
      }
      const st = el('input', { class: 'tf-input', type: 'date', value: E.start, 'aria-label': 'Start des Plans' });
      st.addEventListener('change', () => { if (st.value) E.start = montag(st.value); st.value = E.start; });
      inhalt.appendChild(el('label', { class: 'tf-field tf-pa-start' }, el('span', { text: 'Start (immer ein Montag)' }), st));
    }
    if (schritt === 3) {
      const nv = el('div', { class: 'tf-pa-ziele' });
      NIV.forEach((id) => { const [name, sub] = NIV_TXT[id]; const b = el('button', { type: 'button', class: 'tf-pa-ziel', 'aria-pressed': String(E.niveau === id), style: '--c:var(--tf-' + ['green', 'blue', 'purple'][NIV.indexOf(id)] + ')' }, el('span', { class: 'tf-pa-sport-i' }, svgIco(['i-smile', 'i-bolt', 'i-flame'][NIV.indexOf(id)])), el('span', { class: 'tf-pa-ziel-t' }, el('b', { text: name }), el('small', { text: sub }))); b.addEventListener('click', () => { E.niveau = id; neu(); }); nv.appendChild(b); });
      inhalt.appendChild(nv);
      const akt = aktuellH();
      const val = E.aktuell != null ? E.aktuell : akt != null ? akt : 0;
      const lab = el('b', { class: 'num tf-pa-zahl', text: nf(val, val % 1 ? 1 : 0) + ' h' });
      const rg = el('input', { class: 'tf-range', type: 'range', min: 0, max: 20, step: 0.5, value: val, 'aria-label': 'Aktuelle Stunden pro Woche' });
      rg.addEventListener('input', () => { E.aktuell = +rg.value; lab.textContent = nf(E.aktuell, E.aktuell % 1 ? 1 : 0) + ' h'; });
      inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', { class: 'tf-pa-zl' }, 'So viel trainierst du gerade pro Woche', lab), rg, el('small', { class: 'tf-ich-hint', text: akt != null ? 'Aus Garmin: zuletzt im Schnitt ' + nf(akt, 1) + ' h pro Woche. Der Plan startet hier und steigert langsam.' : 'Der Plan startet hier und steigert langsam – ehrlich schätzen schützt vor Verletzungen.' })));
    }
    // Knöpfe
    const zur = el('button', { type: 'button', class: 'tf-btn' }, schritt === 0 ? (P ? 'Abbrechen' : 'Abbrechen') : 'Zurück');
    zur.addEventListener('click', () => { if (schritt === 0) { E = null; if (P) renderPlan(); else T.zurueck(); return; } schritt--; renderPlan(); });
    const vor = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, schritt === 3 ? (P ? 'Plan aktualisieren' : 'Plan erstellen') : 'Weiter');
    vor.addEventListener('click', () => {
      const f = pruefen(); if (f) { setMsg(msg, f, true); return; }
      if (schritt < 3) { schritt++; renderPlan(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const alt = P; P = Object.assign({}, E, { erledigt: (alt && alt.erledigt) || {}, erstellt: (alt && alt.erstellt) || localDate() });
      if (P.ziel !== 'rennen') { P.rsport = P.rsport || null; }
      E = null; schritt = 0; woche = null; cache.k = null;
      speichern(true); renderPlan(); window.scrollTo({ top: 0 });
      A().toast(alt ? 'Plan aktualisiert' : 'Dein Plan ist fertig');
    });
    c.append(msg, el('div', { class: 'tf-form-actions tf-pa-knoepfe' }, zur, vor));
    box.appendChild(c);
  }
  function pruefen() {
    if (schritt === 0 && !E.sporte.length) return 'Wähle mindestens eine Sportart.';
    if (schritt === 1 && E.ziel === 'rennen') {
      if (!E.rsport || !E.rdist) return 'Wähle die Distanz deines Rennens.';
      if (!/^\d{4}-\d\d-\d\d$/.test(E.rdatum || '')) return 'Trag das Datum des Rennens ein.';
      if (E.rdatum < plus(localDate(), 6)) return 'Das Rennen sollte mindestens eine Woche entfernt sein.';
    }
    if (schritt === 2 && !E.tage.length) return 'Wähle mindestens einen Trainingstag.';
    return null;
  }

  /* =====================================================================
     Plan ansehen: Überblick, Woche, Tage, Einheiten
     ===================================================================== */
  function renderPlan() {
    const box = $('#plan-box'); if (!box) return;
    laden();
    if (E || !P) {
      box.replaceChildren();
      if (!P && !E) box.appendChild(intro());
      else assistent(box);
      T.kopf({ sub: P ? 'Plan anpassen' : 'In vier Schritten zu deinem Plan' });
      return;
    }
    const PL = planJetzt(), heuteI = wocheIndex(PL, localDate());
    if (woche == null || woche >= PL.N) woche = heuteI != null ? heuteI : localDate() < PL.start ? 0 : PL.N - 1;
    box.replaceChildren(ueberblick(PL, heuteI), wochenKarte(PL, woche), warumKarte(PL), aktionen());
    const w = PL.W[woche];
    T.kopf({ sub: 'Woche ' + (woche + 1) + ' von ' + PL.N + ' · ' + PHASE[w.phase][0] + (w.leicht ? ' · Entlastung' : '') });
  }
  function intro() {
    const c = el('article', { class: 'tf-card tf-pa-intro' });
    const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-btn-wide' }, 'Plan erstellen');
    b.addEventListener('click', () => { E = neuerEntwurf(); schritt = 0; renderPlan(); });
    const punkte = [['i-tri', 'Jede Kombination', 'Laufen, Rad, Schwimmen, Kraft, Pilates & Yoga – einzeln oder zusammen.'], ['i-flag', 'Auf dein Ziel', 'Vom ersten 5-km-Lauf bis zur Langdistanz – oder einfach fit und gesund.'], ['i-cal', 'Passend zu deiner Woche', 'Deine Tage, deine Stunden, deine lange Einheit.'], ['i-book', 'Nach Studienlage', '80/20-Verteilung, langsame Steigerung, Entlastungswochen, Tapering.']];
    c.append(el('span', { class: 'tf-pa-intro-i' }, svgIco('i-cal')), el('h2', { text: 'Dein Trainingsplan' }), el('p', { class: 'tf-pa-t', text: 'Sag Tagesform, was du trainierst, wofür und wie viel Zeit du hast. Du bekommst jede Woche fertig geplant – mit Erklärung zu jeder Einheit.' }),
      el('ul', { class: 'tf-pa-punkte' }, ...punkte.map(([i, t, s]) => el('li', null, el('span', { class: 'tf-pa-punkt-i' }, svgIco(i)), el('span', null, el('b', { text: t }), el('small', { text: s }))))), b);
    return c;
  }
  function zielTitel(PL) {
    const P2 = PL.P;
    if (PL.rennen) return (P2.rname ? P2.rname + ' · ' : '') + PL.item.lang;
    if (P2.ziel === 'fit') return 'Fit & gesund';
    return ZIELE[P2.ziel][0] + (P2.haupt ? ' · ' + SP[P2.haupt].name : '');
  }
  function ueberblick(PL, heuteI) {
    const P2 = PL.P, c = el('article', { class: 'tf-card tf-pl-hero' });
    const tageBis = PL.rennen ? Math.round((tag(P2.rdatum) - tag(localDate())) / DAY) : null;
    const kopf = el('div', { class: 'tf-pl-kopf' },
      el('div', null, el('div', { class: 'tf-pl-ziel', text: zielTitel(PL) }), el('div', { class: 'tf-pl-meta', text: PL.N + ' Wochen · ' + P2.tage.length + ' Trainingstage · ' + nf(PL.h0, 1) + ' → ' + nf(Math.max(...PL.W.map((w) => w.h)), 1) + ' h pro Woche' })),
      tageBis != null && tageBis >= 0 ? el('div', { class: 'tf-pl-count' }, el('b', { class: 'num', text: tageBis === 0 ? 'Heute' : nf(tageBis) }), el('small', { text: tageBis === 0 ? 'Renntag' : tageBis === 1 ? 'Tag' : 'Tage' })) : null);
    c.appendChild(kopf);
    // Wochenbalken: Höhe = Stunden, Farbe = Phase
    const maxH = Math.max(...PL.W.map((w) => w.h), 1), N = PL.N;
    const bars = el('div', { class: 'tf-pl-bars', role: 'group', 'aria-label': 'Wochen des Plans' });
    PL.W.forEach((w, i) => {
      const b = el('button', { type: 'button', class: 'tf-pl-bar' + (i === woche ? ' an' : '') + (i === heuteI ? ' heute' : '') + (w.leicht ? ' leicht' : ''), 'aria-label': 'Woche ' + (i + 1) + ', ' + PHASE[w.phase][0] + ', ' + nf(w.h, 1) + ' Stunden', style: '--c:var(--tf-' + PHASE[w.phase][1] + ');--h:' + Math.max(8, Math.round((w.h / maxH) * 100)) + '%' }, el('i'));
      b.addEventListener('click', () => { woche = i; offen = null; renderPlan(); });
      bars.appendChild(b);
    });
    if (N > 30) bars.classList.add('eng');
    c.appendChild(bars);
    const ph = [...new Set(PL.W.map((w) => w.phase))];
    c.appendChild(el('div', { class: 'tf-legend tf-pl-leg' }, ...ph.map((p) => { const i = el('i'); i.style.background = col(PHASE[p][1]); return el('span', null, i, PHASE[p][0]); }), el('span', null, el('i', { class: 'tf-pl-leicht-k' }), 'Entlastung')));
    if (localDate() > plus(PL.W[PL.N - 1].start, 6)) c.appendChild(el('p', { class: 'tf-pl-hinweis' }, dot('green'), 'Dein Plan ist abgeschlossen. Gönn dir ein paar lockere Tage – dann geht es mit einem neuen Plan weiter.'));
    else if (localDate() < PL.start) c.appendChild(el('p', { class: 'tf-pl-hinweis' }, dot('blue'), 'Dein Plan startet am ' + WT_LANG[0] + ', ' + dm(PL.start) + '.'));
    PL.hinweise.forEach((h) => c.appendChild(el('p', { class: 'tf-pl-hinweis' }, dot('blue'), h)));
    return c;
  }
  function wochenKarte(PL, i) {
    const w = PL.W[i], { ES } = wocheVon(PL, i), c = el('article', { class: 'tf-card tf-pl-woche', id: 'plan-woche' });
    const alle = ES.flat(), minSum = alle.filter((s) => s.typ !== 'rennen').reduce((x, s) => x + s.min, 0), hartMin = alle.filter((s) => s.hart === 2 && s.typ !== 'rennen').reduce((x, s) => x + (s.lang ? 0 : s.min * 0.35), 0);
    const zur = el('button', { type: 'button', class: 'tf-pl-nav', 'aria-label': 'Woche davor', disabled: i === 0 }, svgIco('i-back'));
    const vor = el('button', { type: 'button', class: 'tf-pl-nav', 'aria-label': 'Woche danach', disabled: i === PL.N - 1 }, svgIco('i-chev'));
    zur.addEventListener('click', () => { woche = Math.max(0, i - 1); offen = null; renderPlan(); });
    vor.addEventListener('click', () => { woche = Math.min(PL.N - 1, i + 1); offen = null; renderPlan(); });
    const bis = plus(w.start, 6);
    c.appendChild(el('div', { class: 'tf-pl-wkopf' }, zur, el('div', { class: 'tf-pl-wt' }, el('b', { text: 'Woche ' + (i + 1) + ' · KW ' + kw(w.start) }), el('small', { text: dm(w.start) + '–' + dm(bis) })), vor));
    // Kennzahlen der Woche
    const erledigt = [], geplant = [];
    ES.forEach((L, d) => { const datum = plus(w.start, d); L.forEach((s) => { if (s.typ === 'rennen') return; if (datum <= localDate()) { geplant.push(s); if (status(datum, s).ok) erledigt.push(s); } }); });
    c.appendChild(el('div', { class: 'tf-chips tf-pl-chips' },
      el('span', { class: 'tf-chip', style: '--c:var(--tf-' + PHASE[w.phase][1] + ')' }, dot(PHASE[w.phase][1]), PHASE[w.phase][0] + (w.leicht ? ' · Entlastung' : '')),
      el('span', { class: 'tf-chip' }, svgIco('i-clock'), dauer(minSum)),
      el('span', { class: 'tf-chip' }, svgIco('i-list'), alle.filter((s) => s.typ !== 'rennen').length + ' Einheiten'),
      minSum ? el('span', { class: 'tf-chip' }, svgIco('i-gauge'), Math.round(100 - (hartMin / minSum) * 100) + ' % locker') : null,
      geplant.length ? el('span', { class: 'tf-chip tf-pl-ok' }, svgIco('i-check'), erledigt.length + ' von ' + geplant.length + ' erledigt') : null));
    c.appendChild(el('p', { class: 'tf-note tf-pl-phase', text: w.leicht ? 'Entlastungswoche: etwa ein Drittel weniger, damit die Anpassung der letzten Wochen ankommt.' : PHASE[w.phase][2] }));
    // Tage
    const H = heute();
    const tageBox = el('div', { class: 'tf-pl-tage' });
    for (let d = 0; d < 7; d++) {
      const datum = plus(w.start, d), L = ES[d], ist = datum === localDate();
      const zeile = el('div', { class: 'tf-pl-tag' + (ist ? ' heute' : '') + (L.length ? '' : ' frei') });
      zeile.appendChild(el('div', { class: 'tf-pl-dat' }, el('small', { text: WT[d] }), el('b', { class: 'num', text: String(+datum.slice(8, 10)) })));
      const rechts = el('div', { class: 'tf-pl-ein' });
      if (!L.length) rechts.appendChild(el('div', { class: 'tf-pl-ruhe', text: PL.rennen && datum > PL.P.rdatum && w.phase === 'rennwoche' ? 'Erholung nach dem Rennen' : 'Ruhetag' }));
      L.forEach((s) => {
        const D = beschreiben(s, PL, w), k = schluessel(datum, s), st = s.typ === 'rennen' ? { ok: false } : status(datum, s), sp = SP[s.sport];
        const knopf = el('button', { type: 'button', class: 'tf-pl-e' + (offen === k ? ' auf' : '') + (st.ok ? ' ok' : st.verpasst ? ' verpasst' : ''), 'aria-expanded': String(offen === k), style: '--c:var(--tf-' + sp.farbe + ')' },
          el('span', { class: 'tf-pl-e-i' }, svgIco(s.typ === 'rennen' ? 'i-flag' : sp.icon)),
          el('span', { class: 'tf-pl-e-t' }, el('b', { text: D.titel }), el('small', null, dauer(s.min), D.km ? ' · ' + nf(D.km / 1000, 1) + ' km' : '', el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + (ART_FARBE[D.art] || 'gray') + ')' }), ART_NAME[D.art] || '')),
          st.ok ? el('span', { class: 'tf-pl-hak' }, svgIco('i-check')) : null);
        knopf.addEventListener('click', () => { offen = offen === k ? null : k; renderPlan(); });
        rechts.appendChild(knopf);
        if (ist && H && s.hart === 2 && s.typ !== 'rennen' && (H.ampel === 'rot' || H.ampel === 'gelb')) rechts.appendChild(el('p', { class: 'tf-pl-tf' }, dot(H.ampel === 'rot' ? 'red' : 'yellow'), H.ampel === 'rot' ? 'Tagesform niedrig: Mach heute 30–45 min locker oder ruh dich aus – die harte Einheit holst du an einem besseren Tag nach.' : 'Tagesform moderat: Die Einheit geht – kürze den harten Teil um etwa ein Drittel.'));
        if (offen === k) rechts.appendChild(detail(s, D, datum, k, st));
      });
      zeile.appendChild(rechts);
      tageBox.appendChild(zeile);
    }
    c.appendChild(tageBox);
    if (H && (H.ampel === 'rot') && i === wocheIndex(PL, localDate())) c.appendChild(el('p', { class: 'tf-note', text: 'Gesteuert nach Tagesform: An Tagen mit niedriger HRV locker zu bleiben, brachte in Studien gleich gute oder bessere Fortschritte als starre Pläne (Kiviniemi et al. 2007; Javaloyes et al. 2019).' }));
    return c;
  }
  function detail(s, D, datum, k, st) {
    const box = el('div', { class: 'tf-pl-d' });
    box.appendChild(el('ol', { class: 'tf-steps tf-pl-bau' }, ...D.bau.map((t) => el('li', { text: t }))));
    if (D.fuehl || D.ziele.length) box.appendChild(el('div', { class: 'tf-pl-ziel-box' }, el('small', { text: 'Zielbereich' }), D.ziele.length ? el('b', { text: D.ziele.join(' · ') }) : null, D.fuehl ? el('span', { text: D.fuehl }) : null));
    if (D.tipp) box.appendChild(el('p', { class: 'tf-pl-tipp' }, svgIco('i-drop'), D.tipp));
    if (D.warum) box.appendChild(el('p', { class: 'tf-pl-warum' }, el('b', { text: 'Warum: ' }), D.warum));
    if (D.quelle) box.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: D.quelle })));
    const akt = el('div', { class: 'tf-form-actions' });
    if (D.link) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, D.link.text); b.addEventListener('click', () => { if (D.link.fn) D.link.fn(); T.geh(D.link.ziel); }); akt.appendChild(b); }
    if (s.typ !== 'rennen') {
      const b = el('button', { type: 'button', class: 'tf-btn' }, st.ok ? 'Nicht erledigt' : 'Als erledigt markieren');
      b.addEventListener('click', () => { P.erledigt[k] = st.ok ? 0 : 1; speichern(); renderPlan(); });
      akt.appendChild(b);
      if (st.ok && st.quelle === 'garmin') box.appendChild(el('p', { class: 'tf-note', text: 'Erledigt laut Garmin: ' + st.min + ' min ' + SP[s.sport].name + ' am ' + dm(datum) + '.' }));
    }
    box.appendChild(akt);
    return box;
  }
  function warumKarte(PL) {
    const c = karte({ farbe: 'gold', icon: 'i-book', titel: 'Warum der Plan so aussieht', sub: 'Die Regeln dahinter – mit Quellen', span2: true });
    const P2 = PL.P, R = [];
    if (PL.E.length) R.push(['Etwa 80 % locker', 'Die meisten Einheiten sind locker, nur wenige hart. So kannst du die harten wirklich hart machen – das Muster der besten Ausdauersportler.', 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014', 'polarisiert']);
    R.push(['Langsam steigern', 'Der Umfang steigt um höchstens etwa 10 % pro Woche, ausgehend von deinem jetzigen Training. Sprünge erhöhen das Verletzungsrisiko – Sehnen und Knochen passen sich langsamer an als Herz und Lunge.', 'Gabbett, Br J Sports Med 2016 · Nielsen et al., J Orthop Sports Phys Ther 2014', 'acwr']);
    R.push(['Entlastung alle ' + (PL.niv === 0 ? '3' : '4') + ' Wochen', 'Eine leichtere Woche lässt die Anpassung ankommen. Stärker wirst du in der Erholung.', 'Issurin, Sports Med 2010', 'entlastungswoche']);
    R.push(['Harte Tage hart, lockere locker', 'Zwischen harten Einheiten liegt mindestens ein lockerer Tag. ' + (P2.sporte.includes('kraft') && PL.E.length ? 'Kraft liegt bevorzugt auf den harten Tagen, damit die lockeren wirklich locker bleiben.' : ''), 'Seiler, IJSPP 2010', 'superkompensation']);
    if (P2.sporte.includes('kraft')) R.push([PL.E.length ? 'Kraft 1–2× pro Woche' : 'Kraft an mehreren Tagen', PL.E.length ? 'Schweres Krafttraining verbessert die Ökonomie und senkt Sportverletzungen deutlich – ohne dich schwerer zu machen.' : 'Jede große Muskelgruppe zweimal pro Woche bringt mehr als einmal.', PL.E.length ? 'Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Lauersen et al., Br J Sports Med 2014' : 'Schoenfeld et al., Sports Med 2016', 'maximalkraft']);
    if (PL.rennen) R.push(['Tapering vor dem Rennen', 'In den letzten Wochen sinkt der Umfang stufenweise um 40–60 %, die Intensität bleibt. So bist du am Renntag frisch und fit zugleich.', 'Bosquet et al., Med Sci Sports Exerc 2007', 'tapering']);
    if (P2.ziel === 'fit') R.push(['Nach WHO-Empfehlung', '150–300 Minuten moderate Bewegung pro Woche und Kraft an zwei Tagen – das schützt Herz, Stoffwechsel und Psyche.', 'Bull et al., Br J Sports Med 2020', 'who']);
    R.push(['Hör auf deine Tagesform', 'Ist deine Tagesform rot, wird aus der harten Einheit eine lockere. HRV-gesteuertes Training brachte in Studien gleich gute oder bessere Ergebnisse.', 'Kiviniemi et al., Eur J Appl Physiol 2007 · Javaloyes et al., IJSPP 2019', 'hrv_korridor']);
    const list = el('div', { class: 'tf-faqs' });
    R.forEach(([t, txt, q, b]) => { const d = el('details', { class: 'tf-faq' }, el('summary', null, el('span', { text: t }), svgIco('i-chev')), el('div', { class: 'tf-faq-a' }, el('p', { text: txt }), el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: q })), window.tfWissen && tfWissen.begriff(b) ? el('div', { class: 'tf-w-chips' }, (() => { const x = el('button', { type: 'button', class: 'tf-w-chip', 'data-begriff-auf': b }, tfWissen.begriff(b).name + ' erklärt'); return x; })()) : null)); list.appendChild(d); });
    c.appendChild(list);
    return c;
  }
  function aktionen() {
    const a1 = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-edit'), ' Plan anpassen');
    a1.addEventListener('click', () => { E = JSON.parse(JSON.stringify(P)); schritt = 0; renderPlan(); window.scrollTo({ top: 0 }); });
    const a2 = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-danger' }, 'Plan löschen');
    let sicher = false;
    a2.addEventListener('click', () => { if (!sicher) { sicher = true; a2.textContent = 'Wirklich löschen?'; setTimeout(() => { sicher = false; a2.textContent = 'Plan löschen'; }, 4000); return; } P = null; E = null; cache.k = null; speichern(true); renderPlan(); A().toast('Plan gelöscht'); });
    return el('div', { class: 'tf-form-actions tf-pl-akt' }, a1, a2);
  }

  /* ---------- Heute: was steht an? ---------- */
  function heuteImPlan() {
    const box = $('#home-plan'); if (!box) return;
    laden();
    if (!P) { box.replaceChildren(); return; }
    const PL = planJetzt(), d0 = localDate(), i = wocheIndex(PL, d0);
    if (i == null) { box.replaceChildren(); return; }
    const w = PL.W[i], L = wocheVon(PL, i).ES[wt(d0)], H = heute();
    const c = el('article', { class: 'tf-card tf-pl-heute', role: 'link', tabindex: '0', 'aria-label': 'Heute im Plan – zum Trainingsplan' });
    const auf = () => { woche = i; T.geh('training/plan'); };
    c.addEventListener('click', auf); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(); } });
    c.appendChild(el('div', { class: 'tf-pl-heute-k' }, el('span', { class: 'tf-badge', style: 'background:var(--tf-blue)' }, svgIco('i-cal')), el('div', null, el('b', { text: 'Heute im Plan' }), el('small', { text: 'Woche ' + (i + 1) + ' von ' + PL.N + ' · ' + PHASE[w.phase][0] + (w.leicht ? ' · Entlastung' : '') })), svgIco('i-chev')));
    if (!L.length) c.appendChild(el('p', { class: 'tf-pl-ruhe', text: 'Ruhetag – Erholung gehört zum Plan.' }));
    L.forEach((s) => {
      const D = beschreiben(s, PL, w), st = s.typ === 'rennen' ? { ok: false } : status(d0, s);
      c.appendChild(el('div', { class: 'tf-pl-e' + (st.ok ? ' ok' : ''), style: '--c:var(--tf-' + SP[s.sport].farbe + ')' }, el('span', { class: 'tf-pl-e-i' }, svgIco(s.typ === 'rennen' ? 'i-flag' : SP[s.sport].icon)), el('span', { class: 'tf-pl-e-t' }, el('b', { text: D.titel }), el('small', null, dauer(s.min), el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + (ART_FARBE[D.art] || 'gray') + ')' }), ART_NAME[D.art] || '')), st.ok ? el('span', { class: 'tf-pl-hak' }, svgIco('i-check')) : null));
      if (H && s.hart === 2 && s.typ !== 'rennen' && (H.ampel === 'rot' || H.ampel === 'gelb')) c.appendChild(el('p', { class: 'tf-pl-tf' }, dot(H.ampel === 'rot' ? 'red' : 'yellow'), H.ampel === 'rot' ? 'Tagesform niedrig – heute lieber locker statt hart.' : 'Tagesform moderat – harten Teil etwas kürzen.'));
    });
    box.replaceChildren(c);
  }

  /* ---------- Kurzinfo für die Training-Übersicht ---------- */
  function kurz() {
    laden(); if (!P) return null;
    const PL = planJetzt(), d0 = localDate(), i = wocheIndex(PL, d0);
    if (i == null) return { wert: d0 < PL.start ? 'Start ' + dm(PL.start) : 'Abgeschlossen', txt: true, sub: zielTitel(PL) };
    const L = wocheVon(PL, i).ES[wt(d0)], w = PL.W[i];
    const heuteTxt = L.length ? 'Heute: ' + L.map((s) => beschreiben(s, PL, w).titel).join(' + ') : 'Heute Ruhetag';
    return { wert: 'Woche ' + (i + 1) + '/' + PL.N, txt: true, sub: heuteTxt };
  }

  /* ---------- Für das Spiel: geplante und erledigte Einheiten je Tag und je Planwoche ---------- */
  function bilanz(heute) {
    laden(); if (!P) return null;
    const PL = planJetzt(), tage = {}, wochen = {};
    for (let i = 0; i < PL.N; i++) {
      const w = wocheVon(PL, i), start = plus(PL.start, 7 * i); if (start > heute) break;
      let g = 0, e = 0;
      w.ES.forEach((L, d) => {
        const datum = plus(start, d), U = L.filter((s) => s.typ !== 'rennen');
        g += U.length;
        if (datum > heute || !U.length) return;
        const ok = U.filter((s) => status(datum, s).ok).length;
        tage[datum] = [U.length, ok]; e += ok;
      });
      wochen[start] = [g, e];
    }
    return { tage, wochen };
  }

  T.seite('plan', renderPlan);
  T.zusatz('heute', heuteImPlan);
  window.tfPlan = { kurz, bilanz, rechnen: (p) => rechnen(p), woche: (p, i) => wocheBauen(rechnen(p), i), beschreiben, oeffneWoche: (i) => { woche = i; } };
})();
