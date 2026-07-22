# V3 Create Debattenstand Sidecar Spec

Datum: 2026-07-22  
Branch: `docs/create-debattenstand-sidecar-spec-01`  
Typ: Code-nahe Architektur- und Umsetzungsspezifikation  
Scope: `/create` Debattenstand-Workspace und Sidecar-Verhalten  
Nicht im Scope: Produktcode, Providerwechsel, Pricing, Auth- oder Review-Redesign

## 0. Zweck und Leseregel

Dieses Dokument beschreibt den heute im Repository nachweisbaren `/create`-Istzustand und ein belastbares Zielbild für einen linearen Debattenstand-Workspace mit Sidecar.

Wichtig:

- Aussagen mit `Ist:` beziehen sich auf den am 2026-07-22 im Repo verifizierten Stand.
- Aussagen mit `Ziel:` beschreiben die gewünschte künftige Architektur.
- Aussagen mit `Folgeslice:` benennen empfohlene spätere Implementierungsschritte.
- Dieses Dokument führt keine neue Runtime-Wahrheit ein. Es benennt, welche bestehende Wahrheit wiederverwendet, vereinheitlicht oder ergänzt werden muss.

## 1. Verifizierte aktuelle Basis

Folgende aktuelle Dateien und Verantwortungen wurden geprüft:

- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/api/create/analyze/route.ts`
- `apps/web/src/app/api/create/workstates/route.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateWorkspaceShell.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/createSavedWorkstateContract.ts`
- `apps/web/src/features/create/createHandoffPersistenceContract.ts`
- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- `apps/web/src/features/create/unifiedReviewQueueContract.ts`
- `apps/web/src/features/create/createHandoffDrafts.ts`
- `apps/web/src/features/create/createHandoffReviewQueue.ts`
- `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx`
- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/features/create/reviewQueueUi.tsx`

## 2. Zielbild

Ziel ist ein klarer, linearer `/create`-Arbeitsfluss, in dem ein Nutzer aus Text, Link oder Dokument schrittweise zu einem belastbaren Debattenstand gelangt.

Der Workspace besteht künftig aus zwei klaren Ebenen:

- Hauptbereich: Chat, Composer und genau ein nächster Schritt.
- Sidecar: kompakter Debattenstand mit Status, Themenstruktur, Kontext, Quellenlage und nächster Freigabe.

Der Nutzer soll nicht gleichzeitig mehrere gleich starke Arbeitsrichtungen sehen. Jede Phase hat:

- genau eine primäre Entscheidung,
- klar benannte sekundäre Alternativen,
- einen phasenabhängigen Composer,
- einen deduplizierten Transparenzbereich,
- eine einzige Statusquelle.

## 2.1 Verbindliche Produktentscheidungen

Die folgenden Architektur- und UX-Entscheidungen gelten für die spätere `/create`-Umsetzung verbindlich:

1. Mobile Debattenstand
- Standard ist eine kompakte Statusleiste.
- Beim Öffnen erscheint ein Bottom Sheet.
- Das Bottom Sheet kennt die Zustände `kompakt` und `erweitert`.
- Eine Vollbildansicht ist nur ein expliziter Übergang aus dem erweiterten Zustand und kein Standardmodus.
- Tabs und ein dauerhaft statischer oberer Abschnitt sind keine aktiven Alternativen.
- RTL, Tastaturbedienung, Fokusmanagement, Scroll-Lock und Screenreader-Verhalten bleiben verpflichtende Akzeptanzkriterien.

2. Große Themenmengen
- Alle tatsächlich gelieferten oder nachvollziehbar hergeleiteten Themen gehören zur kanonischen Themenmenge.
- Die Gesamtzahl bleibt immer sichtbar.
- Auf Desktop und Mobile werden bei großen Mengen initial vier Themenkarten vollständig angezeigt.
- Danach folgt progressive Offenlegung über eine eindeutige Aktion wie `Alle N Themen anzeigen`.
- Vier ist ausschließlich eine initiale Darstellungsmenge, niemals ein Analyse-, Speicher-, Diagnose- oder Handoff-Limit.
- Diagnose, Debattenstand, Überschrift, Karten und Handoffs verwenden dieselbe vollständige Themenmenge.
- Ein Oberthema oder Kontextthema wird nicht zusätzlich als fünfte, achte oder fünfzehnte Karte gezählt.

