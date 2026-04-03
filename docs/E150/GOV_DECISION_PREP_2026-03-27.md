# GOV Decision Prep (2026-03-27, aktualisiert)

Ziel dieses Dokuments:
- getroffene Leitentscheidungen repo-nah manifestieren,
- offene `needs_decision` Tasks weiter entscheidungsreif vorbereiten,
- Folge-Slices pro Entscheidung klar schneiden.

## 1) GOV-SEC-03 — Zonenmodell + High-impact-Auditpflicht

### Entscheidungsstand (manifestiert)
- votes/core Split wird **komplett** umgesetzt (nicht nur high-impact-first).
- Cross-Store-Pfade werden als **beide kritisch** gefuehrt; Neo4j wird zuerst tiefer gehaertet, Prisma direkt danach.
- Direkte Providerpfade erhalten als Mindestcontract verpflichtend:
  - Auditfelder
  - PII-Redaction
  - Allowlist
- Rest-Migration bleibt schrittweise, aber immer mit offenem Review-Gate.

### Evidenzbasis
- `GOV-SEC-03A`: Zonenmatrix (`docs/E150/GOV-SEC-03A_ZONE_MATRIX_2026-03-27.md`)
- `GOV-SEC-03B`: machine-readable Inventar + Drift-Checks (`docs/E150/GOV-SEC-03B_ZONE_INVENTORY_2026-03-27.json`, `apps/web/tests/gov-sec-03b.zone-inventory.test.ts`)

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-SEC-03C` votes/core Usage-Split Contract komplett umsetzen
- `GOV-SEC-03D` Cross-Store-Hardening (Neo4j zuerst, Prisma direkt danach)
- `GOV-SEC-03E` Mindestcontract fuer direkte Providerpfade technisch erzwingen

---

## 2) GOV-AI-07 — Meta-Layer / Audit / Provenance / Layman

### Entscheidungsstand (manifestiert)
- Meta-Basissatz ist auf **allen Pfaden verpflichtend**.
- Pflichtkern fuer Nachvollziehbarkeit/Erklaerbarkeit ist **immer synchron**.
- Bereits produktiv genutzte Telemetrie-/Admin-Metafelder werden **nicht kuenstlich minimiert**.
- High-impact ist fuer den Pflichtkern breit definiert:
  - Analyse
  - Dossier
  - Factcheck
  - Matching
  - CTA
  - Findings
  - veroeffentlichungsnahe Verdichtung
- Asynchrone Nachreichung ist nur fuer **vertiefende Zusatzinformationen** erlaubt, nicht fuer den Pflichtkern.

### Evidenzbasis
- Feldinventar: `docs/E150/GOV-AI-07A_META_LAYER_FIELD_INVENTORY_2026-03-27.md`
- Hauptcontract-Haertung: `GOV-AI-04B/C/D`

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-AI-07B` typed Meta-Envelope Pflichtfelder pro Pfadklasse
- `GOV-AI-07C` Route-/Service-Checks fuer Pflichtfelder
- `GOV-AI-07D` Layman-Contract fuer produktive Ausspielung (Pflichtkern synchron)

### Produktionsreife-Markierung AI-Orchestrierung (2026-03-29)

- Der entschiedene strict-staged Hauptpfad ist als operativer Baseline-Contract
  zusammengefuehrt markiert:
  - staged Mainflow-Step-Contract
  - Boundary-/Envelope-Mindestpflichten
  - Primar-/Fallback-/Ausnahme-Einordnung
- Machine-readable Contract-Anker:
  - `apps/web/src/features/ai/orchestrationProductionContract.ts`
  - `apps/web/src/features/ai/orchestrationRouteContract.ts`
- Evidenz:
  - `docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`
- Keine neue Leitentscheidung in diesem Slice:
  - DPA/Residency-Feinregeln
  - Cost-envelope-Feinsteuerung
  - erweiterte Reliability-/Fault-Isolation-Policy

---

## 3) GOV-SIGNAL-01 — Signalmodell

### Entscheidungsstand (manifestiert)
- **Option A** ist als Startkanon freigegeben.
- Signal steht verbindlich fuer:
  - Relevanz
  - Dynamik
  - Priorisierung
  - Radar-/Aufmerksamkeitssteuerung
- Signal steht verbindlich **nicht** fuer:
  - Wahrheit
  - Faktenstatus
  - Voting-Gewicht
  - direkte Funding-Legitimation
  - journalistische oder kommunale Sondermacht
- Anlassraeume bleiben initiierbar, aber epistemisch offen.
- eDebatte wird nicht auf Umfrage-/Survey-Logik reduziert; Startfragen/Startoptionen duerfen strukturieren, aber Eventualitaeten, Gegenfragen und Alternativen muessen sichtbar bleiben.

### Policy-/Profil-Logik (Startkanon)
- Decay/Laufzeit sind policy-/profilgesteuert statt global starr.
- Freigegebene Startprofile:
  - Kurzzyklus
  - Standard
  - Quartal
  - Halbjahr
- Profile sind anschlussfaehig fuer:
  - Medien
  - Verbaende
  - Firmen
  - Kommunen
  - Veranstaltungen
  - offene Raeume
  - geschlossene Raeume

