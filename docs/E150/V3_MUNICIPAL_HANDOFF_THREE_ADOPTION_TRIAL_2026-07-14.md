# V3 Municipal Handoff Three Adoption Trial 2026-07-14

## Scope

- Task: `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01`
- Branch: `pr/v3-municipal-handoff-three-adoption-trial-01`
- Primary role: `dossier_briefing`
- Supporting roles: `governance_compliance`, `participation_moderation`
- Typ: controlled contract and surface slice / keine Runtime / keine externe Benachrichtigung / keine Entitlement-Aktivierung

## Ziel

Den geklärten GOV-light-, Verified-Publisher-Preflight- und Municipal-Handoff-Pfad als vollständigen repo-seitigen Trial-Contract sichtbar machen, ohne echte Behördenverifikation, Runtime, Provider, Secrets oder automatische Außenaktionen zu starten.

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `docs/E150/OpenTasks.md`
- `.codex/agents/bootstrap.json`
- `.codex/agents/registry.json`
- `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`
- `docs/E150/V3_MUNICIPAL_HANDOFF_DECISION_BOUNDARY_2026-07-14.md`
- `docs/E150/V3_B2G_FIRST_LOGIN_JURISDICTION_COCKPIT_2026-07-14.md`
- `docs/E150/V3_AGENT_REGISTRY_RUNNER_BOOTSTRAP_2026-07-13.md`
- `docs/E150/V3_SEGMENTED_AGENT_EXPERIENCE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_AGENT_RUN_ARTIFACT_SAFE_TRACE_CONTRACT_2026-07-13.md`

## Umgesetzte Artefakte

### 1. Typed Municipal-Handoff Trial Contract

Neu:

- `apps/web/src/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract.ts`

Der Contract macht testbar:

- drei explizite GOV-light-Slot-Zustände plus Archiv-Endzustand
- nur aktives Publish oder Activate verbraucht einen GOV-light-Slot
- öffentliche Lesbarkeit, Teaser und internes Bookmarking bleiben slot-frei
- GOV-light bleibt ohne Exportpaket, Vollreport und tiefe Segmentierung
- Verified Publisher Preflight bleibt Grün/Gelb/Rot nach bewusstem Publish-Klick
- Authority Continuation bleibt Kandidat und wird nicht zum offiziellen Behördenprozess hochgeschrieben
- Municipal Handoff bleibt CRM-/Pipeline-intern, human-approved und ohne Auto-Publish

### 2. B2G- und Operator-Surfaces auf Trial-Status synchronisiert

Geändert:

- `apps/web/src/app/account/organization/page.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/src/app/admin/access/page.tsx`
- `apps/web/src/app/admin/entitlements/page.tsx`
- `apps/web/src/app/admin/system/page.tsx`
- `apps/web/src/app/admin/region/page.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitContract.ts`
- `apps/web/src/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitHints.ts`

Sichtbar gemacht:

- B2G-First-Login verwendet jetzt `municipalHandoffStatus: done` als separaten Trial-Contract, nicht mehr als offene Decision Boundary
- `/account/organization/dashboard` zeigt Municipal-Handoff-Trial und Three-Slot-/Preflight-Karten read-only
- `/admin/system` zeigt nach Municipal Handoff als nächsten echten `codex_ready`-Pfad den Pilot `V3-AGENTIC-CIVIC-E2E-PILOT-01`
- `/admin/access`, `/admin/entitlements`, `/admin/review`, `/admin/region` trennen GOV-light-Aktivierung, Entitlement, Authority-Continuation und externe Notification sichtbar
- `/dossier/[id]` und `/runden` halten öffentliches Lesen, Teilen und QR explizit slot-frei

### 3. Contract- und Surface-Tests erweitert

Neu:

- `apps/web/tests/municipal-handoff-three-adoption-trial.contract.test.ts`

Aktualisiert:

- `apps/web/tests/account-organization-page.contract.test.tsx`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `apps/web/tests/admin-access-entitlements-surface.contract.test.tsx`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/admin-system-agentic-runtime-readiness.page.test.tsx`
- `apps/web/tests/agent-registry-bootstrap.contract.test.ts`
- `apps/web/tests/b2g-first-login-jurisdiction-cockpit.contract.test.ts`
- `apps/web/tests/dossier-public-route.contract.test.tsx`
- `apps/web/tests/runden-public-sharing-guide.contract.test.tsx`

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
- keine automatische Behördenantwort
- kein Agent-Auto-Publish
- keine Fake-Daten
- keine Fake-Quellen

## OpenTasks-Sync

Geändert:

- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` -> `done`
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` -> `codex_ready`
- `Next codex_ready tasks` -> `V3-AGENTIC-CIVIC-E2E-PILOT-01`

Begründung:

- alle dokumentierten `unblockAfter`-Abhängigkeiten des Pilot-Tasks sind jetzt erledigt
- Municipal Handoff bleibt trotzdem contract-first und review-first
- Municipal Handoff öffnet keinen Runtime-, Provider- oder Notification-Pfad

## Ergebnis

- Municipal Handoff ist repo-seitig als GOV-light-/Three-Slot-/Preflight-Truth verankert
- B2G-, Admin- und Public-Surfaces kommunizieren dieselben Guardrails
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` ist als nächster Controlled-Agentic-Folgepfad jetzt `codex_ready`
