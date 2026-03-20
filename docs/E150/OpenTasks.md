# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.
Wenn andere Parts, alte Drift-Prompts oder Zwischen-Notizen abweichen, gewinnt diese Datei.

Stand: 2026-03-20

## Leitbild

Kernfluss des Systems:

**Freistart -> Analyse/Qualitaet -> Graph-Matching -> CTA-Moment -> Anlassraum/Dossier/Beteiligung**

Governance-/Umsetzungsfluss (weiterhin verbindlich):

**Signal -> Anlassraum -> Dossier -> Runde -> Mandat -> Umsetzung -> Impact**

Wichtige Produktregeln:

- Feeds sind nur **Signalquellen**, nie direkte Publikationslogik.
- **Signals** sind interne Relevanzindikatoren, keine Waehrung, keine Stimmen, keine Wahrheit.
- **Funding** ist strikt getrennt von Signals.
- **Anlassraum** ist nicht gleich **Dossier**.
- Nichts wird automatisch publiziert.
- Publikation nur ueber Review + Approval.
- Anonyme Hinweise sind erlaubt, aber nie allein publikationsfaehig.
- Geld darf niemals Wahrheit, Faktenstatus oder Abstimmungsergebnis kaufen.

## Merge-Prinzip V1 + V2

Diese Fassung kombiniert:
- **V1** = neues Governance-/Anlassraum-/Signals-/Funding-/Pricing-Leitbild
- **V2** = operativer Alt-Backlog, bestehende Drifts, erledigte Evidenzen, laufende Repo-Tasks

Regel:
- **V1 gewinnt bei Zielmodell und Architektur**
- **V2 bleibt erhalten bei operativen Tasks, Repo-Evidenzen und erledigten Aufgaben**

## Block-Board

| Block | Thema | Status | Naechster Run | Ziel |
| --- | --- | --- | --- | --- |
| A | Orchestrator | Done | - | Stabil halten, nur Fehlerfixes |
| B | Consequences / Responsibility | Done | - | Stabil halten, nur Fehlerfixes |
| C | Graph / Reports | Done (Core) | GOV-ANLASS-02 | Reports konsequent aus Dossiers/Anlassraeumen ableiten |
| D | Eventualities / Decision Trees | Done (Core) | GOV-ANLASS-02 | Weiter mit Dossier-/Runden-Anbindung |
| E (R2) | Research Workflow | Done (Core) | GOV-ANLASS-08 | Community-Research mit Factcheck/Truth-Guardrails verknuepfen |
| F | Streams | Done (Core) | GOV-EVENT-01 | Event-/Session-Modell voll andocken |
| G | Campaigns | Done (Core) | GOV-FUNDING-01 | Funding-/Mission-/Projektlogiken sauber trennen |
| H | I18N / A11y / Social | Done | - | Produktreife halten |
| I | Unterstuetzen / Crowdfunding | Implemented (legacy) | GOV-FUNDING-01 | In Signals/Funding-Modell ueberfuehren |
| M | Membership Apply | Done | GOV-PRICING-01 | Membership mit neuer Paketlogik harmonisieren |
| N | Demo / Screenshot Studio | Done | GOV-MUNI-01 | Kommune-/Pilot-Sales-Demos damit speisen |
| O | Governance / Journalismus / Kommune / Initiative / Organisation | In Progress (Wave 2 core in progress) | GOV-AI-01 | Gemeinsames Zielmodell voll verankern |
| P | Anlassraum / Signals / Funding / Pricing | In Progress (Wave 2 core in progress) | GOV-AI-01 | Manual-first Kernsystem produktiv verankern |

## Drift Backlog (bestehend)

| Drift | Scope | Status | Naechster Run |
| --- | --- | --- | --- |
| PR-0009 | Pilot Backbone (Feeds -> Kandidaten -> Faktencheck -> Graph/Dossier) | Done | - |
| PR-0010 | Admin Akquise Dashboard (Feeds/Regionen) | Done | - |
| PR-0011 | Offene Beitraege (Quelle/Option/Frage, Moderation) | Done | - |
| PR-0012 | Media Ready Projekte (5-10 Themen, min 5 Optionen) | Done | Monitoring/Polish |
| PR-0013 | Live/Chat Skeleton | Done | - |
| PR-0030 | Unterstuetzen/Crowdfunding | Implemented | Monitoring/Polish |
| PR-0034 | DossierSchema Wrapper + Vote Policy (Legitimation 2.0) | Done (Core) | Optional: DS-04 |
| PR-0010B | DecisionArchitecture v2.0 (Part16) – Publishing Pack + Drift-Validator | Done | - |

## Priorisierte PR-Reihenfolge

### Welle 1 — Governance Foundation
Status: **Done (2026-03-19)**

- **GOV-01** gemeinsames Lifecycle-Modell `Anlass -> Dossier -> Pruefung -> Runde -> Mandat -> Umsetzung -> Monitoring` (**Done**)
- **GOV-02** gemeinsames Rollen-, Raumtyp- und Trust-Level-Modell (**Done**)
- **DOCS-GOV-01** Architekturtexte als verbindliche Single Source of Truth (**Done**)

### Welle 2 — Anlassraum / Event / Feed Review
Status: **In Progress (Core baseline / 2026-03-19)**

- **GOV-ANLASS-01** universelles Anlassraum-Modell (**Core baseline active**)
- **GOV-ANLASS-02** Anlassraum <-> Dossier Beziehung (**Core baseline active**)
- **GOV-ANLASS-03** regionale / skalenfaehige Gruppierung (`local`, `regional`, `national`, `eu`, `global`) (**Core baseline active**)
- **GOV-ANLASS-04** Feed-Review statt Feed-Leerlauf (**Queue ops deepened + output-prep surface active**)
- **GOV-EVENT-01** Event-/Sitzungsmodell (**Event->Anlassraum linking active**)
- **GOV-EVENT-02** QR -> Fragen -> Protokoll -> Dossier -> Runde (**Functionally complete: service+route acceptance + legacy backfill strategy (manual-first)**)

### Welle 2.5 — Freistart / KI-Qualitaet / Match-CTA (neu priorisiert)
Status: **Open (Architecture alignment required / 2026-03-20)**

