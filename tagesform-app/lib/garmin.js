// Garmin Connect Personal API → Datensätze der App, je Nutzer mit dessen eigenem API-Schlüssel.
// Beim ersten Mal 12 Monate, danach jeweils die letzten 4 Wochen; Neues ersetzt Altes im abgefragten Zeitraum.
const crypto = require('crypto');
const { analysiere, SPORT, VERSION: AV, profilKey } = require('./analyse');
const { profilFuer } = require('./profil');

const BASE = 'https://personal.connectapi.garmin.com';
const DAY = 864e5;
const KEEP_DAYS = 400;
const TZ = process.env.TF_TIMEZONE || 'Europe/Berlin';

const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (d, n) => isoDay(Date.parse(d) + n * DAY);
const num = (x) => (x == null || x === '' || !isFinite(+x) ? null : +x);
const rnd = (x, n = 1) => (num(x) == null ? null : +(+x).toFixed(n));
const loc = (ms) => (ms ? new Date(ms).toISOString().slice(0, 16) : null); // Garmin liefert Ortszeit als Epoch
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Zugang ---------- */
// Token für einen API-Schlüssel holen; wirft eine verständliche Meldung, wenn Garmin ablehnt
async function holeToken(schluessel) {
  const key = String(schluessel || '').trim();
  if (!key) throw Object.assign(new Error('Noch kein Garmin-Schlüssel – bitte unter Profil → Konto eintragen.'), { code: 'garmin_fehlt' });
  const r = await fetch(BASE + '/personalapitoken-service/personal-api/personal-api-key/token', { method: 'POST', headers: { Authorization: 'ApiKey ' + key } });
  if (r.status === 401 || r.status === 403 || r.status === 400) throw Object.assign(new Error('Garmin lehnt diesen Schlüssel ab. Ist er vollständig kopiert? Sonst ist seine Laufzeit abgelaufen – dann in Garmin Connect einen neuen erstellen.'), { code: 'garmin_abgelehnt' });
  if (!r.ok) throw new Error('Garmin-Anmeldung fehlgeschlagen (HTTP ' + r.status + ') – später noch einmal versuchen.');
  let t = (await r.text()).trim();
  if (t.startsWith('{')) { const j = JSON.parse(t); t = j.access_token || j.accessToken || j.token || ''; }
  if (!t) throw new Error('Garmin hat kein Token geliefert.');
  let exp = Date.now() + 20 * 3600e3;
  try { const p = JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()); if (p.exp) exp = Math.min(exp, p.exp * 1000); } catch (e) { /* kein lesbarer Ablauf */ }
  return { t, exp };
}

