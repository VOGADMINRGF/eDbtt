# Codex Run Pack — I18N-SURFACE-COVERAGE-02

## Pilotstatus

Dieses Run Pack ist ein Workflow-Pilot. Der erste reale Lauf hat festgestellt, dass `I18N-SURFACE-COVERAGE-02` auf `main` bereits als `done` dokumentiert und durch PR #420 belegt ist.

Daher darf dieses Paket auf dem aktuellen `main` **keine I18N-Implementierung mehr starten**. Es dokumentiert zugleich das erwartete Preflight-Verhalten für künftige Run Packs.

## Auftrag

Prüfe ausschließlich `I18N-SURFACE-COVERAGE-02` und führe vor jeder Branch-Erstellung den Preflight aus.

Historischer Planungsstatus: `codex_ready`  
Im Pilotlauf festgestellter aktueller Status: `done`  
Priorität: `P0`  
Abhängigkeit: `I18N-FOUNDATION-01` ist abgeschlossen.

## Verbindlich zuerst lesen

- `AGENTS.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_I18N_SURFACE_COVERAGE_MATRIX_2026-07-23.md`
- `apps/web/tests/i18n-surface-coverage.contract.test.ts`
- vorhandene I18N-Konfiguration, Message-Kataloge und Tests in `apps/web`

## Prompt 0 — Preflight

```text
Führe ausschließlich den Preflight für I18N-SURFACE-COVERAGE-02 aus. Erstelle noch keinen Branch, ändere keine Datei und führe keine Tests aus.

Prüfe auf dem aktuell ausgecheckten main:
1. ob der Task in docs/E150/OpenTasks.md existiert,
2. welchen aktuellen Status er besitzt,
3. ob referenzierte Evidenz oder ein zugehöriger PR bereits auf main enthalten ist,
4. ob dieses Run Pack im tatsächlich ausgecheckten Commit existiert oder nur als externer Prompt bereitgestellt wurde,
5. ob der Worktree sauber ist.

Nur wenn der aktuelle Status exakt codex_ready ist und keine Erledigungsevidenz auf main liegt, darfst du anschließend einen fokussierten Branch anlegen.

Bei done, blocked, needs_decision, research_only, fehlendem Task, widersprüchlichem Status, bereits auf main enthaltener Evidenz oder fehlendem Run Pack brichst du vor der Branch-Erstellung ab.

Liefere exakt eines dieser Formate:

PREFLIGHT BESTANDEN
Task: <ID>
Status: codex_ready
Basis: <commit>
Branch-Erstellung erlaubt: ja

oder:

PREFLIGHT ABBRUCH
Task: <ID>
Status: <aktueller Status>
Grund: <Abbruchgrund>
Aktueller Branch: <branch>
Basis: <commit>
Worktree: <status>
Branch-Erstellung erfolgt: nein
Dateien geändert: nein
Tests ausgeführt: nein
```

## Erwartetes Ergebnis auf aktuellem main

```text
PREFLIGHT ABBRUCH
Task: I18N-SURFACE-COVERAGE-02
Status: done
Grund: Task bereits erledigt und durch PR #420 auf main belegt
Branch-Erstellung erfolgt: nein
Dateien geändert: nein
Tests ausgeführt: nein
```

Die folgenden Implementierungsprompts sind nur historisches Pilotmaterial. Sie dürfen ausschließlich verwendet werden, wenn ein zukünftiger Repository-Stand den Task ausdrücklich wieder als `codex_ready` führt und der Preflight bestanden wurde.

## Ziel bei bestandenem Preflight

Die dokumentierte Oberflächen- und Message-Coverage gegen den aktuellen Code prüfen und den bestehenden I18N-Pfad vollständig und konsistent schließen. Keine zweite I18N-Architektur einführen.

Die vier Sprachebenen bleiben getrennt:

- Originalsprache
- Lesesprache
- UI-Sprache
- Ausgabesprache

Keine dieser Ebenen darf stillschweigend mit einer anderen gleichgesetzt werden.

## Nicht erlaubt

- Branch-Erstellung vor bestandenem Preflight
- neue konkurrierende Übersetzungsbibliothek
- neue Produktbegriffe ohne dokumentierte Entscheidung
- stilles Ändern kanonischer Routen oder Surface-Namen
- globales Refactoring außerhalb der Coverage-Lücken
- Übersetzungen durch `ae`, `oe`, `ue` statt Umlauten in deutschen UI-Texten
- Scope-Ausweitung auf Backend-, Pricing-, Rollen- oder Governance-Logik

## Stop-Grenzen

Stoppe mit `# ENTSCHEIDUNG ERFORDERLICH`, falls:

- Matrix, Contract-Test und Code unterschiedliche kanonische Surface-Namen verlangen
- eine Message fachliche Produktlogik statt reine Darstellung festlegt
- Sprachauflösung oder Fallback-Reihenfolge nicht dokumentiert ist
- eine Coverage-Lücke nur durch eine neue Architektur geschlossen werden könnte
- Änderungen außerhalb des I18N-Slices nötig würden

