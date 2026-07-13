# V3 Voxy Self-Render und Marketing-Pilot Roadmap

Datum: `2026-07-13`

Status: `canonical_product_direction / docs_only / runtime_pending`

Mastertask: GitHub Issue `#310` (`V3: Voxy Video Briefing Flow vollständig umsetzen`)

Anschluss an:

- `docs/E150/V3_VOXY_VIDEO_BRIEFING_FLOW_2026-07-06.md`
- `docs/E150/V3_VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_AUDIT_2026-07-12.md`
- `docs/E150/V3_VOXY_RUNTIME_PATH_DECISION_PACK_2026-07-12.md`
- `docs/E150/V3_VOXY_RUNTIME_PATH_CHOICE_2026-07-12.md`
- `docs/E150/V3_VOXY_HYBRID_RUNTIME_FOUNDATION_2026-07-12.md`
- `docs/E150/OpenTasks.md`

## 1. Produktentscheidung

Das langfristige Voxy-Ziel wird auf **eigenes, serverseitiges Self-Rendering innerhalb von eDebatte** erweitert und kanonisiert.

Der bereits freigegebene Pfad

```text
selected_path = hybrid_external_render_adapter
```

bleibt als sinnvoller Uebergangs-, Pilot- und Fallback-Pfad bestehen, ist aber **nicht mehr das alleinige Endziel**.

Das strategische Endbild lautet:

```text
Diskussion / Dossier / Mitmachraum / Claim-Kontext
-> Debattenstand, Quellen, These, Gegenposition, offene Fragen
-> Voxy-Briefing und Script
-> Voice- und Timing-Track
-> Voxy-Szenen- und Bewegungsplan
-> Untertitel, Quellenkarten und Branding
-> eigener Render-Worker
-> internes Preview-Artefakt
-> Review / Revision / Approval
-> Publishing-Draft
-> externe Aktivierung erst nach expliziter Freigabe
```

Dabei gilt:

- eDebatte besitzt Workflow, Script, Quellenlogik, Sprachbruecke, Assets, Templates, Review, Rendering-Steuerung, Preview, Audit und Publishing-Handoff.
- Der erste reale Render darf ueber einen austauschbaren externen Adapter erfolgen, wenn dies den Test beschleunigt.
- Der produktive Kern darf nicht auf Adobe, OBS, Canva, CapCut, HeyGen oder einen anderen einzelnen Anbieter zugeschnitten werden.
- Langfristig soll ein eigener Renderer externe Video- und Avatar-Kosten weitgehend vermeiden.
- Externe Provider bleiben optionale Adapter fuer Qualitaetsvergleich, Lastspitzen, Spezialformate oder Fallback.
- Kein Auto-Publish und kein Review-Bypass.

## 2. Zwei parallele Pfade statt einer halben Zwischenloesung

### Pfad A: Marketing-Pilot jetzt

Ziel ist, zeitnah echte Voxy-Werbevideos testen und einsetzen zu koennen, bevor die vollstaendige Runtime fertig ist.

Der Pilot ist bewusst eine **kontrollierte Produktionsstrecke**, nicht der spaetere Produktkern.

Erlaubt:

- vorhandene Voxy-Raster-Assets und `voxy-podcast-stage`
- manuell freigegebene Scripts
- synthetische oder manuell eingesprochene Teststimme
- einfache Motion-Graphics, Zooms, Karten, Waveform, Untertitel und Szenenwechsel
- manuelle oder halbautomatische Exporte
- ein kleines austauschbares Schnitt-/Motion-Tool nur fuer die Pilotphase
- externe Verteilung erst nach menschlicher Freigabe

Nicht erforderlich:

- Webcam-Aufnahme des Nutzers
- Live-Puppeteering
- OBS
- vollstaendige Mund- und Koerperanimation in der ersten Kampagne
- produktive Provider-, Queue-, Storage- oder Publish-Runtime

Nicht zulaessig als Endzustand:

