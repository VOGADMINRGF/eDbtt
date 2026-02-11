# E150 Master Spec – Part 15: Offene Pfade & Restarbeiten

## Zweck

Dieses Dokument bündelt, welche Pfade (Part00–Part15) noch offen sind und welche Bestandteile erledigt werden müssen. Es verweist auf die Blöcke aus Part14, damit der nächste Run gezielt die Lücken schließen kann.

## Status-Übersicht der Pfade 00–15

- **Part00 Foundations / PII:** PII-Guardrails plus Klarname-Trennung (givenName/familyName) und Privacy-Flags dokumentiert; Migration/Aufsplitten alter Felder offen (siehe Identity & Profile Tasks).
- **Part01 Systemvision / Governance:** Leitplanken + 15 Themenkategorien als Backbone verankert.
- **Part02 Rollen / XP / Gamification:** XP-Anbindung benötigt noch Research-/Streams-/Campaign-Hooks (siehe Blöcke E, F, G); Profil-Freischaltungen pro Engagement-Level dokumentiert, UI-Gating offen.
- **Part03 Access Tiers & Pricing:** Grundlogik aktiv; Profil-Pakete (profileBasic/Pro/Premium) als Darstellungs-Dimension ergänzt, Mapping zu Tiers umzusetzen.
- **Part04 B2G/B2B Modelle:** Begriffe mit Profil-Paket-Namen harmonisiert; warten auf Campaigns/Streams-Implementierung (Block F/G) für echten Pilotbetrieb.
- **Part05 Orchestrator (Block A):** Gemini-Provider, rollenspezifische Prompts und Health/Score fehlen noch.
- **Part06 Consequences (Block B):** Modelle, Persistenz und UI (Responsibility Navigator) stehen aus.  
- **Part06 Themenkatalog & Zuständigkeiten:** Neu angelegt, 15 Hauptkategorien verbindlich; `TOPIC_CHOICES`-Abgleich in Profil/Onboarding/Filter offen.
- **Part07 Graph & Reports (Block C):** Graph-Schicht + Report-Adapter aktiv; AnalyzeResult-Sync schreibt Claims/Notes/Questions/Knots/Eventualities in den Graph.
- **Part08 Eventualities (Block D):** Eventuality-/DecisionTree-Typen, Analyzer-Prompts, Persistenz, UI (EventualityBoard) und API `/api/eventualities/analyze` umgesetzt.
- **Part09 Research Workflow (Block E/R2):** Tasks/Contributions vorhanden; offen sind Seeding aus Questions/Knots, Filter/Sortierung, Contributor-Feedback, Rückfluss in Statements/Graph und Anti-Spam.
- **Part10 Responsibility Navigator (Block B):** Directory/Paths und Frontend-Navigator müssen aufgebaut werden.
- **Part11 Streams (Block F):** Modelle, Routes/UI und XP-Gating fehlen; Stream-Deck aus Reports/Graph steht aus.
- **Part12 Campaigns (Block G):** Campaign/CampaignSession-Modelle, Admin-UI, QR-Flows und Reports fehlen.
- **Part13 I18N/A11y/Social (Block H):** Übersetzungs-Infra, A11y-Pass und minimale Community-Räume/Chat fehlen.
- **Part14 Implementation Roadmap:** Dient als Arbeitsmodus; Block-Reihenfolge beachten.
- **Part15 Codex Safe Mode:** Leitplanken aktiv; keine offenen Tasks, aber stets befolgen.

## Aktueller Stand (März 2025)

- `/contributions/new` rendert wieder mit SiteShell, Citizen-Core-Text und sauberem Login-Redirect statt JSON-403; Credits/Gating basieren auf `AccountOverview`.
- Login & Registrierung schreiben Name + Kontakt direkt in `pii.user_profiles` (givenName/familyName, birthDate ready), sodass Mitgliedsanträge nicht mehr ohne PII bleiben.
- `/mitglied-werden` + `/mitglied-antrag` decken die drei B2C-Produkte (Basis 0 €, Pro 14,99 €, Premium 34,99 €) ab inkl. Checkbox für den 25%-Rabatt.
- `/api/membership/apply` erstellt einen Antrag (`membership_applications`), aktualisiert `users.membership.lastApplication`, speichert Adresse/Birthdate/Telefon in PII und verschickt Bankdaten + Verwendungszweck per Mail.

