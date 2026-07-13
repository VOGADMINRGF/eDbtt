# V3 AI Trace User-Facing Orchestration Hardening 2026-07-13

## Scope

- `V3-AI-TRACE-USER-FACING-ORCHESTRATION-HARDENING-01`
- Cluster: AI Trace / Orchestration Transparency / sichere Nutzer- und Operator-Semantik

## Umsetzung

- Eine gemeinsame sichtbare AI-Trace-Wahrheit wurde unter `apps/web/src/features/ai/aiTraceSurfaceTruth.ts` eingefuehrt.
- Die neue Quelle harmonisiert:
  - sichere Scope-Zeilen fuer user-facing und operator-facing AI-Trace-Surfaces
  - menschliche Hinweise fuer bewusst verborgene technische Details
  - saubere Formulierungen fuer unvollstaendige Runtime-Wahrheit ohne rohe Debug-Phrasen
  - denselben Sicherheitsrahmen fuer Frontend-Trace, Review-/Downstream-Transparenz und Operator-Telemetrie
- `FrontendAiTransparencyPanel` nutzt dieselbe sichere AI-Trace-Wahrheit jetzt auf `/create` und `/runden/new`, statt rohe Formulierungen wie `Missing runtime truth:` sichtbar zu rendern.
- `V3DownstreamKiTransparency` zeigt dieselbe Scope-/Policy-Wahrheit jetzt ueber Review-, Dossier- und Account-nahe Surfaces statt lokaler Sondertexte.
- `V3ReviewContextSummary` transportiert die gemeinsame Trace-Zeile jetzt sichtbar in Review-/Handoff-Kontexten.
- `/admin/telemetry/ai/orchestrator` rendert weiter dieselbe API-Grundlage, zeigt im UI aber nur noch sichere Betriebs- und Review-Zusammenfassungen statt roher Provider-, Token-, Kosten- und Parse-/Schema-Diagnostik.

## Gepruefte aktive Surfaces

- `/create`
  Die KI-Transparenz zeigt sichere Schritt-, Review- und Sichtbarkeitsgrenzen statt roher technischer Fehl- oder Runtime-Phrasen.
- `/runden/new`
  Die Draft-/No-AI-/Weiterfuehrungs-Semantik nutzt dieselbe sichere Trace-Wahrheit wie `/create`.
- `/admin/review`
  Review-Handoff- und Folgeaktions-Semantik wurde gegen dieselbe Downstream-/Trace-Wahrheit revalidiert.
- `/dossier/[id]/studio`
  Dossier-Studio nutzt dieselbe Downstream-KI-Transparenz statt einer abweichenden lokalen Trace-Sprache.
- `/account`
  Resume-/Workbench-Kontexte behalten dieselbe Review-first Trace-Semantik fuer wiederaufnehmbare Arbeitsstaende.
- `/admin/telemetry/ai/orchestrator`
  Operatoren sehen nur noch sichere Modus-, Status- und Naechste-Schritte-Zusammenfassungen statt Rohdiagnostik.

## Doppelstrukturen reduziert

- Sichere Trace-Semantik lag bisher verteilt in:
  - `FrontendAiTransparencyPanel`
  - `V3DownstreamKiTransparency`
  - `V3ReviewContextSummary`
  - `/admin/telemetry/ai/orchestrator`
- Diese Oberflaechen ziehen Scope-, Hidden-by-Policy- und Missing-Runtime-Hinweise jetzt aus `aiTraceSurfaceTruth.ts`, statt mehrere leicht abweichende Sicherheits- und Debug-Texte zu pflegen.
- Die rohe Phrase `Missing runtime truth:` ist aus user-facing HTML entfernt.
- Die Operator-Oberflaeche rendert keine Rohfelder wie `providerCode`, `parseError`, `schemaError`, `schemaPath`, `rawExcerpt`, Token- oder Kostenzeilen mehr.

## Produktwahrheit

- Sichtbare AI-Trace-Oberflaechen zeigen Arbeitsschritte, Review-Grenzen, Guardrails und manuelle Folgeaktionen.
- User-facing und operator-facing Copy unterscheiden nicht mehr implizit zwischen Debugdaten und Produktwahrheit.
- `review_ready`, `approved`, `published`, Preview und Runtime bleiben getrennt; keine neue Runtime wird behauptet.
- Es gibt weiterhin keine neuen Providerlaeufe, keine externen API-Calls, keine Prompt-Leaks, keine Kostenanzeige und keine Aktivierung neuer Diagnose-Parallelpfade.

## Legacy- und Fallback-Pfade

- In diesem Slice wurden keine Routen entfernt, keine Redirects eingefuehrt und keine neue Runtime aktiviert.
- Bestehende Diagnose- und Transparency-Pfade bleiben erhalten, werden aber sichtbar auf sichere Surface-Semantik begrenzt.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/ai-trace-surface-truth.test.ts tests/frontend-ai-transparency.contract.test.ts tests/create-mode.page.test.ts tests/v3-downstream-ki-transparency.test.tsx tests/v3-review-context-summary.test.tsx tests/admin-ai-telemetry-ui.contract.test.ts tests/public-debug-leak.guard.test.ts`
  Ergebnis: `7` Testdateien gruen, `27/27` Tests gruen.
- `pnpm -C apps/web exec vitest run tests/ai-orchestration-provenance-trace.contract.test.ts tests/orchestration-production-contract.test.ts tests/admin-ai-orchestrator-smoke.route.test.ts tests/admin-review.page.test.tsx tests/account-resume-workbench.contract.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/runden-working-surface-copy.contract.test.ts`
  Ergebnis: `8` Testdateien gruen, `68/68` Tests gruen.
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
  Ergebnis: lokal gruen; keine `.next/types/**/*.ts`-Drift in diesem Lauf.

## Offene Punkte

- `V3-RELEASE-READINESS-REGRESSION-MATRIX-01` ist der naechste verbleibende `codex_ready` Cluster nach Merge, weil die produktiven Surface-Cluster jetzt fachlich abgearbeitet sind und als reale Release-/Regression-Matrix zusammengezogen werden koennen.
- `GOV-CIVIC-ECON-01` bleibt bewusst docs-/contract-first und nachrangig gegenueber der Release-Readiness-Matrix.
