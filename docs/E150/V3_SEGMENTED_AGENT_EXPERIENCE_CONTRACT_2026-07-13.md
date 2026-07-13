# V3 Segmented Agent Experience Contract 2026-07-13

## Scope

- Task: `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
- Cluster: B2C Personal Voxy / B2B workbench / B2G authority cockpit
- Branch: `pr/v3-segmented-agent-experience-contract-01`
- Typ: controlled contract slice / kein Runtime-Start / keine Profilpersistenz / keine externe Benachrichtigung

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `.codex/agents/registry.json`
- `.codex/agents/bootstrap.json`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_AGENTIC_RUNTIME_MANIFEST_2026-07-13.md`
- `docs/E150/V3_SEGMENTED_AGENT_EXPERIENCE_AND_DAILY_CIVIC_IMPULSES_2026-07-13.md`
- `docs/E150/V3_AGENT_REGISTRY_RUNNER_BOOTSTRAP_2026-07-13.md`
- `docs/E150/V3_PREVIEW_SMOKE_READINESS_PLAN_2026-07-13.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md`

## Runner-Hinweis

- `.codex/prompts/lean-continuous-slice-runner.md` referenziert weiterhin `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md`.
- Diese Datei fehlt im aktuellen Repo-Stand.
- Der Slice stuetzt sich deshalb auf die vorhandene SSOT: `AGENTS.md`, `OpenTasks.md`, Manifest, Registry, Bootstrap und die kanonische Segment-Entscheidung.

## Gewaehlter Cluster

