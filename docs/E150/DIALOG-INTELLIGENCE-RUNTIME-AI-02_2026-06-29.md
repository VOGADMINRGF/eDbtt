# DIALOG-INTELLIGENCE-RUNTIME-AI-02

Stand: 2026-06-29
Repo: `edebatte-org`
Task: `DIALOG-INTELLIGENCE-RUNTIME-AI-02`

## Ausgangslage nach #254

Vor diesem Slice waren bereits produktive Teilpfade vorhanden:

- `#249` verdrahtete Create-/Dialog-Handoffs an die bestehende Review Queue Runtime.
- `#250` verdrahtete Existing Topic Matches an vorhandene Readmodels und Runtime-Routen.
- `#251` verdrahtete `factcheck_request` in den bestehenden Source-Review-/Factcheck-Pfad.
- `#252` modellierte review-first Community Source Review Contributions.
- `#253` glich SSOT und Readiness nach dem Source-Review-Flow ab.
- `#254` ergänzte typed Moderations-, Abuse- und Trust-Guardrails für Community-Hinweise.

Die Dialog-Intelligence-Fläche war damit bereits contract-ready und UI-seitig sichtbar, aber der eigentliche Dialog-Ergebnisblock im Create-Follow-up nutzte noch direkt den Preview-Mapping-Pfad.

## Bestand vor dem Slice

### Bereits vorhanden

- Dialog-Contract: `apps/web/src/features/dialog/dialogIntelligenceContract.ts`
- Preview-/Fixture-Mapping: `apps/web/src/features/dialog/dialogIntelligenceFixtures.ts`
- Sichtbares Ergebnis-UI: `apps/web/src/features/dialog/DialogResultsHandoffPanel.tsx`
- Create-Follow-up-UI: `apps/web/src/features/create/CreateVisualFollowup.tsx`
- Handoff-Drafts und Review Queue: `createHandoffDrafts.ts`, `createHandoffReviewQueue.ts`, `createHandoffReviewQueueRuntimeBridge.ts`
- Existing Topic Matches Runtime/Readmodels: `existingTopicMatchesRuntimeBridge.ts`
- Factcheck-/Source-Review-Bridge: `factcheckSourceAdapterBridge.ts`
- Community-Source-Review- und Moderation-Contracts: `communitySourceReviewContribution.ts`, `communitySourceReviewModeration.ts`
- Produktive Create-Planner-Runtime: `apps/web/src/features/create/createPlanner.ts`
- Produktive Create-Follow-up-Runtime: `apps/web/src/features/create/intelligentFollowup.ts`

### Wichtige Einordnung

- Es existierte bereits ein sicherer AI-Adapter im Create-Pfad: `createPlanner.ts` nutzt `callOpenAIJson` und liefert typed Provider-/Degradierungs-/Permissions-Metadaten.
- Diese Runtime ist ausdrücklich non-mutativ:
  - `plannerRole: planner_only`
  - `nonMutative: true`
  - `canPublish: false`
  - `canSave: false`
  - `canMerge: false`
  - `canDeepSearch: false`
  - `researchUsed: none`
  - `deepSearchUsed: false`
- Es existierte keine separate dialog-spezifische Provider-Runtime, die parallel zum vorhandenen Create-Planner hätte aufgebaut werden sollen.

## Neu verdrahtet

### Neuer Bridge-Layer

Neu: `apps/web/src/features/create/dialogIntelligenceRuntimeBridge.ts`

Der Bridge-Layer führt genau die fehlende Anschlusslogik ein:

- `canRunDialogIntelligenceRuntime(...)`
- `getDialogIntelligenceRuntimeBlockers(...)`
- `runDialogIntelligenceRuntime(...)`
- `normalizeDialogIntelligenceRuntimeResult(...)`
- `fallbackToDialogIntelligencePreview(...)`
- `blocksUnsafeDialogIntelligenceSideEffects(...)`

Semantik:

- `runtime_ai`
  - nur wenn der bestehende Create-Planner wirklich produktiv über `openai` gelaufen ist
  - nur wenn keine Degradierung aktiv ist
  - nur wenn der vorhandene non-mutative Permissions-/Cost-/Research-Guard greift
- `preview`
  - wenn nur heuristische/local fallback Planner-Daten vorliegen
- `blocked_unwired`
  - wenn sichere Runtime-Bausteine fehlen, z. B. Planner-/Graph-Meta
- `error`
  - wenn die Auswertung selbst scheitert

### Mapping auf den bestehenden Dialog-Contract

Der Bridge-Layer baut keinen zweiten Ergebnis-Contract. Er nutzt den bestehenden Dialog-Contract weiter und mappt den vorhandenen Create-Follow-up-Output darauf.

