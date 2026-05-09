# PR-CREATE-PROGRESSIVE-ANSWER-DENSITY-01

Stand: 2026-05-09

## Kontext

Issue `#117` fordert, die erste `/create`-Antwort nach Submit deutlich kompakter zu machen:

- weniger Wiederholung im Hauptflow
- kein dritter Originaltext-Block
- keine dominante Next-Step-Kartenwand vor Bestätigung
- stärker unterscheidbare Strukturäste
- sichtbarer Weiter-schreiben-Pfad am unteren Chat-Ende

SSOT bleibt `docs/E150/OpenTasks.md`.

## Umsetzung

### 1. Progressive Antwortdichte in `CreateVisualFollowup`

- Assistant-Antwort zeigt `assistantLead` nur noch, wenn er sich substanziell von Summary/Core unterscheidet.
- `Details zum Originaltext` wurde aus dem Hauptflow entfernt; der Transparenzpfad bleibt als `Original oben anzeigen` in der `Du`-Bubble.
- `Was ich nach deiner Bestätigung vorbereiten kann` zeigt vor Bestätigung nur einen kompakten Hinweis und rendert die konkreten Karten erst nach Bestätigung.
- Strukturäste haben jetzt einen klareren Header mit hervorgehobenem Titel, Schwerpunkt-Zeile und sichtbaren Blickrichtungs-Chips.
- Der Branch-Block `Worum es hier konkret geht` wird nur noch gezeigt, wenn er nicht bloß Titel oder Claim wiederholt.

### 2. Weiter-schreiben am Chat-Ende

- Unter der Antwort rendert `/create` jetzt einen sichtbaren Inline-Composer `Schreib einfach weiter`.
- `Antwort fortsetzen` hängt den neuen Hinweis an den bisherigen Beitrag an und startet denselben `/create`-Startpfad erneut.
- Bestätigungszustände werden dabei zurückgesetzt, statt einen Parallelflow zu öffnen.

### 3. Status-/Zugriffsinfo aus dem Hauptflow genommen

- `Kontingente und Zugriff` wurde vom großen Accordion in eine kleine Badge-Zeile direkt im Workspace verschoben.
- Damit bleibt die Information sichtbar, ohne den Chat-Abschluss zu dominieren.

### 4. Sekundäre Abschnittstitel gehärtet

- `buildCreateVisualSections(...)` nutzt klarere heuristische Titel und dedupliziert doppelte Labels.
- Generische Platzhalter wie `Teil 1` oder `Abschnitt 1` werden in den abgesicherten Fällen vermieden.

## Geänderte Dateien

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`

## Validierung

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx
```

Alle obigen Checks liefen grün.