- zehn voneinander getrennte manuelle Projektdateien ohne gemeinsames Script-/Asset-Schema
- dauerhafte Abhaengigkeit von einem einzelnen Videoanbieter
- ungepruefte oder automatisch veroeffentlichte politische bzw. gesellschaftliche Inhalte
- Fake-Live-, Fake-Quellen- oder Fake-Partner-Behauptungen

### Pfad B: Eigene Voxy-Render-Runtime

Ziel ist ein wiederholbarer, serverseitiger Renderpfad, der aus strukturierten Inputs eigenstaendig MP4-/WebM-Previews erzeugt.

Kanonische Bausteine:

1. `VoxyVideoBriefing`
2. `VoxyScriptSegment[]`
3. `VoxyVoiceTrack`
4. `VoxyScenePlan`
5. `VoxyMotionCue[]`
6. `VoxyCaptionTrack`
7. `VoxySourceCard[]`
8. `VoxyRenderTemplate`
9. `VoxyRenderJob`
10. `VoxyRenderedPreview`
11. `VoxyPreviewReviewDecision`
12. `VoxyPublishDraft`

Der Renderer soll zunaechst keine generative 3D-Figur voraussetzen. Die erste eigene Runtime darf Voxy aus kanonischen 2D-Assets, definierten Posen, Mundformen, Bewegungscues, Text-, Quellen- und Audio-Timings zusammensetzen.

## 3. Empfehlung fuer die ersten Werbevideos

### Klare Abgrenzung Adobe und OBS

- **OBS ist fuer die geplanten vorproduzierten Werbevideos nicht erforderlich.** OBS ist nur sinnvoll fuer Live-Streaming, Live-Szenenumschaltung oder Bildschirm-/Kameraaufnahme.
- **Adobe Character Animator ist optional**, wenn kurzfristig eine von einem Menschen gespielte Voxy-Puppe mit Kopf-, Augen-, Mund- und Armbewegungen getestet werden soll.
- Fuer die erste Werbekampagne ist eine audio-first Motion-Strecke effizienter: vorhandene Voxy-Posen, feste Studiobuehne, Voiceover, Untertitel, Quellen-/Produktkarten und wenige wiedererkennbare Animationen.
- Eine echte Voxy-Puppe kann spaeter als zusaetzlicher manueller Live-/Special-Content-Pfad entstehen, darf aber nicht Voraussetzung der Self-Render-Runtime werden.

### Empfohlene Pilotfolge

```text
2-3 manuelle Stilprototypen
-> Bildsprache, Stimme, Tempo, Untertitel und CTA festlegen
-> ein gemeinsames Pilot-Template einfrieren
-> restliche 7-8 Videos aus demselben System produzieren
-> erfolgreiche Regeln in die eigene Render-Runtime ueberfuehren
```

Damit werden nicht zuerst zehn unterschiedliche Einzelvideos gebaut, sondern ein wiederverwendbares Kampagnensystem getestet.

## 4. Kampagnensystem fuer zehn Videos

### Gemeinsame Regeln

- Formate: `9:16`, `1:1`, `16:9`
- primaere Laengen: `15-20 s` und `30-45 s`
- optionales Langformat: `60-90 s`
- einheitliche Voxy-Stimme oder eindeutig markierter Test-Voice-Status
- Voxy bleibt Mascot und Einordner, keine reale Person, kein Amt und kein Wahrheitsrichter
- starke Untertitel als Standard
- Originalsprache und Uebersetzung bleiben getrennt
- Quellen nur nennen, wenn sie im Source-Pack vorhanden sind
- keine Fake-Nutzerzahlen, Fake-Partner, Fake-Live-Daten oder ungeprueften Erfolgsversprechen
- jeder CTA verweist auf eine reale eDebatte-Oberflaeche oder klar markierte Preview

### Video 01 - Warum eDebatte?

Zweck: Marken- und Problemfilm.

Hook:

> Zwischen Schlagzeile, Kommentarspalte und Parteitaktik geht oft verloren, worum es eigentlich geht.

Voxy-Nutzen:

- Thema einordnen
- Argumente sichtbar machen
- Quellen und offene Fragen trennen
- Menschen zum konstruktiven Mitmachen fuehren

