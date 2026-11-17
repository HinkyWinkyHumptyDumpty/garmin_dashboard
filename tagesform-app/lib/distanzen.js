// Erlaubte Distanzen je Sportart für Wettkämpfe und Rennrechner.
// Muss zu TF_DISTANZEN in public/calcs.js passen – scripts/test-calcs.js prüft das.
const DISTANZEN = {
  tri: ['sprint', 'od', 'md', 'ld'],
  lauf: ['5k', '10k', 'hm', 'm'],
  rad: ['ezf20', 'ezf40', 'r90', 'r180'],
  schwimmen: ['s400', 's1500', 'ow38', 'ow5'],
  mehr: ['du_s', 'du_std', 'aqua', 'swimrun'],
};
const gueltig = (sport, dist) => Object.prototype.hasOwnProperty.call(DISTANZEN, sport) && DISTANZEN[sport].includes(dist);
const SCHLUESSEL = new Set(Object.entries(DISTANZEN).flatMap(([s, L]) => L.map((d) => s + '_' + d)));

module.exports = { DISTANZEN, gueltig, SCHLUESSEL };
