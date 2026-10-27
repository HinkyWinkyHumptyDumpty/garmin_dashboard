# Tagesform – deine Garmin-Daten als App

Dashboard für Triathlon und Ausdauersport: Tagesform aus HRV, Ruhepuls, Schlaf und Befinden, Trainingsbelastung je Disziplin, Fitness-Alter, Saisonplanung mit Countdown, Gym-Workouts und ein Rennrechner für Triathlon, Laufen, Rad und Schwimmen. Läuft kostenlos auf **Vercel** (App) mit **Upstash Redis** (Speicher) und holt die Daten über die **Garmin Connect Personal API**. Jede Person meldet sich mit E-Mail und Passwort an und verbindet ihren eigenen Garmin-Schlüssel.

## Was du bekommst

Fünf Bereiche – am Handy unten, am Laptop oben. Unter jedem Bereich liegen seine Seiten.

| Bereich | Seiten und Inhalt |
|---|---|
| **Heute** | **Heute**: Tagesform-Score, Treiber (HRV, Ruhepuls, Schlaf, Befinden), Empfehlung, 14-Tage-Leiste, Kacheln für Countdown, Fitness-Alter, Belastung und Laufbudget · **Befinden**: Morgen-Check-in, Gewicht und Ernährung aus Garmin |
| **Erholung** | **Erholung**: HRV mit **7-Tage-Korridor** (sympathische Überlastung, parasympathische Sättigung, Hyperaktivität bei Overreaching), Ruhepuls, autonomer Status, Atemfrequenz · **Schlaf** · **Fitness-Alter**: WHOOP-ähnlich aus VO2max-Schätzung, Ruhepuls, Aktivität, Schlaf, Körper und HRV – mit Alterungstempo, Verlauf und den größten Hebeln |
| **Training** | Deine Sportarten als Kacheln · **Belastung**: TSS, CTL, ATL, TSB und ACWR – gesamt und je Disziplin, **interne gegen externe Last** (muskuläre gegen systemische Ermüdung), Wochenumfang, Intensitätsverteilung · **Einheiten** mit Einheiten-Check und Fueling · **Schwimmen** · **Rad** · **Laufen** mit Belastungswächter · **Gym**: Workout nach Tag, Schwerpunkt, Ausrüstung (Studio, Hanteln, ohne Geräte) und Dauer – mit Anleitung zu jeder der rund 60 Übungen |
| **Rennen** | **Saison**: Rennen mit Priorität A/B/C, Countdown, aktuelle Trainingsphase, Phasenplan rückwärts vom A-Rennen, CTL-Fahrplan, Empfehlungen · **Rechner**: erst Sportart, dann Distanz (Sprint bis Langdistanz, 5 km bis Marathon, Zeitfahren, Becken und Freiwasser, Duathlon und mehr) – Zeiten, Watt, Tempo, Intensität und Verpflegungsplan · **Werkzeuge**: W/kg-Rechner, CdA- und Zeitfahr-Setups mit Watt für eine Zielzeit, NP/IF/TSS-Planer für geplante Rennen |
| **Profil** | **Profil**: Über dich (Geburtsjahr, Geschlecht, Sportarten), Referenzwerte mit Vorschlägen aus Garmin, Morgen-Push, Konto · **Methodik**: Herleitung jeder Kennzahl mit Quellen |

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
- **Gespeichert** werden: E-Mail, das Passwort nur als Prüfwert (scrypt), der Garmin-Schlüssel verschlüsselt (AES-256-GCM), die Garmin-Daten der letzten 12 Monate und eigene Einträge. Jedes Konto sieht nur seine eigenen Daten.
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
- **Rennen**: Unter Rennen → Saison eintragen. Das nächste A-Rennen bestimmt Countdown und Trainingsphase; aus jeder Zeile öffnet „Rechner“ die passende Distanz.
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
            seiten.js (Fitness-Alter, Saison, Werkzeuge, Belastung und Korridor), gym.js (Übungen und Workouts),
            sw.js (Offline-Start, Updates, Mitteilungen), datenschutz.html (öffentlich, Deutsch/Englisch)
scripts/    nur lokal: Testserver, Formeltest, Push-Test, Icons
```

Keine Pakete nötig (Node 22). Lokal testen:
```bash
AUTH_SECRET=lokal-0123456789-abcdefghijklmnopqrst TF_DEV_STORE=./data/dev.json node scripts/dev-server.js
```
Dann http://localhost:3000 öffnen, Konto anlegen, Garmin-Schlüssel eintragen. Tests: `node scripts/test-calcs.js <ordner-mit-json>` (alle Formeln) und `node scripts/test-push.js` (Push-Verschlüsselung gegen RFC 8291).

## Neu in dieser Version

- **Für alle öffnen**: Mit `REGISTRIERUNG=offen` legt sich jeder ohne Freigabe ein Konto an und trägt seinen eigenen Garmin-Schlüssel ein. Dazu öffentliche Datenschutzerklärung (Deutsch/Englisch) mit Betreiberangaben, Pflicht-Einwilligung beim Registrieren, Daten-Download, Schutz vor Massenanmeldungen, „Link zur App kopieren“ und ein Cron für viele Konten (vier gleichzeitig, ruhende Konten ausgelassen).

### Davor
- **Übersichtlichere Navigation**: fünf Bereiche (Heute, Erholung, Training, Rennen, Profil) mit ihren Seiten; unter Training nur deine Sportarten.
- **Rennrechner für alle Sportarten**: erst Sportart, dann Distanz – Triathlon, Laufen, Rad, Schwimmen und Mehrkampf mit denselben Kennzahlen.
- **Fitness-Alter** mit Alterungstempo, Faktoren in Lebensjahren, VO2max-Schätzung und Tipps.
- **Belastung je Disziplin**: TSS, CTL, ATL, TSB und ACWR getrennt für Schwimmen, Rad, Laufen und Kraft, dazu interne gegen externe Last.
- **HRV-Korridor**: 7-Tage-Schnitt gegen deinen Normalbereich – sympathisch, parasympathisch, Sättigung und Overreaching unterscheiden.
- **Saison**: Rennen mit A/B/C-Priorität, Countdown, Trainingsphasen und Fahrplan bis zum Renntag.
- **Werkzeuge**: W/kg, CdA- und Zeitfahr-Setups mit Pacing für eine Zielzeit, NP/IF/TSS für geplante Rennen.
- **Gym**: Workouts nach Tag, Schwerpunkt, Ausrüstung und Dauer mit Anleitungen.
- Davor: Konten für mehrere Personen, Einrichtung in der App, Profil mit Garmin-Vorschlägen, steuerbare Registrierung.
