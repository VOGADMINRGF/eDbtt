# E150 Master Spec – Part 15: Offene Pfade & Restarbeiten

> Status-Hinweis (2026-03-04): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`. Keine neuen Runs aus diesem Part ableiten.


## Zweck

Dieses Dokument dient als Status-Zusammenfassung der Pfade (Part00–Part15). Es ist **kein** Run-Plan. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`, der Lieferrahmen in `docs/E150/Pflichtenheft.md`.

## Status-Übersicht der Pfade 00–15

- **Part00 Foundations / PII:** PII-Guardrails plus Klarname-Trennung (givenName/familyName) und Privacy-Flags dokumentiert; Alt-Migration optional.
- **Part01 Systemvision / Governance:** Leitplanken + 15 Themenkategorien als Backbone verankert.
- **Part02 Rollen / XP / Gamification:** XP-Anbindung fuer Research/Streams/Campaigns aktiv; Profil-Freischaltungen pro Engagement-Level im Profil-UI wirksam.
- **Part03 Access Tiers & Pricing:** Grundlogik aktiv; Profil-Pakete als Darstellungs-Dimension vorhanden und an Tiers gemappt (basic/pro/premium).
- **Part04 B2G/B2B Modelle:** Begriffe mit Profil-Paket-Namen harmonisiert; Campaigns/Streams als Betriebsbasis aktiv.
- **Part05 Orchestrator (Block A):** Gemini-Provider aktiv, rollenspezifische Prompts (citizen/staff/institution) und Health/Score-Tracking umgesetzt.
- **Part06 Consequences (Block B):** Modelle, Persistenz, API und UI fuer Responsibility/Consequences umgesetzt.  
- **Part06 Themenkatalog & Zuständigkeiten:** 15 Hauptkategorien verbindlich; `TOPIC_CHOICES`-Abgleich in Profil/Onboarding/Filter umgesetzt.
- **Part07 Graph & Reports (Block C):** Graph-Sync + Neo4j-Connector aktiv; Admin-Impact-Reports nutzen echte Graph-Daten.
- **Part08 Eventualities (Block D):** Eventuality-/DecisionTree-Typen, Persistenz, Admin-UI und Analyze-API implementiert.
- **Part09 Research Workflow (Block E/R2):** R2 umgesetzt: Seeding aus Questions/Knots, Filter/Sortierung, Contributor-Feedback, Graph-Backflow und Anti-Spam-Cooldown.
- **Part10 Responsibility Navigator (Block B):** Directory/Paths + Navigator + Admin-UI vorhanden.
- **Part11 Streams (Block F):** Stream-Modelle, Routes/UI, Agenda/Overlay und XP-Gating vorhanden.
- **Part12 Campaigns (Block G + I):** Campaign-Modelle, Admin-UI, Join/QR-Flow (MVP) plus Unterstuetzen/Crowdfunding-Flow implementiert.
- **Part13 I18N/A11y/Social (Block H):** I18N-Infra aktiv, A11y-Seiten vorhanden, Community/Chat-Skeleton ergänzt.
- **Part14 Implementation Roadmap:** Dient als Arbeitsmodus; Block-Reihenfolge beachten.
- **Part15 Codex Safe Mode:** Leitplanken aktiv; keine offenen Tasks, aber stets befolgen.

## Drift-Plan Audit (2026-03-04)

Diese Liste spiegelt alle vorhandenen Drift-Prompts aus `.codex/drifts/`.  
Status basiert auf Repo-Evidenz (Dateien/Routes/Modelle). Offener Arbeitsstand bleibt in `docs/E150/OpenTasks.md`.

| Drift | Ziel | Evidenz im Repo | Status | Naechster Schritt |
| --- | --- | --- | --- | --- |
| PR-0009 | Pilot Backbone (Feeds → Kandidaten → Faktencheck → Graph/Dossier) | `docs/E150/Pilot.md`, `/api/feeds/pull`, `/api/feeds/analyze-pending`, `features/feeds/*`, `/admin/feeds/drafts`, `/api/factcheck/enqueue`, `/admin/pilot`, `/api/admin/pilot/settings`, `/api/admin/pilot/run`, `core/pilotSettings/*` | Implemented | Monitoring/Polish |
| PR-0010 | Admin Akquise Dashboard (Feeds/Regionen) | `/admin/acquisition`, `/api/admin/acquisition`, `core/acquisition/*` | Implemented | Monitoring/Polish |
| PR-0011 | Offene Beitraege (Quelle/Option/Frage) | `/community/contributions`, `/admin/contributions`, `/api/community/contributions`, `/api/admin/community/contributions*`, `core/communityContributions/*` | Implemented | Monitoring/Polish |
| PR-0012 | Media Ready Projekte (5–10 Themen, min 5 Optionen) | Projekt-Modelle + API/Pages aktiv | Implemented | Monitoring/Polish |
| PR-0013 | Live/Chat Skeleton | `/live`, `/api/live`, `/api/chat`, `core/liveChat/*` | Implemented | Monitoring/Polish |
| PR-0030 | Unterstuetzen/Crowdfunding | `/support/[slug]`, `/admin/support` + Support-API vorhanden | Implemented | Nur Monitoring/Polish |
| PR-0010B | DecisionArchitecture v2.0 (Part16) – Publishing Pack + Drift-Validator | `docs/E150/Part16_Digitale_Entscheidungsarchitektur.md`, `/[locale]/referenzarchitektur`, `apps/web/public/docs/DecisionArchitecture_v2_0.docx`, `scripts/validate-decision-architecture.ts` | Implemented | Monitoring/Polish |