3. Szenen-Rail
- Im späteren `/create`-Workspace wird die Szenen-Rail deaktiviert und nicht gerendert.
- `SharedCreateComposer` wird dafür nicht global entfernt oder grundlegend umgebaut, solange andere Nutzer oder Routen nicht vollständig auditiert sind.
- Der erste Implementierungs-Slice nutzt dafür nur einen expliziten `/create`-Workspace-Modus oder eine kontrollierte Prop-/Policy-Steuerung.
- Eine globale Entfernung bleibt ein separater späterer Cleanup-Slice nach Usage-Audit.

4. Debattenstand-View-Model
- Es entsteht kein zweites persistiertes Statusmodell.
- Kanonische Grundlage ist ein gemeinsamer Workspace-State.
- ChatThread, Composer, Fortschritt, Themen, Claims, Quellen, Handoffs und Review lesen aus diesem kanonischen State.
- Der Debattenstand erhält einen reinen abgeleiteten Selector-Layer.
- Ein eigener TypeScript-View-Model-Typ ist nur zulässig, wenn er nicht persistiert wird, deterministisch aus dem kanonischen State ableitbar ist, keine eigene Business- oder Workflow-Wahrheit trägt und keine unabhängigen Mutationen besitzt.
- Serverantworten dürfen nicht gleichzeitig in mehreren unabhängigen Client-Stores normalisiert werden.

## 3. Debattenstand: Inhaltlicher Zielvertrag

Der Debattenstand ist kein neuer Publikationsstatus und kein neuer Review-Typ. Er ist die strukturierte Arbeitsansicht des aktuellen Bearbeitungsstands.

Der Sidecar-Debattenstand soll mindestens diese Blöcke enthalten:

1. Status
- aktuelle Phase
- nächster Schritt
- blockiert / in Prüfung / bereit

2. Themenstruktur
- kanonische erkannte Hauptthemen
- optional geparkte Themen
- optional weitere erkannte Themen hinter progressiver Offenlegung

3. Kontext
- Ortsbezug oder offene Ortsklärung
- Beitragsart: Text, Link, Dokument
- Analysequalität: erfolgreich, unvollständig, blockiert

4. Quellenlage
- keine Quellen
- optionale Quellen ergänzt
- Quellenprüfung angefordert
- Quellenprüfung abgeschlossen

5. Weiterführung
- Debattenstand als Entwurf
- Review vorbereitet
- Beteiligungsformat vorbereitet
- Dossier-/Abstimmungsentwurf vorbereitet

## 4. Desktop- und Mobile-Sidecar

### 4.1 Desktop

Ziel:

- persistenter rechter Sidecar
- Hauptchat links
- Sidecar bleibt beim Scrollen sichtbar
- Composer bleibt unten im Hauptarbeitsbereich

Sichtbar:

- kompakte Pipeline
- Debattenstand-Zusammenfassung
- Themenkarten oder Themenliste
- genau ein `Details & Transparenz`-Accordion
- phasenabhängige Statushinweise

Nicht sichtbar:

- doppelte vollständige Pipeline im Chat
- Provider-, Runtime-, Modell- oder Policy-Rohtexte
- gleichzeitige Mehrfach-CTA-Wände

### 4.2 Mobile

Ziel:

- Standard ist eine kompakte Statusleiste mit öffnendem Bottom Sheet
- das Bottom Sheet bietet einen kompakten und einen erweiterten Zustand
- eine Vollbildansicht ist nur ein expliziter Übergang aus dem erweiterten Zustand
- derselbe Datenstand wie Desktop
- kein zweiter Logikpfad

Sichtbar:

- kompakte Statuszeile
- aktueller Debattenstand im Bottom Sheet
- aktive Themenstruktur
- exakt dieselben Primär-/Sekundäraktionen wie Desktop

Nicht sichtbar:

- eigenständige Mobile-Sonderpipeline
- von Desktop abweichende Themenanzahl
- zusätzliche Preview-Zusammenfassungen mit anderem Status
- Tabs als alternative Standardnavigation
- dauerhaft statischer oberer Debattenstand-Abschnitt als zweiter Standardmodus

## 5. Sidecar-Zustände und Übergänge

### 5.1 Phasenmodell

Das bestehende `CreateWorkspaceShell`-Staging ist die beste aktuelle Basis:

