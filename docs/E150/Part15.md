# E150 Master Spec – Part 15: Offene Pfade & Restarbeiten

> Status-Hinweis (2026-03-23): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`. Keine neuen Runs aus diesem Part ableiten.


## Zweck

Dieses Dokument dient als Status-Zusammenfassung der Pfade (Part00–Part15). Es ist **kein** Run-Plan. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`, der Lieferrahmen in `docs/E150/Pflichtenheft.md`.

## Hygiene-Boards (Einordnung)

- Operative SSOT bleibt ausschließlich: `docs/E150/OpenTasks.md`
- Hygiene-/Evidenzquellen:
  - `docs/ORPHAN_FEATURES_VPM25.md`
  - `docs/E150_NEEDS_REVIEW.md`
- Diese Boards sind für Sichtung/Drift/Review gedacht und dürfen keinen konkurrierenden operativen Backlog bilden.
- Wenn ein Punkt daraus umgesetzt werden soll, wird er zuerst als Task-ID im OpenTasks-Katalog geführt.

## Update (2026-03-26) — Docs-Harmonisierung Part01-16 + OpenTasks

- `/docs`-Bestandsaufnahme gegen Part01-16 erneut synchronisiert.
- Themenzuordnung wurde in Part14 als explizite Mapping-Tabelle verankert (`Section 12`).
- Drift-Abgrenzungen sind jetzt direkt in betroffenen Parts dokumentiert:
  - Part01 (normativ vs. operative Uebersicht),
  - Part06 (Consequences-Hauptpart vs. Themenkatalog-Appendix),
  - Part16 (kanonischer Flow + AI-/Anlassraum-Ergaenzungen).
- Querverweise fuer Event/Demo/Operator sowie I18N/Social-Runtime wurden in Part11, Part12, Part13 nachgezogen.
- OpenTasks wurde um Dokumentationsdrift, offene Harmonisierungspunkte und Abhaengigkeiten ergaenzt.

## Update (2026-03-20) — Canonical AI/Product Architecture Shift (Freistart + Qualitaetsschicht)

- Zwischenstand `manual/source/ai` als primaeres Zielbild fuer `/create` ist fachlich superseded.
- Neuer kanonischer Produktpfad:
  `Freistart -> Analyse/Qualitaet -> Graph-Matching -> CTA-Moment -> Anlassraum/Dossier/Beteiligung`.
- Qualitaetsschicht ist verpflichtend (Strukturierung, Pruefhilfen, Claim-/Fragevorschlaege, Unsicherheiten, Rueckfragen) und nicht optional.
- Graph-Matching + CTA-Layer sind verpflichtende Schicht bei belastbarem Kontext.
- Anlassraum ist explizit Arbeitsort (nicht nur Zielobjekt) mit sauberem Dossier-Handoff.
- Architektur wird als Hauptfluss plus spezialisierte Unter-Orchestrierungen gefuehrt (statt diffusem KI-Modus).
- Meta-Layer (Audit/Governance/Provenance/Risk) ist verpflichtend quer ueber alle Stufen.
- Stage-2/Stage-3 (Self-Host/Souveraenisierung) sind explizit hard-deferred und bleiben letzter Agenda-Punkt bis zur vollstaendigen operativen Baseline.
- Governance bleibt unveraendert strikt:
  manual-first, review-first, approval-first, no auto publish.

## Update (2026-03-23) — Canonical AI Orchestration + Social Safety/Security Guardrails

- Kanonische Referenz fuer das geschaerfte Zielbild:
  `docs/E150/Part16_AI_Orchestration_and_Safety.md`.
- Das 5-Orchester-Modell ist die verbindliche Produktsicht:
  `intake`, `pruefung`, `agenda_fragen`, `dossier`, `beteiligung_abstimmung`.
- Der bestehende E150-Orchestrator bleibt deterministischer Hauptfluss; spezialisierte Orchestrierungen werden zusaetzlich und kontrolliert angedockt.
- Die fruehere 11-Stufen-Pipeline bleibt als technische Unterpipeline/KI-Verarbeitungssicht wertvoll, ersetzt aber nicht die neue Produktsicht.
- Verbindliche Social-Safety-Regel:
  kein fruehes Personen-Matching/DM/Gruppensog nur wegen aehnlicher Position + Region.
- Verbindliche Reihenfolge:
  Sache zuerst, Schutz zuerst, Austausch spaeter und kontrolliert.
- Social-Eskalation ist nur zulaessig, wenn sie opt-in, gestuft, moderierbar und missbrauchssensibel ist.
- Schutzdimension ist explizit:
  Schutz vor Belaestigung, Anmachspruechen, zweideutigen Narrativen, sozialem Druck; besonderer Schutz fuer Frauen, vulnerable und andersdenkende Nutzer.
- Security-/Privacy-Pflicht bleibt nicht optional:
  Secret-Hygiene, PII-Trennung, minimierte externe KI-Payloads, Audit-Trail fuer High-impact-KI-Schritte.
- Community-/Matching-/Inbox-Ausbau ist abhaengig von GOV-SAFETY-01..03 und GOV-SEC-01..03 (OpenTasks ist verbindlich).

## Update (2026-03-20) — PR-AI-CREATE-01 Implementation Baseline (`/create` Harmonization)

- `/create` folgt jetzt sichtbar dem kanonischen Freistart-Entry; der primaere UX-Split `manual/source/ai` ist entfernt und bleibt nur als Legacy-Kompatibilitaet lesbar.
- Analyze-Flow ist als typed Orchestrierungs-Snapshot verfuegbar:
  `intake`, `quality`, `graph_matching`, `cta_suggestions`.
- `/api/contributions/analyze` liefert zusaetzlich ein typed `createAnalyze`-Payload mit:
  `schemaVersion`, `runId`, `inputType`, `languages`, `claims`, `evidenceNeeds`, `uncertainties`, `matches`, `matchStrength`, `matchType`, `matchEntityType`, `suggestedCtas`, `requiresHumanReview`, `noAutoPublish`, `noSilentMerge`.
- `AnalyzeWorkspace` zeigt den Orchestrierungs-Snapshot explizit (Input-Typ, Qualitaetssignale, Matches, CTAs, Phasenstatus) ohne Publish-/Merge-Automatisierung.
- Request-Kompatibilitaet wurde erweitert: `preparedText` wird als Analyze-Alias akzeptiert und stabil auf `text` normalisiert.
- Legacy-Kompatibilitaet bleibt erhalten:
  alte Mode-Parameter werden weiterhin gelesen, aber in den kanonischen Freistart-/Orchestrierungsfluss normalisiert.
- Guardrails unveraendert:
  no auto publish, no silent merge, review-first, approval-first, manual-first.
- Stage-2/Stage-3 (Self-Host/Souveraenisierung) bleiben unberuehrt und hard-deferred.

## Update (2026-03-21) — PR-AI-MATCH-11 Single Opaque History Cursor

- Der produktive History-Read-Contract fuer Prepare-Attach-Drafts ist vereinfacht:
  `GET /api/admin/create/attach-drafts/[draftId]/history` liefert fuer Pagination extern nur noch `nextCursor`.
- `nextScanCursor` ist nicht mehr Teil des externen API-Contracts.
- Cursor bleiben fuer den Client opaque; intern darf der Cursor weiterhin Scan-/Accepted-Position und Tie-Break-Information tragen.
- Cursor sind draft- und filter-gebunden (`type=all|review|apply`); Mismatch wird weiter als `invalid_history_cursor` abgewiesen.
- Lazy History Loading in der Admin-Queue nutzt pro Draft nur noch einen Cursor-State.
- Read-time Legacy-Normalisierung bleibt unveraendert aktiv:
  - `normalizedFromLegacy`
  - `legacyNormalizationReason`
- Maintenance-/Backfill-Pfad (kein neuer Produkt-Mutationspfad):
  - Utility: `apps/web/src/features/create/attachDraftHistoryBackfill.ts`
  - Script: `apps/web/scripts/create.history-backfill.ts`
  - Default: dry-run
  - Apply nur explizit (`--apply` oder `--mode=apply`)
  - Klassifikation: `canonical_already_ok`, `normalizable`, `unsafe_to_backfill`
  - Apply bleibt idempotent als in-place Update ohne Event-Duplikate
  - Unsichere/ambige Rows werden nur reportet, nicht blind umgeschrieben
- Guardrails bleiben unveraendert:
  kein Auto-Apply, kein Auto-Merge, kein Auto-Publish, keine neue Produkt-Mutation.
- Stage-2/Stage-3 bleiben unberuehrt und hard-deferred.

## Update (2026-03-19) — Wave 1 Governance Foundation

- GOV-01, GOV-02 und DOCS-GOV-01 sind als Wave-1-Basis umgesetzt.
- Neue Kernmodelle fuer `Entity`, `Anlassraum` und Trust-/Publish-Gates sind im Code verankert.
- Anlassraum-Lifecycle ist als zustandsgepruefter Manual-Flow (`draft -> curated -> reviewed -> approved -> active -> archived`) verfuegbar.
- Publish-Gate ist aktiv: `reviewedBy` + `approvedBy` + Guardrails.
- Minimaler Admin-Manual-Pfad fuer Lifecycle-Transitions und manuelle Erstellung (API-first) ist vorhanden.
- Naechster Architektur-Run: **GOV-ANLASS-01** (Welle 2).

## Update (2026-03-19) — Wave 2 Core Baseline (Anlassraum/Event/Feed Review)

- Feed-Review-Queue ist als expliziter Manual-Flow erweitert (`ignore`, `attach_to_anlassraum`, `create_anlassraum_candidate`, `mark_as_weak_signal`).
- Governance-Permissions gelten jetzt auch fuer Feed-Draft-Routen (nicht mehr nur admin-only); Scope bleibt auf Entity-/Anlassraum-Kontext gebunden.
- Publish-Gate fuer Anlassraum ist gehaertet: nicht nur Quellenanzahl, sondern auch Quellenrollen, Publisher-Diversitaet, strukturierte Claims/Fragen und Weak-Signal-Korroboration.
- Event-Route kann Anlassraeume direkt erzeugen/verknuepfen (`type=event`, `originType=event`).
- GOV-ANLASS-02 Baseline aktiv: Anlassraum kann auf Dossier verlinkt werden inkl. `dossierType` (`exploration_dossier`, `decision_dossier`).
- GOV-EVENT-02 Baseline aktiv: QR-Sets koennen Anlassraum/Dossier/Round referenzieren; Protokolle koennen in Anlassraum-Struktur nachgefuehrt werden.

## Update (2026-03-19) — GOV-EVENT-02 Deepening (Protocol -> Dossier Upsert -> Round Seed Contract)

- Protokoll-Eintraege erzeugen nun einen expliziten Dossier-Upsert-Contract (`features/dossier/protocolUpsert.ts`) statt stiller direkter Dossier-Publikation.
- Bei vorhandenem Dossier-Link werden nur additive `dossier_suggestions` im Status `pending` erzeugt (reviewbar/reversibel, kein destruktives Overwrite).
- Protokoll-/Anlassraum-Kontext erzeugt einen Round-Seed-Contract (`features/topicRound/seedContract.ts`) mit Readiness-Feldern und Status `review_required`.
- QR-/Resolve-/Summary-/Event-APIs geben Follow-up/Audit-Referenzen aus (Event <-> QR <-> Protocol <-> Dossier-Upsert-Contract <-> Round-Seed-Contract).
- Manual-first bleibt unveraendert: keine automatische Live-Rundenerstellung, keine automatische öffentliche Dossier-Freigabe.

## Update (2026-03-19) — GOV-EVENT-02 Apply Layer (Dossier-Apply + Round-Handoff)