## Aktueller Stand (Februar 2026)

- `/contributions/new` rendert wieder mit SiteShell, Citizen-Core-Text und sauberem Login-Redirect statt JSON-403; Credits/Gating basieren auf `AccountOverview`.
- Admin-Graph-Seiten nutzen eine gemeinsame Schnellnavigation fuer Impact/Health/Repairs (`GraphAdminNav`).
- Graph-Health/Impact zeigen fehlende Neo4j-ENVs und verlinken auf Health-Checks.
- Phase-0 Onboarding aktiv: `docs/START_HERE.md`, `docs/ARCHITECTURE.md`, Root `.env.example` und `scripts/dev/*` fuer Start/Stop/Reset/Seed.
- CI: `e150-ci.yml` nutzt compose/prod.yml und Tri-Mongo-ENVs fuer Build/Scan.
- Login & Registrierung schreiben Name + Kontakt direkt in `pii.user_profiles` (givenName/familyName, birthDate ready), sodass Mitgliedsanträge nicht mehr ohne PII bleiben.
- `/pricing` ist die kanonische Landing fuer Pakete/Preise/Add-ons; `/mitglied-werden` ist Legacy und redirectet auf `/pricing`.
- `/mitglied-antrag` bleibt der Mitgliedschafts-Antrag (Wizard, Pflichtfelder, Bankdaten/Verwendungszweck, optional 25%-Rabatt je nach Rule).
- `/api/membership/apply` erstellt einen Antrag (`membership_applications`), aktualisiert `users.membership.lastApplication`, speichert Adresse/Birthdate/Telefon in PII und verschickt Bankdaten + Verwendungszweck per Mail.

## Run-Plan nach Part15 (Block-Status & Definition of Done)

| Block | Bezug | Status | Definition of Done |
| --- | --- | --- | --- |
| **A – Orchestrator (E150 Core Provider)** | Part05 | **Done** | Gemini-Provider aktiv, rollenspezifische Prompts (citizen, staff, institution), Health-/Score-Tracking in `orchestrator_health.ts`; SSE bleibt intakt. |
| **B – Consequences & Responsibility Navigator** | Part06/10 | **Done** | Modelle + Persistenz + API (`/api/responsibility/[id]`, `/api/consequence/[id]`); `ResponsibilityNavigator.tsx` + Admin-Views fuer Directory/Paths. |
| **C – Graph & Reports** | Part07 | **Done** | `core/graph/syncAnalyzeResult.ts` (AnalyzeResult → Graph), Neo4j-Connector, `/admin/graph/impact` mit echten Graph-Stats. |
| **D – Eventualities / DecisionTree** | Part08 | **Done** | Typen `Eventuality`/`DecisionTree`, Persistenz + Admin-UI, API `/api/eventualities/analyze`. |
| **E (R2) – Research Workflow** | Part09 | **Done** | Seeding aus Questions/Knots (Admin-Seed); Filter-/Sortier-API (`/api/research/list` + `/api/research/tasks/list`); Contributor-Feedback („Hilfreich?“); Graph-Backflow bei akzeptierten Beiträgen; Anti-Spam-Cooldown. |
| **F – Streams** | Part11 | **Done** | Stream-Modelle + Sessions/Agenda/Overlay, UI, XP-Gating & Host-Checks vorhanden. |
| **G – Campaigns** | Part12 | **Done** | Campaign-Modelle + Admin-UI, `/campaign/[id]/join` + Join-API (MVP). |
| **H – I18N / A11y / Social** | Part13 | **Done** | I18N-Infra aktiv, A11y-Seite vorhanden, Community/Chat-Skeleton ergänzt. |
| **I – Unterstuetzen/Crowdfunding** | Part12/14 | **Done** | Support pro Campaign/Projekt live: Pledge + Zahlungsreferenz + Admin mark-paid + oeffentlicher Fortschritt, ohne Einfluss auf Votes/XP/Credits. |

## Historische Abfolge (abgeschlossen)

Die folgenden Punkte dokumentieren die abgeschlossene Reihenfolge der Bloecke. Keine neuen Runs hieraus ableiten; `docs/E150/OpenTasks.md` ist kanonisch.

1. **Block A erledigt** (Part05): Gemini-Provider + rollenspezifische Prompts + Health/Score (PR-0018).
2. **Block B erledigt** (Part06/10): Consequences/Responsibility inkl. API, Navigator-UI, Admin (PR-0019).
3. **Block C/D erledigt** (Part07/08): Graph-Sync & Eventualities/DecisionTrees (PR-0020).
4. **Block F/G/H erledigt (MVP)** (Part11/12/13): Streams/Campaigns/I18N-A11y-Social (PR-0020).
5. **Block I erledigt** (Part12/14): Unterstuetzen/Crowdfunding End-to-End (PR-0030).

## Verbindliche Steuerdateien

1. `docs/E150/OpenTasks.md`
   - Single Source of Truth fuer offene Arbeitspakete, Status und Reihenfolge.
