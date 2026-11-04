// Rechnet die Kennzahlen der App auch auf dem Server – mit derselben Datei wie im Browser (public/calcs.js).
// Gebraucht für den Morgen-Push, damit die Mitteilung genau das sagt, was die App zeigt.
let CALCS = null;

function calcs() {
  if (CALCS) return CALCS;
  const reg = {}, vorher = global.dash;
  global.dash = { calc: (id, spec) => { reg[id] = spec; } };
  try { require('../public/calcs.js'); } finally { if (vorher === undefined) delete global.dash; else global.dash = vorher; }
  return (CALCS = reg);
}

// datasets: wie /api/data sie liefert; ids: gewünschte Berechnungen → { id: Zeilen }
function rechne(datasets, ids) {
  const C = calcs(), cache = {};
  const get = (id) => {
    if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
    if (Object.prototype.hasOwnProperty.call(datasets, id)) return (cache[id] = datasets[id]);
    const c = C[id];
    if (!c) throw new Error('Unbekannte Berechnung: ' + id);
    return (cache[id] = c.fn(...c.inputs.map(get)));
  };
  const out = {};
  ids.forEach((id) => { out[id] = get(id); });
  return out;
}

module.exports = { rechne };
