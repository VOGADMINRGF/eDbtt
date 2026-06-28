# Runtime Capability Inventory after Review Queue

## 1. Ausgangslage

- Datum: `2026-06-28`
- Branch: `pr/runtime-capability-inventory-after-review-queue`
- Worktree: sauber
- Letzte relevante Commits auf `main`: `#240` bis `#247` vorhanden, inklusive `2d66371c docs(e150): reconcile ssot after review queue handoff (#247)`
- Auftrag: keine neue Runtime bauen, nur inventarisieren, bewerten und `OpenTasks.md` sowie `ProductionReadinessMatrix.md` gegen den echten Repo-Stand korrigieren

Gepruefte Schwerpunkte:

- `apps/web/src/features/**`
- `apps/web/src/app/**`
- `apps/web/tests/**`
- `docs/E150/**`
- `docs/**`

## 2. Zusammenfassung in Prozent

Status-Buckets ueber die 14 angefragten Bausteine:

- `50%` (`7/14`) sind als echte Runtime bzw. echtes Backend mit Tests im Repo vorhanden
- `29%` (`4/14`) sind nur teilweise vorhanden oder nur fuer angrenzende Pfade real, aber nicht sauber an den neuen Dialog-/Create-Handoff-Flow angeschlossen
- `14%` (`2/14`) sind als Backend/Readmodel vorhanden, aber im neuen sichtbaren Flow noch nicht verdrahtet
- `7%` (`1/14`) ist nur Preview-/Fixture-/Shell-Level

Flow-Anbindung `#240-#247`:

- `29%` (`4/14`) sind direkt am neuen Flow angeschlossen
- `36%` (`5/14`) sind teilweise angeschlossen
- `35%` (`5/14`) sind gar nicht oder nur ausserhalb des neuen sichtbaren Flows angeschlossen

Ehrliche Kurzlesart:

- Die grossen Luecken liegen nicht mehr bei Review-Queue-Persistenz oder Admin-Review.
- Die echten Luecken liegen jetzt vor allem bei sichtbarer Match-Runtime im neuen Panel, dialogspezifischer AI-Laufzeit, participation-space-Runtime und direkter Dialog->Source/Factcheck-Wiring.

## 3. Produktpfad #240-#247

Ist-Zuordnung des aktuellen Produktpfads:

1. `Beitrag erfassen`
   - real vorhanden ueber `/create`, `SharedCreateComposer`, `CreateClient`
2. `Standpunkt erkennen`
   - real vorhanden ueber `/api/create/analyze` -> `/api/contributions/analyze`
3. `Meinung zaehlen oder ausarbeiten`
   - teilweise vorhanden: Dialog-Contract/UI real; dialogspezifische Laufzeit noch nicht
4. `aehnliche Themen/Zweige anzeigen`
   - teilweise vorhanden: `matchService.ts` ist real im Analyze-Pfad, das neue sichtbare Panel bleibt preview-first
5. `Handoff-Draft vorbereiten`
   - real vorhanden: `createHandoffDrafts.ts`, `/api/create/handoffs`, `persistedHandoffReviewQueue.ts`
6. `zur Pruefung vormerken`
   - real vorhanden: `features/reviewQueue.ts`, `/admin/review`, Org-Dashboard-Review-Readmodel

## 4. Inventory-Tabelle aller Bausteine

