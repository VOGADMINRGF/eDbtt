# PR-CREATE-UNIFIED-STRUCTURE-CHAT-01

## Ziel
`/create` als zentrales Unified-Structure-Chatfenster aufbauen: ein primärer Composer, sichtbare Kontext-/Fokussteuerung und fortlaufender Strukturdialog im selben Fenster.

## Problem
Die Surface wirkte trotz vorheriger Hardening-Slices weiterhin wie eine klassische Formular-/Analysekombination mit zu vielen gleichrangigen Steuerpunkten und zu wenig geführtem Chatfluss.

## Produktentscheidung
- Kein Rückbau der bestehenden Architektur.
- Ein zentraler Composer bleibt der Einstieg.
- Moduswahl bleibt optional/einklappbar statt dominant.
- Quick-Actions setzen den Fokus lokal und geben direkt sichtbares Feedback.
- Follow-up bleibt Dossier-first und erscheint als fortlaufender Strukturdialog im selben Arbeitsfenster.

## Geänderte Dateien
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/followupTargetHref.ts`
- `apps/web/src/features/create/createConnectionSuggestions.ts`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `docs/E150/OpenTasks.md`

## UX-Verhalten
- Einstiegstexte auf `/create`:
  - `Was soll öffentlich geklärt werden?`
  - `Beschreibe dein Thema, deinen Hinweis oder deine Frage. eDebatte macht daraus einen strukturierten Arbeitsstand.`
- Kontextchips sichtbar: Region, Kontext, Arbeitsweise, Ziel.
- Quick-Actions sichtbar: Argumente strukturieren, Gegenpositionen finden, Abstimmungsfragen ableiten, Fakten & Quellen prüfen, Lösungswege entwickeln.
- Follow-up als Struktur-Chat:
  - User-Bubble
  - eDebatte-Bubble
  - Strukturfluss mit Dossier-Kontext, Themen, Positionsclustern, Claims, Anschluss
  - Bestätigung mit `Ja, Struktur übernehmen`, `Ein Thema ändern`, `Für später speichern`
- Nach Bestätigung geordnete Folgeaktionen (Dossier, Claims/Abstimmungen, optional Service, Speichern).

## Guardrails
- Dossier-vor-Claim-Hierarchie bleibt erhalten.
- Keine automatische Stimme.
- Keine automatische Veröffentlichung.
- Faktencheck/Deep Search nur optional und explizit.
- Keine automatische Kostenbuchung.

## Tests und Validierung
Ausgeführt:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-entry-hierarchy.contract.test.tsx`

## Offene Folgepunkte
- Direkte In-Chat-Editierung von Themen/Claims/Positionen currently als vorbereiteter UI-Anker mit Feedback, noch ohne persistente Edit-API.
- Verlaufs-/History-Layer für mehrere gespeicherte Arbeitsstände als separater Folge-Slice.
