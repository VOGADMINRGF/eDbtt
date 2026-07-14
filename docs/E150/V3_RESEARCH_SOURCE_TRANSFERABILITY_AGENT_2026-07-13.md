# V3 Research Source Transferability Agent 2026-07-13

## Scope

- Task: `V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01`
- Batch branch: `pr/v3-agentic-safe-trace-intake-regional-research-01`
- Primary role: `research_source`
- Supporting: `dossier_briefing`, `governance_compliance`

## Ziel

Die bestehende Quellen-/Trust-Wahrheit ueber einen kleinen typed Research-/Transferability-Contract weiterziehen, der Originalquelle, Sprache, Retrieval-Zeit, Issuer, Jurisdiction und die Grenze `translation != evidence` belastbar festhaelt.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/researchSourceTransferabilityAgentContract.ts`

Der Contract:

- baut auf `buildCanonicalSourcePack(...)` auf;
- behaelt Original- und Uebersetzungs-Snippets getrennt;
- markiert Uebersetzungen ausschliesslich als Lesehilfe;
- kennzeichnet internationale Referenzen als Transferability-Review statt lokaler Wahrheitsbehauptung;
- haengt dafuer eine user-safe Source-/Transfer-Trace-Stufe an.

## Testabdeckung

- `apps/web/tests/research-source-transferability-agent.contract.test.ts`

Geprueft wird:

- Originalsprache und Uebersetzung bleiben getrennt;
- `translationIsEvidence` bleibt `false`;
- internationale Quellen werden nicht still lokalisiert;
- Transferability braucht eine bewusste Review-Stufe;
- Source-Pack- und Transferability-Artefakte erscheinen in der Safe Trace ohne Debug-Interna.

## Guardrails

- translation is not evidence
- keine lokale Wahrheitsbehauptung aus internationalen Beispielen
- keine neue Source-Architektur
- kein Auto-Publish

## Validierung

- geteilter Batch-Lauf mit:
  - `tests/research-source-transferability-agent.contract.test.ts`
  - `tests/agent-run-artifact-safe-trace.contract.test.ts`
  - `tests/agent-registry-bootstrap.contract.test.ts`
- Batch-Ergebnis:
  - `6` Dateien, `10/10` Tests gruen
  - `lint` gruen
  - `build` gruen
  - `typecheck` nur bekannte `.next/types/**/*.ts`-Drift (`TS6053`)
