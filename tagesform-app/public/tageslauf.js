/* Dreiklang · Tageslauf (Version 10)
   1. Abend-Check (ab 19 Uhr, seit Version 19 drei Stunden vor deiner Bettzeit): wie dein Tag war, Schlafenszeit, „Kopf leeren“,
      das Wichtigste für morgen und „Tag abschließen“ –
      Aufschreiben vor dem Schlafen hilft beim Einschlafen (Scullin et al., J Exp Psychol Gen 2018).
      Notizen bleiben nur auf diesem Gerät (localStorage), sie gehen nicht an den Server.
   2. Morgenliste: das Wichtigste, das du dir abends notiert hast – abhaken per Tippen oder Wischen.
   3. Nachmittagstief: Power-Nap mit Wecker oder kurzer Spaziergang – je nach Uhrzeit und Schlafdefizit.
   4. Pause-Modus: krank, angeschlagen oder Auszeit – Serie geschützt, kein Trainingsdruck, danach Wiedereinstieg in Stufen.
      Gespeichert in rechner.pause (geräteübergreifend, nur für dich sichtbar).
   Version 11:
   5. Schnellstart: an deinem Gym- oder Pilates-Tag zur gewohnten Uhrzeit eine Zeile auf Heute – ohne Suchen.
   6. Willkommen zurück: nach 4 Tagen ohne Eintrag eine ruhige Karte statt Warnungen – auf Wunsch eine sanfte Woche (rechner.sanft).
   7. Für gestern nachtragen: bis 12 Uhr Check-in sowie Trinken & Eiweiß für gestern – damit keine Serie an einem müden Abend reißt.
   8. Kontext aus dem Check-in: nach einer schlechten Nacht oder viel Stress ein vorsichtigerer Koffein-Hinweis und abends die
      passende Atemübung (Balban et al., Cell Rep Med 2023 · Laborde et al., Neurosci Biobehav Rev 2022). */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, nf, localDate, rowsOf, svgIco, wischen } = T.ui;
  const warum = (t, q) => (T.ui.warum ? T.ui.warum(t, q) : null);
  const { dot } = S;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const AL = () => window.tfAlltag;
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const lsLesen = (k, std) => { try { const v = localStorage.getItem(k); return v == null ? std : JSON.parse(v); } catch (e) { return std; } };
  const lsSchreiben = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } };
  const uhr = (min) => { const t = M().uhrzeit(((min % 1440) + 1440) % 1440); return t.charAt(0) === '0' ? t.slice(1) : t; };
  const jetztMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const morgenVon = (d) => M().plus(d, 1);
  const quelle = (t) => el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: t }));
  // Der Abend gehört zum Tag davor, bis um 4 Uhr der neue beginnt
  const abendTag = () => { const d = new Date(); if (d.getHours() < 4) d.setDate(d.getDate() - 1); return localDate(d); };

  /* =====================================================================
     Kontext aus dem Morgen-Check-in (Version 11): schlecht geschlafen oder gestresst?
     ===================================================================== */
  function kontext(h) {
    const ck = (A().raw('checkins') || []).find((c) => c && c.date === h) || null;
    const tg = (A().raw('garmin_tage') || []).find((t) => t && t.date === h) || null;
    const schlecht = !!(ck && +ck.schlaf > 0 && +ck.schlaf <= 2), stress = !!(ck && +ck.stress > 0 && +ck.stress <= 2) || !!(tg && +tg.stress_avg >= 50);
    const atem = stress
      ? { id: 'seufzer', name: 'Atem-Seufzer', grund: ck && +ck.stress <= 2 ? 'Du warst heute gestresst – zweimal ein, lange aus bringt dich schnell runter.' : 'Deine Uhr hat heute viel Stress gemessen – zweimal ein, lange aus bringt dich schnell runter.', warum: 'Das lange Ausatmen beruhigt das Nervensystem. In einer Studie hob fünf Minuten Atem-Seufzer am Tag die Stimmung stärker als Meditation.', quelle: 'Balban et al., Cell Rep Med 2023' }
      : schlecht ? { id: 'box', name: 'Box-Atmung', grund: 'Nach der schlechten Nacht hilft ein ruhiger Übergang in den Schlaf: 4 Sekunden ein, halten, aus, halten.', warum: 'Langsames, gleichmäßiges Atmen senkt Puls und Anspannung – ein guter Übergang in die Nacht.', quelle: 'Laborde et al., Neurosci Biobehav Rev 2022' } : null;
    return { ck, schlecht, stress, atem };
  }

  /* =====================================================================
     1. Abend-Check – Version 19: „Dein Abend“ mit Tagesabschluss
     Beginn drei Stunden vor deiner Bettzeit (eigene Zeit unter Profil → Schlaf & Abend, sonst 19 Uhr). Die Karte sagt,
     wie der Tag war – Plan gegen erledigt, ob die Einheit ihren Zweck getroffen hat (Einheiten-Check), was morgen ansteht –
     und schließt den Tag mit einer kurzen Einschätzung ab (nur auf diesem Gerät, tf:abschluss:<Datum>).
     ===================================================================== */
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const setMsg = (m, t, fehler) => (T.ui.setMsg ? T.ui.setMsg(m, t, fehler) : (m.textContent = t));
  const dauerTxt = (m) => { m = Math.round(+m || 0); return m >= 60 ? Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + '\u00a0h' : m + '\u00a0min'; };
  // Beginn des Abends in Minuten ab Mitternacht: drei Stunden vor dem Bett, zwischen 16 und 22 Uhr; ohne eigene Zeit 19 Uhr
  function abendAb() {
    const a = athlet();
    const b = a.bett_min != null ? +a.bett_min : a.schlafen_min != null ? +a.schlafen_min - 15 : null;
    return b == null || !isFinite(b) ? 19 * 60 : Math.max(16 * 60, Math.min(22 * 60, b - 180));
  }
  function tagInZahlen(h, ohneTraining) {
    const L = [];
    const tg = (A().raw('garmin_tage') || []).find((t) => t.date === h);
    if (tg && +tg.steps > 0) L.push(['i-steps', nf(+tg.steps) + ' Schritte']);
    if (!ohneTraining) {
      const EH = (A().raw('garmin_einheiten') || []).filter((e) => e && e.date === h && !e.is_parent && (+e.moving_s || +e.dur_s) >= 300);
      const rc = A().state.rechner || {}, app = [...((rc.gym && rc.gym.log) || []), ...((rc.flow && rc.flow.log) || [])].filter((x) => x && x.d === h);
      const min = EH.reduce((s, e) => s + Math.min(360, (+e.moving_s || +e.dur_s) / 60), 0) + (EH.length ? 0 : app.reduce((s, x) => s + (+x.min || 0), 0));
      if (min >= 5) L.push(['i-flame', Math.round(min) + ' min Training']);
    }
    const R = sicher(() => (window.tfSpiel && tfSpiel.stand ? tfSpiel.stand() : null));
    if (R && R.quests && R.quests.heute && R.heute === h) { const f = R.quests.heute.filter((q) => q.fertig).length; L.push(['i-star', f + ' von ' + R.quests.heute.length + ' Quests']); }
    const tb = sicher(() => AL().tb(h)), z = sicher(() => AL().ziele(h));
    if (tb && z && +tb.w > 0) L.push(['i-glass', nf(+tb.w / 1000, 1) + ' von ' + nf(z.w.ml / 1000, 1) + ' l getrunken']);
    return L;
  }

  // Hat die Einheit ihren Zweck getroffen? Geplante Art gegen den Befund aus den Sekundendaten (calcs: einheiten_check)
  const LOCKER = ['locker'], QUALI = ['schwelle', 'hart', 'test'], ZUEGIG = ['mittel', 'sweetspot', 'renn'];
  function befund(art, c, angepasst) {
    if (!c) return null;
    if (LOCKER.includes(art)) {
      if (c.typ === 'locker' && !c.ego) return { ton: 'gut', t: 'Locker wie geplant' };
      if (c.ego) return { ton: 'achtung', t: 'Locker mit Spitzen – kostet Erholung ohne echten Reiz' };
      if (c.typ === 'grauzone' || c.typ === 'qualitaet') return { ton: 'achtung', t: 'Härter als geplant – für eine lockere Einheit zu viel' };
      if (c.typ === 'renntempo') return { ton: 'achtung', t: 'Renntempo statt locker' };
      return { ton: 'neutral', t: c.titel };
    }
    if (QUALI.includes(art)) {
      if (c.typ === 'qualitaet') return { ton: 'gut', t: 'Reiz gesetzt' };
      if (c.typ === 'locker') return { ton: 'neutral', t: angepasst ? 'Locker – passend zu deinem Tune' : 'Lockerer als geplant' };
      return { ton: 'neutral', t: c.titel };
    }
    if (ZUEGIG.includes(art)) {
      if (c.typ === 'renntempo' || c.typ === 'grauzone' || c.typ === 'qualitaet') return { ton: 'gut', t: c.typ === 'renntempo' ? 'Im Renntempo wie geplant' : 'Zügig wie geplant' };
      if (c.typ === 'locker') return { ton: 'neutral', t: angepasst ? 'Locker – passend zu deinem Tune' : 'Lockerer als geplant' };
      return { ton: 'neutral', t: c.titel };
    }
    return { ton: c.ton === 'achtung' ? 'achtung' : 'neutral', t: c.titel };
  }

  // Der Tag in einer Bilanz: Zeilen je Einheit, ein Satz als Fazit und was morgen ansteht
  function bilanzTag(h) {
    const P = sicher(() => (window.tfPlan && tfPlan.tagStatus ? tfPlan.tagStatus(h) : null));
    const B = (rowsOf('belastung') || []).filter((b) => b && b.date === h && (+b.min || 0) >= 5 && b.sport !== 'wechsel');
    const C = new Map((rowsOf('einheiten_check') || []).filter((c) => c && c.date === h).map((c) => [c.id, c]));
    const H = T.ui.heute ? sicher(() => T.ui.heute()) : null, rot = !!(H && H.date === h && H.ampel === 'rot');
    const zeilen = [], benutzt = new Set();
    const E = P && P.einheiten ? P.einheiten.filter((e) => !e.rennen) : [];
    E.forEach((e) => {
      const eigeneB = e.garmin ? B.filter((b) => b.sport === e.garmin && !benutzt.has(b.id)) : [];
      eigeneB.forEach((b) => benutzt.add(b.id));
      const haupt = eigeneB.slice().sort((x, y) => (+y.min || 0) - (+x.min || 0))[0], c = haupt ? C.get(haupt.id) : null;
      const kopf = e.sportName + ' · ' + e.titel;
      if (e.ok) {
        const ist = e.istMin != null ? e.istMin : null, teile = [];
        if (ist != null && e.min) teile.push(dauerTxt(ist) + ' von ' + dauerTxt(e.min));
        else if (e.min) teile.push(dauerTxt(e.min) + ' geplant · abgehakt');
        const bf = befund(e.art, c, e.angepasst);
        let ton = bf ? bf.ton : 'gut';
        if (bf) teile.push(bf.t);
        const kuerzer = ist != null && e.min && ist < 0.75 * e.min;
        if (kuerzer) { teile.push('kürzer als geplant'); if (ton === 'gut') ton = 'neutral'; }
        else if (ist != null && e.min && ist > 1.3 * e.min && e.min >= 20) { teile.push('länger als geplant'); if (ton === 'gut') ton = 'neutral'; }
        zeilen.push({ ton, kopf, sub: teile.join(' · '), kuerzer: !!kuerzer });
      } else {
        const hartArt = QUALI.includes(e.art) || ZUEGIG.includes(e.art);
        zeilen.push({ ton: rot ? 'gut' : 'offen', kopf, sub: dauerTxt(e.min) + ' geplant · ' + (rot ? (hartArt ? 'ausgelassen – bei Tune rot richtig so' : 'ausgelassen – bei Tune rot in Ordnung') : 'nicht gemacht – nicht nachholen, einfach nach Plan weiter') });
      }
    });
    // Zusätzlich: Einheiten von der Uhr ohne Platz im Plan, dazu Gym und Pilates & Yoga aus der App
    const NAME = { swim: 'Schwimmen', bike: 'Rad', run: 'Laufen', kraft: 'Kraft', other: 'Sonstiges' };
    B.filter((b) => !benutzt.has(b.id) && !b.eigen).forEach((b) => {
      const c = C.get(b.id);
      zeilen.push({ ton: c && c.ton === 'achtung' ? 'achtung' : 'neutral', kopf: (NAME[b.sport] || b.sportart || 'Training') + ' · ' + (b.name || 'ohne Plan'), sub: dauerTxt(b.min) + (E.length || (P && P.imPlan) ? ' · zusätzlich' : '') + (c ? ' · ' + c.titel : ''), extra: true });
    });
    const rc = A().state.rechner || {}, planSport = new Set(E.map((e) => e.sport));
    [['kraft', 'Gym', (rc.gym && rc.gym.log) || []], ['mobil', 'Pilates & Yoga', (rc.flow && rc.flow.log) || []]].forEach(([sp, name, log]) => {
      if (planSport.has(sp)) return;
      const min = log.filter((x) => x && x.d === h).reduce((s, x) => s + (+x.min || 0), 0);
      if (min >= 5 && !(sp === 'kraft' && B.some((b) => b.sport === 'kraft'))) zeilen.push({ ton: 'neutral', kopf: name, sub: dauerTxt(min) + (E.length ? ' · zusätzlich' : ''), extra: true });
    });
    // Fazit in einem Satz
    const g = E.length, ok = E.filter((e) => e.ok).length, achtung = zeilen.filter((z) => z.ton === 'achtung' && !z.extra).length, kurzN = zeilen.filter((z) => z.kuerzer).length;
    const rennen = P && P.einheiten ? P.einheiten.find((e) => e.rennen) : null;
    let fazit, ton;
    if (rennen) { fazit = B.length ? 'Renntag geschafft – jetzt zählt nur noch Erholung' : 'Renntag'; ton = 'gut'; }
    else if (!P || !P.imPlan) { fazit = B.length ? 'Heute ' + dauerTxt(B.reduce((s, b) => s + (+b.min || 0), 0)) + ' trainiert' : 'Heute ohne Training'; ton = 'neutral'; }
    else if (!g) { fazit = zeilen.length ? 'Ruhetag im Plan – trotzdem trainiert' : 'Ruhetag – Erholung gehört zum Plan'; ton = zeilen.length ? 'neutral' : 'gut'; }
    else if (ok === g) { fazit = achtung ? 'Plan erfüllt, ' + (achtung === 1 ? 'eine Einheit war' : achtung + ' Einheiten waren') + ' härter als geplant' : kurzN ? 'Plan erfüllt, ' + (kurzN === 1 ? 'eine Einheit' : kurzN + ' Einheiten') + ' kürzer als geplant' : 'Plan erfüllt'; ton = achtung ? 'achtung' : kurzN ? 'neutral' : 'gut'; }
    else if (ok) { fazit = ok + ' von ' + g + ' Einheiten erledigt'; ton = 'neutral'; }
    else { fazit = rot ? 'Heute Pause – bei Tune rot genau richtig' : 'Heute nicht trainiert – morgen geht es nach Plan weiter'; ton = rot ? 'gut' : 'neutral'; }
    // Morgen
    const mT = M().plus(h, 1), mL = sicher(() => (window.tfPlan && tfPlan.tag ? tfPlan.tag(mT) : [])) || [];
    const mH = mL.find((s) => s.typ === 'rennen') || mL.slice().sort((x, y) => (+y.min || 0) - (+x.min || 0))[0];
    const morgen = mH ? { titel: String(mH.D && mH.D.titel || '').replace(/[.!]$/, ''), min: mH.min, rennen: mH.typ === 'rennen', mehr: mL.length - 1, gross: mH.typ === 'rennen' || (+mH.min || 0) >= 120 || (mH.D && ['schwelle', 'hart', 'test', 'renn'].includes(mH.D.art)) } : (P && P.imPlan !== false && sicher(() => tfPlan.hat()) ? { ruhe: true } : null);
    return { zeilen, fazit, ton, morgen, rot };
  }

  const WINDDOWN = [['koerper', 'Körper-Check notiert'], ['licht', 'Licht dimmen, Bildschirm weg'], ['kopf', 'Kopf geleert'], ['morgen', 'Morgen vorsortiert'], ['raum', 'Schlafzimmer kühl und dunkel']]; // Version 24: Körper-Check gehört zum Abend
  const STIMMUNG = [[1, 'Schwer'], [2, 'Zäh'], [3, 'Okay'], [4, 'Gut'], [5, 'Stark']];
  const kurzModus = () => document.documentElement.classList.contains('tf-kurz');
  // Minuten bis zur Bettzeit (Bettzeit ab Mitternacht des Abends gezählt; nach Mitternacht läuft die Uhr weiter)
  const bisBett = (f) => { const d = new Date(), j = d.getHours() * 60 + d.getMinutes() + (d.getHours() < 4 ? 1440 : 0); return f.bett - j; };

  function schlafReihe(f) {
    return el('div', { class: 'tf-ab-schlaf' },
      el('div', null, el('small', { text: 'Ins Bett' }), el('b', { class: 'num', text: uhr(f.bett) })),
      el('div', null, el('small', { text: 'Schlafen' }), el('b', { class: 'num', text: uhr(f.schlafen != null ? f.schlafen : f.bett + 15) })),
      el('div', null, el('small', { text: 'Aufstehen' }), el('b', { class: 'num', text: uhr(f.auf - (f.morgen || 0)) })));
  }
  function morgenZeile(mg) {
    if (!mg) return null;
    if (mg.ruhe) return el('p', { class: 'tf-ab-morgen' }, el('small', { text: 'Morgen' }), el('b', { text: 'Ruhetag' }));
    const p = el('p', { class: 'tf-ab-morgen' }, el('small', { text: 'Morgen' }), el('b', { text: mg.titel + (mg.rennen ? '' : ' · ' + dauerTxt(mg.min)) + (mg.mehr > 0 ? ' · +' + mg.mehr + ' weitere' : '') }));
    if (mg.gross) p.appendChild(el('span', { text: mg.rennen ? 'Renntag – heute früh ins Bett und alles bereitlegen' : 'Ein wichtiger Tag – früh schlafen lohnt sich' }));
    return p;
  }

  function abendKarte() {
    const box = $('#home-abend'); if (!box) return;
    const fokus = document.activeElement; // wer gerade tippt, verliert nichts: die Karte bleibt stehen, bis das Feld verlassen ist
    if (fokus && /^(INPUT|TEXTAREA)$/.test(fokus.tagName) && box.contains(fokus)) return;
    const h = abendTag(), z = window.tfStart ? tfStart.tageszeit() : null;
    if (z !== 'abend' || lsLesen('tf:abend-zu', null) === h) { box.replaceChildren(); return; }
    const D = sicher(() => AL().tagDaten()), f = D && D.f;
    const BL = sicher(() => bilanzTag(h)) || { zeilen: [], fazit: '', ton: 'neutral', morgen: null };
    const abK = 'tf:abschluss:' + h, abschluss = lsLesen(abK, null);
    const c = el('article', { class: 'tf-card tf-ab' + (abschluss ? ' tf-ab-fertig' : ''), id: 'karte-abend' });
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Für heute ausblenden' }, svgIco('i-x'));
    x.addEventListener('click', () => { lsSchreiben('tf:abend-zu', h); box.replaceChildren(); });
    let sub = '2 Minuten zum Abschalten';
    if (f) { const r = bisBett(f); sub = r > 0 ? 'Ins Bett um ' + uhr(f.bett) + ' · in ' + dauerTxt(r) : 'Zeit fürs Bett · ' + uhr(f.bett); }
    // Abgeschlossen: eine ruhige Gute-Nacht-Karte
    if (abschluss) {
      c.append(el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-indigo)' }, svgIco('i-moon')), el('div', null, el('h2', { text: 'Tag abgeschlossen' }), el('div', { class: 'tf-sub', text: 'Gute Nacht' + (abschluss.s ? ' · dein Tag: ' + (STIMMUNG.find((s) => s[0] === abschluss.s) || [0, ''])[1].toLowerCase() : '') }))), x);
      if (BL.fazit) c.appendChild(el('p', { class: 'tf-ab-fazit', 'data-ton': BL.ton, text: BL.fazit }));
      if (f) c.appendChild(schlafReihe(f));
      const mz = morgenZeile(BL.morgen); if (mz) c.appendChild(mz);
      const auf = el('button', { type: 'button', class: 'tf-linkbtn tf-ab-wieder' }, 'Wieder öffnen');
      auf.addEventListener('click', () => { lsSchreiben(abK, null); abendKarte(); });
      c.appendChild(auf);
      box.replaceChildren(c); return;
    }
    c.append(el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-indigo)' }, svgIco('i-moon')), el('div', null, el('h2', { text: 'Dein Abend' }), el('div', { class: 'tf-sub', text: sub }))), x);
    // So war dein Tag
    const bil = el('section', { class: 'tf-ab-bilanz', 'aria-label': 'So war dein Tag' }, el('h3', { class: 'tf-ab-h', text: 'So war dein Tag' }));
    if (BL.fazit) bil.appendChild(el('p', { class: 'tf-ab-fazit', 'data-ton': BL.ton, text: BL.fazit }));
    if (BL.zeilen.length) bil.appendChild(el('ul', { class: 'tf-ab-liste' }, ...BL.zeilen.map((r) => el('li', { class: 'tf-ab-e', 'data-ton': r.ton },
      el('span', { class: 'tf-ab-e-i', 'aria-hidden': 'true' }, svgIco(r.ton === 'gut' ? 'i-check' : r.ton === 'achtung' ? 'i-alert' : r.ton === 'offen' ? 'i-minus' : 'i-check')),
      el('div', null, el('b', { text: r.kopf }), el('small', { text: r.sub }))))));
    const zahlen = tagInZahlen(h, true);
    if (zahlen.length) bil.appendChild(el('div', { class: 'tf-chips tf-ab-chips' }, ...zahlen.map(([i, t]) => el('span', { class: 'tf-chip' }, svgIco(i), t))));
    const mz = morgenZeile(BL.morgen); if (mz) bil.appendChild(mz);
    c.appendChild(bil);
    // Schlafenszeit
    if (f) {
      c.appendChild(schlafReihe(f));
      const satz = ['Bildschirm weg ab ' + uhr(f.dimmen)];
      if (f.tipp != null) satz.push((D.ampel === 'rot' ? 'Tune rot' : 'Morgen früher raus') + ': heute lieber ' + uhr(f.tipp));
      c.appendChild(el('p', { class: 'tf-ab-schlaf-satz', text: satz.join(' · ') }));
    }
    // Version 11: nach Stress oder einer schlechten Nacht die passende Atemübung – direkt startbar
    const K = kontext(h);
    if (K.atem && window.tfFlow && tfFlow.routine) {
      const los = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, svgIco('i-play'), ' Jetzt starten');
      los.addEventListener('click', () => tfFlow.routine(K.atem.id));
      c.appendChild(el('div', { class: 'tf-ab-atem' }, el('span', { class: 'tf-ab-atem-i' }, svgIco('i-lungs')),
        el('div', null, el('small', { class: 'tf-ab-atem-k', text: 'Für heute Abend' }), el('b', null, K.atem.name + ' · 5 min', warum(K.atem.warum, K.atem.quelle)), el('small', { text: K.atem.grund })), los));
    }
    // Abschalten: Kopf leeren, morgen vorsortieren, Häkchen – aufklappbar (mit „Weniger Text“ zu)
    const kopfK = 'tf:abend:' + h, listeK = 'tf:wichtig:' + morgenVon(h), checkK = 'tf:winddown:' + h;
    const check = lsLesen(checkK, {});
    const setze = (k, v) => { const c2 = Object.assign(lsLesen(checkK, {}), { [k]: v }); Object.assign(check, c2); lsSchreiben(checkK, c2); malenCheck(); }; // immer frisch lesen, nie alten Stand überschreiben
    const kopf = el('textarea', { class: 'tf-input tf-ab-kopf', rows: 2, maxlength: 600, placeholder: 'Was geht dir noch durch den Kopf? Einfach aufschreiben', 'aria-label': 'Kopf leeren' });
    kopf.value = lsLesen(kopfK, '');
    let t1 = null;
    kopf.addEventListener('input', () => { clearTimeout(t1); t1 = setTimeout(() => { lsSchreiben(kopfK, kopf.value.slice(0, 600) || null); if (kopf.value.trim() && !lsLesen(checkK, {}).kopf) setze('kopf', 1); }, 400); });
    const L = lsLesen(listeK, []).map((p) => (typeof p === 'string' ? { t: p, ok: 0 } : p)).slice(0, 3);
    const felder = [0, 1, 2].map((i) => {
      const inp = el('input', { class: 'tf-input tf-ab-p', maxlength: 80, placeholder: i === 0 ? 'Das Wichtigste morgen' : 'Und dann …', 'aria-label': 'Morgen wichtig ' + (i + 1), enterkeyhint: i < 2 ? 'next' : 'done' });
      inp.value = L[i] ? L[i].t : '';
      inp.addEventListener('input', () => {
        const neu = [];
        felder.forEach((xx, j) => { const t = xx.value.trim().slice(0, 80); if (t) neu.push({ t, ok: L[j] && L[j].t === t ? L[j].ok : 0 }); });
        lsSchreiben(listeK, neu.length ? neu : null);
        if (neu.length && !lsLesen(checkK, {}).morgen) setze('morgen', 1);
      });
      return inp;
    });
    const liste = el('div', { class: 'tf-ab-check' }), fertig = el('small', { class: 'tf-ab-n' });
    function malenCheck() {
      const regen = () => !!(window.tfRegeneration && tfRegeneration.notiert && sicher(() => tfRegeneration.notiert())); // Version 24: kommt aus der Regeneration, nicht aus dem Häkchen
      liste.replaceChildren(...WINDDOWN.map(([id, t]) => {
        const an = id === 'koerper' ? regen() : !!check[id];
        const b = el('button', { type: 'button', class: 'tf-ab-c' + (an ? ' ok' : ''), 'aria-pressed': String(an) }, el('span', { class: 'tf-ab-box' }, svgIco('i-check')), el('span', { text: t }));
        const um = id === 'koerper' ? () => { const k = document.getElementById('karte-koerper'); if (k) k.scrollIntoView({ block: 'start', behavior: 'smooth' }); else T.geh('training/regeneration'); } : () => setze(id, lsLesen(checkK, {})[id] ? 0 : 1);
        b.addEventListener('click', um);
        if (wischen && !an && id !== 'koerper') wischen(b, um, { text: 'Erledigt' });
        return b;
      }));
      const n = WINDDOWN.filter(([id]) => (id === 'koerper' ? regen() : check[id])).length;
      fertig.textContent = n === WINDDOWN.length ? 'Alles erledigt' : n + ' von ' + WINDDOWN.length;
    }
    malenCheck();
    const mehr = el('details', { class: 'tf-ab-mehr' }, el('summary', null, el('span', { text: 'Abschalten in 2 Minuten' }), fertig),
      el('div', { class: 'tf-field' }, el('span', { text: 'Kopf leeren' }), kopf),
      el('div', { class: 'tf-field' }, el('span', { text: 'Morgen vorsortieren' }), ...felder, el('small', { class: 'tf-ich-hint', text: 'Steht morgen früh als „Heute wichtig“ auf deiner Startseite. Bleibt nur auf diesem Gerät.' })),
      el('div', { class: 'tf-field' }, el('span', { text: 'Vor dem Schlafen' }), liste));
    if (!kurzModus()) mehr.open = true;
    c.appendChild(mehr);
    // Tag abschließen: wie war der Tag? (1–5, nur auf diesem Gerät)
    let wahl = null;
    const knopf = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-ab-los' }, 'Tag abschließen');
    const skala = el('div', { class: 'tf-ab-skala', role: 'radiogroup', 'aria-label': 'Wie war dein Tag?' }, ...STIMMUNG.map(([v, t]) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false' }, t);
      b.addEventListener('click', () => { wahl = wahl === v ? null : v; [...skala.children].forEach((y, i) => y.setAttribute('aria-checked', String(STIMMUNG[i][0] === wahl))); });
      return b;
    }));
    knopf.addEventListener('click', () => {
      lsSchreiben(abK, { s: wahl, at: new Date().toISOString() });
      if (A().toast) A().toast('Tag abgeschlossen');
      abendKarte();
    });
    c.append(el('section', { class: 'tf-ab-abschluss', 'aria-label': 'Tag abschließen' }, el('h3', { class: 'tf-ab-h', text: 'Wie war dein Tag?' }), skala, knopf),
      quelle('Scullin et al., J Exp Psychol Gen 2018 (Aufschreiben vor dem Schlafen) · Chang et al., PNAS 2015 (helles Licht am Abend) · Watson et al., Sleep 2015'));
    box.replaceChildren(c);
  }

  /* ---------- Version 19: Profil → Schlaf & Abend ---------- */
  function abendEinstellungen() {
    const box = $('#abendzeit-box'); if (!box) return;
    if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return; // beim Tippen nicht neu zeichnen
    const a = athlet(), D = sicher(() => AL().tagDaten()), f = D && D.f;
    const eigen = a.bett_min != null || a.schlafen_min != null;
    let modus = box.dataset.modus || (eigen ? 'eigen' : 'auto');
    const zuMin = (v, abends) => { const m = M().minVon(v); if (m == null) return null; return abends && m < 12 * 60 ? m + 1440 : m; };
    const inBett = el('input', { class: 'tf-input', type: 'time', step: 300, value: M().uhrzeit(a.bett_min != null ? a.bett_min : f ? f.bett : 1365), 'aria-label': 'Ins Bett' });
    const inSchlaf = el('input', { class: 'tf-input', type: 'time', step: 300, value: M().uhrzeit(a.schlafen_min != null ? a.schlafen_min : (a.bett_min != null ? a.bett_min + 15 : f ? f.schlafen : 1380)), 'aria-label': 'Schlafen' });
    const inAuf = el('input', { class: 'tf-input', type: 'time', step: 300, value: a.aufstehen_min ? M().uhrzeit(a.aufstehen_min) : '', 'aria-label': 'Aufstehen' });
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const info = el('p', { class: 'tf-abz-info' });
    const bedarf = D && D.bedarf ? D.bedarf : +a.schlafbedarf_min || 480;
    const hm = (m) => Math.floor(m / 60) + ':' + String(Math.round(m % 60)).padStart(2, '0') + '\u00a0h';
    function rechnen() {
      if (modus === 'auto') {
        info.textContent = f ? 'Aus deiner Aufstehzeit und deinem Schlafbedarf von ' + hm(bedarf) + ': heute ins Bett um ' + uhr(f.auto != null ? f.auto : f.bett) + ', schlafen um ' + uhr((f.auto != null ? f.auto : f.bett) + 15) + '. Dein Abend beginnt um 19 Uhr.' : 'Aus deiner Aufstehzeit und deinem Schlafbedarf.';
        return;
      }
      const b = zuMin(inBett.value, true), s = zuMin(inSchlaf.value, true), auf = zuMin(inAuf.value, false) || (f ? f.auf : 420);
      if (b == null || s == null) { info.textContent = 'Beide Zeiten eintragen'; return; }
      const dauer = auf + 1440 - s, fehlt = Math.round(bedarf - dauer);
      const ab = Math.max(16 * 60, Math.min(22 * 60, b - 180));
      info.textContent = (s < b ? 'Schlafen liegt vor dem Zubettgehen – bitte tauschen. ' : '') + 'Schlaf bis ' + uhr(auf) + ' Uhr: ' + hm(Math.max(0, dauer)) + (fehlt >= 15 ? ', ' + fehlt + '\u00a0min unter deinem Bedarf von ' + hm(bedarf) : fehlt <= -15 ? ', mehr als dein Bedarf' : ', so viel wie dein Bedarf') + '. Dein Abend beginnt um ' + uhr(ab) + '.';
    }
    const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Bettzeit' });
    [['auto', 'Automatisch'], ['eigen', 'Selbst festlegen']].forEach(([k, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(modus === k) }, t);
      b.addEventListener('click', () => { modus = k; box.dataset.modus = k; [...seg.children].forEach((y) => y.setAttribute('aria-pressed', String(y === b))); felder.hidden = k !== 'eigen'; rechnen(); });
      seg.appendChild(b);
    });
    const feld = (lbl, inp, hint) => el('label', { class: 'tf-field tf-abz-f' }, el('span', { text: lbl }), inp, hint ? el('small', { class: 'tf-ich-hint', text: hint }) : null);
    const felder = el('div', { class: 'tf-abz-felder' }, feld('Ins Bett', inBett), feld('Schlafen', inSchlaf, 'Licht aus'), feld('Aufstehen', inAuf, 'Wenn die Uhr nichts weiß'));
    felder.hidden = modus !== 'eigen';
    [inBett, inSchlaf, inAuf].forEach((i) => i.addEventListener('input', rechnen));
    const sp = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Speichern');
    sp.addEventListener('click', async () => {
      let body;
      if (modus === 'auto') body = { bett_min: null, schlafen_min: null };
      else {
        const b = zuMin(inBett.value, true), s = zuMin(inSchlaf.value, true);
        if (b == null || s == null) { setMsg(msg, 'Bitte beide Zeiten eintragen.', true); return; }
        if (b < 1080 || b > 1680) { setMsg(msg, 'Ins Bett zwischen 18 und 4 Uhr.', true); return; }
        if (s < b || s - b > 180) { setMsg(msg, 'Schlafen liegt zwischen der Zeit fürs Bett und drei Stunden danach.', true); return; }
        body = { bett_min: b, schlafen_min: s };
        const auf = zuMin(inAuf.value, false); if (inAuf.value === '' || (auf >= 240 && auf <= 720)) body.aufstehen_min = inAuf.value === '' ? null : auf;
      }
      try { setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', body); delete box.dataset.modus; box.dataset.msg = 'Gespeichert'; setMsg(msg, 'Gespeichert'); A().patch('athlet', [j.profil]); }
      catch (e) { setMsg(msg, e.message, true); }
    });
    rechnen();
    if (box.dataset.msg) { msg.textContent = box.dataset.msg; delete box.dataset.msg; }
    box.replaceChildren(seg, felder, info, el('div', { class: 'tf-form-actions' }, sp), msg);
  }

  /* =====================================================================
     2. Morgenliste: das Wichtigste von gestern Abend
     ===================================================================== */
  function morgenListe() {
    const box = $('#home-morgen'); if (!box) return;
    const h = localDate(), k = 'tf:wichtig:' + h;
    const L = lsLesen(k, []).map((p) => (typeof p === 'string' ? { t: p, ok: 0 } : p)).filter((p) => p && p.t);
    if (!L.length || (window.tfStart && tfStart.tageszeit() === 'abend' && L.every((p) => p.ok))) { box.replaceChildren(); return; }
    const c = el('article', { class: 'tf-card tf-ml' }, el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-blue)' }, svgIco('i-list')), el('div', null, el('h2', { text: 'Heute wichtig' }), el('div', { class: 'tf-sub', text: 'Von gestern Abend – abhaken per Tippen oder Wischen' }))));
    const liste = el('div', { class: 'tf-ab-check' });
    L.forEach((p, i) => {
      const b = el('button', { type: 'button', class: 'tf-ab-c' + (p.ok ? ' ok' : ''), 'aria-pressed': String(!!p.ok) }, el('span', { class: 'tf-ab-box' }, svgIco('i-check')), el('span', { text: p.t }));
      const um = () => { L[i].ok = L[i].ok ? 0 : 1; lsSchreiben(k, L); morgenListe(); if (L.every((x) => x.ok)) A().toast('Alles Wichtige geschafft'); };
      b.addEventListener('click', um);
      if (wischen && !p.ok) wischen(b, um, { text: 'Erledigt' });
      liste.appendChild(b);
    });
    c.appendChild(liste);
    box.replaceChildren(c);
  }

  /* =====================================================================
     3. Nachmittagstief: Power-Nap oder kurzer Spaziergang
     ===================================================================== */
  let mittagAuf = null; // Datum, an dem der Rat aufgeklappt wurde
  function mittagKarte() {
    const box = $('#home-mittag'); if (!box) return;
    const h = localDate(), t = jetztMin();
    if (lsLesen('tf:mittag-zu', null) === h) { box.replaceChildren(); return; }
    const D = sicher(() => AL().tagDaten()), H = rowsOf('heute') && rowsOf('heute')[0];
    const r = sicher(() => M().nachmittagstief({ jetztMin: t, schlafH: D && D.schlafMin != null ? D.schlafMin / 60 : null, bedarfH: D ? D.bedarf / 60 : null, schuld7H: H && H.date === h && H.schuld7_h != null ? +H.schuld7_h : null, bettMin: D && D.f ? D.f.bett : null, koffeinMin: D && D.f ? D.f.koffein : null }));
    if (!r) { box.replaceChildren(); return; }
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Für heute ausblenden' }, svgIco('i-x'));
    x.addEventListener('click', () => { lsSchreiben('tf:mittag-zu', h); box.replaceChildren(); });
    const c = el('article', { class: 'tf-card tf-hinweis tf-mt' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-' + (r.art === 'nap' ? 'indigo' : 'green') + ')' }, svgIco(r.art === 'nap' ? 'i-moon' : 'i-walk')));
    const inhalt = el('div');
    if (mittagAuf !== h) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, 'Was hilft jetzt?');
      b.addEventListener('click', () => { mittagAuf = h; mittagKarte(); });
      inhalt.append(el('b', { text: 'Energieloch am Nachmittag?' }), el('p', { text: 'Ein kurzer Kick, passend zu Uhrzeit und Schlaf.' }), el('div', { class: 'tf-form-actions' }, b));
    } else if (r.art === 'nap') {
      const w = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, svgIco('i-timer'), ' Wecker in 20 min');
      w.addEventListener('click', () => { if (window.tfTimer) tfTimer.start({ titel: 'Power-Nap', sub: 'Danach aufstehen, Licht, ein Glas Wasser', phasen: [{ name: 'Ruhen', sek: 20 * 60, art: 'pause' }], farbe: 'indigo' }); });
      inhalt.append(el('b', { text: '15-Minuten-Power-Nap' }), el('p', { text: r.grund + ' Leg dich hin, Augen zu – 5 Minuten zum Einschlafen, 15 Minuten Ruhe. Länger nicht, sonst wirst du benommen wach.' + (r.kaffee ? ' Tipp: Ein Kaffee direkt davor wirkt genau, wenn du aufwachst.' : '') }), el('div', { class: 'tf-form-actions' }, w),
        quelle('Brooks & Lack, Sleep 2006 · Milner & Cote, J Sleep Res 2009 · Reyner & Horne, Psychophysiology 1997'));
    } else {
      const w = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, svgIco('i-timer'), ' 10-Minuten-Timer');
      w.addEventListener('click', () => { if (window.tfTimer) tfTimer.start({ titel: 'Frische-Spaziergang', sub: 'Zügig gehen, draußen im Tageslicht', phasen: [{ name: 'Gehen', sek: 10 * 60, art: 'arbeit' }], farbe: 'green' }); });
      inhalt.append(el('b', { text: '10 Minuten raus' }), el('p', { text: r.grund + ' Zügig gehen, am besten draußen im Tageslicht – das hebt die Energie länger als ein Snack.' + (r.kaffee ? ' Ein Kaffee geht heute noch.' : ' Koffein jetzt lieber nicht mehr – sonst leidet dein Schlaf.') }), el('div', { class: 'tf-form-actions' }, w),
        quelle('Thayer, J Pers Soc Psychol 1987 · Drake et al., J Clin Sleep Med 2013 (Koffein und Schlaf)'));
    }
    c.append(inhalt, x);
    box.replaceChildren(c);
  }

  /* =====================================================================
     4. Pause-Modus mit Wiedereinstieg
     ===================================================================== */
  const PAUSE_ART = {
    krank: ['Krank', 'Fieber, Gliederschmerzen, Husten oder Magen-Darm – alles unterhalb des Halses', 'i-shield', 'red'],
    angeschlagen: ['Angeschlagen', 'Nur Schnupfen, Halskratzen oder verstopfte Nase – oberhalb des Halses', 'i-alert', 'orange'],
    auszeit: ['Auszeit', 'Urlaub, Prüfungen, viel los – einfach mal Pause', 'i-sofa', 'blue'],
  };
  const RE = /^\d{4}-\d\d-\d\d$/;
  const roh = () => { const p = (A().state.rechner || {}).pause; return p && typeof p === 'object' && !Array.isArray(p) ? p : {}; };
  const pause = () => { const p = roh(); return RE.test(p.seit || '') && PAUSE_ART[p.art] ? p : null; };
  // frühere Pausen: [seit, ruhig bis, geschützt bis, art] – damit XP und Serien vergangener Tage gleich bleiben
  const frueher = () => (Array.isArray(roh().alt) ? roh().alt : []).filter((x) => Array.isArray(x) && RE.test(x[0] || '') && RE.test(x[1] || '') && RE.test(x[2] || '')).slice(-12);
  function bereich(von, bis, S2) { const h = localDate(); for (let d = von, n = 0; d <= bis && d <= h && n < 120; d = M().plus(d, 1), n++) S2.add(d); }
  // Tage, an denen die Wochenserie geschützt ist: die Pause selbst und die ersten drei Tage des Wiedereinstiegs
  function pauseTage() {
    const S2 = new Set(), p = pause();
    frueher().forEach((x) => bereich(x[0], x[2], S2));
    if (p) bereich(p.seit, p.gesund ? M().plus(p.gesund, 3) : localDate(), S2);
    return [...S2].sort();
  }
  // Tage ohne Trainingsdruck (Erholungs-Quests): krank oder angeschlagen, bis du wieder gesund bist. Bei einer Auszeit bleiben die Quests freiwillig.
  function ruheTage() {
    const S2 = new Set(), p = pause();
    frueher().forEach((x) => { if (x[3] !== 'auszeit') bereich(x[0], x[1], S2); });
    if (p && p.art !== 'auszeit') bereich(p.seit, p.gesund ? M().plus(p.gesund, -1) : localDate(), S2);
    return [...S2].sort();
  }
  function beenden(p) {
    const vor = M().plus(localDate(), -1);
    const ruhigBis = p.gesund ? (M().plus(p.gesund, -1) < vor ? M().plus(p.gesund, -1) : vor) : vor;
    let schutzBis = p.gesund ? M().plus(p.gesund, 3) : vor;
    if (schutzBis > vor) schutzBis = vor;
    if (schutzBis < ruhigBis) schutzBis = ruhigBis;
    const alt = frueher().slice();
    if (schutzBis >= p.seit) alt.push([p.seit, ruhigBis, schutzBis, p.art]);
    return { alt: alt.slice(-12) };
  }
  const neuePause = (art) => ({ seit: localDate(), art, gesund: null, zurueck: 0, alt: frueher() });
  let saveT = null;
  function pauseSpeichern(p) {
    A().setRechner(Object.assign({}, A().state.rechner || {}, { pause: p }));
    clearTimeout(saveT);
    saveT = setTimeout(() => A().api('POST', '/api/rechner', { pause: p }).catch((e) => A().toast('Nicht gespeichert: ' + e.message)), 300);
    T.neu();
  }
  function stand() { const p = pause(); return p ? M().rueckkehr(p, localDate()) : null; }
  function pauseBlatt(vorwahl) {
    let art = PAUSE_ART[vorwahl] ? vorwahl : 'krank';
    const box = el('div', { class: 'tf-rm tf-pause-blatt' });
    const liste = el('div', { class: 'tf-pl-tb-l', role: 'radiogroup', 'aria-label': 'Was ist los?' });
    const malen = () => liste.replaceChildren(...Object.entries(PAUSE_ART).map(([id, [name, text, icon, farbe]]) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(id === art), class: 'tf-pl-tb-z tf-pause-z' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)), el('span', null, el('b', { text: name }), el('small', { text: text })));
      b.addEventListener('click', () => { art = id; malen(); });
      return b;
    }));
    malen();
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-pause'), ' Pause starten');
    ok.addEventListener('click', () => { pauseSpeichern(neuePause(art)); if (window.tfWissen) tfWissen.schliessen(); A().toast('Pause-Modus an – gute Besserung'); });
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    ab.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); });
    box.append(el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Pause-Modus' }), el('p', { class: 'tf-rm-sub', text: 'Mit einem Tipp: Deine Wochenserie bleibt geschützt, es gibt keinen Trainingsdruck, und nach einer Krankheit begleitet dich Dreiklang Schritt für Schritt zurück ins Training.' }),
      liste, el('div', { class: 'tf-form-actions' }, ok, ab),
      el('p', { class: 'tf-note tf-bleibt', text: 'Bei Fieber über 38 °C, Atemnot, Brustschmerz oder wenn es nach einigen Tagen nicht besser wird: bitte ärztlich abklären lassen.' }));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }
  function pauseKarte() {
    const box = $('#home-pause'); if (!box) return;
    const p = pause(), r = stand();
    if (!p || !r) { box.replaceChildren(); return; }
    const [name, , icon, farbe] = PAUSE_ART[p.art];
    const c = el('article', { class: 'tf-card tf-pause', id: 'karte-pause' });
    const knoepfe = el('div', { class: 'tf-form-actions' });
    if (r.phase === 'pause' || r.phase === 'angeschlagen') {
      const tagT = 'Tag ' + r.tage;
      const text = p.art === 'krank' ? 'Kein Training – dein Körper braucht die Kraft für die Abwehr. Viel trinken, regelmäßig essen, früh schlafen.'
        : p.art === 'angeschlagen' ? 'Wenn du dich gut fühlst: höchstens 20–30 Minuten ganz locker. Kommt Fieber oder Husten dazu, stell auf „Krank“ um.'
          : 'Kein Trainingsdruck, deine Serie ist geschützt. Genieß die Pause.';
      c.append(el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)), el('div', null, el('h2', { text: 'Pause-Modus · ' + name }), el('div', { class: 'tf-sub', text: tagT + ' · Serie geschützt · ' + (p.art === 'auszeit' ? 'Quests freiwillig' : 'Erholungs-Quests') }))), el('p', { class: 'tf-pause-t', text: text }));
      if (p.art === 'auszeit') {
        const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Pause beenden');
        b.addEventListener('click', () => { pauseSpeichern(beenden(p)); A().toast('Willkommen zurück'); });
        knoepfe.appendChild(b);
      } else {
        const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-check'), ' Ich bin wieder gesund');
        b.addEventListener('click', () => { pauseSpeichern(Object.assign({}, p, { gesund: localDate(), zurueck: 0 })); A().toast('Schön – jetzt Schritt für Schritt zurück'); });
        knoepfe.appendChild(b);
        if (p.art === 'angeschlagen') { const k = el('button', { type: 'button', class: 'tf-btn' }, 'Doch krank'); k.addEventListener('click', () => pauseSpeichern(Object.assign({}, p, { art: 'krank' }))); knoepfe.appendChild(k); }
      }
    } else if (r.phase === 'rueckkehr') {
      const stufen = el('div', { class: 'tf-pause-stufen', 'aria-hidden': 'true' }, ...M().RUECKKEHR.map((s, i) => el('i', { class: i < r.stufe ? 'fertig' : i === r.stufe ? 'an' : '' })));
      c.append(el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-green)' }, svgIco('i-walk')), el('div', null, el('h2', { text: 'Wiedereinstieg · Stufe ' + (r.stufe + 1) + ' von ' + r.von }), el('div', { class: 'tf-sub', text: r.name + ' · heute höchstens ' + r.max + ' min' }))),
        stufen, el('p', { class: 'tf-pause-t', text: r.text }), el('p', { class: 'tf-note', text: 'Weiter zur nächsten Stufe nur ohne Beschwerden. Kommen sie zurück: eine Stufe zurück und einen Tag mehr Zeit.' }));
      const zur = el('button', { type: 'button', class: 'tf-btn' }, 'Beschwerden zurück');
      zur.addEventListener('click', () => { pauseSpeichern(Object.assign({}, p, { zurueck: (+p.zurueck || 0) + 1 })); A().toast('Eine Stufe zurück – lass dir Zeit'); });
      const fit = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Ich bin wieder ganz fit');
      fit.addEventListener('click', () => { pauseSpeichern(beenden(p)); A().toast('Pause-Modus beendet'); });
      knoepfe.append(zur, fit);
    } else {
      c.append(el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-green)' }, svgIco('i-check')), el('div', null, el('h2', { text: 'Wiedereinstieg geschafft' }), el('div', { class: 'tf-sub', text: 'Ab jetzt wieder normales Training – hart erst, wenn Ruhepuls und HRV im Normal sind.' }))));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Fertig');
      b.addEventListener('click', () => { pauseSpeichern(beenden(p)); if (window.tfSpiel && tfSpiel.auszeichnung) tfSpiel.auszeichnung({ id: 'zurueck:' + p.seit, art: 'quest', titel: 'Zurück im Training', name: 'Wiedereinstieg geschafft', wert: r.tage + ' Tage Schritt für Schritt', sub: 'Geduld zahlt sich aus.' }); });
      knoepfe.appendChild(b);
    }
    c.append(knoepfe, el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Stufen in Anlehnung an Elliott et al., Br J Sports Med 2020 · Schwellnus et al., Br J Sports Med 2022 (IOC-Konsens)' })));
    box.replaceChildren(c);
  }
  // Hinweis für „Heute im Plan“ und die Wochenansicht
  function planHinweis() {
    const r = stand();
    if ((!r || r.phase === 'fertig') && sanftAktiv()) {
      const v = sanft(), bisT = +v.bis.slice(8, 10) + '.' + +v.bis.slice(5, 7) + '.';
      return el('p', { class: 'tf-pl-tf tf-pl-schutz' }, dot('blue'), el('span', null, 'Sanfte Woche bis ' + bisT + ': Dein Plan ist angepasst – etwa zwei Drittel der Zeit und nichts Hartes. ', warum('Nach ein paar Tagen Pause bringt eine ruhige Woche Körper und Routine zurück – ohne das Risiko, sich gleich zu überlasten.', 'Gabbett, Br J Sports Med 2016')));
    }
    if (!r || r.phase === 'fertig') return null;
    const text = r.phase === 'rueckkehr' ? 'Wiedereinstieg Stufe ' + (r.stufe + 1) + ': heute höchstens ' + r.max + ' Minuten, ' + (r.stufe < 3 ? 'ganz locker' : 'locker mit etwas Tempo') + ' – kürz die Einheit entsprechend.' : 'Pause-Modus: Der Plan ruht – kein Training nötig.';
    return el('p', { class: 'tf-pl-tf tf-pl-schutz' }, dot(r.phase === 'rueckkehr' ? 'green' : 'blue'), el('span', { text }));
  }

  /* =====================================================================
     5. Schnellstart: zur gewohnten Zeit direkt ins Gym oder zu Pilates & Yoga
     ===================================================================== */
  const WTAG = ['Sonntags', 'Montags', 'Dienstags', 'Mittwochs', 'Donnerstags', 'Freitags', 'Samstags'];
  const wtagVon = (d) => new Date(d + 'T12:00:00').getDay();
  const logVon = (kat) => { const rc = A().state.rechner || {}, g = kat === 'kraft' ? rc.gym : rc.flow; return (g && Array.isArray(g.log)) ? g.log : []; };
  const uhrEinheit = (e) => (e && /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d/.test(e.start || '') ? +e.start.slice(11, 13) + +e.start.slice(14, 16) / 60 : null);
  function gewohnheit(kat, h) { // wie oft an diesem Wochentag in den letzten 8 Wochen – und zu welcher Uhrzeit
    const von = M().plus(h, -56), wt = wtagVon(h), K = M().katVon;
    const EH = (A().raw('garmin_einheiten') || []).filter((e) => e && e.date >= von && e.date < h && !e.is_parent && K(e.type) === kat && (+e.moving_s || +e.dur_s) >= 600);
    const tage = new Set(EH.map((e) => e.date).concat(logVon(kat).filter((x) => x && x.d >= von && x.d < h).map((x) => x.d)));
    const std = EH.filter((e) => wtagVon(e.date) === wt).map(uhrEinheit).filter((x) => x != null);
    return { gleich: [...tage].filter((d) => wtagVon(d) === wt).length, stunde: std.length >= 2 ? M().median(std) : null };
  }
  const heuteSchon = (kat, h) => logVon(kat).some((x) => x && x.d === h) || (A().raw('garmin_einheiten') || []).some((e) => e && e.date === h && !e.is_parent && M().katVon(e.type) === kat && (+e.moving_s || +e.dur_s) >= 600);
  const SCHNELL = {
    kraft: { knopf: 'Gym-Einheit jetzt starten', name: 'Gym', icon: 'i-dumbbell', los: () => window.tfGym && tfGym.starten && tfGym.starten() },
    mobil: { knopf: 'Pilates & Yoga jetzt starten', name: 'Pilates & Yoga', icon: 'i-lotus', los: () => window.tfFlow && tfFlow.starten && tfFlow.starten() },
  };
  function schnellWahl(h, jetzt) {
    const r = stand();
    if (r && r.phase !== 'fertig') return null; // krank oder im Wiedereinstieg: kein Trainings-Knopf
    const plan = sicher(() => (window.tfPlan && tfPlan.tag ? tfPlan.tag(h) : [])) || [];
    for (const kat of ['kraft', 'mobil']) {
      if (heuteSchon(kat, h)) continue;
      const s = plan.find((x) => x && x.sport === kat) || null, g = gewohnheit(kat, h);
      if (!s && g.gleich < 3) continue; // weder im Plan noch eine Gewohnheit (mindestens 3 der letzten 8 gleichen Wochentage)
      const ab = g.stunde != null ? Math.max(5, g.stunde - 1.5) : 15, bis = g.stunde != null ? Math.min(23, g.stunde + 3) : 21.5;
      if (jetzt < ab || jetzt > bis) continue;
      return { kat, s, g };
    }
    return null;
  }
  function schnellstart() {
    const box = $('#home-schnell'); if (!box) return;
    const h = localDate(), d = new Date(), w = lsLesen('tf:schnell-weg', null) === h ? null : schnellWahl(h, d.getHours() + d.getMinutes() / 60);
    // Version 14: Zeigt die Karte „Heute“ genau diese Einheit mit „Starten“, reicht ein Knopf
    const doppelt = w && w.s && window.tfPlan && tfPlan.heldHeute && sicher(() => tfPlan.heldHeute()) === w.kat;
    if (!w || doppelt) { box.replaceChildren(); return; }
    const S2 = SCHNELL[w.kat], stdT = w.g.stunde != null ? Math.floor(w.g.stunde) + (w.g.stunde % 1 >= 0.5 ? ':30' : '') + ' Uhr' : null;
    const sub = w.s ? 'Heute im Plan: ' + ((w.s.D && w.s.D.titel) || S2.name) + (w.s.min ? ' · ' + w.s.min + '\u00a0min' : '') : WTAG[wtagVon(h)] + ' trainierst du meist ' + S2.name + (stdT ? ' – gegen ' + stdT : '');
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-play'), ' ' + S2.knopf);
    los.addEventListener('click', () => { if (w.s && w.s.D && w.s.D.link && w.s.D.link.fn) sicher(w.s.D.link.fn); S2.los(); });
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Für heute ausblenden' }, svgIco('i-x'));
    x.addEventListener('click', () => { lsSchreiben('tf:schnell-weg', h); box.replaceChildren(); });
    box.replaceChildren(el('article', { class: 'tf-card tf-schnell', id: 'karte-schnell' },
      el('div', { class: 'tf-schnell-k' }, svgIco(S2.icon), el('span', { text: w.s ? 'Dein ' + S2.name + '-Tag' : 'Deine gewohnte Zeit' })),
      el('p', { class: 'tf-schnell-t', text: sub }), los, x));
  }

  /* =====================================================================
     6. Willkommen zurück – und auf Wunsch eine sanfte Woche
     ===================================================================== */
  const sanft = () => { const v = (A().state.rechner || {}).sanft; return v && RE.test(v.ab || '') && RE.test(v.bis || '') ? v : null; };
  const sanftAktiv = () => { const v = sanft(), h = localDate(); return !!(v && v.ab <= h && h <= v.bis); };
  let sanftT = null;
  function sanftSpeichern(v) {
    A().setRechner(Object.assign({}, A().state.rechner || {}, { sanft: v }));
    clearTimeout(sanftT);
    sanftT = setTimeout(() => A().api('POST', '/api/rechner', { sanft: v }).catch((e) => A().toast('Nicht gespeichert: ' + e.message)), 300);
    T.neu();
  }
  function aktiveTage() { // alles, was du einträgst oder trainierst
    const D = new Set(), add = (d) => { if (typeof d === 'string' && RE.test(d)) D.add(d); };
    (A().raw('checkins') || []).forEach((c) => c && add(c.date));
    (A().raw('tagebuch') || []).forEach((t) => t && add(t.date));
    logVon('kraft').forEach((x) => x && add(x.d)); logVon('mobil').forEach((x) => x && add(x.d));
    (A().raw('garmin_einheiten') || []).forEach((e) => { if (e && !e.is_parent && (+e.moving_s || +e.dur_s) >= 900) add(e.date); });
    if (window.tfExperimente && tfExperimente.tage) tfExperimente.tage().forEach(add);
    return D;
  }
  function zurueckKarte() {
    const box = $('#home-zurueck'); if (!box) return;
    const h = localDate(), D = aktiveTage(), vorher = [...D].filter((d) => d < h).sort(), letzte = vorher[vorher.length - 1];
    const tage = letzte ? Math.round((Date.parse(h) - Date.parse(letzte)) / 864e5) : 0;
    const regelmaessig = letzte && vorher.filter((d) => d > M().plus(letzte, -28)).length >= 6;
    if (!letzte || D.has(h) || tage < 4 || !regelmaessig || pause() || sanftAktiv() || lsLesen('tf:zurueck-weg', null) === letzte) { box.replaceChildren(); return; }
    const bis = M().plus(h, 6), bisT = WTAG[wtagVon(bis)].replace(/s$/, '') + ', ' + +bis.slice(8, 10) + '.' + +bis.slice(5, 7) + '.';
    const ja = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Ja, sanft starten');
    ja.addEventListener('click', () => { sanftSpeichern({ ab: h, bis }); A().toast('Sanfte Woche bis ' + bisT); });
    const nein = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Nein, normal weiter');
    nein.addEventListener('click', () => { lsSchreiben('tf:zurueck-weg', letzte); box.replaceChildren(); });
    // Version 48: Hinweise auf Heute sind kurz – Frage und Knöpfe; die Erklärung klappt auf. Seit Version 51 steht davor eine Zeile unter der Woche, die Karte klappt auf.
    box.replaceChildren(el('article', { class: 'tf-card tf-wieder tf-notiz', id: 'karte-zurueck' },
      el('h2', { class: 'tf-wieder-t', text: 'Willkommen zurück' }),
      el('p', { class: 'tf-notiz-k', text: 'Die letzten ' + tage + ' Tage war es ruhig – völlig in Ordnung. Diese Woche sanft wieder aufnehmen?' }),
      el('div', { class: 'tf-form-actions' }, ja, nein),
      el('details', { class: 'tf-notiz-mehr' }, el('summary', { text: 'Was heißt sanft?' }),
        el('p', { class: 'tf-wieder-s' }, 'Etwa zwei Drittel der geplanten Zeit und nichts Hartes – bis ' + bisT + ' Quests und Serie laufen ganz normal weiter. ', warum('Nach ein paar Tagen Pause ist die Form noch da – aber Sehnen und Gelenke mögen einen ruhigen Wiedereinstieg. Wer sofort voll einsteigt, riskiert eher Überlastung.', 'Gabbett, Br J Sports Med 2016')))));
  }

  /* =====================================================================
     7. Für gestern nachtragen (bis 12 Uhr)
     ===================================================================== */
  function nachtragKarte() {
    const box = $('#home-nachtrag'); if (!box) return;
    const h = localDate(), gestern = M().plus(h, -1), vor14 = M().plus(h, -14);
    if (new Date().getHours() >= 12 || lsLesen('tf:nachtrag-weg', null) === h) { box.replaceChildren(); return; }
    const CK = A().raw('checkins') || [], TB = A().raw('tagebuch') || [], L = [];
    if (CK.filter((c) => c && c.date >= vor14 && c.date < gestern).length >= 3 && !CK.some((c) => c && c.date === gestern)) L.push(['Check-in für gestern', () => T.checkinFuer && T.checkinFuer(gestern)]);
    if (TB.filter((t) => t && t.date >= vor14 && t.date < gestern).length >= 3 && !TB.some((t) => t && t.date === gestern)) L.push(['Trinken & Eiweiß für gestern', () => AL() && AL().protokollFuer && AL().protokollFuer(gestern)]);
    if (!L.length) { box.replaceChildren(); return; }
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Für heute ausblenden' }, svgIco('i-x'));
    x.addEventListener('click', () => { lsSchreiben('tf:nachtrag-weg', h); box.replaceChildren(); });
    box.replaceChildren(el('article', { class: 'tf-card tf-nachtrag', id: 'karte-nachtrag' },
      el('b', { text: 'Gestern vergessen?' }), el('p', { text: 'Bis 12 Uhr kannst du für gestern nachtragen – deine Serie und deine Statistik bleiben ganz.' }),
      el('div', { class: 'tf-form-actions' }, ...L.map(([t, fn], i) => { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' + (i ? '' : ' tf-btn-primary') }, svgIco('i-edit'), ' ' + t); b.addEventListener('click', fn); return b; })), x));
  }

  /* =====================================================================
     8. Zeilen für „Tipps & Wissen für heute“ (über alltag.js)
     ===================================================================== */
  function heuteZeilen() {
    const L = [], h = localDate(), K = kontext(h), D = sicher(() => AL().tagDaten());
    if (D && D.f && D.f.koffeinGrund && new Date().getHours() < 18) {
      const b = el('button', { type: 'button', class: 'tf-zeile tf-zeile-kontext' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-orange)' }, svgIco('i-coffee')),
        el('span', { class: 'tf-zeile-t' }, el('small', { text: 'Koffein heute vorsichtiger' }), el('b', { text: 'Letzte Tasse bis ' + uhr(D.f.koffein) + ' Uhr' }), el('small', { class: 'tf-zeile-lang', text: D.f.koffeinGrund === 'stress' ? 'Bei viel Stress verstärkt Koffein die Anspannung – heute lieber höchstens ein, zwei Tassen.' : 'Nach der kurzen Nacht hilft Kaffee am Morgen – am Nachmittag würde er die nächste Nacht wieder verkürzen.' })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev');
      b.addEventListener('click', () => window.tfWissen && tfWissen.zeige('koffein'));
      L.push(b);
    }
    if (K.atem && new Date().getHours() >= 17 && !(window.tfStart && tfStart.tageszeit() === 'abend')) { // vor dem Abend-Check schon ein Hinweis
      const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-teal)' }, svgIco('i-lungs')),
        el('span', { class: 'tf-zeile-t' }, el('small', { text: 'Für heute Abend' }), el('b', { text: K.atem.name + ' · 5 min' })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev');
      b.addEventListener('click', () => window.tfFlow && tfFlow.routine(K.atem.id));
      L.push(b);
    }
    return L;
  }

  // Profil: Pause-Modus starten – oder sehen, dass er läuft
  function profilZeile() {
    const g = document.querySelector('#profil-hub-box .tf-hub > .tf-links'); if (!g || g.querySelector('.tf-pause-zeile')) return;
    const p = pause(), r = stand(), seit = p ? +p.seit.slice(8, 10) + '.' + +p.seit.slice(5, 7) + '.' : '';
    const sub = !p ? 'Krank, angeschlagen oder Auszeit – deine Serie bleibt geschützt' : r && r.phase === 'rueckkehr' ? 'Wiedereinstieg, Stufe ' + (r.stufe + 1) + ' von ' + r.von : PAUSE_ART[p.art][0] + ' seit ' + seit;
    const b = el('button', { type: 'button', class: 'tf-zeile tf-pause-zeile' },
      el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-orange)' }, svgIco(p ? 'i-pause' : 'i-shield')),
      el('span', { class: 'tf-zeile-t' }, el('b', { text: 'Pause-Modus' }), el('small', { text: sub })),
      p ? el('span', { class: 'tf-zeile-w', text: 'an' }) : null, svgIco('i-chev'));
    b.lastChild.classList.add('tf-chev');
    b.addEventListener('click', () => { if (p) T.geh('heute'); else pauseBlatt(); });
    g.appendChild(b);
  }

  /* ---------- Anmelden ---------- */
  T.zusatz('heute', () => { sicher(zurueckKarte); sicher(nachtragKarte); sicher(schnellstart); sicher(pauseKarte); sicher(morgenListe); sicher(mittagKarte); sicher(abendKarte); });
  T.zusatz('profil-hub', () => sicher(profilZeile));
  T.zusatz('profil', () => sicher(abendEinstellungen)); // Version 19
  window.tfTageslauf = { pause, pauseTage, ruheTage, pauseBlatt, planHinweis, stand, PAUSE_ART, kontext, heuteZeilen, sanft, sanftAktiv, schnellWahl, aktiveTage, abendAb, bilanzTag, befund, abendNeu: abendKarte }; // Version 19: abendAb, bilanzTag, befund · Version 27: abendNeu
})();
