# E150 OpenTasks Intake – Chat-Followups 2026-04-30

Status: Intake / zur Konsolidierung in `docs/E150/OpenTasks.md`
Branch: `fix/create-surface-followup`
Kontext: Repro `edebatte-org`, Chat-Abgleich rund um Pricing, Output Studio, B2G/B2B, Landing und Beteiligungsradar.

Dieses Dokument hält angerissene, noch nicht abschließend ausgearbeitete Punkte fest. Es soll nach Review in die operative Queue von `docs/E150/OpenTasks.md` überführt werden. Keine Task darf ohne Tests/Docs/Guardrails auf `done` gesetzt werden.

## 1. Pricing / B2G / Vergabe

### PR-PRICING-B2G-HIERARCHY-01

- Status: `codex_ready`
- Priority: `high`
- Depends on: `PR-PRICING-B2G-VERGABE-01`
- Scope: `/pricing`, `/pricing/institutionen`, B2G-Konfigurator
- Goal: Die vier B2G-Stufen als fachlich primäre Auswahl sichtbar machen und den Betriebs-/Preisrahmen sekundär stellen.
- Background: Die Entdoppelung ist umgesetzt, aber UI-Hierarchie muss klarer werden: `/pricing?segment=kommunen` ist Bridge, `/pricing/institutionen?segment=kommunen` ist kanonischer B2G-Konfigurator.
- Acceptance Criteria:
  - `/pricing?segment=kommunen` zeigt keine zweite vollständige Kommunen-Paketlogik.
  - `/pricing?segment=kommunen` zeigt `Kommunen & öffentliche Auftraggeber` und CTA zum B2G-Konfigurator.
  - `/pricing/institutionen?segment=kommunen` zeigt `Vergabe- & Ausschreibungspakete` vor dem Preis-/Betriebsrahmen.
  - Vier Stufen sind primär: Beteiligungs-Check, Dossier & Beteiligungsrunde, Beteiligungsbetrieb Kommune, Rahmenvertrag / Vergabepaket.
  - `Empfohlene Konfiguration` wird für Kommunen in `Empfohlener Betriebs- und Preisrahmen` oder ähnlich umbenannt.
  - Dark-/Light-Kontraste sind sauber, keine weißen Karten ohne Dark-Alternative.
  - Guardrails sichtbar: keine Rechtsberatung, keine automatische Ausschreibung, ersetzt keine formelle Beteiligungspflicht.
- Decision open: no

### PR-PRICING-ORDER-PRESELECTION-01

- Status: `codex_ready`
- Priority: `medium`
- Depends on: `PR-PRICING-B2G-VERGABE-01`
- Scope: `/order`, `/vormerken`, Pricing-Handoffs
- Goal: Paket-/Segmentwechsel nach Vorselektion stabil halten und verhindern, dass Nutzer:innen in einer einmal gewählten B2C/B2B/B2G-Option festhängen.
- Acceptance Criteria:
  - Wechsel zwischen `privat`, `journalismus`, `organisationen`, `kommunen` bleibt nach Query-Preselection möglich.
  - `completion=quote_request|conversation_request|direct_order` bleibt erhalten oder wird bewusst normalisiert.
  - Mitgliedschaft/Initiative bleibt getrennt von Paketfreischaltung.
  - Tests decken Segmentwechsel aus `/pricing`, `/pricing/institutionen`, `/vormerken`, `/order` ab.
- Decision open: no

### PR-PRICING-B2C-PRICE-DECISION-01

- Status: `needs_decision`
- Priority: `medium`
- Depends on: `PR-PRICING-B2G-VERGABE-01`
- Scope: B2C Pricing Copy, Part03, `/pricing`
- Goal: Preisänderung 3,99 -> 4,99 und 9,99 -> 14,99 bewusst bestätigen oder zurückrollen.
- Acceptance Criteria:
  - Produktentscheidung dokumentiert.
  - `/pricing`, Part03, Tests und Vormerken-/Order-Copy sind konsistent.
  - MwSt.-Hinweise für B2C/B2B/B2G sind eindeutig.
