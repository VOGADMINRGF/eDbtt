# CREATE-EXISTING-TOPIC-MATCHES-RUNTIME-BRIDGE-04

## Ziel

Den sichtbaren Existing-Topic-Matches-Block im Create-/Voxy-Follow-up kontrolliert an vorhandene Runtime-/Readmodel-Quellen koppeln, ohne daraus eine fake Live-Suche, einen Graph-Merge oder eine automatische Erstellung abzuleiten.

## Bezug auf #244-#249

- `#244` hat den sichtbaren Preview-Block fuer Existing Topic Matches eingefuehrt.
- `#245` hat lokale review-first Handoff-Drafts daran angeschlossen.
- `#249` hat diese Handoffs bereits an die persistente Review Queue angebunden.
- Dieser Slice schliesst jetzt die Luecke zwischen sichtbarem Preview-Block und vorhandenen Readmodels, ohne neue API-Route und ohne zweite Queue.

## Welche Runtime-Quellen jetzt wirklich genutzt werden

- `/api/create/context`
  - liefert bestehende Anlassraum-/Round-Kontexte fuer `participation_space`, `branch` sowie abgeleitete Dossier-/Topic-Hinweise.
- `/api/topics`
  - liefert vorhandene Themenseiten und vorsichtige `opinion_cluster`-Ableitungen auf Basis vorhandener Statements.
- Die vorhandene `CreateVisualFollowup`-UI startet damit nach dem initialen Preview einen kontrollierten Runtime-Abgleich im Client.

## Was bewusst nicht als Runtime behauptet wird

- `source_question` bleibt vorerst preview-only.
- Es gibt keinen neuen Graph-Pfad.
- Es gibt keinen Auto-Merge.
- Es gibt keine automatische Dossier-, Anlassraum- oder Beteiligungsraum-Erstellung.
- Es gibt keine neue Review-Queue neben der bestehenden Handoff-/Review-Queue.
- Es gibt keine externe Recherche, keine DeepSearch-Kopplung und keine automatische Quellenbestaetigung.

## Wie die Degradierung ehrlich bleibt

- Initial rendert der Block weiter den vorhandenen Preview-State.
- Wenn die Runtime-Quellen erfolgreich anschliessen, wird das Panel als `runtime` oder `hybrid` gekennzeichnet.
- Wenn die Runtime-Quellen nicht verfuegbar sind, faellt die UI explizit auf `Preview auf Basis lokaler Beispieldaten` zurueck.
- Wenn zwar Runtime verfuegbar ist, aber kein belastbarer Treffer entsteht, zeigt das Panel einen ehrlichen Leerzustand statt erfundener Anschluesse.

## Sichtbare UI-Aenderungen

- `ExistingTopicMatchesPanel.tsx` zeigt jetzt die Herkunft des Blocks sichtbar an:
  - `Gefundene Anschlüsse aus vorhandenen eDebatte-Strukturen`
  - `Preview auf Basis lokaler Beispieldaten`
- `CreateVisualFollowup.tsx` verwendet nicht mehr nur das Preview-Memo, sondern haelt ein echtes `existingTopicMatchesModel`, das nach dem Mount aus der Runtime-Bridge aktualisiert wird.
- Die vorhandenen CTA-Pfade fuer Branch-/Dossier-/Participation-/Opinion-/Factcheck-Handoffs bleiben unveraendert review-first und nutzen weiter denselben Draft-/Review-Queue-Pfad.

## Kleine Runtime-Bruecke statt neuer Parallelarchitektur

- Neue Bruecke: `apps/web/src/features/create/existingTopicMatchesRuntimeBridge.ts`
- Keine neue Route.
- Kein Direktzugriff aus der Komponente auf mehrere Fetch-Pfade.
- Die UI bleibt ueber `sourceKind`, `sourceLabel`, `emptyStateText` und Blocker-Zustaende explizit ueber den Wahrheitsgrad der Daten.

## Tests / Build

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-existing-topic-matches-runtime-bridge.test.ts tests/existing-topic-matches-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- produktiver Graph-/Deduplication-Merge
- Source-/Factcheck-Runtime ueber das neue Match-Panel
- automatische Erstellung von Dossier, Anlassraum oder Beteiligungsraum
- neue Match-Queue ausserhalb der bestehenden Review Queue
- externe Recherche-/Crawler-/DeepSearch-Pfade
- vollstaendige Similarity-Suche ueber alle moeglichen Content-Typen
