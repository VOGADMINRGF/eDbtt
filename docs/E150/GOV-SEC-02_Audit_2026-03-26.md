# GOV-SEC-02 Auditreport (2026-03-26)

## Scope

Geprüft wurden die aktiven Route-/Auth-/AI-Pfade mit Fokus auf Rollenauflösung, Zugriffskontrollen und Finalize-Ownership:

- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/contributions/finalize/route.ts`
- `apps/web/src/app/api/create/finalize/route.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `apps/web/src/app/api/factcheck/status/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
- `apps/web/src/app/api/finding/upsert/route.ts`
- `apps/web/src/app/api/_diag/gpt/route.ts`
- `apps/web/src/app/api/feeds/_auth.ts`
- `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`
- `apps/web/src/lib/server/auth/admin.ts`

## Ergebnis (kurz)

- 2 Risikofunde mit Follow-up-Bedarf
- 1 positives Kontrollmuster als Referenz bestätigt

## Findings

### F1 — Rollenquelle in Factcheck-/Finding-Routen ist spoofbar (high)

Beobachtung:
- Rollen werden aus `u_role` Cookie, `x-role` Header und in non-prod zusätzlich aus Query-Param `role` abgeleitet.
- Diese abgeleitete Rolle steuert direkte `hasPermission(...)`-Entscheidungen.

Evidenz:
- `apps/web/src/app/api/factcheck/enqueue/route.ts:52`
- `apps/web/src/app/api/factcheck/enqueue/route.ts:319`
- `apps/web/src/app/api/factcheck/status/route.ts:9`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts:19`
- `apps/web/src/app/api/finding/upsert/route.ts:69`
- `apps/web/src/app/api/finding/upsert/route.ts:145`

Risiko:
- Rolleneskalation über unzuverlässige Request-Signale, besonders in non-prod/Preview-Umgebungen.

Follow-up:
- `GOV-SEC-04` (codex_ready): Shared hardening für Rollenauflösung + Telemetrie/Auditlogging je denied-path.
- `GOV-SEC-05` (needs_decision): Produkt-/Ops-Entscheid, ob Header/Query-Rollen vollständig entfallen oder auf strikt signierte Service-Calls begrenzt werden.

### F2 — Editor-Token-Bypass umgeht Admin+2FA-Gate (medium)

Beobachtung:
- `requireAdminOrEditor` akzeptiert `EDITOR_TOKEN` aus Bearer-Header, `x-editor-token` und Cookie.
- Bei gültigem Token wird ein vorheriges Admin/2FA-Forbidden aufgehoben.
- `_diag/gpt` und Feed-Routen hängen an diesem Gate.

Evidenz:
- `apps/web/src/app/api/feeds/_auth.ts:11`
- `apps/web/src/app/api/feeds/_auth.ts:25`
- `apps/web/src/app/api/_diag/gpt/route.ts:8`

Risiko:
- Breitere Angriffsfläche bei Token-Leak (inklusive Cookie-Pfad), unklare Scope-Trennung zwischen Diagnose- und Produktionspfaden.

Follow-up:
- `GOV-SEC-06` (needs_decision): Editor-Token-Scope produktseitig festlegen (nur Header, nur bestimmte Routen, optional IP/Environment-Gates).

## Positive Kontrollen

### P1 — Finalize-Ownership und servergeführtes Redirect-Ziel sind sauber (good)

Beobachtung:
- Finalize verlangt `u_id` und bindet Draft-Lookup an `authorId`.
- `/api/create/finalize` delegiert auf denselben serverseitigen Finalize-Pfad.

Evidenz:
- `apps/web/src/app/api/contributions/finalize/route.ts:90`
- `apps/web/src/app/api/contributions/finalize/route.ts:105`
- `apps/web/src/app/api/create/finalize/route.ts:7`

Referenz:
- `apps/web/src/lib/server/auth/admin.ts:20` zeigt den strengeren Session+2FA-Standard für Admin-Routen.

