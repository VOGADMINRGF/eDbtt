# START-CREATE-LIGHT-HERO-POLISH-02

## Ziel

`/start` sollte nach `START-CREATE-LIGHT-ENTRY-01` nicht mehr wie ein funktionaler Prototyp wirken, sondern wie der hochwertige Primaereinstieg in den bestehenden Create-Light-Pfad. Der Slice schärft nur Layout, Hierarchie, Copy und Klickpfade im Hero. Keine neue Produktlogik, keine neue AI-Stufe, kein neuer Persistenzpfad.

## Umgesetzt

- Hero auf `/start` als breiteres Desktop-2-Spalten-Layout nachgeschärft:
  - linke Spalte: Headline, Subline, zentrale Create-Light-Karte
  - rechte Spalte: Voxy als Guide plus kompakte Vorschaukarten
- Mobile-Reihenfolge bleibt eingabefirst:
  - Headline
  - Eingabekarte
  - Voxy-/Guide-Fläche
- `LandingCreateLightEntry` gestrafft:
  - grössere Textarea
  - primäre CTA `Beitrag einordnen`
  - sekundäre CTA `Beispiele ansehen`
  - B2B-/Demo-Links aus der Hauptkarte herausgenommen und nach rechts sekundär verlagert
  - Trust-Zeile: `Noch keine Veröffentlichung · keine automatische Prüfung · du bestätigst jeden nächsten Schritt`
- Beispielkarten sind jetzt klickbar und füllen den lokalen Eingabetext, ohne produktive Daten zu schreiben.
- Preview nach Eingabe zeigt jetzt:
  - Beitragstyp
  - mögliche Themen
  - offene Fragen
  - nächste Schritte
  - Hinweis `Noch nicht veröffentlicht`
- Preview-CTA reduziert auf:
  - `Jetzt vertiefen`
  - `Zu bestehendem Thema beitragen`
  - `Beitrag ändern`

## Guardrails unverändert

- Kein DeepSearch
- Kein Orchestrator-/Graph-Write
- Kein Auto-Dossier
- Kein Auto-Publish
- Keine produktiven Demo-Daten
- Keine Änderung an der bestehenden `/create`-Prefill-Logik

## Geänderte Dateien

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/features/start/LandingCreateLightEntry.tsx`
- `apps/web/src/features/start/landingCreateLight.ts`
- `apps/web/src/app/globals.css`
- `apps/web/tests/start-create-light-entry.contract.test.tsx`
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/landing-information-architecture.contract.test.tsx`
- `apps/web/tests/start-shared-create-composer.contract.test.tsx`
- `apps/web/tests/mobile-entry-routes.contract.test.tsx`

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-create-light-entry.contract.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/start-privacy-gate-links.contract.test.ts tests/mobile-entry-routes.contract.test.tsx`

Ergebnis: grün.
