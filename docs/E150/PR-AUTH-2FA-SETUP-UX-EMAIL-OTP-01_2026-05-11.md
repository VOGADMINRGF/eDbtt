# PR-AUTH-2FA-SETUP-UX-EMAIL-OTP-01

Status: done  
Date: 2026-05-11

## Ziel

Die 2FA-Setup-/Login-Verifikation nach Anmeldung sollte ohne Maus bedienbar, kontraststark und fuer Setup-/Recovery-Kontexte um einen sauberen E-Mail-Code-Fallback ergänzt werden.

## Ergebnis

- `/auth/2fa-setup?next=/admin` rendert jetzt eine eigene `TwoFactorSetupClient`-Surface mit klar lesbarem Input in Dark/Light.
- Das Code-Feld fokussiert nach dem Laden direkt, nutzt numerische Eingabeattribute und normalisiert die Eingabe auf 6 Ziffern.
- `INVALID_CODE` und verwandte Fehler werden als deutsche UX-Meldungen ausgegeben.
- Ein E-Mail-Code kann fuer `setup_fallback` und explizite `recovery`-Sitzungen angefordert und verifiziert werden.
- Bereits aktiviertes TOTP wird nicht still auf E-Mail downgraded.

## Sicherheitsentscheidung

- E-Mail-Code ist **kein** stiller Ersatz fuer ein bereits aktiviertes Authenticator-TOTP.
- Der Fallback ist nur in zwei klaren Kontexten erlaubt:
  - `setup_fallback`: TOTP ist noch nicht final aktiviert.
  - `recovery`: expliziter Recovery-Kontext.
- Erfolgreiche E-Mail-Verifikation markiert nur die **aktuelle Sitzung** ueber `u_2fa_fallback=setup|recovery`.
- TOTP wird dadurch **nicht** dauerhaft als aktiviert gespeichert und nicht automatisch ueberschrieben.
- Challenge-Codes werden nur gehasht gespeichert, sind zeitlich begrenzt und per Cooldown/Rate-Limit gehaertet.

## Geaenderte Dateien

### Auth / UI

- `apps/web/src/app/auth/2fa-setup/page.tsx`
- `apps/web/src/components/auth/TwoFactorSetupClient.tsx`
- `apps/web/src/components/auth/LoginPageShell.tsx`
- `apps/web/src/hooks/useLoginFlow.ts`
- `apps/web/src/features/auth/twoFactorSetup.ts`

### Auth / API / Guards

- `apps/web/src/app/api/auth/sharedAuth.ts`
- `apps/web/src/app/api/auth/2fa/email-code/shared.ts`
- `apps/web/src/app/api/auth/2fa/email-code/send/route.ts`
- `apps/web/src/app/api/auth/2fa/email-code/verify/route.ts`
- `apps/web/src/app/api/auth/2fa/request-email/route.ts`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/app/api/auth/logout/route.ts`
- `apps/web/src/app/api/auth/totp/initiate/route.ts`
- `apps/web/src/app/api/auth/totp/verify/route.ts`
- `apps/web/src/lib/server/auth/sessionUser.ts`
- `apps/web/src/lib/server/auth/twoFactor.ts`
- `apps/web/src/lib/server/auth/admin.ts`
- `apps/web/src/lib/server/auth/governance.ts`
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/app/dashboard/projects/new/page.tsx`
- `apps/web/src/app/api/projects/route.ts`

### Tests

- `apps/web/tests/auth-2fa-setup-ui.contract.test.ts`
- `apps/web/tests/auth-2fa-email-code.route.test.ts`
- `apps/web/tests/auth-login.route.test.ts`

## Verifikation

- `pnpm -C apps/web exec vitest run tests/auth-2fa-setup-ui.contract.test.ts tests/auth-2fa-email-code.route.test.ts tests/auth-login.route.test.ts`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run build`

## Hinweise

- Der Build lief gruen. Waerend `next build` erschien wie zuvor nur der bekannte Hinweis zu `baseline-browser-mapping` sowie waehrend der statischen Sammlung bestehende Mongo-SRV-Noise-Logs; der Build endete trotzdem erfolgreich mit Exit `0`.
