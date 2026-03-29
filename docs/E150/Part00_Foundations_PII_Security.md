# Part 00 – Foundations, PII & Security Framework

> Status-Hinweis (2026-02-12): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`. Keine neuen Runs aus diesem Part ableiten.

> Mapping-Hinweis (2026-03-26): Dieses Part beschreibt den normativen Security-/PII-Rahmen. Operative Umsetzung und Priorisierung laufen ausschließlich über `docs/E150/OpenTasks.md`, insbesondere `GOV-SEC-03`, `GOV-SEC-04`, `PR-ENV-01`. Für den letzten Auditlauf siehe `docs/E150/GOV-SEC-02_Audit_2026-03-26.md`.

> Decision-Stand (2026-03-28): `GOV-SEC-03` ist manifestiert. Der votes/core Split wird komplett umgesetzt; Neo4j- und Prisma-Cross-Store-Pfade sind beide kritisch (Neo4j zuerst tiefer haerten, Prisma direkt danach); direkte Providerpfade unterliegen dem Mindestcontract aus Auditfeldern, PII-Redaction und Allowlist.

> Inventory-/Drift-Basis (2026-03-27): `GOV-SEC-03A` liefert die repo-nahe Zonenmatrix (`docs/E150/GOV-SEC-03A_ZONE_MATRIX_2026-03-27.md`), `GOV-SEC-03B` friert den High-impact-Subset als machine-readable Inventar + Drift-Checks ein (`docs/E150/GOV-SEC-03B_ZONE_INVENTORY_2026-03-27.json`, `apps/web/tests/gov-sec-03b.zone-inventory.test.ts`).

0.0 Zweck dieses Parts

Part 00 definiert den Sicherheits- und Datenschutz-Unterbau von eDebatte / eDebatte.
Alles, was später in den anderen Parts (Orchestrator, Graph, Streams, Kampagnen, Reports etc.) beschrieben wird, muss diese Regeln respektieren.

Ziele:

- klare Trennung von PII (personenbezogenen Daten) und inhaltlichen Daten
- konsistente Datenzonen (Tri-Mongo, Logs, Telemetrie)
- eindeutige Rollen & Berechtigungen
- saubere Basis für Auth, OTP, 2FA & Device-Limits
- so wenig Daten wie nötig, so viel Schutz wie möglich

Wichtig:
Die technischen Details aus docs/PII_ZONES_E150.md, core/pii/redact.ts, core/observability/logger.ts und apps/web/src/utils/logger.ts gelten als Referenz-Implementierung.
Part 00 beschreibt die Leitplanken & Pflichten, nicht den Quelltext im Detail.

0.0.1 Querverweise (kanonisch)

- Orchestrierung/Safety-Governance: `docs/E150/Part16_AI_Orchestration_and_Safety.md`
- Rollen/Trust/Surface-Kontext: `docs/E150/Part01_Overview_Roles_Access.md`
- Operative Tasks/Status/Abhängigkeiten: `docs/E150/OpenTasks.md`
- Audit-Evidenz Route/Auth/AI: `docs/E150/GOV-SEC-02_Audit_2026-03-26.md`

0.0.2 Entscheidungsstand 2026-03-26 (Sicherheitsrelevant)

- `GOV-SAFETY-03` ist entschieden: Social-/Kontakt-Eskalation nur gestuft, kein DM-/Gruppen-Default, Start nur in moderierten/kuratierten Kontexten mit Opt-in, Verifikation/Trust, Cooldown/Rate-Limits, Abuse-/Moderations-Gates und Auditierbarkeit.
- `GOV-SEC-05` ist entschieden: Nicht-interaktive Factcheck-/Finding-Zugriffe nur ueber interne Queue-/Worker-Pfade mit kontrollierter Systemidentitaet; kein Query-/Header-Rollenbypass als Maschinen-Contract.
- Operative Umsetzung bleibt in `docs/E150/OpenTasks.md` ueber `GOV-SAFETY-03A/B`, `GOV-ANLASS-08B` und `GOV-SEC-05A/B/C`.

0.0.3 Entscheidungsstand `GOV-SEC-06` (2026-03-27)

- `EDITOR_TOKEN` ist als explizit begrenzter Break-Glass-/Ops-Fallback freigegeben, nur fuer den dokumentierten Feed-/Diag-Allowlist-Subset.
- `EDITOR_TOKEN` ist **kein** allgemeiner Admin-/User-Auth-Mechanismus.
- Session-/Admin-Gates bleiben der Primaerpfad.
- Keine stillschweigende Scope-Ausweitung und kein Rollenmodell aus Query/Headern.
- Evidenzbasis: `GOV-SEC-06A` + `GOV-SEC-06B`, insbesondere `docs/E150/GOV-SEC-06B_EDITOR_TOKEN_ROUTE_MATRIX_2026-03-27.md`.
- Technische Scope-Haertung ist ueber `GOV-SEC-06C` umgesetzt (zentrale Allowlist-Assertion fuer den Token-Fallback).
- Moegliche Transport-/Env-Nacharbeit bleibt separat (`GOV-SEC-06D`), ohne neuen Auth-Standard.

0.1 Begriffe & Grundprinzipien
0.1.1 PII vs. Inhaltsdaten

PII (Personally Identifiable Information):

- alles, was eine Person direkt oder indirekt identifizierbar macht
- Beispiele:
  - Name, E-Mail, Telefonnummer
  - Adresse, PLZ + exakte Kombination mit anderen Merkmalen
  - Ausweis- / Kundennummern
  - Bankdaten, IBAN, Kreditkarte
  - IP-Adressen, Geräte-IDs (abhängig vom Kontext)
  - Kombination von Merkmalen, die eine Person eindeutig machen

Inhaltsdaten:

- politische Meinungen, Statements, Eventualitäten, Fragen
- Abstimmungen (Swipes) als abstrakte Votes
- Statistiken, Aggregationen, Reports

Regel:
PII und Inhaltsdaten dürfen nie unkontrolliert vermischt werden. Jede Speicherung oder Verarbeitung muss einer klaren Zone zugeordnet sein (siehe 0.2).

0.1.2 Datenschutz-Prinzipien

Standards:

- Datensparsamkeit: Nur speichern, was für den Zweck zwingend erforderlich ist.
- Zweckbindung: PII darf nur für klar definierte Zwecke eingesetzt werden (z.B. Auth, Identitätsprüfung, Abrechnung).
- Trennung von Schichten: PII-Storage, App-Logic, Auswertung, Telemetrie – getrennte Zonen.
- Transparenz: User sollen jederzeit nachvollziehen können:
  - welche Daten gespeichert sind
  - wofür sie genutzt werden
  - wie sie gelöscht/exportiert werden können
- Security by Design:
  - Verschlüsselung at rest und in transit
  - principled minimal access
  - kein „God-Admin“, der alles ohne Protokoll sieht

0.2 Datenzonen & Tri-Mongo-Logik

eDebatte nutzt eine Zonen-Architektur, typischerweise mit einer Tri-Mongo-artigen Aufteilung:

- Core-Zone (fachliche Kernobjekte)
- Votes-/Usage-Zone (Beteiligungs- & Nutzungsdaten ohne direkt identifizierende PII)
- PII-Zone (personenbezogene Stammdaten, Auth-Daten, Billing, sensible Informationen)

Zusätzlich:

- Logs & Telemetrie (stark redigiert, PII-masked)
- External AI / Provider-Zone (nur Pseudonyme & Inhalte, keine Klar-PII)

0.2.1 Core-Zone

Beispiele:

Statements / Claims,

Contributions,

Questions, Knots,

Consequences, Responsibility-Mapping,

Graph-Knoten & -Kanten,

Streams & Reports,

Kampagnen (ohne individuelle Namen).

Eigenschaften:

keine direkten PII-Felder (Name, E-Mail, etc.),

Verweise auf User nur über pseudonyme IDs (userId als UUID o.ä.),

kann in Reports und öffentlich sichtbaren Ansichten verwendet werden.

0.2.2 Votes-/Usage-Zone

Beispiele:

Swipes (pro/neutral/contra) auf Statements,

Eventualitäten-Eingaben in Verbindung mit Votes,

Kampagnenteilnahmen (ohne Klarnamen),

XP-Events (z.B. „Hat eine Frage übernommen“).

Eigenschaften:

enthält pseudonyme Verweise auf User (z.B. userId, orgId),

keine direkten Kontakt- oder Stammdaten,

kann für Statistiken & Reports genutzt werden,

darf nicht ohne Weiteres mit PII-Zone gekoppelt werden – nur über wohldefinierte Services.

0.2.3 PII-Zone

Beispiele:

Benutzerstammdaten:

Name, E-Mail, Telefonnummer,

Geburtsdatum (falls nötig, z.B. für Ü16/Ü18),

Adresse (nur wenn für bestimmte B2G-Fälle nötig).

Auth-Daten:

Passworthashes,

OTP-Secret (z.B. TOTP),

Recovery-Codes.

Zahlungsdaten:

pseudonymisierte Payment-IDs,

IBAN (nur, wenn absolut nötig),

Rechnungsadressen für B2B/B2G.

Eigenschaften:

stark eingeschränkte Zugriffe,

nur intern über Service-Layer verfügbar,

niemals direkt an Logs/Telemetrie/AI-Provider durchgereicht,

Lösch- und Exportfunktionen müssen hier ansetzen.

0.2.4 Logs & Telemetrie

Beispiele:

Request-Logs (Zeit, Endpoint, Response-Code),

AI-Telemetrie:

Provider, Latenz, Erfolg/Fehler,

JSON-Validität,

grobe Ergebnismetriken (Anzahl Claims, etc.).

System-Health (CPU, Memory etc.).

Regeln:

alle PII werden vor Logging durch core/pii/redact.ts gefiltert/maskiert,

keine Roh-E-Mails, keine vollständigen IPs in Standard-Logs,

Debug-Logs mit sensiblen Daten sind nur temporär und in der Produktion tabu.

0.2.5 External AI / Provider-Zone

Beispiele:

Prompt-Inhalte:

Text der Contribution,

ausgewählte Claims/Fragen,

Kontext, der keine direkten Stammdaten enthält.

Responses der KI-Provider.

Regeln:

keine Klar-PII in Prompts (z.B. Namen nur, wenn inhaltlich relevant – dann möglichst anonymisieren, z.B. „Bürgermeister“ statt „Max Mustermann“),

keine E-Mails, keine Adressen, keine Zahlungsdaten an Modelle,

Pseudonyme User-IDs nur, wenn unbedingt nötig (z.B. für Personalisierung innerhalb eigener Modelle, nicht für Drittanbieter).

0.2.6 PII – User-Grunddaten (`pii.users`)

Wir speichern persönliche Daten **immer** in der PII-Mongo-Instanz (`pii.users`) und **nie** im Core, wenn sie Rückschlüsse auf die reale Person zulassen.

Struktur (vereinfacht):

- `personal.givenName` – Vorname (Klarname)
- `personal.familyName` – Nachname (Klarname)
- `personal.yearOfBirth` – Geburtsjahr (optional)
- `personal.city` – Wohnort (optional, grob)
- `personal.profession` – Beruf / Rolle (optional)
- `personal.pronouns` – Pronomen (optional)
- `contacts.emailPrimary` – primäre E-Mail (für Login/Benachrichtigungen)
- `contacts.phone` – Telefonnummer (für SMS/2FA, optional)
- `bank` – Bank-/Zahlungsdaten (separates Sub-Dokument, siehe Payment-Profil)
- `flags` – technische Flags (z.B. ob Bankprofil verifiziert)

Wichtig:

- `personal.givenName` und `personal.familyName` sind **immer getrennt** abgelegt.
- Der im UI angezeigte Name (`displayName`) liegt im Core-User (siehe 0.2.7) und kann ein Pseudonym sein.

0.2.7 Core-Profil vs. PII-Profil

Im Core (`core.users`) halten wir nur solche Daten, die keine direkte Identifizierung im realen Leben erzwingen:

- `displayName` – sichtbarer Name in der Plattform (Pseudonym oder abgeleitet aus PII)
- `profile.headline` – Kurzbeschreibung (öffentlich, optional)
- `profile.bio` – kurze „Über mich“-Beschreibung
- `profile.avatarStyle` – Avatar-Typ (Initialen, abstrakt, Emoji-Set)
- `profile.topTopics` – bis zu 3 Themen-Schwerpunkte (siehe Themenkatalog)
- `profile.publicFlags` – Privacy-Schalter für die öffentliche Profilansicht

PII-Felder (Klarname, Stadt, Beruf, Bankdaten, Telefonnummer etc.) bleiben ausschließlich in `pii.users`. Ob bestimmte PII-Informationen im öffentlichen Profil erscheinen dürfen, steuern wir über `profile.publicFlags` im Core.

0.2.8 Privacy-Flags im Profil (`profile.publicFlags`)

- `showRealName` – wenn `true`, darf das UI aus `pii.personal.givenName` + `familyName` einen Realnamen anzeigen.
- `showCity` – wenn `true`, darf das UI den Wohnort (ggf. grob aggregiert) anzeigen.
- `showJoinDate` – „Mitglied seit …“.
- `showEngagementLevel` – Engagement-Level öffentlich anzeigen.
- `showStats` – Beteiligungszahlen (Swipes, Beiträge etc.) öffentlich anzeigen.

Standard: alle Flags `false`, bis der/die Nutzer:in aktiv zustimmt.

0.2.9 Runtime-ENV-Aliasse (Übergangsregel)

Für Mongo-Runtime-Konfiguration gilt bis zur vollständigen Migration:

- bevorzugt: `CORE_MONGODB_URI` + `CORE_DB_NAME`
- Legacy-Fallback: `MONGODB_URI` + `MONGODB_DB`

Wichtig:

- Neue oder gehärtete Runtime-Pfade sollen primär die Core-Schlüssel lesen und Legacy nur als Fallback nutzen.
- Alias-Drift (abweichende Key-Paare je Surface) ist ein operativer Hardening-Punkt in `PR-ENV-01`.
- Folge-Hardening (z. B. SRV/DNS-Failure-Modi) bleibt in `PR-ENV-02`.

0.3 PII-Kategorien & Schutzniveaus

Zur Priorisierung wird PII in Kategorien sortiert. Beispiel:

Basis-Identität

Name, Benutzername, E-Mail, Telefonnummer.

Kontakt & Adresse

Postadresse, PLZ + genaue Kombination mit anderen Merkmalen.

Finanzdaten

IBAN, Kreditkarte, Zahlungsanbieter-IDs, Rechnungsinformationen.

Sensible Merkmale

politische Ansichten als solche sind sensibel – ABER:
im System werden sie inhaltlich als Statements/Swipes erfasst und sollen nicht direkt mit Identität verknüpft werden.

Geräte- & Nutzungsdaten

IP, User-Agent, Device-Fingerprints, Cookies.

Schutzniveaus:

Level 1 – gering sensible Betriebstelemetrie
(z.B. anonyme Fehlerzahlen)

Level 2 – pseudonymisierte Nutzungsdaten
(XP, Swipes, Kampagnenbeteiligung ohne Klarnamen)

Level 3 – PII
(Name, E-Mail, Kontakt, Payment)

Level 4 – hochsensible Daten
(Kombination von PII + detaillierter politischer Historie, organisatorische Rollen, Zahlungsprobleme etc.)

Design-Regel:
Alles, was auf Level 3/4 fällt, bleibt in der PII-Zone und wird nur über wohldefinierte Services verwendet.

0.4 Rollen & Rechte (Sicherheits-Perspektive)

Dieses Rollenmodell ist die Grundlage für alle späteren Parts (Admin, Streams, Research, Kampagnen).

0.4.1 Hauptrollen

Citizen (Bürger:in)

persönliche Teilnahme,

Swipes, Beiträge, Streams schauen,

eigene Daten verwalten.

OrgAdmin (Organisation/Gemeinde)

verwaltet Kampagnen für Firma/Gemeinde,

sieht aggregierte Statistiken,

kann keine PII anderer Organisationen sehen.

Editor/Redaktion

kuratiert Inhalte,

kann Reports erstellen,

hat Zugriff auf inhaltliche Daten (Core- & Votes-Zone),

minimaler Zugriff auf PII (nur soweit nötig).

Staff (Plattform-Team)

technische Verwaltung,

Moderation,

Zugriff auf Admin-Tools, aber nicht automatisch auf alle PII.

System/Service

interne Services (z.B. Orchestrator, Graph-Importer),

haben definierte Service-Identitäten und streng begrenzte Rechte.

0.4.2 Rechte-Matrix (vereinfacht)
Aktion	Citizen	OrgAdmin	Editor	Staff	System
Eigene PII sehen/bearbeiten	✔️	✔️	❌	❌	❌
Aggregierte Statistiken (inhaltlich)	✔️	✔️	✔️	✔️	✔️
Kampagnen verwalten (eigene Org)	❌	✔️	✔️	✔️	✔️
Globale Konfiguration ändern	❌	❌	❌	✔️	✔️
PII anderer Nutzer sehen	❌	❌	❌	🔒	🔒

🔒 = nur mit zusätzlichem Recht / gesondertem Audit-Log.

0.5 Auth, OTP, 2FA & Device-Limits
0.5.1 Login-Varianten

Mindestens:

E-Mail + Passwort

Passworthashes mit starkem Algorithmus (z.B. bcrypt/argon2),

E-Mail-Magic-Link (optional, insbesondere für Low-Friktion-Login),

OTP-App (TOTP)

für 2FA, wenn User sich entscheidet,

wichtig für „Brennend“-Rollen, OrgAdmins und Staff.

Später erweiterbar um eID / Bank-ID / andere stärkere Verfahren – aber initial möglichst einfach und barrierearm.

0.5.2 2FA / OTP-App

Für besonders sensible Aktionen:

Änderung der E-Mail / Telefonnummer,

Aktivierung/Deaktivierung von Zahlungsdaten,

Zugriff auf Admin-Dashboards & Organisationen,

Start bestimmter Kampagnen (z.B. Gemeinde-Referenden).

Regel:

2FA ist für Staff und OrgAdmins ab einer gewissen Stufe verpflichtend,

für Bürger:innen ab einem gewissen Engagement-Level empfohlen (z.B. ab „Begeistert“),

Recovery-Mechanismen (Backup-Codes) werden vorgesehen, aber streng behandelt.

0.5.3 Sessions & Devices

Grundregeln:

Session-Tokens nur via Secure, HttpOnly Cookies,

Refresh-Logik mit moderaten Lifetimes (z.B. 7–30 Tage),

bei besonders sensiblen Bereichen:

kürzere Session-Timeouts,

optional Sperre auf bestimmte Geräte.

Device-Limits:

Limitierung paralleler Logins (z.B. max. 3 aktive Sessions pro Account),

Möglichkeit, alle Sessions zu invalidieren („Logout überall“),

für Staff: verpflichtender „just in time“-Access (z.B. erneute OTP-Bestätigung für bestimmte Aktionen).

0.6 Datenhaltung, Löschung & Export
0.6.1 Rechte der Nutzer:innen

Auskunft – was ist über mich gespeichert?

Löschung – Account + PII können gelöscht werden (mit definierter Wirkung auf Inhalte).

Export – eigene Inhalte (Beiträge, Swipes in aggregierter Form, etc.) können exportiert werden.

0.6.2 Löschkonzept

Bei Account-Löschung:

PII-Zone:

Stammdaten werden gelöscht oder stark anonymisiert (z.B. durch technische IDs ersetzt).

Votes-/Usage-Zone:

Swipes können als anonymisierte Summen erhalten bleiben (z.B. nur pro Region/Thema),

keine Zuordnung mehr zu konkreten User-IDs.

Core-Zone:

Inhalte (z.B. Beiträge) können:

entweder in anonymisierter Form bleiben („Beitrag einer/eines gelöschten Nutzer:in“),

oder auf Wunsch mit gelöscht werden – je nach Produktentscheidung und rechtlichen Anforderungen.

Wichtig:
Es darf nach Löschung keinen Weg mehr geben, eine Person aus Core/Votes-Daten zu rekonstruieren.

0.7 Threat-Model & Grundschutz

Part 00 skizziert nur die grobe Bedrohungslage. Die detaillierte technische Hardening-Liste kann separat geführt werden.

0.7.1 Bedrohungen

Account-Übernahmen (Credential Stuffing, Phishing),

Bot-Armeen / organisierte Manipulation,

böswillige Insider mit zu vielen Rechten,

Missbrauch von Admin-Funktionen,

Datenabflüsse (Leak von PII/Meinungsprofilen),

Missbrauch der Plattform für Hetze/Propaganda.

0.7.2 Gegenmaßnahmen (Auszug)

starke Passworthashes, 2FA, Ratelimits,

IP-/Device-basierte Anomalieerkennung,

strenges Rollen- und Berechtigungssystem,

Audit-Logs auf Admin-Aktionen,

verschlüsselte Speicherung sensibler PII (z.B. mit KMS),

regelmäßige Sicherheitsüberprüfungen (Pen-Tests).

0.8 Anforderungen an Codex & Folge-Parts

Part 00 ist verbindliches Fundament.
Alle weiteren Parts (01–13) müssen:

Datenzonen respektieren

keine PII in Core-/Graph-Modelle einschleusen,

PII-Zugriffe nur über Services, die hier beschriebenen Prinzipien folgen.

Rollenkonzept berücksichtigen

UI/Endpoints so bauen, dass nur berechtigte Rollen Zugriff haben,

Admin-Oberflächen immer mit Audit-Logging koppeln.

Security-Features nicht „wegoptimieren“

auch wenn Features später aus UX-Gründen vereinfacht werden:
Part 00 ist das Sicherheits-Mindestmaß.

Mehrländerfähigkeit vorbereiten

keine Annahmen treffen, dass alle Nutzer:innen „nur aus DE“ sind,

Datenschutz- und Sicherheitslogik EU-konform, aber erweiterbar.

0.9 Zusammenfassung Part 00

Part 00 definiert:

was PII ist,

wie Datenzonen und Tri-Mongo-Logik funktionieren,

welche Rollen und Zugriffsrechte es gibt,

wie Auth, OTP, 2FA & Sessions gedacht sind,

wie Löschung, Export und Integrität sichergestellt werden.

Damit ist der Rahmen gesetzt, um in Part 01 ff. inhaltlich maximal kreativ zu sein – ohne Datenschutz und Sicherheit zu „vergessen“ oder später mühsam nachziehen zu müssen.

Hinweis Membership/Payment (Stand E150):
- MembershipApplication (Order) lebt im Core, PaymentInfo/Bank-Data nur als Snapshot aus ENV (bank_transfer).
- user.membership-Snapshot enthält Status/Rhythmus/Household/PaymentInfo/eDebatte; PII (z. B. IBAN Vollform) bleibt im PII-Layer oder masked.
- Status-Flow: waiting_payment → active (Admin mark-paid) → cancelled/household_locked (Dunning/Kündigung). /account zeigt Status + Zahlungsinfo; keine Payment-Daten an Provider geleakt.
