# GOV-SEC-06B `EDITOR_TOKEN` Route-/Gate-Istmatrix (Stand 2026-03-27)

Ziel:
- bestehenden `EDITOR_TOKEN`-Scope in Feed-/Diag-Routen als Ist-Contract sichtbar machen,
- Allow-/Deny-Verhalten testseitig absichern,
- keine Scope-Entscheidung vorwegnehmen.

Nicht-Ziel:
- keine Erweiterung oder Einschraenkung des aktuellen Scopes,
- keine neue Auth-Policy.

## 1) Aktueller Route-Subset mit Gate

| Route | Method | Gate | Ist-Rolle |
| --- | --- | --- | --- |
| `/api/feeds/drafts` | `GET` | `requireAdminOrEditor` | Draft-Queue lesen |
| `/api/_diag/gpt` | `GET` | `requireAdminOrEditor` | Diag-OpenAI smoke |
| `/api/feeds/pull` | `POST` | `requireAdminOrEditor` | Feed-Pull Trigger |
| `/api/feeds/batch` | `POST` | `requireAdminOrEditor` | Batch-Ingest |
| `/api/feeds/candidates` | `GET` | `requireAdminOrEditor` | Candidate-Liste lesen |
| `/api/feeds/analyze-pending` | `POST` | `requireAdminOrEditor` | Pending-Analyze Trigger |

Code-Evidenz:
- `apps/web/src/app/api/feeds/_auth.ts`
- `apps/web/src/app/api/feeds/drafts/route.ts`
- `apps/web/src/app/api/_diag/gpt/route.ts`
- `apps/web/src/app/api/feeds/pull/route.ts`
- `apps/web/src/app/api/feeds/batch/route.ts`
- `apps/web/src/app/api/feeds/candidates/route.ts`
- `apps/web/src/app/api/feeds/analyze-pending/route.ts`

## 2) Allow-/Deny-Testabdeckung (Ist-Stand)

| Route | Deny getestet | Allow getestet | Testdatei |
| --- | --- | --- | --- |
| `/api/feeds/drafts` | ja | ja | `apps/web/tests/feeds-diag-editor-gate.routes.test.ts` |
| `/api/_diag/gpt` | ja | ja | `apps/web/tests/feeds-diag-editor-gate.routes.test.ts` |
| `/api/feeds/pull` | ja | (nicht Teil dieses Slices) | `apps/web/tests/feeds-editor-token-scope.routes.test.ts` |
| `/api/feeds/batch` | ja | ja | `apps/web/tests/feeds-editor-token-scope.routes.test.ts` |
| `/api/feeds/candidates` | ja | ja | `apps/web/tests/feeds-editor-token-scope.routes.test.ts` |
| `/api/feeds/analyze-pending` | ja | ja | `apps/web/tests/feeds-editor-token-scope.routes.test.ts` |

Helper-Contract:
- `apps/web/tests/feeds-editor-token-auth.test.ts` deckt den Header/Cookie/Bearer-Iststand des Gates ab.

## 3) Offene Decision-Boundary (Parent `GOV-SEC-06`)

- Offen bleibt nur die Produkt-/Security-Entscheidung zum finalen Scope:
  - welches Route-Subset langfristig `EDITOR_TOKEN` nutzen soll,
  - welche Env-Gates/Header-Regeln final gelten.
- Diese Matrix trifft dazu **keine** neue Entscheidung; sie friert nur den aktuellen Ist-Zustand ein.

## 4) Umsetzungsstatus nach Entscheidung (GOV-SEC-06C)

- Die Route-Allowlist wird jetzt zentral in `apps/web/src/app/api/feeds/_auth.ts` erzwungen.
- `EDITOR_TOKEN`-Fallback gilt nur noch fuer den dokumentierten Feed-/Diag-Subset.
- Nicht-allowlisted Pfade bleiben trotz gueltigem `EDITOR_TOKEN` denied (Regressionstest in `apps/web/tests/feeds-editor-token-auth.test.ts`).
