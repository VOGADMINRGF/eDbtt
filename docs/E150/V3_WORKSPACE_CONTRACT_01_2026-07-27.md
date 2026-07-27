# V3 Workspace Contract 01

Datum: 2026-07-27  
Task: `V3-WORKSPACE-CONTRACT-01`  
Status: verbindlicher Decision-/UX-Contract  
Scope: `/create` als Workspace-Referenz für `/dossier` und `/runden`  
Nicht im Scope: Umsetzung der Dossier- oder Runden-Oberflächen

## 1. Zweck und Verbindlichkeit

Dieser Contract kanonisiert die bereits entwickelte Produktsprache von
`/create` für die nächsten Dossier- und Runden-Slices. Er definiert gemeinsame
UX-, Zustands- und Qualitätsgrenzen, führt aber weder eine neue Runtime noch
eine zweite Informations- oder Persistenzarchitektur ein.

Verbindliche Produktrollen:

- `/create` = verstehen und strukturieren
- `/dossier` = Sachstand konsolidieren, prüfen und weiterbearbeiten
- `/runden` = Beteiligung durchführen, abwägen und Ergebnisse nachvollziehbar
  sichtbar machen

Explizit ausgeschlossen:

- `/create` als Alles-in-einem-Fläche
- `/dossier` als technischer Graph, Export oder gleichgewichtete Kartenwand
- `/runden` als zweite Landingpage, zweite Formularstrecke oder zweiter Chat

Die Rollen beschreiben aufeinander bezogene Arbeitsphasen, aber keinen
automatischen Übergang. Jeder Handoff bleibt bewusst, reviewpflichtig und an
die bestehende Runtime-Wahrheit gebunden.

## 2. Repo-Basis und Ist-/Soll-Matrix

Grundlage dieses Contracts sind Issue `#461`, die in PR `#411` gemergte
Spezifikation
`docs/E150/V3_CREATE_DEBATTENSTAND_SIDECAR_SPEC_2026-07-22.md` sowie die am
2026-07-27 vorhandenen Routen, Readmodels und Persistenzverträge.

| Fläche | Nachweisbarer Ist-Stand | Verbindliches Sollbild |
| --- | --- | --- |
| `/create` | Die umgesetzte Workspace-Shell führt Hauptarbeitsbereich, phasenabhängigen Composer, abgeleiteten Debattenstand-Sidecar und mobile Statusleiste mit Bottom Sheet zusammen. Der Debattenstand bleibt ein Selector über bestehendem Zustand und keine zweite Persistenzwahrheit. | UX-Referenz für Hierarchie, linearen Arbeitsfokus, progressive Offenlegung, einen Primärschritt, Desktop-/Mobile-Parität und unterstützende Transparenz. `/create` übernimmt nicht die Aufgaben von Dossier oder Runde. |
| `/runden` | `apps/web/src/app/runden/page.tsx` bündelt Hero, Einstiegs-CTAs, Erklärkarten, Sharing Guide, Guided Question Builder, Filter/Übersicht, aktive und abgeschlossene Einträge sowie Beteiligungsmodule auf einer langen Seite. Dadurch wirkt die Fläche zu schmal, zu lang und zugleich wie Landingpage und Formularstrecke. | Ruhige Übersicht plus fokussierte aktive Arbeitsansicht innerhalb der bestehenden Routing-Semantik. Frage, Phase, belastbarer Stand und genau eine nächste Aktion stehen vor Erklärtexten und Nebenaktionen. |
| `/dossier` | `apps/web/src/app/dossier/ui.tsx` zeigt ohne browserseitigen Handoff im Wesentlichen Einführung, zwei Erklärkarten und Einstiegslinks. Es gibt keine belastbare Übersicht vorhandener Dossiers und nur geringen unmittelbaren Arbeitsnutzen. | Verständliche Übersicht realer Dossiers mit Status, Aktualität und je einem nächsten Schritt; ehrlicher Leerzustand ohne Demo-Inhalte. |
| `/dossier/demo` | `apps/web/src/app/dossier/demo/ui.tsx` lädt Demo- beziehungsweise Fallback-Daten in den rund 2.200 Zeilen umfassenden `DossierViewer`. Dieser enthält wertvolle Fachinhalte zu Aussagen, Quellen, offenen Fragen, Optionen, Beteiligung, Audit und Nachvollziehbarkeit, präsentiert aber viele Blöcke in einer überlangen, weitgehend gleichgewichteten Vollausgabe. | Fachliche Inhaltsbasis bewahren, aber in einer priorisierten Dossier-Detailfläche progressiv ordnen. Demo-Daten bleiben klar Demo und werden nie Production-Wahrheit. |
| Gemeinsames Ziel | Die Flächen verwenden heute unterschiedliche Dichte, Einstiegsmuster und Schwerpunktsetzung. | Ein ruhiger, hochwertiger und fokussierter Workspace: dominanter Arbeitsgegenstand, kompakter Kontext, klarer Status, eine nächste Aktion und Details erst bei Bedarf. |

