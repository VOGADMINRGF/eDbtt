# V3 Municipal Handoff Decision Boundary 2026-07-14

## Kontext

Nach Abschluss von `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01` ist der nächste fachlich naheliegende B2G-Folgepfad `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01`.

Dieser Task bleibt bewusst `needs_decision`.

## Warum die Boundary real ist

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

## Repo-seitige Konsequenz

- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` bleibt `needs_decision`
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` bleibt `blocked`
- B2G First Login bleibt read-only und review-first
- keine automatische Entitlement-Aktivierung
- keine automatische Empfängerbenachrichtigung
- keine automatische Behördenantwort

## Nötige Entscheidung für den nächsten Folgeslice

Vor einem Municipal-Handoff-Slice muss explizit freigegeben werden:

1. Pricing-/Trial-Semantik
2. Entitlement-/Counter-Semantik
3. Recipient-Verification-Semantik
4. External-Notification-Semantik
5. bewusster Human-Approval-Schritt vor Handoff
