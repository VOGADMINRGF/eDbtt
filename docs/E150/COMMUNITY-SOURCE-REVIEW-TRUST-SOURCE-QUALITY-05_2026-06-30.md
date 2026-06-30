# COMMUNITY-SOURCE-REVIEW-TRUST-SOURCE-QUALITY-05

Stand: 2026-06-30
Repo: `edebatte-org`
Bezug: Stand nach `#261`

## Ausgangslage nach #261

Nach `#260` und `#261` existieren bereits:

- ein bestehender `communitySourceReviewServer.ts`-Store
- eine persistente Audit-Spur für Community-Hinweise
- die vorhandene Admin-Review-Workbench in `/admin/review`
- typed Abuse-/Spam-/Duplicate-/Volume-Signale mit Severity, Disposition und Blockern
- bestehende Moderationsaktionen für `allow/hide/reject/escalate` sowie Abuse-Risiko-Markierung

Was noch fehlte, war eine eigene Trust-/Source-Quality-Ebene zur Review-Priorisierung und Einordnung, ohne daraus Wahrheit, Verifikation oder Veröffentlichung abzuleiten.

## Vorhandene Community-/Moderation-/Server-Strukturen

Weiterverwendet wurden bewusst nur bestehende Pfade:

- `apps/web/src/features/create/communitySourceReviewContribution.ts`
- `apps/web/src/features/create/communitySourceReviewModeration.ts`
- `apps/web/src/features/create/communitySourceReviewServer.ts`
- `apps/web/src/app/admin/review/AdminCommunitySourceReviewSection.tsx`
- `apps/web/src/app/admin/review/CommunitySourceReviewModerationActions.tsx`
- `apps/web/src/app/api/admin/community-source-review/[contributionId]/route.ts`

Keine neue Admin-Welt, keine neue Public-Surface, kein neues Designsystem und keine externe Daten- oder Reputationsanbindung wurden eingeführt.

## Neue Trust-Signale

Neu modelliert:

- `prior_allowed_hint`
- `prior_rejected_hint`
- `prior_abuse_signal`
- `prior_source_review_routed`
- `prior_editorial_review_routed`
- `contributor_context_available`
- `contributor_context_missing`
- `repeated_quality_contribution`
- `repeated_low_quality_contribution`

Trust-Level:

- `unknown`
- `low`
- `medium`
- `high`
- `restricted`

Die Ableitung bleibt bewusst review-first:

- Contributor-Historie priorisiert höchstens Review
- frühere Abuse-/Reject-Signale können Trust einschränken
- wiederholte qualitätsarme Hinweise erzeugen keine Glaubwürdigkeitsautomatik
- hoher Trust bedeutet nie `accepted_as_fact`

## Neue Source-Quality-Signale

Neu modelliert:

- `source_url_present`
- `source_url_missing`
- `source_domain_review_needed`
- `primary_source_claimed`
- `secondary_source_claimed`
- `document_type_provided`
- `document_type_missing`
- `date_provided`
- `date_missing`
- `author_or_publisher_provided`
- `author_or_publisher_missing`
- `quote_or_excerpt_provided`
- `quote_or_excerpt_missing`
- `context_provided`
- `context_missing`
- `unverifiable_reference`
- `suspicious_source_quality`
- `strong_review_candidate`
- `weak_review_candidate`

Source-Quality-Level:

- `unknown`
- `weak`
- `usable_for_review`
- `strong_review_candidate`
- `restricted`

Die Ableitung nutzt nur vorhandene lokale Hinweisdaten wie URL, Text, Claim-Kontext, Notes und Materialhinweise.

Es gibt:

- keine externe Domain-Reputation
- keine Web-Abfrage
- keine Quellenverifikation
- keine automatische Primärquellenbestätigung

## Level und Review-Priorisierung

Neu ergänzt:

- `canPrioritizeCommunityHintForReview(...)`
- `getCommunityHintTrustQualityBlockers(...)`
- `blocksTrustAsTruth(...)`
- `blocksSourceQualityAsVerification(...)`

Review-Priorisierung wird nur intern genutzt:

- starke Review-Kandidaten oder hoher Trust können `prioritized` auslösen
- eingeschränkter Trust oder eingeschränkte Quellenqualität blockieren Nutzung bis zur Prüfung
- Priorisierung erzeugt keine Wahrheit, keine Freigabe und keine Verifikation