- **GOV-AI-01** Freistart + verpflichtende Qualitaetsschicht
- **GOV-AI-02** Graph-Matching + CTA-Layer
- **GOV-AI-03** Anlassraum als Arbeitsort
- **GOV-AI-04** Canonical Multi-Orchestration Flow
- **GOV-AI-05** Prompt Contracts + Typed Outputs
- **GOV-AI-06** Language-Aware Core + Cross-Lingual Matching
- **GOV-AI-07** Meta-Layer / Audit / Provenance / Layman Explanation

### Welle 3 — Kommune / Verwaltung
- **GOV-MUNI-01** Buergermeister-Dashboard
- **GOV-MUNI-02** Dezernatslogik
- **GOV-MUNI-03** Raum-/Prozessstatus fuer Verwaltung
- **GOV-MUNI-05** Verwaltungsmodus
- **GOV-MUNI-06** Beamten-/Verwaltungsrollen

### Welle 4 — Pricing / Billing / Funding / Signals
- **GOV-PRICING-01** Hybrid-Pricing und Packaging finalisieren
- **GOV-PRICING-02** Admin Pricing Control + Rabatt-Engine
- **GOV-FUNDING-01** Signals + Funding + Funding Intent + Readiness Score
- **GOV-FUNDING-02** Mission / Projekt / Ressourcen / Hybrid Funding
- **GOV-FUNDING-03** Matching Funds, Impact Tracking, Refunding
- **GOV-SIGNAL-01** Signal-Aggregation, Trigger, Decay, Radar-Logik

### Welle 5 — Journalismus
- **GOV-JOURNALISM-01** `source_anchor` als Anlassgeber
- **GOV-JOURNALISM-02** Truth Guardrails + Factcheck Interventions
- **GOV-JOURNALISM-03** Newsroom Embed/QR Companion
- **GOV-JOURNALISM-04** Journalist-/Redaktionsprofile

### Welle 6 — Organisationen / Verbaende / Civic
- **GOV-ORG-01** dossierbasierte Organisationsidentitaet
- **GOV-ORG-02** offizieller Release-/Trust-Modus
- **GOV-CIVIC-01** Wirkungsverlauf fuer Buergerprofile
- **GOV-CIVIC-02** Initiative-Lifecycle
- **GOV-CIVIC-03** Impact-/Unterstuetzungslogik fuer Initiativen

## Aktive Aufgaben (operativer Backlog bleibt erhalten)

| Task | Status | Naechster Run | Evidenz/Notiz |
| --- | --- | --- | --- |
| Create IA v2: dedizierte Mode-Module (`manual/source/ai`) statt nur Workspace-Parametrisierung | Superseded (legacy intermediate state, no longer target architecture) | GOV-AI-01 | `manual/source/ai` bleibt nur als Legacy-Kompatibilitaets-/Migrationsschicht aktiv (inkl. Alias-Normalisierung + Persistenz), ist aber nicht mehr der kanonische Produktpfad; kanonisch: Freistart + verpflichtende Qualitaetsschicht + Graph-Matching + CTA-Layer |
| Runden Entry Surface auf produktive Quelle umstellen (statt Seed aus `features/topicRound/data.ts`) | Done (productive source + compatibility matrix active / 2026-03-19) | PR-0039 | `/runden` liest aus produktivem `output_seed`/`anlassraum`-Read-Model (`features/topicRound/entrySource.ts`, `GET /api/runden/entry`); `/demo/runden` ist expliziter Compat-Redirect auf `/runden` (kein Seed-Fallback), inkl. Tests `apps/web/tests/runden-entry.*`, `apps/web/tests/runden-compat.*`, `apps/web/tests/runden-page.acceptance.test.ts` |
| Backward-Compatibility finalisieren | Done (legacy/demo round entry clarified / 2026-03-19) | PR-0039 | Canonical Round-Entry = `/runden`; alte Demo-Pfade zeigen explizit auf produktiven Einstieg (`apps/web/src/app/demo/runden/page.tsx`, `apps/web/src/app/demo/page.tsx`, `apps/web/src/app/demo/DemoNavClient.tsx`) |
| E2E-Abnahme fuer `/create` + `/runden` | Done (acceptance baseline verified / 2026-03-19) | PR-0039 | Scenarios A-F abgedeckt: Compat-Redirect, `/runden` Empty/Error, `/create` Mode-Reflexion + Save/Finalize-Mode-Propagation, stabile `invalid_create_mode`-Fehler, kein Seed-Fallback/kein Publish-Bypass (`apps/web/tests/runden-page.acceptance.test.ts`, `apps/web/tests/create-mode.page.test.ts`, `apps/web/tests/create-mode.save.route.test.ts`, `apps/web/tests/create-mode.finalize.route.test.ts`) |
| Community Group Surfaces entkoppeln | In Progress (resolver/API + deep-link contract boundary active) | PR-0041 | `/community` nutzt dedizierten Read-Resolver + Read-Route + kanonischen Deep-Link-Contract: `features/community/groupSurface.ts`, `features/community/deepLinkContract.ts`, `GET /api/community/groups`, `apps/web/src/app/community/page.tsx`, Tests `community-groups.*`, `community-page.states.test.ts`, `community-deep-links.contract.test.ts` |
| Community Deep-Link Contracts vereinheitlichen | In Progress (canonical contract active) | PR-0041 | Shared Canonical Params + Alias-Normalisierung + Canonical Href-Builder aktiv in Page/Route/Resolver + Link-Producern (`AccountClient`/Discovery); stabile Invalid-Param-Mappings ohne Fallback |
| Community E2E absichern | Done (acceptance coverage mobile+desktop active / 2026-03-19) | PR-FEED-ANLASS-02 | Community Read-Surfaces A-F abgedeckt inkl. Canonical/Legacy/Invalid/Unavailable/Read-only-Guardrails: `apps/web/tests/community-*.test.ts` |
| Feed/Anlassraum Picker im `/create` anbinden | Done (manual productive context picker active / 2026-03-19) | PR-FEED-ANLASS-02 | Read-only Kontextauswahl in `/create` aktiv (`GET /api/create/context`, `features/create/contextPicker.ts`, `app/create/CreateClient.tsx`), explizite `anlassraumId`-Propagation in Analyze/Save/Finalize ohne Auto-Linking/Publish/Approval; Tests `apps/web/tests/create-context-picker.*`, `apps/web/tests/create-mode.*` |
| Feed/Anlassraum Cluster-Job | Done (baseline worker active / 2026-03-19) | PR-FEED-ANLASS-03 | Dedizierter Cluster-Worker aktiv (`features/feeds/clusterJob.ts`) inkl. Runner `POST /api/admin/feeds/cluster/run`, persistente Candidate-Outputs (`feed_anlassraum_cluster_candidates`) und Idempotenz (`created/updated/unchanged`) ohne Publish-/Approval-Seiteneffekt; Tests `apps/web/tests/feed-cluster-job.*` |
| Feed/Anlassraum Status-Transitions absichern | In Progress (Wave 2 deepening) | PR-FEED-ANLASS-04 | erweitert um Queue-Review-Aktionen + Bulk-Route + Queue-Triage: `features/feeds/reviewQueue.ts`, `apps/web/src/app/api/admin/feeds/drafts/bulk/route.ts`, `apps/web/src/app/api/admin/feeds/drafts/route.ts` |
| Feed/Anlassraum Publish-Flows ausbauen | Done (manual output-prep baseline closed / 2026-03-19) | PR-FEED-ANLASS-06 | Output-Prep operabel inkl. Admin-Surface: `features/anlassraum/outputPrep.ts`, `GET /api/admin/feeds/anlassraum/[id]/outputs`, `POST /api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition`, `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx` |
| Feed/Anlassraum Backfill | In Progress (legacy remediation UX + audit active) | PR-FEED-ANLASS-06 | Detection + per-draft Remediation inkl. Audit-Sichtbarkeit: `GET /api/admin/feeds/drafts/legacy`, `POST /api/admin/feeds/drafts/[id]/backfill`, `apps/web/src/app/admin/feeds/drafts/page.tsx` |
| Swipes Kontextpfade haerten | Open | PR-0042 | thematisch passendes Ziel |
| Swipes Mobile Gestures + Bottom-Actions | Open | PR-0043 | thumb-reachable |
| Swipes Varianten-Schritt finalisieren | Open | PR-0044 | Ranking/Weighting/Exclude |
| Swipes UX-Dedupe | Open | PR-0045 | redundante Vertiefungen reduzieren |
| UI-Konsistenz Light/Dark | Open | PR-0046 | Kontrast-/Schriftprobleme |
| Account Dark-Mode Nacharbeit | Open | PR-0047 | Components/Token-Check |
| Env-Key-Hardening abschliessen | Open | PR-ENV-01 | Runtime-Aliasse |
| Mongo SRV `ECONNREFUSED` robust abfedern | Open | PR-ENV-02 | DNS/Netz/Config-Fallback |

