/* Dreiklang · Beispielmodus (Version 16)
   Ausgedachte Daten für die geführte Tour: Lisa trainiert auf eine Mitteldistanz. Die Werte entstehen beim Start aus
   einem festen Startwert für den Zufall – immer relativ zum heutigen Tag, damit „Heute“ passt. Keine echte Person,
   keine echten Messungen. Geladen wird diese Datei nur im Beispielmodus (shim.js). */
(function () {
  'use strict';
  const DAY = 864e5;
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const tag = (d) => Date.parse(d + 'T00:00:00Z');
  const plus = (d, n) => iso(tag(d) + n * DAY);
  const wt = (d) => (new Date(tag(d)).getUTCDay() + 6) % 7; // 0 = Montag
  const montag = (d) => plus(d, -wt(d));
  const r1 = (x) => Math.round(x * 10) / 10;
  const NAME = 'Lisa';

  // Profil wie lib/profil.js (Standardwerte), mit Lisas Werten
  const PROFIL = {
    name: NAME, groesse_cm: 170, geburtsjahr: 1991, geschlecht: 'w', sportarten: ['schwimmen', 'rad', 'laufen', 'gym'], gewicht_ref_kg: 62, ftp_ref_w: 215, ftp_genannt_w: 215,
    hf_max: 186, lthr_lauf: 171, lthr_rad: 164, vt1_hf: 147, vt2_hf: 169, vt1_pace_s_km: 335, vt2_pace_s_km: 290, css_s_100m: 112, kadenz_ziel_spm: 172, lauf_rampe_max_pct: 10,
    schlafbedarf_min: 480, schritte_ziel: 9000, modus: 'performance', aufstehen_min: null, bett_min: null, schlafen_min: null, schritte_dyn: 0, wasser_ml: null, protein_g: null,
    zonen_3er: 'Z1 = Garmin-Zonen 1–3 (unter VT1), Z2 = Zone 4 (VT1–VT2), Z3 = Zone 5 (über VT2)',
    rennen_schwimmen_km: 3.8, rennen_rad_km: 180, rennen_lauf_km: 42.195, ziel_schwimmen_min: 75, ziel_t1_min: 5, ziel_rad_min: 360, ziel_t2_min: 4, ziel_lauf_min: 270, ziel_gesamt_min: 720,
    rad_if_min: 0.65, rad_if_max: 0.75, cda_m2: 0.27, crr: 0.004, rad_kg: 9, luftdichte: 1.2, antrieb_eta: 0.976, kh_g_h_min: 60, kh_g_h_max: 90,
    quelle: 'Beispiel – ausgedachte Werte', bestaetigt: true, aus_garmin: [], standard: [],
  };
  const ZONEN = [
    { sport: 'DEFAULT', methode: 'HR_MAX', lthr: 171, hf_max: 186, z1: 93, z2: 112, z3: 130, z4: 149, z5: 167 },
    { sport: 'RUNNING', methode: 'HR_MAX', lthr: 171, hf_max: 186, z1: 93, z2: 112, z3: 130, z4: 149, z5: 167 },
    { sport: 'CYCLING', methode: 'CUSTOM', lthr: 164, hf_max: 182, z1: 98, z2: 115, z3: 132, z4: 148, z5: 165 },
    { sport: 'SWIMMING', methode: 'HR_MAX', lthr: null, hf_max: 176, z1: 88, z2: 106, z3: 123, z4: 141, z5: 158 },
  ];
  // Anteil der Zeit in Garmin-Zone 1–5 und Ø-Puls je Art
  const ART = {
    lauf_locker: { z: [3, 12, 70, 15, 0], hf: 141 }, lauf_lang: { z: [2, 8, 70, 18, 2], hf: 144 }, lauf_koppel: { z: [0, 5, 45, 45, 5], hf: 152 },
    rad_sweet: { z: [5, 18, 32, 38, 7], hf: 146 }, rad_lang: { z: [5, 30, 55, 10, 0], hf: 132 }, rad_locker: { z: [10, 45, 45, 0, 0], hf: 125 }, rad_test: { z: [5, 15, 20, 20, 40], hf: 158 },
    swim_technik: { z: [5, 30, 50, 15, 0], hf: 128 }, swim_css: { z: [2, 15, 40, 33, 10], hf: 141 },
    kraft: { z: [40, 45, 15, 0, 0], hf: 112 }, yoga: { z: [90, 10, 0, 0, 0], hf: 88 },
  };

  function daten(heute, o) {
    o = o || {};
    const R = rng(20270614), zuf = (a, b) => a + (b - a) * R(), rund = (x, n) => Math.round(x / (n || 1)) * (n || 1);
    const N = 210, d0 = plus(heute, -(N - 1)), jetztH = new Date().getHours() + new Date().getMinutes() / 60;
    const ftpAm = (d) => (d >= plus(heute, -20) ? 215 : 205); // vor drei Wochen: neuer 20-Minuten-Test
    const krankVon = plus(heute, -41), krankBis = plus(heute, -38); // eine Erkältung – vier Tage ohne Training
    const krank = (d) => d >= krankVon && d <= krankBis;
    let nr = 0; const id = () => String(26100000000 + (nr += 7919));
    const E = [], tage = [], last = {};
    const sitzung = (d, typ, art, min, h, extra) => {
      const A = ART[art], sec = Math.round(min * 60 * zuf(0.97, 1.03)), moving = Math.round(sec * (typ === 'lap_swimming' ? 0.84 : 0.97));
      const hf = Math.round(A.hf + zuf(-3, 3)), zs = A.z.map((p) => Math.round((sec * p) / 100));
      const e = Object.assign({ id: id(), is_parent: false, date: d, start: d + 'T' + String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0'), type: typ, dur_s: sec, moving_s: moving, avg_hr: hf, max_hr: Math.round(hf + zuf(14, 24)),
        z1_s: zs[0], z2_s: zs[1], z3_s: zs[2], z4_s: zs[3], z5_s: zs[4], te_aer: r1(zuf(2.4, 3.8)), te_ana: r1(zuf(0.2, 1.6)), garmin_load: Math.round(min * zuf(0.9, 1.5)) }, extra || {});
      E.push(e);
      last[d] = (last[d] || 0) + min * (hf > 140 ? 1.4 : hf > 125 ? 1 : 0.6);
      return e;
    };
    const lauf = (d, art, min, h) => {
      const pace = { lauf_locker: 360, lauf_lang: 365, lauf_koppel: 340 }[art] + zuf(-8, 8), e = sitzung(d, 'running', art, min, h, { name: { lauf_locker: 'Lockerer Lauf', lauf_lang: 'Langer Lauf', lauf_koppel: 'Koppellauf' }[art] });
      const v = 1000 / pace; Object.assign(e, { dist_m: Math.round(v * e.moving_s), speed: +v.toFixed(3), gap_speed: +(v * 1.01).toFixed(3), elev_m: Math.round(zuf(25, 110)), run_cad: Math.round(zuf(170, 176)), step_cm: Math.round(((v * 60) / 173) * 100), gct_ms: Math.round(zuf(238, 252)), vo_cm: r1(zuf(8.2, 9)), vr_pct: r1(zuf(8.4, 9.2)) });
    };
    const pkurve = (sec, k1, k2, ftp) => { const P = (t) => Math.min(820, ftp * 0.981 + 18000 / t), o2 = {}; [1, 2, 5, 10, 20, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200].forEach((t) => { if (t <= sec) o2['p' + t] = Math.round(P(t) * (t <= 60 ? k1 : k2)); }); return o2; };
    const rad = (d, art, min, h) => {
      const ftp = ftpAm(d), f = { rad_sweet: [0.74, 0.82], rad_lang: [0.62, 0.67], rad_locker: [0.58, 0.61], rad_test: [0.8, 0.9] }[art];
      const typ = art === 'rad_lang' ? 'cycling' : 'virtual_ride', e = sitzung(d, typ, art, min, h, { name: { rad_sweet: 'Sweet Spot', rad_lang: 'Lange Ausfahrt', rad_locker: 'Lockere Runde', rad_test: '20-Minuten-Test' }[art] });
      const kmh = typ === 'cycling' ? zuf(26.5, 28.5) : zuf(28, 31);
      Object.assign(e, { dist_m: Math.round((kmh / 3.6) * e.moving_s), speed: +(kmh / 3.6).toFixed(3), elev_m: typ === 'cycling' ? Math.round(zuf(350, 900)) : 0, avg_w: Math.round(ftp * f[0] * zuf(0.98, 1.02)), np_w: Math.round(ftp * f[1] * zuf(0.99, 1.01)), bike_cad: Math.round(zuf(86, 92)) },
        art === 'rad_test' ? pkurve(e.moving_s, 0.95, 1.0, ftp) : pkurve(e.moving_s, art === 'rad_sweet' ? 0.82 : 0.7, art === 'rad_sweet' ? 0.9 : art === 'rad_lang' ? 0.74 : 0.66, ftp));
    };
    const schwimm = (d, art, min, h) => {
      const p100 = art === 'swim_css' ? zuf(118, 122) : zuf(124, 130), e = sitzung(d, 'lap_swimming', art, min, h, { name: art === 'swim_css' ? 'CSS-Intervalle' : 'Technik & Grundlage' });
      const m = rund((e.moving_s / p100) * 100, 50);
      Object.assign(e, { dist_m: m, speed: +(m / e.moving_s).toFixed(3), swim_cad: Math.round(zuf(28, 32)), swolf: Math.round(zuf(36, 40)), pool_m: 25, laengen: Math.round(m / 25), zuege_laenge: Math.round(zuf(14, 16)), fs100: Math.round(zuf(104, 110)), fs400: Math.round(zuf(455, 475)) });
    };
    // Training: Woche für Woche etwas mehr, jede vierte leichter
    for (let i = 0; i < N - 1; i++) { // heute noch nichts – die Einheit des Tages steht noch an
      const d = plus(d0, i), w = Math.floor(i / 7), f = (0.82 + Math.min(0.3, w * 0.012)) * (w % 4 === 3 ? 0.7 : 1), x = wt(d);
      if (krank(d) || R() < 0.06) continue;
      if (x === 0 && w % 2 === 0) sitzung(d, 'yoga', 'yoga', 30, 19, { name: 'Yoga' });
      if (x === 1) { rad(d, d === plus(heute, -20) ? 'rad_test' : 'rad_sweet', rund(65 * f, 5), 18.5); sitzung(d, 'strength_training', 'kraft', 40, 20, { name: 'Kraft' }); }
      if (x === 2) { lauf(d, 'lauf_locker', rund(50 * f, 5), 18); schwimm(d, 'swim_technik', rund(45 * f, 5), 7); }
      if (x === 3) schwimm(d, 'swim_css', rund(55 * f, 5), 7);
      if (x === 4 && w % 2 === 1) lauf(d, 'lauf_locker', 35, 18);
      if (x === 5) { rad(d, 'rad_lang', rund(155 * f, 5), 9); if (w % 2 === 0) lauf(d, 'lauf_koppel', 15, 11.8); }
      if (x === 6) lauf(d, 'lauf_lang', rund(80 * f, 5), 9.5);
    }
    // Tage: Schlaf, HRV, Ruhepuls, Schritte, Stress und Body Battery
    for (let i = 0; i < N; i++) {
      const d = plus(d0, i), vor = last[plus(d, -1)] || 0, k = krank(d) || krank(plus(d, -1)), trend = (i / N) * 4, x = wt(d), we = x >= 5;
      const hrv = Math.round(62 + trend + zuf(-6, 6) - (vor > 150 ? 6 : vor > 90 ? 3 : 0) - (k ? 11 : 0));
      const rhr = Math.round(48 - trend / 3 + zuf(-1.6, 1.6) + (vor > 150 ? 2 : 0) + (k ? 5 : 0));
      const schlaf = Math.round((7.3 + (we ? 0.5 : 0) + zuf(-0.6, 0.5) + (k ? 0.6 : 0)) * 3600), anf = 23 + zuf(-0.6, 0.5) + (we ? 0.4 : 0);
      const ende = anf + schlaf / 3600 + zuf(0.15, 0.3), hm = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
      const tagSessions = E.filter((e) => e.date === d), trainMin = tagSessions.reduce((s, e) => s + e.dur_s / 60, 0);
      const km = tagSessions.filter((e) => e.type === 'running').reduce((s, e) => s + e.dist_m / 1000, 0);
      let steps = Math.round(7400 + km * 1350 + (we ? 1800 : 0) + zuf(-1600, 2200) - (k ? 3500 : 0));
      const heuteAnteil = d === heute ? Math.max(0.1, Math.min(1, (jetztH - 6) / 16)) : 1;
      steps = Math.round(steps * heuteAnteil);
      {
        const deep = Math.round(schlaf * zuf(0.16, 0.21)), rem = Math.round(schlaf * zuf(0.19, 0.24)), wach = Math.round(schlaf * zuf(0.03, 0.06));
        tage.push({
          date: d, hrv, hrv_peak: hrv + Math.round(zuf(10, 18)), hrv_status: k ? 'UNBALANCED' : 'BALANCED', hrv_bal_lo: 54, hrv_bal_hi: 72,
          sleep_s: schlaf, deep_s: deep, light_s: schlaf - deep - rem - wach, rem_s: rem, awake_s: wach, sleep_start: plus(d, -1) + 'T' + hm(anf), sleep_end: d + 'T' + hm(ende), sleep_need_min: 480,
          sleep_score: Math.max(55, Math.min(95, Math.round(78 + (schlaf / 3600 - 7.3) * 9 + zuf(-6, 6) - (k ? 10 : 0)))), sleep_resp: r1(zuf(13.5, 15)), sleep_hr: rhr + Math.round(zuf(1, 4)), sleep_spo2: Math.round(zuf(95, 98)), sleep_stress: Math.round(zuf(10, 22) + (k ? 12 : 0)), awake_count: Math.round(zuf(1, 4)),
          rhr, hr_min: rhr - Math.round(zuf(3, 6)), hr_max_day: Math.max(110, ...tagSessions.map((e) => e.max_hr)), stress_avg: Math.round((zuf(22, 34) + (k ? 10 : 0)) * (d === heute ? 0.9 : 1)), worn_h: d === heute ? r1(Math.max(1, jetztH)) : r1(zuf(22.5, 23.8)), steps,
          kcal_active: Math.round((steps * 0.035 + trainMin * 8.5) * heuteAnteil), kcal_total: Math.round(1450 * (d === heute ? jetztH / 24 : 1) + (steps * 0.035 + trainMin * 8.5) * heuteAnteil), kcal_zufuhr: null,
          bb_max: Math.max(45, Math.min(100, Math.round(92 - vor / 6 + zuf(-6, 4) - (k ? 25 : 0)))), bb_min: Math.round(zuf(12, 32)), bb_charged: Math.round(zuf(55, 80)), bb_drained: Math.round(zuf(50, 85) * heuteAnteil),
          im_moderate: Math.round(tagSessions.reduce((s, e) => s + (e.z2_s + e.z3_s) / 60, 0)), im_vigorous: Math.round(tagSessions.reduce((s, e) => s + (e.z4_s + e.z5_s) / 60, 0)), wasser_ml: null, schweiss_ml: null,
        });
      }
    }
    // Check-ins: fast jeden Morgen der letzten sechs Wochen – heute noch offen
    const checkins = [];
    for (let i = 1; i <= 42; i++) {
      const d = plus(heute, -i); if (R() < 0.15) continue;
      const vor = last[plus(d, -1)] || 0, k = krank(d), q = () => Math.max(1, Math.min(5, Math.round(zuf(3.6, 4.6) - (k ? 1.6 : 0))));
      checkins.push({ date: d, schlaf: q(), energie: q(), muskeln: Math.max(1, q() - (vor > 120 ? 1 : 0)), stress: q(), stimmung: q(), schmerz: 0, schmerz_ort: null, krank: !!k, notiz: '', at: d + 'T06:58:00.000Z' });
    }
    checkins.sort((a, b) => (a.date < b.date ? -1 : 1));
    const gewicht = [126, 110, 95, 80, 64, 47, 33, 19, 6].map((n, j) => ({ date: plus(heute, -n), kg: r1(62.9 - j * 0.12 + zuf(-0.2, 0.2)), fett_pct: null, wasser_pct: null, muskel_kg: null, messungen: 1 }));
    // Plan: Mitteldistanz in gut sieben Monaten, seit vier Wochen in Arbeit
    const renn = plus(montag(plus(heute, 7 * 32)), 6), pStart = plus(montag(heute), -28);
    const plan = { v: 1, sporte: ['schwimmen', 'rad', 'laufen', 'kraft', 'mobil'], ziel: 'rennen', haupt: null, rsport: 'tri', rdist: 'md', rdatum: renn, rname: 'Mitteldistanz am See', wochen: 12, start: pStart, stunden: 9, tage: [1, 2, 3, 5, 6], lang: 6, niveau: o.niveau || 'fortgeschritten', aktuell: 8, erledigt: {}, tests: true, erstellt: pStart,
      extra: [{ id: 'bspwand1', d: plus(montag(heute), -1), sport: 'andere', art: 'locker', min: 150, name: 'Wandern', f: 1 }] };
    const gymLog = [-20, -13, -6].map((n) => ({ d: plus(montag(heute), n + 1), t: 'Ganzkörper', min: 40, z: 'kraft', s: { brust: 3, ruecken: 4, beine: 4, gesaess: 3, schulter: 2, bauch: 2 } }));
    const flowLog = [-21, -7].map((n) => ({ d: plus(montag(heute), n), t: 'Hüfte & Rücken', min: 30, stil: 'yoga' }));
    const wettkaempfe = [
      { id: 'bspA', name: 'Mitteldistanz am See', datum: renn, sport: 'tri', distanz: 'md', prio: 'A', ziel_s: 5 * 3600 + 25 * 60, notiz: '', at: pStart + 'T10:00:00.000Z' },
      { id: 'bspB', name: 'Stadttriathlon', datum: plus(montag(plus(heute, 7 * 23)), 6), sport: 'tri', distanz: 'od', prio: 'B', ziel_s: 2 * 3600 + 35 * 60, notiz: '', at: pStart + 'T10:05:00.000Z' },
    ];
    const athlet = Object.assign({}, PROFIL, {
      wissen: o.wissen || 'fortgeschritten', modus: o.modus || 'performance',
      schwellen: [{ ab: '2000-01-01', w: { ftp_ref_w: 205, css_s_100m: 112, lthr_lauf: 171, lthr_rad: 164, hf_max: 186, vt1_hf: 147, vt2_hf: 169, vt1_pace_s_km: 335, vt2_pace_s_km: 290 } },
        { ab: plus(heute, -20), w: { ftp_ref_w: 215, css_s_100m: 112, lthr_lauf: 171, lthr_rad: 164, hf_max: 186, vt1_hf: 147, vt2_hf: 169, vt1_pace_s_km: 335, vt2_pace_s_km: 290 } }],
    });
    const jetzt = new Date();
    return {
      konto: { uid: 'beispiel', email: '', garmin: true, garmin_seit: plus(heute, -400) },
      stand: { at: new Date(jetzt.getTime() - 25 * 60e3).toISOString(), voll: true, sekunden: 4, tage: N, einheiten: E.length, bis: heute, schlaf_heute: true, import_ab: d0, import_fertig: true, luecken: 0, offen: 0, analysiert: 0, analyse_offen: 0, abrufe: 1, wiederholt: 0, http_fehler: {}, phasen_s: {}, bereit_in_s: 0 },
      rechner: { plan, gym: { log: gymLog }, flow: { log: flowLog }, spiel: { start: plus(heute, -90), gesehen: { lvl: 99 } } },
      datasets: { garmin_tage: tage, garmin_einheiten: E.sort((a, b) => (a.start < b.start ? -1 : 1)), garmin_gewicht: gewicht, garmin_ernaehrung: [], garmin_hf_zonen: ZONEN, checkins, css_tests: [], fueling_log: [], analysen: [], wettkaempfe, tagebuch: [], methoden: o.methoden || [], athlet: [athlet], eigene: plan.extra },
    };
  }
  window.tfBeispiel = { daten, NAME };
})();
