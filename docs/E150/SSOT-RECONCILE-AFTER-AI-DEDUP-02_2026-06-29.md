# SSOT Reconciliation after Runtime AI and Dedup Review

Stand: 2026-06-29
Repo: `edebatte-org`
Task: `SSOT-RECONCILE-AFTER-AI-DEDUP-02`

## 1. Ausgangslage nach #256

`main` enthält nach den gemergten PRs `#255` und `#256` zusätzlich zu den vorangehenden Review-/Source-Slices:

- `#249` Create-/Dialog-Handoff -> Review Queue Runtime
- `#250` Existing Topic Matches -> Runtime/Readmodels
- `#251` Factcheck Requests -> Source Review
- `#252` Community Source Review Contributions
- `#253` SSOT after Source Review Community
- `#254` Community Moderation / Abuse / Trust Guardrails
- `#255` Runtime Dialog Intelligence über den vorhandenen Create-Planner-Pfad
- `#256` review-first Topic-Deduplication-Kandidaten

Damit muss die SSOT-Lesart jetzt sauber trennen zwischen:

- sichtbarem Flow
- realem Runtime Wiring
- review-first Contract-Semantik
- vollständiger Production Readiness

## 2. Kanonischer Produktpfad

Der belegte rote Faden lautet jetzt:

Beitrag erfassen
-> Runtime-KI-Auswertung
-> Standpunkt / Motivation / Rückfragen / Perspektiven
-> vorhandene Anschlüsse finden
-> mögliche Duplikate / Cluster erkennen
-> Handoff-Draft vorbereiten
-> Review Queue
-> Quellenprüfung
-> Community-Hinweise
-> Moderation / Abuse / Trust Guardrails
-> Mensch entscheidet Merge / Prüfung / Weiterführung

Wichtig:

- Dieser Pfad ist als sichtbarer Produktfluss weitgehend geschlossen.
- Er ist nicht gleichbedeutend mit fertiger Graph-Runtime.
- Er ist nicht gleichbedeutend mit automatischer Wahrheit, automatischer Quellenprüfung oder automatischer Zusammenführung.

## 3. Was mit #255 real verdrahtet wurde

Real verdrahtet wurde kein neuer AI-Stack, sondern eine sichere Bridge auf vorhandene Runtime:

- `apps/web/src/features/create/dialogIntelligenceRuntimeBridge.ts`
- bestehender Adapterpfad aus `apps/web/src/features/create/createPlanner.ts`

Belegte Aussagen:

- `runtime_ai` wird nur gesetzt, wenn der vorhandene Create-Planner wirklich produktiv über den OpenAI-Pfad gelaufen ist.
- heuristische oder degradierte Fälle fallen ehrlich auf `preview` zurück.
- fehlende sichere Runtime-Metadaten bleiben `blocked_unwired`.
- das Ergebnis wird weiter auf denselben bestehenden Dialog-Contract gemappt.
- `reviewed` wird bewusst zu `needs_source` heruntergestuft.
- `factcheck_request` bleibt review-first und request-wired.

Nicht damit erledigt:

- keine Wahrheit
- keine verifizierten Fakten
- keine verifizierten Quellen
- kein automatischer Factcheck
- kein DeepSearch
- kein Auto-Publish
- kein Auto-Graph
- kein Auto-Dossier

## 4. Was mit #256 real verdrahtet wurde

Real verdrahtet wurde keine Merge-Runtime, sondern eine kleine review-first Dedup-Schicht:

- `apps/web/src/features/create/topicDeduplicationReview.ts`
- minimale Ergänzung im bestehenden `CreateVisualFollowup.tsx`

Belegte Aussagen:

- Existing Topic Matches und Dialog-Intelligence-Signale können Dedup-Kandidaten erzeugen.
- unterstützt werden `possible_duplicate`, `possible_same_topic`, `possible_same_branch`, `possible_opinion_cluster_overlap`, `possible_followup_branch` und `possible_split_needed`.
- Kandidaten werden auf die bestehende `editorial_review`-/`create_handoff`-Semantik gemappt.
- die Review Queue bleibt dieselbe bestehende Queue.
- `approved_for_merge` bleibt ein Review-Status, keine Runtime-Zusammenführung.

Nicht damit erledigt:

- keine automatische Deduplication
- kein finaler Graph Merge
- keine finale Zusammenführung
- keine automatische Entity-Erzeugung

## 5. Was weiterhin nur Contract/Preview/blocked-unwired/offen ist

Weiterhin offen oder bewusst begrenzt:

- `TOPIC-GRAPH-RUNTIME-05`
- `DOSSIER-RUNTIME-CREATION-04`
- `ANLASSRAUM-RUNTIME-CREATION-04`
- `PARTICIPATION-SPACE-RUNTIME-CREATION-04`
- `COMMUNITY-SOURCE-REVIEW-MODERATION-UI-03`
- `COMMUNITY-SOURCE-REVIEW-ABUSE-SPAM-04`
- `COMMUNITY-SOURCE-REVIEW-TRUST-SOURCE-QUALITY-05`
- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
- automatische Topic-Deduplication
- finale Graph-Merge-Runtime
- echte externe Source-Adapter oder DeepSearch-Kostenpfade

