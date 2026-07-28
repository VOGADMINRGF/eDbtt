# AUTH-2FA-REDIRECT-IDEMPOTENCY-01

Stand: 2026-07-27  
Status: codex_ready  
Priorität: P0  
Issue: #477

## Befund

Ein gültiger 2FA-Code schließt die Session serverseitig bereits ab. Die
Loginoberfläche leitet danach jedoch nicht zuverlässig weiter. Bei einer
zweiten Bestätigung ist die Challenge schon verbraucht und es erscheint ein
irreführender Sitzungs- oder Challenge-Fehler, obwohl die Session aktiv ist.

## Ziel

Login und 2FA werden nach genau einer erfolgreichen Bestätigung vollständig,
sichtbar und idempotent abgeschlossen.

## Verbindlicher Scope

- genau ein erfolgreicher 2FA-Submit genügt
- nach Erfolg sofortige Navigation zum sicher bereinigten Ziel
- Formular bleibt nach erfolgreicher Verifizierung gesperrt
- schneller Doppelklick löst keine zweite Verifizierung aus
- `next` bleibt erhalten und darf keine Login-Schleife bilden
- Replay ist nur bei eindeutig vorhandener gültiger Session erfolgreich
- ohne gültige Session bleibt `challenge_missing` fail-closed
- optionale Telemetrie blockiert weder Session-Cookies noch Erfolgsantwort
- TOTP und E-Mail-OTP bleiben getrennte Methoden
- Authenticator-Texte zeigen keine irreführende Challenge-Minutenlaufzeit

## Harte Grenzen

- keine `.env`-, Secret-, MongoDB-, SMTP- oder Provideränderung
- kein 2FA-Bypass und keine Demo-Ausnahme
- keine Rollen-, Konto- oder Credential-Migration
- kein allgemeiner Auth-, Layout- oder I18N-Umbau
- keine Änderungen an `/create`, `/runden`, `/dossier` oder Marketing
- kein paralleler Authentifizierungspfad

## Zu prüfende Pfade

- `apps/web/src/hooks/useLoginFlow.ts`
- `apps/web/src/components/auth/LoginPageShell.tsx`
- `apps/web/src/app/api/auth/verify-2fa/route.ts`
- bestehende Session-, Cookie- und Redirect-Helper
- `core/telemetry/authEvents.ts`
- vorhandene Login- und 2FA-Tests

## Akzeptanzkriterien

1. Ein gültiger TOTP- oder E-Mail-Code führt mit einem Submit zum Ziel.
2. Session-Cookies sind vor der Navigation aktiv.
3. Nach Erfolg bleibt das Formular dauerhaft gesperrt.
4. Schneller Doppelklick erzeugt nur einen Verify-Request.
5. Replay ist nur bei gültiger Session idempotent erfolgreich.
6. Ungültige und abgelaufene Codes bleiben fail-closed.
7. Telemetriefehler blockieren den erfolgreichen Login nicht.
8. Fokussierte Route-, Hook-, UI- und Regressions-Tests sind grün.
9. Der technische Abschluss setzt den Task auf `review`.
10. Ein manueller lokaler Smoke bleibt vor `done` erforderlich.
