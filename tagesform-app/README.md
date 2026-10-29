# Tagesform – deine Garmin-Daten als App

App für Ausdauersport und Fitness: Tagesform aus HRV, Ruhepuls, Schlaf und Befinden, ein **Gesundheitsbild** aus zwölf Werten, Trainingsbelastung je Disziplin, Fitness-Alter, **Trainingsplan** für jede Sport-Kombination, **Gym** mit antippbarem Körper, **Pilates & Yoga** mit geführtem Timer, **XP, Quests und Trophy Road** zum Dranbleiben, **Dein Tag** mit Zeitfenstern, **Heute notiert** (Trinken, Eiweiß, Koffein, eigener Stack), ein **Wissen**-Lexikon, **Material** (Kette wachsen, Laufschuh-Kilometer), **Renntag** mit Race Card und ein Rennrechner für Triathlon, Laufen, Rad und Schwimmen. Läuft kostenlos auf **Vercel** (App) mit **Upstash Redis** (Speicher) und holt die Daten über die **Garmin Connect Personal API**. Jede Person meldet sich mit E-Mail und Passwort an und verbindet ihren eigenen Garmin-Schlüssel – oder nutzt Plan, Gym, Pilates & Yoga, Rechner und Wissen erst einmal ohne Garmin.

## Was du bekommst

Fünf Bereiche – am Handy unten, am Laptop oben. Jeder Bereich öffnet eine Übersicht mit Kacheln; erst ein Tipp darauf führt eine Ebene tiefer zu Diagrammen und Details. Zurück geht es oben links – in der installierten App auch mit einem Wisch vom linken Rand.

| Bereich | Übersicht → Detailseiten |
|---|---|
| **Heute** | Tagesform-Ring mit HRV, Ruhepuls und Schlaf auf einen Blick (ohne Uhr: Tagesform nach Gefühl), Key Facts (Countdown, Fitness-Alter, **Schritte**, Form, Schlafschuld, Belastung, Laufbudget), **Dein Tag** (Fokus-, normaler oder Schon-Tag, Zeitfenster für Licht, Koffein, Essen und Bett, Kohlenhydrate nach Trainingslast, Briefing vor Schlüsseleinheiten), **Heute notiert**, **Level, XP und die drei Quests des Tages**, Wissen für heute, Wochenrückblick, „Heute im Plan“, Piktogramme zu allen Bereichen, Empfehlung und Erkenntnisse · Tipp auf den Ring → **Tagesform** im Detail |
| **Training** | **Planen & trainieren**: **Trainingsplan** (Assistent: Sportarten kombinieren – Laufen, Rad, Schwimmen, Kraft, Mobilität –, Ziel, Distanz, Rennen, Stunden pro Woche, Trainingstage, Erfahrung → jede Woche fertig geplant mit Phasen, Erholungswochen und Tapering), **Gym** (Muskeln am Körper antippen oder Vorlage wählen, Ort Studio/zuhause mit oder ohne Hanteln, Ziel, Dauer, Erfahrung, Cardio danach → Workout mit Anleitung, Tausch, Sätzen pro Muskel und „Deine Woche im Gym“), **Pilates & Yoga** (**Kurz-Routinen** für Nacken, Schreibtisch, Box-Atmung und Atem-Seufzer; Anlässe wie „Nach dem Laufen“ oder „Abends runterkommen“ oder selbst zusammenstellen → Einheit mit Phasen und geführtem Modus mit Timer, Seitenwechsel und Atemhilfe) · **Deine Sportarten** (Schwimmen, Rad, Laufen) · **Auswertung** (Fitness & Form, Belastungssprünge, Umfang & Intensität, Einheiten-Check, Fueling) · **Ziele & Rennen** (Saison, Rennrechner, **Renntag** mit Race Card und Packliste, Werkzeuge) · **Material & Körper** (Kette wachsen, Laufschuhe, **Schweißrate**) |
| **Gesundheit** | **Gesundheitsbild**: zwölf Werte in vier Bereichen (Erholung, Schlaf, Aktivität, Stress & Energie) mit Ampel, Trend gegen dein Normal und den zwei auffälligsten Punkten · Check-in am Morgen · Tagesform · HRV mit 7-Tage-Korridor · Ruhepuls & Atmung mit SpO₂ · Schlaf · **Schritte & Bewegung** (Ziel, 30 Tage, Bewegungsminuten nach WHO) · **Stress & Body Battery** · **Heute notiert** (Trinken, Eiweiß, Koffein, Stack mit Bestand, Vergleich „mit / ohne“) · **Laborwerte** · Fitness-Alter (WHOOP-ähnlich) · Körper & Energie |
| **Wissen** | Lexikon mit über 70 Begriffen (HRV, TSS, CTL, Zone 2, RIR, CSS …) in drei Tiefen je nach Wissenslevel, häufige Fragen, Suche, Themen und „So rechnet Tagesform“ mit allen Formeln und Studien. Auf vielen Karten erklärt ein (i) den Begriff direkt. |
| **Profil** | **Spielerkarte** mit Banner, Profilbild, Titel, Level und XP · **Quests** (täglich und wöchentlich) · **Trophy Road** (70 Level in sieben Stufen von Bronze bis Legende) · **Trophäen** (53 Auszeichnungen, auch rückwirkend aus deinen Daten) · **Profilbild & Banner** (eigenes Foto, Abzeichen, Banner, Rahmen, Titel) · Über dich (**Fokus der App**, Aufstehzeit, Geburtsjahr, Geschlecht, Sportarten, Wissenslevel), Athletenprofil mit Vorschlägen aus Garmin, Garmin & Daten, Morgen-Push, Darstellung, Konto & Datenschutz, Teilen |

