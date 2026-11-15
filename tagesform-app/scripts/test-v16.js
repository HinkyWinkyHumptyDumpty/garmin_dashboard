// Prüft die Rechnungen der Version 16 offline: node scripts/test-v16.js
// Eigene Einheiten in der Belastung (Schätzung, Abgleich mit der Uhr, Beine) und die Leistungsprognose zum Renntag.
const path = require('path');
const M = require(path.join(__dirname, '..', 'public', 'alltag-motor.js'));
const { rechne } = require(path.join(__dirname, '..', 'lib', 'rechnen.js'));
let fehler = 0;
const pruefe = (n, ok, info) => { console.log((ok ? 'ok     ' : 'FEHLER ') + n + (ok || info == null ? '' : ' – ' + JSON.stringify(info).slice(0, 300))); if (!ok) fehler++; };
const heute = new Date().toLocaleDateString('sv-SE'), tag = (n) => M.plus(heute, n);

/* ---------- Eigene Einheiten in der Belastung ---------- */
const lauf = { id: 'g1', is_parent: false, date: tag(-2), start: tag(-2) + 'T07:00', type: 'running', dur_s: 2700, moving_s: 2700, dist_m: 8000, avg_hr: 145, z1_s: 0, z2_s: 0, z3_s: 2700, z4_s: 0, z5_s: 0 };
const athlet = [{ ftp_ref_w: 250, css_s_100m: 110, hf_max: 190, lthr_lauf: 172, lthr_rad: 165, schwellen: [] }];
const basis = { garmin_einheiten: [lauf], athlet, garmin_hf_zonen: [], garmin_tage: [{ date: tag(-30), rhr: 50 }, { date: heute, rhr: 50 }] };
const eigene = [
  { id: 'kraft01', d: tag(-1), sport: 'kraft', art: 'mittel', min: 45, schwer: 'ganz', f: 1 }, // abgehakt → zählt
  { id: 'tennis1', d: tag(-3), sport: 'andere', art: 'hart', min: 60, name: 'Tennis', f: 1 }, // andere Sportart → zählt mit Bein-Anteil
  { id: 'lauf001', d: tag(-2), sport: 'laufen', art: 'locker', min: 40, f: 1 }, // die Uhr hat den Lauf → nur die Messung zählt
  { id: 'yoga001', d: tag(-4), sport: 'mobil', art: 'locker', min: 60, schwer: 'yoga', f: 1 }, // Pilates & Yoga: 15 je Stunde, Beine 0
  { id: 'offen01', d: tag(-1), sport: 'rad', art: 'hart', min: 90 }, // nicht abgehakt → zählt nicht
  { id: 'morgen1', d: tag(1), sport: 'rad', art: 'hart', min: 90, f: 1 }, // Zukunft → zählt nicht
  { id: 'kaputt', d: 'gestern', sport: 'kraft', art: 'mittel', min: 45, f: 1 }, // ungültig → zählt nicht
];
const ohne = rechne(basis, ['belastung']).belastung, mit = rechne(Object.assign({}, basis, { eigene }), ['belastung', 'pmc']);
const E = mit.belastung.filter((b) => b.eigen);
pruefe('Belastung: ohne Datensatz „eigene“ wie bisher (nur die Uhr)', ohne.length === 1 && ohne[0].id === 'g1', ohne);
pruefe('Belastung: drei eigene Einheiten zählen (Kraft, Tennis, Yoga)', E.length === 3 && ['eigen:kraft01', 'eigen:tennis1', 'eigen:yoga001'].every((id) => E.some((b) => b.id === id)), E.map((b) => b.id));
const k = E.find((b) => b.id === 'eigen:kraft01'), t = E.find((b) => b.id === 'eigen:tennis1'), y = E.find((b) => b.id === 'eigen:yoga001');
pruefe('Kraft 45 min mittel ≈ 34 TSS', k && k.tss === 34 && k.sport === 'kraft', k);
pruefe('Tennis 60 min hart ≈ 77 TSS, Beine 70 %', t && t.tss === 77 && t.bein_anteil === 0.7 && t.sportart === 'Tennis' && t.sport === 'other', t);
pruefe('Yoga 60 min = 15 TSS, Beine 0', y && y.tss === 15 && y.bein_anteil === 0 && y.sportart === 'Yoga', y);
pruefe('Lauf, den die Uhr aufgezeichnet hat, zählt nur einmal', mit.belastung.filter((b) => b.date === tag(-2)).length === 1, mit.belastung.filter((b) => b.date === tag(-2)));
pruefe('Belastung bleibt nach Datum sortiert', mit.belastung.every((b, i, L) => i === 0 || L[i - 1].date <= b.date));
const tssTag = (P, d) => (P.find((r) => r.date === d) || {}).tss;
pruefe('Fitness & Form: die eigene Kraft-Einheit steckt in der Tageslast', tssTag(mit.pmc, tag(-1)) === 34, mit.pmc.slice(-3));

