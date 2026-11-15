/* Dreiklang · Timer mit Ton (Version 9)
   Kurze Töne über Web Audio (ohne Tondateien), Vibration und eine Timer-Leiste unten am Bildschirm – für Satzpausen
   im Gym, Fokus-Blöcke im Alltag und als Signal in den Kurz-Routinen. Der Ton lässt sich überall abschalten
   (localStorage tf:ton, nur auf diesem Gerät). */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { el, svgIco, localDate } = T.ui;
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- Ton ---------- */
  let ctx = null;
  const tonAn = () => { try { return localStorage.getItem('tf:ton') !== '0'; } catch (e) { return true; } };
  function setTon(an) { try { localStorage.setItem('tf:ton', an ? '1' : '0'); } catch (e) { /* egal */ } zeichne(); }
  function audio() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { ctx = new AC(); } catch (e) { return null; } }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {});
    return ctx;
  }
  function piep(f, dauer, laut, wann) { // Sinuston mit weicher Hüllkurve (kein Knacken)
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (wann || 0), o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(laut || 0.25, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dauer + 0.03);
  }
  const MUSTER = {
    zaehlen: () => piep(660, 0.12, 0.18), // 3 – 2 – 1
    los: () => piep(988, 0.38, 0.3),
    wechsel: () => { piep(880, 0.14, 0.25); piep(880, 0.14, 0.25, 0.2); },
    ende: () => { piep(659, 0.18, 0.28); piep(880, 0.18, 0.28, 0.2); piep(1175, 0.42, 0.3, 0.4); },
    ein: () => piep(440, 0.28, 0.11), // Atemhilfe: leise und tief
    aus: () => piep(330, 0.34, 0.09),
  };
  function ton(art) { if (!tonAn()) return; try { (MUSTER[art] || MUSTER.wechsel)(); } catch (e) { /* ohne Ton weiter */ } }
  function vibriere(m) { try { if (navigator.vibrate) navigator.vibrate(m); } catch (e) { /* egal */ } }
  // Browser spielen Ton erst nach einer Berührung – beim Tippen auf Start den Ton „aufwecken“
  function wecken() { if (tonAn()) { const a = audio(); if (a) piep(20, 0.02, 0.0002); } }

  /* ---------- Timer-Leiste ---------- */
  let L = null, tick = null, sperre = null, bar = null, ausblenden = null;
  async function wachHalten() { try { if (navigator.wakeLock && !sperre) { sperre = await navigator.wakeLock.request('screen'); sperre.addEventListener('release', () => { sperre = null; }); } } catch (e) { sperre = null; } }
  function loslassen() { if (sperre) { try { sperre.release(); } catch (e) { /* egal */ } sperre = null; } }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && L && !L.pause) wachHalten(); });

  // o: { titel, sub, phasen: [{ name, sek, art: 'arbeit'|'pause' }], farbe, plus30, beimEnde, pille }
  // Version 13: pille = kleine schwebende Satzpause im Gym (Ring + Zeit, +30 s, überspringen); antippen klappt alle Knöpfe auf
  let pilleAuf = false;
  function start(o) {
    wecken();
    stopp(true);
    const P = (o.phasen || []).filter((p) => p && p.sek > 0);
    if (!P.length) return;
    L = Object.assign({}, o, { phasen: P, i: 0, pause: false }); pilleAuf = false;
    laden(0);
    ton(P[0].art === 'pause' ? 'wechsel' : 'los');
    clearInterval(tick); tick = setInterval(schritt, 250);
    wachHalten();
    zeichne();
  }
  function laden(i) { L.i = i; L.rest = L.phasen[i].sek * 1000; L.ende = Date.now() + L.rest; L.gezaehlt = 4; }
  function schritt() {
    if (!L || L.pause) return;
    L.rest = L.ende - Date.now();
    const s = Math.ceil(L.rest / 1000);
    if (s >= 1 && s <= 3 && s < L.gezaehlt) { L.gezaehlt = s; ton('zaehlen'); }
    if (L.rest <= 0) {
      if (L.i < L.phasen.length - 1) { laden(L.i + 1); ton(L.phasen[L.i].art === 'pause' ? 'wechsel' : 'los'); vibriere([60, 60, 60]); }
      else { ton('ende'); vibriere([120, 80, 120]); const fn = L.beimEnde; fertig(); if (fn) { try { fn(); } catch (e) { console.error(e); } } return; }
    }
    zeichne();
  }
  function setPause(p) {
    if (!L) return;
    if (p) { L.rest = L.ende - Date.now(); L.pause = true; loslassen(); }
    else { L.ende = Date.now() + L.rest; L.pause = false; wachHalten(); }
    zeichne();
  }
  function dazu(sek) { if (!L) return; if (L.pause) L.rest += sek * 1000; else L.ende += sek * 1000; L.gezaehlt = 4; zeichne(); }
  function weiter() { if (!L) return; if (L.i < L.phasen.length - 1) { laden(L.i + 1); ton('los'); zeichne(); } else { const fn = L.beimEnde; fertig(); if (fn) fn(); } }
  function fertig() {
    clearInterval(tick); tick = null; loslassen();
    const titel = L ? L.titel : '';
    L = null;
    if (!bar) return;
    bar.classList.add('fertig');
    bar.replaceChildren(el('span', { class: 'tf-timer-i' }, svgIco('i-check')), el('div', { class: 'tf-timer-t' }, el('b', { text: 'Zeit ist um' }), el('small', { text: titel })));
    clearTimeout(ausblenden); ausblenden = setTimeout(() => stopp(true), 4000);
  }
  function stopp(still) {
    clearInterval(tick); tick = null; clearTimeout(ausblenden); loslassen();
    L = null;
    if (bar) { bar.remove(); bar = null; }
    document.body.classList.remove('tf-timer-an', 'tf-timer-pille-an');
    if (!still) T.neu();
  }
  function knopf(icon, label, fn, cls) { const b = el('button', { type: 'button', class: 'tf-timer-k ' + (cls || ''), 'aria-label': label, title: label }, svgIco(icon)); b.addEventListener('click', fn); return b; }
  function zeichne() {
    if (!L) { if (bar && !bar.classList.contains('fertig')) { bar.remove(); bar = null; } return; }
    if (!bar) {
      bar = el('div', { class: 'tf-timer', role: 'region', 'aria-label': 'Timer' }); (document.getElementById('tf') || document.body).appendChild(bar);
      bar.addEventListener('click', (e) => { if (!L || !L.pille || e.target.closest('button')) return; pilleAuf = !pilleAuf; zeichne(); });
    }
    document.body.classList.add('tf-timer-an');
    bar.classList.remove('fertig');
    bar.classList.toggle('tf-timer-pille', !!L.pille && !pilleAuf); bar.classList.toggle('tf-timer-pille-auf', !!L.pille && pilleAuf);
    document.body.classList.toggle('tf-timer-pille-an', !!L.pille && !pilleAuf);
    const p = L.phasen[L.i], rest = L.pause ? L.rest : L.ende - Date.now(), anteil = Math.max(0, Math.min(1, 1 - rest / (p.sek * 1000)));
    bar.style.setProperty('--c', 'var(--tf-' + (p.art === 'pause' ? 'green' : L.farbe || 'blue') + ')');
    bar.style.setProperty('--an', anteil.toFixed(3));
    const naechste = L.phasen[L.i + 1];
    const sub = naechste ? 'Danach: ' + naechste.name + ' · ' + mmss(naechste.sek) : L.sub || (L.phasen.length > 1 ? 'Letzte Runde' : '');
    if (L.pille && !pilleAuf) { // Version 13: schwebende Pille
      bar.replaceChildren(
        el('span', { class: 'tf-timer-ring', 'aria-hidden': 'true' }),
        el('span', { class: 'tf-timer-zeit num', role: 'timer', 'aria-live': 'off', text: mmss(rest / 1000) }),
        el('div', { class: 'tf-timer-t' }, el('b', { text: p.name + (L.titel && p.name !== L.titel ? ' · ' + L.titel : '') }), el('small', { text: (L.pause ? 'Angehalten · ' : '') + sub })),
        el('div', { class: 'tf-timer-ks' }, L.plus30 ? knopf('i-plus', '30 Sekunden dazu', () => dazu(30), 'plus') : null, knopf('i-x', 'Pause überspringen', () => stopp(true), 'zu')));
      bar.setAttribute('title', 'Antippen für alle Knöpfe');
      return;
    }
    bar.removeAttribute('title');
    bar.replaceChildren(
      el('span', { class: 'tf-timer-zeit num', role: 'timer', 'aria-live': 'off', text: mmss(rest / 1000) }),
      el('div', { class: 'tf-timer-t' }, el('b', { text: p.name + (L.titel && p.name !== L.titel ? ' · ' + L.titel : '') }), el('small', { text: (L.pause ? 'Angehalten · ' : '') + sub })),
      el('div', { class: 'tf-timer-ks' },
        L.plus30 ? knopf('i-plus', '30 Sekunden dazu', () => dazu(30), 'plus') : null,
        L.phasen.length > 1 ? knopf('i-next', 'Nächster Abschnitt', weiter) : null,
        knopf(tonAn() ? 'i-ton' : 'i-stumm', tonAn() ? 'Ton aus' : 'Ton an', () => setTon(!tonAn())),
        knopf(L.pause ? 'i-play' : 'i-pause', L.pause ? 'Weiter' : 'Anhalten', () => setPause(!L.pause)),
        knopf('i-x', 'Timer beenden', () => stopp(true), 'zu')),
      el('i', { class: 'tf-timer-bar', 'aria-hidden': 'true' }));
  }

  /* ---------- Bausteine für andere Seiten ---------- */
  // Satz-Zähler mit Pause für eine Übung im Gym: „Satz geschafft“ startet die Pause bis zum nächsten Satz
  const SATZ = {};
  function satzKnopf(o) { // { id, name, saetze, ps }
    const key = localDate() + ':' + o.id, wrap = el('div', { class: 'tf-satz' });
    function bauen() {
      const n = SATZ[key] || 0, alle = n >= o.saetze;
      const punkte = el('span', { class: 'tf-satz-p', role: 'img', 'aria-label': n + ' von ' + o.saetze + ' Sätzen geschafft' }, ...Array.from({ length: o.saetze }, (_, i) => el('i', { class: i < n ? 'an' : '' })));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' + (alle ? '' : ' tf-btn-primary') }, alle ? svgIco('i-check') : null, alle ? ' Alle Sätze geschafft' : 'Satz ' + (n + 1) + ' geschafft' + (n + 1 < o.saetze && o.ps ? ' · Pause ' + mmss(o.ps) : ''));
      b.disabled = alle;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        SATZ[key] = n + 1;
        if (n + 1 < o.saetze && o.ps) start({ titel: o.name, sub: 'Dann Satz ' + (n + 2) + ' von ' + o.saetze, phasen: [{ name: 'Pause', sek: o.ps, art: 'pause' }], plus30: true, farbe: 'purple' });
        bauen();
      });
      const z = el('button', { type: 'button', class: 'tf-satz-z', 'aria-label': 'Sätze von ' + o.name + ' zurücksetzen', title: 'Zurücksetzen' }, svgIco('i-sync'));
      z.hidden = !n;
      z.addEventListener('click', (e) => { e.preventDefault(); SATZ[key] = 0; bauen(); });
      wrap.replaceChildren(punkte, b, z);
    }
    bauen();
    return wrap;
  }
  // Fokus-Block: Arbeit und Pause im Wechsel (Länge nach Dreiklang aus alltag-motor.js)
  function fokus(b, titel) {
    const P = [];
    for (let r = 0; r < b.runden; r++) {
      P.push({ name: 'Fokus ' + (r + 1) + ' von ' + b.runden, sek: b.arbeit * 60, art: 'arbeit' });
      if (r < b.runden - 1) P.push({ name: 'Pause – aufstehen, bewegen', sek: b.pause * 60, art: 'pause' });
    }
    start({ titel: titel || 'Fokus-Block', phasen: P, farbe: 'indigo' });
  }
  // Schalter „Ton an/aus“ für Einstellungen und den geführten Modus
  function tonKnopf(cls) {
    const b = el('button', { type: 'button', class: cls || 'tf-btn tf-btn-klein', 'aria-pressed': String(tonAn()) });
    const malen = () => { b.setAttribute('aria-pressed', String(tonAn())); b.setAttribute('aria-label', tonAn() ? 'Ton aus' : 'Ton an'); b.replaceChildren(svgIco(tonAn() ? 'i-ton' : 'i-stumm'), cls ? '' : tonAn() ? ' Ton an' : ' Ton aus'); };
    b.addEventListener('click', () => { setTon(!tonAn()); if (tonAn()) { wecken(); ton('zaehlen'); } malen(); });
    malen();
    return b;
  }

  // Für die Fokus-Ansicht im Gym (Version 10): Restzeit lesen, verlängern, überspringen
  function zustand() { if (!L) return null; const p = L.phasen[L.i]; return { rest: Math.max(0, L.pause ? L.rest : L.ende - Date.now()), sek: p.sek, name: p.name, art: p.art, pause: L.pause, titel: L.titel, sub: L.sub }; }

  window.tfTimer = { start, stopp, ton, tonAn, setTon, vibriere, wecken, satzKnopf, fokus, tonKnopf, laeuft: () => !!L, zustand, dazu, weiter, setPause };
})();
