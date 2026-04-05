# PR-0041 - Group Surface + Deep Links Closure (2026-04-05)

## Scope

Abschlusspruefung fuer:
- `PR-0041-GROUP-SURFACE`
- `PR-0041-DEEP-LINKS`

Ohne neue Produktlogik und ohne neue Community-Surface.

## Ist-Matrix (Resolver / Route / Page)

| Bereich | Ist-Stand | Drift |
| --- | --- | --- |
| Resolver | `resolveCommunityGroupSurface` in `features/community/groupSurface.ts` liefert nur read-only Readmodel (`discovery`/`group`) mit explizitem `source.unavailable` | keine |
| Route | `GET /api/community/groups` in `app/api/community/groups/route.ts` validiert Deep-Link-Parameter ueber shared Contract und mappt invalid auf stabile 400-Errors | keine |
| Page | `app/community/page.tsx` validiert Deep-Links ebenfalls ueber shared Contract und zeigt invalid/unavailable explizit statt stiller Fallbacks | keine |
| Param-/Alias-Normalisierung | zentral in `features/community/deepLinkContract.ts` (`normalizeCommunityDeepLinkParams`) inkl. Alias (`communityKey/topic/dossier/region/reason`) | keine |
| Canonical-Hrefs | zentral in `buildCommunityHref` mit kanonischen Param-Namen (`group/topicKey/dossierId/regionLabel/reasonLabel`) | keine |
| Invalid-State | stabile Fehlercodes (`invalid_group_type`, `invalid_group_scope`, `invalid_group_context`) | keine |
| Unavailable-State | explizit `community_group_source_unavailable`; kein impliziter Datensatz-Fallback | keine |
| Demo-Fallback-Risiko | explizit ausgeschlossen (Page-/Boundary-Tests gegen Demo-Dossier-Fallback) | keine |

## Verwendete Regressionstests

- `apps/web/tests/community-deep-links.contract.test.ts`
- `apps/web/tests/community-groups.route.test.ts`
- `apps/web/tests/community-groups.no-demo-fallback.test.ts`
- `apps/web/tests/community-page.states.test.ts`
- `apps/web/tests/community-readonly-boundary.test.ts`
- `apps/web/tests/community-groups.resolver.test.ts`

## Ergebnis

Im aktuellen Stand ist keine verbleibende, kleine Contract-Restdrift fuer `PR-0041-GROUP-SURFACE` und `PR-0041-DEEP-LINKS` belastbar nachweisbar.

Beide Tasks sind damit als `done` abschliessbar.

## Bewusst nicht Teil dieses Abschlusses

- keine neue Gruppen-/Community-Produktlogik
- keine neue DM-/Moderationspolitik
- kein Wrapper-/Store-/App-Scope
- kein globales Routing-Redesign
