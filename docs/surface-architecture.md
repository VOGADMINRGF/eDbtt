# Surface Architecture Rules

## Prinzip
- Fachlogik liegt in kanonischen Produkt-Surfaces ohne `/demo`.
- `/demo/*` ist nur kuratierter Einstiegs-/Präsentationslayer.
- Demo, Rolle, Rechte und Datenquelle werden als separater Surface-Context aufgelöst.

## Zentraler Resolver
- Datei: `apps/web/src/features/surface/context.ts`
- Aufgelöste Achsen:
  - `mode`: `live | demo | preview | sandbox`
  - `audience`: `journalist | verwaltung | buerger | stiftung | partner | none`
  - `viewerRole`: `public | citizen | journalist | creator | admin`
  - `dataSource`: `live | seed | preview | tenant`
  - `capabilities`: `canSubmit | canModerate | canVote | readOnly`

## Kanonische Bereiche (aktuell)
- `/studio`
- `/dossier` + `/dossier/[id]`
- `/abstimmungen` + `/abstimmungen/[id]` (Alias auf bestehende Votes-Surface)
- `/mandat` + `/mandat/[id]`
- `/factcheck` + `/factcheck/[id]`
- `/swipes`
- `/mitwirken`

## Demo-Einstieg
- `/demo`
- `/demo/journalist`
- `/demo/verwaltung`
- `/demo/buerger`

## Demo-Fachzugänge
- `/demo/dossier`
- `/demo/abstimmungen`
- `/demo/mandat`
- `/demo/factcheck`
- `/demo/swipes`

## Umgesetzte gemeinsame Surfaces
- `MandatSurface`: genutzt von `/mandat` und `/demo/mandat`
- `FactcheckSurface`: genutzt von `/factcheck` und `/demo/factcheck`
- `SwipesSurface`: genutzt von `/swipes` und `/demo/swipes`