Wichtig dabei:

- Das strukturelle Mapping nutzt weiter den vorhandenen Preview-Mapper.
- Der Runtime-Claim kommt aber nicht aus einer Fixture, sondern aus der Planner-Metadatenlage des produktiven Create-Follow-up-Ergebnisses.
- `reviewed` wird im Bridge-Layer bewusst zu `needs_source` heruntergestuft.
- `factcheck_request` wird bei `needs_source` explizit gesetzt oder erhalten.
- Eine zusätzliche Quellenrückfrage bleibt sichtbar.

Damit behauptet der Dialog-Pfad keine bestätigte Wahrheit und keine bestätigte Quelle.

## UI-Verhalten

`CreateVisualFollowup.tsx` nutzt jetzt den Bridge-Layer und zeigt die Quelle ehrlich an:

- `runtime_ai`
- `runtime_readmodel`
- `preview`
- `blocked_unwired`
- `error`

Sichtbare Statuscopy:

- `KI-Auswertung aus Runtime`
- `KI-Auswertung vorbereitet`
- `Preview-Auswertung – noch keine echte Runtime-KI`
- `KI-Auswertung derzeit nicht verfügbar`

Die Integration bleibt klein:

- kein neues Produktlayout
- keine neuen CTAs
- kein neues Styling-System
- nur ein zusätzlicher Statusblock vor dem bestehenden Dialog-Ergebnispanel

## Runtime-Modus in diesem Slice

Für diesen Slice wurde echter vorhandener Runtime-AI-Adapter gefunden und genutzt:

- Adapter: bestehender `createPlanner`-OpenAI-Pfad
- Produktive Statusmarke: `runtime_ai`, wenn Planner-Metadaten dies ehrlich tragen
- Fallbacks:
  - `preview`, wenn nur heuristische/local fallback-Daten vorliegen
  - `blocked_unwired`, wenn sichere Runtime-Metadaten fehlen

Es wurde bewusst keine neue AI-Orchestration, keine neue Prompt-Welt und keine neue Provider-Kette gebaut.

## Handoff- und Factcheck-Anschluss

`needs_source` und `factcheck_request` bleiben auf dem bereits vorhandenen review-first Pfad:

- Create/Dialog-Outcome
- `createHandoffDrafts`
- `createHandoffReviewQueue`
- `createHandoffReviewQueueRuntimeBridge`
- `factcheckSourceAdapterBridge`
- `/api/factcheck/enqueue`
- `/admin/review`

Es gibt weiterhin:

- keine automatische Quellenbewertung
- keine bestätigte Wahrheit
- keine automatische Factcheck-Freigabe
- keine neue Factcheck-Welt

## Guardrails

Der neue Bridge-Layer blockiert oder degradiert bewusst statt falsche Produktbehauptungen zu erzeugen.

Explizit ausgeschlossen bleiben:

- Fake-AI bei fehlender Runtime
- bestätigte Wahrheit
- erfundene Quellen
- automatische Quellenbewertung
- automatische Veröffentlichung
- automatisches Merge
- automatische Dossier-Erstellung
- automatische Anlassraum-Erstellung
- automatische Beteiligungsraum-Erstellung
- automatische Graph- oder Entity-Erstellung
- DeepSearch
- externe Recherche
- Kostenpfade ohne freigegebenen Adapter
- Community-Mehrheit oder Trust als Wahrheitsersatz

## Tests und Validierung

Neu bzw. angepasst:

- `apps/web/tests/dialog-intelligence-runtime-bridge.test.ts`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`

Validiert:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dialog-intelligence-runtime-bridge.test.ts tests/create-curated-dialog-workspace.contract.test.tsx tests/factcheck-source-adapter-bridge.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts tests/community-source-review-contribution.test.ts tests/community-source-review-moderation.test.ts`
- `pnpm -C apps/web run build`

## Offene Folgepfade

Bewusst offen bleiben:

- separate dialog-spezifische Provider-/Prompt-Runtime jenseits des vorhandenen Create-Planner-Pfads
- tieferer Graph-/Deduplication-Pfad
- automatische Dossier-/Anlassraum-/Participation-Space-Runtime-Erstellung
- direkte Source-/Factcheck-Runtime über das Match-Panel
- echte Community-Contribution-Runtime-Persistenz mit Moderationsoberfläche

Folgeaufgabe `DIALOG-INTELLIGENCE-AI-PROVIDER-ADAPTER-03` war nicht nötig, weil bereits ein sicherer vorhandener Runtime-AI-Adapter existierte und nutzbar war.