---

# Prompt 1 — Inspect

```text
Voraussetzung: Prompt 0 hat PREFLIGHT BESTANDEN gemeldet und der fokussierte Branch wurde erst danach angelegt.

Lies AGENTS.md, docs/E150/OpenTasks.md, docs/E150/V3_I18N_SURFACE_COVERAGE_MATRIX_2026-07-23.md, apps/web/tests/i18n-surface-coverage.contract.test.ts sowie die bestehende I18N-Konfiguration und Message-Kataloge in apps/web.

Bearbeite ausschließlich I18N-SURFACE-COVERAGE-02. Ändere noch keinen Code.

Prüfe:
1. welche Surfaces laut Matrix und Contract-Test abgedeckt sein müssen,
2. welche Messages oder Namespaces fehlen,
3. wo deutsche UI-Texte noch hart codiert sind,
4. ob Originalsprache, Lesesprache, UI-Sprache und Ausgabesprache sauber getrennt bleiben,
5. welche bestehenden Helpers und Testmuster wiederverwendet werden müssen.

Liefere danach einen kompakten Implementierungsplan mit:
- bestätigtem Scope,
- betroffenen Dateien,
- konkreten Coverage-Lücken,
- Testplan,
- Risiken.

Stoppe bei einer echten Produkt-, Begriffs-, Routing- oder Sprachauflösungsentscheidung mit genau einer kurzen Rückfrage im Format ENTSCHEIDUNG ERFORDERLICH.
```

# Prompt 2 — Implement

```text
Voraussetzung: Preflight bestanden und Prompt 1 ohne Entscheidungsabbruch abgeschlossen.

Setze den bestätigten Plan für I18N-SURFACE-COVERAGE-02 vollständig um.

Verbindlich:
- bestehende I18N-Architektur und Helpers wiederverwenden,
- keine parallelen Message-Pfade erzeugen,
- deutsche UI-Texte mit echten Umlauten und ß schreiben,
- Originalsprache, Lesesprache, UI-Sprache und Ausgabesprache nicht vermischen,
- nur die bestätigten Coverage-Lücken schließen,
- Matrix, Code und Tests synchron halten,
- keine unabhängigen Refactorings.

Ergänze oder aktualisiere Tests im vorhandenen Testmuster. Stoppe nur an den im Run Pack definierten Entscheidungsgrenzen.
```

# Prompt 3 — Verify

```text
Führe die in commands.sh vorgesehenen statischen Prüfungen und Tests aus. Ermittle bei nicht vorhandenen Scripts die engsten äquivalenten bestehenden Repo-Kommandos, ohne neue Testinfrastruktur einzuführen.

Behebe ausschließlich Fehler, die durch I18N-SURFACE-COVERAGE-02 verursacht wurden oder die dessen Akzeptanzkriterien direkt blockieren.

Prüfe zusätzlich:
- keine neuen hart codierten UI-Texte in den geänderten Surfaces,
- keine fehlenden Message-Keys,
- keine ungenutzten neuen Keys,
- Fallbacks bleiben deterministisch,
- bestehende Routen und Produktbegriffe bleiben unverändert.

Berichte die ausgeführten Kommandos und Ergebnisse.
```

# Prompt 4 — Review and Close

```text
Prüfe den vollständigen Diff gegen AGENTS.md, I18N-SURFACE-COVERAGE-02, die Coverage-Matrix und den Contract-Test.

Kontrolliere besonders:
- Scope-Treue,
- Wiederverwendung der bestehenden Architektur,
- Trennung von Originalsprache, Lesesprache, UI-Sprache und Ausgabesprache,
- deutsche Umlaute und ß,
- Testabdeckung,
- Docs-/Code-Synchronität.

Aktualisiere docs/E150/OpenTasks.md nur dann auf done beziehungsweise mit belastbarer Evidenz, wenn alle Akzeptanzkriterien erfüllt und die relevanten Tests grün sind. Andernfalls dokumentiere präzise den Reststatus, ohne den Task schönzuschreiben.

Liefere abschließend:
1. Änderungen,
2. Task-ID und Status,
3. geänderte Dateien,
4. Tests und Ergebnisse,
5. offene Risiken oder Follow-ups,
6. OpenTasks-Update,
7. vorgeschlagenen PR-Titel,
8. vollständige PR-Beschreibung.
```

## Erwarteter PR-Titel bei künftig bestandenem Preflight

`feat(i18n): close surface and message coverage gaps`

## Erwartete PR-Beschreibung

Die finale Beschreibung muss mindestens enthalten:

- Scope und Task-ID
- geschlossene Coverage-Lücken
- relevante Architekturentscheidung: bestehender I18N-Pfad wiederverwendet
- Testkommandos und Ergebnisse
- aktualisierte Dokumentation
- offene Risiken oder ausdrücklich `keine bekannt`
