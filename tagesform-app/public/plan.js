/* Dreiklang · Trainingsplan
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
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
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
    andere: { name: 'Andere Sportart', icon: 'i-body', farbe: 'gray', garmin: 'other' }, // Version 15: nur für eigene Einheiten
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
    tri_md: { anteil: { schwimmen: 0.2, rad: 0.48, laufen: 0.32 }, lang: { rad: [150, 210, 270], laufen: [90, 120, 140], schwimmen: [55, 65, 75] }, koppel: 'rad', koppelMin: 25, prio: ['rad', 'laufen'] },
    tri_ld: { anteil: { schwimmen: 0.18, rad: 0.52, laufen: 0.3 }, lang: { rad: [240, 330, 390], laufen: [120, 150, 180], schwimmen: [65, 80, 90] }, koppel: 'rad', koppelMin: 30, prio: ['rad', 'laufen'] }, // Version 24: lange Läufe bis 3 h, Rad bis 6,5 h
    lauf_5k: { lang: { laufen: [50, 70, 80] }, prio: ['laufen'] },
    lauf_10k: { lang: { laufen: [60, 85, 100] }, prio: ['laufen'] },
    lauf_hm: { lang: { laufen: [100, 125, 150] }, prio: ['laufen'] },
    lauf_m: { lang: { laufen: [150, 170, 195] }, prio: ['laufen'] },
    rad_ezf20: { lang: { rad: [90, 120, 150] }, prio: ['rad'] },
    rad_ezf40: { lang: { rad: [105, 150, 180] }, prio: ['rad'] },
    rad_r90: { lang: { rad: [150, 210, 240] }, prio: ['rad'] },
    rad_r180: { lang: { rad: [240, 330, 420] }, prio: ['rad'] },
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
    const zyklus = [3, 4].includes(P.rhythmus) ? P.rhythmus : niv === 0 ? 3 : 4, belastbar = new Set(['vorbereitung', 'grundlage', 'aufbau', 'fit']); // Version 12: Rhythmus wählbar (2:1 oder 3:1)
    let k = 0;
    W.forEach((w, i) => {
      if (!belastbar.has(w.phase)) { k = 0; return; }
      k++;
      const naechste = W[i + 1];
      if (k % zyklus === 0 && naechste && belastbar.has(naechste.phase)) w.leicht = true;
    });
    { let z = 0; W.forEach((w) => { if (w.leicht) { z += 1; w.lz = z; } }); } // Version 12: Nummer der Entlastungswoche (für Tests)
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
    if (P.stunden > cap) hinweise.push('Für dieses Ziel plant Dreiklang bis ' + nf(cap, 0) + ' h pro Woche – mehr Umfang bringt hier wenig zusätzlich. Die übrige Zeit ist gute Erholung.');
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
  // Version 24: lange Einheiten dürfen länger – die Bibliothek erklärt bis 3 h Laufen und 6 h Rad; der Feinschliff setzt eigene Grenzen (P.langMax)
  const LANG_STD = { basis: { laufen: [75, 105, 140], rad: [150, 210, 300], schwimmen: [45, 65, 80] }, schneller: { laufen: [70, 100, 130], rad: [120, 180, 240], schwimmen: [45, 60, 70] }, fit: { laufen: [50, 70, 90], rad: [90, 130, 160], schwimmen: [40, 50, 60] } };
  const LANG_MAX = { laufen: [45, 240], rad: [60, 420], schwimmen: [30, 120] }; // Spanne für „Längste Einheit“ im Feinschliff (min)
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
      const m = Number.isInteger(P.mobilN) ? zwischen(P.mobilN, 0, 4) : !E.length || leicht || ph === 'taper' ? 2 : 1; // Version 12: Anzahl wählbar
      for (let j = 0; j < m; j++) ES.push({ sport: 'mobil', typ: mobilTyp(j, i, P, ph), min: 20, hart: 0, nr: j });
      min -= m * 20;
    }
    // Kraft
    if (P.sporte.includes('kraft')) {
      let k, dk;
      if (!E.length) { // reiner Kraftplan: 2–4 Einheiten à 30–60 min, passend zur Zeit
        k = Number.isInteger(P.kraftN) ? zwischen(P.kraftN, 1, 5) : zwischen(tageN - (P.sporte.includes('mobil') ? 1 : 0), 2, 4); // Version 12: Anzahl wählbar
        while (k > 2 && min / k < 30) k--;
        dk = r5(zwischen(min / k, 25, 60));
      } else {
        const T0 = { vorbereitung: 2, grundlage: 2, aufbau: 1, spitze: 1, taper: 1, rennwoche: 0, test: 1, fit: 2 };
        k = P.ziel === 'fit' ? 2 : (T0[ph] != null ? T0[ph] : 1);
        if (niv === 2 && ph === 'aufbau' && w.h >= 9) k = 2;
        if (Number.isInteger(P.kraftN) && ph !== 'rennwoche') k = zwischen(P.kraftN, 0, 3); // Version 12: deine Wahl, Entlastung und Taper kürzen weiter
        if (leicht) k = Math.min(k, 1);
        if (ph === 'taper' && w.taperIdx > 0) k = 0;
        dk = ph === 'taper' ? 25 : [30, 35, 40][niv];
        if (min - k * dk < 30 * E.length) k = Math.min(k, 1); // Ausdauer geht vor
      }
      for (let j = 0; j < k; j++) ES.push({ sport: 'kraft', typ: kraftTyp(j, k, i, PL, w), min: ph === 'taper' ? Math.min(dk, 25) : dk, hart: 1, nr: j });
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
        const wunsch = P.langMax && Number.isFinite(+P.langMax[x]) ? zwischen(Math.round(+P.langMax[x]), LANG_MAX[x][0], LANG_MAX[x][1]) : null; // Version 24: eigene Obergrenze aus dem Feinschliff
        const cap0 = wunsch || (R && R.lang[x] ? R.lang[x][niv] : (LANG_STD[P.ziel] || LANG_STD.fit)[x][niv]);
        const cap = leicht ? cap0 * 0.7 : ph === 'taper' ? cap0 * (w.taperIdx === 0 ? 0.65 : 0.5) : cap0;
        const langOk = !['rennwoche', 'test'].includes(ph) && (muss(x) || (!haupt.length && x === E[0]));
        let slots = n[x];
        const koppel = x === 'laufen' && koppelOk && slots >= 2 ? r5(Math.min(ms[x] * 0.25, (R.koppelMin || 20) * (niv === 0 ? 0.8 : 1) * (leicht ? 0.7 : 1) * (ph === 'taper' ? 0.7 : 1))) : 0;
        if (koppel) slots--;
        const rest = ms[x] - koppel;
        let lang = 0, je = 0;
        for (;;) {
          if (langOk && slots >= 2) {
            lang = Math.max(MINMIN[x][niv] + 10, Math.min(cap, rest * Math.max(langAnteil(x, PL.key), 1.3 / slots)));
            // Version 24: eine gewünschte Länge bekommt Vorrang – die übrigen Einheiten behalten nur ihr Minimum
            if (wunsch && !['rennwoche', 'test'].includes(ph)) lang = Math.max(lang, Math.min(cap, rest - (slots - 1) * MINMIN[x][niv]));
            je = (rest - lang) / (slots - 1);
          }
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
      variieren(ES, PL, i, w); // Version 24: Abwechslung – Schwester-Einheiten, Technik, Regeneration, lange Einheiten mit Charakter
    }
    // Version 12: Leistungstests – am Ende jeder zweiten Entlastungswoche, ausgeruht (Rad: 20 min, Laufen: 5 km, Schwimmen: CSS)
    if (P.tests && leicht && E.length && ['vorbereitung', 'grundlage', 'aufbau', 'fit'].includes(ph) && (w.lz || 0) % 2 === 1) {
      const hs = (R ? R.prio.find((x) => E.includes(x)) : null) || (E.includes(P.haupt) ? P.haupt : E[0]);
      const t = ES.filter((e) => e.sport === hs && ['locker', 'technik', 'kadenz', 'steiger', 'regeneration', 'lauf_abc', 'beine', 'zugkraft'].includes(e.typ)).pop();
      if (t) { t.typ = 'test'; t.hart = 2; t.q = true; mindestens(ES, t, hs, niv, ph); }
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
  /* ---------- Version 24: Abwechslung ----------
     Dieselbe Phase, aber nicht jede Woche dieselbe Einheit: Harte Einheiten wechseln sich mit ihrer Schwester ab
     (Schwelle ↔ Cruise-Intervalle, VO2max ↔ Hügel, Sweet Spot ↔ Kraftausdauer am Berg …), lockere Einheiten bekommen
     Technik oder Regeneration, lange Einheiten einen Charakter (Rennblöcke, schnelles Ende, hügelig). Alles ist aus
     Wochennummer und Woche-in-Phase abgeleitet, damit der Plan beim Neuzeichnen stabil bleibt. */
  const V_ALT = {
    laufen: { schwelle: 'cruise', vo2: 'huegel', renntempo: 'tempowechsel', fahrtspiel: 'progressiv' },
    rad: { sweetspot: 'berg', schwelle: 'ueber_unter', vo2: 'sprint', renntempo: 'aero', kadenz_q: 'tempo' },
    schwimmen: { css: 'pyramide', sprint: 'tempowechsel' },
  };
  function variieren(ES, PL, i, w) {
    const ph = w.phase, wp = w.wp || 0, niv = PL.niv, k = PL.key || '', leicht = !!w.leicht;
    if (['rennwoche', 'test', 'taper'].includes(ph)) return;
    const lang = /hm|_m$|md|ld|r90|r180|ow|swimrun|du_std/.test(k), tri = /^tri_|du_|swimrun|aqua/.test(k), zeitfahren = tri || /ezf|r90|r180/.test(k);
    // harte Einheiten: in ungeraden Phasenwochen die Schwester, die zweite harte Einheit alle drei Wochen
    ES.filter((e) => e.q && !e.lang && e.typ !== 'test' && e.typ !== 'opener').forEach((e, n) => {
      const alt = (V_ALT[e.sport] || {})[e.typ]; if (!alt) return;
      if (alt === 'aero' && !zeitfahren) return;
      if (alt === 'sprint') { if (wp % 3 === 2 && !leicht) e.typ = alt; return; } // Antritte nur jede dritte Woche
      if (wp % 2 === 1 || (n > 0 && wp % 3 === 0)) e.typ = alt;
    });
    if (ph === 'spitze' && tri) ES.filter((e) => e.sport === 'schwimmen' && e.q && !e.lang && e.typ !== 'test').forEach((e) => { if (wp % 2 === 1) e.typ = 'rennsim'; });
    // lange Einheiten mit Charakter
    ES.filter((e) => e.lang).forEach((e) => {
      if (e.sport === 'laufen') {
        if (['aufbau', 'spitze'].includes(ph) && lang && !leicht) e.typ = wp % 3 === 1 ? 'lang_renn' : wp % 3 === 2 ? 'lang' : 'lang_progressiv';
        else if (ph === 'grundlage' && niv > 0 && wp % 3 === 2 && !leicht) e.typ = 'lang_progressiv';
      }
      if (e.sport === 'rad') {
        if (['aufbau', 'spitze'].includes(ph) && lang && !leicht) e.typ = wp % 3 === 1 ? 'lang_renn' : wp % 3 === 2 ? 'lang_berg' : 'lang';
        else if (['grundlage', 'vorbereitung'].includes(ph) && niv > 0 && wp % 2 === 1 && !leicht) e.typ = 'lang_berg';
      }
    });
    // lockere Einheiten: Technik, Regeneration, ab und zu ein Progressionslauf oder Tempo
    const hatLang = ES.some((x) => x.lang), qN = (sp) => ES.filter((x) => x.q && x.sport === sp).length;
    ES.filter((e) => e.sport === 'laufen' && e.typ === 'locker').forEach((e, j) => {
      const r = (i + j) % 4;
      if (r === 1 && (niv > 0 || i >= 4) && e.min >= 35) e.typ = 'lauf_abc';
      else if (r === 2 && e.min <= 45 && (hatLang || qN('laufen') >= 2)) e.typ = 'regeneration';
      else if (r === 3 && niv > 0 && e.min >= 50 && !leicht && qN('laufen') < 2 && ['grundlage', 'aufbau'].includes(ph)) { e.typ = 'progressiv'; e.hart = 1; }
    });
    ES.filter((e) => e.sport === 'rad' && e.typ === 'locker').forEach((e, j) => {
      const r = (i + j) % 3;
      if (r === 1 && e.min <= 60 && hatLang) e.typ = 'regeneration';
      else if (r === 2 && niv > 0 && e.min >= 60 && !leicht && qN('rad') < 2 && ['grundlage', 'aufbau'].includes(ph)) { e.typ = 'tempo'; e.hart = 1; }
    });
    ES.filter((e) => e.sport === 'schwimmen' && ['technik', 'ausdauer'].includes(e.typ)).forEach((e, j) => {
      if (e.typ === 'ausdauer') { if (tri && ['aufbau', 'spitze'].includes(ph) && wp % 2 === 1) e.typ = 'freiwasser'; return; }
      const r = (i + j) % 4;
      if (r === 1 && niv > 0) { e.typ = 'zugkraft'; e.hart = 1; } else if (r === 2) e.typ = 'beine';
    });
  }
  // Kraft: Ganzkörper als Basis, dazu passend zur Sportart (Läufer, Schwimmer, Radfahrer), Rumpf alle drei Wochen,
  // explosiv in der Spitze, kurzer Erhalt im Taper
  function kraftTyp(j, k, i, PL, w) {
    const P = PL.P, E = PL.E, ph = w.phase;
    if (!E.length) return k >= 4 ? (j % 2 ? 'kraft_unten' : 'kraft_oben') : j % 3 === 2 ? 'kraft_rumpf' : (i + j) % 2 ? 'kraft_unten' : 'kraft_ganz';
    if (ph === 'taper') return 'kraft_erhalt';
    const haupt = (PL.key && RENN[PL.key] ? RENN[PL.key].prio[0] : P.haupt) || E[0];
    const spez = haupt === 'laufen' || E.length === 1 && E[0] === 'laufen' ? 'kraft_lauf' : haupt === 'rad' ? 'kraft_rad' : haupt === 'schwimmen' ? 'kraft_schwimm' : 'kraft_lauf';
    const erste = ph === 'spitze' && PL.niv > 0 && !w.leicht ? 'kraft_explosiv' : i % 3 === 2 ? spez : 'kraft_ganz';
    if (j === 0) return erste;
    if (j === 1) return i % 3 === 1 ? 'kraft_rumpf' : erste === spez ? (E.includes('schwimmen') && spez !== 'kraft_schwimm' ? 'kraft_schwimm' : 'kraft_ganz') : spez;
    return j === 2 && i % 3 !== 1 ? 'kraft_rumpf' : 'kraft_oben';
  }
  // Pilates & Yoga: Rumpf und Hüfte als Basis, dazu Schultern (Schwimmen), Gleichgewicht (Laufen), Rücken, Abend
  function mobilTyp(j, i, P, ph) {
    const pool = ['mobil_yoga', 'mobil_pilates', 'mobil_abend', 'mobil_ruecken'];
    if (P.sporte.includes('schwimmen')) pool.push('mobil_schulter');
    if (P.sporte.includes('laufen')) pool.push('mobil_balance');
    if (['taper', 'rennwoche'].includes(ph)) return j % 2 ? 'mobil_abend' : 'mobil_yoga';
    return pool[(i + j * 2) % pool.length];
  }
  function qualTyp(s, ph, nr, PL) { // Version 12: Modell wählbar – mehr Schwelle (pyramidal) oder mehr Spitze (polarisiert)
    const t = qualTypBasis(s, ph, nr, PL), m = PL.P.modell;
    if (m === 'pyr' && t === 'vo2') return s === 'rad' && nr > 0 ? 'sweetspot' : 'schwelle';
    if (m === 'pol' && ['aufbau', 'spitze'].includes(ph) && (t === 'schwelle' || t === 'sweetspot')) return 'vo2';
    return t;
  }
  function qualTypBasis(s, ph, nr, PL) {
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
  const kraftZiel = (w, PL) => (w.phase === 'taper' || w.phase === 'rennwoche' ? 'stabil' : !PL.E.length ? 'aufbau' : w.phase === 'spitze' ? 'power' : w.phase === 'aufbau' ? 'kraft' : PL.niv === 0 ? 'aufbau' : PL.P.ziel === 'fit' ? 'aufbau' : 'kraft');
  /* Version 13: geschätzte Last einer geplanten Einheit – TSS, davon Beine (Stützapparat) und Kreislauf */
  function lastVon(s, w, PL) {
    const M = window.tfAlltagMotor; if (!M || !M.einheitLast || !s) return { tss: 0, bein: 0, kreis: 0 };
    const o = {};
    if (s.eigen) { // Version 15: feste Intensität statt Plan-Typ
      const x = s.eigen;
      if (s.sport === 'kraft') Object.assign(o, { tssH: EIGEN_KRAFT[x.art], kraftZiel: { locker: 'stabil', mittel: 'aufbau', hart: 'kraft' }[x.art] });
      else if (s.sport !== 'mobil') o.if = EIGEN_IF[x.art];
      if (s.sport === 'andere') o.beinAnteil = eigenBein(x.name);
      return M.einheitLast(s, o);
    }
    if (s.sport === 'kraft') o.kraftZiel = kraftZiel(w, PL);
    if (s.typ === 'lang') o.spez = ['aufbau', 'spitze'].includes(w.phase) && !!PL.key && /hm|_m$|md|ld|r90|r180/.test(PL.key);
    if (s.typ === 'rennen') { const R = RENN[PL.key]; o.beinAnteil = R && R.anteil ? (R.anteil.laufen || 0) + 0.15 * (R.anteil.rad || 0) : s.sport === 'laufen' ? 1 : s.sport === 'rad' ? 0.15 : 0; }
    return M.einheitLast(s, o);
  }
  /* ---------- Version 15: eigene Einheiten ----------
     Spontan oder geplant: Du trägst eine Einheit selbst in den Plan ein – auch Sportarten, die der Plan nicht kennt.
     Sie zählt in der Woche (Zeit, Einheiten, erledigt), in der geplanten Last (Beine/Kreislauf, Formprognose) und –
     als erledigt markiert und ohne Uhr aufgezeichnet – mit einer geschätzten TSS in Fitness, Ermüdung und Form.
     Ist sie hart, wird eine harte Plan-Einheit direkt davor oder danach locker: harte Tage hart, lockere locker. */
  const EIGEN_MAX = 60, EIGEN_ART = ['locker', 'mittel', 'hart'], EIGEN_SPORT = ['laufen', 'rad', 'schwimmen', 'kraft', 'mobil', 'andere'];
  const EIGEN_IF = { locker: 0.65, mittel: 0.78, hart: 0.88 }, EIGEN_KRAFT = { locker: 30, mittel: 45, hart: 60 };
  const EIGEN_MIN = { laufen: 45, rad: 60, schwimmen: 45, kraft: 45, mobil: 30, andere: 60 };
  const EIGEN_ANDERE = ['Wandern', 'Fußball', 'Tennis', 'Klettern', 'Rudern', 'Ski', 'Spazieren'];
  const EIGEN_TYP = { ganz: 'kraft_ganz', unten: 'kraft_unten', oben: 'kraft_oben' };
  const EIGEN_TITEL = {
    laufen: { locker: 'Lockerer Lauf', mittel: 'Zügiger Lauf', hart: 'Harter Lauf' },
    rad: { locker: 'Lockere Ausfahrt', mittel: 'Zügige Ausfahrt', hart: 'Harte Ausfahrt' },
    schwimmen: { locker: 'Lockeres Schwimmen', mittel: 'Zügiges Schwimmen', hart: 'Hartes Schwimmen' },
  };
  const eigenIcon = (x) => {
    if (x.sport !== 'andere') return SP[x.sport].icon;
    const n = (x.name || '').toLowerCase();
    return /wander|berg|kletter|boulder|ski|langlauf|trail/.test(n) ? 'i-mountain' : /ruder|kajak|kanu|sup/.test(n) ? 'i-rower' : /spazier|geh|walk/.test(n) ? 'i-walk' : /seil/.test(n) ? 'i-rope' : 'i-body';
  };
  const eigenBein = (name) => { // Anteil der Last auf Beinen und Stützapparat für andere Sportarten (grob)
    const n = (name || '').toLowerCase();
    return /fu(ß|ss)ball|tennis|padel|squash|basket|handball|volley|badminton|wander|berg|trail|ski|langlauf|seil|tanz/.test(n) ? 0.7 : /spazier|geh|walk/.test(n) ? 0.4 : /kletter|boulder|ruder|kajak|kanu|sup/.test(n) ? 0.2 : 0.5;
  };
  const eigenId = () => { let x = ''; while (x.length < 8) x += Math.random().toString(36).slice(2); return x.slice(0, 8); };
  function eigenSauber(L) { // nur gültige Einträge, nach Datum, höchstens 60 (die neuesten)
    return (Array.isArray(L) ? L : []).filter((x) => x && typeof x.id === 'string' && /^[a-z0-9]{4,12}$/.test(x.id) && /^\d{4}-\d\d-\d\d$/.test(x.d || '') && EIGEN_SPORT.includes(x.sport) && EIGEN_ART.includes(x.art) && Number.isFinite(+x.min) && +x.min >= 5 && +x.min <= 600)
      .map((x) => {
        const y = { id: x.id, d: x.d, sport: x.sport, art: x.art, min: Math.round(+x.min) };
        if (typeof x.name === 'string' && x.name.trim()) y.name = x.name.trim().replace(/\s+/g, ' ').slice(0, 40);
        if (['ganz', 'unten', 'oben', 'pilates', 'yoga'].includes(x.schwer)) y.schwer = x.schwer;
        if (x.f === 1 || x.f === 0) y.f = x.f;
        return y;
      })
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)).slice(-EIGEN_MAX);
  }
  function eigenEinheit(x, d) { // als Einheit im Plan – mit eigenem Schlüssel (nr), damit Haken und Details zu ihr gehören
    return { sport: x.sport, typ: x.sport === 'kraft' ? EIGEN_TYP[x.schwer] || 'kraft_ganz' : x.sport === 'mobil' ? (x.schwer === 'yoga' ? 'mobil_yoga' : 'mobil') : 'eigen', min: x.min, hart: x.art === 'hart' ? 2 : x.art === 'mittel' ? 1 : 0, lang: AUSDAUER.includes(x.sport) && x.min >= 120, q: false, tag: d, nr: ':' + x.id, eigen: x };
  }
  function eigenBeschreiben(s, PL) {
    const x = s.eigen, art = x.art, tempo = { locker: 'locker', mittel: 'zügig', hart: 'hart' }[art];
    const D = { titel: '', art: s.sport === 'kraft' ? 'kraft' : art, bau: [], warum: 'Deine eigene Einheit. Sie zählt in deiner Woche, in der Belastung und in den Prognosen mit' + (art === 'hart' ? ' – und weil sie hart ist, wird eine harte Plan-Einheit direkt davor oder danach locker.' : '.'), quelle: '', tipp: '', link: null, eigen: true };
    if (s.sport === 'kraft') {
      const vor = x.schwer === 'unten' ? 'beine' : x.schwer === 'oben' ? 'oben' : 'ganz', ziel = art === 'hart' ? 'kraft' : art === 'mittel' ? 'aufbau' : 'stabil';
      Object.assign(D, { titel: x.name || { ganz: 'Gym: Ganzkörper', unten: 'Gym: Beine', oben: 'Gym: Oberkörper' }[x.schwer || 'ganz'], bau: [x.min + ' min Kraft – ' + { locker: 'leicht, mit viel Reserve', mittel: 'mit 2–3 Wiederholungen Reserve', hart: 'schwer, 1–2 Wiederholungen Reserve' }[art]],
        link: { ziel: 'training/gym/workout', text: 'Workout öffnen', fn: () => window.tfGym && tfGym.vorlage && tfGym.vorlage({ vorlage: vor, ziel, dauer: x.min }) } });
    } else if (s.sport === 'mobil') {
      const yoga = x.schwer === 'yoga';
      Object.assign(D, { titel: x.name || (yoga ? 'Yoga' : 'Pilates'), bau: [x.min + ' min ruhig und kontrolliert'], link: { ziel: 'training/flow/einheit', text: 'Einheit öffnen', fn: () => window.tfFlow && tfFlow.vorlage && tfFlow.vorlage({ stil: yoga ? 'yoga' : 'pilates', fokus: yoga ? 'huefte' : 'rumpf', dauer: x.min }) } });
    } else Object.assign(D, { titel: x.name || (s.sport === 'andere' ? 'Eigene Einheit' : EIGEN_TITEL[s.sport][art]), bau: [x.min + ' min ' + tempo] });
    D.ziele = AUSDAUER.includes(s.sport) ? ziele(s.sport, art, PL) : [];
    D.fuehl = s.sport === 'kraft' || s.sport === 'mobil' ? '' : FUEHL[art] || '';
    return D;
  }
  function beschreiben(s, PL, w) {
    if (s.eigen) return eigenBeschreiben(s, PL);
    const P = PL.P, a = athlet(), m = s.min, kh = a.kh_g_h_min && a.kh_g_h_max ? a.kh_g_h_min + '–' + a.kh_g_h_max : '60–90';
    // Version 24: Verpflegung beim langen Lauf nach Dauer gestaffelt (Jeukendrup, Sports Med 2014) – lange Läufe gehen jetzt bis 4 h
    const khLauf = (min) => (min >= 150 ? 'Ab 2,5 Stunden: 60–90 g Kohlenhydrate pro Stunde, Glukose und Fruktose gemischt – den Magen im Training daran gewöhnen und Trinken üben.' : min >= 120 ? 'Bei 2–3 Stunden: 30–60 g Kohlenhydrate pro Stunde mitnehmen und Trinken üben.' : min >= 75 ? 'Ab etwa 75 min: bis 30 g Kohlenhydrate pro Stunde mitnehmen und Trinken üben.' : '');
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
      if (s.typ === 'lang') { const spez = ['aufbau', 'spitze'].includes(w.phase) && PL.key && /hm|_m$|md|ld/.test(PL.key); Object.assign(D, { titel: 'Langer Lauf', bau: spez ? [(m - 25) + ' min locker', 'die letzten 20–25 min im Renntempo, dann 5 min austraben'] : [m + ' min gleichmäßig locker – bergauf ruhig langsamer'], warum: 'Macht Muskeln, Sehnen und Stoffwechsel fit für die lange Dauer. Die Länge steigt langsam, damit dein Körper mitkommt.', tipp: khLauf(m), quelle: 'Jeukendrup, Sports Med 2014' }); }
      if (s.typ === 'koppel') Object.assign(D, { titel: 'Koppellauf', art: ['aufbau', 'spitze'].includes(w.phase) ? 'renn' : 'locker', bau: ['Direkt nach dem ' + (s.nach === 'schwimmen' ? 'Schwimmen' : 'Rad') + ' loslaufen – Wechsel üben', m + ' min ' + (['aufbau', 'spitze'].includes(w.phase) ? 'davon die Hälfte im Renntempo' : 'locker') + ', die ersten Minuten mit kurzen, schnellen Schritten'], warum: 'Gewöhnt deine Beine an das Laufen nach dem Radfahren – das „Gummibein“-Gefühl wird mit jeder Koppeleinheit kleiner.' });
      if (s.typ === 'opener') Object.assign(D, { titel: 'Kurz & locker', bau: [Math.max(15, m - 8) + ' min locker', '4 × 15 s zügig, dazwischen voll erholen'], warum: 'Hält die Beine wach, ohne zu ermüden – genau richtig für die Rennwoche.' });
      if (s.typ === 'test') Object.assign(D, { titel: P.ziel === 'schneller' ? '5-km-Test' : 'Test', art: 'test', bau: ['15 min einlaufen mit 3 Steigerungen', '5 km so schnell, wie du sie gleichmäßig schaffst – erster Kilometer bewusst kontrolliert', '10 min auslaufen'], warum: 'Zeigt, was du in den letzten Wochen gewonnen hast – und gibt dir neue Werte fürs Training.' });
      // Version 24: mehr Abwechslung
      if (s.typ === 'regeneration') Object.assign(D, { titel: 'Regenerationslauf', bau: [m + ' min sehr locker – deutlich langsamer als dein lockeres Tempo, Puls weit unter der ersten Schwelle'], warum: 'Bringt Blut in müde Beine, ohne neuen Reiz zu setzen. Am Tag nach einer harten oder langen Einheit ist das der beste Lauf – kurz, flach, entspannt.', quelle: 'Seiler, IJSPP 2010 · Dupuy et al., Front Physiol 2018' });
      if (s.typ === 'lauf_abc') Object.assign(D, { titel: 'Lauftechnik & Steigerungen', bau: [Math.max(10, m - 18) + ' min locker', '8 min Lauf-ABC: Skipping, Anfersen, Kniehebelauf, Hopserlauf – je 2 × 20 m, locker zurückgehen', '5 × 20 s Steigerung bis fast zum Sprint, dazwischen 60–90 s gehen', '5 min austraben'], warum: 'Lauf-ABC und Steigerungen schulen Fußaufsatz, Frequenz und Abdruck – eine ökonomischere Technik spart bei jedem Kilometer Energie.', quelle: 'Moore, Sports Med 2016 · Barnes & Kilding, Sports Med 2015' });
      if (s.typ === 'progressiv') { const a3 = r5(m * 0.4), b3 = r5(m * 0.3), c3 = Math.max(5, m - a3 - b3 - 5); Object.assign(D, { titel: 'Progressionslauf', art: 'mittel', bau: [a3 + ' min locker', b3 + ' min zügig', c3 + ' min knapp unter der Schwelle – gleichmäßig schneller, nie sprinten', '5 min auslaufen'], warum: 'Von locker zu zügig zu fast hart: Du lernst, auf müden Beinen das Tempo zu steigern – wie in der zweiten Rennhälfte. Der harte Teil bleibt kurz, der Reiz ist groß.', quelle: 'Esteve-Lanao et al., J Strength Cond Res 2007' }); }
      if (s.typ === 'huegel') { const v = stufe(['6 × 1 min', '8 × 1 min', '8 × 1,5 min', '10 × 1,5 min', '6 × 2 min'], w); Object.assign(D, { titel: 'Hügelläufe', art: 'hart', bau: [ein + ' min einlaufen zum Hügel', v + ' bergauf kräftig (5–8 %), dazwischen 2 min locker bergab traben', aus + ' min auslaufen'], warum: 'Bergauf arbeitest du hart bei kleiner Aufprallkraft – das kräftigt Beine und Sehnen, verbessert die Laufökonomie und schont dabei die Schienbeine.', quelle: 'Barnes et al., IJSPP 2013 · Barnes & Kilding, Sports Med 2015' }); }
      if (s.typ === 'cruise') { const v = stufe(['5 × 4 min', '6 × 4 min', '6 × 5 min', '8 × 4 min', '5 × 6 min'], w); Object.assign(D, { titel: 'Cruise-Intervalle', art: 'schwelle', bau: [ein + ' min einlaufen', v + ' an der Schwelle, dazwischen 1 min traben', aus + ' min auslaufen'], warum: 'Kurze Pausen, viel Zeit an der Schwelle: Du sammelst mehr Minuten im richtigen Tempo als am Stück – bei weniger Ermüdung.', quelle: 'Daniels, Daniels’ Running Formula 2014 · Seiler, IJSPP 2010' }); }
      if (s.typ === 'tempowechsel') { const v = stufe(['6 × 3 min', '7 × 3 min', '8 × 3 min', '6 × 4 min'], w); Object.assign(D, { titel: 'Wechseltempo', art: 'renn', bau: [ein + ' min einlaufen', v + ' im Renntempo, dazwischen 2 min locker – ohne stehen zu bleiben', aus + ' min auslaufen'], warum: 'Renntempo und locker im Wechsel, ohne Pause: Dein Körper lernt, Laktat im Laufen abzubauen – und das Renntempo fühlt sich mit jedem Block vertrauter an.', quelle: 'Seiler, IJSPP 2010' }); }
      if (s.typ === 'lang_renn') { const b = stufe(['2 × 15 min', '2 × 20 min', '3 × 15 min', '2 × 25 min'], w), v = r5(m * 0.3); Object.assign(D, { titel: 'Langer Lauf mit Rennblöcken', art: 'renn', bau: [v + ' min locker', b + ' im Renntempo, dazwischen 10 min locker', 'Rest locker, 5 min austraben'], warum: 'Renntempo auf schon müden Beinen – genau das verlangt die zweite Hälfte deines Rennens. Die Blöcke sind kurz genug, um sauber zu bleiben.', tipp: 'Verpflegung wie im Rennen üben: ' + (m >= 90 ? '60–90 g Kohlenhydrate pro Stunde' : '30–60 g Kohlenhydrate pro Stunde') + ', trinken nach Durst.', quelle: 'Jeukendrup, Sports Med 2014' }); }
      if (s.typ === 'lang_progressiv') { const e = Math.min(30, Math.max(15, r5(m * 0.2))); Object.assign(D, { titel: 'Langer Lauf, schnelles Ende', bau: [(m - e - 5) + ' min locker', 'die letzten ' + e + ' min im Renntempo, dann 5 min austraben'], warum: 'Lange locker, am Ende schnell: Das schnelle Ende trainiert, mit leeren Speichern das Tempo zu halten – ohne die ganze Einheit hart zu machen.', tipp: khLauf(m), quelle: 'Jeukendrup, Sports Med 2014 · Esteve-Lanao et al., J Strength Cond Res 2007' }); }
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
      // Version 24: mehr Abwechslung
      if (s.typ === 'regeneration') Object.assign(D, { titel: 'Regenerationsfahrt', bau: [m + ' min ganz locker, kleiner Gang, Trittfrequenz 90+ – flach, ohne Antritte'], warum: 'Lockeres Kurbeln bringt Blut in die Beine und hilft nach harten Tagen schneller zu erholen – mehr als Stillsitzen, ohne neue Ermüdung.', quelle: 'Dupuy et al., Front Physiol 2018 · Seiler, IJSPP 2010' });
      if (s.typ === 'tempo') { const v = stufe(['2 × 20 min', '2 × 25 min', '3 × 20 min', '60 min am Stück'], w); Object.assign(D, { titel: 'Tempo-Ausfahrt', art: 'mittel', bau: [ein + ' min einfahren', v + ' zügig bei 76–87 % FTP, dazwischen 5 min locker – gleichmäßig, ohne Spitzen', aus + ' min ausfahren'], warum: 'Zügig, aber nicht hart: Tempo-Blöcke heben die Dauerleistung und sind am nächsten Tag kaum zu spüren – ideal für Grundlage und lange Rennen.', quelle: 'Seiler, IJSPP 2010 · Allen & Coggan 2010' }); }
      if (s.typ === 'berg') { const v = stufe(['4 × 5 min', '4 × 6 min', '5 × 6 min', '4 × 8 min', '3 × 10 min'], w); Object.assign(D, { titel: 'Kraftausdauer am Berg', art: 'sweetspot', bau: [ein + ' min einfahren', v + ' bergauf oder mit schwerem Gang bei 55–65 U/min im Sweet Spot – im Sitzen, ruhiger Oberkörper, dazwischen 4 min locker', aus + ' min ausfahren'], warum: 'Schwerer Gang bei niedriger Trittfrequenz fordert die Muskeln wie Krafttraining, bleibt aber Ausdauer – gut für lange Anstiege und für Kraft im Sattel.', quelle: 'Paton & Hopkins, J Strength Cond Res 2005 · Rønnestad & Mujika, Scand J Med Sci Sports 2014' }); }
      if (s.typ === 'ueber_unter') { const v = stufe(['3 × 8 min', '3 × 10 min', '4 × 10 min', '3 × 12 min'], w); Object.assign(D, { titel: 'Over-Under', art: 'schwelle', bau: [ein + ' min einfahren', v + ' im Wechsel: 2 min knapp über der Schwelle, 2 min knapp darunter – dazwischen 5 min locker', aus + ' min ausfahren'], warum: 'Über und unter der Schwelle im Wechsel: Dein Körper lernt, Laktat bei hoher Leistung abzubauen – wie beim Anstieg mitten im Rennen.', quelle: 'Seiler et al., Scand J Med Sci Sports 2013 · Laursen & Jenkins, Sports Med 2002' }); }
      if (s.typ === 'aero') { const v = stufe(['3 × 12 min', '3 × 15 min', '4 × 15 min', '2 × 25 min', '3 × 20 min'], w); Object.assign(D, { titel: 'Aero-Blöcke', art: 'mittel', bau: [ein + ' min einfahren', v + ' in der Aero-Position bei 80–85 % FTP – Kopf tief, Schultern schmal, dazwischen 4 min locker aufrecht', aus + ' min ausfahren'], warum: 'Auf dem Zeitfahrrad entscheidet der Luftwiderstand über dein Tempo. Die Position zu halten ist Training für Nacken, Rücken und Hüfte – jedes Watt, das sie spart, ist billiger als jedes, das du zusätzlich trittst.', quelle: 'Faria et al., Sports Med 2005' }); }
      if (s.typ === 'sprint') Object.assign(D, { titel: 'Antritte', art: 'hart', bau: [ein + ' min einfahren', '8 × 20 s voll aus dem Rollen, dazwischen 3 min locker', aus + ' min ausfahren'], warum: 'Kurze, volle Antritte wecken Nerven und schnelle Muskelfasern – mehr Spitzenleistung für Anstiege, Wendepunkte und das Ende des Rennens.', quelle: 'Paton & Hopkins, J Strength Cond Res 2005' });
      if (s.typ === 'lang_renn') { const b = /ld|r180/.test(PL.key || '') ? stufe(['2 × 25 min', '3 × 20 min', '2 × 40 min', '3 × 30 min'], w) : stufe(['2 × 15 min', '3 × 15 min', '2 × 25 min', '3 × 20 min'], w), v = r5(m * 0.3); Object.assign(D, { titel: 'Lange Ausfahrt mit Rennblöcken', art: 'renn', bau: [v + ' min locker', b + ' im Renntempo, dazwischen 10 min locker – in der Rennposition', 'Rest locker – Verpflegung wie im Rennen'], warum: 'Renntempo mitten in einer langen Fahrt: So fühlt sich die zweite Rennhälfte an. Hier übst du Leistung, Position und Verpflegung zusammen.', tipp: 'Kohlenhydrate: ' + kh + ' g pro Stunde, ab der ersten halben Stunde regelmäßig. Trinken nach Durst und Schweiß.', quelle: 'Jeukendrup, Sports Med 2014 · Jeukendrup, Sports Med 2017' }); }
      if (s.typ === 'lang_berg') Object.assign(D, { titel: 'Lange Ausfahrt, hügelig', bau: [m + ' min mit Anstiegen – bergauf ruhig im Sweet Spot, bergab rollen, auf der Ebene locker'], warum: 'Hügel bringen Kraft und Abwechslung in die lange Fahrt, ohne dass du bewusst hart fährst. Wichtig: bergauf nicht überziehen – das kostet den Rest des Tages.', tipp: m >= 90 ? 'Kohlenhydrate: ' + kh + ' g pro Stunde – bergauf trinken ist schwer, deshalb oben und in der Ebene nachholen.' : '', quelle: 'Jeukendrup, Sports Med 2014 · Seiler, IJSPP 2010' });
    }
    if (s.sport === 'schwimmen') {
      const c = a.css_s_100m || 120, gesamt = Math.round(((m * 60) / (c + 18)) * 100 / 100) * 100, haupt = Math.max(300, gesamt - 900);
      if (s.typ === 'technik' || s.typ === 'locker') Object.assign(D, { titel: 'Technik & Grundlage', bau: ['300 m einschwimmen', '8 × 50 m Technik (Abschlag, Seitlage, Faust), 15 s Pause', Math.max(2, Math.round(haupt / 200)) + ' × 200 m locker, 20 s Pause', '200 m ausschwimmen'], warum: 'Im Wasser entscheidet die Technik mehr als die Kraft. Saubere Züge machen dich schneller und sparen Energie.', quelle: 'Costill et al., Int J Sports Med 1985', km: gesamt });
      if (s.typ === 'css') { const n = Math.max(6, Math.min(20, Math.round(haupt / 100))); Object.assign(D, { titel: 'CSS-Intervalle', art: 'schwelle', bau: ['400 m einschwimmen, davon 4 × 50 m steigernd', n + ' × 100 m im CSS-Tempo, 15 s Pause', '200 m ausschwimmen'], warum: 'Schwimmen an der Schwelle verbessert genau das Tempo, das du über die Rennstrecke halten kannst.', quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', km: gesamt }); }
      if (s.typ === 'ausdauer') Object.assign(D, { titel: 'Ausdauer lang', bau: ['300 m einschwimmen', Math.max(2, Math.round(haupt / 400)) + ' × 400 m gleichmäßig, 30 s Pause – alle 6–8 Züge nach vorn schauen wie im Freiwasser', '200 m ausschwimmen'], warum: 'Gewöhnt dich an lange, gleichmäßige Strecken – mit Orientierung wie im See.', km: gesamt });
      if (s.typ === 'lang') Object.assign(D, { titel: 'Langes Schwimmen', bau: ['300 m einschwimmen', Math.round(haupt / 100) * 100 + ' m am Stück oder in 500-m-Blöcken, gleichmäßig', '200 m ausschwimmen'], warum: 'Die Ausdauer für lange Schwimmstrecken – ruhig und technisch sauber.', km: gesamt });
      if (s.typ === 'sprint') Object.assign(D, { titel: 'Tempo', art: 'hart', bau: ['400 m einschwimmen', '12 × 50 m schnell, 30 s Pause', '4 × 100 m locker', '200 m ausschwimmen'], warum: 'Kurze schnelle Strecken verbessern Tempo und Zugkraft.', km: gesamt });
      if (s.typ === 'opener') Object.assign(D, { titel: 'Kurz & locker', bau: ['600–1000 m locker', '4 × 50 m zügig, dazwischen voll erholen'], warum: 'Wassergefühl für das Rennen – ohne Müdigkeit.' });
      if (s.typ === 'test') Object.assign(D, { titel: 'CSS-Test', art: 'test', bau: ['400 m einschwimmen, 4 × 50 m steigernd', '400 m so schnell wie gleichmäßig möglich', '5–10 min locker', '200 m so schnell wie möglich', '200 m ausschwimmen'], warum: 'Aus beiden Zeiten berechnet Dreiklang deine neue CSS – trag sie unter Schwimmen ein.', quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', link: { ziel: 'training/schwimmen', text: 'CSS eintragen' } });
      // Version 24: mehr Abwechslung
      if (s.typ === 'zugkraft') { const n = Math.max(4, Math.min(10, Math.round(haupt / 150))); Object.assign(D, { titel: 'Zugkraft', art: 'mittel', bau: ['300 m einschwimmen', n + ' × 100 m mit Paddles und Pullbuoy, 20 s Pause – langer Zug, Ellbogen hoch', '6 × 50 m Technik ohne Hilfsmittel, 15 s Pause', '200 m ausschwimmen'], warum: 'Paddles vergrößern die Handfläche und lassen dich spüren, wo der Druck im Zug sitzt – mehr Vortrieb pro Zug, weniger Züge pro Bahn.', quelle: 'Toussaint & Beek, Sports Med 1992', km: gesamt }); }
      if (s.typ === 'freiwasser') Object.assign(D, { titel: 'Freiwasser-Training', bau: ['300 m einschwimmen', Math.max(3, Math.round(haupt / 300)) + ' × 200 m mit Orientieren alle 6 Züge, 20 s Pause', '6 × 50 m Massenstart: 25 m schnell, 25 m locker, 20 s Pause', '200 m ausschwimmen – im See: Neoprenanzug und Boje anlegen'], warum: 'Im See gibt es keine Linie am Boden: Orientieren, Wellen, Enge am Start. Wer das im Becken übt, schwimmt im Rennen gerade – und spart Meter.', quelle: 'Baldassarre et al., IJSPP 2017', km: gesamt });
      if (s.typ === 'beine') Object.assign(D, { titel: 'Beinschlag & Technik', bau: ['300 m einschwimmen', '8 × 50 m Beine mit Brett, 20 s Pause – kleiner, schneller Schlag aus der Hüfte', '8 × 50 m Technik (Abschlag, Seitlage, Faust), 15 s Pause', Math.max(2, Math.round(haupt / 300)) + ' × 200 m locker, 20 s Pause', '200 m ausschwimmen'], warum: 'Ein ruhiger, kleiner Beinschlag hält die Wasserlage – im Triathlon nicht für den Vortrieb, sondern damit die Beine fürs Rad frisch bleiben.', quelle: 'Costill et al., Int J Sports Med 1985', km: gesamt });
      if (s.typ === 'pyramide') Object.assign(D, { titel: 'Pyramide', art: 'schwelle', bau: ['300 m einschwimmen', '100 m, 200 m, 300 m, 200 m, 100 m im CSS-Tempo, je 20 s Pause', '4 × 50 m locker, 15 s Pause', '200 m ausschwimmen'], warum: 'Steigende und fallende Strecken im Schwellentempo: Die 300 fordern dich, die kurzen Stücke halten das Tempo sauber – weniger eintönig als nur 100er.', quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', km: gesamt });
      if (s.typ === 'rennsim') Object.assign(D, { titel: 'Rennsimulation', art: 'renn', bau: ['400 m einschwimmen', '3 × 400 m im Renntempo, 45 s Pause – die ersten 50 m zügig wie am Start, dann ruhig', '4 × 50 m locker, 15 s Pause', '200 m ausschwimmen'], warum: 'Der schnelle Start, dann ins Renntempo finden: So fühlt sich die erste Boje an. Wer das kennt, bleibt im Rennen ruhig – und kommt mit Reserven aufs Rad.', quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', km: gesamt });
      if (s.typ === 'tempowechsel') Object.assign(D, { titel: 'Tempowechsel', art: 'schwelle', bau: ['300 m einschwimmen', '12 × 100 m: 50 m schnell, 50 m locker – 15 s Pause', '200 m ausschwimmen'], warum: 'Schnell und locker im Wechsel ohne lange Pausen: Du lernst, nach einem Spurt wieder ins Tempo zu finden – im Rennen passiert genau das an jeder Boje.', quelle: 'Seiler, IJSPP 2010', km: gesamt });
    }
    if (s.sport === 'kraft') {
      const ziel0 = kraftZiel(w, PL);
      // Version 24: mehr Vorlagen – Rumpf, explosiv, Schwimmer, Radfahrer, Erhalt im Taper
      const K = {
        kraft_ganz: ['ganz', 'Kraft: Ganzkörper', null], kraft_lauf: ['laeufer', 'Kraft: Beine & Rumpf', null], kraft_oben: ['oben', 'Kraft: Oberkörper', null], kraft_unten: ['beine', 'Kraft: Beine & Gesäß', null],
        kraft_rumpf: ['core', 'Kraft: Rumpf & Hüfte', 'stabil'], kraft_explosiv: ['laeufer', 'Kraft: Explosiv', 'power'], kraft_schwimm: ['schwimmer', 'Kraft: Zug & Schulter', null], kraft_rad: ['rad', 'Kraft: Hüfte & Beine', null], kraft_erhalt: ['ganz', 'Kraft: Erhalt', 'stabil'],
      };
      const [vor, name, zielFest] = K[s.typ] || K.kraft_ganz, ziel = zielFest || ziel0;
      const haupt = ziel === 'kraft' ? '4–5 Übungen schwer: 3–4 × 4–6 Wdh., 2–3 min Pause' : ziel === 'power' ? 'wenige explosive Sätze: 3–4 × 3–5 Wdh., volle Pausen' : ziel === 'stabil' ? 'leichte Aktivierung: 2 × 10–12 kontrolliert' : '5–6 Übungen: 3 × 8–12 Wdh., 1–3 Wdh. Reserve';
      const WARUM = {
        kraft_rumpf: 'Ein stabiler Rumpf überträgt die Kraft der Beine aufs Pedal und in den Schritt – und schützt den unteren Rücken auf dem Zeitfahrrad und in den letzten Kilometern.',
        kraft_explosiv: 'Sprünge und schnelle Sätze machen Sehnen und Nerven schneller: Die Laufökonomie steigt, ohne dass du mehr Kilometer läufst. Wenige Wiederholungen, volle Pausen – Qualität statt Müdigkeit.',
        kraft_schwimm: 'Latissimus, Schultern und Trizeps liefern den Vortrieb im Wasser. Zugkraft an Land macht jeden Zug kräftiger – und stabile Schultern bleiben gesund.',
        kraft_rad: 'Hüftstreckung und einbeinige Kraft bringen Watt aufs Pedal, besonders bergauf und in der Aero-Position; der untere Rücken hält die Position länger.',
        kraft_erhalt: 'Im Taper bleibt Kraft erhalten, wenn du sie kurz und leicht anstößt – wenige Sätze mit Reserve, keine Muskelkater-Gefahr vor dem Rennen.',
      };
      const QUELLE = {
        kraft_rumpf: 'Hibbs et al., Sports Med 2008 · Lauersen et al., Br J Sports Med 2014', kraft_explosiv: 'Saunders et al., J Strength Cond Res 2006 · Barnes & Kilding, Sports Med 2015',
        kraft_schwimm: 'Crowley et al., Sports Med 2017', kraft_rad: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014', kraft_erhalt: 'Bosquet et al., Med Sci Sports Exerc 2007 · Rønnestad & Mujika, Scand J Med Sci Sports 2014',
      };
      const bau = s.typ === 'kraft_explosiv' ? ['10 min aufwärmen mit Lauf-ABC und 3 Steigerungen', 'Sprünge: Hürdensprünge, Ausfallschritt-Sprünge, Skater – 3 × 5, volle Pausen', '2 schwere Grundübungen: 3 × 3–5 Wdh.', 'Workout mit Erklärungen öffnen'] : [s.typ === 'kraft_erhalt' ? '5 min aufwärmen' : '5–8 min aufwärmen', haupt, 'Workout mit Erklärungen öffnen – Übungen passend zu deinem Ort'];
      Object.assign(D, { titel: name, art: 'kraft', bau, warum: WARUM[s.typ] || (PL.E.length ? 'Schweres Krafttraining verbessert die Lauf- und Radökonomie und senkt das Verletzungsrisiko deutlich.' : 'Kraft an mindestens zwei Tagen pro Woche empfiehlt die WHO – für Muskeln, Knochen und Stoffwechsel.'), quelle: QUELLE[s.typ] || (PL.E.length ? 'Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Lauersen et al., Br J Sports Med 2014' : 'Bull et al., Br J Sports Med 2020'), link: { ziel: 'training/gym/workout', text: 'Workout öffnen', fn: () => window.tfGym && tfGym.vorlage && tfGym.vorlage({ vorlage: vor, ziel, dauer: s.min }) } });
    }
    if (s.sport === 'mobil') {
      // Version 24: sechs Einheiten statt zwei
      const MOB = {
        mobil_yoga: ['yoga', 'huefte', 'Yoga: Hüfte & Rücken', 'Löst Hüfte, Beinrückseite und Rücken – gut an lockeren Tagen und nach langen Einheiten.', 'Polsgrove et al., Int J Yoga 2016'],
        mobil_pilates: ['pilates', 'rumpf', 'Pilates: Rumpf & Haltung', 'Kräftigt die tiefe Rumpfmuskulatur, die Kraft von den Beinen überträgt und den Rücken schützt.', 'Kloubec, J Strength Cond Res 2010'],
        mobil_schulter: ['yoga', 'schulter', 'Yoga: Schultern & Brust', 'Öffnet Brust und Schultern, die vom Schwimmen und der Aero-Position eng werden – mehr Zugweite, weniger Nackenzug.', 'Polsgrove et al., Int J Yoga 2016'],
        mobil_abend: ['yoga', 'entspannung', 'Yoga: Abend & Atmung', 'Ruhige Haltungen und langsame Atmung senken den Puls und bereiten den Schlaf vor – der Teil der Erholung, den du steuern kannst.', 'Polsgrove et al., Int J Yoga 2016 · Watson et al., Sleep 2015'],
        mobil_ruecken: ['pilates', 'ruecken', 'Pilates: Rücken', 'Streckt und kräftigt die Rückenstrecker – wer viel im Sattel sitzt und am Schreibtisch, braucht genau das.', 'Kloubec, J Strength Cond Res 2010'],
        mobil_balance: ['mix', 'balance', 'Mix: Gleichgewicht & Füße', 'Einbeinstand und Fußarbeit stärken Sprunggelenk und Fuß – Stabilität bei jedem Schritt, weniger Umknicken auf dem Trail.', 'Lauersen et al., Br J Sports Med 2014'],
      };
      const [stil, fokus, titel, warum, quelle] = MOB[s.typ] || MOB.mobil_pilates;
      Object.assign(D, { titel, bau: [s.min + ' min ruhig und kontrolliert, mit langsamer Atmung', 'Einheit mit Anleitung öffnen'], warum, quelle, link: { ziel: 'training/flow/einheit', text: 'Einheit öffnen', fn: () => window.tfFlow && tfFlow.vorlage && tfFlow.vorlage({ stil, fokus, dauer: s.min }) } });
    }
    if (s.typ === 'rennen') Object.assign(D, { titel: (P.rname || (PL.item && PL.item.lang) || 'Rennen'), art: 'renn', bau: ['Aufwärmen wie geübt', 'Pacing und Verpflegung nach Plan – die ersten Minuten bewusst kontrolliert', 'Genießen'], warum: 'Dafür hast du trainiert.', link: { ziel: 'rennen/rechner', text: 'Rennrechner öffnen' } });
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
    if (P) { const X = eigenSauber(P.extra); if (X.length) P.extra = X; else delete P.extra; } // Version 15: eigene Einheiten
    if (P) { const R = ersatzSauber(P.ersatz); if (R.length) P.ersatz = R; else delete P.ersatz; } // Version 17: ersetzte Sportarten
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
    const B = (rowsOf('belastung') || []).filter((b) => b.date === datum && b.sport === g && !b.eigen);
    if (!B.length) return null;
    const m = B.reduce((x, b) => x + (+b.min || 0), 0);
    return m >= Math.min(15, s.min * 0.5) ? m : null;
  }
  function status(datum, s) {
    const g = garminTag(datum, s);
    if (s.eigen) { // Version 15: eigene Einheit – dein Haken zählt, sonst die Uhr
      if (s.eigen.f === 1) return { ok: true, quelle: g ? 'garmin' : 'du', min: g };
      if (s.eigen.f === 0) return { ok: false, verpasst: datum < localDate() };
      return g ? { ok: true, quelle: 'garmin', min: g } : { ok: false, verpasst: datum < localDate() };
    }
    const k = schluessel(datum, s), manuell = P.erledigt[k];
    if (manuell === 1) return { ok: true, quelle: g ? 'garmin' : 'du', min: g };
    if (manuell === 0) return { ok: false, verpasst: datum < localDate() };
    if (g) return { ok: true, quelle: 'garmin', min: g };
    return { ok: false, verpasst: datum < localDate() };
  }
  let cache = { k: null, PL: null };
  function planJetzt() { if (!P) return null; const k = JSON.stringify([P.sporte, P.ziel, P.haupt, P.rsport, P.rdist, P.rdatum, P.wochen, P.start, P.stunden, P.tage, P.lang, P.niveau, P.aktuell, P.rhythmus, P.kraftN, P.mobilN, P.modell, P.tests, P.langMax, (athlet().standard || []).length]); if (cache.k !== k) cache = { k, PL: rechnen(P), W: {} }; return cache.PL; }
  function wocheVon(PL, i) {
    if (!cache.W[i]) cache.W[i] = wocheBauen(PL, i);
    const Q = tauschFuer(i, PL), v = sanftVon(), E2 = entlastFuer(i, PL);
    let k = String(i), W = cache.W[i];
    if (Q.length) {
      k = i + ':' + Q.map((t) => t.von + '-' + t.nach).join(',');
      if (!cache.W[k]) cache.W[k] = anpassen(cache.W[i], Q);
      W = cache.W[k];
    }
    if (v) {
      k += '|' + v.ab + '-' + v.bis;
      if (!cache.W[k]) cache.W[k] = sanftAnwenden(W, PL, i, v);
      W = cache.W[k];
    }
    if (E2.length) { // Version 13: Entlastungstage
      k += '|e' + E2.join(',');
      if (!cache.W[k]) cache.W[k] = entlastAnwenden(W, PL, i, E2);
      W = cache.W[k];
    }
    const R = ersatzFuer(i, PL);
    if (R.length) { // Version 17: Sportart ersetzt
      k += '|r' + R.map((x) => [x.id, x.d || x.w, x.k || x.ab, x.von, x.nach].join('/')).join(',');
      if (!cache.W[k]) cache.W[k] = ersatzAnwenden(W, PL, i, R);
      W = cache.W[k];
    }
    const X = extraFuer(i, PL);
    if (X.length) { // Version 15: eigene Einheiten (der heutige Tag gehört zum Schlüssel: nur kommende Tage werden angepasst)
      k += '|x' + localDate() + ':' + X.map((x) => [x.id, x.d, x.sport, x.art, x.min, x.schwer || '', x.name || '', x.f == null ? '' : x.f].join('/')).join(',');
      if (!cache.W[k]) cache.W[k] = extraAnwenden(W, PL, i, X);
      W = cache.W[k];
    }
    return W;
  }
  // Version 13: Vorschau – dieselbe Woche mit einem zusätzlichen Tausch, ohne etwas zu speichern (Was-wäre-wenn, Domino)
  function wocheMit(PL, i, extra) {
    if (!cache.W[i]) cache.W[i] = wocheBauen(PL, i);
    const Q = tauschFuer(i, PL).concat(extra || []), v = sanftVon(), E2 = entlastFuer(i, PL);
    let W = Q.length ? anpassen(cache.W[i], Q) : cache.W[i];
    if (v) W = sanftAnwenden(W, PL, i, v);
    if (E2.length) W = entlastAnwenden(W, PL, i, E2);
    const R = ersatzFuer(i, PL); if (R.length) W = ersatzAnwenden(W, PL, i, R); // Version 17
    const X = extraFuer(i, PL); if (X.length) W = extraAnwenden(W, PL, i, X);
    return W;
  }
  function extraFuer(i, PL) {
    const L = P && Array.isArray(P.extra) ? P.extra : [], w = PL.W[i]; if (!w || !L.length) return [];
    const bis = plus(w.start, 6);
    return L.filter((x) => x.d >= w.start && x.d <= bis);
  }
  function extraAnwenden(woche, PL, i, X) {
    const w = PL.W[i], h0 = localDate(), ES = woche.ES.map((L) => L.map((s) => Object.assign({}, s))), notizen = (woche.notizen || []).slice();
    X.forEach((x) => { const d = wt(x.d); ES[d].push(eigenEinheit(x, d)); });
    const weich = (d) => ES[d].filter((s) => !s.eigen && s.hart === 2 && s.sport !== 'schwimmen' && !s.lang && s.typ !== 'test' && s.typ !== 'rennen');
    X.filter((x) => x.art === 'hart').forEach((x) => { // harte eigene Einheit: die harte Plan-Einheit direkt davor oder danach wird locker
      const d = wt(x.d);
      [d - 1, d + 1].filter((n) => n >= 0 && n <= 6 && plus(w.start, n) >= h0).forEach((n) => {
        const L = weich(n); if (!L.length) return;
        L.forEach((s) => { s.vorher = s.typ; s.typ = 'locker'; s.hart = 0; s.q = false; s.angepasst = d; s.wegen = x.id; });
        notizen.push({ art: 'locker', tag: n, neben: d, eigen: true });
      });
    });
    return Object.assign({}, woche, { ES, notizen });
  }
  function eigenHinzu(x) {
    laden(); if (!P) return null;
    const y = eigenSauber([Object.assign({ id: eigenId() }, x)])[0]; if (!y) return null;
    P.extra = eigenSauber((P.extra || []).concat(y));
    speichern(true);
    return P.extra.find((z) => z.id === y.id) ? y : null;
  }
  function eigenWeg(id) { laden(); if (!P) return; P.extra = (P.extra || []).filter((x) => x.id !== id); if (!P.extra.length) delete P.extra; speichern(true); }
  function eigenErledigt(id, f) { laden(); if (!P) return; const x = (P.extra || []).find((y) => y.id === id); if (!x) return; x.f = f; speichern(); }
  // Version 16: Workout in Gym oder Pilates & Yoga gespeichert → die offene eigene Einheit von heute ist erledigt
  function eigenAuto(sport) {
    laden(); if (!P || !Array.isArray(P.extra)) return false;
    const x = P.extra.find((y) => y.d === localDate() && y.sport === sport && y.f !== 1); if (!x) return false;
    x.f = 1; speichern(true); return true;
  }
  const liste = (L) => (L.length > 1 ? L.slice(0, -1).join(', ') + ' und ' + L[L.length - 1] : L[0] || '');
  /* Version 16: Blatt „Einheit hinzufügen“ – Tag, Sportart, wie hart, wie lange, schon erledigt. Darunter steht vorher, was
     sie zählt und welche harte Plan-Einheit daneben locker wird. Die letzte Wahl merkt sich nur dieses Gerät. */
  const EIGEN_LS = 'tf:eigen', EIGEN_NAME = { laufen: 'Laufen', rad: 'Rad', schwimmen: 'Schwimmen', kraft: 'Kraft', mobil: 'Pilates & Yoga', andere: 'Andere' };
  const EIGEN_SUB = { gefuehl: { locker: 'reden geht', mittel: 'kurze Sätze', hart: 'kaum reden' }, kraft: { locker: 'viel Reserve', mittel: '2–3 Wdh. Reserve', hart: '1–2 Wdh. Reserve' } };
  function eigenBlatt(PL, i) {
    const w = PL.W[i], h0 = localDate(), bis = plus(w.start, 6), W0 = wocheVon(PL, i);
    let mem = {}; try { mem = JSON.parse(localStorage.getItem(EIGEN_LS) || '{}') || {}; } catch (e) { mem = {}; }
    const x = { sport: EIGEN_SPORT.includes(mem.sport) ? mem.sport : 'kraft', art: EIGEN_ART.includes(mem.art) ? mem.art : 'mittel', name: typeof mem.name === 'string' ? mem.name.slice(0, 40) : '' };
    const schwerVon = (sp, alt) => (sp === 'kraft' ? (['ganz', 'unten', 'oben'].includes(alt) ? alt : 'ganz') : sp === 'mobil' ? (alt === 'yoga' ? 'yoga' : 'pilates') : null);
    x.schwer = schwerVon(x.sport, mem.schwer);
    x.min = mem.sport === x.sport && +mem.min >= 5 && +mem.min <= 600 ? Math.round(+mem.min / 5) * 5 : EIGEN_MIN[x.sport];
    let d = h0 >= w.start && h0 <= bis ? wt(h0) : h0 < w.start ? 0 : 6, fertig = plus(w.start, d) < h0, minAngefasst = false;
    const datum = () => plus(w.start, d);
    const box = el('div', { class: 'tf-rm tf-pl-eb' });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Einheit hinzufügen' }), el('p', { class: 'tf-rm-sub', text: 'Woche ' + (i + 1) + ' · ' + dm(w.start) + '–' + dm(bis) }));
    // Tag
    const tage = el('div', { class: 'tf-pl-eb-tage', role: 'radiogroup', 'aria-label': 'Tag' });
    for (let n = 0; n < 7; n++) {
      const dn = plus(w.start, n);
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(n === d), class: 'tf-pl-eb-tag' + (dn === h0 ? ' heute' : ''), 'aria-label': WT_LANG[n] + ', ' + dm(dn) + (dn === h0 ? ', heute' : '') },
        el('small', { text: dn === h0 ? 'Heute' : WT[n] }), el('b', { class: 'num', text: String(+dn.slice(8, 10)) }));
      b.addEventListener('click', () => { const vorher = datum() < h0; d = n; if ((datum() < h0) !== vorher) fertig = datum() < h0; $$('button', tage).forEach((y, j) => y.setAttribute('aria-checked', String(j === d))); neu(); });
      tage.appendChild(b);
    }
    // Sportart
    const sporte = el('div', { class: 'tf-pl-eb-sport', role: 'radiogroup', 'aria-label': 'Sportart' });
    EIGEN_SPORT.forEach((sp) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(sp === x.sport), class: 'tf-pl-eb-s' }, svgIco(SP[sp].icon), el('span', { text: EIGEN_NAME[sp] }));
      b.addEventListener('click', () => {
        if (x.sport === sp) return;
        x.sport = sp; x.schwer = schwerVon(sp, null); if (!minAngefasst) x.min = EIGEN_MIN[sp];
        $$('button', sporte).forEach((y) => y.setAttribute('aria-checked', String(y === b)));
        zusatzBauen(); artBauen(); neu();
      });
      sporte.appendChild(b);
    });
    // je nach Sportart: Schwerpunkt, Pilates oder Yoga, Name der Sportart
    const zusatz = el('div', { class: 'tf-field' });
    const seg = (items, cur, on, label) => {
      const g = el('div', { class: 'tf-seg tf-pl-tb-seg', role: 'group', 'aria-label': label });
      items.forEach(([v, t, klein]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, t, klein ? el('small', { text: klein }) : null); b.addEventListener('click', () => { on(v); $$('button', g).forEach((y) => y.setAttribute('aria-pressed', String(y === b))); neu(); }); g.appendChild(b); });
      return g;
    };
    function zusatzBauen() {
      zusatz.replaceChildren(); zusatz.hidden = false;
      if (x.sport === 'kraft') zusatz.append(el('span', { text: 'Schwerpunkt' }), seg([['ganz', 'Ganzkörper'], ['unten', 'Beine'], ['oben', 'Oberkörper']], x.schwer, (v) => { x.schwer = v; }, 'Schwerpunkt'));
      else if (x.sport === 'mobil') zusatz.append(el('span', { text: 'Art' }), seg([['pilates', 'Pilates'], ['yoga', 'Yoga']], x.schwer, (v) => { x.schwer = v; }, 'Art'));
      else if (x.sport === 'andere') {
        const inp = el('input', { type: 'text', class: 'tf-input', id: 'eigen-name', maxlength: '40', autocomplete: 'off', placeholder: 'z. B. Tennis', value: x.name });
        const vor = el('div', { class: 'tf-chipset', role: 'group', 'aria-label': 'Vorschläge' });
        inp.addEventListener('input', () => { x.name = inp.value.slice(0, 40); $$('button', vor).forEach((y) => y.setAttribute('aria-pressed', String(y.textContent === x.name.trim()))); neu(); });
        EIGEN_ANDERE.forEach((n) => { const b = el('button', { type: 'button', 'aria-pressed': String(x.name === n) }, n); b.addEventListener('click', () => { x.name = n; inp.value = n; $$('button', vor).forEach((y) => y.setAttribute('aria-pressed', String(y === b))); neu(); }); vor.appendChild(b); });
        zusatz.append(el('label', { for: 'eigen-name', text: 'Welche Sportart?' }), inp, vor);
      } else zusatz.hidden = true;
    }
    // wie hart (Pilates & Yoga zählt immer ruhig)
    const artBox = el('div', { class: 'tf-field' });
    function artBauen() {
      artBox.hidden = x.sport === 'mobil';
      const sub = x.sport === 'kraft' ? EIGEN_SUB.kraft : EIGEN_SUB.gefuehl;
      artBox.replaceChildren(el('span', { text: 'Wie hart?' }), seg(EIGEN_ART.map((a) => [a, { locker: 'Locker', mittel: 'Mittel', hart: 'Hart' }[a], sub[a]]), x.art, (v) => { x.art = v; }, 'Wie hart?'));
    }
    // Dauer
    const minB = el('b', { class: 'num' });
    const setMin = (m) => { x.min = Math.max(5, Math.min(600, Math.round(m / 5) * 5)); minAngefasst = true; neu(); };
    const weniger = el('button', { type: 'button', 'aria-label': '5 Minuten weniger' }, '−'), mehr = el('button', { type: 'button', 'aria-label': '5 Minuten mehr' }, '+');
    weniger.addEventListener('click', () => setMin(x.min - 5)); mehr.addEventListener('click', () => setMin(x.min + 5));
    const schnell = el('div', { class: 'tf-chipset', role: 'group', 'aria-label': 'Dauer schnell wählen' });
    [[30, '30 min'], [45, '45 min'], [60, '1 h'], [90, '1,5 h'], [120, '2 h']].forEach(([m, t]) => { const b = el('button', { type: 'button', 'aria-pressed': 'false', 'data-m': String(m) }, t); b.addEventListener('click', () => setMin(m)); schnell.appendChild(b); });
    // schon erledigt (heute und früher)
    const cb = el('input', { type: 'checkbox', id: 'eigen-fertig' });
    const sw = el('label', { class: 'tf-switch tf-pl-eb-fertig' }, cb, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Schon erledigt', el('small', { text: 'Dann zählt sie gleich in Fitness und Form – außer deine Uhr hat sie aufgezeichnet, dann zählt die Messung.' })));
    cb.addEventListener('change', () => { fertig = cb.checked; neu(); });
    // was sie zählt
    const sum = el('p', { class: 'tf-pl-eb-sum', 'aria-live': 'polite' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'eigen-ok' }, svgIco('i-plus'), ' Hinzufügen');
    const los = el('button', { type: 'button', class: 'tf-btn', id: 'eigen-los' }, svgIco('i-play'), ' Hinzufügen und starten');
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    const eintrag = () => ({ d: datum(), sport: x.sport, art: x.sport === 'mobil' ? 'locker' : x.art, min: x.min, name: x.sport === 'andere' && x.name.trim() ? x.name.trim() : undefined, schwer: x.schwer || undefined });
    function neu() {
      minB.textContent = x.min < 60 ? x.min + ' min' : x.min % 60 ? dauer(x.min) : x.min / 60 + ' h';
      $$('button', schnell).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.m === x.min)));
      const bisHeute = datum() <= h0;
      sw.hidden = !bisHeute; cb.checked = bisHeute && fertig;
      los.hidden = !(datum() === h0 && (x.sport === 'kraft' || x.sport === 'mobil') && !fertig);
      const y = Object.assign({ id: 'vorschau' }, eintrag()), l = lastVon(eigenEinheit(y, d), w, PL), weich = [];
      if (y.art === 'hart') [d - 1, d + 1].filter((n) => n >= 0 && n <= 6 && plus(w.start, n) >= h0).forEach((n) => W0.ES[n].filter((t) => !t.eigen && t.hart === 2 && t.sport !== 'schwimmen' && !t.lang && t.typ !== 'test' && t.typ !== 'rennen').forEach((t) => weich.push(beschreiben(t, PL, w).titel + ' am ' + WT_LANG[n])));
      sum.textContent = 'Zählt mit etwa ' + l.tss + ' Belastungspunkten (TSS).' + (weich.length ? ' Weil sie hart ist, wird ' + liste(weich) + ' locker – zwei harte Tage direkt hintereinander ermüden mehr, als sie bringen.' : '');
    }
    function hinzu(starten) {
      const y = eigenHinzu(Object.assign(eintrag(), datum() <= h0 && fertig ? { f: 1 } : {}));
      if (!y) { A().toast('Nicht gespeichert – es gibt schon ' + EIGEN_MAX + ' eigene Einheiten. Entferne zuerst ältere.', 6000); return; }
      try { localStorage.setItem(EIGEN_LS, JSON.stringify({ sport: x.sport, art: x.art, min: x.min, schwer: x.schwer, name: x.name.trim() })); } catch (e) { /* nur Komfort */ }
      if (window.tfWissen) tfWissen.schliessen();
      const s = eigenEinheit(y, d), PL2 = planJetzt();
      woche = i; offen = schluessel(y.d, s);
      if (starten) { const D = eigenBeschreiben(s, PL2); if (D.link) { if (D.link.fn) D.link.fn(); T.geh(D.link.ziel); } A().toast('Eingetragen – sobald du das Workout speicherst, ist sie abgehakt.', 5000); return; }
      renderPlan();
      const N = wocheVon(PL2, i).ES.flat().filter((t) => t.wegen === y.id);
      A().toast('Einheit hinzugefügt' + (N.length ? ' · daneben ist jetzt ' + (N.length === 1 ? 'eine harte Einheit' : N.length + ' harte Einheiten') + ' locker' : ''), 5000);
    }
    ok.addEventListener('click', () => hinzu(false)); los.addEventListener('click', () => hinzu(true));
    ab.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    zusatzBauen(); artBauen();
    box.append(el('div', { class: 'tf-field' }, el('span', { text: 'Tag' }), tage), el('div', { class: 'tf-field' }, el('span', { text: 'Sportart' }), sporte), zusatz, artBox,
      el('div', { class: 'tf-field tf-pl-eb-dauer' }, el('span', { text: 'Dauer' }), el('div', { class: 'tf-stepper' }, weniger, minB, mehr), schnell), sw, sum,
      el('div', { class: 'tf-form-actions' }, ok, los, ab));
    neu();
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }
  /* ---------- Version 17: Sportart einer Einheit ersetzen ----------
     Kein Rad diese Woche, das Bad hat zu? Eine Einheit – oder alle einer Sportart in dieser Woche, ab heute – bekommt eine
     andere Sportart oder fällt aus. Der Rest des Plans bleibt. Die Rolle bleibt (hart bleibt hart, lang bleibt lang), die
     Dauer passt sich an: Laufen belastet Beine und Sehnen mehr als Rad und Schwimmen, deshalb wird ein Lauf statt einer
     Ausfahrt kürzer – und nie länger als der längste Lauf dieser Woche. Wer im Plan sonst nicht läuft, bekommt Laufen und
     Gehen (höchstens 45 min). Gespeichert in plan.ersatz: { id, d, k } für eine Einheit (k = Sportart#Typ+Nr wie im Plan)
     oder { id, w, ab } für die ganze Woche; dazu von und nach (Sportart oder „frei“). */
  const ERSATZ_MAX = 60, ERSATZ_ZIEL = ['laufen', 'rad', 'schwimmen', 'kraft', 'mobil', 'frei'];
  const ERSATZ_F = { rad: { laufen: 0.6, schwimmen: 0.6 }, laufen: { rad: 1.3, schwimmen: 0.9 }, schwimmen: { laufen: 0.8, rad: 1.2 } };
  const einheitK = (s) => s.sport + '#' + s.typ + (s.nr ? s.nr : '');
  function ersatzSauber(L) {
    const tagOk = (x) => /^\d{4}-\d\d-\d\d$/.test(x || '');
    return (Array.isArray(L) ? L : []).filter((x) => x && /^[a-z0-9]{4,12}$/.test(x.id || '') && ERSATZ_ZIEL.includes(x.nach) && ['laufen', 'rad', 'schwimmen', 'kraft', 'mobil'].includes(x.von) && x.von !== x.nach
      && ((tagOk(x.d) && typeof x.k === 'string' && x.k.length <= 48) || (tagOk(x.w) && tagOk(x.ab))))
      .map((x) => (x.d ? { id: x.id, d: x.d, k: x.k, von: x.von, nach: x.nach } : { id: x.id, w: x.w, ab: x.ab, von: x.von, nach: x.nach }))
      .slice(-ERSATZ_MAX);
  }
  function ersatzFuer(i, PL) {
    const L = P && Array.isArray(P.ersatz) ? P.ersatz : [], w = PL.W[i]; if (!w || !L.length) return [];
    const bis = plus(w.start, 6);
    return L.filter((x) => (x.d && x.d >= w.start && x.d <= bis) || x.w === w.start);
  }
  const ersetzbar = (s) => !!s && !s.eigen && s.typ !== 'rennen' && !s.entlastet && SP[s.sport] && s.sport !== 'andere';
  function ersatzKappe(alle) { // nie länger als die längste Einheit dieser Sportart in der Woche (sonst vorsichtig)
    const max = (sp) => alle.filter((s) => (s.ersetzt ? s.ersetzt.sport : s.sport) === sp).reduce((m, s) => Math.max(m, s.ersetzt ? s.ersetzt.min : s.min), 0);
    return { laufen: max('laufen') || 75, schwimmen: max('schwimmen') || 60, rad: 300 };
  }
  function ersetze(s, nach, PL, kappe, e) {
    const t = s.typ, hart = s.hart === 2, mittel = s.hart === 1, lang = !!s.lang || t === 'lang', ruhig = /schwelle|css|sweetspot|renntempo|fahrtspiel|test/.test(t);
    let typ, min;
    if (nach === 'kraft') { typ = 'kraft_ganz'; min = zwischen(r5(s.min * 0.6), 30, 60); }
    else if (nach === 'mobil') { typ = 'mobil_yoga'; min = zwischen(r5(s.min * 0.5), 20, 45); }
    else {
      if (t === 'opener') typ = 'opener';
      else if (lang) typ = nach === 'schwimmen' ? 'ausdauer' : 'lang';
      else if (/kadenz|steiger|technik/.test(t)) typ = nach === 'laufen' ? 'steiger' : nach === 'rad' ? 'kadenz' : 'technik'; // locker mit kurzen Reizen bleibt so
      else if (nach === 'laufen') typ = hart ? (ruhig ? 'schwelle' : 'vo2') : mittel ? 'fahrtspiel' : 'locker';
      else if (nach === 'rad') typ = hart ? (ruhig ? 'schwelle' : 'vo2') : mittel ? 'sweetspot' : 'locker';
      else typ = hart ? (ruhig ? 'css' : 'sprint') : mittel ? 'css' : 'technik';
      const f = AUSDAUER.includes(s.sport) ? (ERSATZ_F[s.sport] || {})[nach] || 1 : 1;
      min = zwischen(r5(s.min * f), 15, Math.max(15, kappe[nach] || 300));
    }
    const neu = Object.assign({}, s, { sport: nach, typ, min, lang: lang && (nach === 'laufen' || nach === 'rad'), nr: ':r' + e.id + '-' + s.typ + (s.nr ? s.nr : ''),
      ersetzt: { sport: s.sport, typ: s.typ, min: s.min, nr: s.nr, hart: s.hart, lang: !!s.lang, q: !!s.q, id: e.id, woche: !!e.w } });
    ['vorher', 'angepasst', 'wegen', 'sanft', 'nach'].forEach((x) => { delete neu[x]; });
    if (nach === 'kraft' || nach === 'mobil') Object.assign(neu, { hart: nach === 'kraft' ? Math.min(1, s.hart) : 0, q: false });
    if (nach === 'laufen' && !PL.E.includes('laufen')) Object.assign(neu, { typ: 'laufgehen', hart: 0, q: false, lang: false, min: Math.min(neu.min, 45) }); // wer sonst nicht läuft: vorsichtig
    return neu;
  }
  function ersatzAnwenden(woche, PL, i, R) {
    const w = PL.W[i], notizen = (woche.notizen || []).slice(), kappe = ersatzKappe(woche.ES.flat());
    const ES = woche.ES.map((L, d) => {
      const datum = plus(w.start, d), out = [];
      L.forEach((s) => {
        const e = ersetzbar(s) ? R.find((x) => x.d === datum && x.k === einheitK(s)) || R.find((x) => x.w === w.start && x.von === s.sport && datum >= x.ab) : null;
        if (!e) { out.push(s); return; }
        if (e.nach === 'frei') { notizen.push({ art: 'frei', tag: d, id: e.id, woche: !!e.w, s: Object.assign({}, s) }); return; }
        out.push(ersetze(s, e.nach, PL, kappe, e));
      });
      return out;
    });
    return Object.assign({}, woche, { ES, notizen });
  }
  function ersatzSetzen(e) {
    laden(); if (!P) return null;
    const y = ersatzSauber([Object.assign({ id: eigenId() }, e)])[0]; if (!y) return null;
    const bis = y.w ? plus(y.w, 6) : null;
    // dieselbe Stelle nur einmal; wer die ganze Woche ersetzt, ersetzt auch einzelne Einheiten dieser Sportart darin
    P.ersatz = ersatzSauber((P.ersatz || []).filter((x) => !(y.d ? x.d === y.d && x.k === y.k : (x.w === y.w && x.von === y.von) || (x.d && x.d >= y.w && x.d <= bis && x.von === y.von))).concat(y));
    speichern(true);
    return y;
  }
  function ersatzWeg(id) { laden(); if (!P) return; P.ersatz = (P.ersatz || []).filter((x) => x.id !== id); if (!P.ersatz.length) delete P.ersatz; speichern(true); }
  function ersatzVerschieben(w, von, nach) { // Tag verschoben: ersetzte Einheiten wandern mit
    if (!P || !Array.isArray(P.ersatz)) return;
    const dv = plus(w.start, von), dn = plus(w.start, nach);
    P.ersatz.forEach((x) => { if (x.d === dv) x.d = dn; else if (x.d === dn) x.d = dv; });
  }
  const ERSATZ_NAME = { laufen: 'Laufen', rad: 'Rad', schwimmen: 'Schwimmen', kraft: 'Kraft', mobil: 'Pilates & Yoga', frei: 'Frei' };
  function ersatzBlatt(PL, i, datum, s0) {
    const w = PL.W[i], h0 = localDate(), W0 = wocheVon(PL, i);
    const orig = s0.ersetzt ? Object.assign({}, s0, { sport: s0.ersetzt.sport, typ: s0.ersetzt.typ, min: s0.ersetzt.min, nr: s0.ersetzt.nr, hart: s0.ersetzt.hart, lang: s0.ersetzt.lang, q: s0.ersetzt.q, ersetzt: undefined }) : s0;
    const von = orig.sport, D0 = beschreiben(orig, PL, w), kappe = ersatzKappe(W0.ES.flat());
    // alle Einheiten dieser Sportart ab heute in dieser Woche (für „ganze Woche“), auch schon ersetzte und frei gelassene
    const dieWoche = [];
    W0.ES.forEach((L, d) => { const dx = plus(w.start, d); if (dx < h0) return; L.forEach((s) => { const o = s.ersetzt ? s.ersetzt.sport : s.sport; if (o === von && ersetzbar(s)) dieWoche.push([dx, s]); }); });
    (W0.notizen || []).filter((n) => n.art === 'frei' && n.s.sport === von && plus(w.start, n.tag) >= h0).forEach((n) => dieWoche.push([plus(w.start, n.tag), Object.assign({}, n.s, { frei: true })]));
    const ziele = ERSATZ_ZIEL.filter((x) => x !== von);
    let nach = s0.ersetzt ? s0.sport : ziele[0], ganz = !!(s0.ersetzt && s0.ersetzt.woche);
    const box = el('div', { class: 'tf-rm tf-pl-eb tf-pl-er' });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: ERSATZ_NAME[von] + ' ersetzen' }), el('p', { class: 'tf-rm-sub', text: WT_LANG[wt(datum)] + ', ' + dm(datum) + ' · ' + D0.titel + ' · ' + dauer(orig.min) }));
    const grid = el('div', { class: 'tf-pl-eb-sport', role: 'radiogroup', 'aria-label': 'Stattdessen' });
    ziele.forEach((sp) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(sp === nach), class: 'tf-pl-eb-s', 'data-ziel': sp }, svgIco(sp === 'frei' ? 'i-sofa' : SP[sp].icon), el('span', { text: ERSATZ_NAME[sp] }));
      b.addEventListener('click', () => { nach = sp; $$('button', grid).forEach((y) => y.setAttribute('aria-checked', String(y === b))); neu(); });
      grid.appendChild(b);
    });
    const n = dieWoche.length;
    const seg = el('div', { class: 'tf-seg tf-pl-tb-seg', role: 'group', 'aria-label': 'Wie viele Einheiten?' });
    [[false, 'Nur diese Einheit'], [true, n > 1 ? 'Alle ' + n + ' dieser Woche' : 'Diese Woche']].forEach(([v, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v === ganz) }, t);
      b.addEventListener('click', () => { ganz = v; $$('button', seg).forEach((y, j) => y.setAttribute('aria-pressed', String((j === 1) === ganz))); neu(); });
      seg.appendChild(b);
    });
    const wieviel = el('div', { class: 'tf-field', hidden: n < 2 }, el('span', { text: 'Wie viele ' + ERSATZ_NAME[von] + '-Einheiten?' }), seg);
    const vorschau = el('ul', { class: 'tf-pl-er-l', 'aria-live': 'polite' }), warum = el('p', { class: 'tf-note' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'ersatz-ok' }, 'Ändern');
    const zurueck = s0.ersetzt ? el('button', { type: 'button', class: 'tf-btn', id: 'ersatz-weg' }, 'Zurück zu ' + ERSATZ_NAME[von]) : null;
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    function neu() {
      const L = ganz ? dieWoche : [[datum, orig]];
      vorschau.replaceChildren(...L.slice(0, 7).map(([dx, s]) => {
        const o = s.ersetzt ? Object.assign({}, s, { sport: s.ersetzt.sport, typ: s.ersetzt.typ, min: s.ersetzt.min, nr: s.ersetzt.nr, hart: s.ersetzt.hart, lang: s.ersetzt.lang }) : s;
        const vorher = beschreiben(o, PL, w).titel + ' ' + dauer(o.min);
        if (nach === 'frei') return el('li', null, el('small', { text: WT[wt(dx)] }), el('span', { text: vorher }), el('b', { text: 'entfällt' }));
        const x = ersetze(o, nach, PL, kappe, { id: 'vorschau' });
        return el('li', null, el('small', { text: WT[wt(dx)] }), el('span', { text: vorher }), el('b', { text: beschreiben(x, PL, w).titel + ' ' + dauer(x.min) }));
      }));
      const rolle = orig.hart === 2 ? 'Harte Einheiten bleiben hart' : orig.lang ? 'Lange Einheiten bleiben lang' : 'Lockere Einheiten bleiben locker';
      warum.textContent = nach === 'frei' ? 'Die Einheit fällt aus – der Rest der Woche bleibt, wie er ist.'
        : nach === 'laufen' && !PL.E.includes('laufen') ? 'Laufen steht sonst nicht in deinem Plan – deshalb vorsichtig als Laufen und Gehen, höchstens 45 Minuten.'
          : rolle + '. ' + (nach === 'laufen' && von !== 'laufen' && AUSDAUER.includes(von) ? 'Laufen belastet Beine und Sehnen stärker, deshalb kürzer – und nie länger als dein längster Lauf dieser Woche.'
            : von === 'laufen' && nach === 'rad' ? 'Rad schont die Beine, deshalb etwas länger.'
              : nach === 'schwimmen' ? 'Schwimmen schont Beine und Gelenke; die Länge bleibt im Rahmen deiner Schwimmeinheiten.'
                : (nach === 'kraft' || nach === 'mobil') && AUSDAUER.includes(von) ? 'Kürzer, weil es die Ausdauer nicht ersetzt – aber der Tag bleibt aktiv.'
                  : nach === 'mobil' ? 'Ruhiger als Kraft – der Tag bleibt aktiv.' : nach === 'kraft' ? 'Kraft statt Pilates & Yoga – kurz und kontrolliert.' : 'Die Dauer passt sich der Sportart an.');
    }
    ok.addEventListener('click', () => {
      const y = ganz ? ersatzSetzen({ w: w.start, ab: h0 > w.start ? h0 : w.start, von, nach }) : ersatzSetzen({ d: datum, k: einheitK(orig), von, nach });
      if (!y) { A().toast('Nicht gespeichert – es gibt schon ' + ERSATZ_MAX + ' Änderungen. Nimm zuerst ältere zurück.', 6000); return; }
      if (window.tfWissen) tfWissen.schliessen();
      offen = null; woche = i; renderPlan();
      A().toast(nach === 'frei' ? (ganz ? 'Diese Woche ohne ' + ERSATZ_NAME[von] : ERSATZ_NAME[von] + ' entfällt') : (ganz ? 'Diese Woche ' + ERSATZ_NAME[nach] + ' statt ' + ERSATZ_NAME[von] : ERSATZ_NAME[nach] + ' statt ' + ERSATZ_NAME[von]), 4000);
    });
    if (zurueck) zurueck.addEventListener('click', () => { ersatzWeg(s0.ersetzt.id); if (window.tfWissen) tfWissen.schliessen(); offen = null; renderPlan(); A().toast('Wieder ' + ERSATZ_NAME[von]); });
    ab.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    box.append(el('div', { class: 'tf-field' }, el('span', { text: 'Stattdessen' }), grid), wieviel, el('div', { class: 'tf-field' }, el('span', { text: 'So sieht es dann aus' }), vorschau), warum,
      el('div', { class: 'tf-form-actions' }, ok, zurueck, ab));
    neu();
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }
  /* Version 13: Entlastungstag (aus dem Überlastungs-Wächter auf Heute). Statt des Geplanten höchstens 30 min ganz locker –
     wenn möglich Rad oder Schwimmen, weil das Beine und Sehnen schont; Pilates & Yoga bleibt. Ein freier Tag ist genauso gut.
     Gespeichert in plan.entlastung (Daten, höchstens 12). */
  const ENTLAST_MAX = 12;
  function entlastFuer(i, PL) {
    const L = (P && Array.isArray(P.entlastung) ? P.entlastung : null) || (Array.isArray(PL.P.entlastung) ? PL.P.entlastung : []), w = PL.W[i];
    if (!w) return [];
    const bis = plus(w.start, 6);
    return L.filter((d) => typeof d === 'string' && d >= w.start && d <= bis).sort();
  }
  function entlastAnwenden(woche, PL, i, tage) {
    const w = PL.W[i];
    const ES = woche.ES.map((L, d) => {
      if (!tage.includes(plus(w.start, d)) || L.some((s) => s.typ === 'rennen')) return L;
      const aus = L.filter((s) => AUSDAUER.includes(s.sport)), mobil = L.filter((s) => s.sport === 'mobil');
      if (!aus.length && !L.some((s) => s.sport === 'kraft')) return L;
      const sp = PL.E.includes('rad') ? 'rad' : PL.E.includes('schwimmen') ? 'schwimmen' : aus.length ? aus[0].sport : null;
      const neu = sp ? [{ sport: sp, typ: sp === 'schwimmen' ? 'technik' : 'locker', min: sp === 'laufen' ? 20 : 30, hart: 0, tag: d, entlastet: L.map((s) => Object.assign({}, s)) }] : [];
      return neu.concat(mobil.map((s) => Object.assign({}, s, { entlastetMit: true })));
    });
    return Object.assign({}, woche, { ES });
  }
  function entlasten(datum, an) {
    laden(); if (!P || !/^\d{4}-\d\d-\d\d$/.test(datum || '')) return false;
    const L = (Array.isArray(P.entlastung) ? P.entlastung : []).filter((d) => d !== datum && d >= plus(localDate(), -30));
    if (an !== false) L.push(datum);
    P.entlastung = L.sort().slice(-ENTLAST_MAX);
    speichern(true);
    return true;
  }
  /* Version 11: sanfte Woche nach einer Pause (rechner.sanft, aus „Willkommen zurück“ auf Heute):
     nichts Hartes und etwa zwei Drittel der geplanten Zeit – harte Einheiten werden locker, Kraft und Pilates & Yoga nur kürzer.
     Der Renntag bleibt, wie er ist. Nach ein paar Tagen Pause ist die Form noch da, Sehnen und Gelenke mögen aber einen
     ruhigen Wiedereinstieg (Gabbett, Br J Sports Med 2016). */
  const sanftVon = () => (window.tfTageslauf && tfTageslauf.sanft ? tfTageslauf.sanft() : null);
  function sanftAnwenden(woche, PL, i, v) {
    const w = PL.W[i]; if (!w) return woche;
    const tage = [0, 1, 2, 3, 4, 5, 6].filter((d) => { const dt = plus(w.start, d); return dt >= v.ab && dt <= v.bis; });
    if (!tage.length) return woche;
    const ES = woche.ES.map((L, d) => (!tage.includes(d) ? L : L.map((s) => {
      if (s.typ === 'rennen') return s;
      const n = Object.assign({}, s, { min: r5((s.min * 2) / 3), sanft: s });
      if (s.hart > 0 && s.sport !== 'kraft' && s.sport !== 'mobil') Object.assign(n, { typ: 'locker', hart: 0, q: false, lang: false });
      return n;
    })));
    return Object.assign({}, woche, { ES });
  }
  const wocheIndex = (PL, datum) => { const i = Math.floor((tag(datum) - tag(PL.start)) / (7 * DAY)); return i >= 0 && i < PL.N ? i : null; };

  /* ---------- Version 13: Auto-Regulierung – die heutige Einheit passt sich dem Tune an ----------
     Rot (Tune niedrig, Schutzmodus oder Überlastungs-Wächter): Harte und lange Einheiten werden kurz und locker,
     Kraft wird zur leichten Aktivierung. Gelb: ein Drittel weniger Intervalle, Intensität höchstens bis zur Schwelle bzw.
     am unteren Ende des Zielbereichs, lange Einheiten 20 % kürzer, Tests lieber verschieben. Läufe zusätzlich nach der
     Bein-Last (ACWR der Beine über 1,3 bzw. 1,5). HRV-gesteuertes Training brachte gleich gute oder bessere Fortschritte
     als starre Pläne (Kiviniemi et al., Eur J Appl Physiol 2007 · Javaloyes et al., IJSPP 2019). */
  const AUTO_CAP = { laufen: 40, rad: 60, schwimmen: 40 };
  const QUAL = ['schwelle', 'vo2', 'sweetspot', 'renntempo', 'css', 'sprint', 'fahrtspiel', 'cruise', 'huegel', 'tempowechsel', 'progressiv', 'berg', 'ueber_unter', 'aero', 'tempo', 'pyramide', 'rennsim', 'zugkraft']; // Version 24: neue harte Einheiten
  function autoStufe(s, datum) {
    if (datum !== localDate() || !s || s.eigen || s.typ === 'rennen' || s.entlastet || s.sport === 'mobil') return null;
    const H = heute(), gruende = [];
    let st = 0; // 0 nichts · 1 gelb · 2 rot
    if (H && H.date >= plus(localDate(), -1)) {
      if (H.ampel === 'rot') { st = 2; gruende.push('Tune ' + (H.score != null ? Math.round(H.score) + ' ' : '') + '(rot)'); }
      else if (H.ampel === 'gelb') { st = 1; gruende.push('Tune ' + (H.score != null ? Math.round(H.score) + ' ' : '') + '(gelb)'); }
    }
    const fw = window.tfEinblick && tfEinblick.fw ? tfEinblick.fw() : null;
    if (fw && fw.stufe === 'warnung') { st = 2; gruende.push('Schutzmodus'); } else if (fw && fw.stufe === 'achtung' && st < 1) { st = 1; gruende.push('Frühwarnung'); }
    const ue = window.tfSteuerung && tfSteuerung.ueberlastung ? tfSteuerung.ueberlastung() : null;
    if (ue) { st = 2; gruende.push('Tune fällt seit 3 Tagen bei hoher Last'); }
    if (s.sport === 'laufen') {
      const K = window.tfSteuerung && tfSteuerung.kanaele ? tfSteuerung.kanaele() : null, b = K && K.jetzt ? K.jetzt.bein_acwr : null;
      if (b != null && b > 1.5 && st < 2) { st = 2; gruende.push('Bein-Last stark gestiegen (ACWR ' + nf(b, 2) + ')'); }
      else if (b != null && b > 1.3 && st < 1) { st = 1; gruende.push('Bein-Last erhöht (ACWR ' + nf(b, 2) + ')'); }
    }
    return st ? { stufe: st === 2 ? 'rot' : 'gelb', grund: gruende.join(' · ') } : null;
  }
  const HAUPT_RE = /(\d+)\s*×\s*(\d+(?:,\d+)?)\s*(min|km|m)\b/;
  function autoReg(s, D, datum, PL, w) {
    const a0 = autoStufe(s, datum); if (!a0) return null;
    const a = athlet(), aend = [];
    let D2 = null, min = s.min;
    const locker = (m) => { min = Math.max(15, r5(m)); const x = beschreiben(Object.assign({}, s, { typ: s.sport === 'schwimmen' ? 'technik' : 'locker', min, hart: 0, lang: false, q: false }), PL, w); return x; };
    if (a0.stufe === 'rot') {
      if (s.sport === 'kraft') {
        min = Math.min(s.min, 25);
        D2 = Object.assign({}, D, { titel: 'Kraft: leichte Aktivierung', art: 'kraft', bau: ['5 min aufwärmen', '4–5 Übungen leicht: 2 × 10–12 kontrolliert, weit weg vom Muskelversagen', 'keine schweren Beinübungen'], link: D.link ? Object.assign({}, D.link, { fn: () => window.tfGym && tfGym.vorlage && tfGym.vorlage({ vorlage: 'ganz', ziel: 'stabil', dauer: Math.min(30, s.min) }) }) : null });
        aend.push('leicht statt schwer', min + ' statt ' + s.min + ' min');
      } else if (s.hart >= 1 || s.lang || s.typ === 'test' || QUAL.includes(s.typ)) {
        D2 = locker(Math.min(s.min, AUTO_CAP[s.sport] || 40));
        aend.push('locker statt ' + D.titel, min + ' statt ' + s.min + ' min');
      } else {
        D2 = locker(s.min * 0.75);
        if (min >= s.min) return null;
        aend.push(min + ' statt ' + s.min + ' min');
      }
      if (s.sport === 'laufen' && PL.E.some((x) => x !== 'laufen')) aend.push(PL.E.includes('rad') ? 'lieber Rad statt Laufen, wenn es geht' : 'lieber Schwimmen statt Laufen, wenn es geht');
      const z = ziele(s.sport === 'kraft' ? 'kraft' : s.sport, 'locker', PL); if (z.length && s.sport !== 'kraft') aend.push('Deckel: ' + z[0]);
    } else { // gelb
      if (s.sport === 'kraft') {
        D2 = Object.assign({}, D, { bau: D.bau.map((t) => t.replace(/(\d+)(?:–(\d+))? × /, (m0, x, y) => (y ? Math.max(1, +x - 1) + '–' + Math.max(1, +y - 1) : Math.max(1, +x - 1)) + ' × ')).concat(['heute je Übung 1 Satz weniger und 1 Wiederholung mehr Reserve – Gewicht gleich']) });
        aend.push('1 Satz weniger je Übung', 'mehr Reserve');
      } else if (s.typ === 'test') {
        D2 = locker(Math.min(45, s.min)); aend.push('Test verschieben – an einem mittleren Tag misst er nicht deine echte Form', 'heute ' + min + ' min locker');
      } else if (s.lang) {
        min = r5(s.min * 0.8);
        D2 = Object.assign({}, beschreiben(Object.assign({}, s, { min, typ: 'lang' }), PL, Object.assign({}, w, { phase: 'grundlage' })), {}); // Version 24: ohne Rennblöcke und schnelles Ende
        aend.push(min + ' statt ' + s.min + ' min', 'ganz locker – Renntempo-Teile heute weglassen');
      } else if (QUAL.includes(s.typ) || s.hart >= 2) {
        const bau = D.bau.slice(), j = bau.findIndex((t) => HAUPT_RE.test(t) || /am Stück/.test(t));
        let weniger = 0;
        if (j >= 0) {
          const t = bau[j], m = HAUPT_RE.exec(t);
          if (m) {
            const n = +m[1], len = +m[2].replace(',', '.'), u = m[3];
            const pauseMin = /dazwischen\s*(\d+)\s*min/.exec(t) ? +/dazwischen\s*(\d+)\s*min/.exec(t)[1] : /gleich lang/.test(t) ? len : /(\d+)\s*s Pause/.test(t) ? +/(\d+)\s*s Pause/.exec(t)[1] / 60 : 2;
            const proRep = u === 'min' ? len + pauseMin : u === 'km' ? len * ((a.vt2_pace_s_km || 300) / 60) + pauseMin : (len / 100) * ((a.css_s_100m || 110) / 60) + pauseMin;
            if (n >= 3) { const n2 = Math.max(2, Math.round((n * 2) / 3)); bau[j] = t.replace(m[0], n2 + ' × ' + m[2] + ' ' + u); weniger = (n - n2) * proRep; aend.push(n2 + ' statt ' + n + ' Wiederholungen'); }
            else { const l2 = u === 'min' ? Math.max(3, Math.round((len * 2) / 3)) : +(len * 0.67).toFixed(1); bau[j] = t.replace(m[0], n + ' × ' + String(l2).replace('.', ',') + ' ' + u); weniger = n * (len - l2) * (u === 'min' ? 1 : u === 'km' ? (a.vt2_pace_s_km || 300) / 60 : (a.css_s_100m || 110) / 6000); aend.push(n + ' × ' + String(l2).replace('.', ',') + ' statt ' + n + ' × ' + m[2] + ' ' + u); }
          } else {
            const x = /(\d+)\s*min am Stück/.exec(t);
            if (x) { const l2 = Math.max(10, r5((+x[1] * 2) / 3)); bau[j] = t.replace(x[0], l2 + ' min am Stück'); weniger = +x[1] - l2; aend.push(l2 + ' statt ' + x[1] + ' min am Stück'); }
          }
        }
        min = Math.max(25, r5(s.min - weniger));
        let zz = D.ziele;
        if (s.typ === 'vo2' || s.typ === 'sprint') { zz = ziele(s.sport, 'schwelle', PL); aend.push('höchstens Schwelle statt ganz hart'); }
        else aend.push('am unteren Ende des Zielbereichs');
        D2 = Object.assign({}, D, { bau, ziele: zz, art: s.typ === 'vo2' || s.typ === 'sprint' ? 'schwelle' : D.art });
        if (!weniger && !aend.length) return null;
      } else return null;
    }
    if (!D2) return null;
    D2 = Object.assign({}, D2, { titel: D2.titel, warum: 'Heute angepasst (' + a0.grund + '): Der Reiz bleibt, die Belastung passt zu dem, was dein Körper gerade verkraftet. Harte Einheiten wirken an guten Tagen besser – die verschobene Härte holst du nach.' });
    return { stufe: a0.stufe, grund: a0.grund, D: D2, min, aenderungen: aend, quelle: 'Kiviniemi et al., Eur J Appl Physiol 2007 · Javaloyes et al., IJSPP 2019' };
  }
  const autoWahl = (datum, k) => { try { const o = JSON.parse(localStorage.getItem('tf:autoreg') || 'null'); return o && o.d === datum && o.k === k ? o.w : null; } catch (e) { return null; } };
  const autoWahlSetzen = (datum, k, w) => { try { localStorage.setItem('tf:autoreg', JSON.stringify({ d: datum, k, w })); } catch (e) { /* nur auf diesem Gerät */ } };
  function autoBox(R, datum, k, neuZeichnen) { // Hinweis „Heute angepasst“ mit Umschalter
    const orig = autoWahl(datum, k) === 'original';
    const b = el('button', { type: 'button', class: 'tf-gym-link' }, orig ? 'Angepasste Version zeigen' : 'Original zeigen');
    b.addEventListener('click', (e) => { e.stopPropagation(); autoWahlSetzen(datum, k, orig ? 'angepasst' : 'original'); neuZeichnen(); });
    return el('p', { class: 'tf-pl-tf tf-pl-auto ' + R.stufe }, dot(R.stufe === 'rot' ? 'red' : 'yellow'),
      el('span', null, el('b', { text: orig ? 'Vorschlag für heute: ' : 'Heute angepasst: ' }), R.aenderungen.join(' · ') + '. ', T.ui.warum ? T.ui.warum('Grund: ' + R.grund + '. Der Plan bleibt, wie er ist – nur die heutige Einheit wird leichter. Fühlst du dich gut, kannst du das Original wählen.', R.quelle) : null, ' ', b));
  }

  /* ---------- Version 13: Doppeltage und Koppel – zwei Einheiten an einem Tag summieren sich ----------
     Die zweite Einheit beginnt mit leereren Speichern und müden Muskeln. Mit Abstand (Kraft nach Ausdauer am besten
     ≥ 6 h, Robineau et al., J Strength Cond Res 2016), Essen dazwischen (≈ 1 g Kohlenhydrate pro kg in den ersten Stunden,
     Burke et al., J Sports Sci 2011) und der wichtigeren Einheit zuerst bleibt ihr Reiz erhalten. */
  function doppelTag(L, w, PL) {
    const U = L.filter((s) => s.sport !== 'mobil' && s.typ !== 'rennen'); if (U.length < 2) return null;
    const last = U.reduce((x, s) => { const l = lastVon(s, w, PL); return { tss: x.tss + l.tss, bein: x.bein + l.bein, kreis: x.kreis + l.kreis }; }, { tss: 0, bein: 0, kreis: 0 });
    const koppel = U.some((s) => s.typ === 'koppel'), kraft = U.some((s) => s.sport === 'kraft'), aus = U.filter((s) => AUSDAUER.includes(s.sport));
    const hart = U.filter((s) => (s.hart >= 2 && s.sport !== 'schwimmen') || s.lang).length >= 2;
    const text = koppel ? 'Koppeltag: Rad und Lauf direkt nacheinander – zusammen etwa ' + last.tss + ' Belastungspunkte.'
      : kraft && aus.length ? 'Doppeltag: erst die Ausdauer, Kraft danach – am besten mit 6 Stunden Abstand. Zusammen etwa ' + last.tss + ' Punkte.'
        : 'Doppeltag: zwischen den Einheiten 4–6 Stunden Pause, dazwischen essen (etwa 1 g Kohlenhydrate pro kg). Zusammen etwa ' + last.tss + ' Punkte.';
    return { last, text: text + (hart ? ' Zwei harte Einheiten an einem Tag zählen wie ein sehr harter Tag – der Tag danach bleibt locker.' : ''), hart, koppel };
  }

  /* ---------- Version 13: Bein-Badge – harte oder lange Läufe 24–48 h nach Kraft für die Beine ---------- */
  const BEIN_TYP = new Set(['kraft_unten', 'kraft_lauf', 'kraft_ganz', 'kraft_rad', 'kraft_explosiv']);
  function beinBadge(PL, i, d, s) {
    if (s.sport !== 'laufen' || !(s.hart >= 2 || s.lang || s.typ === 'test' || QUAL.includes(s.typ))) return null;
    const w = PL.W[i], datum = plus(w.start, d);
    if (datum < localDate()) return null;
    const M = window.tfAlltagMotor;
    if (M && M.interferenz && window.tfGym && tfGym.log && datum <= plus(localDate(), 1)) { // schon trainiert: echte Sätze aus dem Gym
      const r = M.interferenz({ gym: tfGym.log(), datum, einheiten: [s] }); if (r) return { wann: r.wann === 'heute' ? 'nach Beintraining heute' : r.wann === 'gestern' ? '24 h nach Beintag' : '48 h nach Beintag', echt: true, stufe: r.stufe };
    }
    const vorTag = (n) => { const dt = plus(datum, -n); if (dt < localDate()) return []; const j = wocheIndex(PL, dt); return j == null ? [] : wocheVon(PL, j).ES[wt(dt)]; };
    const kraft = (L) => L.find((x) => x.sport === 'kraft' && BEIN_TYP.has(x.typ) && kraftZiel(PL.W[wocheIndex(PL, datum)] || w, PL) !== 'stabil');
    if (kraft(vorTag(1))) return { wann: '24 h nach Beintag', echt: false, stufe: s.hart >= 2 ? 'warnung' : 'hinweis' };
    const k2 = vorTag(2).find((x) => x.sport === 'kraft' && x.typ === 'kraft_unten');
    if (k2) return { wann: '48 h nach Beintag', echt: false, stufe: 'hinweis' };
    return null;
  }

  /* ---------- Version 10: Tage verschieben ----------
     Zwei Wochentage tauschen ihre Einheiten – nur in dieser Woche oder ab jetzt jede Woche (nicht in der Rennwoche).
     Stehen danach zwei harte Tage direkt nebeneinander, wird eine der harten Einheiten locker: Zwischen harten Tagen
     gehört ein lockerer (Seiler, IJSPP 2010). Was du bewusst verschoben hast, bleibt dabei, wie es ist; lange Einheiten
     und Tests bleiben ebenfalls – zwei lange Tage hintereinander (Sa Rad, So Lauf) sind gewollt. */
  const TAUSCH_MAX = 30;
  const gueltigT = (t) => t && /^\d{4}-\d\d-\d\d$/.test(t.ab || '') && (t.bis == null || /^\d{4}-\d\d-\d\d$/.test(t.bis)) && Number.isInteger(t.von) && Number.isInteger(t.nach) && t.von >= 0 && t.von < 7 && t.nach >= 0 && t.nach < 7 && t.von !== t.nach;
  function tauschFuer(i, PL) {
    const Q = (P && Array.isArray(P.tausch) ? P.tausch : null) || (Array.isArray(PL.P.tausch) ? PL.P.tausch : []), w = PL.W[i];
    if (!w) return [];
    return Q.filter((t) => gueltigT(t) && t.ab <= w.start && (!t.bis || w.start <= t.bis) && (t.bis || w.phase !== 'rennwoche'));
  }
  const hartTag = (L) => L.reduce((m, s) => Math.max(m, s.sport === 'schwimmen' ? Math.min(1, s.hart) : s.hart), 0);
  function anpassen(basis, Q) {
    const ES = basis.ES.map((L) => L.map((s) => Object.assign({}, s))), beruehrt = new Set(), gewollt = new Set(), notizen = [];
    Q.forEach((t) => {
      if (ES[t.von].concat(ES[t.nach]).some((s) => s.typ === 'rennen')) return; // der Renntag bleibt, wo er ist
      const a = ES[t.von]; ES[t.von] = ES[t.nach]; ES[t.nach] = a;
      ES[t.von].forEach((s) => { s.tag = t.von; }); ES[t.nach].forEach((s) => { s.tag = t.nach; });
      beruehrt.add(t.von); beruehrt.add(t.nach); gewollt.delete(t.von); gewollt.add(t.nach);
    });
    const weich = (x) => ES[x].filter((s) => s.hart === 2 && s.sport !== 'schwimmen' && !s.lang && s.typ !== 'test' && s.typ !== 'rennen');
    for (let d = 0; d < 6; d++) {
      if (!(beruehrt.has(d) || beruehrt.has(d + 1)) || hartTag(ES[d]) < 2 || hartTag(ES[d + 1]) < 2) continue;
      const opt = [d, d + 1].filter((x) => weich(x).length && !gewollt.has(x)); // locker wird nur, was du nicht selbst dorthin gelegt hast
      if (!opt.length) { // bleibt nur deine eigene Wahl: nichts ändern, aber darauf hinweisen
        [d, d + 1].filter((x) => weich(x).length).forEach((x) => notizen.push({ art: 'warnung', tag: x, neben: x === d ? d + 1 : d }));
        continue;
      }
      const z = opt.length === 1 ? opt[0] : d + 1;
      weich(z).forEach((s) => { s.vorher = s.typ; s.typ = 'locker'; s.hart = 0; s.q = false; s.angepasst = z === d ? d + 1 : d; });
      notizen.push({ art: 'locker', tag: z, neben: z === d ? d + 1 : d });
    }
    return { w: basis.w, ES, tausch: Q, notizen };
  }
  function tauschen(von, nach, immer, PL, i) {
    const w = PL.W[i], heuteI = wocheIndex(PL, localDate());
    // „ab jetzt“ gilt ab dieser Woche, wenn beide Tage noch kommen – sonst ab der nächsten
    let ab = w.start;
    if (immer && i === heuteI && Math.min(von, nach) < wt(localDate())) ab = plus(w.start, 7);
    if (!Array.isArray(P.tausch)) P.tausch = [];
    P.tausch.push({ ab, bis: immer ? null : w.start, von, nach });
    if (P.tausch.length > TAUSCH_MAX) P.tausch = P.tausch.slice(-TAUSCH_MAX);
    if (ab === w.start) ersatzVerschieben(w, von, nach); // Version 17
    speichern(true);
  }
  function tauschWeg(t, PL, i) { // einmalig: löschen · ab jetzt: ab dieser Woche beenden
    const w = PL.W[i], gleich = (x) => x && x.ab === t.ab && (x.bis || null) === (t.bis || null) && x.von === t.von && x.nach === t.nach;
    const rest = (P.tausch || []).filter((x) => !gleich(x));
    if (!t.bis && t.ab < w.start) rest.push({ ab: t.ab, bis: plus(w.start, -7), von: t.von, nach: t.nach });
    P.tausch = rest;
    if (t.ab <= w.start) ersatzVerschieben(w, t.von, t.nach); // Version 17: zurück an den alten Tag
    speichern(true);
  }
  /* ---------- Version 13: Domino-Vorschau – die Woche vor und nach dem Verschieben ----------
     Säulen je Tag: unten die Last für Beine und Stützapparat, oben die für den Kreislauf (geschätzte TSS). Die Säulen
     wachsen von „vorher“ auf „nachher“; was die App dabei locker macht oder anmerkt, steht darunter. */
  function tagLast(L, w, PL) { return L.reduce((x, s) => { const l = lastVon(s, w, PL); return { tss: x.tss + l.tss, bein: x.bein + l.bein, kreis: x.kreis + l.kreis }; }, { tss: 0, bein: 0, kreis: 0 }); }
  function dominoStreifen(PL, i, ESvor, nachher, getauscht) {
    const w = PL.W[i], ESn = nachher.ES, A0 = ESvor.map((L) => tagLast(L, w, PL)), A1 = ESn.map((L) => tagLast(L, w, PL));
    const max = Math.max(40, ...A0.map((x) => x.bein + x.kreis), ...A1.map((x) => x.bein + x.kreis));
    const hartV = ESvor.map(hartTag), hartN = ESn.map(hartTag), cols = [];
    for (let d = 0; d < 7; d++) {
      const b = el('i', { class: 'b', style: 'height:' + ((100 * A0[d].bein) / max).toFixed(1) + '%' }), k = el('i', { class: 'k', style: 'height:' + ((100 * A0[d].kreis) / max).toFixed(1) + '%' });
      const geist = el('span', { class: 'tf-dom-geist', style: 'height:' + ((100 * (A0[d].bein + A0[d].kreis)) / max).toFixed(1) + '%' });
      const neu = (getauscht || []).includes(d), wurdeLocker = ESn[d].some((s) => s.angepasst != null);
      cols.push([el('div', { class: 'tf-dom-t' + (neu ? ' neu' : '') + (hartN[d] >= 2 ? ' hart' : '') + (wurdeLocker ? ' locker' : '') },
        el('div', { class: 'tf-dom-s' }, geist, k, b), el('small', { text: WT[d] }), el('i', { class: 'tf-dom-p', 'aria-hidden': 'true' })), b, k, A1[d]]);
    }
    const reihe = el('div', { class: 'tf-dom', role: 'img', 'aria-label': 'Last je Tag nach dem Verschieben' }, ...cols.map((c) => c[0]));
    requestAnimationFrame(() => requestAnimationFrame(() => cols.forEach(([, b, k, a]) => { b.style.height = ((100 * a.bein) / max).toFixed(1) + '%'; k.style.height = ((100 * a.kreis) / max).toFixed(1) + '%'; })));
    const N = nachher.notizen || [], text = [];
    N.forEach((n) => { if (n.art === 'locker') text.push(WT_LANG[n.tag] + ' wird locker – daneben (' + WT[n.neben] + ') ist jetzt ein harter Tag.'); else text.push('Achtung: ' + WT_LANG[n.tag] + ' und ' + WT_LANG[n.neben] + ' sind beide hart.'); });
    for (let d = 1; d < 7; d++) if (hartN[d] >= 2 && hartN[d - 1] >= 2 && !(hartV[d] >= 2 && hartV[d - 1] >= 2) && !N.some((n) => (n.tag === d || n.tag === d - 1))) text.push('Achtung: ' + WT_LANG[d - 1] + ' und ' + WT_LANG[d] + ' sind beide hart.');
    const lauf = ESn.findIndex((L, d) => L.some((s) => s.sport === 'laufen' && (s.hart >= 2 || s.lang)) && d > 0 && ESn[d - 1].some((s) => s.sport === 'kraft' && BEIN_TYP.has(s.typ)));
    if (lauf > 0) text.push('Harter oder langer Lauf am ' + WT_LANG[lauf] + ' – 24 h nach Kraft für die Beine.');
    return el('div', { class: 'tf-dom-box' }, el('div', { class: 'tf-dom-k' }, el('b', { text: 'So sieht die Woche dann aus' }), el('span', { class: 'tf-dom-leg' }, el('i', { class: 'b' }), 'Beine', el('i', { class: 'k' }), 'Kreislauf', el('i', { class: 'g' }), 'vorher')), reihe,
      el('p', { class: 'tf-dom-n', text: text.length ? text.join(' ') : 'Keine Konflikte – harte Tage bleiben getrennt.' }));
  }
  /* Version 13: Daten für „Was wäre, wenn …?“ (steuerung.js) – nichts wird gespeichert, bis du übernimmst */
  function simDaten() {
    laden(); if (!P) return null;
    const PL = planJetzt(), h0 = localDate(), i = wocheIndex(PL, h0); if (i == null) return null;
    const w = PL.W[i];
    const tageVon = (ES, ww) => ES.map((L, d) => ({ d, datum: plus(ww.start, d), L: L.map((s) => { const D = beschreiben(s, PL, ww); return { titel: D.titel, art: D.art, sport: s.sport, typ: s.typ, hart: s.hart, lang: !!s.lang, min: s.min, last: lastVon(s, ww, PL), angepasst: s.angepasst != null }; }) }));
    const basis = wocheVon(PL, i);
    const spaeter = []; for (let j = i + 1; j < Math.min(PL.N, i + 3); j++) spaeter.push(...tageVon(wocheVon(PL, j).ES, PL.W[j]));
    return {
      woche: i, start: w.start, heute: wt(h0), phase: PHASE[w.phase][0], renn: PL.rennen ? PL.P.rdatum : null,
      tage: tageVon(basis.ES, w), spaeter,
      vorschau: (von, nach) => { const W2 = wocheMit(PL, i, [{ ab: w.start, bis: w.start, von, nach }]); return { tage: tageVon(W2.ES, w), notizen: W2.notizen || [], ES: W2.ES }; },
      domino: (von, nach) => dominoStreifen(PL, i, basis.ES, wocheMit(PL, i, [{ ab: w.start, bis: w.start, von, nach }]), [von, nach]),
      uebernehmen: (von, nach) => { tauschen(von, nach, false, PL, i); offen = null; woche = i; renderPlan(); },
    };
  }
  // Blatt „Tag verschieben“: Zieltag mit Inhalt, nur diese Woche oder ab jetzt
  function tauschBlatt(PL, i, d) {
    const w = PL.W[i], { ES } = wocheVon(PL, i), h0 = localDate(), datum = plus(w.start, d);
    const inhalt = (L) => (L.length ? L.map((s) => beschreiben(s, PL, w).titel).join(' + ') : 'Ruhetag');
    let nach = null, immer = false;
    const box = el('div', { class: 'tf-rm tf-pl-tb' });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: WT_LANG[d] + ' verschieben' }), el('p', { class: 'tf-rm-sub', text: inhalt(ES[d]) + ' · ' + dm(datum) }));
    const liste = el('div', { class: 'tf-pl-tb-l', role: 'radiogroup', 'aria-label': 'Auf welchen Tag?' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', disabled: true }, svgIco('i-tausch'), ' Verschieben');
    for (let x = 0; x < 7; x++) {
      if (x === d) continue;
      const dx = plus(w.start, x), vorbei = dx < h0, renn = ES[x].some((s) => s.typ === 'rennen');
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', class: 'tf-pl-tb-z', disabled: vorbei || renn },
        el('b', { text: WT_LANG[x] + ', ' + dm(dx) }), el('small', { text: vorbei ? 'schon vorbei' : renn ? 'Renntag' : ES[x].length ? 'Tauscht mit: ' + inhalt(ES[x]) : 'Ruhetag – dein ' + WT_LANG[d] + ' wird frei' }));
      b.addEventListener('click', () => { nach = x; $$('button', liste).forEach((y) => y.setAttribute('aria-checked', String(y === b))); ok.disabled = false; domino.replaceChildren(dominoStreifen(PL, i, ES, wocheMit(PL, i, [{ ab: w.start, bis: w.start, von: d, nach: x }]), [d, x])); });
      liste.appendChild(b);
    }
    const domino = el('div', { class: 'tf-pl-domino', 'aria-live': 'polite' }); // Version 13: Vorschau, wie sich die Woche neu ordnet
    const sg = el('div', { class: 'tf-seg tf-pl-tb-seg', role: 'group', 'aria-label': 'Wie lange?' });
    [[false, 'Nur diese Woche'], [true, 'Ab jetzt jede Woche']].forEach(([v, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v === immer) }, t);
      b.addEventListener('click', () => { immer = v; $$('button', sg).forEach((y, j) => y.setAttribute('aria-pressed', String((j === 1) === immer))); });
      sg.appendChild(b);
    });
    ok.addEventListener('click', () => {
      if (nach == null) return;
      tauschen(d, nach, immer, PL, i);
      if (window.tfWissen) tfWissen.schliessen();
      offen = null; renderPlan();
      const neu = wocheVon(planJetzt(), i), N = neu.notizen || [];
      A().toast(WT_LANG[d] + ' ↔ ' + WT_LANG[nach] + (immer ? ' – ab jetzt jede Woche' : '') + (N.some((n) => n.art === 'locker') ? ' · eine harte Einheit ist jetzt locker' : N.length ? ' · Achtung: zwei harte Tage hintereinander' : ''), 5000);
    });
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    ab.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    box.append(el('div', { class: 'tf-field' }, el('span', { text: 'Auf welchen Tag?' }), liste), domino,
      el('div', { class: 'tf-field' }, el('span', { text: 'Wie lange?' }), sg),
      el('p', { class: 'tf-note', text: 'Liegt am Zieltag schon eine Einheit, tauschen die beiden Tage. Stehen danach zwei harte Tage direkt nebeneinander, wird die andere harte Einheit locker – zwischen harten Tagen braucht dein Körper einen lockeren.' }),
      el('div', { class: 'tf-form-actions' }, ok, ab));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

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
  const SCHRITTE = ['Was trainierst du?', 'Was ist dein Ziel?', 'Wie viel Zeit hast du?', 'Wie erfahren bist du?', 'Feinschliff'];
  function assistent(box) {
    if (!E) E = P ? JSON.parse(JSON.stringify(P)) : neuerEntwurf();
    const c = el('article', { class: 'tf-card tf-pa' });
    const fort = el('div', { class: 'tf-pa-fort', 'aria-hidden': 'true' }, ...SCHRITTE.map((_, i) => el('i', { class: i <= schritt ? 'an' : '' })));
    c.append(fort, el('div', { class: 'tf-pa-nr', text: 'Schritt ' + (schritt + 1) + ' von ' + SCHRITTE.length }), el('h2', { class: 'tf-pa-h', text: SCHRITTE[schritt] }));
    const inhalt = el('div', { class: 'tf-pa-inhalt' }); c.appendChild(inhalt);
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const neu = () => { const y = window.scrollY; renderPlan(); window.scrollTo(0, y); };
    if (schritt === 0) {
      const ch = el('div', { class: 'tf-chipset' });
      VORLAGEN.forEach(([id, name, L]) => { const on = L.length === E.sporte.length && L.every((x) => E.sporte.includes(x)); const b = el('button', { type: 'button', 'aria-pressed': String(on) }, name); b.addEventListener('click', () => { E.sporte = L.slice(); if (id === 'fit') E.ziel = 'fit'; neu(); }); ch.appendChild(b); });
      inhalt.append(el('p', { class: 'tf-pa-t', text: 'Wähle eine Vorlage oder kombiniere frei – auch nur eine Sportart ist ein guter Plan.' }), ch);
      const grid = el('div', { class: 'tf-pa-sporte' });
      Object.entries(SP).filter(([id]) => id !== 'andere').forEach(([id, s]) => {
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
    if (schritt === 4) feinschliff(inhalt, neu);
    // Knöpfe
    const zur = el('button', { type: 'button', class: 'tf-btn' }, schritt === 0 ? (P ? 'Abbrechen' : 'Abbrechen') : 'Zurück');
    zur.addEventListener('click', () => { if (schritt === 0) { E = null; if (P) renderPlan(); else T.zurueck(); return; } schritt--; renderPlan(); });
    const vor = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, schritt === SCHRITTE.length - 1 ? (P ? 'Plan aktualisieren' : 'Plan erstellen') : 'Weiter');
    vor.addEventListener('click', () => {
      const f = pruefen(); if (f) { setMsg(msg, f, true); return; }
      if (schritt < SCHRITTE.length - 1) { schritt++; renderPlan(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const alt = P; P = Object.assign({}, E, { erledigt: (alt && alt.erledigt) || {}, erstellt: (alt && alt.erstellt) || localDate() });
      if (!alt || JSON.stringify(alt.tage) !== JSON.stringify(P.tage) || alt.lang !== P.lang || alt.start !== P.start) P.tausch = []; // neue Wochentage: alte Verschiebungen passen nicht mehr
      if (P.ziel !== 'rennen') { P.rsport = P.rsport || null; }
      E = null; schritt = 0; woche = null; cache.k = null;
      speichern(true); renderPlan(); window.scrollTo({ top: 0 });
      A().toast(alt ? 'Plan aktualisiert' : 'Dein Plan ist fertig');
    });
    c.append(msg, el('div', { class: 'tf-form-actions tf-pa-knoepfe' }, zur, vor));
    box.appendChild(c);
  }
  /* Version 12: Feinschliff – für alle, die tiefer einsteigen wollen. Alles optional, „Automatisch“ ist ein guter Plan. */
  function feinschliff(inhalt, neu) {
    const aus = AUSDAUER.some((x) => E.sporte.includes(x));
    const seg = (label, hilfe, feld, opts, wfrage) => {
      const g = el('div', { class: 'tf-seg tf-pa-seg tf-pa-fein', role: 'group', 'aria-label': label });
      opts.forEach(([v, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String((E[feld] == null ? null : E[feld]) === v) }, t); b.addEventListener('click', () => { if (v == null) delete E[feld]; else E[feld] = v; neu(); }); g.appendChild(b); });
      return el('div', { class: 'tf-field' }, el('span', null, label, wfrage ? T.ui.warum(wfrage[0], wfrage[1]) : null), g, el('small', { class: 'tf-ich-hint', text: hilfe }));
    };
    inhalt.appendChild(el('p', { class: 'tf-pa-t', text: 'Alles optional – mit „Automatisch“ wählt Dreiklang passend zu Ziel und Erfahrung. Hier stellst du nach, wenn du es genauer willst.' }));
    inhalt.appendChild(seg('Entlastungswoche', E.rhythmus === 3 ? 'Nach 2 Belastungswochen eine leichtere – gut für Einsteiger, Ältere und viel Alltagsstress.' : E.rhythmus === 4 ? 'Nach 3 Belastungswochen eine leichtere – der Klassiker für Geübte.' : 'Automatisch: Einsteiger alle 3, sonst alle 4 Wochen.', 'rhythmus',
      [[null, 'Automatisch'], [3, 'Alle 3 Wochen'], [4, 'Alle 4 Wochen']], ['In der leichteren Woche kommt die Anpassung an – stärker wirst du in der Erholung, nicht im Training selbst.', 'Issurin, Sports Med 2010']));
    if (aus) inhalt.appendChild(seg('Harte Einheiten', E.modell === 'pyr' ? 'Mehr Schwelle und Sweet Spot statt kurzer, sehr harter Intervalle – angenehm dosierbar, gut für Langdistanz.' : E.modell === 'pol' ? 'Im Aufbau mehr kurze, sehr harte Intervalle (VO2max) statt Schwelle – der Rest bleibt wirklich locker.' : 'Ausgewogen: je nach Phase Fahrtspiel, Schwelle, Renntempo und VO2max.', 'modell',
      [[null, 'Ausgewogen'], ['pyr', 'Mehr Schwelle'], ['pol', 'Mehr Spitze']], ['Beide Wege funktionieren, wenn rund 80 % locker bleiben. Pyramidal heißt: mehr mittlere Härte; polarisiert: fast nur locker oder sehr hart.', 'Stöggl & Sperlich, Front Physiol 2014 · Rosenblat et al., J Strength Cond Res 2019']));
    // Version 24: Längste Einheiten – wer lange Läufe oder Ausfahrten will, stellt sie hier ein
    const dauerKurz = (v) => (v >= 120 ? nf(v / 60, v % 60 ? 1 : 0) + ' h' : v + ' min');
    const langCap = (E2, x) => { const k = distKey(E2), R = k && RENN[k], nv = Math.max(0, NIV.indexOf(E2.niveau)); return ((R && R.lang && R.lang[x]) || (LANG_STD[E2.ziel] || LANG_STD.fit)[x])[nv]; };
    if (aus) {
      const PRESET = { laufen: [90, 120, 150, 180, 210, 240], rad: [120, 180, 240, 300, 360, 420], schwimmen: [45, 60, 75, 90, 120] };
      AUSDAUER.filter((x) => E.sporte.includes(x)).forEach((x) => {
        const g = el('div', { class: 'tf-seg tf-pa-seg tf-pa-fein', role: 'group', 'aria-label': 'Längste Einheit ' + SP[x].name });
        const cur = E.langMax && Number.isFinite(+E.langMax[x]) ? +E.langMax[x] : null;
        [[null, 'Automatisch']].concat(PRESET[x].map((v) => [v, v >= 120 ? nf(v / 60, v % 60 ? 1 : 0) + ' h' : v + ' min'])).forEach(([v, t]) => {
          const b = el('button', { type: 'button', 'aria-pressed': String(cur === v) }, t);
          b.addEventListener('click', () => { const L = Object.assign({}, E.langMax || {}); if (v == null) delete L[x]; else L[x] = v; if (Object.keys(L).length) E.langMax = L; else delete E.langMax; neu(); });
          g.appendChild(b);
        });
        inhalt.appendChild(el('div', { class: 'tf-field' }, el('span', null, 'Längste Einheit ' + SP[x].name, T.ui.warum ? T.ui.warum('Die lange Einheit bekommt die gewünschte Länge; die übrigen Einheiten der Woche werden dafür kürzer oder weniger. In Entlastungswochen und im Tapering bleibt sie kürzer. Sehr lange Einheiten kosten viel Erholung – sinnvoll vor allem für Marathon und Langdistanz.', 'Jeukendrup, Sports Med 2014 · Seiler, IJSPP 2010') : null), g,
          el('small', { class: 'tf-ich-hint', text: cur ? 'Bis ' + dauerKurz(cur) + ' – die Bibliothek erklärt jede Länge.' : 'Automatisch: bis etwa ' + dauerKurz(langCap(E, x)) + ', passend zu Ziel und Erfahrung.' })));
      });
    }
    if (E.sporte.includes('kraft')) inhalt.appendChild(seg('Krafttraining pro Woche', 'Zwei Einheiten reichen für die meisten – die WHO empfiehlt Kraft an mindestens 2 Tagen. In Entlastungswochen wird es weniger.', 'kraftN',
      [[null, 'Automatisch'], [1, '1×'], [2, '2×'], [3, '3×']], ['Zwei Krafteinheiten pro Woche bringen den größten Teil des Nutzens; mehr hilft vor allem beim Muskelaufbau.', 'Schoenfeld et al., Sports Med 2016 · WHO 2020']));
    if (E.sporte.includes('mobil')) inhalt.appendChild(seg('Pilates & Yoga pro Woche', 'Je 20 Minuten – für Rumpf, Rücken und Beweglichkeit.', 'mobilN', [[null, 'Automatisch'], [1, '1×'], [2, '2×'], [3, '3×']]));
    if (aus) {
      const cb = el('input', { type: 'checkbox', checked: !!E.tests });
      cb.addEventListener('change', () => { if (cb.checked) E.tests = true; else delete E.tests; });
      inhalt.appendChild(el('label', { class: 'tf-switch tf-pa-tests' }, cb, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Leistungstests einplanen', el('small', { text: 'In jeder zweiten Entlastungswoche ausgeruht: 20-Minuten-Test (Rad), 5 km (Laufen) oder CSS-Test (Schwimmen). So bleiben deine Zonen aktuell.' }))));
    }
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
      T.kopf({ sub: P ? 'Plan anpassen' : 'In fünf Schritten zu deinem Plan' });
      return;
    }
    const PL = planJetzt(), heuteI = wocheIndex(PL, localDate());
    if (woche == null || woche >= PL.N) woche = heuteI != null ? heuteI : localDate() < PL.start ? 0 : PL.N - 1;
    box.replaceChildren(...[ueberblick(PL, heuteI), wochenKarte(PL, woche), prognoseKarte(PL), warumKarte(PL), aktionen()].filter(Boolean)); // Version 16: Prognose
    const w = PL.W[woche];
    T.kopf({ sub: 'Woche ' + (woche + 1) + ' von ' + PL.N + ' · ' + PHASE[w.phase][0] + (w.leicht ? ' · Entlastung' : '') });
  }
  function intro() {
    const c = el('article', { class: 'tf-card tf-pa-intro' });
    const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-btn-wide' }, 'Plan erstellen');
    b.addEventListener('click', () => { E = neuerEntwurf(); schritt = 0; renderPlan(); });
    const punkte = [['i-tri', 'Jede Kombination', 'Laufen, Rad, Schwimmen, Kraft, Pilates & Yoga – einzeln oder zusammen.'], ['i-flag', 'Auf dein Ziel', 'Vom ersten 5-km-Lauf bis zur Langdistanz – oder einfach fit und gesund.'], ['i-cal', 'Passend zu deiner Woche', 'Deine Tage, deine Stunden, deine lange Einheit.'], ['i-book', 'Nach Studienlage', '80/20-Verteilung, langsame Steigerung, Entlastungswochen, Tapering.']];
    c.append(el('span', { class: 'tf-pa-intro-i' }, svgIco('i-cal')), el('h2', { text: 'Dein Trainingsplan' }), el('p', { class: 'tf-pa-t', text: 'Sag Dreiklang, was du trainierst, wofür und wie viel Zeit du hast. Du bekommst jede Woche fertig geplant – mit Erklärung zu jeder Einheit.' }),
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
    const WO = wocheVon(PL, i);
    for (let d = 0; d < 7; d++) {
      const datum = plus(w.start, d), L = ES[d], ist = datum === localDate();
      const zeile = el('div', { class: 'tf-pl-tag' + (ist ? ' heute' : '') + (L.length ? '' : ' frei'), 'data-tag': String(d) });
      const datB = el('div', { class: 'tf-pl-dat' }, el('small', { text: WT[d] }), el('b', { class: 'num', text: String(+datum.slice(8, 10)) }));
      // Version 10: Tag verschieben – heute und künftige Tage, nicht den Renntag
      if (datum >= localDate() && !L.some((s) => s.typ === 'rennen')) {
        const mv = el('button', { type: 'button', class: 'tf-pl-mv', 'aria-label': WT_LANG[d] + ' verschieben', title: 'Verschieben' }, svgIco('i-tausch'));
        mv.addEventListener('click', () => tauschBlatt(PL, i, d));
        datB.appendChild(mv);
        if (T.ui.wischen) { T.ui.wischen(zeile, () => tauschBlatt(PL, i, d), { text: 'Verschieben', weit: 84 }); zeile.dataset.wischArt = 'mv'; } // nach rechts wischen = verschieben
      }
      zeile.appendChild(datB);
      const rechts = el('div', { class: 'tf-pl-ein' });
      if (!L.length) rechts.appendChild(el('div', { class: 'tf-pl-ruhe', text: PL.rennen && datum > PL.P.rdatum && w.phase === 'rennwoche' ? 'Erholung nach dem Rennen' : 'Ruhetag' }));
      L.forEach((s) => {
        const D0 = beschreiben(s, PL, w), k = schluessel(datum, s), st = s.typ === 'rennen' ? { ok: false } : status(datum, s), sp = SP[s.sport];
        const R = ist && !st.ok ? autoReg(s, D0, datum, PL, w) : null, an = !!R && autoWahl(datum, k) !== 'original', D = an ? R.D : D0, mn = an ? R.min : s.min; // Version 13
        const bb = st.ok ? null : beinBadge(PL, i, d, s);
        const knopf = el('button', { type: 'button', class: 'tf-pl-e' + (offen === k ? ' auf' : '') + (st.ok ? ' ok' : st.verpasst ? ' verpasst' : ''), 'aria-expanded': String(offen === k), style: '--c:var(--tf-' + sp.farbe + ')' },
          el('span', { class: 'tf-pl-e-i' }, svgIco(s.typ === 'rennen' ? 'i-flag' : s.eigen ? eigenIcon(s.eigen) : sp.icon)),
          el('span', { class: 'tf-pl-e-t' }, el('b', { text: D.titel }), el('small', null, dauer(mn), D.km ? ' · ' + nf(D.km / 1000, 1) + ' km' : '', el('i', { class: 'tf-pl-art', style: 'background:var(--tf-' + (ART_FARBE[D.art] || 'gray') + ')' }), ART_NAME[D.art] || '',
            an ? el('span', { class: 'tf-pl-badge an', text: 'Angepasst' }) : null, s.entlastet ? el('span', { class: 'tf-pl-badge an', text: 'Entlastung' }) : null, s.eigen ? el('span', { class: 'tf-pl-badge eigen', text: 'Eigene' }) : null, s.ersetzt ? el('span', { class: 'tf-pl-badge an', text: 'Ersetzt' }) : null,
            bb ? el('span', { class: 'tf-pl-badge ' + bb.stufe, title: 'Harter oder langer Lauf kurz nach Kraft für die Beine' }, svgIco('i-alert'), ' ' + bb.wann) : null)),
          st.ok ? el('span', { class: 'tf-pl-hak' }, svgIco('i-check')) : (() => { const RF = sicher(() => profil(s, D)); return formVariiert(RF) ? el('span', { class: 'tf-pl-mini' }, formMini(RF, D)) : null; })());
        knopf.addEventListener('click', () => { offen = offen === k ? null : k; renderPlan(); });
        rechts.appendChild(knopf);
        if (s.angepasst != null) {
          const vorher = beschreiben(Object.assign({}, s, { typ: s.vorher, hart: 2, q: true }), PL, w).titel;
          rechts.appendChild(el('p', { class: 'tf-pl-tf tf-pl-angepasst' }, dot('blue'), el('span', null, 'Angepasst: locker statt ' + vorher + ' – am ' + WT_LANG[s.angepasst] + (s.wegen ? ' steht deine eigene harte Einheit. ' : ' ist schon ein harter Tag. '), T.ui.warum ? T.ui.warum(s.wegen ? 'Du hast daneben eine harte Einheit eingetragen. Zwei harte Tage direkt hintereinander ermüden mehr, als sie bringen – deshalb ist diese Einheit locker. Entfernst du deine Einheit, kommt die geplante zurück.' : 'Nach deinem Tausch lägen zwei harte Tage direkt nebeneinander. Dein Körper braucht dazwischen etwa 48 Stunden, deshalb ist diese Einheit heute locker – die Woche bleibt trotzdem gleich lang.', 'Seiler, Int J Sports Physiol Perform 2010') : null)));
        }
        if (s.sanft) { // Version 11: sanfte Woche
          const vorher = s.sanft.typ !== s.typ ? beschreiben(s.sanft, PL, w).titel : null;
          rechts.appendChild(el('p', { class: 'tf-pl-tf tf-pl-angepasst' }, dot('blue'), el('span', null, 'Sanfte Woche: ' + (vorher ? 'locker statt ' + vorher + ', ' : '') + 'etwa zwei Drittel der Zeit. ', T.ui.warum ? T.ui.warum('Nach ein paar Tagen Pause ist die Form noch da – aber Sehnen und Gelenke mögen einen ruhigen Wiedereinstieg. Wer sofort voll einsteigt, riskiert eher Überlastung.', 'Gabbett, Br J Sports Med 2016') : null)));
        }
        const warn = s.hart === 2 && !s.lang && (WO.notizen || []).find((n) => n.art === 'warnung' && n.tag === d);
        if (warn) rechts.appendChild(el('p', { class: 'tf-pl-tf tf-pl-angepasst' }, dot('orange'), el('span', null, 'Am ' + WT_LANG[warn.neben] + ' ist auch ein harter Tag. Zwei harte Tage hintereinander ermüden mehr – wenn es geht, nimm einen anderen Tag oder mach diese Einheit etwas kürzer. ', T.ui.warum ? T.ui.warum('Du hast diese Einheit selbst hierher gelegt – deshalb ändert die App sie nicht, sondern sagt dir nur Bescheid.') : null)));
        if (R) rechts.appendChild(autoBox(R, datum, k, renderPlan)); // Version 13: konkret angepasst
        if (s.entlastet) rechts.appendChild(entlastBox(s, datum, renderPlan));
        if (offen === k) rechts.appendChild(detail(s, D, datum, k, st, bb));
      });
      (WO.notizen || []).filter((n) => n.art === 'frei' && n.tag === d).forEach((n) => { // Version 17: frei gelassen
        const x = el('button', { type: 'button', class: 'tf-gym-link' }, 'Zurücknehmen');
        x.addEventListener('click', () => { ersatzWeg(n.id); renderPlan(); A().toast('Wieder im Plan'); });
        rechts.appendChild(el('p', { class: 'tf-pl-tf tf-pl-frei' }, dot('gray'), el('span', null, beschreiben(n.s, PL, w).titel + ' (' + dauer(n.s.min) + ') entfällt' + (n.woche ? ' – diese Woche ohne ' + ERSATZ_NAME[n.s.sport] : '') + '. ', x)));
      });
      const dt = doppelTag(L, w, PL); // Version 13: zwei Einheiten an einem Tag
      if (dt) rechts.appendChild(el('p', { class: 'tf-pl-tf tf-pl-doppel' }, dot(dt.hart ? 'orange' : 'blue'), el('span', null, dt.text + ' ', T.ui.warum ? T.ui.warum('Zwei Einheiten summieren sich: Die zweite beginnt mit leereren Speichern und müden Muskeln. Mit Abstand, Essen dazwischen und der wichtigeren Einheit zuerst bleibt ihr Reiz erhalten.', 'Robineau et al., J Strength Cond Res 2016 · Burke et al., J Sports Sci 2011') : null)));
      zeile.appendChild(rechts);
      tageBox.appendChild(zeile);
    }
    c.appendChild(tageBox);
    const neu = el('button', { type: 'button', class: 'tf-btn tf-pl-plus', id: 'plan-eigen' }, svgIco('i-plus'), ' Einheit hinzufügen'); // Version 15
    neu.addEventListener('click', () => eigenBlatt(PL, i));
    c.appendChild(el('div', { class: 'tf-form-actions tf-pl-plus-a' }, neu, el('small', { text: 'Spontan oder geplant – auch andere Sportarten. Sie zählt in deiner Woche und Belastung mit.' })));
    if (i === wocheIndex(PL, localDate()) && window.tfSteuerung && tfSteuerung.wasWaere) { // Version 13
      const ww = el('button', { type: 'button', class: 'tf-btn tf-pl-ww', id: 'plan-waswaere' }, svgIco('i-wave'), ' Was wäre, wenn …?');
      ww.addEventListener('click', () => tfSteuerung.wasWaere());
      c.appendChild(el('div', { class: 'tf-form-actions tf-pl-ww-a' }, ww, el('small', { text: 'Einheit verschieben und sehen, wie frisch du am Wochenende bist' })));
    }
    // Version 10: Verschiebungen dieser Woche – mit Zurücknehmen
    if (WO.tausch && WO.tausch.length) {
      const L = el('div', { class: 'tf-pl-tl' }, el('b', { text: 'Verschoben in dieser Woche' }));
      WO.tausch.forEach((t) => {
        const x = el('button', { type: 'button', class: 'tf-gym-link' }, t.bis ? 'Zurücknehmen' : 'Ab dieser Woche nicht mehr');
        x.addEventListener('click', () => { tauschWeg(t, PL, i); renderPlan(); A().toast('Zurückgenommen'); });
        L.appendChild(el('p', { class: 'tf-pl-tl-z' }, svgIco('i-tausch'), el('span', null, WT[t.von] + ' ↔ ' + WT[t.nach] + (t.bis ? ' · nur diese Woche' : ' · jede Woche seit ' + dm(t.ab)) + ' ', x)));
      });
      c.appendChild(L);
    }
    if (H && (H.ampel === 'rot') && i === wocheIndex(PL, localDate())) c.appendChild(el('p', { class: 'tf-note', text: 'Gesteuert nach Tune: An Tagen mit niedriger HRV locker zu bleiben, brachte in Studien gleich gute oder bessere Fortschritte als starre Pläne (Kiviniemi et al. 2007; Javaloyes et al. 2019).' }));
    return c;
  }
  function entlastBox(s, datum, neuZeichnen) { // Version 13
    const vorher = (s.entlastet || []).map((x) => x.titel || (SP[x.sport] ? SP[x.sport].name : x.sport)).filter(Boolean);
    const PL = planJetzt(), i = wocheIndex(PL, datum), w = i == null ? null : PL.W[i];
    const namen = w ? (s.entlastet || []).map((x) => beschreiben(x, PL, w).titel) : vorher;
    const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Zurücknehmen');
    b.addEventListener('click', (e) => { e.stopPropagation(); entlasten(datum, false); A().toast('Entlastungstag zurückgenommen'); neuZeichnen(); });
    return el('p', { class: 'tf-pl-tf tf-pl-angepasst' }, dot('blue'), el('span', null, 'Entlastungstag: statt ' + (namen.length ? namen.join(' + ') : 'des Geplanten') + ' nur ' + s.min + ' min ganz locker – oder frei. ', T.ui.warum ? T.ui.warum('Dein Tune ist mehrere Tage gefallen, während die Last hoch war. Ein Tag Pause jetzt verhindert, dass aus der Ermüdung eine Woche wird.', 'Meeusen et al., Med Sci Sports Exerc 2013') : null, ' ', b));
  }
  function detail(s, D, datum, k, st, bb) {
    const box = el('div', { class: 'tf-pl-d' });
    const IF = datum <= plus(localDate(), 1) ? beinHinweis(datum, [s]) : null;
    if (IF) box.appendChild(IF);
    else if (bb && !bb.echt) box.appendChild(el('p', { class: 'tf-pl-tf tf-pl-bein' }, dot(bb.stufe === 'warnung' ? 'orange' : 'yellow'), el('span', { text: (bb.wann === '24 h nach Beintag' ? 'Am Vortag' : 'Zwei Tage vorher') + ' steht Kraft für die Beine. Schwere Beinsätze verschlechtern die Laufökonomie bis etwa 48 Stunden – leg die Kraft lieber direkt nach diesen Lauf (gleicher Tag, danach) oder auf einen lockeren Tag. Tippe beim Krafttag auf „Verschieben“.' })));
    const RF = sicher(() => profil(s, D)); if (formVariiert(RF)) box.appendChild(el('div', { class: 'tf-form-box' }, formChart(RF, D, s)));
    box.appendChild(el('ol', { class: 'tf-steps tf-pl-bau' }, ...D.bau.map((t) => el('li', { text: t }))));
    if (D.fuehl || D.ziele.length) box.appendChild(el('div', { class: 'tf-pl-ziel-box' }, el('small', { text: 'Zielbereich' }), D.ziele.length ? el('b', { text: D.ziele.join(' · ') }) : null, D.fuehl ? el('span', { text: D.fuehl }) : null));
    if (D.tipp) box.appendChild(el('p', { class: 'tf-pl-tipp' }, svgIco('i-drop'), D.tipp));
    if (D.warum) box.appendChild(el('p', { class: 'tf-pl-warum' }, el('b', { text: 'Warum: ' }), D.warum));
    if (D.quelle) box.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: D.quelle })));
    const akt = el('div', { class: 'tf-form-actions' });
    if (D.link) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, D.link.text); b.addEventListener('click', () => { if (D.link.fn) D.link.fn(); T.geh(D.link.ziel); }); akt.appendChild(b); }
    if (s.eigen) { // Version 15: was die eigene Einheit zählt
      const PL = planJetzt(), i = wocheIndex(PL, datum), l = i == null ? null : lastVon(s, PL.W[i], PL);
      if (l) box.appendChild(el('p', { class: 'tf-pl-tf tf-pl-eigen-n' }, dot('blue'), el('span', { text: 'Eigene Einheit – zählt mit etwa ' + l.tss + ' Belastungspunkten (TSS)' + (st.ok ? (st.quelle === 'du' ? ' in Fitness, Ermüdung und Form, geschätzt aus Dauer und Intensität.' : '. Deine Uhr hat sie aufgezeichnet – gezählt wird die Messung.') : ' in deiner Woche und der Prognose. Hakst du sie ab, zählt sie auch in Fitness und Form.') })));
    }
    if (s.ersetzt) { // Version 17: was vorher hier stand
      const PL = planJetzt(), i = wocheIndex(PL, datum), w = i == null ? null : PL.W[i];
      const o = Object.assign({}, s, { sport: s.ersetzt.sport, typ: s.ersetzt.typ, min: s.ersetzt.min, nr: s.ersetzt.nr, hart: s.ersetzt.hart, lang: s.ersetzt.lang });
      const x = el('button', { type: 'button', class: 'tf-gym-link' }, 'Zurücknehmen');
      x.addEventListener('click', () => { ersatzWeg(s.ersetzt.id); offen = null; renderPlan(); A().toast('Wieder ' + ERSATZ_NAME[o.sport]); });
      box.appendChild(el('p', { class: 'tf-pl-tf tf-pl-eigen-n' }, dot('blue'), el('span', null, 'Statt ' + (w ? beschreiben(o, PL, w).titel : ERSATZ_NAME[o.sport]) + ' (' + dauer(o.min) + ')' + (s.ersetzt.woche ? ' – diese Woche alle ' + ERSATZ_NAME[o.sport] + '-Einheiten. ' : ' – nur diese Einheit. '), x)));
    }
    if (s.typ !== 'rennen') {
      const b = el('button', { type: 'button', class: 'tf-btn' }, st.ok ? 'Nicht erledigt' : 'Als erledigt markieren');
      b.addEventListener('click', () => { if (s.eigen) eigenErledigt(s.eigen.id, st.ok ? 0 : 1); else { P.erledigt[k] = st.ok ? 0 : 1; speichern(); } renderPlan(); });
      akt.appendChild(b);
      if (s.eigen) {
        const x = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-danger' }, 'Entfernen');
        x.addEventListener('click', () => { eigenWeg(s.eigen.id); offen = null; renderPlan(); A().toast('Eigene Einheit entfernt'); });
        akt.appendChild(x);
      }
      if (ersetzbar(s) && datum >= localDate()) { // Version 17: andere Sportart für diese Einheit oder die Woche
        const r = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', id: 'plan-ersetzen' }, svgIco('i-shuffle'), ' Sportart ändern');
        r.addEventListener('click', () => { const PL = planJetzt(), i = wocheIndex(PL, datum); if (i != null) ersatzBlatt(PL, i, datum, s); });
        akt.appendChild(r);
      }
      if (s.sport === 'rad' && !s.eigen) {
        const z = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, svgIco('i-download'), ' Für Zwift (.zwo)');
        z.addEventListener('click', () => zwoExport(s, datum));
        akt.appendChild(z);
      }
      if (st.ok && st.quelle === 'garmin') box.appendChild(el('p', { class: 'tf-note', text: 'Erledigt laut Garmin: ' + st.min + ' min ' + SP[s.sport].name + ' am ' + dm(datum) + '.' }));
    }
    if (window.tfTeilen && s.typ !== 'rennen') { // Version 20: Einheit als Bild
      const tb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, svgIco('i-share'), ' Als Bild teilen');
      tb.addEventListener('click', () => tfTeilen.einheit(s, D, datum));
      akt.appendChild(tb);
    }
    box.appendChild(akt);
    return box;
  }
  /* ---------- Version 16: Leistungsprognose – deine Werte am Renntag als Spanne ----------
     FTP (mit W/kg beim Referenzgewicht), Schwellentempo (VT2, dazu die passende 5-km-Zeit) und CSS – je nachdem, was im
     Plan steht. Die Rechnung steht in alltag-motor.js (leistungsPrognose). Mit Rennen dazu die Zielzeit, die zu diesen
     Werten passt (Rennrechner). Nach einem Test zeigt die Karte, ob der neue Wert im erwarteten Bereich liegt. */
  const PROG_FELD = { ftp: ['ftp_ref_w', false, 'rad', 'FTP'], lauf: ['vt2_pace_s_km', true, 'laufen', 'Schwellentempo'], css: ['css_s_100m', true, 'schwimmen', 'CSS'] };
  const PROG_TEST = { ftp: '20-Minuten-Test', lauf: '5-km-Test', css: 'CSS-Test' };
  const MON_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const datumLang = (d) => +d.slice(8, 10) + '. ' + MON_LANG[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
  function schwelleVerlauf(a, feld, start) { // Wert zum Planstart und – falls er sich danach geändert hat – seit wann der jetzige gilt
    const L = (Array.isArray(a.schwellen) ? a.schwellen : []).filter((x) => x && x.ab && x.w && x.w[feld] != null).slice().sort((x, y) => (x.ab < y.ab ? -1 : 1));
    if (!L.length) return { basis: null, seit: null };
    let basis = +L[0].w[feld], seit = null, vor = null;
    L.forEach((x) => { const v = +x.w[feld]; if (x.ab <= start) basis = v; if (vor != null && v !== vor && x.ab > start) seit = x.ab; vor = v; });
    return { basis, seit: seit && +a[feld] !== basis ? seit : null };
  }
  function prognose(PL) {
    const M = window.tfAlltagMotor; if (!M || !M.leistungsPrognose) return null;
    const a = athlet(), P2 = PL.P, h0 = localDate();
    const ende = PL.rennen ? P2.rdatum : plus(PL.W[PL.N - 1].start, 6);
    if (!ende || ende <= plus(h0, 6)) return null; // weniger als eine Woche: nichts mehr zu rechnen
    const tw = PL.W.find((w) => w.phase === 'taper' || w.phase === 'rennwoche');
    const std = Array.isArray(a.standard) ? a.standard : [], werte = {}, fehlt = [];
    Object.entries(PROG_FELD).forEach(([k, [feld, tempo, sp]]) => {
      if (!P2.sporte.includes(sp)) return;
      if (std.includes(feld) || !(+a[feld] > 0)) { fehlt.push(k); return; }
      const h = schwelleVerlauf(a, feld, PL.start);
      werte[k] = { jetzt: +a[feld], tempo, basis: h.basis, seit: h.seit };
    });
    const tests = {}, iH = wocheIndex(PL, h0), SPK = { rad: 'ftp', laufen: 'lauf', schwimmen: 'css' };
    for (let i = iH == null ? (h0 < PL.start ? 0 : PL.N) : iH; i < PL.N; i++) {
      wocheVon(PL, i).ES.forEach((L, d) => L.forEach((s) => { const k = SPK[s.sport], dt = plus(PL.W[i].start, d); if (s.typ === 'test' && k && werte[k] && dt > h0 && !tests[k]) tests[k] = dt; }));
    }
    const B = PL.start <= plus(h0, -14) ? bilanz(plus(h0, -1)) : null; let g = 0, e = 0; // Plan-Treue erst nach zwei Wochen Plan
    if (B) Object.entries(B.tage).forEach(([d, x]) => { if (d >= plus(h0, -28)) { g += x[0]; e += x[1]; } });
    const R = M.leistungsPrognose({ niveau: NIV[PL.niv] || 'fortgeschritten', start: PL.start, heute: h0, ende: tw && tw.start > h0 ? tw.start : ende, treue: g >= 6 ? e / g : null, werte, tests });
    if (!R) return null;
    let zeit = null; // Zielzeit, die zu den Werten passt – mit den Einstellungen aus dem Rennrechner; nur, wenn jede Disziplin des Rennens einen eigenen Wert hat
    const legs = PL.rennen && PL.item ? PL.item.legs.map((l) => l.typ) : [];
    const eigenWert = (f) => !std.includes(f) && +a[f] > 0;
    const komplett = legs.length && (!legs.includes('swim') || eigenWert('css_s_100m')) && (!legs.includes('bike') || eigenWert('ftp_ref_w')) && (!legs.includes('run') || PL.item.legs.filter((l) => l.typ === 'run').every((l) => eigenWert(l.ref === 'vt1' ? 'vt1_pace_s_km' : 'vt2_pace_s_km')));
    if (PL.rennen && komplett && T.rrPrognose && Object.keys(R.werte).length) {
      const W = R.werte, mit = (j) => { const o = {}; if (W.ftp) o.ftp_ref_w = W.ftp.ziel[j]; if (W.css) o.css_s_100m = W.css.ziel[j]; if (W.lauf) { o.vt2_pace_s_km = W.lauf.ziel[j]; if (+a.vt1_pace_s_km > 0) o.vt1_pace_s_km = +a.vt1_pace_s_km / (1 + W.lauf.gewinn[j]); } return o; };
      let t0 = null, t1 = null, t2 = null;
      try { t0 = T.rrPrognose(P2.rsport, P2.rdist, {}); t1 = T.rrPrognose(P2.rsport, P2.rdist, mit(0)); t2 = T.rrPrognose(P2.rsport, P2.rdist, mit(1)); } catch (x) { t0 = null; }
      if (t0 && t1 && t2) zeit = { jetzt: t0, spanne: [Math.min(t1, t2), Math.max(t1, t2)] };
    }
    return Object.assign(R, { ende, fehlt, zeit, kg: +a.gewicht_ref_kg > 30 ? +a.gewicht_ref_kg : null });
  }
  function prognoseKarte(PL) {
    const R = prognose(PL); if (!R || (!Object.keys(R.werte).length && !R.fehlt.length)) return null;
    const P2 = PL.P;
    const c = karte({ farbe: 'blue', icon: 'i-target', titel: PL.rennen ? 'Deine Werte am Renntag' : 'Deine Werte am Planende', sub: (PL.rennen ? (P2.rname || PL.item.lang) + ' · ' : '') + datumLang(R.ende) + ' · wenn du so weitertrainierst', span2: true, id: 'plan-prognose', cls: 'tf-pl-prog' });
    const w = (v) => Math.round(v) + ' W', t = (v) => mmss(Math.round(v)), spanne = (a2, b2, f, u) => { const x = f(Math.min(a2, b2)), y = f(Math.max(a2, b2)); return (x === y ? x : x + '–' + y) + (u || ''); };
    const fk = (k, v) => (k === 'ftp' ? w(v) : t(v) + (k === 'lauf' ? ' /km' : ' /100 m'));
    const fz = (k, v) => (k === 'ftp' ? String(Math.round(v)) : t(v));
    const unit = { ftp: ' W', lauf: ' /km', css: ' /100 m' };
    const diff = (k, a2, b2) => { // Fortschritt in Worten: +12 W bzw. 6 s/km schneller
      if (k === 'ftp') return (b2 - a2 >= 0 ? '+' : '−') + Math.abs(Math.round(b2 - a2)) + ' W';
      const s = Math.round(a2 - b2); return s === 0 ? 'gleich schnell' : Math.abs(s) + ' s' + (k === 'lauf' ? '/km' : '/100 m') + (s > 0 ? ' schneller' : ' langsamer');
    };
    const liste2 = el('div', { class: 'tf-pl-prog-l' });
    Object.entries(R.werte).forEach(([k, r]) => {
      const name = PROG_FELD[k][3], z = el('div', { class: 'tf-pl-prog-z', 'data-k': k });
      z.appendChild(el('div', { class: 'tf-pl-prog-k' }, el('span', { class: 'tf-pl-prog-n', text: name }),
        el('span', { class: 'tf-pl-prog-w' }, el('small', { text: 'jetzt ' + fk(k, r.jetzt) }), el('b', { class: 'num', text: spanne(r.ziel[0], r.ziel[1], (v) => fz(k, v), unit[k]) }))));
      // Balken: links der Wert zum Planstart (oder jetzt), Punkt = du, Feld = Spanne am Ziel
      const L0 = r.stand ? r.stand.basis : r.jetzt, p = (x) => (r.tempo ? L0 / x - 1 : x / L0 - 1), max = Math.max(1e-6, p(r.ziel[1]) * 1.12, p(r.jetzt) * 1.05);
      const pos = (x) => Math.max(0, Math.min(100, (p(x) / max) * 100)).toFixed(1) + '%';
      z.appendChild(el('div', { class: 'tf-pl-prog-bar', 'aria-hidden': 'true' }, el('i', { class: 'ziel', style: 'left:' + pos(r.ziel[0]) + ';right:calc(100% - ' + pos(r.ziel[1]) + ')' }), el('i', { class: 'du', style: 'left:' + pos(r.jetzt) })));
      const zeilen = [];
      if (k === 'ftp' && R.kg) zeilen.push(spanne(r.ziel[0] / R.kg, r.ziel[1] / R.kg, (v) => nf(v, 1), ' W/kg') + ' bei ' + nf(R.kg, R.kg % 1 ? 1 : 0) + ' kg (jetzt ' + nf(r.jetzt / R.kg, 1) + ')');
      if (k === 'lauf') zeilen.push('5 km in etwa ' + spanne(r.ziel[0] * 5 / 1.065, r.ziel[1] * 5 / 1.065, t) + ' min');
      if (r.stand) zeilen.push('Seit Planstart ' + diff(k, r.stand.basis, r.jetzt) + ' – ' + (r.stand.lage === 'drueber' ? 'mehr als erwartet.' : r.stand.lage === 'im' ? 'im erwarteten Bereich.' : 'noch unter dem erwarteten Bereich. Ein Test nach harten Tagen fällt oft zu niedrig aus.'));
      if (r.test) {
        const tv = k === 'lauf' ? r.test.wert.map((v) => (v * 5) / 1.065) : r.test.wert, f2 = k === 'ftp' ? (v) => Math.round(v) + ' W' : (v) => t(v) + (k === 'css' ? ' /100 m' : ' min');
        const [lo, hi] = k === 'ftp' ? [Math.min(...tv), Math.max(...tv)] : [Math.max(...tv), Math.min(...tv)];
        zeilen.push(PROG_TEST[k] + ' am ' + dm(r.test.datum) + ': ' + (k === 'ftp' ? 'auf Kurs ab ' + f2(lo) + ', über Plan ab ' + f2(hi) : 'auf Kurs mit ' + f2(lo) + ' oder schneller, über Plan unter ' + f2(hi)) + '.');
      }
      if (zeilen.length) z.appendChild(el('ul', { class: 'tf-pl-prog-u' }, ...zeilen.map((x) => el('li', { text: x }))));
      liste2.appendChild(z);
    });
    c.appendChild(liste2);
    if (R.zeit) c.appendChild(el('div', { class: 'tf-pl-prog-zeit' }, el('span', { text: 'Zielzeit mit diesen Werten' }), el('b', { class: 'num', text: spanne(R.zeit.spanne[0], R.zeit.spanne[1], (v) => hmin(v), ' h') }), el('small', { text: 'Jetzt ' + hmin(R.zeit.jetzt) + ' h – gerechnet wie im Rennrechner, mit deinen Einstellungen dort.' })));
    if (R.fehlt.length) {
      const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Im Profil eintragen');
      b.addEventListener('click', () => T.geh('profil/athlet'));
      const mehr = R.fehlt.length > 1;
      c.appendChild(el('p', { class: 'tf-note tf-pl-prog-fehlt' }, 'Für ' + liste(R.fehlt.map((k) => PROG_FELD[k][3])) + (mehr ? ' fehlen noch deine eigenen Werte' : ' fehlt noch dein eigener Wert') + '. Mit ' + (mehr ? 'ihnen' : 'ihm') + ' rechnet die App auch dafür eine Spanne' + (PL.rennen ? ' und deine Zielzeit' : '') + '. ', b));
    }
    const q = R.treue == null ? null : Math.round(R.treue * 100);
    c.appendChild(el('p', { class: 'tf-note tf-pl-prog-fuss' }, 'Typischer Zuwachs für dein Niveau (' + NIV_TXT[NIV[PL.niv]][0] + ') in den ' + nf(Math.max(0, Math.round(R.rest))) + ' Wochen bis zum ' + (PL.rennen ? 'Tapering' : 'Planende') + '. Unteres Ende: ' + (q == null ? 'etwas weniger Training als geplant' : 'so viel vom Plan wie in den letzten 4 Wochen (' + q + ' %)') + ', oberes: fast alles klappt. ',
      T.ui.warum ? T.ui.warum('Je trainierter du bist, desto kleiner wird der Zuwachs – Einsteiger legen in einer Saison oft 10–20 % zu, sehr Trainierte eher 2–5 %. Der Zuwachs flacht über die Wochen ab. Nach jedem Test rechnet die App mit deinem neuen Wert weiter. Eine Orientierung, kein Versprechen.', 'Jones & Carter, Sports Med 2000 · Bacon et al., PLoS One 2013 · Laursen & Jenkins, Sports Med 2002') : null));
    return c;
  }
  function warumKarte(PL) {
    const c = karte({ farbe: 'gold', icon: 'i-book', titel: 'Warum der Plan so aussieht', sub: 'Die Regeln dahinter – mit Quellen', span2: true });
    const P2 = PL.P, R = [];
    if (PL.E.length) R.push(['Etwa 80 % locker', 'Die meisten Einheiten sind locker, nur wenige hart. So kannst du die harten wirklich hart machen – das Muster der besten Ausdauersportler.', 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014', 'polarisiert']);
    R.push(['Langsam steigern', 'Der Umfang steigt um höchstens etwa 10 % pro Woche, ausgehend von deinem jetzigen Training. Sprünge erhöhen das Verletzungsrisiko – Sehnen und Knochen passen sich langsamer an als Herz und Lunge.', 'Gabbett, Br J Sports Med 2016 · Nielsen et al., J Orthop Sports Phys Ther 2014', 'acwr']);
    R.push(['Entlastung alle ' + ([3, 4].includes(P2.rhythmus) ? P2.rhythmus : PL.niv === 0 ? 3 : 4) + ' Wochen', 'Eine leichtere Woche lässt die Anpassung ankommen. Stärker wirst du in der Erholung.', 'Issurin, Sports Med 2010', 'entlastungswoche']);
    if (PL.E.length && P2.modell === 'pyr') R.push(['Mehr Schwelle (pyramidal)', 'Deine harten Einheiten sind eher Schwelle und Sweet Spot als kurze Spitzen – gut dosierbar und nah am Renntempo langer Rennen. Die meisten Minuten bleiben trotzdem locker.', 'Stöggl & Sperlich, Front Physiol 2014', 'polarisiert']);
    if (PL.E.length && P2.modell === 'pol') R.push(['Mehr Spitze (polarisiert)', 'Im Aufbau ersetzen kurze, sehr harte Intervalle die Schwellenarbeit. Dafür bleibt der Rest konsequent locker – kaum Grauzone.', 'Seiler, IJSPP 2010', 'polarisiert']);
    if (PL.E.length && P2.tests) R.push(['Leistungstests', 'In jeder zweiten Entlastungswoche ein Test, wenn du ausgeruht bist. So passen Zonen, Watt und Tempo immer zu deiner aktuellen Form.', 'Allen & Coggan 2019 · Wakayoshi et al., Eur J Appl Physiol 1992', 'testen']);
    R.push(['Harte Tage hart, lockere locker', 'Zwischen harten Einheiten liegt mindestens ein lockerer Tag. ' + (P2.sporte.includes('kraft') && PL.E.length ? 'Kraft liegt bevorzugt auf den harten Tagen, damit die lockeren wirklich locker bleiben.' : ''), 'Seiler, IJSPP 2010', 'superkompensation']);
    if (P2.sporte.includes('kraft')) R.push([PL.E.length ? 'Kraft 1–2× pro Woche' : 'Kraft an mehreren Tagen', PL.E.length ? 'Schweres Krafttraining verbessert die Ökonomie und senkt Sportverletzungen deutlich – ohne dich schwerer zu machen.' : 'Jede große Muskelgruppe zweimal pro Woche bringt mehr als einmal.', PL.E.length ? 'Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Lauersen et al., Br J Sports Med 2014' : 'Schoenfeld et al., Sports Med 2016', 'maximalkraft']);
    if (PL.rennen) R.push(['Tapering vor dem Rennen', 'In den letzten Wochen sinkt der Umfang stufenweise um 40–60 %, die Intensität bleibt. So bist du am Renntag frisch und fit zugleich.', 'Bosquet et al., Med Sci Sports Exerc 2007', 'tapering']);
    if (P2.ziel === 'fit') R.push(['Nach WHO-Empfehlung', '150–300 Minuten moderate Bewegung pro Woche und Kraft an zwei Tagen – das schützt Herz, Stoffwechsel und Psyche.', 'Bull et al., Br J Sports Med 2020', 'who']);
    R.push(['Hör auf deinen Körper', 'Ist dein Tune rot, wird aus der harten Einheit eine lockere. HRV-gesteuertes Training brachte in Studien gleich gute oder bessere Ergebnisse.', 'Kiviniemi et al., Eur J Appl Physiol 2007 · Javaloyes et al., IJSPP 2019', 'hrv_korridor']);
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
    const a3 = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'plan-kalender' }, svgIco('i-cal'), ' In Kalender exportieren');
    a3.addEventListener('click', kalenderBlatt);
    return el('div', { class: 'tf-form-actions tf-pl-akt' }, a3, a1, a2);
  }

  /* ---------- Version 12: Heute – die Einheit als große Karte (nach dem Vorbild „Clubhouse“) ----------
     Gestern | Heute | Morgen, Titel mit Punkt, Fokus, Dauer und Zielbereich, der Ablauf als Balken (Intervalle)
     oder als Lineal mit dem Zielbereich (gleichmäßige Einheiten). Farbe der Bühne nach Härte. */
  const BUEHNE = { locker: 'blau', mittel: 'blau', schwelle: 'daemmer', sweetspot: 'daemmer', renn: 'pink', hart: 'pink', test: 'pink', kraft: 'tinte', mobil: 'flieder', ruhe: 'ruhe' };
  const STUFE = { schwelle: 0.82, sweetspot: 0.74, hart: 0.96, renn: 0.78, mittel: 0.62, test: 1, locker: 0.5 };
  const WT_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const MON_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const tagKurz = (d) => WT_KURZ[wt(d)] + ' ' + +d.slice(8, 10) + '. ' + MON_KURZ[+d.slice(5, 7) - 1];
  /* ---------- Version 20: Form der Einheit für jede Einheit – Abschnitte [{ min, h, t, hoch }] ----------
     min = Dauer (bei Schwimmen Meter/100), h = Höhe 0–1 (Anstrengung), t = Beschriftung, hoch = zählt als harter Teil. */
  function profil(s, D) {
    if (!D || !D.bau || !D.bau.length) return null;
    const zahl = (re, t) => { const x = re.exec(t || ''); return x ? +String(x[1]).replace(',', '.') : null; };
    const mz = (v) => String(Math.round(v * 10) / 10).replace('.', ',') + '′';
    const m = s.min || 0, art = D.art || 'locker', R = [], h = STUFE[art] || 0.8, typ = s.typ || '';
    const seg = (min, hh, t, hoch) => { if (min > 0) R.push({ min, h: hh, t: t || '', hoch: !!hoch }); };
    const reihe = (n, an, ab, hAn, hAb) => { for (let k = 0; k < n; k++) { seg(an, hAn, k === 0 || k === n - 1 ? mz(an) : '', true); if (k < n - 1) seg(ab, hAb, k === 0 ? mz(ab) : ''); } };
    const ein0 = zahl(/^(\d+)\s*min\s*(?:ein|aufw|zügig gehen)/i, D.bau[0]), aus0 = zahl(/^(\d+)\s*min\s*(?:aus|ab|gehen)/i, D.bau[D.bau.length - 1]);
    const haupt = D.bau.find((b) => /\d+\s*×\s*\d+(?:,\d+)?\s*min/.test(b)), stueck = D.bau.find((b) => /\d+\s*min am Stück/.test(b));
    if (s.sport === 'schwimmen') { // Meter: 100 m ≙ eine Einheit Breite
      D.bau.forEach((b, i) => {
        const liste = /^\d+\s*m(,\s*\d+\s*m){2,}/.test(b) ? [...b.matchAll(/(\d+)\s*m\b/g)].map((q) => +q[1]) : null; // Version 24: „100 m, 200 m, 300 m …“ (Pyramide)
        if (liste) { const hoch = /schnell|CSS|Renntempo/i.test(b); liste.forEach((L, k) => seg(L / 100, hoch ? h : 0.45, k === 0 || k === liste.length - 1 ? L + ' m' : '', hoch)); return; }
        const y = /^(\d+)(?:–(\d+))?\s*m\b/.exec(b), x = y ? null : /(\d+)\s*×\s*(\d+)\s*m/.exec(b);
        if (y) { const L = +(y[2] || y[1]), hoch = /schnell|CSS|Renntempo/i.test(b) && !/einschwimmen|ausschwimmen|locker/i.test(b); seg(L / 100, hoch ? h : i === 0 ? 0.34 : i === D.bau.length - 1 ? 0.3 : 0.45, L + ' m', hoch); }
        else if (x) { const n = Math.min(20, +x[1]), L = +x[2] / 100, hoch = /CSS|Tempo|zügig|hart|schnell|Renntempo/i.test(b), hh = hoch ? h : /Technik|Paddles|Beine/i.test(b) ? 0.5 : 0.45; for (let k = 0; k < n; k++) seg(L, hh, k === 0 ? x[1] + ' × ' + x[2] + ' m' : '', hoch); }
      });
      return R.length >= 2 ? R : null;
    }
    if (s.sport === 'kraft' || s.sport === 'mobil' || (s.eigen && !['laufen', 'rad'].includes(s.sport))) return null; // keine Zeitform
    if (typ === 'lang_renn' && haupt) { // Version 24: lange Einheit mit Blöcken – locker, Blöcke, Rest locker
      const x = /(\d+)\s*×\s*(\d+)\s*min/.exec(haupt), n = +x[1], an = +x[2], ab = zahl(/dazwischen\s*(\d+)/, haupt) || 10, v = zahl(/^(\d+)\s*min/, D.bau[0]) || Math.round(m * 0.3);
      seg(v, 0.45, mz(v)); reihe(n, an, ab, STUFE.renn, 0.45); const rest = m - v - n * an - (n - 1) * ab; if (rest > 3) seg(rest, 0.45, 'locker'); return R;
    }
    if (typ === 'progressiv') { // Version 24: drei Stufen, jede höher als die vorige
      const L = D.bau.map((b) => zahl(/^(\d+)\s*min/, b)).filter((v) => v); if (L.length >= 3) { seg(L[0], 0.42, mz(L[0])); seg(L[1], STUFE.mittel || 0.62, mz(L[1])); seg(L[2], (STUFE.schwelle || 0.8) - 0.06, mz(L[2]), true); if (L[3]) seg(L[3], 0.3, 'aus'); return R; }
    }
    if (haupt) { // Intervalle: n × x min
      const x = /(\d+)\s*×\s*(\d+(?:,\d+)?)\s*min/.exec(haupt), n = Math.min(12, +x[1]), dm0 = +x[2].replace(',', '.');
      const pause = zahl(/dazwischen\s*(\d+(?:,\d+)?)\s*min/i, haupt) || (/gleich lang/.test(haupt) ? dm0 : zahl(/–\s*(\d+)\s*min/, haupt) || zahl(/,\s*(\d+)\s*min gehen/, haupt) || 2);
      const vor = D.bau.indexOf(haupt) > 0 && !ein0 ? zahl(/^(\d+)\s*min/, D.bau[0]) : null;
      if (ein0) seg(ein0, 0.34, mz(ein0)); else if (vor) seg(vor, 0.42, mz(vor));
      reihe(n, dm0, pause, /gehen/.test(haupt) ? 0.5 : h, /gehen/.test(haupt) ? 0.22 : 0.3);
      if (aus0) seg(aus0, 0.3, 'aus');
      return R.length >= 3 ? R : null;
    }
    if (stueck) { const v = zahl(/(\d+)\s*min am Stück/, stueck); if (ein0) seg(ein0, 0.34, mz(ein0)); seg(v, h, mz(v), true); if (aus0) seg(aus0, 0.3, 'aus'); return R; }
    const sek = D.bau.find((b) => /(\d+)\s*×\s*(\d+)\s*s/.test(b)); // Steigerungen, Antritte: 6 × 20 s
    if (sek) { const x = /(\d+)\s*×\s*(\d+)\s*s/.exec(sek), n = +x[1], an = +x[2] / 60, ab = zahl(/dazwischen\s*(\d+)\s*s/, sek) ? zahl(/dazwischen\s*(\d+)\s*s/, sek) / 60 : /(\d+)–(\d+)\s*s/.test(sek) ? 1.25 : 1.5; const basis = zahl(/^(\d+)\s*min/, D.bau[0]) || Math.max(10, m - n * (an + ab)); seg(basis, 0.42, mz(basis)); reihe(n, an, ab, 0.92, 0.3); const a2 = zahl(/^(\d+)\s*min aus/, D.bau[D.bau.length - 1]); if (a2) seg(a2, 0.3, 'aus'); return R; }
    if (typ === 'lang' || typ === 'koppel') { // lang: locker, am Ende Renntempo; Koppel: Hälfte Renntempo
      const rt = D.bau.find((b) => /Renntempo/.test(b));
      if (typ === 'koppel') { if (rt) { seg(m / 2, 0.45, mz(m / 2)); seg(m / 2, STUFE.renn, 'Renntempo', true); } else seg(m, 0.45, mz(m)); return R; }
      if (rt && /letzten\s*(\d+)/.test(rt)) { const e = +/letzten\s*(\d+)/.exec(rt)[1]; seg(m - e - 5, 0.45, mz(m - e - 5)); seg(e, STUFE.renn, 'Renntempo', true); seg(5, 0.3, 'aus'); return R; }
      if (rt && /×\s*(\d+)–(\d+)\s*min/.test(rt)) { const x = /(\d+)(?:–\d+)?\s*×\s*(\d+)–(\d+)\s*min/.exec(rt), n = +x[1], an = (+x[2] + +x[3]) / 2, ab = zahl(/dazwischen\s*(\d+)/, rt) || 10, v = Math.round(m * 0.3); seg(v, 0.45, mz(v)); reihe(n, an, ab, STUFE.renn, 0.45); const rest = m - v - n * an - (n - 1) * ab; if (rest > 3) seg(rest, 0.45, 'locker'); return R; }
      seg(m, 0.45, mz(m)); return R;
    }
    if (typ === 'test') { if (s.sport === 'rad') { seg(20, 0.4, '20′'); seg(20, 1, '20′ alles', true); seg(15, 0.3, 'aus'); } else { seg(15, 0.4, '15′'); seg(Math.max(18, Math.round(m - 25)), 1, '5 km', true); seg(10, 0.3, 'aus'); } return R; }
    if (typ === 'laufgehen') { const x = D.bau.find((b) => /×\s*\d+\s*min locker laufen/.test(b)); if (x) { const y = /(\d+)\s*×\s*(\d+)\s*min locker laufen,\s*(\d+)\s*min gehen/.exec(x); if (y) { seg(5, 0.25, '5′ gehen'); reihe(+y[1], +y[2], +y[3], 0.5, 0.22); seg(5, 0.25, 'gehen'); return R; } } }
    if (D.bau.length === 1 || typ === 'locker' || typ === 'eigen') { seg(m, art === 'hart' ? 0.9 : art === 'mittel' ? 0.62 : 0.45, mz(m), art === 'hart'); return R; }
    // Sonst: jede Zeile mit Minuten wird ein Abschnitt
    D.bau.forEach((b, i) => { const v = zahl(/^(\d+)\s*min/, b); if (v) seg(v, i === 0 ? 0.34 : i === D.bau.length - 1 ? 0.3 : h, mz(v), i > 0 && i < D.bau.length - 1); });
    return R.length ? R : null;
  }
  const formVariiert = (R) => !!R && R.length >= 2 && new Set(R.map((r) => Math.round(r.h * 10))).size >= 2;
  /* Diagramm „Form der Einheit“: Zeit von links nach rechts, Höhe = Anstrengung, harte Teile in der Farbe der Art, Rest ruhig. */
  function formChart(R, D, s) {
    const NS = 'http://www.w3.org/2000/svg', W = 320, H = 92, pb = 18, pt = 6, gesamt = R.reduce((x, r) => x + r.min, 0) || 1;
    const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + (H + pb)); sv.setAttribute('class', 'tf-form'); sv.setAttribute('role', 'img');
    const schwimm = s.sport === 'schwimmen';
    sv.setAttribute('aria-label', 'Form der Einheit: ' + R.map((r) => (schwimm ? Math.round(r.min * 100) + ' m' : Math.round(r.min) + ' min') + (r.hoch ? ' zügig' : ' ruhig')).join(', '));
    const farbe = 'var(--tf-' + (ART_FARBE[D.art] || 'blue') + ')';
    const mk = (n, at) => { const e = document.createElementNS(NS, n); Object.keys(at).forEach((k) => e.setAttribute(k, at[k])); sv.appendChild(e); return e; };
    [0.25, 0.5, 0.75, 1].forEach((f) => mk('line', { x1: 0, x2: W, y1: (pt + (H - pt) * (1 - f)).toFixed(1), y2: (pt + (H - pt) * (1 - f)).toFixed(1), class: 'tf-form-netz' }));
    let x = 0;
    R.forEach((r) => {
      const w = (W * r.min) / gesamt, hh = Math.max(3, (H - pt) * r.h);
      mk('rect', { x: (x + 0.5).toFixed(1), y: (H - hh).toFixed(1), width: Math.max(0.5, w - 1).toFixed(1), height: hh.toFixed(1), rx: 2, fill: r.hoch ? farbe : 'currentColor', opacity: r.hoch ? 0.95 : 0.22, class: r.hoch ? 'hoch' : 'tief' });
      if (r.t && w > 18) { const t = mk('text', { x: (x + w / 2).toFixed(1), y: H + 13, 'text-anchor': 'middle', class: 'tf-form-t' }); t.textContent = r.t; }
      x += w;
    });
    // Zeitachse: Striche je 10 bzw. 15 min (Schwimmen: je 500 m)
    const schritt = schwimm ? 5 : gesamt > 90 ? 30 : gesamt > 45 ? 15 : 10;
    for (let v = schritt; v < gesamt; v += schritt) mk('line', { x1: ((W * v) / gesamt).toFixed(1), x2: ((W * v) / gesamt).toFixed(1), y1: H, y2: H + 4, class: 'tf-form-tick' });
    return sv;
  }
  /* Version 24: Wellenform – die Einheit als Reihe feiner Striche, jeder Strich gleich viel Zeit. Höhe = Anstrengung,
     harte Teile in der Farbe der Art, der Rest in Tinte. Gleichmäßige Einheiten bleiben flach – das ist die
     Information, kein Zufall. Dieselbe Form wie im großen Diagramm, nur als Signatur jeder Einheit. */
  function formWelle(R, D, o) {
    o = o || {};
    const NS = 'http://www.w3.org/2000/svg', n = o.n || 96, sw = o.sw || 4, H = o.h || 32, W = n * sw, gesamt = R.reduce((x, r) => x + r.min, 0) || 1;
    const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.setAttribute('preserveAspectRatio', 'none');
    sv.setAttribute('class', 'tf-welle' + (o.cls ? ' ' + o.cls : '')); sv.setAttribute('aria-hidden', 'true');
    const farbe = 'var(--tf-' + (ART_FARBE[D.art] || 'blue') + ')', ende = [];
    let acc = 0; R.forEach((r) => { acc += r.min; ende.push(acc); });
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) * gesamt) / n; let k = ende.findIndex((e) => t <= e); if (k < 0) k = R.length - 1;
      const r = R[k], hh = Math.max(2.5, (H - 1) * Math.min(1, Math.max(0.14, r.h)));
      const e = document.createElementNS(NS, 'rect');
      e.setAttribute('x', (i * sw + sw * 0.18).toFixed(2)); e.setAttribute('y', (H - hh).toFixed(2)); e.setAttribute('width', (sw * 0.64).toFixed(2)); e.setAttribute('height', hh.toFixed(2)); e.setAttribute('rx', (sw * 0.32).toFixed(2));
      e.setAttribute('class', r.hoch ? 'hoch' : 'tief'); if (r.hoch) e.style.fill = farbe;
      sv.appendChild(e);
    }
    return sv;
  }
  function formMini(R, D) { // kleine Form in der Wochenliste – seit Version 24 als kleine Wellenform
    return formWelle(R, D, { n: 13, sw: 3.4, h: 16, cls: 'tf-form-mini' });
  }
  function zielZahl(s, D) { // der große Zielbereich der Karte: Watt, Puls oder Tempo
    const t = (D.ziele || []).join(' · '), a = athlet();
    let x = /(\d{2,4})–(\d{2,4}) W/.exec(t); if (x) return { lo: +x[1], hi: +x[2], u: 'W', txt: x[1] + '–' + x[2], skala: a.ftp_ref_w ? [Math.round(a.ftp_ref_w * 0.4 / 10) * 10, Math.round(a.ftp_ref_w * 1.3 / 10) * 10] : null };
    x = /(\d:\d\d)–(\d:\d\d)\s*\/km/.exec(t); if (x) return { txt: x[1] + '–' + x[2], u: '/km' };
    x = /etwa (\d:\d\d)\s*\/km/.exec(t); if (x) return { txt: x[1], u: '/km' };
    x = /Puls (\d{2,3})–(\d{2,3})/.exec(t); if (x) return { lo: +x[1], hi: +x[2], u: 'bpm', txt: x[1] + '–' + x[2], skala: [90, a.hf_max || 200] };
    x = /Puls unter (\d{2,3})/.exec(t); if (x) return { lo: 90, hi: +x[1], u: 'bpm', txt: 'unter ' + x[1], skala: [90, a.hf_max || 200] };
    x = /Puls über (\d{2,3})/.exec(t); if (x) return { lo: +x[1], hi: a.hf_max || +x[1] + 15, u: 'bpm', txt: 'über ' + x[1], skala: [90, a.hf_max || 200] };
    x = /(\d:\d\d)\s*\/100\s*m/.exec(t); if (x) return { txt: x[1], u: '/100 m' };
    return null;
  }
  function balken(R) { // Ablauf als weiße Balken – „nicht maßstabsgetreu“
    const NS = 'http://www.w3.org/2000/svg', W = 300, H = 74, n = R.reduce((x, r) => x + Math.max(2, Math.min(6, Math.round(r.min / 4))), 0), bw = W / (n + R.length * 0.6);
    const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + (H + 16)); sv.setAttribute('class', 'tf-held-profil'); sv.setAttribute('aria-hidden', 'true');
    let xx = 0;
    R.forEach((r) => {
      const k = Math.max(2, Math.min(6, Math.round(r.min / 4))), x0 = xx;
      for (let j = 0; j < k; j++) { const re = document.createElementNS(NS, 'rect'); re.setAttribute('x', (xx + 1).toFixed(1)); re.setAttribute('width', Math.max(1, bw - 2.4).toFixed(1)); re.setAttribute('y', (H - r.h * H).toFixed(1)); re.setAttribute('height', (r.h * H).toFixed(1)); re.setAttribute('rx', '1'); re.setAttribute('class', r.h >= 0.6 ? 'hoch' : 'tief'); sv.appendChild(re); xx += bw; }
      if (r.t) { const tx = document.createElementNS(NS, 'text'); tx.setAttribute('x', x0.toFixed(1)); tx.setAttribute('y', String(H + 13)); tx.textContent = r.t; sv.appendChild(tx); }
      xx += bw * 0.6;
    });
    return sv;
  }
  function lineal(z) { // Lineal mit Strichen, der Zielbereich als Pille
    const [a0, b0] = z.skala, lo = Math.max(a0, z.lo == null ? a0 : z.lo), hi = Math.min(b0, z.hi == null ? b0 : z.hi), p = (v) => ((100 * (v - a0)) / (b0 - a0)).toFixed(1) + '%';
    const striche = el('div', { class: 'tf-lineal-s' }); for (let i = 0; i <= 20; i++) striche.appendChild(el('i', { style: 'left:' + (i * 5) + '%' }));
    return el('div', { class: 'tf-lineal', role: 'img', 'aria-label': 'Zielbereich ' + z.txt + ' ' + z.u },
      el('div', { class: 'tf-lineal-z', style: 'left:' + p((lo + hi) / 2) }, 'Ziel'), striche,
      el('div', { class: 'tf-lineal-p', style: 'left:' + p(lo) + ';width:calc(' + p(hi) + ' - ' + p(lo) + ')' }),
      el('div', { class: 'tf-lineal-e' }, el('span', { text: a0 + ' ' + z.u }), el('span', { text: b0 + ' ' + z.u })));
  }
  let heldTag = 0;
  function heldEinheit(L) { // die wichtigste Einheit des Tages: das Rennen, sonst die härteste, sonst die längste
    return L.slice().sort((x, y) => (y.typ === 'rennen') - (x.typ === 'rennen') || (y.hart || 0) - (x.hart || 0) || y.min - x.min)[0];
  }
  /* Version 14: Welche Sportart startet die Bühne heute selbst? Dann braucht Heute keinen zweiten Start-Knopf darüber. */
  function heldHeute() {
    laden(); if (!P) return null;
    const PL = planJetzt(), h0 = localDate(), i = wocheIndex(PL, h0); if (i == null) return null;
    const L = wocheVon(PL, i).ES[wt(h0)], s = L.length ? heldEinheit(L) : null;
    return s && (s.sport === 'kraft' || s.sport === 'mobil') && !status(h0, s).ok ? s.sport : null;
  }
  function heuteImPlan() {
    const box = $('#home-plan'); if (!box) return;
    laden();
    if (!P) { box.replaceChildren(); return; }
    const PL = planJetzt(), h0 = localDate(), d0 = plus(h0, heldTag), i = wocheIndex(PL, d0), H = heute();
    const tabs = el('div', { class: 'tf-held-tabs', role: 'group', 'aria-label': 'Tag' }, ...[[-1, 'Gestern'], [0, 'Heute'], [1, 'Morgen']].map(([v, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v === heldTag) }, t);
      b.addEventListener('click', (e) => { e.stopPropagation(); heldTag = v; heuteImPlan(); });
      return b;
    }));
    const L = i == null ? [] : wocheVon(PL, i).ES[wt(d0)], w = i == null ? null : PL.W[i];
    const s = L.length ? heldEinheit(L) : null, D0 = s ? beschreiben(s, PL, w) : null;
    const st0 = s && s.typ !== 'rennen' ? status(d0, s) : { ok: false }, kH = s ? schluessel(d0, s) : null;
    const AR = s && heldTag === 0 && !st0.ok ? autoReg(s, D0, d0, PL, w) : null, an = !!AR && autoWahl(d0, kH) !== 'original'; // Version 13
    const D = an ? AR.D : D0, mn = s ? (an ? AR.min : s.min) : 0;
    const art = !s ? 'ruhe' : s.sport === 'mobil' ? 'mobil' : D.art;
    const c = el('article', { class: 'tf-card tf-held tf-buehne tf-b-' + (BUEHNE[art] || 'blau'), id: 'karte-held', 'aria-label': (heldTag === 0 ? 'Heute' : heldTag < 0 ? 'Gestern' : 'Morgen') + ' im Plan' });
    const kopf = el('div', { class: 'tf-held-o' }, el('span', { class: 'tf-augenbraue', text: tagKurz(d0) + (w ? ' · Woche ' + (i + 1) + ' von ' + PL.N + ' · ' + PHASE[w.phase][0] : '') }));
    c.append(tabs, kopf);
    if (i == null) {
      c.append(el('h2', { class: 'tf-held-t', text: d0 < PL.start ? 'Der Plan startet bald' : 'Plan geschafft' }), el('p', { class: 'tf-held-f', text: d0 < PL.start ? 'Los geht es am ' + dm(PL.start) + '.' : 'Zeit für ein neues Ziel – leg im Plan einfach los.' }));
    } else if (!s) {
      const morgen = wocheIndex(PL, plus(d0, 1)) != null ? wocheVon(PL, wocheIndex(PL, plus(d0, 1))).ES[wt(plus(d0, 1))] : [], m0 = morgen.length ? heldEinheit(morgen) : null;
      c.append(el('h2', { class: 'tf-held-t', text: 'Ruhetag' }), el('p', { class: 'tf-held-u', text: 'Erholung gehört zum Plan' }), el('hr'),
        el('p', { class: 'tf-held-f', text: 'Fokus: Schlaf, gutes Essen, ein Spaziergang – so wirkt das Training der letzten Tage.' + (m0 ? ' Morgen: ' + beschreiben(m0, PL, PL.W[wocheIndex(PL, plus(d0, 1))]).titel + ' · ' + m0.min + ' min.' : '') }));
    } else {
      const st = st0, z = zielZahl(s, D), R = profil(s, D);
      const haupt = (D.bau || []).find((b) => /×|am Stück|Renntempo/.test(b)) || (D.bau || [])[0] || '';
      c.append(el('h2', { class: 'tf-held-t', text: D.titel.replace(/[.!]$/, '') }),
        el('p', { class: 'tf-held-u' }, (s.eigen ? 'Eigene Einheit' : SP[s.sport].name) + (ART_NAME[D.art] && s.sport !== 'mobil' && ART_NAME[D.art] !== SP[s.sport].name ? ' · ' + ART_NAME[D.art] : ''), st.ok ? el('span', { class: 'tf-held-ok' }, svgIco('i-check'), ' erledigt') : st.verpasst ? el('span', { class: 'tf-held-ok aus', text: ' · verpasst' }) : null),
        el('hr'), el('p', { class: 'tf-held-f', text: 'Fokus: ' + haupt.replace(/^\d+\s*min\s*/, (m) => m) + (/[.!]$/.test(haupt) ? '' : '.') }));
      const zahlen = el('div', { class: 'tf-held-z' },
        el('div', null, el('b', { class: 'num' }, String(mn), el('span', { class: 'tf-u', text: 'min' })), el('small', { text: an ? 'Dauer · angepasst' : 'Dauer' })),
        z ? el('div', null, el('b', { class: 'num' }, z.txt, el('span', { class: 'tf-u', text: z.u })), el('small', { text: 'Zielbereich' })) : D.km ? el('div', null, el('b', { class: 'num' }, nf(D.km), el('span', { class: 'tf-u', text: 'm' })), el('small', { text: 'Strecke' })) : null);
      const bild = formVariiert(R) ? el('div', { class: 'tf-held-b' }, el('span', { class: 'tf-augenbraue', text: 'Ablauf' }), balken(R), el('small', { text: 'Form der Einheit · nicht maßstabsgetreu' }))
        : z && z.skala ? el('div', { class: 'tf-held-b' }, el('span', { class: 'tf-augenbraue', text: z.u === 'W' ? 'Geplante Leistung' : 'Geplanter Puls' }), lineal(z)) : null;
      c.append(el('div', { class: 'tf-held-m' + (bild ? '' : ' eins') }, zahlen, bild));
      const weitere = L.filter((x) => x !== s);
      if (weitere.length) c.append(el('p', { class: 'tf-held-dazu', text: 'Dazu: ' + weitere.map((x) => beschreiben(x, PL, w).titel + ' · ' + x.min + ' min').join(' · ') }));
      const dt = doppelTag(L, w, PL); if (dt) c.append(el('p', { class: 'tf-held-dazu tf-held-2x', text: dt.text })); // Version 13
      if (AR) c.append(autoBox(AR, d0, kH, heuteImPlan)); // Version 13: konkret angepasst statt nur ein Hinweis
      else if (heldTag === 0 && H && s.hart === 2 && s.typ !== 'rennen' && !st.ok && H.date >= plus(localDate(), -1) && (H.ampel === 'rot' || H.ampel === 'gelb')) c.append(el('p', { class: 'tf-held-warn' }, dot(H.ampel === 'rot' ? 'red' : 'yellow'), H.ampel === 'rot' ? 'Tune niedrig – heute lieber locker statt hart.' : 'Tune mittel – die harte Einheit kontrolliert angehen und abbrechen, wenn es sich falsch anfühlt.'));
      if (s.entlastet) c.append(entlastBox(s, d0, heuteImPlan));
      if (heldTag === 0) { const IF = beinHinweis(d0, L); if (IF) c.appendChild(IF); const SZ = window.tfEinblick && tfEinblick.planHinweis ? tfEinblick.planHinweis() : null; if (SZ) c.appendChild(SZ); }
      const knoepfe = el('div', { class: 'tf-held-k' });
      const det = el('button', { type: 'button', class: 'tf-btn tf-held-det' }, 'Details');
      det.addEventListener('click', (e) => { e.stopPropagation(); woche = i; offen = schluessel(d0, s); T.geh('training/plan'); });
      knoepfe.appendChild(det);
      if (heldTag >= 0 && !st.ok && (s.sport === 'kraft' || s.sport === 'mobil')) {
        const los = el('button', { type: 'button', class: 'tf-btn tf-held-los' }, svgIco('i-play'), ' Jetzt starten');
        los.addEventListener('click', (e) => { e.stopPropagation(); if (D.link && D.link.fn) { try { D.link.fn(); } catch (x) { /* weiter */ } } if (s.sport === 'kraft' && window.tfGym && tfGym.starten) tfGym.starten(); else if (window.tfFlow && tfFlow.starten) tfFlow.starten(); });
        knoepfe.appendChild(los);
      }
      c.append(knoepfe);
    }
    box.replaceChildren(c);
  }
  /* Version 12: kein Plan? Bei jedem Öffnen der App eine freundliche Einladung – „Später“ gilt nur bis zum nächsten Öffnen */
  function planBanner() {
    const box = $('#home-planbanner'); if (!box) return;
    laden();
    let weg = false; try { weg = sessionStorage.getItem('tf:planbanner-weg') === '1'; } catch (e) { /* egal */ }
    if (P || weg) { box.replaceChildren(); return; }
    const alltag = window.tfAlltag && tfAlltag.modus ? tfAlltag.modus() === 'alltag' : false;
    const los = el('button', { type: 'button', class: 'tf-btn tf-held-los' }, 'Plan in 2 Minuten erstellen');
    los.addEventListener('click', () => T.geh('training/plan'));
    const spaeter = el('button', { type: 'button', class: 'tf-btn tf-held-det' }, 'Später');
    spaeter.addEventListener('click', () => { try { sessionStorage.setItem('tf:planbanner-weg', '1'); } catch (e) { /* egal */ } box.replaceChildren(); });
    box.replaceChildren(el('article', { class: 'tf-card tf-held tf-planbanner tf-buehne tf-b-plan', id: 'karte-planbanner' },
      el('span', { class: 'tf-augenbraue', text: 'Dein Plan' }),
      el('h2', { class: 'tf-held-t', text: 'Noch kein Plan' }),
      el('p', { class: 'tf-held-f', text: alltag ? 'Sag Dreiklang, wie viel Zeit du hast – du bekommst jede Woche einen einfachen Plan für Bewegung und Kraft. Jede erledigte Einheit zählt für Quests und deine Serie.' : 'Ziel, Zeit und Sportarten wählen – Dreiklang plant jede Woche für dich, passt sich deinem Tune an und zählt jede erledigte Einheit für Quests und Serie.' }),
      el('div', { class: 'tf-held-k' }, los, spaeter)));
  }
  /* ---------- Version 12: Einheiten in den Kalender (Apple, Google, Outlook) ----------
     Eine .ics-Datei mit allen kommenden Einheiten: Uhrzeit wählbar, Dauer aus dem Plan, Aufbau und Ziel als Notiz,
     das Rennen als ganztägiger Termin. Feste Kennung (UID) je Einheit. Auf dem iPhone schickt Dreiklang die Datei kurz
     über den eigenen Server zurück (als text/calendar) – dann öffnet iOS direkt „Alle hinzufügen“. Nichts wird gespeichert.
     Version 18: Jeder Termin ist genau so lang wie die Einheit – auch an langen Tagen (früher wurde um 23:59 abgeschnitten,
     und eine weitere Einheit danach landete als fast ganztägiger Termin am Morgen). Mehrere Einheiten eines Tages kommen
     nacheinander mit 15 Minuten Pause, der Koppellauf direkt nach dem Rad. Passt ein Tag nicht mehr bis Mitternacht, beginnt
     er früher – nichts wird gekürzt oder auf den nächsten Tag geschoben. Eigene Uhrzeit fürs Wochenende (lange Einheiten).
     Heute angepasste Einheiten mit der Dauer, die auch der Plan zeigt. */
  const ics2 = (n) => String(n).padStart(2, '0');
  const icsEsc = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  function icsFalten(zeile) { // RFC 5545: höchstens 75 Bytes je Zeile, Fortsetzung mit Leerzeichen
    const enc = new TextEncoder(), out = []; let akt = '', n = 0;
    for (const z of zeile) { const b = enc.encode(z).length; if (n + b > (out.length ? 74 : 75)) { out.push(akt); akt = ''; n = 0; } akt += z; n += b; }
    out.push(akt);
    return out.join('\r\n ');
  }
  const ICS_PAUSE = 15, TAG_MIN = 24 * 60; // Minuten Pause zwischen zwei Einheiten am selben Tag
  const uhrMin = (u, std) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(u || '')); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : std; };
  const uhrText = (min) => ics2(Math.floor(min / 60) % 24) + ':' + ics2(min % 60);
  const icsLuecke = (a, b) => (b.x.typ === 'koppel' && (!b.x.nach || a.x.sport === b.x.nach) ? 0 : ICS_PAUSE); // Koppellauf: direkt nach dem Rad
  function icsTermine(o) { // → { PL, liste: [{ d, x, D, i, w, min, von, bis, ganz }], frueher, mehrfach, koppel } – von/bis in Minuten ab Mitternacht des Tages
    laden(); if (!P) return null;
    const PL = planJetzt(), h0 = localDate(), liste = [];
    const uhrWo = uhrMin(o.uhr, 18 * 60), uhrWe = uhrMin(o.uhrWe != null ? o.uhrWe : o.uhr, 9 * 60);
    let frueher = 0, mehrfach = 0, koppel = 0;
    for (let k = 0; k < (o.tage || 56); k++) {
      const d = plus(h0, k), i = wocheIndex(PL, d); if (i == null) continue;
      const w = PL.W[i], L = wocheVon(PL, i).ES[wt(d)] || []; if (!L.length) continue;
      const tag = L.map((x) => {
        let D = beschreiben(x, PL, w), min = x.min;
        if (k === 0 && x.typ !== 'rennen' && !status(d, x).ok) { // heute angepasst: dieselbe Dauer wie im Plan
          const R = autoReg(x, D, d, PL, w);
          if (R && autoWahl(d, schluessel(d, x)) !== 'original') { D = R.D; min = R.min; }
        }
        const m = Math.round(+min);
        return { d, x, D, i, w, min: m > 0 ? m : 30, ganz: x.typ === 'rennen' || o.ganz !== false }; // Version 21: Standard ganztägig – der Tag zeigt, was ansteht, die Erinnerung kommt um 10 Uhr
      });
      const zeit = tag.filter((e) => !e.ganz);
      const gesamt = zeit.reduce((s, e, j) => s + e.min + (j ? icsLuecke(zeit[j - 1], e) : 0), 0);
      let t = wt(d) >= 5 ? uhrWe : uhrWo;
      if (t + gesamt > TAG_MIN) { t = Math.max(0, TAG_MIN - gesamt); frueher += 1; }
      zeit.forEach((e, j) => { if (j) { t += icsLuecke(zeit[j - 1], e); if (!icsLuecke(zeit[j - 1], e)) koppel += 1; } e.von = t; e.bis = t + e.min; t = e.bis; });
      if (zeit.length > 1) mehrfach += 1;
      liste.push(...tag);
    }
    return { PL, liste, frueher, mehrfach, koppel };
  }
  /* o: { tage, ganz: true (Standard: ganztägig) | false (mit Uhrzeit: uhr 'HH:MM' Mo–Fr, uhrWe Sa/So),
        erinnerung: true|false, erinnerUhr: 'HH:MM' (Standard 10:00 – die Erinnerung am Tag der Einheit, egal wann sie stattfindet) }
     Version 21: Termine sind ganztägig – der Kalender zeigt, was heute ansteht, und erinnert um 10 Uhr daran. Die Erinnerung
     ist ein fester Zeitpunkt (DATE-TIME in UTC aus der Ortszeit), damit sie auch bei Terminen mit Uhrzeit immer um 10 Uhr kommt. */
  function icsText(o) {
    o = o || {};
    const T0 = icsTermine(o); if (!T0) return null;
    const PL = T0.PL, Z = [], jetzt = new Date(), stamp = jetzt.getUTCFullYear() + ics2(jetzt.getUTCMonth() + 1) + ics2(jetzt.getUTCDate()) + 'T' + ics2(jetzt.getUTCHours()) + ics2(jetzt.getUTCMinutes()) + ics2(jetzt.getUTCSeconds()) + 'Z';
    const dat = (d) => d.replace(/-/g, ''), zeit = (d, min) => dat(plus(d, Math.floor(min / TAG_MIN))) + 'T' + ics2(Math.floor((min % TAG_MIN) / 60)) + ics2(min % 60) + '00';
    const erinnerMin = uhrMin(o.erinnerUhr, 10 * 60);
    const utc = (d, min) => { const x = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), Math.floor(min / 60), min % 60, 0); return x.getUTCFullYear() + ics2(x.getUTCMonth() + 1) + ics2(x.getUTCDate()) + 'T' + ics2(x.getUTCHours()) + ics2(x.getUTCMinutes()) + '00Z'; };
    T0.liste.forEach((e) => {
      const { d, x, D, i, w } = e, uid = 'tf-' + schluessel(d, x).replace(/[^A-Za-z0-9-]/g, '-') + '@tagesform';
      const text = [D.bau.join('\n'), D.ziele && D.ziele.length ? 'Ziel: ' + D.ziele.join(' · ') : '', D.warum || '', 'Woche ' + (i + 1) + ' von ' + PL.N + ' · ' + PHASE[w.phase][0]].filter(Boolean).join('\n\n');
      Z.push('BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + stamp);
      if (e.ganz) Z.push('DTSTART;VALUE=DATE:' + dat(d), 'DTEND;VALUE=DATE:' + dat(plus(d, 1)));
      else Z.push('DTSTART:' + zeit(d, e.von), 'DTEND:' + zeit(d, e.bis));
      Z.push('SUMMARY:' + icsEsc(D.titel + ' · ' + (x.typ === 'rennen' ? SP[x.sport].name : dauer(e.min))), 'DESCRIPTION:' + icsEsc(text), 'CATEGORIES:' + icsEsc(SP[x.sport].name), 'TRANSP:' + (e.ganz ? 'TRANSPARENT' : 'OPAQUE'));
      if (o.erinnerung !== false && x.typ !== 'rennen') Z.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Heute: ' + D.titel + ' · ' + dauer(e.min)), 'TRIGGER;VALUE=DATE-TIME:' + utc(d, erinnerMin), 'END:VALARM');
      Z.push('END:VEVENT');
    });
    const n = T0.liste.length;
    if (!n) return { n: 0, text: null, frueher: 0 };
    const kopf = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dreiklang//Trainingsplan//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Dreiklang – Training', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H'];
    return { n, text: kopf.concat(Z, ['END:VCALENDAR']).map(icsFalten).join('\r\n') + '\r\n', frueher: T0.frueher };
  }
  const istIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const istApple = () => istIOS() || /Macintosh/.test(navigator.userAgent);
  /* ---------- Version 21: Kalender-Abo ----------
     Der Kalender holt sich die Termine selbst (webcal-Adresse mit Token, /api/kalender). Die App baut die Datei mit dem
     ganzen Plan und lädt sie hoch; ändert sich der Plan, lädt sie beim nächsten Öffnen leise neu (höchstens einmal am Tag,
     nur wenn sich die Datei unterscheidet). Einmal-Export als Datei bleibt als zweiter Weg (Teilen oder Laden). */
  const kalEinst = () => Object.assign({ ganz: true, uhr: '18:00', uhrWe: '09:00', erinnerung: true, erinnerUhr: '10:00' }, (A().state.rechner || {}).kalender || {});
  function kalEinstSpeichern(st) {
    const r = Object.assign({}, A().state.rechner || {}); r.kalender = { ganz: st.ganz !== false, uhr: st.uhr, uhrWe: st.uhrWe, erinnerung: !!st.erinnerung, erinnerUhr: st.erinnerUhr || '10:00' }; A().setRechner(r);
    A().api('POST', '/api/rechner', { kalender: r.kalender }).catch(() => {});
  }
  const hashText = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  function aboText() { const st = kalEinst(); return icsText({ tage: 400, ganz: st.ganz !== false, uhr: st.uhr, uhrWe: st.uhrWe, erinnerung: st.erinnerung, erinnerUhr: st.erinnerUhr }); }
  async function aboHochladen() { // → Antwort des Servers { abo, url, webcal, stand, n }
    const r = aboText(); if (!r || !r.n) throw new Error('Im Plan stehen keine Einheiten an.');
    const j = await A().api('POST', '/api/kalender', { ics: r.text, n: r.n });
    try { localStorage.setItem('tf:kalender:hash', hashText(r.text)); localStorage.setItem('tf:kalender:tag', localDate()); } catch (e) { /* egal */ }
    return j;
  }
  async function aboAbgleich() { // leise, beim Öffnen: Abo vorhanden und Plan verändert? Dann neu hochladen (einmal am Tag)
    if (A().state.ohne || !navigator.onLine) return;
    let tag = null; try { tag = localStorage.getItem('tf:kalender:tag'); } catch (e) { /* egal */ }
    if (tag === localDate()) return;
    laden(); if (!P) return;
    const st = await A().api('GET', '/api/kalender').catch(() => null); if (!st || !st.abo) return;
    const r = aboText(); if (!r || !r.n) return;
    let alt = null; try { alt = localStorage.getItem('tf:kalender:hash'); } catch (e) { /* egal */ }
    if (alt === hashText(r.text)) { try { localStorage.setItem('tf:kalender:tag', localDate()); } catch (e) { /* egal */ } return; }
    await aboHochladen().catch(() => {});
  }
  async function dateiTeilen(text, name) { // Web Share mit Datei (Handy) → sonst Laden
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    if (typeof File === 'function' && navigator.canShare) {
      const f = new File([blob], name, { type: 'text/calendar' });
      if (navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Dreiklang – Training' }); return 'geteilt'; } catch (e) { if (e && e.name === 'AbortError') return 'abgebrochen'; } }
    }
    const url = URL.createObjectURL(blob), a = el('a', { href: url, download: name, style: 'display:none' });
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    return 'geladen';
  }
  function kalenderBlatt() {
    laden(); if (!P) return;
    const st = kalEinst(); let tage = 56; try { tage = +JSON.parse(localStorage.getItem('tf:kalender') || '{}').tage || 56; } catch (e) { /* Standard */ }
    const box = el('div', { class: 'tf-rm tf-kal' });
    const uhrFeld = (key, name, lang, std) => {
      const inp = el('input', { class: 'tf-input', type: 'time', value: st[key], step: 900, 'aria-label': 'Beginn ' + lang });
      inp.addEventListener('change', () => { st[key] = inp.value || std; kalEinstSpeichern(st); vorschau(); });
      return el('label', { class: 'tf-kal-z' }, el('small', { text: name }), inp);
    };
    // Version 21: ganztägig (Standard) oder mit Uhrzeit; Erinnerung um 10 Uhr am Tag der Einheit
    const ganz = el('input', { type: 'checkbox', checked: st.ganz !== false });
    const beginn = el('div', { class: 'tf-field', hidden: st.ganz !== false }, el('span', { text: 'Beginn' }), el('div', { class: 'tf-kal-zz' }, uhrFeld('uhr', 'Mo–Fr', 'Montag bis Freitag', '18:00'), uhrFeld('uhrWe', 'Sa und So', 'am Wochenende', '09:00')));
    ganz.addEventListener('change', () => { st.ganz = ganz.checked; beginn.hidden = ganz.checked; kalEinstSpeichern(st); vorschau(); });
    const er = el('input', { type: 'checkbox', checked: !!st.erinnerung });
    const erUhr = el('input', { class: 'tf-input', type: 'time', value: st.erinnerUhr || '10:00', step: 900, 'aria-label': 'Uhrzeit der Erinnerung', disabled: !st.erinnerung });
    er.addEventListener('change', () => { st.erinnerung = er.checked; erUhr.disabled = !er.checked; kalEinstSpeichern(st); });
    erUhr.addEventListener('change', () => { st.erinnerUhr = erUhr.value || '10:00'; kalEinstSpeichern(st); });
    const info = el('p', { class: 'tf-rm-sub tf-kal-n' });
    const naechste = el('ul', { class: 'tf-kal-l', 'aria-label': 'Die nächsten Termine' });
    const vorschau = () => {
      const T0 = icsTermine({ tage: 400, ganz: st.ganz !== false, uhr: st.uhr, uhrWe: st.uhrWe }), L = T0 ? T0.liste : [], n = L.length;
      info.textContent = !n ? 'Im Plan stehen keine Einheiten an.'
        : n + (n === 1 ? ' Termin' : ' Termine') + ' bis zum Ende des Plans' + (T0.mehrfach ? ' – mehrere an einem Tag nacheinander' + (T0.koppel ? ', der Koppellauf direkt im Anschluss' : '') : '') + '.'
          + (T0.frueher ? ' ' + (T0.frueher === 1 ? 'Ein langer Tag beginnt' : T0.frueher + ' lange Tage beginnen') + ' früher, damit alles vor Mitternacht fertig ist.' : '');
      naechste.replaceChildren(...L.slice(0, 3).map((e) => el('li', null, el('small', { text: WT[wt(e.d)] + ' ' + dm(e.d) }), el('b', { text: e.D.titel }),
        el('span', { class: 'num', text: (e.ganz ? 'ganztägig' : uhrText(e.von) + '–' + uhrText(e.bis)) + ' · ' + dauer(e.min) + (st.erinnerung && e.x.typ !== 'rennen' ? ' · Erinnerung ' + (st.erinnerUhr || '10:00') : '') }))));
      naechste.hidden = !n;
    };
    // --- Abo ---
    const aboBox = el('div', { class: 'tf-kal-abo' }), aboMsg = el('p', { class: 'tf-msg', role: 'status' });
    const aboMalen = (z) => {
      aboBox.replaceChildren();
      if (!z || !z.abo) {
        const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-cal'), ' Kalender abonnieren');
        b.addEventListener('click', async () => {
          b.disabled = true; setMsg(aboMsg, 'Wird eingerichtet …');
          try { const j = await aboHochladen(); setMsg(aboMsg, ''); aboMalen(j); if (istApple()) { setTimeout(() => { window.location.href = j.webcal; }, 150); } }
          catch (e) { setMsg(aboMsg, 'Ging nicht: ' + e.message, true); b.disabled = false; }
        });
        aboBox.append(el('p', { class: 'tf-rm-sub', text: 'Empfohlen: Dein Kalender holt sich die Termine selbst – und bleibt von allein aktuell, wenn sich dein Plan ändert. Nichts doppelt, nichts von Hand.' }), el('div', { class: 'tf-form-actions' }, b));
        return;
      }
      const stand = z.stand ? new Date(z.stand) : null;
      const zeile = el('p', { class: 'tf-kal-stand' }, dot('green'), el('span', { text: 'Abo aktiv · ' + (z.n || 0) + ' Termine' + (stand ? ' · Stand ' + stand.getDate() + '.' + (stand.getMonth() + 1) + '. ' + ics2(stand.getHours()) + ':' + ics2(stand.getMinutes()) : '') }));
      const oeffnen = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-cal'), istApple() ? ' In Kalender öffnen' : ' Abo-Link kopieren');
      oeffnen.addEventListener('click', async () => {
        if (istApple()) { window.location.href = z.webcal; return; }
        try { await navigator.clipboard.writeText(z.url); setMsg(aboMsg, 'Link kopiert – in Google Kalender unter „Weitere Kalender → Per URL“ einfügen, in Outlook unter „Kalender hinzufügen → Aus dem Internet abonnieren“.'); }
        catch (e) { setMsg(aboMsg, z.url); }
      });
      const neu = el('button', { type: 'button', class: 'tf-btn' }, 'Jetzt aktualisieren');
      neu.addEventListener('click', async () => { neu.disabled = true; try { const j = await aboHochladen(); aboMalen(j); setMsg(aboMsg, 'Aktualisiert – dein Kalender holt die neue Fassung beim nächsten Abgleich (meist innerhalb von Stunden).'); } catch (e) { setMsg(aboMsg, 'Ging nicht: ' + e.message, true); neu.disabled = false; } });
      const ende = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abo beenden');
      ende.addEventListener('click', async () => { try { await A().api('DELETE', '/api/kalender'); aboMalen({ abo: false }); setMsg(aboMsg, 'Abo beendet – entferne den Kalender „Dreiklang“ auch in deiner Kalender-App.'); } catch (e) { setMsg(aboMsg, 'Ging nicht: ' + e.message, true); } });
      const link = el('p', { class: 'tf-kal-link' }, el('small', { text: 'Abo-Adresse (für Google oder Outlook): ' }), el('code', { class: 'num', text: z.url }));
      aboBox.append(zeile, el('div', { class: 'tf-form-actions' }, oeffnen, neu, ende), istApple() ? null : link,
        el('p', { class: 'tf-note', text: istApple() ? 'Beim Öffnen fragt dein Kalender „Abonnieren?“ – bestätigen, fertig. Der Kalender heißt „Dreiklang – Training“ und aktualisiert sich selbst.' : 'Google Kalender und Outlook holen die Adresse etwa einmal am Tag ab.' }));
    };
    A().api('GET', '/api/kalender').then(aboMalen).catch(() => aboMalen({ abo: false }));
    aboMalen({ abo: false });
    // --- Datei ---
    const zr = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Zeitraum' });
    const zrMalen = () => zr.replaceChildren(...[[14, '2 Wochen'], [28, '4 Wochen'], [56, '8 Wochen'], [400, 'Ganzer Plan']].map(([v, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(tage === v) }, t); b.addEventListener('click', () => { tage = v; zrMalen(); }); return b; }));
    const datei = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-share'), ' Als Datei teilen');
    datei.addEventListener('click', async () => {
      const r = icsText({ tage, ganz: st.ganz !== false, uhr: st.uhr, uhrWe: st.uhrWe, erinnerung: st.erinnerung, erinnerUhr: st.erinnerUhr }); if (!r || !r.n) { A().toast('Im gewählten Zeitraum stehen keine Einheiten an.'); return; }
      try { localStorage.setItem('tf:kalender', JSON.stringify({ tage })); } catch (e) { /* egal */ }
      const wie = await dateiTeilen(r.text, 'dreiklang-training.ics');
      if (wie === 'geteilt') A().toast('Geteilt – in der Kalender-App „Alle hinzufügen“ wählen'); else if (wie === 'geladen') A().toast('Kalenderdatei geladen – einfach öffnen');
    });
    zrMalen(); vorschau();
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'In Kalender' }),
      el('p', { class: 'tf-rm-sub', text: 'Deine Einheiten als Termine in Apple Kalender, Google oder Outlook – mit Aufbau und Zielbereich in der Notiz. Ganztägig zeigt der Tag, was ansteht; die Erinnerung kommt zur gewählten Uhrzeit.' }),
      el('label', { class: 'tf-switch' }, ganz, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Ganztägige Termine', el('small', { class: 'tf-switch-sub', text: 'Aus: jede Einheit bekommt eine Uhrzeit und Dauer' }))),
      beginn,
      el('div', { class: 'tf-kal-er' }, el('label', { class: 'tf-switch' }, er, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Erinnerung am Tag der Einheit')), el('label', { class: 'tf-kal-z' }, el('small', { text: 'um' }), erUhr)),
      info, naechste,
      el('h3', { class: 'tf-kal-h', text: 'Abonnieren' }), aboBox, aboMsg,
      el('h3', { class: 'tf-kal-h', text: 'Oder einmal als Datei' }),
      el('div', { class: 'tf-field' }, el('span', { text: 'Zeitraum' }), zr),
      el('div', { class: 'tf-form-actions' }, datei),
      el('p', { class: 'tf-note', text: 'Die Datei fügt die Termine einmalig ein. Ändert sich dein Plan, entfernst du sie und teilst neu – das Abo nimmt dir das ab.' }));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  /* ---------- Kraft und Laufen: nach schwerem Beintag keine harten Läufe ----------
     Schweres Beintraining verschlechtert Laufökonomie und Leistung bis etwa 48 h (Doma et al., Sports Med 2017) –
     dann lieber locker Rad oder Schwimmen und die Intervalle einen Tag später. */
  function beinHinweis(datum, L) {
    if (!window.tfAlltagMotor || !window.tfGym || !tfGym.log) return null;
    const r = tfAlltagMotor.interferenz({ gym: tfGym.log(), datum, einheiten: L });
    if (!r) return null;
    const wann = r.wann === 'heute' ? 'Heute schon Beine trainiert' : r.wann === 'gestern' ? 'Gestern schwerer Beintag' : 'Vorgestern sehr schwerer Beintag';
    const text = r.stufe === 'warnung'
      ? wann + ' (' + r.saetze + ' harte Sätze für die Beine). Harte Laufintervalle sind jetzt riskanter und bringen weniger – besser heute locker Rad oder Schwimmen und die Intervalle auf morgen schieben.'
      : wann + ' (' + r.saetze + ' Sätze für die Beine): den langen Lauf ruhig angehen – fühlen sich die Beine schwer an, lieber Rad.';
    const p = el('p', { class: 'tf-pl-tf tf-pl-bein' }, dot(r.stufe === 'warnung' ? 'orange' : 'yellow'), el('span', { text }));
    if (window.tfWissen && tfWissen.begriff && tfWissen.begriff('concurrent')) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Warum?'); b.addEventListener('click', (e) => { e.stopPropagation(); tfWissen.zeige('concurrent'); }); p.lastChild.append(' ', b); }
    return p;
  }

  /* ---------- Radeinheit als Zwift-Workout (.zwo) ----------
     Leistung in Anteilen deiner FTP – auf dem Rollentrainer im ERG-Modus fährt Zwift die Watt automatisch. */
  const xml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function zwoText(s, PL, w, datum) {
    const a = athlet(), D = beschreiben(s, PL, w), m = s.min, ein = Math.max(5, Math.min(15, Math.round(m * 0.25))), aus = Math.max(5, Math.min(10, Math.round(m * 0.15)));
    const R = [], sek = (min) => Math.max(30, Math.round(min * 60));
    let zeit = 0;
    const steady = (min, p, cad) => { if (min < 0.5) return; R.push('<SteadyState Duration="' + sek(min) + '" Power="' + p.toFixed(2) + '"' + (cad ? ' Cadence="' + cad + '"' : '') + '/>'); zeit += min; };
    const reihe = (n, an, ab, pAn, pAb, cad) => { R.push('<IntervalsT Repeat="' + n + '" OnDuration="' + sek(an) + '" OffDuration="' + sek(ab) + '" OnPower="' + pAn.toFixed(2) + '" OffPower="' + pAb.toFixed(2) + '"' + (cad ? ' Cadence="' + cad + '" CadenceResting="90"' : '') + '/>'); zeit += n * (an + ab); };
    const warm = (min) => { R.push('<Warmup Duration="' + sek(min) + '" PowerLow="0.45" PowerHigh="0.70"/>'); zeit += min; };
    const kuehl = (min) => ({ min, xml: '<Cooldown Duration="' + sek(min) + '" PowerLow="0.65" PowerHigh="0.45"/>' });
    const zerlege = (t) => { const x = /(\d+)\s*×\s*(\d+)\s*min/.exec(t || ''); if (x) return [+x[1], +x[2]]; const y = /(\d+)\s*min am Stück/.exec(t || ''); return y ? [1, +y[1]] : null; };
    const leg = PL.item && PL.item.legs.find((l) => l.typ === 'bike'), band = leg && Array.isArray(leg.band) ? leg.band : [a.rad_if_min || 0.65, a.rad_if_max || 0.75], renn = (band[0] + band[1]) / 2;
    let ende = kuehl(aus);
    const t = s.typ;
    if (t === 'sweetspot' || t === 'schwelle' || t === 'vo2' || t === 'renntempo') {
      const v = zerlege(D.bau[1]) || [3, 10], p = t === 'sweetspot' ? 0.91 : t === 'schwelle' ? 0.98 : t === 'vo2' ? 1.13 : renn, pause = t === 'vo2' ? v[1] : 5;
      warm(ein); if (v[0] > 1) reihe(v[0], v[1], pause, p, 0.55); else steady(v[1], p);
    } else if (t === 'kadenz' || t === 'kadenz_q') { warm(5); steady(Math.max(5, m - 28), 0.65); reihe(6, 1, 2, 0.68, 0.6, 110); ende = kuehl(5); }
    else if (t === 'opener') { warm(ein); steady(Math.max(5, m - ein - aus - 9), 0.62); reihe(3, 1, 2, 1.0, 0.55); }
    else if (t === 'test') { warm(10); reihe(3, 1, 2, 0.95, 0.55); R.push('<SteadyState Duration="180" Power="0.55"/>'); R.push('<FreeRide Duration="1200" FlatRoad="1"/>'); zeit += 33; ende = kuehl(15); }
    else if (t === 'lang' && /Renntempo/.test(D.bau[1] || '')) { warm(10); steady(Math.max(10, Math.round(m * 0.3) - 10), 0.65); reihe(2, 25, 10, renn, 0.62); }
    else { warm(Math.min(10, ein)); }
    const rest = m - zeit - ende.min;
    if (rest >= 1 && t !== 'test') steady(rest, t === 'lang' ? 0.66 : 0.65);
    R.push(ende.xml);
    return '<workout_file>\n  <author>Dreiklang</author>\n  <name>' + xml(D.titel + ' · ' + dm(datum)) + '</name>\n  <description>' + xml(D.bau.join(' · ') + (D.ziele.length ? ' – Ziel: ' + D.ziele.join(' · ') : '')) + '</description>\n  <sportType>bike</sportType>\n  <tags><tag name="Dreiklang"/></tags>\n  <workout>\n    ' + R.join('\n    ') + '\n  </workout>\n</workout_file>\n';
  }
  async function zwoExport(s, datum) {
    const PL = planJetzt(), i = wocheIndex(PL, datum); if (i == null) return;
    const text = zwoText(s, PL, PL.W[i], datum), D = beschreiben(s, PL, PL.W[i]);
    const name = 'dreiklang-' + datum + '-' + D.titel.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.zwo';
    try {
      const datei = new File([text], name, { type: 'application/xml' });
      if (navigator.canShare && navigator.canShare({ files: [datei] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [datei], title: D.titel }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/xml' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    A().toast('Gespeichert: ' + name + ' – in Zwift unter Training → Eigene Workouts importieren', 7000);
  }

  /* ---------- Kurzinfo für die Training-Übersicht ---------- */
  function info() { // Version 12: „Mein Plan“ im Training – Woche, Phase, erledigt, heute
    laden(); if (!P) return null;
    const PL = planJetzt(), d0 = localDate(), i = wocheIndex(PL, d0), r = { titel: zielTitel(PL), N: PL.N, start: PL.start };
    if (i == null) return Object.assign(r, { bald: d0 < PL.start });
    const W = wocheVon(PL, i), w = PL.W[i], ws = plus(PL.start, 7 * i); let g = 0, e = 0;
    W.ES.forEach((L, d) => L.forEach((x) => { if (x.typ === 'rennen') return; g += 1; if (plus(ws, d) <= d0 && status(plus(ws, d), x).ok) e += 1; }));
    return Object.assign(r, { woche: i + 1, phase: PHASE[w.phase][0], geplant: g, erledigt: e, heute: W.ES[wt(d0)].map((x) => ({ titel: beschreiben(x, PL, w).titel, min: x.min, sport: x.sport })) });
  }
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
  T.zusatz('heute', planBanner);
  T.zusatz('heute', () => { setTimeout(() => { aboAbgleich().catch(() => {}); }, 4000); }); // Version 21: Kalender-Abo leise aktuell halten
  function tagEinheiten(datum) { // geplante Einheiten eines Tages mit Beschreibung (für „Dein Tag“, Kohlenhydrate und Spiel)
    laden(); if (!P) return [];
    const PL = planJetzt(), i = wocheIndex(PL, datum); if (i == null) return [];
    const w = PL.W[i];
    return wocheVon(PL, i).ES[wt(datum)].map((s) => Object.assign({}, s, { D: beschreiben(s, PL, w), datum }));
  }
  // Version 19: Tagesabschluss – geplante Einheiten eines Tages mit Stand (erledigt, offen) und den Minuten von der Uhr.
  // Heute zählt die angepasste Einheit (Auto-Anpassung an den Tune), außer „Original“ ist gewählt – auch wenn sie schon erledigt ist.
  function tagStatus(datum) {
    laden(); if (!P) return null;
    const PL = planJetzt(), i = wocheIndex(PL, datum);
    if (i == null) return { plan: true, imPlan: false, einheiten: [] };
    const w = PL.W[i], L = wocheVon(PL, i).ES[wt(datum)] || [];
    return { plan: true, imPlan: true, woche: i + 1, N: PL.N, phase: PHASE[w.phase][0], einheiten: L.map((s) => {
      let D = beschreiben(s, PL, w), min = s.min, angepasst = false;
      const st = s.typ === 'rennen' ? { ok: false } : status(datum, s);
      if (s.typ !== 'rennen') { const R = autoReg(s, D, datum, PL, w); if (R && autoWahl(datum, schluessel(datum, s)) !== 'original') { D = R.D; min = R.min; angepasst = true; } }
      return { k: schluessel(datum, s), sport: s.sport, sportName: (SP[s.sport] || {}).name || s.sport, garmin: (SP[s.sport] || {}).garmin || null, typ: s.typ, art: D.art || null, titel: String(D.titel || '').replace(/[.!]$/, ''),
        min: Math.round(+min) || 0, rennen: s.typ === 'rennen', eigen: !!s.eigen, angepasst, ok: !!st.ok, quelle: st.quelle || null, istMin: st.min != null ? Math.round(+st.min) : null };
    }) };
  }
  // Version 13: geplante Last der nächsten Tage (für Prognosen), Entlastungstage, Simulator
  function lastPlan(von, n) {
    laden(); if (!P) return [];
    const PL = planJetzt(), out = [];
    for (let k = 0; k < n; k++) {
      const datum = plus(von, k), i = wocheIndex(PL, datum); if (i == null) continue;
      const w = PL.W[i], L = wocheVon(PL, i).ES[wt(datum)], st = L.filter((s) => s.typ !== 'rennen' && status(datum, s).ok);
      const t = tagLast(L.filter((s) => !st.includes(s)), w, PL); // schon Erledigtes zählt aus den Garmin-Daten
      out.push({ date: datum, tss: t.tss, bein: t.bein, kreis: t.kreis, n: L.length });
    }
    return out;
  }
  window.tfPlan = { heldHeute, lastPlan, simDaten, entlasten, profil, formChart, formMini, formWelle, formVariiert, planJetzt: () => { laden(); return P ? planJetzt() : null; }, entlastet: (d) => { laden(); return !!(P && Array.isArray(P.entlastung) && P.entlastung.includes(d)); }, autoReg: (datum) => { laden(); if (!P) return null; const PL = planJetzt(), i = wocheIndex(PL, datum); if (i == null) return null; const w = PL.W[i], L = wocheVon(PL, i).ES[wt(datum)]; const s = L.length ? heldEinheit(L) : null; return s ? autoReg(s, beschreiben(s, PL, w), datum, PL, w) : null; },
    prognose: () => { laden(); return P ? prognose(planJetzt()) : null; }, // Version 16
    ersatz: () => { laden(); return P && P.ersatz ? JSON.parse(JSON.stringify(P.ersatz)) : []; }, // Version 17
    tagStatus, // Version 19
    kurz, info, hat: () => { laden(); return !!P; }, kalender: kalenderBlatt, ics: (o) => icsText(o || {}), bilanz, eigenAuto, eigenBlatt: (i) => { laden(); if (!P) return; const PL = planJetzt(); eigenBlatt(PL, i == null ? (wocheIndex(PL, localDate()) || 0) : i); }, tag: tagEinheiten, zwo: (s, datum) => { laden(); const PL = planJetzt(), i = wocheIndex(PL, datum); return i == null ? null : zwoText(s, PL, PL.W[i], datum); }, rechnen: (p) => rechnen(p), woche: (p, i) => wocheBauen(rechnen(p), i), beschreiben, oeffneWoche: (i) => { woche = i; } };
})();
