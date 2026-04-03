# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.
Wenn andere Parts, alte Drift-Prompts oder Zwischen-Notizen abweichen, gewinnt diese Datei.

Stand: 2026-03-29

## Task Status Legend

- `open`
- `codex_ready`
- `in_progress`
- `blocked`
- `needs_decision`
- `research_only`
- `done`

## Codex-Arbeitsregel (operativ)

Codex arbeitet standardmaessig die naechsten 1-3 `codex_ready` Tasks in Prioritaetsreihenfolge ab,
haelt Code und Docs synchron, aktualisiert danach diese Datei und stoppt an echten
Produkt-Entscheidungsgrenzen mit genau einer gezielten Rueckfrage.

## Einheitliches Task-Schema (fuer neue oder normalisierte Tasks)

Jeder neue/normalisierte Task soll diese Felder enthalten oder implizit abbilden:

- `ID`
- `Status`
- `Priority`
- `Depends on`
- `Scope`
- `Goal`
- `Acceptance Criteria`
- `Decision open`
- optional `Evidence / Notes`

## Operativer Task-Katalog (normalisiert, SSOT)

Dieser Katalog ist die operative Queue fuer Codex.
Nur diese Eintraege gelten fuer Status, Priorisierung und naechste Umsetzung.
Alle nachfolgenden Abschnitte bleiben als Evidenz/Archiv erhalten, sind aber nicht die operative Queue.

### A. Canonical Product Flow

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ROUTING-HARM-01 | in_progress | high | PR-AI-CREATE-01 | `AnalyzeWorkspace`, Create/Contribution-Fallbacks, Finalize-Redirect-Resolver | Client-Navigation folgt serverseitigem Finalize-Ziel ohne Drift | Auto-Redirect nach erfolgreichem Finalize; `redirectTo` hat Vorrang; Fallback widerspricht Serverziel nicht; interne Redirects only | no | Baseline aktiv (replace + Resolver); Wrapper-/Boundary-Contract ueber `ROUTING-HARM-01B` testseitig gehaertet, Restmonitoring fuer Legacy-Surfaces bleibt. Im aktuellen Run kein kleiner entscheidungsfreier Restslice sauber abgrenzbar. |
| ROUTING-HARM-01A | done | high | ROUTING-HARM-01 | Finalize-Redirect-Paritaet in `/create` + `/contributions/new` Wrappers | Legacy-Wrappers auf denselben Redirect-Resolver und Auto-Redirect-Pfad bringen | Shared Redirect-Resolver wird in beiden Einstiegen genutzt oder per Tests als identisch abgesichert; serverseitiges `redirectTo` bleibt vor Fallback priorisiert; nur interne Redirect-Ziele; Legacy-Flow-Tests fuer Finalize-Redirect ergaenzt | no | Erledigt: shared Fallback-Builder (`buildFinalizeFallbackPath`) in `/create` und `ContributionNewClient` genutzt; Wrapper-Redirect von `/contributions/new` nach `/create` testseitig auf Query-Paritaet abgesichert (`2026-03-27`) |
| ROUTING-HARM-01B | done | medium | ROUTING-HARM-01A | Finalize-Redirect-Vertragshaertung fuer Wrapper-/Boundary-Edges | Redirect-Verhalten bei fehlendem/ungueltigem `redirectTo` und Boundary-Delegation testbar abschliessen | Tests decken `/api/create/finalize`-Delegation + Redirect-Vertragsparitaet zu `/api/contributions/finalize` ab; `resolveFinalizeRedirectTarget` blockt externe Ziele weiterhin; Wrapper-Fallback bleibt intern und widerspricht Serverziel nicht | no | Erledigt: Wrapper-Boundary (`/api/create/finalize`) per Route-Tests auf Redirect-Paritaet (dossier/non-dossier + invalid_mode) abgesichert; Redirect-Resolver blockt externe Ziele weiterhin inkl. no-navigate-Fall (`2026-03-27`) |
| UX-HARM-01 | in_progress | high | ROUTING-HARM-01 | `/swipes` Arrival-Flow bei `fromDraft` | Arrival ist fuer Nutzer nachvollziehbar statt nur Meta-Banner | `fromDraft` triggert fokussierten Arrival-Modus; kein Fake-Mapping bei fehlenden Treffern; klarer Rueckfall auf allgemeines Deck | no | Arrival-Fokus aktiv; Feintuning fuer grosse Decks ueber `UX-HARM-01A` abgeschlossen, Rest bleibt allgemeine UX-Iteration ausserhalb des Arrival-Contracts |
| UX-HARM-01A | done | medium | UX-HARM-01, PR-0045 | `/swipes` Arrival-Feintuning fuer grosse `fromDraft`-Treffermengen | Arrival-Fokus bei vielen Treffern steuerbar machen, ohne Bewertungslogik zu aendern | Arrival-Hinweis zeigt Trefferstatus klar; initialer `fromDraft`-Fokus bleibt erhalten und kann per explizitem "Alle Vorschlaege"-Umschalter aufgehoben werden; no-match Fallback bleibt intakt; keine Routing-/Ranking-Aenderung; Tests fuer Umschalter + Fallback vorhanden | no | Erledigt: Arrival-Banner nutzt expliziten Umschalter via shared Toggle-Resolver, Trefferstatus fuer grosse Mengen ist klarer, no-match-Fallback bleibt unveraendert; Helper- und Feed-Arrival-Tests aktualisiert (`2026-03-27`) |
| PR-AI-CREATE-01 | in_progress | high | GOV-AI-01 | `/create` Freistart, Intake-Handoff, Match/CTA-Eingang | `/create` als kanonischer Intake ohne Legacy-Drift stabilisieren | Handoff-Kontext wird uebernommen; keine impliziten Legacy-Defaults; Save/Finalize bleiben regelkonform | no | Bereits deutlich vertieft; Legacy-Entry-Contract ueber `PR-AI-CREATE-01B` gehaertet, weiterer Rest-Hardening-Scope bleibt. Im aktuellen Run kein kleiner entscheidungsfreier Restslice mit hoher Sicherheit identifiziert. |
| PR-AI-CREATE-01A | done | high | PR-AI-CREATE-01 | `/create` Intake-Contract-Normalizer + Query-Tests | Handoff-Parameter im Create-Einstieg deterministisch normalisieren und Legacy-Drift begrenzen | Shared Normalizer fuer erlaubte Handoff-Felder vorhanden; unbekannte/legacy Query-Felder werden ignoriert statt implizit gemappt; Feed-/Match-Handoffs bleiben funktional unveraendert; Tests fuer gueltige/ungueltige Parameterfaelle vorhanden | no | Erledigt: shared Intake-Normalizer (`parseCreateIntakeContextFromQuery` / `normalizeCreateIntakeContextInput`) in `/create`-Page + Fast-Path-Href genutzt; neue Tests fuer valide/ungueltige/legacy Query-Faelle aktiv (`2026-03-27`) |
| PR-AI-CREATE-01B | done | medium | PR-AI-CREATE-01A | `/create` Intake-Handoff Contracts in Legacy-Entry-Points | Kanonischen Intake auch bei Legacy-Einstiegen (`/contributions/new`, Login-Return) kontraktsicher halten | Legacy-Einstiege behalten nur erlaubte Handoff-Felder; keine implizite Rueckkehr zu `intent=claim&mode=manual`; Tests fuer Legacy-Query-Durchleitung und Intake-Kontextsichtbarkeit ergaenzt | no | Erledigt: `/contributions/new` laesst nur erlaubte `/create`-Handoff-Keys durch; unknown/legacy Keys werden verworfen; Page-/Wrapper-Tests decken Query-Durchleitung und Intake-Sichtbarkeit ab (`2026-03-27`) |
| GOV-AI-01 | in_progress | high | GOV-01, GOV-02 | Freistart + verpflichtende Qualitaetsschicht | Qualitaets-/Pruefpfad als Pflicht vor weiterem Routing sichern | Analysepflicht bleibt aktiv; Rueckfragen statt stiller Fehlzuordnung; no-auto-publish Guardrails intakt | no | Zielbild bereits dokumentiert, Umsetzung laeuft |
| GOV-AI-02 | done | high | GOV-AI-ORCH-02 | Graph-Matching + CTA-Layer | Verbindliche CTA-Entscheidungslogik kanonisieren | Konservativ-deterministischer CTA-Kanon ist freigegeben; kein Silent-Merge, kein Auto-Publish, kein impliziter Vollzug durch CTA-Ausgabe; `neu_anlegen` bleibt sicherer Ausweichpfad | no | Entscheidung manifestiert (2026-03-27): eingefrorener Ist-Contract aus `GOV-AI-02A` + `GOV-AI-02B` ist Startkanon; keine neue Priorisierung ueber den dokumentierten Ist-Stand hinaus |
| GOV-AI-02A | done | medium | GOV-AI-ORCH-02, PR-AI-CREATE-01B | CTA-Ist-Contract in `/create` und angrenzenden Match-Pfaden | Vor der Produktentscheidung die aktuelle CTA-Ausgabe und Fallbacks testbar und dokumentiert einfrieren | Ist-Inventory fuer aktuell emittierte CTA-/Match-Ausgaenge liegt vor; Tests fixieren vorhandenes CTA-Keyset und Fallback-Verhalten ohne neue CTA-Regel; offene Entscheidungsfragen werden im Parent `GOV-AI-02` konkretisiert | no | Erledigt: CTA-Ist-Matrix dokumentiert (`docs/E150/GOV-AI-02A_CTA_Inventory_2026-03-27.md`), Match-Service-Tests frieren Keyset + fallback reasons ein (`apps/web/tests/create-match.service.test.ts`) (`2026-03-27`) |
| GOV-AI-02B | done | medium | GOV-AI-02A | CTA-Ist-Contract Restabdeckung (Legacy-/Wrapper-/Route-Paritaet) | Vor CTA-Produktentscheid verbleibende Ist-Kontrakte dokumentieren und testseitig einfrieren | Bestehendes CTA-Keyset/Fallbacks fuer relevante Legacy-/Wrapper-Einstiege und Route-Antwortformen sind dokumentiert; fehlende Regressionstests fuer Ist-Verhalten sind ergänzt; keine CTA-/Routing-Logik aendern | no | Erledigt: CTA-Restabdeckung dokumentiert (`docs/E150/GOV-AI-02B_CTA_CONTRACT_REST_COVERAGE_2026-03-27.md`) und Wrapper-/Route-Paritaet in `/api/create/analyze` fuer degraded/non-200 Responses testseitig eingefroren (`apps/web/tests/create-analyze.create-route.test.ts`) (`2026-03-27`) |
| GOV-AI-02C | done | medium | GOV-AI-02 | Typed CTA-Resolver auf freigegebenen Startkanon | Deterministische CTA-Aufloesung in shared Resolver/Contracts am freigegebenen Ist-Kanon ausrichten | Shared typed CTA-Resolver bildet freigegebenes CTA-Keyset/Fallbacks deterministisch ab; Unit-Tests decken match/no-match/degraded-Pfade ab; kein neues Ranking und keine neue Produktlogik | no | Erledigt: shared Resolver `resolveCreateCtaSuggestions` zentralisiert CTA-Ausgabe fuer Match-/No-Match-/Degraded-Pfade und ist in Match-Service sowie Analyze-Fallbacks angebunden; Unit-/Contract-Tests eingefroren (`apps/web/tests/create-cta-resolver.test.ts`, `apps/web/tests/create-match.service.test.ts`, `apps/web/tests/create-analyze.contract.test.ts`) (`2026-03-27`) |
| GOV-AI-02D | done | low | GOV-AI-02C | CTA-Kanon Docs-/Contract-Sync in Analyze-/Create-Flows | Freigegebenen CTA-Startkanon in relevanten Docs/Contracts konsistent referenzieren | Part16/Part05/create-intake und route-nahe Contract-Doku referenzieren denselben CTA-Startkanon; keine widerspruechlichen Legacy-Formulierungen | no | Erledigt: CTA-Startkanon in Part16/Part16_AI/Part05/create-intake synchronisiert und als Evidenz in `docs/E150/GOV-AI-02D_CTA_CANON_SYNC_2026-03-27.md` festgehalten; keine Verhaltensaenderung (`2026-03-27`) |
| GOV-AI-03 | done | medium | DOMAIN-HARM-01 | Anlassraum als Arbeitsort im Produktfluss | Kontextarbeit im Anlassraum produktseitig eindeutig verankern | Anlassraum ist als oeffentlicher thematischer Arbeits-/Kontextraum manifestiert, ohne Dossier oder Swipes zu verdraengen; `/create` bleibt Intake, `/runden` bleibt Anlassraum-Surface, Dossier bleibt Verdichtung, `/swipes` bleibt Beteiligung; konditionales Finalize-Routing bleibt unveraendert | no | Entscheidung manifestiert (2026-03-27): begrifflich/fachliche Klaerung ohne neuen Anlassraum-Editor-Modus und ohne Routing-Neukanonisierung |
| GOV-AI-03A | done | low | DOMAIN-HARM-01, PR-AI-CREATE-01B | Anlassraum-Arbeitskontext Ist-Matrix (`/create` -> `/runden`/`/swipes`/`/dossier`) | Ohne Produktentscheid transparent machen, welche Handoffs/Contracts bereits bestehen und wo echte Luecken liegen | Kompakte Ist-Matrix fuer bestehende Handoff-Signale/Contracts in relevanten Surfaces + APIs dokumentiert; offene Entscheidungsgrenzen fuer `GOV-AI-03` explizit markiert; keine Routing-/Produktlogik aendern | no | Erledigt: kompakte Ist-Matrix inkl. Surface-Rollen, Handoff-Signalen und Decision-Boundaries dokumentiert (`docs/E150/GOV-AI-03A_ANLASSRAUM_WORK_CONTEXT_MATRIX_2026-03-27.md`) (`2026-03-27`) |
| GOV-AI-03B | done | medium | GOV-AI-03 | Docs-/Surface-Contract-Harmonisierung Anlassraum als Arbeits-/Kontextraum | Nach Entscheid konsistente Begriffs- und Contract-Texte zwischen Anlassraum/Dossier/Swipes herstellen | Relevante Parts und Surface-Dokus beschreiben Anlassraum konsistent als Arbeits-/Kontextraum; keine Behauptung, dass Dossier oder Swipes den Anlassraum ersetzen | no | Erledigt: Surface-/Contract-Wording in Part16-Familie, Part05 und Surface-Architektur harmonisiert; Evidenz in `docs/E150/GOV-AI-03B_SURFACE_CONTRACT_SYNC_2026-03-27.md` (`2026-03-27`) |
| GOV-AI-03C | done | medium | GOV-AI-03B, ROUTING-HARM-01 | Handoff-/UI-Contract-Sync zwischen `/create`, `/runden`, `/swipes`, `/dossier` | Sichtbare Handoff-Kontrakte in UI/Docs angleichen, ohne Routinglogik zu aendern | Handoff-Hinweise und Contract-Texte sind entlang bestehender Ziele konsistent; keine neue Route, kein neues Routing-Verhalten, keine Produktlogik-Erweiterung | no | Erledigt: UI-Hinweise in Create/Analyze/Runden/Swipes/Dossier entlang des bestehenden Handoff-Vertrags synchronisiert; Evidenz in `docs/E150/GOV-AI-03C_HANDOFF_UI_CONTRACT_SYNC_2026-03-27.md` (`2026-03-27`) |
| GOV-AI-04 | done | high | GOV-AI-ORCH-02, GOV-AI-ORCH-03 | Canonical Multi-Orchestration-Flow | 5-Orchester-Modell produktiv auf Hauptfluss mappen | Freigegebener Hauptfluss inkl. Zustands-/Contract-Grenzen dokumentiert | no | Entscheidung manifestiert (2026-03-27): Option A `strict staged` ist Startkanon. Produktiver Hauptfluss folgt einem klaren Stage-Pflichtpfad; direkte Providerpfade ausserhalb davon bleiben Ausnahme-/Legacy-/Nebenspuren und sind nicht gleichwertiger Hauptfluss. Degraded-Antworten bleiben erlaubt, aber innerhalb des Hauptcontracts sichtbar markiert. Production-Readiness-Markierung fuer staged/exception/meta/envelope liegt vor (`docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`). |
| GOV-AI-04A | done | medium | GOV-AI-ORCH-02, GOV-AI-ORCH-03 | Ist-Mapping der aktuellen Orchestrierungs-Andockpunkte + Entscheidungs-Impact-Matrix | Entscheidungsreife fuer `GOV-AI-04` herstellen, ohne neuen Produktfluss zu setzen | Kompakte Matrix `Route/Service -> Orchester -> Contract-Status -> offene Luecke` liegt vor; Option-Impact fuer A/B/C ohne Kanonisierung dokumentiert; keine Routing-/Produktlogik-Aenderung | no | Erledigt: Orchestrierungs-Andockpunkte, stabile Ist-Contracts und verbleibende Decision-Boundaries in einer repo-nahen Impact-Matrix dokumentiert (`docs/E150/GOV-AI-04A_ORCHESTRATION_IMPACT_MATRIX_2026-03-27.md`) (`2026-03-27`) |
| GOV-AI-04B | done | medium | GOV-AI-04 | Stage-/Boundary-Contract fuer produktiven Hauptfluss | Strict-staged Startkanon als klaren Route-/Service-Contract dokumentieren und testseitig einfrierbar machen | Stage-Grenzen (Analyze -> Match -> CTA) inkl. erlaubter degraded-Pfade als technischer Contract dokumentiert; keine neue Routing-/Produktlogik; Folge-Tests klar ableitbar | no | Erledigt: shared Boundary-Parser (`parseCreateAnalyzeBoundarySnapshot`) eingefuehrt und in `AnalyzeWorkspace` angebunden; Stage-/Meta-Contract inkl. degraded-Guard testseitig eingefroren (`apps/web/tests/create-analyze.boundary-contract.test.ts`, `apps/web/tests/create-analyze.route.test.ts`) (`2026-03-27`) |
| GOV-AI-04C | done | medium | GOV-AI-04 | Direkte Providerpfade als Ausnahme-/Legacy-Contract markieren | Direkte Providerrouten explizit als nicht-kanonische Hauptfluss-Ausnahme dokumentieren | Direkte Providerpfade (`analyze/save`, `refine`, `clarify`, `news/survey-topics`, `quality/polish`, diag/admin-smoke) sind als Ausnahme-/Legacy-Nebenpfade klar markiert; keine Gleichstellung mit Hauptfluss; keine Runtime-Aenderung | no | Erledigt: shared Route-Contract (`orchestrationRouteContract.ts`) trennt strict-staged Hauptfluss von Legacy-Providerpfaden; Contract-Tests sichern Klassifikation/Disjunktheit (`apps/web/tests/orchestration-route-contract.test.ts`) (`2026-03-27`, erweitert `2026-03-29`). |
| GOV-AI-04D | done | medium | GOV-AI-04 | Produktiver State-/Meta-Transfer Analyze -> Match -> CTA haerten | Meta-/State-Transfer entlang des strict-staged Hauptcontracts konsistent und regressionssicher dokumentieren/testen | Feldtransfer (`runId`, `providerMatrix`, `phases`, `confidence`, degraded/fallback-Flags) entlang Hauptpfad ist konsistent abgesichert; keine neue CTA-Priorisierung und keine neue Routinglogik | no | Erledigt: shared Analyze-Envelope-Parser + runId-gebundene providerMatrix-Uebernahme eingefuehrt; CTA-Handoff traegt Source-Meta weiter; UI-/Helper-Tests sichern Analyze->Match->CTA Transfervertrag regressionssicher ab (`2026-03-27`) |
| GOV-AI-05 | research_only | medium | GOV-AI-ORCH-03 | Prompt-Contracts + typed outputs | Reproduzierbare, auditierbare Output-Vertraege vorbereiten | Inventar der kritischen Prompt-/Output-Grenzen; Vorschlag fuer versionierte Contracts | no | Erst Forschung/Inventar, dann Implementierung |
| GOV-AI-06 | research_only | medium | GOV-AI-ORCH-03 | Language-aware Core + cross-lingual matching | Sprachtrennung und Matching-Qualitaet belastbar mappen | Ist-Analyse fuer `uiLocale/contentLanguage/sourceLanguage`; Gap-Liste mit Folgetasks | no | Vor Umsetzung erst technische Bestandsaufnahme |
| GOV-AI-07 | done | medium | GOV-SEC-03 | Meta-Layer/Audit/Provenance/Layman | Governance-Pflichten fuer produktive Erklaerbarkeit festlegen | Meta-Basissatz ist auf allen Pfaden verpflichtend; Pflichtkern fuer Nachvollziehbarkeit/Erklaerbarkeit bleibt synchron; High-impact-Pfade sind breit und verbindlich definiert; asynchrone Nachreichung nur fuer vertiefende Zusatzinformationen | no | Entscheidung manifestiert (2026-03-28): kein kuenstliches Minimieren produktiv genutzter Telemetrie-/Admin-Metafelder; Pflichtkern gilt fuer Analyse, Dossier, Factcheck, Matching, CTA, Findings und veroeffentlichungsnahe Verdichtung. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-AI-07A | done | medium | GOV-SEC-03A | Meta-Layer Feldinventar fuer bestehende High-impact Pfade | Vorentscheidungs-Basis fuer `GOV-AI-07` durch Ist-Inventar und Gap-Liste schaffen | Bestehende Audit/Provenance/Layman-Felder fuer relevante Antworten/Logs inventarisiert; fehlende Pflichtfelder pro Option markiert; keine neue Governance-Regel implementiert | no | Erledigt: High-impact Meta-Layer-Feldmatrix mit Erzeugung/Transport/UI-Ankunft und Stabilitaetsstatus dokumentiert (`docs/E150/GOV-AI-07A_META_LAYER_FIELD_INVENTORY_2026-03-27.md`) (`2026-03-27`) |
| GOV-AI-ORCH-02 | done | high | GOV-AI-ORCH-01 | KI-/Route-Inventar gegen 5-Orchester-Zielbild | Aktive KI-Pfade vollstaendig inventarisieren | Endpoint-/Service-Mapping vorliegend; Gaps priorisiert in Folgetasks ueberfuehrt | no | Erledigt: produktnahes KI-/Route-Inventar inkl. staged-vs-direct, Contract-Status und Gap-Priorisierung dokumentiert (`docs/E150/GOV-AI-ORCH-02_ROUTE_INVENTORY_2026-03-27.md`) (`2026-03-27`); Production-Baseline-Verknuepfung ist nachgezogen (`docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`). |
| GOV-AI-ORCH-03 | done | medium | GOV-AI-ORCH-02 | Provider-/Modellstrategie je Orchester | Modellklassen/Fallbacks inkl. Unsicherheiten offenlegen | Pro Orchester dokumentierte Primar-/Fallback-Klasse + offene DPA/Residency/Kostenfragen | no | Erledigt: Betriebsbaseline je Orchester mit Primarklasse/Fallbackklasse/Failure-Mode und offenen DPA/Residency/Kosten-Risiken dokumentiert (`docs/E150/GOV-AI-ORCH-03_PROVIDER_STRATEGY_BASELINE_2026-03-27.md`) (`2026-03-27`); Production-Baseline fuer staged/exception/boundary/envelope markiert (`docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`). |
| GOV-SEC-01 | in_progress | medium | none | Secret-Hygiene, lokale Prod-URI-Risiken | Sicherheitsgrundlagen operationalisieren | Konkrete Hygiene-Regeln im Repo verankert; riskante Lokalstandards reduziert | no | Dokumentations-Baseline vorhanden |
| GOV-SEC-02 | done | high | GOV-SEC-01 | Route-/Auth-/AI-Auditlauf | Verbindlichen Auditlauf ausfuehren und Findings als Tasks erfassen | Auditreport mit Findings; Follow-up-Tasks in OpenTasks angelegt; keine stillen Risiken | no | Audit abgeschlossen: `docs/E150/GOV-SEC-02_Audit_2026-03-26.md`; Follow-ups: GOV-SEC-04/05/06 |
| GOV-SEC-04 | done | high | GOV-SEC-02 | Factcheck/Finding Role-Resolver Hardening + Denied-Audit | Rollenauflosung in sensitiven Factcheck/Finding-Routen auf einen shared, nachvollziehbaren Pfad bringen | Shared Resolver fuer betroffene Routen aktiv; non-prod Query-Role-Bypass entfernt; denied-paths mit strukturiertem Auditlog | no | Erledigt mit `requestRole`-Helper und Routen-Hardening in Factcheck/Finding (`2026-03-26`) |
| GOV-SEC-05 | done | high | GOV-SEC-02 | Vertrauensmodell fuer Service-/Maschinenzugriffe auf Factcheck/Finding | Maschinenzugriffe auf Factcheck/Finding auf kontrollierte interne Identitaet festlegen | Nicht-interaktive Zugriffe laufen nur ueber interne Queue-/Worker-Pfade; kein Query-/Header-Rollenbypass als Service-Contract; Auditierbarkeit als Pflicht dokumentiert | no | Entscheidung manifestiert (2026-03-26): kein frei setzbares Header-Rollenvertrauen fuer Maschinenzugriffe; optionales M2M-JWT bleibt spaeteres Architekturthema |
| GOV-SEC-05A | done | high | GOV-SEC-05 | Shared System-Identity Contract fuer Queue/Worker | Einheitlichen technischen Contract fuer interne Maschinenidentitaet vorbereiten | Shared Helper/Contract fuer interne Queue-/Worker-Aufrufe vorhanden; Vertragsfelder fuer Audit (source, actor kind, run/job reference) definiert; keine neue Produktlogik | no | Erledigt: `systemIdentity`-Helper + Audit-Felder eingefuehrt und in Factcheck/Finding denied-audit Pfade angebunden (`2026-03-27`) |
| GOV-SEC-05B | done | high | GOV-SEC-05A | Factcheck/Finding auf System-Identity Contract umstellen | Betroffene Factcheck-/Finding-Pfade auf den neuen internen Contract migrieren | Maschinenzugriffe in betroffenen Routen nur ueber internen Contract; Query-/Header-Rollenbypass entfernt/gesperrt; User-Pfade bleiben unveraendert | no | Erledigt: Factcheck/Finding akzeptieren Maschinenzugriffe nur noch ueber trusted internal system identity (`INTERNAL_WORKER_TOKEN`/`INTERNAL_HEALTH_TOKEN` + Contract-Header); Header-Role-only wird in sensitiven Pfaden nicht mehr getragen (`2026-03-27`) |
| GOV-SEC-05C | done | medium | GOV-SEC-05B | Audit/Tests fuer Maschinenzugriffe | Denied-/Allowed-Pfade fuer den neuen Maschinencontract testbar und nachvollziehbar machen | Tests decken erlaubte interne Aufrufe und blockierte Header-/Query-Bypasses ab; strukturierte Audit-Logs fuer denied-paths verifiziert | no | Erledigt: Route-Tests fuer enqueue/status/finding decken allowed+denied+query/header-bypass inkl. strukturierter denied-audit Felder ab (`2026-03-27`) |
| GOV-SEC-06 | done | medium | GOV-SEC-02 | Editor-Token Scope in Feed/Diag-Routen | Reichweite und Voraussetzungen fuer `EDITOR_TOKEN` verbindlich festlegen | `EDITOR_TOKEN` ist als explizit begrenzter Break-Glass-/Ops-Fallback fuer den dokumentierten Feed-/Diag-Allowlist-Subset freigegeben; Session-/Admin-Gate bleibt primaer; keine stillschweigende Scope-Ausweitung | no | Entscheidung manifestiert (2026-03-27): kein allgemeiner Admin-/User-Auth-Mechanismus, kein Rollenmodell aus Query/Headern; Evidenzbasis bleibt `GOV-SEC-06A/B` |
| GOV-SEC-06A | done | medium | GOV-SEC-02, GOV-SEC-05C | Editor-Token Ist-Nutzung + Guardrail-Baseline | Entscheidungsreife fuer `EDITOR_TOKEN` herstellen, ohne Scope schon festzulegen | Vollstaendiges Ist-Mapping der `EDITOR_TOKEN`-/Header-Pfade in Feed/Diag-Routen dokumentiert; bestehende allow/deny Contracts sind testseitig abgesichert; keine Erweiterung oder Einschraenkung des aktuellen Scopes | no | Erledigt: Inventar dokumentiert (`docs/E150/GOV-SEC-06A_EDITOR_TOKEN_Inventory_2026-03-27.md`), Helper-/Route-Tests decken allow/deny in Feed+Diag ab (`apps/web/tests/feeds-editor-token-auth.test.ts`, `apps/web/tests/feeds-diag-editor-gate.routes.test.ts`) (`2026-03-27`) |
| GOV-SEC-06B | done | medium | GOV-SEC-06A | `EDITOR_TOKEN` Route-Subset-/Allow-Deny-Matrix + Contract-Tests | Ohne Scope-Entscheid verbleibende Feed-/Diag-Kontraktluecken inventarisieren und regressionssicher einfrieren | Route-Subset-Liste mit aktuellem Gate-Typ (allow/deny) ist dokumentiert; fehlende Ist-Tests fuer bestehende Pfade ergaenzt; keine Scope-Ausweitung/-Einschraenkung und keine neue Auth-Policy | no | Erledigt: Route-/Gate-Istmatrix dokumentiert (`docs/E150/GOV-SEC-06B_EDITOR_TOKEN_ROUTE_MATRIX_2026-03-27.md`), Feed-/Diag-Gate-Tests fuer pull/batch/candidates/analyze-pending ergänzt (`apps/web/tests/feeds-editor-token-scope.routes.test.ts`) (`2026-03-27`) |
| GOV-SEC-06C | done | medium | GOV-SEC-06 | `EDITOR_TOKEN` Allowlist-Hardening + zentrale Scope-Assertion | Manifestierten Allowlist-Scope technisch zentral absichern | Shared Scope-Assertion/Helper erzwingt dokumentierten Route-Subset fuer `EDITOR_TOKEN`; betroffene Feed-/Diag-Routen nutzen denselben Guardrail; Tests fuer allowlisted vs. non-allowlisted Pfade vorhanden | no | Erledigt: zentrale Allowlist-Assertion `isEditorTokenFallbackAllowlistedPath` in `feeds/_auth` erzwingt den dokumentierten Feed-/Diag-Subset fuer Token-Fallback; nicht-allowlisted Pfade bleiben trotz gueltigem Token denied (`apps/web/tests/feeds-editor-token-auth.test.ts`) (`2026-03-27`) |
| GOV-SEC-06D | open | low | GOV-SEC-06C | `EDITOR_TOKEN` Transport-/Env-Hardening | Token-Transport und Env-Gates auf Missbrauchsresistenz pruefen und ggf. haerten | Entscheidungsfreie Hardening-Maßnahmen (z. B. strictere Env-Gates, eindeutige Header-Policy, Auditfelder) sind dokumentiert und umgesetzt, sofern ohne neue Produktentscheidung moeglich | no | Wird erst aktiviert, wenn Scope-Hardening aus `GOV-SEC-06C` abgeschlossen ist; kein neuer Auth-Standard. Im aktuellen Run als moeglicher Folgeslice geprueft, aber nicht gestartet (kein klar kleiner, konfliktfreier Scope ohne breitere Security-Aenderung). |
| GOV-SEC-03 | done | high | GOV-SEC-02, GOV-AI-ORCH-02, GOV-SEC-03A | Zonenmodell + High-Impact-Auditpflicht | PII/Content/AI-Zonen technisch operationalisieren | votes/core Split ist komplett freigegeben; Neo4j- und Prisma-Cross-Store-Pfade sind beide kritisch mit priorisierter Reihenfolge; direkte Providerpfade folgen Mindestcontract aus Auditfeldern, PII-Redaction und Allowlist; Restmigration bleibt schrittweise mit Review-Gate | no | Entscheidung manifestiert (2026-03-28) auf Basis von `GOV-SEC-03A/B`: votes/core komplett statt high-impact-first, Neo4j zuerst tiefer haerten und Prisma direkt danach, Mindestcontract fuer direkte Providerpfade verbindlich. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-SEC-03A | done | high | GOV-SEC-02 | Route-/Store-/Log-Zonenmatrix (Ist-Inventar) fuer PII/Content/AI/Trust | `GOV-SEC-03` von unklarer Blockade auf konkrete Umsetzungsbasis bringen | Inventarisiert sind mindestens zentrale API-Routen, relevante Stores und Audit-Logs mit Zonenklassifikation; offene/unklassifizierte Pfade explizit markiert; keine neue Security-Policy festgelegt | no | Erledigt: repo-nahe Zonenmatrix inkl. Route-/Collection-/Audit-/Provider-Mapping, gemischter Pfade und Rest-Blocker dokumentiert (`docs/E150/GOV-SEC-03A_ZONE_MATRIX_2026-03-27.md`, `2026-03-27`) |
| GOV-SEC-03B | done | medium | GOV-SEC-03A | Machine-readable Zoneninventar + Drift-Checks (Ist-Contract) | Den dokumentierten Ist-Zustand aus `GOV-SEC-03A` technisch regressionssicher machen, ohne neue Policy | Route-/Store-Zoneninventar fuer den High-impact-Subset liegt als machine-readable Contract vor; schlanke Drift-Tests schlagen bei unbeabsichtigter Zonenabweichung an; keine Scope-/Policy-Aenderung | no | Erledigt: machine-readable Inventar + Drift-Contract-Tests fuer High-impact-Pfade eingefuehrt (`docs/E150/GOV-SEC-03B_ZONE_INVENTORY_2026-03-27.json`, `apps/web/tests/gov-sec-03b.zone-inventory.test.ts`) (`2026-03-27`) |
| GOV-SAFETY-03 | done | high | GOV-SAFETY-01, GOV-SAFETY-02 | Social-Eskalation (DM/Gruppen/Kontakt) | Gestufte Freigabe-/Schutzlogik produktseitig verbindlich machen | Kein DM-/Gruppenpfad als Default; Aktivierung nur in ausdruecklich freigegebenen moderierten/kuratierten Kontexten; Oeffnung nur mit Opt-in, Verifikation/Trust-Signal, Cooldown/Rate-Limits, Abuse-/Moderations-Gates und Auditierbarkeit | no | Entscheidung manifestiert (2026-03-26): operative Startform nur moderierte/kuratierte Raeume; kein proximity-first |
| GOV-SAFETY-03A | done | high | GOV-SAFETY-03 | Social-Eskalation Policy-Resolver (Startform) | Technische Guardrails fuer die freigegebene Startform zentralisieren | Shared Resolver/Gate fuer Social-/Kontakt-Eskalation vorhanden; Default bleibt aus; Freigabe nur fuer moderierte/kuratierte Kontexte mit Opt-in + Verifikations-/Trust-Vorbedingungen | no | Erledigt: `escalationPolicy`-Resolver eingefuehrt und `match.request` standardmaessig ohne freigegebenen Kontext/Opt-in/Trust gesperrt (`2026-03-27`) |
| GOV-SAFETY-03B | done | medium | GOV-SAFETY-03A | Abuse-/Moderations-/Audit-Hardening | Sicherheits- und Nachvollziehbarkeitsanforderungen fuer Social-Eskalation absichern | Cooldown/Rate-Limits und Abuse-/Moderations-Gates fuer freigegebene Pfade aktiv; denied/allowed Ereignisse auditierbar; keine neue Produktsurface | no | Erledigt: `match.request` ist um Rate-Limit, Cooldown, Pending-Abuse-Gate und denied/allowed Audit-Logs gehaertet; Freigabemodell unveraendert (`2026-03-27`) |

