// Prüft die Rechnungen aus public/alltag-motor.js offline: node scripts/test-alltag.js
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'alltag-motor.js'));
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 240))); if (!ok) fehler++; };
const nah = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-9);

// Ziele
pruefe('Wasser: Mann ohne Training 2,0 l', M.wasserZiel({ geschlecht: 'm' }).ml === 2000);
pruefe('Wasser: Frau, 90 min, 1,2 l/h → 1,6 + 1,8 l', M.wasserZiel({ geschlecht: 'w', trainingMin: 90, schweissLh: 1.2 }).ml === 3400, M.wasserZiel({ geschlecht: 'w', trainingMin: 90, schweissLh: 1.2 }));
pruefe('Wasser: eigenes Ziel gilt', M.wasserZiel({ geschlecht: 'm', eigen: 2700, trainingMin: 120 }).ml === 2700);
pruefe('Eiweiß: Alltag 0,8 g/kg', M.proteinZiel({ gewicht: 80, modus: 'alltag' }).g === 65);
pruefe('Eiweiß: ab 65 Jahren 1,0 g/kg', M.proteinZiel({ gewicht: 70, modus: 'alltag', alter: 70 }).g === 70);
pruefe('Eiweiß: Sport 1,6 g/kg', M.proteinZiel({ gewicht: 80, modus: 'performance' }).g === 130);

// Schrittziel
const st = {}; for (let i = 1; i <= 28; i++) st[M.plus('2026-10-29', -i)] = 7000 + (i % 5) * 300;
const sz = M.schrittZiel({ basis: 8000, dyn: true, datum: '2026-10-29', schritte: (d) => st[d] || 0 });
pruefe('Schrittziel dynamisch: Median + 500, auf 500 gerundet', sz.art === 'dynamisch' && sz.ziel === 8000, sz);
pruefe('Schrittziel an roten Tagen kleiner', M.schrittZiel({ basis: 8000, dyn: true, datum: '2026-10-29', schritte: (d) => st[d] || 0, ampel: 'rot' }).ziel === 6500);
pruefe('Schrittziel fest ohne Option', M.schrittZiel({ basis: 9000, dyn: false }).ziel === 9000);
pruefe('Schrittziel: zu wenige Tage → fest', M.schrittZiel({ basis: 9000, dyn: true, datum: '2026-10-29', schritte: () => 0 }).art === 'fest');

// Zeitfenster
const f = M.tagesFenster({ aufwachMin: 6 * 60 + 30, schlafbedarfMin: 480 });
pruefe('Schlafenszeit 22:15 bei 6:30 Uhr und 8 h', M.uhrzeit(f.bett) === '22:15', M.uhrzeit(f.bett));
pruefe('Koffein-Stopp 8,8 h vorher → 13:15', M.uhrzeit(f.koffein) === '13:15', M.uhrzeit(f.koffein));
pruefe('Letzte große Mahlzeit 19:15, Licht dimmen 21:15', M.uhrzeit(f.essen) === '19:15' && M.uhrzeit(f.dimmen) === '21:15', [M.uhrzeit(f.essen), M.uhrzeit(f.dimmen)]);
const fr = M.tagesFenster({ aufwachMin: 6 * 60 + 30, schlafbedarfMin: 480, ampel: 'rot' });
pruefe('Roter Tag: 30 min früher ins Bett', fr.bett === f.bett - 30, [fr.bett, f.bett]);
const fn = M.tagesFenster({ aufwachMin: 9 * 60, schlafbedarfMin: 540 });
pruefe('Spät auf: Schlafenszeit nach Mitternacht bleibt in Ordnung', M.uhrzeit(fn.bett) === '23:45' && fn.bett < 1440 + 60, [M.uhrzeit(fn.bett), fn.bett]);
pruefe('Tagestyp: grün = Fokus-Tag', M.tagesTyp({ ampel: 'gruen', schlafMin: 470 }).id === 'fokus');
pruefe('Tagestyp: grün, aber kurze Nacht = normal', M.tagesTyp({ ampel: 'gruen', schlafMin: 330 }).id === 'normal');
pruefe('Tagestyp: krank = Schon-Tag', M.tagesTyp({ ampel: 'gruen', krank: true }).id === 'schon');

