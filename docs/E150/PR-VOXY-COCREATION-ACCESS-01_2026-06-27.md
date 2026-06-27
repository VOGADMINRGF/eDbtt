# PR-VOXY-COCREATION-ACCESS-01

Datum: 2026-06-27
Issue: #224
Status: erledigt

## Summary

Dieser Slice bereitet Voxy Co-Creation produktseitig ueber reine Access-/Entitlement- und State-Contracts vor.

- kein Payment-/Checkout-Provider
- keine harte Paywall fuer veroeffentlichte oeffentliche Debatten
- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- Review-first und Author-Confirmation bleiben Pflicht

## Changed areas

- `apps/web/src/features/voxy/accessContract.ts`
- `apps/web/src/features/voxy/coCreationState.ts`
- `apps/web/tests/voxy-access-contract.test.ts`
- `apps/web/tests/voxy-cocreation-state-contract.test.ts`
- `docs/E150/voxy-default-debate-template.md`
- `docs/E150/output-engine-studio.md`
- `docs/E150/OpenTasks.md`

## Access contract

Eingefuehrt wurden:

- `VoxyPlan`
- `VoxyCapability`
- feste Capability-Matrix fuer `public`, `member`, `author_plus`, `partner`, `operator`, `admin`
- `getVoxyCapabilitiesForPlan(plan)`
- `canUseVoxyCapability(plan, capability)`
- `assertVoxyAccess(plan, capability)`

Contract-Alignment auf die finale Issue-#224-Semantik:

- `partner` darf jetzt `voxy_publish_prepare`, aber weiterhin kein `voxy_editorial_review`
- `operator` darf Review und Publish-Vorbereitung, aber weiterhin kein Auto-Publish
- `voxy_publish_prepare` bleibt reine Export-/Veroeffentlichungsvorbereitung, keine Veroeffentlichung

## Co-Creation state contract

Der Co-Creation-State ist als eigener Pre-Output-Contract modelliert.

- Author Confirmation und Editorial Review sind getrennte Statusachsen
- `approved_for_export` ist bewusst nicht `published`
- die dokumentierten Minimalfelder aus dem Voxy-Template sind typisiert und testbar
- finale `authorApprovalStatus`-Werte: `draft`, `needs_author_confirmation`, `confirmed`, `rejected`
- finale `editorialReviewStatus`-Werte: `not_submitted`, `needs_review`, `in_review`, `changes_requested`, `approved_for_export`, `rejected`
- kleine Helper fuer offene Rueckfragen und naechste Pflichtschritte halten Author-Confirmation und Sensitive-Claims-Review sichtbar

## Route / surface impact

- `apps/web/config/routeAccess.json` blieb unveraendert
- bestehende `create`-/`dashboard`-/`admin`-Routen blieben unveraendert
- dieser Slice fuehrt nur Contract-Readiness ein, keine neue UI und keine neue Runtime-Freischaltung

## Validation

Erfolgreich ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/voxy-access-contract.test.ts tests/voxy-cocreation-state-contract.test.ts`
- `pnpm -C apps/web run build`

## Out of scope

- Payment Provider / Checkout
- produktive Abo- oder Billing-Logik
- harte Paywall fuer veroeffentlichte oeffentliche Debatten
- Auto-Publish
- Auto-Dossier
- Auto-Anlassraum
- Fake-Social-Integration
- grosse UI-Umbauten
