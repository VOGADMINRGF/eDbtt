# POST-V1-CONSOLIDATION-BUNDLE-01

Datum: 2026-05-26
Status: done

## Ziel

Nach `production_ready-v1` den Post-V1-Rand sauber einordnen, ohne neue Produktpfade zu bauen:

- verbleibende Legacy-Issues gegen den aktuellen SSOT lesen
- Persistenzrealitaet der zentralen Review-/Feed-/Dossier-/Stream-Kette tabellarisch ehrlich machen
- einen Remote-GitHub-Release-Gate vorbereiten, ohne Fake-Gruen oder Fake-Rot zu bauen
- Pricing/Freemium-Vertrauenscopy gegen den V1-Modus pruefen
- V2/V3 sauber von V1-Blockern trennen

`PUBLIC-TOPIC-SUPPLY-LAYER-01` blieb dabei unangetastet; nur Dokumentationsverweise wurden ergaenzt.

## Gepruefte offene Issues

- #80 Pricing / Freemium / transparente Zusatzkosten
- #75 Themenradar / Brand Engine / Review-Export
- #73 Chat-derived product gaps
- #74 Studio-/Dossier-Chat-Backlog
- #48 Provider Role Routing
- #58 Orchestration Authority
- #43 OpenAI strict AnalyzeResult
- #40 AI ops diagnostics
- #36 Output Engine Guardrails
- #35 QR / Print / Citizen Letter / Administrative Note
- #34 Video / Audio / Podcast Scripts
- #33 Briefing / Article / Newsletter Outputs
- #32 Social Carousel Output Generator

Hinweis:

- Eine komplette offene-issues-Liste ueber die GitHub-API war in diesem Slice nicht stabil abrufbar.
- Die Entscheidungstabelle unten deckt deshalb die explizit benannten Alt-Issues plus den bereits dokumentierten V1-Hygiene-Kontext ab.

## Legacy-Issue-Entscheidungstabelle

| Issue | Status | Entscheidung | Begründung |
| --- | --- | --- | --- |
| #80 | open | done/superseded by V1 | Die heute sichtbare Pricing-Lesart entspricht bereits dem Kern der Issue-Idee: freie Grundbeteiligung, bewusste Zusatzleistungen, keine versteckten AI-Kosten, kein behaupteter Self-Checkout. In diesem Bundle wurde nur noch eine kleine user-facing Statuskey-Drift in `/pricing` entfernt. |
| #75 | open | keep as V2 candidate | Themenradar-/Brand-Engine-/Review-Export-Themen gehen ueber den heutigen V1-Feed-/Swipe-/Dossier-/Social-Queue-Scope hinaus. Die fachliche Basis ist vorhanden, der Rest ist V2-Ausbau. |
| #73 | open | close as obsolete | Als Backlog-Sync-Issue fachlich ueberholt: die relevanten V1-Luecken wurden in `OpenTasks.md` materialisiert oder spaeteren V2/V3-Tasks zugeordnet. |
| #74 | open | keep as V2 candidate | Das Studio-/Dossier-Chat-Backlog beschreibt weitergehende Output- und Redaktionsausbauten jenseits des heutigen review-first V1-Stands. |
| #48 | open | keep as V2 candidate | Provider-Rollenrouting ist nach `PR-AI-ORCH-POLICY-01` kein V1-Blocker mehr, bleibt aber reale V2-Konsolidierungsarbeit fuer AI-Orchestration. |
| #58 | open | done/superseded by V1 | Die Architekturentscheidung zur Orchestration Authority wurde bereits bindend ueber `PR-AI-ORCH-POLICY-01` in SSOT und Codepfade ueberfuehrt. |
| #43 | open | needs separate audit | Die Härtung des OpenAI-Strict-AnalyzeResult-Pfads haengt an realen Provider-/Timeout-/Quota-Lagen. Das ist kein V1-Blocker, aber eine eigene V2-/Ops-Auditspur. |
| #40 | open | needs separate audit | Direkte Provider-Probes und AI-Ops-Diagnostik betreffen reale Runtime-/Provider-Gesundheit und sollten nicht als reiner Dokuabschluss behandelt werden. |
| #36 | open | keep as V2 candidate | Review-Guardrails und Teile der Telemetrie sind fuer V1 abgedeckt, aber die breitere Output-Engine-Hardening-Idee bleibt als V2-Ausbau sinnvoll. |
| #35 | open | keep as V2 candidate | QR-/Print-/Buergerbrief-/Verwaltungsnotiz-Ausgaben passen in den bestehenden Output-/Studio-Pfad, sind aber fuer V1 nicht versprochen und bleiben Folgearbeit. |
| #34 | open | keep as V3 candidate | Video-/Audio-/Podcast-Skripte liegen jenseits des heutigen V1-/nahen V2-Kerns und sollten nicht mit dem review-first Output-Grundpfad vermischt werden. |
| #33 | open | keep as V2 candidate | Briefing-/Article-/Newsletter-Outputs passen zum bestehenden Studio-Pfad, sind aber zusaetzliche Formatfamilien und kein V1-Blocker. |
| #32 | open | keep as V2 candidate | Carousel-/Social-Formatgeneratoren bauen auf der bestehenden Social Distribution Queue auf, gehoeren aber als weitere Formatfamilie in V2. |