// Kohlenhydrate
pruefe('KH: Ruhetag 3–5 g/kg', M.khBedarf({ einheiten: [], gewicht: 80 }).g.join() === '240,400');
pruefe('KH: 60 min → 5–7 g/kg', M.khBedarf({ einheiten: [{ sport: 'laufen', min: 60 }], gewicht: 80 }).stufe === 'moderat');
pruefe('KH: 3 h → 6–10 g/kg', M.khBedarf({ einheiten: [{ sport: 'rad', min: 180 }], gewicht: 80 }).g.join() === '480,800');
pruefe('KH: 5 h → 8–12 g/kg', M.khBedarf({ einheiten: [{ sport: 'rad', min: 240 }, { sport: 'laufen', min: 60 }], gewicht: 80 }).stufe === 'sehr_hoch');
pruefe('KH: Yoga zählt nicht als Trainingslast', M.khBedarf({ einheiten: [{ sport: 'mobil', min: 60 }], gewicht: 80 }).stufe === 'leicht');
pruefe('Schlüsseleinheit: 4 h Rad', M.schluessel({ sport: 'rad', typ: 'lang', min: 240, hart: 2 }) === 'lang');
pruefe('Schlüsseleinheit: 45 min locker nicht', M.schluessel({ sport: 'laufen', typ: 'locker', min: 45, hart: 0 }) === null);
const br = M.briefing({ einheit: { sport: 'rad', typ: 'lang', min: 240, hart: 2 }, gewicht: 80, khMin: 90, khMax: 120 });
pruefe('Briefing: unterwegs 105 g/h, Flasche 60 g (33 + 27)', br.unterwegs.ziel === 105 && br.unterwegs.flasche.malto === 33 && br.unterwegs.flasche.frukt === 27 && br.unterwegs.rest === 45, br.unterwegs);
pruefe('Briefing: Frühstück 1–2 g/kg', br.frueh.g.join() === '80,160');

// Beine
const log = [{ d: '2026-10-28', z: 'kraft', s: { quad: 4, gesaess: 3, beinbeuger: 2, brust: 3 } }];
const i1 = M.interferenz({ gym: log, datum: '2026-10-29', einheiten: [{ sport: 'laufen', typ: 'vo2', hart: 2, min: 50 }] });
pruefe('Interferenz: 9 Beinsätze gestern + Intervalle heute → Warnung', i1 && i1.stufe === 'warnung' && i1.saetze === 9, i1);
pruefe('Interferenz: lockerer Lauf → nichts', M.interferenz({ gym: log, datum: '2026-10-29', einheiten: [{ sport: 'laufen', typ: 'locker', hart: 0, min: 40 }] }) === null);
pruefe('Interferenz: leichte Einheit (RPE 4, stabil) → nichts', M.interferenz({ gym: [{ d: '2026-10-28', z: 'stabil', r: 4, s: { quad: 6, gesaess: 4 } }], datum: '2026-10-29', einheiten: [{ sport: 'laufen', typ: 'schwelle', hart: 2, min: 50 }] }) === null);
pruefe('Interferenz: vorgestern sehr schwer (≥ 12) → noch Warnung', !!M.interferenz({ gym: [{ d: '2026-10-27', z: 'kraft', r: 9, s: { quad: 6, gesaess: 4 } }], datum: '2026-10-29', einheiten: [{ sport: 'laufen', typ: 'schwelle', hart: 2, min: 50 }] }));

// Schweiß
const sr = M.schweissRate({ min: 60, vor: 80, nach: 79.2, ml: 500 });
pruefe('Schweißrate 0,8 kg + 0,5 l in 1 h = 1,3 l/h', nah(sr.lh, 1.3, 0.001), sr);
pruefe('Schweißrate unplausibel → ok=false', M.schweissRate({ min: 60, vor: 80, nach: 75, ml: 0 }).ok === false);
const sp = M.schweissProfil([{ d: '2026-07-01', b: 'hitze', min: 60, vor: 80, nach: 78.8, ml: 500 }, { d: '2026-10-01', b: 'rolle', min: 60, vor: 80, nach: 79.4, ml: 600 }]);
pruefe('Schweißprofil je Bedingung', sp.je.hitze.lh === 1.7 && sp.je.rolle.lh === 1.2, sp.je);

// Material
const ein = [
  { id: 1, date: '2026-10-01', start: '2026-10-01 07:00', type: 'road_biking', dist_m: 100000 },
  { id: 2, date: '2026-10-05', start: '2026-10-05 18:00', type: 'virtual_ride', dist_m: 40000 },
  { id: 3, date: '2026-10-10', start: '2026-10-10 18:00', type: 'indoor_cycling', dist_m: 0, dur_s: 3600 },
  { id: 4, date: '2026-10-12', start: '2026-10-12 08:00', type: 'running', dist_m: 12000 },
  { id: 5, date: '2026-10-13', start: '2026-10-13 08:00', type: 'trail_running', dist_m: 8000 },
  { id: 6, date: '2026-10-14', start: '2026-10-14 08:00', type: 'running', dist_m: 21100 },
];
const mat = { items: [
  { id: 'tt', art: 'rad', name: 'Zeitfahrrad', wo: 'beides', seit: '2026-01-01', ziel: 300, wachs: '2026-10-05T12:00' },
  { id: 'rr', art: 'rad', name: 'Rennrad', wo: 'draussen', seit: '2026-01-01', std: true },
  { id: 'sh', art: 'schuh', name: 'Daily', wo: 'strasse', seit: '2026-09-01', km0: 300, ziel: 700 },
  { id: 'tr', art: 'schuh', name: 'Trail', wo: 'trail', seit: '2026-09-01' },
], zu: { 6: 'tr' } };
const ms = M.materialStand({ material: mat, einheiten: ein, heute: '2026-10-29' });
const by = Object.fromEntries(ms.items.map((x) => [x.id, x]));
pruefe('Material: Standard-Rad bekommt die Ausfahrt draußen', by.rr.km === 100 && by.tt.kmDraussen === 0, [by.rr.km, by.tt.kmDraussen]);
pruefe('Material: Rolle aufs Rad für „beides“, ohne Strecke ~30 km/h', by.tt.kmRolle === 70 && by.tt.geschaetzt, by.tt);
pruefe('Material: km seit Wachsen ab Zeitpunkt', by.tt.kmWachs === 70, by.tt.kmWachs);
pruefe('Material: Schuh mit Start-km, Zuordnung von Hand', by.sh.km === 312 && by.tr.km === 29, [by.sh.km, by.tr.km]);

