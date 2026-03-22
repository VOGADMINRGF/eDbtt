# Content Translation Lifecycle (Messages + Contributions)

Stand: 2026-03-22

## Localized Content Contract

Fuer lokalisierbare Inhalte (Nachrichten, Community-/Anlassraum-Beitraege) gilt:

- `originalLanguage`: Sprache des Originals (wenn verlässlich bekannt, sonst `null`)
- `originalText`: unveraenderter Originaltext
- `translations[locale]`: optionale Uebersetzung pro Locale
- `translationStatus`: `missing | pending | translated | failed`
- `translatedAt`: Zeitstempel bei erfolgreicher Uebersetzung
- `translationProvider` / `translationModel`: optionaler Produktionskontext

Altbestaende ohne diese Felder bleiben lesbar und werden bei Bedarf konservativ normalisiert.

## Rendering Rule

- Wenn `preferredLocale != originalLanguage` und `translations[preferredLocale]` vorhanden:
  - Uebersetzung wird zuerst angezeigt.
  - Original bleibt per Disclosure sichtbar.
- Wenn keine passende Uebersetzung vorhanden:
  - Original wird angezeigt.
  - Missing-Translation-Zustand wird transparent angezeigt.

## Lifecycle Rule

- `missing`: mindestens eine relevante Zielsprache fehlt
- `pending`: Uebersetzung wurde angefordert/lauft
- `translated`: fuer den relevanten Zielsatz sind Uebersetzungen vorhanden
- `failed`: ein Uebersetzungsversuch ist fehlgeschlagen

## Non-Destructive Rule

- `originalText` wird nie durch Uebersetzungen ersetzt.
- Bestehende Uebersetzungen werden nicht still ueberschrieben.
- Es werden nur fehlende Zielsprachen produziert.
- Ohne stabilen Provider/Key bleibt der Status transparent (`missing`), es gibt keine Fake-Uebersetzung.
