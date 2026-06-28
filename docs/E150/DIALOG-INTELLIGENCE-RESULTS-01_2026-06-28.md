# DIALOG-INTELLIGENCE-RESULTS-01

Datum: 2026-06-28
Status: done

## Ziel

Den ersten produktrelevanten, rein contract-first Slice für eDebatte Dialog Intelligence setzen, damit aus einem eingebrachten Thema ein strukturierter Ergebnisstand entstehen kann: erkannter Standpunkt, Rückfragen, Perspektiven, Argumente, neue Zweige und review-first Handoffs.

## Warum dieser Slice produktkritisch ist

eDebatte braucht zwischen freiem Beitrag und späteren Review-/Dossier-/Anlassraum-Pfaden einen kanonischen Ergebnisstand. Ohne diesen Contract bleibt unklar, wann nur eine Meinung gezählt werden darf, wann Rückfragen sinnvoll sind und wann ein Ergebnis überhaupt als Dossier-, Anlassraum- oder Participation-Space-Kandidat vorbereitet werden darf.

## Wie eDebatte den Nutzer im Dialog kennenlernt

Der neue Contract in `apps/web/src/features/dialog/dialogIntelligenceContract.ts` modelliert:

- Engagement Mode des Dialogs
- Offenheit des Nutzers für Rückfragen und Perspektiven
- erkannten Standpunkt mit Confidence, Bestätigung und optionaler Korrektur
- Argumente mit Review-/Quellenstatus
- Perspektiven als Angebot statt Zwang
- neue Zweige als Vorschlag oder Parkzustand
- review-first Handoff-Kandidaten

Der Slice startet bewusst keine echte AI-Laufzeit, keine externe Recherche und keinen UI-Wizard. Er schafft nur das belastbare Ergebnisformat, auf das spätere Runtime- und UI-Slices aufsetzen können.

## Engagement Modes

Der Contract verwendet:

- `count_only`
- `clarify_standpoint`
- `explore_perspectives`
- `co_create_argumentation`
- `prepare_dossier_or_space`

Wichtig: `count_only` erlaubt das Vorbereiten einer Meinungszählung ohne erzwungene Perspektiv- oder Argumentausarbeitung.

## Standpunkt-Erkennung

`RecognizedUserStandpoint` hält:

- `summary`
- `confidence`
- `confirmedByUser`
- `userCorrection`

`summarizeRecognizedStandpoint(...)` bevorzugt bei bestätigter Korrektur die Nutzerfassung. Dossier-, Anlassraum- und Participation-Space-Kandidaten bleiben gesperrt, solange der Standpunkt nicht bestätigt oder mindestens `review_ready` ist.

## Rückfragen- und Perspektivenlogik

`getDialogNextQuestions(...)` und `getPerspectivePrompts(...)` bilden die erste Ergebnislogik:

- bei `low` oder `count_only` keine Perspektivenerzwingung
- bei `medium` und `high` Rückfragen und optionale Gegen-/Nebenperspektiven
- faktische Claims mit `needs_source` erzeugen explizite Quellen-/Factcheck-Rückfragen
- neue Zweige bleiben `suggested` oder `parked`, niemals automatisch erstellt oder veröffentlicht

## Meinung zählen ohne Ausarbeitung

`canCountOpinion(...)` erlaubt einen review-first Count-Kandidaten schon dann, wenn ein erkennbarer Standpunkt vorliegt und das Ergebnis nicht verworfen wurde. Das ist absichtlich von Dossier-/Anlassraum-Vorbereitung getrennt:

- keine Perspektivenpflicht
- keine Argumentpflicht
- keine implizite Dossier- oder Anlassraum-Freigabe

## Handoff an Dossier, Anlassraum und Participation Space

`getDialogHandoffCandidates(...)` liefert nur Kandidaten mit Guardrails:

- `count_opinion`
- `dossier_candidate`
- `anlassraum_candidate`
- `participation_space_candidate`
- `editorial_review`
- `factcheck_request`

Alle Handoffs bleiben:

- review-first
- `autoCreate: false`
- `autoPublish: false`

`canPrepareDossierCandidate(...)` und `canPrepareAnlassraumCandidate(...)` bleiben nur dann positiv, wenn:

- ein Standpunkt erkennbar ist
- der Standpunkt bestätigt oder `review_ready` ist
- kein blockierender Claim mit `needs_source` vorliegt
- ausreichend reviewbare Substanz vorhanden ist

Participation Space bleibt ebenfalls nur ein Kandidat, kein produktiv angelegter Raum.

## Guardrails

Dieser Slice führt ausdrücklich nicht ein:

- Auto-Publish
- Auto-Dossier
- Auto-Anlassraum
- Auto-Graph
- automatische Faktenbehauptung
- externe Recherche
- DeepSearch-/Kostenpfade
- Payment/Checkout
- I18N
- vollständigen UI-Wizard
- automatische Veröffentlichung oder Personalisierungsruntime

Die kleine Ergebnis-Surface in `/create` oder Voxy wurde bewusst nicht in diesen Slice gezogen. Dafür ist ein eigener UI-Folgepfad sinnvoller als eine riskante Teilintegration in `CreateClient.tsx`.

## Tests / Build

Lokal validiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dialog-intelligence-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- echte AI-Generierung
- externe Recherche
- DeepSearch
- Payment/Checkout
- I18N
- vollständiger UI-Wizard
- automatische Veröffentlichung
- persistente Nutzerpräferenz- oder Profiling-Runtime
