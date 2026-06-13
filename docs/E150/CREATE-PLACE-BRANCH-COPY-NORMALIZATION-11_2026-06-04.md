# CREATE-PLACE-BRANCH-COPY-NORMALIZATION-11

## Was wurde gebaut?

- Der lokale `/create`-Place-Branch zeigt jetzt einen editierbaren Slot fuer Strasse und Ort.
- Im betroffenen Themenast erscheint:
  - `Ort und Straße noch klären`
  - `Erkannte Straße: ...`
  - Feld `Straße`
  - Feld `Stadt oder Bezirk`
  - CTA `Ort und Straße übernehmen`
  - Sekundär `Ohne Ort als Entwurf speichern`
- Die erkannte Strasse wird nur in der UI-Schreibweise normalisiert, z. B.:
  - `clara-pankower allee` -> `Clara-Pankower Allee`
  - `rad weg` -> `Radweg`
- Registry-/Directory-Hinweise bleiben best effort:
  - mit Kandidat: `Mögliche Zuordnung ... – bitte prüfen.` oder `Mögliche Zuständigkeit ... – bitte prüfen.`
  - ohne Kandidat: `Keine sichere Zuordnung gefunden – bitte Ort ergänzen.`

## Contract / Persistenz

- Branch-scoped erweitert:
  - `detectedStreetName`
  - `correctedStreetName`
  - `suppliedPlace`
  - `placeClarificationStatus`
  - `placeResolutionStatus`
  - `placeResolutionCandidateLabel`
  - `placeResolutionSource`
- Ledger und Profil zeigen jetzt Strasse und Ort getrennt an, ohne globales Orts-Gate.

## Guardrails

- Keine Map-Integration
- Keine Google-Maps-Abhaengigkeit
- Keine automatische Veroeffentlichung
- Kein Vote
- Kein Mitzählen
- Kein Merge
- Keine Fake-Registry-Treffer
- Alles bleibt Draft/Preparation

## Bewusst nur vorbereitet

- Karten-/Marker-UI bleibt Folge-Slice.
- `/registry` wird weiterhin nicht als vollstaendiges Strassenkataster behauptet.
- Nutzerkorrekturen werden nur als Draft-/Preparation-Stand gespeichert.

## Verifikation

Ausgeführt:

- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- Fokus-Suite grün