## Persistence-Reality-Tabelle

| Bereich | persistent-primary | derived/readmodel | in-memory/local | public-facing erlaubt? | Risiko |
| --- | --- | --- | --- | --- | --- |
| Create Handoffs | `create_handoff_review_items` ueber `CreateHandoffRepository`, solange kein In-Memory-Fallback aktiv ist | Handoff-Zusammenfassungen und Folge-Handoffs sind abgeleitet | In-Memory-Fallback von `triMongo` moeglich | ja, aber nur review-first und mit sichtbaren Guardrails | Mittel bis hoch, falls Runtime im Fallback laeuft |
| Review Queue Items | nein | zentrale Review Queue bleibt ausdruecklich derived aus Handoffs, Review-Operationen, Source- und Release-Stores | indirekt betroffen, wenn zugrunde liegende Stores nur runtime-nah sind | nur als Review-/Admin-/Org-Arbeitsflaeche | Mittel, weil derived Counts ohne persistente Unterlage driften koennen |
| Review Queue Operations | `review_queue_operation_records` plus Audit-Events | Activity-/Dashboard-Sichten sind abgeleitet | In-Memory-Fallback moeglich | nicht oeffentlich, aber produktiv fuer Operator/Org | Hoch bei Fallback, sonst niedrig |
| Source Connections | `edebatte_region_source_connections` | Snapshot-/Scope-Sichten leiten sich daraus ab | In-Memory-Fallback moeglich | nicht direkt oeffentlich, nur indirekt ueber Folgepfade | Hoch bei Fallback, sonst niedrig |
| Source Results / Snapshots | `edebatte_region_source_test_results` fuer Dry Runs / Resultate | Snapshot-Templates bleiben derived | Fixture-/Seed-Snapshots bleiben erlaubt, aber nicht als Primaerwahrheit | nur als Quellen-/Kontexthinweis nach Review | Mittel, weil Fixture-/Seed-Grenze klar bleiben muss |
| Feed Runtime Runs | `feed_runtime_runs` | Runtime-Dashboards sind abgeleitet | Test-/Memory-Seeds existieren in Contracts | nein, nur Admin-/Operator-Kontext | Niedrig bis mittel |
| VoteDrafts / FeedDrafts | `vote_drafts` | Feed- und Swipe-Supply-Readmodels leiten sich daraus ab | Memory-Seeds in Tests | ja, aber nur als review-first Vorschlag oder bewusst freigegebener Folgepfad | Mittel |
| Dossier Suggestions | `dossier_suggestions` | Oeffentliche Dossier-Update-Kontexte sind abgeleitet | Test-/Fixture-Saaten moeglich | ja, aber nur als gepruefter Stand oder Hinweis `in Prüfung` | Mittel |
| Dossier Update Readmodel | nein | `updateReadModel` vereint Handoffs, FeedDrafts, Swipe-Proposals, Anlassraum- und Evidence-Signale | indirekt durch lokale/fixture Inputs beeinflusst | ja, wenn Stand und Review-Hinweise sauber getrennt bleiben | Mittel |
| Social Distribution Queue | `social_distribution_posts` und `social_distribution_audit_events` fuer produktive Queue-Items | Queue-Readmodel ueber Dossier-, Feed-, Anlassraum- und Social-Drafts ist abgeleitet | Browser-Arbeitsstaende in Studio und Distribution bleiben lokal und explizit nicht-produktiv | ja, aber nur als Queue/Export/Scheduling-ready, nie als Live-Posting | Mittel, weil Browser-Arbeitsstaende nicht als Produktionswahrheit missverstanden werden duerfen |
| Stream Inputs | `stream_public_inputs` plus Participation-Signal-Review-Store | Stream-Runtime und Nachbereitungsreadmodels sind abgeleitet | keine stille Demo-Persistenz, aber Review-/Runtime-Fallbacks bleiben theoretisch moeglich | ja, review-first und mit Sichtbarkeitsmarker | Mittel |
| Content Release Workbench | `content_release_workbench_targets` plus Audit-Stream | Preview-/Visibility-/Topic-Page-Sichten bleiben derived | In-Memory-Fallback moeglich | ja, fuer oeffentliche Folgeflaechen nach bewusster Sichtbarkeit | Hoch bei Fallback, sonst niedrig |
| Topic Pages / derived public surfaces | nein | oeffentliche Topic-, Dossier-, Anlassraum-, Swipe- und Stream-Kontexte leben auf derived/readmodel-Ebene ueber persistierten Primaerstores | Demo-/Fixture-Pfade sind getrennt markiert | ja, wenn nie als eigenstaendige Primaerwahrheit behauptet | Mittel |

