# MARKETING-SOURCE-DECISION-WORKSPACE-01

Stand: 2026-07-28  
Status: implementation / review pending

## Anlass

Die Source-Allowlist und Providerentscheidung waren fachlich dokumentiert, aber für Betreiber nur über GitHub, OpenTasks und E150-Dateien auffindbar. Die Nutzerkorrektur verlangt eine sichtbare, verständliche Marketing-Fläche ohne simulierte Live-Feeds oder Providerverbindungen.

## Umsetzung

Neue Route:

```text
/admin/marketing/sources
```

UI-Bezeichnung:

> Quellen & Themen

Die Route ist dauerhaft im lokalen Marketing-Workspace sichtbar und zeigt ausschließlich belegte Vertragswahrheit:

- `liveIngestionEnabled = false`,
- 29 definierte Coverage-Bereiche,
- bis zu 20 Kandidaten je Einzelbereich,
- 560 Rohkandidaten im vollständigen Zielbild,
- höchstens Top 20 je Operatorbereich,
- Phase 1: amtliche und öffentliche maschinenlesbare Quellen,
- Phase 2: GDELT Cloud nur als noch nicht freigegebener Kandidat,
- neun Nachbarländer Deutschlands,
- 16 Bundesländer.

## Entscheidungsdarstellung

Die Seite trennt verständlich:

- `Entschieden`: Phase-1-Quellenpolitik,
- `Offen`: konkrete Source-Allowlist, Lizenz/Speicherung/Retention, Abruf/Freshness/Fehlerbetrieb,
- `Freigabe erforderlich`: breiter Medienprovider und Live-Ingestion.

## Reale Arbeitswege

- regionale Quellenarbeit verweist auf die bestehende Regionenübersicht `/admin/regions`,
- keine zweite regionale Source-Persistenz,
- `/admin/marketing/connections` wird nicht verlinkt, solange API-/CSV-/Secret-Verbindungen nicht real nutzbar sind,
- `/admin/marketing/topics` wird nicht verlinkt, solange kein validiertes Live-Readmodel existiert.

PR #513 bleibt ein getrennter regionaler Operator-Slice. Nach seiner Produktabnahme kann der Marketing-Arbeitsweg auf den dortigen regionalen Quellenbereich präzisiert werden, ohne die Source-Wahrheit zu duplizieren.

## Geänderte Produktflächen

- `apps/web/src/app/admin/marketing/sources/page.tsx`
- `apps/web/src/features/marketing/sources/readModel.ts`
- `apps/web/src/features/marketing/workspace/MarketingWorkspaceNav.tsx`
- `apps/web/src/app/admin/marketing/layout.tsx`

## Tests

- Readmodel gegen `docs/marketing/source-profiles/topic-radar-coverage.json`,
- deutsche und englische Page-Darstellung,
- sichtbare Navigation,
- keine Links auf gesperrte Connections- oder Live-Themenrouten,
- keine behaupteten Synchronisationen, Demo-Themen oder Providerdaten,
- reguläre Marketing- und Production-Guardrails, Lint, Typecheck und Build.

## Harte Grenzen

Nicht umgesetzt:

- Live-Ingestion,
- RSS-/API-Abruf,
- Source-Allowlist-Mutation,
- Provider-Secrets,
- CSV-Import,
- Scraping oder Paywall-Zugriff,
- automatische Kampagnen-, Dossier- oder Beitragserstellung,
- Publishing oder Auto-Publish.

## Folgegrenzen

- `MARKETING-REGIONAL-SOURCE-DISCOVERY-02` bleibt `manual_gate`.
- `MARKETING-CONNECTIONS-CONTROL-PLANE-03` bleibt `manual_gate`.
- Erst nach konkreter Source-Allowlist, Lizenz-/Retention- und Betriebsfreigabe darf eine reale Themenradar-Route entstehen.
