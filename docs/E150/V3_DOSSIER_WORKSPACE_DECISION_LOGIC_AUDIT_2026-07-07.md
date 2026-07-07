# V3 Dossier Workspace Decision Logic Audit

Stand: 2026-07-07  
Branch: `pr/v3-dossier-workspace-decision-logic-01`

## Scope

Umgesetzt wurde `V3-DOSSIER-WORKSPACE-DECISION-LOGIC-01` als additiver,
review-first Decision-Layer auf bestehenden V3-Readmodels und bestehenden
Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- keine Dossier-Finalisierung
- keine Approval-Entscheidung
- kein Publish
- keine neue Queue
- keine neue Persistenz
- kein Providerlauf
- kein Voxy-Render
- kein Social Posting
- kein Auto-Publish

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| Dossier Workspace Review Surface | `apps/web/src/features/create/dossierWorkspaceReviewSurfaceContract.ts` | liefert Claims, Gegenpositionen, offene Fragen und Workspace-Guardrails | keine Finalisierung und keine eigene Runtime |
| V3 Review Queue Wiring | `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | verbindet Source Pack, Language Bridge, Participation-, Social- und Voxy-Kontext | keine neue Queue-Welt |
| Voxy Human Loop | `apps/web/src/features/create/voxyCocreationDialogContract.ts` | liefert deterministische Human-Loop-Fragen und offene Ergänzungsbedarfe | kein Chat und keine Antwort-Persistenz |
| Source / Factcheck / Feed Enrichment | `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts` | liefert Quellenbedarf, Factcheck-Fragen, Referenzräume und Gemeinwohlhinweise | keine Recherche, kein Factcheck-Ergebnis |
| Runtime Workflow Surface | `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx` | zeigt Folgeflächen und Runtime-Grenzen ehrlich an | keine Folgeausführung |
| Downstream KI Transparenz | `apps/web/src/features/create/V3DownstreamKiTransparency.tsx` | zeigt Downstream-Wahrheit und Blocker additiv an | kein Approval und kein Publish |

Ehrlich fehlend bleiben:

- keine Decision-Persistenz
- keine Editor- oder Approval-Aktion aus dem Panel
- keine echte Review-/Provider-/Render-Runtime
- keine automatische Ableitung zu `published` oder `active`

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/dossierWorkspaceDecisionContract.ts`
- `apps/web/src/features/create/DossierWorkspaceDecisionPanel.tsx`

Der Contract hält getrennt:

- `workspaceStatus`
- `thesis`
- `counterposition`
- `claimItems`
- `openQuestions`
- `sourceNeeds`
- `factcheckQuestions`
- `affectedGroups`
- `commonGoodTensions`
- `referenceScopes`
- `humanLoopNeeds`
- `downstreamReadiness`
- `nextDecision`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `reviewRequired: true`
- `noPublishAction: true`
- `noRuntimeClaim: true`

## Deterministische Ableitung

Der Builder leitet den Layer nur aus vorhandenen Readmodels ab:

- Claim-Texte werden heuristisch als Tatsachen-, normative, kausale,
  prognostische, persönliche oder unklare Aussage gerahmt.
- Gegenpositionen kommen nur aus vorhandenen Dossier-/Source-/Voxy-Hinweisen,
  nie aus erfundenem Gegentext.
- Quellenbedarf, Factcheck-Fragen, Betroffenengruppen und Gemeinwohlkonflikte
  kommen aus dem bestehenden Source-/Factcheck-/Feed-Handoff.
- Human-Loop-Bedarf kommt aus vorhandenen Voxy-Karten mit
  `needs_user_input`.
- Downstream-Readiness bleibt review-first und unterscheidet ehrlich
  `readmodel_only`, `needs_review`, `prepared` und `blocked`.
- Die nächste Entscheidung priorisiert menschliche Ergänzung vor
  Quellenbedarf, Gegenposition und Folgeschritten.

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel` zeigt jetzt zusätzlich
  `Dossier-Entscheidungslogik`.
- Sichtbar werden Kernthese, Gegenposition, Claims, offene Fragen,
  Quellenbedarf und die nächste Entscheidung.
- Der Layer bleibt `preview_only` und startet keine Folgeaktion.

### `/account`

- Resume-Items nutzen denselben Layer aus dem vorhandenen
  Voxy-/Resume-Arbeitsstand.
- User-scoped Runtime-Linkages nutzen denselben Layer aus `v3ReviewContext`.
- Lokale Drafts bleiben lokale Drafts; kein Admin-Leak und keine erfundene
  Runtime-Wahrheit.

### `/admin/review`

- Review-Items mit `v3ReviewContext` zeigen den Decision-Layer additiv.
- Sichtbar werden Claim-Typ, Quellenbedarf, Human-Loop-Bedarf und die
  nächste Review-Entscheidung.
- Legacy-Items ohne `v3ReviewContext` bleiben unverändert.

### `/dossier/[id]/studio`

- Das bestehende Studio zeigt denselben Layer additiv neben Review-Kontext,
  Workflow, Downstream-Transparenz, Voxy und Source-/Factcheck-Handoff.
- Der Layer finalisiert das Dossier nicht und behauptet keine Veröffentlichung.

## Guardrails

- These ist nicht Entscheidung.
- Gegenposition ist nicht Moderationsurteil.
- Quellenbedarf ist keine Quelle.
- Factcheck-Frage ist kein Factcheck-Ergebnis.
- Human-Loop ist kein Chat.
- Übersetzung ist kein Beleg.
- `review_ready` ist nicht `approved`.
- `publish_ready` ist nicht `published`.
- Draft, Preview und Readmodel sind keine Runtime-Wahrheit.

## Tests

- `git diff --check`
- `pnpm --dir apps/web exec vitest run tests/dossier-workspace-decision.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm --dir apps/web run typecheck`
- `pnpm --dir apps/web run lint`
- `pnpm --dir apps/web run build`

## Bewusst offen

- echte Editor-/Approval-Aktionen aus diesem Layer
- Persistenz für Entscheidungen oder Human-Loop-Antworten
- automatische Übergänge in Dossier-, Participation-, Output- oder Voxy-Runtime
- zusätzliche Public- oder Publish-Logik

## Nächster sinnvoller Slice

- Falls später Entscheidungsantworten persistiert werden, nur additiv an
  bestehende Draft-/Review-/Workspace-Pfade und ohne neue Parallel-Queue.
- Falls echte Approval- oder Publish-Aktionen folgen, denselben Contract
  weiterverwenden und `translation != evidence`,
  `publish_ready != published` sowie `decision_preview != approval`
  weiterhin erzwingen.
