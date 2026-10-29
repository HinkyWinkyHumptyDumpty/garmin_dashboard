/* Tagesform · Spielregeln: XP, Level, Trophy Road, Quests und Trophäen – reine Rechnung ohne Darstellung.
   Alles entsteht aus deinen Daten: Einheiten von der Uhr (jede Sportart), Schritte, Schlaf, Check-ins,
   Gym- und Pilates/Yoga-Einträge aus der App und deinem Trainingsplan. Gespeichert wird nur wenig
   (rechner.spiel): der Spielstart, abgeschlossene Monate (damit nichts verloren geht, wenn alte Daten nach
   400 Tagen gelöscht werden), die Daten deiner Trophäen und deine Auswahl für Profilbild und Banner.
   Läuft im Browser (window.tfSpielMotor) und in Node für die Tests. */
(function (global) {
  'use strict';
  const DAY = 864e5;
  const MSC = new Map(), ISOC = new Map(); // Datumsrechnung zwischenspeichern – sie läuft tausende Male
  const ms = (s) => { let v = MSC.get(s); if (v === undefined) { v = Date.parse(s + 'T00:00:00Z'); MSC.set(s, v); } return v; };
  const iso = (t) => { let v = ISOC.get(t); if (v === undefined) { v = new Date(t).toISOString().slice(0, 10); ISOC.set(t, v); } return v; };
  const plus = (d, n) => iso(ms(d) + n * DAY);
  const wtag = (d) => (new Date(ms(d)).getUTCDay() + 6) % 7; // 0 = Montag
  const montag = (d) => plus(d, -wtag(d));
  const monatsEnde = (m) => { const [y, mo] = m.split('-').map(Number); return iso(Date.UTC(y, mo, 0)); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const median = (v) => { const x = v.filter((n) => n != null && isFinite(n)).sort((p, q) => p - q); return x.length ? x[x.length >> 1] : null; };
  const median2 = (v) => { const x = v.filter((n) => n != null && isFinite(n)).sort((p, q) => p - q); if (!x.length) return null; const h = x.length >> 1; return x.length % 2 ? x[h] : (x[h - 1] + x[h]) / 2; };
  // Ab diesem Tag gelten die Regeln aus Version 8 (Gesundheits-Quests, „klug erholt“, dynamisches Schrittziel).
  // Frühere Tage bleiben, wie sie waren – so sinken bereits gesammelte XP nie.
  const V8 = '2026-10-29';
  const tageZwischen = (a, b) => Math.round((ms(b) - ms(a)) / DAY);
  const nf = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const uhr = (h) => { const m = Math.round((((h % 24) + 24) % 24) * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };

  // Zufall, der für jeden Tag gleich bleibt (Quests sollen nicht bei jedem Öffnen wechseln)
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function zufall(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  const waehle = (r, L) => L[Math.floor(r() * L.length)];
  const kanon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((x, y) => { x[y] = v[y]; return x; }, {}) : v)); // Vergleich unabhängig von der Reihenfolge

  /* =====================================================================
     Level und Stufen
     ===================================================================== */
  const MAX_LEVEL = 70, STERN_XP = 10000;
  const STUFEN = [
    { id: 'bronze', name: 'Bronze', ab: 1 }, { id: 'silber', name: 'Silber', ab: 10 }, { id: 'gold', name: 'Gold', ab: 20 }, { id: 'platin', name: 'Platin', ab: 30 },
    { id: 'diamant', name: 'Diamant', ab: 40 }, { id: 'meister', name: 'Meister', ab: 50 }, { id: 'legende', name: 'Legende', ab: 60 },
  ];
  const stufeVon = (L) => STUFEN.slice().reverse().find((s) => L >= s.ab);
  const schritt = (n) => 250 + 50 * (n - 1); // XP von Level n zu n+1: wird langsam mehr
  const xpFuer = (L) => 250 * (L - 1) + 25 * (L - 1) * (L - 2); // XP, ab denen Level L erreicht ist
  function levelAus(xp) {
    let L = 1; while (L < MAX_LEVEL && xp >= xpFuer(L + 1)) L++;
    const von = xpFuer(L), bis = L < MAX_LEVEL ? xpFuer(L + 1) : null;
    const sterne = L === MAX_LEVEL ? Math.floor((xp - von) / STERN_XP) : 0;
    const anteil = bis ? (xp - von) / (bis - von) : ((xp - von) % STERN_XP) / STERN_XP;
    return { nr: L, xp, von, bis, fehlt: bis ? bis - xp : STERN_XP - ((xp - von) % STERN_XP), anteil: clamp(anteil, 0, 1), stufe: stufeVon(L), sterne };
  }

  // Belohnungen der Trophy Road
  const TITEL = { 1: 'Neu am Start', 5: 'In Bewegung', 10: 'Gut in Fahrt', 15: 'Am Ball', 20: 'Ausdauernd', 25: 'Zielstrebig', 30: 'Unermüdlich', 35: 'Eisern', 40: 'Unaufhaltsam', 45: 'Ausnahmeklasse', 50: 'Meisterhaft', 55: 'Weltklasse', 60: 'Legendär', 65: 'Sagenhaft', 70: 'Vollendet' };
  const BANNER = {
    bronze: 'Bronze', bronze2: 'Kupferglanz', silber: 'Silber', silber2: 'Mondlicht', gold: 'Gold', gold2: 'Sonnenstrahl', platin: 'Platin', platin2: 'Gletscher',
    diamant: 'Diamant', diamant2: 'Kristall', meister: 'Meister', meister2: 'Glut', legende: 'Legende', legende2: 'Polarlicht',
  };
  const ABZEICHEN = { // Level → [Name, Symbol]
    2: ['Erster Schritt', 'i-walk'], 3: ['Funke', 'i-spark'], 4: ['Herzschlag', 'i-heart'], 6: ['Frühstart', 'i-sun'], 7: ['Wassertropfen', 'i-drop'], 8: ['Rhythmus', 'i-wave'], 9: ['Ruhepol', 'i-moon'],
    11: ['Laufschritt', 'i-run'], 12: ['Pedaltritt', 'i-bike'], 13: ['Kraulzug', 'i-swim'], 14: ['Flow', 'i-lotus'], 16: ['Treppauf', 'i-stairs'], 17: ['Volltreffer', 'i-target'], 18: ['Kraftakt', 'i-dumbbell'], 19: ['Etappenziel', 'i-flag'],
    21: ['Blitz', 'i-bolt'], 22: ['Flamme', 'i-flame'], 23: ['Gipfel', 'i-mountain'], 24: ['Dreikampf', 'i-tri'], 26: ['Stern', 'i-star'], 27: ['Ruderschlag', 'i-rower'], 28: ['Seilsprung', 'i-rope'], 29: ['Uhrwerk', 'i-clock'],
    31: ['Schild', 'i-shield'], 32: ['Medaille', 'i-medal'], 33: ['Eiskristall', 'i-gem'], 34: ['Atemzug', 'i-lungs'], 36: ['Balance', 'i-scale'], 37: ['Bücherwurm', 'i-book'], 38: ['Sanduhr', 'i-hourglass'], 39: ['Herzensfeuer', 'i-heart'],
    41: ['Diamant', 'i-gem'], 42: ['Komet', 'i-spark'], 43: ['Polarstern', 'i-star'], 44: ['Gipfelglück', 'i-mountain'], 46: ['Sturm', 'i-wave'], 47: ['Wellenbrecher', 'i-swim'], 48: ['Langstrecke', 'i-run'], 49: ['Mondlicht', 'i-moon'],
    51: ['Krone', 'i-crown'], 52: ['Pokal', 'i-trophy'], 53: ['Feuerprobe', 'i-flame'], 54: ['Donner', 'i-bolt'], 56: ['Tagesform', 'i-ring'], 57: ['Langdistanz', 'i-tri'], 58: ['Gipfelsturm', 'i-mountain'], 59: ['Präzision', 'i-target'],
    61: ['Phönix', 'i-flame'], 62: ['Olymp', 'i-mountain'], 63: ['Sternbild', 'i-star'], 64: ['Ewige Krone', 'i-crown'], 66: ['Goldpokal', 'i-trophy'], 67: ['Lichtblitz', 'i-bolt'], 68: ['Herz aus Gold', 'i-heart'], 69: ['Zeitlos', 'i-hourglass'],
    70: ['Vollendung', 'i-trophy'],
  };
  function belohnungen(L) {
    const st = stufeVon(L), out = [];
    if (L === st.ab) { out.push({ art: 'banner', id: st.id }, { art: 'rahmen', id: st.id }); }
    else if (L % 10 === 5) out.push({ art: 'banner', id: st.id + '2' });
    if (ABZEICHEN[L]) out.push({ art: 'abzeichen', id: 'lv' + L });
    if (TITEL[L]) out.push({ art: 'titel', id: 't' + L });
    return out;
  }
  const ROAD = Array.from({ length: MAX_LEVEL }, (_, i) => ({ nr: i + 1, xp: xpFuer(i + 1), stufe: stufeVon(i + 1), belohnungen: belohnungen(i + 1) }));
  function freigeschaltet(L) { // alles, was bis Level L freigeschaltet ist
    const f = { banner: [], rahmen: [], abzeichen: [], titel: [] };
    ROAD.slice(0, L).forEach((r) => r.belohnungen.forEach((b) => f[b.art].push(b.id)));
    return f;
  }

  /* =====================================================================
     Einheiten von der Uhr: jede Sportart zählt
     ===================================================================== */
  const KAT_TYP = [
    ['lauf', /^(running|treadmill_running|trail_running|track_running|indoor_running|virtual_run|ultra_run|obstacle_run|street_running)$/],
    ['rad', /(cycling|biking|virtual_ride|e_bike|bmx|cyclocross)/],
    ['schwimmen', /swimming/],
    ['kraft', /^(strength_training|hiit|crossfit)$/],
    ['mobil', /^(yoga|pilates|breathwork|meditation|flexibility_training|stretching|mobility)$/],
    ['gehen', /^(walking|casual_walking|speed_walking|hiking|mountaineering|indoor_walking|rucking)$/],
  ];
  const kat = (typ) => { for (const [k, re] of KAT_TYP) if (re.test(typ || '')) return k; return 'sonst'; };
  // Wettkampfstrecken: GPS misst oft etwas zu kurz – 1,5 % Spielraum (5 km, 10 km, Halbmarathon, Marathon, 180 km Rad, 3,8 km Schwimmen)
  const UNTERWEGS = ['lauf', 'rad', 'schwimmen', 'gehen'];
  function einheit(e) {
    if (!e || !e.date || e.is_parent || e.type === 'incident_detected' || e.type === 'transition_v2') return null;
    const k = kat(e.type), s = UNTERWEGS.includes(k) && +e.moving_s > 0 ? +e.moving_s : +e.dur_s || 0;
    const min = Math.min(360, s / 60);
    if (!(min >= 5)) return null;
    const z = [1, 2, 3, 4, 5].map((i) => (+e['z' + i + '_s'] || 0) / 60);
    const st = typeof e.start === 'string' && e.start.length >= 16 ? +e.start.slice(11, 13) + +e.start.slice(14, 16) / 60 : null;
    return { id: e.id, date: e.date, typ: e.type, kat: k, min, km: +e.dist_m > 0 ? e.dist_m / 1000 : 0, hm: +e.elev_m || 0, z, start: st, multi: !!e.parent_id };
  }

  /* =====================================================================
     Quests
     ===================================================================== */
  // Täglich: drei Aufgaben – eine Bewegung, eine Erholung, ein Extra. An roten Tagen gibt es Erholung statt Leistung.
  const Q_TAG = {
    schritte: { titel: (c) => nf(c.ziel) + ' Schritte', text: 'Dein Tagesziel – jeder Weg zählt mit.', icon: 'i-steps', farbe: 'green', xp: 30, einheit: 'Schritte' },
    schritte_plus: { titel: (c) => nf(c.ziel + 2000) + ' Schritte', text: '2.000 mehr als sonst – ein Spaziergang nach dem Essen reicht oft schon.', icon: 'i-steps', farbe: 'green', xp: 40, einheit: 'Schritte' },
    spaziergang: { titel: () => '5.000 Schritte oder 20 Minuten gehen', text: 'Lockere Bewegung fördert die Erholung – mehr muss heute nicht sein.', icon: 'i-walk', farbe: 'teal', xp: 25 },
    bewegung30: { titel: () => '30 Minuten Bewegung', text: 'Jede Sportart zählt – von der Uhr erkannt oder in der App erledigt.', icon: 'i-bolt', farbe: 'orange', xp: 30, einheit: 'min' },
    locker: { titel: () => '30 Minuten locker', text: 'Puls unter deiner ersten Schwelle (Garmin-Zonen 1–3) – so wächst die Grundlage.', icon: 'i-heart', farbe: 'pink', xp: 35, einheit: 'min' },
    kraft: { titel: () => 'Eine Kraft-Einheit', text: 'Gym-Workout aus der App oder Krafttraining auf der Uhr.', icon: 'i-dumbbell', farbe: 'purple', xp: 40 },
    mobil: { titel: () => '10 Minuten Mobilität', text: 'Pilates, Yoga oder Dehnen – aus der App oder von der Uhr.', icon: 'i-lotus', farbe: 'teal', xp: 25, einheit: 'min' },
    frueh: { titel: () => 'Vor 12 Uhr bewegen', text: 'Eine Einheit von mindestens 15 Minuten, die vormittags beginnt.', icon: 'i-sun', farbe: 'yellow', xp: 25 },
    plan: { titel: () => 'Geplante Einheit erledigen', text: 'Was dein Trainingsplan für heute vorsieht.', icon: 'i-cal', farbe: 'blue', xp: 40 },
    schlaf: { titel: (c) => 'Heute Nacht ' + uhr(c.ziel / 60) + ' h schlafen', text: 'Dein Schlafziel aus dem Profil. Garmin misst es, morgen früh steht fest, ob es geklappt hat.', icon: 'i-moon', farbe: 'indigo', xp: 35, nacht: true },
    bettzeit: { titel: (c) => 'Vor ' + uhr(c.ziel) + ' Uhr einschlafen', text: 'Eine Viertelstunde früher als sonst – feste Zeiten machen den Schlaf erholsamer.', icon: 'i-clock', farbe: 'indigo', xp: 30, nacht: true },
    erholung: { titel: () => 'Erholung respektieren', text: 'Deine Tagesform ist rot. Heute nichts Hartes und höchstens 90 Minuten lockere Bewegung.', icon: 'i-shield', farbe: 'red', xp: 40, ende: true },
    checkin: { titel: () => 'Check-in machen', text: 'Fünf Fragen, 20 Sekunden – dein Befinden macht die Tagesform genauer.', icon: 'i-smile', farbe: 'green', xp: 15 },
    wissen: { titel: () => 'Einen Begriff im Wissen lesen', text: 'Ein Begriff am Tag – so verstehst du deine Werte immer besser.', icon: 'i-book', farbe: 'gold', xp: 15 },
    wasser: { titel: (c) => 'Trinkziel: ' + (c.ziel / 1000).toFixed(1).replace('.', ',') + ' l', text: 'Unter Gesundheit → Heute notiert mit einem Tipp pro Glas.', icon: 'i-glass', farbe: 'blue', xp: 25, einheit: 'ml' },
    protein: { titel: (c) => c.ziel + ' g Eiweiß', text: 'Dein Eiweißziel – verteilt auf mehrere Mahlzeiten.', icon: 'i-egg', farbe: 'purple', xp: 25, einheit: 'g' },
    routine: { titel: () => 'Eine Kurz-Routine', text: 'Nacken, Schreibtisch-Pause oder Atmen – 5 bis 10 Minuten unter Pilates & Yoga.', icon: 'i-lotus', farbe: 'teal', xp: 20 },
  };
  // Wöchentlich (Montag bis Sonntag): drei größere Ziele
  const Q_WOCHE = {
    who150: { titel: () => '150 Minuten Bewegung', text: 'Die Empfehlung der WHO. Moderate Minuten zählen einfach, intensive doppelt – wie die Intensitätsminuten deiner Uhr.', icon: 'i-heart', farbe: 'pink', xp: 150, einheit: 'min', quelle: 'Bull et al., Br J Sports Med 2020 (WHO)' },
    einheiten3: { titel: () => '3 Einheiten', text: 'Gym, Pilates & Yoga oder eine Einheit von der Uhr – Hauptsache regelmäßig.', icon: 'i-bolt', farbe: 'orange', xp: 120 },
    kraft2: { titel: () => '2× Krafttraining', text: 'Die WHO empfiehlt Kraft an mindestens zwei Tagen pro Woche – für Muskeln, Knochen und Verletzungsschutz.', icon: 'i-dumbbell', farbe: 'purple', xp: 120, quelle: 'Bull et al., Br J Sports Med 2020 (WHO)' },
    schlaf5: { titel: () => '5 Nächte mit 7 Stunden', text: 'Erwachsene brauchen mindestens 7 Stunden Schlaf – Sportler eher mehr.', icon: 'i-moon', farbe: 'indigo', xp: 120, quelle: 'Watson et al., Sleep 2015 (AASM)' },
    schritte_w: { titel: (c) => nf(c.ziel) + ' Schritte in dieser Woche', text: 'Etwa 8.000 bis 10.000 Schritte am Tag senken das Sterberisiko deutlich.', icon: 'i-steps', farbe: 'green', xp: 100, einheit: 'Schritte', quelle: 'Paluch et al., Lancet Public Health 2022' },
    aktiv5: { titel: () => 'An 5 Tagen aktiv', text: 'Schrittziel geschafft oder mindestens 20 Minuten trainiert.', icon: 'i-flame', farbe: 'orange', xp: 120 },
    checkin3: { titel: () => '3× Check-in', text: 'Dein Gefühl erfasst, was Sensoren nicht sehen: Muskeln, Stress, Stimmung.', icon: 'i-smile', farbe: 'green', xp: 60 },
    mobil2: { titel: () => '2× Mobilität', text: 'Zweimal mindestens 10 Minuten Pilates, Yoga oder Dehnen.', icon: 'i-lotus', farbe: 'teal', xp: 80 },
    regel: { titel: () => 'Regelmäßig schlafen', text: 'An 5 Abenden höchstens 45 Minuten neben deiner üblichen Einschlafzeit.', icon: 'i-clock', farbe: 'indigo', xp: 100, quelle: 'Windred et al., Sleep 2024' },
    plan80: { titel: () => '80 % deines Plans', text: 'Erledige mindestens 80 % der Einheiten, die dein Trainingsplan diese Woche vorsieht.', icon: 'i-cal', farbe: 'blue', xp: 150 },
    locker80: { titel: () => '80 % locker trainieren', text: 'Mindestens 80 % der Trainingszeit unter deiner ersten Schwelle – so trainieren Ausdauerprofis.', icon: 'i-gauge', farbe: 'teal', xp: 100, einheit: '%', quelle: 'Seiler, Int J Sports Physiol Perform 2010' },
    ruhetag: { titel: () => 'Ein echter Ruhetag', text: 'Ein Tag ohne Training, höchstens lockeres Gehen. Stärker wirst du in der Erholung.', icon: 'i-moon', farbe: 'teal', xp: 60 },
    wissen3: { titel: () => '3 Begriffe im Wissen lesen', text: 'Wissen macht deine Zahlen verständlich.', icon: 'i-book', farbe: 'gold', xp: 60 },
    checkin7: { titel: () => 'Jeden Morgen Check-in', text: 'Sieben Tage, sieben Check-ins – so kennt die App dein Normal ganz genau.', icon: 'i-smile', farbe: 'green', xp: 120 },
    schritte3: { titel: (c) => '3 × ' + nf(c.schrittziel) + ' Schritte', text: 'An drei Tagen dein Schrittziel – ein Spaziergang nach dem Essen hilft.', icon: 'i-steps', farbe: 'green', xp: 80, quelle: 'Paluch et al., Lancet Public Health 2022' },
    wasser5: { titel: () => '5 Tage Trinkziel', text: 'An fünf Tagen genug getrunken – notiert unter Heute notiert.', icon: 'i-glass', farbe: 'blue', xp: 100 },
    routine3: { titel: () => '3 Kurz-Routinen', text: 'Dreimal 5–10 Minuten für Nacken, Rücken oder Atmung.', icon: 'i-lotus', farbe: 'teal', xp: 80 },
    schlaf75: { titel: () => '4 Nächte mit 7,5 Stunden', text: 'Ausgeschlafen in die Woche – Schlaf ist das billigste Leistungsmittel.', icon: 'i-moon', farbe: 'indigo', xp: 100, quelle: 'Watson et al., Sleep 2015 (AASM)' },
  };
  const TAG_BONUS = 25, WOCHEN_BONUS = 100, SERIE_XP = 20, SERIE_MAX = 10;

  /* =====================================================================
     Trophäen: besondere Leistungen, auch rückwirkend aus deinen Daten
     ===================================================================== */
  const TR_XP = { bronze: 50, silber: 100, gold: 200, platin: 400 };
  const TR_KAT = {
    schritte: ['Schritte', 'i-steps', 'green'], lauf: ['Laufen', 'i-run', 'mint'], rad: ['Rad', 'i-bike', 'orange'], schwimmen: ['Schwimmen', 'i-swim', 'blue'],
    ausdauer: ['Ausdauer & Abenteuer', 'i-mountain', 'red'], konstanz: ['Dranbleiben', 'i-flame', 'orange'], kraft: ['Kraft & Beweglichkeit', 'i-dumbbell', 'purple'],
    schlaf: ['Schlaf & Erholung', 'i-moon', 'indigo'], alltag: ['Alltag & Gewohnheiten', 'i-glass', 'blue'], app: ['Wissen & App', 'i-book', 'gold'],
  };
  const TR = [
    ['schritte_10k', 'schritte', '10.000er', 'Ein Tag mit mindestens 10.000 Schritten.', 'bronze', 'i-steps', 1],
    ['schritte_20k', 'schritte', 'Doppelt hält besser', '20.000 Schritte an einem Tag.', 'silber', 'i-steps', 1],
    ['schritte_30k', 'schritte', 'Wandertag', '30.000 Schritte an einem Tag.', 'gold', 'i-mountain', 1],
    ['schritte_woche', 'schritte', 'Fleißige Woche', '70.000 Schritte in einer Kalenderwoche.', 'silber', 'i-cal', 1],
    ['schrittziel_7', 'schritte', 'Sieben auf einen Streich', '7 Tage in Folge dein Schrittziel geschafft.', 'silber', 'i-flame', 1],
    ['schrittziel_30', 'schritte', 'Gewohnheitssache', '30 Tage in Folge dein Schrittziel geschafft.', 'gold', 'i-flame', 1],
    ['schritte_mio', 'schritte', 'Millionen-Schritte', 'Eine Million Schritte insgesamt.', 'gold', 'i-star', 1],
    ['lauf_5k', 'lauf', 'Erste 5 km', 'Ein Lauf über mindestens 5 Kilometer.', 'bronze', 'i-run', 0],
    ['lauf_10k', 'lauf', 'Zehner', 'Ein Lauf über mindestens 10 Kilometer.', 'silber', 'i-run', 0],
    ['lauf_hm', 'lauf', 'Halbmarathon', 'Ein Lauf über mindestens 21,1 Kilometer.', 'gold', 'i-medal', 0],
    ['lauf_m', 'lauf', 'Marathon', 'Ein Lauf über die volle Marathondistanz.', 'platin', 'i-crown', 0],
    ['rad_50', 'rad', 'Halbes Hundert', 'Eine Radeinheit über mindestens 50 Kilometer.', 'bronze', 'i-bike', 0],
    ['rad_100', 'rad', 'Hunderter', 'Eine Radeinheit über mindestens 100 Kilometer.', 'silber', 'i-bike', 0],
    ['rad_180', 'rad', 'Langdistanz-Rad', '180 Kilometer am Stück – die Radstrecke einer Langdistanz.', 'gold', 'i-trophy', 0],
    ['schwimm_1k', 'schwimmen', 'Ein Kilometer', 'Mindestens 1.000 Meter in einer Einheit.', 'bronze', 'i-swim', 0],
    ['schwimm_2k', 'schwimmen', 'Zwei Kilometer', 'Mindestens 2.000 Meter in einer Einheit.', 'silber', 'i-swim', 0],
    ['schwimm_38', 'schwimmen', 'Langdistanz-Schwimmen', '3,8 Kilometer in einer Einheit.', 'gold', 'i-drop', 0],
    ['lang_3h', 'ausdauer', 'Ausdauernd', 'Eine Einheit von mindestens 3 Stunden.', 'silber', 'i-hourglass', 0],
    ['lang_5h', 'ausdauer', 'Eiserne Ausdauer', 'Eine Einheit von mindestens 5 Stunden.', 'gold', 'i-hourglass', 0],
    ['hoehe_1000', 'ausdauer', 'Bergziege', '1.000 Höhenmeter in einer Einheit.', 'silber', 'i-mountain', 0],
    ['multisport', 'ausdauer', 'Mehrkampf', 'Ein Mehrkampf wie Triathlon oder Duathlon, mit der Uhr aufgezeichnet.', 'gold', 'i-tri', 0],
    ['allround', 'ausdauer', 'Allround', '5 verschiedene Sportarten innerhalb von 30 Tagen.', 'silber', 'i-target', 0],
    ['frueh_5', 'ausdauer', 'Frühaufsteher', '5 Einheiten, die vor 7 Uhr beginnen.', 'bronze', 'i-sun', 0],
    ['einheiten_10', 'konstanz', 'Dranbleiben', '10 Einheiten – von der Uhr oder in der App.', 'bronze', 'i-bolt', 0],
    ['einheiten_100', 'konstanz', 'Hundert Einheiten', '100 Einheiten – von der Uhr oder in der App.', 'silber', 'i-bolt', 0],
    ['einheiten_365', 'konstanz', 'Ein Jahr voller Training', '365 Einheiten – von der Uhr oder in der App.', 'gold', 'i-star', 0],
    ['who_4', 'konstanz', 'Vier gute Wochen', '4 Wochen in Folge mindestens 150 Bewegungsminuten.', 'silber', 'i-heart', 0],
    ['who_12', 'konstanz', 'Ein Quartal in Bewegung', '12 Wochen in Folge mindestens 150 Bewegungsminuten.', 'gold', 'i-heart', 0],
    ['who_26', 'konstanz', 'Ein halbes Jahr in Bewegung', '26 Wochen in Folge mindestens 150 Bewegungsminuten.', 'platin', 'i-crown', 0],
    ['aktiv_100', 'konstanz', '100 aktive Tage', 'An 100 Tagen Schrittziel geschafft oder mindestens 20 Minuten trainiert.', 'gold', 'i-flame', 0],
    ['kraft_1', 'kraft', 'Eisen angefasst', 'Dein erstes Krafttraining – im Gym der App oder auf der Uhr.', 'bronze', 'i-dumbbell', 0],
    ['kraft_10', 'kraft', 'Zehnmal Eisen', '10 Krafteinheiten.', 'silber', 'i-dumbbell', 0],
    ['kraft_50', 'kraft', 'Kraftpaket', '50 Krafteinheiten.', 'gold', 'i-shield', 0],
    ['kraft_serie', 'kraft', 'Doppelt stark', '4 Wochen in Folge mindestens 2× Kraft pro Woche.', 'gold', 'i-medal', 0],
    ['flow_1', 'kraft', 'Erster Flow', 'Deine erste Einheit Pilates, Yoga oder Mobilität.', 'bronze', 'i-lotus', 0],
    ['flow_10', 'kraft', 'Geschmeidig', '10 Einheiten Pilates, Yoga oder Mobilität.', 'silber', 'i-lotus', 0],
    ['schlaf_perfekt', 'schlaf', 'Perfekte Nacht', 'Schlafziel erreicht und Schlaf-Score ab 85.', 'bronze', 'i-moon', 1],
    ['schlaf_7', 'schlaf', 'Ausgeschlafen', '7 Nächte in Folge mindestens 7 Stunden Schlaf.', 'silber', 'i-moon', 1],
    ['schlaf_30', 'schlaf', 'Schlafprofi', '30 Nächte mit mindestens 7 Stunden innerhalb von 5 Wochen.', 'gold', 'i-star', 1],
    ['rhythmus_14', 'schlaf', 'Wie ein Uhrwerk', '14 Nächte in Folge höchstens 30 Minuten neben deiner üblichen Einschlafzeit.', 'gold', 'i-clock', 1],
    ['gruen_7', 'schlaf', 'Im grünen Bereich', '7 Tage in Folge grüne Tagesform.', 'silber', 'i-ring', 1],
    ['erholung_3', 'schlaf', 'Auf den Körper gehört', 'An 3 roten Tagen auf hartes Training verzichtet.', 'silber', 'i-shield', 0],
    ['klug_10', 'schlaf', 'Klug trainiert', 'An 10 roten Tagen auf hartes Training verzichtet.', 'gold', 'i-shield', 0],
    ['schlaf_75', 'schlaf', 'Sieben auf 7,5', '7 Nächte in Folge mindestens 7,5 Stunden Schlaf.', 'gold', 'i-moon', 0],
    ['wasser_7', 'alltag', 'Gut versorgt', '7 Tage in Folge dein Trinkziel erreicht.', 'silber', 'i-glass', 0],
    ['wasser_30', 'alltag', 'Wasserträger', 'An 30 Tagen dein Trinkziel erreicht.', 'gold', 'i-drop', 0],
    ['protein_14', 'alltag', 'Baustoff', 'An 14 Tagen dein Eiweißziel erreicht.', 'silber', 'i-egg', 0],
    ['checkin_serie7', 'alltag', 'Morgenmensch', '7 Tage in Folge Check-in.', 'silber', 'i-sun', 0],
    ['checkin_serie30', 'alltag', 'Jeden Morgen', '30 Tage in Folge Check-in.', 'gold', 'i-flame', 0],
    ['routine_1', 'alltag', 'Kurze Pause', 'Deine erste Kurz-Routine.', 'bronze', 'i-lotus', 0],
    ['routine_20', 'alltag', 'Pausenprofi', '20 Kurz-Routinen.', 'silber', 'i-lotus', 0],
    ['checkin_7', 'app', 'Ehrlich zu dir', '7 Check-ins.', 'bronze', 'i-smile', 0],
    ['checkin_30', 'app', 'Selbstkenntnis', '30 Check-ins.', 'silber', 'i-smile', 0],
    ['checkin_100', 'app', 'Körpergefühl', '100 Check-ins.', 'gold', 'i-heart', 0],
    ['wissen_5', 'app', 'Wissbegierig', '5 verschiedene Begriffe im Wissen gelesen.', 'bronze', 'i-book', 0],
    ['wissen_25', 'app', 'Wandelndes Lexikon', '25 verschiedene Begriffe im Wissen gelesen.', 'silber', 'i-book', 0],
    ['plan_1', 'app', 'Planvoll', 'Deinen ersten Trainingsplan erstellt.', 'bronze', 'i-cal', 0],
    ['plan_woche', 'app', 'Plan erfüllt', 'Eine Planwoche komplett erledigt.', 'silber', 'i-check', 0],
    ['quest_10', 'app', 'Auf Questjagd', '10 Quests erledigt.', 'bronze', 'i-target', 0],
    ['quest_100', 'app', 'Questjäger', '100 Quests erledigt.', 'silber', 'i-target', 0],
    ['quest_500', 'app', 'Questlegende', '500 Quests erledigt.', 'gold', 'i-trophy', 0],
    ['bild', 'app', 'Gesicht zeigen', 'Ein eigenes Profilbild hochgeladen.', 'bronze', 'i-camera', 0],
  ].map(([id, k, name, text, stufe, icon, garmin]) => ({ id, kat: k, name, text, stufe, icon, garmin: !!garmin, xp: TR_XP[stufe] }));
  const TR_BY = Object.fromEntries(TR.map((t) => [t.id, t]));

  /* =====================================================================
     Rechnung
     E = { heute, garmin, tage, einheiten, checkins, gym, flow, plan: {datum: [geplant, erledigt]} | null,
           planWochen: {montag: [geplant, erledigt]}, ampel: {datum: 'gruen'|'gelb'|'rot'}, profil: { schritte_ziel, schlafbedarf_min, sportarten, schritte_dyn },
           tagebuch: [{ date, w, p }] (Heute notiert), ziele: { wasser, protein, wasserAm: {datum: ml} }, spiel: gespeicherter Stand, extra: { foto, planDa } }
     ===================================================================== */
  function berechne(E) {
    const heute = E.heute, sp = JSON.parse(JSON.stringify(E.spiel || {}));
    const neu = !sp.start || !/^\d{4}-\d\d-\d\d$/.test(sp.start);
    if (neu) sp.start = heute;
    sp.v = 1; sp.monate = sp.monate || {}; sp.tr = sp.tr || {}; sp.tage = sp.tage || {}; sp.gelesen = Array.isArray(sp.gelesen) ? sp.gelesen : [];
    const zaehlStart = plus(sp.start, -30); // 30 Tage Startguthaben
    const P = E.profil || {}, SP = Array.isArray(P.sportarten) && P.sportarten.length ? P.sportarten : ['schwimmen', 'rad', 'laufen', 'gym'];
    const ziel = clamp(Math.round(+P.schritte_ziel || 8000), 2000, 30000), schlafZiel = clamp(Math.round(+P.schlafbedarf_min || 480), 420, 570);
    const ausdauer = SP.some((s) => ['schwimmen', 'rad', 'laufen'].includes(s)), krafttyp = SP.includes('gym');

    // --- Tageswerte ---
    const TAG = new Map(); (E.tage || []).forEach((r) => { if (r && r.date && r.date <= heute) TAG.set(r.date, r); });
    const AKT = new Map(), ALLE = [];
    (E.einheiten || []).forEach((e) => { const x = einheit(e); if (!x || x.date > heute) return; ALLE.push(x); if (!AKT.has(x.date)) AKT.set(x.date, []); AKT.get(x.date).push(x); });
    const gruppe = (L) => { const m = new Map(); (L || []).forEach((x) => { if (x && /^\d{4}-\d\d-\d\d$/.test(x.d) && x.d <= heute) { if (!m.has(x.d)) m.set(x.d, []); m.get(x.d).push(x); } }); return m; };
    const GYM = gruppe(E.gym), FLOW = gruppe(E.flow);
    const routinen = (d) => (FLOW.get(d) || []).filter((x) => x.stil === 'routine').length;
    const CK = new Set((E.checkins || []).filter((c) => c && c.date && c.date <= heute).map((c) => c.date));
    const CKS = new Map((E.checkins || []).filter((c) => c && c.date && c.date <= heute && +c.schlaf_h >= 2 && +c.schlaf_h <= 14).map((c) => [c.date, +c.schlaf_h * 60])); // Schlaf von Hand (ohne Uhr)
    const TB = new Map(); (E.tagebuch || []).forEach((r) => { if (r && /^\d{4}-\d\d-\d\d$/.test(r.date) && r.date <= heute) TB.set(r.date, r); });
    const zielW = Math.max(0, +(E.ziele && E.ziele.wasser) || 0), zielP = Math.max(0, +(E.ziele && E.ziele.protein) || 0);
    const garmin = !!E.garmin && TAG.size > 0;
    const merk = (fn) => { const c = new Map(); return (d) => { let v = c.get(d); if (v === undefined) { v = fn(d); c.set(d, v); } return v; }; };
    const akt = (d) => AKT.get(d) || [];
    const schritte = (d) => { const r = TAG.get(d); return r && +r.steps > 0 ? +r.steps : 0; };
    const schlafMin = (d) => { const r = TAG.get(d), s = r ? +r.sleep_s : 0; return s >= 3 * 3600 && s <= 13 * 3600 ? s / 60 : r ? null : CKS.get(d) || null; };
    const WA = (E.ziele && E.ziele.wasserAm) || {}; // Trinkziel je Tag (mit Training mehr)
    const zielWAm = (d) => (+WA[d] > 0 ? +WA[d] : zielW);
    const wasserOk = (d) => zielWAm(d) > 0 && +((TB.get(d) || {}).w || 0) >= zielWAm(d);
    const proteinOk = (d) => zielP > 0 && +((TB.get(d) || {}).p || 0) >= zielP;
    const notiertVorher = (d, k) => { let n = 0; for (let i = 1; i <= 7; i++) { const r = TB.get(plus(d, -i)); if (r && +r[k] > 0) n++; } return n >= 3; }; // in den 7 Tagen davor an mindestens 3 Tagen notiert
    const einschlaf = merk((d) => { const r = TAG.get(d); if (!r || schlafMin(d) == null || typeof r.sleep_start !== 'string' || r.sleep_start.length < 16) return null; const h = +r.sleep_start.slice(11, 13) + +r.sleep_start.slice(14, 16) / 60; return h < 12 ? h + 24 : h; });
    const ampel = (d) => (E.ampel && E.ampel[d]) || null;
    const app = merk(appRoh);
    function appRoh(d) { // App-Einträge des Tages; Minuten zählen nur, wenn die Uhr nichts Passendes aufgezeichnet hat
      const A_ = akt(d), hk = A_.some((a) => a.kat === 'kraft'), hm = A_.some((a) => a.kat === 'mobil');
      const g = GYM.get(d) || [], f = FLOW.get(d) || [];
      const gm = hk ? 0 : g.reduce((s, x) => s + clamp(+x.min || 0, 0, 180), 0), fm = hm ? 0 : f.reduce((s, x) => s + clamp(+x.min || 0, 0, 180), 0);
      return { n: g.length + f.length, gym: g.length, flow: f.length, min: gm + fm, gymNeu: hk ? 0 : g.length, flowNeu: hm ? 0 : f.length, flowMin: fm };
    }
    const aktivMin = merk((d) => akt(d).reduce((s, a) => s + a.min, 0) + app(d).min);
    const lockerMin = merk((d) => akt(d).reduce((s, a) => s + a.z[0] + a.z[1] + a.z[2], 0));
    const hartMin = merk((d) => akt(d).reduce((s, a) => s + a.z[3] + a.z[4], 0));
    const kraftN = merk((d) => akt(d).filter((a) => a.kat === 'kraft' && a.min >= 15).length + app(d).gymNeu);
    const mobilMin = merk((d) => akt(d).filter((a) => a.kat === 'mobil').reduce((s, a) => s + a.min, 0) + app(d).flowMin);
    const mobilN = merk((d) => akt(d).filter((a) => a.kat === 'mobil' && a.min >= 10).length + (app(d).flowMin >= 10 ? app(d).flowNeu : 0));
    const einheitenN = merk((d) => akt(d).length + app(d).gymNeu + app(d).flowNeu);
    const who = merk((d) => { const r = TAG.get(d); const im = r && (r.im_moderate != null || r.im_vigorous != null) ? (+r.im_moderate || 0) + 2 * (+r.im_vigorous || 0) : (garmin && r ? 0 : akt(d).reduce((s, a) => s + a.min, 0)); return im + app(d).min; });
    const ampelVor = (d) => (E.ampel && E.ampel[d]) || null;
    // Schrittziel: fest – oder ab Version 8 auf Wunsch dynamisch (wie in alltag-motor.js: Median der 4 Wochen davor + 500, 5.000–12.000, rot × 0,8)
    const zielAm = merk((d) => {
      if (!P.schritte_dyn || d < V8) return ziel;
      const v = []; for (let i = 1; i <= 28; i++) { const x = schritte(plus(d, -i)); if (x > 0) v.push(x); }
      if (v.length < 10) return ziel;
      let z = clamp(Math.round((median2(v) + 500) / 500) * 500, 5000, 12000);
      if (ampelVor(d) === 'rot') z = Math.max(4000, Math.round((z * 0.8) / 500) * 500);
      return z;
    });
    const aktiv = (d) => (garmin && schritte(d) >= zielAm(d)) || aktivMin(d) >= 20;
    const wissen = (d) => String(sp.tage[d] || '').includes('w');
    const plan = (d) => (E.plan && E.plan[d]) || [0, 0];
    const bettZiel = merk((d) => { // eine Viertelstunde vor deiner üblichen Einschlafzeit, zwischen 22 und 1 Uhr
      const v = []; for (let i = 0; i < 28; i++) { const x = einschlaf(plus(d, -i)); if (x != null) v.push(x); }
      const m = median(v); if (m == null || v.length < 5) return null;
      return clamp(Math.round((m - 0.25) * 4) / 4, 22, 25);
    });
    const ruhetag = (d) => aktivMin(d) - akt(d).filter((a) => a.kat === 'gehen').reduce((s, a) => s + a.min, 0) < 10 && hartMin(d) < 1;

    // --- Basis-XP eines Tages ---
    // An roten Tagen (ab Version 8): harte Minuten (Puls-Zonen 4–5) bringen keine XP, wer klug erholt, bekommt +20 XP
    const rotKlug = (d) => d >= V8 && ampel(d) === 'rot';
    const erholt = (d) => (garmin ? hartMin(d) < 5 : !(GYM.get(d) || []).some((x) => ['kraft', 'power'].includes(x.z) || +x.r >= 8)) && aktivMin(d) <= 90;
    function basis(d) {
      const m = rotKlug(d) ? Math.max(0, aktivMin(d) - hartMin(d)) : aktivMin(d), st = schritte(d), sl = schlafMin(d), ap = app(d);
      return {
        klug: rotKlug(d) && d < heute && erholt(d) ? 20 : 0,
        bewegung: Math.round(Math.min(m, 120) + 0.5 * clamp(m - 120, 0, 180)),
        schritte: garmin ? Math.floor(Math.min(st, 10000) / 200) + Math.floor(clamp(st - 10000, 0, 10000) / 400) : 0,
        schlaf: sl == null ? 0 : (sl >= 420 ? 10 : 0) + (sl >= schlafZiel ? 10 : 0),
        checkin: CK.has(d) ? 10 : 0,
        app: 10 * Math.min(3, ap.n), // höchstens drei Einträge am Tag
        plan: 15 * plan(d)[1],
      };
    }

    // --- Tagesquests ---
    function questsAm(d) {
      if (d >= V8) return questsAmV8(d);
      const r = zufall(hash('tag:' + d)), rot = ampel(d) === 'rot', p = plan(d), L = [];
      if (garmin) {
        const A_ = rot ? 'spaziergang' : p[0] > 0 ? 'plan' : waehle(r, ['schritte', 'schritte', 'bewegung30', 'bewegung30', ausdauer ? 'locker' : 'mobil', krafttyp ? 'kraft' : 'bewegung30', 'mobil', 'frueh']);
        const B_ = rot ? 'erholung' : bettZiel(d) != null ? waehle(r, ['schlaf', 'schlaf', 'bettzeit']) : 'schlaf';
        const C_ = waehle(r, ['checkin', 'wissen', 'checkin', A_ === 'mobil' ? 'wissen' : 'mobil', A_ === 'schritte' || rot ? 'checkin' : wtag(d) >= 5 ? 'schritte_plus' : 'schritte']);
        L.push(A_, B_, C_ === A_ ? 'checkin' : C_);
      } else {
        const A_ = p[0] > 0 ? 'plan' : waehle(r, ['bewegung30', krafttyp ? 'kraft' : 'bewegung30', 'mobil']);
        L.push(A_, 'checkin', waehle(r, ['wissen', A_ === 'mobil' ? 'kraft' : 'mobil']));
      }
      return L.map((id) => questTag(id, d));
    }
    function questsAmV8(d) { // Version 8: dazu Trinken, Eiweiß und Kurz-Routinen – fürs Trinken und Eiweiß nur, wer sie notiert
      const r = zufall(hash('tag8:' + d)), rot = ampel(d) === 'rot', p = plan(d), L = [];
      const extra = []; if (zielW && notiertVorher(d, 'w')) extra.push('wasser'); if (zielP && notiertVorher(d, 'p')) extra.push('protein');
      if (garmin) {
        const A_ = rot ? 'spaziergang' : p[0] > 0 ? 'plan' : waehle(r, ['schritte', 'schritte', 'bewegung30', 'bewegung30', ausdauer ? 'locker' : 'mobil', krafttyp ? 'kraft' : 'bewegung30', 'mobil', 'frueh', 'routine']);
        const B_ = rot ? 'erholung' : bettZiel(d) != null ? waehle(r, ['schlaf', 'schlaf', 'bettzeit']) : 'schlaf';
        const C_ = waehle(r, ['checkin', 'wissen', 'routine', A_ === 'mobil' ? 'wissen' : 'mobil', A_ === 'schritte' || rot ? 'checkin' : wtag(d) >= 5 ? 'schritte_plus' : 'schritte'].concat(extra, extra));
        L.push(A_, B_, C_ === A_ ? 'checkin' : C_);
      } else {
        const A_ = rot ? 'routine' : p[0] > 0 ? 'plan' : waehle(r, ['bewegung30', krafttyp ? 'kraft' : 'bewegung30', 'mobil', 'routine']);
        const C_ = waehle(r, ['wissen', A_ === 'mobil' ? 'kraft' : 'mobil', A_ === 'routine' ? 'wissen' : 'routine'].concat(extra, extra));
        L.push(A_, 'checkin', C_ === A_ ? 'wissen' : C_);
      }
      return L.map((id) => questTag(id, d));
    }
    function questTag(id, d) {
      const q = Q_TAG[id], c = { ziel: 1 }, morgen = plus(d, 1);
      let wert = 0, ok = false, status = 'offen';
      if (id === 'schritte' || id === 'schritte_plus') { c.ziel = zielAm(d) + (id === 'schritte_plus' ? 2000 : 0); wert = schritte(d); ok = wert >= c.ziel; }
      else if (id === 'wasser') { c.ziel = zielWAm(d); wert = +((TB.get(d) || {}).w || 0); ok = c.ziel > 0 && wert >= c.ziel; }
      else if (id === 'protein') { c.ziel = zielP; wert = +((TB.get(d) || {}).p || 0); ok = zielP > 0 && wert >= zielP; }
      else if (id === 'routine') { wert = Math.min(1, routinen(d)); ok = wert >= 1; }
      else if (id === 'spaziergang') { c.ziel = 5000; const g = akt(d).filter((a) => a.kat === 'gehen').reduce((s, a) => s + a.min, 0); wert = schritte(d); ok = wert >= 5000 || g >= 20; }
      else if (id === 'bewegung30') { c.ziel = 30; wert = Math.round(aktivMin(d)); ok = wert >= 30; }
      else if (id === 'locker') { c.ziel = 30; wert = Math.round(lockerMin(d)); ok = wert >= 30; }
      else if (id === 'kraft') { wert = Math.min(1, kraftN(d)); ok = wert >= 1; }
      else if (id === 'mobil') { c.ziel = 10; wert = Math.round(mobilMin(d)); ok = wert >= 10; }
      else if (id === 'frueh') { wert = akt(d).some((a) => a.start != null && a.start < 12 && a.min >= 15) ? 1 : 0; ok = wert >= 1; }
      else if (id === 'plan') { const p = plan(d); c.ziel = Math.max(1, p[0]); wert = p[1]; ok = p[0] > 0 && p[1] >= p[0]; }
      else if (id === 'checkin') { wert = CK.has(d) ? 1 : 0; ok = wert >= 1; }
      else if (id === 'wissen') { wert = wissen(d) ? 1 : 0; ok = wert >= 1; }
      else if (id === 'schlaf') { c.ziel = schlafZiel; const s = schlafMin(morgen); wert = s == null ? 0 : Math.round(s); ok = s != null && s >= schlafZiel; if (morgen > heute) status = 'nacht'; }
      else if (id === 'bettzeit') { c.ziel = bettZiel(d) || 24; const e = einschlaf(morgen); wert = e; ok = e != null && e <= c.ziel; if (morgen > heute) status = 'nacht'; }
      else if (id === 'erholung') { wert = Math.round(hartMin(d)); ok = hartMin(d) < 5 && aktivMin(d) <= 90; if (d === heute) status = ok ? 'laeuft' : 'verpasst'; }
      if (status === 'offen') status = ok ? 'fertig' : d < heute ? 'verpasst' : 'offen';
      if (status === 'laeuft' || status === 'nacht') ok = false;
      if (id === 'erholung' && d < heute) status = ok ? 'fertig' : 'verpasst';
      return { id, art: 'tag', datum: d, titel: q.titel(c), text: q.text, icon: q.icon, farbe: q.farbe, xp: q.xp, einheit: q.einheit || null, ziel: c.ziel, wert, fertig: status === 'fertig', status };
    }

    // --- Wochenquests ---
    const planWoche = (m) => (E.planWochen && E.planWochen[m]) || [0, 0];
    const tageDerWoche = (m) => Array.from({ length: 7 }, (_, i) => plus(m, i));
    function serieBis(m) { // Wochen in Folge mit Grundziel (150 min bzw. 3 Einheiten), bis einschließlich Woche m
      let n = 0;
      for (let w = m; n < 60; w = plus(w, -7)) { const D = tageDerWoche(w).filter((d) => d <= heute); if (!D.length) break; if (!grundziel(w)) break; n++; }
      return n;
    }
    function grundziel(m) { const D = tageDerWoche(m).filter((d) => d <= heute); return garmin ? D.reduce((s, d) => s + who(d), 0) >= 150 : D.reduce((s, d) => s + einheitenN(d), 0) >= 3; }
    function questsWoche(m) {
      const neu8 = m >= V8;
      const r = zufall(hash((neu8 ? 'woche8:' : 'woche:') + m)), pw = planWoche(m), L = [garmin ? 'who150' : 'einheiten3'];
      const vorher = [plus(m, -7), plus(m, -14)].every((w) => tageDerWoche(w).filter((d) => aktivMin(d) - akt(d).filter((a) => a.kat === 'gehen').reduce((s, a) => s + a.min, 0) >= 20).length >= 6);
      let pool = garmin ? ['kraft2', 'schlaf5', 'schritte_w', 'aktiv5', 'checkin3', 'mobil2', 'regel'] : ['kraft2', 'mobil2', 'checkin3', 'wissen3'];
      if (neu8) { // Version 8: Gesundheits-Quests
        pool = pool.concat(['checkin7', 'routine3']).concat(garmin ? ['schritte3', 'schlaf75'] : CKS.size ? ['schlaf75'] : []);
        if (zielW && notiertVorher(m, 'w')) pool.push('wasser5', 'wasser5');
      }
      if (garmin && ausdauer) pool.push('locker80');
      if (!krafttyp) pool = pool.filter((x) => x !== 'kraft2').concat(['aktiv5']);
      if (pw[0] >= 2) L.push('plan80');
      if (vorher) L.push('ruhetag');
      for (let i = 0; L.length < 3 && i < 50; i++) { const x = waehle(r, pool); if (!L.includes(x)) L.push(x); }
      return L.slice(0, 3).map((id) => questWoche(id, m));
    }
    function questWoche(id, m) {
      const q = Q_WOCHE[id], D = tageDerWoche(m), bis = D[6], c = { ziel: 1 };
      let lauf = 0, datum = null, wert = 0;
      const zaehle = (fn, z) => { c.ziel = z; for (const d of D) { if (d > heute) break; lauf += fn(d); if (datum == null && lauf >= z) datum = d; } wert = lauf; };
      if (id === 'who150') zaehle(who, 150);
      else if (id === 'einheiten3') zaehle(einheitenN, 3);
      else if (id === 'kraft2') zaehle((d) => (kraftN(d) > 0 ? 1 : 0), 2);
      else if (id === 'schlaf5') zaehle((d) => { const s = schlafMin(d); return s != null && s >= 420 ? 1 : 0; }, 5);
      else if (id === 'schritte_w') zaehle(schritte, Math.round((zielAm(m) * 6) / 1000) * 1000);
      else if (id === 'checkin7') zaehle((d) => (CK.has(d) ? 1 : 0), 7);
      else if (id === 'schritte3') { c.schrittziel = zielAm(m); zaehle((d) => (schritte(d) >= zielAm(d) ? 1 : 0), 3); }
      else if (id === 'wasser5') zaehle((d) => (wasserOk(d) ? 1 : 0), 5);
      else if (id === 'routine3') zaehle(routinen, 3);
      else if (id === 'schlaf75') zaehle((d) => { const s = schlafMin(d); return s != null && s >= 450 ? 1 : 0; }, 4);
      else if (id === 'aktiv5') zaehle((d) => (aktiv(d) ? 1 : 0), 5);
      else if (id === 'checkin3') zaehle((d) => (CK.has(d) ? 1 : 0), 3);
      else if (id === 'mobil2') zaehle((d) => (mobilMin(d) >= 10 ? 1 : 0), 2);
      else if (id === 'wissen3') zaehle((d) => (wissen(d) ? 1 : 0), 3);
      else if (id === 'regel') { const ref = median(Array.from({ length: 28 }, (_, i) => einschlaf(plus(m, -1 - i)))); zaehle((d) => { const e = einschlaf(d); return ref != null && e != null && Math.abs(e - ref) <= 0.75 ? 1 : 0; }, 5); }
      else if (id === 'plan80') { const pw = planWoche(m); zaehle((d) => plan(d)[1], Math.max(1, Math.ceil(0.8 * pw[0]))); }
      else if (id === 'ruhetag') zaehle((d) => (d < heute && ruhetag(d) ? 1 : 0), 1);
      else if (id === 'locker80') {
        c.ziel = 80; const DD = D.filter((d) => d <= heute), ges = DD.reduce((s, d) => s + akt(d).reduce((x, a) => x + a.z.reduce((p, z) => p + z, 0), 0), 0), lo = DD.reduce((s, d) => s + lockerMin(d), 0);
        wert = ges > 0 ? Math.round((100 * lo) / ges) : 0;
        if (bis <= heute && ges >= 120 && wert >= 80) datum = bis;
      }
      const fertig = datum != null, status = fertig ? 'fertig' : bis < heute ? 'verpasst' : 'offen';
      return { id, art: 'woche', woche: m, titel: q.titel(c), text: q.text, quelle: q.quelle || null, icon: q.icon, farbe: q.farbe, xp: q.xp, einheit: q.einheit || null, ziel: c.ziel, wert: Math.round(wert), fertig, status, datum };
    }

    // --- Zeitraum ---
    const daten = [...TAG.keys(), ...AKT.keys(), ...CK, ...GYM.keys(), ...FLOW.keys()].filter((d) => /^\d{4}-\d\d-\d\d$/.test(d)).sort();
    const erster = daten.length ? (daten[0] < zaehlStart ? daten[0] : zaehlStart) : zaehlStart;
    const MS = new Set(Object.keys(sp.monate).filter((m) => /^\d{4}-\d\d$/.test(m) && m <= heute.slice(0, 7))); // auch Monate, deren Daten schon gelöscht sind
    for (let m = erster.slice(0, 7); m <= heute.slice(0, 7); m = plus(monatsEnde(m), 1).slice(0, 7)) MS.add(m);
    const monate = [...MS].sort();
    const offen = monate.filter((m) => !sp.monate[m] || typeof sp.monate[m] !== 'object');
    const zeigeAb = plus(heute, -20); // Tagesdetails für Verläufe
    const LS = new Set(); // Tage, für die XP gerechnet werden
    offen.forEach((m) => { for (let d = m + '-01'; d <= monatsEnde(m) && d <= heute; d = plus(d, 1)) LS.add(d); });
    for (let d = zeigeAb; d <= heute; d = plus(d, 1)) LS.add(d);
    const liveTage = [...LS].sort();

    // Tagesquests, Wochenquests und XP je Tag (ab dem Zählstart)
    const TX = new Map(); // datum → { teile, quests, summe }
    const tx = (d) => { if (!TX.has(d)) TX.set(d, { datum: d, teile: { bewegung: 0, schritte: 0, schlaf: 0, checkin: 0, app: 0, plan: 0, quests: 0, bonus: 0, klug: 0, trophaeen: 0 }, quests: [], summe: 0 }); return TX.get(d); };
    liveTage.forEach((d) => {
      if (d < zaehlStart) return;
      const t = tx(d), b = basis(d);
      Object.assign(t.teile, b);
      const Q = questsAm(d); t.quests = Q;
      const ok = Q.filter((q) => q.fertig);
      t.teile.quests += ok.reduce((s, q) => s + q.xp, 0);
      if (ok.length === Q.length) t.teile.bonus += TAG_BONUS;
    });
    const wochen = [...new Set(liveTage.filter((d) => d >= zaehlStart).map(montag))].sort();
    const WQ = new Map();
    wochen.forEach((m) => {
      const Q = questsWoche(m); WQ.set(m, Q);
      Q.forEach((q) => { if (q.fertig && q.datum >= zaehlStart && TX.has(q.datum)) tx(q.datum).teile.quests += q.xp; });
      const g = Q[0];
      if (g.fertig && g.datum >= zaehlStart && TX.has(g.datum)) tx(g.datum).teile.bonus += SERIE_XP * Math.min(SERIE_MAX, serieBis(m));
      if (Q.every((q) => q.fertig)) { const d = Q.map((q) => q.datum).sort().pop(); if (d >= zaehlStart && TX.has(d)) tx(d).teile.bonus += WOCHEN_BONUS; }
    });
    TX.forEach((t) => { t.summe = Object.values(t.teile).reduce((s, x) => s + x, 0); t.questsFertig = t.quests.filter((q) => q.fertig).length; });

    // --- Zähler je Monat (für Trophäen über alle Zeit) ---
    function monatsWerte(m) {
      const z = { x: 0, q: 0, e: 0, k: 0, m: 0, s: 0, a: 0, c: 0, w: 0, p: 0, r: 0 };
      for (let d = m + '-01'; d <= monatsEnde(m) && d <= heute; d = plus(d, 1)) {
        z.e += einheitenN(d); z.k += kraftN(d); z.m += mobilN(d); z.s += schritte(d); z.a += aktiv(d) ? 1 : 0; z.c += CK.has(d) ? 1 : 0;
        z.w += wasserOk(d) ? 1 : 0; z.p += proteinOk(d) ? 1 : 0; z.r += routinen(d);
        const t = TX.get(d); if (t && d >= zaehlStart) { z.x += t.summe; z.q += t.questsFertig; }
      }
      WQ.forEach((Q) => Q.forEach((q) => { if (q.fertig && q.datum && q.datum.slice(0, 7) === m && q.datum >= zaehlStart) z.q++; }));
      return z;
    }
    const MW = {}; const einfrieren = [];
    monate.forEach((m) => {
      if (sp.monate[m] && typeof sp.monate[m] === 'object') { MW[m] = sp.monate[m]; return; }
      MW[m] = monatsWerte(m);
      if (plus(monatsEnde(m), 7) < heute) { sp.monate[m] = MW[m]; einfrieren.push(m); }
    });
    const summe = (k) => monate.reduce((s, m) => s + (+MW[m][k] || 0), 0);
    const zaehler = { e: summe('e'), k: summe('k'), m: summe('m'), s: summe('s'), a: summe('a'), c: summe('c'), q: summe('q'), w: summe('w'), p: summe('p'), r: summe('r') };
    // Wann ein Zähler eine Schwelle erreicht hat: abgeschlossene Monate am Monatsende, sonst genau am Tag
    function erreichtAm(k, schwelle, tagesWert) {
      let lauf = 0;
      for (const m of monate) {
        if (sp.monate[m] && !offen.includes(m)) { lauf += +sp.monate[m][k] || 0; if (lauf >= schwelle) return monatsEnde(m) > heute ? heute : monatsEnde(m); continue; }
        for (let d = m + '-01'; d <= monatsEnde(m) && d <= heute; d = plus(d, 1)) { lauf += tagesWert(d); if (lauf >= schwelle) return d; }
      }
      return null;
    }

    // --- Trophäen ---
    const T_ALLE = [...new Set(daten)];
    const erstes = (L, fn) => { for (const d of L) if (fn(d)) return d; return null; };
    const serie = (L, fn, n) => { let k = 0, vor = null; for (const d of L) { if (vor && tageZwischen(vor, d) !== 1) k = 0; k = fn(d) ? k + 1 : 0; vor = d; if (k >= n) return d; } return null; };
    const tageAlle = [...TAG.keys()].sort();
    const maxEinheit = (kk, feld, wert) => { const L = ALLE.filter((a) => kk.includes(a.kat) && a[feld] >= wert).sort((x, y) => (x.date < y.date ? -1 : 1)); return L.length ? L[0].date : null; };
    const bestWert = (kk, feld) => ALLE.filter((a) => kk.includes(a.kat)).reduce((m, a) => Math.max(m, a[feld]), 0);
    const tagesReihe = []; if (T_ALLE.length) for (let d = T_ALLE[0]; d <= heute; d = plus(d, 1)) tagesReihe.push(d);
    function wochenSerie(fn, n) { // n Kalenderwochen in Folge
      if (!tagesReihe.length) return null;
      let k = 0;
      for (let m = montag(tagesReihe[0]); m <= heute; m = plus(m, 7)) { const D = tageDerWoche(m).filter((d) => d <= heute); const ok = fn(D); k = ok ? k + 1 : 0; if (k >= n) return D[D.length - 1]; }
      return null;
    }
    const sieben = (fn) => { let best = 0; let k = 0, vor = null; tageAlle.forEach((d) => { if (vor && tageZwischen(vor, d) !== 1) k = 0; k = fn(d) ? k + 1 : 0; best = Math.max(best, k); vor = d; }); return best; };
    const siebenIn = (L, fn) => { let best = 0, k = 0, vor = null; L.forEach((d) => { if (vor && tageZwischen(vor, d) !== 1) k = 0; k = fn(d) ? k + 1 : 0; best = Math.max(best, k); vor = d; }); return best; };
    const tageMitAmpel = () => [...new Set(tageAlle.concat(Object.keys(E.ampel || {}).filter((d) => d <= heute)))].sort(); // auch Tage mit Tagesform nach Gefühl
    const schlafTage = () => [...new Set(tageAlle.concat([...CKS.keys()]))].sort();
    const fortschritt = {}; // id → [wert, ziel]
    const PRUEF = {
      schritte_10k: () => { fortschritt.schritte_10k = [Math.max(0, ...tageAlle.map(schritte)), 10000]; return erstes(tageAlle, (d) => schritte(d) >= 10000); },
      schritte_20k: () => { fortschritt.schritte_20k = [Math.max(0, ...tageAlle.map(schritte)), 20000]; return erstes(tageAlle, (d) => schritte(d) >= 20000); },
      schritte_30k: () => { fortschritt.schritte_30k = [Math.max(0, ...tageAlle.map(schritte)), 30000]; return erstes(tageAlle, (d) => schritte(d) >= 30000); },
      schritte_woche: () => { let best = 0, am = null; if (tageAlle.length) for (let m = montag(tageAlle[0]); m <= heute; m = plus(m, 7)) { const s = tageDerWoche(m).reduce((x, d) => x + schritte(d), 0); best = Math.max(best, s); if (!am && s >= 70000) am = tageDerWoche(m).filter((d) => d <= heute).pop(); } fortschritt.schritte_woche = [best, 70000]; return am; },
      schrittziel_7: () => { fortschritt.schrittziel_7 = [sieben((d) => schritte(d) >= zielAm(d)), 7]; return serie(tageAlle, (d) => schritte(d) >= zielAm(d), 7); },
      schrittziel_30: () => { fortschritt.schrittziel_30 = [sieben((d) => schritte(d) >= zielAm(d)), 30]; return serie(tageAlle, (d) => schritte(d) >= zielAm(d), 30); },
      schritte_mio: () => { fortschritt.schritte_mio = [zaehler.s, 1e6]; return erreichtAm('s', 1e6, schritte); },
      lauf_5k: () => { fortschritt.lauf_5k = [bestWert(['lauf'], 'km'), 5]; return maxEinheit(['lauf'], 'km', 4.93); },
      lauf_10k: () => { fortschritt.lauf_10k = [bestWert(['lauf'], 'km'), 10]; return maxEinheit(['lauf'], 'km', 9.85); },
      lauf_hm: () => { fortschritt.lauf_hm = [bestWert(['lauf'], 'km'), 21.0975]; return maxEinheit(['lauf'], 'km', 20.8); },
      lauf_m: () => { fortschritt.lauf_m = [bestWert(['lauf'], 'km'), 42.195]; return maxEinheit(['lauf'], 'km', 41.6); },
      rad_50: () => { fortschritt.rad_50 = [bestWert(['rad'], 'km'), 50]; return maxEinheit(['rad'], 'km', 50); },
      rad_100: () => { fortschritt.rad_100 = [bestWert(['rad'], 'km'), 100]; return maxEinheit(['rad'], 'km', 100); },
      rad_180: () => { fortschritt.rad_180 = [bestWert(['rad'], 'km'), 180]; return maxEinheit(['rad'], 'km', 177); },
      schwimm_1k: () => { fortschritt.schwimm_1k = [bestWert(['schwimmen'], 'km'), 1]; return maxEinheit(['schwimmen'], 'km', 1); },
      schwimm_2k: () => { fortschritt.schwimm_2k = [bestWert(['schwimmen'], 'km'), 2]; return maxEinheit(['schwimmen'], 'km', 2); },
      schwimm_38: () => { fortschritt.schwimm_38 = [bestWert(['schwimmen'], 'km'), 3.8]; return maxEinheit(['schwimmen'], 'km', 3.74); },
      lang_3h: () => { const k = Object.keys(Object.fromEntries(KAT_TYP)).concat('sonst'); fortschritt.lang_3h = [bestWert(k, 'min') / 60, 3]; return maxEinheit(k, 'min', 180); },
      lang_5h: () => { const k = Object.keys(Object.fromEntries(KAT_TYP)).concat('sonst'); fortschritt.lang_5h = [bestWert(k, 'min') / 60, 5]; return maxEinheit(k, 'min', 300); },
      hoehe_1000: () => { const k = ['lauf', 'rad', 'gehen', 'sonst']; fortschritt.hoehe_1000 = [bestWert(k, 'hm'), 1000]; return maxEinheit(k, 'hm', 1000); },
      multisport: () => { const L = (E.einheiten || []).filter((e) => e && e.is_parent && /multi_sport|triathlon|duathlon/.test(e.type || '') && e.date <= heute).map((e) => e.date).sort(); fortschritt.multisport = [L.length ? 1 : 0, 1]; return L[0] || null; },
      allround: () => {
        let best = 0, am = null; const S = [...ALLE].sort((x, y) => (x.date < y.date ? -1 : 1));
        S.forEach((a, i) => { const von = plus(a.date, -29), arten = new Set(S.slice(0, i + 1).filter((b) => b.date >= von).map((b) => (b.kat === 'sonst' ? b.typ.replace(/_v\d+$/, '') : b.kat))); best = Math.max(best, arten.size); if (!am && arten.size >= 5) am = a.date; });
        fortschritt.allround = [best, 5]; return am;
      },
      frueh_5: () => { const L = ALLE.filter((a) => a.start != null && a.start < 7).sort((x, y) => (x.date < y.date ? -1 : 1)); fortschritt.frueh_5 = [L.length, 5]; return L.length >= 5 ? L[4].date : null; },
      einheiten_10: () => { fortschritt.einheiten_10 = [zaehler.e, 10]; return erreichtAm('e', 10, einheitenN); },
      einheiten_100: () => { fortschritt.einheiten_100 = [zaehler.e, 100]; return erreichtAm('e', 100, einheitenN); },
      einheiten_365: () => { fortschritt.einheiten_365 = [zaehler.e, 365]; return erreichtAm('e', 365, einheitenN); },
      who_4: () => whoSerie(4), who_12: () => whoSerie(12), who_26: () => whoSerie(26),
      aktiv_100: () => { fortschritt.aktiv_100 = [zaehler.a, 100]; return erreichtAm('a', 100, (d) => (aktiv(d) ? 1 : 0)); },
      kraft_1: () => { fortschritt.kraft_1 = [Math.min(1, zaehler.k), 1]; return erreichtAm('k', 1, kraftN); },
      kraft_10: () => { fortschritt.kraft_10 = [zaehler.k, 10]; return erreichtAm('k', 10, kraftN); },
      kraft_50: () => { fortschritt.kraft_50 = [zaehler.k, 50]; return erreichtAm('k', 50, kraftN); },
      kraft_serie: () => { let k = 0, best = 0; const am = wochenSerie((D) => { const ok = D.filter((d) => kraftN(d) > 0).length >= 2; k = ok ? k + 1 : 0; best = Math.max(best, k); return ok; }, 4); fortschritt.kraft_serie = [Math.min(4, best), 4]; return am; },
      flow_1: () => { fortschritt.flow_1 = [Math.min(1, zaehler.m), 1]; return erreichtAm('m', 1, mobilN); },
      flow_10: () => { fortschritt.flow_10 = [zaehler.m, 10]; return erreichtAm('m', 10, mobilN); },
      schlaf_perfekt: () => { fortschritt.schlaf_perfekt = [0, 1]; return erstes(tageAlle, (d) => { const s = schlafMin(d), r = TAG.get(d); return s != null && s >= schlafZiel && +r.sleep_score >= 85; }); },
      schlaf_7: () => { const ok = (d) => { const s = schlafMin(d); return s != null && s >= 420; }; fortschritt.schlaf_7 = [sieben(ok), 7]; return serie(tageAlle, ok, 7); },
      schlaf_30: () => {
        const ok = (d) => { const s = schlafMin(d); return s != null && s >= 420; }; let best = 0, am = null;
        tageAlle.forEach((d) => { let n = 0; for (let i = 0; i < 35; i++) if (ok(plus(d, -i))) n++; best = Math.max(best, n); if (!am && n >= 30) am = d; });
        fortschritt.schlaf_30 = [best, 30]; return am;
      },
      rhythmus_14: () => {
        const ok = (d) => { const e = einschlaf(d); if (e == null) return false; const v = []; for (let i = 1; i <= 28; i++) { const x = einschlaf(plus(d, -i)); if (x != null) v.push(x); } const m = median(v); return m != null && v.length >= 7 && Math.abs(e - m) <= 0.5; };
        fortschritt.rhythmus_14 = [sieben(ok), 14]; return serie(tageAlle, ok, 14);
      },
      gruen_7: () => { const ok = (d) => ampel(d) === 'gruen'; fortschritt.gruen_7 = [sieben(ok), 7]; return serie(tageAlle, ok, 7); },
      erholung_3: () => { const L = tageMitAmpel().filter((d) => d < heute && ampel(d) === 'rot' && hartMin(d) < 5 && aktivMin(d) <= 90); fortschritt.erholung_3 = [L.length, 3]; return L.length >= 3 ? L[2] : null; },
      klug_10: () => { const L = tageMitAmpel().filter((d) => d < heute && ampel(d) === 'rot' && erholt(d)); fortschritt.klug_10 = [L.length, 10]; return L.length >= 10 ? L[9] : null; },
      schlaf_75: () => { const ok = (d) => { const s = schlafMin(d); return s != null && s >= 450; }; const L = schlafTage(); fortschritt.schlaf_75 = [siebenIn(L, ok), 7]; return serie(L, ok, 7); },
      wasser_7: () => { const L = [...TB.keys()].sort(); fortschritt.wasser_7 = [siebenIn(L, wasserOk), 7]; return serie(L, wasserOk, 7); },
      wasser_30: () => { fortschritt.wasser_30 = [zaehler.w, 30]; return erreichtAm('w', 30, (d) => (wasserOk(d) ? 1 : 0)); },
      protein_14: () => { fortschritt.protein_14 = [zaehler.p, 14]; return erreichtAm('p', 14, (d) => (proteinOk(d) ? 1 : 0)); },
      checkin_serie7: () => { const L = [...CK].sort(); fortschritt.checkin_serie7 = [siebenIn(L, () => true), 7]; return serie(L, () => true, 7); },
      checkin_serie30: () => { const L = [...CK].sort(); fortschritt.checkin_serie30 = [siebenIn(L, () => true), 30]; return serie(L, () => true, 30); },
      routine_1: () => { fortschritt.routine_1 = [Math.min(1, zaehler.r), 1]; return erreichtAm('r', 1, routinen); },
      routine_20: () => { fortschritt.routine_20 = [zaehler.r, 20]; return erreichtAm('r', 20, routinen); },
      checkin_7: () => { fortschritt.checkin_7 = [zaehler.c, 7]; return erreichtAm('c', 7, (d) => (CK.has(d) ? 1 : 0)); },
      checkin_30: () => { fortschritt.checkin_30 = [zaehler.c, 30]; return erreichtAm('c', 30, (d) => (CK.has(d) ? 1 : 0)); },
      checkin_100: () => { fortschritt.checkin_100 = [zaehler.c, 100]; return erreichtAm('c', 100, (d) => (CK.has(d) ? 1 : 0)); },
      wissen_5: () => { fortschritt.wissen_5 = [sp.gelesen.length, 5]; return sp.gelesen.length >= 5 ? heute : null; },
      wissen_25: () => { fortschritt.wissen_25 = [sp.gelesen.length, 25]; return sp.gelesen.length >= 25 ? heute : null; },
      plan_1: () => { fortschritt.plan_1 = [E.extra && E.extra.planDa ? 1 : 0, 1]; return E.extra && E.extra.planDa ? (E.extra.planErstellt && E.extra.planErstellt <= heute ? E.extra.planErstellt : heute) : null; },
      plan_woche: () => { let am = null; Object.entries(E.planWochen || {}).sort().forEach(([m, w]) => { if (!am && w[0] >= 2 && w[1] >= w[0] && plus(m, 6) <= heute) am = plus(m, 6); }); fortschritt.plan_woche = [am ? 1 : 0, 1]; return am; },
      quest_10: () => { fortschritt.quest_10 = [zaehler.q, 10]; return questAm(10); },
      quest_100: () => { fortschritt.quest_100 = [zaehler.q, 100]; return questAm(100); },
      quest_500: () => { fortschritt.quest_500 = [zaehler.q, 500]; return questAm(500); },
      bild: () => { fortschritt.bild = [E.extra && E.extra.foto ? 1 : 0, 1]; return E.extra && E.extra.foto ? heute : null; },
    };
    function whoSerie(n) {
      const id = 'who_' + n; let k = 0, best = 0;
      const am = wochenSerie((D) => { const ok = D.length === 7 && D.reduce((s, d) => s + who(d), 0) >= 150; k = ok ? k + 1 : 0; best = Math.max(best, k); return ok; }, n);
      fortschritt[id] = [Math.min(n, best), n]; return am;
    }
    function questAm(n) { // Datum, an dem die n-te Quest erledigt wurde
      const live = (d) => offen.includes(d.slice(0, 7)); // Tage abgeschlossener Monate stecken schon im Monatswert
      const qd = []; TX.forEach((t) => t.quests.forEach((q) => { if (q.fertig && live(q.datum)) qd.push(q.datum); })); WQ.forEach((Q) => Q.forEach((q) => { if (q.fertig && q.datum >= zaehlStart && live(q.datum)) qd.push(q.datum); }));
      qd.sort();
      const vorher = monate.filter((m) => sp.monate[m] && !offen.includes(m)).reduce((s, m) => s + (+sp.monate[m].q || 0), 0);
      if (vorher >= n) { let lauf = 0; for (const m of monate) { if (!(sp.monate[m] && !offen.includes(m))) continue; lauf += +sp.monate[m].q || 0; if (lauf >= n) return monatsEnde(m); } }
      return qd[n - 1 - vorher] || null;
    }
    const neueTr = [];
    TR.forEach((t) => {
      const am = PRUEF[t.id] ? PRUEF[t.id]() : null;
      if (!sp.tr[t.id] && am) { sp.tr[t.id] = am; neueTr.push(t.id); }
    });
    const trophaeen = TR.map((t) => {
      const am = sp.tr[t.id] || null, f = fortschritt[t.id] || [0, 1];
      return Object.assign({}, t, { erreicht: am, mitXp: !!am, frueher: !!am && am < zaehlStart, wert: am ? f[1] : f[0], ziel: f[1], anteil: am ? 1 : clamp(f[0] / f[1], 0, 1) });
    });
    const trXp = trophaeen.reduce((s, t) => s + (t.mitXp ? t.xp : 0), 0);
    trophaeen.forEach((t) => { if (t.mitXp && TX.has(t.erreicht)) { const x = tx(t.erreicht); x.teile.trophaeen += t.xp; x.summe += t.xp; } });

    // --- Summe, Level, heute ---
    const xp = summe('x') + trXp;
    const level = levelAus(xp);
    const H = TX.get(heute) || null;
    const wocheJetzt = WQ.get(montag(heute)) || (heute >= zaehlStart ? questsWoche(montag(heute)) : []);
    const verlauf = []; for (let d = plus(heute, -13); d <= heute; d = plus(d, 1)) { const t = TX.get(d); verlauf.push({ datum: d, summe: t ? t.summe : 0, teile: t ? t.teile : null, quests: t ? t.questsFertig : 0 }); }
    const startXp = (() => { let s = 0; TX.forEach((t, d) => { if (d < sp.start) s += t.summe; }); return s; })(); // Startguthaben (30 Tage, mit Trophäen dieser Tage)
    const trFrueher = trophaeen.filter((t) => t.frueher); // Trophäen von vor dem Zählstart: Willkommensbonus

    // Gesehen-Stand für Feiern
    sp.gesehen = sp.gesehen && typeof sp.gesehen === 'object' ? sp.gesehen : {};
    if (neu) sp.gesehen.lvl = level.nr;
    // Wissen-Lesetage nur 60 Tage aufheben
    Object.keys(sp.tage).forEach((d) => { if (d < plus(heute, -60)) delete sp.tage[d]; });

    const vorherJson = kanon(E.spiel || {}), nachJson = kanon(sp);
    return {
      heute, start: sp.start, zaehlStart, neu, garmin, ziel: zielAm(heute), zielFest: ziel, schlafZiel,
      xp, level, startXp, trXp, willkommen: { anzahl: trFrueher.length, xp: trFrueher.reduce((s, t) => s + t.xp, 0) },
      heuteXp: H ? H.summe : 0, heuteTeile: H ? H.teile : null,
      quests: { heute: H ? H.quests : [], woche: wocheJetzt, serie: serieBis(montag(heute)), serieLetzte: serieBis(plus(montag(heute), -7)) },
      verlauf, trophaeen, neueTr, eingefroren: einfrieren,
      zaehler, freigeschaltet: freigeschaltet(level.nr),
      spiel: sp, geaendert: vorherJson !== nachJson,
    };
  }

  const motor = { kanon, berechne, levelAus, xpFuer, schritt, belohnungen, freigeschaltet, ROAD, STUFEN, stufeVon, TITEL, BANNER, ABZEICHEN, TR, TR_BY, TR_KAT, TR_XP, Q_TAG, Q_WOCHE, MAX_LEVEL, STERN_XP, TAG_BONUS, WOCHEN_BONUS, V8, kat };
  if (typeof module === 'object' && module && module.exports) module.exports = motor;
  else global.tfSpielMotor = motor;
})(typeof window !== 'undefined' ? window : this);
