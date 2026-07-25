# Codex Run Pack Contract

## Zweck

Ein Codex Run Pack übersetzt einen bestehenden `codex_ready`-Task aus `docs/E150/OpenTasks.md` in eine kleine Folge ausführbarer Prompts und Bash-Kommandos. Es ersetzt keine Produktentscheidung, erzeugt keinen parallelen Backlog und benötigt keine zusätzliche Modell-API.

## Verbindliche Quellen

1. `AGENTS.md`
2. `docs/E150/OpenTasks.md`
3. aufgabenspezifische Spezifikationen und Contract-Tests
4. aktueller Branch- und Diff-Stand

Kalenderdaten dürfen die Reihenfolge und den Zeitpunkt bestätigen, aber nicht den fachlichen Status in OpenTasks überschreiben.

## Mindestinhalt

Jedes Run Pack enthält:

- Task-ID, Status und Priorität
- Ziel und Scope
- relevante Dateien und Abhängigkeiten
- dokumentierte Produktentscheidungen
- nicht erlaubte Änderungen
- Akzeptanzkriterien
- Test- und Verifikationsbefehle
- ein bis sechs sequenzielle Codex-Prompts
- Stop-Bedingungen für kritische Entscheidungen
- Abschlussformat für PR und OpenTasks-Evidenz

## Erlaubte Eigenständigkeit

Codex darf innerhalb des bestätigten Scopes selbstständig:

- den Ist-Stand untersuchen
- vorhandene Architektur und Helpers wiederverwenden
- Code und Tests ändern
- relevante Tests ausführen
- lokale Folgefehler des eigenen Slices beheben
- Dokumentation und OpenTasks-Evidenz vorbereiten
- PR-Titel und PR-Beschreibung formulieren

## Zwingende Stop-Bedingungen

Codex stoppt und stellt genau eine kurze, entscheidbare Rückfrage bei:

- undokumentierter Produkt-, Begriffs- oder Routingentscheidung
- neuer oder paralleler Architektur
- Rollen-, Rechte-, Privacy-, Legal- oder Publishing-Änderung
- Datenmigration mit Verlustrisiko
- notwendiger Scope-Erweiterung
- Konflikt zwischen OpenTasks, Spezifikation und aktuellem Code
- unerwartet großem oder riskantem Diff
- externen Kosten oder fehlenden Zugangsdaten

Das Rückfrageformat lautet:

```md
# ENTSCHEIDUNG ERFORDERLICH

## Konflikt
...

## Option A
...

## Option B
...

## Empfehlung
...

## Auswirkungen
...
```

## Standardsequenz

1. Inspect
2. Implement
3. Verify
4. Review
5. Fix, nur falls erforderlich
6. Close

Kleine, klar abgegrenzte Tasks dürfen Schritte zusammenfassen. Kein Run Pack darf mehr als sechs Prompts verlangen.

## Abschlussanforderungen

Der letzte Codex-Schritt berichtet:

1. geänderte Funktionalität
2. bearbeitete Task-IDs
3. geänderte Dateien
4. ausgeführte Tests und Ergebnisse
5. offene Risiken oder Folgeaufgaben
6. Status der OpenTasks-Aktualisierung
7. PR-Titel und PR-Beschreibung

## Qualitätsregel

Das Run Pack komprimiert Kontext, aber keine Qualitätskontrollen. Tests, dokumentierte Verträge, Review-Grenzen und die SSOT-Regeln aus `AGENTS.md` bleiben vollständig verbindlich.
