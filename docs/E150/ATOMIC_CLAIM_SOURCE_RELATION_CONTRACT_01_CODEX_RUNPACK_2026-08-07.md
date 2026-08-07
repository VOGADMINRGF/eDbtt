# ATOMIC-CLAIM-SOURCE-RELATION-CONTRACT-01 · Codex Run-Pack

Stand: 2026-08-07

Status: Governance-/Ausführungsvorbereitung. Dieser Run-Pack autorisiert noch **keine** Implementierung. Der technische Slice darf erst beginnen, wenn `docs/E150/OpenTasks.md` verlustfrei durch den kanonischen Single Writer auf `codex_ready` serialisiert wurde und der taskbezogene Preflight `executable: true` sowie `branchCreationAllowed: true` bestätigt.

Bezug: Issue #587. Fachliche Ontologie-/Prozessbasis: PR #594. Abhängigkeit #566 ist erfüllt.

## Ziel

Einen kleinen, additiven Contract- und Fixture-Slice vorbereiten, der die bestehende Create-/Dossier-/Factcheck-/Reason-Graph-/Provenienzlandschaft um eine kanonische, maschinenlesbare Beziehung zwischen konkretem Quellsegment und atomarem Claim ergänzt.

Der Slice darf keine parallele Claim-, Source-, Dossier-, Graph-, Provenienz-, Review- oder Publishing-SSOT erzeugen.

## Harte fachliche Invarianten

- Keine Wahrheit durch semantische Nähe.
- Keine Wahrheit durch Agentenmehrheit.
- Mehrere Modellläufe auf derselben Quelle erzeugen keine mehreren unabhängigen Quellen.
- Ein weiteres Interview ist kein externer Faktencheck derselben Systemthese.
- Zusammengesetzte Aussagen werden atomisiert.
- Quantifizierung, Zeitraum, Subjekt, Objekt und Geltungsbereich bleiben beim Claim erhalten.
- Übersetzung ist Lesefassung, keine Evidenz.
- Ein skalares `confidence`-Feld darf niemals allein Fact-, Corroboration- oder Publish-Gate sein.
- Synthese darf keine neue Tatsachenbehauptung ohne vorhandene Atomic-Claim-ID einführen.
- Synthese darf Relation, Quellenunabhängigkeit oder Veröffentlichungsstatus nicht eigenmächtig hochstufen.
- Fehlende Segmentreferenz, unklare Relation, unbestätigte Quellenunabhängigkeit oder ausgelassener wesentlicher Gegenbeleg müssen fail-closed enden.
- Kein Auto-Publish und kein Graph-Write in diesem Slice.

## Wiederzuverwendende bestehende Flächen

Vor Implementierungsstart gegen den dann aktuellen `main` erneut verifizieren:

- `CreateAnalyzeResponse` einschließlich vorhandener `claims`, `evidenceNeeds`, `uncertainties`, `truthStatus`, `sourceSupport`, `noTruthPromotion`, `noAutoGraphPromotion`, `noAutoPublish` und `provenanceRefs`;
- bestehender Claim-to-Dossier-Handoff;
- Source-/Factcheck-Feed-Contracts;
- AI-Orchestration-Provenance-/Safe-Trace-Verträge;
- Dossier-/Reason-Graph-Handoffs;
- Review-/Publish-Guardrails aus den bestehenden Transparency-, Shadow- und Publishing-Slices;
- kanonische Rollenregistry, insbesondere `research_source`, `claims_factcheck`, `dossier_briefing` und `governance_compliance`.

## Zulässiger Implementierungsscope

Nur nach positivem Preflight:

- additive typed Contracts in bestehenden gemeinsamen Contract-/Feature-Pfaden;
- fokussierte Contract- und Red-Team-Fixture-Tests;
- minimal notwendige Adapter an vorhandene untypisierte Source-/Claim-Support-Felder;
- Evidence-Dokumentation unter `docs/E150/`.

Nicht zulässig:

- neue Collection, Datenbank oder Migration ohne separat nachgewiesenen Bedarf;
- UI-Redesign;
- Live-Websuche oder Providerintegration;
- neue Review-Queue;
- automatische Claim-Hochstufung;
- Graph-Merge oder Graph-Write;
- Voxy-, Social- oder sonstiges Publishing;
- Production-Deployment.

## Mindesttypen

### `SourceArtifact`

Mindestens:

- stabile ID;
- kanonische URL oder interne Referenz;
- Quellentyp;
- Herausgeber/Urheber;
- Veröffentlichungs-/Abrufzeit;
- Sprache;
- Original-/Kopie-/Derivatstatus;
- Hash/Revision, soweit vorhanden;
- Rechte-/Retention-/Zugriffsstatus.

KI-Ausgaben dürfen nicht als Primärquelle für externe Tatsachen modelliert werden.

### `SourceSegment`

Mindestens:

- stabile Segment-ID;
- SourceArtifact-Referenz;
- Seiten-, Absatz-, Zeilen-, Zeit- oder Datensatzbezug;
- Originaltext bzw. zulässiger Ausschnitt;
- Kontext davor/danach;
- Sprecherzuordnung;
- Transkriptions-/OCR-/Übersetzungsstatus;
- Erkennungsunsicherheit;
- getrennte Lesefassung.

Ein automatisches Transkript darf nicht unmarkiert als verifiziertes Wortzitat gelten.

### `AtomicClaim`

Mindestens folgende Claim-Typen:

- `reported_speech`
- `personal_experience`
- `factual_claim`
- `quantified_claim`
- `causal_claim`
- `system_hypothesis`
- `interpretation`
- `normative_position`
- `prediction`
- `non_checkable_opinion`

