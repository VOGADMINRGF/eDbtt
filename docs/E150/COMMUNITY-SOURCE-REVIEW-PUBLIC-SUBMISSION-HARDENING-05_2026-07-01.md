# COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05

Stand: 2026-07-01

## Ausgangslage

`Community Source Review` war seit `COMMUNITY-SOURCE-REVIEW-CONTRIBUTION-01` und den
Moderations-/Abuse-/Trust-Slices nur contract- und admin-intern nutzbar.

- Public-Submission blieb bewusst `blocked_unwired`.
- `/admin/review` konnte persistierte Community-Hinweise moderieren.
- Es gab aber keinen belastbaren öffentlichen Intake mit Rate-Limits, Replay-Gates,
  Honeypot und ehrlicher Fehlerlesart.

Der Folge-Slice sollte deshalb keinen Produkt- oder Wahrheits-Pfad bauen, sondern nur
einen kleinen review-first Intake an dieselbe bestehende Runtime hängen.

## Umgesetzte Lösung

Neu verdrahtet wurden:

- `apps/web/src/features/create/communitySourceReviewPublicSubmission.ts`
- `apps/web/src/app/api/community/source-review/submissions/route.ts`

Die Lösung bleibt bewusst klein:

- Public-Submission läuft als review-first API, nicht als neue Community-Oberfläche.
- Jede Einreichung bleibt ein `CommunitySourceReviewContribution` und landet in derselben
  bestehenden Persistenz- und Admin-Review-Struktur.
- Öffentliche Antworten bleiben public-safe und geben keine internen Abuse-, Trust- oder
  Moderationsdetails preis.

## Guardrails

Die neue API erzwingt:

- IP-Rate-Limit auf dem Route-Pfad
- Honeypot-Block
- Replay-/Duplikat-Erkennung für kurzfristige identische Einreichungen
- review-first Persistenz statt Fake-Success oder direkter Factcheck-/Publish-Folgen
- optionale Prüfung gegen veröffentlichte öffentliche `/beteiligung`-Räume

Weiterhin ausgeschlossen:

- kein Auto-Factcheck
- kein Auto-Publish
- kein Auto-Merge
- kein Auto-Graph
- keine Wahrheits- oder Quellenverifikation
- keine neue öffentliche Moderations- oder Community-Plattform

## Beteiligungsraum-Bezug

Wenn eine Submission explizit einen öffentlichen Beteiligungsraum referenziert, wird nur
ein veröffentlichter öffentlicher Runtime-Raum akzeptiert. Interne, nicht veröffentlichte
oder nur fixture-basierte Kontexte werden nicht als Public-Target angenommen.

## Admin-Review

`/admin/review` zeigt den Submission-Status jetzt nicht mehr als `blocked_unwired`,
sondern als verdrahtete öffentliche API.

Das ändert nichts an der bestehenden Review-Logik:

- Hinweise bleiben moderiert.
- Trust priorisiert höchstens Review.
- Quellenqualität hilft bei der Einordnung.
- Nichts davon erzeugt Wahrheit oder Verifikation.

## Keine öffentliche UI in diesem Slice

Bewusst nicht umgesetzt:

- kein neues Formular in `/beteiligung`
- kein Public-Composer in `/create`
- keine neue Community-Workbench

Dafür bleibt ein expliziter Folgepfad offen:

- `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-UI-06`

## Revalidierung

Ausgeführt:

- `pnpm -C apps/web exec vitest run tests/community-source-review-public-submission-hardening.test.ts tests/community-source-review-public-submission-api.test.ts tests/community-source-review-contribution.test.ts tests/community-source-review-moderation-ui.test.tsx tests/community-source-review-abuse-spam.test.ts tests/community-source-review-abuse-spam-ui.test.tsx tests/community-source-review-trust-source-quality.test.ts tests/community-source-review-trust-source-quality-ui.test.tsx tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Ergebnis

`Community Source Review` ist damit nicht mehr nur contract-ready und admin-intern,
sondern besitzt einen kleinen gehärteten öffentlichen Intake. Der Pfad bleibt bewusst
review-first, API-first und ohne öffentliche Wahrheits- oder Verifikationslogik.
