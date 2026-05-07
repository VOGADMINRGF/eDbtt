# PR-CREATE-CURATED-DIALOG-WORKSPACE-01

## Ziel
`/create` als kuratiertes, dialogbasiertes Arbeitsfenster konsolidieren: weniger Dashboard-/Kartenwüste, mehr geführter Arbeitsfluss mit klarer Primärhandlung.

## Problem
Der Follow-up-Bereich wirkte trotz inhaltlicher Tiefe noch wie ein gestapeltes Analysepanel:
- zu viele gleichrangige Blöcke
- zu wenig klare Gesprächsrollen
- Details zu früh und zu dominant

## Produktentscheidung
- Kein Rückbau der bestehenden Create-Logik.
- Keine neue schwere Produktlogik.
- Fokus auf Struktur, Hierarchie, Copy und modulare UI-Bausteine.
- Guardrails bleiben strikt sichtbar:
  - keine automatische Stimme
  - keine automatische Veröffentlichung
  - keine automatische Kostenbuchung

## Umgesetzte UX-Struktur
Dialogfluss im selben Workspace:
1. `Du` (Beitrag)
2. `eDebatte` (strukturierende Antwort)
3. `Vorgeschlagener Arbeitsstand`
4. `Stimmt diese Einordnung?` (klare Primärhandlung)
5. Details sekundär via Disclosure

## Neue modulare Bausteine
In `CreateVisualFollowup.tsx`:
- `UserContributionBubble`
- `AssistantUnderstandingBubble`
- `StructuredWorkstateBlock`
- `TopicFieldList`
- `PositionClusterList`
- `VoteQuestionList`
- `FollowupActionRail`
- `DetailsAccordion`

## Progressive Offenlegung
Primär sichtbar:
- Einordnung
- Dossier-Kontext
- Themenfelder
- Blickrichtungen
- mögliche Abstimmungsfragen
- nächste Handlung

Sekundär/einklappbar:
- Originaltext
- Sinnabschnitte
- Anschlussoptionen
- Zusatzservices

## Geänderte Dateien
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `docs/E150/OpenTasks.md`

## Tests
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx`

## Offene Folgepunkte
- Künftige Antwortbausteine (Quellen/Statistik/Artikel/Video/Faktencheck) sind strukturell vorbereitet, aber nicht als Dummy-Content erzwungen.
- Kein Ausbau in Richtung Auto-Publish/Auto-Vote.
