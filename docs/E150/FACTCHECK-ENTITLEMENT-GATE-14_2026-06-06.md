# FACTCHECK-ENTITLEMENT-GATE-14

Datum: 2026-06-06

## Gate-Modell

Neu ist der zentrale Resolver `features/factcheck/entitlementGate.ts`.

Er modelliert:

- Actions: `light_analysis`, `editorial_review`, `factcheck_request`, `source_check`, `deep_research`, `dossier_preparation`, `anlassraum_publish`, `organization_mode`
- Gate-Felder: `loginRequired`, `entitlementRequired`, `pricingRequired`, `confirmationRequired`, `allowed`, `reason`
- Harte Guardrails: `noAutoStart`, `noSilentCost`, `noAutoPublish`, `noAutoGraphPromotion`

Die wichtigsten Gate-Gründe:

- `free_draft_action`
- `login_required`
- `entitlement_missing`
- `pricing_required`
- `confirmation_required`
- `blocked_by_truth_guard`
- `blocked_by_spam`
- `review_required_first`

## Free vs Login vs Entitlement

Kostenfrei / Draft-first:

- `light_analysis`
- `editorial_review`

Loginpflichtig:

- `factcheck_request`

Entitlement-/Pricing-gated plus Bestätigung:

- `source_check`
- `deep_research`
- produktionsnahe `dossier_preparation`
- `anlassraum_publish`
- `organization_mode`

## UI-Verhalten

### `/factcheck`

- Gäste werden vor verbindlichen Factcheck-/Review-Schritten auf Login gelenkt.
- Der aktuelle Prüfentwurf wird lokal zwischengespeichert und nach Rückkehr wiederhergestellt.
- Vertiefte Quellenprüfung öffnet zuerst eine Gate-Karte:
  - `Bestätigung erforderlich` bei vorhandener Freischaltung
  - `Kontingent erforderlich` ohne passende Freischaltung
- Kein automatischer DeepSearch-Lauf, kein Auto-Publish, kein Graph-Merge.

### `/create`

- Der vorhandene Start-Draft-/Factcheck-Bestätigungspfad nutzt jetzt denselben Gate-Resolver.
- Normale Draft-Handoffs bleiben pricing-frei.
- Vertiefte Prüfung bleibt auf bewusste Bestätigung und passende Freischaltung begrenzt.

### `/account` und `/admin/review`

- `factcheck_request` wird statussprachlich separat gezeigt:
  - `Quellenprüfung angefragt`
  - `Quellenprüfung vorbereitet`
  - `Bestätigung erforderlich`
- `accepted_for_workup` startet weiterhin keinen Faktencheck automatisch.
- Admin-Aktion ist für Factcheck-Fälle explizit als `Quellenprüfung vorbereiten` beschriftet.

## ReviewQueue-Integration

- `accepted_for_workup` bleibt ein reiner Vorbereitungsstatus.
- Für `factcheck_request` zeigt der nächste Schritt jetzt explizit `Quellenprüfung vorbereiten`.
- Account/Admin transportieren weiter die Guardrails `Noch nicht veröffentlicht` und `Kein Graph-Merge ohne Freigabe`.

## Server-Guardrails

### Analyze

`/api/contributions/analyze` blockt vertiefte Research-Wünsche jetzt serverseitig:

- `allowDeepSearch=true` allein reicht nicht mehr
- `researchConfirmed` wird serverseitig geprüft
- ohne Auth/Entitlement/Bestätigung kommt `RESEARCH_GATE_BLOCKED`

### Factcheck

`/api/factcheck/enqueue` blockt vertiefte Provider-/Deep-Research-Wünsche jetzt serverseitig:

- ohne Entitlement oder Bestätigung kommt `FACTCHECK_ENTITLEMENT_GATE_BLOCKED`
- einfache Factcheck-/Quellenprüf-Anfragen bleiben review-first
- auch im erlaubten Pfad gibt es keinen Auto-Start eines produktiven Providerlaufs

## Tests

Neu/aktualisiert:

- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/draft-to-review-analyze-gate.contract.test.ts`
- `apps/web/tests/account-editorial-review.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/admin-editorial-review.route.test.ts`

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-entitlement-gate.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/create-analyze.route.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/account-editorial-review.contract.test.tsx tests/admin-review.page.test.tsx tests/admin-editorial-review.route.test.ts`

## Offene Punkte

- Ein eigener produktiver Provider-Startpfad fuer freigegebene Factcheck-Research-Laeufe ist weiterhin nicht kanonisiert; dieser Slice blockt und markiert, startet aber bewusst nichts automatisch.
- Falls spaeter feinere user-/org-spezifische Kontingente fuer `source_check` vs `deep_research` kommen, kann der zentrale Gate-Resolver ohne Surface-Drift erweitert werden.