## Remote-Release-Gate-Befund

### Gefunden

- `.github/workflows/web-ci.yml`
  - laeuft auf `push main` und `pull_request`
  - prueft derzeit nur `pnpm lint` und `pnpm -C apps/web typecheck`
- `.github/workflows/e150-ci.yml`
  - ist ein manueller Legacy-Workflow (`workflow_dispatch`)
  - bildet den heutigen V1-Release-Gate nicht als Standard-Remote-Pfad ab
- Root-Script `release:validate:production`
  - vorhanden in `package.json`
  - implementiert ueber `scripts/release/validate-production.mjs`
  - fuehrt lokal Page Contracts, Smoke-Matrix, frischen Build, Web-Typecheck und Web-Lint seriell aus

### Entscheidung

- Es gab **keinen** passenden aktiven GitHub-Workflow, der den lokalen `production_ready-v1`-Release-Gate ehrlich spiegelt.
- Deshalb wurde ein neuer Workflow vorbereitet:
  - `.github/workflows/production-validation.yml`

### Aktivierungsmodell

- `Static validation` laeuft immer:
  - `pnpm install --frozen-lockfile`
  - `pnpm -w -r typecheck`
  - `pnpm -w -r lint`
  - `pnpm -C apps/web run typecheck`
  - `pnpm -C apps/web run lint`
- `Production gate` laeuft nur, wenn **bewusst aktiviert**:
  - Repo-Variable `PRODUCTION_VALIDATION_ENABLED=1`
  - benoetigte Secrets vorhanden

### Benoetigte Secrets fuer den guarded Build-/Release-Gate

