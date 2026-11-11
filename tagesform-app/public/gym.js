/* Dreiklang · Gym: Muskeln am Körper antippen → passendes Workout mit Erklärung zu jeder Übung.
   Dazu Ort (Studio, zuhause mit Hanteln, ohne Geräte), Ziel, Dauer, Erfahrung und auf Wunsch Cardio danach.
   Grundlagen: ACSM Position Stand 2009 (Reihenfolge, Sätze, Pausen, Progression), Schoenfeld et al. 2016/2017 (Volumen,
   Frequenz, Lasten), Zourdos et al. 2016 (Wiederholungen in Reserve), Refalo et al. 2023 und Grgic et al. 2022 (Nähe zur
   Grenze), LeSuer et al. 1997 (Maximum aus Wiederholungen schätzen), Eddens et al. 2018 und Wilson et al. 2012 (Kraft + Ausdauer).
   Fünf Erfahrungsstufen von Einsteiger bis Leistungssport; mit eingetragenen Kraftwerten zeigt jede Übung ihr Gewicht. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, svg, nf, iso, toDay, localDate, DAY, rowsOf, heute, svgIco, wischen } = T.ui;
  const { karte, dot } = S;
  const warum = (t, q) => (T.ui.warum ? T.ui.warum(t, q) : null); // Version 11: (i) mit einem Satz
  const A = () => dash.app;

  /* ---------- Muskeln und Körperkarte ---------- */
  const MUSKELN = {
    brust: 'Brust', schulter: 'Schultern', bizeps: 'Bizeps', trizeps: 'Trizeps', unterarm: 'Unterarme', bauch: 'Bauch', seite: 'Seitlicher Bauch',
    nacken: 'Nacken', ruecken_oben: 'Oberer Rücken', lat: 'Latissimus', ruecken_unten: 'Unterer Rücken', gesaess: 'Gesäß', abduktoren: 'Hüfte außen',
    adduktoren: 'Oberschenkel innen', quad: 'Oberschenkel vorn', beinbeuger: 'Oberschenkel hinten', waden: 'Waden', schienbein: 'Schienbein & Fuß',
  };
  const GROSS = new Set(['quad', 'gesaess', 'beinbeuger', 'lat', 'ruecken_oben', 'brust']);
  // linke Körperhälfte (aus Sicht des Betrachters); die rechte entsteht gespiegelt. mitte: liegt auf der Körpermitte
  const KOERPER = {
    vorne: [
      { m: null, d: 'M100,9 C111,9 118,18 118,31 C118,44 110,53 100,53 C90,53 82,44 82,31 C82,18 89,9 100,9 Z', mitte: true },
      { m: null, d: 'M91,50 C93,54 93,58 91,64 L109,64 C107,58 107,54 109,50 Z', mitte: true },
      { m: 'nacken', d: 'M91,60 C85,64 77,67 69,69 C73,72 78,74 83,74 C87,71 90,68 92,65 Z' },
      { m: 'schulter', d: 'M68,71 C59,70 51,74 48,83 C46,91 46,99 48,107 C52,105 55,101 57,96 C60,89 65,84 72,80 C73,76 71,73 68,71 Z' },
      { m: 'brust', d: 'M98,76 L98,110 C91,115 82,116 75,112 C69,108 66,101 66,93 C67,86 71,81 77,78 C84,76 91,75 98,76 Z' },
      { m: 'bizeps', d: 'M48,110 C45,119 43,130 43,142 C44,147 48,149 52,148 C56,138 58,126 58,113 C55,109 51,108 48,110 Z' },
      { m: 'unterarm', d: 'M43,152 C39,164 35,180 33,198 C35,203 40,204 43,200 C47,184 51,168 54,154 C51,150 46,149 43,152 Z' },
      { m: null, d: 'M33,205 C38,203 44,205 44,210 C45,218 43,226 39,230 C35,231 31,228 31,222 C30,216 31,209 33,205 Z' },
      { m: 'bauch', d: 'M88,117 L112,117 C114,138 114,160 111,184 C105,189 95,189 89,184 C86,160 86,138 88,117 Z', mitte: true, linien: 'M88,136 L112,136 M88,154 L112,154 M89,170 L111,170 M100,118 L100,186' },
      { m: 'seite', d: 'M74,116 C79,118 83,121 85,126 C84,146 85,165 87,183 C81,182 76,176 74,168 C71,151 71,133 74,116 Z' },
      { m: null, t: 'hueftbeuger', d: 'M77,186 C85,191 93,196 100,203 C107,196 115,191 123,186 L125,197 C116,202 108,208 100,216 C92,208 84,202 75,197 Z', mitte: true }, // t: Körperteil für die Regenerations-Karte (Version 23)
      { m: 'quad', d: 'M73,201 C80,208 88,212 94,213 C97,234 95,259 91,285 C86,292 78,292 74,286 C68,258 68,228 73,201 Z' },
      { m: 'adduktoren', d: 'M96,210 C99,212 100,216 100,222 C100,236 99,248 97,258 C95,246 94,232 95,214 Z', klein: true },
      { m: null, t: 'knie', d: 'M76,292 C80,289 89,289 92,293 C93,299 92,305 89,308 C84,310 79,309 76,305 C74,301 74,296 76,292 Z' },
      { m: 'schienbein', d: 'M76,312 C79,309 84,309 87,312 C87,340 85,368 83,396 C81,400 78,400 77,396 C74,368 73,339 76,312 Z', klein: true },
      { m: 'waden', d: 'M90,312 C94,318 95,333 94,350 C93,360 91,368 89,372 C87,354 87,333 90,312 Z', klein: true },
      { m: null, t: 'fuss', d: 'M77,404 C79,400 87,400 89,404 L92,422 C88,428 79,428 75,423 Z' },
    ],
    hinten: [
      { m: null, d: 'M100,9 C111,9 118,18 118,31 C118,44 110,53 100,53 C90,53 82,44 82,31 C82,18 89,9 100,9 Z', mitte: true },
      { m: 'nacken', d: 'M100,52 C106,60 116,65 131,69 C122,74 112,82 100,95 C88,82 78,74 69,69 C84,65 94,60 100,52 Z', mitte: true },
      { m: 'schulter', d: 'M68,71 C59,70 51,74 48,83 C46,91 46,99 48,107 C52,105 55,101 57,96 C60,89 65,84 70,80 C72,76 71,73 68,71 Z' },
      { m: 'ruecken_oben', d: 'M97,99 C91,90 83,83 73,81 C70,90 70,100 73,108 C81,112 89,116 97,121 Z' },
      { m: 'trizeps', d: 'M48,110 C45,119 43,130 43,142 C44,147 48,149 52,148 C56,138 58,126 58,113 C55,109 51,108 48,110 Z' },
      { m: 'unterarm', d: 'M43,152 C39,164 35,180 33,198 C35,203 40,204 43,200 C47,184 51,168 54,154 C51,150 46,149 43,152 Z' },
      { m: null, d: 'M33,205 C38,203 44,205 44,210 C45,218 43,226 39,230 C35,231 31,228 31,222 C30,216 31,209 33,205 Z' },
      { m: 'lat', d: 'M73,113 C81,117 89,121 96,126 C95,142 91,156 85,167 C79,163 75,155 73,145 C71,134 71,123 73,113 Z' },
      { m: 'ruecken_unten', d: 'M95,131 C98,134 102,134 105,131 C107,147 109,162 111,177 C104,182 96,182 89,177 C91,162 93,147 95,131 Z', mitte: true, linien: 'M100,133 L100,180' },
      { m: 'abduktoren', d: 'M72,170 C76,173 80,177 83,182 C78,185 73,189 70,195 C67,188 68,178 72,170 Z', klein: true },
      { m: 'gesaess', d: 'M74,187 C82,183 92,183 99,189 C100,201 99,212 96,221 C88,226 78,224 72,216 C69,206 70,195 74,187 Z' },
      { m: 'beinbeuger', d: 'M73,225 C81,229 90,229 97,225 C98,249 96,272 92,293 C86,298 78,298 74,293 C70,270 69,247 73,225 Z' },
      { m: 'waden', d: 'M76,309 C80,303 92,303 96,309 C98,328 97,348 92,366 C88,371 82,371 79,366 C74,348 73,328 76,309 Z' },
      { m: null, t: 'achilles', d: 'M80,372 C84,370 90,370 92,374 L91,402 C87,405 83,405 81,402 Z' },
      { m: null, t: 'fuss', d: 'M78,405 C81,401 89,401 92,405 L94,421 C89,427 80,427 76,421 Z' },
    ],
  };

  /* ---------- Übungen ----------
     ziel: Hauptmuskeln · mit: arbeiten mit · typ: mehr (mehrgelenkig) · iso (eingelenkig) · rumpf · plyo · mobil
     stufe: 1 leicht zu lernen · 2 mittel · 3 anspruchsvoll
     geraet: gym (Studio) · hantel (Kurzhantel/Kettlebell) · band (Widerstandsband) · ohne */
  const ALLE = ['kraft', 'aufbau', 'ausdauer', 'power', 'stabil'];
  const U = [
    // Kniebeuge-Muster
    { id: 'kniebeuge_lh', ziel: ['quad', 'gesaess'], mit: ['adduktoren', 'ruecken_unten', 'bauch'], typ: 'mehr', stufe: 3, name: 'Kniebeuge mit Langhantel', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Oberschenkel vorn, Gesäß, Rumpf',
      schritte: ['Stange auf den oberen Rücken legen, Füße etwa schulterbreit, Zehen leicht nach außen.', 'Hüfte nach hinten und unten schieben, die Knie folgen den Zehen.', 'So tief, wie der Rücken gerade bleibt – mindestens bis die Oberschenkel waagerecht sind.', 'Über die ganze Fußsohle kraftvoll hochdrücken.'],
      achte: 'Brust bleibt aufrecht, Knie fallen nicht nach innen. Vorher tief einatmen und den Bauch anspannen.', leichter: 'Goblet-Kniebeuge mit Kurzhantel', schwerer: '2 s Pause im tiefsten Punkt oder mehr Gewicht' },
    { id: 'goblet', ziel: ['quad', 'gesaess'], mit: ['adduktoren', 'bauch'], typ: 'mehr', stufe: 1, name: 'Goblet-Kniebeuge', muster: 'knie', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil', 'kraft'], muskeln: 'Oberschenkel vorn, Gesäß, Rumpf',
      schritte: ['Kurzhantel oder Kettlebell senkrecht vor der Brust halten, Ellbogen zeigen nach unten.', 'Tief in die Hocke gehen, die Ellbogen landen zwischen den Knien.', 'Kurz halten, dann über die Fersen hochdrücken.'],
      achte: 'Das Gewicht vorne hilft, aufrecht zu bleiben – ideal, um die Technik zu lernen.', leichter: 'Ohne Gewicht auf eine Bank absetzen', schwerer: 'Kniebeuge mit Langhantel oder 3 s langsam runter' },
    { id: 'beinpresse', ziel: ['quad', 'gesaess'], mit: ['adduktoren'], typ: 'mehr', stufe: 1, name: 'Beinpresse', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Rücken fest an die Lehne, Füße hüftbreit mittig auf die Platte.', 'Langsam beugen, bis die Knie etwa 90° haben.', 'Kraftvoll wegdrücken, oben die Knie nicht ganz durchstrecken.'],
      achte: 'Das Becken bleibt auf dem Polster – nicht so tief gehen, dass es abrollt.', leichter: 'Weniger Gewicht, kleinerer Bewegungsweg', schwerer: 'Einbeinig drücken' },
    { id: 'kniebeuge_kg', ziel: ['quad', 'gesaess'], mit: ['adduktoren'], typ: 'mehr', stufe: 1, name: 'Kniebeuge mit Körpergewicht', muster: 'knie', geraet: ['ohne'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Füße schulterbreit, Arme nach vorne strecken.', 'Hüfte nach hinten und unten, so tief es sauber geht.', 'Zügig hochdrücken.'],
      achte: 'Fersen bleiben am Boden, Knie zeigen in Richtung Zehen.', leichter: 'Auf einen Stuhl absetzen', schwerer: '3 s runter und 2 s unten halten – oder Sprungkniebeuge' },
    { id: 'wandsitz', ziel: ['quad'], mit: ['gesaess'], typ: 'iso', stufe: 1, name: 'Wandsitzen', muster: 'knie', geraet: ['ohne'], art: 'halten', eignung: ['ausdauer', 'stabil'], muskeln: 'Oberschenkel vorn',
      schritte: ['Mit dem Rücken an die Wand lehnen, Füße einen guten Schritt vor der Wand.', 'Runterrutschen, bis die Knie etwa 90° gebeugt sind.', 'Position halten und ruhig weiteratmen.'],
      achte: 'Gut fürs Knie: Die Kraft entsteht ohne Stoßbelastung.', leichter: 'Weniger tief sitzen', schwerer: 'Ein Bein leicht anheben' },
    // Hüftbeuge-Muster
    { id: 'kreuzheben', ziel: ['gesaess', 'beinbeuger', 'ruecken_unten'], mit: ['quad', 'ruecken_oben', 'unterarm', 'nacken'], typ: 'mehr', stufe: 3, name: 'Kreuzheben', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'power'], muskeln: 'Gesäß, Beinbeuger, Rücken',
      schritte: ['Füße hüftbreit unter der Stange, die Stange über der Fußmitte.', 'Hüfte nach hinten, Rücken gerade, Stange schulterbreit greifen.', 'Brust hoch, Bauch fest – die Stange eng am Körper nach oben ziehen.', 'Oben die Hüfte strecken, kontrolliert wieder absetzen.'],
      achte: 'Der Rücken bleibt die ganze Zeit gerade. Lieber weniger Gewicht als einen runden Rücken.', leichter: 'Rumänisches Kreuzheben mit Kurzhanteln', schwerer: 'Mehr Gewicht in kleinen Schritten' },
    { id: 'rdl', ziel: ['beinbeuger', 'gesaess'], mit: ['ruecken_unten', 'unterarm'], typ: 'mehr', stufe: 2, name: 'Rumänisches Kreuzheben', muster: 'huefte', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Beinbeuger, Gesäß, unterer Rücken',
      schritte: ['Aufrecht stehen, Langhantel oder Kurzhanteln vor den Oberschenkeln.', 'Knie leicht gebeugt lassen, Hüfte weit nach hinten schieben – das Gewicht gleitet an den Beinen entlang.', 'Runter, bis du hinten im Oberschenkel deutlich Zug spürst.', 'Mit dem Gesäß nach vorne schieben und aufrichten.'],
      achte: 'Bewegung kommt aus der Hüfte, nicht aus dem Rücken.', leichter: 'Mit einem Stab üben, dann leichte Hanteln', schwerer: 'Einbeiniges Kreuzheben' },
    { id: 'hip_thrust', ziel: ['gesaess'], mit: ['beinbeuger', 'abduktoren'], typ: 'mehr', stufe: 2, name: 'Hip Thrust', muster: 'huefte', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Gesäß, Beinbeuger',
      schritte: ['Oberer Rücken an einer Bank, Gewicht (Langhantel oder Kurzhantel) auf der Hüfte.', 'Füße flach, etwa hüftbreit, die Knie zeigen nach vorn.', 'Hüfte hochdrücken, bis Oberkörper und Oberschenkel eine Linie bilden, oben 1 s halten.'],
      achte: 'Kinn leicht zur Brust, kein Hohlkreuz oben – die Kraft kommt aus dem Gesäß.', leichter: 'Beckenheben am Boden ohne Gewicht', schwerer: 'Einbeinig oder mit 2 s Halt oben' },
    { id: 'beckenheben', ziel: ['gesaess'], mit: ['beinbeuger', 'ruecken_unten'], typ: 'iso', stufe: 1, name: 'Beckenheben', muster: 'huefte', geraet: ['ohne'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Gesäß, Beinbeuger',
      schritte: ['Auf den Rücken legen, Füße aufstellen, Arme neben dem Körper.', 'Becken anheben, bis Knie, Hüfte und Schultern eine Linie bilden.', 'Oben kurz halten, langsam absenken.'],
      achte: 'Das Gesäß arbeitet, nicht der untere Rücken.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Einbeinig, das andere Bein gestreckt' },
    { id: 'kb_swing', ziel: ['gesaess', 'beinbeuger'], mit: ['ruecken_unten', 'bauch', 'schulter', 'unterarm'], typ: 'plyo', stufe: 2, name: 'Kettlebell-Swing', muster: 'huefte', geraet: ['gym', 'hantel'], art: 'plyo', eignung: ['power', 'ausdauer'], muskeln: 'Gesäß, Beinbeuger, Rumpf',
      schritte: ['Kettlebell mit beiden Händen, Füße etwas breiter als die Hüfte.', 'Hüfte nach hinten, die Kugel zwischen den Beinen nach hinten schwingen.', 'Hüfte explosiv nach vorne strecken – die Kugel schwingt bis Brusthöhe.', 'Die Arme lenken nur, die Kraft kommt aus der Hüfte.'],
      achte: 'Es ist eine Hüftbewegung, keine Kniebeuge. Oben Bauch und Gesäß fest.', leichter: 'Leichtere Kugel, kleiner Schwung', schwerer: 'Schwerere Kugel oder einarmig' },
    { id: 'nordic', ziel: ['beinbeuger'], mit: [], typ: 'iso', stufe: 3, name: 'Nordic Hamstring Curl', muster: 'huefte', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'koerper', eignung: ['kraft', 'stabil', 'aufbau'], muskeln: 'Beinbeuger',
      schritte: ['Auf ein Polster knien, die Fersen werden festgehalten (Partner, Sprossenwand, Sofa).', 'Den Körper gerade halten und so langsam wie möglich nach vorne kippen.', 'Mit den Händen abfangen, mit leichtem Abdrücken zurück in die Ausgangsposition.'],
      achte: 'Eine der besten Übungen gegen Zerrungen im hinteren Oberschenkel. Mit wenigen Wiederholungen anfangen – Muskelkater ist anfangs normal.', leichter: 'Nur den ersten Teil absenken', schwerer: 'Unten kurz halten und mit weniger Hilfe hochkommen' },
    { id: 'beinbeuger', ziel: ['beinbeuger'], mit: [], typ: 'iso', stufe: 1, name: 'Beinbeuger liegend an der Maschine', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Beinbeuger',
      schritte: ['Knie auf Höhe des Drehpunkts der Maschine einstellen.', 'Fersen kontrolliert zum Gesäß ziehen.', 'Langsam, in etwa 3 s, zurücklassen.'],
      achte: 'Die Hüfte bleibt auf dem Polster liegen.', leichter: 'Weniger Gewicht', schwerer: 'Einbeinig' },
    // Einbeinig
    { id: 'bulgarian', ziel: ['quad', 'gesaess'], mit: ['adduktoren', 'abduktoren'], typ: 'mehr', stufe: 2, name: 'Bulgarische Kniebeuge', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'kraft', eignung: ['kraft', 'aufbau', 'stabil', 'ausdauer'], einseitig: true, muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Hinteren Fußrücken auf eine Bank legen, vorderer Fuß gut einen Schritt davor.', 'Gerade nach unten absenken, bis das hintere Knie fast den Boden berührt.', 'Über die vordere Ferse hochdrücken.'],
      achte: 'Das vordere Knie bleibt über dem Fuß. Für Läufer und Radfahrer besonders wertvoll, weil jedes Bein allein arbeitet.', leichter: 'Ohne Gewicht, Hand an der Wand', schwerer: 'Kurzhanteln in beiden Händen' },
    { id: 'ausfall', ziel: ['quad', 'gesaess'], mit: ['adduktoren', 'abduktoren'], typ: 'mehr', stufe: 1, name: 'Ausfallschritt rückwärts', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Oberschenkel, Gesäß',
      schritte: ['Aufrecht stehen, mit einem Bein einen großen Schritt zurück.', 'Absenken, bis beide Knie etwa 90° haben.', 'Über das vordere Bein zurück in den Stand drücken.'],
      achte: 'Rückwärts schont das Knie mehr als vorwärts.', leichter: 'Kleinerer Schritt, festhalten', schwerer: 'Mit Kurzhanteln' },
    { id: 'stepup', ziel: ['quad', 'gesaess'], mit: ['waden', 'abduktoren'], typ: 'mehr', stufe: 1, name: 'Step-up', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['kraft', 'aufbau', 'ausdauer', 'power'], einseitig: true, muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Einen Fuß komplett auf eine stabile Kiste oder Stufe in Kniehöhe stellen.', 'Nur mit diesem Bein hochdrücken, das hintere Bein hilft nicht mit.', 'Langsam wieder absenken.'],
      achte: 'Das Knie bleibt über dem Fuß. Gut übertragbar aufs Laufen bergauf.', leichter: 'Niedrigere Stufe', schwerer: 'Mit Kurzhanteln oder explosiv hoch' },
    { id: 'einbein_kreuz', ziel: ['beinbeuger', 'gesaess'], mit: ['abduktoren', 'ruecken_unten'], typ: 'mehr', stufe: 2, name: 'Einbeiniges Kreuzheben', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['stabil', 'aufbau', 'kraft'], einseitig: true, muskeln: 'Beinbeuger, Gesäß, Fußstabilität',
      schritte: ['Auf einem Bein stehen, Knie leicht gebeugt.', 'Oberkörper nach vorne kippen, das freie Bein gestreckt nach hinten – wie eine Waage.', 'Mit dem Gesäß zurück in den Stand.'],
      achte: 'Die Hüfte bleibt waagerecht, nicht aufdrehen. Trainiert nebenbei Gleichgewicht und Fuß.', leichter: 'Mit Fingerspitzen an der Wand', schwerer: 'Kurzhantel in der Hand der Gegenseite' },
    { id: 'pistol_box', ziel: ['quad', 'gesaess'], mit: ['abduktoren'], typ: 'mehr', stufe: 3, name: 'Einbeinige Kniebeuge auf die Box', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['kraft', 'stabil', 'aufbau'], einseitig: true, muskeln: 'Oberschenkel, Gesäß, Knie-Stabilität',
      schritte: ['Vor eine Bank oder einen Stuhl stellen, ein Bein leicht nach vorne anheben.', 'Auf dem Standbein langsam absetzen.', 'Ohne Schwung wieder hochdrücken.'],
      achte: 'Knie nicht nach innen fallen lassen – das trainiert genau die Kontrolle, die Läuferknie schützt.', leichter: 'Höhere Box', schwerer: 'Niedrigere Box oder Gewicht in den Händen' },
    { id: 'seitausfall', ziel: ['adduktoren', 'gesaess'], mit: ['quad'], typ: 'mehr', stufe: 1, name: 'Seitlicher Ausfallschritt', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Adduktoren, Gesäß, Oberschenkel',
      schritte: ['Breiter Stand, Zehen nach vorne.', 'Gewicht auf ein Bein verlagern und in die Hüfte setzen, das andere Bein bleibt gestreckt.', 'Zurück in die Mitte drücken.'],
      achte: 'Stärkt die Innenseite der Oberschenkel – wichtig für stabile Knie.', leichter: 'Kleinerer Schritt', schwerer: 'Kurzhantel vor der Brust' },
    // Wade, Schienbein, Fuß
    { id: 'wade_gestreckt', ziel: ['waden'], mit: [], typ: 'iso', stufe: 1, name: 'Wadenheben, Bein gestreckt', muster: 'wade', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ALLE, muskeln: 'Wade (Gastrocnemius), Achillessehne',
      schritte: ['Mit den Fußballen auf eine Stufe stellen, Fersen hängen frei.', 'Knie gestreckt, so hoch wie möglich auf die Zehen drücken.', 'Langsam, in etwa 3 s, tief absenken.'],
      achte: 'Die langsame Absenkphase stärkt die Achillessehne. Läufer brauchen sehr kräftige Waden.', leichter: 'Beidbeinig am Boden', schwerer: 'Einbeinig oder mit Kurzhantel' },
    { id: 'wade_gebeugt', ziel: ['waden'], mit: [], typ: 'iso', stufe: 1, name: 'Wadenheben, Knie gebeugt', muster: 'wade', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ALLE, muskeln: 'Schollenmuskel (Soleus), Achillessehne',
      schritte: ['Sitzen oder stehen mit etwa 30–40° gebeugten Knien, Fußballen auf einer Stufe.', 'Fersen so hoch wie möglich anheben.', 'Langsam absenken.'],
      achte: 'Der Soleus trägt beim Laufen ein Vielfaches des Körpergewichts – er wird oft vergessen.', leichter: 'Ohne Stufe', schwerer: 'Gewicht auf den Knien oder an der Sitz-Wadenmaschine' },
    { id: 'wade_einbein', ziel: ['waden'], mit: ['schienbein'], typ: 'iso', stufe: 2, name: 'Einbeiniges Wadenheben an der Stufe', muster: 'wade', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['kraft', 'aufbau', 'stabil', 'ausdauer'], einseitig: true, muskeln: 'Wade, Achillessehne, Fuß',
      schritte: ['Auf einem Bein mit dem Fußballen auf einer Stufe stehen, leicht festhalten.', 'Ganz hoch auf die Zehen, oben 1 s halten.', 'In 3 s so tief wie möglich absenken.'],
      achte: 'Gegen Achillessehnen-Beschwerden bewährt. Erst sauber 3 × 15 schaffen, dann Gewicht dazu.', leichter: 'Beidbeinig hoch, einbeinig runter', schwerer: 'Mit Kurzhantel oder Rucksack' },
    { id: 'tibialis', ziel: ['schienbein'], mit: [], typ: 'iso', stufe: 1, name: 'Schienbeinheben an der Wand', muster: 'wade', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'koerper', eignung: ALLE, muskeln: 'Schienbeinmuskel (Tibialis anterior)',
      schritte: ['Mit Rücken und Gesäß an die Wand lehnen, Füße etwa einen Fuß weit vor der Wand.', 'Die Zehen so weit wie möglich zum Schienbein hochziehen, Fersen bleiben am Boden.', 'Langsam wieder absenken.'],
      achte: 'Stärkt die Vorderseite des Unterschenkels – hilfreich gegen Schienbeinkantenschmerzen. Je weiter die Füße von der Wand, desto schwerer.', leichter: 'Füße näher an der Wand', schwerer: 'Einbeinig oder mit Band um den Fuß' },
    { id: 'fussgewoelbe', ziel: ['schienbein'], mit: [], typ: 'iso', stufe: 1, name: 'Kurzer Fuß', muster: 'fuss', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'halten', eignung: ALLE, muskeln: 'Fußmuskeln, Fußgewölbe',
      schritte: ['Barfuß stehen, Zehen locker lang lassen.', 'Den Fußballen Richtung Ferse ziehen, sodass sich das Gewölbe anhebt – die Zehen krallen nicht.', 'Spannung halten, dann lösen.'],
      achte: 'Kleine Bewegung, große Wirkung: Ein starkes Fußgewölbe fängt Stöße ab.', leichter: 'Im Sitzen', schwerer: 'Im Einbeinstand' },
    { id: 'einbeinstand', ziel: ['schienbein'], mit: ['abduktoren'], typ: 'iso', stufe: 1, name: 'Einbeinstand auf weicher Unterlage', muster: 'fuss', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'halten', eignung: ['stabil', 'ausdauer'], einseitig: true, muskeln: 'Fuß, Sprunggelenk, Hüfte',
      schritte: ['Auf ein Kissen oder eine weiche Matte stellen, ein Bein anheben.', 'Das Knie bleibt leicht gebeugt.', 'Gleichgewicht halten, mit der Zeit Augen schließen.'],
      achte: 'Trainiert die Reflexe, die beim Umknicken schützen.', leichter: 'Fester Boden', schwerer: 'Augen zu oder den Kopf langsam drehen' },
    // Drücken
    { id: 'bankdruecken', ziel: ['brust'], mit: ['trizeps', 'schulter'], typ: 'mehr', stufe: 2, name: 'Bankdrücken', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Brust, Trizeps, vordere Schulter',
      schritte: ['Auf die Bank legen, Augen unter der Stange, Füße fest am Boden.', 'Schulterblätter zusammen und nach unten ziehen.', 'Stange kontrolliert zur unteren Brust senken.', 'Kraftvoll nach oben drücken.'],
      achte: 'Ellbogen etwa 45° vom Körper, nicht ganz zur Seite. Schwer nur mit Sicherung.', leichter: 'Kurzhantel-Bankdrücken', schwerer: 'Mehr Gewicht oder 1 s Pause auf der Brust' },
    { id: 'kh_bank', ziel: ['brust'], mit: ['trizeps', 'schulter'], typ: 'mehr', stufe: 1, name: 'Kurzhantel-Bankdrücken', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Brust, Trizeps, Schulter',
      schritte: ['Mit zwei Kurzhanteln auf eine Bank (oder den Boden) legen.', 'Hanteln seitlich der Brust, Unterarme senkrecht.', 'Nach oben drücken und kontrolliert absenken.'],
      achte: 'Beide Seiten arbeiten getrennt – das gleicht Unterschiede aus.', leichter: 'Leichtere Hanteln oder am Boden', schwerer: 'Schräge Bank' },
    { id: 'liegestuetz', ziel: ['brust'], mit: ['trizeps', 'schulter', 'bauch'], typ: 'mehr', stufe: 1, name: 'Liegestütz', muster: 'druecken', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Brust, Trizeps, Rumpf',
      schritte: ['Hände etwas breiter als die Schultern, Körper gerade wie ein Brett.', 'Brust bis knapp über den Boden absenken.', 'Wieder hochdrücken, der Körper bleibt gerade.'],
      achte: 'Bauch und Gesäß fest – kein Durchhängen.', leichter: 'Hände erhöht auf Bank oder Tisch', schwerer: 'Füße erhöht oder 3 s runter' },
    { id: 'schulterdruecken', ziel: ['schulter'], mit: ['trizeps', 'nacken'], typ: 'mehr', stufe: 1, name: 'Schulterdrücken mit Kurzhanteln', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Schultern, Trizeps',
      schritte: ['Stehend oder sitzend, Hanteln auf Schulterhöhe.', 'Senkrecht über den Kopf drücken.', 'Kontrolliert zurück auf Schulterhöhe.'],
      achte: 'Kein Hohlkreuz – Bauch anspannen. Bei Schulterbeschwerden lieber Face Pulls.', leichter: 'Einarmig im Wechsel', schwerer: 'Stehend mit Langhantel' },
    { id: 'pike', ziel: ['schulter'], mit: ['trizeps'], typ: 'mehr', stufe: 2, name: 'Pike-Liegestütz', muster: 'druecken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['aufbau', 'kraft', 'stabil'], muskeln: 'Schultern, Trizeps',
      schritte: ['Aus dem Liegestütz die Hüfte weit nach oben schieben – umgedrehtes V.', 'Den Kopf zwischen den Händen Richtung Boden senken.', 'Zurück nach oben drücken.'],
      achte: 'Ersatz fürs Schulterdrücken ohne Geräte.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Füße erhöht auf einer Bank' },
    // Ziehen
    { id: 'klimmzug', ziel: ['lat'], mit: ['bizeps', 'ruecken_oben', 'unterarm'], typ: 'mehr', stufe: 3, name: 'Klimmzug', muster: 'ziehen', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau'], muskeln: 'Breiter Rückenmuskel, Bizeps',
      schritte: ['An die Stange hängen, Hände etwas breiter als die Schultern.', 'Schulterblätter nach unten ziehen, dann die Brust zur Stange ziehen.', 'Langsam ganz herunterlassen.'],
      achte: 'Genau der Muskel, der beim Schwimmen zieht. Geht auch an einer Stange zu Hause.', leichter: 'Mit Band als Hilfe oder nur langsam herunterlassen', schwerer: 'Mit Zusatzgewicht' },
    { id: 'latzug', ziel: ['lat'], mit: ['bizeps', 'ruecken_oben'], typ: 'mehr', stufe: 1, name: 'Latziehen', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Breiter Rückenmuskel, Bizeps',
      schritte: ['Sitzen, Knie unter dem Polster, Stange etwas breiter als schulterbreit greifen.', 'Stange zur oberen Brust ziehen, Ellbogen nach unten und hinten.', 'Kontrolliert zurück nach oben.'],
      achte: 'Nicht mit Schwung aus dem Oberkörper ziehen.', leichter: 'Weniger Gewicht', schwerer: 'Klimmzug' },
    { id: 'rudern_kh', ziel: ['ruecken_oben', 'lat'], mit: ['bizeps', 'schulter', 'unterarm'], typ: 'mehr', stufe: 1, name: 'Einarmiges Kurzhantel-Rudern', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Oberer Rücken, Lat, Bizeps',
      schritte: ['Eine Hand und ein Knie auf eine Bank, Rücken gerade.', 'Die Hantel mit dem Ellbogen nah am Körper zur Hüfte ziehen.', 'Langsam wieder strecken.'],
      achte: 'Die Bewegung kommt aus dem Schulterblatt, der Oberkörper dreht nicht auf.', leichter: 'Leichtere Hantel', schwerer: 'Oben 1 s halten' },
    { id: 'rudern_kabel', ziel: ['ruecken_oben'], mit: ['lat', 'bizeps'], typ: 'mehr', stufe: 1, name: 'Rudern am Kabelzug', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Oberer Rücken, Bizeps',
      schritte: ['Aufrecht sitzen, Griff mit gestreckten Armen halten.', 'Griff zum Bauch ziehen, Schulterblätter zusammen.', 'Langsam nach vorne zurück.'],
      achte: 'Der Oberkörper bleibt ruhig.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig' },
    { id: 'band_rudern', ziel: ['ruecken_oben'], mit: ['bizeps', 'schulter'], typ: 'mehr', stufe: 1, name: 'Rudern mit Band', muster: 'ziehen', geraet: ['band'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Oberer Rücken, Schulterblätter',
      schritte: ['Band auf Brusthöhe befestigen oder um die Füße legen.', 'Enden zum Bauch ziehen, Schulterblätter zusammen.', 'Langsam nachgeben.'],
      achte: 'Gegengewicht zum vielen Sitzen auf dem Rad.', leichter: 'Leichteres Band', schwerer: 'Stärkeres Band, oben 2 s halten' },
    { id: 'tisch_rudern', ziel: ['ruecken_oben', 'lat'], mit: ['bizeps'], typ: 'mehr', stufe: 2, name: 'Rudern unter dem Tisch', muster: 'ziehen', geraet: ['ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Oberer Rücken, Bizeps',
      schritte: ['Unter einen stabilen Tisch legen und die Tischkante greifen.', 'Körper gerade, Brust zur Tischkante ziehen.', 'Langsam ablassen.'],
      achte: 'Vorher prüfen, ob der Tisch sicher hält.', leichter: 'Knie beugen', schwerer: 'Beine gestreckt, Füße erhöht' },
    { id: 'band_lat', ziel: ['lat'], mit: ['trizeps', 'schulter'], typ: 'iso', stufe: 1, name: 'Lat-Zug mit Band (Schwimmzug)', muster: 'ziehen', geraet: ['band', 'gym'], art: 'koerper', eignung: ['ausdauer', 'aufbau', 'stabil'], muskeln: 'Lat, Trizeps, Schulter',
      schritte: ['Band über Kopfhöhe befestigen, leicht nach vorne beugen.', 'Mit fast gestreckten Armen das Band bis zu den Oberschenkeln ziehen – wie der Unterwasserzug.', 'Langsam zurück.'],
      achte: 'Der Ellbogen bleibt hoch wie im Wasser. Sehr schwimmspezifisch.', leichter: 'Leichteres Band', schwerer: 'Stärkeres Band, schneller ziehen' },
    // Schulter
    { id: 'aussenrot', ziel: ['schulter'], mit: [], typ: 'iso', stufe: 1, name: 'Außenrotation mit Band', muster: 'schulter', geraet: ['band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], einseitig: true, muskeln: 'Rotatorenmanschette',
      schritte: ['Band auf Ellbogenhöhe befestigen, Ellbogen 90° gebeugt am Körper.', 'Unterarm nach außen drehen, der Ellbogen bleibt am Körper.', 'Langsam zurück.'],
      achte: 'Kleine Muskeln – leichtes Band und viele saubere Wiederholungen. Schützt die Schwimmerschulter.', leichter: 'Ohne Band, nur die Bewegung', schwerer: 'Im Liegen mit leichter Kurzhantel' },
    { id: 'face_pull', ziel: ['schulter', 'ruecken_oben'], mit: ['nacken'], typ: 'iso', stufe: 1, name: 'Face Pull', muster: 'schulter', geraet: ['gym', 'band'], art: 'koerper', eignung: ['aufbau', 'stabil', 'ausdauer'], muskeln: 'Hintere Schulter, Schulterblätter',
      schritte: ['Seil am Kabelzug (oder Band) auf Kopfhöhe.', 'Zum Gesicht ziehen, Ellbogen hoch und die Hände nach außen drehen.', 'Kontrolliert zurück.'],
      achte: 'Gleicht die nach vorne gezogene Haltung von Rad und Schwimmen aus.', leichter: 'Leichteres Gewicht', schwerer: 'Oben 2 s halten' },
    { id: 'ytw', ziel: ['ruecken_oben', 'schulter'], mit: ['nacken'], typ: 'iso', stufe: 1, name: 'Y-T-W in Bauchlage', muster: 'schulter', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Unterer und mittlerer Trapez, hintere Schulter',
      schritte: ['Auf den Bauch legen, Stirn knapp über dem Boden.', 'Arme nacheinander in Y-, T- und W-Form anheben, Daumen zeigen nach oben.', 'Jede Position 2 s halten.'],
      achte: 'Die Schulterblätter ziehen nach hinten unten, nicht zu den Ohren.', leichter: 'Weniger hoch anheben', schwerer: 'Mit sehr leichten Hanteln' },
    { id: 'serratus', ziel: ['schulter'], mit: ['brust', 'bauch'], typ: 'iso', stufe: 1, name: 'Liegestütz plus', muster: 'schulter', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Sägemuskel (Serratus), Schulterblatt',
      schritte: ['Im Unterarm- oder Liegestütz die Arme gestreckt halten.', 'Die Schulterblätter zusammensinken lassen, dann den Boden aktiv wegdrücken, bis der obere Rücken rund wird.', 'Langsam im Wechsel.'],
      achte: 'Stabilisiert das Schulterblatt – wichtig für schmerzfreie Schultern beim Kraulen.', leichter: 'An der Wand', schwerer: 'Mit Gewichtsweste oder einarmig' },
    // Rumpf
    { id: 'plank', ziel: ['bauch'], mit: ['seite', 'schulter'], typ: 'rumpf', stufe: 1, name: 'Unterarmstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ALLE, muskeln: 'Bauch, Rumpf',
      schritte: ['Auf die Unterarme, Ellbogen unter den Schultern.', 'Körper gerade von Kopf bis Fuß, Gesäß und Bauch fest.', 'Ruhig weiteratmen und halten.'],
      achte: 'Lieber 20 s richtig als 2 min mit Hohlkreuz.', leichter: 'Auf den Knien', schwerer: 'Ein Bein oder einen Arm anheben' },
    { id: 'seitstuetz', ziel: ['seite'], mit: ['abduktoren', 'bauch'], typ: 'rumpf', stufe: 1, name: 'Seitstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ALLE, einseitig: true, muskeln: 'Seitliche Bauchmuskeln, Hüfte',
      schritte: ['Seitlich auf den Unterarm, Ellbogen unter der Schulter.', 'Hüfte anheben, bis der Körper eine gerade Linie bildet.', 'Halten, dann Seite wechseln.'],
      achte: 'Stabilisiert das Becken beim Laufen.', leichter: 'Unteres Knie am Boden', schwerer: 'Oberes Bein anheben' },
    { id: 'copenhagen', ziel: ['adduktoren', 'seite'], mit: [], typ: 'rumpf', stufe: 3, name: 'Copenhagen-Seitstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['stabil', 'kraft', 'aufbau'], einseitig: true, muskeln: 'Adduktoren, seitlicher Rumpf',
      schritte: ['Seitstütz, das obere Bein liegt auf einer Bank – Knie oder Fuß.', 'Hüfte anheben, das untere Bein hängt frei oder wird mit angehoben.', 'Halten, Seite wechseln.'],
      achte: 'Senkt nachweislich Leistenverletzungen. Mit dem Knie auf der Bank beginnen.', leichter: 'Knie statt Fuß auf der Bank', schwerer: 'Fuß auf der Bank, unteres Bein bewegen' },
    { id: 'deadbug', ziel: ['bauch'], mit: ['seite'], typ: 'rumpf', stufe: 1, name: 'Dead Bug', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer', 'aufbau'], muskeln: 'Tiefe Bauchmuskeln',
      schritte: ['Auf den Rücken, Arme senkrecht nach oben, Knie und Hüfte 90° gebeugt.', 'Den unteren Rücken in den Boden drücken.', 'Gegengleich einen Arm und ein Bein langsam strecken, zurück, Seite wechseln.'],
      achte: 'Der untere Rücken bleibt die ganze Zeit am Boden.', leichter: 'Nur die Beine bewegen', schwerer: 'Leichte Hantel in den Händen' },
    { id: 'birddog', ziel: ['ruecken_unten', 'gesaess'], mit: ['bauch', 'schulter'], typ: 'rumpf', stufe: 1, name: 'Bird Dog', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Rückenstrecker, Gesäß, Rumpf',
      schritte: ['Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte.', 'Gegengleich Arm und Bein lang ausstrecken.', '2 s halten, zurück, Seite wechseln.'],
      achte: 'Das Becken kippt nicht zur Seite – stell dir ein Glas Wasser auf dem Rücken vor.', leichter: 'Nur Arm oder nur Bein', schwerer: 'Ellbogen und Knie unter dem Bauch zusammenführen' },
    { id: 'pallof', ziel: ['seite', 'bauch'], mit: [], typ: 'rumpf', stufe: 1, name: 'Pallof Press', muster: 'rumpf', geraet: ['band', 'gym'], art: 'koerper', eignung: ['stabil', 'aufbau', 'ausdauer'], einseitig: true, muskeln: 'Rumpf gegen Verdrehen',
      schritte: ['Seitlich zum befestigten Band oder Kabelzug stehen, Griff an der Brust.', 'Arme gerade nach vorne strecken – der Zug will dich verdrehen.', '2 s halten, zurück zur Brust.'],
      achte: 'Der Oberkörper bleibt still. Genau diese Stabilität braucht man in der Aero-Position.', leichter: 'Näher am Befestigungspunkt', schwerer: 'Im Halbkniestand oder weiter weg' },
    { id: 'rollout', ziel: ['bauch'], mit: ['lat', 'schulter'], typ: 'rumpf', stufe: 3, name: 'Ab-Rollout', muster: 'rumpf', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Bauch, Lat',
      schritte: ['Im Kniestand das Rad oder die Langhantel mit Scheiben greifen.', 'Langsam nach vorne rollen, der Körper bleibt gerade.', 'Mit dem Bauch zurückziehen.'],
      achte: 'Nur so weit, wie kein Hohlkreuz entsteht.', leichter: 'Kürzerer Weg, gegen eine Wand rollen', schwerer: 'Aus dem Stand' },
    { id: 'koffer', ziel: ['seite', 'unterarm'], mit: ['nacken', 'gesaess'], typ: 'rumpf', stufe: 1, name: 'Koffer-Tragen', muster: 'rumpf', geraet: ['gym', 'hantel'], art: 'halten', eignung: ['stabil', 'kraft', 'ausdauer'], einseitig: true, muskeln: 'Seitlicher Rumpf, Griff, Schultern',
      schritte: ['Eine schwere Kurzhantel oder Kettlebell in eine Hand nehmen.', 'Aufrecht gehen, ohne zur Seite zu kippen.', 'Strecke oder Zeit gehen, dann Hand wechseln.'],
      achte: 'Simpel und sehr wirksam für einen stabilen Rumpf beim Laufen.', leichter: 'Leichteres Gewicht', schwerer: 'Schwerer oder über eine Treppe' },
    { id: 'hollow', ziel: ['bauch'], mit: [], typ: 'rumpf', stufe: 2, name: 'Hollow Hold', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['stabil', 'kraft', 'aufbau'], muskeln: 'Bauch',
      schritte: ['Auf den Rücken, unteren Rücken in den Boden drücken.', 'Schultern und gestreckte Beine knapp über den Boden anheben.', 'Körperspannung halten – eine flache Banane.'],
      achte: 'Die Körperspannung von Turnern – hilft auch für eine gestreckte Wasserlage.', leichter: 'Knie gebeugt', schwerer: 'Arme über den Kopf strecken' },
    // Sprünge
    { id: 'hocksprung', ziel: ['quad', 'gesaess'], mit: ['waden'], typ: 'plyo', stufe: 2, name: 'Hocksprung', muster: 'plyo', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'plyo', eignung: ['power', 'ausdauer'], muskeln: 'Beine, Gesäß – Schnellkraft',
      schritte: ['Schulterbreiter Stand, kurz in die Viertelhocke.', 'Explosiv so hoch wie möglich springen, Arme schwingen mit.', 'Weich landen und kurz stabilisieren, dann der nächste Sprung.'],
      achte: 'Qualität vor Menge: Hör auf, sobald die Sprünge niedriger werden.', leichter: 'Kleinere Sprünge', schwerer: 'Mehrere Sprünge direkt hintereinander' },
    { id: 'kastensprung', ziel: ['quad', 'gesaess'], mit: ['waden'], typ: 'plyo', stufe: 2, name: 'Kastensprung', muster: 'plyo', geraet: ['gym', 'ohne'], art: 'plyo', eignung: ['power'], muskeln: 'Beine, Gesäß – Schnellkraft',
      schritte: ['Vor eine stabile Kiste stellen.', 'Mit Armschwung beidbeinig auf die Kiste springen, weich landen.', 'Heruntersteigen, nicht springen.'],
      achte: 'Herunterzusteigen schont die Sehnen – die Landung von oben ist die eigentliche Belastung.', leichter: 'Niedrigere Kiste', schwerer: 'Höher oder aus dem Stand einbeinig' },
    { id: 'pogo', ziel: ['waden'], mit: ['schienbein'], typ: 'plyo', stufe: 1, name: 'Pogo-Sprünge', muster: 'plyo', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'plyo', eignung: ['power', 'stabil', 'ausdauer'], muskeln: 'Waden, Achillessehne – Federwirkung',
      schritte: ['Aufrecht stehen, Knie fast gestreckt.', 'Nur aus den Fußgelenken kurz und federnd hüpfen, wie ein Flummi.', 'Möglichst kurze Bodenkontakte.'],
      achte: 'Verbessert die Laufökonomie, weil die Sehne Energie speichert. Am Anfang kurz halten (2 × 15).', leichter: 'Langsamer, weicher', schwerer: 'Einbeinig' },
    { id: 'skater', ziel: ['gesaess', 'abduktoren'], mit: ['quad', 'adduktoren'], typ: 'plyo', stufe: 2, name: 'Seitsprünge (Skater)', muster: 'plyo', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'plyo', eignung: ['power', 'ausdauer', 'stabil'], muskeln: 'Gesäß, Beine, Stabilität',
      schritte: ['Von einem Bein seitlich auf das andere springen.', 'Landung stabil halten, 1 s, dann zurück.', 'Wie ein Eisschnellläufer.'],
      achte: 'Das Knie bleibt bei der Landung über dem Fuß.', leichter: 'Kleinere Sprünge, kurz absetzen', schwerer: 'Weiter und ohne Halt' },
    // Mobilität
    { id: 'hueftbeuger', ziel: ['quad'], mit: [], typ: 'mobil', stufe: 1, name: 'Hüftbeuger-Dehnung im Kniestand', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Hüftbeuger, Oberschenkel vorn',
      schritte: ['In den Kniestand, ein Fuß vorne aufgestellt.', 'Gesäß anspannen und das Becken leicht nach vorne schieben.', 'Dehnung vorne an der Hüfte des hinteren Beins halten.'],
      achte: 'Nach langen Radeinheiten besonders wichtig – die Aero-Position verkürzt die Hüftbeuger.', leichter: 'Weniger weit nach vorne', schwerer: 'Arm der gleichen Seite über den Kopf' },
    { id: 'weltbeste', ziel: ['gesaess', 'beinbeuger', 'ruecken_oben'], mit: [], typ: 'mobil', stufe: 1, name: '„Beste Dehnung der Welt“', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Hüfte, Beinbeuger, Brustwirbelsäule',
      schritte: ['Großer Ausfallschritt, beide Hände innen neben dem vorderen Fuß.', 'Den inneren Arm zur Decke drehen und nachschauen.', 'Zurück, dann das vordere Bein strecken. Seite wechseln.'],
      achte: 'Ideal zum Aufwärmen – öffnet in einer Übung Hüfte und Rücken.', leichter: 'Hinteres Knie absetzen', schwerer: 'Länger in jeder Position bleiben' },
    { id: 'bws_rotation', ziel: ['ruecken_oben'], mit: [], typ: 'mobil', stufe: 1, name: 'Brustwirbelsäulen-Drehung', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Brustwirbelsäule, Schultern',
      schritte: ['Vierfüßlerstand, eine Hand an den Hinterkopf.', 'Ellbogen zur anderen Hand führen, dann weit zur Decke aufdrehen.', 'Langsam im Atemrhythmus.'],
      achte: 'Eine bewegliche Brustwirbelsäule hilft beim Atmen im Kraulen und in der Aero-Position.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Im Seitliegen mit Arm-Öffnen' },
    { id: 'wade_dehnen', ziel: ['waden'], mit: [], typ: 'mobil', stufe: 1, name: 'Waden-Dehnung an der Wand', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Wade, Soleus',
      schritte: ['Hände an die Wand, ein Bein weit nach hinten, Ferse am Boden.', 'Erst mit gestrecktem Knie, dann mit leicht gebeugtem Knie dehnen.', 'Jeweils halten, Seite wechseln.'],
      achte: 'Mit gebeugtem Knie erreichst du den Soleus.', leichter: 'Kürzerer Schritt', schwerer: 'Fußballen auf eine Stufe' },
    { id: 'huefte_9090', ziel: ['gesaess', 'adduktoren', 'abduktoren'], mit: [], typ: 'mobil', stufe: 1, name: '90/90-Hüftdrehung', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, muskeln: 'Hüfte innen und außen',
      schritte: ['Sitzen, beide Knie 90° gebeugt – ein Bein vorne, eines seitlich.', 'Aufrecht bleiben und die Knie zur anderen Seite kippen.', 'Langsam hin und her.'],
      achte: 'Trainiert die Drehung der Hüfte, die Läufern oft fehlt.', leichter: 'Hände hinter dem Körper abstützen', schwerer: 'Ohne Hände, Oberkörper nach vorne lehnen' },
    { id: 'lat_dehnen', ziel: ['lat', 'schulter', 'brust'], mit: [], typ: 'mobil', stufe: 1, name: 'Lat- und Schulter-Dehnung', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, muskeln: 'Lat, Schultern, Brust',
      schritte: ['Vor eine Bank oder einen Stuhl knien, Ellbogen darauf ablegen.', 'Hände hinter dem Kopf falten, Brust Richtung Boden sinken lassen.', 'Atmen und halten.'],
      achte: 'Gut für Schwimmer: mehr Reichweite über Kopf ohne Hohlkreuz.', leichter: 'Weniger tief', schwerer: 'Mit Stab in den Händen' },
  ];
  const U_NEU = [
    // Brust
    { id: 'butterfly', ziel: ['brust'], mit: ['schulter'], typ: 'iso', stufe: 1, name: 'Butterfly an der Maschine', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Brust, vordere Schulter',
      schritte: ['Sitz so einstellen, dass die Griffe auf Brusthöhe sind.', 'Mit leicht gebeugten Ellbogen die Arme vor der Brust zusammenführen.', 'Langsam öffnen, bis du in der Brust eine leichte Dehnung spürst.'],
      achte: 'Schultern bleiben unten und hinten – die Bewegung kommt aus der Brust, nicht aus den Armen.', leichter: 'Weniger Gewicht, kleinerer Bewegungsweg', schwerer: 'Vorne 2 s halten' },
    { id: 'kabel_fly', ziel: ['brust'], mit: ['schulter'], typ: 'iso', stufe: 2, name: 'Kabelzug-Fly', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Brust, vordere Schulter',
      schritte: ['Zwischen zwei Kabelzügen stehen, Griffe etwa auf Schulterhöhe, ein Schritt nach vorn.', 'Arme leicht gebeugt in einem weiten Bogen vor der Brust zusammenführen.', 'Kontrolliert zurück, bis die Brust gedehnt ist.'],
      achte: 'Der Ellbogenwinkel bleibt gleich – sonst wird es ein Drücken.', leichter: 'Einarmig, weniger Gewicht', schwerer: 'Von unten nach oben ziehen – betont die obere Brust' },
    { id: 'kh_fly', ziel: ['brust'], mit: ['schulter'], typ: 'iso', stufe: 1, name: 'Kurzhantel-Fly', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Brust',
      schritte: ['Auf dem Rücken auf einer Bank oder am Boden, Kurzhanteln über der Brust, Handflächen zueinander.', 'Mit leicht gebeugten Ellbogen die Arme seitlich absenken, bis die Brust gedehnt ist.', 'Im gleichen Bogen wieder zusammenführen.'],
      achte: 'Nicht zu tief absenken. Am Boden begrenzt der Boden den Weg – das schont die Schultern.', leichter: 'Am Boden statt auf der Bank', schwerer: '3 s absenken' },
    { id: 'schraegbank', ziel: ['brust'], mit: ['schulter', 'trizeps'], typ: 'mehr', stufe: 2, name: 'Schrägbankdrücken mit Kurzhanteln', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau'], muskeln: 'Obere Brust, Schulter, Trizeps',
      schritte: ['Bank auf etwa 30° stellen, Kurzhanteln auf Brusthöhe, Handflächen nach vorn.', 'Hanteln nach oben drücken, bis die Arme fast gestreckt sind.', 'Langsam bis auf Brusthöhe absenken.'],
      achte: 'Schulterblätter zusammen und in die Bank drücken; die Ellbogen zeigen schräg nach unten, nicht zur Seite.', leichter: 'Flachere Bank, weniger Gewicht', schwerer: 'Einarmig im Wechsel' },
    { id: 'dips', ziel: ['brust', 'trizeps'], mit: ['schulter'], typ: 'mehr', stufe: 3, name: 'Dips am Barren', muster: 'druecken', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau'], muskeln: 'Brust, Trizeps, Schulter',
      schritte: ['Am Barren abstützen, Arme gestreckt, Oberkörper leicht nach vorn.', 'Langsam absenken, bis die Oberarme etwa waagerecht sind.', 'Kraftvoll hochdrücken.'],
      achte: 'Nicht tiefer als bis zur Waagerechten – das schont die Schultern.', leichter: 'Mit Unterstützung an der Maschine oder mit Band', schwerer: 'Mit Zusatzgewicht' },
    // Schultern
    { id: 'seitheben', ziel: ['schulter'], mit: ['nacken'], typ: 'iso', stufe: 1, name: 'Seitheben mit Kurzhanteln', muster: 'schulter', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Seitliche Schulter',
      schritte: ['Aufrecht stehen, Kurzhanteln seitlich am Körper.', 'Arme mit leicht gebeugten Ellbogen seitlich bis Schulterhöhe anheben.', 'Langsam absenken.'],
      achte: 'Ohne Schwung und nicht höher als die Schultern – leichte Gewichte reichen völlig.', leichter: 'Mit Band oder Wasserflaschen', schwerer: '3 s absenken' },
    { id: 'reverse_fly', ziel: ['schulter', 'ruecken_oben'], mit: [], typ: 'iso', stufe: 1, name: 'Reverse Flys vorgebeugt', muster: 'schulter', geraet: ['gym', 'hantel', 'band'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Hintere Schulter, oberer Rücken',
      schritte: ['Mit geradem Rücken nach vorn beugen, die Hanteln hängen unter der Brust.', 'Arme seitlich anheben, bis sie etwa waagerecht sind – Schulterblätter zusammen.', 'Langsam absenken.'],
      achte: 'Gut für Schultern und Haltung – ein Gegengewicht zu vielem Drücken.', leichter: 'Mit Band im Stehen', schwerer: 'Oben 2 s halten' },
    { id: 'handstand_wand', ziel: ['schulter'], mit: ['trizeps', 'bauch'], typ: 'mehr', stufe: 3, name: 'Handstand an der Wand', muster: 'druecken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['kraft', 'stabil'], muskeln: 'Schultern, Trizeps, Rumpf',
      schritte: ['Mit dem Rücken zur Wand in den Liegestütz, die Füße an der Wand.', 'Mit den Füßen die Wand hochlaufen und die Hände näher zur Wand setzen – so weit, wie es sicher geht.', 'Halten, Körper gerade, dann langsam zurück.'],
      achte: 'Erst versuchen, wenn du sauber Liegestütze und Pike-Liegestütze schaffst.', leichter: 'Pike-Liegestütz mit den Füßen auf einem Stuhl', schwerer: 'Näher an die Wand, länger halten' },
    // Arme
    { id: 'bizeps_curl', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Bizeps-Curls mit Kurzhanteln', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Bizeps, Unterarm',
      schritte: ['Aufrecht stehen, Kurzhanteln in den Händen, Handflächen nach vorn.', 'Ellbogen am Körper lassen und die Hanteln zur Schulter beugen.', 'Langsam ganz strecken.'],
      achte: 'Kein Schwung aus dem Rücken – lieber leichter und sauber.', leichter: 'Im Wechsel, leichter', schwerer: '3 s absenken' },
    { id: 'hammer_curl', ziel: ['bizeps', 'unterarm'], mit: [], typ: 'iso', stufe: 1, name: 'Hammer-Curls', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Bizeps, Unterarm, Griff',
      schritte: ['Wie Bizeps-Curls, aber die Handflächen zeigen zueinander.', 'Hanteln zur Schulter beugen, die Ellbogen bleiben am Körper.', 'Langsam absenken.'],
      achte: 'Trainiert zusätzlich Unterarm und Griff.', leichter: 'Leichtere Hanteln', schwerer: 'Langsamer absenken' },
    { id: 'bizeps_band', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Bizeps-Curls mit Band', muster: 'ziehen', geraet: ['band'], art: 'koerper', eignung: ['aufbau', 'ausdauer'], muskeln: 'Bizeps',
      schritte: ['Mit beiden Füßen auf das Band stellen, die Enden in den Händen.', 'Ellbogen am Körper, Hände zur Schulter beugen.', 'Langsam gegen den Zug strecken.'],
      achte: 'Oben ist der Zug am stärksten – dort kurz halten.', leichter: 'Band länger fassen', schwerer: 'Band kürzer fassen oder doppelt nehmen' },
    { id: 'rucksack_curl', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Curls mit Rucksack oder Wasserflaschen', muster: 'ziehen', geraet: ['ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer'], muskeln: 'Bizeps, Unterarm',
      schritte: ['Einen Rucksack mit Büchern oder zwei volle Wasserflaschen greifen.', 'Ellbogen am Körper und zur Schulter beugen.', 'Langsam absenken.'],
      achte: 'Gewicht so wählen, dass 12–20 saubere Wiederholungen gehen – bis kurz vor die Grenze.', leichter: 'Weniger Inhalt', schwerer: 'Mehr Inhalt, langsamer absenken' },
    { id: 'trizeps_kabel', ziel: ['trizeps'], mit: [], typ: 'iso', stufe: 1, name: 'Trizepsdrücken am Kabel', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Trizeps',
      schritte: ['Vor dem Kabelzug stehen, Seil oder Stange auf Brusthöhe greifen.', 'Ellbogen am Körper lassen und nach unten strecken.', 'Langsam bis etwa 90° zurück.'],
      achte: 'Nur die Unterarme bewegen sich – die Ellbogen bleiben fest an der Seite.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig' },
    { id: 'trizeps_ueberkopf', ziel: ['trizeps'], mit: [], typ: 'iso', stufe: 1, name: 'Trizepsstrecken über Kopf', muster: 'druecken', geraet: ['gym', 'hantel', 'band'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Trizeps (langer Kopf)',
      schritte: ['Eine Kurzhantel mit beiden Händen über dem Kopf halten.', 'Die Ellbogen zeigen nach vorn, die Hantel hinter den Kopf absenken.', 'Wieder ganz strecken.'],
      achte: 'Rumpf fest, kein Hohlkreuz.', leichter: 'Im Sitzen mit Lehne', schwerer: 'Langsamer absenken' },
    { id: 'stuhl_dips', ziel: ['trizeps'], mit: ['brust', 'schulter'], typ: 'mehr', stufe: 1, name: 'Dips am Stuhl', muster: 'druecken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['aufbau', 'ausdauer'], muskeln: 'Trizeps, Brust, Schulter',
      schritte: ['Hände hinter dir auf die Kante eines stabilen Stuhls oder einer Bank, Füße vorn am Boden.', 'Ellbogen nach hinten beugen und den Körper absenken, bis die Oberarme etwa waagerecht sind.', 'Hochdrücken.'],
      achte: 'Rücken nah am Stuhl und nicht zu tief – das schont die Schultern.', leichter: 'Knie gebeugt, Füße näher', schwerer: 'Beine gestreckt oder Füße erhöht' },
    { id: 'enge_liegestuetz', ziel: ['trizeps', 'brust'], mit: ['schulter', 'bauch'], typ: 'mehr', stufe: 2, name: 'Enge Liegestütze', muster: 'druecken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Trizeps, Brust',
      schritte: ['Liegestützposition, Hände etwa schulterbreit oder etwas enger.', 'Ellbogen eng am Körper nach hinten beugen.', 'Hochdrücken, der Körper bleibt eine Linie.'],
      achte: 'Die Ellbogen zeigen nach hinten, nicht zur Seite.', leichter: 'Auf den Knien oder mit den Händen auf einer Bank', schwerer: '3 s absenken' },
    { id: 'farmer', ziel: ['unterarm', 'nacken'], mit: ['seite', 'gesaess', 'waden'], typ: 'mehr', stufe: 1, name: 'Farmer’s Walk', muster: 'rumpf', geraet: ['gym', 'hantel'], art: 'halten', eignung: ['kraft', 'ausdauer', 'stabil'], muskeln: 'Griff, Nacken, Rumpf',
      schritte: ['Zwei schwere Kurzhanteln oder Kettlebells greifen.', 'Aufrecht, Schultern unten, in kurzen, festen Schritten gehen.', '30–40 m oder 30–45 s, dann abstellen.'],
      achte: 'Stärkt Griff, Nacken und Rumpf – nützlich für alles, was du im Alltag trägst.', leichter: 'Leichtere Gewichte, kürzere Strecke', schwerer: 'Schwerer oder länger' },
    { id: 'shrugs', ziel: ['nacken'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Schulterheben (Shrugs)', muster: 'schulter', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'kraft'], muskeln: 'Oberer Trapezmuskel',
      schritte: ['Aufrecht stehen, schwere Kurzhanteln seitlich am Körper.', 'Schultern gerade nach oben zu den Ohren ziehen, kurz halten.', 'Langsam absenken.'],
      achte: 'Nicht kreisen – gerade hoch und runter.', leichter: 'Leichtere Hanteln', schwerer: 'Oben 2 s halten' },
    // Rücken
    { id: 'rueckenstrecker', ziel: ['ruecken_unten', 'gesaess'], mit: ['beinbeuger'], typ: 'iso', stufe: 1, name: 'Rückenstrecken am Gerät', muster: 'huefte', geraet: ['gym'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Rückenstrecker, Gesäß',
      schritte: ['In das Gerät für Rückenstrecken, Hüfte auf dem Polster, Füße fest.', 'Mit geradem Rücken nach vorn absenken.', 'Bis zur geraden Linie aufrichten – nicht ins Hohlkreuz.'],
      achte: 'Gesäß fest anspannen und oben nicht überstrecken.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Gewichtsscheibe vor der Brust' },
    { id: 'superman', ziel: ['ruecken_unten'], mit: ['gesaess', 'ruecken_oben'], typ: 'iso', stufe: 1, name: 'Superman in Bauchlage', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Rückenstrecker, Gesäß',
      schritte: ['Auf den Bauch legen, Arme lang nach vorn.', 'Arme, Brust und Beine gleichzeitig leicht anheben, der Blick bleibt am Boden.', '2 s halten, ablegen.'],
      achte: 'Nur wenig anheben – es geht um Spannung, nicht um Höhe.', leichter: 'Nur Arme oder nur Beine', schwerer: 'Länger halten' },
    // Beine
    { id: 'beinstrecker', ziel: ['quad'], mit: [], typ: 'iso', stufe: 1, name: 'Beinstrecker an der Maschine', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Oberschenkel vorn',
      schritte: ['Sitz so einstellen, dass die Knie am Drehpunkt liegen.', 'Beine kontrolliert strecken, oben kurz halten.', 'Langsam absenken.'],
      achte: 'Gezielt für die Oberschenkel – bei empfindlichen Knien mit kleinerem Bewegungsweg.', leichter: 'Weniger Gewicht', schwerer: 'Einbeinig' },
    { id: 'adduktoren_maschine', ziel: ['adduktoren'], mit: [], typ: 'iso', stufe: 1, name: 'Adduktoren-Maschine', muster: 'einbein', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Oberschenkel innen',
      schritte: ['Aufrecht sitzen, die Polster innen an den Knien.', 'Beine gegen den Widerstand zusammenführen.', 'Langsam öffnen.'],
      achte: 'Starke Adduktoren stabilisieren Knie und Hüfte und schützen vor Leistenproblemen.', leichter: 'Weniger Gewicht', schwerer: '2 s halten' },
    { id: 'abduktoren_maschine', ziel: ['abduktoren'], mit: ['gesaess'], typ: 'iso', stufe: 1, name: 'Abduktoren-Maschine', muster: 'einbein', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Hüfte außen, Gesäß',
      schritte: ['Aufrecht sitzen, die Polster außen an den Knien.', 'Beine gegen den Widerstand nach außen drücken.', 'Langsam schließen.'],
      achte: 'Kräftigt den mittleren Gesäßmuskel – wichtig für stabile Knie beim Laufen.', leichter: 'Weniger Gewicht', schwerer: '2 s halten' },
    { id: 'clamshell', ziel: ['abduktoren'], mit: ['gesaess'], typ: 'iso', stufe: 1, name: 'Muschel (Clamshell)', muster: 'einbein', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer', 'aufbau'], muskeln: 'Hüfte außen, Gesäß',
      schritte: ['Auf die Seite legen, Hüfte und Knie gebeugt, die Füße aufeinander.', 'Oberes Knie öffnen – die Füße bleiben zusammen, das Becken bleibt stehen.', 'Langsam schließen.'],
      achte: 'Das Becken nicht nach hinten kippen lassen.', leichter: 'Kleinerer Weg', schwerer: 'Mit Band über den Knien' },
    { id: 'seitlich_beinheben', ziel: ['abduktoren'], mit: ['seite'], typ: 'iso', stufe: 1, name: 'Seitliches Beinheben im Liegen', muster: 'einbein', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Hüfte außen',
      schritte: ['Auf der Seite liegen, das untere Bein leicht gebeugt.', 'Das obere Bein gestreckt und leicht nach hinten anheben, die Zehen zeigen nach vorn.', 'Langsam absenken.'],
      achte: 'Die Ferse führt – so arbeitet der Gesäßmuskel statt des Hüftbeugers.', leichter: 'Kleinerer Weg', schwerer: 'Mit Band um die Knöchel' },
    { id: 'monster_walk', ziel: ['abduktoren', 'gesaess'], mit: [], typ: 'iso', stufe: 1, name: 'Monster Walk mit Band', muster: 'einbein', geraet: ['band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer', 'aufbau'], muskeln: 'Hüfte außen, Gesäß',
      schritte: ['Band knapp über die Knie oder um die Knöchel, leicht in die Hocke gehen.', 'In kleinen Schritten seitlich gehen, das Band bleibt gespannt.', '10–15 Schritte, dann zurück.'],
      achte: 'Die Knie zeigen nach vorn, nicht nach innen.', leichter: 'Leichteres Band', schwerer: 'Band um die Knöchel, tiefer in die Hocke' },
    { id: 'sumo', ziel: ['adduktoren', 'quad', 'gesaess'], mit: [], typ: 'mehr', stufe: 1, name: 'Sumo-Kniebeuge', muster: 'knie', geraet: ['gym', 'hantel', 'ohne'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Oberschenkel innen und vorn, Gesäß',
      schritte: ['Breiter Stand, Zehen deutlich nach außen, eine Kurzhantel oder Kettlebell zwischen den Beinen.', 'Gerade nach unten gehen, die Knie zeigen über die Zehen.', 'Über die Fersen hochdrücken.'],
      achte: 'Oberkörper aufrecht; die Innenseite der Oberschenkel arbeitet stärker als bei der normalen Kniebeuge.', leichter: 'Ohne Gewicht', schwerer: 'Unten 2 s halten' },
    { id: 'handtuch_curl', ziel: ['beinbeuger'], mit: ['gesaess'], typ: 'iso', stufe: 2, name: 'Beinbeuger-Curl auf dem Handtuch', muster: 'huefte', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Oberschenkel hinten, Gesäß',
      schritte: ['Auf dem Rücken liegen, die Fersen auf einem Handtuch auf glattem Boden, das Becken angehoben.', 'Fersen langsam wegschieben, bis die Beine fast gestreckt sind – das Becken bleibt oben.', 'Fersen wieder heranziehen.'],
      achte: 'Funktioniert auf Parkett oder Fliesen, auf Teppich mit Socken.', leichter: 'Nur langsam wegschieben, mit Becken am Boden zurück', schwerer: 'Einbeinig' },
    // Bauch und Rumpf
    { id: 'crunch', ziel: ['bauch'], mit: [], typ: 'rumpf', stufe: 1, name: 'Crunch', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['aufbau', 'ausdauer'], muskeln: 'Gerader Bauchmuskel',
      schritte: ['Auf den Rücken legen, Knie gebeugt, Hände an den Schläfen.', 'Oberkörper einrollen, bis die Schulterblätter abheben.', 'Langsam abrollen.'],
      achte: 'Nicht am Kopf ziehen, der Blick geht schräg nach oben.', leichter: 'Arme lang neben dem Körper', schwerer: 'Gewicht vor der Brust' },
    { id: 'beinheben', ziel: ['bauch'], mit: ['unterarm', 'lat'], typ: 'rumpf', stufe: 3, name: 'Beinheben im Hang', muster: 'rumpf', geraet: ['gym'], art: 'koerper', eignung: ['aufbau', 'kraft'], muskeln: 'Bauch, Hüftbeuger, Griff',
      schritte: ['An einer Stange hängen, die Schultern aktiv.', 'Knie oder gestreckte Beine kontrolliert Richtung Brust heben, das Becken einrollen.', 'Langsam absenken, ohne zu schwingen.'],
      achte: 'Kein Schwung – lieber Knie anziehen statt gestreckte Beine.', leichter: 'Knie anziehen oder im Stütz am Gerät', schwerer: 'Gestreckte Beine bis zur Stange' },
    { id: 'holzhacker', ziel: ['seite'], mit: ['bauch', 'schulter'], typ: 'rumpf', stufe: 1, name: 'Holzhacker am Kabel oder Band', muster: 'rumpf', geraet: ['gym', 'band'], art: 'koerper', eignung: ['stabil', 'ausdauer', 'aufbau', 'power'], muskeln: 'Seitlicher Bauch, Rumpf',
      schritte: ['Seitlich zum Kabelzug oder Band, den Griff mit beiden Händen oben.', 'Diagonal nach unten zur gegenüberliegenden Hüfte ziehen, der Oberkörper dreht mit.', 'Kontrolliert zurück.'],
      achte: 'Die Kraft kommt aus Rumpf und Hüfte, die Arme bleiben fast gestreckt.', leichter: 'Weniger Gewicht', schwerer: 'Langsamer zurück' },
    { id: 'bergsteiger', ziel: ['bauch'], mit: ['schulter', 'quad'], typ: 'rumpf', stufe: 1, name: 'Bergsteiger', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['ausdauer', 'stabil'], muskeln: 'Bauch, Schultern, Hüftbeuger',
      schritte: ['Liegestützposition, Hände unter den Schultern.', 'Abwechselnd ein Knie zur Brust ziehen.', 'Zügig, aber mit stabilem Becken.'],
      achte: 'Die Hüfte nicht hochschieben – der Körper bleibt eine Linie.', leichter: 'Langsam, Hände auf einer Bank', schwerer: 'Schneller oder Knie zum gegenüberliegenden Ellbogen' },
    // Version 27: Aeroposition – Nacken und Rumpf so, wie sie auf dem Zeitfahrrad arbeiten
    { id: 'nacken_aero', ziel: ['nacken'], mit: ['ruecken_oben'], typ: 'iso', stufe: 1, name: 'Nacken halten in Aero-Haltung', muster: 'nacken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['stabil', 'ausdauer', 'aufbau', 'kraft'], muskeln: 'Nackenstrecker, oberer Trapezmuskel',
      schritte: ['Bauchlage auf einer Bank oder dem Boden, die Unterarme vorn abgelegt wie auf dem Aufsatz.', 'Den Kopf in Verlängerung der Wirbelsäule leicht anheben, der Blick geht schräg nach vorn auf den Boden – wie auf dem Zeitfahrrad.', 'Halten und ruhig weiteratmen, die Schultern bleiben weg von den Ohren.'],
      achte: 'Kinn leicht einziehen – nicht den Kopf in den Nacken werfen.', leichter: 'Kürzer halten, zwischendurch die Stirn ablegen', schwerer: 'Länger halten oder eine leichte Scheibe am Hinterkopf mit der Hand sichern' },
    { id: 'aero_stuetz', ziel: ['bauch'], mit: ['schulter', 'ruecken_oben', 'seite'], typ: 'rumpf', stufe: 2, name: 'Aero-Unterarmstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['stabil', 'ausdauer', 'aufbau'], muskeln: 'Bauch, Schulterblattmuskeln, seitlicher Bauch',
      schritte: ['Unterarmstütz, die Ellbogen schulterbreit wie auf dem Aufsatz, die Hände berühren sich.', 'Rücken flach, das Becken leicht nach hinten gekippt – wie in der Aeroposition.', 'Die Unterarme abwechselnd 5 cm nach vorn schieben und zurück, ohne dass der Rücken durchhängt.'],
      achte: 'Die Hüfte bleibt ruhig – lieber kürzer und sauber als lang und durchgehangen.', leichter: 'Auf den Knien', schwerer: 'Unterarme auf einem Gymnastikball, kleine Kreise rühren' },
  ];
  U.push(...U_NEU);
  // Version 43: mehr Übungstiefe im Studio – damit jede Übung mindestens vier sinnvolle Alternativen hat
  // (Beinbeuger, Bizeps, Trizeps, Latissimus, Rücken, Beine, Waden, Hüfte, Unterarme, Nacken, Schienbein, Maschinen)
  const U_V43 = [
    // Beinbeuger: liegend (oben), sitzend, stehend am Kabel, Glute-Ham-Raise – dazu Nordic und Handtuch-Curl
    { id: 'beinbeuger_sitzend', ziel: ['beinbeuger'], mit: ['waden'], typ: 'iso', stufe: 1, name: 'Beinbeuger sitzend an der Maschine', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'kraft', 'ausdauer', 'stabil'], muskeln: 'Beinbeuger',
      schritte: ['Rückenlehne so einstellen, dass die Knie auf Höhe des Drehpunkts liegen; das obere Polster fest auf die Oberschenkel.', 'Die Fersen kontrolliert nach unten und hinten ziehen, bis die Knie stark gebeugt sind.', 'Kurz halten, dann in etwa 3 s zurück, bis die Beine fast gestreckt sind.'],
      achte: 'Das Becken bleibt im Sitz, kein Schwung mit dem Oberkörper. Im Sitzen ist der Beinbeuger stärker vorgedehnt – günstig für den Muskelaufbau.', leichter: 'Weniger Gewicht', schwerer: 'Einbeinig oder 2 s in der Beugung halten' },
    { id: 'beinbeuger_kabel', ziel: ['beinbeuger'], mit: ['waden'], typ: 'iso', stufe: 1, name: 'Beinbeuger stehend am Kabel', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Beinbeuger',
      schritte: ['Die Fußschlaufe am unteren Kabelzug um den Knöchel legen, mit dem Gesicht zur Maschine stehen und festhalten.', 'Die Ferse Richtung Gesäß ziehen, das Knie zeigt dabei nach unten.', 'Langsam zurück, bis das Bein fast gestreckt ist, dann Seite wechseln.'],
      achte: 'Der Oberschenkel bleibt senkrecht und das Becken ruhig – nicht ins Hohlkreuz ausweichen.', leichter: 'Weniger Gewicht oder mit Band', schwerer: '2 s in der Beugung halten' },
    { id: 'ghr', ziel: ['beinbeuger', 'gesaess'], mit: ['waden', 'ruecken_unten'], typ: 'mehr', stufe: 3, name: 'Glute-Ham-Raise', muster: 'huefte', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Beinbeuger, Gesäß, Waden',
      schritte: ['Im Glute-Ham-Gerät die Füße zwischen die Rollen klemmen, die Knie knapp hinter dem Polster.', 'Aus der Waagerechten den Körper durch Anbeugen der Knie bis fast in die Senkrechte ziehen.', 'Kontrolliert in etwa 3 s zurück in die Waagerechte.'],
      achte: 'Knie, Hüfte und Schultern bleiben in einer Linie – nicht in der Hüfte abknicken.', leichter: 'Mit einem Band unterstützen oder nur die untere Hälfte', schwerer: 'Langsamer zurück oder eine Scheibe vor der Brust' },
    // Bizeps
    { id: 'sz_curl', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Bizeps-Curls mit SZ-Stange', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'kraft', 'ausdauer'], muskeln: 'Bizeps, Unterarme',
      schritte: ['Die SZ-Stange schulterbreit im Untergriff greifen, aufrecht stehen, die Ellbogen am Körper.', 'Die Stange ohne Schwung bis vor die Schultern beugen.', 'In 2–3 s fast ganz absenken.'],
      achte: 'Der Oberkörper bleibt ruhig, die Ellbogen wandern nicht nach vorn.', leichter: 'Leichtere Stange', schwerer: '3 s absenken oder mehr Gewicht' },
    { id: 'kabel_curl', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Bizeps-Curls am Kabel', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Bizeps, Unterarme',
      schritte: ['Stange oder Seil am unteren Kabelzug, einen kleinen Schritt zurück, die Ellbogen am Körper.', 'Gegen den Zug bis vor die Schultern beugen.', 'Langsam zurück – das Kabel hält die Spannung bis unten.'],
      achte: 'Nicht mit dem Oberkörper nach hinten lehnen, um das Gewicht zu bewegen.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig oder oben 1 s halten' },
    { id: 'scott_curl', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 1, name: 'Scott-Curls an der Bizeps-Maschine', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'kraft'], muskeln: 'Bizeps, Unterarme',
      schritte: ['Den Sitz so einstellen, dass die Oberarme ganz auf dem Polster liegen.', 'Stange oder Griffe kontrolliert bis vor die Schultern beugen.', 'In etwa 3 s absenken, unten nicht ganz durchstrecken.'],
      achte: 'Unten nicht fallen lassen – in der Streckung ist der Bizeps am empfindlichsten.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig mit Kurzhantel am Pult' },
    { id: 'schraegbank_curl', ziel: ['bizeps'], mit: ['unterarm'], typ: 'iso', stufe: 2, name: 'Schrägbank-Curls mit Kurzhanteln', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau'], muskeln: 'Bizeps (langer Kopf), Unterarme',
      schritte: ['Die Bank auf etwa 45–60° stellen, zurücklehnen, die Arme hängen gestreckt neben dem Körper.', 'Beide Hanteln beugen, ohne die Ellbogen nach vorn zu nehmen.', 'Langsam ganz absenken.'],
      achte: 'Die Schultern bleiben an der Lehne – die Dehnung unten ist der Sinn der Übung.', leichter: 'Steilere Lehne oder leichtere Hanteln', schwerer: 'Flachere Lehne' },
    { id: 'konzentrations_curl', ziel: ['bizeps'], mit: [], typ: 'iso', stufe: 1, name: 'Konzentrations-Curls', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], einseitig: true, muskeln: 'Bizeps',
      schritte: ['Auf eine Bank setzen, den Ellbogen innen am Oberschenkel abstützen.', 'Die Hantel zur Schulter beugen.', 'Langsam absenken, dann Seite wechseln.'],
      achte: 'Der Oberarm bleibt am Bein – nur der Unterarm bewegt sich.', leichter: 'Leichtere Hantel', schwerer: 'Oben 2 s halten' },
    // Trizeps
    { id: 'french_press', ziel: ['trizeps'], mit: [], typ: 'iso', stufe: 2, name: 'French Press mit SZ-Stange oder Kurzhanteln', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'kraft'], muskeln: 'Trizeps (langer Kopf)',
      schritte: ['Auf die Bank legen, Stange oder Hanteln mit gestreckten Armen über der Brust.', 'Nur die Ellbogen beugen und das Gewicht hinter die Stirn absenken.', 'Wieder strecken, die Oberarme bleiben fast senkrecht.'],
      achte: 'Die Ellbogen zeigen nach oben und gehen nicht weit auseinander. Mit leichtem Gewicht beginnen.', leichter: 'Kurzhanteln, Handflächen zueinander', schwerer: '3 s absenken' },
    { id: 'enges_bank', ziel: ['trizeps', 'brust'], mit: ['schulter'], typ: 'mehr', stufe: 2, name: 'Enges Bankdrücken', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Trizeps, Brust, vordere Schulter',
      schritte: ['Auf die Bank legen, die Stange etwa schulterbreit greifen.', 'Zum unteren Brustbein absenken, die Ellbogen bleiben nah am Körper.', 'Kraftvoll nach oben drücken.'],
      achte: 'Nicht zu eng greifen – schulterbreit schont die Handgelenke. Mit Partner oder Ablagen sichern.', leichter: 'Kurzhanteln mit neutralem Griff', schwerer: 'Mehr Gewicht oder 1 s Pause auf der Brust' },
    { id: 'kickback', ziel: ['trizeps'], mit: [], typ: 'iso', stufe: 1, name: 'Trizeps-Kickback mit Kurzhantel oder Kabel', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], einseitig: true, muskeln: 'Trizeps',
      schritte: ['Vorgebeugt mit einer Hand auf der Bank abstützen, den Oberarm waagerecht am Körper.', 'Den Unterarm nach hinten strecken, bis der Arm gerade ist.', 'Langsam zurück, dann Seite wechseln.'],
      achte: 'Der Oberarm bleibt still – sonst holt die Schulter den Schwung.', leichter: 'Leichtere Hantel', schwerer: 'Am unteren Kabelzug: Spannung bis zum Ende' },
    // Latissimus und oberer Rücken
    { id: 'latzug_eng', ziel: ['lat'], mit: ['bizeps', 'ruecken_oben'], typ: 'mehr', stufe: 1, name: 'Latziehen eng mit neutralem Griff', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Latissimus, Bizeps, oberer Rücken',
      schritte: ['Den engen Parallelgriff einhängen, die Oberschenkel unter das Polster.', 'Die Griffe zur oberen Brust ziehen, die Ellbogen gehen nach unten und hinten.', 'Kontrolliert zurück, bis die Arme fast gestreckt sind und der Lat gedehnt ist.'],
      achte: 'Brust raus, nicht weit nach hinten lehnen. Erst die Schulterblätter nach unten ziehen, dann die Arme.', leichter: 'Weniger Gewicht', schwerer: '2 s unten halten oder einarmig' },
    { id: 'ueberzug_kabel', ziel: ['lat'], mit: ['trizeps', 'bauch'], typ: 'iso', stufe: 1, name: 'Überzüge am Kabel mit gestreckten Armen', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Latissimus, langer Trizeps, Rumpf',
      schritte: ['Stange oder Seil am oberen Kabelzug, einen Schritt zurück, leicht vorbeugen, die Arme fast gestreckt.', 'Die Stange in einem Bogen bis zu den Oberschenkeln ziehen.', 'Langsam zurück, bis die Arme über Kopfhöhe sind.'],
      achte: 'Die Arme bleiben fast gestreckt – die Bewegung kommt aus der Schulter, ähnlich wie der Zug im Wasser.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig oder unten 1 s halten' },
    { id: 'klimmzug_assist', ziel: ['lat', 'ruecken_oben'], mit: ['bizeps'], typ: 'mehr', stufe: 1, name: 'Klimmzug mit Unterstützung', muster: 'ziehen', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Latissimus, oberer Rücken, Bizeps',
      schritte: ['An der Klimmzugmaschine das Gegengewicht wählen oder ein Band in die Stange hängen und Knie oder Fuß hineinstellen.', 'Aus dem Hang erst die Schulterblätter nach unten ziehen, dann die Brust zur Stange.', 'Kontrolliert ganz ablassen.'],
      achte: 'Jede Woche etwas weniger Unterstützung – so wird daraus der freie Klimmzug.', leichter: 'Mehr Gegengewicht oder ein stärkeres Band', schwerer: 'Weniger Unterstützung' },
    { id: 'rudern_lh', ziel: ['ruecken_oben', 'lat'], mit: ['bizeps', 'ruecken_unten', 'beinbeuger'], typ: 'mehr', stufe: 2, name: 'Langhantel-Rudern vorgebeugt', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Oberer Rücken, Latissimus, Bizeps, unterer Rücken',
      schritte: ['Die Stange schulterbreit greifen und aus der Hüfte vorbeugen, bis der Oberkörper etwa 45° steht, die Knie leicht gebeugt.', 'Die Stange zum Bauchnabel ziehen, die Schulterblätter gehen zusammen.', 'Kontrolliert absenken, der Rücken bleibt gerade.'],
      achte: 'Der Rücken bleibt neutral und der Oberkörper ruhig – kein Schwung aus der Hüfte.', leichter: 'Rudern an der Maschine mit Brustpolster', schwerer: 'Mehr Gewicht oder 1 s oben halten' },
    { id: 'rudern_maschine', ziel: ['ruecken_oben', 'lat'], mit: ['bizeps', 'schulter'], typ: 'mehr', stufe: 1, name: 'Rudern an der Maschine mit Brustpolster', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer', 'stabil'], muskeln: 'Oberer Rücken, Latissimus, Bizeps, hintere Schulter',
      schritte: ['Den Sitz so einstellen, dass die Griffe auf Schulterhöhe sind, die Brust ans Polster.', 'Die Griffe zum Körper ziehen, die Schulterblätter gehen zusammen.', 'Langsam nach vorn lassen, bis sich die Schulterblätter öffnen.'],
      achte: 'Die Brust bleibt am Polster – so entlastet die Maschine den unteren Rücken.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig oder 2 s halten' },
    { id: 'reverse_butterfly', ziel: ['schulter', 'ruecken_oben'], mit: [], typ: 'iso', stufe: 1, name: 'Reverse Butterfly an der Maschine', muster: 'schulter', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Hintere Schulter, oberer Rücken',
      schritte: ['Mit der Brust zum Polster setzen, die Griffe auf Schulterhöhe, die Arme fast gestreckt.', 'Die Arme in einem weiten Bogen nach hinten führen.', 'Langsam zurück, bis sich die Hände fast treffen.'],
      achte: 'Die Schultern bleiben unten – nicht zu den Ohren ziehen.', leichter: 'Weniger Gewicht', schwerer: '2 s hinten halten' },
    // Hüfte und unterer Rücken
    { id: 'good_morning', ziel: ['beinbeuger', 'ruecken_unten'], mit: ['gesaess'], typ: 'mehr', stufe: 3, name: 'Good Morning mit Langhantel', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau'], muskeln: 'Beinbeuger, unterer Rücken, Gesäß',
      schritte: ['Die Stange wie bei der Kniebeuge auf den oberen Rücken legen, Füße hüftbreit, Knie leicht gebeugt.', 'Die Hüfte nach hinten schieben und den Oberkörper mit geradem Rücken nach vorn neigen, bis der Beinbeuger zieht.', 'Über die Hüfte wieder aufrichten.'],
      achte: 'Leicht beginnen – der Rücken bleibt die ganze Zeit gerade, die Bewegung kommt aus der Hüfte.', leichter: 'Mit Stab oder Band', schwerer: 'Mehr Gewicht, langsamer absenken' },
    { id: 'reverse_hyper', ziel: ['gesaess', 'ruecken_unten'], mit: ['beinbeuger'], typ: 'iso', stufe: 2, name: 'Reverse Hyperextension', muster: 'huefte', geraet: ['gym'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Gesäß, unterer Rücken, Beinbeuger',
      schritte: ['Bäuchlings auf eine hohe Bank oder das Gerät legen, sodass die Hüfte an der Kante liegt, gut festhalten.', 'Die gestreckten Beine anheben, bis sie in einer Linie mit dem Oberkörper sind.', 'Langsam wieder absenken.'],
      achte: 'Nicht über die Waagerechte ins Hohlkreuz schwingen – das Gesäß hebt die Beine.', leichter: 'Knie gebeugt', schwerer: 'Gewichtsmanschetten oder 2 s oben halten' },
    // Oberschenkel vorn
    { id: 'hackenschmidt', ziel: ['quad', 'gesaess'], mit: ['adduktoren'], typ: 'mehr', stufe: 2, name: 'Hackenschmidt-Kniebeuge', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau'], muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Den Rücken an das Polster, die Schultern unter die Bügel, die Füße hüftbreit mittig auf die Plattform.', 'Kontrolliert tief beugen, die Knie folgen den Zehen.', 'Über die ganze Fußsohle wieder hochdrücken.'],
      achte: 'Der untere Rücken bleibt am Polster. Füße weiter vorn betonen das Gesäß, weiter hinten den Oberschenkel.', leichter: 'Weniger Gewicht, weniger tief', schwerer: '2 s Pause unten' },
    { id: 'frontkniebeuge', ziel: ['quad', 'gesaess'], mit: ['bauch', 'ruecken_oben'], typ: 'mehr', stufe: 3, name: 'Frontkniebeuge', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Oberschenkel vorn, Gesäß, Rumpf',
      schritte: ['Die Stange vorn auf die Schultern legen, die Ellbogen hoch, die Finger locker unter der Stange.', 'Aufrecht tief in die Hocke gehen, die Knie schieben nach vorn.', 'Mit hohen Ellbogen kraftvoll aufstehen.'],
      achte: 'Der Oberkörper bleibt aufrechter als bei der Kniebeuge hinten – fallen die Ellbogen, kippt die Stange.', leichter: 'Goblet-Kniebeuge', schwerer: 'Mehr Gewicht oder 2 s Pause unten' },
    { id: 'beinpresse_einbein', ziel: ['quad', 'gesaess'], mit: ['adduktoren'], typ: 'mehr', stufe: 1, name: 'Einbeinige Beinpresse', muster: 'einbein', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Einen Fuß mittig auf die Plattform stellen, das andere Bein locker abstellen.', 'Langsam beugen, bis das Knie etwa 90° hat.', 'Über die ganze Fußsohle zurückdrücken, dann Seite wechseln.'],
      achte: 'Das Knie bleibt über dem Fuß und fällt nicht nach innen. Gut, um Seitenunterschiede auszugleichen.', leichter: 'Weniger Gewicht', schwerer: '3 s absenken' },
    // Waden und Schienbein
    { id: 'wade_maschine', ziel: ['waden'], mit: [], typ: 'iso', stufe: 1, name: 'Wadenheben stehend an der Maschine', muster: 'wade', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer', 'stabil'], muskeln: 'Wade (Gastrocnemius), Achillessehne',
      schritte: ['Die Schultern unter die Polster, die Fußballen auf die Kante, die Knie gestreckt.', 'So hoch wie möglich auf die Zehen drücken, oben kurz halten.', 'Langsam tief unter die Kante absenken.'],
      achte: 'Unten 1 s in der Dehnung halten, nicht federn.', leichter: 'Weniger Gewicht', schwerer: 'Einbeinig oder 3 s absenken' },
    { id: 'wade_beinpresse', ziel: ['waden'], mit: [], typ: 'iso', stufe: 1, name: 'Wadenheben an der Beinpresse', muster: 'wade', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Wade (Gastrocnemius)',
      schritte: ['In der Beinpresse die Fußballen auf den unteren Rand der Plattform, die Beine fast gestreckt.', 'Die Plattform nur mit den Füßen wegdrücken.', 'Langsam zurück, bis die Waden gedehnt sind.'],
      achte: 'Die Knie nicht ganz durchdrücken und die Sicherung der Plattform eingehängt lassen.', leichter: 'Weniger Gewicht', schwerer: 'Einbeinig' },
    { id: 'tibialis_gewicht', ziel: ['schienbein'], mit: [], typ: 'iso', stufe: 1, name: 'Schienbeinheben mit Gewicht', muster: 'wade', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Schienbeinmuskel (Tibialis anterior)',
      schritte: ['Auf eine Bank setzen, eine Kurzhantel zwischen die Füße klemmen oder eine Tib-Bar nutzen, die Fersen bleiben am Boden.', 'Die Fußspitzen so weit wie möglich anziehen.', 'Langsam absenken.'],
      achte: 'Langsam arbeiten – dieser Muskel kontrolliert beim Laufen, wie der Fuß nach dem Aufsetzen abrollt.', leichter: 'Ohne Gewicht an der Wand', schwerer: 'Mehr Gewicht oder einbeinig' },
    // Seitliche Schulter und Gesäß an Kabel und Maschine
    { id: 'seitheben_kabel', ziel: ['schulter'], mit: [], typ: 'iso', stufe: 1, name: 'Seitheben am Kabel', muster: 'schulter', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Seitliche Schulter',
      schritte: ['Seitlich zum unteren Kabelzug stehen, den Griff mit der äußeren Hand vor dem Körper fassen.', 'Den Arm mit leicht gebeugtem Ellbogen seitlich bis auf Schulterhöhe führen.', 'Langsam absenken, dann Seite wechseln.'],
      achte: 'Die Schulter bleibt unten, der Oberkörper neigt sich nicht weg. Das Kabel hält die Spannung auch unten.', leichter: 'Weniger Gewicht', schwerer: 'Oben 1 s halten' },
    { id: 'seitheben_maschine', ziel: ['schulter'], mit: [], typ: 'iso', stufe: 1, name: 'Seitheben an der Maschine', muster: 'schulter', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Seitliche Schulter',
      schritte: ['Den Sitz so einstellen, dass die Schultern auf Höhe des Drehpunkts sind, die Oberarme an den Polstern.', 'Die Arme seitlich bis auf Schulterhöhe heben.', 'Langsam absenken.'],
      achte: 'Nicht mit den Schultern nach oben ziehen – die Bewegung kommt aus dem Schultergelenk.', leichter: 'Weniger Gewicht', schwerer: '3 s absenken' },
    { id: 'gesaess_kabel', ziel: ['gesaess'], mit: ['beinbeuger'], typ: 'iso', stufe: 1, name: 'Gesäß-Kickback am Kabel', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Großer Gesäßmuskel, Beinbeuger',
      schritte: ['Die Schlaufe am unteren Kabelzug um den Knöchel, mit dem Gesicht zur Maschine leicht vorgebeugt festhalten.', 'Das Bein gestreckt nach hinten führen, bis das Gesäß fest angespannt ist.', 'Langsam zurück, dann Seite wechseln.'],
      achte: 'Kein Hohlkreuz – das Bein geht nur so weit nach hinten, wie das Becken ruhig bleibt.', leichter: 'Weniger Gewicht oder mit Band', schwerer: '2 s hinten halten' },
    // Fuß und Schienbein
    { id: 'fersengang', ziel: ['schienbein'], mit: ['waden'], typ: 'iso', stufe: 1, name: 'Fersen- und Zehengang', muster: 'fuss', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ALLE, muskeln: 'Schienbeinmuskel, Waden, Fußmuskeln',
      schritte: ['Barfuß oder in leichten Schuhen etwa 20 m auf den Fersen gehen, die Zehen hoch.', 'Dann dieselbe Strecke auf den Zehenspitzen.', 'Locker zurückgehen und wiederholen.'],
      achte: 'Aufrecht bleiben und kleine Schritte machen.', leichter: 'Kürzere Strecke', schwerer: 'Mit Kurzhanteln in den Händen' },
    // Hüfte innen und außen
    { id: 'adduktion_kabel', ziel: ['adduktoren'], mit: [], typ: 'iso', stufe: 1, name: 'Adduktion am Kabel', muster: 'einbein', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Oberschenkel innen',
      schritte: ['Seitlich zum unteren Kabelzug stehen, die Schlaufe um den inneren Knöchel.', 'Das Bein vor dem Standbein vorbei nach innen ziehen.', 'Langsam zurück, dann Seite wechseln.'],
      achte: 'Aufrecht bleiben, der Oberkörper kippt nicht mit.', leichter: 'Weniger Gewicht oder mit Band', schwerer: '1 s innen halten' },
    { id: 'abduktion_kabel', ziel: ['abduktoren'], mit: ['gesaess'], typ: 'iso', stufe: 1, name: 'Abduktion am Kabel', muster: 'einbein', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Hüfte außen, mittlerer Gesäßmuskel',
      schritte: ['Seitlich zum unteren Kabelzug stehen, die Schlaufe um den äußeren Knöchel.', 'Das gestreckte Bein seitlich nach außen führen.', 'Langsam zurück, dann Seite wechseln.'],
      achte: 'Die Zehen zeigen nach vorn, das Becken bleibt gerade.', leichter: 'Weniger Gewicht oder mit Band', schwerer: '1 s außen halten' },
    // Unterarme und Griff
    { id: 'handgelenk_curl', ziel: ['unterarm'], mit: [], typ: 'iso', stufe: 1, name: 'Handgelenk-Curls', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Unterarme (Beuger)',
      schritte: ['Die Unterarme auf die Oberschenkel oder eine Bank legen, die Handgelenke über der Kante, Untergriff.', 'Nur die Handgelenke nach oben rollen.', 'Langsam absenken, die Hantel darf bis in die Finger rollen.'],
      achte: 'Kleines Gewicht, viele saubere Wiederholungen.', leichter: 'Leichtere Hanteln', schwerer: 'Langhantel oder 2 s oben halten' },
    { id: 'reverse_curl', ziel: ['unterarm', 'bizeps'], mit: [], typ: 'iso', stufe: 1, name: 'Reverse Curls im Obergriff', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer'], muskeln: 'Unterarme (Strecker), Oberarmspeichenmuskel, Bizeps',
      schritte: ['SZ-Stange oder Kurzhanteln im Obergriff, die Ellbogen am Körper.', 'Bis vor die Schultern beugen, die Handgelenke bleiben gerade.', 'Langsam absenken.'],
      achte: 'Leichter als normale Curls beginnen – im Obergriff ist man deutlich schwächer.', leichter: 'Leichteres Gewicht', schwerer: '3 s absenken' },
    { id: 'scheiben_halten', ziel: ['unterarm'], mit: [], typ: 'iso', stufe: 1, name: 'Hantelscheiben im Kneifgriff halten', muster: 'ziehen', geraet: ['gym'], art: 'halten', eignung: ['kraft', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Unterarme, Finger, Daumen',
      schritte: ['Zwei glatte Hantelscheiben mit der glatten Seite nach außen zusammenlegen.', 'Mit Daumen und Fingern seitlich fassen und neben dem Körper halten.', 'Halten, ohne dass die Scheiben rutschen, dann Seite wechseln.'],
      achte: 'Aufrecht stehen, die Schulter bleibt unten.', leichter: 'Kleinere Scheiben', schwerer: 'Größere Scheiben oder länger halten' },
    // Nacken – für lange Zeit in der Aeroposition
    { id: 'nacken_isometrie', ziel: ['nacken'], mit: [], typ: 'iso', stufe: 1, name: 'Nacken-Isometrie in vier Richtungen', muster: 'nacken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ALLE, muskeln: 'Nackenmuskulatur rundum',
      schritte: ['Aufrecht sitzen, eine Hand an die Stirn legen.', 'Den Kopf gegen die Hand drücken, ohne dass er sich bewegt, 10–20 s halten.', 'Dasselbe nach hinten und zu beiden Seiten.'],
      achte: 'Mit etwa halber Kraft drücken und ruhig weiteratmen.', leichter: 'Weniger Druck', schwerer: 'Mit einem Band um den Kopf, länger halten' },
    { id: 'nacken_strecken', ziel: ['nacken'], mit: ['ruecken_oben'], typ: 'iso', stufe: 1, name: 'Nackenstrecken in Bauchlage', muster: 'nacken', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['ausdauer', 'stabil'], muskeln: 'Nacken hinten, oberer Rücken',
      schritte: ['Bäuchlings auf eine Bank legen, der Kopf ragt über die Kante.', 'Den Kopf langsam anheben, bis er in Verlängerung der Wirbelsäule ist – der Blick bleibt am Boden.', 'Langsam absenken.'],
      achte: 'Nicht in den Nacken überstrecken – nur bis zur geraden Linie.', leichter: 'Auf dem Boden liegend, nur den Kopf heben', schwerer: 'Eine leichte Scheibe am Hinterkopf' },
    // Maschinen für Brust, Schultern und Bauch
    { id: 'brustpresse', ziel: ['brust'], mit: ['trizeps', 'schulter'], typ: 'mehr', stufe: 1, name: 'Brustpresse an der Maschine', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer', 'stabil'], muskeln: 'Brust, Trizeps, vordere Schulter',
      schritte: ['Den Sitz so einstellen, dass die Griffe auf Höhe der Brustmitte sind, den Rücken an die Lehne.', 'Die Griffe nach vorn drücken, bis die Arme fast gestreckt sind.', 'Langsam zurück, bis die Brust gedehnt ist.'],
      achte: 'Die Schulterblätter bleiben hinten und unten an der Lehne.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig oder 3 s zurück' },
    { id: 'schulterpresse', ziel: ['schulter'], mit: ['trizeps'], typ: 'mehr', stufe: 1, name: 'Schulterdrücken an der Maschine', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Schultern, Trizeps',
      schritte: ['Den Sitz so einstellen, dass die Griffe etwa auf Schulterhöhe beginnen.', 'Nach oben drücken, bis die Arme fast gestreckt sind.', 'Kontrolliert bis auf Schulterhöhe zurück.'],
      achte: 'Der Rücken bleibt an der Lehne, kein Hohlkreuz.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig' },
    { id: 'kabel_crunch', ziel: ['bauch'], mit: [], typ: 'rumpf', stufe: 2, name: 'Kabel-Crunch kniend', muster: 'rumpf', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'kraft', 'stabil'], muskeln: 'Gerader Bauchmuskel',
      schritte: ['Vor dem oberen Kabelzug knien, das Seil neben dem Kopf halten.', 'Den Oberkörper einrollen und die Ellbogen Richtung Knie ziehen.', 'Langsam wieder aufrollen.'],
      achte: 'Die Hüfte bleibt still – die Bewegung kommt aus dem Bauch, nicht aus den Armen.', leichter: 'Weniger Gewicht', schwerer: 'Langsamer aufrollen' },
  ];
  U.push(...U_V43);
  const BY = Object.fromEntries(U.map((u) => [u.id, u]));
  /* ---------- Ort, Ziel, Dauer, Vorlagen, Cardio ---------- */
  // Ort → erlaubte Geräte; ein Widerstandsband kann man zuhause dazunehmen
  const ORT = { studio: ['Fitnessstudio', ['gym', 'hantel', 'band', 'ohne'], 'i-dumbbell'], hanteln: ['Zuhause mit Hanteln', ['hantel', 'ohne'], 'i-dumbbell'], ohne: ['Zuhause ohne Geräte', ['ohne'], 'i-body'] };
  // Je Erfahrungsstufe (Einsteiger, Grundlagen, Fortgeschritten, Erfahren, Leistungssport): Sätze pro Übung (saetze),
  // Wiederholungen für Grundübungen (wdhN) und kleine Übungen (wdhIso), Wiederholungen in Reserve (rirN).
  // Höhere Stufen: mehr Sätze und näher an die Grenze – für Muskelaufbau zählt die Nähe zum Muskelversagen
  // (Refalo et al., Sports Med 2023), für Maximalkraft reichen 1–2 Wiederholungen Reserve (Grgic et al., Sports Med 2022).
  const ZIEL = {
    aufbau: { name: 'Muskelaufbau', kurz: '6–15 Wiederholungen nah an der Grenze', saetze: [2, 3, 3, 4, 4], wdhN: ['10–15', '8–12', '8–12', '6–10', '6–10'], wdhIso: ['12–15', '10–15', '10–15', '10–15', '10–20'], rirN: [[2, 3], [1, 3], [1, 2], [0, 2], [0, 1]], wdh: '8–12', pause: '2 min', pisoTxt: '60–90 s', halten: '30–45 s', sek: 40, p: 120, piso: 75, rir: 'Hör auf, wenn noch 1–3 saubere Wiederholungen gingen', text: 'Mittelschwer bis kurz vor die Grenze. Pro Muskel bringen etwa 10 Sätze pro Woche am meisten – verteilt auf zwei Einheiten.', quelle: 'Schoenfeld et al., J Sports Sci 2017 · Schoenfeld et al., Sports Med 2016 · Zourdos et al., J Strength Cond Res 2016' },
    kraft: { name: 'Maximalkraft', kurz: '2–8 Wiederholungen, schwer', saetze: [2, 3, 4, 5, 5], wdhN: ['6–8', '5–6', '4–6', '3–5', '2–4'], wdhIso: ['10–12', '8–12', '8–12', '8–10', '6–10'], rirN: [[3, 3], [2, 3], [1, 2], [1, 2], [1, 2]], wdh: '3–6', pause: '2–3 min', pisoTxt: '90 s', halten: '20–30 s', sek: 25, p: 150, piso: 90, rir: 'Schwer, aber jede Wiederholung sauber – 1–2 bleiben in Reserve', text: 'Wenige schwere Wiederholungen und lange Pausen machen dich stärker, ohne viel Masse aufzubauen. Für Ausdauersportler die beste Form: bessere Lauf- und Radökonomie.', quelle: 'ACSM Position Stand, Med Sci Sports Exerc 2009 · Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Grgic et al., Sports Med 2018' },
    ausdauer: { name: 'Kraftausdauer', kurz: '15–25 Wiederholungen als Zirkel', saetze: [2, 2, 3, 3, 4], wdhN: ['15–20', '15–20', '15–20', '15–25', '15–25'], rirN: [[3, 4], [2, 4], [2, 3], [1, 3], [1, 2]], wdh: '15–20', pause: '1–2 min nach jeder Runde', pisoTxt: '', halten: '45–60 s', sek: 45, p: 40, piso: 40, zirkel: true, rir: 'Zügig, aber sauber – 2–4 Wiederholungen bleiben in Reserve', text: 'Als Zirkel: alle Übungen nacheinander, nach jeder Runde 1–2 min Pause. Auch leichte Gewichte bauen Muskeln auf, wenn du nah an die Grenze gehst.', quelle: 'ACSM Position Stand, Med Sci Sports Exerc 2009 · Schoenfeld et al., J Strength Cond Res 2017' },
    power: { name: 'Schnellkraft', kurz: '2–5 Wiederholungen, explosiv', saetze: [2, 3, 4, 4, 5], wdhN: ['3–5', '3–5', '3–5', '2–4', '2–4'], rirN: [[3, 4], [3, 4], [2, 3], [2, 3], [2, 3]], wdh: '3–5', pause: '2–3 min', pisoTxt: '90 s', halten: '20 s', sek: 15, p: 150, piso: 90, rir: 'Jede Wiederholung so schnell wie möglich – aufhören, sobald es langsamer wird', text: 'Schnelle Bewegungen mit voller Erholung machen dich spritziger beim Laufen, Springen und Antreten.', quelle: 'ACSM Position Stand, Med Sci Sports Exerc 2009 · Beattie et al., Sports Med 2014' },
    stabil: { name: 'Stabilität & Prävention', kurz: '10–15 Wiederholungen, langsam', saetze: [2, 2, 3, 3, 3], wdhN: ['10–15', '10–15', '10–15', '12–15', '12–15'], rirN: [[3, 4], [3, 4], [2, 3], [2, 3], [2, 3]], wdh: '10–15', pause: '45–60 s', pisoTxt: '45 s', halten: '30–40 s', sek: 45, p: 50, piso: 45, rir: 'Langsam und kontrolliert – 3 s nach unten', text: 'Technik vor Gewicht. Kraft- und Stabilitätstraining senkt Sportverletzungen deutlich – mehr als Dehnen.', quelle: 'Lauersen et al., Br J Sports Med 2014' },
  };
  const DAUER = [20, 30, 45, 60, 75, 90];
  // Erfahrung mit Krafttraining: fünf Stufen (ACSM 2009 unterscheidet Anfänger, Fortgeschrittene und sehr Erfahrene)
  const NIVEAU = [
    ['einsteiger', 'Einsteiger', 'Neu oder nach langer Pause: Technik lernen, das Gewicht kommt später.'],
    ['grundlagen', 'Grundlagen', 'Seit einigen Monaten dabei: Die Grundübungen sitzen langsam.'],
    ['fortgeschritten', 'Fortgeschritten', '1–3 Jahre regelmäßig: Du kennst deine Gewichte und steigerst dich.'],
    ['erfahren', 'Erfahren', 'Mehrere Jahre: Du trainierst nah an deiner Grenze, mit schweren Grundübungen.'],
    ['leistung', 'Leistungssport', 'Kraftsport oder Bodybuilding auf hohem Niveau: viel Volumen, bis an die Grenze.'],
  ];
  const NIV_ALT = { profi: 'erfahren' }; // Auswahl aus der Vorversion
  // id, Name auf dem Knopf, Muskeln, Titel des Workouts
  const VORLAGEN = [
    ['beine', 'Leg Day', ['quad', 'beinbeuger', 'gesaess', 'waden', 'adduktoren', 'abduktoren'], 'Leg Day'],
    ['push', 'Push', ['brust', 'schulter', 'trizeps'], 'Push Day'],
    ['pull', 'Pull', ['lat', 'ruecken_oben', 'bizeps', 'unterarm'], 'Pull Day'],
    ['oben', 'Oberkörper', ['brust', 'schulter', 'lat', 'ruecken_oben', 'bizeps', 'trizeps'], 'Oberkörper'],
    ['ganz', 'Ganzkörper', ['quad', 'gesaess', 'beinbeuger', 'brust', 'lat', 'ruecken_oben', 'schulter', 'bauch'], 'Ganzkörper'],
    ['core', 'Rumpf', ['bauch', 'seite', 'ruecken_unten'], 'Rumpf'],
    ['laeufer', 'Für Läufer', ['waden', 'schienbein', 'gesaess', 'abduktoren', 'beinbeuger', 'quad', 'bauch'], 'Kraft für Läufer'],
    ['schwimmer', 'Für Schwimmer', ['lat', 'ruecken_oben', 'schulter', 'trizeps', 'bauch'], 'Kraft für Schwimmer'],
    ['rad', 'Für Radfahrer', ['quad', 'gesaess', 'beinbeuger', 'ruecken_unten', 'bauch', 'seite', 'nacken'], 'Kraft für Radfahrer'], // Version 27: Rumpf seitlich und Nacken für die Aeroposition
    // Version 24: drei Vorlagen mehr – Hüfte stabil (Knie und Rücken danken es), Haltung fürs Zeitfahrrad und den Schreibtisch, Arme
    ['huefte', 'Hüfte & Gesäß', ['gesaess', 'abduktoren', 'adduktoren', 'beinbeuger', 'ruecken_unten'], 'Hüfte & Gesäß'],
    ['haltung', 'Haltung', ['nacken', 'ruecken_oben', 'schulter', 'ruecken_unten', 'seite'], 'Haltung & Rücken'],
    ['arme', 'Arme', ['bizeps', 'trizeps', 'unterarm', 'schulter'], 'Arm Day'],
  ];
  /* ---------- Version 27: Programme und Nutzen im Wettkampf ----------
     Programme sind fertige Workouts mit festem Ziel – ein Tipp, und das Workout steht. Jedes Workout zeigt, wofür es im Rennen
     gut ist: ein Dreieck aus Schwimmen, Rad und Laufen und zwei bis vier konkrete Sätze mit Studie. */
  const PROGRAMME = [
    { id: 'laeufer', name: 'Läufer-Kraft', ziel: 'kraft', kurz: 'Waden, Hüfte und Rumpf – stabil und ökonomisch laufen' },
    { id: 'rad', name: 'Rad & Aero', ziel: 'kraft', kurz: 'Druck aufs Pedal und eine Aeroposition, die hält' },
    { id: 'schwimmer', name: 'Schwimm-Zug', ziel: 'kraft', kurz: 'Latissimus, Trizeps und Schulter für eine kräftige Zugphase' },
    { id: 'maximal', name: 'Maximalkraft', ziel: 'kraft', muskeln: ['quad', 'gesaess', 'beinbeuger', 'lat', 'ruecken_oben', 'brust', 'bauch'], kurz: 'Schwere Grundübungen, wenige Wiederholungen – Ökonomie ohne Masse' },
    { id: 'explosiv', name: 'Explosiv & Sprung', ziel: 'power', muskeln: ['quad', 'gesaess', 'beinbeuger', 'waden'], kurz: 'Sprünge und schnelle Sätze für Rückfederung und Antritt' },
    { id: 'stabil', name: 'Rumpf & Stabilität', ziel: 'stabil', muskeln: ['bauch', 'seite', 'ruecken_unten', 'gesaess', 'abduktoren'], kurz: 'Wasserlage, Aero und ein ruhiges Becken – in allen drei Disziplinen' },
    { id: 'schutz', name: 'Verletzungsschutz', ziel: 'stabil', muskeln: ['schienbein', 'waden', 'abduktoren', 'gesaess', 'schulter', 'ruecken_oben'], kurz: 'Schienbein, Achillessehne, Knie und Schulter robust machen' },
    { id: 'zirkel', name: 'Kraftausdauer-Zirkel', ziel: 'ausdauer', muskeln: ['quad', 'gesaess', 'waden', 'lat', 'bauch', 'seite'], kurz: 'Zügig im Zirkel – Kraft, die bis in die späte Rennphase hält' },
    { id: 'haltung', name: 'Haltung & Nacken', ziel: 'stabil', kurz: 'Für lange Stunden auf dem Aufsatz und am Schreibtisch' },
    { id: 'ganz', name: 'Ganzkörper', ziel: 'aufbau', kurz: 'Alle großen Muskeln in einer Einheit – der solide Einstieg' },
  ];
  PROGRAMME.forEach((p) => { const v = VORLAGEN.find((x) => x[0] === p.id); if (v && !p.muskeln) p.muskeln = v[2]; });
  const DREI = [['schwimmen', 'Schwimmen', 'blue', 'i-swim'], ['rad', 'Rad', 'orange', 'i-bike'], ['laufen', 'Laufen', 'mint', 'i-run']];
  const DFARBE = { schwimmen: 'blue', rad: 'orange', laufen: 'mint', alle: 'purple', kaum: 'fg3' }, DNAME = { schwimmen: 'Schwimmen', rad: 'Rad', laufen: 'Laufen', alle: 'Alle drei', kaum: 'Im Rennen' }; // Version 46: kaum
  // Wie stark trägt ein Muskel Schwimmen, Rad und Laufen? (0–1, nach Bewegungsanalysen der drei Disziplinen)
  const NUTZ = {
    brust: [0.5, 0.1, 0.05], schulter: [0.9, 0.3, 0.15], bizeps: [0.3, 0.1, 0.05], trizeps: [0.8, 0.3, 0.1], unterarm: [0.35, 0.2, 0], bauch: [0.7, 0.8, 0.7], seite: [0.7, 0.6, 0.6],
    nacken: [0.3, 0.75, 0.1], ruecken_oben: [0.8, 0.6, 0.3], lat: [1, 0.2, 0.1], ruecken_unten: [0.5, 0.9, 0.6], gesaess: [0.2, 0.9, 1], abduktoren: [0.1, 0.5, 0.9],
    adduktoren: [0.25, 0.3, 0.5], quad: [0.1, 1, 0.7], beinbeuger: [0.05, 0.6, 0.8], waden: [0.05, 0.4, 1], schienbein: [0, 0.1, 0.9],
  };
  // Was es im Rennen bringt – je Disziplin, mit Studie
  const NUTZEN = [
    { d: 'rad', m: ['bauch', 'seite', 'ruecken_unten', 'nacken', 'ruecken_oben'], titel: 'Aeroposition halten', text: 'Rumpf, unterer Rücken und Nacken tragen den Oberkörper – du bleibst länger tief und ruhig auf dem Aufsatz, und jede Minute in Aero spart Watt.', q: 'Hibbs et al., Sports Med 2008' },
    { d: 'rad', m: ['quad', 'gesaess', 'beinbeuger'], titel: 'Mehr Druck aufs Pedal', text: 'Kräftige Hüft- und Kniestrecker treten dieselben Watt mit weniger Anstrengung – besonders bergauf und in der zweiten Hälfte.', q: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014' },
    { d: 'laufen', m: ['waden', 'schienbein'], titel: 'Federnder Schritt', text: 'Waden und Achillessehne speichern bei jedem Bodenkontakt Energie – weniger Aufwand pro Kilometer und ein robusteres Schienbein.', q: 'Barnes & Kilding, Sports Med 2015' },
    { d: 'laufen', m: ['gesaess', 'abduktoren', 'adduktoren'], titel: 'Knie in der Spur', text: 'Gesäß und Hüfte halten Becken und Knie stabil – auch auf den letzten Kilometern, wenn der Laufstil sonst zerfällt.', q: 'Lauersen et al., Br J Sports Med 2014' }, // Version 46: mit Oberschenkel innen
    { d: 'laufen', m: ['quad', 'beinbeuger'], titel: 'Beine nach dem Rad', text: 'Kräftige Oberschenkel fangen Aufprall und Gefälle ab – nach dem Radfahren bleibt der Schritt länger sauber.', q: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014' },
    { d: 'laufen', typ: 'plyo', titel: 'Laufökonomie', text: 'Sprünge machen Sehnen steifer und Nerven schneller: mehr Rückfederung, dieselbe Pace mit weniger Sauerstoff.', q: 'Saunders et al., J Strength Cond Res 2006' },
    { d: 'schwimmen', m: ['lat', 'trizeps', 'schulter', 'ruecken_oben'], titel: 'Kräftige Zugphase', text: 'Latissimus, Trizeps und hintere Schulter liefern den Vortrieb – der Zug bleibt lang, auch auf den letzten Metern.', q: 'Crowley et al., Sports Med 2017' },
    { d: 'schwimmen', m: ['brust'], gewicht: 0.9, titel: 'Druck im Armzug', text: 'Die Brust zieht den Arm zusammen mit dem Latissimus unter dem Körper nach hinten – aus dieser Bewegung kommt der größte Vortrieb im Wasser.', q: 'Wanivenhaus et al., Sports Health 2012' }, // Version 46
    { d: 'schwimmen', m: ['bauch', 'seite', 'ruecken_unten'], titel: 'Hohe Wasserlage', text: 'Ein fester Rumpf hält Hüfte und Beine oben – weniger Wasserwiderstand bei gleicher Kraft.', q: 'Hibbs et al., Sports Med 2008' },
    { d: 'schwimmen', m: ['schulter', 'ruecken_oben'], gewicht: 0.8, titel: 'Gesunde Schultern', text: 'Kräftige Schulterblatt- und Rotatorenmuskeln schützen bei Tausenden Zügen pro Einheit vor der Schwimmerschulter.', q: 'Lauersen et al., Br J Sports Med 2014' },
    { d: 'alle', ziel: 'kraft', titel: 'Ökonomie ohne Masse', text: 'Schwere Sätze mit wenigen Wiederholungen verbessern Lauf- und Radökonomie, ohne dass du schwerer wirst.', q: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014' },
    { d: 'alle', ziel: 'stabil', titel: 'Weniger Verletzungen', text: 'Krafttraining senkte Sportverletzungen in Studien auf weniger als ein Drittel – mehr gesunde Trainingswochen bis zum Rennen.', q: 'Lauersen et al., Br J Sports Med 2014' },
    { d: 'alle', ziel: 'power', titel: 'Antritt und Tempowechsel', text: 'Explosive Sätze verbessern die Kraftentwicklung – für Start, Überholen und jeden Tempowechsel.', q: 'Beattie et al., Sports Med 2014' },
    { d: 'alle', ziel: 'ausdauer', titel: 'Kraft, die lange hält', text: 'Viele Wiederholungen mit kurzen Pausen: Die Muskeln halten Form und Technik länger, wenn das Rennen lang wird.', q: 'ACSM Position Stand, Med Sci Sports Exerc 2009' },
    { d: 'alle', ziel: 'aufbau', titel: 'Fundament für alles', text: 'Mehr Muskelmasse an den richtigen Stellen trägt die Belastung aus Schwimmen, Rad und Laufen – und macht schwere Sätze später möglich.', q: 'Schoenfeld et al., J Sports Sci 2017' },
  ];
  // id: Name, Symbol, wo (studio | zuhause), Tipp
  const CARDIO = {
    stair: ['Stairmaster', 'i-stairs', 'studio', 'Aufrecht bleiben und das Geländer nur leicht berühren – sonst tragen die Arme dein Gewicht.'],
    laufband: ['Laufband', 'i-run', 'studio', '1 % Steigung einstellen – das gleicht den fehlenden Fahrtwind aus (Jones & Doust, J Sports Sci 1996).'],
    ergo: ['Rad-Ergometer', 'i-bike', 'studio', 'Trittfrequenz 80–95, Widerstand so, dass es zur Belastung passt.'],
    rudern: ['Rudergerät', 'i-rower', 'studio', 'Erst die Beine, dann der Rücken, zuletzt die Arme – zurück in umgekehrter Reihenfolge.'],
    cross: ['Crosstrainer', 'i-cross', 'studio', 'Gelenkschonend – gut nach schweren Beinen oder bei Laufbeschwerden.'],
    steigung: ['Gehen bergauf', 'i-walk', 'studio', '10–12 % Steigung bei 4–6 km/h: hoher Puls bei wenig Stoßbelastung.'],
    laufen: ['Laufen', 'i-run', 'zuhause', 'Locker bleiben – nach schweren Beinen ist Radfahren meist die schonendere Wahl.'],
    rad: ['Rad fahren', 'i-bike', 'zuhause', 'Kleiner Gang, hohe Trittfrequenz – lockert die Beine nach dem Training.'],
    seil: ['Seilspringen', 'i-rope', 'zuhause', 'Kurze Bodenkontakte auf den Fußballen – trainiert nebenbei Waden und Sprunggelenke.'],
    treppe: ['Treppen steigen', 'i-stairs', 'zuhause', 'Jede Stufe einzeln und aufrecht – nach unten gehen ist die Pause.'],
    gehen: ['Zügig gehen', 'i-walk', 'zuhause', 'So zügig, dass du ins Schwitzen kommst, aber noch reden kannst.'],
  };
  const PHASE = { // Ziel passend zur Trainingsphase aus der Saison
    vorbereitung: ['aufbau', 'Vorbereitung: 2–3 × Kraft pro Woche – Platz für Muskelaufbau und saubere Technik.'],
    grundlage: ['kraft', 'Grundlage: Maximalkraft 2 × pro Woche – schwere Sätze mit wenigen Wiederholungen verbessern die Ökonomie in Lauf und Rad.'],
    aufbau: ['kraft', 'Aufbau: Kraft 1 × pro Woche halten – schwer, aber mit wenig Umfang, damit die Ausdauer-Einheiten frisch bleiben.'],
    spitze: ['power', 'Spitze: 1 × pro Woche kurz und knackig – wenige schwere oder explosive Sätze.'],
    taper: ['stabil', 'Tapering: schwere Kraft etwa 10 Tage vor dem Rennen beenden – nur noch Mobilität und leichte Aktivierung.'],
    rennwoche: ['stabil', 'Rennwoche: keine Kraft mehr, nur Mobilität.'],
    rennen: ['stabil', 'Renntag – heute nur lockern.'],
    uebergang: ['aufbau', 'Übergang: lockere Ganzkörper-Einheiten nach Lust.'],
  };
  // Höchstens so viele harte Sätze pro Muskel und Einheit – darüber bringt es kaum noch etwas; Erfahrene vertragen mehr
  const KAPPE = (m, niv) => (GROSS.has(m) ? [8, 10, 10, 12, 12] : [6, 8, 8, 10, 10])[niv == null ? 2 : niv];

  /* ---------- Zustand ---------- */
  // satz: heutige Sätze { d: Datum, Übung: [[kg, Wdh., geschafft 0/1], …] } · zuletzt: letztes Mal je Übung [Datum, kg, Wdh., kg, Wdh., …]
  const STD = { muskeln: [], ort: 'studio', band: false, ziel: null, dauer: 45, niveau: null, cardio: null, cform: 'locker', cmin: 15, seed: 1, tausch: {}, bib: 'alle', vorlage: null, log: [], max: {}, satz: {}, zuletzt: {}, eigene: [], eigenAktiv: null, zug: null, zugR: null, zugT: {} }; // Version 27: eigene Workouts · Version 46: Schwerpunkt (Wunsch je Disziplin und seine Tausche)
  let G = null, kontoVon = null, saveT = null, offenSpeichern = false, offen = null, figurNr = 0, listeOffen = false, tauschFokus = null; // Version 43: Fokus nach „Andere Übung“
  function laden() {
    const uid = A().konto().uid || null;
    if (uid !== kontoVon) { kontoVon = uid; G = null; offenSpeichern = false; }
    if (G && offenSpeichern) return; // eigene Änderung ist unterwegs – nicht mit älterem Stand überschreiben
    const r = (A().state.rechner || {}).gym;
    G = Object.assign({}, STD, r && typeof r === 'object' ? JSON.parse(JSON.stringify(r)) : altesGym());
    G.muskeln = Object.keys(MUSKELN).filter((m) => (G.muskeln || []).includes(m));
    if (!ORT[G.ort]) G.ort = 'studio';
    if (G.ziel && !ZIEL[G.ziel]) G.ziel = null;
    if (!DAUER.includes(G.dauer)) G.dauer = 45;
    if (G.cardio && !CARDIO[G.cardio]) G.cardio = null;
    if (![10, 15, 20, 30].includes(G.cmin)) G.cmin = 15;
    if (!G.tausch || typeof G.tausch !== 'object' || Array.isArray(G.tausch)) G.tausch = {};
    if (!Array.isArray(G.log)) G.log = [];
    if (G.niveau && NIV_ALT[G.niveau]) G.niveau = NIV_ALT[G.niveau];
    if (G.niveau && !NIVEAU.some((n) => n[0] === G.niveau)) G.niveau = null;
    if (!G.max || typeof G.max !== 'object' || Array.isArray(G.max)) G.max = {};
    Object.keys(G.max).forEach((id) => { const m = G.max[id]; if (!BY[id] || !m || !(+m.e > 0) || !MESS[m.a]) delete G.max[id]; });
    const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    if (!obj(G.satz)) G.satz = {};
    if (!obj(G.zuletzt)) G.zuletzt = {};
    if (!obj(G.verlauf)) G.verlauf = {};
    if (!obj(G.pr)) G.pr = {};
    if (!obj(G.vol)) G.vol = {}; // Version 13: Volumen je Übung [Datum, Volumen, …] der letzten 12 Einheiten
    if (!obj(G.zugT)) G.zugT = {}; // Version 46
    G.zug = Array.isArray(G.zug) && G.zug.length === 3 && G.zug.some((x) => typeof x === 'number') ? G.zug.map((x) => (typeof x === 'number' && isFinite(x) ? Math.max(0, Math.min(1, x)) : null)) : null;
    G.zugR = G.zug && Array.isArray(G.zugR) && G.zugR.length === 3 ? G.zugR.map((x) => (x > 0 ? 1 : x < 0 ? -1 : 0)) : null; // gemeinte Richtung je Ecke
    if (G.deload && !(obj(G.deload) && /^\d{4}-\d\d-\d\d$/.test(G.deload.bis || ''))) G.deload = null;
    Object.keys(G.zuletzt).forEach((id) => { const z = G.zuletzt[id]; if (!BY[id] || !Array.isArray(z) || !/^\d{4}-\d\d-\d\d$/.test(z[0]) || z.length < 3) delete G.zuletzt[id]; });
    if (G.satz.d && G.satz.d !== heuteIso()) { archivieren(); speichern(); }
  }
  // Ein neuer Tag: die geschafften Sätze von damals werden zu „Letztes Mal“
  function archivieren() {
    const d = G.satz.d;
    if (/^\d{4}-\d\d-\d\d$/.test(d || '')) verlaufEintragen(d);
    if (/^\d{4}-\d\d-\d\d$/.test(d || '')) Object.entries(G.satz).forEach(([id, R]) => {
      if (id === 'd' || !BY[id] || !Array.isArray(R)) return;
      const ok = R.filter((r) => Array.isArray(r) && r[2] && +r[1] > 0).slice(0, SATZ_MAX);
      if (ok.length) G.zuletzt[id] = [d].concat(...ok.map((r) => [r[0] == null || !isFinite(+r[0]) ? null : +r[0], +r[1]]));
    });
    const ids = Object.keys(G.zuletzt);
    if (ids.length > 60) ids.sort((a, b) => String(G.zuletzt[a][0]).localeCompare(String(G.zuletzt[b][0]))).slice(0, ids.length - 60).forEach((id) => { delete G.zuletzt[id]; });
    G.satz = {};
  }
  function altesGym() { // Einstellungen der Vorversion (nur auf diesem Gerät gespeichert) übernehmen
    const o = S.speicher('tf:gym', null);
    if (!o || typeof o !== 'object') return {};
    const tag = { ganz: 'ganz', unten: 'beine', oben: 'oben', rumpf: 'core', lauf: 'laeufer', athletik: 'beine' }[o.tag];
    const v = VORLAGEN.find((x) => x[0] === tag);
    return { muskeln: v ? v[2].slice() : [], vorlage: v ? v[0] : null, ort: { gym: 'studio', hantel: 'hanteln', ohne: 'ohne' }[o.geraet] || 'studio', ziel: ZIEL[o.fokus] ? o.fokus : o.tag === 'athletik' ? 'power' : null, dauer: DAUER.includes(o.dauer) ? o.dauer : 45 };
  }
  function speichern(sofort) {
    const kopie = () => JSON.parse(JSON.stringify(G));
    A().setRechner(Object.assign({}, A().state.rechner || {}, { gym: kopie() }));
    clearTimeout(saveT); offenSpeichern = true;
    saveT = setTimeout(() => A().api('POST', '/api/rechner', { gym: kopie() })
      .then(() => { offenSpeichern = false; })
      .catch(() => { offenSpeichern = false; }), sofort ? 0 : 600);
  }
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const nivIdx = () => { const v0 = G.niveau || (athlet().wissen === 'einsteiger' ? 'einsteiger' : athlet().wissen === 'profi' ? 'erfahren' : 'fortgeschritten'); const v = NIV_ALT[v0] || v0; return Math.max(0, NIVEAU.findIndex((n) => n[0] === v)); };
  const phaseJetzt = () => { const s = (rowsOf('saison') || [])[0]; return s && PHASE[s.phase] ? s.phase : null; };
  const zielJetzt = () => G.ziel || (phaseJetzt() ? PHASE[phaseJetzt()][0] : 'aufbau');
  const geraete = () => ORT[G.ort][1].concat(G.band && G.ort !== 'studio' ? ['band'] : []);
  const ortName = () => ORT[G.ort][0] + (G.band && G.ort !== 'studio' ? ' + Band' : '');
  function zufall(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const vorlageVon = (M) => { const s = [...M].sort().join(); return VORLAGEN.find((x) => x[2].slice().sort().join() === s) || null; };
  const heuteIso = () => localDate(); // Version 10: das Datum deines Geräts – nicht der letzte Garmin-Tag (der hinkt morgens oft hinterher)

  /* ---------- Workout zusammenstellen ----------
     Gierige Auswahl: jede Runde die Übung, die die noch offenen gewählten Muskeln am besten trifft (Hauptmuskel 4,
     mitarbeitend 1, fremde Hauptmuskeln kosten), passend zu Ziel, Erfahrung und Ort – bis die Zeit voll ist.
     Reihenfolge nach ACSM 2009: explosiv → mehrgelenkig (große Muskeln zuerst) → eingelenkig → Rumpf. */
  const RANG = { plyo: 0, mehr: 1, iso: 2, rumpf: 3 };
  const BEINE = new Set(['quad', 'gesaess', 'beinbeuger', 'waden', 'adduktoren', 'abduktoren', 'schienbein']);
  const LADBAR = new Set(['bulgarian', 'ausfall', 'stepup', 'einbein_kreuz', 'pistol_box', 'seitausfall', 'klimmzug', 'dips']); // Körpergewicht-Übungen, die man mit Hanteln schwerer macht
  const spanne = (w) => { const m = /(\d+)(?:\s*[–-]\s*(\d+))?/.exec(String(w || '')); return m ? [+m[1], +(m[2] || m[1])] : [8, 12]; };
  function vorgabe(u, z, Z, satz, niv) {
    if (niv == null) niv = 2;
    const seite = u.einseitig ? ' je Seite' : '', x2 = u.einseitig ? 2 : 1, rir = (Z.rirN && Z.rirN[niv]) || [1, 3];
    // Erfahrene ohne Studio: Körpergewichtsübungen gleich in der schweren Variante
    const geht = (t) => G.ort !== 'ohne' || !/hantel|gewicht/i.test(t) || /rucksack|wasserflasche/i.test(t); // ohne Geräte nur Varianten ohne Hanteln
    const schwer = niv >= 3 && u.art === 'koerper' && G.ort !== 'studio' && u.stufe <= 2 && u.typ !== 'rumpf' && u.schwerer && geht(u.schwerer) ? u.schwerer : null;
    const fertig = (o) => { const sp = spanne(o.wdh); return Object.assign(o, { rir, wdhLo: sp[0], wdhHi: sp[1], schwer }); };
    const wN = Z.wdhN ? Z.wdhN[niv] : Z.wdh;
    if (Z.zirkel) {
      const w = u.art === 'halten' ? Z.halten : u.typ === 'plyo' ? '10–15' : u.id === 'nordic' ? '5–8' : wN;
      return fertig({ saetze: satz, wdh: w, text: w + seite + ' pro Runde', pause: null, ps: 15, sek: Z.sek * (u.einseitig ? 1.6 : 1), halten: u.art === 'halten', plyo: u.typ === 'plyo' });
    }
    let s = satz, w = wN, p = Z.pause, ps = Z.p;
    if (u.typ === 'iso') {
      ps = Z.piso; p = Z.pisoTxt; if (Z.wdhIso) w = Z.wdhIso[niv];
      if (z === 'kraft' || z === 'power') { s = Math.max(2, satz - 1); w = u.ziel.includes('schulter') ? '10–15' : u.ziel.includes('waden') ? '6–10' : Z.wdhIso ? Z.wdhIso[niv] : '8–12'; }
    }
    if (u.typ === 'rumpf') { s = Math.max(2, Math.min(3, satz)); w = '10–15'; ps = 50; p = '45–60 s'; }
    if (u.ziel.includes('schienbein')) { s = 2; w = '15–20'; ps = 30; p = '30 s'; } // Fuß und Schienbein: leicht, viele Wiederholungen
    if (u.art === 'halten' && u.typ === 'iso') { ps = Math.min(ps, 40); p = ps <= 30 ? '30 s' : '30–45 s'; }
    if (u.art === 'halten') { const h = u.typ === 'rumpf' ? (niv >= 3 ? '45–60 s' : '30–45 s') : Z.halten; return fertig({ saetze: s, wdh: h, halten: true, text: s + ' × ' + h + seite, pause: p, ps, sek: 40 * x2 }); }
    if (u.typ === 'plyo') { const k = Math.min(niv >= 3 ? 5 : 4, s), pw = z === 'power', w2 = pw ? '3–5' : '6–10'; return fertig({ saetze: k, wdh: w2, plyo: true, text: k + ' × ' + w2 + seite + ', explosiv', pause: pw ? '2 min' : '60 s', ps: pw ? 120 : 60, sek: 15 * x2 }); }
    if (u.id === 'nordic') w = z === 'kraft' || z === 'power' ? '3–5' : '4–6';
    if (u.art === 'koerper' && u.typ === 'mehr' && z === 'kraft' && !(LADBAR.has(u.id) && geraete().some((g) => g === 'gym' || g === 'hantel'))) w = '5–8 in der schwersten Variante';
    // Zuhause ohne Geräte: Ab „Fortgeschritten“ reicht das Körpergewicht nur mit langsamem Tempo und vielen Wiederholungen bis
    // kurz vor die Grenze – auch so wachsen Muskeln (Schoenfeld et al., J Strength Cond Res 2017)
    const tempo = G.ort === 'ohne' && niv >= 2 && u.typ === 'mehr' && u.id !== 'nordic' && (z === 'aufbau' || z === 'kraft') && !/schwersten/.test(w);
    if (tempo) { w = niv >= 3 ? '15–25' : '12–20'; ps = Math.min(ps, 90); p = '60–90 s'; }
    const o = fertig({ saetze: s, wdh: w, text: s + ' × ' + w + seite + (tempo ? ', 3 s runter' : ''), pause: p, ps, sek: Z.sek * x2 * (tempo ? 1.4 : 1), tempo });
    if (tempo) o.schwer = null; // das langsame Tempo ist hier schon die schwere Variante
    return o;
  }

  /* ---------- Kraftwerte: geschätztes Maximum je Übung → Gewicht für jede Vorgabe ----------
     Aus „Gewicht × Wiederholungen“ (plus Wiederholungen in Reserve) schätzt die App dein Maximum für eine Wiederholung
     (1RM) – Mittel der Formeln von Epley und Brzycki, die bis etwa 10 Wiederholungen am genauesten sind (LeSuer et al. 1997).
     Umgekehrt ergibt sich daraus das Gewicht für jede Vorgabe: Zielwiederholungen + Reserve = Wiederholungen bis zur Grenze. */
  const MESS = { kg: 'Gewicht', zusatz: 'Zusatzgewicht', wdh: 'Körpergewicht' };
  const JE_HAND = new Set(['kh_bank', 'schulterdruecken', 'schraegbank', 'seitheben', 'reverse_fly', 'bizeps_curl', 'hammer_curl', 'kh_fly', 'rudern_kh', 'bulgarian', 'ausfall', 'stepup', 'einbein_kreuz', 'seitausfall', 'schraegbank_curl', 'konzentrations_curl', 'kickback']); // Version 43: neue Kurzhantel-Übungen
  const ZUSATZ = new Set(['klimmzug', 'dips']);
  const pct = (n) => { n = Math.max(1, n); return n <= 1 ? 1 : n <= 12 ? (1 / (1 + n / 30) + (37 - n) / 36) / 2 : 1 / (1 + n / 30); }; // Anteil vom Maximum bei n Wiederholungen bis zur Grenze
  // Wie lässt sich eine Übung messen? kg: Hantel, Gerät, Kabel · zusatz: Körpergewicht plus Zusatzgewicht · wdh: nur Wiederholungen
  function messarten(u) {
    if (!u) return [];
    if (u.art === 'kraft') return ['kg'];
    if (ZUSATZ.has(u.id)) return ['zusatz'];
    if (u.art === 'koerper' && (u.typ === 'mehr' || u.typ === 'iso') && !u.geraet.every((g) => g === 'band')) return LADBAR.has(u.id) ? ['wdh', 'kg'] : ['wdh'];
    return [];
  }
  const koerperKg = () => { const k = +athlet().gewicht_ref_kg; return k > 30 ? k : 75; };
  function maxAus(art, kg, wdh, rir) { // Maximum aus einem Satz: kg (1RM), zusatz (1RM inkl. Körpergewicht), wdh (Wiederholungen bis zur Grenze)
    const n = Math.max(1, Math.round(+wdh || 0) + Math.max(0, Math.round(+rir || 0)));
    if (art === 'wdh') return n;
    const last = art === 'zusatz' ? koerperKg() + (+kg || 0) : +kg || 0;
    return last > 0 ? last / pct(n) : 0;
  }
  const kgTxt = (x) => nf(x, x % 1 ? 1 : 0) + ' kg';
  function runden(kg, u) { // Hantelscheiben: 2,5 kg · Kurzhanteln: 1 kg bis 10 kg, darüber 2 kg
    const kh = JE_HAND.has(u.id) || u.id === 'goblet';
    const st = kh ? (kg < 10 ? 1 : 2) : 2.5;
    return Math.max(0, Math.round(kg / st) * st);
  }
  function lastVorgabe(u, v, niv) {
    const m = G.max[u.id];
    if (!m || !(+m.e > 0) || v.halten || v.plyo) return null;
    const n = v.wdhHi + v.rir[0], hand = JE_HAND.has(u.id) ? ' je Hand' : '';
    if (m.a === 'kg') {
      const kg = runden(m.e * pct(n), u);
      if (!(kg > 0)) return null;
      return { art: 'kg', kg, txt: kgTxt(kg) + hand, lang: kgTxt(kg) + hand + ' – etwa ' + Math.round(100 * pct(n)) + ' % deines geschätzten Maximums (' + kgTxt(Math.round(m.e * 2) / 2) + ')' };
    }
    if (m.a === 'zusatz') {
      const bw = koerperKg(), ziel = m.e * pct(n) - bw;
      if (ziel >= 1.25) { const kg = runden(ziel, u); return { art: 'zusatz', kg, txt: '+' + kgTxt(kg), lang: 'mit ' + kgTxt(kg) + ' Zusatzgewicht (Gürtel oder Hantel zwischen den Füßen)' }; }
      const moeglich = Math.floor(30 * (m.e / bw - 1)), wdh = Math.max(1, Math.min(v.wdhHi, moeglich - v.rir[0]));
      return { art: 'zusatz', kg: 0, wdh, txt: wdh + ' Wdh. ohne Zusatz', lang: 'ohne Zusatzgewicht, je ' + wdh + ' Wiederholungen' + (moeglich - v.rir[0] < v.wdhLo ? ' – reicht das nicht, mit Widerstandsband als Hilfe' : '') };
    }
    if (m.a === 'wdh') {
      const ziel = Math.max(1, Math.round(m.e) - v.rir[0]);
      const schwerer = m.e > 30 && niv >= 2 && u.schwerer;
      return { art: 'wdh', wdh: ziel, txt: 'je ' + ziel + ' Wdh.', lang: 'je etwa ' + ziel + ' Wiederholungen' + (schwerer ? ' – du schaffst über 30, nimm lieber die schwere Variante: ' + u.schwerer : '') };
    }
    return null;
  }

  function workout(ohneTausch) { // Version 46: ohneTausch = der Vorschlag, wie er ohne eigene Änderungen wäre
    const EA = eigenAktiv(); if (EA) return eigenMitTausch(EA, ohneTausch); // Version 27; Version 43: auch hier „Andere Übung“
    const TA = ohneTausch ? {} : G.tausch, ZT = ohneTausch ? {} : G.zugT || {};
    const M = new Set(G.muskeln), z = zielJetzt(), Z = ZIEL[z], niv = nivIdx(), erlaubt = geraete();
    if (!M.size) return null;
    const kurz = G.dauer <= 30, warm = kurz ? 5 : 7, kuehl = kurz ? 2 : 4;
    const frei = (G.dauer - warm - kuehl) * 60;
    let satz = Z.saetze[niv];
    const zeitVon = (v) => (Z.zirkel ? v.saetze * (v.sek + 15) : v.saetze * (v.sek + v.ps) + 45);
    const probe = { einseitig: false, typ: 'mehr', art: 'kraft', ziel: [], id: '' };
    const nUm = (s) => frei / zeitVon(vorgabe(probe, z, Z, s, niv)); // wie viele Grundübungen passen ungefähr
    if (!Z.zirkel && satz >= 4 && nUm(satz) < Math.min(M.size + 1, 6)) satz -= 1; // viele Muskeln: lieber mehr Übungen mit je einem Satz weniger
    if (!Z.zirkel && satz > 2 && nUm(satz) < 2.6) satz -= 1; // kurze Einheiten: lieber ein Satz weniger als nur eine Übung
    if (deloadAktiv() || sanftAktiv()) satz = Math.max(Z.zirkel ? 1 : 2, Math.round(satz * 0.6)); // Deload- oder sanfte Woche: weniger Sätze, gleiches Gewicht
    const rnd = zufall(G.seed * 7919 + niv * 31 + G.dauer);
    const kand = U.filter((u) => u.typ !== 'mobil' && u.geraet.some((g) => erlaubt.includes(g)) && (G.ort !== 'studio' || u.geraet.includes('gym'))
      && u.stufe <= [2, 3, 3, 3, 3][niv] && (u.typ !== 'plyo' || z === 'power' || (z === 'ausdauer' && niv > 0)));
    const jit = new Map(kand.map((u) => [u.id, rnd()]));
    // Soll-Sätze je Muskel für diese Einheit: verfügbare Sätze nach Größe verteilt, gedeckelt
    const gew = (m) => (GROSS.has(m) ? 1.5 : 1), summe = [...M].reduce((x, m) => x + gew(m), 0);
    const saetzeGesamt = 1.6 * (Z.zirkel ? satz * Math.min(10, frei / (satz * (Z.sek + 15))) : nUm(satz) * satz); // 1,6: eine Übung trifft im Schnitt mehr als einen gewählten Muskel
    const soll = {}; M.forEach((m) => { soll[m] = Math.min(KAPPE(m, niv), Math.max(2, (saetzeGesamt * gew(m)) / summe)); });
    const satzM = {}, muster = {};
    const offenAnteil = (m) => Math.max(0, Math.min(1, (soll[m] - (satzM[m] || 0)) / soll[m]));
    function wert(u, v) {
      const haupt = u.ziel.filter((m) => M.has(m));
      if (!haupt.length || haupt.every((m) => (satzM[m] || 0) + v.saetze > KAPPE(m, niv) + 0.5)) return -1;
      let w = 0;
      // gewählte Hauptmuskeln: der wichtigste zählt voll, weitere weniger – sonst gewinnt immer die Übung mit den meisten Muskeln
      u.ziel.filter((m) => M.has(m)).map((m) => 0.4 + 3.6 * offenAnteil(m)).sort((a, b) => b - a).forEach((x, i) => { w += x * [1, 0.75, 0.4, 0.3][Math.min(i, 3)]; });
      u.ziel.forEach((m) => { if (!M.has(m)) w -= 1.8; });
      u.mit.forEach((m) => { if (M.has(m)) w += offenAnteil(m); });
      if (u.typ === 'mehr' && ['kraft', 'aufbau', 'power'].includes(z)) w += 0.8;
      if (u.typ === 'plyo' && z === 'power') w += 1.5;
      w += (u.eignung || ALLE).includes(z) ? 0.6 : -0.8;
      // Stufe: Einsteiger leichte Übungen, Erfahrene anspruchsvolle und mit Zusatzlast – einfache Körpergewichtsübungen sind dann zu leicht
      const leicht = u.stufe === 1 && u.art === 'koerper' && u.typ !== 'rumpf';
      if (niv === 0) w += u.stufe === 1 ? 0.5 : -0.4;
      else if (niv === 1) w += u.stufe === 3 ? -0.2 : 0.1;
      else if (niv === 2) w += u.stufe >= 2 ? 0.3 : 0;
      else if (niv === 3) w += (u.stufe >= 2 ? 0.6 : 0) - (leicht ? (G.ort === 'ohne' ? 0.3 : 0.9) : 0);
      else w += (u.stufe === 3 ? 0.9 : u.stufe === 2 ? 0.4 : 0) - (leicht ? (G.ort === 'ohne' ? 0.5 : 1.3) : 0);
      if (niv >= 3 && G.ort === 'studio' && u.typ === 'mehr' && u.art === 'kraft' && u.geraet.includes('gym')) w += (niv === 4 ? 0.9 : 0.6) + (u.stufe === 3 ? 0.5 : 0); // Erfahrene im Studio: schwere Grundübungen mit Langhantel und Gerät
      if (G.max[u.id]) w += niv >= 1 ? 2 : 1.2; // Übungen mit eingetragenem Kraftwert klar bevorzugen – dafür gibt es ein genaues Gewicht (stärker als der Zufall)
      w -= (muster[u.muster] || 0) * 0.7;
      const zk = u.ziel.slice().sort().join(); if (liste.some((x) => x.ziel.slice().sort().join() === zk)) w -= 1.2; // keine zwei fast gleichen Übungen
      if (G.ort === 'studio' && u.geraet.length === 4 && (u.typ === 'mehr' || u.typ === 'iso')) w -= 1.5; // im Studio lieber Geräte und Gewichte
      if (G.ort === 'hanteln' && !u.geraet.includes('hantel') && (u.typ === 'mehr' || u.typ === 'iso')) w -= 0.6;
      return w + jit.get(u.id) * 1.4;
    }
    const liste = [], genutzt = new Set();
    let zeit = Z.zirkel ? (satz - 1) * 90 : 0;
    const maxN = Z.zirkel ? 10 : 8;
    while (liste.length < maxN) {
      const r = kand.filter((u) => !genutzt.has(u.id)).map((u) => { const v = vorgabe(u, z, Z, satz, niv); return [u, v, wert(u, v)]; }).filter((x) => x[2] > 0.4).sort((a, b) => b[2] - a[2]);
      const pick = r.find(([, v]) => !liste.length || zeit + zeitVon(v) <= frei + 90);
      if (!pick) break;
      const [u, v] = pick;
      genutzt.add(u.id); muster[u.muster] = (muster[u.muster] || 0) + 1; zeit += zeitVon(v);
      u.ziel.forEach((m) => { if (M.has(m)) satzM[m] = (satzM[m] || 0) + v.saetze; });
      u.mit.forEach((m) => { if (M.has(m)) satzM[m] = (satzM[m] || 0) + v.saetze / 2; });
      liste.push(u);
    }
    // „Andere Übung“ (Version 43): getauscht wird gezielt auf die gewählte Übung (Id); keine doppelt.
    // Die alte Speicherform (eine Zahl = n-te Alternative) bleibt lesbar.
    const belegt = new Set(liste.map((u) => u.id));
    const fertig = liste.map((u) => {
      const t = TA[u.id];
      let ersatz = null;
      if (typeof t === 'string') { const x = BY[t]; if (x && x.id !== u.id && !belegt.has(x.id)) ersatz = x; }
      else if (t > 0) { const alt = alternativen(u, kand, M, belegt); if (alt.length) ersatz = alt[(t - 1) % alt.length]; }
      if (ersatz) belegt.add(ersatz.id);
      return { u: ersatz || u, orig: u.id, zug: !!(ersatz && ZT[u.id] === ersatz.id) }; // zug: dieser Tausch kommt vom verschobenen Schwerpunkt
    });
    const klein = (u) => (u.ziel.some((m) => GROSS.has(m)) ? 0 : 1);
    fertig.sort((a, b) => RANG[a.u.typ] - RANG[b.u.typ] || klein(a.u) - klein(b.u));
    if (Z.zirkel) { // im Zirkel Beine und Oberkörper abwechseln, Rumpf zum Schluss
      const unten = (u) => u.ziel.some((m) => BEINE.has(m));
      const A1 = fertig.filter((f) => f.u.typ !== 'rumpf' && unten(f.u)), B1 = fertig.filter((f) => f.u.typ !== 'rumpf' && !unten(f.u)), C1 = fertig.filter((f) => f.u.typ === 'rumpf');
      const neu = []; for (let i = 0; i < Math.max(A1.length, B1.length); i++) { if (A1[i]) neu.push(A1[i]); if (B1[i]) neu.push(B1[i]); }
      fertig.splice(0, fertig.length, ...neu, ...C1);
    }
    fertig.forEach((f) => { f.v = vorgabe(f.u, z, Z, satz, niv); f.last = lastVorgabe(f.u, f.v, niv); });
    const saetze = {}; // Sätze je Muskel: Hauptmuskel ganz, mitarbeitend halb
    fertig.forEach(({ u, v }) => { u.ziel.forEach((m) => { saetze[m] = (saetze[m] || 0) + v.saetze; }); u.mit.forEach((m) => { saetze[m] = (saetze[m] || 0) + v.saetze / 2; }); });
    const haupt = fertig.reduce((x, f) => x + zeitVon(f.v), Z.zirkel ? (satz - 1) * 90 : 0);
    const mit = Object.keys(saetze).filter((m) => !M.has(m));
    const fehlt = [...M].filter((m) => !saetze[m]).map((m) => ({ m, ort: !kand.some((u) => u.ziel.includes(m)) }));
    return { z, Z, niv, satz, liste: fertig, saetze, mit, fehlt, warm, kuehl, minuten: Math.round(warm + haupt / 60 + kuehl), pool: kand, M };
  }
  function alternativen(u, kand, M, belegt) {
    const haupt = u.ziel.filter((m) => M.has(m));
    const treffer = (x) => x.ziel.filter((m) => haupt.includes(m)).length;
    return kand.filter((x) => !belegt.has(x.id) && treffer(x) > 0 && !x.ziel.some((m) => !M.has(m) && GROSS.has(m)))
      .sort((a, b) => treffer(b) - treffer(a) || (a.muster === u.muster ? 0 : 1) - (b.muster === u.muster ? 0 : 1) || (a.typ === u.typ ? 0 : 1) - (b.typ === u.typ ? 0 : 1) || a.name.localeCompare(b.name, 'de'));
  }

  /* ---------- Trainingstagebuch: Sätze pro Muskel in den letzten 7 Tagen ---------- */
  function woche() {
    const bis = heuteIso(), von = iso(toDay(bis) - 6 * DAY), s = {};
    const L = G.log.filter((e) => e && e.d >= von && e.d <= bis);
    L.forEach((e) => Object.entries(e.s || {}).forEach(([m, n]) => { if (MUSKELN[m]) s[m] = (s[m] || 0) + (+n || 0); }));
    return { L, s };
  }
  const stufeVon = (n) => (n >= 10 ? 3 : n >= 5 ? 2 : n > 0 ? 1 : 0);
  function eintragen(W, rpe) { // rpe: Anstrengung der ganzen Einheit 1–10 (Foster et al. 2001) – für Wochenlast und Lauf-Hinweis
    const s = {}; Object.entries(W.saetze).forEach(([m, n]) => { s[m] = Math.round(n * 2) / 2; });
    G.log = G.log.filter((e) => e && e.d >= iso(toDay(heuteIso()) - 40 * DAY));
    G.log.push(Object.assign({ d: heuteIso(), t: titelVon().slice(0, 40), min: W.minuten, z: W.z, s }, rpe >= 1 && rpe <= 10 ? { r: rpe } : {}));
    if (G.log.length > 30) G.log = G.log.slice(-30);
    const pr = G.satz.d === heuteIso() ? verlaufEintragen(heuteIso()) : []; // Version 10: Verlauf und Bestleistungen
    speichern(true);
    if (window.tfPlan && tfPlan.eigenAuto) tfPlan.eigenAuto('kraft'); // Version 16: eigene Kraft-Einheit von heute abhaken
    if (window.tfPlan && tfPlan.eigenAuto) tfPlan.eigenAuto('kraft'); // Version 16: eigene Kraft-Einheit von heute ist erledigt
    if (pr.length && window.tfSpiel && tfSpiel.auszeichnung) setTimeout(() => pr.slice(0, 3).forEach((x) => tfSpiel.auszeichnung({ art: 'kraft', id: 'pr:' + x.id + ':' + heuteIso(), titel: 'Neue Bestleistung', name: x.u.name, wert: (x.b.art === 'wdh' ? x.b.wdh + ' Wdh.' : (x.b.art === 'zusatz' ? (x.b.kg > 0 ? '+' + kgTxt(x.b.kg) : 'ohne Zusatz') : kgTxt(x.b.kg)) + ' × ' + x.b.wdh), sub: x.b.art === 'wdh' ? 'Bisher bestes Ergebnis' : 'Geschätztes Maximum ' + maxText({ a: x.b.art, e: x.e }).replace('≈ ', '') + (x.alt > 0 ? ' – vorher ' + maxText({ a: x.b.art, e: x.alt }).replace('≈ ', '') : ''), datum: heuteIso() })), 900);
  }

  /* ---------- Körperkarte ---------- */
  // an: kräftig (gewählt) · mit: hell (arbeitet mit) · heat: Sätze je Muskel → Stufe 0–3
  /* Version 24: Tiefe für die Körperfigur – jeder Muskel bekommt Licht von oben (Verlauf je Fläche), die Figur steht
     auf einem weichen Bodenschatten. Farben kommen aus dem Stylesheet (hell/dunkel), damit nichts doppelt gepflegt wird. */
  function koerperTiefe(s, gid) {
    const defs = svg('defs', null, s);
    [['m', '--gk-m-hell', '--gk-m-tief'], ['n', '--gk-n-hell', '--gk-n-tief']].forEach(([k, a, b]) => {
      const lg = svg('linearGradient', { id: gid + '-' + k, x1: 0, y1: 0, x2: 0.35, y2: 1 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(' + a + ')' }, lg); svg('stop', { offset: 1, style: 'stop-color:var(' + b + ')' }, lg);
    });
    const rg = svg('radialGradient', { id: gid + '-boden', cx: 0.5, cy: 0.5, r: 0.5 }, defs);
    svg('stop', { offset: 0, style: 'stop-color:var(--gk-schatten)' }, rg); svg('stop', { offset: 1, style: 'stop-color:var(--gk-schatten);stop-opacity:0' }, rg);
    svg('ellipse', { cx: 100, cy: 426, rx: 50, ry: 6, fill: 'url(#' + gid + '-boden)', class: 'tf-gk-boden' }, s);
  }
  function zustandVerlauf(s, gid, farbe) { // eine Zustandsfarbe mit Licht von oben – einmal je Figur und Farbe
    const id = gid + '-z-' + farbe;
    if (!s.querySelector('#' + id)) {
      const defs = s.querySelector('defs') || svg('defs', null, s), lg = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0.35, y2: 1 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:color-mix(in srgb, var(--tf-' + farbe + ') 62%, #fff)' }, lg); svg('stop', { offset: 1, style: 'stop-color:var(--tf-' + farbe + ')' }, lg);
    }
    return 'url(#' + id + ')';
  }
  function figur(ansicht, o) {
    const gid = 'tf-gk-g' + (++figurNr);
    const s = svg('svg', { viewBox: '24 4 152 428', class: 'tf-gk-svg', 'aria-hidden': 'true', focusable: 'false' });
    koerperTiefe(s, gid); s.setAttribute('data-gid', gid);
    const lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 1, y2: 1 }, s.querySelector('defs'));
    svg('stop', { offset: 0, 'stop-color': '#cf8cff' }, lg); svg('stop', { offset: 1, 'stop-color': '#8a3fdc' }, lg);
    const spiegel = 'matrix(-1 0 0 1 200 0)';
    const L = svg('g', null, s), R = svg('g', { transform: spiegel }, s), Mi = svg('g', null, s);
    const hL = svg('g', null), hR = svg('g', { transform: spiegel });
    KOERPER[ansicht].forEach((t) => {
      (t.mitte ? [Mi] : [L, R]).forEach((g) => {
        if (!t.m) { svg('path', { d: t.d, class: 'tf-gk-n', style: 'fill:url(#' + gid + '-n)' }, g); return; }
        const p = svg('path', { d: t.d, class: 'tf-gk-m', 'data-m': t.m }, g);
        faerben(p, t.m, o, gid);
        if (o.klick && t.klein) svg('path', { d: t.d, class: 'tf-gk-hit', 'data-m': t.m }, g === R ? hR : hL); // größere Trefferfläche
        if (t.linien && g !== R) svg('path', { d: t.linien, class: 'tf-gk-l' }, g);
      });
    });
    if (o.klick) { s.append(hL, hR); s.addEventListener('click', (e) => { const p = e.target.closest('[data-m]'); if (p) umschalten(p.getAttribute('data-m')); }); }
    s.setAttribute('data-gid', gid);
    return s;
  }
  function faerben(p, m, o, gid) {
    const h = o.heat ? stufeVon(o.heat[m] || 0) : 0, an = !!(o.an && o.an.has(m)), mit = !an && !!(o.mit && o.mit.has(m));
    p.setAttribute('class', 'tf-gk-m' + (an ? ' an' : mit ? ' mit' : '') + (h ? ' h' + h : ''));
    p.style.fill = an || h === 3 ? 'url(#' + gid + ')' : !mit && !h ? 'url(#' + gid + '-m)' : ''; // Inline-Stil schlägt die Grundfarbe aus dem Stylesheet (Version 24: neutral mit Licht von oben)
  }
  function koerper(o) {
    return el('div', { class: 'tf-gk' + (o.klein ? ' tf-gk-klein' : '') + (o.klick ? ' tf-gk-klick' : '') },
      el('figure', null, figur('vorne', o), el('figcaption', { text: 'Vorne' })),
      el('figure', null, figur('hinten', o), el('figcaption', { text: 'Hinten' })));
  }
  function umschalten(m) {
    const S2 = new Set(G.muskeln), dazu = !S2.has(m);
    if (dazu) S2.add(m); else S2.delete(m);
    G.muskeln = Object.keys(MUSKELN).filter((k) => S2.has(k)); tauschLeeren(true); G.eigenAktiv = null;
    const v = vorlageVon(S2); G.vorlage = v ? v[0] : null;
    speichern();
    const box = $('#karte-gym-koerper');
    if (!box || T.route() !== 'training/gym') { neu(); return; }
    // ohne Neuaufbau: die Karte bleibt stehen, nur Farben, Auswahl und Zusammenfassung ändern sich
    $$('.tf-gk-svg', box).forEach((s) => $$('.tf-gk-m', s).forEach((p) => faerben(p, p.getAttribute('data-m'), { an: S2 }, s.getAttribute('data-gid'))));
    let ruhig = false; try { ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* egal */ }
    if (dazu && !ruhig) $$('.tf-gk-m[data-m="' + m + '"]', box).forEach((p) => { p.classList.remove('pop'); void p.getBoundingClientRect(); p.classList.add('pop'); });
    $$('.tf-gym-vorlagen button', box).forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === G.vorlage)));
    const a = $('#gym-auswahl'); if (a) a.replaceWith(auswahlTeil());
    const l = $('#gym-los'); if (l) l.replaceWith(losTeil());
  }
  function neu() { const y = window.scrollY; T.neu(); window.scrollTo(0, y); } // über die App neu zeichnen – so kommen auch die (i)-Erklärungen wieder dazu

  /* ---------- Darstellung ---------- */
  function ansicht() { const r = T.route(); return r === 'training/gym/workout' ? 'workout' : r === 'training/gym/uebungen' ? 'bib' : r === 'training/gym/eigen' ? 'eigen' : 'wahl'; }
  function renderGym() {
    const box = $('#gym-box'); if (!box) return;
    laden();
    figurNr = 0;
    const a = ansicht();
    if (a === 'workout') { const W = workout(); if (!(W && W.liste.length)) { T.geh('training/gym', { ersetzen: true }); return; } }
    box.replaceChildren(...(a === 'workout' ? workoutAnsicht() : a === 'bib' ? [bibliothek()] : a === 'eigen' ? eigenAnsicht() : wahlAnsicht()).filter(Boolean));
  }
  function chips(items, cur, on, o) {
    o = o || {};
    const box = el('div', { class: 'tf-chipset ' + (o.cls || ''), role: 'group', 'aria-label': o.label || null });
    items.forEach(([v, l, icon]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, icon ? svgIco(icon) : null, (icon ? ' ' : '') + l);
      b.addEventListener('click', () => on(v)); box.appendChild(b);
    });
    return box;
  }
  function seg(items, cur, on, label) {
    const box = el('div', { class: 'tf-seg tf-gym-seg', role: 'group', 'aria-label': label || null });
    items.forEach(([v, l]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, l); b.addEventListener('click', () => on(v)); box.appendChild(b); });
    return box;
  }
  const setze = (fn) => (v) => { fn(v); tauschLeeren(false); speichern(); neu(); };
  const feld = (titel, ...k) => el('div', { class: 'tf-field' }, el('span', { text: titel }), ...k);

  function auswahlTeil() {
    const M = new Set(G.muskeln);
    const box = el('div', { class: 'tf-gym-gewaehlt', id: 'gym-auswahl', 'aria-live': 'polite' });
    if (!M.size) box.appendChild(el('p', { class: 'tf-gym-leer', text: 'Tippe auf die Muskeln, die du heute trainieren willst – oder nimm oben eine Vorlage.' }));
    else {
      const L = el('div', { class: 'tf-gym-an' });
      G.muskeln.forEach((m) => { const b = el('button', { type: 'button', 'aria-label': MUSKELN[m] + ' abwählen' }, MUSKELN[m], el('span', { class: 'tf-gym-x', 'aria-hidden': 'true', text: '×' })); b.addEventListener('click', () => umschalten(m)); L.appendChild(b); });
      const x = el('button', { type: 'button', class: 'tf-gym-reset' }, 'Alle abwählen');
      x.addEventListener('click', () => { G.muskeln = []; G.vorlage = null; tauschLeeren(true); G.eigenAktiv = null; speichern(); neu(); });
      L.appendChild(x);
      box.appendChild(L);
    }
    const d = el('details', { class: 'tf-gym-alle' }, el('summary', null, 'Muskeln als Liste'));
    d.appendChild(el('div', { class: 'tf-chipset', role: 'group', 'aria-label': 'Muskeln' }, ...Object.entries(MUSKELN).map(([m, name]) => { const b = el('button', { type: 'button', 'aria-pressed': String(M.has(m)) }, name); b.addEventListener('click', () => umschalten(m)); return b; })));
    if (listeOffen) d.open = true;
    d.addEventListener('toggle', () => { listeOffen = d.open; });
    box.appendChild(d);
    return box;
  }
  function losTeil() {
    const W = workout();
    const box = el('div', { class: 'tf-gym-los', id: 'gym-los' });
    if (!W) { box.hidden = true; return box; }
    if (!W.liste.length) { box.classList.add('leer'); box.append(el('span', { class: 'tf-gym-los-t' }, el('b', { text: 'Keine passende Übung' }), el('small', { text: 'Für diese Muskeln brauchst du Geräte – wähle einen anderen Ort' }))); return box; }
    const min = W.minuten + (G.cardio ? G.cmin : 0);
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-play'), ' Workout zeigen');
    los.addEventListener('click', () => T.geh('training/gym/workout'));
    const E = einschaetzung(W); // Version 46: die Leiste sagt, wofür die Auswahl gut ist – und folgt jedem Antippen
    box.append(dreieck(E.d), el('span', { class: 'tf-gym-los-t' }, el('b', { text: W.liste.length + ' Übungen · ' + min + ' min' }), el('small', { class: 'tf-gym-los-e', text: E.titel + (G.cardio ? ' + ' + CARDIO[G.cardio][0] : '') })), los);
    return box;
  }
  function wahlAnsicht() {
    const M = new Set(G.muskeln);
    // 1. Muskeln am Körper
    const c1 = el('article', { class: 'tf-card tf-gym-koerper', id: 'karte-gym-koerper' });
    c1.appendChild(el('div', { class: 'tf-gym-kopf' }, el('h2', { text: 'Was trainierst du heute?' }), el('p', { text: 'Tippe die Muskeln an – vorne und hinten.' })));
    const vl = el('div', { class: 'tf-chipset tf-gym-vorlagen', role: 'group', 'aria-label': 'Vorlagen' });
    VORLAGEN.forEach(([id, name, L]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(G.vorlage === id), 'data-v': id }, name);
      b.addEventListener('click', () => { const weg = G.vorlage === id; G.muskeln = weg ? [] : Object.keys(MUSKELN).filter((m) => L.includes(m)); G.vorlage = weg ? null : id; tauschLeeren(true); G.eigenAktiv = null; speichern(); neu(); });
      vl.appendChild(b);
    });
    c1.append(vl, koerper({ an: M, klick: true }), auswahlTeil());
    // 2. Einstellungen
    const z = zielJetzt(), ph = phaseJetzt(), H = heute(), niv = nivIdx();
    const c2 = karte({ farbe: 'indigo', icon: 'i-tool', titel: 'Wo, wie und wie lange?', id: 'karte-gym-einstellung' });
    const ortF = feld('Wo trainierst du?', chips(Object.entries(ORT).map(([k, o]) => [k, o[0], o[2]]), G.ort, setze((v) => { G.ort = v; if (G.cardio && CARDIO[G.cardio][2] !== (v === 'studio' ? 'studio' : 'zuhause')) G.cardio = null; }), { label: 'Ort' }));
    if (G.ort !== 'studio') {
      const cb = el('input', { type: 'checkbox', checked: !!G.band });
      cb.addEventListener('change', () => { G.band = cb.checked; tauschLeeren(false); speichern(); neu(); });
      ortF.appendChild(el('label', { class: 'tf-gym-check' }, cb, ' Ich habe ein Widerstandsband'));
    }
    const zielF = feld('Ziel', chips(Object.entries(ZIEL).map(([k, o]) => [k, o.name]), z, setze((v) => { G.ziel = v; }), { label: 'Ziel' }),
      el('small', { class: 'tf-ich-hint', text: ZIEL[z].kurz + (G.ziel ? '' : ph ? ' – passend zu deiner Trainingsphase' : '') + '. ' + ZIEL[z].text }));
    const f = el('div', { class: 'tf-gym-wahl' }, ortF, zielF,
      feld('Dauer in Minuten', seg(DAUER.map((d) => [d, String(d)]), G.dauer, setze((v) => { G.dauer = v; }), 'Dauer in Minuten')),
      feld('Erfahrung mit Krafttraining', chips(NIVEAU.map(([k, l]) => [k, l]), NIVEAU[niv][0], setze((v) => { G.niveau = v; }), { label: 'Erfahrung', cls: 'tf-gym-stufen' }),
        el('small', { class: 'tf-ich-hint', text: NIVEAU[niv][2] })));
    // Cardio danach
    const wo = G.ort === 'studio' ? 'studio' : 'zuhause';
    const cl = [[null, 'Kein Cardio']].concat(Object.entries(CARDIO).filter(([, c]) => c[2] === wo).map(([k, c]) => [k, c[0], c[1]]));
    const cf = feld('Cardio danach?', chips(cl, G.cardio, setze((v) => { G.cardio = v; }), { label: 'Cardio' }));
    if (G.cardio) cf.append(el('div', { class: 'tf-gym-2 tf-gym-cwahl' }, seg([['locker', 'Locker'], ['intervall', 'Intervalle']], G.cform, setze((v) => { G.cform = v; }), 'Art'), seg([10, 15, 20, 30].map((m) => [m, m + ' min']), G.cmin, setze((v) => { G.cmin = v; }), 'Cardio-Dauer')));
    f.appendChild(cf);
    c2.appendChild(f);
    // Hinweise aus Saison und Tune
    const hin = el('div', { class: 'tf-gym-hinweise' });
    if (ph) {
      const p = el('p', { class: 'tf-gym-hinweis' }, dot('blue'), el('span', { text: PHASE[ph][1] + (G.ziel && G.ziel !== PHASE[ph][0] ? ' Passend wäre „' + ZIEL[PHASE[ph][0]].name + '“.' : '') }));
      if (G.ziel && G.ziel !== PHASE[ph][0]) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Übernehmen'); b.addEventListener('click', setze(() => { G.ziel = null; })); p.lastChild.append(' ', b); }
      hin.appendChild(p);
    }
    if (H && H.ampel === 'rot') {
      const p = el('p', { class: 'tf-gym-hinweis' }, dot('red'), el('span', { text: 'Dein Tune ist heute niedrig. Schwer trainieren bringt jetzt wenig – besser „Stabilität & Prävention“ oder eine ruhige Einheit Pilates oder Yoga.' }));
      const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Zu Pilates & Yoga'); b.addEventListener('click', () => T.geh('training/flow')); p.lastChild.append(' ', b);
      hin.appendChild(p);
    } else if (H && H.ampel === 'gelb' && (z === 'kraft' || z === 'power')) hin.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('yellow'), el('span', { text: 'Tune mittel: Schwer geht – mach bei jeder Übung einen Satz weniger.' })));
    const dl = deloadHinweis(); if (dl) hin.appendChild(dl);
    if (hin.childElementCount) c2.appendChild(hin);
    const bib = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-gym-bibknopf' }, svgIco('i-list'), ' Alle ' + U.length + ' Übungen mit Anleitung');
    bib.addEventListener('click', () => T.geh('training/gym/uebungen'));
    c2.appendChild(bib);
    const tab = tabJetzt(); // Version 27: Programme, nach Muskeln oder eigene Workouts
    const teile = tab === 'programme' ? [programmeKarte(false), c2, kraftKarte()] : tab === 'eigene' ? [eigeneKarte(), kraftKarte()] : [c1, c2, kraftKarte()];
    const w = wocheKarte(); if (w) teile.push(w);
    return [modusLeiste(tab), el('div', { class: 'tf-grid' }, ...teile), tab === 'muskeln' || (tab === 'eigene' && G.eigenAktiv) ? losTeil() : null];
  }
  /* =====================================================================
     Version 27: Nutzen im Wettkampf, Programme, eigene Workouts
     ===================================================================== */
  const wort = (x) => (x >= 0.6 ? 'stark' : x >= 0.35 ? 'mittel' : x > 0.12 ? 'etwas' : 'kaum');
  const istSprung = (u) => u.typ === 'plyo' && u.muster === 'plyo'; // echte Sprünge. Der Kettlebell-Swing läuft explosiv, ist aber kein Sprung – für ihn gilt die Aussage zur Laufökonomie nicht
  function dWerte(saetze, plyo) { // { Muskel: Sätze } → [Schwimmen, Rad, Laufen] je 0–1 (Version 46: einzeln, die Suche beim Schwerpunkt braucht nur das)
    let sum = 0; const d = [0, 0, 0];
    for (const m in saetze) { const w = NUTZ[m], n = saetze[m]; if (!w || !(n > 0)) continue; sum += n; d[0] += n * w[0]; d[1] += n * w[1]; d[2] += n * w[2]; }
    if (sum) { d[0] /= sum; d[1] /= sum; d[2] /= sum; }
    if (plyo) d[2] = Math.min(1, d[2] + 0.15);
    return { d, sum };
  }
  // Version 46: Gilt keine der Aussagen zu den Muskeln, steht hier ehrlich, dass die Einheit im Rennen wenig bewegt
  const WENIG = { d: 'kaum', titel: 'Kleiner Hebel', text: 'Diese Muskeln arbeiten beim Schwimmen, Radfahren und Laufen nur am Rand mit. Als Ausgleich sinnvoll – Tempo bringen eher Beine, Rumpf und die Zugmuskeln.', q: null };
  function nutzenVon(saetze, o) { // { Muskel: Sätze } → { d: [Schwimmen, Rad, Laufen] je 0–1, liste: Aussagen nach Gewicht }
    o = o || {}; saetze = saetze || {};
    const { d, sum } = dWerte(saetze, o.plyo);
    const di = (k) => DREI.findIndex((y) => y[0] === k);
    const zaehlt = (x) => !o.haupt || x.m.some((m) => o.haupt.has(m)); // Version 46: einer der Muskeln muss Hauptmuskel einer Übung sein – nicht bloß mitarbeiten
    const liste = NUTZEN.map((x) => ({ x, g: x.typ ? (o.plyo ? 0.9 : 0) : x.ziel ? (o.z === x.ziel ? 0.5 : 0) : (sum && zaehlt(x) ? x.m.reduce((a, m) => a + (saetze[m] || 0), 0) / sum : 0) * (x.gewicht || 1) * (1.2 * d[di(x.d)] + 0.4) }))
      .filter((y) => y.g > 0.12).sort((a, b) => b.g - a.g).map((y) => y.x);
    if (sum && (Math.max(...d) < 0.35 || !liste.some((x) => x.d !== 'alle'))) liste.unshift(WENIG);
    return { d, liste };
  }
  const fuerWen = (d) => { const st = staerkste(d); return st === 'alle drei' ? 'für alle drei Disziplinen' : 'vor allem ' + st; }; // Version 46
  function nutzenAuswahl(N, n) { // die stärkste Disziplin bekommt zwei Sätze, die nächsten je einen (ab „mittel“), der Satz zum Ziel zuletzt
    const alle = N.liste.find((x) => x.d === 'alle'), platz = n - (alle ? 1 : 0), out = N.liste.filter((x) => x.d === 'kaum'); // Version 46: „Kleiner Hebel“ steht vorn
    const reihe = DREI.map(([id], i) => ({ id, d: N.d[i] })).sort((a, b) => b.d - a.d);
    // Version 46: erst je eine Aussage für jede Disziplin, die mindestens „mittel“ profitiert (die stärkste immer) – so fehlt bei
    // einer Einheit für alle drei keine Disziplin; danach füllt die stärkste Disziplin auf, dann der Rest nach Gewicht
    reihe.forEach((r, k) => { const x = N.liste.find((y) => y.d === r.id); if (x && (k === 0 || r.d >= 0.35) && out.length < platz) out.push(x); });
    N.liste.forEach((x) => { if (out.length < platz && x.d === reihe[0].id && !out.includes(x)) out.push(x); });
    N.liste.forEach((x) => { if (out.length < platz && x.d !== 'alle' && !out.includes(x)) out.push(x); });
    out.sort((a, b) => (a.d === 'kaum' ? -1 : b.d === 'kaum' ? 1 : reihe.findIndex((r) => r.id === a.d) - reihe.findIndex((r) => r.id === b.d))); // nach Disziplin gruppiert, stärkste zuerst
    if (alle) out.push(alle);
    return out;
  }
  // Version 46: eine Regel für Titel, „vor allem …“ und die Farbe des Dreiecks – im Verhältnis statt in festen Abständen:
  // alle drei, wenn die schwächste Disziplin mindestens 70 % der stärksten erreicht; zwei, wenn die zweite mindestens 85 % erreicht
  function rangD(d) { const o = [0, 1, 2].sort((a, b) => d[b] - d[a]); return { o, n: d[o[2]] >= 0.7 * d[o[0]] ? 3 : d[o[1]] >= 0.85 * d[o[0]] ? 2 : 1 }; }
  function staerkste(d) {
    const { o, n } = rangD(d);
    return n === 3 ? 'alle drei' : n === 2 ? DREI[o[0]][1] + ' & ' + DREI[o[1]][1] : DREI[o[0]][1];
  }
  // Das Dreiklang-Dreieck: Schwimmen oben, Rad links unten, Laufen rechts unten – die Fläche zeigt auf einen Blick, wohin ein Workout wirkt
  function dreieck(d, gross, o) { // o.basis: Werte des Vorschlags als gestrichelte Linie (Version 46) · o.stumm: steckt in einem Knopf, der selbst spricht
    o = o || {};
    const W = gross ? 136 : 56, H = gross ? 124 : 52, R = gross ? 44 : 22, cx = W / 2, cy = gross ? 70 : 29;
    const st = staerkste(d), farbe = st === 'alle drei' ? 'purple' : DREI.find((x) => st.startsWith(x[1]))[2]; // die Fläche trägt die Farbe der Disziplin, für die das Workout am meisten tut
    const ecke = (i, f) => { const a = ((-90 - i * 120) * Math.PI) / 180; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
    const pfad = (P) => 'M' + P.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z';
    const sv = svg('svg', Object.assign({ viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tf-gym-drei' + (gross ? ' gross' : ''), style: '--d:var(--tf-' + farbe + ')' },
      o.stumm ? { 'aria-hidden': 'true', focusable: 'false' } : { role: 'img', 'aria-label': 'Nutzen – ' + DREI.map(([, n], i) => n + ': ' + wort(d[i])).join(', ') }));
    svg('path', { d: pfad([0, 1, 2].map((i) => ecke(i, 1))), class: 'tf-gym-drei-r' }, sv);
    svg('path', { d: pfad([0, 1, 2].map((i) => ecke(i, 0.5))), class: 'tf-gym-drei-m' }, sv);
    [0, 1, 2].forEach((i) => { const [x, y] = ecke(i, 1); svg('line', { x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1), class: 'tf-gym-drei-a' }, sv); });
    const P = [0, 1, 2].map((i) => ecke(i, Math.max(0.14, Math.min(1, d[i]))));
    svg('path', { d: pfad(P), class: 'tf-gym-drei-f' }, sv);
    if (o.basis) svg('path', { d: pfad([0, 1, 2].map((i) => ecke(i, Math.max(0.14, Math.min(1, o.basis[i]))))), class: 'tf-gym-drei-b' }, sv);
    P.forEach((p, i) => svg('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: gross ? 4.5 : 2.8, fill: 'var(--tf-' + DREI[i][2] + ')', stroke: 'var(--tf-card)', 'stroke-width': gross ? 2 : 1.2 }, sv));
    if (gross) DREI.forEach(([, n], i) => { const [x, y] = ecke(i, 1); const t = svg('text', { x: (i === 0 ? x : i === 1 ? x - 4 : x + 4).toFixed(1), y: (i === 0 ? y - 9 : y + 17).toFixed(1), 'text-anchor': i === 0 ? 'middle' : i === 1 ? 'start' : 'end', class: 'tf-gym-drei-t' }, sv); t.textContent = n; });
    return sv;
  }
  /* Version 46: der Block „Einschätzung“ (löst „Nutzen im Wettkampf“ ab) – Titel, ein Satz, Dreieck mit Balken, was sie bringt,
     worauf zu achten ist und was eigene Änderungen verschoben haben.
     o.basis: dieselbe Einheit ohne eigene Änderungen (für den Vergleich) · o.tauschN / o.vomSchwerpunkt: Zahl der Tausche ·
     o.schwerpunkt: öffnet „Schwerpunkt verschieben“ · o.status: Text zum verschobenen Schwerpunkt · o.zurueck: alles zurücknehmen */
  function einschaetzungBlock(W, o) {
    o = o || {};
    const E = einschaetzung(W), E0 = o.basis ? einschaetzung(o.basis) : null;
    const box = el('section', { class: 'tf-gym-nutzen tf-gym-es', id: o.id || null });
    if (!o.ohneKopf) box.appendChild(el('div', { class: 'tf-gym-nutzen-k' }, el('h3', { text: 'Einschätzung' })));
    box.append(el('p', { class: 'tf-gym-es-t', text: E.titel }), el('p', { class: 'tf-gym-es-s', text: E.satz }));
    const bild = dreieck(E.d, true, { basis: E0 ? E0.d : null, stumm: !!o.schwerpunkt });
    let dreiK = bild;
    if (o.schwerpunkt) {
      dreiK = el('button', { type: 'button', class: 'tf-gym-drei-k', 'aria-label': 'Schwerpunkt verschieben – jetzt: ' + DREI.map(([, n], i) => n + ' ' + wort(E.d[i])).join(', ') }, bild);
      dreiK.addEventListener('click', o.schwerpunkt);
    }
    const bars = el('div', { class: 'tf-gym-nb' }, ...DREI.map(([, n, f, ic], i) => el('div', { class: 'tf-gym-nbz', style: '--c:var(--tf-' + f + ')' },
      el('span', { class: 'tf-gym-nbn' }, svgIco(ic), el('span', { text: n })), el('span', { class: 'tf-gym-nbb' }, el('i', { style: 'width:' + Math.round(Math.max(4, Math.min(1, E.d[i]) * 100)) + '%' })), el('small', { text: wort(E.d[i]) }))));
    box.appendChild(el('div', { class: 'tf-gym-nutzen-g' }, dreiK, bars));
    if (o.schwerpunkt) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-gym-es-spk' }, svgIco('i-sliders'), ' Schwerpunkt verschieben');
      b.addEventListener('click', o.schwerpunkt);
      box.appendChild(el('div', { class: 'tf-gym-es-sp' }, b, o.status ? el('small', { text: o.status }) : null));
    }
    if (E0) { // was eigene Änderungen verschoben haben
      const zeilen = [el('b', { text: o.aeTitel || 'Durch deine Änderungen' }), el('p', { text: aenderungText(aenderungVon(E0, E), E) })];
      if (o.tauschN) {
        const n = o.tauschN, nz = o.vomSchwerpunkt || 0;
        const z = el('p', { class: 'tf-gym-es-ae-n' }, n + (n === 1 ? ' Übung getauscht' : ' Übungen getauscht') + (nz ? (nz === n ? ' – für den Schwerpunkt' : ', davon ' + nz + ' für den Schwerpunkt') : ''));
        if (o.zurueck) { const k = el('button', { type: 'button', class: 'tf-gym-link tf-gym-es-zur' }, 'Alle zurücknehmen'); k.addEventListener('click', o.zurueck); z.append(' · ', k); }
        zeilen.push(z);
      }
      const strich = svg('svg', { viewBox: '0 0 20 4', width: 20, height: 4, 'aria-hidden': 'true', focusable: 'false' }); svg('path', { d: 'M1,2 H19', class: 'tf-gym-drei-b' }, strich);
      zeilen.push(el('small', { class: 'tf-gym-es-leg' }, strich, el('span', { text: o.legende || 'Gestrichelt im Dreieck: der Vorschlag' })));
      box.appendChild(el('div', { class: 'tf-gym-es-ae' }, ...zeilen));
    }
    if (E.bringt.length) box.append(el('h4', { class: 'tf-gym-es-h4', text: 'Das bringt sie im Wettkampf' }),
      el('ul', { class: 'tf-gym-nl' }, ...E.bringt.map((x) => el('li', { style: '--c:var(--tf-' + DFARBE[x.d] + ')' }, el('b', null, el('i', { 'aria-hidden': 'true' }), DNAME[x.d] + ' · ' + x.titel), el('span', { text: x.text })))));
    if (E.achte.length) box.append(el('h4', { class: 'tf-gym-es-h4', text: 'Achte darauf' }),
      el('ul', { class: 'tf-gym-es-h' }, ...E.achte.map((h) => el('li', { style: '--c:var(--tf-' + h.farbe + ')', 'data-h': h.id }, el('span', { text: h.text })))));
    box.appendChild(el('p', { class: 'tf-gym-es-bau', text: E.bau.join(' · ') }));
    const Q = [...new Set(E.bringt.map((x) => x.q).concat(E.achte.map((h) => h.q)).filter(Boolean).flatMap((q) => q.split(' · ')))]; // jede Quelle einmal
    if (Q.length) box.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: Q.join(' · ') })));
    if (window.tfWissen && tfWissen.begriff && tfWissen.begriff('kraft_nutzen')) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'So liest du die Einschätzung'); b.addEventListener('click', () => T.geh('wissen/kraft_nutzen')); box.appendChild(b); }
    return box;
  }
  const nutzenW = (W) => nutzenVon(W.saetze, { z: W.z, plyo: W.liste.some((f) => istSprung(f.u)), haupt: new Set(W.liste.flatMap((f) => f.u.ziel)) });
  function uebNutzen(u) { // Disziplinen, für die diese Übung viel bringt
    const d = [0, 0, 0];
    u.ziel.forEach((m) => (NUTZ[m] || [0, 0, 0]).forEach((x, i) => { d[i] = Math.max(d[i], x); }));
    u.mit.forEach((m) => (NUTZ[m] || [0, 0, 0]).forEach((x, i) => { d[i] = Math.max(d[i], x * 0.6); }));
    if (istSprung(u)) d[2] = Math.max(d[2], 0.9);
    return DREI.map(([id, n, f], i) => ({ id, n, f, w: d[i] })).filter((x) => x.w >= 0.6).sort((a, b) => b.w - a.w);
  }
  function uebAussage(u) { // der eine Satz, was diese Übung im Rennen bringt
    if (istSprung(u)) return NUTZEN.find((x) => x.typ === 'plyo');
    const k = NUTZEN.filter((x) => x.m && x.m.some((m) => u.ziel.includes(m))); if (!k.length) return null;
    const w = (x) => Math.max(...u.ziel.map((m) => (x.m.includes(m) ? (NUTZ[m] || [0, 0, 0])[DREI.findIndex((y) => y[0] === x.d)] : 0)));
    return k.sort((a, b) => w(b) - w(a))[0];
  }
  function fuerChips(u) {
    const uN = uebNutzen(u); if (!uN.length || u.typ === 'mobil') return null;
    if (uN.length === 3) return el('span', { class: 'tf-gym-fuer', 'aria-label': 'Hilft beim Schwimmen, Radfahren und Laufen' }, el('i', { class: 'drei', text: 'alle drei' }));
    return el('span', { class: 'tf-gym-fuer', 'aria-label': 'Hilft beim ' + uN.map((x) => x.n).join(' und ') }, ...uN.map((x) => el('i', { style: '--c:var(--tf-' + x.f + ')', text: x.n })));
  }


  /* =====================================================================
     Version 46: Einschätzung der Einheit und Schwerpunkt verschieben
     Jede Zusammenstellung bekommt eine Aussage – zusammengesetzt aus dem, was wirklich in der Liste steht:
       Titel     wofür die Einheit im Rennen gut ist (acht Klassen aus den drei Disziplin-Werten)
       Satz      was für eine Einheit es ist: Art der Sätze (Ziel) · Art der Übungen · Körperregion · die zwei Muskeln mit den meisten Sätzen
       bringt    zwei bis vier Aussagen mit Studie (wie bisher) – oder ehrlich „Kleiner Hebel“
       achte     höchstens zwei Hinweise, nur wenn sie zutreffen (schwere Beine, nur Drücken, kleine Übungen bei Kraft, zu viele Sätze, …)
       aenderung was deine Tausche gegenüber dem Vorschlag verschoben haben
     Der Schwerpunkt lässt sich verschieben: ein Wunsch je Disziplin (0–1), erfüllt über gezielte Tausche – höchstens die
     Hälfte der Übungen, von Hand Getauschtes bleibt. Die Tausche stehen danach ganz normal in G.tausch (zurück geht je Übung).
     ===================================================================== */
  const REGION = { beine: [...BEINE], rumpf: ['bauch', 'seite', 'ruecken_unten'], oben: ['brust', 'schulter', 'trizeps', 'lat', 'ruecken_oben', 'bizeps', 'unterarm', 'nacken'] };
  const M_FUER = { seite: 'seitlichen Bauch', ruecken_oben: 'oberen Rücken', ruecken_unten: 'unteren Rücken', schienbein: 'Schienbein und Fuß' }; // Muskelnamen nach „für“
  const M_EINS = { brust: 'die Brust', schulter: 'die Schultern', bizeps: 'den Bizeps', trizeps: 'den Trizeps', unterarm: 'die Unterarme', bauch: 'den Bauch', seite: 'den seitlichen Bauch', nacken: 'den Nacken', ruecken_oben: 'den oberen Rücken',
    lat: 'den Latissimus', ruecken_unten: 'den unteren Rücken', gesaess: 'das Gesäß', abduktoren: 'die Hüfte außen', adduktoren: 'die Oberschenkel innen', quad: 'die Oberschenkel vorn', beinbeuger: 'die Oberschenkel hinten', waden: 'die Waden', schienbein: 'Schienbein und Fuß' }; // ein einzelner Muskel liest sich mit Artikel besser
  const mFuer = (m) => M_FUER[m] || MUSKELN[m];
  const undListe = (L) => (L.length <= 1 ? L.join('') : L.slice(0, -1).join(', ') + (L.some((x) => / (und|&) /.test(x)) ? ' sowie ' : ' und ') + L[L.length - 1]); // „Waden sowie Schienbein und Fuß“ statt zweimal „und“
  const M_REIHE = Object.keys(MUSKELN);
  const WOFUER = { '': 'Allgemeine Kraft', s: 'Kraft fürs Schwimmen', r: 'Kraft fürs Rad', l: 'Kraft fürs Laufen', sr: 'Kraft für Schwimmen und Rad', sl: 'Kraft für Schwimmen und Laufen', rl: 'Kraft für Rad und Laufen', srl: 'Kraft für alle drei Disziplinen' };
  function klasseVon(d) { // '' (kaum Nutzen im Rennen: keine Disziplin erreicht „mittel“) · s · r · l · sr · sl · rl · srl – dieselben Grenzen wie „vor allem …“
    const { o, n } = rangD(d);
    return d[o[0]] < 0.35 ? '' : o.slice(0, n).sort().map((i) => 'srl'[i]).join('');
  }
  function profilVon(W) { // Zahlen zur Liste: Sätze je Muskel und Region, Art der Übungen, einseitig, Drücken/Ziehen, Beine
    const sz = Object.entries(W.saetze).filter(([m, n]) => MUSKELN[m] && n > 0).sort((a, b) => b[1] - a[1] || M_REIHE.indexOf(a[0]) - M_REIHE.indexOf(b[0]));
    const sum = sz.reduce((a, x) => a + x[1], 0) || 1, reg = {}, haupt = {};
    W.liste.forEach(({ u, v }) => u.ziel.forEach((m) => { haupt[m] = (haupt[m] || 0) + (v.saetze || 0); }));
    const rang = sz.filter(([m]) => haupt[m]).map(([m, n]) => [m, haupt[m], n]).sort((a, b) => b[1] - a[1] || b[2] - a[2] || M_REIHE.indexOf(a[0]) - M_REIHE.indexOf(b[0])); // [Muskel, Sätze als Hauptmuskel, Sätze gesamt]
    Object.entries(REGION).forEach(([k, L]) => { reg[k] = sz.reduce((a, [m, n]) => a + (L.includes(m) ? n : 0), 0) / sum; });
    const typ = { mehr: 0, iso: 0, rumpf: 0, plyo: 0 }, zahl = { mehr: 0, iso: 0, rumpf: 0, plyo: 0 };
    let saetze = 0, eins = 0, druck = 0, zug = 0, beinS = 0, beinEins = 0, halten = 0, sprungS = 0, sprungN = 0;
    W.liste.forEach(({ u, v }) => {
      const n = v.saetze || 0; saetze += n;
      if (typ[u.typ] != null) { typ[u.typ] += n; zahl[u.typ]++; }
      if (istSprung(u)) { sprungS += n; sprungN++; }
      if (u.einseitig) eins++;
      if (u.art === 'halten') halten++;
      if (u.muster === 'druecken') druck += n;
      if (u.muster === 'ziehen') zug += n;
      if (u.typ !== 'rumpf' && u.ziel.some((m) => BEINE.has(m) && m !== 'schienbein')) { beinS += n; if (u.einseitig) beinEins++; }
    });
    Object.keys(typ).forEach((k) => { typ[k] = saetze ? typ[k] / saetze : 0; });
    return { sz, sum, reg, rang, typ, zahl, saetze, eins, druck, zug, beinS, beinEins, halten, sprung: saetze ? sprungS / saetze : 0, sprungN, n: W.liste.length };
  }
  const CHARAKTER = { kraft: 'Schwere Sätze', aufbau: 'Mittelschwere Sätze bis nah an die Grenze', ausdauer: 'Viele Wiederholungen im Zirkel', power: 'Schnelle, explosive Sätze', stabil: 'Langsame, kontrollierte Sätze' };
  function regionVon(L) { // Anteil der Sätze je Körperregion für einen Teil der Liste (Hauptmuskel ganz, mitarbeitend halb – wie bei der ganzen Einheit)
    const sz = {}; let sum = 0;
    L.forEach(({ u, v }) => { const n = v.saetze || 0; u.ziel.forEach((m) => { sz[m] = (sz[m] || 0) + n; }); u.mit.forEach((m) => { sz[m] = (sz[m] || 0) + n / 2; }); });
    Object.keys(sz).forEach((m) => { if (MUSKELN[m]) sum += sz[m]; else delete sz[m]; });
    const reg = {}; Object.entries(REGION).forEach(([k, R]) => { reg[k] = sum ? R.reduce((x, m) => x + (sz[m] || 0), 0) / sum : 0; });
    return reg;
  }
  function satzVon(W, P) { // „Schwere Sätze mit großen Grundübungen für die Beine – am meisten für Gesäß und Oberschenkel hinten.“
    const t = P.typ;
    const eine = P.n === 1 ? W.liste[0].u : null;
    /* Sprünge: Ab 60 % der Sätze bestimmen sie die Einheit („mit Sprüngen für die Beine“). Zwischen 30 und 60 % stehen sie neben dem Rest
       („…, dazu Sprünge“) – Art und Region beschreiben dann nur den Rest, sonst hieße es „Sprünge für den Oberkörper“.
       Sprünge und der Kettlebell-Swing laufen immer explosiv, welches Ziel auch gewählt ist; der Swing zählt bei der Art zu den großen Übungen. */
    const sprungViel = P.sprung >= 0.6, dazu = !sprungViel && P.sprung >= 0.3;
    const explosiv = !W.Z.zirkel && t.plyo >= 0.6;
    const teil = dazu ? 1 - P.sprung : 1, mehr = (t.mehr + t.plyo - P.sprung) / teil, iso = t.iso / teil, rumpf = t.rumpf / teil;
    const rest = dazu ? W.liste.filter((f) => !istSprung(f.u)) : W.liste;
    const einzeln = (u) => (istSprung(u) ? 'mit einer Sprungübung' : u.typ === 'plyo' ? 'mit einer Schwungübung' : u.typ === 'mehr' ? 'mit einer großen Grundübung' : u.typ === 'rumpf' ? 'mit einer Rumpfübung' : 'mit einer kleinen, gezielten Übung');
    const art = eine ? einzeln(eine) : dazu && rest.length === 1 ? einzeln(rest[0].u)
      : sprungViel ? 'mit Sprüngen' : mehr >= 0.6 ? 'mit großen Grundübungen' : iso >= 0.6 ? 'mit kleinen, gezielten Übungen' : rumpf >= 0.6 ? 'mit Rumpfübungen' : 'mit großen und kleinen Übungen';
    const r = dazu ? regionVon(rest) : P.reg;
    const wo = sprungViel ? 'für die Beine' : r.beine >= 0.6 ? 'für die Beine' : r.rumpf >= 0.6 ? 'für den Rumpf' : r.oben >= 0.6 ? 'für den Oberkörper'
      : r.oben < 0.2 && r.beine + r.rumpf >= 0.8 ? 'für Beine und Rumpf' : r.beine < 0.2 && r.oben + r.rumpf >= 0.8 ? 'für Oberkörper und Rumpf' : r.rumpf < 0.2 && r.beine + r.oben >= 0.8 ? 'für Beine und Oberkörper' : 'für den ganzen Körper';
    const rumpfN = W.liste.filter((f) => f.u.typ === 'rumpf'), haltenN = rumpfN.filter((f) => f.u.art === 'halten').length;
    const nurRumpf = rumpfN.length === rest.length; // außer Sprüngen, die eigens genannt werden, nur Rumpf – sonst „Vor allem …“
    const kern = t.rumpf >= 0.6
      ? (nurRumpf ? '' : 'Vor allem ') + (rumpfN.length === 1 ? (nurRumpf ? 'Eine' : 'eine') + ' Rumpfübung ' : 'Rumpfübungen ') + (W.Z.zirkel ? 'im Zirkel' : haltenN === rumpfN.length ? 'mit Haltezeiten' : haltenN ? 'mit Wiederholungen und Haltezeiten' : 'mit ruhigen Wiederholungen') + (dazu ? ', dazu Sprünge' : '')
      : (explosiv ? CHARAKTER.power : CHARAKTER[W.z]) + ' ' + art + (/Rumpfübung/.test(art) ? '' : ' ' + wo) + (dazu ? ', dazu Sprünge' : '');
    // die Muskeln mit den meisten Sätzen – nur genannt, wenn sie sich abheben (sonst wäre die Auswahl Zufall)
    const R = P.rang, wert = (k) => (R[k] ? R[k][1] + R[k][2] / 100 : 0);
    const top = R.length <= 2 ? R : wert(2) < 0.85 * wert(1) ? R.slice(0, 2) : wert(1) < 0.85 * wert(0) ? R.slice(0, 1) : [];
    return kern + (top.length ? ' – am meisten für ' + (top.length === 1 ? M_EINS[top[0][0]] : undListe(top.map((x) => mFuer(x[0])))) : '') + '.';
  }
  function bauVon(W, P) { // „11 Sätze · 3 Grundübungen · 1 kleine Übung · 1 einseitig“
    const z = P.zahl, mz = (n, eins, viele) => n + ' ' + (n === 1 ? eins : viele);
    return [W.Z.zirkel ? mz(W.satz, 'Runde', 'Runden') + ' mit ' + mz(P.n, 'Übung', 'Übungen') : mz(P.saetze, 'Satz', 'Sätze') + ' insgesamt',
      P.sprungN ? mz(P.sprungN, 'Sprungübung', 'Sprungübungen') : null, z.plyo > P.sprungN ? mz(z.plyo - P.sprungN, 'Schwungübung', 'Schwungübungen') : null, z.mehr ? mz(z.mehr, 'Grundübung', 'Grundübungen') : null, z.iso ? mz(z.iso, 'kleine Übung', 'kleine Übungen') : null,
      z.rumpf ? mz(z.rumpf, 'Rumpfübung', 'Rumpfübungen') : null, P.eins ? P.eins + ' einseitig' : null].filter(Boolean);
  }
  function hinweiseVon(W, P, d, kl) { // nur was zutrifft, höchstens zwei – das Wichtigste zuerst
    const H = [];
    if (P.beinS >= 8 && W.z !== 'stabil') H.push({ id: 'beine', farbe: 'orange', text: 'Viel für die Beine: Laufökonomie und Leistung sind danach bis etwa 48 Stunden gedämpft – leg den nächsten harten Lauf oder die harte Radeinheit nicht auf morgen.', q: 'Doma et al., Sports Med 2017' });
    if (P.druck >= 6 && !P.zug) H.push({ id: 'druck', farbe: 'blue', text: 'Nur Drücken, kein Ziehen: Schwimmen kräftigt ohnehin die Muskeln, die den Arm nach innen drehen. Rudern oder Face Pulls halten die Schulter im Gleichgewicht.', q: 'Wanivenhaus et al., Sports Health 2012' });
    if ((W.z === 'kraft' || W.z === 'power') && P.n >= 3 && P.typ.mehr < 0.34 && P.typ.plyo < 0.3 && P.typ.rumpf < 0.6) H.push({ id: 'klein', farbe: 'purple', text: 'Vor allem kleine Übungen: Für ' + ZIEL[W.z].name + ' zählen die großen, mehrgelenkigen – Kniebeuge, Kreuzheben, Klimmzug. Mit ihnen arbeiten auch die Studien zur Lauf- und Radökonomie.', q: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014' });
    const viel = W.eigen && !W.Z.zirkel ? P.rang.find(([m, n]) => n > KAPPE(m, W.niv) + 1.5) : null; // nur im eigenen Workout – der Vorschlag der App ist schon gedeckelt
    if (viel) H.push({ id: 'viel', farbe: 'purple', text: 'Schon ' + nf(viel[1], viel[1] % 1 ? 1 : 0) + ' Sätze für ' + M_EINS[viel[0]] + ' in einer Einheit: Etwa 10 pro Woche bringen den meisten Zuwachs – besser auf zwei Tage verteilt.', q: 'Schoenfeld et al., J Sports Sci 2017 · Schoenfeld et al., Sports Med 2016' });
    if (kl.includes('l') && d[2] >= d[1] && P.reg.beine >= 0.6 && P.beinS >= 6 && !P.beinEins && !P.sprungN) H.push({ id: 'einbein', farbe: 'mint', text: 'Keine einbeinige Übung dabei: Laufen ist ein Sprung von Bein zu Bein – Step-up, Ausfallschritt oder einbeiniges Kreuzheben trainieren genau diese Lage.', q: null });
    if (P.n >= 3 && !P.zahl.rumpf && P.reg.rumpf < 0.12) H.push({ id: 'rumpf', farbe: 'purple', text: 'Kein Rumpf dabei: Eine Rumpfübung am Ende wirkt in allen drei Disziplinen – Wasserlage, Aeroposition, ruhiges Becken.', q: 'Hibbs et al., Sports Med 2008' });
    return H.slice(0, 2);
  }
  function einschaetzung(W) { // alles, was sich über diese Liste sagen lässt
    const N = nutzenW(W), d = N.d, P = profilVon(W), kl = N.liste[0] === WENIG ? '' : klasseVon(d); // „Kleiner Hebel“ und „Allgemeine Kraft“ gehören zusammen
    return { W, N, d, P, klasse: kl, titel: WOFUER[kl], satz: satzVon(W, P), bringt: nutzenAuswahl(N, 4), bau: bauVon(W, P), achte: hinweiseVon(W, P, d, kl) };
  }
  function aenderungVon(E0, E1) { // was sich gegenüber dem Vorschlag verschoben hat: Disziplinen (Wort oder spürbarer Wert), Muskeln, Titel
    const dis = DREI.map(([, n], i) => {
      const a = wort(E0.d[i]), b = wort(E1.d[i]), x = E1.d[i] - E0.d[i];
      return a !== b ? { n, x, t: n + ' ' + a + ' → ' + b } : Math.abs(x) >= 0.04 ? { n, x, t: (x > 0 ? 'etwas mehr ' : 'etwas weniger ') + n } : null;
    }).filter(Boolean).sort((p, q) => Math.abs(q.x) - Math.abs(p.x));
    const haupt = (E) => new Set(E.W.liste.flatMap((f) => f.u.ziel)), m0 = haupt(E0), m1 = haupt(E1);
    return { dis, neu: M_REIHE.filter((m) => m1.has(m) && !m0.has(m)), weg: M_REIHE.filter((m) => m0.has(m) && !m1.has(m)), vorher: E0.titel !== E1.titel ? E0.titel : null };
  }
  function aenderungText(A0, E1) { // ein bis zwei ruhige Sätze
    const t = [];
    if (A0.dis.length) t.push(A0.dis.map((x) => x.t).join(', ') + '.');
    if (A0.neu.length) t.push('Neu dabei: ' + undListe(A0.neu.map((m) => MUSKELN[m])) + '.');
    if (A0.weg.length) t.push('Nicht mehr dabei: ' + undListe(A0.weg.map((m) => MUSKELN[m])) + '.');
    if (!t.length) t.push(A0.vorher ? 'Nur wenig verschoben – aus „' + A0.vorher + '“ wird „' + E1.titel + '“.' : 'Der Schwerpunkt bleibt gleich – weiter „' + E1.titel + '“.');
    else if (A0.vorher) t.push('Vorher: „' + A0.vorher + '“.');
    return t.join(' ');
  }
  // Was ein einzelner Tausch am Schwerpunkt ändert: „mehr Laufen, weniger Rad“ – oder null, wenn er gleich bleibt
  function wirkungText(dAlt, dNeu) {
    const L = DREI.map(([, n], i) => ({ n, x: dNeu[i] - dAlt[i] })).filter((y) => Math.abs(y.x) >= 0.03).sort((a, b) => Math.abs(b.x) - Math.abs(a.x)).slice(0, 2);
    return L.length ? L.map((y) => (y.x > 0 ? 'mehr ' : 'weniger ') + y.n).join(', ') : null;
  }
  const PROFIL = new Map(); // Disziplin-Werte einer einzelnen Übung, nur aus ihren Hauptmuskeln (Sprünge mit Lauf-Bonus)
  function hProfil(u) {
    let p = PROFIL.get(u.id);
    if (!p) { const sz = {}; u.ziel.forEach((m) => { sz[m] = 1; }); p = dWerte(sz, istSprung(u)).d; PROFIL.set(u.id, p); }
    return p;
  }
  const listeD = (L) => { const sz = {}; let plyo = false; L.forEach(({ u, s }) => { u.ziel.forEach((m) => { sz[m] = (sz[m] || 0) + s; }); u.mit.forEach((m) => { sz[m] = (sz[m] || 0) + s / 2; }); if (istSprung(u)) plyo = true; }); return { sz, d: dWerte(sz, plyo).d }; };
  const satzFuer = (W, x, f) => (W.eigen ? f.v.saetze : vorgabe(x, W.z, W.Z, W.satz, W.niv).saetze); // so viele Sätze bekäme die Übung an dieser Stelle
  function dMitTausch(W, f, x) { // Disziplin-Werte, wenn an der Stelle von f die Übung x stünde
    return listeD(W.liste.map((g) => (g === f ? { u: x, s: satzFuer(W, x, f) } : { u: g.u, s: g.v.saetze }))).d;
  }

  /* ---------- Schwerpunkt verschieben ----------
     wunsch: [Schwimmen, Rad, Laufen], je 0–1 oder null (nicht angefasst). Gesucht wird die Liste, deren Werte dem Wunsch am
     nächsten kommen; nicht angefasste Ecken sollen ungefähr bleiben (Gewicht etwa ein Drittel). Erst entsteht die Folge der
     wirksamsten Tausche in die gewünschte Richtung, dann gilt davon so viel, wie dem Wunsch am nächsten kommt. Kleine Abzüge
     halten die Einheit sinnvoll: keine doppelten Muskeln, passend zum Ziel, die Art der Übung bleibt möglichst erhalten,
     Sätze je Muskel bleiben gedeckelt, im Studio lieber Geräte. Gleicher Wunsch, gleiche Einheit → immer dasselbe Ergebnis. */
  function zugSuche(W, wunsch, o) {
    o = o || {};
    const z = W.z, niv = W.niv, fest = o.fest || ((f) => f.u.id !== f.orig); // von Hand Getauschtes bleibt (W kommt ohne die Tausche des Schwerpunkts)
    const L = W.liste.map((f) => ({ u: f.u, u0: f.u, s: f.v.saetze, f, fest: !!fest(f), neu: false }));
    const d0 = listeD(L).d, ziel = wunsch.map((w, i) => (w == null ? d0[i] : Math.max(0, Math.min(1, w)))), gew = wunsch.map((w) => (w == null ? 0.35 : 1));
    // Richtung je Ecke: +1 mehr, −1 weniger, 0 nicht angefasst. Ist die Richtung schon bekannt (o.richtung: der Wunsch gilt nach
    // „Neu mischen“ weiter), zählt sie nur, solange der Wunsch noch auf dieser Seite liegt – aus „mehr Laufen“ wird nie „weniger“.
    const richtung = wunsch.map((w, i) => { const r = w == null ? 0 : w > d0[i] + 0.02 ? 1 : w < d0[i] - 0.02 ? -1 : 0; return o.richtung && o.richtung[i] !== r ? 0 : r; });
    richtung.forEach((r, i) => { if (!r) { ziel[i] = d0[i]; gew[i] = 0.35; } });
    // Abstand zum Wunsch. Über das Ziel hinaus in die gewünschte Richtung zählt weniger als zu kurz zu bleiben – „mehr Laufen“
    // heißt mindestens so viel; ein Workout aus wenigen Übungen kann nur in groben Schritten folgen.
    const kosten = (d) => { let c = 0; for (let i = 0; i < 3; i++) { const e = d[i] - ziel[i]; c += gew[i] * (richtung[i] && e * richtung[i] > 0 ? 0.4 : 1) * e * e; } return c; };
    const frei = L.filter((x) => !x.fest).length, maxT = o.max != null ? o.max : Math.max(1, Math.floor(frei / 2)); // höchstens die Hälfte – sonst wäre es eine andere Einheit
    const kern = W.M && !W.eigen ? W.M : new Set(W.liste.flatMap((f) => (BY[f.orig] || f.u).ziel)); // die Muskeln, um die es in dieser Einheit geht
    // Ein Tausch zählt nur, wenn er in einer gewünschten Richtung wirklich etwas bewegt (gemessen an den Hauptmuskeln der Übung):
    // für „mehr“ kommt eine Übung, die für diese Disziplin stark ist – auch von außerhalb der gewählten Muskeln;
    // für „weniger“ geht eine, die dort viel beiträgt, und es kommt eine Variante für dieselben Muskeln der Einheit.
    const passt = (alt, neu) => {
      const a = hProfil(alt), b = hProfil(neu);
      if (richtung.some((r, i) => r > 0 && b[i] >= 0.6 && b[i] - a[i] >= 0.1)) return true;
      return richtung.some((r, i) => r < 0 && a[i] >= 0.5 && a[i] - b[i] >= 0.1) && neu.ziel.some((m) => kern.has(m));
    };
    const pool = (W.pool || poolOrt()).filter((x) => x.typ !== 'mobil' && x.stufe <= [2, 3, 3, 3, 3][niv] && (x.typ !== 'plyo' || z === 'power' || (z === 'ausdauer' && niv > 0)))
      .slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const schluessel = (u) => u.ziel.slice().sort().join();
    // Reihenfolge der Tausche: Schritt für Schritt der wirksamste in die gewünschte Richtung – gedacht bis ganz in die Ecke.
    // Wie viele davon gelten, entscheidet der Wunsch: der Stand, der ihm am nächsten kommt. So kommt beim Weiterziehen ein
    // Tausch nach dem anderen dazu, statt dass die Liste bei jedem Schritt neu gewürfelt wird.
    const rand = richtung.map((r, i) => (r > 0 ? 1 : r < 0 ? 0 : d0[i]));
    const kostenRand = (d) => { let c = 0; for (let i = 0; i < 3; i++) { const e = d[i] - rand[i]; c += gew[i] * e * e; } return c; };
    let dJetzt = d0; const alle = [], folge = [d0];
    const strafe = (i, x, L2, sz) => {
      const alt = L[i].u0, zk = schluessel(x); let s = 0;
      L2.forEach((y, k) => { if (k !== i) { if (schluessel(y.u) === zk) s += 0.02; if (y.u.muster === x.muster) s += 0.004; } });
      if (!(x.eignung || ALLE).includes(z)) s += 0.01;
      if (x.typ !== alt.typ) s += 0.006 + (alt.typ === 'mehr' && ['kraft', 'aufbau', 'power'].includes(z) ? 0.008 : 0); // die Art der Übung bleibt möglichst – vor allem die großen Grundübungen
      if (!x.ziel.some((m) => kern.has(m))) s += 0.012; // lieber innerhalb der gewählten Muskeln bleiben – nach außen nur, wenn es sonst nicht geht
      if (x.ziel.some((m) => sz[m] > KAPPE(m, niv) + 0.5)) s += 0.05;
      if (G.ort === 'studio' && x.geraet.length === 4 && (x.typ === 'mehr' || x.typ === 'iso')) s += 0.03; // im Studio lieber Geräte und Gewichte – wie beim Zusammenstellen
      return s;
    };
    while (richtung.some(Boolean) && alle.length < maxT) {
      const drin = new Set(L.flatMap((y) => [y.u.id, y.f.orig])); let best = null; // auch die Ausgangsübungen getauschter Stellen sind vergeben – das Workout nimmt sie kein zweites Mal
      for (let i = 0; i < L.length; i++) {
        if (L[i].fest || L[i].neu) continue;
        for (const x of pool) {
          if (drin.has(x.id) || !passt(L[i].u, x)) continue;
          const L2 = L.map((y, k) => (k === i ? { u: x, s: satzFuer(W, x, y.f) } : y)), r = listeD(L2), c = kostenRand(r.d) + strafe(i, x, L2, r.sz);
          if (!best || c < best.c - 1e-9) best = { i, x, c, d: r.d };
        }
      }
      if (!best || best.c > kostenRand(dJetzt) - 0.002) break;
      alle.push({ orig: L[best.i].f.orig, von: L[best.i].u, zu: best.x });
      L[best.i] = Object.assign({}, L[best.i], { u: best.x, s: satzFuer(W, best.x, L[best.i].f), neu: true });
      dJetzt = best.d; folge.push(best.d);
    }
    let k = 0; for (let j = 1; j < folge.length; j++) if (kosten(folge[j]) < kosten(folge[k]) - 1e-9) k = j; // der Stand, der dem Wunsch am nächsten kommt
    const tausche = alle.slice(0, k), d = folge[k], ende = k === folge.length - 1;
    // Wo der Wunsch nicht zu erreichen war: alle möglichen Tausche sind gemacht, und es fehlt noch mehr als ein Zehntel
    const offen = wunsch.map((w, i) => (!ende || !richtung[i] ? 0 : richtung[i] > 0 && d[i] < w - 0.1 ? 1 : richtung[i] < 0 && d[i] > w + 0.1 ? -1 : 0));
    return { tausche, d, d0, ziel, richtung, offen, voll: k >= maxT, kosten: kosten(d), kostenVon: kosten };
  }
  function programmFuer(R) { // das Programm, das dem Wunsch am nächsten kommt – nur wenn es deutlich näher liegt als das Erreichte
    let best = null;
    PROGRAMME.forEach((p) => { if (p.id === G.vorlage && !G.eigenAktiv) return; const c = R.kostenVon(progNutzen(p).d); if (!best || c < best.c) best = { p, c }; });
    return best && best.c < R.kosten - 0.01 ? best.p : null;
  }
  const zugAktiv = () => !!(G && Array.isArray(G.zug) && G.zug.some((x) => x != null));
  function zugLoesen() { // Tausche aus einem früheren Schwerpunkt wieder herausnehmen – nur wo sie noch so stehen
    Object.entries(G.zugT || {}).forEach(([orig, id]) => { if (G.tausch[orig] === id) delete G.tausch[orig]; });
    G.zugT = {};
  }
  function zugSetzen(wunsch, richtung) { // Wunsch übernehmen: suchen, Tausche eintragen, merken, welche vom Schwerpunkt kommen (richtung: nur beim Weitergelten)
    zugLoesen();
    const w = Array.isArray(wunsch) ? wunsch.map((x) => (typeof x === 'number' && isFinite(x) ? Math.round(Math.max(0, Math.min(1, x)) * 100) / 100 : null)) : null;
    if (!w || w.every((x) => x == null)) { G.zug = null; G.zugR = null; return null; }
    const W = workout(); if (!W || !W.liste.length) { G.zug = null; G.zugR = null; return null; }
    const R = zugSuche(W, w, richtung ? { richtung } : null);
    G.zug = R.tausche.length ? w : null; // ohne Tausch gilt nichts als verschoben
    G.zugR = G.zug ? R.richtung.slice() : null;
    R.tausche.forEach((t) => { G.tausch[t.orig] = t.zu.id; G.zugT[t.orig] = t.zu.id; });
    return R;
  }
  // Tausche leeren: neue Einheit (Muskeln, Programm, eigenes Workout) → auch der Schwerpunkt ist weg; sonst (neu mischen, Ort, Ziel, Dauer) gilt er weiter
  function tauschLeeren(neueEinheit) {
    G.tausch = {}; G.zugT = {};
    if (neueEinheit) { G.zug = null; G.zugR = null; } else if (zugAktiv()) zugSetzen(G.zug, G.zugR);
  }

  const zugWorte = (richtung) => DREI.map(([, n], i) => (richtung && richtung[i] > 0 ? 'mehr ' + n : richtung && richtung[i] < 0 ? 'weniger ' + n : null)).filter(Boolean); // „mehr Laufen, weniger Rad"
  function ohneZug(fn) { // kurz so rechnen, als gäbe es die Tausche des Schwerpunkts nicht – von Hand Getauschtes bleibt
    const t = G.tausch, zt = G.zugT;
    G.tausch = Object.assign({}, t); Object.entries(zt || {}).forEach(([orig, id]) => { if (G.tausch[orig] === id) delete G.tausch[orig]; }); G.zugT = {};
    try { return fn(); } finally { G.tausch = t; G.zugT = zt; }
  }
  function mitTauschen(W, tausche) { // dieselbe Einheit mit den genannten Tauschen – für die Vorschau
    const neu = new Map(tausche.map((t) => [t.orig, t.zu]));
    const liste = W.liste.map((f) => { const x = neu.get(f.orig); return x ? { u: x, orig: f.orig, v: W.eigen ? f.v : vorgabe(x, W.z, W.Z, W.satz, W.niv), last: null, zug: true } : f; });
    const saetze = {}; liste.forEach(({ u, v }) => { u.ziel.forEach((m) => { saetze[m] = (saetze[m] || 0) + v.saetze; }); u.mit.forEach((m) => { saetze[m] = (saetze[m] || 0) + v.saetze / 2; }); });
    return Object.assign({}, W, { liste, saetze });
  }
  /* Das Blatt „Schwerpunkt verschieben“: ein großes Dreieck mit drei Griffen (ziehen, antippen, Pfeiltasten) und daneben Plus/Minus
     je Disziplin. Die Fläche zeigt sofort, was das Workout daraus macht; darunter steht, was getauscht würde. Erst „Übernehmen“
     ändert das Workout – auf dem Handy verstellt so niemand etwas beim Scrollen.
     C: { W (Ausgang ohne die Tausche des Schwerpunkts), wunsch, fertig(wunsch, R), ohneProgramm } */
  function schwerpunktBlatt(C) {
    if (!(window.tfWissen && tfWissen.blatt)) return;
    const W = C.W, E0 = einschaetzung(W), d0 = E0.d, suche = (w) => zugSuche(W, w, { fest: C.fest });
    let wunsch = (C.wunsch || [null, null, null]).map((x) => (typeof x === 'number' ? x : null)), R = suche(wunsch), raf = 0, zieh = null;
    const VW = 240, VH = 192, RAD = 80, cx = 120, cy = 112;
    const achse = (i) => { const a = ((-90 - i * 120) * Math.PI) / 180; return [Math.cos(a), Math.sin(a)]; };
    const punkt = (i, f) => { const [x, y] = achse(i); return [cx + x * RAD * f, cy + y * RAD * f]; };
    const pfad = (P) => 'M' + P.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' L') + ' Z';
    const form = (d) => pfad([0, 1, 2].map((i) => punkt(i, Math.max(0.1, Math.min(1, d[i])))));
    const sv = svg('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 'tf-swp-drei', role: 'group', 'aria-label': 'Schwerpunkt – drei Regler für Schwimmen, Rad und Laufen' });
    svg('path', { d: pfad([0, 1, 2].map((i) => punkt(i, 1))), class: 'tf-gym-drei-r' }, sv);
    svg('path', { d: pfad([0, 1, 2].map((i) => punkt(i, 0.5))), class: 'tf-gym-drei-m' }, sv);
    [0, 1, 2].forEach((i) => { const [x, y] = punkt(i, 1); svg('line', { x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1), class: 'tf-gym-drei-a' }, sv); });
    const flaeche = svg('path', { class: 'tf-gym-drei-f' }, sv);
    svg('path', { class: 'tf-gym-drei-b', d: form(d0) }, sv);
    DREI.forEach(([, n], i) => { const [x, y] = punkt(i, 1); const t = svg('text', { x: x.toFixed(1), y: (i === 0 ? y - 16 : y + 28).toFixed(1), 'text-anchor': 'middle', class: 'tf-gym-drei-t' }, sv); t.textContent = n; });
    const setze = (i, v) => { // Wunsch für eine Ecke; nah am Ausgang heißt: nicht angefasst
      const w = Math.max(0.05, Math.min(1, v));
      wunsch[i] = Math.abs(w - d0[i]) < 0.03 ? null : Math.round(w * 100) / 100;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; R = suche(wunsch); malen(); });
    };
    const griffe = DREI.map(([, n, f], i) => {
      const g = svg('g', { class: 'tf-swp-h', tabindex: '0', role: 'slider', 'aria-label': n, 'aria-valuemin': '0', 'aria-valuemax': '100', 'data-i': String(i) }, sv);
      svg('circle', { r: 22, class: 'tf-swp-ht' }, g); svg('circle', { r: 9, class: 'tf-swp-hk', fill: 'var(--tf-' + f + ')' }, g);
      g.addEventListener('keydown', (e) => {
        const k = e.key, jetzt = wunsch[i] != null ? wunsch[i] : R.d[i];
        const st = k === 'ArrowUp' || k === 'ArrowRight' ? 0.05 : k === 'ArrowDown' || k === 'ArrowLeft' ? -0.05 : k === 'PageUp' ? 0.2 : k === 'PageDown' ? -0.2 : 0;
        if (st) { e.preventDefault(); setze(i, jetzt + st); } else if (k === 'Home') { e.preventDefault(); setze(i, 0.05); } else if (k === 'End') { e.preventDefault(); setze(i, 1); }
      });
      return g;
    });
    // Ziehen: Die Ecke, in deren Richtung der Finger liegt, folgt ihm – auch wenn die Griffe nah beieinander liegen
    const svgPunkt = (e) => { const r = sv.getBoundingClientRect(); return [(e.clientX - r.left) * (VW / (r.width || VW)), (e.clientY - r.top) * (VH / (r.height || VH))]; };
    const wertBei = (i, q) => { const [x, y] = achse(i); return ((q[0] - cx) * x + (q[1] - cy) * y) / RAD; };
    sv.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button > 0) return;
      const q = svgPunkt(e), i = [0, 1, 2].reduce((b, k) => (wertBei(k, q) > wertBei(b, q) ? k : b), 0);
      zieh = i; try { sv.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
      setze(i, wertBei(i, q)); e.preventDefault(); griffe[i].focus({ preventScroll: true });
    });
    sv.addEventListener('pointermove', (e) => { if (zieh != null) setze(zieh, wertBei(zieh, svgPunkt(e))); });
    const los = () => { zieh = null; };
    sv.addEventListener('pointerup', los); sv.addEventListener('pointercancel', los);
    // Plus und Minus: ein Tipp führt zum nächsten Stand, bei dem sich wirklich etwas ändert
    const kennung = (r) => r.tausche.map((t) => t.orig + '>' + t.zu.id).join();
    function schritt(i, dir) {
      const jetzt = kennung(R), ab = dir > 0 ? Math.max(R.d[i], wunsch[i] == null ? 0 : wunsch[i]) : Math.min(R.d[i], wunsch[i] == null ? 1 : wunsch[i]);
      for (let k = 1; k <= 20; k++) {
        const w = Math.round((ab + dir * 0.05 * k) * 100) / 100; if (w < 0.05 || w > 1) break;
        const w2 = wunsch.slice(); w2[i] = Math.abs(w - d0[i]) < 0.03 ? null : w;
        const r2 = suche(w2);
        if (kennung(r2) !== jetzt) { wunsch = w2; R = r2; malen(); return; }
      }
      wunsch[i] = dir > 0 ? 1 : 0.05; R = suche(wunsch); malen(); // mehr geht nicht – der Hinweis darunter sagt, warum
    }
    const zeilen = DREI.map(([, n, f, ic], i) => {
      const minus = el('button', { type: 'button', class: 'tf-swp-b', 'aria-label': 'Weniger ' + n }, svgIco('i-minus')), plus = el('button', { type: 'button', class: 'tf-swp-b', 'aria-label': 'Mehr ' + n }, svgIco('i-plus'));
      minus.addEventListener('click', () => schritt(i, -1)); plus.addEventListener('click', () => schritt(i, 1));
      const balken = el('i'), w = el('small');
      return { balken, w, el: el('div', { class: 'tf-swp-z', style: '--c:var(--tf-' + f + ')' }, el('span', { class: 'tf-swp-n' }, el('span', { class: 'tf-gym-nbn' }, svgIco(ic), el('span', { text: n })), w), minus, el('span', { class: 'tf-gym-nbb' }, balken), plus) };
    });
    const liste = el('ul', { class: 'tf-swp-l' }), leer = el('p', { class: 'tf-swp-leer' }), wird = el('p', { class: 'tf-swp-wird' }), grenze = el('div', { class: 'tf-swp-grenze', hidden: true });
    const kurz = el('p', { class: 'tf-swp-kurz', role: 'status' }); // ein Satz, der beim Ziehen immer im Blick bleibt – auch wenn die Liste darunter aus dem Bild ist
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'swp-ok' }, svgIco('i-check'), ' Übernehmen');
    const zurueck = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', id: 'swp-zurueck' }, 'Zurücksetzen');
    ok.addEventListener('click', () => { tfWissen.schliessen(); C.fertig(wunsch.slice(), R); });
    zurueck.addEventListener('click', () => { wunsch = [null, null, null]; R = suche(wunsch); malen(); });
    function malen() {
      flaeche.setAttribute('d', form(R.d));
      const st = staerkste(R.d); sv.style.setProperty('--d', 'var(--tf-' + (st === 'alle drei' ? 'purple' : DREI.find((x) => st.startsWith(x[1]))[2]) + ')');
      griffe.forEach((g, i) => {
        const v = wunsch[i] != null ? wunsch[i] : R.d[i], q = punkt(i, Math.max(0.1, Math.min(1, v)));
        g.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')');
        g.setAttribute('aria-valuenow', String(Math.round(v * 100)));
        g.setAttribute('aria-valuetext', wort(R.d[i]) + (wunsch[i] == null ? '' : wunsch[i] > d0[i] ? ' – mehr gewünscht' : ' – weniger gewünscht'));
        g.classList.toggle('wunsch', wunsch[i] != null);
      });
      zeilen.forEach((z, i) => { z.balken.style.width = Math.round(Math.max(4, Math.min(1, R.d[i]) * 100)) + '%'; z.w.textContent = wort(R.d[i]); });
      const frei = wunsch.every((x) => x == null), E1 = R.tausche.length ? einschaetzung(mitTauschen(W, R.tausche)) : E0;
      liste.replaceChildren(...R.tausche.map((t) => el('li', { 'data-zu': t.zu.id }, el('b', { text: t.zu.name }), el('span', { text: 'statt ' + t.von.name }))));
      liste.hidden = !R.tausche.length;
      leer.hidden = !!R.tausche.length;
      leer.textContent = frei ? 'Noch nichts – zieh eine Ecke oder tippe auf Plus und Minus.' : 'Noch kein Tausch: Dein Wunsch liegt nah am jetzigen Stand. Zieh weiter, wenn du mehr willst.';
      wird.hidden = !R.tausche.length;
      wird.replaceChildren(el('span', { text: E1.titel === E0.titel ? 'Es bleibt: ' : 'Daraus wird: ' }), el('b', { text: E1.titel }));
      const offen = DREI.map(([, n], i) => (R.offen[i] > 0 ? 'Mehr ' + n : R.offen[i] < 0 ? 'Weniger ' + n : null)).filter(Boolean);
      const nT = R.tausche.length;
      kurz.textContent = frei ? 'Noch nichts verschoben' : nT ? (nT === 1 ? '1 Übung wird getauscht' : nT + ' Übungen werden getauscht') + ' · ' + (E1.titel === E0.titel ? 'bleibt' : 'wird') + ' „' + E1.titel + '“'
        : offen.length ? undListe(offen) + ' geht hier nicht' : 'Noch kein Tausch – zieh weiter';
      grenze.hidden = !offen.length;
      if (offen.length) {
        const pr = C.ohneProgramm ? null : programmFuer(R);
        const teile = [el('p', { text: undListe(offen) + (R.voll && R.tausche.length ? ' geht nicht: Es wird höchstens die Hälfte der Übungen getauscht – sonst wäre es eine andere Einheit.' : ' geht mit diesen Übungen nicht.') + (pr ? ' Am nächsten kommt das Programm „' + pr.name + '“.' : '') })];
        if (pr) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein', id: 'swp-programm' }, svgIco('i-target'), ' ' + pr.name + ' öffnen'); b.addEventListener('click', () => { tfWissen.schliessen(); programmWahl(pr.id, true); }); teile.push(b); }
        grenze.replaceChildren(...teile);
      }
      zurueck.disabled = frei;
    }
    const fester = W.liste.filter((f) => (C.fest || ((x) => x.u.id !== x.orig))(f)).length;
    const box = el('div', { class: 'tf-swp' },
      el('h2', { class: 'tf-swp-t', id: 'sheet-titel', text: 'Schwerpunkt verschieben' }),
      el('p', { class: 'tf-swp-sub', text: 'Zieh eine Ecke nach außen für mehr, nach innen für weniger. Dafür werden Übungen getauscht – höchstens die Hälfte.' + (fester ? ' Was du von Hand getauscht hast, bleibt.' : '') }),
      el('div', { class: 'tf-swp-oben' }, sv, el('div', { class: 'tf-swp-zeilen' }, ...zeilen.map((z) => z.el))),
      el('small', { class: 'tf-gym-es-leg' }, (() => { const x = svg('svg', { viewBox: '0 0 20 4', width: 20, height: 4, 'aria-hidden': 'true', focusable: 'false' }); svg('path', { d: 'M1,2 H19', class: 'tf-gym-drei-b' }, x); return x; })(), el('span', { text: 'Gestrichelt: so ist es ohne Verschieben' })),
      el('h3', { class: 'tf-swp-h3', text: 'Das ändert sich' }), el('div', { class: 'tf-swp-vorschau' }, leer, liste, wird, grenze),
      el('div', { class: 'tf-swp-akt' }, kurz, el('div', { class: 'tf-form-actions' }, ok, zurueck)));
    malen();
    tfWissen.blatt(box);
  }
  function schwerpunktOeffnen() { // auf der Workout-Seite: Ausgang ist das Workout ohne die Tausche eines früheren Schwerpunkts
    const WA = ohneZug(() => workout()); if (!WA || !WA.liste.length) return;
    const vorher = zugAktiv();
    schwerpunktBlatt({ W: WA, wunsch: vorher ? G.zug.slice() : null, fertig: (w) => {
      const R = zugSetzen(w), n = R ? R.tausche.length : 0; speichern(true); neu();
      if (A().toast) A().toast(n ? (n === 1 ? 'Eine Übung' : n + ' Übungen') + ' für den Schwerpunkt getauscht' : vorher ? 'Schwerpunkt zurückgesetzt' : 'Nichts getauscht – der Schwerpunkt bleibt');
      requestAnimationFrame(() => { const b = $('#gym-nutzen .tf-gym-es-spk'); if (b) b.focus({ preventScroll: true }); });
    } });
  }

  /* ---------- Programme ---------- */
  function progNutzen(p) { const s0 = {}; p.muskeln.forEach((m) => { s0[m] = GROSS.has(m) ? 1.5 : 1; }); return nutzenVon(s0, { z: p.ziel, plyo: p.ziel === 'power' }); }
  function programmWahl(id, los) {
    laden(); const p = PROGRAMME.find((x) => x.id === id); if (!p) return;
    G.muskeln = Object.keys(MUSKELN).filter((m) => p.muskeln.includes(m)); G.ziel = p.ziel; G.vorlage = p.id; G.eigenAktiv = null; tauschLeeren(true);
    speichern(true);
    if (los) T.geh('training/gym/workout');
  }
  function programmeKarte(kompakt) {
    laden();
    const c = karte({ farbe: 'purple', icon: 'i-target', titel: 'Programme für deinen Wettkampf', sub: kompakt ? 'Ein Tipp – Übungen, Sätze und der Nutzen fürs Rennen' : PROGRAMME.length + ' fertige Workouts – antippen, und es geht los', span2: true, id: kompakt ? 'karte-gym-programme-kurz' : 'karte-gym-programme' });
    const L = el('div', { class: 'tf-gym-prog' + (kompakt ? ' kompakt' : '') });
    (kompakt ? PROGRAMME.slice(0, 4) : PROGRAMME).forEach((p) => {
      const N = progNutzen(p), akt = !G.eigenAktiv && G.vorlage === p.id && G.muskeln.length;
      const b = el('button', { type: 'button', class: 'tf-gym-pk' + (akt ? ' akt' : ''), 'data-p': p.id },
        dreieck(N.d), el('span', { class: 'tf-gym-pk-t' }, el('b', { text: p.name }), el('small', { text: p.kurz }), el('span', { class: 'tf-gym-pk-m' }, (ZIEL[p.ziel].name === p.name ? '' : ZIEL[p.ziel].name + ' · ') + fuerWen(N.d))), svgIco('i-chev'));
      b.addEventListener('click', () => programmWahl(p.id, true));
      L.appendChild(b);
    });
    c.appendChild(L);
    if (kompakt) { const m = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein tf-gym-prog-alle' }, 'Alle ' + PROGRAMME.length + ' Programme'); m.addEventListener('click', () => { gymTab = 'programme'; merkTab(); T.geh('training/gym'); }); c.appendChild(m); }
    return c;
  }
  let gymTab = (() => { try { const t = localStorage.getItem('tf:gym-tab'); return ['programme', 'muskeln', 'eigene'].includes(t) ? t : null; } catch (e) { return null; } })();
  const merkTab = () => { try { localStorage.setItem('tf:gym-tab', gymTab); } catch (e) { /* egal */ } };
  const tabJetzt = () => gymTab || (G.eigenAktiv ? 'eigene' : G.muskeln.length && !PROGRAMME.some((p) => p.id === G.vorlage) ? 'muskeln' : 'programme');
  function modusLeiste(tab) {
    const g = el('div', { class: 'tf-seg tf-gym-modus', role: 'tablist', 'aria-label': 'Workout wählen' });
    [['programme', 'Programme', 'i-target'], ['muskeln', 'Muskeln', 'i-body'], ['eigene', 'Eigene', 'i-edit']].forEach(([id, n, ic]) => {
      const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === id), 'aria-pressed': String(tab === id), 'data-tab': id }, svgIco(ic), el('span', { text: n }));
      b.addEventListener('click', () => { gymTab = id; merkTab(); neu(); });
      g.appendChild(b);
    });
    return g;
  }

  /* ---------- Eigene Workouts: gespeichert als „Übung|Sätze|Wiederholungen“ ---------- */
  const eigenAktiv = () => (G && G.eigenAktiv ? (G.eigene || []).find((e) => e && e.id === G.eigenAktiv) || null : null);
  const STUFEN_W = ['1–3', '3–5', '4–6', '5–8', '6–8', '6–10', '8–10', '8–12', '10–12', '10–15', '12–15', '15–20', '15–25', '20–25'];
  const STUFEN_H = ['15 s', '20 s', '30 s', '30–45 s', '45 s', '45–60 s', '60 s', '90 s'];
  const naechste = (S0, w) => { const m = (x) => { const sp = spanne(x); return (sp[0] + sp[1]) / 2; }, z = m(w); return S0.reduce((b, x) => (Math.abs(m(x) - z) < Math.abs(m(b) - z) ? x : b), S0[0]); };
  function eigenListe(e) {
    return (e.u || []).map((z) => { const [id, n, w] = String(z).split('|'); const u = BY[id]; return u ? { u, s: Math.max(1, Math.min(8, +n || 3)), w: w || (u.art === 'halten' ? '30–45 s' : '8–12') } : null; }).filter(Boolean);
  }
  // Version 43: im eigenen Workout für heute eine andere Übung wählen – der gespeicherte Plan bleibt, wie er ist
  const poolOrt = () => { const g = geraete(); return U.filter((u) => u.typ !== 'mobil' && u.geraet.some((x) => g.includes(x)) && (G.ort !== 'studio' || u.geraet.includes('gym'))); };
  function eigenMitTausch(e, ohneTausch) {
    const z = ZIEL[e.z] ? e.z : zielJetzt(), gueltig = (e.u || []).map((x) => String(x).split('|')).filter(([id]) => BY[id]);
    const ids = new Set(gueltig.map(([id]) => id)), orig = [], vomZug = [], ZT = G.zugT || {};
    const zeilen = gueltig.map(([id, n, w]) => {
      orig.push(id);
      const t = ohneTausch ? null : G.tausch[id], x = typeof t === 'string' ? BY[t] : null;
      if (!x || x.id === id || ids.has(x.id)) { vomZug.push(false); return [id, n, w].join('|'); }
      ids.add(x.id); vomZug.push(ZT[id] === x.id);
      const gleich = (BY[id].art === 'halten') === (x.art === 'halten') // Halten und Wiederholungen nicht vermischen
        && !(ZT[id] === x.id && x.typ !== BY[id].typ); // Version 46: bringt der Schwerpunkt eine andere Art Übung (Grundübung statt kleiner), gelten ihre üblichen Wiederholungen
      return [x.id, n, gleich && w ? w : stdZeile(x, z).w].join('|');
    });
    const W = eigenWorkout(Object.assign({}, e, { u: zeilen }));
    if (!W) return null;
    W.liste.forEach((f, i) => { f.orig = orig[i] || f.orig; f.zug = !!vomZug[i]; });
    W.pool = poolOrt();
    return W;
  }
  // Vier Vorschläge mit demselben Hauptmuskel (gleiches Bewegungsmuster zuerst) und alle Übungen, die zum Ort passen
  function tauschWahl(f, id) { // Version 46: von Hand tauschen oder zurücknehmen – die Stelle gehört danach nicht mehr zum verschobenen Schwerpunkt
    if (id) G.tausch[f.orig] = id; else delete G.tausch[f.orig];
    if (G.zugT) delete G.zugT[f.orig];
  }
  function tauschOptionen(f, W, E) { // E (Version 46): Einschätzung der Einheit – damit jede Wahl zeigt, was sie am Schwerpunkt ändert
    const orig = BY[f.orig] || f.u, drin = new Set(W.liste.flatMap((x) => [x.u.id, x.orig])); // Version 46: auch die Ausgangsübungen anderer getauschter Stellen (das Workout nähme sie kein zweites Mal)
    const haupt = W.M && orig.ziel.some((m) => W.M.has(m)) ? orig.ziel.filter((m) => W.M.has(m)) : orig.ziel;
    const pool = (W.pool || poolOrt()).filter((x) => x.id !== orig.id && x.id !== f.u.id && !drin.has(x.id));
    const punkte = (x) => {
      const t = x.ziel.filter((m) => haupt.includes(m)).length, mt = x.mit.filter((m) => haupt.includes(m)).length;
      if (!t && !(mt && x.muster === orig.muster)) return 0;
      return t * 4 + mt + (x.muster === orig.muster ? 2 : 0) + (x.typ === orig.typ ? 1 : 0) + (x.art === orig.art ? 0.5 : 0) - x.ziel.filter((m) => !haupt.includes(m) && GROSS.has(m)).length * 1.5;
    };
    const vorschlaege = pool.map((x) => [x, punkte(x)]).filter((p) => p[1] > 0).sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name, 'de')).slice(0, 4).map((p) => p[0]);
    const reihe = [...new Set([...haupt, ...Object.keys(MUSKELN)])];
    const gruppen = reihe.map((m) => [MUSKELN[m], pool.filter((x) => x.ziel[0] === m).sort((a, b) => a.name.localeCompare(b.name, 'de'))]).filter((g) => g[1].length);
    const dJ = E ? E.d : nutzenW(W).d;
    const wirkung = (x) => wirkungText(dJ, dMitTausch(W, f, x)); // „mehr Laufen, weniger Rad“ oder null
    const jetzt = E && f.u.id !== orig.id ? { titel: E.titel, dadurch: wirkungText(dMitTausch(W, f, orig), dJ), zug: !!f.zug } : null; // nach dem Tausch: die neue Einschätzung
    return { orig, haupt, vorschlaege, gruppen, wirkung, jetzt };
  }
  function eigenWorkout(e) {
    const z = ZIEL[e.z] ? e.z : zielJetzt(), Z = ZIEL[z], niv = nivIdx(), L = eigenListe(e);
    if (!L.length) return null;
    const zeitVon = (v) => (Z.zirkel ? v.saetze * (v.sek + 15) : v.saetze * (v.sek + v.ps) + 45);
    const liste = L.map(({ u, s: n, w }) => {
      const v = vorgabe(u, z, Z, n, niv), sp = spanne(w), seite = u.einseitig ? ' je Seite' : '';
      Object.assign(v, { saetze: n, wdh: w, wdhLo: sp[0], wdhHi: sp[1], halten: !!v.halten || / s$/.test(w), text: Z.zirkel ? w + seite + ' pro Runde' : n + ' × ' + w + seite + (v.plyo ? ', explosiv' : '') });
      return { u, orig: u.id, alt: 0, v, last: lastVorgabe(u, v, niv) };
    });
    const saetze = {}; liste.forEach(({ u, v }) => { u.ziel.forEach((m) => { saetze[m] = (saetze[m] || 0) + v.saetze; }); u.mit.forEach((m) => { saetze[m] = (saetze[m] || 0) + v.saetze / 2; }); });
    const M = new Set(liste.flatMap((f) => f.u.ziel)), warm = 7, kuehl = 4, haupt = liste.reduce((x, f) => x + zeitVon(f.v), 0);
    return { z, Z, niv, satz: Math.max(...liste.map((f) => f.v.saetze)), liste, saetze, mit: Object.keys(saetze).filter((m) => !M.has(m)), fehlt: [], warm, kuehl, minuten: Math.round(warm + haupt / 60 + kuehl), eigen: e, M };
  }
  function eigeneKarte() {
    const E = (G.eigene || []).filter((e) => e && e.id);
    const c = karte({ farbe: 'purple', icon: 'i-edit', titel: 'Deine Workouts', sub: E.length ? E.length + (E.length === 1 ? ' eigenes Workout' : ' eigene Workouts') + ' · antippen zum Starten' : 'Stell dir dein Workout selbst zusammen – Übung für Übung', span2: true, id: 'karte-gym-eigene' });
    if (!E.length) c.appendChild(el('p', { class: 'tf-gym-leer', text: 'Zum Beispiel dein Aero-Programm für den Winter oder die vier Übungen nach jedem Lauf. Der Nutzen fürs Rennen rechnet beim Zusammenstellen mit.' }));
    const L = el('div', { class: 'tf-gym-prog' });
    E.forEach((e) => {
      const W = eigenWorkout(e); if (!W) return;
      const N = nutzenW(W), namen = W.liste.map((f) => f.u.name);
      const b = el('button', { type: 'button', class: 'tf-gym-pk' + (G.eigenAktiv === e.id ? ' akt' : ''), 'data-e': e.id }, dreieck(N.d),
        el('span', { class: 'tf-gym-pk-t' }, el('b', { text: e.n || 'Eigenes Workout' }), el('small', { text: namen.slice(0, 3).join(', ') + (namen.length > 3 ? ' + ' + (namen.length - 3) + ' weitere' : '') }), el('span', { class: 'tf-gym-pk-m' }, W.liste.length + ' Übungen · etwa ' + W.minuten + ' min · ' + fuerWen(N.d))), svgIco('i-play'));
      b.addEventListener('click', () => { G.eigenAktiv = e.id; tauschLeeren(true); speichern(true); T.geh('training/gym/workout'); });
      const ed = el('button', { type: 'button', class: 'tf-gym-pk-ed', 'aria-label': (e.n || 'Workout') + ' bearbeiten' }, svgIco('i-edit'));
      ed.addEventListener('click', () => { entwurfAus(e); T.geh('training/gym/eigen'); });
      L.appendChild(el('div', { class: 'tf-gym-pkw' }, b, ed));
    });
    if (E.length) c.appendChild(L);
    const neuB = el('button', { type: 'button', class: 'tf-btn' + (E.length ? '' : ' tf-btn-primary'), id: 'gym-eigen-neu' }, svgIco('i-plus'), ' Neues Workout erstellen');
    neuB.addEventListener('click', () => { entwurf = null; waehler = { auf: true, q: '', f: 'alle' }; T.geh('training/gym/eigen'); });
    c.appendChild(el('div', { class: 'tf-form-actions' }, neuB));
    return c;
  }
  let entwurf = null, waehler = { auf: true, q: '', f: 'alle' }, loeschenSicher = false;
  function entwurfAus(e) { entwurf = { id: e.id, n: e.n || '', z: ZIEL[e.z] ? e.z : zielJetzt(), u: eigenListe(e).map((x) => ({ id: x.u.id, s: x.s, w: x.w })) }; waehler = { auf: false, q: '', f: 'alle' }; }
  function stdZeile(u, z) { // Vorschlag beim Hinzufügen: Sätze und Wiederholungen wie im Ziel
    const Z = ZIEL[z], niv = nivIdx(), v = vorgabe(u, z, Z, Z.saetze[niv], niv), S0 = u.art === 'halten' ? STUFEN_H : STUFEN_W;
    return { id: u.id, s: Math.max(1, Math.min(6, v.saetze || 3)), w: S0.includes(v.wdh) ? v.wdh : naechste(S0, v.wdh) };
  }
  const entwurfZeilen = (E) => E.u.map((x) => x.id + '|' + x.s + '|' + x.w);
  function eigenSpeichern(los) {
    const E = entwurf; if (!E || !E.u.length) return;
    const W0 = eigenWorkout({ z: E.z, u: entwurfZeilen(E) }), auto = W0 ? 'Kraft für ' + staerkste(nutzenW(W0).d).replace('alle drei', 'alle drei Disziplinen') : 'Eigenes Workout';
    const row = { id: E.id || 'e' + Date.now().toString(36), n: ((E.n || '').trim() || auto).slice(0, 40), z: E.z, u: entwurfZeilen(E).slice(0, 20) };
    const alt = G.eigene || [], i = alt.findIndex((e) => e && e.id === row.id);
    if (i < 0 && alt.length >= 12) { if (A().toast) A().toast('Höchstens 12 eigene Workouts – lösch zuerst eines'); return; }
    G.eigene = i >= 0 ? alt.map((e, k) => (k === i ? row : e)) : alt.concat([row]);
    if (los) { G.eigenAktiv = row.id; tauschLeeren(true); }
    speichern(true);
    entwurf = null; waehler = { auf: true, q: '', f: 'alle' }; gymTab = 'eigene'; merkTab();
    if (A().toast) A().toast('Gespeichert: ' + row.n);
    T.geh(los ? 'training/gym/workout' : 'training/gym');
  }
  function eigenAnsicht() {
    if (!entwurf) entwurf = { id: null, n: '', z: zielJetzt(), u: [] };
    const E = entwurf;
    T.kopf({ titel: E.id ? 'Workout bearbeiten' : 'Workout erstellen' });
    // 1. Name und Ziel
    const c1 = karte({ farbe: 'purple', icon: 'i-edit', titel: 'Name und Ziel', id: 'karte-eigen-name' });
    const name = el('input', { type: 'text', class: 'tf-input', maxlength: '40', placeholder: 'Zum Beispiel: Aero-Winter', value: E.n, 'aria-label': 'Name des Workouts', id: 'eigen-name' });
    name.addEventListener('input', () => { E.n = name.value.slice(0, 40); });
    const zielHint = el('small', { class: 'tf-ich-hint' });
    const zielChips = chips(Object.entries(ZIEL).map(([k, o]) => [k, o.name]), E.z, (v) => { E.z = v; $$('button', zielChips).forEach((b, k) => b.setAttribute('aria-pressed', String(Object.keys(ZIEL)[k] === v))); aktual(); }, { label: 'Ziel' });
    c1.append(el('div', { class: 'tf-gym-wahl' }, feld('Name', name), feld('Ziel', zielChips, zielHint)));
    // 2. Übungen
    const c2 = karte({ farbe: 'purple', icon: 'i-list', titel: 'Übungen', id: 'karte-eigen-liste', span2: true });
    const sub2 = c2.querySelector('.tf-sub') || el('div', { class: 'tf-sub' }); if (!sub2.parentNode) { const kopf = c2.querySelector('.tf-card-head > div'); if (kopf) kopf.appendChild(sub2); }
    const mini = el('span', { class: 'tf-gym-eigen-mini' }); const head = c2.querySelector('.tf-card-head'); if (head) head.appendChild(mini);
    const liste = el('ol', { class: 'tf-gym-el', 'aria-live': 'polite' });
    const plus = el('button', { type: 'button', class: 'tf-btn tf-gym-plus', 'aria-expanded': String(waehler.auf), 'aria-controls': 'eigen-waehler' });
    const wbox = el('div', { class: 'tf-gym-waehler', id: 'eigen-waehler', hidden: !waehler.auf });
    plus.addEventListener('click', () => { waehler.auf = !waehler.auf; wbox.hidden = !waehler.auf; knopf(); if (waehler.auf) { wListe(); const q = $('#eigen-suche'); if (q) q.focus({ preventScroll: true }); } });
    c2.append(liste, el('div', { class: 'tf-form-actions tf-gym-plusbox' }, plus), wbox);
    // 3. Nutzen, live
    const c3 = karte({ farbe: 'purple', icon: 'i-target', titel: 'Einschätzung', id: 'karte-eigen-nutzen' }); // Version 46 (vorher „Nutzen im Wettkampf“)
    const nbox = el('div'); c3.appendChild(nbox);
    const gespeichert = E.id ? (G.eigene || []).find((e) => e && e.id === E.id) || null : null, WB = gespeichert ? eigenWorkout(gespeichert) : null; // Vergleich beim Bearbeiten: die gespeicherte Fassung
    const verschieben = (W) => schwerpunktBlatt({ W, ohneProgramm: true, fest: () => false, fertig: (w, R) => { // Tausche landen im Entwurf – Sätze bleiben, Halten und Wiederholungen werden nicht vermischt
      R.tausche.forEach((t) => { const k = E.u.findIndex((x) => x.id === t.von.id); if (k < 0) return; const alt = E.u[k]; E.u[k] = { id: t.zu.id, s: alt.s, w: (t.von.art === 'halten') === (t.zu.art === 'halten') && t.von.typ === t.zu.typ ? alt.w : stdZeile(t.zu, E.z).w }; });
      aktual(); if (waehler.auf) wListe();
      if (R.tausche.length && A().toast) A().toast(R.tausche.length === 1 ? 'Eine Übung getauscht' : R.tausche.length + ' Übungen getauscht');
      requestAnimationFrame(() => { const b = $('#karte-eigen-nutzen .tf-gym-es-spk'); if (b) b.focus({ preventScroll: true }); });
    } });
    // Knöpfe
    const speichernB = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'eigen-speichern' }, svgIco('i-check'), ' Speichern');
    const losB = el('button', { type: 'button', class: 'tf-btn', id: 'eigen-los', 'aria-label': 'Speichern und starten' }, svgIco('i-play'), ' Starten');
    speichernB.addEventListener('click', () => eigenSpeichern(false)); losB.addEventListener('click', () => eigenSpeichern(true));
    const akt = el('div', { class: 'tf-gym-eigen-akt' }, speichernB, losB), fuss = el('div', { class: 'tf-form-actions tf-gym-eigen-fuss' });
    if (E.id) {
      const del = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-gym-del' }, svgIco('i-trash'), ' Löschen'); loeschenSicher = false;
      del.addEventListener('click', () => {
        if (!loeschenSicher) { loeschenSicher = true; del.lastChild.textContent = ' Wirklich löschen?'; setTimeout(() => { loeschenSicher = false; if (del.isConnected) del.lastChild.textContent = ' Löschen'; }, 4000); return; }
        G.eigene = (G.eigene || []).filter((e) => e.id !== E.id); if (G.eigenAktiv === E.id) G.eigenAktiv = null; speichern(true);
        entwurf = null; gymTab = 'eigene'; merkTab(); if (A().toast) A().toast('Workout gelöscht'); T.geh('training/gym');
      });
      fuss.appendChild(del);
    }
    const abb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, E.id ? 'Änderungen verwerfen' : 'Verwerfen');
    abb.addEventListener('click', () => { entwurf = null; waehler = { auf: true, q: '', f: 'alle' }; gymTab = 'eigene'; merkTab(); T.geh('training/gym'); });
    fuss.appendChild(abb);
    // Auswahl: Suche, Filter nach Nutzen, Liste
    const q = el('input', { type: 'search', class: 'tf-input', id: 'eigen-suche', placeholder: 'Übung oder Muskel suchen', value: waehler.q, 'aria-label': 'Übung oder Muskel suchen' });
    const FILTER = [['alle', 'Alle'], ['schwimmen', 'Schwimmen'], ['rad', 'Rad'], ['laufen', 'Laufen'], ['rumpf', 'Rumpf'], ['ort', ORT[G.ort][0]]];
    const fchips = chips(FILTER, waehler.f, (v) => { waehler.f = v; $$('button', fchips).forEach((b, k) => b.setAttribute('aria-pressed', String(FILTER[k][0] === v))); wListe(); }, { cls: 'tf-gym-filter', label: 'Filter' });
    const wl = el('div', { class: 'tf-gym-wl' }), anz = el('p', { class: 'tf-gym-anzahl' });
    wbox.append(q, fchips, anz, wl);
    const norm = (t) => String(t || '').toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
    q.addEventListener('input', () => { waehler.q = q.value; wListe(); });
    function passt(u) {
      const t = norm(waehler.q).trim();
      if (t && !t.split(/\s+/).every((w) => norm(u.name + ' ' + (u.muskeln || '') + ' ' + u.ziel.map((m) => MUSKELN[m]).join(' ')).includes(w))) return false;
      const f = waehler.f;
      if (f === 'rumpf') return u.typ === 'rumpf' || u.ziel.some((m) => ['bauch', 'seite', 'ruecken_unten'].includes(m));
      if (f === 'ort') { const g = geraete(); return u.geraet.some((x) => g.includes(x)) && (G.ort !== 'studio' || u.geraet.includes('gym')); }
      if (f !== 'alle') return uebNutzen(u).some((x) => x.id === f);
      return true;
    }
    function wListe() {
      const drin = new Set(E.u.map((x) => x.id)), L = U.filter((u) => u.typ !== 'mobil' && passt(u));
      anz.textContent = L.length + (L.length === 1 ? ' Übung' : ' Übungen') + (drin.size ? ' · ' + drin.size + ' im Workout' : '');
      wl.replaceChildren(...L.slice(0, 60).map((u) => {
        const an = drin.has(u.id);
        const b = el('button', { type: 'button', class: 'tf-gym-wz' + (an ? ' an' : ''), 'aria-pressed': String(an), 'data-u': u.id },
          el('span', { class: 'tf-gym-wz-p', 'aria-hidden': 'true' }, svgIco(an ? 'i-check' : 'i-plus')),
          el('span', { class: 'tf-gym-wz-t' }, el('b', { text: u.name }), el('small', { text: u.ziel.map((m) => MUSKELN[m]).join(', ') + ' · ' + (u.geraet.length === 4 ? 'überall' : u.geraet.map((g) => GER[g]).join(', ')) }), fuerChips(u)));
        b.addEventListener('click', () => {
          const k = E.u.findIndex((x) => x.id === u.id);
          if (k >= 0) E.u.splice(k, 1); else if (E.u.length < 20) E.u.push(stdZeile(u, E.z)); else if (A().toast) A().toast('Höchstens 20 Übungen');
          aktual(); wListe();
        });
        return b;
      }));
      if (!L.length) wl.appendChild(el('p', { class: 'tf-empty', text: 'Keine Übung passt – anderes Wort oder anderer Filter.' }));
    }
    const knopf = () => { plus.setAttribute('aria-expanded', String(waehler.auf)); plus.replaceChildren(svgIco(waehler.auf ? 'i-minus' : 'i-plus'), waehler.auf ? ' Auswahl schließen' : ' Übung hinzufügen'); plus.classList.toggle('tf-btn-primary', !E.u.length && !waehler.auf); };
    const kleinStep = (wert, label, ab, auf) => { // [−] 3 Sätze [+]
      const m = el('button', { type: 'button', class: 'tf-gym-st-b', 'aria-label': label + ' weniger' }, svgIco('i-minus')), p2 = el('button', { type: 'button', class: 'tf-gym-st-b', 'aria-label': label + ' mehr' }, svgIco('i-plus'));
      m.addEventListener('click', () => { ab(); aktual(); }); p2.addEventListener('click', () => { auf(); aktual(); });
      return el('span', { class: 'tf-gym-st', role: 'group', 'aria-label': label }, m, el('b', { class: 'num', text: wert }), p2);
    };
    function aktual() {
      const W = E.u.length ? eigenWorkout({ z: E.z, u: entwurfZeilen(E) }) : null, N = W ? nutzenW(W) : null;
      zielHint.textContent = ZIEL[E.z].kurz + ' – bestimmt Pausen, Reserve und die Vorschläge beim Hinzufügen.';
      sub2.textContent = W ? W.liste.length + (W.liste.length === 1 ? ' Übung' : ' Übungen') + ' · etwa ' + W.minuten + ' min' : 'Noch leer – such dir unten die erste Übung aus';
      mini.replaceChildren(...(N ? [dreieck(N.d)] : []));
      liste.replaceChildren(...E.u.map((x, i) => {
        const u = BY[x.id]; if (!u) return null;
        const S0 = u.art === 'halten' ? STUFEN_H : STUFEN_W, k = S0.indexOf(x.w);
        const nach = (r) => { const j = i + r; if (j < 0 || j >= E.u.length) return; const t = E.u[i]; E.u[i] = E.u[j]; E.u[j] = t; aktual(); };
        const hoch = el('button', { type: 'button', class: 'tf-gym-eb hoch', 'aria-label': u.name + ' nach oben', disabled: i === 0 }, svgIco('i-chev')); hoch.addEventListener('click', () => nach(-1));
        const runter = el('button', { type: 'button', class: 'tf-gym-eb runter', 'aria-label': u.name + ' nach unten', disabled: i === E.u.length - 1 }, svgIco('i-chev')); runter.addEventListener('click', () => nach(1));
        const weg = el('button', { type: 'button', class: 'tf-gym-eb', 'aria-label': u.name + ' entfernen' }, svgIco('i-x')); weg.addEventListener('click', () => { E.u.splice(i, 1); aktual(); if (waehler.auf) wListe(); });
        return el('li', { class: 'tf-gym-ez' },
          el('span', { class: 'tf-gym-nr num', text: String(i + 1) }),
          el('span', { class: 'tf-gym-ez-t' }, el('b', { text: u.name }), el('small', { text: u.ziel.map((m) => MUSKELN[m]).join(', ') }), fuerChips(u)),
          el('span', { class: 'tf-gym-ez-k' }, hoch, runter, weg),
          el('span', { class: 'tf-gym-ez-s' },
            kleinStep(x.s + (x.s === 1 ? ' Satz' : ' Sätze'), 'Sätze', () => { x.s = Math.max(1, x.s - 1); }, () => { x.s = Math.min(8, x.s + 1); }),
            kleinStep(u.art === 'halten' ? x.w : x.w + ' Wdh.', u.art === 'halten' ? 'Haltezeit' : 'Wiederholungen', () => { x.w = S0[Math.max(0, (k < 0 ? S0.indexOf(naechste(S0, x.w)) : k) - 1)]; }, () => { x.w = S0[Math.min(S0.length - 1, (k < 0 ? S0.indexOf(naechste(S0, x.w)) : k) + 1)]; })));
      }).filter(Boolean));
      const anders = !!(W && WB && (W.z !== WB.z || entwurfZeilen(E).join() !== (gespeichert.u || []).join()));
      nbox.replaceChildren(W ? einschaetzungBlock(W, { ohneKopf: true, basis: anders ? WB : null, aeTitel: 'Gegenüber der gespeicherten Fassung', legende: 'Gestrichelt im Dreieck: gespeichert',
        schwerpunkt: window.tfWissen && tfWissen.blatt ? () => verschieben(W) : null })
        : el('p', { class: 'tf-gym-leer', text: 'Sobald die erste Übung drin ist, steht hier, was für eine Einheit es ist und was sie im Rennen bringt – für Schwimmen, Rad und Laufen.' }));
      speichernB.disabled = !E.u.length; losB.disabled = !E.u.length;
      knopf();
    }
    aktual(); if (waehler.auf) wListe();
    return [el('div', { class: 'tf-grid' }, c1, c2, c3), fuss, akt];
  }

  function wocheKarte() {
    if (!G.log.length) return null;
    const { L, s } = woche();
    const c = karte({ farbe: 'purple', icon: 'i-cal', titel: 'Deine Woche im Gym', sub: L.length ? L.length + (L.length === 1 ? ' Workout' : ' Workouts') + ' in den letzten 7 Tagen' : 'In den letzten 7 Tagen noch kein Workout', span2: true, id: 'karte-gym-woche' });
    const legende = el('div', { class: 'tf-gym-legende', 'aria-hidden': 'true' }, ...[['0', 0], ['1–4', 1], ['5–9', 2], ['10+ Sätze', 3]].map(([t, h]) => el('span', null, el('i', { class: 'h' + h }), t)));
    const text = el('div', { class: 'tf-gym-woche-t' }, el('p', { text: 'Je kräftiger die Farbe, desto mehr Sätze hatte der Muskel. Etwa 10 Sätze pro Muskel und Woche bringen den meisten Muskelaufbau.' }), legende);
    const wenig = VORLAGEN.find((v) => v[0] === 'ganz')[2].filter((m) => (s[m] || 0) < 5);
    if (L.length && wenig.length) {
      const b = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-target'), ' Das Fehlende auswählen');
      b.addEventListener('click', () => { G.muskeln = Object.keys(MUSKELN).filter((m) => wenig.includes(m)); const v = vorlageVon(new Set(G.muskeln)); G.vorlage = v ? v[0] : null; tauschLeeren(true); G.eigenAktiv = null; gymTab = 'muskeln'; speichern(); T.neu(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      text.append(el('p', { class: 'tf-gym-wenig', text: 'Noch wenig: ' + wenig.map((m) => MUSKELN[m]).join(', ') + '.' }), b);
    }
    c.append(el('div', { class: 'tf-gym-woche' }, koerper({ heat: s, klein: true }), text),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Schoenfeld et al., J Sports Sci 2017 · Schoenfeld et al., Sports Med 2016' })));
    return c;
  }
  function titelVon() {
    const EA = eigenAktiv(); if (EA) return EA.n || 'Eigenes Workout'; // Version 27
    const p = PROGRAMME.find((x) => x.id === G.vorlage); if (p) return p.name;
    const v = VORLAGEN.find((x) => x[0] === G.vorlage); if (v) return v[3];
    const n = G.muskeln.map((m) => MUSKELN[m]);
    return n.length > 3 ? n.slice(0, 2).join(', ') + ' + ' + (n.length - 2) + ' weitere' : n.join(n.length === 2 ? ' & ' : ', ');
  }
  function workoutAnsicht() {
    const W = workout(); if (!W) return [];
    const { Z } = W, M = W.M || new Set(G.muskeln);
    T.kopf({ sub: (W.eigen ? 'Eigenes Workout' : ortName()) + ' · ' + ZIEL[W.z].name });
    const c = el('article', { class: 'tf-card tf-gym-wk', id: 'karte-workout' });
    const min = W.minuten + (G.cardio ? G.cmin : 0);
    c.appendChild(el('div', { class: 'tf-gym-wk-kopf' },
      el('div', { class: 'tf-gym-wk-info' },
        el('h2', { class: 'tf-gym-wk-t', text: titelVon() }),
        el('p', { class: 'tf-gym-wk-z', text: ZIEL[W.z].name + ' · ' + NIVEAU[W.niv][1] }),
        el('div', { class: 'tf-gym-zahlen' },
          el('div', null, el('b', { class: 'num', text: String(min) }), el('small', { text: 'Minuten' })),
          el('div', null, el('b', { class: 'num', text: String(W.liste.length) }), el('small', { text: 'Übungen' })),
          el('div', null, el('b', { class: 'num', text: String(W.satz) }), el('small', { text: Z.zirkel ? 'Runden' : 'Sätze' })))),
      koerper({ an: M, mit: new Set(W.mit), klein: true })));
    const fokusB = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-btn-wide tf-gym-fokusb' }, svgIco('i-play'), ' Workout starten');
    fokusB.addEventListener('click', () => fokusAnsicht(W));
    c.append(fokusB, el('p', { class: 'tf-gym-fokus-t', text: 'Fokus-Ansicht: nur Übung, Gewicht und Pause – ohne Menüs. Eintragen geht auch hier in der Liste.' })); // Version 46: der Start steht jetzt vor der Einschätzung
    // Version 46: Einschätzung der Einheit – rechnet nach jedem Tausch neu und vergleicht mit dem Vorschlag (Version 27: Nutzen im Wettkampf)
    const tauschN = W.liste.filter((f) => f.u.id !== f.orig).length, E = einschaetzung(W);
    const zugTxt = zugAktiv() ? 'Verschoben: ' + (zugWorte(G.zugR).join(', ') || 'Schwerpunkt') : null;
    if (W.liste.length) c.appendChild(einschaetzungBlock(W, { id: 'gym-nutzen', basis: tauschN ? workout(true) : null, tauschN, vomSchwerpunkt: W.liste.filter((f) => f.zug).length, status: zugTxt,
      schwerpunkt: window.tfWissen && tfWissen.blatt ? schwerpunktOeffnen : null, zurueck: () => { tauschLeeren(true); offen = null; speichern(); neu(); } }));
    c.appendChild(el('p', { class: 'tf-gym-rir' }, el('b', { text: 'So schwer: ' }), reserveText(W) + ' ' + (Z.zirkel ? 'Pause ' + Z.pause + '.' : 'Pause zwischen den Sätzen: ' + Z.pause + (Z.pisoTxt && Z.pisoTxt !== Z.pause ? ', bei kleinen Übungen ' + Z.pisoTxt : '') + '.')));
    const mitLast = W.liste.filter((f) => f.last).length, messbar = W.liste.filter((f) => messarten(f.u).length && !f.v.halten && !f.v.plyo).length;
    if (mitLast) c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('purple'), el('span', { text: 'Gewichte aus deinen Kraftwerten. Trag bei jedem Satz ein, was du wirklich geschafft hast – nach dem Workout rechnet die App daraus deine Kraftwerte neu.' })));
    else if (messbar && W.niv >= 1) {
      const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Kraftwerte direkt eintragen');
      b.addEventListener('click', () => { kraftForm = { id: null }; T.geh('training/gym'); setTimeout(() => { const k = $('#karte-gym-kraft'); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); });
      c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('purple'), el('span', null, 'Trag bei jedem Satz Gewicht und Wiederholungen ein – nach dem Workout rechnet die App daraus deine Kraftwerte, und beim nächsten Mal steht hier dein genaues Gewicht. ', b)));
    }
    const dlw = deloadHinweis(); if (dlw) c.appendChild(dlw);
    W.fehlt.forEach(({ m, ort }) => c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('yellow'), el('span', { text: ort ? 'Für ' + MUSKELN[m] + ' gibt es mit „' + ortName() + '“ keine passende Übung.' : 'Für ' + MUSKELN[m] + ' war in ' + G.dauer + ' min kein Platz – nimm mehr Zeit oder weniger Muskeln.' }))));
    if (!W.eigen && W.liste.length && W.minuten < G.dauer - 6) c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('blue'), el('span', { text: 'Für ' + (M.size === 1 ? 'einen Muskel' : 'diese Auswahl') + ' reichen etwa ' + W.minuten + ' min – noch mehr Sätze bringen pro Einheit kaum etwas. ' + (G.ort !== 'studio' && !G.band ? 'Mit einem Widerstandsband gibt es mehr Übungen – oder wähle mehr Muskeln.' : 'Wähle mehr Muskeln oder nimm Cardio dazu.') })));
    // Aufwärmen
    const mob = U.filter((u) => u.typ === 'mobil' && u.ziel.some((m) => M.has(m)));
    const mobi = (mob.length ? mob : U.filter((u) => ['weltbeste', 'bws_rotation'].includes(u.id))).slice(0, 2);
    const block = (titel, zeit, items) => el('div', { class: 'tf-gym-sek' }, el('div', { class: 'tf-gym-sek-k' }, el('b', { text: titel }), el('span', { text: zeit })), el('ul', { class: 'tf-gym-ul' }, ...items.map((t) => el('li', null, t))));
    c.appendChild(block('Aufwärmen', W.warm + ' min', [(W.warm > 5 ? '4–5' : '3') + ' min locker: Rad, Rudergerät, Seilspringen oder zügig gehen', mobi.map((u) => u.name).join(' und ') + ' – je 30–45 s', '1–2 leichte Sätze der ersten Übung']));
    // Hauptteil
    const list = el('div', { class: 'tf-gym-liste' });
    W.liste.forEach((f, i) => {
      // Version 43: vier Vorschläge mit demselben Hauptmuskel und ein Auswahlmenü mit allen Übungen, die zum Ort passen
      const T0 = Object.assign(tauschOptionen(f, W, E), { waehle: (id) => { tauschWahl(f, id); offen = f.orig; tauschFokus = f.orig; speichern(); neu(); },
        ansehen: () => { const b = $('#gym-nutzen'); if (b) { b.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); const t = b.querySelector('.tf-gym-drei-k') || b; if (t === b) b.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } } });
      const d = uebung(f.u, i + 1, f.v, T0, f.last, { saetze: true, zirkel: !!Z.zirkel });
      if (offen === f.orig) (d.details || d).open = true;
      list.appendChild(d);
    });
    offen = null;
    if (tauschFokus) { // nach dem Tausch steht der Fokus auf der neuen Übung (Tastatur und Screenreader)
      const ff = W.liste.find((f) => f.orig === tauschFokus); tauschFokus = null;
      if (ff) requestAnimationFrame(() => { const sm = $('#ueb-' + ff.u.id + ' summary'); if (sm) sm.focus({ preventScroll: true }); });
    }
    c.append(el('div', { class: 'tf-gym-sek-k tf-gym-haupt' }, el('b', { text: Z.zirkel ? 'Zirkel · ' + W.satz + ' Runden' : 'Hauptteil' }), el('span', { text: 'Antippen für die Anleitung' })), list);
    if (Z.zirkel && window.tfTimer) { // Version 9: Pause nach jeder Runde mit Ton
      const rp = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, svgIco('i-timer'), ' Runde geschafft · 90 s Pause');
      rp.addEventListener('click', () => tfTimer.start({ titel: 'Zirkel', sub: 'Dann die nächste Runde', phasen: [{ name: 'Pause', sek: 90, art: 'pause' }], plus30: true, farbe: 'purple' }));
      c.appendChild(el('div', { class: 'tf-form-actions tf-gym-runde' }, rp, tfTimer.tonKnopf()));
    }
    c.appendChild(el('p', { class: 'tf-note tf-gym-warum', text: Z.zirkel ? 'Alle Übungen einer Runde ohne Pause, dann 1–2 min verschnaufen.' : 'Große, mehrgelenkige Übungen zuerst, kleine danach, Rumpf zum Schluss – so hast du die meiste Kraft für die schweren Übungen.' }));
    if (G.cardio) c.appendChild(cardioBlock());
    c.appendChild(block('Abschluss', W.kuehl + ' min', ['1–2 min locker gehen oder radeln', mobi.map((u) => u.name).join(' und ') + ' zum Lösen – je 45 s']));
    // Sätze je Muskel
    const sz = Object.entries(W.saetze).filter(([m]) => M.has(m)).sort((a, b) => b[1] - a[1]);
    const max = Math.max(10, ...sz.map((x) => x[1]));
    const balken = el('div', { class: 'tf-gym-balken' }, ...sz.map(([m, n]) => {
      const i = el('i'); i.style.width = (100 * n) / max + '%';
      return el('div', { class: 'tf-gym-bz' }, el('span', { text: MUSKELN[m] }), el('span', { class: 'tf-gym-bar' }, i), el('b', { class: 'num', text: nf(n, n % 1 ? 1 : 0) }));
    }));
    c.append(el('div', { class: 'tf-gym-sek-k tf-gym-haupt' }, el('b', { text: 'Sätze pro Muskel' }), el('span', { text: 'mitarbeitend zählt halb' })), balken,
      el('p', { class: 'tf-note' }, 'Für Muskelaufbau bringen etwa 10 Sätze pro Muskel und Woche am meisten – am besten auf zwei Einheiten verteilt.'),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: Z.quelle + ' · Reihenfolge: ACSM 2009' })));
    // Knöpfe
    const heuteDa = G.log.some((e) => e && e.d === heuteIso() && e.t === titelVon().slice(0, 40));
    const fertigB = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', disabled: heuteDa }, svgIco('i-check'), heuteDa ? ' Heute erledigt' : ' Workout erledigt');
    fertigB.addEventListener('click', () => rueckmeldung(W));
    const mischen = W.eigen ? el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-edit'), ' Bearbeiten') : el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-shuffle'), ' Neu mischen');
    mischen.addEventListener('click', () => { if (W.eigen) { entwurfAus(W.eigen); T.geh('training/gym/eigen'); return; } G.seed = (G.seed % 100000) + 1; tauschLeeren(false); speichern(); neu(); });
    c.appendChild(el('div', { class: 'tf-form-actions tf-gym-akt' }, fertigB, mischen));
    return [c];
  }
  function cardioBlock() {
    const C = CARDIO[G.cardio], m = G.cmin, beine = G.muskeln.some((x) => ['quad', 'gesaess', 'beinbeuger'].includes(x));
    let bau, quelle = 'Wilson et al., J Strength Cond Res 2012 · Eddens et al., Sports Med 2018';
    if (G.cform !== 'intervall') bau = [m + ' min gleichmäßig locker – du kannst dich dabei noch unterhalten'];
    else if (m === 10) { bau = ['2 min locker', '3 × 20 s so schnell du kannst, dazwischen 2 min ganz locker', '2 min locker ausklingen']; quelle += ' · Gillen et al., PLoS One 2016'; }
    else if (m >= 30) { bau = ['5 min locker', '4 × 4 min hart (etwa 90 % der maximalen Herzfrequenz), dazwischen 3 min locker', 'die letzte Pause ist das Ausklingen']; quelle += ' · Helgerud et al., Med Sci Sports Exerc 2007'; }
    else { const w = m >= 20 ? 4 : 3, n = Math.min(6, Math.floor((m - 2 * w + 1) / 2)); bau = [w + ' min locker', n + ' × 30 s zügig bis hart, dazwischen 90 s locker', (m - w - n * 2) + ' min locker ausklingen']; }
    const box = el('div', { class: 'tf-gym-cardio' },
      el('div', { class: 'tf-gym-cardio-k' }, el('span', { class: 'tf-gym-cardio-i' }, svgIco(C[1])), el('div', null, el('b', { text: 'Danach: ' + C[0] }), el('small', { text: m + ' min · ' + (G.cform === 'intervall' ? 'Intervalle' : 'locker') }))),
      el('ol', { class: 'tf-steps' }, ...bau.map((t) => el('li', { text: t }))),
      el('p', { class: 'tf-note', style: 'margin:8px 0 0' }, C[3]));
    const tipps = ['Erst Kraft, dann Cardio – so bleibt die Kraft frisch, wo sie zählt.'];
    if (beine && ['laufen', 'laufband', 'seil'].includes(G.cardio)) tipps.push('Nach schweren Beinen ist Rad, Crosstrainer oder Gehen bergauf schonender: Laufen bremst den Kraftzuwachs etwas stärker als Radfahren.');
    tipps.push('Zählt zu den 150–300 Minuten Bewegung pro Woche, die die WHO empfiehlt.');
    box.append(el('ul', { class: 'tf-gym-ul' }, ...tipps.map((t) => el('li', { text: t }))), el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: quelle + ' · Bull et al., Br J Sports Med 2020' })));
    return box;
  }
  /* ---------- Version 10: Gewicht und Wiederholungen je Satz ----------
     Grau steht ein Vorschlag: was du davor in diesem Workout hattest, sonst dein letztes Mal, sonst die Vorgabe.
     Abhaken übernimmt leere Felder aus dem Vorschlag und startet die Pause. */
  const SATZ_MAX = 10;
  function heuteSaetze() { if (G.satz.d !== heuteIso()) { if (G.satz.d) archivieren(); G.satz = { d: heuteIso() }; } return G.satz; }
  const zahlVon = (t) => { const s = String(t == null ? '' : t).replace(',', '.').trim(); if (!s) return null; const n = Number(s); return isFinite(n) ? n : null; };
  const kgZahl = (x) => nf(x, Math.round(x * 100) % 10 ? 2 : Math.round(x * 10) % 10 ? 1 : 0);
  const mitGewicht = (u, v) => !v.plyo && !v.halten && (u.art === 'kraft' || messarten(u).some((a) => a === 'kg' || a === 'zusatz'));
  function zuletztVon(id) { // { d, s: [[kg, wdh], …] } oder null
    const z = G.zuletzt[id];
    if (!Array.isArray(z) || z.length < 3) return null;
    const s = [];
    for (let i = 1; i + 1 < z.length; i += 2) if (+z[i + 1] > 0) s.push([z[i] == null ? null : +z[i], +z[i + 1]]);
    return s.length ? { d: z[0], s } : null;
  }
  function saetzeText(s, o) { // „60 kg × 8, 8, 7“ · „60 × 8, 62,5 × 6“ · „12, 10, 9 Wdh.“ · „45, 40 s“
    const einheit = o.sek ? ' s' : ' Wdh.';
    const kgs = s.map((x) => x[0]), gleich = kgs.every((k) => k === kgs[0]);
    if (!o.kg || kgs.every((k) => k == null || (k === 0 && !o.zusatz))) return s.map((x) => x[1]).join(', ') + einheit;
    const k = (x) => (x == null ? 'ohne' : (o.zusatz && x > 0 ? '+' : '') + kgZahl(x));
    return gleich ? (kgs[0] == null || (o.zusatz && kgs[0] === 0) ? 'ohne Zusatz' : k(kgs[0]) + ' kg') + ' × ' + s.map((x) => x[1]).join(', ') : s.map((x) => k(x[0]) + ' × ' + x[1]).join(', ');
  }
  // Grauer Vorschlag für Satz i: was du davor in diesem Workout hattest, sonst dein letztes Mal, sonst die Vorgabe
  function satzVorschlag(u, v, last, R, i) {
    const kgSp = mitGewicht(u, v), zus = messarten(u)[0] === 'zusatz', vorher = zuletztVon(u.id);
    let kg = null, w = null;
    for (let j = i - 1; j >= 0; j--) if (R[j][0] != null) { kg = R[j][0]; break; }
    for (let j = i - 1; j >= 0; j--) if (R[j][1] > 0) { w = R[j][1]; break; } // was du heute schon geschafft hast, zählt mehr als die Vorgabe
    if (vorher) { const p = vorher.s[Math.min(i, vorher.s.length - 1)]; if (kg == null && p[0] != null) kg = p[0]; if (w == null) w = p[1]; }
    if (kg == null && last && last.kg != null && (last.kg > 0 || zus)) kg = last.kg;
    if (w == null) w = last && last.wdh ? last.wdh : v.wdhHi || null;
    return { kg: kgSp ? kg : null, w };
  }
  function satzAbhaken(u, v, last, R, i) { // leere Felder übernehmen den Vorschlag; ohne Wiederholungen geht es nicht
    const r = R[i], vs = satzVorschlag(u, v, last, R, i);
    if (mitGewicht(u, v) && r[0] == null && vs.kg != null) r[0] = vs.kg;
    if (r[1] == null && vs.w != null) r[1] = vs.w;
    if (!(r[1] > 0)) return false;
    r[2] = 1;
    return true;
  }

  /* ---------- Bestleistungen und Verlauf je Übung ----------
     Nach jedem Workout: bestes geschätztes Maximum des Tages (aus dem besten Satz, mit der Reserve der Vorgabe).
     verlauf: die letzten 6 Einheiten [Datum, Maximum, …] · pr: Bestleistung [Datum, Maximum, kg, Wdh.] */
  // Messart der Sätze: Der gespeicherte Kraftwert gibt sie vor – außer, er bestand nur aus Wiederholungen und jetzt steht Gewicht
  // in den Sätzen (z. B. einbeiniges Kreuzheben erst ohne, dann mit Hanteln). Dann zählt ab jetzt die Last.
  function satzArt(u, mitKg, ersatz) {
    const m = G.max[u.id], a = messarten(u), last = a.includes('zusatz') || a.includes('kg');
    if (m && m.a && !(m.a === 'wdh' && mitKg && last)) return m.a;
    return a.includes('zusatz') ? 'zusatz' : mitKg && a.includes('kg') ? 'kg' : ersatz(a);
  }
  const artVon = (u, R) => satzArt(u, (R || []).some((r) => r && r[2] && r[0] > 0), (a) => (a.includes('wdh') ? 'wdh' : a.includes('kg') ? 'kg' : null));
  // Messart einer gespeicherten Bestleistung [Datum, Max, kg, Wdh., Art]: 'wdh' oder 'last' (ältere Einträge ohne Art: aus dem Gewicht)
  const prArt = (p, u) => (!Array.isArray(p) ? null : p[4] ? (p[4] === 'wdh' ? 'wdh' : 'last') : +p[2] > 0 ? 'last' : messarten(u).includes('zusatz') ? null : 'wdh');
  function tagesBestes(u, R, rir) {
    const art = artVon(u, R); if (!art) return null;
    let b = null;
    R.forEach((r) => {
      if (!r || !r[2] || !(r[1] > 0) || (art !== 'wdh' && (r[1] > 30 || (art === 'kg' && !(r[0] > 0))))) return;
      const e = maxAus(art, art === 'wdh' ? 0 : r[0] || 0, r[1], rir);
      if (!b || e > b.e) b = { e, kg: art === 'wdh' ? 0 : r[0] || 0, wdh: r[1], art };
    });
    return b;
  }
  function verlaufEintragen(d) { // gibt neue Bestleistungen zurück
    const neuePr = [];
    if (!G.verlauf || typeof G.verlauf !== 'object' || Array.isArray(G.verlauf)) G.verlauf = {};
    if (!G.pr || typeof G.pr !== 'object' || Array.isArray(G.pr)) G.pr = {};
    Object.entries(G.satz).forEach(([id, R]) => {
      const u = BY[id]; if (id === 'd' || !u || !Array.isArray(R)) return;
      const b = tagesBestes(u, R, 2); if (!b || !(b.e > 0)) return;
      const e = +b.e.toFixed(1);
      let V = Array.isArray(G.verlauf[id]) ? G.verlauf[id].slice() : [];
      const vorher = prArt(G.pr[id], u), jetzt = b.art === 'wdh' ? 'wdh' : 'last';
      if (vorher && vorher !== jetzt) { delete G.pr[id]; V = []; } // Messart gewechselt: Wiederholungen und Kilo sind nicht vergleichbar – neu anfangen
      if (V.length >= 2 && V[V.length - 2] === d) V.splice(-2, 2); // derselbe Tag: ersetzen
      const frueher = [];
      for (let i = 1; i < V.length; i += 2) frueher.push(+V[i]);
      V.push(d, e); G.verlauf[id] = V.slice(-24); // die letzten 12 Einheiten
      // Version 13: Volumen der Einheit – kg × Wdh. (je Hand doppelt, Körpergewicht bei Zusatzgewicht mit), sonst Wiederholungen
      const vol = R.filter((r) => r && r[2] && +r[1] > 0).reduce((x, r) => x + (b.art === 'wdh' ? +r[1] : (b.art === 'zusatz' ? koerperKg() + (+r[0] || 0) : +r[0] || 0) * +r[1] * (JE_HAND.has(id) ? 2 : 1)), 0);
      let VV = Array.isArray(G.vol[id]) ? G.vol[id].slice() : [];
      if (vorher && vorher !== jetzt) VV = [];
      if (VV.length >= 2 && VV[VV.length - 2] === d) VV.splice(-2, 2);
      VV.push(d, Math.round(vol)); G.vol[id] = VV.slice(-24);
      const alt = Array.isArray(G.pr[id]) ? +G.pr[id][1] : Math.max(0, ...frueher);
      if (e > alt * 1.005 && (frueher.length || G.pr[id])) neuePr.push({ id, u, e, b, alt });
      if (!G.pr[id] || e > +G.pr[id][1]) G.pr[id] = [d, e, b.kg, b.wdh, b.art];
    });
    const ids = Object.keys(G.verlauf);
    if (ids.length > 60) ids.sort((a, b) => String(G.verlauf[a][G.verlauf[a].length - 2]).localeCompare(String(G.verlauf[b][G.verlauf[b].length - 2]))).slice(0, ids.length - 60).forEach((id) => { delete G.verlauf[id]; delete G.pr[id]; delete G.vol[id]; });
    return neuePr;
  }
  // Deload-Hinweis: Bei einer Grundübung steigt das Maximum über drei Einheiten nicht (oder sinkt), obwohl Tune passt.
  // Dann eine Woche mit etwa 40 % weniger Sätzen bei gleichem Gewicht (Bell et al., Sports Med Open 2024 · Coleman et al., PeerJ 2024).
  function deloadPruefen() {
    const H = heute(), h0 = heuteIso();
    if (G.deload && G.deload.bis >= h0) return null;
    if (G.deloadNein && G.deloadNein >= iso(toDay(h0) - 14 * DAY)) return null;
    if (H && H.ampel === 'rot') return null; // bei rotem Tune liegt es eher an der Erholung
    const stehen = [];
    GRUND.forEach((id) => {
      const V = G.verlauf && G.verlauf[id]; if (!Array.isArray(V) || V.length < 8) return;
      const P2 = []; for (let i = 0; i + 1 < V.length; i += 2) P2.push([V[i], +V[i + 1]]);
      const letzte = P2.slice(-3), davor = P2.slice(0, -3);
      if (letzte[0][0] < iso(toDay(h0) - 35 * DAY) || !davor.length) return;
      const bestDavor = Math.max(...davor.map((x) => x[1])), bestLetzte = Math.max(...letzte.map((x) => x[1]));
      if (bestLetzte <= bestDavor * 1.005 || letzte[2][1] < letzte[0][1] * 0.975) stehen.push(BY[id].name);
    });
    return stehen.length ? stehen : null;
  }

  const deloadAktiv = () => !!(G.deload && G.deload.bis >= heuteIso());
  const sanftAktiv = () => !!(window.tfTageslauf && tfTageslauf.sanftAktiv && tfTageslauf.sanftAktiv()); // Version 11: sanfte Woche nach einer Pause
  function deloadHinweis() {
    if (!deloadAktiv() && sanftAktiv()) {
      const v = tfTageslauf.sanft();
      return el('p', { class: 'tf-gym-hinweis' }, dot('blue'), el('span', null, 'Sanfte Woche bis ' + datumKurz(v.bis) + ': weniger Sätze bei gleichem Gewicht – so steigst du ruhig wieder ein. ', warum('Nach ein paar Tagen Pause ist die Kraft noch da – Sehnen und Gelenke mögen aber einen ruhigen Wiedereinstieg. Darum stehen diese Woche etwa 40 % weniger Sätze im Workout.', 'Gabbett, Br J Sports Med 2016')));
    }
    if (deloadAktiv()) {
      const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Beenden');
      b.addEventListener('click', () => { G.deload = null; speichern(true); neu(); A().toast('Deload beendet'); });
      return el('p', { class: 'tf-gym-hinweis' }, dot('blue'), el('span', null, 'Deload-Woche bis ' + datumKurz(G.deload.bis) + ': etwa 40 % weniger Sätze bei gleichem Gewicht – danach geht es meist wieder vorwärts. ', warum('Deshalb stehen diese Woche weniger Sätze im Workout: Wenn eine Grundübung drei Einheiten lang nicht steigt, braucht der Körper meist Erholung, nicht mehr Volumen.', 'Bell et al., Sports Med Open 2024'), ' ', b));
    }
    const L = deloadPruefen(); if (!L) return null;
    const ja = el('button', { type: 'button', class: 'tf-gym-link' }, 'Deload-Woche starten');
    ja.addEventListener('click', () => { G.deload = { ab: heuteIso(), bis: iso(toDay(heuteIso()) + 6 * DAY) }; tauschLeeren(false); speichern(true); neu(); A().toast('Deload-Woche bis ' + datumKurz(G.deload.bis)); });
    const nein = el('button', { type: 'button', class: 'tf-gym-link' }, 'Nicht jetzt');
    nein.addEventListener('click', () => { G.deloadNein = heuteIso(); speichern(true); neu(); });
    return el('p', { class: 'tf-gym-hinweis tf-gym-deload' }, dot('orange'), el('span', null, 'Bei ' + L.join(' und ') + ' geht es seit drei Einheiten nicht voran – obwohl dein Tune passt. Eine leichtere Woche hilft dann oft: etwa 40 % weniger Sätze, gleiches Gewicht (Deload). ', ja, ' · ', nein));
  }

  /* ---------- Version 10: Fokus-Ansicht „Jetzt läuft“ ----------
     Blendet Menüs, Reiter und Statistiken aus: nur die aktuelle Übung, Gewicht, Wiederholungen und die Pause in großer
     Schrift. Große +/−-Tasten (gedrückt halten zählt schneller); „Satz geschafft“ oder nach rechts wischen hakt ab. */
  const kgSchritt = (u) => (JE_HAND.has(u.id) || u.id === 'goblet' ? 1 : 2.5);
  function stepper(o) { // { wert, platz, schritt, min, max, label, einheit, dezimal, onWert }
    let v = o.wert, warte = null, takt = null, zeiger = false;
    const fmt = (x) => (o.dezimal ? kgZahl(x) : String(Math.round(x)));
    const inp = el('input', { class: 'tf-st-w num', inputmode: o.dezimal ? 'decimal' : 'numeric', autocomplete: 'off', 'aria-label': o.label });
    const malen = () => { inp.value = v == null ? '' : fmt(v); inp.placeholder = o.platz != null ? fmt(o.platz) : '–'; };
    const setz = (x) => { v = x == null ? null : Math.max(o.min, Math.min(o.max, Math.round(x / o.schritt) * o.schritt)); v = v == null ? null : Math.round(v * 100) / 100; malen(); o.onWert(v); };
    const tick = (r) => setz((v != null ? v : o.platz != null ? o.platz : o.min) + r * o.schritt);
    const los = () => { clearTimeout(warte); clearInterval(takt); };
    const knopf = (r, icon, txt) => {
      const b = el('button', { type: 'button', class: 'tf-st-k', 'aria-label': o.label + ': ' + txt }, svgIco(icon));
      b.addEventListener('pointerdown', () => { zeiger = true; tick(r); los(); warte = setTimeout(() => { takt = setInterval(() => tick(r), 90); }, 420); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, los));
      b.addEventListener('click', () => { if (zeiger) { zeiger = false; return; } tick(r); }); // Tastatur
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };
    inp.addEventListener('input', () => { const x = zahlVon(inp.value); v = x != null && x >= o.min && x <= o.max ? x : null; o.onWert(v); });
    inp.addEventListener('blur', malen);
    malen();
    return el('div', { class: 'tf-st' }, knopf(-1, 'i-minus', 'weniger'), el('label', { class: 'tf-st-m' }, inp, el('small', { text: o.einheit })), knopf(1, 'i-plus', 'mehr'));
  }
  function schritteVon(W) { // alle Sätze in Reihenfolge: Übung für Übung, im Zirkel Runde für Runde
    const S = heuteSaetze(), L = [];
    W.liste.forEach((f) => { let R = S[f.u.id]; if (!Array.isArray(R)) R = S[f.u.id] = []; const n0 = Math.max(1, Math.min(SATZ_MAX, f.v.saetze || 1)); while (R.length < n0) R.push([null, null, 0]); });
    if (W.Z.zirkel) { const n = Math.max(...W.liste.map((f) => S[f.u.id].length)); for (let r = 0; r < n; r++) W.liste.forEach((f, j) => { if (r < S[f.u.id].length) L.push({ f, j, r }); }); }
    else W.liste.forEach((f, j) => S[f.u.id].forEach((x, r) => L.push({ f, j, r })));
    return L;
  }
  function fokusAnsicht(W) {
    const root = document.getElementById('tf'); if (!root || !W || !W.liste.length) return;
    const S = heuteSaetze(), L = schritteVon(W), zirkel = !!W.Z.zirkel, wort = zirkel ? 'Runde' : 'Satz', EF = einschaetzung(W); // Version 46: Einschätzung für „Andere Übung“
    const offenAb = (p) => { for (let k = p; k < L.length; k++) if (!S[L[k].f.u.id][L[k].r][2]) return k; for (let k = 0; k < p; k++) if (!S[L[k].f.u.id][L[k].r][2]) return k; return L.length; };
    let pos = offenAb(0), anl = false, uhr = null;
    const box = el('div', { class: 'tf-fp tf-fk', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Jetzt läuft: ' + titelVon() });
    // Version 11: Bildschirm bleibt an, solange die Fokus-Ansicht offen ist (auch zwischen den Pausen)
    let sperre = null;
    const wach = async () => { try { if (navigator.wakeLock && !sperre && document.visibilityState === 'visible') { sperre = await navigator.wakeLock.request('screen'); sperre.addEventListener('release', () => { sperre = null; }); } } catch (e) { sperre = null; } };
    const sichtbar = () => { if (document.visibilityState === 'visible') wach(); };
    document.addEventListener('visibilitychange', sichtbar);
    const zu = () => { clearInterval(uhr); document.removeEventListener('keydown', esc); document.removeEventListener('visibilitychange', sichtbar); if (sperre) { try { sperre.release(); } catch (e) { /* egal */ } sperre = null; } box.remove(); document.body.classList.remove('tf-sheet-offen', 'tf-fokus-an'); neu(); };
    const esc = (e) => { if (e.key === 'Escape') zu(); };
    const zuK = el('button', { type: 'button', class: 'tf-fp-k zu', 'aria-label': 'Fokus-Ansicht schließen' }, svgIco('i-x'));
    zuK.addEventListener('click', zu);
    const kopfT = el('div', { class: 'tf-fp-ph' }), balken = el('i');
    const zeitT = el('b', { class: 'tf-fk-zeit num', role: 'timer' }), uhrT = el('small'), uhrBar = el('i');
    const plus30 = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, svgIco('i-plus'), ' 30 s');
    plus30.addEventListener('click', () => { if (window.tfTimer) tfTimer.dazu(30); uhrMalen(); });
    const skip = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-plain' }, 'Pause überspringen');
    skip.addEventListener('click', () => { if (window.tfTimer) tfTimer.stopp(true); uhrMalen(); });
    const uhrBox = el('div', { class: 'tf-fk-uhr', hidden: true }, el('div', { class: 'tf-fk-uhr-t' }, el('span', { text: 'Pause' }), zeitT, uhrT), el('div', { class: 'tf-fk-uhr-k' }, plus30, skip), el('span', { class: 'tf-fk-uhr-bar' }, uhrBar));
    const mitte = el('div', { class: 'tf-fk-mitte' });
    box.append(el('div', { class: 'tf-fp-kopf' }, kopfT, window.tfTimer ? tfTimer.tonKnopf('tf-fp-k tf-fp-ton') : null, zuK), el('div', { class: 'tf-fp-bar' }, balken), uhrBox, mitte);
    function uhrMalen() {
      const z = window.tfTimer && tfTimer.zustand();
      uhrBox.hidden = !z;
      if (!z) return;
      zeitT.textContent = mmssG(z.rest / 1000); uhrT.textContent = z.sub || '';
      uhrBar.style.width = (100 * (1 - z.rest / (z.sek * 1000))).toFixed(1) + '%';
    }
    function pauseStarten(p) { // Pause nach dem Satz – im Zirkel erst nach der Runde
      if (!window.tfTimer || p >= L.length) return;
      const jetzt = L[pos], dann = L[p];
      if (zirkel) { if (dann.r !== jetzt.r) tfTimer.start({ titel: 'Zirkel', sub: 'Dann Runde ' + (dann.r + 1), phasen: [{ name: 'Pause', sek: 90, art: 'pause' }], plus30: true, farbe: 'purple' }); return; }
      const ps = jetzt.f.v.ps || dann.f.v.ps; if (!ps) return;
      tfTimer.start({ titel: jetzt.f.u.name, sub: dann.f === jetzt.f ? 'Dann ' + wort + ' ' + (dann.r + 1) + ' von ' + S[dann.f.u.id].length : 'Dann: ' + dann.f.u.name, phasen: [{ name: 'Pause', sek: ps, art: 'pause' }], plus30: true, farbe: 'purple' });
    }
    function zeichnen() {
      const fertigN = L.filter((x) => S[x.f.u.id][x.r][2]).length;
      balken.style.width = (100 * fertigN) / Math.max(1, L.length) + '%';
      uhrMalen();
      if (pos >= L.length) {
        kopfT.replaceChildren(el('b', { text: titelVon() }), el('span', { text: fertigN + ' von ' + L.length + (zirkel ? ' Übungen' : ' Sätzen') + ' geschafft' }));
        const vol = W.liste.reduce((x, f) => x + S[f.u.id].reduce((y, r) => y + (r[2] && r[0] > 0 && r[1] > 0 ? r[0] * r[1] * (JE_HAND.has(f.u.id) ? 2 : 1) : 0), 0), 0);
        const fertigB = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-check'), ' Workout abschließen');
        fertigB.addEventListener('click', () => { zu(); rueckmeldung(W); });
        const zur = el('button', { type: 'button', class: 'tf-btn' }, 'Zurück zu den Sätzen');
        zur.addEventListener('click', () => { pos = Math.max(0, L.length - 1); zeichnen(); });
        mitte.replaceChildren(el('div', { class: 'tf-fp-fertig' }, el('span', { class: 'tf-fp-fertig-i' }, svgIco('i-check')),
          el('h2', { text: fertigN === L.length ? 'Alle Sätze geschafft' : 'Fertig für heute?' }),
          el('p', { text: fertigN + (zirkel ? ' Übungen' : ' Sätze') + (vol ? ' · ' + nf(Math.round(vol)) + ' kg bewegt' : '') }), el('div', { class: 'tf-form-actions' }, fertigB, zur)));
        fertigB.focus({ preventScroll: true });
        return;
      }
      const { f, j, r } = L[pos], u = f.u, v = f.v, R = S[u.id], row = R[r], last = f.last, kgSp = mitGewicht(u, v), zus = messarten(u)[0] === 'zusatz', sek = !!v.halten;
      const vs = satzVorschlag(u, v, last, R, r), vorher = zuletztVon(u.id);
      kopfT.replaceChildren(el('b', { text: 'Übung ' + (j + 1) + ' von ' + W.liste.length }), el('span', { text: fertigN + ' von ' + L.length + (zirkel ? ' geschafft' : ' Sätzen geschafft') }));
      const merk = () => { S.d = heuteIso(); speichern(); };
      const steppers = el('div', { class: 'tf-fk-st' + (kgSp ? '' : ' eins') });
      const radarF = el('p', { class: 'tf-gs-radar tf-fk-radar', 'aria-live': 'polite' }); // Version 13
      const radarMalen = () => { const rd = radarVon(u, v, last, R, r); radarF.replaceChildren(...(rd ? [svgIco(rd.neu ? 'i-trophy' : 'i-target'), el('span', { text: rd.text })] : [])); radarF.classList.toggle('neu', !!(rd && rd.neu)); radarF.hidden = !rd; };
      if (kgSp) steppers.appendChild(stepper({ wert: row[0], platz: vs.kg, schritt: kgSchritt(u), min: 0, max: 500, dezimal: true, label: zus ? 'Zusatzgewicht' : 'Gewicht', einheit: (zus ? '+ kg' : 'kg') + (JE_HAND.has(u.id) ? ' je Hand' : ''), onWert: (x) => { row[0] = x; merk(); radarMalen(); } }));
      steppers.appendChild(stepper({ wert: row[1], platz: vs.w, schritt: sek ? 5 : 1, min: 1, max: sek ? 900 : 200, label: sek ? 'Sekunden' : 'Wiederholungen', einheit: sek ? 'Sekunden' : 'Wdh.', onWert: (x) => { row[1] = x; merk(); radarMalen(); } }));
      radarMalen();
      const geistF = geistVon(u, r, { kg: kgSp, zusatz: zus, sek });
      const geschafft = () => {
        if (!satzAbhaken(u, v, last, R, r)) { A().toast(sek ? 'Wie viele Sekunden?' : 'Wie viele Wiederholungen?'); return; }
        speichern(true);
        const p = offenAb(pos + 1);
        pauseStarten(p);
        pos = p; zeichnen();
      };
      const karteF = el('div', { class: 'tf-fk-karte' + (row[2] ? ' fertig' : '') },
        el('p', { class: 'tf-fk-satz' }, wort + ' ' + (r + 1) + ' von ' + R.length, row[2] ? el('span', { class: 'tf-fk-ok' }, svgIco('i-check'), ' geschafft') : null),
        el('h2', { class: 'tf-fk-name' }, u.name),
        el('p', { class: 'tf-fk-ziel' }, 'Vorgabe: ' + v.text + (last ? ' · ' + last.txt : '') + (v.pause ? ' · Pause ' + v.pause : ''), last && last.lang ? warum('Dein Gewicht: ' + last.lang + '.') : null),
        steppers, radarF,
        geistF ? el('p', { class: 'tf-fk-geist' }, el('span', { text: wort + ' ' + (r + 1) + ' letztes Mal' }), el('b', { class: 'num', text: geistF })) : null,
        vorher ? el('p', { class: 'tf-fk-vorher', text: 'Letztes Mal (' + datumKurz(vorher.d) + '): ' + saetzeText(vorher.s, { kg: kgSp, zusatz: zus, sek }) }) : null);
      if (!row[2] && wischen) wischen(karteF, geschafft, { text: 'Geschafft' });
      const haupt = row[2]
        ? el('button', { type: 'button', class: 'tf-btn tf-fk-haupt' }, svgIco('i-sync'), ' Nochmal – nicht geschafft')
        : el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-fk-haupt' }, svgIco('i-check'), ' ' + wort + ' geschafft');
      haupt.addEventListener('click', row[2] ? () => { row[2] = 0; speichern(true); zeichnen(); } : geschafft);
      const nav = el('div', { class: 'tf-fk-nav' });
      const zurK = el('button', { type: 'button', class: 'tf-fp-k', 'aria-label': 'Vorheriger ' + wort, disabled: pos === 0 }, svgIco('i-prev'));
      zurK.addEventListener('click', () => { pos = Math.max(0, pos - 1); zeichnen(); });
      const anlK = el('button', { type: 'button', class: 'tf-fp-mehr', 'aria-expanded': String(anl) }, anl ? 'Anleitung ausblenden' : 'Anleitung');
      anlK.addEventListener('click', () => { anl = !anl; zeichnen(); if (anl) { const a = box.querySelector('.tf-fp-anl'); if (a) a.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }); // Version 43: aufgeklappte Anleitung kommt ins Bild
      const vorK = el('button', { type: 'button', class: 'tf-fp-k', 'aria-label': 'Nächster ' + wort }, svgIco('i-next'));
      vorK.addEventListener('click', () => { pos = Math.min(L.length, pos + 1); zeichnen(); });
      nav.append(zurK, anlK, vorK);
      const teile = [karteF, haupt];
      if (sek && window.tfTimer) {
        const h = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-timer'), ' Halten: ' + (row[1] || vs.w || 30) + ' s');
        h.addEventListener('click', () => { tfTimer.start({ titel: u.name, sub: 'Halten', phasen: [{ name: 'Halten', sek: row[1] || vs.w || 30, art: 'arbeit' }], farbe: 'purple' }); uhrMalen(); });
        teile.push(h);
      }
      teile.push(nav);
      // Version 43: Gerät besetzt? Unter der Anleitung dieselbe Auswahl wie in der Liste – danach geht es mit der neuen Übung weiter
      const tauschF = W.pool ? tauschBlock(u, Object.assign(tauschOptionen(f, W, EF), { waehle: (id) => { tauschWahl(f, id); speichern(true); zu(); setTimeout(() => { const W2 = workout(); if (W2 && W2.liste.length) fokusAnsicht(W2); }, 60); } }), u.id !== f.orig, true) : null;
      if (anl) teile.push(el('div', { class: 'tf-fp-anl' }, el('div', { class: 'tf-gym-trifft' }, ...trifftTeil(u)), el('ol', { class: 'tf-steps' }, ...u.schritte.map((t) => el('li', { text: t }))), el('p', null, el('b', { text: 'Worauf achten: ' }), u.achte), tauschF)); // Version 27: Muskeln am Körper
      mitte.replaceChildren(...teile);
    }
    document.body.classList.add('tf-sheet-offen', 'tf-fokus-an');
    document.addEventListener('keydown', esc);
    root.appendChild(box);
    zeichnen();
    wach();
    uhr = setInterval(uhrMalen, 250);
    const erster = box.querySelector('.tf-fk-haupt'); if (erster) erster.focus({ preventScroll: true });
  }
  const mmssG = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- Version 13: PR-Radar, Geist-Satz und Mini-Verlauf ----------
     PR-Radar: Schon beim Eintippen zeigt die App, ob der Satz ein neuer Rekord würde (geschätztes Maximum wie im Verlauf,
     mit 2 Wiederholungen Reserve) – oder wie viele Wiederholungen dafür fehlen. Geist-Satz: derselbe Satz vom letzten Mal
     als ruhiger Vergleich. Mini-Verlauf: geschätztes Maximum und Volumen der letzten Einheiten beim Aufklappen der Übung. */
  function radarVon(u, v, last, R, i) {
    const pr = G.pr[u.id]; if (!Array.isArray(pr) || !(+pr[1] > 0) || v.halten || v.plyo) return null;
    const row = R[i]; if (!row) return null;
    const vs = satzVorschlag(u, v, last, R, i), kg = row[0] != null ? row[0] : vs.kg, w = row[1] != null ? row[1] : vs.w;
    const art = satzArt(u, kg > 0, (a) => (a.includes('wdh') ? 'wdh' : a.includes('kg') ? 'kg' : null)); if (!art) return null;
    if (prArt(pr, u) && prArt(pr, u) !== (art === 'wdh' ? 'wdh' : 'last')) return null;
    const ziel = +pr[1] * 1.005, est = (n) => maxAus(art, art === 'wdh' ? 0 : kg || 0, n, 2);
    if (!(w > 0) || (art !== 'wdh' && !(kg > 0))) return null;
    if (est(w) > ziel) return { neu: true, text: row[2] ? 'Neuer Rekord – geschätztes Maximum ' + (art === 'wdh' ? Math.round(est(w)) + ' Wdh.' : kgTxt(Math.round(est(w) * 2) / 2)) : 'Schaffst du das, ist es ein neuer Rekord.' };
    if (row[2]) return null;
    for (let n = w + 1; n <= Math.min(30, w + 3); n++) if (est(n) > ziel) { const k = n - w; return { neu: false, text: 'Noch ' + (k === 1 ? '1 Wiederholung' : k + ' Wiederholungen') + ' bis zum Rekord.' }; }
    if (art === 'kg') { const kgN = runden(ziel * pct(w + 2) + 0.01, u); if (kgN > kg && kgN - kg <= Math.max(5, kg * 0.08)) return { neu: false, text: 'Mit ' + kgTxt(kgN) + ' × ' + w + ' wäre es ein neuer Rekord.' }; }
    return null;
  }
  function geistVon(u, i, o) { // derselbe Satz vom letzten Mal
    const vorher = zuletztVon(u.id); if (!vorher) return null;
    const x = vorher.s[i]; if (!x) return null;
    const einheit = o.sek ? ' s' : ' Wdh.';
    return (o.kg && x[0] != null && !(x[0] === 0 && !o.zusatz) ? (o.zusatz && x[0] > 0 ? '+' : '') + kgZahl(x[0]) + ' × ' + x[1] : x[1] + einheit);
  }
  function miniVerlauf(u) { // geschätztes Maximum (Linie) und Volumen (Säulen) der letzten Einheiten
    const V = G.verlauf[u.id], VV = G.vol[u.id]; if (!Array.isArray(V) || V.length < 4) return null;
    let P2 = []; for (let i = 0; i + 1 < V.length; i += 2) P2.push({ d: V[i], e: +V[i + 1], v: null });
    if (Array.isArray(VV)) for (let i = 0; i + 1 < VV.length; i += 2) { const p = P2.find((x) => x.d === VV[i]); if (p) p.v = +VV[i + 1]; }
    const vier = P2.filter((x) => x.d >= iso(toDay(heuteIso()) - 28 * DAY));
    P2 = vier.length >= 2 ? vier : P2.slice(-6);
    if (P2.length < 2) return null;
    const art = prArt(G.pr[u.id], u) || 'last', W = 280, H = 70, NS = 'http://www.w3.org/2000/svg';
    const es = P2.map((x) => x.e), lo = Math.min(...es), hi = Math.max(...es), sp = Math.max(hi - lo, hi * 0.04 || 1), vmax = Math.max(1, ...P2.map((x) => x.v || 0));
    const xs = (j) => 10 + (j * (W - 20)) / (P2.length - 1), ys = (e) => 10 + (1 - (e - lo + sp * 0.15) / (sp * 1.3)) * (H - 26);
    const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.setAttribute('class', 'tf-gym-spark'); sv.setAttribute('role', 'img');
    const bw = Math.min(18, (W - 20) / P2.length * 0.5);
    P2.forEach((x, j) => { if (!x.v) return; const h = Math.max(2, (x.v / vmax) * 22), r = document.createElementNS(NS, 'rect'); r.setAttribute('x', (xs(j) - bw / 2).toFixed(1)); r.setAttribute('y', (H - 4 - h).toFixed(1)); r.setAttribute('width', bw.toFixed(1)); r.setAttribute('height', h.toFixed(1)); r.setAttribute('rx', '2'); r.setAttribute('class', 'vol'); sv.appendChild(r); });
    const pfad = document.createElementNS(NS, 'path'); pfad.setAttribute('d', P2.map((x, j) => (j ? 'L' : 'M') + xs(j).toFixed(1) + ',' + ys(x.e).toFixed(1)).join('')); pfad.setAttribute('class', 'max'); sv.appendChild(pfad);
    P2.forEach((x, j) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', xs(j).toFixed(1)); c.setAttribute('cy', ys(x.e).toFixed(1)); c.setAttribute('r', j === P2.length - 1 ? '4' : '2.4'); c.setAttribute('class', j === P2.length - 1 ? 'end' : 'pkt'); sv.appendChild(c); });
    const a0 = P2[0].e, a1 = P2[P2.length - 1].e, diff = a0 > 0 ? (100 * (a1 - a0)) / a0 : 0;
    const wert = art === 'wdh' ? Math.round(a1) + ' Wdh.' : kgTxt(Math.round(a1 * 2) / 2);
    sv.setAttribute('aria-label', 'Geschätztes Maximum ' + wert + ', ' + (diff >= 0 ? 'plus ' : 'minus ') + nf(Math.abs(diff), 0) + ' Prozent');
    const letzteV = P2[P2.length - 1].v;
    return el('div', { class: 'tf-gym-verlauf' }, el('div', { class: 'tf-gym-verlauf-k' }, el('span', { class: 'tf-augenbraue', text: vier.length >= 2 ? 'Letzte 4 Wochen' : 'Letzte Einheiten' }),
      el('b', { class: 'num', text: 'Max ≈ ' + wert }), el('small', { class: diff >= 0.5 ? 'gut' : diff <= -0.5 ? 'runter' : '', text: (diff >= 0 ? '+' : '−') + nf(Math.abs(diff), 0) + ' %' + (letzteV ? ' · Volumen ' + nf(letzteV) + (art === 'wdh' ? ' Wdh.' : ' kg') : '') })), sv);
  }
  function satzTabelle(u, v, last, o) {
    o = o || {};
    const S = heuteSaetze(), n0 = Math.max(1, Math.min(SATZ_MAX, v.saetze || 1)), kgSp = mitGewicht(u, v), zus = messarten(u)[0] === 'zusatz', sek = !!v.halten;
    const vorher = zuletztVon(u.id), wort = o.zirkel ? 'Runde' : 'Satz', hand = JE_HAND.has(u.id) ? ' je Hand' : '';
    const box = el('div', { class: 'tf-gs', id: 'saetze-' + u.id });
    let radarZeigen = () => {};
    const zeilen = () => { let R = S[u.id]; if (!Array.isArray(R)) R = S[u.id] = []; while (R.length < n0) R.push([null, null, 0]); return R; };
    const vorschlag = (i, R) => satzVorschlag(u, v, last, R, i);
    function merken(sofort) { S.d = heuteIso(); speichern(sofort); fertigMarke(); }
    function fertigMarke() { const R = zeilen(), d = box.closest('.tf-gym-ue'); if (d) d.classList.toggle('tf-gym-u-fertig', R.length > 0 && R.every((r) => r[2])); }
    function bauen(fokus) {
      const R = zeilen(), VS = R.map((r, i) => vorschlag(i, R)), ins = [];
      const kopf = el('div', { class: 'tf-gs-k' }, el('b', { text: o.zirkel ? 'Deine Runden' : 'Deine Sätze' }),
        el('small', { text: vorher ? 'Letztes Mal (' + datumKurz(vorher.d) + '): ' + saetzeText(vorher.s, { kg: kgSp, zusatz: zus, sek }) : 'Trag ein, was du schaffst' }));
      const tab = el('div', { class: 'tf-gs-t' + (kgSp ? '' : ' ohne-kg'), role: 'group', 'aria-label': (o.zirkel ? 'Runden: ' : 'Sätze: ') + u.name });
      tab.appendChild(el('div', { class: 'tf-gs-h', 'aria-hidden': 'true' }, el('span', { text: wort }), kgSp ? el('span', { text: (zus ? '+ kg' : 'kg') + hand }) : null, el('span', { text: sek ? 'Sekunden' : 'Wdh.' }), el('span', { text: 'Fertig' })));
      const neuVorschlag = () => R.forEach((r, i) => { VS[i] = vorschlag(i, R); const [ki, wi] = ins[i]; if (ki) ki.placeholder = VS[i].kg != null ? kgZahl(VS[i].kg) : '–'; wi.placeholder = VS[i].w != null ? String(VS[i].w) : ''; });
      R.forEach((r, i) => {
        const nr = i + 1;
        const ki = kgSp ? el('input', { class: 'tf-input tf-gs-in', inputmode: 'decimal', enterkeyhint: 'next', autocomplete: 'off', 'aria-label': wort + ' ' + nr + ': ' + (zus ? 'Zusatzgewicht' : 'Gewicht') + ' in kg' + hand }) : null;
        const wi = el('input', { class: 'tf-input tf-gs-in', inputmode: 'numeric', enterkeyhint: 'done', autocomplete: 'off', 'aria-label': wort + ' ' + nr + ': ' + (sek ? 'Sekunden' : 'Wiederholungen') });
        if (ki && r[0] != null) ki.value = kgZahl(r[0]);
        if (r[1] != null) wi.value = String(r[1]);
        ins.push([ki, wi]);
        const ok = el('button', { type: 'button', class: 'tf-gs-ok', 'aria-pressed': String(!!r[2]), 'aria-label': wort + ' ' + nr + ' geschafft' }, svgIco('i-check'));
        if (ki) ki.addEventListener('input', () => { const x = zahlVon(ki.value); r[0] = x != null && x >= 0 && x <= 500 ? Math.round(x * 100) / 100 : null; neuVorschlag(); merken(); radarZeigen(i); });
        wi.addEventListener('input', () => { const x = zahlVon(wi.value); r[1] = x != null && x >= 1 && x <= (sek ? 900 : 200) ? Math.round(x) : null; neuVorschlag(); merken(); radarZeigen(i); });
        if (ki) ki.addEventListener('focus', () => radarZeigen(i)); wi.addEventListener('focus', () => radarZeigen(i));
        ok.addEventListener('click', () => {
          if (!r[2]) {
            if (!satzAbhaken(u, v, last, R, i)) { wi.focus(); A().toast(sek ? 'Wie viele Sekunden?' : 'Wie viele Wiederholungen?'); return; }
            const weiter = R.findIndex((x, j) => j > i && !x[2]);
            if (!o.zirkel && v.ps && weiter >= 0 && window.tfTimer) tfTimer.start({ titel: u.name, sub: 'Dann ' + wort + ' ' + (weiter + 1) + ' von ' + R.length, phasen: [{ name: 'Pause', sek: v.ps, art: 'pause' }], plus30: true, farbe: 'purple', pille: true }); // Version 13: schwebende Pille
            const rd = radarVon(u, v, last, R, i); if (rd && rd.neu) A().toast(rd.text, 4500);
          } else r[2] = 0;
          merken(true); bauen(i);
        });
        const geist = geistVon(u, i, { kg: kgSp, zusatz: zus, sek }); // Version 13
        const zeile = el('div', { class: 'tf-gs-z' + (r[2] ? ' fertig' : '') }, el('span', { class: 'tf-gs-nr num', text: String(nr) }), ki, wi, ok, geist ? el('small', { class: 'tf-gs-geist', text: 'zuletzt ' + geist }) : null);
        if (wischen && !r[2]) wischen(zeile, () => ok.click(), { text: 'Geschafft' }); // nach rechts wischen = abhaken
        tab.appendChild(zeile);
      });
      neuVorschlag();
      const radar = el('p', { class: 'tf-gs-radar', 'aria-live': 'polite' }); // Version 13
      radarZeigen = (j) => { const rd = radarVon(u, v, last, R, j == null ? Math.max(0, R.findIndex((x) => !x[2])) : j); radar.replaceChildren(...(rd ? [svgIco(rd.neu ? 'i-trophy' : 'i-target'), el('span', { text: rd.text })] : [])); radar.classList.toggle('neu', !!(rd && rd.neu)); radar.hidden = !rd; };
      const akt = el('div', { class: 'tf-gs-akt' });
      if (R.length < SATZ_MAX) {
        const plus = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, svgIco('i-plus'), ' ' + wort);
        plus.addEventListener('click', () => { R.push([null, null, 0]); merken(); bauen(); });
        akt.appendChild(plus);
      }
      if (R.length > n0 && !R[R.length - 1][2]) {
        const weg = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, svgIco('i-x'), ' Letzte entfernen');
        weg.addEventListener('click', () => { R.pop(); merken(); bauen(); });
        akt.appendChild(weg);
      }
      if (!o.zirkel && v.pause) akt.appendChild(el('small', { text: 'Pause ' + v.pause + ' startet beim Abhaken' }));
      box.replaceChildren(kopf, tab, radar, akt);
      radarZeigen(R.findIndex((x) => !x[2]) >= 0 ? R.findIndex((x) => !x[2]) : null);
      fertigMarke();
      if (fokus != null) { const b = tab.querySelectorAll('.tf-gs-ok')[fokus]; if (b) b.focus({ preventScroll: true }); }
    }
    bauen();
    return box;
  }

  const GER = { gym: 'Studio', hantel: 'Hanteln', band: 'Band', ohne: 'ohne Geräte' };
  function trifftTeil(u) { // Körper vorne und hinten: Zielmuskeln kräftig, mitarbeitende hell – daneben dieselben Namen
    const chip = (m, an) => el('span', { class: 'tf-gym-mk' + (an ? ' an' : '') }, el('i', { 'aria-hidden': 'true' }), MUSKELN[m]);
    return [koerper({ an: new Set(u.ziel), mit: new Set(u.mit), klein: true }),
      el('div', { class: 'tf-gym-trifft-t' },
        el('small', { text: 'Trifft vor allem' }), el('div', { class: 'tf-gym-mks' }, ...u.ziel.map((m) => chip(m, true))),
        u.mit.length ? el('small', { text: 'Arbeitet mit' }) : null, u.mit.length ? el('div', { class: 'tf-gym-mks' }, ...u.mit.map((m) => chip(m, false))) : null,
        u.muskeln ? el('p', { class: 'tf-gym-trifft-a', text: u.muskeln }) : null)];
  }
  function uebung(u, nr, v, tausch, last, o) {
    o = o || {};
    const getauscht = !!(tausch && tausch.orig && tausch.orig.id !== u.id);
    const d = el('details', { class: 'tf-gym-u', id: 'ueb-' + u.id });
    d.appendChild(el('summary', null, el('span', { class: 'tf-gym-nr num', text: String(nr) }), el('span', { class: 'tf-gym-ut' }, el('b', { text: u.name }), el('small', null, v.text, last ? el('b', { class: 'tf-gym-kg', text: ' · ' + last.txt }) : null, last && last.lang ? warum('Dein Gewicht: ' + last.lang + '.') : null, v.pause ? ' · Pause ' + v.pause : '', getauscht ? el('span', { class: 'tf-gym-getauscht', text: ' · getauscht' }) : null), fuerChips(u)), el('span', { class: 'tf-gym-mu', text: u.ziel.map((m) => MUSKELN[m]).join(', ') })));
    // Version 27: welche Muskeln die Übung trifft – am Körper, gezeichnet erst, wenn die Anleitung aufgeht
    const trifft = el('div', { class: 'tf-gym-trifft' });
    d.addEventListener('toggle', () => { if (d.open && !trifft.childElementCount) trifft.append(...trifftTeil(u)); });
    const body = el('div', { class: 'tf-gym-body' }, trifft,
      el('ol', { class: 'tf-steps' }, ...u.schritte.map((s) => el('li', { text: s }))),
      el('p', { class: 'tf-gym-achte' }, el('b', { text: 'Worauf achten: ' }), u.achte),
      (() => { const st = u.typ === 'mobil' ? null : uebAussage(u); return st ? el('p', { class: 'tf-gym-imrennen', style: '--c:var(--tf-' + DFARBE[st.d] + ')' }, el('b', { text: 'Im Wettkampf: ' }), st.titel + ' – ' + st.text) : null; })(),
      el('div', { class: 'tf-gym-var' }, el('div', null, el('small', { text: 'Leichter' }), el('span', { text: u.leichter })), el('div', null, el('small', { text: 'Schwerer' }), el('span', { text: u.schwerer }))),
      el('div', { class: 'tf-gym-tags' }, ...u.ziel.map((m) => el('span', { class: 'tf-pf-tag tf-gym-tag-an', text: MUSKELN[m] })), ...u.mit.map((m) => el('span', { class: 'tf-pf-tag', text: MUSKELN[m] })), ...(u.geraet.length === 4 ? ['überall'] : u.geraet.map((g) => GER[g])).map((t) => el('span', { class: 'tf-pf-tag tf-gym-tag-g', text: t }))));
    if (v.schwer) body.prepend(el('p', { class: 'tf-gym-last' }, svgIco('i-flame'), el('span', null, el('b', { text: 'Für dich: ' }), v.schwer + ' – die Grundform ist für deine Stufe zu leicht.')));
    const mv = miniVerlauf(u); if (mv) body.prepend(mv); // Version 13
    if (last) body.prepend(el('p', { class: 'tf-gym-last' }, svgIco('i-gauge'), el('span', null, el('b', { text: 'Dein Gewicht: ' }), last.lang + '.')));
    if (tausch) body.appendChild(tauschBlock(u, tausch, getauscht));
    d.appendChild(body);
    if (!o.saetze || !(v.saetze >= 1)) return d;
    // Version 10: Sätze stehen immer sichtbar unter der Übung – die Anleitung klappt darüber auf
    const wrap = el('div', { class: 'tf-gym-ue' }, d, satzTabelle(u, v, last, { zirkel: o.zirkel }));
    wrap.details = d;
    return wrap;
  }

  // Was einen Vorschlag unterscheidet: Gerät oder Körpergewicht, einseitig, und Muskeln nur, wenn sie vom Original abweichen
  function tauschInfo(x, haupt) {
    const art = istSprung(x) ? 'Sprünge' : x.typ === 'plyo' ? 'Explosiv' : x.art === 'halten' ? 'Halten' : x.art === 'koerper' ? 'Körpergewicht' : x.geraet.includes('hantel') ? 'Hanteln' : x.geraet.includes('band') && !x.geraet.includes('gym') ? 'Band' : 'Gerät oder Kabel';
    const anders = x.ziel.some((m) => !haupt.includes(m)) || x.ziel.length < haupt.length ? x.ziel.map((m) => MUSKELN[m]).join(', ') : null;
    return [anders, art, x.einseitig ? 'je Seite' : null, x.stufe === 3 ? 'anspruchsvoll' : null].filter(Boolean).join(' · ');
  }
  function tauschBlock(u, T0, getauscht, offen) { // Version 43: vier Vorschläge und alle Übungen in einem Auswahlmenü
    const auf = !!(offen || getauscht); // Version 44: in der Liste zugeklappt – die Übungskarte bleibt kurz
    const box = el('div', { class: 'tf-gym-tausch' + (auf ? '' : ' zu'), role: 'group', 'aria-label': 'Andere Übung wählen' });
    const mus = (T0.haupt || []).map((m) => MUSKELN[m]).join(' und ');
    const kopf = el('button', { type: 'button', class: 'tf-gym-tausch-k', 'aria-expanded': String(auf) }, svgIco('i-shuffle'), el('b', { text: 'Andere Übung' }), el('small', { text: getauscht ? 'statt „' + T0.orig.name + '“' + (T0.jetzt && T0.jetzt.zug ? ' – für den Schwerpunkt' : '') : mus ? 'für ' + mus : '' }), svgIco('i-chev'));
    kopf.addEventListener('click', (e) => { e.preventDefault(); const zu = box.classList.toggle('zu'); kopf.setAttribute('aria-expanded', String(!zu)); });
    box.appendChild(kopf);
    if (T0.jetzt) { // Version 46: die neue Einschätzung steht dort, wo getauscht wurde
      const z = el('p', { class: 'tf-gym-tausch-e' }, 'Einheit jetzt: ', el('b', { text: T0.jetzt.titel }), T0.jetzt.dadurch ? ' – durch diesen Tausch ' + T0.jetzt.dadurch + '.' : ' – dieser Tausch lässt den Schwerpunkt, wie er war.');
      if (T0.ansehen) { const k = el('button', { type: 'button', class: 'tf-gym-link' }, 'Einschätzung ansehen'); k.addEventListener('click', (e) => { e.preventDefault(); T0.ansehen(); }); z.append(' ', k); }
      box.appendChild(z);
    }
    if (T0.vorschlaege.length) box.appendChild(el('div', { class: 'tf-gym-tausch-v' }, ...T0.vorschlaege.map((x) => {
      const w = T0.wirkung ? T0.wirkung(x) : null;
      const b = el('button', { type: 'button', class: 'tf-gym-tausch-o', 'data-u': x.id }, el('b', { text: x.name }), el('small', { text: tauschInfo(x, T0.haupt || []) }), T0.wirkung ? el('i', { class: 'tf-gym-tausch-w' + (w ? ' an' : ''), text: w || 'Schwerpunkt bleibt' }) : null);
      b.addEventListener('click', (e) => { e.preventDefault(); T0.waehle(x.id); });
      return b;
    })));
    const n = T0.gruppen.reduce((a, g) => a + g[1].length, 0);
    if (n) {
      const sel = el('select', { class: 'tf-input tf-gym-tausch-s', 'aria-label': 'Andere Übung aus allen Übungen wählen' }, el('option', { value: '', text: 'Übung auswählen …' }),
        ...T0.gruppen.map(([titel, L]) => el('optgroup', { label: titel }, ...L.map((x) => el('option', { value: x.id, text: x.name })))));
      sel.addEventListener('change', () => { if (sel.value) T0.waehle(sel.value); });
      box.appendChild(el('label', { class: 'tf-gym-tausch-l' }, el('span', { text: 'Oder aus allen ' + n + ' Übungen, die zu deinem Ort passen' }), sel));
    }
    if (getauscht) { const z = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-gym-tausch-z' }, svgIco('i-back'), ' Zurück zu „' + T0.orig.name + '“'); z.addEventListener('click', (e) => { e.preventDefault(); T0.waehle(null); }); box.appendChild(z); }
    return box;
  }

  /* ---------- Reserve je Stufe ---------- */
  function reserveText(W) {
    const Z = W.Z;
    if (Z.zirkel || W.z === 'power' || W.z === 'stabil') return Z.rir + '.';
    const r = (W.liste[0] && W.liste[0].v.rir) || Z.rirN[W.niv], t = r[0] === r[1] ? String(r[0]) : r[0] + '–' + r[1];
    const satz = r[1] === 0 ? 'Geh bis an die Grenze – die letzte Wiederholung gerade noch sauber' : 'Hör auf, wenn noch ' + t + (r[1] === 1 ? ' saubere Wiederholung ginge' : ' saubere Wiederholungen gingen');
    return satz + (r[0] === 0 && W.z === 'aufbau' ? ' – bei kleinen Übungen darf der letzte Satz bis zum Muskelversagen gehen' : '') + '.';
  }

  /* ---------- Kraftwerte eintragen ---------- */
  let kraftForm = null; // offenes Formular: { id, art, kg, wdh, rir }
  const RIR_WAHL = [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4+']];
  const datumKurz = (d) => (d ? +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.' : '');
  function maxText(m) { // geschätztes Maximum in Worten
    if (m.a === 'wdh') return '≈ ' + Math.round(m.e) + ' Wdh.';
    if (m.a === 'zusatz') { const x = Math.round((m.e - koerperKg()) * 2) / 2; return x > 0 ? '≈ +' + kgTxt(x) : '≈ ' + Math.max(1, Math.floor(30 * (m.e / koerperKg() - 1))) + ' Wdh.'; }
    return '≈ ' + kgTxt(Math.round(m.e * 2) / 2);
  }
  function satzText(m) {
    if (!m.s) return 'angepasst' + (m.d ? ' am ' + datumKurz(m.d) : '');
    const [kg, wdh, rir] = m.s;
    const last = m.a === 'wdh' ? '' : m.a === 'zusatz' ? (kg > 0 ? '+' + kgTxt(kg) + ' × ' : 'ohne Zusatz × ') : kgTxt(kg) + ' × ';
    return last + wdh + ' Wdh.' + (rir ? ' · ' + rir + ' in Reserve' : '') + (m.d ? ' · ' + datumKurz(m.d) : '') + (m.q === 'anpassung' ? ' · angepasst' : m.q === 'saetze' ? ' · aus deinen Sätzen' : '');
  }
  const GRUND = ['kniebeuge_lh', 'kreuzheben', 'bankdruecken', 'schulterdruecken', 'rudern_kh', 'latzug', 'klimmzug', 'dips', 'hip_thrust', 'beinpresse', 'rdl', 'kh_bank', 'goblet', 'liegestuetz'];
  function kraftKarte() {
    const ids = Object.keys(G.max).filter((id) => BY[id]).sort((a, b) => BY[a].name.localeCompare(BY[b].name, 'de'));
    const c = karte({ farbe: 'purple', icon: 'i-gauge', titel: 'Deine Kraftwerte', sub: ids.length ? 'Daraus rechnet die App das Gewicht für jede Übung' : 'Trag ein, was du schaffst – dann zeigt jede Übung ihr Gewicht', id: 'karte-gym-kraft' });
    if (ids.length) {
      const L = el('div', { class: 'tf-kw-liste' });
      ids.forEach((id) => {
        const u = BY[id], m = G.max[id];
        const bw = m.a === 'kg' && ['kniebeuge_lh', 'kreuzheben', 'bankdruecken', 'hip_thrust'].includes(id) ? nf(m.e / koerperKg(), 2) + ' × Körpergewicht' : null;
        const ed = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': u.name + ' ändern' }, svgIco('i-edit'));
        ed.addEventListener('click', () => { kraftForm = { id, art: m.a, kg: m.s ? m.s[0] : null, wdh: m.s ? m.s[1] : null, rir: m.s ? m.s[2] : 1 }; neu(); });
        const x = el('button', { type: 'button', class: 'tf-kw-k', 'aria-label': u.name + ' löschen' }, svgIco('i-x'));
        x.addEventListener('click', () => { delete G.max[id]; speichern(); neu(); A().toast('Kraftwert gelöscht'); });
        L.appendChild(el('div', { class: 'tf-kw-z' },
          el('span', { class: 'tf-kw-n' }, el('b', { text: u.name + (JE_HAND.has(id) && m.a === 'kg' ? ' (je Hand)' : '') }), el('small', { text: satzText(m) })),
          el('span', { class: 'tf-kw-w' }, el('b', { class: 'num', text: maxText(m) }), el('small', { text: bw || (m.a === 'wdh' ? 'bis zur Grenze' : 'Maximum') })), ed, x));
      });
      c.appendChild(L);
    }
    // Version 10: Bestleistungen aus deinen Sätzen – neueste zuerst
    const prs = Object.entries(G.pr || {}).filter(([id, x]) => BY[id] && Array.isArray(x) && x.length >= 4).sort((a, b) => String(b[1][0]).localeCompare(String(a[1][0])));
    if (prs.length) {
      const P2 = el('div', { class: 'tf-kw-pr' }, el('b', { text: 'Bestleistungen aus deinen Sätzen' }));
      prs.slice(0, 8).forEach(([id, x]) => {
        const art = x[4] || (G.max[id] && G.max[id].a) || artVon(BY[id], [[x[2], x[3], 1]]) || 'kg';
        const satz = art === 'wdh' ? x[3] + ' Wdh.' : (art === 'zusatz' ? (x[2] > 0 ? '+' + kgTxt(x[2]) : 'ohne Zusatz') : kgTxt(x[2])) + ' × ' + x[3];
        P2.appendChild(el('p', { class: 'tf-kw-pr-z' }, svgIco('i-medal'), el('span', null, el('b', { text: BY[id].name }), ' ' + satz + (art !== 'wdh' ? ' · Maximum ' + maxText({ a: art, e: +x[1] }) : '')), el('small', { text: datumKurz(x[0]) })));
      });
      c.appendChild(P2);
    }
    if (kraftForm) c.appendChild(kraftFormular());
    else {
      const b = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-plus'), ids.length ? ' Weiteren Wert eintragen' : ' Wert eintragen');
      b.addEventListener('click', () => { kraftForm = { id: null }; neu(); });
      c.appendChild(el('div', { class: 'tf-form-actions' }, b));
    }
    c.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Maximum geschätzt aus Gewicht × Wiederholungen + Reserve (Epley und Brzycki; LeSuer et al., J Strength Cond Res 1997) · Wiederholungen in Reserve: Zourdos et al. 2016 · Steigern nach ACSM 2009' })));
    return c;
  }
  function kraftFormular() {
    const F = kraftForm;
    if (F.rir == null) F.rir = 1;
    const opts = U.filter((u) => messarten(u).length);
    const sel = el('select', { class: 'tf-input', 'aria-label': 'Übung' });
    sel.appendChild(el('option', { value: '', text: 'Übung wählen …' }));
    const g1 = el('optgroup', { label: 'Grundübungen' }), g2 = el('optgroup', { label: 'Weitere Übungen' });
    GRUND.filter((id) => BY[id] && messarten(BY[id]).length).forEach((id) => g1.appendChild(el('option', { value: id, text: BY[id].name })));
    opts.filter((u) => !GRUND.includes(u.id)).sort((a, b) => a.name.localeCompare(b.name, 'de')).forEach((u) => g2.appendChild(el('option', { value: u.id, text: u.name })));
    sel.append(g1, g2);
    if (F.id) sel.value = F.id;
    const box = el('div', { class: 'tf-kw-form', id: 'kraft-form' });
    const artBox = el('div'), kgFeld = el('label', { class: 'tf-field' }), wdhFeld = el('label', { class: 'tf-field' }), rirBox = el('div', { class: 'tf-field' }), ergebnis = el('p', { class: 'tf-kw-erg', 'aria-live': 'polite' });
    const kgIn = el('input', { class: 'tf-input', inputmode: 'decimal', placeholder: 'z. B. 80' }), wdhIn = el('input', { class: 'tf-input', inputmode: 'numeric', placeholder: 'z. B. 5' });
    if (F.kg != null) kgIn.value = String(F.kg).replace('.', ',');
    if (F.wdh != null) wdhIn.value = String(F.wdh);
    const kgT = el('span'); kgFeld.append(kgT, kgIn); wdhFeld.append(el('span', { text: 'Wiederholungen' }), wdhIn);
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    function zahl(t) { const n = Number(String(t).replace(',', '.').trim()); return t === '' || !isFinite(n) ? null : n; }
    function zeichnen() {
      const u = BY[sel.value], arten = messarten(u);
      if (u && !arten.includes(F.art)) F.art = arten[0];
      artBox.replaceChildren();
      if (u && arten.length > 1) artBox.appendChild(el('div', { class: 'tf-field' }, el('span', { text: 'Wie trainierst du sie?' }), seg([['wdh', 'Nur Körpergewicht'], ['kg', 'Mit Hanteln']], F.art, (v) => { F.art = v; zeichnen(); }, 'Art')));
      kgFeld.hidden = !u || F.art === 'wdh';
      kgT.textContent = F.art === 'zusatz' ? 'Zusatzgewicht in kg (0 = ohne)' : 'Gewicht in kg' + (u && JE_HAND.has(u.id) ? ' (je Hand)' : '');
      rirBox.replaceChildren(el('span', { text: 'Wie viele wären noch gegangen?' }), seg(RIR_WAHL, Math.min(4, F.rir == null ? 1 : F.rir), (v) => { F.rir = v; zeichnen(); }, 'Wiederholungen in Reserve'));
      rechnen();
    }
    function rechnen() {
      const u = BY[sel.value], kg = zahl(kgIn.value), w = zahl(wdhIn.value);
      F.kg = kg; F.wdh = w;
      if (!u || !(w >= 1)) { ergebnis.textContent = u ? 'Trag Gewicht und Wiederholungen ein – am genauesten mit 3–8 Wiederholungen nah an der Grenze.' : ''; return; }
      if (F.art !== 'wdh' && !(kg >= (F.art === 'zusatz' ? 0 : 0.5))) { ergebnis.textContent = 'Wie viel Gewicht?'; return; }
      const e = maxAus(F.art, kg, w, F.rir || 0), m = { e, a: F.art };
      ergebnis.textContent = (F.art === 'wdh' ? 'Bis zur Grenze schaffst du etwa ' + Math.round(e) + ' Wiederholungen.' : 'Dein geschätztes Maximum: ' + maxText(m).replace('≈ ', '') + (F.art === 'zusatz' ? ' zusätzlich (bei ' + kgTxt(koerperKg()) + ' Körpergewicht)' : '') + '.') + (w + (F.rir || 0) > 12 ? ' Über 12 Wiederholungen wird die Schätzung ungenauer.' : '');
    }
    sel.addEventListener('change', () => { F.id = sel.value || null; zeichnen(); });
    kgIn.addEventListener('input', rechnen); wdhIn.addEventListener('input', rechnen);
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Speichern');
    ok.addEventListener('click', () => {
      const u = BY[sel.value]; rechnen();
      if (!u) { msg.textContent = 'Bitte eine Übung wählen.'; return; }
      if (!(F.wdh >= 1 && F.wdh <= 30)) { msg.textContent = 'Wiederholungen bitte zwischen 1 und 30.'; return; }
      if (F.art === 'kg' && !(F.kg > 0 && F.kg <= 500)) { msg.textContent = 'Gewicht bitte zwischen 0,5 und 500 kg.'; return; }
      if (F.art === 'zusatz' && !(F.kg >= 0 && F.kg <= 200)) { msg.textContent = 'Zusatzgewicht bitte zwischen 0 und 200 kg.'; return; }
      const kg = F.art === 'wdh' ? 0 : Math.round(F.kg * 2) / 2, w = Math.round(F.wdh), r = Math.min(4, Math.max(0, F.rir == null ? 1 : F.rir));
      G.max[u.id] = { e: +maxAus(F.art, kg, w, r).toFixed(1), a: F.art, s: [kg, w, r], d: heuteIso(), q: 'eingabe' };
      if (Object.keys(G.max).length > 60) { const alt = Object.entries(G.max).sort((a, b) => String(a[1].d).localeCompare(String(b[1].d)))[0]; delete G.max[alt[0]]; }
      kraftForm = null; speichern(true); neu(); A().toast('Kraftwert gespeichert – ' + u.name);
    });
    const ab = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Abbrechen');
    ab.addEventListener('click', () => { kraftForm = null; neu(); });
    box.append(el('label', { class: 'tf-field' }, el('span', { text: 'Übung' }), sel), artBox, el('div', { class: 'tf-gym-2' }, kgFeld, wdhFeld), rirBox, ergebnis, el('div', { class: 'tf-form-actions' }, ok, ab, msg));
    zeichnen();
    return box;
  }

  /* ---------- Nach dem Workout: Anstrengung und „zu leicht / passt / zu schwer“ ---------- */
  const RPE_TXT = { 1: 'sehr leicht', 2: 'leicht', 3: 'moderat', 4: 'etwas hart', 5: 'hart', 6: 'hart', 7: 'sehr hart', 8: 'sehr hart', 9: 'fast maximal', 10: 'maximal' };
  function rueckmeldung(W) {
    const R = { rpe: null, e: {} };
    const liste = W.liste.filter((f) => messarten(f.u).length && !f.v.halten && !f.v.plyo);
    const box = el('div', { class: 'tf-rm' });
    const rpeT = el('small', { class: 'tf-rm-rpe-t', text: 'Tippe eine Zahl an' });
    const rpe = el('div', { class: 'tf-chipset tf-rm-rpe', role: 'group', 'aria-label': 'Anstrengung von 1 bis 10' });
    for (let i = 1; i <= 10; i++) {
      const b = el('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': i + ' – ' + RPE_TXT[i] }, String(i));
      b.addEventListener('click', () => { R.rpe = i; $$('button', rpe).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); rpeT.textContent = i + ' – ' + RPE_TXT[i]; });
      rpe.appendChild(b);
    }
    box.append(el('h2', { class: 'tf-rm-t', text: 'Wie lief dein Workout?' }), el('p', { class: 'tf-rm-sub', text: 'Damit passen die Gewichte beim nächsten Mal – und Dreiklang weiß, wie hart es war.' }),
      el('div', { class: 'tf-field' }, el('span', { text: 'Wie anstrengend war es insgesamt?' }), rpe, rpeT));
    if (liste.length) {
      const L = el('div', { class: 'tf-rm-liste' }), S = heuteSaetze();
      liste.forEach((f) => {
        const u = f.u, m = G.max[u.id];
        // Version 10: Wer Sätze eingetragen hat, bekommt den Kraftwert direkt aus dem besten Satz
        const ok = (Array.isArray(S[u.id]) ? S[u.id] : []).filter((r) => r[2] && r[1] > 0);
        const mitKg = ok.some((r) => r[0] > 0);
        const art = satzArt(u, mitKg, (arten) => arten[0]);
        const kand = ok.filter((r) => art === 'wdh' || ((art === 'zusatz' || r[0] > 0) && r[1] <= 30)); // über 30 Wdh. taugt die Schätzung nicht
        if (art && kand.length) {
          const x = (R.e[u.id] = { wahl: 'saetze', art, rir: f.v.rir[0] });
          const besterSatz = () => kand.reduce((b, r) => { const e = maxAus(art, art === 'wdh' ? 0 : r[0] || 0, r[1], x.rir); return !b || e > b.e ? { e, r } : b; }, null);
          const erg = el('p', { class: 'tf-rm-erg', 'aria-live': 'polite' });
          const zeig = () => {
            const b = besterSatz(); x.best = b;
            const satz = art === 'wdh' ? b.r[1] + ' Wdh.' : (art === 'zusatz' ? (b.r[0] > 0 ? '+' + kgTxt(b.r[0]) : 'ohne Zusatz') : kgTxt(b.r[0])) + ' × ' + b.r[1];
            erg.textContent = 'Bester Satz: ' + satz + ' → ' + (art === 'wdh' ? 'bis zur Grenze etwa ' + Math.round(b.e) + ' Wdh.' : 'Maximum ' + maxText({ a: art, e: b.e })) + (m ? ' (bisher ' + maxText(m).replace('≈ ', '') + ')' : '');
          };
          const rirSeg = seg(RIR_WAHL, Math.min(4, x.rir), (v) => { x.rir = v; $$('button', rirSeg).forEach((b, i) => b.setAttribute('aria-pressed', String(RIR_WAHL[i][0] === v))); zeig(); }, 'Wiederholungen in Reserve');
          const extra = el('div', { class: 'tf-rm-genau tf-rm-aus' }, el('div', { class: 'tf-field' }, el('span', { text: 'Im besten Satz wären noch so viele gegangen' }), rirSeg), erg);
          const opt = [['saetze', 'Übernehmen'], ['passt', 'Nicht ändern']];
          const knoepfe = el('div', { class: 'tf-seg tf-rm-wahl', role: 'group', 'aria-label': u.name });
          opt.forEach(([v, t]) => {
            const b = el('button', { type: 'button', 'aria-pressed': String(v === x.wahl) }, t);
            b.addEventListener('click', () => { x.wahl = v; $$('button', knoepfe).forEach((y, i) => y.setAttribute('aria-pressed', String(opt[i][0] === x.wahl))); extra.hidden = v !== 'saetze'; });
            knoepfe.appendChild(b);
          });
          zeig();
          L.appendChild(el('div', { class: 'tf-rm-u' }, el('div', { class: 'tf-rm-u-k' }, el('b', { text: u.name }), el('small', { text: ok.length + (ok.length === 1 ? ' Satz' : ' Sätze') + ': ' + saetzeText(ok.map((r) => [r[0], r[1]]), { kg: art !== 'wdh', zusatz: art === 'zusatz' }) })), knoepfe, extra));
          return;
        }
        const x = (R.e[u.id] = { wahl: null, art });
        const genau = el('div', { class: 'tf-rm-genau', hidden: true });
        const kgIn = el('input', { class: 'tf-input', inputmode: 'decimal', placeholder: art === 'zusatz' ? '+ kg' : 'kg', 'aria-label': u.name + ': Gewicht' });
        const wIn = el('input', { class: 'tf-input', inputmode: 'numeric', placeholder: 'Wdh.', 'aria-label': u.name + ': Wiederholungen' });
        if (f.last && f.last.kg != null) kgIn.value = String(f.last.kg).replace('.', ',');
        wIn.value = String(f.last && f.last.wdh ? f.last.wdh : f.v.wdhHi);
        x.rir = f.v.rir[0];
        const rirSeg = seg(RIR_WAHL, Math.min(4, x.rir), (v) => { x.rir = v; $$('button', rirSeg).forEach((b, i) => b.setAttribute('aria-pressed', String(RIR_WAHL[i][0] === v))); }, 'Wiederholungen in Reserve');
        const lies = () => { x.kg = Number(String(kgIn.value).replace(',', '.')); x.wdh = Number(wIn.value); };
        kgIn.addEventListener('input', lies); wIn.addEventListener('input', lies); lies();
        if (art !== 'wdh') genau.append(el('label', { class: 'tf-field' }, el('span', { text: art === 'zusatz' ? 'Zusatzgewicht' : 'Gewicht' + (JE_HAND.has(u.id) ? ' je Hand' : '') }), kgIn));
        genau.append(el('label', { class: 'tf-field' }, el('span', { text: 'Wiederholungen' }), wIn), el('div', { class: 'tf-field' }, el('span', { text: 'Noch drin gewesen' }), rirSeg));
        const knoepfe = el('div', { class: 'tf-seg tf-rm-wahl', role: 'group', 'aria-label': u.name });
        const opt = m ? [['leicht', 'Zu leicht'], ['passt', 'Passt'], ['schwer', 'Zu schwer'], ['genau', 'Genau']] : [['genau', 'Eintragen']];
        opt.forEach(([v, t]) => {
          const b = el('button', { type: 'button', 'aria-pressed': 'false' }, t);
          b.addEventListener('click', () => { x.wahl = x.wahl === v ? null : v; $$('button', knoepfe).forEach((y, i) => y.setAttribute('aria-pressed', String(opt[i][0] === x.wahl))); genau.hidden = x.wahl !== 'genau'; });
          knoepfe.appendChild(b);
        });
        L.appendChild(el('div', { class: 'tf-rm-u' }, el('div', { class: 'tf-rm-u-k' }, el('b', { text: u.name }), el('small', { text: f.v.text + (f.last ? ' · ' + f.last.txt : '') })), knoepfe, genau));
      });
      box.append(el('div', { class: 'tf-field' }, el('span', { text: 'Wie passten die Gewichte?' }), L));
    }
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-check'), ' Speichern');
    ok.addEventListener('click', () => {
      let n = 0;
      for (const f of liste) {
        const x = R.e[f.u.id], m = G.max[f.u.id];
        if (!x || !x.wahl || x.wahl === 'passt') continue;
        if (x.wahl === 'saetze') {
          if (!x.best || !(x.best.e > 0)) continue;
          const kg = x.art === 'wdh' ? 0 : Math.round((x.best.r[0] || 0) * 100) / 100;
          G.max[f.u.id] = { e: +x.best.e.toFixed(1), a: x.art, s: [kg, x.best.r[1], x.rir], d: heuteIso(), q: 'saetze' }; n++;
        } else if (x.wahl === 'genau') {
          const w = Math.round(x.wdh), kg = x.art === 'wdh' ? 0 : Math.round(x.kg * 2) / 2;
          if (!(w >= 1 && w <= 30) || (x.art === 'kg' && !(kg > 0 && kg <= 500)) || (x.art === 'zusatz' && !(kg >= 0 && kg <= 200))) { msg.textContent = f.u.name + ': bitte Gewicht und Wiederholungen prüfen.'; return; }
          G.max[f.u.id] = { e: +maxAus(x.art, kg, w, x.rir).toFixed(1), a: x.art, s: [kg, w, x.rir], d: heuteIso(), q: 'workout' }; n++;
        } else if (m) {
          const auf = x.wahl === 'leicht'; // kleine Schritte: +2,5 % bzw. −5 % (ACSM 2009: 2–10 % steigern, wenn 1–2 Wiederholungen mehr gehen)
          const e = m.a === 'wdh' ? Math.max(1, m.e + (auf ? 2 : -2)) : m.e * (auf ? 1.025 : 0.95);
          G.max[f.u.id] = Object.assign({}, m, { e: +e.toFixed(1), d: heuteIso(), q: 'anpassung' }); n++;
        }
      }
      const ids = Object.keys(G.max); // höchstens 60 Kraftwerte – der älteste fliegt raus
      if (ids.length > 60) ids.sort((p, q) => String(G.max[p].d).localeCompare(String(G.max[q].d))).slice(0, ids.length - 60).forEach((id) => { delete G.max[id]; });
      eintragen(W, R.rpe);
      if (window.tfWissen && tfWissen.schliessen) tfWissen.schliessen();
      A().toast(n ? 'Gespeichert – ' + n + (n === 1 ? ' Gewicht' : ' Gewichte') + ' für nächstes Mal angepasst.' : 'Gespeichert – zählt zu deiner Woche im Gym.');
      T.geh('training/gym', { ersetzen: true });
    });
    const nur = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Ohne Angaben speichern');
    nur.addEventListener('click', () => { eintragen(W, R.rpe); if (window.tfWissen && tfWissen.schliessen) tfWissen.schliessen(); A().toast('Gespeichert – zählt zu deiner Woche im Gym.'); T.geh('training/gym', { ersetzen: true }); });
    box.appendChild(el('div', { class: 'tf-form-actions' }, ok, nur, msg));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
    else { eintragen(W); A().toast('Gespeichert – zählt zu deiner Woche im Gym.'); T.geh('training/gym', { ersetzen: true }); }
  }
  let bibD = 'alle'; // Version 27: Übungen nach ihrem Nutzen im Wettkampf filtern
  function bibliothek() {
    T.kopf({ sub: U.length + ' Übungen mit Anleitung' });
    const c = el('article', { class: 'tf-card tf-span2', id: 'karte-bibliothek' });
    const erlaubt = geraete();
    c.appendChild(chips(Object.entries(ORT).map(([k, o]) => [k, o[0], o[2]]), G.ort, (v) => { G.ort = v; speichern(); neu(); }, { label: 'Ort' }));
    c.appendChild(chips([['alle', 'Für alles'], ['schwimmen', 'Schwimmen'], ['rad', 'Rad'], ['laufen', 'Laufen']], bibD, (v) => { bibD = v; neu(); }, { cls: 'tf-gym-filter tf-gym-dfilter', label: 'Nutzen im Wettkampf' })); // Version 27
    c.appendChild(chips([['alle', 'Alle'], ['mobil', 'Mobilität']].concat(Object.entries(MUSKELN)), G.bib, (v) => { G.bib = v; speichern(); neu(); }, { cls: 'tf-gym-filter', label: 'Muskel' }));
    const L = U.filter((u) => u.geraet.some((g) => erlaubt.includes(g)) && (G.bib === 'alle' || (G.bib === 'mobil' ? u.typ === 'mobil' : u.ziel.includes(G.bib) && u.typ !== 'mobil')) && (bibD === 'alle' || uebNutzen(u).some((x) => x.id === bibD)));
    const list = el('div', { class: 'tf-gym-liste tf-gym-bib' });
    L.forEach((u, i) => list.appendChild(uebung(u, i + 1, { text: u.ziel.map((m) => MUSKELN[m]).join(', ') + (u.einseitig ? ' · einseitig' : '') + (G.max[u.id] ? ' · Maximum ' + maxText(G.max[u.id]) : '') }, null)));
    if (!L.length) list.appendChild(el('p', { class: 'tf-empty', text: 'Keine Übung für diese Auswahl mit „' + ortName() + '“.' }));
    c.append(el('p', { class: 'tf-gym-anzahl', text: L.length + (L.length === 1 ? ' Übung' : ' Übungen') }), list);
    c.appendChild(el('p', { class: 'tf-note tf-quelle', text: 'Schweres Krafttraining verbessert Lauf- und Radökonomie (Rønnestad & Mujika, Scand J Med Sci Sports 2014; Beattie et al., Sports Med 2014). Kraft- und Stabilitätstraining senkt Sportverletzungen deutlich (Lauersen et al., Br J Sports Med 2014). Nordic Hamstring: van der Horst et al., Am J Sports Med 2015 · Copenhagen-Übung: Harøy et al., Br J Sports Med 2019.' }));
    return c;
  }

  /* ---------- Schnittstellen ---------- */
  function kurz() {
    laden();
    const e = G.log.reduce((x, y) => (y && y.d && (!x || y.d >= x.d) ? y : x), null); // jüngster Eintrag nach Datum
    if (e) { const t = Math.round((toDay(heuteIso()) - toDay(e.d)) / DAY); return { wert: e.t, txt: true, sub: 'zuletzt ' + (t <= 0 ? 'heute' : t === 1 ? 'gestern' : 'vor ' + t + ' Tagen') + ' · ' + woche().L.length + ' in 7 Tagen' }; }
    const EA = eigenAktiv();
    if (!G.muskeln.length && !EA) return null;
    return { wert: titelVon(), txt: true, sub: EA ? eigenListe(EA).length + ' Übungen · eigenes Workout' : G.dauer + ' min · ' + ortName() };
  }
  function vorlage(o) { // aus dem Trainingsplan: Vorlage, Ziel und Dauer setzen
    laden();
    const v = VORLAGEN.find((x) => x[0] === o.vorlage) || VORLAGEN.find((x) => x[0] === 'ganz');
    G.muskeln = Object.keys(MUSKELN).filter((m) => v[2].includes(m)); G.vorlage = v[0]; G.eigenAktiv = null;
    if (o.ziel && ZIEL[o.ziel]) G.ziel = o.ziel;
    if (o.dauer) G.dauer = DAUER.reduce((b, d) => (Math.abs(d - o.dauer) < Math.abs(b - o.dauer) ? d : b), 45);
    tauschLeeren(true); speichern();
  }
  T.seite('gym', renderGym);
  T.routen('training/gym', (rest) => (rest === 'workout' ? { seite: 'gym', titel: 'Dein Workout', sub: '', eltern: 'training/gym' } : rest === 'uebungen' ? { seite: 'gym', titel: 'Alle Übungen', sub: '', eltern: 'training/gym' } : rest === 'eigen' ? { seite: 'gym', titel: 'Workout erstellen', sub: 'Übung für Übung – mit dem Nutzen fürs Rennen', eltern: 'training/gym' } : null));
  // Version 11: Schnellstart von Heute – direkt in die Fokus-Ansicht des heutigen Workouts
  function starten() {
    laden(); const W = workout();
    T.geh('training/gym/workout');
    if (W && W.liste && W.liste.length) setTimeout(() => { if (!document.querySelector('.tf-fk')) fokusAnsicht(W); }, 260);
  }
  // Version 46: Einschätzung und Schwerpunkt für andere Seiten und für die Prüfung aller Kombinationen (ids: beliebige Übungsliste)
  function einschaetzungAussen(o) {
    laden(); o = o || {};
    const z = ZIEL[o.ziel] ? o.ziel : zielJetzt();
    const W = o.ids ? eigenWorkout({ z, u: o.ids.filter((id) => BY[id]).map((id) => { const r = stdZeile(BY[id], z); return r.id + '|' + r.s + '|' + r.w; }) }) : workout(!!o.vorschlag);
    if (!W || !W.liste.length) return null;
    const E = einschaetzung(W);
    return { titel: E.titel, klasse: E.klasse, satz: E.satz, d: E.d.slice(), bringt: E.bringt.map((x) => ({ d: x.d, titel: x.titel, text: x.text, q: x.q })), bau: E.bau.slice(), achte: E.achte.map((h) => ({ id: h.id, text: h.text, q: h.q })), uebungen: W.liste.map((f) => f.u.id) };
  }
  function schwerpunktAussen(wunsch, o) { // o.nurSuchen: nur zeigen, was getauscht würde
    laden(); o = o || {};
    if (o.nurSuchen) { const W = workout(); if (!W || !W.liste.length) return null; const R = zugSuche(W, wunsch); return { d: R.d.slice(), d0: R.d0.slice(), offen: R.offen.slice(), tausche: R.tausche.map((t) => ({ orig: t.orig, von: t.von.id, zu: t.zu.id })) }; }
    const R = zugSetzen(wunsch); speichern();
    return R ? { d: R.d.slice(), tausche: R.tausche.map((t) => ({ orig: t.orig, von: t.von.id, zu: t.zu.id })) } : null;
  }
  window.tfGym = { anzahl: U.length, kurz, vorlage, starten, einschaetzung: einschaetzungAussen, schwerpunkt: schwerpunktAussen, uebungen: () => U.filter((u) => u.typ !== 'mobil').map((u) => u.id), programme: () => PROGRAMME.map((p) => ({ id: p.id, name: p.name, ziel: p.ziel, kurz: p.kurz, nutzen: progNutzen(p).d })), programmeKarte, programmWahl, dreieck, nutzen: (sz, o) => nutzenVon(sz, o), // Version 27
 workout: () => (laden(), workout()), muskeln: MUSKELN, koerperDaten: KOERPER, koerperTiefe, zustandVerlauf, log: () => (laden(), G.log.slice()), niveau: () => (laden(), NIVEAU[nivIdx()]),
    verlauf: () => { laden(); const v = JSON.parse(JSON.stringify(G.verlauf || {})); return { v, pr: JSON.parse(JSON.stringify(G.pr || {})), namen: Object.fromEntries(Object.keys(v).filter((id) => BY[id]).map((id) => [id, BY[id].name])) }; } };
})();