Subjekt, Prädikat, Objekt, Zeitraum, Geltungsbereich und Quantifizierung müssen soweit anwendbar separat erhalten bleiben.

### `ClaimSourceRelation`

Kanonische Mindesttaxonomie:

- `supports_exactly`
- `supports_partially`
- `reported_by_source`
- `example_only`
- `mechanism_only`
- `context_only`
- `thematically_related_only`
- `corroborates_same_claim`
- `contradicts_same_claim`
- `counterexample`
- `exception_or_boundary_case`
- `alternative_explanation`
- `normative_counterposition`
- `irrelevant`
- `unclear_requires_review`

Folgende Relationen dürfen niemals die Zahl unabhängiger Bestätigungen oder den Veröffentlichungsgrad erhöhen:

- `thematically_related_only`
- `example_only`
- `mechanism_only`
- `context_only`
- `normative_counterposition`
- `counterexample`
- `exception_or_boundary_case`

`corroborates_same_claim` ist nur zulässig, wenn dieselbe atomare Behauptung in den wesentlichen Claim-Dimensionen tatsächlich gestützt wird.

### `SourceLineage` / `SourceFamily`

Mindestens modellieren:

- gleiche Ursprungspublikation;
- Kopie/Syndikation;
- gleiche Agenturmeldung;
- gleiche Studie oder gleicher Datensatz;
- gleiches Interview bzw. gleiche redaktionelle Reihe;
- gleicher Sprecher;
- Zitat über Sekundärquelle;
- mehrere Agenten auf derselben Quelle;
- voneinander unabhängige Primärquellen.

### `EvidenceAssessment`

Mindestens getrennte Dimensionen:

- `source_segment_fidelity`
- `speaker_attribution_confidence`
- `transcription_confidence`
- `claim_entailment_strength`
- `source_reliability_for_claim`
- `source_independence`
- `external_verification_status`
- `generalizability_scope`
- `counterevidence_status`
- `freshness_status`
- `human_review_status`

Diese Dimensionen dürfen weder API noch UI zu einer irreführenden Einzel-Prozentzahl verdichten.

### `PublicationClassification`

Mindestens:

- `publishable_as_quote`
- `publishable_as_personal_experience`
- `publishable_as_shared_perception`
- `publishable_as_open_hypothesis`
- `publishable_as_externally_verified_fact`
- `review_required`
- `blocked_insufficient_evidence`
- `blocked_source_integrity`

### `SynthesisReceipt`

Mindestens:

- verwendete Atomic-Claim-IDs;
- verwendete Source-Segment-IDs;
- verwendete Relations-IDs;
- Source Families und Unabhängigkeitsstatus;
- berücksichtigte und ausgelassene Gegenbelege;
- offene Evidenzlücken;
- erlaubte Sprachform;
- Modell-/Prompt-/Policyversion;
- menschliche Reviewrevision.

## Red-Team-Fixture

Der Slice muss kontrolliert nachweisen:

1. Zwei thematisch ähnliche Interviewaussagen bestätigen keine quantitative 60–80-%-These.
2. Mehrere Agenten auf derselben Quelle zählen als eine Quelle.
3. Dieselbe Agenturmeldung in mehreren Artikeln zählt als eine Source Family.
4. Persönliche Erfahrung bleibt auf ihren Geltungsbereich beschränkt.
5. Ausnahme, Gegenbeispiel und echter Widerspruch bleiben getrennte Relationen.
6. Fehlende Zeitmarke oder unsicheres Transkript blockiert ein verifiziertes Wortzitat.
7. Eine Synthese darf `publishable_as_open_hypothesis` nicht zu `publishable_as_externally_verified_fact` hochstufen.
8. Gegenbelege und alternative Erklärungen bleiben im `SynthesisReceipt` sichtbar.
9. Unterschiedliche Quantifizierung verhindert `corroborates_same_claim`.
10. Unterschiedliche Subjekte, Zeiträume oder Geltungsbereiche verhindern `supports_exactly`.
11. Übersetzte Lesefassung erhöht keinen Evidenzgrad.
12. Fehlende Segmentreferenz endet fail-closed.

## Erwartete technische Nachweise

Nach Implementierung mindestens:

- fokussierte Contract-/Fixture-Tests grün;
- `git diff --check` grün;
- Typecheck grün;
- Lint grün;
- relevante Security-/Guardrail-Tests grün;
- Build grün, sofern der Slice Build-relevante Type-Flächen berührt;
- Exact Head dokumentiert;
- PR-Scope gegen `main` geprüft;
- keine offenen Review-Threads;
- keine erfundenen Browser-/Production-Smokes.

## Branch- und PR-Vertrag nach Freigabe

Erst nach erfolgreicher OpenTasks-Serialisierung und positivem Preflight:

- isolierter Implementierungsbranch, z. B. `feat/atomic-claim-source-relation-contract-01`;
- erster PR maximal Contract + Fixture + minimal notwendige Adapter + Evidence;
- Draft bis CI, Scope und Reviews vollständig geklärt sind;
- Ready for review nur bei grünem Exact-Head-Gate;
- kein Merge ohne ausdrückliche Betreiberfreigabe.

## Aktueller Blocker

Auf `main@eb41bc2d06c2bbee8ce23823604ee4a51d92dc17` fehlt `ATOMIC-CLAIM-SOURCE-RELATION-CONTRACT-01` weiterhin im kanonischen operativen Kopf von `docs/E150/OpenTasks.md`.

Dieser Run-Pack ersetzt den OpenTasks-Eintrag **nicht**. Er reduziert lediglich den noch offenen Governance-Schritt auf eine verlustfreie Single-Writer-Serialisierung plus anschließenden taskbezogenen Preflight.