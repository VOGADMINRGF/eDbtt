# CREATE-BRANCH-HANDOFF-WORKBENCH-12

Stand: 2026-06-05

## Was wurde gebaut?

- Zentrale Branch-Handoff-Matrix in `apps/web/src/features/create/branchHandoffTargets.ts`
  - `review_or_sources` -> `factcheck_review`
  - `qr_poll_prepare` -> `qr_participation`
  - `public_swipes_prepare` -> `swipe_review`
  - `save_branch_only` -> `ledger_detail`
  - offene branch-scoped Ortsklärung -> `place_clarification`
- `createContributionLedger` speichert pro Themenast jetzt:
  - `handoffStatus`
  - `handoffTargetType`
  - `handoffTargetUrl`
  - optionalen `reviewPreparationDraft` mit offenen Fragen, Suchbegriffen und Quellenbedarf
- Das Completion-Modal im Multi-Branch-Board enthält jetzt den Primär-CTA:
  - `Ausgewählte Themen weiter aufbauen`
- Nach Klick erscheint eine Batch-Handoff-Übersicht:
  - Thema
  - gewählte Aktion
  - nächster Arbeitsraum
  - Guardrail-Status
  - passende CTA pro Ast
- Der Account-/Ledger-Bereich zeigt keine generische Rückführung nach `/create` mehr, sondern branch-spezifische CTAs oder ehrlich `Arbeitsentwurf vorbereitet`.
- Semantisch ähnliche Beitragspakete werden im Account nur als Hinweis markiert:
  - `Ähnliche Entwürfe erkannt.`

## Was ist bewusst nur vorbereitet?

- `review_or_sources` bereitet nur Prüf-/Quellenarbeit vor.
- Es gibt keinen automatischen Research-, Factcheck- oder Deep-Search-Start.
- QR-/Swipe-Ziele bleiben reine Draft-/Review-Ziele.
- Offene Ortsklärung bleibt branch-scoped und kann als `route_missing` ehrlich im Ledger landen.

## Guardrails

- Keine automatische Veröffentlichung.
- Keine automatische Stimme.
- Kein automatisches Mitzählen.
- Kein automatisches Merge.
- Kein heimlicher Kostenlauf.
- Swipes, QR, Existing-Match und Place-Clarification bleiben Draft/Preparation only.

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-place-clarification.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/create-branch-handoff-workbench.contract.test.tsx`

Ergebnis:

- `typecheck` grün
- `lint` grün
- fokussierte Suite grün (`7/7` Dateien, `38/38` Tests)

## Folge-Slices bleiben offen

- echter branch-spezifischer Review-/Factcheck-Start
- echter QR-Link-/Beteiligungsraum-Publish
- echte Swipe-Freigabe
- echte Merge-/Counting-Folgen
- Admin-/Review-Freigaben für spätere Veröffentlichung
