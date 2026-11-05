// Prüft die Rechnungen der Version 13 offline: node scripts/test-v13.js
// Geplante Last, Beine gegen Kreislauf, Formprognose, Überlastungs-Wächter, Glykogen im Rennen und Lag 2 in „Was dich beeinflusst“.
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'alltag-motor.js'));
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 260))); if (!ok) fehler++; };
const H = '2026-11-04';

// Geplante Last je Einheit
const vo2 = M.einheitLast({ sport: 'laufen', typ: 'vo2', min: 60 });
pruefe('Last: 60 min Lauf-Intervalle ≈ 71 TSS, ganz Beine', vo2.tss === 71 && vo2.bein === 71 && vo2.kreis === 71, vo2);
const rad = M.einheitLast({ sport: 'rad', typ: 'lang', min: 240 });
pruefe('Last: lange Ausfahrt – Beine nur 15 %', rad.tss === 185 && rad.bein === Math.round(185 * 0.15), rad);
const spez = M.einheitLast({ sport: 'rad', typ: 'lang', min: 240 }, { spez: true });
pruefe('Last: lange Ausfahrt mit Renntempo ist mehr', spez.tss > rad.tss, spez);
const sw = M.einheitLast({ sport: 'schwimmen', typ: 'css', min: 50 });
pruefe('Last: Schwimmen belastet die Beine nicht', sw.bein === 0 && sw.tss > 0, sw);
const kr = M.einheitLast({ sport: 'kraft', typ: 'kraft_lauf', min: 35 }, { kraftZiel: 'kraft' }), krO = M.einheitLast({ sport: 'kraft', typ: 'kraft_oben', min: 35 }, { kraftZiel: 'kraft' }), krS = M.einheitLast({ sport: 'kraft', typ: 'kraft_lauf', min: 35 }, { kraftZiel: 'stabil' });
pruefe('Last: Kraft für die Beine > Oberkörper, Stabilität leichter', kr.bein > krO.bein && krS.bein < kr.bein && krS.tss < kr.tss, [kr, krO, krS]);
pruefe('Last: leere Einheit ist 0', M.einheitLast(null).tss === 0 && M.einheitLast({ sport: 'laufen', typ: 'locker', min: 0 }).tss === 0);
const renn = M.einheitLast({ sport: 'rad', typ: 'rennen', min: 540 }, { beinAnteil: 0.38 });
pruefe('Last: Langdistanz-Rennen mit Bein-Anteil', renn.if === 0.7 && renn.bein === Math.round(renn.tss * 0.38), renn);

// Beine gegen Kreislauf
const bel = [], gym = [];
for (let i = 0; i < 120; i++) { const d = M.plus(H, -i); if (i % 2 === 0) bel.push({ date: d, sport: 'bike', tss: 70 }); if (i % 3 === 0) bel.push({ date: d, sport: 'run', tss: 40 }); }
const ruhig = M.lastKanaele({ heute: H, belastung: bel, gym });
pruefe('Kanäle: gleichmäßiges Training → beide um 1', Math.abs(ruhig.jetzt.bein_acwr - 1) < 0.25 && Math.abs(ruhig.jetzt.kreis_acwr - 1) < 0.25 && ruhig.deutung.art === 'ok', ruhig.jetzt);
const mehrLauf = bel.map((b) => (b.sport === 'run' && b.date > M.plus(H, -8) ? Object.assign({}, b, { tss: 110 }) : b)).concat([{ date: M.plus(H, -1), sport: 'run', tss: 90 }, { date: M.plus(H, -4), sport: 'run', tss: 90 }]);
const sprung = M.lastKanaele({ heute: H, belastung: mehrLauf, gym });
pruefe('Kanäle: mehr Laufen → Beine springen, Kreislauf weniger', sprung.jetzt.bein_acwr > 1.3 && sprung.jetzt.bein_acwr - sprung.jetzt.kreis_acwr >= 0.15 && sprung.deutung.art === 'bein', sprung.jetzt);
const mitGym = M.lastKanaele({ heute: H, belastung: bel, gym: [{ d: M.plus(H, -1), s: { quad: 6, gesaess: 4, waden: 2 }, z: 'kraft', r: 7 }] });
pruefe('Kanäle: schwerer Beintag zählt nur für die Beine', mitGym.rows.find((r) => r.date === M.plus(H, -1)).bein - ruhig.rows.find((r) => r.date === M.plus(H, -1)).bein === 48 && mitGym.rows.find((r) => r.date === M.plus(H, -1)).kreis === ruhig.rows.find((r) => r.date === M.plus(H, -1)).kreis);
const mitPlan = M.lastKanaele({ heute: H, belastung: bel, gym, plan: [{ date: M.plus(H, 1), bein: 60, kreis: 60 }, { date: M.plus(H, 3), bein: 0, kreis: 120 }] });
pruefe('Kanäle: geplante Tage hängen gestrichelt dran', mitPlan.rows.filter((r) => r.geplant).length === 3 && mitPlan.jetzt.date === H, mitPlan.rows.slice(-4));
pruefe('Kanäle: Garmin-Kraft ohne Gym-Eintrag zur Hälfte', M.lastKanaele({ heute: H, belastung: [{ date: H, sport: 'kraft', tss: 40 }] }).rows.pop().bein === 20);
pruefe('Kanäle: leer ohne Absturz', M.lastKanaele({ heute: H }).jetzt.bein_acwr === null && M.lastKanaele({ heute: H }).deutung === null);

