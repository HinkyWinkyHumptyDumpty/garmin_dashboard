// Prüft die Spielregeln aus Version 10 mit erfundenen Daten: node scripts/test-spiel-v10.js
// Mini-Experimente: Jeder erledigte Tag ab dem Stichtag bringt XP. Vor dem Stichtag ändert sich nichts, XP sinken nie.
// Pause-Modus: Pausentage zählen als geschützte Tage (Streak-Schutz) und – bei Krankheit – als rote Tage mit Erholungs-Quests.
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'spiel-motor.js'));
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 260))); if (!ok) fehler++; };
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

const start = plus(M.V10, -40), ende = plus(M.V10, 10);
const tage = [], einheiten = [], checkins = [];
for (let d = start, i = 0; d <= ende; d = plus(d, 1), i++) {
  const lauf = [0, 2, 4].includes(i % 7);
  tage.push({ date: d, steps: 8200, sleep_s: 7.4 * 3600, sleep_start: d + ' 23:00', sleep_score: 78, im_moderate: lauf ? 45 : 10, im_vigorous: 0 });
  if (lauf) einheiten.push({ id: 9000 + i, date: d, type: 'running', dur_s: 2700, moving_s: 2700, dist_m: 8000, start: d + ' 07:30', z1_s: 900, z2_s: 1800, z3_s: 0, z4_s: 0, z5_s: 0 });
  checkins.push({ date: d, schlaf: 4, energie: 4, muskeln: 4, stress: 4, stimmung: 4, krank: false });
}
const E = (heute, extra) => Object.assign({
  heute, garmin: true, tage: tage.filter((r) => r.date <= heute), einheiten: einheiten.filter((e) => e.date <= heute), checkins: checkins.filter((c) => c.date <= heute),
  gym: [], flow: [], plan: null, planWochen: null, ampel: {}, tagebuch: [], ziele: { wasser: 0, protein: 0, wasserAm: {} },
  profil: { schritte_ziel: 8000, schlafbedarf_min: 480, sportarten: ['laufen'], schritte_dyn: 0 }, spiel: { start }, extra: {},
}, extra || {});
const tagXp = (r, d) => { const v = r.verlauf.find((x) => x.datum === d); return v ? v.summe : null; };

// 1) Experiment-Tage bringen ab dem Stichtag je EXP_XP
const heute = plus(M.V10, 3);
const ohne = M.berechne(E(heute));
const expTage = [plus(M.V10, -2), plus(M.V10, -1), M.V10, plus(M.V10, 1), plus(M.V10, 3)];
const mit = M.berechne(E(heute, { experiment: expTage }));
pruefe('XP-Wert je Experiment-Tag ist 15', M.EXP_XP === 15);
pruefe('Stichtag: +15 XP', tagXp(mit, M.V10) - tagXp(ohne, M.V10) === M.EXP_XP, [tagXp(mit, M.V10), tagXp(ohne, M.V10)]);
pruefe('Heute: +15 XP und Teil „exp“', mit.heuteXp - ohne.heuteXp === M.EXP_XP && mit.heuteTeile.exp === M.EXP_XP, [mit.heuteXp, ohne.heuteXp, mit.heuteTeile]);
pruefe('Vor dem Stichtag: keine XP (nichts rückwirkend)', tagXp(mit, plus(M.V10, -1)) === tagXp(ohne, plus(M.V10, -1)), [tagXp(mit, plus(M.V10, -1)), tagXp(ohne, plus(M.V10, -1))]);
pruefe('Gesamt: genau 3 Tage × 15 XP mehr', mit.xp - ohne.xp === 3 * M.EXP_XP, [mit.xp, ohne.xp]);
pruefe('Tage in der Zukunft zählen nicht', M.berechne(E(heute, { experiment: [plus(heute, 1)] })).xp === ohne.xp);
pruefe('Ungültige Daten werden ignoriert', M.berechne(E(heute, { experiment: ['morgen', null, 7, {}, '2026-13-45x'] })).xp === ohne.xp);

// 2) Ohne Experiment bleibt alles wie in Version 9 (gleicher Stand, gleiche XP)
const v9 = M.berechne(E(heute, { experiment: [] }));
pruefe('Leeres Experiment = wie bisher', v9.xp === ohne.xp && M.kanon(v9.spiel) === M.kanon(ohne.spiel));

// 3) Pause-Modus: geschützte Tage halten die Wochenserie, rote Tage geben Erholungs-Quests
const pauseTage = [plus(M.V10, 1), plus(M.V10, 2), plus(M.V10, 3)];
const ampel = Object.fromEntries(pauseTage.map((d) => [d, 'rot']));
const p = M.berechne(E(plus(M.V10, 3), { schutz: pauseTage, ampel }));
const ids = p.quests.heute.map((q) => q.id);
pruefe('Pause (krank): Erholungs-Quests statt Training', ids.includes('spaziergang') && ids.includes('erholung'), ids);
pruefe('Pause: Woche ist geschützt', p.quests.schutz === true && p.quests.schutzTage >= 2, p.quests);

console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
