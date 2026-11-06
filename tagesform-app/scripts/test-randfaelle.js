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

console.log(fehler ? fehler + ' FEHLER' : 'Alles ok');
process.exit(fehler ? 1 : 0);
