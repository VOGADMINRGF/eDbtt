# E150 Current State (2026-04-04)

## 1) Wo wir stehen

- **SSOT bleibt** `docs/E150/OpenTasks.md`.
- Der Produktstrang ist inzwischen klar als **Create -> Anlassraum/Runden -> Atlas/Weekly -> Social-Review** ausgebaut:
  - `/create` als Multi-Entry-Orchestrator (`PR-AI-CREATE-01C`)
  - `/create` Parent-Harmonisierung abgeschlossen (`PR-AI-CREATE-01E`)
  - `/runden` als laufende Betriebsfläche (`PR-AI-CREATE-01D`)
  - Feed->Anlassraum-Komposition (`GOV-ANLASS-04C`)
  - Atlas/Weekly-Surfaces (`GOV-ATLAS-01A..01E`)
  - Social-Review mit Persistenz + Notes/Audit-Polish (`GOV-CIVIC-04C..04E`)
- Wichtige Guardrails bleiben stabil: kein Auto-Publish, kein Autoposting, keine Wahrheits-/Prioritätslogik durch Social/Org/Publisher-Kontexte.

## 2) Was jetzt operativ zählt

- **Hauptpfad:** verbleibende `in_progress`-Parent-Linie im Atlas-/Anlassraum-Entscheidungsstrang fokussiert schließen (`GOV-ATLAS-01`, `GOV-ANLASS-04`).
- **Nächster sinnvoller Block:** kleine Resthärtung für offene in-progress-Tasks ohne neue Leitentscheidung (Contract-/Queue-/Surface-Feinschnitt).
- **Bewusst geparkt:** Research-/Nice-to-have-/Legacy-nahe Themen ohne direkte Blockerwirkung auf den Hauptpfad.

## 3) Was nicht als Hauptsteuerung dienen sollte

Diese Dateien bleiben erhalten, sind aber **nicht** operative Tagessteuerung:

- `docs/E150/Codex_Master_Run.md`
- `docs/E150/Codex_Merge_Prompt.md`
- `docs/E150/OpenTasks_Merge_Note.md`
- ältere Batch-/Merge-Zusammenfassungen in Legacy-Abschnitten von `OpenTasks.md`

## 4) Leseregel für den Ordner

- `OpenTasks.md` = **einzige operative Queue/SSOT**
- `CURRENT_STATE_2026-04-04.md` = **schneller 1-2 Minuten Einstieg**
- `GOV-*.md` / `PR-*.md` Evidence = **Detailbelege pro Slice**
- Part-/Legacy-/Batch-Dokumente = **Hintergrund/Archiv**, nicht aktive Priorisierung

## 5) Prioritätenliste

### Jetzt
- Abschluss der verbleibenden `in_progress`-Parent-Tasks mit kleinem, entscheidungsfreiem Restscope (vorrangig Atlas-/Anlassraum-Entscheidungsstrang).

### Danach
- 1) Selektiver UX-/Operativ-Polish bei echten Reibungspunkten (nur nach Parent-Abschluss).
- 2) Danach kleinere Queue-/Surface-Hygiene-Slices ohne neue Grundsatzarbeit.

### Parken
- `GOV-AI-05`, `GOV-AI-06` (research_only)