### B. Anlassraum / Dossier / Swipes

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-ANLASS-01 | in_progress | high | GOV-01 | Anlassraum-Domaenenmodell (`type/topic/scope/status/...`) | Anlassraum als tragfaehige Basisdomaene konsistent halten | Pflichtfelder durchgaengig in Read/Write-Pfaden verankert; keine Shadow-Modelle | no | Baseline im Code aktiv |
| GOV-ANLASS-02 | in_progress | high | GOV-ANLASS-01 | Anlassraum <-> Dossier Beziehung | Mehr-zu-eins und optionale Verdichtung ohne Defekt-Logik absichern | Anlassraum kann ohne Dossier bestehen; Dossier kann mehrere Anlassraeume referenzieren; Flows bleiben manuell kontrolliert | no | Flow-Separation bereits vertieft |
| GOV-ANLASS-03 | open | medium | GOV-ANLASS-01 | Regionen/Skalen + Relevanz-Framing | Scope-/DecisionScope konsistent in Surface/Display durchziehen | Relevanz-Framing konsistent in relevanten Surfaces; Tests fuer Scope-Ableitung vorhanden/aktualisiert | no | Technisch klar, aber nicht priorisiert |
| GOV-ANLASS-04 | in_progress | medium | GOV-ANLASS-01 | Feed-Review Decisioning | Leerlauf vermeiden, manuelle Decisioning-Pfade sichtbar halten | Queue-Decision-Pfade transparent; Attach priorisiert bei bestehender Zuordnung; kein Auto-Publish | no | Decisioning-Vertiefung laeuft |
| GOV-ANLASS-08 | open | medium | GOV-ANLASS-04, GOV-SAFETY-03 | Community-Research mit Factcheck-/Truth-Guardrails | Research-Workflow sicher mit Anlassraum-/Review-Logik koppeln | Klarer Flow von Research-Hinweisen zu reviewbaren Kontextobjekten; keine ungeprueften Publish-/Social-Bypasses | no | Ist-Mapping (`GOV-ANLASS-08A`), Safety-Startform-Anschluss (`GOV-ANLASS-08B`) und Guardrail-Contract-Tests (`GOV-ANLASS-08C`) sind umgesetzt; verbleibender Scope liegt bei weiterem Community-Flow-Ausbau ausserhalb dieses Hardening-Slices |
| GOV-ANLASS-08A | done | medium | GOV-ANLASS-04 | Community-Research -> Review/Anlassraum Inventar | Nicht-entscheidungsbehaftete Ist-Inventarisierung der aktuellen Research-/Review-Pfade erstellen | Part09/Part16 enthalten ein kompaktes Mapping der vorhandenen Surfaces/Endpoints/Guardrails; offene Punkte mit Decision-Boundary sind explizit als abh. von `GOV-SAFETY-03` markiert; keine Produktregeln veraendert | no | Erledigt: Ist-Mapping in `docs/E150/Part09_Community_Research_Workflow.md` (Abschnitt 1.1) und `docs/E150/Part16.md` (Abschnitt H) aufgenommen (`2026-03-26`) |
| GOV-ANLASS-08B | done | medium | GOV-ANLASS-08, GOV-SAFETY-03A | Community-Research -> Review Anschluss mit Safety-Startform | Research-nahe Anschlusslogik an die entschiedene Social-Safety-Startform anbinden | Research/Review-Dokumentation und Contracts referenzieren nur moderierte/kuratierte Startkontexte; kein DM-/Gruppen-Default; keine unkontrollierte Kontaktfreigabe | no | Erledigt: Research-APIs/Admin-Review tragen den Safety-Startform-Contract explizit in Response/Logs; Research-Surface weist den kontaktseitigen Guardrail aus (`2026-03-27`) |
| GOV-ANLASS-08C | done | medium | GOV-ANLASS-08B | Research-Factcheck Guardrail Contract-Tests | Bereits entschiedene Guardrails ueber Research-/Review-Routen regressionssicher machen | Tests verifizieren fuer Research-Endpoints: kein unkontrollierter Kontakt-/Publish-Bypass, Safety-Contract bleibt sichtbar; bestehendes Verhalten bleibt unveraendert | no | Erledigt: Research-Submit ignoriert kontaktbezogene Payload-Felder weiterhin, Admin-Review-Status bleibt gate-geschuetzt ohne Query-Bypass, und Research-/Review-Responses tragen den Safety-Startform-Contract konsistent (`2026-03-27`) |
| GOV-EVENT-01 | in_progress | medium | GOV-ANLASS-01 | Event-/Sitzungsmodell | Event-Kontext sauber mit Anlassraum verknuepfen | Event-Flow referenziert/erstellt Anlassraum stabil; no-auto-publish bleibt intakt | no | Core-Baseline aktiv |
| DOCS-HARM-06 | done | medium | DOMAIN-HARM-01 | Anlassraum(`/runden`) vs Dossier vs Swipes Wording | Docs entlang Ist-Code ohne Overreach harmonisieren | Keine harte Fehlkanonisierung; konditionales Finalize-Routing konsistent dokumentiert; Option-B-Entscheid (`/runden` bleibt, `/anlassraum` als Alias-Zielrichtung ohne harte Migration) in den betroffenen Parts konsistent | no | Erledigt: Option-B-Wording in Part05, Part14, Part16_AI und create-intake auf denselben Surface-Kanon harmonisiert; `/runden` bleibt aktive Public-Surface, `/anlassraum` ist als non-breaking Alias-Wrapper eingefuehrt (`2026-03-27`) |
| DOMAIN-HARM-01 | done | high | GOV-AI-ORCH-02 | Oeffentliche Benennung `/runden` vs dedizierte Anlassraum-Route | Surface-Kanon klar entscheiden | Produktentscheidung dokumentiert; daraus abgeleitete Folge-Tasks erzeugt | no | Entscheidung manifestiert (2026-03-27): Option B. `/runden` bleibt kanonische oeffentliche Surface, `/anlassraum` ist offizieller Alias-/Zielbegriff ohne harte Migration/Umbenennung im Ist-Stand |
| DOMAIN-HARM-01A | done | medium | DOCS-HARM-06 | Surface-/Routing-Ist-Matrix fuer Anlassraum-Benennung | Entscheidungsgrundlage fuer `/runden` vs dedizierte Anlassraum-Route erzeugen, ohne Umbenennung umzusetzen | Matrix zeigt aktuelle oeffentliche Entry-Points, Redirects, Labels und Querverweise (`/runden`, `/swipes`, `/dossier`); konkrete Aenderungsorte pro Option sind dokumentiert; keine Route-Umbenennung und keine neue Surface-Logik | no | Erledigt: Ist-Matrix inkl. Wrapper-/Redirect-Kette, Wording-Inventar und Option-A/B/C-Aenderungsorte dokumentiert (`docs/E150/DOMAIN-HARM-01A_SURFACE_ROUTING_MATRIX_2026-03-27.md`, `2026-03-27`) |
| DOMAIN-HARM-01B | done | medium | DOMAIN-HARM-01 | Alias-Vorbereitung `/anlassraum` (ohne Migration) | Non-breaking Alias-Pfad als spaeteren technischen Slice klar vorbereiten | Konkreter Technik-Slice fuer offiziellen Alias definiert (Wrapper/Redirect auf `/runden`, Route-Inventar-Update, Paritaets-Tests); keine Umbenennung bestehender `/runden`-Links; keine harte Migration | no | Erledigt: oeffentliche Alias-Route `/anlassraum` als Redirect-Wrapper auf `/runden` eingefuehrt; Query-Paritaet und Wrapper-Verhalten testseitig abgesichert; Routeninventar + Surface-Doku aktualisiert (`2026-03-27`) |
| DOMAIN-HARM-01C | needs_decision | low | DOMAIN-HARM-01B | Harte Migration auf `/anlassraum` | Nur bei spaeterem expliziten Migrationsentscheid von Alias auf kanonische Route wechseln | Expliziter Migrationsentscheid inkl. Redirect-/Backlink-/SEO-Policy liegt vor; danach erst Umsetzungsslices | yes | Bewusst offen gelassen; kein stilles Vorziehen der Migration |
| PR-0042 | done | medium | UX-HARM-01 | Swipes Kontextpfade | Thematischen Rueckweg in Swipes robust und inkonsistenzfrei machen | Kontextlink nur bei belastbarer Datenlage; keine erfundenen Ziele; Tests fuer Resolver/Anzeige | no | Hardening aktiv in `arrival.ts` (allowlist/create+anlassraumId) + Tests `swipes-arrival.helpers.test.ts` |
| PR-0043 | open | medium | PR-0042 | Swipes Mobile Gestures + Bottom-Actions | Mobile Bedienbarkeit verbessern ohne IA-Drift | Thumb-reachable Actions mit bestehender Logik kompatibel; keine neue Produktregel | no | UX-Scope klar, aber nach Kontextpfaden |
| PR-0044 | needs_decision | medium | UX-HARM-01 | Swipes Varianten-Schritt (Ranking/Weighting/Exclude) | Bewertungslogik fachlich freigeben | Ranking-/Weighting-Regeln explizit freigegeben und testbar spezifiziert | yes | Fachlogik offen |
| PR-0045 | done | low | UX-HARM-01 | Swipes UX-Dedupe | Redundante Vertiefungen entfernen | Keine doppelte Guidance/CTAs; bestehende Flows bleiben funktional gleich | no | Erledigt: redundante Arrival-Guidance in Swipes reduziert, ohne Routing-/Flow-Änderung (`2026-03-26`) |

