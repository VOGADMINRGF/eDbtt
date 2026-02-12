# E150 Master Spec – Part 15: Offene Pfade & Restarbeiten

## Zweck

Dieses Dokument bündelt, welche Pfade (Part00–Part15) noch offen sind und welche Bestandteile erledigt werden müssen. Es verweist auf die Blöcke aus Part14, damit der nächste Run gezielt die Lücken schließen kann.

## Status-Übersicht der Pfade 00–15

- **Part00 Foundations / PII:** PII-Guardrails plus Klarname-Trennung (givenName/familyName) und Privacy-Flags dokumentiert; Migration/Aufsplitten alter Felder offen (siehe Identity & Profile Tasks).
- **Part01 Systemvision / Governance:** Leitplanken + 15 Themenkategorien als Backbone verankert.
- **Part02 Rollen / XP / Gamification:** XP-Anbindung benötigt noch Research-/Streams-/Campaign-Hooks (siehe Blöcke E, F, G); Profil-Freischaltungen pro Engagement-Level dokumentiert, UI-Gating offen.
- **Part03 Access Tiers & Pricing:** Grundlogik aktiv; Profil-Pakete (profileBasic/Pro/Premium) als Darstellungs-Dimension ergänzt, Mapping zu Tiers umzusetzen.
- **Part04 B2G/B2B Modelle:** Begriffe mit Profil-Paket-Namen harmonisiert; warten auf Campaigns/Streams-Implementierung (Block F/G) für echten Pilotbetrieb.
- **Part05 Orchestrator (Block A):** Gemini-Provider aktiv, rollenspezifische Prompts (citizen/staff/institution) und Health/Score-Tracking umgesetzt.
- **Part06 Consequences (Block B):** Modelle, Persistenz, API und UI fuer Responsibility/Consequences umgesetzt.  
- **Part06 Themenkatalog & Zuständigkeiten:** Neu angelegt, 15 Hauptkategorien verbindlich; `TOPIC_CHOICES`-Abgleich in Profil/Onboarding/Filter offen.
- **Part07 Graph & Reports (Block C):** Graph-Sync + Neo4j-Connector aktiv; Admin-Impact-Reports nutzen echte Graph-Daten.
- **Part08 Eventualities (Block D):** Eventuality-/DecisionTree-Typen, Persistenz, Admin-UI und Analyze-API implementiert.
- **Part09 Research Workflow (Block E/R2):** R2 umgesetzt: Seeding aus Questions/Knots, Filter/Sortierung, Contributor-Feedback, Graph-Backflow und Anti-Spam-Cooldown.
- **Part10 Responsibility Navigator (Block B):** Directory/Paths + Navigator + Admin-UI vorhanden.
- **Part11 Streams (Block F):** Stream-Modelle, Routes/UI, Agenda/Overlay und XP-Gating vorhanden.
- **Part12 Campaigns (Block G):** Campaign-Modelle, Admin-UI, Join/QR-Flow (MVP) implementiert.
- **Part13 I18N/A11y/Social (Block H):** I18N-Infra aktiv, A11y-Seiten vorhanden, Community/Chat-Skeleton ergänzt.
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
| **A – Orchestrator (E150 Core Provider)** | Part05 | **Done** | Gemini-Provider aktiv, rollenspezifische Prompts (citizen, staff, institution), Health-/Score-Tracking in `orchestrator_health.ts`; SSE bleibt intakt. |
| **B – Consequences & Responsibility Navigator** | Part06/10 | **Done** | Modelle + Persistenz + API (`/api/responsibility/[id]`, `/api/consequence/[id]`); `ResponsibilityNavigator.tsx` + Admin-Views fuer Directory/Paths. |
| **C – Graph & Reports** | Part07 | **Done** | `core/graph/syncAnalyzeResult.ts` (AnalyzeResult → Graph), Neo4j-Connector, `/admin/graph/impact` mit echten Graph-Stats. |
| **D – Eventualities / DecisionTree** | Part08 | **Done** | Typen `Eventuality`/`DecisionTree`, Persistenz + Admin-UI, API `/api/eventualities/analyze`. |
| **E (R2) – Research Workflow** | Part09 | **Done** | Seeding aus Questions/Knots (Admin-Seed); Filter-/Sortier-API (`/api/research/list` + `/api/research/tasks/list`); Contributor-Feedback („Hilfreich?“); Graph-Backflow bei akzeptierten Beiträgen; Anti-Spam-Cooldown. |
| **F – Streams** | Part11 | **Done** | Stream-Modelle + Sessions/Agenda/Overlay, UI, XP-Gating & Host-Checks vorhanden. |
| **G – Campaigns** | Part12 | **Done** | Campaign-Modelle + Admin-UI, `/campaign/[id]/join` + Join-API (MVP). |
| **H – I18N / A11y / Social** | Part13 | **Done** | I18N-Infra aktiv, A11y-Seite vorhanden, Community/Chat-Skeleton ergänzt. |

## Konkrete Next Steps

1. **Block A erledigt** (Part05): Gemini-Provider + rollenspezifische Prompts + Health/Score (PR-0018).
2. **Block B erledigt** (Part06/10): Consequences/Responsibility inkl. API, Navigator-UI, Admin (PR-0019).
3. **Block C/D erledigt** (Part07/08): Graph-Sync & Eventualities/DecisionTrees (PR-0020).
4. **Block F/G/H erledigt (MVP)** (Part11/12/13): Streams/Campaigns/I18N-A11y-Social (PR-0020).
5. **Nächster Fokus:** Stabilisierung, QA, Reports/Analytics-Vertiefung und UX-Polish der neuen Flows.

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

Diese Liste ist verbindlich für die nächsten Codex-Runs. Bei jedem Run den aktuell offenen Block aus Part14 wählen und die „Definition of Done“ erfüllen, bevor zum nächsten Pfad gewechselt wird. Sobald ein Block abgeschlossen ist, den Status im obigen Table auf **Done** setzen.

## PR-Log

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

Safe-Mode Checks (Membership/Payment):
- Admin-Verbuchen (`mark-paid`) und Kündigung (`cancel`) funktionieren, setzen user.membership-Status korrekt.
- Dunning-Job läuft trocken (keine Orders → no-op) und setzt bei Fälligkeit Reminder-Level / Auto-Cancel.
- /account zeigt korrekten Status inkl. PaymentInfo (masked) ohne PII-Leak; Copy-Buttons ok.
