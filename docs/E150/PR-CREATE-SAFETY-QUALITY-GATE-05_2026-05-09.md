# PR-CREATE-SAFETY-QUALITY-GATE-05

Date: 2026-05-09
Issue: `#120`
Scope: strictly Safety/Input-Qualitaet fuer `/create`

## Ziel

Der bestehende `/create`-Safety-Gate wurde um einen dauerhaften Quality-Clarification-Layer erweitert. Er stoppt keine legitimen civic Inputs vorschnell, fordert aber fehlenden Kontext nach, wenn sonst kein sauberer oeffentlicher Arbeitsstand moeglich ist.

## Umgesetzt

### 1. Clarification kinds

`createInputSafety` liefert jetzt:

- `clarifications`
- `qualityGate`

Abgedeckte Signale:

- `missing_place`
- `missing_timeframe`
- `missing_responsibility`
- `missing_source`
- `missing_requested_action`
- `ambiguous_subject`
- `private_address_risk`
- `editorial_review_requested`

## Local/place policy

- Vage lokale Kontexte wie `bei uns`, `hier`, `in meiner Straße`, `im Bezirk`, `in der Schule`, `in der Kita`, `im Rathaus`, `an der Haltestelle` erzeugen Rueckfragen.
- Rueckfragen verlangen keinen exakten privaten Wohnort.
- Ortsklaerung reicht als Ort, Bezirk, Kommune, Einrichtung oder Haltestelle.
- Bei `private_address_risk` wird explizit nur ungefaehre oeffentliche Einordnung erbeten.
- Redaction/Telemetry/Review speichern weiterhin keine raw Adresse oder andere raw PII.

## Editorial-review-request policy

- Explizite manuelle Pruefwuensche erzeugen `editorial_review_required` oder mindestens ein entsprechendes Review-Signal.
- `reviewItems` enthalten das Signal `editorial_review_requested`.
- `requiresHumanReview=true`.
- Finalize blockiert Auto-Finalize, wenn manuelle Pruefung angefragt wurde.
- UI-Hinweis bleibt ruhig:
  `Du hast manuelle Prüfung gewünscht. Wir geben das in die redaktionelle Prüfung; es wird nicht automatisch veröffentlicht.`

## Finalize policy

- Offene `requiredBeforeFinalize`-Clarifications blockieren Finalize mit `quality_clarification_required`.
- Explizite manuelle Review-Wuensche blockieren Finalize mit `editorial_review_required`.
- Draft-/Review-Fassungen bleiben speicherbar.

## Model parity harness

Neuer deterministischer Harness ohne externe Provider-Calls:

- `tests/create-safety-model-parity.contract.test.ts`

Simulierte Szenarien:

- `deterministic_gate`
- `standard_analyze_output`
- `sealed_factcheck_output`
- `presentation_pass_output`
- `degraded_fallback_output`

Geprueft wird, dass kein Szenario schwächer wird als der deterministische Gate-Floor bei:

- Safety-Decision
- Claim-Publication-Status
- `missing_place`
- `missing_source`
- `editorial_review_requested`
- PII-Redaction
- `noAutoPublish` / kein stilles Finalize

## No raw PII/place leak rules

- Telemetry speichert nur Flags, Counts und Gate-Metadaten.
- Review-Items enthalten nur redigierte Vorschauen.
- Clarification-Fragen sind generisch und nennen keine uebernommenen raw Privatadressen.
- Safety-Panel zeigt nur redigierte Texte oder allgemeine Fragen.

## Geaenderte Bereiche

- `apps/web/src/features/create/safety/createSafetyLexicon.ts`
- `apps/web/src/features/create/safety/createInputSafety.ts`
- `apps/web/src/features/create/safety/createClaimSafety.ts`
- `apps/web/src/features/create/safety/createSafetyReviewContract.ts`
- `apps/web/src/features/create/safety/createSafetyTelemetry.ts`
- `apps/web/src/app/api/contributions/finalize/route.ts`
- `apps/web/src/components/analyze/CreateInputSafetyPanel.tsx`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- neue/erweiterte Tests unter `apps/web/tests/create-*-safety-*.test.ts`

## Validation

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/create-safety-quality-clarifications.contract.test.ts \
  tests/create-safety-model-parity.contract.test.ts \
  tests/create-finalize.quality-clarification-gate.test.ts \
  tests/create-input-safety.contract.test.ts \
  tests/create-claim-safety.contract.test.ts \
  tests/create-input-safety-lexicon.contract.test.ts \
  tests/create-input-safety-telemetry.contract.test.ts \
  tests/create-safety-review-contract.test.ts \
  tests/create-safety-corpus.de.contract.test.ts \
  tests/create-safety-corpus.en.contract.test.ts \
  tests/create-safety-corpus.multilingual.contract.test.ts \
  tests/create-analyze.safety-gate.test.ts \
  tests/create-save.safety-gate.test.ts \
  tests/create-finalize.safety-gate.test.ts \
  tests/create-finalize.claim-safety-gate.test.ts
```
