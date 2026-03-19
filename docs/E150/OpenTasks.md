# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.
Wenn andere Parts, alte Drift-Prompts oder Zwischen-Notizen abweichen, gewinnt diese Datei.

Stand: 2026-03-19

## Leitbild

Kernfluss des Systems:

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
| O | Governance / Journalismus / Kommune / Initiative / Organisation | In Progress (Wave 2 core in progress) | GOV-ANLASS-04 | Gemeinsames Zielmodell voll verankern |
| P | Anlassraum / Signals / Funding / Pricing | In Progress (Wave 2 core in progress) | GOV-ANLASS-04 | Manual-first Kernsystem produktiv verankern |

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
- **GOV-ANLASS-04** Feed-Review statt Feed-Leerlauf (**Queue ops deepened: filters/sort + bulk actions + legacy backfill path active**)
- **GOV-EVENT-01** Event-/Sitzungsmodell (**Event->Anlassraum linking active**)
- **GOV-EVENT-02** QR -> Fragen -> Protokoll -> Dossier -> Runde (**Functionally complete: service+route acceptance + legacy backfill strategy (manual-first)**)

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
| Create IA v2: dedizierte Mode-Module (`manual/source/ai`) statt nur Workspace-Parametrisierung | Open | PR-0035 | Aktuell produktiv: `apps/web/src/app/create/CreateClient.tsx` nutzt Mode-Switch auf bestehendem AnalyzeWorkspace |
| Runden Entry Surface auf produktive Quelle umstellen (statt Seed aus `features/topicRound/data.ts`) | Open | PR-0036 | Aktuell produktiv: `apps/web/src/app/runden/page.tsx` basiert auf `@features/topicRound` Seed-Repository |
| Backward-Compatibility finalisieren | Open | PR-0037 | Redirect-Matrix inkl. `/demo/runden`-Kommunikation |
| E2E-Abnahme fuer `/create` + `/runden` | Open | PR-0038 | dedizierte E2E-Cases fehlen |
| Community Group Surfaces entkoppeln | Open | PR-0039 | dedizierte Resolver/API |
| Community Deep-Link Contracts vereinheitlichen | Open | PR-0040 | Guardrails + Validierung |
| Community E2E absichern | Open | PR-0041 | mobile + desktop |
| Feed/Anlassraum Picker im `/create` anbinden | Open | PR-FEED-ANLASS-02 | echte Auswahl / Assignment-UI |
| Feed/Anlassraum Cluster-Job | Open | PR-FEED-ANLASS-03 | dedizierter Worker fehlt |
| Feed/Anlassraum Status-Transitions absichern | In Progress (Wave 2 deepening) | PR-FEED-ANLASS-04 | erweitert um Queue-Review-Aktionen + Bulk-Route + Queue-Triage: `features/feeds/reviewQueue.ts`, `apps/web/src/app/api/admin/feeds/drafts/bulk/route.ts`, `apps/web/src/app/api/admin/feeds/drafts/route.ts` |
| Feed/Anlassraum Publish-Flows ausbauen | In Progress (Wave 2 core) | PR-FEED-ANLASS-05 | Publish-Gate gehaertet in `features/anlassraum/governance.ts` (nicht mehr nur `sourceCount > 0`) |
| Feed/Anlassraum Backfill | In Progress (admin-safe path active) | PR-FEED-ANLASS-06 | Detection + Remediation fuer `vote_drafts` ohne `anlassraumId`: `GET /api/admin/feeds/drafts/legacy`, `POST /api/admin/feeds/drafts/[id]/backfill` |
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
- `apps/web/src/app/admin/feeds/drafts/page.tsx`
- `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`
- `apps/web/tests/feed-review.routes.test.ts`

Queue Deepening (2026-03-19):
- Queue-Filter erweitert: `status`, `reviewState`, `region`, `hasAnlassraum`, `weakSignal`, `q` (Titel/Summary/Quelle).
- Queue-Sortierung erweitert: `newest`, `oldest`, `review_recent`, `review_stale`, `priority_high`.
- Triage-Metadaten je Draft: `lastReviewAction*`, `queueMeta` (`priorityScore`, `priorityBucket`, `pendingHours`, `needsAnlassraumBackfill`, `reasons`).
- Bulk-Review (manual-first, nicht publizierend): `POST /api/admin/feeds/drafts/bulk` fuer `ignore`, `mark_as_weak_signal`, `attach_to_anlassraum`, `create_anlassraum_candidate`.
- Legacy-Backfill-Pfad (admin-safe): `GET /api/admin/feeds/drafts/legacy` + `POST /api/admin/feeds/drafts/[id]/backfill`.

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
