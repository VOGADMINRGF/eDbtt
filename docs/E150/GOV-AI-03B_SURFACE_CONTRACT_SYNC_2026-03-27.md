# GOV-AI-03B Surface Contract Sync (2026-03-27)

Ziel: Anlassraum als Arbeits-/Kontextraum in Surface-Dokumentation konsistent halten, ohne Dossier oder Swipes zu verdraengen.

## Verbindlicher Ist-Contract

- `Anlassraum` bleibt Domaenenbegriff.
- `/runden` bleibt die oeffentliche Anlassraum-Surface.
- `/anlassraum` bleibt offizieller Alias-/Zielbegriff (non-breaking Wrapper auf `/runden`).
- `/swipes` bleibt Beteiligungsmodus (kein Ersatz fuer Anlassraum-Kontext).
- `/dossier/<id>` bleibt strukturierte Verdichtung (kein Ersatz fuer Anlassraum-Kontext).

## Synchronisierte Doku-Fundstellen

- `docs/E150/Part16.md`
- `docs/E150/Part16_Anlassraum_Model.md`
- `docs/E150/Part16_AI_Orchestration_and_Safety.md`
- `docs/E150/Part05_Orchestrator_E150_Core.md`
- `docs/surface-architecture.md`

## Nicht-Ziele

- keine harte Migration von `/runden`
- keine neue Route- oder Produktlogik
- keine Umdeutung von Dossier oder Swipes als Oberdomaene
