# PR-CREATE-E150-CONTRACT-DEDUP-AUDIT-01

## Ziel

Create-Follow-up-Helfer gegen den E150-Kanon aus Part16 und Part06 abgleichen, damit `linkIntake`, `CreateStructureBranch` und die Part06-Spiegelung klar als Mirror, UI-Gate oder ViewModel eingeordnet bleiben und keine parallele Fachlogik bilden.

## Gelesene E150-Docs

- `docs/E150/Part16_AI_Orchestration_and_Safety.md`
- `docs/E150/Part06_Themenkatalog_und_Zustaendigkeiten.md`
- `docs/E150/OpenTasks.md`

## Gelesene Repo-Stellen

- `apps/web/src/features/create/{linkIntake.ts,CreateLinkIntakeClarification.tsx,intelligentFollowup.ts,intelligentFollowupContract.ts,part06TopicMapping.ts,CreateVisualFollowup.tsx}`
- `apps/web/src/app/api/create/{analyze/route.ts,intelligent-followup/route.ts}`
- `apps/web/src/app/api/contributions/analyze/{parseAnalyzeRequest.ts,route.ts}`
- `features/analyze/{analyzeContribution.ts,schemas.ts,sourceGroundingContract.ts}`
- `features/ai/{orchestratorE150.ts,e150/verificationContract.ts}`
- bestehende Create-Contracts in `apps/web/tests/{create-intelligent-followup.contract.test.ts,analyze-workbench-hidden-until-start.test.ts,create-curated-dialog-workspace.contract.test.tsx,create-link-intake-clarification.contract.test.tsx}`

## Ableitungsbaum

E150 Intake/Analyze Envelope
→ normalized create follow-up model
→ UI-only view models
   - compact summary
   - active branch view
   - details accordions
   - source/link clarification

## Doppelstruktur-Matrix

| E150-Feld/Contract | Code-Feld/Helper | Status | Entscheidung |
| --- | --- | --- | --- |
| `inputType`, `segments`, `sourceHints`, `missingInfoQuestions` | `apps/web/src/features/create/linkIntake.ts` | mirror / ui-gate | Behalten. Kopfkommentar + `resolveCreateLinkIntentE150Mapping()` markieren die Datei explizit als Part16-Mirror ohne Auto-Auswertung. |
| `claims`, `evidenceNeeds`, `questionCandidates`, `openQuestions` | `CreateUnderstandingResult` in `intelligentFollowupContract.ts` | normalized model | Behalten. Als normalisierte `/create`-Follow-up-Schicht einordnen, nicht als neuer Domain-Contract. |
| `Anschluss` nach Analyse, aber kein Auto-Merge/Auto-Assign | `CreateConnectionSuggestion` | view-model / duplicate-risk | Behalten. Kommentar begrenzt die Rolle auf reviewbare UI-Anschlussvorschlaege. |
| `topics`, `claims`/Statements, `questionCandidates`, Part06-Zuordnung | `CreateStructureBranch` | view-model | Behalten. Explizit als UI-only ViewModel fuer den Active-Branch-Workspace dokumentiert. |
| heuristische Gruppierung fuer `/create`-Lesbarkeit | `STRUCTURE_BRANCH_DEFINITIONS` | view-model / duplicate-risk | Behalten. Als heuristische UI-Grouping-Regeln markiert, nicht als Kanon oder zweite Taxonomie. |
| Part06 15 Hauptkategorien | `part06TopicMapping.ts` | mirror | Behalten. Kommentar geschaerft und per Contract auf exakt 15 Keys fixiert. |

## Themenverlust-Pruefung

- Vorher bestand das Risiko, dass bei `maxBranches=3` Themen nur dann sichtbar blieben, wenn sie bereits in den sichtbaren Branch-Themenfeldern auftauchten.
- Jetzt sammelt `collectUnassignedCreateTopics(...)` alle erkannten Themen, die in den sichtbaren Branches nicht mehr vertreten sind, und haengt sie als `overflowTopics` an den letzten sichtbaren Branch.
- Ergebnis:
  - versteckte Branch-Themen bleiben ueber `Weitere Themen` sichtbar
  - auch nicht branch-gematchte Themen wie `Energieversorgung` verschwinden nicht komplett
  - bei fehlenden Branches bleibt weiterhin der kompakte No-Branch-Fallback in `CreateVisualFollowup` zustaendig

## Keine neuen Fachentscheidungen

- keine neue Analyze Engine
- keine neue Produkt- oder Routing-Entscheidung
- keine neue Taxonomie neben Part06
- keine Gemini-/NotebookLM-/Scraping-Implementierung
- keine automatische Link-Auswertung

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/create-e150-contract-dedup-audit.contract.test.ts`
