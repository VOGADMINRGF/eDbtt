# V3 Voxy Runtime Path Decision Pack

Datum: 2026-07-12
Task: `V3-VOXY-RUNTIME-PATH-DECISION-PACK-01`
Status: done
Review class: Orange / decision package only

## Ziel

Die review-first geschlossene, aber weiterhin deaktivierte Voxy-Video-Kette in
eine belastbare Runtime-Entscheidungsunterlage uebersetzen, ohne Rendering,
Provider, Queue, Upload, Scheduling, Publish, Social Posting, Billing oder
Feature-Flags zu aktivieren.

## Aktueller ehrlicher Stand

- `V3-VOXY-VIDEO-BRIEFING-FLOW-MASTER-CLOSURE-01` ist als
  `review_first_architecture_complete` dokumentiert.
- `runtimePending` bleibt `true`.
- `runtimeEnabled` bleibt `false`.
- `previewRendered`, `uploaded`, `scheduled`, `socialPosted` und `published`
  bleiben `false`.
- Provider-, Queue-, Worker-, Upload-, Scheduling-, Observability- und
  Cost-/Credit-Pfade existieren bisher nur als Review-/Audit-/Noop-Vertraege.

Relevante Repo-Wahrheit:

- Provider-Interfaces existieren in
  `apps/web/src/features/voxyVideo/contracts.ts`.
- Review-first Closure und Readiness-Layer existieren in
  `apps/web/src/features/create/voxyVideoBriefingFlowMasterClosureContract.ts`.
- Queue-, Provider-, Cost-, Storage-, Upload-, Scheduling-, Observability- und
  Cutover-Gates liegen bereits als deaktivierte Contract-/Store-/Panel-Slices
  vor.
- Es gibt weiterhin keinen echten Voxy-Render-Provider, keine render-spezifische
  Secret-Wahrheit, keine Voxy-Render-Queue/Worker-Runtime, keine belastbare
  Provider-Pricing-Wahrheit und keine Billing-/Debit-Runtime.

## Harte Guardrails

Diese Guardrails bleiben bis nach einer separaten Produktentscheidung bindend:

- kein Runtime-Start
- kein Provider-Call
- kein Secret-Read fuer Render-Provider
- kein Render
- kein Media-Write
- kein Upload
- kein Scheduling
- kein Publish
- kein Social Posting
- keine Kosten- oder Credit-Buchung
- keine Feature-Flag-Aktivierung
- kein Auto-Publish und kein Review-Bypass

## Entscheidungsrahmen

Bewertet werden vier Pfade:

### Option A - eigener Renderer / FFmpeg / HTML-to-video / TTS

- Staerken:
  - maximale Branding- und Pipeline-Kontrolle
  - geringere strategische Abhaengigkeit von einem einzelnen Video-Provider
  - mittelfristig bessere Anschlussfaehigkeit fuer spaetere Self-Host-/EU-Pfade
- Schwaechen:
  - hoechster Initialaufwand fuer Rendering, Voice, Captioning, Retry,
    Worker-Betrieb, Storage, Cost Metering und Qualitaetssicherung
  - langsamerster Pfad zur ersten ehrlichen Preview
  - hohes Risiko einer langen Zwischenphase mit halbfertiger oder instabiler
    Fake-Runtime
- Bewertung:
  - Umsetzungsaufwand: sehr hoch
  - Time-to-first-preview: schlecht
  - Branding-Kontrolle: sehr gut
  - Drittanbieterabhaengigkeit: gut
  - Datenschutz / EU / DPA: potenziell gut, aber nur mit eigenem Ops-Aufwand
  - Kostenmodell: spaeter gut steuerbar, anfangs unsicher
  - Qualitaet / Konsistenz: anfangs riskant
  - Automatisierbarkeit: spaeter gut, anfangs teuer
  - Review-first Kontrollierbarkeit: gut
  - Risiko fuer Fake-Runtime: hoch
  - Pfad Richtung V3-100-Prozent: stark, aber spaet

### Option B - externer Avatar-/Video-Provider

- Staerken:
  - schnellster Pfad zur ersten realen Preview
  - geringerer Anfangsaufwand fuer Video-/Avatar-/Voice-Runtime
  - geringere eigene Betriebsverantwortung im ersten Schritt
- Schwaechen:
  - staerkste Drittanbieterabhaengigkeit bei Qualitaet, Preis, SLA und
    Produktgrenzen
  - Datenschutz-/DPA-/Residency-Risiken muessen fuer jeden Provider explizit
    vorab geklaert werden
  - Branding- und Formatkontrolle bleibt begrenzt
  - hohes Risiko, dass Providergrenzen spaeter den review-first Produktkern
    verzerren
