# Codex Run Pack Contract

## Zweck

Ein Codex Run Pack übersetzt einen bestehenden `codex_ready`-Task aus `docs/E150/OpenTasks.md` in eine kleine Folge ausführbarer Prompts und Bash-Kommandos. Es ersetzt keine Produktentscheidung, erzeugt keinen parallelen Backlog und benötigt keine zusätzliche Modell-API.

## Verbindliche Quellen

1. `AGENTS.md`
2. `docs/E150/OpenTasks.md`
3. aufgabenspezifische Spezifikationen und Contract-Tests
4. aktueller Branch- und Diff-Stand

Kalenderdaten dürfen die Reihenfolge und den Zeitpunkt bestätigen, aber nicht den fachlichen Status in OpenTasks überschreiben.

## Zwingender Preflight vor Branch-Erstellung

Vor jeder Branch-Erstellung, Codeänderung oder Testausführung muss Codex den aktuellen Repository-Stand prüfen.

Der Preflight muss mindestens bestätigen:

1. Der Task existiert in `docs/E150/OpenTasks.md`.
2. Der aktuelle Status ist weiterhin exakt `codex_ready`.
3. Alle dokumentierten Abhängigkeiten sind erfüllt.
4. Referenzierte Evidenz oder ein zugehöriger PR ist nicht bereits auf `main` enthalten.
5. Das Run Pack und seine referenzierten Dateien existieren im tatsächlich ausgecheckten Commit oder werden ausdrücklich als externer Prompt bereitgestellt.
6. Der Worktree ist sauber oder vorhandene Änderungen wurden eindeutig als zulässiger Ausgangszustand bestätigt.

### Harte Abbruchregeln

- `done`: Lauf ohne Implementierung beenden.
- `blocked`: Blocker berichten und Lauf beenden.
- `needs_decision`: genau eine entscheidbare Rückfrage stellen und keine Branch-Erstellung durchführen.
- `research_only`: keine Implementierung und keinen Implementierungsbranch anlegen.
- Task fehlt oder Status ist widersprüchlich: Lauf beenden und den Konflikt benennen.
- Evidenz ist bereits auf `main`: Lauf als bereits erledigt beenden.
- Run Pack fehlt im aktuellen Tree: nicht behaupten, es gelesen zu haben; Quelle klären oder Lauf beenden.

Ein Branch darf erst nach bestandenem Preflight erstellt werden.

Das Preflight-Ergebnis lautet entweder:

```text
PREFLIGHT BESTANDEN
Task: <ID>
Status: codex_ready
Basis: <commit>
Branch-Erstellung erlaubt: ja
```

oder:

```text
PREFLIGHT ABBRUCH
Task: <ID>
Grund: <done|blocked|needs_decision|research_only|missing|already_on_main|run_pack_missing|dirty_worktree|conflict>
Branch-Erstellung erfolgt: nein
```

## Pilot-Evidenz

Der erste Lauf des Piloten `I18N-SURFACE-COVERAGE-02` hat den Task auf aktuellem `main` als bereits `done` erkannt. Ein zunächst zu früh erstellter lokaler Branch wurde ohne Änderungen entfernt. Dieses Ergebnis begründet die harte Regel, dass Branch-Erstellung erst nach bestandenem Preflight zulässig ist.

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

0. Preflight
1. Inspect
2. Implement
3. Verify
4. Review
5. Fix, nur falls erforderlich
6. Close

Kleine, klar abgegrenzte Tasks dürfen Schritte zusammenfassen. Kein Run Pack darf mehr als sechs Implementierungs- und Review-Prompts verlangen; der Preflight ist davon ausgenommen.

## Abschlussanforderungen

Der letzte Codex-Schritt berichtet:

1. geänderte Funktionalität
2. bearbeitete Task-IDs
3. geänderte Dateien
4. ausgeführte Tests und Ergebnisse
5. offene Risiken oder Folgeaufgaben
6. Status der OpenTasks-Aktualisierung
7. PR-Titel und PR-Beschreibung

Bei einem Preflight-Abbruch berichtet Codex stattdessen nur:

1. Task-ID
2. festgestellter Status
3. Abbruchgrund
4. aktueller Branch und Basis-Commit
5. Worktree-Status
6. Bestätigung, dass kein Implementierungsbranch angelegt und keine Datei verändert wurde

## Qualitätsregel

Das Run Pack komprimiert Kontext, aber keine Qualitätskontrollen. Tests, dokumentierte Verträge, Review-Grenzen und die SSOT-Regeln aus `AGENTS.md` bleiben vollständig verbindlich.