- `input`
- `understanding`
- `topics`
- `sources`
- `draft`

Ziel:

- dieses Phasenmodell bleibt der kanonische sichtbare Arbeitsfluss,
- die UI-Leittexte werden auf Debattenstand und Sidecar ausgerichtet,
- andere Statusmodelle werden davon abgeleitet statt parallel visualisiert.

### 5.2 Sichtbarer Status je Zustand

#### Aufnahme

- Pipeline: `Beitrag aufgenommen`
- Sidecar: Rohbeitrag vorhanden, Analyse ausstehend
- Primäraktion: keine manuelle Themenentscheidung vor Analyse

#### Analyse läuft

- Pipeline: `Themen werden erkannt`
- Sidecar: laufende Analyse, noch keine validierten Themen
- Chat: nur ein laufender Analyse-Event, keine fertige Themenbehauptung

#### Analyse erfolgreich

- Pipeline: `Themen erkannt`
- Sidecar: kanonische Themenmenge, Ortsbezug, offene Aussage-/Quellenlage
- Primäraktion: Themenstruktur bestätigen

#### Analyse blockiert

- Pipeline: Schritt 2 Fehler / blockiert
- Schritte 3 bis 5 gesperrt
- Sidecar: kein erfundener Debattenstand
- Assistant: genau eine Fehlermeldung mit Retry-/Speichern-/Später-fortsetzen-Option

#### Themen bestätigt

- Pipeline: `Entscheidung abgeschlossen`
- Sidecar: Themenstruktur fixiert, nachgelagerte Arbeitsmodi freigegeben
- Primäraktion: Aussage schärfen oder nächste definierte Folgebearbeitung

#### Quellenmodus

- Pipeline: `Quellen optional`
- Sidecar: Quellenstatus und optionale Quellenprüfung
- Composer: quellenspezifischer Placeholder

#### Entwurfsmodus

- Pipeline: `Entwurf`
- Sidecar: aktueller Debattenstand-Entwurf, Review-/Weiterführungsstatus

### 5.3 Persistenz

Ziel:

- Intake, Analyseergebnis, Themenentscheidung und Sidecar-Zustand müssen nach Reload wiederherstellbar sein.
- Persistenz darf nicht aus mehreren unverbundenen UI-States zusammengesetzt werden.

Ist:

- Rohintake wird lokal gesichert.
- Handoffs haben eigene Persistenz.
- Saved Workstates haben eigene Persistenz.
- Review-Items haben eigene Persistenz.
- Der sichtbare Workspace-Zustand wird derzeit stark aus lokalen React-States rekonstruiert.

Folgeslice:

- ein gemeinsamer kanonischer Workspace-State mit rein abgeleiteten Selektoren aus bestehendem Handoff-/Workstate-Vertrag, ohne zweites persistiertes Statusmodell.

## 6. SSOT-Bewertung: Status- und Wahrheitsquellen

### 6.1 Nachweisbare aktuelle Parallelmodelle

Ist heute parallel vorhanden:

1. Shell-Phasen in `CreateWorkspaceShell.tsx`
2. Analysezustände in `intelligentFollowupContract.ts`
3. Planner-Degradation und Providerdiagnostik in `createPlanner.ts`
4. Visual-Followup-Stages in `CreateVisualFollowup.tsx`
5. Saved-Workstate-Status in `createSavedWorkstateContract.ts`
6. Handoff-Draft-Status in `createHandoffDrafts.ts`
7. Review-Queue-Status in `createHandoffReviewQueue.ts`
8. Unified-Review-Queue-Status in `unifiedReviewQueueContract.ts`
9. Runtime-Workflow-Surface-Status in `V3RuntimeWorkflowSurface.tsx`

### 6.2 Hauptproblem

Diese Modelle sind einzeln sinnvoll, aber heute nicht klar hierarchisiert. Dadurch entstehen Risiken:

- doppelte oder widersprüchliche Pipeline-Darstellungen,
- UI-Freigaben trotz fehlender validierter Analyse,
- parallele CTA-Gruppen aus verschiedenen Subsystemen,
- inkonsistente Themenanzahlen zwischen Chat, Rail und Karten,
- technische Diagnoseinhalte auf der Public-Surface.

### 6.3 Empfohlene SSOT-Hierarchie

