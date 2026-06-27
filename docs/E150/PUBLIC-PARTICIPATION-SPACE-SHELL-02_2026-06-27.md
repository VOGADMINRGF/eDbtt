# PUBLIC-PARTICIPATION-SPACE-SHELL-02

Datum: 2026-06-27
Status: erledigt

## Ziel

Die bereits vorhandene öffentliche Beteiligungsraum-Shell auf Fixture-Basis robuster machen,
ohne neuen Produktumfang einzuführen. Fokus dieses Slices war auf H1-/Page-Contract,
Leak-Schutz, leeren Zuständen, Safety-Copy und rendernahen Tests.

## Umgesetzte Hardening-Maßnahmen

- öffentliche Anzeigeentscheidungen in `publicParticipationSpaceShell.tsx` über ein kleines
  lokales ViewModel zentralisiert
- nicht öffentliche Feedback-Inhalte bleiben in `feedback_prepared` und anderen
  nicht öffentlichen Zuständen verborgen
- zusätzliche sichere Fixture `nachbarschaftsforum-west` ergänzt, um einen öffentlichen Raum ohne
  öffentliche Rückmeldung und ohne öffentlichen Ortsbezug abzudecken
- leere Zustände für fehlende öffentliche Rückmeldung, fehlende Ortsfreigabe sowie leere
  öffentliche Fragen/Minderheitenpositionen/Nächste Schritte verständlich formuliert
- Safety-/Trust-Copy auf bürgerverständliche Hinweise reduziert

## H1 / Page-Contract-Entscheidung

Option A wurde klein umgesetzt:

- `scripts/check-page-contracts.mjs` akzeptiert nun explizit den Marker
  `page-contract: delegated-h1`
- `apps/web/src/app/beteiligung/[slug]/page.tsx` nutzt diesen Marker, delegiert das sichtbare
  `h1` an die Shell und bleibt damit ohne doppeltes oder zusätzliches `sr-only`-`h1`
- der frühere Eintrag in `config/page-contracts/missing-h1.allowlist.txt` konnte entfernt werden

Der sichtbare `h1` bleibt zusätzlich rendernah testabgesichert.

## Gating / Leak-Schutz

- konkrete Feedback-Details werden nur gezeigt, wenn
  `isParticipationSpaceFeedbackPublic(space)` true ist
- das betrifft weiterhin:
  - Titel und Summary der Rückmeldung
  - Topic Summaries
  - offene Fragen
  - Minderheitenpositionen
  - nächste Schritte
- `feedback_prepared` zeigt nur den neutralen Vorbereitungs-Hinweis
- öffentliche Ortsangaben erscheinen weiterhin nur über
  `canShowParticipationPlacePublicly(place)`
- interne Workflow-Begriffe, Queue-Meta und Map-/Geo-Begriffe bleiben im Public-DOM unsichtbar

## Leere Zustände

Abgedeckt wurden:

- öffentlicher Raum ohne öffentliche Rückmeldung
- Feedback vorbereitet, aber noch nicht öffentlich
- kein öffentlicher Ortsbezug
- keine öffentlichen offenen Fragen
- keine öffentlichen Minderheitenpositionen
- keine öffentlichen nächsten Schritte

Die Copy bleibt bewusst nicht technisch und nicht juristisch.

## Safety Copy

Sichtbar abgesichert sind jetzt mindestens:

- Rückmeldungen sind Einordnungen, keine amtlichen Entscheidungen
- Sichtbarkeit bedeutet keine automatische Veröffentlichung
- Ortsangaben werden nur sicherheitsbewusst angezeigt
- nicht öffentliche Review-Inhalte bleiben verborgen

## Tests

Erweitert in `apps/web/tests/public-participation-space-shell.page.test.tsx`:

- genau ein sichtbares `h1` im gerenderten Shell-Markup
- kein Leak von nicht öffentlichem Feedback bei `jugendforum-sued`
- öffentliche Details bleiben bei `schulwegsicherheit-nord` sichtbar
- keine internen Begriffe im DOM
- keine Map-/Geo-/API-Begriffe im DOM
- Safety-/Trust-Hinweise sichtbar
- leere Zustände für `nachbarschaftsforum-west` sichtbar

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web exec vitest run tests/public-participation-space-shell.page.test.tsx`

## Bewusst out of scope

- keine neue große UI
- kein Formular
- kein Intake
- keine Auth
- keine Admin-/Operator-Oberfläche
- keine echte Datenquelle
- keine DB
- keine Persistenz
- keine Map
- keine Marker
- keine Koordinaten
- kein Geocoding
- keine externe API
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