Aktualisierung: automatisch dreimal täglich für alle Konten und zusätzlich beim Öffnen, wenn der letzte Abruf älter als zwei Stunden ist. Die App startet sofort mit dem letzten Stand und funktioniert auch ohne Netz.

---

## Eigene Kopie einrichten

So bekommt jede Person ihre eigene Tagesform – mit eigenem Garmin-Schlüssel, eigener Datenbank und eigenen Daten. Kostenlos, etwa 10 Minuten.

**Du brauchst:** ein kostenloses Konto bei [github.com](https://github.com) und bei [vercel.com](https://vercel.com) (mit GitHub anmelden) sowie einen Garmin-Connect-Account.

### 1. Garmin-Schlüssel erstellen
1. Im Browser [Personal API Key in Garmin Connect](https://connect.garmin.com/app/settings/personalApiToken) öffnen und anmelden.
2. **Create Key** wählen und Garmins Bedingungen lesen und akzeptieren.
3. Die **längste Laufzeit** wählen – danach braucht es einen neuen Schlüssel (die App sagt Bescheid).
4. Den Schlüssel **sofort kopieren** und sicher ablegen (z. B. im Passwort-Manager) – Garmin zeigt ihn nur einmal.

### 2. App auf Vercel anlegen
[![Mit Vercel veröffentlichen](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHinkyWinkyHumptyDumpty%2Fgarmin_dashboard&root-directory=tagesform-app&project-name=tagesform&repository-name=tagesform)

Auf den Knopf tippen → GitHub verbinden → **Create**. Vercel legt eine Kopie des Codes in deinem GitHub an und veröffentlicht sie. Danach die angezeigte Adresse öffnen (`https://<name>.vercel.app`).

> Ohne Knopf: Code als ZIP herunterladen, in ein eigenes GitHub-Repository hochladen, in Vercel **Add New… → Project** → importieren. Liegt die App in einem Unterordner, unter **Root Directory** `tagesform-app` eintragen.

### 3. Einrichtung abschließen
Beim ersten Öffnen zeigt die App **„Noch nicht fertig eingerichtet“** – mit Vorschlägen für die geheimen Werte, die nur in deinem Browser erzeugt werden:

1. **Storage** → **Upstash for Redis** (kostenloser Plan, Region **Frankfurt**) → mit dem Projekt verbinden. Vercel trägt `KV_REST_API_URL` und `KV_REST_API_TOKEN` selbst ein.
2. **Settings → Environment Variables** → `AUTH_SECRET` und `CRON_SECRET` mit den Vorschlägen aus der App anlegen.
3. **Deployments** → beim obersten Eintrag „…“ → **Redeploy**.

### 4. Konto anlegen und Garmin verbinden
App neu laden → **Konto erstellen** (das erste Konto ist frei) → **Notfall-Code notieren** (einziger Weg, ein vergessenes Passwort zurückzusetzen) → Garmin-Schlüssel einfügen. Der erste Import holt 12 Monate und dauert 2–3 Minuten.

### 5. Aufs iPhone und Morgen-Push
In **Safari** öffnen → **Teilen** → **Zum Home-Bildschirm**. Danach vom Home-Bildschirm starten → **Profil → Morgen-Push → Push aktivieren** (ab iOS 16.4).

---

## Wer sich anmelden darf

| Einstellung in Vercel | Wirkung |
|---|---|
| nichts weiter | Das **erste Konto** kann sich frei anmelden, danach ist die Registrierung geschlossen. Andere sehen einen Hinweis auf diese Anleitung. |
| `EINLADUNGSCODE` = ein Wort deiner Wahl | Neue Konten nur mit diesem Code (z. B. für Familie oder Trainingsgruppe). |
| `REGISTRIERUNG` = `offen` | Jeder kann ohne Freigabe ein Konto anlegen und seinen eigenen persönlichen Garmin-Schlüssel eintragen – sobald `BETREIBER_NAME` und `BETREIBER_KONTAKT` gesetzt sind (sie stehen dann in der Datenschutzerklärung). Siehe den Hinweis zu Garmins Regeln. |

Jede Registrierung braucht ein Häkchen zur **Einwilligung** in die Verarbeitung der Gesundheitsdaten (gespeichert mit Datum und Version der [Datenschutzerklärung](public/datenschutz.html)). Gegen Massenanmeldungen: höchstens 6 neue Konten pro Stunde und Anschluss, höchstens `REG_MAX_TAG` (Standard 50) pro Tag, dazu ein unsichtbares Feld als Falle für Formular-Roboter.

Änderungen an Variablen gelten erst nach einem **Redeploy**.

### Hinweis zu Garmins Regeln
Bei offener Registrierung trägt jede Person ihren **eigenen persönlichen Garmin-Schlüssel** ein. Garmin beschreibt diesen Schlüssel als Zugang zu den eigenen Daten – nicht für Apps mit vielen Nutzern; Garmin könnte solche Schlüssel deshalb sperren. Für Dienste mit vielen Nutzern sieht Garmin die Business-Stufen des [Connect Developer Program](https://developer.garmin.com/gc-developer-program/overview/) vor (Starter: mit Antrag, laut Berichten kostenlos bis etwa 1.000 Nutzer). Ganz ohne Antrag und ohne diesen Konflikt geht es, wenn **jeder seine eigene Kopie einrichtet** (Abschnitt oben). Wer fremde Konten zulässt, speichert Gesundheitsdaten anderer Personen – dafür gibt es die Datenschutzerklärung (`/datenschutz.html`) mit deinen Angaben und die Einwilligung beim Registrieren.

---

## Umgebungsvariablen

| Name | Pflicht? | Wert |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | ja | trägt Vercel beim Verbinden von Upstash selbst ein (`UPSTASH_REDIS_REST_URL`/`_TOKEN` gehen auch) |
| `AUTH_SECRET` | ja | mind. 32 zufällige Zeichen. Signiert die Anmeldung und verschlüsselt die gespeicherten Garmin-Schlüssel. **Nicht mehr ändern, sobald es Konten gibt** – sonst sind alle abgemeldet und müssen ihren Garmin-Schlüssel neu eintragen. Zu leicht zu erratende Werte (z. B. nur Ziffern) lehnt die App ab. |
| `CRON_SECRET` | empfohlen | mind. 16 zufällige Zeichen. Ohne sie gibt es keine automatischen Abrufe und keinen Morgen-Push. |
| `EINLADUNGSCODE` | nein | siehe „Wer sich anmelden darf“ |
| `REGISTRIERUNG` | nein | `offen` öffnet die Registrierung für alle (nur mit Betreiberangaben) |
| `BETREIBER_NAME` | für offene Registrierung | dein Name – erscheint in der Datenschutzerklärung als Verantwortlicher |
| `BETREIBER_KONTAKT` | für offene Registrierung | E-Mail-Adresse für Datenschutzfragen |
| `BETREIBER_ANSCHRIFT` | nein | Anschrift fürs Impressum, z. B. `Musterstraße 1, 12345 Musterstadt` (Kommas werden zu Zeilen) |
| `REG_MAX_TAG` | nein | neue Konten pro Tag, Standard 50 |

Den Garmin-Schlüssel trägt jede Person **in der App** ein (Profil → Konto), nicht in Vercel.

## Konten und Daten

- **Anmeldung**: E-Mail und Passwort (mind. 10 Zeichen). Die Anmeldung hält 180 Tage pro Gerät. Wer das Passwort ändert, ist auf allen anderen Geräten abgemeldet.
- **Passwort vergessen**: Mit dem **Notfall-Code** aus der Registrierung (E-Mails verschickt die App nicht). Einen neuen Code gibt es unter Profil → Konto.
- **Gespeichert** werden: E-Mail, das Passwort nur als Prüfwert (scrypt), der Garmin-Schlüssel verschlüsselt (AES-256-GCM), die Garmin-Daten der letzten 12 Monate und eigene Einträge – dazu, falls festgelegt, Anzeigename und Profilbild (im Browser auf 256 × 256 Pixel verkleinert, höchstens 50 KB) sowie der Spielstand. Jedes Konto sieht nur seine eigenen Daten; Ranglisten oder einen Austausch zwischen Konten gibt es nicht.
- **Konto löschen** (Profil → Konto) entfernt sofort alles, was zu diesem Konto gehört. Die Daten bei Garmin bleiben unberührt.
- **Daten herunterladen** (Profil → Konto) liefert alles Gespeicherte als JSON-Datei (Auskunft und Datenübertragbarkeit nach DSGVO).
- **Datenschutzerklärung**: öffentlich unter `/datenschutz.html` (Deutsch und Englisch), verlinkt beim Anmelden und Registrieren. Name, Kontakt und Anschrift kommen aus den `BETREIBER_*`-Variablen.
- **Aufbewahrung**: Garmin-Daten und Einheiten-Auswertungen höchstens 400 Tage, alles andere bis zum Löschen des Kontos.
- **Auf dem Gerät** liegt nur der zuletzt geladene Stand des angemeldeten Kontos; beim Abmelden wird er gelöscht.

## Gut zu wissen

- **Garmin-Schlüssel abgelaufen**: Die App meldet sich mit „Garmin nimmt den Schlüssel nicht mehr an“ – neuen Schlüssel in Garmin Connect erstellen und eintragen.
- **Profilwerte**: Neue Konten starten mit Standardwerten; nach dem ersten Import kommen Vorschläge aus den Garmin-Daten dazu (Gewicht, Pulszonen, FTP). Im Profil ist markiert, was „aus Garmin“ und was „Standard“ ist.
- **Ernährung & Fueling**: aus dem Ernährungsprotokoll von Garmin Connect (Connect+). Kohlenhydrate langer Einheiten lassen sich unter **Training → Einheiten** auch direkt eintragen.
- **Fitness-Alter**: braucht Geburtsjahr und Geschlecht (Profil → Über dich oder direkt auf der Seite). Es ist eine Schätzung aus deinen Daten, keine medizinische Diagnose.
- **Sportarten**: Unter Profil → Über dich wählst du, welche Sportarten unter Training erscheinen (Schwimmen, Rad, Laufen, Gym).
- **Rennen**: Unter Training → Saison eintragen. Das nächste A-Rennen bestimmt Countdown und Trainingsphase – auch für Trainingsplan und Gym; aus jeder Zeile öffnet „Rechner“ die passende Distanz.
- **Ohne Garmin**: Beim Verbinden „Erst mal ohne Garmin“ wählen. Dann gehen Trainingsplan, Gym, Pilates & Yoga, Check-in, Rennrechner und Wissen sofort; Seiten, die Garmin-Daten brauchen, zeigen stattdessen „Garmin verbinden“. Verbinden geht jederzeit über den Knopf oben oder Profil → Garmin & Daten.
- **Wissenslevel**: Einsteiger, Fortgeschritten oder Profi (Profil → Über dich oder Wissen). Einsteiger sehen unter vielen Karten eine kurze Erklärung, Profis die Fachbegriffe und Formeln.
- **Trainingsplan, Gym, Pilates & Yoga** werden pro Konto gespeichert (`/api/rechner`, Schlüssel `plan`, `gym`, `flow`) und sind auf allen Geräten gleich. Erledigte Workouts und Einheiten landen im Tagebuch des jeweiligen Bereichs (die letzten 30).
- **XP und Level**: Jede Minute Training bringt 1 XP – jede Sportart, die die Uhr erkennt, und jedes in der App erledigte Gym- oder Pilates/Yoga-Workout (am selben Tag wie Kraft bzw. Yoga auf der Uhr nur als Bonus). Dazu Schritte (bis 75 XP am Tag), Schlaf (7 Stunden, Schlafziel), Check-ins, Plan-Einheiten, Quests und Trophäen. Ab 2 Stunden Training am Tag zählt jede Minute halb, an roten Tagen gibt es Erholungs-Quests – seit Version 8 bringen harte Minuten an roten Tagen keine XP, wer sich schont, bekommt +20 XP „klug erholt“ (vergangene Tage behalten ihre XP). Startguthaben: die 30 Tage vor dem ersten Öffnen; Trophäen aus älteren Daten zählen mit. Die Regeln stehen unter Profil → Quests und in „So rechnet Tagesform“.
- **Spielstand** (`/api/rechner`, Schlüssel `spiel`): Start, XP-Summen abgeschlossener Monate (so bleiben XP erhalten, wenn Garmin-Daten nach 400 Tagen gelöscht werden), Trophäen-Daten, gelesene Begriffe und die Auswahl für Profilbild, Banner, Rahmen und Titel. Stände mehrerer Geräte führt der Server zusammen (früherer Start, früheste Trophäendaten, abgeschlossene Monate bleiben). Das Profilbild liegt getrennt unter dem Schlüssel `avatar` (`/api/profil` mit `bild`, `null` löscht); Anzeigename und Schrittziel stehen im Profil.
- **Schrittziel**: Standard 8.000, unter Gesundheit → Schritte & Bewegung änderbar (2.000–30.000) – oder **dynamisch**: Schnitt der letzten 4 Wochen plus 500 (5.000–12.000), an roten Tagen 20 % weniger. Es gilt auch für Quests und XP.
- **Fokus der App**: Alltag & Energie (ohne Trainingszahlen, „Bewegung“ statt „Training“), Fitness & Gym oder Performance (alles). Ohne Wahl zeigt die App alles wie bisher. Ändern unter Profil → Über dich.
- **Heute notiert, Laborwerte, Material, Schweißrate, Renntag** liegen ebenfalls unter `/api/rechner` (Schlüssel `alltag`, `labor`, `material`, `schweiss`, `renntag`), das Tagesprotokoll selbst unter `/api/checkin` mit `art: "tagebuch"` (die letzten 400 Tage). Tagesform gibt **keine Empfehlungen zu Nahrungsergänzung** und bewertet Laborwerte nicht – beides ist nur zum Mitschreiben.
- **Mitteilungen**: neben dem Morgen-Push eine Erinnerung, wenn Kette oder Schuhe fällig sind (7–22 Uhr), und am Sonntagabend der Wochenrückblick.
- **Zeitplan**: Cron-Zeiten in `vercel.json` in UTC (`0 6`, `0 8`, `0 19`); im kostenlosen Plan startet Vercel jeden Job irgendwann innerhalb dieser Stunde. Pro Lauf werden die Konten reihum aktualisiert, je vier gleichzeitig (jeder Schlüssel hat sein eigenes Garmin-Limit); ein Lauf hat 4,5 Minuten. Bei sehr vielen Konten kommt nicht jedes in jedem Lauf dran – die App holt beim Öffnen selbst nach, wenn der letzte Abruf älter als zwei Stunden ist. Konten, die die App 30 Tage nicht geöffnet haben, ruhen bis zum nächsten Öffnen (spart Abrufe und Speicher-Befehle).
- **Viele Nutzer**: Der kostenlose Upstash-Plan reicht für einige hundert aktive Konten (Speicher und Befehle pro Monat); danach den Bezahlplan nach Verbrauch wählen.
- **Offline & Updates**: Die App-Dateien liegen nach dem ersten Start auf dem Gerät. Gibt es eine neue Version, erscheint unten „Neue Version da – Neu laden“.

## Wenn etwas hakt

| Meldung | Lösung |
|---|---|
| „Noch nicht fertig eingerichtet“ | den Schritten auf dem Bildschirm folgen, dann **Redeploy** |
| „AUTH_SECRET … zu leicht zu erraten“ | in Vercel durch den Vorschlag aus der App ersetzen, Redeploy |
| „Diese Tagesform ist privat“ | Registrierung ist geschlossen – Einladungscode vom Betreiber oder eigene Kopie einrichten |
| Registrierung bleibt zu, obwohl `REGISTRIERUNG=offen` | `BETREIBER_NAME` und `BETREIBER_KONTAKT` setzen, Redeploy (Profil → „Tagesform für andere“ zeigt den Grund) |
| „Garmin lehnt diesen Schlüssel ab“ | Schlüssel vollständig kopiert? Sonst neuen in Garmin Connect erstellen |
| Daten werden morgens nicht neu | `CRON_SECRET` gesetzt? In Vercel unter **Settings → Cron Jobs** die Logs ansehen |
| „Zu viele Versuche“ | 15 Minuten (Anmelden) bzw. eine Stunde (neue Konten) warten |
| Push kommt nicht | Profil → „Test senden“; Push nur aus der installierten App (Home-Bildschirm) |

## Aufbau

```
api/        Serverfunktionen: login (Anmelden, Registrieren, Zurücksetzen), konto, data, refresh (Cron + Morgen-Push),
            checkin, profil, css, fueling, rechner, wettkampf, push
lib/        nutzer (Konten, Passwörter, Verschlüsselung), auth (Sitzung), store (Upstash REST, je Konto getrennt),
            garmin (Abruf je Konto), push (VAPID + Verschlüsselung), daten, profil, distanzen, methoden, rechnen,
            betreiber (Angaben für Datenschutz und Impressum)
public/     App: index.html, styles.css, shim.js (Anmeldung, Daten, Offline), calcs.js (alle Formeln), app.js (Darstellung),
            seiten.js (Fitness-Alter, Saison, Werkzeuge, Belastung und Korridor), hubs.js (Bereichs-Übersichten),
            plan.js (Trainingsplan), gym.js (Körperkarte, 91 Übungen, Workouts), flow.js (Pilates & Yoga, geführter Modus),
            wissen.js (Lexikon, Fragen, Wissenslevel), spiel-motor.js (Regeln für XP, Level, Quests, Trophäen – läuft auch in Node),
            spiel.js (Quests, Trophy Road, Trophäen, Profilbild & Banner, Feiern), gesund.js (Gesundheitsbild, Schritte, Stress),
            alltag-motor.js (Regeln für Zeitfenster, Ziele, Kohlenhydrate, Schweißrate, Material, Wochenbilanz – läuft auch in Node),
            alltag.js (Fokus, Dein Tag, Heute notiert, Laborwerte, Wochenrückblick), leistung.js (Material, Schweißrate, Renntag),
            sw.js (Offline-Start, Updates, Mitteilungen), datenschutz.html (öffentlich, Deutsch/Englisch)
scripts/    nur lokal: Testserver, Formeltest, Spieltest, Push-Test, Icons
```

Keine Pakete nötig (Node 22). Lokal testen:
```bash
AUTH_SECRET=lokal-0123456789-abcdefghijklmnopqrst TF_DEV_STORE=./data/dev.json node scripts/dev-server.js
```
Dann http://localhost:3000 öffnen, Konto anlegen, Garmin-Schlüssel eintragen. Tests: `node scripts/test-calcs.js <ordner-mit-json>` (alle Formeln), `node scripts/test-spiel.js <ordner-mit-json>` (Spielregeln: XP sinken nie, nichts geht verloren, Quests fest je Tag) und `node scripts/test-push.js` (Push-Verschlüsselung gegen RFC 8291), `node scripts/test-alltag.js` (Zeitfenster, Ziele, Kohlenhydrate, Schweißrate, Material) und `node scripts/test-spiel-v8.js` (Regeln aus Version 8).

## Neu in dieser Version (8)

- **Fokus der App**: Alltag & Energie, Fitness & Gym oder Performance – die App zeigt nur, was passt (im Alltag z. B. keine Trainingskacheln, „Bewegung“ statt „Training“).
- **Ohne Uhr**: Tagesform nach Gefühl aus dem Check-in, auf Wunsch mit Ruhepuls und Schlafdauer von Hand.
- **Dein Tag**: Fokus-, normaler oder Schon-Tag aus Tagesform und Schlaf, Zeitfenster für Tageslicht, Konzentration, Koffein-Stopp, letzte Mahlzeit, Licht dimmen und Bettzeit, dazu Kurz-Routinen für zwischendurch.
- **Heute notiert**: Trinken, Eiweiß und Koffein mit einem Tipp, eigener Stack zum Abhaken mit Bestandswarnung, 14-Tage-Verlauf und ein vorsichtiger Vergleich „mit / ohne“ (HRV, Tiefschlaf, Schlaf, Befinden). Neue Quests und Trophäen für Trinken, Eiweiß, Routinen und Check-in-Serien.
- **Kohlenhydrate nach Trainingslast** und ein **Briefing** am Vortag von Schlüsseleinheiten mit Flaschenrezept (Maltodextrin : Fruktose 1 : 0,8).
- **Gym für Erfahrene**: fünf Stufen bis Leistungssport, **Kraftwerte** (z. B. „Kniebeuge 100 kg × 5“) → Gewicht je Übung, nach dem Workout „zu leicht / passt / zu schwer“ und Anstrengung (RPE) – das Gewicht passt sich an. Zuhause gibt es schwerere Varianten mit langsamem Absenken.
- **Kraft und Laufen**: Hinweis im Plan, wenn nach schwerem Beintag ein harter Lauf ansteht.
- **Material**: Kilometer seit dem Kettenwachsen und je Laufschuh automatisch aus Garmin, mit Erinnerung.
- **Schweißrate-Test** je Bedingung – fließt in Trinkziel, Rennrechner und Briefing ein.
- **Renntag**: Race Card zum Ausdrucken (Splits, Pacing-Korridore, Verpflegung alle 20 Minuten) und Packliste für die Wechselzonen.
- **Zwift**: Rad-Einheiten aus dem Plan als `.zwo`-Datei.
- **Wochenrückblick** mit Vergleich zur Vorwoche und einer Sache für nächste Woche, Push am Sonntagabend.
- **Laborwerte** mitschreiben (ohne Bewertung), **Wissen für heute** und neue Lexikon-Einträge (Besser schlafen, Koffein, HRV im Alltag, Pausen bei Intervallen, Kohlenhydrate nach Bedarf, Trinken, Laufschuhe, Kraftwerte).

### Davor (Version 7)

- **XP sammeln**: Jede Bewegung zählt – alle Einheiten von der Uhr, jedes Gym- und Pilates/Yoga-Workout aus der App, Schritte, guter Schlaf, Check-ins und Plan-Einheiten. Wer gerade keinen Sport machen kann, sammelt über Schritte, Schlaf und Quests weiter.
- **Quests**: jeden Tag drei (Bewegung, Schlaf oder Erholung, ein Extra – z. B. „Heute Nacht 8 Stunden schlafen“, „8.000 Schritte“, „Geplante Einheit erledigen“), jede Woche drei größere (150 Minuten Bewegung nach WHO, 2× Kraft, 5 Nächte mit 7 Stunden …) mit Tages-, Wochen- und Serienbonus. An roten Tagen gibt es Erholungs-Quests.
- **Trophy Road**: 70 Level in sieben Stufen (Bronze, Silber, Gold, Platin, Diamant, Meister, Legende). Jedes Level schaltet etwas frei – 56 Abzeichen, 14 Banner, 7 Rahmen, 15 Titel. Level-ups und neue Trophäen werden gefeiert.
- **Trophäen**: 53 Auszeichnungen wie „Halbmarathon“, „Wandertag“ (30.000 Schritte) oder „Wie ein Uhrwerk“ – auch rückwirkend aus deinen Garmin-Daten. Jede Trophäe und jedes Abzeichen taugt als Profilbild.
- **Profilbild & Banner**: eigenes Foto hochladen (wird im Browser verkleinert), Anzeigename, Banner und Rahmen deiner Stufe, Titel.
- **Gesundheitsbild**: zwölf Werte auf einen Blick – HRV, Ruhepuls, Befinden, Schlafdauer, Schlafrhythmus, Atmung, Schritte, Bewegungsminuten, Fitness-Alter, Stress, Body Battery und SpO₂ – jeweils gegen dein eigenes Normal, mit den zwei auffälligsten Punkten und einem Tipp. Neue Seiten **Schritte & Bewegung** und **Stress & Body Battery**, SpO₂ unter Ruhepuls & Atmung, Schritte als Key Fact auf Heute.
- „Auf Standard zurücksetzen“ im Athletenprofil lässt Name, Schrittziel und „Über dich“ jetzt stehen.

### Davor (Version 6)

- **Neue Navigation fürs Handy**: Heute, Training, Gesundheit, Wissen, Profil – jeweils eine aufgeräumte Übersicht mit Kacheln und Piktogrammen, Details eine Ebene tiefer, Zurück-Knopf (in der installierten App auch per Wisch vom linken Rand). Die wichtigsten Zahlen (Tagesform, HRV, Ruhepuls, Schlaf, Fitness-Alter, Form, Countdown) stehen sofort auf Heute.
- **Trainingsplan**: Assistent in vier Schritten für jede Kombination aus Laufen, Rad, Schwimmen, Kraft und Mobilität – vom 5-km-Lauf bis zur Langdistanz oder einfach „fit bleiben“. Polarisierte Verteilung, Erholungswochen, Tapering vor dem Rennen, Einheiten mit Aufbau, Zielbereich und Begründung.
- **Gym mit Körperkarte**: Muskeln vorne und hinten antippen, Vorlagen (Leg Day, Push, Pull, Ganzkörper, für Läufer/Schwimmer/Radfahrer …), Ort (Studio, zuhause mit oder ohne Hanteln, Band), Ziel, Dauer, Erfahrung, Cardio danach (Stairmaster, Laufband, Rad, Rudern …). Das Workout passt Sätze, Pausen und Reihenfolge an, jede Übung lässt sich tauschen; „Deine Woche im Gym“ zeigt die Sätze pro Muskel als Wärmebild.
- **Pilates & Yoga**: 54 Übungen, acht Anlässe, freie Wahl von Stil, Fokus und Dauer, geführter Modus mit Timer, Seitenwechsel und Atemhilfe (Bildschirm bleibt an).
- **Wissen**: Lexikon mit Wissenslevel, häufigen Fragen und (i)-Erklärungen auf den Karten.
- **Ohne Garmin nutzbar**: für alle, die (noch) keine Garmin-Uhr verbinden möchten.

### Davor

- **Für alle öffnen**: Mit `REGISTRIERUNG=offen` legt sich jeder ohne Freigabe ein Konto an und trägt seinen eigenen Garmin-Schlüssel ein. Dazu öffentliche Datenschutzerklärung (Deutsch/Englisch) mit Betreiberangaben, Pflicht-Einwilligung beim Registrieren, Daten-Download, Schutz vor Massenanmeldungen, „Link zur App kopieren“ und ein Cron für viele Konten (vier gleichzeitig, ruhende Konten ausgelassen).

- **Rennrechner für alle Sportarten**: erst Sportart, dann Distanz – Triathlon, Laufen, Rad, Schwimmen und Mehrkampf mit denselben Kennzahlen.
- **Fitness-Alter** mit Alterungstempo, Faktoren in Lebensjahren, VO2max-Schätzung und Tipps.
- **Belastung je Disziplin**: TSS, CTL, ATL, TSB und ACWR getrennt für Schwimmen, Rad, Laufen und Kraft, dazu interne gegen externe Last.
- **HRV-Korridor**: 7-Tage-Schnitt gegen deinen Normalbereich – sympathisch, parasympathisch, Sättigung und Overreaching unterscheiden.
- **Saison**: Rennen mit A/B/C-Priorität, Countdown, Trainingsphasen und Fahrplan bis zum Renntag.
- **Werkzeuge**: W/kg, CdA- und Zeitfahr-Setups mit Pacing für eine Zielzeit, NP/IF/TSS für geplante Rennen.
- **Gym**: Workouts nach Tag, Schwerpunkt, Ausrüstung und Dauer mit Anleitungen.
- Davor: Konten für mehrere Personen, Einrichtung in der App, Profil mit Garmin-Vorschlägen, steuerbare Registrierung.
