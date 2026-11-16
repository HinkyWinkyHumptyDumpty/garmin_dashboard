// Lädt alle Datensätze eines Nutzers aus seinem Speicherbereich – für /api/data und den Morgen-Push.
const { profilFuer } = require('./profil');
const { METHODEN } = require('./methoden');

async function laden(db) {
  const keys = ['data:garmin_tage', 'data:garmin_einheiten', 'data:garmin_gewicht', 'data:garmin_ernaehrung', 'data:garmin_hf_zonen', 'data:stand', 'data:fehler', 'profil', 'rechner', 'avatar', 'data:protokoll'];
  const [tage, einheiten, gewicht, ernaehrung, zonen, stand, fehler, profil, rechner, avatar, protokoll] = await db.mget(keys);
  const [checkins, css, fueling, analysen, wettkampf, tagebuch, tipps] = await Promise.all([db.hgetall('checkin'), db.hgetall('css'), db.hgetall('fueling'), db.hgetall('analyse'), db.hgetall('wettkampf'), db.hgetall('tagebuch'), db.hgetall('coach:tipps')]);
  const seit = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);
  const datasets = {
    garmin_tage: tage || [], garmin_einheiten: einheiten || [], garmin_gewicht: gewicht || [], garmin_ernaehrung: ernaehrung || [], garmin_hf_zonen: zonen || [],
    methoden: METHODEN, checkins: Object.values(checkins), css_tests: Object.values(css), fueling_log: Object.values(fueling),
    analysen: Object.values(analysen).filter((x) => !x.leer && x.date >= seit),
    wettkaempfe: Object.values(wettkampf).sort((x, y) => (x.datum < y.datum ? -1 : 1)),
    tagebuch: Object.values(tagebuch).filter((x) => x && x.date).sort((x, y) => (x.date < y.date ? -1 : 1)), // „Heute notiert“: Wasser, Eiweiß, Koffein, eigener Stack
  };
  datasets.coach_tipps = Object.values(tipps || {}).filter((t) => t && t.id).sort((x, y) => (String(x.at) < String(y.at) ? 1 : -1)).slice(0, 100); // Version 59: Tipps vom Coach, neueste zuerst
  datasets.athlet = [profilFuer(datasets, profil)];
  const plan = rechner && rechner.plan; // Version 16: eigene Einheiten aus dem Plan zählen in der Belastung mit (calcs.js prüft jeden Eintrag)
  datasets.eigene = plan && Array.isArray(plan.extra) ? plan.extra.filter((x) => x && typeof x === 'object').slice(-60) : [];
  return { stand: stand || null, fehler: fehler && (!stand || fehler.at > stand.at) ? fehler : null, protokoll: Array.isArray(protokoll) ? protokoll.slice(0, 20) : [], rechner: rechner || {}, avatar: typeof avatar === 'string' ? avatar : null, datasets }; // Version 28: Abruf-Protokoll
}

/* ---------- Version 59: was ein Coach sieht ----------
   Nur die freigegebenen Bereiche; alles andere kommt als leere Liste (die App rechnet dann wie ohne Daten). Immer dabei:
   das Athletenprofil (Schwellen, Zonen, Ziele, Referenzgewicht für W/kg) – ohne es lässt sich nichts auswerten.
   Vom Rechner-Speicher nur Plan & Rennen (und Pause-Modus mit Erholung, Laborwerte und Stack mit Körper);
   Spielstand, Favoriten und Merkliste nie. Von den Tipps nur die eigenen. */
