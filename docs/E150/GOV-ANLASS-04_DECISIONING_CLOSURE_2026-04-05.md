# GOV-ANLASS-04 / PR-FEED-ANLASS-04 - Decisioning Closure (2026-04-05)

## Scope

Kleiner Abschluss-Slice fuer Feed->Anlassraum-Decisioning:
- keine neue Produktlogik
- keine neue Publishing-Logik
- keine Wrapper-/App-/Store-Arbeit
- nur Contract-Hardening fuer Queue-/Decision-/Statuspfade

## Restmatrix (Ist-Check)

| Pfad / Surface / Route | Entscheidungstyp | Status-Transition | Audit-/Sichtbarkeit | Drift | Minimal schliessbar |
| --- | --- | --- | --- | --- | --- |
| `features/feeds/signalDecisioning.ts` + `features/feeds/reviewQueue.ts` | `ignore`, `attach_to_anlassraum`, `create_anlassraum_candidate`, `mark_as_weak_signal` | Attach-first bei bestehender Zuordnung via `pathFromFeedReviewAction` + effective-action Umschaltung | `lastReviewAction*`, `feedReviewState`, `reviewNote`, `weakSignal` werden gesetzt | nein | ja |
| `apps/web/src/app/api/admin/feeds/drafts/[id]/review/route.ts` | Einzelentscheidung Draft | explizit per Action auf `ignored/attached/candidate_created/weak_signal` | Route liefert Draft-Status inkl. Review-Meta + Publish-Gate | nein | ja |
| `apps/web/src/app/api/admin/feeds/drafts/route.ts` | Queue-Lesen inkl. Decision-Pfad | read-only Queue-/Filter-/Sort-Pfade | `queueMeta`, `lastReviewAction*`, `surfaceComposition` sichtbar | nein | ja |
| `apps/web/src/app/api/admin/feeds/drafts/[id]/status/route.ts` | manueller Statuswechsel (`draft/review/discarded`) | **gehärtet**: `discarded -> ignored`, `ignored + reopen -> queued`, sonst current state | Response liefert `feedReviewState` + `lastReviewAction*` fuer direkte UI-Nachvollziehbarkeit | ja (klein) -> geschlossen | ja |
| `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx` | Detail-Surface Status-/Review-Sicht | Statuswechsel-UI | **gehärtet**: lokale State-Rehydrierung fuer `feedReviewState` + `lastReviewAction*` nach Statuswechsel | ja (klein) -> geschlossen | ja |
| `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts` + Backfill-Services | Legacy-Remediation | Attach/Create-Candidate nur manuell/admin | Audit-/Review-Felder bleiben sichtbar, keine Silent-Migration | separater Rest | nein (in diesem Slice) |

## Umgesetzte Mini-Härtung

1. Status-Route-Kontrakt konsistent gemacht:
- Datei: `apps/web/src/app/api/admin/feeds/drafts/[id]/status/route.ts`
- `feedReviewState` wird bei manuellem Statuswechsel explizit und konsistent gesetzt:
  - `discarded` => `ignored`
  - Reopen aus `ignored` => `queued`
  - sonst aktueller Zustand bzw. defensiv `queued`
- Route-Response gibt jetzt auch `feedReviewState` und `lastReviewAction*` zurück.

2. Detail-Surface-Rehydrierung verbessert:
- Datei: `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`
- Nach Statuswechsel wird lokaler Draft-State um `feedReviewState`, `lastReviewAction*`, `updatedAt` aktualisiert.

## Tests (gezielt, ohne neue Testwelt)

- `apps/web/tests/feed-draft-status.route.test.ts` (neu)
  - `discarded` mappt stabil auf `ignored`
  - reopen aus `ignored` mappt stabil auf `queued`
  - nicht-ignorierter Zustand bleibt bei Statuswechsel erhalten
- Mitgelaufen als bestehende Abschlussabdeckung:
  - `apps/web/tests/feed-review.routes.test.ts`
  - `apps/web/tests/feed-signal-decisioning.test.ts`
  - `apps/web/tests/feed-backfill.service.test.ts`
  - `apps/web/tests/feed-drafts.route.test.ts`
  - `apps/web/tests/feed-anlassraum-surface-composition.test.ts`

## Ergebnis

- `GOV-ANLASS-04` ist im aktuellen Scope als Decisioning-Parent belastbar abgeschlossen.
- `PR-FEED-ANLASS-04` ist als Status-/Decisioning-Hardening ebenfalls abgeschlossen.
- `PR-FEED-ANLASS-06-BACKFILL` bleibt bewusst separat `in_progress` (Legacy-Remediation, kein stiller Backfill).
