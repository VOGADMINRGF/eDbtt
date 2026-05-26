# PUBLIC-TOPIC-SUPPLY-LAYER-01

Stand: 2026-05-26

## Ziel

Nach `production_ready-v1` die Themenversorgung fuer `/swipes`, Anlassraeume und Dossiers auf bestehenden Pfaden klarer machen:

- genug echte oeffentliche Themen fuer breite Beteiligung
- region- und organisationsgebundene Themen nur im passenden Scope
- klare Herkunft jedes Themas
- keine Seed-/Demo-Scheinlogik in geschuetzten Kontexten
- keine neue Produktparallelwelt

## Umgesetzter Pfad

Neuer Readmodel-Layer:

- `statement_proposals`
- Feed-/VoteDrafts
- `dossier_suggestions`
- Anlassraum-Signale
- persistierte Create-Handoffs

Der Layer wird in `apps/web/src/features/swipes/publicTopicSupply.ts` gebuendelt und auf bestehenden Pfaden weiterverwendet:

- `/swipes` fuer sichtbare Themenversorgung
- `/api/swipes/feed` fuer Scope-Injektion aus bestehendem Request-Scope
- `/admin/feeds` fuer Operator-Sicht auf Topic-Supply, Bucket-Zustand, Quellen und naechste Aktion

## Produktverhalten

### Nutzer sichtbar

- Swipe-Themen zeigen jetzt sichtbar, warum sie erscheinen:
  - `Allgemein sichtbares Thema`
  - `Aus dem Feed-Radar`
  - `Aus dem Dossier-Kontext`
  - `Aus dem Anlassraum`
  - `Aus deinem Beitrag`
  - region-/org-spezifische Lesart im passenden Scope
- Swipe-Detail und Swipe-Karte erklaeren die Herkunft mit `Warum wird dir das angezeigt?`
- Kontextlinks fuehren auf bestehende Routen:
  - Dossier
  - Anlassraum
  - Create-Ergaenzung / Resume
- Review-first bleibt sichtbar:
  - kein Auto-Publish
  - keine automatische Wahrheit
  - keine Demo-Seeds in geschuetzten Pfaden

### Scope / Guardrails

- Region-/Org-Supply wird nur im passenden Scope sichtbar.
- Seed-Fallback ist jetzt auch in Org-Kontexten blockiert.
- Bereits bestehende Guardrails fuer
  - `fromDraft`
  - `regionId`
  - Admin-Kontext
  - Review-Kontext
  bleiben erhalten.

## Admin / Operator

`/admin/feeds` zeigt jetzt zusaetzlich:

- sichtbare Topic-Supply-Gesamtzahl
- Reviewbedarf
- Bucket-Zustaende
- Quellen, die Themen liefern
- naechste sinnvolle Aktion

Das bleibt ein Readmodel auf vorhandener Feed-/Review-Runtime, keine zweite Queue.

## Geaenderte Dateien

- `apps/web/src/features/swipes/types.ts`
- `apps/web/src/features/runtimeDataGuardrails.ts`
- `apps/web/src/features/swipes/publicTopicSupply.ts`
- `apps/web/src/features/swipes/service.ts`
- `apps/web/src/app/api/swipes/feed/route.ts`
- `apps/web/src/features/surfaces/swipes/components/SwipeTopicStep.tsx`
- `apps/web/src/features/surfaces/swipes/components/SwipeDetailSheet.tsx`
- `features/feeds/runtimeReadModel.ts`
- `apps/web/src/app/admin/feeds/page.tsx`
- `apps/web/tests/public-topic-supply-readmodel.contract.test.ts`
- `apps/web/tests/swipes-public-topic-supply.contract.test.tsx`
- `apps/web/tests/swipes-regional-org-supply.contract.test.tsx`
- `apps/web/tests/feed-to-swipes-topic-supply.contract.test.ts`
- `apps/web/tests/public-topic-supply-no-fake-seed.contract.test.ts`
- `apps/web/tests/swipes-feed.arrival.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Gelaufene Commands

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/public-topic-supply-readmodel.contract.test.ts tests/swipes-public-topic-supply.contract.test.tsx tests/swipes-regional-org-supply.contract.test.tsx tests/feed-to-swipes-topic-supply.contract.test.ts tests/public-topic-supply-no-fake-seed.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/swipes-feed.arrival.test.ts tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm run release:validate:production`

## Ergebnis

Der oeffentliche Swipe-Pfad nimmt jetzt echte Themen aus Feed, Dossier, Anlassraum und Create-Handoffs auf, ohne Seed-Schein in geschuetzten Kontexten. Region- und Organisationskontext wird ueber den bestehenden Request-Scope injiziert und nicht ueber neues Tracking oder neue Produktwelten erfunden. Feed-/Claim-/Themenautomatik bleibt vorschlagsbasiert und review-first; es gibt weiterhin keine automatische Wahrheit, keine automatische Veroeffentlichung und kein automatisches Amtlichkeitslabel.
