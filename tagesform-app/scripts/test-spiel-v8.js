// Prüft die Spielregeln aus Version 8 mit erfundenen Daten: node scripts/test-spiel-v8.js
// Gesundheits-Quests (Trinken, Eiweiß, Kurz-Routinen), „klug erholt“ an roten Tagen, dynamisches Schrittziel,
// Schlaf aus dem Check-in ohne Uhr – und dass XP dabei nie sinken und schrittweise gleich bleiben wie in einem Rutsch.
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'spiel-motor.js'));
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 260))); if (!ok) fehler++; };
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const zufall = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();

// 90 Tage bis 3 Wochen nach dem Stichtag
const ende = plus(M.V8, 21), von = plus(ende, -90);
const tage = [], einheiten = [], checkins = [], tagebuch = [], ampel = {}, flow = [], gym = [];
for (let d = von, i = 0; d <= ende; d = plus(d, 1), i++) {
  tage.push({ date: d, steps: 6000 + Math.round(zufall() * 6000), sleep_s: Math.round((6.5 + zufall() * 2) * 3600), sleep_start: d + ' 23:10', sleep_score: 80 });
  if (i % 2 === 0) einheiten.push({ id: 1000 + i, date: d, type: 'running', dur_s: 3000, moving_s: 3000, dist_m: 9000, start: d + ' 07:30', z1_s: 600, z2_s: 1200, z3_s: 600, z4_s: 400, z5_s: 200 });
  if (i % 3 !== 0) checkins.push({ date: d, schlaf: 4, energie: 4, muskeln: 3, stress: 4, stimmung: 4 });
  if (d >= plus(M.V8, -10)) tagebuch.push({ date: d, w: i % 4 ? 2200 : 1200, p: 120 + (i % 3) * 20 });
  if (d >= M.V8 && i % 5 === 0) flow.push({ d, t: 'Box-Atmung', min: 5, stil: 'routine' });
  ampel[d] = i % 7 === 3 ? 'rot' : 'gruen';
}
const E = (heute, spiel, extra) => Object.assign({
  heute, garmin: true, tage: tage.filter((r) => r.date <= heute), einheiten: einheiten.filter((e) => e.date <= heute), checkins: checkins.filter((c) => c.date <= heute),
  gym, flow: flow.filter((f) => f.d <= heute), plan: null, planWochen: null, ampel, tagebuch: tagebuch.filter((r) => r.date <= heute), ziele: { wasser: 2000, protein: 130, wasserAm: {} },
  profil: { schritte_ziel: 8000, schlafbedarf_min: 480, sportarten: ['laufen'], schritte_dyn: 1 }, spiel, extra: {},
}, extra || {});

// 1) Tag für Tag: XP sinken nie
let sp = {}, vor = null; const sank = [];
for (let d = plus(von, 40); d <= ende; d = plus(d, 1)) { const r = M.berechne(E(d, sp)); sp = r.spiel; if (vor && r.xp < vor.xp) sank.push(d); vor = r; }
pruefe('XP sinken nie (mit Regeln aus Version 8)', !sank.length, sank.slice(0, 5));
pruefe('Schrittweise gleich wie in einem Rutsch', M.berechne(E(ende, { start: plus(von, 40) })).xp === vor.xp, [M.berechne(E(ende, { start: plus(von, 40) })).xp, vor.xp]);

// 2) Roter Tag nach dem Stichtag: harte Minuten bringen keine XP, Ruhe bringt „klug erholt“
const rot = Object.keys(ampel).filter((d) => d > M.V8 && d < ende && ampel[d] === 'rot');
const lauf = rot.find((d) => einheiten.some((e) => e.date === d)), ruhe = rot.find((d) => !einheiten.some((e) => e.date === d));
if (lauf) {
  const r = M.berechne(E(plus(lauf, 1), { start: von })), t = r.verlauf.find((v) => v.datum === lauf);
  const app = flow.filter((f) => f.d === lauf).reduce((x, f) => x + f.min, 0); // Kurz-Routinen zählen mit
  pruefe('Roter Tag mit hartem Lauf: die 10 harten Minuten zählen nicht, kein Bonus', t && t.teile.bewegung === 50 + app - 10 && t.teile.klug === 0, t && t.teile);
}
if (ruhe) {
  const r = M.berechne(E(plus(ruhe, 1), { start: von })), t = r.verlauf.find((v) => v.datum === ruhe);
  pruefe('Roter Ruhetag: +20 XP „klug erholt“', t && t.teile.klug === 20, t && t.teile);
}
const vorV8 = Object.keys(ampel).filter((d) => d < M.V8 && d >= plus(von, 35) && ampel[d] === 'rot' && einheiten.some((e) => e.date === d))[0];
if (vorV8) {
  const r = M.berechne(E(plus(vorV8, 1), { start: von })), t = r.verlauf.find((v) => v.datum === vorV8);
  pruefe('Vor dem Stichtag gelten die alten Regeln (volle Minuten)', t && t.teile.bewegung === 50, t && t.teile);
}

