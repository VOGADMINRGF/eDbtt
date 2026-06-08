# GLOBAL-DRAFT-STATUS-BAR-06

## Ziel

Den bestehenden Start-/Draft-Handoff zwischen `/start`, `/create`, `/themen` und `/runden/new`
UX-seitig schließen, ohne neue Produktlogik einzuführen. Nutzer sollen auf allen relevanten
Arbeitsflächen denselben Entwurfsstatus sehen: woran sie arbeiten, was noch nicht passiert ist
und wie sie weiter oder bewusst anders vorgehen können.

## Integrierte Surfaces

- `/start`
- `/create`
- `/themen`
- `/runden/new`

## Statussprache

Die Statussprache ist jetzt zentralisiert in `apps/web/src/features/start/startDraftContext.ts`.
Verwendet werden gemeinsame Helper für:

- `Entwurf`
- `Beitrag ausarbeiten`
- `Passende Themen finden`
- `Runde vorbereiten`
- `Noch nicht veröffentlicht`
- `Noch nicht gezählt`
- `Noch nicht zusammengeführt`
- `Noch keine Stimmen`
- `Keine automatische Prüfung`
- `Öffentliche Relevanz klären`
- `Du bestätigst den nächsten Schritt`

Die Surface-Komponente `apps/web/src/features/start/GlobalDraftStatusBar.tsx` nutzt diese Labels
und zeigt sie in allen betroffenen Arbeitsräumen konsistent an.

## UX-Verhalten je Surface

### `/start`

- Wenn bereits ein sessionbasierter Start-Draft existiert, erscheint eine kompakte Einstiegskarte.
- Nutzer können:
  - `Letzten Entwurf fortsetzen`
  - `Neuen Beitrag beginnen`
  - `Entwurf verwerfen`
- Bestehende Drafts werden dadurch nicht mehr still durch einen neuen Start überschrieben.

### `/create`

- Übernommene Start-Drafts zeigen sichtbar:
  - `Aus deiner Startseiten-Eingabe übernommen`
  - `Entwurf`
  - `Noch nicht veröffentlicht`
- Wenn schon ein lokaler `/create`-Entwurf existiert, bleibt die explizite Importentscheidung erhalten.
- Es gibt keine automatische Veröffentlichung oder automatische Weiterverarbeitung.

### `/themen`

- Der Surface zeigt jetzt denselben Entwurfsstatus mit:
  - `Wir suchen Themen, an die dein Beitrag anknüpfen könnte.`
  - `Entwurf`
  - `Noch nicht zusammengeführt`
- Nutzer können passende Themen suchen, als neues Thema vorschlagen oder verwerfen.

### `/runden/new`

- Der Surface zeigt jetzt denselben Entwurfsstatus mit:
  - `Runde aus deinem Entwurf vorbereiten`
  - `Entwurf`
  - `Noch nicht veröffentlicht`
  - `Noch keine Stimmen`
- Die aus `START-DRAFT-CONTEXT-HANDOFF-05` bestehende flexible Optionsvorbereitung bleibt erhalten.

## Mobile-Hinweise

- Keine sticky/fixed Statusbar eingeführt.
- Die Statusdarstellung ist eine kompakte Card am Seitenanfang.
- Buttons umbrechen in `flex-wrap`.
- Kein zusätzlicher `focus()`-, `scrollIntoView()`- oder Navigations-Trigger durch das reine Rendern.

## Bestätigte Guardrails

- Kein Auto-Publish
- Kein Auto-Dossier
- Kein Auto-Anlassraum
- Kein DeepSearch
- Kein produktiver Graph-Write
- Kein produktiver Vote
- Keine stille Überschreibung bestehender Entwürfe

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/themen-surface-staging.contract.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/manual-anlassraum-setup.contract.test.ts tests/global-draft-status-bar.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- 8/8 Testdateien grün
- 35/35 Tests grün

## Offene Punkte

- Echte Browser-/Device-QA bleibt separat, insbesondere für sehr kleine Mobile-Viewports.
- Der nächste Folgeslice `ACCOUNT-RESUME-WORKBENCH-07` bleibt offen für einen stärkeren
  Resume-Arbeitsplatz im Account.