- Decision open: yes – Preisentscheidung bestätigen.

## 2. Pricing / B2B / Beteiligungsbüros

### PR-PRICING-B2B-PARTNER-01

- Status: `codex_ready`
- Priority: `high`
- Depends on: `PR-PRICING-B2G-VERGABE-01`, `PR-OUT-ENGINE-STUDIO-B2B-01`
- Scope: `/pricing/institutionen?segment=organisationen`, `features/pricing`, Tests, Docs
- Goal: B2B nicht allgemein als Organisationen darstellen, sondern klar auf Beteiligungsbüros, Moderationsbüros, Stadtentwicklungs-/Planungsbüros, Kommunikationsagenturen, Dialogberatungen, Stiftungsprogramme und Medien-/Community-Partner ausrichten.
- Product Principle: eDebatte ersetzt keine Beteiligungsbüros. eDebatte ist Werkzeug-, Dossier-, Studio- und Beteiligungsinfrastruktur für Beteiligungsprofis.
- Packages:
  1. Beteiligungsbüro Starter
  2. Projektpartner Beteiligung
  3. Agentur-/Büro-Betrieb
  4. Partner-/Rahmenmodell
- Acceptance Criteria:
  - Segment `organisationen` zeigt Block `Für Beteiligungsbüros & Dialogprofis`.
  - Copy sagt explizit: `eDebatte ersetzt keine Moderation`.
  - Paketkarten zeigen Für wen, Einsatz, Leistungen, Ergebnis, Bestellbarkeit, CTA.
  - Studio wird als Bestandteil der B2B-Pakete anschlussfähig erwähnt.
  - B2G-Kommunenlogik bleibt unverändert.
  - Tests sichern B2B/B2G-Trennung.
- Decision open: no

### PR-B2J-JOURNALISM-PACKAGES-01

- Status: `codex_ready`
- Priority: `medium`
- Depends on: `PR-OUT-ENGINE-STUDIO-B2B-01`
- Scope: `/pricing?segment=journalismus`, `/pricing/institutionen`, Dossier-/Studio-Output
- Goal: Journalistische Nutzung klarer fassen: Dossiers, Quellenräume, Fakten-/Positionssicht, Output Studio und Beteiligungsfragen für Redaktionen/Medienpartner.
- Acceptance Criteria:
  - Journalismus-Segment unterscheidet sich von B2B-Beteiligungsbüros und B2G-Kommunen.
  - Keine Fake-Factcheck-/Verifikationsversprechen ohne sealed Factcheck.
  - Studio-Outputs sind als redaktionelle Arbeits-/Distributionshilfen beschreibbar.
  - Tests sichern Segment-Copy und CTAs.
- Decision open: no

## 3. Output Engine / Studio

### PR-OUT-ENGINE-STUDIO-B2B-01

- Status: `in_progress`
- Priority: `high`
- Depends on: `PR-OUT-ENGINE-04`, `PR-OUT-ENGINE-06`, `PR-OUT-ENGINE-09`
- Scope: `/dossier/[id]/studio`, `apps/web/src/components/outputEngine`, `features/outputEngine`, Docs/Tests
- Goal: eDebatte Studio als dossiergebundenen Veröffentlichungs- und Distribution-Workspace positionieren, der als B2B-Marketingprodukt für Beteiligungsbüros anschlussfähig ist.
- Acceptance Criteria:
  - Master-Post-first Workflow sichtbar.
  - Kanäle auswählen, Kanalverbindungen, Veröffentlichungsmodus, Verteilplan und Kanal-Versionen sichtbar.
  - Externe Kanäle bleiben export/copy-only ohne echte Adapter.
  - Kein Fake-OAuth, kein Fake-Live-Publish.
  - Dossier bleibt Source of Truth.
  - B2B-Hinweis für Beteiligungsbüros/Dialogprofis sichtbar.
  - Tests für Studio, Social Carousel, Distribution grün.
