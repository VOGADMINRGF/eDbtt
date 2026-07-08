# V3 Voxy Render Provider Handoff Review Audit

Stand: 2026-07-08  
Branch: `pr/v3-voxy-render-provider-handoff-review-01`

## Scope

Umgesetzt wurde `V3-VOXY-RENDER-PROVIDER-HANDOFF-REVIEW-01` als additiver,
review-first Render-/Provider-Handoff-Layer auf bestehenden V3-Readmodels und
bestehenden Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein Providerlauf
- kein Renderstart
- kein Upload
- kein Scheduling
- kein Publish
- keine Veröffentlichung
- keine neue Queue
- keine neue Persistenz
- keine Migration
- kein Secret-Handling
- keine neue Runtime-Welt

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| Voxy Video Contracts | `apps/web/src/features/voxyVideo/contracts.ts` | liefert review-first Briefing-, Script-, Render- und Publish-Typen sowie Adapter-Interfaces | keine Providerbindung, kein Render, kein Publish |
| Voxy Briefing Script Candidate | `apps/web/src/features/create/voxyBriefingScriptCandidateContract.ts` | liefert Script-Titel, Segmente, Risiken, Sprachkontext und ehrliche Render-/Publish-Blocker | kein Video und kein Providerlauf |
| Output Social Workbench | `apps/web/src/features/create/outputSocialWorkbenchContract.ts` | liefert Kanal- und Zielhinweise für spätere Handoff-Ziele | kein Social-Post und kein Scheduling |
| Unified Review Queue Wiring | `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | liefert `voxyBriefing`, `voxyReviewState`, `voxyRenderJob` und `voxyPublishDraft` aus bestehender Review-Wahrheit | keine neue Queue und kein Runtime-Start |
| V3 Surface Touchpoints | `CreateCandidatePreviewPanel.tsx`, `AccountResumeWorkbenchSection.tsx`, `/admin/review`, `/dossier/[id]/studio` | tragen additive review-first Panels über bestehende Preview-, Resume-, Review- und Studio-Pfade | keine neue Route |

Ehrlich fehlend bleiben:

- keine echte Voice-, Avatar-, Render- oder Publish-Ausführung
- keine Provider- oder Secret-Wahrheit jenseits der bestehenden Blocker-Readmodels
- keine Persistenz für menschliche Provider-, Render- oder Publish-Entscheidungen aus diesem Layer
- keine automatische Übergabe an externe Systeme

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/voxyRenderProviderHandoffContract.ts`
- `apps/web/src/features/create/VoxyRenderProviderHandoffPanel.tsx`

Der Contract trennt mindestens:

- `handoffStatus`
- `handoffPacket`
- `reviewGates`
- `providerTargets`
- `handoffSignals`
- `blockers`
- `downstreamReadiness`
- `nextHandoffDecision`
- `sourceLanguage`
- `readingLanguage`
- `scriptLanguage`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `noProviderCall: true`
- `noRenderTrigger: true`
- `noPublishTrigger: true`
- `noScheduleAction: true`
- `noRuntimeClaim: true`

Zusätzlich gibt es mit `buildVoxyRenderProviderHandoffPacket(...)` einen
review-sicheren Adapter-Paket-Builder, der nur vorhandene Script-Segmente in
ein `adapter_only` Handoff-Paket überführt, ohne irgendeinen Provider zu
kontaktieren.

## Deterministische Ableitung

Der Builder leitet den Layer nur aus vorhandenen Readmodels ab:

- Der Script-Kandidat bleibt die primäre Handoff-Quelle für Titel, Intro,
  Segmente, Sprachlage und Risiken.
- `voxyReviewState`, `voxyRenderJob` und `voxyPublishDraft` werden nur lesend
  als Review-, Blocker- und Folgestatus gespiegelt.
- Fehlende Provider-, Secret- oder Runtime-Wahrheit bleiben sichtbar blockiert
  statt durch Defaultwerte geglättet.
- Kanal- und Zielhinweise kommen nur aus bestehendem Output-/Publish-Kontext.
- Mehrsprachigkeit und RTL bleiben explizit sichtbar; Übersetzung bleibt
  Lesehilfe und nie Evidenz.
- Der Adapter-Paket-Builder erzeugt nur Segmente, die bereits im
  Script-Kandidaten vorhanden sind.

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel.tsx` zeigt additiv
  `Voxy-Render/Provider-Handoff vorbereiten`.
- Sichtbar werden Handoff-Paket, Adapterpunkte, Review-Gates, Blocker und
  nächste Handoff-Entscheidung.
- Der Layer bleibt `preview_only`.

### `/account`

- Lokale Resume-Items nutzen denselben Handoff-Layer aus dem vorhandenen
  Voxy-Dialog.
- User-scoped Runtime-Linkages nutzen denselben Layer aus `v3ReviewContext`.
- Lokale Drafts bleiben lokale Drafts; kein Provider-, Render- oder Publish-Leak.

### `/admin/review`

- V3-Items mit `v3ReviewContext` zeigen additiv
  `Voxy Render/Provider Handoff Summary`.
- Sichtbar werden Adapterpunkte, Render-/Publish-Gates und Blocker aus
  vorhandener Review-Wahrheit.
- Legacy-Items ohne `v3ReviewContext` bleiben unverändert.

### `/dossier/[id]/studio`

- Das bestehende Studio zeigt denselben Layer additiv als
  `Voxy-Render/Provider-Handoff im Studio`.
- Sichtbar werden Briefing-Paket, Adapterstatus, Downstream-Readiness und
  Handoff-Blocker.
- Der Layer startet weder Render noch Publish und behauptet keine neue Runtime.

## Multilingualität

- Deutsch, Türkisch, Arabisch/RTL und englisch geprägte Adapter-Hinweise sind
  über Contract- und Surface-Tests abgedeckt.
- Originalsprache, Lesefassung und Handoff-Sprache bleiben getrennt sichtbar.
- `translationIsEvidence` bleibt immer `false`.
- RTL erzeugt einen sichtbaren Review-Hinweis.

## Guardrails

- Handoff Preview ist kein Providerlauf.
- Adapterpaket ist kein Upload.
- Render-Queue-Hinweis ist kein gerendertes Video.
- Publish-Draft ist keine Veröffentlichung.
- `publish_ready` ist nicht `published`.
- `review_ready` ist nicht `approved`.
- Übersetzung ist kein Beleg.
- keine neue Queue, keine neue Persistenz und keine neue Runtime-Welt
- kein Auto-Render
- kein Auto-Publish
- kein Auto-Scheduling
- kein Secret-Handling
- kein Provider- oder DeepSearch-Start

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/voxy-render-provider-handoff.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst offen

- echte Provider- oder Secret-Konfiguration
- echte Voice-, Avatar-, Render- oder Publish-Ausführung
- Persistenz für menschliche Handoff-, Render- oder Publish-Freigaben
- zusätzliche Queue-, Runtime- oder Asset-Pfade

## Nächster sinnvoller Slice

- Falls später echte Provider-Handoffs angeschlossen werden, nur über die
  bestehenden server-only Adapterpfade und mit klarer Review-, Secret- und
  Runtime-Wahrheit.
- Falls Handoff-Entscheidungen persistiert werden, nur additiv an bestehende
  Review-, Workspace- und Publish-Pfade und ohne neue Parallel-Queue.
