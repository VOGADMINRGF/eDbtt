# V3 Claims / Questions / Polls Candidate Flow

Stand: 2026-07-03
Task: `V3-CLAIMS-QUESTIONS-POLLS-CANDIDATE-FLOW-01`

## Ziel

Ein kleinster sauberer V3-Slice fuer `/create`, der aus bestehendem
Draft-/Planner-/Analyze-Kontext review-first Kandidaten fuer Claims,
Gegenpositionen, offene Fragen und moegliche Umfragen sichtbar macht, ohne
neue Persistenz, Auto-Publish, Auto-Graph-Writes oder falsche Quellenbehauptung.

## Analyse 1-10

1. Bestehende Strukturen

- `apps/web/src/features/create/createHandoff.ts` erzeugt bereits typed
  `CreateClaimDraft`, `CreateArgumentDraft` und `CreateOpenQuestionDraft`.
- `apps/web/src/features/create/persistedHandoffReviewQueue.ts` persistiert
  diese Handoff-Drafts review-first.
- `features/dossier/db.ts` und `features/dossier/schemas.ts` tragen reale
  `dossier_claims`, `open_questions` und `dossier_suggestions`.
- `apps/web/src/features/create/dossierRuntimeServer.ts` uebernimmt bestaetigte
  Handoffs in echte `dossier_runtime_record`-Pfade.
- `apps/web/src/features/create/participationSpaceRuntimeServer.ts` bleibt der
  bestehende Carrier fuer oeffentliche Fragen/Umfragen/Feedback.
- `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts` und
  `frontendAiTransparency.ts` liefern bereits typed Runtime-/Truth-Semantik fuer
  `/runden/new` und `/create`.

2. Wirklich vorhandene Analyze-/Planner-Outputs als Basis

- Analyze liefert reale `claims`, `questions`, `missingPerspectives` und
  `participationCandidates`.
- Planner/Follow-up liefert reale `understanding`, `suggestions`,
  `plannerOpenQuestions`, `plannerCore`, `plannerTopic` und eine getypte
  `plannerTrace`-Korrelation.
- Daraus kann heute ehrlich eine Kandidatenvorschau gebaut werden.

3. Bereits vorhandene Candidate-/Draft-Modelle

- Vorhanden:
  `CreateClaimDraft`, `CreateArgumentDraft`, `CreateOpenQuestionDraft`,
  `CreateHandoffDraft`, `DossierSuggestionDoc`, `GraphMergeCandidate`.
- Nicht vorhanden:
  ein eigener persistenter `ClaimDraft`-/`PollDraft`-/`QuestionDraft`-Write fuer
  `/create` als unmittelbare Runtime-Wahrheit.

4. Wo Claims oder Open Questions heute schon gerendert werden

- `/create` ueber `CreateVisualFollowup`
- Dossier-Runtime und Dossier-Public-Routen
- Beteiligungsraum-Runtime und Public-Route
- Review-/Admin-Pfade fuer Handoffs und Runtime-Creation

5. Kleinster sinnvoller Ort

- `/create` direkt nach Planner/Analyze.
- Begruendung:
  dort liegen Input, Follow-up, Analyze-Truth und Frontend-Transparenz bereits
  zusammen; ein Preview-only Slice kann ohne neue Produktparallelwelt sichtbar
  werden.

6. Welche Daten abgeleitet werden duerfen

- Nutzertext
- Server-Draft aus `/runden/new`
- Planner-/Follow-up-Struktur
- echte Analyze-Claims/Questions/Missing Perspectives/Participation Candidates
- vorhandene `sourceUrls`, Material-Refs und `RunReceipt`-SourceSet

7. Welche Herkunft sichtbar bleiben muss

- `input_ref`
- `input_origin`
- `source_provenance`
- `derived_by`
- `review_state`
- `publish_state`
- `graph_target_state`
- Provider/Modell nur bei realer Runtime-Truth

8. Wo noch keine externe Quelle behauptet werden darf

- Immer dann, wenn nur Nutzertext oder Server-Draft vorliegt und keine
  `RunReceipt`-/Material-/Link-Referenz vorhanden ist.
- Diese Faelle werden explizit als `missing_source_provenance` markiert.

9. Nutzung des Provenance-Trace aus `#296`

- Der Downstream-Schritt fuer Claims/Fragen/Umfragen unterscheidet jetzt
  zwischen:
  - `candidate_preview`
  - `planned_not_active`
- Der Trace bleibt an denselben `/create`-Provenance-Pfad gekoppelt und traegt
  reale Provider-/Modelltruth nur, wenn sie im Lauf wirklich vorliegt.

10. Relevante bestehende Tests

- `create-intelligent-followup.contract.test.ts`
- `create-intelligent-followup.route.test.ts`
- `create-analyze.contract.test.ts`
- `create-analyze.workspace-ui.test.ts`
- `frontend-ai-transparency.contract.test.ts`
- `ai-orchestration-provenance-trace.contract.test.ts`
- `runden-create-handoff-integrity.contract.test.ts`
- `runden-entry-canon.contract.test.ts`
- `create-dossier-handoff.contract.test.ts`
- `create-anlassraum-handoff.contract.test.tsx`

## Umsetzung

### Neue Preview-Struktur

Neue Dateien:

- `apps/web/src/features/create/createCandidatePreview.ts`
- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`

Das Readmodel ist bewusst `preview_only` und fuehrt pro Kandidat:

- `input_ref`
- `input_origin`
- `source_provenance`
- `derived_by`
- `provider`
- `model`
- `review_state`
- `publish_state`
- `graph_target`
- `graph_target_state`

Kandidatentypen:

- `claim`
- `counter_position`
- `question`
- `poll`

### Persistenzwahrheit

- Es gibt **keinen** neuen Candidate-Write.
- Persistente Carrier bleiben:
  - Claims/Fragen: `dossier_runtime_record`
  - Umfragen: `participation_space_runtime_record`
- `/create` zeigt nur Vorschau und Guardrails.

### Verwendete Inputs

- Planner-/Follow-up-Result
- optionales Analyze-Result
- optionaler `RunReceipt`
- Server-Draft-ID / Intake-Kontext
- vorhandene Link-/Material-Referenzen

### Provenance-Regeln

- Nur Nutzertext/Server-Draft ohne Quellenkontext:
  `source_provenance = missing_source_provenance`
- Link-/Material-Referenzen ohne `RunReceipt`:
  `source_provenance = input_reference_only`
- Analyze mit `RunReceipt.sourceSet`:
  `source_provenance = runtime_source_reference`

## Nicht gebaut

- keine neue persistente Claim-/Question-/Poll-Runtime in `/create`
- keine Fake-Umfrageoptionen
- kein Auto-Publish
- kein Auto-Graph-Write
- keine Feed-/Social-/Voxy-Automation
- keine neuen Dossier-/Anlassraum-/Participation-Writes in diesem Slice

## Offene Folgepfade

- `V3-CLAIM-TO-DOSSIER-PIPELINE-01`
- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- `V3-LIVE-FORMAT-HOST-COCKPIT-01`
- spaetere Downstream-Transparenz fuer Dossier-/Anlassraum-/Beteiligungsraum-
  Folgeflaechen
- echte persistente Candidate-Writes nur nach eigenem Folge-Task

## Validierung

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts tests/create-analyze.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Noch im Gesamtlauf dieses Slices nachgezogen:

- `git diff --check`
- weitere fokussierte `/create`-/handoff-/followup-Suiten
- `pnpm -C apps/web run build`