// Formprognose
const P = M.formPrognose({ start: { date: H, ctl: 70, atl: 80 }, last: { [M.plus(H, 1)]: 100 }, bis: M.plus(H, 4) });
pruefe('Prognose: Form = Fitness − Ermüdung des Vortags; nach dem harten Tag erst tiefer, dann frischer', P.length === 4 && P[0].tsb === -10 && P[1].tsb < P[0].tsb && P[3].tsb > P[1].tsb, P);
const P2 = M.formPrognose({ start: { date: H, ctl: 70, atl: 80 }, last: { [M.plus(H, 3)]: 100 }, bis: M.plus(H, 4) });
pruefe('Prognose: harte Einheit später → frischer am Tag danach … aber müder am Ende', P2[1].tsb > P[1].tsb && P2[3].tsb < P[3].tsb, [P, P2]);
pruefe('Prognose: ohne Start leer', M.formPrognose({}).length === 0 && M.formPrognose(null).length === 0);

// Überlastungs-Wächter
const er = []; for (let i = 30; i >= 0; i--) er.push({ date: M.plus(H, -i), score: 75 });
er[er.length - 4].score = 78; er[er.length - 3].score = 70; er[er.length - 2].score = 63; er[er.length - 1].score = 55;
const pmc = []; for (let i = 40; i >= 0; i--) pmc.push({ date: M.plus(H, -i), tss: i < 7 ? 120 : 60, acwr: i === 0 ? 1.35 : 1.0, tsb: -12 });
const ue = M.ueberlastung({ heute: H, erholung: er, pmc });
pruefe('Überlastung: 3 Tage fallend bei hoher Last', ue && ue.abfall === 23 && ue.werte.join() === '78,70,63,55' && ue.acwr === 1.35, ue);
pruefe('Überlastung: bei normaler Last kein Alarm', M.ueberlastung({ heute: H, erholung: er, pmc: pmc.map((r) => Object.assign({}, r, { tss: 60, acwr: 1.0, tsb: -5 })) }) === null);
const er2 = er.map((r) => Object.assign({}, r)); er2[er2.length - 2].score = 71; // nicht durchgehend fallend
pruefe('Überlastung: nicht drei Tage in Folge → nichts', M.ueberlastung({ heute: H, erholung: er2, pmc }) === null);
const er3 = er.map((r) => Object.assign({}, r)); er3[er3.length - 1].score = 69; er3[er3.length - 2].score = 72; er3[er3.length - 3].score = 76; er3[er3.length - 4].score = 78;
pruefe('Überlastung: weniger als 10 Punkte → nichts', M.ueberlastung({ heute: H, erholung: er3, pmc }) === null);
pruefe('Überlastung: alter Stand (vorgestern) → nichts', M.ueberlastung({ heute: M.plus(H, 2), erholung: er, pmc }) === null);
pruefe('Überlastung: leer ohne Absturz', M.ueberlastung({ heute: H }) === null);

