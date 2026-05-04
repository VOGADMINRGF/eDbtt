# Surface Architecture Rules

## Update 2026-05-03 (Public Funnel)
- Oeffentlicher Einstiegsfokus: `/start` + `/themen` + `/swipes` + `/community/contributions`.
- Register-Default fuehrt auf `/swipes?welcome=1` (internes `next` bleibt priorisiert/sanitized).
- Pricing bleibt erreichbar (`/pricing`, `/pricing/institutionen`), aber nachgelagert gegenueber Themen/Swipes/Hinweisen.

## Update 2026-05-04 (Public Journey Slices Closed)
- Dossier-Surface (`/dossier/[id]`) ist mobile visual-first verdichtet und nutzt vereinfachte Begriffe.
- Live-Surface (`/stream`) ist mobil vereinfacht mit klarer Followup-Logik zu Themen/Swipes.
- Pricing-Surface (`/pricing`) fuehrt ueber kostenlose Public-CTAs und trennt Membership/Paketkauf deutlicher.

## Prinzip
- Fachlogik liegt in kanonischen Produkt-Surfaces ohne `/demo`.
- `/demo/*` ist nur kuratierter Einstiegs-/Präsentationslayer.
- Demo, Rolle, Rechte und Datenquelle werden als separater Surface-Context aufgelöst.
- Topic/Round-Guardrails: `docs/architecture/topic-round-guardrails.md`

## Zentraler Resolver
- Datei: `apps/web/src/features/surface/context.ts`
- Aufgelöste Achsen:
  - `mode`: `live | demo | preview | sandbox`
  - `audience`: `journalist | verwaltung | buerger | stiftung | partner | none`
  - `viewerRole`: `public | citizen | journalist | creator | admin`
  - `dataSource`: `live | seed | preview | tenant`
  - `capabilities`: `canSubmit | canModerate | canVote | readOnly`

## Kanonische Bereiche (aktuell)
- Surface-Contract (Ist-Stand): `/create` = Intake, `/runden` = Anlassraum-Kontext, `/swipes` = Beteiligung, `/dossier/[id]` = Verdichtung.
- `/studio`
- `/dossier` + `/dossier/[id]`
- `/abstimmungen` + `/abstimmungen/[id]` (Alias auf bestehende Votes-Surface)
- `/mandat` + `/mandat/[id]`
- `/factcheck` + `/factcheck/[id]`
- `/runden` (oeffentliche Anlassraum-/Round-Entry-Surface auf produktivem `output_seed` + `anlassraum`)
- `/anlassraum` ist als offizieller Alias-/Zielbegriff technisch als non-breaking Wrapper aktiv und verweist auf `/runden` (keine harte Migration).
- `/swipes`
- `/mitwirken`
- `/topic/[slug]`
- `/topic/manage/[slug]/governance` (Management-Reviewlog, Source Classes, Konfliktlage, Export/Handoff)
- `/round/[slug]`
- `/round/manage/[slug]/merge` (Management-Review fuer Round -> Topic Assist)
- `/embed/topic/[slug]`
- `/embed/round/[slug]`

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
- `/demo/runden` als gefuehrter Wrapper auf die produktive `/runden`-Surface

## Umgesetzte gemeinsame Surfaces
- `MandatSurface`: genutzt von `/mandat` und `/demo/mandat`
- `FactcheckSurface`: genutzt von `/factcheck` und `/demo/factcheck`
- `Runden Entry`: `/runden` als produktiver Anlassraum-/Round-Einstieg (Demo verweist auf denselben Entry)
- `SwipesSurface`: genutzt von `/swipes` und `/demo/swipes`
- `TopicRound`-Surfaces: genutzt von `/topic/[slug]`, `/round/[slug]` und Demo-Wrapper `/demo/runden`

## Routeninventar (generated/read-only)
- `docs/ROUTES.generated.md` und `docs/ROUTES.generated.json` sind generated Artefakte (read-only).
- Keine manuellen Änderungen in diesen Dateien vornehmen.
- Änderungen an Routen immer in `apps/web/src/app/**/page.tsx` oder `apps/web/src/app/**/route.ts` umsetzen.
- Danach das Inventar neu erzeugen: `node scripts/route-inventory.mjs` (Repo-Root).