Diese Matrix beschreibt nachweisbare Struktur und Wirkung. Sie behauptet keine
nicht belegten Screenshotdetails und verlangt keine pixelgenaue Rekonstruktion.

## 3. Gemeinsamer Workspace-Rahmen

### 3.1 Informationshierarchie

Jeder Workspace besitzt in dieser Reihenfolge:

1. einen klaren Titel- und Statusbereich,
2. kompakte Kontext-, Quellen- und Vertrauensinformation,
3. eine dominante Hauptarbeitsfläche,
4. optional eine nachgeordnete rechte Arbeitsleiste,
5. genau eine primäre nächste Aktion.

Die Hauptarbeitsfläche erhält den größten nutzbaren Raum. Eine rechte
Arbeitsleiste trägt nur Status, Kontext, Rolle, nächste Aktion oder
nachgeordnete Werkzeuge; sie wird weder zweite Navigation noch zweite
Hauptfläche.

### 3.2 Progressive Offenlegung

- Der erste sichtbare Bereich beantwortet: Worum geht es, wie ist der Stand,
  worauf stützt er sich und was kann ich jetzt tun?
- Kernaussagen beziehungsweise aktive Beteiligungsobjekte erscheinen vor
  Auditfeldern, Rohmetadaten, Langbegründungen und vollständigen Quellenlisten.
- Sektionen, Akkordeons, Drawer oder fokussierte Detailansichten dürfen Tiefe
  öffnen, ohne eine zweite fachliche Wahrheit zu erzeugen.
- Eingeklappte Inhalte bleiben per Tastatur und Screenreader erreichbar.
- Desktop nutzt die verfügbare Breite sinnvoll; bloßes Zentrieren einer
  schmalen Mobilspalte ist kein Desktop-Workspace.

### 3.3 Aktionen und Voxy

- Pro Zustand gibt es genau eine visuell dominante nächste Aktion.
- Sekundäraktionen bleiben erreichbar, aber klar nachgeordnet.
- Voxy erklärt Kontext, Unsicherheit oder den nächsten Schritt unterstützend.
  Voxy darf weder die Kernfrage noch die Hauptarbeitsfläche oder die primäre
  Aktion dominieren.
- Provider-, Modell-, Runtime- oder Policy-Namen erscheinen nicht in der
  öffentlichen Produkt-UX.

## 4. Dossier-Vertrag

### 4.1 Rolle und Arbeitsnavigation

Das Dossier konsolidiert einen fachlichen Sachstand, macht seine
Vertrauensgrenzen sichtbar und ermöglicht gezielte Prüfung und
Weiterbearbeitung. Seine mindestens verfügbaren Arbeitssektionen sind:

- Überblick
- Positionen
- Quellen
- offene Fragen
- Beteiligung

Die Navigation wechselt die dominante Hauptarbeitsfläche nachvollziehbar.
Sie ist keine bloße Sprungmarkenleiste über einer unverändert vollständig
ausgerollten Kartenwand.

### 4.2 Oberer Pflichtbereich

