// Prüft alle Berechnungen offline: node scripts/test-calcs.js <ordner-mit-datasets> [ausgabe.json]
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const data = {};
for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
for (const k of ['garmin_ernaehrung', 'checkins', 'css_tests', 'fueling_log', 'garmin_gewicht', 'analysen']) data[k] = data[k] || [];
data.methoden = data.methoden || require('../lib/methoden').METHODEN;
const calcs = {};
global.dash = { calc: (id, spec) => { calcs[id] = spec; } };
require(path.join(__dirname, '..', 'public', 'calcs.js'));
const cache = {};
const get = (id) => {
  if (cache[id]) return cache[id];
  if (data[id]) return (cache[id] = data[id]);
  if (!calcs[id]) throw new Error('unbekannt: ' + id);
  const t = Date.now();
  cache[id] = calcs[id].fn(...calcs[id].inputs.map(get));
  if (Date.now() - t > 50) console.log('  langsam:', id, Date.now() - t, 'ms');
  return cache[id];
};
let ok = true;
for (const id of Object.keys(calcs)) {
  try { const r = get(id); console.log(id.padEnd(16), Array.isArray(r) ? r.length + ' Zeilen' : typeof r); }
  catch (e) { ok = false; console.log(id.padEnd(16), 'FEHLER', e.stack.split('\n').slice(0, 3).join(' | ')); }
}
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(cache));
process.exit(ok ? 0 : 1);
