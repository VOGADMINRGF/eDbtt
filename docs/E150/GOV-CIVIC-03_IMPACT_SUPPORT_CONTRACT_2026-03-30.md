# GOV-CIVIC-03 - Civic Impact-/Unterstuetzungs-Contract (2026-03-30)

## Ziel des Slices

`GOV-CIVIC-03` macht Impact-/Unterstuetzungslogik im Civic-Block explizit:

- sichtbare Unterstuetzungsarten
- lifecycle-gebundene Sichtbarkeit
- explizite Guardrails gegen Macht-/Wahrheitsdrift

ohne Billing-/Pricing-/Funding-Rewrite.

## Nicht-Ziele

- kein Wahrheits-/Prioritaets-/Voting-/Faktenstatus-Privileg
- kein Reichweiten- oder Publisher-Bonus
- kein Ranking-/Trust-/Truth-System
- keine UI-Grossflaeche
- keine neue Route

## Umgesetzter Contract-Unterbau

### 1) Shared Impact-/Support-Contract

Datei:

- `features/anlassraum/civicCreatorImpactSupportContract.ts`

Explizite Support-Typen:

- `participation_support`
- `context_support`
- `format_support`
- `followup_support`
- `regional_visibility_support`
- `documentation_support`

Explizite Impact-Kontexte:

- `participation_visible`
- `context_followup_visible`
- `dossier_followup_visible`
- `companion_context_visible`
- `stream_context_visible`
- `regional_visibility_noted`
- `documentation_trace`

### 2) Lifecycle-Anbindung (`GOV-CIVIC-02`)

Support wird lifecycle-gebunden abgeleitet:

- frueh (`initiated`, `open_followup`): keine Format-/Follow-up-Aufwertung
- mittel (`accompanied`, `dossier_linked`): Follow-up + Dossier-nahe Unterstuetzung moeglich
- formatnah (`companion_active`, `stream_active`): Formatkontexte sichtbar, aber ohne Wahrheitsprivileg
- spaet (`closed_context`, `archived`): nur Dokumentationsspur

### 3) Capability-/Kontextgrenzen

- `format_support` nur mit Companion-/Stream-Capability
- `followup_support` nur mit Follow-up-Capability
- `regional_visibility_support` nur mit aktiver Regionsachse
- institutionelle Org-Kontexte: kein `stream_active`-Supportmodus

## Guardrails (verbindlich)

- Unterstuetzung ist Kontext-/Arbeitssichtbarkeit, kein Machtmittel
- Unterstuetzung ist nicht Wahrheit, nicht Prioritaet, nicht Abstimmungsgewicht
- Repraesentanz bleibt getrennt von Privilegien
- Companion/Stream bleibt Begleitformat
- Anlassraum bleibt offen, Dossier bleibt Oberraum

## Route-nahe Operationalisierung

`apps/web/src/app/api/admin/governance/anlassraum/route.ts` liefert zusaetzlich:

- `meta.civicCreatorImpactSupport`
- `meta.civicCreatorImpactSupportConsistency`

## Tests

- `apps/web/tests/civic-creator-impact-support-contract.test.ts`
- `apps/web/tests/admin-governance-anlassraum.route.test.ts` (Meta-Assertions erweitert)
- weiterhin aktiv:
  - `apps/web/tests/civic-creator-representation-contract.test.ts`
  - `apps/web/tests/civic-creator-lifecycle-contract.test.ts`

## Offene Folgearbeit

- Naechster sinnvoller Folgeblock ausserhalb CIVIC:
  - `GOV-ORG-02` (Release-/Trust-Modus)
