# PR-WRAPPER-02 - Android-first Capacitor Bootstrap (2026-04-05)

## Scope

Erster echter Wrapper-Implementierungsslice nach `PR-WRAPPER-01/01A/01B`:

- Capacitor-Grundgeruest im Repo
- Android-first Plattformbasis
- Anbindung an bestehenden Web-Kern ueber `server.url`
- MVP-Surface-Policy im Wrapper-Kontext dokumentiert/typisiert

Nicht Teil dieses Slices:

- iOS-Parallelausbau
- Store-Submission
- Push/Offline/Kamera/Chat
- neue Produktlogik

## Scope-Matrix

| Bereich | Aktueller Stand vor Slice | Fuer PR-WRAPPER-02 noetig | Risiko | Klein schliessbar |
| --- | --- | --- | --- | --- |
| Wrapper-App-Struktur | nicht vorhanden | ja | mittel | ja |
| Capacitor-Config | nicht vorhanden | ja | niedrig | ja |
| Android-Projektbasis | nicht vorhanden | ja | mittel | ja |
| Web-Anbindung | nur Decision/Prep-Doku | ja (`server.url`) | mittel | ja |
| MVP-Surface-Policy | nur im Web-Prep-Contract | ja (wrapper-nahe Spiegelung) | niedrig | ja |
| iOS/Submission | bewusst ausser Scope | nein | - | - |

## Umsetzung

Neu angelegt:

- `apps/wrapper-android/package.json`
- `apps/wrapper-android/capacitor.config.ts`
- `apps/wrapper-android/tsconfig.json`
- `apps/wrapper-android/README.md`
- `apps/wrapper-android/.gitignore`
- `apps/wrapper-android/src/mvpSurfacePolicy.ts`
- `apps/wrapper-android/www/index.html`

Capacitor/Android initialisiert:

- `apps/wrapper-android/android/**` per `cap add android`
- anschliessend `cap sync android` erfolgreich

Zusatztest (webseitig, repo-nah):

- `apps/web/tests/wrapper-android-mvp-policy.test.ts`

## Verifikation

Ausgefuehrte Checks:

- `pnpm install`
- `pnpm -C apps/wrapper-android run cap:add:android`
- `pnpm -C apps/wrapper-android run cap:sync`
- `pnpm -C apps/wrapper-android run doctor` (Android OK)
- `pnpm -C apps/wrapper-android exec tsc --noEmit -p tsconfig.json`
- `pnpm -C apps/web exec vitest run tests/wrapper-android-mvp-policy.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/auth-shared.redirect-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## MVP-Grenze im Wrapper-Slice

- Stream bleibt im MVP als Nutzerpfad enthalten (`/stream`, `/stream/[slug]`).
- Admin/Demo/Research/Operator-Spezialflaechen bleiben ausgeschlossen.
- Wrapper bleibt Distribution-Shell fuer den bestehenden Web-Kern.

## Ergebnis

`PR-WRAPPER-02` ist als kleiner Android-first Bootstrap-Slice abgeschlossen.

Klarer Folgepunkt:
- Runtime-nahe Eintritts-/Navigationsgrenzen im nativen Shell-Kontext weiter haerten (ohne Scope-Sprung).
