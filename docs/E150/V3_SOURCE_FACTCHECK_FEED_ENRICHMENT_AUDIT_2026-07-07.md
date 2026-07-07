# V3 Source / Factcheck / Feed Enrichment Audit

Stand: 2026-07-07  
Branch: `pr/v3-source-factcheck-feed-enrichment-01`

## Scope

Umgesetzt wurde `V3-SOURCE-FACTCHECK-FEED-ENRICHMENT-01` als review-first
Handoff-Layer auf bestehenden V3-Readmodels und bestehenden Flächen:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein DeepSearch-Autostart
- kein echter Provider- oder Feed-Lauf
- kein Faktencheck-Ergebnis
- keine Quellenverifikation
- keine neue Queue
- keine neue Persistenz
- kein Auto-Publish
- kein Social Posting
- kein Voxy-Render

## Inventory

Vor dem Slice bereits vorhanden und wiederverwendet:

| Baustein | Datei(en) | Rolle im Slice | bleibt bewusst offen |
| --- | --- | --- | --- |
| Feed-/Source-/Material-Review-Suggestions | `apps/web/src/features/create/createCandidatePreview.ts`, `apps/web/tests/create-feed-enrichment-review-suggestions.contract.test.ts` | bestehende review-first Hinweise aus `/create` liefern Seeds für Feed-/Quellenbedarf | keine echte Feed- oder Research-Runtime |
| Canonical Source Pack | `apps/web/src/features/create/canonicalSourcePackContract.ts` | typed Quellen- und Evidence-Grundlage für Review-Kontext | kein Wahrheitsupgrade durch Pack allein |
| Multilingual Evidence / Trust | `apps/web/src/features/create/multilingualEvidenceTrustContract.ts` | trennt Original, Lesefassung, Übersetzung und Trust | Übersetzung bleibt keine Evidenz |
| Voxy Human Loop | `apps/web/src/features/create/voxyCocreationDialogContract.ts` | liefert deterministische Fragen zu Quelle, Gegenposition, Vergleichsraum, Gemeinwohl | kein Chat, keine Antwort-Persistenz |
| V3 Review Queue Wiring | `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | verbindet Source Pack, Language Bridge, Dossier-Workspace, Output- und Voxy-Kontext | keine neue Queue- oder Runtime-Welt |
| Downstream KI Transparenz | `apps/web/src/features/create/V3DownstreamKiTransparency.tsx` | zeigt Folgepfade und Blocker ehrlich an | keine technische Folgeausführung |

Ehrlich fehlend bleiben:

- keine echte Feed-/Research-Provider-Runtime
- keine echte sealed Factcheck-Runtime
- keine user-scoped Runtime-Wahrheit für jeden Account-Draft
- keine Kosten-/Debit-Ausführung
- keine automatische reviewed source truth

## Neu

Neue typed Schicht:

- `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts`
- `apps/web/src/features/create/SourceFactcheckFeedEnrichmentPanel.tsx`

Der Contract hält getrennt:

- `sourceLanguage`
- `readingLanguage`
- `originalPreserved: true`
- `translationIsEvidence: false`
- `rtlDisplayHint`
- `enrichmentStatus`
- `sourceNeeds`
- `claimReviewNeeds`
- `referenceScopes`
- `factcheckQuestions`
- `feedHints`
- `counterpositionNeeds`
- `affectedGroupEvidenceNeeds`
- `commonGoodEvidenceNeeds`
- `reviewRequired: true`
- `noSourceInvented: true`
- `noFactcheckResult: true`
- `noProviderRun: true`

## Deterministische Ableitung

Der Builder leitet den Handoff nur aus vorhandenen Readmodels ab:

- Voxy-Fragen `evidence_reference_need`, `counterposition_probe`,
  `local_global_context`, `affected_groups_probe` und
  `common_good_reflection` werden auf Quellenbedarf, Gegenpositionsbedarf,
  Vergleichsraum, Betroffenengruppenbedarf und Gemeinwohlhinweise gemappt.
- Claim-Texte und offene Fragen erzeugen nur vorbereitete
  Faktencheck-Fragen, nie ein Ergebnis.
- Source-Pack-Typen, offene Gaps und Multilingual-Unsicherheiten werden als
  review-first Quellenbedarf und Sprach-/Trust-Hinweis sichtbar.
- Feed-Hinweise bleiben `prepared` oder ehrlich `blocked`, wenn Provider,
  Cost-Review oder Runtime-Wahrheit fehlen.
- `tr -> de`, `ar -> de`, `fr -> en` und `de -> de` bleiben getrennt sichtbar;
  RTL wird explizit markiert.

## Surface-Wiring

### `/create`

- `CreateCandidatePreviewPanel` zeigt jetzt zusätzlich
  `Quellen & Faktencheck vorbereiten`.
- Sichtbar werden Quellenbedarf, Claim-Prüfbedarf, Vergleichsräume,
  Faktencheck-Fragen und Feed-Hinweise.
- Die Box baut auf Candidate-Preview, Feed-Suggestions und Voxy-Human-Loop auf.

### `/account`

- Lokale und servergesicherte Resume-Items zeigen denselben Handoff-Layer
  aus dem vorhandenen Voxy-/Workflow-Arbeitsstand.
- User-scoped Runtime-Linkages zeigen denselben Layer aus `v3ReviewContext`.
- Kein Admin-Leak und keine erfundene Review- oder Provider-Wahrheit.

### `/admin/review`

- V3-Items mit `v3ReviewContext` zeigen jetzt zusätzlich den Source- /
  Factcheck- / Feed-Enrichment-Block.
- Sichtbar werden offene Quellenprüfung, vorbereitete Factcheck-Fragen,
  Vergleichsräume und Provider-/Cost-Blocker.
- Legacy-Items ohne `v3ReviewContext` bleiben unverändert.

### `/dossier/[id]/studio`

- Das bestehende Studio zeigt denselben Block additiv neben Review-Kontext,
  Workflow, Downstream-Transparenz und Voxy-Human-Loop.
- Dossier bleibt review-first; Bedarf bleibt Bedarf und wird nicht in Quelle,
  Faktencheck oder Veröffentlichung umgedeutet.

## Guardrails

- Quellenbedarf ist keine Quelle.
- Faktencheck-Frage ist kein Faktencheck-Ergebnis.
- Feed-Hinweis ist kein Feed-Treffer.
- Übersetzung ist kein Beleg.
- `review_ready` ist nicht `approved`.
- `publish_ready` ist nicht `published`.
- Draft ist nicht Veröffentlichung.
- Preview ist nicht Runtime.

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/source-factcheck-feed-enrichment.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Bewusst offen

- echte Feed-/Provider-Ausführung
- echte Research-/DeepSearch-Läufe
- echte Factcheck-Workflow-Ausführung aus diesem Block
- Quellenverifikation oder reviewed source truth
- zusätzliche Persistenz für Nutzerantworten oder Feed-Hints

## Nächster sinnvoller Slice

- Falls später echte Feed-/Research-Runtime angeschlossen wird, nur über
  bestehende sichere server-only Pfade und mit klarer Cost-/Provider-Wahrheit.
- Falls Source-Review oder Factcheck-Runtime erweitert wird, denselben Contract
  wiederverwenden und weiter `translation != evidence`, `review_ready != approved`
  und `publish_ready != published` erzwingen.