2. `docs/E150/Pflichtenheft.md`
   - Pflichtenheft mit Scope, Definition of Done und Abnahmeregeln pro Bereich.
3. `docs/E150/Part14_Implementation_Roadmap.md`
   - Technische Blockreihenfolge inklusive DoD.
4. `docs/E150/Part15_Codex_Safe_Mode.md`
   - Safe-Mode-Guardrails inklusive Profilregeln fuer Ausnahme-Runs.

## Doku-Hygiene (2026-02-12)

- Part14/Part15/Part09 wurden auf konsistente Statusaussagen abgeglichen.
- `docs/E150/OpenTasks.md` wurde als kanonisches Aufgabenboard angelegt.
- `docs/E150/Pflichtenheft.md` wurde als verbindlicher Liefer- und Abnahmerahmen ergaenzt.
- **Lokal-Guardrails**: `.envrc` bleibt minimal (nur `dotenv_if_exists` + `export`, keine Commands).  
  Login/Session-Checks erfolgen immer ueber `GET /api/auth/me` und `GET /api/admin/system/ping`.  
  Optionaler Dev-Debug-Endpoint (`/api/auth/debug`) ist erlaubt, aber nur in `development`.

## Optionaler Nachlauf (kanonisch in OpenTasks)

- Social Preview: OG-Defaults aktiv; Reports/Stream/Profil ergaenzt, weitere Detailseiten sukzessive erweitern.
- Page Contracts (CI): `missing-h1`-Allowlist abgebaut; optional nur noch bei neuen Checks relevant.
- Type Hygiene (Pages): restliche `any`-Verwendungen in Admin-Detailseiten reduzieren.
- Admin Navigation: Kontextaktionen (Massenaktionen/Drilldown) erweitern.
- Swipes Analytics: Vote-Aggregationen fuer Admin-Reports verfeinern.
- Public Profile Polish: Avatar/Cover Upload + Impact-Ansicht fuer Buerger:innen.

### Identity & Profile (aus Part00–04 abgeleitet)

Status (Zusammenfassung):

1. **PII-Schema um Vor-/Nachname erweitern**  
   - `pii.users.personal.givenName` + `familyName` aktiv.  
   - `displayName` wird nur als Ableitung genutzt; PII-Split via `ensureBasicPiiProfile` erfolgt bei Login/Register/Membership.  
   - Alt-Migration (historische `name`-Felder) optional, falls Bestandsdaten migriert werden muessen.

2. **Profil-Datenstruktur in Core einführen**  
   - `core.users.profile` mit `headline`, `bio`, `avatarStyle`, `topTopics[]`, `publicFlags.*`, `publicLocation`, `publicShareId`.  
   - API `/api/account/profile` (GET/PATCH) aktiv.

3. **TOPIC_CHOICES an 15 Kategorien ausrichten**  
   - Zentrale Definition `TOPIC_CHOICES` in `features/interests/topics.ts` ist konsistent.  
   - Verwendung in Profil-API/Streams-Topics aktiv.

4. **Profil-Freischaltungen nach Engagement-Level umsetzen**  
   - UI-Gating im Profil: Top-Themen erst ab Level „engagiert“.  
   - Gamification-Logik nutzt nur XP, niemals personenbezogene PII.

5. **Profil-Pakete und Pricing verknüpfen**  
   - Mapping Access Tier → Profil-Paket aktiv (`basic`/`pro`/`premium`).  
   - Paketnamen sind vereinheitlicht (basic/pro/premium) und werden ueberall genutzt.

6. **Account-/Profil-Seiten aufräumen**  
   - `/account` bleibt private Einstellungsseite (PII-gebunden).  
   - `/profile` leitet auf public Share-View (`/profile/[shareId]`) oder auf Account, wenn kein Share aktiv.  
   - Hinweis im UI bleibt: „Du siehst dein Profil so, wie andere es sehen.“

Diese Liste ist eine Zusammenfassung. Offener Arbeitsstand und Prioritaeten stehen ausschliesslich in `docs/E150/OpenTasks.md`.

### Block M – Membership Apply (Restpunkte)

Stand:
- Admin-Statuspflege + Verbuchen/Kuendigen aktualisieren User-Snapshot und Events.
- Household-Invites respektieren gesperrte Memberships; Pending-Invites werden im Admin-Overview angezeigt.
- Payment-CTAs im Account aktiv.

Status: Done.

### Block I – Unterstuetzen/Crowdfunding (neu)

Funktion (Skizze):
- Campaign/Projekt kann optional ein Support-Ziel haben.
- Nutzer:innen erstellen Pledges und erhalten Zahlungsreferenz.
- Admin verbucht Zahlung, Fortschritt wird aggregiert angezeigt.
- Harte Leitregel: keine Stimme, keine XP, keine Prioritaet gegen Geld.

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Campaign-Infrastruktur | SupportCampaign/SupportPledge + Indexes aktiv | Optional: weitere Target-Typen live nutzen |
| Zahlungsprinzip | Zahlungsreferenz + mark-paid/cancel aktiv | Optional: Guided Payment UX |
| Public-Produkt | `/support/[slug]` + Campaign-CTA aktiv | Optional: erweiterte Trust-/Transparenzmodule |
| Admin-Betrieb | `/admin/support` + Detail + CSV aktiv | Optional: Bulk-Verbuchung |