CTA: `Entdecke eDebatte.`

### Video 02 - Dein Beitrag verschwindet nicht

Zweck: Beteiligungseinstieg.

Story:

```text
Beitrag eingeben
-> Thema und Standpunkt erkennen
-> passende Debatte / Dossier / Beteiligung finden
-> naechsten Schritt selbst bestaetigen
```

CTA: `Bring deinen Beitrag ein.`

### Video 03 - Laut ist nicht automatisch richtig

Zweck: Abgrenzung von klassischen Kommentarspalten.

Voxy zeigt nebeneinander:

- Behauptung
- Gegenposition
- Quelle
- offene Frage

CTA: `Erst verstehen. Dann Position beziehen.`

### Video 04 - Debattenstand in 30 Sekunden

Zweck: wiederkehrendes Themenformat.

Template:

```text
Was ist passiert?
Was spricht dafuer?
Was spricht dagegen?
Was ist noch offen?
Wo kann ich mitmachen?
```

Dieses Format soll spaeter automatisch aus einem Dossier oder Anlassraum erzeugt werden.

### Video 05 - Quellen statt Bauchgefuehl

Zweck: Trust- und Factcheck-Erklaerung.

Wichtig:

- Voxy behauptet nicht, eine Wahrheit abschliessend festzustellen.
- Quellenlage, Unsicherheit und offene Prueffragen bleiben sichtbar.

CTA: `Pruefe den Debattenstand.`

### Video 06 - Eine Debatte, mehrere Sprachen

Zweck: Language Bridge.

Story:

- Beitrag im Original bleibt erhalten
- Lesefassung kann in einer anderen Sprache erscheinen
- Antworten koennen sprachuebergreifend mitgelesen werden
- Uebersetzung ist kein Beleg

CTA: `Verstaendigung ohne Ursprungsverlust.`

### Video 07 - Von der Frage zum Dossier

Zweck: Produktlogik erklaeren.

Story:

```text
Frage / Beitrag
-> Claims und Perspektiven
-> Quellen und offene Punkte
-> strukturierter Debattenstand
-> Dossier
```

CTA: `Sieh, wie ein Thema Substanz bekommt.`

### Video 08 - Beteiligung fuer Initiativen

Zweck: Bürgerinitiativen und kleinere Organisationen.

Nutzen:

- Anliegen strukturiert aufnehmen
- Unterstuetzer und Gegenpositionen sichtbar machen
- Fragen und Formate vorbereiten
- nichts ohne Freigabe veroeffentlichen

CTA: `Macht euer Anliegen anschlussfaehig.`

### Video 09 - Beteiligung fuer Verwaltung und Organisationen

Zweck: B2B-/B2G-Erklaerung.

Nutzen:

- Beteiligungsraum vorbereiten
- Rueckmeldungen clustern
- Quellen und Konfliktlinien sichtbar machen
- Ergebnisse reviewbar dokumentieren

CTA: `Beteiligung nachvollziehbar organisieren.`

### Video 10 - Voxy Wochenbriefing

Zweck: dauerhaftes, regelmaessiges Format.

Template:

```text
3 Themen, die diese Woche weitergegangen sind
1 neue Gegenposition
1 offene Frage
1 konkrete Moeglichkeit zum Mitmachen
```

Dieses Format ist der staerkste Kandidat fuer spaetere planbare, aber weiterhin review-first Videoerzeugung.

## 5. Produktionsstufen

### Stufe 0 - Stil- und Markenentscheidung

Ergebnis:

- eine verbindliche Voxy-Voice-Richtung
- eine Studiobuehne
- ein Caption-Stil
- ein Source-Card-Stil
- ein Lower-Third-Stil
- ein CTA-Endframe
- Bewegungskatalog fuer Voxy

Vorgeschlagener erster Bewegungskatalog:

- `idle_breath`
- `blink`
- `small_head_nod`
- `present_left`
- `present_right`
- `thinking`
- `source_emphasis`
- `question_emphasis`
- `cta_wave`