### Harte Anti-Capture-Gates (Startkanon)
- Kein einzelner Akteur darf Signalwirkung dominieren.
- Verifikationsbonus bleibt gedeckelt.
- Keine Wahrheitsableitung aus Signalstaerke.
- Funding bleibt strikt getrennt.
- Signalquellen bleiben im Admin-/Governance-Kontext auditierbar.

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-SIGNAL-01A` typed SignalScore-Contract + Triggermatrix (inkl. erlaubte Quellen, Gewichte, Profil-Decay).
- `GOV-SIGNAL-01B` Abuse-/Rate-Limit-/Anti-Capture-Contract.
- `GOV-SIGNAL-01C` Audit-/UI-Transparenz (Signalquelle, Gewicht, Decay-Profil, Triggergrund).

---

## 3.1) Produktlinien-Rahmen (kanonisch vorbereitet, ohne Formelentscheid)

- Public Core bleibt offen/niedrigschwellig.
- Professional Layer bleibt bezahlbar und klar von epistemischer Macht getrennt.
- Bezahlt wird nicht Wahrheit, Debattenausgang oder Sondermacht.
- Bezahlt werden professionelle Arbeits-/Orga-Funktionen:
  - Anlassraum-Eroeffnung und Steuerung
  - Graph-/Erkenntnisuebernahme
  - Dossier-/Briefing-/Vortrags-/Panel-Vorbereitung
  - Factcheck-/Review-Workflows
  - Team-/Orga-/Admin-/Moderationsfunktionen
  - Exporte/Embeds/QR/Ergebnisraeume
- Produktlinie bleibt anschlussfaehig fuer `Anlassraum-Pro`, `Workspace-Pro` und `Organization-Layer`.
- Dieser Rahmen ist Guidance fuer `GOV-FUNDING-01` und `GOV-PRICING-01`, aber keine finale Pricing-/Funding-Formel.

---

## 4) GOV-FUNDING-01 — Signals + Funding Grundmodell

### Entscheidungsstand (manifestiert)

#### Grundprinzip
- Funding ist kein Ersatz fuer demokratische oder gemeinschaftliche Legitimation.
- Ob ein Anlass gewollt, tragfaehig oder mehrheitsfaehig ist, wird nicht durch Geld entschieden.
- Funding kann ermoeglichen, konkretisieren, beschleunigen oder Haushalte entlasten, ersetzt aber nicht Relevanz, Signal, Zustimmung, Gegenargumente, Eventualitaeten und Zustaendigkeit.

#### Struktur: Dossier vs. Anlassraum
- Dossier bleibt der uebergeordnete Themen- und Entscheidungsraum.
- Anlassraum bleibt der konkrete, bearbeitbare und fundingfaehige Teilraum innerhalb oder neben einem Dossier.
- Leitregel: Funding dockt primaer an konkreten Anlassraeumen an; Dossiers bleiben der Orientierungs-/Verdichtungsraum.

#### Startkanon Funding-Typen
1. Anlass-Funding (konkreter Anlassraum)
2. Dossier-nahes Funding (Vorbereitung/groesserer thematischer Kontext)
3. Ressourcen-/Begleit-Funding (Geld, Sachmittel, Know-how, ehrenamtliche Begleitung, Planungsleistung, Moderation/Fachbeitrag/Begleitstruktur)

#### Freigabelogik
Funding wird nur freigegeben oder sichtbar anschlussfaehig, wenn:
- der Anlass als konkreter Raum klar beschrieben ist,
- Zustaendigkeit und Kontext sichtbar sind,
- Gegenargumente/Eventualitaeten/offene Fragen sichtbar werden konnten,
- erkennbare gemeinschaftliche oder oeffentliche Tragfaehigkeit vorliegt,
- Funding transparent und rollenbezogen ausgewiesen ist.

Leitregel: Funding folgt dem Anlassraum, nicht umgekehrt.

#### Was Funding darf
- Umsetzung ermoeglichen
- zusaetzliche Qualitaet ermoeglichen
- kommunale/organisatorische Budgets entlasten
- buergerschaftliche Mitverantwortung sichtbar machen
- ergaenzende Ressourcen buendeln
- professionelle oder ehrenamtliche Begleitung ermoeglichen

#### Was Funding nicht darf
- einen gesellschaftlich nicht getragenen Anlass allein durch Finanzkraft durchsetzen
- Signal oder Relevanz ersetzen
- Zustimmung oder demokratische Legitimation ersetzen
- Gegenargumente oder Eventualitaeten verdraengen
- Wahrheit, Faktenstatus oder Debattenausgang beeinflussen
- einzelnen Akteuren Sondermacht ueber Priorisierung oder Ausgang geben

#### Transparenzpflicht
Funding muss sichtbar machen:
- wer gibt/unterstuetzt
- in welcher Rolle
- fuer welchen konkreten Anlass oder Dossierbezug
- in welcher Form (Geld, Sachmittel, Know-how, ehrenamtliche Begleitung)
- ob zweckgebunden oder offen
- ob Bedingungen/Einschraenkungen bestehen
- welche Wirkung auf Umsetzung oder Haushalt erwartet wird

#### Capture-Schutz
- Funding und Signal bleiben getrennt.
- Funding und Faktenstatus bleiben getrennt.
- Funding und Abstimmung bleiben getrennt.
- Hohe Finanzkraft darf niedrige gesellschaftliche Tragfaehigkeit nicht ueberstimmen.
- Anti-Capture-Grenzen und Transparenzpflichten sind verpflichtend.

#### Public Core vs. Professional Layer
- Public Core bleibt offen und niedrigschwellig.
- Professional Layer bleibt bezahlbar und umfasst:
  - professionelle Anlassraum-Eroeffnung
  - Graph-/Erkenntnisuebernahme
  - Dossier-/Briefing-/Vortrags-/Panel-Vorbereitung
  - Factcheck-/Review-Workflows
  - Team-/Orga-/Admin-/Moderationsfunktionen
  - Exporte/Embeds/QR/Ergebnisraeume
- Bezahlt wird Arbeitsfaehigkeit, nicht epistemische Sondermacht.

### Strategische Kurzform
eDebatte-Funding ist dokumentierte oeffentliche/gemeinschaftliche Ermoeglichung.
Es macht konkrete Anlaesse umsetzbarer, ersetzt aber nie Relevanz, Signal, Legitimation oder Wahrheitsanspruch.

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-FUNDING-01A` Funding-Gate-Contract (intent/readiness/eligibility) entlang Anlassraum-First
- `GOV-FUNDING-01B` Anti-Capture-/Cap-Regeln + Transparenzcontract
- `GOV-FUNDING-01C` Funding-Lifecycle + Audit-Contract (inkl. Ressourcen-/Begleit-Funding)

