# PRODUCTIVE-GRAPH-MERGE-GATE-18

Datum: 2026-06-06

## Ziel

Einen kontrollierten produktiven Merge-Gate-Pfad für bereits geprüfte
`GraphMergeCandidate`-Arbeitsstände ergänzen, ohne Auto-Merge, Auto-Publish oder
einen versteckten Seiteneffekt aus Analyse-, Factcheck- oder Review-Pfaden
einzuführen.

## Merge-Gate-Regeln

- `sourceSupport` `none` oder `open` blockiert produktive Zusammenführung mit
  `blocked_source_open`.
- `truthStatus` `draft_analysis`, `source_open` oder `review_required`
  blockiert produktive Zusammenführung mit `blocked_truth_guard`.
- `duplicate_suspected` oder offene `duplicateCandidates` blockieren mit
  `blocked_duplicate_unresolved`.
- Für `confirm` muss der Kandidat zuerst über den Admin-Pfad vorbereitet sein:
  `reviewStatus=staged` und `mergeStatus=merge_ready`.
- `accepted_for_staging` ist ausdrücklich noch kein produktiver Merge.
- `reviewRecommended=true` verlangt für die Bestätigung eine explizite
  Override-Begründung (`override_required`).
- `sealed_verified` hilft, ersetzt aber keine Admin-Bestätigung, keine
  Dedupe-Prüfung und keine Audit-Pflicht.

## Audit-Trail

Persistiert wird ein eigener `GraphMergeAuditEntry` mit:

- `merge_confirmed`
- `merge_blocked`
- `merge_reverted`
- `duplicate_resolved`
- `override_confirmed`

Jeder Eintrag hält fest:

- `candidateId`
- `sourceType`
- `sourceId`
- `mergedBy`
- `mergedAt`
- `reason`
- optionale `overrideReason`
- `previousState`
- `nextState`
- `truthStatus`
- `sourceSupport`
- `verificationLabel`
- `noAutoPublish=true`

Der Audit-Trail ist persistent und nicht nur Logging.

## Admin-Flow

Der bestehende Admin-Pfad
`/api/admin/graph-merge-candidates/[candidateId]` wurde erweitert um:

- `resolve_duplicate`
- `prepare_productive_merge`
- `confirm_productive_merge`
- `revert_productive_merge`

`/admin/review` zeigt jetzt zusätzlich:

- Merge-Gate-Status
- Blockergrund
- Truth-/Source-Status
- Duplikathinweise
- letzten Audit-Eintrag
- Admin-Aktionen für Dedupe-Auflösung, Merge-Vorbereitung, Bestätigung und Revert

Der CTA `Produktiven Merge bestätigen` erscheint nur, wenn das Gate offen ist
oder nur noch eine Override-Begründung fehlt.

## Account-Wording

`/account` bleibt konservativ:

- `Graph-Merge in Prüfung`
- `Für Zusammenführung vorbereitet`
- `Zusammenführung bestätigt`
- `Noch nicht veröffentlicht`

Zusammenführung wird damit ausdrücklich nicht als Veröffentlichung dargestellt.

## Graph-Write-Entscheidung

Der aktuelle Slice führt bewusst keinen direkten `core/graph`-Write ein.

Stattdessen gilt:

- produktive Bestätigung wird als persistierter, auditierbarer Merge-Receipt
  bestätigt
- kein `core/graph`-Write aus Analyse
- kein `core/graph`-Write aus Factcheck
- kein `core/graph`-Write aus `accepted_for_workup`
- kein Auto-Merge aus Statuswechseln

Damit bleibt der produktive Write-Pfad explizit getrennt und später sauber
anschließbar.

## Dedupe-Regeln

- `mark_duplicate` hält Kandidaten bewusst blockiert
- `resolve_duplicate` leert die offenen Hinweise und schreibt einen
  `duplicate_resolved`-Audit-Eintrag
- erst danach ist `prepare_productive_merge` möglich

## Tests und Ergebnis

Abgedeckt wurden unter anderem:

- Candidate mit `sourceSupport open` kann nicht produktiv gemerged werden
- `duplicate_suspected` blockiert bis zur Duplikatentscheidung
- `accepted_for_staging` ist noch kein produktiver Merge
- nur Admin/Redaktion kann bestätigen
- Merge-Bestätigung schreibt Audit-Einträge
- Analyze-Route löst weiter keinen produktiven Graph-Merge aus
- abgeschlossene Factcheck-Jobs lösen keinen Auto-Merge aus
- `accepted_for_workup` löst keinen Auto-Merge aus
- Account-Wording trennt Zusammenführung weiter von Veröffentlichung
- Override verlangt Begründung und Audit

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/account-graph-candidate.contract.test.tsx tests/admin-review.page.test.tsx tests/create-analyze.route.test.ts tests/admin-editorial-review.route.test.ts tests/factcheck-job-runner.contract.test.ts`

## Offene Punkte

- Der eigentliche `core/graph`-Write bleibt in diesem Slice absichtlich
  deaktiviert und muss, falls gewünscht, in einem separaten Folgepfad mit
  explizitem Adapter-/Schema-/Rollback-Design eingeführt werden.
