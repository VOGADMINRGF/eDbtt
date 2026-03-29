# GOV-PRICING-02 Admin Pricing Control Contract (2026-03-29)

## Zweck

Dieses Dokument bereitet `GOV-PRICING-02` entscheidungsfrei fuer Runtime-Slices vor.
Es setzt den manifestierten Kanon aus `GOV-PRICING-01` um:

- Public Core bleibt offen.
- Professional Layer ist bezahlbar.
- Pricing bezahlt Arbeitsfaehigkeit, nicht Wahrheit/Signal/Prioritaetsmacht.
- Specials/Pilotpfade bleiben nur transparent, auditierbar und steuerbar.

Keine Billing-Engine, kein Checkout, keine neue Produktlogik.

## 1) Repo-Iststand (relevante Anker)

| Bereich | Bestehender Anker | Ist-Status | Luecke fuer GOV-PRICING-02 |
| --- | --- | --- | --- |
| Paket-/Plan-Definition | `features/pricing/domain/plans.de.ts`, `features/pricing/config.ts`, `core/access/accessTiers.ts` | Paketkatalog + Tier-Mapping vorhanden | Kein einheitlicher Admin-Pricing-Control-Contract fuer Segment/Fee/Caps/Overrides |
| User-/Plan-Mutation (Admin) | `apps/web/src/app/api/admin/dashboard/users/route.ts` | Admin kann Paket/Tier/Planstatus direkt setzen | Kein verpflichtender Override-Reason, keine konsistente Auditspur fuer Pricing-Eingriffe |
| Self-serve Planwechsel (User) | `apps/web/src/app/api/account/plan/route.ts` | Einfache Planumstellung auf Tier vorhanden | Kein Governance-Contract fuer Segment-/Verification-/Special-Regeln |
| Membership-Operations (Admin) | `apps/web/src/app/api/admin/memberships/*` | Statusfluesse (`waiting_payment`, `active`, `cancelled`) + Identity-Events vorhanden | Kein Pricing-Control-Layer fuer Caps/Fee/Specials/Creator-Typ |
| Pilot-/Special-Settings | `apps/web/src/app/api/admin/pilot/settings/route.ts`, `core/pilotSettings/store.ts` | Pilotsettings inkl. Change-Log vorhanden | Kein Bezug auf Pricing-Segmente/Fees/Overrides/Explainability |
| KPI-Basis | `apps/web/src/app/api/admin/dashboard/summary/route.ts` | Grundzaehler (u. a. Packages) vorhanden | Kein konsolidierter Pricing-Control KPI-Contract; `apps/web/src/app/api/admin/usage/summary/route.ts` ist `501 not-implemented` |

## 2) Operativer Mindestcontract fuer Admin Pricing Control

### 2.1 Sichtbar/regulierbar (Pflichtfelder)

1. Segment
2. Tarif/Plan
3. Verifizierungsstatus
4. Creator-Typ (`civic_creator`, `media_creator`, `publisher_agency_team_org`)
5. Kommune/Institution/Oeffentlicher-Traeger-Status
6. Funding-Fee-Regel (nur ergaenzend, nicht Hauptlogik)
7. Caps/Obergrenzen
8. Specials/Add-ons/Pilotstatus/Sonderangebote
9. Manuelle Overrides
10. Begruendung + Auditspur je Override/Sonderregel

### 2.2 Explainability-Pflicht (bei jeder Entscheidung)

- Warum greift welcher Tarif?
- Warum greift welche Fee?
- Warum greift welches Segment?
- Warum ist welcher Sonderstatus aktiv?
- Welche Regelquelle war ausschlaggebend (Default/Policy/Override)?

### 2.3 Governance-Pflicht

- Keine stillen Preis-/Fee-Aenderungen.
- Overrides nur mit Reason/Akteur/Zeitstempel.
- Hohe Eingriffe (z. B. Cap-Aufhebung, Sonderpreisprofil) mit expliziter Audit-Pflicht.
- Kommunale/institutionelle Standardfaelle bleiben verifizierungsgebunden und online-abschlussfaehig.

## 3) KPI-/Controlling-Contract (Mindestumfang)

| KPI-Gruppe | Muss sichtbar sein | Bestehende Quelle (Ist) | Ausbau fuer GOV-PRICING-02 |
| --- | --- | --- | --- |
| Aktivitaet | aktive Anlassraeume, aktive Dossiers | Anlassraum-/Dossier-Admin-Reads verteilt | Einheitlicher Pricing-Control Read-Contract |
| Nutzung Professional Layer | Nutzung Team/Org/Admin/Review/Factcheck/Export/Embed/QR | Teilweise ueber Admin-Endpoints vorhanden | KPI-Buendel mit klaren Felddefinitionen |
| Funding/Fee | Funding-Volumen, Funding-Fee-Umsaetze | Noch kein konsolidierter Admin-Contract | Feld- und Berechnungsherkunft dokumentieren |
| Conversion | Free -> Creator -> Team/Organization | Paket-/Tier-Daten in User/Admin-Summary vorhanden | Einheitliche Conversion-Definitionen pro Segment |
| Specials/Pilot | Nutzung Sonderprofile/Angebote | Pilotsettings separat vorhanden | Gemeinsamer Control-View inkl. Auditbezug |