// 3) Gesundheits-Quests
const qTage = []; for (let d = plus(M.V8, 1); d <= ende; d = plus(d, 1)) qTage.push(...M.berechne(E(d, { start: von })).quests.heute.map((q) => q.id));
pruefe('Trink- oder Eiweiß-Quest taucht auf, weil notiert wird', qTage.includes('wasser') || qTage.includes('protein'), [...new Set(qTage)]);
const ohneNotiz = []; for (let d = plus(M.V8, 1); d <= ende; d = plus(d, 1)) ohneNotiz.push(...M.berechne(E(d, { start: von }, { tagebuch: [] })).quests.heute.map((q) => q.id));
pruefe('Ohne Notizen keine Trink- und Eiweiß-Quests', !ohneNotiz.includes('wasser') && !ohneNotiz.includes('protein'), [...new Set(ohneNotiz)]);
const w = M.berechne(E(ende, { start: von })).quests.woche.map((q) => q.id);
pruefe('Wochenquests nach dem Stichtag aus dem neuen Pool möglich', w.length === 3, w);
const neuePool = new Set(); for (let k = 0; k < 3; k++) M.berechne(E(plus(ende, -7 * k), { start: von })).quests.woche.forEach((q) => neuePool.add(q.id));
console.log('       Wochenquests der letzten Wochen:', [...neuePool].join(', '));

// 4) Trophäen aus Version 8
const R = M.berechne(E(ende, { start: von }));
const tr = (id) => R.trophaeen.find((t) => t.id === id);
pruefe('Trophäe „Gut versorgt“ (7 Tage Trinkziel in Folge) richtig bewertet', tr('wasser_7') && (tr('wasser_7').erreicht ? true : tr('wasser_7').wert < 7), tr('wasser_7'));
pruefe('Trophäe „Kurze Pause“ nach der ersten Routine', tr('routine_1') && !!tr('routine_1').erreicht, tr('routine_1'));
pruefe('Trophäe „Morgenmensch“ ohne Serie nicht vergeben', tr('checkin_serie7') && !tr('checkin_serie7').erreicht, tr('checkin_serie7'));

// 5) Dynamisches Schrittziel
pruefe('Dynamisches Schrittziel liegt zwischen 5.000 und 12.000', R.ziel >= 5000 && R.ziel <= 12000 && R.ziel % 500 === 0, R.ziel);
pruefe('Festes Ziel ohne Option', M.berechne(E(ende, { start: von }, { profil: { schritte_ziel: 8000, schlafbedarf_min: 480, sportarten: ['laufen'] } })).ziel === 8000);

// 6) Ohne Uhr: Schlaf aus dem Check-in zählt
const ck = checkins.map((c) => Object.assign({}, c, { schlaf_h: 7.5 }));
const O = M.berechne({ heute: ende, garmin: false, tage: [], einheiten: [], checkins: ck, gym: [], flow, plan: null, planWochen: null, ampel: {}, tagebuch, ziele: { wasser: 2000, protein: 130 }, profil: { schritte_ziel: 8000, schlafbedarf_min: 480 }, spiel: { start: von }, extra: {} });
const os = O.verlauf.find((v) => v.datum === ck[ck.length - 1].date);
pruefe('Ohne Uhr: Schlaf von Hand bringt Schlaf-XP', os && os.teile.schlaf === 10, os && os.teile);

console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