### Implementierungsstand GOV-FUNDING-02 (2026-03-29)

- `GOV-FUNDING-02` ist als operativer Contract-Slice umgesetzt:
  - typed Ressourcen-/Sachleistungs-/Begleit-Contract mit `supportType`, `supportScope`, `matchingFrame`, Transparenz- und Capture-Pflichtfeldern
  - Anlassraum-first bleibt contract-seitig erzwungen (`anlassraum` braucht `anlassraumId`; `dossier_adjacent` braucht `dossierId`)
  - Matching-/Ermoeglichungsrahmen bleibt projektbezogen (`enabling_fund`/`community_contributions`) und ist auf Anlassraum-Scope begrenzt
- Implementierungsanker:
  - `apps/web/src/lib/server/funding/fundingSupportContract.ts`
  - `apps/web/tests/funding-support-contract.test.ts`
  - `docs/E150/GOV-FUNDING-02_RESOURCE_SUPPORT_CONTRACT_2026-03-29.md`
- Nicht Teil des Slices:
  - keine Zahlungs-/Checkout-/Fundraising-Engine
  - keine personenbezogene Reward-/Token-/Points-Logik

### Implementierungsstand GOV-FUNDING-03 (2026-03-29)

- `GOV-FUNDING-03` ist als operativer Impact-/Refunding-Contract-Slice umgesetzt:
  - typed Impact-/Follow-up-/Refunding-Lifecycle (`impactStatus`, `followUpStatus`, `refundingStatus`, `refundingReasonType`)
  - Guardrails gegen Reward-/Points-/Token-Drift sowie gegen Wahrheits-/Signal-/Legitimationsableitung
  - Anlassraum-first-/Matching-Grenzen bleiben erzwungen (`matchingFrame` ausserhalb `none` nur im Anlassraum-Scope)
  - Refunding-/Nicht-Einloesungsfaelle bleiben reason-/audit-pflichtig
- Implementierungsanker:
  - `apps/web/src/lib/server/funding/fundingImpactLifecycleContract.ts`
  - `apps/web/tests/funding-impact-lifecycle-contract.test.ts`
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (Meta-Baseline `fundingImpactLifecycle`)
  - `docs/E150/GOV-FUNDING-03_IMPACT_REFUNDING_CONTRACT_2026-03-29.md`
- Nicht Teil des Slices:
  - keine Payment-/Checkout-/Billing-/Refund-Engine
  - keine automatische Mittelbewegung oder neue Zahlungslogik

---

## 5) GOV-PRICING-01 — Hybrid-Pricing

### Entscheidungsstand (manifestiert)

#### Grundprinzip
- Public Core bleibt offen/niedrigschwellig.
- Professional Layer bleibt bezahlbar.
- Pricing bezahlt Arbeitsfaehigkeit, nicht epistemische Sondermacht.
- eDebatte bleibt Infrastruktur fuer Anlassraeume/Dossiers/Pruefung/Nachverfolgung und wird nicht auf Survey-/Sponsoringlogik reduziert.

#### Public Core vs. Professional Layer

Public Core (nicht paywallen):
- oeffentliche Anlassraeume lesen
- Basisbeitrag/Hinweis/Frage/Widerspruch
- Basisbeteiligung/Basisstellungnahme/Basisabstimmung (wenn offen)
- oeffentliche Nachvollziehbarkeit von Dossier, Pruefpfad und Umsetzungsstand

Professional Layer (preiswirksam, bezahlbar):
- professionelle Anlassraum-Eroeffnung
- Graph-/Erkenntnisuebernahme
- Dossier-/Briefing-/Vortrags-/Panel-Vorbereitung
- Factcheck-/Review-Workflows
- Team-/Orga-/Admin-/Moderationsfunktionen
- Exporte/Embeds/QR/Ergebnisraeume
- geschlossene/hybride Raeume
- spezielle Laufzeit-/Governanceprofile

Nicht kaufbar:
- Wahrheit
- Faktenstatus
- Signalhoehe
- politisches Gewicht als Machtfaktor
- Abstimmungsergebnis
- Debattenausgang
- epistemische Sondermacht

#### Segmentlogik (Startkanon)
- Public / Free
- Civic Creator
- Media Creator
- Team / Organization
- Kommune / oeffentlicher Traeger
- Enterprise/Sonderfall bleibt spaeterer Sonderpfad, nicht Runtime-Startkanon

Klarstellung Creator-Segmente:
- Civic Creator: Einzelne, lokale Initiativen, kleinere Formate, Hosts/Moderatoren.
- Media Creator: Journalisten, Streamer, Podcaster, freie redaktionelle Formate, journalistische Personenmarken.
- Agentur/Medienhaus/Redaktions-Team: kein einfacher Creator-Plan, sondern Team-/Organization-/Publisher-Logik.

#### Preismodell
- Hybridmodell mit Caps ist Startkanon.
- Nicht rein paketig und nicht rein verbrauchsgetrieben.
- Grundstruktur + professionelle Nutzungskomponenten.
- Explainability ist verpflichtend (keine Blackbox-Preislogik).

#### Preiswirksame Variablen (zulaessig)
- aktive Anlassraeume
- parallele professionelle Raeume/Dossiers
- Teamgroesse/Rollen/Moderationsfunktionen
- geschlossene/hybride Raeume
- Export/Embed/QR/Ergebnisraeume
- Factcheck-/Review-/Governance-Tiefe
- Graph-/Dossier-/Briefing-/Vortrags-/Panel-Vorbereitung
- institutionelle/organisatorische Nutzung

