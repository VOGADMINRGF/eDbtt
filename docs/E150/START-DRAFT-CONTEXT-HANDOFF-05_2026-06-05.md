# START-DRAFT-CONTEXT-HANDOFF-05

Datum: 2026-06-05
Status: done
Task-ID: `START-DRAFT-CONTEXT-HANDOFF-05`

## Problem

Der bisherige Create-Light-Einstieg auf `/start` konnte den eingegebenen Text nicht stabil in die nächsten Arbeitsflächen tragen. Vor allem beim Wechsel nach `/create`, `/themen`, `/runden/new` oder über Login/Register drohte Kontextverlust oder doppelte Eingabe.

## Umgesetzter gemeinsamer Draft-Kontext

Neu eingeführt:

- `apps/web/src/features/start/startDraftContext.ts`

Der Helper führt einen versionierten, rein session-scoped `StartDraftContext` mit:

- `text`
- `normalizedText`
- `origin`
- `intent`
- `preview`
- `targetHint`
- `handoffCount`
- Guardrails:
  - `noAutoPublish: true`
  - `noAutoDossier: true`
  - `noAutoAnlassraum: true`
  - `noAutoDeepSearch: true`
  - `noAutoGraphWrite: true`

Speicherverhalten:

- nur `sessionStorage`
- kein produktiver Graph-Write
- kein stilles dauerhaftes Speichern
- zu kurze Drafts werden nicht persistiert
- alte oder ungültige Schema-Versionen werden ignoriert

## Handoff `/start` → `/create`

`LandingCreateLightEntry` speichert vor dem CTA `Jetzt vertiefen` jetzt einen `StartDraftContext` und navigiert dann über einen Draft-Marker weiter.

`/create` liest den Start-Draft bewusst ein:

- ohne Auto-DeepSearch
- ohne Auto-Orchestrierung
- ohne Auto-Publish
- ohne Auto-Dossier
- ohne Auto-Anlassraum

Wenn bereits ein lokaler `/create`-Entwurf existiert:

- wird er **nicht still überschrieben**
- stattdessen erscheint ein Resume-/Import-Banner
- Nutzer kann:
  - `Übernehmen`
  - `Bestehenden Entwurf behalten`
  - `Verwerfen`

Wenn kein konkurrierender lokaler Entwurf existiert:

- wird der Text als Ausgangstext übernommen
- mit sichtbarem Hinweis `Aus deiner Startseiten-Eingabe übernommen.`

## Handoff `/start` → `/themen`

`Zu bestehendem Thema beitragen` speichert denselben Start-Draft mit `targetHint=themes`.

`/themen` zeigt dann:

- einen Resume-Hinweis
- den übernommenen Such-/Zuordnungskontext
- vorhandene Themen-Pills aus dem Start-Preview
- Treffer auf bestehende Themen per einfacher, lokaler Keyword-Zuordnung

Wenn keine Treffer gefunden werden:

- erscheint `Als neues Thema vorschlagen`
- aber weiterhin ohne produktive Themenerstellung vor Bestätigung

## Handoff `/start` → `/runden`

`Anlassraum starten` speichert den Draft für `rounds` und öffnet `/runden/new`.

`AnlassraumSetupForm` nutzt diesen Draft jetzt als Ausgangspunkt für:

- Titel
- Leitfrage
- Beschreibung
- bearbeitbare Antwortoptionen

Für klare Schulweg-/Radweg-Fälle werden vorsichtige, bearbeitbare Optionen vorbereitet. Für unklare Fälle werden keine künstlichen festen Optionen behauptet.

## Verhalten bei Login/Register

Für loginpflichtige Weiterarbeit nach `/create` gilt:

- Draft wird vor Redirect in `sessionStorage` gesichert
- Redirect läuft weiter über den bestehenden `next`-Flow
- nach Login/Register bleibt der Draft im selben Tab erhalten
- `/create` kann ihn danach wieder aufnehmen

Es wurde **keine** parallele Auth-Welt eingeführt.

## Verhalten bei bestehendem Create-Draft

Wenn auf `/create` bereits ein lokaler Entwurf existiert:

- keine stille Überschreibung
- expliziter Import-/Beibehalten-Entscheid

Damit bleibt der bestehende lokale Arbeitsstand geschützt.

## `/runden` Erweiterbarkeit von Antworten/Optionen

Der bestehende manuelle Anlassraum-Pfad war bereits flexibel genug, wurde aber jetzt explizit an den Start-Draft angeschlossen:

- Optionen bleiben bearbeitbar
- Optionen bleiben entfernbar
- weitere Optionen bleiben hinzufügbar
- klare Startfälle können mit fünf vorbereiteten Optionen starten

Es wurde keine produktive Abstimmung und keine Veröffentlichung ausgelöst.

## Bestätigte Guardrails

Bestätigt im Slice:

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-DeepSearch
- kein Auto-Graph-Write
- keine produktiven Votes ohne Bestätigung
- keine produktive Themenerstellung ohne Bestätigung
- keine produktive Rundenveröffentlichung ohne Bestätigung

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/manual-anlassraum-setup.contract.test.ts tests/runden-manual-create.page.contract.test.tsx tests/themen-surface-staging.contract.test.tsx tests/create-anlassraum-handoff.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- 11 fokussierte Suites grün

## Offene Punkte

Bewusst offen bleiben:

- echte Browser-/Device-QA für den kompletten `/start` → Login → `/create`-Rücksprung
- weitergehende inhaltliche Themen-/Rundenvorschläge per KI
- produktive Themenerstellung
- produktive Rundenveröffentlichung
- produktive Votes
- produktive Graph-/Dossier-/Anlassraum-Fortschreibung

## Freeze-Stand

Der Stand ist als aktueller `/start`-Draft-/Handoff-Pilot eingefroren:

- Draft-Kontext lebt nur als Arbeitskontext
- keine neue Produktsemantik wurde eingeführt
- keine automatische Veröffentlichung oder teure Folgeaktion startet aus dem Handoff
