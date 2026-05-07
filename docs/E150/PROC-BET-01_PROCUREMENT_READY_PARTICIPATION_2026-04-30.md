# PROC-BET-01 Procurement-ready participation surface

Datum: 2026-04-30
Status: implemented in branch `proc-bet-01`

## Anlass

Im Chat wurden mehrere noch nicht ausgereifte Produktfaeden fuer eDebatte angesprochen:

- Buergerbeteiligung und Onlinebeteiligung als realer Vergabemarkt
- Lose und Leistungsbeschreibungen als Produktlogik statt nur Marketingtext
- eDebatte als vergabefaehige Infrastruktur fuer Kommunen, Verwaltungen, Medien und Beteiligungsdienstleister
- Partnerlogik fuer Moderations- und Beteiligungsbueros
- Studio-Ausspielung fuer Beteiligungskampagnen mit Master-Post, Kanalwahl, Review, Planung und echter Admin-Freigabe
- Procurement-Lead-Board als spaeterer Admin-Bereich

## Umgesetzt

### Shared Contract

`features/procurement/participationPackages.ts`

- `participationPackages` mit Check, Dossier, Runde, Mandat, Studio, Onlinebeteiligung, Akutlage und Zukunftsprozess
- `tenderLotMappings` fuer sechs typische Lose: lokale, regionale, rechtliche, Zukunfts-, akute und Onlinebeteiligungs-Vorhaben
- `procurementFollowupTasks` als explizite Folge-Queue fuer noch nicht final implementierte Chat-Ideen
- `getPackagesForTenderLot` fuer spaetere Wiederverwendung in Pricing, Admin und Studio

### Neue Produktseiten

- `/leistungen/buergerbeteiligung`
  - positioniert eDebatte als vergabefaehige Buergerbeteiligungsinfrastruktur
  - zeigt Prozess vom Anlass zum Mandat
  - spiegelt Lose in eDebatte-Angebote
  - formuliert ein Muster-Leistungsbild

- `/leistungen/partner`
  - positioniert eDebatte als Infrastruktur fuer Beteiligungsbueros statt als Konkurrenz zur Moderation
  - trennt Rollen: Partner moderiert, eDebatte liefert Dossier, Runde, Auswertung und Mandat
  - fuehrt die offenen Folge-Slices sichtbar weiter

### Tests

- `apps/web/tests/procurement-participation-packages.contract.test.ts`
- `apps/web/tests/procurement-participation-pages.contract.test.ts`

## Mindestens in OpenTasks aufzunehmende Folge-Slices

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PROC-BET-02 | codex_ready | high | PROC-BET-01 | Muster-Leistungsbeschreibung Buergerbeteiligung | Vergabebausteine fuer digitale und hybride Buergerbeteiligung mit Dossier, Runde, Mandat und Studio als Web/PDF-faehigen Text liefern | Leistungsgegenstand, Mindestanforderungen, optionale Module, Zuschlagskriterien, Datenschutz, Barrierefreiheit, Export und Gremienfaehigkeit sind formuliert; keine Rechtsberatung; CTA auf Leistungsseiten | no |
| PROC-BET-03 | codex_ready | medium | PROC-BET-01 | Admin Procurement Lead Board | Ausschreibungen, Lose, Volumen, Fristen, Passung und Partnerbedarf erfassen | Demo-/Seed-Liste sichtbar; Felder fuer Titel, Auftraggeber, Volumen, Lose, Frist, Relevanz, eDebatte-Passung, Status; keine automatische Bewerbung | no |
| PROC-BET-04 | codex_ready | high | PROC-BET-01 | Studio-Ausspielung fuer Beteiligungskampagnen | Master-Post, Kanalwahl, Verbindungen, Entwurf, Review, Planung und Echtzeit-Freigabe als Beteiligungskampagnenmodus vorbereiten | Kanalliste, Status je Kanal, Review-Grenze, Planungsstatus; echte Veroeffentlichung bleibt explizite Admin-Entscheidung | no |
| PROC-BET-05 | codex_ready | medium | PROC-BET-01 | Partner-/White-Label-Modus fuer Beteiligungsbueros | Gemeinsame Angebote fuer Moderationsbueros, Agenturen und Planungsbueros anschlussfaehig machen | Partnerseite zeigt Rollenmodell, Outputs, Angebotsbausteine, Grenzen; Pricing/Institutionen kann darauf verlinken | no |

## Nicht in diesem Slice umgesetzt

- keine echte Ausschreibungsdatenbank
- keine PDF-Generierung
- keine automatische Ausschreibungssuche
- keine Studio-Publishing-Integration
- keine juristisch belastbare Vergabeberatung

## Qualitaetsgrenze

Der Slice ist ein Produkt- und Contract-Slice. Er macht die im Chat angerissenen Punkte sichtbar, testbar und anschlussfaehig, ersetzt aber nicht die Folgeumsetzung fuer Procurement-Admin, Muster-Leistungsbeschreibung und Studio-Ausspielung.