// Vergleich
const v = M.vergleich([10, 12, 11, 13, 12, 11, 12, 13], [8, 9, 8, 10, 9, 9, 8, 10]);
pruefe('Vergleich: klarer Unterschied erkannt', v.klar && nah(v.diff, 2.875, 1e-9), v);
const v2 = M.vergleich([10, 12, 9, 13, 8, 11], [11, 9, 12, 10, 12, 9]);
pruefe('Vergleich: Rauschen ist nicht klar', !v2.klar, v2);
const mo = M.mitOhne({ tage: ['a', 'b', 'c', 'd'], hat: (d) => (d === 'd' ? null : d !== 'c'), wert: (d) => ({ a: 1, b: 2, c: 3 }[d]), min: 1 });
pruefe('Mit/ohne: unbekannte Tage fallen raus', mo.n1 === 2 && mo.n2 === 1, mo);

// Woche
const wb = M.wochenBilanz({ montag: '2026-10-26', bis: '2026-11-01',
  einheiten: [{ date: '2026-10-26', type: 'running', dur_s: 3600, moving_s: 3500, dist_m: 10000 }, { date: '2026-10-27', type: 'strength_training', dur_s: 2700 }, { date: '2026-10-19', type: 'running', dur_s: 3600 }],
  gym: [{ d: '2026-10-27', min: 45, s: { quad: 3, brust: 3 } }, { d: '2026-10-29', min: 40, s: { ruecken: 4 } }],
  flow: [{ d: '2026-10-28', min: 20 }],
  tage: [{ date: '2026-10-26', sleep_s: 7.5 * 3600, steps: 9000 }, { date: '2026-10-27', sleep_s: 6.5 * 3600, steps: 7000 }],
  checkins: [{ date: '2026-10-26', schlaf: 4, energie: 4, muskeln: 3, stress: 4, stimmung: 4 }, { date: '2026-10-20', schlaf: 3, energie: 3, muskeln: 3, stress: 3, stimmung: 3 }],
  tagebuch: [{ date: '2026-10-26', w: 2100 }, { date: '2026-10-27', w: 1500 }], wasserZiel: 2000, plan: { '2026-10-26': [1, 1], '2026-10-27': [2, 1] } });
pruefe('Woche: Uhr + App ohne Doppelzählung (Kraft am 27.)', wb.einheiten === 4 && wb.app === 2, wb);
pruefe('Woche: Schlaf, Schritte, Check-in, Wasser, Plan', wb.schlaf_h === 7 && wb.schritte === 8000 && wb.befinden === 19 && wb.befinden_vor === 15 && wb.wasser_tage === 1 && wb.plan.join() === '3,2', wb);
pruefe('Woche: Text für die Mitteilung', /Einheiten/.test(M.wochenText(wb).text), M.wochenText(wb));

/* ===================== Version 9 ===================== */
// Statistik: p-Werte und Benjamini-Hochberg gegen Tabellenwerte
pruefe('p-Wert: t = 2,228 bei 10 FG ≈ 0,05', nah(M.pWert(2.228, 10), 0.05, 2e-4), M.pWert(2.228, 10));
pruefe('p-Wert: t = 12,706 bei 1 FG ≈ 0,05', nah(M.pWert(12.706, 1), 0.05, 2e-4), M.pWert(12.706, 1));
pruefe('p-Wert: große Stichprobe wie Normalverteilung (1,96 → 0,05)', nah(M.pWert(1.96, 1e6), 0.05, 2e-4));
pruefe('p-Wert: t = 0 → 1', M.pWert(0, 8) === 1);
const q = M.bhQ([0.01, 0.04, 0.03, 0.5]);
pruefe('Benjamini-Hochberg: q-Werte', nah(q[0], 0.04, 1e-12) && nah(q[1], 0.04 * 4 / 3, 1e-12) && nah(q[2], 0.04 * 4 / 3, 1e-12) && nah(q[3], 0.5, 1e-12), q);
const wt = M.welch([5, 6, 7, 6, 5, 6, 7, 6], [4, 5, 4, 5, 4, 5, 4, 5]);
pruefe('Welch: Mittelwerte, Effektgröße positiv', nah(wt.m1, 6, 1e-12) && nah(wt.m2, 4.5, 1e-12) && wt.g > 1 && wt.p < 0.01, wt);

