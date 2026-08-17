# VOXY-DUAL-VOICE-EXPLAINER-PILOT-01

Stand: 2026-08-17
Status: `codex_ready` — separater nächster Implementierungsslice, in diesem Durchgang nicht umgesetzt

## Verbindliche Dual-Voice-Architektur

Die menschliche Produktentscheidung ist angenommen:

- `humanVoiceArchitectureAcceptance = accepted`
- `voxyMaleSignatureAcceptance = accepted`
- `editorialFemaleVoiceAcceptance = accepted`

`VOXY_SIGNATURE` ist die männliche, zuvor als E akzeptierte Signature-Stimme
mit der lokalen Voice-ID `voxy-signature-e-5a465a33` und der ausgewählten
Variante `e-02-warm-sovereign`. Sie spricht ausschließlich Blöcke mit
`speakerRole = "voxy"`.

`EDITORIAL_VOICE` ist die weibliche, lokal vorhandene Documentary Candidate A
mit der Voice-ID `de_DE/m-ailabs_low#ramona_deininger`. Sie spricht
ausschließlich Blöcke mit `speakerRole = "editorial"`. Sie ist eine
redaktionelle Stimme und ausdrücklich keine weibliche Voxy-Variante.

Die Editorial-Stimme stammt aus Mycroft Mimic 3 / VITS
`mycroft-mimic3-tts 0.2.4`, Modell-Repository
`MycroftAI/mimic3-voices` auf Revision
`b239a9084e21fbaa7ac78ea6e31f5de1c31c8f42`, Datensatz
`M-AILABS German / Ramona Deininger`. Engine-, Modell- und Datensatzlizenzen
sowie die Weight-SHAs bleiben über den Documentary-Bake-off gebunden. Die
Laufzeit arbeitet nach Provisionierung offline und führt keine
Netzwerkanfragen aus. Eine öffentliche Audio- oder Produktionsfreigabe folgt
daraus nicht.

Jeder gesprochene Block muss `speakerRole`, `voiceId` und `text` explizit
führen. Eine implizite Stimmwahl ist unzulässig. Voxy übernimmt Begrüßung,
direkte Ansprache, Fragen, Moderation, Übergänge, Reflexion, CTA und Abschluss.
Editorial übernimmt Faktenverdichtung, Kontext, Quellen- und
Argumenteinordnung, Erklärung sowie Zwischen- und Schlusszusammenfassungen.

Bei direkter Zuschaueransprache eröffnet Voxy den zusammenhängenden Beitrag
genau einmal mit „Hallo Nachbar,“. Die Begrüßung wird weder vor weiteren
Voxy-Segmenten wiederholt noch von Editorial verwendet. Sehr kurze
Einblendungen, Übergänge und nicht direkt adressierende Informationssegmente
erhalten keine erneute Begrüßung. Dies setzt die bestehende Brand Narrative
ohne Ausnahme um.

Während Editorial spricht, bleibt Voxys Mund neutral oder geschlossen und
erhält kein Lip-Sync auf die Editorial-Stimme. Voxy bleibt mit subtiler
Idle-Bewegung als Gastgeber anwesend. Es gibt keinen zweiten Avatar und genau
eine Waveform; sie reagiert jeweils auf die aktive Stimme.

Die historischen B/C/D/E/F-Bake-offs bleiben unverändert erhalten. Die
angenommene Rollenentscheidung ersetzt weder deren Dateien noch ihre
historischen Manifeststände, sondern dokumentiert die nachfolgende menschliche
Auswahl.

## Evidence-first Visual Grammar

Voxy ist Gastgeber der Sendung, aber nicht permanent das größte visuelle
Element. Sobald konkrete Information erklärt wird, übernimmt das
Informationsobjekt die visuelle Hauptrolle.

### `HOST`

Voxy ist primärer Fokus für Einführung, Frage, Übergang, Reflexion und CTA.

### `FOCUS`

Die aktive Quelle, ein Chart, eine Karte, ein Dokument, Bild, eine Statistik,
ein Zitat oder eine Trenddarstellung fährt groß in den Vordergrund. Das
Informationsobjekt erhält maximalen visuellen Raum; Voxy tritt sichtbar zurück.
Quelle und Herkunft bleiben erkennbar, relevante Datenstellen dürfen gezielt
hervorgehoben werden.

### `EXPLAIN`

Dies ist der bevorzugte Zustand für Editorial. Die aktive Information bleibt
groß und die Visualisierung folgt der gesprochenen Erklärung. Charts dürfen
sich entlang der Narration aufbauen, Dokumentstellen markiert und Karten oder
Trends fokussiert werden. Dekorative Animation ohne Informationswert ist
unzulässig. Voxy bleibt passiv präsent und sein Mund neutral oder geschlossen.

### `DOCK`

Nach der Erklärung verkleinert sich das Informationsobjekt kontrolliert und
wandert in die rechte Evidence-/Summary-Zone. Es verschwindet nicht abrupt;
Quelle und Herkunft bleiben nachvollziehbar.

