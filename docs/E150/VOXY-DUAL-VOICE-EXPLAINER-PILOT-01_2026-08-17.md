# VOXY-DUAL-VOICE-EXPLAINER-PILOT-01

Stand: 2026-08-17
Status: `review` — technischer Pilot PASS, private menschliche Sicht- und Hörabnahme ausstehend

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

Der implementierte Pilot erreicht 1920 × 1080 Pixel, 24 fps und 45,928
Sekunden. Er zeigt
`HOST → FOCUS → EXPLAIN → DOCK → HOST` und abschließend eine
`SYNTHESIS`-Situation. Die privaten Outputs enthalten MP4, WebM, WAV-Master,
Preview, Contact Sheet, `speaker-timeline.json`,
`visual-state-timeline.json`, fünf State-Standframes und Manifest. Jede
Timeline-Zeile enthält `start`, `end`, `speakerRole`, `voiceId` und `text`.

Charakter, Kopf, Kopfhörer, Jacke, Pin, Pocket-Mark, Mouth v4.1, Mundanker,
Pivot, Studio, Kamera und die einzelne Waveform bleiben eingefroren. Es gibt
keinen zweiten Avatar und kein visuelles Redesign.

Der Pilot ist ausschließlich private Human-Review-Evidence. Er wurde lokal in
einem ignorierten Symlink-Ziel außerhalb des Git-Worktrees gerendert. Keine
private Rohreferenz, kein privater Referenzpfad und kein synthetisiertes Audio
wird committed oder als PR-/CI-Artefakt hochgeladen. Es wurde keine allgemeine
autonome News-Produktion implementiert und weder Upload, Deployment,
Publishing noch Production autorisiert. `humanPilotAcceptance = pending`,
`productionEligible = false` und `autoPublish = false`.

## Spätere Formatfamilie

`VOXY_NEWS`, `VOXY_EXPLAINER`, `VOXY_DOSSIER`, `VOXY_BALLOT` und
`VOXY_SOCIAL_SHORT` sollen denselben Rollen- und Visual-State-Vertrag nutzen.
Für sie werden in diesem Slice weder parallele Voice-Systeme noch eine
Produktion implementiert.

## Technische Pilot-Evidence — 2026-08-17

Der revisionsgebundene lokale Render auf Exact Head
`c8c67a500c3fae9d1f926a55cc6ab23a83a1b814` hat den technischen Pilot-Gate
bestanden. Artifact-ID:
`voxy-dual-voice-explainer-pilot-01-c8c67a500c3f`.

Das private Paket unter
`artifacts/voxy-dual-voice-explainer-pilot-01/` enthält:

- `voxy-dual-voice-explainer-pilot-01.mp4` mit H.264/AAC;
- `voxy-dual-voice-explainer-pilot-01.webm` mit VP9/Opus;
- `master-audio.wav` als 48-kHz-Mono-PCM;
- `preview.png`, `contact-sheet.png` und Standframes für `HOST`, `FOCUS`,
  `EXPLAIN`, `DOCK` und `SYNTHESIS`;
- explizite Speaker- und Visual-State-Timelines;
- ein SHA- und FFprobe-gebundenes `manifest.json`.

FFprobe bestätigt 1920 × 1080, 24 fps, Audio in beiden Videocontainern und
45,928 Sekunden MP4-/WAV-Dauer; WebM liegt containerbedingt bei 45,936
Sekunden. Die Timeline enthält exakt sieben Blöcke. Voxy nutzt ausschließlich
`voxy-signature-e-5a465a33`, Editorial ausschließlich
`de_DE/m-ailabs_low#ramona_deininger`. Editorial erzwingt sichtbar den
geschlossenen Mouth-v4.1-Zustand; nur Voxy erhält amplitudenbasiertes
Mouth-Sync. Genau eine Waveform reagiert auf die jeweils aktive Stimme.

Die visuelle Timeline lautet vollständig:

`HOST → FOCUS → EXPLAIN → DOCK → HOST → FOCUS → EXPLAIN → DOCK → SYNTHESIS → HOST`.

Alle fünf Informationsobjekte sind deutlich als `DEMO / FORMAT-FIXTURE`
markiert. Der zweite Explain-Zyklus baut Dokumentstruktur, relevante Stelle
und abgeleiteten Kontext narrationsgeführt auf. Die Synthese verwendet alle
zuvor gedockten Objekte erneut. Die visuelle Selbstprüfung der fünf
Standframes bestätigt den technischen Vertrag; die qualitative menschliche
Bewertung von Stimme, Rhythmus, Fokuswechsel, Docking und Formatwirkung bleibt
ausdrücklich offen.

Bekannte Restabweichungen:

- Mouth-Sync ist geglättet amplituden- statt phonem- oder wortbasiert;
- die visuelle Bewegung wird mit 12 einzigartigen Zuständen pro Sekunde
  gerendert und frameverdoppelt in einen validen 24-fps-Container geschrieben;
