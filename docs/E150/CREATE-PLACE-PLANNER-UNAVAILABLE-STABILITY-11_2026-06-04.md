# CREATE-PLACE-PLANNER-UNAVAILABLE-STABILITY-11

## Was wurde umgesetzt?

- Der `/create`-Quick-Planner für lokale Mehrthemen-Eingaben wurde gegen die `planner_unavailable`-Regression nachgehärtet.
- `CREATE_PLANNER_TIMEOUT_MS` wird jetzt bis `10000ms` übernommen und ohne verstecktes `6000ms`-Cap an den OpenAI-Planner-Call weitergereicht.
- Non-Prod-Debug für Planner und Place-Resolution wurde erweitert:
  - `effectivePlannerModel`
  - `plannerTimeoutMs`
  - `plannerDurationMs`
  - `plannerRetryAttempted`
  - `plannerRetryDurationMs`
  - `plannerErrorCode`
  - `plannerErrorMessage`
  - `rawProviderStatus`
  - `placeResolutionAttempted`
  - `placeResolutionDurationMs`
  - `placeResolutionStatus`
  - `placeResolutionErrorMessage`
- Die Place-Resolution bleibt nachgelagert und best effort. Wenn sie fehlschlägt oder timeoutet, bleiben die GPT-Branches erhalten.
- Der lokale Radweg-/Straßen-Ast bleibt als eigener Branch sichtbar und trägt bei fehlender Auflösung nur noch `needsPlaceClarification` bzw. `placeResolutionStatus=failed|timeout|unresolved`.

## Stabilitätsziel

Der Input-Fall mit

- `neuer Radweg in der Clara-Pankower Allee`
- plus weiteren getrennten Themen

führt nicht mehr zu `planner_unavailable`, solange der GPT-Quick-Planner selbst erfolgreich antwortet.

## Guardrails

- Keine fachliche lokale Heuristik wurde eingeführt.
- Kein Publish.
- Kein Vote.
- Kein Merge.
- Alles bleibt Draft/Preparation.

## Tests / Verifikation

Ausgeführt:

- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-place-planner-unavailable-stability.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-planner-openai-happy-path.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- Fokussierte Regression-/Planner-/Multibranch-Suite grün

## Bewusst offen

- Echtes Publish/Share/QR-Code
- Echtes Voting/Mitzählen
- Echtes Merge/Counting
- Admin-/Review-Freigaben