Ziel:

1. Kanonische Arbeitsphase
- Quelle: `CreateWorkspaceShell`-nahes sichtbares Phasenmodell

2. Kanonischer Analysezustand
- Quelle: `CreateAnalysisState` plus validierte Followup-Daten

3. Kanonische Themenmenge
- Quelle: validierte `understanding.topics` bzw. dokumentbezogene Topics, nicht UI-Preview-Heuristiken

4. Kanonischer Debattenstand
- rein abgeleiteter Selector-Layer aus kanonischem Workspace-State, Analyse + Nutzerentscheidungen + Persistenzzustand

5. Nachgelagerte Betriebszustände
- Review Queue, Saved Workstates, Handoff-Status, Runtime-Workflow nur als Folgezustand, nicht als primäre Create-Steuerung

### 6.4 Fehlende oder unklare Felder

Für einen stabilen Sidecar fehlen oder sind derzeit nicht zentral genug:

- `workspaceStateVersion`
- `analysisValidated: boolean`
- `canonicalTopicCount: number`
- `visibleTopicCount: number`
- `hasMoreTopics: boolean`
- `topicDecisionState: open | confirmed | editing`
- `placeClarificationState: none | required | confirmed`
- `sourceReviewState: none | optional | requested | completed`
- `nextPrimaryAction`
- `publicErrorState` für öffentliche, nicht technische Fehlermeldungen
- `resumeCapability` für Reload/Login-Fortsetzung

## 7. Themenvertrag

### 7.1 Ziel

Es gibt genau eine kanonische Themenmenge pro Analyse.

Regeln:

- keine künstliche harte 3-, 7- oder 14-Themen-Generierung als UI-Wahrheit,
- keine unterschiedliche Themenableitung für Chat, Karten und Rail,
- keine Preview-Mappings, die fachlich nicht zum Beitrag passen,
- progressive Offenlegung großer Mengen statt künstlicher Kürzung der Wahrheit.

### 7.2 Sichtbarkeitsregel

Bei vielen Themen:

- kanonische Themenzahl vollständig zählen,
- zunächst kompakt nur eine begrenzte sichtbare Teilmenge zeigen,
- Rest explizit als weitere erkannte Themen ausweisen,
- erst nach Nutzeraktion erweitern.

Beispiel:

- erkannt: 14 Hauptthemen
- sichtbar: initial 4 vollständig
- CTA: `Alle 14 Themen anzeigen`
- Status bleibt: `14 Themen erkannt`, nicht `3 Themen`
- die restlichen 10 Themen bleiben Teil derselben kanonischen Themenmenge und derselben Handoff-Grundlage

### 7.3 Ortsbezug

Ortsbezug ist Kontext, nicht Thema.

Regeln:

- eindeutiger Ort wird als Kontext bestätigt,
- generische Kommune/Region löst Rückfrage aus,
- Ortsbezug erhöht nicht die Hauptthemenzahl,
- Ortsklärung darf erst auf validierter Analyse aufsetzen.

## 8. Participation-Format-Auswahl

Ziel:

Die Auswahl eines Beteiligungsformats darf nicht vorschnell als gleich starker CTA neben der Themenentscheidung erscheinen.

Die Entscheidung darf erst freigeschaltet werden, wenn mindestens diese Dimensionen ausgewertet wurden:

- Themenvolumen
- inhaltliche Dichte
- lokaler oder überregionaler Bezug
- Behauptungs- und Konfliktdichte
- Quellenlage
- Entscheidungsbedarf
- erwartbare Beteiligungsbreite

Ist:

- verschiedene downstream-orientierte Handoffs und Preview-Panels existieren bereits,
- sie sind aber teilweise zu früh in derselben Workspace-Oberfläche sichtbar.

Ziel:

- Beteiligungsformat ist eine spätere, klar freigeschaltete Folgeentscheidung,
- nicht Teil der ersten Themenbestätigung.

## 9. Nutzerfluss

### 9.1 Text

1. Nutzer erfasst Text.
2. Beitrag wird gespeichert.
3. Analyse läuft.
4. Falls Analyse validiert: Themenstruktur und Ortskontext erscheinen.
5. Nutzer bestätigt oder bearbeitet Themen.
6. Danach werden Quellenmodus, Aussage-Schärfung, Beteiligungsformat oder Entwurfsweiterführung freigeschaltet.

