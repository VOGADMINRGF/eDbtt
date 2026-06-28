# SSOT Reconciliation after Review Queue Handoff

Datum: 2026-06-28
Repo: `edebatte-org`
Bezug: Stand nach den gemergten PRs `#240` bis `#246`

## Ausgangspunkt nach #246

`main` enthaelt jetzt:

- `#240` Dialog Intelligence Result Contract
- `#241` Dialog Results Handoff Panel
- `#242` Dialog Results Wording Refinement
- `#244` Existing Topic Matches Visible
- `#245` Review-first Handoff Drafts
- `#246` Handoff Drafts queued for review

Damit ist der kleine sichtbare Create-Pfad konsistent:

Beitrag erfassen
-> Standpunkt erkennen
-> Meinung zählen oder ausarbeiten
-> ähnliche Themen/Zweige zeigen
-> Handoff-Draft vorbereiten
-> zur Prüfung vormerken

## Was jetzt umgesetzt ist

Vorhanden und bewusst dokumentiert:

- Dialog-Outcome-Contract
- sichtbares Dialog-Ergebnispanel
- verfeinerte Ergebnis-/Handoff-Copy
- sichtbare Existing-Topic-/Branch-/Opinion-/Dossier-/Participation-Matches
- lokale review-first Handoff-Drafts
- lokale Review-Queue-Items mit Status, offenen Fragen und Audit-Trail

## Was nur Contract / UI / local state ist

Die letzten Slices `#240` bis `#246` sind fuer diesen Pfad bewusst nur:

- contract-ready
- UI-visible / panel-ready
- product-copy refined
- local draft-ready
- local queue-item-ready

Insbesondere bleiben Handoff-Drafts und Review-Queue-Items im Create-Follow-up
lokaler Zustand und keine produktive Runtime-Wahrheit.

## Was bewusst nicht runtime- oder backend-ready ist

Nicht fertig und weiter offen:

- echte Dialog-/Perspective-/Result-AI-Runtime
- echte Review-Queue-Backend-Persistenz fuer diese lokalen Create-Items
- echte Review-Queue-Admin-Workbench fuer diese Create-Items
- echte Dossier-Erstellung aus dem neuen lokalen Queue-Pfad
- echte Anlassraum-Erstellung aus dem neuen lokalen Queue-Pfad
- echte Beteiligungsraum-Erstellung aus dem neuen lokalen Queue-Pfad
- echte Existing-Topic-Match-Runtime statt Preview-Panel
- echter Topic-Graph
- echte Deduplication-Review-Runtime
- echte Source-Adapter-/Factcheck-Integration mit externen Quellen
- DeepSearch-/Kostenpfad
- User-Memory-/Preference-Runtime

## Bereinigte OpenTasks

Als erledigt und weiter so im SSOT:

- `DIALOG-INTELLIGENCE-RESULTS-01`
- `DIALOG-RESULTS-HANDOFF-UI-02`
- `CREATE-EXISTING-TOPIC-MATCHES-VISIBLE-03`
- `DOSSIER-ANLASSRAUM-RUNTIME-HANDOFF-03`
- `REVIEW-QUEUE-HANDOFF-PERSISTENCE-04`

Klar offen und getrennt:

- `REVIEW-QUEUE-BACKEND-PERSISTENCE-05`
- `REVIEW-QUEUE-ADMIN-WORKBENCH-05`
- `DOSSIER-RUNTIME-CREATION-04`
- `ANLASSRAUM-RUNTIME-CREATION-04`
- `PARTICIPATION-SPACE-RUNTIME-CREATION-04`
- `CREATE-EXISTING-TOPIC-MATCHES-RUNTIME-BRIDGE-04`
- `TOPIC-GRAPH-RUNTIME-05`
- `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01`
- `FACTCHECK-SOURCE-ADAPTER-INTEGRATION-01`
- `DIALOG-INTELLIGENCE-RUNTIME-AI-02`
- `USER-PREFERENCE-MEMORY-ENTITLEMENT-01`
- `PERSPECTIVE-ENGINE-REVIEW-GATES-01`

## Guardrails

- no auto-publish
- no auto-create dossier/anlassraum/participation space
- no auto-merge
- no fake graph
- no fake full search
- no DeepSearch/cost path
- no source adapter runtime yet

## Validierung

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Kein Build-Lauf notwendig, weil dieser Slice nur Docs/SSOT bereinigt.
