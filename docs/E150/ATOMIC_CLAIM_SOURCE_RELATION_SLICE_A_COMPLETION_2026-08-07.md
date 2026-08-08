# ATOMIC-CLAIM-SOURCE-RELATION-CONTRACT-01 · Slice-A-Completion

Stand: 2026-08-07

## Anlass

PR #599 hat den kanonischen Atomic-Claim-/Source-Relation-Vertrag, die Red-Team-Fixtures und die CI-Verankerung geliefert. Die anschließende Gegenprüfung gegen Issue #587 zeigte eine verbleibende Slice-A-Abnahme: die additive Anbindung an bestehende Create-/Analyze-/Dossier-Verträge.

Dieser kleine Completion-Slice schließt ausschließlich diese Lücke. Er schafft keine zweite Evidenz-, Claim-, Dossier- oder Graph-Wahrheit.

## Adapterentscheidung

Legacy-`AnalyzeResult.claims` werden nicht stillschweigend als vollständig atomisierte oder quellengebundene Evidenz behandelt.

Der Adapter:

- mappt vorhandene `fact`, `interpretation` und `value`-Statements konservativ auf kanonische Claim-Typen;
- lässt `question` außerhalb der Atomic-Claim-Liste und weist die ID als `unmappedAnalyzeClaimIds` aus;
- mappt unklassifizierte Legacy-Statements ausschließlich auf `non_checkable_opinion`;
- erfindet keine SourceSegments, Relations, Source Families, Quantifizierung, Jurisdiktion oder Generalisierbarkeit;
- setzt die Relationsebene ohne gebundene Segmente auf `unbound_requires_review`;
- erzwingt `requiresHumanReview`, `noTruthPromotion`, `noAutoGraphPromotion` und `noAutoPublish`.

## Create-Handoff

`apps/web/src/features/create/atomicEvidenceHandoff.ts` projiziert den bestehenden Create-Run auf denselben kanonischen Handoff, ohne `CreateAnalyzeResponse` zu mutieren oder dessen Legacy-Felder `confidence`, `sourceSupport` oder `truthStatus` als neue Evidenz umzudeuten.

## Dossier-Handoff

`features/dossier/atomicEvidenceHandoff.ts` projiziert aus dem bestehenden `Dossier.analyze` ausschließlich kanonische IDs und den fail-closed Relationstatus. Bestehende `DossierSchema`-, DB- und Persistenzformen bleiben unverändert. Der Adapter erklärt deshalb ausdrücklich `persistenceMutationRequired: false`.

Der Adapter wird über `features/dossier/index.ts` als regulärer Dossier-Vertrag exportiert.

## Tests

`apps/web/tests/atomic-claim-source-relation-adapters.contract.test.ts` prüft:

1. konservative Legacy-Claim-Abbildung;
2. keine erfundenen SourceSegments, Relations oder Source Families;
3. unbekannte Claim-Scope-Felder bleiben `null`;
4. Create erhält denselben fail-closed Handoff ohne Truth-/Graph-/Publish-Promotion;
5. Dossier erhält ausschließlich kanonische IDs und benötigt keine Persistenzmutation;
6. ein leerer Analyze-Stand bleibt `no_claims` statt künstliche Claims zu erzeugen.

Der Test ist im bestehenden `Focused Create runtime contracts`-CI-Step verankert.

## Nicht enthalten

- keine DB oder Migration;
- keine Änderung an `DossierSchema` oder Legacy-Persistenz;
- kein Graph-Write oder Graph-Merge;
- keine automatische Segmentierung, Relationserzeugung oder Quellenunabhängigkeitsbehauptung;
- keine Provider-/Live-Ingestion;
- keine UI- oder Review-Queue-Änderung;
- kein Auto-Publish oder Deployment;
- keine Änderung an `docs/E150/OpenTasks.md`;
- keine Änderung an reservierten Voxy-Strängen.

## Abschlussgrenze

Nach grünem Exact-Head-CI, Vercel und Scope-Review ist Slice A fachlich abgeschlossen: Der kanonische Vertrag existiert und die vorhandenen Analyze-, Create- und Dossier-Flächen besitzen einen gemeinsamen, rückwärtskompatiblen, fail-closed Adapter. Source-Lineage-Automation, Review-UI, Synthesis-Publish-Gate und E2E bleiben separate Folgeslices B–E.
