# VOXY-HOMEPAGE-REFERENCE-FILMS-01 · Implementation Evidence

Stand: 2026-08-18

Status: `review`

## Ergebnis

Der autorisierte Slice erzeugt zwei getrennte private 16:9-Referenzfilme auf
dem akzeptierten NEWS-5.0-Canon:

1. eDebatte: **„Prüfen statt glauben.“**
2. VoiceOpenGov: **„Deine Stimme endet nicht am Wahltag.“**

Die Filme teilen Character, Studio, Mouth v4.1, VOG-Pin, genau eine
eDebatte-Pocket-Marke, genau eine Waveform, Evidence Memory und die visuelle
Grammatik. Zielgruppe, Problem, Story, Evidence, Nutzenargumentation und CTA
sind getrennt modelliert. Es erfolgte keine Homepage-Integration, kein Upload,
kein Deployment und kein Publishing.

## Autorisierung und revisionsgebundener Render

- erfolgreicher task-spezifischer Preflight auf dem kanonischen Main-Checkout:
  `status = codex_ready`, `executable = true`,
  `branchCreationAllowed = true`;
- Implementierungsbranch: `pr/voxy-homepage-reference-films-01`;
- revisionsgebundener Renderer-Head:
  `10530072fd516b2057cf6c6d772ab8f2430cce0c`;
- private Artefakte liegen außerhalb des Repositories;
- private Voice-Referenzpfade werden weder im Repository noch in den
  Artefakt-Manifesten gespeichert.

## Current Offer Inventory

| Eintrag | Klassifikation | Verwendung |
| --- | --- | --- |
| öffentliche eDebatte-Themen, Statements und Kontexte | `current_capability` | Film A und B |
| Beitrag zur Prüfung und freigegebene Beteiligungswege | `current_capability` | Film A |
| kostenfreie VoiceOpenGov-Eintragung mit Double-Opt-in | `current_capability` | Film B |
| freiwillige Unterstützung ohne Stimmvorteil | `current_capability` | Film B |
| Quellen, Gegenpositionen und offene Fragen sichtbar halten | `editorial_principle` | redaktionelle Grammatik, nicht als Feature beworben |
| allgemeines kontinuierliches digitales Mandat | `future_intent` | nicht beworben und nicht behauptet |

Der Contract lässt nur belegte `current_capability`-Einträge als vermarktbare
Angebote zu. `editorial_principle` und `future_intent` bleiben fail-closed.

## Quellen- und Wahl-Layer

Die Source Manifeste wurden am 18. August 2026 gegen die aktuellen
Produktoberflächen und amtlichen Wahlquellen geprüft:

- eDebatte Homepage und Statements;
- VoiceOpenGov Homepage;
- Wahlterminkalender der Bundeswahlleiterin;
- Fragen und Antworten der Landeswahlleiterin für Berlin zu den Berliner
  Wahlen 2026.

Der `election_window`-Render verwendet die amtlich bestätigten Termine im
September 2026. Die Berliner Aussage zum Wahlalter 16 ist an die amtliche
Berliner Quelle gebunden. Der `evergreen`-Plan entfernt die drei
wahlfensterspezifischen Sprachsegmente; der Contract belegt beide Modi.

## Voice Preservation

- aktive Stimme: ausschließlich D1 Conversational Dynamic;
- W1: akzeptiert, geparkt und nicht hörbar;
- kein Fallback;
- kein Loudnorm und keine dynamische Normalisierung;
- kein Compressor, Limiter, EQ, Pitching, Time-Stretch oder Reverb;
- technisch erforderliches Resampling auf 48 kHz Mono/PCM;
- Segment-Gain ausschließlich gemäß bestehendem transparentem
  Preservation-Contract und Peak-Headroom;
- jedes fertiggestellte D1-Segment ist im Master-Assembly-Fenster PCM-identisch;
- `productionEligible = false` und `autoPublish = false`.

## Private Render-Evidence

| Film | Dauer | Frames | Audio | Quellen | Evidence-Schritte | Motion-Ereignisse |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| eDebatte | 60,850 s | 1.461 | AAC, 48 kHz, mono | 4 | 7 | 23 |
| VoiceOpenGov | 68,750 s | 1.650 | AAC, 48 kHz, mono | 5 | 7 | 25 |

Beide MP4-Dateien sind 1920×1080 bei 24 fps. Jedes private Paket enthält
außerdem Master-Audio, Preview, Contact Sheet, VTT, SRT, Source Manifest,
Evidence-, Motion-, Lower-Third-, Speaker- und Visual-State-Timeline,
Audio-Preservation-Report und Manifest.

Die Contact Sheets und repräsentativen Standbilder wurden visuell geprüft:

- kein eingebrannter Sprachtext;
- stabile Safe-Zones und lesbare semantische Lower Thirds;
- Voxy/Studio und Marken-Overlays unverändert;
- Evidence Memory oben rechts;
- zwei sichtbare FOCUS→EXPLAIN→DOCK-Zyklen;
- SYNTHESIS führt dieselben Evidence-Objekte zusammen;
- Motion-Ereignisse liegen in den ersten zwölf Sekunden höchstens 2,5 Sekunden,
  danach höchstens 3,5 Sekunden auseinander;
- keine blinkenden Texte, Wort-für-Wort-Captions oder bedeutungslosen
  Schnittintervalle.

## Automatisierte Evidence

- Homepage-Film-Contracts: 20/20 grün;
- Voxy-Pilot-Regression: 19/19 grün;
- Typecheck: grün;
- vollständiger Repo-Lint: grün;
- `git diff --check`: grün;
- FFprobe: grün;
- D1-/PCM-/Audio-Preservation: grün;
- Source-/Evidence-/Motion-Integrity: grün;
- Privacy Scan: grün;
- private Medien in Git: keine.

Der lokale Produktions-Build kompiliert erfolgreich und passiert seinen
Typecheck. Die anschließende Page-Data-Collection stoppt im secret-freien
Worktree fail-closed an den fehlenden kanonischen JWT-/Datenbank-Pflicht-ENV.
Es wurden weder Ersatzwerte erfunden noch lokale ENV-Dateien gelesen oder
verändert. Der Build wird deshalb lokal nicht als vollständig grün gewertet;
der Draft-PR-CI-Lauf muss ihn in der vorgesehenen CI-Umgebung erneut prüfen.

## Verbleibendes Gate

`humanHomepageFilmAcceptance = pending`

`humanNews5VisualAcceptance = pending` bezieht sich nur auf die beiden neuen
Homepage-Reference-Filme; die v1.4-Pilot-Abnahme bleibt akzeptiert.

Der technische Endstatus dieses Slices ist `review`. Eine spätere
Homepage-Integration benötigt eine ausdrückliche menschliche Abnahme und einen
separaten autorisierten Task.
