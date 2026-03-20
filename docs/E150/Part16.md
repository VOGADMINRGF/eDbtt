# Part16 - Canonical Orchestration Flow

> Stand: 2026-03-20
> Status: Canonical Architecture Baseline
> Verbindlicher Task-Backlog: `docs/E150/OpenTasks.md`

## Zweck

Dieses Part definiert den kanonischen KI-/Produktfluss fuer E150/VoiceOpenGov als einen gemeinsamen Produktfluss mit spezialisierten Unter-Orchestrierungen und einem verpflichtenden Meta-Layer.

Superseded Altannahme:
- sichtbarer Primaersplit `manual/source/ai` als Zielarchitektur.

Kanonische Form:
- `Freistart -> Intake-Orchestrierung -> Pruef-/Qualitaetsschicht -> Graph-Matching -> CTA-/Routing-Layer -> Anlassraum/Dossier/Debatten-Setup/Beteiligung -> Output/UI/API -> Meta-Layer/Audit/Governance`

## A. Warum ein Fluss statt mehrerer Produkt-Modi

- Es gibt keinen primaeren Nutzer-Modus-Split `manual/source/ai` mehr.
- Nutzerseitig startet der Prozess als Freistart.
- Das System erkennt, strukturiert und routed danach intern.
- Orchestrierungen sind interne Qualitaets-, Pruef- und Routing-Schichten.
- Sichtbare menschliche Kontrolle bleibt verpflichtend.

## B. Kanonischer Hauptfluss

Feste Abfolge:

1. Freistart / Input Capture
2. Intake-Orchestrierung
3. Pruef-/Qualitaets-Orchestrierung
4. Graph-Matching
5. CTA-/Routing-Layer
6. Anlassraum / Dossier / Debatten-Setup / Beteiligung
7. Output / UI / API
8. Meta-Layer / Audit / Governance

Architekturregel:
- Der Meta-Layer ist querliegend ueber alle Stufen aktiv, auch wenn er hier als Schritt 8 benannt ist.

## C. Unter-Orchestrierungen

Verbindliche Orchestrierungen:

1. Intake-Orchestrierung
- Input-Typ-Erkennung
- Segmentierung
- Input-Normalisierung
- Rueckfragen nur bei Bedarf
- PII-/Datenschutz-Vorpruefung

2. Pruef-Orchestrierung
- Claims erkennen
- Pruefbar vs. wertend trennen
- Quellenbedarf markieren
- Unsicherheiten und Gegenpositionen markieren
- Truth-/Risk-Hinweise ausgeben

3. Agenda-/Fragen-Orchestrierung
- Diskussionspunkte bilden/buendeln/trennen
- fokussierbare Fragen formulieren
- abschaltbare Punkte markieren
- moderation-/medien-/verbandsgeeignete Agenden vorschlagen

4. Dossier-Orchestrierung
- Anlassraum -> Dossier-Strukturierung
- Claim-Buendelung
- Evidenzpfade
- offene Fragen/Widersprueche/Konflikte
- eventualities/Optionen vorbereiten

5. Beteiligungs-/Abstimmungs-Orchestrierung
- Optionen/Eventualitaeten schaerfen
- Dedupe/Ranking/Exclude vorbereiten
- Fragequalitaet pruefen
- sprachspezifische Mehrdeutigkeit reduzieren

## D. Meta-Layer

Der Meta-Layer laeuft verbindlich querschnittlich und umfasst:
- provenance
- audit trail
- trust/risk flags
- bias/ethics checks
- layman explanation
- human-in-the-loop fuer high-impact Faelle
- monitoring / anomaly detection
- policy / law update readiness

## E. Language-Aware Regeln

- `uiLocale != contentLanguage != sourceLanguage` ist explizit erlaubt und erwartbar.
- Jede semantische Einheit behaelt eine sprachneutrale `canonicalId`.
- Originaltext bleibt unangetastete Primaerquelle.
- Uebersetzungen sind locale-spezifische Renderings, nicht der Ursprung.
- Cross-lingual Matching ist Pflicht.
- Cross-lingual Matching arbeitet semantisch, nicht nur auf String-Ebene.
- Rueckfragen erfolgen in der Nutzersprache.
- Fragequalitaet wird pro Sprache separat geprueft.
- High-impact Fragen muessen pro Sprache separat reviewbar sein.
- Oeffentliche Fragen duerfen sprachlich neu formuliert werden, muessen aber semantisch aequivalent bleiben.

## F. CTA-/Routing-Layer

Verbindliche CTAs:
- zustimmen
- anders sehen
- dossier oeffnen
- anlassraum oeffnen
- perspektive anhaengen
- neu anlegen

Guardrails:
- kein Auto-Publish
- kein Silent-Merge
- kein stilles Ueberschreiben des Ursprungs
- Human control bleibt sichtbar

## G. Wording

- `Runden` ist als Leitbegriff fachlich zu schwach.
- Zielbegriffe:
  - Debatten-Setup
  - Agenda-Sparring
  - Diskussionsarchitektur
  - Anlassraum-Workbench

## Canonical Prompt Contracts

### Prompt Contract 1 - Intake-Orchestrierung

Ziel:
- Input-Typ erkennen
- Sprache/Sprachmix erkennen
- Quelle/Zitat/Freitext/Upload unterscheiden
- Segmente bilden
- PII-/Datenschutzhinweise markieren
- fehlende Angaben identifizieren
- nur Rueckfragen stellen, wenn noetig

