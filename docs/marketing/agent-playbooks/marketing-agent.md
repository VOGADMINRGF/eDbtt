# Marketing Production Agent Playbook

Status: `canonical_agent_guardrails`

## Rolle

Dieses Playbook gilt für jedes Automations-, Assistenz-, Design-, Video- oder Produktionssystem, das Marketing-, Sales-, Social-, Presse- oder Partnerunterlagen für eDebatte und VoiceOpenGov erzeugt.

Das System arbeitet aus dem Repository und erfindet keine Produkt-, CI-, Partner-, Governance-, Pricing- oder Erfolgswahrheit. Anbieter, Modell und Werkzeug sind austauschbar und werden weder in dauerhafte Dateinamen noch in sichtbare Kommunikationsmittel eingeschrieben.

## Pflichtlektüre

Vor jedem Auftrag:

1. `docs/marketing/README.md`
2. `docs/marketing/brand/edebatte-marketing-language.md`
3. `docs/marketing/white-label/brand-profile-contract.md`
4. passende Zielgruppen- oder Kampagnendokumente
5. `apps/web/public/brand/README.md`
6. `apps/web/public/brand/voxy/manifest.json`
7. relevante Produkt-, Pricing-, Governance- und OpenTasks-Quellen

Für Admin-, BI-, CRM- oder Lifecycle-Aufgaben zusätzlich:

- `docs/marketing/admin/marketing-control-plane.md`
- `docs/marketing/schemas/marketing-control-plane.schema.json`
- `docs/E150/Part12_Campaigns_Admin_Telemetry.md`

## Arbeitslogik

```text
Auftrag
→ Zielgruppe und konkretes Problem
→ kanonische Produktwahrheit
→ Marketingfähigkeit und Evidence
→ offene Entscheidungen und Risiken
→ Brandprofil
→ Format und CTA
→ Copy und Storyboard
→ CI-/Voxy-Zuordnung
→ Quellen-, Privacy- und Reality-Check
→ Review-Artefakt
→ anbieterneutraler Exportname
```

## Harte Regeln

- Keine zweite Voxy, KI, Runtime oder Wissensbasis erfinden.
- Keine generische Sci-Fi-, Government-Tech-, Neon-HUD- oder Stock-KI-Bildwelt.
- Bestehende Voxy-Assets nicht spiegeln, invertieren oder umfärben.
- Keine Logos, Partner, Nutzerzahlen, Testimonials oder Reichweiten erfinden.
- Keine Produktfunktion als live oder produktionsreif darstellen, wenn sie nur geplant oder dokumentiert ist.
- Keine Mehrheit als objektive Wahrheit bezeichnen.
- eDebatte, Stakeholderposition, Community-Ergebnis und offizielle VoiceOpenGov-Position klar trennen.
- Kein Auto-Publish und kein Review-Bypass.
- Übersetzungen kennzeichnen und Originale erhalten.
- Pro Asset ein primärer CTA.
- Keine Tool-, Modell-, Chat-, Sitzungs- oder Personennamen in finalen Dateinamen, sofern sie nicht fachlich erforderlich sind.
- Keine vertraulichen Kontaktdaten, Prompts oder Rohnotizen unter `public` ablegen.
- Beteiligungskampagnen und MarketingCampaigns nicht vermischen.
- Brandprofile dürfen Produkt-, Quellen-, Review-, Privacy- und Governance-Regeln nicht überschreiben.

## Formatentscheidung

### Onepager

Verwenden, wenn eine Zielgruppe in 2–4 Minuten Problem, Nutzen, Ablauf, Grenzen und nächsten Schritt verstehen soll.

### Pitchdeck

Verwenden, wenn Gesprächsführung, Kontext, Use Case, Governance, Angebot und nächste Schritte erklärt werden müssen.

### Carousel

Verwenden, wenn eine Argumentation oder ein Debattenstand in 5–7 klaren Schritten erklärt werden soll.

### Short-Video

Verwenden, wenn genau eine zentrale Aussage, Entwicklung oder Produktlogik in 15–45 Sekunden vermittelt werden kann.

### Längeres Video

Verwenden, wenn Quellen, mehrere Perspektiven, Interview oder Dossierstruktur mehr Kontext erfordern.

### Admin-Registry-Eintrag

Verwenden, wenn eine neue Funktion, ein Thema oder ein Partneranlass zunächst als MarketingOpportunity bewertet werden muss. Ein Merge allein reicht nicht als Freigabe.

## Qualitätscheck

Vor Ausgabe müssen alle Fragen mit Ja beantwortet sein:

- Ist das Problem konkret und zielgruppenspezifisch?
- Ist der Nutzen beobachtbar und nicht nur werblich?
- Ist jede produktbezogene Aussage belegt?
- Ist die Marketingfähigkeit korrekt klassifiziert?
- Sind offene Entscheidungen sichtbar markiert?
- Ist ein freigegebenes Brandprofil gewählt?
- Ist die richtige Voxy-Variante gewählt?
- Entspricht das Visual der bestehenden eDebatte-Designsprache?
- Sind Quellen, Originalsprache und Unsicherheit korrekt behandelt?
- Ist der CTA real?
- Ist das Material ohne Fake-Zahlen oder Fake-Partner vollständig?
- Ist eine menschliche Review-Stufe vorgesehen?
- Ist der Dateiname fachlich, stabil und anbieterneutral?
- Ist klar, ob das Asset nur erstellt, freigegeben oder tatsächlich ausgespielt wurde?

## Standardausgabe für neue Kampagnen

Erzeuge mindestens:

- MarketingCampaign-ID und Status
- verknüpfte MarketingOpportunity und Evidence
- Zielgruppe
- Problem
- Nutzenversprechen
- Kernbotschaft
- Nicht-Ziele und offene Entscheidungen
- Brandprofil
- CTA
- Onepager-Struktur
- Pitchdeck-Struktur
- Social-Formate
- Video-Storyboard
- benötigte Assets
- Review-Checkliste
- Distribution-Plan
- KPIs
- anbieterneutrale Exportnamen

## Fehlerfälle

### CI unklar

Keine neuen Bilder generieren. Zuerst vorhandene Assets, Manifest, UI-Screens und Brandregeln prüfen.

### Produktstatus unklar

Aussage als Konzept oder Vision kennzeichnen oder die Opportunity als `proof_required` beziehungsweise `not_marketable` einstufen.

### Partnerstatus unklar

Keine Partnerdarstellung veröffentlichen. Entwurf nur intern mit Prüfbedarf führen.

### Zahlen fehlen

Keine plausibel klingenden Zahlen einsetzen. Stattdessen qualitative Nutzen- und Erfolgssignale verwenden.

### Route oder CTA unklar

Keinen toten oder erfundenen Link vorsehen. CTA als `needs_routing_decision` markieren.

### Brandprofil unklar

Keinen White-Label-Export erzeugen. Kanonisches eDebatte-Profil verwenden oder am Brand-Review stoppen.

### Ausspielstatus unklar

Ein erzeugtes oder freigegebenes Asset niemals als veröffentlicht darstellen. Erst ein reales DistributionRecord belegt die Ausspielung.
