# PR-CREATE-MODES-01 - Create Mode Split Hardening (2026-04-14)

## Scope

Kontraktnaher Hardening-Slice für `/create` mit Fokus auf:

- ruhige Startfläche mit klarer Moduswahl
- progressive disclosure (Folgemodule erst nach bewusstem Start)
- Entkopplung sichtbarer UX von internen Query-/Intent-Codes
- robustere Analyze-Pfad-Parameterisierung (`analysisMode`)
- Null-Hardening im Analyze-Parserpfad ohne Aufweichung des Domain-Schemas

Nicht Teil dieses Slices:

- neuer nativer Wrapper-Stack
- globale KI-Orchestrierungs-Architektur
- vollständiger mehrstufiger Guided-Dossier-Chat als eigene, separate Produktoberfläche

## Umsetzung

### 1) `/create` Startfläche enttechnisiert und vereinfacht

- `apps/web/src/app/create/CreateClient.tsx`
  - drei sichtbare Produktmodi eingeführt:
    - `Beitrag analysieren`
    - `Für Bericht nutzen`
    - `Thema gemeinsam erarbeiten`
  - eine Primärfläche mit einem großen Intake-Textfeld
  - mode-spezifische Primär-CTA
  - Folgeflächen nur nach explizitem Start (`hasStarted`)
  - interne Intent-/Query-Codes werden nicht mehr roh angezeigt
  - Runden-Kontext wird menschenlesbar dargestellt

- `apps/web/src/app/create/page.tsx`
  - technisches Intake-Kontext-Prefill entfernt
  - Kontextparameter bleiben intern verfügbar, werden aber nicht mehr als Rohtext in das Startfeld injiziert

### 2) Mode-Hints bis zur Analyze-Route durchgereicht

- `apps/web/src/features/create/createProductModes.ts`
  - shared Werte + Parser für Produktmodi

- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
  - optionaler `analysisModeHint`-Prop
  - Analyze-Request trägt `analysisMode` explizit

- `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts`
  - `analysisMode` als validiertes Request-Feld ergänzt

- `apps/web/src/app/api/contributions/analyze/route.ts`
  - `analysisMode` wird in den Analyze-Job übernommen
  - mode-basierte `audienceRole`-Ableitung (`analyze`/`media`/`guided`)

### 3) Analyze-Hardening gegen null/string-Mismatches

- `features/analyze/analyzeContribution.ts`
  - mode-spezifische Prompt-Hinweise ergänzt
  - bestehende Sanitizer-/Parser-Hardening bleibt strict-domain-kompatibel
  - Zod-Fehlerpfade bleiben explizit logbar

### 4) Upload-aware Source-Grounding-Contract ergänzt

- `features/analyze/sourceGroundingContract.ts` (neu)
  - Source-Inventory-First (`upload_document` / `web_reference` / `free_note`)
  - Dokument-Priorität + Coverage-Pass (`start` / `middle` / `end`) gegen Context-Rot
  - `supplement_only`-Regel für Web-Kontext
  - Synthesis-Audit mit Klassifikation:
    - `document_grounded`
    - `web_grounded`
    - `inferred`
    - `open`
  - Contradiction-Signale + `noSourceBluffing`-Gate
  - `requiresManualReview`, wenn Uploads ohne belastbare Dokumentbindung ausgewertet werden

- `apps/web/src/app/api/contributions/analyze/route.ts`
  - baut pro Request einen Source-Grounding-Context aus `analysisMode` + `evidenceItems`
  - übergibt den Prompt-Zusatz (`sourceGroundingPromptAddon`) an `analyzeContribution`
  - liefert `meta.sourceGrounding` in Success-/Fallback-/Degraded-Responses
  - SSE-Result enthält Source-Grounding-Meta ebenfalls explizit

### 5) Guided-Startschritt und enttechnisierte Folgefläche ergänzt

- `apps/web/src/app/create/CreateClient.tsx`
  - Guided-Modus erhält einen eigenen ersten Rückfrageschritt vor dem Workspace
  - Workspace bleibt im Guided-Modus bis zur bewussten Bestätigung verborgen
  - Guided-Antwort wird als strukturierter Fokus in den nachgelagerten Analyze-Request übernommen

- `apps/web/src/features/create/analyzeEnvelope.ts`
  - `meta.sourceGrounding` wird defensiv geparst und als Envelope-Bestandteil bereitgestellt

- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
  - Single-Button-Create-Folgefläche als menschenlesbare „Nächste Schritte“-Ansicht statt technischer Orchestrierungsblöcke
  - keine Roh-IDs/Match-Typen im create-nahen Primary-Flow
  - Source-Grounding-Audit wird sichtbar als Hinweis/Warnung gerendert
  - Fallback-Analysen werden explizit als vereinfachter Modus markiert (kein stilles „alles normal“)

## Test-/Verifikationsstand

Neu/aktualisiert:

- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/create-mode-selector.contract.test.ts`
- `apps/web/tests/create-orchestration-mode-mapping.contract.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/no-internal-query-leak-in-create-ui.test.ts`
- `apps/web/tests/no-duplicate-primary-worksurface-on-create.test.ts`
- `apps/web/tests/runden-context-human-readable-only.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/analyze-contribution.null-hardening.test.ts`
- `apps/web/tests/source-grounding-contract.test.ts`
- `apps/web/tests/create-analyze.envelope.test.ts`

Ausgeführt:

- `pnpm -C apps/web exec vitest run tests/create-mode.page.test.ts tests/create-mode-selector.contract.test.ts tests/create-orchestration-mode-mapping.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/no-internal-query-leak-in-create-ui.test.ts tests/no-duplicate-primary-worksurface-on-create.test.ts tests/runden-context-human-readable-only.test.ts tests/create-analyze.route.test.ts tests/analyze-contribution.null-hardening.test.ts`
- `pnpm -C apps/web exec vitest run tests/create-analyze.route.test.ts tests/source-grounding-contract.test.ts tests/analyze-contribution.null-hardening.test.ts`
- `pnpm -C apps/web exec vitest run tests/analyze-workbench-hidden-until-start.test.ts tests/create-analyze.workspace-ui.test.ts tests/create-analyze.envelope.test.ts tests/create-analyze.route.test.ts tests/source-grounding-contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Abschlussstand

`PR-CREATE-MODES-01` ist als Hardening-Parent abgeschlossen: Drei sichtbare Modi, progressive Disclosure, enttechnisierte create-nahe Folgefläche, robustere Analyze-Null-Härtung sowie Source-Grounding-Audit sind eingefroren und testseitig abgesichert.
