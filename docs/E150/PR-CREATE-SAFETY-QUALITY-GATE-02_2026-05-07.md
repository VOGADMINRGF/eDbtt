# PR-CREATE-SAFETY-QUALITY-GATE-02

Datum: 2026-05-07

## Scope

Safety-/Input-Qualitaets-Hardening fuer den bestehenden `/create`-Safety-Gate nach PR #91.

Nicht Teil dieses Slices:
- kein Redesign von `/create`
- keine Aenderung an der kuratierten Dialog-/Workspace-Struktur ausser `CreateInputSafetyPanel`
- keine externen Moderationsprovider
- keine Auto-Publish-, Voting- oder Cost-Book-Logik

## Telemetry Privacy Rules

`apps/web/src/features/create/safety/createSafetyTelemetry.ts` speichert nur:

- `decision`
- `severity`
- `findingKinds`
- `findingCounts`
- `requiresHumanReview`
- `crossLingualRisk`
- `quality.overall`
- `redactionApplied`
- `factCheckCandidateCount`
- `graphReviewHintCount`
- `routeStage`
- optional `runId` / `correlationId`
- `timestamp`

Nicht gespeichert werden:

- unredigierter Rohtext
- Telefonnummern
- E-Mail-Adressen
- Adressen / PLZ
- Namen oder Doxxing-Fragmente

## Lexicon Categories

`apps/web/src/features/create/safety/createSafetyLexicon.ts` fuehrt die Pattern-Gruppen intern versionierbar aus:

- `pii`
- `doxxing`
- `threat_concrete`
- `threat_implicit`
- `self_justice`
- `insult_public_actor`
- `insult_private_person`
- `group_abuse`
- `political_framing`
- `unsupported_allegation`
- `corruption_or_capture_claim`
- `unverified_number`
- `source_bluffing`
- `censorship_counterclaim`
- `spam_campaign`

Startsprachen / Risk-Hinweise:

- `de`
- `en`
- vorbereitete Risk-Hints fuer `tr`, `ar`, `ru`, `uk`, `pl`

## Review Contract

`apps/web/src/features/create/safety/createSafetyReviewContract.ts` liefert redigierte Review-Items mit:

- `id`
- optional `draftId`
- optional `runId`
- `decision`
- `severity`
- `redactedTextPreview`
- `findingKinds`
- `blockedReasons`
- `factCheckCandidateCount`
- `graphReviewHintCount`
- `createdAt`
- `status`

Ergaenzende UI-Hilfen (`code`, `action`, `summary`, optional `sanitizedExcerpt`) bleiben ebenfalls PII-frei.

## Factcheck / Graph Gating

- Konkrete Drohung oder Doxxing-CTA => `blocked`
- Drittpersonen-PII plus Vorwurf => mindestens `moderation_required`
- Selbstjustiz / implizite Drohung / Group Abuse => `moderation_required`
- Schwere unbelegte Behauptungen, Korruptions-/Capture-Claims, Source-Bluffing oder unbelegte Zahlen => `factcheck_required`
- Sichere Prueffragen duerfen weiterlaufen und werden als `factCheckCandidates` mit `truthStatus=open` vorbereitet
- Cross-lingual Risk => `graph_review_required`
- `noSilentMerge=true` bleibt Standard
- `factcheck_required`-Claims sind in `/api/contributions/finalize` nicht als Tatsachen-Proposals finalisierbar

## No Raw PII Guarantee

- `redactCreateSafetySensitiveText` entfernt E-Mail, Telefon, Adresse und PLZ deterministisch
- Review-Preview und Excerpts werden nur ueber redigierte oder sanitizte Texte gebaut
- Telemetry referenziert nur Metadatenfelder
- Adversarial Fixtures bleiben auf Testdaten begrenzt und erscheinen nicht in der oeffentlichen Copy

## UI Scope

Nur `apps/web/src/components/analyze/CreateInputSafetyPanel.tsx` wurde erweitert:

- Klarstellung gegen Zensur-Missverstaendnis
- Anzeige von `safeRewrite` und redigierter Fassung statt Rohtext
- Review-Hinweise ohne PII-Leak
- naechste Aktionen fuer Ueberarbeitung / sichere Fassung / Faktencheck / Moderation / Block

## Test Matrix

Validiert mit:

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/create-input-safety.contract.test.ts \
  tests/create-input-safety-lexicon.contract.test.ts \
  tests/create-input-safety-telemetry.contract.test.ts \
  tests/create-safety-review-contract.test.ts \
  tests/create-analyze.safety-gate.test.ts \
  tests/create-save.safety-gate.test.ts \
  tests/create-finalize.safety-gate.test.ts
```

Abgedeckte adversarial Faelle:

1. broken German with civic intent
2. long rambling input
3. self PII
4. third-party phone + call-to-action
5. third-party address + accusation
6. insult only
7. political framing only
8. concrete violence
9. vague self-justice
10. investor / corruption allegation
11. unverified number
12. `Faktencheck ist Zensur`
13. source bluffing
14. mixed de/en
15. tr/ar/ru/uk/pl placeholders
16. telemetry without raw email / phone / address
17. review items without raw PII
18. finalize blocks blocked / moderation / factcheck factual claims
19. safe question may proceed
20. redaction idempotence
