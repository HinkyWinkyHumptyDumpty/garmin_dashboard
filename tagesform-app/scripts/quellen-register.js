// Quellenregister (Version 22): sammelt jede Studie, Leitlinie und jedes Regelwerk, auf die sich Dreiklang irgendwo beruft,
// und schreibt sie nach public/quellen-daten.js – alphabetisch, mit Anzahl der Stellen und den Bereichen der App.
//   node scripts/quellen-register.js          → Datei neu erzeugen
//   node scripts/quellen-register.js --check  → nur prüfen, ob die Datei noch zum Code passt (Exit 1, wenn nicht)
// Gefunden wird, was im Code als Text steht (String-Literale in public/*.js und lib/*.js):
//   · jedes „quelle: '…'“ (mehrere Quellen durch „ · “ getrennt) – außer Datenherkunft wie 'garmin' oder 'eigen'
//   · jede Zeichenkette, die wie eine Zitation aussieht („Seiler, IJSPP 2010“, „Allen & Coggan 2010“, „Ironman Competition Rules 2025“)
//   · Kurzformen im Fließtext („nach McLean et al. 2010“) – sie zählen zur passenden Langform, wenn es genau eine gibt
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const ZIEL = path.join(WURZEL, 'public', 'quellen-daten.js');
const AUS = new Set(['sw.js', 'quellen-daten.js', 'quellen.js', 'shim.js', 'beispiel.js']);
const BEREICH = {
  'wissen.js': 'Wissen', 'methoden.js': 'Methodik', 'plan.js': 'Trainingsplan', 'gym.js': 'Gym', 'flow.js': 'Pilates & Yoga',
  'alltag.js': 'Dein Tag', 'alltag-motor.js': 'Dein Tag', 'tageslauf.js': 'Dein Tag', 'experimente.js': 'Mini-Experimente',
  'spiel-motor.js': 'Quests & Level', 'spiel.js': 'Quests & Level', 'calcs.js': 'Kennzahlen', 'app.js': 'App', 'seiten.js': 'App', 'hubs.js': 'App',
  'rennen.js': 'Rennen', 'rennen-daten.js': 'Rennen', 'bibliothek.js': 'Trainingsbibliothek', 'gesund.js': 'Gesundheit', 'einblick.js': 'Erkenntnisse',
  'leistung.js': 'Leistung', 'rueckblick.js': 'Rückblick', 'tutorial.js': 'Tutorial', 'steuerung.js': 'Steuerung', 'teilen.js': 'Teilen', 'faden.js': 'Faden',
  'timer.js': 'Timer', 'bedienung.js': 'App', 'start.js': 'App', 'tour.js': 'Tutorial', 'regeneration.js': 'Regeneration',
};
// Werte eines quelle-Felds, die keine Literatur sind (Datenherkunft)
const KEINE = new Set(['eigen', 'test', 'garmin', 'standard', 'referenz', 'saison', 'beispiel', 'plan', 'manuell', 'import', 'uhr', 'app']);

