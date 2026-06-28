# DOSSIER-ANLASSRAUM-RUNTIME-HANDOFF-03

## Ziel

Die sichtbaren Dialog-/Create-Handoff-CTAs aus den kleinen Dialog- und Anschluss-Slices sollen jetzt lokal in typisierte, review-first Handoff-Drafts übersetzt werden.

## Bezug auf #240-#244

- `#240` hat den Dialog-Outcome-Contract gesetzt.
- `#241` hat sichtbare Dialog-Handoffs im Create-Follow-up ergänzt.
- `#242` hat die Copy vorsichtiger und review-first ausformuliert.
- `#244` hat sichtbare Existing-Topic-/Branch-/Dossier-/Participation-/Opinion-Matches ergänzt.
- Dieser Slice verbindet genau diese sichtbaren CTAs mit einem kleinen lokalen Draft-State, ohne API oder Runtime-Entität.

## Welche CTAs jetzt in Drafts übersetzt werden

- Meinung zählen lassen
- An bestehenden Zweig anknüpfen
- Eigenen Zweig starten
- Dossier vorbereiten
- Anlassraum vorbereiten
- Beteiligungsraum vorbereiten
- Für Redaktion vormerken
- Quellenprüfung vorbereiten

## Was ein Handoff-Draft ist

- Ein Handoff-Draft ist ein lokaler, typisierter, review-first Entwurf im UI-State.
- Er speichert Zieltyp, Titel, Zusammenfassung, offene Fragen und Guardrails.
- Er ist absichtlich noch keine persistierte Review-Queue-Entität und keine finale Fachentität.

## Unterschied Draft vs. Runtime-Entität

- Draft: lokal vorbereitet, sichtbar, prüfbar, aber noch nicht gespeichert oder erstellt.
- Runtime-Entität: späterer Folgepfad mit echter Persistenz, Review-Queue-Anschluss und bewusster Einrichtung.
- Dieser Slice endet bewusst beim Draft.

## Warum review-first

- Alle vorbereiteten Schritte bleiben menschlich prüfbar.
- Dossier-, Anlassraum- und Beteiligungsraum-Ziele bleiben Kandidaten und verlangen `requiresEditorialReview`.
- Factcheck bleibt eine Anfrage oder Vormerkung und verlangt `requiresFactcheck`.

## Warum kein Auto-Dossier / Auto-Anlassraum

- `autoCreate` bleibt für alle Drafts immer `false`.
- `autoPublish` bleibt für alle Drafts immer `false`.
- Die UI sagt explizit: `Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum erstellt.`

## Warum kein Auto-Merge / Graph

- `existing_branch_connection` bleibt ein Verbindungsvorschlag und erzeugt keinen Merge.
- Es gibt keinen Graph-Runtime-Schritt, keine Topic-Deduplication-Runtime und keinen API-Aufruf.
- `blocksFinalRuntimeCreation(...)` bleibt für alle Drafts `true`.

## Wie Factcheck nur vorbereitet wird

- `factcheck_request` wird nur als Anfrage/Vormerkung modelliert.
- Die Summary-Copy betont, dass noch keine Wahrheit bestätigt wurde.
- Es gibt keine Source-Adapter-, DeepSearch- oder Recherche-Runtime in diesem Slice.

## Wie Meinung zählen nur als Erfassungsabsicht behandelt wird

- `opinion_count` bleibt nur ein lokaler, review-first Handoff-Draft.
- Die Copy betont ausdrücklich, dass dies keine repräsentative Statistik ist.
- Es wird nichts gezählt, veröffentlicht oder automatisch mit einer bestehenden Auswertung verbunden.

## Tests / Build

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff-drafts.test.ts tests/create-handoff-drafts-panel.test.tsx tests/dialog-results-handoff-panel.test.tsx tests/existing-topic-matches-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- echte Dossier-Erstellung
- echte Anlassraum-Erstellung
- echte Beteiligungsraum-Erstellung
- Review-Queue-Persistenz
- Backend/API
- Graph Runtime
- Source Adapter
- DeepSearch
- Auto-Publish
- Payment/Membership
