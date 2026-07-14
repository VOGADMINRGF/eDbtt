# V3 Agentic Civic E2E Pilot 2026-07-14

## Scope

- Task: `V3-AGENTIC-CIVIC-E2E-PILOT-01`
- Branch: `pr/v3-agentic-civic-e2e-pilot-01`
- Primary role: `dossier_briefing`
- Supporting roles: `personal_voxy`, `intake_format`, `research_source`, `claims_factcheck`, `participation_moderation`, `governance_compliance`
- Typ: controlled contract and surface slice / keine Runtime / keine externe Benachrichtigung / kein Auto-Publish

## Ziel

Den zusammenhängenden Agentic-Civic-Pilotpfad als review-first End-to-End-Contract und read-only Surface-Wahrheit integrieren, ohne echte autonome Runtime, externe Notifications, Recipient Verification, Entitlement-Aktivierung oder automatische Veröffentlichung zu starten.

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `docs/E150/OpenTasks.md`
- `.codex/agents/bootstrap.json`
- `.codex/agents/registry.json`
- `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`
- `docs/E150/V3_MUNICIPAL_HANDOFF_THREE_ADOPTION_TRIAL_2026-07-14.md`
- `docs/E150/V3_B2G_FIRST_LOGIN_JURISDICTION_COCKPIT_2026-07-14.md`
- `docs/E150/V3_AGENT_REGISTRY_RUNNER_BOOTSTRAP_2026-07-13.md`
- `docs/E150/V3_AGENT_RUN_ARTIFACT_SAFE_TRACE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_SEGMENTED_AGENT_EXPERIENCE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_PERSONAL_VOXY_PROFILE_CONSENT_ONBOARDING_2026-07-13.md`
- `docs/E150/V3_DAILY_CIVIC_IMPULSES_OBSERVATION_INTAKE_2026-07-13.md`
- `docs/E150/V3_CLAIMS_FACTCHECK_AGENT_GRAPH_INTEGRATION_2026-07-13.md`
- `docs/E150/V3_DOSSIER_CAUSE_EFFECT_RESPONSIBILITY_TRANSFER_GRAPH_2026-07-13.md`
- `docs/E150/V3_PARTICIPATION_MODERATION_AGENT_RUNTIME_2026-07-13.md`

## Runner-Hinweis

- `.codex/prompts/lean-continuous-slice-runner.md` referenziert weiterhin `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md`.
- Diese Datei ist im aktuellen Repo-Stand nicht vorhanden.
- Der Slice stützt sich deshalb auf `AGENTS.md`, `OpenTasks.md`, Manifest, Registry, Bootstrap und die bereits gemergten Controlled-Agentic-Evidence-Dokumente.

## Umgesetzte Artefakte

### 1. Typed End-to-End Pilot Contract

Neu:

- `apps/web/src/features/agenticRuntime/agenticCivicE2EPilotContract.ts`

Der Contract integriert die vorhandenen Controlled-Agentic-Bausteine in einen durchgehenden review-first Pfad:

- Bürger / Beitrag / Beobachtung
- Intake / Format
- Safe Trace
- Claims / Factcheck-Kandidaten
- Dossier / Debattenstand
- Participation / Moderation
- GOV-light / Municipal Handoff
- Verified Publisher Preflight
- Review / Pipeline / Status

Testbar gemacht werden dabei insbesondere:

- eDebatte ist keine Ja/Nein-Abstimmungsmaschine
- Mehrheit gilt nur innerhalb der eDebatte-Grundsätze
- Gegenargumente, Quellenlimits und Kontext bleiben sichtbar
- öffentliche Debattenstände bleiben frei lesbar
- GOV-light bleibt auf drei aktive Slots begrenzt
- Lesen, Teaser, Vorschläge und internes Vormerken verbrauchen keinen Slot
- Slot-Verbrauch entsteht erst bei aktivem Publish oder Activate
- Verified Publisher klickt bewusst auf Veröffentlichen
- Grün/Gelb/Rot bleibt Pflicht
- Agent veröffentlicht nie autonom
- keine Runtime-Aktivierung, keine Parallel-Agenten, keine Provider, keine externe Notification

