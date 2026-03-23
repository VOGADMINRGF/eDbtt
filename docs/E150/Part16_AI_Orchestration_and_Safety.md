# Part16 AI Orchestration and Safety

> Stand: 2026-03-23
> Status: Canonical Architecture Baseline (verbindlich)
> Verbindlicher Task-Backlog: `docs/E150/OpenTasks.md`

## Zweck

Dieses Part verankert das aktuelle Zielbild fuer KI-Orchestrierung, Social-Safety und Security/Privacy als verbindliche Produkt- und Architekturregeln.

Es gilt fuer:
- `/create` und angrenzende Intake-Fluesse
- Anlassraum/Dossier-uebergaenge
- Match-/CTA-Logik
- Community-/Kontakt-Eskalation
- KI-Provider- und Modellstrategie

## Verbindliche Einordnung

- Der bestehende E150-Orchestrator bleibt der deterministische Hauptfluss.
- Spezialisierte KI-Orchestrierungen kommen zusaetzlich hinzu, nicht als chaotischer Ersatz.
- Das fruehere lineare 11-Stufen-Modell bleibt als technische Unterpipeline/KI-Verarbeitungssicht wertvoll.
- Die kanonische Produktsicht ist das 5-Orchester-Modell in diesem Dokument.

## Zielbild: 5 Orchestrierungen

## 1) Intake-Orchestrierung

Aufgaben:
- Input-Typ erkennen (`freitext`, `url`, `zitat`, `upload`, `material_mix`)
- Segmentierung (Abschnitte, Claims-nahe Einheiten, Quellenhinweise)
- Rueckfragen bei duennem/ambigem Input
- erste Strukturierung ohne stillen Bedeutungsverlust

Verbindliche Ausgaben (typed):
- `inputType`, `languages`, `segments`, `sourceHints`, `missingInfoQuestions`, `confidence`

## 2) Pruef-Orchestrierung

Aufgaben:
- Faktenlage und Quellenbedarf markieren
- Unsicherheiten/Konflikte sichtbar machen
- Evidenzluecken und Cross-Check-Bedarf ausgeben
- keine stille Wahrheitsbehauptung ohne Evidenzpfad

Verbindliche Ausgaben (typed):
- `claims`, `evidenceNeeds`, `uncertainties`, `counterPositions`, `reviewPriority`, `confidence`

## 3) Agenda-/Fragen-Orchestrierung

Aufgaben:
- Diskussionspunkte strukturieren, buendeln, trennen
- fokussierbare Fragen mit hoher Fragequalitaet erzeugen
- Moderation/Medien/Verbaende bei Debatten-Setup unterstuetzen
- abschaltbare oder zu fruehe Punkte sichtbar markieren

Verbindliche Ausgaben (typed):
- `agendaCandidates`, `questionCandidates`, `mergeSuggestions`, `disableSuggestions`, `focusSuggestions`

## 4) Dossier-Orchestrierung

Aufgaben:
- Anlassraum -> Dossier Uebergang
- Claims/Quellen/offene Fragen/Widersprueche verdichten
- review-first/no-auto-publish strikt halten
- keine stille Ueberschreibung von Ursprungstexten

Verbindliche Ausgaben (typed):
- `dossierType`, `groupedClaims`, `evidencePaths`, `openQuestions`, `contradictions`, `eventualities`

## 5) Beteiligungs-/Abstimmungs-Orchestrierung

Aufgaben:
- Eventualitaeten/Optionen schaerfen
- Fragequalitaet fuer Abstimmungsreife pruefen
- Dedupe/Ranking/Exclude vorbereiten
- manipulative Zuspitzung aktiv vermeiden

Verbindliche Ausgaben (typed):
- `optionCandidates`, `dedupeGroups`, `rankingHints`, `exclusions`, `questionQualityAssessment`, `finalizationNeeds`

## Kanonische Produktregeln

- Freistart immer.
- Qualitaetsschicht immer.
- KI-Unterstuetzung immer.
- Menschliche Kontrolle immer sichtbar.
- Keine stille Inhaltsersetzung.
- Kein Auto-Publish.
- Kein stilles Merge.
- Graph-Matching darf CTA-Moment erzeugen, aber keine automatische Zusammenlegung.
- Anlassraum bleibt Arbeitsort, Dossier bleibt Verdichtung.
- Social/Community-Naehe erst nach Sach-Commitment, nicht sofort.

## Social-Safety Guardrails (verbindlich)

- Kein direktes Nutzer-Matching nur auf Basis von:
  - fruehen Erkenntnissen/inhaltlicher Naehe
  - Region
  - aehnlicher Position
- Vor sozialer Naehe ist sichtbares Sach-Commitment erforderlich, z. B.:
  - Beitrag weiter ausarbeiten
  - Quellen ergaenzen
  - Diskussionspunkt konkretisieren
  - Eventualitaeten/Optionen mitbearbeiten
  - Funding-/Founding-Interesse mit inhaltlicher Mitwirkung
- Social-Eskalation nur gestuft:
  - kein ungefragtes DM-Default
  - kein aggressiver Gruppensog
  - opt-in, moderierbar, missbrauchssensibel, nachvollziehbar

