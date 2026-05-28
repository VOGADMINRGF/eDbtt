# V2-PERSISTENCE-REALITY-FINAL-AUDIT-01

Datum: 2026-05-28
Status: done

## Ziel

Nach `V2-SOURCE-FEED-AUTOMATION-01`, `V2-THEMENRADAR-AUTONOMOUS-SUPPLY-01`,
`V2-AI-ORCHESTRATION-CONSOLIDATION-01`, `SOCIAL-CONNECTORS-SCHEDULER-V2-01`,
`PAYMENT-CHECKOUT-PROVIDER-V2-01` und `MATERIAL-EXTRACTION-JOBS-V2-01` den
Persistenzstand der erweiterten V1/V2-Kette final gegen Code, SSOT und
Evidence pruefen, ohne neue Produktlogik zu bauen.

## Scope

Geprueft wurden:

- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `features/**`
- `apps/web/src/app/admin/**`
- `apps/web/src/app/api/**`
- `apps/web/src/features/**`
- alle relevanten V1/V2-Evidence-Dateien zu Feed, Themenradar, Dossier, Stream,
  Social, Payment, Material und AI-Orchestration

## Leitfrage

Fuer jede relevante Surface wurde geprueft:

- was `persistent-primary` ist
- was nur `derived/readmodel` ist
- wo nur `local/browser` oder `in_memory_fallback` beteiligt ist
- ob Public UI Review-/Statuslogik ehrlich zeigt
- ob Demo-/Seed-Daten in produktiven Kontexten sauber markiert bleiben
- ob Provider- und Kostenpfade sichtbar guard-railed sind

## Audit-Tabelle