// Was dich beeinflusst: spätes Koffein senkt den Tiefschlaf der folgenden Nacht (künstliche Daten)
let seed = 42;
const zufall = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const rausch = (sd) => (zufall() + zufall() + zufall() - 1.5) * sd * 2; // ungefähr normalverteilt
const H9 = '2026-10-29', tb9 = [], er9 = [], ck9 = [];
for (let i = 120; i >= 1; i--) {
  const d = M.plus(H9, -i), spaet = zufall() < 0.45;
  tb9.push({ date: d, w: 1800 + Math.round(zufall() * 600), p: 100, k: spaet ? ['08:00', '17:30'] : ['08:15'] });
  er9.push({ date: M.plus(d, 1), tief_h: +((spaet ? 0.85 : 1.0) + rausch(0.1)).toFixed(2), schlaf_h: +(7.5 + rausch(0.4)).toFixed(2), hrv: Math.round(60 + rausch(6)), rhr: Math.round(50 + rausch(2)), score: Math.round(60 + rausch(12)) });
  if (zufall() < 0.7) ck9.push({ date: d, schlaf: 4, energie: 3 + (zufall() < 0.5 ? 1 : 0), muskeln: 4, stress: 3 + (zufall() < 0.5 ? 1 : 0), stimmung: 4 });
}
const ef9 = M.einfluss({ heute: H9, tagebuch: tb9, erholung: er9, checkins: ck9, koffeinStopp: 16 * 60 + 45, wasserZiel: 2000 });
const tief = ef9.funde.find((f) => f.faktor === 'koffein_spaet' && f.ziel === 'tief');
pruefe('Einfluss: spätes Koffein → weniger Tiefschlaf gefunden', !!tief && !tief.gut && tief.diff < 0, ef9.funde.map((f) => f.faktor + '>' + f.ziel));
pruefe('Einfluss: kein Fund im reinen Rauschen (HRV)', !ef9.funde.some((f) => f.faktor === 'koffein_spaet' && f.ziel === 'hrv'), ef9.funde.map((f) => [f.faktor, f.ziel, f.q]));
pruefe('Einfluss: Falschfunde begrenzt (höchstens 1 außer dem echten)', ef9.funde.filter((f) => !(f.faktor === 'koffein_spaet' && f.ziel === 'tief')).length <= 1, ef9.funde.map((f) => [f.faktor, f.ziel, f.q]));
pruefe('Einfluss: Satz in Klartext', tief && /^Nach Tagen mit Koffein nach 16:45 war am nächsten Morgen dein Tiefschlaf im Schnitt kürzer: \d+ min statt \d+ min \(−\d+ %\)\.$/.test(M.einflussText(tief)), tief && M.einflussText(tief));
pruefe('Einfluss: gleicher Fragebogen am Folgetag wird nicht gegen sich selbst getestet', !ef9.funde.concat([]).some((f) => f.faktor === 'stress_morgen' && f.ziel === 'stress'));
const leer = M.einfluss({ heute: H9 });
pruefe('Einfluss: ohne Daten keine Tests, kein Absturz', leer.getestet === 0 && leer.funde.length === 0 && leer.tage === 0, leer);
const wenig = M.einfluss({ heute: H9, tagebuch: tb9.slice(-12), erholung: er9.slice(-12), koffeinStopp: 1005 });
pruefe('Einfluss: unter 8 Tagen je Gruppe kein Test', !wenig.funde.length, wenig.getestet);