- Dossier-Upsert-Contracts haben jetzt einen manuellen Review/Apply-Pfad (`pending_review` -> `partially_applied`/`applied` -> `rejected`) mit Audit-Metadaten und expliziten Governance-Aktionen.
- Round-Seed-Contracts haben jetzt einen manuellen Handoff/Reject-Pfad (`review_required` -> `draft_created`/`rejected`); Handoff erzeugt nur einen non-public Round-Draft (`manual_review_required`).
- Neue Governance-Contract-Endpunkte (API-first): Listen/Details/Apply/Reject fuer Dossier-Upsert sowie Listen/Details/Handoff/Reject fuer Round-Seed.
- Scope- und Rollenchecks bleiben aktiv (reviewer/editorial_actor/institutional_actor/admin, keine Community-Apply-Rechte) und werden sowohl in Route-Handlern als auch Domain-Services durchgesetzt.
- Keine automatische Publikation: kein Auto-Approval, kein Auto-Publish, keine automatische Live-Runde.

## Update (2026-03-19) — GOV-EVENT-02 Hardening (E2E + Legacy Contract Policy)

- GOV-EVENT-02 hat jetzt eine dedizierte Integrationsabdeckung fuer die Kernpfade `Protocol -> Dossier-Upsert-Contract -> manual Apply` und `Protocol -> Round-Seed-Contract -> manual Handoff`.
- Legacy-/Incomplete-Contracts sind explizit policy-gebunden:
  fehlendes Ziel-Dossier fuehrt zu `contract_missing_target_dossier`; fehlendes `anlassraumId` blockiert nicht-admin Governance-Akteure mit `actor_scope_requires_anlassraum`.
- Admin bleibt kontrollierter Fallback fuer Legacy-Faelle, ohne Publish-Bypass.
- Community-Zugriff auf Apply/Handoff bleibt strikt untersagt (`actor_scope_forbidden`).

## Update (2026-03-19) — GOV-EVENT-02 Abschluss (Route Acceptance + Legacy Backfill Strategy)

- Route-Layer fuer Governance-Contracts ist jetzt explizit acceptance-getestet (list/read/apply/reject/handoff inkl. Backfill-Routen).
- Error/Response-Mapping ist als stabile Policy verankert (`apps/web/src/app/api/admin/governance/contractsError.ts`), inkl. Konfliktfaelle wie `contract_missing_target_dossier` und `contract_already_handed_off`.
- Legacy-Vertraege haben jetzt einen expliziten Admin-Backfill-Pfad:
  - Detection: `.../dossier-upsert-contracts/legacy`, `.../round-seed-contracts/legacy`
  - Remediation: `.../[contractId]/backfill` (anlassraum-/dossier-linkage, auditierbar, manuell)
- Manual-first bleibt unveraendert: kein Auto-Publish, kein Auto-Approval, keine automatische Live-Runde.

## Update (2026-03-19) — GOV-ANLASS-04 / PR-FEED-ANLASS-04 Deepening

- Feed-Review-Queue wurde operativ vertieft: neue Filter (`reviewState`, `hasAnlassraum`, `weakSignal`, `q`) und Sortierungen (`review_recent`, `review_stale`, `priority_high`) sind im Draft-List-Endpoint aktiv.
- Triage-Metadaten pro Draft sind jetzt auslieferbar (`lastReviewAction*`, `queueMeta.priorityScore`, `queueMeta.priorityBucket`, `queueMeta.pendingHours`, `queueMeta.reasons`).
- Bulk-Review-Route ist aktiv (`POST /api/admin/feeds/drafts/bulk`) fuer `ignore`, `mark_as_weak_signal`, `attach_to_anlassraum`, `create_anlassraum_candidate` mit per-item Ergebnisliste.
- Legacy-Backfill fuer `vote_drafts` ohne `anlassraumId` ist jetzt explizit und admin-safe:
  - Detection: `GET /api/admin/feeds/drafts/legacy`
  - Remediation: `POST /api/admin/feeds/drafts/[id]/backfill` (`attach` oder `create_candidate`)
- Governance-/Manual-first-Regeln bleiben unveraendert: keine Auto-Publikation, keine Auto-Approval, keine Scope-Aufweichung.

## Update (2026-03-19) — PR-FEED-ANLASS-05 Deepening (Manual Output-Prep Workflow)

- Output-Seed-Preparation ist jetzt als expliziter API-Flow vorhanden:
  `GET /api/admin/feeds/anlassraum/[id]/outputs` (List/Filter) und
  `POST /api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition` (manuelle Transition).
- Output-Prep-Statusraum ist operationalisiert:
  `draft -> queued/review -> ready -> published -> discarded` (inkl. `reset_draft`).
- Transitionen sind governance- und gate-gebunden:
  `mark_ready`/`publish` verlangen `reviewState=approved` und erfolgreiches Anlassraum-Publish-Gate.
- Error-Mapping fuer Output-Prep-Routen ist stabilisiert:
  `apps/web/src/app/api/admin/feeds/anlassraum/outputPrepErrors.ts`.
- Route-Acceptance ist hinzugefuegt:
  `apps/web/tests/anlassraum-output-prep.routes.test.ts`
  (valid transitions, gate-block, forbidden scope, invalid ids/states, bypass-block).
- Manual-first bleibt unveraendert:
  kein Auto-Publish, kein Auto-Approval, kein direkter Feed-Ingest -> Public-Publish.

## Update (2026-03-19) — PR-FEED-ANLASS-05 Abschluss (Admin Surface + Service Integration)

- Output-Prep ist jetzt ohne Raw-API-Calls operabel:
  `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx` listet Output-Seeds inkl. Status/Review/PublishTarget/LastAction und erlaubt manuelle Transitionen.
- Service-Level-Integration wurde gegen reale Domainlogik abgesichert:
  `apps/web/tests/anlassraum-output-prep.service.test.ts`
  (Sequenz-Transitions, Gate-Blocking, Invalid-State-Blocking, Non-Approver-/Scope-Blocking).
- Route-Acceptance bleibt bestehen:
  `apps/web/tests/anlassraum-output-prep.routes.test.ts`.
- Ergebnis: PR-FEED-ANLASS-05 Baseline ist funktional geschlossen, weiterhin strikt manual-first.

## Update (2026-03-19) — PR-FEED-ANLASS-06 Deepening (Legacy Draft Backfill UX + Audit)

- Legacy-Remediation ist jetzt operabel im Admin-Drafts-Surface:
  `apps/web/src/app/admin/feeds/drafts/page.tsx` listet unlinked Drafts aus `GET /api/admin/feeds/drafts/legacy` und erlaubt per Draft:
  `attach` (mit expliziter Anlassraum-ID) oder `create_candidate`.
- Audit-Sichtbarkeit fuer Remediation wurde sichtbar gemacht:
  `lastReviewAction`, `lastReviewActionBy`, `lastReviewActionAt`, `reviewNote`, Weak-Signal-Status und Queue-Triage-Reasons.
- Backfill-Response liefert expliziten Remediation-Typ:
  `attached_existing_anlassraum` oder `created_candidate_anlassraum`.
- Service-Hardening wurde mit echter Domainlogik getestet:
  `apps/web/tests/feed-backfill.service.test.ts`
  (attach/create_candidate, no publish side effect, retry-block, admin-only, attach target required).
- Route-Acceptance fuer Legacy-/Backfill-Routen wurde erweitert:
  `apps/web/tests/feed-review.routes.test.ts`.

## Update (2026-03-19) — PR-0035 Deepening (Create IA v2 mode split)

- `/create` nutzt jetzt einen kanonischen Create-Mode-Split: `manual`, `source`, `ai` (Single Source: `features/create/intents.ts`).
- Legacy-Mode-Werte (`ai_assist`, `feed`, `cluster`) werden kompatibel auf den kanonischen Modus normalisiert, ohne stillen Intent-Verlust.
- Mode wird entlang des Create-Flows mitgefuehrt:
  Analyze-Request (`createMode`), Draft-Save (`contribution_drafts.createMode`) und Finalize-Propagation (`statement_proposals.createMode`).
- Save/Finalize validieren `createMode` explizit; ungueltige Werte liefern stabil `invalid_create_mode` (400).
- Manual-first bleibt unveraendert: AI-Mode ist nur Drafting-Intent, ohne Auto-Publish oder Auto-Approval.

## Update (2026-03-19) — PR-0036 Deepening (Runden Entry auf produktive Quelle)

- `/runden` ist von statischen TopicRound-Seeds entkoppelt; die Entry-Surface nutzt jetzt ein produktives Read-Model statt `features/topicRound/data.ts`.
- Neue produktive Quelle:
  `features/topicRound/entrySource.ts` liest `output_seed` (`outputType=round_seed`) + `anlassraum`, normalisiert Legacy-/unvollstaendige Datensaetze defensiv und liefert stabile Entry-Objekte.
- Minimale API fuer Entry-Read:
  `GET /api/runden/entry` (inkl. stabiler Fehler-/Validierungsantworten fuer `invalid_limit` und `round_entry_source_unavailable`).
- `/runden` zeigt jetzt explizite Zustaende statt Demo-Fallback:
  - produktive Liste
  - expliziter Empty-State bei `0` Datensaetzen
  - expliziter Error-State bei Source-Ausfall
- Testabdeckung hinzugefuegt:
  - `apps/web/tests/runden-entry.service.test.ts` (produktive Daten, leerer Bestand, Legacy-Normalisierung, Source-Failure)
- `apps/web/tests/runden-entry.route.test.ts` (Route-Response-Mapping inkl. `invalid_limit`/`503`)
- Governance bleibt unveraendert: kein Auto-Publish, kein Auto-Approval, kein Public-/Live-Bypass; AI/Source/Manual bleiben manual-first.

## Update (2026-03-19) — PR-0037 Backward-Compatibility (`/demo/runden` -> `/runden`)

- Kanonischer Entry-Pfad fuer Runden ist jetzt explizit `/runden` (produktive Quelle), ohne Demo-/Seed-Fallback.
- Legacy-Demo-Pfad wurde auf kompatibles Verhalten umgestellt:
  `apps/web/src/app/demo/runden/page.tsx` redirectet explizit auf `/runden` mit Compat-Marker (`compat=demo_runden`) und optionalem `view`.
- Demo-Linkziele wurden auf den kanonischen Pfad gehoben:
  - `apps/web/src/app/demo/page.tsx` (`/runden` statt `/demo/runden`)
  - `apps/web/src/app/demo/DemoNavClient.tsx` (`/runden` als produktiver Einstieg)
- `/runden` zeigt bei Compat-Redirect einen klaren Hinweis, dass kein Demo-Seed-Fallback mehr existiert.
- Fokus-Tests fuer Compatibility-Matrix aktiv:
  - `apps/web/tests/runden-compat.demo-route.test.ts`
  - `apps/web/tests/runden-compat.links.test.ts`
- Guardrails bleiben unveraendert:
  kein Auto-Publish, kein Auto-Approval, kein Public-/Live-Bypass.

## Update (2026-03-19) — PR-0038 E2E-Abnahme (`/create` + `/runden`)

- Akzeptanzabdeckung fuer den produktiven Einstieg ist jetzt aktiv:
  - `/demo/runden` Redirect-Compat (`/runden?compat=demo_runden`, inkl. Query-Mapping)
  - `/runden` Empty-/Error-State ohne Seed-/Demo-Fallback
  - `/create` kanonische Modus-Auswahl `manual|source|ai` (UI-Reflexion + Weitergabe in Save/Finalize)
- Save-/Finalize-Routen sind mit stabilen Mode-Regeln abgesichert:
  - gueltige Modi werden persistiert/propagiert
  - ungueltige Modi liefern stabil `invalid_create_mode` (400)
- Handoff-Boundary bleibt unveraendert:
  kein Auto-Publish, kein Auto-Approval, kein direkter Write-Pfad aus Create in `output_seed`/Live-Runden.
- Testabdeckung:
  - `apps/web/tests/create-mode.page.test.ts`
  - `apps/web/tests/create-mode.save.route.test.ts`
  - `apps/web/tests/create-mode.finalize.route.test.ts`
  - `apps/web/tests/runden-page.acceptance.test.ts`
  - plus bestehende `/runden` Service/Route/Compat-Suiten.

## Update (2026-03-19) — PR-0039 Community Group Surfaces entkoppeln