## PR-Log

### PR-0010B (2026-02-15) – DecisionArchitecture v2.0 Publishing Pack

Ziel:
- Referenzarchitektur veröffentlichen: Landingpage, Downloads, Drift-Validator, ohne Volltext-Doppel.

Changes:
- `apps/web/public/docs/DecisionArchitecture_v2_0.docx` hinzugefügt.
- Landingpage `/[locale]/referenzarchitektur` inkl. Content-SSOT, TOC, FAQ, Downloads.
- Validator `scripts/validate-decision-architecture.ts` + Wiring in `scripts/verify.sh`.
- Navigation-Link in Header ergänzt.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web build` (PASS)
- `./scripts/verify.sh` (PASS)

Next Steps:
- Optional: PDF/1‑Pager-Varianten ergänzen, Grafik-Slots mit realen Diagrammen füllen.

### PR-0034 (2026-02-15) – Stream Moderations-Queue (MVP)

Ziel:
- Moderations-Queue im Stream-Cockpit bereitstellen (Bausteine sammeln, taggen, freigeben).

Changes:
- `stream_moderation_queue` Collection + Indexes.
- API: `/api/streams/sessions/[id]/moderation-queue` (GET/POST/PATCH).
- Stream-Cockpit: Moderations-Queue UI mit Status, Filtern, Freigabe/Ablehnung.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web build` (PASS)
- `./scripts/verify.sh` (PASS)

Next Steps:
- Live-Dossier-Board + Follow-up-Tracker anbinden.

### PR-0035 (2026-02-15) – Live-Dossier-Board (MVP)

Ziel:
- Live-Dossier-Board im Stream-Cockpit editierbar machen und im Public-Stream anzeigen.

Changes:
- `liveBoard` State in Stream-Session-Model ergänzt.
- API: `/api/streams/sessions/[id]/live-board` (GET/PATCH).
- Cockpit-UI: Board-Editor mit Optionen, Pro/Contra, Quellen, offenen Fragen.
- Public-UI: Live-Dossier-Board auf `/stream/[slug]`.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web build` (PASS)
- `./scripts/verify.sh` (PASS)

Next Steps:
- Follow-up-Tracker + Kleingruppen/Call-ins.

### PR-0036 (2026-02-15) – Follow-up Tracker (MVP)

Ziel:
- Status-Updates nach Stream-Abstimmung erfassen und öffentlich anzeigen.

Changes:
- `followUp` State in Stream-Session-Model ergänzt.
- API: `/api/streams/sessions/[id]/follow-up` (GET/PATCH).
- Cockpit-UI: Follow-up Editor + Reminder (7/30/90 Tage).
- Public-UI: Follow-up Timeline auf `/stream/[slug]`.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web build` (PASS)
- `./scripts/verify.sh` (PASS)

Next Steps:
- Kleingruppen/Call-ins MVP.

### PR-0037 (2026-02-15) – Call-ins & Kleingruppen (MVP)

Ziel:
- Call-ins im Stream-Cockpit verwalten (Einladung, Bereitschaft, Live-Status).

Changes:
- `stream_callins` Collection + Indexes.
- API: `/api/streams/sessions/[id]/call-ins` (GET/POST/PATCH).
- Cockpit-UI: Call-in Manager inkl. Statussteuerung.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web build` (PASS)
- `./scripts/verify.sh` (PASS)

Next Steps:
- Optional: Auto-Rotation/Fairness-Logik + Stage/Voice-Integration.

### PR-0038 (2026-02-15) – SwipeCards Context + Viewer-Gating

Ziel:
- SwipeCards mit leiser Graph-Randinfo ergaenzen und Viewer-Counts rollenbasiert verbergen.

Changes:
- SwipeCard: Context-Accordion "Warum sehe ich das?" + optionale Relation-Links/Dossier-CTA.
- SwipeCard: Scope-Badge fuer Haupt-/Unterthema optional.
- Stream-UI: Zuschauerzahlen nur fuer Admin/Creator/Mods sichtbar; Public nur wenn `hideViewerCount=false`.
- StreamCard/Modal: Viewer-Counts rollenbasiert ausblendbar.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web build` (PASS)
- `./scripts/verify.sh` (PASS)

Next Steps:
- Optional: Relation-Mapping aus Graph-API, Dossier-Link aus Statements ableiten.

### PR-0039 (2026-02-15) – Optional Polish Batch

Ziel:
- Optionalen Nachlauf effizient abbauen (Social Preview, QR-UX, Support-UX, Stream-Kit QR).