// Frühwarnung
const norm = (d, x) => Object.assign({ date: d, rhr: 50, rhr_basis: 50, z_rhr: 0, z_hrv: 0, hrv_delta_pct: 0, atem_delta: 0 }, x || {});
const reihe = (letzte) => { const r = []; for (let i = 10; i >= 0; i--) { const d = M.plus(H9, -i); r.push(norm(d, letzte[i])); } return r; };
pruefe('Frühwarnung: alles normal → nichts', M.fruehwarnung({ heute: H9, erholung: reihe({}) }).stufe === null);
const fw3 = M.fruehwarnung({ heute: H9, erholung: reihe({ 0: { rhr: 57, z_rhr: -2.5, z_hrv: -1.8, hrv_delta_pct: -22, atem_delta: 1.3 } }) });
pruefe('Frühwarnung: Puls + HRV + Atmung in einer Nacht → Warnung', fw3.stufe === 'warnung' && fw3.signale.join() === 'puls,hrv,atem' && fw3.werte.puls === 7, fw3);
pruefe('Frühwarnung: Verlauf merkt sich den Tag', fw3.verlauf[H9] === 'warnung');
pruefe('Frühwarnung: zwei Zeichen in einer Nacht → Achtung', M.fruehwarnung({ heute: H9, erholung: reihe({ 0: { rhr: 56, z_hrv: -1.7 } }) }).stufe === 'achtung');
pruefe('Frühwarnung: zwei Zeichen zwei Nächte nacheinander → Warnung', M.fruehwarnung({ heute: H9, erholung: reihe({ 0: { rhr: 56, z_hrv: -1.7 }, 1: { rhr: 55, atem_delta: 1.1 } }) }).stufe === 'warnung');
pruefe('Frühwarnung: dasselbe Zeichen drei Nächte → Achtung', M.fruehwarnung({ heute: H9, erholung: reihe({ 0: { rhr: 55 }, 1: { rhr: 56 }, 2: { rhr: 55 } }) }).stufe === 'achtung');
pruefe('Frühwarnung: ein Zeichen allein → nichts', M.fruehwarnung({ heute: H9, erholung: reihe({ 0: { rhr: 58 } }) }).stufe === null);
pruefe('Frühwarnung: kleine Streuung – z allein reicht nicht unter +3 bpm', M.fruehwarnung({ heute: H9, erholung: reihe({ 0: { rhr: 52, z_rhr: -2, z_hrv: -1.6 } }) }).signale.join() === 'hrv');
pruefe('Frühwarnung: „krank“ im Check-in → sofort Warnung', M.fruehwarnung({ heute: H9, erholung: reihe({}), checkins: [{ date: H9, krank: true }] }).stufe === 'warnung');
pruefe('Frühwarnung: heute noch keine Daten → letzte Nacht zählt', M.fruehwarnung({ heute: M.plus(H9, 1), erholung: reihe({ 0: { rhr: 57, z_hrv: -1.8, atem_delta: 1.2 } }) }).stufe === 'warnung');
const gf = [0, 1, 2].map((i) => ({ date: M.plus(H9, -i), puls: 58, puls_basis: 52 }));
pruefe('Frühwarnung ohne Uhr: Ruhepuls von Hand 3 Tage erhöht → Achtung', M.fruehwarnung({ heute: H9, gefuehl: gf }).stufe === 'achtung');

// Social Jetlag
const sj = [];
for (let i = 1; i <= 28; i++) { const d = M.plus(H9, -i), frei = M.wtag(d) >= 5; sj.push({ date: d, start_h: frei ? 25.5 : 23, ende_h: frei ? 33.5 : 30.5 }); }
const sjl = M.socialJetlag({ heute: H9, erholung: sj });
pruefe('Social Jetlag: Schlafmitte frei gegen Werktag', sjl && nah(sjl.sjl_h, 2.75, 1e-9) && sjl.werkAuf === 390 && sjl.freiAuf === 570 && sjl.freiBett === 90 && sjl.werkBett === 1380, sjl);
pruefe('Social Jetlag: zu wenig Nächte → nichts', M.socialJetlag({ heute: H9, erholung: sj.slice(0, 5) }) === null);

// Termin-Plan: Prüfung um 8 Uhr, sonst Aufstehen 7:00 → am Termintag 6:00, zwei Schritte à 30 min
const tp = (h) => M.terminPlan({ heute: h, termin: { d: '2026-11-03', t: '08:00', art: 'pruefung', n: 'Statistik' }, aufMin: 420, bedarfMin: 480 });
const t5 = tp('2026-10-29');
pruefe('Termin: 5 Tage vorher – Plan mit Start in 4 Tagen', t5.k === 5 && t5.schritte === 2 && t5.phase === 'vorher' && /in 4 Tagen jeden Tag 30 Minuten früher aufstehen – am Termintag um 6:00/.test(t5.tipps[0][1]), t5);
const t2 = tp('2026-11-01');
pruefe('Termin: 2 Tage vorher – Bett 22:15, morgen 06:30', t2.phase === 'kurz' && t2.bettHeute === 1335 && t2.tipps.some((x) => /22:15 ins Bett, morgen um 6:30/.test(x[1])), t2);
const t1 = tp('2026-11-02');
pruefe('Termin: Vortag – Bett 21:45, Wecker 06:00', t1.bettHeute === 1305 && t1.tipps.some((x) => /21:45 ins Bett \(Wecker 6:00\)/.test(x[1])), t1.tipps);
const t0 = tp('2026-11-03');
pruefe('Termin: am Tag selbst – kurz bewegen vor der Prüfung', t0.phase === 'heute' && t0.tipps.some((x) => /zügig gehen/.test(x[1])), t0.tipps);
pruefe('Termin: vorbei oder zu weit weg → nichts', tp('2026-11-04') === null && M.terminPlan({ heute: H9, termin: { d: '2027-03-01', art: 'tour' } }) === null);
pruefe('Termin: mehr als 7 Tage → nur Countdown', M.terminPlan({ heute: H9, termin: { d: '2026-11-20', art: 'tour' } }).phase === 'spaeter');
const kurzfr = ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'].map((h) => M.terminPlan({ heute: h, termin: { d: '2026-11-01', t: '06:30', art: 'pruefung', e: '2026-10-29' }, aufMin: 414, bedarfMin: 480 }).aufHeute);
pruefe('Termin kurzfristig eingetragen: größere Schritte ab morgen, am Termintag der Wecker', kurzfr.join() === '414,364,314,270', kurzfr);
pruefe('Termin kurzfristig: Tipp nennt die Schrittweite', /jeden Tag 50 Minuten früher/i.test(M.terminPlan({ heute: '2026-10-29', termin: { d: '2026-11-01', t: '06:30', art: 'pruefung', e: '2026-10-29' }, aufMin: 414 }).tipps[0][1]));
pruefe('Termin: ohne Uhrzeit keine Verschiebung', M.terminPlan({ heute: H9, termin: { d: '2026-11-01', art: 'praesentation' }, aufMin: 420 }).schritte === 0);