- Community-Group-Reads sind aus der Page-Logik in einen dedizierten Resolver verlagert:
  `apps/web/src/features/community/groupSurface.ts`.
- Neue explizite Read-Route ist aktiv:
  `GET /api/community/groups`
  mit stabilen Fehlercodes fuer Param-Validation (`invalid_group_type`/`invalid_group_scope`) und Source-Unavailable (`community_group_source_unavailable`).
- `/community` nutzt jetzt den produktiven Resolver-Read-Shape statt Inline-Mix; Empty-/Unavailable-States sind explizit.
- Demo-/Seed-Fallback fuer Dossier-Linking wurde entfernt (`/dossier/demo` nicht mehr Teil des Group-Surfaces).
- Guardrails bleiben unveraendert:
  kein Auto-Publish, kein Auto-Approval, keine Hidden-Mutation in Read-Surfaces.
- Testabdeckung:
  - `apps/web/tests/community-groups.resolver.test.ts`
  - `apps/web/tests/community-groups.route.test.ts`
  - `apps/web/tests/community-page.states.test.ts`
  - `apps/web/tests/community-groups.no-demo-fallback.test.ts`

## Update (2026-03-19) — PR-0040 Community Deep-Link Contracts vereinheitlichen

- Kanonischer Deep-Link-Contract wurde zentralisiert:
  `apps/web/src/features/community/deepLinkContract.ts`.
- Kanonische Parameter sind jetzt eindeutig:
  `group`, `type`, `scope`, `topicKey`, `topicLabel`, `dossierId`, `dossierTitle`, `regionLabel`, `reasonLabel`, `communityLabel`.
- Legacy-Aliasse bleiben kompatibel lesbar und werden normalisiert:
  `topic -> topicKey`, `dossier -> dossierId`, `region -> regionLabel`, `reason -> reasonLabel`, `communityKey -> group`.
- Page + Route + Resolver nutzen denselben Contract:
  - `apps/web/src/app/community/page.tsx`
  - `apps/web/src/app/api/community/groups/route.ts`
  - `apps/web/src/features/community/groupSurface.ts`
- Outgoing `/community?...` Links wurden kanonisiert:
  - Discovery-Hrefs in `groupSurface.ts`
  - Inbox-/Match-Deep-Links in `apps/web/src/app/account/AccountClient.tsx`
- Stabiles Invalid-Handling:
  - API: `400` fuer `invalid_group_type`, `invalid_group_scope`, `invalid_group_context`
  - Page: expliziter Invalid-State, kein stiller Fallback
- Guardrails unveraendert:
  kein Demo-/Static-Fallback, keine Mutation/Write-Pfade, kein Publish-/Approval-Bypass.
- Testabdeckung erweitert:
  - `apps/web/tests/community-deep-links.contract.test.ts`
  - `apps/web/tests/community-groups.resolver.test.ts`
  - `apps/web/tests/community-groups.route.test.ts`
  - `apps/web/tests/community-page.states.test.ts`

## Update (2026-03-19) — PR-0041 Community E2E absichern (mobile + desktop)

- Community Read-Surfaces sind als Acceptance-Baseline fuer A-F abgesichert:
  Canonical Group-Link, Discovery, Source-Unavailable, Invalid Params, Legacy-Alias-Lesbarkeit, Read-only Boundary.
- Page-Layer deckt mobile/desktop-relevante Render-States explizit ab (Discovery/Group/Empty/Unavailable/Invalid), inkl. responsiver Klassen:
  `md:grid-cols-2`, `lg:grid-cols-[1.25fr_1fr]`, `sm:grid-cols-2`.
- Invalid-Deep-Link-Matrix ist route- und page-seitig stabil:
  `invalid_group_type`, `invalid_group_scope`, `invalid_group_context`.
- Legacy-Alias-Kompatibilitaet bleibt lesbar (`topic`, `dossier`, `region`, `reason`, `communityKey`) und wird in kanonische Felder normalisiert.
- Outgoing Community-Deep-Links bleiben kanonisch (`topicKey`, `dossierId`, `regionLabel`, `reasonLabel`; keine Alias-Emission).
- Guardrails unveraendert:
  kein Demo-/Static-Fallback, keine Mutation/Write-Pfade, kein Publish-/Approval-Bypass.
- Testabdeckung:
  - `apps/web/tests/community-deep-links.contract.test.ts`
  - `apps/web/tests/community-groups.resolver.test.ts`
  - `apps/web/tests/community-groups.route.test.ts`
  - `apps/web/tests/community-page.states.test.ts`
  - `apps/web/tests/community-groups.no-demo-fallback.test.ts`
  - `apps/web/tests/community-readonly-boundary.test.ts`

## Update (2026-03-19) — PR-FEED-ANLASS-02 Feed/Anlassraum Picker im `/create`

- `/create` hat jetzt einen manuellen produktiven Kontext-Picker (read-only, kein Demo-/Static-Fallback).
- Dedizierter Read-Pfad aktiv:
  `GET /api/create/context` mit stabilen Antworten fuer
  `invalid_limit` (400), `invalid_anlassraum_id` (400) und `create_context_source_unavailable` (503).
- Picker-Read-Model ist zentralisiert:
  `apps/web/src/features/create/contextPicker.ts` (Produktivquelle aus `output_seed`/`anlassraum`, nur aktive + selektierbare Kontexte).
- Picker-UI ist minimal in `/create` verdrahtet:
  `apps/web/src/app/create/CreateClient.tsx` zeigt Liste/Empty/Unavailable, explizite Auswahl/Entfernung und sichtbare `anlassraumId`.
- Auswahl bleibt strikt manuell:
  kein Save/Finalize-Trigger durch Selektion, keine DB-Mutation durch Picker-State.
- Propagation ist explizit und nachvollziehbar:
  `selectedAnlassraumId` -> `AnalyzeWorkspace` -> Analyze/Save/Finalize-Payload (`anlassraumId`).
- Save/Finalize/Analyze validieren Kontext-IDs stabil (`invalid_anlassraum_id`), ohne Auto-Linking, Auto-Publish oder Auto-Approval.
- Testabdeckung erweitert:
  - `apps/web/tests/create-context-picker.service.test.ts`
  - `apps/web/tests/create-context-picker.route.test.ts`
  - `apps/web/tests/create-mode.page.test.ts`
  - `apps/web/tests/create-mode.save.route.test.ts`
  - `apps/web/tests/create-mode.finalize.route.test.ts`
  - `apps/web/tests/create-mode.analyze-parse.test.ts`

## Update (2026-03-19) — PR-FEED-ANLASS-03 Feed/Anlassraum Cluster-Job

- Dedizierter produktiver Cluster-Job ist als eigener Domain-Service umgesetzt:
  `features/feeds/clusterJob.ts`.
- Explizite, inspectable Cluster-Candidates werden persistent geschrieben in:
  `feed_anlassraum_cluster_candidates` (Index/Collection-Wiring in `features/feeds/db.ts`).
- Schmaler manueller Runner ist aktiv:
  `POST /api/admin/feeds/cluster/run`
  (`apps/web/src/app/api/admin/feeds/cluster/run/route.ts`).
- Ergebnisobjekte bleiben explizit und idempotenzfreundlich:
  `status: success|empty`, `action: created|updated|unchanged`, inkl. stable source/error mapping.
- Guardrails bleiben unveraendert:
  kein Auto-Publish, kein Auto-Approval, keine Live-/Round-Erstellung, keine Hidden-Migration.
- Testabdeckung:
  - `apps/web/tests/feed-cluster-job.service.test.ts`
  - `apps/web/tests/feed-cluster-job.route.test.ts`

## Status-Übersicht der Pfade 00–15

- **Part00 Foundations / PII:** PII-Guardrails plus Klarname-Trennung (givenName/familyName) und Privacy-Flags dokumentiert; Alt-Migration optional.
- **Part01 Systemvision / Governance:** Leitplanken + 15 Themenkategorien als Backbone verankert.
- **Part02 Rollen / XP / Gamification:** XP-Anbindung fuer Research/Streams/Campaigns aktiv; Profil-Freischaltungen pro Engagement-Level im Profil-UI wirksam.
- **Part03 Access Tiers & Pricing:** Grundlogik aktiv; Profil-Pakete als Darstellungs-Dimension vorhanden und an Tiers gemappt (basic/pro/premium).
- **Part04 B2G/B2B Modelle:** Begriffe mit Profil-Paket-Namen harmonisiert; Campaigns/Streams als Betriebsbasis aktiv.
- **Part05 Orchestrator (Block A):** Gemini-Provider aktiv, rollenspezifische Prompts (citizen/staff/institution) und Health/Score-Tracking umgesetzt.
- **Part06 Consequences (Block B):** Modelle, Persistenz, API und UI fuer Responsibility/Consequences umgesetzt.  
- **Part06 Themenkatalog & Zuständigkeiten:** 15 Hauptkategorien verbindlich; `TOPIC_CHOICES`-Abgleich in Profil/Onboarding/Filter umgesetzt.
- **Part07 Graph & Reports (Block C):** Graph-Sync + Neo4j-Connector aktiv; Admin-Impact-Reports nutzen echte Graph-Daten.
- **Part08 Eventualities (Block D):** Eventuality-/DecisionTree-Typen, Persistenz, Admin-UI und Analyze-API implementiert.
- **Part09 Research Workflow (Block E/R2):** R2 umgesetzt: Seeding aus Questions/Knots, Filter/Sortierung, Contributor-Feedback, Graph-Backflow und Anti-Spam-Cooldown.
- **Part10 Responsibility Navigator (Block B):** Directory/Paths + Navigator + Admin-UI vorhanden.
- **Part11 Streams (Block F):** Stream-Modelle, Routes/UI, Agenda/Overlay und XP-Gating vorhanden.
- **Part12 Campaigns (Block G + I):** Campaign-Modelle, Admin-UI, Join/QR-Flow (MVP) plus Unterstuetzen/Crowdfunding-Flow implementiert.
- **Part13 I18N/A11y/Social (Block H):** I18N-Infra aktiv, A11y-Seiten vorhanden, Community/Chat-Skeleton ergänzt.
- **Part14 Implementation Roadmap:** Dient als Arbeitsmodus; Block-Reihenfolge beachten.
- **Part15 Codex Safe Mode:** Leitplanken aktiv; keine offenen Tasks, aber stets befolgen.

## Drift-Plan Audit (2026-02-12)

Diese Liste spiegelt alle vorhandenen Drift-Prompts aus `.codex/drifts/`.  
Status basiert auf Repo-Evidenz (Dateien/Routes/Modelle). Offener Arbeitsstand bleibt in `docs/E150/OpenTasks.md`.

| Drift | Ziel | Evidenz im Repo | Status | Naechster Schritt |
| --- | --- | --- | --- | --- |
| PR-0009 | Pilot Backbone (Feeds → Kandidaten → Faktencheck → Graph/Dossier) | `docs/E150/Pilot.md`, `/api/feeds/pull`, `/api/feeds/analyze-pending`, `features/feeds/*`, `/admin/feeds/drafts`, `/api/factcheck/enqueue`, `/admin/pilot`, `/api/admin/pilot/settings`, `/api/admin/pilot/run`, `core/pilotSettings/*` | Implemented | Monitoring/Polish |
| PR-0010 | Admin Akquise Dashboard (Feeds/Regionen) | `/admin/acquisition`, `/api/admin/acquisition`, `core/acquisition/*` | Implemented | Monitoring/Polish |
| PR-0011 | Offene Beitraege (Quelle/Option/Frage) | `/community/contributions`, `/admin/contributions`, `/api/community/contributions`, `/api/admin/community/contributions*`, `core/communityContributions/*` | Implemented | Monitoring/Polish |
| PR-0012 | Media Ready Projekte (3–5 Themen, min 5 Optionen) | Projekt-Modelle + API/Pages aktiv | Implemented | Monitoring/Polish |
| PR-0013 | Live/Chat Skeleton | `/live`, `/api/live`, `/api/chat`, `core/liveChat/*` | Implemented | Monitoring/Polish |
| PR-0030 | Unterstuetzen/Crowdfunding | `/support/[slug]`, `/admin/support` + Support-API vorhanden | Implemented | Nur Monitoring/Polish |

