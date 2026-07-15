# V3 UX Target: Voxy Chat Workspace Reference

Stand: 2026-07-15
PR-Kontext: #391 `fix/create-chat-native-smoke-direct-01`

## Warum dieses Dokument existiert

Der aktuelle PR-Stand verbessert `/create`, erreicht aber das abgestimmte Zielbild noch nicht. Die Seite wirkt weiterhin zu stark wie Formular + vertikale Analysewand. Dieses Dokument ist der verbindliche UX/UI-Zielcontract für den nächsten Codex-Lauf.

Wichtig: Das eDebatte-Maskottchen bleibt als visuelle Identität erhalten. Öffentlich soll der Name `Voxy` aber nicht ständig wiederholt werden. Nutze Avatar/Mascot als Assistenten-Identität, aber in Copy bevorzugt:

- `Assistent`
- `Dein KI-Assistent`
- `eDebatte Assistenz`
- oder nur Avatar ohne wiederholtes Label

Nicht überall `VOXY` als Überschrift verwenden.

---

## Zielbild A: `/create` als zentrale AI-Workspace-Maske

`/create` ist kein Formular, keine lange Analyse-Seite und keine Sammlung einzelner Cards. `/create` ist eine zentrale Chat-Workspace-Maske.

### Struktur

```text
CreateChatWorkspace
├─ WorkspaceHeader
│  ├─ Mascot / Assistant avatar
│  ├─ kurzer Satz
│  └─ No-Auto-Publish Mini-Badge
├─ ProgressPipeline
│  └─ Eingabe → Verstehen → Themen ordnen → Quellen prüfen → Entwurf vorbereiten
├─ StructureRail
│  └─ Prioritäten / Themen / Fragen / Nächster Schritt
├─ ChatThread
│  ├─ UserMessage
│  ├─ AssistantMessage
│  ├─ TopicBranchMap
│  ├─ OpenQuestions
│  ├─ SourceHints
│  └─ NextSteps
└─ ComposerBar
```

### Muss sichtbar sein

- große zentrale Workspace-Fläche, deutlich breiter als der aktuelle schmale Analyse-Stack
- Chat-Thread als Hauptfläche
- Pipeline im Chatkopf
- Struktur-Rail direkt unter der Pipeline
- User-Beitrag als Chatbubble
- Assistenten-Antwort als Chatbubble
- erkannte Themenzweige als visuelle Branch-Map
- Quellen und nächste Schritte kompakt nebeneinander
- Composer unten im Workspace
- kleine No-Auto-Publish-Sicherheit

### Darf nicht dominieren

- `Einordnung erneut versuchen`
- `Dialog Intelligence`
- `Review-first Handoffs`
- `Neue Zweige`
- `Details ansehen`
- `Warum sehe ich das?`
- Runtime-/Provider-/Graph-/Trace-Text

Diese Inhalte dürfen existieren, aber nur sekundär, klein, einklappbar und nicht im Hauptfluss.

---

## Pipeline im Chatkopf

Lose Chips wie `Beitrag sortieren`, `Frage schärfen`, `Quelle prüfen`, `Direkt Entwurf` sind nicht das Zielbild. Stattdessen:

```text
Eingabe → Verstehen → Themen ordnen → Quellen prüfen → Entwurf vorbereiten
```

Die Pipeline muss:

- direkt im Workspace-Header sitzen
- horizontal verbunden sein
- erledigt / aktiv / geplant unterscheiden
- auf Desktop gut lesbar sein
- auf Mobile horizontal scrollbar sein
- keine echte Runtime vortäuschen

---

## Struktur-Rail oben

Die Rail gehört in den Workspace, nicht unter eine Analysewand.

Beispiel:

```text
Prioritäten 3 · Themen 3 · Fragen 5 · Nächster Schritt: Hauptthema wählen
```

Sie soll stets Orientierung geben:

- Was zählt zuerst?
- Welche Themen wurden erkannt?
- Welche Fragen sind offen?
- Was ist der nächste sinnvolle Schritt?

---

## Themenzweige müssen sofort sichtbar werden

Wenn mehrere Themen erkannt wurden, darf nicht zuerst ein Fehler-/Retry-CTA erscheinen.

Zielbild:

```text
Erkannte Themenzweige
3 Hauptthemen identifiziert

[Verkehr]
Geschwindigkeit, Querung, Radwegführung, Kontrollen
CTA: Hauptthema wählen

[Sicherheit/Rechtsstaat]
Schulwege, Haltestellenumbau, Barrierefreiheit
CTA: Als Zweig parken

[Kommunale Finanzen]
Bauprojekte, Grünflächen, Haushaltsmittel
CTA: Als Zweig parken
```

Zeige Beziehung zum Ursprung:

- gemeinsamer Ursprungsknoten
- dezente Linien oder gruppierte visuelle Verbindung
- Hinweis: Themen können zusammenbleiben oder getrennt weiterbearbeitet werden

---

## CTA-Hierarchie

### Primär

- `Hauptthema wählen`
- `Beitrag weiterentwickeln`
- `Quellen ergänzen`
- `Entwurf speichern`

### Sekundär

- `Zusammen lassen`
- `Als Zweig parken`
- `Anschluss prüfen`
- `Anlassraum vorbereiten`

### Tertiär / Details