Changes:
- Report/Reports: Metadata fuer Social Preview ergaenzt.
- Stream/Profil: Metadata fuer Social Preview ergaenzt.
- QR Landing: Redirects + Session-Label + Hinweise bereinigt, keine Dummy-Komponenten.
- QR Resolve: Scan-Tracking in `qr_scans` erfasst.
- Support: Guided-Payment-Hinweise nach Pledge ergänzt.
- Stream-Kit: QR-Bildrendition im Cockpit.
- Stream-Kit: Session-Vorlagen im Cockpit.
- Admin Dashboard: Schnellaktionen fuer zentrale Warteschlangen.
- Editorial Queue: Bulk-Status fuer Massenaktionen.
- Content Hub: Swipe-Analytics (Counts) im KPI-Block + Admin-Swipes-Report (30d-Timeseries).
- Public Profile: Avatar/Cover Upload via Profil-API + Anzeige im Public Profile.
- Deliberation: Fairness/Rotation-Controls im Stream-Cockpit.
- Admin Detailseiten: Error/Impact/Report-Views + Report-Assets typisiert (weniger `any`).

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web typecheck` (PASS)

Next Steps:
- Remaining optional items: Type-Hygiene-Rest in Admin-Detailseiten, Admin-Massenaktionen, Swipes Detail-Reports, weitere Social-Preview-Details (Support/QR).

### PR-0040 (2026-02-15) – Media/TV QR Studio (MVP)

Ziel:
- QR-Studios fuer TV/Events: Set-Builder + Live-Trend-Auswertung fuer QR-Fragen.

Changes:
- Admin-UI `/admin/media`: QR-Set Builder (bis 10 Fragen), Presets (Tendenz/Ja-Nein/NPS), QR-Link + Preview.
- Admin-API `/api/admin/qr/sets/summary`: Live-Auswertung mit Counts pro Frage/Option.
- QR-Set API: erweiterte Limits (bis 10 Fragen, bis 12 Optionen) + Relaxed Public-Attribution.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: CSV/Export, Datei-Upload fuer Scripts, Snapshot/Reporting.

### PR-0041 (2026-02-15) – Pricing Segmente + Pilotpakete

Ziel:
- /pricing klar nach Zielgruppen trennen: Privat (Basis/Start/Pro) und Pilotpakete (B2G/B2B).

Changes:
- Neue Pilotpakete (B2G/B2B) inkl. Vormerkung hinzugefuegt.
- /pricing in Zielgruppen-Segmente gegliedert; Add-ons auf 5–10 Themen ausgerichtet.
- /vormerken um Pilotpakete erweitert; Prelaunch/Account/Register bleiben auf Privat-Pakete fokussiert.

Verification:
- `pnpm lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Pilotpakete mit separatem Aktivierungslink/Onboarding-Flow.

### PR-0017 (2026-02-11) – Block E Research R2

Ziel:
- Research R2 finalisieren (Seeding, Filter, Feedback, Graph-Backflow, Anti-Spam).

Changes:
- Admin-Seed-Endpoint für Questions/Knots-Tasks.
- Filter-/Sortier-API für Research-Listen (inkl. Alias `/api/research/list`).
- Contributor-Feedback + Cooldown + Graph-Backflow bei Acceptance.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block F (Streams) starten, sobald Block A–D konsistent im Code/Docs sind.

### PR-0018 (2026-02-12) – Block A Orchestrator (Roles + Health)

Ziel:
- Orchestrator Block A abschliessen (Gemini-Provider, Rollen-Guidance, Health/Score).

Changes:
- Audience-Role Guidance fuer citizen/staff/institution in den Orchestrator aufgenommen.
- Health/Score-Tracking zentralisiert und Provider (inkl. Gemini) mit Metrics verdrahtet.
- Orchestrator-Callsites fuer Analyse mit explizitem Audience-Role konfiguriert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block B (Consequences & Responsibility Navigator) starten.

### PR-0019 (2026-02-12) – Block B Consequences & Responsibility

Ziel:
- Block B abschliessen (Consequences/Responsibility inkl. API und Navigator).

Changes:
- API-Endpunkte `/api/consequence/[id]` und `/api/responsibility/[id]` hinzugefuegt.
- Responsibility/Consequences aus Snapshots/Directory abrufbar gemacht.
- Block B in der Doku als erledigt markiert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block C (Graph & Reports) starten.

### PR-0020 (2026-02-12) – Blocks C–H Alignment (Graph/Eventualities/Streams/Campaigns/I18N)

Ziel:
- Block C–H auf den aktuellen Code-Stand bringen (Graph-Sync, Eventualities-API, Streams, Campaigns, Community-Skeleton).

Changes:
- Block C: Graph-Sync + Impact-Reports als done dokumentiert.
- Block D: `/api/eventualities/analyze` als Admin-Analyze-Entry hinzugefuegt.
- Block G: Campaign-MVP (Modelle, Admin-UI, Join-Flow) umgesetzt.
- Block H: Community/Chat-Skeleton ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- QA/UX-Polish fuer Campaigns & Community, danach Block-E2 (Operationalisierung/Seed-Pipelines).

### PR-0021 (2026-02-12) – Campaign Reports + QR Mapping + A11y Polish

Ziel:
- Kampagnen-Reports/Analytics, QR-Mapping und A11y-Details nachziehen.

Changes:
- Campaign-Report-API (Teilnahmen + Joins pro Tag) + Admin-Report-Panel.
- QR-Targets fuer Campaigns inkl. Resolve-Flow + Join-Redirect.
- A11y-Polish fuer neue Admin-Suchfelder.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Campaign-Reports erweitern (Charts/Segmente) und QR-Codes mit Sessions verknuepfen.

### PR-0022 (2026-02-12) – Campaign Sessions + Segment Reports

Ziel:
- Sessions + Segment-Reports fuer Campaigns fertigziehen und QR-Join sauber abbilden.