## Aktueller Stand (Februar 2026)

- `/contributions/new` rendert wieder mit SiteShell, Citizen-Core-Text und sauberem Login-Redirect statt JSON-403; Credits/Gating basieren auf `AccountOverview`.
- Login & Registrierung schreiben Name + Kontakt direkt in `pii.user_profiles` (givenName/familyName, birthDate ready), sodass Mitgliedsanträge nicht mehr ohne PII bleiben.
- `/pricing` ist die kanonische Landing fuer Pakete/Preise/Add-ons; `/mitglied-werden` ist Legacy und redirectet auf `/pricing`.
- `/mitglied-antrag` bleibt der Mitgliedschafts-Antrag (Wizard, Pflichtfelder, Bankdaten/Verwendungszweck, optional 25%-Rabatt je nach Rule).
- `/api/membership/apply` erstellt einen Antrag (`membership_applications`), aktualisiert `users.membership.lastApplication`, speichert Adresse/Birthdate/Telefon in PII und verschickt Bankdaten + Verwendungszweck per Mail.

## Run-Plan nach Part15 (Block-Status & Definition of Done)

| Block | Bezug | Status | Definition of Done |
| --- | --- | --- | --- |
| **A – Orchestrator (E150 Core Provider)** | Part05 | **Done** | Gemini-Provider aktiv, rollenspezifische Prompts (citizen, staff, institution), Health-/Score-Tracking in `orchestrator_health.ts`; SSE bleibt intakt. |
| **B – Consequences & Responsibility Navigator** | Part06/10 | **Done** | Modelle + Persistenz + API (`/api/responsibility/[id]`, `/api/consequence/[id]`); `ResponsibilityNavigator.tsx` + Admin-Views fuer Directory/Paths. |
| **C – Graph & Reports** | Part07 | **Done** | `core/graph/syncAnalyzeResult.ts` (AnalyzeResult → Graph), Neo4j-Connector, `/admin/graph/impact` mit echten Graph-Stats. |
| **D – Eventualities / DecisionTree** | Part08 | **Done** | Typen `Eventuality`/`DecisionTree`, Persistenz + Admin-UI, API `/api/eventualities/analyze`. |
| **E (R2) – Research Workflow** | Part09 | **Done** | Seeding aus Questions/Knots (Admin-Seed); Filter-/Sortier-API (`/api/research/list` + `/api/research/tasks/list`); Contributor-Feedback („Hilfreich?“); Graph-Backflow bei akzeptierten Beiträgen; Anti-Spam-Cooldown. |
| **F – Streams** | Part11 | **Done** | Stream-Modelle + Sessions/Agenda/Overlay, UI, XP-Gating & Host-Checks vorhanden. |
| **G – Campaigns** | Part12 | **Done** | Campaign-Modelle + Admin-UI, `/campaign/[id]/join` + Join-API (MVP). |
| **H – I18N / A11y / Social** | Part13 | **Done** | I18N-Infra aktiv, A11y-Seite vorhanden, Community/Chat-Skeleton ergänzt. |
| **I – Unterstuetzen/Crowdfunding** | Part12/14 | **Done** | Support pro Campaign/Projekt live: Pledge + Zahlungsreferenz + Admin mark-paid + oeffentlicher Fortschritt, ohne Einfluss auf Votes/XP/Credits. |

## Historische Abfolge (abgeschlossen)

Die folgenden Punkte dokumentieren die abgeschlossene Reihenfolge der Bloecke. Keine neuen Runs hieraus ableiten; `docs/E150/OpenTasks.md` ist kanonisch.

1. **Block A erledigt** (Part05): Gemini-Provider + rollenspezifische Prompts + Health/Score (PR-0018).
2. **Block B erledigt** (Part06/10): Consequences/Responsibility inkl. API, Navigator-UI, Admin (PR-0019).
3. **Block C/D erledigt** (Part07/08): Graph-Sync & Eventualities/DecisionTrees (PR-0020).
4. **Block F/G/H erledigt (MVP)** (Part11/12/13): Streams/Campaigns/I18N-A11y-Social (PR-0020).
5. **Block I erledigt** (Part12/14): Unterstuetzen/Crowdfunding End-to-End (PR-0030).

## Verbindliche Steuerdateien

1. `docs/E150/OpenTasks.md`
   - Single Source of Truth fuer offene Arbeitspakete, Status und Reihenfolge.
2. `docs/E150/Pflichtenheft.md`
   - Pflichtenheft mit Scope, Definition of Done und Abnahmeregeln pro Bereich.
3. `docs/E150/Part14_Implementation_Roadmap.md`
   - Technische Blockreihenfolge inklusive DoD.
4. `docs/E150/Part15_Codex_Safe_Mode.md`
   - Safe-Mode-Guardrails inklusive Profilregeln fuer Ausnahme-Runs.

## Doku-Hygiene (2026-02-12)

- Part14/Part15/Part09 wurden auf konsistente Statusaussagen abgeglichen.
- `docs/E150/OpenTasks.md` wurde als kanonisches Aufgabenboard angelegt.
- `docs/E150/Pflichtenheft.md` wurde als verbindlicher Liefer- und Abnahmerahmen ergaenzt.
- **Lokal-Guardrails**: `.envrc` bleibt minimal (nur `dotenv_if_exists` + `export`, keine Commands).  
  Login/Session-Checks erfolgen immer ueber `GET /api/auth/me` und `GET /api/admin/system/ping`.  
  Optionaler Dev-Debug-Endpoint (`/api/auth/debug`) ist erlaubt, aber nur in `development`.

## Optionaler Nachlauf (kanonisch in OpenTasks)

- Social Preview: OG-Defaults aktiv; Detailseiten wie Reports/Archiv noch sukzessive erweitern.
- Page Contracts (CI): `missing-h1`-Allowlist abgebaut; optional nur noch bei neuen Checks relevant.
- Type Hygiene (Pages): restliche `any`-Verwendungen in `page.tsx` reduzieren.
- Admin Navigation: Kontextaktionen (Massenaktionen/Drilldown) erweitern.
- Swipes Analytics: Vote-Aggregationen fuer Admin-Reports verfeinern.
- Public Profile Polish: Avatar/Cover Upload + Impact-Ansicht fuer Buerger:innen.

### Identity & Profile (aus Part00–04 abgeleitet)

Status (Zusammenfassung):

1. **PII-Schema um Vor-/Nachname erweitern**  
   - `pii.users.personal.givenName` + `familyName` aktiv.  
   - `displayName` wird nur als Ableitung genutzt; PII-Split via `ensureBasicPiiProfile` erfolgt bei Login/Register/Membership.  
   - Alt-Migration (historische `name`-Felder) optional, falls Bestandsdaten migriert werden muessen.

2. **Profil-Datenstruktur in Core einführen**  
   - `core.users.profile` mit `headline`, `bio`, `avatarStyle`, `topTopics[]`, `publicFlags.*`, `publicLocation`, `publicShareId`.  
   - API `/api/account/profile` (GET/PATCH) aktiv.

3. **TOPIC_CHOICES an 15 Kategorien ausrichten**  
   - Zentrale Definition `TOPIC_CHOICES` in `features/interests/topics.ts` ist konsistent.  
   - Verwendung in Profil-API/Streams-Topics aktiv.

4. **Profil-Freischaltungen nach Engagement-Level umsetzen**  
   - UI-Gating im Profil: Top-Themen erst ab Level „engagiert“.  
   - Gamification-Logik nutzt nur XP, niemals personenbezogene PII.

5. **Profil-Pakete und Pricing verknüpfen**  
   - Mapping Access Tier → Profil-Paket aktiv (`basic`/`pro`/`premium`).  
   - Paketnamen sind vereinheitlicht (basic/pro/premium) und werden ueberall genutzt.

6. **Account-/Profil-Seiten aufräumen**  
   - `/account` bleibt private Einstellungsseite (PII-gebunden).  
   - `/profile` leitet auf public Share-View (`/profile/[shareId]`) oder auf Account, wenn kein Share aktiv.  
   - Hinweis im UI bleibt: „Du siehst dein Profil so, wie andere es sehen.“

Diese Liste ist eine Zusammenfassung. Offener Arbeitsstand und Prioritaeten stehen ausschliesslich in `docs/E150/OpenTasks.md`.

### Block M – Membership Apply (Restpunkte)

Stand:
- Admin-Statuspflege + Verbuchen/Kuendigen aktualisieren User-Snapshot und Events.
- Household-Invites respektieren gesperrte Memberships; Pending-Invites werden im Admin-Overview angezeigt.
- Payment-CTAs im Account aktiv.

Status: Done.

### Block I – Unterstuetzen/Crowdfunding (neu)

Funktion (Skizze):
- Campaign/Projekt kann optional ein Support-Ziel haben.
- Nutzer:innen erstellen Pledges und erhalten Zahlungsreferenz.
- Admin verbucht Zahlung, Fortschritt wird aggregiert angezeigt.
- Harte Leitregel: keine Stimme, keine XP, keine Prioritaet gegen Geld.

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Campaign-Infrastruktur | SupportCampaign/SupportPledge + Indexes aktiv | Optional: weitere Target-Typen live nutzen |
| Zahlungsprinzip | Zahlungsreferenz + mark-paid/cancel aktiv | Optional: Guided Payment UX |
| Public-Produkt | `/support/[slug]` + Campaign-CTA aktiv | Optional: erweiterte Trust-/Transparenzmodule |
| Admin-Betrieb | `/admin/support` + Detail + CSV aktiv | Optional: Bulk-Verbuchung |

## PR-Log

### PR-CREATE-WORKFLOW-LIVE-QA-01 / PR-CREATE-VISUAL-PARITY-ANALYZE-01 (2026-05-10) – Embedded Analyze Scene + Action Bar Parity

Ziel:
- Den eingebetteten Analyze-/Finalize-Teil von `/create` als denselben Arbeitsraum weiterfuehren und die mobile/Desktop-CTA-Fuehrung bis in den AnalyzeWorkspace hinein beruhigen.

Changes:
- `apps/web/src/app/create/CreateClient.tsx`
  - `CreateInlineAnalysisScene` auf dieselbe Card-/Border-Sprache wie der vorherige `/create`-Follow-up zurueckgenommen; weniger buehnenhaft, mehr Arbeitsraum.
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
  - neue Helper `shouldRenderCompactEmbeddedWorkspaceHeader` und `shouldUseInlineCreateActionBar`.
  - im `analysisEntryVariant="single_button"` wird der grosse Workspace-Hero durch einen kompakten Header `Im selben Arbeitsraum` ersetzt.
  - der bisher globale fixe Finalize-Balken schaltet im eingebetteten Create-Pfad auf `inline + lg:sticky` um; Mobile bleibt erreichbar, aber ohne grosses Overlay.
  - Save-/Finalize-Feedback sitzt im eingebetteten Pfad jetzt direkt am Abschlussblock; die obere Save-CTA wird dort ausgeblendet, sobald die Abschlussleiste aktiv ist.
- Tests nachgezogen in:
  - `apps/web/tests/create-analyze.workspace-ui.test.ts`
  - `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`