// Eine Verbindung je Nutzer: eigenes Token und eigene Drosselung.
// Garmin erlaubt 100 Abrufe pro Minute (danach 429 mit Retry-After). Wir bleiben bei 95 pro 60 s,
// höchstens 3 gleichzeitig; ist das Zeitbudget eines Abrufs erreicht, geht es beim nächsten Mal weiter.
const LIMIT = 95, FENSTER = 60e3;
function verbindung(schluessel, db) {
  let TOKEN = null, HARD = 0, active = 0, blockedUntil = 0;
  const starts = [], waiters = [], STATS = { abrufe: 0, wiederholt: 0, fehler: {} };
  async function token(fresh) {
    if (!fresh) {
      if (TOKEN) return TOKEN;
      const c = await db.get('garmin:token');
      if (c && c.exp > Date.now() + 10 * 60e3 && c.k === kennung) return (TOKEN = c.t);
    }
    const n = await holeToken(schluessel);
    await db.set('garmin:token', { t: n.t, exp: n.exp, k: kennung }, Math.max(60, Math.floor((n.exp - Date.now()) / 1000)));
    return (TOKEN = n.t);
  }
  const kennung = crypto.createHash('sha256').update(String(schluessel)).digest('base64url').slice(0, 10); // Token gehört zu genau diesem Schlüssel
  function release() { active--; const w = waiters.shift(); if (w) w(); }
  async function slot() { // false = Zeitbudget wäre überschritten
    while (active >= 3) await new Promise((r) => waiters.push(r));
    active++;
    for (;;) {
      const now = Date.now();
      while (starts.length && starts[0] <= now - FENSTER) starts.shift();
      const at = Math.max(blockedUntil, starts.length >= LIMIT ? starts[0] + FENSTER + 50 : 0);
      if (at <= now) { starts.push(now); return true; }
      if (HARD && at > HARD) { release(); return false; }
      await pause(at - now);
    }
  }
  // undefined = Abruf fehlgeschlagen (oder Zeitbudget aufgebraucht), null = keine Daten
  async function get(path) {
    let renewed = false;
    for (let i = 0; i < 6; i++) {
      if ((HARD && Date.now() > HARD) || !(await slot())) { STATS.fehler.zeit = (STATS.fehler.zeit || 0) + 1; return undefined; }
      let r = null, err = null;
      try { STATS.abrufe++; r = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + (await token()), Accept: 'application/json' } }); }
      catch (e) { err = e; }
      finally { release(); }
      if (err && err.code) throw err; // Schlüssel fehlt oder wird abgelehnt: nicht weiter versuchen
      if (!r) { STATS.wiederholt++; await pause(1000 * (i + 1)); continue; }
      if (r.status === 204) return null;
      if (r.ok) { const txt = await r.text(); try { return txt.trim() ? JSON.parse(txt) : null; } catch (e) { return undefined; } }
      if (r.status === 401 && !renewed) { renewed = true; await token(true); i--; continue; }
      if (r.status === 429) { // Limit erreicht: alle Abrufe dieses Schlüssels gemeinsam pausieren
        STATS.wiederholt++;
        const ra = +r.headers.get('retry-after');
        blockedUntil = Math.max(blockedUntil, Date.now() + (ra > 0 && ra <= 120 ? ra * 1000 + 300 : 15000));
        if (i === 5) STATS.fehler[429] = (STATS.fehler[429] || 0) + 1;
        continue;
      }
      if ([500, 502, 503, 504].includes(r.status)) { STATS.wiederholt++; await pause(1000 * (i + 1)); if (i === 5) STATS.fehler[r.status] = (STATS.fehler[r.status] || 0) + 1; continue; }
      if (r.status !== 404) STATS.fehler[r.status] = (STATS.fehler[r.status] || 0) + 1;
      return r.status === 404 ? null : undefined;
    }
    return undefined;
  }
  return {
    get, token, STATS,
    setHard(t) { HARD = t; },
    bereitIn: () => Math.max(0, Math.ceil((Math.max(blockedUntil, starts.length >= LIMIT ? starts[0] + FENSTER : 0) - Date.now()) / 1000)),
  };
}

async function pool(tasks, n) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => { while (i < tasks.length) { const k = i++; await tasks[k](); } }));
}
function ranges(from, to, n) {
  const out = []; let d = from;
  while (d <= to) { const e = addDays(d, n - 1) < to ? addDays(d, n - 1) : to; out.push([d, e]); d = addDays(e, 1); }
  return out;
}

