# PR-FEED-ANLASS-06-BACKFILL - Closure (2026-04-05)

## Scope

Kleiner Abschluss-Slice fuer Legacy-Remediation im Feed/Anlassraum-Kontext:
- keine neue Feed-/Publishing-Architektur
- keine Bulk-Migration
- keine Wrapper-/App-/Store-Arbeit
- nur Detection-/Backfill-Contract-Haertung

## Restmatrix (Ist-Check)

| Pfad / Service / Route / Surface | Legacy-Fall | Detection | Backfill-Aktion | Audit-/Sichtbarkeit | Drift | Klein schliessbar |
| --- | --- | --- | --- | --- | --- | --- |
| `features/feeds/reviewQueue.ts` (`listLegacyVoteDraftsWithoutAnlassraumAuthorized`) | unlinked vote_drafts | filterbar nach `status`/`reviewState`; admin-only | n/a | Queue-Meta + `lastReviewAction*` + `reviewNote` sichtbar | nein | ja |
| `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts` | Legacy-Liste mit Query-Filtern | **gehärtet**: invalide Filter werden explizit mit `400` abgelehnt | n/a | keine stille `all`-Fallback-Interpretation mehr | ja (klein) -> geschlossen | ja |
| `features/feeds/reviewQueue.ts` (`backfillVoteDraftAnlassraumAuthorized`) | per-Draft Remediation | vor Action: `draft_not_found`, `draft_already_has_anlassraum`, admin-only | `attach` oder `create_candidate` | `reviewNote` mit `[legacy-backfill]`, `lastReviewAction*`, `feedReviewState` | nein | ja |
| `apps/web/src/app/api/admin/feeds/drafts/[id]/backfill/route.ts` | API fuer per-item Backfill | `mode` + `anlassraumId` validiert | nur expliziter POST pro Draft | Rückgabe inkl. `remediationKind`, `feedReviewState`, `lastReviewAction*`, `publishGate` | nein | ja |
| `apps/web/src/app/admin/feeds/drafts/page.tsx` (Legacy-Panel) | sichtbare Legacy-Remediation | separates Legacy-Panel mit eigener Detection-Ladung | Buttons pro Draft (`attach`/`create_candidate`) | Outcome + Audit-/Queue-Felder sichtbar | nein | ja |

## Umgesetzte Mini-Haertung

1. Detection-Filter im Legacy-List-Endpoint sind jetzt strikt:
- Datei: `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts`
- Bei ungültigem `status` -> `invalid_status_filter` (`400`)
- Bei ungültigem `reviewState` -> `invalid_review_state_filter` (`400`)
- Kein stilles Zurückfallen auf `all` bei fehlerhaften Query-Werten.

2. Route-Tests erweitern den Contract:
- Datei: `apps/web/tests/feed-review.routes.test.ts`
- Regressionsfälle für invalide `status`-/`reviewState`-Filter ergänzt.

## Tests

- `pnpm -C apps/web exec vitest run tests/feed-review.routes.test.ts tests/feed-backfill.service.test.ts tests/feed-drafts.route.test.ts tests/feed-anlassraum-surface-composition.test.ts tests/feed-signal-decisioning.test.ts tests/feed-draft-status.route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Ergebnis

`PR-FEED-ANLASS-06-BACKFILL` ist im aktuellen Scope als Legacy-Remediation-Track belastbar abgeschlossen:
- Detection bleibt reproduzierbar (keine stillen Filter-Fallbacks)
- Backfill bleibt per Item und explizit
- Audit-/Statussichtbarkeit bleibt intakt
- keine Silent-Migration und keine Fake-Success-Pfade
