# CREATE-EXISTING-MATCH-COUNTING-06

Stand: 2026-06-04

## Umgesetzt

- Existing-Match-Daten im `/create`-Multibranch-Flow wurden auf echte Draft-only-Entscheidungen erweitert:
  - `targetType`
  - `matchedClaimText`
  - echte Support-/Oppose-/Neutral-Counts
  - `matchConfidence`
  - `whyMatched`
  - `differenceReason`
  - `userNuanceText`
  - `recordedAsDraftOnly`
  - `confirmedAt/countedAt/mergedAt = null`
- Die Match-Box erscheint nur noch bei echten Countdaten und zeigt keine Fake-Zahlen oder simulierten Match-Hinweise.
- Nutzer können pro Themenast bewusst vormerken:
  - `count_my_position`
  - `add_as_nuance`
  - `keep_separate`
  - `count_as_opposition`
  - `request_review`
- Bei `high_risk` und `legal_sensitive` bleibt Mitzählen nur als reviewpflichtige Vormerkung sichtbar.
- Ledger und Account nutzen dieselbe `packageId`-/`branchId`-Upsert-Semantik und zeigen Match-Entscheidungen als Arbeitsstand statt als gezählte oder gemergte Aktion.

## Guardrails unverändert

- Keine automatische Veröffentlichung.
- Keine automatische Stimme.
- Kein automatisches Mitzählen.
- Kein automatisches Mergen.
- Keine Fake-Matches.
- Keine Fake-Zahlen.
- Alles bleibt Draft/Preparation, bis ein späterer separater Slice explizite Bestätigungspfade baut.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/account-organization-dashboard.page.test.tsx`

Ergebnis: grün.

## Bewusst offen

- `CREATE-QR-SWIPES-PUBLISH-PREP-07`
- echtes Counting bleibt ausdrücklich out of scope
- echtes Merge in bestehende Claims/Themen bleibt ausdrücklich out of scope
