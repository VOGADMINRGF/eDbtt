# ANLASSRAUM-PUBLIC-INPUT-01

Stand: 2026-05-17  
Status: done

## Ziel

Der öffentliche Anlassraum soll direkte Eingaben aufnehmen können für:

- Frage
- Quelle
- Perspektive
- Option
- Hinweis

Dabei bleibt alles review- und risk-gated. Sichtbar heißt weiterhin nicht automatisch geprüft oder amtlich.

## Umsetzung

Die öffentliche Surface `/runden` hat jetzt einen direkten Eingabeblock `Direkt öffentlich einreichen`.
Er hängt nicht an einer zweiten Beteiligungssignal-Domain, sondern schreibt in dieselbe
`RegionParticipationSignal`-Review-Runtime wie der bestehende regionale Beteiligungspfad.

Neuer POST-Pfad:

- `/api/runden/public-input`

Wiederverwendete Bausteine:

- `features/region/regionParticipationSignals.ts`
- `features/region/publicationRiskLadder.ts`
- `features/region/server/participationSignalReviewRuntime.ts`

Neue dünne Mapping-Foundation:

- `features/topicRound/publicInput.ts`

## Mapping

- `Frage` -> `public_question`
- `Quelle` -> `public_source_hint`
- `Perspektive` -> `public_contribution`
- `Option` -> `public_claim`
- `Hinweis` -> heuristisch `public_source_hint` / `public_question` / sonst `public_contribution`

## Guardrails

- keine zweite Beteiligungssignal-Domain
- kein Social Publishing
- keine automatische amtliche Antwort
- keine automatische Dossier-Finalisierung
- keine automatische Anlassraum-Finalisierung
- keine Repräsentativitätsbehauptung
- `noAutoPublish`, `noAutoCreateDossier`, `noAutoCreateAnlassraum`, `noRepresentativeClaim` bleiben auf jedem erzeugten Signal aktiv

## Sichtbares Ergebnis

- `/runden` erklärt jetzt nicht nur Share/QR/Event/Medien, sondern nimmt direkte öffentliche Eingaben an
- der Surface-Text sagt explizit:
  - `Sichtbar heißt nicht automatisch geprüft oder amtlich.`
  - `Öffentliche Eingaben sind keine repräsentative Abstimmung.`
- erfolgreiche Eingaben zeigen den resultierenden Visibility-Status als
  - `sichtbar, aber nicht geprüft`
  - oder `reviewpflichtig`

## Validierung

Ausgeführt:

- `pnpm -C apps/web exec vitest run tests/runden-public-input.route.test.ts tests/runden-public-sharing-guide.contract.test.tsx tests/runden-page.acceptance.test.ts tests/participation-signal-review-runtime.test.ts tests/region-participation-signals.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Ergebnis:

- 5 Testdateien grün
- 21 Tests grün
- Typecheck grün
- Lint grün

## Offen

- breiterer Visibility-/Risk-Ladder-Rollout ausserhalb dieses Pfads bleibt `PUBLICATION-RISK-LADDER-02`
- optionale echte externe AI-/Quellenadapter bleiben `REGION-INTELLIGENCE-02`
- weitergehende öffentliche Anlassraum-Spezialpfade pro Einzelraum bleiben ein möglicher späterer UX-/Routing-Slice, sind aber für diesen Schnitt nicht nötig
