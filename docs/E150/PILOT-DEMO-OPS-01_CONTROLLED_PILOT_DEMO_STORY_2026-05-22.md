# PILOT-DEMO-OPS-01

Stand: 2026-05-22
Issue: #205
Status: done
Typ: Docs-first Slice

## Ziel

Nach `ORG-REGION-ROLLOUT-RC-01` soll kein weiteres Grundarchitektur-Feature in den Vordergrund
gestellt werden. Der naechste ehrliche Schritt ist, den kontrollierten Pilot praktisch
demonstrierbar zu machen.

Dabei gilt weiter:

- Produktziel ist der generische Organisations-/Regionen-Rollout
- Reinickendorf bleibt nur Beispiel-Seed oder moeglicher erster Pilot
- gezeigt werden reale Produktpfade, nicht neue Parallelwelten

Nicht Ziel dieses Slices:

- kein neues Produktmodul
- kein Payment/Checkout
- kein Social Publishing
- kein Auto-Publish
- kein automatisches `public_official`
- keine neue AI-Logik
- keine neue Auth-/Login-Produktwelt
- keine neue Source-/Crawler-Architektur
- keine falsche `production_ready`-Behauptung

## Demo-Grundsatz

- Primaerer Demo-Beweis laeuft ueber bestehende Produktpfade und nicht ueber Demo-Wrapper.
- Jede Demo muss sichtbar machen: review-first, scoped Arbeit, bewusste Sichtbarkeit, Audit-Trail.
- Jede Demo muss offen benennen: sichtbar ist nicht automatisch amtlich, pilotfaehig ist nicht
  automatisch `production_ready`.

## Empfohlene Demo-Folgen

- Public-first: `/` oder `/start` -> `/create` -> `/topic/[slug]` oder `/dossier/[id]` oder `/runden`
- Organisations-first: `/account/organization/dashboard` -> eigener Review-/Publish-Block -> sichtbare Zielroute
- Operator-first: `/admin/regions` -> `/admin/region?regionId=...` -> `/admin/review` -> sichtbare Zielroute

## Demo Entry Points

| Surface | Route / Linktyp | Wofuer in der Demo nutzen | Ehrliche Lesart |
| --- | --- | --- | --- |
| Oeffentliche Einstiege | `/`, `/start` | Produktproblem, Einstieg und oeffentlichen Zugang zeigen | Oeffentlicher Einstieg ist real, aber noch nicht der ganze Pilotbeweis |
| Public Intake | `/create` | Beitrag, Frage, Link oder Arbeitsstand aufnehmen und reviewbar weiterfuehren | Kein Auto-Publish, kein Auto-Official, kein neuer Sonderpfad |
| Organisationsdashboard | `/account/organization/dashboard` | Eigener Scope, Aufgaben, vorbereitete Inhalte, naechste Schritte | Organisationsarbeit ist scoped; globale Betreiberarbeit bleibt getrennt |
| Region-/Admin-Cockpit | `/admin/regions`, `/admin/region?regionId=...` | Regionenueberblick, Startlage, explizite Quellen/Snapshots, Beteiligungssignale | Produktiver Lagebild-/Review-Pfad, aber noch mit Betreiberkante bzw. Freischaltungslogik |
| Review Queue | `/admin/review` | Review-to-Visible-Kette, Vorschau, Sichtbarkeit, Widerruf, Archiv | Zentrale Arbeitsliste, keine Sammelfreigabe, kein Auto-Publish |
| Topic Page | `/topic/[slug]` | Leichte oeffentliche Themenseite als sichtbarer Zielpfad | Oeffentlich sichtbar moeglich, aber nicht automatisch amtlich |
| Dossier Public Surface | `/dossier/[id]` | Strukturierte Vertiefung fuer sichtbare Dossier-Staende | Review-only bleibt ehrlich gesperrt; Share/QR nur auf lesbaren sichtbaren Staenden |
| Anlassraum / Runden / QR-/Share-Pfade | `/runden`, erklaerend auch `/runden/demo`, plus sichtbare Link-/QR-Ziele aus dem Share-Block | Oeffentlichen Gespraechsraum, Teilnahme per Link/QR und Sichtbarkeitsgrenzen zeigen | Link/QR/Share erst nach bewusster Sichtbarkeit; Widerruf/Archivierung nimmt den Pfad wieder zurueck |

