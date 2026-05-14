# PR-CREATE-MATERIAL-ORCHESTRATION-01

Stand: 2026-05-10

## Ziel

`/create` und `/api/contributions/analyze` behandeln YouTube-Links, PDFs und Uploads nicht mehr nur als Freitext-Anlass, sondern als eigene Material-Lane. NotebookLM/NotebookLLM wird als adapterbasierte Material-Verstehensschicht eingefuehrt. Gemini Research ist der Standard fuer diese Lane. OpenAI DeepSearch bleibt ein kosten- und bestaetigungspflichtiger Fallback.

## Umsetzung

- Neue Material-Erkennung in [materialRouting.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/src/features/create/materialRouting.ts):
  - erkennt YouTube-URLs, PDFs und Uploads
  - normalisiert `sourceUrls`, `uploadIds`, `materialItems`, `evidenceItems`
  - leitet `researchMode`, `lane`, `materialProvider`, `researchProvider`, `fallbackUsed`, `requiresHumanReview` ab
  - haelt unklare Ortsformulierungen auf `clarification_required` statt Recherche-Umweg
- Neuer Notebook-Adapter in [notebookMaterialAdapter.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/src/features/material/notebookMaterialAdapter.ts):
  - mockbar und API-unabhaengig
  - liefert `summary`, `claims`, `openQuestions`, `sourceRefs`, `coverage`
  - speist `youtube_transcript`, `pdf_document` und `material_summary` als Evidence-Items ein
- Source-Grounding erweitert in [sourceGroundingContract.ts](/Users/RF/Arbeitsmappe/edebatte-org/features/analyze/sourceGroundingContract.ts):
  - neue Kinds plus `pageRef`, `timestampRef`, `extractedBy`
  - Audit zaehlt Materialextraktion als `complete`, `partial`, `none`
- Journey-/Verification-Routing erweitert:
  - `material_grounding` in [journeyProfiles.ts](/Users/RF/Arbeitsmappe/edebatte-org/features/ai/e150/journeyProfiles.ts)
  - `gemini` als Research-Label in [verificationPresentation.ts](/Users/RF/Arbeitsmappe/edebatte-org/features/ai/e150/verificationPresentation.ts)
  - Provider-Rollen fuer Gemini Research in [providerRoleRouting.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/src/features/ai/providerRoleRouting.ts)
- Analyze-Route erweitert:
  - [parseAnalyzeRequest.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts) akzeptiert Material-only-Requests
  - [route.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/src/app/api/contributions/analyze/route.ts) fuehrt Material-Lane vor dem eigentlichen Analyze-Job aus und spiegelt Lane-/Provider-Meta im Response
- DeepSearch-Gates:
  - `E150_DEEPSEARCH_ENABLED=false` default
  - `E150_DEEPSEARCH_REQUIRE_CONFIRMATION=true` default
  - `OPENAI_DEEPSEARCH_MODEL` optional, mit Rueckfall auf bestehende Deep-Research-Env-Namen

## Guardrails

- Kein Auto-Publish
- Kein Auto-Merge
- Kein stilles Siegel
- Kein Standard-Research fuer normalen Freitext
- Kein DeepSearch ohne explizites `allowDeepSearch=true` plus Bestaetigung

## Tests

- [create-material-routing.contract.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/create-material-routing.contract.test.ts)
- [create-mode.analyze-parse.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/create-mode.analyze-parse.test.ts)
- [create-analyze.route.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/create-analyze.route.test.ts)
- [source-grounding-contract.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/source-grounding-contract.test.ts)
- [e150-journey-routing.contract.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/e150-journey-routing.contract.test.ts)
- [e150-verification-presentation.contract.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/e150-verification-presentation.contract.test.ts)
- [create-analyze-envelope.verification.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/create-analyze-envelope.verification.test.ts)

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-material-routing.contract.test.ts tests/create-mode.analyze-parse.test.ts tests/create-analyze.route.test.ts tests/source-grounding-contract.test.ts tests/e150-journey-routing.contract.test.ts tests/e150-verification-presentation.contract.test.ts tests/create-analyze-envelope.verification.test.ts`

