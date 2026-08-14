# VOXY-VISUAL-DETECTOR-LICENSE-CONTRACT-01

Stand: 2026-08-14

## Ziel

Die aktuell in PR #588 noch hartkodierte Hand-/Finger-Evidence durch eine lokale, bildbasierte und lizenzsaubere Detection ersetzen, ohne den bestehenden fail-closed Visual-QA- und Human-Review-Vertrag zu verändern.

## Betreiberentscheidung

- Standardpfad: lokal / self-hosted / kein externer Detection-Service.
- Bevorzugter Kandidat: MediaPipe Tasks Hand Landmarker.
- Framework-/Sample-Code ist Apache-2.0-lizenziert.
- Das konkret verwendete Modellbundle bzw. dessen Weights werden separat geprüft und dürfen erst nach dokumentierter Lizenzfreigabe eingebunden werden.
- Keine implizite Annahme, dass eine Framework-Lizenz automatisch für Modellgewichte gilt.
- Kein Detector darf Production selbst freigeben; Detector-Ergebnisse sind ausschließlich Evidence für #588.

## Lizenz-Gate

Ein Detector darf nur `license_approved` werden, wenn alle vier Dimensionen dokumentiert grün sind:

1. Code-Lizenz: permissiv und kompatibel (MIT / Apache-2.0 / BSD oder explizit freigegeben).
2. Modell-/Weights-Lizenz: kommerzielle/produktive Nutzung zulässig und nachvollziehbar dokumentiert.
3. Transitive Dependencies: keine inkompatiblen oder ungeklärten Lizenzbedingungen im tatsächlich ausgelieferten Pfad.
4. Attribution/Notices: notwendige Copyright-, LICENSE-, NOTICE- und Third-Party-Hinweise vollständig mitgeführt.

Fehlt eine dieser Dimensionen, lautet der Status `license_review_required` und der Detector darf nicht als Production-Evidence-Quelle dienen.

## Technischer Zielpfad

`Voxy-Render -> lokaler HandDetector -> Landmarks/Confidence -> Finger-/Visibility-Evidence -> bestehender #588 Validator -> Human Visual Acceptance`

Der Detector soll mindestens liefern:

- linke/rechte Hand erkannt oder nicht erkannt,
- Landmark-Anzahl und Mindestvertrauen,
- nachvollziehbare Handedness,
- daraus deterministisch abgeleitete Fingerzahl bzw. `null`, wenn keine belastbare Bestimmung möglich ist,
- Detektor-/Modellversion und Modell-Hash für revisionsgebundene Evidence.

## P0-Umfang

- die derzeit fest eingetragenen `leftFingerCount: 5` / `rightFingerCount: 5` im Capture-Pfad entfernen;
- einen kleinen `VoxyVisualDetector`-/`VoxyHandDetector`-Adapter einführen;
- lokale Inferenz gegen die bereits erzeugten Hand-Crops aus #588;
- echte positive Fixture mit fünf plausiblen Fingern je sichtbarer Hand;
- echte negative Fixtures: fehlende Hand, unzureichende Confidence sowie mindestens eine bildbasierte ungültige Anatomie-/Finger-Evidence;
- bestehender Validator bleibt fail-closed;
- Human Review bleibt zwingend und kann nicht durch Detector-Grün ersetzt werden;
- Exact-Head-Bindung und Evidence-Hashes bleiben erhalten.

## Nicht Ziel dieses Slices

- kein Face-/Eye-Großsystem;
- kein generatives Hand-Reparieren;
- kein Auto-Approve;
- kein Publishing;
- kein externer Provider;
- kein Zwang, #589 oder das lokale Stretchy-kompatible Rig auf diesen Detector warten zu lassen.

## Verhältnis zu #589

#589 erzeugt die lokale animierbare Voxy-Identität. Dieser Vertrag liegt bewusst in #588 und prüft anschließend das gerenderte Ergebnis. Der Detector ist damit QA-Evidence und kein Motion- oder Rig-Blocker.

## Akzeptanzkriterien

- keine hartkodierten 5/5-Fingerwerte mehr im Production-Evidence-Capture;
- Detector läuft lokal und reproduzierbar;
- Lizenzmatrix vollständig und `license_approved`;
- Modell-/Runtime-Versionen und Hashes in der Evidence;
- mindestens ein realer negativer Bildfall wird vom Detector/Validator fail-closed erkannt;
- bestehende 16:9-, 9:16- und 1:1-Evidence bleibt revisionsgebunden;
- Human Visual Acceptance bleibt `pending`, bis ein Mensch entscheidet.

## Aktueller Kandidatenstatus

MediaPipe Tasks Hand Landmarker: `preferred_candidate / license_review_required`.

Begründung: lokale Hand-Landmark-Erkennung mit 21 Hand-Landmarks ist für den P0 passend; Framework/Samples sind Apache-2.0. Vor tatsächlicher Modellintegration muss die Lizenz des konkret gepinnten Modellbundles/Weights separat als Repository-Evidence erfasst werden.
