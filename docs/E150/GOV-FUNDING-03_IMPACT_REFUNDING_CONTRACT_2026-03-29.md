# GOV-FUNDING-03 Impact-/Refunding-Contract (2026-03-29)

Ziel: Funding-Nachverfolgung von Zusage auf Wirkung/Follow-up/Refunding kontraktnah
haerten, ohne Payment-/Checkout-/Refund-Engine.

## 1) Scope dieses Slices

- Typed Impact-/Follow-up-/Refunding-Lifecycle fuer Funding-Faelle.
- Anlassraum-first und projektbezogene Matching-Logik absichern.
- Transparenz-/Reason-/Audit-Pflichten fuer Nicht-Einloesung/Umwidmung.

## 2) Implementierungsanker

- Lifecycle-Contract:
  - `apps/web/src/lib/server/funding/fundingImpactLifecycleContract.ts`
- Route-nahe Baseline-Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Tests:
  - `apps/web/tests/funding-impact-lifecycle-contract.test.ts`
  - `apps/web/tests/admin-governance-anlassraum.route.test.ts`

## 3) Contract-Kern

Der Contract deckt typed ab:
- Impact-Status:
  - `not_started`, `in_progress`, `partially_realized`, `realized`, `not_realized`, `stopped`
- Follow-up-Status:
  - `none`, `open`, `in_review`, `action_required`, `resolved`
- Refunding-Status:
  - `none`, `review_required`, `pending`, `reallocated`, `refunded`, `closed_without_refund`
- Refunding-Reason-Typen:
  - `scope_change`, `non_delivery`, `partial_delivery`, `governance_veto`,
    `legal_blocker`, `provider_withdrawal`, `other`
- Transparenz-/Explainability-/Audit-Pflichtfelder.

Validierungsregeln:
- `anlassraum`-Scope braucht `anlassraumId`; `dossier_adjacent` braucht `dossierId`.
- Matching-Frames (`enabling_fund`, `community_contributions`) bleiben auf
  `anlassraum`-Scope begrenzt.
- Refunding ausserhalb `none` braucht Reason-Typ und Reason-Text.
- `not_realized`/`stopped` brauchen `impactReason`.

## 4) Guardrails

- Funding bleibt projektbezogen und anlassraum-first.
- Keine Wahrheits-/Signal-/Legitimationsableitung aus Funding-Lifecycle.
- Keine personenbezogene Reward-/Points-/Token-Logik.
- Keine Capture-Uebersteuerung durch Ressourcenmacht.

## 5) Route-nahe Baseline

Bei Anlassraum-Erstellung wird zusaetzlich ein baseline-naher Funding-Lifecycle als
Meta-Contract ausgegeben:
- `meta.fundingImpactLifecycle`
- Start auf `impactStatus=not_started`, `followUpStatus=open`, `refundingStatus=none`

## 6) Bewusst nicht Teil dieses Slices

- Keine Zahlungs-/Checkout-/Billing-/Refund-Engine.
- Keine automatische Mittelbewegung.
- Keine UI-Grossbaustelle fuer Funding-Dashboards.
