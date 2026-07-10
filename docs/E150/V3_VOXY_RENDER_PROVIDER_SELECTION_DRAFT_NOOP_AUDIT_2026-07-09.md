# V3 Voxy Render Provider Selection Draft Noop Audit

Datum: 2026-07-10
Task: `V3-VOXY-RENDER-PROVIDER-SELECTION-DRAFT-NOOP-01`
Status: done

## Ziel

Nach Request-Draft, disabled Queue, Cost-/Credit-Policy, Asset-Pack, Registry, Adapter, Preflight und Provider-Handoff gibt es jetzt einen ehrlichen `Provider-Auswahl`-Layer:

- zeigt nur, welche generischen Provider-/Adapter-Optionen später grundsätzlich geeignet sein könnten
- trennt sichtbar `requirement_only`, `configuration_needed`, `secrets_needed`, `pricing_needed`, `needs_review` und `blocked`
- wählt heute keinen Provider aus
- ruft keinen Provider auf
- liest keine Secrets
- erzeugt keine Queue
- erzeugt keine Medien-Datei
- bucht keine Kosten
- veröffentlicht nichts

Der Slice ist bewusst `provider_selection_draft_only` / `requirements_only` / `noop_provider_selection`, nie Provider- oder Render-Runtime.

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderProviderSelectionDraftContract.ts`
- `apps/web/src/features/create/voxyRenderProviderSelectionDraftStore.ts`
- `apps/web/src/features/create/VoxyRenderProviderSelectionDraftPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-provider-selection-drafts/route.ts`

Integration additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Repo-Inventur: echte Provider-/Adapter-Wahrheit

### Wirklich vorhanden

1. Review-first Contracts und Readmodels
   - Request-Draft, Queue, Cost-/Credit-Policy, Asset-Pack, Registry, Adapter, Decision, Preflight und Handoff liegen als typed Review-/Audit-Schichten vor.

2. Provider-Interfaces in `apps/web/src/features/voxyVideo/contracts.ts`
   - `VoiceProvider`
   - `AvatarProvider`
   - `RenderProvider`
   - `PublishProvider`

3. Noop-Adaptervertrag
   - Der vorhandene Adapter-Slice liefert einen explizit blockierten Noop-Pfad mit falschen Execution-Flags.

### Nur als Requirement- oder Interface-Wahrheit sichtbar

1. Avatar-/Video-/Voice-/Subtitle-/Pricing-Fähigkeiten
   - Registry, Preflight und Asset-Pack zeigen nur Anforderungen, fehlende Templates oder blockierte Gates.

2. Generic AI-/Env-Wahrheit
   - Das Repo hat generische AI-/Provider-Konfiguration für bestehende Text-/Analyse-Pfade.
   - Diese Wahrheit wurde bewusst nicht zu Voxy-Render-Provider-Wahrheit umgedeutet.

### Nicht vorhanden

1. Kein konkret konfigurierter Voxy-Render-Provider
   - Es gibt keinen belastbaren Avatar-, Voice- oder Video-Provider mit ehrlichem Providernamen für diesen Pfad.

2. Keine render-spezifische Secret-Wahrheit
   - Kein belastbarer Voxy-Render-Secret-/Env-Vertrag, der einen Providerlauf erlauben würde.

3. Keine render-spezifische Pricing-Wahrheit
   - Keine belastbare Provider-Kostenquelle für Avatar-/Voice-/Render-Läufe.

4. Keine Queue-/Worker-/Render-Runtime
   - Keine echte Voxy-Render-Queue, kein Worker, kein Medienlauf und kein Upload-/Publish-Pfad.

## Warum dieser Slice keinen Provider auswählt

Der neue Layer bleibt absichtlich unterhalb jeder Ausführung:

- alle Execution-Flags bleiben `false`
- `providerCalled` bleibt `false`
- `secretsAccessed` bleibt `false`
- `pricingClaimAllowed` bleibt `false`
- keine Queue
- kein Render
- keine Medien-Datei
- keine Kostenbuchung
- kein Upload
- kein Publish

Damit gilt ausdrücklich:

- `provider_selection_draft` ist nicht `provider_execution`
- `provider_candidate` ist nicht `provider_available`
- `provider_configured` ist nicht `provider_called`
- `provider_pricing_needed` ist nicht `cost_estimated`
- `adapter_ready` ist nicht `render_safe`
- `asset_pack_draft` ist nicht `media_file`
- `queue_contract` ist nicht `queue_runtime`
- `translation` bleibt Lesehilfe und kein Beleg

## Statuslogik des Slices

Der Contract unterscheidet u. a.:

- `provider_selection_draft_only`
- `noop_provider_selection`
- `requirements_only`
- `needs_provider_review`
- `needs_adapter_contract`
- `needs_provider_configuration`
- `needs_secret_configuration`
- `needs_provider_pricing`
- `needs_language_capability`
- `needs_subtitle_capability`
- `needs_voice_capability`
- `blocked_by_missing_request_draft`
- `blocked_by_missing_asset_pack`
- `blocked_by_missing_cost_policy`
- `blocked_by_missing_registry`
- `blocked_by_runtime_truth`
- `keep_as_script_only`

Damit wird sichtbar, ob ein spaeterer echter Provideranschluss aktuell an fehlendem Request-Draft, Asset-Pack, Registry, Provider-Config, Secrets, Pricing, Sprach-/Voice-Faehigkeiten, Subtitle-/RTL-Faehigkeiten oder Runtime-Wahrheit scheitert.

## Persistenzgrenze

Der Slice nutzt dasselbe Muster wie die vorherigen Voxy-Render-Slices:

- Mongo-Primary, wenn verfuegbar
- In-Memory-Fallback mit ehrlicher Kennzeichnung
- Admin-only `GET`/`POST` unter `/api/admin/voxy-render-provider-selection-drafts`
- nur Preview-/Audit-Records
- keine Secrets, kein Providerlauf, kein Render, keine Queue, keine Kosten

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Provider-Auswahl`
- `Noch kein Providerlauf`
- `Keine Secrets`
- `Keine API-Aufrufe`
- `Keine Kosten`
- generische Provider-Kandidaten
- fehlende Faehigkeiten
- Repo-Wahrheit
- Gate-Hinweise
- Blocker
- naechste Aktion