- Bewertung:
  - Umsetzungsaufwand: mittel
  - Time-to-first-preview: sehr gut
  - Branding-Kontrolle: mittel
  - Drittanbieterabhaengigkeit: schwach
  - Datenschutz / EU / DPA: nur nach harter Vorpruefung tragfaehig
  - Kostenmodell: anbieterabhaengig, potentiell volatil
  - Qualitaet / Konsistenz: anbieterabhaengig
  - Automatisierbarkeit: gut
  - Review-first Kontrollierbarkeit: mittel
  - Risiko fuer Fake-Runtime: mittel
  - Pfad Richtung V3-100-Prozent: schnell, aber strategisch fragiler

### Option C - Hybrid: eigene Script-/Asset-/Review-Logik, externer Render

- Staerken:
  - bestehender Repo-Stand passt bereits gut zu dieser Trennung:
    review-first Logik lokal, spaetere Ausfuehrung ueber austauschbaren Adapter
  - deutlich schnellere erste Preview als Option A
  - bessere Branding-, Source-Pack-, Review- und Publish-Kontrolle als Option B
  - begrenzt Lock-in, weil Kernlogik, Gates, Handoffs und Surface-Wahrheit im
    Repo bleiben
- Schwaechen:
  - weiterhin externe Providerabhaengigkeit im Render-Schritt
  - braucht saubere Adapter-, Queue-, Storage-, Cost- und Secrets-Grenzen
  - braucht disziplinierte Guardrails, damit Preview-Render nicht schleichend zu
    Auto-Publish oder Fake-Runtime wird
- Bewertung:
  - Umsetzungsaufwand: mittel bis hoch
  - Time-to-first-preview: gut
  - Branding-Kontrolle: gut
  - Drittanbieterabhaengigkeit: mittel
  - Datenschutz / EU / DPA: besser steuerbar als B, aber weiter providerabhaengig
  - Kostenmodell: besser entkoppelbar als B
  - Qualitaet / Konsistenz: gut
  - Automatisierbarkeit: gut
  - Review-first Kontrollierbarkeit: sehr gut
  - Risiko fuer Fake-Runtime: am besten beherrschbar
  - Pfad Richtung V3-100-Prozent: am ausgewogensten

### Option D - spaeterer eigener Voxy-Avatar als Pipeline

- Staerken:
  - starkes langfristiges Marken- und Produktzielbild
  - hohe strategische Unabhaengigkeit im Endzustand
- Schwaechen:
  - fuer den naechsten Slice kein realistischer Startpfad
  - kombiniert fast alle Komplexitaeten aus A mit zusaetzlicher Avatar-,
    Asset- und Style-Governance
  - zu hohes Risiko, den Gesamtpfad Richtung echte erste Preview zu verlangsamen
- Bewertung:
  - Umsetzungsaufwand: extrem hoch
  - Time-to-first-preview: sehr schlecht
  - Branding-Kontrolle: sehr gut
  - Drittanbieterabhaengigkeit: spaeter gut
  - Datenschutz / EU / DPA: spaeter gut steuerbar
  - Kostenmodell: anfangs schlecht kalkulierbar
  - Qualitaet / Konsistenz: erst spaeter belastbar
  - Automatisierbarkeit: spaeter gut
  - Review-first Kontrollierbarkeit: gut
  - Risiko fuer Fake-Runtime: hoch
  - Pfad Richtung V3-100-Prozent: sinnvoll nur als spaetere Ausbauphase

## Vergleich in Kurzform

| Pfad | Erste Preview | Branding-Kontrolle | Drittanbieterabhaengigkeit | Datenschutz-/DPA-Risiko | Fake-Runtime-Risiko | Gesamturteil |
| --- | --- | --- | --- | --- | --- | --- |
| A Eigenbau | langsam | sehr hoch | niedrig | mittel | hoch | strategisch stark, fuer jetzt zu schwer |
| B Externer Full-Provider | schnell | mittel | hoch | mittel bis hoch | mittel | schnell, aber strategisch fragil |
| C Hybrid | gut | gut | mittel | mittel | niedrig bis mittel | beste Balance fuer den naechsten Realisierungspfad |
| D Eigener Voxy-Avatar spaeter | sehr langsam | sehr hoch | spaeter niedrig | mittel | hoch | Zielbild, nicht Startpfad |

## Empfehlung