### 9.2 Link

1. Link wird erfasst.
2. Link- oder Inhaltsklärung erfolgt.
3. Erst nach erfolgreicher Inhaltsanalyse darf Themenstruktur erscheinen.
4. Sidecar zeigt Quelle des Inputs und Debattenstand auf Basis des extrahierten Inhalts.

### 9.3 Dokument

1. Dokument wird angehängt.
2. Dokumentanalyse liefert kanonische Dokumentthemen.
3. Sidecar zeigt dokumentbezogene Themenmenge, nicht eine abweichende Kurzvorschau aus anderem Mapping.
4. Große Dokumentthemenmengen werden progressiv offengelegt.

### 9.4 Ortsklärung

- eindeutiger Ort: bestätigende Einordnung,
- unklarer Ort: Rückfrage nach Kommune oder Region,
- kein Ortsbezug als künstliches Zusatzthema.

### 9.5 Wenige Themen

- alle kanonischen Themen sichtbar,
- Primäraktion: Themenstruktur bestätigen.

### 9.6 Viele Themen

- kanonische Gesamtzahl sichtbar,
- initial genau vier vollständig sichtbare Themenkarten,
- danach eindeutige progressive Offenlegung über `Alle N Themen anzeigen`,
- progressive Offenlegung,
- keine widersprüchlichen Zählungen.

### 9.7 Quellenprüfung

- erst nach Themenbestätigung freischalten,
- klar als optional oder kontingentgebunden markieren,
- keine Provider- oder Runtime-Sprache im Public-Flow.

### 9.8 Beteiligungsformat

- erst nach Themen- und Kontextbewertung freischalten,
- keine frühe Gleichrangigkeit mit Themenstruktur.

### 9.9 Dossier-/Abstimmungsentwurf

- nur als spätere Weiterführung,
- niemals vor validierter Analyse oder bestätigter Themenstruktur,
- auf bestehende Handoff- und Review-Verträge aufsetzen.

### 9.10 Review und Release

- Review-First bleibt bestehen,
- kein Auto-Publish,
- Debattenstand-Workspace darf Review nicht simulieren,
- Release bleibt nachgelagerter Zustand.

### 9.11 Retry

- Retry analysiert denselben gespeicherten Input erneut,
- erzeugt keinen doppelten Beitrag,
- lässt den ursprünglichen Nutzertext sichtbar unverändert.

### 9.12 Resume nach Reload oder Login

- zuletzt gesicherter Input bleibt wiederherstellbar,
- Sidecar zeigt denselben kanonischen Debattenstand,
- freigeschaltete Folgephasen bleiben konsistent,
- blockierte Analyse bleibt blockiert statt nachträglich als erfolgreich zu erscheinen.

## 10. Composer-Vertrag

Der Composer bleibt phasenabhängig und darf nicht aus allgemeinen Downstream-Optionen überlagert werden.

Ziel-Placeholder:

- vor Themenbestätigung: `Möchtest du ein Thema ändern, ergänzen oder zusammenführen?`
- nach Themenbestätigung: `Welche Aussage möchtest du schärfen?`
- im Quellenmodus: `Füge eine Quelle, einen Beschluss oder ein Beispiel hinzu …`
- im Entwurfsmodus: `Was soll im Entwurf noch ergänzt werden?`

Ist:

- diese Grundlogik ist in `CreateClient.tsx` bereits weitgehend vorhanden und sollte nicht erneut in eine Parallelquelle verschoben werden.

## 11. Details & Transparenz

Ziel:

- genau ein Bereich `Details & Transparenz`
- standardmäßig geschlossen
- alle Diagnose-, Erklär- und Schritttransparenz-Inhalte ausschließlich dort

Ist:

- Transparenz- und Diagnoseinformationen sind heute über mehrere Flächen und Komponenten verteilt.

Nicht im Hauptflow sichtbar:

- Providernamen
- Modellnamen
- Runtime-Details
- Rohdiagnosen
- Token- oder Policy-Sprache

## 12. Komponenten- und Datei-Mapping