- `JWT_SECRET`
- `MAIL_FROM`
- `CORE_DB_NAME`
- `CORE_MONGODB_URI`
- `VOTES_DB_NAME`
- `VOTES_MONGODB_URI`
- `PII_DB_NAME`
- `PII_MONGODB_URI`
- `AI_CORE_READER_DB_NAME`
- `AI_CORE_READER_MONGODB_URI`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `ARANGO_URL`
- `ARANGO_DB`
- `ARANGO_USER`
- `ARANGO_ROOT_PASSWORD`
- `MEMGRAPH_URI`
- optional fuer Provider-Pfade:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_TIMEOUT_MS`
  - `OPENAI_URL`

### Befund

- Remote-Gate ist **vorbereitet**, aber nicht blind als immer-gruener oder immer-roter Workflow gebaut.
- Ohne Variable + Secrets bleibt der echte Build-/Release-Teil bewusst `skipped`.
- Damit ist die Remote-Haertung ehrlich vorbereitet, aber nicht mit Fake-Annahmen ueber unbekannte CI-Secrets aktiviert.

## Pricing/Freemium-Befund

### Gepruefte Flaechen

- `/pricing`
- `/pricing/institutionen`
- Start-/Trust-Copy mit Pricing-Bezug

### Ergebnis

- V1-Lesart ist bereits grundsaetzlich konsistent:
  - Lesen / Swipes / Hinweise / Grundbeteiligung sind frei erklaert
  - Mitgliedschaft bleibt freiwillig und getrennt vom Paketkauf
  - Organisations-/Institutionenpfade laufen ueber review-first Freischaltung
  - es wird kein externer Checkout behauptet
  - es werden keine versteckten AI-Kosten versprochen
  - Grundbeteiligung wirkt nicht wie eine Paywall
- Gefundene Restdrift:
  - In `/pricing` tauchte noch der interne Statuskey `public_official` user-facing auf
- Korrektur:
  - ersetzt durch die oeffentliche Formulierung `keine automatische amtliche Freigabe`

### Fazit

- Kein Billing-/Checkout-Ausbau noetig
- Kein neues Preisprodukt noetig
- Nur kleine Vertrauenscopy-Korrektur

## V2/V3-Backlog-Entscheidung

### V2-Kandidaten

- `CI-REMOTE-RELEASE-GATE-01`
- `PRICING-FREEMIUM-TRUST-COPY-01`
- `PERSISTENCE-REALITY-FINAL-AUDIT-01`
- `V2-AI-ORCHESTRATION-CONSOLIDATION-01`
- `V2-OUTPUT-STUDIO-FORMATS-01`
- `SOCIAL-CONNECTORS-SCHEDULER-V2-01`
- `PAYMENT-CHECKOUT-PROVIDER-V2-01`
- `MATERIAL-EXTRACTION-JOBS-V2-01`
- `FEED-CRAWLER-SCALE-V2-01`

### V3-Kandidaten

- `V3-MULTI-TENANT-ENTERPRISE-01`
- `V3-PARTNER-MEDIA-AUTOMATION-01`
- `V3-IMPACT-REPORTING-AUTOMATION-01`
- `V3-GOVERNANCE-COMPLIANCE-AUTOMATION-01`
- `V3-EXTERNAL-DATA-PLATFORM-01`

### Leitentscheidung

- Keiner dieser Punkte ist mehr als V1-Blocker zu lesen.
- V1 bleibt `production_ready` im dokumentierten Produktmodus.
- Alles Weitere ist bewusst Folgearbeit.

## Geaenderte Dateien

- `.github/workflows/production-validation.yml`
- `apps/web/src/app/pricing/page.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/POST-V1-CONSOLIDATION-BUNDLE-01_2026-05-26.md`

## Validierung

Geplant fuer diesen Slice:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- wegen Pricing-Copy zusaetzlich:
  - `pnpm -C apps/web exec vitest run tests/pricing-communities-entry.contract.test.ts tests/pricing-institutionen-b2g-vergabe.contract.test.ts tests/pricing-order-shared-entry.contract.test.tsx`
- wenn lokal stabil:
  - `pnpm run release:validate:production`

## Bewusst nicht angefasste Punkte

- keine neue Swipes-/Feed-Supply-Logik
- keine Aenderung an `PUBLIC-TOPIC-SUPPLY-LAYER-01`
- kein Social-Live-Posting
- kein Checkout-/Provider-Ausbau
- keine neue Output-Formatfamilie
- keine AI-Orchestrierungs-Implementierung
- keine neue Admin-Parallelwelt

## Fazit

Dieses Bundle schliesst keinen neuen Produktpfad, sondern ordnet den Rand von `production_ready-v1` sauber:

- offene Legacy-Issues sind als `superseded`, `V2`, `V3` oder `needs separate audit` lesbar
- Persistenzrealitaet ist fuer die zentrale V1-/Post-V1-Kette transparent gemacht
- ein ehrlicher Remote-Release-Gate ist vorbereitet
- Pricing/Freemium bleibt vertrauensbasiert und frei von technischen Statuskeys
- V2/V3 stehen getrennt von V1 und wirken nicht mehr wie versteckte Launch-Blocker
