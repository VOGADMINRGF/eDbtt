# WORKTREE-ISOLATE-TELEMETRY-ORCHESTRATOR-10

Datum: 2026-06-13
Geprüfter Commit-Stand: `e043361f154ebfc7ee4af74942f767eb40fd7026` (`docs(e150): decide restdrift hygiene cluster`)

## Geprüfte Dateien

- `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`
- `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`
- `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`
- `apps/web/src/features/ai/providerSmokeDirectRunner.ts`
- `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`
- `apps/web/tests/ai-provider-smoke-cli.test.ts`
- zusätzlich als bestehende Guards geprüft:
  - `apps/web/tests/admin-ai-telemetry-ui.contract.test.ts`
  - `apps/web/tests/admin-ai-telemetry-events.route.test.ts`

## Bestehender E150-/Provider-Kontext

- Kein neues `providerMatrix`-Modul angelegt.
- Kein neuer Provider-Registry-Pfad angelegt.
- ARI-Anbindung bleibt auf dem bestehenden Alias `@features/ai/providers/ari_llm`; die konkrete Datei liegt aktuell unter `features/ai/providers/ari_llm.ts`.
- Bestehende Env-Namen bleiben maßgeblich:
  - `ARI_BASE_URL`
  - `ARI_API_KEY`
  - `YOUCOM_ARI_API_KEY`
  - `ARI_MODE`
  - `ARI_TOOLS_JSON`
  - `OPENAI_SMOKE_MODEL`
- Capability-/Diagnostiklogik für den Smoke-Kontext bleibt in den vorhandenen Telemetry-/Smoke-Dateien (`adminTelemetryDiagnostics.ts`, `providerSmokeDirectRunner.ts`, `route.ts`) und im bestehenden Registry-Kontext (`researchProviderRegistry.ts`).

## Cluster-Bewertung

### `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`

- Gehört eindeutig zum Cluster: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Guardrails: konform
- Bewertung:
  - Tabellenlabels werden von generischen `Probe`-/`Runtime`-/`Strict`-/`Journey`-Begriffen auf explizite diagnostische Begriffe (`Direct Probe`, `Journey Runtime`, `Direct Contract`, `Journey Contract`) geschärft.
  - Zusatzcopy verhindert falsche Gesundheitsbehauptungen bei `skipped` und `fallback_not_needed`.
  - Keine neue Produktlogik, keine neue Admin-Fläche außerhalb des bestehenden Orchestrator-Telemetry-Screens.

### `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`

- Gehört eindeutig zum Cluster: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Guardrails: konform
- Bewertung:
  - Direkte Probes werden robuster gegen umschlossene JSON-Antworten.
  - OpenAI-Direct-Probe und Direct-Contract verwenden explizit das Smoke-Profil statt implizit produktiver Modellwahl.
  - Gemini-Probes erhalten einen kontrollierten Relaxed-Parse-Retry statt falsch-negativer `BAD_JSON`-Fehler.
  - ARI-`402` wird als Billing-/Credit-Blocker klassifiziert statt als diffuser Internal Error.
  - OpenAI-Strict-Timeouts erhalten nur einen konservativen kompakten Fallback für Smoke-Diagnostik; kein Auto-DeepSearch, kein Auto-Cost-Pfad, keine neue produktive Orchestrierung.
  - Deterministischer Envelope-Build wird als degradierter Diagnosepfad ausgewiesen, nicht als `strict_ok`.

### `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`

- Gehört eindeutig zum Cluster: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Guardrails: konform
- Bewertung:
  - Root-Cause- und Next-Action-Mapping differenziert jetzt sauber zwischen `PAYMENT_REQUIRED`, `TIMEOUT`, `FALLBACK_NOT_NEEDED`, `SKIPPED`, `DISABLED`.
  - Verhindert Fehlinterpretationen als Provider-Ausfall.
  - Keine Änderung an produktiver Provider-Selektion.

### `apps/web/src/features/ai/providerSmokeDirectRunner.ts`

- Gehört eindeutig zum Cluster: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Guardrails: konform
- Bewertung:
  - CLI-/Direct-Runner zieht dieselben Smoke-Profil-/Mismatch-/Gemini-Retry-Regeln nach wie die Route.
  - Damit bleiben Admin-Route und CLI-Diagnostik konsistent.
  - Keine neue Provider-Matrix, keine neue Runtime-Orchestrierung.

### `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`

- Gehört eindeutig zum Cluster: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Bewertung:
  - Deckt die neuen Guardrails explizit ab:
    - `fallback_not_needed` nicht als Provider-Fehler
    - OpenAI Smoke-Modell statt `OPENAI_MODEL`
    - Gemini Retry nach `BAD_JSON`
    - ARI `402` => `PAYMENT_REQUIRED`
    - `built_valid`-/degraded-Pfade für Journey- und Direct-Contract
    - OpenAI-Timeout mit konservativem kompakten Fallback

### `apps/web/tests/ai-provider-smoke-cli.test.ts`

- Gehört eindeutig zum Cluster: ja, nach Entmischung
- Wert: mittel bis hoch
- Debug-/Scratch-Drift: nein
- Bewertung:
  - Prüft Smoke-Modell-/Timeout-Weitergabe und Gemini-Retry im CLI-Pfad.
  - Wurde bewusst von `.env.example` entkoppelt, damit der Cluster ohne gemischte Env-Doku commitbar bleibt.

## Dateien, die eindeutig zum Cluster gehören

- `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`
- `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`
- `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`
- `apps/web/src/features/ai/providerSmokeDirectRunner.ts`
- `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`
- `apps/web/tests/ai-provider-smoke-cli.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-ISOLATE-TELEMETRY-ORCHESTRATOR-10_2026-06-08.md`

## Dateien, die bewusst draußen bleiben

- `apps/web/.env.example`
  - Mischpunkt aus Admin-Smoke-, produktiver Analyze- und `/create`-Planner-Konfiguration
- alle Create-/Planner-/Followup-Dateien
- alle Voxy-/`globals.css`-Dateien
- alle Factcheck-/Account-Dateien
- alle Live-Flächen
- alle Multibranch-/Place-/Street-Dateien

## Guardrails

- Kein neuer Provider eingeführt
- Kein neues `providerMatrix`-Modul eingeführt
- Keine produktive Provider-Gesundheit behauptet, wenn nur `skipped`, `fallback_not_needed` oder degradierte Smoke-Diagnostik vorliegt
- Kein Auto-DeepSearch
- Kein Auto-Cost-Pfad
- Keine neue Orchestrator-Produktlogik

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts tests/admin-ai-telemetry-ui.contract.test.ts tests/admin-ai-telemetry-events.route.test.ts tests/ai-provider-smoke-cli.test.ts`

Ergebnis:

- Typecheck: grün
- Lint: grün
- Vitest: `4` Testdateien, `76/76` Tests grün

## Commitbarkeit

Bewertung: commitbar

Begründung:

- Der Cluster ist fachlich zusammenhängend und auf bestehende Telemetry-/Smoke-Oberflächen beschränkt.
- Der zuvor gemischte `.env.example`-Bezug wurde aus dem CLI-Test entfernt.
- Die Änderungen bleiben innerhalb bestehender Diagnosepfade und verschieben keine Produktgrenzen.

## Nächster empfohlener Schritt

- `WORKTREE-COMMIT-TELEMETRY-ORCHESTRATOR-10`

Optional danach, separat:

- Voxy/Public-Style oder ein weiterer isolierbarer Docs-/Code-Cluster, aber nicht in demselben Commit.