/* ---------- Umformen: gleiche Spalten wie im Dashboard ---------- */
function dayRows(hrv, sleep, daily) {
  const days = {};
  const row = (d) => (days[d] = days[d] || { date: d });
  hrv.forEach((h) => {
    if (!h || !h.calendarDate) return; const b = h.baseline || {};
    Object.assign(row(h.calendarDate), { hrv: h.lastNightAvg ?? null, hrv_peak: h.lastNight5MinHigh ?? null, hrv_status: h.status ?? null, hrv_bal_lo: b.balancedLow ?? null, hrv_bal_hi: b.balancedUpper ?? null });
  });
  sleep.forEach((s) => {
    if (!s || !s.calendarDate || !s.sleepTimeSeconds) return; const ov = (s.sleepScores || {}).overall || {};
    Object.assign(row(s.calendarDate), {
      sleep_s: s.sleepTimeSeconds, deep_s: s.deepSleepSeconds ?? null, light_s: s.lightSleepSeconds ?? null, rem_s: s.remSleepSeconds ?? null, awake_s: s.awakeSleepSeconds ?? null,
      sleep_start: loc(s.sleepStartTimestampLocal), sleep_end: loc(s.sleepEndTimestampLocal), sleep_need_min: (s.sleepNeed || {}).actual ?? null, sleep_score: ov.value ?? null,
      sleep_resp: rnd(s.averageRespirationValue), sleep_hr: rnd(s.avgHeartRate), sleep_spo2: rnd(s.averageSpO2Value), sleep_stress: rnd(s.avgSleepStress), awake_count: s.awakeCount ?? null,
    });
  });
  daily.forEach((x) => {
    if (!x || !x.calendarDate) return;
    const hr = x.heartRate || {}, st = x.stress || {}, bb = x.bodyBattery || {}, steps = (x.movement || {}).steps || {}, im = x.intensityMinutes || {}, kc = x.calories || {}, hy = x.hydration || {};
    Object.assign(row(x.calendarDate), {
      rhr: hr.restingValue ?? null, hr_min: hr.minValue ?? null, hr_max_day: hr.maxValue ?? null, stress_avg: st.avgLevel ?? null, worn_h: rnd((st.totalDurationInMillis || 0) / 3.6e6),
      steps: steps.value ?? null, kcal_active: kc.burnedActive ?? null, kcal_total: kc.burnedTotal ?? null, kcal_zufuhr: num(kc.consumedValue ?? kc.consumedTotal ?? kc.consumed),
      bb_max: bb.maxValue ?? null, bb_min: bb.minValue ?? null, bb_charged: bb.chargedValue ?? null, bb_drained: bb.drainedValue ?? null,
      im_moderate: im.moderate ?? null, im_vigorous: im.vigorous ?? null, wasser_ml: num(hy.valueInML), schweiss_ml: num(hy.sweatLossInML),
    });
  });
  return days;
}

const MMP = [1, 2, 5, 10, 20, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 18000];
function activityRow(a) {
  const t = (a.activityType || {}).typeKey, st = a.startTimeLocal || '';
  const r = {
    id: String(a.activityId), parent_id: null, is_parent: !!(a.isParent || t === 'multi_sport'), date: st.slice(0, 10), start: st.slice(0, 16).replace(' ', 'T'), type: t, name: a.activityName || '',
    dur_s: rnd(a.duration, 0), moving_s: rnd(a.movingDuration, 0), dist_m: rnd(a.distance, 0), elev_m: rnd(a.elevationGain, 0), avg_hr: rnd(a.averageHR, 0), max_hr: rnd(a.maxHR, 0),
    avg_w: rnd(a.avgPower, 0), np_w: rnd(a.normPower, 0), garmin_tss: rnd(a.trainingStressScore), garmin_if: rnd(a.intensityFactor, 3), te_aer: a.aerobicTrainingEffect ?? null, te_ana: a.anaerobicTrainingEffect ?? null, garmin_load: rnd(a.activityTrainingLoad),
    z1_s: rnd(a.hrTimeInZone_1, 0), z2_s: rnd(a.hrTimeInZone_2, 0), z3_s: rnd(a.hrTimeInZone_3, 0), z4_s: rnd(a.hrTimeInZone_4, 0), z5_s: rnd(a.hrTimeInZone_5, 0),
    speed: rnd(a.averageSpeed, 3), gap_speed: rnd(a.avgGradeAdjustedSpeed, 3), run_cad: rnd(a.averageRunningCadenceInStepsPerMinute), step_cm: rnd(a.avgStrideLength), gct_ms: rnd(a.avgGroundContactTime), vo_cm: rnd(a.avgVerticalOscillation), vr_pct: rnd(a.avgVerticalRatio, 2),
    bike_cad: rnd(a.averageBikingCadenceInRevPerMinute), swim_cad: rnd(a.averageSwimCadenceInStrokesPerMinute), swolf: rnd(a.averageSwolf), pool_m: rnd(a.poolLength),
    zuege_laenge: rnd(a.avgStrokes), laengen: a.activeLengths ?? null, fs100: rnd(a.fastestSplit_100), fs400: rnd(a.fastestSplit_400), schweiss_ml: rnd(a.waterEstimated, 0),
  };
  MMP.forEach((s) => { r['p' + s] = a['maxAvgPower_' + s] ?? null; });
  return r;
}
function childRow(c) {
  const s = c.summaryDTO || {}, st = (s.startTimeLocal || '').slice(0, 16), run = c.childType === 'running';
  return {
    id: String(c.childId), parent_id: String(c.parentId), is_parent: false, date: st.slice(0, 10), start: st, type: c.childType, name: c.activityName || '',
    dur_s: rnd(s.duration, 0), moving_s: rnd(s.movingDuration, 0), dist_m: rnd(s.distance, 0), elev_m: rnd(s.elevationGain, 0), avg_hr: rnd(s.averageHR, 0), max_hr: rnd(s.maxHR, 0),
    avg_w: run ? null : rnd(s.averagePower, 0), np_w: run ? null : rnd(s.normalizedPower, 0), garmin_tss: rnd(s.trainingStressScore), garmin_if: rnd(s.intensityFactor, 3), te_aer: s.trainingEffect ?? null, te_ana: s.anaerobicTrainingEffect ?? null, garmin_load: rnd(s.activityTrainingLoad),
    speed: rnd(s.averageSpeed, 3), gap_speed: rnd(s.avgGradeAdjustedSpeed, 3), run_cad: rnd(s.averageRunCadence), step_cm: rnd(s.strideLength), gct_ms: rnd(s.groundContactTime), vo_cm: rnd(s.verticalOscillation), vr_pct: rnd(s.verticalRatio, 2),
    bike_cad: rnd(s.averageBikeCadence), swim_cad: rnd(s.averageSwimCadence), swolf: rnd(s.averageSWOLF), zug_m: rnd(s.averageStrokeDistance, 2), p1200: run ? null : rnd(s.maxPowerTwentyMinutes, 0), schweiss_ml: rnd(s.waterEstimated, 0),
  };
}
function weightRow(x) {
  const w = x.latestWeight || {};
  if (!w.weight) return null;
  return { date: x.summaryDate, kg: rnd(w.weight / 1000, 1), fett_pct: rnd(w.bodyFat), wasser_pct: rnd(w.bodyWater), muskel_kg: w.muscleMass ? rnd(w.muscleMass / 1000, 1) : null, messungen: x.numOfWeightEntries ?? null };
}

