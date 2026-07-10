# V3 Voxy Render Asset Pack Draft Noop Audit

Datum: 2026-07-10
Task: `V3-VOXY-RENDER-ASSET-PACK-DRAFT-NOOP-01`
Status: done

## Ziel

Nach Asset-/Provider-Registry, Render-Request-Draft, disabled Queue und Cost-/Credit-Policy gibt es jetzt einen ehrlichen `Render-Asset-Pack`-Layer:

- zeigt, welche konkreten Assets fuer einen spaeteren Voxy-Renderlauf gebraucht wuerden
- trennt sichtbar `available`, `missing`, `requirement_only` und `needs_review`
- erzeugt keine Medien-Datei
- erzeugt kein Subtitle- oder Voice-File
- erzeugt kein Export-Preset
- startet keine Queue
- startet keinen Provider
- erzeugt keinen Upload
- erzeugt keine Kostenbuchung
- veroeffentlicht nichts

Der Slice ist bewusst `asset_pack_draft_only` / `requirements_only` / `noop_asset_pack`, nie Medienruntime.

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderAssetPackDraftContract.ts`
- `apps/web/src/features/create/voxyRenderAssetPackDraftStore.ts`
- `apps/web/src/features/create/VoxyRenderAssetPackDraftPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-asset-pack-drafts/route.ts`

Integration additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Repo-Inventur: echte Asset-Wahrheit

### Wirklich vorhanden

1. Statische Voxy-Raster-Assets in `apps/web/public/brand/voxy/`
   - `voxy-confident`, `voxy-neutral`, `voxy-thinking`, `voxy-check`, `voxy-hint`, `voxy-welcome`
   - `voxy-presenting`, `voxy-open`, `voxy-wave`, `voxy-mini-avatar`
   - `voxy-create-guide`, `voxy-create-guide-light`, `voxy-create-guide-dark`
   - zusaetzlich `voxy-podcast-stage`

2. Statische Overlay-Assets
   - `overlays/voxy-wordmark.svg`
   - `overlays/edebatte-gradient.svg`
   - `overlays/vog-pin.svg`

3. Manifest-Wahrheit in `apps/web/public/brand/voxy/manifest.json`
   - kanonische Asset-IDs
   - Route-Usage-Hinweise
   - Platzierungs- und Background-Hinweise

### Nur als Hinweis oder Requirement sichtbar

1. Background-Template
   - Das Manifest beschreibt nur Platzierung und Hintergrundregeln.
   - Es gibt keine echte Szenen- oder Template-Datei fuer einen Renderlauf.

2. Provider-Asset-Anforderungen
   - Request-Draft, Queue und Cost-/Credit-Policy zeigen spaetere Asset-/Provider-Bedarfe.
   - Das bleibt Requirement-Wahrheit und nicht Datei- oder Provider-Wahrheit.

### Nicht vorhanden

1. Kein Voice-Profil
   - Kein echtes Voice-Profil, keine Preset-Datei und keine belastbare Konfiguration im Repo.

2. Kein Subtitle-Template
   - Weder Layout-Datei noch exportierbares Subtitle-Preset fuer spaetere Untertitel.

3. Kein Lower-Third-Template
   - Keine Bauchbinden-Komposition oder Render-Vorlage.

4. Kein Source-Caption-Template
   - Keine belastbare Vorlage fuer quellennahe Caption-Flaechen.

5. Kein Export-Preset
   - Keine JSON-/Preset-/Output-Konfiguration fuer Render oder Medienexport.

6. Kein echter RTL-Subtitle-Support
   - RTL bleibt Requirement-only und ist keine nachweisbare Runtime-Wahrheit.

7. Kein echter multilingualer Voice-Support
   - Mehrsprachige Voice bleibt Requirement-only und ist keine nachweisbare Provider- oder Profilwahrheit.

## Warum dieser Slice keine Datei erzeugt

Der neue Layer bleibt absichtlich unterhalb jeder Ausfuehrung:

- alle Asset-/Execution-Flags bleiben `false`
- keine Medien-Datei
- keine Subtitle-Datei
- keine Voice-Datei
- kein Export
- kein Upload
- kein Providerlauf
- keine Queue
- keine Kostenbuchung
- keine Veroeffentlichung

Damit gilt ausdruecklich:

- `asset_pack_draft` ist nicht `media_file`
- `asset_available` ist nicht `render_safe`
- `asset_requirement` ist nicht `asset_present`
- `export_preset` ist nicht `rendered`
- `voice_profile_needed` ist nicht `voice_generated`
- `subtitle_template_needed` ist nicht `subtitle_file`
- `cost_policy` ist nicht Billing
- `queue_contract` ist nicht `queue_runtime`

## Statuslogik des Slices

Der Contract unterscheidet u. a.:

- `asset_pack_draft_only`
- `noop_asset_pack`
- `requirements_only`
- `partially_available`
- `needs_asset_review`
- `needs_voice_profile`
- `needs_subtitle_template`
- `needs_lower_third_template`
- `needs_source_caption_template`
- `needs_export_preset`
- `blocked_by_missing_request_draft`
- `blocked_by_missing_registry`
- `blocked_by_missing_required_assets`
- `blocked_by_runtime_truth`
- `keep_as_script_only`

Damit wird sichtbar, ob ein spaeterer Renderlauf aktuell an fehlendem Request-Draft, Registry-Wahrheit, Voice-/Subtitle-/Lower-Third-/Source-Caption-/Export-Bausteinen oder Runtime-Wahrheit scheitert.

## Persistenzgrenze

Der Slice nutzt dasselbe Muster wie die vorherigen Voxy-Render-Slices:

- Mongo-Primary, wenn verfuegbar
- In-Memory-Fallback mit ehrlicher Kennzeichnung
- Admin-only `GET`/`POST` unter `/api/admin/voxy-render-asset-pack-drafts`
- nur Preview-/Audit-Records
- keine Datei, kein Export, kein Upload, keine Queue, kein Provider, keine Kosten

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Render-Asset-Pack`
- `Noch keine Datei`
- `Keine Asset-Erzeugung`
- `Kein Providerlauf`
- `Keine Kosten`
- vorhandene Assets
- fehlende Assets
- Requirement-only Assets
- Sprache / Untertitel / RTL
- naechste Asset-Aktion

Keine Oberflaeche zeigt:

- `Jetzt rendern`
- `Jetzt generieren`
- Fake-Dateien
- Fake-Provider
- Fake-Kosten

## Tests

Neu:

- `apps/web/tests/voxy-render-asset-pack-draft.contract.test.tsx`
- `apps/web/tests/voxy-render-asset-pack-draft.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Was fuer einen spaeteren echten Renderlauf weiterhin fehlt

Ein echter Folgeslice braeuchte mindestens:

1. echte Voice-Profile oder providergebundene Voice-Presets
2. belastbare Subtitle-Templates inkl. RTL-Handling
3. belastbare Lower-Third- und Source-Caption-Vorlagen
4. echte Export-Presets oder Output-Konfigurationen
5. klare Zuordnung zwischen Asset-Pack, Queue, Provider und spaeterem Medienartefakt
6. strikte Guardrails gegen stille Fake-Datei-, Fake-Export- oder Fake-Upload-Wahrheit

## Naechster sinnvoller Slice

Sinnvolle Follow-ups:

- separate Readmodel-Slice fuer echte Voice-/Subtitle-/Lower-Third-/Export-Wahrheit
- RTL-/multilingual-Support weiterhin getrennt von echter Runtime pruefen
- Medien-, Export-, Upload- und Provider-Runtime ausdruecklich spaeter und getrennt halten
