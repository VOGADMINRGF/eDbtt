# GOV-MUNI-02 Dezernats-/Zustaendigkeits-Contract (2026-03-29)

Ziel: Monitoring-first fuer den kommunalen Startkanon kontraktnah absichern, ohne
Dashboard-Grossbaustelle, ohne hidden scoring und ohne epistemische Sondermacht.

## 1) Scope dieses Slices

- Zustaendigkeit als Kontext-/Bearbeitungs-/Nachverfolgungslogik, nicht als Wahrheitslogik.
- Dezernat/Fachbereich/Amt/Institution-Team als zulaessige Verantwortungsrahmen.
- Monitoring-first bleibt verpflichtend.
- Anlassraum-/Dossier-/Pruefpfad-/Mandatskern bleibt fuehrend.

## 2) Repo-nahe Ist-Anker

- Anlassraum-Create-Gate:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Anlassraum-Governance:
  - `features/anlassraum/governance.ts`
- Rollen-/Raumtypen:
  - `features/trust/types.ts`
  - `features/anlassraum/types.ts`

## 3) Kontrakt-Haertung aus GOV-MUNI-02

### Shared Municipal Guardrail-Resolver

- Datei: `features/anlassraum/municipalResponsibilityGuardrails.ts`
- Resolver: `resolveMunicipalResponsibilityGuardrails({ ownerType, roomType })`
- Liefert typed Contract mit:
  - Institutional-Context-Erkennung (ownerType/roomType-basiert)
  - Monitoring-first Pflicht
  - erlaubte Verantwortungs-Scope:
    - `dezernat`
    - `fachbereich`
    - `amt`
    - `institution_team`
  - erlaubte Bearbeitungs-/Statusdimensionen:
    - `beobachtet`
    - `in_pruefung`
    - `in_bearbeitung`
    - `umgesetzt`
    - `abgeschlossen`
  - harte Verbote:
    - keine Wahrheits-/Prioritaets-/Scoring-Sondermacht
    - keine Uebersteuerung von Anlassraum/Dossier/Pruefpfad/Mandat
  - verpflichtende Sichtbarkeit:
    - offene Fragen
    - Konfliktlagen
    - Mandat/Fortschritt/Traceability

### Route-nahe Einbindung

- `apps/web/src/app/api/admin/governance/anlassraum/route.ts` liefert:
  - `meta.municipalResponsibilityGuardrails`
- Rein kontrakt-/explainability-seitig, ohne neue Runtime-Privilegpfade.

## 4) Testabdeckung

- `apps/web/tests/municipal-responsibility-guardrails.test.ts`
  - institutioneller vs. nicht-institutioneller Kontext
  - Monitoring-first und Verbotsachsen
- `apps/web/tests/admin-governance-anlassraum.route.test.ts`
  - route-nahe Meta-Ausgabe inkl. institutionellem Kontext

## 5) Bewusst nicht Teil dieses Slices

- Kein neues Dashboard-Ranking oder politische Priorisierungslogik.
- Kein neuer Verwaltungs-Autopilot.
- Kein neuer Sonderkanal fuer institutionelle Eingriffe.
- Keine Vorwegnahme von `GOV-MUNI-03`, `GOV-MUNI-05`, `GOV-MUNI-06`.
