# V3 Voxy Experience Shell Mobile Agentic Integration 2026-07-14

## Scope

- Task ID: `V3-VOXY-EXPERIENCE-SHELL-MOBILE-AGENTIC-INTEGRATION-01`
- Slice-Typ: Controlled Contract-/Surface-Slice
- Branch: `pr/v3-voxy-experience-shell-mobile-agentic-integration-01`
- Primary role: `personal_voxy`
- Supporting roles: `governance_compliance`, `dossier_briefing`, `intake_format`

## Ziel

Voxy wird als nutzerverständliche Experience Shell für Page, Mobile/PWA und Agentic Integration vorbereitet, ohne eine echte Agent-Runtime, Provider, Secrets, Notifications, Auto-Publish oder native App zu aktivieren.

## Eingangsquellen

- `docs/E150/OpenTasks.md`
- `.codex/agents/registry.json`
- `.codex/agents/bootstrap.json`
- `docs/E150/V3_AGENTIC_RUNTIME_MANIFEST_2026-07-13.md`
- `docs/E150/V3_SEGMENTED_AGENT_EXPERIENCE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_AGENT_RUN_ARTIFACT_SAFE_TRACE_CONTRACT_2026-07-13.md`
- `docs/E150/V3_PERSONAL_VOXY_PROFILE_CONSENT_ONBOARDING_2026-07-13.md`
- `docs/E150/V3_B2G_FIRST_LOGIN_JURISDICTION_COCKPIT_2026-07-14.md`
- `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`
- `docs/E150/V3_MUNICIPAL_HANDOFF_THREE_ADOPTION_TRIAL_2026-07-14.md`

## Umgesetzte Artefakte

- `apps/web/src/features/voxy/voxyExperienceShellContract.ts`
  - typisierter Shell-Contract für `passive`, `guided`, `active`
  - Surface-Definitionen für `/`, `/create`, `/runden`, `/dossier/[id]`, `/account`, `/account/organization`, `/account/organization/dashboard`, `/admin/system`, `/admin/review`, `/admin/region`
  - sichere Agentic-Fassade: Anliegen ordnen, Format vorschlagen, Quellen prüfen, Claims erkennen, Gegenargumente sichtbar machen, Dossier vorbereiten, Beteiligung/Handoff/Preflight erklären
  - Guardrails: keine Runtime, keine Provider-/Prompt-/Chain-of-Thought-Leaks, kein Auto-Publish, keine externe Notification, keine automatische Entitlement-Aktivierung, keine automatische Adoption
- wiederverwendbare Layout-Guards in `VoxyGuide`, `VoxyBubble`, `VoxyInlineHint`
  - `max-w-full`
  - `max-h-[70svh]`
  - mobile safe / no viewport overflow / no raw nav regression
- additive read-only Surface-Hinweise auf den betroffenen Page-, Public- und Admin-Flächen
- Admin-System-Readiness-Karte für die Voxy Experience Shell

## Produktwahrheit und Grenzen

- Voxy ist die sichtbare Shell, nicht die spezialisierte Agent-Runtime.
- `passive` erklärt Status, Guardrails und Lesbarkeit.
- `guided` schlägt sichere nächste Schritte und Action Chips vor.
- `active` startet nur nach bewusster Nutzeraktion.
- B2C Personal Voxy bleibt consent-gated.
- B2B und B2G werden nicht in einen persönlichen Companion gezwungen.
- Öffentliche Debattenstände bleiben frei lesbar.
- Personalisierung blendet weder Gegenargumente noch Evidenzgrenzen aus.
- Keine echte Agent-Aktivität wird behauptet.

## OpenTasks-Sync

- `V3-VOXY-EXPERIENCE-SHELL-MOBILE-AGENTIC-INTEGRATION-01` in `docs/E150/OpenTasks.md` materialisiert und auf `done` gesetzt.
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` bleibt ausdrücklich `codex_ready` und wird in diesem Slice nicht gestartet.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/voxy-experience-shell.contract.test.ts tests/voxy-guide.render.test.tsx tests/create-mode.page.test.ts tests/account-organization-page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/admin-system-agentic-runtime-readiness.page.test.tsx tests/admin-review.page.test.tsx tests/admin-region-page.render.test.tsx tests/runden-public-sharing-guide.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

- Ergebnis:
  - `git diff --check`: grün
  - fokussierte Vitest-Suite: `12` Testdateien, `40` Tests, alle grün
  - `pnpm -C apps/web run lint`: grün
  - `pnpm -C apps/web run build`: grün
  - `pnpm -C apps/web run typecheck`: nicht grün wegen bestehender `TS6053`-Drift aus `apps/web/.next/types/**/*.ts`
- Typecheck-Drift:
  - Der explizite `typecheck` scheitert weiterhin an fehlenden `.next/types/...`-Dateien, unter anderem `app/account/page.ts`, `app/admin/system/page.ts`, `app/runden/page.ts` und `server.d.ts`.
  - Diese Drift bestand unabhängig vom Slice und trat nach grünem Build weiterhin als separates Include-Problem in `tsconfig.json` auf.
  - Der Slice selbst regressiert nicht: fokussierte Tests, Lint und produktiver Build sind grün.

## Ergebnis

Der Slice bereitet Voxy als konsistente, sichere Experience Shell für Desktop/Page, Mobile/PWA und Agentic Integration vor und hält den nächsten review-first Folgepfad `V3-AGENTIC-CIVIC-E2E-PILOT-01` offen.
