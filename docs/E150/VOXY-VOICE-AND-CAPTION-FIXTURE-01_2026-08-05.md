# VOXY-VOICE-AND-CAPTION-FIXTURE-01

Stand: 2026-08-05

## Ergebnis

Der bestehende Character-Motion-Fixture erhält einen providerneutralen Audio- und Untertitelvertrag. WebVTT, SRT und die interne Caption-Timeline werden aus denselben Segmenten erzeugt. Lippen-, Viseme- oder Phonemsteuerung bleibt ausdrücklich deaktiviert.

## Implementierter Vertrag

- lokale Audiodatei oder explizit freigegebenes Provider-Ergebnis
- technische Audio-Metadaten mit Dauer, Lautheit, True Peak, Sample Rate und Kanälen
- stabile Caption-Segment-IDs mit Start, Ende und referenzierter Fixture-Szene
- identische Segment-IDs und Zeitwerte in WebVTT und SRT
- formatabhängige Safe Areas für `16:9`, `9:16` und `1:1`
- Aussprachewörterbuch für eDebatte, VoiceOpenGov, Vote4Gov und Voxy
- getrennte Original- und Ausgabesprache
- Übersetzung bleibt reviewpflichtig
- expliziter Reviewstatus mit Reviewer und Zeitstempel

## Fail-closed-Gates

- leere oder ungültige Audioquelle
- fehlende Nutzungsfreigabe bei Provider-Audio
- Audio außerhalb des technischen Reviewbereichs
- Timeline-Lücke oder -Überlappung
- leere oder überlange Untertitel
- Dauerabweichung zwischen Audio und Caption-Timeline
- nicht reviewte Übersetzung
- Lip-Sync oder Viseme-Generierung

## Grenzen

- keine Browser-Mikrofonpflicht
- kein HeyGen- oder Talking-Head-Zwang
- keine Stimmimitation realer Personen
- kein Render-Erfolg ohne menschliche Freigabe
- kein Upload, Scheduling oder Publishing

## Tests

`apps/web/tests/voxy-voice-caption-fixture.contract.test.ts` deckt gemeinsame Timeline, VTT/SRT-Konsistenz, Safe Areas, Zeitformatierung, Audiofehler, Providerfreigabe und Übersetzungsreview ab.
