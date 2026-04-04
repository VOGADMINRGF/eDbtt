# GOV-CIVIC-01 - Civic / Creator / Stream / Dossier / Repraesentanz Contract (2026-03-29)

## Ziel des Slices

Der Slice zieht einen gemeinsamen, typed Rahmen fuer:

- civic / creator / publisher / org Arbeitsprofile
- Anlassraum-Hosting vs. Dossier-nahe Begleitung
- Companion / Embed / QR / Stream-Kontextnutzung
- Repraesentanzachsen **Thema** und **Region**

ohne neue Wahrheits- oder Macht-Hierarchie.

## Nicht-Ziele (verbindlich)

- keine epistemische Sondermacht fuer Creator/Publisher/Stream
- kein implizites Ranking-/Trust-/Truth-System
- kein Relevanz-/Voting-/Faktenstatus-Privileg aus Rolle, Reichweite oder Kanal
- kein Parallelkanon neben Anlassraum/Dossier
- kein UI-Grossumbau und keine neue Route

## Umgesetzter Contract-Unterbau

### 1) Shared Role-/Visibility-/Representation Contract

Datei:

- `features/anlassraum/civicCreatorRepresentationContract.ts`

Kern:

- Work-Profile (nicht-hierarchisch, arbeitsbezogen):
  - `civic_participant`
  - `anlassraum_host`
  - `creator_format_host`
  - `editorial_dossier_host`
  - `publisher_team_context`
  - `org_context_actor`
- Work-Levels:
  - `participation_only`
  - `anlassraum_hosting`
  - `format_companion`
  - `dossier_companion`
  - `organization_followup`
- Repraesentanzachsen getrennt:
  - `representationAxes.topic`
  - `representationAxes.region`
  - verpflichtend `separatedAxes = true`
  - verpflichtend `forbidsCrossAxisShortcut = true`

### 2) Guardrails (explizit erzwungen)

Der Contract erzwingt:

- `forbidsTruthPrivilege = true`
- `forbidsPriorityPrivilege = true`
- `forbidsVotingPrivilege = true`
- `forbidsFactStatusPrivilege = true`
- `forbidsReachPrivilege = true`
- `forbidsParallelDomain = true`
- `keepsAnlassraumInitiable = true`
- `keepsDossierAsUpperContext = true`
- `keepsCompanionBoundToOpenDossierCore = true`

### 3) Explainability / Audit-Pflichten

Verbindlich:

- `reasonRequired = true`
- Audit-Felder fuer Profil/Level/Repraesentanz und Mutation:
  - `workProfile`
  - `workLevel`
  - `topicRepresentation`
  - `regionRepresentation`
  - `changedBy`
  - `changedAt`
  - `source`

### 4) Route-nahe Governance-Meta-Anbindung

`apps/web/src/app/api/admin/governance/anlassraum/route.ts` gibt zusaetzlich aus:

- `meta.civicCreatorRepresentation`
- `meta.civicCreatorRepresentationConsistency`

Die Konsistenzpruefung koppelt den neuen Contract an:

- Journalism Role Profile (`meta.journalismRoleProfile`)
- Org Context Profile (`meta.orgContextAttachment`)
- Municipal Institutional Context (`meta.municipalResponsibilityGuardrails`)

## Anlassraum vs. Dossier vs. Companion/Stream

Der Slice trennt:

- Anlassraum fuehren/hosten (Basis- und Host-Profile)
- Dossier-nahe Kuratierung/Formatbegleitung (editorial/publisher Profile)
- Companion/Embed/QR/Stream als **Begleitformatlogik**, nicht als Wahrheitskanal

Damit bleibt:

- Anlassraum initiierbar und offen
- Dossier oberer Erkenntnis-/Zusammenhangsraum
- Companion/Stream an offenen Dossier-/Pruef-/Fragenkern gebunden

## Thema vs. Region (Repraesentanz)

Der Contract trennt ausdruecklich:

- Themenrepraesentanz (`topic`)
- Regionsrepraesentanz (`region`)

und schliesst aus:

- Thema = Region
- Repraesentanz = Wahrheit
- Repraesentanz = Abstimmungsgewicht
- Repraesentanz = Prioritaetsautomatik

## Tests

- `apps/web/tests/civic-creator-representation-contract.test.ts`
- `apps/web/tests/admin-governance-anlassraum.route.test.ts` (Meta-Assertions erweitert)

## Offene Folgearbeit (bewusst nicht in diesem Slice)

- `GOV-CIVIC-02` Initiative-Lifecycle
- `GOV-CIVIC-03` Impact-/Unterstuetzungslogik
- `GOV-ORG-02` offizieller Release-/Trust-Modus

Diese Folgearbeit baut auf dem hier eingefrorenen Role-/Visibility-/Representation-Contract auf.
