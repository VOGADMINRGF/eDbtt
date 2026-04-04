# GOV-CIVIC-02 - Civic / Creator Lifecycle- und Transition-Contract (2026-03-30)

## Ziel des Slices

`GOV-CIVIC-02` schliesst die offene Lifecycle-Luecke aus `GOV-CIVIC-01`:

- explizite Lifecycle-Zustaende
- explizite Transition-Regeln
- explizite Guardrails auf Uebergangsebene

ohne neue Rollenhierarchie, ohne neue Wahrheits-/Prioritaetslogik.

## Nicht-Ziele

- keine neue epistemische Sondermacht
- kein verstecktes Trust-/Truth-/Ranking-System
- keine UI-Grossarbeit
- keine Pricing-/Billing-/Funding-Engine
- keine neue Route

## Umgesetzter Contract-Unterbau

### 1) Shared Lifecycle-/Transition-Contract

Datei:

- `features/anlassraum/civicCreatorLifecycleContract.ts`

Kern:

- typed Statusliste:
  - `initiated`
  - `open_followup`
  - `accompanied`
  - `dossier_linked`
  - `companion_active`
  - `stream_active`
  - `paused`
  - `closed_context`
  - `archived`
- explizite Transition-Matrix pro Status
- capability-gefilterte Uebergaenge auf Basis des bestehenden
  `civicCreatorRepresentationContract`
- Transition-Evaluator:
  - `evaluateCivicCreatorLifecycleTransition`
- Lifecycle-Konsistenzpruefung:
  - `validateCivicCreatorLifecycleConsistency`

### 2) Route-nahe Meta-Anbindung

`apps/web/src/app/api/admin/governance/anlassraum/route.ts` liefert zusaetzlich:

- `meta.civicCreatorLifecycle`
- `meta.civicCreatorLifecycleConsistency`

### 3) Erlaubte vs. begrenzte Uebergaenge

Beispiele:

- `initiated -> open_followup/accompanied/paused/closed_context`
- `accompanied -> dossier_linked/companion_active/paused/closed_context`
- `dossier_linked -> companion_active/stream_active/paused/closed_context`
- `closed_context -> archived`

Capability-bedingte Grenzen:

- participation-only Profile erhalten keine
  `dossier_linked/companion_active/stream_active`-Uebergaenge
- institutionelle Org-Kontexte erhalten keinen `stream_active`-Uebergang
- `dossier_linked` nur mit Dossier-Companion-Curation-Capability
- `companion_active` nur mit Companion/Embed/QR-Capability
- `stream_active` nur mit Stream-Capability

## Lifecycle-Guardrails (verbindlich)

- Companion/Stream bleiben Begleitformat, kein Wahrheitskanal
- Dossier-Linkage erzeugt keine epistemische Sondermacht
- Repräsentanz erzeugt kein Prioritaetsprivileg
- Thema und Region bleiben getrennte Achsen
- kein Wechsel in versteckte Parallel-Domaenen

## Tests

- `apps/web/tests/civic-creator-lifecycle-contract.test.ts`
- `apps/web/tests/admin-governance-anlassraum.route.test.ts` (Lifecycle-Meta erweitert)
- bestehende Basis bleibt aktiv:
  - `apps/web/tests/civic-creator-representation-contract.test.ts`

## Offene Folgearbeit

- `GOV-CIVIC-03`: Impact-/Unterstuetzungslogik fuer Initiativen
  auf dem jetzt expliziten Lifecycle-Rahmen aufsetzen.
