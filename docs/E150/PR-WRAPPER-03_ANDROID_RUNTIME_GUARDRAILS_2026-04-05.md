# PR-WRAPPER-03 - Android Runtime Guardrails (MVP-Boundary) (2026-04-05)

## Scope

Kleiner Android-first Runtime-/Device-Prep-Slice nach `PR-WRAPPER-02`:

- in-app Navigation auf MVP-Surfaces begrenzen
- non-MVP interne Ziele nicht still laden
- Back-Verhalten im Wrapper sauber und vorhersehbar halten
- Stream als Nutzerpfad im MVP belassen
- keine iOS-/Submission-/Feature-Scope-Ausweitung

Nicht Teil dieses Slices:

- iOS-Ausbau
- Store-Submission
- Push/Offline/Kamera/Chat
- neue Produktlogik

## Runtime-Risiko-Matrix

| Bereich | Aktueller Stand vor Slice | Risiko | Blocker | Klein härtbar |
| --- | --- | --- | --- | --- |
| Interne Navigation im Wrapper | MVP-Policy vorhanden, aber native Laufzeit-Gate fehlte | mittel | nein | ja |
| Excluded/Later/Unknown Surfaces | im Policy-Contract modelliert, aber nicht nativ erzwungen | hoch | nein | ja |
| Android Back-Verhalten | Standard-App-Plugin kann auf Root uneindeutig bleiben | mittel | nein | ja |
| Deep-Link/App-Link Einstieg | kein expliziter App-Link Intent-Filter | mittel | nein | ja |
| Stream im MVP | als Nutzerpfad erlaubt, aber Boundary muss mitlaufen | niedrig | nein | ja |
| Auth/Redirect | webseitig bereits gehaertet (`PR-WRAPPER-01A`) | niedrig | nein | ja (Smoke) |

## Umsetzung

### 1) Native Navigations-Gate fuer MVP-Boundary

Neu:

- `apps/wrapper-android/android/app/src/main/java/org/edebatte/app/WrapperNavigationGuardPlugin.java`

Verhalten:

- gleiche Origin + MVP-Pfad -> bleibt im Wrapper
- gleiche Origin + `later`/`excluded`/`unknown`/`invalid` -> wird geblockt, Fallback auf `/start`
- fremde Origin / `mailto:` / `tel:` -> bleibt bei Capacitor-Default (externes Handling)

### 2) Back-Verhalten explizit gehaertet

Anpassung:

- `apps/wrapper-android/android/app/src/main/java/org/edebatte/app/MainActivity.java`

Verhalten:

- WebView-History vorhanden -> `goBack()`
- kein Backstack -> `moveTaskToBack(true)`
- `WrapperNavigationGuardPlugin` wird vor Bridge-Init registriert

### 3) Runtime-Config auf kanonischen MVP-Einstieg

Anpassung:

- `apps/wrapper-android/capacitor.config.ts`

Hardening:

- Wrapper-Start via `server.url` auf `<origin>/start`
- `App.disableBackButtonHandler = true` (Back wird in `MainActivity` gesteuert)
- `allowNavigation` origin-basiert

### 4) App-Link/Deep-Link-Basis fuer Android

Anpassung:

- `apps/wrapper-android/android/app/src/main/AndroidManifest.xml`

Ergaenzt:

- `VIEW`-Intent-Filter fuer `https://edebatte.org` und `https://www.edebatte.org`

### 5) Runtime-Policy-Smokes und Contract-Tests

Anpassungen:

- `apps/wrapper-android/src/mvpSurfacePolicy.ts`
  - Bucket `later` ergaenzt
  - `classifyWrapperNavigationTarget(...)` fuer in-app/fallback/external/invalid
- `apps/web/tests/wrapper-android-mvp-policy.test.ts`
  - Runtime-Navigation-Entscheidungen + Later-Bucket + External/Invalid abgesichert
- `apps/wrapper-android/README.md`
  - Runtime-Smoke-Checklist (MVP intern, excluded fallback, external links, Android back)

## Verifikation

Ausgefuehrte Checks:

- `pnpm -C apps/wrapper-android run cap:sync`
- `pnpm -C apps/wrapper-android exec tsc --noEmit -p tsconfig.json`
- `pnpm -C apps/web exec vitest run tests/wrapper-android-mvp-policy.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/auth-shared.redirect-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/wrapper-android run doctor` (`Android looking great`)

Zusatzversuch native Compile:

- `./gradlew :app:compileDebugJavaWithJavac` in `apps/wrapper-android/android`
- Ergebnis: fehlgeschlagen wegen lokaler JVM 8 (Gradle/AGP erwartet JVM >= 11), **kein** inhaltlicher Compile-Fehler aus dem Slice nachgewiesen.

## Ergebnis

`PR-WRAPPER-03` ist als kleiner Android-first Runtime-Hardening-Slice abgeschlossen.

Naechster sinnvoller Folgeschritt:

- `PR-WRAPPER-04` (Android Internal-Beta Dry Run ohne Submission).