Verification:
- `pnpm -C apps/web exec vitest run tests/create-analyze.workspace-ui.test.ts`
- `pnpm -C apps/web exec vitest run tests/analyze-workbench-hidden-until-start.test.ts`
- `pnpm -C apps/web exec vitest run tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `pnpm -C apps/web run typecheck`
- Browser-Addendum: echter `/create`-Run mit kommunalem Beispieltext bestaetigt im Follow-up die Badge-Zeile `Deine Struktur auf einen Blick`, konkrete Bedarfspunkte statt generischem `Kern: Fragestellung` und nach `Quellenpruefung vorbereiten` den eingebetteten Analysekopf `Im selben Arbeitsraum` ohne zweiten Hero.

Next Steps:
- Echter browsernaher Matrixlauf fuer `/create` bleibt offen: Link-/YouTube-/PDF-/Upload-, Save-/Finalize- und Rueckweg-Pfade aktiv im Browser pruefen.
- Screenshot-/Viewport-Abgleich fuer 390px und Desktop auf dem jetzt harmonisierten Analyze-/Follow-up-Uebergang nachziehen.

### PR-CREATE-GPT-PLANNER-GRAPH-FIRST-01 (2026-05-10) – Planner-first fachliche Vorentscheidung im Fast-Follow-up

Ziel:
- Den ersten fachlichen Schritt in `/create` als nicht-mutative Planner-Vorstufe verankern, damit breite oder spezialisierte Freitexte nicht mehr in fachfremde Demo-Fallbacks kippen.

Changes:
- `apps/web/src/features/create/createPlanner.ts`
  - neuer lokaler Planner-First-Step fuer `/create`.
  - liefert `plannerTopic`, `plannerCore`, `plannerScope`, `plannerStance`, `plannerClusters`, `plannerOpenQuestions`, `recommendedLane`, `providerPlan`.
  - OpenAI ist als `planner_only` vorbereitet; bei Ausfall greift ein neutraler heuristischer Fallback.
- `apps/web/src/features/create/intelligentFollowup.ts`
  - Planner wird vor `analyzeContribution` ausgefuehrt und anschliessend in Summary, Topics, Statements, Scope und Open Question gemerged.
  - Meta enthaelt jetzt `planner` plus bestaetigungspflichtigen `graphMatch`-Plan fuer `after_structure`.
- `apps/web/src/features/create/intelligentFollowupContract.ts`
  - Follow-up-Meta und Planner-getriebene Strukturast-Bildung erweitert.
  - Tierwohl-/Import-/EU-/Kennzeichnungs-Cluster koennen direkt als Strukturäste erscheinen.
- `apps/web/src/features/create/createConnectionSuggestions.ts`
  - fachfremde Amtstraeger-Defaults entfernt; neutrale oder planner-getriebene Titel statt pauschalem Officeholder-Fallback.
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - Erstblick nutzt Planner-Core/-Open-Question fuer `Kern`, `Thema` und `Noch offen`.
  - tierwohl-spezifische Einordnung wird konkret sichtbar, ohne zweite Create-Surface.

Fachlicher Effekt:
- Das Video-Beispiel zu Tierschutz/Tierhaltung wird jetzt als `Tierschutz, Tierhaltung und Agrarstandards` mit konkreten Clustern, EU/Bund/internationalem Scope und offener Produkt-/Kontrollfrage eingeordnet.
- `mindestens in den Ländern, aus denen wir importieren` fuehrt nicht mehr zu `Amtsträger`.
- Explizite Amtstraeger-Texte koennen weiterhin in den Officeholder-Pfad gehen.

Verification:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-followup-tierwohl-mapping.contract.test.ts tests/create-connection-suggestions.no-domain-fallback.contract.test.ts tests/create-graph-match-after-planner.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/e150-journey-routing.contract.test.ts`

Next Steps:
- Der echte Browser-/Workflow-Matrixlauf bleibt unter `PR-CREATE-WORKFLOW-LIVE-QA-01`.
- Der aeltere breite Contract `create-intelligent-followup.contract.test.ts` sollte in einem separaten Cleanup die Planner-first-Architektur explizit mitziehen.

### PR-GOV-12 (2026-03-20) – Canonical Multi-Orchestration Flow + Hard-Deferred Sovereignty Block

Ziel:
- Architektur klar von sichtbarem Mode-Split auf einen kanonischen Orchestrierungsfluss umstellen und Stage-2/Stage-3 explizit als letzten Agenda-Block parken.

Changes:
- Superseded den Zwischenrahmen aus PR-GOV-11 dort, wo er noch als sichtbarer Mode-Split gelesen werden konnte.
- `docs/E150/Part16.md` auf kanonischen Zielstand umgestellt:
  - ein gemeinsamer Produktfluss statt primaerer `manual/source/ai`-Nutzermodi
  - fuenf spezialisierte Unter-Orchestrierungen
  - verpflichtender Meta-Layer (Audit/Governance/Provenance/Bias-Risk/Layman Explanation)
  - Language-aware Regeln inkl. Cross-lingual Matching
  - Canonical Prompt Contracts mit typed Soll-Ausgaben fuer alle Kern-Orchestrierungen + Graph-Matching/CTA.
- `docs/E150/OpenTasks.md` synchronisiert:
  - Legacy-Mode-Split sichtbar als superseded intermediate state markiert
  - GOV-AI-01 bis GOV-AI-07 als offene/planned/canonical Architektur-Tasks aufgenommen
  - Hard-last-Regel im Run-Abschnitt verankert
  - STAGE-2/STAGE-3 als expliziter Schlussblock am Dateiende geparkt (nicht vorziehbar).
- Keine Re-Priorisierung von Stage-2/Stage-3 ohne explizite User-Entscheidung und ohne vollstaendige operative Baseline.

Verification:
- Docs-only Run: keine UI-/API-/Domain-Aenderung.
- Konsistenzpruefung in:
  `docs/E150/Part16.md`, `docs/E150/OpenTasks.md`, `docs/E150/Part15.md`.

Next Steps:
- GOV-AI-01 bis GOV-AI-04 auf operative Implementierungs-Slices aufteilen.
- GOV-AI-05 bis GOV-AI-07 als typed contracts + auditfaehige Outputs vorziehen.
- Stage-2/Stage-3 bis zum erreichten Kernbetrieb geparkt halten.

### PR-GOV-11 (2026-03-20) – Freistart + verpflichtende Qualitaetsschicht + Multi-Orchestrierung kanonisiert

Ziel:
- Kanonischen Architekturentscheid dokumentieren: Freistart statt primaerer Mode-Wahl, verpflichtende Qualitaetsschicht, verpflichtendes Graph-Matching + CTA-Layer.

Changes:
- Neue kanonische Architektur-Doku angelegt:
  `docs/E150/Part16.md`
  mit Produktentscheid, Plattformregeln, Match-/CTA-Schicht, Anlassraum-Workbench, Multi-Orchestrierungen, Governance-Transparenz.
- `docs/E150/OpenTasks.md` aktualisiert:
  - frueheren Task `Create IA v2 ... manual/source/ai` als
    `Superseded by GOV-AI-01 (legacy mode split active, but no longer target architecture)` markiert.
  - GOV-AI-01 bis GOV-AI-05 als neue Architektur-Tasks aufgenommen.
  - Priorisierung direkt unter Wave 2 (Wave 2.5) verankert.
  - betroffene State-Machines, weiter geltende Publish-Gates und bewusst nicht automatisierte Bereiche explizit nachgefuehrt.
- Dieser PR-Log-Eintrag dokumentiert den Shift als verbindliche Referenz fuer Folge-Runs.

Verification:
- Docs-only Run: keine UI-/API-/Domain-Codeaenderung vorgenommen.
- Konsistenzpruefung der betroffenen Doku-Dateien:
  `docs/E150/Part16.md`, `docs/E150/OpenTasks.md`, `docs/E150/Part15.md`.

Next Steps:
- GOV-AI-01 starten: `/create` auf Freistart + verpflichtende Qualitaetsschicht als produktiven Zielpfad umstellen.
- GOV-AI-02 aufsetzen: Match-Staerken + CTA-Entscheidungslayer ohne Silent-Merge.
- GOV-AI-05 vorbereiten: Provider-/Residency-Matrix fuer DSGVO-konformen Orchestrierungsbetrieb.

### PR-GOV-01 (2026-03-19) – Wave 1 Governance Foundation (GOV-01/GOV-02/DOCS-GOV-01)

Ziel:
- Gemeinsames Governance-Basismodell fuer Entity/Anlassraum/Trust herstellen und publish-gated verankern.

Changes:
- Neue Domain-Module: `features/entities/*`, `features/trust/*`.
- Anlassraum auf Wave-1-Felder und Lifecycle erweitert (`features/anlassraum/types.ts`, `service.ts`, `stateMachine.ts`, `governance.ts`).
- Admin-Transitions fuer Anlassraum (Review/Approve/Activate/Archive) als manueller API-Pfad:
  `apps/web/src/app/api/admin/feeds/anlassraum/[id]/transition/route.ts`.
- Governance-Permissions auf Route-Ebene geoeffnet (nicht mehr strikt admin-only) fuer:
  `reviewer`, `editorial_actor`, `institutional_actor`, `admin`
  mit Scope-Pruefung auf relevanten Entity-/Anlassraum-Kontext.
- API-first Manual-Surfaces fuer Erstellung:
  `apps/web/src/app/api/admin/governance/entities/route.ts`,
  `apps/web/src/app/api/admin/governance/anlassraum/route.ts`.
- Detail-/Listen-Surface fuer Anlassraum um publish-gate und neue Modellfelder erweitert.
- OpenTasks und Part15 auf Wave-1-Status synchronisiert.

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- Welle 2 mit **GOV-ANLASS-01** starten (Anlassraum/Event/Feed-Review Vertiefung).
- Manual-first bleibt aktiv; keine Auto-Publikation, kein Auto-Approval.

### PR-GOV-02 (2026-03-19) – Wave 2 Core Baseline (GOV-ANLASS-01/02/03/04 + GOV-EVENT-01/02)

Ziel:
- Wave-2 Kernfluss von Feed-Review ueber Anlassraum bis Event/QR-Protokoll als manuellen Basispfad verankern.

Changes:
- Feed-Review-Domain erweitert (`features/feeds/reviewQueue.ts`) mit Aktionen:
  `ignore`, `attach_to_anlassraum`, `create_anlassraum_candidate`, `mark_as_weak_signal`.
- Neue Review-Route:
  `apps/web/src/app/api/admin/feeds/drafts/[id]/review/route.ts`.
- Feed-Draft-Routen auf Governance-Permissions umgestellt (Scope-Pruefung, keine Community-Review-Rechte):
  `apps/web/src/app/api/admin/feeds/drafts/route.ts`,
  `apps/web/src/app/api/admin/feeds/drafts/[id]/route.ts`,
  `apps/web/src/app/api/admin/feeds/drafts/[id]/status/route.ts`,
  `apps/web/src/app/api/admin/feeds/drafts/[id]/publish/route.ts`.
- Feed-Typenpfad gehaertet: `features/feeds/types.ts` ist kanonisch; aktive Verwendungen nutzen `@features/feeds/types` (kein paralleler zweiter Typ-Quellpfad).
- Legacy-Publish-Route ebenfalls auf Governance+Publish-Gates gezogen:
  `apps/web/src/app/api/feeds/drafts/[id]/publish/route.ts`.
- Publish-Gate gehaertet in `features/anlassraum/governance.ts`:
  Quellenrollen, Publisher-Diversitaet, strukturierte Claims/Fragen, Weak-Signal-Korroboration.
- GOV-ANLASS-02 Baseline:
  `dossierType` in Anlassraum-Modell und Dossier-Link-Route
  `apps/web/src/app/api/admin/feeds/anlassraum/[id]/dossier/route.ts`.
- GOV-EVENT-01 Baseline:
  `apps/web/src/app/api/events/route.ts` kann Event als Anlassraum erzeugen/verknuepfen.
- GOV-EVENT-02 Baseline:
  QR-Set-Links zu Anlassraum/Dossier/Round + Protokoll-Route:
  `apps/web/src/app/api/qr/sets/route.ts`,
  `apps/web/src/app/api/qr/sets/[code]/protocol/route.ts`,
  `apps/web/src/app/api/qr/resolve/route.ts`.

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- GOV-EVENT-02 ausbauen: Protokoll -> Dossier-Aktualisierung und Runden-Seed formalisieren.
- GOV-ANLASS-04 UI/UX vertiefen (Queue-Sortierung, Bulk-Review, Review-Audit-Trail).
- Manual-first bleibt unveraendert; keine Auto-Publikation, keine Auto-Approval-Kuerzung.

### PR-GOV-03 (2026-03-19) – GOV-EVENT-02 Deepening (Protocol -> Dossier Upsert + Round Seed Contract)