| Baustein | vorhandene Dateien/Module | Reifegrad | ist mit Create/Dialog-Handoff-Flow #240-#247 verbunden? | Tests vorhanden? | Docs/OpenTasks Status korrekt? | Risiko | Empfehlung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Review Queue Backend/Persistenz | `apps/web/src/features/create/persistedHandoffReviewQueue.ts`, `apps/web/src/app/api/create/handoffs/route.ts`, `features/reviewQueue.ts` | `exists`, `production-ready` | ja | ja: `create-handoff.persistence.route`, `review-queue.readmodel` | nein | medium | `REVIEW-QUEUE-BACKEND-PERSISTENCE-05` als erledigt fuehren |
| Review Queue Admin Workbench | `apps/web/src/app/admin/review/page.tsx`, `features/reviewQueue.ts`, `features/admin/operatorConsoleReadModel.ts` | `exists`, `production-ready` | ja | ja: `admin-review.page`, `operator-console-readmodel`, `admin-hub-links.contract` | nein | low | `REVIEW-QUEUE-ADMIN-WORKBENCH-05` als erledigt fuehren |
| Dossier Runtime | `features/dossier/**`, `features/contentReleaseWorkbench.ts`, `/api/dossier/*`, `/api/dossiers/*` | `exists`, `production-ready` | teilweise | ja | teilweise | medium | als vorhandene Runtime werten; offen bleibt nur auto-free review->runtime creation aus Create-Handoff |
| Anlassraum Runtime | `features/anlassraum/service.ts`, `features/anlassraum/db.ts`, `/runden`, `/api/runden/public-input` | `exists`, `production-ready` | teilweise | ja | teilweise | medium | als vorhandene Runtime werten; offen bleibt nur reviewtes Create-Handoff -> echte Raum-Erstellung |
| Beteiligungsraum Runtime | `apps/web/src/features/participation/publicParticipationSpaceShell.tsx`, `fixtures/publicParticipationSpace.ts`, `/beteiligung/*` | `preview-only` | nein | ja, aber nur Shell-/Fixture-Tests | ja | high | nicht als Runtime ausgeben; `PARTICIPATION-SPACE-RUNTIME-CREATION-04` offen lassen |
| AI/Dialog Runtime | `apps/web/src/app/api/create/analyze/route.ts`, `/api/contributions/analyze`, `dialogIntelligenceContract.ts`, `DialogResultsHandoffPanel.tsx` | `partially exists` | teilweise | ja | teilweise | medium | AI/Create-Runtime und Dialog-Contract trennen; `DIALOG-INTELLIGENCE-RUNTIME-AI-02` offen lassen |
| Factcheck/Source Adapter | `features/factcheck/{db.ts,workflow.ts,jobRunner.ts}`, `features/region/server/sourceConnectionRuntime.ts`, `/api/factcheck/*` | `partially exists` | teilweise | ja | teilweise | medium | separate Runtime als vorhanden markieren; direkte Dialog->Adapter-Wiring offen lassen |
| Topic Graph Runtime | `features/graphAdmin/**`, `features/graphMergeCandidates.ts`, `/api/admin/graph/*`, `/api/admin/graph-merge-candidates/*` | `partially exists` | teilweise | ja | teilweise | medium | vorhandene Admin-/candidate-Runtime anerkennen; kein Claim fuer neuen Panel-Flow |
| Topic Deduplication | `features/graphMergeCandidates.ts`, `/api/admin/graph/repairs/merge-suggest`, `/api/admin/graph-merge-candidates/[candidateId]` | `backend-present-but-unwired` | nein | ja | teilweise | medium | als vorhandener Review-/Admin-Unterbau markieren, nicht als Flow-integrierte Dedupe-Runtime |
| Existing Topic Matching Runtime Bridge | `apps/web/src/features/create/matchService.ts`, `/api/contributions/analyze`, `ExistingTopicMatchesPanel.tsx` | `backend-present-but-unwired` | teilweise | ja | nein | medium | Task offen lassen, aber auf bereits vorhandene Analyze-Match-Runtime praezisieren |
| User Preference/Memory/Entitlement | `apps/web/src/lib/onboarding/preferenceSnapshot.ts`, `features/region/organizationEntitlements.ts`, `features/region/server/membershipRuntime.ts`, `/api/create/entitlements` | `partially exists` | nein | ja | teilweise | medium | generische Preference-/Entitlement-Runtime anerkennen; dialog memory weiter offen lassen |
| Payment/Membership | `features/pricing/checkoutProvider.ts`, `features/pricing/server/checkoutSessionsRepo.ts`, `/api/billing/*`, `features/region/server/membershipRuntime.ts` | `exists`, `production-ready` | teilweise | ja | ja | low | als vorhanden markieren; Self-Service-Checkout nur optional und provider-gated |
| Material Extraction/Source Intake | `apps/web/src/features/material/{materialIntakeRepository.ts,materialExtractionJobs.ts}`, `/api/material/extraction-jobs`, `/api/uploads` | `exists`, `production-ready` | nein | ja | teilweise | medium | vorhandenen Job-/Guardrail-Unterbau anerkennen; breite Runtime-Folgearbeit getrennt halten |
| Admin/Editorial Cockpit | `/admin`, `/admin/review`, `/admin/editorial/*`, `/admin/factcheck`, `/admin/pricing/orders` | `exists`, `production-ready` | ja | ja | ja | low | keine neue Arbeit noetig; nur SSOT-Texte auf Realitaet ziehen |

## 5. Was bereits vorhanden und nutzbar ist

- Persistente Create-Handoffs sind real: `/api/create/handoffs` speichert `create_handoff_review_items` serverseitig und reichert sie mit Scope-/Access-Context an.
- Die zentrale Admin-Review-Queue ist real und liest diese Create-Handoffs bereits wieder ein.
- Dossier- und Anlassraum-Runtime existieren unabhaengig vom neuen Dialogpanel bereits produktiv auf ihren eigenen Pfaden.
- Factcheck-Jobs und Source-Connection-Runtime existieren bereits als echte, getestete Backend-Pfade.
- Payment-/Membership-/Entitlement-Gates existieren real und haengen bereits am produktiven Handoff-Gate.
- Material-Intake und Material-Extraction-Jobs existieren real als review-first Registry-/Job-Unterbau.

## 6. Was vorhanden, aber nicht verdrahtet ist

