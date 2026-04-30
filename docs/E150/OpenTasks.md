# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.
Wenn andere Parts, alte Drift-Prompts oder Zwischen-Notizen abweichen, gewinnt diese Datei.

Stand: 2026-04-29

## Quick Read (2026-04-04)

- Kompakter aktueller Arbeitsstand: `docs/E150/CURRENT_STATE_2026-04-04.md`
- Operative Steuerung bleibt hier in `OpenTasks.md` (SSOT).
- Evidence-Dateien bleiben Detailbelege; Legacy-/Batch-Texte sind Hintergrund, nicht Tagesqueue.
- Surface-Consolidation Round 2B (`/stream`, `/account`, `/themen`, `/pricing`, `/order`) ist lokal umgesetzt und in Review-Vorbereitung; Fokus auf Entdoppelung, Status-Staffelung und gemeinsame Paketlogik mit `/order`.

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

## Verbindlicher Qualitaetsblock (Pflichtpfad)

`PR-QUALITY-HARM-02` ist ein **essentieller Produkt- und Vertrauens-Slice** und kein optionaler Polish.

Ohne diesen Slice ist **keine belastbare Produktgarantie** ableitbar fuer:
- Registrierung
- Rollenrouting
- Dashboard-Zielbilder
- Pricing-/Order-Followups
- Add-on-Reifestand

Erst mit diesem Slice gelten die wichtigsten Nutzerreisen als produktisch abgesichert.

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
| ROUTING-HARM-01 | done | high | PR-AI-CREATE-01 | `AnalyzeWorkspace`, Create/Contribution-Fallbacks, Finalize-Redirect-Resolver | Client-Navigation folgt serverseitigem Finalize-Ziel ohne Drift | Auto-Redirect nach erfolgreichem Finalize; `redirectTo` hat Vorrang; Fallback widerspricht Serverziel nicht; interne Redirects only | no | Erledigt (2026-04-04): `/create`-Finalize-Fallback auf shared server-paritaetischen Builder (`buildFinalizeFallbackPath`) umgestellt; intent-basierte `/runden`-Abweichung aus Finalize-Fallback entfernt. Tests fuer Round-Setup-Fall in `/create` auf `/swipes`-Fallback eingefroren. Evidenz: `docs/E150/ROUTING-HARM-01C_SERVER_TARGET_PARITY_2026-04-04.md`. |
| ROUTING-HARM-01A | done | high | ROUTING-HARM-01 | Finalize-Redirect-Paritaet in `/create` + `/contributions/new` Wrappers | Legacy-Wrappers auf denselben Redirect-Resolver und Auto-Redirect-Pfad bringen | Shared Redirect-Resolver wird in beiden Einstiegen genutzt oder per Tests als identisch abgesichert; serverseitiges `redirectTo` bleibt vor Fallback priorisiert; nur interne Redirect-Ziele; Legacy-Flow-Tests fuer Finalize-Redirect ergaenzt | no | Erledigt: shared Fallback-Builder (`buildFinalizeFallbackPath`) in `/create` und `ContributionNewClient` genutzt; Wrapper-Redirect von `/contributions/new` nach `/create` testseitig auf Query-Paritaet abgesichert (`2026-03-27`) |
| ROUTING-HARM-01B | done | medium | ROUTING-HARM-01A | Finalize-Redirect-Vertragshaertung fuer Wrapper-/Boundary-Edges | Redirect-Verhalten bei fehlendem/ungueltigem `redirectTo` und Boundary-Delegation testbar abschliessen | Tests decken `/api/create/finalize`-Delegation + Redirect-Vertragsparitaet zu `/api/contributions/finalize` ab; `resolveFinalizeRedirectTarget` blockt externe Ziele weiterhin; Wrapper-Fallback bleibt intern und widerspricht Serverziel nicht | no | Erledigt: Wrapper-Boundary (`/api/create/finalize`) per Route-Tests auf Redirect-Paritaet (dossier/non-dossier + invalid_mode) abgesichert; Redirect-Resolver blockt externe Ziele weiterhin inkl. no-navigate-Fall (`2026-03-27`) |
| UX-HARM-01 | done | high | ROUTING-HARM-01 | `/swipes` Arrival-Flow bei `fromDraft` | Arrival ist fuer Nutzer nachvollziehbar statt nur Meta-Banner | `fromDraft` triggert fokussierten Arrival-Modus; kein Fake-Mapping bei fehlenden Treffern; klarer Rueckfall auf allgemeines Deck | no | Erledigt (2026-04-05): Arrival-Contract inkl. Fehlerpfad geschlossen. Wenn der Proposal-Feed nicht verfuegbar ist, bleibt `fromDraft` explizit im no-match-Return (`items=[]`) statt Seed-Fallback; non-arrival Requests behalten Seed-Fallback. Arrival-Helper/Page/Feed-Tests decken Trefferfall, no-match und Error-Fallback jetzt durchgaengig ab. Evidenz: `docs/E150/UX-HARM-01_SWIPES_ARRIVAL_CONTRACT_CLOSURE_2026-04-05.md`. |
| UX-HARM-01A | done | medium | UX-HARM-01, PR-0045 | `/swipes` Arrival-Feintuning fuer grosse `fromDraft`-Treffermengen | Arrival-Fokus bei vielen Treffern steuerbar machen, ohne Bewertungslogik zu aendern | Arrival-Hinweis zeigt Trefferstatus klar; initialer `fromDraft`-Fokus bleibt erhalten und kann per explizitem "Alle Vorschlaege"-Umschalter aufgehoben werden; no-match Fallback bleibt intakt; keine Routing-/Ranking-Aenderung; Tests fuer Umschalter + Fallback vorhanden | no | Erledigt: Arrival-Banner nutzt expliziten Umschalter via shared Toggle-Resolver, Trefferstatus fuer grosse Mengen ist klarer, no-match-Fallback bleibt unveraendert; Helper- und Feed-Arrival-Tests aktualisiert (`2026-03-27`) |
| PR-AI-CREATE-01 | done | high | GOV-AI-01 | `/create` Freistart, Intake-Handoff, Match/CTA-Eingang | `/create` als kanonischer Intake ohne Legacy-Drift stabilisieren | Handoff-Kontext wird uebernommen; keine impliziten Legacy-Defaults; Save/Finalize bleiben regelkonform | no | Erledigt (2026-04-04): Parent-Abschluss ueber 01A-01E. Legacy-Wrapper (`/contributions/new`) reicht Multi-Entry-Hints (`entryIntent`/`entryMode` inkl. snake_case) kontraktsicher an `/create` durch; invalid entry hints degradieren stabil auf kanonischen Intake ohne Legacy-Rueckfall. Evidenz: `docs/E150/PR-AI-CREATE-01E_CREATE_PARENT_CLOSURE_2026-04-04.md`. |
| PR-AI-CREATE-01F | done | high | PR-AI-CREATE-01E, PR-RUNDEN-OPS-03 | `/create` Surface-Entdoppelung: Composer als einziger Initial-Einstieg, Analyze nur als Folgeschritt | Parallele Doppeloberflaeche (oben Composer + unten Legacy-Analyze-Workspace) beim Initial-Load entfernen und CTA-Folgeschritt je Modus klar halten | Beim ersten Laden zeigt `/create` nur die neue Composer-Maske; Legacy-Analyze-Workspace wird nicht aus persisted `hasStarted` auto-gerendert; Analyse-/Pruef-Folge bleibt nur nach expliziter Nutzeraktion sichtbar; `/demo/create` bleibt beim selben Composer-Kern ohne Legacy-Zweitflaeche; Tests decken den Follow-up-Guard explizit ab | no | Erledigt (2026-04-29): `CreateClient` nutzt expliziten `followupActivated`-Guard fuer Analyze-Render und stellt LocalStorage-Restore auf Text-only ohne Auto-Start um; `shouldRenderCreateAnalyzeWorkspace` entsprechend gehaertet; Tests aktualisiert/erganzt in `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`. |
| PR-AI-CREATE-01A | done | high | PR-AI-CREATE-01 | `/create` Intake-Contract-Normalizer + Query-Tests | Handoff-Parameter im Create-Einstieg deterministisch normalisieren und Legacy-Drift begrenzen | Shared Normalizer fuer erlaubte Handoff-Felder vorhanden; unbekannte/legacy Query-Felder werden ignoriert statt implizit gemappt; Feed-/Match-Handoffs bleiben funktional unveraendert; Tests fuer gueltige/ungueltige Parameterfaelle vorhanden | no | Erledigt: shared Intake-Normalizer (`parseCreateIntakeContextFromQuery` / `normalizeCreateIntakeContextInput`) in `/create`-Page + Fast-Path-Href genutzt; neue Tests fuer valide/ungueltige/legacy Query-Faelle aktiv (`2026-03-27`) |
| PR-AI-CREATE-01B | done | medium | PR-AI-CREATE-01A | `/create` Intake-Handoff Contracts in Legacy-Entry-Points | Kanonischen Intake auch bei Legacy-Einstiegen (`/contributions/new`, Login-Return) kontraktsicher halten | Legacy-Einstiege behalten nur erlaubte Handoff-Felder; keine implizite Rueckkehr zu `intent=claim&mode=manual`; Tests fuer Legacy-Query-Durchleitung und Intake-Kontextsichtbarkeit ergaenzt | no | Erledigt: `/contributions/new` laesst nur erlaubte `/create`-Handoff-Keys durch; unknown/legacy Keys werden verworfen; Page-/Wrapper-Tests decken Query-Durchleitung und Intake-Sichtbarkeit ab (`2026-03-27`) |
| PR-AI-CREATE-01C | done | medium | PR-AI-CREATE-01B, GOV-CIVIC-01, GOV-CIVIC-02, GOV-CIVIC-03, GOV-ORG-02 | `/create` intent-basierter Multi-Entry-Orchestrator (Contract-Slice) | Intents/Modi/Routing als gemeinsamen Intake-/Analyse-/Draft-Kern kontraktnah schaerfen, ohne neue Machtlogik | Shared Orchestrator-Intent-Contract deckt `issue_signal`, `content_companion`, `round_setup`, `org_context_setup` sowie `guided/direct` ab; Analyse bleibt Vorschlagsschicht mit erhaltenem Originalinput; `/create` bleibt Intake-Orchestrator, `/runden` bleibt Betriebsflaeche; keine Auto-Publish-/Truth-/Priority-Aufwertung | no | Erledigt (2026-04-03): `apps/web/src/features/create/orchestratorIntentContract.ts` + additive Anbindung in `/create` (`apps/web/src/app/create/page.tsx`, `apps/web/src/app/create/CreateClient.tsx`), inkl. fallback routing hint (`/swipes` vs `/runden`); Tests: `apps/web/tests/create-orchestrator-intent-contract.test.ts`, `apps/web/tests/create-mode.page.test.ts`; Evidenz: `docs/E150/PR-AI-CREATE-01C_CREATE_MULTI_ENTRY_ORCHESTRATOR_2026-04-03.md`. |
| GOV-AI-01 | done | high | GOV-01, GOV-02 | Freistart + verpflichtende Qualitaetsschicht | Qualitaets-/Pruefpfad als Pflicht vor weiterem Routing sichern | Analysepflicht bleibt aktiv; Rueckfragen statt stiller Fehlzuordnung; no-auto-publish Guardrails intakt | no | Erledigt (2026-04-04): Pflicht-Qualitaetsschicht in Analyze-/Finalize-Pfaden als Abschluss eingefroren. Thin-Input wird weiterhin als BAD_INPUT geblockt, ungueltiger Anlassraum-Kontext wird nicht still degradiert, und Finalize ohne analysierbare Claims bleibt serverseitig gesperrt (`no_claims_selected`). Evidenz: `docs/E150/GOV-AI-01_QUALITY_GATE_PARENT_CLOSURE_2026-04-04.md`. |
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
| GOV-AI-05 | done | medium | GOV-AI-ORCH-03 | Prompt-Contracts + typed outputs | Reproduzierbare, auditierbare Output-Vertraege vorbereiten | Inventar der kritischen Prompt-/Output-Grenzen; Vorschlag fuer versionierte Contracts | no | Erledigt (2026-04-05): produktkritische Prompt-/Output-Grenzen inventarisiert (Analyze/Match/CTA, Refine/Trace, Factcheck/Finding/Dossier-nahe Pfade), typed vs. untyped Risiken eingeordnet und versionierbare Contract-Richtung als Implementierungs-Pfad vorbereitet. Folge-Implementierung bleibt als separater Task `GOV-AI-05A` offen. Evidenz: `docs/E150/GOV-AI-05_PROMPT_OUTPUT_CONTRACT_INVENTORY_2026-04-05.md`. |
| GOV-AI-05A | done | medium | GOV-AI-05 | High-impact Prompt-/Output Contract Hardening (minimal) | Kritische unversionierte KI-Grenzen mit kleinem typed Contract-Stack absichern | Shared versionierter Prompt-/Output-Envelope fuer `contributions/refine`, `contributions/trace` und `contributions/analyze/save`; `promptVersion`/`contractVersion` werden explizit transportiert; defensive Parser statt freiem `JSON.parse`; keine neue Orchestrierungsarchitektur | no | Erledigt (2026-04-05): Shared Prompt-/Output-Envelope-Helfer (`apps/web/src/features/ai/promptOutputEnvelope.ts`) eingefuehrt und in den drei kritischen Routen angebunden (`apps/web/src/app/api/contributions/refine/route.ts`, `apps/web/src/app/api/contributions/trace/route.ts`, `apps/web/src/app/api/contributions/analyze/save/route.ts`). Parser akzeptieren versionierte Envelopes defensiv, bleiben legacy-kompatibel und transportieren `promptOutput`-Meta (`contractVersion`/`promptVersion`/`outputVersion`/`parserMode`) explizit in Responses. Evidenz: `docs/E150/GOV-AI-05A_PROMPT_OUTPUT_ENVELOPE_HARDENING_2026-04-05.md`. |
| GOV-AI-06 | done | medium | GOV-AI-ORCH-03 | Language-aware Core + cross-lingual matching | Sprachtrennung und Matching-Qualitaet belastbar mappen | Ist-Analyse fuer `uiLocale/contentLanguage/sourceLanguage`; Gap-Liste mit Folgetasks | no | Erledigt (2026-04-05): Sprach-/Matching-Inventar ueber Analyze/Match/CTA, Research/Factcheck, Dossier-Source-Layer und i18n-Translation-Pfade erstellt; reale Gap-Liste fuer language-aware core dokumentiert (u. a. fehlende durchgaengige Locale-Triplet-Haertung und nicht explizites cross-lingual Matching im Match-Service). Folge-Slice als `GOV-AI-06A` angelegt. Evidenz: `docs/E150/GOV-AI-06_LANGUAGE_CORE_CROSS_LINGUAL_INVENTORY_2026-04-05.md`. |
| GOV-AI-06A | done | medium | GOV-AI-06 | Language Context Contract Hardening (minimal) | `uiLocale/contentLanguage/sourceLanguage` entlang Analyze->Match->Attach kontraktnah schaerfen und cross-lingual Verhalten explizit machen | Shared Language-Context-Normalizer + Boundary-Validierung vorhanden; Match-Service nutzt expliziten Sprachmodus (mind. `same_language_only`) statt impliziter cross-lingual Annahme; defensive Tests fuer Locale-Triplet-Transport ohne neue Matching-Engine | no | Erledigt (2026-04-05): shared Language-Context-Contract (`apps/web/src/features/create/languageContextContract.ts`) in Analyze-Request/Route/Response angebunden; Boundary-Parser prueft Triplet + `matchingLanguageMode`; Match-Service transportiert explizites `same_language_only`; gezielte Tests + typecheck + lint gruen. Evidenz: `docs/E150/GOV-AI-06A_LANGUAGE_CONTRACT_HARDENING_2026-04-05.md`. |
| GOV-AI-07 | done | medium | GOV-SEC-03 | Meta-Layer/Audit/Provenance/Layman | Governance-Pflichten fuer produktive Erklaerbarkeit festlegen | Meta-Basissatz ist auf allen Pfaden verpflichtend; Pflichtkern fuer Nachvollziehbarkeit/Erklaerbarkeit bleibt synchron; High-impact-Pfade sind breit und verbindlich definiert; asynchrone Nachreichung nur fuer vertiefende Zusatzinformationen | no | Entscheidung manifestiert (2026-03-28): kein kuenstliches Minimieren produktiv genutzter Telemetrie-/Admin-Metafelder; Pflichtkern gilt fuer Analyse, Dossier, Factcheck, Matching, CTA, Findings und veroeffentlichungsnahe Verdichtung. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-AI-07A | done | medium | GOV-SEC-03A | Meta-Layer Feldinventar fuer bestehende High-impact Pfade | Vorentscheidungs-Basis fuer `GOV-AI-07` durch Ist-Inventar und Gap-Liste schaffen | Bestehende Audit/Provenance/Layman-Felder fuer relevante Antworten/Logs inventarisiert; fehlende Pflichtfelder pro Option markiert; keine neue Governance-Regel implementiert | no | Erledigt: High-impact Meta-Layer-Feldmatrix mit Erzeugung/Transport/UI-Ankunft und Stabilitaetsstatus dokumentiert (`docs/E150/GOV-AI-07A_META_LAYER_FIELD_INVENTORY_2026-03-27.md`) (`2026-03-27`) |
| GOV-AI-ORCH-02 | done | high | GOV-AI-ORCH-01 | KI-/Route-Inventar gegen 5-Orchester-Zielbild | Aktive KI-Pfade vollstaendig inventarisieren | Endpoint-/Service-Mapping vorliegend; Gaps priorisiert in Folgetasks ueberfuehrt | no | Erledigt: produktnahes KI-/Route-Inventar inkl. staged-vs-direct, Contract-Status und Gap-Priorisierung dokumentiert (`docs/E150/GOV-AI-ORCH-02_ROUTE_INVENTORY_2026-03-27.md`) (`2026-03-27`); Production-Baseline-Verknuepfung ist nachgezogen (`docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`). |
| GOV-AI-ORCH-03 | done | medium | GOV-AI-ORCH-02 | Provider-/Modellstrategie je Orchester | Modellklassen/Fallbacks inkl. Unsicherheiten offenlegen | Pro Orchester dokumentierte Primar-/Fallback-Klasse + offene DPA/Residency/Kostenfragen | no | Erledigt: Betriebsbaseline je Orchester mit Primarklasse/Fallbackklasse/Failure-Mode und offenen DPA/Residency/Kosten-Risiken dokumentiert (`docs/E150/GOV-AI-ORCH-03_PROVIDER_STRATEGY_BASELINE_2026-03-27.md`) (`2026-03-27`); Production-Baseline fuer staged/exception/boundary/envelope markiert (`docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`). |
| GOV-AI-ORCH-05 | done | high | GOV-AI-ORCH-03, GOV-AI-04 | E150 Lane-Split + Journey-Defaults + sealed Factcheck Contract | Verbindliche Zwei-Lane-Architektur (`standard` vs `sealed_factcheck`) technisch in Orchestrierung/Analyze/Factcheck umsetzen | Journey-Profile + role routing sind aktiv; Standard-Lanes defaulten auf `researchUsed=none`; sealed Factcheck ist exklusiver Research-/Siegelpfad (`verificationMode=sealed`); neue Contract-Felder (`verificationMode`, `researchUsed`, `sealEligible`, `sealGranted`) sind im Antwort-Meta sichtbar; OpenAI bleibt auf `fallback` + optionalen non-mutativen `presentation_pass` begrenzt; winner-takes-all gilt explizit als Altmodell und ist im Zielrouting abgeloest; Nutzerlabels `analysiert`/`geprueft`/`verifiziert` sind contract-scharf gemappt; Tests fuer routing/fallback/contract sind gruen | no | Update (2026-04-23, Slice 1 technisch umgesetzt): neue Lane-/Journey-Bausteine unter `features/ai/e150/{journeyProfiles.ts,roleRouting.ts,factcheckProfiles.ts,verificationContract.ts,presentationPass.ts}`; `features/ai/orchestratorE150.ts` auf journey-aware Specialist-Routing mit fallback/disagreement-Meta umgestellt; `features/analyze/analyzeContribution.ts` profile-aware angebunden; Analyze-/Factcheck-Routen tragen die vier Contract-Felder und Verification-Labels; neue Tests: `apps/web/tests/e150-journey-routing.contract.test.ts`, `apps/web/tests/factcheck-enqueue.auth.route.test.ts` sowie Updates in Analyze-Tests. Integrationsstand (2026-04-24): PR `#9` (Slice 1) sowie Split-PRs `#10` (disagreement/confidence + sealed endpath), `#11` (frontend status/ui), `#12` (companion/chat/presentation_pass) und `#13` (ai-usage/admin-ops) sind auf `main` gemerged; der Integrationsstand ist damit auf `main` konsolidiert. |
| GOV-SEC-01 | done | medium | none | Secret-Hygiene, lokale Prod-URI-Risiken | Sicherheitsgrundlagen operationalisieren | Konkrete Hygiene-Regeln im Repo verankert; riskante Lokalstandards reduziert | no | Erledigt (2026-04-05): Parent-Closure nach realer Restprüfung. Spätere Hardening-Slices (`PR-ENV-01`, `PR-ENV-02A/B`, `GOV-SEC-06D`) decken Runtime-/Env-/Token-Hygiene bereits breit ab; verbleibender Secret-Rest wurde über Human-Token-Hardening geschlossen: kein stiller Production-Fallback auf statisches Default-Secret (`apps/web/src/lib/security/human-token.ts`), explizite 503-Misconfig-Antwort in `/api/security/verify-human` (`apps/web/src/app/api/security/verify-human/route.ts`), Regressionstests `apps/web/tests/human-token.security.test.ts` und `apps/web/tests/security-verify-human.route.test.ts`. Evidenz: `docs/E150/GOV-SEC-01_SECRET_HYGIENE_PARENT_CLOSURE_2026-04-05.md`. |
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
| GOV-SEC-06D | done | low | GOV-SEC-06C | `EDITOR_TOKEN` Transport-/Env-Hardening | Token-Transport und Env-Gates auf Missbrauchsresistenz pruefen und ggf. haerten | Entscheidungsfreie Hardening-Maßnahmen (z. B. strictere Env-Gates, eindeutige Header-Policy, Auditfelder) sind dokumentiert und umgesetzt, sofern ohne neue Produktentscheidung moeglich | no | Erledigt (2026-04-05): Feed-/Diag-Gate haertet `EDITOR_TOKEN`-Transport durch stricte Bearer-Header-Validierung und konfliktfreie Token-Quellen (`authorization`/`x-editor-token`/`editor_token` Cookie) in `apps/web/src/app/api/feeds/_auth.ts`; Env-Misconfig (`EDITOR_TOKEN` fehlt/leer/whitespace-gepolstert) wird bei Token-Fallback explizit als `editor_token_not_configured` signalisiert, ohne Token-Leak. Tests erweitert in `apps/web/tests/feeds-editor-token-auth.test.ts`; Evidenz: `docs/E150/GOV-SEC-06D_EDITOR_TOKEN_TRANSPORT_ENV_HARDENING_2026-04-05.md`. |
| GOV-SEC-03 | done | high | GOV-SEC-02, GOV-AI-ORCH-02, GOV-SEC-03A | Zonenmodell + High-Impact-Auditpflicht | PII/Content/AI-Zonen technisch operationalisieren | votes/core Split ist komplett freigegeben; Neo4j- und Prisma-Cross-Store-Pfade sind beide kritisch mit priorisierter Reihenfolge; direkte Providerpfade folgen Mindestcontract aus Auditfeldern, PII-Redaction und Allowlist; Restmigration bleibt schrittweise mit Review-Gate | no | Entscheidung manifestiert (2026-03-28) auf Basis von `GOV-SEC-03A/B`: votes/core komplett statt high-impact-first, Neo4j zuerst tiefer haerten und Prisma direkt danach, Mindestcontract fuer direkte Providerpfade verbindlich. Referenz: `docs/E150/GOV_DECISION_PREP_2026-03-27.md`. |
| GOV-SEC-03A | done | high | GOV-SEC-02 | Route-/Store-/Log-Zonenmatrix (Ist-Inventar) fuer PII/Content/AI/Trust | `GOV-SEC-03` von unklarer Blockade auf konkrete Umsetzungsbasis bringen | Inventarisiert sind mindestens zentrale API-Routen, relevante Stores und Audit-Logs mit Zonenklassifikation; offene/unklassifizierte Pfade explizit markiert; keine neue Security-Policy festgelegt | no | Erledigt: repo-nahe Zonenmatrix inkl. Route-/Collection-/Audit-/Provider-Mapping, gemischter Pfade und Rest-Blocker dokumentiert (`docs/E150/GOV-SEC-03A_ZONE_MATRIX_2026-03-27.md`, `2026-03-27`) |
| GOV-SEC-03B | done | medium | GOV-SEC-03A | Machine-readable Zoneninventar + Drift-Checks (Ist-Contract) | Den dokumentierten Ist-Zustand aus `GOV-SEC-03A` technisch regressionssicher machen, ohne neue Policy | Route-/Store-Zoneninventar fuer den High-impact-Subset liegt als machine-readable Contract vor; schlanke Drift-Tests schlagen bei unbeabsichtigter Zonenabweichung an; keine Scope-/Policy-Aenderung | no | Erledigt: machine-readable Inventar + Drift-Contract-Tests fuer High-impact-Pfade eingefuehrt (`docs/E150/GOV-SEC-03B_ZONE_INVENTORY_2026-03-27.json`, `apps/web/tests/gov-sec-03b.zone-inventory.test.ts`) (`2026-03-27`) |
| GOV-SAFETY-03 | done | high | GOV-SAFETY-01, GOV-SAFETY-02 | Social-Eskalation (DM/Gruppen/Kontakt) | Gestufte Freigabe-/Schutzlogik produktseitig verbindlich machen | Kein DM-/Gruppenpfad als Default; Aktivierung nur in ausdruecklich freigegebenen moderierten/kuratierten Kontexten; Oeffnung nur mit Opt-in, Verifikation/Trust-Signal, Cooldown/Rate-Limits, Abuse-/Moderations-Gates und Auditierbarkeit | no | Entscheidung manifestiert (2026-03-26): operative Startform nur moderierte/kuratierte Raeume; kein proximity-first |
| GOV-SAFETY-03A | done | high | GOV-SAFETY-03 | Social-Eskalation Policy-Resolver (Startform) | Technische Guardrails fuer die freigegebene Startform zentralisieren | Shared Resolver/Gate fuer Social-/Kontakt-Eskalation vorhanden; Default bleibt aus; Freigabe nur fuer moderierte/kuratierte Kontexte mit Opt-in + Verifikations-/Trust-Vorbedingungen | no | Erledigt: `escalationPolicy`-Resolver eingefuehrt und `match.request` standardmaessig ohne freigegebenen Kontext/Opt-in/Trust gesperrt (`2026-03-27`) |
| GOV-SAFETY-03B | done | medium | GOV-SAFETY-03A | Abuse-/Moderations-/Audit-Hardening | Sicherheits- und Nachvollziehbarkeitsanforderungen fuer Social-Eskalation absichern | Cooldown/Rate-Limits und Abuse-/Moderations-Gates fuer freigegebene Pfade aktiv; denied/allowed Ereignisse auditierbar; keine neue Produktsurface | no | Erledigt: `match.request` ist um Rate-Limit, Cooldown, Pending-Abuse-Gate und denied/allowed Audit-Logs gehaertet; Freigabemodell unveraendert (`2026-03-27`) |

