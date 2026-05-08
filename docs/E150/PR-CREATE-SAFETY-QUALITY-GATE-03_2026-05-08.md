# PR-CREATE-SAFETY-QUALITY-GATE-03

Datum: 2026-05-08

## Scope

Adversarial Regression-Harness fuer den bestehenden `/create`-Safety-/Input-Qualitaets-Gate aus Issue #103.

Nicht Teil dieses Slices:

- keine allgemeine `/create`-UX-Aenderung
- keine neuen Admin-Surfaces
- keine externen Moderationsprovider
- keine paid provider calls
- keine Auto-Publish-, Voting- oder Silent-Merge-Logik

## Corpus-Struktur

Neue Test-Artefakte:

- `apps/web/tests/helpers/createSafetyCorpusRunner.ts`
- `apps/web/tests/fixtures/createSafetyCorpus.de.ts`
- `apps/web/tests/fixtures/createSafetyCorpus.en.ts`
- `apps/web/tests/fixtures/createSafetyCorpus.multilingual.ts`
- `apps/web/tests/create-safety-corpus.de.contract.test.ts`
- `apps/web/tests/create-safety-corpus.en.contract.test.ts`
- `apps/web/tests/create-safety-corpus.multilingual.contract.test.ts`

Jeder Fall nutzt den strukturierten Contract aus Issue #103:

- `id`
- `title`
- `locale`
- `input`
- `expectedDecision`
- optionale `allowedDecisions`
- optionale `mustFind` / `mustNotFind`
- optionale `mustRedact` / `mustNotContainInRedacted`
- optionale `mustHaveFactcheckCandidate`
- optionale `mustHaveGraphReviewHint`
- optionale `mayProceedAsSafeQuestion`
- optionale `notes`

## Corpus-Kategorien

Abgedeckte Kategorien:

1. Broken German with civic intent
2. Long rambling civic input
3. Self PII only
4. Third-party PII only
5. Third-party PII plus contact-call pattern
6. Third-party PII plus accusation
7. Insult only
8. Insult plus real civic concern
9. Political framing only
10. Political framing plus factual allegation
11. Severe unsupported allegation
12. Unverified number or budget claim
13. Source-bluffing language
14. Factcheck-as-censorship counterclaim
15. Concrete danger signal
16. Vague escalation / self-justice
17. Group-abuse language
18. Spam / campaign repetition
19. Safe question derived from unsafe original
20. Mixed-language / cross-lingual review
21. English equivalent cases
22. Placeholder multilingual samples for `tr` / `ar` / `ru` / `uk` / `pl`

## Case Count and Languages

Der Corpus umfasst exakt 60 strukturierte Faelle:

- 35 deutsche Faelle
- 20 englische Faelle
- 5 mehrsprachige Placeholder-Faelle (`tr`, `ar`, `ru`, `uk`, `pl`)

Sprachregeln im Runner:

- `de`-Faelle werden als deutsches Intake mit deutschem Graph-Kontext evaluiert
- `en`-Faelle werden als englisches Intake mit englischem Sprachkontext evaluiert
- `tr` / `ar` / `ru` / `uk` / `pl` Placeholder werden als nicht-deutsche Quelle in den deutschen Graph-Kontext gespiegelt, damit `same_language_only` weiter Standard bleibt und `graph_review_required` regressionssicher pruefbar ist

## Safety-Erwartungen

Der Runner prueft pro Fall:

- erwartete oder erlaubte `decision`
- benoetigte Findings
- verbotene Findings
- Redaction-Verhalten
- keine raw PII in `redactedText`
- keine raw PII in `reviewItems`
- keine raw PII in `telemetry`
- Factcheck-Kandidaten, wo gefordert
- Graph-Review-Hinweise, wo gefordert
- Safe-Question-Faelle duerfen weiterlaufen, ohne Behauptungen still zu Tatsachen hochzustufen

Explizite Guardrails:

- Political framing allein blockiert nicht
- Low readability allein blockiert nicht
- Third-party PII plus contact-call pattern blockiert
- Third-party PII plus accusation fuehrt mindestens zu Moderation
- Severe unsupported allegations fuehren zu Faktencheck, sofern keine hoehere Safety-Stufe greift
- Cross-lingual Samples bleiben `graph_review_required` und `noSilentMerge=true`

## No Raw PII Rule

`mustRedact`-Faelle pruefen explizit, dass dieselben Rohfragmente nicht in folgenden Feldern auftauchen:

- `redactedText`
- `reviewItems`
- `telemetry`

Harte Beispiele bleiben ausschliesslich in Testfixtures und erscheinen nicht in user-facing Copy.

## Minimal Corpus-Driven Fixes

Der Corpus hat einige echte Lexikon-Luecken offengelegt. Minimal behoben wurden:

- deutsche Adress-Variante `strasse` zusaetzlich zu `straße`
- verb-first Branddrohungen wie `zuenden wir den Laden an`
- implizite Konsequenzform `wird das Folgen haben`
- englische Manipulationssprache `manipulated`
- englische grosse Zahlwoerter `million` / `billion`
- `man weiss doch` als deutsche Source-Bluffing-Variante
- ein enger `en`-Risk-Hinweis fuer mixed-language German intake

Es wurden keine allgemeinen `/create`-Flows, keine Produktentscheidungen und keine nicht-noetigen Safety-Mechaniken erweitert.

## False-Positive / False-Negative Guardrails

False-positive-Schutz:

- Broken German mit civic intent bleibt `allow` oder `revise_required`, nicht `blocked`
- Political framing allein bleibt reviewbar statt zensierend behandelt
- Safe questions bleiben zulaessig und tragen `truthStatus=open`

False-negative-Schutz:

- Drittpersonen-PII mit Mobilisierung oder Doxxing-Sprache blockiert
- Drittpersonen-PII mit Vorwurf bleibt moderationspflichtig
- konkrete Drohungen und Branddrohungen blockieren
- implizite Drohung / Selbstjustiz bleiben moderationspflichtig
- unbelegte Zahlen-, Korruptions- und Manipulationsclaims fuehren deterministisch zu Faktencheck

## Validation

Validiert mit dem exakten Issue-Command-Set:

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/create-input-safety.contract.test.ts \
  tests/create-input-safety-lexicon.contract.test.ts \
  tests/create-input-safety-telemetry.contract.test.ts \
  tests/create-safety-review-contract.test.ts \
  tests/create-safety-corpus.de.contract.test.ts \
  tests/create-safety-corpus.en.contract.test.ts \
  tests/create-safety-corpus.multilingual.contract.test.ts \
  tests/create-analyze.safety-gate.test.ts \
  tests/create-save.safety-gate.test.ts \
  tests/create-finalize.safety-gate.test.ts
```
