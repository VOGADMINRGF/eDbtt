# V3 Voxy Briefing Script Candidate Review Audit

Stand: 2026-07-08  
Branch: `pr/v3-voxy-briefing-script-candidate-review-01`

## Scope

Umgesetzt wurde `V3-VOXY-BRIEFING-SCRIPT-CANDIDATE-REVIEW-01` als additiver,
review-first Voxy-Script-Candidate-Layer auf bestehenden V3-Readmodels und
bestehenden Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein Voxy-Rendering
- kein Video-Rendering
- kein Avatar-Provider
- kein Voice-Provider
- kein Auto-Publish
- kein Social Posting
- kein Scheduling
- kein Providerlauf
- kein DeepSearch-Autostart
- keine neue Queue
- keine neue Persistenz
- keine Migration

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| Voxy Video Contracts | `apps/web/src/features/voxyVideo/contracts.ts` | liefern bestehende review-first Briefing-, Segment-, Render- und Publish-States ohne Providerbindung | kein Render- oder Publish-Lauf |
| V3 Voxy Human Loop | `apps/web/src/features/create/voxyCocreationDialogContract.ts` | liefert mehrsprachige Rueckfragen, Human-Loop-Bedarf und RTL-Hinweise | kein Chat und keine Antwort-Persistenz |
| Source / Factcheck / Feed Enrichment | `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts` | liefert Quellenbedarf, Claim-Review und Factcheck-Fragen fuer Script-Risiken | keine Recherche, kein Factcheck-Ergebnis |
| Dossier Workspace Decision | `apps/web/src/features/create/dossierWorkspaceDecisionContract.ts` | liefert These, Gegenposition und offene Fragen fuer Script-Struktur | keine Finalisierung oder Approval |
| Participation Activation Review | `apps/web/src/features/create/participationActivationReviewContract.ts` | liefert Beteiligungsfrage, Scope und Aktivierungsrisiken fuer Beteiligungs- oder Einladungsskripte | keine Aktivierung |
| Poll Question Options Review | `apps/web/src/features/create/pollQuestionOptionsReviewContract.ts` | liefert Poll-Frage, Optionen und Bias-Review fuer Poll-Hinweise | kein Poll-Start |
| Output Social Workbench | `apps/web/src/features/create/outputSocialWorkbenchContract.ts` | liefert Briefing-Notizen, Kanal-Hinweise und Copy-Risiken fuer Script-Intro und Downstream-Readiness | kein Publish, kein Posting |

Ehrlich fehlend bleiben:

- keine echte Render-, Avatar-, Voice- oder Publishing-Runtime
- keine Persistenz fuer menschliche Script-Antworten oder Script-Freigaben
- keine Freigabe-, Render- oder Publish-Aktion aus diesem Layer
- keine neue oeffentliche Route und keine neue Voxy-Produktwelt

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/voxyBriefingScriptCandidateContract.ts`
- `apps/web/src/features/create/VoxyBriefingScriptCandidatePanel.tsx`

Der Contract trennt:

- `sourceLanguage`
- `readingLanguage`
- `scriptLanguage`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `rtlDisplayHint`
- `scriptStatus`
- `scriptFormat`
- `scriptSegments`
- `scriptDraft`
- `scriptRisks`
- `readinessSignals`
- `downstreamReadiness`
- `nextScriptDecision`
- `reviewRequired: true`
- `noRenderAction: true`
- `noPublishAction: true`
- `noSocialPostAction: true`
- `noRuntimeClaim: true`

Zusätzlich entstand ein Brueckenhelfer:

- `buildVoxyVideoSegmentsFromScriptCandidate(...)`

Er mappt den Script-Kandidaten spaeter deterministisch auf die bestehenden
`voxyVideo`-Segmenttypen, ohne einen Provider zu binden oder Rendering
auszufuehren.

## Deterministische Ableitung

Der Builder leitet den Layer nur aus vorhandenen Readmodels ab:

- vorhandene Dossier-These, Gegenpositionen und offene Fragen speisen Hook,
  Kontext, These und offene Fragen.
- Quellenbedarf, Claim-Review und Factcheck-Fragen werden nur als
  `source_status` und Review-Hinweise sichtbar, nie als Ergebnisbehauptung.
- Beteiligungsfrage und Poll-Frage duerfen nur als `participation_prompt`
  oder `poll_prompt` erscheinen.
- mehrsprachige und RTL-nahe Faelle fuehren sichtbar zu
  `multilingual_bridge_note`, `translation_misread_risk` und
  `multilingual_review_needed`.
- hoher Human-Loop-, Quellen- oder Kontextbedarf fuehrt zu
  `keep_as_note`, `keep_internal` oder offenen Review-Status statt zu einer
  glatten Video-Behauptung.
- Render-, Provider- und Publishing-Blocker bleiben als Downstream-Readiness
  oder ehrlicher Blocker sichtbar, nicht als Fake-Runtime.

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel.tsx` zeigt jetzt additiv
  `Voxy-Briefing vorbereiten`.