### B. Anlassraum / Dossier / Swipes

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-ANLASS-01 | done | high | GOV-01 | Anlassraum-Domaenenmodell (`type/topic/scope/status/...`) | Anlassraum als tragfaehige Basisdomaene konsistent halten | Pflichtfelder durchgaengig in Read/Write-Pfaden verankert; keine Shadow-Modelle | no | Erledigt (2026-04-04): Resthärtung über readmodel-nahe Dossier-Link-State-Absicherung (`deriveAnlassraumDossierLinkState`) + Tests abgeschlossen; Anlassraum bleibt konsistenter offener Arbeits-/Kontextraum ohne Dossier-Zwang. Evidenz: `docs/E150/GOV-ANLASS-01_02_DOMAIN_LINKAGE_CLOSURE_2026-04-04.md`. |
| GOV-ANLASS-02 | done | high | GOV-ANLASS-01 | Anlassraum <-> Dossier Beziehung | Mehr-zu-eins und optionale Verdichtung ohne Defekt-Logik absichern | Anlassraum kann ohne Dossier bestehen; Dossier kann mehrere Anlassraeume referenzieren; Flows bleiben manuell kontrolliert | no | Erledigt (2026-04-04): Optionaler No-Dossier-Status ist als non-defect-Contract eingefroren; Atlas-Readmodel-Tests sichern Mehr-zu-eins-Verknüpfung (ein Dossier für mehrere Anlassräume) regressionssicher ab. Evidenz: `docs/E150/GOV-ANLASS-01_02_DOMAIN_LINKAGE_CLOSURE_2026-04-04.md`. |
| GOV-ANLASS-03 | done | medium | GOV-ANLASS-01 | Regionen/Skalen + Relevanz-Framing | Scope-/DecisionScope konsistent in Surface/Display durchziehen | Relevanz-Framing konsistent in relevanten Surfaces; Tests fuer Scope-Ableitung vorhanden/aktualisiert | no | Erledigt (2026-04-05): Scope-/DecisionScope-Relevanzframing ist als kleine Contract-/Display-Härtung vereinheitlicht. Shared Scope-Pair-Resolver (`resolveRelevanceScopePairForDisplay`) canonicalisiert Aliase und setzt `decisionScope` im Display/Readmodell defensiv auf `scope`, statt uneinheitlich in `offen` zu kippen. Anbindung in Anlassraum-Operations-Readmodel + Admin-Surfaces (`apps/web/src/features/anlassraumOperationsRead.ts`, `apps/web/src/features/anlassraumOperationsUi.tsx`, `apps/web/src/app/admin/feeds/anlassraum/page.tsx`, `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`) inkl. Regressionstests (`relevance-framing`, `anlassraum-operations-read.service`, locale/surface snapshots). Evidenz: `docs/E150/GOV-ANLASS-03_SCOPE_RELEVANCE_CLOSURE_2026-04-05.md`. |
| GOV-ANLASS-04 | done | medium | GOV-ANLASS-01 | Feed-Review Decisioning | Leerlauf vermeiden, manuelle Decisioning-Pfade sichtbar halten | Queue-Decision-Pfade transparent; Attach priorisiert bei bestehender Zuordnung; kein Auto-Publish | no | Erledigt (2026-04-05): Decisioning-Pfade und Status-Transitions sind als read-only/review-first Contract eingefroren. Attach-first bei bestehender Zuordnung bleibt aktiv (`pathFromFeedReviewAction` + `applyFeedReviewAction`), Queue-/Surface-Komposition bleibt explizit (`features/feeds/anlassraumSurfaceComposition.ts`, `apps/web/src/app/api/admin/feeds/drafts/route.ts`), und manuelle Statuswechsel halten `feedReviewState` konsistent inkl. Audit-Sichtbarkeit (`apps/web/src/app/api/admin/feeds/drafts/[id]/status/route.ts`, `apps/web/src/app/admin/feeds/drafts/[id]/page.tsx`) ohne Auto-Publish. Evidenz: `docs/E150/GOV-ANLASS-04_DECISIONING_CLOSURE_2026-04-05.md`. |
| GOV-ANLASS-08 | done | medium | GOV-ANLASS-04, GOV-SAFETY-03 | Community-Research mit Factcheck-/Truth-Guardrails | Research-Workflow sicher mit Anlassraum-/Review-Logik koppeln | Klarer Flow von Research-Hinweisen zu reviewbaren Kontextobjekten; keine ungeprueften Publish-/Social-Bypasses | no | Erledigt (2026-04-05): Parent-Closure nach Restprüfung. `GOV-ANLASS-08A/08B/08C` decken den Hardening-Scope vollständig ab: Inventar/Anschluss ist dokumentiert, Safety-Startform-Contract bleibt in Research-/Review-Routen sichtbar (`/api/research/tasks/list`, `/api/research/tasks/[id]`, `/api/research/tasks/[id]/contribute`, `/api/admin/research/contributions/status`), kontaktseitige Eskalationsfelder werden im Submit nicht als Bypass wirksam, und Admin-Review bleibt gate-geschützt. Verbleibende Themen sind nur zukünftiger Community-Flow-Ausbau außerhalb dieses Parent-Slices. Evidenz: `docs/E150/GOV-ANLASS-08_PARENT_CLOSURE_2026-04-05.md`. |
| GOV-ANLASS-08A | done | medium | GOV-ANLASS-04 | Community-Research -> Review/Anlassraum Inventar | Nicht-entscheidungsbehaftete Ist-Inventarisierung der aktuellen Research-/Review-Pfade erstellen | Part09/Part16 enthalten ein kompaktes Mapping der vorhandenen Surfaces/Endpoints/Guardrails; offene Punkte mit Decision-Boundary sind explizit als abh. von `GOV-SAFETY-03` markiert; keine Produktregeln veraendert | no | Erledigt: Ist-Mapping in `docs/E150/Part09_Community_Research_Workflow.md` (Abschnitt 1.1) und `docs/E150/Part16.md` (Abschnitt H) aufgenommen (`2026-03-26`) |
| GOV-ANLASS-08B | done | medium | GOV-ANLASS-08, GOV-SAFETY-03A | Community-Research -> Review Anschluss mit Safety-Startform | Research-nahe Anschlusslogik an die entschiedene Social-Safety-Startform anbinden | Research/Review-Dokumentation und Contracts referenzieren nur moderierte/kuratierte Startkontexte; kein DM-/Gruppen-Default; keine unkontrollierte Kontaktfreigabe | no | Erledigt: Research-APIs/Admin-Review tragen den Safety-Startform-Contract explizit in Response/Logs; Research-Surface weist den kontaktseitigen Guardrail aus (`2026-03-27`) |
| GOV-ANLASS-08C | done | medium | GOV-ANLASS-08B | Research-Factcheck Guardrail Contract-Tests | Bereits entschiedene Guardrails ueber Research-/Review-Routen regressionssicher machen | Tests verifizieren fuer Research-Endpoints: kein unkontrollierter Kontakt-/Publish-Bypass, Safety-Contract bleibt sichtbar; bestehendes Verhalten bleibt unveraendert | no | Erledigt: Research-Submit ignoriert kontaktbezogene Payload-Felder weiterhin, Admin-Review-Status bleibt gate-geschuetzt ohne Query-Bypass, und Research-/Review-Responses tragen den Safety-Startform-Contract konsistent (`2026-03-27`) |
| GOV-EVENT-01 | done | medium | GOV-ANLASS-01 | Event-/Sitzungsmodell | Event-Kontext sauber mit Anlassraum verknuepfen | Event-Flow referenziert/erstellt Anlassraum stabil; no-auto-publish bleibt intakt | no | Erledigt (2026-04-05): Event->Anlassraum-Verknuepfung ist kontraktnah gehaertet (`apps/web/src/app/api/events/route.ts`) mit expliziter Existing-Link-Validierung (`anlassraum_not_found`) und Konfliktblockade fuer gleichzeitiges Referenzieren+Erzeugen (`anlassraum_link_conflict`). Event-Insert bleibt manual-first (`protocolStatus: planned`, kein Auto-Publish-Pfad). Regressionstests: `apps/web/tests/events.route.test.ts` + bestehende `apps/web/tests/gov-event-02.routes.test.ts`. Evidenz: `docs/E150/GOV-EVENT-01_EVENT_ANLASSRAUM_LINKAGE_CLOSURE_2026-04-05.md`. |
| DOCS-HARM-06 | done | medium | DOMAIN-HARM-01 | Anlassraum(`/runden`) vs Dossier vs Swipes Wording | Docs entlang Ist-Code ohne Overreach harmonisieren | Keine harte Fehlkanonisierung; konditionales Finalize-Routing konsistent dokumentiert; Option-B-Entscheid (`/runden` bleibt, `/anlassraum` als Alias-Zielrichtung ohne harte Migration) in den betroffenen Parts konsistent | no | Erledigt: Option-B-Wording in Part05, Part14, Part16_AI und create-intake auf denselben Surface-Kanon harmonisiert; `/runden` bleibt aktive Public-Surface, `/anlassraum` ist als non-breaking Alias-Wrapper eingefuehrt (`2026-03-27`) |
| DOMAIN-HARM-01 | done | high | GOV-AI-ORCH-02 | Oeffentliche Benennung `/runden` vs dedizierte Anlassraum-Route | Surface-Kanon klar entscheiden | Produktentscheidung dokumentiert; daraus abgeleitete Folge-Tasks erzeugt | no | Entscheidung manifestiert (2026-03-27): Option B. `/runden` bleibt kanonische oeffentliche Surface, `/anlassraum` ist offizieller Alias-/Zielbegriff ohne harte Migration/Umbenennung im Ist-Stand |
| DOMAIN-HARM-01A | done | medium | DOCS-HARM-06 | Surface-/Routing-Ist-Matrix fuer Anlassraum-Benennung | Entscheidungsgrundlage fuer `/runden` vs dedizierte Anlassraum-Route erzeugen, ohne Umbenennung umzusetzen | Matrix zeigt aktuelle oeffentliche Entry-Points, Redirects, Labels und Querverweise (`/runden`, `/swipes`, `/dossier`); konkrete Aenderungsorte pro Option sind dokumentiert; keine Route-Umbenennung und keine neue Surface-Logik | no | Erledigt: Ist-Matrix inkl. Wrapper-/Redirect-Kette, Wording-Inventar und Option-A/B/C-Aenderungsorte dokumentiert (`docs/E150/DOMAIN-HARM-01A_SURFACE_ROUTING_MATRIX_2026-03-27.md`, `2026-03-27`) |
| DOMAIN-HARM-01B | done | medium | DOMAIN-HARM-01 | Alias-Vorbereitung `/anlassraum` (ohne Migration) | Non-breaking Alias-Pfad als spaeteren technischen Slice klar vorbereiten | Konkreter Technik-Slice fuer offiziellen Alias definiert (Wrapper/Redirect auf `/runden`, Route-Inventar-Update, Paritaets-Tests); keine Umbenennung bestehender `/runden`-Links; keine harte Migration | no | Erledigt: oeffentliche Alias-Route `/anlassraum` als Redirect-Wrapper auf `/runden` eingefuehrt; Query-Paritaet und Wrapper-Verhalten testseitig abgesichert; Routeninventar + Surface-Doku aktualisiert (`2026-03-27`) |
| DOMAIN-HARM-01C | needs_decision | low | DOMAIN-HARM-01B | Harte Migration auf `/anlassraum` | Nur bei spaeterem expliziten Migrationsentscheid von Alias auf kanonische Route wechseln | Expliziter Migrationsentscheid inkl. Redirect-/Backlink-/SEO-Policy liegt vor; danach erst Umsetzungsslices | yes | Bewusst offen gelassen; kein stilles Vorziehen der Migration |
| PR-0042 | done | medium | UX-HARM-01 | Swipes Kontextpfade | Thematischen Rueckweg in Swipes robust und inkonsistenzfrei machen | Kontextlink nur bei belastbarer Datenlage; keine erfundenen Ziele; Tests fuer Resolver/Anzeige | no | Hardening aktiv in `arrival.ts` (allowlist/create+anlassraumId) + Tests `swipes-arrival.helpers.test.ts` |
| PR-0043 | done | medium | PR-0042 | Swipes Mobile Gestures + Bottom-Actions | Mobile Bedienbarkeit verbessern ohne IA-Drift | Thumb-reachable Actions mit bestehender Logik kompatibel; keine neue Produktregel | no | Erledigt (2026-04-04): mobile Bottom-Actions in `/swipes` auf klare Primär-/Sekundärstruktur mit größeren Touch-Targets gehärtet; Gestenentscheidung als shared Contract (`resolveSwipeGestureDecision`) eingeführt und gegen vertikale Fehleingaben abgesichert, ohne Ranking-/Weighting-/Exclude-Logik zu ändern. Evidenz: `docs/E150/PR-0043_SWIPES_MOBILE_GESTURES_BOTTOM_ACTIONS_2026-04-04.md`. |
| PR-0044 | done | medium | UX-HARM-01 | Swipes Varianten-Schritt (Ranking/Weighting/Exclude) | Bewertungslogik fachlich mit transparenter lokaler Variantenaggregation freigeben | `variantWeight` und `variantRankedIds` duerfen in transparenten, reviewbaren Aggregaten auf Statement-/Eventuality-Ebene wirken; keine automatische Wahrheits-/Prioritaets-/Publish-/Feed-/Atlas-/Reichweitenlogik | no | Erledigt (2026-04-05): Fachentscheidung auf transparente lokale Aggregation festgezogen; technischer Follow-up `PR-0044B` umgesetzt (Admin-Summary-Readmodel + Surface-Hinweis), ohne Scope-Drift in Feed/Atlas/Publish/Governance. Evidenz: `docs/E150/PR-0044B_SWIPES_TRANSPARENT_VARIANT_AGGREGATION_2026-04-05.md`. |
| PR-0044A | done | low | PR-0044 | Swipes Varianten-Contract-Prep (entscheidungsfrei) | Variantenauswahl technisch stabilisieren, ohne fachliche Weighting-/Ranking-Policy vorwegzunehmen | Typed Normalizer entfernt widerspruechliche Variantendaten (dedupe, exclude-vs-selected), haertet `variantWeight`/`variantReason` gegen invalide Eingaben und bleibt ohne neue Ranking-/Prioritaetslogik; Tests vorhanden | no | Erledigt (2026-04-04): `features/swipes/variantSelectionContract.ts` in Vote-Persistenz angebunden (`features/swipes/service.ts`), inkl. Contract-Tests `apps/web/tests/swipes-variant-selection-contract.test.ts`; Evidenz: `docs/E150/PR-0044A_SWIPES_VARIANT_CONTRACT_PREP_2026-04-04.md`. |
| PR-0044B | done | low | PR-0044A | Swipes transparente Variantenaggregation (lokal) | Statement-/Eventuality-nahe Aggregation fuer Variantenselektion sichtbar und testbar machen, ohne globale Machtlogik | Aggregation zeigt nur lokale, erklaerbare Kennzahlen (`selectedCount`, `weightedScore`, `rankedMentions`, `averageRank`) auf Admin-Summary-Ebene; keine automatische Wirkung auf Feed-/Atlas-/Publish-/Governance-Priorisierung; Tests frieren Aggregatverhalten defensiv ein | no | Erledigt (2026-04-05): neues Readmodel `features/swipes/variantAggregationReadModel.ts`, Anbindung in `api/admin/swipes/summary` und additive Anzeige in `app/admin/swipes/page.tsx`; Tests `apps/web/tests/swipes-variant-aggregation-readmodel.test.ts`; Evidenz: `docs/E150/PR-0044B_SWIPES_TRANSPARENT_VARIANT_AGGREGATION_2026-04-05.md`. |
| PR-0045 | done | low | UX-HARM-01 | Swipes UX-Dedupe | Redundante Vertiefungen entfernen | Keine doppelte Guidance/CTAs; bestehende Flows bleiben funktional gleich | no | Erledigt: redundante Arrival-Guidance in Swipes reduziert, ohne Routing-/Flow-Änderung (`2026-03-26`) |
| PR-RUNDEN-OPS-02 | done | high | GOV-AI-03C, GOV-CIVIC-04 | `/runden` als operative Arbeitsflaeche (Quick Actions, QR-Gates, Inline-Beitrag) | Laufende Anlassarbeit in `/runden` direkt ausfuehrbar machen und Rollen-/Ownership-Grenzen klar halten | Rollenabhaengige Quick Actions (`manager`/`participant`) sind sichtbar; QR-/Share-Aktionen erscheinen nur fuer berechtigte Rollen oder Ownership; Inline-`Beitrag verfassen` ist im Anlasskontext eingebunden; Empty State fuehrt auf naechste sinnvolle Handlung statt Leerlauf; `/create` bleibt Start-/Analyseflaeche ohne Doppelwahrheit | no | Erledigt (2026-04-13): operative `/runden`-Härtung in `apps/web/src/app/runden/page.tsx` + Ownership-Felder im Entry-Contract (`features/topicRound/entrySource.ts`), inkl. aktualisierter Acceptance-/Service-Tests `apps/web/tests/{runden-page.acceptance.test.ts,runden-entry.service.test.ts}` und Evidenz `docs/E150/PR-RUNDEN-OPS-02_RUNDEN_OPERATIVE_WORKSURFACE_2026-04-13.md`. |
| PR-RUNDEN-OPS-03 | done | high | PR-RUNDEN-OPS-02 | `/create` <-> `/runden` Flow-Verzahnung (kontextgebundener Beitragspfad, Rueckkehrpfad, Empty-State-Hierarchie) | Startflaeche (`/create`) und laufende Arbeitsflaeche (`/runden`) enger als zusammenhaengende Produktkette fuehren, ohne Rollenvermischung | `/runden`-Beitragsstarts uebergeben Anlasskontext (`source=runden`, `reason`, `entryIntent`, `anlassraumId`, `returnTo`) stabil nach `/create`; `/create` zeigt den laufenden-Runden-Kontext sichtbar und nutzt kontextwahrenden Finalize-Fallback auf `/runden` statt blindem Kontextverlust; Empty State in `/runden` ist als 3-Schritte-Arbeitsstart mit klarer Primär-/Sekundärhierarchie strukturiert; QR-Gating bleibt aktiv und wird freundlich erklärt; Surface-Contract (`/create` = Erfassung/Analyse/Routing, `/runden` = laufende Arbeit) bleibt erhalten | no | Erledigt (2026-04-13): Verzahnung in `apps/web/src/app/{runden/page.tsx,create/page.tsx,create/CreateClient.tsx}` und Redirect-Fallback-Contract in `apps/web/src/features/create/finalizeRedirect.ts`; Finalize-Followup-Messaging in `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`; Tests erweitert: `apps/web/tests/{runden-page.acceptance.test.ts,create-mode.page.test.ts,create-analyze.workspace-ui.test.ts}`; Evidenz `docs/E150/PR-RUNDEN-OPS-03_CREATE_RUNDEN_FLOW_TIGHTENING_2026-04-13.md`. |
| PR-RUNDEN-OPS-04 | done | high | PR-RUNDEN-OPS-03 | `/runden` enttechnisieren + Demo-/Erklaerseite fuer Anlassraum/QR/Teilnahmelogik | `/runden` als wirkungsorientierte Arbeitsflaeche formulieren (statt Route-Sprache) und Anlassraum-/QR-/Beitragslogik ueber eine kleine Produkt-Demo-Seite sofort verstaendlich machen | Hero, Startkarten und Empty State in `/runden` nutzen keine URL-/Routenprosa mehr und erklaeren Anlass-/Arbeitsstand-Nutzen; QR wird als Teilnahmewerkzeug (nicht als Technikfeature) inkl. freundlichem Gating-Hinweis dargestellt; `/create`-Leitstruktur bleibt frei, aber sprachlich an Anlass-/Beitragslogik angeschlossen; neue Seite `/runden/demo` erklaert den 3-Schritte-Fluss (Anlass oeffnen -> QR/Link teilen -> Beitraege geordnet buendeln) inkl. Folgebild (Arbeitsstand/Dossier/Nachverfolgung); CTA-Verknuepfung zwischen `/runden` und `/runden/demo` ist vorhanden und testbar | no | Erledigt (2026-04-13): UX-/Copy-Enttechnisierung in `apps/web/src/app/runden/page.tsx` und `apps/web/src/app/runden/RundenShareActions.tsx`; sprachliche Anschlusskorrektur in `apps/web/src/app/create/CreateClient.tsx`; neue Demo-Route `apps/web/src/app/runden/demo/page.tsx`; Tests aktualisiert/ergänzt: `apps/web/tests/runden-page.acceptance.test.ts`, `apps/web/tests/runden-demo.page.contract.test.tsx`; Evidenz `docs/E150/PR-RUNDEN-OPS-04_RUNDEN_DETECHNIFIED_UX_DEMO_2026-04-13.md`. |
| PR-CREATE-MODES-01 | done | high | PR-RUNDEN-OPS-03, GOV-AI-04D | `/create` Drei-Modus-Intake + enttechnisierte KI-Orchestrierung | `/create` wieder als ruhige Startfläche mit klaren Nutzungsmodi führen und Analyse-/Fallback-Drift reduzieren | Erstansicht zeigt nur Moduswahl + ein Primär-Textfeld + mode-spezifische CTA; keine sichtbaren internen Query-/Intent-Codes; Folgeflächen erst nach bewusstem Start; Modi `Beitragen` / `Prüfen` / `Entwerfen` sind intern stabil auf Orchestrierungs-Hints gemappt; Analyze-Route übernimmt `analysisMode` defensiv; Null-Felder aus KI-Antworten brechen Analyze-Schema nicht | no | Erledigt (2026-04-17): Guided-Modus hat jetzt einen eigenen iterativen Startschritt (erste Rückfrage + bewusste Bestätigung) vor dem Workspace (`apps/web/src/app/create/CreateClient.tsx`); create-nahe Folgefläche in `AnalyzeWorkspace` wurde für Single-Button-Entry enttechnisiert (keine Roh-IDs/Match-Typen/Intent-Leaks), inklusive sichtbarem Source-Grounding-Hinweis und fallback-klarer Info (`apps/web/src/components/analyze/AnalyzeWorkspace.tsx`, `apps/web/src/features/create/analyzeEnvelope.ts`); Startseiten-nahe Composer-Maske (Headline, großes Primärfeld, Anhang+Sprachnachricht) ist als shared Kernfläche für `/create` und `/demo/create` vereinheitlicht (`apps/web/src/features/create/SharedCreateComposer.tsx`, `apps/web/src/app/{create/CreateClient.tsx,demo/create/DemoCreateClient.tsx}`, `apps/web/src/features/create/createSurfaceConfig.ts`); Tests für Modusvertrag und Surface-Parität aktualisiert (`apps/web/tests/{create-mode.page.test.ts,create-mode-selector.contract.test.ts,create-orchestration-mode-mapping.contract.test.ts,demo-create.page.contract.test.ts,no-duplicate-primary-worksurface-on-create.test.ts}`). Evidenz: `docs/E150/PR-CREATE-MODES-01_CREATE_MODE_SPLIT_HARDENING_2026-04-14.md`. |
| PR-I18N-CREATE-02 | done | high | PR-CREATE-MODES-01 | `/create` + `/demo/create` locale-hardening (DE/EN) inkl. Entry-/Followup-Konsistenz | Gemischte Locale-Reste auf der Create-Surface entfernen und alle zentralen UI-Texte aus einer kanonischen i18n-Quelle speisen | Headline/Mode-Switch/Helper/Placeholder/CTA/Anchors/Helper-Links und Guided-/Runden-Followup-Texte sind in DE+EN konsistent; EN zeigt keine zentralen DE-Reste; Gradient-Headline bleibt in beiden Locales sauber; Demo/Create teilen denselben locale-faehigen Surface-Contract; i18n-Render-/Contract-Tests sind gruen | no | Erledigt (2026-04-18): locale-SSOT fuer Create-Surface in `apps/web/src/features/create/createSurfaceConfig.ts` erweitert (Mode-/Anchor-/Helper-/Composer-/Followup-Bundles de/en) und in `/create`/`/demo/create` angebunden (`apps/web/src/app/{create/CreateClient.tsx,demo/create/DemoCreateClient.tsx}`, `apps/web/src/features/create/SharedCreateComposer.tsx`); Guided-Workspace-Prefix locale-faehig gemacht (`buildGuidedWorkspaceText`); Demo-Contract-Test mit `LocaleProvider` stabilisiert (`apps/web/tests/demo-create.page.contract.test.ts`); neue/erweiterte Tests: `apps/web/tests/{create-i18n.contract.test.ts,create-entry-i18n.render.test.tsx,create-mode-i18n.contract.test.ts,create-followup-i18n.contract.test.ts,no-de-strings-when-en-active-on-create.test.tsx,gradient-headline-i18n.render.test.tsx,analyze-workbench-hidden-until-start.test.ts}`. Evidenz: `docs/E150/PR-I18N-CREATE-02_CREATE_BILINGUAL_SURFACE_HARDENING_2026-04-18.md`. |
| PR-PRODUCT-SURFACES-HARM-01 | done | high | PR-I18N-CREATE-02, PR-PRICING-ABC-02, PR-RUNDEN-OPS-04 | Finaler UX-/Copy-/Hierarchy-Schluss fuer `/create`, `/pricing`, `/vormerken`, `/runden` | Vier Kernflaechen entlang derselben sichtbaren Produktlogik final harmonisieren (Beitragen/Pruefen/Entwerfen), Altbegriffe reduzieren und Interface-Konkurrenz beruhigen | `/create` wirkt als klarer Arbeitsstart (ein Feld + drei Modi, reduzierte Chips/Hilfelinks, modusscharfe CTA); `/pricing` zeigt sichtbar drei B2C-Kernpakete als Hauptwelt mit create-nahem Verb-Brueckenschritt; `/vormerken` nutzt dieselbe Paketwelt inkl. klarer Folge-/Freischaltungslogik; `/runden` spricht produktisch als Anlassraum-Arbeitsflaeche inkl. Teilnahme-via-Link/QR-Sprache; DE/EN bleiben konsistent ohne Mischlocale; Contract-Tests decken Hierarchie/Chip-Last/I18N/Package-SSOT/Legacy-Namen sowie Runden-Arbeits-/QR-Sprache ab | no | Erledigt (2026-04-18): Finalharmonisierung in `apps/web/src/{features/create/createSurfaceConfig.ts,features/create/SharedCreateComposer.tsx,app/create/CreateClient.tsx,app/pricing/page.tsx,app/runden/page.tsx,app/runden/RundenShareActions.tsx}` sowie Pricing/Vormerken-SSOT-Copy in `features/pricing/domain/{plans.de.ts,plans.en.ts,content.de.ts}`; aktualisierte und neue Contracts: `apps/web/tests/{runden-page.acceptance.test.ts,create-entry-hierarchy.contract.test.tsx,create-no-chip-overload.contract.test.tsx,create-i18n-no-mixed-locale.contract.test.tsx,pricing-package-logic-aligned-with-create.contract.test.tsx,vormerken-package-logic-aligned-with-pricing.contract.test.tsx,no-legacy-user-facing-package-names.contract.test.tsx,runden-working-surface-copy.contract.test.ts,runden-qr-participation-language.contract.test.tsx}`; Evidenz: `docs/E150/PR-PRODUCT-SURFACES-HARM-01_FINAL_UX_COPY_HIERARCHY_CLOSURE_2026-04-18.md`. |