- Decision open: no

### PR-OUT-ENGINE-STUDIO-PERSISTENCE-01

- Status: `codex_ready`
- Priority: `medium`
- Depends on: `PR-OUT-ENGINE-STUDIO-B2B-01`
- Scope: Studio Drafts, Review, Scheduling, internal state
- Goal: Lokale Component-/localStorage-Zustände in einen stabileren Draft-/Review-/Planungs-Contract überführen.
- Acceptance Criteria:
  - Draft speichern, Review anfordern, Plan übernehmen und Veröffentlichung vorbereiten haben typed state contract.
  - Kein externer Publish-Pfad.
  - Optionaler API-/storage-backed Draft nur, wenn bestehende Auth-/Storage-Konventionen sicher genutzt werden.
  - Tests decken Reload-/State-Recovery ab.
- Decision open: no

### PR-OUT-ENGINE-CHANNEL-ADAPTERS-01

- Status: `needs_decision`
- Priority: `medium`
- Depends on: `PR-OUT-ENGINE-STUDIO-PERSISTENCE-01`
- Scope: Channel adapter registry, connection states, export contracts
- Goal: Echte Kanaladapter vorbereiten, ohne Fake-Veröffentlichung einzuführen.
- Acceptance Criteria:
  - Adapter-Registry unterscheidet `internal`, `export_only`, `config_required`, `connected`.
  - Ohne echte Adapter bleibt UI bei `Kanal nicht verbunden` / `Nur Export/Kopieren möglich`.
  - Website/Dossier, QR/Print und Newsletter-Export werden als erste sichere Kandidaten priorisiert.
  - Externe APIs/OAuth nur nach gesonderter Entscheidung.
- Decision open: yes – Reihenfolge und Anbieter für echte Adapter.

### PR-OUT-ENGINE-EXPORT-ASSETS-01

- Status: `codex_ready`
- Priority: `medium`
- Depends on: `PR-OUT-ENGINE-STUDIO-B2B-01`
- Scope: Social Carousel, QR/Print, Newsletter/Text export
- Goal: Aus den Studio-Kanalversionen echte exportierbare Assets machen.
- Acceptance Criteria:
  - Social Carousel kann als strukturierte Slides/JSON und später PNG/PDF exportiert werden.
  - QR/Print-Handout hat drucknahe Text-/Layoutstruktur.
  - Newsletter/LinkedIn/Facebook/X-Mastodon-Bluesky Versionen sind copy/export-ready.
  - Kein externer Live-Publish.
- Decision open: no

### PR-SOCIAL-PRIVACY-IMPACT-01

- Status: `codex_ready`
- Priority: `medium`
- Depends on: `PR-OUT-ENGINE-STUDIO-PERSISTENCE-01`
- Scope: Studio/Distribution telemetry, privacy-safe impact tracking
- Goal: Wirkung von Outputs messbar machen, ohne Drittanbieter-Tracking oder invasives Nutzertracking.
- Acceptance Criteria:
  - Nur interne, datensparsame Event-Metriken.
  - Keine externen Pixel/Tracker.
  - UTM-/QR-Ziele nur transparent und optional.
  - Dashboard zeigt Export/Copy/Plan/Review, aber keine personenbezogenen Social-Daten ohne Einwilligung.
- Decision open: no

## 4. Landing / Startseite / Positionierung

### PR-LANDING-CLARITY-01

- Status: `codex_ready`
- Priority: `high`
- Depends on: `PR-OUT-ENGINE-STUDIO-B2B-01`, `PR-PRICING-B2G-VERGABE-01`
- Scope: `/`, `/start`, `LandingStart`, LandingAssistant, Marquee/Examples
- Goal: Startseite in 3 Sekunden verständlich machen, ohne vorhandene LandingAssistant-/Marquee-Logik zu zerstören.
- Hero:
  - `Öffentliche Beteiligung beginnt mit einem klaren Dossier.`
  - `eDebatte macht aus Themen, Quellen und offenen Fragen strukturierte Beteiligungsrunden — für Bürger:innen, Kommunen, Medien und Beteiligungsprofis.`
