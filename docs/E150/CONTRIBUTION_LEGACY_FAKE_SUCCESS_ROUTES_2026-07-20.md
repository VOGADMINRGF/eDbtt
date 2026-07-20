# Contribution Legacy Fake-Success Routes 2026-07-20

## Scope

- Branch: `fix/contribution-fake-success-routes-01`
- Legacy routes:
  - `apps/web/src/app/api/contributions/drafts/route.ts`
  - `apps/web/src/app/api/contributions/ingest/route.ts`

## Problem

- `/api/contributions/drafts` gab `200 { ok: true }` zurück, obwohl kein persistierter Draft geschrieben wurde.
- `/api/contributions/ingest` gab `201 { ok: true, saved: true }` zurück, obwohl ebenfalls keine Speicherung implementiert war.
- Beide Endpunkte waren damit Wahrheits- und Sicherheitsdrift: sichtbarer Erfolg ohne belastbare Persistenz.

## Caller Audit

- Repo-weite Suche nach `/api/contributions/drafts` und `/api/contributions/ingest` ergab im aktuellen Code- und Testbaum keine produktiven Aufrufer.
- Aktive produktive Save-/Draft-Pfade liegen stattdessen bei:
  - `/api/contributions/save`
  - `/api/create/save` als Wrapper auf `/api/contributions/save`
  - `/api/drafts/save` für den engeren serverseitigen `/runden/new`-Draftpfad
- Der ältere `draftStore`-/`/api/drafts`-Pfad bleibt als separater Legacy-SSOT-Cluster offen (`DRAFTS-LEGACY-SSOT-ALIGN-01`).

## Canonical Decision

- Kein internes Forwarding:
  - `/api/contributions/drafts` war weder auth- noch schema-kompatibel zu `/api/contributions/save` oder `/api/drafts/save`.
  - `/api/contributions/ingest` war ebenfalls kein sicher kompatibler Alias, obwohl `text` und `analysis` grob nach `/api/contributions/save` aussehen; die aktive Route verlangt signierte Session, erweitertes Schema und produktive Review-/Ledger-Guardrails.
- Deshalb wurden beide Legacy-Stubs bewusst auf strukturierte `410 Gone`-Antworten umgestellt.
- Beide Antworten verweisen auf den aktiven kanonischen Beitragsspeicherpfad `/api/contributions/save`.

## Runtime Result

- `POST /api/contributions/drafts`
  - antwortet jetzt mit `410`
  - liefert `ok: false`, `error: "route_gone"`, `route`, `canonicalEndpoint`
- `POST /api/contributions/ingest`
  - antwortet jetzt mit `410`
  - liefert `ok: false`, `error: "route_gone"`, `route`, `canonicalEndpoint`

## Why `/api/contributions/save`

- `/api/contributions/save` ist der aktive produktive Beitragsspeicherpfad mit Session-, Scope-, Safety-, Review- und Ledger-Logik.
- `/api/create/save` ist nur der kanonische Wrapper darauf.
- `/api/drafts/save` bleibt ein engerer Draft-first-Pfad für serverseitige `/runden/new`-Entwürfe und ist nicht still als globaler Ersatz für ältere Contribution-Draft-Stubs beschlossen.

## Validation

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/contribution-fake-success-routes.contract.test.ts`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run build`