Soll-Ausgabe:
- `inputType`
- `languages`
- `segments`
- `sourceHints`
- `piiRisk`
- `missingInfoQuestions`
- `normalizedInputSummary`
- `confidence`

### Prompt Contract 2 - Pruef-Orchestrierung

Ziel:
- Claims erkennen
- pruefbare vs. wertende Aussagen unterscheiden
- Quellenbedarf markieren
- Unsicherheiten markieren
- Konflikte/Gegenpositionen skizzieren
- keine Wahrheit halluzinieren

Soll-Ausgabe:
- `claims[]`
- `nonCheckableOpinions[]`
- `evidenceNeeds[]`
- `uncertainties[]`
- `counterPositions[]`
- `reviewPriority`
- `confidence`

### Prompt Contract 3 - Agenda-/Fragen-Orchestrierung

Ziel:
- aus Material gute Diskussionspunkte bauen
- Punkte buendeln/trennen/entschaerfen
- fokussierbare Fragen formulieren
- abschaltbare Punkte markieren
- medien-/verbands-/moderationsgeeignete Agenden vorschlagen

Soll-Ausgabe:
- `agendaCandidates[]`
- `questionCandidates[]`
- `mergeSuggestions[]`
- `disableSuggestions[]`
- `focusSuggestions[]`
- `moderationNotes[]`

### Prompt Contract 4 - Dossier-Orchestrierung

Ziel:
- Anlassraummaterial in belastbare Dossierstruktur ueberfuehren
- Claims buendeln
- Evidenzpfade aufbauen
- offene Fragen/Konflikte/Widersprueche markieren
- eventualities/Optionen vorbereiten
- `dossierType` ableiten ohne stilles Publizieren

Soll-Ausgabe:
- `dossierType`
- `groupedClaims[]`
- `evidencePaths[]`
- `openQuestions[]`
- `contradictions[]`
- `eventualities[]`
- `recommendedNextStep`

### Prompt Contract 5 - Beteiligungs-/Abstimmungs-Orchestrierung

Ziel:
- Optionen/Eventualitaeten schaerfen
- Dedupe/Ranking/Exclude vorbereiten
- Fragequalitaet pruefen
- sprachspezifische Mehrdeutigkeit reduzieren
- keine manipulative Zuspitzung

Soll-Ausgabe:
- `optionCandidates[]`
- `dedupeGroups[]`
- `rankingHints[]`
- `exclusions[]`
- `questionQualityAssessment`
- `localeWarnings[]`
- `finalizationNeeds[]`

### Prompt Contract 6 - Graph-Matching / CTA Layer

Ziel:
- Input gegen Claims/Anlassraeume/Dossiers/Perspektiven matchen
- Match-Staerke bewerten
- passenden CTA-Moment erzeugen
- kein stilles Zusammenfuehren

Soll-Ausgabe:
- `matches[]`
- `matchStrength`
- `matchType`
  - `exact_claim`
  - `related_claim`
  - `same_anlassraum`
  - `related_dossier`
  - `duplicate_risk`
  - `no_match`
- `matchEntityType`
  - `claim`
  - `anlassraum`
  - `dossier`
  - `perspective`
  - `question`
- `reasons[]`
- `suggestedCtas[]`
- `newStrandRecommended` (bool)
- `attachAsPerspectiveRecommended` (bool)

Regel:
- `matchStrength` allein reicht nicht; die CTA-Ableitung muss auch `matchType` und `matchEntityType` beruecksichtigen.

## Shared Output Envelope (verbindlich fuer alle Orchestrierungen)

Jede Orchestrierung liefert zusaetzlich zu ihren fachlichen Feldern immer:
- `schemaVersion`
- `orchestrator`
- `runId`
- `inputRef`
- `sourceLanguage`
- `contentLanguage`
- `uiLocale`
- `confidence`
- `uncertaintyFlags[]`
- `requiresHumanReview`
- `noAutoPublish = true`
- `noSilentMerge = true`
- `provenanceRefs[]`
- `createdAt`

Regeln:
- Kein kritischer Orchestrierungsuebergang nur mit losem Freitext.
- Jeder Output muss audit-, replay- und routingfaehig sein.
- Der Envelope ist providerunabhaengig zu formulieren.

## Governance Guardrails (verbindlich)

- no auto publish
- review-first
- approval-first
- manual-first
- provenance-by-default
- audit trail pro Schritt

## Strategischer Leitsatz

Die eigentliche Unabhaengigkeit entsteht zuerst durch:
- eigene Contracts
- eigene Evals
- eigene Audit-Logik
- eigene Graph-/Governance-Struktur

Nicht zuerst durch ein eigenes Foundation Model.

Daraus folgt:
- Providerwechsel muss architektonisch moeglich sein
- Model-Souveraenitaet ist nachgelagert
- Produkt- und Governance-Souveraenitaet kommen zuerst

## Scope-Grenze (hard-deferred)

- Stage-2/Stage-3 (Self-Host/Souveraenitaet) sind bewusst nicht Teil der aktuellen Priorisierung.
- Diese Bloecke duerfen erst nach vollstaendigem Kernbetrieb, stabiler Live-Baseline und abgeschlossenen Kern-PR-Wellen gezogen werden.