| Bereich | persistent-primary | derived/readmodel | local/browser | external-provider | public-facing erlaubt | Risiko | Folgepunkt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create Handoffs | `create_handoff_review_items` via `persistedHandoffReviewQueue` | Handoff-Summaries, Review-/Weiterleitungsansichten | `sessionStorage`-Draftspiegel in `createHandoff.ts` / `useCreateHandoffDraft.ts` | keiner im Primaerpfad | ja, aber nur review-first und nicht als amtliche Wahrheit | mittel bei aktivem in-memory fallback oder wenn Browser-Drafts mit Serverstand verwechselt werden | lokale Draft-Copy weiter explizit als Komfortzustand halten |
| Review Queue | `review_queue_operation_records`, `review_queue_operation_audit` | Queue-Items, Counts, Dashboard- und Activity-Sichten | kein produktiver Browser-Store; in-memory fallback moeglich | keiner | nein, nur Admin-/Org-Arbeitsflaeche | mittel bis hoch bei fallback, sonst niedrig | fallback marker weiter sichtbar halten |
| Source Connections | `edebatte_region_source_connections`, `edebatte_region_source_test_results` | Cockpit-/Panel-Readmodels, Snapshot-Zusammenfassungen | kein produktiver Browser-Store; example seeds sind markiert | explizite URL-Snapshots / Dry-Run-Fetch, kein Vollcrawler | indirekt ja, nur ueber reviewte Folgepfade | mittel, weil Testresultate keine rohe Quellenarchivierung sind | Example-/Snapshot-Markierung in Admin-Surfaces beibehalten |
| Feed Runtime Runs | `feed_runtime_runs` | Admin-Feeds-Runtime-Summary | kein relevanter Browser-Store | optionale Feed-/Analyze-Laufketten | nein, nur intern/admin | niedrig | keine |
| Source Automation | `feed_source_automation_state` | Runtime-Readmodel ueber Feed-Refs, Connections und Testresultate | kein relevanter Browser-Store | optionale Feed-/Analyze-/Cron-ready-Pfade, aber keine behauptete Live-Automation | nein, nur Admin-/Ops-Kontext | mittel, weil derived orchestration/next action aus mehreren Stores kommt | Cron-/Automation-Copy weiter ehrlich als review-first/guarded halten |
| Material Extraction Jobs | `edebatte_material_intake_records`, `edebatte_material_intake_audit`, `edebatte_material_extraction_jobs` | Admin-Feeds-/Review-Zusammenfassungen und Handoffs | kein produktiver Browser-Store; in-memory fallback moeglich | optionale Extraction-/AI-Pfade mit Cost-Gates | nein, nur Admin-/Review-Kontext | mittel bis hoch bei fallback; sonst mittel wegen Provider-/Kostenabhaengigkeit | Cost-/provider-guardrails unveraendert sichtbar halten |
| VoteDrafts | `vote_drafts` | Feed-, Swipe-, Themenradar- und Dossier-Zulieferung | kein produktiver Browser-Store | keiner im Primaerpfad | nur indirekt ueber reviewte Folgepfade | mittel, weil Drafts mehrfach downstream genutzt werden | downstream weiter nie als Primaerwahrheit ausgeben |
| Themenradar Candidates | `edebatte_themenradar_items`, `edebatte_themenradar_audit` | `autonomousSupply` aus Proposals, VoteDrafts, Dossier-Suggestions, Anlassraum, Handoffs, Clustern, Material-Jobs | kein produktiver Browser-Store | optionale AI-Orchestration, draft-only | ja, aber nur als reviewpflichtige Kandidaten-/Signaloberflaeche | mittel | reviewRequired/autoPublishAllowed=false beibehalten |
| Dossier Suggestions | `dossier_suggestions` | Zusammenfuehrung in Dossier- und Themenradar-Lesarten | kein produktiver Browser-Store | keiner im Primaerpfad | indirekt ja, aber nur nach Review oder als Pruefhinweis | mittel | keine |
| Dossier Update Readmodel | kein eigener Primaerstore | `updateReadModel` und Public-Update-Context trennen sichtbaren Stand vs. Hinweise in Pruefung | kein produktiver Browser-Store | optionale Upstream-AI-/Feed-/Material-Handoffs | ja, mit klarer Trennung zwischen sichtbar und in Pruefung | mittel | Trennung published/reviewItems nicht aufweichen |
| Social Scheduler | `social_distribution_posts`, `social_distribution_audit_events`, `dossier_studio_workspaces`, `dossier_studio_workspace_audit_events` | Queue-/Scheduler-/Connector-Readmodels | `localStorage`-Arbeitsstaende im Studio-Panel | optionale Connector-Status und Scheduler-Transitions, aber `externalPosting=false` | ja, als Queue-/Planungs-/Statusoberflaeche | mittel, wenn lokale Studio-Drafts fuer Produktionswahrheit gehalten werden | lokale Studio-Drafts weiter deutlich als lokal kennzeichnen |
| Payment Checkout | `edebatte_checkout_sessions` | Billing-/Dashboard-Status aus Checkout + Entitlement | kein produktiver Browser-Store; in-memory fallback moeglich | optionaler Checkout-Provider, sonst manueller Fallback | nein als oeffentliche Wahrheit; ja als ehrlicher Pricing-/Billing-Status | mittel bis hoch bei fallback oder fehlender Providerkonfiguration | manuellen Fallback und Providerstatus copy-seitig ehrlich lassen |
| Entitlements | `paid_dashboard_entitlements`, `edebatte_region_entitlement_audit_events` | Org-/Region-Zugangsreadmodels und Contract-Summary | kein produktiver Browser-Store; in-memory fallback moeglich | keiner direkt; kann aus Checkout/Vertrag gespeist werden | indirekt ja, als Freischaltungs-/Scope-Status | mittel bis hoch bei fallback | runtimeMarker/source-of-truth-marker weiter zeigen |
| Stream Inputs | `stream_public_inputs` plus Participation-Signal-Review-Store | Stream-Public-Runtime, Dossier-/Social-Nachbereitung, Participation-Summaries | kein produktiver Browser-Store | keiner im Primaerpfad | ja, aber nur mit Sichtbarkeits- und Review-Markern | mittel | `public_unverified`-/Review-Copy beibehalten |
| Output Studio localStorage | keiner; nur lokaler Komfortzustand | Server-Workspace-/Distribution-Readmodels existieren getrennt | `localStorage`-Keys fuer Plan, Queue, Review, Draft, Prepared | keiner | nein als Produktionswahrheit; ja als explizit lokaler Arbeitsstand | niedrig bis mittel, wenn Save fehlschlaegt und nur Lokalstand uebrig bleibt | lokale Warncopy bei Save-Fehlern beibehalten |
| Admin Dashboards | kein eigener Primaerstore | Org-/Region-/Feeds-/Review-Dashboards lesen ueber mehrere persistente Stores und Marker | kein produktiver Browser-Store | indirekt ueber angeschlossene Provider-/AI-/Billing-Readmodels | nein als oeffentliche Wahrheit; ja als interne Arbeitsoberflaechen | mittel, weil viele derived Marker zusammenlaufen | Demo-/fixture-/fallback-marker weiter sichtbar lassen |

