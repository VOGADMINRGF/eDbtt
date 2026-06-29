# TOPIC-GRAPH-RUNTIME-05

Datum: `2026-06-29`
Branch: `pr/topic-graph-runtime-review-approved`

## Ziel

Nach den review-first Slices fuer Existing Topic Matches, Dialog Intelligence und Topic Deduplication einen echten, aber strikt freigabepflichtigen Topic-Graph-Runtime-Vertrag schaffen.

## Vorgefundene Struktur

- Review-first Dedup-Kandidaten existierten bereits in `apps/web/src/features/create/topicDeduplicationReview.ts`.
- Existing Topic Matches waren bereits kontrolliert aus `/api/create/context` und `/api/topics` verdrahtet.
- Bestehende Admin-/Review-Semantik fuer Graph-Kandidaten existierte bereits ueber `features/graphMergeCandidates.ts` und `/admin/review`.
- Reale Graph-Persistenz war bereits im Repo vorhanden:
  - Neo4j-Driver in `core/graph/driver.ts`
  - produktive Graph-Writes in bestehenden Admin-/Graph-Repair-Pfaden
- Was fehlte:
  - topic-spezifischer Graph-Edge-Contract fuer Dedup-/Branch-Kandidaten
  - explizite `approved_for_graph_write`-Semantik fuer diesen Pfad
  - persistenter Draft-/Audit-Store fuer Topic-Graph-Mutationen

## Umsetzung

- Neues Contract-Modul `apps/web/src/features/create/topicGraphRuntime.ts`
  - `TopicGraphNodeRef`
  - `TopicGraphEdge`
  - `TopicGraphEdgeKind`
  - `TopicGraphMutationStatus`
  - `TopicGraphMutationBlocker`
  - `buildTopicGraphEdgeDraft(...)`
  - `mapDeduplicationCandidateToGraphEdgeDraft(...)`
  - `canWriteTopicGraphEdge(...)`
  - `getTopicGraphMutationBlockers(...)`
  - `writeTopicGraphEdgeAfterReview(...)`
  - `summarizeTopicGraphMutationState(...)`
  - `blocksUnsafeTopicGraphMutation(...)`
- Neues Server-Modul `apps/web/src/features/create/topicGraphRuntimeServer.ts`
  - persistenter Draft-/Audit-Store mit In-Memory-Fallback
  - echter Neo4j-Write-Wrapper fuer reviewte Topic-Graph-Kanten
- `CreateVisualFollowup.tsx` zeigt jetzt zusaetzlich ehrliche Graph-Vorbereitungs-Copy, ohne selbst Graph-Writes auszulösen.
- `topicDeduplicationReview.ts` fuehrt `relatedMatchTitle`, damit Graph-Targets sauber und ohne UI-Parsing referenziert werden.

## Guardrails

- Kein Auto-Graph-Write
- Kein Auto-Merge
- Kein Auto-Publish
- Kein Auto-Delete
- Keine automatische Dossier-, Anlassraum- oder Beteiligungsraum-Erstellung
- `approved_for_merge` reicht nicht
- Nur explizites `approved_for_graph_write` erlaubt einen Write-Versuch
- KI-Aehnlichkeit, Community-Hinweise, Trust- oder Volumensignale erzeugen nur Drafts/Hinweise, nie selbst einen Graph-Write
- `source_review_pending` blockiert den finalen Graph-Write
- `moderation_pending` blockiert die oeffentliche Sichtbarkeit
- Audit-Kontext ist fuer jeden Graph-Write zwingend
- Fehlende Runtime oder fehlende Source-/Target-Knoten liefern ehrliche Blocker statt Fake-Erfolg

## Mappings

- `possible_duplicate` -> `duplicate_of`
- `possible_same_topic` -> `same_topic_as`
- `possible_same_branch` -> `branch_of`
- `possible_followup_branch` -> `follows_from`

## Validierung

Ausgefuehrt:

```bash
git status --short
git branch --show-current
git log --oneline -12
pnpm -C apps/web run typecheck
pnpm -C apps/web exec vitest run tests/topic-graph-runtime.test.ts tests/topic-deduplication-review.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts tests/create-existing-topic-matches-runtime-bridge.test.ts tests/dialog-intelligence-runtime-bridge.test.ts tests/community-source-review-moderation.test.ts
pnpm -C apps/web run lint
pnpm -C apps/web run build
```

Erwartete/erreichte Kernbelege:

- `pr/topic-graph-runtime-review-approved` war aktiv.
- `main` enthielt die Vorarbeiten aus `#256` und `#257`.
- Topic-Graph-Drafts bleiben review-first.
- Ein Write ist nur mit expliziter Graph-Freigabe und Audit-Kontext moeglich.
- Runtime-Ausfall, fehlende Knoten, offene Quellenpruefung und Moderation werden ehrlich blockiert.

## Offener Folgepfad

- `TOPIC-GRAPH-ADMIN-APPROVAL-UI-06`
  - Der Runtime-/Persistenz-/Write-Contract ist vorhanden.
  - Der explizite Bedienpfad ueber bestehende Admin-/Review-Flaechen fehlt noch.