Empfohlen wird **Option C als kanonischer Startpfad**:

- lokale Script-, Evidence-, Review-, Approval-, Publish- und Surface-Logik
  bleiben SSOT im Repo
- ein spaeterer Render-Schritt wird ueber einen austauschbaren externen
  Adapter angeschlossen
- Option D bleibt ausdruecklich spaeterer Ausbaupfad
- Option A bleibt langfristige Souveraenisierungsoption, aber nicht erster
  Runtime-Slice

Warum Option C:

1. Sie nutzt den vorhandenen review-first Architekturstand statt ihn fuer einen
   Vollprovider oder fuer Eigenbau neu zu verbiegen.
2. Sie reduziert das Risiko einer Fake-Runtime, weil der bestehende Kern aus
   Review, Source-Pack, Approval, Upload-, Scheduling- und Cutover-Gates lokal
   kontrolliert bleibt.
3. Sie erlaubt die erste echte Preview frueher als Option A, ohne den gesamten
   Produktkern an einen Provider auszulagern.
4. Sie haelt den Pfad zu spaeterer Eigenstaendigkeit offen, statt frueh
   Full-Provider-Produktgrenzen zu kanonisieren.

## Offene Produktentscheidungen vor jedem Implementierungsslice

Diese Punkte muessen explizit entschieden werden, bevor ein Folge-Slice auf
`codex_ready` gehen darf:

1. Welche Render-Klasse ist der erste Zielmodus?
   - Avatar-Video
   - Voiceover + Caption Video
   - reines Script/Storyboard-Preview
2. Welche Datenschutz-/Residency-Minimalregeln gelten fuer einen externen
   Render-Schritt?
   - DPA-Pflicht
   - EU-/EWR- oder gleichwertige Residency-Anforderung
   - verbotene Datentypen / PII-Grenzen
3. Welche Kostenlogik ist fuer den Startkanon zulaessig?
   - nur interne Pilotfreigabe
   - org-/plan-scoped Freischaltung
   - explizite manuelle Einzelgenehmigung
4. Welche Freigaberollen muessen vor Render, Upload, Scheduling und Publish
   separat vorliegen?
5. Welche Storage-/Retention-/Delete-Regeln gelten fuer Preview-Dateien?
6. Ob der erste Runtime-Slice nur `first preview render` oder bereits
   `preview -> upload -> scheduling` umfassen darf.

## Konkrete Folge-Slices

### 1. `V3-VOXY-RUNTIME-PATH-CHOICE-02` (`needs_decision`)

- Formale Produktentscheidung fuer Option C oder bewusst abweichenden Pfad
- verbindliche Guardrails fuer Datenschutz, Kosten und Freigaberollen
- Festlegung des ersten Zielmodus `script-only preview` vs.
  `voiceover/caption preview` vs. `avatar preview`

### 2. `V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03` (`blocked`)

Nur nach expliziter Pfadentscheidung:

- Adaptervertrag fuer einen externen Render-Schritt konkretisieren
- server-only Queue-/Worker-/Idempotency-/Retry-Rahmen fuer genau einen
  Preview-Lauf vorbereiten
- Storage-/Upload-/Retention-/Delete-Pfad fuer Preview-Artefakte klar ziehen
- weiterhin kein Publish- oder Social-Cutover

### 3. spaeterer Ausbaupfad (noch nicht freigegeben)

- Cutover-/Observability-/Cost-Metering-Haertung
- begrenzter operator-gesteuerter First-Preview-Pilot
- erst danach eventuelle Scheduling-/Publish-Folgeslices
- Option D als spaetere Avatar-Souveraenisierung separat behandeln

## Risiken und bewusst offen gelassene Punkte

- Ohne echte Produktentscheidung wuerde jeder naechste Runtime-Slice Gefahr
  laufen, still einen Provider, Kostenpfad oder Datenschutzstandard zu
  kanonisieren.
- Die vorhandenen Noop-Vertraege reduzieren Architekturunsicherheit, ersetzen
  aber keine DPA-, Residency-, Cost- oder Ops-Entscheidung.
- Der Gesamtstand verbessert die Entscheidungsreife, aber nicht den echten
  Runtime-Reifegrad. V3 ist nach diesem Slice weiterhin nicht `100 %` fertig.

## Unabhaengige Review-Empfehlung

Ja. Vor jeder spaeteren Umsetzung ist unabhaengige Review erforderlich, weil der
Folgepfad Architektur, externe Services, potenzielle Kosten, Datenverarbeitung,
Storage und spaetere Publish-Gates beruehrt.