| Bestehende Datei / Komponente | Aktuelle Verantwortung | Künftige Verantwortung | Maßnahme |
| --- | --- | --- | --- |
| `app/create/page.tsx` | Server-Entry, Auth, Resume, Scope-Auflösung | bleibt kanonischer `/create`-Entry | wiederverwenden |
| `app/create/CreateClient.tsx` | zentrale Orchestrierung, viele lokale UI- und Persistenzzustände | schlanker Workspace-Controller mit kanonischem Workspace-State und abgeleiteten Sidecar-Selektoren | aufteilen / entflechten |
| `features/create/CreateWorkspaceShell.tsx` | sichtbare Pipeline und Shell-Struktur | primäre Shell- und Phasenwahrheit | wiederverwenden und ausbauen |
| `features/create/SharedCreateComposer.tsx` | Composer-UI plus eigene Rail-Szene | kanonischer Composer, mit `/create`-spezifisch deaktivierter Rail im Workspace-Modus | teilweise wiederverwenden |
| `features/create/CreateVisualFollowup.tsx` | große Ergebnis- und Aktionswand mit eigener Strukturwahrheit | Debattenstand-Hauptinhalt und thematische Arbeitsblöcke, aber ohne eigene Statuswelt | aufteilen / Statuslogik entfernen |
| `features/create/intelligentFollowupContract.ts` | Analysevertrag plus UI-Ableitungen | Analysevertrag und Topic-/Understanding-SSOT | entmischen / reine Selector-Ableitungen separieren |
| `features/create/createPlanner.ts` | Planner-Providervertrag und Analyse-Fallbacklogik | Planner- und Degraded-Quelle | wiederverwenden |
| `features/create/createSurfaceConfig.ts` | Modustexte und Surface-Konfiguration | zentrale Copy-/Mode-Konfiguration | wiederverwenden |
| `app/api/create/analyze/route.ts` | API-Delegation | bleibt Wrapper, sofern Analysevertrag stabil | wiederverwenden |
| `app/api/create/workstates/route.ts` | Persistenz für Saved Workstates | späterer Persistenzbaustein für Sidecar-Fortsetzung | wiederverwenden |
| `features/create/createSavedWorkstateContract.ts` | gespeicherte Entwurfs- und Parkzustände | Folgezustände, nicht primäre Pipeline | wiederverwenden |
| `features/create/createHandoffPersistenceContract.ts` | persistierter Review-Handoff | Debattenstand-Weitergabe an Review | wiederverwenden |
| `features/create/persistedHandoffReviewQueue.ts` | Review-Persistenz | nachgelagerter Review-Betrieb | wiederverwenden |
| `features/create/unifiedReviewQueueContract.ts` | queue-übergreifender Review-Vertrag | kanonische Review-Folgewelt | wiederverwenden |
| `features/create/createHandoffDrafts.ts` | lokale Handoff-Drafts | Folgezustand nach Debattenstand | wiederverwenden |
| `features/create/createHandoffReviewQueue.ts` | ältere Review-Queue-Vertragslage | auf bestehenden Unified-Review-Vertrag abgleichen | prüfen / ggf. reduzieren |
| `features/create/V3RuntimeWorkflowSurface.tsx` | Runtime-Manifest-/Betriebsübersicht | nicht primäre `/create`-Surface, eher Diagnose-/Admin-/Preview-Kontext | aus Kernflow fernhalten |
| `features/create/CreateCandidatePreviewPanel.tsx` | große Downstream-Vorschau | spätere Folgeoberfläche, nicht Kern-Sidecar | entkoppeln |
| `features/create/reviewQueueUi.tsx` | Review-Arbeitsfläche | bleibt Downstream-UI | wiederverwenden |

## 13. Screenshot-Akzeptanzkriterien

Ein Soll-Screenshot gilt als passend, wenn mindestens Folgendes sichtbar erfüllt ist:

1. genau eine kompakte Pipeline im Workspace
2. keine vollständige Pipeline-Duplikation im Chat
3. genau ein primärer CTA pro Phase
4. eine konsistente Themenanzahl zwischen Status, Karten und CTA
5. ein klar sichtbarer Debattenstand-Block
6. genau ein `Details & Transparenz`-Accordion
7. keine technischen Provider-/Runtime-Texte im Hauptflow
8. ein phasenpassender Composer-Placeholder
9. auf Mobile und Desktop dieselbe Zustandswahrheit
10. Fehlerzustand zeigt keinen erfundenen Erfolg

## 14. Accessibility und Mehrsprachigkeit