### C. Docs Harmonization / Backlog Hygiene

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DOCS-HARM-01 | done | medium | GOV-SEC-03 | Part00 an Mapping-Logik angleichen | Part00 konsistent zu Part01-16 und OpenTasks ausrichten | Querverweise PII/Auth/Telemetry konsistent; keine widerspruechlichen Kanonsaetze | no | Part00 um Mapping-/Querverweis- und ENV-Alias-Abschnitt erweitert (`2026-03-26`) |
| DOCS-HARM-02 | done | low | none | Formatdrift in fruehen Parts | Lesbarkeit/Struktur harmonisieren ohne Inhaltsumbau | Uneinheitliche Listen/Alt-Codebloecke bereinigt; inhaltliche Aussagen unveraendert | no | Erledigt: fruehe Part-Formatdrift in Part00/Part02/Part03 bereinigt (Listen/Codeblock-Konsistenz, keine Inhaltsaenderung) (`2026-03-26`) |
| DOCS-HARM-03 | done | low | none | `ROUTES.generated.*` Runbook-Klarstellung | Manuelle Drift bei Generated-Artefakten verhindern | Artefakte klar als read-only dokumentiert; Runbook-Hinweis vorhanden | no | Erledigt: Generator-Preamble + Runbook-Hinweis in Surface-Architektur dokumentiert (`2026-03-26`) |
| DOCS-HARM-04 | done | medium | GOV-AI-ORCH-02 | Glossar `Registry/Review/Operator/Demo/Beteiligung` | Begriffe zentralisieren und verlinken | Kurzglossar in Part01/Part16 + OpenTasks referenziert; Begriffsdrift reduziert | no | Erledigt: Kurzglossar in Part01 ergänzt und in Part16 abgeglichen (`Registry/Review/Operator/Demo/Beteiligung`), inkl. Querverweise auf SSOT/Detaillogik (`2026-03-27`) |
| DOCS-HARM-05 | done | low | none | `ORPHAN_FEATURES` + `E150_NEEDS_REVIEW` Hygiene-Board | Operative Follow-up-Pfade sichtbar halten | Part15/OpenTasks-Verlinkung konsistent; offene Punkte klar einsortiert | no | Erledigt: Hygiene-/Evidenzrollen in `ORPHAN_FEATURES_VPM25.md` und `E150_NEEDS_REVIEW.md` klar markiert, Part15-Referenz ergänzt, SSOT-Grenze dokumentiert (`2026-03-26`) |
| UX-COPY-HARM-01 | in_progress | medium | UX-HARM-01 | Frontend-Umlaute (`ä/ö/ü/ß`) in Legacy-Copy | Schreibweise im UI vereinheitlichen | Keine `ae/oe/ue`-Ersatzformen in neuen/angepassten UI-Texten; technische Bezeichner unveraendert | no | Regel gesetzt; erste Flächen migriert (u. a. `ContributionNewClient.tsx`, `app/runden/page.tsx`); Admin-Feeds-Slice ueber `UX-COPY-HARM-02` erledigt, Restmigration offen |
| UX-COPY-HARM-02 | done | low | UX-COPY-HARM-01 | Admin-Feeds Copy-Migration (Umlaute) | Verbleibende `ae/oe/ue`-Ersatzformen in klar begrenzten Admin-Feeds-Surfaces auf echte Umlaute umstellen | Nur user-facing Copy in `admin/feeds`-Surfaces angepasst; keine API-/ID-/Routing-Aenderung; bestehende Page-Tests fuer Feed-Drafts bleiben grün | no | Erledigt: Admin-Feeds Detail-Copy auf konsistente deutsche Schreibweise mit Umlauten geschärft; technische Bezeichner unveraendert (`2026-03-26`) |

### D. Community / Feeds / UX / Env

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR-0041-GROUP-SURFACE | in_progress | medium | none | Community Group Surface Entkopplung | Read-Resolver/Route/Page-Kontrakte stabilisieren | Kein Demo-Fallback; Invalid/Unavailable sauber; read-only Guardrails intakt | no | Entspricht laufendem PR-0041-Cluster |
| PR-0041-DEEP-LINKS | in_progress | medium | PR-0041-GROUP-SURFACE | Community Deep-Link Contracts | Alias-Normalisierung und Canonical-Hrefs konsistent halten | Gleiche Param-Validierung in Resolver/Route/Page; Invalid-States stabil | no | Laufender Contract-Hardening-Teil |
| PR-FEED-ANLASS-04 | in_progress | medium | GOV-ANLASS-04 | Feed/Anlassraum Status-Transitions | Decisioning/Statuspfade robust machen | Transitionen nachvollziehbar; Fehler-/Audit-Sichtbarkeit stabil; keine Auto-Publish-Wege | no | Bereits vertieft, Restarbeit offen |
| PR-FEED-ANLASS-06-BACKFILL | in_progress | medium | PR-FEED-ANLASS-04 | Feed/Anlassraum Legacy-Backfill | Legacy-Remediation reproduzierbar und auditierbar halten | Detection + per-Item Backfill stabil; keine Silent-Migration; Auditfelder sichtbar | no | Fortlaufende Legacy-Hardening-Arbeit |
| PR-0046 | done | low | none | UI-Konsistenz Light/Dark | Offene visuelle Inkonsistenzen in definierten Surfaces bereinigen | Regressionsliste abgearbeitet; keine neuen Theme-Brueche in betroffenen Admin-Surfaces | no | Erledigt: konsistente Link-/Action-Tokens und Dark-Varianten in Admin-Feeds-Surfaces (`admin/feeds`, `admin/feeds/drafts`, `admin/feeds/drafts/[id]`) ohne Verhaltensaenderung (`2026-03-26`) |
| PR-0047 | open | low | PR-0046 | Account Dark-Mode Nacharbeit | Account-Komponenten auf Token-/Theme-Konsistenz bringen | Token-Check abgeschlossen; Dark-Mode auf Account-Surfaces konsistent | no | Nach globalem Light/Dark-Pass |
| VOG-SITE-P0-03 | done | high | none | Public Surface `/howtoworks/edebatte`, Site-Nav-Copy | \"So funktioniert’s\" als ruhige, mobile-first RePro-Nutzerreise ausrichten | Oeffentliche Seite stellt den Ablauf klar als `Check -> Dossier -> Beteiligung -> Status` dar; VoiceOpenGov ist als Initiative und eDebatte als Werkzeug getrennt erklaert; Rollenanker fuer bestehende Deep-Links (`#rolle-buerger`, `#rolle-vereine`, `#rolle-verwaltung`) bleiben erreichbar | no | Erledigt: Seite auf nutzernahe RePro-Nutzerreise umgestellt, Navigation-Copy harmonisiert (`So funktioniert’s`), keine Routing- oder Produktlogik geaendert (`2026-03-27`) |
| PR-ENV-01 | done | medium | GOV-SEC-01 | Env-Key-Hardening | Runtime-Aliasse und Key-Nutzung absichern | Alias-Drift reduziert; riskante Key-Fallbacks dokumentiert/abgesichert | no | Runtime-Mongo-Alias-Resolver eingefuehrt und in Stores/Ping angebunden; Tests aktiv (`2026-03-26`) |
| PR-ENV-02 | open | medium | PR-ENV-01 | Mongo SRV `ECONNREFUSED` Hardening | Netz-/DNS-/Config-Fallback robuster machen | Belastbares Fehlerbild + Fallback-Strategie nach ENV-Hardening umgesetzt | no | Aufgeteilt in kleine Folgeslices; erster umsetzbarer Slice: `PR-ENV-02A` |
| PR-ENV-02A | done | medium | PR-ENV-01 | Mongo Runtime-Fehlerklassifikation + Tests | SRV/DNS/Connection-Fehlerbilder in Runtime-Pfaden deterministisch klassifizieren und testbar machen | Shared Fehlerklassifikation fuer Mongo-Runtimepfade eingefuehrt; mindestens `mongoPing` + ein Store-Pfad nutzen sie; Tests decken SRV/DNS/`ECONNREFUSED`-Faelle ab; keine neue Produkt- oder Routinglogik | no | Erledigt: shared Klassifikation (`runtimeMongoErrors`) in `mongoPing` + `draftStore` angebunden; Runtime-Tests fuer SRV/DNS/ECONNREFUSED ergänzt (`2026-03-26`) |

