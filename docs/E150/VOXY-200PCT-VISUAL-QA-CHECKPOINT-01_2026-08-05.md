# VOXY-200PCT-VISUAL-QA-CHECKPOINT-01

Stand: 2026-08-05

## Ergebnis

Der Voxy-Reviewpfad erhält einen reproduzierbaren 200-%-Kontrollvertrag für `16:9`, `9:16` und `1:1`. Der automatische Teil erzeugt revisionsgebundene Evidence; er ersetzt die menschliche Sichtabnahme ausdrücklich nicht.

## Geprüfte Ausschnitte

- Gesicht und Augen
- linke und rechte Hand
- VOG-Pin
- eDebatte-Pocket-Mark
- Logo-Zone
- Mikrofonkante
- Waveform
- Lower Third
- Untertitel-Safe-Zone

## Automatische Gates

- genau ein Snapshot je Ausgabeformat
- exakt 200 % Zoom
- kanonische `/brands/voxy/`-Assetpfade
- Assetversion und Commit-SHA als Provenienz
- definierter Schärfeschwellwert
- keine Halos
- kein Cropping
- kein Typografieüberlauf
- exakt fünf Finger je sichtbarer Handpose
- Waveform hinter Voxy und ohne Logoüberlagerung
- identische Assetrevision erzeugt identischen Evidence-Key

## Menschliches Gate

`approved`, `needs_changes` und `rejected` sind revisionsgebunden. Production Eligibility entsteht ausschließlich bei gleichzeitig grünem automatischem Ergebnis und dokumentiertem `approved` mit Reviewer und Zeitstempel.

## Grenzen

- kein Auto-Approve
- keine stillen Toleranzanhebungen
- keine Rechte-, Marken- oder Produktfreigabe durch den Snapshot
- kein Upload oder Publishing

## Tests

`apps/web/tests/voxy-visual-qa-checkpoint.contract.test.ts` deckt alle drei Formate, deterministische Evidence, Fingerfehler, Blur/Halo/Crop, Typografieüberlauf, Waveform-Logo-Kollision und das getrennte Human-Gate ab.
