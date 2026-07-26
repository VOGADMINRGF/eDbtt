# VOG-MISSION-LAYER-01 Decisions
## Menschlich bestätigte Entscheidungsclosure 2026-07-26

Metadaten:
- Datum: 2026-07-26
- Zugehöriger Epic: `VOG-MISSION-LAYER-01`
- Typ: docs-only Decision-Closure
- Operativer Status: manual_gate
- Implementierung freigegeben: nein

## Scope dieses Closure-Slices

Dieser Slice dokumentiert ausschließlich bereits menschlich bestätigte
Produktentscheidungen zu Mission, Mitgliedschaft, institutioneller
Abgrenzung, Pricing-Grundsätzen, Abstimmungsarten, Partnern, Transparenz,
Repräsentation, Voxy, Domains, Mehrsprachigkeit und Datenschutz.

Nicht enthalten:
- keine Produktimplementierung
- keine Runtime-, API-, Datenbank- oder Rollenänderung
- keine Freigabe neuer `codex_ready`-Folgetasks
- keine endgültige VOG-spezifische Quorumformel

## Vorab verifizierte Repo-Grundlagen

Vor Erstellung dieses Closure-Dokuments wurden folgende Grundlagen gegen den
aktuellen Repo-Stand geprüft:

- Keine kollidierende offene PR mit erkennbarem
  VoiceOpenGov-Mission-/Membership-/Decision-Closure-Scope.
  Offene PRs am 2026-07-26: `#429`, `#421`.
- `docs/E150/Part01_Systemvision_Mission_Governance.md` hält die Trennung
  fest: VoiceOpenGov bleibt Initiative-/Register-/Mitgliedschaftsebene,
  eDebatte bleibt Arbeits- und Beteiligungsfläche.
- `docs/E150/membership_pricing.md` trennt Membership, Produktpakete,
  Funding und Freischaltung bereits ausdrücklich.
- `apps/web/src/app/faq/faqContent.ts`,
  `apps/web/src/app/howtoworks/bewegung/page.tsx`,
  `apps/web/src/app/transparenzbericht/strings.ts` und
  `apps/web/src/app/satzung/page.tsx` verankern bereits den Grundsatz
  „eine Person, eine Stimme“.
- `features/contribution/types/VotingRule.ts` und
  `apps/web/src/models/core/VotingRule.ts` enthalten bereits die generischen
  Typen:
  - `simple-majority`
  - `absolute-majority`
  - `two-thirds`
  - `unanimity`
  - `weighted`
  - `payroll-weighted`
  - `custom`
  - `minQuorum`
- `apps/web/src/app/api/votes/summary/route.ts` enthält bereits
  Ergebnislogik für:
  - Mindestquorum (`minQuorum`)
  - einfache Mehrheit
  - 2/3-Mehrheit
- `docs/E150/GOV-MANDATE-04_CONSENT_REGISTER_HANDOFF_CONTRACT_2026-05-03.md`
  bestätigt, dass Register-/Membership-Handoffs explizites Opt-in verlangen
  und keine automatische Membership- oder Rollenübernahme zulässig ist.
- `docs/E150/DOMAIN-HARM-01A_SURFACE_ROUTING_MATRIX_2026-03-27.md` bestätigt,
  dass Routing- und Surface-Grenzen nicht stillschweigend neu erfunden werden
  dürfen.
- `docs/E150/V3_VOXY_HYBRID_RUNTIME_FOUNDATION_2026-07-12.md` bestätigt, dass
  keine zweite aktive Voxy-Runtime freigegeben ist.

## 1. Kanonische Selbstbeschreibung

VoiceOpenGov ist eine privat initiierte, gemeinwohl- und
gesellschaftsorientierte, weltweit offene zivilgesellschaftliche
Gemeinschaft.

VoiceOpenGov ist keine Partei und keinem politischen Links-Rechts-Lager
zugeordnet.

Die Würde jedes Menschen, unveräußerliche Grundrechte,
Minderheitenschutz sowie Schutz, demokratische Handlungsfähigkeit und
Widerstandsfähigkeit der Gesellschaft sind verbindliche Leitplanken.

Das Mehrheitsprinzip entscheidet Positionen und Mandate, darf aber
Menschenwürde, Grundrechte, Minderheitenschutz oder überprüfbare
Tatsachen nicht außer Kraft setzen.

## 2. eDebatte/VOG-Grenze

- eDebatte bleibt offene, neutrale Informations-, Diskussions-,
  Beteiligungs- und Abstimmungsinfrastruktur.
- VoiceOpenGov ist Mission, Trägerschaft, persönliche Mitgliedschaft,
  Partnernetzwerk, dynamisches Programm und Positionsprozess.
