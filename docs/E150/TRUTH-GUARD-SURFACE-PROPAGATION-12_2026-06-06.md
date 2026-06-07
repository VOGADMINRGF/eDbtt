# TRUTH-GUARD-SURFACE-PROPAGATION-12

Datum: 2026-06-06
Status: done

## Geprüfte Surfaces

- `/create` Analyse-Ergebnis über `AnalyzeWorkspace` und `VerificationStatusPanel`
- `/account` Arbeitsstände über `AccountResumeWorkbenchSection` und ergänzende Review-Hinweise in `AccountClient`
- `/themen` Start-Draft-Handoff über `ThemenStartDraftAssistant`
- `/runden/new` Start-Draft-Handoff über `AnlassraumSetupForm`
- Share-/Output-Vorschau über `SocialOutputPreviewPanel` und `socialOutputContract`
- routegebundener Companion über `RouteBoundCompanionPanel`, `routeBoundCompanion.ts` und `/api/chat`
- Factcheck-Surface über `FactcheckSurface` plus zentrale Verification-Präsentation

## Übernommene Truth-Felder

- `verificationLabel`
- `truthStatus`
- `sourceSupport`
- `sourceStatus`
- `reviewRecommended`
- `noTruthPromotion`
- `noAutoGraphPromotion`

## Vereinheitlichte Labels

- `draft_analysis` → `Analyse-Entwurf`
- `source_open` → `Quellenlage offen`
- `source_grounded` → `Quellenbezug vorhanden`
- `review_required` → `Prüfung empfohlen`
- `factcheck_requested` → `Quellenprüfung angefragt`
- `factcheck_passed` → `Quellenprüfung erfolgt`
- `sealed_verified` → `Verifiziert`

Zusätzlich für `sourceSupport`:

- `none` → `Keine Quellenprüfung gestartet`
- `open` → `Noch unbelegt`
- `inferred` → `Abgeleitet – bitte prüfen`
- `partial` → `Teilweise belegt`
- `sourced` → `Quellenbezug vorhanden`
- `sealed` → `Verifiziert`

## Schutz vor falschem Faktencheck-/Verifiziert-Wording

- Standard-/Material-Lanes zeigen ohne belastbare Truth-Meta kein `geprüft` oder `verifiziert`.
- Share-/Companion-Ausgaben nutzen dieselben konservativen Display-Helper wie Create/Factcheck.
- Sealed-Factcheck-Surfaces unterscheiden jetzt sichtbar zwischen angefragter Quellenprüfung, erfolgter Quellenprüfung und echter Verifizierung.
- Draft-Handoffs in Themen/Runden/Account markieren den Zustand explizit als Analyse-/Arbeitsstand und versprechen weder Veröffentlichung noch automatische Zusammenführung.

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/e150-verification-presentation.contract.test.ts tests/social-output-contract.test.ts tests/route-bound-companion.contract.test.ts tests/chat-route.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/create-analyze.workspace-ui.test.ts tests/truth-guard-surface-propagation.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/e150-truth-guard.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/create-analyze.safety-gate.test.ts tests/e150-verification-presentation.contract.test.ts tests/social-output-contract.test.ts tests/route-bound-companion.contract.test.ts tests/chat-route.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/create-analyze.workspace-ui.test.ts tests/truth-guard-surface-propagation.contract.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/themen-surface-staging.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- Relevante Truth-Guard-/Create-/Account-/Share-/Companion-/Themen-/Runden-Tests grün

## Offene Punkte

- Weitere Admin-/Review-Surfaces nutzen weiterhin teilweise implizite Status-Texte und können in einem separaten Slice ebenfalls auf die zentralen Truth-Display-Helper umgestellt werden.
- Produktive persisted Handoffs tragen noch nicht überall denselben expliziten Truth-Meta-Satz wie der Analyze-Envelope; die UI ist jetzt konservativ, aber die Ledger-/Persistence-Schicht bleibt ein möglicher Folgepunkt.
