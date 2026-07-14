# V3 B2G First Login Jurisdiction Cockpit 2026-07-14

## Scope

- Task: `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01`
- Branch: `pr/v3-b2g-first-login-jurisdiction-cockpit-01`
- Primary role: `dossier_briefing`
- Supporting roles: `research_source`, `governance_compliance`
- Typ: controlled contract and surface slice / kein Runtime-Start / keine externe Benachrichtigung

## Ziel

Den nächsten `codex_ready` Controlled-Agentic-Pfad als B2G-First-Login-, Jurisdiktions- und Response-Cockpit-Wahrheit sauber festziehen, ohne echte Behördenverifikation, Entitlement-Aktivierung, Handoff oder Runtime zu starten.

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `docs/E150/OpenTasks.md`
- `.codex/agents/bootstrap.json`
- `.codex/agents/registry.json`
- `docs/E150/V3_AGENTIC_RUNTIME_MANIFEST_2026-07-13.md`
- `docs/E150/V3_AGENT_REGISTRY_RUNNER_BOOTSTRAP_2026-07-13.md`
- `docs/E150/V3_SEGMENTED_AGENT_EXPERIENCE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_AGENT_RUN_ARTIFACT_SAFE_TRACE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_CLAIMS_FACTCHECK_AGENT_GRAPH_INTEGRATION_2026-07-13.md`
- `docs/E150/V3_DOSSIER_CAUSE_EFFECT_RESPONSIBILITY_TRANSFER_GRAPH_2026-07-13.md`
- `docs/E150/V3_PARTICIPATION_MODERATION_AGENT_RUNTIME_2026-07-13.md`

## Runner-Hinweis

- `.codex/prompts/lean-continuous-slice-runner.md` referenziert weiterhin `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md`.
- Diese Datei ist im aktuellen Repo-Stand nicht vorhanden.
- Der Slice stützt sich deshalb auf die vorhandene SSOT: `AGENTS.md`, `OpenTasks.md`, Manifest, Registry, Bootstrap und die bereits gemergten Controlled-Agentic-Folgeartefakte.

## Umgesetzte Artefakte

### 1. Typed B2G First-Login Contract

Neu:

- `apps/web/src/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitContract.ts`

Der Contract macht testbar:

- verified authority first login != verified authority activation
- jurisdiction match != jurisdiction authority verified
- available Debattenstand != adopted Debattenstand
- suggested participation != launched participation
- reviewed topic candidate != official authority process
- response cockpit != external notification
- guided assistance != human approval
- named contact != automatic assignment
- self-service != managed governance
- public Debattenstand bleibt frei lesbar
- Personal Voxy wird fuer B2G nicht erzwungen

Zusätzlich enthalten:

- typed First-Login-, Jurisdiction- und Guidance-Mode-IDs
- read-only Summary Cards fuer bestehende Flächen
- Municipal-Handoff- und Agentic-Civic-E2E-Statushinweise
- user-safe Trace-Schritte fuer `/account/organization/dashboard` und `/admin/region`

### 2. Additive Read-only Surface-Hinweise

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

Sichtbar gemacht:

- `/account/organization`
  - B2G First Login bleibt read-only Einstieg, keine Aktivierung
- `/account/organization/dashboard`
  - eigener B2G-First-Login-/Jurisdiktions-/Response-Block
  - Betriebsmodi `self_service`, `guided_assistance`, `named_contact`, `managed_governance` bleiben getrennt
- `/admin/access`, `/admin/entitlements`, `/admin/system`
  - Authority First Login, Jurisdiktions-Match, Freischaltung, Entitlement und externe Benachrichtigung bleiben getrennte Review-Schritte
- `/admin/region`
  - Jurisdiktions-Match, reviewed topic candidate und vorgeschlagene Beteiligung bleiben getrennt von offiziellem Verfahren
- `/admin/review`
  - reviewed topic candidate != official authority process
  - response cockpit != external notification
- `/dossier/[id]`, `/runden`
  - B2G-Cockpit ändert nichts an freier öffentlicher Lesbarkeit

## Guardrails

- keine echte Behördenverifikation
- keine automatische Entitlement-Aktivierung
- keine automatische Adoption
- keine externe Mail-, Webhook-, Slack- oder API-Benachrichtigung
- kein automatischer Behördenhandoff
- keine Runtime-Aktivierung
- keine Parallel-Agenten
- keine Fake-Jurisdiktionsdaten

## Municipal Handoff und Agentic Civic E2E

- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` bleibt `needs_decision`
- Grund:
  - Pricing
  - Entitlement
  - Recipient Verification
  - External Notification Workflow
  - bewusster Handoff-Freigabeschritt
  brauchen weiterhin eine eigene Produktfreigabe
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` bleibt danach `blocked`
- Grund:
  - B2G First Login ist mit diesem Slice erledigt
  - Municipal Handoff bleibt jedoch `needs_decision`
  - damit ist die letzte `unblockAfter`-Abhängigkeit weiterhin nicht erfüllt

Siehe auch:

- `docs/E150/V3_MUNICIPAL_HANDOFF_DECISION_BOUNDARY_2026-07-14.md`

## OpenTasks-Sync

Geändert:

- `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01` -> `done`
- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` bleibt `needs_decision`, aber mit expliziter Decision-Boundary-Evidence
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` bleibt `blocked`, jetzt mit klarer Restblockade-Dokumentation
- `Next codex_ready tasks` im Controlled-Agentic-Folgepfad: aktuell keine

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/b2g-first-login-jurisdiction-cockpit.contract.test.ts tests/account-organization-page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/admin-system-agentic-runtime-readiness.page.test.tsx tests/admin-region-page.render.test.tsx tests/admin-review.page.test.tsx tests/dossier-public-route.contract.test.tsx tests/runden-public-sharing-guide.contract.test.tsx tests/agent-registry-bootstrap.contract.test.ts`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

## Ergebnis

- B2G First Login / Jurisdiction Cockpit ist als review-first Contract-/Surface-Wahrheit umgesetzt
- Municipal Handoff wurde bewusst nicht mitgezogen
- Agentic Civic E2E bleibt repo-seitig dokumentiert blockiert, statt künstlich freigezogen zu werden
