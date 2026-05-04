# HOME-LANDING-02

## Problem
Die Landing war bereits visuell in der richtigen Richtung, wirkte aber für Erstnutzerinnen und Erstnutzer noch zu technisch und zu dashboardartig. Der Unterschied zu Feed-Logik, reinen Ja/Nein-Mustern und klassischen Beteiligungskanälen war zu wenig menschlich erklärt.

## Ziel
Die öffentliche Startseite soll klar und verständlich zeigen:
- die Sache steht im Mittelpunkt, nicht der Adressat
- Swipe ist schneller Einstieg, aber nicht das Ende
- aus Reaktionen können Anlassraum, Faktencheck und Dossier entstehen
- Mitmachen ist kostenlos
- neue Hauptthemen starten aktive Mitglieder
- eDebatte ist keine Partei, kein Social-Media-Feed und keine Paywall-Beteiligung

## Produktentscheidung
Kein Layout-Neubau und keine neue Backend-Logik. Bestehende Landing-Struktur bleibt dark-first und hochwertig, wird aber in Reihenfolge, Sprache und Microcopy konsequent menschlicher geschärft.

## Geänderte Dateien
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/landing-information-architecture.contract.test.tsx`
- `apps/web/tests/start-shared-create-composer.contract.test.tsx`
- `docs/E150/OpenTasks.md`

## UX-Blöcke
Umgesetzte Reihenfolge auf `/start`:
1. Hero mit menschlichem Claim + CTAs (`Thema prüfen`, `Anliegen einbringen`, `Beispiel ansehen`)
2. Trust-Pills (`Kostenlos mitmachen`, `Keine Datenverkäufe`, `Keine Paywall für Beteiligung`, `Themen statt Empörung`)
3. Debattenradar (`Hier zeigt sich, wo es gerade drückt.`)
4. `Nicht noch ein Feed. Nicht nur Ja oder Nein.`
5. Swipe-Vorschau inkl. Optionen und Folgepfad (`Anlassraum`, `Faktencheck`, `Dossier`)
6. Anlassraum-Erklärung
7. Faktencheck-Erklärung
8. Dossier-Block inkl. lokaler Produktvorschau-Bilder aus `apps/web/public/edebatte_startpage/*`
9. Blickpunkte/Perspektiven
10. Kostenlos mitmachen + aktive Mitglieder starten Hauptthemen
11. Professionelle Nutzung
12. Vertrauen & Abgrenzung (Social Media / Zeitung / Partei / Bürgerbüro) inkl. 24/7-Anliegenlogik
13. VoiceOpenGov-Hinweis

## Tests
- Landing-Contracts aktualisiert für die neue Narrative und CTA-Links.
- Fokus: keine zentrale Create-Maske auf Home, klare öffentliche Journey, klare Abgrenzung, VoiceOpenGov-Trennung.

## Offene Folgepunkte
- Optionaler EN-Textpfad für die neue Landing-Narrative ist nicht Teil dieses Slices.
- Keine Änderungen an Pricing-/Create-Backend-Logik in diesem Slice.