### 14.1 Accessibility

Der Sidecar muss mindestens folgende Anforderungen erfüllen:

- saubere Heading-Hierarchie
- klare Landmarken für Hauptbereich und Sidecar
- tastaturbedienbare Accordions und Aktionsgruppen
- sichtbare Fokuszustände
- Screenreader-lesbare Statusänderungen
- keine rein farbabhängige Statuscodierung
- mobile Bedienbarkeit ohne verdeckte Primäraktion
- korrektes Fokusmanagement beim Öffnen und Schließen des Mobile-Bottom-Sheets
- Scroll-Lock ohne Fokusverlust auf Mobile
- RTL-kompatible Sheet-, Status- und Kartenlogik

### 14.2 Mehrsprachigkeit

Ist:

- `createSurfaceConfig.ts` zeigt bereits einen zentralen Konfigurationsansatz für Surface-Texte.

Ziel:

- Debattenstand- und Sidecar-Copy bleibt konfigurierbar,
- Status- und CTA-Texte entstehen nicht verstreut in mehreren Komponenten,
- Orts- und Themenbezeichnungen bleiben inhaltlich aus den Analysedaten ableitbar statt fest codiert.

## 15. Empfohlene Follow-up-Slices

Maximal vier spätere Umsetzungsslices werden empfohlen.

### Slice 1: Workspace-State-SSOT

Scope:

- kanonischer Workspace-State aus Analyse, Nutzerentscheidung und Persistenz
- rein abgeleitete Selektoren für ChatThread, Composer, Fortschritt, Themen, Claims, Quellen, Handoffs und Review
- keine visuelle Neugestaltung

Voraussichtlich betroffene Dateien:

- `CreateClient.tsx`
- `CreateWorkspaceShell.tsx`
- `intelligentFollowupContract.ts`
- neue kleine Ableitungsdatei für Workspace-State

Tests:

- Create-Interaktionstests für Phasenwechsel
- Fehler-/Retry-Contracts
- Resume-/Reload-Contracts

Acceptance:

- keine doppelte Pipeline
- blockierte Analyse blockiert Folgephasen
- ein sichtbarer Primärschritt pro Phase
- kein zweites persistiertes Statusmodell
- keine Normalisierung derselben Serverantwort in mehreren unabhängigen Client-Stores

Non-goals:

- kein Review-Redesign
- keine neue Providerlogik
- kein visuelles Redesign

Depends on:

- keine neue Produktentscheidung notwendig

### Slice 2: Themenvertrag und progressive Offenlegung

Scope:

- kanonische Themenmenge zentralisieren
- vollständige Themenmenge in Diagnose, Debattenstand, Überschrift, Karten und Handoffs durchziehen
- initial genau vier sichtbare Themenkarten bei großen Mengen
- eindeutige Aktion `Alle N Themen anzeigen`
- Ortskontext aus Themenzählung herauslösen

Voraussichtlich betroffene Dateien:

- `createPlanner.ts`
- `intelligentFollowupContract.ts`
- `CreateVisualFollowup.tsx`
- relevante Create-Tests

Tests:

- 2-, 7-, 14-Themen-Smokes
- Dokumentanalyse mit 12+ Themen
- Ortsbezug ja/nein

Acceptance:

- keine falschen Themenmappings
- keine künstliche Kappung der Wahrheit
- konsistente Zählung in allen Oberflächen
- keine stillschweigende Kürzung großer Themenmengen
- vier nur als Darstellungsmenge, nie als Diagnose-, Speicher- oder Handoff-Limit

Non-goals:

- keine neue Themen-Taxonomie außerhalb der bestehenden Analyse

Depends on:

- Slice 1 bevorzugt, aber teilweise parallel möglich

### Slice 3: Debattenstand-Sidecar und Composer-Linearität

Scope:

- Desktop-/Mobile-Sidecar
- Mobile Bottom Sheet mit kompaktem und erweitertem Zustand
- deduplizierte Transparenz
- phasenklare Composer- und CTA-Logik
- `/create`-spezifische Deaktivierung der Szenen-Rail
- keine globale Composer-Bereinigung

Voraussichtlich betroffene Dateien:

- `CreateWorkspaceShell.tsx`
- `SharedCreateComposer.tsx`
- `CreateVisualFollowup.tsx`
- Mobile-/Dialog-Create-Tests

