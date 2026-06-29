# TOPIC-DEDUPLICATION-REVIEW-QUEUE-01

Stand: 2026-06-29
Repo: `edebatte-org`
Task: `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01`

## Ausgangslage nach #255

`main` enthält bereits:

- `#249` Create-/Dialog-Handoff -> Review Queue Runtime
- `#250` Existing Topic Matches -> Runtime/Readmodels
- `#251` Factcheck Requests -> Source Review Pipeline
- `#252` Community Source Review Contributions
- `#253` SSOT-/Readiness-Abgleich nach Source Review Community Flow
- `#254` typed Moderation-/Abuse-/Trust-Guardrails
- `#255` Dialog Intelligence Runtime AI

Damit war der sichtbare Produktpfad bereits klein, aber konsistent:

Beitrag erfassen
-> Runtime-KI-Auswertung
-> Standpunkt / Motivation / Rückfragen / Perspektiven
-> vorhandene Anschlüsse finden
-> Handoff-Draft vorbereiten
-> Review Queue
-> Quellenprüfung
-> Community-Hinweise
-> Moderation / Abuse / Trust Guardrails

Was noch fehlte, war eine kleine review-first Schicht für mögliche Themen-Dubletten, ähnliche Zweige und Meinungscluster-Überschneidungen.

## Bestand vor dem Slice

Bereits vorhanden und wiederverwendet:

- `apps/web/src/features/create/existingTopicMatches.ts`
- `apps/web/src/features/create/existingTopicMatchesRuntimeBridge.ts`
- `apps/web/src/features/create/ExistingTopicMatchesPanel.tsx`
- `apps/web/src/features/create/dialogIntelligenceRuntimeBridge.ts`
- `apps/web/src/features/create/createHandoffDrafts.ts`
- `apps/web/src/features/create/createHandoffReviewQueue.ts`
- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `features/reviewQueue.ts`
- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- `apps/web/src/app/admin/review/page.tsx`

Einordnung vor der Ergänzung:

- Existing Topic Matches waren bereits typed, sichtbar und runtime-/readmodel-wired.
- Dialog Intelligence war bereits ehrlich zwischen `runtime_ai`, `runtime_readmodel`, `preview` und `blocked_unwired` unterscheidbar.
- Handoff-Drafts und die bestehende `editorial_review`-/`create_handoff`-Semantik waren bereits review-first nutzbar.
- Die Admin-Review-Welt existierte bereits; es musste keine zweite Queue oder neue Admin-Oberfläche gebaut werden.
- Eine Topic-Graph-Runtime oder automatische Deduplication existierte bewusst nicht.

## Neu ergänzt

Neu eingeführt wurde:

- `apps/web/src/features/create/topicDeduplicationReview.ts`

Das Modul ergänzt nur einen kleinen typed Review-Layer über den vorhandenen Match-, Dialog- und Handoff-Strukturen.

Zusätzlich wurde `CreateVisualFollowup.tsx` minimal erweitert:

- sichtbarer Hinweisblock bei relevanter Dubletten- oder Anschlussnähe
- keine neue Surface
- keine CTA-Orgie
- keine neue Admin-Welt

## Candidate Types

Unterstützt werden:

- `possible_duplicate`
- `possible_same_topic`
- `possible_same_branch`
- `possible_opinion_cluster_overlap`
- `possible_followup_branch`
- `possible_split_needed`

Quellen für diese Kandidaten:

- Existing Topic Matches
- Dialog-Intelligence-Signale

`possible_split_needed` bleibt ausdrücklich ein redaktioneller Prüfhinweis, kein automatischer Split.

## Statusmodell

Unterstützte Review-Status:

- `draft`
- `queued_for_review`
- `needs_editorial_review`
- `approved_for_merge`
- `rejected`
- `split_required`
- `blocked`

Wichtig:

- `approved_for_merge` ist nur ein Review-Status.
- `approved_for_merge` ist keine Runtime-Zusammenführung.
- `approved_for_merge` ist keine Graph-Mutation.

## Blocker

Unterstützte Blocker:

- `insufficient_similarity`
- `missing_runtime_match`
- `source_review_pending`
- `moderation_pending`
- `community_hint_unreviewed`
- `graph_runtime_unavailable`
- `unsafe_auto_merge`

Semantik:

- `graph_runtime_unavailable` blockiert keinen Kandidatenbau.
- `graph_runtime_unavailable` blockiert nur eine spätere finale Graph-Zusammenführung.
- `source_review_pending`, `moderation_pending` und `community_hint_unreviewed` können Finalisierung oder Sichtbarkeit blockieren, nicht aber die review-first Vormerkung selbst.

## Review Queue Semantik

Die Dedup-Kandidaten nutzen bewusst keine zweite Queue-Art.

Stattdessen werden sie auf dieselbe bestehende Semantik gemappt:

- Handoff-Draft-Ziel: `editorial_review`
- Queue-Kind: `editorial_review`
- Persistenz-/Runtime-Pfad: derselbe vorhandene `create_handoff`-/`/api/create/handoffs`-Pfad

Damit bleibt die Aussage ehrlich:

- mögliche Zusammenführung prüfen
- ähnliche Beiträge vorhanden
- möglicher Themen-Duplikat-Kandidat

Aber weiterhin nicht:

- automatisch mergen
- automatisch graphen
- automatisch löschen
- automatisch repräsentieren

## Warum kein Auto-Merge

Dieser Slice trennt bewusst:

- Ähnlichkeit
- redaktionelle Prüfung
- finale Zusammenführung

Explizite Guardrails:

- no auto merge
- no auto graph merge
- no auto publish
- no auto delete
- no majority as truth
- no AI as final merge authority
- no community hint as final evidence
- no final graph mutation

Zusätzlich gilt:

- Community-Hinweise können Dedup-Prüfung unterstützen, aber nicht erzwingen.
- Trust oder Volumen können Dedup-Prüfung priorisieren, aber nicht erzwingen.
- KI-Ähnlichkeit kann Kandidaten vorschlagen, aber keine finale Gleichheit behaupten.

## Warum kein Graph Runtime Merge

Der Slice baut absichtlich keine neue Graph-Runtime.

Offen bleiben:

- finale Topic-Graph-Zusammenführung
- automatische Topic-/Dossier-/Anlassraum-/Participation-Space-Erstellung
- automatische Deduplication
- automatische Entity-Erzeugung

Die neue Schicht endet deshalb bewusst vor jeder finalen Graph-Mutation.

## UI-Ergänzung

Der sichtbare Hinweisblock in `CreateVisualFollowup.tsx` bleibt minimal:

- `Mögliche Dopplung erkannt`
- `Ähnliche Beiträge können redaktionell zusammengeführt oder getrennt gehalten werden.`
- `Es wurde noch nichts automatisch zusammengeführt.`

Die Aktion bleibt klein und review-first:

- `Mögliche Zusammenführung prüfen`

## Tests und Build

Neu oder angepasst:

- `apps/web/tests/topic-deduplication-review.test.ts`
- `apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts`

Zusätzlich revalidiert:

- `apps/web/tests/create-existing-topic-matches-runtime-bridge.test.ts`
- `apps/web/tests/existing-topic-matches-panel.test.tsx`
- `apps/web/tests/dialog-intelligence-runtime-bridge.test.ts`
- `apps/web/tests/community-source-review-moderation.test.ts`

Gelaufene Checks:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/topic-deduplication-review.test.ts tests/create-existing-topic-matches-runtime-bridge.test.ts tests/existing-topic-matches-panel.test.tsx tests/dialog-intelligence-runtime-bridge.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts tests/community-source-review-moderation.test.ts`
- `pnpm -C apps/web run build`

Ergebnis:

- Typecheck grün
- Lint grün
- Vitest grün (`6` Dateien, `34` Tests)
- Web-Build grün

## Offene Folgepfade

Bewusst offen bleiben:

- `TOPIC-GRAPH-RUNTIME-05`
- automatische Topic-Deduplication
- finale Graph-Merge-Runtime
- automatische Topic-/Dossier-/Anlassraum-/Participation-Space-Erstellung
- `COMMUNITY-SOURCE-REVIEW-MODERATION-UI-03`
- `COMMUNITY-SOURCE-REVIEW-ABUSE-SPAM-04`
- `COMMUNITY-SOURCE-REVIEW-TRUST-SOURCE-QUALITY-05`
- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`

## Ergebnis

Der Slice ergänzt eine kleine review-first Topic-Deduplication-Schicht auf Basis bereits vorhandener Runtime-, Readmodel- und Review-Queue-Strukturen.

Neu ist damit nicht eine automatische Zusammenführung, sondern nur ein sauber typisierter redaktioneller Prüfgegenstand für mögliche Dubletten, ähnliche Zweige und Meinungscluster-Überschneidungen.
