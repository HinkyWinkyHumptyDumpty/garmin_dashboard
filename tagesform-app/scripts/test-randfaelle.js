// Randfälle für alle Rechen-Motoren: leere Eingaben, fehlende Garmin-Daten, leeres Profil, kaputte Werte.
// Nichts darf abstürzen, und die Ergebnisse müssen „nichts“ sagen statt Unsinn. node scripts/test-randfaelle.js
const path = require('path');
const A = require(path.join(__dirname, '..', 'public', 'alltag-motor.js'));
const S = require(path.join(__dirname, '..', 'public', 'spiel-motor.js'));
let fehler = 0;
const pruefe = (n, fn) => {
  let ok = false, info = null;
  try { const r = fn(); ok = r === true || (r && r.ok); info = r && r.info !== undefined ? r.info : r; } catch (e) { info = e.stack.split('\n').slice(0, 2).join(' | '); }
  console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok ? '' : ' – ' + JSON.stringify(info).slice(0, 220)));
  if (!ok) fehler++;
};
const H = '2026-10-29';
const kaputt = [null, undefined, {}, { date: 'gestern' }, { date: H, hrv: 'viel', rhr: NaN, start_h: null }];

// Alltag-Motor
pruefe('Wasser/Eiweiß ohne Profil', () => A.wasserZiel().ml === 1800 && A.proteinZiel().g > 0);
pruefe('Zeitfenster ohne alles: 7 Uhr, 8 h', () => { const f = A.tagesFenster(); return f.auf === 420 && f.bett === 1365; });
pruefe('Zeitfenster: morgen später aufstehen ändert nichts', () => A.tagesFenster({ aufwachMin: 420, aufMorgenMin: 540 }).bett === A.tagesFenster({ aufwachMin: 420 }).bett);
pruefe('Tagestyp ohne Daten: normal', () => A.tagesTyp().id === 'normal');
pruefe('Kohlenhydrate ohne Einheiten und Gewicht', () => { const k = A.khBedarf({}); return k && k.g[0] > 0; });
pruefe('Briefing ohne Einheit: nichts', () => A.briefing({}) == null);
pruefe('Beinlast und Interferenz leer', () => A.beinLast({}).last === 0 && A.interferenz({}) === null);
pruefe('Schweißrate unvollständig: ungültig', () => { const r = A.schweissRate({}); return (!r || !r.ok) && A.schweissProfil().gesamt === null; });
pruefe('Material leer', () => A.materialStand({}).items.length === 0);
pruefe('Vergleich mit leeren Listen', () => { const v = A.vergleich([], []); return v == null || v.klar === false; });
pruefe('Wochenbilanz ohne Daten: kein Text, also keine Mitteilung', () => { const w = A.wochenBilanz({ montag: '2026-10-26', bis: H }); return w.einheiten === 0 && A.wochenText(w) === null; });
pruefe('Einfluss: leer, kaputt, ohne heute', () => A.einfluss({ heute: H }).funde.length === 0 && A.einfluss({ heute: H, erholung: kaputt, checkins: kaputt, tagebuch: kaputt, tage: kaputt, einheiten: kaputt, gym: kaputt, flow: kaputt, stack: [] }).funde.length === 0);
pruefe('Einfluss: konstante Werte (keine Streuung) ergeben keinen Fund', () => {
  const tb = [], er = []; for (let i = 1; i <= 60; i++) { const d = A.plus(H, -i); tb.push({ date: d, k: i % 2 ? ['17:30'] : ['08:00'] }); er.push({ date: A.plus(d, 1), hrv: 60, tief_h: 1, schlaf_h: 7, rhr: 50, score: 70 }); }
  return A.einfluss({ heute: H, tagebuch: tb, erholung: er, koffeinStopp: 1005 }).funde.length === 0;
});
pruefe('Frühwarnung: leer und kaputt', () => A.fruehwarnung({ heute: H }).stufe === null && A.fruehwarnung({ heute: H, erholung: kaputt, checkins: kaputt, gefuehl: kaputt }).stufe === null);
pruefe('Social Jetlag ohne Schlafzeiten', () => A.socialJetlag({ heute: H }) === null && A.socialJetlag({ heute: H, erholung: kaputt }) === null);
pruefe('Termin: fehlt, kaputt, falsche Art', () => A.terminPlan({ heute: H }) === null && A.terminPlan({ heute: H, termin: { d: 'morgen' } }) === null && A.terminPlan({ heute: H, termin: { d: A.plus(H, 2), art: 'quatsch' } }).art === 'sonst');
pruefe('Termin heute ohne Uhrzeit', () => { const P = A.terminPlan({ heute: H, termin: { d: H, art: 'tour' } }); return P.phase === 'heute' && P.tipps.length >= 2; });
pruefe('Wetter: leer, ohne Stunden, ohne heute', () => A.wetterTipps(null, { heute: H }) === null && A.wetterTipps({}, { heute: H }) === null && A.wetterTipps({ hourly: { time: ['2020-01-01T10:00'] } }, { heute: H }) === null);
pruefe('Wetter: nur Zeiten, keine Werte', () => { const t = A.wetterTipps({ hourly: { time: [H + 'T08:00', H + 'T09:00'] } }, { heute: H }); return t && t.chips.length === 0 && !t.hitze; });
pruefe('Fokus-Block mit unbekanntem Typ', () => A.fokusBlock('quatsch').arbeit === 25 && A.fokusBlock().runden === 3);
pruefe('Grundlagen-Trend: leer, kaputt', () => A.efTrend([], H, 'lauf') === null && A.efTrend(kaputt, H, 'rad') === null && A.efTrend(null, H) === null);
pruefe('Statistik: Welch mit zu wenig Werten, p-Werte am Rand', () => A.welch([1], [2, 3]) === null && A.welch([1, 1, 1], [1, 1, 1]) === null && A.pWert(Infinity, 5) === 1 && A.bhQ([]).length === 0);