### C. Docs Harmonization / Backlog Hygiene

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DOCS-HARM-01 | done | medium | GOV-SEC-03 | Part00 an Mapping-Logik angleichen | Part00 konsistent zu Part01-16 und OpenTasks ausrichten | Querverweise PII/Auth/Telemetry konsistent; keine widerspruechlichen Kanonsaetze | no | Part00 um Mapping-/Querverweis- und ENV-Alias-Abschnitt erweitert (`2026-03-26`) |
| DOCS-HARM-02 | done | low | none | Formatdrift in fruehen Parts | Lesbarkeit/Struktur harmonisieren ohne Inhaltsumbau | Uneinheitliche Listen/Alt-Codebloecke bereinigt; inhaltliche Aussagen unveraendert | no | Erledigt: fruehe Part-Formatdrift in Part00/Part02/Part03 bereinigt (Listen/Codeblock-Konsistenz, keine Inhaltsaenderung) (`2026-03-26`) |
| DOCS-HARM-03 | done | low | none | `ROUTES.generated.*` Runbook-Klarstellung | Manuelle Drift bei Generated-Artefakten verhindern | Artefakte klar als read-only dokumentiert; Runbook-Hinweis vorhanden | no | Erledigt: Generator-Preamble + Runbook-Hinweis in Surface-Architektur dokumentiert (`2026-03-26`) |
| DOCS-HARM-04 | done | medium | GOV-AI-ORCH-02 | Glossar `Registry/Review/Operator/Demo/Beteiligung` | Begriffe zentralisieren und verlinken | Kurzglossar in Part01/Part16 + OpenTasks referenziert; Begriffsdrift reduziert | no | Erledigt: Kurzglossar in Part01 ergänzt und in Part16 abgeglichen (`Registry/Review/Operator/Demo/Beteiligung`), inkl. Querverweise auf SSOT/Detaillogik (`2026-03-27`) |
| DOCS-HARM-05 | done | low | none | `ORPHAN_FEATURES` + `E150_NEEDS_REVIEW` Hygiene-Board | Operative Follow-up-Pfade sichtbar halten | Part15/OpenTasks-Verlinkung konsistent; offene Punkte klar einsortiert | no | Erledigt: Hygiene-/Evidenzrollen in `ORPHAN_FEATURES_VPM25.md` und `E150_NEEDS_REVIEW.md` klar markiert, Part15-Referenz ergänzt, SSOT-Grenze dokumentiert (`2026-03-26`) |
| UX-COPY-HARM-01 | done | medium | UX-HARM-01 | Frontend-Umlaute (`ä/ö/ü/ß`) in Legacy-Copy | Schreibweise im UI vereinheitlichen | Keine `ae/oe/ue`-Ersatzformen in neuen/angepassten UI-Texten; technische Bezeichner unveraendert | no | Erledigt (2026-04-05): verbleibende user-facing Legacy-Copy in Community-, Create- und Admin-Surfaces auf echte Umlaute/`ß` gehärtet (u. a. `community/page.tsx`, `features/create/*`, `features/i18n/contentTranslations.ts`, `app/admin/**` inkl. Access/Reports/Graph/Factcheck/Pilot/Attach-Drafts). Keine API-/ID-/Routing-Umbenennung; technische Identifier wie `anlassraum_oeffnen`, `perspektive_anhaengen`, `verfuegbar` oder Regex-/Stopword-Token blieben unverändert. Evidenz: `docs/E150/UX-COPY-HARM-01_FRONTEND_UMLAUT_CLOSURE_2026-04-05.md`. |
| UX-COPY-HARM-02 | done | low | UX-COPY-HARM-01 | Admin-Feeds Copy-Migration (Umlaute) | Verbleibende `ae/oe/ue`-Ersatzformen in klar begrenzten Admin-Feeds-Surfaces auf echte Umlaute umstellen | Nur user-facing Copy in `admin/feeds`-Surfaces angepasst; keine API-/ID-/Routing-Aenderung; bestehende Page-Tests fuer Feed-Drafts bleiben grün | no | Erledigt: Admin-Feeds Detail-Copy auf konsistente deutsche Schreibweise mit Umlauten geschärft; technische Bezeichner unveraendert (`2026-03-26`) |