// Beine gegen Kreislauf: eigene Einheiten bringen ihren Bein-Anteil mit
const B = [{ date: tag(-1), sport: 'other', tss: 100, bein_anteil: 0 }, { date: tag(-2), sport: 'other', tss: 100 }];
const kan = M.lastKanaele({ heute, belastung: B, gym: [], tage: 10 }).rows;
const zeile = (d) => kan.find((r) => r.date === d) || {};
pruefe('Kanäle: Yoga (Anteil 0) belastet die Beine nicht, Sonstiges zur Hälfte', zeile(tag(-1)).bein === 0 && zeile(tag(-2)).bein === 50 && zeile(tag(-1)).kreis === 100, [zeile(tag(-1)), zeile(tag(-2))]);

/* ---------- Leistungsprognose ---------- */
const start = '2026-09-07', ende = '2027-06-06';
const P = (o) => M.leistungsPrognose(Object.assign({ niveau: 'fortgeschritten', start, ende, heute: '2026-11-05', treue: null, werte: { ftp: { jetzt: 280 }, lauf: { jetzt: 270, tempo: true }, css: { jetzt: 100, tempo: true } } }, o));
const p = P({});
pruefe('Prognose: Spanne mit oben ≥ unten, FTP steigt', p.werte.ftp.ziel[0] > 280 && p.werte.ftp.ziel[1] > p.werte.ftp.ziel[0], p.werte.ftp);
pruefe('Prognose: Tempo-Werte werden kleiner (schneller)', p.werte.lauf.ziel[1] < p.werte.lauf.ziel[0] && p.werte.lauf.ziel[0] < 270 && p.werte.css.ziel[1] < 100, [p.werte.lauf.ziel, p.werte.css.ziel]);
const ein = P({ niveau: 'einsteiger' }), amb = P({ niveau: 'ambitioniert' });
pruefe('Prognose: Einsteiger gewinnen mehr als Ambitionierte', ein.werte.ftp.ziel[1] > p.werte.ftp.ziel[1] && p.werte.ftp.ziel[1] > amb.werte.ftp.ziel[1], [ein.werte.ftp.ziel, p.werte.ftp.ziel, amb.werte.ftp.ziel]);
const treu = P({ treue: 0.5 });
pruefe('Prognose: wenig Plan-Treue senkt nur das untere Ende', treu.werte.ftp.ziel[0] < p.werte.ftp.ziel[0] && Math.abs(treu.werte.ftp.ziel[1] - p.werte.ftp.ziel[1]) < 1e-9, [treu.werte.ftp.ziel, p.werte.ftp.ziel]);
const spaet = P({ heute: '2027-06-10' }); // nach Beginn des Taperings
pruefe('Prognose: im Tapering kommt nichts mehr dazu', spaet.werte.ftp.ziel[0] === 280 && spaet.werte.ftp.ziel[1] === 280, spaet.werte.ftp.ziel);
const frueh = P({ heute: '2026-09-07' }), mitte = P({ heute: '2027-01-15' });
pruefe('Prognose: abnehmender Ertrag – später bleibt weniger Zuwachs', frueh.werte.ftp.gewinn[1] > mitte.werte.ftp.gewinn[1] && mitte.werte.ftp.gewinn[1] > 0, [frueh.werte.ftp.gewinn, mitte.werte.ftp.gewinn]);
const test = P({ werte: { ftp: { jetzt: 290, basis: 270, seit: '2026-10-20' } }, tests: { ftp: '2026-12-14' } });
pruefe('Prognose: neuer Test nach Planstart wird eingeordnet', test.werte.ftp.stand && ['drueber', 'im', 'drunter'].includes(test.werte.ftp.stand.lage), test.werte.ftp.stand);
pruefe('Prognose: +20 W in sechs Wochen liegen über dem Erwarteten', test.werte.ftp.stand.lage === 'drueber', test.werte.ftp.stand);
pruefe('Prognose: Zwischenziel für den nächsten Test', test.werte.ftp.test && test.werte.ftp.test.datum === '2026-12-14' && test.werte.ftp.test.wert[0] > 290 && test.werte.ftp.test.wert[0] < test.werte.ftp.ziel[0], test.werte.ftp.test);
pruefe('Prognose: ungültige Eingaben → null', M.leistungsPrognose(null) === null && M.leistungsPrognose({ start: 'x', ende, heute }) === null);

console.log(fehler ? '\n' + fehler + ' FEHLER' : '\nAlles in Ordnung');
process.exit(fehler ? 1 : 0);
