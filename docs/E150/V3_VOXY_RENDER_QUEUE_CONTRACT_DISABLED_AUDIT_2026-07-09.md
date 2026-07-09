# V3_VOXY_RENDER_QUEUE_CONTRACT_DISABLED_AUDIT_2026-07-09

## Scope

- Task: `V3-VOXY-RENDER-QUEUE-CONTRACT-DISABLED-01`
- Datum: `2026-07-09`
- Branch: `pr/v3-voxy-render-queue-contract-disabled-01`

## Ziel

Einen ehrlichen, disabled `Render-Queue-Vertrag` oberhalb von Request-Draft, Decision, Handoff,
Preflight, Registry und Adapter aufbauen, ohne Queue, Worker, Providerlauf, Datei, Kostenbuchung,
Upload, Publish, Social Posting, Scheduling oder neue Runtime-Wahrheit zu behaupten.

## Umgesetzt

- Typed Contract und Builder in
  `apps/web/src/features/create/voxyRenderQueueContract.ts`
- Server-only Store mit Mongo-Primary, In-Memory-Fallback und Audit-Events in
  `apps/web/src/features/create/voxyRenderQueueStore.ts`
- Additives Panel in
  `apps/web/src/features/create/VoxyRenderQueueContractPanel.tsx`
- Admin-only API in
  `apps/web/src/app/api/admin/voxy-render-queue-previews/route.ts`
- Surface-Integration in
  - `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
  - `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
  - `apps/web/src/app/admin/review/page.tsx`
  - `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Queue-/Worker-Inventur

- `apps/web/src/lib/worker.ts`
  - existiert als Web-Client-Helfer fuer Factcheck-API-Calls
  - ist explizit kein BullMQ-Worker und kein sicherer Voxy-Render-Runtime-Pfad
- `apps/web/src/app/api/health/worker/route.ts`
  - prueft einen echten BullMQ-/Redis-Queue-Zustand fuer `demo`
  - ist Health-/Ops-Infrastruktur und keine Voxy-Render-Queue
- `apps/web/src/app/api/factcheck/intern/enqueue/route.ts`
  - ist bewusst disabled und liefert `DISABLED`
  - bestaetigt, dass interne Queue-Endpunkte im Web-Workspace nicht still fuer neue Domains wiederverwendet werden sollen

## Warum diese Runtime nicht wiederverwendet wird

- Factcheck-Queue, Worker-Health und interne Enqueue-Routen sind fachlich auf Factcheck-/Editorial-
  Pfade ausgelegt und bilden weder Voxy-Request-Drafts noch Voxy-Render-Gates oder Voxy-Cost-/Publish-
  Guardrails sauber ab.
- Der Slice braucht nur einen typed Vertrag mit Auditspur, keine aktive Queue-Ausfuehrung.
- Jede Wiederverwendung echter Queue-/Worker-Bausteine wuerde hier falsche Runtime-Wahrheit,
  potentielle Providercalls oder irrefuehrende Betriebsbehauptungen erzeugen.

## Guardrails

- `Render-Queue-Vertrag` bleibt strikt unterhalb von Queue, Worker, Providerlauf, Datei,
  Kostenbuchung, Upload, Publish, Social Posting und Scheduling.
- Alle Execution-Flags bleiben explizit `false`.
- Create und Account zeigen nur readmodel-only Queue-Hinweise ohne Store-Lesewahrheit.
- Admin Review und Dossier Studio lesen letzte Queue-Preview-Records nur additiv aus.
- Persistenz bleibt getrennt von spaeterer Video-/Provider-/Publish-Runtime.

## Tests

- `apps/web/tests/voxy-render-queue-contract.contract.test.tsx`
- `apps/web/tests/voxy-render-queue-contract.route.test.ts`
- aktualisierte Surface-Contracts:
  - `apps/web/tests/create-candidate-preview.contract.test.ts`
  - `apps/web/tests/account-resume-workbench.contract.test.tsx`
  - `apps/web/tests/admin-review.page.test.tsx`
  - `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Offene Punkte

- Keine echte Render-Queue, kein Worker, kein Provider-Connector und kein Billing-Write.
- Kein Public-Surface und keine Nutzer-Selbstbedienungs-Persistenz fuer Queue-Previews.
- Spaetere Runtime-Freigabe bleibt bewusst ausserhalb dieses Slices.