- VOG kontrolliert keine neutralen Review-, Fakten-, Ranking-,
  Moderations- oder Zugangsregeln von eDebatte.
- keine zweite Runtime, Datenbasis oder KI

## 3. Nutzer- und Mitgliedschaftsmodell

- eDebatte kann von natürlichen Personen und Institutionen genutzt
  werden.
- Institutionen dürfen Verfahren und Abstimmungen veranstalten.
- Demokratische Stimmen werden ausschließlich berechtigten natürlichen
  Personen zugeordnet.
- VoiceOpenGov-Mitgliedschaft steht ausschließlich natürlichen Personen
  offen.
- Institutionen können keine stimmberechtigten VOG-Mitglieder sein.
- Institutionen können eDebatte-Kunden, Veranstalter, Partner oder
  Förderer sein.
- Mitgliedschaft, Partnerstatus, Produktpaket, operative Rolle,
  Stimmrecht und Repräsentationsmandat bleiben getrennt.

## 4. Pricing-Harmonisierung

- `eDebatte Interessiert`: `0 €` für bestätigte
  VoiceOpenGov-Mitglieder, `3,99 €` regulär.
- keine zusätzliche Abstimmungsgebühr für interne
  VOG-Mitgliederverfahren
- höhere eDebatte-Pakete bleiben getrennte Produktangebote
- institutionelle eDebatte-Zahlungen sind Produktentgelte
- institutionelle Zahlungen an VoiceOpenGov sind Spenden/Förderung
- beide Zahlungsarten müssen rechtlich, buchhalterisch und öffentlich
  klar getrennt bleiben

## 5. Abstimmungsarten

Es wird ausdrücklich getrennt zwischen:

### A. allgemeine eDebatte-Verfahren

- Teilnehmerkreis je Verfahren
- offen für dafür berechtigte natürliche Personen
- nicht pauschal an VOG-Mitgliedschaft gebunden

### B. interne VoiceOpenGov-Verfahren

- technisch über eDebatte
- klar als VOG-Mitgliederverfahren gekennzeichnet
- nur persönliche, bestätigte VOG-Mitglieder stimmberechtigt
- Governance, VOG-Positionen, dynamisches Programm und
  Repräsentationsmandate

## 6. Initiativen und dynamisches Programm

- jedes bestätigte VOG-Mitglied darf einen Vorschlag anstoßen
- formale Zulässigkeitsprüfung vor Programmaufnahme:
  Verständlichkeit, Zuständigkeit, Ebene, Duplikat, Quellen/Begründung,
  Rechtmäßigkeit und Schutz sensibler Daten
- keine politische Vorzensur
- zulässige Vorschläge erscheinen automatisch im dynamischen Programm
  auf `voiceopengov.org`
- Statuskette:
  - `proposal`
  - `in_discussion`
  - `qualified_for_vote`
  - `voting`
  - `provisional`
  - `valid`
  - `under_review`
  - `superseded`
  - `expired`
  - `archived`

## 7. Offizielle VOG-Positionen

Jede offizielle VoiceOpenGov-Position muss mindestens ausweisen:
- Position-ID
- genaue Frage
- Dossier
- Berechtigung
- Quorumregel
- Entscheidungsregel
- Ergebnis
- Mehrheits- und Minderheitspositionen
- Gegenargumente
- Quellen
- Interessenkonflikte
- Beschlussdatum
- Revisionsdatum
- Gültigkeit
- Mandat
- Revisionsspur

Eine Mehrheitsposition ist eine VOG-Position, keine automatische
Wahrheit und keine neutrale Position von eDebatte.

## 8. Partner und Institutionen

- Partnerkategorien:
  Community, Kommunen, Medien, Wissenschaft, Technologie, Bildung,
  Förderung
- Partner dürfen Verfahren unterstützen oder veranstalten
- sie dürfen sich als Veranstalter und Stakeholder darstellen
- sie repräsentieren dadurch weder eDebatte noch VoiceOpenGov
- kein automatisches Stimm-, Review-, Ranking-, Moderations-,
  Publikations- oder Mandatsrecht

## 9. Förderung und Transparenz

- keine Fakten, Stimmen, Sichtbarkeit, Rankings, Reviews, Moderation,
  Mandate oder Voxy-Ausgaben gegen Geld
- Spendenart, Zweck, Laufzeit, relevante Höhe und Interessenkonflikte
  nach später festzulegenden Transparenzschwellen offenlegen
- Abhängigkeit von einzelnen Förderern muss begrenzt werden
- bei Interessenkonflikten verknüpftes eDebatte-Dossier oder
  Diskussionsverfahren
- persönliche Daten handelnder Menschen bleiben geschützt

