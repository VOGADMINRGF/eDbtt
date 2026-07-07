# V3 Codex Autopilot Master Prompt

Stand: 2026-07-06

## Zweck

Diese Datei ist der vorbereitete One-Prompt fuer einen effizienten Codex-Lauf.

Ziel ist nicht, Checks oder Review zu umgehen, sondern Codex mit einem einzigen Startprompt so zu fuehren, dass er die notwendigen V3-Schritte selbst sequenziert, nur relevante Checks ausfuehrt, sauber commitet und bei echten Blockern stoppt.

## Wann verwenden

Nach Merge von PR `#311` bzw. nachdem folgende Datei auf `main` vorhanden ist:

`docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md`

## Empfohlener Branch

```bash
git checkout main
git pull --ff-only
git checkout -b pr/v3-canonical-runtime-autopilot-01
```

## Codex Autopilot Prompt

```text
Du arbeitest im Repo VOGADMINRGF/edebatte-org.

Ziel:
Fuehre einen gefuehrten V3-Autopilot-Lauf durch, der die kanonischen Produktregeln aus docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md in OpenTasks, Contracts und erste sichere Tests ueberfuehrt.

Wichtig:
- Arbeite sequenziell innerhalb dieses einen Prompts.
- Erstelle keine unkontrollierte Mega-Implementierung.
- Nutze kleine interne Phasen mit separaten Commits.
- Stoppe bei echten Produktentscheidungen, unklarer Persistenz, fehlender Runtime-Wahrheit oder roten Checks, die du nicht sicher beheben kannst.
- Erfinde keine Runtime, keine Quellen, keine Provider, keine externen Automationen und keine Readiness.
- Kein Auto-Publish.
- Auto-Prepare / Publish-ready / One-click-after-review ist der Zielkompromiss.

Kanonische Referenzen:
- docs/E150/OpenTasks.md ist der operative SSOT.
- docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md ist die neue V3-Kanonik fuer diesen Lauf.
- docs/E150/ProductionReadinessMatrix.md nur dann aktualisieren, wenn du docs-only Status/Verweis ehrlich ergaenzen kannst. Keine Hoherstufung ohne gebaute Runtime.
- GitHub Issue #310 bleibt Voxy Video Briefing Flow Mastertask.

Arbeitsmodus:
Fuehre die folgenden Phasen nacheinander aus. Nach jeder Phase:
1. Pruefe `git diff --check`.
2. Fuehre nur relevante Tests/Checks aus.
3. Erstelle einen Commit, wenn die Phase sauber abgeschlossen ist.
4. Dokumentiere im Commit oder PR-Body, was bewusst nicht umgesetzt wurde.

Phase 1 — OpenTasks Canonical Sweep
Aufgabe:
- Ergaenze docs/E150/OpenTasks.md um einen kompakten operativen V3-Block.
- Referenziere docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md als Evidence.
- Nimm mindestens diese Tasks auf:
  - V3-AUTO-PREPARE-PUBLISH-READY-GUARD-01
  - V3-CANONICAL-PREPARATION-STATUS-CONTRACT-01
  - V3-LANGUAGE-BRIDGE-TRUST-FORMAT-CONTRACT-01
  - V3-EVIDENCE-SOURCE-PACK-CONTRACT-01
  - V3-ROLE-SPECIFIC-REVIEW-CONTRACT-01
  - V3-USER-CONTRIBUTION-LIFECYCLE-01
  - V3-DOWNSTREAM-RUNTIME-HANDOFF-PERSISTENCE-01
  - V3-PARTICIPATION-POLL-HANDOFF-PERSISTENCE-01
  - V3-UNIFIED-REVIEW-QUEUE-01
  - V3-DOSSIER-WORKSPACE-REVIEW-SURFACE-01
  - V3-MULTILINGUAL-STATEMENTS-COMMENTS-THREADS-01
  - V3-MULTILINGUAL-EVIDENCE-TRUST-01
  - V3-CROSS-LINGUAL-TOPIC-CLAIM-CLUSTERING-01
  - V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01
  - V3-VOXY-VIDEO-BRIEFING-FLOW-MASTER-01
- Jeder Task braucht: Status, Priority, Depends on, Scope, Goal, Acceptance Criteria, Decision open, Evidence/Notes.
- Keine Runtime-Implementierung.

Akzeptanz:
- OpenTasks hat eine klare naechste Queue.
- Auto-Prepare ja / Auto-Publish nein ist sichtbar.
- `publish_ready` ist nicht `published`.
- One-click Publish/Activate erst nach Review/Approval.
- Externe Provider bleiben Adapter, nicht Produktkern.

Phase 2 — Canonical Preparation Status Contract
Aufgabe:
- Suche bestehende Status-/Publish-/Review-Contracts.
- Lege nur dann einen neuen shared Contract an, wenn es repo-architektonisch sauber passt.
- Ziel ist ein kleiner Contract fuer:
  - `draft`
  - `needs_clarification`
  - `review_ready`
  - `publish_ready`
  - `scheduled_after_review`
  - `active_or_published`
  - `archived`
  - `failed`
- Ergaenze Guardrail-Flags:
  - `autoPublish = false`
  - `reviewRequired = true`
  - `publicOutputAllowed = false` bis Approval
  - `publishActionEnabled = false` bis Approval
  - `externalSocialApiTriggered = false`
- Ergaenze Contract-Tests.

Akzeptanz:
- Tests sichern: publish_ready !== published.
- Tests sichern: ohne Approval keine Public Action.
- Keine bestehende Runtime wird umgebaut.
- Keine oeffentliche Route wird automatisch aktiviert.

Phase 3 — Language Bridge / Trust / Format Recommendation Contract
Aufgabe:
- Baue auf vorhandenen Language-Context-Contracts auf.
- Kein Cross-lingual Grossumbau.
- Lege, falls passend, kleine shared Types/Helpers fuer folgende Ebenen an:
  - Original
  - Uebersetzung
  - Zusammenfassung
  - Voxy-Einordnung
  - Quellenlage
  - offene Fragen
  - Unsicherheit
- Lege Trust-/Evidence-State-Typen an oder harmonisiere vorhandene:
  - source_needed
  - source_present
  - context_missing
  - contested
  - partially_supported
  - supported
  - normative_position
  - jurisdiction_unclear
  - translation_uncertain
  - outdated
- Lege Format-Recommendation-Typen an:
  - clarify
  - debate_and_arguments
  - comment_thread
  - poll
  - live_question
  - mitmachraum
  - statement_review
  - source_review
- Alles review-first, kein Auto-Publish.
- Tests fuer Trust-Layer und Format-Recommendation ergaenzen.

Akzeptanz:
- Uebersetzung ersetzt Original nicht.
- Zusammenfassung ersetzt Quelle nicht.
- Formatvorschlag bleibt Vorschlag.
- ReviewRequired bleibt true.

Phase 4 — Evidence / Source Pack Contract
Aufgabe:
- Suche bestehende Source-/Evidence-/Feed-/Factcheck-Contracts.
- Lege einen kleinen gemeinsamen SourcePack-Contract an oder dokumentiere bewusst, warum nur ein Adapter-/Bridge-Contract sinnvoll ist.
- Pflichtfelder sollen mindestens abbilden:
  - Originalquelle
  - Originalsprache
  - Quellentyp
  - Region
  - Abruf-/Standdatum, falls vorhanden
  - reliabilityHint
  - primary/official/media/civilSociety hints
  - originalSnippet
  - translatedSnippet
  - translationStatus
  - evidenceState
  - openGaps
  - reviewState
- Keine externen Quellen suchen.
- Keine Fake-Quellen.
- Keine DeepSearch starten.

Akzeptanz:
- Tests sichern fehlende Quellen als `source_needed` oder vergleichbaren ehrlichen Status.
- SourcePack kann spaeter von Dossier, Social und Voxy genutzt werden.

Phase 5 — Voxy Video Architecture Docs Alignment
Aufgabe:
- Lege `docs/E150/V3_VOXY_VIDEO_BRIEFING_FLOW_2026-07-06.md` an oder aktualisiere eine vorhandene passende Datei.
- Nutze Issue #310 als Inhalt/Evidence.
- Halte fest:
  - eDebatte besitzt Workflow, Datenmodell, Review, Branding, Quellenlogik und Publishing Queue.
  - Externe Tools sind nur Provider/Adapter.
  - Auto-Prepare ja, Auto-Publish nein.
  - Voxy ist Avatar/Mascot, nicht echte Person, nicht Amt, nicht Wahrheitsrichter.
  - Rendering/Provider-Implementierung ist bewusst nicht Teil dieses Slices.
- Optional: Falls repo-architektonisch passend, bereite `apps/web/src/features/voxyVideo/` nur mit reinen Types/Contracts und Tests vor. Keine Provider-Integration, kein Rendering, kein Publishing.

Akzeptanz:
- Voxy Video ist als E150-Kanonik dokumentiert.
- Keine externe Tool-Abhaengigkeit wird fest verdrahtet.
- Kein Video-Rendering oder Publishing wird aktiviert.

Phase 6 — Final Docs / Matrix / PR Body
Aufgabe:
- Aktualisiere docs/E150/ProductionReadinessMatrix.md nur, wenn ein ehrlicher docs-only/contract-only Verweis noetig ist.
- Keine `operational_basic`, `endstate_ready` oder `production_ready` Hochstufung fuer neu angelegte Contracts.
- Ergaenze PR-Body mit:
  - Phasenliste
  - geaenderte Dateien
  - ausgefuehrte Checks
  - bewusst nicht umgesetzt
  - naechste empfohlene PRs, falls noch offen

Stop-Regeln:
Stoppe sofort und liefere eine klare Blocker-Zusammenfassung, wenn:
- OpenTasks-Struktur unklar ist und du Gefahr laeufst, den SSOT zu beschaedigen.
- bestehende Contracts widerspruechlich sind.
- Tests rot bleiben und nicht lokal/sicher behebbar sind.
- du eine Produktentscheidung brauchst.
- eine Runtime-/Persistenzbehauptung noetig waere, die nicht belegbar ist.

Was ausdruecklich nicht Ziel ist:
- kein Auto-Publish
- keine automatische oeffentliche Aktivierung
- kein Social API Posting
- kein Voxy Rendering
- kein Avatar-/Voice-Provider
- kein DeepSearch-Autostart
- keine Cross-lingual Matching Engine
- keine Migration aller Inhalte
- keine neue Produktparallelwelt
- keine Status-Hochstufung ohne gebaute Runtime

Mindest-Checks:
- immer: git diff --check
- bei Docs-only: keine unnoetigen Build-/Typecheck-Laeufe
- bei TS/Tests: relevante vitest-Tests fuer die geaenderten Contracts
- bei App-Code: pnpm -C apps/web run typecheck und pnpm -C apps/web run lint, falls betroffen

Am Ende:
- Erstelle einen PR gegen main.
- PR-Titel: `feat(v3): add canonical preparation and language bridge contracts`
- PR-Body mit Summary, Scope, Checks, bewusst nicht umgesetzt, Folgepfade.
```

## Empfehlung fuer Kontingent-schonendes Vorgehen

Ein einzelner Autopilot-Prompt ist moeglich, aber er sollte Codex intern zu kleinen Phasen und Commits zwingen.

Nicht empfehlen:

- ein einziger riesiger ungepruefter Commit
- Checks komplett auslassen
- OpenTasks, Contracts, Runtime, Voxy und Provider alles gleichzeitig ohne Stop-Regeln

Empfohlen:

- ein Prompt
- ein Branch
- ein PR
- mehrere interne Commits
- relevante Checks pro Phase
- harte Stop-Regeln
- keine Runtime-Erfindungen