Changes:
- Campaign-Sessions API + QR-Codes pro Session.
- Campaign-Report mit Quellen- und Session-Segmenten.
- QR-Resolve erweitert fuer Campaign-Session-Links.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Charts/Visualisierung weiter verfeinern und Session-Statuspflege (live/ended) ergaenzen.

### PR-0023 (2026-02-12) – Docs Path Update (Campaigns)

Ziel:
- Dokumentationspfade fuer Campaigns/QR/Reports aktualisieren.

Changes:
- Part12 um aktuelle UI/API/QR-Pfade ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Part12 um QR-Session-Reporting und Rollen-Gating erweitern.

### PR-0024 (2026-02-12) – Part12 QR-Reporting + Roles

Ziel:
- QR-Session-Reporting und Rollen-Gating in Part12 dokumentieren.

Changes:
- Part12 um Reporting- und Gating-Abschnitt erweitert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- QR-Session-Report UI mit Filter/Export ergaenzen.

### PR-0025 (2026-02-12) – Campaign Report UI + Session Status

Ziel:
- Report-UI mit Filter/Export und Session-Statuspflege ergaenzen.

Changes:
- Admin-Campaign-Detail: Filter + CSV-Export fuer Report-Segmente.
- Sessions: Status-Updates via Admin-UI (planned/live/ended).

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Session-Statuspflege um Start/End-Zeitfelder erweitern.

### PR-0026 (2026-02-12) – Campaign Session Times + Report Charts

Ziel:
- Session-Zeiten pflegen und Report-Charts ergaenzen.

Changes:
- Session-Start/End-Zeitfelder im Admin-UI hinzugefuegt.
- Report-UI mit Balken-Chart fuer Joins pro Tag ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Report-Chart-Skalen normalisieren und CSV-Filter verfeinern.

### PR-0027 (2026-02-12) – Report Filters + Auto Session Status

Ziel:
- Report-Chart-Skalen normalisieren, CSV-Filter verfeinern und Auto-Status fuer Sessions.

Changes:
- Report-UI: Datumsfilter + normalisierte Balken-Skalen + CSV-Export berücksichtigt Filter.
- Sessions: Auto-live/auto-ended Logik basierend auf Start/Ende.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Status-Automation mit cron/batch prüfen (z.B. nightly sync).

### PR-0037 (2026-02-12) – Media Ready Projekte (5–10 Themen)

Ziel:
- Projekte mit 5–10 Themen, mindestens 5 Optionen je Thema und projektbezogenen Ergebnissen.

Changes:
- Projekt-Modelle + Collections in triMongo eingefuehrt (Projects + Votes).
- Admin-Projekte: Liste + Detailfreigabe fuer vorgeschlagene Optionen.
- Public-Projektseite: Abstimmen, Ergebnisanzeige, Option vorschlagen.
- ProjectForm erweitert: 5–10 Themen, min. 5 Optionen enforced.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0011/PR-0013 backlog weiter abbauen (Contributions/Live Skeleton).

Safe-Mode Checks (Membership/Payment):
- Admin-Verbuchen (`mark-paid`) und Kündigung (`cancel`) funktionieren, setzen user.membership-Status korrekt.
- Dunning-Job läuft trocken (keine Orders → no-op) und setzt bei Fälligkeit Reminder-Level / Auto-Cancel.
- /account zeigt korrekten Status inkl. PaymentInfo (masked) ohne PII-Leak; Copy-Buttons ok.

### PR-0010 (2026-02-11) – Admin Akquise Dashboard (Feeds-Status)

Ziel:
- Staff-only Akquise-Dashboard fuer Regionen/Gemeinden mit Feed-Status, Last-Fetch und Top-Themen.

Changes:
- Minimaler Store fuer Acquisition-Feeds + Fetch-Runs (`core/acquisition/*`).
- Admin-API `GET/POST /api/admin/acquisition` fuer Listen + Test-Fetch.
- Admin-UI `/admin/acquisition` mit Regionen-Tabelle und Fetch-Run Summary.
- Pilot-Doku (`docs/E150/Pilot.md`) und Part12-Admin-Abschnitt ergaenzt.

Verification:
- `./scripts/verify.sh` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)

Next Steps:
- PR-0011: Strukturierte Community/Journo-Beitraege (Quellen/Optionen/Fragen) + Moderation.

### PR-0011 (2026-02-11) – Strukturierte Community-Beitraege

Ziel:
- Strukturierte Beitraege fuer Quellen, Optionen, Fragen, Folgen und Ansichten mit Moderation.

Changes:
- Minimalmodell `core/communityContributions/*` (Type + Status + Referenz).
- Public API `GET/POST /api/community/contributions`.
- Admin API `GET /api/admin/community/contributions` + `POST /api/admin/community/contributions/approve`.
- Public UI `/community/contributions` + Admin Review `/admin/contributions`.
- Doku: `docs/E150/Pilot.md`, Part09 ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)
- `pnpm -C apps/web run typecheck` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)

Next Steps:
- PR-0012: Media Ready Projekte.

### PR-0028 (2026-02-12) – Identity/Profile + Membership Admin CTA

Ziel:
- Identity/Profile-Aufgaben finalisieren, XP-Hooks fuer Streams/Campaigns setzen, Membership-Admin/CTA ergaenzen.