- `Einordnung erneut versuchen`

`Einordnung erneut versuchen` darf nicht erster oder dominanter CTA sein.

---

## Open Questions

Offene Fragen als kurze horizontale Cards, nicht als lange Liste:

- Soll alles in einem Beitrag bleiben?
- Welches Thema ist dir am wichtigsten?
- Gibt es Quellen/Beschlüsse?
- Welche Lösung soll priorisiert werden?
- Wer soll beteiligt werden?

---

## Quellen & nächste Schritte

Unterhalb der Branch-Map:

- links: `Quellen & Hinweise`
- rechts: `Vorgeschlagene nächste Schritte`

Kompakt, maximal ein bis zwei Zeilen je Eintrag, gute Lesbarkeit, keine Diagnosewand.

---

## Zielbild B: normale Seiten mit Assistant-Dock

Auf `/runden`, `/themen` und dossiernahen Seiten ist der Chat nicht zentral. Dort ist die Seite eine normale Content-/Arbeitsfläche mit einem kleinen Assistenz-Dock unten rechts.

### Regel

```text
Wo Nutzer erschaffen: zentraler Chat.
Wo Nutzer lesen, prüfen, verwalten: kleiner Dock.
```

### Dock

- unten rechts
- klein
- Mascot/Avatar
- Text: `Mit Assistent chatten`
- Preview: `Fragen? Ich helfe gern.`
- darf Inhalte nicht verdecken
- darf expandieren, aber nicht automatisch

### `/runden` Ziel

Moderne Debatten-/Beteiligungsübersicht:

- Header mit Thema, Status, Debattenstand
- Tabs: Übersicht / Argumente / Beiträge / Beteiligung / Dossier / Nächste Schritte
- Kennzahlenkarten
- Top-Themen
- Aktuelle Beiträge
- Beteiligung
- Nächste Schritte
- Dossier-Dokumente
- Assistant-Dock unten rechts

Kein zentraler Chat-Zwang auf `/runden`.

### `/themen` Ziel

- Themen als Anschlussfläche
- bestehende Debatten/Dossiers sichtbar
- Anschlussvorschläge verständlich
- Assistant-Dock unten rechts oder kompakter Assistenz-Hinweis
- keine neue Feature-Logik erzwingen

---

## Lesbarkeit und Visual Design

Der aktuelle Stand leidet an zu vielen kleinen Labels, zu vielen Rahmen-in-Rahmen und zu langen vertikalen Analyseblöcken.

Ziel:

- größere Hauptschrift
- bessere Line-height
- weniger extreme Uppercase-Letterspacing
- weniger technische Mini-Labels
- weniger verschachtelte Container
- mehr Weißraum
- starke Hierarchie
- klare visuelle Gruppierung
- Premium-SaaS-Gefühl
- Dunkel/navy/cyan bleibt erhalten

---

## Guardrails bleiben unverändert

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Handoff
- keine automatische Themenaufteilung
- keine Fake-Quellen
- keine Provider/Secrets/Runtime aktivieren
- Kandidaten bleiben Kandidaten
- Nutzer entscheidet

---

## Akzeptanzkriterien

Der Slice ist erst akzeptabel, wenn:

1. `/create` nicht mehr wie Formular + Analysewand wirkt.
2. `/create` einen zentralen Chat-Workspace zeigt.
3. Pipeline und Struktur-Rail im Workspace oben integriert sind.
4. Themenzweige sofort visuell sichtbar sind.
5. `Einordnung erneut versuchen` nicht mehr primärer CTA ist.
6. Ergebnisse im Chat-Thread erscheinen.
7. Transparenz klein/einklappbar/secondary ist.
8. Mascot sichtbar bleibt, aber `Voxy` nicht ständig als UI-Label wiederholt wird.
9. `/runden` und `/themen` keinen zentralen Chat erzwingen, sondern einen dezenten Dock nutzen.
10. Keine Guardrails verletzt werden.

## Manueller Smoke-Text

```text
Ich wohne in Rahnsdorf und sehe morgens auf dem Weg zur Kita mehrere Probleme gleichzeitig: An der Hauptstraße fahren viele Autos zu schnell, es gibt keine sichere Querung für Kinder, Radfahrer weichen auf den Gehweg aus und ältere Menschen kommen an der Haltestelle schlecht über die Straße. Gleichzeitig wird in der Nachbarschaft über neue Bauprojekte, fehlende Grünflächen und knappe Haushaltsmittel gesprochen. Ich bin unsicher, ob das ein gemeinsames Thema „sicherer öffentlicher Raum“ ist oder ob man es trennen sollte in Verkehrssicherheit, Kita-/Schulwege, Barrierefreiheit, Stadtplanung und kommunale Finanzierung. Mir wäre wichtig, dass andere Anwohner ihre Erfahrungen einbringen können, dass nicht einfach Ja/Nein abgestimmt wird, sondern Optionen verglichen werden: Tempo 30, sichere Querung, Poller, Radwegführung, Schulwegplan, Haltestellenumbau oder mehr Kontrollen. Außerdem möchte ich wissen, ob es dazu schon Debatten, Quellen, Beschlüsse oder Beteiligungen gibt und wie daraus ein guter Entwurf entstehen kann, ohne dass automatisch etwas veröffentlicht wird.
```