// Ernährungsprotokoll (Garmin Connect+): mealDetails[].loggedFoods[] – Nährwerte je Eintrag aufsummiert.
const NUTR = { kcal: /^(calories|kcal|energy|totalCalories)$/i, kh: /^(carbs|carbohydrates?|totalCarbs?|carbohydrate)$/i, eiweiss: /^(proteins?|totalProtein)$/i, fett: /^(fats?|totalFats?)$/i };
const TIME = /^(logTime|loggedTime|consumedTime|timestamp|logTimestamp|loggedAt|time|dateTime|logDateTime)(Local|GMT)?$/i;
function pickNum(o, re, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 3) return null;
  for (const k of Object.keys(o)) if (re.test(k) && num(o[k]) != null) return +o[k];
  for (const k of Object.keys(o)) if (!/goal|target|remain|recommend/i.test(k) && o[k] && typeof o[k] === 'object') { const v = pickNum(o[k], re, depth + 1); if (v != null) return v; }
  return null;
}
function pickTime(o) {
  for (const k of Object.keys(o || {})) if (TIME.test(k) && o[k]) { const v = o[k]; const t = typeof v === 'number' ? new Date(v).toISOString().slice(0, 16) : String(v).slice(0, 16).replace(' ', 'T'); if (/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(t)) return t; }
  return null;
}
function nutritionRow(d, log) {
  if (!log || typeof log !== 'object') return null;
  const foods = [];
  (log.mealDetails || []).forEach((m) => ((m && m.loggedFoods) || []).forEach((f) => foods.push(f)));
  (log.foodLogs || []).forEach((f) => foods.push(f));
  if (!foods.length) return null;
  const row = { date: d, eintraege: foods.length, kcal: 0, kh_g: 0, eiweiss_g: 0, fett_g: 0, zeiten: [] };
  foods.forEach((f) => {
    const kh = pickNum(f, NUTR.kh) || 0;
    row.kcal += pickNum(f, NUTR.kcal) || 0; row.kh_g += kh; row.eiweiss_g += pickNum(f, NUTR.eiweiss) || 0; row.fett_g += pickNum(f, NUTR.fett) || 0;
    const t = pickTime(f); if (t && kh > 0) row.zeiten.push([t, Math.round(kh)]);
  });
  ['kcal', 'kh_g', 'eiweiss_g', 'fett_g'].forEach((k) => { row[k] = Math.round(row[k]); });
  row.felder = Object.keys(foods[0]).slice(0, 30).join(','); // nur Feldnamen, für spätere Anpassungen
  return row;
}