### E. Strategischer Programm-Backlog (nicht codex_ready)

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-SIGNAL-01 | done | medium | GOV-ANLASS-01 | Signalmodell (Aggregation/Decay/Trigger/Radar) | Signal-Logik als belastbaren Produkt-/Governance-Kanon definieren | Option A ist als Startkanon freigegeben; Signal bleibt Relevanz-/Dynamik-/Priorisierungs-/Radarlogik und ist explizit kein Wahrheits-/Fakten-/Voting-/Funding-Legitimationsmechanismus; Anti-Capture-Gates und Auditierbarkeit sind verbindlich | no | Entscheidung manifestiert (2026-03-28): policy-/profilgesteuerte Decay-Logik (Kurzzyklus/Standard/Quartal/Halbjahr), anschlussfaehig fuer Medien/Verbaende/Firmen/Kommunen/Veranstaltungen sowie offene/geschlossene Raeume; Anlassraeume bleiben initiierbar und epistemisch offen. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-FUNDING-01 | done | high | GOV-SIGNAL-01 | Signals + Funding Grundmodell | Trennung/Verzahnung von Funding Intent, Readiness, Impact entscheiden | Funding bleibt von Relevanz, Wahrheit/Faktenstatus, Voting und Legitimation getrennt; Funding dockt primaer an konkreten Anlassraeumen an; Freigabelogik, Transparenzpflicht und Anti-Capture-Gates sind verbindlich dokumentiert | no | Entscheidung manifestiert (2026-03-28): Dossier bleibt Oberraum, Anlassraum ist fundingfaehiger Teilraum; Startkanon mit Anlass-Funding, Dossier-nahem Funding und Ressourcen-/Begleit-Funding; Public Core bleibt offen, Professional Layer bepreist Arbeitsfaehigkeit statt epistemischer Sondermacht. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-FUNDING-02 | done | medium | GOV-FUNDING-01 | Ressourcen/Sachleistungen | Nicht-monetare Unterstuetzung in Funding-Modell integrieren | Datenmodell + Prozessschritte aus GOV-FUNDING-01 abgeleitet | no | Erledigt (2026-03-29): typed Ressourcen-/Sachleistungs-/Begleit-Contract inkl. Anlassraum-first, Matching-Frame und Capture-/Transparenz-Guardrails in `apps/web/src/lib/server/funding/fundingSupportContract.ts`; Contract-Tests in `apps/web/tests/funding-support-contract.test.ts`; operative Evidenz: `docs/E150/GOV-FUNDING-02_RESOURCE_SUPPORT_CONTRACT_2026-03-29.md`. |
| GOV-FUNDING-03 | done | medium | GOV-FUNDING-01 | Impact/Refunding | Wirksamkeits-/Refunding-Logik operationalisieren | Fortschritt/Nachweis/Refunding-Pfade spezifiziert und testbar | no | Erledigt (2026-03-29): typed Impact-/Follow-up-/Refunding-Lifecycle-Contract in `apps/web/src/lib/server/funding/fundingImpactLifecycleContract.ts` eingefuehrt inkl. Anlassraum-first-/Matching-/Refunding-Guardrails und route-naher Baseline-Ausgabe (`meta.fundingImpactLifecycle`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/funding-impact-lifecycle-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; operative Evidenz: `docs/E150/GOV-FUNDING-03_IMPACT_REFUNDING_CONTRACT_2026-03-29.md`. |
| GOV-PRICING-01 | done | high | GOV-FUNDING-01 | Hybrid-Pricing | Preislogik (Basis + variable Komponenten + Caps) freigeben | Public Core vs Professional Layer verbindlich getrennt; Hybridmodell mit Caps ist Startkanon; nicht zulaessige Preishebel (Wahrheit/Signalhoehe/Faktenstatus/politisches Gewicht/Abstimmung/Debattenausgang) sind ausgeschlossen; Segmentlogik inkl. Civic/Media/Team/Organization/Kommune ist dokumentiert | no | Entscheidung manifestiert (2026-03-29): Pricing bezahlt Arbeitsfaehigkeit statt epistemischer Sondermacht; Kommunen/institutionelle Standardfaelle sind online/verifizierungsfaehig mit dokumentiertem Korridor (mind. 500 EUR oder 1,99 %, je nachdem was hoeher ist). Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-PRICING-02 | done | medium | GOV-PRICING-01 | Admin Pricing Control | Admin-Rabatt-/Profilsteuerung auf finalem Pricing-Modell aufsetzen | Pricing/Fee/Segment/Verifizierungsstatus/Creator-Typ/Overrides sind im Admin nachvollziehbar und auditierbar; KPI-/Governance-/Explainability-Pflichten folgen dem manifestierten Pricing-Kanon | no | Operativer Abschlussstand (2026-03-29): `GOV-PRICING-02A` (Policy-/Override-/Explainability-Contract), `GOV-PRICING-02B` (Audit-/KPI-Contract) und `GOV-PRICING-02C` (Readmodel-Integration in bestehende Admin-Reads) sind umgesetzt. Referenz: `docs/E150/GOV-PRICING-02_ADMIN_PRICING_CONTROL_CONTRACT_2026-03-29.md`. |
| GOV-PRICING-02A | done | high | GOV-PRICING-02 | Shared Pricing-Control-Policy-Contract (typed) | Typed Policy-/Override-/Explainability-Contract fuer Admin Pricing Control ohne Billing-Engine implementieren | Shared Types/Schema/Normalizer fuer erlaubte Pricing-Control-Felder vorhanden; Pflichtfelder fuer Override-Reason/Audit sind technisch erzwungen; Tests decken erlaubte vs. unerlaubte Felder ab; keine Preisformel-/Checkout-Logik | no | Erledigt (2026-03-29): typed Contract + Guardrails in `apps/web/src/lib/server/pricing/adminPricingControlContract.ts`; Contract-Tests in `apps/web/tests/admin-pricing-control-contract.test.ts` (5/5 grün); keine Billing-/Checkout-/UI-Logik erweitert. |
| GOV-PRICING-02B | done | medium | GOV-PRICING-02A | Pricing-Control Audit-/KPI-Contract | Strukturierte Audit-/KPI-Contracts fuer Pricing-Controls route-/service-nah vorbereiten | Audit-Event-Contract fuer Pricing-Overrides/Specials inkl. Actor/Reason/Scope vorhanden; KPI-Snapshot-Contract fuer Pricing-Control-Pflichtfelder dokumentiert oder typisiert; Tests frieren Contract-Paritaet ein; keine Billing-/Pricing-Engine | no | Erledigt (2026-03-29): typed Audit-Event-/KPI-Snapshot-Contracts in `apps/web/src/lib/server/pricing/adminPricingControlContract.ts` erweitert; neue Regressionstests in `apps/web/tests/admin-pricing-control-audit-kpi-contract.test.ts`; Contract-Evidenz fortgeschrieben in `docs/E150/GOV-PRICING-02_ADMIN_PRICING_CONTROL_CONTRACT_2026-03-29.md`. |
| GOV-PRICING-02C | done | low | GOV-PRICING-02B | Admin Pricing Control Readmodel-Integration | Contract-Ebene aus 02A/02B in bestehende Admin-Reads integrieren | Admin-Readmodel zeigt Segment/Plan/Fee/Caps/Specials/Overrides konsistent; Explainability- und Auditbezug sichtbar; keine neue Checkout-/Payment-Logik | no | Erledigt (2026-03-29): typed Readmodel-Resolver in `apps/web/src/lib/server/pricing/adminPricingControlReadModel.ts` eingefuehrt, in `apps/web/src/app/api/admin/dashboard/summary/route.ts` als Pricing-Control-Read integriert; Regressionstests in `apps/web/tests/admin-pricing-control-readmodel.test.ts`; keine Billing-/Checkout-/UI-Logik. |
| GOV-JOURNALISM-01 | done | medium | GOV-ANLASS-02 | `source_anchor` als Anlassgeber | Journalismus-Modell in Anlassraum-/Dossier-Kern einbetten | Journalismus ist als Anlassgeber freigegeben, aber ohne Sonderwahrheit/-macht; Anlassraeume bleiben epistemisch offen; Team-/Rollenanschluss fuer Redaktion und institutionelle Nutzung ist normativ klar und fachlich getrennt zum Muni-Kanon | no | Entscheidung manifestiert (2026-03-29): `source_anchor` ist Startkontext ohne privilegierte Deutungsmacht; beschleunigte Pfade nur transparent als Workflow-Erleichterung; Sondertools/Spezialpfade sind zulaessig, wenn sie transparent, anschlussfaehig und nicht kanonverdraengend sind. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-JOURNALISM-02 | done | medium | GOV-JOURNALISM-01 | Truth Guardrails + Factcheck | Journalistische Qualitaets-/Safety-Pfade ausbauen | Guardrails in redaktionellen Flows eindeutig verankert | no | Erledigt (2026-03-29): shared `source_anchor`-Truth-Guardrail-Contract in `features/anlassraum/journalismGuardrails.ts` eingefuehrt und route-nah in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` als Meta-Contract angeschlossen; Tests in `apps/web/tests/journalism-truth-guardrails.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; operative Evidenz: `docs/E150/GOV-JOURNALISM-02_TRUTH_GUARDRAILS_FACTCHECK_CONTRACT_2026-03-29.md`. |
| GOV-JOURNALISM-03 | done | low | GOV-JOURNALISM-01 | Newsroom Embed/QR Companion | Produktive Integrationspfade fuer Newsroom-Einsatz | Embed-/QR-Pfade auf finalem Journalismus-Kanon aufgebaut | no | Erledigt (2026-03-29): shared Companion-/Embed-/QR-Contract in `features/anlassraum/journalismCompanionContract.ts` eingefuehrt und route-nah als `meta.journalismCompanionContract` in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` eingebunden; Tests in `apps/web/tests/journalism-companion-contract.test.ts` + `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-JOURNALISM-03_COMPANION_EMBED_QR_CONTRACT_2026-03-29.md`. |
| GOV-JOURNALISM-04 | done | low | GOV-JOURNALISM-01 | Journalist-/Redaktionsprofile | Rollen-/Profilebenen fuer Journalismus finalisieren | Profile/Trust/Rollen konsistent mit Governance-Modell | no | Erledigt (2026-03-29): shared Rollen-/Profil-/Publisher-Contract in `features/anlassraum/journalismRoleProfileContract.ts` eingefuehrt (inkl. Konsistenzpruefung) und route-nah als `meta.journalismRoleProfile` + `meta.journalismConsistency` eingebunden; Tests in `apps/web/tests/journalism-role-profile-contract.test.ts` + `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-JOURNALISM-04_ROLE_PROFILE_PUBLISHER_CONTRACT_2026-03-29.md`. |
| GOV-MUNI-01 | done | high | GOV-ANLASS-01 | Buergermeister-Dashboard | Kommunale Priorisierung und Kernmetriken freigeben | Monitoring-first ist als Startkanon verbindlich; Dashboard bleibt Kontext-/Status-/Transparenzinstrument ohne Anlassraum-/Dossier-Uebersteuerung; KPI-/Status-/Zustaendigkeitslogik ist mit Anti-Blackbox-Guardrails dokumentiert | no | Entscheidung manifestiert (2026-03-29): kommunales Dashboard startet ohne fruehen Verwaltungs-Autopilot; legitime KPI-Gruppen, Nicht-Ziele (kein hidden scoring/keine Wahrheits-/Prioritaetsmaschine), Team-/Rollenanschluss sowie Sondertool-Guardrails sind repo-nah festgezogen. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-MUNI-02 | done | medium | GOV-MUNI-01 | Dezernatslogik | Verwaltungszustaendigkeiten operativ abbilden | Dezernatsmapping und Verantwortungslogik spezifiziert | no | Erledigt (2026-03-29): shared Dezernats-/Zustaendigkeits-Guardrail-Contract in `features/anlassraum/municipalResponsibilityGuardrails.ts` eingefuehrt und route-nah in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` als Meta-Contract angeschlossen; Tests in `apps/web/tests/municipal-responsibility-guardrails.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; operative Evidenz: `docs/E150/GOV-MUNI-02_DEPARTMENT_RESPONSIBILITY_CONTRACT_2026-03-29.md`. |
| GOV-MUNI-03 | done | medium | GOV-MUNI-01 | Raum-/Prozessstatus Verwaltung | Verwaltungsstatus auf Anlassraum-/Dossier-Flows mappen | Statusmodell konsistent und nachvollziehbar | no | Erledigt (2026-03-29): shared Status-/Prozess-Contract in `features/anlassraum/municipalProcessStatusContract.ts` eingefuehrt und route-nah in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` als Meta-Contract (`meta.municipalProcessStatus`) angebunden; Tests in `apps/web/tests/municipal-process-status-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; operative Evidenz: `docs/E150/GOV-MUNI-03_PROCESS_STATUS_CONTRACT_2026-03-29.md`. |
| GOV-MUNI-05 | done | medium | GOV-MUNI-01 | Verwaltungsmodus | Verwaltungsoberflaechen regelkonform schalten | Modusregeln und Governance-Gates definiert | no | Erledigt (2026-03-29): shared Verwaltungsmodus-/Governance-Gate-Contract in `features/anlassraum/municipalGovernanceModeContract.ts` eingefuehrt (inkl. Transition-Validation, Reason-/Audit-Pflichten) und route-nah als `meta.municipalGovernanceMode` in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` angebunden; Tests in `apps/web/tests/municipal-governance-mode-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; operative Evidenz: `docs/E150/GOV-MUNI-05_GOVERNANCE_GATES_CONTRACT_2026-03-29.md`. |
| GOV-MUNI-06 | done | medium | GOV-MUNI-01 | Beamten-/Verwaltungsrollen | Rollenmodell fuer Verwaltung vervollstaendigen | Rollenrechte konsistent mit GOV-02/Governance | no | Erledigt (2026-03-29): shared Rollen-/Governance-Profil-Contract in `features/anlassraum/municipalRoleGovernanceContract.ts` eingefuehrt (inkl. Rollenprofil-Mapping, rollenbezogene Governance-Aktionen, Reason-/Audit-Pflichten und Stack-Konsistenzpruefung); route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` als `meta.municipalRoleGovernance` + `meta.municipalRoleGovernanceConsistency`; Tests in `apps/web/tests/municipal-role-governance-contract.test.ts`, `apps/web/tests/municipal-governance-stack-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; operative Evidenz: `docs/E150/GOV-MUNI-06_ROLE_GOVERNANCE_PROFILE_CONTRACT_2026-03-29.md`. |
| GOV-ORG-01 | done | medium | GOV-ANLASS-02 | Dossierbasierte Organisationsidentitaet | Organisationskontext sauber an Dossier/Anlassraum andocken | Organisationsidentitaet ohne Parallel-Domaene definiert | no | Erledigt (2026-03-29): typed Org-Context-/Attachment-Contract in `features/anlassraum/orgContextAttachmentContract.ts` inkl. Anlassraum-/Dossier-Andockung, Guardrails und Konsistenzcheck; route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (`meta.orgContextAttachment`, `meta.orgContextConsistency`); Tests: `apps/web/tests/org-context-attachment-contract.test.ts`, `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-ORG-01_DOSSIER_ANLASSRAUM_ORG_CONTEXT_CONTRACT_2026-03-29.md`. |
| GOV-ORG-02 | open | medium | GOV-ORG-01 | offizieller Release-/Trust-Modus | Trust-/Release-Pfade fuer Organisationen festlegen | Freigaberegeln mit Governance-Rollen und Audit kompatibel | no | Auf GOV-ORG-01 aufbauend; naechster sinnvoller ORG-Folgeblock. |
| GOV-CIVIC-01 | done | medium | GOV-ANLASS-01 | Civic Rollen-/Sichtbarkeits-/Repraesentanzbaseline + Wirkungsverlauf | Civic-Rollen/Arbeitsstufen/Repraesentanzachsen (Thema vs Region) domain-konsistent aufbauen und an Wirkungsverlauf anbinden | Typed Role-/Visibility-/Representation-Contract liegt vor, an Anlassraum/Dossier/Companion angebunden, ohne Wahrheits-/Prioritaets-/Voting-Sondermacht; CIVIC-02 und CIVIC-03 setzen Lifecycle sowie Impact-/Unterstuetzungslogik darauf auf | no | Erledigt (2026-03-30): shared Contract `features/anlassraum/civicCreatorRepresentationContract.ts` inkl. route-naher Meta-Ausgabe (`meta.civicCreatorRepresentation`, `meta.civicCreatorRepresentationConsistency`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/civic-creator-representation-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-01_CREATOR_STREAM_REPRESENTATION_CONTRACT_2026-03-29.md`. |
| GOV-CIVIC-02 | done | medium | GOV-CIVIC-01 | Initiative-Lifecycle | Initiative-Prozess an Governance-Kern anbinden | Lifecycle-Status inkl. Uebergaengen ist explizit modelliert; erlaubte/gesperrte Transitionen sind profile-/capability-basiert definiert; keine Wahrheits-/Prioritaets-/Voting-Sondermacht | no | Erledigt (2026-03-30): typed Lifecycle-/Transition-Contract in `features/anlassraum/civicCreatorLifecycleContract.ts` inkl. Transition-Evaluator/Consistency-Validator, route-nahe Meta-Einbindung (`meta.civicCreatorLifecycle`, `meta.civicCreatorLifecycleConsistency`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/civic-creator-lifecycle-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-02_INITIATIVE_LIFECYCLE_TRANSITION_CONTRACT_2026-03-30.md`. |
| GOV-CIVIC-03 | done | medium | GOV-CIVIC-01, GOV-FUNDING-01 | Impact-/Unterstuetzungslogik fuer Initiativen | Impact/Funding-Logik fuer Initiativen konsistent integrieren | Explizite Support-/Impact-Kontexte sind lifecycle-gebunden modelliert; Unterstuetzung bleibt von Wahrheit/Prioritaet/Abstimmungsgewicht/Faktenstatus getrennt; keine Billing-/Funding-Engine im CIVIC-Block | no | Erledigt (2026-03-30): typed Impact-/Unterstuetzungs-Contract in `features/anlassraum/civicCreatorImpactSupportContract.ts` inkl. lifecycle-basierter Supportableitung, Guardrails und Consistency-Validator; route-nahe Meta-Einbindung (`meta.civicCreatorImpactSupport`, `meta.civicCreatorImpactSupportConsistency`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/civic-creator-impact-support-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-03_IMPACT_SUPPORT_CONTRACT_2026-03-30.md`. |

### F. Foundation / Completed Anchors (coverage-relevant)

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-01 | done | high | none | Governance Core | Gemeinsames Lifecycle-Modell als abgeschlossene Basis festhalten | Modell fuer Anlassraum/Dossier/Runde/Mandat dokumentiert und verlinkt | no | Wave-1 Foundation abgeschlossen |
| GOV-02 | done | high | GOV-01 | Trust / Rollen / Raumtypen | Rollen-/Trust-Grundmodell als abgeschlossenen Referenzanker halten | Rollen-/Trust-Grundlagen sind dokumentiert und in Guardrails referenziert | no | Wave-1 Foundation abgeschlossen |
| DOCS-GOV-01 | done | medium | GOV-01, GOV-02 | Architektur-Doku-Synchronisierung | Doku-SSOT als abgeschlossenen Referenzanker halten | Part-/OpenTasks-Referenzen auf Governance-Basis konsistent | no | Done-Referenz fuer Docs-Kanon |
| GOV-EVENT-02 | done | medium | GOV-EVENT-01 | QR -> Fragen -> Protokoll -> Dossier -> Runde | Contract-basierte Event-zu-Dossier/Round-Kette als abgeschlossenen Referenzanker halten | Manual-first Contracts + Legacy-Backfill-Strategie dokumentiert und testbar referenziert | no | Functional closure dokumentiert |
| GOV-AI-ORCH-01 | done | high | none | Kanonisches 5-Orchester-Zielbild | Zielbild als abgeschlossenen Referenzanker halten | Zielbild inkl. Guardrails dokumentiert und von Folgetasks referenziert | no | Grundlage fuer ORCH-02/03 |
| GOV-SAFETY-01 | done | high | none | Commitment-first statt Proximity-first | Sicherheitsgrundsatz als abgeschlossenen Referenzanker halten | Grundsatz in Safety-/Community-Folgetasks referenziert | no | Policy canonized |
| GOV-SAFETY-02 | done | high | GOV-SAFETY-01 | Schutzregeln vulnerable Nutzergruppen | Schutzgrundsaetze als abgeschlossenen Referenzanker halten | Schutzregeln in Social-/Moderationsfolgetasks referenziert | no | Policy canonized |
| PR-AI-MATCH-10 | done | medium | PR-AI-CREATE-01 | History Backfill Utility + Contract Docs | History-Backfill-Stand als abgeschlossenen Referenzanker halten | Utility/Script/Contract-Notizen konsistent dokumentiert | no | Legacy-History-Stand abgeschlossen |
| PR-AI-MATCH-11 | done | medium | PR-AI-MATCH-10 | Single Opaque History Cursor + Queue cleanup | Cursor-Contract-Hardening als abgeschlossenen Referenzanker halten | Single-Cursor-Contract in aktiven Attach-Tasks konsistent referenziert | no | Contract/UX polish abgeschlossen |
| PR-FEED-ANLASS-05 | done | medium | PR-FEED-ANLASS-04 | Manual Output-Prep Workflow (Output-Prep Surface + Service Integration) | Output-Prep-Baseline als abgeschlossenen Referenzanker halten | Output-Prep-Transitions, Admin-Surface und Service-Integration als manual-first dokumentiert und referenziert | no | Abschluss aus PR-GOV-08/09, Grundlage fuer spaetere Feed-Hardening-Slices |

### Coverage Audit

- Scan scope: `docs/E150/*.md`, `docs/*.md`, `docs/architecture/*.md`, `docs/auth/*.md`, `docs/ops/*.md`
- Coverage matrix: `docs/E150/CoverageMatrix.md`
- Anzahl gescannter IDs: 127
- Anzahl abgedeckter IDs (operativer Katalog oder gemappt): 90
- Anzahl Legacy-only: 37
- Anzahl fehlender Tasks: 0
- Im Audit identifizierter fehlender Task wurde aufgenommen: `GOV-ANLASS-08`

## Next codex_ready tasks

Aktuell freigegebene `codex_ready` Tasks:

1. `GOV-ORG-02` (open): offizieller Release-/Trust-Modus auf Basis `GOV-ORG-01` finalisieren.

## Legacy-Kontext (read-only, fuer Evidenz)

Die folgenden Abschnitte bleiben bewusst erhalten, damit keine bisherige Doku-Evidenz verloren geht.
Sie sind fuer Historie/Begruendung wichtig, aber nicht die operative Queue fuer neue Codex-Runs.

## Leitbild

Kernfluss des Systems:

**Freistart -> Analyse/Qualitaet -> Graph-Matching -> CTA-Moment -> Anlassraum/Dossier/Beteiligung**

Governance-/Umsetzungsfluss (weiterhin verbindlich):

**Signal -> Anlassraum -> Dossier -> Runde -> Mandat -> Umsetzung -> Impact**

Wichtige Produktregeln:

- Feeds sind nur **Signalquellen**, nie direkte Publikationslogik.
- **Signals** sind interne Relevanzindikatoren, keine Waehrung, keine Stimmen, keine Wahrheit.
- **Funding** ist strikt getrennt von Signals.
- **Anlassraum** ist nicht gleich **Dossier**.
- Nichts wird automatisch publiziert.
- Publikation nur ueber Review + Approval.
- Anonyme Hinweise sind erlaubt, aber nie allein publikationsfaehig.
- Geld darf niemals Wahrheit, Faktenstatus oder Abstimmungsergebnis kaufen.
- Soziale Naehe/Matching darf nicht aus fruehen inhaltlichen Treffern allein entstehen.
- Sache zuerst: sozialer Austausch nur nach sichtbarem Sach-Commitment.
- DM-/Gruppen-/Kontakt-Eskalation nur opt-in, gestuft und moderierbar.
- Security/Privacy gilt als Architekturpflicht: PII trennen, KI-Datenfluesse minimieren, Audit Trail halten.

## Merge-Prinzip V1 + V2

Diese Fassung kombiniert:
- **V1** = neues Governance-/Anlassraum-/Signals-/Funding-/Pricing-Leitbild
- **V2** = operativer Alt-Backlog, bestehende Drifts, erledigte Evidenzen, laufende Repo-Tasks

Regel:
- **V1 gewinnt bei Zielmodell und Architektur**
- **V2 bleibt erhalten bei operativen Tasks, Repo-Evidenzen und erledigten Aufgaben**

## Block-Board

| Block | Thema | Status | Naechster Run | Ziel |
| --- | --- | --- | --- | --- |
| A | Orchestrator | Done | - | Stabil halten, nur Fehlerfixes |
| B | Consequences / Responsibility | Done | - | Stabil halten, nur Fehlerfixes |
| C | Graph / Reports | Done (Core) | GOV-ANLASS-02 | Reports konsequent aus Dossiers/Anlassraeumen ableiten |
| D | Eventualities / Decision Trees | Done (Core) | GOV-ANLASS-02 | Weiter mit Dossier-/Runden-Anbindung |
| E (R2) | Research Workflow | Done (Core) | GOV-ANLASS-08 | Community-Research mit Factcheck/Truth-Guardrails verknuepfen |
| F | Streams | Done (Core) | GOV-EVENT-01 | Event-/Session-Modell voll andocken |
| G | Campaigns | Done (Core) | GOV-FUNDING-01 | Funding-/Mission-/Projektlogiken sauber trennen |
| H | I18N / A11y / Social | Done | - | Produktreife halten |
| I | Unterstuetzen / Crowdfunding | Implemented (legacy) | GOV-FUNDING-01 | In Signals/Funding-Modell ueberfuehren |
| M | Membership Apply | Done | GOV-PRICING-01 | Membership mit neuer Paketlogik harmonisieren |
| N | Demo / Screenshot Studio | Done | GOV-MUNI-01 | Kommune-/Pilot-Sales-Demos damit speisen |
| O | Governance / Journalismus / Kommune / Initiative / Organisation | In Progress (Wave 2 core in progress) | GOV-AI-01 | Gemeinsames Zielmodell voll verankern |
| P | Anlassraum / Signals / Funding / Pricing | In Progress (Wave 2 core in progress) | GOV-AI-01 | Manual-first Kernsystem produktiv verankern |

## Drift Backlog (bestehend)

| Drift | Scope | Status | Naechster Run |
| --- | --- | --- | --- |
| PR-0009 | Pilot Backbone (Feeds -> Kandidaten -> Faktencheck -> Graph/Dossier) | Done | - |
| PR-0010 | Admin Akquise Dashboard (Feeds/Regionen) | Done | - |
| PR-0011 | Offene Beitraege (Quelle/Option/Frage, Moderation) | Done | - |
| PR-0012 | Media Ready Projekte (5-10 Themen, min 5 Optionen) | Done | Monitoring/Polish |
| PR-0013 | Live/Chat Skeleton | Done | - |
| PR-0030 | Unterstuetzen/Crowdfunding | Implemented | Monitoring/Polish |
| PR-0034 | DossierSchema Wrapper + Vote Policy (Legitimation 2.0) | Done (Core) | Optional: DS-04 |
| PR-0010B | DecisionArchitecture v2.0 (Part16) – Publishing Pack + Drift-Validator | Done | - |

## Dokumenten-Harmonisierung (2026-03-26)

Status: **In Progress (Part01-16 + OpenTasks synchronisiert, Restdrift offen)**

Erledigt:
- Part-Zuordnung fuer `/docs` explizit dokumentiert (Part14, Abschnitt 12).
- Doppelzaehlungen mit gleicher Part-Nummer fachlich abgegrenzt:
  - Part01 (normativ vs. operative Uebersicht),
  - Part06 (Consequences-Hauptpart vs. Themenkatalog-Appendix),
  - Part16 (Hauptfluss + AI-/Anlassraum-Addenda).
- Event/Demo/Operator-Logik in Part11/Part12 nachgezogen.
- I18N/Social-Runtime-Referenzen in Part13 nachgezogen.
- Post-Finalize-Routing (konditional) und Surface-Abgrenzung in Part05/Part16 nachgezogen.

Offene Punkte:
- DOCS-HARM-01: Part00 analog auf dieselbe Mapping-Logik anheben (PII/Auth/Telemetry-Querverweise konsolidieren).
- DOCS-HARM-02: Alte textuelle Formatdrift in fruehen Parts (uneinheitliche Aufzaehlungen/Codeblock-Altlasten) schrittweise bereinigen, ohne inhaltliche Neuschreibung.
- DOCS-HARM-03: Generated Artefakte (`docs/ROUTES.generated.md`, `docs/ROUTES.generated.json`) im Runbook als read-only kennzeichnen, damit keine manuelle Drift entsteht.
- DOCS-HARM-04: abgeschlossen (`2026-03-27`) — Begriffsglossar fuer `Registry`, `Review`, `Operator`, `Demo`, `Beteiligung` ist in Part01/Part16 als Kurzreferenz harmonisiert.
- DOCS-HARM-05: `docs/ORPHAN_FEATURES_VPM25.md` und `docs/E150_NEEDS_REVIEW.md` als operatives Hygiene-Board mit klarer Part15/OpenTasks-Verlinkung fuehren.
- DOCS-HARM-06: abgeschlossen (`2026-03-27`) — Anlassraum (`/runden`) vs. Dossier vs. Swipes ist sprachlich auf Option-B-Stand harmonisiert.
- ROUTING-HARM-01: Post-Finalize-Clientnavigation konsequent am serverseitigen Zielentscheid ausrichten (`/dossier/<id>` vs. `/swipes?fromDraft=...`), inkl. Legacy-Wrappers.
- UX-HARM-01: `fromDraft` in `/swipes` ueber Banner/Hinweis hinaus sichtbar vertiefen (z. B. Highlight/Filter fuer frisch erzeugte Proposals).
- DOMAIN-HARM-01: entschieden (Option B) — `/runden` bleibt oeffentliche Surface; `/anlassraum` ist Alias-Zielrichtung ohne harte Migration.

Abhaengigkeiten:
- DOCS-HARM-04 ist durch GOV-AI-ORCH-02 entblockt und abgeschlossen (`2026-03-27`).
- Part00-Harmonisierung (DOCS-HARM-01) haengt an GOV-SEC-03 (Zonen-/Audit-Operationalisierung).
- DOMAIN-HARM-01 abgeschlossen; `DOCS-HARM-06` und `DOMAIN-HARM-01B` sind erledigt, verbleibende Option `DOMAIN-HARM-01C` bleibt bewusst `needs_decision`.

## Priorisierte PR-Reihenfolge

### Welle 1 — Governance Foundation
Status: **Done (2026-03-19)**

- **GOV-01** gemeinsames Lifecycle-Modell `Anlass -> Dossier -> Pruefung -> Runde -> Mandat -> Umsetzung -> Monitoring` (**Done**)
- **GOV-02** gemeinsames Rollen-, Raumtyp- und Trust-Level-Modell (**Done**)
- **DOCS-GOV-01** Architekturtexte als verbindliche Single Source of Truth (**Done**)

### Welle 2 — Anlassraum / Event / Feed Review
Status: **In Progress (Core baseline + deepening sync / 2026-03-22)**

- **GOV-ANLASS-01** universelles Anlassraum-Modell (**Core baseline active**)
- **GOV-ANLASS-02** Anlassraum <-> Dossier Beziehung (**Flow/Surface separation deepened: Anlassraum eigenstaendig, Dossier optional/bewusst**)
- **GOV-ANLASS-03** regionale / skalenfaehige Gruppierung (`local`, `regional`, `national`, `eu`, `global`) (**Relevanz-Framing display-/surface-seitig geoeffnet**)
- **GOV-ANLASS-04** Feed-Review statt Feed-Leerlauf (**Decisioning-Pfade geschaerft, Attach-Priorisierung bei bestehender Zuordnung**)
- **GOV-EVENT-01** Event-/Sitzungsmodell (**Event->Anlassraum linking active**)
- **GOV-EVENT-02** QR -> Fragen -> Protokoll -> Dossier -> Runde (**Functionally complete: service+route acceptance + legacy backfill strategy (manual-first)**)

Anlassraum-first Deepening (2026-03-21 bis 2026-03-22):
- PR-A: Signal-to-Anlassraum Decisioning geschaerft
- PR-B: `/create` als kanonischer Intake kontextreicher verdrahtet
- PR-C: Anlassraum vs. Dossier im Flow klarer getrennt
- PR-D: Region / Scope / Relevanz display-/surface-seitig verbreitert
- Policy-Alignment: Feed/Signal/Primärquelle sprachlich und flow-seitig konsistenter ausgerichtet
- PR-F: regressionsrelevante Operator-State-/Variant-Probleme auf Admin-/Feed-/Create-Surfaces nachgeschaerft

### Welle 2.5 — Freistart / KI-Qualitaet / Match-CTA (neu priorisiert)
Status: **Open (Architecture alignment required / 2026-03-20)**

- **GOV-AI-01** Freistart + verpflichtende Qualitaetsschicht
- **GOV-AI-02** Graph-Matching + CTA-Layer
- **GOV-AI-03** Anlassraum als Arbeitsort
- **GOV-AI-04** Canonical Multi-Orchestration Flow
- **GOV-AI-05** Prompt Contracts + Typed Outputs
- **GOV-AI-06** Language-Aware Core + Cross-Lingual Matching
- **GOV-AI-07** Meta-Layer / Audit / Provenance / Layman Explanation

### Welle 2.6 — AI-Orchestration Governance + Social Safety/Security (top priority)
Status: **In Progress (canonical docs hardening / 2026-03-23)**

- **GOV-AI-ORCH-01** Kanonisches Zielbild der 5 Orchestrierungen verankern
- **GOV-AI-ORCH-02** Bestehende KI-/Route-Anbindungen inventarisieren und gegen Zielbild mappen
- **GOV-AI-ORCH-03** Provider-/Modellstrategie je Orchester festlegen
- **GOV-SAFETY-01** Social-/Kontaktlogik auf Commitment-first statt Proximity-first umstellen
- **GOV-SAFETY-02** Schutzregeln fuer Frauen / vulnerable / andersdenkende Nutzer verbindlich festlegen
- **GOV-SAFETY-03** Fruehes Matching/DM/Gruppensog nur nach expliziten Schutz- und Freigaberegeln
- **GOV-SEC-01** Security-Hardening / Secret-Hygiene / lokale Prod-URI-Risiken dokumentieren und absichern
- **GOV-SEC-02** Route-/Auth-/AI-Anbindungs-Audit als Pflicht vor naechstem groesseren Slice
- **GOV-SEC-03** PII-/Content-/AI-Zonenmodell + High-impact Audit-/Trace-/Review-Pflicht operationalisieren

### Welle 3 — Kommune / Verwaltung
- **GOV-MUNI-01** Buergermeister-Dashboard
- **GOV-MUNI-02** Dezernatslogik
- **GOV-MUNI-03** Raum-/Prozessstatus fuer Verwaltung
- **GOV-MUNI-05** Verwaltungsmodus
- **GOV-MUNI-06** Beamten-/Verwaltungsrollen

### Welle 4 — Pricing / Billing / Funding / Signals
- **GOV-PRICING-01** Hybrid-Pricing und Packaging finalisieren
- **GOV-PRICING-02** Admin Pricing Control + Rabatt-Engine
- **GOV-FUNDING-01** Signals + Funding + Funding Intent + Readiness Score
- **GOV-FUNDING-02** Mission / Projekt / Ressourcen / Hybrid Funding
- **GOV-FUNDING-03** Matching Funds, Impact Tracking, Refunding
- **GOV-SIGNAL-01** Signal-Aggregation, Trigger, Decay, Radar-Logik

### Welle 5 — Journalismus
- **GOV-JOURNALISM-01** `source_anchor` als Anlassgeber
- **GOV-JOURNALISM-02** Truth Guardrails + Factcheck Interventions
- **GOV-JOURNALISM-03** Newsroom Embed/QR Companion
- **GOV-JOURNALISM-04** Journalist-/Redaktionsprofile

### Welle 6 — Organisationen / Verbaende / Civic
- **GOV-ORG-01** dossierbasierte Organisationsidentitaet
- **GOV-ORG-02** offizieller Release-/Trust-Modus
- **GOV-CIVIC-01** Rollen-/Sichtbarkeits-/Repraesentanzbaseline + Wirkungsverlauf
- **GOV-CIVIC-02** Initiative-Lifecycle
- **GOV-CIVIC-03** Impact-/Unterstuetzungslogik fuer Initiativen

## Aktive Aufgaben (operativer Backlog bleibt erhalten)

| Task | Status | Naechster Run | Evidenz/Notiz |
| --- | --- | --- | --- |
| GOV-AI-ORCH-01 Kanonisches Zielbild der 5 Orchestrierungen verankern | Done (canonical model documented / 2026-03-23) | GOV-AI-ORCH-02 | Kanonische Zielarchitektur inkl. Produktregeln, Safety/Security-Guardrails und Providerstrategie in `docs/E150/Part16_AI_Orchestration_and_Safety.md`; Verweise in `OpenTasks.md` + `Part15.md` aktualisiert. |
| GOV-AI-ORCH-02 KI-/Route-Anbindungen inventarisieren und gegen Zielbild mappen | Done (inventory baseline refreshed / 2026-03-27) | GOV-AI-ORCH-03 | Pflichtinventar fuer aktive KI-/Route-Pfade inkl. staged-vs-direct und Gap-Mapping liegt vor (`docs/E150/GOV-AI-ORCH-02_ROUTE_INVENTORY_2026-03-27.md`); kein neuer Runtime-Kanon gesetzt. |
| GOV-AI-ORCH-03 Provider-/Modellstrategie je Orchester festlegen | Done (provider baseline refreshed / 2026-03-27) | GOV-SEC-03 | Betriebsbaseline je Orchester mit Primaer/Fallback, Failure-Modes und offenen DPA/Residency/Kostenfragen liegt vor (`docs/E150/GOV-AI-ORCH-03_PROVIDER_STRATEGY_BASELINE_2026-03-27.md`). |
| GOV-SAFETY-01 Commitment-first statt Proximity-first verbindlich verankern | Done (policy canonized / 2026-03-23) | GOV-SAFETY-03 | Produktregel dokumentiert: kein direktes Personen-Matching nur auf Basis von Region + fruehen inhaltlichen Treffern; zuerst Sach-Commitment. |
| GOV-SAFETY-02 Schutzregeln fuer Frauen / vulnerable / andersdenkende Nutzer dokumentieren | Done (policy canonized / 2026-03-23) | GOV-SAFETY-03 | Schutz vor Belaestigung, Anmachspruechen, zweideutigen Narrativen, sozialem Druck und Vereinnahmung als verbindliche Governance-Regel dokumentiert. |
| GOV-SAFETY-03 Social-Eskalation (DM, Gruppen, Kontakt) nur gestuft/opt-in/moderierbar | Done (decision canonized / 2026-03-26) | GOV-SAFETY-03A | Entscheidung gesetzt: kein DM-/Gruppen-Default; Start nur moderiert/kuratiert und nur mit Opt-in, Verifikation/Trust, Cooldown/Rate-Limits, Abuse-/Moderations-Gates und Auditierbarkeit. Umsetzung folgt ueber GOV-SAFETY-03A/03B. |
| GOV-SEC-01 Secret-Hygiene / lokale Prod-URI-Risiken dokumentieren und absichern | In Progress (doc baseline active / 2026-03-23) | GOV-SEC-02 | Klare Vorgabe: Prod-Secrets/Prod-URIs nicht als lokaler Alltagsstandard; Rotation/Hygiene/Risikoaufklaerung verpflichtend. |
| GOV-SEC-02 Route-/Auth-/AI-Anbindungs-Audit als Pflicht vor naechstem groesseren Slice | Open (audit run pending) | GOV-SEC-03 | Vor naechstem grossen Architektur-/Feature-Slice ist ein strukturierter Auditlauf fuer Auth-/Route-/AI-Anbindung verpflichtend (inkl. Guardrails, Failure-Modes, Logs, Abuse-Surface). |
| GOV-SEC-03 PII-/Content-/AI-Zonenmodell + High-impact Audit/Trace/Review operationalisieren | Open (implementation pending) | GOV-AI-ORCH-02 | Architekturpflicht: Datenzonen und minimierte externe KI-Payloads; High-impact Klassen (Moderation, Trust/Score, Dossier-Verdichtung, Publish-nahe Vorstufen, Personen-Matching) nur mit nachvollziehbarem Audit-/Review-Pfad. |
| PR-AI-CREATE-01 `/create` auf kanonischen Orchestrierungsfluss harmonisieren | In Progress (intake deepened / 2026-03-22) | GOV-AI-02 | `/create` ist als kanonischer Intake deutlich staerker verdrahtet: Fast-Path-Hrefs tragen kontextreiche Felder (`signalTitle`, `sourceUrl`, `sourceLabel`, `region`, `scope`, `clusterHint`, `reviewState`, `candidateId`, `reason`, `prefill`) ohne erzwungene Legacy-Defaults (`intent=claim&mode=manual`). Create-UI zeigt uebernommenen Handoff-Kontext sichtbar; relevante Einstiege aus Feed-Drafts, Anlassraum Operations, CTA-Handoff und Match-Service sind vereinheitlicht. Evidenz: `apps/web/src/features/create/intents.ts`, `apps/web/src/app/create/page.tsx`, `apps/web/src/app/create/CreateClient.tsx`, `apps/web/src/features/anlassraumOperationsRead.ts`, `apps/web/src/features/anlassraumOperationsUi.tsx`, `apps/web/src/features/create/ctaHandoff.ts`, `apps/web/src/features/create/matchService.ts`; Tests: `apps/web/tests/create-mode.intents.test.ts`, `apps/web/tests/create-mode.page.test.ts`, `apps/web/tests/create-cta-handoff.test.ts`, `apps/web/tests/create-match.service.test.ts` |
| DOCS-HARM-06 Anlassraum (`/runden`) vs. Dossier vs. Swipes final harmonisieren | Done (`2026-03-27`) | DOMAIN-HARM-01 | Option-B-Wording in den relevanten Parts ist harmonisiert: `/runden` bleibt aktive Public-Surface, `Anlassraum` bleibt Domänenbegriff, `/anlassraum` bleibt Alias-/Zielbegriff ohne harte Migration. |
| ROUTING-HARM-01 Post-Finalize-Clientnavigation an serverseitige Zielentscheidungen angleichen | In Progress (auto-redirect + fallback sync active / 2026-03-26) | UX-HARM-01 | AnalyzeWorkspace nutzt Auto-Redirect (replace) mit Prioritaet fuer server `redirectTo`; Create-Fallback auf `/swipes` angeglichen; Legacy-/Alt-Surfaces weiter monitoren. |
| UX-HARM-01 `fromDraft` in `/swipes` sichtbar auswerten | In Progress (arrival focus active / 2026-03-26) | Swipes UX-Dedupe | `/swipes` startet bei `fromDraft` im Arrival-Modus mit Fokus auf Proposals aus dem Entwurf; wenn noch keine Treffer vorliegen, bleibt ein klarer Fallback-Hinweis ohne Fake-Zuordnung. Offener Folgeschritt: feinere Highlight-/Filter-Vertiefung fuer groessere Decks. |
| UX-COPY-HARM-01 Frontend-Umlaute in Legacy-Copy vereinheitlichen (`ä/ö/ü/ß` statt `ae/oe/ue`) | Open | UX-HARM-01 | Verbindliche Schreibregel in `AGENTS.md` aktiv; verbleibende Legacy-Texte in User-Facing Surfaces schrittweise migrieren, ohne technische Identifier anzupassen. |
| DOMAIN-HARM-01 Oeffentliche Benennung `/runden` vs. dedizierte Anlassraum-Route entscheiden | Done (Option B decided / 2026-03-27) | GOV-AI-ORCH-02 | Entscheidung manifestiert: `/runden` bleibt kanonische oeffentliche Surface; `/anlassraum` ist offizieller Alias-/Zielbegriff und als non-breaking Wrapper aktiv, ohne harte Migration/Umbenennung. |
| PR-AI-MATCH-11 Single Opaque History Cursor + lazy queue cleanup | Done (contract/UX polish active / 2026-03-21) | Monitoring/Polish | Produktiver History-Read-Contract fuer Prepare-Attach ist auf einen einzelnen opaquen Cursor reduziert: `GET /api/admin/create/attach-drafts/[draftId]/history` liefert `nextCursor` (kein `nextScanCursor` mehr). Interner Cursor bleibt robust (Scan+Accepted-Position im Payload, draft-/type-gebunden, `invalid_history_cursor` bei Mismatch). Queue-UI nutzt pro Draft nur noch einen Cursor-State fuer lazy "Mehr Verlauf laden". Legacy-Read-Normalisierung bleibt unveraendert aktiv (`normalizedFromLegacy`, `legacyNormalizationReason`); keine neue Auto-Mutation. |
| PR-AI-MATCH-10 History Backfill Utility + Contract Docs | Done (maintenance slice active / 2026-03-21) | Monitoring/Polish | Legacy-History-Maintenance als expliziter Pfad: Utility `apps/web/src/features/create/attachDraftHistoryBackfill.ts`, Script `apps/web/scripts/create.history-backfill.ts`; Default dry-run, Apply nur explizit (`--apply`/`--mode=apply`), idempotent ohne Event-Duplikate. Sichere Legacy-Faelle sind `normalizable`; ambige/unsichere Faelle werden nur reportet (`unsafe_to_backfill`) und nicht umgeschrieben. Produktiver Read-Contract bleibt Single-Cursor (`nextCursor`), Legacy-Read-Normalisierung bleibt aktiv; keine neue Auto-Mutation. |
| Create IA v2: dedizierte Mode-Module (`manual/source/ai`) statt nur Workspace-Parametrisierung | Superseded (legacy intermediate state, no longer target architecture) | GOV-AI-01 | `manual/source/ai` bleibt nur als Legacy-Kompatibilitaets-/Migrationsschicht aktiv (inkl. Alias-Normalisierung + Persistenz), ist aber nicht mehr der kanonische Produktpfad; kanonisch: Freistart + verpflichtende Qualitaetsschicht + Graph-Matching + CTA-Layer |
| Runden Entry Surface auf produktive Quelle umstellen (statt Seed aus `features/topicRound/data.ts`) | Done (productive source + compatibility matrix active / 2026-03-19) | PR-0039 | `/runden` liest aus produktivem `output_seed`/`anlassraum`-Read-Model (`features/topicRound/entrySource.ts`, `GET /api/runden/entry`); `/demo/runden` ist expliziter Compat-Redirect auf `/runden` (kein Seed-Fallback), inkl. Tests `apps/web/tests/runden-entry.*`, `apps/web/tests/runden-compat.*`, `apps/web/tests/runden-page.acceptance.test.ts` |
| Backward-Compatibility finalisieren | Done (legacy/demo round entry clarified / 2026-03-19) | PR-0039 | Canonical Round-Entry = `/runden`; alte Demo-Pfade zeigen explizit auf produktiven Einstieg (`apps/web/src/app/demo/runden/page.tsx`, `apps/web/src/app/demo/page.tsx`, `apps/web/src/app/demo/DemoNavClient.tsx`) |
| E2E-Abnahme fuer `/create` + `/runden` | Done (acceptance baseline verified / 2026-03-19) | PR-0039 | Scenarios A-F abgedeckt: Compat-Redirect, `/runden` Empty/Error, `/create` Mode-Reflexion + Save/Finalize-Mode-Propagation, stabile `invalid_create_mode`-Fehler, kein Seed-Fallback/kein Publish-Bypass (`apps/web/tests/runden-page.acceptance.test.ts`, `apps/web/tests/create-mode.page.test.ts`, `apps/web/tests/create-mode.save.route.test.ts`, `apps/web/tests/create-mode.finalize.route.test.ts`) |
| Community Group Surfaces entkoppeln | In Progress (resolver/API + deep-link contract boundary active) | PR-0041 | `/community` nutzt dedizierten Read-Resolver + Read-Route + kanonischen Deep-Link-Contract: `features/community/groupSurface.ts`, `features/community/deepLinkContract.ts`, `GET /api/community/groups`, `apps/web/src/app/community/page.tsx`, Tests `community-groups.*`, `community-page.states.test.ts`, `community-deep-links.contract.test.ts` |
| Community Deep-Link Contracts vereinheitlichen | In Progress (canonical contract active) | PR-0041 | Shared Canonical Params + Alias-Normalisierung + Canonical Href-Builder aktiv in Page/Route/Resolver + Link-Producern (`AccountClient`/Discovery); stabile Invalid-Param-Mappings ohne Fallback |
| Community E2E absichern | Done (acceptance coverage mobile+desktop active / 2026-03-19) | PR-FEED-ANLASS-02 | Community Read-Surfaces A-F abgedeckt inkl. Canonical/Legacy/Invalid/Unavailable/Read-only-Guardrails: `apps/web/tests/community-*.test.ts` |
| Feed/Anlassraum Picker im `/create` anbinden | Done (manual productive context picker active / 2026-03-19) | PR-FEED-ANLASS-02 | Read-only Kontextauswahl in `/create` aktiv (`GET /api/create/context`, `features/create/contextPicker.ts`, `app/create/CreateClient.tsx`), explizite `anlassraumId`-Propagation in Analyze/Save/Finalize ohne Auto-Linking/Publish/Approval; Tests `apps/web/tests/create-context-picker.*`, `apps/web/tests/create-mode.*` |
| Feed/Anlassraum Cluster-Job | Done (baseline worker active / 2026-03-19) | PR-FEED-ANLASS-03 | Dedizierter Cluster-Worker aktiv (`features/feeds/clusterJob.ts`) inkl. Runner `POST /api/admin/feeds/cluster/run`, persistente Candidate-Outputs (`feed_anlassraum_cluster_candidates`) und Idempotenz (`created/updated/unchanged`) ohne Publish-/Approval-Seiteneffekt; Tests `apps/web/tests/feed-cluster-job.*` |
| Feed/Anlassraum Status-Transitions absichern | In Progress (Wave 2 deepening / decisioning clarified) | PR-FEED-ANLASS-04 | Zentrale Decisioning-Utility eingefuehrt; bestehende Draft-Verlinkung priorisiert Attach statt Candidate-Create; Queue/Detail zeigen Decision Path nachvollziehbar; manual fast path via `/create` ist operativ sichtbarer. Evidenz: `features/feeds/signalDecisioning.ts`, `features/feeds/reviewQueue.ts`, `apps/web/src/app/admin/feeds/drafts/page.tsx`, `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`; Tests: `apps/web/tests/feed-signal-decisioning.test.ts`, `apps/web/tests/feed-backfill.service.test.ts` |
| Feed/Anlassraum Publish-Flows ausbauen | Done (manual output-prep baseline closed / 2026-03-19) | PR-FEED-ANLASS-06 | Output-Prep operabel inkl. Admin-Surface: `features/anlassraum/outputPrep.ts`, `GET /api/admin/feeds/anlassraum/[id]/outputs`, `POST /api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition`, `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx` |
| Feed/Anlassraum Backfill | In Progress (legacy remediation UX + audit active) | PR-FEED-ANLASS-06 | Detection + per-draft Remediation inkl. Audit-Sichtbarkeit: `GET /api/admin/feeds/drafts/legacy`, `POST /api/admin/feeds/drafts/[id]/backfill`, `apps/web/src/app/admin/feeds/drafts/page.tsx` |
| Swipes Kontextpfade haerten | Open | PR-0042 | thematisch passendes Ziel |
| Swipes Mobile Gestures + Bottom-Actions | Open | PR-0043 | thumb-reachable |
| Swipes Varianten-Schritt finalisieren | Open | PR-0044 | Ranking/Weighting/Exclude |
| Swipes UX-Dedupe | Open | PR-0045 | redundante Vertiefungen reduzieren |
| UI-Konsistenz Light/Dark | In Progress (operator states stabilized, global pass pending) | PR-0046 | Regressionsrelevante Operator-State-/Variant-Probleme nachgeschaerft in `apps/web/src/app/globals.css`, `apps/web/src/app/admin/layout.tsx`, `apps/web/src/app/admin/AdminSidebar.tsx`, `apps/web/src/app/admin/AdminSearchButton.tsx`, `apps/web/src/app/admin/feeds/page.tsx`, `apps/web/src/app/admin/feeds/drafts/page.tsx`, `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`; globaler kompletter Light/Dark-Pass bleibt offen |
| Account Dark-Mode Nacharbeit | Open | PR-0047 | Components/Token-Check |
| Env-Key-Hardening abschliessen | Open | PR-ENV-01 | Runtime-Aliasse |
| Mongo SRV `ECONNREFUSED` robust abfedern | Open | PR-ENV-02 | DNS/Netz/Config-Fallback |

### Create Prepare-Attach History Contract (Single Opaque Cursor / 2026-03-21)

Produktiver Read-Contract:
- Endpoint: `GET /api/admin/create/attach-drafts/[draftId]/history`
- Query:
  - `type=all|review|apply` (default: `all`)
  - `limit`
  - `cursor` (opaque)
- Response:
  - `events`, `reviewEvents`, `applyEvents`, `latestEvent`
  - `hasMore`, `nextCursor`
  - `type`, `limit`, `draft`

Cursor-/Contract-Polish:
- Extern wird nur noch ein Cursor ausgegeben (`nextCursor`).
- `nextScanCursor` ist nicht mehr Teil des oeffentlichen API-Contracts.
- Intern darf der Cursor weiterhin robuste Scan-Semantik tragen (accepted/scan/tie-break), bleibt fuer Clients aber opaque.
- Cursor sind draft- und filter-gebunden (`type`); fremde/ungueltige Cursor liefern `invalid_history_cursor` (400).

Read-/Legacy-Verhalten:
- deterministische Sortierung bleibt erhalten (`createdAt` desc, `_id` als tie-break)
- Legacy-Rows werden weiterhin read-time defensiv normalisiert:
  - `normalizedFromLegacy`
  - `legacyNormalizationReason`

Maintenance-/Backfill-Pfad:
- Utility: `apps/web/src/features/create/attachDraftHistoryBackfill.ts`
- Script: `apps/web/scripts/create.history-backfill.ts`
- Default: `dry_run`
- Apply nur explizit: `--apply` oder `--mode=apply`
- Klassifikation: `canonical_already_ok`, `normalizable`, `unsafe_to_backfill`
- Sichere Legacy-Faelle werden deterministisch normalisiert; ambige/unsichere Rows werden nur reportet.
- Apply bleibt idempotent als in-place Update bestehender Rows (keine Event-Duplikate).

Guardrails unveraendert:
- kein Auto-Apply
- kein Auto-Merge
- kein Auto-Publish
- keine neue Produkt-Mutation
- Review/Apply bleiben getrennt
- Stage-2/Stage-3 bleiben unberuehrt

## Neue Architektur-Tasks (V1 dauerhaft verankert)

### GOV-01 — Governance Core
- gemeinsames Betriebsmodell fuer Journalismus, Kommune, Organisationen, Events, Civic und Initiative
- kein Feature-Silo

Status: **Done (Wave 1 / 2026-03-19)**

Evidenz:
- `features/entities/types.ts`
- `features/entities/stateMachine.ts`
- `features/entities/service.ts`
- `features/anlassraum/stateMachine.ts`
- `features/anlassraum/governance.ts`

Definition of Done:
- zentrale Zustandsmaschine dokumentiert
- gemeinsame Objektlogik fuer `Entity`, `Anlassraum`, `Dossier`, `Runde`, `Mandat`
- Part01 / Part14 / OpenTasks synchron

### GOV-02 — Trust / Roles / Raumtypen
Muss enthalten:
- Personen-Trust: `anonymous`, `registered`, `verified`, `institutional`, `editorial`
- Inhalts-Trust: `unverified`, `source_based`, `disputed`, `checked`
- Raumtypen: `public`, `community`, `official`, `editorial`, `internal`, `hybrid`

Status: **Done (Wave 1 / 2026-03-19)**

Evidenz:
- `features/trust/types.ts`
- `features/trust/gates.ts`
- `features/anlassraum/governance.ts`
- `apps/web/src/lib/server/auth/governance.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/transition/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/route.ts`
- `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/status/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/publish/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/review/route.ts`
- `apps/web/src/app/api/feeds/drafts/[id]/publish/route.ts`

Route-Level Permission Update (Wave 2/3 Regel, umgesetzt am 2026-03-19):
- Governance-Routen sind nicht mehr strikt admin-only.
- Freigeschaltete Governance-Akteure: `reviewer`, `editorial_actor`, `institutional_actor`, `admin`.
- Rechte bleiben scoped auf relevanten `Entity`-/`Anlassraum`-Kontext.
- Community-Rollen erhalten weiterhin keine Review/Approval/Publish-Rechte.
- Publish-Gates, Manual-first und Review-first bleiben unveraendert verpflichtend.
- Publish-Gate ist gehaertet (Quellenrollen, Publisher-Diversitaet, strukturierte Claims/Fragen, Weak-Signal-Korroboration).
- Feed-Typen sind auf einen kanonischen Pfad gehaertet: `features/feeds/types.ts` ist Source of Truth; aktive Importe laufen ueber `@features/feeds/types`.
- Neue Governance-Contract-Routen (GOV-EVENT-02 Apply Layer) bleiben scoped + role-checked:
  `reviewer`, `editorial_actor`, `institutional_actor`, `admin`.

### DOCS-GOV-01 — Dokumentation synchron
Status: **Done (Wave 1 / 2026-03-19)**

Evidenz:
- `docs/E150/OpenTasks.md`
- `docs/E150/Part15.md`

### GOV-ANLASS-01 — Anlassraum Architektur
Pflichtfelder:
- `type`
- `topicKey`
- `scope`
- `decisionScope`
- `regionKey`
- `status`
- `maturity`
- `ownerType`
- `ownerId`
- `parentAnlassraumId`

Anlassraum-Typen:
- `policy`
- `event`
- `conflict`
- `investigation`
- `proposal`
- `crisis`
- `community_project`
- `funding_case`
- `monitoring`

Status: **In Progress (Core baseline / 2026-03-19)**

Evidenz:
- `features/anlassraum/types.ts`
- `features/anlassraum/service.ts`
- `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- `apps/web/src/app/api/events/route.ts`

### GOV-ANLASS-02 — Anlassraum <-> Dossier
Regeln:
- mehrere Anlassraeume duerfen in ein Dossier muenden
- ein Anlassraum kann ohne Dossier bestehen
- Dossier-Typen: `exploration_dossier`, `decision_dossier`
- Anlassraum bleibt eigenstaendiger Arbeitsraum
- Dossier ist bewusste, optionale Verdichtung
- fehlendes Dossier ist kein impliziter Defekt

Status: **In Progress (Flow separation deepened / 2026-03-22)**

Evidenz:
- `features/anlassraum/types.ts` (`dossierType`)
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/dossier/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/route.ts`
- `apps/web/src/features/anlassraumOperationsRead.ts`
- `apps/web/src/features/anlassraumOperationsUi.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/page.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`
- `apps/web/src/features/create/ctaHandoff.ts`
- `apps/web/src/features/create/matchService.ts`

### GOV-ANLASS-03 — Regionen / Skalen
Scopes:
- `local`
- `regional`
- `national`
- `eu`
- `global`

Regel:
- Thema kann global sein, Entscheidung lokal oder national (`decisionScope`)
- Scope-/Relevanz-Framing ist nicht nur modellseitig, sondern auch in Display-/Surface-Logik geoeffnet.
- Relevanz ist sichtbar fuer lokal/regional ebenso wie bundesweit/gesellschaftlich/institutionell sowie Community-/Hinweis-Eingaenge.

Status: **In Progress (Framing broadened / 2026-03-22)**

Evidenz:
- `features/anlassraum/types.ts` (`ANLASSRAUM_SCOPES`)
- `features/anlassraum/service.ts` (region/scope derivation)
- `apps/web/src/app/api/events/route.ts` (scope/decisionScope bei Event->Anlassraum)
- `apps/web/src/features/relevanceFraming.ts`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/api/admin/feeds/anlassraum/route.ts`
- `apps/web/tests/relevance-framing.test.ts`

### GOV-ANLASS-04 — Feed Review statt Feed Leerlauf
Queue-/Admin-Aktionen:
- `ignore`
- `attach_to_anlassraum`
- `create_anlassraum_candidate`
- `mark_as_weak_signal`
- operative Decisioning-Pfade sichtbar: `ignore`, `attach_to_existing_anlassraum`, `create_anlassraum_candidate`, `manual_fast_path_via_create`
- Attach wird bei bestehender Anlassraum-Zuordnung priorisiert
- Queue-/Detail-Surfaces zeigen Decision Path nachvollziehbar

Status: **In Progress (Decisioning deepening active / 2026-03-22)**

Evidenz:
- `features/feeds/signalDecisioning.ts`
- `features/feeds/reviewQueue.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/review/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/reviewErrors.ts`
- `apps/web/src/app/api/admin/feeds/drafts/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/bulk/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/backfill/route.ts`
- `apps/web/src/app/api/admin/feeds/drafts/[id]/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/outputPrepErrors.ts`
- `apps/web/src/app/admin/feeds/drafts/page.tsx`
- `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`
- `apps/web/tests/feed-signal-decisioning.test.ts`
- `apps/web/tests/feed-review.routes.test.ts`
- `apps/web/tests/feed-backfill.service.test.ts`
- `apps/web/tests/anlassraum-output-prep.routes.test.ts`
- `apps/web/tests/anlassraum-output-prep.service.test.ts`
- `features/anlassraum/outputPrep.ts`
- `features/anlassraum/types.ts`

Queue Deepening (2026-03-19):
- Queue-Filter erweitert: `status`, `reviewState`, `region`, `hasAnlassraum`, `weakSignal`, `q` (Titel/Summary/Quelle).
- Queue-Sortierung erweitert: `newest`, `oldest`, `review_recent`, `review_stale`, `priority_high`.
- Triage-Metadaten je Draft: `lastReviewAction*`, `queueMeta` (`priorityScore`, `priorityBucket`, `pendingHours`, `needsAnlassraumBackfill`, `reasons`).
- Bulk-Review (manual-first, nicht publizierend): `POST /api/admin/feeds/drafts/bulk` fuer `ignore`, `mark_as_weak_signal`, `attach_to_anlassraum`, `create_anlassraum_candidate`.
- Legacy-Backfill-Pfad (admin-safe): `GET /api/admin/feeds/drafts/legacy` + `POST /api/admin/feeds/drafts/[id]/backfill`.

Legacy Backfill UX + Audit (PR-FEED-ANLASS-06 / 2026-03-19):
- Minimales Admin-Remediation-Surface in `apps/web/src/app/admin/feeds/drafts/page.tsx` listet unlinked Legacy-Drafts und bietet per Draft:
  `attach` (explizite Anlassraum-ID) oder `create_candidate`.
- Audit-Sichtbarkeit im Legacy-Panel:
  `lastReviewAction`, `lastReviewActionBy`, `lastReviewActionAt`, `reviewNote`, Weak-Signal-Status, Triage-Reasons.
- Backfill-Response liefert expliziten Remediation-Typ:
  `attached_existing_anlassraum` oder `created_candidate_anlassraum`.
- Kein Silent-Migration-Pfad: keine Bulk-Auto-Migration, keine Hintergrund-Migration, keine Publish-/Approval-Seiteneffekte.

Output-Prep Deepening (PR-FEED-ANLASS-05 / 2026-03-19):
- Output-Seed-Workflow ist API-first operationalisiert fuer `round_seed`, `dossier_seed`, `embed_seed`, `social_seed`, `regional_briefing_seed`, `editorial_pitch_seed`.
- Output-Prep-Status-Transitions sind explizit/manuell: `draft`, `queued`, `review`, `ready`, `published`, `discarded`.
- Transition-Aktionen (manual-first): `queue`, `send_to_review`, `approve_prep`, `reject_prep`, `mark_ready`, `publish`, `discard`, `reset_draft`.
- `mark_ready`/`publish` bleiben publish-gated (`getAnlassraumPublishGate`) und setzen `reviewState=approved` voraus.
- Kein Direktpfad aus Feed-Ingest in oeffentliche Publikation; `publish` ist nur Output-Prep-Status (kein Auto-Live-Release).

Output-Prep Closure (PR-FEED-ANLASS-05 Abschluss / 2026-03-19):
- Minimales Admin-Manual-Surface aktiv in `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`:
  Output-Seeds listen, Status/Review/PublishTarget/LastAction sehen, manuelle Transition pro Seed ausfuehren.
- Service-Level-Integrationstests gegen reale `outputPrep`-Domainlogik aktiv:
  `apps/web/tests/anlassraum-output-prep.service.test.ts`.
- PR-FEED-ANLASS-05 Baseline gilt als funktional geschlossen; weitergehende Public-Release-Automation bleibt bewusst nicht automatisiert.

Community Group Surface Decoupling (PR-0039 / 2026-03-19):
- `/community` ist von Inline-Resolvern entkoppelt; produktiver Read-Shape laeuft zentral ueber `apps/web/src/features/community/groupSurface.ts`.
- Neue explizite Read-Route: `GET /api/community/groups` (stabile Read-Response + 400 bei invaliden Parametern + 503 bei Source-Unavailable).
- Kein Demo-/Seed-Fallback fuer Dossier-Linking im Group-Surface (`/dossier/demo` entfernt); fehlende Verknuepfungen bleiben explizit als Empty-State sichtbar.
- Read-only Guardrail bleibt strikt: keine Publish-/Approval-/Mutation-Pfade in Resolver oder Route.

Community Deep-Link Contracts (PR-0040 / 2026-03-19):
- Kanonischer Community-Deep-Link-Contract ist zentralisiert in `apps/web/src/features/community/deepLinkContract.ts`.
- Kanonische Parameter: `group`, `type`, `scope`, `topicKey`, `topicLabel`, `dossierId`, `dossierTitle`, `regionLabel`, `reasonLabel`, `communityLabel`.
- Legacy-Aliasse bleiben lesbar und werden explizit normalisiert:
  `topic -> topicKey`, `dossier -> dossierId`, `region -> regionLabel`, `reason -> reasonLabel`, `communityKey -> group`.
- Gleiche Contract-Validierung/-Normalisierung in Resolver/Route/Page:
  `apps/web/src/features/community/groupSurface.ts`,
  `apps/web/src/app/api/community/groups/route.ts`,
  `apps/web/src/app/community/page.tsx`.
- Outgoing Links sind kanonisiert (kein Alias-Mix mehr) in:
  `apps/web/src/features/community/groupSurface.ts` (Discovery-Hrefs),
  `apps/web/src/app/account/AccountClient.tsx` (Inbox-/Match-Deep-Links).
- Stabile Invalid-Mappings aktiv: `invalid_group_type`, `invalid_group_scope`, `invalid_group_context`;
  API liefert `400`, Page zeigt expliziten Invalid-State; kein Demo-/Static-Fallback.
- Read-only Guardrail unveraendert: keine Mutation, kein Publish-/Approval-Bypass.

Community E2E Acceptance (PR-0041 / 2026-03-19):
- Community Read-Stack ist als Acceptance-Baseline abgesichert fuer:
  Canonical Group-Links, Discovery (groups/empty), Source-Unavailable, Invalid Params, Legacy-Alias-Lesbarkeit und Read-only Boundary.
- Mobile/Desktop-Relevanz im Page-Layer ist explizit getestet (responsive Grid-States fuer Discovery/Group):
  `md:grid-cols-2`, `lg:grid-cols-[1.25fr_1fr]`, `sm:grid-cols-2`.
- Kein Fallback-/Bypass-Rueckfall:
  kein Demo-/Static-Dataset, keine Mutation/Write-Pfade, kein Publish-/Approval-Bypass.
- Evidenz:
  `apps/web/tests/community-deep-links.contract.test.ts`,
  `apps/web/tests/community-groups.resolver.test.ts`,
  `apps/web/tests/community-groups.route.test.ts`,
  `apps/web/tests/community-page.states.test.ts`,
  `apps/web/tests/community-groups.no-demo-fallback.test.ts`,
  `apps/web/tests/community-readonly-boundary.test.ts`.

Feed/Anlassraum Picker in `/create` (PR-FEED-ANLASS-02 / 2026-03-19):
- Manueller produktiver Kontext-Picker ist in `/create` verdrahtet (kein Demo-/Static-Fallback):
  `apps/web/src/features/create/contextPicker.ts` + `GET /api/create/context`.
- Picker-UI in `apps/web/src/app/create/CreateClient.tsx` zeigt produktive Kontextliste (source/ai), explizite Auswahl/Entfernung und stabile Empty-/Unavailable-/Stale-Selection-Hinweise.
- Auswahl bleibt read-only: reines Client-State-Update, keine Save/Finalize-Trigger, keine Mutation nur durch Selektion.
- Kontext-Propagation ist explizit:
  `selectedAnlassraumId` -> `AnalyzeWorkspace` -> Analyze/Save/Finalize-Payload (`anlassraumId`).
- Save/Finalize/Analyze validieren `anlassraumId` stabil (`invalid_anlassraum_id`), ohne Auto-Linking, Auto-Publish oder Auto-Approval.
- Evidenz:
  `apps/web/src/app/api/create/context/route.ts`,
  `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`,
  `apps/web/src/app/api/contributions/save/route.ts`,
  `apps/web/src/app/api/contributions/finalize/route.ts`,
  `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts`,
  `apps/web/tests/create-context-picker.service.test.ts`,
  `apps/web/tests/create-context-picker.route.test.ts`,
  `apps/web/tests/create-mode.page.test.ts`,
  `apps/web/tests/create-mode.save.route.test.ts`,
  `apps/web/tests/create-mode.finalize.route.test.ts`,
  `apps/web/tests/create-mode.analyze-parse.test.ts`.

Feed/Anlassraum Cluster-Job (PR-FEED-ANLASS-03 / 2026-03-19):
- Dedizierter produktiver Cluster-Worker ist als schmaler Domain-Service aktiv:
  `features/feeds/clusterJob.ts`.
- Cluster-Outputs sind explizit/persistent in einer dedizierten Collection:
  `feed_anlassraum_cluster_candidates` via `features/feeds/db.ts`.
- Runner ist API-first und manuell ausfuehrbar:
  `POST /api/admin/feeds/cluster/run`
  (`apps/web/src/app/api/admin/feeds/cluster/run/route.ts`).
- Result-Mapping ist explizit:
  `success|empty` + `created|updated|unchanged`,
  sowie stabile Fehlercodes (`feed_anlassraum_cluster_source_unavailable`, `feed_anlassraum_cluster_job_failed`).
- Idempotenz bleibt explizit: Reruns erzeugen keine unkontrollierten Duplikate (Fingerprint + `clusterKey` Unique-Index).
- Guardrails bleiben unveraendert:
  kein Auto-Publish, kein Auto-Approval, keine Live-/Round-Erstellung, keine Governance-Aufweichung.
- Evidenz:
  `apps/web/tests/feed-cluster-job.service.test.ts`,
  `apps/web/tests/feed-cluster-job.route.test.ts`.

### GOV-EVENT-01 — Event-/Sitzungsmodell
Status: **In Progress (Core baseline / 2026-03-19)**

Evidenz:
- `apps/web/src/app/api/events/route.ts` (Event kann Anlassraum referenzieren/erzeugen)
- `docs/event-and-session-model.md`

### GOV-EVENT-02 — QR -> Fragen -> Protokoll -> Dossier -> Runde
Status: **Done (Functional closure / 2026-03-19)**

Evidenz:
- `apps/web/src/app/api/qr/sets/route.ts` (Anlassraum-/Dossier-/Round-Link)
- `apps/web/src/app/api/qr/sets/[code]/route.ts`
- `apps/web/src/app/api/qr/resolve/route.ts`
- `apps/web/src/app/api/qr/sets/[code]/protocol/route.ts`
- `apps/web/src/app/api/qr/sets/summary/route.ts`
- `features/dossier/protocolUpsert.ts` (protocol -> dossier-upsert contracts inkl. manual list/read/apply/reject, additive apply + audit trail)
- `features/topicRound/seedContract.ts` (protocol/anlassraum/dossier -> round-seed contracts inkl. manual handoff/reject in non-public round drafts)
- `apps/web/src/app/api/events/route.ts` (Event follow-up audit chain to QR/protocol/contracts)
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/apply/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/reject/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/legacy/route.ts`
- `apps/web/src/app/api/admin/governance/dossier-upsert-contracts/[contractId]/backfill/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/handoff/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/reject/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/legacy/route.ts`
- `apps/web/src/app/api/admin/governance/round-seed-contracts/[contractId]/backfill/route.ts`
- `apps/web/tests/gov-event-02.contracts.test.ts` (E2E/Integration: protocol->contract->apply/handoff + forbidden access + legacy-policy checks)
- `apps/web/tests/gov-event-02.routes.test.ts` (Route-Acceptance: list/read/apply/reject/handoff/backfill + error/status mapping)
- `apps/web/src/app/api/admin/governance/contractsError.ts` (stabile policy-error -> HTTP-status mapping)

Manual-first Guardrails:
- Kein Auto-Publish, kein Auto-Approval.
- Protokollmaterial erzeugt reviewbare Dossier-Upsert-Contracts; Apply bleibt explizit/manuell und additiv (kein destruktives Overwrite).
- Round-Seed bleibt Contract-basiert; Handoff erzeugt nur non-public Round-Draft (`manual_review_required`), keine automatische Live-Rundenerstellung.

Legacy/Incomplete Contract Policy (Hardening 2026-03-19):
- Fehlendes Ziel-Dossier fuehrt bei Apply explizit zu `contract_missing_target_dossier` (kein implizites Dossier-Anlegen, Contract bleibt reviewbar).
- Fehlendes `anlassraumId` ist fuer nicht-admin Governance-Akteure explizit gesperrt (`actor_scope_requires_anlassraum`); Admin bleibt kontrollierter Fallback.
- Community-Rollen bleiben fuer Apply/Handoff strikt gesperrt (`actor_scope_forbidden`).

Legacy Backfill Strategy (Abschluss 2026-03-19):
- Detection (admin-only): `GET /api/admin/governance/dossier-upsert-contracts/legacy` und `GET /api/admin/governance/round-seed-contracts/legacy`.
- Remediation (admin-only): `POST .../dossier-upsert-contracts/[contractId]/backfill` (anlassraum/dossier-linkage) und `POST .../round-seed-contracts/[contractId]/backfill` (anlassraum/dossier-linkage + readiness refresh).
- Fallback ohne Backfill bleibt explizit/manual: admin kann Dossier-Apply mit `targetDossierId` manuell ausfuehren; keine automatische Oeffentlich-Publikation.
- Nicht automatisiert: Bulk-Backfill bleibt bewusst manuell/protokolliert pro Contract (keine Silent-Migration im Produktfluss).

### GOV-AI-01 — Freistart + verpflichtende Qualitaetsschicht
Scope:
- `/create` als Freistart ohne primaere Moduswahl `manual/source/ai`
- Analyse-/Pruefhilfen-/Claim-/Frage-Vorschlaege immer aktiv
- Rueckfragen bei duennem Input statt stiller Fehlzuordnung
- no auto publish / review-first / approval-first / manual-first bleibt verpflichtend

Status: **In Progress (Create baseline active / 2026-03-20)**

### GOV-AI-02 — Graph-Matching + CTA-Layer
Scope:
- Match gegen Claim-/Anlassraum-/Dossier-/Perspektivkontext
- Match-Staerken: `high`, `medium`, `none`
- CTA-Layer: `zustimmen`, `anders_sehen`, `dossier_oeffnen`, `anlassraum_oeffnen`, `perspektive_anhaengen`, `trotzdem_neu_anlegen`
- kein Silent-Merge, keine Ursprungsausloeschung

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-03 — Anlassraum als Arbeitsort
Scope:
- Erfassung direkt im Anlassraum
- Analyse im Anlassraum
- CTA-Momente in bestehende Kontexte
- sauberer Handoff Anlassraum <-> Dossier

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-04 — Canonical Multi-Orchestration Flow
Scope:
- kanonischen Hauptfluss definieren:
  `Freistart -> Intake -> Pruef/Qualitaet -> Graph-Matching -> CTA/Routing -> Anlassraum/Dossier/Debatten-Setup/Beteiligung -> Output/API/Audit`
- Unter-Orchestrierungen trennen:
  `intake`, `pruefung`, `agenda_fragen`, `dossier`, `beteiligung_abstimmung`
- gemeinsame Contracts / Events / Auditierbarkeit / Provenance

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-05 — Prompt Contracts + Typed Outputs
Scope:
- Canonical Prompt Contracts fuer:
  `intake`, `pruefung`, `agenda_fragen`, `dossier`, `beteiligung_abstimmung`, `graph_matching_cta`
- pro Orchestrierung stabile Soll-Ausgaben (typed output contracts)
- Confidence-/Unsicherheitsfelder verpflichtend
- keine ungekennzeichneten Freitext-Blackboxes in kritischen Uebergaengen
- spaeter in versionierte `zod`-/`ts`-Schemas ueberfuehren
- keine kritischen Orchestrierungsuebergaenge nur mit losem Freitext
- versionierte Output-Contracts fuer Replay, Audit und Providerwechsel
- typed Contracts gelten als Vorstufe fuer stabile Orchestrator-Adapter

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-06 — Language-Aware Core + Cross-Lingual Matching
Scope:
- `uiLocale != contentLanguage != sourceLanguage` sauber trennen
- Originaltext als canonical source behalten
- Uebersetzungen als abgeleitete Darstellung markieren
- Cross-lingual Matching verpflichtend
- Rueckfragen in Nutzersprache + Fragequalitaet pro Sprache

Status: **Open (planned / canonical / 2026-03-20)**

### GOV-AI-07 — Meta-Layer / Audit / Provenance / Layman Explanation
Scope:
- verpflichtender Meta-Layer ueber alle Orchestrierungsstufen
- provenance-by-default + audit trail pro Schritt
- trust/risk flags + bias/ethics checks
- layman explanation in produktiver Ausspielung
- Human-in-the-Loop fuer high-impact Faelle

Status: **Open (planned / canonical / 2026-03-20)**

### Architektur-Drift Klarstellung (2026-03-23)

- Das Zielbild "ein einzelner Orchestrator fuer alles" reicht nicht aus.
- Der bestehende E150-Orchestrator bleibt der deterministische Hauptfluss/Backbone.
- Spezialisierte Orchestrierungen kommen zusaetzlich hinzu:
  - Intake-Orchestrierung
  - Pruef-Orchestrierung
  - Agenda-/Fragen-Orchestrierung
  - Dossier-Orchestrierung
  - Beteiligungs-/Abstimmungs-Orchestrierung
- Die fruehere 11-Stufen-Pipeline bleibt als technische Unterpipeline/KI-Verarbeitungssicht wertvoll.
- Die kanonische Produktsicht ist ab jetzt das 5-Orchester-Modell (siehe `docs/E150/Part16_AI_Orchestration_and_Safety.md`).

### GOV-AI-ORCH-01 — Kanonisches Zielbild der 5 Orchestrierungen verankern
Scope:
- verbindliche Produkt-/Architekturregeln fuer alle 5 Orchestrierungen
- eindeutige Abgrenzung zur alten monolithischen "ein Orchestrator fuer alles"-Annahme
- klare Guardrails: no auto publish, no silent merge, human control visible

Status: **Done (canonical docs baseline / 2026-03-23)**

### GOV-AI-ORCH-02 — KI-/Route-Anbindungen inventarisieren und mappen
Scope:
- aktive KI-Routen und Feature-Andockpunkte inventarisieren
- Mapping je Endpoint/Service auf das 5-Orchester-Zielbild
- offene Gaps/Drifts als priorisierte Folgeaufgaben ausweisen

Status: **Done (inventory baseline refreshed / 2026-03-27)**

### GOV-AI-ORCH-03 — Provider-/Modellstrategie je Orchester
Scope:
- primaere/fallback Modellklasse pro Orchester definieren
- Open-weight/self-host Eignung je Orchester markieren
- Unsicherheiten (DPA/Residency/Kosten/SLA) explizit offenlegen

Status: **Done (provider baseline refreshed / 2026-03-27)**

### GOV-SAFETY-01 — Commitment-first statt Proximity-first
Scope:
- kein direktes Personen-Matching nur wegen aehnlicher Position/Region
- zuerst sichtbares Sach-Commitment (Beitrag, Quellen, Optionen, Mitwirkung)
- Social-Naehe nur als spaeterer, kontrollierter Schritt

Status: **Done (policy canonized / 2026-03-23)**

### GOV-SAFETY-02 — Schutzregeln fuer Frauen / vulnerable / andersdenkende Nutzer
Scope:
- Schutz vor Belaestigung, Anmachspruechen, zweideutigen Narrativen
- Schutz vor sozialem Druck, Vereinnahmung und manipulativer Kontaktanbahnung
- Moderations-/Abuse-Interventionsfaehigkeit als Pflicht

Status: **Done (policy canonized / 2026-03-23)**

### GOV-SAFETY-03 — Social-Eskalation nur gestuft/opt-in/moderierbar
Scope:
- kein ungefragtes DM-Default, keine aggressive 1:1-Kopplung
- Gruppen-/Kontaktlogik nur opt-in, gestuft, missbrauchssensibel und nachvollziehbar
- Community-/Inbox-Ausbau nur nach Schutz- und Freigaberegeln

Status: **Done (decision canonized / 2026-03-26)**

Umsetzungsslices nach Entscheid:
- `GOV-SAFETY-03A` (Policy-Resolver / Startform) — done (`2026-03-27`)
- `GOV-SAFETY-03B` (Abuse-/Moderations-/Audit-Hardening) — done (`2026-03-27`)
- `GOV-ANLASS-08B` (Research-Anschluss an Startform) — done (`2026-03-27`)

### GOV-SEC-01 — Secret-Hygiene / lokale Prod-URI-Risiken
Scope:
- Prod-Secrets/Prod-URIs nicht als lokaler Alltagsstandard
- Rotation/Hygiene als Pflicht und nicht als optionales Ops-Detail
- Security-Risiken explizit vor lokaler Bequemlichkeit priorisieren

Status: **In Progress (doc baseline active / 2026-03-23)**

### GOV-SEC-02 — Route-/Auth-/AI-Anbindungs-Auditpflicht
Scope:
- Auditpflicht vor naechstem groesseren Slice
- Route/Auth/AI-Guardrails, Failure-Modes, Logs, Abuse-Surface dokumentiert pruefen
- Findings in OpenTasks als harte Follow-ups verankern

Status: **Open (audit run pending / 2026-03-23)**

### GOV-SEC-03 — PII-/Content-/AI-Zonen + High-impact-Auditpflicht
Scope:
- Datenzonenmodell (`PII`, `Content`, `AI-Processing`, `Trust/Audit`) als Pflichtarchitektur
- externe KI nur minimal-notwendige, moeglichst entpersonalisierte Ausschnitte
- High-impact-Klassen nur mit Audit-/Trace-/Review-Anspruch

Status: **Open (implementation pending / 2026-03-23)**

Priorisierung (2026-03-20):
- Ohne GOV-AI-01 bleibt `/create` fachlich widerspruechlich (legacy mode split vs. Freistart-Zielbild).
- Ohne GOV-AI-02 bleibt der Graph-Moment ohne verbindliche CTA-Entscheidung ungenutzt.
- Ohne GOV-AI-05 fehlen stabile Prompt-/Output-Vertraege fuer reproduzierbare Orchestrierung.
- Ohne GOV-AI-06 bleibt Sprachkonsistenz und Cross-lingual Matching unzuverlaessig.
- Ohne GOV-AI-07 bleibt Governance- und Audit-Transparenz unvollstaendig.

Betroffene State-Machines (Programm-Ebene):
- Create-Intake-Flow (Freistart -> Analysepflicht -> Match/CTA -> Handoff)
- Anlassraum-Lifecycle (`draft -> curated -> reviewed -> approved -> active -> archived`)
- Dossier-Upsert-Contract-Lifecycle (`pending_review -> partially_applied/applied -> rejected`)
- Round-Seed-Contract-Lifecycle (`review_required -> draft_created/rejected`)
- Output-Prep-Lifecycle (`draft -> queued -> review -> ready -> published/discarded`)

Weiterhin aktive Publish-Gates:
- no auto publish
- review-first
- approval-first
- manual-first
- scoped governance roles + publish-gate-pruefung

Bewusst noch nicht automatisiert:
- kein Auto-Publish aus Match/CTA
- kein Silent-Merge bei Match
- kein Auto-Handoff in Live-Runde/Public-Dossier
- keine Bulk-Silent-Migration im Produktfluss
- keine Stage-2/Stage-3 Self-Host-/Souveraenitaetsvorziehung in aktive Kern-Runs

### GOV-SIGNAL-01 — Signals
Muss enthalten:
- Signaltypen: `interest`, `support`, `concern`, `priority`
- Aggregationslogik
- Decay
- Trigger-Schwellen
- Konflikt-Erkennung
- Radar-Ausgabe

### GOV-FUNDING-01 — Signals + Funding
Funding-Typen:
- `mission`
- `project`
- `resource`
- `hybrid`

Pflichtlogiken:
- Funding Intent vor Funding
- Readiness Score
- Matching Funds
- Impact Tracking
- Plattformgebuehren transparent
- max. Anteil einzelner Akteure begrenzen

### GOV-FUNDING-02 — Ressourcen / Sachleistungen
- Material
- Arbeitsleistung
- Kontakte
- Sachspenden

### GOV-FUNDING-03 — Impact / Refunding
- Status / Fortschritt
- Ergebnis / Foto / Nachweis
- Folgeprojekt / Wartung / Erweiterung moeglich

### GOV-PRICING-01 — Hybrid-Pricing
- Basispreis
- Anlassraum-Komponente
- optionale Teilnehmer-Komponente
- optionale Outcome-/Report-Komponente
- Caps
- Add-ons

### GOV-PRICING-02 — Admin Pricing Control
Admin kann je Entity:
- individuelle Preisprofile setzen
- Rabatt bis zu 30 % vergeben
- Rabatt-Scope definieren
- zeitliche Begrenzung setzen
- Approval fuer hohe Rabatte erzwingen

### GOV-JOURNALISM-01 bis 04
Journalismus basiert auf Anlassraeumen, `source_anchor`, Truth Guardrails und offenen Dossiers.
Nicht losgeloest vom Governance-Kern umsetzen.

### GOV-MUNI-01 bis 06
Verwaltung / Kommune operativ und executive-faehig machen.
Nicht zuerst Einwohner-Billing priorisieren, sondern:
- Radar
- Anlassraeume
- Verwaltungsmodus
- Buergermeister-Dashboard
- Prozessstatus
- Dezernate

### GOV-ORG-01 / 02
- `GOV-ORG-01` abgeschlossen: typed Org-Context-/Attachment-Contract verankert Anlassraum-first inkl. optionalem Dossierbezug, ohne Parallel-Domaene (`docs/E150/GOV-ORG-01_DOSSIER_ANLASSRAUM_ORG_CONTEXT_CONTRACT_2026-03-29.md`).
- `GOV-ORG-02` bleibt offen: offizieller Release-/Trust-Modus auf Basis des neuen Org-Context-Contracts.

### GOV-CIVIC-01 / 02 / 03
- `GOV-CIVIC-01` ist abgeschlossen: shared Civic-/Creator-/Stream-/Repraesentanz-Contract steht (`features/anlassraum/civicCreatorRepresentationContract.ts`) inkl. Thema-vs-Region-Achsentrennung und route-naher Meta-Ausgabe (`meta.civicCreatorRepresentation`).
- `GOV-CIVIC-02` ist abgeschlossen: typed Lifecycle-/Transition-Contract steht (`features/anlassraum/civicCreatorLifecycleContract.ts`) inkl. route-naher Meta-Ausgabe (`meta.civicCreatorLifecycle`).
- `GOV-CIVIC-03` ist abgeschlossen: typed Impact-/Unterstuetzungs-Contract steht (`features/anlassraum/civicCreatorImpactSupportContract.ts`) inkl. route-naher Meta-Ausgabe (`meta.civicCreatorImpactSupport`).

## Pricing- / Produktleitlinien

Die alte pauschale Einwohnerlogik wird nicht als Hauptpfad fortgeschrieben.
Neues Zielmodell:

- **Open Civic / Radar**: frei oder niedrigschwellig
- **Basis-Governance**: Basispreis
- **aktive Anlassraeume**: belastungs-/komplexitaetsorientiert
- **aktive Teilnehmende**: optionale variable Komponente
- **Add-ons**: Event, Assistenz, Reports, Managed Governance

Rabatt:
- bis zu 30 %
- nicht pauschal auf alles
- insbesondere fuer Pilot oder Jahreszahlung
- ab hoher Rabattstufe Freigabe + Audit

## Erledigt (bestehend)

### Seit 2026-03-04

| Task | Status | Evidenz |
| --- | --- | --- |
| Admin Graph Navigation vereinheitlicht | Done | `apps/web/src/components/admin/GraphAdminNav.tsx`, `apps/web/src/app/admin/graph/*/page.tsx` |
| Graph-Health Fehlerdetail + Impact-Link | Done | `apps/web/src/app/api/admin/graph/health/route.ts`, `apps/web/src/app/admin/graph/health/page.tsx`, `apps/web/src/app/admin/graph/impact/page.tsx` |
| Phase 0 Startpaket | Done | `docs/START_HERE.md`, `docs/ARCHITECTURE.md`, `.env.example`, `scripts/dev/*`, `docker-compose.yml`, `compose/prod.yml` |
| CI fuer Compose/Prod aktualisiert | Done | `.github/workflows/e150-ci.yml` |
| Web CI staerker | Done | `.github/workflows/web-ci.yml` |
| Rollback: RateLimit per Env abschaltbar | Done | `apps/web/src/utils/rateLimitHelpers.ts` |
| Rollback: Findings ohne Effective-Filter | Done | `/api/dossiers/*`, `features/dossier/db.ts` |
| Rollback: Hash-Chain Verify deaktivierbar | Done | `/api/admin/dossiers/[id]/verify-revisions` |
| Pending Commit abgeschlossen | Done | Landing/Admin/Create/Material/Telemetry + Pricing/SEO/Region |
| DecisionArchitecture v2.0 Download-Asset wiederhergestellt | Done | `apps/web/public/docs/DecisionArchitecture_v2_0.docx` |
| Create-Route + AdminErrorPanel in Git aufgenommen | Done | `apps/web/src/app/create/page.tsx`, `apps/web/src/components/admin/AdminErrorPanel.tsx` |
| Landing-Input wieder oben zentriert | Done | `apps/web/src/app/start/LandingStart.tsx`, `features/landing/LandingAssistant.tsx` |
| MaterialHub Hash-Sprung abgesichert | Done | `apps/web/src/components/dossier/MaterialHub.tsx` |
| Admin-Fehleranzeigen vereinheitlicht | Done | `apps/web/src/components/admin/AdminErrorPanel.tsx`, `apps/web/src/app/admin/*` |

### Seit 2026-02-19

| Task | Status | Evidenz |
| --- | --- | --- |
| Contributions/New Analyse-Flow auf Auto-Flow umgestellt | Done | `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`, `apps/web/src/app/contributions/new/ContributionNewClient.tsx` |
| Dossier-Header Premium/Mobile/No-Duplicates | Done | `apps/web/src/components/dossier/InstitutionalHeader.tsx`, `apps/web/src/components/dossier/DossierViewer.tsx` |
| Demo/Screenshot Studio | Done | `apps/web/src/app/demo/*`, `features/report/data/demoReports`, `features/votes/demoVotes.ts`, `features/mandate/demoMandate.ts` |
| Demo Factcheck (KI/Manuell) + Redaktion-Feedback + Admin-Review | Done | `apps/web/src/app/demo/factcheck/page.tsx`, `apps/web/src/app/api/editorial/feedback/route.ts`, `apps/web/src/app/admin/factcheck/page.tsx` |
| Region Pitch + Landing Fallback + Feed-Region-Filter | Done | `apps/web/src/app/admin/pitch/page.tsx`, `apps/web/src/app/region/[codeOrSlug]/page.tsx`, `apps/web/src/app/api/feeds/pull/route.ts` |
| Pricing/Vormerken Domain konsolidiert | Done | `features/pricing/domain/*`, `features/pricing/usecases/createPreorderLead.ts`, `features/pricing/server/leadsRepo.ts` |
| Pricing-/Vormerken-UI vereinheitlicht | Done | `apps/web/src/app/pricing/page.tsx`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `apps/web/src/app/vormerken/page.tsx` |
| SEO-Regionen & Pillar-Seiten + Sitemap | Done | `features/seo/*`, `apps/web/src/app/deutschland/*`, `apps/web/src/app/sitemap.ts` |
| Locale-Detection zentralisiert | Done | `apps/web/src/lib/i18n/detectLocale.ts`, `apps/web/src/app/layout.tsx` |
| Typecheck + Lint wieder gruen | Done | `pnpm -w -r typecheck`, `pnpm -w -r lint` |
| Vercel Build-Fail `node:crypto` in RateLimit behoben | Done | `apps/web/src/utils/rateLimit.ts` |

## Strategische Erweiterung – Dossier-Normierung (Legitimation 2.0)

| Task | Beschreibung | Status |
|------|--------------|--------|
| DS-01 | `features/dossier/schemas.ts` mit `DossierSchema` Wrapper erstellen | Done |
| DS-02 | Adapter `buildDossierFromAnalyze()` implementieren | Done |
| DS-03 | Whitepaper-Hook im E150-Docs verankern | Done |
| DS-04 | Optional: Route `/dossier/[id]` pruefen | Done |

## Arbeitsregel fuer jeden Run

1. `docs/E150/OpenTasks.md` zuerst lesen.
2. Genau ein aktives Paket umsetzen (max 6 Aufgaben im Drift).
3. `docs/E150/Part15.md` PR-Log aktualisieren.
4. `docs/E150/OpenTasks.md` Status / Naechster Run aktualisieren.
5. `Changes / Verification / Next Steps` ausgeben.
6. Immer angeben:
   - welche State Machines eingefuehrt wurden
   - welche Publish Gates aktiv sind
   - welche Teile bewusst noch nicht automatisiert wurden
7. Hard-last-Regel beachten: Stage-2 / Stage-3 duerfen nicht in aktive Runs gezogen werden, solange Kernorchestrierungen, Produktbaseline und Live-Betrieb nicht abgeschlossen sind.

## Erste Erfolgsdefinition

Noch nicht 11.000 Gemeinden.

Sondern:
- 1 Entity
- 1 Anlassraum
- Review
- Approval
- Publish
- Signals
- Funding Intent
- optional Funding

## Spaeter / bewusst hart nachgelagert (immer letzter Agenda-Punkt)

Dieser Block ist dauerhaft nachgelagert.
Er darf nicht vorgezogen werden.
Er wird erst bearbeitet, wenn:
- die Orchestrierungen fachlich und technisch beruecksichtigt sind
- der operative Kern produktiv laeuft
- die aktiven Kern-PRs abgeschlossen sind
- der Produktbetrieb stabil ist
- Evaluations-, Audit- und Governance-Baselines im Live-Betrieb vorliegen

Er ist ausdruecklich NICHT Teil der aktuellen Priorisierung.

#### Freigabekriterien fuer Stage-2 / Stage-3
Diese Bloecke duerfen erst auf aktiv gesetzt werden, wenn:
- produktiver Kernbetrieb ueber laengeren Zeitraum stabil ist
- belastbare Eval-Suiten fuer alle Kern-Orchestrierungen vorliegen
- Audit-/Review-/Publish-Pfade live verifiziert sind
- Kostenbild je Orchestrierung bekannt ist
- Fehlerraten / Fallback-Raten / Human-Review-Raten bekannt sind
- i18n / cross-lingual baseline im Produktbetrieb validiert ist

### STAGE-2 — Teilweise Souveraenisierung / Self-Host Expansion
Status: Parked (hard-last)
Naechster Run: erst nach vollstaendigem Kernbetrieb
Regel:
- immer letzter umsetzbarer Block nach Abschluss aller Kern-PRs
- nicht in aktive Sprint-/PR-Planung ziehen
- nur nach expliziter Re-Priorisierung durch den User

Inhalt:
- Self-host/private-host fuer standardisierbare Orchester pruefen
- lokale/open-weight Modelle fuer Intake, Matching, Moderation, Embeddings
- Exit-Vorbereitung aus punktueller Provider-Abhaengigkeit
- nur auf Basis realer Produktionsdaten, Eval-Suiten und Kostenbilder

### STAGE-3 — Weitgehende Provider-Unabhaengigkeit
Status: Parked (hard-last)
Naechster Run: erst nach Stage-2 und stabilem Produktbetrieb
Regel:
- absolut letzter Agenda-Punkt
- keine Vorwegnahme in laufenden Architektur-/Produkt-PRs
- nur wenn System, Governance und Betrieb bereits tragfaehig sind

Inhalt:
- weitere Internalisierung ausgewaehlter Orchester
- Frontier-Abhaengigkeit auf Ausnahmefaelle reduzieren
- eigene Modell-/Inference-Strategie nur nach nachgewiesenem Bedarf
- kein Ziel `eigenes Frontier-Modell um jeden Preis`
