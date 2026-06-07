# REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B

Datum: 2026-06-06

## Ziel

Den noch offenen Alt-Drift im breiten `review-queue.readmodel`-Seed- und Demopfad
nach `FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17` auf konservative review-first
Semantik schließen.

## Umgesetzt

- `features/factcheck/workflow.ts` vereinheitlicht die konservativen
  Nutzerlabels für Factcheck-Arbeitsstände:
  - `queued` -> `Quellenprüfung angefragt`
  - `running` -> `Quellenprüfung läuft`
  - `completed` -> `Ergebnis liegt vor`
  - `needs_manual_review` -> `Manuelle Prüfung erforderlich`
  - `failed` -> `Prüfung fehlgeschlagen / erneut prüfen`
- `features/reviewQueue.ts` nutzt für fehlgeschlagene Factcheck-Items dieselbe
  konservative Workflow-Beschriftung.
- `/account` und `/admin/review` zeigen Factcheck-Status jetzt über denselben
  konservativen Label-Vertrag statt über rohe Statuscodes.
- `apps/web/tests/review-queue.readmodel.test.ts` seedet mehrere
  Factcheck-Arbeitsstände (`seal_review_required`, `queued`, `running`,
  `completed`, `needs_manual_review`, `failed`) mit Truth-/Source- und
  Guardrail-Feldern.
- Der Social-Distribution-Seed im breiten Readmodel-Test wurde von einem alten,
  ungültigen `review_required` auf den kanonischen Status `review_requested`
  umgestellt.

## Guardrails

- Kein Auto-Publish
- Kein Auto-Graph-Merge
- Kein Auto-Dossier
- Kein Auto-Anlassraum
- Kein Vote
- Keine produktive Graph-Node-Darstellung aus Graph-Kandidaten
- `sealed_verified` bleibt nur über `requestedAction=sealed_factcheck` plus
  `sealGranted=true` möglich

## Testabdeckung

- Der breite Readmodel-Test prüft jetzt explizit die konservativen
  Factcheck-Workflowlabels für `queued`, `running`, `completed`,
  `needs_manual_review` und `failed`.
- Seed-Daten werden zusätzlich direkt auf Guardrails geprüft:
  - `truthStatus`
  - `sourceSupport`
  - `sourceStatus`
  - `verificationLabel`
  - `reviewRecommended`
  - `noTruthPromotion`
  - `noAutoGraphPromotion`
  - `noAutoPublish`
  - `noAutoDossier`
  - `noAutoAnlassraum`
  - `noAutoVote`
- Der Social-Distribution-Seed bleibt ein review-first Arbeitsstand und
  suggeriert weder Veröffentlichung noch produktive Verifizierung.

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/account-factcheck-jobs.contract.test.tsx tests/account-editorial-review.contract.test.tsx tests/account-graph-candidate.contract.test.tsx`

## Restpunkte

- Keine neuen Produktpfade in diesem Slice.
- Kein produktiver Graph-Merge, kein neuer Runner und kein DeepSearch-Autostart.