Nicht als primaeren Pilotbeweis nutzen:

- `/demo/create`
- `/demo/dossier`
- `/demo/runden`
- andere `/demo/*`-Wrapper

Diese Wrapper bleiben nuetzlich fuer Erklaerung oder Kompatibilitaet, sind aber nicht die
kontrollierte Pilotkernstrecke.

## Rollen-Demo-Stories

### Verwaltung / Kommune

Route-Folge: `/account/organization/dashboard` -> `/admin/region?regionId=...` -> `/admin/review`
-> `/topic/[slug]` oder `/dossier/[id]` oder `/runden`

Zeigbar:

- eigener Organisations- und Regionscope
- kuratierte Startlage, explizite Quelle oder Snapshot
- reviewpflichtige Vorschlaege fuer Dossier, Anlassraum oder Themenseite
- bewusste Sichtbarkeit, oeffentliche URL, QR oder Share erst am Ende

Nicht behaupten:

- automatischer Amtsweg
- automatische amtliche Antwort
- automatische Amtlichkeit

### Verein / Traeger

Route-Folge: `/create` oder `/account/organization/dashboard` -> eigener Review-/Publish-Block
-> `/topic/[slug]` oder `/runden`

Zeigbar:

- derselbe generische Organisationspfad ohne Verwaltungs-Sonderstatus
- reviewpflichtige Vorbereitung eigener Themen, Hinweise und Folgeflaechen
- sichtbare Inhalte koennen geteilt werden, ohne Official-Claim

Nicht behaupten:

- Vereinspfad sei ein amtlicher Kanal
- Inhalte wuerden automatisch als offiziell oder geprueft gelten

### Medienpartner

Route-Folge: `/create` oder explizite URL-/Snapshot-Vorbereitung -> `/admin/review`
-> `/topic/[slug]` oder `/dossier/[id]` -> optional `/runden`

Zeigbar:

- Quellen, Themenstand und oeffentliche Vertiefung koennen review-first vorbereitet werden
- leichte Themenseite oder Dossier koennen als sichtbarer Zielpfad dienen
- QR-/Share-Pfade fuehren in sichtbare bestehende Inhalte, nicht in einen Social-Autopilot

Nicht behaupten:

- vollstaendige automatische Quellenabdeckung
- fertiges Medienprodukt mit Auto-Publishing oder Faktensiegel-Automatismus

### Betreiber / Admin

Route-Folge: `/admin/regions` -> `/admin/region?regionId=...` -> `/admin/review`
-> sichtbare Zielroute -> bei Bedarf Widerruf/Archiv

Zeigbar:

- globale Betreiberperspektive bleibt explizit markiert
- Regionen, Review-Items und Visibility-Schritte laufen auf denselben Pfaden zusammen
- Betreiber kann vorbereiten, sichtbar machen, widerrufen und archivieren, ohne Org-Modus zu verstecken

Nicht behaupten:

- Betreiberkante sei schon ueberfluessig
- breiter Self-Service-Rollout sei bereits abgeschlossen

## Erlaubte Pitch-Aussagen

- "Wir koennen heute einen kontrollierten Pilot auf realen Organisations-, Review- und Public-Routen zeigen."
- "Der Pilot ist review-first: nichts wird automatisch veroefentlicht oder automatisch amtlich."
- "Organisationen arbeiten im eigenen Scope; Betreiber/Admin bleibt ein eigener sichtbar markierter Modus."
- "Aus Quellen, Snapshots oder `/create`-Inputs koennen reviewpflichtige Arbeitsstaende fuer Themenseite, Dossier oder Anlassraum vorbereitet werden."
- "Sichtbarkeit, Public URL, QR und Share entstehen erst nach einem bewussten Schritt."
- "Reinickendorf ist nur Beispiel-Seed oder moeglicher erster Pilot, nicht das Produktziel."
- "Der Produktfokus ist der generische Rollout fuer Verwaltung, Kommune, Verein, Traeger und Medienpartner."
- "Offizielle Freigaben bleiben ein eigener menschlicher Schritt."

## Nicht erlaubte Pitch-Aussagen