#### Nicht zulaessige Preishebel
- Wahrheit
- Signalhoehe
- politisches Gewicht
- Abstimmungsergebnis
- gesellschaftliche Relevanz als Machtfaktor
- Debattenausgang

#### Caps / Obergrenzen
- Harte Caps sind verpflichtender Kanonbestandteil.
- Schutzkorridore fuer kleine/gemeinwohlorientierte Segmente sind Pflicht.
- Preislogik darf wachsende demokratische Beteiligung nicht bestrafen.

#### Kommunen / verifizierte oeffentliche Nutzung
- online abschliessbar nach Verifizierung
- standardisierte Bedingungen/Governance-Rahmen fuer Standardfaelle
- Self-serve fuer Standardfaelle
- institutioneller Funding-/Pricing-Korridor:
  - mindestens **500 EUR** oder **1,99 %**, je nachdem was hoeher ist
- gilt nur fuer verifizierte institutionelle/kommunale Nutzung, nicht als allgemeine Buergerregel

#### Funding-/Pricing-Bezug
- Funding-Take bleibt pricing-seitig ergaenzend, nicht Hauptlogik.
- Public/Civic-Faelle werden nicht vorschnell mit hohen Mindestfees belastet.
- institutionelle/verifizierte oeffentliche Faelle koennen eigene Mindestkorridore haben.
- Creator-/Publisher-/Media-Monetarisierung bleibt von civic/public Funding-Logik getrennt.
- Revenue-Share-/Creator-/Publisher-Logiken werden nicht mit demokratischer Grundteilnahme/Foerderfaehigkeit vermischt.

