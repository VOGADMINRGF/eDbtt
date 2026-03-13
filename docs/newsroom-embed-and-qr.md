# Newsroom Embed & QR (Open Dossier Companion)

## Ziel
Redaktionen können Artikel, Print, Video, Podcast und Talkshow mit eDebatte verknüpfen, ohne
eine proprietäre Medien-Mikroseite zu erzeugen.

## Grundregel
- Journalistischer Beitrag = Anlassgeber.
- Das Dossier bleibt offen für Gegenquellen, Factcheck, Widerspruch und Beteiligung.
- QR, Short-Link und Embed zeigen immer auf den offenen Dossierraum.

## Bausteine
- `features/embed/newsroomStudio.ts`
  - CTA-Presets
  - Formattypen (`article`, `print`, `video`, `podcast`, `talkshow`)
  - Bundle für `dossierPath`, `companionPath`, `embedPath`, `shortPath`
- `apps/web/src/app/qr-studio/newsroom/page.tsx`
  - Newsroom Embed/QR Studio (Short URL, QR-Code, Embed-Link, Companion-Link, Begleittext)
- `apps/web/src/app/api/newsroom/companion-link/route.ts`
  - Liefert ein konsistentes Companion-Bundle für Tools/Integrationen
- `apps/web/src/app/newsroom/companion/[dossierId]/page.tsx`
  - Öffentlicher Begleitraum mit Anlass, Factcheck-Stand, Quellenlage und offener Beteiligung
- `apps/web/src/app/embed/dossier/[dossierId]/page.tsx`
  - Embeddable Sicht auf den offenen Dossierraum mit Anlass-/Prüfkontext
- `apps/web/src/app/n/[dossierId]/page.tsx`
  - Short-Link-Weiterleitung in den offenen Companion-Zielraum

## CTA-Presets
- Quellenlage & Beteiligung zum Beitrag
- Zum offenen Dossier
- Faktencheck, Einwände und Optionen
- Thema öffentlich prüfen und ergänzen

## Companion-Block (optional im Beitrag)
- Im Artikel angesprochen
- Im Dossier zusätzlich vorhanden
- Noch offen
- Widerspruch vorhanden

## Akzeptanz-Check
- QR- und Embed-Link lassen sich erzeugen.
- Einstieg funktioniert für Print, Video, Podcast, Talkshow und Artikel.
- Ziel bleibt immer ein offener Dossierraum.
- UI kommuniziert klar: Anlass ≠ Wahrheit.