- Sichtbar werden Script-Titel, Intro, Segmentliste, Sprachlage,
  Script-Risiken, Render-/Publish-Blocker und naechste Script-Entscheidung.
- Der Layer bleibt `preview_only`.

### `/account`

- lokale Resume-Items nutzen denselben Layer aus dem vorhandenen
  Voxy-/Resume-Arbeitsstand.
- user-scoped Runtime-Linkages nutzen denselben Layer aus `v3ReviewContext`.
- das Script bleibt intern; kein Admin-Leak und keine Fake-Video-Wahrheit.

### `/admin/review`

- V3-Items mit `v3ReviewContext` zeigen additiv
  `Voxy Script Candidate Summary`.
- Sichtbar werden Script-Format, Segmente, Risiken,
  Render-/Publish-Blocker und die naechste Script-Entscheidung.
- Legacy-Items ohne `v3ReviewContext` bleiben unveraendert.

### `/dossier/[id]/studio`

- das bestehende Studio zeigt denselben Layer additiv als
  `Voxy-Briefing-Arbeitsstand`.
- sichtbar werden Titel, Intro, Segmentliste, Sprachhinweise,
  Review-Risiken und Downstream-Readiness.
- der Layer rendert kein Video und startet kein Publish.

## Multilingualitaet

- Deutsch Original / Deutsch Script
- Tuerkisch Original / deutsche Lesefassung
- Arabisch Original mit RTL-Hinweis
- Englisch Original / franzoesische Script-Sprache

wurden als Contract-Faelle abgesichert.

Verbindlich bleibt:

- Originalsprache bleibt erhalten
- Lesefassung bleibt getrennt
- Script-Sprache ist explizit markiert
- `translationIsEvidence` bleibt immer `false`
- RTL erzeugt einen sichtbaren Review-Hinweis
- Minderheitenperspektiven duerfen nicht durch Script-Glaettung verschwinden

## Guardrails

- Script Preview ist kein Video
- Render Handoff ist nicht gerendert
- Voxy Briefing Note ist kein Publish
- `review_ready` ist nicht `approved`
- `publish_ready` ist nicht `published`
- `script_candidate` ist kein gerendertes Video
- `render_ready` ist nicht `rendered`
- Quellenbedarf ist keine Quelle
- Factcheck-Frage ist kein Factcheck-Ergebnis
- Human-Loop-Antwort ist kein gepruefter Beleg
- Uebersetzung ist kein Beleg
- keine neue Queue, keine neue Persistenz und keine neue Runtime-Welt
- kein Auto-Publish
- kein Social Posting
- kein Scheduling
- kein Provider- oder Render-Start

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/voxy-briefing-script-candidate.contract.test.tsx tests/output-social-workbench.contract.test.tsx tests/poll-question-options-review.contract.test.tsx tests/participation-activation-review.contract.test.tsx tests/dossier-workspace-decision.contract.test.tsx tests/source-factcheck-feed-enrichment.contract.test.tsx tests/voxy-cocreation-dialog.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/v3-downstream-ki-transparency.test.tsx tests/v3-runtime-workflow-surface.test.tsx tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/voxy-video-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst offen

- echte Script-Freigabe oder Antwort-Persistenz
- echter Render-, Avatar-, Voice- oder Publish-Handoff
- neue oeffentliche Route oder neue Operator-Queue
- hochgestufte Produktionswahrheit fuer Provider, Render oder Publish

## Naechster sinnvoller Slice

- Falls spaeter echte Render- oder Publish-Runtime angeschlossen wird, nur
  ueber bestehende server-only Pfade und mit klaren Review-, Approval- und
  Provider-Gates.
- Falls Script-Antworten oder Freigaben persistiert werden, nur additiv an
  bestehende Draft-/Review-/Workspace-Pfade und ohne neue Parallel-Queue.
