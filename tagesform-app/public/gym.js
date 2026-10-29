/* Tagesform · Gym: Muskeln am Körper antippen → passendes Workout mit Erklärung zu jeder Übung.
   Dazu Ort (Studio, zuhause mit Hanteln, ohne Geräte), Ziel, Dauer, Erfahrung und auf Wunsch Cardio danach.
   Grundlagen: ACSM Position Stand 2009 (Reihenfolge, Sätze, Pausen, Progression), Schoenfeld et al. 2016/2017 (Volumen,
   Frequenz, Lasten), Zourdos et al. 2016 (Wiederholungen in Reserve), Refalo et al. 2023 und Grgic et al. 2022 (Nähe zur
   Grenze), LeSuer et al. 1997 (Maximum aus Wiederholungen schätzen), Eddens et al. 2018 und Wilson et al. 2012 (Kraft + Ausdauer).
   Fünf Erfahrungsstufen von Einsteiger bis Leistungssport; mit eingetragenen Kraftwerten zeigt jede Übung ihr Gewicht. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, svg, nf, iso, toDay, localDate, DAY, rowsOf, heute, svgIco } = T.ui;
  const { karte, dot } = S;
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
      { m: null, d: 'M77,186 C85,191 93,196 100,203 C107,196 115,191 123,186 L125,197 C116,202 108,208 100,216 C92,208 84,202 75,197 Z', mitte: true },
      { m: 'quad', d: 'M73,201 C80,208 88,212 94,213 C97,234 95,259 91,285 C86,292 78,292 74,286 C68,258 68,228 73,201 Z' },
      { m: 'adduktoren', d: 'M96,210 C99,212 100,216 100,222 C100,236 99,248 97,258 C95,246 94,232 95,214 Z', klein: true },
      { m: null, d: 'M76,292 C80,289 89,289 92,293 C93,299 92,305 89,308 C84,310 79,309 76,305 C74,301 74,296 76,292 Z' },
      { m: 'schienbein', d: 'M76,312 C79,309 84,309 87,312 C87,340 85,368 83,396 C81,400 78,400 77,396 C74,368 73,339 76,312 Z', klein: true },
      { m: 'waden', d: 'M90,312 C94,318 95,333 94,350 C93,360 91,368 89,372 C87,354 87,333 90,312 Z', klein: true },
      { m: null, d: 'M77,404 C79,400 87,400 89,404 L92,422 C88,428 79,428 75,423 Z' },
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
      { m: null, d: 'M80,372 C84,370 90,370 92,374 L91,402 C87,405 83,405 81,402 Z' },
      { m: null, d: 'M78,405 C81,401 89,401 92,405 L94,421 C89,427 80,427 76,421 Z' },
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
    { id: 'beinbeuger', ziel: ['beinbeuger'], mit: [], typ: 'iso', stufe: 1, name: 'Beinbeuger an der Maschine', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Beinbeuger',
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
  ];
  U.push(...U_NEU);
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
    ['rad', 'Für Radfahrer', ['quad', 'gesaess', 'beinbeuger', 'ruecken_unten', 'bauch'], 'Kraft für Radfahrer'],
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
  const STD = { muskeln: [], ort: 'studio', band: false, ziel: null, dauer: 45, niveau: null, cardio: null, cform: 'locker', cmin: 15, seed: 1, tausch: {}, bib: 'alle', vorlage: null, log: [], max: {} };
  let G = null, kontoVon = null, saveT = null, offenSpeichern = false, offen = null, figurNr = 0, listeOffen = false;
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
  const heuteIso = () => { const H = heute(); return (H && H.date) || localDate(); };

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
  const JE_HAND = new Set(['kh_bank', 'schulterdruecken', 'schraegbank', 'seitheben', 'reverse_fly', 'bizeps_curl', 'hammer_curl', 'kh_fly', 'rudern_kh', 'bulgarian', 'ausfall', 'stepup', 'einbein_kreuz', 'seitausfall']);
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

  function workout() {
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
    // „Andere Übung“: Alternativen mit gleichem Hauptmuskel, keine doppelt
    const belegt = new Set(liste.map((u) => u.id));
    const fertig = liste.map((u) => {
      const alt = alternativen(u, kand, M, belegt), k = G.tausch[u.id] || 0;
      if (!k || !alt.length) return { u, orig: u.id, alt: alt.length };
      const ersatz = alt[(k - 1) % alt.length]; belegt.add(ersatz.id);
      return { u: ersatz, orig: u.id, alt: alt.length };
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
    return { z, Z, niv, satz, liste: fertig, saetze, mit, fehlt, warm, kuehl, minuten: Math.round(warm + haupt / 60 + kuehl) };
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
    speichern(true);
  }

  /* ---------- Körperkarte ---------- */
  // an: kräftig (gewählt) · mit: hell (arbeitet mit) · heat: Sätze je Muskel → Stufe 0–3
  function figur(ansicht, o) {
    const gid = 'tf-gk-g' + (++figurNr);
    const s = svg('svg', { viewBox: '24 4 152 428', class: 'tf-gk-svg', 'aria-hidden': 'true', focusable: 'false' });
    const lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 1, y2: 1 }, svg('defs', null, s));
    svg('stop', { offset: 0, 'stop-color': '#cf8cff' }, lg); svg('stop', { offset: 1, 'stop-color': '#8a3fdc' }, lg);
    const spiegel = 'matrix(-1 0 0 1 200 0)';
    const L = svg('g', null, s), R = svg('g', { transform: spiegel }, s), Mi = svg('g', null, s);
    const hL = svg('g', null), hR = svg('g', { transform: spiegel });
    KOERPER[ansicht].forEach((t) => {
      (t.mitte ? [Mi] : [L, R]).forEach((g) => {
        if (!t.m) { svg('path', { d: t.d, class: 'tf-gk-n' }, g); return; }
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
    p.style.fill = an || h === 3 ? 'url(#' + gid + ')' : ''; // Inline-Stil schlägt die Grundfarbe aus dem Stylesheet
  }
  function koerper(o) {
    return el('div', { class: 'tf-gk' + (o.klein ? ' tf-gk-klein' : '') + (o.klick ? ' tf-gk-klick' : '') },
      el('figure', null, figur('vorne', o), el('figcaption', { text: 'Vorne' })),
      el('figure', null, figur('hinten', o), el('figcaption', { text: 'Hinten' })));
  }
  function umschalten(m) {
    const S2 = new Set(G.muskeln), dazu = !S2.has(m);
    if (dazu) S2.add(m); else S2.delete(m);
    G.muskeln = Object.keys(MUSKELN).filter((k) => S2.has(k)); G.tausch = {};
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
  function ansicht() { const r = T.route(); return r === 'training/gym/workout' ? 'workout' : r === 'training/gym/uebungen' ? 'bib' : 'wahl'; }
  function renderGym() {
    const box = $('#gym-box'); if (!box) return;
    laden();
    figurNr = 0;
    const a = ansicht();
    if (a === 'workout' && !(G.muskeln.length && workout().liste.length)) { T.geh('training/gym', { ersetzen: true }); return; }
    box.replaceChildren(...(a === 'workout' ? workoutAnsicht() : a === 'bib' ? [bibliothek()] : wahlAnsicht()));
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
  const setze = (fn) => (v) => { fn(v); G.tausch = {}; speichern(); neu(); };
  const feld = (titel, ...k) => el('div', { class: 'tf-field' }, el('span', { text: titel }), ...k);

  function auswahlTeil() {
    const M = new Set(G.muskeln);
    const box = el('div', { class: 'tf-gym-gewaehlt', id: 'gym-auswahl', 'aria-live': 'polite' });
    if (!M.size) box.appendChild(el('p', { class: 'tf-gym-leer', text: 'Tippe auf die Muskeln, die du heute trainieren willst – oder nimm oben eine Vorlage.' }));
    else {
      const L = el('div', { class: 'tf-gym-an' });
      G.muskeln.forEach((m) => { const b = el('button', { type: 'button', 'aria-label': MUSKELN[m] + ' abwählen' }, MUSKELN[m], el('span', { class: 'tf-gym-x', 'aria-hidden': 'true', text: '×' })); b.addEventListener('click', () => umschalten(m)); L.appendChild(b); });
      const x = el('button', { type: 'button', class: 'tf-gym-reset' }, 'Alle abwählen');
      x.addEventListener('click', () => { G.muskeln = []; G.vorlage = null; G.tausch = {}; speichern(); neu(); });
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
    box.append(el('span', { class: 'tf-gym-los-t' }, el('b', { text: W.liste.length + ' Übungen · ' + min + ' min' }), el('small', { text: ZIEL[W.z].name + (G.cardio ? ' + ' + CARDIO[G.cardio][0] : '') })), los);
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
      b.addEventListener('click', () => { const weg = G.vorlage === id; G.muskeln = weg ? [] : Object.keys(MUSKELN).filter((m) => L.includes(m)); G.vorlage = weg ? null : id; G.tausch = {}; speichern(); neu(); });
      vl.appendChild(b);
    });
    c1.append(vl, koerper({ an: M, klick: true }), auswahlTeil());
    // 2. Einstellungen
    const z = zielJetzt(), ph = phaseJetzt(), H = heute(), niv = nivIdx();
    const c2 = karte({ farbe: 'indigo', icon: 'i-tool', titel: 'Wo, wie und wie lange?', id: 'karte-gym-einstellung' });
    const ortF = feld('Wo trainierst du?', chips(Object.entries(ORT).map(([k, o]) => [k, o[0], o[2]]), G.ort, setze((v) => { G.ort = v; if (G.cardio && CARDIO[G.cardio][2] !== (v === 'studio' ? 'studio' : 'zuhause')) G.cardio = null; }), { label: 'Ort' }));
    if (G.ort !== 'studio') {
      const cb = el('input', { type: 'checkbox', checked: !!G.band });
      cb.addEventListener('change', () => { G.band = cb.checked; G.tausch = {}; speichern(); neu(); });
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
    // Hinweise aus Saison und Tagesform
    const hin = el('div', { class: 'tf-gym-hinweise' });
    if (ph) {
      const p = el('p', { class: 'tf-gym-hinweis' }, dot('blue'), el('span', { text: PHASE[ph][1] + (G.ziel && G.ziel !== PHASE[ph][0] ? ' Passend wäre „' + ZIEL[PHASE[ph][0]].name + '“.' : '') }));
      if (G.ziel && G.ziel !== PHASE[ph][0]) { const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Übernehmen'); b.addEventListener('click', setze(() => { G.ziel = null; })); p.lastChild.append(' ', b); }
      hin.appendChild(p);
    }
    if (H && H.ampel === 'rot') {
      const p = el('p', { class: 'tf-gym-hinweis' }, dot('red'), el('span', { text: 'Deine Tagesform ist heute niedrig. Schwer trainieren bringt jetzt wenig – besser „Stabilität & Prävention“ oder eine ruhige Einheit Pilates oder Yoga.' }));
      const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Zu Pilates & Yoga'); b.addEventListener('click', () => T.geh('training/flow')); p.lastChild.append(' ', b);
      hin.appendChild(p);
    } else if (H && H.ampel === 'gelb' && (z === 'kraft' || z === 'power')) hin.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('yellow'), el('span', { text: 'Tagesform mittel: Schwer geht – mach bei jeder Übung einen Satz weniger.' })));
    if (hin.childElementCount) c2.appendChild(hin);
    const bib = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-gym-bibknopf' }, svgIco('i-list'), ' Alle ' + U.length + ' Übungen mit Anleitung');
    bib.addEventListener('click', () => T.geh('training/gym/uebungen'));
    c2.appendChild(bib);
    const teile = [c1, c2, kraftKarte()];
    const w = wocheKarte(); if (w) teile.push(w);
    return [el('div', { class: 'tf-grid' }, ...teile), losTeil()];
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
      b.addEventListener('click', () => { G.muskeln = Object.keys(MUSKELN).filter((m) => wenig.includes(m)); const v = vorlageVon(new Set(G.muskeln)); G.vorlage = v ? v[0] : null; G.tausch = {}; speichern(); T.neu(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      text.append(el('p', { class: 'tf-gym-wenig', text: 'Noch wenig: ' + wenig.map((m) => MUSKELN[m]).join(', ') + '.' }), b);
    }
    c.append(el('div', { class: 'tf-gym-woche' }, koerper({ heat: s, klein: true }), text),
      el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Schoenfeld et al., J Sports Sci 2017 · Schoenfeld et al., Sports Med 2016' })));
    return c;
  }
  function titelVon() {
    const v = VORLAGEN.find((x) => x[0] === G.vorlage); if (v) return v[3];
    const n = G.muskeln.map((m) => MUSKELN[m]);
    return n.length > 3 ? n.slice(0, 2).join(', ') + ' + ' + (n.length - 2) + ' weitere' : n.join(n.length === 2 ? ' & ' : ', ');
  }
  function workoutAnsicht() {
    const W = workout(); if (!W) return [];
    const { Z } = W, M = new Set(G.muskeln);
    T.kopf({ sub: ortName() + ' · ' + ZIEL[W.z].name });
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
    c.appendChild(el('p', { class: 'tf-gym-rir' }, el('b', { text: 'So schwer: ' }), reserveText(W) + ' ' + (Z.zirkel ? 'Pause ' + Z.pause + '.' : 'Pause zwischen den Sätzen: ' + Z.pause + (Z.pisoTxt && Z.pisoTxt !== Z.pause ? ', bei kleinen Übungen ' + Z.pisoTxt : '') + '.')));
    const mitLast = W.liste.filter((f) => f.last).length, messbar = W.liste.filter((f) => messarten(f.u).length && !f.v.halten && !f.v.plyo).length;
    if (mitLast) c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('purple'), el('span', { text: 'Gewichte aus deinen Kraftwerten. Schaffst du in allen Sätzen das obere Ende der Wiederholungen, sag nach dem Workout „zu leicht“ – dann steigt das Gewicht beim nächsten Mal.' })));
    else if (messbar && W.niv >= 1) {
      const b = el('button', { type: 'button', class: 'tf-gym-link' }, 'Kraftwerte eintragen');
      b.addEventListener('click', () => { kraftForm = { id: null }; T.geh('training/gym'); setTimeout(() => { const k = $('#karte-gym-kraft'); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); });
      c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('purple'), el('span', null, 'Trag ein, was du bei einer Übung schaffst – dann steht hier dein genaues Gewicht. ', b)));
    }
    W.fehlt.forEach(({ m, ort }) => c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('yellow'), el('span', { text: ort ? 'Für ' + MUSKELN[m] + ' gibt es mit „' + ortName() + '“ keine passende Übung.' : 'Für ' + MUSKELN[m] + ' war in ' + G.dauer + ' min kein Platz – nimm mehr Zeit oder weniger Muskeln.' }))));
    if (W.liste.length && W.minuten < G.dauer - 6) c.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('blue'), el('span', { text: 'Für ' + (M.size === 1 ? 'einen Muskel' : 'diese Auswahl') + ' reichen etwa ' + W.minuten + ' min – noch mehr Sätze bringen pro Einheit kaum etwas. ' + (G.ort !== 'studio' && !G.band ? 'Mit einem Widerstandsband gibt es mehr Übungen – oder wähle mehr Muskeln.' : 'Wähle mehr Muskeln oder nimm Cardio dazu.') })));
    // Aufwärmen
    const mob = U.filter((u) => u.typ === 'mobil' && u.ziel.some((m) => M.has(m)));
    const mobi = (mob.length ? mob : U.filter((u) => ['weltbeste', 'bws_rotation'].includes(u.id))).slice(0, 2);
    const block = (titel, zeit, items) => el('div', { class: 'tf-gym-sek' }, el('div', { class: 'tf-gym-sek-k' }, el('b', { text: titel }), el('span', { text: zeit })), el('ul', { class: 'tf-gym-ul' }, ...items.map((t) => el('li', null, t))));
    c.appendChild(block('Aufwärmen', W.warm + ' min', [(W.warm > 5 ? '4–5' : '3') + ' min locker: Rad, Rudergerät, Seilspringen oder zügig gehen', mobi.map((u) => u.name).join(' und ') + ' – je 30–45 s', '1–2 leichte Sätze der ersten Übung']));
    // Hauptteil
    const list = el('div', { class: 'tf-gym-liste' });
    W.liste.forEach((f, i) => {
      const d = uebung(f.u, i + 1, f.v, f.alt > 0 ? () => { G.tausch[f.orig] = (G.tausch[f.orig] || 0) + 1; offen = f.orig; speichern(); neu(); } : null, f.last);
      if (offen === f.orig) d.open = true;
      list.appendChild(d);
    });
    offen = null;
    c.append(el('div', { class: 'tf-gym-sek-k tf-gym-haupt' }, el('b', { text: Z.zirkel ? 'Zirkel · ' + W.satz + ' Runden' : 'Hauptteil' }), el('span', { text: 'Antippen für die Anleitung' })), list);
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
    const mischen = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-shuffle'), ' Neu mischen');
    mischen.addEventListener('click', () => { G.seed = (G.seed % 100000) + 1; G.tausch = {}; speichern(); neu(); });
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
  const GER = { gym: 'Studio', hantel: 'Hanteln', band: 'Band', ohne: 'ohne Geräte' };
  function uebung(u, nr, v, tauschen, last) {
    const d = el('details', { class: 'tf-gym-u', id: 'ueb-' + u.id });
    d.appendChild(el('summary', null, el('span', { class: 'tf-gym-nr num', text: String(nr) }), el('span', { class: 'tf-gym-ut' }, el('b', { text: u.name }), el('small', null, v.text, last ? el('b', { class: 'tf-gym-kg', text: ' · ' + last.txt }) : null, v.pause ? ' · Pause ' + v.pause : '')), el('span', { class: 'tf-gym-mu', text: u.ziel.map((m) => MUSKELN[m]).join(', ') })));
    const body = el('div', { class: 'tf-gym-body' },
      el('ol', { class: 'tf-steps' }, ...u.schritte.map((s) => el('li', { text: s }))),
      el('p', { class: 'tf-gym-achte' }, el('b', { text: 'Worauf achten: ' }), u.achte),
      el('div', { class: 'tf-gym-var' }, el('div', null, el('small', { text: 'Leichter' }), el('span', { text: u.leichter })), el('div', null, el('small', { text: 'Schwerer' }), el('span', { text: u.schwerer }))),
      el('div', { class: 'tf-gym-tags' }, ...u.ziel.map((m) => el('span', { class: 'tf-pf-tag tf-gym-tag-an', text: MUSKELN[m] })), ...u.mit.map((m) => el('span', { class: 'tf-pf-tag', text: MUSKELN[m] })), ...(u.geraet.length === 4 ? ['überall'] : u.geraet.map((g) => GER[g])).map((t) => el('span', { class: 'tf-pf-tag tf-gym-tag-g', text: t }))));
    if (v.schwer) body.prepend(el('p', { class: 'tf-gym-last' }, svgIco('i-flame'), el('span', null, el('b', { text: 'Für dich: ' }), v.schwer + ' – die Grundform ist für deine Stufe zu leicht.')));
    if (last) body.prepend(el('p', { class: 'tf-gym-last' }, svgIco('i-gauge'), el('span', null, el('b', { text: 'Dein Gewicht: ' }), last.lang + '.')));
    if (tauschen) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'padding-left:0' }, svgIco('i-shuffle'), ' Andere Übung'); b.addEventListener('click', (e) => { e.preventDefault(); tauschen(); }); body.appendChild(b); }
    d.appendChild(body);
    return d;
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
    return last + wdh + ' Wdh.' + (rir ? ' · ' + rir + ' in Reserve' : '') + (m.d ? ' · ' + datumKurz(m.d) : '') + (m.q === 'anpassung' ? ' · angepasst' : '');
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
    box.append(el('h2', { class: 'tf-rm-t', text: 'Wie lief dein Workout?' }), el('p', { class: 'tf-rm-sub', text: 'Damit passen die Gewichte beim nächsten Mal – und Tagesform weiß, wie hart es war.' }),
      el('div', { class: 'tf-field' }, el('span', { text: 'Wie anstrengend war es insgesamt?' }), rpe, rpeT));
    if (liste.length) {
      const L = el('div', { class: 'tf-rm-liste' });
      liste.forEach((f) => {
        const u = f.u, m = G.max[u.id], art = (m && m.a) || messarten(u)[0], x = (R.e[u.id] = { wahl: null, art });
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
        if (x.wahl === 'genau') {
          const w = Math.round(x.wdh), kg = x.art === 'wdh' ? 0 : Math.round(x.kg * 2) / 2;
          if (!(w >= 1 && w <= 30) || (x.art === 'kg' && !(kg > 0 && kg <= 500)) || (x.art === 'zusatz' && !(kg >= 0 && kg <= 200))) { msg.textContent = f.u.name + ': bitte Gewicht und Wiederholungen prüfen.'; return; }
          G.max[f.u.id] = { e: +maxAus(x.art, kg, w, x.rir).toFixed(1), a: x.art, s: [kg, w, x.rir], d: heuteIso(), q: 'workout' }; n++;
        } else if (m) {
          const auf = x.wahl === 'leicht'; // kleine Schritte: +2,5 % bzw. −5 % (ACSM 2009: 2–10 % steigern, wenn 1–2 Wiederholungen mehr gehen)
          const e = m.a === 'wdh' ? Math.max(1, m.e + (auf ? 2 : -2)) : m.e * (auf ? 1.025 : 0.95);
          G.max[f.u.id] = Object.assign({}, m, { e: +e.toFixed(1), d: heuteIso(), q: 'anpassung' }); n++;
        }
      }
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
  function bibliothek() {
    T.kopf({ sub: U.length + ' Übungen mit Anleitung' });
    const c = el('article', { class: 'tf-card tf-span2', id: 'karte-bibliothek' });
    const erlaubt = geraete();
    c.appendChild(chips(Object.entries(ORT).map(([k, o]) => [k, o[0], o[2]]), G.ort, (v) => { G.ort = v; speichern(); neu(); }, { label: 'Ort' }));
    c.appendChild(chips([['alle', 'Alle'], ['mobil', 'Mobilität']].concat(Object.entries(MUSKELN)), G.bib, (v) => { G.bib = v; speichern(); neu(); }, { cls: 'tf-gym-filter', label: 'Muskel' }));
    const L = U.filter((u) => u.geraet.some((g) => erlaubt.includes(g)) && (G.bib === 'alle' || (G.bib === 'mobil' ? u.typ === 'mobil' : u.ziel.includes(G.bib) && u.typ !== 'mobil')));
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
    if (!G.muskeln.length) return null;
    return { wert: titelVon(), txt: true, sub: G.dauer + ' min · ' + ortName() };
  }
  function vorlage(o) { // aus dem Trainingsplan: Vorlage, Ziel und Dauer setzen
    laden();
    const v = VORLAGEN.find((x) => x[0] === o.vorlage) || VORLAGEN.find((x) => x[0] === 'ganz');
    G.muskeln = Object.keys(MUSKELN).filter((m) => v[2].includes(m)); G.vorlage = v[0];
    if (o.ziel && ZIEL[o.ziel]) G.ziel = o.ziel;
    if (o.dauer) G.dauer = DAUER.reduce((b, d) => (Math.abs(d - o.dauer) < Math.abs(b - o.dauer) ? d : b), 45);
    G.tausch = {}; speichern();
  }
  T.seite('gym', renderGym);
  T.routen('training/gym', (rest) => (rest === 'workout' ? { seite: 'gym', titel: 'Dein Workout', sub: '', eltern: 'training/gym' } : rest === 'uebungen' ? { seite: 'gym', titel: 'Alle Übungen', sub: '', eltern: 'training/gym' } : null));
  window.tfGym = { anzahl: U.length, kurz, vorlage, workout: () => (laden(), workout()), muskeln: MUSKELN, log: () => (laden(), G.log.slice()), niveau: () => (laden(), NIVEAU[nivIdx()]) };
})();
