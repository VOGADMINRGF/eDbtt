# COMMUNITY-SOURCE-REVIEW-WORKBENCH-06

## Ausgangslage nach #270

Nach `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05` und
`COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-UI-06` konnten öffentliche Nutzer
Hinweise sicher über die gehärtete Public-API und den kleinen Einstieg auf
veröffentlichten `/beteiligung/[slug]`-Räumen einreichen. In `/admin/review`
gab es bereits eine kleine Moderationssektion, aber noch keinen operativen
Workbench-Layer mit Statusmodell, Priority-Modell, Workbench-Signalen,
Soft-Archive und interner Notiz.

## Vorhandene Strukturen vor diesem Slice

- `communitySourceReviewContribution.ts` modellierte bereits die review-first
  Hint-Arten `source_suggestion`, `counter_source`, `context_note`,
  `lived_experience`, `unclear_claim`, `wording_clarification`,
  `escalation_request`.
- `communitySourceReviewModeration.ts` führte typed Moderation-, Abuse-,
  Spam-, Duplicate-, Trust- und Source-Quality-Signale inklusive Guardrails.
- `communitySourceReviewServer.ts` persistierte Records und Audits bereits
  review-first in denselben Admin-Pfad.
- `/api/admin/community-source-review/[contributionId]` und die frühere
  `AdminCommunitySourceReviewSection` deckten schon einzelne Moderationsaktionen
  ab, aber eher als Statusanzeige als als operativen Arbeitsplatz.

## Neue Workbench-Funktionen

- Neues Readmodel `apps/web/src/features/create/communitySourceReviewWorkbench.ts`
  ergänzt.
- Öffentliche Submissions und bestehende Community-Contributions werden jetzt
  gemeinsam als Workbench-Items gelesen.
- Öffentliche Herkunft wird aus den bereits persistenten Submission-Notizen
  (`Öffentlicher Intake: review-first API`, Beteiligungsraumbezug) abgeleitet.
- Die Admin-Sektion in `/admin/review` zeigt jetzt:
  - Status
  - Priority
  - Workbench-Signale
  - Public-Submission-Herkunft
  - verfügbare Aktionen
  - Guardrail-Copy
  - Audit-Historie
  - basic stale/pendingTooLong-Hinweise

## Public Moderation Operations in diesem Slice

Basic-covered innerhalb desselben Workbench-Slices:

- Statuszählung für `new`, `queued_for_moderation`, `needs_source_review`,
  `needs_editorial_review`, `escalated`, `hidden/rejected`, `archived`
- Priority-Modell `low`, `normal`, `high`, `urgent`
- Signal-Lesart für Spam, Abuse, Duplicate, Volume, Trust, Source Quality,
  Source Review und Editorial Review
- Soft-Archive statt Hard-Delete
- interne Notiz im selben Audit-Pfad
- `pendingTooLong`-Hinweis auf Readmodel-Ebene

Nicht Teil dieses Slices:

- Team-/Schicht-Queue
- SLA-Automation
- Rollen-/RBAC-Großumbau
- öffentliche Moderationsplattform

## Statusmodell

- `new`
- `queued_for_moderation`
- `needs_source_review`
- `needs_editorial_review`
- `escalated`
- `allowed_as_hint`
- `hidden`
- `rejected`
- `archived`

## Priority-Modell

- `low`
- `normal`
- `high`
- `urgent`

Priorität bleibt review-first:

- Abuse-/Escalation-Lage kann hoch oder urgent priorisieren.
- Trust und Source Quality priorisieren höchstens Prüfung.
- Manuelle Workbench-Priorität bleibt getrennt von Wahrheit,
  Verifikation und Veröffentlichung.

## Aktionen

Bestehende Aktionen weiterverwendet und in die Workbench zusammengeführt:

- `allowAsHint`
- `hideHint`
- `rejectHint`
- `escalateHint`
- `markNeedsSourceReview`
- `markNeedsEditorialReview`
- `markAsSpamRisk`
- `markAsAbuseRisk`
- `clearAbuseSignal`
- `escalateAbuseReview`
- `markSourceQualityReviewed`
- `markTrustQualityReviewed`
- `setReviewPriorityFromTrustQuality`
- `clearTrustQualitySignals`

Neu im operativen Workbench-Layer:

- `setCommunitySourceReviewPriority`
- `archiveCommunitySourceReviewItem`
- `addCommunitySourceReviewInternalNote`

## Audit

Alle Workbench-Aktionen schreiben weiter in denselben bestehenden
Audit-Store. Neu ergänzt:

- `workbench_priority_set`
- `item_archived`
- `internal_note_added`

Audit bleibt review-first und erzeugt weder Wahrheit noch Veröffentlichung.

## Review Queue / Source Review / Editorial Review Anschluss

- `markNeedsSourceReview` setzt weiterhin explizit `routeTarget: source_review`
  und erzeugt einen nachvollziehbaren Review-Anschluss, aber kein
  Factcheck-Ergebnis.
- `markNeedsEditorialReview` setzt weiterhin explizit
  `routeTarget: editorial_review` und erzeugt einen redaktionellen Anschluss,
  aber keinen Publish-Pfad.
- Die Workbench bleibt auf derselben Record-/Audit-Runtime und erzeugt keine
  zweite Queue-Welt.

## Warum keine direkte Veröffentlichung

- `allowed_as_hint` ist nur ein Moderations-/Review-Status.
- keine Aktion setzt `accepted_as_fact`
- keine Aktion setzt `canPublish`
- keine Aktion stößt Public Route, Official Release oder sonstige sichtbare
  Veröffentlichung an

## Warum keine Wahrheit oder Quellenverifikation

- Hinweise bleiben `hint_only`
- Gegenquellen bedeuten nicht automatisch Widerlegung
- Erfahrungsberichte bedeuten nicht repräsentative Evidenz
- Trust und Source Quality priorisieren höchstens Review
- Volumen oder Wiederholung bedeuten keine Wahrheit

## Warum keine Graph-/Merge-/Entity-Aktion

- keine Aktion schreibt in Topic Graph
- keine Aktion merged etwas
- keine Aktion erzeugt Dossier, Anlassraum oder Beteiligungsraum
- kein Auto-Factcheck
- kein versteckter DeepSearch-/Kostenpfad

## Guardrails

- no auto publish
- no auto activation
- no fact verification by default
- no source verification by default
- no source suggestion as confirmed source
- no counter-source as disproof
- no lived-experience as representative evidence
- no trust/source-quality as verification
- no volume as truth
- no graph write
- no merge
- no dossier/anlassraum/participation creation
- no hidden DeepSearch/cost path
- no internal review/audit/abuse/trust leak to public

## Tests / Build

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-workbench.test.ts tests/community-source-review-workbench-ui.test.tsx tests/community-source-review-public-submission-api.test.ts tests/community-source-review-public-submission-hardening.test.ts tests/community-source-review-moderation-ui.test.tsx tests/community-source-review-abuse-spam-ui.test.tsx tests/community-source-review-trust-source-quality-ui.test.tsx tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`
- `git diff --check`

## Offene Folgepfade

- `PUBLIC-MODERATION-OPERATIONS-07`
- größere Team-/SLA-/Queue-Operations
- keine Dossier-/Anlassraum-Publish-Arbeit in diesem Slice
- kein Production Deployment Contract in diesem Slice
