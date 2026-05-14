# Evidence: GOV-ACTOR-REGISTER-01 / GOV-COMMUNITY-SIGNAL-01 / GOV-ADMIN-REGION-01 (2026-05-10)

## Ziel des Slices

Die naechsten drei `codex_ready` Regional-Tasks wurden als zusammenhaengender docs-/contract-first Slice abgeschlossen:

- `GOV-ACTOR-REGISTER-01`
- `GOV-COMMUNITY-SIGNAL-01`
- `GOV-ADMIN-REGION-01`

Der Slice erweitert die bestehende `features/region`-Foundation, ohne neue Runtime-Surfaces, Auto-Ingestion oder Routing-Entscheidungen einzufuehren.

## Scope

Bearbeitet:

- `features/region/contracts.ts`
- `features/region/fixtures.ts`
- `features/region/index.ts` (indirekt via Exporte aus `contracts.ts` und `fixtures.ts`)
- `apps/web/tests/regional-actor-register.contract.test.ts`
- `apps/web/tests/community-signal-inbox.contract.test.ts`
- `apps/web/tests/regional-admin-cockpit.contract.test.ts`
- `docs/E150/OpenTasks.md`

Nicht im Scope:

- keine neue UI-Route
- kein neues Admin-Cockpit-Rendering
- keine Ingestion-/Scraping-Engine
- keine automatische Dossier-, Runden- oder Mandatserzeugung
- kein Auto-Publish
- keine neue Membership- oder Rollenlogik

## Umsetzung

### 1. Regionales Akteursregister

- neue Actor-Typen als kanonischer Mindestkatalog:
  - `verein`
  - `initiative`
  - `lose_gruppe`
  - `bewegung`
  - `sozialtraeger`
  - `schule`
  - `gewerbe`
  - `verwaltung`
  - `sonstige`
- statusbasierte Verifizierung ueber `unverified | review_required | verified`
- explizite Guardrails:
  - keine automatische politische Zuordnung
  - keine automatische VoiceOpenGov-Mitgliedschaft
  - Verifizierung bleibt sichtbarer Status statt stiller Inferenz
- Fixtures fuer Reinickendorf, Tegel-Sued und Beispielstadt angelegt

### 2. Niedrigschwellige Signal-Inbox

- neues Signalmodell fuer:
  - `hint`
  - `source`
  - `local_knowledge`
  - `topic_proposal`
- Submitter-Modi erlauben niedrige Einstiegshuerden:
  - `anonymous`
  - `lightweight_contact`
  - `registered_reference`
- Review-/Moderationsstatus bleibt explizit:
  - `submitted`
  - `in_review`
  - `accepted`
  - `rejected`
- Guardrails erzwingen:
  - `moderationRequired=true`
  - `noAutoPublish=true`
  - `noAutoMandate=true`
  - `noAutomaticDossierCreation=true`

### 3. Regionales Verwaltungscockpit

- neues Contract-Modell fuer ein beteiligungsorientiertes Lagebild mit Pflichtmodulen:
  - `themenlage`
  - `akteurskarte`
  - `beteiligungsstatus`
  - `offene_fragen`
  - `teilhabegaps`
  - `naechste_rueckmeldungen`
  - `mandatsstatus`
- Guardrails blocken Scoring-/Ueberwachungsdrift:
  - `noCitizenScoring=true`
  - `noAssociationScoring=true`
  - `noAutomatedEnforcement=true`
- Reinickendorf-Fixture als Referenz fuer ein nicht-ueberwachendes Verwaltungsbild angelegt

## Verifikation

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/region-contract.test.ts tests/regional-anlassraum-contract.test.ts tests/regional-actor-register.contract.test.ts tests/community-signal-inbox.contract.test.ts tests/regional-admin-cockpit.contract.test.ts
```

Ergebnis:

- 5 Testdateien gruen
- 21 Tests gruen

## Ergebnis

Die Regional-Familie ist jetzt ueber `Region` + `RegionalAnlassraum` hinaus auch fuer:

- regionale Akteure
- niedrigschwellige Signale
- regionale Verwaltungs-Lagebilder

als typed Contract-Foundation im Repo verankert.

Die Guardrails bleiben konsistent mit dem bisherigen Kanon:

- kein Auto-Publish
- kein Auto-Mandat
- keine automatische politische Zuordnung
- keine automatische Membership-Uebernahme
- keine Scoringlogik gegen Buerger:innen oder Vereine

Die naechsten verbleibenden Anschluss-Slices bleiben:

- `GOV-GUIDELINES-BERLIN-01`
- `GOV-B2G-REGIONAL-ROOM-01`
- spaeter `GOV-B2B-01`, `GOV-CIVIC-ECON-01`, `PR-EDITORIAL-SERIES-01`, `PR-BETEILIGUNGSRADAR-00`