### Stufe 1 - Zehn Marketing-Pilotvideos

Ergebnis:

- zehn reviewte Mastervideos
- Ableitungen fuer `9:16`, `1:1`, `16:9`
- Script-, Voice-, Caption- und Szenenquellen im Repo
- keine blosse Ablage finaler MP4-Dateien ohne reproduzierbare Inputs

### Stufe 2 - Programmatic Video Spike

Ergebnis:

- genau ein lokaler, reproduzierbarer Render
- strukturierter JSON-/TypeScript-Input
- Voxy-Bild, Voice-Track, Untertitel, Intro, Source-Card und CTA
- MP4-Output
- kein produktiver Queue-/Worker-/Upload-/Publish-Pfad

Technische Kandidaten duerfen in diesem Spike verglichen werden. Der Repo-Kern bleibt renderer-neutral, auch wenn der erste Prototyp beispielsweise mit React-basiertem Video-Rendering und FFmpeg umgesetzt wird.

### Stufe 3 - First Internal Preview Runtime

Ergebnis:

- server-only Render-Command
- idempotenter interner Job
- definierte Retry- und Timeout-Regeln
- Preview-Speicherung mit Retention/Delete-Regeln
- Anzeige in `/admin/review` und `/dossier/[id]/studio`
- keine oeffentliche Aktivierung

### Stufe 4 - Eigener Self-Render MVP

Ergebnis:

- eigener Video-Renderer fuer mindestens ein Voxy-Briefing-Template
- eigene Asset-/Template-Versionierung
- Voice-Provider-Abstraktion mit lokalem oder austauschbarem Profil
- Caption- und Source-Card-Rendering
- `9:16` und `16:9`
- Kosten-/Laufzeitmessung
- Review- und Re-Render-Pfad

### Stufe 5 - Provider-Fallback und Qualitaetsvergleich

Ergebnis:

- eigener Renderer ist primaerer Pfad fuer Standardformate
- externer Adapter bleibt optional fuer Spezialqualitaet, Lastspitzen oder Experimente
- identisches Briefing-/Script-/Review-Modell fuer beide Pfade
- kein Anbieter darf den Produktzustand oder Publish-Status bestimmen

### Stufe 6 - kontrollierte Distribution

Ergebnis:

- Upload- und Scheduling-Drafts
- plattformspezifische Varianten
- Freigabe je Kanal und Artefakt
- weiterhin kein ungeprueftes Auto-Publish

## 6. Kanonische Asset-Strategie

### Bereits vorhanden

- statische Voxy-Posen in `apps/web/public/brand/voxy/`
- `voxy-podcast-stage`
- Voxy-Manifest
- Wordmark-, Gradient- und VOG-Pin-Overlays

### Als Naechstes benoetigt

1. neutral freigestellter Voxy-Master
2. mindestens acht bis zwoelf Mundformen / Viseme-States
3. getrennte Augen, Lider und Brauen
4. definierte Hand-/Arm-Posen
5. transparente Vordergrund-/Hintergrundebenen der Podcast-Buehne
6. Caption-Template
7. Lower-Third-Template
8. Source-Card-Template
9. CTA-Endframe
10. Export-Presets fuer `9:16`, `1:1`, `16:9`
11. Audio- und Loudness-Policy
12. Voice-Profil- und Aussprachelexikon

Der bestehende Podcast-Stage-Render bleibt Referenz und Kampagnenasset, ist aber noch kein animierbares Mastermodell.

## 7. OpenTasks-Integrationsplan

