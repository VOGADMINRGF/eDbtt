# GOV-AI-03C Handoff/UI Contract Sync (2026-03-27)

Ziel: Sichtbare Handoff-Texte zwischen `/create`, `/runden`, `/swipes` und `/dossier` angleichen, ohne Routing- oder Produktlogik zu aendern.

## Sichtbarer Handoff-Stand

- `/create` kommuniziert den Surface-Vertrag explizit: Kontext in Anlassraum (`/runden`), Beteiligung in `/swipes`, Verdichtung im Dossier.
- Analyze-Finalize-Hinweise unterscheiden konditional zwischen Dossier-Ziel und Beteiligungsziel (`/swipes`).
- `/runden` beschreibt sich als oeffentliche Anlassraum-Kontextsurface und grenzt Create/Swipes/Dossier klar ab.
- `/swipes` verweist beim Arrival-Flow klar auf den verbleibenden Anlassraum-Kontext und bietet den Rueckweg in den Themenkontext ohne neue Routing-Regel.
- Dossier-Surface markiert sich als Verdichtung, nicht als Ersatz fuer den Anlassraum-Arbeitskontext.

## Geaenderte Surface-Dateien

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/swipes/SwipesClient.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`

## Nicht-Ziele

- keine neue Route
- keine neue Redirect-Regel
- keine inhaltliche Neupriorisierung im Produktfluss
