# V3 Output Social Workbench Review Audit

Stand: 2026-07-08  
Branch: `pr/v3-output-social-workbench-review-01`

## Scope

Umgesetzt wurde `V3-OUTPUT-SOCIAL-WORKBENCH-REVIEW-01` als additiver,
review-first Output-/Social-Workbench-Layer auf bestehenden V3-Readmodels und
bestehenden Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein Auto-Publish
- kein Social Posting
- kein Scheduling
- kein Versand
- kein Voxy-Render
- keine Review-Freigabe
- keine neue Queue
- keine neue Persistenz
- keine Migration
- kein Providerlauf
- kein DeepSearch-Autostart

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| Dossier Social Output Drafts | `apps/web/src/features/create/dossierSocialOutputDraftContract.ts` | liefert bestehende review-first Website-, LinkedIn-, Newsletter-, Carousel-, Press- und Kurzvideo-Drafts | kein externes Posting, kein Scheduling |
| Poll Question Options Review | `apps/web/src/features/create/pollQuestionOptionsReviewContract.ts` | liefert Poll-Frage, Optionen, Bias- und Sprachreview als Input für Poll-Einladung und Share Copy | kein Poll-Start |
| Participation Activation Review | `apps/web/src/features/create/participationActivationReviewContract.ts` | liefert Beteiligungsformat, Scope, Beteiligungsfrage und Zielgruppen als Input für Einladungskopie | keine Aktivierung |
| Dossier Workspace Decision | `apps/web/src/features/create/dossierWorkspaceDecisionContract.ts` | liefert These, Claims, offene Fragen und Gegenpositionen für Kurzfassung und neutralen Brief | keine Dossier-Finalisierung |
| Source / Factcheck / Feed Enrichment | `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts` | liefert Quellenbedarf, Factcheck-Fragen und Vergleichsräume als Copy-Risiken und Blocker | keine Recherche, kein Factcheck-Ergebnis |
| Voxy Human Loop und Voxy Video Contracts | `apps/web/src/features/create/voxyCocreationDialogContract.ts`, `apps/web/src/features/voxyVideo/contracts.ts` | liefern Human-Loop-Bedarf und späteren Briefing-Hinweis | kein Chat, kein Script-Render, kein Video |

Ehrlich fehlend bleiben:

- keine echte Publish-, Social- oder Scheduling-Runtime-Wahrheit für neue Drafts
- keine Persistenz für menschliche Finalentscheidungen zu Copy, Kanalwahl oder Timing
- keine Freigabe- oder Publish-Aktion aus diesem Layer
- kein gerendertes Voxy-Video und kein externer Kanalaufruf

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/outputSocialWorkbenchContract.ts`
- `apps/web/src/features/create/OutputSocialWorkbenchPanel.tsx`

Der Contract trennt:

- `sourceLanguage`
- `readingLanguage`
- `outputLanguage`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `rtlDisplayHint`
- `outputStatus`
- `outputFormats`
- `channelCandidates`
- `draftItems`
- `copyRisks`
- `readinessSignals`
- `downstreamReadiness`
- `nextOutputDecision`
- `reviewRequired: true`
- `noPublishAction: true`
- `noSocialPostAction: true`
- `noScheduleAction: true`
- `noRuntimeClaim: true`

## Deterministische Ableitung

Der Builder leitet den Layer nur aus vorhandenen Readmodels ab:

- bestehende `socialOutputDrafts` aus dem Review-Kontext bleiben die stärkste
  Wahrheit für bereits vorbereitete Website-, Newsletter-, Social- oder
  Press-Entwürfe.
- wenn noch keine realen Output-Drafts vorliegen, dürfen nur vorhandene
  Kurzfassung, Beteiligungsfrage, Poll-Frage, Zielgruppen, offene Fragen und
  Voxy-Hinweise als reviewpflichtige Entwürfe erscheinen.
- Quellenbedarf, Factcheck-Fragen, Human-Loop-Bedarf, Scope-Unklarheit,
  Mehrsprachigkeit und vulnerable Gruppen werden nur als Risiken oder Blocker
  sichtbar, nie als gelöste Wahrheit.
- Poll- oder Beteiligungseinladungen bleiben Einladungsentwürfe und starten
  weder Poll noch Participation Room.
- Voxy-Briefing-Hinweise bleiben Hinweise auf spätere Briefings oder Skripte,
  nicht auf Rendern oder Publish.

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel.tsx` zeigt jetzt additiv
  `Ausgabe vorbereiten`.