## Persistenz und Audit

Trust- und Source-Quality-Signale werden im bestehenden Moderationsrecord mitgespeichert.

Audit-Trail erweitert um:

- `trust_signal_derived`
- `source_quality_signal_derived`
- `review_priority_changed`
- `source_quality_reviewed`
- `trust_quality_reviewed`

Zusätzliche Audit-Felder spiegeln:

- Trust-Signal-Kinds
- Trust-Level
- Source-Quality-Signal-Kinds
- Source-Quality-Level
- Review-Priorität

Damit bleibt die Einordnung nachvollziehbar, ohne neue personenbezogene Reputationstabelle zu bauen.

## Admin UI Ergänzung

Die bestehende `AdminCommunitySourceReviewSection.tsx` zeigt jetzt zusätzlich:

- Trust-Level
- Trust-Signale
- Source-Quality-Level
- Source-Quality-Signale
- Review-Priorität
- Trust-/Quality-Blocker
- zugehörige Guardrail-Copy
- Trust-/Quality-Audit-Einträge

Die bestehende `CommunitySourceReviewModerationActions.tsx` wurde minimal ergänzt um:

- `markSourceQualityReviewed`
- `markTrustQualityReviewed`
- `setReviewPriorityFromTrustQuality`
- `clearTrustQualitySignals`

Diese Actions setzen weder Wahrheit noch Quellenverifikation.

## Grenzen

Bewusst nicht gebaut:

- keine personenbezogene Reputationstabelle
- keine Surveillance- oder Fingerprinting-Logik
- keine externe Domain-Reputation
- keine Web- oder Quellenabfrage
- keine automatische Quellenverifikation
- keine automatische Wahrheit
- keine Mehrheitswahrheit
- kein öffentliches Community-Formular
- keine vollständige Community-Workbench

## Warum keine Trust-Wahrheit

Trust bleibt nur eine Review-Hilfe, weil:

- Contributor-Historie politisch und fachlich kein Wahrheitsbeweis ist
- frühere gute Hinweise keine aktuelle Richtigkeit garantieren
- frühere schlechte Hinweise keine automatische Sanktion rechtfertigen
- hoher Trust sonst still als Autoritätsautomatismus missverstanden würde

## Warum keine Quellenverifikation

Source Quality bleibt nur eine Einordnungshilfe, weil:

- `strong_review_candidate` nur bessere Prüfunterlagen bedeutet
- `primary_source_claimed` nur eine Behauptung über die Quelle ist
- URL, Datum, Dokumenttyp oder Quote keine Echtheit oder Belastbarkeit garantieren
- Verifikation weiter in menschliche Source Review oder Redaktion gehört

## Guardrails

Explizit beibehalten:

- no trust as truth
- no source quality as verification
- no primary source claim as verified primary source
- no contributor history as credibility proof
- no high trust as accepted_as_fact
- no restricted trust as automatic punishment
- no auto publish
- no auto graph
- no auto merge
- no entity creation
- no accepted_as_fact
- no external reputation lookup
- no surveillance/fingerprinting invention

## Tests / Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-trust-source-quality.test.ts tests/community-source-review-trust-source-quality-ui.test.tsx tests/community-source-review-abuse-spam.test.ts tests/community-source-review-abuse-spam-ui.test.tsx tests/community-source-review-moderation-ui.test.tsx tests/community-source-review-moderation.test.ts tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`

## Offene Folgepfade

Offen bleiben bewusst:

- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
- `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05`
- personenbezogene Reputation bleibt nicht gewollt
- externe Quellen- oder Domain-Verifikation bleibt nicht vorhanden und nicht gewollt
- vollständige öffentliche Community-Submission-Härtung bleibt separat
- Auto-Publish, Auto-Graph und Auto-Merge bleiben ausgeschlossen

## Ergebnis

Community Source Review kann jetzt im bestehenden Moderationspfad nicht nur Abuse-/Spam-Signale, sondern auch Trust- und Source-Quality-Signale mit Level, Review-Priorität, Blockern und Audit nachvollziehbar lesen.

Die Grenze bleibt bewusst hart:

- Trust ist keine Wahrheit
- Quellenqualität ist keine Verifikation
- starke Review-Kandidaten bleiben prüfpflichtig
- Contributor-Historie bleibt Einordnungshilfe
- alles bleibt review-first
