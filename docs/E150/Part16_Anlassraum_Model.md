# Part 16 – Anlassraum Model

> Stand: 2026-03-27
> Einordnung: Domain-Addendum zu `docs/E150/Part16.md` (kanonischer Gesamtfluss) und `docs/E150/Part16_AI_Orchestration_and_Safety.md` (Safety/Orchestrierung).

## 1. Definition

Ein Anlassraum ist der offene, strukturierbare Kontextraum eines Themas, Ereignisses, Konflikts oder Projekts.
Er ist die Eingangseinheit fuer:
- Verwaltung
- Journalismus
- Community
- Hinweise
- Events
- Parteien / Organisationen / Verbaende

### 1.1 Surface-Abgrenzung (Ist-Code)

- Anlassraum bleibt der Domaenenbegriff; oeffentlich ist er derzeit primaer ueber `/runden` sichtbar.
- `/anlassraum` ist als offizieller Alias-/Zielbegriff festgelegt und als non-breaking Wrapper auf `/runden` aktiv; es gibt keine harte Migration und keine sofortige Umbenennung.
- Dossier bleibt die strukturierte Verdichtung mit eigener Zielroute (`/dossier/<id>`).
- Swipes bleibt Beteiligungs-/Einordnungsoberflaeche (`/swipes`) fuer Proposals/Eventualities.
- Contribution-Finalize routed serverseitig konditional: mit Dossier nach `/dossier/<id>`, sonst nach `/swipes?fromDraft=<draftId>`.
- Domain-Entscheidung `DOMAIN-HARM-01` (Option B, 2026-03-27) ist in der Matrix dokumentiert: `docs/E150/DOMAIN-HARM-01A_SURFACE_ROUTING_MATRIX_2026-03-27.md`.
- Produktentscheidung `GOV-AI-03` (2026-03-27): Anlassraum ist der oeffentliche thematische Arbeits-/Kontextraum im Produktfluss.
- Nicht Teil von `GOV-AI-03`: ein neuer Anlassraum-Editor-Modus oder neue Routinglogik.

### 1.2 Handoff-Contract (GOV-AI-03B/03C, 2026-03-27)

- `/create` bleibt der einzige kanonische Intake.
- `/runden` bleibt die oeffentliche Surface fuer den Anlassraum-Arbeitskontext.
- `/swipes` bleibt der Beteiligungsmodus (auch bei `fromDraft`-Arrival), nicht der Anlassraum selbst.
- `/dossier/<id>` bleibt die Verdichtung und ist kein Ersatz fuer den Anlassraum-Arbeitskontext.
- Surface-Hinweise und Abschlussmeldungen in Create/Analyze/Swipes/Dossier referenzieren denselben Contract ohne Routing-Aenderung.

## 2. Warum Anlassraum statt Feed oder nur Dossier?

### 2.1 Nicht Feed-first
Feeds produzieren Rauschen, Dubletten und Fragmentierung.
Sie liefern Signale, aber keinen sauber strukturierten Konfliktraum.

### 2.2 Nicht nur Dossier
Dossiers sind zu schwergewichtig als erste Eingangseinheit.
Ein Anlassraum ist der Vorraum, in dem:
- Signale gesammelt,
- Quellen zusammengefuehrt,
- Positionen sichtbar,
- offene Fragen markiert,
- erste Optionen vorbereitet

werden.

## 3. Anlassraum-Typen

Mindestens:
- `policy`
- `event`
- `conflict`
- `investigation`
- `proposal`
- `crisis`
- `community_project`
- `funding_case`
- `monitoring`

## 4. Anlassraum-Rollen

- `creator`
- `moderator`
- `reviewer`
- `stakeholder`
- `observer`

## 5. Pflichtfelder

- `id`
- `entityId`
- `topicKey`
- `regionKey`
- `scope`
- `decisionScope`
- `type`
- `title`
- `summary`
- `originType`
- `status`
- `maturity`
- `ownerType`
- `ownerId`
- `stewardUserId`
- `parentAnlassraumId`
- `dossierId`
- `createdBy`
- `reviewedBy`
- `approvedBy`
- `isPublic`

## 6. Statusmaschine

- `draft`
- `curated`
- `reviewed`
- `approved`
- `active`
- `archived`

Bedeutung:
- `draft`: nur angelegt
- `curated`: Grundstruktur vorhanden
- `reviewed`: inhaltlich geprueft
- `approved`: zur Oeffentlichkeit freigegeben
- `active`: aktiv laufender Raum
- `archived`: abgeschlossen / inaktiv

## 7. Maturity

- `signal`
- `emerging`
- `structured`
- `decision_ready`
- `monitoring`

## 8. Parent/Child Logik

Anlassraeume koennen hierarchisch verknuepft sein.

Beispiele:
- Direkte Demokratie
  - Volksentscheid Berlin
  - Volksentscheid Schweiz
  - EU-Buergerinitiative

- Verkehr Innenstadt
  - Potsdam
  - Berlin
  - Hamburg

## 9. Anlassraum -> Dossier

Regeln:
- ein Anlassraum kann ohne Dossier bestehen
- mehrere Anlassraeume koennen auf ein Dossier referenzieren
- Anlassraum bleibt kontextuell / situativ
- Dossier ist die analytische Verdichtung

## 10. Quellen eines Anlassraums

Ein Anlassraum kann Material aus mehreren Quellen enthalten:
- Feed
- journalistischer Beitrag
- offizielle Quelle
- Community Input
- Tip / Hinweis
- Event / QR / Protokoll
- wissenschaftliche Quelle
- Gegenquelle

## 11. Events als Anlassraeume

Jedes Event kann ein separater Anlassraum sein:
- Buergerabend
- Ausschusssitzung
- Parteitag
- Konferenz
- Verbandstermin
- B2B-Workshop
- Kita-Termin
- Townhall

Das System soll beim Erstellen helfen:
- Anlassvorschlag
- Agenda
- Vergleichsfaelle
- Quellenvorschlaege
- Beteiligungslogik
- Nachbereitung

## 12. Community und Anlassraum

Die Community erzeugt Signale und Inputs, aber nicht beliebig die finale Struktur.
Der Anlassraum waechst aus Community, Journalismus, Verwaltung und Hinweisen – aber bleibt durch Rollen, Review und geschuetzten Narrativkern steuerbar.

## 13. Failure Handling

- keine Relevanz -> archivieren
- doppelter Raum -> mergen
- uebergreifendes Thema -> Parent/Child bauen
- fehlende Quellen -> als schwach markieren
- eskalierender Konflikt -> Moderator / Reviewer einschalten

## 14. Zugeordnete Architekturquellen (harmonisiert 2026-03-26)

- `docs/architecture/feed-anlassraum-output-model.md`
- `docs/event-and-session-model.md`
- `docs/governance-core-model.md`
- `docs/create-intake-unification.md`