- `matchService.ts` ist bereits real an `/api/contributions/analyze` angeschlossen, aber das neue `ExistingTopicMatchesPanel` nutzt noch einen preview-only Adapter aus `DialogOutcome`.
- Graph-Merge-/Dedupe-Unterbau existiert ueber `graphMergeCandidates.ts` und Admin-Graph-Routen, ist aber nicht der Runtime-Backbone des neuen sichtbaren Dialogpanels.
- Factcheck- und Source-Adapter-Runtime existieren, werden aber aus dem neuen Dialogpanel noch nicht direkt angesteuert.
- Generische Preference-Snapshots und Entitlement-Runtime existieren, aber keine dialogspezifische Memory-/Resume-Runtime.

## 7. Was nur Contract/UI/Preview ist

- Beteiligungsraum-/Participation-Space-Surfaces unter `/beteiligung/*` sind fixture-basiert; `PublicParticipationSpaceShell` und `PublicParticipationSpaceIndex` tragen den Preview-Charakter sogar sichtbar im UI.
- `dialogIntelligenceContract.ts` und `DialogResultsHandoffPanel.tsx` sind fuer das neue Dialog-Ergebnisformat real, aber ohne eigene AI-Laufzeit.

## 8. Was wirklich fehlt

- Keine echte participation-space creation runtime aus reviewtem Create-/Dialog-Handoff
- Keine dialogspezifische AI-Laufzeit auf dem neuen Dialog-Contract
- Keine direkte Runtime-Wiring des neuen sichtbaren Existing-Topic-Match-Panels auf die reale Match-Quelle
- Keine direkte Dialog->Factcheck/Source-Adapter-Anbindung ohne Umweg ueber spaetere manuelle Review-Schritte

## 9. OpenTasks-Korrekturen

- `REVIEW-QUEUE-BACKEND-PERSISTENCE-05`
  - von `open` auf `done`
  - Grund: serverseitige Persistenz ueber `persistedHandoffReviewQueue.ts` und `/api/create/handoffs` ist bereits vorhanden und getestet
- `REVIEW-QUEUE-ADMIN-WORKBENCH-05`
  - von `open` auf `done`
  - Grund: `/admin/review` zeigt `create_handoff`-Items bereits in der bestehenden Operator-Arbeitsliste
- `CREATE-EXISTING-TOPIC-MATCHES-RUNTIME-BRIDGE-04`
  - Status bleibt `open`
  - Praezisierung noetig: reale Match-Runtime existiert schon in `matchService.ts`; offen ist nur die direkte Wiring des neuen sichtbaren Panels
- `FACTCHECK-SOURCE-ADAPTER-INTEGRATION-01`
  - Status bleibt `open`
  - Praezisierung noetig: Factcheck-/Source-Runtimes existieren bereits separat; offen ist die direkte Dialog-Anbindung
- `USER-PREFERENCE-MEMORY-ENTITLEMENT-01`
  - Status bleibt `open`
  - Praezisierung noetig: generische Preference-/Entitlement-Runtime existiert bereits; offen bleibt nur dialogspezifische Memory

## 10. ProductionReadinessMatrix-Korrekturen

- Der Matrix-Abschnitt zu `DIALOG-INTELLIGENCE-RESULTS-01 ... REVIEW-QUEUE-HANDOFF-PERSISTENCE-04` durfte nicht mehr behaupten, es gaebe keine persistente Handoff-/Review-Queue-Runtime und keine Admin-Workbench.
- Die Matrix-Zeile fuer `/create` musste von `preview/local only` auf den echten Stand nachgezogen werden:
  - serverseitige Create-Handoff-Persistenz vorhanden
  - zentrale Review-Queue- und Admin-Review-Anbindung vorhanden
  - reales `matchService` bereits im Analyze-Pfad vorhanden
  - weiterhin keine automatische Dossier-/Anlassraum-/Participation-Space-Erstellung

## 11. Empfohlene naechste Reihenfolge

1. `CREATE-EXISTING-TOPIC-MATCHES-RUNTIME-BRIDGE-04`
   - sichtbarstes Restdrift-Thema: reale Match-Quelle existiert schon, das neue Panel nutzt sie nur noch nicht
2. `FACTCHECK-SOURCE-ADAPTER-INTEGRATION-01`
   - vorhandene Factcheck-/Source-Runtimes sauber aus dem neuen Dialog-/Handoff-Pfad nutzbar machen
3. `DIALOG-INTELLIGENCE-RUNTIME-AI-02`
   - erst danach lohnt eine echte Dialog-AI-Laufzeit auf dem neuen Contract
4. `DOSSIER-RUNTIME-CREATION-04` und `ANLASSRAUM-RUNTIME-CREATION-04`
   - erst nachdem Review-/Guardrail-Semantik stabil bleibt
5. `PARTICIPATION-SPACE-RUNTIME-CREATION-04`
   - derzeit am weitesten vom echten Runtime-Stand entfernt

## 12. Guardrails

- no auto-publish
- no auto-create dossier/anlassraum/participation space
- no auto-merge
- no fake graph
- no fake full search
- no hidden DeepSearch/cost path
- source adapter only if real implementation exists
- AI runtime only if real runtime path exists
