/* Tagesform · Gym: Workout nach Tag, Fokus, Ausrüstung und Dauer – mit Erklärungen zu jeder Übung.
   Die Auswahl ist zufällig, aber reproduzierbar (Startwert); „Neu mischen“ zieht neue Übungen. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, el, col, rowsOf, heute } = T.ui;
  const { karte, ico, dot, speicher, merke } = S;

  /* ---------- Übungen ----------
     muster: knie · huefte · einbein · wade · fuss · druecken · ziehen · schulter · rumpf · plyo · mobil
     geraet: gym (Studio: Langhantel, Maschinen, Kabelzug) · hantel (Kurzhantel/Kettlebell) · band (Widerstandsband) · ohne
     art: kraft (Wiederholungen mit Zusatzlast) · koerper (Wiederholungen, Körpergewicht) · halten (Sekunden) · plyo · mobil
     eignung: zu welchen Schwerpunkten die Übung passt */
  const ALLE = ['kraft', 'aufbau', 'ausdauer', 'power', 'stabil'];
  const U = [
    // Kniebeuge-Muster
    { id: 'kniebeuge_lh', name: 'Kniebeuge mit Langhantel', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Oberschenkel vorn, Gesäß, Rumpf',
      schritte: ['Stange auf den oberen Rücken legen, Füße etwa schulterbreit, Zehen leicht nach außen.', 'Hüfte nach hinten und unten schieben, die Knie folgen den Zehen.', 'So tief, wie der Rücken gerade bleibt – mindestens bis die Oberschenkel waagerecht sind.', 'Über die ganze Fußsohle kraftvoll hochdrücken.'],
      achte: 'Brust bleibt aufrecht, Knie fallen nicht nach innen. Vorher tief einatmen und den Bauch anspannen.', leichter: 'Goblet-Kniebeuge mit Kurzhantel', schwerer: '2 s Pause im tiefsten Punkt oder mehr Gewicht' },
    { id: 'goblet', name: 'Goblet-Kniebeuge', muster: 'knie', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil', 'kraft'], muskeln: 'Oberschenkel vorn, Gesäß, Rumpf',
      schritte: ['Kurzhantel oder Kettlebell senkrecht vor der Brust halten, Ellbogen zeigen nach unten.', 'Tief in die Hocke gehen, die Ellbogen landen zwischen den Knien.', 'Kurz halten, dann über die Fersen hochdrücken.'],
      achte: 'Das Gewicht vorne hilft, aufrecht zu bleiben – ideal, um die Technik zu lernen.', leichter: 'Ohne Gewicht auf eine Bank absetzen', schwerer: 'Kniebeuge mit Langhantel oder 3 s langsam runter' },
    { id: 'beinpresse', name: 'Beinpresse', muster: 'knie', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Rücken fest an die Lehne, Füße hüftbreit mittig auf die Platte.', 'Langsam beugen, bis die Knie etwa 90° haben.', 'Kraftvoll wegdrücken, oben die Knie nicht ganz durchstrecken.'],
      achte: 'Das Becken bleibt auf dem Polster – nicht so tief gehen, dass es abrollt.', leichter: 'Weniger Gewicht, kleinerer Bewegungsweg', schwerer: 'Einbeinig drücken' },
    { id: 'kniebeuge_kg', name: 'Kniebeuge mit Körpergewicht', muster: 'knie', geraet: ['ohne'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Füße schulterbreit, Arme nach vorne strecken.', 'Hüfte nach hinten und unten, so tief es sauber geht.', 'Zügig hochdrücken.'],
      achte: 'Fersen bleiben am Boden, Knie zeigen in Richtung Zehen.', leichter: 'Auf einen Stuhl absetzen', schwerer: '3 s runter und 2 s unten halten – oder Sprungkniebeuge' },
    { id: 'wandsitz', name: 'Wandsitzen', muster: 'knie', geraet: ['ohne'], art: 'halten', eignung: ['ausdauer', 'stabil'], muskeln: 'Oberschenkel vorn',
      schritte: ['Mit dem Rücken an die Wand lehnen, Füße einen guten Schritt vor der Wand.', 'Runterrutschen, bis die Knie etwa 90° gebeugt sind.', 'Position halten und ruhig weiteratmen.'],
      achte: 'Gut fürs Knie: Die Kraft entsteht ohne Stoßbelastung.', leichter: 'Weniger tief sitzen', schwerer: 'Ein Bein leicht anheben' },
    // Hüftbeuge-Muster
    { id: 'kreuzheben', name: 'Kreuzheben', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'power'], muskeln: 'Gesäß, Beinbeuger, Rücken',
      schritte: ['Füße hüftbreit unter der Stange, die Stange über der Fußmitte.', 'Hüfte nach hinten, Rücken gerade, Stange schulterbreit greifen.', 'Brust hoch, Bauch fest – die Stange eng am Körper nach oben ziehen.', 'Oben die Hüfte strecken, kontrolliert wieder absetzen.'],
      achte: 'Der Rücken bleibt die ganze Zeit gerade. Lieber weniger Gewicht als einen runden Rücken.', leichter: 'Rumänisches Kreuzheben mit Kurzhanteln', schwerer: 'Mehr Gewicht in kleinen Schritten' },
    { id: 'rdl', name: 'Rumänisches Kreuzheben', muster: 'huefte', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Beinbeuger, Gesäß, unterer Rücken',
      schritte: ['Aufrecht stehen, Langhantel oder Kurzhanteln vor den Oberschenkeln.', 'Knie leicht gebeugt lassen, Hüfte weit nach hinten schieben – das Gewicht gleitet an den Beinen entlang.', 'Runter, bis du hinten im Oberschenkel deutlich Zug spürst.', 'Mit dem Gesäß nach vorne schieben und aufrichten.'],
      achte: 'Bewegung kommt aus der Hüfte, nicht aus dem Rücken.', leichter: 'Mit einem Stab üben, dann leichte Hanteln', schwerer: 'Einbeiniges Kreuzheben' },
    { id: 'hip_thrust', name: 'Hip Thrust', muster: 'huefte', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Gesäß, Beinbeuger',
      schritte: ['Oberer Rücken an einer Bank, Gewicht (Langhantel oder Kurzhantel) auf der Hüfte.', 'Füße flach, etwa hüftbreit, die Knie zeigen nach vorn.', 'Hüfte hochdrücken, bis Oberkörper und Oberschenkel eine Linie bilden, oben 1 s halten.'],
      achte: 'Kinn leicht zur Brust, kein Hohlkreuz oben – die Kraft kommt aus dem Gesäß.', leichter: 'Beckenheben am Boden ohne Gewicht', schwerer: 'Einbeinig oder mit 2 s Halt oben' },
    { id: 'beckenheben', name: 'Beckenheben', muster: 'huefte', geraet: ['ohne'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Gesäß, Beinbeuger',
      schritte: ['Auf den Rücken legen, Füße aufstellen, Arme neben dem Körper.', 'Becken anheben, bis Knie, Hüfte und Schultern eine Linie bilden.', 'Oben kurz halten, langsam absenken.'],
      achte: 'Das Gesäß arbeitet, nicht der untere Rücken.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Einbeinig, das andere Bein gestreckt' },
    { id: 'kb_swing', name: 'Kettlebell-Swing', muster: 'huefte', geraet: ['gym', 'hantel'], art: 'plyo', eignung: ['power', 'ausdauer'], muskeln: 'Gesäß, Beinbeuger, Rumpf',
      schritte: ['Kettlebell mit beiden Händen, Füße etwas breiter als die Hüfte.', 'Hüfte nach hinten, die Kugel zwischen den Beinen nach hinten schwingen.', 'Hüfte explosiv nach vorne strecken – die Kugel schwingt bis Brusthöhe.', 'Die Arme lenken nur, die Kraft kommt aus der Hüfte.'],
      achte: 'Es ist eine Hüftbewegung, keine Kniebeuge. Oben Bauch und Gesäß fest.', leichter: 'Leichtere Kugel, kleiner Schwung', schwerer: 'Schwerere Kugel oder einarmig' },
    { id: 'nordic', name: 'Nordic Hamstring Curl', muster: 'huefte', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'koerper', eignung: ['kraft', 'stabil', 'aufbau'], muskeln: 'Beinbeuger',
      schritte: ['Auf ein Polster knien, die Fersen werden festgehalten (Partner, Sprossenwand, Sofa).', 'Den Körper gerade halten und so langsam wie möglich nach vorne kippen.', 'Mit den Händen abfangen, mit leichtem Abdrücken zurück in die Ausgangsposition.'],
      achte: 'Eine der besten Übungen gegen Zerrungen im hinteren Oberschenkel. Mit wenigen Wiederholungen anfangen – Muskelkater ist anfangs normal.', leichter: 'Nur den ersten Teil absenken', schwerer: 'Unten kurz halten und mit weniger Hilfe hochkommen' },
    { id: 'beinbeuger', name: 'Beinbeuger an der Maschine', muster: 'huefte', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Beinbeuger',
      schritte: ['Knie auf Höhe des Drehpunkts der Maschine einstellen.', 'Fersen kontrolliert zum Gesäß ziehen.', 'Langsam, in etwa 3 s, zurücklassen.'],
      achte: 'Die Hüfte bleibt auf dem Polster liegen.', leichter: 'Weniger Gewicht', schwerer: 'Einbeinig' },
    // Einbeinig
    { id: 'bulgarian', name: 'Bulgarische Kniebeuge', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'kraft', eignung: ['kraft', 'aufbau', 'stabil', 'ausdauer'], einseitig: true, muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Hinteren Fußrücken auf eine Bank legen, vorderer Fuß gut einen Schritt davor.', 'Gerade nach unten absenken, bis das hintere Knie fast den Boden berührt.', 'Über die vordere Ferse hochdrücken.'],
      achte: 'Das vordere Knie bleibt über dem Fuß. Für Läufer und Radfahrer besonders wertvoll, weil jedes Bein allein arbeitet.', leichter: 'Ohne Gewicht, Hand an der Wand', schwerer: 'Kurzhanteln in beiden Händen' },
    { id: 'ausfall', name: 'Ausfallschritt rückwärts', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Oberschenkel, Gesäß',
      schritte: ['Aufrecht stehen, mit einem Bein einen großen Schritt zurück.', 'Absenken, bis beide Knie etwa 90° haben.', 'Über das vordere Bein zurück in den Stand drücken.'],
      achte: 'Rückwärts schont das Knie mehr als vorwärts.', leichter: 'Kleinerer Schritt, festhalten', schwerer: 'Mit Kurzhanteln' },
    { id: 'stepup', name: 'Step-up', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['kraft', 'aufbau', 'ausdauer', 'power'], einseitig: true, muskeln: 'Oberschenkel vorn, Gesäß',
      schritte: ['Einen Fuß komplett auf eine stabile Kiste oder Stufe in Kniehöhe stellen.', 'Nur mit diesem Bein hochdrücken, das hintere Bein hilft nicht mit.', 'Langsam wieder absenken.'],
      achte: 'Das Knie bleibt über dem Fuß. Gut übertragbar aufs Laufen bergauf.', leichter: 'Niedrigere Stufe', schwerer: 'Mit Kurzhanteln oder explosiv hoch' },
    { id: 'einbein_kreuz', name: 'Einbeiniges Kreuzheben', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['stabil', 'aufbau', 'kraft'], einseitig: true, muskeln: 'Beinbeuger, Gesäß, Fußstabilität',
      schritte: ['Auf einem Bein stehen, Knie leicht gebeugt.', 'Oberkörper nach vorne kippen, das freie Bein gestreckt nach hinten – wie eine Waage.', 'Mit dem Gesäß zurück in den Stand.'],
      achte: 'Die Hüfte bleibt waagerecht, nicht aufdrehen. Trainiert nebenbei Gleichgewicht und Fuß.', leichter: 'Mit Fingerspitzen an der Wand', schwerer: 'Kurzhantel in der Hand der Gegenseite' },
    { id: 'pistol_box', name: 'Einbeinige Kniebeuge auf die Box', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['kraft', 'stabil', 'aufbau'], einseitig: true, muskeln: 'Oberschenkel, Gesäß, Knie-Stabilität',
      schritte: ['Vor eine Bank oder einen Stuhl stellen, ein Bein leicht nach vorne anheben.', 'Auf dem Standbein langsam absetzen.', 'Ohne Schwung wieder hochdrücken.'],
      achte: 'Knie nicht nach innen fallen lassen – das trainiert genau die Kontrolle, die Läuferknie schützt.', leichter: 'Höhere Box', schwerer: 'Niedrigere Box oder Gewicht in den Händen' },
    { id: 'seitausfall', name: 'Seitlicher Ausfallschritt', muster: 'einbein', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Adduktoren, Gesäß, Oberschenkel',
      schritte: ['Breiter Stand, Zehen nach vorne.', 'Gewicht auf ein Bein verlagern und in die Hüfte setzen, das andere Bein bleibt gestreckt.', 'Zurück in die Mitte drücken.'],
      achte: 'Stärkt die Innenseite der Oberschenkel – wichtig für stabile Knie.', leichter: 'Kleinerer Schritt', schwerer: 'Kurzhantel vor der Brust' },
    // Wade, Schienbein, Fuß
    { id: 'wade_gestreckt', name: 'Wadenheben, Bein gestreckt', muster: 'wade', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ALLE, muskeln: 'Wade (Gastrocnemius), Achillessehne',
      schritte: ['Mit den Fußballen auf eine Stufe stellen, Fersen hängen frei.', 'Knie gestreckt, so hoch wie möglich auf die Zehen drücken.', 'Langsam, in etwa 3 s, tief absenken.'],
      achte: 'Die langsame Absenkphase stärkt die Achillessehne. Läufer brauchen sehr kräftige Waden.', leichter: 'Beidbeinig am Boden', schwerer: 'Einbeinig oder mit Kurzhantel' },
    { id: 'wade_gebeugt', name: 'Wadenheben, Knie gebeugt', muster: 'wade', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ALLE, muskeln: 'Schollenmuskel (Soleus), Achillessehne',
      schritte: ['Sitzen oder stehen mit etwa 30–40° gebeugten Knien, Fußballen auf einer Stufe.', 'Fersen so hoch wie möglich anheben.', 'Langsam absenken.'],
      achte: 'Der Soleus trägt beim Laufen ein Vielfaches des Körpergewichts – er wird oft vergessen.', leichter: 'Ohne Stufe', schwerer: 'Gewicht auf den Knien oder an der Sitz-Wadenmaschine' },
    { id: 'wade_einbein', name: 'Einbeiniges Wadenheben an der Stufe', muster: 'wade', geraet: ['gym', 'hantel', 'ohne'], art: 'koerper', eignung: ['kraft', 'aufbau', 'stabil', 'ausdauer'], einseitig: true, muskeln: 'Wade, Achillessehne, Fuß',
      schritte: ['Auf einem Bein mit dem Fußballen auf einer Stufe stehen, leicht festhalten.', 'Ganz hoch auf die Zehen, oben 1 s halten.', 'In 3 s so tief wie möglich absenken.'],
      achte: 'Gegen Achillessehnen-Beschwerden bewährt. Erst sauber 3 × 15 schaffen, dann Gewicht dazu.', leichter: 'Beidbeinig hoch, einbeinig runter', schwerer: 'Mit Kurzhantel oder Rucksack' },
    { id: 'tibialis', name: 'Schienbeinheben an der Wand', muster: 'wade', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'koerper', eignung: ALLE, muskeln: 'Schienbeinmuskel (Tibialis anterior)',
      schritte: ['Mit Rücken und Gesäß an die Wand lehnen, Füße etwa einen Fuß weit vor der Wand.', 'Die Zehen so weit wie möglich zum Schienbein hochziehen, Fersen bleiben am Boden.', 'Langsam wieder absenken.'],
      achte: 'Stärkt die Vorderseite des Unterschenkels – hilfreich gegen Schienbeinkantenschmerzen. Je weiter die Füße von der Wand, desto schwerer.', leichter: 'Füße näher an der Wand', schwerer: 'Einbeinig oder mit Band um den Fuß' },
    { id: 'fussgewoelbe', name: 'Kurzer Fuß', muster: 'fuss', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'halten', eignung: ALLE, muskeln: 'Fußmuskeln, Fußgewölbe',
      schritte: ['Barfuß stehen, Zehen locker lang lassen.', 'Den Fußballen Richtung Ferse ziehen, sodass sich das Gewölbe anhebt – die Zehen krallen nicht.', 'Spannung halten, dann lösen.'],
      achte: 'Kleine Bewegung, große Wirkung: Ein starkes Fußgewölbe fängt Stöße ab.', leichter: 'Im Sitzen', schwerer: 'Im Einbeinstand' },
    { id: 'einbeinstand', name: 'Einbeinstand auf weicher Unterlage', muster: 'fuss', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'halten', eignung: ['stabil', 'ausdauer'], einseitig: true, muskeln: 'Fuß, Sprunggelenk, Hüfte',
      schritte: ['Auf ein Kissen oder eine weiche Matte stellen, ein Bein anheben.', 'Das Knie bleibt leicht gebeugt.', 'Gleichgewicht halten, mit der Zeit Augen schließen.'],
      achte: 'Trainiert die Reflexe, die beim Umknicken schützen.', leichter: 'Fester Boden', schwerer: 'Augen zu oder den Kopf langsam drehen' },
    // Drücken
    { id: 'bankdruecken', name: 'Bankdrücken', muster: 'druecken', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'power'], muskeln: 'Brust, Trizeps, vordere Schulter',
      schritte: ['Auf die Bank legen, Augen unter der Stange, Füße fest am Boden.', 'Schulterblätter zusammen und nach unten ziehen.', 'Stange kontrolliert zur unteren Brust senken.', 'Kraftvoll nach oben drücken.'],
      achte: 'Ellbogen etwa 45° vom Körper, nicht ganz zur Seite. Schwer nur mit Sicherung.', leichter: 'Kurzhantel-Bankdrücken', schwerer: 'Mehr Gewicht oder 1 s Pause auf der Brust' },
    { id: 'kh_bank', name: 'Kurzhantel-Bankdrücken', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Brust, Trizeps, Schulter',
      schritte: ['Mit zwei Kurzhanteln auf eine Bank (oder den Boden) legen.', 'Hanteln seitlich der Brust, Unterarme senkrecht.', 'Nach oben drücken und kontrolliert absenken.'],
      achte: 'Beide Seiten arbeiten getrennt – das gleicht Unterschiede aus.', leichter: 'Leichtere Hanteln oder am Boden', schwerer: 'Schräge Bank' },
    { id: 'liegestuetz', name: 'Liegestütz', muster: 'druecken', geraet: ['gym', 'hantel', 'band', 'ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Brust, Trizeps, Rumpf',
      schritte: ['Hände etwas breiter als die Schultern, Körper gerade wie ein Brett.', 'Brust bis knapp über den Boden absenken.', 'Wieder hochdrücken, der Körper bleibt gerade.'],
      achte: 'Bauch und Gesäß fest – kein Durchhängen.', leichter: 'Hände erhöht auf Bank oder Tisch', schwerer: 'Füße erhöht oder 3 s runter' },
    { id: 'schulterdruecken', name: 'Schulterdrücken mit Kurzhanteln', muster: 'druecken', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Schultern, Trizeps',
      schritte: ['Stehend oder sitzend, Hanteln auf Schulterhöhe.', 'Senkrecht über den Kopf drücken.', 'Kontrolliert zurück auf Schulterhöhe.'],
      achte: 'Kein Hohlkreuz – Bauch anspannen. Bei Schulterbeschwerden lieber Face Pulls.', leichter: 'Einarmig im Wechsel', schwerer: 'Stehend mit Langhantel' },
    { id: 'pike', name: 'Pike-Liegestütz', muster: 'druecken', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['aufbau', 'kraft', 'stabil'], muskeln: 'Schultern, Trizeps',
      schritte: ['Aus dem Liegestütz die Hüfte weit nach oben schieben – umgedrehtes V.', 'Den Kopf zwischen den Händen Richtung Boden senken.', 'Zurück nach oben drücken.'],
      achte: 'Ersatz fürs Schulterdrücken ohne Geräte.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Füße erhöht auf einer Bank' },
    // Ziehen
    { id: 'klimmzug', name: 'Klimmzug', muster: 'ziehen', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau'], muskeln: 'Breiter Rückenmuskel, Bizeps',
      schritte: ['An die Stange hängen, Hände etwas breiter als die Schultern.', 'Schulterblätter nach unten ziehen, dann die Brust zur Stange ziehen.', 'Langsam ganz herunterlassen.'],
      achte: 'Genau der Muskel, der beim Schwimmen zieht. Geht auch an einer Stange zu Hause.', leichter: 'Mit Band als Hilfe oder nur langsam herunterlassen', schwerer: 'Mit Zusatzgewicht' },
    { id: 'latzug', name: 'Latziehen', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer'], muskeln: 'Breiter Rückenmuskel, Bizeps',
      schritte: ['Sitzen, Knie unter dem Polster, Stange etwas breiter als schulterbreit greifen.', 'Stange zur oberen Brust ziehen, Ellbogen nach unten und hinten.', 'Kontrolliert zurück nach oben.'],
      achte: 'Nicht mit Schwung aus dem Oberkörper ziehen.', leichter: 'Weniger Gewicht', schwerer: 'Klimmzug' },
    { id: 'rudern_kh', name: 'Einarmiges Kurzhantel-Rudern', muster: 'ziehen', geraet: ['gym', 'hantel'], art: 'kraft', eignung: ['kraft', 'aufbau', 'ausdauer', 'stabil'], einseitig: true, muskeln: 'Oberer Rücken, Lat, Bizeps',
      schritte: ['Eine Hand und ein Knie auf eine Bank, Rücken gerade.', 'Die Hantel mit dem Ellbogen nah am Körper zur Hüfte ziehen.', 'Langsam wieder strecken.'],
      achte: 'Die Bewegung kommt aus dem Schulterblatt, der Oberkörper dreht nicht auf.', leichter: 'Leichtere Hantel', schwerer: 'Oben 1 s halten' },
    { id: 'rudern_kabel', name: 'Rudern am Kabelzug', muster: 'ziehen', geraet: ['gym'], art: 'kraft', eignung: ['aufbau', 'ausdauer', 'kraft'], muskeln: 'Oberer Rücken, Bizeps',
      schritte: ['Aufrecht sitzen, Griff mit gestreckten Armen halten.', 'Griff zum Bauch ziehen, Schulterblätter zusammen.', 'Langsam nach vorne zurück.'],
      achte: 'Der Oberkörper bleibt ruhig.', leichter: 'Weniger Gewicht', schwerer: 'Einarmig' },
    { id: 'band_rudern', name: 'Rudern mit Band', muster: 'ziehen', geraet: ['band'], art: 'koerper', eignung: ['ausdauer', 'stabil', 'aufbau'], muskeln: 'Oberer Rücken, Schulterblätter',
      schritte: ['Band auf Brusthöhe befestigen oder um die Füße legen.', 'Enden zum Bauch ziehen, Schulterblätter zusammen.', 'Langsam nachgeben.'],
      achte: 'Gegengewicht zum vielen Sitzen auf dem Rad.', leichter: 'Leichteres Band', schwerer: 'Stärkeres Band, oben 2 s halten' },
    { id: 'tisch_rudern', name: 'Rudern unter dem Tisch', muster: 'ziehen', geraet: ['ohne'], art: 'koerper', eignung: ['aufbau', 'ausdauer', 'stabil'], muskeln: 'Oberer Rücken, Bizeps',
      schritte: ['Unter einen stabilen Tisch legen und die Tischkante greifen.', 'Körper gerade, Brust zur Tischkante ziehen.', 'Langsam ablassen.'],
      achte: 'Vorher prüfen, ob der Tisch sicher hält.', leichter: 'Knie beugen', schwerer: 'Beine gestreckt, Füße erhöht' },
    { id: 'band_lat', name: 'Lat-Zug mit Band (Schwimmzug)', muster: 'ziehen', geraet: ['band', 'gym'], art: 'koerper', eignung: ['ausdauer', 'aufbau', 'stabil'], muskeln: 'Lat, Trizeps, Schulter',
      schritte: ['Band über Kopfhöhe befestigen, leicht nach vorne beugen.', 'Mit fast gestreckten Armen das Band bis zu den Oberschenkeln ziehen – wie der Unterwasserzug.', 'Langsam zurück.'],
      achte: 'Der Ellbogen bleibt hoch wie im Wasser. Sehr schwimmspezifisch.', leichter: 'Leichteres Band', schwerer: 'Stärkeres Band, schneller ziehen' },
    // Schulter
    { id: 'aussenrot', name: 'Außenrotation mit Band', muster: 'schulter', geraet: ['band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer', 'aufbau'], einseitig: true, muskeln: 'Rotatorenmanschette',
      schritte: ['Band auf Ellbogenhöhe befestigen, Ellbogen 90° gebeugt am Körper.', 'Unterarm nach außen drehen, der Ellbogen bleibt am Körper.', 'Langsam zurück.'],
      achte: 'Kleine Muskeln – leichtes Band und viele saubere Wiederholungen. Schützt die Schwimmerschulter.', leichter: 'Ohne Band, nur die Bewegung', schwerer: 'Im Liegen mit leichter Kurzhantel' },
    { id: 'face_pull', name: 'Face Pull', muster: 'schulter', geraet: ['gym', 'band'], art: 'koerper', eignung: ['aufbau', 'stabil', 'ausdauer'], muskeln: 'Hintere Schulter, Schulterblätter',
      schritte: ['Seil am Kabelzug (oder Band) auf Kopfhöhe.', 'Zum Gesicht ziehen, Ellbogen hoch und die Hände nach außen drehen.', 'Kontrolliert zurück.'],
      achte: 'Gleicht die nach vorne gezogene Haltung von Rad und Schwimmen aus.', leichter: 'Leichteres Gewicht', schwerer: 'Oben 2 s halten' },
    { id: 'ytw', name: 'Y-T-W in Bauchlage', muster: 'schulter', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Unterer und mittlerer Trapez, hintere Schulter',
      schritte: ['Auf den Bauch legen, Stirn knapp über dem Boden.', 'Arme nacheinander in Y-, T- und W-Form anheben, Daumen zeigen nach oben.', 'Jede Position 2 s halten.'],
      achte: 'Die Schulterblätter ziehen nach hinten unten, nicht zu den Ohren.', leichter: 'Weniger hoch anheben', schwerer: 'Mit sehr leichten Hanteln' },
    { id: 'serratus', name: 'Liegestütz plus', muster: 'schulter', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Sägemuskel (Serratus), Schulterblatt',
      schritte: ['Im Unterarm- oder Liegestütz die Arme gestreckt halten.', 'Die Schulterblätter zusammensinken lassen, dann den Boden aktiv wegdrücken, bis der obere Rücken rund wird.', 'Langsam im Wechsel.'],
      achte: 'Stabilisiert das Schulterblatt – wichtig für schmerzfreie Schultern beim Kraulen.', leichter: 'An der Wand', schwerer: 'Mit Gewichtsweste oder einarmig' },
    // Rumpf
    { id: 'plank', name: 'Unterarmstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ALLE, muskeln: 'Bauch, Rumpf',
      schritte: ['Auf die Unterarme, Ellbogen unter den Schultern.', 'Körper gerade von Kopf bis Fuß, Gesäß und Bauch fest.', 'Ruhig weiteratmen und halten.'],
      achte: 'Lieber 20 s richtig als 2 min mit Hohlkreuz.', leichter: 'Auf den Knien', schwerer: 'Ein Bein oder einen Arm anheben' },
    { id: 'seitstuetz', name: 'Seitstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ALLE, einseitig: true, muskeln: 'Seitliche Bauchmuskeln, Hüfte',
      schritte: ['Seitlich auf den Unterarm, Ellbogen unter der Schulter.', 'Hüfte anheben, bis der Körper eine gerade Linie bildet.', 'Halten, dann Seite wechseln.'],
      achte: 'Stabilisiert das Becken beim Laufen.', leichter: 'Unteres Knie am Boden', schwerer: 'Oberes Bein anheben' },
    { id: 'copenhagen', name: 'Copenhagen-Seitstütz', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['stabil', 'kraft', 'aufbau'], einseitig: true, muskeln: 'Adduktoren, seitlicher Rumpf',
      schritte: ['Seitstütz, das obere Bein liegt auf einer Bank – Knie oder Fuß.', 'Hüfte anheben, das untere Bein hängt frei oder wird mit angehoben.', 'Halten, Seite wechseln.'],
      achte: 'Senkt nachweislich Leistenverletzungen. Mit dem Knie auf der Bank beginnen.', leichter: 'Knie statt Fuß auf der Bank', schwerer: 'Fuß auf der Bank, unteres Bein bewegen' },
    { id: 'deadbug', name: 'Dead Bug', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer', 'aufbau'], muskeln: 'Tiefe Bauchmuskeln',
      schritte: ['Auf den Rücken, Arme senkrecht nach oben, Knie und Hüfte 90° gebeugt.', 'Den unteren Rücken in den Boden drücken.', 'Gegengleich einen Arm und ein Bein langsam strecken, zurück, Seite wechseln.'],
      achte: 'Der untere Rücken bleibt die ganze Zeit am Boden.', leichter: 'Nur die Beine bewegen', schwerer: 'Leichte Hantel in den Händen' },
    { id: 'birddog', name: 'Bird Dog', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'koerper', eignung: ['stabil', 'ausdauer'], muskeln: 'Rückenstrecker, Gesäß, Rumpf',
      schritte: ['Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte.', 'Gegengleich Arm und Bein lang ausstrecken.', '2 s halten, zurück, Seite wechseln.'],
      achte: 'Das Becken kippt nicht zur Seite – stell dir ein Glas Wasser auf dem Rücken vor.', leichter: 'Nur Arm oder nur Bein', schwerer: 'Ellbogen und Knie unter dem Bauch zusammenführen' },
    { id: 'pallof', name: 'Pallof Press', muster: 'rumpf', geraet: ['band', 'gym'], art: 'koerper', eignung: ['stabil', 'aufbau', 'ausdauer'], einseitig: true, muskeln: 'Rumpf gegen Verdrehen',
      schritte: ['Seitlich zum befestigten Band oder Kabelzug stehen, Griff an der Brust.', 'Arme gerade nach vorne strecken – der Zug will dich verdrehen.', '2 s halten, zurück zur Brust.'],
      achte: 'Der Oberkörper bleibt still. Genau diese Stabilität braucht man in der Aero-Position.', leichter: 'Näher am Befestigungspunkt', schwerer: 'Im Halbkniestand oder weiter weg' },
    { id: 'rollout', name: 'Ab-Rollout', muster: 'rumpf', geraet: ['gym'], art: 'koerper', eignung: ['kraft', 'aufbau', 'stabil'], muskeln: 'Bauch, Lat',
      schritte: ['Im Kniestand das Rad oder die Langhantel mit Scheiben greifen.', 'Langsam nach vorne rollen, der Körper bleibt gerade.', 'Mit dem Bauch zurückziehen.'],
      achte: 'Nur so weit, wie kein Hohlkreuz entsteht.', leichter: 'Kürzerer Weg, gegen eine Wand rollen', schwerer: 'Aus dem Stand' },
    { id: 'koffer', name: 'Koffer-Tragen', muster: 'rumpf', geraet: ['gym', 'hantel'], art: 'halten', eignung: ['stabil', 'kraft', 'ausdauer'], einseitig: true, muskeln: 'Seitlicher Rumpf, Griff, Schultern',
      schritte: ['Eine schwere Kurzhantel oder Kettlebell in eine Hand nehmen.', 'Aufrecht gehen, ohne zur Seite zu kippen.', 'Strecke oder Zeit gehen, dann Hand wechseln.'],
      achte: 'Simpel und sehr wirksam für einen stabilen Rumpf beim Laufen.', leichter: 'Leichteres Gewicht', schwerer: 'Schwerer oder über eine Treppe' },
    { id: 'hollow', name: 'Hollow Hold', muster: 'rumpf', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'halten', eignung: ['stabil', 'kraft', 'aufbau'], muskeln: 'Bauch',
      schritte: ['Auf den Rücken, unteren Rücken in den Boden drücken.', 'Schultern und gestreckte Beine knapp über den Boden anheben.', 'Körperspannung halten – eine flache Banane.'],
      achte: 'Die Körperspannung von Turnern – hilft auch für eine gestreckte Wasserlage.', leichter: 'Knie gebeugt', schwerer: 'Arme über den Kopf strecken' },
    // Sprünge
    { id: 'hocksprung', name: 'Hocksprung', muster: 'plyo', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'plyo', eignung: ['power', 'ausdauer'], muskeln: 'Beine, Gesäß – Schnellkraft',
      schritte: ['Schulterbreiter Stand, kurz in die Viertelhocke.', 'Explosiv so hoch wie möglich springen, Arme schwingen mit.', 'Weich landen und kurz stabilisieren, dann der nächste Sprung.'],
      achte: 'Qualität vor Menge: Hör auf, sobald die Sprünge niedriger werden.', leichter: 'Kleinere Sprünge', schwerer: 'Mehrere Sprünge direkt hintereinander' },
    { id: 'kastensprung', name: 'Kastensprung', muster: 'plyo', geraet: ['gym', 'ohne'], art: 'plyo', eignung: ['power'], muskeln: 'Beine, Gesäß – Schnellkraft',
      schritte: ['Vor eine stabile Kiste stellen.', 'Mit Armschwung beidbeinig auf die Kiste springen, weich landen.', 'Heruntersteigen, nicht springen.'],
      achte: 'Herunterzusteigen schont die Sehnen – die Landung von oben ist die eigentliche Belastung.', leichter: 'Niedrigere Kiste', schwerer: 'Höher oder aus dem Stand einbeinig' },
    { id: 'pogo', name: 'Pogo-Sprünge', muster: 'plyo', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'plyo', eignung: ['power', 'stabil', 'ausdauer'], muskeln: 'Waden, Achillessehne – Federwirkung',
      schritte: ['Aufrecht stehen, Knie fast gestreckt.', 'Nur aus den Fußgelenken kurz und federnd hüpfen, wie ein Flummi.', 'Möglichst kurze Bodenkontakte.'],
      achte: 'Verbessert die Laufökonomie, weil die Sehne Energie speichert. Am Anfang kurz halten (2 × 15).', leichter: 'Langsamer, weicher', schwerer: 'Einbeinig' },
    { id: 'skater', name: 'Seitsprünge (Skater)', muster: 'plyo', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'plyo', eignung: ['power', 'ausdauer', 'stabil'], muskeln: 'Gesäß, Beine, Stabilität',
      schritte: ['Von einem Bein seitlich auf das andere springen.', 'Landung stabil halten, 1 s, dann zurück.', 'Wie ein Eisschnellläufer.'],
      achte: 'Das Knie bleibt bei der Landung über dem Fuß.', leichter: 'Kleinere Sprünge, kurz absetzen', schwerer: 'Weiter und ohne Halt' },
    // Mobilität
    { id: 'hueftbeuger', name: 'Hüftbeuger-Dehnung im Kniestand', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Hüftbeuger, Oberschenkel vorn',
      schritte: ['In den Kniestand, ein Fuß vorne aufgestellt.', 'Gesäß anspannen und das Becken leicht nach vorne schieben.', 'Dehnung vorne an der Hüfte des hinteren Beins halten.'],
      achte: 'Nach langen Radeinheiten besonders wichtig – die Aero-Position verkürzt die Hüftbeuger.', leichter: 'Weniger weit nach vorne', schwerer: 'Arm der gleichen Seite über den Kopf' },
    { id: 'weltbeste', name: '„Beste Dehnung der Welt“', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Hüfte, Beinbeuger, Brustwirbelsäule',
      schritte: ['Großer Ausfallschritt, beide Hände innen neben dem vorderen Fuß.', 'Den inneren Arm zur Decke drehen und nachschauen.', 'Zurück, dann das vordere Bein strecken. Seite wechseln.'],
      achte: 'Ideal zum Aufwärmen – öffnet in einer Übung Hüfte und Rücken.', leichter: 'Hinteres Knie absetzen', schwerer: 'Länger in jeder Position bleiben' },
    { id: 'bws_rotation', name: 'Brustwirbelsäulen-Drehung', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Brustwirbelsäule, Schultern',
      schritte: ['Vierfüßlerstand, eine Hand an den Hinterkopf.', 'Ellbogen zur anderen Hand führen, dann weit zur Decke aufdrehen.', 'Langsam im Atemrhythmus.'],
      achte: 'Eine bewegliche Brustwirbelsäule hilft beim Atmen im Kraulen und in der Aero-Position.', leichter: 'Kleinerer Bewegungsweg', schwerer: 'Im Seitliegen mit Arm-Öffnen' },
    { id: 'wade_dehnen', name: 'Waden-Dehnung an der Wand', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, einseitig: true, muskeln: 'Wade, Soleus',
      schritte: ['Hände an die Wand, ein Bein weit nach hinten, Ferse am Boden.', 'Erst mit gestrecktem Knie, dann mit leicht gebeugtem Knie dehnen.', 'Jeweils halten, Seite wechseln.'],
      achte: 'Mit gebeugtem Knie erreichst du den Soleus.', leichter: 'Kürzerer Schritt', schwerer: 'Fußballen auf eine Stufe' },
    { id: 'huefte_9090', name: '90/90-Hüftdrehung', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, muskeln: 'Hüfte innen und außen',
      schritte: ['Sitzen, beide Knie 90° gebeugt – ein Bein vorne, eines seitlich.', 'Aufrecht bleiben und die Knie zur anderen Seite kippen.', 'Langsam hin und her.'],
      achte: 'Trainiert die Drehung der Hüfte, die Läufern oft fehlt.', leichter: 'Hände hinter dem Körper abstützen', schwerer: 'Ohne Hände, Oberkörper nach vorne lehnen' },
    { id: 'lat_dehnen', name: 'Lat- und Schulter-Dehnung', muster: 'mobil', geraet: ['ohne', 'hantel', 'band', 'gym'], art: 'mobil', eignung: ALLE, muskeln: 'Lat, Schultern, Brust',
      schritte: ['Vor eine Bank oder einen Stuhl knien, Ellbogen darauf ablegen.', 'Hände hinter dem Kopf falten, Brust Richtung Boden sinken lassen.', 'Atmen und halten.'],
      achte: 'Gut für Schwimmer: mehr Reichweite über Kopf ohne Hohlkreuz.', leichter: 'Weniger tief', schwerer: 'Mit Stab in den Händen' },
  ];
  const BY = Object.fromEntries(U.map((u) => [u.id, u]));

  /* ---------- Tage, Schwerpunkte, Ausrüstung ---------- */
  const TAGE = {
    ganz: { name: 'Ganzkörper', icon: 'i-user', slots: ['knie', 'huefte', 'ziehen', 'druecken', 'einbein', 'rumpf', 'wade', 'schulter', 'rumpf'] },
    unten: { name: 'Beine & Gesäß', icon: 'i-run', slots: ['knie', 'huefte', 'einbein', 'wade', 'einbein', 'huefte', 'fuss', 'rumpf', 'wade'] },
    oben: { name: 'Oberkörper', icon: 'i-swim', slots: ['ziehen', 'druecken', 'ziehen', 'schulter', 'druecken', 'rumpf', 'schulter', 'rumpf'] },
    rumpf: { name: 'Rumpf & Stabilität', icon: 'i-target', slots: ['rumpf', 'huefte', 'rumpf', 'einbein', 'rumpf', 'schulter', 'fuss', 'rumpf'] },
    lauf: { name: 'Läufer-Prävention', icon: 'i-run', slots: ['wade', 'wade', 'einbein', 'huefte', 'fuss', 'rumpf', 'einbein', 'wade', 'plyo'] },
    athletik: { name: 'Sprungkraft', icon: 'i-bolt', slots: ['plyo', 'plyo', 'knie', 'huefte', 'einbein', 'plyo', 'rumpf', 'wade'] },
    mobil: { name: 'Mobilität', icon: 'i-wave', slots: ['mobil', 'mobil', 'mobil', 'mobil', 'mobil', 'mobil', 'mobil', 'mobil'] },
  };
  const FOKUS = {
    kraft: { name: 'Maximalkraft', kurz: 'schwer · 4–6 Wdh.', saetze: 4, wdh: '4–6', pause: '2–3 min', halten: '20–30 s', hinweis: 'Schwer, aber sauber: Nach jedem Satz sollten noch 1–2 Wiederholungen gehen. Verbessert die Laufökonomie und die Kraft am Pedal, ohne Masse aufzubauen.' },
    aufbau: { name: 'Muskelaufbau', kurz: 'mittel · 8–12 Wdh.', saetze: 3, wdh: '8–12', pause: '60–90 s', halten: '30–45 s', hinweis: 'Mittelschwer, bis kurz vor die Grenze (1–3 Wiederholungen Reserve). Gut in der Vorbereitung.' },
    ausdauer: { name: 'Kraftausdauer', kurz: 'leicht · 15–20 Wdh.', saetze: 3, wdh: '15–20', pause: '30–45 s', halten: '45–60 s', hinweis: 'Als Zirkel: alle Übungen nacheinander, dann die Runde wiederholen. Sauber bis zur letzten Wiederholung.' },
    power: { name: 'Schnellkraft', kurz: 'explosiv · 3–6 Wdh.', saetze: 4, wdh: '3–6', pause: '90 s–2 min', halten: '20–30 s', hinweis: 'So schnell wie möglich bewegen und volle Pausen machen. Aufhören, wenn die Bewegung langsamer wird.' },
    stabil: { name: 'Stabilität', kurz: 'kontrolliert · 10–15 Wdh.', saetze: 3, wdh: '10–15', pause: '45–60 s', halten: '30–40 s', hinweis: 'Langsam (3 s nach unten) und mit voller Kontrolle – Technik vor Gewicht. Ideal zur Verletzungsvorbeugung.' },
  };
  const GERAET = { gym: ['Fitnessstudio', ['gym', 'hantel', 'band', 'ohne']], hantel: ['Zuhause mit Hanteln & Band', ['hantel', 'band', 'ohne']], ohne: ['Ohne Geräte', ['ohne']] };
  const DAUER = [20, 30, 45, 60];
  const ERSATZ = { knie: 'einbein', huefte: 'einbein', plyo: 'einbein', fuss: 'wade' };
  const ANZAHL = { kraft: [3, 4, 5, 6], aufbau: [4, 5, 6, 8], ausdauer: [5, 6, 8, 9], power: [3, 4, 5, 6], stabil: [4, 5, 7, 8], mobil: [5, 6, 8, 8] };
  const PHASE = {
    vorbereitung: ['aufbau', 'Vorbereitung: 2–3 × Kraft pro Woche – jetzt ist Platz für Muskelaufbau und saubere Technik.'],
    grundlage: ['kraft', 'Grundlage: Maximalkraft 2 × pro Woche – schwer und wenige Wiederholungen verbessern die Ökonomie in Lauf und Rad.'],
    aufbau: ['kraft', 'Aufbau: Kraft 1 × pro Woche halten – schwer, aber mit wenig Umfang, damit die Ausdauer-Einheiten frisch bleiben.'],
    spitze: ['power', 'Spitze: 1 × pro Woche kurz und knackig – wenige schwere oder explosive Sätze.'],
    taper: ['stabil', 'Tapering: Schwere Kraft etwa 10 Tage vor dem Rennen beenden – nur noch Mobilität und leichte Aktivierung.'],
    rennwoche: ['stabil', 'Rennwoche: keine Kraft mehr, nur Mobilität.'],
    rennen: ['stabil', 'Renntag – heute nur lockern.'],
    uebergang: ['aufbau', 'Übergang: lockere Ganzkörper-Einheiten nach Lust.'],
  };

  /* ---------- Zustand ---------- */
  const G = Object.assign({ tag: 'ganz', fokus: null, geraet: 'gym', dauer: 45, seed: 1, tausch: {}, bib: 'alle' }, speicher('tf:gym', {}));
  const save = () => merke('tf:gym', G);
  let offen = null; // nach „Andere Übung“ die neue gleich aufgeklappt zeigen
  function zufall(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mische(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const phaseJetzt = () => { const s = (rowsOf('saison') || [])[0]; return s && PHASE[s.phase] ? s.phase : null; };
  const fokusJetzt = () => G.fokus || (phaseJetzt() ? PHASE[phaseJetzt()][0] : 'aufbau');

  // Workout zusammenstellen: je Platz eine passende Übung, keine doppelt
  function workout() {
    const tag = TAGE[G.tag] ? G.tag : 'ganz', fokus = tag === 'mobil' ? 'mobil' : fokusJetzt(), erlaubt = GERAET[G.geraet][1];
    const n = ANZAHL[fokus][DAUER.indexOf(G.dauer) >= 0 ? DAUER.indexOf(G.dauer) : 2], slots = TAGE[tag].slots.slice(0, n), rnd = zufall(G.seed * 9973 + n * 31 + tag.length * 7);
    const genutzt = new Set(), liste = [];
    slots.forEach((m, i) => {
      const passt = (u) => u.muster === m && u.geraet.some((g) => erlaubt.includes(g)) && !genutzt.has(u.id);
      let kand = U.filter((u) => passt(u) && (fokus === 'mobil' || u.eignung.includes(fokus)));
      if (!kand.length && ERSATZ[m]) kand = U.filter((u) => u.muster === ERSATZ[m] && u.geraet.some((g) => erlaubt.includes(g)) && !genutzt.has(u.id) && u.eignung.includes(fokus)); // z. B. ohne Geräte schwer: einbeinig statt beidbeinig
      if (!kand.length) kand = U.filter(passt);
      if (!kand.length) return;
      kand = mische(kand, rnd);
      const k = (G.tausch[i] || 0) % kand.length, u = kand[k];
      genutzt.add(u.id); liste.push({ u, slot: i, alternativen: kand.length });
    });
    return { tag, fokus, liste };
  }
  function vorgabe(u, fokus) { // Sätze × Wiederholungen bzw. Sekunden für diese Übung
    const F = FOKUS[fokus] || FOKUS.aufbau, seite = u.einseitig ? ' je Seite' : '';
    if (fokus === 'mobil' || u.art === 'mobil') return { saetze: 2, wert: u.einseitig ? '45 s' : '8–10 Wdh. oder 60 s', pause: 'fließend', text: '2 × ' + (u.einseitig ? '45 s je Seite' : '8–10 Wdh. oder 60 s') };
    if (u.art === 'plyo') return { saetze: fokus === 'power' ? 4 : 3, wert: '5–8 Wdh.', pause: '60–90 s', text: (fokus === 'power' ? 4 : 3) + ' × 5–8' + seite + ' · Pause 60–90 s' };
    if (u.art === 'halten') return { saetze: F.saetze, wert: F.halten, pause: F.pause, text: F.saetze + ' × ' + F.halten + seite + ' · Pause ' + F.pause };
    let wdh = F.wdh;
    if (u.art === 'koerper' && fokus === 'kraft') wdh = '6–8 (schwerste Variante)';
    if (u.muster === 'wade' || u.muster === 'schulter') wdh = fokus === 'kraft' ? '8–10' : fokus === 'power' ? '8–12' : F.wdh;
    if (u.id === 'nordic') wdh = fokus === 'ausdauer' ? '6–8' : '3–6';
    return { saetze: F.saetze, wert: wdh, pause: F.pause, text: F.saetze + ' × ' + wdh + seite + ' · Pause ' + F.pause };
  }
  const AUFWAERMEN = ['5 min locker: Rad, Rudergerät, Seilspringen oder zügig gehen', 'Mobilität: 2 Übungen aus der Liste unten, je 30–45 s', '1–2 leichte Sätze der ersten Übung'];
  const ABSCHLUSS = ['3–5 min locker auslaufen oder -radeln', 'Hüftbeuger und Waden dehnen, je 45 s'];

  /* ---------- Darstellung ---------- */
  function renderGym() {
    const box = $('#gym-box'); if (!box) return;
    box.replaceChildren();
    const grid = el('div', { class: 'tf-grid' }); box.appendChild(grid);
    grid.appendChild(auswahl());
    grid.appendChild(workoutKarte());
    grid.appendChild(bibliothek());
  }
  function chips(items, cur, on, cls) {
    const box = el('div', { class: 'tf-chipset ' + (cls || ''), role: 'group' });
    items.forEach(([v, l, icon]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, icon ? ico(icon) : null, (icon ? ' ' : '') + l); b.addEventListener('click', () => on(v)); box.appendChild(b); });
    return box;
  }
  function neu(fn) { return (v) => { fn(v); G.tausch = {}; save(); renderGym(); }; }
  function auswahl() {
    const c = karte({ farbe: 'purple', icon: 'i-dumbbell', titel: 'Workout zusammenstellen', sub: 'Tag, Schwerpunkt, Ausrüstung und Zeit wählen – die Übungen kommen mit Erklärung', span2: true });
    const ph = phaseJetzt(), fok = fokusJetzt(), H = heute();
    const rows = el('div', { class: 'tf-gym-wahl' },
      el('div', { class: 'tf-field' }, el('span', { text: 'Welcher Tag?' }), chips(Object.entries(TAGE).map(([k, t]) => [k, t.name, t.icon]), G.tag, neu((v) => { G.tag = v; }))),
      G.tag === 'mobil' ? null : el('div', { class: 'tf-field' }, el('span', { text: 'Schwerpunkt' }), chips(Object.entries(FOKUS).map(([k, f]) => [k, f.name]), fok, neu((v) => { G.fokus = v; })), el('small', { class: 'tf-ich-hint', text: FOKUS[fok].kurz + (G.fokus ? '' : ' · passend zu deiner Trainingsphase') })),
      el('div', { class: 'tf-gym-2' },
        el('div', { class: 'tf-field' }, el('span', { text: 'Ausrüstung' }), chips(Object.entries(GERAET).map(([k, g]) => [k, g[0]]), G.geraet, neu((v) => { G.geraet = v; }))),
        el('div', { class: 'tf-field' }, el('span', { text: 'Dauer' }), chips(DAUER.map((d) => [d, d + ' min']), G.dauer, neu((v) => { G.dauer = v; }), 'tf-gym-dauer'))));
    c.appendChild(rows);
    const hin = el('div', { class: 'tf-gym-hinweise' });
    if (ph) hin.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('blue'), PHASE[ph][1] + (G.fokus && G.fokus !== PHASE[ph][0] ? ' Passend wäre „' + FOKUS[PHASE[ph][0]].name + '“.' : '')));
    if (H && H.ampel === 'rot') hin.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('red'), 'Deine Tagesform ist heute niedrig – lieber Mobilität oder eine leichte Stabilitäts-Einheit.'));
    else if (H && H.ampel === 'gelb' && fok === 'kraft') hin.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('yellow'), 'Tagesform moderat: Schwer geht, aber mit einem Satz weniger.'));
    if (G.fokus && ph) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'padding-left:0' }, 'Schwerpunkt wieder nach Trainingsphase'); b.addEventListener('click', neu(() => { G.fokus = null; })); hin.appendChild(b); }
    if (hin.childElementCount) c.appendChild(hin);
    return c;
  }
  function workoutKarte() {
    const W = workout(), F = W.fokus === 'mobil' ? null : FOKUS[W.fokus], tag = TAGE[W.tag];
    const mischen = el('button', { type: 'button', class: 'tf-btn' }, ico('i-shuffle'), ' Neu mischen');
    mischen.addEventListener('click', () => { G.seed = (G.seed % 100000) + 1; G.tausch = {}; save(); renderGym(); });
    const c = karte({ farbe: 'purple', icon: tag.icon, titel: tag.name + (F ? ' · ' + F.name : ''), sub: G.dauer + ' min · ' + GERAET[G.geraet][0] + ' · ' + W.liste.length + ' Übungen', span2: true, kpi: el('div', { class: 'tf-kpi' }, mischen), id: 'karte-workout' });
    if (F) c.appendChild(el('div', { class: 'tf-chips tf-gym-meta' }, el('span', { class: 'tf-chip' }, ico('i-bolt'), F.saetze + ' Sätze'), el('span', { class: 'tf-chip' }, ico('i-target'), F.wdh + ' Wdh.'), el('span', { class: 'tf-chip' }, ico('i-clock'), 'Pause ' + F.pause)));
    if (F) c.appendChild(el('p', { class: 'tf-note', text: F.hinweis }));
    const sek = (titel, items) => el('div', { class: 'tf-gym-sek' }, el('div', { class: 'tf-ctrl-l', text: titel }), el('ul', { class: 'tf-gym-ul' }, ...items.map((t) => el('li', { text: t }))));
    if (W.tag !== 'mobil') c.appendChild(sek('Aufwärmen · 6–8 min', AUFWAERMEN));
    const list = el('div', { class: 'tf-gym-liste' });
    W.liste.forEach(({ u, slot, alternativen }, i) => {
      const d = uebung(u, i + 1, vorgabe(u, W.fokus), alternativen > 1 ? () => { G.tausch[slot] = (G.tausch[slot] || 0) + 1; offen = slot; save(); renderGym(); requestAnimationFrame(() => { const n = $('#karte-workout .tf-gym-liste > .tf-gym-u:nth-child(' + (i + 1) + ')'); if (n) n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); } : null);
      if (slot === offen) d.open = true;
      list.appendChild(d);
    });
    offen = null;
    c.append(el('div', { class: 'tf-ctrl-l', style: 'margin-top:14px', text: W.tag === 'mobil' ? 'Ablauf' : F && W.fokus === 'ausdauer' ? 'Hauptteil · als Zirkel' : 'Hauptteil' }), list);
    if (!W.liste.length) list.appendChild(el('p', { class: 'tf-empty', text: 'Mit dieser Ausrüstung gibt es für diesen Tag keine passenden Übungen.' }));
    c.appendChild(sek('Abschluss · 5 min', ABSCHLUSS));
    return c;
  }
  function uebung(u, nr, v, tauschen) {
    const d = el('details', { class: 'tf-gym-u', id: 'ueb-' + u.id });
    const sum = el('summary', null, el('span', { class: 'tf-gym-nr num', text: String(nr) }), el('span', { class: 'tf-gym-ut' }, el('b', { text: u.name }), el('small', { text: v.text })), el('span', { class: 'tf-gym-mu', text: u.muskeln }));
    d.appendChild(sum);
    const body = el('div', { class: 'tf-gym-body' },
      el('ol', { class: 'tf-steps' }, ...u.schritte.map((s) => el('li', { text: s }))),
      el('p', { class: 'tf-gym-achte' }, el('b', { text: 'Worauf achten: ' }), u.achte),
      el('div', { class: 'tf-gym-var' }, el('div', null, el('small', { text: 'Leichter' }), el('span', { text: u.leichter })), el('div', null, el('small', { text: 'Schwerer' }), el('span', { text: u.schwerer }))),
      el('div', { class: 'tf-gym-tags' }, ...u.geraet.map((g) => el('span', { class: 'tf-pf-tag', text: { gym: 'Studio', hantel: 'Hanteln', band: 'Band', ohne: 'ohne Geräte' }[g] }))));
    if (tauschen) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'padding-left:0' }, ico('i-shuffle'), ' Andere Übung'); b.addEventListener('click', (e) => { e.preventDefault(); tauschen(); }); body.appendChild(b); }
    d.appendChild(body);
    return d;
  }
  const MUSTER = [['alle', 'Alle'], ['knie', 'Kniebeuge'], ['huefte', 'Hüfte'], ['einbein', 'Einbeinig'], ['wade', 'Wade & Schienbein'], ['fuss', 'Fuß'], ['druecken', 'Drücken'], ['ziehen', 'Ziehen'], ['schulter', 'Schulter'], ['rumpf', 'Rumpf'], ['plyo', 'Sprünge'], ['mobil', 'Mobilität']];
  function bibliothek() {
    const c = karte({ farbe: 'gray', icon: 'i-info', titel: 'Übungsbibliothek', sub: U.length + ' Übungen mit Anleitung – nach Bewegung gefiltert', span2: true, id: 'karte-bibliothek' });
    const erlaubt = GERAET[G.geraet][1];
    c.appendChild(chips(MUSTER.map(([k, l]) => [k, l]), G.bib, (v) => { G.bib = v; save(); renderGym(); requestAnimationFrame(() => { const k = $('#karte-bibliothek'); if (k && k.getBoundingClientRect().top < 0) k.scrollIntoView({ block: 'start' }); }); }, 'tf-gym-filter'));
    const L = U.filter((u) => (G.bib === 'alle' || u.muster === G.bib) && u.geraet.some((g) => erlaubt.includes(g)));
    const list = el('div', { class: 'tf-gym-liste tf-gym-bib' });
    L.forEach((u, i) => list.appendChild(uebung(u, i + 1, { text: MUSTER.find((m) => m[0] === u.muster)[1] + (u.einseitig ? ' · einseitig' : '') }, null)));
    if (!L.length) list.appendChild(el('p', { class: 'tf-empty', text: 'Keine Übung für diese Auswahl mit „' + GERAET[G.geraet][0] + '“.' }));
    c.appendChild(list);
    c.appendChild(el('p', { class: 'tf-note tf-quelle', text: 'Kraft für Ausdauersportler: schweres Krafttraining verbessert Lauf- und Radökonomie (Rønnestad & Mujika, Scand J Med Sci Sports 2014; Beattie et al., Sports Med 2014). Kraft- und Stabilitätstraining senkt Sportverletzungen deutlich (Lauersen et al., Br J Sports Med 2014). Nordic Hamstring: van der Horst et al., Am J Sports Med 2015 · Copenhagen-Übung: Harøy et al., Br J Sports Med 2019.' }));
    return c;
  }

  T.seite('gym', renderGym);
  window.tfGym = { anzahl: U.length, workout, vorgabe };
})();