Changes:
- XP: Streams-Session-Votes und Campaign-Joins vergeben XP idempotent.
- /profile leitet auf public share view oder zurueck auf /account.
- Public-Profile Top-Themen an Engagement-Level „engagiert“ gekoppelt.
- Admin: Membership-Statusliste in /admin/memberships + API-Gate fuer Memberships.
- Membership-Status-Updates spiegeln sich in User-Snapshot + Telemetry-Events.
- Household-Invites blockieren bei gesperrten Memberships.
- Account: Payment-CTA bei waiting_payment.
- Part14 R2-Status konsolidiert, Identity/Profile-Status angepasst.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block M: Household-Lock/Monitoring/Events und Payment-CTA/Flows ausbauen.

### PR-0029 (2026-02-12) – Block M Complete (Household Lock + Monitoring)

Ziel:
- Household-Lock/Monitoring/Events finalisieren und Payment-CTA-Flow abrunden.

Changes:
- Membership-Apply blockt household_locked Accounts.
- Admin-Statuswechsel spiegelt auf User-Snapshot und revoked Pending-Invites.
- Membership-Overview zeigt Pending-Invites und erweitert Monitoring.
- Household-Invites werden bei Lock/Cancel revokiert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Payment-UX weiter polieren (Modal/Guided Flow).

### PR-0030 (2026-02-12) – Block I Unterstuetzen/Crowdfunding

Ziel:
- Eigene Unterstuetzen-Logik fuer Kampagnen/Projekte live schalten.

Changes:
- `SupportCampaign`/`SupportPledge` eingefuehrt (inkl. Indexes, Zahlungsreferenz `CF-xxxxxx`).
- Public APIs: `POST /api/support/campaigns`, `GET /api/support/campaigns/[slug]`, `POST /api/support/campaigns/[slug]/pledges`.
- Public UI: `/support/[slug]` mit Progress, Pledge-Form und Zahlungsanweisung.
- Admin APIs: `GET /api/admin/support/campaigns`, `GET /api/admin/support/campaigns/[id]`, `PATCH /api/admin/support/pledges/[id]` plus CSV-Export.
- Admin UI: `/admin/support` und `/admin/support/[id]` fuer Verbuchung/Monitoring.
- Campaign-Integration: CTA `Unterstuetzen` auf `/campaign/[id]`, wenn Support aktiv.
- Sichtbare Leitregel in UI: Unterstuetzung beeinflusst keine Votes/XP/Credits.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0031: Stream-Kit Overlay/QR/Agenda + "Streamer werden" produktisieren.

### PR-0031 (2026-02-12) – Block F Stream-Kit Produktisierung

Ziel:
- Stream-Kit fuer produktiven Host-Betrieb vervollstaendigen (Overlay-/Viewer-Links, dynamisches QR-Ziel, Streamer-Onboarding).

Changes:
- Stream-Agenda erweitert um `qrTarget` pro Item; Host kann Zielpfad pro Tagespunkt speichern.
- Host-Cockpit (`/dashboard/streams/[id]`) zeigt Stream-Kit-Panel mit Overlay-URL, Viewer-URL und aktivem QR-Ziel inkl. Copy-Aktionen.
- 1-Klick "Aktiv setzen" im Agenda-Flow geschaerft; Overlay synchronisiert das aktive `qrTarget`.
- Overlay-Feed und Overlay-Client zeigen aktives QR-Ziel fuer OBS/Regie transparent an.
- Streamer-Onboarding als Produktseite unter `/howtoworks/streamer` plus Alias `/streamer/werden` hinzugefuegt.
- Streams-Dashboard verlinkt auf Streamer-Guide und zeigt Overlay-/Viewer-Quicklinks pro Session.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0032: Block G Campaign-UX/Reporting-Polish (CTA-Kontext, Report-Filter, Admin-Cross-Linking).

### PR-0032 (2026-02-12) – Block G Campaign-UX/Reporting-Polish

Ziel:
- Campaign-CTA kontextsensitiv machen, Report-UX vereinheitlichen und Admin-Support-Cross-Linking schliessen.

Changes:
- Public Campaign-CTA nutzt Status-konforme Labels; Support-Hinweis bleibt sichtbar ohne Stimmrechtswirkung.
- QR-Landing fuer Campaigns zeigt klare Teilnahme-CTA und konsistente Hinweise.
- Admin-Campaign: Report-Filter-Reset, Vergleichsansicht (Top Quellen/Sessions) und Export-Hinweis ergaenzt.
- Admin-Campaign/Support verlinken sich wechselseitig (Prefill + Direktlink).

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0033: Block H I18N/A11y/Social Produktreife.

### PR-0033 (2026-02-12) – Block H I18N/A11y/Social Produktreife

Ziel:
- Skeleton-Pfade von Community/Chat in produktive Mindestpfade bringen, inkl. I18N-Fallbacks, A11y-Verbesserungen und konsistenten OG-Metadaten.

Changes:
- Community- und Chat-Seiten mit serverseitigem Locale-Fallback und zweisprachiger Copy erweitert.
- OG-Metadaten fuer `/community` und `/chat` ergänzt, inkl. konsistenten Descriptions.
- Community-UX mit Leitplanken, Links zu Verhaltenskodex und Barrierefreiheit klarer gemacht.
- Chat-UX mit Status- und Next-Step-Abschnitt, strukturierter Liste und A11y-orientierter Copy geschärft.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Docs-only: Doku- und Strukturhygiene (Part09 Appendix, Part11/12 Fliesstext).