Die folgenden Tasks sollen im normalisierten operativen Katalog von `docs/E150/OpenTasks.md` direkt hinter `V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03` aufgenommen werden.

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V3-VOXY-SELF-RENDER-ROADMAP-04 | done | high | V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03 | Strategisches Voxy-Endbild, Marketing-Pilot und eigener Self-Render-Pfad | Hybridpfad als Uebergang/Fallback erhalten und eigenes Rendering als langfristiges Endziel kanonisieren | Pilot- und Runtime-Pfad getrennt; zehn Kampagnenformate beschrieben; Adobe/OBS nicht als Produktvoraussetzung; Self-Render-Stufen, Assets und Guardrails dokumentiert; kein Runtime- oder Publish-Claim | no | Evidenz: `docs/E150/V3_VOXY_SELF_RENDER_AND_MARKETING_PILOT_ROADMAP_2026-07-13.md` |
| V3-VOXY-MARKETING-PILOT-PACK-05 | codex_ready | high | V3-VOXY-SELF-RENDER-ROADMAP-04 | Repo-seitiges Produktionspaket fuer zehn Werbevideos | Die zehn Kampagnenideen als reproduzierbare Script-, Scene-, Caption- und Export-Drafts vorbereiten, ohne Medienruntime zu behaupten | kanonisches Campaign-Schema; zehn Briefing-/Script-Drafts; drei Formatpresets; CTA-, Caption-, Source-Card- und Voice-Hinweise; bestehende Voxy-Assets referenziert; keine Provider-Calls, keine Medienerzeugung, kein Upload, kein Publish | no | Docs-/Asset-/Contract-Slice; menschliche Markenfreigabe bleibt erforderlich |
| V3-VOXY-PILOT-STYLE-DECISION-06 | needs_decision | high | V3-VOXY-MARKETING-PILOT-PACK-05 | Stimme, Studiobuehne, Bewegung, Caption, Lower Third, Source Cards und CTA-Endframe | Einen verbindlichen Stil fuer die ersten zwei bis drei Prototypen und spaetere Runtime festlegen | Voice-Richtung; Bewegungsumfang; Mundanimation ja/nein fuer Pilot; Caption-/Source-/CTA-Regeln; Formatprioritaet; Testtool nur als austauschbare Pilotentscheidung | yes | Entscheidung nach zwei bis drei realen Stilprototypen, nicht nach reiner Theorie |
| V3-VOXY-PROGRAMMATIC-VIDEO-SPIKE-07 | blocked | high | V3-VOXY-PILOT-STYLE-DECISION-06 | Lokaler reproduzierbarer Self-Render-Spike | Aus strukturiertem Input genau ein echtes internes Voxy-MP4 erzeugen | lokaler Render-Command; ein Template; Voice-Track; Voxy-Pose-/Motion-Cues; Captions; Source-Card; CTA; MP4; reproduzierbare Inputs; keine Queue, kein Upload, kein Publish, keine Secrets im Repo | no | Wird nach Stilentscheidung auf `codex_ready` gesetzt; Renderer-Implementierung darf konkret sein, Contract bleibt austauschbar |
| V3-VOXY-ANIMATABLE-MASTER-ASSET-08 | blocked | high | V3-VOXY-PILOT-STYLE-DECISION-06 | Kanonisches animierbares Voxy-Asset-Pack | Statische Voxy-Bilder in versionierte, renderer-taugliche Layer und States ueberfuehren | neutraler Master; Augen/Brauen/Lider; Viseme-/Mund-States; Hand-/Arm-Posen; transparente Stage-Layer; Manifest-Version; Nutzungs- und Fallbackregeln | yes | Asset-Erstellung braucht visuelle Freigabe; keine fremde Marken-/Lizenzabhaengigkeit kanonisieren |
| V3-VOXY-FIRST-INTERNAL-PREVIEW-RUNTIME-09 | blocked | high | V3-VOXY-PROGRAMMATIC-VIDEO-SPIKE-07, V3-VOXY-ANIMATABLE-MASTER-ASSET-08 | Server-only Renderjob, Storage und Review-Preview | Aus einem freigegebenen Script ein internes Preview-Artefakt erzeugen und reviewbar anzeigen | idempotenter Job; Timeout/Retry; Storage-/Retention-/Delete-Regeln; Preview in Admin Review und Dossier Studio; Audit; Kosten-/Laufzeitmessung; keine oeffentliche Aktivierung | yes | Voice-/Storage-/Compute-Policy vor Aktivierung entscheiden |
| V3-VOXY-SELF-RENDER-MVP-10 | blocked | high | V3-VOXY-FIRST-INTERNAL-PREVIEW-RUNTIME-09 | Eigener Standardrenderer fuer Voxy-Briefings | Standardvideos ohne externen Avatar-/Full-Video-Provider erzeugen | mindestens ein produktnahes Template; `9:16` und `16:9`; Voice-Abstraktion; Caption-/Source-/CTA-Rendering; Re-Render; Versions- und Reproduzierbarkeitsnachweis; Review-first | no | Externe Adapter bleiben optionaler Fallback |
| V3-VOXY-EXTERNAL-RENDER-FALLBACK-11 | blocked | medium | V3-VOXY-FIRST-INTERNAL-PREVIEW-RUNTIME-09 | Austauschbarer externer Renderadapter | Externen Render nur fuer Pilot, Spezialqualitaet oder Fallback nutzbar halten | Provider-neutraler Adapter; DPA/Residency/PII-Policy; Kostenlimit; identisches Briefing-/Review-Modell; kein Provider-gesteuerter Publish-Status | yes | Bestehender Hybridpfad wird nicht verworfen, aber dem Self-Render-Endziel untergeordnet |
| V3-VOXY-CAMPAIGN-OPS-12 | blocked | medium | V3-VOXY-MARKETING-PILOT-PACK-05, V3-VOXY-SELF-RENDER-MVP-10 | Wiederkehrende Kampagnen- und Wochenbriefing-Produktion | Zehn Evergreen-/Erklaervideos und regelmaessige aktuelle Briefings aus gemeinsamen Templates betreiben | Kampagnenkalender; Varianten; Archiv/Versionierung; Performance-Metadaten ohne manipulative Optimierung; Review je Video; Scheduling nur nach Freigabe; kein Auto-Publish | yes | Wochenbriefing ist erster Kandidat fuer spaetere planbare Erzeugung |