#### Harte rote Linien
- Bezahlte Nutzung darf nicht Wahrheit beeinflussen.
- Bezahlte Nutzung darf keine Signalhoehe kaufen.
- Bezahlte Nutzung darf keinen Faktenstatus verbessern.
- Bezahlte Nutzung darf Anlassraeume nicht epistemisch schliessen.
- Bezahlte Nutzung darf Gegenargumente/Eventualitaeten nicht verdraengen.
- Bezahlte Nutzung darf Debattenausgaenge nicht beguenstigen.
- Bezahlte Nutzung darf keine Sondermacht ueber Priorisierung/Ausgang erzeugen.

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-PRICING-01A` finaler Pricing-Contract (Formeln/Caps/Abrechnungsregeln)
- `GOV-PRICING-01B` Audit-/Explain-Contract fuer Preisermittlung
- `GOV-PRICING-02` Admin Pricing Control auf manifestierten Governance-Pflichten umsetzen

### Admin Pricing Control (Pflichtkanon fuer spaetere Runtime-Umsetzung)

#### Sichtbar/regulierbar im Admin
- Segment
- Tarif
- Verifizierungsstatus
- Creator-Typ (Civic Creator / Media Creator / Publisher-Agency-Team-Organization)
- Kommune/Institution/oeffentlicher Traeger Status
- Funding-Fee-Regel
- Caps/Obergrenzen
- aktive Specials/Add-ons/Pilotstatus/Sonderangebote
- manuelle Overrides inkl. Begruendung/Auditspur

#### KPI-/Controlling-Pflicht
- Anzahl aktiver Anlassraeume
- Anzahl aktiver Dossiers
- Professional-Layer-Nutzung
- Funding-Volumen
- Funding-Fee-Umsaetze
- Export-/Embed-/QR-/Review-/Factcheck-Nutzung
- Conversion Free -> Creator/Team/Organization
- Nutzung von Specials/Pilotangeboten/Sonderprofilen

#### Governance-/Regelpflicht
- Specials aktivieren/deaktivieren
- verifizierte kommunale/institutionelle Konditionen
- Pilotpartner-Logik
- manuelle Override-Regeln nur mit Auditspur/Begruendung
- keine unsichtbaren Preis-/Fee-Aenderungen

#### Explainability
- Warum greift welcher Tarif?
- Warum greift welche Fee?
- Warum greift welches Segment?
- Warum ist welcher Sonderstatus aktiv?

### GOV-PRICING-02 Vorbereitungsstand (2026-03-29)

- Der Runtime-nahe Iststand (Plan-/Tier-Mapping, Admin-Mutationspfade, Membership-Statuspfade, Pilotsettings, KPI-Basis) ist repo-nah inventarisiert.
- Der operative Mindestcontract fuer Admin Pricing Control ist als eigenstaendige Evidenz dokumentiert:
  - `docs/E150/GOV-PRICING-02_ADMIN_PRICING_CONTROL_CONTRACT_2026-03-29.md`
- Darin sind Pflichtdimensionen fuer Segment/Plan/Verifizierung/Creator-Typ/Fee/Caps/Specials/Overrides, Explainability und KPI-/Audit-Felder als implementierbarer Folgecontract gebuendelt.
- Freigegebene Folgeslices:
  - `GOV-PRICING-02A` (typed Policy-/Override-/Explainability-Contract + Tests)
  - `GOV-PRICING-02B` (Audit-/KPI-Contract + Tests)

### Implementierungsstand GOV-PRICING-02A/02B/02C (2026-03-29)

- `GOV-PRICING-02A` ist umgesetzt:
  - typed Admin-Pricing-Control-Contract inkl. Segment-/Creator-/Verifizierungs-/Plan-/Fee-/Cap-/Override-/Special-/Pilot-Typen
  - Explainability-Shape und Auditfeld-Ableitung sind technisch eingefroren
  - Guardrails gegen Wahrheits-/Signal-/Ergebnis-Monetarisierung und stille Overrides sind contract-seitig abgesichert
- `GOV-PRICING-02B` ist umgesetzt:
  - typed Audit-Event-Contract fuer Pricing-Mutationen (Reason-/Source-/Changed-Field-Pflicht)
  - typed KPI-Snapshot-Contract fuer Pflichtfelder (Aktivitaet, Professional-Layer, Funding/Fee, Conversion, Specials/Pilot/Overrides)
  - Contract-Tests sichern Explainability-Shape und Guardrails gegen Dimensionsdrift
- `GOV-PRICING-02C` ist umgesetzt:
  - typed Readmodel-/Projection-Resolver fuer Pricing-Control auf Basis von 02A/02B
  - Integration in bestehende Admin-Reads (`/api/admin/dashboard/summary`) mit konsistentem Read-State fuer Segment/Plan/Fee/Caps/Specials/Overrides
  - Guardrails gegen Wahrheits-/Signal-/Ergebnisbezug und Reward-Mechaniken sind im Readmodel explizit verankert
- `GOV-PRICING-02` ist damit operativ abgeschlossen; naechster sinnvoller Folgeblock liegt ausserhalb Pricing-02 (voraussichtlich `GOV-JOURNALISM-02` oder `GOV-MUNI-02`).

### Matching-/Ermoeglichungs-Guardrail (kanonisch, keine Runtime-Engine)
- Keine persoenliche Aktivitaetsverguetung als Hauptlogik (`Community Points`, `Credits`, `Tokens`, `Engagement Credits`, `Earn-to-participate`).
- Bevorzugt: reputative Mitwirkungsmarker, Mitwirkungsstatus, Utility-Freischaltungen, projektbezogene Ermoeglichungs-/Matching-Modelle.
- Begriffskanon:
  - DE: `Ermoeglichungsfonds`, `Ermoeglichungsbeitraege`
  - EN: `Matching Fund`, `Community Contributions`
- Anlassraeume koennen durch konstruktive Mitwirkung matching-/foerderfaehiger werden; persoenliche Aktivitaet erzeugt keine direkte Geld-/Machtansprueche.

---

## 6) GOV-JOURNALISM-01 — `source_anchor` als Anlassgeber

### Entscheidungsstand (manifestiert)

#### Journalismus als Anlassgeber
- `source_anchor` ist ein legitimer Anlassgeber/Startkontext.
- Artikel, Sendung, Podcast, Stream, Beitrag, Rechercheanlass oder redaktionelles Format koennen Anlassraeume ausloesen.
- Journalismus darf Themen strukturieren und oeffentliche Klaerung anstossen, erzeugt aber keine epistemische Sonderwahrheit.

#### Keine Sonderwahrheit / keine Sondermacht
- Kein automatischer Wahrheitsstatus aus `source_anchor`.
- Keine Verdraengung anderer Perspektiven.
- Eventualitaeten, Gegenfragen und Alternativen bleiben sichtbar.
- Keine privilegierte Deutungsmacht aus journalistischem Ursprung.

#### Offener Anlassraum bleibt erhalten
- Startfragen/redaktionelle Leitfragen duerfen strukturieren.
- Anlassraeume bleiben initiierbar und epistemisch offen.
- eDebatte bleibt auch im journalistischen Kontext mehr als Umfrage-/Kommentarsammeltool.

#### Journalistische Staerken im Kanon
- Anlassraeume und Dossiers anstossen
- wiederverwendbares Wissen sichtbar machen
- regionale und ueberregionale Anschlussfaehigkeit staerken
- Pruefpfade/Factcheck/offene Fragen sichtbar halten
- Debatten strukturieren, ohne sie epistemisch abzuschliessen

#### Beschleunigte Pfade (begrenzt und transparent)
- Nur als Review-/Workflow-Erleichterung.
- Kein Wahrheits- oder Prioritaetsprivileg.
- Immer mit Transparenz- und Auditspur.

#### Team-/Rollenanschluss (fachlich getrennt zum Muni-Kanon)
- Redaktion/Publisher/journalistische Teams sind teamfaehige professionelle Kontexte (Review/Publish/Moderation), nicht nur Einzeluser mit Badge.
- Institutionelle/verwaltungsnahe Nutzung ist ebenfalls teamfaehig und nutzt dieselbe Grundinfrastruktur, folgt aber eigener Fachlogik.
- Gleiche Grundinfrastruktur bedeutet nicht gleiche Rolle, Prioritaet oder UI-Logik.
- Kein Zwang zur Vollredaktion: auch kleinere Formate, Einzeljournalisten, Creator und regionale Medien bleiben anschlussfaehig.

#### Sondertools / Spezialpfade (freundlich eingeordnet)
- Sondertools sind zulaessig, wenn sie transparent eingeordnet sind, anschlussfaehig bleiben und den kanonischen Anlassraum-/Dossier-/Pruef-/Nachverfolgungskern nicht verdraengen.
- Keine feindliche Vereinheitlichung und keine erzwungene Monokultur.
- Sondertools bleiben Hilfs-/Arbeitswerkzeuge, nicht Parallelkanon oder versteckte Sondermacht.

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-JOURNALISM-02` Truth-Guardrails + Factcheck-Interventionen auf den manifestierten Anlassgeber-Kanon ausrichten.
- `GOV-JOURNALISM-03` Embed/QR/Companion-Pfade als transparente Hilfswerkzeuge (kein Wahrheitsprivileg) ausbauen.
- `GOV-JOURNALISM-04` journalistische Rollen-/Teamprofile (inkl. Anschluss kleiner Formate) kanonkonform konkretisieren.