## 10. Repräsentanten

- sachlich und zeitlich begrenztes Mandat
- Qualifikation nach Betroffenheit, fachlicher Eignung,
  Kommunikationsfähigkeit, Integrität und Konfliktoffenlegung
- kein Parteien-, Wahlkampf-, Popularitäts- oder Influencermodell
- Parteizugehörigkeit weder bevorzugen noch automatisch ausschließen
- Auswahlmechanismus später transparent festlegen:
  Mandatierung, Rotation oder Los unter gleich qualifizierten Personen

## 11. Voxy

Voxy unterscheidet:
- neutrale eDebatte-Information
- Stakeholderposition
- Partnerinformation
- persönliches Orientieren
- Meinungsbild
- Community-Ergebnis
- offizielle VOG-Position

Ohne gültige veröffentlichte Position-ID darf Voxy keine offizielle
VOG-Position behaupten oder aus Diskussionen selbst ableiten.

Quelle, Status, Stimmenzahl, Minderheitenlage und Revisionsdatum müssen
sichtbar bleiben.

## 12. Domains und öffentliche Flächen

- `voiceopengov.org`:
  Mission, Gemeinschaft, persönliche Mitgliedschaft, Partner,
  Förderung, dynamisches Programm, Mandate und offizielle Positionen
- `edebatte.org`:
  offene neutrale Informations-, Diskussions-, Beteiligungs- und
  Abstimmungsplattform
- gemeinsame technische Grundlage und möglichst gemeinsames Konto
- Kontext muss auf jeder Fläche eindeutig sichtbar sein
- Mandatsregister sowie Förder- und Interessenregister vorsehen

## 13. Mehrsprachigkeit

- zentrale Inhalte mindestens Deutsch und Englisch
- verbindliche Originalfassung kennzeichnen
- Übersetzungen kennzeichnen und versionieren
- Governance- und Positionsübersetzungen human-review-first
- Voxy behandelt Übersetzungen nicht als neue Positionen

## 14. Datenschutz

- persönliche Mitglieds-, Stimm-, Kontakt- und Schutzdaten sind nicht
  öffentlich
- Institutionen sind mit Name, Rolle, Status, öffentlicher Position,
  relevanter Förderung und Interessenkonflikten transparent
- personenbezogene Daten institutionell handelnder Menschen,
  Zugangsdaten und Sicherheitsinformationen bleiben geschützt

## Quorum-Prüfung

Im Repo bereits vorhanden und damit als generische Grundlage verifiziert:
- `simple-majority`
- `absolute-majority`
- `two-thirds`
- `unanimity`
- `custom`
- `minQuorum`
- Ergebnislogik für Mindestquorum, einfache Mehrheit und 2/3
- FAQ-Grundsatz „eine Person, eine Stimme“
- Offenlegung der Regel vor der Abstimmung

Ebenfalls ausdrücklich festgehalten:

- Eine endgültige VOG-spezifische Quorumformel ist noch nicht kanonisch.
- Die diskutierten absoluten Schwellen
  - kommunal: `1.000`
  - Land: `10.000`
  - Bund: `100.000`
  sind Ausgangshypothesen und noch keine Implementierungsfreigabe.
- Die generisch vorhandenen Typen `weighted` und `payroll-weighted`
  dürfen nicht als freigegebene Regel für allgemeine demokratische oder
  VOG-Abstimmungen interpretiert werden.
- Für diese Verfahren gilt: eine berechtigte natürliche Person,
  eine Stimme.

## Verbleibende offene Entscheidungen nach diesem Closure-Slice

Nicht mehr offen sind die kanonische Selbstbeschreibung, die
eDebatte/VOG-Grenze, das personengebundene Membership-Modell, die
grundsätzliche Trennung von Abstimmungsarten, die Pricing-Harmonisierung,
die Mindest-Domaintrennung, die Mindest-Mehrsprachigkeit und die
grundlegenden Voxy-Grenzen.

Weiterhin offen und deshalb nicht implementierungsfreigegeben bleiben:
- die endgültige VOG-Quorumformel
- Transparenzschwellen und genaue Offenlegungstiefen
- der verbindliche Auswahlmechanismus für Repräsentanten
- das genaue gemeinsame Konto-/Shell-/Routing-Modell
- konkrete Register-, Seiten- und Surface-Ausprägungen
- rechtliche und buchhalterische Operationalisierung der Zahlungsströme

## Release Gate

Diese Decisions-Datei autorisiert keine Implementierung.

Alle ausstehenden Governance-, Quorum-, Routing-, Register-,
Transparenz- und Surface-Entscheidungen bleiben `manual_gate`, bis ein
menschlich freigegebener Folge-Contract sie verbindlich schließt.
