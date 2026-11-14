/* Dreiklang · Einblicke (Version 9)
   „Was dich beeinflusst“ (Muster in deinen eigenen Daten), Frühwarnung mit Schutzmodus, Wetter für den Tag
   (Open-Meteo, freiwillig, Ort nur auf dem Gerät), „Wie voll ist dein Tag?“, wichtiger Termin mit Fahrplan,
   Wochenende gegen Wochentag (Social Jetlag), Fokus-Timer und „Dein Morgen in 3 Karten“ zum Durchtippen oder Vorlesen.
   Die Rechnungen stehen in alltag-motor.js. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, nf, iso, toDay, localDate, DAY, rowsOf, heute, svgIco, setMsg } = T.ui;
  const { karte, dot } = S;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const AL = () => window.tfAlltag;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const plusTage = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const tageBis = (d) => Math.round((toDay(d) - toDay(localDate())) / DAY);
  const uhr = (min) => { const t = M().uhrzeit(min); return t.charAt(0) === '0' ? t.slice(1) : t; };
  const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const datumLang = (d) => { const t = toDay(d); return WT_LANG[t.getUTCDay()] + ', ' + t.getUTCDate() + '.' + (t.getUTCMonth() + 1) + '.'; };
  const hmTxt = (h) => { const m = Math.round(h * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const lsLesen = (k, std) => { try { const v = localStorage.getItem(k); return v == null ? std : JSON.parse(v); } catch (e) { return std; } };
  const lsSchreiben = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } };
  const MEMO = new Map(); // Ergebnisse nur neu rechnen, wenn sich die Daten geändert haben
  function merk(key, teile, fn) { const m = MEMO.get(key); if (m && m.teile.length === teile.length && m.teile.every((x, i) => x === teile[i])) return m.r; const r = fn(); MEMO.set(key, { teile, r }); return r; }
  const liste = (L, cls) => el('ul', { class: cls || 'tf-tag-tipps' }, ...L.map(([i, t]) => el('li', null, svgIco(i), el('span', { text: t }))));
  const quelle = (t) => el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: t }));
  function zeile(icon, farbe, klein, gross, fn, id) {
    const b = el('button', { type: 'button', class: 'tf-zeile', id: id || null }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)), el('span', { class: 'tf-zeile-t' }, el('small', { text: klein }), el('b', { text: gross })), svgIco('i-chev'));
    b.lastChild.classList.add('tf-chev'); b.addEventListener('click', fn);
    return b;
  }

  // Übliche Aufstehzeit (Median der letzten 4 Wochen von der Uhr, sonst Profil, sonst 7 Uhr) und Schlafbedarf
  function ueblich() {
    const E = rowsOf('erholung') || [], a = athlet();
    const v = E.slice(-28).map((r) => (r.aufwach ? M().minVon(r.aufwach) : null)).filter((x) => x != null);
    const auf = v.length >= 5 ? M().median(v) : a.aufstehen_min ? +a.aufstehen_min : 420;
    const e = E[E.length - 1], bedarf = (e && e.bedarf_h ? e.bedarf_h * 60 : null) || +a.schlafbedarf_min || 480;
    return { auf: Math.round(auf), bedarf: Math.round(bedarf) };
  }
  const stoppUeblich = () => { const u = ueblich(); return M().tagesFenster({ aufwachMin: u.auf, schlafbedarfMin: u.bedarf }).koffein; };

  /* =====================================================================
     Frühwarnung und Schutzmodus
     ===================================================================== */
  function fw() {
    const ohne = T.ohne();
    return merk('fw', [rowsOf('erholung'), A().raw('checkins'), rowsOf('gefuehl'), localDate(), ohne], () => sicher(() => M().fruehwarnung({
      heute: localDate(), erholung: ohne ? [] : rowsOf('erholung') || [], checkins: A().raw('checkins') || [], gefuehl: ohne ? rowsOf('gefuehl') || [] : [],
    })) || { stufe: null, signale: [], werte: {}, verlauf: {} });
  }
  // Tage im Schutzmodus: Frühwarnung „Warnung“ oder „Ich fühle mich krank“ im Check-in (für die Wochenserie)
  function schutzTage() {
    const f = fw(), S2 = new Set(Object.keys(f.verlauf || {}).filter((d) => f.verlauf[d] === 'warnung'));
    (A().raw('checkins') || []).forEach((c) => { if (c && c.krank && c.date) S2.add(c.date); });
    if (window.tfTageslauf) tfTageslauf.pauseTage().forEach((d) => S2.add(d)); // Version 10: Pause-Modus
    return [...S2].sort();
  }
  function schutzWoche() { const m = M().montag(localDate()); return schutzTage().filter((d) => d >= m && d <= localDate()).length; }
  const SIGNAL = {
    puls: (w) => 'Ruhepuls ' + (w.puls >= 0 ? '+' : '−') + Math.abs(w.puls) + ' über deinem Normal',
    hrv: (w) => (w.hrv != null ? 'HRV ' + Math.abs(w.hrv) + ' % unter deinem Normal' : 'HRV deutlich unter deinem Normal'),
    atem: (w) => 'Atmung +' + nf(w.atem, 1) + ' Atemzüge pro Minute',
    krank: () => 'Krankheitsgefühl im Check-in',
  };
  const signalTexte = (f) => (f.signale || []).map((s) => SIGNAL[s](f.werte || {}));
  function fwBanner() {
    const box = $('#home-hinweise'); if (!box) return;
    const alt = box.querySelector('#hinweis-fw'), f = fw();
    if (!f.stufe || lsLesen('tf:fw-weg', null) === localDate() + ':' + f.stufe) { if (alt) alt.remove(); return; }
    const warn = f.stufe === 'warnung', nurKrank = f.signale.length === 1 && f.signale[0] === 'krank';
    const titel = warn ? (nurKrank ? 'Schutzmodus: Du fühlst dich krank' : 'Schutzmodus: Zeichen für einen Infekt') : 'Achtung: Deine Nachtwerte weichen ab';
    const text = (nurKrank ? '' : signalTexte(f).join(' · ') + '. ') + (warn ? 'Heute kein hartes Training, viel trinken, früh ins Bett. Deine Wochenserie ist geschützt.' : 'Das kann ein Infekt sein – oder Stress, Alkohol oder eine harte Woche. Heute lieber locker.');
    const mehr = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' + (warn ? ' tf-btn-primary' : '') }, warn ? 'Was jetzt hilft' : 'Mehr dazu');
    mehr.addEventListener('click', () => tfWissen.blatt(fwBlatt()));
    // Version 10: länger krank? Mit einem Tipp in den Pause-Modus
    const TL = window.tfTageslauf, pauseB = warn && TL && !TL.pause() ? el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, svgIco('i-pause'), ' Pause-Modus') : null;
    if (pauseB) pauseB.addEventListener('click', () => TL.pauseBlatt(nurKrank ? 'krank' : 'angeschlagen'));
    if (TL && TL.pause() && warn) { if (alt) alt.remove(); return; } // im Pause-Modus steht alles in der Pause-Karte
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Für heute ausblenden' }, svgIco('i-x'));
    const h = el('article', { class: 'tf-card tf-hinweis tf-hinweis-fw ' + f.stufe, id: 'hinweis-fw', role: 'status' },
      el('span', { class: 'tf-badge', style: '--c:var(--tf-' + (warn ? 'red' : 'orange') + ')' }, svgIco(warn ? 'i-shield' : 'i-alert')),
      el('div', null, el('b', { text: titel }), el('p', { text: text }), el('div', { class: 'tf-form-actions' }, mehr, pauseB)), x);
    x.addEventListener('click', () => { lsSchreiben('tf:fw-weg', localDate() + ':' + f.stufe); h.remove(); });
    if (alt) alt.replaceWith(h); else box.prepend(h);
  }
  function fwBlatt() {
    const f = fw(), warn = f.stufe === 'warnung', D = sicher(() => AL().tagDaten());
    const box = el('div', { class: 'tf-brief tf-fw-blatt' },
      el('h2', { id: 'sheet-titel', text: warn ? 'Schutzmodus' : f.stufe ? 'Frühwarnung' : 'Frühwarnung bei Infekten' }),
      el('p', { class: 'tf-brief-sub', text: warn ? 'Dein Körper braucht gerade Kraft für die Abwehr – Training kann warten.' : f.stufe ? 'Mehrere Werte liegen außerhalb deines Normals.' : 'Gerade ist alles im grünen Bereich. So funktioniert die Frühwarnung:' }));
    const teil = (icon, titel, ...kids) => box.appendChild(el('div', { class: 'tf-brief-teil' }, el('span', { class: 'tf-brief-i' }, svgIco(icon)), el('div', null, el('b', { text: titel }), ...kids)));
    if (f.signale.length) teil('i-heart', 'Was auffällt', el('ul', { class: 'tf-fw-liste' }, ...signalTexte(f).map((t) => el('li', { text: t }))));
    else teil('i-heart', 'Worauf Dreiklang achtet', el('p', { text: T.ohne() ? 'Deinen Ruhepuls aus dem Check-in (5 Schläge über deinem Normal) und ob du dich krank fühlst.' : 'Ruhepuls (5 Schläge über deinem Normal), HRV (deutlich unter deinem Normal) und Atemfrequenz in der Nacht (1 Atemzug pro Minute mehr). Zwei Zeichen in einer Nacht oder dasselbe Zeichen drei Nächte nacheinander lösen die Frühwarnung aus, drei Zeichen den Schutzmodus.' }));
    teil('i-shield', f.stufe ? 'Heute' : 'Wenn sie anschlägt', el('ul', { class: 'tf-fw-liste' }, ...[
      warn || !f.stufe ? 'Kein hartes Training. Fühlst du dich gut, sind 20–30 Minuten ganz locker in Ordnung – sonst Pause.' : 'Heute locker statt hart – oder ein Ruhetag. Morgen sieht die Lage oft schon anders aus.',
      'Fieber, Gliederschmerzen, Husten oder Durchfall: gar kein Training. Bei Fieber über 38 °C, Atemnot oder Brustschmerz ärztlich abklären lassen.',
      'Viel trinken, regelmäßig essen, früh ins Bett' + (D && D.f && f.stufe ? ' – heute um ' + uhr(D.f.bett) + ' Uhr.' : '.'),
      'Fühlst du dich krank, halte Abstand zu anderen.',
    ].map((t) => el('li', { text: t }))));
    teil('i-walk', 'Zurück ins Training', el('ol', { class: 'tf-steps' }, ...[
      'Erst wenn du dich wieder gesund fühlst und kein Fieber mehr hast.',
      'Zum Test 10–20 Minuten locker – etwa 60–70 % deines normalen Tempos.',
      '24 Stunden beobachten. Alles gut? Dann Schritt für Schritt mehr: erst länger, dann öfter, zuletzt härter.',
      'Hart erst wieder, wenn Ruhepuls und HRV zurück in deinem Normalbereich sind.',
      'Kommen Beschwerden zurück: stoppen und einen Schritt zurückgehen.',
    ].map((t) => el('li', { text: t }))));
    const st = schutzWoche();
    teil('i-flame', 'Deine Wochenserie', el('p', { text: 'Ist der Schutzmodus an mindestens zwei Tagen einer Woche aktiv – oder du hast „Ich fühle mich krank“ angekreuzt –, bleibt deine Wochenserie erhalten, auch wenn du das Wochenziel nicht schaffst.' + (st ? ' Diese Woche: ' + st + (st === 1 ? ' Tag' : ' Tage') + ' im Schutzmodus.' : '') }));
    teil('i-cal', 'Dein Plan', el('p', { text: 'Dreiklang ändert deinen Plan nicht von selbst. Schieb harte Einheiten lieber ein paar Tage nach hinten – Verpasstes musst du nicht nachholen.' }));
    box.append(el('p', { class: 'tf-note tf-bleibt', text: 'Die Frühwarnung ist keine Diagnose. Ruhepuls, HRV und Atmung verändern sich oft schon ein bis zwei Tage vor den ersten Beschwerden – aber auch nach Alkohol, Stress, Hitze oder einer harten Woche.' }),
      quelle('Mishra et al., Nat Biomed Eng 2020 · Quer et al., Nat Med 2021 · Miller et al., PLoS One 2020 · Schwellnus et al., Br J Sports Med 2022 (IOC-Konsens)'));
    if (window.tfWissen && tfWissen.begriff && tfWissen.begriff('krank')) {
      const w = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-book'), ' Infekt & Wiedereinstieg im Lexikon');
      w.addEventListener('click', () => tfWissen.zeige('krank'));
      box.appendChild(el('div', { class: 'tf-form-actions' }, w));
    }
    return box;
  }

  /* =====================================================================
     Was dich beeinflusst – Muster in deinen Daten (Lag 1: Tag gegen den Morgen danach; Version 13: für Training,
     volle Tage, späte Abende, Alkohol und Stress zusätzlich Lag 2 – der Morgen nach der zweiten Nacht)
     ===================================================================== */
  const FAKTOR_KURZ = { koffein_spaet: 'Spätes Koffein', koffein_viel: '3 oder mehr Kaffee', wasser: 'Trinkziel erreicht', protein: 'Eiweißziel erreicht', voll: 'Vollgepackter Tag', schritte: 'Viele Schritte', hart: 'Harte Minuten (Zone 4–5)', lang: 'Langes Training', beine: 'Schwerer Beintag', flow: 'Pilates, Yoga & Routinen', spaet_bett: 'Spät ins Bett', stress_morgen: 'Gestresster Morgen' };
  const ZIEL_KURZ = { hrv: 'HRV', rhr: 'Ruhepuls', schlaf: 'Schlafdauer', tief: 'Tiefschlaf', score: 'Tune', befinden: 'Befinden', stress: 'Entspannung', tagstress: 'Stress laut Uhr' };
  function faktorName(id) {
    if (id.indexOf('stack:') === 0) { const it = (AL().cfg().stack || []).find((x) => 'stack:' + x.id === id); return it ? it.n : 'Stack'; }
    if (id === 'koffein_spaet') return 'Koffein nach ' + uhr(stoppUeblich());
    if (id.indexOf('tag:') === 0) { const t = (M().CK_TAGS || []).find((x) => 'tag:' + x[0] === id); return t ? t[1] : 'Check-in'; } // Version 10: Ursachen-Tags aus dem Check-in
    return FAKTOR_KURZ[id] || id;
  }
  const kurzFund = (f) => faktorName(f.faktor) + ': ' + ZIEL_KURZ[f.ziel] + ' ' + (f.pct != null ? (f.pct > 0 ? '+' : '−') + Math.abs(Math.round(f.pct)) + ' %' : f.diff > 0 ? 'höher' : 'niedriger');
  const staerke = (g) => (Math.abs(g) >= 0.8 ? 'groß' : Math.abs(g) >= 0.5 ? 'mittel' : 'eher klein');
  function einfluss() {
    const rr = A().state.rechner || {}, ohne = T.ohne();
    const teile = [rowsOf('erholung'), A().raw('checkins'), A().raw('garmin_tage'), A().raw('tagebuch'), A().raw('garmin_einheiten'), rr.gym, rr.flow, rr.alltag, localDate(), ohne, rowsOf('athlet')];
    return merk('einfluss', teile, () => sicher(() => {
      const k = AL().cfg(), h = localDate(), von = plusTage(h, -121), tb = A().raw('tagebuch') || [], Z = AL().ziele(h);
      const wasserAm = {}; if (k.zeigen.w) tb.forEach((r) => { if (r && r.date >= von && r.date < h) wasserAm[r.date] = AL().ziele(r.date).w.ml; });
      return M().einfluss({
        heute: h, erholung: ohne ? [] : rowsOf('erholung') || [], checkins: A().raw('checkins') || [], tage: ohne ? [] : A().raw('garmin_tage') || [], tagebuch: tb,
        einheiten: ohne ? [] : A().raw('garmin_einheiten') || [], gym: (rr.gym && rr.gym.log) || [], flow: (rr.flow && rr.flow.log) || [], stack: k.zeigen.s ? k.stack : [],
        koffeinStopp: k.zeigen.k ? stoppUeblich() : null, wasserZiel: k.zeigen.w ? Z.w.ml : 0, wasserAm, proteinZiel: k.zeigen.p ? Z.p.g : 0,
      });
    })) || { tage: 0, getestet: 0, funde: [], faktoren: [] };
  }
  function fundZeile(f) {
    const z = (x) => nf(x, f.dez) + (f.einheit ? (f.einheit.charAt(0) === '/' ? f.einheit : ' ' + f.einheit) : '');
    const max = Math.max(Math.abs(f.m1), Math.abs(f.m2)) || 1;
    const balken = (wert, txt, an) => el('div', { class: 'tf-ef-b' + (an ? ' an' : '') }, el('span', { text: txt }), el('span', { class: 'tf-ef-bar' }, el('i', { style: 'width:' + ((100 * Math.abs(wert)) / max).toFixed(1) + '%' })), el('b', { class: 'num', text: z(wert) }));
    return el('div', { class: 'tf-ef-z ' + (f.gut ? 'gut' : 'schlecht') },
      el('span', { class: 'tf-ef-i' }, svgIco(f.gut ? 'i-spark' : 'i-alert')),
      el('div', { class: 'tf-ef-t' }, el('p', { text: M().einflussText(f, nf) }),
        el('div', { class: 'tf-ef-bs' }, balken(f.m1, 'mit', true), balken(f.m2, 'ohne', false)),
        el('small', { text: f.n1 + ' Tage mit · ' + f.n2 + ' ohne · Unterschied ' + staerke(f.g) })));
  }
  function leerInhalt(r) { // Version 11: statt Checkliste ruhige Fortschrittsbalken – „Noch 3 Morgen-Check-ins, bis …“
    const von = plusTage(localDate(), -120), tb = (A().raw('tagebuch') || []).filter((x) => x && x.date >= von);
    const ck = (A().raw('checkins') || []).filter((x) => x && x.date >= von).length, voll = tb.filter((x) => +x.v > 0).length;
    const N = 16, noch = S.noch;
    const L = [
      { ist: ck, titel: 'Morgen-Check-in', text: noch(N - ck, 'Morgen-Check-in', 'Morgen-Check-ins') + ', bis dein Gefühl am Morgen in den Vergleich einfließt.', fertig: 'Genug Check-ins für den Vergleich.', sub: nf(ck) + ' von ' + N + (ck === 1 ? ' Check-in' : ' Check-ins') },
      { ist: tb.length, titel: 'Tagebuch', text: noch(N - tb.length, 'Tag', 'Tage') + ' mit Trinken, Koffein oder Stack, bis sich zeigt, was davon wirkt.', fertig: 'Genug Tage notiert.', sub: nf(tb.length) + ' von ' + N + ' Tagen' },
      { ist: voll, titel: 'Wie voll war dein Tag?', text: voll ? noch(N - voll, 'Mal', 'Mal') + ' auf Heute antippen, wie voll dein Tag ist.' : 'Auf Heute antippen, wie voll dein Tag ist – 16 Tage reichen.', fertig: 'Genug Tage angetippt.', sub: nf(voll) + ' von ' + N + ' Tagen' },
    ].sort((a, b) => (a.ist >= N) - (b.ist >= N) || b.ist - a.ist); // offene zuerst, die fast fertigen oben
    return [
      el('p', { class: 'tf-ef-leer', text: r.getestet ? 'In ' + r.getestet + ' Vergleichen ist noch nichts deutlich genug. Das ist gut so: Dreiklang zeigt nur, was nicht nach Zufall aussieht.' : 'Für einen Vergleich braucht es je Gewohnheit mindestens 8 Tage mit und 8 Tage ohne. Meist zeigen sich Muster nach drei bis vier Wochen.' }),
      el('div', { class: 'tf-fs-liste' }, ...L.map((x) => S.fortschritt(Object.assign({ soll: N }, x)))),
      T.ohne() ? el('p', { class: 'tf-note', text: 'Mit Garmin kommen Schlaf, HRV und Training automatisch dazu.' }) : null,
    ].filter(Boolean);
  }
  // Version 10: „Was bringt dir am meisten?“ – die drei stärksten Gewohnheiten, je Gewohnheit der deutlichste Messwert
  function top3Karte(r) {
    const L = sicher(() => M().top3(r, 3)) || []; if (!L.length) return null;
    const c = karte({ farbe: 'pink', icon: 'i-trophy', titel: 'Was bringt dir am meisten?', sub: 'Deine Top ' + L.length + ' aus ' + r.tage + ' Tagen – sortiert nach der Stärke des Unterschieds', span2: true, id: 'karte-einfluss-top' });
    const z = (f, x) => nf(x, f.dez) + (f.einheit ? (f.einheit.charAt(0) === '/' ? f.einheit : ' ' + f.einheit) : '');
    c.appendChild(el('ol', { class: 'tf-top3' }, ...L.map((f, i) => el('li', null,
      el('span', { class: 'tf-top3-n num', text: String(i + 1) }),
      el('div', null, el('b', { text: f.label }), el('small', { text: (ZIEL_KURZ[f.ziel] || f.name) + (f.pct != null && Math.abs(f.pct) >= 1 ? ' ' + (f.pct > 0 ? '+' : '−') + nf(Math.abs(f.pct), 0) + ' %' : '') + ' · ' + z(f, f.wert) + ' statt ' + z(f, f.statt) + ' · Unterschied ' + staerke(f.g) }))))));
    c.appendChild(el('p', { class: 'tf-note', text: 'Bei schlechten Gewohnheiten steht hier das Gegenteil – also das, was dir hilft. Ausprobieren lohnt sich: Mini-Experimente findest du unter Wissen.' }));
    return c;
  }
  function renderEinfluss() {
    const box = $('#einfluss-box'); if (!box) return;
    const r = einfluss(), F = r.funde.slice(0, 6);
    const c1 = karte({ farbe: 'gold', icon: 'i-muster', titel: F.length ? (F.length === 1 ? 'Ein klares Muster' : F.length + ' klare Muster') : 'Noch keine klaren Muster', sub: r.tage ? r.tage + ' Tage ausgewertet · ' + r.getestet + ' Vergleiche' : 'Noch keine Daten aus den letzten 120 Tagen', span2: true, id: 'karte-einfluss' });
    if (F.length) c1.appendChild(el('div', { class: 'tf-ef-liste' }, ...F.map(fundZeile)));
    else c1.append(...leerInhalt(r));
    c1.appendChild(el('p', { class: 'tf-note', text: 'Eine Beobachtung, kein Beweis: Tage mit und ohne unterscheiden sich oft auch in anderem – etwa Training, Termine oder Alkohol. Willst du es genau wissen, ändere eine Sache ein paar Wochen lang ganz bewusst.' }));
    const c2 = karte({ farbe: 'indigo', icon: 'i-list', titel: 'Was verglichen wird', sub: 'Was du an einem Tag tust – gegen die Nacht und den Morgen danach, bei Training, vollen Tagen, späten Abenden und Alkohol auch zwei Nächte später', id: 'karte-einfluss-was' });
    const ziele = T.ohne() ? ['Ruhepuls (Check-in)', 'Schlafdauer (Check-in)', 'Befinden', 'Entspannung'] : ['HRV', 'Ruhepuls', 'Schlafdauer', 'Tiefschlaf', 'Tune', 'Befinden', 'Entspannung', 'Stress laut Uhr'];
    c2.append(el('span', { class: 'tf-form-l', text: 'Deine Gewohnheiten' }), el('div', { class: 'tf-ef-chips' }, ...(r.faktoren.length ? r.faktoren : ['koffein_viel', 'voll', 'stress_morgen']).map((id) => el('span', { class: 'tf-chip', text: faktorName(id) }))),
      el('span', { class: 'tf-form-l', text: 'Am nächsten Morgen' }), el('div', { class: 'tf-ef-chips' }, ...ziele.map((t) => el('span', { class: 'tf-chip', text: t }))));
    const zum = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-list'), ' Heute notiert');
    zum.addEventListener('click', () => T.geh('gesundheit/protokoll'));
    c2.appendChild(el('div', { class: 'tf-form-actions' }, zum));
    const c3 = karte({ farbe: 'gray', icon: 'i-scale', titel: 'So rechnet Dreiklang', sub: 'Damit Zufall nicht wie ein Muster aussieht', id: 'karte-einfluss-wie' });
    c3.append(el('ul', { class: 'tf-gym-ul' }, ...[
      'Je Gewohnheit und Messwert mindestens 8 Tage mit und 8 ohne – aus den letzten 120 Tagen.',
      'Für jeden Vergleich ein Welch-Test. Weil viele Vergleiche gleichzeitig laufen, korrigiert Dreiklang nach Benjamini-Hochberg: Von den gezeigten Funden wäre höchstens etwa jeder zehnte reiner Zufall.',
      'Gezeigt wird nur, was auch groß genug ist, um im Alltag zu zählen (Effektstärke ab 0,35).',
      'Training, volle Tage, späte Abende, Alkohol und Stress wirken oft verzögert. Dafür vergleicht Dreiklang zusätzlich den Morgen nach der zweiten Nacht. Hält ein Effekt beide Nächte an, steht er nur einmal da – mit dem Hinweis, dass er anhält.',
    ].map((t) => el('li', { text: t }))), quelle('Benjamini & Hochberg, J R Stat Soc B 1995 · Welch, Biometrika 1947 · Hedges, J Educ Stat 1981'));
    const top = top3Karte(r);
    box.replaceChildren(el('div', { class: 'tf-grid' }, top, c1, c2, c3));
  }
  function kurz() { // für die Kachel unter Gesundheit
    const r = einfluss();
    if (r.funde.length) return { wert: r.funde.length + ' Muster', txt: true, sub: kurzFund(r.funde[0]) };
    return { wert: r.tage >= 28 ? 'Kein klares Muster' : 'Sammelt Daten', txt: true, sub: r.tage + ' Tage · Muster meist nach 3–4 Wochen' };
  }

  /* =====================================================================
     Wetter (Open-Meteo): nur mit Ort, den du selbst wählst; der Ort bleibt auf diesem Gerät
     ===================================================================== */
  const WETTER_API = 'https://api.open-meteo.com/v1/forecast', ORT_API = 'https://geocoding-api.open-meteo.com/v1/search';
  const ortLesen = () => { const o = lsLesen('tf:wetter', null); return o && isFinite(o.lat) && isFinite(o.lon) && o.name ? o : null; };
  let WD = null, WL = null, WF = 0, ortSuche = false, ortTreffer = null;
  const wetterHat = (w, d) => !!(w && w.hourly && Array.isArray(w.hourly.time) && w.hourly.time.some((t) => String(t).slice(0, 10) === d));
  function wetter() {
    const o = ortLesen(); if (!o) return null;
    if (!WD) WD = lsLesen('tf:wetter-daten', null);
    const passt = !!(WD && WD.w && WD.lat === o.lat && WD.lon === o.lon);
    if ((!passt || Date.now() - WD.t > 3 * 3600e3 || !wetterHat(WD.w, localDate())) && !WL && Date.now() - WF > 10 * 60e3) wetterLaden(o);
    return passt && wetterHat(WD.w, localDate()) ? WD.w : null;
  }
  function wetterLaden(o) {
    const q = '?latitude=' + o.lat + '&longitude=' + o.lon + '&hourly=temperature_2m,apparent_temperature,precipitation_probability,cloud_cover,uv_index&daily=temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=2';
    WL = fetch(WETTER_API + q, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((w) => { if (!w || !w.hourly) throw new Error('keine Daten'); WD = { t: Date.now(), lat: o.lat, lon: o.lon, w }; lsSchreiben('tf:wetter-daten', WD); const t = T.tab(); if (t === 'heute' || t === 'tag') T.neu(); })
      .catch((e) => { WF = Date.now(); console.warn('Wetter:', e.message); })
      .then(() => { WL = null; });
  }
  function wetterHeute() { const w = wetter(); return w ? sicher(() => M().wetterTipps(w, { heute: localDate(), aufMin: ueblich().auf })) : null; }
  const hitze = () => { const t = wetterHeute(); return !!(t && t.hitze); };
  const chipsZeile = (t) => el('div', { class: 'tf-tag-fenster tf-wetter-chips' }, ...t.chips.map(([i, x]) => el('span', { class: 'tf-chip' }, svgIco(i), el('span', { text: x }))));
  async function ortSuchen(q, msg, liste2) {
    if (q.trim().length < 2) { setMsg(msg, 'Bitte mindestens zwei Buchstaben.', true); return; }
    setMsg(msg, 'Sucht …');
    try {
      const r = await fetch(ORT_API + '?name=' + encodeURIComponent(q.trim().slice(0, 60)) + '&count=6&language=de&format=json', { credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      ortTreffer = (j.results || []).map((x) => ({ name: String(x.name || '').slice(0, 40), region: [x.admin1, x.country].filter(Boolean).join(', ').slice(0, 60), lat: Math.round(x.latitude * 100) / 100, lon: Math.round(x.longitude * 100) / 100 }));
      setMsg(msg, ortTreffer.length ? '' : 'Nichts gefunden – anders schreiben?', !ortTreffer.length);
      zeigeTreffer(liste2);
    } catch (e) { setMsg(msg, 'Ortssuche gerade nicht erreichbar.', true); }
  }
  function zeigeTreffer(liste2) {
    liste2.replaceChildren(...(ortTreffer || []).map((o) => {
      const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-teal)' }, svgIco('i-pin')), el('span', { class: 'tf-zeile-t' }, el('b', { text: o.name }), el('small', { text: o.region })));
      b.addEventListener('click', () => { lsSchreiben('tf:wetter', { name: o.name, lat: o.lat, lon: o.lon }); WD = null; WF = 0; ortSuche = false; ortTreffer = null; T.neu(); A().toast('Wetter für ' + o.name); });
      return b;
    }));
  }
  function ortForm() {
    const inp = el('input', { class: 'tf-input', maxlength: 60, placeholder: 'z. B. Ingolstadt', 'aria-label': 'Ort suchen', enterkeyhint: 'search' });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' }), treffer = el('div', { class: 'tf-links tf-ort-treffer' });
    const such = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-search'), ' Suchen');
    such.addEventListener('click', () => ortSuchen(inp.value, msg, treffer));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ortSuchen(inp.value, msg, treffer); } });
    if (ortTreffer) zeigeTreffer(treffer);
    return el('div', { class: 'tf-ort' }, el('div', { class: 'tf-ort-suche' }, inp, such), msg, treffer,
      el('p', { class: 'tf-note', text: 'Dein Browser fragt das Wetter direkt bei Open-Meteo ab – nur mit dem auf etwa einen Kilometer gerundeten Ort. Dreiklang speichert den Ort nicht auf dem Server.' }));
  }
  function wetterKarte() {
    const o = ortLesen();
    const c = karte({ farbe: 'teal', icon: 'i-cloud', titel: o ? 'Wetter in ' + o.name : 'Wetter für deinen Tag', sub: o ? 'Licht, Regen, Hitze und UV für heute' : 'Freiwillig – für Tipps zu Licht, Regen, Hitze und UV', id: 'karte-wetter' });
    if (o) {
      const t = wetterHeute();
      if (t) {
        c.append(chipsZeile(t), liste(t.tipps));
        if (t.hitze) {
          const p = sicher(() => M().schweissProfil(((A().state.rechner || {}).schweiss || {}).tests || []));
          const hz = p && p.je && p.je.hitze;
          c.appendChild(el('p', { class: 'tf-note', text: hz ? 'Heiß heute: Dein Trinkziel rechnet fürs Training mit deiner Schweißrate bei Hitze (' + nf(hz.lh, 1) + ' l pro Stunde).' : 'Heiß heute: Trink nach Durst etwas mehr. Mit einem Schweißtest bei Hitze rechnet die App dein Trinkziel genauer.' }));
        }
      } else c.appendChild(el('p', { class: 'tf-note', text: WL ? 'Wetter lädt …' : 'Gerade keine Wetterdaten – die App versucht es gleich noch einmal.' }));
      const aendern = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, svgIco('i-pin'), ' Ort ändern');
      aendern.addEventListener('click', () => { ortSuche = !ortSuche; ortTreffer = null; T.neu(); });
      const aus = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-plain' }, 'Wetter ausschalten');
      aus.addEventListener('click', () => { lsSchreiben('tf:wetter', null); lsSchreiben('tf:wetter-daten', null); WD = null; ortSuche = false; T.neu(); A().toast('Wetter ausgeschaltet'); });
      if (ortSuche) c.appendChild(ortForm());
      c.append(el('div', { class: 'tf-form-actions' }, aendern, aus), quelle('Wetterdaten: Open-Meteo.com (CC BY 4.0) · Hitze: Racinais et al., Br J Sports Med 2015 · UV: WHO, Global Solar UV Index 2002'));
    } else c.appendChild(ortForm());
    return c;
  }

  /* =====================================================================
     „Wie voll ist dein Tag?“ (Tagesprotokoll v: 1 leicht · 2 normal · 3 vollgepackt)
     ===================================================================== */
  function vollWahl() {
    const h = localDate(), v = +(AL().tb(h).v || 0);
    const seg = el('div', { class: 'tf-seg tf-voll-seg', role: 'group', 'aria-label': 'Wie voll ist dein Tag?' });
    [[1, 'Leicht'], [2, 'Normal'], [3, 'Vollgepackt']].forEach(([n, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v === n) }, t);
      b.addEventListener('click', (e) => { e.stopPropagation(); AL().tbAendern(h, (x) => { if (+x.v === n) delete x.v; else x.v = n; }); T.neu(); });
      seg.appendChild(b);
    });
    return el('div', { class: 'tf-voll' }, el('span', { text: 'Wie voll ist dein Tag?' }), seg);
  }

  /* =====================================================================
     Wichtiger Termin: Countdown und Fahrplan für die Woche davor (rechner.alltag.termine)
     ===================================================================== */
  const ARTEN = () => M().TERMIN_ART;
  function termine() { const c = AL().cfg(); return (Array.isArray(c.termine) ? c.termine : []).filter((t) => t && /^\d{4}-\d\d-\d\d$/.test(t.d) && ARTEN()[t.art]); }
  function termineSpeichern(L) { const c = AL().cfg(); c.termine = L; AL().cfgSpeichern(c); }
  const kommende = () => termine().filter((t) => t.d >= localDate()).sort((x, y) => (x.d + (x.t || '') < y.d + (y.t || '') ? -1 : 1));
  const naechster = () => kommende()[0] || null;
  const terminTitel = (t) => (t.n ? t.n : ARTEN()[t.art][0]);
  const countdown = (k, klein) => (k === 0 ? (klein ? 'heute' : 'Heute') : k === 1 ? (klein ? 'morgen' : 'Morgen') : (klein ? 'in ' : 'In ') + k + ' Tagen');
  function terminPlan(t, tag) { const u = ueblich(); return M().terminPlan({ heute: tag || localDate(), termin: t, aufMin: u.auf, bedarfMin: u.bedarf }); }
  let terminOffen = false;
  function terminForm(msg) {
    const h = localDate();
    const nIn = el('input', { class: 'tf-input', maxlength: 40, placeholder: 'z. B. Statistik-Klausur', 'aria-label': 'Name des Termins' });
    const aIn = el('select', { class: 'tf-input', 'aria-label': 'Art' }, ...Object.entries(ARTEN()).map(([id, [n]]) => el('option', { value: id, text: n })));
    const dIn = el('input', { class: 'tf-input', type: 'date', min: h, max: plusTage(h, 365), value: plusTage(h, 7), 'aria-label': 'Datum' });
    const tIn = el('input', { class: 'tf-input', type: 'time', step: 900, 'aria-label': 'Uhrzeit (optional)' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Termin speichern');
    ok.addEventListener('click', () => {
      const d = dIn.value, t = /^\d\d:\d\d$/.test(tIn.value) ? tIn.value : null, n = nIn.value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40);
      if (!/^\d{4}-\d\d-\d\d$/.test(d) || d < h) { setMsg(msg, 'Bitte ein Datum ab heute wählen.', true); return; }
      const L = termine().filter((x) => x.d >= plusTage(h, -7)); // Vergangenes räumt sich nach einer Woche auf
      if (L.length >= 10) { setMsg(msg, 'Höchstens 10 Termine – lösch bitte einen.', true); return; }
      let id; do { id = Math.random().toString(36).slice(2, 8); } while (L.some((x) => x.id === id));
      L.push(Object.assign({ id, d, art: aIn.value, e: h }, t ? { t } : {}, n ? { n } : {})); // e: eingetragen am (für die Schrittweite)
      termineSpeichern(L); terminOffen = false; T.neu(); A().toast('Termin gespeichert');
    });
    return el('div', { class: 'tf-termin-form' },
      el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Was steht an?' }), nIn), el('label', { class: 'tf-field' }, el('span', { text: 'Art' }), aIn)),
      el('div', { class: 'tf-gym-2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Datum' }), dIn), el('label', { class: 'tf-field' }, el('span', { text: 'Beginn (für den Wecker)' }), tIn)),
      el('div', { class: 'tf-form-actions' }, ok, msg));
  }
  function terminKarte() {
    const L = kommende(), t0 = L[0], k = t0 ? tageBis(t0.d) : null, P = t0 && k <= 60 ? terminPlan(t0) : null, msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const c = karte({ farbe: 'red', icon: 'i-flag', titel: t0 ? terminTitel(t0) : 'Wichtiger Termin', sub: t0 ? countdown(k) + ' · ' + datumLang(t0.d) + (t0.t ? ', ' + t0.t + ' Uhr' : '') : 'Prüfung, Präsentation, Bergtour – Dreiklang plant die Woche davor', span2: !!(P && k <= 7), id: 'karte-termin' });
    if (P && k <= 7) {
      if (P.schritte) { // Aufstehzeiten bis zum Termin
        const tage = []; for (let i = 0; i <= k; i++) { const d = plusTage(localDate(), i), Pi = terminPlan(t0, d); tage.push([d, Pi ? Pi.aufHeute : null, i === k]); }
        c.appendChild(el('div', { class: 'tf-termin-leiste', role: 'list', 'aria-label': 'Aufstehen bis zum Termin' }, ...tage.map(([d, a, ziel]) => el('div', { class: 'tf-termin-tag' + (ziel ? ' ziel' : '') + (d === localDate() ? ' heute' : ''), role: 'listitem' }, el('small', { text: d === localDate() ? 'Heute' : WT_LANG[toDay(d).getUTCDay()].slice(0, 2) }), el('b', { class: 'num', text: a == null ? '–' : uhr(a) }), el('span', { text: ziel ? ARTEN()[t0.art][0] : 'aufstehen' })))));
      }
      c.appendChild(liste(P.tipps, 'tf-tag-tipps gross'));
    } else if (t0) c.appendChild(el('p', { class: 'tf-note', style: 'margin-top:0', text: 'Eine Woche vorher zeigt Dreiklang hier deinen Fahrplan: Schlaf, Aufstehzeit und Training.' }));
    if (L.length) {
      c.appendChild(el('div', { class: 'tf-kw-liste' }, ...L.map((t) => {
        const x = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': terminTitel(t) + ' löschen' }, svgIco('i-x'));
        x.addEventListener('click', () => { termineSpeichern(termine().filter((y) => y.id !== t.id)); T.neu(); A().toast('Termin gelöscht'); });
        return el('div', { class: 'tf-kw-z' }, el('span', { class: 'tf-kw-n' }, el('b', { text: terminTitel(t) }), el('small', { text: ARTEN()[t.art][0] + ' · ' + datumLang(t.d) + (t.t ? ', ' + t.t : '') + ' · ' + countdown(tageBis(t.d), true) })), x);
      })));
    }
    if (terminOffen || !L.length) c.appendChild(terminForm(msg));
    else {
      const neu = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-plus'), ' Termin eintragen');
      neu.addEventListener('click', () => { terminOffen = true; T.neu(); });
      c.appendChild(el('div', { class: 'tf-form-actions' }, neu));
    }
    c.appendChild(quelle('Burgess et al., J Biol Rhythms 2003 · Okano et al., npj Sci Learn 2019 · Chang et al., Brain Res 2012 · Bosquet et al., Med Sci Sports Exerc 2007'));
    return c;
  }

  /* =====================================================================
     Wochenende gegen Wochentag (Social Jetlag)
     ===================================================================== */
  function sjl() {
    if (T.ohne()) return null;
    return merk('sjl', [rowsOf('erholung'), localDate()], () => sicher(() => M().socialJetlag({ heute: localDate(), erholung: rowsOf('erholung') || [] })));
  }
  function sonntagPlan(s) { // Sonntag: Fenster so, dass Montag zur Werktags-Zeit klappt
    const u = ueblich(), bett = s.werkAuf + 1440 - u.bedarf - 15;
    return { auf: s.werkAuf + 60, bett: Math.floor(bett / 15) * 15, koffein: Math.floor((bett - 528) / 15) * 15, essen: Math.floor((bett - 180) / 15) * 15 };
  }
  function sjlInhalt(s, mitPlan) {
    const wt = M().wtag(localDate()), sp = sonntagPlan(s), teile = [];
    teile.push(el('div', { class: 'tf-kv tf-kv-2' },
      el('div', null, el('small', { text: 'Vor Arbeitstagen' }), el('span', { class: 'num', text: uhr(s.werkBett) + ' – ' + uhr(s.werkAuf) }), el('em', { text: 'Bett – aufstehen' })),
      el('div', null, el('small', { text: 'Am Wochenende' }), el('span', { class: 'num', text: uhr(s.freiBett) + ' – ' + uhr(s.freiAuf) }), el('em', { text: 'Median der letzten 4 Wochen' }))));
    teile.push(el('p', { class: 'tf-note', text: 'Am Wochenende liegt die Mitte deines Schlafs ' + hmTxt(s.sjl_h) + ' Stunden später. Montags muss der Körper dann früher funktionieren, als er eingestellt ist – wie ein kleiner Jetlag.' }));
    if (mitPlan && (wt === 5 || wt === 6)) {
      teile.push(el('span', { class: 'tf-form-l', text: wt === 6 ? 'Heute, damit der Montag leichter wird' : 'Dieses Wochenende' }));
      teile.push(el('div', { class: 'tf-tag-fenster' }, ...(wt === 6 ? [['i-sun', 'Raus ans Licht, bald nach dem Aufstehen'], ['i-coffee', 'Koffein bis ' + uhr(sp.koffein)], ['i-food', 'Essen bis ' + uhr(sp.essen)], ['i-moon', 'Bett ' + uhr(sp.bett)]] : [['i-sun', 'Morgen aufstehen bis ' + uhr(sp.auf)], ['i-moon', 'Lieber früher ins Bett als lange schlafen']]).map(([i, t]) => el('span', { class: 'tf-chip' }, svgIco(i), el('span', { text: t })))));
    }
    teile.push(liste([
      ['i-sun', 'Am Wochenende höchstens etwa eine Stunde länger schlafen – ' + (s.werkAuf + 60 < 1440 ? 'also bis ' + uhr(s.werkAuf + 60) + ' Uhr.' : 'lieber abends früher ins Bett.')],
      ['i-walk', 'Morgens bald raus ans Licht, auch am Wochenende: Spätes Aufstehen ohne Morgenlicht verschiebt die innere Uhr nach hinten.'],
      ['i-moon', 'Sonntagabend zur Werktags-Zeit ins Bett – etwa ' + uhr(s.werkBett) + ' Uhr.'],
    ]));
    teile.push(quelle('Wittmann et al., Chronobiol Int 2006 · Roenneberg et al., Curr Biol 2012 · Burgess & Eastman, Neurosci Lett 2006 · Crowley & Carskadon, Chronobiol Int 2010'));
    return teile;
  }
  function sjlKarte() {
    const s = sjl(); if (!s || s.sjl_h < 1) return null;
    const c = karte({ farbe: 'purple', icon: 'i-moon', titel: 'Wochenende gegen Wochentag', sub: 'Schlafmitte ' + hmTxt(s.sjl_h) + ' h später am Wochenende', id: 'karte-sjl' });
    c.append(...sjlInhalt(s, true));
    return c;
  }
  function sjlBlatt(s) {
    return el('div', { class: 'tf-brief' }, el('h2', { id: 'sheet-titel', text: M().wtag(localDate()) === 6 ? 'Sonntag: so wird der Montag leichter' : 'Wochenende ohne Montags-Jetlag' }), ...sjlInhalt(s, true));
  }
  // Erwartete Aufstehzeit morgen, wenn sie früher liegt als sonst (Termin-Fahrplan, Montag nach dem Wochenende)
  function aufMorgen() {
    const t = naechster();
    if (t && tageBis(t.d) >= 1 && tageBis(t.d) <= 7) { const P = terminPlan(t); if (P && P.aufMorgen < P.aufMin) return { min: P.aufMorgen, grund: 'Morgen ' + uhr(P.aufMorgen) + ' aufstehen für „' + terminTitel(t) + '“' }; }
    const s = sjl();
    if (s && s.sjl_h >= 1 && M().wtag(localDate()) === 6) return { min: s.werkAuf, grund: 'Morgen ist Montag – Aufstehen um ' + uhr(s.werkAuf) };
    return null;
  }

  /* =====================================================================
     Fokus-Timer (Länge nach Tagestyp)
     ===================================================================== */
  function fokusKarte(D) {
    if (!window.tfTimer) return null;
    const b = M().fokusBlock(D.typ.id);
    const c = karte({ farbe: 'indigo', icon: 'i-timer', titel: 'Fokus-Timer', sub: b.runden + ' × ' + b.arbeit + ' min konzentriert, dazwischen ' + b.pause + ' min Pause', id: 'karte-fokus' });
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-play'), ' Fokus starten');
    los.addEventListener('click', () => tfTimer.fokus(b, D.typ.titel));
    c.append(el('p', { class: 'tf-note', style: 'margin-top:0', text: D.typ.id === 'fokus' ? 'Heute geht mehr: zwei lange Blöcke, am besten in deinem Fokus-Fenster (' + uhr(D.f.fokus[0]) + '–' + uhr(D.f.fokus[1]) + ' Uhr).' : D.typ.id === 'schon' ? 'Heute kurze Blöcke – nach wenig Schlaf lässt die Aufmerksamkeit schneller nach.' : 'Kurze Blöcke mit echten Pausen halten die Konzentration länger oben. In der Pause aufstehen und ein paar Schritte gehen.' }),
      el('div', { class: 'tf-form-actions' }, los, tfTimer.tonKnopf()), quelle('Albulescu et al., PLoS One 2022 · Lim & Dinges, Psychol Bull 2010'));
    return c;
  }

  /* =====================================================================
     Dein Morgen in 3 Karten – durchtippen oder vorlesen lassen
     ===================================================================== */
  const WISSEN_TAG = ['schlafhygiene', 'koffein', 'trinken_alltag', 'hrv_alltag', 'schlafrhythmus', 'mikropausen', 'fruehwarnung', 'hitze', 'korrelation', 'wichtiger_tag', 'schlafbedarf'];
  function morgenKarten() {
    const h = localDate(), H = heute(), ohne = T.ohne(), D = sicher(() => AL().tagDaten()) || null, f = fw();
    const g = (rowsOf('gefuehl') || []).find((r) => r.date === h) || null, e = (rowsOf('erholung') || []).find((r) => r.date === h) || null;
    const K = [];
    // 1 · Status
    {
      const st = !ohne && H && H.date === h && H.score != null ? { score: H.score, label: H.label, ampel: H.ampel, grund: H.grund } : g ? { score: g.score, label: g.label, ampel: g.ampel, grund: g.grund } : null;
      const fakten = [];
      if (e && e.schlaf_hm) fakten.push(['i-moon', 'Schlaf ' + e.schlaf_hm + ' h' + (e.leistung_pct != null ? ' – ' + e.leistung_pct + ' % deines Bedarfs' : '')]);
      else if (g && g.schlaf_h) fakten.push(['i-moon', 'Schlaf ' + nf(g.schlaf_h, 1) + ' h']);
      if (e && e.hrv_delta_txt) fakten.push(['i-wave', 'HRV ' + e.hrv_delta_txt + ' gegen dein Normal']);
      if (e && e.rhr_delta_txt) fakten.push(['i-heart', 'Ruhepuls ' + e.rhr_delta_txt + ' Schläge gegen dein Normal']);
      if (f.stufe) fakten.unshift([f.stufe === 'warnung' ? 'i-shield' : 'i-alert', f.stufe === 'warnung' ? 'Schutzmodus: heute kein hartes Training' : 'Frühwarnung: Nachtwerte weichen ab']);
      const grund = st ? (st.grund ? st.grund + '.' : 'Nichts bremst dich heute.') : 'Noch keine Werte für heute.';
      K.push({ farbe: st ? { gruen: 'green', gelb: 'yellow', rot: 'red' }[st.ampel] || 'blue' : 'gray', icon: 'i-ring', klein: 'Dein Status', gross: st ? st.score + ' %' : '–', titel: st ? st.label + (ohne ? ' (nach Gefühl)' : '') : 'Mach zuerst den Check-in', text: grund, fakten,
        lesen: st ? 'Dein Tune heute: ' + st.score + ' Prozent, ' + st.label + '. ' + grund + ' ' + fakten.map((x) => x[1]).join('. ') + '.' : 'Für heute gibt es noch keine Werte. Mach zuerst den Check-in.' });
    }
    // 2 · Fokus
    {
      const L = sicher(() => (window.tfPlan && tfPlan.tag ? tfPlan.tag(h) : [])) || [], fakten = [];
      L.forEach((s) => fakten.push(['i-bolt', ((s.D && s.D.titel) || 'Einheit') + ' · ' + s.min + ' min']));
      if (L.some((s) => s.hart === 2) && ((H && H.ampel === 'rot') || f.stufe === 'warnung')) fakten.push(['i-alert', 'Tune niedrig – heute lieber locker statt hart.']);
      const t = naechster();
      if (t && tageBis(t.d) <= 7) { const P = terminPlan(t), k = tageBis(t.d); fakten.push(['i-flag', terminTitel(t) + ' ' + countdown(k, true) + (P && k > 0 ? ' – heute um ' + uhr(P.bettHeute) + ' ins Bett' + (P.aufMorgen < P.aufMin ? ', Wecker ' + uhr(P.aufMorgen) : '') : '')]); }
      let titel = 'Ruhetag', text = '';
      if (D) {
        titel = L.length ? (L.length === 1 ? 'Eine Einheit im Plan' : L.length + ' Einheiten im Plan') : D.typ.titel;
        const tp = sicher(() => AL().tipps(D)) || [];
        text = tp.length ? tp[0][1] : '';
        if (D.f) fakten.push(['i-target', 'Konzentration am besten ' + uhr(D.f.fokus[0]) + '–' + uhr(D.f.fokus[1]) + ' Uhr']);
      }
      K.push({ farbe: 'blue', icon: 'i-target', klein: 'Dein Fokus', gross: D ? D.typ.titel : 'Heute', titel, text, fakten, lesen: 'Dein Fokus heute: ' + titel + '. ' + text + ' ' + fakten.map((x) => x[1]).join('. ') + '.' });
    }
    // 3 · Quick-Win
    {
      const Z = sicher(() => AL().ziele(h)), fakten = [], w = wetterHeute();
      if (Z) fakten.push(['i-glass', 'Trinken: ' + nf(Z.w.ml / 1000, 1) + ' Liter über den Tag'], ['i-egg', 'Eiweiß: ' + Z.p.g + ' g, verteilt auf 3–4 Mahlzeiten']);
      if (w && w.tipps[0]) fakten.push(w.tipps[0]);
      const B = (id) => (window.tfWissen && tfWissen.begriff ? tfWissen.begriff(id) : null), wh = sicher(() => AL().wissenHeute());
      const pool = WISSEN_TAG.map(B).filter(Boolean), wb = (wh && B(wh[0])) || (pool.length ? pool[Math.floor(toDay(h).getTime() / DAY) % pool.length] : null);
      K.push({ farbe: 'gold', icon: 'i-spark', klein: 'Dein Quick-Win', gross: 'Heute', titel: wb ? wb.name : 'Kleine Schritte', text: wb ? wb.kurz : '', fakten, wissen: wb ? wb.id : null,
        lesen: 'Dein Quick-Win: ' + fakten.map((x) => x[1]).join('. ') + '. ' + (wb ? 'Wissen für heute: ' + wb.name + '. ' + wb.kurz : '') });
    }
    return K;
  }
  function morgenBlatt() {
    const K = morgenKarten();
    let i = 0, spricht = false;
    const kannLesen = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    const fort = el('div', { class: 'tf-mk-fort', 'aria-hidden': 'true' }, ...K.map(() => el('i')));
    const buehne = el('div', { class: 'tf-mk-buehne', 'aria-live': 'polite' });
    const zur = el('button', { type: 'button', class: 'tf-btn' }, 'Zurück'), vor = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Weiter');
    const lesen = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-mk-lesen' }, svgIco('i-ton'), ' Vorlesen');
    function kartenEl(k) {
      const c = el('div', { class: 'tf-mk-karte', style: '--c:var(--tf-' + k.farbe + ')' },
        el('div', { class: 'tf-mk-kopf' }, el('span', { class: 'tf-mk-i' }, svgIco(k.icon)), el('small', { text: k.klein })),
        el('b', { class: 'tf-mk-gross num', text: k.gross }), el('h3', { text: k.titel }), k.text ? el('p', { text: k.text }) : null,
        k.fakten.length ? liste(k.fakten, 'tf-tag-tipps tf-mk-fakten') : null);
      if (k.wissen) { const w = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, svgIco('i-book'), ' Mehr dazu'); w.addEventListener('click', (e) => { e.stopPropagation(); stopp(); tfWissen.zeige(k.wissen); }); c.appendChild(w); }
      return c;
    }
    function zeig() {
      [...fort.children].forEach((x, j) => { x.className = j < i ? 'fertig' : j === i ? 'an' : ''; });
      buehne.replaceChildren(kartenEl(K[i]));
      zur.disabled = i === 0;
      vor.textContent = i === K.length - 1 ? 'Fertig' : 'Weiter';
    }
    function geh(d) { if (i + d < 0) return; if (i + d >= K.length) { stopp(); tfWissen.schliessen(); return; } i += d; zeig(); }
    function stopp() { if (kannLesen) { try { speechSynthesis.cancel(); } catch (e) { /* egal */ } } spricht = false; lesen.replaceChildren(svgIco('i-ton'), ' Vorlesen'); }
    function sprich() { // liest ab der aktuellen Karte alle Karten nacheinander
      const sh = document.getElementById('sheet');
      if (!spricht || !box.isConnected || (sh && sh.hidden)) { stopp(); return; }
      const u = new SpeechSynthesisUtterance(K[i].lesen.replace(/\s+/g, ' ').replace(/ \./g, '.'));
      u.lang = 'de-DE'; u.rate = 1;
      const v = speechSynthesis.getVoices().find((x) => /^de(-|_|$)/i.test(x.lang)); if (v) u.voice = v;
      u.onend = () => { if (!spricht) return; if (i < K.length - 1) { i++; zeig(); sprich(); } else stopp(); };
      u.onerror = () => stopp();
      speechSynthesis.speak(u);
    }
    lesen.addEventListener('click', () => { if (spricht) { stopp(); return; } spricht = true; lesen.replaceChildren(svgIco('i-stumm'), ' Stopp'); try { speechSynthesis.cancel(); } catch (e) { /* egal */ } sprich(); });
    zur.addEventListener('click', () => { stopp(); geh(-1); });
    vor.addEventListener('click', () => { stopp(); geh(1); });
    buehne.addEventListener('click', (e) => { if (e.target.closest('button')) return; const r = buehne.getBoundingClientRect(); stopp(); geh(e.clientX - r.left < r.width * 0.35 ? -1 : 1); });
    const box = el('div', { class: 'tf-mk', tabindex: '-1' }, el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: 'Dein Morgen in 3 Karten' }), fort, buehne, el('div', { class: 'tf-mk-akt' }, zur, kannLesen ? lesen : null, vor));
    box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); stopp(); geh(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); stopp(); geh(-1); } });
    const sh = document.getElementById('sheet');
    if (sh && window.MutationObserver) { const mo = new MutationObserver(() => { if (sh.hidden || !box.isConnected) { stopp(); mo.disconnect(); } }); mo.observe(sh, { attributes: true, attributeFilter: ['hidden'] }); }
    zeig();
    return box;
  }
  const morgenOeffnen = () => tfWissen.blatt(morgenBlatt());

  /* =====================================================================
     Heute, Dein Tag, Check-in und Plan
     ===================================================================== */
  function heuteZeilen() { // Zeilen unter „Wissen für heute“
    const L = [], h = localDate(), std = new Date().getHours();
    const daten = (rowsOf('befinden') || []).some((r) => r.date === h) || (heute() && heute().date === h);
    if (std >= 4 && std < 13 && daten) L.push(zeile('i-karten', 'blue', 'In 10 Sekunden', 'Dein Morgen in 3 Karten', morgenOeffnen, 'zeile-morgen'));
    const t = naechster();
    if (t && tageBis(t.d) <= 7) {
      const P = terminPlan(t), k = tageBis(t.d);
      L.push(zeile('i-flag', 'red', terminTitel(t) + ' · ' + countdown(k, true), P && P.phase !== 'heute' ? 'Heute um ' + uhr(P.bettHeute) + ' ins Bett' + (P.aufMorgen < P.aufMin ? ', Wecker ' + uhr(P.aufMorgen) : '') : P && P.tipps[0] ? P.tipps[0][1] : 'Dein Fahrplan', () => T.geh('heute/tag'), 'zeile-termin'));
    }
    const s = sjl(), wt = M().wtag(h);
    if (s && s.sjl_h >= 1 && (wt === 6 || (wt === 5 && std >= 12)) && std < 22) L.push(zeile('i-moon', 'purple', wt === 6 ? 'Sonntag' : 'Wochenende', wt === 6 ? 'So wird der Montag leichter' : 'Morgen nicht zu lange schlafen', () => tfWissen.blatt(sjlBlatt(s)), 'zeile-sjl'));
    return L;
  }
  function heuteZusatz() {
    fwBanner();
    const c = $('#karte-tag');
    if (!c || c.querySelector('.tf-voll')) return;
    const kopf = c.querySelector('.tf-tag-kopf');
    if (kopf) kopf.after(vollWahl());
    const t = wetterHeute(), fe = c.querySelector('.tf-tag-fenster');
    if (t && t.chips.length && fe) fe.before(chipsZeile(t));
    if (t && t.tipps.length) { const ul = c.querySelector('.tf-tag-tipps'), tipp = t.tipps.find((x) => x[0] !== 'i-sun') || t.tipps[0]; if (ul && ul.children.length >= 3) ul.lastChild.remove(); if (ul) ul.appendChild(el('li', null, svgIco(tipp[0]), el('span', { text: tipp[1] }))); }
  }
  function tagZusatz() {
    const g = $('#tag-box > .tf-grid'); if (!g) return;
    const D = sicher(() => AL().tagDaten()); if (!D) return;
    const c1 = g.querySelector('#karte-tag-typ'), c2 = g.querySelector('#karte-tag-fenster');
    if (c1 && !g.querySelector('.tf-voll')) c1.querySelector('.tf-card-head').after(vollWahl());
    const t0 = naechster(), nah = t0 && tageBis(t0.d) <= 7;
    const tk = sicher(terminKarte), wk = sicher(wetterKarte), fk = sicher(() => fokusKarte(D)), sk = sicher(sjlKarte);
    let nach = c1 || g.firstChild;
    [nah ? tk : null, wk, fk].forEach((k) => { if (k && nach) { nach.after(k); nach = k; } });
    if (sk) (c2 || nach).after(sk);
    if (tk && !nah) g.appendChild(tk);
  }
  function checkinZusatz() {
    const k = $('#karte-checkin'); if (!k) return;
    const alt = k.querySelector('#ck-morgen'), da = (A().raw('checkins') || []).some((c) => c && c.date === localDate());
    if (!da || new Date().getHours() >= 14) { if (alt) alt.remove(); return; }
    if (alt) return;
    const b = zeile('i-karten', 'blue', 'Check-in gespeichert', 'Dein Morgen in 3 Karten', morgenOeffnen, 'ck-morgen');
    b.classList.add('tf-ck-morgen');
    k.appendChild(b);
  }
  // Für den Plan auf Heute: Hinweis im Schutzmodus
  function planHinweis() {
    const P = window.tfTageslauf && tfTageslauf.planHinweis ? tfTageslauf.planHinweis() : null; // Version 10: Pause-Modus geht vor
    if (P) return P;
    const f = fw(); if (f.stufe !== 'warnung') return null;
    const p = el('p', { class: 'tf-pl-tf tf-pl-schutz' }, dot('red'), el('span', { text: 'Schutzmodus: heute kein hartes Training – locker oder Pause. Der Plan bleibt, wie er ist; du entscheidest. ' }));
    const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Was jetzt hilft');
    b.addEventListener('click', (e) => { e.stopPropagation(); tfWissen.blatt(fwBlatt()); });
    p.lastChild.appendChild(b);
    return p;
  }

  T.seite('einfluss', renderEinfluss);
  T.zusatz('heute', heuteZusatz);
  T.zusatz('tag', tagZusatz);
  T.zusatz('befinden', checkinZusatz);
  window.tfEinblick = { fw, schutzTage, fwBlatt, einfluss, kurz, wetter, wetterHeute, hitze, aufMorgen, heuteZeilen, planHinweis, morgenBlatt, naechster, sjl };
})();