### D. Community / Feeds / UX / Env

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR-0041-GROUP-SURFACE | done | medium | none | Community Group Surface Entkopplung | Read-Resolver/Route/Page-Kontrakte stabilisieren | Kein Demo-Fallback; Invalid/Unavailable sauber; read-only Guardrails intakt | no | Erledigt (2026-04-05): Contract-Paritaet fuer Resolver/Route/Page verifiziert; produktive Group-/Discovery-Reads bleiben read-only, Invalid/Unavailable sind explizit getrennt, und Demo-Fallback bleibt ausgeschlossen. Regressionen ueber bestehende Tests `community-groups.*`, `community-page.states.test.ts`, `community-readonly-boundary.test.ts`, `community-groups.no-demo-fallback.test.ts` eingefroren. Evidenz: `docs/E150/PR-0041_GROUP_SURFACE_DEEP_LINKS_CLOSURE_2026-04-05.md`. |
| PR-0041-DEEP-LINKS | done | medium | PR-0041-GROUP-SURFACE | Community Deep-Link Contracts | Alias-Normalisierung und Canonical-Hrefs konsistent halten | Gleiche Param-Validierung in Resolver/Route/Page; Invalid-States stabil | no | Erledigt (2026-04-05): Shared Deep-Link-Contract bleibt kanonisch in Route/Page/Resolver angebunden; Alias-Normalisierung (`communityKey/topic/dossier/region/reason`) und Canonical-Href-Building (`group/topicKey/dossierId/regionLabel/reasonLabel`) sind konsistent und testseitig abgesichert. Evidenz: `docs/E150/PR-0041_GROUP_SURFACE_DEEP_LINKS_CLOSURE_2026-04-05.md`. |
| PR-FEED-ANLASS-04 | done | medium | GOV-ANLASS-04 | Feed/Anlassraum Status-Transitions | Decisioning/Statuspfade robust machen | Transitionen nachvollziehbar; Fehler-/Audit-Sichtbarkeit stabil; keine Auto-Publish-Wege | no | Erledigt (2026-04-05): Entscheidungs-/Statuspfade sind kontraktnah abgeschlossen und testseitig eingefroren (`feed-signal-decisioning`, `feed-review.routes`, `feed-drafts.route`, `feed-backfill.service`, `feed-draft-status.route`, `feed-anlassraum-surface-composition`). Keine stillen Statusspruenge; kein Auto-Publish-Pfad. Evidenz: `docs/E150/GOV-ANLASS-04_DECISIONING_CLOSURE_2026-04-05.md`. |
| PR-FEED-ANLASS-06-BACKFILL | done | medium | PR-FEED-ANLASS-04 | Feed/Anlassraum Legacy-Backfill | Legacy-Remediation reproduzierbar und auditierbar halten | Detection + per-Item Backfill stabil; keine Silent-Migration; Auditfelder sichtbar | no | Erledigt (2026-04-05): Legacy-Remediation-Track ist kontraktnah abgeschlossen. Detection bleibt reproduzierbar (`GET /api/admin/feeds/drafts/legacy` lehnt invalide `status`-/`reviewState`-Filter explizit mit `400` ab), Backfill bleibt per Item und explizit (`POST /api/admin/feeds/drafts/[id]/backfill`), Audit-/Statussichtbarkeit (`lastReviewAction*`, `reviewNote`, `feedReviewState`) bleibt intakt; keine Silent-Migration/Fake-Success. Evidenz: `docs/E150/PR-FEED-ANLASS-06_BACKFILL_CLOSURE_2026-04-05.md`. |
| PR-0046 | done | low | none | UI-Konsistenz Light/Dark | Offene visuelle Inkonsistenzen in definierten Surfaces bereinigen | Regressionsliste abgearbeitet; keine neuen Theme-Brueche in betroffenen Admin-Surfaces | no | Erledigt: konsistente Link-/Action-Tokens und Dark-Varianten in Admin-Feeds-Surfaces (`admin/feeds`, `admin/feeds/drafts`, `admin/feeds/drafts/[id]`) ohne Verhaltensaenderung (`2026-03-26`) |
| PR-0047 | done | low | PR-0046 | Account Dark-Mode Nacharbeit | Account-Komponenten auf Token-/Theme-Konsistenz bringen | Token-Check abgeschlossen; Dark-Mode auf Account-Surfaces konsistent | no | Erledigt (2026-04-05): verbleibende Account-Theme-Drifts in `apps/web/src/app/account/AccountClient.tsx`, `apps/web/src/app/account/payment/PaymentProfileForm.tsx`, `apps/web/src/app/account/payment/MicroTransferVerificationForm.tsx` und `apps/web/src/app/account/security/page.tsx` auf Token-/Dark-Mode-Parität gehärtet (Focus-Rings, Status-Badges, Success/Error-Messages, ausgewählte Selection-States). Keine Routing-/API-/Contract-/Verhaltensänderung. Evidenz: `docs/E150/PR-0047_ACCOUNT_DARK_MODE_CLOSURE_2026-04-05.md`. |
| VOG-SITE-P0-03 | done | high | none | Public Surface `/howtoworks/edebatte`, Site-Nav-Copy | \"So funktioniert’s\" als ruhige, mobile-first RePro-Nutzerreise ausrichten | Oeffentliche Seite stellt den Ablauf klar als `Check -> Dossier -> Beteiligung -> Status` dar; VoiceOpenGov ist als Initiative und eDebatte als Werkzeug getrennt erklaert; Rollenanker fuer bestehende Deep-Links (`#rolle-buerger`, `#rolle-vereine`, `#rolle-verwaltung`) bleiben erreichbar | no | Erledigt: Seite auf nutzernahe RePro-Nutzerreise umgestellt, Navigation-Copy harmonisiert (`So funktioniert’s`), keine Routing- oder Produktlogik geaendert (`2026-03-27`) |
| PR-ENV-01 | done | medium | GOV-SEC-01 | Env-Key-Hardening | Runtime-Aliasse und Key-Nutzung absichern | Alias-Drift reduziert; riskante Key-Fallbacks dokumentiert/abgesichert | no | Runtime-Mongo-Alias-Resolver eingefuehrt und in Stores/Ping angebunden; Tests aktiv (`2026-03-26`) |
| PR-ENV-02 | done | medium | PR-ENV-01 | Mongo SRV `ECONNREFUSED` Hardening | Netz-/DNS-/Config-Fallback robuster machen | Belastbares Fehlerbild + Fallback-Strategie nach ENV-Hardening umgesetzt | no | Erledigt (2026-04-05): Nach `PR-ENV-02A` (shared Runtime-Fehlerklassifikation in `mongoPing` + `draftStore`) und `PR-ENV-02B` (Ping-/Health-Parität) ist im aktuellen GitHub-Stand keine weitere reale Mongo-/Runtime-/Connectivity-Drift innerhalb des ENV-Scope belastbar nachweisbar. Health-/Ping-/Store-nahe Referenzpfade reagieren konsistent über die bestehende Runtime-Klassifikation; keine Fake-Success-Simulation. Evidenz: `docs/E150/PR-ENV-02_PARENT_CLOSURE_2026-04-05.md`. |
| PR-ENV-02A | done | medium | PR-ENV-01 | Mongo Runtime-Fehlerklassifikation + Tests | SRV/DNS/Connection-Fehlerbilder in Runtime-Pfaden deterministisch klassifizieren und testbar machen | Shared Fehlerklassifikation fuer Mongo-Runtimepfade eingefuehrt; mindestens `mongoPing` + ein Store-Pfad nutzen sie; Tests decken SRV/DNS/`ECONNREFUSED`-Faelle ab; keine neue Produkt- oder Routinglogik | no | Erledigt: shared Klassifikation (`runtimeMongoErrors`) in `mongoPing` + `draftStore` angebunden; Runtime-Tests fuer SRV/DNS/ECONNREFUSED ergänzt (`2026-03-26`) |
| PR-ENV-02B | done | medium | PR-ENV-02A | Runtime Ping-/Health-Paritaet fuer Mongo-Connectivity | Admin-/Health-Runtimepfade konsistent an shared Mongo-Fehlerklassifikation binden | `/api/admin/system/ping` nutzt `mongoPing` statt store-spezifischer Query-Probes und gibt bei Fehlern klassifizierte `mongoRuntime`-Felder aus; `/api/health/mongo` liefert deterministische `mongo_runtime_failure`-Antworten mit klassifizierter Ursache (`srv`/`dns`/`conn_refused`), ohne Fake-OKs; gezielte Route-Tests vorhanden | no | Erledigt: Ping-/Health-Routen an shared Runtime-Klassifikation gebunden; neue Tests `admin-system-ping.route.test.ts` + `health-mongo.route.test.ts`; Evidenz: `docs/E150/PR-ENV-02B_MONGO_RUNTIME_PING_PARITY_2026-04-04.md`. |

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
| GOV-ORG-02 | done | medium | GOV-ORG-01 | Org-/Publisher-/Redaktions-/Team-Kontext als Arbeits-/Traegerlogik | Org-/Publisher-/Team-Zuordnung kontraktnah an Anlassraum/Dossier/Companion anbinden, ohne Sondermacht | Typed Org-/Publisher-/Team-Context-Contract ist aktiv; Thema/Region bleibt getrennt; keine Wahrheits-/Prioritaets-/Voting-/Faktenstatus-Aufwertung durch Org-/Publisher-/Team-Zuordnung; route-nahe Meta-Ausgabe und Konsistenzcheck sind vorhanden | no | Erledigt (2026-04-03): shared Contract `features/anlassraum/orgPublisherTeamContextContract.ts` inkl. Guardrails/Consistency-Validator; route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (`meta.orgPublisherTeamContext`, `meta.orgPublisherTeamContextConsistency`); Tests in `apps/web/tests/org-publisher-team-context-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-ORG-02_ORG_PUBLISHER_TEAM_CONTEXT_CONTRACT_2026-04-03.md`. |
| GOV-CIVIC-01 | done | medium | GOV-ANLASS-01 | Civic Rollen-/Sichtbarkeits-/Repraesentanzbaseline + Wirkungsverlauf | Civic-Rollen/Arbeitsstufen/Repraesentanzachsen (Thema vs Region) domain-konsistent aufbauen und an Wirkungsverlauf anbinden | Typed Role-/Visibility-/Representation-Contract liegt vor, an Anlassraum/Dossier/Companion angebunden, ohne Wahrheits-/Prioritaets-/Voting-Sondermacht; CIVIC-02 und CIVIC-03 setzen Lifecycle sowie Impact-/Unterstuetzungslogik darauf auf | no | Erledigt (2026-03-30): shared Contract `features/anlassraum/civicCreatorRepresentationContract.ts` inkl. route-naher Meta-Ausgabe (`meta.civicCreatorRepresentation`, `meta.civicCreatorRepresentationConsistency`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/civic-creator-representation-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-01_CREATOR_STREAM_REPRESENTATION_CONTRACT_2026-03-29.md`. |
| GOV-CIVIC-02 | done | medium | GOV-CIVIC-01 | Initiative-Lifecycle | Initiative-Prozess an Governance-Kern anbinden | Lifecycle-Status inkl. Uebergaengen ist explizit modelliert; erlaubte/gesperrte Transitionen sind profile-/capability-basiert definiert; keine Wahrheits-/Prioritaets-/Voting-Sondermacht | no | Erledigt (2026-03-30): typed Lifecycle-/Transition-Contract in `features/anlassraum/civicCreatorLifecycleContract.ts` inkl. Transition-Evaluator/Consistency-Validator, route-nahe Meta-Einbindung (`meta.civicCreatorLifecycle`, `meta.civicCreatorLifecycleConsistency`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/civic-creator-lifecycle-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-02_INITIATIVE_LIFECYCLE_TRANSITION_CONTRACT_2026-03-30.md`. |
| GOV-CIVIC-03 | done | medium | GOV-CIVIC-01, GOV-FUNDING-01 | Impact-/Unterstuetzungslogik fuer Initiativen | Impact/Funding-Logik fuer Initiativen konsistent integrieren | Explizite Support-/Impact-Kontexte sind lifecycle-gebunden modelliert; Unterstuetzung bleibt von Wahrheit/Prioritaet/Abstimmungsgewicht/Faktenstatus getrennt; keine Billing-/Funding-Engine im CIVIC-Block | no | Erledigt (2026-03-30): typed Impact-/Unterstuetzungs-Contract in `features/anlassraum/civicCreatorImpactSupportContract.ts` inkl. lifecycle-basierter Supportableitung, Guardrails und Consistency-Validator; route-nahe Meta-Einbindung (`meta.civicCreatorImpactSupport`, `meta.civicCreatorImpactSupportConsistency`) in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`; Tests in `apps/web/tests/civic-creator-impact-support-contract.test.ts` und `apps/web/tests/admin-governance-anlassraum.route.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-03_IMPACT_SUPPORT_CONTRACT_2026-03-30.md`. |
| GOV-CIVIC-04 | done | medium | GOV-CIVIC-03, GOV-JOURNALISM-03 | Share-ready Asset Layer (Target/QR/Social Qualification) | Pro Anlass canonical Share-/QR-Ziele und social-qualifizierte Asset-Meta ohne Auto-Posting-Sondermacht modellieren | Typed Share-/Target-Contract liefert `canonicalPublicTarget`, `qrTarget`, Zieltypisierung (`anlass`/`round operating`/`round results`/`dossier`/`companion`) sowie Share-Meta und Social-Qualification; `autoPostEligible` bleibt `false`, offizielle Social-Kanaele bleiben review-/kurationspflichtig; optionale Factcheck-/Andockhinweise bleiben non-blocking | no | Erledigt (2026-04-04): shared Contract `features/anlassraum/shareReadyAssetContract.ts` inkl. Resolver/Parser/Consistency-Validator, Guardrails gegen Wahrheits-/Prioritaets-/Voting-Sondermacht und Auto-Posting-Default; Tests in `apps/web/tests/share-ready-asset-contract.test.ts`; Neu (04B): erste produktive UI-Share-Actions auf `/runden` (Link kopieren, QR anzeigen/download, Teilen) kontraktgebunden auf `shareActions` aus `features/topicRound/entrySource.ts` (`apps/web/src/app/runden/RundenShareActions.tsx`, `apps/web/src/app/runden/page.tsx`), ohne Auto-Posting (`docs/E150/GOV-CIVIC-04B_UI_SHARE_ACTIONS_2026-04-04.md`). Neu (04C): erste Social-Review-Queue auf `/atlas/social-review` als kuratierte Freigabefläche ohne Posting-Engine (`apps/web/src/app/atlas/social-review/page.tsx`, `apps/web/src/app/atlas/social-review/SocialReviewQueueClient.tsx`) mit social-candidate/review-required/qualified-context/factcheck/context-hints aus Readmodel `features/anlassraum/socialReviewQueueReadModel.ts`; Share-Kontext in `features/topicRound/entrySource.ts` um optionale `socialQualification`/`factcheckSuggested`/`existingContextHint` erweitert; Tests in `apps/web/tests/social-review-queue-readmodel.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-04C_SOCIAL_REVIEW_QUEUE_2026-04-04.md`. Neu (04D): persistente Review-Entscheidungen serverseitig via `features/anlassraum/socialReviewDecisionStore.ts` und Admin-Route `apps/web/src/app/api/admin/atlas/social-review-decisions/route.ts`; Queue-Readmodel rehydriert den gespeicherten Status in `features/anlassraum/socialReviewQueueReadModel.ts`, UI auf `/atlas/social-review` persistiert statt rein lokalem Status; Tests erweitert in `apps/web/tests/social-review-queue-readmodel.test.ts`; Evidenz: `docs/E150/GOV-CIVIC-04D_SOCIAL_REVIEW_QUEUE_PERSISTED_DECISIONS_2026-04-04.md`. Neu (04E): operativer Queue-Polish mit Notiz-Persistenz im UI, Status-/Hint-Filtern und leichter Entscheidungs-Historie aus Store-Events (`features/anlassraum/socialReviewDecisionStore.ts`, `features/anlassraum/socialReviewQueueReadModel.ts`, `apps/web/src/app/atlas/social-review/SocialReviewQueueClient.tsx`); Route liefert letzten Persistenzstand plus Verlauf, Guardrails bleiben unverändert ohne Posting-Engine; Evidenz: `docs/E150/GOV-CIVIC-04E_SOCIAL_REVIEW_QUEUE_POLISH_NOTES_AUDIT_2026-04-04.md`. |
| GOV-ATLAS-01 | done | medium | GOV-ANLASS-02, GOV-CIVIC-04, GOV-ORG-02 | Dossier-Atlas / Themenlandschaft (Makrostruktur) | Uebergeordnete Atlas-Struktur fuer Thema/Region/Anlassraum/Dossier/Runde/Ergebnis/Companion mit Kontextmarkern kontraktnah aufbauen | Typed Atlas-Contract mit Knoten-/Beziehungs-/Aggregationsmodell liegt vor; Topic-/Region-Achsen bleiben explizit getrennt; Wochen-Snapshot-Felder sind ohne Toplist-/Wahrheits-/Prioritaetsdrift anschlussfaehig; Kontextmarker (Verband/Verein/Organisation/Redaktion/Civic/Experten) bleiben sichtbar ohne Sondermacht | no | Erledigt (2026-04-05): Parent nach Abschluss von 01A-01E formal geschlossen. Neu (01A / 2026-04-04): Contract- und Resolver-Baseline in `features/anlassraum/dossierAtlasLandscapeContract.ts` inkl. Parse/Consistency-Helfern und Guardrails gegen Wahrheits-/Prioritaets-/Voting-/Reputationsdrift; Tests in `apps/web/tests/dossier-atlas-landscape-contract.test.ts`; Evidenz: `docs/E150/GOV-ATLAS-01A_DOSSIER_ATLAS_THEMENLANDSCHAFT_CONTRACT_2026-04-04.md`. Neu (01B / 2026-04-04): erste read-only Atlas-UI auf `/atlas` mit contract-gebundenem Readmodel (`features/anlassraum/dossierAtlasReadModel.ts`, `apps/web/src/app/atlas/page.tsx`, `apps/web/src/app/atlas/AtlasClient.tsx`), degradiertem Fallback bei Source-Ausfall und ohne Ranking-/Wahrheits-/Auto-Publish-Drift; Tests in `apps/web/tests/dossier-atlas-readmodel.test.ts`; Evidenz: `docs/E150/GOV-ATLAS-01B_READ_ONLY_ATLAS_UI_2026-04-04.md`. Neu (01C / 2026-04-04): graphic-ready Wochen-Snapshot-Export-Contract auf Atlas-Basis in `features/anlassraum/dossierAtlasWeeklySnapshotExport.ts` (Resolver/Loader/Parser/Consistency) mit Public-vs-Internal-Summary-Schnitt, non-ranking Topic-Window und Guardrails gegen Wahrheits-/Prioritaets-/Auto-Publish-Drift; Tests in `apps/web/tests/dossier-atlas-weekly-snapshot-export.test.ts`; Evidenz: `docs/E150/GOV-ATLAS-01C_WEEKLY_SNAPSHOT_EXPORT_PAYLOAD_2026-04-04.md`. Neu (01D / 2026-04-04): erste read-only Weekly Snapshot Render-Surface auf `/atlas/weekly` (`apps/web/src/app/atlas/weekly/page.tsx`, `apps/web/src/app/atlas/weekly/WeeklySnapshotSurface.tsx`) inkl. public-first Summary, topic highlights, flow-, region- und context-Blocks, optionalen internen Detailmodus und degradiertem Fallback; Atlas-UI verlinkt auf Wochenansicht (`apps/web/src/app/atlas/AtlasClient.tsx`); Evidenz: `docs/E150/GOV-ATLAS-01D_WEEKLY_SNAPSHOT_RENDER_SURFACE_2026-04-04.md`. Neu (01E / 2026-04-04): visueller Polish fuer `/atlas` und `/atlas/weekly` mit ruhigerer Hierarchie, mobilen Bereichsankern, staerkerer Atlas<->Weekly-Verbindung und screenshot-/partner-tauglicher Darstellung ohne Contract- oder Guardrail-Drift; Evidenz: `docs/E150/GOV-ATLAS-01E_ATLAS_WEEKLY_VISUAL_POLISH_2026-04-04.md`. |
| PR-WRAPPER-01 | done | high | none | Wrapper-MVP Prep (Scope + Readiness Inventar) | Schlanken Wrapper-Startpfad fuer Store-Track ohne Produkt-/Architekturumbau belastbar definieren | MVP-Surface-Schnitt (`rein`/`spaeter`/`bewusst raus`) ist klar; iOS/Android-relevante Readiness-Matrix (Auth/Session, Deep-Links, Routing, Build, Compliance) liegt vor; Risiken/Blocker sind ehrlich benannt; Folgepfad ist in kleine Tasks getrennt | no | Erledigt (2026-04-05): Wrapper-MVP-Scope und technische Readiness inventarisiert, inkl. Guardrails und Folgeplan. Evidenz: `docs/E150/PR-WRAPPER-01_WRAPPER_MVP_PREP_INVENTORY_2026-04-05.md`. |
| PR-WRAPPER-01A | done | high | PR-WRAPPER-01 | Wrapper Runtime-/Routing-Prep (minimal) | Vor nativem Wrapper-Bau die entscheidungsfreien Web-Voraussetzungen kontraktnah haerten | Kleine, additive Härtung fuer Wrapper-Betrieb: expliziter Wrapper-MVP-Surface-Contract (Allowlist), klares External-Link-Handling-Konzept, Session-/Redirect-/Deep-Link-Smoke-Checks fuer In-App-Webview-Kontext; kein nativer Rebuild, keine neue Produktlogik | no | Erledigt (2026-04-05): `apps/web/src/features/wrapper/mvpSurfaceContract.ts` eingefuehrt (MVP/later/excluded/unknown/invalid + Alias-Kanonisierung fuer `/anlassraum`/`/sw`/`/swipe`), External-Link-Klassifikation (`internal`/`external`/`invalid`) vorbereitet, und `sanitizeRedirect` in `apps/web/src/app/api/auth/sharedAuth.ts` ueber `normalizeInternalRedirectPath` defensiv gehaertet. Tests: `apps/web/tests/wrapper-mvp-surface-contract.test.ts`, `apps/web/tests/auth-shared.redirect-contract.test.ts`, plus Alias-Paritaet in `apps/web/tests/anlassraum-alias.route.test.ts`. Evidenz: `docs/E150/PR-WRAPPER-01A_RUNTIME_ROUTING_PREP_2026-04-05.md`. |
| PR-WRAPPER-01B | done | medium | PR-WRAPPER-01A | Wrapper Packaging-/Store-Policy-Entscheidung | Vor Submission den minimalen nativen Kanal verbindlich festlegen (z. B. Capacitor vs. alternative Wrapper-Strategie) | Explizite Entscheidung fuer Wrapper-Stack inkl. Deep-Link-/Cookie-/Review-Policy, Release-Verantwortung und Submission-Reihenfolge iOS/Android liegt vor; erst danach Umsetzungsslices fuer native Projekte | no | Erledigt (2026-04-05): Wrapper-MVP-Entscheidung festgezogen: **Stack = Capacitor**, **Plattformfolge = Android zuerst**, iOS folgt nach Android-Beta-Haertung; MVP-Surfaces bleiben auf public/user Kernpfad begrenzt, Stream ist im MVP als **Nutzerpfad** (`/stream`, `/stream/[slug]`) enthalten, aber ohne Produktions-/Moderationsstudio; Admin-/Demo-/Research-/Operator-Spezialflaechen bleiben ausgeschlossen. Evidenz: `docs/E150/PR-WRAPPER-01B_WRAPPER_STACK_PLATFORM_DECISION_2026-04-05.md`. |
| PR-WRAPPER-02 | done | high | PR-WRAPPER-01B | Android-first Capacitor Bootstrap | Ersten repo-nahen Wrapper-Implementierungsslice ohne Full-Store-Rollout umsetzen | Capacitor-Basis in separatem Wrapper-App-Ordner vorhanden; Android-Projekt ist initialisiert und sync-faehig; Web-Anbindung via `server.url` ist gesetzt; MVP-Surface-Policy ist wrapper-nah dokumentiert/typisiert; keine iOS-/Submission-/Feature-Scope-Ausweitung | no | Erledigt (2026-04-05): `apps/wrapper-android` neu mit `capacitor.config.ts`, Android-Projekt (`cap add android`), Sync/Doctor-Checks, MVP-Surface-Policy (`apps/wrapper-android/src/mvpSurfacePolicy.ts`) und Runbook (`apps/wrapper-android/README.md`). Web-seitiger Policy-Smoke in `apps/web/tests/wrapper-android-mvp-policy.test.ts`. Evidenz: `docs/E150/PR-WRAPPER-02_ANDROID_FIRST_CAPACITOR_BOOTSTRAP_2026-04-05.md`. |
| PR-WRAPPER-03 | done | medium | PR-WRAPPER-02 | Android Wrapper Runtime-Guardrails (MVP-Boundary) | Eintritts-/Navigationsgrenzen im nativen Shell-Kontext weiter haerten, ohne Scope-Sprung | Wrapper startet auf kanonischem MVP-Einstieg; in-App-Deep-Link-Handling bleibt auf MVP-Surfaces begrenzt; ausgeschlossene Flächen werden nicht still als Start-/Shortcut-Ziele akzeptiert; Stream bleibt Nutzerpfad, kein Studio-/Operatorpfad; keine iOS-/Submission-Arbeit | no | Erledigt (2026-04-05): Native Wrapper-Navigation gehaertet via `WrapperNavigationGuardPlugin` (`apps/wrapper-android/android/app/src/main/java/org/edebatte/app/WrapperNavigationGuardPlugin.java`) und Back-Handling in `MainActivity` (History->back, sonst `moveTaskToBack`). `capacitor.config.ts` startet kanonisch auf `/start` und nutzt `App.disableBackButtonHandler`; App-Link-Intent-Filter fuer `edebatte.org` in `AndroidManifest.xml`. Runtime-Policy/Smokes in `apps/wrapper-android/src/mvpSurfacePolicy.ts`, `apps/web/tests/wrapper-android-mvp-policy.test.ts`, `apps/wrapper-android/README.md`. Evidenz: `docs/E150/PR-WRAPPER-03_ANDROID_RUNTIME_GUARDRAILS_2026-04-05.md`. |
| PR-WRAPPER-04 | done | medium | PR-WRAPPER-03 | Android MVP Internal-Beta Dry Run (ohne Submission) | Nach Runtime-Hardening den Android-first Wrapper als internen Beta-Kanal reproduzierbar machen, ohne Store-Rollout | Reproduzierbarer Android-Dry-Run fuer Wrapper-MVP ist dokumentiert (Build/Install/Smoke-Checklist), MVP-Surface-Boundary bleibt intakt, keine iOS-/Store-Submission-/Push-/Offline-Scope-Ausweitung | no | Erledigt (2026-04-05): Build-/Beta-Readiness als Android-first Gate formalisiert: Java-Preflight (`apps/wrapper-android/scripts/check-android-java.mjs`, Script `doctor:java`), reproduzierbare Build-Scripts (`build:android:debug`, `build:android:release`) und Go/No-Go-Checklist in `apps/wrapper-android/README.md`; Runtime-Smokes/Boundary-Tests (`apps/web/tests/wrapper-android-mvp-policy.test.ts`) grün. Transparenter No-Go im aktuellen lokalen Lauf: nur Java 8 vorhanden, AGP 8.x fordert Java 17+; kein Repo-Contract-Blocker. Evidenz: `docs/E150/PR-WRAPPER-04_ANDROID_INTERNAL_BETA_READINESS_2026-04-05.md`. |
| PR-WRAPPER-05 | done | high | PR-MOBILE-HARM-02, PR-PRICING-HARM-09 | Shell-/Wrapper-/Layout-Hardening fuer produktnahe Flaechen (`/pricing`, `/vormerken`, `/pricing/institutionen`) | Wrapper-/Shell-Drift beseitigen und mobile-first Einbettung (Safe-Area, Header/Footer/Bottom-Nav, Containerbreiten, vertikale Rhythmik) als testbaren Contract stabilisieren | Produktflaechen teilen sich einen gemeinsamen Product-Surface-Layout-Contract; keine Sonderhuelle nur fuer Pricing; App-Shell-Bottom-Spacing wird nur einmal am Site-Main angewandt; `/pricing`, `/vormerken`, `/pricing/institutionen` sind containerseitig konsistent; Contract-Tests fuer Product-Surface-Shell + Mobile-App-Shell-Zuordnung sind gruen; Manual-QA-Checkliste um Wrapper-/Layout-Pruefpunkte erweitert | no | Erledigt (2026-04-12): gemeinsamer Product-Surface-Layout-Contract (`apps/web/src/features/wrapper/productSurfaceLayoutContract.ts`) + Shell-Komponente (`apps/web/src/components/layout/ProductSurfaceShell.tsx`) eingefuehrt und in `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx}` angebunden; Root-Layout markiert Site-Main explizit (`apps/web/src/app/layout.tsx`), mobiles Bottom-Spacing in `apps/web/src/app/globals.css` auf `[data-site-main]` begrenzt (kein doppeltes `main`-Padding); neue Contract-Tests `apps/web/tests/product-surface-shell.contract.test.tsx` und erweiterte Shell-Zuordnung in `apps/web/tests/mobile-app-shell-contract.test.ts`; QA-Checkliste erweitert (`docs/E150/QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md`). |
| PR-MOBILE-HARM-01 | done | high | PR-WRAPPER-03 | Mobile RePro / App-feel Hardening (Web + Wrapper) | Mobile Web-Basis und Wrapper-Wahrnehmung gemeinsam beruhigen (Chrome, Cookie, Register-Bridge, Dark-Safety), ohne Produktlogik neu zu bauen | Mobile Footer-/Cookie-Chrome wirkt appiger (weniger Website-Bar-Eindruck); Register-Einstieg aus `next`-Flows hat nachvollziehbare Welcome-Bridge; Human-Check/2FA-/Form-Kontrast bleibt dark-safe; adressnahe Hilfe im Register ist datenschutzsauber andockbar; Kernpfade bleiben funktional ohne IA-/Governance-Drift | no | Erledigt (2026-04-06): Mobile Footer stark reduziert in `apps/web/src/components/SiteFooter.tsx`, Cookie-Hinweis als Overlay-Sheet statt klassischem Bottom-Bar in `apps/web/src/components/privacy/CookieConsentBanner.tsx`, Header-Chrome kompakter in `apps/web/src/app/(components)/SiteHeader.tsx`; Register-Bridge + OSM-Adresshilfe + Input-Friktionsreduktion in `apps/web/src/app/register/RegisterPageClient.tsx` (Bridge-Resolver `apps/web/src/app/register/registerFlowBridge.ts`), Login-Eingaben und 2FA-Hinweis dark-safe in `apps/web/src/components/auth/LoginPageShell.tsx`, HumanCheck dark-safe in `apps/web/src/components/security/HumanCheck.tsx`. Tests: `apps/web/tests/register-flow-bridge.test.ts`, `apps/web/tests/wrapper-android-mvp-policy.test.ts`, `apps/web/tests/wrapper-mvp-surface-contract.test.ts`, `apps/web/tests/auth-shared.redirect-contract.test.ts`. Evidenz: `docs/E150/PR-MOBILE-HARM-01_APP_FEEL_REPRO_HARDENING_2026-04-06.md`. |
| PR-MOBILE-HARM-02 | done | medium | PR-MOBILE-HARM-01 | Mobile Primary Navigation (Bottom-Bar) Decision + kleiner Kernpfad-Pilot | Klären, ob eine globale mobile Bottom-Bar für Kernpfade (`/start`, `/create`, `/swipes`, `/runden`, `/pricing`) im Web+Wrapper sinnvoll ist, ohne IA-Revolution | App-Shell-Boundary ist explizit (core vs. auth vs. excluded); mobile Bottom-Bar läuft nur in der Core-Shell; Footer wird in der App-Shell mobil ausgeblendet; Header wird im Shell-Modus kompakter; ausgeschlossene Flächen (`/admin/**`, `/dashboard/**`, `/demo/**`, `/embed/**`, `/research/**`) bleiben draußen | no | Erledigt (2026-04-06): Contract `apps/web/src/features/wrapper/mobileAppShellContract.ts` + mobile App-Shell-Chrome `apps/web/src/components/mobile/MobileAppShellChrome.tsx` eingeführt; Root-Layout bindet Shell-Chrome ein (`apps/web/src/app/layout.tsx`), Footer ist mobile-shell-aware (`apps/web/src/components/SiteFooter.tsx`), Header kompakter im Shell-Modus (`apps/web/src/app/(components)/SiteHeader.tsx`), globale mobile Shell-Regeln in `apps/web/src/app/globals.css`; Tests `apps/web/tests/mobile-app-shell-contract.test.ts`, `apps/web/tests/wrapper-mvp-surface-contract.test.ts`, `apps/web/tests/wrapper-android-mvp-policy.test.ts`, `apps/web/tests/auth-shared.redirect-contract.test.ts`; Evidenz: `docs/E150/PR-MOBILE-HARM-02_APP_SHELL_BOTTOM_NAV_CORE_ROUTES_2026-04-06.md`. |
| PR-MOBILE-PWA-FOUNDATION-01 | done | high | PR-MOBILE-HARM-02, PR-WRAPPER-05 | Mobile-/PWA-Readiness Foundation vor nativen Wrappern | Kernreisen mobil stabilisieren und installierbare Web-App-Basis (Manifest, Share/Deep-Link, Safe-Area) ohne neue Produktarchitektur aufsetzen | `/create`, `/factcheck`, `/companion/**` sind in der Mobile-Core-Shell; `/swipes` Schnellaktionen kollidieren mobil nicht mehr mit Bottom-Nav; mobile Abstände für Create/Dossier/Factcheck sind beruhigt; zentrale Share-/Deep-Link-Actions sind auf Dossier/Factcheck/Companion verfügbar; PWA-Basis über `manifest.webmanifest` + mobile viewport metadata ist aktiv; keine native Wrapper-Implementierung in diesem Slice | no | Erledigt (2026-04-24): Core-Shell-Routing erweitert in `apps/web/src/features/wrapper/mobileAppShellContract.ts`; mobile Action-Bar-Offset in `apps/web/src/app/swipes/SwipesClient.tsx`; mobile Spacing-Hardening in `apps/web/src/features/create/SharedCreateComposer.tsx`, `apps/web/src/app/create/CreateClient.tsx`, `apps/web/src/app/dossier/[id]/ui.tsx`, `apps/web/src/features/surfaces/factcheck/FactcheckSurface.tsx`; zentrale Share-/Deep-Link-Bausteine in `apps/web/src/components/mobile/ShareDeepLinkActions.tsx`, `apps/web/src/features/mobile/deepLink.ts` und Anbindung in `apps/web/src/components/ai/RouteBoundCompanionPanel.tsx`; PWA-Manifest + Root-Metadata in `apps/web/src/app/{manifest.ts,layout.tsx}`; Tests: `apps/web/tests/{mobile-app-shell-contract.test.ts,mobile-deep-link.contract.test.ts,web-manifest.contract.test.ts}`; Validierung: `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`, `pnpm --filter @vog/web build`. |
| PR-SOCIAL-OUTPUT-PREP-01 | done | high | PR-MOBILE-PWA-FOUNDATION-01, GOV-CIVIC-04 | Neutrale Share-/Social-Preparation-Pipeline für Dossier/Factcheck/Companion/Topic-Round/Stream | Aus bestehenden Produktobjekten eine konsistente, nicht-manipulative Share-/Preview-Ausgabe mit sauberer OG-/Meta-Basis bereitstellen | Shared Social-Output-Contract liefert canonical URL, neutralen Teaser, Object-Typ, Verification-Übernahme und Card-/Carousel-/Stream-Prep-Struktur; wichtige Detailrouten haben harmonisierte `generateMetadata`/OG-Fallbacks; UI zeigt kompakte Share-/Preview-Flächen ohne falsche Siegel; Factcheck-Status wird korrekt aus Lane/Seal-Contract übernommen; keine Auto-Posting-Engine und keine manipulative Copy | no | Erledigt (2026-04-24): Neuer Contract `features/share/socialOutputContract.ts`; App-Metadata-Helper `apps/web/src/features/share/metadata.ts`; neue UI `apps/web/src/components/share/SocialOutputPreviewPanel.tsx`; Integrationen in `apps/web/src/app/{dossier/[id]/page.tsx,dossier/[id]/ui.tsx,factcheck/page.tsx,factcheck/[id]/page.tsx,stream/[slug]/page.tsx,round/[slug]/page.tsx,companion/[slug]/page.tsx}` und `apps/web/src/features/surfaces/{factcheck/FactcheckSurface.tsx,topic-round/SharePanel.tsx}`; neue Tests `apps/web/tests/{social-output-contract.test.ts,share-metadata.contract.test.ts}`; Validierung: `pnpm -C apps/web exec vitest run tests/social-output-contract.test.ts tests/share-metadata.contract.test.ts`, `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`, `pnpm --filter @vog/web build`. Restpunkt separat: automatische Clip-/Transkript-Generierung bleibt bewusst außerhalb dieses Slices. |
| PR-SURFACE-CONSOLIDATION-ROUND-2A | done | high | PR-AI-CREATE-02, PR-MOBILE-PWA-FOUNDATION-01 | Surface-Consolidation Round 2A (`/default`, `/create`, `/runden`, `/swipes`) | Einstieg/Arbeitsfluss über die vier Kernflächen konsolidieren: identische Hero-/Input-Identität für `/default`+`/create`, operativer Schnellstart auf `/runden`, leichterer Swipe-Flow ohne irreführende Inaktiv-KPI | `/default` und `/create` teilen dieselbe Hero-/Headline-Identität, bleiben aber in der Energie getrennt (`lively` vs `calm`); `/runden` bietet eine kompakte Anlass/Prüfen-Maske mit geführtem Frage-/Optionen-Flow; `/swipes` zeigt keinen `0 von 100`-Pseudo-Fortschritt im inaktiven Zustand und bietet leichte Folgefragen; defensive Fallbacks bleiben stabil, keine Scope-Ausweitung auf andere Surfaces | no | Erledigt (2026-04-24): Shared Hero-Pattern via `apps/web/src/features/surfaces/entryHeroIdentity.ts` + `apps/web/src/components/surfaces/EntryHeroHeading.tsx` in `features/landing/LandingAssistant.tsx`, `apps/web/src/features/create/SharedCreateComposer.tsx` und neuer Route `apps/web/src/app/default/page.tsx`; neuer Guided-Runden-Baustein `apps/web/src/app/runden/RundenGuidedQuestionBuilder.tsx` + Helper `apps/web/src/features/surfaces/runden/guidedQuestionBuilder.ts` an `apps/web/src/app/runden/page.tsx`; Swipe-Leichtgewicht über `apps/web/src/features/surfaces/swipes/progressContract.ts`, `apps/web/src/features/surfaces/swipes/components/{SwipesHeaderProgress.tsx,SwipeTopicStep.tsx}` und `apps/web/src/app/swipes/SwipesClient.tsx`; Tests: `apps/web/tests/{entry-hero-identity.contract.test.tsx,runden-guided-question-builder.contract.test.ts,swipes-progress.contract.test.ts,swipe-topic-step.quick-followup.contract.test.tsx,create-entry-hierarchy.contract.test.tsx,gradient-headline-i18n.render.test.tsx,swipes-gesture-contract.test.ts,swipes-arrival.helpers.test.ts}`; Validierung: `rm -rf apps/web/.next`, `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`, `pnpm --filter @vog/web build`. |
| PR-QUALITY-HARM-02 | done | high | PR-QUALITY-HARM-01 | E2E-/Manual-QA-Hardening fuer Auth, Rollenrouting, Dashboard-Zielbilder, Pricing-/Order-Followups und Add-on-Reifestand | Kritische Nutzerreisen als Pflicht-Qualitaetsgate absichern, ohne neue Feature-Parallelwelt | Pflicht-Testgruppen (`auth-registration-flow`, `role-routing`, `dashboard-role-contracts`, `pricing-order-role-followup`, `addon-availability-contracts`, `e2e-critical-journeys`) sind vorhanden; Add-on-Reifestand ist als SSOT-Vertrag explizit; Manual-QA-Checkliste fuer Kernreisen liegt vor; OpenTasks markiert den Slice explizit als essenziellen Pflichtpfad | no | Erledigt (2026-04-12): Add-on-Maturity-Contract in `features/pricing/domain/institutionalPricing.de.ts` eingefuehrt und in `/pricing`, `/vormerken`, `/pricing/institutionen` sichtbar gemacht (`apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx}`), Order-Notes an Reifestand gekoppelt (`features/pricing/usecases/createPreorderLead.ts`), Journey-Testgruppe ergaenzt (`apps/web/tests/e2e-critical-journeys.test.ts`), Add-on-/Followup-Tests erweitert (`apps/web/tests/{addon-availability-contracts.test.ts,pricing-order-role-followup.contract.test.ts}`), Pflichtdoku erstellt (`docs/E150/PR-QUALITY-HARM-02_E2E_MANUAL_QA_HARDENING_2026-04-12.md`, `docs/E150/QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md`). |
| PR-I18N-PRICING-01 | done | high | PR-PRICING-HARM-09, PR-QUALITY-HARM-02, PR-WRAPPER-05 | Bilingual Hardening fuer Pricing-/Order-/Add-on-Surfaces (`/pricing`, `/vormerken`, `/pricing/institutionen`) | DE/EN als semantisch deckungsgleichen Produktpfad absichern, ohne Pricing-Parallelwelt oder Copy-Drift | Pricing-/Journey-/TargetGroup-/Add-on-/Badge-/Followup-SSOT ist locale-faehig (`de`/`en`); alle drei Pricing-Surfaces rendern konsistent in DE/EN; Reifestands-Badges und CTA-Sprache bleiben semantisch deckungsgleich; Query-Fokus (`segment`, `addon`, `addons`) bleibt stabil bei `lang=en`; keine internen Reifestand-Keys oder Legacy-Tier-Namen user-facing sichtbar; i18n-Contract-Tests fuer Pricing/Vormerken/Institutionen/Add-ons/Followup sind gruen | no | Erledigt (2026-04-12): locale-faehige Domain-Getter und EN-Planwelt in `features/pricing/domain/{i18n.ts,helpers.ts,formatters.ts,plans.en.ts,journey.de.ts,content.de.ts,targetGroups.de.ts,institutionalPricing.de.ts,orderFollowup.de.ts}`; Pages/UX auf locale-SSOT umgestellt (`apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx}`, `apps/web/src/components/pricing/{TargetGroupNavigator.tsx,PackagesGrid.tsx,AddOnInfoCard.tsx,AddOnMaturityBadge.tsx}`); order-summary/mail locale-sensitiv (`features/pricing/usecases/createPreorderLead.ts`, `apps/web/src/utils/emailTemplates.ts`); neue Tests `apps/web/tests/{pricing-i18n.contract.test.ts,vormerken-i18n.contract.test.tsx,pricing-institutionen-i18n.contract.test.ts,addon-i18n.contract.test.ts,pricing-order-followup-i18n.contract.test.ts}`; Evidenz: `docs/E150/PR-I18N-PRICING-01_PRICING_ORDER_ADDON_BILINGUAL_HARDENING_2026-04-12.md`. |
| PR-CLOSING-WAVE-01 | done | high | PR-I18N-PRICING-01, PR-QUALITY-HARM-02 | Pricing-/Order-/Role-Closing-Wave (finaler Endzustand ohne Zwischenversprechen) | Oeffentliche Produktlogik auf dauertragfaehigen Endzustand einfrieren: nur **fertig und abgesichert**, **intern vorhanden aber oeffentlich nicht versprochen** oder **aus oeffentlicher UX entfernt** | Full-repo Gates fuer relevanten Kontext sind gruen (`lint`, `typecheck`, repraesentativer Full-Testlauf); Rollenrouting-/Dashboard-Basis inkl. Admin/Backoffice/Rechnungspruefung ist final contractualisiert; Order-/Backoffice-Kernfelder fuer Review/Freigabe/Preis-/Rabatt-Anpassung sind vorhanden; oeffentliche Add-on-Reifestandszusagen bleiben operativ tragfaehig (kein `in_rollout` auf oeffentlichen Kern-Add-ons); Terminologie-Freeze DE/EN ist dokumentiert; OpenTasks/Part19/membership_pricing sind auf den Endzustand harmonisiert | no | Erledigt (2026-04-13): Full Checks (`pnpm -w -r lint`, `pnpm -w -r typecheck`, `pnpm -C apps/web exec vitest run`) gruen; Test-/Contract-Fixes fuer verbleibende Red-Suites umgesetzt (`apps/web/tests/{create-prepare-attach.review-ui.test.tsx,community-page.states.test.ts,operator-surfaces.locale-render.test.tsx,admin.analytics.summary.test.ts,contact/contact-api.test.ts,vote.stats.test.ts,e2e/admin.spec.ts}`); Admin-Order-Backoffice um Review-/Finance-Kernfelder erweitert (`apps/web/src/app/admin/pricing/orders/page.tsx`, `features/pricing/server/leadsRepo.ts`); Role-Contract um Finance-/Billing-Route erweitert (`apps/web/src/features/auth/roleExperienceContract.ts`, zugehoerige Tests); Abschlussdoku: `docs/E150/PR-CLOSING-WAVE-01_FINAL_CLOSURE_2026-04-13.md`. |
| PR-TRUST-LEGIT-01 | done | high | PR-CLOSING-WAVE-01 | Bilingual Trust-/Legitimations-Loop fuer Pricing, Registry, Membership und Order-Followup | Partei-/Initiativen-Abgrenzung sowie digitale Legitimation gegen Papierlogik als zentralen, wiederverwendbaren Trust-Contract absichern | Zentraler DE/EN-Trust-SSOT mit Leitsatz/Kurz/Mittel/Lang + Kontext-Hinweisen + FAQ ist aktiv; `/pricing`, `/vormerken`, `/pricing/institutionen`, registry-/payment-nahe Hinweise und order-followup nutzen denselben Trust-Contract; verbotene riskante Formulierungen sind per Contract-Test ausgeschlossen; DE/EN bleiben semantisch deckungsgleich ohne Over-Promise | no | Erledigt (2026-04-13): zentraler Trust-Contract in `features/pricing/domain/trustLoop.de.ts` inkl. `TRUST_LOOP_FORBIDDEN_PHRASES`; SSOT-Anbindung in `features/pricing/domain/content.de.ts`; Platzierung auf `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx,register/RegisterPageClient.tsx,account/payment/page.tsx}` und Follow-up-Hinweis in `features/pricing/domain/orderFollowup.de.ts`; Tests: `apps/web/tests/pricing-trust-loop.contract.test.ts`, `apps/web/tests/{pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-institutionen-page.contract.test.ts,pricing-i18n.contract.test.ts,vormerken-i18n.contract.test.tsx,pricing-institutionen-i18n.contract.test.ts,pricing-order-followup-i18n.contract.test.ts}`; Evidenz: `docs/E150/PR-TRUST-LEGIT-01_PRICING_REGISTRY_MEMBERSHIP_TRUST_LOOP_2026-04-13.md`. |
| PR-PRICING-ABC-02 | done | high | PR-CREATE-MODES-01, PR-TRUST-LEGIT-01 | B2C-Paketwelt auf 3 create-nahe Nutzungsmodi umstellen (0 €/9,90€/29,90) und `/pricing` + `/vormerken` entschlacken | Sichtbare Privatlogik ueber drei klare Pakete (`Interessiert`, `Aktiv`, `Mitgestaltend`) fuehren, alte user-facing Basis/Start/Pro-Reste entfernen und journalistische/institutionelle Zugaenge nur vorbereitet nachgeordnet halten | `/pricing` zeigt primär drei B2C-Pakete mit create-nahem Brueckenschritt; `/vormerken` nutzt dieselbe Paketwelt; user-facing keine `citizen*`/`Technisches Mapping`/alte Tiernamen; 0 € fuer Mitglieder + 3,99 € regulaer sowie 9,90 €/29,90 sichtbar; vorbereitete Sonderzugaenge fuer Journalismus/Organisationen/Kommunen bleiben als nachgeordnete Pfade vorhanden; semantische Tests fuer Pricing/Vormerken/i18n/SSOT angepasst | no | Erledigt (2026-04-17): Paket-SSOT in `features/pricing/domain/{plans.de.ts,plans.en.ts}` auf neue 3er-Logik gehärtet; `/pricing` neu auf ruhige B2C-Hauptfuehrung + vorbereitete Sonderzugänge umgestellt (`apps/web/src/app/pricing/page.tsx`); `/vormerken` auf direkte Paketbeauftragung mit nachgeordneten Sonderzugängen harmonisiert (`apps/web/src/app/vormerken/page.tsx`, `features/pricing/domain/content.de.ts`, `features/pricing/domain/journey.de.ts`); Contract-Tests aktualisiert (`apps/web/tests/{pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-vormerken-source-of-truth.contract.test.tsx,pricing-i18n.contract.test.ts,vormerken-i18n.contract.test.tsx,e2e-critical-journeys.test.ts,pricing-preorder-verification-gates.contract.test.ts,edebatte-preorder.route.test.ts}`); Evidenz: `docs/E150/PR-PRICING-ABC-02_B2C_CREATE_ALIGNED_2026-04-17.md`. |
| PR-PRICING-ABC-03 | done | high | PR-PRICING-ABC-02, PR-PRODUCT-SURFACES-HARM-01 | Finaler Privatflow-Shortening-Pass fuer `/pricing` + `/vormerken` inkl. Mitgliedschafts-Checkbox und B2B/B2G-Konditionsauslagerung | Pricing-/Order-Einstieg sichtbar kuerzen, Paketentscheidung schaerfen und institutionelle Konditionen kontaktgefuehrt nachordnen, ohne neue Parallelwelt | `/pricing` zeigt kurzen Hero mit 2 CTAs und drei dominante Privatpakete (`Interessiert` 0 € Mitglieder/3,99 € regulaer, `Aktiv` 9,90 €, `Mitgestaltend` 29,90 €); `/vormerken` fuehrt paketgefuehrt mit klarer Folgeanzeige, optionaler Mitgliedschafts-Checkbox und konsistenter Preislogik; `/pricing/institutionen` bleibt kontaktgefuehrt ohne Direktbuchung (`sales@edebatte.org`); i18n-Links bleiben DE/EN konsistent inkl. `lang=en` auf Kern-CTAs; Label `Zur Initiative` ersetzt `Zur Bewegung` auf relevanten Kernflaechen; neue/aktualisierte Contracts fuer Preislogik, Membership-Checkbox, Short-Flow, Konditionslink, Legacy-Preisreste und Navigationslabel sind gruen | no | Erledigt (2026-04-18): Umsetzung in `apps/web/src/{app/pricing/page.tsx,app/pricing/institutionen/page.tsx,app/vormerken/page.tsx,app/api/edebatte/preorder/route.ts,components/pricing/PackagesGrid.tsx,features/create/createSurfaceConfig.ts,app/(components)/SiteHeader.tsx,app/[locale]/referenzarchitektur/page.tsx}` und in Pricing-Lead-Domain `features/pricing/{domain/types.ts,usecases/createPreorderLead.ts,server/leadsRepo.ts}`; Tests u. a. `apps/web/tests/{pricing-private-package-prices.contract.test.ts,vormerken-private-package-prices.contract.test.tsx,member-checkbox-flow.contract.test.tsx,pricing-short-main-flow.contract.test.ts,institutional-pricing-link.contract.test.tsx,no-legacy-price-logic.contract.test.tsx,navigation-initiative-label.contract.test.ts,pricing-page.contract.test.ts,pricing-i18n.contract.test.ts,pricing-institutionen-page.contract.test.ts,pricing-institutionen-i18n.contract.test.ts}`; Evidenz: `docs/E150/PR-PRICING-ABC-03_PRIVATE_FLOW_SHORTENING_2026-04-18.md`. |
| PR-PRICING-INST-SHOP-01 | done | high | PR-PRICING-ABC-03, PR-WRAPPER-05 | Institutioneller Direktbestellpfad + Kostenvoranschlag fuer `/pricing/institutionen` und segmentgefuehrtes `/vormerken` | Den institutionellen Pfad von kontaktgefuehrter Konditionsseite auf shopfaehige Paketbeauftragung mit Angebotsgenerierung umstellen, ohne B2C-Hauptlogik aufzublasen | `/pricing/institutionen` bietet sichtbare Direktbestellung + Angebots-CTA; Paket- und Add-on-CTAs fuehren in `/vormerken` statt nur `mailto`; `/vormerken` unterstuetzt Segmente (`privat`/`journalismus`/`organisationen`/`kommunen`) inkl. institutioneller Paketvorwahl, Add-on-Auswahl und Knopfdruck-Kostenvoranschlag mit Leistungsuebersicht; `/api/edebatte/preorder` blockiert institutionelle Segmente nicht mehr pauschal; DE/EN-CTAs bleiben konsistent (`lang=en`); Wrapper-MVP-Routen bleiben kompatibel (`/pricing/**`, `/vormerken`) | no | Erledigt (2026-04-18): Shop-/Quote-Flow in `apps/web/src/app/{pricing/institutionen/page.tsx,vormerken/page.tsx,api/edebatte/preorder/route.ts}` umgesetzt; Contracts aktualisiert in `apps/web/tests/{pricing-institutionen-page.contract.test.ts,pricing-institutionen-i18n.contract.test.ts,institutional-pricing-link.contract.test.tsx,vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx,edebatte-preorder.route.test.ts,pricing-preorder-verification-gates.contract.test.ts,wrapper-mvp-surface-contract.test.ts,wrapper-android-mvp-policy.test.ts,mobile-app-shell-contract.test.ts}`; Evidenz: `docs/E150/PR-PRICING-INST-SHOP-01_DIRECT_ORDER_QUOTE_WRAPPER_2026-04-18.md`. |
| PR-INSTITUTIONAL-CONFIGURATOR-01 | done | high | PR-PRICING-INST-SHOP-01 | Gefuehrter institutioneller Vorauswahl-/Empfehlungsflow fuer `/pricing/institutionen` und institutionelles `/vormerken` | Institutionelle Flaechen von statischem Katalog auf gefuehrte Auswahl mit Empfehlung, progressiver Add-on-Logik und optionalem Angebotsweg umstellen | `/pricing/institutionen` fuehrt jetzt ueber Segment -> Ziel -> Rahmen -> Empfehlung; nur zwei Basispakete pro Segment bleiben sichtbar, Empfehlung zeigt Begruendung + ROI-Kontext + alternative Stufe; Add-ons erscheinen zuerst als empfohlene Erweiterungen (2-3), restliche Optionen sind nachgeordnet; `/vormerken` uebernimmt Empfehlung (`goal`/`frame`), zeigt Add-on-Rueckfragen nur bei ausgewaehlten Add-ons und bietet drei Abschlusswege (`Direkt bestellen`, `Kostenvoranschlag anfordern`, `Gespräch anfragen`), wobei Angebot optional bleibt; neue Contracts fuer Guided-Flow, Empfehlung, progressive Disclosure, situative Rueckfragen, optionale Angebotslogik, ROI-Copy und visuelle Reduktion sind gruen | no | Erledigt (2026-04-19): Shared Empfehlungs-/Followup-Logik in `features/pricing/domain/institutionalPricing.de.ts`; Guided-Surface in `apps/web/src/app/pricing/institutionen/page.tsx`; institutioneller Konfigurator in `apps/web/src/app/vormerken/page.tsx`; aktualisierte/ergänzte Contracts `apps/web/tests/{pricing-institutionen-page.contract.test.ts,pricing-institutionen-i18n.contract.test.ts,institutional-pricing-link.contract.test.tsx,vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx,institutional-guided-selection-flow.contract.test.ts,institutional-package-recommendation.contract.test.ts,institutional-addons-progressive-disclosure.contract.test.ts,institutional-addon-followup-questions.contract.test.tsx,institutional-quote-optional-not-primary.contract.test.tsx,institutional-roi-copy.contract.test.ts,institutional-visual-overload-regression.contract.test.ts}`; Evidenz: `docs/E150/PR-INSTITUTIONAL-CONFIGURATOR-01_GUIDED_RECOMMENDATION_FLOW_2026-04-19.md`. |
| PR-INSTITUTIONAL-CONFIGURATOR-02 | done | high | PR-INSTITUTIONAL-CONFIGURATOR-01 | Institutioneller Feinschliff fuer ruhigere Hierarchie-/Copy-Priorisierung auf `/pricing/institutionen` und institutionellem `/vormerken` | Gefuehrten Konfigurator verdichten, Empfehlung visuell priorisieren, Add-on-Kommunikation weiter verkuerzen und situative Rueckfragen/CTA-Hierarchie klar staffeln | Segment->Ziel->Rahmen bleibt als Auswahlkopf erhalten, aber kompakter; Empfehlung ist visuell klar priorisiert; Add-ons sind in Banden (`empfohlen`, `optional`, `nur bei Bedarf`) und pro Karte auf Name/Preis/wann sinnvoll/Status reduziert; laengere Hinweise erscheinen erst nach Add-on-Auswahl im Followup; oeffentliche Sprache meidet ROI-Jargon und fokussiert Mehrwert/Entlastung/Arbeitsalltag; CTA-Hierarchie bleibt `Empfehlung uebernehmen`/`Direkt bestellen` > `Kostenvoranschlag anfordern` > `Gespraech anfragen`; neue Feinschliff-Contracts sind gruen | no | Erledigt (2026-04-19): Feinschliff in `apps/web/src/app/{pricing/institutionen/page.tsx,vormerken/page.tsx}`; aktualisierte Contracts `apps/web/tests/{pricing-institutionen-page.contract.test.ts,institutional-addons-progressive-disclosure.contract.test.ts,institutional-roi-copy.contract.test.ts}`; neue Contracts `apps/web/tests/{institutional-recommendation-visual-priority.contract.test.ts,institutional-addon-copy-shortened.contract.test.ts,institutional-addon-priority-bands.contract.test.ts,institutional-no-roi-jargon.contract.test.tsx,institutional-followup-only-after-selection.contract.test.tsx,institutional-cta-hierarchy.contract.test.ts}`; Evidenz: `docs/E150/PR-INSTITUTIONAL-CONFIGURATOR-02_FEINSCHLIFF_2026-04-19.md`. |
| PR-PRICING-VORMERKEN-SMARTER-01 | done | high | PR-PRICING-ABC-03, PR-INSTITUTIONAL-CONFIGURATOR-02 | Produktfuehrungs-Slice fuer klareren Privatpfad und smartere institutionelle Abschlusswege auf `/pricing`, `/vormerken`, `/pricing/institutionen` | Privatentscheidung verkuerzen, Initiative/Mitgliedschaft sichtbar machen und institutionellen Quote-/Kontaktpfad inkl. Pflichtangaben nutzbar und konsistent halten | `/pricing` bleibt kurz und entscheidungsorientiert mit drei Privatpaketen (`Interessiert` 0 € Mitglieder / 3,99 € regulaer, `Aktiv` 9,90 €, `Mitgestaltend` 29,90 €) plus sichtbarem Initiative-Hinweis; `/vormerken` trennt Privat und institutionell klar (Privat ohne Kostenvoranschlagsfokus, Mitgliedschaft als sichtbarer Block, Pflicht-Consents fuer Datenschutz/AGB/Kontakt); institutioneller Flow bietet Direktbestellung, Angebotsanfrage und Download-Kostenvoranschlag nur nach Pflichtangaben (Organisation, Ansprechpartner, Telefon, E-Mail, Zustimmungen); Kontaktwege sind klar gruppiert (Team, MS Teams, E-Mail, Telefon); Labels sind konsistent (`Zur Initiative`, `Triff deine Vorauswahl`), ohne Next-Steps-Restblock im Privatfluss | no | Erledigt (2026-04-19): Hardening in `apps/web/src/app/{pricing/page.tsx,pricing/institutionen/page.tsx,vormerken/page.tsx,api/edebatte/preorder/route.ts}` und `apps/web/src/components/pricing/PackagesGrid.tsx`; neue/aktualisierte Contracts `apps/web/tests/{pricing-private-member-price.contract.test.ts,pricing-initiative-link.contract.test.ts,vormerken-private-no-quote.contract.test.tsx,vormerken-membership-application-visibility.contract.test.tsx,private-package-capability-clarity.contract.test.ts,institutional-quote-download-requires-contact-fields.contract.test.tsx,institutional-contact-paths.contract.test.tsx,initiative-nav-label.contract.test.ts,no-next-steps-noise.contract.test.tsx,member-checkbox-flow.contract.test.tsx,vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx,pricing-page.contract.test.ts,no-legacy-price-logic.contract.test.tsx}`; Evidenz: `docs/E150/PR-PRICING-VORMERKEN-SMARTER-01_SMARTER_PRIVATE_AND_INSTITUTIONAL_FLOW_2026-04-19.md`. |
| PR-PRICING-MAIN-SIMPLIFY-01 | done | high | PR-PRICING-VORMERKEN-SMARTER-01 | `/pricing` als kurze, klare Privat-Entscheidungsseite ohne Zwischenblock-Drift | Hauptseite auf hero-kurz + 3 Privatpakete + klare Mitgliedschaftseinordnung + nachgeordneten B2B/B2G-Hinweis reduzieren | Hero ist auf Headline + 1 Satz + 2 CTAs reduziert; 3 Privatpakete sind der sichtbare Hauptpfad; Paketkarten zeigen Preis/Fuer-wen/Enthalten/Unterschied mit konkreteren Leistungsbegriffen (u. a. Swipes, Guided Flow, Human Loop, optionale Add-ons); separater Mittelblock `Was du konkret machen kannst` ist entfernt; Mitgliedschaft ist kompakt klar (0 € Mitglied / 3,99 € regulaer, Beitrag unabhaengig, Empfehlung 5,63 €, finale E-Mail-Bestaetigung, Trenn-/Sicherheitslogik); B2B/B2G bleibt kurzer Nebenpfad auf `/pricing/institutionen`; mobile/wrapper/i18n Contracts bleiben gruen | no | Erledigt (2026-04-19): Umsetzung in `apps/web/src/app/pricing/page.tsx`, konkretisierte private Paketleistungen in `features/pricing/domain/{plans.de.ts,plans.en.ts}`, Karteninhalt in `apps/web/src/components/pricing/PackagesGrid.tsx`; neue Contracts `apps/web/tests/{pricing-main-page-simplified-decision-flow.contract.test.ts,pricing-membership-block-clarity.contract.test.ts,pricing-package-capabilities-visible.contract.test.ts,pricing-no-extra-middle-blocks.contract.test.ts,pricing-b2b-secondary-only.contract.test.ts,pricing-mobile-decision-hierarchy.contract.test.ts}` plus Updates in bestehenden Pricing-Contracts; Evidenz: `docs/E150/PR-PRICING-MAIN-SIMPLIFY-01_PRIVATE_DECISION_PAGE_2026-04-19.md`. |
| PR-PRICING-MAIN-SIMPLIFY-02 | done | medium | PR-PRICING-MAIN-SIMPLIFY-01 | Feinschliff fuer noch klarere mobile Entscheidungsfuehrung auf `/pricing` | Karten-Information komprimieren, Mitgliedschaft visuell zuspitzen, CTA-Verben vereinheitlichen und Nebenpfad weiter beruhigen | Compact-Karten fassen `Für wen`+`Wofür gedacht` in einem Block zusammen; Mitgliedschaft zeigt Kernpreise (0 € Mitglied / 3,99 € regulaer) als sichtbare Highlights; CTA-Verben auf Privatpaketen sind parallel (`Beitragen`/`Prüfen`/`Entwerfen`, EN: `Contribute`/`Review`/`Draft`); EN-Copy wirkt ruhiger (weniger technisch); B2B/B2G-Hinweis bleibt 1 Satz + 1 CTA mit reduzierter visueller Lautstärke; Contracts fuer Pricing-Hierarchie, Membership-Block, Capability-Sichtbarkeit und mobile/wrapper bleiben gruen | no | Erledigt (2026-04-19): Feinschliff in `apps/web/src/{app/pricing/page.tsx,components/pricing/PackagesGrid.tsx}` sowie `features/pricing/domain/{plans.de.ts,plans.en.ts}`; Contract-Updates in `apps/web/tests/{pricing-membership-block-clarity.contract.test.ts,pricing-package-logic-aligned-with-create.contract.test.tsx}`; Verifikation u. a. `pricing-*` Contract-Suite + `wrapper-*` Contracts + `tsc --noEmit`; Evidenz: `docs/E150/PR-PRICING-MAIN-SIMPLIFY-02_DECISION_HIERARCHY_MICRO_POLISH_2026-04-19.md`. |
| PR-PRICING-ORDER-INITIATIVE-01 | done | high | PR-PRICING-MAIN-SIMPLIFY-02, PR-INSTITUTIONAL-CONFIGURATOR-02 | Routing-/Copy-Feinschliff fuer `/pricing`/`/order`/`/pricing/institutionen` inkl. Initiative-Pfad und Quote-Mail-Link | Kanonischen Folgepfad auf `/order` ziehen, `howtoworks`-Initiativepfad vereinheitlichen und institutionellen Kostenvoranschlag nur nach Pflichtangaben als separaten Mail-Link ausgeben | `/pricing` verweist neben Initiative auch auf `/howtoworks/edebatte`; `howtoworks`-Links nutzen `/howtoworks/initiative`; `/order` ist kanonischer Paketstart, `/vormerken` bleibt als kompatibler Altpfad nutzbar; Vorbelegung (`?paket=...`) bleibt flexibel umschaltbar; doppelte Anzeige des ausgewählten Pakets im Hauptflow ist entfernt; institutioneller Download wird nicht lokal erzeugt, sondern erst nach Pflichtangaben per separater E-Mail mit Downloadlink bereitgestellt; Wrapper-/Shell-Contracts akzeptieren `/order` und `/vormerken` konsistent | no | Erledigt (2026-04-19): Routen-/Link-Harmonisierung in `apps/web/src/{app/order/page.tsx,app/vormerken/page.tsx,app/pricing/page.tsx,app/pricing/institutionen/page.tsx,app/howtoworks/page.tsx,app/howtoworks/initiative/page.tsx,app/register/preorder/page.tsx,app/register/registerFlowBridge.ts,app/account/AccountClient.tsx,components/SiteFooter.tsx,app/(components)/SiteHeader.tsx,app/[locale]/referenzarchitektur/page.tsx}` sowie Domain-/Route-SSOT in `features/pricing/domain/{plans.de.ts,plans.en.ts,journey.de.ts,institutionalPricing.de.ts}` und Wrapper-Contracts `apps/web/src/features/wrapper/{mobileAppShellContract.ts,mvpSurfaceContract.ts,productSurfaceLayoutContract.ts}`; neue Quote-Mail-Link-Endpoints `apps/web/src/app/api/edebatte/preorder/{quote-download-link/route.ts,quote-download/route.ts}`; Tests u. a. `apps/web/tests/{institutional-quote-download-link.route.test.ts,pricing-page.contract.test.ts,pricing-institutionen-page.contract.test.ts,pricing-i18n.contract.test.ts,pricing-institutionen-i18n.contract.test.ts,institutional-pricing-link.contract.test.tsx,institutional-quote-download-requires-contact-fields.contract.test.tsx,register-preorder.redirect.test.ts,auth-registration-flow.contract.test.ts,vormerken-package-logic-aligned-with-pricing.contract.test.tsx,mobile-app-shell-contract.test.ts,wrapper-mvp-surface-contract.test.ts,pricing-cta-targets.contract.test.ts}`; Evidenz: `docs/E150/PR-PRICING-ORDER-INITIATIVE-01_ROUTE_ALIAS_QUOTE_MAIL_2026-04-19.md`. |
| PR-THEMENRADAR-01 | done | high | GOV-CIVIC-04, PR-AI-CREATE-01C | Erste operatorische Themenradar-Surface `/admin/themenradar` mit review-first Content-Prep bis share-ready | Heisse Themen als staff-/operatorisches Arbeitsobjekt erfassen, bewerten, CI-tauglich vorbereiten und bis `review_ready` nachvollziehbar fuehren, ohne Auto-Publish-Bypass | Neue Admin-Route `/admin/themenradar` (Liste + Statusfilter + Detail), typed Themenradar-Contract mit fixen Guardrails (`reviewRequired=true`, `autoPostEligible=false`, `officialSocialRequiresReview=true`), assistiver Content-Prep-Generator, share-ready Snapshot via bestehendem `shareReadyAssetContract`, aggregierte Campaign-/Conversion-Telemetry-Form (`clicks`/`leads`/`memberships`), optionale `issue_signal`-Importspur aus `/create` als nachgelagerter Pfad, keine neue oeffentliche Surface/keine Auto-Posting-Engine | no | Erledigt (2026-04-19): Neue Module `features/themenradar/{contracts.ts,contentPrep.ts,shareReady.ts,telemetry.ts,store.ts,index.ts}`; Admin-API `apps/web/src/app/api/admin/themenradar/**`; UI `apps/web/src/app/admin/themenradar/{page.tsx,[id]/page.tsx}` + Nav-/Dashboard-Eintrag in `apps/web/src/app/admin/{adminNav.ts,page.tsx}`; Lifecycle-/Action-Hardening mit klaren Konfliktantworten (`409`) fuer invalid transitions/locked states; Tests `apps/web/tests/{themenradar-contracts.test.ts,themenradar-guardrails.contract.test.ts,themenradar-routing-status.route.test.ts,themenradar-actions.route.test.ts,themenradar-share-ready-consistency.contract.test.ts,themenradar-telemetry-shape.contract.test.ts}`; Evidenz: `docs/E150/PR-THEMENRADAR-01_VOG_THEMENRADAR_OPERATOR_SURFACE_2026-04-19.md`. |
| PR-THEMENRADAR-02 | done | high | PR-THEMENRADAR-01 | Produktionsnahes Themenradar-Hardening: Persistenz, Audit-Spur, Lifecycle-Gates, UI-Render-Absicherung und reportfaehige Telemetrie | Themenradar fuer Dauerbetrieb stabilisieren (persistent statt runtime/in-memory, nachvollziehbarer Freigabepfad, robustere Operator-UI), ohne Guardrail-Aufweichung oder neue Parallelwelt | Themenradar nutzt persistente Repo-/Collection-Basis inkl. Operator-Indexen; append-only Audit-Log dokumentiert `created`/`qualified`/`content_prep_generated`/`review_ready_set`/`share_ready_generated`/`published_set`/`archived` inkl. Actor+Zeit; serverseitige Transition-Gates liefern klare 409-Konflikte (u. a. `review_ready` nur via share-ready, `published` nur explizit aus `review_ready`); Datenmodell ist um Betriebsfelder (`createdBy`, `updatedBy`, `lastReviewedBy`, `lastReviewedAt`, `reviewNotes`, `auditVersion`, `archivedAt`, `archivedBy`) erweitert; Admin-Render-/Mobile-/Dark-Contracts fuer Liste/Detail vorhanden; Telemetrie bietet reportfaehige Aggregations-Shape; Guardrails bleiben unveraendert (`no auto publish`, `autoPostEligible=false`, `officialSocialRequiresReview=true`) | no | Erledigt (2026-04-19): Persistenter Repo-Layer in `features/themenradar/server/repo.ts` und Async-Store-Hardening in `features/themenradar/store.ts`; API-Hardening inkl. Report-Route `apps/web/src/app/api/admin/themenradar/{route.ts,[id]/route.ts,[id]/content-prep/route.ts,[id]/share-ready/route.ts,[id]/telemetry/route.ts,report/route.ts}`; UI-Feinschliff in `apps/web/src/app/admin/themenradar/{page.tsx,[id]/page.tsx}`; Tests u. a. `apps/web/tests/{themenradar-persistence.contract.test.ts,themenradar-repo.integration.test.ts,themenradar-audit-trail.contract.test.ts,themenradar-lifecycle-transition-guard.contract.test.ts,themenradar-admin-page.render.test.tsx,themenradar-detail-page.render.test.tsx,themenradar-mobile-layout.contract.test.tsx,themenradar-darkmode.contract.test.tsx,themenradar-telemetry-report-shape.contract.test.ts,themenradar-telemetry-report.route.test.ts}`; Evidenz: `docs/E150/PR-THEMENRADAR-02_PERSISTENCE_AUDIT_HARDENING_2026-04-19.md`. |
| PR-OPS-STATUS-REPORT-01 | done | high | PR-THEMENRADAR-02 | Interner Plattform-Statusreport per SMTP mit Scheduler 05:00/17:00, aktiven AI-Smokes und robuster Laufhistorie | Plattformzustand und AI-Routen zweimal taeglich ehrlich pruefen und als kompakten Ops-Bericht versenden, ohne Marketing-/Autopublish-Drift | Interner Scheduler laeuft im Node-Runtime-Pfad und bedient feste Slots (`05:00`, `17:00`, `Europe/Berlin`) mit Grace-Window; Slot-Dedupe verhindert Doppelversand pro Slot; Report sammelt Plattform-/AI-/Themenradar-/Order-Pfade aktiv (inkl. `/api/contributions/analyze` und `/api/create/analyze` Smoke + degraded/fallback-Erkennung); SMTP-Versand ist ENV-gesteuert (`STATUS_REPORT_*`) und faellt bei fehlender SMTP-Konfig nicht still auf \"alles ok\" zurueck; persistente Run-Historie (started/completed/status/mailSent/error/report) bleibt nachvollziehbar; interne Admin-Route fuer Run/History vorhanden (`/api/admin/ops/status-report`) | no | Erledigt (2026-04-19): Neue Statusreport-Module `apps/web/src/features/ops/statusReport/{contracts.ts,config.ts,repo.ts,collect.ts,mail.ts,run.ts,scheduler.ts,index.ts}`; Scheduler-Start via `apps/web/src/instrumentation.ts`; Admin-API `apps/web/src/app/api/admin/ops/status-report/route.ts`; ENV-Doku in `apps/web/.env.example`; Tests `apps/web/tests/{status-report-shape.contract.test.ts,ai-route-smoke.contract.test.ts,ai-route-fallback-status.contract.test.ts,status-report-mail-render.contract.test.ts,status-report-scheduler.contract.test.ts,status-report-no-double-send.contract.test.ts,smtp-config-guard.contract.test.ts}`; Evidenz: `docs/E150/PR-OPS-STATUS-REPORT-01_AUTOMATED_STATUS_EMAILS_2026-04-19.md`. |
| PR-OPS-STATUS-REPORT-02 | done | high | PR-OPS-STATUS-REPORT-01 | Importgrenze-Hardening fuer Instrumentation/Scheduler sowie Ops-Run-Polish (`health_only`, Recipient-Guard, Mail-Layout) | Reproduzierbaren Next/Webpack-Buildfehler aus der Instrumentation-Kette entfernen und Statusreport fachlich/operativ nachhaerten, ohne Architekturumbau | `instrumentation.ts` zieht transitiv kein `run.ts`/`mailer.ts`/`repo.ts`/`mongodb`/`nodemailer`; Scheduler triggert Due-Slots nur ueber runtime-separaten Internal-Endpoint; `health_only`-Manual-Runs funktionieren ohne `STATUS_REPORT_RECIPIENTS` und persistieren den Lauf ohne Mailversand; Full-Runs behalten Recipient-Pflicht und filtern effektiv auf `rgf@voiceopengov.de`; optionales `STATUS_REPORT_SLOTS` CSV ist robust mit Fallback; Mail-Subject/HTML/Text sind als ruhiger Ops-Report modernisiert; Validierung (`rm -rf apps/web/.next`, Typecheck, Build, status-report Contracts) ist gruen | no | Erledigt (2026-04-22): Scheduler-Boundary/Runtime-Trigger in `apps/web/src/features/ops/statusReport/{instrumentation.ts,scheduler.ts,schedulerTrigger.ts}` und neuer Internal-Route `apps/web/src/app/api/internal/ops/status-report/scheduled/route.ts`; Admin-Run-API + Manual-Run-Typen in `apps/web/src/app/api/admin/ops/status-report/route.ts` und `apps/web/src/features/ops/statusReport/run.ts`; Config-Hardening (`STATUS_REPORT_SLOTS`, Recipient-Filter) in `apps/web/src/features/ops/statusReport/{contracts.ts,config.ts}`; Mail-Redesign in `apps/web/src/features/ops/statusReport/mail.ts`; ENV-Doku in `apps/web/.env.example`; neue/aktualisierte Tests `apps/web/tests/{status-report-config.contract.test.ts,status-report-health-only.contract.test.ts,status-report-no-double-send.contract.test.ts,status-report-mail-render.contract.test.ts,status-report-scheduler.contract.test.ts,smtp-config-guard.contract.test.ts}`; Evidenz: Build/Typecheck/Testlauf vom 2026-04-22. |
| PR-AI-CREATE-02 | done | high | PR-PRODUCT-SURFACES-HARM-01 | `/create` Single-Intake-Hardening + Analyze-Fehler-Retention + ehrliche Orchestrator-Smoke-Matrix | Doppelte Texteingabe auf `/create` entfernen, Nutzertext bei Analyze-Degraded/Fehlern lokal stabil halten und Admin-Smoke ohne OpenAI-only-Maskierung wieder provideruebergreifend ausweisen | `/create` hat nur noch ein primaeres Texteingabefeld (oberer Composer); `AnalyzeWorkspace` rendert im eingebetteten `/create`-Pfad kein zweites allgemeines Hauptfeld; Analyze-Start aus dem oberen Composer loest eingebettete Analyse ueber `autoRunToken` aus; lokaler Draft-Snapshot stellt oberen Composer-Text nach Reload/Remount wieder her; Smoke-Route gibt bei Fehlern/Meta-Faellen die Provider-Matrix (`ok`/`disabled`/`skipped`/`failed`) ohne OpenAI-only-Fallback aus und trennt `orchestratorOk` von `createAnalyzeApi`; Validierung (`rm -rf apps/web/.next`, `pnpm -C apps/web typecheck`, `pnpm --filter @vog/web build`) und gezielte Contracts sind gruen | no | Erledigt (2026-04-22): Umsetzung in `apps/web/src/app/create/CreateClient.tsx`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`, `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`; Tests erweitert/neu: `apps/web/tests/{analyze-workbench-hidden-until-start.test.ts,create-analyze.workspace-ui.test.ts,admin-ai-orchestrator-smoke.route.test.ts,no-duplicate-primary-worksurface-on-create.test.ts,create-entry-hierarchy.contract.test.tsx}`; Verifikation via Typecheck/Build + Vitest-Suite am 2026-04-22. |
| PR-AI-ORCH-SMOKE-03 | done | high | GOV-AI-ORCH-05, PR-AI-CREATE-02 | Lokales Runtime-/Smoke-Hardening fuer Admin-Orchestrator (`/api/admin/ai/orchestrator-smoke` + `/admin/telemetry/ai/orchestrator`) | Lokale Provider-Fails reproduzierbar diagnostizieren und echte Fehlerursachen im Smoke/UI sichtbar machen, ohne Journey-Architektur umzubauen | Provider-Ergebnisse transportieren `reason`/`errorMessage`/`errorKind`/`status`/provider-spezifischen Fehlercode statt Leerwerten; Runtime-Smoke nutzt `validationMode=json_only` fuer echten Connectivity-/Adapter-Check und trennt ihn weiter vom Full-Smoke (`mode=full`); OpenAI-JSON-Calls vermeiden reasoning-only-Leerantworten; Anthropic-/Gemini-Model-404 haben Runtime-Fallback auf aktuelle Modelle; Mistral nutzt JSON-Response-Format fuer robustere Parsebarkeit; ARI bleibt im Standard-Journey-Smoke mit `not_in_journey_plan` legitim `skipped`; Validierung (`rm -rf apps/web/.next`, `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`, `pnpm --filter @vog/web build`, gezielte Vitest-Smoke/Degraded-Suite) ist gruen | no | Erledigt (2026-04-24): Fehlertransport-Hardening in `features/ai/orchestratorE150.ts` und `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`; Provider-Runtime-Fixes in `features/ai/providers/{openai.ts,anthropic.ts,mistral.ts,gemini.ts}`; UI-Haertung in `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx` (plus Dauer-Fallback in `apps/web/src/app/admin/telemetry/ai/page.tsx`); Test-Update in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`; lokale Diagnostik ergab vorher u. a. `OPENAI_EMPTY_OUTPUT` (gpt-5 reasoning-only), `MODEL_NOT_FOUND` (veraltete Anthropic-/Gemini-Modelle) und `BAD_JSON`-Surface-Drift. |
| PR-AI-TELEMETRY-DIAG-01 | done | high | PR-AI-ORCH-SMOKE-03 | Admin-Telemetrie v2 fuer direkte Provider-Probes, getrennte Testmodi, gruppierte Recent-Runs und operatorische Diagnosen | Erreichbarkeit, Adapter-Runtime, Orchestrator-Entscheidung, JSON-Parse und Schema-Vertrag im Admin sichtbar trennen, ohne BAD_JSON zu verstecken oder ARI im Journey-Plan kuenstlich zu erzwingen | `/admin/telemetry/ai/orchestrator` trennt `Direktpruefung Provider`, `Runtime Smoke`, `Full Analyze Contract`; Direct Probe prueft `openai/anthropic/mistral/gemini/ari` unabhaengig vom Journey-Plan und zeigt bei ARI-Config-Luecken `config_missing`; Smoke-Route transportiert pro Provider strukturiert `mode/status/errorKind/providerErrorCode/httpStatus/errorMessage/reason/parseStatus/schemaStatus/rawExcerpt/journeyDecision/rootCause/nextAction`; `/api/admin/telemetry/ai/events` liefert runId-gruppierte Runs mit Child-Providerdetails; `/admin/telemetry/ai` und `/admin/telemetry/ai/dashboard` zeigen Root-Cause/Next-Action, expandierbare Details, ARI- und GPT/OpenAI-Status sowie Reliability-/Cost-Teilbereiche; bestehende Smokes/Contracts bleiben gruen | no | Erledigt (2026-04-24): neue Diagnose-Helfer `apps/web/src/features/ai/adminTelemetryDiagnostics.ts` und Run-Store `apps/web/src/features/ai/adminTelemetryStore.ts`; Umbau `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` (Modes `probe/runtime/full`, Direct Adapter Probes inkl. ARI, BAD_JSON/Schema-Klassifikation, runId/correlationId); Events-Grouping in `apps/web/src/app/api/admin/telemetry/ai/events/route.ts`; UI-Rework in `apps/web/src/app/admin/telemetry/ai/{orchestrator/page.tsx,page.tsx,dashboard/page.tsx}`; Tests: `apps/web/tests/{admin-ai-orchestrator-smoke.route.test.ts,admin-ai-telemetry-events.route.test.ts,admin-ai-telemetry-ui.contract.test.ts}`. |
| PR-AI-TELEMETRY-DIAG-02 | done | high | PR-AI-TELEMETRY-DIAG-01 | Full-Contract BAD_JSON Diagnose-Hardening nach gruenen Provider-Probes | Full Analyze Contract sauber zwischen Parse-Fehler (`BAD_JSON`) und Schema-Fehler (`SCHEMA_INVALID`) trennen und verwertbare Operator-Diagnose transportieren, ohne Provider-Reachability falsch als down zu markieren | Full-Contract nutzt robuste JSON-Kandidaten-Extraktion (fenced JSON / prose+JSON mit klar begrenztem Objekt) ohne Felder zu erfinden; malformed JSON liefert `BAD_JSON` inkl. `parseError`/`rawExcerpt`; schema-invalid JSON liefert `SCHEMA_INVALID` inkl. `schemaError`/`schemaPath`; UI/Telemetry zeigt Parse- vs Schema-Status getrennt; bestehende Provider-Probe-/Runtime-Signale bleiben unveraendert; Validierung (`rm -rf apps/web/.next`, `pnpm -C apps/web lint`, `pnpm -C apps/web typecheck`, `pnpm --filter @vog/web build`, gezielte Vitest-Suites) ist gruen | no | Erledigt (2026-04-24): JSON-Normalisierung/Schema-Diagnose in `features/ai/orchestratorE150.ts` erweitert (`extractJsonCandidate`, `parseError`, `schemaError`, `schemaPath`, `rawExcerpt`); Full-Contract-Validierung und Feld-Transport in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` gehaertet; Tests fuer fenced/prose/malformed/schema-invalid in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`; UI-Contract fuer getrennte Parse-/Schema-Details in `apps/web/tests/admin-ai-telemetry-ui.contract.test.ts`. |
| PR-AI-TELEMETRY-DIAG-03 | done | high | PR-AI-TELEMETRY-DIAG-02 | Provider Contract Capability Layer + Repair-Diagnostik fuer Direct Full Contract | Strict-vs-repaired-vs-blocked Contractfaehigkeit pro Provider transparent machen, ohne Schema-Aufweichung, ohne stille Normalisierung, ohne Produktivnutzung von repaired Outputs | Zentrale Capability-Funktion (`getProviderContractCapabilities`) beschreibt strict/json_object/repair-Strategie je Provider; Direct Full Contract fuehrt strict Validation unveraendert aus und versucht Repair nur bei reparierbaren Contract-Shape-Fehlern (`TOP_LEVEL_ARRAY`, `TOP_LEVEL_STRING`, `TOP_LEVEL_NOT_OBJECT`, `SCHEMA_INVALID`, `BAD_JSON`); non-repairable/account/runtime-Blocker (`RATE_LIMIT`, `PAYMENT_REQUIRED`, `UNAUTHORIZED`, `CONFIG_MISSING`, `TIMEOUT`, `RESOURCE_EXHAUSTED`) triggern keinen Repair; Diagnosefelder (`strictStatus`, `strictProviderErrorCode`, `strictSchemaPath`, `repairAttempted`, `repairStatus`, `repairProviderErrorCode`, `repairSchemaPath`, `repairReason`, `finalContractStatus`) sind in API+UI sichtbar; `repaired_degraded` bleibt als degraded markiert und taeuscht kein strict_ok vor; Validierung (`pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`) ist gruen | no | Erledigt (2026-04-28): Capability-/Repair-Logik in `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`; Direct-Full-Contract Strict/Repair-Execution inkl. Repair-Prompt und block/non-repairable Gate in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`; UI-Details/Ampel fuer strict vs repair in `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`; Tests erweitert in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts` und Typanpassung in `apps/web/tests/admin-ai-telemetry-events.route.test.ts`. |
| PR-AI-TELEMETRY-DIAG-04 | done | high | PR-AI-TELEMETRY-DIAG-03 | Provider-specific native structured output upgrades (Issue #42) | Provider-spezifische native Contract-Strategien und Adapter-Metadaten transparent machen, ohne Schema-Aufweichung und ohne Repair als Primärstrategie | Capability-Matrix transportiert `nativeStrategy`/`preferredContractStrategy`/`fallbackStrategy`/`diagnosticNotes` belegbar aus dem Adapter-Stand; OpenAI `formatUsed`/`didFallback` wird in Direct Full Contract Diagnostics sichtbar; Anthropic bleibt ohne native tool-use Pfad als `prompt_envelope` klassifiziert (TODO dokumentiert); Mistral bleibt mit `response_format=json_object` als `json_object_envelope` klassifiziert (TODO für native schema Pfad dokumentiert); Gemini 429/503 (`RESOURCE_EXHAUSTED`/`UNAVAILABLE`) bleibt blocked/non-repairable; ARI 402 (`PAYMENT_REQUIRED`) bleibt blocked/non-repairable; Repair bleibt nur `repaired_degraded`; Validierung (`pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `pnpm -C apps/web exec vitest run tests/admin-ai-telemetry-events.route.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`) ist gruen | no | Erledigt (2026-04-28): Issue `#42` umgesetzt in `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`, `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`, `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`; Tests erweitert in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts` und `apps/web/tests/admin-ai-telemetry-events.route.test.ts`; keine neuen Dependencies, kein stilles Salvage, AnalyzeResultSchema bleibt SSOT. |
| PR-AI-TELEMETRY-DIAG-05 | done | high | PR-AI-TELEMETRY-DIAG-04 | Stabilize OpenAI strict AnalyzeResult contract path (Issue #43) | OpenAI-Direct-Full-Contract diagnostisch stabilisieren: strict Pfad bevorzugt nativ halten, bei Fehlern Modell/Timeout/Format/Fallback/Grund eindeutig sichtbar machen, ohne Schema-Aufweichung und ohne Repair-as-strict | OpenAI-Direct-Diagnose zeigt `nativeStrategy`/`preferredContractStrategy`/`fallbackStrategy` plus `model`, `timeoutMs`, `maxOutputTokens`, `formatUsed`, `didFallback`, `openaiErrorCode`, `openaiErrorMessage`; `OPENAI_SMOKE_MODEL`/`OPENAI_SMOKE_TIMEOUT_MS`/`OPENAI_SMOKE_MAX_OUTPUT_TOKENS` sind in der Diagnose nachvollziehbar (inkl. Default-Source); `TIMEOUT` bleibt blocked/non-repairable ohne Repair-Versuch; `OPENAI_EMPTY_OUTPUT` bleibt explizit klassifiziert; `strict_ok` bleibt strikt und `repaired_degraded` wird nicht als strict maskiert; Validierung (`pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`) ist gruen | no | Erledigt (2026-04-28): Issue `#43` umgesetzt in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`, `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`, `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`; Tests erweitert in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts` (OpenAI format/fallback/error/smoke-profile metadata + strict json_schema success + timeout no-repair Guardrail). Zusatz-Härtung (2026-04-28, Folge-Slices): Full-Contract-Prompt/Beispiel für Consequence-`scope` Enums präzisiert (`Never use "local"`, `local_short`/`local_long` Mapping inkl. eventualities/decisionTrees-Pfaden) und per Smoke-Route-Test abgesichert; zusätzlich `report.facts.local`/`report.facts.international` als immer vorhandene Array-Pflichtfelder mit explizitem `[]`-Fallback und Never-omit-Regel im Prompt verankert, ebenfalls per Smoke-Route-Test abgesichert. |
| PR-AI-TELEMETRY-DIAG-06 | done | high | PR-AI-TELEMETRY-DIAG-05 | Stabilize primary provider strict contract paths (Folge zu #39, #42, #43) | Direct-Full-Contract-Pfade für OpenAI, Anthropic und Mistral auf echten strict Contract trimmen und Diagnose für Modell-/Envelope-Fehler eindeutig machen, ohne Schema-Aufweichung und ohne Grünfärbung von repaired Outputs | OpenAI Direct Full Contract nutzt hart das Smoke-Profil (`OPENAI_SMOKE_MODEL` oder Default `gpt-4.1-mini`) statt `OPENAI_MODEL`-Fallback; Diagnose zeigt `selectedSmokeModel`, `OPENAI_SMOKE_MODEL` present/missing, `effectiveModel`, `timeoutMs`, `maxOutputTokens`, `formatUsed`, `didFallback`; Modell-Mismatch (z. B. effektives `gpt-5` trotz gesetztem `OPENAI_SMOKE_MODEL`) wird explizit markiert inkl. Next Action; Anthropic/Mistral erhalten provider-spezifischen Full-Contract-Envelope-Prompt mit Top-Level-Objektpflicht, vollständigen Pflicht-Keys, `report.facts`-Pflichtarrays und `scope`-Enum-Guardrails; `strict_ok` bleibt strikt schema-validiert; Ampel zeigt für OpenAI/Anthropic/Mistral nur bei strict-ok grün, bei `repaired_degraded` gelb und bei failed/blocked rot; Validierung (`pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `pnpm -C apps/web exec vitest run tests/admin-ai-telemetry-events.route.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`) ist gruen | no | Erledigt (2026-04-28): umgesetzt in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`, `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`, `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`; Tests in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts` erweitert (OpenAI smoke-model precedence/mismatch + Anthropic/Mistral array-fail/full-object strict-ok + Prompt-Guards für no-top-level-array/report.facts/scope). |
| PR-AI-TELEMETRY-DIAG-07 | done | high | PR-AI-TELEMETRY-DIAG-06 | Deterministic AnalyzeResult Envelope Builder for provider drafts (Issue #45) | Direct-Full-Contract von fragilen Provider-Voll-Envelopes entkoppeln: strict weiterhin getrennt ausweisen, aber aus providerseitigen Drafts deterministisch einen vollständigen AnalyzeResult-Envelope bauen und hart gegen `AnalyzeResultSchema` validieren | Interner `DraftAnalysisSchema` + deterministischer Builder erzeugen immer einen vollständigen AnalyzeResult-Kandidaten mit sicheren Pflicht-Defaults (`report.facts.local/international`, leere Container, etc.) ohne fachliche Erfindung; `ConsequenceRecord.scope` bleibt strict-inkompatibel bei `local` im Direct-Strict-Pfad, wird im Build-Pfad nur mit Warning auf `local_short` normalisiert; Diagnose trennt `directStrictStatus`, `draftStatus`, `envelopeBuildStatus`, `finalSchemaStatus`, `finalContractStatus` sowie `buildWarnings`/`filledDefaults`/`missingContainers`/`normalizedEnumWarnings`/`generatedIds`; `built_valid` bleibt klar von `strict_ok` getrennt (gelb/degraded, nicht grün); Repair bleibt nur sekundärer Fallback; Validierung (`pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `pnpm -C apps/web exec vitest run tests/admin-ai-telemetry-events.route.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`) ist gruen | no | Erledigt (2026-04-28): Issue `#45` umgesetzt in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`, `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`, `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`; Tests in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts` erweitert (direct strict bleibt failed bei TOP_LEVEL_ARRAY, built_valid aus Draft, report.facts defaulting, scope-local-Warning, empty-draft-envelope). Referenz auf Vorarbeiten #39/#42/#43. |
| PR-AI-TELEMETRY-DIAG-08 | done | high | PR-AI-TELEMETRY-DIAG-07 | CLI provider smoke runner for primary providers (Issue #47) | Lokalen CLI/Bash-nahen Smoke-Runner für gezielte OpenAI/Anthropic/Mistral-Diagnosen bereitstellen, ohne Admin-Session im Browser und ohne Contract-Aufweichung | Neuer CLI-Entry `pnpm -C apps/web ai:provider-smoke` unterstützt `--provider/--providers` (inkl. `all-primary`) und `--mode=probe|runtime|full`; Full-Mode liefert Contract-Felder (`finalContractStatus`, `directStrictStatus`, `draftStatus`, `envelopeBuildStatus`, `finalSchemaStatus`, `repairStatus`, `schemaPath`) kompakt in Terminal + vollständig als JSON-Log unter `.logs/ai-smoke/<timestamp>-<mode>.json`; Exit-Policy: `strict_ok` immer success, `built_valid` nur mit `--allow-built-valid`, `repaired_degraded` nur mit `--allow-degraded`, `failed/blocked` non-zero; Secret-Redaction für Konsole/JSON aktiv; Gemini/ARI bleiben bewusst out-of-scope | no | Erledigt (2026-04-29): Implementierung in `apps/web/src/features/ai/{providerSmokeCli.ts,providerSmokeDirectRunner.ts}` und CLI-Script `apps/web/scripts/ai-provider-smoke.ts`, Script-Wiring in `apps/web/package.json`; Runtime-/Full-Direct-Diagnosen für OpenAI/Anthropic/Mistral inkl. OpenAI-Smoke-Profilmetadaten (`selectedSmokeModel`, `timeoutMs`, `maxOutputTokens`, `formatUsed`, `didFallback`) ergänzt; Follow-up-Fix (Issue #47 alignment): CLI-Full delegiert nun auf dieselbe Direct-Full-Pipeline wie `/api/admin/ai/orchestrator-smoke` (strict -> draft -> deterministic envelope build -> final schema -> repair fallback) statt vereinfachter Parallelprüfung; Folgefix (Issue #47 parser/smoke-profile hardening): CLI-Parser validiert Provider/Mode fail-fast (invalid values führen zu sofortigem Fehler statt stiller Defaults), und OpenAI-Full-Diagnose fällt im Fehlerpfad nicht mehr auf `OPENAI_MODEL` zurück, sondern bleibt beim Smoke-Modell (`OPENAI_SMOKE_MODEL` oder `gpt-4.1-mini`); Follow-up (2026-04-29): `gemini` als optionaler CLI-Provider ergänzt (`--provider=gemini`, Alias `all-optional`), `all-primary` bleibt unverändert bei `openai,anthropic,mistral`, Probe/Runtime laufen für Gemini über bestehende Adapterpfade, unknown Gemini pricing bleibt `costKnown=false`; Tests neu/erweitert in `apps/web/tests/ai-provider-smoke-cli.test.ts`; Validierung grün mit `pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `pnpm -C apps/web exec vitest run tests/admin-ai-telemetry-events.route.test.ts`, `pnpm -C apps/web exec vitest run tests/ai-provider-smoke-cli.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`. |
| PR-AI-COST-01 | done | high | PR-AI-TELEMETRY-DIAG-08 | AI cost telemetry and low-cost smoke profiles (Issue #52) | Provider-Smokes für OpenAI/Anthropic/Mistral günstiger und kosten-transparent machen, ohne Contract-Aufweichung | CLI unterstützt zusätzlich `--mode=full-lite`, `--dry-run`, `--no-repair`, `--max-output-tokens`; `full-lite` reduziert Output-Budgets gegenüber `full` und deaktiviert Repair standardmäßig als Cost-Guard; Full-Pipeline bleibt strict/draft/build/repair-semantisch unverändert (`strict_ok` nur direct strict, `built_valid` separat, `repaired_degraded` separat); zentrales `estimateAiRunCost({provider,model,tokensIn,tokensOut})` liefert `estimatedCostUsd`/`estimatedCostEur` nur bei bekannter Preiszuordnung, sonst `costKnown=false` mit `reason` (kein 0-EUR-Fake); Provider-Diagnosen transportieren `estimatedCost*`, `costKnown`, `pricingSource`, `runCostGroup`, `smokeMode`, `budgetProfile`; CLI Summary + JSON-Logs enthalten Providerkosten und Totals (unknown bleibt `n/a`); bestehendes invalid provider/mode fail-fast bleibt intakt; Validierung (`pnpm -C apps/web typecheck`, `pnpm -C apps/web exec vitest run tests/ai-provider-smoke-cli.test.ts`, `pnpm -C apps/web exec vitest run tests/admin-ai-orchestrator-smoke.route.test.ts`, `pnpm -C apps/web exec vitest run tests/admin-ai-telemetry-events.route.test.ts`, `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`) ist gruen | no | Erledigt (2026-04-29): Neue Kosten-Utility `apps/web/src/features/ai/aiCostTelemetry.ts`; Full-Runner-Optionen (`full-lite`, max tokens, repair policy) in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` + Bridge in `apps/web/src/features/ai/providerSmokeDirectRunner.ts`; CLI-Erweiterung inkl. Dry-Run-Plan, Kosten-Summary und Totals in `apps/web/src/features/ai/providerSmokeCli.ts` und `apps/web/scripts/ai-provider-smoke.ts`; UI-Detailanzeige für geschätzte Kosten mit `n/a` bei unknown in `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`; Tests erweitert in `apps/web/tests/ai-provider-smoke-cli.test.ts` (full-lite, dry-run, no-repair, token override, known/unknown pricing, JSON cost metadata). |
| PR-AI-RESEARCH-55 | done | high | #58, #59, PR-AI-COST-01 | Perplexity research env preparation + cheap smoke profile hardening (Issue #55, narrow scope) | Perplexity als optionalen Research-/Search-Provider vorbereiten und Probe/Runtime-Budgets fuer guenstige Diagnosen haerten, ohne Standard-Analyze-Abhaengigkeit auf Research-Provider | ENV-Vorbereitung fuer Perplexity ist dokumentiert (`PERPLEXITY_API_KEY`, `PERPLEXITY_BASE_URL`, `PERPLEXITY_SEARCH_MODEL`, `PERPLEXITY_TIMEOUT_MS`, `PERPLEXITY_MAX_OUTPUT_TOKENS`, `PERPLEXITY_DISABLED`, optional `PERPLEXITY_AGENT_MODEL`); Perplexity ist nur als `research_discovery/search` vorbereitet und nicht als strict Analyze-Provider oder Orchestrator; Entitlement-Terminologie (`search_credit`, `deep_research_credit`, `dossier_boost`, `research_supporter`, `initiator`) ist vorbereitet; Preis-/Produktnotizen fuer Search/Deep-Research sind dokumentiert; Probe/Runtime bleiben Tiny-Profile mit reduzierten Token-Budgets; unknown cost bleibt `costKnown=false`/`n/a` (nie 0 EUR); `all-primary` bleibt `openai,anthropic,mistral`, Gemini optional | no | Erledigt (2026-04-29): ENV-Ergaenzung in `apps/web/.env.example`; optionale Research-Rollen-/Entitlement-Konstanten in `apps/web/src/features/ai/researchProviderPolicy.ts`; Tiny-Budget-Haertung in `apps/web/src/features/ai/{providerSmokeCli.ts,providerSmokeDirectRunner.ts}` und `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`; Perplexity-Key-Redaction ergaenzt; Architektur-/Produktnotizen in `docs/E150/Part16_AI_Orchestration_and_Safety.md`; Hinweis: Slice bereitet #49 vor, implementiert aber bewusst nicht die volle Research Provider Abstraction. |
| PR-AI-ORCH-ROLE-01 | done | high | #58, #59, #48, PR-AI-RESEARCH-55 | Provider Role Routing für AI-Orchestrierung (Issue #48) | Zentrale Provider-Rollenmatrix und Lane-Policy als operationalen Routing-Entscheid für Admin-Diagnosen und künftige Orchestrierung verankern, ohne Abweichung vom graph-guided policy authority Modell | Zentrale Role-Matrix klassifiziert OpenAI (`strict_primary`, `draft_analysis`), Anthropic (`editorial_perspective`, `draft_analysis`), Mistral (`fallback_draft`, `draft_analysis`), Gemini (`optional_large_context`, `optional_multimodal`, `optional_draft`), Perplexity (`research_discovery`, `search`) und ARI (`premium_deep_research`, `arbiter`); Lane-Policy für `fast_draft`, `standard_analyze`, `dossier_enrichment`, `sealed_factcheck`, `premium_deep_research` ist zentral definiert; Admin-Smoke Response liefert `operationalSummary` mit `selectedLane`, `primaryAnalyzeProvider`, `draftFallbackProviders`, `optionalProviders`, `researchProviders`, `blockedProviders`, `productionEligible`, `researchRequired`, `nextAction`; `standard_analyze` bleibt ohne Research-Provider lauffähig, `sealed_factcheck`/`premium_deep_research` bleiben research-gated; Gemini bleibt optional und nicht strict-primary, Perplexity/ARI werden nicht zu Pflichtabhängigkeiten für Standard Analyze | no | Erledigt (2026-04-29): neue zentrale Routing-Logik in `apps/web/src/features/ai/providerRoleRouting.ts`; Integration in `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` (inkl. optionalem `lane` Query für Diagnostik); UI-Operational-Summary in `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`; Tests erweitert in `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts` (strict-primary Auswahl, built_valid-Fallback, optional/research Rollen, sealed_factcheck Gate). |
| PR-AI-RESEARCH-01 | done | high | #49, #48, #55, #58, #59, #64 | Research provider abstraction (Issue #49) | Research Layer v1 als zentrale, lane-/credit-gesteuerte Provider-Abstraktion einführen, ohne automatische Paid-Research-Calls und ohne Standard-Analyze-Abhängigkeit auf Research-Provider | Zentrale Research-Registry modelliert Provider-Status/Capabilities (`perplexity`, `ari`, `openai_deep_research`, Future-Provider) inkl. `availability`, `supportsSearch`, `supportsDeepResearch`, `supportsReports`, `requiresCredit`, `requiresExplicitLane`, `costKnown`; standardisierte Research-Typen (`ResearchQuery`, `ResearchResult`, `ResearchReport`, `ResearchProbeResult`, `ResearchProviderStatus`) sind vorhanden; Perplexity bleibt env-gated Scaffold (`PERPLEXITY_DISABLED=0` + Key) und nie strict Analyze-Provider; ARI bleibt premium/explicit only; OpenAI Deep Research bleibt separater Premium-Fallback mit eigenem ENV-Namespace (`OPENAI_DEEP_RESEARCH_*`) und ohne impliziten Rückfall auf `OPENAI_MODEL`/`OPENAI_SMOKE_MODEL`; Provider Role Routing + Admin-Orchestrator-Diagnostik zeigen Research-Felder (`selectedResearchProvider`, `availableResearchProviders`, `blockedResearchProviders`, Credit-Gates, Safe-to-run-Flags) und halten `standard_analyze` research-unabhängig; keine automatische Paid-Research-Ausführung, keine Checkout-UI | no | Erledigt (2026-04-29): neue Registry/Typen in `apps/web/src/features/ai/researchProviderRegistry.ts`, Scaffold-Adapter in `apps/web/src/features/ai/researchProviderAdapters.ts`, Policy-Update in `apps/web/src/features/ai/researchProviderPolicy.ts`, Routing/Operational-Summary-Hardening in `apps/web/src/features/ai/providerRoleRouting.ts`, UI-Diagnostik-Update in `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`, ENV-Erweiterung in `apps/web/.env.example`; Tests erweitert in `apps/web/tests/{admin-ai-orchestrator-smoke.route.test.ts,ai-provider-smoke-cli.test.ts}`. |
| PR-OUT-ENGINE-01 | done | high | Issue #27 | Output Engine SSOT + Contracts Foundation | Verbindliche Basis fuer Output Engine / Studio als dossier-gebundenen, review-pflichtigen Ausleitungspfad schaffen | SSOT-Doku fuer Output Engine / Studio ist vorhanden; `OutputPackage`/`DistributionOutput`/Review-Canon sind dokumentiert; Pflichtregeln `dossierId`, `generatedAt`, `sourceState`, `sourceTraces`, CTA + Dossier-Backlink, no auto-publish sind festgeschrieben | no | Erledigt (2026-04-29): neue SSOT `docs/E150/output-engine-studio.md`; Vertragsbasis in `features/outputEngine/contracts.ts`; Referenzierung auf Issues #27/#29/#30 und Slice-Plan #27-#36 aufgenommen. |
| PR-OUT-ENGINE-02 | done | high | PR-OUT-ENGINE-01, Issue #29 | Deterministischer Output Package Generator Core | Dossier-Daten deterministisch in review-faehiges OutputPackage transformieren, ohne externe AI-Pflichtpfade | `generateOutputPackage(dossier, options)` erzeugt formatunabhaengiges Paket mit `title`, Kurz-/Strukturzusammenfassung, Source-State/Traces, Open Questions, Optionen, CTA und QR-Backlink; unvollstaendige Dossiers markieren `needs_review` + `needs_input`; `published` ist nie Default; kein Auto-Publish | no | Erledigt (2026-04-29): Implementation in `features/outputEngine/generator.ts` inkl. deterministischer Package-ID, review/completeness Marker, Distribution-Output-Stubs fuer alle Ziel-Formate. |
| PR-OUT-ENGINE-03 | done | high | PR-OUT-ENGINE-02, Issue #30 | Demo-Dossier Seed + Output Engine Foundation Tests | Validierbaren Referenzpfad vom Demo-Dossier zum gueltigen OutputPackage inkl. Guardrail-Tests liefern | Demo-Fixture erzeugt valides OutputPackage; Tests decken Missing-Sources/-Options, Required-Fields, Review-Default != `published`, Typed Formats, Sichtbarkeit von Unsicherheiten/Open Questions und no-auto-publish ab | no | Erledigt (2026-04-29): Demo-Fixture `features/outputEngine/demoDossier.ts`; Exporte in `features/outputEngine/index.ts`; Tests `apps/web/tests/output-engine.foundation.test.ts`. |
| PR-OUT-ENGINE-04 | codex_ready | high | PR-OUT-ENGINE-03 | Studio Review Workspace Shell | Minimalen Studio-Workspace fuer Preview/Review-Queues und manuelle Freigabegrenzen aufbauen | Studio-Shell zeigt Queue + Paketstatus + Review-Aktionen ohne Distribution-Automatismus; eindeutige Dossier-Ruecklinks und Source-Transparenz bleiben sichtbar | no | Offen nach Foundation-Slice 01-03. |
| PR-OUT-ENGINE-05 | codex_ready | high | PR-OUT-ENGINE-04 | Format Mapper Layer (Article/Briefing/Letter/Administrative Note) | Stub-Ausgaben in kanalnahe Textformate ueberfuehren, weiterhin review-gated | Deterministische Mapper je Format; Quellen-/Unsicherheitsabschnitt bleibt erhalten; kein Auto-Publish | no | Offen nach Foundation-Slice 01-03. |
| PR-OUT-ENGINE-06 | open | medium | PR-OUT-ENGINE-05 | Social Carousel Mapper + Visual Template Contract | Social-Carousel-Ausgabe als review-pflichtiges Mapping aus OutputPackage ausleiten | Slide-Struktur + Quellenhinweis + Dossier-Backlink contractualisiert; keine direkte API-Auslieferung | no | Offen nach Foundation-Slice 01-03. |
| PR-OUT-ENGINE-07 | open | medium | PR-OUT-ENGINE-05 | Voiceover/Reel/Podcast Script Mapper | Audio-/Script-Formate aus OutputPackage in neutrales Script-Template ueberfuehren | Script-Outputs behalten Quellen-/Unsicherheitskontext und CTA-Ruecklink; bleiben `needs_review` bis explizit freigegeben | no | Offen nach Foundation-Slice 01-03. |
| PR-OUT-ENGINE-08 | open | medium | PR-OUT-ENGINE-05 | QR/Print Output Composition | QR-/Print-Output-Vertraege fuer dossier-gebundene Offline-Ausleitung absichern | QR target + CTA + Dossier-Backlink sind verpflichtend; Print-Output zeigt Quellen-/Review-Status sichtbar | no | Offen nach Foundation-Slice 01-03. |
| PR-OUT-ENGINE-09 | open | medium | PR-OUT-ENGINE-04, PR-OUT-ENGINE-05 | Distribution Handoff (manual release only) | Manuelle, review-gebundene Distribution-Weitergabe ohne Auto-Veröffentlichung vorbereiten | Handoff erfordert explizite Freigabe; keine Auto-Publish-Flows; Auditierbare Zustandswechsel zwischen `approved`/`published`/`archived` | no | Offen nach Foundation-Slice 01-03. |
| PR-AI-ORCH-POLICY-01 | codex_ready | high | #58 (architecture decision), #48 (Provider Role Routing), #49 (Research Provider Abstraction), #55 (Perplexity/Cheap-Smoke/Research-Credits) | Graph-guided policy orchestration authority | Verbindlichen Architekturentscheid dokumentieren und in den Implementierungsstrang ueberfuehren: eDebatte nutzt graph-guided policy orchestration (nicht ARI-orchestrated, nicht graph-only orchestrated) | OpenTasks und E150-Architektur dokumentieren bindend: Graph liefert Wissen/Kontext/State/Zustaendigkeiten, aber waehlt nicht frei Provider; Orchestrator/Policy Engine bleibt deterministischer/auditierbarer Kontrollpfad fuer Lane/Provider/Research/Cost/Fallback/Publishability; ARI bleibt optionales Premium-Deep-Research-Tool und nie Core-Orchestrator; Perplexity bleibt optionales Search-/Research-Discovery-Tool; Standard Analyze bleibt ohne Perplexity/ARI lauffaehig; AnalyzeResultSchema bleibt SSOT; Lane-Modell (`fast_draft`, `standard_analyze`, `dossier_enrichment`, `sealed_factcheck`, `premium_deep_research`) ist explizit verankert | no | Architekturentscheid aus #58 ist bindend. Folge-Implementierung muss ueber #48/#49/#55 diese Autoritaetsgrenzen in Rollenrouting, Research-Tool-Abstraktion und Cost-/Credit-Pfaden durchziehen. |

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

1. `PR-OUT-ENGINE-04` — Studio Review Workspace Shell (Folgeslice nach #27/#29/#30 Foundation).
2. `PR-OUT-ENGINE-05` — Format Mapper Layer (Article/Briefing/Letter/Administrative Note).
3. `PR-AI-ORCH-POLICY-01` — Graph-guided policy orchestration authority (Referenzen: #58, #48, #49, #55).
4. Operative Priorisierung `Jetzt / Danach / Parken`: `docs/E150/CURRENT_STATE_2026-04-04.md`.

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
- **GOV-ORG-02** Org-/Publisher-/Redaktions-/Team-Kontext als Arbeits-/Traegerlogik
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
| PR-AI-CREATE-01 `/create` auf kanonischen Orchestrierungsfluss harmonisieren | Done (parent closure frozen / 2026-04-04) | GOV-AI-02 | `/create` ist als kanonischer Intake deutlich staerker verdrahtet: Fast-Path-Hrefs tragen kontextreiche Felder (`signalTitle`, `sourceUrl`, `sourceLabel`, `region`, `scope`, `clusterHint`, `reviewState`, `candidateId`, `reason`, `prefill`) ohne erzwungene Legacy-Defaults (`intent=claim&mode=manual`). Create-UI zeigt uebernommenen Handoff-Kontext sichtbar; relevante Einstiege aus Feed-Drafts, Anlassraum Operations, CTA-Handoff und Match-Service sind vereinheitlicht. 01C/01D bleiben unveraendert, 01E friert den Rest ein (Wrapper passt `entry_intent`/`entry_mode` durch, invalid entry hints degradieren stabil auf kanonischen Intake). Evidenz: `docs/E150/PR-AI-CREATE-01E_CREATE_PARENT_CLOSURE_2026-04-04.md`; Tests inkl. `create-mode.page`, `contributions-new.redirect`, `create-orchestrator-intent-contract`, `create-intake-context`, `create-mode.finalize.route`. |
| DOCS-HARM-06 Anlassraum (`/runden`) vs. Dossier vs. Swipes final harmonisieren | Done (`2026-03-27`) | DOMAIN-HARM-01 | Option-B-Wording in den relevanten Parts ist harmonisiert: `/runden` bleibt aktive Public-Surface, `Anlassraum` bleibt Domänenbegriff, `/anlassraum` bleibt Alias-/Zielbegriff ohne harte Migration. |
| ROUTING-HARM-01 Post-Finalize-Clientnavigation an serverseitige Zielentscheidungen angleichen | Done (server-target parity frozen / 2026-04-04) | UX-HARM-01 | Finalize-Routing bleibt serverfuehrend: `redirectTo` hat Vorrang, externe Ziele werden verworfen, Wrapper-Fallbacks bleiben intern und widersprechen dem Serverziel nicht. `/create` nutzt fuer Finalize denselben Fallback-Builder wie `/contributions/new` (`/swipes` bzw. dossier-gebunden), kein intent-basierter `/runden`-Fallback mehr. |
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
| Account Dark-Mode Nacharbeit | Done (closure hardening / 2026-04-05) | PR-0047 | Components/Token-Check |
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
Status: **Done (Closure hardening / 2026-04-05)**

Evidenz:
- `apps/web/src/app/api/events/route.ts` (Event kann Anlassraum referenzieren/erzeugen)
- `apps/web/tests/events.route.test.ts` (Existing-Link-Validierung, Konflikt-Blocking, no-auto-publish Insert-Baseline)
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

Status: **Done (quality gate closure frozen / 2026-04-04)**

Abschlussnotiz (2026-04-04):
- Analyze-Input bleibt verpflichtend qualitaetsgeprueft: zu kurzer Text wird als `BAD_INPUT` abgefangen (kein stilles Weiterreichen).
- Ungueltiger Anlassraum-Kontext wird explizit abgewiesen (`invalid_anlassraum_id`) statt implizit degradiert.
- Finalize bleibt an analysierbare Claims gebunden (`no_claims_selected` bei fehlender Analyze-Basis).
- Evidenz: `docs/E150/GOV-AI-01_QUALITY_GATE_PARENT_CLOSURE_2026-04-04.md`.

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

Status: **Done (parent closure hardening / 2026-04-05)**

Evidenz:
- `docs/E150/GOV-SEC-01_SECRET_HYGIENE_PARENT_CLOSURE_2026-04-05.md`
- `apps/web/src/lib/security/human-token.ts`
- `apps/web/src/app/api/security/verify-human/route.ts`
- `apps/web/tests/human-token.security.test.ts`
- `apps/web/tests/security-verify-human.route.test.ts`

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
- `GOV-ORG-02` ist abgeschlossen: shared Org-/Publisher-/Team-Context-Contract steht (`features/anlassraum/orgPublisherTeamContextContract.ts`) inkl. route-naher Meta-Ausgabe (`meta.orgPublisherTeamContext`, `meta.orgPublisherTeamContextConsistency`) und klarer Abgrenzung gegen Wahrheits-/Prioritaets-/Reichweiten-/Themen-/Regions-Sondermacht (`docs/E150/GOV-ORG-02_ORG_PUBLISHER_TEAM_CONTEXT_CONTRACT_2026-04-03.md`).

### GOV-CIVIC-01 / 02 / 03 / 04
- `GOV-CIVIC-01` ist abgeschlossen: shared Civic-/Creator-/Stream-/Repraesentanz-Contract steht (`features/anlassraum/civicCreatorRepresentationContract.ts`) inkl. Thema-vs-Region-Achsentrennung und route-naher Meta-Ausgabe (`meta.civicCreatorRepresentation`).
- `GOV-CIVIC-02` ist abgeschlossen: typed Lifecycle-/Transition-Contract steht (`features/anlassraum/civicCreatorLifecycleContract.ts`) inkl. route-naher Meta-Ausgabe (`meta.civicCreatorLifecycle`).
- `GOV-CIVIC-03` ist abgeschlossen: typed Impact-/Unterstuetzungs-Contract steht (`features/anlassraum/civicCreatorImpactSupportContract.ts`) inkl. route-naher Meta-Ausgabe (`meta.civicCreatorImpactSupport`).
- `GOV-CIVIC-04` ist abgeschlossen: typed Share-ready-Asset-Contract (`features/anlassraum/shareReadyAssetContract.ts`) modelliert canonical Share-/QR-Ziele und Social-Qualification ohne Auto-Posting-Default und ohne Wahrheits-/Prioritaetsprivileg (`docs/E150/GOV-CIVIC-04_SHARE_READY_TARGET_CONTRACT_2026-04-04.md`).

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
| PR-PRICING-HARM-03 Pricing-/Vormerken-Finalwelt harmonisiert (Privat 0€/5,63€, Journalismus-Segment, Fairness/Unabhaengigkeit/Erloeslogik) | Done | `features/pricing/domain/{plans.de.ts,journey.de.ts,content.de.ts,formatters.ts,types.ts}`, `apps/web/src/app/{pricing,vormerken}/page.tsx`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `apps/web/tests/{pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-vormerken-source-of-truth.contract.test.tsx}`, `docs/E150/{membership_pricing.md,Part19_Pricing_Packaging.md}` |
| PR-PRICING-HARM-04 Pricing visuell/strukturell professionalisiert (breiteres Desktop-Layout, klare Reihenfolge, Journalismus-Aufwertung, gebuendelter Vertrauensblock) | Done | `apps/web/src/app/pricing/page.tsx`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `apps/web/tests/{pricing-page.contract.test.ts,pricing-vormerken-source-of-truth.contract.test.tsx}` |
| PR-PRICING-HARM-05 Vormerken visuell/strukturell professionalisiert (breiteres Layout, staerkere Segmentfuehrung, harmonisierte Auswahlkarten, sauberer Seitenabschluss) | Done | `apps/web/src/app/vormerken/page.tsx`, `apps/web/tests/{vormerken-page.contract.test.tsx,pricing-vormerken-source-of-truth.contract.test.tsx}` |
| PR-PRICING-HARM-06 Zielgruppen-Navigator + VOG-Systemicons + paketnahe Differenzlogik (mobile-first auf /pricing und /vormerken) | Done | `apps/web/src/components/pricing/{TargetGroupNavigator.tsx,VogSystemIcons.tsx,PackagesGrid.tsx}`, `apps/web/src/app/{pricing,vormerken}/page.tsx`, `features/pricing/domain/{targetGroups.de.ts,plans.de.ts,types.ts}`, `apps/web/tests/{pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-vormerken-source-of-truth.contract.test.tsx}` |
| PR-PRICING-HARM-07 Institutionelle Detailseite (`/pricing/institutionen`) eingefuehrt und mit Pricing-SSOT harmonisiert | Done | `features/pricing/domain/institutionalPricing.de.ts`, `apps/web/src/app/pricing/institutionen/page.tsx`, `apps/web/src/app/pricing/page.tsx`, `features/pricing/index.ts`, `apps/web/tests/{pricing-institutionen-page.contract.test.ts,pricing-page.contract.test.ts,pricing-cta-targets.contract.test.ts}`, `docs/E150/{membership_pricing.md,Part19_Pricing_Packaging.md,Part03_AccessTiers_Pricing_B2C.md}` |
| PR-PRICING-HARM-08 Direkt bestellbarer Pricing-Orderflow mit internem Review-/Statusmodell (public low-friction, admin reviewable) | Done | `features/pricing/domain/{types.ts,orderFlow.ts,journey.de.ts,plans.de.ts,institutionalPricing.de.ts}`, `features/pricing/{usecases/createPreorderLead.ts,server/leadsRepo.ts,index.ts}`, `apps/web/src/app/{vormerken/page.tsx,pricing/institutionen/page.tsx,admin/pricing/orders/page.tsx,admin/page.tsx,admin/adminNav.ts}`, `apps/web/src/app/api/{edebatte/preorder/route.ts,admin/pricing/orders/route.ts}`, `apps/web/tests/{pricing-preorder-segment.contract.test.ts,pricing-order-flow.contract.test.ts,edebatte-preorder.route.test.ts,admin-pricing-orders.route.test.ts,pricing-institutionen-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-page.contract.test.ts}` |
| PR-PRICING-HARM-09 Segmentfokus + Add-on-Produktfuehrung nachgeschaerft (aktive Segmentpreise direkt auf `/pricing`/`/vormerken`, Add-ons mit USP/Einsatzkontext/Empfehlung/Bestellbarkeit auf allen Pricing-Surfaces) | Done | `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx,admin/pricing/orders/page.tsx}`, `apps/web/src/components/pricing/{AddOnInfoCard.tsx,AddOnMaturityBadge.tsx}`, `features/pricing/{domain/institutionalPricing.de.ts,usecases/createPreorderLead.ts}`, `apps/web/tests/{addon-availability-contracts.test.ts,pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-institutionen-page.contract.test.ts,pricing-vormerken-source-of-truth.contract.test.tsx,pricing-order-role-followup.contract.test.ts,e2e-critical-journeys.test.ts}`, `docs/E150/{Part19_Pricing_Packaging.md,membership_pricing.md}` |
| PR-QUALITY-HARM-01 Registrierung/Rollenrouting/Dashboard-Qualitaet gehaertet (Role-Matrix, sichere Login-/2FA-Redirects, Followup-Contracts, Add-on-Reifestand) | Done | `apps/web/src/features/auth/roleExperienceContract.ts`, `apps/web/src/app/api/auth/{login/route.ts,verify-2fa/route.ts}`, `apps/web/src/app/register/identity/page.tsx`, `features/pricing/domain/orderFollowup.de.ts`, `features/pricing/index.ts`, `apps/web/src/hooks/useLoginFlow.ts`, `apps/web/tests/{auth-login.route.test.ts,auth-registration-flow.contract.test.ts,role-routing.contract.test.ts,dashboard-role-contracts.test.ts,pricing-order-role-followup.contract.test.ts,addon-availability-contracts.test.ts}`, `docs/E150/PR-QUALITY-HARM-01_ROLE_ROUTING_DASHBOARD_CONTRACT_2026-04-12.md` |
| PR-QUALITY-HARM-02 E2E-/Manual-QA-Hardening als essenzieller Pflicht-Qualitaetsblock manifestiert (Journey-Tests, Add-on-Reifestand, Manual-Checklist, OpenTasks-Pflichtpfad) | Done | `apps/web/tests/e2e-critical-journeys.test.ts`, `apps/web/tests/{addon-availability-contracts.test.ts,pricing-order-role-followup.contract.test.ts}`, `features/pricing/domain/institutionalPricing.de.ts`, `features/pricing/usecases/createPreorderLead.ts`, `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx}`, `docs/E150/{PR-QUALITY-HARM-02_E2E_MANUAL_QA_HARDENING_2026-04-12.md,QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md,OpenTasks.md,Part19_Pricing_Packaging.md,membership_pricing.md}` |
| PR-I18N-PRICING-01 Bilingual Hardening fuer Pricing/Vormerken/Institutionen inkl. Add-on-/Badge-/Followup-SSOT (DE/EN semantisch deckungsgleich, keine Copy-Drift) | Done | `features/pricing/domain/{i18n.ts,helpers.ts,formatters.ts,plans.en.ts,journey.de.ts,content.de.ts,targetGroups.de.ts,institutionalPricing.de.ts,orderFollowup.de.ts}`, `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx}`, `apps/web/src/components/pricing/{TargetGroupNavigator.tsx,PackagesGrid.tsx,AddOnInfoCard.tsx,AddOnMaturityBadge.tsx}`, `features/pricing/usecases/createPreorderLead.ts`, `apps/web/src/utils/emailTemplates.ts`, `apps/web/tests/{pricing-i18n.contract.test.ts,vormerken-i18n.contract.test.tsx,pricing-institutionen-i18n.contract.test.ts,addon-i18n.contract.test.ts,pricing-order-followup-i18n.contract.test.ts}`, `docs/E150/PR-I18N-PRICING-01_PRICING_ORDER_ADDON_BILINGUAL_HARDENING_2026-04-12.md` |
| PR-CLOSING-WAVE-01 Finale Closing-Wave (keine Zwischenzusagen im Pricing-/Order-/Role-Scope; nur fertig, intern-verborgen oder entfernt) | Done | `apps/web/src/app/admin/pricing/orders/page.tsx`, `apps/web/src/features/auth/roleExperienceContract.ts`, `features/pricing/server/leadsRepo.ts`, `apps/web/tests/{admin.analytics.summary.test.ts,contact/contact-api.test.ts,create-prepare-attach.review-ui.test.tsx,community-page.states.test.ts,operator-surfaces.locale-render.test.tsx,vote.stats.test.ts,e2e/admin.spec.ts}`, `docs/E150/{OpenTasks.md,Part19_Pricing_Packaging.md,membership_pricing.md,QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md,PR-CLOSING-WAVE-01_FINAL_CLOSURE_2026-04-13.md}` |
| PR-TRUST-LEGIT-01 Bilingualer Trust-/Legitimations-Loop fuer Pricing/Registry/Membership/Follow-up (keine Partei, hohe digitale Legitimation, keine Papierlogik-Drift) | Done | `features/pricing/domain/{trustLoop.de.ts,content.de.ts,orderFollowup.de.ts}`, `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx,pricing/institutionen/page.tsx,register/RegisterPageClient.tsx,account/payment/page.tsx}`, `apps/web/tests/{pricing-trust-loop.contract.test.ts,pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-institutionen-page.contract.test.ts,pricing-i18n.contract.test.ts,vormerken-i18n.contract.test.tsx,pricing-institutionen-i18n.contract.test.ts,pricing-order-followup-i18n.contract.test.ts}`, `docs/E150/PR-TRUST-LEGIT-01_PRICING_REGISTRY_MEMBERSHIP_TRUST_LOOP_2026-04-13.md` |
| PR-PRICING-ABC-02 B2C-Hauptlogik auf create-nahe 3er-Paketwelt umgestellt (Interessiert/Aktiv/Mitgestaltend, 0 €/9,90 €/29,90) und Sonderzugaenge nachgeordnet vorbereitet | Done | `features/pricing/domain/{plans.de.ts,plans.en.ts,content.de.ts,journey.de.ts}`, `apps/web/src/app/{pricing/page.tsx,vormerken/page.tsx}`, `apps/web/tests/{pricing-page.contract.test.ts,vormerken-page.contract.test.tsx,pricing-vormerken-source-of-truth.contract.test.tsx,pricing-i18n.contract.test.ts,vormerken-i18n.contract.test.tsx,e2e-critical-journeys.test.ts,pricing-preorder-verification-gates.contract.test.ts,edebatte-preorder.route.test.ts}`, `docs/E150/{Part03_AccessTiers_Pricing_B2C.md,Part19_Pricing_Packaging.md,membership_pricing.md,PR-PRICING-ABC-02_B2C_CREATE_ALIGNED_2026-04-17.md}` |
| PR-PRICING-ABC-03 Finaler Privatflow-Shortening-Pass (3,99 regulaer / 0 € Mitglieder, Mitgliedschafts-Checkbox, kontaktgefuehrte B2B/B2G-Konditionsseite) | Done | `apps/web/src/{app/pricing/page.tsx,app/pricing/institutionen/page.tsx,app/vormerken/page.tsx,app/api/edebatte/preorder/route.ts,components/pricing/PackagesGrid.tsx,features/create/createSurfaceConfig.ts,app/(components)/SiteHeader.tsx,app/[locale]/referenzarchitektur/page.tsx}`, `features/pricing/{domain/types.ts,usecases/createPreorderLead.ts,server/leadsRepo.ts}`, `apps/web/tests/{pricing-private-package-prices.contract.test.ts,vormerken-private-package-prices.contract.test.tsx,member-checkbox-flow.contract.test.tsx,pricing-short-main-flow.contract.test.ts,institutional-pricing-link.contract.test.tsx,no-legacy-price-logic.contract.test.tsx,navigation-initiative-label.contract.test.ts,pricing-page.contract.test.ts,pricing-i18n.contract.test.ts,pricing-institutionen-page.contract.test.ts,pricing-institutionen-i18n.contract.test.ts}`, `docs/E150/{Part03_AccessTiers_Pricing_B2C.md,Part19_Pricing_Packaging.md,membership_pricing.md,PR-PRICING-ABC-03_PRIVATE_FLOW_SHORTENING_2026-04-18.md}` |
| PR-PRICING-INST-SHOP-01 Institutioneller Direktbestellpfad + Kostenvoranschlag (Shopflow auf `/pricing/institutionen` + segmentgefuehrtes `/vormerken`) | Done | `apps/web/src/app/{pricing/institutionen/page.tsx,vormerken/page.tsx,api/edebatte/preorder/route.ts}`, `apps/web/tests/{pricing-institutionen-page.contract.test.ts,pricing-institutionen-i18n.contract.test.ts,institutional-pricing-link.contract.test.tsx,vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx,edebatte-preorder.route.test.ts,pricing-preorder-verification-gates.contract.test.ts,wrapper-mvp-surface-contract.test.ts,wrapper-android-mvp-policy.test.ts,mobile-app-shell-contract.test.ts}`, `docs/E150/{Part03_AccessTiers_Pricing_B2C.md,Part19_Pricing_Packaging.md,membership_pricing.md,PR-PRICING-INST-SHOP-01_DIRECT_ORDER_QUOTE_WRAPPER_2026-04-18.md}` |
| PR-INSTITUTIONAL-CONFIGURATOR-01 Institutionelle Flaechen auf gefuehrten Vorauswahl-/Empfehlungsflow umgestellt (Segment -> Ziel -> Rahmen -> Empfehlung, progressive Add-ons, situative Rueckfragen) | Done | `features/pricing/domain/institutionalPricing.de.ts`, `apps/web/src/app/{pricing/institutionen/page.tsx,vormerken/page.tsx}`, `apps/web/tests/{pricing-institutionen-page.contract.test.ts,pricing-institutionen-i18n.contract.test.ts,institutional-pricing-link.contract.test.tsx,vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx,institutional-guided-selection-flow.contract.test.ts,institutional-package-recommendation.contract.test.ts,institutional-addons-progressive-disclosure.contract.test.ts,institutional-addon-followup-questions.contract.test.tsx,institutional-quote-optional-not-primary.contract.test.tsx,institutional-roi-copy.contract.test.ts,institutional-visual-overload-regression.contract.test.ts}`, `docs/E150/PR-INSTITUTIONAL-CONFIGURATOR-01_GUIDED_RECOMMENDATION_FLOW_2026-04-19.md` |
| PR-INSTITUTIONAL-CONFIGURATOR-02 Institutioneller Feinschliff fuer ruhigere Hierarchie, selektivere Add-ons und enttechnisierte Nutzenlogik (ohne Rueckbau der Guided-Selection) | Done | `apps/web/src/app/{pricing/institutionen/page.tsx,vormerken/page.tsx}`, `apps/web/tests/{pricing-institutionen-page.contract.test.ts,institutional-addons-progressive-disclosure.contract.test.ts,institutional-roi-copy.contract.test.ts,institutional-recommendation-visual-priority.contract.test.ts,institutional-addon-copy-shortened.contract.test.ts,institutional-addon-priority-bands.contract.test.ts,institutional-no-roi-jargon.contract.test.tsx,institutional-followup-only-after-selection.contract.test.tsx,institutional-cta-hierarchy.contract.test.ts}`, `docs/E150/PR-INSTITUTIONAL-CONFIGURATOR-02_FEINSCHLIFF_2026-04-19.md` |
| PR-PRICING-VORMERKEN-SMARTER-01 Klarere Privatfuehrung + smartere institutionelle Abschlusswege (Mitgliedschaft sichtbar, Privat ohne Quote-Fokus, institutioneller Quote-Download mit Pflichtangaben) | Done | `apps/web/src/app/{pricing/page.tsx,pricing/institutionen/page.tsx,vormerken/page.tsx,api/edebatte/preorder/route.ts}`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `apps/web/tests/{pricing-private-member-price.contract.test.ts,pricing-initiative-link.contract.test.ts,vormerken-private-no-quote.contract.test.tsx,vormerken-membership-application-visibility.contract.test.tsx,private-package-capability-clarity.contract.test.ts,institutional-quote-download-requires-contact-fields.contract.test.tsx,institutional-contact-paths.contract.test.tsx,initiative-nav-label.contract.test.ts,no-next-steps-noise.contract.test.tsx,member-checkbox-flow.contract.test.tsx,vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx,pricing-page.contract.test.ts,no-legacy-price-logic.contract.test.tsx}`, `docs/E150/PR-PRICING-VORMERKEN-SMARTER-01_SMARTER_PRIVATE_AND_INSTITUTIONAL_FLOW_2026-04-19.md` |
| PR-PRICING-MAIN-SIMPLIFY-01 `/pricing` auf kurze Privat-Entscheidungsseite reduziert (ohne Mittelblock-Drift, mit klarer Mitgliedschaftseinordnung und nachgeordnetem B2B/B2G-Pfad) | Done | `apps/web/src/app/pricing/page.tsx`, `apps/web/src/components/pricing/PackagesGrid.tsx`, `features/pricing/domain/{plans.de.ts,plans.en.ts}`, `apps/web/tests/{pricing-main-page-simplified-decision-flow.contract.test.ts,pricing-membership-block-clarity.contract.test.ts,pricing-package-capabilities-visible.contract.test.ts,pricing-no-extra-middle-blocks.contract.test.ts,pricing-b2b-secondary-only.contract.test.ts,pricing-mobile-decision-hierarchy.contract.test.ts,pricing-page.contract.test.ts,pricing-private-member-price.contract.test.ts,private-package-capability-clarity.contract.test.ts,pricing-package-logic-aligned-with-create.contract.test.tsx}`, `docs/E150/PR-PRICING-MAIN-SIMPLIFY-01_PRIVATE_DECISION_PAGE_2026-04-19.md` |
| PR-PRICING-MAIN-SIMPLIFY-02 `/pricing`-Mikro-Polish fuer kompaktere Karten, klarere Mitgliedschafts-Prioritaet und strengere CTA-Parallelitaet | Done | `apps/web/src/{app/pricing/page.tsx,components/pricing/PackagesGrid.tsx}`, `features/pricing/domain/{plans.de.ts,plans.en.ts}`, `apps/web/tests/{pricing-membership-block-clarity.contract.test.ts,pricing-package-logic-aligned-with-create.contract.test.tsx,pricing-page.contract.test.ts,pricing-main-page-simplified-decision-flow.contract.test.ts,pricing-package-capabilities-visible.contract.test.ts,pricing-no-extra-middle-blocks.contract.test.ts,pricing-b2b-secondary-only.contract.test.ts,pricing-mobile-decision-hierarchy.contract.test.ts}`, `docs/E150/PR-PRICING-MAIN-SIMPLIFY-02_DECISION_HIERARCHY_MICRO_POLISH_2026-04-19.md` |
| PR-PRICING-ORDER-INITIATIVE-01 Routing-/Copy-Feinschliff: `/order` kanonisch, `/vormerken` kompatibel, `/howtoworks/initiative` harmonisiert, institutioneller Quote-Link per separater Mail | Done | `apps/web/src/{app/order/page.tsx,app/vormerken/page.tsx,app/pricing/page.tsx,app/pricing/institutionen/page.tsx,app/howtoworks/page.tsx,app/howtoworks/initiative/page.tsx,app/api/edebatte/preorder/{quote-download-link/route.ts,quote-download/route.ts,route.ts},app/register/{preorder/page.tsx,registerFlowBridge.ts},app/account/AccountClient.tsx,components/{SiteFooter.tsx,landing/PrelaunchGateModal.tsx},app/(components)/SiteHeader.tsx,app/[locale]/referenzarchitektur/page.tsx,features/wrapper/{mobileAppShellContract.ts,mvpSurfaceContract.ts,productSurfaceLayoutContract.ts}}`, `features/pricing/domain/{plans.de.ts,plans.en.ts,journey.de.ts,institutionalPricing.de.ts}`, `apps/web/tests/{institutional-quote-download-link.route.test.ts,pricing-page.contract.test.ts,pricing-institutionen-page.contract.test.ts,pricing-i18n.contract.test.ts,pricing-institutionen-i18n.contract.test.ts,institutional-pricing-link.contract.test.tsx,institutional-quote-download-requires-contact-fields.contract.test.tsx,register-preorder.redirect.test.ts,auth-registration-flow.contract.test.ts,vormerken-package-logic-aligned-with-pricing.contract.test.tsx,mobile-app-shell-contract.test.ts,wrapper-mvp-surface-contract.test.ts,pricing-cta-targets.contract.test.ts}`, `docs/E150/PR-PRICING-ORDER-INITIATIVE-01_ROUTE_ALIAS_QUOTE_MAIL_2026-04-19.md` |
| PR-THEMENRADAR-02 Persistenz-/Audit-/Lifecycle-Hardening fuer `/admin/themenradar` inkl. Render-/mobile-/dark-Contracts und reportfaehiger Telemetrie-Shape | Done | `features/themenradar/{contracts.ts,store.ts,index.ts,server/repo.ts}`, `apps/web/src/app/api/admin/themenradar/{route.ts,[id]/route.ts,[id]/content-prep/route.ts,[id]/share-ready/route.ts,[id]/telemetry/route.ts,report/route.ts}`, `apps/web/src/app/admin/themenradar/{page.tsx,[id]/page.tsx}`, `apps/web/tests/{themenradar-persistence.contract.test.ts,themenradar-repo.integration.test.ts,themenradar-audit-trail.contract.test.ts,themenradar-lifecycle-transition-guard.contract.test.ts,themenradar-admin-page.render.test.tsx,themenradar-detail-page.render.test.tsx,themenradar-mobile-layout.contract.test.tsx,themenradar-darkmode.contract.test.tsx,themenradar-telemetry-report-shape.contract.test.ts,themenradar-telemetry-report.route.test.ts}`, `docs/E150/PR-THEMENRADAR-02_PERSISTENCE_AUDIT_HARDENING_2026-04-19.md` |
| PR-OPS-STATUS-REPORT-01 Interner SMTP-Statusreport mit Scheduler (05:00/17:00), AI-Smokes und Laufhistorie | Done | `apps/web/src/features/ops/statusReport/{contracts.ts,config.ts,repo.ts,collect.ts,mail.ts,run.ts,scheduler.ts,index.ts}`, `apps/web/src/{instrumentation.ts,app/api/admin/ops/status-report/route.ts}`, `apps/web/.env.example`, `apps/web/tests/{status-report-shape.contract.test.ts,ai-route-smoke.contract.test.ts,ai-route-fallback-status.contract.test.ts,status-report-mail-render.contract.test.ts,status-report-scheduler.contract.test.ts,status-report-no-double-send.contract.test.ts,smtp-config-guard.contract.test.ts}`, `docs/E150/PR-OPS-STATUS-REPORT-01_AUTOMATED_STATUS_EMAILS_2026-04-19.md` |
| PR-OPS-STATUS-REPORT-02 Importgrenze-Hardening + health_only/Recipient/Mail-Polish fuer Statusreport | Done | `apps/web/src/features/ops/statusReport/{contracts.ts,config.ts,run.ts,scheduler.ts,schedulerTrigger.ts,mail.ts,instrumentation.ts}`, `apps/web/src/{instrumentation.ts,app/api/admin/ops/status-report/route.ts,app/api/internal/ops/status-report/scheduled/route.ts}`, `apps/web/.env.example`, `apps/web/tests/{status-report-config.contract.test.ts,status-report-health-only.contract.test.ts,status-report-mail-render.contract.test.ts,status-report-no-double-send.contract.test.ts,status-report-scheduler.contract.test.ts,smtp-config-guard.contract.test.ts}`, `docs/E150/OpenTasks.md` |
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