// Spiel-Motor
const leer = (extra) => Object.assign({ heute: H }, extra || {});
pruefe('Spiel: nur das Datum', () => { const r = S.berechne(leer()); return r.xp >= 0 && r.level.nr >= 1 && Array.isArray(r.quests.heute); });
pruefe('Spiel: ohne Uhr, leeres Profil', () => { const r = S.berechne(leer({ garmin: false, profil: {}, tage: [], einheiten: [], checkins: [] })); return r.quests.heute.length > 0 && r.quests.serie === 0; });
pruefe('Spiel: kaputte Einträge', () => { const r = S.berechne(leer({ tage: kaputt, einheiten: kaputt, checkins: kaputt, gym: kaputt, flow: kaputt, tagebuch: kaputt, schutz: kaputt })); return r.xp >= 0; });
pruefe('Spiel: kaputter Spielstand wird repariert', () => { const r = S.berechne(leer({ spiel: { start: 'gestern', monate: 5, tr: null } })); return /^\d{4}-\d\d-\d\d$/.test(r.spiel.start); });

// Gym (Version 46): Einschätzung der Einheit – für jede Kombination von Übungen eine Aussage – und „Schwerpunkt verschieben“.
// gym.js läuft im Browser; hier bekommt es nur so viel Umgebung, wie die Rechnung braucht (keine Oberfläche).
const gymLaden = () => {
  const vm = require('vm'), fs = require('fs');
  const state = { rechner: { gym: {} } }, nix = () => null;
  const knoten = () => ({ append() {}, appendChild() {}, prepend() {}, addEventListener() {}, setAttribute() {}, querySelector: nix, querySelectorAll: () => [], classList: { add() {}, remove() {}, toggle() {} }, style: {}, replaceChildren() {} });
  const ui = { $: nix, $$: () => [], el: knoten, svg: knoten, nf: (x, n) => Number(x).toFixed(n || 0).replace('.', ','), iso: (t) => new Date(t).toISOString().slice(0, 10), toDay: (d) => Date.parse(d + 'T00:00:00Z'),
    localDate: () => H, DAY: 86400000, rowsOf: (k) => (k === 'athlet' ? [{}] : []), heute: nix, svgIco: knoten, wischen: null };
  const window = { tfApp: { ui, seite() {}, routen() {}, route: () => 'training/gym', geh() {}, neu() {}, kopf() {} }, tfSeiten: { karte: knoten, dot: knoten, speicher: (k, d) => d }, scrollTo() {}, scrollY: 0 };
  const dash = { app: { konto: () => ({ uid: 'test' }), state, setRechner(r) { state.rechner = r; }, api: () => Promise.resolve({}), toast() {} } };
  const ctx = { window, dash, document: { getElementById: nix, addEventListener() {} }, localStorage: { getItem: nix, setItem() {} }, console, setTimeout, clearTimeout, requestAnimationFrame: (f) => f(), matchMedia: () => ({ matches: false }) };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'gym.js'), 'utf8'), ctx, { filename: 'gym.js' });
  return { gym: window.tfGym, setze: (g) => { state.rechner = { gym: Object.assign({ ort: 'studio' }, g) }; } };
};
const GY = gymLaden(), ZIELE = ['kraft', 'aufbau', 'ausdauer', 'power', 'stabil'], uebungen = GY.gym.uebungen();
const TITEL = new Set(['Allgemeine Kraft', 'Kraft fürs Schwimmen', 'Kraft fürs Rad', 'Kraft fürs Laufen', 'Kraft für Schwimmen und Rad', 'Kraft für Schwimmen und Laufen', 'Kraft für Rad und Laufen', 'Kraft für alle drei Disziplinen']);
const aussageOk = (L, z) => {
  const E = GY.gym.einschaetzung({ ids: L, ziel: z }); if (!E) return false;
  const text = [E.titel, E.satz].concat(E.bringt.map((x) => x.titel + ' ' + x.text), E.bau, E.achte.map((h) => h.text)).join(' | ');
  return TITEL.has(E.titel) && /^[A-ZÄÖÜ].*\.$/.test(E.satz) && E.bringt.length >= 2 && E.bringt.some((x) => x.d === 'alle') && E.bringt.some((x) => x.d !== 'alle') && E.bau.length >= 2 && E.achte.length <= 2
    && !/undefined|null|NaN| {2}|\.\.|, ,| und \./.test(text) && E.d.every((x) => x >= 0 && x <= 1) && (E.klasse === '') === (E.bringt[0].d === 'kaum')
    && !/Sprüngen für (den Oberkörper|den Rumpf|Oberkörper)|Rumpfübung(en)? für|am meisten für [^.]* und [^.]* und /.test(E.satz); // keine „Sprünge für den Oberkörper“, kein „und … und“
};
pruefe('Gym: jede einzelne Übung hat mit jedem Ziel eine Einschätzung', () => { GY.setze({}); const f = []; for (const z of ZIELE) for (const a of uebungen) if (!aussageOk([a], z)) f.push(a + ' ' + z); return { ok: uebungen.length >= 120 && !f.length, info: f.slice(0, 5) }; });
pruefe('Gym: jedes Paar von Übungen hat eine Einschätzung', () => { const f = []; for (let i = 0; i < uebungen.length; i++) for (let j = i + 1; j < uebungen.length; j++) if (!aussageOk([uebungen[i], uebungen[j]], ZIELE[(i + j) % 5])) f.push(uebungen[i] + '+' + uebungen[j]); return { ok: !f.length, info: f.slice(0, 5) }; });
pruefe('Gym: 20 000 zufällige Workouts (3–10 Übungen) haben eine Einschätzung', () => {
  let s = 46; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }, f = [];
  for (let k = 0; k < 20000; k++) { const len = 3 + Math.floor(rnd() * 8), S2 = new Set(); while (S2.size < len) S2.add(uebungen[Math.floor(rnd() * uebungen.length)]); const L = [...S2], z = ZIELE[Math.floor(rnd() * 5)]; if (!aussageOk(L, z)) f.push(L.join('+') + ' ' + z); }
  return { ok: !f.length, info: f.slice(0, 3) };
});
pruefe('Gym: Sprünge, Schwung und Rumpf sind richtig benannt („dazu Sprünge“, „Schwungübung“, „sowie“, „Vor allem Rumpfübungen“)', () => {
  const E = (L, z) => GY.gym.einschaetzung({ ids: L, ziel: z || 'kraft' });
  const a = E(['hocksprung', 'kniebeuge_lh', 'kreuzheben']), b = E(['pogo', 'hocksprung'], 'stabil'), c = E(['kb_swing'], 'power'), d = E(['wade_maschine', 'fersengang']), e = E(['plank', 'seitstuetz', 'hollow', 'bizeps_curl']), f = E(['plank', 'seitstuetz'], 'stabil');
  return { ok: /^Schwere Sätze mit großen Grundübungen .*, dazu Sprünge/.test(a.satz) && b.satz.startsWith('Schnelle, explosive Sätze mit Sprüngen für die Beine') && c.satz.includes('mit einer Schwungübung') && c.bau.includes('1 Schwungübung')
    && !c.bringt.some((x) => x.titel === 'Laufökonomie') && b.bringt[0].titel === 'Laufökonomie' && d.satz.includes('Waden sowie Schienbein und Fuß')
    && e.satz.startsWith('Vor allem Rumpfübungen mit Haltezeiten') && f.satz.startsWith('Rumpfübungen mit Haltezeiten'), info: [a.satz, b.satz, c.satz, d.satz, e.satz, f.satz] };
});
pruefe('Gym: leere und unbekannte Listen stürzen nicht ab', () => GY.gym.einschaetzung({ ids: [] }) === null && GY.gym.einschaetzung({ ids: ['gibt_es_nicht'] }) === null && GY.gym.einschaetzung({ ids: ['plank', 'gibt_es_nicht'], ziel: 'unsinn' }).titel.length > 0);
const VORL = { beine: ['quad', 'beinbeuger', 'gesaess', 'waden', 'adduktoren', 'abduktoren'], push: ['brust', 'schulter', 'trizeps'], ganz: ['quad', 'gesaess', 'beinbeuger', 'brust', 'lat', 'ruecken_oben', 'schulter', 'bauch'], core: ['bauch', 'seite', 'ruecken_unten'], arme: ['bizeps', 'trizeps', 'unterarm', 'schulter'] };
pruefe('Gym: Schwerpunkt verschieben – mit wachsendem Wunsch kommt ein Tausch nach dem anderen dazu, höchstens die Hälfte, nichts doppelt', () => {
  const f = [];
  for (const [id, m] of Object.entries(VORL)) for (const ort of ['studio', 'hanteln', 'ohne']) for (const z of ['kraft', 'stabil', 'ausdauer']) for (const achse of [0, 1, 2]) for (const dir of [1, -1]) {
    GY.setze({ muskeln: m, ziel: z, ort, dauer: 60, vorlage: id });
    const W = GY.gym.einschaetzung(); if (!W) continue;
    let alt = [];
    for (let k = 1; k <= 20; k++) {
      const w = Math.round((W.d[achse] + dir * 0.05 * k) * 100) / 100; if (w < 0.05 || w > 1) break;
      const wunsch = [null, null, null]; wunsch[achse] = w;
      const R = GY.gym.schwerpunkt(wunsch, { nurSuchen: true }), zu = R.tausche.map((t) => t.zu);
      const ok = zu.length <= Math.max(1, Math.floor(W.uebungen.length / 2)) && alt.every((x, i) => zu[i] === x) && new Set(zu).size === zu.length && !zu.some((x) => W.uebungen.includes(x))
        && R.tausche.every((t) => W.uebungen.includes(t.orig)) && (dir > 0 ? R.d[achse] >= R.d0[achse] - 1e-9 : R.d[achse] <= R.d0[achse] + 1e-9);
      if (!ok) { f.push([id, ort, z, achse, dir, w, zu.join('+')].join(' ')); break; }
      alt = zu;
    }
  }
  return { ok: !f.length, info: f.slice(0, 4) };
});
pruefe('Gym: ohne Wunsch wird nichts getauscht; ein Wunsch am jetzigen Stand auch nicht', () => { GY.setze({ muskeln: VORL.beine, ziel: 'kraft', dauer: 45 }); const d = GY.gym.einschaetzung().d; return GY.gym.schwerpunkt([null, null, null], { nurSuchen: true }).tausche.length === 0 && GY.gym.schwerpunkt(d.slice(), { nurSuchen: true }).tausche.length === 0; });

