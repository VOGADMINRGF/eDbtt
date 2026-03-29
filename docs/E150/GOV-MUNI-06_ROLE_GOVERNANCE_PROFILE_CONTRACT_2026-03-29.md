# GOV-MUNI-06 Rollen-/Rechte-/Governance-Profil-Contract (2026-03-29)

Ziel: Den kommunalen Strang aus `GOV-MUNI-02/03/05` zu einem konsistenten,
produktionsnahen Rollen-/Rechte-/Governance-Profil abrunden, ohne
Verwaltungs-Sondermacht und ohne Dashboard-Grossumbau.

## 1) Scope dieses Slices

- Typed Rollenprofile fuer institutionellen Kontext und Monitoring-first.
- Rollenbezogene Governance-Aktionen inkl. Reason-/Audit-Pflichten.
- Konsistenzpruefung ueber Responsibility-/Process-/Governance-Mode-/Role-Profil.
- Route-nahe Meta-Ausgabe ohne neue API-Landschaft.

## 2) Implementierungsanker

- Neuer Rollen-/Governance-Contract:
  - `features/anlassraum/municipalRoleGovernanceContract.ts`
- Bestehender Muni-Stack:
  - `features/anlassraum/municipalResponsibilityGuardrails.ts`
  - `features/anlassraum/municipalProcessStatusContract.ts`
  - `features/anlassraum/municipalGovernanceModeContract.ts`
- Route-nahe Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`

## 3) Rollenprofile (Monitoring-first)

- `public_monitoring`
- `institution_leadership`
- `department_owner`
- `office_operator`
- `institution_followup_team`

Die Zuordnung bleibt bewusst klein und orientiert sich am manifestierten Kanon:
- kein Rollenwildwuchs
- kein politischer Prioritaetsautomatismus
- keine epistemische Sondermacht

## 4) Rechte-/Governance-Aktionen

Typed und rollenbezogen:
- Monitoring-Meta einsehen
- Verantwortungs-Scope setzen
- Prozess-/Follow-up-/Release-Status setzen
- Public-Trace-Release anfordern/approven/rejecten
- Mandat/Fortschritt setzen
- Governance-Notiz erfassen

State-changing Aktionen bleiben reason-/audit-pflichtig.

## 5) Stack-Konsistenz

`validateMunicipalRoleGovernanceConsistency(...)` haertet u. a.:
- non-institutional => nur `public_monitoring`
- `monitoring_only` => kein institutionelles Profil
- `public_monitoring` => kein nicht-trivialer Prozessstatus
- `approved_for_public_trace` nur mit entsprechender Rollenberechtigung

## 6) Route-nahe Meta-Ausgabe

Erweitert in `/api/admin/governance/anlassraum`:
- `meta.municipalRoleGovernance`
- `meta.municipalRoleGovernanceConsistency`

Bestehende Meta-Contracts bleiben erhalten und werden nicht ersetzt:
- `municipalResponsibilityGuardrails`
- `municipalProcessStatus`
- `municipalGovernanceMode`

## 7) Tests

- `apps/web/tests/municipal-role-governance-contract.test.ts`
- `apps/web/tests/municipal-governance-stack-contract.test.ts`
- `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- flankierend weiter aktiv:
  - `apps/web/tests/municipal-responsibility-guardrails.test.ts`
  - `apps/web/tests/municipal-process-status-contract.test.ts`
  - `apps/web/tests/municipal-governance-mode-contract.test.ts`

## 8) Bewusst nicht Teil dieses Slices

- Kein Dashboard-/Workflow-Grossumbau.
- Keine neue Auth-/Berechtigungsarchitektur.
- Keine hidden scoring-/Wahrheits-/Prioritaetslogik.
- Keine Uebersteuerung von Anlassraum-/Dossier-/Pruefpfad-/Mandatskern.