## Ergebnis gegen Akzeptanz

### 1. Derived wird nicht als Wahrheit ausgegeben

Ja. Die geprueften V2-Surfaces arbeiten weiter mit derselben Trennung:

- Primaerwahrheit liegt in expliziten Collections oder Repositories.
- Queue-, Dashboard-, Themenradar-, Dossier-, Stream- und Studio-Sichten sind
  als `derived/readmodel` zusammengesetzt.
- Oeffentliche Dossier- und Stream-Kontexte trennen sichtbaren Stand von
  reviewpflichtigen Hinweisen.

### 2. localStorage wird nicht als Produktionswahrheit ausgegeben

Ja. Die kritischen Browserpfade bleiben explizit sekundaer:

- `/create` nutzt `sessionStorage` nur fuer lokale Draft-Spiegel.
- Output Studio / Social Distribution kennzeichnen `localStorage` explizit als
  lokalen Arbeitsstand und nicht als produktive Behoerdenpersistenz.

### 3. Public UI zeigt Review-/Statuslogik

Ja. Die oeffentlichen oder halb-oeffentlichen Surfaces tragen sichtbare Marker:

- Create-Handoffs bleiben review-first.
- Dossier trennt oeffentlichen Stand und Hinweise in Pruefung.
- Stream markiert `public_unverified` und betont fehlende Auto-Publikation.
- Social und Payment zeigen Status-/Approval-/Providergrenzen statt Live-Claims.

### 4. Keine Demo-/Seed-Daten in produktiven Kontexten

Im geprueften Scope wurden keine stillen Demo-/Seed-Behauptungen gefunden.
Verbliebene Fixture-/Example-Pfade sind markiert, insbesondere:

- `example_seed` bei Source Connections
- `pilot_fixture` / `fixture_demo` / `demo_or_test_runtime` in Admin-/Ops-Metadaten

Diese Marker erscheinen als Warn- oder Herkunftsinfo und nicht als versteckte
Produktionswahrheit.

### 5. Keine geheimen Kosten-/Providerpfade

Ja. AI-, Extraction-, Social- und Payment-Pfade zeigen weiterhin sichtbare
Guardrails:

- `costApprovalRequired`
- `draftOnly`
- `publicOutputAllowed: false`
- `noAutoPublish`
- manueller Billing-/Checkout-Fallback
- kein stilles Social-Live-Posting

## Befund

- Es wurde keine harte Falschbehauptung gefunden, die einen Runtime-Umbau fuer
  diesen Slice erzwingt.
- Es wurde kein stiller rein browser- oder memory-basierter Produktionspfad
  gefunden, der im geprueften Scope als Wahrheit ausgegeben wird.
- Die verbleibenden Grauzonen sind bekannt und bereits guard-railed:
  Browser-Drafts bei `/create` und Studio, plus in-memory fallback marker fuer
  einige Repositories.

## Gepruefte Evidence

- `docs/E150/PERSISTENCE-INVENTORY-HARDENING-01_RUNTIME_PERSISTENCE_MATRIX_2026-05-20.md`
- `docs/E150/POST-V1-CONSOLIDATION-BUNDLE-01_2026-05-26.md`
- `docs/E150/POST-V1-CONSOLIDATION-FOLLOWUP-02_2026-05-27.md`
- `docs/E150/V1-DOSSIER-UPDATE-ENGINE-01_2026-05-25.md`
- `docs/E150/V1-SOCIAL-DISTRIBUTION-QUEUE-01_2026-05-25.md`
- `docs/E150/V1-STREAM-PUBLIC-RUNTIME-01_2026-05-25.md`
- `docs/E150/V2-SOURCE-FEED-AUTOMATION-01_2026-05-27.md`
- `docs/E150/V2-THEMENRADAR-AUTONOMOUS-SUPPLY-01_2026-05-27.md`
- `docs/E150/V2-AI-ORCHESTRATION-CONSOLIDATION-01_2026-05-27.md`
- `docs/E150/V2-SOCIAL-CONNECTORS-SCHEDULER-01_2026-05-27.md`
- `docs/E150/V2-PAYMENT-CHECKOUT-PROVIDER-01_2026-05-27.md`
- `docs/E150/V2-MATERIAL-EXTRACTION-JOBS-01_2026-05-27.md`

## Validierung

Fuer diesen Slice angefordert:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm run release:validate:production`