## Neue Architektur-Tasks (V1 dauerhaft verankert)

### GOV-01 — Governance Core
- gemeinsames Betriebsmodell fuer Journalismus, Kommune, Organisationen, Events, Civic und Initiative
- kein Feature-Silo

Status: **Done (Wave 1 / 2026-03-19)**

Evidenz:
- `features/entities/types.ts`
- `features/entities/stateMachine.ts`
- `features/entities/service.ts`
- `features/anlassraum/stateMachine.ts`
- `features/anlassraum/governance.ts`

Definition of Done:
- zentrale Zustandsmaschine dokumentiert
- gemeinsame Objektlogik fuer `Entity`, `Anlassraum`, `Dossier`, `Runde`, `Mandat`
- Part01 / Part14 / OpenTasks synchron

### GOV-02 — Trust / Roles / Raumtypen
Muss enthalten:
- Personen-Trust: `anonymous`, `registered`, `verified`, `institutional`, `editorial`
- Inhalts-Trust: `unverified`, `source_based`, `disputed`, `checked`
- Raumtypen: `public`, `community`, `official`, `editorial`, `internal`, `hybrid`

Status: **Done (Wave 1 / 2026-03-19)**

Evidenz:
- `features/trust/types.ts`
- `features/trust/gates.ts`
- `features/anlassraum/governance.ts`
- `apps/web/src/lib/server/auth/governance.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/transition/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/route.ts`
- `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/status/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/publish/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/review/route.ts`
- `apps/web/src/app/api/feeds/drafts/[id]/publish/route.ts`

Route-Level Permission Update (Wave 2/3 Regel, umgesetzt am 2026-03-19):
- Governance-Routen sind nicht mehr strikt admin-only.
- Freigeschaltete Governance-Akteure: `reviewer`, `editorial_actor`, `institutional_actor`, `admin`.
- Rechte bleiben scoped auf relevanten `Entity`-/`Anlassraum`-Kontext.
- Community-Rollen erhalten weiterhin keine Review/Approval/Publish-Rechte.
- Publish-Gates, Manual-first und Review-first bleiben unveraendert verpflichtend.
- Publish-Gate ist gehaertet (Quellenrollen, Publisher-Diversitaet, strukturierte Claims/Fragen, Weak-Signal-Korroboration).
- Feed-Typen sind auf einen kanonischen Pfad gehaertet: `features/feeds/types.ts` ist Source of Truth; aktive Importe laufen ueber `@features/feeds/types`.
- Neue Governance-Contract-Routen (GOV-EVENT-02 Apply Layer) bleiben scoped + role-checked:
  `reviewer`, `editorial_actor`, `institutional_actor`, `admin`.

### DOCS-GOV-01 — Dokumentation synchron
Status: **Done (Wave 1 / 2026-03-19)**

Evidenz:
- `docs/E150/OpenTasks.md`
- `docs/E150/Part15.md`

### GOV-ANLASS-01 — Anlassraum Architektur
Pflichtfelder:
- `type`
- `topicKey`
- `scope`
- `decisionScope`
- `regionKey`
- `status`
- `maturity`
- `ownerType`
- `ownerId`
- `parentAnlassraumId`

Anlassraum-Typen:
- `policy`
- `event`
- `conflict`
- `investigation`
- `proposal`
- `crisis`
- `community_project`
- `funding_case`
- `monitoring`

Status: **In Progress (Core baseline / 2026-03-19)**

Evidenz:
- `features/anlassraum/types.ts`
- `features/anlassraum/service.ts`
- `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- `apps/web/src/app/api/events/route.ts`

### GOV-ANLASS-02 — Anlassraum <-> Dossier
Regeln:
- mehrere Anlassraeume duerfen in ein Dossier muenden
- ein Anlassraum kann ohne Dossier bestehen
- Dossier-Typen: `exploration_dossier`, `decision_dossier`

Status: **In Progress (Core baseline / 2026-03-19)**

Evidenz:
- `features/anlassraum/types.ts` (`dossierType`)
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/dossier/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/route.ts`

