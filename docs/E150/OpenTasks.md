# eDebatte OpenTasks

## Kanonischer Operativteil

| ID | Status | Priorität | Abhängigkeiten | Ziel |
| --- | --- | --- | --- | --- |
| VOXY-AUTO-PUBLISH-READINESS-01 | codex_ready | P1 | kontrollierter Voxy-Publishing-Pfad, Review, Audit, Rollback und Kill Switch | Shadow Mode und 30-Tage-Evidence fail-closed vorbereiten; echte Veröffentlichung bleibt menschlich freigabepflichtig |

## Historischer Katalog und Evidenz

- 2026-08-04: Task aus Issue #571 aufgenommen.
- Geplanter Shadow-Start: 2026-08-21 nach erfolgreichem Go/No-Go.
- Geplanter 30-Tage-Review: 2026-09-20; bei späterem tatsächlichem Start gilt immer `reviewDueAt = shadowStartedAt + 30 Kalendertage`.
- Auto-Publish-Ausführung bleibt außerhalb dieses Tasks deaktiviert.
