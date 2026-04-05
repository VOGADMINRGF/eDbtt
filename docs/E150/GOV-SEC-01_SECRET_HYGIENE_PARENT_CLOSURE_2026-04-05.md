# GOV-SEC-01 - Secret Hygiene Parent Closure (2026-04-05)

## Scope

Small parent-closure slice for `GOV-SEC-01`:
- no new auth architecture
- no infra/secrets/deployment rewrite
- no wrapper/app/store scope
- only real secret/env/runtime hygiene rest-check

## Rest Matrix (real check)

| Pfad / Helper | Risikoart | Bereits abgedeckt | Restdrift | Klein schließbar |
| --- | --- | --- | --- | --- |
| `apps/web/src/lib/server/env/runtimeMongo.ts` + `runtimeMongoErrors.ts` + `mongoPing.ts` | Mongo runtime/env alias consistency, classified failure behavior | Ja (`PR-ENV-01`, `PR-ENV-02A/B`) | Nein | n/a |
| `apps/web/src/app/api/feeds/_auth.ts` | Editor token transport/env fallback hardening | Ja (`GOV-SEC-06D`) | Nein | n/a |
| `apps/web/src/lib/security/human-token.ts` | Secret fallback hygiene (`DEFAULT_SECRET`) under production | Teilweise (nicht explizit geschlossen) | Ja | Ja |
| `apps/web/src/app/api/security/verify-human/route.ts` | Misconfig visibility for missing human token secret | Nein | Ja | Ja |

## Implemented Closure Hardening

### 1) Production no longer silently falls back to static default human-token secret

File:
- `apps/web/src/lib/security/human-token.ts`

Change:
- `HUMAN_CHECK_SECRET` / `NEXTAUTH_SECRET` stay primary.
- If none is configured and `NODE_ENV=production`, signing now fails with explicit `human_token_secret_not_configured`.
- Dev/test fallback remains available for local use.

### 2) Explicit misconfiguration response for verify-human token minting route

File:
- `apps/web/src/app/api/security/verify-human/route.ts`

Change:
- route maps missing production secret to:
  - `503`
  - `{ ok: false, code: "human_token_secret_not_configured" }`
- avoids silent insecure runtime state.

## Tests / Verification

Added:
- `apps/web/tests/human-token.security.test.ts`
  - dev fallback still works
  - production without configured secret rejects signing explicitly
- `apps/web/tests/security-verify-human.route.test.ts`
  - verify-human route returns explicit `503` misconfiguration response

Executed:
- `pnpm -C apps/web exec vitest run tests/human-token.security.test.ts tests/security-verify-human.route.test.ts tests/runtime-mongo-env.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Result

`GOV-SEC-01` is closable as done:
- real residual secret hygiene drift was small and closed
- no new security architecture was introduced
- no fake safety via docs-only closure
