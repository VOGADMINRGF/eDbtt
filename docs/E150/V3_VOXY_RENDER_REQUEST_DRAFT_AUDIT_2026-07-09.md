# V3_VOXY_RENDER_REQUEST_DRAFT_AUDIT_2026-07-09

## Scope

- Task: `V3-VOXY-RENDER-REQUEST-DRAFT-AUDIT-01`
- Datum: `2026-07-09`
- Branch: `pr/v3-voxy-render-request-draft-audit-01`

## Ziel

Einen ehrlichen, auditierbaren `Render-Request-Draft`-Layer oberhalb von Script, Decision, Handoff,
Preflight, Registry und Adapter aufbauen, ohne Rendering, Providerlauf, Queue, Datei, Kostenbuchung,
Scheduling, Publishing oder neue Runtime-Wahrheit zu behaupten.

## Umgesetzt

- Typed Contract und Builder in
  `apps/web/src/features/create/voxyRenderRequestDraftContract.ts`
- Server-only Store mit Mongo-Primary, In-Memory-Fallback und Audit-Events in
  `apps/web/src/features/create/voxyRenderRequestDraftStore.ts`
- Additives Panel in
  `apps/web/src/features/create/VoxyRenderRequestDraftPanel.tsx`
- Admin-only API in
  `apps/web/src/app/api/admin/voxy-render-request-drafts/route.ts`
- Surface-Integration in
  - `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
  - `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
  - `apps/web/src/app/admin/review/page.tsx`
  - `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Guardrails

- `Render-Request-Draft` bleibt strikt unterhalb von Renderjob, Queue, Providerlauf, Datei,
  Kostenbuchung, Upload, Publish, Social Posting und Scheduling.
- Alle Execution-Flags bleiben explizit `false`.
- Create und Account zeigen nur readmodel-only Vorschau ohne Store-Zugriff.
- Admin Review und Dossier Studio lesen letzte Decision- und Request-Draft-Records nur additiv.
- Persistenz bleibt getrennt von späterer Video-/Provider-/Publish-Runtime.

## Tests

- `apps/web/tests/voxy-render-request-draft.contract.test.tsx`
- `apps/web/tests/voxy-render-request-draft.route.test.ts`
- aktualisierte Surface-Contracts:
  - `apps/web/tests/create-candidate-preview.contract.test.ts`
  - `apps/web/tests/account-resume-workbench.contract.test.tsx`
  - `apps/web/tests/admin-review.page.test.tsx`
  - `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Offene Punkte

- Keine echte Render-Runtime, kein Provider-Connector, keine Queue und kein Billing-Write.
- Kein Public-Surface und keine Nutzer-Selbstbedienungs-Persistenz fuer Request-Drafts.
- Spaetere Runtime-Freigabe bleibt bewusst ausserhalb dieses Slices.
