# FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17

Datum: 2026-06-06

## Ziel

Den bestehenden `factcheck_jobs`-Pfad vom reinen Entitlement-/Queue-Marker zu einem kanonischen produktiven Review-First-Jobpfad erweitern.

## Umgesetzt

- `features/factcheck/db.ts` erweitert das zentrale Job-Modell um:
  - `sourceType`, `sourceId`, `reviewRequestId`, `graphCandidateId`
  - `requestedAction`
  - `gate`
  - Truth-/Source-/Verification-Felder
  - `providerMatrix`
  - `result`
  - Guardrails `noAutoPublish`, `noAutoGraphPromotion`, `noAutoDossier`, `noAutoAnlassraum`, `noAutoVote`
- `features/factcheck/jobRunner.ts` ergänzt:
  - `refreshFactcheckJobState`
  - `runFactcheckJob(jobId)`
  - kontrollierte Result-Bildung ohne Auto-Publish oder Auto-Merge
- `/api/factcheck/enqueue` queued nur bestätigte produktive Jobs und blockt:
  - `login_required`
  - `entitlement_required`
  - `pricing_required`
  - `confirmation_required`
  - `blocked_by_spam`
- `/api/factcheck/status/[jobId]`, `/api/factcheck/status/[jobId]/seal` und `/api/factcheck/result/[contributionId]` serialisieren den erweiterten Job-/Result-Pfad.
- `features/reviewQueue.ts` berücksichtigt Factcheck-Jobs in `queued`, `running`, `completed`, `failed`, `cancelled`, `needs_manual_review` und `seal_review_required`.
- `/account` zeigt eine eigene Factcheck-Arbeitsstand-Sektion.
- `/admin/review` zeigt eine eigene Factcheck-Job-Sektion mit Review-First-Aktionen.
- `features/graphMergeCandidates.ts` kann aus Factcheck-Ergebnissen nur review-first Graph-Kandidaten vorbereiten.

## Guardrails

- Kein Auto-Publish
- Kein Auto-Graph-Merge
- Kein Auto-Dossier
- Kein Auto-Anlassraum
- Kein Vote
- Keine stillen Kosten
- `sealed_verified` nur bei `requestedAction=sealed_factcheck` und `sealGranted=true`

## Result-Logik

- Ohne Quellen bleibt das Ergebnis `sourceSupport=open` und `reviewRecommended=true`.
- Bei Fallback oder Disagreement bleibt das Ergebnis `needs_manual_review`.
- Ein Seal wird nur aus einem abgeschlossenen `sealed_factcheck` vergeben.
- Auch abgeschlossene Ergebnisse bleiben Arbeitsstände und erscheinen in Account/Admin als `Noch nicht veröffentlicht`.

## Tests

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-enqueue.auth.route.test.ts tests/factcheck-job-runner.contract.test.ts tests/account-factcheck-jobs.contract.test.tsx tests/account-editorial-review.contract.test.tsx tests/admin-review.page.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts`

## Offene Restpunkte

- Der breite `review-queue.readmodel`-Alt-Testlauf enthält separaten Seed-/Schema-Drift außerhalb dieses Slices und wurde deshalb nicht als Abnahmesuite für Task 17 herangezogen.
