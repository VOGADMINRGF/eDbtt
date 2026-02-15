# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.  
Wenn `Part14`, `Part15` oder Drift-Prompts abweichen, gewinnt diese Datei.

Stand: 2026-02-12

## Block-Board

| Block | Thema | Status | Naechster Run | Ziel |
| --- | --- | --- | --- | --- |
| A | Orchestrator | Done | - | Stabil halten, nur Fehlerfixes |
| B | Consequences/Responsibility | Done | - | Stabil halten, nur Fehlerfixes |
| C | Graph/Reports | Done | - | Monitoring/Polish bei Bedarf |
| D | Eventualities | Done | - | Monitoring/Polish bei Bedarf |
| E (R2) | Research Workflow | Done | - | Betrieb/Qualitaet absichern |
| F | Streams | Done (PR-0031) | - | Stream-Kit Overlay/QR/Agenda produktisiert |
| G | Campaigns | Done (PR-0032) | - | CTA/UX-Polish + Reporting-Feinschliff |
| H | I18N/A11y/Social | Done (PR-0033) | - | Produktreife der Skeleton-Pfade |
| I | Unterstuetzen/Crowdfunding | Done | - | End-to-End SupportCampaign/SupportPledge live |
| M | Membership Apply | Done | - | Betrieb + Monitoring |

## Drift Backlog (aus .codex/drifts)

Diese Liste ist die kanonische Umsetzungsliste fuer alle vorhandenen Drift-Prompts.

| Drift | Scope | Status | Naechster Run |
| --- | --- | --- | --- |
| PR-0009 | Pilot Backbone (Feeds → Kandidaten → Faktencheck → Graph/Dossier) | Done | - |
| PR-0010 | Admin Akquise Dashboard (Feeds/Regionen) | Done | - |
| PR-0011 | Offene Beitraege (Quelle/Option/Frage, Moderation) | Done | - |
| PR-0012 | Media Ready Projekte (5–10 Themen, min 5 Optionen) | Done | Monitoring/Polish |
| PR-0013 | Live/Chat Skeleton | Done | - |
| PR-0030 | Unterstuetzen/Crowdfunding | Implemented | Monitoring/Polish |
| PR-0010B | DecisionArchitecture v2.0 (Part16) – Publishing Pack + Drift-Validator | Done | - |

## Aktive Aufgaben

Aktive Pflicht-Tasks:

- **Keine** (Stand: 2026-02-15). Pflicht-Backlog ist abgearbeitet.

Letzter Pflicht-Task (erledigt):
- **PR-0010B**: DecisionArchitecture v2.0 Publishing Pack + Drift-Validator (Landingpage, Downloads, Validator).

### 1) Nachlauf (optional)

Funktion (Skizze):
- Kleinere UX-Polish-Backlogpunkte nach Bedarf (z.B. Sharing-Preview auf weiteren Seiten).

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Social Preview | OG-Defaults im Root-Layout + Dossier-Detail + Report Hub/Report/Topic Metadata + Stream/Profil-Metadata | Weitere Detailseiten (Support/QR/Admin) sukzessive erweitern |
| Page Contracts (CI) | `scripts/check-page-contracts.mjs` aktiv; `missing-h1`-Allowlist abgebaut (0) | optional: weitere Semantik-Checks nur falls Bedarf |
| Type Hygiene (Pages) | Kernseiten `account`, `admin`, Auth-Flow + QR/Stream/Support/Reports bereinigt; Admin-Report/Errors/Impact/Report-Assets typisiert | Restliche `any`-Verwendungen in Admin-Detailseiten systematisch reduzieren |
| Admin Navigation | Hubs + Direktzugriff + Schnellaktionen + Bulk-Status in Editorial Queue | Optional: weitere Drilldowns |
| Swipes End-to-End | Swipe-Feed aus `statement_proposals`, Votes in `swipe_votes` + Content-KPI-Analytics + Admin-Swipes-Report + 30d-Timeseries | Optional: Detail-Drilldowns |
| SwipeCards Context | Graph-Randinfo/Context-Accordion "Warum sehe ich das?" vorhanden (optional via `contextPanel`) | Optional: Relation-Mapping/Auto-Quelle aus Graph-API |
| Campaign QR Polish | `/qr/[qrId]` verbessert + QR-Scan-Tracking aktiv | Optional: QR-Scan-Dashboards |
| Support UX Polish | `/support/[slug]` Guided-Payment-Hinweise ergänzt | Optional: Social-Proof/Region-Filter, Bulk-Action |
| Public Profile Polish | Public Profile Flags + ShareId + Avatar/Cover Upload API + Impact-Ansicht | Optional: Medien-Moderation/Rate-Limits |
| Stream Deliberation Cockpit | Stream-Cockpit + Agenda + Overlay + Deliberation-Phasen/Timer + Moderations-Queue (MVP) + Live-Dossier-Board + Follow-up-Tracker + Call-ins + Fairness/Rotation | Optional: Auto-Auswahl/Rotation-Logik |
| Stream-Kit Polish | Overlay/Viewer/QR-Target aktiv + QR-Bildrendition + Session-Vorlagen | Optional: strukturierte Queue |
| Media/TV QR Studio | Admin-QR-Studio fuer TV/Events (QR-Set Builder + Live-Trends) | Optional: Script-Upload als Datei, Export/Snapshot |

## Arbeitsregel fuer jeden Run

1. `OpenTasks.md` zuerst lesen.
2. Genau ein aktives Paket umsetzen (max 6 Aufgaben im Drift).
3. `Part15.md` PR-Log aktualisieren.
4. `OpenTasks.md` Status/Naechster Run aktualisieren.
5. `Changes / Verification / Next Steps` ausgeben.
