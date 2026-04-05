# GOV-SEC-06D - EDITOR_TOKEN Transport-/Env-Hardening (2026-04-05)

## Scope

Kleiner, entscheidungsfreier Hardening-Slice fuer den bestehenden `EDITOR_TOKEN`-Fallback in Feed-/Diag-Routen:
- Transport-Pruefung robuster machen
- Env-Misconfig klarer signalisieren
- keine Scope-Ausweitung, kein neuer Auth-Standard

Nicht Teil dieses Slices:
- kein Rollen-/Session-Rewrite
- keine neue Identity-Architektur
- keine Produktlogik-Aenderung

## Umgesetzt

1. Transport-Hardening im Feed-/Diag-Gate
- Datei: `apps/web/src/app/api/feeds/_auth.ts`
- Neuer Match-Resolver fuer Tokenquellen:
  - `Authorization` wird nur als gueltig akzeptiert, wenn es ein korrektes `Bearer <token>` ist.
  - Mehrere Tokenquellen (`authorization`, `x-editor-token`, `editor_token` Cookie) muessen konsistent sein; widerspruechliche Werte werden abgewiesen.
  - Malformed Authorization-Header wird nicht still uebergangen.

2. Env-Hardening fuer `EDITOR_TOKEN`
- Datei: `apps/web/src/app/api/feeds/_auth.ts`
- `EDITOR_TOKEN` gilt nur als konfiguriert, wenn:
  - vorhanden,
  - nicht leer,
  - ohne umschliessende Whitespace-Misconfig.
- Bei Token-Fallback auf allowlisted Feed-/Diag-Pfaden wird Misconfig explizit mit `editor_token_not_configured` (HTTP 500) signalisiert.

3. Keine Token-Leaks
- Weder Response-Body noch Logs enthalten Tokenwerte.
- Warnlogs enthalten nur Pfad + Reason-Code.

## Tests

- Datei: `apps/web/tests/feeds-editor-token-auth.test.ts`
- Neu abgesichert:
  - fehlender `EDITOR_TOKEN` + praesentierter Token -> expliziter Misconfig-Fehler
  - whitespace-gepolsterter `EDITOR_TOKEN` -> Misconfig
  - malformed `Authorization` + sonst gueltiger Header -> denied
  - widerspruechliche Tokenquellen -> denied
  - non-allowlisted Pfad bleibt beim Admin-Gate (kein Scope-Drift)

Bestehende Route-Wiring-Tests bleiben gruen:
- `apps/web/tests/feeds-diag-editor-gate.routes.test.ts`
- `apps/web/tests/feeds-editor-token-scope.routes.test.ts`

## Guardrails

- Kein stiller unsicherer Fallback.
- Keine Offenlegung sensibler Tokens.
- Keine Scope-Ausweitung ueber den dokumentierten Feed-/Diag-Allowlist-Subset.
- Kein neuer Auth-/Rollenstandard.
