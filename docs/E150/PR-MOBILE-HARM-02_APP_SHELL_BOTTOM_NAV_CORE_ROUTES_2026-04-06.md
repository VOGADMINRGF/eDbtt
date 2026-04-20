# PR-MOBILE-HARM-02 - App-Shell + Bottom-Nav für Mobile Core Routes (2026-04-06)

## Scope

Kleiner Mobile-Shell-Slice für Web + Wrapper auf Basis der bestehenden Kernrouten:

- mobile App-Shell-Maske für freigegebene Kernpfade
- mobile Primary Navigation (Bottom-Bar) nur im Core-Scope
- Header im Shell-Modus kompakter
- Website-Footer im mobilen Shell-Kontext ausgeblendet
- keine neue Produktlogik, keine Native-Feature-Ausweitung

Nicht Teil:

- iOS / Store-Submission
- Push/Offline/Kamera/Chat
- Admin/Research/Operator/Demo/Embed-Flächen
- globale IA-Neuarchitektur

## Route-/Surface-Matrix (entscheidungsrelevant)

| Route/Surface | App-Shell | Bottom-Bar | Header reduziert | Footer raus (mobile) | Web+Wrapper | In Slice |
| --- | --- | --- | --- | --- | --- | --- |
| `/`, `/start` | ja | ja | ja | ja | ja | ja |
| `/swipes`, `/swipes/*` | ja | ja | ja | ja | ja | ja |
| `/runden`, `/anlassraum`, `/round/*` | ja | ja | ja | ja | ja | ja |
| `/dossier/*` | ja | ja | ja | ja | ja | ja |
| `/stream`, `/stream/*` | ja | ja | ja | ja | ja | ja |
| `/pricing`, `/vormerken` | ja | ja | ja | ja | ja | ja |
| `/account*` | ja | ja | ja | ja | ja | ja |
| `/login`, `/register*` | ja | nein | ja | ja | ja | ja |
| `/create` | nein (vorerst) | nein | nein | nein | ja | bewusst später |
| `/admin/**`, `/dashboard/**`, `/demo/**`, `/embed/**`, `/research/**` | nein | nein | nein | nein | ja | ausgeschlossen |

## Umsetzung

1) **App-Shell-Contract**

- `apps/web/src/features/wrapper/mobileAppShellContract.ts`
  - explizite Klassifikation `core` / `auth` / `excluded` / `web`
  - Shell-/BottomNav-/Header-/Footer-Policy pro Pfad

2) **Mobile App-Shell-Chrome**

- `apps/web/src/components/mobile/MobileAppShellChrome.tsx` (neu)
  - body-Klassen für mobile Shell-Modus
  - Bottom-Bar mit Kernzielen:
    - Start (`/start`)
    - Themen (`/runden`)
    - Swipes (`/swipes`)
    - Live (`/stream`)
    - Profil (`/account`)

3) **Layout-/Chrome-Einbindung**

- `apps/web/src/app/layout.tsx`
  - `MobileAppShellChrome` zentral eingebunden
- `apps/web/src/components/SiteFooter.tsx`
  - `data-site-footer` ergänzt
- `apps/web/src/app/(components)/SiteHeader.tsx`
  - Shell-aware: kompakter Header im mobilen Shell-Modus, Mobile-Menübutton ausgeblendet
- `apps/web/src/app/globals.css`
  - mobile Shell-Regeln:
    - Footer in Shell ausblenden
    - Main-Spacing für Bottom-Bar
    - kompakter Header-Style

## Verifikation

Automatisiert:

- `pnpm -C apps/web exec vitest run tests/mobile-app-shell-contract.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/wrapper-android-mvp-policy.test.ts tests/auth-shared.redirect-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Manuelle Smoke-Checks (mobil, Web + Wrapper):

1. `/start`: Bottom-Bar sichtbar, Footer versteckt.
2. `/swipes`: Bottom-Bar sichtbar, Header kompakter, kein Website-Footer.
3. `/stream`: Bottom-Bar sichtbar, schneller Wechsel zu `/runden`/`/account`.
4. `/login` und `/register`: App-Shell aktiv, **ohne** Bottom-Bar.
5. `/admin/*`: keine App-Shell/Bottom-Bar (bleibt normale Web-Shell).
6. Desktop (`md+`): keine Regression durch mobile Bottom-Bar-Regeln.

## Ergebnis

`PR-MOBILE-HARM-02` ist abgeschlossen.

Offen und bewusst später:

- `/create` als eigener App-Shell-Folgeslice nur bei klarem Bedarf (kein Bestandteil dieses Minimal-Slices).
