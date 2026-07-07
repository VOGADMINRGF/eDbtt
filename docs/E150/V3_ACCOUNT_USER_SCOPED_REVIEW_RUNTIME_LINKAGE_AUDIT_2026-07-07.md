# V3 Account User-Scoped Review Runtime Linkage Audit

Stand: 2026-07-07  
Branch: `pr/v3-account-user-scoped-review-runtime-linkage-02`

## Scope

Umgesetzt wurde `V3-ACCOUNT-USER-SCOPED-REVIEW-RUNTIME-LINKAGE-02`.

Ziel war, die bisherige Draft-/Ledger-Wahrheit im Account um echte,
nutzerbezogene Review-, Dossier-, Participation-, Output- und Voxy-Readmodels
zu erweitern, ohne neue Persistenz, keine neue Queue und keine Fake-Linkage zu
bauen.

Betroffene Flächen:

- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

## Verwendete bestehende Wahrheit

Der Slice nutzt nur bereits vorhandene Persistenz- und Readmodel-Pfade:

- persisted Create-Handoffs aus
  `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- bestehende Account-Overview-Wahrheit aus `features/account/service.ts`
- bestehende Dossier-Workspaces aus
  `features/dossier/server/studioPersistence.ts`
- bestehende Dossier-, Anlassraum- und Participation-Runtime-Records
- bestehende Publish-/Activation-Readmodels
- bestehende `v3ReviewContext`- und Runtime-Surface-Presenter

Neu gebaut wurde nur ein additiver Loader-/Readmodel-Pfad:

- `features/account/loadAccountUserScopedRuntimeLinkage.ts`
- `features/account/userScopedRuntimeLinkageTypes.ts`

## Echte Linkage-Felder

Starke, belastbare Korrelationen:

- `PersistedCreateHandoffRecord.id`
- `sourceHandoffId` in Dossier-, Anlassraum- und Participation-Runtime-Records
- `workspace.provenance.sourceDraftId` in Dossier-Workspaces
- `createdByUserId` auf persisted Handoffs

Schwächere, nur teilweise belastbare Korrelationen:

- `handoff.dossierId` kombiniert mit `workspace.createdBy`
- vorhandene Dossier-/Participation-Kandidaten in `v3ReviewContext`

Bewusst nicht als Wahrheit benutzt:

- freie Textähnlichkeit
- heuristische Auto-Matches ohne bestehende ID- oder Scope-Brücke

## Neue Account-Wahrheit

`getAccountOverview` lädt jetzt additiv eine neue user-scoped Slice:

- `persisted_review_handoff`
- `dossier_workspace`
- `anlassraum_runtime`
- `participation_runtime`
- `output_draft`
- `voxy_briefing`

Je Beitrag werden sichtbar:

- Linkage-Status:
  `linked`, `partially_linked`, `missing_linkage`, `blocked_by_runtime_truth`,
  `blocked_by_review`, `blocked_by_provider`, `not_available`
- Runtime-Truth-Level:
  `local_draft`, `ledger`, `review_readmodel`, `dossier_readmodel`,
  `participation_readmodel`, `output_readmodel`, `runtime_confirmed`
- nächste sinnvolle Aktion
- sichtbare Lücken und Guardrails

Die Nutzercopy bleibt verständlich; rohe interne Enums werden nicht direkt
geleakt.

## Surface-Integration

### `/account`

`AccountResumeWorkbenchSection.tsx` rendert neben lokalen Drafts und
Ledger-Arbeitsständen jetzt auch echte persisted Handoff-/Runtime-Linkage.

Sichtbar werden:

- verbundener Review-Arbeitsstand
- verbundener Dossier-Workspace oder partielle Dossier-Zuordnung
- Anlassraum-/Participation-Runtime, falls über `sourceHandoffId` vorhanden
- Output-/Voxy-Kandidaten aus bestehendem Workspace-/Review-Kontext
- ehrliche Lücken und `nächster Schritt`

### `/admin/review`

Bestehende Review-Items zeigen, falls vorhanden, einen kleinen read-only
Create-/Account-Herkunftsblock aus `createHandoffContext`.

### `/dossier/[id]/studio`

Wenn ein Workspace eine `provenance.sourceDraftId` trägt, wird die Herkunft
aus einem bestehenden Create-Arbeitsstand sichtbar gemacht.

## Ehrliche Grenzen

Der Slice behauptet bewusst nicht:

- dass jeder lokale Draft oder jeder Ledger-Eintrag exakt einem persisted
  Create-Handoff zugeordnet werden kann
- dass `review_ready` bereits `approved` wäre
- dass `publish_ready` bereits `published` wäre
- dass Output-/Voxy-Kandidaten aktive Runtime, Posting oder Rendering
  bedeuten
- dass neue Persistenz, neue Queue oder neue Runtime entstanden wäre

## Weiter offen

Die wichtigste verbleibende Lücke ist die exakte Korrelation zwischen:

- lokalem Start-Draft bzw. servergesichertem `contribution_drafts`-/Ledger-Ursprung
- und dem späteren persisted `create_handoff_review_items`-Record

Heute ist diese Brücke im Bestand nicht durchgehend über eine kanonische ID
belegt. Deshalb bleibt dieser Teil bewusst offen und wird nicht gefakt.

Folgetask:

- `V3-ACCOUNT-CONTRIBUTION-HANDOFF-CORRELATION-03`

## Keine neue Runtime

Runtime-Logik wurde nur lesend erweitert:

- kein neuer Provider-Call
- kein neuer AI-Usage-Write
- kein DeepSearch-Autostart
- kein Social Posting
- kein Voxy-Render
- kein Auto-Publish
- keine neue Persistenz
- keine neue Queue

## Tests

Neu oder fortgeschrieben:

- `apps/web/tests/v3-account-user-scoped-runtime-linkage.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`

Mitvalidiert:

- `apps/web/tests/v3-downstream-ki-transparency.test.tsx`
- `apps/web/tests/v3-runtime-workflow-surface.test.tsx`
- `apps/web/tests/v3-review-context-summary.test.tsx`

Zusätzlich grün:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