- die Informationsobjekte belegen ausschließlich die Formatgrammatik und sind
  keine realen Quellen, Statistiken oder Produktdaten;
- `humanPilotAcceptance = pending`, `productionEligible = false` und
  `autoPublish = false` bleiben unverändert.

## Human-Review Correction Pass v1.1 — 2026-08-17

Der bestehende technische Pilot bleibt unverändert erhalten. Der ausdrücklich
autorisierte Correction Pass liegt separat unter
`artifacts/voxy-dual-voice-explainer-pilot-01/v1.1/` und simuliert einen
redaktionellen Demokratie-Beitrag ohne aktuelle Tatsachenbehauptung. Alle drei
Informationsobjekte sind sichtbar als `DEMO · ILLUSTRATION` gekennzeichnet:

- E1 `democracy-trust`: illustrierter Vertrauensverlauf ohne reale Werte;
- E2 `democracy-participation`: eigenständiger illustrierter
  Beteiligungsindikator;
- E3 `democracy-open-question`: „Fühlen sich Menschen politisch wirksam?“.

Der revisionsgebundene Render auf Exact Head
`afc6cccfc81df0e0f6b7ba8f9c7d462853e94dcb` hat den technischen Gate
bestanden. Artifact-ID: `voxy-democracy-pilot-v1-1-afc6cccfc81d`. FFprobe
bestätigt 1920 × 1080, 24 fps, H.264/AAC im MP4, VP9/Opus im WebM sowie
56,005 Sekunden MP4-/WAV-Dauer; die WebM-Containerdauer beträgt 56,013
Sekunden.

Die neun Sprechersegmente setzen das verbindliche Demokratie-Skript um. Voxy
spricht ausschließlich mit der männlichen Signature-Stimme
`voxy-signature-e-5a465a33`, Variante `e-02-warm-sovereign`; Editorial
ausschließlich mit der weiblichen Stimme
`de_DE/m-ailabs_low#ramona_deininger`. Der Renderer verifiziert die akzeptierte
private First-Party-Referenzauswahl und ihren ausgewählten Segment-Hash, bindet
die Synthese-Backends hart an die Rollen und bricht bei jeder Kreuzung
geschlossen ab. Zusätzlich werden alle normalisierten Segmente auf
Nicht-Stille und ihre PCM-identische Präsenz im finalen WAV-Master geprüft.
Das Manifest bestätigt für alle neun Segmente `pcmIdentityMatch = true`, keine
Rollen-/Voice-Kreuzung und beide Stimmen tatsächlich im finalen Master.

Gesprochene Sätze werden nicht im Bild wiederholt. Accessibility-Untertitel
liegen ausschließlich separat als `captions.de.vtt` und `captions.de.srt` vor;
`burnedInLowerText = false`. Sichtbarer Text beschränkt sich auf semantische
Frage-, Evidence- und Herkunftsangaben.

E1 und E2 verwenden in `FOCUS`, `EXPLAIN`, der kontinuierlichen
Scale-/Translation-Bewegung nach `DOCK` und im dynamischen Gedächtnis jeweils
dieselbe `evidenceId` und `visualIdentity`. Es gibt weder harte Substitution
noch Crossfade auf ein anderes Objekt. In `SYNTHESIS` werden E1 und E2 sichtbar
in Beziehung gesetzt und E3 als offene Frage abgeleitet, nicht als dritter
unabhängiger Kartenstapel. Der zehnteilige Review-Satz enthält ausdrücklich
einen Frame mitten im ersten FOCUS→DOCK-Morphing.

Während Editorial spricht, bleibt Voxy sichtbar und subtil präsent, sein Mund
jedoch neutral geschlossen und ohne amplitudenbasierte Bewegung; das
Informationsobjekt übernimmt den Fokus. Charakter, Studio, Mouth-v4.1-Geometrie,
Pivot, Material-/Lichtwirkung und die einzelne aktive Waveform bleiben
eingefroren.

Das private v1.1-Paket enthält die benannten MP4-, WebM- und WAV-Dateien,
separate VTT-/SRT-Untertitel, Preview, Contact Sheet, zehn Standframes,
Speaker-, Visual-State- und Evidence-Timeline sowie ein SHA- und
FFprobe-gebundenes Manifest. Der Privacy-Scan findet keine privaten
Referenzpfade in den JSON-Artefakten. Die älteren Pilot-Artefakte im
übergeordneten Ordner wurden nicht überschrieben.

Der Pass ist ausschließlich technische Human-Review-Evidence:
`technicalPilotGate = passed`, `humanPilotAcceptance = pending`,
`humanVoiceMappingAcceptance = pending`,
`humanNews5VisualAcceptance = pending`, `productionEligible = false` und
`autoPublish = false`. Es erfolgten weder Upload, Deployment, Publishing noch
eine Produktionsfreigabe.