Keine Oberflaeche zeigt:

- `Jetzt Provider starten`
- `Jetzt rendern`
- Fake-Provider
- Fake-Secrets
- Fake-Preise

## Tests

Neu:

- `apps/web/tests/voxy-render-provider-selection-draft.contract.test.tsx`
- `apps/web/tests/voxy-render-provider-selection-draft.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Was fuer einen spaeteren echten Provideranschluss weiterhin fehlt

Ein echter Folgeslice braeuchte mindestens:

1. konkrete, belastbare Providerkonfiguration mit ehrlichen Providernamen
2. render-spezifische Secret-/Env-Wahrheit
3. belastbare Provider-Pricing-Quellen
4. klare Sprach-, Voice-, Subtitle- und RTL-Faehigkeitsbelege
5. server-only Queue-/Worker-/Render-Runtime
6. explizite Guardrails zwischen Auswahl, Ausfuehrung, Kosten und Publish

## Nächster sinnvoller Slice

Sinnvolle Follow-ups:

- separate Readmodel-Slice fuer echte render-spezifische Secret-/Env-Wahrheit
- separate Readmodel-Slice fuer belastbare Provider-Pricing-Quellen
- Sprach-/Voice-/Subtitle-/RTL-Faehigkeiten weiterhin getrennt von echter Runtime pruefen
- Provider-, Queue-, Render-, Upload- und Publish-Runtime ausdruecklich spaeter und getrennt halten
