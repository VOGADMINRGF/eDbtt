# COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-UI-06

## Ausgangslage

Nach `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05` war der öffentliche
Intake über `/api/community/source-review/submissions` bereits gehärtet, aber noch
nirgendwo sichtbar verdrahtet. `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-UI-06`
sollte deshalb einen kleinen öffentlichen Einstieg ergänzen, ohne eine zweite
Community-Welt, Wahrheitslogik, Verifikationsbehauptung oder neue Moderationsfläche
aufzubauen.

## Umsetzung

- Neue kleine Client-Komponente
  `apps/web/src/features/participation/PublicCommunitySourceSubmissionForm.tsx`
  ergänzt.
- Die Form hängt nur auf `/beteiligung/[slug]` und nur dann, wenn der Raum aus der
  echten veröffentlichten Participation-Space-Runtime kommt (`detail.source === "runtime"`).
- Gesendet werden nur minimale review-first Felder an die bestehende API:
  `kind`, `text`, optionale `sourceRefs`, Honeypot und der Bezug zum veröffentlichten
  Beteiligungsraum.
- Für klar gekennzeichnete Fixture-Fallbacks wird bewusst kein aktiver Submit
  angezeigt; stattdessen erklärt die Shell, dass Hinweise erst mit veröffentlichter
  Runtime möglich sind.

## Guardrails

- Kein Auto-Publish.
- Keine Wahrheits- oder Quellenverifikation.
- Kein Auto-Factcheck.
- Keine neue öffentliche Moderations- oder Community-Plattform.
- Kein aktiver Submit auf Fixture-/Preview-Lesarten.

## Warum Web CI unberührt bleibt

Die Änderung ergänzt nur eine kleine Form in der bestehenden Public-Participation-
Shell und nutzt die bereits vorhandene gehärtete API. App-Logik, Factcheck-,
Moderations-, Publish- oder Payment-Pfade wurden nicht erweitert oder umgebaut.

## Verbleibender Folgepfad

`COMMUNITY-SOURCE-REVIEW-WORKBENCH-06` bleibt offen. Die aktuelle Änderung ergänzt
nur einen kleinen öffentlichen Intake; die spätere redaktionelle Gruppierung,
Weiterleitung und Workbench-Vertiefung bleibt bewusst ein separater Slice.

## Revalidierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-public-submission-ui.test.tsx tests/community-source-review-public-submission-api.test.ts tests/community-source-review-public-submission-hardening.test.ts tests/participation-space-public-detail-runtime.test.tsx tests/public-participation-space-shell.page.test.tsx tests/participation-space-public-route-runtime.test.tsx tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`
- `git diff --check`
