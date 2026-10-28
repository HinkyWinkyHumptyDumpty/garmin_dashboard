// Prüft die Spielregeln offline: node scripts/test-spiel.js <ordner-mit-datasets>
// Erwartet garmin_tage.json und garmin_einheiten.json (wie bei test-calcs.js), optional checkins.json und athlet.json.
// Geprüft wird: XP sinken nie, schrittweise = in einem Rutsch, nach Löschen alter Daten bleiben XP, Quests sind fest je Tag,
// Kraft aus App und Uhr am selben Tag zählt nicht doppelt, Level-Grenzen und Trophy Road vollständig.
const fs = require('fs');
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'spiel-motor.js'));
const dir = process.argv[2];
if (!dir) { console.log('Aufruf: node scripts/test-spiel.js <ordner-mit-datasets>'); process.exit(2); }
const lies = (n, d) => { const f = path.join(dir, n + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d; };
const tage = lies('garmin_tage', []), einheiten = lies('garmin_einheiten', []), checkins = lies('checkins', []), athlet = (lies('athlet', [{}]) || [{}])[0] || {};
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 200))); if (!ok) fehler++; };
const ende = tage.map((r) => r.date).sort().pop();
if (!ende) { console.log('Keine Tageswerte gefunden.'); process.exit(2); }
const E = (heute, spiel, extra) => Object.assign({ heute, garmin: true, tage: tage.filter((r) => r.date <= heute), einheiten: einheiten.filter((e) => e.date <= heute), checkins: checkins.filter((c) => c.date <= heute), gym: [], flow: [], plan: null, planWochen: null, ampel: {}, profil: { schritte_ziel: athlet.schritte_ziel || 8000, schlafbedarf_min: athlet.schlafbedarf_min || 480, sportarten: athlet.sportarten }, spiel, extra: {} }, extra || {});

// 1) Tag für Tag über 120 Tage: XP sinken nie
const von = plus(ende, -120);
let sp = {}, vor = null, sank = [];
const t0 = Date.now();
for (let d = von; d <= ende; d = plus(d, 1)) { const r = M.berechne(E(d, sp)); sp = r.spiel; if (vor && r.xp < vor.xp) sank.push(d); vor = r; }
console.log('120 Tage in ' + (Date.now() - t0) + ' ms · Ende: ' + vor.xp + ' XP, Level ' + vor.level.nr + ' (' + vor.level.stufe.name + '), ' + Object.keys(sp.tr).length + ' Trophäen');
pruefe('XP sinken nie', !sank.length, sank.slice(0, 5));
// 2) Schrittweise = in einem Rutsch
const rutsch = M.berechne(E(ende, { start: von }));
pruefe('Schrittweise gleich wie in einem Rutsch', rutsch.xp === vor.xp, [rutsch.xp, vor.xp]);
// 3) Alte Daten gelöscht: abgeschlossene Monate halten die XP
const kurz = E(ende, sp); kurz.tage = kurz.tage.filter((r) => r.date >= plus(ende, -45)); kurz.einheiten = kurz.einheiten.filter((e) => e.date >= plus(ende, -45));
pruefe('XP bleiben nach Löschen alter Daten', M.berechne(kurz).xp === vor.xp, M.berechne(kurz).xp);
// 4) Quests fest je Tag
const q = (d) => M.berechne(E(d, { start: von })).quests.heute.map((x) => x.id).join();
pruefe('Quests je Tag gleich', q(plus(ende, -3)) === q(plus(ende, -3)));
// 5) Kraft doppelt
const k = einheiten.find((e) => e.type === 'strength_training');
if (k) {
  const a = M.berechne(E(k.date, { start: k.date })), b = M.berechne(E(k.date, { start: k.date }, { gym: [{ d: k.date, t: 'Test', min: 60 }] }));
  pruefe('Gym-Eintrag am Krafttag nur als Bonus', a.heuteTeile.bewegung === b.heuteTeile.bewegung && b.heuteTeile.app === 10, [a.heuteTeile, b.heuteTeile]);
}
// 6) Level und Trophy Road
pruefe('Level-Grenzen', M.levelAus(0).nr === 1 && M.levelAus(249).nr === 1 && M.levelAus(250).nr === 2 && M.levelAus(M.xpFuer(70)).nr === 70, null);
pruefe('Jedes Level ab 2 hat eine Belohnung', M.ROAD.slice(1).every((r) => r.belohnungen.length > 0), null);
pruefe('Trophäen-IDs eindeutig', new Set(M.TR.map((t) => t.id)).size === M.TR.length, null);
console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