## Run-Plan nach Part15 (Block-Status & Definition of Done)

| Block | Bezug | Status | Definition of Done |
| --- | --- | --- | --- |
| **A – Orchestrator (E150 Core Provider)** | Part05 | **Offen** | `@features/ai/orchestrator_gemini.ts` (Adapter + `ProviderMeta`), rollenspezifische Prompts (citizen, staff, institution), Health-/Score-Tracking in `orchestrator_health.ts`; SSE bleibt intakt. |
| **B – Consequences & Responsibility Navigator** | Part06/10 | **Offen** | Prisma-Modelle `Consequence`, `Responsibility`, `ResponsibilityLink`; API-Routes `/api/responsibility/[id]`, `/api/consequence/[id]`; React-`ResponsibilityNavigator.tsx` mit Filter/Path-Tree/Score-Coloring; Admin-View fürs Mapping. |
| **C – Graph & Reports** | Part07 | **Done** | `core/graph/syncAnalyzeResult.ts` schreibt Claims/Notes/Questions/Knots/Eventualities in Neo4j; Report-Adapter in `core/graph/queries/reports.ts` + Admin-Reports nutzen echte Graph-Daten; `/admin/graph/impact` arbeitet mit Graph-Stats. |
| **D – Eventualities / DecisionTree** | Part08 | **Done** | Typen `EventualityNode`/`DecisionTree` + Analyzer-Prompts aktiv; Persistenz via `core/eventualities/*`; UI `EventualityBoard.tsx` (AnalyzeWorkspace) + Admin-Eventualities; API `/api/eventualities/analyze`. |
| **E (R2) – Research Workflow** | Part09 | **Offen** | Seeding aus Questions/Knots; Filter-/Sortier-API `/api/research/list`; Contributor-Feedback („Hilfreich?“-Rating); Rückfluss in Statements/Graph; Anti-Spam-Heuristik (Contributor-Cooldown). |
| **F – Streams** | Part11 | **Offen** | Modelle `Stream`, `StreamSession`; UI `StreamDeck` mit XP-Gating; XP-Zuwachs für Teilnahme/Hosting. |
| **G – Campaigns** | Part12 | **Offen** | Modelle `Campaign`, `CampaignSession`; Admin-UI + Statistik-View; QR-Flow `/campaign/[id]/join`; Reports/Erfolgsmessung. |
| **H – I18N / A11y / Social** | Part13 | **Offen** | I18N-Infra (next-intl, Namespaces `common`, `admin`, `analyze`); A11y-Audit + „A11y Pass“ im Build; Basis-Chat/Community-Räume für Citizen Pro +. |

## Konkrete Next Steps

1. **Starte mit Block A** (Part05): Gemini-Provider + rollenspezifische Prompts + Health/Score.
2. **Danach Block B** (Part06/10): Consequence-/Responsibility-Modelle, Persistenz, Navigator-UI & Admin.
3. **Block C & D erledigt** (Part07/08): Graph-Sync + Eventualities-Stack stehen.
4. **Research R2 priorisieren** (Part09): Seeding, Filter, Contributor-Feedback, Rückfluss, Anti-Spam.
5. **Block F/G/H** (Part11/12/13): Streams/Campaigns/I18N-A11y-Social, sobald Basis aus A–D steht.

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

Diese Liste ist verbindlich für die nächsten Codex-Runs. Bei jedem Run den aktuell offenen Block aus Part14 wählen und die „Definition of Done“ erfüllen, bevor zum nächsten Pfad gewechselt wird. Sobald ein Block abgeschlossen ist, den Status im obigen Table auf **Done** setzen; aktuell sind alle Blöcke offen, d. h. es ist noch nichts erledigt.

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
- Block A (Orchestrator) und danach Block B (Consequences/Responsibility Navigator).
