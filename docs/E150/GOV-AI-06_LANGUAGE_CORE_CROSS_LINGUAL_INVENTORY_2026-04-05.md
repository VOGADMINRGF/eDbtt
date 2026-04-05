# GOV-AI-06 - Language-aware Core + Cross-lingual Matching Inventory (2026-04-05)

## Scope

Research-only Abschluss fuer `GOV-AI-06`:
- kein KI-/Matching-Grossumbau
- keine neue Search-/Orchestrierungsarchitektur
- keine globale Content-Migration
- nur Ist-Inventar + Gap-Liste + belastbare Folgeempfehlung

## Kurzfazit

`GOV-AI-06` kann als research-only Parent auf `done` gehen:
- Der Ist-Bestand fuer `uiLocale`, `contentLanguage`, `sourceLanguage` ist inventarisiert.
- Sprach-/Matching-kritische Luecken sind konkret benannt.
- Ein kleiner technischer Folge-Slice (`GOV-AI-06A`) ist als naechster, entscheidungsfreier Contract-Hardening-Pfad ableitbar.

## Inventar-Matrix (language-/matching-kritische Pfade)

| Pfad / Route / Service | Sprachrelevanter Zweck | `uiLocale` | `contentLanguage` | `sourceLanguage` | Cross-lingual Verhalten explizit | Risiko / Gap | Folge-Slice noetig |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` + `apps/web/src/app/api/contributions/analyze/route.ts` | Intake/Analyze-Start + Match/CTA-Einstieg | ja (UI `locale` wird gesendet) | nein (nur clientseitige Anzeige-Sprache via `useContentLang`) | nein | nein | Request-Eingang trennt UI-/Content-/Source-Sprache nicht; Analyze/Match laufen mit einem `locale`-Wert | ja |
| `apps/web/src/features/create/analyzeContract.ts` | Create-Analyze-Response-Contract (`create_analyze.v1`) | ja | ja | ja | nein | Triplet ist vorhanden, aber Ableitung ist heuristisch (`sourceLanguage`) bzw. an `locale` gekoppelt (`contentLanguage`, `uiLocale`) | ja |
| `apps/web/src/features/create/analyzeBoundaryContract.ts` | Boundary-Parser zwischen Route und Workspace | implizit | implizit | implizit | nein | Parser erzwingt Triplet-Felder nicht explizit; Contract-Vertrauen fuer Sprachkontext bleibt weich | ja |
| `apps/web/src/features/create/matchService.ts` | Graph-Matching fuer Anlassraum/Dossier/Claims | nein (nur optionales `locale` Feld im Input-Typ) | nein | nein | nein | `locale` wird nicht genutzt; Matching basiert auf `normalizeGermanSearchText` + de/en-lastigen Stopwords; keine explizite cross-lingual Strategie | ja |
| `apps/web/src/features/create/prepareAttachDraft.ts` + `apps/web/src/app/api/contributions/attach-drafts/route.ts` | Prepare-Attach Review-Draft Persistenz | ja | ja | ja | nein | Sprachtriplet wird sauber gespeichert, beeinflusst aber Decisioning/Matching nicht | nein |
| `apps/web/src/features/i18n/contentTranslations.ts` + `apps/web/src/features/i18n/contentTranslationProduction.ts` + `apps/web/src/app/api/i18n/translate/route.ts` | Reader-Locale Rendering + Uebersetzungsproduktion | ja | ja (preferred locale) | teilw. (`originalLanguage`) | teilw. (Darstellung/Translation) | Gute Anzeige-/Uebersetzungsbasis, aber nicht an Match-/CTA-Entscheidung angebunden | ja |
| `apps/web/src/app/api/contributions/refine/route.ts` + `apps/web/src/app/api/contributions/trace/route.ts` + `apps/web/src/app/api/contributions/analyze/save/route.ts` | High-impact Prompt-/Output-Routen | teilw. (`locale`) | nein | nein | nein | Sprachsteuerung ist de/en- oder unversioniert-lokal; kein konsistenter Triplet-Transport | ja |
| `apps/web/src/app/api/contributions/research/route.ts` | Research-Guidance fuer Analyze-Workspace | teilw. (`locale`) | nein | nein | nein | Guidance ist DE-vs-nicht-DE geschaltet; kein expliziter Source-vs-UI-Kontext | optional |
| `apps/web/src/app/api/factcheck/enqueue/route.ts` | Factcheck-Queue Analyse-Einstieg | nein (nur `language`) | nein | nein | nein | Monolingualer Job-Kontext (`toShortLang`), keine Trennung von Eingabe-/Anzeige-/Quellsprache | optional |
| `apps/web/src/app/api/dossiers/[dossierId]/sources/upsert/route.ts` | Dossier-Quellenpflege | nein | nein | teilw. (pro Source `language`) | nein | Quelle kann Sprache tragen, aber kein durchgaengiger language-aware Match-/Read-Contract | optional |

## Priorisierte Gaps

1. **Kein durchgaengiger Language-Context-Contract am Analyze/Match-Einstieg**
   - Request-Ebene nutzt primaer `locale`.
   - `uiLocale/contentLanguage/sourceLanguage` entstehen spaeter, aber nicht als strikt validierter Boundary-Contract.

2. **Cross-lingual Matching ist nicht explizit implementiert**
   - `matchService` deklariert `locale`, nutzt es aber nicht.
   - Tokenisierung/Normalisierung ist german-ascii-zentriert (`normalizeGermanSearchText`), wodurch echte cross-lingual Match-Qualitaet unbelegt bleibt.

3. **High-impact KI-Routen tragen Sprachkontext uneinheitlich**
   - `refine/trace/analyze-save` arbeiten mit lokalem `locale`-Handling (teils de/en), ohne einheitlichen Triplet-/Contract-Transport.

4. **Translation-Layer und Matching-Layer sind getrennt**
   - Reader-/Translation-Funktionen sind vorhanden.
   - Match-/CTA-Entscheidung nutzt diese Sprachmetadaten aktuell nicht.

## Empfehlung (kleiner Folge-Slice)

`GOV-AI-06A` als technischer, entscheidungsfreier Hardening-Slice:

- shared Normalizer fuer `{ uiLocale, contentLanguage, sourceLanguage }` am Analyze-Einstieg,
- explizite Boundary-Validierung dieser Felder,
- `matchService` mindestens auf klaren Sprachmodus festziehen (z. B. `same_language_only` als expliziter Startmodus statt impliziter cross-lingual Annahme),
- defensive Tests fuer Locale-Triplet-Transport + no-silent-cross-lingual Drift.

Damit entsteht noch keine neue Matching-Architektur, aber eine belastbare Contract-Basis fuer spaetere cross-lingual Erweiterung.

## Bewusst nicht Teil dieses Slices

- keine neue multilingual Matching-Engine
- kein Embedding-/Search-Rewrite
- keine globale Migration aller Inhalte auf neue Sprachfelder
- keine App-/Wrapper-/Store-Themen