## 4) Guardrails gegen Drift (kanonisch)

- Kein Reward-/Gamification-Drift (`points/credits/tokens` nicht als Pricing-Hauptmechanik).
- Kein Earn-to-participate.
- Matching-/Ermoeglichungslogik bleibt projektbezogen, nicht personenbezogene Auszahlungslogik.
- Creator-/Publisher-Abgrenzung bleibt explizit und transparent.
- Funding bleibt getrennt von Relevanz/Legitimation; Pricing bleibt Monetarisierung von Arbeitsfaehigkeit.

## 5) Runtime-faehige Folgeslices (aus diesem Prep ableitbar)

### GOV-PRICING-02A (done)

Shared Contract-Slice:
- typed Policy-/Override-/Explainability-Schema (ohne Preisengine)
- erlaubte Felder strikt begrenzen
- Unit-Tests fuer erlaubte/unerlaubte Felder + Reason-Pflicht

### GOV-PRICING-02B (done)

Audit-/KPI-Contract-Slice:
- Audit-Event-Contract fuer Pricing-Overrides/Specials
- strukturierter KPI-Snapshot-Contract (nur Read-/Contract-Ebene)
- Tests fuer Contract-Paritaet und Pflichtfelder

### GOV-PRICING-02C (done)

Nachgelagerte Runtime-Integration:
- Admin-Readmodel/Surface-Integration auf Basis 02A/02B
- ohne Checkout-/Payment-Engine

## 6) Explizit nicht Teil dieses Slices

- Keine Billing-/Checkout-/Stripe-Implementierung.
- Keine neue Pricing-Formel.
- Keine Runtime-Auszahlung oder Funding-Engine.
- Keine Monetarisierung von Wahrheit/Faktenstatus/Signal/Prioritaetsmacht.

## 7) Implementierungsnachweis 02A

- Contract-Implementierung:
  - `apps/web/src/lib/server/pricing/adminPricingControlContract.ts`
- Tests:
  - `apps/web/tests/admin-pricing-control-contract.test.ts`
- Scope-Status:
  - Typed Policy-/Override-/Explainability-Contract abgeschlossen.
  - Audit-/KPI-Contract-Haertung bleibt Folgeslice `GOV-PRICING-02B`.

## 8) Implementierungsnachweis 02B

- Contract-Implementierung (Erweiterung):
  - `apps/web/src/lib/server/pricing/adminPricingControlContract.ts`
  - neue typed Parser/Shapes:
    - Audit-Event-Contract (`parseAdminPricingControlAuditEventContract`)
    - KPI-Snapshot-Contract (`parseAdminPricingControlKpiSnapshotContract`)
- Tests:
  - `apps/web/tests/admin-pricing-control-audit-kpi-contract.test.ts`
- Ergebnis:
  - KPI-Pflichtfelder und Explainability-Shape sind regressionssicher eingefroren.
  - Mutationsevents (Override/Special/Pilot/Fee/Cap) sind reason-/source-/changed-field-pflichtig.
  - keine Billing-/Checkout-/UI-Logik erweitert.

## 9) Implementierungsnachweis 02C

- Readmodel-Implementierung:
  - `apps/web/src/lib/server/pricing/adminPricingControlReadModel.ts`
- Integration in bestehende Admin-Reads:
  - `apps/web/src/app/api/admin/dashboard/summary/route.ts`
  - Feld: `data.pricingControlReadModel`
- Tests:
  - `apps/web/tests/admin-pricing-control-readmodel.test.ts`
- Ergebnis:
  - Readmodel-/Projection-Contract fuer Segment/Plan/Verification/Fee/Caps/Specials/Overrides ist runtime-nah verfuegbar.
  - Audit-/KPI-Snapshots werden als typed Parse-Stufen in den Readmodel-State eingebunden (inkl. invalid/absent-Status statt stiller Drift).
  - Guardrails gegen Wahrheits-/Signal-/Ergebnisbezug sowie Reward-Mechaniken sind explizit im Readmodel verankert.
  - Keine Billing-/Checkout-/Payment-Engine und kein UI-Ausbau.

## 10) Status GOV-PRICING-02

`GOV-PRICING-02` ist mit 02A/02B/02C operativ abgeschlossen.
Weitere Pricing-Arbeit beginnt erst wieder bei einem neuen, explizit geschnittenen Folgeblock.
