# PERSISTENCE-INVENTORY-HARDENING-01

Stand: 2026-05-20

## Ziel

Nach `PUBLIC-ROUTES-HARDENING-01` sollte für die neue Review-to-Publish-Kette produktionsreif geklärt sein:

- welche Arbeitsstände dauerhaft gespeichert werden
- welche Surfaces nur derived Readmodels sind
- wo noch In-Memory-/Runtime-Overlay beteiligt ist
- welches Restart-/Deployment-Risiko daraus folgt

Betroffene Kette:

- Create Handoffs
- Review Queue Items und Operations
- Source Connections
- Source Dry Runs / Source Results
- Snapshot Templates
- Content Release Workbench
- Publish Preview / Visibility / Revoke / Archive
- Topic Pages
- Audit-/Activity-Events

## Umsetzung

### 1. Typed Persistenzinventur

Neues Modul:

- `features/persistenceInventory.ts`

Enthält:

- `PersistenceSurface`
- `PersistenceMode`
- `PersistenceRisk`
- `PersistenceHardeningAction`
- `PersistenceSurfaceEntry`
- `PersistenceInventoryReadModel`
- `buildPersistenceInventory()`

Die Inventur markiert jede Surface explizit als:

- `persistent`
- `runtime`
- `fixture`
- `in_memory`
- `derived`

Zusätzlich pro Surface:

- production-candidate-Zielmodus
- Restart-Risiko
- Deployment-Risiko
- aktuelle Wahrheitsquelle
- empfohlene nächste Härtung

### 2. Stabile Repository-Grenzen benannt

Bestehende Repo-Grenzen wurden als stabile Interface-Namen explizit exportiert:

- `CreateHandoffRepository`
- `ReviewQueueOperationsRepository`
- `SourceConnectionRepository`
- `ContentReleaseRepository`
- `PublicTopicPageRepository`
- `AuditEventRepository`

Wichtig:

- Es wurde **keine neue Persistenzarchitektur** eingeführt.
- Es gibt **keine große DB-Migration**.
- Die Interfaces benennen und stabilisieren nur bereits vorhandene Grenzstellen.

### 3. Ergebnis der Inventur

#### Persistent-primary

- Create Handoffs
- Review Queue Operations
- Source Connections
- Source Results / Dry Runs
- Content Release Workbench
- zugrunde liegende Audit-Collections

Diese Surfaces sind dauerhaft, solange keine In-Memory-Fallback-Runtime aktiv ist.

#### Derived

- Review Queue Items
- Snapshot Templates
- Publish Preview / Visibility Readmodel
- Public Topic Pages

Diese Surfaces sind bewusst **keine eigene Primärpersistenz**.

#### Fixture-/Seed-Beteiligung

- Snapshot Templates
- Source Results

Example-Seeds und kuratierte Snapshots bleiben explizit Hilfsmittel oder Inputmaterial, nicht eigenständige Produktionswahrheit.

#### In-Memory-/Runtime-Risiko

Wenn `shouldUseInMemoryMongoFallback()` aktiv ist:

- Create Handoffs
- Review Queue Operations
- Source Connections / Source Results
- Content Release / Visibility
- Audit-Historie

nur pro Prozess leben und bei Restart/Deployment verloren gehen können.

## Guardrails

- keine neue Produktparallelwelt
- keine große DB-Migration
- kein Auto-Publish
- kein automatisches `public_official`
- kein Payment
- kein Social Publishing
- keine neue AI-/Source-Adapter-Logik
- In-Memory-/Fixture-/Derived-Surfaces werden nicht als dauerhafte Produktionswahrheit ausgegeben

## Tests / Validierung

- `pnpm -C apps/web exec vitest run tests/persistence-inventory.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

## Fazit

Die Review-to-Publish-Kette ist jetzt nicht nur fachlich, sondern auch persistenzseitig ehrlicher beschrieben:

- dauerhaft gespeicherte Wahrheiten sind benannt
- derived Surfaces sind explizit als derived markiert
- In-Memory-/Fixture-Boundaries sind sichtbar
- Restart-/Deployment-Risiken sind dokumentiert
- die nächste Härtung kann gezielt an den persistent-primary Stores ansetzen, ohne neue Architektur zu erfinden