### GOV-ANLASS-03 — Regionen / Skalen
Scopes:
- `local`
- `regional`
- `national`
- `eu`
- `global`

Regel:
- Thema kann global sein, Entscheidung lokal oder national (`decisionScope`)

Status: **In Progress (Core baseline / 2026-03-19)**

Evidenz:
- `features/anlassraum/types.ts` (`ANLASSRAUM_SCOPES`)
- `features/anlassraum/service.ts` (region/scope derivation)
- `apps/web/src/app/api/events/route.ts` (scope/decisionScope bei Event->Anlassraum)

### GOV-ANLASS-04 — Feed Review statt Feed Leerlauf
Queue-/Admin-Aktionen:
- `ignore`
- `attach_to_anlassraum`
- `create_anlassraum_candidate`
- `mark_as_weak_signal`

Status: **In Progress (Queue deepening active / 2026-03-19)**

Evidenz:
- `features/feeds/reviewQueue.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/review/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/reviewErrors.ts`
- `apps/web/src/app/api/admin/feeds/drafts/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/bulk/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/backfill/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/outputPrepErrors.ts`
- `apps/web/src/app/admin/feeds/drafts/page.tsx`
- `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`
- `apps/web/tests/feed-review.routes.test.ts`
- `apps/web/tests/feed-backfill.service.test.ts`
- `apps/web/tests/anlassraum-output-prep.routes.test.ts`
- `apps/web/tests/anlassraum-output-prep.service.test.ts`
- `features/anlassraum/outputPrep.ts`
- `features/anlassraum/types.ts`

Queue Deepening (2026-03-19):
- Queue-Filter erweitert: `status`, `reviewState`, `region`, `hasAnlassraum`, `weakSignal`, `q` (Titel/Summary/Quelle).
- Queue-Sortierung erweitert: `newest`, `oldest`, `review_recent`, `review_stale`, `priority_high`.
- Triage-Metadaten je Draft: `lastReviewAction*`, `queueMeta` (`priorityScore`, `priorityBucket`, `pendingHours`, `needsAnlassraumBackfill`, `reasons`).
- Bulk-Review (manual-first, nicht publizierend): `POST /api/admin/feeds/drafts/bulk` fuer `ignore`, `mark_as_weak_signal`, `attach_to_anlassraum`, `create_anlassraum_candidate`.
- Legacy-Backfill-Pfad (admin-safe): `GET /api/admin/feeds/drafts/legacy` + `POST /api/admin/feeds/drafts/[id]/backfill`.

Legacy Backfill UX + Audit (PR-FEED-ANLASS-06 / 2026-03-19):
- Minimales Admin-Remediation-Surface in `apps/web/src/app/admin/feeds/drafts/page.tsx` listet unlinked Legacy-Drafts und bietet per Draft:
  `attach` (explizite Anlassraum-ID) oder `create_candidate`.
- Audit-Sichtbarkeit im Legacy-Panel:
  `lastReviewAction`, `lastReviewActionBy`, `lastReviewActionAt`, `reviewNote`, Weak-Signal-Status, Triage-Reasons.
- Backfill-Response liefert expliziten Remediation-Typ:
  `attached_existing_anlassraum` oder `created_candidate_anlassraum`.
- Kein Silent-Migration-Pfad: keine Bulk-Auto-Migration, keine Hintergrund-Migration, keine Publish-/Approval-Seiteneffekte.

Output-Prep Deepening (PR-FEED-ANLASS-05 / 2026-03-19):
- Output-Seed-Workflow ist API-first operationalisiert fuer `round_seed`, `dossier_seed`, `embed_seed`, `social_seed`, `regional_briefing_seed`, `editorial_pitch_seed`.
- Output-Prep-Status-Transitions sind explizit/manuell: `draft`, `queued`, `review`, `ready`, `published`, `discarded`.
- Transition-Aktionen (manual-first): `queue`, `send_to_review`, `approve_prep`, `reject_prep`, `mark_ready`, `publish`, `discard`, `reset_draft`.
- `mark_ready`/`publish` bleiben publish-gated (`getAnlassraumPublishGate`) und setzen `reviewState=approved` voraus.
- Kein Direktpfad aus Feed-Ingest in oeffentliche Publikation; `publish` ist nur Output-Prep-Status (kein Auto-Live-Release).

Output-Prep Closure (PR-FEED-ANLASS-05 Abschluss / 2026-03-19):
- Minimales Admin-Manual-Surface aktiv in `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`:
  Output-Seeds listen, Status/Review/PublishTarget/LastAction sehen, manuelle Transition pro Seed ausfuehren.
- Service-Level-Integrationstests gegen reale `outputPrep`-Domainlogik aktiv:
  `apps/web/tests/anlassraum-output-prep.service.test.ts`.
- PR-FEED-ANLASS-05 Baseline gilt als funktional geschlossen; weitergehende Public-Release-Automation bleibt bewusst nicht automatisiert.

Community Group Surface Decoupling (PR-0039 / 2026-03-19):
- `/community` ist von Inline-Resolvern entkoppelt; produktiver Read-Shape laeuft zentral ueber `apps/web/src/features/community/groupSurface.ts`.
- Neue explizite Read-Route: `GET /api/community/groups` (stabile Read-Response + 400 bei invaliden Parametern + 503 bei Source-Unavailable).
- Kein Demo-/Seed-Fallback fuer Dossier-Linking im Group-Surface (`/dossier/demo` entfernt); fehlende Verknuepfungen bleiben explizit als Empty-State sichtbar.
- Read-only Guardrail bleibt strikt: keine Publish-/Approval-/Mutation-Pfade in Resolver oder Route.

Community Deep-Link Contracts (PR-0040 / 2026-03-19):
- Kanonischer Community-Deep-Link-Contract ist zentralisiert in `apps/web/src/features/community/deepLinkContract.ts`.
- Kanonische Parameter: `group`, `type`, `scope`, `topicKey`, `topicLabel`, `dossierId`, `dossierTitle`, `regionLabel`, `reasonLabel`, `communityLabel`.
- Legacy-Aliasse bleiben lesbar und werden explizit normalisiert:
  `topic -> topicKey`, `dossier -> dossierId`, `region -> regionLabel`, `reason -> reasonLabel`, `communityKey -> group`.
