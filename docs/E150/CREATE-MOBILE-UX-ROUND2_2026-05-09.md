# CREATE-MOBILE-UX-ROUND2

## Kontext

Die erste Mobile-Bereinigung von `/create` hat den Einstieg bereits stark reduziert, nach `Beitrag strukturieren` war der Flow aber noch zu nah an einer Analyse-/Dashboard-Ansicht.

Round 2 schuettet die bestehende Arbeit nicht um, sondern ordnet sie neu:

- Compose-Card bleibt oben
- `Deine Struktur auf einen Blick` ist sofort sichtbar
- die kompakte Verstehens-Zusammenfassung kommt vor allen Detailmodulen
- Mobile bleibt bewusst reduziert
- Desktop darf granularer bleiben, aber in getrennten Arbeitsbereichen

Der anschliessende Repair-Slice bleibt ausdruecklich ein Layout-/Responsive-Fix:

- keine neue Fachlogik
- kein Safety-/Input-Quality-Gate-Drift aus PR #125
- keine zweite Create-Oberflaeche
- Ortsklaerung im UX-Branch nur ueber `result.understanding.openQuestion`

## Umsetzung

- `CreateClient` rendert unter dem Composer jetzt immer eine vierteilige `CreateStructureOverview` mit:
  - `Prioritäten`
  - `Themencluster`
  - `Fragen & Abstimmung`
  - `Nächste Schritte`
- Im Initialzustand zeigen die Karten `0`-Stände statt sofort Analyseinhalte.
- `CreateVisualFollowup` zeigt nach dem Strukturieren zuerst nur:
  - `Wir haben deinen Beitrag grob verstanden.`
  - `Kern`
  - `Thema`
  - `Noch offen`
- `SharedCreateComposer` rendert den Einstieg als dunkle Compose-Card mit innerem Titel `Deinen Beitrag verfassen`, reduziertem Toolbar-Chrome und sichtbarem Zeichenzaehler.
- Der mobile Disclosure `Anderer Arbeitsmodus` ist aus dem Hauptfluss genommen und nur noch ab `md` sichtbar.
- Desktop nutzt jetzt einen deutlich breiteren Shell-Wrapper statt einer zentrierten Handyspalte.
- `CreateStructureOverview` rendert auf Mobile als einspaltige List-Cards und erst auf breiteren Viewports als 2x2-Grid.
- `Ändern` oeffnet die bestehende Korrektur-/Fortsetzungslogik erst auf Wunsch; sie ist nicht mehr standardmaessig offen.
- Ortsklaerung bleibt prominent und bietet jetzt zusaetzlich `Ort später ergänzen`.
- Analyse-/Arbeitsmodule wie Signalbild, Status, Sinnabschnitte, Lesemodus und Desktop-Protokoll liegen hinter `Details ansehen`.
- Wenn `Details ansehen` geschlossen ist, werden die schweren Detailmodule im mobilen Hauptfluss nicht mehr mitgerendert.
- Mobile rendert im Detailbereich eine kompakte Listenansicht statt eines schmalen Graph-/Visual-Map-Layouts.
- Desktop nutzt denselben Flow, zeigt aber bestaende reichhaltigere Arbeitskontexte innerhalb eines breiten Detailbereichs und den bestaetigten Nächste-Schritte-Block im Seitenbereich.

## Relevante Dateien

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-no-chip-overload.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`

## Verifikation

- `pnpm -C apps/web exec vitest run tests/create-entry-hierarchy.contract.test.tsx tests/create-i18n-no-mixed-locale.contract.test.tsx tests/create-no-chip-overload.contract.test.tsx tests/create-entry-i18n.render.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-attachment-layout.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts`
- `pnpm -C apps/web run typecheck`
- Manuelle QA fuer `390px`/`1440px` in diesem Turn nicht abgeschlossen: auf der lokalen Maschine lief kein erreichbarer Dev-Server auf `127.0.0.1:3000`.