### PR-0034 (2026-02-12) – Docs Hygiene + OG Meta Polish

Ziel:
- Doku-Hygiene abschliessen (Part09 Appendix, Part11/12 Text harmonisieren) und OG-Metadaten auf Campaign-Seiten nachziehen.

Changes:
- Part09 um Betriebsmetriken-Appendix ergaenzt.
- Part11/Part12 mit konsistenteren Kurzpfaden/QR-Checklisten harmonisiert.
- Campaign-Seiten mit OG-Metadaten erweitert (`/campaign` und `/campaign/[id]`).
- OpenTasks: keine Pflicht-Tasks mehr offen, optionales Polish bleibt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: weitere OG-Metadaten fuer Detailseiten (Dossiers/Reports) ergaenzen.

### PR-0035 (2026-02-12) – Swipes End-to-End Persistence

Ziel:
- Swipes ohne Mock-Daten betreiben, Votes dauerhaft speichern, Eventualitaeten aus dem Graph ziehen.

Changes:
- Swipe-Feed nutzt ausschliesslich `statement_proposals`; Mock-Deck entfernt.
- Eventualitaeten werden aus `eventuality_nodes` nach `statementId` geladen.
- Swipe-Votes werden in `swipe_votes` persistiert (Upsert pro User/Statement/Eventualitaet).
- OpenTasks: optionaler Swipes-Backlog auf Analytics reduziert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Vote-Aggregationen/Analytics fuer Admin-Reports vorbereiten.

### PR-0037 (2026-02-18) – Stream Identity Check & Pre-Stream Tutorial

Ziel:
- Identity-Check fuer Streams (Ausweis/Pass-Upload mit Vorder/Rueckseite).
- Pre-Stream E-Mail-Code-Bestaetigung plus 3-Minuten-Tutorial im Cockpit.

Changes:
- PII: `user_identity_documents` plus API `GET/POST/DELETE /api/account/identity-document`.
- Account: Identity-Check-Card mit Upload & kleiner Vorschau (nur intern sichtbar).
- Stream-Cockpit: Pre-Stream-Panel fuer ID-Status, E-Mail-Code, Tutorial-Countdown.

Verification:
- Not run (nicht angefragt).

Next Steps:
- Optional: Stream-Start hart blocken, bis Identity-Check abgeschlossen ist.

### PR-0038 (2026-02-18) – Identity UX Polish

Ziel:
- Identity-Check mit klarerem Status, Privacy-Hinweis und besserer Upload-UX.
- Pre-Stream Panel als Checkliste mit Ready-Status und Tutorial-Steuerung.

Changes:
- Account: neue Identity-Check-Card mit Typ-Auswahl (Cards), Status-Badge, Vorschau-Markierung und Datei-Feedback.
- Stream-Cockpit: Checkliste mit Ready-Status, optimierte E-Mail-Code-Steuerung, Tutorial-Status.
- API: groessere Image-Data-URL-Limits fuer Uploads.

Verification:
- Not run (nicht angefragt).

Next Steps:
- Optional: Uploads auf verschluesseltes Storage auslagern (PII-Hardening).

### PR-0039 (2026-02-18) – Stream Live Guard

Ziel:
- Stream-Start serverseitig blocken, bis Ausweis/Pass hinterlegt und E-Mail-Code bestaetigt ist.

Changes:
- Guard in `/api/streams/sessions/[id]/agenda` fuer `go_live`.
- Neue Identity-Check-Helper in `core/streams/access.ts` und API-Utils.
- Cockpit: `go_live` wird bei fehlender Identity blockiert und Fehlermeldung geklärt.

Verification:
- Not run (nicht angefragt).

### PR-0036 (2026-02-12) – Page Contracts Cleanup

Ziel:
- `missing-h1`-Allowlist auf 0 bringen und Seiten semantisch sauber machen.

Changes:
- Alle zuvor allowlisteten Pages haben jetzt ein `<h1>` (sichtbar oder sr-only).
- Redirect-/Legacy-Seiten liefern semantischen Fallback-Content.
- `missing-h1`-Allowlist geleert; Page-Contracts sind nun strikt.

Verification:
- `node scripts/check-page-contracts.mjs` (PASS)
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Type Hygiene in `page.tsx` weiter reduzieren (umfangreicher Nachlauf).

### PR-0013 (2026-02-11) – Live/Chat Skeleton (Docs + Stubs)

Ziel:
- Live/Chat Skeleton mit Types, API-Stubs und UI-Placeholders.
- Sichtbar nur hinter Flag und staff-only.

Changes:
- Types: `core/liveChat/*` (ChatMessage, LiveSession, ModerationState).
- API-Stubs: `GET/POST /api/live`, `GET/POST /api/chat` (501 Not Implemented).
- UI-Stubs: `/live`, `/chat` (flag-guarded, staff-only).
- Doku: `docs/E150/Pilot.md` Phase 3 ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)
- `pnpm -C apps/web run typecheck` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)

Next Steps:
- Optional: Live/Chat Features nur bei Bedarf weiter ausbauen (keine Provider/Keys).
