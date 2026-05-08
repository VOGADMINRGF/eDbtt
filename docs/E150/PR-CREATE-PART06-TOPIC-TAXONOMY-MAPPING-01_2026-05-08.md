# PR-CREATE-PART06-TOPIC-TAXONOMY-MAPPING-01

Datum: 2026-05-08
Status: erledigt
Bezug: Issue #98 Slice D

## Ziel

`/create`-Strukturäste an den verbindlichen Part06-Themenkatalog anbinden, ohne eine zweite 17-19er-Taxonomie anzulegen.

## Part06-Abgleich

Gelesene Docs:

- `docs/E150/Part06_Themenkatalog_und_Zustaendigkeiten.md`
- `docs/E150/Part06_Consequences_Fairness.md`
- `docs/E150/OpenTasks.md`

Geprüfte Module:

- `features/interests/topics.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`

Bestätigte Part06-Hauptkategorien:

1. `democracy_elections`
2. `budget_finance`
3. `work_economy`
4. `social_family`
5. `education_research`
6. `health_care`
7. `climate_environment`
8. `energy_infrastructure`
9. `mobility_urban`
10. `interior_security`
11. `justice_law`
12. `migration_integration`
13. `digital_media`
14. `europe_foreign`
15. `local_community`

## Technische Umsetzung

- Neue SSOT-nahe Mapping-Hilfe in `apps/web/src/features/create/part06TopicMapping.ts`.
- `CreateStructureBranch` trägt jetzt `part06CategoryKeys`, `part06CategoryLabels` und `topicTags`.
- `buildCreateStructureBranches(...)` mappt die bestehenden Strukturäste explizit auf Part06-Kategorien:
  - `Wohnen und Genehmigungen` -> `mobility_urban`, `local_community`
  - `Verkehr, Klima und Alltagstauglichkeit` -> `mobility_urban`, `climate_environment`
  - `Bildung, Integration und Sicherheit` -> `education_research`, `migration_integration`, `interior_security`
  - `Gesundheit und Pflege` -> `health_care`
  - `Finanzen und Beteiligung` -> `budget_finance`, `democracy_elections`, `local_community`
- `CreateVisualFollowup.tsx` zeigt die Part06-Labels kompakt als Chips und hält nutzernahe Tags getrennt sichtbar.

## Keine Doppelstruktur

- Es wurde keine neue 17-19er-Hauptkategorienliste angelegt.
- Das bestehende `features/interests/topics.ts` bleibt in diesem Slice unverändert; dort existieren weiterhin kürzere technische Alias-Keys wie `mobility` oder `budget`.
- Die neue Create-Mapping-Schicht dient nur dazu, die Strukturäste explizit auf die in Part06 dokumentierten Vollkeys zu beziehen, ohne repo-weite Topic-Key-Migration in diesem Slice zu erzwingen.

## Validierung

Geplante/ausgeführte Kommandos:

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx
```
