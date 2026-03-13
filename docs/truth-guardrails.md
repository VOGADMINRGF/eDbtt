# Truth Guardrails

## Zweck
Wenn journalistisches Erstframing, Quellenlage und Factcheck auseinanderlaufen, muss eDebatte
sichtbar intervenieren.

## Kernregeln
- Journalistischer Einstieg bleibt Anlass, nicht Wahrheit.
- Gegenquellen dürfen nicht verborgen sein.
- Factcheck darf das Erstframing relativieren/überstimmen.
- Widerspruch wird als eigener sichtbarer Zustand geführt.

## Sichtbare Ebenen
- `TruthStatusPanel` (Header-nah): Prioritäts-Badges + Trennung der Aussagearten
  - Tatsache
  - Interpretation
  - Bewertung
  - offene Behauptung
- `SourceDivergencePanel`: 
  - Abweichende Quellenlage
  - Korrekturen & Widerspruch
  - Offene Gegenbelege

## Badge-Priorität
- `kritisch`
- `in Prüfung`
- `bestätigt`
- `widersprüchlich`
- `korrigiert`

## Datenbasis
- `truthGuardrails` auf `Dossier`
  - `framingStatus`
  - `sourceDivergence`
  - `factcheckIntervention`
- Ableitung aus Findings + Corrections möglich (`resolveTruthGuardrails`).

## Demo-Anforderung
Die Demo muss mindestens zwei Konfliktfälle zeigen:
- widersprechende Evidenz in Findings
- offener Einspruch/Korrekturpfad

