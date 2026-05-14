# PR-CREATE-HANDOFF-INTEGRITY-01

Datum: 2026-05-10
Status: done

## Ziel

Alle Handoffs aus `/create` in Richtung Faktencheck, Dossier, Beteiligung, Graph-Anschluss und Beitragseinreichung sollen einen reviewbaren Arbeitsstand mitgeben statt nur Navigation ohne Kontext.

## Umgesetzt

- `CreateHandoffDraft` als reviewbarer Transfer-Contract eingefuehrt:
  - `source=create`
  - `sourceText`
  - `plannerResult`
  - `graphMatches`
  - `claims`
  - `arguments`
  - `openQuestions`
  - `sourceGrounding`
  - `reviewState`
  - `requiresConfirmation=true`
- `/create` erzeugt bei CTA-Handoffs jetzt einen gespeicherten Handoff-Draft statt eines kontextlosen Zielwechsels.
- Faktencheck-Handoff bleibt nicht-mutativ:
  - kein Auto-DeepSearch
  - kein Factcheck-Siegel
  - Claim-Preview statt stiller Pruefung
- Dossier-Handoff bleibt bestaetigungspflichtig:
  - keine automatische Anheftung an bestehende Dossiers
  - Handoff-Box auf `/dossier` und `/dossier/[id]`
- Swipes- und Contributions-Ziele zeigen den mitgegebenen Arbeitsstand ebenfalls sichtbar an.
- Graph-Matches fuehren jetzt `relation` und bleiben komplett `requiresConfirmation=true`.
- Claim-/Argument-Trennung fuer normative vs. pruefbare Aussagen im Create-Handoff verankert.

## Contract-Absicherung

- `create-handoff-draft.contract.test.ts`
- `create-factcheck-handoff.contract.test.ts`
- `create-dossier-handoff.contract.test.ts`
- `create-argument-claim-separation.contract.test.ts`
- `create-graph-match-confirmation.contract.test.ts`
- `live-click-hardening.contract.test.ts`

## Guardrails bestaetigt

- keine automatische Veroeffentlichung
- keine automatische Stimme
- kein stiller Graph-Merge
- keine automatische DeepSearch
- kein automatisches Factcheck-Siegel
- Planner-first bleibt erhalten; Heuristiken bleiben technischer Fallback
