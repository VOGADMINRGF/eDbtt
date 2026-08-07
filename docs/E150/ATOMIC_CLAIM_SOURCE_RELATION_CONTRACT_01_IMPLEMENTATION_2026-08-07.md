# ATOMIC-CLAIM-SOURCE-RELATION-CONTRACT-01 · Implementation Evidence

Stand: 2026-08-07

## Governance

- Task: `ATOMIC-CLAIM-SOURCE-RELATION-CONTRACT-01`
- Issue: #587
- Run-Pack: `docs/E150/ATOMIC_CLAIM_SOURCE_RELATION_CONTRACT_01_CODEX_RUNPACK_2026-08-07.md`
- RePro-/Ontologie-Basis: `docs/E150/REPRO_EDEBATTE_ONTOLOGY_01_2026-08-06.md`
- OpenTasks: `codex_ready`
- Post-Merge-Preflight auf sauberem `main`: `executable: true`, `branchCreationAllowed: true`
- Ausgangs-`main`: `73579e09a3841bd494bf64224bbaec33e39ebc61`

## Ziel dieses ersten technischen Slices

Der Slice ergänzt ausschließlich eine additive, persistenzfreie Contract-Schicht für die bereits vorhandene Source-/Truth-Guard-Landschaft. Er ersetzt keine vorhandene SSOT und aktiviert keine neue Runtime.

Neu modelliert werden:

- `SourceArtifact`
- `SourceSegment`
- `AtomicClaim` und `AtomicClaimScope`
- `SourceFamily`
- `ClaimSourceRelation`
- mehrdimensionale `EvidenceAssessment`
- `PublicationClassification`
- `SynthesisReceipt`

## Wiederverwendete bestehende Wahrheit

Der Slice lässt bestehende produktive Verträge unangetastet und baut auf ihnen auf:

- `features/analyze/sourceGroundingContract.ts` bleibt Source-Grounding-SSOT für den aktuellen Analyze-Pfad;
- `features/ai/e150/verificationContract.ts` bleibt bestehender Truth-/Verification-Guard;
- `apps/web/src/features/create/analyzeContract.ts` bleibt CreateAnalyzeResponse-Vertrag;
- bestehende Factcheck-, Dossier-, Provenance-, Review- und Graph-Merge-Flächen werden nicht dupliziert;
- bestehende `noTruthPromotion`, `noAutoGraphPromotion`, `noAutoPublish` und Human-Review-Gates bleiben unverändert.

Dieser erste Slice verdrahtet die neue Contract-Schicht bewusst noch nicht in Persistenz, Graph-Merge oder Publishing.

## Fail-closed Invarianten

- Thematische Nähe ist keine Bestätigung desselben Claims.
- `example_only`, `mechanism_only`, `context_only`, `counterexample`, `exception_or_boundary_case` und `normative_counterposition` erhöhen keinen unabhängigen Support-Zähler.
- Mehrere Agentenläufe auf derselben Source Family zählen nicht mehrfach.
- Syndizierte Kopien derselben Agenturmeldung zählen nicht als unabhängige Quellenfamilien.
- Unterschiedliche Subjekte, Zeiträume, Jurisdiktionen, Populationen oder Quantifizierungen verhindern die Gleichsetzung atomarer Claims.
- Übersetzte Lesefassungen zählen niemals als Evidenz.
- Fehlende Segmentreferenzen blockieren die Publikationsklassifikation fail-closed.
- Automatische, ungeprüfte Transkripte dürfen nicht als verifiziertes Wortzitat erscheinen.
- Persönliche Erfahrung bleibt `publishable_as_personal_experience` und wird nicht zum allgemeinen Systemfakt hochgestuft.
- `publishable_as_externally_verified_fact` verlangt menschlich geprüfte, starke, segmenttreue und unabhängig bestätigte Exact-/Corroboration-Evidenz sowie keinen ungelösten Gegenbeleg.
- Ein `SynthesisReceipt` darf keine neue Claim-ID einführen, keine Relation hochstufen und keine Übersetzung als Evidenz verwenden.
- Requested und erlaubte Publikationsklasse müssen identisch bleiben; Synthese darf die Formulierung nicht verstärken.

## Red-Team-Fixtures

`apps/web/tests/atomic-claim-source-relation.contract.test.ts` deckt insbesondere ab:

1. thematisch ähnliche Aussagen sind kein Support;
2. mehrere Agenten auf derselben Source Family zählen einmal;
3. syndizierte Agenturkopien zählen nicht mehrfach;
4. persönliche Erfahrung bleibt auf ihre Publikationsklasse begrenzt;
5. Widerspruch, Gegenbeispiel, Ausnahme und alternative Erklärung bleiben getrennt;
6. ungeprüftes automatisches Transkript blockiert ein verifiziertes Zitat;
7. Synthese darf offene Hypothese nicht zu extern verifiziertem Fakt hochstufen;
8. Gegenbelege, alternative Erklärungen, Auslassungen und Evidenzlücken bleiben im Receipt sichtbar;
9. andere Quantifizierung verhindert Claim-Gleichheit;
10. anderes Subjekt, anderer Zeitraum oder andere Jurisdiktion verhindert Claim-Gleichheit;
11. Übersetzung erhöht keinen Evidenzgrad;
12. fehlende Segmentreferenz endet fail-closed;
13. extern verifizierte Faktformulierung benötigt unabhängige Exact-/Corroboration-Evidenz;
14. neue Claims, Relation-Promotion oder Translation-as-Evidence machen den Receipt ungültig.

## Bewusst nicht enthalten

- keine Datenbank oder Migration;
- kein neuer Store oder zweite Source-/Claim-/Graph-SSOT;
- kein Graph-Write oder Graph-Merge;
- keine Provider- oder Websuche;
- keine UI-Änderung;
- keine Review-Queue-Änderung;
- kein Auto-Publish;
- kein Deployment;
- keine Änderungen an reservierten Voxy-Strängen;
- keine Änderung an `docs/E150/OpenTasks.md`.

## Nächster zulässiger Integrationsschritt

Nach grünem Exact-Head-CI und Review kann ein separater kleiner Adapter-Slice die heute noch untypisierten `CreateAnalyzeResponse.claims` beziehungsweise vorhandene Source-Support-Handoffs auf diesen Contract abbilden. Auch dieser Schritt bleibt additiv, fail-closed und ohne neue Persistenz.
