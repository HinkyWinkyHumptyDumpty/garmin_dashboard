// Einheiten-Check: wertet die Sekundendaten einer Rad- oder Laufeinheit aus (Garmin „activity details“).
// Ergebnis: Intensitätsverteilung zu VT1/VT2, Normalized Power, Variabilität, Decoupling, Spitzen – und ein kurzer Befund.
const SPORT = { cycling: 'rad', indoor_cycling: 'rad', virtual_ride: 'rad', road_biking: 'rad', gravel_cycling: 'rad', mountain_biking: 'rad', running: 'lauf', treadmill_running: 'lauf', trail_running: 'lauf' };
const VERSION = 3;

function spalten(det) {
  const idx = {};
  (det.metricDescriptors || []).forEach((m) => { idx[m.key] = m.metricsIndex; });
  const rows = det.activityDetailMetrics || [];
  const col = (k) => (idx[k] == null ? null : rows.map((r) => { const v = r.metrics[idx[k]]; return v == null || !isFinite(+v) ? null : +v; }));
  return {
    t: col('sumDuration') || col('sumElapsedDuration'), p: col('directPower'), hr: col('directHeartRate'),
    v: col('directGradeAdjustedSpeed') || col('directSpeed'), vroh: col('directSpeed'), cad: col('directDoubleCadence') || col('directBikeCadence') || col('directRunCadence'), temp: col('directAirTemperature'),
  };
}

const r1 = (x, n = 1) => (x == null || !isFinite(x) ? null : +x.toFixed(n));
const f = (x, n = 1) => x.toFixed(n).replace('.', ',');

