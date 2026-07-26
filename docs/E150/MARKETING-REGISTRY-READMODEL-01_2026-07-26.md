# MARKETING-REGISTRY-READMODEL-01

Status: `review`

Date: 2026-07-26

Branch: `feat/marketing-registry-readmodel-01`

Issue: `#438`

## Ziel

Die erste technische Ausbaustufe des Marketing Control Plane als reale, serverseitige und ausschließlich lesende Admin-Fläche unter `/admin/marketing` umsetzen.

Der Slice schafft eine typisierte und deterministische Registry, ohne neue Datenbank, Migration, CRM-, Analytics-, Publishing- oder Credential-Welt.

## Kanonische Grundlagen

- `docs/E150/MARKETING-CONTROL-PLANE-01_DECISIONS_2026-07-26.md`
- `docs/E150/MARKETING-CAMPAIGN-ANALYTICS-01_DECISIONS_2026-07-26.md`
- `docs/E150/MARKETING-REGIONAL-CIVIC-OPPORTUNITY-AGENT-01_DECISIONS_2026-07-26.md`
- `docs/marketing/admin/marketing-control-plane.md`
- `docs/marketing/schemas/marketing-control-plane.schema.json`
- `docs/marketing/campaigns/campaign-plan-2026.md`
- `docs/marketing/white-label/profiles/edebatte-light.brand-profile.json`
- `docs/marketing/white-label/profiles/edebatte-dark.brand-profile.json`
- `apps/web/src/lib/server/auth/admin.ts`
- `apps/web/src/app/admin/layout.tsx`

## Umgesetzte Artefakte

### 1. Typisierte Registry-Contracts

Neu:

- `apps/web/src/features/marketing/registry/contracts.ts`

Enthalten:

- `MarketingOpportunity`
- `MarketingCampaign`
- `MarketingAsset`
- `MarketingBrandProfile`
- `MarketingDistributionRecord`
- `MarketingRegistry`
- Zod-Validierung
- kanonische Marketability-, Lifecycle-, Readiness- und Freigabewerte
- `reviewRequired: true`
- `autoPublishEligible: false`

### 2. Deterministische repo-backed Registry

Neu:

- `apps/web/src/features/marketing/registry/data.ts`

Die Registry wird nicht aus beliebigen Markdown-Dateien im Browser interpretiert. Sie wird als versionierte TypeScript-Wahrheit aus den bestätigten Marketingquellen aufgebaut und beim Laden durch Zod validiert.

Enthalten:

- sechs initiale Marketing Opportunities,
- dreizehn MarketingCampaigns aus dem Kampagnenplan,
- sechs versionierte Arbeits-Assets,
- eDebatte Light und Dark als Brandprofile,
- leere DistributionRecords statt erfundener Veröffentlichungen,
- explizite Evidence- und Blocker-Referenzen.

### 3. Server-Readmodel

Neu:

- `apps/web/src/features/marketing/registry/readModel.ts`

Das Readmodel erzeugt:

- Opportunities nach Marketingfähigkeit,
- Campaigns nach Lifecycle,
- Assets nach Freigabestatus,
- Brands nach Status,
- Blocker nach Schlüssel,
- aktuelle Evidence,
- Zahl freigegebener, aber nicht verteilt belegter Assets,
- expliziten `read_only`-Modus.

### 4. Geschützte Admin-API

Neu:

- `apps/web/src/app/api/admin/marketing/route.ts`

Eigenschaften:

- ausschließlich `GET`,
- bestehender `requireAdminOrResponse`-Gate,
- valide Session,
- Admin-/Superadmin-Zugriff,
- 2FA fail-closed,
- keine POST-, PUT-, PATCH- oder DELETE-Handler,
- keine DB- oder Providerzugriffe.

### 5. Reale Admin-Fläche

Neu:

- `apps/web/src/app/admin/marketing/page.tsx`

Bereiche:

- Übersicht,
- Opportunities,
- Marketingkampagnen,
- Assets,
- Brandprofile,
- aktuelle Evidence,
- Registry-Quellen.

Die Oberfläche:

- verwendet die bestehende Admin-Designsprache,
- funktioniert als responsive Karten-/Tabellenansicht,
- kommuniziert Status nicht nur über Farbe,
- enthält Tastaturfokus und semantische Überschriften,
- bietet deutsche und englische UI-Copy,
- verlinkt zurück zu `/admin`, `/admin/themenradar` und `/admin/campaigns`,
- kennzeichnet die Trennung von MarketingCampaign und Beteiligungs-Campaign,
- enthält keine Mutation oder Publish-Aktion.

### 6. Admin-Navigation

Geändert:

- `apps/web/src/app/admin/adminNav.ts`

Neu:

- `Marketing Registry` unter `Content & Reports`.

## Wahrheits- und Sicherheitsgrenzen

- Kein Merge wird automatisch als vermarktbar eingestuft.
- Fehlende Route, CTA oder Produktbelege verhindern `publicly_marketable`.
- Erstellte oder review-fertige Assets werden nicht als veröffentlicht dargestellt.
- Eine reale Ausspielung benötigt später einen belegten `DistributionRecord`.
- `Campaign` unter `/admin/campaigns` und `MarketingCampaign` bleiben getrennt.
- Kein Auto-Publish.
- Keine Social-Credentials.
- Kein CRM-light.
- Keine personenbezogene Telemetrie.
- Keine neue Persistenzwelt.
- Keine White-Label-Exports.

## Tests

Neu:

- `apps/web/tests/marketing-registry.contract.test.ts`
- `apps/web/tests/admin-marketing.route.test.ts`
- `apps/web/tests/admin-marketing.page.test.tsx`

Abgedeckt:

- Registry-Shape und Zod-Parsing,
- Marketability-Vokabular,
- Trennung MarketingCampaign / Campaign,
- keine Hochstufung bei fehlendem Proof, Route oder CTA,
- keine erfundene Distribution,
- 401 ohne Session,
- 403 ohne Adminrolle,
- 403 bei fehlender 2FA,
- erfolgreicher Admin-Read,
- keine Mutation-Handler,
- deutsche und englische UI,
- Read-only-Kennzeichnung,
- Admin-Navigation.

## Erwartete Validierung

- `git diff --check`
- fokussierte Vitest-Suite
- Lint
- Typecheck
- Production Guardrails
- Web Critical Guardrails
- Build

## OpenTasks-Folge

Nach erfolgreichem Merge:

1. `MARKETING-REGISTRY-READMODEL-01` → `done`
2. `MARKETING-REGIONAL-AGENT-RUN-READMODEL-01` → `codex_ready`
3. `MARKETING-CAMPAIGN-ANALYTICS-01` → `codex_ready`
4. `MARKETING-REGIONAL-SOURCE-DISCOVERY-02` bleibt `manual_gate / needs_decision`
5. `MARKETING-PUBLISH-APPROVAL-06` bleibt `manual_gate / needs_decision`
6. Lifecycle, Campaign Studio, Recommendations, Distribution, Monitoring, CRM-light und White-Label-Export bleiben abhängig blockiert.

## Ergebnis

Der erste technische Marketing-Control-Plane-Slice ist umgesetzt. `/admin/marketing` ist eine reale, typisierte, nachvollziehbare und 2FA-geschützte Read-only-Fläche. Sie schafft die gemeinsame Grundlage für regionale Agent Runs und Campaign Analytics, ohne deren spätere Runtime-, Provider-, Analytics- oder Publishing-Entscheidungen vorwegzunehmen.
