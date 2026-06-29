# COMMUNITY-SOURCE-REVIEW-MODERATION-UI-03

Datum: 2026-06-29

## Ziel

Die bestehenden `Community Source Review Contributions` und die typed Moderations-/Abuse-/Trust-Guardrails nach `#252` und `#254` minimal und sicher in die bestehende `/admin/review`-Workbench heben, ohne neue Admin-Welt, ohne Public-Community-Formular und ohne Community-Wahrheitslogik.

## Ausgangslage nach #259

- `communitySourceReviewContribution.ts` modelliert bereits review-first Contribution-Typen:
  - `source_suggestion`
  - `counter_source`
  - `context_note`
  - `lived_experience`
  - `unclear_claim`
  - `wording_clarification`
  - `escalation_request`
- `communitySourceReviewModeration.ts` modelliert bereits typed Moderationsstatus, Abuse Reasons, Trust Levels und Risk Levels.
- `CreateHandoffDraftSummary.tsx` erklärt Community-Hinweise im Quellenprüfungs-Kontext bereits als prüfpflichtige Hinweise.
- Die bestehende `/admin/review`-Workbench wurde nach `#259` bereits für Topic-Graph-Approval erweitert.
- Öffentliche Runtime-Submission für diese Source-Review-Hinweise war weiterhin bewusst `blocked_unwired`.

## Genutzte bestehende Strukturen

- Bestehende `/admin/review`-Workbench als einzige Admin-/Operator-Fläche.
- Bestehende Create-/Source-Review-Contracts:
  - `communitySourceReviewContribution.ts`
  - `communitySourceReviewModeration.ts`
  - `createHandoffReviewQueue.ts`
- Bestehendes Review-first Action-Muster der Admin-Workbench.
- Bestehendes persistentes/in-memory Fallback-Muster analog anderer Admin-Slices für Records plus Audit.

## Implementierung

### UI

- Neue Sektion im bestehenden `/admin/review`:
  - `Community-Hinweise moderieren`
- Pro Hinweis sichtbar:
  - Art inklusive Raw-Type
  - Kurztext / Titel / Summary
  - Bezug auf Claim / Quellenprüfung / Quellenfrage / Review-Item
  - Moderationsstatus
  - Risk-/Abuse-Hinweise
  - Trust-Level nur als Review-Hinweis
  - Blocker
  - Audit-Hinweis
  - nächster interner Review-Pfad

### Actions / Server-Pfade

- Neuer separater interner Store:
  - `communitySourceReviewServer.ts`
- Neue Admin-Route:
  - `/api/admin/community-source-review/[contributionId]`
- Explizite Actions:
  - `allowAsHint`
  - `hideHint`
  - `rejectHint`
  - `escalateHint`
  - `markNeedsSourceReview`
  - `markNeedsEditorialReview`

### Moderationssemantik

- `allowAsHint` setzt nur einen expliziten Review-Hinweisstatus.
- `allowAsHint` setzt ausdrücklich **nicht** `accepted_as_fact`.
- `hideHint` blendet den Hinweis aus und verhindert Nutzung als Review-Hinweis oder Evidenz.
- `rejectHint` weist den Hinweis zurück und verhindert Nutzung als Review-Hinweis oder Evidenz.
- `escalateHint` priorisiert Review und Audit, verifiziert aber nichts.
- `markNeedsSourceReview` markiert nur den internen Folgepfad `Quellenprüfung`.
- `markNeedsEditorialReview` markiert nur den internen Folgepfad `redaktionelle Prüfung`.
- Keine dieser Actions erzeugt Fact-Verifikation, Publish, Graph-Write, Merge oder Runtime-Entität.

## Risk / Abuse / Trust / Blocker

- Risk Level und Abuse Reasons werden pro Hinweis sichtbar gerendert.
- Trust Level wird sichtbar gerendert, aber nur als Priorisierungssignal.
- Blocker werden aus den bestehenden Contribution-/Moderation-Guardrails plus Admin-Status (`hidden`, `rejected`) abgeleitet.
- Öffentliche Runtime-Submission bleibt trotz interner Moderationsoberfläche bewusst `blocked_unwired`.

## Guardrails

- no community majority as truth
- no trust as truth
- no source suggestion as verified source
- no counter source as automatic disproof
- no lived experience as representative evidence
- no auto publish
- no auto graph
- no auto merge
- no entity creation
- no accepted_as_fact from community moderation

## Warum keine Community-Wahrheit

- Community-Hinweise bleiben Review-Signale.
- Viele Hinweise werden explizit nicht als Wahrheit oder repräsentative Evidenz gelesen.
- Trust priorisiert Prüfung, ersetzt aber keine Prüfung.
- Quellenvorschläge und Gegenquellen bleiben prüfpflichtig und bestätigen oder widerlegen nichts automatisch.

## Warum kein Auto-Publish / Auto-Graph / Auto-Merge

- Die neue Oberfläche arbeitet nur mit expliziten Admin-Entscheidungen plus Audit.
- Es gibt keinen stillen Übergang in Publish-, Graph-, Merge- oder Entity-Pfade.
- Source-/Editorial-Routing ist nur ein interner Folgepfadmarker, kein Downstream-Job mit impliziter Wahrheit.

## Geänderte Dateien

- `apps/web/src/features/create/communitySourceReviewContribution.ts`
- `apps/web/src/features/create/communitySourceReviewModeration.ts`
- `apps/web/src/features/create/communitySourceReviewServer.ts`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/admin/review/AdminCommunitySourceReviewSection.tsx`
- `apps/web/src/app/admin/review/CommunitySourceReviewModerationActions.tsx`
- `apps/web/src/app/admin/review/loadAdminCommunitySourceReviewSectionProps.ts`
- `apps/web/src/app/api/admin/community-source-review/[contributionId]/route.ts`
- `apps/web/tests/community-source-review-moderation-ui.test.tsx`
- `apps/web/tests/community-source-review-moderation.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-moderation-ui.test.tsx tests/community-source-review-contribution.test.ts tests/community-source-review-moderation.test.ts tests/admin-review.page.test.tsx tests/create-handoff-review-queue-runtime-bridge.test.ts tests/topic-graph-admin-approval-ui.test.tsx`
- `pnpm -C apps/web run build`

## Offene Folgepfade

- `COMMUNITY-SOURCE-REVIEW-ABUSE-SPAM-04`
- `COMMUNITY-SOURCE-REVIEW-TRUST-SOURCE-QUALITY-05`
- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
- sichere öffentliche Runtime-Submission für Community-Source-Review-Hinweise
- keine automatische Topic-Deduplication
- kein Auto-Graph / Auto-Merge
- keine Dossier-/Anlassraum-/Participation-Space-Erstellung