### Implementierungsstand GOV-JOURNALISM-02 (2026-03-29)
- `GOV-JOURNALISM-02` ist kontraktnah umgesetzt:
  - shared Guardrail-Resolver fuer `source_anchor` in `features/anlassraum/journalismGuardrails.ts`
  - Route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
  - Regressionstests:
    - `apps/web/tests/journalism-truth-guardrails.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Guardrail-Kern bleibt explizit:
  - kein Wahrheits-/Prioritaetsprivileg aus Medienstatus
  - keine Statusableitung fuer Factcheck/Finding/Dossier aus Anchor
  - Review-/Factcheck-/Dossier-Anschluss bleibt transparent und auditierbar
- Evidenz: `docs/E150/GOV-JOURNALISM-02_TRUTH_GUARDRAILS_FACTCHECK_CONTRACT_2026-03-29.md`

### Implementierungsstand GOV-JOURNALISM-03 (2026-03-29)
- `GOV-JOURNALISM-03` ist kontraktnah umgesetzt:
  - shared Companion-/Embed-/QR-Contract in `features/anlassraum/journalismCompanionContract.ts`
  - route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (`meta.journalismCompanionContract`)
  - Regressionstests:
    - `apps/web/tests/journalism-companion-contract.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Companion-/Embed-/QR-Anschluss bleibt explizit an offenen Dossier-/Pruef-/Fragenkern gebunden:
  - kein Wahrheitsprivileg
  - kein Prioritaetsprivileg
  - kein Parallelkanon
- Evidenz: `docs/E150/GOV-JOURNALISM-03_COMPANION_EMBED_QR_CONTRACT_2026-03-29.md`

### Implementierungsstand GOV-JOURNALISM-04 (2026-03-29)
- `GOV-JOURNALISM-04` ist kontraktnah umgesetzt:
  - shared Rollen-/Profil-/Publisher-Contract in `features/anlassraum/journalismRoleProfileContract.ts`
  - route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (`meta.journalismRoleProfile`, `meta.journalismConsistency`)
  - Regressionstests:
    - `apps/web/tests/journalism-role-profile-contract.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Team-/Publisher-Nutzung bleibt professioneller Arbeitskontext ohne epistemische Sondermacht;
  kleine/freie/redaktionelle Formate bleiben anschlussfaehig.
- Evidenz: `docs/E150/GOV-JOURNALISM-04_ROLE_PROFILE_PUBLISHER_CONTRACT_2026-03-29.md`

---

## 7) GOV-MUNI-01 — Buergermeister-Dashboard

### Entscheidungsstand (manifestiert)

#### Startkanon: Monitoring-first
- Das kommunale Dashboard startet als Monitoring-, Kontext- und Transparenzinstrument.
- Kein frueher Verwaltungs-Autopilot, keine verdeckte Prioritaets- oder Wahrheitslogik.
- Anlassraum-/Dossier-/Pruefpfad-Kanon bleibt fuehrend und wird durch Dashboard-Logik nicht uebersteuert.
- Empfehlungen sind im Startkanon nicht primar: spaetere Empfehlungspfade bleiben Folgephase und muessen nicht-bindend, transparent und auditierbar sein.

#### Zielgruppen/Rollen
- Buergermeister/Landrat/kommunale Spitze.
- Dezernat/Fachbereich/Amt als operative institutionelle Rollen.
- Weitere institutionelle Rollen nur im bestehenden Rollen-/Governance-Kanon, ohne Rollenexplosion.
- Gleiche Grundinfrastruktur wie andere professionelle Kontexte, aber eigene Fachlogik fuer Zustaendigkeit, Bearbeitungsstand, Mandat und Umsetzung.

#### Was das Dashboard im Start koennen soll
- Ueberblick ueber laufende und relevante Anlassraeume.
- Kontext- und Statussicht inkl. Reifegrad/Bearbeitungsstand.
- Sichtbare Zustaendigkeiten und Verantwortungsbezug.
- Trends, Dynamik und regionale/thematische Haeufungen.
- Dossier-/Pruefpfad-/Mandats-/Statusverknuepfungen.
- Fortschritt, Fristen und Umsetzungsbezug.
- Offene Fragen, Eventualitaeten und Konfliktlagen sichtbar halten.

#### Was das Dashboard im Start nicht sein soll
- Keine operative automatische Priorisierungsmaschine.
- Kein hidden scoring fuer politische Steuerung.
- Kein privilegierter Verwaltungswahrheitskanon.
- Kein verdecktes Empfehlungs- oder Eingriffsmodell.

#### KPI-/Status-/Verantwortungskanon (Start)
- Legitim: Anzahl relevanter aktiver Anlassraeume, Statusverteilung/Reifegrad, Fristen/Fortschritt, Dossier-/Pruef-/Mandatsanschluss, offene Fragen/Eventualitaeten/Konflikte, regionale/thematische Haeufungen.
- Beteiligungsdynamik bleibt Kontextsignal und ersetzt weder Wahrheit noch Prioritaet.
- Funding-/Ressourcen-/Umsetzungsbezug nur im bereits manifestierten Funding-/Pricing-Kanon.
- Nicht zulaessig: geheime Gesamtscores, Wahrheitsscores, politische Opportunitaetswerte, nicht erklaerbare Prioritaetsraenge oder automatischer Vorrang durch Funding/Lautstaerke/institutionelle Macht.

#### Team-/Rollenanschluss und Sondertools
- Verwaltung/Kommune ist ein teamfaehiger institutioneller Kontext auf gemeinsamer Infrastruktur.
- Redaktion und Verwaltung bleiben fachlich getrennt (Oeffentlichkeitsstrukturierung vs. Zustaendigkeit/Umsetzung/Nachverfolgung).
- Kommunale/institutionelle Sondertools sind zulaessig, wenn transparent eingeordnet, anschlussfaehig, nicht kanonverdraengend und ohne versteckte Sondermacht.
- Keine erzwungene Monokultur; Dashboard-/Verwaltungslogik wird nicht aus Sondertools abgeleitet.

### Folge-Tasks nach manifestierter Entscheidung
- `GOV-MUNI-02`: Dezernatslogik gegen Monitoring-first und klare Verantwortungs-/Zustaendigkeitsgrenzen operationalisieren.
- `GOV-MUNI-03`: Raum-/Prozessstatus Verwaltung auf Anlassraum-/Dossier-/Mandatsfluss mappen, ohne Parallelkanon.
- `GOV-MUNI-05`: Verwaltungsmodus mit transparenten Governance-Gates und ohne Uebersteuerung des Kernkanons.
- `GOV-MUNI-06`: Beamten-/Verwaltungsrollen entlang Team-/Institution-Logik finalisieren, inkl. Audit-/Nachvollziehbarkeit.

### Implementierungsstand GOV-MUNI-02 (2026-03-29)
- `GOV-MUNI-02` ist kontraktnah umgesetzt:
  - shared Dezernats-/Zustaendigkeits-Guardrail-Resolver in `features/anlassraum/municipalResponsibilityGuardrails.ts`
  - route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
  - Regressionstests:
    - `apps/web/tests/municipal-responsibility-guardrails.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Monitoring-first bleibt explizit verankert:
  - keine Wahrheits-/Prioritaets-/Scoring-Sondermacht
  - keine Uebersteuerung von Anlassraum-/Dossier-/Pruefpfad-/Mandatskern
  - Zustaendigkeit als Kontext-/Bearbeitungs-/Nachverfolgungslogik
