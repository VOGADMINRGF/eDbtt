# CREATE-PLACE-CLARIFICATION-INTAKE-09

Status: done  
Datum: 2026-06-04

## Was wurde gebaut?

- `planner_only` fuehrt jetzt einen kleinen Place-/Ort-Klaerungs-Contract:
  - `placeCandidates`
  - `localIssueCandidates`
  - `needsPlaceClarification`
  - `placeClarificationQuestion`
  - `scopeConfidence`
- Lokale Strassen-/Allee-Signale wie `Clara-Pankowr Allee` werden im `/create`-Mehrthemenpfad nicht mehr verschluckt, sondern als eigener Themenast erhalten.
- Wenn fuer ein lokales Anliegen Stadt oder Bezirk noch nicht klar sind, zeigt das Multi-Branch-Board:
  - `Ort noch klären`
  - `Damit dein Anliegen richtig zugeordnet wird, brauchen wir noch den Ort.`
  - `Ort ergänzen`
  - `Ohne Ort als Entwurf speichern`
- Branch-Ledger und Account-Profil speichern und zeigen:
  - `placeCandidates`
  - `needsPlaceClarification`
  - `placeClarificationQuestion`
  - `placeClarificationStatus`
  - `suppliedPlace`
- Profil-/Ledger-Anzeige markiert denselben Arbeitsstand als `Ort noch offen` oder `Ort ergänzt: ...`.

## Guardrails

- Keine automatische Veröffentlichung.
- Keine automatische Stimme.
- Kein automatisches Mitzählen.
- Kein automatisches Merge.
- QR-/Swipe-Aktionen bleiben Draft/Preparation.
- Die neue lokale Erkennung dient nur Place-/Scope-Klaerung und Branch-Erhalt, nicht fachlicher Themen-Neuerfindung.

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-place-clarification.contract.test.tsx`

Ergebnis:

- Typecheck gruen
- Lint gruen
- 4/4 Testdateien gruen
- 21/21 Tests gruen

## Bewusst offen

- Echtes Publish-/Share-/QR-Code-Verhalten bleibt offen.
- Echtes Voting/Mitzählen bleibt offen.
- Echtes Merge in bestehende Themen/Claims bleibt offen.
- Admin-/Review-Freigaben bleiben unveraendert.