// Version 47: der kurze Abruf (lib/garmin.js) – gestern, heute und die jüngsten Einheiten. Garmin ist hier ein Stellvertreter:
// nichts geht ins Netz. Geprüft wird: Neues kommt dazu, nichts doppelt (zweimal abrufen = derselbe Stand), der Zeitpunkt des
// letzten vollen Abrufs bleibt stehen, Werte von gestern und heute werden ergänzt, ältere Tage bleiben unberührt.
const kurzTest = async () => {
  const G = require(path.join(__dirname, '..', 'lib', 'garmin.js'));
  const heute = G.today(), gestern = A.plus(heute, -1), alt = A.plus(heute, -9);
  const speicher = new Map(), hash = {};
  const db = { get: async (k) => (speicher.has(k) ? JSON.parse(JSON.stringify(speicher.get(k))) : null), set: async (k, v) => { speicher.set(k, JSON.parse(JSON.stringify(v))); }, hgetall: async (k) => Object.assign({}, hash[k] || {}), hset: async (k, f, v) => { (hash[k] = hash[k] || {})[f] = v; }, hdel: async (k, f) => { if (hash[k]) delete hash[k][f]; } };
  const ganz = new Date(Date.now() - 50 * 60e3).toISOString();
  await db.set('data:stand', { at: ganz, ganz_at: ganz, import_fertig: true, offen: 0, einheiten: 1, tage: 2, bis: gestern });
  await db.set('data:garmin_tage', [{ date: alt, hrv: 61, sleep_s: 27000 }, { date: gestern, hrv: 58 }]);
  await db.set('data:garmin_einheiten', [{ id: '100', parent_id: null, is_parent: false, date: gestern, start: gestern + 'T07:00', type: 'running', name: 'Lauf', dur_s: 3000, moving_s: 2950, dist_m: 10000 }]);
  await db.set('profil', {});
  const liste = [{ activityId: 100, startTimeLocal: gestern + ' 07:00:00', activityType: { typeKey: 'running' }, activityName: 'Lauf', duration: 3000, movingDuration: 2950, distance: 10000 }];
  const pfade = [], echt = global.fetch;
  const antwort = (status, body) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  global.fetch = async (url, o) => {
    const u = String(url); pfade.push(u.replace(/^https?:\/\/[^/]+/, '').split('?')[0]);
    if (o && o.method === 'POST') return antwort(200, 'stellvertreter-token');
    if (u.includes('/hrv-service/')) return antwort(200, { hrvSummaries: [] });
    if (u.includes('/sleep-service/')) return antwort(200, []);
    if (u.includes('/usersummary-service/')) return antwort(200, { data: [] });
    if (u.includes('/weight-service/')) return antwort(200, { dailyWeightSummaries: [] });
    if (u.includes('/activitylist-service/')) return antwort(200, liste);
    return antwort(404, '');
  };
  const p2 = async (n, fn) => { let ok = false, info = null; try { const r = await fn(); ok = r === true || (r && r.ok); info = r && r.info !== undefined ? r.info : r; } catch (e) { info = e.stack.split('\n').slice(0, 2).join(' | '); } console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok ? '' : ' – ' + JSON.stringify(info).slice(0, 260))); if (!ok) fehler++; };
  try {
    await p2('Kurzer Abruf ohne Neues: Stand frisch, keine neue Einheit, der volle Abruf bleibt datiert', async () => {
      const st = await G.kurzAbruf({ db, schluessel: 'stellvertreter', budgetMs: 8000 }), E = await db.get('data:garmin_einheiten');
      return { ok: st.kurz === true && st.neu === 0 && st.ganz_at === ganz && st.at > ganz && E.length === 1 && st.einheiten === 1 && pfade.length <= 7, info: { st, n: E.length, abrufe: pfade.length } };
    });
    liste.unshift({ activityId: 101, startTimeLocal: heute + ' 18:10:00', activityType: { typeKey: 'strength_training' }, activityName: 'Kraft', duration: 2400, movingDuration: 1500 });
    await p2('Kurzer Abruf mit neuer Einheit: sie kommt dazu (neu = 1), die alte bleibt', async () => {
      const st = await G.kurzAbruf({ db, schluessel: 'stellvertreter', budgetMs: 8000 }), E = await db.get('data:garmin_einheiten');
      return { ok: st.neu === 1 && E.length === 2 && E.some((e) => e.id === '101' && e.type === 'strength_training' && e.date === heute) && E.some((e) => e.id === '100') && st.einheiten === 2 && st.ganz_at === ganz, info: { neu: st.neu, ids: E.map((e) => e.id) } };
    });
    await p2('Noch einmal abrufen: nichts doppelt (neu = 0, weiter zwei Einheiten)', async () => {
      const st = await G.kurzAbruf({ db, schluessel: 'stellvertreter', budgetMs: 8000 }), E = await db.get('data:garmin_einheiten');
      return { ok: st.neu === 0 && E.length === 2 && new Set(E.map((e) => e.id)).size === 2, info: { neu: st.neu, ids: E.map((e) => e.id) } };
    });
    await p2('Tageswerte: ältere Tage bleiben, gestern behält seine Werte', async () => {
      const T = await db.get('data:garmin_tage'), a = T.find((t) => t.date === alt), g = T.find((t) => t.date === gestern);
      return { ok: !!a && a.hrv === 61 && a.sleep_s === 27000 && !!g && g.hrv === 58, info: T };
    });
    await p2('Ohne ersten Import nimmt der kurze Abruf den normalen Weg (kein halber Stand)', async () => {
      const db2 = { get: async () => null, set: async () => {}, hgetall: async () => ({}), hset: async () => {}, hdel: async () => {} };
      const vorher = pfade.length; let st = null;
      try { st = await G.kurzAbruf({ db: db2, schluessel: 'stellvertreter', budgetMs: 3000 }); } catch (e) { st = { fehler: e.message }; }
      return { ok: pfade.length - vorher > 6 || !!(st && (st.fehler || st.import_ab || st.kurz !== true)), info: { st, abrufe: pfade.length - vorher } };
    });
  } finally { global.fetch = echt; }
};

kurzTest().catch((e) => { console.log('FEHLER Kurzer Abruf – ' + e.message); fehler++; }).then(() => {
  console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
  process.exit(fehler ? 1 : 0);
});