// Glykogen im Rennen
const A = [{ typ: 'swim', sek: 3480, kcalH: 720, intens: 0.78 }, { typ: 't1', sek: 180, kcalH: 400, intens: 0.5 }, { typ: 'bike', sek: 17100, kcalH: 810, intens: 0.72 }, { typ: 't2', sek: 120, kcalH: 400, intens: 0.5 }, { typ: 'run', sek: 11160, kcalH: 1090, intens: 0.78 }];
const ohne = M.rennVerlauf({ abschnitte: A, kg: 80 });
const mit = M.rennVerlauf({ abschnitte: A, kg: 80, raten: [{ von: 61, bis: 346, gh: 90 }], aufnahme: [360, 390, 420, 450, 480, 510].map((t) => ({ t, g: 30 })) });
pruefe('Glykogen: Speicher 7 g/kg + 90 g', ohne.start === 650 && ohne.T === 534);
pruefe('Glykogen: ohne Essen früh unter 25 %', ohne.unter25 != null && ohne.unter25 < 300, { u: ohne.unter25 });
pruefe('Glykogen: mit 90 g/h auf dem Rad deutlich später knapp', mit.unter25 == null || mit.unter25 > ohne.unter25 + 120, { mit: mit.unter25, ohne: ohne.unter25 });
pruefe('Glykogen: nie unter 0 und Kurve fällt nie steiler als der Verbrauch', mit.punkte.every((p) => p.glyk >= 0) && mit.punkte.every((p, i) => !i || mit.punkte[i - 1].glyk - p.glyk <= 4), mit.tief);
pruefe('Glykogen: höchstens 90 g/h verwertet', mit.ende.verwertet <= mit.ende.gegessen && mit.ende.verwertet <= 90 * (534 / 60) + 1, mit.ende);
pruefe('Glykogen: Kohlenhydrat-Anteil steigt mit der Intensität', M.khAnteil(0.55) < M.khAnteil(0.72) && M.khAnteil(0.72) < M.khAnteil(0.9) && M.khAnteil(2) === 0.9 && M.khAnteil(0.1) === 0.3);
pruefe('Glykogen: leer ohne Absturz', M.rennVerlauf({ abschnitte: [] }).punkte.length >= 1);

// Was dich beeinflusst: Lag 2 – harte Tage drücken die HRV erst zwei Nächte später
const H2 = '2026-10-29', erL = [], ein = [];
for (let i = 1; i <= 100; i++) {
  const d = M.plus(H2, -i), hart = i % 3 === 0;
  if (hart) ein.push({ date: d, dur_s: 3600, moving_s: 3600, z4_s: 1500, z5_s: 300 });
  else ein.push({ date: d, dur_s: 2400, moving_s: 2400, z4_s: 0, z5_s: 0 });
}
const hartAm = new Set(ein.filter((e) => e.z4_s > 0).map((e) => e.date));
for (let i = 0; i <= 100; i++) { const d = M.plus(H2, -i), vor2 = M.plus(d, -2); erL.push({ date: d, hrv: (hartAm.has(vor2) ? 48 : 60) + ((i * 7) % 5) - 2, rhr: 50, schlaf_h: 7.5 }); }
const ef = M.einfluss({ heute: H2, erholung: erL, einheiten: ein, tage: ein.map((e) => ({ date: e.date })) });
const lag2 = ef.funde.find((f) => f.faktor === 'hart' && f.ziel === 'hrv');
pruefe('Lag 2: harte Tage → HRV zwei Nächte später niedriger', lag2 && lag2.lag === 2 && lag2.diff < 0, ef.funde.map((f) => [f.faktor, f.ziel, f.lag, Math.round(f.g * 100) / 100]));
pruefe('Lag 2: Satz sagt „zwei Nächte später“', lag2 && /zwei Nächte später deine HRV/.test(M.einflussText(lag2)), lag2 && M.einflussText(lag2));
pruefe('Lag 2: Koffein wird nicht verzögert getestet', !ef.funde.some((f) => /koffein/.test(f.faktor) && f.lag === 2));

if (fehler) { console.log('\n' + fehler + ' FEHLER'); process.exit(1); }
console.log('\nAlles in Ordnung.');
