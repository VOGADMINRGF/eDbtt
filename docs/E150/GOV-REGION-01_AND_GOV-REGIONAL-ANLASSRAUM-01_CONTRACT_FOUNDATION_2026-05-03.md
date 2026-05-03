# Evidence: GOV-REGION-01 + GOV-REGIONAL-ANLASSRAUM-01 Contract Foundation (2026-05-03)

## Ziel des Slices

GOV-REGION-01 und GOV-REGIONAL-ANLASSRAUM-01 als Contract-/Domain-Foundation umsetzen,
ohne Verwaltungs-Cockpit-Ausbau, ohne Ingestion/Scraping und ohne harte `/anlassraum`-Migration.

## Scope

Bearbeitet:
- `features/region/contracts.ts`
- `features/region/fixtures.ts`
- `features/region/index.ts`
- `apps/web/tests/region-contract.test.ts`
- `apps/web/tests/regional-anlassraum-contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/GOV-REGION-01_AND_GOV-REGIONAL-ANLASSRAUM-01_CONTRACT_FOUNDATION_2026-05-03.md`

Nicht im Scope:
- kein neues Runtime-Routing
- keine harte Route-Migration auf `/anlassraum`
- keine automatische Ingestion
- kein Scraping
- kein Auto-Publish
- kein Auto-Mandat
- keine automatische politische Zuordnung
- keine automatische VoiceOpenGov-Mitgliedschaft

## Umsetzung

### 1) Shared Region Contract

`features/region/contracts.ts` definiert strikt typisiert:
- `RegionSchema`
- `REGION_TYPES`: `bezirk`, `kommune`, `landkreis`, `quartier`, `region`
- `parentRegionId` optional/nullfaehig
- `officialBody` optional/nullfaehig
- `federalState` optional/nullfaehig
- `country`
- `publicVisibility`

Zusatz-Guardrail:
- `supportsRegionTenantIsolationRequirement() === false`

Damit wird explizit keine Tenant-Isolation erzwungen, sondern region-scoped Produktlogik vorbereitet.

### 2) Shared RegionalAnlassraum Contract

`features/region/contracts.ts` definiert strikt typisiert:
- `RegionalAnlassraumSchema`
- `status`: `draft | active | archived`
- `scope` mit Pflichtabdeckung aller Scope-Schluessel:
  - `signals`, `topics`, `actors`, `dossiers`, `rounds`, `mandates`, `activities`
- `guardrails`:
  - `noAutoPublish: true`
  - `noAutoMandate: true`
  - `noAutomaticPoliticalAssignment: true`
  - `noScrapingByDefault: true`
- `ownershipModel: "reference_only"`
- `links` als reine Referenzlisten (`dossierIds`, `roundIds`, `mandateIds`)
- `publicReadModel` fuer spaetere UI-Anbindung

Explizite No-Auto-Funktionen:
- `supportsRegionalAnlassraumAutoPublish() === false`
- `supportsRegionalAnlassraumAutoMandate() === false`
- `supportsRegionalAnlassraumAutomaticPoliticalAssignment() === false`
- `supportsRegionalAnlassraumScrapingByDefault() === false`
- `supportsRegionalAnlassraumAutomaticDossierCreation() === false`
- `supportsRegionalAnlassraumAutomaticRoundCreation() === false`
- `supportsRegionalAnlassraumAutomaticVoiceOpenGovMembership() === false`

### 3) Fixtures

`features/region/fixtures.ts` enthaelt mindestens die geforderten Regionen:
- Berlin Reinickendorf (`bezirk`)
- generische Kommune (`kommune`)
- Quartier/Kiez (`quartier`)

Zusaetzlich:
- Berlin als Elternregion (`region`) fuer saubere Parent-Relationen.

RegionalAnlassraum-Fixtures:
- Reinickendorf (aktiv, guideline `berlin_participation_guidelines`)
- Beispielstadt (draft)
- Tegel-Sued (aktiv)

Alle RegionalAnlassraum-Fixtures nutzen:
- `reference_only` statt Besitzlogik
- Referenz-Links auf Dossiers/Runden/Mandate
- volle Scope-Abdeckung

## Produktentscheidungen (umgesetzt)

- eDebatte bleibt Arbeitsflaeche entlang:
  `Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status`
- Regionaler Anlassraum ist dauerhafte Betriebsebene je Region/Bezirk/Kommune.
- VoiceOpenGov bleibt Initiative/Register/Vertrauenslayer.
- Bestehende `/runden`, `/dossier`, `/create` Flows bleiben anschlussfaehig.
- Keine harte `/anlassraum`-Migration in diesem Slice.

## Tests

Neue Tests:
- `apps/web/tests/region-contract.test.ts`
- `apps/web/tests/regional-anlassraum-contract.test.ts`

Abgedeckt:
- Region-Typen und Normalisierung
- Reinickendorf-Fixture inkl. Parent/Body
- RegionalAnlassraum-Guardrails
- keine Auto-Mandats-/Auto-Publish-Annahme
- Referenzfaehigkeit zu bestehenden Dossier-/Runden-/Mandats-IDs
- Rejection bei Scope-Luecken und doppelten Referenzen

## OpenTasks-Update

- `GOV-REGION-01` -> `done`
- `GOV-REGIONAL-ANLASSRAUM-01` -> `done`
- `GOV-ACTOR-REGISTER-01` bleibt `codex_ready` als naechster sinnvoller Anschluss-Slice

## Ergebnis

Die Foundation fuer Region + RegionalAnlassraum ist kontraktfaehig umgesetzt.
Keine Runtime-/Routing-/Ingestion-Erweiterung wurde eingefuehrt.