Schutzdimension (explizit):
- Schutz vor Belaestigung
- Schutz vor Anmachspruechen
- Schutz vor zweideutigen/manipulativen Narrativen
- Schutz vor sozialem Druck/Vereinnahmung
- besonderer Schutz fuer Frauen
- besonderer Schutz fuer vulnerable und andersdenkende Nutzer

## Security/Privacy/AI-Zoning (verbindlich)

## Secret-Hygiene

- Prod-Secrets/Prod-URIs sind kein lokaler Alltagsstandard.
- Rotation/Hygiene/Risikoaufklaerung ist Pflicht.
- "Lokal funktioniert" ist kein Security-Nachweis.

## Datenzonen

- `PII-Zone`: Identitaet, Kontakte, sensible personenbezogene Daten
- `Content-Zone`: Beitraege, Claims, Quellen, Kontexte
- `AI-Processing-Zone`: nur minimal notwendige, moeglichst entpersonalisierte Arbeitsdaten
- `Trust/Audit-Zone`: Scores, Entscheidungen, Review-/Freigabehistorie, Trace

## Externe KI-Nutzung

- Nur minimal notwendige Ausschnitte an externe Modelle.
- Keine unnoetige PII-Mitgabe.
- Sensible Faelle bevorzugt ueber kontrollierbare/self-hosted/auditierbare Pfade.
- High-impact-Schritte mit Audit-/Trace-Pflicht.

## High-impact Klassen (erhoehte Pflicht)

- Moderation/Hate/Bias
- Trust-/Score-nahe Entscheidungen
- Dossier-/Pruef-Verdichtung
- Publish-/Approval-nahe Vorstufen
- Personen-Matching und Community-Eskalation

## Anbieter-/Modellstrategie pro Orchester (Empfehlung 2026-03)

Hinweis: Dies ist eine priorisierte Architektur-Empfehlung, keine Fake-Sicherheitszusage. DPA/Residency/SLA/Kosten muessen je Anbieter laufend geprueft werden.

| Orchester | Primaer (Qualitaet) | Sekundaer/Fallback | Open-weight/self-host Option | Warum |
| --- | --- | --- | --- | --- |
| Intake-Orchestrierung | OpenAI `GPT-5.x` Thinking-Klasse | Gemini/Anthropic Frontier-Reasoning-Klasse | Llama-3.x/4.x-Instruct Klasse fuer Vorstrukturierung/Klassifikation | Intake braucht robustes Verstehen + gute Rueckfragen; Vorstrukturierung kann guenstiger/self-host laufen |
| Pruef-Orchestrierung | OpenAI Thinking-Klasse + Retrieval-Stack | Gemini/Anthropic + Search-Provider (z. B. You/SearchDB) | Open-weight Modelle fuer Vorannotation, Dubletten, einfache Evidenzmuster | Konflikte/Unsicherheiten sind reasoning-heavy; Retrieval und Quellenpfade muessen reproduzierbar bleiben |
| Agenda-/Fragen-Orchestrierung | OpenAI Thinking-Klasse | Gemini/Anthropic fuer Variantenbildung | Open-weight Modelle fuer Entwurfsvarianten/Clustering | Fragequalitaet und Moderationsnutzen brauchen starke Argumentstruktur; Varianten koennen kostenguensig generiert werden |
| Dossier-Orchestrierung | OpenAI Thinking-Klasse (hoechste Prioritaet) | Anthropic/Gemini Frontier-Reasoning | Nur selektiv self-host (nach eval) | Kritischster Verdichtungsbereich mit hohem Governance-Risiko; hoechste Qualitaet + Reviewpflicht |
| Beteiligungs-/Abstimmungs-Orchestrierung | OpenAI Thinking-Klasse | Gemini/Anthropic | Open-weight Modelle fuer Ranking/Dedupe-Vorstufen | Optionen/Eventualitaeten und Fragequalitaet brauchen gutes Abwaegen; Vorarbeit ist gut parallelisierbar |

## DSGVO-optimierte Betriebsprinzipien

- PII-Redaction vor externem Modellaufruf als Default.
- Prompt/Response-Logging nach Datenzone trennen.
- Tenant-/Scope-Bindung in Auditdaten.
- Providerwechsel ohne Produktlogikbruch durch typed Contracts.
- Self-host Optionen nicht als Selbstzweck, sondern fuer sensible Teilpfade und Kostenkontrolle.

## Offene Research-Fragen (explizit)

- Welche Provider-Kombination erfuellt DPA/Residency-Anforderungen je Datenzone belastbar?
- Welche High-impact-Pfade brauchen zwingend Human-Review vor Persistenz?
- Welche Eval-Suiten sind pro Orchester minimal erforderlich (Qualitaet, Bias, Safety, Kosten)?
- Welche Fallback-Matrix ist bei Provider-Ausfall verbindlich (SLA, Timeout, Circuit-Breaker)?
- Welche Teile der Pruef-/Beteiligungs-Orchestrierung koennen DSGVO-staerker self-hosted laufen, ohne Qualitaetsabfall?
- Welche Route-/Auth-/AI-Auditartefakte werden als Release-Gate verpflichtend?

## Verbindliche Grenzen fuer Folgeslices

- Kein Ausbau von Personen-Matching/Inbox/DM ohne GOV-SAFETY-03.
- Kein grosser Architektur- oder Feature-Slice ohne GOV-SEC-02 Auditlauf.
- Keine Abkuerzung bei no-auto-publish/review-first/approval-first/manual-first.

