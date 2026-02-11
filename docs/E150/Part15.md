# E150 Master Spec – Part 15: Offene Pfade & Restarbeiten

## Zweck

Dieses Dokument bündelt, welche Pfade (Part00–Part15) noch offen sind und welche Bestandteile erledigt werden müssen. Es verweist auf die Blöcke aus Part14, damit der nächste Run gezielt die Lücken schließen kann.

## Status-Übersicht der Pfade 00–15

- **Part00 Foundations / PII:** PII-Guardrails plus Klarname-Trennung (givenName/familyName) und Privacy-Flags dokumentiert; Migration/Aufsplitten alter Felder offen (siehe Identity & Profile Tasks).
- **Part01 Systemvision / Governance:** Leitplanken + 15 Themenkategorien als Backbone verankert.
- **Part02 Rollen / XP / Gamification:** XP-Anbindung benötigt noch Research-/Streams-/Campaign-Hooks (siehe Blöcke E, F, G); Profil-Freischaltungen pro Engagement-Level dokumentiert, UI-Gating offen.
- **Part03 Access Tiers & Pricing:** Grundlogik aktiv; Profil-Pakete (profileBasic/Pro/Premium) als Darstellungs-Dimension ergänzt, Mapping zu Tiers umzusetzen.
- **Part04 B2G/B2B Modelle:** Begriffe mit Profil-Paket-Namen harmonisiert; warten auf Campaigns/Streams-Implementierung (Block F/G) für echten Pilotbetrieb.
- **Part05 Orchestrator (Block A):** Rollenspezifische Prompts + Role-Fit-Scoring umgesetzt; Gemini-Provider integriert; Health-Scoring basiert auf Telemetry + In-Memory-Metriken.
- **Part06 Consequences (Block B):** Konsequenzen/Responsibility-Store + Navigator-UI + APIs umgesetzt.  
- **Part06 Themenkatalog & Zuständigkeiten:** Neu angelegt, 15 Hauptkategorien verbindlich; `TOPIC_CHOICES`-Abgleich in Profil/Onboarding/Filter offen.
- **Part07 Graph & Reports (Block C):** Graph-Sync + Admin-Reports aktiv; Public Report-Seite ist noch Placeholder (Block C bleibt teilweise offen).
- **Part08 Eventualities (Block D):** Eventuality-/DecisionTree-Typen, Analyzer-Prompts, Persistenz, UI (EventualityBoard) und API `/api/eventualities/analyze` umgesetzt.
- **Part09 Research Workflow (Block E/R2):** Seeding, Filter/Sortierung, Feedback, Graph-Rueckfluss und Cooldown umgesetzt.
- **Part10 Responsibility Navigator (Block B):** Directory/Paths + Navigator + Admin-UI aktiv.
- **Part11 Streams (Block F):** XP-Gating/XP-Awarding umgesetzt; Streams-UI (Uebersicht/Viewer/Host) + Deck-Adapter vorhanden, Live-Interaktion minimal via Agenda/Polls.
- **Part12 Campaigns (Block G):** Modelle, Admin-UI, QR-Flows, Reports umgesetzt; Seed-Run für aktuelle Statements/Rooms ausstehend (Block G bleibt teilweise offen).
- **Part13 I18N/A11y/Social (Block H):** Auto-Translate Hooks + Community-Räume umgesetzt; vollständiger A11y-Pass + zentrale I18N-Namespaces offen.
- **Part14 Implementation Roadmap:** Dient als Arbeitsmodus; Block-Reihenfolge beachten.
- **Part15 Codex Safe Mode:** Leitplanken aktiv; keine offenen Tasks, aber stets befolgen.

## Archiv: Aktueller Stand (März 2025)

- `/contributions/new` rendert wieder mit SiteShell, Citizen-Core-Text und sauberem Login-Redirect statt JSON-403; Credits/Gating basieren auf `AccountOverview`.
- Login & Registrierung schreiben Name + Kontakt direkt in `pii.user_profiles` (givenName/familyName, birthDate ready), sodass Mitgliedsanträge nicht mehr ohne PII bleiben.
- `/mitglied-werden` + `/mitglied-antrag` decken die drei B2C-Produkte (Basis 0 €, Pro 14,99 €, Premium 34,99 €) ab inkl. Checkbox für den 25%-Rabatt.
- `/api/membership/apply` erstellt einen Antrag (`membership_applications`), aktualisiert `users.membership.lastApplication`, speichert Adresse/Birthdate/Telefon in PII und verschickt Bankdaten + Verwendungszweck per Mail.

