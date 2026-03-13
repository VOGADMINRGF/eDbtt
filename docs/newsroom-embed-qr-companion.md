# Newsroom Embed / QR / Companion Flow

> Aktuelle Fassung: `docs/newsroom-embed-and-qr.md`

## Ziel
Journalistische Publikationen können auf eDebatte verweisen, ohne eine geschlossene Medienseite
zu erzeugen. QR und Embed führen immer in den offenen Dossierraum.

## Regel
- Einstieg über Medienbeitrag = Anlassgeber.
- Ziel immer offen:
  - `/dossier/[id]`
  - `/newsroom/companion/[id]`
  - `/embed/dossier/[id]`
- Keine proprietäre Wahrheitszone.

## Implementierung
- `features/newsroom/companion.ts`
  - `buildOpenDossierPath`
  - `buildNewsroomCompanionPath`
  - `buildDossierEmbedPath`
- API:
  - `GET /api/newsroom/companion-link`
- Seiten:
  - `/newsroom/companion/[dossierId]`
  - `/embed/dossier/[dossierId]` (Open Companion Hinweis)
  - `/qr/[qrId]` unterstützt `dossier` und `newsroom_companion`

## Produktwirkung
Der publizistische Einstieg bleibt sichtbar, aber Deutungshoheit entsteht nicht:
Gegenquellen, Factcheck und Beteiligung bleiben direkt im offenen Dossier möglich.