// Wetter
const wz = { hourly: { time: [], temperature_2m: [], apparent_temperature: [], precipitation_probability: [], cloud_cover: [], uv_index: [] } };
for (let h = 0; h < 48; h++) {
  const tag = h < 24 ? H9 : M.plus(H9, 1), std = h % 24;
  wz.hourly.time.push(tag + 'T' + String(std).padStart(2, '0') + ':00');
  wz.hourly.temperature_2m.push(14 + 14 * Math.sin(Math.PI * Math.max(0, std - 6) / 16));
  wz.hourly.apparent_temperature.push(14 + 15 * Math.sin(Math.PI * Math.max(0, std - 6) / 16));
  wz.hourly.precipitation_probability.push(std >= 15 ? 70 : 10);
  wz.hourly.cloud_cover.push(std < 12 ? 20 : 80);
  wz.hourly.uv_index.push(std >= 11 && std <= 15 ? 6.4 : 1);
}
const wt9 = M.wetterTipps(wz, { heute: H9, aufMin: 420 });
pruefe('Wetter: sonniger Morgen, Regen ab 15 Uhr, Hitze, UV 6', wt9 && /sonnig/.test(wt9.tipps[0][1]) && wt9.regenAb === 15 && wt9.hitze && wt9.tipps.some((x) => /UV-Index 6: zwischen 11 und 16 Uhr/.test(x[1])), wt9);
pruefe('Wetter: Chips Temperatur, Regen, UV', wt9.chips.map((c) => c[1]).join(' | ') === '11–28 °C | Regen ab 15 Uhr | UV 6', wt9.chips);
const kalt = JSON.parse(JSON.stringify(wz)); kalt.hourly.temperature_2m = kalt.hourly.temperature_2m.map((t) => t - 15); kalt.hourly.apparent_temperature = kalt.hourly.apparent_temperature.map((t) => t - 18);
const wk = M.wetterTipps(kalt, { heute: H9, aufMin: 420 });
pruefe('Wetter: Frost-Hinweis, keine Hitze', wk.tipps.some((x) => /Frost/.test(x[1])) && !wk.hitze, wk.tipps);
pruefe('Wetter: keine Daten für heute → nichts', M.wetterTipps(wz, { heute: '2026-12-01' }) === null && M.wetterTipps(null, { heute: H9 }) === null);

// Fokus-Block und Grundlagen-Trend
pruefe('Fokus-Block nach Tagestyp', M.fokusBlock('fokus').arbeit === 50 && M.fokusBlock('normal').runden === 3 && M.fokusBlock('schon').arbeit === 25);
const lr = [];
for (let i = 0; i < 6; i++) lr.push({ date: M.plus(H9, -3 - 6 * i), ef: 1.1, tempo_s: 330 }, { date: M.plus(H9, -45 - 6 * i), ef: 1.0, tempo_s: 345 });
const et = M.efTrend(lr, H9, 'lauf');
pruefe('Grundlagen-Trend Lauf: +10 % → 33 s/km schneller bei gleichem Puls', et && et.pct === 10 && et.sek === 33, et);
const rr = [];
for (let i = 0; i < 5; i++) rr.push({ date: M.plus(H9, -2 - 7 * i), ef: 1.6, np: 210 }, { date: M.plus(H9, -50 - 6 * i), ef: 1.5, np: 200 });
const er = M.efTrend(rr, H9, 'rad');
pruefe('Grundlagen-Trend Rad: +6,7 % → 13 W mehr bei gleichem Puls', er && er.pct === 6.7 && er.watt === 13, er);
pruefe('Grundlagen-Trend: zu wenig Einheiten → nichts', M.efTrend(lr.slice(0, 5), H9, 'lauf') === null);