Vor Detail- und Auditansichten zeigt die Dossier-Detailfläche:

- Kernfrage
- Kurzstand
- Status
- letzte Aktualisierung
- Quellen- und Vertrauenslage
- genau eine nächste Aktion
- fünf bis acht verständliche Kernaussagen

Sind weniger als fünf belastbare Kernaussagen vorhanden, wird die reale
kleinere Menge gezeigt. Sind mehr als acht vorhanden, bleiben alle Teil des
kanonischen Dossiers und werden progressiv zugänglich; die erste Darstellung
ist keine Speicherungskappung.

### 4.3 Inhalt je Sektion

- `Überblick`: Kurzstand, Kernaussagen, gesicherte, umstrittene und fehlende
  Punkte sowie zentrale Optionen.
- `Positionen`: unterscheidbare Positionen und Gegenpositionen mit
  nachvollziehbarer Herkunft; keine Gleichsetzung mit Faktenstatus.
- `Quellen`: kompakte Vertrauenslage zuerst, danach gruppierte Quellen,
  Evidenzbezüge, Einschränkungen und Aktualität.
- `offene Fragen`: offene, in Prüfung befindliche und beantwortete Fragen mit
  sichtbarem Status und, soweit vorhanden, Zuständigkeit.
- `Beteiligung`: Anschluss an vorhandene Beteiligungsräume und
  reviewpflichtige Vorbereitung; keine automatische Aktivierung.

Details, Auditfelder, Langbegründungen, vollständige Graphbeziehungen und lange
Quellenlisten werden nachgeordnet, gruppiert oder einklappbar dargestellt.
Der Graph ist ein fachlicher Nachvollziehbarkeitsbaustein, nicht die
Produktmetapher des Dossiers. Output Studio, Export und Publishing bleiben
separate nachgelagerte Arbeitskontexte.

### 4.4 Übersicht und Leerzustand

`/dossier` zeigt nur reale, zugriffsberechtigte Dossierstände. Erwartete
Gruppierungen sind aktive beziehungsweise zuletzt bearbeitete Dossiers, zur
Prüfung stehende Dossiers und – soweit fachlich real ableitbar – für
Beteiligung vorbereitete Dossiers. Jede Karte hat genau eine nächste Aktion.

Fehlen reale Einträge, erklärt der Leerzustand den nächsten zulässigen Einstieg
ohne Demo-Zahlen, Demo-Dossiers oder behauptete Runtime.

## 5. Runden-Vertrag

### 5.1 Rolle und Arbeitsnavigation

Eine Runde führt Beteiligung zu einer belegten Frage durch, hält Beiträge und
Optionen unterscheidbar und macht den Ergebnisstand nachvollziehbar. Ihre
mindestens verfügbaren Arbeitssektionen sind:

- Debattenstand
- Beiträge
- Optionen
- Quellen
- Ergebnis

### 5.2 Oberer Pflichtbereich

Vor Anleitung, Sharing und Detailverwaltung zeigt eine aktive Runde:

- Beteiligungsfrage
- Dossier-Kurzkontext
- Status und Phase
- Laufzeit
- ehrlichen Beteiligungsstand
- genau eine nächste Aktion

Nicht vorhandene Laufzeiten, Beiträge, Teilnehmendenzahlen oder Ergebnisse
werden als fehlend beziehungsweise noch nicht verfügbar gekennzeichnet. Es
werden keine Fixture-, Demo- oder abgeleiteten Scheinzahlen ergänzt.

### 5.3 Semantische Trennung

- `Beiträge` sind nachvollziehbar zugeordnete Eingaben, Argumente, Quellenhinweise
  oder Perspektiven.
- `Optionen` sind unterscheidbare Handlungs- oder Abwägungsalternativen.
- `Konsultation` sammelt und ordnet Rückmeldungen.
- `Priorisierung` setzt eine Reihenfolge oder Gewichtung innerhalb des dafür
  freigegebenen Verfahrens.
