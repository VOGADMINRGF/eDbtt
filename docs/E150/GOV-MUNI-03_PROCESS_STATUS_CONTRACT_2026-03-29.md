# GOV-MUNI-03 Status-/Prozess-Contract (2026-03-29)

Ziel: Monitoring-first fuer den kommunalen Startkanon auf Status-/Prozessmapping
kontraktnah absichern, ohne Dashboard-Grossbaustelle und ohne institutionellen
Sonderkanal.

## 1) Scope dieses Slices

- Status-/Prozessrahmen fuer institutionelle Bearbeitung transparent machen.
- Mandat/Frist/Fortschritt als nachvollziehbare Kontextfelder abbilden.
- Prozess-Explainability und Auditpflicht fuer Statuswechsel verankern.
- Guardrails gegen Wahrheits-/Prioritaetsableitung aus Verwaltungsstatus sichern.

## 2) Repo-nahe Ist-Anker

- Anlassraum-Create-Route:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Dezernats-/Zustaendigkeits-Guardrails aus `GOV-MUNI-02`:
  - `features/anlassraum/municipalResponsibilityGuardrails.ts`

## 3) Kontrakt-Haertung aus GOV-MUNI-03

### Shared Municipal Process Status Contract

- Datei: `features/anlassraum/municipalProcessStatusContract.ts`
- Resolver: `resolveMunicipalProcessStatusContract(...)`
- Transition-Validator: `validateMunicipalProcessTransition(...)`

Der Contract liefert typed:
- `currentStatus` mit Monitoring-first Baseline:
  - `beobachtet`
  - `in_pruefung`
  - `in_bearbeitung`
  - `umgesetzt`
  - `abgeschlossen`
- erlaubte Statusuebergaenge je Ausgangsstatus
- Mandat-/Fortschrittsfelder:
  - `mandateRef`
  - `dueAt`
  - `progressPercent`
- Explainability-/Auditpflicht:
  - `statusReasonRequired`
  - `auditFieldsRequired` (`currentStatus`, `statusReason`, `changedBy`, `changedAt`)
- Guardrails:
  - keine Wahrheitsableitung aus Prozessstatus
  - kein Prioritaetsvorrang aus Institutionstatus
  - kein epistemischer Abschluss durch `abgeschlossen`
  - offene Fragen/Konflikte bleiben sichtbar
  - Monitoring-first bleibt verpflichtend

### Monitoring-first und institutioneller Rahmen

- Nicht-institutionelle Kontexte werden auf `beobachtet` normalisiert.
- Nicht-institutionelle Kontexte erhalten keine privilegierten Prozessuebergaenge.
- Statuswechsel ausserhalb triviale/no-op-Pfade brauchen Begruendung.

## 4) Route-nahe Einbindung

- `apps/web/src/app/api/admin/governance/anlassraum/route.ts` liefert zusaetzlich:
  - `meta.municipalProcessStatus`
- Der Meta-Contract wird aus dem institutionalContext der bereits bestehenden
  Dezernats-/Zustaendigkeits-Guardrails abgeleitet.
- Keine neue Routing-/Auth-/Dashboard-Logik; rein kontrakt-/explainability-seitig.

## 5) Testabdeckung

- `apps/web/tests/municipal-process-status-contract.test.ts`
  - institutioneller Contract (Status, Transitionen, Explainability)
  - nicht-institutionelle Normalisierung auf Monitoring-first Baseline
  - Transition-Validierung inkl. Reason-Pflicht
- `apps/web/tests/admin-governance-anlassraum.route.test.ts`
  - route-nahe Meta-Ausgabe von `municipalProcessStatus`
  - Baseline fuer nicht-institutionelle Kontexte
  - institutioneller Kontext mit erweiterten erlaubten Transitionen

## 6) Bewusst nicht Teil dieses Slices

- Kein Dashboard-Ausbau und keine neue Verwaltungs-UI.
- Kein hidden scoring oder politischer Prioritaetsautomatismus.
- Keine Uebersteuerung von Anlassraum-/Dossier-/Pruefpfad-/Mandatskern.
- Keine Vorwegnahme von `GOV-MUNI-05` oder `GOV-MUNI-06`.