function analysiere(act, det, a) {
  const sport = SPORT[act.type];
  if (!sport) return null;
  const S = spalten(det), n = S.t ? S.t.length : 0;
  if (n < 30) return null;
  // Zeitgewichte: Abstand zur nächsten Messung, Pausen (> 10 s) zählen nicht
  const dt = S.t.map((t, i) => (i < n - 1 ? Math.max(0, Math.min(10, S.t[i + 1] - t)) : 1));
  const T = dt.reduce((s, x) => s + x, 0);
  if (T < 15 * 60) return null;
  const ftp = a.ftp_ref_w, vt1 = a.vt1_hf, vt2 = a.vt2_hf;
  const hasHr = S.hr && S.hr.filter((h) => h > 60).length > n * 0.5;
  const hasP = sport === 'rad' && S.p && S.p.filter((p) => p != null).length > n * 0.5;

  // 5-s-Blöcke: Grundlage für Normalized Power, Zonen und Spitzen
  const bins = []; let acc = 0, bp = 0, bv = 0, br = 0, bw = 0;
  for (let i = 0; i < n; i++) {
    const w = dt[i]; if (!w) continue;
    bp += (S.p && S.p[i] != null ? S.p[i] : 0) * w; bv += (S.v && S.v[i] != null ? S.v[i] : 0) * w; br += (S.vroh && S.vroh[i] != null ? S.vroh[i] : 0) * w; bw += w; acc += w;
    if (acc >= 5) { bins.push({ p: bp / bw, v: bv / bw, r: br / bw, w: bw }); acc = 0; bp = 0; bv = 0; br = 0; bw = 0; }
  }
  // 3-Zonen-Modell (Seiler): Rad mit Leistung (30-s-Mittel) zu 76 % / 100 % FTP, sonst Puls zu VT1/VT2
  const z = [0, 0, 0];
  if (hasP) {
    for (let i = 0; i < bins.length; i += 6) { const b = bins.slice(i, i + 6), w = b.reduce((s, x) => s + x.w, 0), m = b.reduce((s, x) => s + x.p * x.w, 0) / w; z[m < 0.76 * ftp ? 0 : m < ftp ? 1 : 2] += w; }
  } else if (hasHr) {
    for (let i = 0; i < n; i++) { const h = S.hr[i]; if (h > 60) z[h < vt1 ? 0 : h < vt2 ? 1 : 2] += dt[i]; }
  }
  const zt = z[0] + z[1] + z[2], fz = z.map((x) => (zt ? x / zt : 0));
  const hz = [0, 0, 0]; // Pulszonen, u. a. für Spitzen in lockeren Einheiten
  if (hasHr) for (let i = 0; i < n; i++) { const h = S.hr[i]; if (h > 60) hz[h < vt1 ? 0 : h < vt2 ? 1 : 2] += dt[i]; }
  const out = { id: act.id, v: VERSION, pk: profilKey(a), date: act.date, start: act.start, sport, typ_garmin: act.type, min: Math.round(T / 60), hf_daten: hasHr, z1_pct: Math.round(100 * fz[0]), z2_pct: Math.round(100 * fz[1]), z3_pct: Math.round(100 * fz[2]), z3_min: Math.round(z[2] / 60), z2_min: Math.round(z[1] / 60), zonen: hasP ? 'Leistung' : 'Puls', puls_vt2_min: Math.round(hz[2] / 60) };

  // Leistung (Rad): NP nach Coggan (30-s-Mittel hoch 4), Variabilität, Zeit über FTP, kurze Spitzen
  let ueberFtp = 0, spitzen = 0;
  if (hasP) {
    const roll = []; let np4 = 0, cnt = 0, sum = 0, wsum = 0;
    bins.forEach((b, i) => { roll.push(b.p); if (roll.length > 6) roll.shift(); sum += b.p * b.w; wsum += b.w; if (i >= 5) { const m = roll.reduce((s, x) => s + x, 0) / roll.length; np4 += m ** 4; cnt++; } });
    const np = cnt ? Math.pow(np4 / cnt, 0.25) : sum / wsum, avg = sum / wsum;
    for (let i = 0; i + 5 < bins.length; i += 6) { const m = bins.slice(i, i + 6).reduce((s, b) => s + b.p, 0) / 6; if (m > ftp) ueberFtp += 30; }
    bins.forEach((b) => { if (b.p > 1.2 * ftp) spitzen += b.w; });
    Object.assign(out, { np: Math.round(np), avg_w: Math.round(avg), vi: r1(np / Math.max(1, avg), 2), if: r1(np / ftp, 2), tss: Math.round((T / 3600) * (np / ftp) ** 2 * 100), ueber_ftp_min: Math.round(ueberFtp / 60), spitzen_s: Math.round(spitzen) });
  }
  // Tempo (Lauf): Zeit schneller als VT2-Tempo in 30-s-Blöcken, steigungsbereinigt wenn vorhanden
  let schnell = 0;
  if (sport === 'lauf' && S.v) {
    const vVt2 = 1000 / a.vt2_pace_s_km;
    for (let i = 0; i + 5 < bins.length; i += 6) { const m = bins.slice(i, i + 6).reduce((s, b) => s + (S.vroh ? b.r : b.v), 0) / 6; if (m > vVt2) schnell += 30; }
    out.schnell_min = Math.round(schnell / 60);
  }

  // Decoupling (Friel): Leistung bzw. Tempo pro Herzschlag, erste gegen zweite Hälfte, ohne die ersten 10 min
  const minDauer = sport === 'rad' ? 60 * 60 : 45 * 60;
  const vb = bins.map((b) => b.v).filter((v) => v > 1), vm = vb.reduce((s, x) => s + x, 0) / Math.max(1, vb.length);
  const vcv = vb.length ? Math.sqrt(vb.reduce((s, x) => s + (x - vm) ** 2, 0) / vb.length) / vm : 1;
  const gleichmaessig = hasP ? out.vi <= 1.08 : sport === 'lauf' && vcv <= 0.15;
  if (hasHr && gleichmaessig && T >= minDauer + 600 && (hasP || (sport === 'lauf' && S.v))) {
    let cum = 0; const half = (T - 600) / 2, h = [{ x: 0, hr: 0, w: 0 }, { x: 0, hr: 0, w: 0 }];
    for (let i = 0; i < n; i++) {
      cum += dt[i]; if (cum <= 600 || !(S.hr[i] > 60)) continue;
      const k = cum - 600 < half ? 0 : 1, x = sport === 'rad' ? S.p[i] || 0 : S.v[i] || 0;
      h[k].x += x * dt[i]; h[k].hr += S.hr[i] * dt[i]; h[k].w += dt[i];
    }
    if (h[0].w > 600 && h[1].w > 600) {
      const ef1 = h[0].x / h[0].hr, ef2 = h[1].x / h[1].hr;
      out.decoupling_pct = r1((100 * (ef1 - ef2)) / ef1, 1);
    }
  }
  if (S.cad) { const c = S.cad.filter((x) => x > 30); if (c.length) out.kadenz = Math.round(c.reduce((s, x) => s + x, 0) / c.length); }
  if (S.temp) { const c = S.temp.filter((x) => x != null); if (c.length) out.temp = Math.round(c.reduce((s, x) => s + x, 0) / c.length); }

  // Einordnung und Befund
  const lang = T >= 90 * 60, renntempo = hasP && out.if >= a.rad_if_min - 0.03 && out.if <= a.rad_if_max + 0.03 && out.vi <= 1.06 && lang;
  // Lauf: Puls entscheidet, schnelles Tempo zählt nur mit erhöhtem Puls (GPS-Ausreißer, Gefälle)
  const quali = fz[2] >= 0.08 || (hasP && ueberFtp >= 8 * 60) || (sport === 'lauf' && schnell >= 8 * 60 && (!hasHr || fz[1] + fz[2] >= 0.25));
  let typ;
  if (quali) typ = 'qualitaet';
  else if (renntempo) typ = 'renntempo';
  else if (fz[1] >= 0.35) typ = 'grauzone';
  else if (fz[0] >= 0.75) typ = 'locker';
  else typ = 'gemischt';
  const ego = typ === 'locker' && (hz[2] >= 120 || (hasP && spitzen >= 60) || (sport === 'lauf' && schnell >= 120));
  const dec = out.decoupling_pct, decTxt = dec == null ? '' : ' Decoupling ' + (dec <= 0 ? '≤ 0' : f(dec)) + ' %' + (dec < 5 ? ' – stabil.' : dec < 8 ? ' – erhöht.' : ' – hoch: Puls driftet deutlich.');
  let ton = 'gut', titel, text;
  if (typ === 'qualitaet') { titel = 'Qualitätseinheit'; text = hasP ? out.ueber_ftp_min + ' min über FTP, IF ' + f(out.if, 2) + ', ' + out.tss + ' TSS.' : [out.schnell_min ? out.schnell_min + ' min schneller als VT2-Tempo' : '', out.puls_vt2_min ? 'Puls ' + out.puls_vt2_min + ' min über VT2' : '', out.z2_min ? out.z2_min + ' min zwischen VT1 und VT2' : ''].filter(Boolean).slice(0, 2).join(', ') + '.'; }
  else if (typ === 'renntempo') { titel = 'Langdistanz-Renntempo'; text = 'IF ' + f(out.if, 2) + ', VI ' + f(out.vi, 2) + ' – im Korridor ' + Math.round(a.rad_if_min * 100) + '–' + Math.round(a.rad_if_max * 100) + ' %.' + decTxt; }
  else if (typ === 'grauzone') { ton = 'achtung'; titel = 'Grauzone'; text = out.z2_pct + ' % der Zeit ' + (hasP ? 'zwischen 76 und 100 % FTP' : 'zwischen VT1 und VT2') + ' – zu hart für Grundlage, zu locker für einen Intervallreiz.' + decTxt; }
  else if (ego) { ton = 'achtung'; titel = 'Locker mit Spitzen'; text = out.z1_pct + ' % unter VT1, aber ' + (sport === 'lauf' && schnell >= 120 ? out.schnell_min + ' min schneller als VT2-Tempo' : hasP && spitzen >= 60 ? Math.round(spitzen / 60) + ' min über 120 % FTP' : out.puls_vt2_min + ' min Puls über VT2') + '. Solche Spitzen kosten Erholung, ohne einen echten Reiz zu setzen.' + decTxt; }
  else if (typ === 'locker') { titel = hasP ? 'Locker – ruhig getreten' : 'Locker – sauber unter VT1'; text = out.z1_pct + ' % der Zeit ' + (hasP ? 'unter 76 % FTP.' : 'unter VT1.') + decTxt; }
  else { ton = 'neutral'; titel = 'Gemischt'; text = out.z1_pct + ' % locker, ' + out.z2_pct + ' % zwischen den Schwellen, ' + out.z3_pct + ' % darüber.' + decTxt; }
  if (dec != null && dec >= 8 && (typ === 'locker' || typ === 'renntempo')) ton = 'achtung';
  Object.assign(out, { typ, ego, ton, titel, text });

  // Verlauf für das Diagramm: höchstens 240 Punkte
  const step = Math.max(15, Math.ceil(T / 240));
  const serie = { m: [], p: [], hr: [], v: [] };
  let c = 0, sp = 0, sh = 0, sv = 0, w = 0, wh = 0, start = 0;
  for (let i = 0; i < n; i++) {
    const d = dt[i]; if (!d) continue;
    sp += (S.p && S.p[i] != null ? S.p[i] : 0) * d; sv += (S.v && S.v[i] != null ? S.v[i] : 0) * d; w += d;
    if (S.hr && S.hr[i] > 60) { sh += S.hr[i] * d; wh += d; }
    c += d;
    if (c - start >= step || i === n - 1) {
      serie.m.push(r1((start + (c - start) / 2) / 60, 1)); serie.p.push(hasP ? Math.round(sp / w) : null); serie.hr.push(wh ? Math.round(sh / wh) : null); serie.v.push(S.v ? r1(sv / w, 2) : null);
      start = c; sp = 0; sh = 0; sv = 0; w = 0; wh = 0;
    }
  }
  return { analyse: out, serie };
}

// Ändern sich Schwellen oder FTP, werden Auswertungen nach und nach neu berechnet
const profilKey = (a) => [a.ftp_ref_w, a.vt1_hf, a.vt2_hf, a.vt2_pace_s_km, a.rad_if_min, a.rad_if_max].join('|');

module.exports = { analysiere, SPORT, VERSION, profilKey };
