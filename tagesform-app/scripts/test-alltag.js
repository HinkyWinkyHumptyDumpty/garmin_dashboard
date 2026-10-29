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

console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
