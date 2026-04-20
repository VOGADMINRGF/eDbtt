# PR-WRAPPER-04 - Android Internal-Beta Readiness (2026-04-05)

## Scope

Kleiner Android-first Build-/Internal-Beta-Readiness-Slice nach `PR-WRAPPER-03`:

- Build-Voraussetzungen explizit machen
- reproduzierbare Android Build-/Dry-Run-Schritte ergänzen
- MVP-Boundary/Runtime-Smokes gegen Regression absichern
- klare Go/No-Go-Basis für internen Android-Test herstellen

Nicht Teil dieses Slices:

- iOS
- Store-Submission
- Push/Offline/Kamera/Chat
- neue Produktlogik

## Build-/Device-Readiness-Matrix

| Bereich | Aktueller Stand | Risiko | Blocker | In Slice schließbar |
| --- | --- | --- | --- | --- |
| Android-Projektbasis | Capacitor + Android Projekt vorhanden (`PR-WRAPPER-02/03`) | niedrig | nein | ja |
| Runtime-Boundary | Native Guard + Back-Hardening vorhanden (`PR-WRAPPER-03`) | niedrig | nein | ja |
| Java/AGP-Voraussetzung | Lokale JVM war 1.8, AGP 8.x benötigt Java 17+ | hoch | ja (lokal) | ja (Preflight+Runbook) |
| Reproduzierbarer Build-Befehl | Vor Slice kein einheitlicher Wrapper-Build-Entry | mittel | nein | ja |
| Internal-Beta Smokes | Teilweise vorhanden, aber Go/No-Go nicht explizit | mittel | nein | ja |

## Umsetzung

### 1) Java-Preflight als explizites Build-Gate

Neu:

- `apps/wrapper-android/scripts/check-android-java.mjs`

Zweck:

- prüft `java -version`
- erzwingt Java 17+
- liefert klare Fehlermeldung bei Java < 17

### 2) Reproduzierbare Android-Build-Scripts

Anpassung:

- `apps/wrapper-android/package.json`

Neu:

- `doctor:java`
- `build:android:debug`
- `build:android:release`

### 3) Runbook um Build-/Go-No-Go erweitert

Anpassung:

- `apps/wrapper-android/README.md`

Ergänzt:

- Build-Readiness Schritte (Java-Check, Debug-Build, Release-naher Build)
- Internal-Beta Go/No-Go Kriterien

### 4) Wrapper-Policy-Smokes weiter abgesichert

Anpassung:

- `apps/web/tests/wrapper-android-mvp-policy.test.ts`

Abdeckung:

- `later`-Bucket
- Navigation-Entscheidung `in_app`/`fallback`/`external`/`invalid`
- Same-origin-Navigation bleibt im Wrapper nur für MVP-Pfade

## Verifikation

Ausgeführt:

- `pnpm -C apps/wrapper-android run doctor:java`  
  -> erwartetes No-Go auf diesem Host: Java 1.8 (`Java 17+ required`)
- `pnpm -C apps/wrapper-android run build:android:debug`  
  -> reproduzierbar dieselbe No-Go-Meldung via Preflight (kein stiller Gradle-Fehlerpfad)
- `pnpm -C apps/wrapper-android run cap:sync`
- `pnpm -C apps/wrapper-android run doctor` (`Android looking great`)
- `pnpm -C apps/wrapper-android exec tsc --noEmit -p tsconfig.json`
- `pnpm -C apps/web exec vitest run tests/wrapper-android-mvp-policy.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/auth-shared.redirect-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Ergebnis

`PR-WRAPPER-04` ist als Readiness-Slice abgeschlossen:

- Build-/Beta-Pfad ist reproduzierbar dokumentiert
- Java/AGP-Blocker wird explizit und früh erkannt
- MVP-Boundary-/Runtime-Smokes bleiben intakt

Aktueller lokaler Status:

- **No-Go** bis JDK 17+ installiert ist (technischer Host-Blocker, kein Repo-Contract-Blocker)

Folgeschritt:

- `PR-WRAPPER-05`: tatsächliche Device/Emulator Internal-Beta-Ausführung nach JDK17-Setup.
