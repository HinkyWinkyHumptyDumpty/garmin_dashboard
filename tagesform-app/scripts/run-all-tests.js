// Alle Offline-Tests hintereinander: node scripts/run-all-tests.js [ordner-mit-datasets]
// Ohne Ordner laufen die Rechnungen zusätzlich mit einem leeren Profil und ganz ohne Garmin-Daten.
// Mit Ordner (z. B. einem Export aus Profil → Konto) laufen auch die Tests mit echten Daten.
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const hier = __dirname, ordner = process.argv[2] ? path.resolve(process.argv[2]) : null;
const leer = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-leer-'));
for (const n of ['garmin_einheiten', 'garmin_tage', 'garmin_gewicht', 'garmin_hf_zonen']) fs.writeFileSync(path.join(leer, n + '.json'), '[]');
fs.writeFileSync(path.join(leer, 'athlet.json'), '[{}]');

const TESTS = [
  ['Alltag & Leistung (Rechnungen)', 'test-alltag.js'],
  ['Randfälle aller Motoren', 'test-randfaelle.js'],
  ['Spielregeln Version 8', 'test-spiel-v8.js'],
  ['Streak-Schutz Version 9', 'test-spiel-v9.js'],
  ['Mini-Experimente & Pause Version 10', 'test-spiel-v10.js'],
  ['Mitteilungen (Push, Wochenrückblick, Material)', 'test-push.js'],
  ['Steuerung Version 13 (Last, Kanäle, Prognose, Glykogen, Lag 2)', 'test-v13.js'],
  ['Version 16 (eigene Einheiten, Leistungsprognose)', 'test-v16.js'],
  ['Alle Berechnungen: leeres Profil, keine Garmin-Daten', 'test-calcs.js', leer],
];
if (ordner) TESTS.push(['Alle Berechnungen mit echten Daten', 'test-calcs.js', ordner], ['Spiel mit echten Daten', 'test-spiel.js', ordner]);

let fehler = 0;
const t0 = Date.now();
for (const [name, datei, arg] of TESTS) {
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(hier, datei)].concat(arg ? [arg] : []), { encoding: 'utf8', timeout: 10 * 60 * 1000 });
  const ok = r.status === 0;
  const zeilen = ((r.stdout || '') + (r.stderr || '')).split('\n');
  const fehlZ = zeilen.filter((z) => /FEHLER|Error|failed|nicht in Ordnung/i.test(z));
  console.log((ok ? '✓ ' : '✗ ') + name.padEnd(54) + String(Date.now() - t).padStart(6) + ' ms' + (ok ? '' : ' – ' + (fehlZ.length ? fehlZ.length + ' Meldungen' : 'Abbruch (Code ' + r.status + ')')));
  if (!ok) { fehler++; (fehlZ.length ? fehlZ : zeilen.slice(-12)).slice(0, 12).forEach((z) => console.log('    ' + z.slice(0, 200))); }
}
fs.rmSync(leer, { recursive: true, force: true });
console.log('\n' + (fehler ? fehler + ' von ' + TESTS.length + ' Testgruppen mit Fehlern' : 'Alle ' + TESTS.length + ' Testgruppen ok') + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (ordner ? '' : ' · Tipp: mit Datenordner laufen auch die Tests mit echten Daten'));
process.exit(fehler ? 1 : 0);