Ziel:
- Event/QR/Protocol-Flow von Baseline auf reviewbare Contract-Handoffs vertiefen.

Changes:
- Neuer Dossier-Upsert-Contract-Service:
  `features/dossier/protocolUpsert.ts`.
- Neuer Round-Seed-Contract-Service:
  `features/topicRound/seedContract.ts`.
- Protokoll-Route erweitert:
  `apps/web/src/app/api/qr/sets/[code]/protocol/route.ts`
  (Provenance, Contract-Erzeugung, Follow-up-Metadaten).
- Follow-up/Audit-Ausgaben erweitert in:
  `apps/web/src/app/api/events/route.ts`,
  `apps/web/src/app/api/qr/sets/[code]/route.ts`,
  `apps/web/src/app/api/qr/resolve/route.ts`,
  `apps/web/src/app/api/qr/sets/summary/route.ts`.

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- GOV-EVENT-02 Next: Apply-Layer robuster machen (Policy-Feinschliff, Backfill fuer Alt-Contracts ohne Anlassraum/Dossier-Link, E2E-Abnahme).

### PR-GOV-04 (2026-03-19) – GOV-EVENT-02 Apply Layer (Dossier-Upsert Apply + Round-Seed Handoff)

Ziel:
- Contract-Baseline aus PR-GOV-03 um explizite manuelle Apply/Handoff-Aktionen erweitern, ohne Auto-Publish/Auto-Live-Round.

Changes:
- `features/dossier/protocolUpsert.ts` erweitert um:
  autorisierte `list/read/apply/reject`-Services, additive Apply-Logik, Status-Transitions, Audit-Trail.
- `features/topicRound/seedContract.ts` erweitert um:
  autorisierte `list/read/handoff/reject`-Services, non-public Round-Draft-Handoff, Status-Transitions, Audit-Trail.
- Neue Admin-Governance-API-Routen:
  `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/*`
  und
  `apps/web/src/app/api/admin/governance/round-seed-contracts/*`.

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- GOV-EVENT-02 Follow-up: E2E-Flow fuer Contract-Apply/Handoff + Alt-Daten-Backfill fuer fehlende Anlassraum-/Dossier-Links.

### PR-GOV-05 (2026-03-19) – GOV-EVENT-02 Hardening (E2E + Legacy Policy)

Ziel:
- Apply/Handoff-Flow testbar absichern und Legacy-Contract-Policy (fehlendes Anlassraum-/Dossier-Linking) explizit verifizieren.

Changes:
- Neue Integrationssuite:
  `apps/web/tests/gov-event-02.contracts.test.ts`.
- Abgedeckte Szenarien:
  - Protocol erzeugt Dossier-Upsert-Contract.
  - Manual Apply ist additiv, schreibt Audit-Metadaten und updated Contract-State.
  - Apply ohne Ziel-Dossier scheitert sicher (`contract_missing_target_dossier`) ohne implizites Dossier-Anlegen.
  - Protocol erzeugt Round-Seed-Contract; Manual Handoff erzeugt nur non-public/internal Draft (`manual_review_required`).
  - Community-Zugriff ist verboten; Legacy-Contracts ohne `anlassraumId` sind fuer nicht-admin explizit gesperrt (`actor_scope_requires_anlassraum`).

Verification:
- `pnpm -C apps/web exec vitest run tests/gov-event-02.contracts.test.ts` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- GOV-EVENT-02 Abschluss-Run: API/route-nahe Abnahmetests (inkl. Response-Mapping) und Backfill-Strategie fuer historische Contracts mit fehlenden Links.

### PR-GOV-06 (2026-03-19) – GOV-EVENT-02 Abschluss (Route Acceptance + Legacy Backfill Strategy)

Ziel:
- GOV-EVENT-02 route-seitig abschliessen, Error-Mapping stabilisieren und Legacy-Backfill als expliziten Admin-Flow verankern.

Changes:
- Route-Acceptance-Suite hinzugefuegt:
  `apps/web/tests/gov-event-02.routes.test.ts`.
- Legacy-Detection-Routen hinzugefuegt:
  `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/legacy/route.ts`,
  `apps/web/src/app/api/admin/governance/round-seed-contracts/legacy/route.ts`.
- Legacy-Backfill-Routen (admin-only, auditierbar) hinzugefuegt:
  `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/backfill/route.ts`,
  `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/backfill/route.ts`.
- Service-Hardening:
  - `features/dossier/protocolUpsert.ts`:
    Legacy-List/Backfill-Services, Guards fuer `contract_rejected`/`contract_already_applied`/`contract_already_rejected`.
  - `features/topicRound/seedContract.ts`:
    Legacy-List/Backfill-Services, Guards fuer `contract_already_handed_off`/`contract_already_rejected`.
- Error-Mapping erweitert:
  `apps/web/src/app/api/admin/governance/contractsError.ts` mappt bekannte Policy-Errors auf stabile Statuscodes (400/403/404/409).

Verification:
- `pnpm -C apps/web exec vitest run tests/gov-event-02.contracts.test.ts tests/gov-event-02.routes.test.ts` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- GOV-ANLASS-04 / PR-FEED-ANLASS-04 weiter vertiefen (Queue-UX, Bulk-Review, Backfill `vote_drafts` -> `anlassraumId`) bei unveraenderten Governance-Gates.

### PR-GOV-07 (2026-03-19) – GOV-ANLASS-04 / PR-FEED-ANLASS-04 Deepening (Queue Ops + Bulk + Backfill)

Ziel:
- Feed-Review operativ skalierbarer machen, ohne Governance-/Publish-Gates zu schwaechen.

Changes:
- `features/feeds/reviewQueue.ts` erweitert um:
  - Bulk-Review-Service (`applyBulkFeedReviewAction`)
  - Queue-Triage-Metadaten (`buildFeedQueueMeta`)
  - Legacy-Detection/Backfill-Services fuer unlinked `vote_drafts`.
- `apps/web/src/app/api/admin/feeds/drafts/route.ts` erweitert um Queue-Filter/Sortierung/Triage-Daten.
- Neue Feed-Governance-Routen:
  - `apps/web/src/app/api/admin/feeds/drafts/bulk/route.ts`
  - `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts`
  - `apps/web/src/app/api/admin/feeds/drafts/[id]/backfill/route.ts`
  - plus `apps/web/src/app/api/admin/feeds/drafts/reviewErrors.ts` fuer stabiles Error-Mapping.
- Minimales Admin-UI-Update fuer Queue-Operations:
  - `apps/web/src/app/admin/feeds/drafts/page.tsx` (zus. Filter/Sortierung, Bulk-Toolbar, Queue-Metadaten).
- Route-Tests fuer neue Feed-Review-Routen:
  - `apps/web/tests/feed-review.routes.test.ts`.

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web exec vitest run tests/feed-review.routes.test.ts` (PASS)

Next Steps:
- PR-FEED-ANLASS-05: Feed/Anlassraum Publish-Flows weiter ausbauen (Output-Redaktions-/Publish-UI) auf bestehendem, gehärtetem Queue- und Backfill-Fundament.

### PR-GOV-08 (2026-03-19) – PR-FEED-ANLASS-05 Deepening (Manual Publish Output Workflow)

Ziel:
- Output-Prep fuer Anlassraum-Output-Seeds API-first operationalisieren, ohne Publish-Gates oder Scope-Policies zu umgehen.

Changes:
- Neuer Output-Prep-Service:
  `features/anlassraum/outputPrep.ts`
  mit authorisierten List-/Transition-Funktionen, Audit-Feldern (`lastAction*`) und expliziten Aktionen:
  `queue`, `send_to_review`, `approve_prep`, `reject_prep`, `mark_ready`, `publish`, `discard`, `reset_draft`.
- Output-Seed-Typen/-Status/-Review-State als Konstanten stabilisiert:
  `features/anlassraum/types.ts`.
- Neue API-Routen fuer Output-Prep:
  - `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/route.ts`
  - `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition/route.ts`
- Stabiles Route-Error-Mapping:
  `apps/web/src/app/api/admin/feeds/anlassraum/outputPrepErrors.ts`.
- Neue Route-Acceptance-Suite:
  `apps/web/tests/anlassraum-output-prep.routes.test.ts`.

Verification:
- `pnpm -C apps/web exec vitest run tests/anlassraum-output-prep.routes.test.ts` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)

Next Steps:
- PR-FEED-ANLASS-05 Follow-up: minimale Admin-Output-Prep-Surfaces (list/transition wiring) und danach E2E-Abnahme fuer `/create` + `/runden` (PR-0038), ohne Governance-/Publish-Bypass.

### PR-GOV-09 (2026-03-19) – PR-FEED-ANLASS-05 Abschluss (Admin Output-Prep Surface + Service Integration)

Ziel:
- Manual Output-Prep Baseline operativ abschliessen (Admin-Bedienpfad + service-nahe Integrationsabdeckung), ohne neue Architektur zu oeffnen.

Changes:
- Minimales Admin-Output-Prep-Surface in
  `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`:
  - Listet Output-Seeds pro Anlassraum
  - Zeigt `outputType`, `status`, `reviewState`, `publishTarget`, `lastAction*`
  - Erlaubt manuelle Transitionen fuer
    `queue`, `send_to_review`, `approve_prep`, `reject_prep`, `mark_ready`, `publish`, `discard`, `reset_draft`
- Neue Service-Integrationstest-Suite:
  `apps/web/tests/anlassraum-output-prep.service.test.ts`
  mit Szenarien:
  - `draft -> review -> approved -> ready`
  - Gate-Block bei `mark_ready`
  - Block bei `publish` ohne `reviewState=approved`
  - Block bei `publish` aus invalidem Status
  - Block fuer Non-Approver/Out-of-Scope auf `approve_prep`/`publish`
- Route-Layer unveraendert stabil:
  `apps/web/tests/anlassraum-output-prep.routes.test.ts` bleibt gruen.

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web exec vitest run tests/anlassraum-output-prep.service.test.ts tests/anlassraum-output-prep.routes.test.ts tests/feed-review.routes.test.ts` (PASS)

Next Steps:
- PR-FEED-ANLASS-06: Legacy-Backfill/Remediation fuer unlinked `vote_drafts -> anlassraumId` weiter operationalisieren (Detection/Remediation UX + Audit), ohne Publish-/Approval-Automation.

### PR-GOV-10 (2026-03-19) – PR-FEED-ANLASS-06 Deepening (Legacy Backfill UX + Audit Closure)

Ziel:
- Legacy-Backfill fuer unlinked `vote_drafts` im Admin-Betrieb nutzbar machen und Audit-Sichtbarkeit schliessen, ohne Silent-Migration.

Changes:
- `features/feeds/reviewQueue.ts` erweitert:
  - Legacy-Summary liefert jetzt Audit-/Review-Felder (`reviewNote`, `lastReviewAction*`, Weak-Signal-Reason).
  - Backfill-Result liefert `remediationKind` (`attached_existing_anlassraum` | `created_candidate_anlassraum`).
- Backfill-Route erweitert:
  `apps/web/src/app/api/admin/feeds/drafts/[id]/backfill/route.ts`
  liefert Auditfelder (`reviewNote`, `lastReviewAction*`) + `remediationKind`.
- Draft-Liste/Detail fuer Auditdarstellung erweitert:
  - `apps/web/src/app/api/admin/feeds/drafts/route.ts`
  - `apps/web/src/app/api/admin/feeds/drafts/[id]/route.ts`
  - `apps/web/src/app/admin/feeds/drafts/page.tsx`
  - `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`
- Neue Service-Test-Suite:
  `apps/web/tests/feed-backfill.service.test.ts`
  mit Szenarien A-D + Attach-Target-Requirement.
