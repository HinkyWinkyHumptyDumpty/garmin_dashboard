/* Tagesform · Berechnungen
   Jede Kennzahl ist eine sichtbare Berechnung auf deinen Garmin-Daten.
   Die Herleitung jeder Formel steht auf der Seite „Methodik“. */

dash.calc('belastung', {
  title: 'Belastung je Einheit (TSS)',
  description: 'TSS je Einheit: Leistung beim Rad, Tempo zur CSS beim Schwimmen, sonst Herzfrequenz nach Banister-TRIMP (hrTSS).',
  inputs: ['garmin_einheiten', 'athlet', 'garmin_hf_zonen', 'garmin_tage'],
  fn: (garmin_einheiten, athlet, garmin_hf_zonen, garmin_tage) => {
    const a = athlet[0];
    const SPORT = { lap_swimming: 'swim', open_water_swimming: 'swim', cycling: 'bike', indoor_cycling: 'bike', virtual_ride: 'bike', road_biking: 'bike', gravel_cycling: 'bike', mountain_biking: 'bike', running: 'run', treadmill_running: 'run', trail_running: 'run', transition_v2: 'wechsel' };
    const rhr = garmin_tage.map((d) => +d.rhr).filter((v) => v > 0).slice(-90).sort((x, y) => x - y);
    const rest = rhr.length ? rhr[rhr.length >> 1] : 60; // Ruhepuls: Median der letzten 90 Werte
    const trimp = (hr, min) => { const x = Math.min(1, Math.max(0, (hr - rest) / (a.hf_max - rest))); return min * x * 0.64 * Math.exp(1.92 * x); };
    const floors = {};
    garmin_hf_zonen.forEach((z) => { floors[z.sport] = [z.z1, z.z2, z.z3, z.z4, z.z5, z.hf_max].map(Number); });
    const mids = (k) => { const f = floors[k] || floors.DEFAULT; return [0, 1, 2, 3, 4].map((i) => (f[i] + f[i + 1]) / 2); };
    const hm = (s) => { const m = Math.round(s / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    return garmin_einheiten.filter((e) => !e.is_parent && e.type !== 'incident_detected' && +e.dur_s > 0).map((e) => {
      const sport = SPORT[e.type] || 'other', sec = +e.moving_s || +e.dur_s, h = sec / 3600;
      const v = +e.dist_m / sec, vCss = 100 / a.css_s_100m;
      const zt = [e.z1_s, e.z2_s, e.z3_s, e.z4_s, e.z5_s].map((t) => +t || 0), zSum = zt.reduce((s, t) => s + t, 0);
      let tss = 0, iF = null, methode = 'ohne Messwerte';
      if (sport === 'bike' && +e.np_w > 0) { iF = e.np_w / a.ftp_ref_w; tss = h * iF * iF * 100; methode = 'Leistung'; }
      else if (sport === 'swim' && v > 0 && v < vCss * 1.15) { iF = v / vCss; tss = h * iF ** 3 * 100; methode = 'Tempo/CSS'; }
      else if (+e.avg_hr > 0) {
        const key = { bike: 'CYCLING', run: 'RUNNING', swim: 'SWIMMING' }[sport] || 'DEFAULT';
        const lthr = sport === 'run' ? a.lthr_lauf : a.lthr_rad, m = mids(key), byZone = zSum > 0.5 * sec;
        const t = byZone ? zt.reduce((s, z, i) => s + trimp(m[i], z / 60), 0) : trimp(+e.avg_hr, sec / 60);
        tss = (t / trimp(lthr, 60)) * 100; iF = Math.sqrt(tss / 100 / h); methode = byZone ? 'HF-Zonen' : 'Ø-HF';
      }
      const km = +e.dist_m > 0 ? +(e.dist_m / 1000).toFixed(1) : null;
      return { id: e.id, date: e.date, datum: e.date.slice(8, 10) + '.' + e.date.slice(5, 7) + '.', sport, sportart: { swim: 'Schwimmen', bike: 'Rad', run: 'Laufen', wechsel: 'Wechsel' }[sport] || 'Sonstiges', type: e.type, name: e.name || '', dauer: hm(sec), min: Math.round(sec / 60), km, km_txt: km == null ? '–' : km.toFixed(1).replace('.', ','), tss: Math.round(tss), if: iF == null ? null : +iF.toFixed(2), if_txt: iF == null ? '–' : iF.toFixed(2).replace('.', ','), methode, hf: +e.avg_hr || null, np: +e.np_w || null };
    });
  },
});

dash.calc('pmc', {
  title: 'Fitness, Ermüdung, Form',
  description: 'Banister-Modell: Fitness = 42-Tage-, Ermüdung = 7-Tage-Mittel der Tagesbelastung (exponentiell); Form = Fitness − Ermüdung des Vortags; ACWR = 7 : 28 Tage.',
  inputs: ['belastung', 'garmin_tage'],
  fn: (belastung, garmin_tage) => {
    const day = {};
    belastung.forEach((b) => { day[b.date] = (day[b.date] || 0) + (+b.tss || 0); });
    const all = garmin_tage.map((d) => d.date).concat(belastung.map((b) => b.date)).filter(Boolean).sort();
    const dates = [];
    for (let t = Date.parse(all[0]); t <= Date.parse(all[all.length - 1]); t += 864e5) dates.push(new Date(t).toISOString().slice(0, 10));
    const seed = dates.slice(0, 42).reduce((s, d) => s + (day[d] || 0), 0) / Math.min(42, dates.length); // Startwert
    const kC = 1 - Math.exp(-1 / 42), kA = 1 - Math.exp(-1 / 7), l7 = 2 / 8, l28 = 2 / 29;
    let ctl = seed, atl = seed, e7 = seed, e28 = seed;
    const out = [];
    dates.forEach((d, i) => {
      const tss = day[d] || 0, tsb = ctl - atl;
      ctl += kC * (tss - ctl); atl += kA * (tss - atl); e7 += l7 * (tss - e7); e28 += l28 * (tss - e28);
      out.push({ date: d, tss: Math.round(tss), ctl: +ctl.toFixed(1), atl: +atl.toFixed(1), tsb: +tsb.toFixed(1), acwr: e28 >= 10 ? +(e7 / e28).toFixed(2) : null, rampe: i >= 7 ? +(ctl - out[i - 7].ctl).toFixed(1) : null });
    });
    return out;
  },
});

dash.calc('befinden', {
  title: 'Befinden je Tag',
  description: 'Morgen-Check-in mit fünf Fragen (1–5) nach McLean et al. 2010; Summe gegen deine Norm der letzten 28 Einträge, dazu Schmerz und Krankheitsgefühl.',
  inputs: ['checkins'],
  fn: (checkins) => {
    const ITEMS = ['schlaf', 'energie', 'muskeln', 'stress', 'stimmung'];
    const ORT = { schienbein: 'Schienbein', knie: 'Knie', achilles: 'Achillessehne', fuss: 'Fuß', huefte: 'Hüfte', ruecken: 'Rücken', schulter: 'Schulter', sonstiges: 'anderswo' };
    const LAUF = ['schienbein', 'knie', 'achilles', 'fuss', 'huefte'];
    const sumOf = (c) => ITEMS.reduce((s, k) => s + +c[k], 0);
    const R = checkins.filter((c) => c && c.date && ITEMS.every((k) => +c[k] >= 1 && +c[k] <= 5)).sort((x, y) => (x.date < y.date ? -1 : 1));
    const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
    const sd = (v) => { const m = mean(v); return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, v.length - 1)); };
    return R.map((c, i) => {
      const sum = sumOf(c), prev = R.slice(Math.max(0, i - 28), i).map(sumOf), base = prev.length >= 7;
      const m = base ? mean(prev) : 17, s = base ? Math.max(sd(prev), 1.5) : 3.5; // ohne Basis: 17 von 25 = neutral
      const z = Math.max(-3, Math.min(3, (sum - m) / s));
      const schmerz = Math.max(0, Math.min(10, Math.round(+c.schmerz || 0))), ort = ORT[c.schmerz_ort] ? c.schmerz_ort : null;
      const w7 = R.slice(Math.max(0, i - 6), i + 1).filter((x) => Date.parse(c.date) - Date.parse(x.date) < 7 * 864e5).map(sumOf);
      return {
        date: c.date, datum: c.date.slice(8, 10) + '.' + c.date.slice(5, 7) + '.', summe: sum, pct: Math.round((100 * (sum - 5)) / 20), z: +z.toFixed(2), basis: base ? +m.toFixed(1) : null, streuung: base ? +s.toFixed(2) : null, basis_n: prev.length, schnitt7: +mean(w7).toFixed(1),
        schlaf: +c.schlaf, energie: +c.energie, muskeln: +c.muskeln, stress: +c.stress, stimmung: +c.stimmung, schmerz, schmerz_ort: ort, ort_txt: ort ? ORT[ort] : '', krank: !!c.krank, notiz: c.notiz || '',
        lauf_stopp: schmerz >= 3 && LAUF.includes(ort), pause: schmerz >= 5,
      };
    });
  },
});

