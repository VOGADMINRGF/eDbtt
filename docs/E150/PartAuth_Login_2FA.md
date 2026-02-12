# E150 – Auth & 2FA (Kurznotiz, Run B2C)

> Status-Hinweis (2026-02-12): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`. Keine neuen Runs aus diesem Part ableiten.


## Kanonische Endpoints
- `POST /api/auth/login` – Username/Passwort → ggf. 2FA-Challenge (email/totp).
- `POST /api/auth/verify-2fa` – prüft 6-stelligen Code (E-Mail oder TOTP). Fehlercodes: `invalid_code`, `challenge_missing`, `challenge_expired`, `method_mismatch`.
- `POST /api/auth/totp/verify` – Aktivierung einer neuen TOTP-2FA (Account-Einstellungen).
- `GET /api/auth/me` – Quelle der Wahrheit im Frontend. Felder: `id`, `email`, `roles`, `accessTier`, `planSlug`, `engagementXp`, `engagementLevel`, `contributionCredits`, `vogMembershipStatus`.

## UX-Leitplanken
- Login-Formulare unterscheiden klar zwischen E-Mail-Code („Prüfe dein Postfach“) und TOTP-App („Öffne Auth-App …“).
- Fehlermeldungen sind kurz und verraten keine Account-Existenz (immer „ungültig“ statt „Account fehlt“).
- Rate-Limits vorhanden (IP + User) für Login & 2FA.

## Datenhaltung
- **PII** (E-Mail, Passwort-Hash, OTP-Secret) in PII-DB (`user_credentials`, `twofactor_challenges`).
- **Core/Web** führt die Sessionfelder (`accessTier`, `planSlug/b2cPlanId`, Engagement/XP, Credits) und wird von `/api/auth/me` ausgelesen.
- Session-Cookies setzen `u_id`, `u_role`, `u_tier`, `u_verified` (siehe `sharedAuth.ts`).

## Telemetrie (lightweight)
- `auth.login.success`, `auth.login.failed`, `auth.2fa.failed` in Collection `auth_events`.
- Swipe-Events als `swipe_events` (XP/Credit-Tracking).