- Route-Test-Suite gehaertet:
  `apps/web/tests/feed-review.routes.test.ts` (forbidden/validation/response-mapping fuer Backfill).

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web exec vitest run tests/feed-backfill.service.test.ts tests/feed-review.routes.test.ts` (PASS)

Next Steps:
- PR-FEED-ANLASS-06 Abschluss-Run: optionales UI-Polish fuer Legacy-Panel (kein Scope-Change) und danach PR-0038 (`/create` + `/runden` E2E-Abnahme).

### PR-0017 (2026-02-11) – Block E Research R2

Ziel:
- Research R2 finalisieren (Seeding, Filter, Feedback, Graph-Backflow, Anti-Spam).

Changes:
- Admin-Seed-Endpoint für Questions/Knots-Tasks.
- Filter-/Sortier-API für Research-Listen (inkl. Alias `/api/research/list`).
- Contributor-Feedback + Cooldown + Graph-Backflow bei Acceptance.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block F (Streams) starten, sobald Block A–D konsistent im Code/Docs sind.

### PR-0018 (2026-02-12) – Block A Orchestrator (Roles + Health)

Ziel:
- Orchestrator Block A abschliessen (Gemini-Provider, Rollen-Guidance, Health/Score).

Changes:
- Audience-Role Guidance fuer citizen/staff/institution in den Orchestrator aufgenommen.
- Health/Score-Tracking zentralisiert und Provider (inkl. Gemini) mit Metrics verdrahtet.
- Orchestrator-Callsites fuer Analyse mit explizitem Audience-Role konfiguriert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block B (Consequences & Responsibility Navigator) starten.

### PR-0019 (2026-02-12) – Block B Consequences & Responsibility

Ziel:
- Block B abschliessen (Consequences/Responsibility inkl. API und Navigator).

Changes:
- API-Endpunkte `/api/consequence/[id]` und `/api/responsibility/[id]` hinzugefuegt.
- Responsibility/Consequences aus Snapshots/Directory abrufbar gemacht.
- Block B in der Doku als erledigt markiert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block C (Graph & Reports) starten.

### PR-0020 (2026-02-12) – Blocks C–H Alignment (Graph/Eventualities/Streams/Campaigns/I18N)

Ziel:
- Block C–H auf den aktuellen Code-Stand bringen (Graph-Sync, Eventualities-API, Streams, Campaigns, Community-Skeleton).

Changes:
- Block C: Graph-Sync + Impact-Reports als done dokumentiert.
- Block D: `/api/eventualities/analyze` als Admin-Analyze-Entry hinzugefuegt.
- Block G: Campaign-MVP (Modelle, Admin-UI, Join-Flow) umgesetzt.
- Block H: Community/Chat-Skeleton ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- QA/UX-Polish fuer Campaigns & Community, danach Block-E2 (Operationalisierung/Seed-Pipelines).

### PR-0021 (2026-02-12) – Campaign Reports + QR Mapping + A11y Polish

Ziel:
- Kampagnen-Reports/Analytics, QR-Mapping und A11y-Details nachziehen.

Changes:
- Campaign-Report-API (Teilnahmen + Joins pro Tag) + Admin-Report-Panel.
- QR-Targets fuer Campaigns inkl. Resolve-Flow + Join-Redirect.
- A11y-Polish fuer neue Admin-Suchfelder.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Campaign-Reports erweitern (Charts/Segmente) und QR-Codes mit Sessions verknuepfen.

### PR-0022 (2026-02-12) – Campaign Sessions + Segment Reports

Ziel:
- Sessions + Segment-Reports fuer Campaigns fertigziehen und QR-Join sauber abbilden.

Changes:
- Campaign-Sessions API + QR-Codes pro Session.
- Campaign-Report mit Quellen- und Session-Segmenten.
- QR-Resolve erweitert fuer Campaign-Session-Links.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Charts/Visualisierung weiter verfeinern und Session-Statuspflege (live/ended) ergaenzen.

### PR-0023 (2026-02-12) – Docs Path Update (Campaigns)

Ziel:
- Dokumentationspfade fuer Campaigns/QR/Reports aktualisieren.

Changes:
- Part12 um aktuelle UI/API/QR-Pfade ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Part12 um QR-Session-Reporting und Rollen-Gating erweitern.

### PR-0024 (2026-02-12) – Part12 QR-Reporting + Roles

Ziel:
- QR-Session-Reporting und Rollen-Gating in Part12 dokumentieren.

Changes:
- Part12 um Reporting- und Gating-Abschnitt erweitert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- QR-Session-Report UI mit Filter/Export ergaenzen.

### PR-0025 (2026-02-12) – Campaign Report UI + Session Status

Ziel:
- Report-UI mit Filter/Export und Session-Statuspflege ergaenzen.

Changes:
- Admin-Campaign-Detail: Filter + CSV-Export fuer Report-Segmente.
- Sessions: Status-Updates via Admin-UI (planned/live/ended).

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Session-Statuspflege um Start/End-Zeitfelder erweitern.

### PR-0026 (2026-02-12) – Campaign Session Times + Report Charts

Ziel:
- Session-Zeiten pflegen und Report-Charts ergaenzen.

Changes:
- Session-Start/End-Zeitfelder im Admin-UI hinzugefuegt.
- Report-UI mit Balken-Chart fuer Joins pro Tag ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Report-Chart-Skalen normalisieren und CSV-Filter verfeinern.

### PR-0027 (2026-02-12) – Report Filters + Auto Session Status

Ziel:
- Report-Chart-Skalen normalisieren, CSV-Filter verfeinern und Auto-Status fuer Sessions.

Changes:
- Report-UI: Datumsfilter + normalisierte Balken-Skalen + CSV-Export berücksichtigt Filter.
- Sessions: Auto-live/auto-ended Logik basierend auf Start/Ende.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Status-Automation mit cron/batch prüfen (z.B. nightly sync).

### PR-0037 (2026-02-12) – Media Ready Projekte (3–5 Themen)

Ziel:
- Projekte mit 3–5 Themen, mindestens 5 Optionen je Thema und projektbezogenen Ergebnissen.

Changes:
- Projekt-Modelle + Collections in triMongo eingefuehrt (Projects + Votes).
- Admin-Projekte: Liste + Detailfreigabe fuer vorgeschlagene Optionen.
- Public-Projektseite: Abstimmen, Ergebnisanzeige, Option vorschlagen.
- ProjectForm erweitert: 3–5 Themen, min. 5 Optionen enforced.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0011/PR-0013 backlog weiter abbauen (Contributions/Live Skeleton).

Safe-Mode Checks (Membership/Payment):
- Admin-Verbuchen (`mark-paid`) und Kündigung (`cancel`) funktionieren, setzen user.membership-Status korrekt.
- Dunning-Job läuft trocken (keine Orders → no-op) und setzt bei Fälligkeit Reminder-Level / Auto-Cancel.
- /account zeigt korrekten Status inkl. PaymentInfo (masked) ohne PII-Leak; Copy-Buttons ok.

### PR-0010 (2026-02-11) – Admin Akquise Dashboard (Feeds-Status)

Ziel:
- Staff-only Akquise-Dashboard fuer Regionen/Gemeinden mit Feed-Status, Last-Fetch und Top-Themen.

Changes:
- Minimaler Store fuer Acquisition-Feeds + Fetch-Runs (`core/acquisition/*`).
- Admin-API `GET/POST /api/admin/acquisition` fuer Listen + Test-Fetch.
- Admin-UI `/admin/acquisition` mit Regionen-Tabelle und Fetch-Run Summary.
- Pilot-Doku (`docs/E150/Pilot.md`) und Part12-Admin-Abschnitt ergaenzt.

Verification:
- `./scripts/verify.sh` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)

Next Steps:
- PR-0011: Strukturierte Community/Journo-Beitraege (Quellen/Optionen/Fragen) + Moderation.

### PR-0011 (2026-02-11) – Strukturierte Community-Beitraege

Ziel:
- Strukturierte Beitraege fuer Quellen, Optionen, Fragen, Folgen und Ansichten mit Moderation.

Changes:
- Minimalmodell `core/communityContributions/*` (Type + Status + Referenz).
- Public API `GET/POST /api/community/contributions`.
- Admin API `GET /api/admin/community/contributions` + `POST /api/admin/community/contributions/approve`.
- Public UI `/community/contributions` + Admin Review `/admin/contributions`.
- Doku: `docs/E150/Pilot.md`, Part09 ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)
- `pnpm -C apps/web run typecheck` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)

Next Steps:
- PR-0012: Media Ready Projekte.

### PR-0028 (2026-02-12) – Identity/Profile + Membership Admin CTA

Ziel:
- Identity/Profile-Aufgaben finalisieren, XP-Hooks fuer Streams/Campaigns setzen, Membership-Admin/CTA ergaenzen.

Changes:
- XP: Streams-Session-Votes und Campaign-Joins vergeben XP idempotent.
- /profile leitet auf public share view oder zurueck auf /account.
- Public-Profile Top-Themen an Engagement-Level „engagiert“ gekoppelt.
- Admin: Membership-Statusliste in /admin/memberships + API-Gate fuer Memberships.
- Membership-Status-Updates spiegeln sich in User-Snapshot + Telemetry-Events.
- Household-Invites blockieren bei gesperrten Memberships.
- Account: Payment-CTA bei waiting_payment.
- Part14 R2-Status konsolidiert, Identity/Profile-Status angepasst.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Block M: Household-Lock/Monitoring/Events und Payment-CTA/Flows ausbauen.

### PR-0029 (2026-02-12) – Block M Complete (Household Lock + Monitoring)

Ziel:
- Household-Lock/Monitoring/Events finalisieren und Payment-CTA-Flow abrunden.

Changes:
- Membership-Apply blockt household_locked Accounts.
- Admin-Statuswechsel spiegelt auf User-Snapshot und revoked Pending-Invites.
- Membership-Overview zeigt Pending-Invites und erweitert Monitoring.
- Household-Invites werden bei Lock/Cancel revokiert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Payment-UX weiter polieren (Modal/Guided Flow).

### PR-0030 (2026-02-12) – Block I Unterstuetzen/Crowdfunding

Ziel:
- Eigene Unterstuetzen-Logik fuer Kampagnen/Projekte live schalten.

Changes:
- `SupportCampaign`/`SupportPledge` eingefuehrt (inkl. Indexes, Zahlungsreferenz `CF-xxxxxx`).
- Public APIs: `POST /api/support/campaigns`, `GET /api/support/campaigns/[slug]`, `POST /api/support/campaigns/[slug]/pledges`.
- Public UI: `/support/[slug]` mit Progress, Pledge-Form und Zahlungsanweisung.
- Admin APIs: `GET /api/admin/support/campaigns`, `GET /api/admin/support/campaigns/[id]`, `PATCH /api/admin/support/pledges/[id]` plus CSV-Export.
- Admin UI: `/admin/support` und `/admin/support/[id]` fuer Verbuchung/Monitoring.
- Campaign-Integration: CTA `Unterstuetzen` auf `/campaign/[id]`, wenn Support aktiv.
- Sichtbare Leitregel in UI: Unterstuetzung beeinflusst keine Votes/XP/Credits.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0031: Stream-Kit Overlay/QR/Agenda + "Streamer werden" produktisieren.

### PR-0031 (2026-02-12) – Block F Stream-Kit Produktisierung

Ziel:
- Stream-Kit fuer produktiven Host-Betrieb vervollstaendigen (Overlay-/Viewer-Links, dynamisches QR-Ziel, Streamer-Onboarding).

Changes:
- Stream-Agenda erweitert um `qrTarget` pro Item; Host kann Zielpfad pro Tagespunkt speichern.
- Host-Cockpit (`/dashboard/streams/[id]`) zeigt Stream-Kit-Panel mit Overlay-URL, Viewer-URL und aktivem QR-Ziel inkl. Copy-Aktionen.
- 1-Klick "Aktiv setzen" im Agenda-Flow geschaerft; Overlay synchronisiert das aktive `qrTarget`.
- Overlay-Feed und Overlay-Client zeigen aktives QR-Ziel fuer OBS/Regie transparent an.
- Streamer-Onboarding als Produktseite unter `/howtoworks/streamer` plus Alias `/streamer/werden` hinzugefuegt.
- Streams-Dashboard verlinkt auf Streamer-Guide und zeigt Overlay-/Viewer-Quicklinks pro Session.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0032: Block G Campaign-UX/Reporting-Polish (CTA-Kontext, Report-Filter, Admin-Cross-Linking).

### PR-0032 (2026-02-12) – Block G Campaign-UX/Reporting-Polish

Ziel:
- Campaign-CTA kontextsensitiv machen, Report-UX vereinheitlichen und Admin-Support-Cross-Linking schliessen.

Changes:
- Public Campaign-CTA nutzt Status-konforme Labels; Support-Hinweis bleibt sichtbar ohne Stimmrechtswirkung.
- QR-Landing fuer Campaigns zeigt klare Teilnahme-CTA und konsistente Hinweise.
- Admin-Campaign: Report-Filter-Reset, Vergleichsansicht (Top Quellen/Sessions) und Export-Hinweis ergaenzt.
- Admin-Campaign/Support verlinken sich wechselseitig (Prefill + Direktlink).

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- PR-0033: Block H I18N/A11y/Social Produktreife.

### PR-0033 (2026-02-12) – Block H I18N/A11y/Social Produktreife

Ziel:
- Skeleton-Pfade von Community/Chat in produktive Mindestpfade bringen, inkl. I18N-Fallbacks, A11y-Verbesserungen und konsistenten OG-Metadaten.

Changes:
- Community- und Chat-Seiten mit serverseitigem Locale-Fallback und zweisprachiger Copy erweitert.
- OG-Metadaten fuer `/community` und `/chat` ergänzt, inkl. konsistenten Descriptions.
- Community-UX mit Leitplanken, Links zu Verhaltenskodex und Barrierefreiheit klarer gemacht.
- Chat-UX mit Status- und Next-Step-Abschnitt, strukturierter Liste und A11y-orientierter Copy geschärft.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Docs-only: Doku- und Strukturhygiene (Part09 Appendix, Part11/12 Fliesstext).

### PR-0034 (2026-02-12) – Docs Hygiene + OG Meta Polish

Ziel:
- Doku-Hygiene abschliessen (Part09 Appendix, Part11/12 Text harmonisieren) und OG-Metadaten auf Campaign-Seiten nachziehen.

Changes:
- Part09 um Betriebsmetriken-Appendix ergaenzt.
- Part11/Part12 mit konsistenteren Kurzpfaden/QR-Checklisten harmonisiert.
- Campaign-Seiten mit OG-Metadaten erweitert (`/campaign` und `/campaign/[id]`).
- OpenTasks: keine Pflicht-Tasks mehr offen, optionales Polish bleibt.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: weitere OG-Metadaten fuer Detailseiten (Dossiers/Reports) ergaenzen.

### PR-0035 (2026-02-12) – Swipes End-to-End Persistence

Ziel:
- Swipes ohne Mock-Daten betreiben, Votes dauerhaft speichern, Eventualitaeten aus dem Graph ziehen.

Changes:
- Swipe-Feed nutzt ausschliesslich `statement_proposals`; Mock-Deck entfernt.
- Eventualitaeten werden aus `eventuality_nodes` nach `statementId` geladen.
- Swipe-Votes werden in `swipe_votes` persistiert (Upsert pro User/Statement/Eventualitaet).
- OpenTasks: optionaler Swipes-Backlog auf Analytics reduziert.

Verification:
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Optional: Vote-Aggregationen/Analytics fuer Admin-Reports vorbereiten.

### PR-0036 (2026-02-12) – Page Contracts Cleanup

Ziel:
- `missing-h1`-Allowlist auf 0 bringen und Seiten semantisch sauber machen.

Changes:
- Alle zuvor allowlisteten Pages haben jetzt ein `<h1>` (sichtbar oder sr-only).
- Redirect-/Legacy-Seiten liefern semantischen Fallback-Content.
- `missing-h1`-Allowlist geleert; Page-Contracts sind nun strikt.

Verification:
- `node scripts/check-page-contracts.mjs` (PASS)
- `pnpm -C apps/web run lint` (PASS)
- `pnpm -C apps/web run typecheck` (PASS)

Next Steps:
- Type Hygiene in `page.tsx` weiter reduzieren (umfangreicher Nachlauf).

### PR-0013 (2026-02-11) – Live/Chat Skeleton (Docs + Stubs)

Ziel:
- Live/Chat Skeleton mit Types, API-Stubs und UI-Placeholders.
- Sichtbar nur hinter Flag und staff-only.

Changes:
- Types: `core/liveChat/*` (ChatMessage, LiveSession, ModerationState).
- API-Stubs: `GET/POST /api/live`, `GET/POST /api/chat` (501 Not Implemented).
- UI-Stubs: `/live`, `/chat` (flag-guarded, staff-only).
- Doku: `docs/E150/Pilot.md` Phase 3 ergaenzt.

Verification:
- `pnpm -C apps/web run lint` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)
- `pnpm -C apps/web run typecheck` (PASS; Warnung: Node 20.x erwartet, lokal v24.5.0)

Next Steps:
- Optional: Live/Chat Features nur bei Bedarf weiter ausbauen (keine Provider/Keys).

### PR-OPS-STATUS-REPORT-01 (2026-04-19) – Interner automatischer SMTP-Statusreport

Ziel:
- Plattforminternen Statusreport als Scheduler-Mechanismus aufsetzen (05:00/17:00, Europe/Berlin), inkl. aktiver AI-Smokechecks und robuster Laufhistorie.

Changes:
- Neues Ops-Feature `apps/web/src/features/ops/statusReport/*` mit:
  - typed Report-Contracts
  - Status-Collector fuer Plattform/AI/Themenradar/Order-Pfade
  - SMTP-Mail-Rendering
  - persistenter Run-Repo inkl. Slot-Dedupe
  - Scheduler mit festen Slots + Grace-Window
- Scheduler-Start via `apps/web/src/instrumentation.ts`.
- Admin-API fuer Run/History: `apps/web/src/app/api/admin/ops/status-report/route.ts`.
- ENV-Erweiterung in `apps/web/.env.example` (`STATUS_REPORT_*`).

Verification:
- `pnpm -C apps/web run typecheck` (PASS)
- `pnpm -C apps/web exec vitest run tests/status-report-shape.contract.test.ts tests/ai-route-smoke.contract.test.ts tests/ai-route-fallback-status.contract.test.ts tests/status-report-mail-render.contract.test.ts tests/status-report-scheduler.contract.test.ts tests/status-report-no-double-send.contract.test.ts tests/smtp-config-guard.contract.test.ts` (PASS)

Next Steps:
- Optional: kleine interne Admin-UI fuer Berichtslauf-Historie aufsetzen (aktuell API-only).

### 2026-05-10 - PR-CREATE-HANDOFF-INTEGRITY-01

Ziel:
- Alle Klicks aus `/create` in Richtung Faktencheck, Dossier, Beteiligung, Graph-Anschluss und Beitragseinreichung sollen einen reviewbaren Arbeitsstand mitgeben statt nur kontextloser Navigation.

Changes:
- Neues Create-Handoff-Modell mit `plannerResult`, `graphMatches`, Claim-/Argument-/Open-Question-Trennung, `sourceGrounding`, `reviewState` und `requiresConfirmation=true`.
- `/create`-CTAs erzeugen jetzt Handoff-Drafts fuer `/factcheck`, `/dossier`, `/swipes` und `/community/contributions`.
- Faktencheck-Handoff bleibt nicht-mutativ: Claim-Preview statt Auto-DeepSearch oder Factcheck-Siegel.
- Dossier-/Swipes-/Contribution-Ziele zeigen den vorbereiteten Arbeitsstand sichtbar an; keine stille Dossier-Anheftung, kein stiller Graph-Merge.
- Graph-Matches fuehren `relation` und bleiben komplett bestaetigungspflichtig; `duplicate_risk` fuehrt in Review statt Auto-Merge.

Verification:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff-draft.contract.test.ts tests/create-factcheck-handoff.contract.test.ts tests/create-dossier-handoff.contract.test.ts tests/create-argument-claim-separation.contract.test.ts tests/create-graph-match-confirmation.contract.test.ts tests/live-click-hardening.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`

### 2026-05-10 - PR-CREATE-ANLASSRAUM-DOSSIER-FEED-E2E-01

Ziel:
- Die reviewbare Handoff-Kette aus `/create` bis in Anlassraum, Dossier und spaetere Feed-/Themenweiterfuehrung ohne Kontextverlust absichern.

Changes:
- `CreateHandoffDraft` um `topicSeed` und `resumeHref` erweitert.
- Neuer `/create`-Folgeschritt `Anlassraum vorbereiten` eingefuehrt und auf `/runden` verdrahtet.
- `/runden` zeigt bei Create-Handoff einen sichtbaren Review-Banner statt stiller Query-Navigation.
- Dossier- und Contribution-Surfaces zeigen Topic-Key/Jurisdiktion plus Ruecklink in `/create`.
- Contracts fuer Anlassraum-Handoff, Rueckbearbeitung und reale `/runden`-CTA-Nutzung nachgezogen.

Verification:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff-draft.contract.test.ts tests/create-dossier-handoff.contract.test.ts tests/create-anlassraum-handoff.contract.test.tsx tests/live-click-hardening.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/runden-page.acceptance.test.ts`

### 2026-05-11 - GOV-ACTOR-REGISTER-02 / GOV-COMMUNITY-SIGNAL-02 / GOV-ADMIN-REGION-02

Ziel:
- Die regionale Verortung fuer Anlassraeume von einer Fixture-Basis auf eine operative Verwaltungs-/Akteurs-/Signalschicht heben.

Changes:
- Offizielle Verwaltungsadressliste aus `apps/web/public/Listen/Anschriften_der_Gemeinde_und_Stadtverwaltungen_Stand_31012023_final.xlsx` als Directory-Readmodel operationalisiert.
- Region-/Actor-Contracts um `administrativeUnitType`, amtliche Directory-Referenzen und Verwaltungsadressdaten erweitert.
- Neues Repo-/Store-Layer fuer manuelle regionale Actor-Eintraege und review-first Community-Signale eingefuehrt.
- Neue Admin-Routen fuer Actor-Register, Signal-Inbox und Regional-Cockpit angelegt.
- Neue read-only Admin-Surface `/admin/region` fuer Verwaltung, Akteure und Signale ergänzt.

Verification:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/regional-official-directory.contract.test.ts tests/regional-actor-register.route.test.ts tests/community-signal-intake.route.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/regional-actor-register.contract.test.ts tests/community-signal-inbox.contract.test.ts tests/regional-admin-cockpit.contract.test.ts`

### 2026-05-11 - PR-AUTH-2FA-SETUP-UX-EMAIL-OTP-01

Ziel:
- Die 2FA-Setup-/Verify-Strecke nach Anmeldung ohne Maus bedienbar, kontraststark und mit sicherem E-Mail-Fallback fuer Setup-/Recovery-Kontexte nutzbar machen.

Changes:
- Neue `TwoFactorSetupClient`-Surface fuer `/auth/2fa-setup` mit direktem Fokus, numerischer 6-Ziffern-Eingabe, deutscher Fehlermeldung und klar lesbarem Dark-/Light-Input.
- Neue E-Mail-Code-Endpunkte `/api/auth/2fa/email-code/send` und `/api/auth/2fa/email-code/verify` fuer `setup_fallback`/`recovery` mit Hash-Speicherung, Zeitlimit und 60s-Cooldown.
- Session-/Guard-Schicht um `u_2fa_fallback` erweitert, damit explizite Setup-/Recovery-Sitzungen weiterkommen, ohne TOTP dauerhaft als aktiviert zu markieren.
- Bestehender Login-2FA-Flow bewirbt keinen E-Mail-Fallback mehr fuer aktive Authenticator-Konten; alter `request-email`-Pfad lehnt stillen Downgrade ebenfalls ab.

Verification:
- `pnpm -C apps/web exec vitest run tests/auth-2fa-setup-ui.contract.test.ts tests/auth-2fa-email-code.route.test.ts tests/auth-login.route.test.ts`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run build`
