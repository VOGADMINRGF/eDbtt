# GOV-AI-06A - Language Context Contract Hardening (2026-04-05)

## Scope

Kleiner, entscheidungsfreier Folge-Slice aus `GOV-AI-06`:
- kein AI-/Matching-Grossumbau
- keine globale Sprachmigration
- kein Wrapper-/App-/Store-Scope
- nur language-aware Contract-Hardening fuer kritische Analyze/Match-Pfade

## Umsetzung

### 1) Shared Language-Context Normalizer

Neu:
- `apps/web/src/features/create/languageContextContract.ts`

Inhalt:
- normalisiert Sprachfelder defensiv auf kurze Tags (`de`, `en`, ...)
- erzeugt konsistentes Triplet `{ uiLocale, contentLanguage, sourceLanguage }`
- faellt stabil auf `de` bzw. inferierte Source-Sprache zurueck

### 2) Analyze-Request Contract gehaertet

Geaendert:
- `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts`

Ergaenzt:
- Request akzeptiert explizit `uiLocale`, `contentLanguage`, `sourceLanguage`
- Felder werden ueber den shared Normalizer konsistent transformiert
- kein stilles Fallenlassen des Triplets mehr

### 3) Analyze-Route nutzt expliziten Sprachkontext

Geaendert:
- `apps/web/src/app/api/contributions/analyze/route.ts`

Ergaenzt:
- Route leitet Triplet einmal zentral aus dem Request ab
- Analyze-Lauf nutzt `contentLanguage` als Analyse-Sprache
- Build von `createAnalyze` transportiert Triplet explizit weiter
- Match-Aufruf setzt expliziten Sprachmodus `same_language_only`

### 4) Create-Analyze Contract + Match-Meta gehaertet

Geaendert:
- `apps/web/src/features/create/analyzeContract.ts`
- `apps/web/src/features/create/matchService.ts`

Ergaenzt:
- `buildCreateAnalyzeResponse` akzeptiert `languageContext` override
- Response traegt nun explizit `matchingLanguageMode`
- Match-Result transportiert `languageMode` (`same_language_only`) deterministisch
- Fallbacks (no-match/degraded) bleiben stabil und explizit

### 5) Boundary-Parser defensiver gemacht

Geaendert:
- `apps/web/src/features/create/analyzeBoundaryContract.ts`

Ergaenzt:
- Parser verlangt nicht-leere Triplet-Felder (`uiLocale`, `contentLanguage`, `sourceLanguage`)
- Parser akzeptiert nur `matchingLanguageMode = same_language_only`

## Tests / Verifikation

Neu:
- `apps/web/tests/create-language-context-contract.test.ts`

Aktualisiert:
- `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.test.ts`
- `apps/web/tests/create-analyze.contract.test.ts`
- `apps/web/tests/create-analyze.boundary-contract.test.ts`
- `apps/web/tests/create-analyze.envelope.test.ts`
- `apps/web/tests/create-match.service.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/create-analyze.create-route.test.ts`

Gelaufen:
- `pnpm -C apps/web exec vitest run tests/create-language-context-contract.test.ts src/app/api/contributions/analyze/parseAnalyzeRequest.test.ts tests/create-analyze.contract.test.ts tests/create-analyze.boundary-contract.test.ts tests/create-analyze.envelope.test.ts tests/create-match.service.test.ts tests/create-analyze.route.test.ts tests/create-analyze.create-route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Alle Checks grün.

## Ergebnis

`GOV-AI-06A` ist als kleiner technischer Hardening-Slice abgeschlossen:
- Triplet-Contract ist im Analyze-Einstieg und in der Response klarer/robuster.
- Matching-Sprachmodus ist explizit als `same_language_only` eingefroren.
- Keine neue Matching-Architektur, keine Produktlogik-Erweiterung, keine Scope-Drift.

## Bewusst nicht Teil dieses Slices

- keine cross-lingual Ranking-/Search-Engine
- kein Embedding-/Retriever-Rewrite
- keine globale Migration aller Routen/Inhalte auf neue Sprachmodelle
- keine App-/Wrapper-/Store-Arbeit
