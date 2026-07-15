# Codex Prompt: V3 UX Target Voxy Chat Workspace Remediation

Arbeite auf bestehendem PR #391 / Branch:

`fix/create-chat-native-smoke-direct-01`

## Pflichtlektüre zuerst

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `docs/E150/V3_UX_TARGET_VOXY_CHAT_WORKSPACE_REFERENCE_2026-07-15.md`
- `docs/E150/V3_UX_FINAL_CREATE_VOXY_COMPOSER_AND_SURFACE_CONSOLIDATION_2026-07-15.md`
- `docs/E150/OpenTasks.md`

## Problem

Der aktuelle #391-Stand ist nicht am Zielbild. Er ist weiterhin zu stark:

- Formular
- vertikale Analysewand
- verschachtelte Panels
- langer Diagnose-/Review-Stack
- `Einordnung erneut versuchen` als dominanter CTA

Das Ziel ist in `docs/E150/V3_UX_TARGET_VOXY_CHAT_WORKSPACE_REFERENCE_2026-07-15.md` verbindlich beschrieben.

## Wichtig zu Branding / Mascot

Das Maskottchen bleibt visuell erhalten.
Der Name `Voxy` soll öffentlich nicht ständig wiederholt werden.
Nutze im UI bevorzugt:

- `Assistent`
- `Dein KI-Assistent`
- `eDebatte Assistenz`
- oder nur Avatar ohne Label

Nicht überall `VOXY` als Überschrift verwenden.

## Auftrag

Setze `/create` konsequent als zentrale Chat-Workspace-Maske um und korrigiere `/runden` und `/themen` auf das Dock-Pattern.

### 1. `/create`: Chat-Workspace statt Formular/Analysewand

Baue die Create-Oberfläche so, dass der Hauptfluss aus folgenden Bereichen besteht:

```text
WorkspaceHeader
ProgressPipeline
StructureRail
ChatThread
ComposerBar
```

Der User-Beitrag und die Assistenten-Einordnung müssen innerhalb eines Chat-Threads erscheinen, nicht als voneinander getrennte vertikale Analyse-Panels.

### 2. Pipeline integrieren

Ersetze lose Modus-Chips oben durch eine echte, verbundene Pipeline:

```text
Eingabe → Verstehen → Themen ordnen → Quellen prüfen → Entwurf vorbereiten
```

- Desktop horizontal verbunden
- Mobile horizontal scrollbar
- Status: done / active / planned
- keine Fake-Runtime behaupten

### 3. StructureRail oben

Direkt unter der Pipeline, nicht weit unten:

- Prioritäten
- Themen
- Fragen
- Nächster Schritt

Beispiel:

`Prioritäten 3 · Themen 3 · Fragen 5 · Nächster Schritt: Hauptthema wählen`

### 4. Themenzweige sofort visualisieren

Wenn mehrere Themen erkannt werden, zeige eine visuelle Branch-Map:

- Verkehr
- Sicherheit/Rechtsstaat
- Kommunale Finanzen

Jede Karte:

- Titel
- Kurzbeschreibung
- Aussagen-Zahl
- empfohlene Aktion

Verbindung zum Ursprung zeigen. Themen können zusammenbleiben oder getrennt weiterbearbeitet werden.

### 5. CTA-Hierarchie reparieren

`Einordnung erneut versuchen` darf nicht primär sein.

Primär:

- Hauptthema wählen
- Beitrag weiterentwickeln
- Quellen ergänzen
- Entwurf speichern

Sekundär:

- Zusammen lassen
- Als Zweig parken
- Anschluss prüfen
- Anlassraum vorbereiten

Tertiär / Details:

- Einordnung erneut versuchen

### 6. Analysewand abbauen

Folgende Bereiche dürfen nicht mehr als Haupt-Stack dominieren:

- Dialog Intelligence
- Erkannter Standpunkt
- Offene Rückfragen als lange Liste
- Mögliche nächste Schritte als lange Liste
- Weitere Blickwinkel
- Neue Zweige
- Review-first Handoffs
- Anschlussvorschläge
- Mögliche Dopplung erkannt

Verdichte sie in:

- AssistantMessage
- TopicBranchMap
- OpenQuestionCards
- SourceHints
- NextStepList
- CollapsibleDetails

### 7. Transparenz klein halten

`Warum sehe ich das?` / `Was passiert im Hintergrund?` bleibt, aber secondary und standardmäßig eingeklappt. Keine Runtime-/Provider-/Graph-Wand im Hauptflow.

### 8. Assistant Dock auf normalen Seiten

Auf `/runden`, `/themen` und dossiernahen Flächen:

- kein zentraler Chat
- kleiner Dock unten rechts
- Avatar/Mascot
- Text: `Mit Assistent chatten`
- Preview: `Fragen? Ich helfe gern.`
- nicht störend, nicht automatisch geöffnet

Auf `/create` kein zusätzlicher Dock, weil dort der zentrale Chat aktiv ist.

### 9. Lesbarkeit

- größere Hauptschrift
- bessere Line-height
- weniger Uppercase Letterspacing
- weniger technische Mini-Labels
- weniger Rahmen-in-Rahmen
- mehr Abstand
- starke Hierarchie
- Dark navy/cyan bleibt erhalten

### 10. Tests

Aktualisiere/ergänze fokussierte Tests:

- `/create` zeigt ProgressPipeline
- `/create` zeigt StructureRail oben
- `/create` zeigt UserMessage + AssistantMessage im ChatThread
- `/create` zeigt TopicBranchCards/BranchMap bei Mehrthemen
- `Einordnung erneut versuchen` ist nicht primärer CTA
- keine sichtbaren GPT-/Provider-Begriffe
- Transparenz ist einklappbar/secondary
- `/runden` zeigt AssistantDock, aber keine zentrale Chatmaske
- `/themen` zeigt AssistantDock oder konsistente Assistenzfläche
- no-auto-publish bleibt sichtbar

### 11. Docs

Aktualisiere:

- `docs/E150/V3_UX_FINAL_CREATE_VOXY_COMPOSER_AND_SURFACE_CONSOLIDATION_2026-07-15.md`
- `docs/E150/OpenTasks.md`

Dokumentiere:

- dass dieser Lauf die Abweichung vom Zielbild korrigiert
- welche Dateien angepasst wurden
- welche Smoke-Punkte offen sind

## Guardrails

Nicht erlaubt:

- echte neue Runtime aktivieren
- Provider einführen
- Secrets verwenden
- Auto-Publish
- Auto-Dossier
- Auto-Anlassraum
- Auto-Handoff
- automatische Themenaufteilung
- Fake-Quellen
- neue native App

Kandidaten bleiben Kandidaten. Nutzer entscheidet.

## Validierung

- `git diff --check`
- fokussierte Vitest-Suite
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Wenn Typecheck nur an bekannter `.next/types` TS6053 Drift scheitert, dokumentieren.

## PR

- bestehenden PR #391 aktualisieren
- keinen neuen PR erstellen
- PR Body aktualisieren
- ausgeben:
  - PR #391
  - Branch
  - Commit SHA
  - geänderte Dateien
  - Tests
  - Checks
  - manueller Smoke-Plan

Nicht mergen.
