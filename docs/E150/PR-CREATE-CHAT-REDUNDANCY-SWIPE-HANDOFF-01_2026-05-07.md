# PR-CREATE-CHAT-REDUNDANCY-SWIPE-HANDOFF-01

## Ziel
- Redundanz im `/create` Follow-up abbauen und den Flow klar als durchgehenden Chat-Arbeitsstand führen.
- Swipe-Handoff aus `/create` robust machen: Seeded Claim/Thema darf nicht von generischem Standarddeck verdrängt werden.

## Umsetzung
- Dedupe-Logik ergänzt:
  - `dedupeCreateFollowupSections(...)` in `apps/web/src/features/create/intelligentFollowupContract.ts`
  - Ähnliche `summary`/`core claim`/erste Aussage werden zusammengeführt.
- Sinnabschnitte verbessert:
  - thematische Abschnittstitel (z. B. Wohnen/Verkehr/Bildung/Integration), Fallback nur noch `Teil N`.
  - Detailbereiche standardmäßig eingeklappt.
- Follow-up-UI verdichtet:
  - `CreateVisualFollowup` zeigt weniger doppelte Primärtexte und hält Dossier-/Themen-/Claim-Logik im Chatfluss.
  - Anschlussdarstellung behandelt `Thema` nicht mehr als gleichrangige Anschlusskarte.
- Handoff-Logik geschärft:
  - Vote/Dossier Hrefs respektieren vorhandene Suggestion-Hrefs und bleiben seed-kontextfähig.
  - `vote`-Links bleiben `from=create&topic&claim&stance`.
  - `topic`-Anschlussvorschläge werden nicht mehr als primäre Karten gepusht.
- Swipes-Seed-Verhalten korrigiert:
  - `prioritizeSwipeItemsForCreateSeed` liefert nur claim/topic-seeded Treffer.
  - Bei fehlendem Treffer kein automatischer Fallback auf generisches Deck.
  - In `SwipesClient` kann Seed-Filter bewusst verlassen und wieder aktiviert werden.

## Geänderte Dateien
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createConnectionSuggestions.ts`
- `apps/web/src/features/create/followupTargetHref.ts`
- `apps/web/src/features/surfaces/swipes/discoveryContract.ts`
- `apps/web/src/app/swipes/SwipesClient.tsx`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/swipes-discovery.contract.test.ts`
- `apps/web/tests/swipes-action-hierarchy.contract.test.ts`
- `docs/E150/OpenTasks.md`

## Validierung
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/create-intelligent-followup.route.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/swipes-discovery.contract.test.ts tests/swipes-action-hierarchy.contract.test.ts` ✅
- `pnpm -C apps/web run build` ✅
  - non-blocking Build-Warnungen/Logs:
    - `baseline-browser-mapping` veraltet
    - `Mongo querySrv ECONNREFUSED` während Page-Data-Collection (Build lief dennoch erfolgreich durch)

## Guardrails
- Keine automatische Stimme.
- Keine automatische Veröffentlichung.
- Keine automatische Kostenbuchung.
- Keine neue parallele Create-Architektur eingeführt.