## Run-Plan nach Part15 (Block-Status & Definition of Done)

| Block | Bezug | Status | Definition of Done |
| --- | --- | --- | --- |
| **A – Orchestrator (E150 Core Provider)** | Part05 | **Done** | Rollenspezifische Prompt-Templates + Role-Fit-Scoring aktiv; Gemini-Provider integriert; Health-Scoring nutzt Telemetry + In-Memory-Metriken. |
| **B – Consequences & Responsibility Navigator** | Part06/10 | **Done** | Graph/Persistenz fuer Consequences/Responsibilities aktiv; API-Routes `/api/responsibility/[id]`, `/api/consequence/[id]`; `ResponsibilityNavigator.tsx` zeigt Pfade/Level/Hints; Admin-Directory & Path-Editor unter `/admin/responsibility`. |
| **C – Graph & Reports** | Part07 | **Partial** | `core/graph/syncAnalyzeResult.ts` schreibt Claims/Notes/Questions/Knots/Eventualities in Neo4j; Report-Adapter in `core/graph/queries/reports.ts` + Admin-Reports nutzen echte Graph-Daten; `/admin/graph/impact` arbeitet mit Graph-Stats; Public Report-Seite noch Placeholder. |
| **D – Eventualities / DecisionTree** | Part08 | **Done** | Typen `EventualityNode`/`DecisionTree` + Analyzer-Prompts aktiv; Persistenz via `core/eventualities/*`; UI `EventualityBoard.tsx` (AnalyzeWorkspace) + Admin-Eventualities; API `/api/eventualities/analyze`. |
| **E (R2) – Research Workflow** | Part09 | **Done** | Seeding aus Questions/Knots; Filter-/Sortier-API `/api/research/list`; Contributor-Feedback („Hilfreich?“-Rating); Graph-Rueckfluss; Cooldown aktiv. |
| **F – Streams** | Part11 | **Done** | XP-Gating (Host) + XP-Awarding fuer Host/Votes aktiv; Streams-Uebersicht/Viewer/Host vorhanden; Deck-Adapter + Live-Interaktion (Agenda/Polls) aktiv. |
| **G – Campaigns** | Part12 | **Partial** | Modelle `Campaign`, `CampaignSession` + Questions/Responses; Admin-UI + Statistik-View; QR-Flow `/:locale/:campaignSlug/:sessionCode`; Reports vorhanden; Seed-Run für aktuelle Statements/Rooms fehlt. |
| **H – I18N / A11y / Social** | Part13 | **Partial** | Auto-Translate Hooks + Community-Räume aktiv; A11y-Pass + zentrale I18N-Namespaces offen. |

## Konkrete Next Steps

1. **Block G operationalisieren:** Seed-Run für aktuelle Statements/Rooms ausführen.
2. **Block C nachziehen:** Public Report-Seite aus Graph-Daten anbieten.
3. **Block H abschließen:** A11y-Pass auf Kernseiten + OG-Tags konsistent erweitern.

### Identity & Profile (aus Part00–04 abgeleitet)

Offene Tasks:

1. **PII-Schema um Vor-/Nachname erweitern**  
   - `pii.users.personal.givenName` + `familyName` einführen.  
   - Alle alten Felder `name` o.ä. in Migration aufsplitten.  
   - Core-User `displayName` so anpassen, dass er nie direkt PII speichert, sondern nur ein abgeleitetes Label.

2. **Profil-Datenstruktur in Core einführen**  
   - `core.users.profile` mit: `headline`, `bio`, `avatarStyle`, `topTopics[]` (max. 3 aus 15 Hauptkategorien), `publicFlags.*` (siehe Part00).  
   - API-Routen für `/api/account/profile` (GET/PATCH).

3. **TOPIC_CHOICES an 15 Kategorien ausrichten**  
   - Zentrale Definition `TOPIC_CHOICES` in `features/interests/topics.ts`.  
   - Verwendung in Profil-Editor, Onboarding, Filter-Komponenten.

