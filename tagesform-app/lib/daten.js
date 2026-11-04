// Lädt alle Datensätze eines Nutzers aus seinem Speicherbereich – für /api/data und den Morgen-Push.
const { profilFuer } = require('./profil');
const { METHODEN } = require('./methoden');

async function laden(db) {
  const keys = ['data:garmin_tage', 'data:garmin_einheiten', 'data:garmin_gewicht', 'data:garmin_ernaehrung', 'data:garmin_hf_zonen', 'data:stand', 'data:fehler', 'profil', 'rechner', 'avatar'];
  const [tage, einheiten, gewicht, ernaehrung, zonen, stand, fehler, profil, rechner, avatar] = await db.mget(keys);
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
  return { stand: stand || null, fehler: fehler && (!stand || fehler.at > stand.at) ? fehler : null, rechner: rechner || {}, avatar: typeof avatar === 'string' ? avatar : null, datasets };
}

module.exports = { laden };
