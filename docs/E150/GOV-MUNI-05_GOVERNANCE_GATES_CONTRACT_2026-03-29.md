# GOV-MUNI-05 Verwaltungsmodus-/Governance-Gates-Contract (2026-03-29)

Ziel: Monitoring-first und institutionelle Nachverfolgung produktionsnah verbinden,
ohne Verwaltungs-Autopilot, ohne hidden scoring und ohne epistemische Sondermacht.

## 1) Scope dieses Slices

- Typed Verwaltungsmodus-/Governance-Gate-Contract fuer Anlassraum-Kontext.
- Reason-/Audit-pflichtige Transitionen fuer Follow-up/Freigabe sauber markieren.
- Route-nahe Meta-Ausgabe fuer Governance-Anschluss bereitstellen.

## 2) Implementierungsanker

- Contract:
  - `features/anlassraum/municipalGovernanceModeContract.ts`
- Route-nahe Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Tests:
  - `apps/web/tests/municipal-governance-mode-contract.test.ts`
  - `apps/web/tests/admin-governance-anlassraum.route.test.ts`

## 3) Contract-Kern

Der Contract `resolveMunicipalGovernanceModeContract(...)` liefert:
- `governanceMode`:
  - `monitoring_only`
  - `institutional_followup`
- Prozess-/Follow-up-/Release-Zustand:
  - `processStatus`
  - `followUpStatus`
  - `releaseStatus`
- Mandat-/Frist-/Fortschrittskontext:
  - `mandateRef`
  - `dueAt`
  - `progressPercent`
- sichtbare Governance-Gates:
  - `monitoring_first`
  - `status_reason_required`
  - `follow_up_reason_required`
  - `release_reason_required`
  - `mandate_progress_trace_required`
  - `public_followup_trace_required`
  - `no_truth_or_priority_inference`
- Explainability-/Audit-Pflichten:
  - `transitionReasonRequired`
  - `auditFieldsRequired`

Der Validator `validateMunicipalGovernanceModeTransition(...)` haertet:
- keine privilegierten Transitionen in nicht-institutionellen Kontexten
- keine unerklaerten Statuswechsel
- keine direkte Freigabe von `rejected` nach `approved_for_public_trace`

## 4) Guardrails

- Kein Wahrheitsvorrang aus Verwaltungsstatus.
- Kein Prioritaetsvorrang aus Institutionskontext.
- Keine Uebersteuerung von Anlassraum-/Dossier-/Review-/Mandatskern.
- Governance-Gates nur als Bearbeitungs-/Freigabe-/Nachverfolgungslogik.

## 5) Bewusst nicht Teil dieses Slices

- Kein Dashboard-Grossumbau.
- Keine neue politische Priorisierungsmaschine.
- Keine neue Routing-/Auth-/API-Landschaft.
- Keine Vorwegnahme von `GOV-MUNI-06`.
