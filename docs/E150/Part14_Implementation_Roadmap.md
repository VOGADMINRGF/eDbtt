# E150 Master Spec – Part 14: Implementation Roadmap

> Status-Hinweis (2026-03-19): Dieser Part beschreibt die empfohlene Reihenfolge der Umsetzung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`.

## 1. Ziel dieses Parts

Nicht nach Zielgruppe zuerst bauen, sondern nach Architektur-Abhaengigkeit.

Empfohlene Reihenfolge:

1. Governance Core
2. Anlassraum / Event / Feed Review
3. Kommune / Verwaltung
4. Pricing / Billing / Funding / Signals
5. Journalismus
6. Organisationen / Verbaende / Civic

## 2. Warum diese Reihenfolge?

### 2.1 Governance vor Verticals
Wenn Journalismus, Kommune und Organisationen zuerst separat gebaut werden, entstehen drei Modelle.
Deshalb zuerst:
- gemeinsames Lifecycle-Modell
- Trust / Rollen / Raumtypen
- Anlassraum / Dossier Trennung

### 2.2 Anlassraum vor Automatik
Bevor Automatik aus Feed oder KI irgendetwas erzeugt, muss der Anlassraum als Kernobjekt stehen.

### 2.3 Kommune vor Journalismus
Kommunen / Verwaltung sind der staerkste direkte Pilot- und Umsatzpfad.
Journalismus baut danach auf denselben Kern auf.

### 2.4 Surface-Kanon (DOMAIN-HARM-01, Option B)
- `Anlassraum` bleibt der Domaenenbegriff.
- `/runden` bleibt die kanonische oeffentliche Surface.
- `/anlassraum` ist offizieller Alias-/Zielbegriff ohne harte Migration im Ist-Stand.

### 2.5 KI-Orchestrierungs-Kanon (GOV-AI-04, Option A)
- Startkanon fuer den produktiven Multi-Orchestration-Hauptfluss ist `strict staged`.
- Direkte Providerpfade ausserhalb dieses Hauptflusses bleiben Ausnahme-/Legacy-Nebenpfade.
- Keine implizite Gleichstellung direkter Providerpfade mit dem produktiven Hauptfluss.

## 3. Welle 1 — Governance Foundation

### Ziele
- GOV-01
- GOV-02
- DOCS-GOV-01

### Deliverables
- Entity-Modell
- Anlassraum-Grundmodell
- Dossier-Abgrenzung
- Trust-Level
- Publish Gates
- OpenTasks + Parts synchron

## 4. Welle 2 — Anlassraum / Event / Feed Review

### Ziele
- GOV-ANLASS-01 bis 04
- GOV-EVENT-01 und 02

### Deliverables
- Anlassraum anlegen / reviewen / publizieren
- Feed-Review Queue
- Event-/QR-/Protokoll-Fluss
- Anlassraum -> Dossier Anbindung

## 5. Welle 3 — Kommune / Verwaltung

### Ziele
- GOV-MUNI-01 / 02 / 03 / 05 / 06

### Deliverables
- Buergermeister-Dashboard
- Verwaltungsmodus
- Dezernatslogik
- Prozessstatus
- organisatorische Rollenzuordnung

## 6. Welle 4 — Pricing / Funding / Signals

### Ziele
- GOV-PRICING-01 / 02
- GOV-FUNDING-01 / 02 / 03
- GOV-SIGNAL-01

### Deliverables
- Hybrid-Pricing
- Admin Pricing Control
- Pricing-Control-Contract (Segment/Fee/Caps/Overrides/KPI/Explainability/Audit)
- Signals / Thresholds / Trigger
- Funding Intent / Readiness / Matching / Impact

Hinweis (Stand 2026-03-29):
- `GOV-PRICING-01` ist manifestiert.
- `GOV-PRICING-02` ist als Runtime-Folge vorbereitet; der operative Contract liegt in
  `docs/E150/GOV-PRICING-02_ADMIN_PRICING_CONTROL_CONTRACT_2026-03-29.md`.

## 7. Welle 5 — Journalismus

### Ziele
- GOV-JOURNALISM-01 bis 04

### Deliverables
- source_anchor
- Truth Guardrails
- journalistische Anlassraeume
- Embed / QR Companion
- Redaktionsprofil

## 8. Welle 6 — Organisationen / Verbaende / Civic

### Ziele
- GOV-ORG-01 / 02
- GOV-CIVIC-01 / 02 / 03

### Deliverables
- dossierbasierte Organisationsidentitaet
- offizieller Organisationsmodus
- Initiative-Lifecycle
- Impact-/Unterstuetzungslogiken

## 9. Pilotdefinition

Ein Pilot ist erfolgreich, wenn:

- eine Entity angelegt werden kann,
- mindestens ein Anlassraum sauber reviewt und publiziert wird,
- Signals gesammelt werden,
- ein Funding Intent oder ein Event-/Beteiligungsfluss stattfindet,
- ein Dossier oder eine Nachbereitung entsteht.

## 10. Was explizit nicht zuerst gebaut wird

- keine 11.000 fertigen Seiten
- keine Vollautomatik ohne Review
- kein rein feed-getriebenes System
- kein Coin-/Gamification-first Modell
- keine komplexen Outcome-Abrechnungen vor stabilem Kern

## 11. Definition of Done fuer die erste echte Umsetzungswelle

- 1 Gemeinde oder Organisation sauber manuell anlegen
- 1 Anlassraum sauber anlegen
- Feed-Items reviewen und zuordnen
- Review / Approval / Publish
- Signals sammeln
- Funding Intent sammeln
- optional Funding starten
- Admin kann Pricing / Rabatte steuern

## 12. Repo-Themenzuordnung fuer Part01-16 (harmonisiert 2026-03-26)

| Part | Primärthema | Zugeordnete `/docs`-Quellen |
| --- | --- | --- |
| Part01 | Governance, Leitbild, Review-first | `docs/governance-core-model.md`, `docs/truth-guardrails.md`, `docs/surface-architecture.md` |
| Part02 | Rollen, Levels, Gating | `docs/auth/admin-flows.md` (Rollen-/2FA-Gates) |
| Part03 | B2C Access/Pricing | `docs/E150/membership_pricing.md` (B2C-Ableitung) |
| Part04 | B2G/B2B/B2O/Journalismus/Civic | `docs/municipality-operating-model.md`, `docs/mayor-dashboard.md`, `docs/journalism-open-dossier-model.md`, `docs/organization-and-association-publishing.md`, `docs/civic-initiative-lifecycle.md` |
| Part05 | Orchestrator, Intake, Post-Finalize-Routing (konditional) | `docs/create-intake-unification.md`, `docs/architecture/feed-anlassraum-output-model.md` |
| Part06 | Consequences + Themenkatalog | `docs/E150/Part06_Themenkatalog_und_Zustaendigkeiten.md` |
| Part07 | Graph/Dossier/Report-Kern | `docs/architecture/TRIMONGO_GRAPH_CONTRACT.md`, `docs/ops/dossier-hardening-v1_1.md`, `docs/ops/mega-hardening-plan.md` |
| Part08 | Eventualitaeten/Decision Trees | (direkt im Part gepflegt, keine separate Drift-Quelle) |
| Part09 | Community Research | `docs/E150/Pilot.md` (Research-Block), `docs/E150_NEEDS_REVIEW.md` |
| Part10 | Responsibility Navigator | `docs/E150/Part06_Consequences_Fairness.md`, `docs/E150/Part06_Themenkatalog_und_Zustaendigkeiten.md` |
| Part11 | Streams/Event-Integration | `docs/event-and-session-model.md`, `docs/mobile-navigation-pattern.md` |
| Part12 | Campaigns/Admin/Telemetry/Operator | `docs/auth/admin-flows.md`, `docs/surface-architecture.md` |
| Part13 | I18N/A11y/Community/Social | `docs/E150/ContentTranslationLifecycle.md`, `docs/account-social-consolidation.md`, `docs/mobile-navigation-pattern.md` |
| Part14 | Roadmap/Wellen | `docs/E150/OpenTasks.md`, `docs/E150/Pflichtenheft.md` |
| Part15 | Laufende PR-/Drift-Evidenz | `docs/E150/OpenTasks.md`, `docs/E150/Pilot.md` |
| Part16 | KI-Orchestrierung, Anlassraum, CTA/Review/Beteiligung | `docs/E150/Part16_AI_Orchestration_and_Safety.md`, `docs/E150/Part16_Anlassraum_Model.md`, `docs/architecture/topic-round-*.md`, `docs/architecture/feed-anlassraum-output-model.md`, `docs/create-intake-unification.md` |