- Selected cluster: `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
- Selected task IDs: `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
- Completed task IDs: `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
- Primary role: `governance_compliance`
- Supporting roles: `personal_voxy`, `dossier_briefing`

Warum dieser Cluster:

- Er ist nach dem Bootstrap der naechste explizit `codex_ready` Agentic-Folgepfad.
- Er entblockt Personal-Voxy-/Consent-Folgearbeit, ohne Runtime, Provider, Secrets oder Profilpersistenz zu aktivieren.
- Die Segmenttrennung B2C / B2B / B2G ist die no-regret Produktwahrheit, bevor ein Safe-Trace- oder Consent-Folgecluster belastbar gezogen wird.

Warum andere Tasks nicht gezogen wurden:

- `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01` bleibt zwar `codex_ready`, ueberlappt aber stark bei `agenticRuntime`-Contracts, denselben OpenTasks-Zeilen, denselben Operator-Surfaces und derselben Evidence-Familie.
- `blocked`-, `needs_decision`-, docs-only- und maintenance-only-Tasks wurden nicht gezogen.

## Umgesetzte Artefakte

### 1. Typed Segment- und Surface-Contract

Neu:

- `apps/web/src/features/agenticRuntime/segmentedAgentExperienceContract.ts`

Enthaelt:

- typed Segmente:
  - `b2c`
  - `b2b`
  - `b2g`
- typed Personal-Voxy-Modi:
  - `passive`
  - `relevant_only`
  - `periodic_overview`
  - `active_companion`
  - `topic_watch`
- typed Surface-Matrix fuer:
  - `/account`
  - `/account/organization`
  - `/account/organization/dashboard`
  - `/admin/access`
  - `/admin/entitlements`
  - `/admin/system`
  - `/create`
  - `/runden`
  - `/dossier/[id]`
- institutionelle Segmentauflosung:
  - oeffentliche Verwaltung / Kommune / Behorde / Schule => `b2g`
  - Vereins-, Medien-, NGO-, Agentur- und Teamkontexte => `b2b`
- Guardrails:
  - Personal Voxy bleibt consented und optional
  - B2B/B2G erzwingen keinen persoenlichen Companion
  - guided assistance und benannter menschlicher Kontakt bleiben optional
  - public reading remains free
  - personalization cannot hide material facts, strong counterarguments or source limitations
  - kein politisches Profiling
  - keine Premium-Vote-Gewichtung
  - kein Voting fuer Nutzer
  - keine externe Behoerdenbenachrichtigung
  - keine automatische Veroeffentlichung

### 2. Read-only Surface-Hinweise auf bestehenden Pfaden

Geaendert:

- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/organization/page.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/src/app/admin/access/page.tsx`
- `apps/web/src/app/admin/entitlements/page.tsx`
- `apps/web/src/app/admin/system/page.tsx`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`

Sichtbar gemacht:

- `/account`
  - Personal Voxy bleibt persoenlich, optional und consent-basiert
  - Organisations- und Behoerdenpfade bleiben getrennt
- `/account/organization`
  - institutioneller Einstieg fuer B2B/B2G mit optionaler gefuehrter Hilfe oder benanntem Kontakt
  - kein persoenlicher Companion-Zwang
- `/account/organization/dashboard`
  - B2B-Workbench bzw. B2G-Cockpit werden vom persoenlichen Companion getrennt beschrieben
  - Betreiberkontext bleibt ebenfalls institutionell
- `/admin/access`, `/admin/entitlements`, `/admin/system`
  - Operator-Flaechen steuern institutionelle Workbenches/Cockpits statt persoenlicher Companion-Pfade
- `/create`
  - gemeinsamer, segmentneutraler Einstieg ohne Companion-Zwang
- `/runden`, `/dossier/[id]`
  - oeffentliche Lesbarkeit bleibt frei
  - Personalisierung versteckt keine starken Gegenargumente und keine Quellen-/Evidenzgrenzen

### 3. OpenTasks-Sync

Geaendert:

- `docs/E150/OpenTasks.md`

Aktualisiert:

- `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01` auf `done`
- `Next codex_ready tasks` priorisiert jetzt `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01` als naechsten Controlled-Agentic-Folgepfad

## Validierte Rollen und Grenzen

Validierte Agent-Rollen:

- `personal_voxy`
- `dossier_briefing`
- `governance_compliance`

Repo-seitig gepruefte Segmentgrenzen:

- B2C darf Personal Voxy als consented dialogue/relevance companion bekommen.
- B2B bleibt Team-/Topic-Workbench.
- B2G bleibt Jurisdiktions-/Debattenstand-/Response-Cockpit.
- B2B und B2G werden nicht in eine persoenliche Dialog-Agent-Erfahrung gezwungen.
- Public Debattenstand bleibt frei lesbar.
- Personalisierung darf keine wesentlichen Fakten, starken Gegenargumente oder Quellenlimits verstecken.

## Tests und exakte Ergebnisse

Pflicht:

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/segmented-agent-experience.contract.test.ts tests/admin-system-agentic-runtime-readiness.page.test.tsx tests/account-organization-page.contract.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/runden-public-sharing-guide.contract.test.tsx tests/dashboard-role-contracts.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Ergebnis:

- `git diff --check`
  - gruen
- fokussierte Vitest-Suite
  - `8` Dateien, `22/22` Tests gruen
- `pnpm -C apps/web run lint`
  - gruen
- `pnpm -C apps/web run build`
  - gruen
- `pnpm -C apps/web run typecheck`
  - gruen

## Risiken / offene Entscheidungen

- Dies ist bewusst kein Runtime-, Provider-, Consent-Persistenz- oder Notification-Slice.
- `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01` wurde nicht im selben Lauf gezogen:
  - starker Overlap bei `agenticRuntime`-Contracts
  - derselbe OpenTasks-/Evidence-Block
  - dieselben Operator- und Public-Surfaces
- `V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01` bleibt blocked, aber jetzt fachlich entblockbar nach Merge dieses Segment-Contracts.
- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` bleibt `needs_decision`.

## Naechster moeglicher Cluster nach Merge

- `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01`

Merge-Grenze:

- erst diesen Segment-Contract mergen
- danach Safe-Trace-Contract auf neuem Branch ziehen
- erst danach erneut pruefen, ob ein weiterer Agentic-Cluster noch konfliktarm anschliessbar ist
