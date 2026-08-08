# RePro in eDebatte — formale Ontologie und Reason-Graph-Vertrag

**Status:** Architekturvorschlag / docs-only / keine Runtime-Aktivierung  
**Datum:** 2026-08-06  
**Bezug:** #587, #552, bestehende Create-/Dossier-/Reason-Graph-/Provenienz-Verträge

## 1. Verbindliche Produktentscheidung

RePro ist **kein separates Produkt, keine zweite Runtime und kein zweiter Graph**.

RePro bezeichnet innerhalb von eDebatte die kanonische Prozessgrammatik und Ontologie für nachvollziehbare gesellschaftliche Erkenntnis- und Entscheidungsprozesse.

```text
RePro = zulässige Objekte, Beziehungen, Zustände, Übergänge und Gates
Reason Graph = konkrete Instanzen dieser Objekte und Beziehungen
eDebatte = operative Referenzimplementierung
Vote4Gov = öffentliche redaktionelle Lesesicht
Voxy = verständliche und mediale Lesesicht
VoiceOpenGov = gesellschaftlicher Anwendungs- und Mitgliederraum
```

Alle Anwendungen lesen aus derselben eDebatte-Fallbiografie. Es entstehen keine parallelen Wahrheiten.

## 2. Grundsatz

Ein Artikel, ein Dossier, eine Debatte, ein Briefing und ein Voxy-Beitrag sind keine voneinander unabhängigen Wissensobjekte. Sie sind unterschiedliche, revisionsgebundene Sichten auf dieselbe nachvollziehbare Fallbiografie.

Die kanonische Leserichtung lautet:

```text
Realitätsbezug
→ Quelle
→ Quellsegment
→ Aussage
→ atomarer Claim
→ Evidenzrelation
→ Interpretation
→ Wertkonflikt
→ Option
→ Präferenz/Beteiligungsergebnis
→ institutionelle Entscheidung
→ Umsetzung
→ Wirkung
→ Lernen/Korrektur
```

Kein späterer Knoten darf die Belegstärke eines früheren Knotens eigenmächtig erhöhen.

## 3. Unverhandelbare Ebenentrennung

### 3.1 Gesagt

Dokumentiert, wer was wann in welcher Quelle geäußert oder veröffentlicht hat.

### 3.2 Nachweisbar

Prüft, ob eine atomare Behauptung durch geeignete Quellen exakt, teilweise oder nicht gestützt wird.

### 3.3 Gedeutet

Ordnet mögliche Mechanismen, Ursachen, Erklärungen und historische Vergleiche ein.

### 3.4 Abgewogen

Macht Werte, Zielkonflikte, Betroffenheiten, Rechte, Risiken und Nebenwirkungen sichtbar.

### 3.5 Bevorzugt

Dokumentiert Präferenzen, Priorisierungen, Empfehlungen und Beteiligungsergebnisse mit klarer Ergebnisart.

### 3.6 Entschieden

Zeigt das rechtliche oder organisatorische Mandat, den Beschluss, die Begründung und Abweichungen vom gesellschaftlichen Output.

### 3.7 Umgesetzt

Dokumentiert Verantwortliche, Maßnahmen, Ressourcen, Fristen, Blockaden und Änderungen.

### 3.8 Gelernt

Erfasst Wirkung, Nebenwirkung, neue Evidenz, Korrektur, Revision und erneute Öffnung.

Mehrheiten entscheiden keine Tatsachen. Faktenprüfung ersetzt keine Wertentscheidung. Beteiligung ersetzt kein Mandat. Entscheidung ersetzt keine Wirkung.

## 4. Kanonische Objektklassen

Die folgenden Klassen sind fachlich kanonisch. Die technische Abbildung muss bestehende Models und Stores erweitern, nicht duplizieren.

### 4.1 Fall- und Kontextobjekte

- `Case`: fortlaufende Fallbiografie eines gesellschaftlichen Problems oder Entscheidungsprozesses.
- `Topic`: kanonischer Themenraum; kein Ersatz für den Case.
- `Jurisdiction`: räumliche und rechtliche Zuständigkeit.
- `TimeScope`: Zeitraum, Stichtag oder historische Phase.
- `PopulationScope`: betroffene oder untersuchte Grundgesamtheit.
- `ContextBoundary`: explizite Übertragungs- und Geltungsgrenze.

### 4.2 Akteurs- und Verantwortungsobjekte

- `Actor`: Person, Institution, Organisation oder informelle Gruppe.
- `Role`: Funktion in einem konkreten Case, nicht dauerhafte politische Profilzuschreibung.
- `Mandate`: rechtliche, demokratische oder organisatorische Entscheidungsbefugnis.
- `ResponsibilityAssignment`: Zuständigkeit für Prüfung, Entscheidung, Umsetzung oder Monitoring.
- `InterestDisclosure`: offengelegte Interessen, Bindungen oder Finanzierung, soweit zulässig und erforderlich.

