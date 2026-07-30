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

## Ausführungsreihenfolge

Dieser Slice ist eine ausdrücklich begrenzte Reparatur des bestehenden
Login-/2FA-Pfads.

Er darf vor `PROD-RUNTIME-02`, `PROD-TEST-ACCOUNT-03B` und
`PROD-AUTHENTICATED-SMOKE-03C` technisch umgesetzt werden, weil ein
zuverlässiger Login Voraussetzung für diese späteren manuellen Gates ist.

Diese Freigabe bedeutet ausdrücklich nicht:

- Aktivierung oder Bestätigung einer Production-Runtime
- Bereitstellung eines Production-Testkontos
- Nachweis eines authentifizierten Production-Smokes
- Freigabe von Production-Mutationen

Die technische Umsetzung setzt den Task ausschließlich auf `review`.
`done` bleibt bis zum dokumentierten manuellen Smoke ausgeschlossen.

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

## Technische Evidence — 2026-07-28

### Root Cause

- `useLoginFlow.submitTwoFactor()` setzte `loading` im `finally` auch nach
  erfolgreicher Verifizierung wieder auf `false`.
- Ein schneller zweiter Submit konnte vor dem nächsten React-Render einen
  zweiten Verify-Request auslösen.
- Die Verify-Route behandelte fehlende oder verbrauchte Challenges immer als
  Fehler, auch wenn bereits eine gültige aktive 2FA-Session bestand.
- Erfolgstelemetrie wurde nach Session- und Cookie-Erstellung awaited und
  konnte dadurch die erfolgreiche Antwort verzögern oder in einen
  `server_error` verwandeln.
- Die Loginoberfläche zeigte die E-Mail-Challenge-Laufzeit auch für
  zeitfensterbasierte Authenticator-Codes.
- Externe Redirect-URLs wurden nicht als Ganzes verworfen; ihr Pfad wurde als
  internes Ziel weiterverwendet. Login-Schleifen waren nicht gesondert
  ausgeschlossen.

### Umsetzung

- synchroner `useRef`-Guard vor dem ersten `await`
- terminale Zustände `submitting` und `redirecting`
- `loading` bleibt nach Erfolg gesetzt; Formular, Methodenwahl, Codefeld,
  Resend und Zurück-Aktion bleiben gesperrt
- Guard wird nur nach einem echten Fehler kontrolliert freigegeben
- atomarer Challenge-Consume über Status- und `consumedAt`-Filter
- Replay-Erfolg nur über `getSessionUser(req)` bei gültiger, aktiver und
  tatsächlich 2FA-authentifizierter Session
- kein neuer Session-Write bei Replay
- Session- und Cookie-Writes bleiben vollständig awaited
- Erfolgs- und optionale Auth-Telemetrie laufen über einen lokal
  fehlerentkoppelten Best-effort-Helper
- externe Redirectziele werden verworfen; `/login`-Schleifen fallen auf das
  rollenbasierte kanonische Ziel zurück
- Minutenlaufzeit erscheint nur für den bestehenden E-Mail-OTP-Vertrag

### Geänderte Produktpfade

- `apps/web/src/hooks/useLoginFlow.ts`
- `apps/web/src/components/auth/LoginPageShell.tsx`
- `apps/web/src/components/auth/HeaderLoginInline.tsx`
- `apps/web/src/app/api/auth/verify-2fa/route.ts`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/app/api/auth/sharedAuth.ts`
- `apps/web/src/features/auth/roleExperienceContract.ts`
- `core/telemetry/authEvents.ts`

### Tests

Grün:

- 9 fokussierte Testdateien
- 36 Tests
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Der Produktions-Build:

- Seitenvertrag grün
- UI- und Tri-Mongo-Paket-Build grün
- Next.js-Kompilierung grün
- nachgelagertes Page-Data-Collect blockiert im secret-freien Worktree an
  fehlenden bestehenden Pflichtwerten wie `JWT_SECRET` und den DB-/Graph-ENV
- keine ENV-, Secret- oder Credential-Datei wurde gelesen oder verändert

### Verbleibendes Gate

Der dokumentierte manuelle Login-/TOTP-/E-Mail-OTP-Smoke einschließlich
Reload-Persistenz bleibt vor `done` erforderlich.