- Sichtbar werden Debattenstand-Kurzfassung, Einladungsidee, Social-/Share-Draft,
  Kanal-Kandidaten, Copy-Risiken und Voxy-Briefing-Hinweis.
- Der Layer bleibt `preview_only` und veröffentlicht nichts.

### `/account`

- Lokale Resume-Items nutzen denselben Output-Layer aus dem vorhandenen
  Voxy-/Resume-Arbeitsstand.
- User-scoped Runtime-Linkages nutzen denselben Layer aus `v3ReviewContext`.
- Lokale Drafts bleiben lokale Drafts; kein Admin-Leak und kein Fake-Social-Post.

### `/admin/review`

- V3-Items mit `v3ReviewContext` zeigen additiv
  `Output Social Workbench Summary`.
- Sichtbar werden Ausgabeformate, Kanal-Kandidaten, Copy-Risiken,
  Downstream-Readiness und nächste Output-Entscheidung.
- Legacy-Items ohne `v3ReviewContext` bleiben unverändert.

### `/dossier/[id]/studio`

- Das bestehende Studio zeigt denselben Layer additiv als
  `Output-/Social-Arbeitsstand im Studio`.
- Sichtbar werden Kurzfassung, Einladungstexte, Poll-Einladung,
  Kanal-Kandidaten, Risiken und Voxy-Briefing-Hinweis.
- Der Layer startet weder Publish noch Social Posting oder Rendern.

## Multilingualität

- Deutsch, Türkisch, Arabisch/RTL sowie Englisch/Französisch sind über
  Contract- und Surface-Tests abgedeckt.
- Originalsprache, Lesefassung und Output-Sprache bleiben getrennt sichtbar.
- `translationIsEvidence` bleibt immer `false`.
- RTL erzeugt einen sichtbaren Review-Hinweis.
- Cross-lingual Output-Fälle werden als Sprach- und Copy-Risiko markiert statt
  geglättet.
- Minderheiten- oder Betroffenenperspektiven dürfen in knapper Copy nicht
  glatt zusammengezogen werden.

## Guardrails

- Output Preview ist kein Publish.
- Social Draft ist nicht gepostet.
- Share Copy ist keine Freigabe.
- Newsletter-Teaser ist nicht versendet.
- `voxy_briefing_note` ist kein gerendertes Video.
- `publish_ready` ist nicht `published`.
- `review_ready` ist nicht `approved`.
- Poll Invitation ist kein öffentlicher Poll.
- Quellenbedarf ist keine Quelle.
- Factcheck-Frage ist kein Factcheck-Ergebnis.
- Übersetzung ist kein Beleg.
- keine neue Queue, keine neue Persistenz und keine neue Runtime-Welt
- kein Auto-Publish
- kein Social Posting
- kein Scheduling
- kein Voxy-Render
- kein Provider- oder DeepSearch-Start

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/output-social-workbench.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web exec vitest run tests/output-social-workbench.contract.test.tsx tests/poll-question-options-review.contract.test.tsx tests/participation-activation-review.contract.test.tsx tests/dossier-workspace-decision.contract.test.tsx tests/source-factcheck-feed-enrichment.contract.test.tsx tests/voxy-cocreation-dialog.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/v3-downstream-ki-transparency.test.tsx tests/v3-runtime-workflow-surface.test.tsx tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst offen

- echte Publish-, Social- oder Scheduling-Aktion aus diesem Layer
- Persistenz für menschliche Finalentscheidungen zu Copy, Kanal oder Timing
- automatische Social-, Newsletter- oder Press-Aussendung
- neue öffentliche Route oder neue Operator-Queue

## Nächster sinnvoller Slice

- Falls später echte Publish- oder Social-Runtime angeschlossen wird, nur über
  bestehende server-only Runtime-Pfade und mit klarer Review-, Approval- und
  Publish-Wahrheit.
- Falls Copy-, Kanal- oder Timing-Entscheidungen persistiert werden, nur additiv
  an bestehende Handoff-/Review-/Workspace-Pfade und ohne neue Parallel-Queue.
