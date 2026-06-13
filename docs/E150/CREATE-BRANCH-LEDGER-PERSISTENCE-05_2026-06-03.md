# CREATE-BRANCH-LEDGER-PERSISTENCE-05

Stand: 2026-06-03

## Was wurde gebaut?

- `ContributionPackage`- und Branch-Entscheidungen aus `/create` werden beim bestehenden Draft-Save als langlebiger `createContributionLedger` mitgespeichert.
- Der Ledger bildet pro Beitragspaket `draftSaveStatus`, Originaltext, Zeitstempel und mehrere `CreateBranchLedgerItem`-Äste ab.
- Pro Ast werden Titel, Kurzbeschreibung, ausgewählte Draft-Aktion, Draft-Status, Visibility-Intent, Claim-Candidates, Haltungsstatus, Review-Hinweise und optionale `ExistingMatchDecision` gespeichert.
- `ExistingMatchDecision` bleibt strikt `recordedAsDraftOnly: true`.
- Im Account-Bereich gibt es den neuen Abschnitt `Meine Beiträge und Themenstände` mit Datum, Kurzfassung, einklappbarem Originaltext, Branch-Status und Rückweg nach `/create`.
- Save-Failure bleibt lokal abgesichert; die Serverpersistenz ergänzt nur den bestehenden Draft-/Handoff-Pfad.

## Was ist bewusst nur vorbereitet?

- Kein echter Publish-Pfad für QR oder Swipes.
- Kein echtes Counting von `count_my_position`.
- Kein Merge in bestehende Claims oder Themen.
- Keine neue Bewertungs- oder Governance-Logik.
- Kein automatisches Wiederherstellen kompletter Multi-Branch-UI-Zustände über neue Produktpfade hinaus; der MVP stellt den Arbeitsstand im Ledger und den ursprünglichen Draft-Text zuverlässig bereit.

## Guardrails

- Keine automatische Veröffentlichung.
- Keine automatische Stimme.
- Kein automatisches Mitzählen.
- Kein automatisches Mergen.
- QR- und Swipe-Aktionen bleiben `Draft/Preparation`.
- GPT-inferierte Haltung bleibt Draft-Metadatum und wird nicht gezählt.
- Es werden keine Fake-Matches und keine Fake-Zahlen erzeugt.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-handoff.persistence.route.test.ts tests/account-organization-dashboard.page.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- 4/4 fokussierte Testdateien grün
- 22/22 Tests grün

## Bewusst offen bleibende Folge-Slices

- `CREATE-EXISTING-MATCH-COUNTING-06`
- `CREATE-QR-SWIPES-PUBLISH-PREP-07`
