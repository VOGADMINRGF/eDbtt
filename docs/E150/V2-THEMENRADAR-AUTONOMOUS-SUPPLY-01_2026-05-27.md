# V2-THEMENRADAR-AUTONOMOUS-SUPPLY-01

## Ziel

Themen aus Feeds, Quellen, Create-Handoffs, Dossier-Updates und Anlassraeumen als wartungsarme, review-first Themenversorgung auf bestehenden Pfaden buendeln. Kein Auto-Publish, kein Wahrheitsautomat, keine zweite Themenwelt.

## Umsetzung

- Neues derived Readmodel in `features/themenradar/autonomousSupply.ts`
  - `sourceId`, `regionId`, `organizationId`, `topicClusterId`
  - Claims, Fragen, Optionen, Evidence-Hints
  - `urgencyScore`, `relevanceScore`, `regionalityScore`, `participationPotential`
  - `reviewState`, `reviewStateLabel`, `reviewHint`, `nextSuggestedAction`
  - Dublettenhinweis, Reaktivierung, Abklingen, Swipe-/Dossier-/Anlassraum-Kontext
- Neue Admin-API `apps/web/src/app/api/admin/themenradar/autonomous/route.ts`
  - liefert das Readmodel scoped und admin-geschuetzt
- Erweiterung von `/admin/themenradar`
  - neuer Operatorblock "Autonome Themenversorgung"
  - zeigt starke Themen, Dublettenvorschlaege, schwache Quellenlage, regionale Hotspots und naechste Aktion
  - keine Auto-Publish- oder Vollcrawler-Claims
- Kein Umbau der bestehenden Swipes-/Feed-/Dossier-/Anlassraum-Runtime
  - der Slice liest aus bestehenden Quellen
  - oeffentliche Sichtbarkeit bleibt in den vorhandenen review-first Pfaden

## Geaenderte Dateien

- `features/themenradar/autonomousSupply.ts`
- `features/themenradar/index.ts`
- `apps/web/src/app/api/admin/themenradar/autonomous/route.ts`
- `apps/web/src/app/admin/themenradar/page.tsx`
- `apps/web/tests/themenradar-autonomous-test-helpers.ts`
- `apps/web/tests/themenradar-readmodel.contract.test.ts`
- `apps/web/tests/themenradar-feed-cluster.contract.test.ts`
- `apps/web/tests/themenradar-swipes-supply.contract.test.ts`
- `apps/web/tests/themenradar-region-org-scope.contract.test.ts`
- `apps/web/tests/themenradar-no-autopublish.contract.test.ts`
- `apps/web/tests/themenradar-admin-page.render.test.tsx`
- `docs/E150/OpenTasks.md`

## Tests

- `pnpm -C apps/web exec vitest run tests/themenradar-readmodel.contract.test.ts tests/themenradar-feed-cluster.contract.test.ts tests/themenradar-swipes-supply.contract.test.ts tests/themenradar-region-org-scope.contract.test.ts tests/themenradar-no-autopublish.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm run release:validate:production`

## Ergebnis

- Themenradar clustert Feed-, Proposal-, Create-, Dossier-, Anlassraum- und Cluster-Signale in einem gemeinsamen, derived Review-Readmodel.
- Region- und Organisations-Scope bleiben getrennt.
- Dubletten werden nur vorgeschlagen, nicht automatisch zusammengefuehrt.
- Auch starke oder bereits sichtbare Signale bleiben `reviewRequired=true` und `autoPublishAllowed=false`.
- `V2-THEMENRADAR-BRAND-EXPORT-01` bleibt bewusst separater Folge-Slice fuer Brand-/Output-/Export-Verwertung.
