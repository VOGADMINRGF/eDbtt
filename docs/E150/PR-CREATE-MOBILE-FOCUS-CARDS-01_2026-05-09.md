# PR-CREATE-MOBILE-FOCUS-CARDS-01

Stand: 2026-05-09
Bezug: Issue #119

## Ziel

`/create` sollte nach der ersten eDebatte-Antwort stärker wie ein mobiler Arbeitsdialog wirken:

- kompakter Überblick statt langer Ast-Liste
- aktive Focus Card statt gleichgewichtiger Boxenwand
- wichtigste Aktion auf Mobile jederzeit erreichbar
- Details weiter hinten als Disclosure

Keine neue E150-Fachlogik, keine neue Taxonomie, keine neue Scraping-/Gemini-/NotebookLM-Implementierung.

## Umsetzung

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - neuen Überblick `Deine Struktur auf einen Blick` mit vier Focus-Bereichen eingeführt:
    - `Prioritäten`
    - `Themencluster`
    - `Fragen & Abstimmung`
    - `Nächste Schritte`
  - Strukturäste von vertikaler Vollansicht auf wählbare/swipebare Focus Cards umgestellt
  - pro Focus Card: Titel, knapper Bedarf, wichtigste Frage, Status/Anzahl
  - nur ein aktiver Ast-Detailbereich bleibt gleichzeitig geöffnet
  - mobile Sticky-Action-Bar nach Bestätigung auf den nächsten Primärschritt umgestellt
  - Guardrails kompakt sichtbar gehalten

- Contracts nachgezogen:
  - `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
  - `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
  - `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`

## Validierung

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx
```

Alle genannten Prüfungen liefen grün.