### 4.3 Quellenobjekte

- `SourceArtifact`: ursprüngliche Quelle oder stabil referenzierte Veröffentlichung.
- `SourceSegment`: konkrete Seite, Zeile, Passage, Zeitmarke oder Datenschnitt.
- `SourceFamily`: gemeinsamer Ursprung mehrerer Derivate.
- `SourceLineage`: Kopie, Zitat, Syndikation, Übersetzung, Zusammenfassung oder Agentenverarbeitung.
- `TranslationView`: Lesefassung; niemals eigenständige Evidenz.
- `TranscriptionView`: automatische oder geprüfte Transkription mit sichtbarem Status.

### 4.4 Aussage- und Erkenntnisobjekte

- `ReportedStatement`: dokumentierte Aussage eines Akteurs.
- `AtomicClaim`: eine einzelne, prüfbare oder klar klassifizierte Behauptung.
- `ClaimScope`: Subjekt, Prädikat, Objekt, Zeitraum, Ort, Quantifizierung und Geltungsbereich.
- `Interpretation`: begründete Deutung, die nicht als Fakt ausgegeben werden darf.
- `SystemHypothesis`: verallgemeinernde, noch zu prüfende Strukturthese.
- `MechanismHypothesis`: möglicher Wirkmechanismus.
- `CausalClaim`: Ursache-Wirkungs-Behauptung mit erhöhtem Prüfbedarf.
- `Prediction`: zukunftsgerichtete Aussage samt Annahmen und Unsicherheit.
- `Uncertainty`: bekannte Wissenslücke oder unklare Evidenzlage.
- `OpenQuestion`: ausdrücklich ungelöste Forschungs-, Rechts-, Wert- oder Umsetzungsfrage.

### 4.5 Evidenz- und Prüfobjekte

- `ClaimSourceRelation`: exakte Beziehung zwischen Claim und Quellsegment.
- `EvidenceAssessment`: mehrdimensionale Bewertung ohne irreführenden Gesamtscore.
- `CounterEvidence`: Evidenz gegen denselben Claim.
- `AlternativeExplanation`: andere plausible Erklärung desselben Befunds.
- `Counterexample`: konkreter Fall, der eine Generalisierung begrenzt.
- `BoundaryCase`: Ausnahme oder Grenzfall ohne automatische Widerlegung.
- `VerificationEvent`: dokumentierte externe oder menschliche Prüfung.
- `SynthesisReceipt`: maschinenlesbare Beweiskette jeder Zusammenfassung.

### 4.6 Normative und deliberative Objekte

- `Value`: offengelegter normativer Maßstab.
- `Goal`: angestrebter Zustand.
- `RightOrConstraint`: Grundrecht, Rechtsbindung, Budget-, Zeit- oder Sicherheitsgrenze.
- `ValueConflict`: expliziter Konflikt zwischen legitimen Zielen oder Werten.
- `AffectedGroup`: betroffene Gruppe ohne unzulässige politische Profilbildung.
- `Argument`: begründete Stützung einer Option oder Position.
- `CounterArgument`: Gegenargument zum selben Bezugspunkt.
- `TradeOff`: nicht gleichzeitig vollständig erfüllbare Ziele.

### 4.7 Options- und Beteiligungsobjekte

- `Option`: klar beschriebene Handlungsalternative, einschließlich `no_change`.
- `OptionAssumption`: Annahme, auf der eine Option beruht.
- `ExpectedEffect`: erwartete Wirkung.
- `Risk`: mögliches negatives Ergebnis.
- `SideEffect`: nicht primär beabsichtigte Folge.
- `Reversibility`: Rücknehmbarkeit oder Pilotierbarkeit.
- `ParticipationFormat`: Information, Konsultation, Deliberation, Priorisierung, Empfehlung oder Entscheidung.
- `ParticipationCohort`: klar benannte Teilnehmendengruppe und Zugangskriterium.
- `ParticipationResult`: Ergebnis mit Methode, Basis, Zeitraum und Repräsentativitätsgrenze.
- `PreferenceSignal`: individuelle oder aggregierte Präferenz; kein Faktenbeleg.

### 4.8 Entscheidungs- und Wirkungsobjekte