4. **Profil-Freischaltungen nach Engagement-Level umsetzen**  
   - UI-Gating im Profil-Editor: Top-Themen erst ab Level „engagiert“, Highlight-Beitrag + Styles ab „begeistert“.  
   - Gamification-Logik nutzt nur XP, niemals personenbezogene PII.

5. **Profil-Pakete und Pricing verknüpfen**  
   - Mapping Access Tier → Profil-Paket wie in Part03.  
   - B2C / B2B / B2G verwenden die gleichen Paketnamen (`profileBasic`, `profilePro`, `profilePremium`).

6. **Account-/Profil-Seiten aufräumen**  
   - `/account` als private Einstellungsseite (PII-gebunden, nicht öffentlich).  
   - `/profile` als öffentliche Visitenkarte, die nur freigegebene Felder zeigt.  
   - Hinweis im UI: „Du siehst dein Profil so, wie andere es sehen.“

Diese Liste ist verbindlich für die nächsten Codex-Runs. Bei jedem Run den aktuell offenen Block aus Part14 wählen und die „Definition of Done“ erfüllen, bevor zum nächsten Pfad gewechselt wird. Die Status-Tabelle oben ist die einzige Quelle für „Done/Partial/Offen“ und muss bei Änderungen aktualisiert werden.

Safe-Mode Checks (Membership/Payment):
- Admin-Verbuchen (`mark-paid`) und Kündigung (`cancel`) funktionieren, setzen user.membership-Status korrekt.
- Dunning-Job läuft trocken (keine Orders → no-op) und setzt bei Fälligkeit Reminder-Level / Auto-Cancel.
- /account zeigt korrekten Status inkl. PaymentInfo (masked) ohne PII-Leak; Copy-Buttons ok.

## PR-0009 (2026-02-11) - Pilot Backbone (Feeds + Factcheck Control + Minimal Graph)

Ziel
- Pilot-Backbone fuer Feeds → Kandidaten → Faktencheck → Graph/Dossier minimal herstellen und steuerbar machen.

Changes
- Pilot-Settings + Run-Receipts eingefuehrt: `core/pilot/*`.
- Pull-Feeds Logik in Shared-Modul extrahiert: `apps/web/src/lib/feeds/pullFeeds.ts` (API nutzt es).
- Admin-API fuer Pilot Settings + Run: `apps/web/src/app/api/admin/pilot/*`.
- Admin-UI fuer Pilot-Control: `apps/web/src/app/admin/pilot/page.tsx` (inkl. Form + Run-Button).
- Analyze-Pending erweitert, liefert verarbeitete Kandidaten (inkl. DraftId) zur Pipeline-Steuerung zurueck.
- Doku: `docs/E150/Pilot.md`, Part14/Part07 aktualisiert.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- PR-0010 starten: Akquise-Dashboard.

## PR-0010 (geplant) — Admin Akquise Dashboard

Ziel
- Staff-only Akquise-Dashboard fuer Regionen/Gemeinden mit Feed-Status und Top-Themen.

Changes (geplant)
- Minimaler Store fuer Feed-Status + Fetch-Runs.
- Admin-Endpoint fuer Health-Check (PilotSettings Limits).
- Admin-UI `/admin/acquisition` mit Test-Buttons.

Verification
- Nicht gelaufen (geplant: `./scripts/verify.sh`).

Next Steps
- PR-0011: Strukturierte Community-Beitraege.

## PR-0011 (geplant) — Strukturierte Beitraege (Quellen/Optionen/Ansichten)

Ziel
- Community/Journos koennen Quellen, Optionen, Fragen, Folgen, Views vorschlagen (moderierebar).

Changes (geplant)
- Minimalmodell ContributionType + Status.
- Public Create/List API + Admin Approve API.
- Minimal-UI fuer Einreichung + Admin-Review.

Verification
- Nicht gelaufen (geplant: `./scripts/verify.sh`).

Next Steps
- PR-0012: Media-Ready Projekte.

## PR-0012 (geplant) — Media Ready Projekte

Ziel
- Projekte mit 5–10 Themen, min. 5 Optionen je Thema, projektgebundene Ergebnisse.

Changes (geplant)
- Project/Topic/Option/Vote Modelle + API.
- Admin-Projektverwaltung + Public Projektseite.

Verification
- Nicht gelaufen (geplant: `./scripts/verify.sh`).

Next Steps
- PR-0013: Live/Chat Skeleton.