const BEREICH = { garmin_tage: 'erholung', checkins: 'erholung', garmin_einheiten: 'training', garmin_hf_zonen: 'training', css_tests: 'training', fueling_log: 'training', analysen: 'training', eigene: 'training', wettkaempfe: 'plan', garmin_gewicht: 'koerper', garmin_ernaehrung: 'koerper', tagebuch: 'koerper' };
const R_BEREICH = { pause: 'erholung', sanft: 'erholung', plan: 'plan', gym: 'plan', flow: 'plan', regeneration: 'plan', renntag: 'plan', liga: 'plan', felder: 'plan', material: 'plan', schweiss: 'plan', kalender: 'plan', sport: 'plan', dist: 'plan', ld: 'plan', md: 'plan', strecke: 'plan', labor: 'koerper', alltag: 'koerper' };
const IMMER = new Set(['methoden', 'athlet']); // immer dabei: die Methodik (fest) und das Athletenprofil – ein neuer Datensatz ohne Bereich bleibt beim Athleten
const { SCHLUESSEL } = require('./distanzen');
function fuerCoach(d, rechte, coachUid) {
  const ds = {};
  Object.keys(d.datasets || {}).forEach((k) => { const b = BEREICH[k]; ds[k] = IMMER.has(k) || (b && rechte[b]) ? d.datasets[k] : []; }); // ohne Bereich: nur, was IMMER nennt
  ds.coach_tipps = (d.datasets.coach_tipps || []).filter((t) => t.von === coachUid);
  const r = {};
  Object.keys(d.rechner || {}).forEach((k) => { const b = R_BEREICH[k] || (SCHLUESSEL.has(k) ? 'plan' : null); if (b && rechte[b]) r[k] = d.rechner[k]; });
  return { stand: d.stand, fehler: null, protokoll: [], rechner: r, avatar: d.avatar, datasets: ds };
}
// Die Daten eines Athleten für seinen Coach – oder null ohne Zugriff
async function fuerCoachLaden(coachUid, athletUid) {
  const store = require('./store'), nutzer = require('./nutzer');
  const z = await nutzer.coachZugriff(coachUid, athletUid), a = z ? await nutzer.laden(athletUid) : null;
  if (!z || !a) return null;
  const d = fuerCoach(await laden(store.fuer(athletUid)), z.rechte, coachUid);
  return Object.assign(d, { athlet_uid: athletUid, athlet_name: await nutzer.nameVon(a), rechte: z.rechte, seit: z.seit || null });
}
// Die Athleten eines Coaches mit ihrer Lage auf einen Blick: Tune, Datenstand, Hinweise, Woche, nächstes Rennen, Tipps
async function coachListe(coach) {
  const store = require('./store'), { rechne } = require('./rechnen');
  const athl = (await store.fuer(coach.uid).hgetall('athleten')) || {}, out = [];
  const heute = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  for (const uid of Object.keys(athl)) {
    const D = await fuerCoachLaden(coach.uid, uid);
    if (!D) { await store.fuer(coach.uid).hdel('athleten', uid); continue; } // beendet oder gelöscht
    let R = {};
    try { R = rechne(D.datasets, ['heute', 'erkenntnisse', 'wochen']); } catch (e) { try { R = rechne(D.datasets, ['heute']); } catch (e2) { R = {}; } }
    const mo = new Date(Date.parse(heute) - ((new Date(heute).getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
    const h = (R.heute || [])[0] || null, T = D.datasets.garmin_tage || [], w = (R.wochen || []).find((x) => x.woche === mo) || null; // die laufende Woche
    const ton = {}; (R.erkenntnisse || []).forEach((x) => { ton[x.ton] = (ton[x.ton] || 0) + 1; });
    const rn = (D.datasets.wettkaempfe || []).filter((x) => x && x.datum >= heute).sort((x, y) => (x.datum < y.datum ? -1 : 1))[0] || null;
    const tipps = D.datasets.coach_tipps || [];
    out.push({
      uid, name: D.athlet_name, seit: D.seit, rechte: D.rechte, avatar: typeof D.avatar === 'string' && D.avatar.length <= 72000 ? D.avatar : null,
      stand: D.stand ? D.stand.at || null : null, nacht: T.length ? T[T.length - 1].date : null,
      tune: h ? { score: h.score, ampel: h.ampel, label: h.label, date: h.date, empfehlung: h.empfehlung } : null,
      hinweise: { kritisch: ton.kritisch || 0, achtung: ton.achtung || 0 },
      woche: D.rechte.training ? { woche: mo, h: w ? w.gesamt_h : 0, tss: w ? w.tss : 0 } : null,
      rennen: rn ? { name: String(rn.name || 'Rennen').slice(0, 60), datum: rn.datum } : null,
      tipps: { n: tipps.length, ungelesen: tipps.filter((t) => !t.gelesen).length, antworten: tipps.filter((t) => t.antwort && !t.antwort.gesehen).length },
    });
  }
  const ich = await store.fuer(coach.uid).get('profil'); // der eigene Name – so sehen ihn seine Athleten
  return { athleten: out.sort((x, y) => String(x.name).localeCompare(String(y.name), 'de')), name: ich && typeof ich.name === 'string' && ich.name ? ich.name : null };
}

module.exports = { laden, fuerCoach, fuerCoachLaden, coachListe };
