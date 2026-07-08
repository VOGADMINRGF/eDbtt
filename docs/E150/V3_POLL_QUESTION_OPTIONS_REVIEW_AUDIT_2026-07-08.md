# V3 Poll Question Options Review Audit

Stand: 2026-07-08  
Branch: `pr/v3-poll-question-options-review-01`

## Scope

Umgesetzt wurde `V3-POLL-QUESTION-OPTIONS-REVIEW-01` als additiver,
review-first Poll-Candidate-Layer auf bestehenden V3-Readmodels und
bestehenden Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein Poll-Autostart
- keine öffentliche Umfrage
- keine Veröffentlichung
- keine Review-Freigabe
- keine neue Queue
- keine neue Persistenz
- keine Migration
- kein Providerlauf
- kein Voxy-Render
- kein DeepSearch-Autostart

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| Participation Activation Review | `apps/web/src/features/create/participationActivationReviewContract.ts` | liefert Formatvorschlag, Scope, Beteiligungsfrage, Zielgruppen, Risiken und Aktivierungsgrenzen | kein Anlassraum-/Participation-Autostart |
| Dossier Workspace Decision | `apps/web/src/features/create/dossierWorkspaceDecisionContract.ts` | liefert These, Gegenposition, Claims, offene Fragen und vorhandene Poll-Naehe | keine Dossier-Finalisierung |
| Source / Factcheck / Feed Enrichment | `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts` | liefert Quellenbedarf, Factcheck-Fragen, Vergleichsraeume und Betroffenengruppenbedarf | keine Recherche, kein Factcheck-Ergebnis |
| Voxy Human Loop | `apps/web/src/features/create/voxyCocreationDialogContract.ts` | liefert deterministische Rueckfragen, Mehrsprachigkeits- und Human-Loop-Bedarf | kein Chat, keine Antwort-Persistenz |
| Participation Handoff | `apps/web/src/features/create/participationHandoffContract.ts` | liefert vorhandene Poll-Kandidaten und Draft-only Optionen aus bestehender Handoff-Wahrheit | keine Aktivierung und kein Publish |

Ehrlich fehlend bleiben:

- keine echte Poll-Runtime-Wahrheit fuer neue oeffentliche Polls
- keine Persistenz fuer menschliche Poll-Entscheidungen oder finalisierte Optionen
- keine Approval- oder Publish-Aktion aus diesem Layer
- keine automatische Mehrheits- oder Ergebnisbehauptung

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/pollQuestionOptionsReviewContract.ts`
- `apps/web/src/features/create/PollQuestionOptionsReviewPanel.tsx`

Der Contract trennt:

- `sourceLanguage`
- `readingLanguage`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `rtlDisplayHint`
- `pollStatus`
- `questionType`
- `proposedQuestion`
- `questionConfidence`
- `questionReason`
- `optionItems`
- `missingOptionNeeds`
- `biasReviewNeeds`
- `eligibilitySignals`
- `participationScope`
- `targetGroups`
- `reviewBlockers`
- `downstreamReadiness`
- `nextPollDecision`
- `reviewRequired: true`
- `noPollAction: true`
- `noPublishAction: true`
- `noRuntimeClaim: true`

## Deterministische Ableitung

Der Builder leitet den Layer nur aus vorhandenen Readmodels ab:

- Poll-Prompts und Draft-only Optionen aus bestehenden Participation-Kandidaten
  bleiben die staerkste Quelle fuer Frage und Fragetyp.
- Wenn keine expliziten Optionen vorliegen, duerfen nur vorhandene These,
  Gegenposition oder Claim-Texte als reviewpflichtige Optionenvorschlaege
  erscheinen.
- `poll_preparation` aus dem Aktivierungs-Layer bleibt nur Vorschlag und wird
  nie zu einer gestarteten Umfrage hochgestuft.
- Mehrsprachige oder RTL-nahe Faelle erzeugen sichtbar
  `translation_misread_risk` und `multilingual_review_needed`.
- Fehlende Quellen, Factchecks, Human-Loop-Antworten, Scope-Klarheit oder
  neutrale Optionen bleiben Blocker oder Review-Bedarf statt Fake-Sicherheit.
- Offene Fragen duerfen als `open_question` sichtbar werden, wenn Multiple
  Choice oder Pro/Contra noch nicht ehrlich tragfaehig sind.

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel.tsx` zeigt jetzt additiv
  `Poll/Frage vorbereiten`.