- Evidenz: `docs/E150/GOV-MUNI-02_DEPARTMENT_RESPONSIBILITY_CONTRACT_2026-03-29.md`

### Implementierungsstand GOV-MUNI-03 (2026-03-29)
- `GOV-MUNI-03` ist kontraktnah umgesetzt:
  - shared Status-/Prozess-Resolver in `features/anlassraum/municipalProcessStatusContract.ts`
  - typed Transition-Validation inkl. Reason-Pflicht fuer nicht-triviale Statuswechsel
  - route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (`meta.municipalProcessStatus`)
  - Regressionstests:
    - `apps/web/tests/municipal-process-status-contract.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Monitoring-first bleibt explizit verankert:
  - nicht-institutionelle Kontexte werden auf `beobachtet` normalisiert
  - keine Wahrheits-/Prioritaetsableitung aus Verwaltungsprozessstatus
  - kein epistemischer Abschluss durch Status `abgeschlossen`
- Evidenz: `docs/E150/GOV-MUNI-03_PROCESS_STATUS_CONTRACT_2026-03-29.md`

### Implementierungsstand GOV-MUNI-05 (2026-03-29)
- `GOV-MUNI-05` ist kontraktnah umgesetzt:
  - shared Verwaltungsmodus-/Governance-Gate-Contract in `features/anlassraum/municipalGovernanceModeContract.ts`
  - typed Transition-Validation fuer Follow-up-/Release-Wechsel inkl. Reason-/Audit-Pflicht
  - route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts` (`meta.municipalGovernanceMode`)
  - Regressionstests:
    - `apps/web/tests/municipal-governance-mode-contract.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Monitoring-first und Guardrails bleiben explizit verankert:
  - kein Wahrheits-/Prioritaetsvorrang aus Institutionstatus
  - keine Uebersteuerung des Anlassraum-/Dossier-/Review-/Mandatskerns
  - Governance-Gates bleiben Bearbeitungs-/Freigabe-/Nachverfolgungslogik
- Evidenz: `docs/E150/GOV-MUNI-05_GOVERNANCE_GATES_CONTRACT_2026-03-29.md`

### Implementierungsstand GOV-MUNI-06 (2026-03-29)
- `GOV-MUNI-06` ist kontraktnah umgesetzt:
  - shared Rollen-/Rechte-/Governance-Profil-Resolver in `features/anlassraum/municipalRoleGovernanceContract.ts`
  - rollenbezogene Governance-Aktionen inkl. Reason-/Audit-Pflichtfeldern
  - Stack-Konsistenzpruefung ueber Responsibility-/Process-/Governance-Mode-/Role-Profil
  - route-nahe Meta-Einbindung in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`:
    - `meta.municipalRoleGovernance`
    - `meta.municipalRoleGovernanceConsistency`
  - Regressionstests:
    - `apps/web/tests/municipal-role-governance-contract.test.ts`
    - `apps/web/tests/municipal-governance-stack-contract.test.ts`
    - `apps/web/tests/admin-governance-anlassraum.route.test.ts`
- Monitoring-first und Guardrails bleiben explizit verankert:
  - Rollen-/Rechteprofil strukturiert Bearbeitung/Nachverfolgung, erzeugt aber keine epistemische Sondermacht
  - keine hidden scoring-/Wahrheits-/Prioritaetslogik
  - keine Uebersteuerung des Anlassraum-/Dossier-/Pruefpfad-/Mandatskerns
- Evidenz: `docs/E150/GOV-MUNI-06_ROLE_GOVERNANCE_PROFILE_CONTRACT_2026-03-29.md`

---

## 8) GOV-ORG-01 — Dossierbasierte Organisationsidentitaet

### Entscheidungs- und Implementierungsstand (2026-03-29)

- `GOV-ORG-01` ist als kontraktnaher Slice umgesetzt.
- Organisationskontext wird als Kontext-/Arbeits-/Traegerstruktur gefuehrt, nicht als eigene Wahrheitsdomaene.
- Anlassraum bleibt Kernraum; Dossier bleibt Oberraum.
- Org-Kontext bleibt anlassraumgebunden und darf optional dossierbezogen erweitert werden.

### Typed Contract-Stand

- Shared Org-Context-/Attachment-Contract:
  - `features/anlassraum/orgContextAttachmentContract.ts`
- Profilrahmen (minimal):
  - `association`
  - `company`
  - `media_house`
  - `institutional_organization`
  - `team_organization`
- Attachment-Modi:
  - `anlassraum_primary`
  - `anlassraum_with_dossier_context`

### Verbindliche Guardrails

- keine Parallel-Domaene neben Anlassraum/Dossier
- keine Wahrheits-/Prioritaets-/Voting-/Faktenstatus-Sondermacht aus Organisationskontext
- keine Verdraengung von Anlassraum-/Dossier-/Pruefpfad-Kernlogik

### Anschluss an bestehende Straenge

