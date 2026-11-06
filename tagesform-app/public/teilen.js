/* Dreiklang · Teilen (Version 20)
   Bilder zum Teilen im Hochformat 1080 × 1350 (Instagram, WhatsApp, Nachrichten): dein Tune mit den letzten 14 Tagen,
   eine Einheit mit ihrer Form, eine Strecke mit Höhenprofil. Gezeichnet auf Canvas im Look der Bühne (wie das Rückblick-Poster),
   geteilt über die Teilen-Funktion des Geräts – oder als Bild gespeichert. Es verlässt nur das Bild das Gerät, keine Daten. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, nf, rowsOf, svgIco, localDate } = T.ui;
  const W = 1080, H = 1350, M0 = 96, WEISS = '#FCFFFF', LEISE = 'rgba(252,255,255,0.72)', PINK = '#ff5cb8';
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const schrift = (px, w) => (w || 400) + ' ' + px + 'px "Plus Jakarta Sans", system-ui, sans-serif';
  async function schriften() { try { await Promise.all([document.fonts.load('400 120px "Plus Jakarta Sans"'), document.fonts.load('500 60px "Plus Jakarta Sans"')]); } catch (e) { /* Ersatzschrift */ } }
  function umbrechen(c, text, breite) {
    const out = []; let zeile = '';
    String(text || '').split(/\s+/).forEach((w) => { const t = zeile ? zeile + ' ' + w : w; if (c.measureText(t).width > breite && zeile) { out.push(zeile); zeile = w; } else zeile = t; });
    if (zeile) out.push(zeile);
    return out;
  }
  /* Die Bühne: Tiefe, Wasser, ein Licht – drei Stimmungen */
  function buehne(c, art) {
    const g = c.createLinearGradient(0, 0, W * 0.35, H);
    if (art === 'pink') { g.addColorStop(0, '#071b2b'); g.addColorStop(0.45, '#0a5f86'); g.addColorStop(0.78, '#0593C6'); g.addColorStop(1, '#3a2f6b'); }
    else if (art === 'daemmer') { g.addColorStop(0, '#0b1420'); g.addColorStop(0.5, '#1d2b4a'); g.addColorStop(1, '#4a2f5f'); }
    else { g.addColorStop(0, '#061522'); g.addColorStop(0.5, '#0b4466'); g.addColorStop(1, '#0a2a3f'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const glow = (x, y, r, farbe) => { const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, farbe); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H); };
    if (art === 'pink') { glow(W * 0.92, H * 0.86, 820, 'rgba(216,57,149,0.78)'); glow(W * 0.08, H * 0.18, 620, 'rgba(5,147,198,0.55)'); }
    else if (art === 'daemmer') { glow(W * 0.85, H * 0.12, 700, 'rgba(255,150,90,0.35)'); glow(W * 0.1, H * 0.9, 700, 'rgba(90,110,220,0.35)'); }
    else { glow(W * 0.9, H * 0.15, 700, 'rgba(5,147,198,0.6)'); glow(W * 0.15, H * 0.95, 760, 'rgba(216,57,149,0.35)'); }
    glow(W * 0.6, H * 0.5, 520, 'rgba(252,255,255,0.08)');
    const blur = 'filter' in c;
    for (let i = 0; i < 9; i++) { const y = 260 + i * 170 + (i % 3) * 23; if (blur) c.filter = 'blur(' + (14 + (i % 4) * 6) + 'px)'; c.fillStyle = 'rgba(252,255,255,' + (0.05 + (i % 3) * 0.025) + ')'; c.fillRect(-60, y, W + 120, 18 + (i % 2) * 22); }
    if (blur) c.filter = 'none';
    const img = c.getImageData(0, 0, W, H), d = img.data;
    let z = 1234567; const zuf = () => { z = (z * 1103515245 + 12345) & 0x7fffffff; return z / 0x7fffffff; };
    for (let i = 0; i < d.length; i += 4) { const n = (zuf() - 0.5) * 24; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    c.putImageData(img, 0, 0);
  }
  function kopfzeile(c, text) { c.fillStyle = LEISE; c.font = schrift(30, 500); c.textBaseline = 'alphabetic'; c.fillText(text, M0, 150); }
  function fusszeile(c, text) {
    c.fillStyle = 'rgba(252,255,255,0.22)'; c.fillRect(M0, H - 168, W - 2 * M0, 2);
    c.fillStyle = LEISE; c.font = schrift(28, 500); c.fillText(text || 'Dreiklang · Fortschritt aus ruhigen, regelmäßigen Tagen', M0, H - 120);
    // Marke rechts: Ring und Punkt
    c.strokeStyle = '#4fc3ea'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(W - M0 - 22, H - 130, 16, 0.75 * Math.PI, 2.05 * Math.PI); c.stroke();
    c.fillStyle = PINK; c.beginPath(); c.arc(W - M0 - 22, H - 130, 5, 0, 2 * Math.PI); c.fill();
  }
  const sperren = (c, px) => { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; };
  function titel(c, text, y, px) { c.fillStyle = WEISS; c.font = schrift(px || 96); sperren(c, -(px || 96) / 32); const Z = umbrechen(c, text, W - 2 * M0).slice(0, 2); Z.forEach((t, i) => c.fillText(t, M0, y + i * (px || 96) * 1.08)); sperren(c, 0); return y + (Z.length - 1) * (px || 96) * 1.08; }
  function faden(c, y) { // Saisonfaden wie auf Heute
    const sz = (rowsOf('saison') || [])[0]; if (!sz || !sz.ziel_id || !Array.isArray(sz.phasen) || !sz.phasen.length) return y;
    const P0 = sz.phasen.filter((p) => p.id !== 'uebergang'), t0 = Date.parse(P0[0].von), t1 = Date.parse(P0[P0.length - 1].bis) + 864e5, x0 = M0, x1 = W - M0 - 40;
    const xs = (t) => x0 + ((x1 - x0) * (t - t0)) / Math.max(1, t1 - t0);
    const OP = { vorbereitung: .25, grundlage: .4, aufbau: .55, spitze: .7, taper: .8, rennwoche: .9, rennen: 1 };
    c.lineCap = 'round';
    P0.forEach((p) => { const a = xs(Date.parse(p.von)), b = xs(Date.parse(p.bis) + 864e5); c.strokeStyle = 'rgba(252,255,255,' + (OP[p.id] || .4) + ')'; c.lineWidth = p.id === sz.phase ? 8 : 5; c.beginPath(); c.moveTo(a + 3, y); c.lineTo(Math.max(a + 3, b - 3), y); c.stroke(); });
    const xh = Math.max(x0, Math.min(x1, xs(Date.parse(localDate()))));
    c.fillStyle = PINK; c.beginPath(); c.arc(xh, y, 14, 0, 2 * Math.PI); c.fill(); c.strokeStyle = WEISS; c.lineWidth = 4; c.stroke();
    c.strokeStyle = WEISS; c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x1 + 18, y - 22); c.lineTo(x1 + 18, y + 22); c.moveTo(x1 + 18, y - 22); c.lineTo(x1 + 44, y - 22); c.lineTo(x1 + 37, y - 12); c.lineTo(x1 + 44, y - 2); c.lineTo(x1 + 18, y - 2); c.stroke();
    c.fillStyle = WEISS; c.font = schrift(38, 500); c.fillText(sz.ziel_tage === 0 ? 'Heute: ' + sz.ziel_name : sz.ziel_name + ' in ' + nf(sz.ziel_tage) + (sz.ziel_tage === 1 ? ' Tag' : ' Tagen'), M0, y + 72);
    c.fillStyle = LEISE; c.font = schrift(30); c.fillText((sz.phase_txt || '') + (sz.phase_sub && !/Trage|Lege/.test(sz.phase_sub) ? ' · ' + sz.phase_sub : ''), M0, y + 118);
    return y + 150;
  }
  /* ---------- Karte 1: Tune ---------- */
  async function tuneMalen() {
    await schriften();
    const Hh = (rowsOf('heute') || [])[0]; if (!Hh) return null;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    buehne(c, 'pink'); kopfzeile(c, 'Dreiklang · ' + (Hh.titel_datum || Hh.datum || ''));
    const label = Hh.label || 'Tune', score = Hh.score != null ? String(Hh.score) : null;
    c.fillStyle = LEISE; c.font = schrift(34, 500); c.fillText('Mein Tune heute', M0, 300);
    if (score) { c.fillStyle = WEISS; c.font = schrift(400); sperren(c, -16); c.fillText(score, M0 - 16, 620); const bw = c.measureText(score).width; sperren(c, 0); c.font = schrift(80); c.fillStyle = LEISE; c.fillText('%', M0 + bw + 4, 620); }
    let y = titel(c, label, score ? 780 : 460, 84);
    // Empfehlung aus dem Satz
    const emp = /Empfehlung:\s*(.+?)\.?$/.exec(Hh.satz || ''); if (emp) { c.fillStyle = LEISE; c.font = schrift(38); umbrechen(c, emp[1], W - 2 * M0).slice(0, 1).forEach((t) => c.fillText(t, M0, y + 66)); }
    // 14 Tage als Punkte
    const R = window.tfRueckblick && tfRueckblick.reihen ? sicher(() => tfRueckblick.reihen()) : null;
    if (R && R.einheiten) {
      const h = localDate(), min = new Map(); R.einheiten.forEach((e) => min.set(e.date, (min.get(e.date) || 0) + e.min));
      const P = []; for (let i = 13; i >= 0; i--) { const d = new Date(Date.parse(h) - i * 864e5).toISOString().slice(0, 10); P.push([d, (min.get(d) || 0) >= 10]); }
      const n = P.filter((x) => x[1]).length, y0 = 962;
      c.fillStyle = LEISE; c.font = schrift(28, 500); c.fillText('Letzte 14 Tage · ' + n + ' von 14 mit Training', M0, y0 - 40);
      P.forEach(([d, an], i) => { const x = M0 + 18 + i * 56 + (i >= 7 ? 24 : 0); if (an) { c.fillStyle = d === h ? PINK : WEISS; c.beginPath(); c.arc(x, y0, 15, 0, 2 * Math.PI); c.fill(); } else { c.strokeStyle = d === h ? PINK : 'rgba(252,255,255,0.55)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y0, 13, 0, 2 * Math.PI); c.stroke(); } });
    }
    faden(c, 1032);
    fusszeile(c);
    return cv;
  }
  /* ---------- Karte 2: Einheit mit Form ---------- */
  async function einheitMalen(s, D, datum) {
    await schriften();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    buehne(c, 'daemmer');
    const dd = datum ? new Date(datum + 'T12:00:00Z') : null, TAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    kopfzeile(c, 'Dreiklang · ' + (dd ? TAG[dd.getUTCDay()] + ', ' + dd.getUTCDate() + '. ' + MON[dd.getUTCMonth()] : 'Meine Einheit'));
    const SPN = { laufen: 'Laufen', rad: 'Rad', schwimmen: 'Schwimmen', kraft: 'Kraft', mobil: 'Pilates & Yoga' };
    const artName = { locker: 'locker', mittel: 'zügig', schwelle: 'Schwelle', sweetspot: 'Sweet Spot', hart: 'hart', renn: 'Renntempo', test: 'Test' }[D.art] || '';
    c.fillStyle = LEISE; c.font = schrift(34, 500); c.fillText((SPN[s.sport] || 'Einheit') + (artName && !new RegExp(artName, 'i').test(D.titel || '') ? ' · ' + artName : ''), M0, 300);
    let y = titel(c, D.titel || 'Einheit', 410, 92);
    const gross = s.sport === 'schwimmen' && D.km ? [nf(D.km), 'm'] : [String(s.min), 'min'];
    c.fillStyle = WEISS; c.font = schrift(260); sperren(c, -10); c.fillText(gross[0], M0 - 10, y + 330); const bw = c.measureText(gross[0]).width; sperren(c, 0); c.font = schrift(64); c.fillStyle = LEISE; c.fillText(gross[1], M0 + bw + 16, y + 330);
    // Form
    const RF = window.tfPlan && tfPlan.profil ? sicher(() => tfPlan.profil(s, D)) : null, y0 = y + 420, hF = 180;
    if (RF && RF.length >= 2) {
      const gesamt = RF.reduce((x, r) => x + r.min, 0) || 1, breite = W - 2 * M0; let x = M0;
      RF.forEach((r) => { const w = (breite * r.min) / gesamt, hh = Math.max(8, hF * r.h); c.fillStyle = r.hoch ? PINK : 'rgba(252,255,255,0.45)'; c.beginPath(); c.roundRect ? c.roundRect(x + 2, y0 + hF - hh, Math.max(2, w - 4), hh, 4) : c.rect(x + 2, y0 + hF - hh, Math.max(2, w - 4), hh); c.fill(); x += w; });
      c.fillStyle = 'rgba(252,255,255,0.3)'; c.fillRect(M0, y0 + hF + 2, breite, 2);
      c.fillStyle = LEISE; c.font = schrift(26, 500); c.fillText('Form der Einheit · Breite ist Zeit, Höhe ist Anstrengung', M0, y0 + hF + 48);
    } else {
      c.fillStyle = LEISE; c.font = schrift(34); (D.bau || []).slice(0, 3).forEach((t, i) => umbrechen(c, t, W - 2 * M0).slice(0, 1).forEach((z) => c.fillText('– ' + z, M0, y0 + 40 + i * 54)));
    }
    if (D.ziele && D.ziele.length) { c.fillStyle = WEISS; c.font = schrift(34, 500); c.fillText(D.ziele.join(' · ').slice(0, 60), M0, H - 230); }
    fusszeile(c);
    return cv;
  }
  /* ---------- Karte 3: Strecke mit Höhenprofil ---------- */
  async function rennenMalen(r) {
    await schriften();
    const RN = window.tfRennen; if (!RN) return null;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const tags = r.tags || [];
    buehne(c, tags.includes('bergig') ? 'pink' : 'blau');
    const sz = sicher(() => RN.zielInfo()), zr = sz ? sicher(() => RN.zielStrecke(sz)) : null, istZiel = !!(zr && zr.id === r.id);
    kopfzeile(c, 'Dreiklang · ' + RN.SERIE[r.serie].name + ' · ' + RN.MON[r.mon]);
    let y = titel(c, r.name, 300, 96);
    c.fillStyle = LEISE; c.font = schrift(38); c.fillText(RN.titelLand(r), M0, y + 70);
    const d = RN.distanzen(r);
    const z = d.tri ? [[nf(d.swim, 1), 'km Schwimmen'], [nf(d.rad), 'km Rad · ' + nf(r.hmRad) + ' hm'], [nf(d.lauf, 1), 'km Laufen']] : [[nf(d.lauf, 1), 'km'], [nf(r.hmLauf), 'Höhenmeter'], [r.n >= 1000 ? Math.round(r.n / 1000) + 'k' : nf(r.n || 0), 'Teilnehmer ca.']];
    const sp = (W - 2 * M0) / 3, zy = y + 230;
    z.forEach(([g, k], i) => { const x = M0 + i * sp; if (i) { c.fillStyle = 'rgba(252,255,255,0.28)'; c.fillRect(x - 24, zy - 70, 2, 110); } c.fillStyle = WEISS; c.font = schrift(84); sperren(c, -2); c.fillText(g, x, zy); sperren(c, 0); c.fillStyle = LEISE; c.font = schrift(27, 500); c.fillText(k, x, zy + 40); });
    // Profil groß
    const P = d.tri ? RN.profil(r, 'rad') : RN.profil(r, 'lauf');
    if (P && P.pts && P.pts.length > 2) {
      const px0 = M0, px1 = W - M0, py0 = zy + 130, ph = 300, ys = P.pts.map((p) => p[1]), lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(P.D * 3.5, (hi - lo) * 1.15);
      const X = (km) => px0 + ((px1 - px0) * km) / P.D, Y = (m) => py0 + ph - ((ph - 20) * (m - lo + span * 0.08)) / span;
      c.beginPath(); c.moveTo(X(0), py0 + ph); P.pts.forEach((p) => c.lineTo(X(p[0]), Y(p[1]))); c.lineTo(X(P.D), py0 + ph); c.closePath();
      const g = c.createLinearGradient(0, py0, 0, py0 + ph); g.addColorStop(0, 'rgba(252,255,255,0.42)'); g.addColorStop(1, 'rgba(252,255,255,0.04)'); c.fillStyle = g; c.fill();
      c.beginPath(); P.pts.forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])))); c.strokeStyle = WEISS; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
      // Anstiege markieren
      const AN = sicher(() => RN.anstiege(P, d.tri ? (d.rad >= 150 ? 60 : 40) : 15)) || [];
      AN.slice(0, 5).forEach((a, i) => { const seg = P.pts.filter((p) => p[0] >= a.von && p[0] <= a.bis), top = Math.max(...seg.map((p) => p[1])), x = X((a.von + a.bis) / 2), yy = Y(top) - 26; c.fillStyle = PINK; c.beginPath(); c.arc(x, yy, 16, 0, 2 * Math.PI); c.fill(); c.fillStyle = WEISS; c.font = schrift(22, 500); c.textAlign = 'center'; c.fillText(String(i + 1), x, yy + 8); c.textAlign = 'left'; });
      c.fillStyle = 'rgba(252,255,255,0.3)'; c.fillRect(px0, py0 + ph + 2, px1 - px0, 2);
      c.fillStyle = LEISE; c.font = schrift(26, 500); c.fillText((d.tri ? 'Höhenprofil Rad' : 'Höhenprofil') + ' · ' + nf(P.D, P.D % 1 ? 1 : 0) + ' km · ' + nf(P.H) + ' Höhenmeter' + (AN.length ? ' · ' + AN.length + (AN.length === 1 ? ' Anstieg' : ' Anstiege') : '') + (P.art === 'schema' ? ' · schematisch' : ''), M0, py0 + ph + 48);
    }
    if (istZiel && sz) { c.fillStyle = WEISS; c.font = schrift(40, 500); c.fillText(sz.ziel_tage === 0 ? 'Heute ist Renntag' : 'Mein Ziel · in ' + nf(sz.ziel_tage) + (sz.ziel_tage === 1 ? ' Tag' : ' Tagen') + (sz.ziel_s ? ' · Zielzeit ' + T.ui.hms(sz.ziel_s) : ''), M0, H - 230); }
    fusszeile(c);
    return cv;
  }
  /* ---------- Blatt mit Vorschau, Teilen und Speichern ---------- */
  async function blatt(titelText, malen, dateiname) {
    const box = el('div', { class: 'tf-mk tf-poster' }, el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: titelText }), el('p', { class: 'tf-rm-sub', text: 'Wird erstellt …' }));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
    let cv; try { cv = await malen(); } catch (e) { console.error(e); cv = null; }
    if (!cv) { box.lastChild.textContent = 'Das Bild ließ sich auf diesem Gerät nicht erstellen.'; return; }
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.9));
    if (!blob) { box.lastChild.textContent = 'Das Bild ließ sich auf diesem Gerät nicht erstellen.'; return; }
    const url = URL.createObjectURL(blob), datei = typeof File === 'function' ? new File([blob], dateiname, { type: 'image/jpeg' }) : null;
    const teilenOk = !!(datei && navigator.canShare && navigator.canShare({ files: [datei] }));
    const teilen = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-share'), teilenOk ? ' Teilen' : ' Bild speichern');
    teilen.addEventListener('click', async () => {
      if (teilenOk) { try { await navigator.share({ files: [datei], title: titelText }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = el('a', { href: url, download: dateiname, style: 'display:none' }); document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
    });
    const zu = el('button', { type: 'button', class: 'tf-btn' }, 'Schließen'); zu.addEventListener('click', () => { URL.revokeObjectURL(url); tfWissen.schliessen(); });
    box.replaceChildren(el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: titelText }),
      el('img', { class: 'tf-poster-bild', src: url, alt: titelText, width: 270, height: 338 }),
      el('p', { class: 'tf-rm-sub', text: 'Hochformat 1080 × 1350 – passt in Instagram, WhatsApp und Nachrichten. Nur das Bild verlässt dein Gerät.' }),
      el('div', { class: 'tf-form-actions' }, teilen, zu));
  }
  const slug = (t) => String(t || 'bild').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function tune() { return blatt('Mein Tune als Bild', tuneMalen, 'dreiklang-tune-' + localDate() + '.jpg'); }
  function einheit(s, D, datum) { return blatt('Einheit als Bild', () => einheitMalen(s, D, datum), 'dreiklang-' + slug(D.titel) + (datum ? '-' + datum : '') + '.jpg'); }
  function rennen(r) { return blatt(r.name + ' als Bild', () => rennenMalen(r), 'dreiklang-' + slug(r.name) + '.jpg'); }
  // Heute: kleiner Teilen-Knopf neben den 14 Tagen
  T.zusatz('heute', () => sicher(() => {
    const box = $('#home-14'); if (!box || box.querySelector('.tf-14-teilen') || !box.childElementCount) return;
    const b = el('button', { type: 'button', class: 'tf-14-teilen', 'aria-label': 'Tune als Bild teilen', title: 'Als Bild teilen' }, svgIco('i-share'));
    b.addEventListener('click', tune); box.appendChild(b);
  }));
  window.tfTeilen = { tune, einheit, rennen, buehne };
})();
