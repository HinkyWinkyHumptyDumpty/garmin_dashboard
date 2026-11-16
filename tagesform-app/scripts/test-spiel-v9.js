// Prüft den Streak-Schutz aus Version 9 mit erfundenen Daten: node scripts/test-spiel-v9.js
// Krank („Ich fühle mich krank“ im Check-in) oder Schutzmodus aus der Frühwarnung an mindestens zwei Tagen einer Woche:
// Die Wochenserie reißt nicht. Vor dem Stichtag gilt das nicht, und XP sinken nie.
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'spiel-motor.js'));
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 260))); if (!ok) fehler++; };
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

// Acht Wochen mit je vier Läufen à 50 Minuten (Wochenziel 150 min), außer in den „kranken“ Wochen
const start = plus(M.V9, -56), ende = plus(M.V9, 13);
function daten(kranke, opts) {
  opts = opts || {};
  const tage = [], einheiten = [], checkins = [];
  for (let d = start, i = 0; d <= ende; d = plus(d, 1), i++) {
    const woche = Math.floor(i / 7), krankeWoche = kranke.includes(woche), lauf = !krankeWoche && [0, 2, 4, 5].includes(i % 7);
    tage.push({ date: d, steps: 7000, sleep_s: 7.5 * 3600, sleep_start: d + ' 23:00', sleep_score: 80, im_moderate: lauf ? 50 : 0, im_vigorous: 0 });
    if (lauf) einheiten.push({ id: 5000 + i, date: d, type: 'running', dur_s: 3000, moving_s: 3000, dist_m: 9000, start: d + ' 07:30', z1_s: 900, z2_s: 2100, z3_s: 0, z4_s: 0, z5_s: 0 });
    const krankTag = krankeWoche && (i % 7) < (opts.krankTage == null ? 3 : opts.krankTage);
    checkins.push({ date: d, schlaf: 4, energie: 4, muskeln: 4, stress: 4, stimmung: 4, krank: !!(krankTag && !opts.nurSchutz) });
  }
  return { tage, einheiten, checkins };
}
const E = (heute, D, extra) => Object.assign({
  heute, garmin: true, tage: D.tage.filter((r) => r.date <= heute), einheiten: D.einheiten.filter((e) => e.date <= heute), checkins: D.checkins.filter((c) => c.date <= heute),
  gym: [], flow: [], plan: null, planWochen: null, ampel: {}, tagebuch: [], ziele: { wasser: 0, protein: 0, wasserAm: {} },
  profil: { schritte_ziel: 8000, schlafbedarf_min: 480, sportarten: ['laufen'], schritte_dyn: 0 }, spiel: { start: start }, extra: {},
}, extra || {});
const wocheV9 = 8; // Woche ab dem Stichtag (Montag)
const amEnde = plus(M.V9, 13); // Sonntag der Woche nach der kranken Woche

// 1) Ohne Krankheit: neun Wochen am Stück
const voll = M.berechne(E(amEnde, daten([])));
pruefe('Ohne Pause: Serie über alle Wochen', voll.quests.serie === 10, voll.quests.serie);

// 2) Krank in der Stichtag-Woche (3 Tage „krank“): Serie läuft weiter, die kranke Woche zählt nur nicht mit
const k = M.berechne(E(amEnde, daten([wocheV9])));
pruefe('Krank (3 Tage) ab Stichtag: Serie reißt nicht', k.quests.serie === 9, k.quests.serie);
const kMitte = M.berechne(E(plus(M.V9, 6), daten([wocheV9])));
pruefe('In der kranken Woche selbst: Serie bleibt sichtbar und geschützt', kMitte.quests.serie === 8 && kMitte.quests.schutz && kMitte.quests.schutzTage === 3, kMitte.quests);

// 3) Nur ein kranker Tag reicht nicht
const k1 = M.berechne(E(amEnde, daten([wocheV9], { krankTage: 1 })));
pruefe('Nur 1 Tag krank: Serie beginnt neu', k1.quests.serie === 1, k1.quests.serie);

// 4) Vor dem Stichtag gibt es keinen Schutz
const alt = M.berechne(E(plus(M.V9, -1), daten([wocheV9 - 1])));
pruefe('Woche vor dem Stichtag: kein Schutz', alt.quests.serie === 0 && !alt.quests.schutz, [alt.quests.serie, alt.quests.schutz]);
const alt2 = M.berechne(E(amEnde, daten([wocheV9 - 1])));
pruefe('Danach beginnt die Serie neu (nichts rückwirkend)', alt2.quests.serie === 2, alt2.quests.serie);

// 5) Schutzmodus aus der Frühwarnung (E.schutz) wirkt wie „krank“
const fwTage = [M.V9, plus(M.V9, 1)];
const s = M.berechne(E(amEnde, daten([wocheV9], { nurSchutz: true }), { schutz: fwTage }));
pruefe('Schutzmodus an 2 Tagen (Frühwarnung): Serie reißt nicht', s.quests.serie === 9, s.quests.serie);
const s0 = M.berechne(E(amEnde, daten([wocheV9], { nurSchutz: true })));
pruefe('Ohne Schutz-Tage: Serie beginnt neu', s0.quests.serie === 1, s0.quests.serie);
pruefe('Ungültige Schutz-Daten werden ignoriert', M.berechne(E(amEnde, daten([wocheV9], { nurSchutz: true }), { schutz: ['gestern', null, 5, '2030-01-01'] })).quests.serie === 1);

// 6) XP vor dem Stichtag bleiben gleich, XP sinken nie, schrittweise = in einem Rutsch
const D = daten([wocheV9]);
const xpVor = (r) => r.verlauf.filter((v) => v.datum < M.V9).reduce((x, v) => x + v.summe, 0);
pruefe('XP vor dem Stichtag unverändert', xpVor(M.berechne(E(amEnde, D))) === xpVor(M.berechne(E(amEnde, daten([])))), [xpVor(M.berechne(E(amEnde, D))), xpVor(M.berechne(E(amEnde, daten([]))))]);
let sp = { start }, vor = null; const sank = [];
for (let d = plus(start, 20); d <= amEnde; d = plus(d, 1)) { const r = M.berechne(E(d, D, { spiel: sp })); sp = r.spiel; if (vor && r.xp < vor.xp) sank.push(d); vor = r; }
pruefe('XP sinken nie (mit Streak-Schutz)', !sank.length, sank.slice(0, 5));
pruefe('Schrittweise gleich wie in einem Rutsch', M.berechne(E(amEnde, D, { spiel: { start } })).xp === vor.xp, [M.berechne(E(amEnde, D, { spiel: { start } })).xp, vor.xp]);
const bonusOhne = M.berechne(E(amEnde, daten([wocheV9], { krankTage: 0 }))), bonusMit = M.berechne(E(amEnde, D));
pruefe('Serienbonus nach der kranken Woche höher als ohne Schutz', bonusMit.xp > bonusOhne.xp, [bonusMit.xp, bonusOhne.xp]);

console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