Zusätzlich enthalten:

- typed Stage-IDs und Stage-States
- integrierte Contract-IDs für die vorgelagerten Pilot-Abhängigkeiten
- ableitbare Summary Cards für read-only Operator- und Account-Surfaces
- zentrale Create-, Account-, Organization- und Admin-Hinweise

### 2. Read-only Surface-Integration

Geändert:

- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/organization/page.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/admin/system/page.tsx`

Sichtbar gemacht:

- `/create`
  - der Pilot bleibt ein vorbereitender Review-Pfad ohne Auto-Publish und ohne externe Benachrichtigung
- `/account`
  - persönliche Beobachtung, Consent und spätere institutionelle Weitergabe bleiben getrennt
- `/account/organization`
  - Dossier, Beteiligung, GOV-light und Municipal Handoff werden als Statuspfad erklärt, nicht als automatische Behördenaktion
- `/account/organization/dashboard`
  - der B2G-/Municipal-Handoff-Block wird um den vollständigen E2E-Pilot-Kontext ergänzt
- `/admin/review`
  - Intake, Safe Trace, Claims, Dossier, Beteiligung, GOV-light und Preflight werden als gemeinsamer read-only Review-Pfad benannt
- `/admin/system`
  - eigener `Agentic Civic E2E Pilot`-Block mit Stage-Zusammenfassung, Guardrails und Pilot-Grenzen

## Integrierte bestehende Contracts

- `V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01`
- `V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01`
- `V3-INTAKE-FORMAT-AGENT-E2E-01`
- `V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01`
- `V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01`
- `V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01`
- `V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01`
- `V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01`
- `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01`
- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01`

## Guardrails

- keine echte Agent-Runtime
- keine Parallel-Agenten
- keine Provider
- keine Secrets
- keine Kosten
- keine externe Notification
- keine automatische Recipient Verification
- keine automatische Entitlement-Aktivierung
- keine automatische Adoption
- kein Agent-Auto-Publish
- keine Fake-Daten
- keine Fake-Quellen
- keine Ja/Nein-Polarisierungsmaschine

## OpenTasks-Sync

Geändert:

- `V3-AGENTIC-CIVIC-E2E-PILOT-01` -> `done`
- `Next codex_ready tasks` -> keine weiteren `codex_ready` Controlled-Agentic-Folgepfade aus dem Bootstrap-Manifest

Begründung:

- alle dokumentierten Pilot-Abhängigkeiten sind erledigt
- der End-to-End-Pilot ist jetzt repo-seitig als Contract und Surface-Wahrheit integriert
- daraus folgt keine Runtime-Freigabe und kein externer Handoff

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/agentic-civic-e2e-pilot.contract.test.ts tests/agent-registry-bootstrap.contract.test.ts tests/admin-system-agentic-runtime-readiness.page.test.tsx tests/admin-review.page.test.tsx tests/account-organization-page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/create-mode.page.test.ts`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Ergebnis:

- `git diff --check` ohne Befund
- fokussierte Vitest-Suite: `7` Dateien, `28/28` Tests grün
- `pnpm -C apps/web run lint` grün
- `pnpm -C apps/web run build` grün
- `pnpm -C apps/web run typecheck` grün

## Ergebnis

- Der dokumentierte Agentic-Civic-Pilotpfad ist jetzt als zusammenhängender review-first Stage-, Status- und Surface-Contract abgebildet.
- Der Slice aktiviert keine Runtime, keine Provider und keine Außenaktion.
- Aus dem Bootstrap-Manifest bleibt danach kein weiterer `codex_ready` Controlled-Agentic-Folgepfad offen.