- Gleiche Contract-Validierung/-Normalisierung in Resolver/Route/Page:
  `apps/web/src/features/community/groupSurface.ts`,
  `apps/web/src/app/api/community/groups/route.ts`,
  `apps/web/src/app/community/page.tsx`.
- Outgoing Links sind kanonisiert (kein Alias-Mix mehr) in:
  `apps/web/src/features/community/groupSurface.ts` (Discovery-Hrefs),
  `apps/web/src/app/account/AccountClient.tsx` (Inbox-/Match-Deep-Links).
- Stabile Invalid-Mappings aktiv: `invalid_group_type`, `invalid_group_scope`, `invalid_group_context`;
  API liefert `400`, Page zeigt expliziten Invalid-State; kein Demo-/Static-Fallback.
- Read-only Guardrail unveraendert: keine Mutation, kein Publish-/Approval-Bypass.

Community E2E Acceptance (PR-0041 / 2026-03-19):
- Community Read-Stack ist als Acceptance-Baseline abgesichert fuer:
  Canonical Group-Links, Discovery (groups/empty), Source-Unavailable, Invalid Params, Legacy-Alias-Lesbarkeit und Read-only Boundary.
- Mobile/Desktop-Relevanz im Page-Layer ist explizit getestet (responsive Grid-States fuer Discovery/Group):
  `md:grid-cols-2`, `lg:grid-cols-[1.25fr_1fr]`, `sm:grid-cols-2`.
- Kein Fallback-/Bypass-Rueckfall:
  kein Demo-/Static-Dataset, keine Mutation/Write-Pfade, kein Publish-/Approval-Bypass.
- Evidenz:
  `apps/web/tests/community-deep-links.contract.test.ts`,
  `apps/web/tests/community-groups.resolver.test.ts`,
  `apps/web/tests/community-groups.route.test.ts`,
  `apps/web/tests/community-page.states.test.ts`,
  `apps/web/tests/community-groups.no-demo-fallback.test.ts`,
  `apps/web/tests/community-readonly-boundary.test.ts`.

Feed/Anlassraum Picker in `/create` (PR-FEED-ANLASS-02 / 2026-03-19):
- Manueller produktiver Kontext-Picker ist in `/create` verdrahtet (kein Demo-/Static-Fallback):
  `apps/web/src/features/create/contextPicker.ts` + `GET /api/create/context`.
- Picker-UI in `apps/web/src/app/create/CreateClient.tsx` zeigt produktive Kontextliste (source/ai), explizite Auswahl/Entfernung und stabile Empty-/Unavailable-/Stale-Selection-Hinweise.
- Auswahl bleibt read-only: reines Client-State-Update, keine Save/Finalize-Trigger, keine Mutation nur durch Selektion.
- Kontext-Propagation ist explizit:
  `selectedAnlassraumId` -> `AnalyzeWorkspace` -> Analyze/Save/Finalize-Payload (`anlassraumId`).
- Save/Finalize/Analyze validieren `anlassraumId` stabil (`invalid_anlassraum_id`), ohne Auto-Linking, Auto-Publish oder Auto-Approval.
- Evidenz:
  `apps/web/src/app/api/create/context/route.ts`,
  `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`,
  `apps/web/src/app/api/contributions/save/route.ts`,
  `apps/web/src/app/api/contributions/finalize/route.ts`,
  `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts`,
  `apps/web/tests/create-context-picker.service.test.ts`,
  `apps/web/tests/create-context-picker.route.test.ts`,
  `apps/web/tests/create-mode.page.test.ts`,
  `apps/web/tests/create-mode.save.route.test.ts`,
  `apps/web/tests/create-mode.finalize.route.test.ts`,
  `apps/web/tests/create-mode.analyze-parse.test.ts`.

Feed/Anlassraum Cluster-Job (PR-FEED-ANLASS-03 / 2026-03-19):
- Dedizierter produktiver Cluster-Worker ist als schmaler Domain-Service aktiv:
  `features/feeds/clusterJob.ts`.
- Cluster-Outputs sind explizit/persistent in einer dedizierten Collection:
  `feed_anlassraum_cluster_candidates` via `features/feeds/db.ts`.
- Runner ist API-first und manuell ausfuehrbar:
  `POST /api/admin/feeds/cluster/run`
  (`apps/web/src/app/api/admin/feeds/cluster/run/route.ts`).
- Result-Mapping ist explizit:
  `success|empty` + `created|updated|unchanged`,
  sowie stabile Fehlercodes (`feed_anlassraum_cluster_source_unavailable`, `feed_anlassraum_cluster_job_failed`).
- Idempotenz bleibt explizit: Reruns erzeugen keine unkontrollierten Duplikate (Fingerprint + `clusterKey` Unique-Index).
- Guardrails bleiben unveraendert:
  kein Auto-Publish, kein Auto-Approval, keine Live-/Round-Erstellung, keine Governance-Aufweichung.
- Evidenz:
  `apps/web/tests/feed-cluster-job.service.test.ts`,
  `apps/web/tests/feed-cluster-job.route.test.ts`.

### GOV-EVENT-01 — Event-/Sitzungsmodell
Status: **In Progress (Core baseline / 2026-03-19)**

Evidenz:
- `apps/web/src/app/api/events/route.ts` (Event kann Anlassraum referenzieren/erzeugen)
- `docs/event-and-session-model.md`

### GOV-EVENT-02 — QR -> Fragen -> Protokoll -> Dossier -> Runde
Status: **Done (Functional closure / 2026-03-19)**