- Journalism bleibt teamfaehig anschlussfaehig, ohne Sonderwahrheit.
- Muni bleibt institutionell anschlussfaehig, ohne Organisationsersatz.
- Pricing bleibt segmentseitig als Hint-Ebene angeschlossen (kein Override).
- Funding bleibt projektbezogen (anlassraum-first, dossier-adjacent nur explizit).

### Route-nahe Meta-Einbindung

- `/api/admin/governance/anlassraum` gibt zusaetzlich aus:
  - `meta.orgContextAttachment`
  - `meta.orgContextConsistency`

### Evidenz

- `docs/E150/GOV-ORG-01_DOSSIER_ANLASSRAUM_ORG_CONTEXT_CONTRACT_2026-03-29.md`

### Folge-Task

- `GOV-ORG-02`: offizieller Release-/Trust-Modus auf Basis des neuen Org-Context-Contracts.

---

## 9) GOV-CIVIC-01 — Civic / Creator / Stream / Dossier / Repraesentanz

### Implementierungsstand (2026-03-29)

- `GOV-CIVIC-01` ist als kontraktnaher Baseline-Slice gestartet (`in_progress`):
  - shared Contract: `features/anlassraum/civicCreatorRepresentationContract.ts`
  - Evidenz: `docs/E150/GOV-CIVIC-01_CREATOR_STREAM_REPRESENTATION_CONTRACT_2026-03-29.md`
- Ziel des Slices: kein neues Wahrheits-/Machtsystem, sondern ein belastbarer Arbeits-/Sichtbarkeits-/Repraesentanzrahmen fuer civic/creator/publisher/org Kontexte.

### Verbindlicher Contract-Rahmen

- Work-Profile (nicht-hierarchisch, arbeitsbezogen):
  - `civic_participant`
  - `anlassraum_host`
  - `creator_format_host`
  - `editorial_dossier_host`
  - `publisher_team_context`
  - `org_context_actor`
- Work-Levels:
  - `participation_only`
  - `anlassraum_hosting`
  - `format_companion`
  - `dossier_companion`
  - `organization_followup`
- Repraesentanzachsen sind getrennt:
  - `representationAxes.topic`
  - `representationAxes.region`
  - `separatedAxes = true`, `forbidsCrossAxisShortcut = true`

### Verbindliche Guardrails

- keine Wahrheits-/Prioritaets-/Voting-/Faktenstatus-/Reach-Sondermacht aus Rolle, Kanal oder Reichweite
- keine Parallel-Domaene neben Anlassraum/Dossier
- Dossier bleibt Oberraum; Companion/Stream bleibt an offenen Dossier-/Pruef-/Fragenkern gebunden
- Thema und Region bleiben explizit getrennte Repraesentationsachsen

### Route-nahe Operationalisierung

- `/api/admin/governance/anlassraum` liefert zusaetzlich:
  - `meta.civicCreatorRepresentation`
  - `meta.civicCreatorRepresentationConsistency`
- Konsistenzpruefung bleibt gekoppelt an:
  - journalism role profile
  - org context profile
  - municipal institutional context

### GOV-CIVIC-02 Implementierungsstand (2026-03-30)

- `GOV-CIVIC-02` ist abgeschlossen:
  - shared Lifecycle-/Transition-Contract: `features/anlassraum/civicCreatorLifecycleContract.ts`
  - route-nahe Meta-Ausgabe:
    - `meta.civicCreatorLifecycle`
    - `meta.civicCreatorLifecycleConsistency`
  - Evidenz: `docs/E150/GOV-CIVIC-02_INITIATIVE_LIFECYCLE_TRANSITION_CONTRACT_2026-03-30.md`
- Lifecycle-Zustaende sind explizit modelliert:
  - `initiated`
  - `open_followup`
  - `accompanied`
  - `dossier_linked`
  - `companion_active`
  - `stream_active`
  - `paused`
  - `closed_context`
  - `archived`
- Transitionen sind profile-/capability-basiert gehaertet:
  - kein stilles Upgrade in Dossier/Companion/Stream ohne passende Capability
  - kein `stream_active` fuer institutionelle Org-Kontexte
  - Companion/Stream bleibt Begleitformat, nicht Wahrheitskanal
  - Thema/Region bleibt in allen Lifecycle-Phasen getrennt

### GOV-CIVIC-03 Implementierungsstand (2026-03-30)

- `GOV-CIVIC-03` ist abgeschlossen:
  - shared Impact-/Unterstuetzungs-Contract: `features/anlassraum/civicCreatorImpactSupportContract.ts`
  - route-nahe Meta-Ausgabe:
    - `meta.civicCreatorImpactSupport`
    - `meta.civicCreatorImpactSupportConsistency`
  - Evidenz: `docs/E150/GOV-CIVIC-03_IMPACT_SUPPORT_CONTRACT_2026-03-30.md`
- Explizite Support-Typen (nicht-hierarchisch):
  - `participation_support`
  - `context_support`
  - `format_support`
  - `followup_support`
  - `regional_visibility_support`
  - `documentation_support`
- Lifecycle-gebundene Guardrails:
  - fruehe Phasen (`initiated`, `open_followup`) ohne Format-/Follow-up-Aufwertung
  - `stream_active` bleibt formatbezogen und erzeugt kein Wahrheits-/Prioritaetsprivileg
  - institutionelle Org-Kontexte erhalten keinen Stream-Supportmodus
  - Unterstuetzung bleibt explizit getrennt von Wahrheit, Prioritaet, Abstimmungsgewicht und Faktenstatus

### Folgearbeit (bewusst offen)

- CIVIC-Strang ist kontraktnah fuer den Zielrahmen abgeschlossen.
- Naechster sinnvoller Folgeblock ausserhalb CIVIC: `GOV-ORG-02`.

---

## Priorisierter Entscheidungshebel (Reihenfolge)

Aktuell keine offenen grossen Leitentscheidungsbloecke mehr im Decision-Prep.
