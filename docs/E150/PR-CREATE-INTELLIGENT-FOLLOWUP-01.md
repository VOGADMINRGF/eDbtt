# PR-CREATE-INTELLIGENT-FOLLOWUP-01

## Ziel
Den bestehenden `/create`-Flow im Modus **Beitragen** nach dem ersten Absenden von einer reinen Kurzfassung auf einen echten, transparenten Arbeitsmodus heben:
- vorlaeufiges Verstaendnis zeigen
- Anschlussvorschlaege zeigen
- Bestaetigung/Korrektur durch Nutzer erzwingen
- keine automatische Stimme, keine automatische Veroeffentlichung

## Problem
Der bisherige Lightweight-Follow-up zeigte nur eine knappe Zusammenfassung und wenige statische Folgeaktionen. Der Anschluss an Dossier/Anlassraum/Abstimmung war fuer Nutzer nicht klar genug sichtbar und wirkte entkoppelt vom eigentlichen Einordnungsstand.

## Produktentscheidung
Kein Rueckbau und keine parallele Create-Architektur:
- bestehender `/create`-Flow bleibt erhalten
- nur der Lightweight-Follow-up im Beitragen-Pfad wird aufgewertet
- Systempruefung + Anschlussvorschlag laufen in einem gemeinsamen Folgeblock
- jede Zuordnung/Abstimmung bleibt bestaetigungspflichtig

## Geaenderte Dateien
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/createConnectionSuggestions.ts`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `apps/web/tests/create-intelligent-followup.route.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `docs/E150/OpenTasks.md`

## UX-Entscheidungen
- Neuer Ergebnisblock im Beitragen-Flow mit drei Sektionen:
  1. `Wir haben deinen Beitrag vorläufig verstanden`
  2. `Aus deinem Text erkannt`
  3. `Dazu würden wir deinen Beitrag anschließen`
- Sichtbar: Kategorien, Themen, Aussagen, vermutete Haltung, Ebene, Sicherheit, offene Rückfrage
- Anschlussvorschlaege als Karten (`dossier`, `anlassraum`, `vote`, `topic`, `new_anlassraum`)
- Vote-Hinweis ist explizit: `Deine Stimme wird nicht automatisch abgegeben.`
- Originaltext bleibt sichtbar, nicht als versteckte Mini-Scrollbox
- Bei degradiertem Fallback wird Unsicherheit klar angezeigt

## Sicherheitsentscheidung zu Votes
- `suggestedStance` darf angezeigt werden
- Suggestion vom Typ `vote` hat immer `requiresConfirmation: true`
- keine automatische Stimmabgabe
- keine automatische Veroeffentlichung
- keine stille Graph-Zuordnung

## Tests
Geplante/ausgefuehrte Befehle in diesem Slice:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/analyze-workbench-hidden-until-start.test.ts`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup*.test.ts`
- optional regressiv: `pnpm -C apps/web run lint`
- optional regressiv: `pnpm -C apps/web run build`

## Offene Folgepunkte
- echtes produktives Graph-Matching fuer Anschlussvorschlaege kann spaeter den aktuellen Adapter/Fallback ersetzen
- feinere Domain-/Scope-Erkennung je Kommune/Bezirk/Land ist ausbaubar
- Legal-/Security-Feintext fuer vertrauliche Hinweise bleibt separater Decision-Boundary-Track