Diese Zone ist keine statische Sidebar, sondern das dynamische visuelle
Gedächtnis des Beitrags. Sie kann Quellen, Kennzahlen, Trends, Argumente,
Gegenargumente, Zitate, offene Fragen, Unsicherheiten und
Abstimmungsergebnisse speichern. Bereits gedockte Elemente dürfen erneut in
`FOCUS` geholt werden.

### `SYNTHESIS`

Mehrere zuvor erklärte Evidence-Elemente werden gemeinsam sichtbar.
Beziehungen, Widersprüche oder Übereinstimmungen dürfen visualisiert und durch
Editorial zusammengefasst werden. Danach übernimmt Voxy wieder für Einordnung,
Frage oder CTA.

Der kanonische Informationsfluss lautet:

`VOXY / HOST → INFORMATION / FOCUS → EDITORIAL / EXPLAIN → INFORMATION / DOCK → VOXY / HOST → nächste INFORMATION / FOCUS → EDITORIAL / EXPLAIN → DOCK → SYNTHESIS → VOXY / REFLECTION OR CTA`

## Source-first-Prinzip und Chart-Verhalten

Die visuelle Priorität lautet:

1. Originalquelle oder Originaldaten
2. daraus nachvollziehbar erzeugte Visualisierung
3. klar gekennzeichnete redaktionelle Zusammenfassung

Zuschauende müssen nachvollziehen können, woher die Information kommt, was die
Quelle zeigt, welcher Teil relevant ist und wie daraus die gezeigte Aussage
abgeleitet wurde. Erfundenen Charts, dekorativen Fake-Daten und Quellen nur im
Kleingedruckten wird ausdrücklich widersprochen.

Charts sind narrative Objekte. Entlang der Erklärung dürfen zunächst Achse,
relevante Datenreihe, fokussierter Zeitraum, Vergleichswert und relevanter
Punkt erscheinen; anschließend folgt der vollständige Kontext und danach
gegebenenfalls `DOCK`. Die Animation folgt der Information.

## Privater Pilot „Was ist eDebatte?“

Der Pilot verwendet exakt diese sieben sichtbaren Textblöcke:

1. `voxy` / `VOXY_SIGNATURE`:

   > Hallo Nachbar,
   > ich bin Voxy.
   >
   > Und ich möchte dir zeigen, warum eDebatte mehr ist
   > als eine weitere Plattform für politische Meinungen.

2. `voxy` / `VOXY_SIGNATURE`: „Nehmen wir eine politische Frage. Meistens begegnen uns dazu Schlagzeilen, einzelne Zahlen und ziemlich schnell zwei gegensätzliche Lager.“
3. `editorial` / `EDITORIAL_VOICE`: „eDebatte führt Quellen, Argumente und unterschiedliche Perspektiven zusammen. Dabei wird sichtbar, was belegt ist, wo Aussagen einander widersprechen und welche Fragen noch offen sind.“
4. `voxy` / `VOXY_SIGNATURE`: „Und genau hier komme ich wieder ins Spiel. Ich sage dir nicht, welche Seite recht hat.“
5. `voxy` / `VOXY_SIGNATURE`: „Ich helfe dir dabei, selbst herauszufinden, was du davon hältst.“
6. `editorial` / `EDITORIAL_VOICE`: „Kurz gesagt: verstehen, prüfen, einordnen und anschließend selbst entscheiden.“
7. `voxy` / `VOXY_SIGNATURE`: „Das ist eDebatte. Und ich bin Voxy.“

Der spätere Pilot muss 1920 × 1080 Pixel, 24 fps und 45 bis 60 Sekunden
erreichen. Er muss mindestens einmal
`HOST → FOCUS → EXPLAIN → DOCK → HOST` und abschließend eine
`SYNTHESIS`-Situation zeigen. Erwartete private Outputs sind MP4, WebM,
WAV-Master, Preview, Contact Sheet, `speaker-timeline.json` und Manifest. Jede
Timeline-Zeile enthält `start`, `end`, `speakerRole`, `voiceId` und `text`.

Charakter, Kopf, Kopfhörer, Jacke, Pin, Pocket-Mark, Mouth v4.1, Mundanker,
Pivot, Studio, Kamera und die einzelne Waveform bleiben eingefroren. Es gibt
keinen zweiten Avatar und kein visuelles Redesign.

Der Pilot ist ausschließlich private Human-Review-Evidence. In diesem Slice
wurde kein Pilot gerendert, keine allgemeine autonome News-Produktion
implementiert und weder Upload, Deployment, Publishing noch Production
autorisiert. `productionEligible = false` und `autoPublish = false`.

## Spätere Formatfamilie

`VOXY_NEWS`, `VOXY_EXPLAINER`, `VOXY_DOSSIER`, `VOXY_BALLOT` und
`VOXY_SOCIAL_SHORT` sollen denselben Rollen- und Visual-State-Vertrag nutzen.
Für sie werden in diesem Slice weder parallele Voice-Systeme noch eine
Produktion implementiert.
