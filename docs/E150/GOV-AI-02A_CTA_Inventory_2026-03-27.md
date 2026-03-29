# GOV-AI-02A — CTA-Ist-Contract Inventory (2026-03-27)

Zweck: aktuellen CTA-/Match-Contract rund um `/create` inventarisieren und regressionssicher machen, ohne neue CTA-Regel zu setzen.

## 1) Canonical CTA-Keyset (Ist)

Quelle: `apps/web/src/features/create/analyzeContract.ts`

`CreateAnalyzeCtaId`:

- `zustimmen`
- `anders_sehen`
- `dossier_oeffnen`
- `anlassraum_oeffnen`
- `perspektive_anhaengen`
- `neu_anlegen`

## 2) Match -> CTA-Ableitung (Ist)

Quelle: `apps/web/src/features/create/matchService.ts` (`deriveSuggestedCtas`)

- `no_match` -> `neu_anlegen`, `perspektive_anhaengen`
- `same_anlassraum` -> `anlassraum_oeffnen`, `perspektive_anhaengen`, `anders_sehen`, `neu_anlegen`
- `related_dossier` -> `dossier_oeffnen`, `perspektive_anhaengen`, `neu_anlegen`
- `duplicate_risk` -> `anders_sehen`, `perspektive_anhaengen`, `neu_anlegen`
- `exact_claim` / `related_claim` -> `zustimmen`, `anders_sehen`, `perspektive_anhaengen`, `neu_anlegen`

## 3) Fallback-Verhalten (Ist)

Quelle: `apps/web/src/features/create/matchService.ts` (`fallbackNoMatch`)

- Ohne belastbaren Treffer: `matchType=no_match`, `matchStrength=none`.
- Bei degradierten Quellen (`sourceState=degraded`) bleibt CTA-Fallback identisch (`neu_anlegen`, `perspektive_anhaengen`), nur Begruendung/`sourceErrors` unterscheiden sich.
- Kein Silent-Merge und kein Auto-Publish werden durch den Handoff-Contract erzwungen.

## 4) Handoff-Contract in `/create` (Ist)

Quelle: `apps/web/src/features/create/ctaHandoff.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`

- CTA-Klick erzeugt nur `CreateCtaHandoff` (`requiresConfirm: true`).
- Flags bleiben zwingend gesetzt: `noAutoPublish: true`, `noSilentMerge: true`.
- Navigationsaktion nur bei `actionType=open` und gueltigem `targetRef`; sonst prepare-only.

## 5) Test-Baseline

- `apps/web/tests/create-match.service.test.ts` friert CTA-Keysets je Match-Typ und fallback reasons ein.
- Bestehende Handoff-Guardrail-Tests bleiben aktiv:
  - `apps/web/tests/create-cta-handoff.test.ts`

## 6) Offene Decision-Boundary (Parent GOV-AI-02)

Nicht entschieden (bewusst offen):

- Priorisierung/Reduktion der CTA-Ausgabe pro Match-Typ.
- Kanonische Primär-CTA-Regel je Kontext.
- Erweiterte Routing-/CTA-Policy fuer Grenzfaelle.

Diese Punkte bleiben im Parent `GOV-AI-02` (`needs_decision`).
