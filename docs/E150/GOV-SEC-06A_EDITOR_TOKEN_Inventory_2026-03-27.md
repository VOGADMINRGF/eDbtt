# GOV-SEC-06A — EDITOR_TOKEN Ist-Inventar (2026-03-27)

Zweck: aktuellen Ist-Vertrag fuer `EDITOR_TOKEN` in Feed-/Diag-Routen dokumentieren, ohne Scope-Entscheidung vorwegzunehmen.

## 1) Aktueller Gate-Contract

Quelle: `apps/web/src/app/api/feeds/_auth.ts`

- Primary Gate: `requireAdminOrResponse(req)` (Session + Admin + 2FA).
- Fallback-Gate: `EDITOR_TOKEN` (nur wenn Admin-Gate ablehnt).
- Akzeptierte Token-Eingaenge (in dieser Reihenfolge):
  1. `Authorization: Bearer <token>`
  2. `x-editor-token: <token>`
  3. `editor_token` Cookie
- Vergleich: konstantzeitnah per `safeEqual`, gegen `process.env.EDITOR_TOKEN`.
- Kein neuer Auth-Standard, keine Rollen-Ableitung aus Query/Headern.

## 2) Aktuell angebundene Feed-/Diag-Routen

Alle folgenden Routen nutzen `requireAdminOrEditor`:

- `POST /api/feeds/analyze-pending` (`apps/web/src/app/api/feeds/analyze-pending/route.ts`)
- `GET /api/feeds/drafts` (`apps/web/src/app/api/feeds/drafts/route.ts`)
- `GET /api/feeds/candidates` (`apps/web/src/app/api/feeds/candidates/route.ts`)
- `POST /api/feeds/batch` (`apps/web/src/app/api/feeds/batch/route.ts`)
- `POST /api/feeds/pull` (`apps/web/src/app/api/feeds/pull/route.ts`)
- `GET /api/_diag/gpt` (`apps/web/src/app/api/_diag/gpt/route.ts`)

## 3) Test-Baseline (Allow/Deny)

- Helper-Contract:
  - `apps/web/tests/feeds-editor-token-auth.test.ts`
- Route-Wiring (Feed + Diag):
  - `apps/web/tests/feeds-diag-editor-gate.routes.test.ts`

Diese Tests fixieren nur den Ist-Stand. Sie erweitern und verengen den Scope nicht.

## 4) Offene Decision-Boundary (Parent GOV-SEC-06)

Nicht entschieden (bewusst offen):

- Soll `EDITOR_TOKEN` dauerhaft als Fallback bleiben?
- Soll der Scope auf ein engeres Route-Subset reduziert werden?
- Welche Diag-Routen duerfen kuenftig denselben Fallback verwenden?

Diese Fragen bleiben im Parent-Task `GOV-SEC-06` (`needs_decision`).
