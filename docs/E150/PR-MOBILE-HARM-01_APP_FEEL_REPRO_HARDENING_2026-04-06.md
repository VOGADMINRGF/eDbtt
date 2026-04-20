# PR-MOBILE-HARM-01 - Mobile RePro / App-feel Hardening (2026-04-06)

## Scope

Kleiner, gebuendelter Mobile-Hardening-Slice fuer Web + Wrapper-Wahrnehmung:

- Mobile/App-Chrome beruhigen
- Cookie-/Footer-Website-Gefuehl auf Mobile reduzieren
- Register-/Onboarding-Uebergang aus Submit-Flows nachvollziehbarer machen
- Input-/Human-Check-Kontraste und Dark-Safety nachhaerten
- datenschutzsaubere Adresshilfe im Register andocken

Nicht Teil dieses Slices:

- iOS
- Store-Submission
- Push/Offline/Kamera/Chat
- neue Produktlogik oder IA-Neubau

## Problemmatrix (Ist -> Slice)

| Bereich | Betroffen | Problemtyp | Klein schliessbar | Prioritaet |
| --- | --- | --- | --- | --- |
| Footer-Chrome | `SiteFooter` | mobile chrome (web+wrapper) | ja | hoch |
| Cookie-Hinweis | `CookieConsentBanner` | mobile chrome (web+wrapper) | ja | hoch |
| Header-Top-Chrome | `SiteHeader` | mobile chrome (web+wrapper) | ja | mittel |
| Submit -> Register | Register-Einstieg mit `next`-Ziel | submit/onboarding (web+wrapper) | ja | hoch |
| `@`/Sonderzeichen-Friktion | Login/Register Inputs | input friction (web+wrapper) | ja | mittel |
| Dark-Contrast bei Human-Check | `HumanCheck` + 2FA-Hinweis im Login | theme/contrast (web+wrapper) | ja | mittel |
| Adresshilfe | Register Schritt 1 | input/address (web+wrapper) | ja (klein) | mittel |
| Mobile Bottom-Bar global | Kernpfade gesamt | mobile chrome / IA | nein (Decision-Slice) | offen |

## Umsetzung

### 1) Mobile/App-Chrome

- `apps/web/src/components/SiteFooter.tsx`
  - Mobile Footer auf kompakten Legal-/Help-Strip reduziert
  - volles Footer-Grid nur noch ab `md`
- `apps/web/src/components/privacy/CookieConsentBanner.tsx`
  - klassischer Bottom-Bar-Charakter entfernt
  - Overlay/Sheet-Variante (mobile-first) mit klarer Fokusflaeche
- `apps/web/src/app/(components)/SiteHeader.tsx`
  - Top-Chrome auf Mobile kompakter gemacht (ruhigeres App-Gefuehl)

### 2) Registration / Onboarding / Submit-Bridge

- `apps/web/src/app/register/registerFlowBridge.ts` neu
  - kontextbezogene Welcome-Bridge fuer `next`-Ziele (`/create`, `/mitglied-antrag`, `/stream`, `/pricing`/`/vormerken`)
- `apps/web/src/app/register/RegisterPageClient.tsx`
  - Welcome-Bridge sichtbar im Register-Start
  - Login-Link behaelt `next` bei (kein Kontextverlust)

### 3) Input-/Human-Check-/Contrast-Hardening

- `apps/web/src/app/register/RegisterPageClient.tsx`
  - Email/Password mit mobile-friendly Input-Attributen (`autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`)
- `apps/web/src/components/auth/LoginPageShell.tsx`
  - gleiche Input-Hardening-Attribute fuer Login
  - 2FA-Hinweis dark-safe kontrastiert
- `apps/web/src/components/security/HumanCheck.tsx`
  - Full-Variante farblich dark-safe (kein helles Gruen-Panel im Dark-Mode)

### 4) Adresshilfe (datenschutzsauber)

- `apps/web/src/app/register/RegisterPageClient.tsx`
  - kleine OSM/Nominatim-Adresshilfe ueber bestehendes `/api/geo/search`
  - Vorschlaege fuellen Strasse/Hausnummer/PLZ/Ort/Land vor
  - keine Google-Abhaengigkeit

## Verifikation

Automatisiert:

- `pnpm -C apps/web exec vitest run tests/register-flow-bridge.test.ts tests/wrapper-android-mvp-policy.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/auth-shared.redirect-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Manuelle Smoke-Checks (mobil):

1. Startseite / mobile: Footer wirkt kompakt, kein grosses Website-Grid.
2. Cookie-Hinweis: als Overlay/Sheet, nicht als dauerhafte Footer-Bar.
3. Register mit `next` aus `/create` und `/mitglied-antrag`: Welcome-Bridge sichtbar.
4. Register/Login Email-Eingabe: mobile Tastatur zeigt `@` sauber an.
5. Register Schritt 1: Strassenfeld liefert OSM-Vorschlaege und fuellt Felder.
6. Dark-Mode: HumanCheck + Login-2FA-Hinweis bleiben kontrastklar.

## Ergebnis

`PR-MOBILE-HARM-01` ist abgeschlossen.

Weiterer sinnvoller Folgeschritt:

- `PR-MOBILE-HARM-02` fuer die explizite Entscheidung/ggf. Pilotierung einer mobilen Primary-Navigation (Bottom-Bar) auf Kernpfaden.