- Target Cards:
  - Bürger:innen: Prüfen, ergänzen, abstimmen.
  - Kommunen: Dossier, Beteiligungsrunde und Ergebnisdokumentation.
  - Beteiligungsbüros: Werkzeug für Quellenräume, QR-Beteiligung und nachvollziehbare Reports.
  - Journalist:innen: Fakten, Positionen und offene Fragen strukturiert sichtbar machen.
- Acceptance Criteria:
  - LandingAssistant bleibt erreichbar.
  - Marquee/Examples werden erklärt, nicht entfernt.
  - Prozesszeile sichtbar: Signal -> Dossier -> Runde -> Mandat -> Umsetzung.
  - CTAs führen zu `/create`, `/pricing?segment=kommunen`, `/pricing/institutionen?segment=organisationen`, Dossier-Beispiel.
  - Dark/Light/Mobile sauber.
- Decision open: no

## 5. VoiceOpenGov / Beteiligungsradar / Anlassraum

### PR-VOG-BETEILIGUNGSRADAR-01

- Status: `codex_ready`
- Priority: `high`
- Depends on: `PR-LANDING-CLARITY-01`, `PR-PRICING-B2G-HIERARCHY-01`
- Scope: VoiceOpenGov Beteiligungsradar, signal-to-dossier contract, admin/operator surface
- Goal: RUWE-Bid-OS-Logik in VoiceOpenGov/eDebatte übersetzen: Ausschreibungen, Beteiligungsanlässe und kommunale Signale werden als Signale erkannt und in Anlassraum/Dossier/Runde/Mandat vorbereitet.
- Flow:
  - Signal/Ausschreibung -> Anlassraum -> Dossier -> Runde -> Mandat
- Acceptance Criteria:
  - Typed `ParticipationSignal` und `ParticipationSignalScore` Contract.
  - Demo-Signale für Ausschreibung, Nahverkehrsplan, Stadtentwicklung, Beteiligungsportal, Medien-/Community-Signal.
  - Admin-Surface `/admin/radar/beteiligung` oder passende Operator-Surface.
  - Kein Auto-Publish, keine automatische Ausschreibung, keine gesetzliche Verfahrensersetzung.
  - Handoff nach `/create?entryIntent=issue_signal&source=participation_radar`.
- Decision open: no

### PR-RADAR-B2G-ACQUISITION-01

- Status: `open`
- Priority: `medium`
- Depends on: `PR-VOG-BETEILIGUNGSRADAR-01`
- Scope: Admin acquisition dashboard, municipal feed/source discovery
- Goal: Späterer Ausbau zu einem Akquise-/Operator-Dashboard für kommunale Beteiligungssignale und Ausschreibungen, anschlussfähig an 11.500 Kommunen.
- Acceptance Criteria:
  - Kein Live-Crawling im ersten Schritt ohne Guardrails.
  - Quellen-/Feed-Registry als Mock/Seed möglich.
  - Region, Kommune, Frist, Quelle, Signaltyp, Relevanz und nächster Schritt sichtbar.
  - Dedupe und no-auto-publish Guardrails.
- Decision open: yes – Datenquellen-/Crawling-Strategie.

## 6. Mandat / VoiceOpenGov Directory / Mitgliedschaft

### PR-MANDAT-REGISTRY-01

- Status: `codex_ready`
- Priority: `high`
- Depends on: `PR-VOG-BETEILIGUNGSRADAR-01`, `PR-LANDING-CLARITY-01`
- Scope: `/mandat` oder mandatsnahe Surface, VoiceOpenGov Directory, Rollen-/Mitgliederlogik
- Goal: Mandate als geteilte, dynamische öffentliche Ergebnis-/Repräsentationsschicht zwischen eDebatte und VoiceOpenGov konzipieren, ohne problematisches `Parteienbuch`-Wording.
- Product Principle:
  - VoiceOpenGov kann autark Mitgliedschaft/Eintrag erlauben.
  - eDebatte kann über Dossier/Runde/Mandat denselben öffentlichen Vertrauens-/Rollenraum füllen.
  - Mandat wird für Verwaltungen, Repräsentant:innen, Journalist:innen, Verbände und Bürger:innen nachvollziehbar, ohne private PII offenzulegen.
