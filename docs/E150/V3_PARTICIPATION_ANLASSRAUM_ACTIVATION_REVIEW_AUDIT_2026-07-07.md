# V3 Participation / Anlassraum Activation Review Audit

Stand: 2026-07-07  
Branch: `pr/v3-participation-anlassraum-activation-review-01`

## Scope

Umgesetzt wurde ein additiver, review-first Activation-Candidate-Layer fuer
bestehende V3-Readmodels und bestehende Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- keine öffentliche Aktivierung
- kein Anlassraum-Autostart
- kein Poll-Autostart
- keine Veröffentlichung
- keine Review-Freigabe
- keine neue Queue
- keine neue Persistenz
- kein Providerlauf
- kein Voxy-Render
- kein DeepSearch-Autostart

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| V3 Voxy Human Loop | `apps/web/src/features/create/voxyCocreationDialogContract.ts` | liefert deterministische Rückfragen, Sprachkontext, RTL-Hinweis und Human-Loop-Bedarf | keine Antwort-Persistenz, kein Chat, kein Providerlauf |
| Source / Factcheck / Feed Enrichment | `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts` | liefert Quellenbedarf, Factcheck-Fragen, Vergleichsräume, Betroffenen- und Gemeinwohlbedarf | keine Recherche, kein Factcheck-Ergebnis |
| Dossier Workspace Decision | `apps/web/src/features/create/dossierWorkspaceDecisionContract.ts` | liefert These, Gegenposition, Claims, offene Fragen und Downstream-Readiness | keine Finalisierung, keine Approval-Entscheidung |
| Runtime Workflow Surface | `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx` | hält Dossier-, Participation-, Output- und Voxy-Folgepfade sichtbar review-first getrennt | keine Folgeausführung |
| Participation Handoff | `apps/web/src/features/create/participationHandoffContract.ts` | liefert vorhandene poll-/statement-/participation-space-Kandidaten als Draft-only Ausgangspunkte | keine Aktivierung, kein Publish, keine Runtime-Creation |

Ehrlich fehlend bleiben:

- keine echte Activation-Truth fuer einen neuen Anlassraum-/Beteiligungsraum-Start aus diesem Layer
- keine Persistenz fuer die Aktivierungsentscheidung selbst
- keine Auto-Aktivierung, kein Auto-Publish und kein Auto-Poll
- keine echte Nutzerantwort-Persistenz fuer Human-Loop oder Einladungstexte

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/participationActivationReviewContract.ts`
- `apps/web/src/features/create/ParticipationActivationReviewPanel.tsx`

Der Contract trennt:

- `sourceLanguage`
- `readingLanguage`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `rtlDisplayHint`
- `activationStatus`
- `suggestedFormat`
- `formatConfidence`
- `formatReason`
- `proposedParticipationQuestion`
- `targetGroups`
- `stakeholderGroups`
- `participationScope`
- `readinessSignals`
- `riskFlags`
- `blockers`
- `downstreamReadiness`
- `nextActivationDecision`
- `reviewRequired: true`
- `noActivationAction: true`
- `noPublishAction: true`
- `noRuntimeClaim: true`

## Deterministische Ableitung

Der Builder leitet den Layer nur aus vorhandenen Readmodels ab:

- mehrsprachige oder RTL-nahe Fälle führen bevorzugt zu
  `multilingual_roundtable`
- offene Human-Loop-Fragen und niedrige Reife führen zu
  `clarification_dialogue` oder `voxy_guided_refinement`
- dichter Quellen- und Factcheck-Bedarf führt zu `source_review`
- lokaler Orts- und Betroffenheitsbezug führt zu `local_issue_room`
- Regelungs- und Verwaltungsbezug führt zu `policy_feedback`
- fehlende Stakeholder- und Betroffenheitsklarheit führt zu
  `stakeholder_mapping`
- eine erkennbare Poll-Idee bleibt höchstens `poll_preparation`
- hoher Risiko- und niedriger Reifegrad bleibt
  `dossier_only_keep_draft`

Der Layer behauptet nie:

- dass ein Format schon entschieden wurde
- dass `activation_ready` gleich aktiviert ist
- dass `review_ready` gleich freigegeben ist
- dass eine Übersetzung Evidenz ersetzt
- dass Quellenbedarf bereits eine Quelle ist
- dass eine Factcheck-Frage bereits ein Ergebnis ist

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel.tsx` zeigt jetzt additiv
  `Beteiligungsraum vorbereiten`
- sichtbar werden Formatvorschlag, Scope, Beteiligungsfrage,
  Zielgruppen, Stakeholder, Risiken, Blocker und nächste Aktivierungsentscheidung
- der Layer bleibt `preview_only`

### `/account`

- lokale Resume-Items nutzen denselben Layer aus dem vorhandenen
  Voxy-/Resume-Arbeitsstand
- user-scoped Runtime-Linkages nutzen denselben Layer aus `v3ReviewContext`
- lokale Drafts bleiben lokale Drafts; kein Admin-Leak und keine Fake-Runtime

### `/admin/review`

- V3-Items mit `v3ReviewContext` zeigen additiv eine
  `Participation Activation Summary`
- sichtbar werden Formatvorschlag, Scope, Review-Bedarfe, Risiken und
  nächste Aktivierungsentscheidung
- Legacy-Items ohne `v3ReviewContext` bleiben unverändert

### `/dossier/[id]/studio`

- das bestehende Studio zeigt denselben Layer additiv neben Review-Kontext,
  Workflow, Downstream-Transparenz, Voxy und Source-/Factcheck-Handoff
- der Layer aktiviert weder Anlassraum noch Beteiligungsraum und behauptet
  keine Veröffentlichung

## Multilingualität

- Deutsch, Türkisch, Arabisch/RTL und Englisch/Französisch sind über Contract-
  und Surface-Tests abgedeckt
- Originalsprache und Lesefassung bleiben getrennt sichtbar
- `translationIsEvidence` bleibt immer `false`
- RTL erzeugt einen sichtbaren Review-Hinweis
- Minderheiten- und Sprachperspektiven werden nicht weggededupliziert

## Guardrails

- Formatvorschlag ist keine Aktivierungsentscheidung
- Poll Preparation ist kein Poll
- Activation Candidate ist nicht öffentlich
- keine neue Queue, keine neue Persistenz und keine neue Runtime-Welt
- kein Auto-Publish
- kein Auto-Anlassraum
- kein Auto-Poll
- kein Social-Trigger
- kein Voxy-Render
- kein Provider- oder DeepSearch-Start

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/participation-activation-review.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web exec vitest run tests/dossier-workspace-decision.contract.test.tsx tests/source-factcheck-feed-enrichment.contract.test.tsx tests/voxy-cocreation-dialog.contract.test.tsx tests/v3-downstream-ki-transparency.test.tsx tests/v3-runtime-workflow-surface.test.tsx tests/review-queue.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst offen

- echte Aktivierungs- oder Publish-Aktion aus diesem Layer
- Persistenz fuer menschliche Aktivierungsentscheidungen oder Einladungstexte
- automatische Anlassraum- oder Beteiligungsraum-Erstellung
- neue öffentliche Route oder neue Operator-Queue

## Nächster sinnvoller Slice

- Wenn spaeter echte Activation-Truth angeschlossen wird, nur ueber bestehende
  server-only Runtime-Pfade und mit klarer Audit- und Review-Wahrheit
- falls Aktivierungsentscheidungen persistiert werden, nur additiv an
  bestehende Handoff-/Review-/Workspace-Pfade und ohne neue Parallel-Queue
