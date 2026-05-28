# WRAPPER-PWA-MOBILE-ENTRY-01

Datum: 2026-05-28
Status: done

## Ziel

eDebatte als mobile-first PWA fuer den Buergerzugang haerten, ohne neue
Backend-Scopes, ohne App-Store-Zwang und ohne neue Produktparallelwelt.

Fokus:

- `/start` als sinnvoller PWA-Startpunkt
- `/swipes` als priorisierter mobiler Beteiligungspfad
- `/runden` beziehungsweise `/anlassraum` als bestehender Event-/Themenraum
- `/dossier` und `/dossier/[id]` als erreichbarer Kontextpfad
- `/stream` und QR-Einstiege auf denselben bestehenden Public-Routen

## Gepruefter Scope

- `apps/web/src/app/manifest.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/start/**`
- `apps/web/src/app/swipes/**`
- `apps/web/src/app/runden/**`
- `apps/web/src/app/anlassraum/**`
- `apps/web/src/app/dossier/**`
- `apps/web/src/app/stream/**`
- `apps/web/src/app/qr/**`
- `apps/web/public/**`

## Umsetzung

### 1. Manifest vervollstaendigt

`apps/web/src/app/manifest.ts` fuehrt jetzt explizit:

- `name`
- `short_name`
- `id`
- `start_url=/start`
- `display=standalone`
- `theme_color`
- `background_color`
- installierbare PNG-Icons fuer `192x192` und `512x512`
- `apple-touch-icon`

Neue Icon-Routen:

- `apps/web/src/app/pwa-192x192.png/route.ts`
- `apps/web/src/app/pwa-512x512.png/route.ts`
- `apps/web/src/app/apple-touch-icon.png/route.ts`

Die PWA-Basis bleibt web-first und haengt an bestehenden Routen statt an
nativen Sonderpfaden.

### 2. Mobile Entry auf bestehenden Routen gehaertet

`/start` zeigt jetzt einen expliziten mobilen PWA-Entry-Block:

- Swipes als primaerer Start
- Anlassraum
- Stream/Event
- Dossier-Kontext

Wichtig:

- der bisherige Demo-Dossier-CTA auf der Startflaeche wurde auf den realen
  Dossier-Kontextpfad zurueckgefuehrt
- keine neue mobile Sonderroute
- keine zweite Produktlogik

### 3. Core-Shell fuer relevante Mobile-Pfade erweitert

`apps/web/src/features/wrapper/mobileAppShellContract.ts` behandelt jetzt auch:

- `/dossier`
- `/qr/[qrId]`

als Core-Shell-kompatible Mobile-Pfade.

Damit bleiben folgende Public-Routen im selben App-/Wrapper-Verhalten:

- `/start`
- `/swipes`
- `/runden`
- `/anlassraum`
- `/dossier`
- `/dossier/[id]`
- `/stream`
- `/stream/[slug]`
- `/qr/[qrId]`

### 4. Ehrliche Offline-/Fallback-Hinweise

Neuer Baustein:

- `apps/web/src/components/mobile/PwaRouteStatusHint.tsx`

Eingebunden in:

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/stream/page.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/app/qr/[qrId]/QuestionSetClient.tsx`

Die Copy bleibt absichtlich knapp und ehrlich:

- bereits geladene Inhalte koennen sichtbar bleiben
- neue Schritte brauchen Verbindung
- keine stille Offline-Synchronisation
- keine impliziten Sync-, Queue- oder Upload-Behauptungen

## Akzeptanz gegen Auftrag

### Manifest

Erfuellt. Name, Shortname, Icons, Start-URL, Display, Theme- und
Background-Color sind explizit vorhanden.

### Mobile Entry

Erfuellt. `/start` fuehrt mobil klar in Swipes, Anlassraum, Stream/Event und
Dossier-Kontext. QR-/Event-Einstiege bleiben auf denselben bestehenden
oeffentlichen Routen.

### Offline / Loading

Erfuellt. Neue Hinweise bleiben defensiv:

- keine Offline-Sync-Behauptung
- keine Backend-Ausweitung
- keine neue Cache-/Queue-Runtime

### Keine neue Produktparallelwelt

Erfuellt. Alle Anpassungen bleiben auf bestehenden Public-Routen, Shell-Regeln
und Copy-Bausteinen.

## Geaenderte Dateien

- `apps/web/src/app/apple-touch-icon.png/route.ts`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/app/manifest.ts`
- `apps/web/src/app/pwa-192x192.png/route.ts`
- `apps/web/src/app/pwa-512x512.png/route.ts`
- `apps/web/src/app/pwaIconResponse.tsx`
- `apps/web/src/app/qr/[qrId]/QuestionSetClient.tsx`
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/stream/page.tsx`
- `apps/web/src/components/mobile/PwaRouteStatusHint.tsx`
- `apps/web/src/features/wrapper/mobileAppShellContract.ts`
- `apps/web/tests/pwa-manifest.contract.test.ts`
- `apps/web/tests/mobile-entry-routes.contract.test.tsx`
- `apps/web/tests/qr-event-entry-mobile.contract.test.tsx`

## Validierung

Auszufuehren:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/pwa-manifest.contract.test.ts tests/mobile-entry-routes.contract.test.tsx tests/qr-event-entry-mobile.contract.test.tsx`
- `pnpm run release:validate:production`
