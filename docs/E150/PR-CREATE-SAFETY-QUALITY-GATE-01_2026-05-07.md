# PR-CREATE-SAFETY-QUALITY-GATE-01

## Ziel
Verbindlichen Safety- und Quality-Gate vor `/create` Analyze/Save/Finalize einführen, ohne Civic-Intent zu unterdrücken.

## Prinzipien
- Anliegen erhalten, aber riskante Teile getrennt behandeln.
- Keine automatische Veröffentlichung.
- Kein stilles Cross-Language-Merge.
- Keine externe Moderations-Provider-Abhängigkeit.
- Deterministische, lokal nachvollziehbare Regeln.

## Decision-Matrix
- `blocked`:
  - konkrete Gewaltandrohung
  - Doxxing/PII + Call-to-Action
- `moderation_required`:
  - Selbstjustiz-/Drohmarker ohne finale Gewaltanweisung
  - private Drittpersonen-Daten + Vorwurf
- `factcheck_required`:
  - schwere unbelegte Behauptungen
  - unbestätigte Zahlenbehauptungen
- `graph_review_required`:
  - Cross-Lingual-Risiko bei `contentLanguage=de` und non-`de` source
- `revise_required`:
  - Beleidigungen, schwache Lesbarkeit, politisches Framing als Perspektive
- `allow`:
  - kein block-/reviewpflichtiger Treffer

## Sprachstrategie
- Standard bleibt `same_language_only`.
- Cross-lingual wird nicht auto-gemerged, sondern als `graph_review_required` markiert.

## No-Auto-Verhalten
- `noAutoPublish=true` und `noSilentMerge=true` in jedem Safety-Result.
- Analyze trägt Safety in `createAnalyze` und `meta`.
- Save speichert bei PII/Doxxing redacted Text.
- Finalize blockiert `blocked`/`moderation_required` und faktcheckpflichtige riskante Claims.

## Betroffene Dateien
- `apps/web/src/features/create/safety/createInputSafety.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/app/api/contributions/finalize/route.ts`
- `apps/web/src/components/analyze/CreateInputSafetyPanel.tsx`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/features/create/analyzeContract.ts`
- `apps/web/tests/create-input-safety.contract.test.ts`
- `apps/web/tests/create-analyze.safety-gate.test.ts`
- `apps/web/tests/create-save.safety-gate.test.ts`
- `apps/web/tests/create-finalize.safety-gate.test.ts`
- `apps/web/tests/fixtures/createSafetyStressInput.de.ts`

## Test-Fixture
- `apps/web/tests/fixtures/createSafetyStressInput.de.ts` enthält langen gemischten Kommunaltext mit Allegations-/Zahlenmarkern für Factcheck-Gates.

## Validierung
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-input-safety.contract.test.ts tests/create-analyze.safety-gate.test.ts tests/create-save.safety-gate.test.ts tests/create-finalize.safety-gate.test.ts`
- `pnpm -C apps/web run lint`