## PR-0013 (geplant) — Live + Chat Skeleton

Ziel
- Nur Skeleton fuer Live/Chat (Types + Stubs), keine echte Realtime-Infrastruktur.

Changes (geplant)
- Types: `LiveSession`, `ChatMessage`, `ModerationState`.
- API-Stubs (501) + staff-only UI-Placeholder unter Flag.

Verification
- Nicht gelaufen (geplant: `./scripts/verify.sh`).

Next Steps
- Zurueck zu Pilot-Haertung oder naechstem Block aus Part14.

## PR-0004 (2026-02-11) - Block D Persist/Types (Eventualities)

Ziel
- Eventuality/DecisionTree Typen und Persistenz definieren.

Changes
- Service-Layer in `core/eventualities/store.ts` um strikte Laufzeitvalidierung und Sanitizing fuer Eventualities/DecisionTrees erweitert.
- Prisma-Modelle + Enum fuer Eventualities/DecisionTrees in `prisma/core/schema.prisma` ergaenzt.
- SQL-Migration fuer Eventuality-Persistenz unter `prisma/migrations/20260211093000_pr0004_eventualities_persist_types/migration.sql` hinzugefuegt.
- Read-only API-Routen unter `apps/web/src/app/api/eventualities/` ergaenzt (List + Detail).
- Admin-Eventualities-Liste auf read-only umgestellt (`apps/web/src/app/admin/eventualities/page.tsx`).
- Root-Wrapper `verify.sh` hinzugefuegt (delegiert auf `./scripts/verify.sh`).

