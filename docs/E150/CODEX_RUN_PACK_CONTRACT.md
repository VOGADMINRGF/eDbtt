# CODEX Run Pack Contract

Stand: 2026-07-25
Status: verbindlich

## Zweck

Dieser Contract definiert den deterministischen lokalen Preflight fuer Codex-Tasks vor jeder Branch-Erstellung.

Der Preflight erstellt keinen Branch, veraendert keine Produktdateien und fuehrt keine Produktentscheidung aus.

## Verbindliche Reihenfolge vor Branch-Erstellung

1. `AGENTS.md` lesen.
2. `docs/E150/OpenTasks.md` als SSOT lesen.
3. Dieses Dokument lesen.
4. `node scripts/codex-task-preflight.mjs <TASK-ID>` ausfuehren.
5. Nur bei erfolgreichem Preflight darf anschliessend ein Branch fuer den Task erzeugt werden.

## Operative Quelle fuer Task-Status

Fuer den Preflight gilt ausschliesslich der kanonische operative Kopf von `docs/E150/OpenTasks.md`.

- Startpunkt: `## Kanonischer Operativteil`
- Endpunkt: `## Historischer Katalog und Evidenz`

Historische Archivabschnitte gelten nicht als aktive Branch-Start-Queue.

Wenn diese Struktur fehlt oder mehrdeutig wird, muss der Preflight mit
`ENTSCHEIDUNG ERFORDERLICH` abbrechen.

## Preflight-Regeln

`scripts/codex-task-preflight.mjs` akzeptiert genau eine Task-ID als Argument und liefert kompaktes JSON.

Der Preflight muss pruefen:

- die Task-ID existiert im operativen Kopf von `OpenTasks.md`
- der aktuelle Task-Status ist bekannt
- nur `codex_ready` ist ausfuehrbar
- `done`, `blocked`, `needs_decision`, `research_only` und fehlende Task-IDs brechen mit Exit Code `1` ab
- alle anderen Nicht-`codex_ready`-Status brechen ebenfalls ab
- der Git-Worktree ist sauber
- der aktuelle Branch ist `main`

Der Preflight darf nicht:

- einen Branch erstellen
- Produktdateien aendern
- still Entscheidungen zu Routing, Governance, Rollen oder Produktsemantik treffen

## Erwartete Ausgabe

Erfolg:

```json
{
  "taskId": "TASK-ID",
  "status": "codex_ready",
  "executable": true,
  "branchCreationAllowed": true
}
```

Abbruch:

```json
{
  "taskId": "TASK-ID",
  "status": "done",
  "executable": false,
  "reason": "task_status_not_executable:done"
}
```

## Pflicht fuer Codex-Runs

Vor jeder Branch-Erstellung fuer einen Codex-Task ist dieser Preflight Pflicht.

Ohne erfolgreichen Preflight:

- kein Branch-Start
- kein Slice-Start
- keine automatische Folgeaktion
