# AGENTS.md

## Purpose

This repository is operated with a documentation-first, task-driven workflow.

The single operational source of truth for implementation work is:

- `docs/E150/OpenTasks.md`

Codex and other coding agents must treat `OpenTasks.md` as the canonical work queue for implementation slices, documentation harmonization, follow-up hardening, and backlog hygiene.

---

## Core Operating Rules

### 1. OpenTasks is the SSOT
Agents must not invent their own backlog when a relevant task already exists in `docs/E150/OpenTasks.md`.

Before starting work, always:
1. read the relevant section(s) in `docs/E150/OpenTasks.md`
2. determine whether the task is:
   - `codex_ready`
   - `needs_decision`
   - `blocked`
   - `research_only`
   - `done`

Only `codex_ready` tasks may be implemented without further confirmation.

### 2. Never silently decide product questions
If a task touches:
- naming of core surfaces
- canonical routing rules
- role model changes
- dossier/anlassraum/governance semantics
- pricing/paywall/product packaging
- visibility/public-vs-private rules
- workflow canonization

and the decision is not already documented, the agent must:
1. stop at the decision boundary
2. leave code unchanged or keep changes local and reversible
3. ask one short targeted clarification

Do not silently “harmonize” product strategy by guessing.

### 3. Work in small slices
Default execution unit:
- 1 to 3 `codex_ready` tasks
- or one coherent PR-sized slice

Each slice should:
- have clear scope
- update code and docs together when relevant
- update `OpenTasks.md` before finishing

### 4. Documentation and code must stay aligned
If a task changes behavior, routing, surface semantics, or architectural interpretation:
- update the relevant docs in the same slice
- update `docs/E150/OpenTasks.md`
- explicitly note remaining drift if not fully resolved

### 5. Tests are mandatory when practical
For implementation tasks, agents must:
- run relevant tests for changed areas
- add or update tests when the repo already has an appropriate test pattern
- avoid inventing unnecessary new test infrastructure

### 6. Prefer existing architecture over new parallel paths
When implementing a task:
- reuse existing helpers, services, and patterns
- avoid duplicate route logic
- avoid adding a second canonical flow where one already exists
- prefer centralization of small critical logic

### 7. No hidden backlog drift
If an agent discovers drift, duplication, or unresolved adjacent work:
- do not silently absorb everything into the same slice
- finish the requested task cleanly
- add a follow-up entry to `docs/E150/OpenTasks.md`

### 8. Frontend language rule (verbindlich)
Für deutschsprachige Frontend-Texte gilt:
- Umlaute und ß normal schreiben (`ä`, `ö`, `ü`, `Ä`, `Ö`, `Ü`, `ß`)
- keine Umschreibungen mit `ae`, `oe`, `ue` in UI-Texten
- technische Bezeichner, IDs und APIs bleiben davon unberührt

### 9. Canonical brand narrative (verbindlich)
Für öffentliche oder öffentlichkeitsnahe eDebatte-Texte gilt `docs/brand/EDEBATTE_BRAND_NARRATIVE.md` als kanonische Marken- und Positionierungsgrundlage.

Das betrifft insbesondere:
- Homepage und Landingpages
- Marketing und Kampagnen
- Social Media und Video
- Presse, Präsentationen und Partneransprache
- Membership- und produktnahe Erklärungstexte

Vor entsprechenden Änderungen müssen Agenten die kanonische Datei lesen und folgende Grenzen einhalten:
- keine parallele oder widersprüchliche Markenpositionierung etablieren
- die öffentliche Langfassung als drei natürliche Absätze führen, ohne sichtbare Why–How–What-Überschriften
- Stimmen, Perspektiven, Quellen, Evidenzen, Zusammenhänge und den Debattenstand in ihrer Bedeutung erhalten
- nicht behaupten, dass über Fakten oder Wahrheit abgestimmt wird
- nur tatsächlich verfügbare Produktfunktionen und Automatisierungen versprechen
- einen echten Bedeutungswechsel zuerst in der kanonischen Datei und anschließend in `docs/E150/OpenTasks.md` synchronisieren

---

## Required Task Status Meanings

- `open`
- `codex_ready`
- `in_progress`
- `blocked`
- `needs_decision`
- `research_only`
- `done`

---

## Required Task Fields

Each actionable task in `docs/E150/OpenTasks.md` should contain or imply:

- `ID`
- `Status`
- `Priority`
- `Depends on`
- `Scope`
- `Goal`
- `Acceptance Criteria`
- `Decision open`
- optional: `Evidence / Notes`

---

## Execution Order

Unless explicitly instructed otherwise, agents should prioritize:

1. `codex_ready` tasks with highest product impact
2. tasks blocking other `codex_ready` tasks
3. docs/code drift that causes user-facing inconsistency
4. hardening and polish
5. backlog hygiene

---

## Branching and Commit Style

Unless the user specifies otherwise:
- create a focused branch for each slice
- keep commits logically grouped
- avoid mixing unrelated tasks into one branch

Preferred branch naming:
- `fix/<topic>`
- `pr/<task-id>-<topic>`
- `docs/<topic>`
- `hardening/<topic>`

Commit messages should be specific and task-oriented.

---

## Standard Codex Prompt (wiederverwendbar)

Arbeite ausschliesslich die naechsten 1-3 `codex_ready` Tasks aus `docs/E150/OpenTasks.md` ab.
Halte Code und Docs synchron, aktualisiere OpenTasks nach jedem erledigten Task und stoppe an
Begriffs-/Routing-/Governance-Entscheidungsgrenzen mit einer kurzen Rueckfrage.

---

## Final Response Requirements

After completing a slice, always report:

1. what was changed
2. which task IDs were advanced
3. which files were changed
4. what tests were run
5. what remains open
6. whether `OpenTasks.md` was updated

---

## Default Codex Behavior for This Repo

When asked to "work through OpenTasks" or similar, the agent should:

1. select the next 1-3 `codex_ready` tasks
2. implement them in priority order
3. keep docs and code aligned
4. update `docs/E150/OpenTasks.md`
5. stop at any real decision boundary
6. return a concise implementation summary