Verification
- `./verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Prisma-Client-Generierung fuer `@db-core` in der CI einplanen, sobald die neue Persistenz aktiv genutzt wird.

## PR-0009 (Follow-up, 2026-02-11) - Block C/D Closeout

Ziel
- Graph- und Eventualities-Stack vervollstaendigen (Notes-Sync, EventualityBoard, API).

Changes
- Graph-Sync schreibt Notes als eigene Nodes und verknuepft sie mit dem Source-Node.
- UI-Komponente `EventualityBoard.tsx` fuer Eventualitaeten/DecisionTrees eingefuehrt und in AnalyzeWorkspace verdrahtet.
- API `POST /api/eventualities/analyze` fuer Eventuality-/DecisionTree-Auszug hinzugefuegt.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block B abgeschlossen; weiter mit Research R2 oder Block F/G/H.

## PR-0009 (Follow-up, 2026-02-11) - Block A Orchestrator

Ziel
- Orchestrator mit rollenspezifischen Prompts und Role-Fit-Scoring vervollstaendigen.

Changes
- Prompt-Templates pro ProviderRole (structure/context/questions/knots/mixed) in `features/ai/orchestratorE150.ts`.
- Scoring nutzt Role-Fit + Health/Latency fuer bessere Provider-Auswahl.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block E (Research R2) oder Block F/G/H gem. Part14.

## PR-0009 (Follow-up, 2026-02-11) - Block F Stream-Deck Adapter

Ziel
- Stream-Deck aus Statements/Graph-Report bereitstellen und im Host-Cockpit nutzbar machen.

Changes
- Deck-Adapter `core/streams/deck.ts` laedt Statements passend zu Topic/Region und Report-Summary.
- API `GET /api/streams/sessions/[id]/deck` liefert Stream-Deck + Report-Snapshot.
- Host-Cockpit zeigt Deck-Items + Report-Snapshot und kann Items zur Agenda hinzufuegen.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Viewer-Interaktion und `/streams`-Routen abgeschlossen (siehe Follow-up unten).

## PR-0009 (Follow-up, 2026-02-11) - Block F Streams Viewer + Routes

Ziel
- Streams-Viewer mit Live-Interaktion bereitstellen und Routen-Alignment (`/streams`) herstellen.

Changes
- Alias-Routen `app/streams/*` auf bestehende Stream-Seiten gesetzt (Viewer/Host).
- Viewer zeigt Live-Agenda mit Poll-Abstimmung + Live-Status.
- Host bleibt unter `/dashboard/streams/:id` zugaenglich.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block G operationalisieren (Seed-Run).

## PR-0009 (Follow-up, 2026-02-11) - Block B Responsibility Navigator

Ziel
- Consequences/Responsibility-Stack vervollstaendigen (Navigator + API + Detail-Hinweise).

Changes
- `ResponsibilityNavigator.tsx` zeigt Level-Strip, Hints und Contact-Links.
- Neue read-only APIs: `/api/consequence/[id]` und `/api/responsibility/[id]` (Graph-backed).

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block E (Research R2) oder Block F/G/H gem. Part14 priorisieren.

## PR-0009 (Follow-up, 2026-02-11) - Block E Research Workflow R2

Ziel
- Research R2 abschliessen: Seeding, Filter/Sortierung, Feedback, Graph-Rueckfluss, Cooldown.

Changes
- Auto-Seeding von Research-Tasks aus Questions/Knots (Analyze).
- Neue API `/api/research/list` + Filter/Sortierung in `/api/research/tasks/list`.
- Contributor-Feedback (Hilfreich/Nicht hilfreich) inkl. UI & Rate-Limit.
- Graph-Rueckfluss fuer akzeptierte Contributions; Task-Status wird auf completed gesetzt.
- Contributor-Cooldown vor neuer Einreichung.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block F abgeschlossen; weiter mit Block G/H nach Part14.

## PR-0009 (Follow-up, 2026-02-11) - Block F Streams

Ziel
- Streams-Teilnahme/Hosting mit XP-Gating und XP-Awarding vervollstaendigen.

Changes
- XP-Awarding fuer Stream-Hosts bei Session-Erstellung.
- XP-Awarding fuer Stream-Votes (Teilnahme) mit idempotenten Event-IDs.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block G (Campaigns) oder Block H (I18N/A11y/Social) nach Part14 priorisieren.

## PR-0009 (Follow-up, 2026-02-11) - Block G Campaigns

Ziel
- Kampagnen/Session-Tracking einziehen, Admin-Verwaltung und Join-Flow bereitstellen.

Changes
- Campaign-Store korrigiert (Sessions mit ObjectId, Stats funktionieren).
- Admin-API fuer Campaign-List/Save/Stats ergaenzt.
- Admin-UI `/admin/campaigns` fuer Kampagnen-Setup + Session-Stats.
- Public Join-Flow `/campaign/[id]/join` inkl. Session-Erfassung.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Block H (I18N/A11y/Social) umsetzen.

## PR-0009 (Follow-up, 2026-02-11) - Block H I18N/A11y/Social

Ziel
- Community-Rooms Skeleton liefern (Social) und neue UI-Strings auto-translate-fähig halten.

Changes
- Community Rooms/Message Store in `core/community/*` eingefuehrt.
- Public APIs fuer Rooms/Messages (`/api/community/rooms`, `/api/community/rooms/[id]/messages`).
- Admin API fuer Rooms-Setup (`/api/community/rooms/create`).
- UI `/community/rooms` mit Auto-Translate Hooks, Accessible Labels und States.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Naechsten offenen Block in Part14 priorisieren.

## PR-0009 (Follow-up, 2026-02-11) - Block G Campaigns (QR + Report)

Ziel
- QR-Flow und Kampagnen-Report vervollstaendigen, Seed-Setup fuer aktuelle Beitraege erlauben.

Changes
- Campaign Questions/Responses eingefuehrt inkl. Store + Report-Aggregation.
- Admin-APIs fuer Questions + Report ergaenzt.
- Public APIs fuer Questions + Responses ergaenzt.
- QR-UI unter `/:locale/:campaignSlug/:sessionCode` umgesetzt.
- Seed-Script `scripts/seed-campaigns.mjs` fuer aktuelle Statements + Rooms.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Seed-Script mit Admin-Cookie ausfuehren und erste Kampagnen/Rooms testen.

## PR-0009 (Follow-up, 2026-02-11) - Block H I18N/A11y/Sharing

Ziel
- I18N-Profile-Sync, A11y-Basics und Sharing-Meta fuer Statements/Reports nachziehen.

Changes
- Locale-Switch synced `preferredLocale` via `/api/account/settings`.
- Skip-to-content Links + `main` Anker im Root-Layout und Locale-Layout.
- OG/Twitter-Metadata fuer Statements und Reports ergänzt.

Verification
- `./scripts/verify.sh` (PASS, Warnung: Node 20.x erwartet, aktuell v24.5.0)

Next Steps
- Admin-Cookie bereitstellen, damit Seed-Script laufen kann.