Evidenz:
- `apps/web/src/app/api/qr/sets/route.ts` (Anlassraum-/Dossier-/Round-Link)
- `apps/web/src/app/api/qr/sets/[code]/route.ts`
- `apps/web/src/app/api/qr/resolve/route.ts`
- `apps/web/src/app/api/qr/sets/[code]/protocol/route.ts`
- `apps/web/src/app/api/qr/sets/summary/route.ts`
- `features/dossier/protocolUpsert.ts` (protocol -> dossier-upsert contracts inkl. manual list/read/apply/reject, additive apply + audit trail)
- `features/topicRound/seedContract.ts` (protocol/anlassraum/dossier -> round-seed contracts inkl. manual handoff/reject in non-public round drafts)
- `apps/web/src/app/api/events/route.ts` (Event follow-up audit chain to QR/protocol/contracts)
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/apply/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/reject/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/legacy/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/backfill/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/handoff/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/reject/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/legacy/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/backfill/route.ts`
- `apps/web/tests/gov-event-02.contracts.test.ts` (E2E/Integration: protocol->contract->apply/handoff + forbidden access + legacy-policy checks)
- `apps/web/tests/gov-event-02.routes.test.ts` (Route-Acceptance: list/read/apply/reject/handoff/backfill + error/status mapping)
- `apps/web/src/app/api/admin/governance/contractsError.ts` (stabile policy-error -> HTTP-status mapping)

Manual-first Guardrails:
- Kein Auto-Publish, kein Auto-Approval.
- Protokollmaterial erzeugt reviewbare Dossier-Upsert-Contracts; Apply bleibt explizit/manuell und additiv (kein destruktives Overwrite).
- Round-Seed bleibt Contract-basiert; Handoff erzeugt nur non-public Round-Draft (`manual_review_required`), keine automatische Live-Rundenerstellung.

Legacy/Incomplete Contract Policy (Hardening 2026-03-19):
- Fehlendes Ziel-Dossier fuehrt bei Apply explizit zu `contract_missing_target_dossier` (kein implizites Dossier-Anlegen, Contract bleibt reviewbar).
- Fehlendes `anlassraumId` ist fuer nicht-admin Governance-Akteure explizit gesperrt (`actor_scope_requires_anlassraum`); Admin bleibt kontrollierter Fallback.
- Community-Rollen bleiben fuer Apply/Handoff strikt gesperrt (`actor_scope_forbidden`).

Legacy Backfill Strategy (Abschluss 2026-03-19):
- Detection (admin-only): `GET /api/admin/governance/dossier-upsert-contracts/legacy` und `GET /api/admin/governance/round-seed-contracts/legacy`.
- Remediation (admin-only): `POST .../dossier-upsert-contracts/[contractId]/backfill` (anlassraum/dossier-linkage) und `POST .../round-seed-contracts/[contractId]/backfill` (anlassraum/dossier-linkage + readiness refresh).
- Fallback ohne Backfill bleibt explizit/manual: admin kann Dossier-Apply mit `targetDossierId` manuell ausfuehren; keine automatische Oeffentlich-Publikation.
- Nicht automatisiert: Bulk-Backfill bleibt bewusst manuell/protokolliert pro Contract (keine Silent-Migration im Produktfluss).

### GOV-AI-01 — Freistart + verpflichtende Qualitaetsschicht
Scope:
- `/create` als Freistart ohne primaere Moduswahl `manual/source/ai`
- Analyse-/Pruefhilfen-/Claim-/Frage-Vorschlaege immer aktiv
- Rueckfragen bei duennem Input statt stiller Fehlzuordnung
- no auto publish / review-first / approval-first / manual-first bleibt verpflichtend

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-02 — Graph-Matching + CTA-Layer
Scope:
- Match gegen Claim-/Anlassraum-/Dossier-/Perspektivkontext
- Match-Staerken: `high`, `medium`, `none`
- CTA-Layer: `zustimmen`, `anders_sehen`, `dossier_oeffnen`, `anlassraum_oeffnen`, `perspektive_anhaengen`, `trotzdem_neu_anlegen`
- kein Silent-Merge, keine Ursprungsausloeschung

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-03 — Anlassraum als Arbeitsort
Scope:
- Erfassung direkt im Anlassraum
- Analyse im Anlassraum
- CTA-Momente in bestehende Kontexte
- sauberer Handoff Anlassraum <-> Dossier

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-04 — Canonical Multi-Orchestration Flow
Scope:
- kanonischen Hauptfluss definieren:
  `Freistart -> Intake -> Pruef/Qualitaet -> Graph-Matching -> CTA/Routing -> Anlassraum/Dossier/Debatten-Setup/Beteiligung -> Output/API/Audit`
- Unter-Orchestrierungen trennen:
  `intake`, `pruefung`, `agenda_fragen`, `dossier`, `beteiligung_abstimmung`
- gemeinsame Contracts / Events / Auditierbarkeit / Provenance

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-05 — Prompt Contracts + Typed Outputs
Scope:
- Canonical Prompt Contracts fuer:
  `intake`, `pruefung`, `agenda_fragen`, `dossier`, `beteiligung_abstimmung`, `graph_matching_cta`
- pro Orchestrierung stabile Soll-Ausgaben (typed output contracts)
- Confidence-/Unsicherheitsfelder verpflichtend
- keine ungekennzeichneten Freitext-Blackboxes in kritischen Uebergaengen
- spaeter in versionierte `zod`-/`ts`-Schemas ueberfuehren
- keine kritischen Orchestrierungsuebergaenge nur mit losem Freitext
- versionierte Output-Contracts fuer Replay, Audit und Providerwechsel
- typed Contracts gelten als Vorstufe fuer stabile Orchestrator-Adapter

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-06 — Language-Aware Core + Cross-Lingual Matching
Scope:
- `uiLocale != contentLanguage != sourceLanguage` sauber trennen
- Originaltext als canonical source behalten
- Uebersetzungen als abgeleitete Darstellung markieren
- Cross-lingual Matching verpflichtend
- Rueckfragen in Nutzersprache + Fragequalitaet pro Sprache

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-07 — Meta-Layer / Audit / Provenance / Layman Explanation
Scope:
- verpflichtender Meta-Layer ueber alle Orchestrierungsstufen
- provenance-by-default + audit trail pro Schritt
- trust/risk flags + bias/ethics checks
- layman explanation in produktiver Ausspielung
- Human-in-the-Loop fuer high-impact Faelle

Status: **Open (planned / canonical / 2026-03-20)**

Priorisierung (2026-03-20):
- Ohne GOV-AI-01 bleibt `/create` fachlich widerspruechlich (legacy mode split vs. Freistart-Zielbild).
- Ohne GOV-AI-02 bleibt der Graph-Moment ohne verbindliche CTA-Entscheidung ungenutzt.
- Ohne GOV-AI-05 fehlen stabile Prompt-/Output-Vertraege fuer reproduzierbare Orchestrierung.
- Ohne GOV-AI-06 bleibt Sprachkonsistenz und Cross-lingual Matching unzuverlaessig.
- Ohne GOV-AI-07 bleibt Governance- und Audit-Transparenz unvollstaendig.

Betroffene State-Machines (Programm-Ebene):
- Create-Intake-Flow (Freistart -> Analysepflicht -> Match/CTA -> Handoff)
- Anlassraum-Lifecycle (`draft -> curated -> reviewed -> approved -> active -> archived`)
- Dossier-Upsert-Contract-Lifecycle (`pending_review -> partially_applied/applied -> rejected`)
- Round-Seed-Contract-Lifecycle (`review_required -> draft_created/rejected`)
- Output-Prep-Lifecycle (`draft -> queued -> review -> ready -> published/discarded`)

Weiterhin aktive Publish-Gates:
- no auto publish
- review-first
- approval-first
- manual-first
- scoped governance roles + publish-gate-pruefung

Bewusst noch nicht automatisiert:
- kein Auto-Publish aus Match/CTA
- kein Silent-Merge bei Match
- kein Auto-Handoff in Live-Runde/Public-Dossier
- keine Bulk-Silent-Migration im Produktfluss
- keine Stage-2/Stage-3 Self-Host-/Souveraenitaetsvorziehung in aktive Kern-Runs

### GOV-SIGNAL-01 — Signals
Muss enthalten:
- Signaltypen: `interest`, `support`, `concern`, `priority`
- Aggregationslogik
- Decay
- Trigger-Schwellen
- Konflikt-Erkennung
- Radar-Ausgabe

### GOV-FUNDING-01 — Signals + Funding
Funding-Typen:
- `mission`
- `project`
- `resource`
- `hybrid`

Pflichtlogiken:
- Funding Intent vor Funding
- Readiness Score
- Matching Funds
- Impact Tracking
- Plattformgebuehren transparent
- max. Anteil einzelner Akteure begrenzen

### GOV-FUNDING-02 — Ressourcen / Sachleistungen
- Material
- Arbeitsleistung
- Kontakte
- Sachspenden

### GOV-FUNDING-03 — Impact / Refunding
- Status / Fortschritt
- Ergebnis / Foto / Nachweis
- Folgeprojekt / Wartung / Erweiterung moeglich

### GOV-PRICING-01 — Hybrid-Pricing
- Basispreis
- Anlassraum-Komponente
- optionale Teilnehmer-Komponente
- optionale Outcome-/Report-Komponente
- Caps
- Add-ons

### GOV-PRICING-02 — Admin Pricing Control
Admin kann je Entity:
- individuelle Preisprofile setzen
- Rabatt bis zu 30 % vergeben
- Rabatt-Scope definieren
- zeitliche Begrenzung setzen
- Approval fuer hohe Rabatte erzwingen

### GOV-JOURNALISM-01 bis 04
Journalismus basiert auf Anlassraeumen, `source_anchor`, Truth Guardrails und offenen Dossiers.
Nicht losgeloest vom Governance-Kern umsetzen.

### GOV-MUNI-01 bis 06
Verwaltung / Kommune operativ und executive-faehig machen.
Nicht zuerst Einwohner-Billing priorisieren, sondern:
- Radar
- Anlassraeume
- Verwaltungsmodus
- Buergermeister-Dashboard
- Prozessstatus
- Dezernate

### GOV-ORG-01 / 02
- dossierbasierte Organisationsidentitaet
- offizieller Release-/Trust-Modus

### GOV-CIVIC-01 / 02 / 03
- Wirkungsverlauf fuer Buergerprofile
- Initiative-Lifecycle
- Impact-/Unterstuetzungslogik

## Pricing- / Produktleitlinien

Die alte pauschale Einwohnerlogik wird nicht als Hauptpfad fortgeschrieben.
Neues Zielmodell:

- **Open Civic / Radar**: frei oder niedrigschwellig
- **Basis-Governance**: Basispreis
- **aktive Anlassraeume**: belastungs-/komplexitaetsorientiert
- **aktive Teilnehmende**: optionale variable Komponente
- **Add-ons**: Event, Assistenz, Reports, Managed Governance

Rabatt:
- bis zu 30 %
- nicht pauschal auf alles
- insbesondere fuer Pilot oder Jahreszahlung
- ab hoher Rabattstufe Freigabe + Audit

## Erledigt (bestehend)

### Seit 2026-03-04

| Task | Status | Evidenz |
| --- | --- | --- |
| Admin Graph Navigation vereinheitlicht | Done | `apps/web/src/components/admin/GraphAdminNav.tsx`, `apps/web/src/app/admin/graph/*/page.tsx` |
| Graph-Health Fehlerdetail + Impact-Link | Done | `apps/web/src/app/api/admin/graph/health/route.ts`, `apps/web/src/app/admin/graph/health/page.tsx`, `apps/web/src/app/admin/graph/impact/page.tsx` |
| Phase 0 Startpaket | Done | `docs/START_HERE.md`, `docs/ARCHITECTURE.md`, `.env.example`, `scripts/dev/*`, `docker-compose.yml`, `compose/prod.yml` |
| CI fuer Compose/Prod aktualisiert | Done | `.github/workflows/e150-ci.yml` |
| Web CI staerker | Done | `.github/workflows/web-ci.yml` |
| Rollback: RateLimit per Env abschaltbar | Done | `apps/web/src/utils/rateLimitHelpers.ts` |
| Rollback: Findings ohne Effective-Filter | Done | `/api/dossiers/*`, `features/dossier/db.ts` |
| Rollback: Hash-Chain Verify deaktivierbar | Done | `/api/admin/dossiers/[id]/verify-revisions` |
| Pending Commit abgeschlossen | Done | Landing/Admin/Create/Material/Telemetry + Pricing/SEO/Region |
| DecisionArchitecture v2.0 Download-Asset wiederhergestellt | Done | `apps/web/public/docs/DecisionArchitecture_v2_0.docx` |
| Create-Route + AdminErrorPanel in Git aufgenommen | Done | `apps/web/src/app/create/page.tsx`, `apps/web/src/components/admin/AdminErrorPanel.tsx` |
| Landing-Input wieder oben zentriert | Done | `apps/web/src/app/start/LandingStart.tsx`, `features/landing/LandingAssistant.tsx` |
| MaterialHub Hash-Sprung abgesichert | Done | `apps/web/src/components/dossier/MaterialHub.tsx` |
| Admin-Fehleranzeigen vereinheitlicht | Done | `apps/web/src/components/admin/AdminErrorPanel.tsx`, `apps/web/src/app/admin/*` |

### Seit 2026-02-19

| Task | Status | Evidenz |
| --- | --- | --- |
| Contributions/New Analyse-Flow auf Auto-Flow umgestellt | Done | `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`, `apps/web/src/app/contributions/new/ContributionNewClient.tsx` |
| Dossier-Header Premium/Mobile/No-Duplicates | Done | `apps/web/src/components/dossier/InstitutionalHeader.tsx`, `apps/web/src/components/dossier/DossierViewer.tsx` |
| Demo/Screenshot Studio | Done | `apps/web/src/app/demo/*`, `features/report/data/demoReports`, `features/votes/demoVotes.ts`, `features/mandate/demoMandate.ts` |
| Demo Factcheck (KI/Manuell) + Redaktion-Feedback + Admin-Review | Done | `apps/web/src/app/demo/factcheck/page.tsx`, `apps/web/src/app/api/editorial/feedback/route.ts`, `apps/web/src/app/admin/factcheck/page.tsx` |
| Region Pitch + Landing Fallback + Feed-Region-Filter | Done | `apps/web/src/app/admin/pitch/page.tsx`, `apps/web/src/app/region/[codeOrSlug]/page.tsx`, `apps/web/src/app/api/feeds/pull/route.ts` |
| Pricing/Vormerken Domain konsolidiert | Done | `features/pricing/domain/*`, `features/pricing/usecases/createPreorderLead.ts`, `features/pricing/server/leadsRepo.ts` |
| Pricing-/Vormerken-UI vereinheitlicht | Done | `apps/web/src/app/pricing/page.tsx`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `apps/web/src/app/vormerken/page.tsx` |
| SEO-Regionen & Pillar-Seiten + Sitemap | Done | `features/seo/*`, `apps/web/src/app/deutschland/*`, `apps/web/src/app/sitemap.ts` |
| Locale-Detection zentralisiert | Done | `apps/web/src/lib/i18n/detectLocale.ts`, `apps/web/src/app/layout.tsx` |
| Typecheck + Lint wieder gruen | Done | `pnpm -w -r typecheck`, `pnpm -w -r lint` |
| Vercel Build-Fail `node:crypto` in RateLimit behoben | Done | `apps/web/src/utils/rateLimit.ts` |

## Strategische Erweiterung – Dossier-Normierung (Legitimation 2.0)

| Task | Beschreibung | Status |
|------|--------------|--------|
| DS-01 | `features/dossier/schemas.ts` mit `DossierSchema` Wrapper erstellen | Done |
| DS-02 | Adapter `buildDossierFromAnalyze()` implementieren | Done |
| DS-03 | Whitepaper-Hook im E150-Docs verankern | Done |
| DS-04 | Optional: Route `/dossier/[id]` pruefen | Done |

## Arbeitsregel fuer jeden Run

1. `docs/E150/OpenTasks.md` zuerst lesen.
2. Genau ein aktives Paket umsetzen (max 6 Aufgaben im Drift).
3. `docs/E150/Part15.md` PR-Log aktualisieren.
4. `docs/E150/OpenTasks.md` Status / Naechster Run aktualisieren.
5. `Changes / Verification / Next Steps` ausgeben.
6. Immer angeben:
   - welche State Machines eingefuehrt wurden
   - welche Publish Gates aktiv sind
   - welche Teile bewusst noch nicht automatisiert wurden
7. Hard-last-Regel beachten: Stage-2 / Stage-3 duerfen nicht in aktive Runs gezogen werden, solange Kernorchestrierungen, Produktbaseline und Live-Betrieb nicht abgeschlossen sind.

## Erste Erfolgsdefinition

Noch nicht 11.000 Gemeinden.

Sondern:
- 1 Entity
- 1 Anlassraum
- Review
- Approval
- Publish
- Signals
- Funding Intent
- optional Funding

## Spaeter / bewusst hart nachgelagert (immer letzter Agenda-Punkt)

Dieser Block ist dauerhaft nachgelagert.
Er darf nicht vorgezogen werden.
Er wird erst bearbeitet, wenn:
- die Orchestrierungen fachlich und technisch beruecksichtigt sind
- der operative Kern produktiv laeuft
- die aktiven Kern-PRs abgeschlossen sind
- der Produktbetrieb stabil ist
- Evaluations-, Audit- und Governance-Baselines im Live-Betrieb vorliegen

Er ist ausdruecklich NICHT Teil der aktuellen Priorisierung.

#### Freigabekriterien fuer Stage-2 / Stage-3
Diese Bloecke duerfen erst auf aktiv gesetzt werden, wenn:
- produktiver Kernbetrieb ueber laengeren Zeitraum stabil ist
- belastbare Eval-Suiten fuer alle Kern-Orchestrierungen vorliegen
- Audit-/Review-/Publish-Pfade live verifiziert sind
- Kostenbild je Orchestrierung bekannt ist
- Fehlerraten / Fallback-Raten / Human-Review-Raten bekannt sind
- i18n / cross-lingual baseline im Produktbetrieb validiert ist

### STAGE-2 — Teilweise Souveraenisierung / Self-Host Expansion
Status: Parked (hard-last)
Naechster Run: erst nach vollstaendigem Kernbetrieb
Regel:
- immer letzter umsetzbarer Block nach Abschluss aller Kern-PRs
- nicht in aktive Sprint-/PR-Planung ziehen
- nur nach expliziter Re-Priorisierung durch den User

Inhalt:
- Self-host/private-host fuer standardisierbare Orchester pruefen
- lokale/open-weight Modelle fuer Intake, Matching, Moderation, Embeddings
- Exit-Vorbereitung aus punktueller Provider-Abhaengigkeit
- nur auf Basis realer Produktionsdaten, Eval-Suiten und Kostenbilder

### STAGE-3 — Weitgehende Provider-Unabhaengigkeit
Status: Parked (hard-last)
Naechster Run: erst nach Stage-2 und stabilem Produktbetrieb
Regel:
- absolut letzter Agenda-Punkt
- keine Vorwegnahme in laufenden Architektur-/Produkt-PRs
- nur wenn System, Governance und Betrieb bereits tragfaehig sind

Inhalt:
- weitere Internalisierung ausgewaehlter Orchester
- Frontier-Abhaengigkeit auf Ausnahmefaelle reduzieren
- eigene Modell-/Inference-Strategie nur nach nachgewiesenem Bedarf
- kein Ziel `eigenes Frontier-Modell um jeden Preis`
