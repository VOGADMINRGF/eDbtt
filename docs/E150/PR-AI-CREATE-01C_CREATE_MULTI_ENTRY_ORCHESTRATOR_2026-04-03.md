# PR-AI-CREATE-01C `/create` Multi-Entry-Orchestrator Contract (2026-04-03)

Ziel dieses Slices: `/create` als intent-basierter Intake-/Analyse-/Routing-Kern
schaerfen, ohne neue Wahrheits-/Prioritaets-/Ranking-Logik und ohne UI-Grossumbau.

## 1) Scope

- Shared Contract fuer Entry-Intent, Entry-Mode, Kontext-/Zielzuschnitt und Routing-Hints.
- Additive Anbindung in `/create` Page/Client.
- Keine neue API-Landschaft.
- Kein Billing-/Funding-/Publisher-Rewrite.

## 2) Implementierungsanker

- Neuer Contract:
  - `apps/web/src/features/create/orchestratorIntentContract.ts`
- Additive Nutzung:
  - `apps/web/src/app/create/page.tsx`
  - `apps/web/src/app/create/CreateClient.tsx`

## 3) Entry-Intents (kanonisch, klein gehalten)

- `issue_signal`
- `content_companion`
- `round_setup`
- `org_context_setup`

Entry-Modi:
- `guided`
- `direct`

Die Intents sind Arbeits-/Einstiegskontexte, keine Wahrheits- oder Machtstufen.

## 4) Analyse- und Input-Schnitt

Der Contract haertet explizit:
- Originalinput bleibt erhalten.
- Analyse ist Vorschlagsschicht.
- Nutzerentscheidung bleibt zentral.
- Kein Auto-Publish.
- Keine Auto-Wahrheits-/Prioritaetsaufwertung.

## 5) Routing-Schnitt `/create` vs `/runden`

- `/create` bleibt Intake-Orchestrator.
- `/runden` bleibt laufende Betriebs-/Arbeitsflaeche.
- Fallback-Routing bleibt standardmaessig `/swipes`.
- Bei explizitem `round_setup` oder `org_context_setup` wird als
  Betriebsziel `/runden` gehintet.
- Dossier bleibt Oberraum: vorhandenes `dossierId` hat Vorrang fuer
  `/dossier/<id>` als Fallbackziel.

## 6) Guardrails

- keine Wahrheits-Sondermacht
- keine Prioritaets-Sondermacht
- keine Ranking-Sondermacht
- keine Voting-Sondermacht
- Dossier bleibt Oberkontext
- Companion bleibt Begleit-/Follow-up-Format

## 7) Tests

- `apps/web/tests/create-orchestrator-intent-contract.test.ts`
- `apps/web/tests/create-mode.page.test.ts` (Round-Setup-Routingfall)

## 8) Bewusst nicht Teil dieses Slices

- Kein UI-Rebuild fuer alle Zielgruppen.
- Kein neuer `/create`-Wizard.
- Kein Rewrite aller Folgeflaechen.
- Keine neue Leitentscheidung ausserhalb des Create-/Routing-Blocks.
