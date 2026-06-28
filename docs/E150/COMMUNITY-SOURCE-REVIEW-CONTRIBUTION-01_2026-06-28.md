# COMMUNITY-SOURCE-REVIEW-CONTRIBUTION-01

Stand: 2026-06-28

## Ausgangslage nach #251

- `#249` hat sichtbare Create-/Dialog-Handoffs an die bestehende Review-Queue-Persistenz angeschlossen.
- `#250` hat vorhandene Themen-/Zweiganschluesse kontrolliert an Runtime-/Readmodel-Quellen gekoppelt.
- `#251` hat `factcheck_request` aus dem sichtbaren Create-/Dialog-Follow-up review-first an `/api/factcheck/enqueue` angeschlossen.
- Die bestehende Factcheck-Runtime erzeugt echte Factcheck-Jobs. Sie ist nicht automatisch ein moderierter Community-Contribution-Intake.

## Ziel

Community soll beim Pruefen helfen koennen, aber keine Wahrheit final entscheiden.

Dieser Slice fuehrt deshalb einen kleinen review-first Contract fuer Community Source Review Contributions ein:

- Hinweise statt Beweise
- Quellenvorschlaege statt bestaetigter Quellen
- Gegenquellen statt automatischem Claim-Widerruf
- Erfahrungsberichte statt repraesentativer Evidenz
- redaktionelle Pruefung bleibt Pflicht

## Verwendete vorhandene Strukturen

- `apps/web/src/features/create/createHandoffReviewQueue.ts`
- `apps/web/src/features/create/CreateHandoffDraftSummary.tsx`
- `apps/web/src/features/create/factcheckSourceAdapterBridge.ts`
- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `core/communityContributions/*`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

Es wurde bewusst keine zweite Moderations- oder Review-Welt eingefuehrt.
Das Mapping nutzt die bestehende lokale Handoff-Review-Queue-Struktur nur als Preview-/Contract-Ziel.

## Contribution-Arten

- `source_suggestion`
- `counter_source`
- `context_note`
- `lived_experience`
- `unclear_claim`
- `wording_clarification`
- `escalation_request`

## Statusmodell

- `draft`
- `submitted`
- `pending_review`
- `accepted_as_hint`
- `needs_moderation`
- `rejected`

Die Preview-/Mapping-Seite zeigt bewusst `pending_review`.
Die echte Runtime-Submission bleibt in diesem Slice jedoch `blocked_unwired`, solange keine saubere Community-Persistenz- und Moderationskette an dieselbe Runtime angeschlossen ist.

## Guardrails

- contribution must not verify claim
- contribution must not publish
- contribution must not auto-merge
- contribution must not create dossier/anlassraum/participation space
- contribution must not mark source as confirmed
- contribution must not count majority as truth

Im Code werden diese Grenzen ueber explizite Guardrail-Felder und Blocker modelliert.

## Runtime-Submission

Ergebnis: bewusst nicht direkt verdrahtet.

Begruendung:

- `/api/factcheck/enqueue` erzeugt echte Factcheck-Jobs.
- Fuer Community-Hinweise fehlt in diesem Slice noch die belastbare oeffentliche Moderations-, Abuse-, Auth- und Persistenzkette.
- Ein direkter Submit waere deshalb ein Scheinerfolg oder wuerde die Community-Submission fachlich mit einem echten Factcheck-Job verwechseln.

Stattdessen:

- Preview-Mapping auf bestehende `CreateHandoffReviewQueueItem`-Strukturen
- ehrlicher Runtime-Status `blocked_unwired`
- keine Fake-Submission

## UI / Copy

`CreateHandoffDraftSummary.tsx` zeigt fuer Quellenpruefungsfaelle jetzt zusaetzlich:

- `Community Source Review`
- `Community kann Quellenhinweise beitragen`
- `Quelle vorschlagen`
- `Gegenbeleg vorschlagen`
- `Kontext ergänzen`

Leitcopy:

`Diese Aussage ist zur Quellenprüfung vorgemerkt. Andere können Hinweise, Quellen oder Gegenbeispiele beitragen. Diese Hinweise werden geprüft und bestätigen noch keine Wahrheit.`

Es wurde absichtlich kein neues oeffentliches Formular und keine neue CTA-Strecke eingebaut.

## Tests / Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-contribution.test.ts tests/factcheck-source-adapter-bridge.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts tests/create-curated-dialog-workspace.contract.test.tsx tests/create-handoff-drafts-panel.test.tsx tests/create-handoff-review-queue-panel.test.tsx`
- `pnpm -C apps/web run build`

## Offene Folgepfade

- oeffentliche Moderationsoberflaeche
- Abuse/Spam Handling
- Reputation/Trust Levels
- Source Quality Scoring
- Redaktionelle Review Workbench Erweiterung
- `DIALOG-INTELLIGENCE-RUNTIME-AI-02`
- `TOPIC-GRAPH-RUNTIME-05`
- `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01`