- `Decision`: institutioneller oder organisatorischer Beschluss.
- `DecisionRationale`: dokumentierte Begründung und verwendete Evidenz.
- `DecisionDeviation`: Abweichung von Beteiligungsergebnis, Empfehlung oder früherer Position.
- `ImplementationPlan`: Maßnahmen, Ressourcen, Fristen und Verantwortliche.
- `ImplementationEvent`: realer Umsetzungsschritt oder Blockade.
- `Outcome`: beobachtetes Ergebnis.
- `ImpactAssessment`: bewertete Wirkung mit Methode und Grenzen.
- `Revision`: begründete Änderung eines früheren Objekts.
- `LearningEvent`: dokumentierte neue Erkenntnis und ihre Konsequenz.

## 5. Claim-Typen

Jeder `AtomicClaim` erhält genau einen primären Typ:

- `reported_speech`
- `personal_experience`
- `factual_claim`
- `quantified_claim`
- `causal_claim`
- `system_hypothesis`
- `mechanism_hypothesis`
- `interpretation`
- `normative_position`
- `prediction`
- `non_checkable_opinion`

Zusammengesetzte Aussagen werden geteilt. Quantifizierung, Zeitraum und Geltungsbereich dürfen bei der Synthese nicht verloren gehen.

## 6. Kanonische Relationen

### 6.1 Quellen- und Claim-Relationen

- `reported_by_source`
- `supports_exactly`
- `supports_partially`
- `corroborates_same_claim`
- `contradicts_same_claim`
- `example_only`
- `mechanism_only`
- `context_only`
- `thematically_related_only`
- `counterexample`
- `exception_or_boundary_case`
- `alternative_explanation`
- `normative_counterposition`
- `irrelevant`
- `unclear_requires_review`

Nur `supports_exactly`, `supports_partially`, `corroborates_same_claim` und `contradicts_same_claim` betreffen unmittelbar denselben atomaren Claim. Thematische Nähe zählt nie als Bestätigung.

### 6.2 Prozessrelationen

- `belongs_to_case`
- `derived_from`
- `interprets`
- `generalizes_from`
- `limits_scope_of`
- `raises_question`
- `conflicts_with_value`
- `supports_option`
- `opposes_option`
- `depends_on_assumption`
- `affects_group`
- `produces_participation_result`
- `informs_decision`
- `deviates_from`
- `implements`
- `measures`
- `revises`
- `supersedes`
- `reopens_case`

### 6.3 Verantwortungsrelationen

- `has_mandate`
- `responsible_for_review`
- `responsible_for_decision`
- `responsible_for_implementation`
- `responsible_for_monitoring`
- `must_respond_to`

## 7. Zustandsmodelle

### 7.1 Claim

```text
draft
→ segmented
→ relation_review_pending
→ reviewed
→ externally_verified | open_hypothesis | disputed
→ superseded | retracted
```

Kein automatischer Übergang zu `externally_verified`.

### 7.2 Option

```text
draft
→ scoped
→ evidence_attached
→ tradeoffs_documented
→ participation_ready
→ considered
→ selected | rejected | deferred
→ superseded
```

### 7.3 Decision

```text
proposed
→ mandate_confirmed
→ rationale_complete
→ decided
→ implementation_planned
→ implementing
→ completed | blocked | changed | revoked
→ evaluated
→ revised | closed | reopened
```

### 7.4 Case

```text
intake
→ check
→ dossier
→ participation
→ institutional_response
→ implementation
→ monitoring
→ audit
→ learned | reopened
```

Die Zustandsnamen müssen an bestehende eDebatte-SSOTs angepasst werden. Dieses Dokument schafft keine zweite Statuswahrheit.

## 8. Mehrdimensionale Evidenz

Ein einzelner Confidence-Wert darf nicht über Veröffentlichung oder Wahrheit entscheiden.

Mindestens getrennt:

- Segmenttreue
- Sprecherzuordnung
- Transkriptionssicherheit
- Claim-Entailment
- Quellenverlässlichkeit für den konkreten Claim
- Quellenunabhängigkeit
- externe Verifikation
- Geltungsbereich/Generalisierbarkeit
- Gegenbelegstatus
- Aktualität
- menschlicher Reviewstatus

## 9. Publikationsklassen

- `publishable_as_quote`
- `publishable_as_personal_experience`
- `publishable_as_shared_perception`
- `publishable_as_open_hypothesis`
- `publishable_as_externally_verified_fact`
- `review_required`
- `blocked_insufficient_evidence`
- `blocked_source_integrity`

Vote4Gov und Voxy dürfen nie stärker formulieren als diese Klassifikation erlaubt.

## 10. SynthesisReceipt

Jede veröffentlichbare Synthese referenziert mindestens:

- Case-ID und Revision
- Atomic-Claim-IDs
- Source-Segment-IDs
- Relations-IDs
- Source-Family-/Lineage-Status
- Gegenbelege und ausgelassene Perspektiven
- offene Lücken
- erlaubte Sprachform
- Modell-/Policy-/Promptversion, soweit zulässig
- menschliche Reviewrevision

Der Syntheseprozess darf keine neue Tatsachenbehauptung ohne Claim-ID erzeugen und keine Relation hochstufen.

## 11. Sichten auf denselben Graphen

### eDebatte

Bearbeitet Quellen, Claims, Konflikte, Optionen, Beteiligung, Entscheidungen und Wirkung operativ.

### Vote4Gov

Zeigt historische und internationale Kontexte, persönliche Positionen, Gegenargumente, offene Fragen und die öffentliche Fallbiografie. Vote4Gov sammelt keine zweite Beteiligungswahrheit.

### Voxy

Erklärt den freigegebenen Stand in verständlicher Sprache. Voxy darf keine Evidenzklasse verändern und keine Quelle aus einer Modellantwort erzeugen.

### VoiceOpenGov

Nutzt freigegebene Themen- und Beteiligungsräume für Bewegung, Mitgliedschaft und regionale Organisation. Mitgliedschaft ist kein Evidenzstatus.

## 12. Harte Invarianten

- RePro bleibt innerhalb eDebatte.
- Genau ein kanonischer Reason Graph.
- Genau eine Claim-, Dossier-, Source-, Review- und Decision-SSOT.
- Agentenmehrheit ist keine Quellenmehrheit.
- Semantische Nähe ist keine Bestätigung.
- Übersetzung ist keine Evidenz.
- Persönliche Erfahrung ist kein allgemeiner Systemfakt.
- Mehrheit entscheidet keine Tatsachen.
- Beteiligungsergebnis ist nicht automatisch institutioneller Beschluss.
- Entscheidung ist nicht Wirkung.
- Kein Auto-Publish, Auto-Approve oder Auto-Graph-Merge.
- Keine Speicherung von Chain-of-Thought, Secrets oder unnötigen Rohdaten.

## 13. Minimaler Implementierungsschnitt

Der erste technische Slice darf ausschließlich additiv sein:

1. vorhandene Models/Contracts/Stores inventarisieren;
2. bestehende Objekte auf diese Ontologie abbilden;
3. nur fehlende Typen für `SourceSegment`, `AtomicClaim`, `ClaimSourceRelation`, `EvidenceAssessment` und `SynthesisReceipt` ergänzen;
4. keine neue Persistenz und keine neue Reviewfläche;
5. Red-Team-Fixture aus #587 als Contract-Test;
6. bestehende Graph-Handoffs fail-closed halten;
7. erst nach positivem Preflight einen kleinen Implementierungs-PR öffnen.

## 14. Abnahmekriterien

- Jede veröffentlichbare Aussage besitzt eine sichtbare Beweiskette.
- Aussage, Fakt, Interpretation, Wert, Option, Präferenz, Entscheidung und Wirkung sind maschinenlesbar getrennt.
- Gleiche Quellenfamilien werden nicht mehrfach als unabhängig gezählt.
- Gegenbeispiel, Ausnahme, alternative Erklärung und normativer Widerspruch bleiben unterscheidbar.
- Vote4Gov, Voxy und eDebatte können denselben Case revisionsgebunden unterschiedlich darstellen.
- Kein System kann eine Evidenz- oder Publikationsklasse eigenmächtig erhöhen.
- Legacy-Objekte bleiben lesbar und fallen bei fehlender Zuordnung fail-closed zurück.

## 15. Offene Entscheidungen vor Code

- Welche bestehenden Typen sind bereits kanonisch und werden nur umbenannt oder erweitert?
- Welche Felder bleiben Legacy-kompatibel?
- Welche Relationstypen werden im ersten Slice tatsächlich materialisiert?
- Welcher Store bleibt SSOT für Source, Claim, Dossier, Decision und Monitoring?
- Welche UI zeigt zuerst die Ebenen `Gesagt / Abgeleitet / Geprüft / Offen / Entscheiden`?
- Welche menschliche Rolle darf Claims und Relationen hochstufen?
- Wie werden Revision, Löschung, Retention und Rechte je Quellentyp behandelt?

## 16. Nächster zulässiger Schritt

Alpha erstellt auf aktuellem `main` eine Kollisions- und Wiederverwendungsmatrix gegen bestehende Contracts und serialisiert danach genau einen kleinen OpenTasks-Slice:

`ATOMIC-CLAIM-SOURCE-RELATION-CONTRACT-01`

Bis dahin bleibt dieses Dokument ein Architekturvertrag ohne Runtime-, Merge- oder Produktionsfreigabe.