- `Abstimmung` folgt einem eigenen, expliziten Regel- und Statusvertrag.
- `Ergebnis` zeigt den belegten Abschluss- oder Zwischenstand samt Datenbasis
  und Grenzen.

Diese Begriffe und Zustände dürfen weder in Copy noch in Aktionen oder
Kennzahlen semantisch vermischt werden. Ein Zwischenstand ist kein
demokratisches Mandat und keine Wahrheit.

### 5.4 Übersicht und aktive Detailfläche

`/runden` wird zur ruhigen Übersicht realer aktiver, eigener beziehungsweise
rollenabhängig zu bearbeitender und abgeschlossener Runden. Pro Eintrag gibt es
eine primäre nächste Aktion.

Die aktive Detailfläche nutzt die bestehenden Runden-, Anlassraum- und
Participation-Routen und -Readmodels. Dieser Contract führt keine neue
Detailroute ein. Die aktuelle Alias- und Query-Semantik von `/anlassraum` und
`/runden?anlassraumId=…` sowie veröffentlichte Participation-Flächen unter
`/beteiligung/[slug]` werden im Folgeslice respektiert und nicht nebenbei
umgedeutet.

## 6. Interaktionsvertrag

Jede sichtbare Aktion verändert mindestens einen nachvollziehbaren Zustand:

- Hauptarbeitsfläche
- ausgewählte Sektion
- Status oder Arbeitsstand
- nächste Aktion
- eigener Beitrag
- gespeicherter Zwischenstand

Verbindliche Regeln:

- keine Dead Clicks,
- keine dekorativen CTAs,
- kein Button ohne verfügbaren, erklärten oder ehrlich deaktivierten Effekt,
- Sektionwechsel aktualisieren Auswahl und Hauptinhalt,
- Schreibaktionen zeigen Speichern, Erfolg, Fehler und erneuten Versuch,
- Rückkehr und Reload rekonstruieren denselben serverseitig belegten
  Arbeitsstand,
- browserseitiger Zustand darf eine Interaktion unterstützen, aber keine
  fehlende Runtime-, Review- oder Veröffentlichungswahrheit ersetzen.

Der Primär-CTA leitet sich aus dem aktuellen fachlichen Zustand ab. Mehrere
gleichgewichtete Handoffs, Freigaben oder Beteiligungsarten auf demselben
Schritt sind unzulässig.

## 7. Gemeinsame Zustandswahrheit

Die Folgeslices verwenden die vorhandenen fachlichen Träger:

| Wahrheit | Bestehende repo-nahe Träger |
| --- | --- |
| Dossier | `features/dossier/schemas.ts`, `features/dossier/db.ts`, `features/dossier/updateReadModel.ts`, `apps/web/src/features/dossier/publicRuntime.ts`, `apps/web/src/features/create/dossierRuntime.ts` und `dossierRuntimeServer.ts` |
| Graph | `apps/web/src/features/create/topicGraphRuntime.ts` und `topicGraphRuntimeServer.ts`; Graphänderungen bleiben explizit review- und auditpflichtig |
| Participation | `apps/web/src/features/create/participationSpaceRuntime.ts` und `participationSpaceRuntimeServer.ts`, `apps/web/src/features/participation/publicParticipationSpaceRuntime.ts` sowie der bestehende Participation-Space-Container |
| Contribution/Draft | `apps/web/src/server/serverDrafts.ts` mit den aktiven Writes über `/api/create/save` und `/api/drafts/save`; alte String-ID-/Legacy-Records bleiben ausschließlich Read-only-Fallback |
| Review | `features/reviewQueue.ts`, `apps/web/src/features/create/persistedHandoffReviewQueue.ts`, `unifiedReviewQueueContract.ts` und `unifiedReviewQueueWiring.ts` |
| Workspace | `/create` nutzt `CreateWorkspaceShell`, den rein abgeleiteten `createDebattenstandSelector` und bestehende Workstate-/Handoff-Verträge; Dossier Studio persistiert über `features/dossier/server/studioPersistence.ts` |

Daraus folgen:

- keine parallelen UI-, Demo- oder Client-Stores,
- keine Demo-Daten als Production-Wahrheit,
- keine erneute Normalisierung derselben Serverantwort in unabhängige Stores,
- bestehende Persistenz-, Reload- und Rückkehrlogik erhalten,
- Dossier bleibt die fachliche Quelle der Runde,
- die Runde referenziert Dossier-Kurzstand, Quellen und Positionen statt sie zu
  kopieren,
- Rundenergebnisse fließen nur als reviewpflichtige Vorschläge oder
  Aktualisierungen zurück,
- kein automatisches Überschreiben, Mergen oder Veröffentlichen.

`review_ready` ist nicht `approved`, `publish_ready` ist nicht `published`,
Preview ist nicht Runtime und Runtime-Erstellung ist nicht öffentliche
Aktivierung.

## 8. Desktop, Mobile, RTL und Accessibility

### 8.1 Desktop und Mobile

- Desktop und Mobile zeigen dieselbe fachliche Priorität und dieselbe
  Zustandswahrheit.
- Desktop nutzt eine breite Hauptarbeitsfläche und optional eine kompakte,
  nachgeordnete Arbeitsleiste.
- Mobil wird die Arbeitsleiste in fachlich gleicher Reihenfolge inline oder in
  einen zugänglichen Drawer beziehungsweise ein Bottom Sheet integriert.
- Keine mobile Sonderpipeline, keine abweichenden Counts und keine versteckte
  zweite Primäraktion.
- Bei mindestens 200 Prozent Zoom bleiben Inhalt, Fokus und Primäraktion ohne
  horizontales Seiten-Scrolling und ohne Überdeckung nutzbar.

### 8.2 Tastatur und Screenreader

- Landmarken, Überschriften und Accessible Names bilden die sichtbare
  Hierarchie ab.
- Alle Sektionen, Akkordeons, Drawer und Aktionen sind vollständig per
  Tastatur bedienbar.
- Fokus ist sichtbar und wird beim Öffnen und Schließen modaler Arbeitsleisten
  kontrolliert gesetzt und zum Auslöser zurückgeführt.
- Status- und Speicheränderungen werden verständlich angekündigt; Farbe ist
  nie der einzige Statusindikator.
- Falls Tabs verwendet werden, folgen Auswahl, Fokus und Tastaturnavigation
  einem konsistenten Tab-Vertrag; navigierende Links bleiben echte Links mit
  sichtbarem Aktivzustand.

### 8.3 Sprache, RTL und Leserichtung

- Blockweises `lang` und `dir` bleiben erhalten.
- Originalsprache, Lesesprache und Bedienoberfläche werden nicht vermischt.
- Original und gekennzeichnete Übersetzung bleiben unterscheidbar;
  Übersetzung ist kein Beleg.
- Reihenfolge, Icons, Abstände, Drawer-Position und Fokuslogik funktionieren
  auch in RTL.
- Westliche Links-nach-rechts-, Datums-, Zahlen- oder Layoutannahmen sind
  nicht die einzige Wahrheit.

## 9. Klare Folgeslice-Grenzen

### 9.1 `DOSSIER-WORKSPACE-02`

Scope:

- `/dossier` als reale, verständliche Dossier-Übersicht,
- kanonische Dossier-Detailfläche als fokussierter Workspace,
- bestehende Fachinhalte aus `DossierViewer` progressiv priorisieren,
- Überblick, Positionen, Quellen, offene Fragen und Beteiligung fokussierbar
  machen,
- Reload, Mobile, RTL, Tastatur und ehrliche Leer-/Fehlerzustände belegen.

Erwartete vorhandene Datei- und Komponentenbereiche:

- `apps/web/src/app/dossier/page.tsx`
- `apps/web/src/app/dossier/ui.tsx`
- `apps/web/src/app/dossier/[id]/page.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/app/dossier/demo/page.tsx`
- `apps/web/src/app/dossier/demo/ui.tsx`
- `apps/web/src/components/dossier/DossierViewer.tsx`
- `apps/web/src/components/dossier/DossierLayout.tsx`
- fachliche Readmodels in `features/dossier/*` und
  `apps/web/src/features/dossier/publicRuntime.ts`

