# CREATE-MULTIBRANCH-FRONTEND-PILOT_GREEN

## Status

- Typecheck grün
- Lint grün
- fokussierte Tests grün
- `/create` Multi-Branch ist als Frontend-/Draft-Pilot aktuell pilotfähig

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-planner-openai-happy-path.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-handoff.persistence.route.test.ts tests/admin-ai-orchestrator-smoke.route.test.ts tests/ai-provider-smoke-cli.test.ts`

Ergebnis:

- `7/7` Testdateien grün
- `88/88` Tests grün

## Pilotfähiger Umfang

- GPT-Quick-Planner erkennt Mehrthemen-Beiträge und baut ein `ContributionPackage` mit mehreren Themenästen.
- Nutzer können pro Ast unterschiedliche Entwurfsaktionen vormerken.
- Existing-Match bleibt nur Vorschlag/Vormerkung, wenn echte Matchdaten vorhanden sind.
- Draft-Sicherung bleibt lokal plus best-effort serverseitig.
- Der Flow ist aktuell als Frontend-/Draft-Pilot nutzbar, ohne dass daraus bereits ein öffentlicher oder gezählter Zustand wird.

## Guardrails

- Keine automatische Veröffentlichung
- Keine automatische Stimme
- Kein automatisches Mergen
- Swipes und QR bleiben Draft/Preparation bis zur expliziten Bestätigung

## Bewusst offen bleibende Folge-Slices

- `CREATE-BRANCH-LEDGER-PERSISTENCE-05`
- `CREATE-EXISTING-MATCH-COUNTING-06`
- `CREATE-QR-SWIPES-PUBLISH-PREP-07`