- Acceptance Criteria:
  - Begrifflichkeit: `Mandatsverzeichnis`, `öffentliche Rollen-/Mandatsübersicht`, `Mitglieder-/Partnerverzeichnis` statt `Parteienbuch`.
  - Klare Trennung zwischen VoiceOpenGov-Initiative, eDebatte-Tool und Mitgliedschaft/Freischaltung.
  - Mandat entsteht nicht automatisch aus Abstimmung; Review/Freigabe/Statuslogik erforderlich.
  - Tests/Docs für Sichtbarkeit, Rollen und Datenminimierung.
- Decision open: no

### PR-MEMBERSHIP-VOICEOPENGOV-SYNC-01

- Status: `open`
- Priority: `medium`
- Depends on: `PR-MANDAT-REGISTRY-01`
- Scope: Mitgliedschaft, Initiative, Paketfreischaltung, Directory-Sync
- Goal: Sauberer Prozess, wie Mitgliedschaft/Eintrag in VoiceOpenGov und Tool-Zugang in eDebatte getrennt, aber anschlussfähig bleiben.
- Acceptance Criteria:
  - Mitgliedschaft ist optional und getrennt von Paketen.
  - Directory-Eintrag kann autark oder über eDebatte-Kontext entstehen.
  - Keine automatische öffentliche Listung ohne Zustimmung.
  - Freischaltung zum Tool bleibt separater Prozess.
- Decision open: yes – finale Vereins-/Träger-/Datenmodellentscheidung.

## 7. Funding / Partner / Outreach

### PR-FUNDING-PARTNER-FUNNEL-01

- Status: `open`
- Priority: `medium`
- Depends on: `PR-LANDING-CLARITY-01`, `PR-PRICING-B2B-PARTNER-01`
- Scope: Partner-/Förderer-Kommunikation, Stiftung/Medien/Community-Pitch
- Goal: Förderer-/Partnerpfad nicht als Hauptprodukt, aber als strukturierte Landing-/Kontaktlogik vorbereiten.
- Acceptance Criteria:
  - Keine Förderzusage behaupten.
  - Stiftungen/Medien/Partner sehen konkrete Mitwirkungsformen: Themen, Dossiers, Quellen, Community-Runden, Outputs.
  - CTAs führen zu Kontakt/Vormerken, nicht Fake-Antrag.
- Decision open: yes – priorisieren nach Produkt-/Pricing-Klärung.

## Umsetzungsempfehlung / Reihenfolge

1. `PR-PRICING-B2G-HIERARCHY-01` – vor Merge von PR #71 finalisieren.
2. `PR-PRICING-B2B-PARTNER-01` – B2B Beteiligungsbüros/Dialogprofis ausarbeiten.
3. `PR-LANDING-CLARITY-01` – Startseite klar und segmentorientiert machen.
4. `PR-VOG-BETEILIGUNGSRADAR-01` – Beteiligungsradar als separater Signal-/Anlassraum-Slice.
5. `PR-MANDAT-REGISTRY-01` – Mandat/Directory/VoiceOpenGov-Verknüpfung.
6. Output-Studio-Folge: Persistence, Export Assets, Channel Adapter Registry, Privacy-safe Impact.

## Guardrails gesamt

- Kein Fake-Publish.
- Kein Fake-OAuth.
- Keine Rechtsberatung.
- Keine automatische Ausschreibung.
- Keine gesetzliche Verfahrensersetzung.
- Kein Drittanbieter-Tracking ohne bewusste Entscheidung.
- Dossier bleibt Source of Truth.
- Review-/Freigabe-/Statuslogik vor Veröffentlichung oder Mandat.
