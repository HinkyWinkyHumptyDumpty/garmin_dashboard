// Lädt alle Datensätze der App aus dem Speicher – für /api/data und für den Morgen-Push.
const store = require('./store');
const { DEFAULT_PROFIL } = require('./profil');
const { METHODEN } = require('./methoden');

async function laden() {
  const keys = ['data:garmin_tage', 'data:garmin_einheiten', 'data:garmin_gewicht', 'data:garmin_ernaehrung', 'data:garmin_hf_zonen', 'data:stand', 'data:fehler', 'profil', 'rechner'];
  const [tage, einheiten, gewicht, ernaehrung, zonen, stand, fehler, profil, rechner] = await store.mget(keys);
  const [checkins, css, fueling, analysen] = await Promise.all([store.hgetall('checkin'), store.hgetall('css'), store.hgetall('fueling'), store.hgetall('analyse')]);
  const seit = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);
  return {
    stand: stand || null,
    fehler: fehler && (!stand || fehler.at > stand.at) ? fehler : null,
    rechner: rechner || {},
    datasets: {
      garmin_tage: tage || [], garmin_einheiten: einheiten || [], garmin_gewicht: gewicht || [], garmin_ernaehrung: ernaehrung || [], garmin_hf_zonen: zonen || [],
      athlet: [Object.assign({}, DEFAULT_PROFIL, profil || {})], methoden: METHODEN,
      checkins: Object.values(checkins), css_tests: Object.values(css), fueling_log: Object.values(fueling),
      analysen: Object.values(analysen).filter((x) => !x.leer && x.date >= seit),
    },
  };
}

module.exports = { laden };