- "Das ist bereits self-service `production_ready` fuer jede Kommune."
- "Quellen werden automatisch vollstaendig gecrawlt oder automatisch breit abgedeckt."
- "Inhalte werden automatisch veroeffentlicht."
- "`public_official` wird automatisch gesetzt."
- "Sichtbar bedeutet bereits amtlich oder abschliessend geprueft."
- "Checkout, Billing und automatische Provisionierung sind schon produktiv."
- "Social Publishing ist bereits Teil dieses Pilotpfads."
- "Der Betreiber wird fuer den Pilot nicht mehr gebraucht."

## Konkrete Demo-Checkliste

### Vor der Demo

- Rolle und Demo-Story vorher festlegen: Verwaltung/Kommune, Verein/Traeger, Medienpartner oder Betreiber/Admin
- Echte Hauptstrecke festlegen: Public-first, Organisations-first oder Operator-first
- Nur reale Produktpfade vorbereiten; Demo-Wrapper hoechstens als Erklaerhilfe nutzen
- Mindestens einen vorbereiteten reviewpflichtigen Arbeitsstand oder Source-/Snapshot-Fall bereithalten
- Mindestens ein sichtbares Ziel vorbereiten: `topic_page`, `dossier` oder `anlassraum`
- Pruefen, dass sichtbare Links, Share-Link und QR nur auf sichtbaren Staenden gezeigt werden
- Pitch-Saetze auf erlaubte Aussagen begrenzen
- Offene Restpunkte aktiv mit auf die Demo-Agenda nehmen, statt sie zu ueberspielen

### Waehrend der Demo

- Mit der gewaehlten Rolle starten und den Scope explizit benennen
- Frueh sagen: review-first, kein Auto-Publish, kein automatisches `public_official`
- Vor oeffentlicher Route immer den Review-/Visibility-Schritt zeigen oder benennen
- Sichtbar != amtlich aktiv aussprechen, nicht nur implizit lassen
- Bei `/create` klar sagen, dass der Intake in reviewbare Arbeitsstaende fuehrt
- Bei Organisationsdashboard und Region-Cockpit die Trennung zu globalem Betreiber-Modus erklaeren
- Nur die wirklich vorhandenen Pfade zeigen; keine Zukunftsmodule improvisieren
- QR-/Share-Pfade nur als Folge sichtbarer Inhalte zeigen

### Nach der Demo

- Rueckfragen, Einwaende und Blocker nach Rolle sammeln
- Festhalten, welcher Entry Point am meisten Vertrauen geschaffen oder Verwirrung erzeugt hat
- Falls fuer die Demo Sichtbarkeit bewusst gesetzt wurde, Erhalt vs. Widerruf/Archiv bewusst entscheiden
- Offene Restpunkte in Pilot-/Rollout-Sprache dokumentieren, nicht als versteckte TODOs lassen
- `ProductionReadinessMatrix.md` nur dann anpassen, wenn sich die Reifeaussage wirklich geaendert hat

## Offene Pilot-Restpunkte

- externe Membership-/Directory-/Register-Aufloesung jenseits des lokalen Runtime-Stores
- Self-Provisioning fuer Organisation, Wirkraum und Freischaltung
- Billing, Checkout und automatische Provisionierung
- breitere produktive Quellenabdeckung ueber explizit verbundene URLs und Snapshots hinaus
- spaetere Social-Publishing-Pfade, falls separat priorisiert
- `public_official` bleibt separater menschlicher Official-Release-Pfad
- Pilot ist noch kein Null-Vorbereitungs-Self-Service; Demo und Pilot brauchen weiter bewusste Vorbereitung
- Betreiberkante bleibt fuer den kontrollierten Pilot sichtbar und ehrlich benannt

## Dokumentationswirkung

- `OpenTasks.md` wird fuer diesen Docs-Slice fortgeschrieben.
- `ProductionReadinessMatrix.md` bleibt unveraendert, weil dieser Slice keine neue Reifestufe
  einfuehrt, sondern die Demo-Operations fuer den bereits dokumentierten kontrollierten Pilot
  konkretisiert.

## Validierung

Docs-only-Slice. Keine Runtime-Tests ausgefuehrt, da keine Code- oder Runtime-Aenderung erfolgt ist.
