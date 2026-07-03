# V3 Core Create / Round Runtime Stability

Datum: 2026-07-03
Slice: `V3-CORE-CREATE-ROUND-RUNTIME-STABILITY-01`

## Ziel

Den kleinsten echten Runtime-/UX-Stabilitaets-Slice fuer `/runden/new`
umsetzen: normale Texteingabe mit Leerzeichen und Satzzeichen, verlaessliches
`Ohne KI speichern` und ein ehrlicher No-AI-Zielzustand ohne neue
Produktarchitektur.

## Analyse vor Umsetzung

1. Route, Page und Komponenten hinter `/runden/new`

- Page:
  `apps/web/src/app/runden/new/page.tsx`
- Hauptformular:
  `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
- Schrittkomponenten:
  `AnlassraumOptionEditor.tsx`,
  `AnlassraumVisibilitySettings.tsx`,
  `AnlassraumSupportSettings.tsx`,
  `AnlassraumPrePublishCheck.tsx`,
  `AnlassraumStartDraftPanel.tsx`
- Shared Setup-/Prefill-Logik:
  `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`

2. Ursache fuer das Leerzeichen-/Input-Problem

`AnlassraumSetupForm.tsx` hat jeden `onChange`-Patch sofort durch
`sanitizeManualAnlassraumSetup(...)` geschickt. Diese Sanitisierung ersetzt
Whitespace mit `replace(/\s+/g, " ").trim()`.

Folge:

- ein gerade eingegebenes Leerzeichen am Wortende wurde sofort wieder
  entfernt
- Mehrwort-Eingaben fuehlten sich kaputt an
- normale Eingaben wie Titel, Frage und Beschreibung konnten nicht stabil
  mit natuerlichen Leerzeichen aufgebaut werden

3. Aktion hinter `Ohne KI speichern`

Vor diesem Slice wurde keine API und keine Route aufgerufen.
`Ohne KI speichern` schrieb nur einen lokal normalisierten Snapshot in
`localStorage` (`manual-anlassraum-setup.v1`) und zeigte eine Notice an.

4. Warum `Ohne KI speichern` nicht zuverlaessig wirkte

- Das Input-Problem verhinderte schon die normale Mehrwort-Eingabe.
- Der Save-Pfad schrieb nur `localStorage`, aber nicht den vorhandenen
  `StartDraftContext`, der fuer Resume-/Weiterarbeits-Flows in
  `/start`, `/create`, `/themen`, `/runden/new` und `/account` bereits
  existiert.
- Dadurch war der lokale Entwurf zwar teilweise gespeichert, aber nicht
  konsistent als wiederaufnehmbarer Arbeitsstand im bestehenden
  Closed-Cosmos-Draft-System sichtbar.

5. Bestehende Datenstrukturen

- Browser-/Draft-Kontext:
  `apps/web/src/features/start/startDraftContext.ts`
- Manueller Round-/Anlassraum-Entwurf:
  `manual-anlassraum-setup.v1` in `localStorage`
- Reale Anlassraum-Runtime:
  `features/anlassraum/types.ts`,
  `features/anlassraum/service.ts`,
  `apps/web/src/features/create/anlassraumRuntimeServer.ts`
- Review-/Handoff-Pfade:
  `apps/web/src/features/create/createHandoff.ts`,
  `createHandoffDrafts.ts`,
  `/api/create/handoffs`

6. Heutiger Uebergang von `/runden/new` zu Dossier/Anlassraum/Review

- Direkt aus `/runden/new` existiert heute vor allem der manuelle
  `/create`-Handoff ueber
  `buildManualAnlassraumContinueCreateHref(...)`.
- Reale serverseitige Anlassraum-Creation haengt weiterhin an
  bestaetigten Review-/Admin-/Runtime-Pfaden, nicht an
  `Ohne KI speichern`.
- `/runden/new` ist damit aktuell ein manueller no-AI-Entwurfsraum,
  nicht die direkte serverseitige Anlassraum-Runtime.

7. Bestehende Tests

- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/create-anlassraum-handoff.contract.test.tsx`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/start-draft-context.contract.test.ts`
- `apps/web/tests/start-draft-handoff-targets.contract.test.ts`

8. Kleinste reparierbare Runtime-Luecke

- Eingaben auf `/runden/new` bis zur expliziten Save-/Continue-Aktion roh
  lassen
- denselben bestehenden Entwurf beim Speichern sowohl lokal als auch im
  vorhandenen `StartDraftContext` persistieren
- keinen neuen Serverpfad, keine neue Billing-/AI-/DeepSearch-Logik bauen

## Umsetzung

- `AnlassraumSetupForm.tsx` sanitisiert Formzustand nicht mehr pro
  Keystroke.
- Sanitisierung findet weiter nur an expliziten Persistenz- und
  Handoff-Grenzen statt.
- `Ohne KI speichern`, `Intern starten` und
  `Öffentlich nach Review einreichen` schreiben jetzt den vorhandenen
  manuellen Anlassraum-Entwurf:
  - in `localStorage`
  - in den bestehenden `StartDraftContext`
- Beim Restore kann ein lokal gespeicherter Entwurf wieder als
  `StartDraftContext` sichtbar gemacht werden.
- `Entwurf verwerfen` leert jetzt sowohl den lokalen Setup-Speicher als
  auch den bestehenden Draft-Kontext.

## Ehrliche Runtime-Wahrheit nach diesem Slice

`Ohne KI speichern` bedeutet jetzt:

- ein lokaler, wiederaufnehmbarer Anlassraum-/Runden-Entwurf wird
  gespeichert
- kein KI-Lauf wird gestartet
- kein AI-Usage-Event wird geschrieben
- kein DeepSearch-Lauf wird gestartet
- kein serverseitiger Anlassraum-Record wird erzeugt

Das ist bewusst kein Ersatz fuer den offenen Folgepfad
`UX-ANLASSRAUM-MANUAL-CREATE-PERSIST-01`.

## Fachliche Einordnung von `/runden/new`

Heute ist `/runden/new` fachlich ein manueller Anlassraum-Entwurfsstart.
Es ist nicht der bereits voll geschlossene kanonische Einstieg fuer:

- Dossier-Erstellung
- Claim-Pipeline
- Fragen-/Umfragen-Endzustand
- Feed-Anreicherung
- spaetere Social-/Video-Briefings

Diese breitere Kanonfrage bleibt bewusst Follow-up und wurde in diesem
Slice nicht umgebaut.

## Tests

Gruen in diesem Slice:

- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/start-draft-context.contract.test.ts`
- `apps/web/tests/start-draft-handoff-targets.contract.test.ts`
- `apps/web/tests/create-anlassraum-handoff.contract.test.tsx`
- `apps/web/tests/create-mode.page.test.ts`

Zusaetzliche Revalidierung laut Taskabschluss:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- fokussierte Vitest-Suite fuer `/runden/new`, Create-/Draft-Handoff und Anlassraum-nahe Pfade
- `pnpm -C apps/web run build`
