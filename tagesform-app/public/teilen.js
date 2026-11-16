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
/* =====================================================================
   Version 59: Coach – Athlet und Coach in einer App
   Ein Athlet lädt seinen Coach ein (Profil → Coach) und bestimmt, was er sieht. Der Coach meldet sich mit seinem eigenen
   Konto an, wählt „Ich bin Coach“ und bekommt eine eigene Ansicht: den Überblick mit Analysen und Hinweisen, die Seiten
   Training, Rennen und Gesundheit seines Athleten (nur ansehen) und „Tipps“, die der Athlet oben auf Heute liest und
   beantwortet. Die Daten kommen schon gefiltert vom Server (nur, was freigegeben ist); hier wird nur angezeigt.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, nf, rowsOf, svgIco, localDate, ring, setMsg, AMPEL } = T.ui;
  const A = () => window.dash.app;
  const CO = () => (A() && A().coach) || null;
  const an = () => !!(CO() && CO().an());
  const lage = () => (CO() ? CO().lage() : { liste: [] });
  const sicher = (fn, d) => { try { return fn(); } catch (e) { console.error(e); return d === undefined ? null : d; } };
  const rel = (x) => (x ? A().relTime(typeof x === 'number' ? new Date(x).toISOString() : x) : '');
  const dm = (d) => (d ? +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.' : '');
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const tagTxt = (d) => WT[new Date(d + 'T12:00:00Z').getUTCDay()] + ', ' + dm(d);
  const tageBis = (d) => Math.round((Date.parse(String(d).slice(0, 10) + 'T12:00:00Z') - Date.parse(localDate() + 'T12:00:00Z')) / 864e5);
  const hmStd = (h) => { const m = Math.max(0, Math.round((+h || 0) * 60)); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const mmss = (s) => { const x = Math.round(+s || 0); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
  const hmSek = (s) => { const m = Math.round((+s || 0) / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const zahlFest = (t) => String(t || '').replace(/(\d) (?=(?:%|ms|bpm|h|km|min|W|TSS|g\/h|kg)(?![A-Za-zÄÖÜäöüß]))/g, '$1 ');
  const titelVon = (n) => (String(n || '').indexOf('@') > 0 ? kurzName(n) : String(n || '')); // eine E-Mail als Name: der Teil vor dem @
  const kurzName = (n) => { n = String(n || '').trim(); if (!n) return 'dein Athlet'; if (n.indexOf('@') > 0) n = n.split('@')[0]; const v = n.split(/[\s._-]+/)[0] || n; return v.charAt(0).toUpperCase() + v.slice(1); };
  const merkLesen = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const merkSchreiben = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nur Komfort */ } };
  const ART = { training: ['Training', 'i-bolt', 'orange'], erholung: ['Erholung', 'i-heart', 'pink'], rennen: ['Rennen', 'i-flag', 'blue'], technik: ['Technik', 'i-target', 'indigo'], allgemein: ['Allgemein', 'i-chat', 'gray'] };
  const artStil = (farbe) => '--c:var(--tf-' + farbe + ');--ct:var(--tf-' + farbe + '-t, var(--tf-fg))'; // Etikett: Fläche in der Farbe, Schrift in ihrer dunklen Textfarbe
  const RECHTE = [
    ['erholung', 'Erholung', 'Tune, HRV, Ruhepuls, Schlaf, Check-ins und Pause-Modus'],
    ['training', 'Training', 'Einheiten, Belastung, Zonen, Fueling und Schwimmtests'],
    ['plan', 'Plan & Rennen', 'Trainingsplan, Gym, Pilates & Yoga, Saison, Rennrechner und Material'],
    ['koerper', 'Körper & Ernährung', 'Gewichtsverlauf, Ernährung, „Heute notiert“ und Laborwerte'],
  ];
  const STANDARD = { erholung: true, training: true, plan: true, koerper: false };
  const TON = { kritisch: ['red', 'Wichtig'], achtung: ['orange', 'Im Blick behalten'], neutral: ['gray', 'Zur Info'], gut: ['green', 'Gut'] };
  const RANG = { kritisch: 0, achtung: 1, neutral: 2, gut: 3 };
  const sek = (titel, sub) => el('h2', { class: 'tf-hub-sek' }, titel, sub ? el('small', { text: sub }) : null);
  const punkt = (farbe) => el('i', { class: 'tf-co-dot', style: '--c:var(--tf-' + farbe + ')', 'aria-hidden': 'true' });
  function knopf(text, cls, fn, o) {
    const b = el('button', Object.assign({ type: 'button', class: 'tf-btn ' + (cls || '') }, o || {}), text);
    if (fn) b.addEventListener('click', fn);
    return b;
  }
  function linkKnopf(text, ziel, id) { const b = el('button', { type: 'button', class: 'tf-gym-link', id: id || null }, text, svgIco('i-chev')); b.addEventListener('click', () => T.geh(ziel)); return b; }
  // Zweistufig bestätigen, ohne Dialogfenster: erst „Beenden“, dann „Wirklich beenden?“
  function bestaetigen(text, frage, fn, o) {
    o = o || {};
    const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein tf-co-weg', id: o.id || null }, text);
    let scharf = false, uhr = null;
    b.addEventListener('click', async () => {
      if (!scharf) { scharf = true; b.textContent = frage; b.classList.add('scharf'); uhr = setTimeout(() => { scharf = false; b.textContent = text; b.classList.remove('scharf'); }, 5000); return; }
      clearTimeout(uhr); b.disabled = true;
      try { await fn(); } finally { b.disabled = false; }
    });
    return b;
  }
  function avatarVon(bild, name, gr) {
    const s = el('span', { class: 'tf-co-av', style: '--gr:' + (gr || 40) + 'px', 'aria-hidden': 'true' });
    s.appendChild(bild ? el('img', { src: bild, alt: '' }) : el('span', { text: (kurzName(name) || '?').charAt(0).toUpperCase() }));
    return s;
  }

  /* ---------- Tipps vorbereiten: ein Hinweis, eine Einheit oder die Woche → das Formular unter „Tipps“ ---------- */
  let ENTWURF = { art: 'training', text: '', bezug: null };
  function tippVorbereiten(o) {
    ENTWURF = { art: (o && o.art) || 'training', text: (o && o.text) || '', bezug: (o && o.bezug) || null };
    TD.neu = true;
    T.geh('tipps');
  }
  const tippKnopf = (o, text, id) => { const b = el('button', { type: 'button', class: 'tf-gym-link tf-co-tippk', id: id || null }, svgIco('i-chat'), text || 'Tipp schreiben'); b.addEventListener('click', () => tippVorbereiten(o)); return b; };

  /* ---------- Die Leiste oben: wessen Daten, nur ansehen ---------- */
  function leiste() {
    const box = $('#coach-leiste'); if (!box) return;
    if (!an()) { if (!box.hidden) { box.hidden = true; box.replaceChildren(); delete box.dataset.sig; } return; }
    const L = lage(), av = L.athlet ? A().state.avatar : null, name = L.athlet ? L.name : '';
    // ohne Athlet (keiner verbunden oder die Freigabe ist beendet) gibt es auf Training, Rennen und Gesundheit nichts zu sehen
    if (!L.athlet && A().state.status === 'ok' && ['training', 'rennen', 'gesundheit', 'heute'].includes((T.routeInfo(T.route()) || {}).bereich)) setTimeout(() => T.geh('coach', { tab: true, ersetzen: true }), 0);
    const sig = [L.athlet, name, av ? av.length : 0, L.liste.length].join('|');
    box.hidden = false;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    const wt = L.athlet ? (L.liste.length > 1 ? 'Wechseln' : 'Athleten') : 'Hinzufügen'; // am Handy nur der Pfeil (der Name braucht den Platz)
    const w = el('button', { type: 'button', class: 'tf-gym-link tf-co-l-w', id: 'coach-wechseln', 'aria-label': L.athlet ? (L.liste.length > 1 ? 'Athlet wechseln' : 'Deine Athleten') : 'Athlet hinzufügen' }, el('span', { class: 'tf-co-l-wt', text: wt }), svgIco('i-chev'));
    w.addEventListener('click', () => T.geh('coach/athleten'));
    box.replaceChildren(avatarVon(av, name || '?', 32),
      el('span', { class: 'tf-co-l-t' }, el('b', { text: L.athlet ? titelVon(name) : 'Coach-Ansicht' }), el('small', { text: L.athlet ? 'Coach · nur ansehen' : 'Noch kein Athlet verbunden' })), w);
  }

  /* =====================================================================
     Überblick (Coach)
     ===================================================================== */
  function naechstesRennen() {
    const h0 = localDate();
    return (rowsOf('wettkaempfe') || []).filter((w) => w && /^\d{4}-\d\d-\d\d$/.test(w.datum || '') && w.datum >= h0).sort((x, y) => (x.datum < y.datum ? -1 : 1))[0] || null;
  }
  // Was dem Coach auffallen sollte – in der dritten Person, mit Zahlen und einem Vorschlag für den Tipp
  function hinweise(vn) {
    const out = [], R = lage().rechte || {}, h0 = localDate();
    const add = (ton, id, titel, text, tipp) => out.push({ ton, id, titel, text, tipp });
    const E = rowsOf('erholung') || [], H = (rowsOf('heute') || [])[0] || null, P = rowsOf('pmc') || [], B = rowsOf('befinden') || [];
    if (R.erholung) {
      const letzte = E.length ? E[E.length - 1].date : null, alt = letzte ? -tageBis(letzte) : null;
      if (letzte && alt >= 2) add('achtung', 'daten', 'Seit ' + alt + ' Tagen keine Nachtdaten', 'Die letzte Nacht von ' + vn + ' bei Garmin ist vom ' + dm(letzte) + '. Ohne Uhr in der Nacht oder ohne Synchronisieren fehlen Tune, HRV und Schlaf.',
        { art: 'allgemein', text: 'Kurze Bitte: Trag die Uhr nachts und öffne morgens kurz Garmin Connect, damit deine Nachtwerte ankommen. Dann sehe ich deinen Tune und kann die Woche besser steuern.' });
      const T7 = E.filter((x) => x.date <= h0 && tageBis(x.date) > -7 && x.score != null);
      const rot = T7.filter((x) => x.ampel === 'rot').length, gelb = T7.filter((x) => x.ampel === 'gelb').length;
      if (rot >= 2) add('kritisch', 'tune', rot + ' rote Tage in einer Woche', 'Tune lag an ' + rot + ' der letzten ' + T7.length + ' Tage im roten Bereich. Der Körper meldet: Erholung vor Belastung.',
        { art: 'erholung', text: 'Dein Tune war diese Woche mehrmals rot. Lass uns die nächsten zwei Tage nur locker trainieren – unter VT1, ohne Intervalle – und dann gemeinsam neu schauen.' });
      else if (rot + gelb >= 4) add('achtung', 'tune', (rot + gelb) + ' gelbe oder rote Tage in einer Woche', 'Tune war an ' + (rot + gelb) + ' der letzten ' + T7.length + ' Tage nicht grün. Die Erholung hinkt der Belastung hinterher.',
        { art: 'erholung', text: 'Dein Tune war diese Woche oft gelb. Nimm bei der nächsten harten Einheit lieber eine Wiederholung weniger und achte auf früh ins Bett.' });
      const hv = [...E].reverse().find((x) => x.z_hrv7 != null && x.date <= h0);
      if (hv && hv.z_hrv7 <= -1) add(hv.z_hrv7 <= -1.5 ? 'kritisch' : 'achtung', 'hrv', 'HRV-Wochenschnitt unter der Basis', 'Der 7-Tage-Schnitt liegt bei ' + nf(hv.hrv7) + ' ms, die Basis bei ' + nf(hv.hrv_basis) + ' ms (' + nf(hv.z_hrv7, 1) + ' Streuungen). Ein Wochenschnitt so tief deutet auf Ermüdung, Stress oder einen Infekt.',
        { art: 'erholung', text: 'Deine HRV liegt seit ein paar Tagen unter deinem Normalbereich. Mach heute und morgen nur Lockeres und schlaf so viel du kannst. Wenn du dich krank fühlst: kein Training und ärztlich abklären lassen.' });
      const rp = [...E].reverse().find((x) => x.z_rhr7 != null && x.date <= h0);
      if (rp && rp.z_rhr7 >= 1) add('achtung', 'puls', 'Ruhepuls seit Tagen erhöht', 'Der 7-Tage-Schnitt liegt bei ' + nf(rp.rhr7, 1) + ' bpm, die Basis bei ' + nf(rp.rhr_basis, 1) + ' bpm. Ein erhöhter Ruhepuls zeigt oft Ermüdung, Hitze, Alkohol oder einen beginnenden Infekt.',
        { art: 'erholung', text: 'Dein Ruhepuls ist seit Tagen etwas höher als sonst. Wie fühlst du dich? Wenn sich etwas anbahnt, lieber einen Tag Pause als eine Woche krank.' });
      if (H && H.schuld7_h >= 5) add(H.schuld7_h >= 8 ? 'kritisch' : 'achtung', 'schlaf', 'Schlafschuld: ' + H.schuld7_hm + ' h in 7 Tagen', vn + ' hat in den letzten 7 Nächten zusammen ' + H.schuld7_hm + ' Stunden weniger geschlafen als gebraucht. Schlaf ist die Grundlage für jede Anpassung.',
        { art: 'erholung', text: 'Dir fehlen diese Woche einige Stunden Schlaf. Versuch die nächsten Abende 30 Minuten früher ins Bett zu gehen – das bringt mehr als jede zusätzliche Einheit.' });
      const ck = B.filter((b) => b.date <= h0 && -tageBis(b.date) <= 3 && (b.krank || b.schmerz >= 3)).pop();
      if (ck) add(ck.krank || ck.schmerz >= 5 ? 'kritisch' : 'achtung', 'checkin', ck.krank ? 'Krankheitsgefühl im Check-in' : 'Schmerz ' + ck.schmerz + '/10' + (ck.ort_txt ? ' · ' + ck.ort_txt : ''), 'Check-in vom ' + tagTxt(ck.date) + (ck.notiz ? ': „' + String(ck.notiz).slice(0, 140) + '“' : '') + '. Medizinisches gehört ärztlich abgeklärt – nicht über die App.',
        { art: 'erholung', bezug: { typ: 'tag', date: ck.date, titel: 'Check-in ' + dm(ck.date) }, text: ck.krank ? 'Du hast im Check-in ein Krankheitsgefühl angegeben. Heute bitte kein Training. Wenn es nicht besser wird, lass es ärztlich abklären – der Plan wartet.' : 'Du hast Schmerzen angegeben. Lass harte und lange Einheiten weg, bis es schmerzfrei ist, und lass es ärztlich abklären, wenn es bleibt.' });
      const pz = (A().state.rechner || {}).pause;
      if (pz && /^\d{4}-\d\d-\d\d$/.test(pz.seit || '') && !pz.gesund) add('achtung', 'pause', 'Pause-Modus seit ' + dm(pz.seit), vn + ' hat den Pause-Modus eingeschaltet' + (pz.art === 'krank' ? ' (krank)' : pz.art === 'angeschlagen' ? ' (angeschlagen)' : '') + '. Der Plan macht in dieser Zeit keinen Druck.',
        { art: 'erholung', text: 'Gute Besserung! Kein Stress mit dem Plan – wenn du wieder fit bist, steigen wir mit kurzen, lockeren Einheiten ein.' });
    }
    if (R.training) {
      const p = P.length ? P[P.length - 1] : null;
      if (p && p.acwr != null && p.acwr > 1.5) add('kritisch', 'acwr', 'Belastungsspitze (ACWR ' + nf(p.acwr, 2) + ')', 'Die letzten 7 Tage liegen deutlich über den letzten 4 Wochen. Sprünge über 1,5 gehen in Studien mit mehr Verletzungen einher.',
        { art: 'training', text: 'Die letzte Woche war deutlich mehr als die Wochen davor. Lass uns die nächsten Tage etwas ruhiger machen, bevor wir weiter steigern.' });
      if (p && p.tsb != null && p.tsb < -30) add('achtung', 'form', 'Form ' + nf(p.tsb) + ' – sehr müde', 'Die Ermüdung liegt deutlich über der Fitness. Gut für einen Block, aber nicht lange am Stück.',
        { art: 'training', text: 'Du bist gerade ziemlich müde (Form deutlich im Minus). Plan in den nächsten Tagen einen ruhigen Tag ein, damit das Training ankommt.' });
      if (p && p.rampe != null && p.rampe > 8) add('achtung', 'rampe', 'Fitness steigt schnell: +' + nf(p.rampe, 1) + ' in 7 Tagen', 'Mehr als 5–8 Punkte pro Woche lassen sich selten lange halten.',
        { art: 'training', text: 'Du steigerst gerade sehr schnell. Halte den Umfang diese Woche, bevor wir weiter erhöhen.' });
      const lw = (rowsOf('laufwaechter') || [])[0];
      if (lw && lw.ampel && lw.ampel !== 'gruen') add(lw.ampel === 'rot' ? 'kritisch' : 'achtung', 'laufen', 'Laufen: ' + lw.titel, lw.text,
        { art: 'training', text: 'Beim Laufen bitte vorsichtig steigern – Knochen und Sehnen brauchen länger als die Ausdauer. Halte den Umfang diese Woche und lauf, wo es geht, auf weichem Untergrund.' });
      const I = (rowsOf('intensitaet') || []).find((x) => x.id === '4w');
      if (I && I.stunden >= 3 && I.z1_pct < 70) add('achtung', 'intensitaet', 'Viel Zeit über VT1', 'In den letzten 4 Wochen lagen ' + (100 - I.z1_pct) + ' % der Zeit über VT1 (Z1 ' + I.z1_pct + ' %). Ausdauer wächst vor allem im lockeren Bereich.',
        { art: 'training', text: 'Deine lockeren Einheiten sind oft zu schnell. Bleib bei Grundlage wirklich unter VT1 – dann gehen die harten Einheiten besser.' });
      const F = (rowsOf('fueling') || []).filter((x) => x.date <= h0 && -tageBis(x.date) <= 14);
      const wenig = F.filter((x) => x.g_h != null && x.lo && x.g_h < x.lo), ohne = F.filter((x) => x.g_h == null && x.sport === 'bike' && x.min >= 150);
      if (wenig.length) add('achtung', 'fueling', 'Zu wenig Kohlenhydrate in langen Einheiten', wenig.length + (wenig.length === 1 ? ' lange Einheit' : ' lange Einheiten') + ' in 14 Tagen unter dem Ziel von ' + wenig[0].ziel + ' (zuletzt ' + wenig[0].g_h_txt + ').',
        { art: 'training', bezug: { typ: 'einheit', id: String(wenig[0].id), date: wenig[0].date, titel: wenig[0].sportart + ' ' + dm(wenig[0].date) }, text: 'In deinen langen Einheiten fehlen Kohlenhydrate. Plan für die nächste lange Ausfahrt fest ein, was du wann isst und trinkst, und trag es danach ein.' });
      else if (ohne.length) add('neutral', 'fueling', ohne.length + (ohne.length === 1 ? ' lange Radeinheit' : ' lange Radeinheiten') + ' ohne Fueling-Eintrag', 'Ohne Eintrag lässt sich nicht prüfen, ob die Kohlenhydrate pro Stunde stimmen.',
        { art: 'training', text: 'Trag nach langen Radeinheiten kurz ein, wie viele Kohlenhydrate du gegessen hast – dann sehen wir, ob die Verpflegung passt.' });
      if (H && H.pause_tage != null && H.pause_tage >= 4) add('achtung', 'pausetage', 'Seit ' + H.pause_tage + ' Tagen kein Training', 'Die letzte Einheit war am ' + H.letzte_einheit + '. Nach der Pause langsam wieder einsteigen.',
        { art: 'training', text: 'Wie geht es dir? Ich sehe seit ein paar Tagen kein Training. Wenn alles okay ist: mit kurzen, lockeren Einheiten wieder einsteigen.' });
    }
    if (R.plan) {
      const W = sicher(() => (window.tfPlan && tfPlan.wocheFuerCoach ? tfPlan.wocheFuerCoach() : null));
      if (W && W.lage.verpasst >= 2) add('achtung', 'verpasst', W.lage.verpasst + ' Einheiten diese Woche verpasst', W.lage.nOk + ' von ' + W.lage.nPlan + ' geplanten Einheiten sind erledigt.',
        { art: 'training', bezug: { typ: 'woche', titel: 'Diese Woche' }, text: 'Diese Woche sind ein paar Einheiten liegen geblieben. Kein Problem – nicht nachholen, sondern mit der nächsten geplanten Einheit weitermachen. Passt der Plan zu deiner Zeit?' });
      const rn = naechstesRennen(), n = rn ? tageBis(rn.datum) : null;
      if (rn && n >= 0 && n <= 21) add('neutral', 'rennen', String(rn.name || 'Rennen') + ' in ' + (n === 0 ? 'heute' : n === 1 ? '1 Tag' : n + ' Tagen'), n <= 7 ? 'Rennwoche: weniger Umfang, kurze Reize, viel Schlaf.' : 'Taper-Zeit: Umfang senken, Intensität kurz halten.',
        { art: 'rennen', text: n <= 7 ? 'Rennwoche! Jetzt nichts mehr erzwingen: kurz, locker, mit ein paar Antritten. Viel schlafen und Kohlenhydrate auffüllen.' : 'Ab jetzt beginnt das Tapering: weniger Umfang, die Intensität bleibt – nur kürzer. Vertrau dem Training, das du gemacht hast.' });
    }
    return out.sort((x, y) => RANG[x.ton] - RANG[y.ton]);
  }

  function einfuehrung(vn) {
    if (merkLesen('tf:coach-intro', 0)) return null;
    const c = S.karte({ farbe: 'blue', icon: 'i-question', titel: 'So funktioniert die Coach-Ansicht', sub: 'In vier Schritten', id: 'coach-intro', cls: 'tf-co-voll' });
    const schritte = [
      ['Überblick', 'Hier steht alles über ' + vn + ' auf einer Seite: Tune, was dir auffallen sollte, die Woche, Einheiten, Belastung, Erholung und das nächste Rennen.'],
      ['Tiefer schauen', 'Training, Rennen und Gesundheit unten zeigen die Seiten von ' + vn + ' – so wie in der App des Athleten, nur zum Ansehen.'],
      ['Tipps schicken', '„Tipp schreiben“ bei einem Hinweis, einer Einheit oder der Woche. ' + vn + ' liest ihn oben auf Heute und kann antworten.'],
      ['Freigaben', vn + ' bestimmt, was du siehst, und kann den Zugriff jederzeit beenden. Du änderst nichts an den Daten.'],
    ];
    c.appendChild(el('ol', { class: 'tf-co-schritte' }, ...schritte.map(([t, x]) => el('li', null, el('b', { text: t }), el('span', { text: x })))));
    c.appendChild(el('div', { class: 'tf-form-actions' },
      knopf('Verstanden', 'tf-btn-primary tf-btn-klein', () => { merkSchreiben('tf:coach-intro', 1); T.neu(); }, { id: 'coach-intro-ok' }),
      knopf('Alles im Tutorial', 'tf-btn-plain tf-btn-klein', () => T.geh('wissen/tutorial'))));
    return c;
  }
  function nichtFrei(vn, titel, icon, farbe, was, id) {
    const c = S.karte({ farbe, icon, titel, sub: 'Nicht freigegeben', id });
    c.appendChild(el('p', { class: 'tf-co-p', text: vn + ' hat ' + was + ' nicht freigegeben. Die Freigaben ändert nur ' + vn + ' – in Dreiklang unter Profil → Coach.' }));
    return c;
  }
  function tuneKarte(vn) {
    const R = lage().rechte || {};
    if (!R.erholung) return nichtFrei(vn, 'Tune', 'i-ring', 'blue', 'Erholung (Tune, HRV, Schlaf)', 'coach-tune');
    const h = (rowsOf('heute') || [])[0];
    if (!h) { const c = S.karte({ farbe: 'blue', icon: 'i-ring', titel: 'Tune', sub: 'Noch keine Nachtdaten', id: 'coach-tune' }); c.appendChild(el('p', { class: 'tf-co-p', text: 'Sobald die Uhr von ' + vn + ' eine Nacht mit HRV oder Schlaf geliefert hat, steht hier der Tune.' })); return c; }
    const c = el('article', { class: 'tf-card tf-home-hero tf-buehne tf-b-tune tf-co-held', id: 'coach-tune', 'data-ampel': h.ampel || 'kalibrierung' });
    const nacht = h.date === localDate() ? 'heute Nacht' : 'Nacht zum ' + dm(h.date);
    c.appendChild(el('span', { class: 'tf-hero-kopf' }, el('span', { class: 'tf-augenbraue', text: 'Tune von ' + vn }), el('span', { class: 'tf-hero-stand', text: nacht })));
    const rg = el('span', { class: 'tf-ring' });
    const ringBox = el('span', { class: 'tf-home-ring' }, rg, el('span', { class: 'tf-ring-center' }, el('span', { class: 'tf-ring-num num' }, el('span', { text: h.score == null ? '–' : String(h.score) }))));
    sicher(() => ring(rg, h.score, h.ampel, h.score == null ? 0 : h.score / 100, 'coach'));
    const bf = (rowsOf('befinden') || []).find((b) => b.date === h.checkin_date);
    const ck = bf ? (bf.krank ? 'Check-in: Krankheitsgefühl' : bf.schmerz >= 3 ? 'Check-in: Schmerz ' + bf.schmerz + '/10' + (bf.ort_txt ? ' · ' + bf.ort_txt : '') : 'Check-in ' + bf.pct + ' %') : 'Ohne Check-in';
    c.appendChild(el('span', { class: 'tf-hero-haupt' }, ringBox, el('span', { class: 'tf-home-side' },
      el('span', { class: 'tf-status' }, el('span', { class: 'tf-status-dot', style: 'background:var(--tf-' + (AMPEL[h.ampel] || 'gray') + ')' }), el('span', { text: h.label || 'Tune' })),
      h.grund ? el('span', { class: 'tf-limit', text: h.grund }) : null,
      el('span', { class: 'tf-limit', text: ck }),
      el('span', { class: 'tf-hero-emp', text: 'Dreiklang empfiehlt: ' + h.empfehlung + '.' }))));
    const w = (lab, wert, d) => el('span', { class: 'tf-home-w' }, el('span', { text: lab }), el('b', { class: 'num', text: wert }), el('small', { text: d || '' }));
    c.appendChild(el('span', { class: 'tf-home-werte' },
      w('HRV', h.hrv ? nf(h.hrv) : '–', h.hrv_delta_txt && h.hrv_delta_txt !== '–' ? h.hrv_delta_txt + ' zur Basis' : 'ms'),
      w('Ruhepuls', h.rhr ? nf(h.rhr) : '–', h.rhr_delta_txt && h.rhr_delta_txt !== '–' ? h.rhr_delta_txt + ' zur Basis' : 'bpm'),
      w('Schlaf', h.schlaf_hm || '–', h.leistung_pct != null ? h.leistung_pct + ' % vom Bedarf' : 'h')));
    c.appendChild(el('div', { class: 'tf-held-k' },
      knopf('Tipp schreiben', 'tf-held-los', () => tippVorbereiten({ art: 'erholung', bezug: { typ: 'tag', date: h.date, titel: 'Tune ' + dm(h.date) } }), { id: 'coach-tune-tipp' }),
      knopf('Tune im Detail', 'tf-held-det', () => T.geh('heute/tagesform'))));
    return c;
  }
  function hinweisKarte(vn) {
    const H = hinweise(vn), c = S.karte({ farbe: 'orange', icon: 'i-alert', titel: 'Fällt dir auf', sub: H.length ? (H.length === 1 ? '1 Hinweis' : H.length + ' Hinweise') + ' aus den Daten von ' + vn : 'Aus den Daten von ' + vn, id: 'coach-hinweise' });
    if (!H.length) { c.appendChild(el('p', { class: 'tf-co-ruhe' }, punkt('green'), el('span', { text: 'Nichts Auffälliges – Erholung, Belastung und Plan sind im Rahmen.' }))); return c; }
    c.appendChild(el('div', { class: 'tf-co-hl' }, ...H.map((x) => el('div', { class: 'tf-co-h', 'data-ton': x.ton, 'data-id': x.id },
      punkt(TON[x.ton][0]),
      el('div', { class: 'tf-co-h-t' }, el('b', { text: zahlFest(x.titel) }), el('p', { text: zahlFest(x.text) }), x.tipp ? tippKnopf(Object.assign({ bezug: x.tipp.bezug || { typ: 'hinweis', id: x.id, titel: x.titel } }, x.tipp)) : null)))));
    return c;
  }
  function wocheKarte() {
    const R = lage().rechte || {};
    if (!R.plan && !R.training) return null;
    const W = sicher(() => (window.tfPlan && tfPlan.wocheFuerCoach ? tfPlan.wocheFuerCoach() : null));
    if (!W) return null;
    const k = W.karte; k.classList.add('tf-co-woche');
    k.appendChild(el('div', { class: 'tf-co-fuss' }, tippKnopf({ art: 'training', bezug: { typ: 'woche', titel: 'Diese Woche' } }, 'Tipp zur Woche', 'coach-woche-tipp')));
    return k;
  }
  function einheitenKarte(vn) {
    const R = lage().rechte || {}, EI = window.tfEinheit;
    if (!R.training) return nichtFrei(vn, 'Letzte Einheiten', 'i-bolt', 'orange', 'Training', 'coach-einheiten');
    const c = S.karte({ farbe: 'orange', icon: 'i-bolt', titel: 'Letzte Einheiten', sub: 'Mit Befund – antippen öffnet die Analyse', id: 'coach-einheiten' });
    const L = EI && EI.alle ? sicher(() => EI.alle().slice().sort((x, y) => (EI.zeitpunkt(y) < EI.zeitpunkt(x) ? -1 : 1)).slice(0, 5), []) : [];
    if (!L.length) { c.appendChild(el('p', { class: 'tf-co-p', text: 'Noch keine Einheiten aufgezeichnet.' })); return c; }
    const liste = el('div', { class: 'tf-co-el' });
    L.forEach((b) => {
      const E = sicher(() => EI.holen(b.id)); if (!E) return;
      const k = sicher(() => EI.kachel(E, false, { ziel: 'training/buch/', lazy: true, meta: [tagTxt(b.date), EI.dauer ? EI.dauer(E.min) : null].filter(Boolean) }));
      if (!k) return;
      liste.appendChild(el('div', { class: 'tf-co-e' }, k, tippKnopf({ art: 'training', bezug: { typ: 'einheit', id: E.id, date: b.date, titel: String(E.titel).slice(0, 60) + ' · ' + dm(b.date) } }, 'Tipp zu dieser Einheit')));
    });
    c.appendChild(liste);
    c.appendChild(el('div', { class: 'tf-co-fuss' }, linkKnopf('Trainingsbuch', 'training/buch')));
    return c;
  }
  function lastKarte() {
    const R = lage().rechte || {};
    if (!R.training) return null;
    const P = rowsOf('pmc') || [], W = (rowsOf('wochen') || []).slice(-6);
    const c = S.karte({ farbe: 'indigo', icon: 'i-bars', titel: 'Belastung', sub: 'Fitness, Ermüdung, Form und 6 Wochen Umfang', id: 'coach-last' });
    const p = P.length ? P[P.length - 1] : null, v = P.length > 7 ? P[P.length - 8] : null;
    if (!p) { c.appendChild(el('p', { class: 'tf-co-p', text: 'Noch zu wenige Einheiten für Fitness und Form.' })); return c; }
    const d = (a, b) => (a == null || b == null ? '' : (a - b >= 0 ? '+' : '−') + nf(Math.abs(a - b), 0) + ' zur Vorwoche');
    const kv = (lab, wert, sub) => el('div', { class: 'tf-co-kv' }, el('small', { text: lab }), el('b', { class: 'num', text: wert }), el('span', { text: sub }));
    c.appendChild(el('div', { class: 'tf-co-kvs' },
      kv('Fitness', nf(p.ctl), v ? d(p.ctl, v.ctl) : 'CTL'),
      kv('Ermüdung', nf(p.atl), v ? d(p.atl, v.atl) : 'ATL'),
      kv('Form', (p.tsb > 0 ? '+' : p.tsb < 0 ? '−' : '') + nf(Math.abs(p.tsb)), p.tsb < -25 ? 'sehr müde' : p.tsb < -10 ? 'im Training' : p.tsb > 10 ? 'frisch' : 'ausgeglichen'),
      kv('ACWR', p.acwr == null ? '–' : nf(p.acwr, 2), p.acwr == null ? 'zu wenig Last' : p.acwr > 1.5 ? 'Spitze' : p.acwr < 0.8 ? 'Entlastung' : 'im Rahmen')));
    if (W.length) {
      const max = Math.max(1, ...W.map((w) => w.gesamt_h || 0));
      const DF = (T.farben && T.farben.disziplin) || {}, FARBE = [['schwimmen_h', DF.swim || 'blue', 'Schwimmen'], ['rad_h', DF.bike || 'orange', 'Rad'], ['lauf_h', DF.run || 'mint', 'Laufen'], ['sonst_h', 'gray', 'Sonstiges']]; // die Farben der Disziplinen wie überall in der App
      const saeulen = el('div', { class: 'tf-co-w', role: 'img', 'aria-label': 'Stunden je Woche: ' + W.map((w) => w.kw + ' ' + hmStd(w.gesamt_h) + ' h').join(', ') },
        ...W.map((w) => el('div', { class: 'tf-co-w-s' },
          el('span', { class: 'tf-co-w-z num', text: hmStd(w.gesamt_h) }),
          el('span', { class: 'tf-co-w-b' }, ...FARBE.filter(([k]) => w[k] > 0).map(([k, f]) => { const i = el('i', { style: '--c:var(--tf-' + f + ')' }); i.style.height = ((100 * w[k]) / max).toFixed(1) + '%'; return i; })),
          el('small', { text: w.kw.replace('KW ', 'KW ') }))));
      c.appendChild(saeulen);
      c.appendChild(el('div', { class: 'tf-co-leg' }, ...FARBE.map(([, f, n]) => el('span', null, punkt(f), n))));
    }
    c.appendChild(el('div', { class: 'tf-co-fuss' }, linkKnopf('Fitness & Form', 'training/form')));
    return c;
  }
  function erholungKarte() {
    const R = lage().rechte || {};
    if (!R.erholung) return null;
    const h0 = localDate(), E = (rowsOf('erholung') || []).filter((x) => x.date <= h0 && -tageBis(x.date) < 28);
    const c = S.karte({ farbe: 'pink', icon: 'i-heart', titel: 'Erholung', sub: 'Die letzten 28 Tage', id: 'coach-erholung' });
    if (!E.length) { c.appendChild(el('p', { class: 'tf-co-p', text: 'In den letzten 28 Tagen keine Nachtdaten.' })); return c; }
    const nachDatum = new Map(E.map((x) => [x.date, x])), tage = [];
    for (let i = 27; i >= 0; i--) tage.push(new Date(Date.parse(h0 + 'T12:00:00Z') - i * 864e5).toISOString().slice(0, 10)); // jeder Kalendertag – Lücken bleiben sichtbar
    const mitTune = E.filter((x) => x.score != null).length;
    c.appendChild(el('div', { class: 'tf-co-28', role: 'img', 'aria-label': 'Tune an ' + mitTune + ' der letzten 28 Tage' }, ...tage.map((d) => { const x = nachDatum.get(d); return el('i', { class: x && x.score != null ? '' : 'leer', style: x && x.score != null ? '--c:var(--tf-' + (AMPEL[x.ampel] || 'gray') + ')' : null, title: dm(d) + ': ' + (x && x.score != null ? 'Tune ' + x.score : 'kein Tune') }); })));
    c.appendChild(el('div', { class: 'tf-co-28-l' }, el('small', { text: dm(tage[0]) }), el('small', { text: 'heute' })));
    const l = [...E].reverse(), hv = l.find((x) => x.hrv7 != null), rp = l.find((x) => x.rhr7 != null), sl = l.find((x) => x.schlaf7_h != null);
    const zeile = (lab, wert, sub, lage2) => el('div', { class: 'tf-co-z' }, el('span', { text: lab }), el('b', { class: 'num', text: wert }), el('small', { class: lage2 || '', text: sub }));
    c.appendChild(el('div', { class: 'tf-co-zs' },
      hv ? zeile('HRV, 7 Tage', nf(hv.hrv7) + ' ms', hv.hrv_lo != null ? 'Normalbereich ' + nf(hv.hrv_lo) + '–' + nf(hv.hrv_hi) + ' ms' : 'Basis noch im Aufbau', hv.hrv_lo != null && hv.hrv7 < hv.hrv_lo ? 'tief' : '') : null,
      rp ? zeile('Ruhepuls, 7 Tage', nf(rp.rhr7, 1) + ' bpm', rp.rhr_basis != null ? 'Basis ' + nf(rp.rhr_basis, 1) + ' bpm' : 'Basis noch im Aufbau', rp.rhr_hi != null && rp.rhr7 > rp.rhr_hi ? 'tief' : '') : null,
      sl ? zeile('Schlaf, 7 Tage', hmStd(sl.schlaf7_h) + ' h', 'Bedarf ' + sl.bedarf_hm + ' h', sl.schlaf7_h < sl.bedarf_h * 0.9 ? 'tief' : '') : null));
    c.appendChild(el('div', { class: 'tf-co-fuss' }, linkKnopf('HRV', 'gesundheit/hrv'), linkKnopf('Schlaf', 'gesundheit/schlaf')));
    return c;
  }
  function intensitaetKarte() {
    const R = lage().rechte || {};
    if (!R.training) return null;
    const I = (rowsOf('intensitaet') || []).find((x) => x.id === '4w');
    if (!I || !I.stunden) return null;
    const c = S.karte({ farbe: 'green', icon: 'i-gauge', titel: 'Intensität', sub: '4 Wochen · ' + I.zeitraum + ' · ' + nf(I.stunden, 1) + ' h', id: 'coach-intensitaet' });
    const Z = [['Z1', I.z1_pct, 'green', 'unter VT1'], ['Z2', I.z2_pct, 'orange', 'VT1–VT2'], ['Z3', I.z3_pct, 'red', 'über VT2']];
    const bar = el('div', { class: 'tf-co-zb', role: 'img', 'aria-label': Z.map(([z, p]) => z + ' ' + p + ' %').join(', ') }, ...Z.filter(([, p]) => p > 0).map(([, p, f]) => { const i = el('i', { style: '--c:var(--tf-' + f + ')' }); i.style.width = p + '%'; return i; }));
    c.appendChild(bar);
    c.appendChild(el('div', { class: 'tf-co-leg' }, ...Z.map(([z, p, f, t]) => el('span', null, punkt(f), z + ' ' + p + ' % · ' + t))));
    c.appendChild(el('p', { class: 'tf-co-p', text: 'Verteilung: ' + I.typ + (I.pi_txt && I.pi_txt !== '–' ? ' (Polarisierungs-Index ' + I.pi_txt + ')' : '') + '. Spitzen-Ausdauerathleten verbringen meist etwa 80 % der Zeit unter VT1.' }));
    c.appendChild(el('div', { class: 'tf-co-fuss' }, linkKnopf('Umfang & Intensität', 'training/umfang')));
    return c;
  }
  function rennenKarte(vn) {
    const R = lage().rechte || {};
    if (!R.plan) return null;
    const rn = naechstesRennen(), PR = sicher(() => (window.tfPlan && tfPlan.hat && tfPlan.hat() && tfPlan.prognose ? tfPlan.prognose() : null));
    if (!rn && !PR) return null;
    const c = S.karte({ farbe: 'blue', icon: 'i-flag', titel: 'Rennen', sub: rn ? String(rn.name || 'Rennen') : 'Ziel im Plan', id: 'coach-rennen' });
    if (rn) {
      const n = tageBis(rn.datum);
      c.appendChild(el('div', { class: 'tf-co-kvs' },
        el('div', { class: 'tf-co-kv' }, el('small', { text: 'Renntag' }), el('b', { class: 'num', text: dm(rn.datum) }), el('span', { text: tagTxt(rn.datum).split(',')[0] })),
        el('div', { class: 'tf-co-kv' }, el('small', { text: 'Noch' }), el('b', { class: 'num', text: String(n) }), el('span', { text: n === 1 ? 'Tag' : 'Tage' }))));
    }
    const s = (x) => (typeof x === 'number' ? x : x && typeof x.gesamt === 'number' ? x.gesamt : null);
    if (PR && PR.zeit) {
      const j = s(PR.zeit.jetzt), sp = Array.isArray(PR.zeit.spanne) ? PR.zeit.spanne.map(s) : null;
      if (j || (sp && sp[0])) c.appendChild(el('p', { class: 'tf-co-p' }, el('span', { text: [j ? 'Prognose heute ' + hmSek(j) + ' h' : null, sp && sp[0] && sp[1] ? 'am Renntag ' + hmSek(Math.min(sp[0], sp[1])) + '–' + hmSek(Math.max(sp[0], sp[1])) + ' h, wenn der Plan durchgezogen wird' : null].filter(Boolean).join(' · ') + '.' })));
    }
    if (PR && PR.treue != null && isFinite(PR.treue)) c.appendChild(el('p', { class: 'tf-co-p', text: 'Zuletzt hat ' + vn + ' ' + Math.round(100 * Math.min(1, PR.treue)) + ' % der geplanten Belastung geschafft.' }));
    c.appendChild(el('div', { class: 'tf-co-fuss' }, linkKnopf('Rennen', 'rennen'), tippKnopf({ art: 'rennen', bezug: rn ? { typ: 'tag', date: rn.datum, titel: String(rn.name || 'Rennen').slice(0, 60) } : null })));
    return c;
  }
  function appKarte(vn) {
    const X = (rowsOf('erkenntnisse') || []).filter((x) => x.ton === 'kritisch' || x.ton === 'achtung').slice(0, 4);
    if (!X.length) return null;
    const c = S.karte({ farbe: 'gold', icon: 'i-spark', titel: 'Was Dreiklang ' + vn + ' sagt', sub: 'Die Hinweise der App – so liest sie ' + vn, id: 'coach-app' });
    c.appendChild(el('div', { class: 'tf-co-hl' }, ...X.map((x) => el('div', { class: 'tf-co-h', 'data-ton': x.ton }, punkt(TON[x.ton][0]), el('div', { class: 'tf-co-h-t' }, el('b', { text: zahlFest(x.titel) }), el('p', { text: zahlFest(x.text) }), x.quelle ? el('small', { class: 'tf-co-q', text: x.quelle }) : null)))));
    return c;
  }
  function profilKarte(vn) {
    const a = (rowsOf('athlet') || [])[0] || {}, L = lage(), R = L.rechte || {};
    const c = S.karte({ farbe: 'gray', icon: 'i-gauge', titel: 'Profil & Freigaben', sub: 'Schwellen von ' + vn + (L.seit ? ' · betreut seit ' + dm(String(L.seit).slice(0, 10)) : ''), id: 'coach-profil' });
    const wkg = +a.ftp_ref_w > 0 && +a.gewicht_ref_kg > 0 ? nf(a.ftp_ref_w / a.gewicht_ref_kg, 2) + ' W/kg' : '';
    const kv = (lab, wert, sub) => el('div', { class: 'tf-co-kv' }, el('small', { text: lab }), el('b', { class: 'num', text: wert }), el('span', { text: sub || '' }));
    c.appendChild(el('div', { class: 'tf-co-kvs tf-co-kvs-3' },
      kv('FTP', +a.ftp_ref_w > 0 ? nf(a.ftp_ref_w) + ' W' : '–', wkg),
      kv('CSS', +a.css_s_100m > 0 ? mmss(a.css_s_100m) : '–', 'pro 100 m'),
      kv('Schwelle Laufen', +a.vt2_pace_s_km > 0 ? mmss(a.vt2_pace_s_km) : '–', 'pro km · ' + (a.vt2_hf || '–') + ' bpm'),
      kv('VT1 Laufen', +a.vt1_pace_s_km > 0 ? mmss(a.vt1_pace_s_km) : '–', 'pro km · ' + (a.vt1_hf || '–') + ' bpm'),
      kv('Puls max.', a.hf_max ? nf(a.hf_max) : '–', 'bpm'),
      kv('Schlafbedarf', a.schlafbedarf_min ? hmStd(a.schlafbedarf_min / 60) : '–', 'h pro Nacht')));
    if (Array.isArray(a.standard) && a.standard.length) c.appendChild(el('p', { class: 'tf-co-p tf-co-leise', text: 'Noch Standardwerte: ' + a.standard.length + ' Werte hat ' + vn + ' nicht selbst eingetragen – Auswertungen mit Watt, Tempo und Puls sind dann nur grob.' }));
    c.appendChild(el('div', { class: 'tf-co-chips', 'aria-label': 'Freigaben' }, ...RECHTE.map(([k, n]) => el('span', { class: 'tf-co-chip' + (R[k] ? ' an' : '') }, svgIco(R[k] ? 'i-check' : 'i-lock'), n))));
    c.appendChild(el('p', { class: 'tf-co-p tf-co-leise', text: 'Was du siehst, bestimmt ' + vn + '. Immer dabei ist das Athletenprofil (Schwellen, Zonen, Ziele, Gewicht für W/kg).' }));
    return c;
  }
  function leerKarte() {
    const c = S.karte({ farbe: 'blue', icon: 'i-team', titel: 'Noch kein Athlet verbunden', sub: 'So kommst du an die Daten', id: 'coach-leer', cls: 'tf-co-voll' });
    c.appendChild(el('ol', { class: 'tf-co-schritte' },
      el('li', null, el('b', { text: 'Code holen' }), el('span', { text: 'Dein Athlet öffnet Dreiklang → Profil → Coach → „Einladungscode erstellen“ und schickt dir den Code.' })),
      el('li', null, el('b', { text: 'Code eintragen' }), el('span', { text: 'Unten eintragen und bestätigen, dass du die Daten nur für das Coaching nutzt.' })),
      el('li', null, el('b', { text: 'Loslegen' }), el('span', { text: 'Du siehst den Überblick, die Seiten deines Athleten und kannst Tipps schicken.' }))));
    c.appendChild(beitretenForm('leer'));
    return c;
  }
  function renderUeberblick() {
    const box = $('#coach-box'); if (!box) return;
    if (!an()) { box.replaceChildren(); return; }
    const L = lage(), st = A().state;
    if (!L.athlet) {
      T.kopf({ titel: 'Überblick', sub: L.fehler || 'Coach-Ansicht' });
      if (st.status === 'loading') { box.replaceChildren(el('p', { class: 'tf-co-laedt', text: 'Lädt …' })); return; }
      if (box.querySelector('#coach-leer')) return; // Eingabe nicht wegwischen
      box.replaceChildren(el('div', { class: 'tf-co' }, leerKarte()));
      return;
    }
    const vn = kurzName(L.name);
    T.kopf({ titel: String(L.name).indexOf('@') > 0 ? vn : L.name, sub: st.status === 'loading' ? 'Lädt die Daten …' : [st.stand && st.stand.at ? 'Garmin ' + rel(st.stand.at) : 'Noch keine Garmin-Daten', L.at ? 'geladen ' + rel(L.at) : null].filter(Boolean).join(' · ') });
    if (st.status === 'loading') { box.replaceChildren(el('p', { class: 'tf-co-laedt', text: 'Lädt die Daten von ' + vn + ' …' })); return; }
    // oben über die ganze Breite: Einführung und Tune; darunter die Karten nach Wichtigkeit – am Laptop in zwei Spalten
    const tune = tuneKarte(vn); if (tune) tune.classList.add('tf-co-voll');
    const teile = [hinweisKarte(vn), wocheKarte(), einheitenKarte(vn), lastKarte(), erholungKarte(), intensitaetKarte(), rennenKarte(vn), appKarte(vn), profilKarte(vn)].filter(Boolean);
    box.replaceChildren(el('div', { class: 'tf-co' }, ...[einfuehrung(vn), tune].filter(Boolean), el('div', { class: 'tf-co-spalten' }, ...teile)));
  }

  /* =====================================================================
     Deine Athleten (Coach): wechseln, hinzufügen, Betreuung beenden
     ===================================================================== */
  function beitretenForm(wo) {
    const f = el('form', { class: 'tf-co-bei', id: 'coach-beitreten-' + wo, novalidate: true });
    const inp = el('input', { class: 'tf-input tf-mono', id: 'coach-code-' + wo, type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'XXXXX-XXXXX', 'aria-label': 'Code deines Athleten' });
    const cb = el('input', { type: 'checkbox', id: 'coach-versprechen-' + wo });
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const los = el('button', { type: 'submit', class: 'tf-btn tf-btn-primary', id: 'coach-beitreten-los-' + wo }, 'Athlet hinzufügen');
    f.append(el('label', { class: 'tf-lf' }, el('span', { text: 'Code von deinem Athleten' }), inp),
      el('label', { class: 'tf-switch' }, cb, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Nur fürs Coaching', el('small', { text: 'Ich nutze die Daten nur, um meinen Athleten zu betreuen, und gebe sie nicht weiter.' }))),
      el('div', { class: 'tf-form-actions' }, los), msg);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const code = inp.value.trim();
      if (!code) return setMsg(msg, 'Bitte den Code eintragen.', true);
      if (!cb.checked) return setMsg(msg, 'Bitte bestätige, dass du die Daten nur für das Coaching nutzt.', true);
      los.disabled = true; setMsg(msg, 'Verbinde …');
      try {
        const j = await A().api('POST', '/api/konto', { aktion: 'coach_beitreten', code, versprechen: true });
        inp.value = ''; cb.checked = false; setMsg(msg, '');
        await CO().liste();
        await CO().waehlen(j.athlet);
        A().toast('Verbunden mit ' + j.name);
        T.geh('coach');
      } catch (e) { setMsg(msg, e.message, true); } finally { los.disabled = false; }
    });
    return f;
  }
  let listeAt = 0;
  function renderAthleten() {
    const box = $('#coach-athleten-box'); if (!box) return;
    if (!an()) { box.replaceChildren(); return; }
    if (Date.now() - listeAt > 60e3) { listeAt = Date.now(); CO().liste().catch(() => {}); } // im Hintergrund frisch vom Server – gezeichnet wird gleich mit dem, was da ist
    const L = lage();
    const sig = JSON.stringify([L.athlet, L.liste]);
    if (box.dataset.sig === sig && box.childElementCount) return;
    box.dataset.sig = sig;
    const karten = L.liste.map((x) => {
      const aktiv = x.uid === L.athlet, t = x.tune;
      const c = el('article', { class: 'tf-card tf-co-a' + (aktiv ? ' aktiv' : ''), 'data-uid': x.uid });
      c.appendChild(el('div', { class: 'tf-co-a-k' }, avatarVon(x.avatar, x.name, 44),
        el('div', { class: 'tf-co-a-t' }, el('b', { text: titelVon(x.name) }), el('small', { text: [titelVon(x.name) !== x.name ? x.name : null, aktiv ? 'gerade offen' : null, 'betreut seit ' + (x.seit ? dm(String(x.seit).slice(0, 10)) : '–')].filter(Boolean).join(' · ') })),
        t && t.score != null ? el('span', { class: 'tf-co-a-tune', style: '--c:var(--tf-' + (AMPEL[t.ampel] || 'gray') + ')' }, el('b', { class: 'num', text: String(t.score) }), el('small', { text: t.label })) : null));
      const z = [];
      if (t) z.push('Tune ' + (t.date === localDate() ? 'heute' : dm(t.date)) + ': ' + (t.empfehlung || t.label));
      else if (x.rechte && x.rechte.erholung) z.push(x.nacht ? 'Letzte Nacht bei Garmin: ' + dm(x.nacht) : 'Noch keine Nachtdaten');
      if (x.hinweise && (x.hinweise.kritisch || x.hinweise.achtung)) z.push([x.hinweise.kritisch ? x.hinweise.kritisch + ' wichtig' : null, x.hinweise.achtung ? x.hinweise.achtung + ' im Blick' : null].filter(Boolean).join(', ') + ' laut Dreiklang');
      if (x.woche) z.push('Diese Woche ' + hmStd(x.woche.h) + ' h trainiert');
      if (x.rennen) z.push(x.rennen.name + ' in ' + tageBis(x.rennen.datum) + ' Tagen');
      if (x.tipps && x.tipps.antworten) z.push(x.tipps.antworten === 1 ? '1 neue Antwort' : x.tipps.antworten + ' neue Antworten');
      c.appendChild(el('ul', { class: 'tf-co-a-z' }, ...z.map((s) => el('li', { text: zahlFest(s) }))));
      const oeffnen = knopf(aktiv ? 'Überblick' : 'Öffnen', 'tf-btn-primary tf-btn-klein', async () => { if (!aktiv) await CO().waehlen(x.uid); T.geh('coach'); });
      const weg = bestaetigen('Betreuung beenden', 'Wirklich beenden?', async () => {
        try { await A().api('POST', '/api/konto', { aktion: 'athlet_entfernen', athlet: x.uid }); A().toast('Betreuung von ' + x.name + ' beendet'); await CO().neu(); }
        catch (e) { A().toast(e.message, 5000); }
      });
      c.appendChild(el('div', { class: 'tf-form-actions' }, oeffnen, weg));
      return c;
    });
    const neu = S.karte({ farbe: 'green', icon: 'i-plus', titel: 'Athlet hinzufügen', sub: 'Mit dem Code, den dein Athlet erstellt', id: 'coach-hinzufuegen' });
    neu.appendChild(beitretenForm('liste'));
    const eigen = el('button', { type: 'button', class: 'tf-zeile', id: 'coach-zu-athlet-liste' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-gray)' }, svgIco('i-user')), el('span', { class: 'tf-zeile-t' }, el('b', { text: 'Zu deinem eigenen Training' }), el('small', { text: 'Dreiklang als Athlet nutzen – mit deinen eigenen Daten' })), svgIco('i-chev'));
    eigen.lastChild.classList.add('tf-chev');
    eigen.addEventListener('click', () => CO().wechseln('athlet').catch((e) => A().toast(e.message, 5000)));
    box.replaceChildren(el('div', { class: 'tf-hub tf-co-seite' },
      L.liste.length ? sek(L.liste.length === 1 ? 'Dein Athlet' : 'Deine Athleten', 'Antippen öffnet den Überblick') : null, ...karten,
      sek('Hinzufügen', 'Jeder Athlet erstellt seinen eigenen Code'), neu,
      sek('Ansicht', 'Selbst trainieren?'), el('div', { class: 'tf-links' }, eigen)));
  }

  /* =====================================================================
     Tipps (Coach): schreiben, was rausging, was zurückkam
     ===================================================================== */
  const TD = { athlet: null, neu: false, gesehenFuer: null };
  function tippZeile(t, o) {
    o = o || {};
    const [an2, icon, farbe] = ART[t.art] || ART.allgemein;
    const z = el('article', { class: 'tf-co-t' + (o.athlet && !t.gelesen ? ' neu' : ''), 'data-id': t.id });
    z.appendChild(el('div', { class: 'tf-co-t-k' },
      el('span', { class: 'tf-co-art', style: artStil(farbe) }, svgIco(icon), an2),
      el('small', { text: (o.athlet ? 'von ' + (t.von_name || 'deinem Coach') + ' · ' : '') + rel(t.at) })));
    if (t.bezug && t.bezug.titel) z.appendChild(el('p', { class: 'tf-co-t-bez', text: 'Zu: ' + t.bezug.titel }));
    z.appendChild(el('p', { class: 'tf-co-t-x', text: t.text }));
    if (t.antwort) z.appendChild(el('div', { class: 'tf-co-t-a' }, el('small', { text: (o.athlet ? 'Deine Antwort' : 'Antwort') + ' · ' + rel(t.antwort.at) }), el('p', { text: t.antwort.text })));
    if (!o.athlet) z.appendChild(el('p', { class: 'tf-co-t-s' }, punkt(t.gelesen ? 'green' : 'gray'), el('span', { text: t.gelesen ? 'Gelesen ' + rel(t.gelesen) : 'Noch nicht gelesen' })));
    return z;
  }
  function vorschlaege(vn) {
    const H = sicher(() => hinweise(vn), []) || [];
    return H.filter((x) => x.tipp).slice(0, 3);
  }
  function composer(vn) {
    const c = S.karte({ farbe: 'blue', icon: 'i-chat', titel: 'Neuer Tipp', sub: vn + ' sieht ihn oben auf Heute', id: 'coach-tipp-form' });
    const art = el('div', { class: 'tf-seg tf-co-arten', role: 'group', 'aria-label': 'Worum geht es?' });
    const zeichneArt = () => T.ui.segButtons(art, Object.keys(ART).map((k) => [k, ART[k][0]]), ENTWURF.art, (v) => { ENTWURF.art = v; zeichneArt(); });
    zeichneArt();
    const bez = el('div', { class: 'tf-co-bez' });
    const zeichneBezug = () => {
      bez.replaceChildren();
      if (!ENTWURF.bezug || !ENTWURF.bezug.titel) return;
      const x = el('button', { type: 'button', class: 'tf-co-bez-x', 'aria-label': 'Bezug entfernen' }, svgIco('i-x'));
      x.addEventListener('click', () => { ENTWURF.bezug = null; zeichneBezug(); });
      bez.append(el('span', { class: 'tf-co-chip an' }, svgIco('i-pin'), 'Zu: ' + ENTWURF.bezug.titel), x);
    };
    zeichneBezug();
    const ta = el('textarea', { class: 'tf-input', id: 'coach-tipp-text', rows: '5', maxlength: '1000', placeholder: 'Was soll ' + vn + ' wissen? Kurz und konkret – zum Beispiel, was heute oder diese Woche wichtig ist.', 'aria-label': 'Dein Tipp' });
    ta.value = ENTWURF.text || '';
    const zz = el('small', { class: 'tf-co-zz num', text: ta.value.length + ' / 1000' });
    ta.addEventListener('input', () => { ENTWURF.text = ta.value; zz.textContent = ta.value.length + ' / 1000'; });
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const senden = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'coach-tipp-senden' }, 'Senden');
    senden.addEventListener('click', async () => {
      const text = ta.value.trim();
      if (text.length < 2) return setMsg(msg, 'Schreib ein paar Worte.', true);
      senden.disabled = true; setMsg(msg, 'Sendet …');
      try {
        await A().api('POST', '/api/konto', { aktion: 'tipp', athlet: lage().athlet, art: ENTWURF.art, text, bezug: ENTWURF.bezug || undefined });
        ENTWURF = { art: ENTWURF.art, text: '', bezug: null }; ta.value = ''; zz.textContent = '0 / 1000'; zeichneBezug();
        setMsg(msg, ''); A().toast('Tipp gesendet');
        await A().reload();
      } catch (e) { setMsg(msg, e.message, true); } finally { senden.disabled = false; }
    });
    const V = vorschlaege(vn);
    const vb = V.length ? el('div', { class: 'tf-co-vor' }, el('small', { text: 'Vorschläge aus den Hinweisen' }), ...V.map((x) => {
      const b = el('button', { type: 'button', class: 'tf-co-chip' }, svgIco('i-spark'), x.titel.length > 44 ? x.titel.slice(0, 42) + ' …' : x.titel);
      b.addEventListener('click', () => { ENTWURF = { art: x.tipp.art, text: x.tipp.text, bezug: x.tipp.bezug || { typ: 'hinweis', id: x.id, titel: x.titel } }; ta.value = ENTWURF.text; zz.textContent = ta.value.length + ' / 1000'; zeichneArt(); zeichneBezug(); ta.focus(); });
      return b;
    })) : null;
    c.append(art, bez, el('label', { class: 'tf-lf tf-co-ta' }, ta), el('div', { class: 'tf-co-sendrow' }, zz, senden), msg, vb);
    return c;
  }
  function renderTipps() {
    const box = $('#coach-tipps-box'); if (!box) return;
    if (!an()) { box.replaceChildren(); TD.athlet = null; return; }
    const L = lage();
    if (!L.athlet) { T.kopf({ titel: 'Tipps', sub: 'Coach-Ansicht' }); TD.athlet = null; box.replaceChildren(el('div', { class: 'tf-hub' }, el('p', { class: 'tf-co-p', text: 'Verbinde zuerst einen Athleten – dann schreibst du hier Tipps.' }), linkKnopf('Athlet hinzufügen', 'coach/athleten'))); return; }
    const vn = kurzName(L.name);
    T.kopf({ titel: 'Tipps für ' + vn, sub: 'Was du schickst, sieht ' + vn + ' oben auf Heute' });
    if (A().state.status === 'loading') return;
    const liste = (rowsOf('coach_tipps') || []).slice().sort((x, y) => (String(x.at) < String(y.at) ? 1 : -1));
    // neue Antworten als gesehen markieren – einmal je Besuch und Athlet
    if (liste.some((t) => t.antwort && !t.antwort.gesehen) && TD.gesehenFuer !== L.athlet + '|' + liste.length) {
      TD.gesehenFuer = L.athlet + '|' + liste.length;
      A().api('POST', '/api/konto', { aktion: 'antworten_gesehen', athlet: L.athlet }).catch(() => {});
    }
    let form = box.querySelector('#coach-tipp-form');
    if (TD.athlet !== L.athlet || !form || TD.neu) { TD.athlet = L.athlet; TD.neu = false; form = composer(vn); box.replaceChildren(el('div', { class: 'tf-hub tf-co-seite' }, form, el('div', { id: 'coach-tipp-liste' }))); }
    const lb = box.querySelector('#coach-tipp-liste'), sig = JSON.stringify(liste.map((t) => [t.id, t.gelesen, t.antwort && t.antwort.at]));
    if (lb.dataset.sig === sig) return;
    lb.dataset.sig = sig;
    if (!liste.length) { lb.replaceChildren(sek('Gesendet', 'Noch nichts'), el('p', { class: 'tf-co-p', text: 'Noch keine Tipps an ' + vn + '. Ideen findest du im Überblick unter „Fällt dir auf“.' })); return; }
    lb.replaceChildren(sek('Gesendet', liste.length === 1 ? '1 Tipp' : liste.length + ' Tipps'), el('div', { class: 'tf-co-tl' }, ...liste.map((t) => {
      const z = tippZeile(t);
      const weg = bestaetigen('Zurücknehmen', 'Wirklich zurücknehmen?', async () => {
        try { await A().api('POST', '/api/konto', { aktion: 'tipp_weg', athlet: L.athlet, id: t.id }); A().toast('Tipp zurückgenommen'); await A().reload(); } catch (e) { A().toast(e.message, 5000); }
      });
      z.appendChild(el('div', { class: 'tf-co-t-f' }, weg));
      return z;
    })));
  }

  /* =====================================================================
     Athlet: Profil → Coach (einladen, Freigaben, Tipps)
     ===================================================================== */
  let UE = null, ueAt = 0, ueLaedt = false, NEU_CODE = null;
  async function uebersichtLaden() {
    if (ueLaedt) return; ueLaedt = true;
    try { UE = await A().api('GET', '/api/konto?coach=1'); ueAt = Date.now(); } catch (e) { UE = UE || { fehler: e.message }; ueAt = Date.now(); } finally { ueLaedt = false; }
    if (NEU_CODE && UE && Array.isArray(UE.einladungen) && !UE.einladungen.some((e) => e.id === NEU_CODE.id)) NEU_CODE = null; // eingelöst oder zurückgezogen
    if (T.tab() === 'coach-teilen') T.neu();
  }
  function rechteSchalter(rechte, onChange, praefix) {
    const box = el('div', { class: 'tf-co-r' });
    RECHTE.forEach(([k, n, sub]) => {
      const cb = el('input', { type: 'checkbox', id: praefix + '-' + k });
      cb.checked = !!rechte[k];
      cb.addEventListener('change', () => onChange(k, cb.checked, cb));
      box.appendChild(el('label', { class: 'tf-switch tf-co-r-z' }, cb, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, n, el('small', { text: sub }))));
    });
    return box;
  }
  let EINL_RECHTE = Object.assign({}, STANDARD);
  function einladenKarte() {
    const c = S.karte({ farbe: 'green', icon: 'i-plus', titel: 'Coach einladen', sub: 'Code erstellen und weitergeben', id: 'coach-einladen' });
    c.appendChild(el('p', { class: 'tf-co-p', text: 'Wähle, was dein Coach sehen darf. Er meldet sich mit seinem eigenen Konto an, wählt „Ich bin Coach“ und gibt den Code ein. Der Code gilt 7 Tage und nur einmal.' }));
    c.appendChild(rechteSchalter(EINL_RECHTE, (k, v) => { EINL_RECHTE[k] = v; }, 'einladen'));
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const los = knopf('Einladungscode erstellen', 'tf-btn-primary', async () => {
      los.disabled = true; setMsg(msg, 'Erstellt …');
      try { const j = await A().api('POST', '/api/konto', { aktion: 'coach_einladen', rechte: EINL_RECHTE }); NEU_CODE = j.einladung; setMsg(msg, ''); await uebersichtLaden(); }
      catch (e) { setMsg(msg, e.message, true); } finally { los.disabled = false; }
    }, { id: 'coach-code-erstellen' });
    c.appendChild(el('div', { class: 'tf-form-actions' }, los));
    c.appendChild(msg);
    return c;
  }
  function codeKarte(e) {
    const bis = new Date(e.bis), bisTxt = bis.getDate() + '.' + (bis.getMonth() + 1) + '.';
    const c = el('article', { class: 'tf-card tf-co-code', id: 'coach-code-karte' });
    const text = 'Ich lade dich als Coach in Dreiklang ein. Öffne ' + location.origin + location.pathname.replace(/index\.html$/, '') + ', wähle „Ich bin Coach“ und gib diesen Code ein: ' + e.code + ' (gültig bis ' + bisTxt + ').';
    const teilen = knopf(navigator.share ? 'Teilen' : 'Text kopieren', 'tf-btn-primary tf-btn-klein', async () => {
      try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); A().toast('Kopiert'); } } catch (x) { /* abgebrochen */ }
    }, { id: 'coach-code-teilen' });
    const kopie = knopf('Code kopieren', 'tf-btn-klein', async () => { try { await navigator.clipboard.writeText(e.code); A().toast('Kopiert'); } catch (x) { A().toast('Markiere den Code und kopiere ihn von Hand.'); } });
    c.append(el('small', { text: 'Dein Code für den Coach' }), el('b', { class: 'tf-co-code-w tf-mono', id: 'coach-code-wert', text: e.code }),
      el('p', { class: 'tf-co-p', text: 'Gültig bis ' + bisTxt + ' · nur einmal einlösbar · Freigaben: ' + RECHTE.filter(([k]) => e.rechte && e.rechte[k]).map(([, n]) => n).join(', ') }),
      el('div', { class: 'tf-form-actions' }, teilen, kopie));
    return c;
  }
  function coachZeile(x) {
    const c = el('article', { class: 'tf-card tf-co-c', 'data-uid': x.uid });
    c.appendChild(el('div', { class: 'tf-co-a-k' }, avatarVon(null, x.name, 40),
      el('div', { class: 'tf-co-a-t' }, el('b', { text: titelVon(x.name) }), el('small', { text: [x.email !== titelVon(x.name) ? x.email : null, 'seit ' + dm(String(x.seit || '').slice(0, 10)), x.zuletzt ? 'zuletzt angesehen ' + rel(x.zuletzt) : 'noch nicht angesehen'].filter(Boolean).join(' · ') }))));
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    c.appendChild(rechteSchalter(x.rechte || {}, async (k, v, cb) => {
      try { const j = await A().api('POST', '/api/konto', { aktion: 'coach_rechte', coach: x.uid, rechte: { [k]: v } }); x.rechte = j.rechte; setMsg(msg, v ? 'Freigegeben – gilt sofort.' : 'Zurückgenommen – gilt sofort.'); }
      catch (e) { cb.checked = !v; setMsg(msg, e.message, true); }
    }, 'coach-' + x.uid));
    c.appendChild(msg);
    c.appendChild(el('div', { class: 'tf-form-actions' }, bestaetigen('Zugriff beenden', 'Wirklich beenden?', async () => {
      try { await A().api('POST', '/api/konto', { aktion: 'coach_entfernen', coach: x.uid }); A().toast('Zugriff beendet'); await uebersichtLaden(); } catch (e) { A().toast(e.message, 5000); }
    }, { id: 'coach-entfernen-' + x.uid })));
    return c;
  }
  function antwortForm(t, fertig) {
    const f = el('div', { class: 'tf-co-antw' });
    const ta = el('textarea', { class: 'tf-input', rows: '3', maxlength: '1000', placeholder: 'Deine Antwort', 'aria-label': 'Deine Antwort' });
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const s = knopf('Antwort senden', 'tf-btn-primary tf-btn-klein', async () => {
      const text = ta.value.trim(); if (!text) return setMsg(msg, 'Schreib ein paar Worte.', true);
      s.disabled = true;
      try { const j = await A().api('POST', '/api/konto', { aktion: 'tipp_antwort', id: t.id, text }); tippLokal(j.tipp); A().toast('Antwort gesendet'); if (fertig) fertig(); }
      catch (e) { setMsg(msg, e.message, true); } finally { s.disabled = false; }
    });
    f.append(ta, el('div', { class: 'tf-form-actions' }, s), msg);
    setTimeout(() => ta.focus(), 30);
    return f;
  }
  function tippLokal(neu) { // den Tipp im Gerät ersetzen – die Startseite reagiert sofort
    const L = (A().raw('coach_tipps') || []).map((x) => (x.id === neu.id ? neu : x));
    A().patch('coach_tipps', L);
  }
  async function gelesen(t) {
    try { await A().api('POST', '/api/konto', { aktion: 'tipp_gelesen', id: t.id }); tippLokal(Object.assign({}, t, { gelesen: new Date().toISOString() })); }
    catch (e) { A().toast(e.message, 5000); }
  }
  function athletTippListe(liste) {
    return el('div', { class: 'tf-co-tl', id: 'coach-tipps-athlet' }, ...liste.map((t) => {
      const z = tippZeile(t, { athlet: true }), f = el('div', { class: 'tf-co-t-f' });
      if (!t.gelesen) f.appendChild(knopf('Gelesen', 'tf-btn-klein', () => gelesen(t)));
      if (!t.antwort) { const b = knopf('Antworten', 'tf-btn-klein', () => { b.replaceWith(antwortForm(t)); }); f.appendChild(b); }
      f.appendChild(bestaetigen('Entfernen', 'Wirklich entfernen?', async () => {
        try { await A().api('POST', '/api/konto', { aktion: 'tipp_loeschen', id: t.id }); A().patch('coach_tipps', (A().raw('coach_tipps') || []).filter((x) => x.id !== t.id)); } catch (e) { A().toast(e.message, 5000); }
      }));
      z.appendChild(f);
      return z;
    }));
  }
  function renderTeilen() {
    const box = $('#coach-teilen-box'); if (!box) return;
    if (an()) { box.replaceChildren(); return; }
    if (!UE || Date.now() - ueAt > 60e3) { if (!UE) box.replaceChildren(el('p', { class: 'tf-co-laedt', text: 'Lädt …' })); uebersichtLaden(); if (!UE) return; }
    const tipps = (rowsOf('coach_tipps') || []);
    const sig = JSON.stringify([UE, NEU_CODE, tipps.map((t) => [t.id, t.gelesen, !!t.antwort])]);
    if (box.dataset.sig === sig && box.childElementCount) return;
    if (box.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA') return; // nicht beim Schreiben neu zeichnen
    box.dataset.sig = sig;
    const C = UE.coaches || [], E = (UE.einladungen || []).filter((e) => !NEU_CODE || e.id !== NEU_CODE.id), teile = [];
    if (UE.fehler) teile.push(el('p', { class: 'tf-form-msg err', text: UE.fehler }));
    if (!C.length) {
      const s = S.karte({ farbe: 'blue', icon: 'i-team', titel: 'Mit deinem Coach teilen', sub: 'So funktioniert es', id: 'coach-so' });
      s.appendChild(el('ol', { class: 'tf-co-schritte' },
        el('li', null, el('b', { text: 'Einladen' }), el('span', { text: 'Wähle unten, was dein Coach sehen darf, und erstelle einen Code.' })),
        el('li', null, el('b', { text: 'Weitergeben' }), el('span', { text: 'Dein Coach meldet sich mit seinem eigenen Konto an, wählt „Ich bin Coach“ und gibt den Code ein. Dein Passwort bleibt bei dir.' })),
        el('li', null, el('b', { text: 'Tipps bekommen' }), el('span', { text: 'Dein Coach sieht deine Daten in seiner Coach-Ansicht – nur ansehen – und schickt dir Tipps. Die stehen oben auf Heute.' }))));
      s.appendChild(el('p', { class: 'tf-co-p tf-co-leise', text: 'Du bestimmst, was dein Coach sieht, und kannst den Zugriff jederzeit beenden.' }));
      teile.push(s);
    } else {
      teile.push(sek(C.length === 1 ? 'Dein Coach' : 'Deine Coaches', 'Freigaben gelten sofort'));
      C.forEach((x) => teile.push(coachZeile(x)));
    }
    const tippTeil = () => { // verbunden: die Tipps gleich unter dem Coach
      teile.push(sek('Tipps von deinem Coach', tipps.length ? (tipps.length === 1 ? '1 Tipp' : tipps.length + ' Tipps') : 'Noch keine'));
      teile.push(tipps.length ? athletTippListe(tipps) : el('p', { class: 'tf-co-p', text: 'Sobald dein Coach dir etwas schickt, steht es hier und oben auf Heute.' }));
    };
    if (C.length) tippTeil();
    if (NEU_CODE) teile.push(codeKarte(NEU_CODE));
    teile.push(sek(C.length ? 'Weiteren Coach einladen' : 'Einladen', 'Ein Code je Coach'), einladenKarte());
    if (E.length) {
      teile.push(sek('Offene Einladungen', E.length === 1 ? '1 Code noch nicht eingelöst' : E.length + ' Codes noch nicht eingelöst'));
      teile.push(el('div', { class: 'tf-co-tl' }, ...E.map((e) => el('article', { class: 'tf-card tf-co-offen' },
        el('div', { class: 'tf-co-a-t' }, el('b', { class: 'tf-mono', text: e.code }), el('small', { text: 'gültig bis ' + dm(String(e.bis).slice(0, 10)) })),
        bestaetigen('Zurückziehen', 'Wirklich zurückziehen?', async () => { try { await A().api('POST', '/api/konto', { aktion: 'coach_einladung_weg', id: e.id }); if (NEU_CODE && NEU_CODE.id === e.id) NEU_CODE = null; await uebersichtLaden(); } catch (x) { A().toast(x.message, 5000); } })))));
    }
    if (!C.length && tipps.length) tippTeil(); // ältere Tipps eines früheren Coaches
    // Selbst Coach?
    const sw = el('button', { type: 'button', class: 'tf-zeile', id: 'coach-ansicht-oeffnen' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-indigo)' }, svgIco('i-team')), el('span', { class: 'tf-zeile-t' }, el('b', { text: 'Coach-Ansicht öffnen' }), el('small', { text: (UE.athleten || []).length ? 'Du betreust ' + (UE.athleten.length === 1 ? '1 Athleten' : UE.athleten.length + ' Athleten') : 'Du betreust selbst Athleten? Hier geht es in deine Ansicht als Coach' })), svgIco('i-chev'));
    sw.lastChild.classList.add('tf-chev');
    sw.addEventListener('click', () => CO().wechseln('coach').catch((e) => A().toast(e.message, 5000)));
    teile.push(sek('Selbst Coach?', 'Ansicht wechseln'), el('div', { class: 'tf-links' }, sw));
    box.replaceChildren(el('div', { class: 'tf-hub tf-co-seite' }, ...teile));
  }

  /* =====================================================================
     Athlet: Heute – neue Tipps vom Coach
     ===================================================================== */
  let offenAntwort = null;
  function heuteKarte() {
    const box = $('#home-coach'); if (!box) return;
    if (an()) { if (box.childElementCount) box.replaceChildren(); return; }
    const neu = (rowsOf('coach_tipps') || []).filter((t) => !t.gelesen).sort((x, y) => (String(x.at) < String(y.at) ? 1 : -1));
    if (!neu.length) { if (box.childElementCount) box.replaceChildren(); offenAntwort = null; return; }
    const t = neu[0], sig = t.id + '|' + neu.length + '|' + (offenAntwort === t.id);
    if (box.dataset.sig === sig && box.childElementCount) return;
    box.dataset.sig = sig;
    const [an2, icon, farbe] = ART[t.art] || ART.allgemein;
    const c = el('article', { class: 'tf-card tf-co-hk', id: 'karte-coach', 'aria-labelledby': 'coach-tipp-titel' });
    c.appendChild(el('div', { class: 'tf-co-hk-k' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-blue)' }, svgIco('i-chat')),
      el('div', null, el('h2', { id: 'coach-tipp-titel', text: neu.length > 1 ? neu.length + ' neue Tipps von deinem Coach' : 'Neuer Tipp von deinem Coach' }), el('small', { text: (t.von_name || 'Dein Coach') + ' · ' + rel(t.at) }))));
    c.appendChild(el('span', { class: 'tf-co-art', style: artStil(farbe) }, svgIco(icon), an2));
    if (t.bezug && t.bezug.titel) c.appendChild(el('p', { class: 'tf-co-t-bez', text: 'Zu: ' + t.bezug.titel }));
    c.appendChild(el('p', { class: 'tf-co-t-x', id: 'coach-tipp-text-heute', text: t.text }));
    const akt = el('div', { class: 'tf-form-actions' });
    if (offenAntwort === t.id) c.appendChild(antwortForm(t, () => { offenAntwort = null; }));
    else {
      akt.appendChild(knopf('Gelesen', 'tf-btn-primary tf-btn-klein', () => gelesen(t), { id: 'coach-tipp-gelesen' }));
      akt.appendChild(knopf('Antworten', 'tf-btn-klein', () => { offenAntwort = t.id; heuteKarte(); }, { id: 'coach-tipp-antworten' }));
    }
    akt.appendChild(linkKnopf('Alle Tipps', 'profil/coach', 'coach-tipp-alle'));
    c.appendChild(akt);
    box.replaceChildren(c);
  }

  /* =====================================================================
     Profil in der Coach-Ansicht: das Konto des Coaches, nicht das des Athleten
     ===================================================================== */
  function profilHub(box) {
    const k = A().konto(), L = lage(), n = L.liste.length;
    const z = T.ui.zeile;
    const kopf = el('div', { class: 'tf-card tf-pf-kopf' }, el('span', { class: 'tf-pf-avatar', text: (L.ich || k.email || '?').charAt(0).toUpperCase() }),
      el('div', { class: 'tf-pf-kopf-t' }, el('b', { text: L.ich || k.email || 'Dein Konto' }), el('small', { text: 'Coach · ' + (n === 1 ? '1 Athlet' : n + ' Athleten') })));
    // Dein Name: so sehen dich deine Athleten bei Tipps und unter „Coach“ (leer: die E-Mail)
    const nameForm = el('form', { class: 'tf-card tf-co-bei', id: 'coach-name-form', novalidate: true });
    const nameIn = el('input', { class: 'tf-input', id: 'coach-name', type: 'text', maxlength: '30', autocomplete: 'name', spellcheck: 'false', placeholder: k.email || '' });
    nameIn.value = L.ich || '';
    const nameMsg = el('p', { class: 'tf-form-msg', role: 'status' });
    const nameLos = el('button', { type: 'submit', class: 'tf-btn', id: 'coach-name-speichern' }, 'Speichern');
    nameForm.append(el('label', { class: 'tf-lf' }, el('span', { text: 'Dein Name' }), nameIn), el('div', { class: 'tf-form-actions' }, nameLos), nameMsg);
    nameForm.addEventListener('submit', async (ev) => {
      ev.preventDefault(); nameLos.disabled = true; setMsg(nameMsg, 'Speichere …');
      try { const x = await CO().meinName(nameIn.value.trim()); A().toast(x ? 'Gespeichert – deine Athleten sehen „' + x + '“' : 'Gespeichert – deine Athleten sehen deine E-Mail'); } // die Seite baut sich danach neu
      catch (e) { setMsg(nameMsg, e.message, true); nameLos.disabled = false; }
    });
    const eigen = el('button', { type: 'button', class: 'tf-zeile', id: 'coach-zu-athlet' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-green)' }, svgIco('i-user')), el('span', { class: 'tf-zeile-t' }, el('b', { text: 'Zu deinem eigenen Training' }), el('small', { text: 'Dreiklang als Athlet nutzen – mit deinen eigenen Daten' })), svgIco('i-chev'));
    eigen.lastChild.classList.add('tf-chev');
    eigen.addEventListener('click', () => CO().wechseln('athlet').catch((e) => A().toast(e.message, 5000)));
    box.replaceChildren(el('div', { class: 'tf-hub' }, kopf,
      sek('Dein Name', 'So sehen dich deine Athleten bei Tipps'), nameForm,
      sek('Coaching', 'Athleten, Tipps und wie es funktioniert'),
      el('div', { class: 'tf-links', id: 'profil-gruppe-coach' }, z('coach/athleten', 'Deine Athleten', 'i-team', 'blue', 'Wechseln, hinzufügen, Betreuung beenden'), z('tipps', 'Tipps', 'i-chat', 'green', 'Was du schickst und was zurückkommt'), z('wissen/tutorial', 'Tutorial', 'i-question', 'gold', 'So funktioniert die Coach-Ansicht')),
      sek('Ansicht', 'Selbst trainieren?'), el('div', { class: 'tf-links' }, eigen),
      sek('App', 'Aussehen und Lesbarkeit'),
      el('div', { class: 'tf-links' }, z('profil/darstellung', 'Darstellung', 'i-sun', 'indigo', { auto: 'wie dein Gerät', light: 'hell', dark: 'dunkel' }[A().theme()] || ''), z('profil/bedienung', 'Bedienungshilfen', 'i-schrift', 'gray', window.tfBedienung ? window.tfBedienung.name() : 'Schriftgröße und Textmenge')),
      sek('Konto', 'Datenschutz und Methodik'),
      el('div', { class: 'tf-links' }, z('profil/konto', 'Konto & Datenschutz', 'i-lock', 'gray', 'Passwort, Daten herunterladen, abmelden'), z('wissen/methodik', 'So rechnet Dreiklang', 'i-book', 'gold', 'Jede Kennzahl mit Formel und Studie'))));
  }
  // Unterzeile für „Coach“ im Profil des Athleten
  function profilSub() {
    const n = (rowsOf('coach_tipps') || []).filter((t) => !t.gelesen).length;
    return n ? (n === 1 ? '1 neuer Tipp' : n + ' neue Tipps') : 'Einladen, Freigaben und Tipps von deinem Coach';
  }

  T.seite('coach', renderUeberblick);
  T.seite('coach-athleten', renderAthleten);
  T.seite('coach-tipps', renderTipps);
  T.seite('coach-teilen', renderTeilen);
  T.zusatz('heute', heuteKarte);
  T.zusatz('*', (tab) => { leiste(); if (tab !== 'coach-teilen') ueAt = 0; }); // wer „Coach“ wieder öffnet, sieht den neuen Stand
  window.tfCoach = { an, profilHub, profilSub, hinweise, tippVorbereiten, kurzName };
})();