function dateien() {
  const L = [];
  for (const d of ['public', 'lib']) {
    for (const f of fs.readdirSync(path.join(WURZEL, d))) if (f.endsWith('.js') && !AUS.has(f)) L.push([d + '/' + f, fs.readFileSync(path.join(WURZEL, d, f), 'utf8')]);
  }
  return L;
}
// alle String-Literale (ohne Kommentare) mit Position – einfache, aber für diesen Code ausreichende Tokenisierung
function literale(src) {
  const out = []; let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); i = j < 0 ? n : j; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      let j = i + 1, s = '';
      while (j < n && src[j] !== c) { if (src[j] === '\\') { s += src[j + 1] === 'n' ? '\n' : src[j + 1]; j += 2; } else { if (c === '`' && src[j] === '$' && src[j + 1] === '{') { s += ' '; } s += src[j]; j++; } }
      out.push({ s, i }); i = j + 1; continue;
    }
    if (c === '/' && /[=(,:;!&|?{}[\n]\s*$/.test(src.slice(Math.max(0, i - 12), i))) { // Regex-Literal überspringen
      let j = i + 1, kl = false;
      while (j < n && (kl || src[j] !== '/') && src[j] !== '\n') { if (src[j] === '\\') j++; else if (src[j] === '[') kl = true; else if (src[j] === ']') kl = false; j++; }
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}
const JAHR = /\b(19|20)\d{2}[a-z]?\b/;
const PART = '(?:[Vv]an|[Vv]on|[Dd]e|[Dd]er|[Ll]e|[Ll]a|[Dd]a|[Dd]i|[Ss]t)';
const AUT = '(?:' + PART + ' )*[A-ZÄÖÜ][\\p{L}\'’\\-]+(?: (?:van|von|de|der|le|la|da|di) [\\p{L}\'’\\-]+)*'; // Nachname, auch „van der Horst“, „Le Meur“, „Saint-Maurice“
const AUTOREN = AUT + '(?:, ' + AUT + ')*(?:,? (?:&|und|and) ' + AUT + ')?(?: et al\\.?)?';
const JAHRT = '(?:19|20)\\d{2}[a-z]?';
const ZUSATZ = '(?: \\([^)]{1,48}\\))?';
// A: Autor(en), Zeitschrift oder Werk, Jahr · B: Autor [& Autor] Jahr · C: Regelwerk oder Organisation mit Jahr
const ZITAT_A = new RegExp('^' + AUTOREN + ', [^;:]{2,90}? ' + JAHRT + ZUSATZ + '$', 'u');
const ZITAT_B = new RegExp('^' + AUT + '(?: (?:&|und|and) ' + AUT + ')? ' + JAHRT + ZUSATZ + '$', 'u');
const ZITAT_C = /^(?:Ironman|World Triathlon|World Athletics|DTU|WHO|ACSM|ISSN|IOC|ESC|AASM|EFSA|DGE|Firstbeat|Garmin|UCI|Abbott)[^.;]{3,80}? (?:19|20)\d{2}$/u;
const ganz = (t) => ZITAT_A.test(t) || ZITAT_B.test(t) || ZITAT_C.test(t);
// im Fließtext eingebettet: „… nach Gardiner et al., Sleep Med Rev 2023; …“
// Zeitschrift im Fließtext: Wörter groß geschrieben (plus of/and/&/in/for), ein einzelnes Wort nur, wenn es eine bekannte Zeitschrift ist
const EINWORT = '(?:Sleep|Biometrika|PNAS|JAMA|Ergonomics|Kinesiology|Sensors|Psychoneuroendocrinology|Psychophysiology|Allergy|Cochrane|Periodization|Lancet|Nature|Science|Cell|Circulation|Chest|Thorax|IJSPP|JOSPT)';
const JOURNAL_E = '(?:' + EINWORT + '|[A-Z][\\p{L}.\\-]*(?: (?:[A-Z][\\p{L}.\\-]*|of|and|&|in|for|the))+)';
const EINGEBETTET = new RegExp('(' + AUTOREN + ', ' + JOURNAL_E + ' ' + JAHRT + ')\\b' + ZUSATZ, 'gu');
// Kurzform: „(Martin et al. 1998)“, „Allen & Coggan 2010“, „ACSM 2009“ – nur mit „et al.“, „&“ oder einer Organisation
const KURZ = new RegExp('\\b(' + AUT + ' (?:&|und) ' + AUT + '|' + AUT + ' et al\\.?|ACSM|WHO|IOC|ESC|AASM|EFSA|DGE|ISSN|DTU) ((?:19|20)\\d{2})\\b', 'gu');
const KEIN_TEXT = /\b(dein|deine|deinen|deinem|anpassen|Profil|Nicht im|Kalender)\b/i; // Oberflächentexte, die in einem quelle-Feld stehen
const NORM_ALLE = [[/Int J Sports Physiol Perform/g, 'IJSPP'], [/\bJOSPT\b/g, 'J Orthop Sports Phys Ther'], [/Cochrane Database Syst Rev/g, 'Cochrane'], [/\s+/g, ' ']];
const norm = (t) => NORM_ALLE.reduce((x, [re, zu]) => x.replace(re, zu), t.trim()).replace(/\s*\.$/, '');
const schluessel = (t) => norm(t).replace(/\s*\([^)]*\)\s*$/, '').toLowerCase();
const erstAutor = (t) => { const m = norm(t).match(new RegExp('^(?:' + PART + ' )*([A-ZÄÖÜ][\\p{L}\'’\\-]+)', 'u')); return m ? m[1].toLowerCase() : ''; };
const jahrVon = (t) => { const m = t.match(JAHR); return m ? m[0].slice(0, 4) : ''; };
const zeitschrift = (t) => { const k = schluessel(t), m = k.match(/, ([^,]+?) (?:19|20)\d{2}[a-z]?$/); return m ? m[1] : ''; };

function sammeln() {
  const Q = new Map(); // schluessel → { t, n, wo:Set, lang }
  const kurz = [];
  const merke = (t, wo, lang) => {
    const k = schluessel(t); if (!k) return;
    let e = Q.get(k);
    if (!e) { e = { t: norm(t), n: 0, wo: new Set(), lang: !!lang }; Q.set(k, e); }
    if (lang && !e.lang) e.lang = true;
    if (norm(t).length > e.t.length) e.t = norm(t); // Variante mit Zusatz „(WHO)“ bevorzugen
    e.n++; e.wo.add(wo);
  };
  const eingebettet = (s, bereich) => { // Zitate mitten im Text
    let m, gefunden = 0; EINGEBETTET.lastIndex = 0;
    const belegt = [];
    while ((m = EINGEBETTET.exec(s))) { merke(m[0], bereich, true); belegt.push([m.index, m.index + m[0].length]); gefunden++; }
    KURZ.lastIndex = 0;
    while ((m = KURZ.exec(s))) { if (belegt.some(([a, b]) => m.index >= a && m.index < b)) continue; kurz.push({ a: m[1], j: m[2], wo: bereich }); gefunden++; }
    return gefunden;
  };
  for (const [name, src] of dateien()) {
    const base = path.basename(name), wo = BEREICH[base] || (name.startsWith('lib/') ? 'Server' : 'App');
    const faq = base === 'wissen.js' ? src.indexOf('const FAQ = [') : -1, faqEnde = base === 'wissen.js' ? src.indexOf('/* ---------- Wissenslevel') : -1;
    for (const { s, i } of literale(src)) {
      const bereich = base === 'wissen.js' ? (faq > 0 && i > faq && i < faqEnde ? 'Häufige Fragen' : 'Lexikon') : wo;
      const istQuelle = /quelle"?\s*:\s*$/.test(src.slice(Math.max(0, i - 14), i));
      for (const teil of s.split(' · ').map((x) => x.trim()).filter(Boolean)) {
        if (teil.length > 400) { eingebettet(teil, bereich); continue; }
        if (ganz(teil)) { merke(teil, bereich, true); continue; }
        const n = eingebettet(teil, bereich);
        if (!n && istQuelle && !KEINE.has(teil.toLowerCase()) && teil.length >= 6 && !JAHR.test(teil) && !KEIN_TEXT.test(teil)) merke(teil, bereich, true); // Werk oder Organisation ohne Jahr
      }
    }
  }
  // Kurzformen zuordnen: gleicher Erstautor (oder Organisation) und gleiches Jahr → genau eine Langform? dann dazuzählen, sonst eigener Eintrag
  for (const k of kurz) {
    const a = k.a.replace(/ et al\.?$/, '').replace(/ (&|und) .*$/, '').toLowerCase();
    const kand = [...Q.values()].filter((e) => e.lang && (erstAutor(e.t) === a || e.t.toLowerCase().indexOf(a + ' ') === 0) && jahrVon(e.t) === k.j);
    if (kand.length === 1) { kand[0].n++; kand[0].wo.add(k.wo); }
    else if (!kand.length) merke(k.a + ' ' + k.j, k.wo, false);
    else { const g = kand.find((e) => e.t.toLowerCase().startsWith(a + ' ') || e.t.toLowerCase().startsWith(a + ',')); (g || kand[0]).n++; (g || kand[0]).wo.add(k.wo); }
  }
  // Zusammenführen: „Autor Jahr“ ohne Zeitschrift → die eine Langform; Präfix → längere Form; gleicher Erstautor, Jahr und Zeitschrift → eine Arbeit
  const zusammen = (von, zu) => { zu.n += von.n; von.wo.forEach((w) => zu.wo.add(w)); zu.lang = zu.lang || von.lang; if (von.t.length > zu.t.length) zu.t = von.t; };
  let geaendert = true;
  while (geaendert) {
    geaendert = false;
    const E = [...Q.entries()];
    for (const [k, e] of E) {
      if (!Q.has(k)) continue;
      let ziel = null;
      if (!zeitschrift(e.t)) { const kand = E.filter(([k2, e2]) => k2 !== k && Q.has(k2) && zeitschrift(e2.t) && erstAutor(e2.t) === erstAutor(e.t) && jahrVon(e2.t) === jahrVon(e.t)); if (kand.length === 1) ziel = kand[0]; }
      if (!ziel) { const kand = E.filter(([k2]) => k2 !== k && Q.has(k2) && k2.startsWith(k + ' ')); if (kand.length === 1) ziel = kand[0]; }
      if (!ziel && zeitschrift(e.t)) { const kand = E.filter(([k2, e2]) => k2 !== k && Q.has(k2) && erstAutor(e2.t) === erstAutor(e.t) && jahrVon(e2.t) === jahrVon(e.t) && zeitschrift(e2.t) === zeitschrift(e.t)); if (kand.length === 1 && kand[0][0] > k) ziel = kand[0]; }
      if (ziel) { zusammen(e, ziel[1]); Q.delete(k); geaendert = true; }
    }
  }
  const L = [...Q.values()].map((e) => ({ t: e.t, n: e.n, wo: [...e.wo].sort(), kurz: !e.lang || undefined }));
  L.sort((x, y) => x.t.localeCompare(y.t, 'de', { sensitivity: 'base' }));
  return L;
}
function text(L) {
  const stand = new Date().toISOString().slice(0, 10);
  const zeilen = L.map((e) => '    ' + JSON.stringify(e.kurz ? { t: e.t, n: e.n, wo: e.wo, kurz: true } : { t: e.t, n: e.n, wo: e.wo }));
  return '/* Dreiklang · Quellenregister – automatisch erzeugt mit `node scripts/quellen-register.js`, bitte nicht von Hand ändern.\n'
    + '   Jede Studie, Leitlinie und jedes Regelwerk, auf das sich die App irgendwo beruft: t = Zitation, n = Zahl der Stellen im Code,\n'
    + '   wo = Bereiche der App, kurz = nur als Kurzform im Text genannt (ohne Zeitschrift). */\n'
    + 'window.tfQuellenDaten = {\n  stand: ' + JSON.stringify(stand) + ',\n  n: ' + L.length + ',\n  quellen: [\n' + zeilen.join(',\n') + '\n  ],\n};\n';
}
const L = sammeln(), neu = text(L);
const ohneStand = (t) => t.replace(/stand: "[^"]*"/, 'stand: ""');
if (process.argv.includes('--check')) {
  const alt = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8') : '';
  if (ohneStand(alt) !== ohneStand(neu)) { console.error('FEHLER: public/quellen-daten.js passt nicht mehr zum Code – bitte `node scripts/quellen-register.js` laufen lassen.'); process.exit(1); }
  console.log('Quellenregister aktuell: ' + L.length + ' Quellen');
} else {
  fs.writeFileSync(ZIEL, neu);
  console.log('Quellenregister geschrieben: ' + L.length + ' Quellen, ' + L.reduce((a, e) => a + e.n, 0) + ' Stellen → public/quellen-daten.js');
  if (process.argv.includes('--liste')) L.forEach((e) => console.log((e.kurz ? '  ~ ' : '    ') + e.t + '  [' + e.n + '] ' + e.wo.join(', ')));
}
