# CREATE-ANALYZE-E2E-PRODUCTION-01

Datum: 2026-05-23

## Entscheidung

Für v1 gilt der bestehende `/create`-/Analyze-/Save-/Finalize-/Handoff-Pfad als
`production_ready`, wenn er:

- real nutzbar
- persistent
- review-first
- scope-aware
- entitlement-aware
- contract-aware
- auditierbar

ist und dabei keine falschen AI-, Research-, Publish- oder Factcheck-Versprechen macht.

Nicht Teil dieses Claims:

- automatischer DeepSearch
- automatische kostenpflichtige KI-Aktion
- Auto-Publish
- automatisches `public_official`
- automatischer Factcheck-/Seal-Vollzug

## Umgesetzter v1-Pfad

Die bestehende `/create`-Kette wurde auf denselben vorhandenen Flächen gehärtet:

- `/create`
- `/api/contributions/analyze`
- `/api/create/save`
- `/api/create/finalize`
- `/api/create/handoffs`
- `/account/organization/dashboard`
- zentrale Review Queue

Der Pfad klassifiziert Eingaben jetzt ehrlich als:

- `free_text`
- `claim`
- `question_topic`
- `link`
- `document_url`
- `youtube_video_url`
- `material_reference`
- `source_snapshot_reference`
- `dossier_handoff`

Link-, Dokument-, YouTube-, Material- und Snapshot-Inputs bleiben review-first. Es wird kein
Crawling, keine automatische Vollauswertung und keine kostenpflichtige Research-Aktion behauptet.

## Scope, Rechte und Vertrag

Produktive Org-Handoffs hängen jetzt an denselben Produktionswahrheiten wie die restlichen
Org-Pfade:

- `operator_verified_directory`
- verifizierte Membership
- passende Org-Entitlements
- aktiver Betreiber-Vertragsprozess `operator_verified_contract`

Wenn diese Lage fehlt oder begrenzt ist, liefert `/create` keine Scheinerfolge:

- kein Crash
- kein Fake-Handoff
- ehrliche Hinweise zu Freischaltung, Vertrag oder Billing
- Arbeitsstand kann weiter lokal vorbereitet werden

Geblockt oder begrenzt werden produktive Org-Handoffs insbesondere bei:

- `pending`
- `evidence_required`
- `operator_review_required`
- `limited`
- `billing_pending`
- `grace_period`
- `suspended`
- `cancelled`
- `expired`

## Persistenz und Audit

Persistierte Create-Handoffs tragen jetzt zusätzlich:

- `intakeClassification`
- `requestScope`-Snapshot
- `accessDecision`-Snapshot
- Source-/Material-Referenzen
- Review-State

Die Review Queue und das Organisationsdashboard zeigen diesen Kontext auf derselben Wahrheit.

Guardrails bleiben explizit:

- kein stiller Merge
- kein Auto-Vote
- kein Auto-Publish
- kein automatisches `public_official`
- kein automatischer Factcheck/Seal

## Validierung

- `pnpm -C apps/web exec vitest run tests/create-mode.page.test.ts tests/create-mode.save.route.test.ts tests/create-mode.finalize.route.test.ts tests/create-handoff.persistence.route.test.ts tests/create-link-intake-clarification.contract.test.tsx tests/create-anlassraum-handoff.contract.test.tsx tests/create-factcheck-handoff.contract.test.ts tests/review-queue.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`

## Optional später

Bewusst offen und nicht Teil des v1-Claims:

- explizit gestartete Deep-Research-/Premium-Automation
- echter externer Checkout
- breitere externe Register-/Directory-Synchronisation ohne Betreiberkante
- automatisierte Factcheck-/Seal-Orchestrierung
