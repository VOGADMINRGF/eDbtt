# GOV-ORG-02 Org-/Publisher-/Team-Context-Contract (2026-04-03)

Ziel: Org-/Publisher-/Redaktions-/Team-Kontext als Arbeits-/Traegerlogik
kontraktnah absichern, ohne neue Wahrheitsdomaene, ohne Prioritaetsprivileg
und ohne Parallelkanon neben Anlassraum/Dossier.

## 1) Scope dieses Slices

- Shared typed Contract fuer Org-/Publisher-/Team-Zuordnung.
- Additive route-nahe Meta-Einbindung in bestehende Governance-Ausgabe.
- Guardrails und Konsistenzpruefung fuer kritische Kurzschluesse
  (Org/Thema/Region/Publisher/Team).
- Keine neue API-Landschaft, keine UI-Grossflaeche, kein Pricing-/Funding-Rewrite.

## 2) Implementierungsanker

- Neuer shared Contract:
  - `features/anlassraum/orgPublisherTeamContextContract.ts`
- Route-nahe Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`

## 3) Kontextmodell (minimal, nicht-hierarchisch)

- `org_context`
- `publisher_context`
- `editorial_team_context`
- `association_context`
- `civic_collective_context`

Leitlinie:
- Kontexttypen sind Arbeits-/Traegerrahmen.
- Kein Kontexttyp erzeugt Wahrheits-, Prioritaets- oder Voting-Sondermacht.

## 4) Andockung und Sichtbarkeit

Contract-seitig sichtbar:
- `primaryContext`
- `activeContexts`
- `allowedBindings` fuer:
  - `anlassraum` (immer true)
  - `dossier`
  - `companion`
  - `stream`
- Kontext-/Traeger-/Verantwortungssichtbarkeit

Damit wird klar:
- In welchem Org-/Publisher-/Team-Kontext gehandelt wird.
- Welche Anlassraum-/Dossier-/Companion-/Stream-Anschluesse erlaubt sind.

## 5) Verbindliche Guardrails

- Org-/Publisher-/Team-Kontext ist nicht Wahrheit.
- Org-/Publisher-/Team-Kontext ist nicht Prioritaet.
- Org-/Publisher-/Team-Kontext ist nicht Voting-/Faktenstatus-Bonus.
- Org-Kontext ist nicht Themen- oder Regionshoheit.
- Publisher-Kontext ist nicht Dossier-Hoheit.
- Team-Kontext ist keine Prioritaetsautomatik.
- Thema und Region bleiben getrennte Achsen (`separatedAxes = true`).

## 6) Zulaessige und unzulaessige Kombinationen

Zulaessig (beispielhaft):
- Publisher-/Editorial-Kontext mit Companion-/Stream-Binding, sofern Capabilities
  aus CIVIC/JOURNALISM-Vertraegen vorhanden sind.
- Association-Kontext mit civic_collective-Zusatzsichtbarkeit.

Unzulaessig (contract-seitig gehaertet):
- `publisher_context` gemeinsam mit `association_context` oder
  `civic_collective_context`.
- `stream_active`/`companion_active` ohne `allowedBindings.companion`.
- Regionssichtbarkeit ohne Themenbezug als impliziter Shortcut.

## 7) Route-nahe Meta-Ausgabe

Erweitert in `/api/admin/governance/anlassraum`:
- `meta.orgPublisherTeamContext`
- `meta.orgPublisherTeamContextConsistency`

Bestehende Meta-Contracts bleiben erhalten und gleichrangig:
- Journalism
- Muni
- Funding
- Org-Context-Attachment (GOV-ORG-01)
- CIVIC-Representation/Lifecycle/Impact

## 8) Tests

- `apps/web/tests/org-publisher-team-context-contract.test.ts`
- `apps/web/tests/admin-governance-anlassraum.route.test.ts`

## 9) Bewusst nicht Teil dieses Slices

- Kein neuer Release-/Trust-Workflow mit eigener UI.
- Kein neuer Billing-/Checkout-/Funding-Mechanismus.
- Kein neuer Publisher-/Org-Sonderkanal ausserhalb Anlassraum/Dossier-Kern.
- Keine neue Reputations-/Trust-Score-Architektur.
