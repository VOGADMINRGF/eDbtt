# CREATE-EXISTING-TOPIC-MATCHES-VISIBLE-03

## Ziel

Im bestehenden Create-/Voxy-Follow-up sichtbar machen, ob ein neuer Beitrag an bereits vorhandene Themen, Zweige, Beteiligungsraeume, Dossiers oder vorsichtige Meinungscluster anschliessen koennte.

## Bezug auf Dialog Results / #240-#242

- `#240` hat den typed Dialog-Outcome-Contract eingefuehrt.
- `#241` hat das sichtbare Dialog-Ergebnispanel im Create-Follow-up verankert.
- `#242` hat die Ergebnis- und Perspektivsprache vorsichtiger und klarer gemacht.
- Dieser Slice haengt sich bewusst direkt an diesen bestehenden Ergebnisblock und fuehrt keine neue Runtime, keinen Wizard und keinen Parallelpfad ein.

## Warum Anschlussvorschlaege wichtig sind

- Nutzer:innen sollen sehen koennen, dass ihr Beitrag nicht isoliert stehen muss.
- Gleichzeitig darf eDebatte nicht so tun, als sei bereits ein echter Dubletten-, Graph- oder Merge-Entscheid gefallen.
- Der sichtbare Vorschlagsblock schafft genau diese Zwischenlage: anschlussfaehig, aber noch nicht verbunden.

## Was sichtbar gemacht wurde

- Neuer typed Preview-/Readmodel-Contract in `apps/web/src/features/create/existingTopicMatches.ts`.
- Preview-/Test-Fixtures in `apps/web/src/features/create/existingTopicMatchesFixtures.ts`.
- Neues `ExistingTopicMatchesPanel.tsx` mit sichtbaren Vorschlaegen fuer:
  - `topic`
  - `branch`
  - `participation_space`
  - `dossier`
  - `opinion_cluster`
  - `source_question`
- Minimaler Einbau in `CreateVisualFollowup.tsx` direkt unter dem bestehenden `DialogResultsHandoffPanel`.

## Unterschied Match vs. Dublette vs. Graph

- Ein Match ist hier nur ein Anschlussvorschlag.
- Eine Dublette waere spaeter eine bewusste Review-Entscheidung ueber Zusammenfuehrung oder getrennte Weiterfuehrung.
- Ein Graph waere spaeter eine echte Runtime fuer belastbare Topic-/Branch-/Room-Verbindungen.
- Dieser Slice startet weder Dublettenlogik noch Graph-Runtime.

## Warum kein Auto-Merge

- `strong` bedeutet weiterhin nur einen starken Vorschlag, nie ein automatisches Zusammenfuehren.
- Die Guardrail-Copy lautet sichtbar: `Das sind Anschlussvorschlaege, keine automatische Zusammenfuehrung.`
- CTA-Labels bleiben vorbereitend und vermeiden Begriffe wie `zusammenfuehren`, `veroeffentlichen` oder `Dossier erstellen`.

## Wie Opinion Cluster vorsichtig formuliert wird

- `opinion_cluster` wird als vorsichtige Einordnung formuliert, nicht als repraesentative Statistik.
- Falls Preview-/Test-Fixtures eine Zahl zeigen, erscheint explizit der Hinweis, dass dies keine repraesentative Statistik ist.
- Im Dialog-Preview-Adapter werden keine erfundenen Live-Zahlen behauptet.

## Guardrails

- kein Auto-Merge
- kein Auto-Graph
- keine externe Recherche
- keine DeepSearch-/Kostenpfade
- keine automatische Dossier-, Anlassraum- oder Beteiligungsraum-Erstellung
- keine automatische Veroeffentlichung
- keine Fake-Behauptung einer vollstaendigen Suche
- keine Source-/Factcheck-Integration als Runtime-Claim

## Tests / Build

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/existing-topic-matches-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- echter Graph
- externe Recherche
- DeepSearch
- Runtime-Matching mit Datenbank
- Auto-Merge
- echte Dossier-/Anlassraum-Erstellung
- echte Beteiligungsraum-Erstellung
- vollstaendige Statistik
- User-Memory / Personalisierung
