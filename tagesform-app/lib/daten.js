// Lädt alle Datensätze eines Nutzers aus seinem Speicherbereich – für /api/data und den Morgen-Push.
const { profilFuer } = require('./profil');
const { METHODEN } = require('./methoden');

async function laden(db) {
  const keys = ['data:garmin_tage', 'data:garmin_einheiten', 'data:garmin_gewicht', 'data:garmin_ernaehrung', 'data:garmin_hf_zonen', 'data:stand', 'data:fehler', 'profil', 'rechner', 'avatar', 'data:protokoll'];
  const [tage, einheiten, gewicht, ernaehrung, zonen, stand, fehler, profil, rechner, avatar, protokoll] = await db.mget(keys);
  const [checkins, css, fueling, analysen, wettkampf, tagebuch] = await Promise.all([db.hgetall('checkin'), db.hgetall('css'), db.hgetall('fueling'), db.hgetall('analyse'), db.hgetall('wettkampf'), db.hgetall('tagebuch')]);
  const seit = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);
  const datasets = {
    garmin_tage: tage || [], garmin_einheiten: einheiten || [], garmin_gewicht: gewicht || [], garmin_ernaehrung: ernaehrung || [], garmin_hf_zonen: zonen || [],
    methoden: METHODEN, checkins: Object.values(checkins), css_tests: Object.values(css), fueling_log: Object.values(fueling),
    analysen: Object.values(analysen).filter((x) => !x.leer && x.date >= seit),
    wettkaempfe: Object.values(wettkampf).sort((x, y) => (x.datum < y.datum ? -1 : 1)),
    tagebuch: Object.values(tagebuch).filter((x) => x && x.date).sort((x, y) => (x.date < y.date ? -1 : 1)), // „Heute notiert“: Wasser, Eiweiß, Koffein, eigener Stack
  };
  datasets.athlet = [profilFuer(datasets, profil)];
  const plan = rechner && rechner.plan; // Version 16: eigene Einheiten aus dem Plan zählen in der Belastung mit (calcs.js prüft jeden Eintrag)
  datasets.eigene = plan && Array.isArray(plan.extra) ? plan.extra.filter((x) => x && typeof x === 'object').slice(-60) : [];
  return { stand: stand || null, fehler: fehler && (!stand || fehler.at > stand.at) ? fehler : null, protokoll: Array.isArray(protokoll) ? protokoll.slice(0, 20) : [], rechner: rechner || {}, avatar: typeof avatar === 'string' ? avatar : null, datasets }; // Version 28: Abruf-Protokoll
}

module.exports = { laden };