Nicht Teil des Slices:

- keine Output-Studio-Neuerfindung,
- keine Graph-Neuerfindung,
- keine Publishing-Neuerfindung,
- keine neue Dossier-Persistenz,
- keine Migration von `/dossier/[id]/studio` in die öffentliche Hauptfläche.

### 9.2 `RUNDEN-WORKSPACE-03`

Scope:

- `/runden` als fokussierte Übersicht,
- aktive Runden-Detailfläche innerhalb der bestehenden Routing-Semantik,
- Beteiligungsfrage, Dossier-Kurzkontext, Beiträge, Optionen, Quellen und
  Ergebnis als getrennte, verbundene Arbeitsmodi,
- phasenabhängig genau eine Beteiligungsaktion,
- eigener Arbeitsstand, Reload, Mobile, RTL und Tastatur belegen.

Erwartete vorhandene Datei- und Komponentenbereiche:

- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenCreateHandoffBanner.tsx`
- `apps/web/src/app/runden/RundenPublicInputPanel.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/app/runden/RundenShareActions.tsx`
- `features/topicRound/entrySource.ts`
- `apps/web/src/app/beteiligung/page.tsx`
- `apps/web/src/app/beteiligung/[slug]/page.tsx`
- `apps/web/src/features/participation/publicParticipationSpaceIndex.tsx`
- `apps/web/src/features/participation/publicParticipationSpaceShell.tsx`
- `apps/web/src/features/participation/publicParticipationSpaceRuntime.ts`
- bestehende Contribution-, Participation- und Review-Verträge

Nicht Teil des Slices:

- keine neue Contribution-Persistenz,
- keine neue Governance-, Quorum- oder Rollen-Semantik,
- kein zweiter `/create`-Chat,
- keine automatische Runde,
- keine neue kanonische Route.

`RUNDEN-WORKSPACE-03` bleibt bis zum Abschluss und zur praktischen
Musterklärung von `DOSSIER-WORKSPACE-02` blockiert. Gemeinsame Komponenten
werden erst nach beiden bewährten Umsetzungen und nur bei realer Wiederholung
extrahiert.

## 10. Abgrenzung und Guardrails

Dieser Contract und seine direkten Folgeslices ändern nicht:

- `/admin/marketing`,
- Root-Layouts,
- globale Design-Tokens,
- breit verwendete Shared Components,
- Routing-Semantik,
- Rollen- oder Governance-Modell,
- Providerlogik,
- Publishing-Semantik,
- Runtime- oder Persistenzarchitektur.

Es entsteht weder ein neues globales Designsystem noch vorschnell eine
Component Library.

Unverändert verbindlich:

- kein Auto-Publish,
- kein Auto-Handoff,
- kein automatisches Dossier,
- keine automatische Runde,
- keine Fake-Runtime,
- keine Demo-Kennzahlen in Production,
- keine Provider-Namen in Public UX,
- Preview ist nicht Runtime,
- `publish_ready` ist nicht `published`.

## 11. Abnahmekriterien dieses Contracts

Dieser Decision-/UX-Slice ist abgeschlossen, wenn:

- die drei Produktrollen und ihre Ausschlüsse eindeutig sind,
- Ist-Flächen und gemeinsames Sollbild repo-nah beschrieben sind,
- Dossier-, Runden-, Interaktions- und Zustandsvertrag vorliegen,
- Desktop, Mobile, RTL, Tastatur, Zoom und Screenreader berücksichtigt sind,
- beide Folgeslices konkrete bestehende Datei- und Komponentengrenzen besitzen,
- keine Produkt-, Runtime-, Routing-, Provider- oder Persistenzdatei geändert
  wurde,
- `/admin/marketing` unberührt bleibt,
- `DOSSIER-WORKSPACE-02` als nächster Slice `codex_ready` und
  `RUNDEN-WORKSPACE-03` weiterhin `blocked` ist.