// ---------- Version 10 ----------
{
const H10 = '2026-11-04';
pruefe('Check-in-Tags: zehn Ursachen, gute Gegenrichtung wo sinnvoll', M.CK_TAGS.length === 10 && M.CK_TAGS.find((t) => t[0] === 'alkohol')[2] === 'Kein Alkohol');
// Trend: 4 Wochen gegen das Halbjahr
const tr = []; for (let i = 0; i < 182; i++) tr.push({ date: M.plus(H10, -i), v: i < 28 ? 52 + (i % 3) : 56 + (i % 3) });
const t1 = M.trend(tr, H10);
pruefe('Trend: Ruhepuls 4 bpm niedriger → Pfeil nach unten', t1 && t1.richtung === -1 && nah(t1.diff, -4, 0.2), t1);
const t2 = M.trend(tr.map((x) => ({ date: x.date, v: 60 + (x.date.charCodeAt(9) % 3) })), H10);
pruefe('Trend: nur übliches Auf und Ab → stabil', t2 && t2.richtung === 0, t2);
pruefe('Trend: zu wenige Werte → nichts', M.trend(tr.slice(0, 20), H10) === null);
// Zeitraum gegen den gleich langen davor
const z1 = M.zeitraum(tr, H10, 30);
pruefe('Zeitraum 30 Tage: Vergleich mit den 30 davor', z1 && z1.b != null && z1.richtung === -1, z1);
const z2 = M.zeitraum(tr.slice(0, 33), H10, 30);
pruefe('Zeitraum: zu wenig davor → nur Schnitt', z2 && z2.b == null && z2.richtung === undefined, z2);
pruefe('Wochen-Summen nach Montag', M.wochen([{ date: '2026-11-02', v: 2 }, { date: '2026-11-08', v: 3 }, { date: '2026-11-09', v: 1 }]).get('2026-11-02') === 5);
// Momente und Bilanz
const ein = []; for (let i = 0; i < 70; i++) if (i % 2 === 0) ein.push({ date: M.plus(H10, -i), min: 50, km: 9, kat: 'lauf' });
const mo = M.momente({ heute: H10, einheiten: ein, tagesform: [], schritte: [] });
pruefe('Rückblick: in der ersten Novemberwoche steht der Oktober bereit', mo.length && mo[0].story === '2026-10', mo.map((x) => x.id));
const bi = M.bilanz({ von: '2026-10-01', bis: '2026-10-31', einheiten: ein, tagesform: [{ date: '2026-10-05', v: 70 }, { date: '2026-10-06', v: 60 }], schritte: [], hrv: [], rhr: [], quests: 12, kraft: [{ name: 'Kniebeuge', vorher: 100, nachher: 108 }] });
pruefe('Monatsbilanz: Einheiten, Kilometer, Tagesform, Quests, Kraft', bi.einheiten === ein.filter((e) => e.date.slice(0, 7) === '2026-10').length && bi.km === bi.einheiten * 9 && bi.tagesform === 65 && bi.quests === 12 && bi.kraft.length === 1, bi);
// Nachmittagstief
const n1 = M.nachmittagstief({ jetztMin: 14 * 60, schlafH: 6.5, bedarfH: 8, bettMin: 23 * 60 });
pruefe('14 Uhr, 1,5 h Schlaf zu wenig → Power-Nap', n1 && n1.art === 'nap', n1);
pruefe('16 Uhr → kein Nickerchen mehr, lieber gehen', M.nachmittagstief({ jetztMin: 16 * 60, schlafH: 6, bedarfH: 8, bettMin: 23 * 60 }).art === 'gehen');
pruefe('Genug geschlafen → gehen', M.nachmittagstief({ jetztMin: 14 * 60, schlafH: 8, bedarfH: 8, bettMin: 23 * 60 }).art === 'gehen');
pruefe('Vormittags kein Nachmittagstief', M.nachmittagstief({ jetztMin: 11 * 60 }) === null);
pruefe('Früh ins Bett (20:30) → kein Nap um 14:30', M.nachmittagstief({ jetztMin: 14 * 60 + 30, schlafH: 6, bedarfH: 8, bettMin: 20 * 60 + 30 }).art === 'gehen');
// Pause und Wiedereinstieg
pruefe('Pause krank: Tag 3', M.rueckkehr({ seit: '2026-11-02', art: 'krank' }, H10).phase === 'pause' && M.rueckkehr({ seit: '2026-11-02', art: 'krank' }, H10).tage === 3);
pruefe('Angeschlagen: eigene Phase', M.rueckkehr({ seit: '2026-11-03', art: 'angeschlagen' }, H10).phase === 'angeschlagen');
const r0 = M.rueckkehr({ seit: '2026-11-01', art: 'krank', gesund: H10 }, H10), r3 = M.rueckkehr({ seit: '2026-11-01', art: 'krank', gesund: '2026-11-01' }, H10);
pruefe('Gesund heute → Stufe 1 (höchstens 20 min)', r0.phase === 'rueckkehr' && r0.stufe === 0 && r0.max === 20, r0);
pruefe('Drei Tage gesund → Stufe 3', r3.stufe === 2, r3);
pruefe('Beschwerden zurück → eine Stufe zurück', M.rueckkehr({ seit: '2026-11-01', art: 'krank', gesund: '2026-11-01', zurueck: 1 }, H10).stufe === 1);
pruefe('Nach 7 Tagen: geschafft', M.rueckkehr({ seit: '2026-10-20', art: 'krank', gesund: '2026-10-25' }, H10).phase === 'fertig');
// Mini-Experiment: deutlicher Unterschied nur bei großem Effekt
const ER = [], start = '2026-10-21';
for (let i = -16; i <= 8; i++) { const d = M.plus(start, i); ER.push({ date: d, schlaf_h: i >= 1 && i <= 7 ? 7.9 + (i % 2) * 0.1 : 6.9 + (Math.abs(i) % 3) * 0.1, hrv: 50 + ((i + 20) % 4), rhr: 55, score: 60 }); }
const ex = M.experimentVergleich({ start, tage: [0, 1, 2, 3, 4, 5, 6].map((i) => M.plus(start, i)), erholung: ER, checkins: [] });
const exS = ex.find((x) => x.id === 'schlaf'), exH = ex.find((x) => x.id === 'hrv'), exB = ex.find((x) => x.id === 'befinden');
pruefe('Experiment: 1 h mehr Schlaf → deutlich besser', exS && exS.deutlich && exS.gut, exS);
pruefe('Experiment: HRV gleich → kein klarer Unterschied', exH && !exH.deutlich, exH);
pruefe('Experiment: ohne Check-ins → zu wenig Daten', exB && exB.zuWenig, exB);
pruefe('Experiment: ohne Tage → nichts', M.experimentVergleich({ start, tage: [] }) === null);
// Ursachen-Tags im Einfluss: Alkohol am Abend → niedrigere HRV am Morgen; Top 3 nennt die gute Gegenrichtung
const ckT = [], erT = [];
for (let i = 1; i <= 60; i++) {
  const d = M.plus(H10, -i), alk = i % 3 === 0; // Tag d: Alkohol → Check-in am Morgen danach
  ckT.push({ date: M.plus(d, 1), schlaf: 4, energie: 4, muskeln: 4, stress: 4, stimmung: 4, tags: alk ? ['alkohol'] : ['draussen'] });
  erT.push({ date: M.plus(d, 1), hrv: alk ? 40 + (i % 4) : 55 + (i % 4), rhr: 55, schlaf_h: 7.5, score: 65 });
}
const ef = M.einfluss({ heute: H10, erholung: erT, checkins: ckT, tage: [], tagebuch: [], einheiten: [], gym: [], flow: [], stack: [] });
const fa = ef.funde.find((f) => f.faktor === 'tag:alkohol' && f.ziel === 'hrv');
pruefe('Einfluss: Tag „Alkohol“ → HRV niedriger erkannt', fa && !fa.gut, ef.funde.map((f) => [f.faktor, f.ziel, f.gut]).slice(0, 6));
const t3 = M.top3(ef, 3);
pruefe('Top 3: nennt „Kein Alkohol“ statt „Alkohol“', t3.some((x) => x.label === 'Kein Alkohol'), t3.map((x) => x.label));
pruefe('Top 3: höchstens drei, je Gewohnheit einmal', t3.length <= 3 && new Set(t3.map((x) => x.faktor)).size === t3.length);
pruefe('Top 3: leer ohne Funde', M.top3({ funde: [] }).length === 0 && M.top3(null).length === 0);
// Push im Pause-Modus
const P = require(path.join(__dirname, '..', 'lib', 'push.js'));
pruefe('Push: krank → kein Training', /kein Training/.test(P.pauseZeile({ seit: '2026-11-02', art: 'krank' }, H10)));
pruefe('Push: Wiedereinstieg Stufe 2 von 4', P.pauseZeile({ seit: '2026-11-01', art: 'krank', gesund: '2026-11-03' }, H10) === 'Wiedereinstieg Stufe 2 von 4: heute höchstens 30 Minuten, locker.');
pruefe('Push: ohne Pause nichts', P.pauseZeile({ alt: [] }, H10) === '' && P.pauseZeile(null, H10) === '' && P.pauseZeile({ seit: 'gestern', art: 'krank' }, H10) === '');
}

console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
