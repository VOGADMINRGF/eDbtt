# CREATE-PLACE-REGISTRY-JURISDICTION-08

## Was wurde gebaut?

- `apps/web/src/features/create/placeResolution.ts` fuehrt einen kleinen Shared Resolver `resolvePlaceAndJurisdiction(input, profileContext)` ein.
- Der Resolver nutzt vorhandene amtliche Regions-/Verzeichnisdaten (`features/region/directory.ts`) statt einer Parallel-Registry.
- Der `/create`-Followup-/ContributionPackage-Contract fuehrt jetzt:
  - `PlaceResolutionResult`
  - `JurisdictionCandidate`
  - `confirmedPlaceCandidateId`
  - `placeConfirmationStatus`
- `CreateClient` gibt den vorhandenen Profilort (`overview.profile.publicLocation` / `publicProfile`) an den bestehenden `/api/create/intelligent-followup`-Pfad weiter.
- Das Multi-Branch-Board zeigt bei unsicherer Orts-/Straßenauflösung:
  - `Ort/Straße prüfen`
  - `Diese Straße konnten wir nicht eindeutig finden.`
  - `Meintest du: ...?`
  - `Ja, übernehmen`
  - `Ohne Straße fortfahren`
  - `Mögliche Zuständigkeit: ... – bitte prüfen.`
- Ledger und Account-Ansicht speichern und zeigen denselben Draft-Arbeitsstand inkl. Ortsvorschlag und möglicher Zuständigkeit.

## Guardrails

- Keine automatische Veröffentlichung.
- Keine automatische Stimme.
- Kein automatisches Mitzählen.
- Kein Merge.
- Keine stillen Ortskorrekturen.
- Keine Fake-Orte und keine Fake-Zahlen.
- Zuständigkeiten werden nur als `Mögliche Zuständigkeit ... bitte prüfen.` vorgemerkt.

## Tests / Revalidierung

- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx`

Ergebnis:

- Typecheck gruen
- Lint gruen
- 3/3 Testdateien gruen
- 18/18 Tests gruen

## Bewusst offen

- Keine finale juristische Zuständigkeitsentscheidung
- Kein echter Publish-/Share-/QR-Code-Pfad
- Kein echtes Voting/Mitzählen
- Kein Merge in bestehende Themen/Claims
