# GOV-ORG-01 Dossier-/Anlassraum-Org-Context-Contract (2026-03-29)

Ziel: Organisationskontext produktionsnah an Anlassraum/Dossier andocken, ohne
Parallel-Domaene und ohne neue Wahrheits-/Prioritaetsmacht.

## 1) Scope dieses Slices

- Typed Org-Context-/Attachment-Contract fuer den Anlassraum-Kern.
- Additive Route-Meta-Einbindung in bestehende Governance-Ausgabe.
- Cross-Check gegen Journalism-/Muni-/Funding-/Pricing-Anschluss (nur Guardrail-Ebene).
- Keine neue API-Landschaft, keine neue Produktflaeche, kein Workflow-Umbau.

## 2) Implementierungsanker

- Neuer shared Contract:
  - `features/anlassraum/orgContextAttachmentContract.ts`
- Route-nahe Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`

## 3) Org-Context-Profilrahmen (minimal, kanonkonform)

- `none`
- `association`
- `company`
- `media_house`
- `institutional_organization`
- `team_organization`

Leitlinie:
- Anlassraum bleibt Kernraum.
- Dossier bleibt Oberraum.
- Organisation ist Kontext-/Arbeits-/Traegerstruktur.

## 4) Attachment-Logik

- `none` (kein Org-Kontext aktiv)
- `anlassraum_primary` (Org-Kontext an konkreten Anlassraum)
- `anlassraum_with_dossier_context` (Anlassraum + expliziter Dossierbezug)

Enabled Org-Kontext bleibt anlassraumgebunden:
- `orgOwnerId` Pflicht
- `anlassraumId` Pflicht
- Dossierbezug nur bei explizitem `dossierId`

## 5) Guardrails (verbindlich im Contract)

- kein Parallelkanon neben Anlassraum/Dossier
- keine Wahrheits-Sondermacht
- keine Prioritaets-Sondermacht
- keine Voting-Sondermacht
- keine Faktenstatus-Sondermacht

## 6) Anschluss an bestehende Straenge

- Journalism:
  - media-/teamfaehiger Kontext bleibt anschlussfaehig
  - keine Ableitung von Wahrheitsstatus aus Rollen-/Publisher-Kontext
- Muni:
  - institutioneller Kontext bleibt separat, aber kompatibel
  - kein Organisationsersatz fuer kommunale Verantwortungs-/Statuslogik
- Pricing:
  - nur Segment-Hints (kein Pricing-Override)
  - keine neue Preis-/Billing-Logik
- Funding:
  - projektbezogener Anlassraum-first-Anschluss bleibt intakt
  - dossier-adjacent nur bei explizitem Dossierkontext

## 7) Route-nahe Meta-Ausgabe

Erweitert in `/api/admin/governance/anlassraum`:
- `meta.orgContextAttachment`
- `meta.orgContextConsistency`

Bestehende Meta-Contracts bleiben unveraendert und gleichrangig erhalten.

## 8) Tests

- `apps/web/tests/org-context-attachment-contract.test.ts`
- `apps/web/tests/admin-governance-anlassraum.route.test.ts`

## 9) Bewusst nicht Teil dieses Slices

- Kein neuer Release-/Trust-Modus (`GOV-ORG-02`).
- Keine neue Organisation-UI.
- Keine neue Auth-/Rechtearchitektur.
- Keine neue Organisations-Prioritaets- oder Wahrheitslogik.
