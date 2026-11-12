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
    kopfzeile(c, 'Dreiklang · ' + (RN.distListe && RN.distListe(r).length > 1 ? RN.distText(r) : RN.SERIE[r.serie].name) + ' · ' + RN.MON[r.mon]);
    let y = titel(c, r.name, 300, 96);
    c.fillStyle = LEISE; c.font = schrift(38); c.fillText(RN.titelLand(r), M0, y + 70);
    const d = RN.distanzen(r), km = (x) => nf(x, x % 1 ? 1 : 0), ca = r.geschaetzt ? 'ca. ' : ''; // Version 26: auch Rennen ohne Teilnehmerzahl, mit geschätzten Höhenmetern
    const z = d.tri ? [[km(d.swim), 'km Schwimmen'], [km(d.rad), 'km Rad · ' + ca + nf(r.hmRad) + ' hm'], [km(d.lauf), 'km Laufen']] : [[km(d.lauf), 'km'], [nf(r.hmLauf), r.geschaetzt ? 'Höhenmeter ca.' : 'Höhenmeter']].concat(r.n ? [[r.n >= 1000 ? Math.round(r.n / 1000) + 'k' : nf(r.n), 'Teilnehmer ca.']] : []);
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
      const AN = r.geschaetzt ? [] : sicher(() => RN.anstiege(P, d.tri ? (d.rad >= 150 ? 60 : 40) : 15)) || []; // Version 26: geschätzte Profile ohne Anstiege
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
  /* ---------- Version 29: Bericht als PDF (A4) ----------
     Jede Seite wird auf Canvas gezeichnet (Plus Jakarta Sans, helles Papier) und als JPEG in ein PDF gelegt – ohne
     Bibliothek und ohne Server: Das PDF entsteht auf dem Gerät und verlässt es nur, wenn du es teilst. */
  const A4 = { w: 1240, h: 1754, m: 100 }; // 150 dpi
  const PAP = { ink: '#0e1c27', leise: 'rgba(14,28,39,0.62)', linie: 'rgba(14,28,39,0.12)', flaeche: 'rgba(14,28,39,0.045)', pink: '#d83995', gruen: '#2fb350', gelb: '#e8a400', rot: '#e5484d', grau: '#b8bec5',
    mint: '#00b4a6', orange: '#ff9500', blue: '#0593c6', purple: '#ab4cc8', teal: '#0fa39c', gray: '#8e8e93' };
  function pdfAus(seiten) { // seiten: [{ bytes, w, h }] → PDF 1.4 mit je einem JPEG pro Seite
    const enc = new TextEncoder(), teile = [], off = []; let len = 0;
    const add = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; teile.push(b); len += b.length; };
    const obj = (n, f) => { off[n] = len; add(n + ' 0 obj\n'); f(); add('\nendobj\n'); };
    add('%PDF-1.4\n%âãÏÓ\n');
    const n = seiten.length, info = 3 + 3 * n;
    obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => add('<< /Type /Pages /Kids [' + seiten.map((_, i) => 3 + 3 * i + ' 0 R').join(' ') + '] /Count ' + n + ' >>'));
    seiten.forEach((j, i) => {
      const pg = 3 + 3 * i, inh = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
      obj(pg, () => add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ' + (pg + 2) + ' 0 R >> >> /Contents ' + (pg + 1) + ' 0 R >>'));
      obj(pg + 1, () => { add('<< /Length ' + inh.length + ' >>\nstream\n'); add(inh); add('\nendstream'); });
      obj(pg + 2, () => { add('<< /Type /XObject /Subtype /Image /Width ' + j.w + ' /Height ' + j.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + j.bytes.length + ' >>\nstream\n'); add(j.bytes); add('\nendstream'); });
    });
    obj(info, () => add('<< /Producer (Dreiklang) /Title (Dreiklang Bericht) >>'));
    const xref = len;
    add('xref\n0 ' + (info + 1) + '\n0000000000 65535 f \n');
    for (let k = 1; k <= info; k++) add(String(off[k]).padStart(10, '0') + ' 00000 n \n');
    add('trailer\n<< /Size ' + (info + 1) + ' /Root 1 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    const out = new Uint8Array(len); let o = 0; teile.forEach((b) => { out.set(b, o); o += b.length; });
    return out;
  }
  async function berichtSeiten(B) {
    await schriften();
    const W2 = A4.w, H2 = A4.h, M = A4.m, seiten = [];
    let c = null, y = 0;
    const hm2 = (min) => Math.floor(min / 60) + ':' + String(Math.round(min % 60)).padStart(2, '0');
    const dk = (d) => +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.';
    const neu = () => {
      const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2; c = cv.getContext('2d');
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W2, H2); c.textBaseline = 'alphabetic';
      seiten.push(cv); y = M;
      if (seiten.length > 1) { c.fillStyle = PAP.leise; c.font = schrift(22, 500); c.fillText('Dreiklang · ' + B.Z.titel, M, y); y += 48; }
    };
    const platz = (h) => { if (y + h > H2 - M - 60) neu(); };
    const text = (t, px, farbe, w, x0) => { // ein Absatz bleibt auf einer Seite
      const x = M + (x0 || 0); c.font = schrift(px, w || 400); const Z = umbrechen(c, t, W2 - M - x);
      platz(Z.length * px * 1.45 + 8); c.font = schrift(px, w || 400); c.fillStyle = farbe || PAP.ink;
      Z.forEach((z) => { c.fillText(z, x, y + px); y += px * 1.45; });
    };
    const ueber = (t) => { platz(110); y += 28; c.fillStyle = PAP.linie; c.fillRect(M, y, W2 - 2 * M, 2); y += 46; c.fillStyle = PAP.ink; c.font = schrift(34, 500); c.fillText(t, M, y); y += 30; };
    const kacheln = (L) => { // bis zu vier Zahlen nebeneinander
      platz(150); const n = L.length, g = 24, bw = (W2 - 2 * M - g * (n - 1)) / n;
      L.forEach((k, i) => {
        const x = M + i * (bw + g); c.fillStyle = PAP.flaeche; c.beginPath(); if (c.roundRect) c.roundRect(x, y, bw, 132, 18); else c.rect(x, y, bw, 132); c.fill();
        c.fillStyle = PAP.leise; c.font = schrift(22, 500); c.fillText(k[0], x + 22, y + 38);
        c.fillStyle = PAP.ink; c.font = schrift(44, 500); c.fillText(k[1], x + 22, y + 90);
        if (k[2]) { c.fillStyle = PAP.leise; c.font = schrift(19); const t = umbrechen(c, k[2], bw - 40)[0] || ''; c.fillText(t, x + 22, y + 118); }
      });
      y += 156;
    };
    // Kopf
    neu();
    c.fillStyle = PAP.pink; c.beginPath(); c.arc(M + 9, y + 2, 9, 0, 2 * Math.PI); c.fill();
    c.fillStyle = PAP.leise; c.font = schrift(24, 500); c.fillText('Dreiklang · Bericht', M + 30, y + 10); y += 70;
    c.fillStyle = PAP.ink; c.font = schrift(64, 500); c.fillText(B.Z.titel, M, y + 30); y += 70;
    c.fillStyle = PAP.leise; c.font = schrift(28); c.fillText(B.Z.spanne + (B.Z.fertig ? '' : ' · läuft noch, Vergleich bis zum selben Tag'), M, y + 10); y += 40;
    // Zusammenfassung
    y += 20; B.saetze.forEach((t) => { platz(48); c.fillStyle = PAP.pink; c.beginPath(); c.arc(M + 6, y + 19, 5, 0, 2 * Math.PI); c.fill(); text(t, 28, PAP.ink, 400, 28); y += 6; });
    // Training
    const t = B.training;
    ueber('Training'); y += 14;
    kacheln([['Training', hm2(t.min) + ' h', t.minVor || t.nVor ? (t.min - t.minVor >= 0 ? '+' : '−') + hm2(Math.abs(t.min - t.minVor)) + ' h zu ' + B.Z.vorName : ''], ['Einheiten', String(t.n), t.nVor ? t.nVor + ' ' + (B.Z.art === 'woche' ? 'in der Vorwoche' : 'im Vormonat') : ''], ['Belastung', nf(t.tss) + ' TSS', t.tssVor ? nf(t.tssVor) + ' davor' : ''], B.plan ? ['Plan erledigt', Math.round((100 * B.plan[1]) / B.plan[0]) + ' %', B.plan[1] + ' von ' + B.plan[0]] : ['Check-ins', String(B.erholung.checkins), 'an ' + B.erholung.tageN + ' Tagen']]);
    if (t.je.length) {
      const max = Math.max(...t.je.map((x) => x.min)), bx = M + 220, bw = W2 - 2 * M - 220 - 120;
      t.je.forEach((x) => { platz(46); c.fillStyle = PAP.ink; c.font = schrift(24, 500); c.fillText(x.name, M, y + 26); c.fillStyle = PAP.flaeche; c.fillRect(bx, y + 8, bw, 22); c.fillStyle = PAP[x.farbe] || PAP.gray; c.fillRect(bx, y + 8, Math.max(4, (bw * x.min) / max), 22); c.fillStyle = PAP.ink; c.font = schrift(24, 500); c.textAlign = 'right'; c.fillText(hm2(x.min) + ' h', W2 - M, y + 26); c.textAlign = 'left'; y += 44; });
    }
    // Erholung
    const E = B.erholung;
    ueber('Erholung'); y += 14;
    platz(120); const n = E.tage.length, g = n > 10 ? 4 : 10, bw = (W2 - 2 * M - g * (n - 1)) / n;
    E.tage.forEach((d, i) => { const x = M + i * (bw + g); c.fillStyle = d.kuenftig ? PAP.flaeche : d.ampel === 'gruen' ? PAP.gruen : d.ampel === 'gelb' ? PAP.gelb : d.ampel === 'rot' ? PAP.rot : PAP.grau; c.fillRect(x, y, bw, 40); if (n <= 10) { c.fillStyle = PAP.leise; c.font = schrift(20); c.textAlign = 'center'; c.fillText(dk(d.d), x + bw / 2, y + 68); c.textAlign = 'left'; } });
    y += n <= 10 ? 96 : 64;
    c.fillStyle = PAP.leise; c.font = schrift(20); c.fillText('Tune je Tag: grün ab 67, gelb 34–66, rot unter 34, grau ohne Daten', M, y - 12); y += 16;
    kacheln([['Tune Ø', E.tune != null ? String(Math.round(E.tune)) : '–', E.n ? E.gruen + ' grün · ' + E.gelb + ' gelb · ' + E.rot + ' rot' : 'keine Werte'], ['HRV Ø', E.hrv != null ? Math.round(E.hrv) + ' ms' : '–', E.hrvLo != null ? 'Normal ' + E.hrvLo + '–' + E.hrvHi : ''], ['Ruhepuls Ø', E.rhr != null ? Math.round(E.rhr) + ' bpm' : '–', E.rhrLo != null ? 'Normal ' + Math.round(E.rhrLo) + '–' + Math.round(E.rhrHi) : ''], ['Schlaf Ø', E.schlaf != null ? hm2(E.schlaf * 60) + ' h' : '–', E.bedarf != null ? 'Bedarf ' + hm2(E.bedarf * 60) + ' h' : '']]);
    // Form und Bestwerte
    const F = B.form;
    if (F) { ueber('Form'); y += 14; kacheln([['Fitness (CTL)', F.ctl0 != null ? nf(F.ctl0, 0) + ' → ' + nf(F.ctl1, 0) : nf(F.ctl1, 0), F.ctl0 != null ? (F.ctl1 - F.ctl0 >= 0 ? '+' : '−') + nf(Math.abs(F.ctl1 - F.ctl0), 1) + ' im Zeitraum' : ''], ['Form (TSB)', (F.tsb >= 0 ? '+' : '−') + nf(Math.abs(F.tsb), 0), 'am ' + dk(B.Z.bis)]]); }
    ueber('Neue Bestwerte'); y += 10;
    if (B.best.length) B.best.forEach((x) => { platz(60); c.fillStyle = PAP.ink; c.font = schrift(26, 500); c.fillText(x.name + ': ' + x.wert, M, y + 30); c.fillStyle = PAP.leise; c.font = schrift(22); c.fillText(x.art + ' · ' + dk(x.datum), M, y + 60); y += 76; });
    else text('Diesmal keine – gezählt werden Läufe ab 5 km, die besten 5, 20 und 60 Minuten auf dem Rad und 400 m im Wasser.', 24, PAP.leise);
    // Datenlage und Hinweis
    ueber('Datenlage'); y += 10;
    text((B.lage ? B.lage + '. ' : '') + 'Tune ist eine Einordnung deiner Erholung gegen dein eigenes Normal, keine medizinische Aussage.', 24, PAP.leise);
    // Fußzeilen mit Seitenzahl
    seiten.forEach((cv, i) => { const x = cv.getContext('2d'); x.fillStyle = PAP.linie; x.fillRect(M, H2 - M + 10, W2 - 2 * M, 2); x.fillStyle = PAP.leise; x.font = schrift(20); x.fillText('Erstellt am ' + dk(B.erstellt) + B.erstellt.slice(0, 4) + ' mit Dreiklang', M, H2 - M + 46); x.textAlign = 'right'; x.fillText('Seite ' + (i + 1) + ' von ' + seiten.length, W2 - M, H2 - M + 46); x.textAlign = 'left'; });
    return seiten;
  }
  async function berichtPdf(B) {
    const titelText = B.Z.titel + ' als PDF';
    const box = el('div', { class: 'tf-mk tf-poster' }, el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: titelText }), el('p', { class: 'tf-rm-sub', text: 'Wird erstellt …' }));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
    let seiten, bytes, vorschau;
    try {
      seiten = await berichtSeiten(B);
      const jp = await Promise.all(seiten.map((cv) => new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.9))));
      if (jp.some((b) => !b)) throw new Error('JPEG');
      bytes = pdfAus(await Promise.all(jp.map(async (b) => ({ bytes: new Uint8Array(await b.arrayBuffer()), w: A4.w, h: A4.h }))));
      vorschau = URL.createObjectURL(jp[0]);
    } catch (e) { console.error(e); box.lastChild.textContent = 'Das PDF ließ sich auf diesem Gerät nicht erstellen.'; return null; }
    const name = 'dreiklang-' + slug(B.Z.titel) + '.pdf', blob = new Blob([bytes], { type: 'application/pdf' }), url = URL.createObjectURL(blob);
    const datei = typeof File === 'function' ? new File([blob], name, { type: 'application/pdf' }) : null;
    const teilenOk = !!(datei && navigator.canShare && navigator.canShare({ files: [datei] }));
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'pdf-sichern' }, svgIco(teilenOk ? 'i-share' : 'i-download'), teilenOk ? ' Teilen oder sichern' : ' PDF speichern');
    los.addEventListener('click', async () => {
      if (teilenOk) { try { await navigator.share({ files: [datei], title: B.Z.titel }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = el('a', { href: url, download: name, style: 'display:none' }); document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
    });
    const zu = el('button', { type: 'button', class: 'tf-btn' }, 'Schließen'); zu.addEventListener('click', () => { URL.revokeObjectURL(url); URL.revokeObjectURL(vorschau); tfWissen.schliessen(); });
    box.replaceChildren(el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: titelText }),
      el('img', { class: 'tf-poster-bild tf-pdf-bild', src: vorschau, alt: 'Erste Seite des Berichts', width: 248, height: 351 }),
      el('p', { class: 'tf-rm-sub', text: 'A4, ' + seiten.length + (seiten.length === 1 ? ' Seite' : ' Seiten') + ' · ' + Math.max(1, Math.round(bytes.length / 1024)) + ' KB. Das PDF entsteht auf deinem Gerät – es verlässt es nur, wenn du es teilst.' }),
      el('div', { class: 'tf-form-actions' }, los, zu));
    return { seiten: seiten.length, bytes: bytes.length, name };
  }
  window.tfTeilen = { tune, einheit, rennen, buehne, berichtPdf, pdfAus }; // Version 29: Bericht als PDF
})();
