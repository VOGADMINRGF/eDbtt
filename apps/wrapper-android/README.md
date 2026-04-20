# Android Wrapper (Capacitor, MVP)

Dieser Ordner enthaelt den Android-first Wrapper-Bootstrap fuer den Web-Kern.

## Scope

- Stack: Capacitor
- Plattformfolge: Android zuerst
- Stream im MVP nur als Nutzerpfad (`/stream`, `/stream/[slug]`)
- Keine Admin-/Demo-/Research-/Operator-Spezialflaechen im MVP
- Kein Store-Submission-Run in diesem Slice

## Voraussetzung

- Node.js 20.x
- pnpm 10.x
- Java/JDK **17+** (Android Gradle Plugin 8.x)
- Android Studio nur fuer lokales Ausfuehren/Debugging
- Eine erreichbare Web-URL (Standard: `https://edebatte.org`)

## MVP-Surface-Policy

`src/mvpSurfacePolicy.ts` bildet die freigegebenen und ausgeschlossenen Pfade fuer den Wrapper-MVP ab:

- `mvp`: freigegebene Pfade
- `later`: bewusst spaeter, nicht im Wrapper-MVP
- `excluded`: explizit ausgeschlossene Pfade
- `unknown`: nicht Teil des ersten MVP

## Start (Android-first)

1. Workspace-Dependencies installieren:

```bash
pnpm install
```

2. Optional Web-Ziel fuer Wrapper setzen:

```bash
export WRAPPER_WEB_URL="https://edebatte.org"
```

3. Android-Projekt erstmalig erzeugen:

```bash
pnpm -C apps/wrapper-android run cap:add:android
```

4. Wrapper mit aktueller Config syncen:

```bash
pnpm -C apps/wrapper-android run cap:sync
```

5. In Android Studio oeffnen:

```bash
pnpm -C apps/wrapper-android run cap:open:android
```

## Build-Readiness (PR-WRAPPER-04)

1. Java-Pruefung:

```bash
pnpm -C apps/wrapper-android run doctor:java
```

2. Android Debug Build:

```bash
pnpm -C apps/wrapper-android run build:android:debug
```

3. Android Release-naher Build (unsigned):

```bash
pnpm -C apps/wrapper-android run build:android:release
```

## Hinweise

- `capacitor.config.ts` verwendet `WRAPPER_WEB_URL` und faellt auf `https://edebatte.org` zurueck.
- Wrapper-Entry wird auf den kanonischen MVP-Einstieg `/start` gesetzt.
- Android Back-Handling ist wrapper-spezifisch gehaertet:
  - Webview-History vorhanden -> ein Schritt zurueck
  - kein Webview-Backstack -> App geht in den Hintergrund (`moveTaskToBack`)
- Native Navigation-Guard blockiert nicht-MVP interne Ziele (`later`/`excluded`/`unknown`) und faellt auf `/start` zurueck.
- In diesem Slice wird nur Android vorbereitet. iOS folgt in einem separaten Folgeslice.

## Runtime-Smokes (PR-WRAPPER-03)

1. **MVP-Route intern**
   - App oeffnen und auf `/swipes` oder `/stream/[slug]` navigieren.
   - Erwartung: bleibt im Wrapper-Webview.
2. **Ausgeschlossene Route intern**
   - In-App-Link auf z. B. `/admin/feeds` oder `/atlas/social-review`.
   - Erwartung: wird nicht im Wrapper geladen, stattdessen Rueckfall auf `/start`.
3. **Externer Link**
   - Link auf fremde Domain (`https://example.org`) oder `mailto:`/`tel:`.
   - Erwartung: externes Ziel wird nicht still intern gerendert.
4. **Back-Taste (Android)**
   - Mit History: geht eine Seite zurueck.
   - Ohne History: App minimiert sich statt in Spezialflaechen zu springen.

## Internal-Beta Go/No-Go (Android-first)

- **Go**, wenn:
  - `doctor:java` (Java 17+) besteht
  - `build:android:debug` besteht
  - Kernpfade im Wrapper funktionieren (`/start`, Login, Dossier, Swipes, Runden/Anlassraum, Pricing/Vormerken, Stream)
  - externe Links extern bleiben
  - ausgeschlossene Pfade auf `/start` zurueckfallen
- **No-Go**, wenn:
  - Java < 17 oder kein JDK verfuegbar
  - Debug-Build fehlschlaegt
  - MVP-Boundary/Back-Verhalten regressiv ist
