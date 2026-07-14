# V3 Municipal Handoff Decision Boundary 2026-07-14

## Kontext

Diese Datei dokumentierte die offene Decision Boundary direkt nach `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01`.

Seit dem Decision-Slice

- `V3-CIVIC-PRINCIPLES-GOV-LIGHT-MUNICIPAL-HANDOFF-DECISION-01`
- Evidence: `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`

ist diese Boundary repo-seitig aufgeloest.

## Historische Boundary

Der Handoff würde Produktentscheidungen berühren, die in `OpenTasks.md`, `.codex/agents/bootstrap.json` und dem Runtime-Manifest weiterhin getrennt gehalten werden:

- Pricing-Freigabe für den Trial oder ein Folgepaket
- Entitlement-Semantik für die drei internen Adoptionen
- Recipient Verification für echte Behördenempfänger
- External Notification Workflow
- bewusste Freigabe vor Handoff

## Was ausdrücklich noch nicht entschieden ist

- ob und wie eine verifizierte Behörde automatisch oder manuell als Empfänger aufgelöst wird
- ob drei interne Adoptionen als Trial ohne separates Billing-/Entitlement-Objekt gezählt werden dürfen
- wie externe Behördenbenachrichtigung, Empfangsbestätigung und Response-Kanal konkret freigegeben werden
- ob `named contact` oder `managed governance` einen operativen Handoff ersetzen dürfen

## Aktuelle Konsequenz

- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` ist nicht mehr `needs_decision`, sondern `codex_ready`
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` bleibt dennoch `blocked`, bis der Municipal-Handoff-Cluster selbst umgesetzt ist
- B2G First Login bleibt read-only und review-first
- keine automatische Entitlement-Aktivierung
- keine automatische Empfaengerbenachrichtigung
- keine automatische Behoerdenantwort

## Abgeloest durch

Die notwendigen Produktentscheidungen zu

1. Pricing-/Trial-Semantik
2. Entitlement-/Counter-Semantik
3. Recipient-Verification-Semantik
4. External-Notification-Semantik
5. bewusstem Human-Approval-Schritt vor Handoff

sind jetzt im Decision-Contract dokumentiert.