## 8. Reihenfolge fuer Codex

Nach Aufnahme in `OpenTasks.md` gilt:

1. `V3-VOXY-MARKETING-PILOT-PACK-05`
2. Produktentscheidung `V3-VOXY-PILOT-STYLE-DECISION-06`
3. `V3-VOXY-PROGRAMMATIC-VIDEO-SPIKE-07`
4. `V3-VOXY-ANIMATABLE-MASTER-ASSET-08`
5. `V3-VOXY-FIRST-INTERNAL-PREVIEW-RUNTIME-09`
6. `V3-VOXY-SELF-RENDER-MVP-10`
7. optional `V3-VOXY-EXTERNAL-RENDER-FALLBACK-11`
8. `V3-VOXY-CAMPAIGN-OPS-12`

Codex darf ohne neue Produktentscheidung sofort nur den docs-/contract-seitigen Marketing-Pilot-Pack-Slice bearbeiten.

Ein echter Medienrender, Provider-Call, Secret-Read, Queue-/Worker-Start, Storage-Write, Upload, Scheduling oder Publish bleibt bis zum jeweiligen expliziten Task und Review blockiert.

## 9. Definition of Done des Gesamtpfads

Der Voxy-Video-Pfad gilt erst dann als funktional abgeschlossen, wenn:

- ein Dossier oder eine Diskussion ein strukturiertes Voxy-Briefing liefern kann
- Script, Quellen, Gegenpositionen, offene Fragen und Sprachlage erhalten bleiben
- Voxy mit kanonischen Assets und einer konsistenten Stimme erscheint
- ein eigener serverseitiger Standardrenderer ein reproduzierbares Video erzeugt
- Captions, Quellenkarten und CTA korrekt gerendert werden
- ein Preview gespeichert und reviewt werden kann
- Revision und Re-Render funktionieren
- externe Provider nur austauschbare Adapter bleiben
- kein Publish ohne explizite Freigabe erfolgt
- die zehn Marketingformate und das Wochenbriefing aus demselben System ableitbar sind

Bis dahin gilt weiterhin:

```text
review_first_architecture_complete = true
runtime_pending = true
runtime_enabled = false
self_render_target = canonical
external_render_adapter = transitional_or_fallback
```
