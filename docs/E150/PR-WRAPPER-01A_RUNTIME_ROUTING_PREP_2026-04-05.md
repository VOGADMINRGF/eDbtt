# PR-WRAPPER-01A - Wrapper Runtime-/Routing-Prep (2026-04-05)

## Scope

Kleiner technischer Prep-Slice fuer den spaeteren Wrapper-MVP:

- expliziter MVP-Surface-Allowlist-Contract
- interne vs. externe Link-Klassifikation vorbereiten
- Session-/Redirect-/Deep-Link-Smokes einfrieren
- kein nativer Wrapper-Stack
- keine neue Produktlogik

## Scope-Matrix (aus PR-WRAPPER-01 abgeleitet)

| Surface / Pfad | MVP erlaubt | Alias / Deep-Link | Extern-Link-Risiko | Session-/Redirect-Risiko | In Slice gehärtet |
| --- | --- | --- | --- | --- | --- |
| `/create`, `/swipes`, `/runden`, `/dossier/[id]`, `/pricing` | ja | ja (inkl. Query) | niedrig | mittel | ja |
| Alias-Pfade `/anlassraum`, `/sw`, `/swipe` | ja (aliasbasiert) | ja (kanonisch auf Zielpfade) | niedrig | niedrig | ja |
| `/atlas`, `/atlas/weekly`, `/community` | spaeter | ja | niedrig | niedrig | ja (als `later`) |
| `/admin/**`, `/dashboard/**`, `/atlas/social-review`, `/demo/**`, `/embed/**` | nein | nein | mittel | niedrig | ja (als `excluded`) |

## Umsetzung

### 1) Wrapper-MVP Surface-Allowlist-Contract

Neu: `apps/web/src/features/wrapper/mvpSurfaceContract.ts`

- `classifyWrapperMvpPath(...)`
- `isWrapperMvpAllowedPath(...)`
- explizite Buckets: `mvp`, `later`, `excluded`, `unknown`, `invalid`
- alias-kanonisierung fuer Wrapper-relevante Legacy-/Compat-Pfade:
  - `/anlassraum` -> `/runden`
  - `/sw` -> `/swipes`
  - `/swipe` -> `/swipes`

### 2) External-Link-Handling-Konzept technisch vorbereitet

Im selben Contract:

- `classifyWrapperHref(...)` trennt explizit:
  - `internal` (inkl. same-origin absolute URLs)
  - `external` (`http/https/mailto/tel`)
  - `invalid` (z. B. `javascript:`)
- damit kann ein spaeterer nativer Wrapper internal routing und externe Oeffnung robust trennen.

### 3) Redirect-Hardening fuer Session-/Auth-Flow

Anpassung: `apps/web/src/app/api/auth/sharedAuth.ts`

- `sanitizeRedirect(...)` normalisiert jetzt ueber `normalizeInternalRedirectPath(...)`
- unsaubere/unsichere Werte fallen defensiv auf `DEFAULT_REDIRECT` zurueck
- verhindert stille Redirect-Ziele ausserhalb interner Pfade.

## Tests / Verifikation

- Neu: `apps/web/tests/wrapper-mvp-surface-contract.test.ts`
  - MVP/later/excluded-Klassifikation
  - Alias-Kanonisierung
  - internal/external/invalid href-Klassifikation
- Neu: `apps/web/tests/auth-shared.redirect-contract.test.ts`
  - sanitizeRedirect: interne Pfade + externe Origin-Strip
  - fallback bei unsicheren Werten (`javascript:`)
- Mitgelaufen: `apps/web/tests/anlassraum-alias.route.test.ts`
  - Alias-Redirect-Paritaet bleibt intakt

Command-Check:

- `pnpm -C apps/web exec vitest run tests/wrapper-mvp-surface-contract.test.ts tests/auth-shared.redirect-contract.test.ts tests/anlassraum-alias.route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Ergebnis

- `PR-WRAPPER-01A` ist als entscheidungsfreier Prep-Slice abgeschlossen.
- `PR-WRAPPER-01B` bleibt sauber als naechster Decision-Step (Wrapper-Stack-/Store-Policy-Entscheidung) vorbereitet.
