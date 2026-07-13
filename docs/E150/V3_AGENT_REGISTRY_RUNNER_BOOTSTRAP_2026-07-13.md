# V3 Agent Registry Runner Bootstrap 2026-07-13

## Scope

- Task: `V3-AGENT-REGISTRY-RUNNER-BOOTSTRAP-01`
- Cluster: Agent registry / runner bootstrap / validation
- Branch: `pr/v3-agent-registry-runner-bootstrap-01`
- Typ: controlled bootstrap / kein Runtime-Start / keine Parallel-Agenten

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `.codex/agents/registry.json`
- `.codex/agents/bootstrap.json`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_AGENTIC_RUNTIME_MANIFEST_2026-07-13.md`
- `docs/E150/V3_SEGMENTED_AGENT_EXPERIENCE_AND_DAILY_CIVIC_IMPULSES_2026-07-13.md`
- `docs/E150/V3_PREVIEW_SMOKE_READINESS_PLAN_2026-07-13.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md`
- `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md`

## Runner-Hinweis

- `.codex/prompts/lean-continuous-slice-runner.md` referenziert zusaetzlich `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md`.
- Diese Datei ist im aktuellen Repo-Stand nicht vorhanden.
- Der Slice stuetzt sich deshalb auf die vorhandene Repo-SSOT: `AGENTS.md`, `OpenTasks.md`, Manifest, Registry und Bootstrap.

## Ziel

Das Manifest fuer die kontrollierte agentische Runtime repo-seitig validieren und in den bestehenden Runner-/OpenTasks-Prozess integrieren, ohne irgendeine echte Agent-Runtime, Parallelprozesse, Provider, Secrets, Kosten oder externe Benachrichtigungen zu aktivieren.

## Umgesetzte Artefakte

### 1. Typed Registry- und Bootstrap-Contracts

Neu:

- `apps/web/src/features/agenticRuntime/agentRegistryBootstrapContract.ts`

Enthaelt:

- typed role ids fuer:
  - `personal_voxy`
  - `intake_format`
  - `research_source`
  - `claims_factcheck`
  - `participation_moderation`
  - `dossier_briefing`
  - `governance_compliance`
- Schema-Validierung fuer:
  - `.codex/agents/registry.json`
  - `.codex/agents/bootstrap.json`
- Read-only Repo-Loader fuer Registry, Bootstrap und `OpenTasks.md`
- Deterministischer `resolveTaskToAgentRoles(...)`
- Guardrails:
  - `enforceDeniedActions(...)`
  - `enforceSharedRules(...)`
- Segment- und Intake-Grenzen fuer:
  - B2C / B2B / B2G
  - Personal-Voxy-Modi
  - optionale Daily Civic Impulses
  - Screenshot-/Photo-Intake: Beobachtung != Interpretation != Hypothese != Fakt

### 2. Read-only Bootstrap-Readiness im bestehenden Operator-Systembereich

Geaendert:

- `apps/web/src/app/admin/system/page.tsx`

Die Seite `/admin/system` zeigt jetzt additiv:

- Registry Bootstrap Readiness
- validierte Rollenanzahl
- materialisierte Follow-up-Tasks
- Shared-Rules- und Denied-Action-Zaehler
- Segmentgrenzen B2C / B2B / B2G
- Optionalitaet der Daily Civic Impulses
- Screenshot-Intake-Grenzen
- naechste `codex_ready` Agentic-Folgepfade

Wichtig:

- keine Runtime-Aktivierung
- keine Parallel-Agenten
- keine neue Queue
- keine neue Graph-/Dossier-/Review-Queue-Architektur

### 3. OpenTasks-Materialisierung

Geaendert:

- `docs/E150/OpenTasks.md`

Materialisiert:

- `V3-AGENT-REGISTRY-RUNNER-BOOTSTRAP-01` als `done`
- alle Follow-up-Tasks aus `.codex/agents/bootstrap.json` mit deklarierten Status- und Dependency-Grenzen:
  - `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
  - `V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01`
  - `V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01`
  - `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01`
  - `V3-INTAKE-FORMAT-AGENT-E2E-01`
  - `V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01`
  - `V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01`
  - `V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01`
  - `V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01`
  - `V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01`
  - `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01`
  - `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01`
  - `V3-AGENTIC-CIVIC-E2E-PILOT-01`

Status- und Decision-Grenzen bleiben unveraendert gegenueber `.codex/agents/bootstrap.json`:

- `codex_ready`
- `blocked`
- `needs_decision`

## Validierte Rollen

- `personal_voxy`
- `intake_format`
- `research_source`
- `claims_factcheck`
- `participation_moderation`
- `dossier_briefing`
- `governance_compliance`

## Testbar gemachte Guardrails

### Shared Rules

- `canonicalArtifactsOnly`
- `reuseExistingV3Contracts`
- `noParallelStores`
- `noAutoPublish`
- `reviewFirst`
- `safeTraceOnly`
- `personalizationCannotHideMaterialFacts`
- `translationIsNotEvidence`
- `publicDebattenstandReadingRemainsFree`

### Beispielhafte deniedActions

- `personal_voxy`
  - `vote_for_user`
  - `political_label_targeting`
  - `hide_counterarguments`
  - `external_profile_sale`
  - `unapproved_notification`
- `intake_format`
  - `publish`
  - `final_factcheck`
  - `institutional_notification`
- `research_source`
  - `mark_unverified_source_authoritative`
  - `treat_translation_as_evidence`
  - `publish`
- `claims_factcheck`
  - `final_official_verdict_without_review`
  - `publish`
  - `delete_source`
- `participation_moderation`
  - `automatic_lawful_view_removal`
  - `manufacture_consensus`
  - `rank_only_by_engagement`
  - `publish`
- `dossier_briefing`
  - `publish`
  - `notify_external_recipient`
  - `activate_render_runtime`
- `governance_compliance`
  - `broaden_permissions`
  - `change_entitlement_without_approved_task`
  - `auto_publish`
  - `use_secret`
  - `contact_external_recipient`

## Segment- und Produktgrenzen

- B2C darf Personal Voxy als consented companion erhalten.
- B2B bleibt Team-/Topic-Workbench mit optionaler assistierter Hilfe oder benanntem Kontakt.
- B2G bleibt Jurisdictions-/Debattenstand-/Response-Cockpit mit optionaler assistierter Hilfe oder benanntem Kontakt.
- B2B und B2G duerfen nicht in einen Companion-Dialog gezwungen werden.
- Daily Civic Impulses bleiben optional und maximal drei pro Tag.
- `Meckerbox` ist nicht die kanonische Framing-Linie.
- Screenshot, Foto oder kurzer Text sind Beobachtungsinput, keine automatische Ursachen- oder Faktbehauptung.
- Public Debattenstand bleibt frei lesbar.
- Translation bleibt keine Evidenz.
- Review-first bleibt SSOT.

## Materialisierte Folgepfade mit Status

- `codex_ready`
  - `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
  - `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01`
- `blocked`
  - `V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01`
  - `V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01`
  - `V3-INTAKE-FORMAT-AGENT-E2E-01`
  - `V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01`
  - `V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01`
  - `V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01`
  - `V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01`
  - `V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01`
  - `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01`
  - `V3-AGENTIC-CIVIC-E2E-PILOT-01`
- `needs_decision`
  - `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01`

## Lokale Validierung

Pflicht:

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/agent-registry-bootstrap.contract.test.ts tests/admin-system-agentic-runtime-readiness.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Ergebnis:

- `git diff --check`
  - gruen
- `pnpm -C apps/web exec vitest run tests/agent-registry-bootstrap.contract.test.ts tests/admin-system-agentic-runtime-readiness.page.test.tsx`
  - `2` Dateien, `5/5` Tests gruen
- `pnpm -C apps/web run lint`
  - gruen
- `pnpm -C apps/web run build`
  - gruen
- `pnpm -C apps/web run typecheck`
  - scheitert weiterhin nur an der bekannten `.next/types/**/*.ts`-Drift mit `TS6053` auf fehlende generierte Dateien
  - nicht als Slice-Regression gewertet, weil fokussierte Tests, `lint` und `build` gruen sind

## Risiken / offene Entscheidungen

- Der Slice validiert nur die kontrollierte Registry-/Bootstrap-Schicht; er baut keine echte Agent-Runtime.
- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` bleibt bewusst `needs_decision`, weil Pricing-, Entitlement-, Recipient-Verification- und External-Notification-Grenzen unabhaengig freigegeben werden muessen.
- Personal-Voxy-Profil, Consent und taegliche Impulse bleiben blocked, bis der Segment-Contract explizit steht.
- Es wurde keine neue Parallelarchitektur fuer Dossier, Graph, Review-Queue oder Profile eingefuehrt.
