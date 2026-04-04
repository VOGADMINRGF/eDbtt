# GOV-ATLAS-01A - Dossier-Atlas / Themenlandschaft Contract (2026-04-04)

## Scope

Kontraktnaher Unterbau fuer eine uebergeordnete Themenlandschaft:
- Thema/Region als getrennte Achsen.
- Anlass/Dossier/Runde/Ergebnis/Companion als unterschiedliche Knoten.
- Kontextmarker fuer Verband/Verein/Organisation/Redaktion/Civic/Experten ohne Wahrheits- oder Prioritaetsprivileg.
- Wochen-Snapshot-Faehigkeit ohne Toplist-Ranking.

Kein UI-Grossumbau, kein neues Ranking, kein Auto-Publish.

## Umgesetzt

1. Typed Atlas-/Landschafts-Contract
- `features/anlassraum/dossierAtlasLandscapeContract.ts`
- Enthalten:
  - Knotentypen (`topic_cluster`, `anlass_node`, `dossier_node`, `round_node`, `result_node`, `companion_node`, Kontextmarker)
  - Beziehungstypen (Topic->Anlass/Dossier, Anlass->Runde/Ergebnis/Companion, Dossier->Runde/Ergebnis, Kontextmarker->Anlass/Dossier)
  - Aggregationen (`totals`, `weeklySnapshot`)
  - `topicAxis` und `regionAxis` als explizit getrennte Strukturen
  - Guardrails gegen Wahrheits-/Prioritaets-/Voting-/Reputationsdrift

2. Resolver + Parse/Consistency Helpers
- `resolveDossierAtlasLandscapeContract(...)`
- `parseDossierAtlasLandscapeContract(...)`
- `evaluateDossierAtlasLandscapeConsistency(...)`

3. Snapshot-Eignung
- Wochenwerte im Contract:
  - `newContributions`
  - `newAnlassraeume`
  - `activeRounds`
  - `openQuestions`
  - `newDossiers`
  - `followupFlows`

## Guardrails

- Thema und Region bleiben getrennt (`separatedFromRegionAxis`, `separatedFromTopicAxis`).
- Kontextsichtbarkeit bleibt nicht-epistemisch (`nonEpistemic`) und ohne Prioritaetsboost (`nonPriorityBoost`).
- Kein Feed-Auto-Publish, keine versteckte Reputationsmaschine, kein Toplist-Zwang.

## Tests

- `apps/web/tests/dossier-atlas-landscape-contract.test.ts`