Zusätzliche Klarstellungen:

- Existing Topic Matches sind runtime-/readmodel-wired, aber mit ehrlichem `preview`-/`hybrid`-Fallback.
- Source Review ist request-wired, nicht auto-verified.
- Community Source Review Contribution bleibt contract-/review-first-ready, nicht voll production-moderated.
- Community Moderation Guardrails sind contract-ready beziehungsweise pilot-ready, nicht full production moderation.

## 6. Guardrails

Verbindlich bleiben:

- no fake AI
- no fake facts
- no fake sources
- no automatic verification
- no majority as truth
- no auto-publish
- no auto-merge
- no auto-create dossier/anlassraum/participation space
- no fake graph
- no final graph mutation
- no hidden DeepSearch/cost path
- community contributions are hints, not truth
- AI similarity is review input, not merge authority

## 7. OpenTasks-Korrekturen

In `OpenTasks.md` sind jetzt konsistent als done bestätigt:

- `DIALOG-INTELLIGENCE-RUNTIME-AI-02`
- `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01`

Ehrliche Lesart dazu:

- `DIALOG-INTELLIGENCE-RUNTIME-AI-02` done bedeutet sichere Bridge des vorhandenen Create-Planner-/OpenAI-Pfads auf den bestehenden Dialog-Contract.
- `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01` done bedeutet review-first Dedup-Kandidaten plus Queue-Semantik.

Nicht done und deshalb offen gehalten:

- Wahrheit
- DeepSearch
- Auto-Publish
- Auto-Graph
- Auto-Dossier
- automatische Deduplication
- finale Graph-Zusammenführung

Neu ergänzt wurde außerdem der docs-only Slice:

- `SSOT-RECONCILE-AFTER-AI-DEDUP-02`

## 8. ProductionReadinessMatrix-Korrekturen

Die Matrix spiegelt jetzt expliziter:

- Dialog Intelligence Runtime AI ist an den bestehenden Create-Planner-/OpenAI-Pfad mit guardiertem Fallback gekoppelt.
- Existing Topic Matches sind runtime-/readmodel-wired mit ehrlichem Preview-Fallback.
- Topic Deduplication Review Queue ist contract-/review-first-ready.
- Review Queue Handoff bleibt runtime-wired.
- Source Review bleibt request-wired statt auto-verified.
- Community Source Review Contribution bleibt contract-/review-first-ready.
- Community Moderation Guardrails bleiben contract-ready beziehungsweise pilot-ready, nicht full production moderation.

Nicht als fertig markiert:

- automatische Wahrheit
- verifizierte Fakten
- verifizierte Quellen
- automatic factcheck
- DeepSearch
- Graph Runtime
- automatic deduplication
- final graph merge
- Dossier Runtime Creation
- Anlassraum Runtime Creation
- Participation Space Runtime Creation
- public Community Moderation UI
- Abuse/Spam Persistence
- Trust/Reputation Runtime
- Source Quality Scoring

## 9. Aktuelle Reifegrad-Einschätzung

Ehrliche Momentaufnahme nach `#255/#256`:

- Produkt-/Flow-Reife: ca. `95-97 %`
- Review-/Guardrail-Reife: ca. `93-95 %`
- AI-Kernpfad-Reife: ca. `88-91 %`
- SaaS-/Production-Reife: ca. `80-85 %`
- Gesamtprojekt all-in: ca. `92-94 %`

Einordnung:

- der sichtbare Flow ist sehr weit geschlossen
- das Runtime Wiring für den Kernpfad ist belastbar, aber bewusst begrenzt
- die review-first Semantik ist klar typisiert und gut abgesichert
- vollständige Production Readiness fehlt weiterhin bei Graph, tieferer Runtime, Community-Moderation und breiter externer Automation

## 10. Empfohlene nächste Reihenfolge

Sachlich sinnvolle Reihenfolge ohne neue Scheinsicherheit:

1. `COMMUNITY-SOURCE-REVIEW-MODERATION-UI-03`
2. `COMMUNITY-SOURCE-REVIEW-ABUSE-SPAM-04`
3. `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
4. `COMMUNITY-SOURCE-REVIEW-TRUST-SOURCE-QUALITY-05`
5. `TOPIC-GRAPH-RUNTIME-05`
6. `DOSSIER-RUNTIME-CREATION-04`
7. `ANLASSRAUM-RUNTIME-CREATION-04`
8. `PARTICIPATION-SPACE-RUNTIME-CREATION-04`

Echte externe Source-Adapter und DeepSearch bleiben nur dann sinnvoll, wenn sie später explizit freigegeben und mit Kosten-, Audit- und Guardrail-Lesart separat dokumentiert werden.

## Validierung

Für diesen docs-only Slice ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
