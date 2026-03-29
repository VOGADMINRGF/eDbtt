# GOV-JOURNALISM-03 Companion/Embed/QR Contract (2026-03-29)

Ziel: den offenen Anlassraum-/Dossier-Kern fuer journalistische Aussenanschluesse
(Companion, Embed, QR) produktnah haerten, ohne Sonderwahrheit und ohne Parallelkanon.

## 1) Scope des Slices

- Companion/Embed/QR-Anschluss als transparenter Arbeitskontext.
- Anschluss bleibt an offenen Dossier-/Pruef-/Fragenkern gebunden.
- Kein Wahrheits-/Prioritaetsprivileg durch Kanal oder Publisher-Kontext.
- Keine neue UI-Grossflaeche, keine neue Route, keine neue Payment-Logik.

## 2) Repo-nahe Implementierungsanker

- Shared Companion-Contract:
  - `features/anlassraum/journalismCompanionContract.ts`
- Route-nahe Meta-Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
  - `meta.journalismCompanionContract`
- Regressionstests:
  - `apps/web/tests/journalism-companion-contract.test.ts`
  - `apps/web/tests/admin-governance-anlassraum.route.test.ts`

## 3) Contract-Kern aus GOV-JOURNALISM-03

- Companion-Channel bleiben explizit und typed:
  - `open_dossier_companion`
  - `embed`
  - `qr`
- Surface-Scopes bleiben explizit:
  - `public_open`
  - `editorial_context`
  - `restricted_context`
- Guardrails bleiben verpflichtend:
  - kein Wahrheitsprivileg
  - kein Prioritaetsprivileg
  - kein Parallel-Wahrheitskanal
  - keine Publisher-Silo-Schliessung gegen den offenen Dossier-Kern

## 4) Ergebnis

- Journalistische Aussenanschluesse sind als Hilfs-/Arbeitswerkzeuge kontraktnah gefasst.
- `source_anchor` bleibt legitimer Startkontext, aber nicht epistemischer Abschluss.
- Companion/Embed/QR koennen oeffentliche Nachverfolgung stuetzen, ohne Sonderkanal zu erzeugen.

## 5) Bewusst nicht Teil dieses Slices

- Kein Publisher-spezifischer UI-Ausbau.
- Kein neuer Workflow-Branch als exklusiver Medienkanal.
- Keine Ableitung von Factcheck-/Finding-/Dossierstatus aus Kanalwahl.