dash.calc('erholung', {
  title: 'Erholung je Nacht',
  description: 'HRV (ln RMSSD), Ruhepuls, Schlafleistung und Befinden je gegen deine eigene Basis – daraus der Tagesform-Score (1–99) mit absoluten Grenzen bei sehr kurzem Schlaf, Infektzeichen und starkem Schmerz.',
  inputs: ['garmin_tage', 'athlet', 'befinden'],
  fn: (garmin_tage, athlet, befinden) => {
    const a = athlet[0];
    const BF = new Map(befinden.map((b) => [b.date, b]));
    const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
    const sd = (v) => { const m = mean(v); return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, v.length - 1)); };
    const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const p = 0.3989423 * Math.exp((-z * z) / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
    const r = (x, n = 0) => (x == null || !isFinite(x) ? null : +x.toFixed(n));
    const hm = (h) => { const m = Math.round(h * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    const clock = (s) => { if (!s) return null; const h = +s.slice(11, 13) + +s.slice(14, 16) / 60; return h < 12 ? h + 24 : h; };
    const sgn = (x, u = '') => (x == null ? null : (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(x) + u);
    const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const V = garmin_tage.map((d) => {
      const sh = +d.sleep_s / 3600, ok = sh >= 3 && sh <= 13; // Nächte < 3 h oder > 13 h: Messfehler
      const need = (+d.sleep_need_min || a.schlafbedarf_min) / 60;
      return { d, t: Date.parse(d.date) / 864e5, ln: +d.hrv > 0 ? Math.log(+d.hrv) : null, rhr: +d.rhr > 0 && ok ? +d.rhr : null, resp: +d.sleep_resp > 0 && ok ? +d.sleep_resp : null, sh: ok ? sh : null, need, perf: ok ? sh / need : null };
    });
    const base = (i, k) => { // letzte 60 gültige Nächte vor heute, höchstens 120 Tage zurück
      const v = []; let von = null, bis = null;
      for (let j = i - 1; j >= 0 && v.length < 60 && V[i].t - V[j].t <= 120; j--) if (V[j][k] != null) { v.push(V[j][k]); von = V[j].d.date; bis = bis || V[j].d.date; }
      return v.length >= 14 ? { m: mean(v), s: Math.max(sd(v), 1e-6), n: v.length, von, bis } : { n: v.length };
    };
    const last7 = (i, k) => { const v = []; for (let j = i; j >= 0 && V[i].t - V[j].t < 7; j--) if (V[j][k] != null) v.push(V[j][k]); return v; };
    return V.map((x, i) => {
      const d = x.d, bh = base(i, 'ln'), br = base(i, 'rhr'), bp = base(i, 'resp'), bs = base(i, 'perf');
      const w = last7(i, 'ln'), ln7 = w.length >= 3 ? mean(w) : null, rw = last7(i, 'rhr'), rhr7 = rw.length >= 3 ? mean(rw) : null, sw = last7(i, 'sh');
      const debt = V.slice(Math.max(0, i - 7), i + 1).filter((y) => x.t - y.t < 7 && y.sh != null).reduce((s, y) => s + Math.max(0, y.need - y.sh), 0);
      const zH = bh.m != null && x.ln != null ? (x.ln - bh.m) / bh.s : null;
      const zH7 = bh.m != null && ln7 != null ? (ln7 - bh.m) / bh.s : null;
      const zR = br.m != null && x.rhr != null ? (br.m - x.rhr) / br.s : null; // positiv = niedriger Puls
      const zR7 = br.m != null && rhr7 != null ? (rhr7 - br.m) / br.s : null; // positiv = höherer Puls
      const perf = x.perf; // Schlaf gegen dein eigenes Schlafniveau; ohne Basis: 85 % des Bedarfs = neutral
      const zS = perf == null ? null : Math.max(-3, Math.min(2, bs.m != null ? (perf - bs.m) / bs.s : (perf - 0.85) / 0.15));
      const zHRV = zH == null ? null : zH7 == null ? zH : 0.7 * zH + 0.3 * zH7;
      const bf = BF.get(d.date), zB = bf ? bf.z : null;
      // Gewichte 0,4 / 0,2 / 0,2 / 0,2 – ohne Check-in ergibt die Normierung wieder 0,5 / 0,25 / 0,25
      const parts = [[zHRV, 0.4, 'HRV'], [zR, 0.2, 'Ruhepuls'], [zS, 0.2, 'Schlaf'], [zB, 0.2, 'Befinden']].filter((p) => p[0] != null);
      const respUp = bp.m != null && x.resp != null && x.resp - bp.m >= 1 && (x.resp - bp.m) / bp.s >= 2;
      let score = null, grund = '';
      if (zHRV != null && parts.length >= 2) {
        const W = parts.reduce((s, p) => s + p[1], 0), z = parts.reduce((s, p) => s + p[0] * p[1], 0) / W;
        const spread = Math.sqrt(parts.reduce((s, p) => s + (p[1] / W) ** 2, 0));
        score = Math.min(99, Math.max(1, Math.round(100 * Phi(z / spread))));
        const krank = bf && bf.krank, weh = bf && bf.schmerz >= 7;
        const cap = respUp || krank || weh ? 33 : perf == null ? 100 : perf < 0.5 ? 33 : perf < 0.65 ? 66 : 100; // absolute Grenzen
        const weakest = parts.reduce((m, p) => (p[0] < m[0] ? p : m));
        if (score > cap) { score = cap; grund = krank ? 'Krankheitsgefühl' : weh ? 'Schmerz' : respUp ? 'Atemfrequenz' : 'Schlaf'; }
        else if (weakest[0] < -0.5) grund = weakest[2];
      }
      const ampel = score == null ? 'kalibrierung' : score >= 67 ? 'gruen' : score >= 34 ? 'gelb' : 'rot';
      const quad = zH7 == null || zR7 == null ? null : Math.abs(zH7) < 0.5 && Math.abs(zR7) < 0.5 ? 'normal' : zH7 >= 0 && zR7 <= 0 ? 'erholt' : zH7 < 0 && zR7 > 0 ? 'ermuedet' : zH7 < 0 ? 'saettigung' : 'uneindeutig';
      const st = clock(d.sleep_start); let en = clock(d.sleep_end);
      if (st != null && en != null && en < st) en += 24;
      const inBed = (+d.sleep_s || 0) + (+d.awake_s || 0), sh = x.sh;
      const hrvDelta = bh.m != null && +d.hrv > 0 ? Math.round(100 * (+d.hrv / Math.exp(bh.m) - 1)) : null;
      const rhrDelta = br.m != null && x.rhr != null ? Math.round(x.rhr - br.m) : null;
      return {
        date: d.date, datum: d.date.slice(8, 10) + '.' + d.date.slice(5, 7) + '.', wtag: WT[new Date(d.date).getUTCDay()],
        score, ampel, label: { gruen: 'Bereit', gelb: 'Moderat', rot: 'Erholen', kalibrierung: 'Kalibrierung' }[ampel], grund: grund ? 'Begrenzt durch ' + grund : '',
        hrv: +d.hrv || null, hrv7: ln7 == null ? null : r(Math.exp(ln7)), hrv_basis: bh.m == null ? null : r(Math.exp(bh.m)),
        hrv_lo: bh.m == null ? null : r(Math.exp(bh.m - 0.5 * bh.s)), hrv_hi: bh.m == null ? null : r(Math.exp(bh.m + 0.5 * bh.s)),
        hrv_cv7: w.length >= 3 ? r((100 * sd(w)) / mean(w), 1) : null, hrv_delta_pct: hrvDelta, hrv_delta_txt: sgn(hrvDelta, ' %'), z_hrv: r(zH, 2), z_hrv7: r(zH7, 2),
        rhr: x.rhr, rhr7: r(rhr7, 1), rhr_basis: br.m == null ? null : r(br.m, 1), rhr_lo: br.m == null ? null : r(br.m - 0.5 * br.s, 1), rhr_hi: br.m == null ? null : r(br.m + 0.5 * br.s, 1),
        rhr_delta: rhrDelta, rhr_delta_txt: sgn(rhrDelta), z_rhr: r(zR, 2), z_rhr7: r(zR7, 2),
        atem: x.resp, atem_basis: bp.m == null ? null : r(bp.m, 1), atem_delta: bp.m != null && x.resp != null ? r(x.resp - bp.m, 1) : null, atem_alarm: respUp,
        schlaf_h: sh == null ? null : r(sh, 2), schlaf_hm: sh == null ? null : hm(sh), schlaf7_h: sw.length >= 3 ? r(mean(sw), 2) : null, bedarf_h: r(x.need, 2), bedarf_hm: hm(x.need),
        leistung_pct: perf == null ? null : Math.round(100 * perf), z_schlaf: r(zS, 2), schuld7_h: r(debt, 1), schuld7_hm: hm(debt),
        tief_h: sh == null ? null : r(+d.deep_s / 3600, 2), leicht_h: sh == null ? null : r(+d.light_s / 3600, 2), rem_h: sh == null ? null : r(+d.rem_s / 3600, 2), wach_h: sh == null ? null : r(+d.awake_s / 3600, 2),
        tief_pct: sh ? Math.round((100 * d.deep_s) / d.sleep_s) : null, rem_pct: sh ? Math.round((100 * d.rem_s) / d.sleep_s) : null, effizienz_pct: sh && inBed ? Math.round((100 * d.sleep_s) / inBed) : null,
        start_h: sh == null ? null : r(st, 2), ende_h: sh == null ? null : r(en, 2), einschlaf: sh == null ? null : d.sleep_start.slice(11, 16), aufwach: sh == null ? null : d.sleep_end.slice(11, 16),
        schlafscore: +d.sleep_score || null, quadrant: quad, basis_n: bh.n, basis_von: bh.von || null, basis_bis: bh.bis || null,
        befinden_pct: bf ? bf.pct : null, z_befinden: bf ? bf.z : null, befinden_summe: bf ? bf.summe : null, befinden_basis: bf ? bf.basis != null : null, befinden_n: bf ? bf.basis_n : null,
      };
    });
  },
});

dash.calc('heute', {
  title: 'Heute',
  description: 'Die letzte Nacht mit Daten: Tagesform, ihre Treiber, Trainingsstand und Empfehlung für den Tag.',
  inputs: ['erholung', 'pmc', 'belastung', 'athlet', 'befinden'],
  fn: (erholung, pmc, belastung, athlet, befinden) => {
    const a = athlet[0];
    if (!erholung.length || !pmc.length) return [];
    const e = [...erholung].reverse().find((r) => r.hrv != null || r.schlaf_h != null) || erholung[erholung.length - 1];
    const p = pmc.find((r) => r.date === e.date) || pmc[pmc.length - 1];
    const ck = befinden.find((b) => b.date === e.date) || [...befinden].reverse().find((b) => b.date > e.date) || null; // Check-in zur Nacht oder ein neuerer
    const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const TAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const dd = new Date(e.date), de = (s) => s.slice(8, 10) + '.' + s.slice(5, 7) + '.';
    const sgn = (x) => (x == null ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(x).toString().replace('.', ','));
    const lastTrain = belastung.filter((b) => b.tss > 0 && b.date <= e.date).map((b) => b.date).sort().pop() || null;
    const pause = lastTrain ? Math.round((Date.parse(e.date) - Date.parse(lastTrain)) / 864e5) : null;
    const peak = pmc.filter((r) => r.date <= e.date).reduce((m, r) => (r.ctl > m.ctl ? r : m), pmc[0]);
    const aufbau = pause != null && pause >= 14, rampe = aufbau ? 3 : 5; // CTL-Punkte pro Woche
    let titel, lo, hi;
    if (e.ampel === 'rot' || (ck && (ck.krank || ck.pause))) { titel = 'Erholung priorisieren'; lo = 0; hi = Math.max(15, Math.round(p.ctl * 0.5)); }
    else if (e.ampel === 'gruen') { titel = aufbau ? 'Aufbauen, locker bis moderat' : 'Bereit für Qualität'; lo = Math.round(p.ctl); hi = Math.round(p.ctl + 6 * rampe); }
    else { titel = 'Locker bewegen'; lo = 0; hi = Math.max(30, Math.round(p.ctl + 3 * rampe)); }
    const schmerz = !ck ? '' : ck.pause ? 'Schmerz ' + ck.schmerz + '/10' + (ck.ort_txt ? ' (' + ck.ort_txt + ')' : '') + ': Training pausieren und ärztlich abklären lassen.' : ck.lauf_stopp ? 'Kein Laufen heute – Schmerz ' + ck.schmerz + '/10 am ' + ck.ort_txt + '. Rad und Schwimmen nur, wenn sie schmerzfrei bleiben.' : '';
    const teile = [];
    if (e.z_hrv != null) teile.push(e.z_hrv >= 0.5 ? 'HRV über deiner Basis' : e.z_hrv <= -0.5 ? 'HRV unter deiner Basis' : 'HRV im Normalbereich');
    if (e.z_rhr != null) teile.push(e.z_rhr >= 0.5 ? 'Ruhepuls niedrig' : e.z_rhr <= -0.5 ? 'Ruhepuls erhöht' : 'Ruhepuls normal');
    const [bremse, verb] = ck && ck.krank ? ['dein Krankheitsgefühl', 'bremst'] : ck && ck.pause ? ['deine Schmerzen', 'bremsen'] : e.atem_alarm ? ['die erhöhte Atemfrequenz', 'bremst'] : e.leistung_pct != null && e.leistung_pct < 85 ? [e.schlaf_hm + ' h Schlaf', 'bremsen'] : ['', ''];
    const satz = (teile.length ? teile.join(', ') : 'Noch zu wenige Nächte für eine Basis') + (bremse ? ' – aber ' + bremse + ' ' + verb + '.' : '.') + ' Empfehlung: ' + titel + '.';
    const basisAlt = e.basis_bis ? Math.round((Date.parse(e.date) - Date.parse(e.basis_bis)) / 864e5) : null;
    return [{
      date: e.date, datum: e.datum, titel_datum: TAG[dd.getUTCDay()] + ', ' + dd.getUTCDate() + '. ' + MON[dd.getUTCMonth()], stand: 'Garmin · Daten bis ' + e.datum, satz,
      score: e.score, ampel: e.ampel, label: e.label, grund: e.grund,
      hrv: e.hrv, hrv_basis: e.hrv_basis, hrv_delta_txt: e.hrv_delta_txt, z_hrv: e.z_hrv, rhr: e.rhr, rhr_basis: e.rhr_basis, rhr_delta_txt: e.rhr_delta_txt, z_rhr: e.z_rhr,
      schlaf_hm: e.schlaf_hm, bedarf_hm: e.bedarf_hm, leistung_pct: e.leistung_pct, z_schlaf: e.z_schlaf, schuld7_hm: e.schuld7_hm, schuld7_h: e.schuld7_h,
      atem: e.atem, atem_basis: e.atem_basis, atem_alarm: e.atem_alarm, atem_txt: e.atem == null ? '–' : e.atem.toFixed(1).replace('.', ','), atem_basis_txt: e.atem_basis == null ? '–' : e.atem_basis.toFixed(1).replace('.', ','), rhr_basis_txt: e.rhr_basis == null ? '–' : e.rhr_basis.toFixed(1).replace('.', ','), basis_n: e.basis_n, basis_bis: e.basis_bis ? de(e.basis_bis) : null, basis_alt_tage: basisAlt,
      ctl: Math.round(p.ctl), atl: Math.round(p.atl), tsb_txt: sgn(Math.round(p.tsb)), acwr_txt: p.acwr == null ? '–' : p.acwr.toFixed(2).replace('.', ','), acwr_hinweis: p.acwr == null ? 'zu wenig Belastung für einen Wert' : p.acwr > 1.5 ? 'über 1,5: Belastungsspitze' : p.acwr < 0.8 ? 'unter 0,8: Entlastung' : '0,8–1,3: günstiger Bereich', rampe_txt: p.rampe == null ? '–' : sgn(p.rampe),
      ctl_peak: Math.round(peak.ctl), ctl_peak_datum: de(peak.date), pause_tage: pause, letzte_einheit: lastTrain ? de(lastTrain) : null,
      empfehlung: titel, rahmen: (lo > 0 ? lo + '–' + hi : 'bis ' + hi) + ' TSS', rahmen_min: '≈ ' + Math.round((hi / 42.25) * 60) + ' min locker',
      zone: 'Puls unter ' + a.vt1_hf, intensitaet: ck && ck.krank ? 'Krankheitsgefühl: heute kein intensives Training – bei Fieber oder Beschwerden unterhalb des Halses gar keins.' : e.ampel === 'gruen' && !aufbau && !(ck && ck.pause) ? 'Intervalle möglich, wenn sich die Beine frisch anfühlen.' : 'Unter VT1 bleiben, keine Intervalle.',
      aufbau: aufbau ? 'Wiedereinstieg nach ' + pause + ' Tagen ohne Training: Fitness höchstens um ' + rampe + ' Punkte pro Woche steigern, Laufumfang höchstens ' + a.lauf_rampe_max_pct + ' % pro Woche.' : '',
      schmerz_hinweis: schmerz, checkin_datum: ck ? ck.datum : null, checkin_date: ck ? ck.date : null, befinden_pct: ck ? ck.pct : null, z_befinden: ck ? ck.z : null, befinden_summe: ck ? ck.summe : null,
    }];
  },
});

dash.calc('wochen', {
  title: 'Wochenbilanz',
  description: 'Je Kalenderwoche (Mo–So): Stunden je Sportart, TSS, Monotonie und Strain nach Foster sowie Intensitätsverteilung.',
  inputs: ['belastung', 'garmin_einheiten', 'pmc'],
  fn: (belastung, garmin_einheiten, pmc) => {
    const zt = {};
    garmin_einheiten.forEach((e) => { zt[e.id] = [e.z1_s, e.z2_s, e.z3_s, e.z4_s, e.z5_s].map((v) => +v || 0); });
    const monday = (d) => { const t = Date.parse(d), wd = (new Date(t).getUTCDay() + 6) % 7; return new Date(t - wd * 864e5).toISOString().slice(0, 10); };
    const kw = (m) => { const t = new Date(Date.parse(m) + 3 * 864e5); return Math.floor((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 / 7) + 1; };
    const W = {};
    pmc.forEach((r) => { const w = monday(r.date); (W[w] = W[w] || { tage: [], swim: 0, bike: 0, run: 0, other: 0, z: [0, 0, 0] }).tage.push(r.tss); });
    belastung.forEach((b) => {
      const w = W[monday(b.date)]; if (!w) return;
      w[['swim', 'bike', 'run'].includes(b.sport) ? b.sport : 'other'] += b.min / 60;
      const z = zt[b.id]; if (z) { w.z[0] += z[0] + z[1] + z[2]; w.z[1] += z[3]; w.z[2] += z[4]; }
    });
    return Object.keys(W).sort().map((m) => {
      const w = W[m], n = w.tage.length, sum = w.tage.reduce((s, x) => s + x, 0), mu = sum / n;
      const sd = Math.sqrt(w.tage.reduce((s, x) => s + (x - mu) ** 2, 0) / n), zs = w.z[0] + w.z[1] + w.z[2];
      const mono = n === 7 && sd > 0 && sum > 0 ? +(mu / sd).toFixed(2) : null;
      return { woche: m, kw: 'KW ' + kw(m), schwimmen_h: +w.swim.toFixed(2), rad_h: +w.bike.toFixed(2), lauf_h: +w.run.toFixed(2), sonst_h: +w.other.toFixed(2), gesamt_h: +(w.swim + w.bike + w.run + w.other).toFixed(1), tss: Math.round(sum), monotonie: mono, strain: mono ? Math.round(sum * mono) : null, z1_pct: zs ? Math.round((100 * w.z[0]) / zs) : null, z2_pct: zs ? Math.round((100 * w.z[1]) / zs) : null, z3_pct: zs ? Math.round((100 * w.z[2]) / zs) : null };
    });
  },
});

dash.calc('intensitaet', {
  title: 'Intensitätsverteilung',
  description: 'Zeit in Herzfrequenzzonen im 3-Zonen-Modell (VT1/VT2) und Polarisierungs-Index nach Treff et al. 2019, bis zur letzten Einheit.',
  inputs: ['garmin_einheiten', 'athlet'],
  fn: (garmin_einheiten, athlet) => {
    const E = garmin_einheiten.filter((e) => !e.is_parent && e.type !== 'incident_detected');
    if (!E.length) return [];
    const last = E.map((e) => e.date).sort().pop();
    const de = (s) => s.slice(8, 10) + '.' + s.slice(5, 7) + '.';
    return [['4w', '4 Wochen', 28], ['8w', '8 Wochen', 56], ['12w', '12 Wochen', 84], ['saison', '12 Monate', 365]].map(([id, name, n]) => {
      const von = new Date(Date.parse(last) - (n - 1) * 864e5).toISOString().slice(0, 10), z = [0, 0, 0];
      E.filter((e) => e.date >= von).forEach((e) => { z[0] += (+e.z1_s || 0) + (+e.z2_s || 0) + (+e.z3_s || 0); z[1] += +e.z4_s || 0; z[2] += +e.z5_s || 0; });
      const s = z[0] + z[1] + z[2], f = z.map((v) => (s ? v / s : 0));
      const pi = s && f[2] > 0 ? Math.log10((f[0] / Math.max(f[1], 0.01)) * f[2] * 100) : null;
      const typ = !s ? 'keine Daten' : f[0] > f[2] && f[2] > f[1] && pi > 2 ? 'polarisiert' : f[0] > f[1] && f[1] > f[2] ? 'pyramidal' : f[1] >= f[0] ? 'schwellenbetont' : 'gemischt';
      return { id, fenster: name, zeitraum: de(von) + '–' + de(last), stunden: +(s / 3600).toFixed(1), z1_pct: Math.round(100 * f[0]), z2_pct: Math.round(100 * f[1]), z3_pct: Math.round(100 * f[2]), pi: pi == null ? null : +pi.toFixed(2), pi_txt: pi == null ? '–' : pi.toFixed(2).replace('.', ','), typ };
    });
  },
});

dash.calc('leistung', {
  title: 'Leistungskurve',
  description: 'Beste Durchschnittsleistung je Dauer über alle Radeinheiten (Mean-Maximal-Power) und dein Watt pro Kilo beim Referenzgewicht.',
  inputs: ['garmin_einheiten', 'athlet'],
  fn: (garmin_einheiten, athlet) => {
    const a = athlet[0];
    const lab = (s) => (s < 60 ? s + ' s' : s < 3600 ? s / 60 + ' min' : s / 3600 + ' h');
    return [1, 5, 10, 20, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200].map((s) => {
      let w = 0, date = null;
      garmin_einheiten.forEach((e) => { const v = +e['p' + s]; if (v > w && e.type !== 'incident_detected') { w = v; date = e.date; } });
      return { sek: s, dauer: lab(s), watt: w || null, wkg: w ? (w / a.gewicht_ref_kg).toFixed(2).replace('.', ',') : null, datum: date ? date.slice(8, 10) + '.' + date.slice(5, 7) + '.' + date.slice(2, 4) : null };
    });
  },
});

dash.calc('ftp', {
  title: 'FTP-Schätzungen',
  description: 'Schwellenleistung aus deinen Bestwerten (95 % von 20 min, 60-min-Wert, Critical Power) neben deinen Profilwerten.',
  inputs: ['leistung', 'athlet'],
  fn: (leistung, athlet) => {
    const a = athlet[0], b = (s) => (leistung.find((r) => r.sek === s) || {}).watt || 0;
    const kg = (w) => (w / a.gewicht_ref_kg).toFixed(2).replace('.', ',');
    const pts = [300, 600, 1200].filter((s) => b(s) > 0).map((s) => [s, b(s) * s]); // Arbeit-Zeit-Regression
    let cp = null, wPrime = null;
    if (pts.length === 3) {
      const mt = pts.reduce((s, p) => s + p[0], 0) / 3, mw = pts.reduce((s, p) => s + p[1], 0) / 3;
      cp = pts.reduce((s, p) => s + (p[0] - mt) * (p[1] - mw), 0) / pts.reduce((s, p) => s + (p[0] - mt) ** 2, 0);
      wPrime = mw - cp * mt;
    }
    const rows = [
      { id: 'p20', methode: '95 % des 20-min-Bestwerts', watt: Math.round(0.95 * b(1200)), hinweis: '20 min: ' + b(1200) + ' W' },
      { id: 'p60', methode: 'Bester 60-min-Wert', watt: b(3600), hinweis: 'so lange schon gehalten – Untergrenze' },
      { id: 'cp', methode: 'Critical Power (5/10/20 min)', watt: cp ? Math.round(cp) : null, hinweis: cp && cp < b(3600) ? 'nicht valide: kurze Bestwerte waren keine Maximaltests' : cp ? 'W′ ' + Math.round(wPrime / 1000) + ' kJ' : 'zu wenige Bestwerte' },
      { id: 'ref', methode: 'Referenz (Profil)', watt: a.ftp_ref_w, hinweis: 'Arbeitswert für Watt-Vorgaben' },
      { id: 'genannt', methode: 'Genannt, unbestätigt', watt: a.ftp_genannt_w, hinweis: 'noch nicht durch Felddaten gedeckt' },
    ];
    return rows.map((r) => ({ ...r, wkg: r.watt ? kg(r.watt) : null }));
  },
});

dash.calc('lauf', {
  title: 'Laufökonomie',
  description: 'Je Lauf ab 2 km: Schrittfrequenz, Schrittlänge, Bodenkontakt und Effizienz (steigungsbereinigtes Tempo pro Herzschlag).',
  inputs: ['garmin_einheiten'],
  fn: (garmin_einheiten) => {
    const R = garmin_einheiten
      .filter((e) => ['running', 'treadmill_running', 'trail_running'].includes(e.type) && +e.dist_m >= 2000 && +e.speed > 1.5 && +e.speed < 6)
      .map((e) => {
        const v = +e.gap_speed || +e.speed, p = Math.round(1000 / +e.speed);
        return { id: e.id, date: e.date, datum: e.date.slice(8, 10) + '.' + e.date.slice(5, 7) + '.', km: +(e.dist_m / 1000).toFixed(1), tempo: Math.floor(p / 60) + ':' + String(p % 60).padStart(2, '0'), tempo_s: p, kadenz: +e.run_cad ? Math.round(+e.run_cad) : null, schritt_m: +e.step_cm ? +(e.step_cm / 100).toFixed(2) : null, bodenkontakt_ms: +e.gct_ms ? Math.round(+e.gct_ms) : null, hf: +e.avg_hr || null, ef: +e.avg_hr > 0 ? +((v * 60) / e.avg_hr).toFixed(2) : null };
      });
    const med = (v) => { const s = v.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
    return R.map((r, i) => ({ ...r, kadenz_trend: med(R.slice(Math.max(0, i - 6), i + 1).map((x) => x.kadenz)), ef_trend: med(R.slice(Math.max(0, i - 6), i + 1).map((x) => x.ef)) })); // Median der letzten 7 Läufe
  },
});

dash.calc('rad', {
  title: 'Rad-Effizienz',
  description: 'Je Radeinheit ab 30 min mit Leistung und Puls: Normalized Power pro Herzschlag (Effizienzfaktor).',
  inputs: ['garmin_einheiten'],
  fn: (garmin_einheiten) => {
    const R = garmin_einheiten
      .filter((e) => ['cycling', 'indoor_cycling', 'virtual_ride', 'road_biking'].includes(e.type) && +e.np_w > 0 && +e.avg_hr >= 80 && +e.dur_s >= 1800) // Puls < 80: Sensorfehler
      .map((e) => ({ id: e.id, date: e.date, datum: e.date.slice(8, 10) + '.' + e.date.slice(5, 7) + '.', min: Math.round(+e.dur_s / 60), np: +e.np_w, hf: +e.avg_hr, ef: +(e.np_w / e.avg_hr).toFixed(2) }));
    const med = (v) => { const s = v.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    return R.map((r, i) => ({ ...r, ef_trend: med(R.slice(Math.max(0, i - 6), i + 1).map((x) => x.ef)) })); // Median der letzten 7 Fahrten
  },
});

dash.calc('ziele', {
  title: 'Zielzeiten',
  description: 'Deine Split-Ziele aus dem Profil als Zeiten und Tempi, dazu Rad-Korridor und Kohlenhydratziel.',
  inputs: ['athlet'],
  fn: (athlet) => {
    const a = athlet[0];
    const hm = (m) => { const x = Math.round(m); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
    const pace = (s) => { const x = Math.round(s); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
    return [{ schwimmen: hm(a.ziel_schwimmen_min), t1: hm(a.ziel_t1_min), rad: hm(a.ziel_rad_min), t2: hm(a.ziel_t2_min), wechsel: hm(a.ziel_t1_min + a.ziel_t2_min), lauf: hm(a.ziel_lauf_min), gesamt: hm(a.ziel_gesamt_min), schwimm_tempo: pace((a.ziel_schwimmen_min * 60) / (a.rennen_schwimmen_km * 10)) + ' /100 m', rad_kmh: (a.rennen_rad_km / (a.ziel_rad_min / 60)).toFixed(1).replace('.', ',') + ' km/h', lauf_tempo: pace((a.ziel_lauf_min * 60) / a.rennen_lauf_km) + ' /km', kh: a.kh_g_h_min + '–' + a.kh_g_h_max + ' g/h', korridor: Math.round(a.rad_if_min * 100) + '–' + Math.round(a.rad_if_max * 100) + ' % FTP' }];
  },
});

dash.calc('schlafmuster', {
  title: 'Schlafrhythmus',
  description: 'Über deine letzten 14 und 28 Nächte mit Daten: Dauer, Bedarf, Regelmäßigkeit (Standardabweichung) und Social Jetlag nach Wittmann et al. 2006.',
  inputs: ['erholung'],
  fn: (erholung) => {
    const N = erholung.filter((r) => r.schlaf_h != null);
    const mean = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
    const sd = (v) => { const m = mean(v); return v.length > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1)) : null; };
    const hm = (h) => { if (h == null) return null; const m = Math.round(h * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    const uhr = (h) => (h == null ? null : hm(((h % 24) + 24) % 24));
    const de = (s) => s.slice(8, 10) + '.' + s.slice(5, 7) + '.';
    return [14, 28].map((n) => {
      const R = N.slice(-n), dur = mean(R.map((r) => r.schlaf_h)), need = mean(R.map((r) => r.bedarf_h));
      const mid = (r) => (r.start_h + r.ende_h) / 2, frei = R.filter((r) => ['Sa', 'So'].includes(r.wtag)), werk = R.filter((r) => !['Sa', 'So'].includes(r.wtag));
      const sjl = frei.length >= 2 && werk.length >= 3 ? Math.abs(mean(frei.map(mid)) - mean(werk.map(mid))) : null;
      return { id: String(n), naechte: R.length, zeitraum: R.length ? de(R[0].date) + '–' + de(R[R.length - 1].date) : '–', schlaf_hm: hm(dur), bedarf_hm: hm(need), defizit_h: dur == null ? null : +Math.max(0, need - dur).toFixed(2), defizit_hm: dur == null ? null : hm(Math.max(0, need - dur)), leistung_pct: dur ? Math.round((100 * dur) / need) : null, einschlaf: uhr(mean(R.map((r) => r.start_h))), aufwach: uhr(mean(R.map((r) => r.ende_h))), einschlaf_h: R.length ? +mean(R.map((r) => r.start_h)).toFixed(2) : null, aufwach_h: R.length ? +mean(R.map((r) => r.ende_h)).toFixed(2) : null, sd_einschlaf_min: R.length > 1 ? Math.round(60 * sd(R.map((r) => r.start_h))) : null, sd_aufwach_min: R.length > 1 ? Math.round(60 * sd(R.map((r) => r.ende_h))) : null, social_jetlag_h: sjl == null ? null : +sjl.toFixed(2), social_jetlag_hm: hm(sjl), effizienz_pct: Math.round(mean(R.map((r) => r.effizienz_pct).filter((v) => v != null)) || 0) || null, tief_pct: Math.round(mean(R.map((r) => r.tief_pct)) || 0) || null, rem_pct: Math.round(mean(R.map((r) => r.rem_pct)) || 0) || null };
    });
  },
});

dash.calc('einheiten_check', {
  title: 'Einheiten-Check',
  description: 'Je Rad- und Laufeinheit aus den Sekundendaten: Intensität im 3-Zonen-Modell, Normalized Power, Variabilität, Decoupling und ein Befund, ob der Reiz zur Einheit passt.',
  inputs: ['analysen', 'belastung', 'fueling'],
  fn: (analysen, belastung, fueling) => {
    const B = new Map(belastung.map((b) => [b.id, b])), F = new Map(fueling.map((x) => [x.id, x]));
    const f = (x, n = 1) => (x == null ? '–' : x.toFixed(n).replace('.', ','));
    return analysen.filter((a) => !a.leer).map((a) => {
      const b = B.get(a.id) || {}, fu = F.get(a.id);
      const kenn = a.sport === 'rad' && a.np ? 'NP ' + a.np + ' W · IF ' + f(a.if, 2) + ' · VI ' + f(a.vi, 2) : a.z1_pct + ' % unter VT1' + (a.schnell_min ? ' · ' + a.schnell_min + ' min schnell' : '');
      return Object.assign({}, a, {
        datum: a.date.slice(8, 10) + '.' + a.date.slice(5, 7) + '.', sportart: a.sport === 'rad' ? 'Rad' : 'Laufen', dauer: b.dauer || Math.floor(a.min / 60) + ':' + String(a.min % 60).padStart(2, '0'), tss: b.tss != null ? b.tss : a.tss,
        kenn, dec_txt: a.decoupling_pct == null ? '–' : (a.decoupling_pct <= 0 ? '≤ 0' : f(a.decoupling_pct)) + ' %', kh_g_h: fu && fu.g_h != null ? fu.g_h : null,
        typ_txt: { qualitaet: 'Qualität', renntempo: 'Renntempo', grauzone: 'Grauzone', locker: a.ego ? 'Locker + Spitzen' : 'Locker', gemischt: 'Gemischt' }[a.typ] || a.typ,
      });
    }).sort((x, y) => ((x.start || x.date) < (y.start || y.date) ? 1 : -1));
  },
});

dash.calc('lauf_wochen', {
  title: 'Laufkilometer je Woche',
  description: 'Laufkilometer je Kalenderwoche (Mo–So) der letzten 16 Wochen, einschließlich der Laufabschnitte von Wettkämpfen.',
  inputs: ['garmin_einheiten'],
  fn: (garmin_einheiten) => {
    const RUN = ['running', 'treadmill_running', 'trail_running'], DAY = 864e5;
    const today = new Date().toLocaleDateString('sv-SE'), t = Date.parse(today), mon = t - ((new Date(t).getUTCDay() + 6) % 7) * DAY;
    const iso = (x) => new Date(x).toISOString().slice(0, 10);
    const kw = (m) => { const d = new Date(Date.parse(m) + 3 * DAY); return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY / 7) + 1; };
    const runs = garmin_einheiten.filter((e) => RUN.includes(e.type) && !e.is_parent && +e.dist_m > 0);
    const out = [];
    for (let k = 15; k >= 0; k--) {
      const von = iso(mon - k * 7 * DAY), bis = iso(mon - k * 7 * DAY + 6 * DAY), R = runs.filter((e) => e.date >= von && e.date <= bis);
      out.push({ woche: von, kw: 'KW ' + kw(von), km: +(R.reduce((s, e) => s + +e.dist_m, 0) / 1000).toFixed(1), laeufe: R.length, laengster: +(Math.max(0, ...R.map((e) => +e.dist_m)) / 1000).toFixed(1), aktuell: k === 0 });
    }
    return out;
  },
});

dash.calc('laufwaechter', {
  title: 'Lauf-Belastungswächter',
  description: 'Laufkilometer der Woche gegen deinen 4-Wochen-Schnitt und die Steigerungsgrenze aus dem Profil, dazu Schmerzsignale aus dem Check-in und die Schrittfrequenz – als Ampel gegen Überlastung.',
  inputs: ['lauf_wochen', 'garmin_einheiten', 'befinden', 'athlet', 'lauf'],
  fn: (lauf_wochen, garmin_einheiten, befinden, athlet, lauf) => {
    const a = athlet[0], DAY = 864e5, RUN = ['running', 'treadmill_running', 'trail_running'], ORTE = ['schienbein', 'knie', 'achilles', 'fuss', 'huefte'];
    const today = new Date().toLocaleDateString('sv-SE'), t = Date.parse(today), iso = (x) => new Date(x).toISOString().slice(0, 10);
    const f = (x, n = 0) => (x == null ? '–' : x.toFixed(n).replace('.', ','));
    const W = lauf_wochen, cur = W[W.length - 1], prev4 = W.slice(-5, -1), chronic = prev4.reduce((s, w) => s + w.km, 0) / 4;
    const base = W.slice(0, -5), baseKm = base.length ? base.reduce((s, w) => s + w.km, 0) / base.length : 0;
    const runs = garmin_einheiten.filter((e) => RUN.includes(e.type) && !e.is_parent && +e.dist_m > 0);
    const km7 = runs.filter((e) => e.date > iso(t - 7 * DAY) && e.date <= today).reduce((s, e) => s + +e.dist_m, 0) / 1000;
    const ramp = a.lauf_rampe_max_pct / 100, neu = chronic < 8;
    const budget = neu ? Math.max(10, 0.5 * baseKm) : chronic * (1 + ramp), ratio = chronic >= 8 ? km7 / chronic : null;
    // Schmerz an Laufstrukturen in den letzten 7 Tagen (Check-in)
    const P = befinden.filter((b) => b.date > iso(t - 7 * DAY) && b.schmerz > 0 && ORTE.includes(b.schmerz_ort));
    const pmax = P.reduce((m, b) => (b.schmerz > m.schmerz ? b : m), { schmerz: 0 });
    // Laufen an aufeinanderfolgenden Tagen bis heute
    const tage = new Set(runs.map((e) => e.date)); let folge = 0;
    for (let d = tage.has(today) ? t : t - DAY; tage.has(iso(d)); d -= DAY) folge++;
    const K = lauf.filter((r) => r.kadenz).slice(-5).map((r) => r.kadenz).sort((x, y) => x - y), kad = K.length ? K[K.length >> 1] : null;
    let ampel = 'gruen', titel, text;
    if (pmax.schmerz >= 3) { ampel = 'rot'; titel = 'Laufpause'; text = 'Schmerz ' + pmax.schmerz + '/10 am ' + pmax.ort_txt + ' (' + pmax.datum + '). Erst wieder laufen, wenn der Alltag schmerzfrei ist – Rad und Schwimmen halten die Fitness.'; }
    else if (ratio != null && ratio > 1.3) { ampel = 'rot'; titel = 'Steigerung zu steil'; text = 'Letzte 7 Tage ' + f(km7, 1) + ' km = +' + Math.round(100 * (ratio - 1)) + ' % zu deinem 4-Wochen-Schnitt (' + f(chronic, 1) + ' km). In einer großen Studie gingen Steigerungen über 30 % mit mehr Laufverletzungen einher.'; }
    else if (cur.km > budget * 1.15) { ampel = 'rot'; titel = 'Wochenbudget überschritten'; text = 'Diese Woche ' + f(cur.km, 1) + ' km bei einem Budget von ' + f(budget) + ' km.'; }
    else if (pmax.schmerz > 0 || (ratio != null && ratio > 1 + ramp) || cur.km > budget || folge >= 3 || (kad && kad < a.kadenz_ziel_spm - 5)) {
      ampel = 'gelb';
      titel = pmax.schmerz > 0 ? 'Leichtes Schmerzsignal' : ratio != null && ratio > 1 + ramp ? 'Steigerung über ' + a.lauf_rampe_max_pct + ' %' : cur.km > budget ? 'Budget erreicht' : folge >= 3 ? folge + ' Lauftage am Stück' : 'Schrittfrequenz niedrig';
      text = pmax.schmerz > 0 ? 'Schmerz ' + pmax.schmerz + '/10 am ' + pmax.ort_txt + ' in den letzten 7 Tagen – Umfang halten, nicht steigern, auf weichem Untergrund laufen.' : ratio != null && ratio > 1 + ramp ? 'Letzte 7 Tage ' + f(km7, 1) + ' km = +' + Math.round(100 * (ratio - 1)) + ' % zum 4-Wochen-Schnitt. Den Rest der Woche lieber aufs Rad verlagern.' : cur.km > budget ? 'Diese Woche ' + f(cur.km, 1) + ' von ' + f(budget) + ' km – für heute reicht es.' : folge >= 3 ? 'Knochen und Sehnen erholen sich langsamer als die Ausdauer: ein Tag ohne Laufen entlastet das Schienbein.' : 'Median ' + kad + ' statt ' + a.kadenz_ziel_spm + ' Schritte/min – kürzere, schnellere Schritte senken die Stoßbelastung.';
    } else { titel = neu ? 'Wiedereinstieg' : 'Laufbelastung im Rahmen'; text = neu ? 'Nach der Pause mit höchstens ' + f(budget) + ' km pro Woche starten (halber früherer Schnitt) und danach um ' + a.lauf_rampe_max_pct + ' % pro Woche steigern.' : 'Diese Woche ' + f(cur.km, 1) + ' von ' + f(budget) + ' km. Der 4-Wochen-Schnitt liegt bei ' + f(chronic, 1) + ' km.'; }
    const pause = ampel === 'rot' && pmax.schmerz >= 3, rest = ampel === 'rot' ? 0 : Math.max(0, Math.round(budget - cur.km));
    return [{ ampel, titel, text, modus: neu ? 'wiedereinstieg' : 'normal', kachel_wert: pause ? 'Pause' : String(rest), kachel_u: pause ? '' : 'km', kachel_sub: pause ? 'Schmerzsignal im Check-in' : ampel === 'rot' ? titel : 'noch frei diese Woche', woche_km: cur.km, woche_txt: f(cur.km, 1), budget_km: Math.round(budget), rest_km: Math.max(0, Math.round(budget - cur.km)), chronic_km: +chronic.toFixed(1), chronic_txt: f(chronic, 1), km7: +km7.toFixed(1), km7_txt: f(km7, 1), ratio: ratio == null ? null : +ratio.toFixed(2), ratio_txt: ratio == null ? '–' : (ratio >= 1 ? '+' : '−') + Math.abs(Math.round(100 * (ratio - 1))) + ' %', kadenz: kad, kadenz_ziel: a.kadenz_ziel_spm, folgetage: folge, schmerz_max: pmax.schmerz, ramp_pct: a.lauf_rampe_max_pct }];
  },
});

dash.calc('gewicht', {
  title: 'Gewicht',
  description: 'Gewichtseinträge aus Garmin Connect mit 7-Tage-Mittel und Abstand zum Referenzgewicht der Trainingsphase.',
  inputs: ['garmin_gewicht', 'athlet'],
  fn: (garmin_gewicht, athlet) => {
    const a = athlet[0], R = garmin_gewicht.filter((r) => +r.kg > 30 && r.date).sort((x, y) => (x.date < y.date ? -1 : 1));
    return R.map((r) => {
      const w = R.filter((x) => x.date <= r.date && Date.parse(r.date) - Date.parse(x.date) < 7 * 864e5).map((x) => +x.kg), m = w.reduce((s, x) => s + x, 0) / w.length;
      return { date: r.date, datum: r.date.slice(8, 10) + '.' + r.date.slice(5, 7) + '.' + r.date.slice(2, 4), kg: +r.kg, mittel7: +m.toFixed(1), fett_pct: r.fett_pct == null ? null : +r.fett_pct, diff_ref: +(m - a.gewicht_ref_kg).toFixed(1) };
    });
  },
});

dash.calc('gewicht_stand', {
  title: 'Gewicht & W/kg',
  description: 'Letzte Messung, 7-Tage-Mittel und welche Watt pro Kilo daraus folgen – alle W/kg im Dashboard rechnen mit dem Referenzgewicht.',
  inputs: ['gewicht', 'athlet', 'ftp'],
  fn: (gewicht, athlet, ftp) => {
    const a = athlet[0], last = gewicht[gewicht.length - 1], today = new Date().toISOString().slice(0, 10);
    const f = (x, n = 1) => (x == null ? '–' : x.toFixed(n).replace('.', ','));
    const alt = last ? Math.round((Date.parse(today) - Date.parse(last.date)) / 864e5) : null;
    const frisch = alt != null && alt <= 14, diff = last ? last.mittel7 - a.gewicht_ref_kg : null;
    const p20 = (ftp.find((x) => x.id === 'p20') || {}).watt;
    const hinweis = !last ? 'Noch keine Gewichtseinträge in Garmin Connect.' : !frisch ? 'Letzte Messung vor ' + alt + ' Tagen – W/kg rechnen mit dem Referenzgewicht ' + a.gewicht_ref_kg + ' kg.' : Math.abs(diff) >= 1.5 ? 'Dein 7-Tage-Mittel liegt ' + f(Math.abs(diff)) + ' kg ' + (diff > 0 ? 'über' : 'unter') + ' der Referenz – W/kg bleiben bei ' + a.gewicht_ref_kg + ' kg, damit sich Werte nicht mischen.' : 'Gewicht nahe deiner Referenz von ' + a.gewicht_ref_kg + ' kg.';
    const status = !last ? 'keine' : !frisch ? 'alt' : Math.abs(diff) >= 1.5 ? 'abweichung' : 'ok';
    return [{ status, letzte_kg: last ? f(last.kg) : '–', letzte_datum: last ? last.datum : '–', tage_her: alt, frisch, mittel7: last ? f(last.mittel7) : '–', ref_kg: a.gewicht_ref_kg, diff_txt: diff == null ? '–' : (diff > 0 ? '+' : diff < 0 ? '−' : '±') + f(Math.abs(diff)) + ' kg', wkg_ref: f(a.ftp_ref_w / a.gewicht_ref_kg, 2), wkg_ist: last ? f(a.ftp_ref_w / last.mittel7, 2) : '–', wkg_daten: p20 ? f(p20 / a.gewicht_ref_kg, 2) : '–', hinweis, messungen: gewicht.length }];
  },
});

dash.calc('ernaehrung', {
  title: 'Ernährung je Tag',
  description: 'Protokollierte Mahlzeiten aus Garmin Connect: Kohlenhydrate und Eiweiß pro Kilo Referenzgewicht gegen die Spannen, die zum Trainingsumfang des Tages passen.',
  inputs: ['garmin_ernaehrung', 'belastung', 'athlet'],
  fn: (garmin_ernaehrung, belastung, athlet) => {
    const a = athlet[0], kg = a.gewicht_ref_kg, h = {};
    belastung.forEach((b) => { h[b.date] = (h[b.date] || 0) + b.min / 60; });
    const f = (x) => x.toFixed(1).replace('.', ',');
    return garmin_ernaehrung.filter((r) => r.eintraege > 0).sort((x, y) => (x.date < y.date ? -1 : 1)).map((r) => {
      const th = h[r.date] || 0, [lo, hi] = th < 0.5 ? [3, 5] : th < 1.5 ? [5, 7] : th < 3.5 ? [6, 10] : [8, 12]; // g/kg/Tag nach Burke et al. 2011
      const khkg = r.kh_g / kg, ekg = r.eiweiss_g / kg;
      return { date: r.date, datum: r.date.slice(8, 10) + '.' + r.date.slice(5, 7) + '.', kcal: r.kcal, kh_g: r.kh_g, kh_gkg: +khkg.toFixed(1), kh_txt: f(khkg), eiweiss_g: r.eiweiss_g, eiweiss_gkg: +ekg.toFixed(1), eiweiss_txt: f(ekg), fett_g: r.fett_g, training_h: +th.toFixed(1), kh_lo: lo, kh_hi: hi, kh_ziel: lo + '–' + hi + ' g/kg', kh_lage: khkg < lo ? 'unter' : khkg > hi ? 'über' : 'im', eiweiss_lage: ekg < 1.2 ? 'unter' : ekg > 2 ? 'über' : 'im', eintraege: r.eintraege };
    });
  },
});

dash.calc('fueling', {
  title: 'Fueling lange Einheiten',
  description: 'Kohlenhydrate pro Stunde in Radeinheiten ab 90 min und Läufen ab 75 min – aus Garmin-Ernährungseinträgen im Zeitfenster der Einheit oder deinem Eintrag.',
  inputs: ['belastung', 'garmin_einheiten', 'garmin_ernaehrung', 'fueling_log', 'athlet'],
  fn: (belastung, garmin_einheiten, garmin_ernaehrung, fueling_log, athlet) => {
    const a = athlet[0], E = new Map(garmin_einheiten.map((e) => [e.id, e])), M = new Map(fueling_log.map((r) => [String(r.id), r]));
    const timed = []; garmin_ernaehrung.forEach((r) => (r.zeiten || []).forEach(([t, g]) => timed.push([Date.parse(t + ':00Z'), +g])));
    return belastung.filter((b) => (b.sport === 'bike' && b.min >= 90) || (b.sport === 'run' && b.min >= 75)).slice(-24).reverse().map((b) => {
      const e = E.get(b.id) || {}, man = M.get(String(b.id)), h = b.min / 60;
      let g = null, quelle = null;
      if (man && +man.kh_g >= 0) { g = +man.kh_g; quelle = 'eingetragen'; }
      else if (e.start && timed.length) {
        const t0 = Date.parse(e.start + ':00Z') - 15 * 60e3, t1 = t0 + (+e.dur_s || b.min * 60) * 1000 + 30 * 60e3;
        const s = timed.filter(([t]) => t >= t0 && t <= t1).reduce((x, [, v]) => x + v, 0);
        if (s > 0) { g = s; quelle = 'Garmin'; }
      }
      const [lo, hi] = b.sport === 'bike' ? [a.kh_g_h_min, a.kh_g_h_max] : [60, 90];
      const gh = g == null ? null : Math.round(g / h), sw = +e.schweiss_ml > 0 ? Math.round(+e.schweiss_ml / h) : null;
      return { id: b.id, date: b.date, datum: b.datum, sport: b.sport, sportart: b.sportart, dauer: b.dauer, min: b.min, kh_g: g, quelle: quelle || 'fehlt', g_h: gh, g_h_txt: gh == null ? '–' : gh + ' g/h', ziel: lo + '–' + hi + ' g/h', lo, hi, lage: gh == null ? 'fehlt' : gh < lo ? 'unter' : gh > hi ? 'über' : 'im', schweiss_ml_h: sw, schweiss_txt: sw == null ? '–' : '≈ ' + (Math.round(sw / 50) * 50) + ' ml/h' };
    });
  },
});

dash.calc('schwimmen', {
  title: 'Schwimmeinheiten',
  description: 'Je Schwimmeinheit: Tempo pro 100 m (Bewegungszeit), Anteil an deiner CSS, SWOLF, Zugfrequenz, Strecke pro Zug und Stroke-Index nach Costill et al. 1985.',
  inputs: ['garmin_einheiten', 'athlet'],
  fn: (garmin_einheiten, athlet) => {
    const a = athlet[0], css = a.css_s_100m;
    const mmss = (s) => { if (s == null || !isFinite(s)) return '–'; const x = Math.round(s); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
    const f = (x, n = 1) => (x == null ? '–' : x.toFixed(n).replace('.', ','));
    return garmin_einheiten.filter((e) => ['lap_swimming', 'open_water_swimming', 'swimming'].includes(e.type) && +e.dist_m >= 200 && (+e.moving_s || +e.dur_s) >= 60).map((e) => {
      const sec = +e.moving_s || +e.dur_s, v = +e.dist_m / sec, pace = 100 / v, pool = +e.pool_m > 0 ? (+e.pool_m > 100 ? +e.pool_m / 100 : +e.pool_m) : null;
      const freiwasser = e.type === 'open_water_swimming' || (!pool && !!e.parent_id), plaus = pace > css / 1.15;
      const pct = Math.round((100 * css) / pace), cad = +e.swim_cad || null, dps = cad ? (v * 60) / cad : +e.zug_m || null;
      const zone = !plaus ? 'unplausibel' : pct < 90 ? 'locker' : pct < 97 ? 'Ausdauer' : pct <= 103 ? 'Schwelle' : 'schnell';
      return {
        id: e.id, date: e.date, datum: e.date.slice(8, 10) + '.' + e.date.slice(5, 7) + '.', art: freiwasser ? 'Freiwasser' : pool ? 'Becken ' + pool + ' m' : 'Becken', freiwasser, bahn_m: pool, m: Math.round(+e.dist_m), km: +(e.dist_m / 1000).toFixed(2), km_txt: f(e.dist_m / 1000, 1),
        dauer: sec >= 3600 ? mmss(sec / 60) + ' h' : Math.round(sec / 60) + ' min', pace_s: +pace.toFixed(1), pace_txt: mmss(pace), css_pct: pct, zone, plausibel: plaus,
        swolf: pool && +e.swolf > 0 ? Math.round(+e.swolf) : null, zuege_min: cad ? Math.round(cad) : null, dps_m: dps ? +dps.toFixed(2) : null, dps_txt: dps ? f(dps, 2) : '–', si: dps ? +(v * dps).toFixed(2) : null, si_txt: dps ? f(v * dps, 2) : '–',
        hf: +e.avg_hr || null, fs100: +e.fs100 > 0 ? mmss(+e.fs100) : '–', fs400: +e.fs400 > 0 ? mmss(+e.fs400) : '–', multisport: !!e.parent_id,
      };
    }).sort((x, y) => (x.date < y.date ? -1 : 1));
  },
});

dash.calc('schwimm_wochen', {
  title: 'Schwimmumfang je Woche',
  description: 'Kilometer, Einheiten und mittleres Tempo (Median der plausiblen Einheiten) je Kalenderwoche.',
  inputs: ['schwimmen', 'athlet'],
  fn: (schwimmen, athlet) => {
    const css = athlet[0].css_s_100m, W = {};
    const monday = (d) => { const t = Date.parse(d), wd = (new Date(t).getUTCDay() + 6) % 7; return new Date(t - wd * 864e5).toISOString().slice(0, 10); };
    const kw = (m) => { const t = new Date(Date.parse(m) + 3 * 864e5); return Math.floor((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 / 7) + 1; };
    schwimmen.forEach((s) => { const w = monday(s.date); (W[w] = W[w] || { km: 0, n: 0, p: [] }); W[w].km += s.km; W[w].n++; if (s.plausibel) W[w].p.push(s.pace_s); });
    const mmss = (x) => Math.floor(x / 60) + ':' + String(Math.round(x % 60)).padStart(2, '0');
    return Object.keys(W).sort().map((m) => { const w = W[m], p = w.p.sort((x, y) => x - y), med = p.length ? p[p.length >> 1] : null; return { woche: m, kw: 'KW ' + kw(m), km: +w.km.toFixed(1), einheiten: w.n, pace_s: med, pace_txt: med ? mmss(med) : '–', css_pct: med ? Math.round((100 * css) / med) : null }; });
  },
});

dash.calc('css', {
  title: 'CSS-Tests',
  description: 'Critical Swim Speed aus deinen Testzeiten über 400 m und 200 m: CSS = 200 m / (T400 − T200).',
  inputs: ['css_tests', 'athlet'],
  fn: (css_tests, athlet) => {
    const mmss = (s) => { const x = Math.round(s); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
    return css_tests.filter((t) => +t.t400_s > +t.t200_s && +t.t200_s > 60).sort((x, y) => (x.date < y.date ? -1 : 1)).map((t) => {
      const v = 200 / (t.t400_s - t.t200_s), s = 100 / v;
      return { date: t.date, datum: t.date.slice(8, 10) + '.' + t.date.slice(5, 7) + '.' + t.date.slice(2, 4), t400_txt: mmss(t.t400_s), t200_txt: mmss(t.t200_s), css_s: +s.toFixed(1), css_txt: mmss(s) + ' /100 m', aktiv: Math.abs(s - athlet[0].css_s_100m) < 0.6 };
    });
  },
});

dash.calc('rad_bedarf', {
  title: 'Watt für den Ziel-Split',
  description: 'Leistung, die das Modell nach Martin et al. 1998 für deine Rad-Zielzeit braucht, je CdA – und welcher FTP-Anteil das wäre.',
  inputs: ['athlet', 'ftp'],
  fn: (athlet, ftp) => {
    const a = athlet[0], g = 9.81, m = a.gewicht_ref_kg + a.rad_kg, v = (a.rennen_rad_km * 1000) / (a.ziel_rad_min * 60);
    const daten = (ftp.find((f) => f.id === 'p20') || {}).watt;
    return [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32].map((c) => {
      const P = (0.5 * a.luftdichte * (c / 100) * v ** 3 + a.crr * m * g * v) / a.antrieb_eta;
      return { cda: c / 100, cda_txt: (c / 100).toFixed(2).replace('.', ','), watt: Math.round(P), kmh: (v * 3.6).toFixed(1).replace('.', ','), ref_pct: Math.round((100 * P) / a.ftp_ref_w), daten_pct: daten ? Math.round((100 * P) / daten) : null, genannt_pct: Math.round((100 * P) / a.ftp_genannt_w) };
    });
  },
});

dash.calc('rennen', {
  title: 'Wettkämpfe & Koppeleinheiten',
  description: 'Multisport-Einheiten mit ihren Abschnitten: Gesamtzeit und Zeit je Disziplin.',
  inputs: ['garmin_einheiten'],
  fn: (garmin_einheiten) => {
    const hm = (s) => { if (!s) return '–'; const m = Math.round(s / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    const kind = { open_water_swimming: 's', lap_swimming: 's', cycling: 'b', running: 'r', transition_v2: 't' };
    return garmin_einheiten.filter((e) => e.is_parent).map((p) => {
      const leg = { s: 0, b: 0, r: 0, t: 0 }, km = { s: 0, b: 0, r: 0 }, wechsel = [];
      let bike = null;
      garmin_einheiten.filter((c) => c.parent_id === p.id).sort((x, y) => ((x.start || '') < (y.start || '') ? -1 : 1)).forEach((c) => {
        const k = kind[c.type]; if (!k) return;
        leg[k] += +c.dur_s || 0;
        if (k === 't') wechsel.push(+c.dur_s || 0); else km[k] += (+c.dist_m || 0) / 1000;
        if (k === 'b' && (!bike || +c.dur_s > +bike.dur_s)) bike = c;
      });
      return {
        id: p.id, date: p.date, datum: p.date.slice(8, 10) + '.' + p.date.slice(5, 7) + '.' + p.date.slice(2, 4), name: p.name || 'Multisport', ort: (p.name || 'Multisport').replace(/\s*Multisport\s*$/i, '') || 'Multisport', jahr: p.date.slice(0, 4),
        gesamt: hm(+p.dur_s), km_txt: +p.dist_m > 0 ? (p.dist_m / 1000).toFixed(1).replace('.', ',') : '–', schwimmen: hm(leg.s), rad: hm(leg.b), lauf: hm(leg.r), wechsel: hm(leg.t),
        gesamt_s: +p.dur_s || 0, schwimmen_s: leg.s, rad_s: leg.b, lauf_s: leg.r, t1_s: wechsel[0] || 0, t2_s: wechsel.slice(1).reduce((s, x) => s + x, 0), schwimm_km: +km.s.toFixed(2), rad_km: +km.b.toFixed(1), lauf_km: +km.r.toFixed(2),
        rad_hm: bike && +bike.elev_m > 0 ? Math.round(+bike.elev_m) : null, rad_avg_w: bike && +bike.avg_w > 0 ? +bike.avg_w : null, rad_np_w: bike && +bike.np_w > 0 ? +bike.np_w : null,
      };
    }).sort((x, y) => (x.date < y.date ? 1 : -1));
  },
});

dash.calc('erkenntnisse', {
  title: 'Erkenntnisse',
  description: 'Regeln mit Literaturbezug, angewandt auf deine aktuellen Werte; sortiert nach Dringlichkeit.',
  inputs: ['heute', 'erholung', 'pmc', 'wochen', 'intensitaet', 'schlafmuster', 'ftp', 'lauf', 'rad_bedarf', 'athlet', 'befinden', 'gewicht_stand', 'fueling', 'schwimmen', 'ernaehrung', 'rennen', 'einheiten_check', 'laufwaechter'],
  fn: (heute, erholung, pmc, wochen, intensitaet, schlafmuster, ftp, lauf, rad_bedarf, athlet, befinden, gewicht_stand, fueling, schwimmen, ernaehrung, rennen, einheiten_check, laufwaechter) => {
    const h = heute[0], a = athlet[0], out = [];
    if (!h) return [];
    const add = (id, ton, bereich, titel, text, quelle) => out.push({ id, ton, bereich, titel, text, quelle });
    const f = (x, n = 1) => x.toFixed(n).replace('.', ',');
    // Lauf-Belastungswächter
    const lw = laufwaechter[0];
    if (lw && lw.ampel !== 'gruen') add('laufwaechter', lw.ampel === 'rot' ? 'kritisch' : 'achtung', 'training', 'Laufen: ' + lw.titel, lw.text, lw.titel.indexOf('Schritt') >= 0 ? 'Heiderscheit et al., Med Sci Sports Exerc 2011' : 'Nielsen et al., J Orthop Sports Phys Ther 2014 · Moen et al., Sports Med 2009');
    // Einheiten-Check: Grauzone, Spitzen in lockeren Einheiten, Decoupling langer Einheiten (4 Wochen bis zur letzten Einheit)
    if (einheiten_check.length) {
      const bis = einheiten_check[0].date, von = new Date(Date.parse(bis) - 27 * 864e5).toISOString().slice(0, 10), E4 = einheiten_check.filter((e) => e.date >= von);
      const grau = E4.filter((e) => e.typ === 'grauzone'), ego = E4.filter((e) => e.ego), drift = E4.filter((e) => e.decoupling_pct >= 8 && e.min >= 75);
      if (grau.length >= 2) add('grauzone', 'achtung', 'training', 'Grauzone: ' + grau.length + ' von ' + E4.length + ' Einheiten', 'In den 4 Wochen bis ' + E4[0].datum + ' lag bei ' + grau.length + ' Einheiten der Großteil zwischen den Schwellen (' + grau.slice(0, 3).map((e) => e.datum + ' ' + e.sportart).join(', ') + '). Zu hart für Grundlage, zu locker für einen Intervallreiz – die Erholung leidet, ohne dass Qualität entsteht.', 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014');
      if (ego.length >= 2) add('ego', 'achtung', 'training', 'Lockere Einheiten mit Spitzen', ego.length + ' lockere Einheiten mit kurzen harten Phasen (' + ego.slice(0, 3).map((e) => e.datum + ' ' + e.sportart).join(', ') + '). Locker heißt locker: Spitzen kosten Erholung und bringen keinen Trainingsreiz.', 'Seiler, IJSPP 2010');
      if (drift.length) add('decoupling', 'achtung', 'training', 'Puls driftet in langen Einheiten', drift.slice(0, 3).map((e) => e.datum + ' ' + e.sportart + ' ' + e.dec_txt).join(', ') + '. Steigt der Puls bei gleicher Leistung um mehr als 5 %, fehlt für diese Dauer noch aerobe Grundlage – oder es war zu heiß bzw. zu wenig Fueling.', 'Friel, The Triathlete’s Training Bible 2016');
      const stabil = E4.filter((e) => e.decoupling_pct != null && e.decoupling_pct < 5 && e.min >= 90);
      if (!drift.length && stabil.length) add('decoupling_gut', 'gut', 'training', 'Stabile Grundlage', stabil.slice(0, 3).map((e) => e.datum + ' ' + e.sportart + ' ' + e.dauer + ' h, Decoupling ' + e.dec_txt).join(' · ') + ' – Puls und Leistung laufen kaum auseinander.', 'Friel, The Triathlete’s Training Bible 2016');
    }
    // Letzte Langdistanz: Rad-Intensität gegen den Korridor
    const LD = rennen.find((r) => r.rad_km >= 150 && r.lauf_km >= 35 && (r.rad_np_w || r.rad_avg_w));
    if (LD) {
      const np = LD.rad_np_w || LD.rad_avg_w, ifr = np / a.ftp_ref_w, hi = a.rad_if_max, fd = (ftp.find((x) => x.id === 'p20') || {}).watt;
      const zl = Math.floor(a.ziel_lauf_min / 60) + ':' + String(a.ziel_lauf_min % 60).padStart(2, '0');
      add('rennen_if', ifr > hi + 0.005 ? 'achtung' : 'gut', 'leistung', LD.ort + ' ' + LD.jahr + ': Rad mit IF ' + f(ifr, 2),
        'Rad ' + LD.rad + ' h mit ' + (LD.rad_np_w ? 'NP ' : 'Ø ') + np + ' W' + (LD.rad_hm ? ' über ' + LD.rad_hm.toLocaleString('de-DE') + ' Höhenmeter' : '') + ' = ' + Math.round(ifr * 100) + ' % deiner Referenz-FTP' + (fd ? ' (' + Math.round((100 * np) / fd) + ' % der Daten-FTP)' : '') + (ifr > hi + 0.005 ? ' – dein Korridor endet bei ' + Math.round(hi * 100) + ' %.' : ' – im Korridor.') + ' Danach Marathon in ' + LD.lauf + ' h (Ziel ' + zl + ' h).' + (ifr > hi + 0.005 ? ' Genau diese Kombination soll der Korridor verhindern: Der Marathon wird auf dem Rad entschieden.' : ''),
        'Allen & Coggan 2010');
    }
    // Befinden & Schmerz
    if (h.schmerz_hinweis)
      add('schmerz', 'kritisch', 'heute', 'Schmerzsignal ernst nehmen', h.schmerz_hinweis + ' Schienbeinschmerz kann der Anfang einer Knochenstress-Reaktion sein – weniger Laufbelastung ist dann die wirksamste Maßnahme. Schmerz bis 5/10 gilt nur in der Sehnen-Reha als tolerierbar, und nur, wenn er bis zum nächsten Morgen abklingt.', 'Moen et al., Sports Med 2009 · Silbernagel et al., Am J Sports Med 2007');
    const B3 = befinden.slice(-3);
    if (B3.length === 3 && B3.every((b) => b.basis != null) && B3.reduce((s, b) => s + b.z, 0) / 3 <= -1)
      add('befinden', 'achtung', 'befinden', 'Befinden seit Tagen unter deinem Normal', 'Deine letzten drei Check-ins liegen im Schnitt deutlich unter deiner Norm (' + B3.map((b) => b.summe).join(', ') + ' von 25 Punkten). Subjektive Werte reagieren oft früher auf zu viel Belastung als HRV oder Ruhepuls.', 'Saw et al., Br J Sports Med 2016');
    else if (befinden.length && befinden.length < 7)
      add('befinden_basis', 'neutral', 'befinden', 'Befinden: Basis entsteht', 'Noch ' + (7 - befinden.length) + ' Check-ins, dann vergleicht die App dein Befinden mit deinem eigenen Normal statt mit der Skalenmitte.', 'McLean et al., IJSPP 2010');
    // Gewicht, Ernährung, Fueling
    const g = gewicht_stand[0];
    if (g && g.status !== 'ok')
      add('gewicht', g.status === 'abweichung' ? 'achtung' : 'neutral', 'koerper',
        g.status === 'abweichung' ? 'Gewicht: ' + g.mittel7 + ' kg statt ' + g.ref_kg + ' kg' : g.status === 'alt' ? 'Gewicht seit ' + g.tage_her + ' Tagen nicht gemessen' : 'Noch kein Gewicht in Garmin',
        g.hinweis + (g.status === 'abweichung' ? ' Mit aktuellem Gewicht wären es ' + g.wkg_ist + ' statt ' + g.wkg_ref + ' W/kg.' : ' Wiege dich am besten morgens nach dem Aufstehen – mit Garmin-Waage oder als Eintrag in Garmin Connect.'), 'Allen & Coggan 2010');
    const F1 = fueling.find((r) => r.sport === 'bike');
    if (F1 && F1.lage === 'fehlt')
      add('fueling_fehlt', 'neutral', 'ernaehrung', 'Fueling der letzten langen Ausfahrt fehlt', F1.datum + ', ' + F1.dauer + ' h Rad: keine Kohlenhydrate erfasst. Trag sie in Garmin Connect ein oder direkt hier – erst mit g/h lässt sich der Renn-Plan prüfen.', 'Jeukendrup, Sports Med 2014');
    else if (F1 && F1.lage === 'unter')
      add('fueling', 'achtung', 'ernaehrung', 'Fueling unter Ziel: ' + F1.g_h_txt, F1.datum + ', ' + F1.dauer + ' h Rad mit ' + F1.kh_g + ' g Kohlenhydraten. Dein Ziel sind ' + F1.ziel + ' – der Darm lässt sich auf hohe Mengen trainieren, aber nur im Training.', 'Jeukendrup, Sports Med 2014');
    else if (F1 && F1.lage !== 'fehlt')
      add('fueling', 'gut', 'ernaehrung', 'Fueling im Ziel: ' + F1.g_h_txt, F1.datum + ', ' + F1.dauer + ' h Rad – so trainierst du den Darm für das Rennen.', 'Jeukendrup, Sports Med 2014');
    const E14 = ernaehrung.filter((r) => Date.parse(r.date) >= Date.now() - 14 * 864e5);
    if (E14.length >= 3) {
      const unter = E14.filter((r) => r.kh_lage === 'unter').length;
      if (unter >= Math.ceil(E14.length / 2)) add('kh', 'achtung', 'ernaehrung', 'Oft zu wenig Kohlenhydrate', 'An ' + unter + ' von ' + E14.length + ' protokollierten Tagen lagst du unter der Spanne für deinen Trainingsumfang. Zu wenig Energie bremst Anpassung und erhöht das Verletzungsrisiko.', 'Burke et al., J Sports Sci 2011 · Mountjoy et al., Br J Sports Med 2018');
    }
    // Schwimmen
    const mmssS = (s) => { const x = Math.round(s); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
    const P10 = schwimmen.filter((s) => s.plausibel && !s.freiwasser && s.m >= 1000).slice(-10);
    if (P10.length >= 5) {
      const med = P10.map((s) => s.pace_s).sort((x, y) => x - y)[P10.length >> 1];
      if (med < a.css_s_100m - 1)
        add('css_alt', 'achtung', 'schwimmen', 'Deine CSS ist wahrscheinlich zu langsam angesetzt', 'Deine letzten ' + P10.length + ' Beckeneinheiten ab 1 km liegen im Median bei ' + mmssS(med) + ' /100 m (Bewegungszeit) – schneller als deine CSS von ' + mmssS(a.css_s_100m) + '. Über ganze Einheiten schwimmt man normalerweise nicht schneller als an der Schwelle. Ein CSS-Test (400 m und 200 m) bringt Klarheit; bis dahin überschätzen Schwimm-TSS und Rennrechner deine Intensität.', 'Wakayoshi et al., Eur J Appl Physiol 1992 · Ginn 1993');
    }
    const S28 = schwimmen.filter((s) => s.plausibel && !s.freiwasser && Date.parse(s.date) >= Date.parse(h.date) - 28 * 864e5);
    if (S28.length >= 2) {
      const p = S28.map((s) => s.pace_s).sort((x, y) => x - y)[S28.length >> 1], pct = Math.round((100 * a.css_s_100m) / p);
      const mmss = (s) => { const x = Math.round(s); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
      const ziel = (a.ziel_schwimmen_min * 60) / (a.rennen_schwimmen_km * 10);
      add('schwimmen', pct >= 90 ? 'neutral' : 'achtung', 'schwimmen', 'Schwimmtempo: ' + mmss(p) + ' /100 m', 'Median deiner ' + S28.length + ' Beckeneinheiten der letzten 4 Wochen (Bewegungszeit) = ' + pct + ' % deiner CSS von ' + mmss(a.css_s_100m) + '. Für ' + Math.floor(a.ziel_schwimmen_min / 60) + ':' + String(a.ziel_schwimmen_min % 60).padStart(2, '0') + ' h auf ' + String(a.rennen_schwimmen_km).replace('.', ',') + ' km brauchst du ' + mmss(ziel) + ' /100 m im Rennen – mit Neoprenanzug etwas leichter als im Becken.', 'Wakayoshi et al., Eur J Appl Physiol 1992 · Ginn 1993');
    }
    // Schlaf
    if (h.leistung_pct != null && h.leistung_pct < 85)
      add('schlaf_heute', h.leistung_pct < 70 ? 'kritisch' : 'achtung', 'heute', 'Schlaf begrenzt deine Erholung', 'Letzte Nacht ' + h.schlaf_hm + ' h – ' + h.leistung_pct + ' % deines Bedarfs von ' + h.bedarf_hm + ' h. Zu kurzer Schlaf drückt vor allem die Leistung in langen, gleichmäßigen Einheiten und lässt Belastung schwerer wirken.', 'Fullagar et al., Sports Med 2015');
    const s28 = schlafmuster.find((s) => s.id === '28');
    if (s28 && s28.defizit_h >= 0.5)
      add('schlaf_chronisch', 'achtung', 'schlaf', 'Dein größter Hebel: mehr Schlaf', 'Im Schnitt ' + s28.schlaf_hm + ' h in deinen letzten ' + s28.naechte + ' Nächten – ' + s28.defizit_hm + ' h unter Bedarf, jede Nacht. Als Athleten ihre Zeit im Bett auf rund 10 h verlängerten, wurden Sprints schneller und Würfe präziser; chronischer Mangel summiert sich dagegen unbemerkt.', 'Mah et al., Sleep 2011 · Van Dongen et al., Sleep 2003');
    if (s28 && s28.sd_einschlaf_min >= 60)
      add('schlaf_rhythmus', 'achtung', 'schlaf', 'Unregelmäßige Einschlafzeit', 'Deine Einschlafzeit schwankt um ± ' + s28.sd_einschlaf_min + ' min (Ø ' + s28.einschlaf + ' Uhr). Feste Zeiten stabilisieren die innere Uhr; unregelmäßiger Schlaf geht mit schlechterer Leistung einher.', 'Phillips et al., Sci Rep 2017 · Walsh et al., Br J Sports Med 2021');
    if (s28 && s28.social_jetlag_h >= 1)
      add('jetlag', 'achtung', 'schlaf', 'Social Jetlag: ' + s28.social_jetlag_hm + ' h', 'Am Wochenende verschiebt sich die Mitte deines Schlafs um ' + s28.social_jetlag_hm + ' h – als würdest du jede Woche eine Zeitzone wechseln.', 'Wittmann et al., Chronobiol Int 2006');
    // Autonomes System
    if (h.atem_alarm)
      add('atem', 'kritisch', 'heute', 'Atemfrequenz erhöht', 'Letzte Nacht ' + f(h.atem) + ' Atemzüge/min statt üblich ' + f(h.atem_basis) + '. Ein Anstieg zeigt sich oft Tage vor Infekt-Symptomen – heute nur locker und auf den Körper hören.', 'Miller et al., PLoS One 2020');
    if (h.z_hrv != null && h.z_rhr != null) {
      const gut = h.z_hrv >= 0.5 && h.z_rhr >= 0, schlecht = h.z_hrv <= -0.5 && h.z_rhr <= -0.5;
      add('autonom', gut ? 'gut' : schlecht ? 'kritisch' : 'neutral', 'heute', gut ? 'Nervensystem gut erholt' : schlecht ? 'Zeichen von Ermüdung' : 'Nervensystem im Normalbereich', 'HRV ' + h.hrv + ' ms (' + h.hrv_delta_txt + ' zur Basis von ' + h.hrv_basis + ' ms), Ruhepuls ' + h.rhr + ' (' + h.rhr_delta_txt + '). ' + (gut ? 'Hohe Vagusaktivität bei niedrigem Puls ist das Muster guter Erholung.' : schlecht ? 'Tiefe HRV bei erhöhtem Puls deutet auf unverarbeitete Belastung, Stress oder einen Infekt.' : 'Beide Werte liegen nahe deiner Norm.'), 'Buchheit, Front Physiol 2014');
    }
    if (h.basis_alt_tage != null && h.basis_alt_tage > 14)
      add('basis', 'neutral', 'erholung', 'Basis stammt aus der Zeit vor der Pause', 'Deine Vergleichswerte reichen nur bis zum ' + h.basis_bis + ' Mit jeder Nacht mit Uhr wird die Basis aktueller – für ein verlässliches Bild brauchst du mindestens 3 gültige Nächte pro Woche.', 'Plews et al., IJSPP 2014');
    // Training
    if (h.pause_tage != null && h.pause_tage >= 14)
      add('aufbau', 'achtung', 'training', 'Wiedereinstieg mit Bedacht', 'Seit ' + h.pause_tage + ' Tagen ohne Einheit: deine Fitness (CTL) fiel von ' + h.ctl_peak + ' (' + h.ctl_peak_datum + ') auf ' + h.ctl + '. Steigere sie um höchstens 3–5 Punkte pro Woche – Belastungssprünge auf niedriger Grundlage gehen mit mehr Verletzungen einher.', 'Gabbett, Br J Sports Med 2016');
    const tid = intensitaet.find((i) => i.id === '8w');
    if (tid && tid.stunden > 0)
      add('verteilung', tid.typ === 'polarisiert' || tid.z1_pct >= 75 ? 'gut' : 'achtung', 'training', 'Intensität: ' + tid.typ, 'In den 8 Wochen bis zur letzten Einheit: Z1 ' + tid.z1_pct + ' %, Z2 ' + tid.z2_pct + ' %, Z3 ' + tid.z3_pct + ' % (PI ' + tid.pi_txt + '). Spitzen-Ausdauerathleten verbringen rund 80 % der Zeit unter VT1; polarisiertes Training verbesserte VO2peak und Zeitfahrleistung stärker als Schwellentraining.', 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014');
    const mono = wochen.filter((w) => w.monotonie != null && w.tss > 0).slice(-8).reduce((m, w) => (w.monotonie > (m ? m.monotonie : 0) ? w : m), null);
    if (mono && mono.monotonie > 2)
      add('monotonie', 'achtung', 'training', 'Zu gleichförmige Woche', mono.kw + ': Monotonie ' + f(mono.monotonie, 2) + ' (Strain ' + mono.strain + '). Gleich harte Tage ohne Kontrast gingen in Studien gehäuft Infekten und Übertraining voraus.', 'Foster, Med Sci Sports Exerc 1998');
    // Leistung
    const p20 = ftp.find((x) => x.id === 'p20'), p60 = ftp.find((x) => x.id === 'p60');
    if (p20 && p20.watt)
      add('ftp', p20.watt < a.ftp_ref_w ? 'achtung' : 'gut', 'leistung', 'FTP-Realitätscheck: ≈ ' + p20.watt + ' W', 'Aus deinen Bestwerten folgen ≈ ' + p20.watt + ' W (' + p20.wkg + ' W/kg bei ' + a.gewicht_ref_kg + ' kg); dein bester 60-min-Wert liegt bei ' + p60.watt + ' W. Deine Referenz sind ' + a.ftp_ref_w + ' W. Trainingsbestwerte sind keine Tests – ein 20-min-Test klärt die Lücke, bevor du Renn-Watt festlegst.', 'Allen & Coggan 2010');
    const L = lauf.filter((r) => r.kadenz).slice(-10);
    if (L.length >= 3) {
      const k = L.map((r) => r.kadenz).sort((x, y) => x - y)[L.length >> 1];
      add('kadenz', k >= a.kadenz_ziel_spm ? 'gut' : 'achtung', 'leistung', 'Schrittfrequenz ' + k + ' statt ' + a.kadenz_ziel_spm, 'Median deiner letzten ' + L.length + ' Läufe: ' + k + ' Schritte/min. 5–10 % mehr Schritte senken die Belastung an Knie und Hüfte' + (a.groesse_cm >= 185 ? ' – bei ' + a.groesse_cm + ' cm Körpergröße ein wichtiger Schutzhebel.' : '.'), 'Heiderscheit et al., Med Sci Sports Exerc 2011');
    }
    const bed = rad_bedarf.find((r) => Math.abs(r.cda - a.cda_m2) < 1e-6);
    if (bed) {
      const hi = Math.round(a.rad_if_max * 100);
      add('radziel', bed.ref_pct > hi ? 'kritisch' : bed.daten_pct > hi ? 'achtung' : 'gut', 'leistung', 'Rad-Ziel: ' + bed.watt + ' W für ' + Math.floor(a.ziel_rad_min / 60) + ':' + String(a.ziel_rad_min % 60).padStart(2, '0') + ' h', 'Flach und windstill bei CdA ' + bed.cda_txt + ' m²: ' + bed.watt + ' W (' + bed.kmh + ' km/h) = ' + bed.ref_pct + ' % deiner Referenz-FTP, ' + bed.daten_pct + ' % der Daten-FTP. Dein Korridor endet bei ' + hi + ' % – jeder Hundertstel CdA weniger senkt den Bedarf um rund ' + Math.round(bed.watt - (rad_bedarf.find((r) => Math.abs(r.cda - a.cda_m2 + 0.01) < 1e-6) || bed).watt) + ' W.', 'Martin et al., J Appl Biomech 1998');
    }
    const rank = { kritisch: 0, achtung: 1, gut: 2, neutral: 3 };
    return out.sort((x, y) => rank[x.ton] - rank[y.ton]).map((r, i) => ({ ...r, rang: i + 1 }));
  },
});

dash.calc('morgen_push', {
  title: 'Morgen-Push',
  description: 'Text der Mitteilung am Morgen: Tagesform mit ihren Treibern, die Empfehlung, die Laufampel und – falls noch offen – die Erinnerung an den Check-in.',
  inputs: ['heute', 'laufwaechter', 'checkins'],
  fn: (heute, laufwaechter, checkins) => {
    const h = heute[0], today = new Date().toLocaleDateString('sv-SE'), ck = checkins.some((c) => c.date === today), lw = laufwaechter[0];
    if (!h) return [{ titel: 'Tagesform', text: 'Noch keine Daten aus Garmin.', url: '/#heute', checkin: !ck, aktuell: false, date: null }];
    const aktuell = h.date === today;
    const teile = [h.hrv != null ? 'HRV ' + h.hrv + ' ms' : '', h.rhr != null ? 'Ruhepuls ' + h.rhr : '', h.schlaf_hm ? 'Schlaf ' + h.schlaf_hm + ' h' : ''].filter(Boolean);
    let text = (aktuell ? '' : 'Noch ohne die letzte Nacht, Stand ' + h.datum + ': ') + (teile.length ? teile.join(' · ') + '. ' : '') + h.empfehlung + ' (' + h.rahmen + ').';
    if (lw && lw.ampel !== 'gruen') text += ' Laufen: ' + lw.titel + '.';
    if (!ck) text += ' Noch kein Check-in – dauert 20 Sekunden.';
    return [{ titel: h.score == null ? 'Tagesform: Basis entsteht' : 'Tagesform ' + h.score + ' · ' + h.label, text, url: ck ? '/#heute' : '/#befinden', checkin: !ck, aktuell, date: h.date }];
  },
});
