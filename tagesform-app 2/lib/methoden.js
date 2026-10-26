// Herleitung jeder Kennzahl – wird auf der Seite „Methodik“ angezeigt.
const METHODEN = [
 {
  "id": "score",
  "bereich": "Erholung",
  "kennzahl": "Tagesform-Score",
  "formel": "z = 0,4 · HRV + 0,2 · Ruhepuls + 0,2 · Schlafleistung + 0,2 · Befinden, jeweils als Abweichung von deiner eigenen Norm (Garmin-Werte: letzte 60 Nächte, Befinden: letzte 28 Check-ins). Ohne Check-in zählen 0,5 / 0,25 / 0,25. HRV-Anteil = 0,7 · letzte Nacht + 0,3 · 7-Tage-Schnitt. Score = 100 · Φ(z / Streuung). Absolute Grenzen: Schlaf unter 65 % des Bedarfs → höchstens 66, unter 50 % → höchstens 33; erhöhte Atemfrequenz, Krankheitsgefühl oder Schmerz ab 7/10 → höchstens 33.",
  "deutung": "67–99 bereit, 34–66 moderat, 1–33 erholen. Die HRV zählt am meisten, weil sie der empfindlichste autonome Marker ist; dein Befinden ergänzt, was Sensoren nicht sehen. Chronischer Schlafmangel steckt in der Schlafschuld, nicht im Tagesscore.",
  "quelle": "Buchheit, Front Physiol 2014 · Bellenger et al., Sports Med 2016 · Saw et al., Br J Sports Med 2016 · Fullagar et al., Sports Med 2015"
 },
 {
  "id": "hrv",
  "bereich": "Erholung",
  "kennzahl": "HRV-Normalbereich",
  "formel": "ln(RMSSD) je Nacht. 7-Tage-Schnitt (mind. 3 Nächte) gegen deine Basis: Mittelwert ± 0,5 SD der letzten 60 gültigen Nächte, höchstens 120 Tage zurück, mind. 14 Nächte.",
  "deutung": "Liegt der 7-Tage-Schnitt unter dem Band, verarbeitest du Belastung schlechter; im Band ist alles im Rahmen. Einzelne Nächte schwanken stark und zählen deshalb weniger.",
  "quelle": "Plews et al., Sports Med 2013 · Plews et al., IJSPP 2014 · Vesterinen et al., Med Sci Sports Exerc 2016"
 },
 {
  "id": "rhr",
  "bereich": "Erholung",
  "kennzahl": "Ruhepuls-Abweichung",
  "formel": "Garmin-Ruhepuls in Nächten mit Schlafdaten gegen deine Basis (Mittelwert und Standardabweichung, 60 Nächte).",
  "deutung": "Ein Wert deutlich über der Basis kann auf Ermüdung, Hitze, Alkohol oder einen beginnenden Infekt hinweisen.",
  "quelle": "Buchheit, Front Physiol 2014 · Achten & Jeukendrup, Sports Med 2003"
 },
 {
  "id": "quadrant",
  "bereich": "Erholung",
  "kennzahl": "Autonomer Status",
  "formel": "7-Tage-Schnitt von HRV und Ruhepuls, jeweils als z-Wert gegen die Basis. Innerhalb ± 0,5 = normal.",
  "deutung": "HRV hoch + Puls niedrig: gut erholt. HRV tief + Puls hoch: Ermüdung oder Stress. Beides tief: mögliche parasympathische Sättigung bei sehr hoher Belastung.",
  "quelle": "Buchheit, Front Physiol 2014 · Le Meur et al., Med Sci Sports Exerc 2013"
 },
 {
  "id": "atmung",
  "bereich": "Erholung",
  "kennzahl": "Atemfrequenz im Schlaf",
  "formel": "Abweichung von deiner Basis. Warnung ab + 1,0 Atemzüge/min und mindestens 2 Standardabweichungen.",
  "deutung": "Die nächtliche Atemfrequenz ist sehr stabil; ein Anstieg zeigt sich oft schon Tage vor Symptomen eines Infekts.",
  "quelle": "Miller et al., PLoS One 2020"
 },
 {
  "id": "schlaf",
  "bereich": "Schlaf",
  "kennzahl": "Schlafleistung & Schlafschuld",
  "formel": "Schlafleistung = Schlafdauer / Bedarf (Garmin-Schlafbedarf, sonst 8 h). Schlafschuld = Summe der Defizite der letzten 7 Nächte. Nächte unter 3 h oder über 13 h gelten als Messfehler.",
  "deutung": "Chronisch zu wenig Schlaf summiert sich zu Defiziten wie nach einer durchwachten Nacht – ohne dass man es selbst merkt.",
  "quelle": "Van Dongen et al., Sleep 2003 · Walsh et al., Br J Sports Med 2021"
 },
 {
  "id": "rhythmus",
  "bereich": "Schlaf",
  "kennzahl": "Regelmäßigkeit & Social Jetlag",
  "formel": "Standardabweichung der Einschlaf- und Aufwachzeit. Social Jetlag = Abstand der Schlafmitte am Wochenende zur Schlafmitte unter der Woche.",
  "deutung": "Ab etwa 1 h Social Jetlag lebt der Körper wie mit wöchentlichem Zeitzonenwechsel; unregelmäßiger Schlaf geht mit schlechterer Leistung einher.",
  "quelle": "Wittmann et al., Chronobiol Int 2006 · Phillips et al., Sci Rep 2017"
 },
 {
  "id": "tss",
  "bereich": "Training",
  "kennzahl": "Belastung (TSS)",
  "formel": "Rad mit Leistung: h · IF² · 100, IF = NP / FTP. Schwimmen: h · IF³ · 100, IF = Tempo / CSS-Tempo. Sonst hrTSS = TRIMP / TRIMP(1 h an der Schwelle) · 100, TRIMP = Σ Minuten · HRr · 0,64 · e^(1,92 · HRr).",
  "deutung": "100 entspricht etwa einer Stunde an der Schwelle. Unplausible Schwimmtempi (Bahnzählfehler) werden über die Herzfrequenz gerechnet.",
  "quelle": "Allen & Coggan 2010 · Banister 1991"
 },
 {
  "id": "pmc",
  "bereich": "Training",
  "kennzahl": "Fitness, Ermüdung, Form",
  "formel": "Fitness (CTL) = exponentielles 42-Tage-Mittel der Tagesbelastung, Ermüdung (ATL) = 7-Tage-Mittel, Form (TSB) = CTL − ATL des Vortags. Rampe = Änderung der CTL in 7 Tagen.",
  "deutung": "Vor wichtigen Rennen ist Form im Plus üblich. Eine Rampe von mehr als etwa 5–8 Punkten pro Woche ist steil, nach Pausen eher 3–5.",
  "quelle": "Banister et al., Aust J Sports Med 1975 · Allen & Coggan 2010"
 },
 {
  "id": "acwr",
  "bereich": "Training",
  "kennzahl": "Akut-chronisch-Verhältnis",
  "formel": "Exponentielles Mittel 7 Tage geteilt durch 28 Tage (λ = 2 / (N + 1)).",
  "deutung": "0,8–1,3 gilt als günstiger Bereich, über 1,5 als riskant. Der Zusammenhang mit Verletzungen ist wissenschaftlich umstritten – nur als grobe Orientierung.",
  "quelle": "Gabbett, Br J Sports Med 2016 · Williams et al., Br J Sports Med 2017 · Impellizzeri et al., IJSPP 2020"
 },
 {
  "id": "monotonie",
  "bereich": "Training",
  "kennzahl": "Monotonie & Strain",
  "formel": "Monotonie = Ø Tagesbelastung / Standardabweichung über 7 Tage. Strain = Wochenbelastung · Monotonie.",
  "deutung": "Monotonie über 2 bei hoher Belastung ging in Studien gehäuft Infekten und Übertraining voraus – harte und leichte Tage brauchen Kontrast.",
  "quelle": "Foster, Med Sci Sports Exerc 1998"
 },
 {
  "id": "verteilung",
  "bereich": "Training",
  "kennzahl": "Intensitätsverteilung",
  "formel": "Zeit in Herzfrequenzzonen im 3-Zonen-Modell (Z1 unter VT1, Z2 zwischen VT1 und VT2, Z3 über VT2). Polarisierungs-Index PI = log10(Z1 / Z2 · Z3 · 100) mit Anteilen.",
  "deutung": "PI über 2 bei Z1 > Z3 > Z2 heißt polarisiert. Spitzenathleten trainieren rund 80 % in Z1.",
  "quelle": "Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014 · Treff et al., Front Physiol 2019"
 },
 {
  "id": "einheiten_check",
  "bereich": "Training",
  "kennzahl": "Einheiten-Check",
  "formel": "Aus den Sekundendaten jeder Rad- und Laufeinheit ab 15 min, in 5-s-Blöcken. Zonen: Rad mit Leistung in 30-s-Mitteln (unter 76 % · 76–100 % · über 100 % FTP), sonst Puls (unter VT1 · VT1–VT2 · über VT2). Normalized Power = 4. Wurzel aus dem Mittel der 30-s-Leistung hoch 4; VI = NP / Ø-Leistung; IF = NP / FTP. Decoupling = Abfall von Leistung (bzw. Tempo) pro Herzschlag von der ersten zur zweiten Hälfte, ohne die ersten 10 min – nur für gleichmäßige Einheiten (Rad VI ≤ 1,08, Lauf geringe Tempo-Streuung) ab 70 bzw. 55 min.",
  "deutung": "Qualität: mindestens 8 % der Zeit über VT2 bzw. 8 min über FTP. Renntempo: IF im Korridor ± 0,03, VI ≤ 1,06, ab 90 min. Grauzone: mindestens 35 % zwischen den Schwellen – zu hart für Grundlage, zu locker für einen Intervallreiz. Locker: mindestens 75 % unter VT1; „mit Spitzen“, wenn trotzdem 2 min über VT2, 1 min über 120 % FTP oder 2 min schneller als VT2-Tempo anfallen. Decoupling unter 5 % heißt: Die Ausdauer trägt die Dauer.",
  "quelle": "Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014 · Allen & Coggan 2010 · Friel, The Triathlete’s Training Bible 2016"
 },
 {
  "id": "laufwaechter",
  "bereich": "Training",
  "kennzahl": "Lauf-Belastungswächter",
  "formel": "Budget der Woche = Ø der 4 Wochen davor × (1 + Steigerungsgrenze aus dem Profil, Standard 10 %). Nach einer Pause (4-Wochen-Schnitt unter 8 km): halber früherer Schnitt, mindestens 10 km. Rot: Schmerz ab 3/10 an Schienbein, Knie, Achillessehne, Fuß oder Hüfte in den letzten 7 Tagen, letzte 7 Tage mehr als 30 % über dem 4-Wochen-Schnitt oder Woche mehr als 15 % über dem Budget. Gelb: leichter Schmerz, Steigerung über der Grenze, Budget erreicht, 3 Lauftage am Stück oder Schrittfrequenz mehr als 5 unter dem Ziel.",
  "deutung": "Knochen und Sehnen passen sich langsamer an als Herz und Muskeln – deshalb begrenzt der Wächter die Kilometer, auch wenn sich die Ausdauer schon bereit anfühlt. Bei vielen Läufern ist das Schienbein (MTSS) der Schwachpunkt – besonders bei großen, schweren Athleten mit hohen Stoßkräften; eine höhere Schrittfrequenz senkt die Belastung pro Schritt.",
  "quelle": "Nielsen et al., J Orthop Sports Phys Ther 2014 · Moen et al., Sports Med 2009 · Heiderscheit et al., Med Sci Sports Exerc 2011"
 },
 {
  "id": "ftp",
  "bereich": "Leistung",
  "kennzahl": "FTP-Schätzung",
  "formel": "95 % des besten 20-Minuten-Werts; bester 60-Minuten-Wert als Untergrenze; Critical Power aus 5-, 10- und 20-Minuten-Bestwerten (lineare Arbeit-Zeit-Regression).",
  "deutung": "Trainingsbestwerte sind keine Tests – die echte Schwelle kann höher liegen. Ist die Critical Power kleiner als der 60-Minuten-Wert, waren die kurzen Bestwerte keine Maximalleistungen.",
  "quelle": "Allen & Coggan 2010 · Monod & Scherrer, Ergonomics 1965 · Jones et al., Med Sci Sports Exerc 2010"
 },
 {
  "id": "effizienz",
  "bereich": "Leistung",
  "kennzahl": "Aerobe Effizienz",
  "formel": "Rad: NP / Ø-Herzfrequenz. Lauf: steigungsbereinigtes Tempo (m/min) / Ø-Herzfrequenz.",
  "deutung": "Mehr Leistung oder Tempo pro Herzschlag bei vergleichbaren Einheiten zeigt eine bessere aerobe Basis.",
  "quelle": "Allen & Coggan 2010"
 },
 {
  "id": "kadenz",
  "bereich": "Leistung",
  "kennzahl": "Schrittfrequenz",
  "formel": "Schritte pro Minute laut Garmin, Läufe ab 2 km.",
  "deutung": "5–10 % mehr Schritte pro Minute senken die Belastung an Knie und Hüfte – ein Schutzhebel für große Läufer.",
  "quelle": "Heiderscheit et al., Med Sci Sports Exerc 2011"
 },
 {
  "id": "physik",
  "bereich": "Rennen",
  "kennzahl": "Rad-Split-Modell",
  "formel": "P · η = ½ · ρ · CdA · v³ + Crr · m · g · v (flach, windstill), η = 0,976. CdA, Rollwiderstand und Radgewicht sind Schätzwerte aus deinem Profil.",
  "deutung": "Das Modell erklärte in der Validierung 97 % der gemessenen Leistung. Hügel und Wind kosten zusätzlich Zeit – der Wert ist eine Untergrenze.",
  "quelle": "Martin et al., J Appl Biomech 1998"
 },
 {
  "id": "befinden",
  "bereich": "Befinden",
  "kennzahl": "Morgen-Check-in",
  "formel": "Fünf Fragen je 1–5 (Schlafqualität, Energie, Muskeln, Stress, Stimmung; 5 = bestens), Summe 5–25. Ab 7 Einträgen Vergleich mit deinen letzten 28: z = (Summe − Mittel) / Streuung (mindestens 1,5 Punkte). Davor gilt 17 als neutral.",
  "deutung": "Subjektive Werte zeigen Über- und Unterbelastung oft früher und zuverlässiger als HRV oder Ruhepuls. Am besten jeden Morgen direkt nach dem Aufstehen ausfüllen – ehrlich und ohne nachzudenken.",
  "quelle": "McLean et al., IJSPP 2010 · Saw et al., Br J Sports Med 2016"
 },
 {
  "id": "schmerz",
  "bereich": "Befinden",
  "kennzahl": "Schmerz- und Infektregeln",
  "formel": "Schmerz ab 3/10 an Schienbein, Knie, Achillessehne, Fuß oder Hüfte → kein Laufen. Ab 5/10 egal wo → pausieren und ärztlich abklären. Ab 7/10 oder bei Krankheitsgefühl → Tagesform höchstens 33.",
  "deutung": "Bewusst streng: Beim Laufen wirken ein Mehrfaches des Körpergewichts als Stoßkraft, und Schienbeinschmerz kann der Beginn einer Knochenstress-Reaktion sein. Sehnen vertragen in der Reha leichten Schmerz (bis 5/10, wenn er bis zum Morgen abklingt) – Knochen nicht.",
  "quelle": "Moen et al., Sports Med 2009 · Silbernagel et al., Am J Sports Med 2007 · Schwellnus et al., Br J Sports Med 2016"
 },
 {
  "id": "gewicht",
  "bereich": "Körper",
  "kennzahl": "Gewicht & W/kg",
  "formel": "7-Tage-Mittel deiner Garmin-Messungen. Alle W/kg im Dashboard = Watt / Referenzgewicht der Trainingsphase (Profil).",
  "deutung": "Das Tagesgewicht schwankt durch Wasser und Glykogen um 1–2 kg. Ein festes Referenzgewicht verhindert Mischrechnungen; weicht dein Mittel um mehr als 1,5 kg ab, zeigt die App beide Werte.",
  "quelle": "Allen & Coggan 2010"
 },
 {
  "id": "ernaehrung",
  "bereich": "Körper",
  "kennzahl": "Kohlenhydrate & Eiweiß pro Tag",
  "formel": "Aus deinem Garmin-Ernährungsprotokoll. Kohlenhydrat-Spanne nach Trainingsstunden des Tages: unter 0,5 h 3–5, unter 1,5 h 5–7, unter 3,5 h 6–10, darüber 8–12 g pro kg. Eiweiß 1,2–2,0 g pro kg.",
  "deutung": "Die Spanne folgt dem Bedarf: an langen Tagen deutlich mehr, an Ruhetagen weniger. Dauerhaft zu wenig Energie bremst die Anpassung und erhöht das Verletzungsrisiko (RED-S).",
  "quelle": "Burke et al., J Sports Sci 2011 · Thomas et al., Med Sci Sports Exerc 2016 · Mountjoy et al., Br J Sports Med 2018"
 },
 {
  "id": "fueling",
  "bereich": "Körper",
  "kennzahl": "Fueling pro Stunde",
  "formel": "Kohlenhydrate während der Einheit / Dauer in Stunden. Garmin-Einträge zählen, wenn sie zwischen 15 min vor dem Start und 30 min nach dem Ende liegen; sonst dein Eintrag in der App. Ziel Rad: deine Spanne aus dem Profil (Standard 60–90 g/h), Lauf 60–90 g/h.",
  "deutung": "Über 60 g/h braucht es Glukose-Fruktose-Mischungen, über 90 g/h muss der Darm das im Training lernen – darum die Spanne im Profil schrittweise steigern. Garmins geschätzter Schweißverlust hilft, die Trinkmenge zu planen.",
  "quelle": "Jeukendrup, Sports Med 2014"
 },
 {
  "id": "css",
  "bereich": "Schwimmen",
  "kennzahl": "Critical Swim Speed (CSS)",
  "formel": "CSS = 200 m / (T400 − T200) aus zwei maximalen Tests über 400 m und 200 m mit Pause dazwischen, als Tempo pro 100 m. Intensität einer Einheit = CSS-Tempo / dein Tempo: unter 90 % locker, 90–97 % Ausdauer, 97–103 % Schwelle, darüber schnell.",
  "deutung": "Die CSS liegt nahe deiner Schwelle (maximales Laktat-Gleichgewicht). Tempi deutlich über der CSS über lange Strecken sind meist Bahnzählfehler und werden ausgeblendet.",
  "quelle": "Wakayoshi et al., Eur J Appl Physiol 1992 · Ginn 1993"
 },
 {
  "id": "schwimmtechnik",
  "bereich": "Schwimmen",
  "kennzahl": "SWOLF, Strecke pro Zug, Stroke-Index",
  "formel": "SWOLF = Sekunden + Züge pro Bahn (nur bei gleicher Beckenlänge vergleichbar). Strecke pro Zug = Tempo · 60 / Zugfrequenz. Stroke-Index = Tempo · Strecke pro Zug.",
  "deutung": "Mehr Strecke pro Zug bei gleichem Tempo ist ökonomischer – vor allem für große Athleten mit langen Armen. Ein steigender Stroke-Index zeigt bessere Technik.",
  "quelle": "Costill et al., Int J Sports Med 1985"
 },
 {
  "id": "rechner_schwimmen",
  "bereich": "Rennrechner",
  "kennzahl": "Schwimmen",
  "formel": "Zeit = Strecke · Tempo. Intensität = CSS-Tempo / Beckentempo; mit Neoprenanzug wird die Rennpace auf ein Beckentempo umgerechnet (Standard: Neo macht 3 % schneller).",
  "deutung": "Wie viel der Neo bringt, hängt von Anzug und Technik ab – den Wert kannst du anpassen. Eine Sekunde pro 100 m sind auf 3,8 km 38 Sekunden.",
  "quelle": "Chatard & Millet, Sports Med 1996 · Wakayoshi et al. 1992"
 },
 {
  "id": "rechner_rad",
  "bereich": "Rennrechner",
  "kennzahl": "Rad",
  "formel": "Je Kilometer: P · η = ½ · ρ · CdA · v³ + (Crr · m · g · cos θ + m · g · sin θ) · v. Höhenmeter als gleichmäßig welliges Profil (10-km-Wellen). IF = Watt / FTP, TSS = h · IF² · 100, Arbeit (kJ) = Watt · Sekunden / 1000 ≈ verbrauchte kcal.",
  "deutung": "Bei gleicher Leistung kosten Anstiege mehr Zeit, als Abfahrten zurückbringen – darum ist ein welliger Kurs langsamer. kJ ≈ kcal gilt, weil der Wirkungsgrad beim Radfahren rund 20–25 % beträgt. Die Vorlage „Wie <Rennen>“ rechnet ein echtes Rennen nach: Mit deiner Ø-Leistung und den Höhenmetern wird der CdA gesucht, bei dem das Modell deinen Split trifft – dieser effektive CdA enthält auch Wind, Kurven und Stopps.",
  "quelle": "Martin et al., J Appl Biomech 1998 · Allen & Coggan 2010"
 },
 {
  "id": "rechner_lauf",
  "bereich": "Rennrechner",
  "kennzahl": "Lauf",
  "formel": "Zeit = Summe der Pace je Kilometer. Abbau: ab dem gewählten Kilometer wird jeder Kilometer gleichmäßig langsamer, bis zum eingestellten Wert im Ziel. Intensität = VT1-Pace / Rennpace.",
  "deutung": "Der Langdistanz-Marathon wird knapp unter VT1-Tempo gelaufen. Wer anfangs zu schnell ist, verliert hinten ein Vielfaches – das Ziel ist, den Abbau klein zu halten.",
  "quelle": "Seiler, IJSPP 2010"
 },
 {
  "id": "rechner_fueling",
  "bereich": "Rennrechner",
  "kennzahl": "Verpflegungsplan",
  "formel": "Trinken pro Stunde = Schweißrate − erlaubter Verlust / Renndauer (Rad + Lauf), höchstens 1 l/h; erlaubt sind 2 % der Referenz-Körpermasse. Kohlenhydrate aus der Flasche = getrunkene Flaschen pro Stunde × Gramm pro Flasche; den Rest bis zum Stundenziel liefern Gels in gleichen Abständen. Lauf: Gels nach Stundenziel, Trinken an den Verpflegungsstellen (angenommen etwa alle 2 km). Schweißrate: Median der Garmin-Schätzung aus deinen langen Einheiten oder dein eigener Wert.",
  "deutung": "Ab etwa 60 g/h ist die Glukose-Aufnahme im Darm gesättigt; mehr geht nur mit Glukose-Fruktose-Mischungen über einen zweiten Transporter. Hohe Mengen muss der Darm im Training lernen. Beim Trinken ist das Ziel, nicht mehr als 2 % Körpermasse zu verlieren – und nie mehr zu trinken, als man schwitzt. Am genauesten ist ein Wiegetest: 1 h im Renntempo, vorher und nachher wiegen, Getrunkenes dazurechnen.",
  "quelle": "Jeukendrup, Sports Med 2014 · Jeukendrup, Sports Med 2017 · Sawka et al., ACSM Position Stand, Med Sci Sports Exerc 2007"
 }
];

module.exports = { METHODEN };
