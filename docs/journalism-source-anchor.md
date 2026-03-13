# Journalism Source Anchor (Open Dossier)

## Ziel
Publizistische Beiträge (Artikel, Print, Video, Podcast, Talkshow, Social Post) können ein Dossier
auf eDebatte **auslösen**, aber nicht besitzen.

Der Source Anchor ist damit:
- Anlassgeber
- Erstframing
- öffentliche Referenz

Der Source Anchor ist **nicht**:
- exklusive Wahrheit
- proprietäre Medien-Mikroseite
- Deutungshoheit über das Dossier

## Datenmodell
`sourceAnchor` ist optional auf dem Dossier (`features/dossier/schemas.ts`):

- `id`
- `type` (`article|print|video|podcast|talkshow|social_post`)
- `title`
- `medium`
- `format?`
- `url?`
- `reference?` (für Print/TV/ohne URL)
- `publishedAt?`
- `triggerClaim` (journalistische Anlassbeschreibung)
- `publicPath` (QR-/Embed-fähiger Pfad in den offenen Dossierraum)

Regel: Es muss mindestens `url` **oder** `reference` gesetzt sein.

## Öffentliche Zielpfade
Standard:
- `/dossier/[id]?anchor=[anchorId]`

QR-/Embed-Logik zeigt immer auf den offenen Dossierraum, nie auf eine geschlossene Medienansicht.

## UI-Regel
Im Dossier wird ein Block **„Ausgelöst durch“** gezeigt:
- Medium/Format/Datum
- Originalbeitrag (falls URL vorhanden)
- Anlassbeschreibung (`triggerClaim`)
- Hinweis auf offenen Dossierraum (`publicPath`)
- expliziter Guardrail-Text: Anlass, keine Deutungshoheit; Gegenquellen/Factcheck/Widerspruch können relativieren.

## Truth-Governance
Source Anchor bleibt ein Einstiegspunkt. Wahrheitsarbeit erfolgt im Dossier durch:
- Gegenquellen
- Factcheck
- Einspruch/Korrekturen
- offene Fragen und Delegation
