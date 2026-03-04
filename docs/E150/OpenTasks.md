# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.  
Wenn `Part14`, `Part15` oder Drift-Prompts abweichen, gewinnt diese Datei.

Stand: 2026-03-04

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
| N | Demo/Screenshot Studio | Done | - | /demo Studio + Manual Factcheck + Region Pitch |

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
| PR-0034 | DossierSchema Wrapper + Vote Policy (Legitimation 2.0) | Done (Core) | Optional: DS-04 |
| PR-0010B | DecisionArchitecture v2.0 (Part16) – Publishing Pack + Drift-Validator | Done | - |

## Aktive Aufgaben

Aktive Pflicht-Tasks:

- **Keine** (Stand: 2026-03-04). Pflicht-Backlog ist abgearbeitet.

Operative Tasks (aus aktuellem Chat/Repo):

| Task | Status | Naechster Run | Evidenz/Notiz |
| --- | --- | --- | --- |
| Keine | - | - | - |

Erledigt (seit 2026-03-04):

| Task | Status | Evidenz |
| --- | --- | --- |
| Admin Graph Navigation (Impact/Health/Repairs) vereinheitlicht | Done | `apps/web/src/components/admin/GraphAdminNav.tsx`, `apps/web/src/app/admin/graph/*/page.tsx` |
| Graph-Health Fehlerdetail (missingEnv + Hinweis) + Impact-Link | Done | `apps/web/src/app/api/admin/graph/health/route.ts`, `apps/web/src/app/admin/graph/health/page.tsx`, `apps/web/src/app/admin/graph/impact/page.tsx` |
| Phase 0 Startpaket (Docs + Dev-Skripte + Root Env) | Done | `docs/START_HERE.md`, `docs/ARCHITECTURE.md`, `.env.example`, `scripts/dev/*`, `docker-compose.yml`, `compose/prod.yml` |
| CI fuer Compose/Prod aktualisiert (Tri-Mongo ENVs + compose/prod.yml) | Done | `.github/workflows/e150-ci.yml` |
| Pending Commit (Landing/Admin/Create/Material/Telemetry) abgeschlossen | Done | Sammel-Commit inkl. Landing/Admin/Create/Material/Telemetry + Pricing/SEO/Region |
| DecisionArchitecture v2.0 Download-Asset wiederhergestellt | Done | `apps/web/public/docs/DecisionArchitecture_v2_0.docx` |
| Create-Route + AdminErrorPanel in Git aufgenommen | Done | `apps/web/src/app/create/page.tsx`, `apps/web/src/components/admin/AdminErrorPanel.tsx` |
| Landing-Input wieder oben zentriert + Hintergrund-Fade bei Fokus | Done | `apps/web/src/app/start/LandingStart.tsx`, `features/landing/LandingAssistant.tsx` |
| MaterialHub Hash-Sprung (#material) abgesichert | Done | `apps/web/src/components/dossier/MaterialHub.tsx` |
| Admin-Fehleranzeigen vereinheitlicht (Detail/Hints) | Done | `apps/web/src/components/admin/AdminErrorPanel.tsx`, `apps/web/src/app/admin/*` |

Erledigt (seit 2026-02-19):

| Task | Status | Evidenz |
| --- | --- | --- |
| Contributions/New Analyse-Flow auf Auto-Flow umgestellt (Editorial maxClaims 30, Statement-Dedupe, Flow-Coach/Community entfernt, Echtzeit-Feedback als Placeholder, Express als Default) | Done (2026-03-04) | `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`, `apps/web/src/app/contributions/new/ContributionNewClient.tsx` |
| Dossier-Header Premium/Mobile/No-Duplicates (InstitutionalHeader Mini-Cards + Details, konsolidierte Origin-Karte) | Done (Repo-Evidenz) | `apps/web/src/components/dossier/InstitutionalHeader.tsx`, `apps/web/src/components/dossier/DossierViewer.tsx` |
| Demo/Screenshot Studio (Guard + Routen + statische Demo-Daten) | Done (Repo-Evidenz) | `apps/web/src/app/demo/layout.tsx`, `apps/web/src/app/demo/*`, `features/report/data/demoReports`, `features/votes/demoVotes.ts`, `features/mandate/demoMandate.ts` |
| Demo Factcheck (KI/Manuell) + Redaktion-Feedback + Admin-Review | Done (Repo-Evidenz) | `apps/web/src/app/demo/factcheck/page.tsx`, `apps/web/src/app/api/editorial/feedback/route.ts`, `apps/web/src/app/admin/factcheck/page.tsx`, `apps/web/src/app/api/admin/editorial/factchecks/route.ts`, `apps/web/src/lib/editorial/status.ts` |
| Region Pitch + Landing Fallback + Feed-Region-Filter | Done (Repo-Evidenz) | `apps/web/src/app/admin/pitch/page.tsx`, `apps/web/src/app/admin/adminNav.ts`, `apps/web/src/app/region/[codeOrSlug]/page.tsx`, `apps/web/src/lib/region/summary.ts`, `apps/web/src/lib/region/filters.ts`, `apps/web/src/app/api/feeds/pull/route.ts` |
| Pricing/Vormerken Domain in `features/pricing` konsolidiert (client-safe Exports, server-only Usecase, fehlende Types) | Done (2026-03-04) | `features/pricing/domain/*`, `features/pricing/usecases/createPreorderLead.ts`, `features/pricing/server/leadsRepo.ts`, `features/pricing/types.ts`, `features/pricing/index.ts`, `apps/web/src/app/api/edebatte/preorder/route.ts` |
| Pricing-/Vormerken-UI vereinheitlicht + Premium-Karten + Gradient-CTA | Done (2026-03-04) | `apps/web/src/app/pricing/page.tsx`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `apps/web/src/app/vormerken/page.tsx` |
| SEO-Regionen & Pillar-Seiten + kanonische Slugs (ASCII) + Sitemap | Done (2026-03-04) | `features/seo/*`, `apps/web/src/app/deutschland/*`, `apps/web/src/app/digitale-buergerbeteiligung/page.tsx`, `apps/web/src/app/beteiligungsplattform/page.tsx`, `apps/web/src/app/sitemap.ts`, `apps/web/src/lib/seo/jsonLd.ts` |
| Locale-Detection zentralisiert | Done (2026-03-04) | `apps/web/src/lib/i18n/detectLocale.ts`, `apps/web/src/app/layout.tsx` |
| Typecheck + Lint wieder gruen (Install ok) | Done (2026-03-04) | `pnpm -w -r typecheck`, `pnpm -w -r lint` |
| Vercel Build-Fail `node:crypto` in RateLimit behoben (WebCrypto) | Done (Repo-Evidenz) | `apps/web/src/utils/rateLimit.ts` |

Letzter Pflicht-Task (erledigt):
- **PR-0010B**: DecisionArchitecture v2.0 Publishing Pack + Drift-Validator (Landingpage, Downloads, Validator).

---

## Strategische Erweiterung – Dossier-Normierung (Legitimation 2.0) — Next Run: PR-0034

### Ausgangslage

`AnalyzeResult` bildet bereits faktisch das vollständige eDebatte-Dossier ab
(Claims, Consequences, ResponsibilityPaths, DecisionTrees, EvidenceGraph, Report, EditorialAudit, RunReceipt).

Aktuell existiert jedoch kein explizites Top-Level-Dossier-Objekt.

### Ziel

Ein normiertes `DossierSchema` einführen, das:

- `AnalyzeResult` kapselt
- Metadaten (Titel, Zuständigkeit, Region, Status) ergänzt
- Quellen-Set explizit referenziert (runReceipt.sourceSet)
- Beteiligung/Vote-Config strukturiert abbildet
- als Referenz im Weißbuch ("Legitimation 2.0") dient

### Tasks

| Task | Beschreibung | Status |
|------|--------------|--------|
| DS-01 | `features/dossier/schemas.ts` mit `DossierSchema` Wrapper erstellen | Done (Repo: `features/dossier/schemas.ts`) |
| DS-02 | Adapter `buildDossierFromAnalyze()` implementieren | Done (Repo: `features/dossier/buildDossierFromAnalyze.ts`) |
| DS-03 | Whitepaper-Hook im E150-Docs verankern (Part07) | Done (Repo: `docs/E150/Part07_Graph_Reports_StructuredKnowledge.md`) |
| DS-04 | Optional: Route `/dossier/[id]` (Read-only Viewer, keine Migration) prüfen | Done (Repo: `apps/web/src/app/dossier/[id]/page.tsx`) |

### Zielbild

Dossier = formalisierte digitale Entscheidungsakte als Container fuer Analyse, Evidenz, Verantwortung und Beteiligung.

### 1) Nachlauf (optional)

Funktion (Skizze):
- Kleinere UX-Polish-Backlogpunkte nach Bedarf (z.B. Sharing-Preview auf weiteren Seiten).

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Social Preview | OG-Defaults im Root-Layout + Dossier-Detail + Report Hub/Report/Topic Metadata + Stream/Profil-Metadata + Support/QR-Metadata | Weitere Detailseiten (Admin/weitere Spezialrouten) sukzessive erweitern |
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