Tests:

- Mobile/Desktop-Contracts
- Placeholder-Phasen
- ein Primär-CTA
- genau ein Transparenz-Accordion

Acceptance:

- klarer linearer Chat-Arbeitsfluss
- kein CTA-Überangebot
- identische Statuswahrheit auf Mobile und Desktop
- Mobile nutzt Statusleiste plus Bottom Sheet statt Tabs oder statischem Zweitlayout
- Szenen-Rail ist im `/create`-Workspace deaktiviert, global aber nicht entfernt

Non-goals:

- kein visuelles Vollredesign von Review-/Downstream-Surfaces
- keine globale Entfernung oder Generalüberholung des `SharedCreateComposer`

Depends on:

- Slice 1

### Slice 4: Downstream-Freigaben und Handoff-Entkopplung

Scope:

- Beteiligungsformat, Review, Dossier-/Abstimmungsentwurf erst nach bestätigter Themenstruktur
- review-first beibehalten
- idempotente Handoffs
- keine Freigabe oder Veröffentlichung ohne Nutzerentscheidung

Voraussichtlich betroffene Dateien:

- `CreateClient.tsx`
- `CreateCandidatePreviewPanel.tsx`
- `createHandoffDrafts.ts`
- `createHandoffPersistenceContract.ts`
- Review-/Handoff-Tests

Tests:

- keine frühe Handoff-Freigabe
- Retry zerstört keine Persistenz
- Review-First bleibt erhalten

Acceptance:

- Downstream-Aktionen erscheinen erst in späteren Phasen
- keine Simulation erfolgreicher Weiterleitung ohne valide Grundlage
- keine Freigabe oder Veröffentlichung ohne explizite Nutzerentscheidung
- Handoffs bleiben idempotent und erzeugen keine Duplikate bei Retry oder Resume

Non-goals:

- kein neues Queue-System

Depends on:

- Slice 1 und 2

## 16. Guardrails

Dieser spätere Umbau darf nicht:

- eine zweite kanonische Pipeline einführen,
- eine zweite Themenwahrheit einführen,
- Provider- oder Runtime-Rohdetails auf der Public-Surface zeigen,
- Review-/Publish-Freigaben vortäuschen,
- Ortsbezug als zusätzliches Hauptthema zählen,
- Mobile und Desktop mit getrennten Statusquellen ausstatten,
- neue Demo- oder Preview-Sonderpfade für denselben Create-Status aufbauen,
- bestehende Handoff- oder Review-Verträge stillschweigend brechen.

## 17. Verbleibende Entscheidungen außerhalb dieses Dokuments

Die vier Architekturentscheidungen zu Mobile-Modus, großen Themenmengen, Szenen-Rail und Debattenstand-Selector-Layer sind mit Abschnitt `2.1 Verbindliche Produktentscheidungen` geschlossen.

Weiterhin produktseitig offen bleiben nur Fragen, die in dieser Spezifikation nicht entschieden wurden, zum Beispiel:

1. Welche konkrete visuelle Verdichtung die kompakte Debattenstand-Zusammenfassung im Desktop-Sidecar erhält.
2. Welche Priorisierung spätere Downstream-Folgeschritte nach Themenbestätigung innerhalb derselben Phase haben, sofern mehrere fachlich zulässig sind.
3. Ob der Vollbild-Übergang des Mobile-Bottom-Sheets später einen eigenen URL-Zustand benötigt oder rein lokal bleibt.

## 18. Ergebnis

Der heutige `/create`-Stand enthält bereits fast alle benötigten Bausteine:

- ein brauchbares Shell-Phasenmodell,
- einen phasenabhängigen Composer,
- valide Analyse-, Handoff- und Review-Verträge,
- Persistenzbausteine für Fortsetzung und Review.

Das Hauptdefizit ist nicht fehlende Funktionalität, sondern konkurrierende Wahrheitsquellen und eine zu frühe Vermischung von Themenarbeit, Downstream-Handoffs, Diagnoseflächen und Preview-Panels.

Die empfohlene Richtung ist deshalb:

- Shell-Phase als sichtbare SSOT stärken,
- kanonische Themenmenge zentralisieren,
- Debattenstand als deduplizierten Sidecar-View-Model-Layer ableiten,
- Downstream-Aktionen strikt nachgelagert freischalten.
