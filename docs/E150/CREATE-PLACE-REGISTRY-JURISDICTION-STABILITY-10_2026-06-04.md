## CREATE-PLACE-REGISTRY-JURISDICTION-STABILITY-10

Status: done  
Date: 2026-06-05

### Was wurde gebaut?

- Die Place-/Jurisdiction-Resolution im `/create`-Followup läuft jetzt nur noch nachgelagert nach dem erfolgreichen GPT-Quick-Planner.
- `buildContributionPackage()` baut zuerst ausschließlich aus dem Planner-Ergebnis die Branches.
- Eine neue best-effort-Nachbearbeitung wendet `resolvePlaceAndJurisdiction(...)` nur auf relevante lokale Äste an.
- Die Ortsauflösung ist mit `try/catch` und kurzem Timeout (`800ms`) isoliert.
- Fehler oder Timeouts setzen nur Draft-Statusfelder wie `placeResolutionStatus`, `needsPlaceClarification` und `placeClarificationStatus`.
- Non-Prod-Meta enthält jetzt:
  - `plannerRuntimeDebug.effectivePlannerModel`
  - `plannerRuntimeDebug.plannerTimeoutMs`
  - `plannerRuntimeDebug.plannerDurationMs`
  - `placeResolutionDebug.placeResolutionDurationMs`
  - `placeResolutionDebug.placeResolutionStatus`
  - optionale `placeResolutionErrorCode` und `placeResolutionErrorMessage`

### Was wurde bewusst nicht geändert?

- Keine neue Produktlogik für Publish, Vote, Merge oder Teilen
- Keine lokale fachliche Heuristik als Planner-Ersatz
- Kein Umbau des Multi-Branch-Boards
- Kein Eingriff in den neutralen `planner_unavailable`-Pfad, wenn der GPT-Call selbst scheitert

### Regression-Fix

Der lokale Straßenfall wie `neuer Radweg in der Clara-Pankowr Allee` kann jetzt in der Place-Resolution fehlschlagen oder timeouten, ohne dass der gesamte `/create`-Flow in `Automatische Einordnung nicht abgeschlossen` kippt. Der lokale Ast bleibt sichtbar und fordert weiter `Ort noch klären` an.

### Guardrails

- Keine automatische Veröffentlichung
- Keine automatische Stimme
- Kein automatisches Mitzählen
- Kein automatisches Merge
- Alles bleibt Draft/Preparation

### Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-planner-openai-happy-path.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-qr-swipes-drafts.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- 7/7 Testdateien grün
- 27/27 Tests grün