- Sichtbar werden Fragetyp, vorgeschlagene Frage, moegliche Optionen,
  Bias-Hinweise, Blocker und naechste Poll-Entscheidung.
- Der Layer bleibt `preview_only` und startet keinen Poll.

### `/account`

- Lokale Resume-Items nutzen denselben Poll-Layer aus dem vorhandenen
  Voxy-/Resume-Arbeitsstand.
- User-scoped Runtime-Linkages nutzen denselben Layer aus `v3ReviewContext`.
- Lokale Drafts bleiben lokale Drafts; kein Admin-Leak und keine Fake-Poll-Wahrheit.

### `/admin/review`

- V3-Items mit `v3ReviewContext` zeigen additiv
  `Poll Question Review Summary`.
- Sichtbar werden vorgeschlagene Frage, Optionen, Bias-/Minderheitenbedarf
  und naechste Poll-Entscheidung.
- Legacy-Items ohne `v3ReviewContext` bleiben unveraendert.

### `/dossier/[id]/studio`

- Das bestehende Studio zeigt denselben Layer additiv als
  `Poll/Frage-Arbeitsstand im Studio`.
- Sichtbar werden Poll-Faehigkeit, Frage, Optionen, Scope und Blocker.
- Der Layer startet weder Poll noch Publish und behauptet keine Runtime.

## Multilingualitaet

- Deutsch, Tuerkisch, Arabisch/RTL sowie Englisch/Franzoesisch sind ueber
  Contract- und Surface-Tests abgedeckt.
- Originalsprache und Lesefassung bleiben getrennt sichtbar.
- `translationIsEvidence` bleibt immer `false`.
- RTL erzeugt einen sichtbaren Review-Hinweis.
- Cross-lingual Poll-Faelle werden als Review-Bedarf markiert statt geglaettet.

## Guardrails

- Poll Preview ist kein Poll.
- Option Suggestion ist keine finale Option.
- `poll_preview` ist nicht `published`.
- `review_ready` ist nicht `approved`.
- `activation_ready` ist nicht `activated`.
- Quellenbedarf ist keine Quelle.
- Factcheck-Frage ist kein Factcheck-Ergebnis.
- Uebersetzung ist kein Beleg.
- keine neue Queue, keine neue Persistenz und keine neue Runtime-Welt
- kein Auto-Publish
- kein Auto-Poll
- kein Social-Trigger
- kein Voxy-Render
- kein Provider- oder DeepSearch-Start

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/poll-question-options-review.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web exec vitest run tests/poll-question-options-review.contract.test.tsx tests/participation-activation-review.contract.test.tsx tests/dossier-workspace-decision.contract.test.tsx tests/source-factcheck-feed-enrichment.contract.test.tsx tests/voxy-cocreation-dialog.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/v3-downstream-ki-transparency.test.tsx tests/v3-runtime-workflow-surface.test.tsx tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst offen

- echte Poll-Write- oder Publish-Aktion aus diesem Layer
- Persistenz fuer menschliche Poll-Entscheidungen oder finalisierte Optionen
- automatische Poll-, Anlassraum- oder Participation-Erstellung
- neue oeffentliche Route oder neue Operator-Queue

## Naechster sinnvoller Slice

- Falls spaeter echte Poll-Runtime angeschlossen wird, nur ueber bestehende
  server-only Runtime-Pfade und mit klarer Review-, Approval- und Publish-Wahrheit.
- Falls Poll-Entscheidungen oder Optionen persistiert werden, nur additiv an
  bestehende Handoff-/Review-/Workspace-Pfade und ohne neue Parallel-Queue.