/* ---------- Aktualisieren ---------- */
// Ein Abruf holt immer die letzten 4 Wochen. Beim ersten Import (oder „12 Monate neu laden“) kommen ältere
// 4-Wochen-Blöcke dazu, solange das Zeitbudget reicht – der nächste Abruf macht genau dort weiter.
// budgetMs: Browser kurz (Antwort unter einer Minute), Cron lang.
async function refresh({ db, schluessel, full, budgetMs } = {}) {
  const t0 = Date.now(), budget = budgetMs || 220e3, deadline = t0 + budget;
  const g = verbindung(schluessel, db), get = (p) => g.get(p);
  g.setHard(t0 + budget + 12e3);
  await g.token();
  const prev = {};
  for (const k of ['garmin_tage', 'garmin_einheiten', 'garmin_gewicht', 'garmin_ernaehrung']) prev[k] = (await db.get('data:' + k)) || [];
  const prevStand = (await db.get('data:stand')) || {};
  const to = today(), target = addDays(to, -364), keepFrom = addDays(to, -KEEP_DAYS), recentFrom = addDays(to, -27);
  const neu = !!full || !prev.garmin_tage.length;
  let importAb = neu ? recentFrom : prevStand.import_ab && prevStand.import_ab > target ? prevStand.import_ab : target;

  // Tageswerte und Gewicht je 4-Wochen-Block
  const tage = new Map(prev.garmin_tage.map((r) => [r.date, r]));
  const gewicht = new Map(prev.garmin_gewicht.map((r) => [r.date, r]));
  let fehler = 0, zones;
  async function block(s, e) {
    const res = await Promise.all([
      get(`/hrv-service/hrv/daily/${s}/${e}`), get(`/sleep-service/sleep/dailySleepSummariesByDate?startDate=${s}&endDate=${e}`),
      get(`/usersummary-service/v2/dailysummaries?startDate=${s}&endDate=${e}`), get(`/weight-service/weight/range/${s}/${e}?includeAll=true`),
    ]);
    const [h, sl, d, w] = res, ok = res.every((x) => x !== undefined);
    if (!ok) fehler++;
    const days = dayRows((h && h.hrvSummaries) || [], Array.isArray(sl) ? sl : [], (d && d.data) || []);
    if (h !== undefined && sl !== undefined && d !== undefined) [...tage.keys()].forEach((k) => { if (k >= s && k <= e) tage.delete(k); }); // vollständig: ersetzen
    Object.values(days).forEach((r) => tage.set(r.date, Object.assign({}, tage.get(r.date) || {}, r)));
    if (w !== undefined) { [...gewicht.keys()].forEach((k) => { if (k >= s && k <= e) gewicht.delete(k); }); ((w && w.dailyWeightSummaries) || []).map(weightRow).filter(Boolean).forEach((r) => gewicht.set(r.date, r)); }
    return { ok, days };
  }
  const nut = {}, side = [async () => { zones = await get('/biometric-service/heartRateZones/v2'); }];
  for (let k = 0; k < (neu ? 21 : 10); k++) { const d = addDays(to, -k); side.push(async () => { nut[d] = await get(`/nutrition-service/food/logs/${d}`); }); }
  const [recent] = await Promise.all([block(recentFrom, to), pool(side, 3)]);
  if (!recent.ok && !tage.size) throw new Error('Garmin antwortet gerade nicht – später noch einmal versuchen.');
  // ältere Blöcke rückwärts, solange etwa die Hälfte des Budgets übrig ist
  while (importAb > target && Date.now() < t0 + budget * 0.5) {
    const e = addDays(importAb, -1), s = addDays(e, -27) < target ? target : addDays(e, -27);
    const r = await block(s, e);
    if (!r.ok) break; // lückenlos bleiben: beim nächsten Mal hier weiter
    importAb = s;
  }

  const tTage = Date.now();
  // Einheiten: Liste bis zum ältesten importierten Tag
  const listFrom = importAb < recentFrom ? importAb : recentFrom;
  const acts = []; let oldest = '9999', listOk = true;
  for (let start = 0; start < 3000; start += 100) {
    const page = await get(`/activitylist-service/activities/search/activities?start=${start}&limit=100`);
    if (page === undefined) { listOk = false; break; }
    if (!Array.isArray(page) || !page.length) break;
    acts.push(...page);
    page.forEach((a) => { if ((a.startTimeLocal || '9999') < oldest) oldest = a.startTimeLocal; });
    if (oldest.slice(0, 10) < listFrom || page.length < 100) break;
  }
  const tListe = Date.now();
  // Multisport: Abschnitte einzeln holen; unvollständige Einheiten werden beim nächsten Abruf ergänzt
  const prevById = new Map(prev.garmin_einheiten.map((r) => [r.id, r])), stored = {};
  prev.garmin_einheiten.forEach((r) => { if (r.parent_id) (stored[r.parent_id] = stored[r.parent_id] || new Set()).add(r.id); });
  const complete = (id) => { const p = prevById.get(id); return !!p && p.kinder_n != null && (stored[id] ? stored[id].size : 0) >= p.kinder_n; };
  const parents = acts.filter((a) => (a.isParent || (a.activityType || {}).typeKey === 'multi_sport') && !complete(String(a.activityId)) && (a.startTimeLocal || '') >= keepFrom);
  const inList = new Set(acts.map((a) => String(a.activityId)));
  prev.garmin_einheiten.forEach((r) => { if (r.is_parent && !inList.has(r.id) && !complete(r.id) && r.date >= keepFrom) parents.push({ activityId: r.id }); });
  const kids = [], kidsN = {}; let offen = 0;
  for (const p of parents) {
    const pid = String(p.activityId);
    if (Date.now() > deadline) { offen++; continue; } // Rest beim nächsten Abruf
    const d = await get(`/activity-service/activity/${pid}`);
    if (!d) { offen++; continue; }
    const md = d.metadataDTO || {}, ids = md.childIds || [], types = md.childActivityTypes || [], have = stored[pid] || new Set();
    let got = 0;
    await pool(ids.map((cid, i) => async () => {
      if (have.has(String(cid))) { got++; return; }
      if (Date.now() > deadline) return;
      const c = await get(`/activity-service/activity/${cid}`);
      if (c) { got++; kids.push({ parentId: pid, childId: cid, childType: types[i], activityName: c.activityName, summaryDTO: c.summaryDTO }); }
    }), 3);
    kidsN[pid] = ids.length;
    if (got < ids.length) offen++;
  }

  // Zusammenführen
  const einheiten = new Map(prev.garmin_einheiten.map((r) => [r.id, r]));
  if (listOk && acts.length && oldest.slice(0, 10) <= listFrom) { // in Garmin gelöschte Einheiten entfernen
    const ids = new Set(acts.map((a) => String(a.activityId)));
    prev.garmin_einheiten.forEach((r) => { if (r.date >= listFrom && !ids.has(r.parent_id || r.id)) einheiten.delete(r.id); });
  }
  acts.forEach((a) => {
    const r = activityRow(a);
    if (r.is_parent) r.kinder_n = kidsN[r.id] != null ? kidsN[r.id] : (prevById.get(r.id) || {}).kinder_n ?? null;
    einheiten.set(r.id, r);
  });
  Object.keys(kidsN).forEach((pid) => { const r = einheiten.get(pid); if (r) einheiten.set(pid, Object.assign({}, r, { kinder_n: kidsN[pid] })); });
  kids.forEach((c) => { const r = childRow(c); einheiten.set(r.id, r); });
  const ernaehrung = new Map(prev.garmin_ernaehrung.map((r) => [r.date, r]));
  Object.keys(nut).forEach((d) => { if (nut[d] === undefined) return; const r = nutritionRow(d, nut[d]); if (r) ernaehrung.set(d, r); else ernaehrung.delete(d); });

  const keep = (rows) => rows.filter((r) => (r.date || '') >= keepFrom).sort((a, b) => ((a.start || a.date) < (b.start || b.date) ? -1 : 1));
  const out = { garmin_tage: keep([...tage.values()]), garmin_einheiten: keep([...einheiten.values()]), garmin_gewicht: keep([...gewicht.values()]), garmin_ernaehrung: keep([...ernaehrung.values()]) };
  for (const k of Object.keys(out)) await db.set('data:' + k, out[k]);
  let hfz = null;
  if (Array.isArray(zones) && zones.length) {
    hfz = zones.map((x) => ({ sport: x.sport, methode: x.trainingMethod, lthr: x.lactateThresholdHeartRateUsed, hf_max: x.maxHeartRateUsed, z1: x.zone1Floor, z2: x.zone2Floor, z3: x.zone3Floor, z4: x.zone4Floor, z5: x.zone5Floor }));
    await db.set('data:garmin_hf_zonen', hfz);
  }
  // Einheiten-Check: Sekundendaten neuer Rad- und Laufeinheiten auswerten, solange das Zeitbudget reicht
  const profil = profilFuer({ garmin_gewicht: out.garmin_gewicht, garmin_einheiten: out.garmin_einheiten, garmin_hf_zonen: hfz || (await db.get('data:garmin_hf_zonen')) || [] }, await db.get('profil')), pk = profilKey(profil);
  const fertig = await db.hgetall('analyse'), seit = addDays(to, -120);
  for (const [id, x] of Object.entries(fertig)) if (x && x.date && x.date < keepFrom) { await db.hdel('analyse', id); await db.hdel('serie', id); } // gleiche Frist wie die Garmin-Daten
  const kandidaten = out.garmin_einheiten.filter((e) => !e.is_parent && SPORT[e.type] && (+e.moving_s || +e.dur_s) >= 900 && e.date >= seit && !(fertig[e.id] && fertig[e.id].v === AV && fertig[e.id].pk === pk)).sort((x, y) => (x.start < y.start ? 1 : -1));
  let analysiert = 0;
  for (const e of kandidaten) {
    if (Date.now() > deadline || analysiert >= 40) break;
    const det = await get(`/activity-service/activity/${e.id}/details?maxChartSize=3600&maxPolylineSize=0`);
    if (det === undefined) break;
    const r = det ? analysiere(e, det, profil) : null;
    await db.hset('analyse', e.id, r ? r.analyse : { id: e.id, v: AV, pk, date: e.date, leer: true });
    if (r) await db.hset('serie', e.id, r.serie);
    analysiert++;
  }
  const last = out.garmin_tage[out.garmin_tage.length - 1], heute = recent.days[to];
  const stand = {
    at: new Date().toISOString(), voll: neu, sekunden: Math.round((Date.now() - t0) / 1000), tage: out.garmin_tage.length, einheiten: out.garmin_einheiten.length, bis: last ? last.date : null,
    schlaf_heute: !!(heute && heute.sleep_s) || !!(prevStand.schlaf_heute && prevStand.bis === to), import_ab: importAb, import_fertig: importAb <= target, luecken: fehler, offen, analysiert, analyse_offen: kandidaten.length - analysiert,
    abrufe: g.STATS.abrufe, wiederholt: g.STATS.wiederholt, http_fehler: g.STATS.fehler, phasen_s: [tTage - t0, tListe - tTage, Date.now() - tListe].map((x) => Math.round(x / 1000)),
    bereit_in_s: g.bereitIn(),
  };
  await db.set('data:stand', stand);
  return stand;
}

// Neuen Schlüssel prüfen: Garmin muss ein Token dafür ausgeben
async function pruefeSchluessel(schluessel) { await holeToken(schluessel); return true; }

module.exports = { refresh, pruefeSchluessel, today };
