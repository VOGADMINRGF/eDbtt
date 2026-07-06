# V3 Canonical Language Bridge Runtime Backlog

Stand: 2026-07-06

## Zweck

Diese Datei manifestiert die in der aktuellen V3-Abstimmung konsolidierten Produktregeln, Guardrails und Codex-Folgepfade fuer eDebatte/Voxy.

Sie ersetzt keine `OpenTasks.md`, sondern dient als kanonische Verdichtung fuer den naechsten OpenTasks-/Codex-Sweep. Sobald `docs/E150/OpenTasks.md` aktualisiert ist, bleibt `OpenTasks.md` der operative SSOT.

## Repo-Manifestationsregel

1. `docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md`
   - Kanonische Verdichtung aller hier besprochenen Produktentscheidungen.
   - Grundlage fuer Codex-Prompts und OpenTasks-Normalisierung.
2. `docs/E150/OpenTasks.md`
   - Operative Queue.
   - Morgen gezielt per Codex aktualisieren, nicht manuell in einem grossen unsicheren Patch.
3. `docs/E150/ProductionReadinessMatrix.md`
   - Nur Statusfortschreibung nach realer Umsetzung oder Reality-Audit.
   - Nicht als Wunschliste verwenden.
4. GitHub Issue `#310`
   - Voxy Video Briefing Flow Mastertask.
   - Muss auf diese Datei und die Auto-Prepare-/Publish-ready-Regel verweisen.
5. Code-Contracts und Tests
   - Erst in Codex-Slices anlegen.
   - Heute keine Runtime- oder Produktlogik ohne Tests anfassen.

## Grundsatz 1: User gibt frei ein, eDebatte ordnet ein

Der Nutzer soll nicht vorab entscheiden muessen, ob er Poll, Statement, Dossier, Mitmachraum, Live-Frage oder Social-/Voxy-Output braucht.

Kanonischer Flow:

```text
User gibt ein
-> Voxy/eDebatte ordnet ein
-> Sprache, Original und Uebersetzung werden getrennt
-> Aussagen, Fragen, Quellenlage und Unsicherheiten werden sichtbar
-> passendes Beteiligungsformat wird vorgeschlagen
-> Vorschau entsteht
-> Publish-ready / Activation-ready Zustand wird vorbereitet
-> Nutzer/Admin prueft
-> Aktivierung/Veroeffentlichung erfolgt erst nach Review
```

## Grundsatz 2: Auto-Prepare statt Auto-Publish

Nicht aktivieren:

- Auto-Publish
- automatische oeffentliche Aktivierung von Mitmachraeumen
- automatische Poll-/Live-Frage-/Statement-/Social-/Voxy-Video-Veroeffentlichung
- automatische externe Social-API-Ausloesung

Aktivieren:

- Auto-Draft
- Auto-Enrichment
- Auto-Format-Recommendation
- Auto-Preview
- Auto-Schedule-Suggestion
- Publish-ready / Activation-ready Status
- One-click Publish/Activate nach passendem Review

Kanonischer Satz:

> eDebatte automatisiert Vorbereitung, Einordnung, Anreicherung, Formatvorschlag, Vorschau und Publish-ready-Status, aber niemals oeffentliche Aktivierung ohne Review.

## Grundsatz 3: Gemeinsamer Statusvertrag fuer Outputs

Alle outputfaehigen Objekte sollen mittelfristig eine gemeinsame Statusgrammatik nutzen oder darauf mappen:

```ts
type CanonicalPreparationStatus =
  | "draft"
  | "needs_clarification"
  | "review_ready"
  | "publish_ready"
  | "scheduled_after_review"
  | "active_or_published"
  | "archived"
  | "failed";
```

Gemeinsame Guardrail-Flags:

```ts
type CanonicalPublishGuard = {
  autoPublish: false;
  reviewRequired: true;
  publicOutputAllowed: boolean; // false bis passendes Review/Approval
  publishActionEnabled: boolean; // true erst nach passendem Approval
  externalSocialApiTriggered: false;
};
```

Akzeptanzkriterium:

- `publish_ready` bedeutet nicht `published`.
- `publishActionEnabled` darf erst nach Review/Approval true werden.
- `publicOutputAllowed` bleibt false, solange Review fehlt oder Blocker bestehen.

## Grundsatz 4: Restpruefungs-Checkliste sichtbar machen

Jeder vorbereitete Output braucht eine sichtbare Liste dessen, was noch offen ist.

Beispiele:

- Quelle fehlt
- Quellenlage unklar
- Zustaendigkeit offen
- Uebersetzung unsicher
- Poll-Frage noch zu breit
- Poll-Optionen nicht neutral genug
- Live-Kontext fehlt
- Beteiligungsformat braucht Review
- sensitive Inhalte brauchen erhoehten Review
- Provider-/Kosten-Preflight fehlt

Public/UX-Sprache:

```text
Voxy hat deinen Beitrag eingeordnet.
Debatte & Argumente sind vorbereitet.
Quellenlage ist ergaenzt.
Ein passendes Format wurde vorgeschlagen.
Noch offen: Quelle pruefen / Zustaendigkeit klaeren.
Veroeffentlichungsbereit nach Review.
```

Nicht oeffentlich verwenden:

- KI-Lauf
- Runtime fehlt
- Handoff pending
- missing_runtime_truth
- planned_not_active
- Provider-Matrix

Technische Wahrheit bleibt intern/admin sichtbar, aber User-facing wird sie in verstaendlichen Fortschritt uebersetzt.

## Grundsatz 5: Review ist rollen- und objektbezogen

Review darf nicht generisch bleiben.

Kanonische Review-Typen:

- `self_review`: Nutzer prueft eigenen Beitrag/Entwurf.
- `editorial_review`: Redaktion/Operator prueft Debatte, Aussagen, Quellen und Sprache.
- `org_review`: Organisation/Verwaltung prueft Aktivierung oder offizielle Sichtbarkeit.
- `moderation_review`: Missbrauch, PII, sensible Inhalte, Sicherheit.
- `cost_provider_review`: kostenrelevante Provider-, Research-, Render- oder Export-Schritte.
- `publish_review`: finale oeffentliche Aktivierung/Veroeffentlichung.

One-click Publish/Activate ist nur erlaubt, wenn der passende Review-Typ durch die passende Rolle abgeschlossen ist.

## Grundsatz 6: Evidence/Source Pack als gemeinsames Kernobjekt

Dossier, Statements, Polls, Social Drafts, Voxy Video, Factcheck, Feed-Enrichment und Public Outputs sollen nicht jeweils eigene Quellenlogik erfinden.

Kanonisches Zielobjekt:

```ts
type CanonicalSourcePack = {
  sourcePackId: string;
  sources: Array<{
    sourceId: string;
    title: string;
    url?: string;
    sourceLocale?: string;
    regionCode?: string;
    sourceType: "official" | "media" | "civil_society" | "academic" | "user_supplied" | "unknown";
    reliabilityHint: "official" | "primary" | "secondary" | "contested" | "unknown";
    retrievedAt?: string;
    originalSnippet?: string;
    translatedSnippet?: string;
    translationStatus?: "not_needed" | "translated" | "needs_review" | "uncertain";
    evidenceState: "source_needed" | "partial" | "contested" | "supported" | "context_missing" | "outdated";
  }>;
  openGaps: string[];
  reviewState: "review_required" | "approved" | "rejected";
};
```

Regeln:

- Keine Fake-Quellen.
- Keine erfundenen Treffer.
- Keine Quelle wird durch Uebersetzung ersetzt.
- Originalquelle und Originalsprache bleiben erhalten.
- Quellensicherheit wird als Hinweis/Status gezeigt, nicht als KI-Wahrheitssiegel.

## Grundsatz 7: Language Bridge statt klassischer i18n-Abkuerzung

UI-Sprache, Originalsprache, Arbeitssprache, Ausgabesprache und Quellensprache sind getrennt zu behandeln.

Kanonische Ebenen:

- Original
- Uebersetzung
- Zusammenfassung
- Voxy-Einordnung
- Quellenlage
- offene Fragen
- Unsicherheit

Regeln:

- Original bleibt immer erhalten.
- Uebersetzung wird markiert.
- Zusammenfassung ersetzt nie Original oder Quelle.
- Zitate, Positionen und kulturelle Nuancen werden nicht still normalisiert.
- Unsichere Uebersetzung wird sichtbar markiert.
- RTL-Unterstuetzung, insbesondere Arabisch, gehoert zum Contract.

## Grundsatz 8: Cross-lingual Matching nur als Vorschlag

Cross-lingual Matching darf Themen, Claims und Dubletten vorschlagen, aber nicht automatisch mergen.

Regeln:

- Tuerkischer Beitrag kann deutsches Thema erkennen.
- Arabische Antwort kann deutsch gelesen werden.
- Schwedische oder franzoesische Quelle kann in deutscher Lesesprache zusammengefasst werden.
- Gleiche oder aehnliche Claims werden als moegliche Dublette markiert.
- Merge/Zuordnung erfolgt review-first.
- Minderheitenperspektiven duerfen nicht durch Normalisierung verschwinden.

## Grundsatz 9: Trust-Layer statt harter KI-Faktenrichter

Oeffentlich soll eDebatte nicht als Wahrheitsrichter auftreten.

Zielstatus fuer Aussagen:

- `source_needed`
- `source_present`
- `context_missing`
- `contested`
- `partially_supported`
- `supported`
- `normative_position`
- `jurisdiction_unclear`
- `translation_uncertain`
- `outdated`

Public Copy:

- Quellenlage
- Beleglage
- Kontextpruefung
- Gegenposition
- Unsicherheit
- offene Punkte

Nicht als finale Wahrheit behaupten:

- KI-Faktencheck abgeschlossen
- wahr/falsch ohne Pruefpfad
- Factcheck-Seal ohne echten Review und Quellenpfad

## Grundsatz 10: Nicht Newsmaschine, nicht Content-Schleuder

Feeds, Social und Voxy dienen Debattenstand, Quellenlage, Verstaendigung und Beteiligung.

Nicht Ziel:

- endlose Newsfeed-Startseite
- Trend-Content-Spam
- Social-Media-Maschine ohne Quellenlage
- Voxy-Video aus Trenddruck ohne Dossier-/Review-Kontext

Ziel:

- Relevante Signale erkennen
- Quellenlage anreichern
- Debattenstand verbessern
- geeignete Beteiligungsform vorschlagen
- reviewfaehige Outputs vorbereiten

## Grundsatz 11: Provider-Neutralitaet plattformweit

Nicht nur Voxy Video, sondern alle externen Integrationen muessen austauschbar bleiben.

Provider-Klassen:

- `LLMProvider`
- `TranslationProvider`
- `SearchProvider`
- `FactcheckProvider`
- `VoiceProvider`
- `AvatarProvider`
- `RenderProvider`
- `PublishProvider`
- `StorageProvider`

Regeln:

- Kein Feature-Code bindet direkt an einen Anbieter.
- Provider-Ausfall fuehrt zu sichtbarem Fehlerstatus, nicht stillem Erfolg.
- Kosten-/Nutzungstruth muss fuer kostenrelevante Schritte vorbereitet sein.
- Externe Tools sind Adapter, nicht Produktkern.

## Grundsatz 12: Kosten- und Provider-Preflight

Auto-Enrichment ist erlaubt, aber kostenrelevante Schritte brauchen Preflight.

Preflight muss zeigen:

- welcher Schritt gestartet wird
- welcher Provider genutzt wird
- ob Kosten/Limits betroffen sind
- ob Review/Approval notwendig ist
- ob Fallback moeglich ist
- ob Output oeffentlich werden kann oder nur Draft bleibt

Besonders relevant fuer:

- DeepSearch
- mehrsprachige Uebersetzung in groesserem Volumen
- Voxy Voice
- Avatar/Talking Head
- Rendering
- Social-/Publishing-Exports
- grosse Evidence/Feed-Laeufe

## Grundsatz 13: Recovery, Retry und Audit als Automationspflicht

Jeder automatische Vorbereitungsschritt braucht:

- Status
- Fehlergrund
- Retry-Moeglichkeit
- manuelle Korrektur
- Audit Trail
- keine stillen Fehler
- keine doppelten Runtime-Records ohne Merge-/Review-Entscheid

Dies gilt fuer:

- Create/Analyze
- Dossier-Handoff
- Feed-Enrichment
- Translation
- Source Pack
- Poll-Vorschlag
- Social Draft
- Voxy Script
- Render Job
- Publishing Draft

## Grundsatz 14: User-Lifecycle — kein Beitrag ins Nichts

Jeder Beitrag braucht nachvollziehbare Rueckmeldung.

User-facing Lifecycle:

```text
Eingegangen
-> eingeordnet
-> Thema/Debatte gefunden oder neu vorbereitet
-> Aussagen/Fragen erkannt
-> Quellenlage ergaenzt oder offen markiert
-> Formatvorschlag erstellt
-> Review-ready
-> Publish-ready / Activation-ready
-> aktiviert/veroeffentlicht oder mit Grund zurueckgestellt
-> Ergebnis/Auswertung verfuegbar
```

Akzeptanzkriterium:

- User sieht, was aus seinem Beitrag wurde.
- User sieht, wer/was als naechstes pruefen muss.
- User sieht, ob sein Beitrag oeffentlich wurde, angehaengt wurde oder noch Klaerung braucht.

## Grundsatz 15: Voxy Persona Guardrails

Voxy ist Moderator und Brueckenbauer, nicht Richter, Amt oder politische Autoritaet.

Regeln:

- Voxy ist klar als Avatar/Mascot gekennzeichnet.
- Kein Eindruck, Voxy sei eine echte Person.
- Voxy spricht keine amtliche Wahrheit.
- Voxy ordnet ein, zeigt Quellenlage, macht Unsicherheit sichtbar.
- Voxy darf keine politische Zuspitzung ungeprueft als Fakt darstellen.
- Stimme, Avatar, Assets und Brand-Regeln werden versioniert.
- Rechte/Lizenzen von Stimme/Avatar/Assets muessen dokumentiert bleiben.

## Operative Codex-Reihenfolge ab morgen

### Codex 1 — Canonical OpenTasks Sweep

Task-ID:

`V3-CANONICAL-LANGUAGE-BRIDGE-RUNTIME-BACKLOG-01`

Ziel:

- `docs/E150/OpenTasks.md` mit einem neuen operativen V3-Block ergaenzen.
- Diese Datei als kanonischen Beleg referenzieren.
- Keine Runtime-Implementierung.
- Keine Status-Hochstufung in `ProductionReadinessMatrix.md`, ausser als docs-only/verankert.

OpenTasks-Block soll mindestens enthalten:

1. `V3-AUTO-PREPARE-PUBLISH-READY-GUARD-01`
2. `V3-CANONICAL-PREPARATION-STATUS-CONTRACT-01`
3. `V3-LANGUAGE-BRIDGE-TRUST-FORMAT-CONTRACT-01`
4. `V3-EVIDENCE-SOURCE-PACK-CONTRACT-01`
5. `V3-ROLE-SPECIFIC-REVIEW-CONTRACT-01`
6. `V3-USER-CONTRIBUTION-LIFECYCLE-01`
7. `V3-DOWNSTREAM-RUNTIME-HANDOFF-PERSISTENCE-01`
8. `V3-PARTICIPATION-POLL-HANDOFF-PERSISTENCE-01`
9. `V3-UNIFIED-REVIEW-QUEUE-01`
10. `V3-DOSSIER-WORKSPACE-REVIEW-SURFACE-01`
11. `V3-MULTILINGUAL-STATEMENTS-COMMENTS-THREADS-01`
12. `V3-MULTILINGUAL-EVIDENCE-TRUST-01`
13. `V3-CROSS-LINGUAL-TOPIC-CLAIM-CLUSTERING-01`
14. `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
15. `V3-VOXY-VIDEO-BRIEFING-FLOW-MASTER-01`

### Codex 2 — Contract Types + Tests

Erst nach Codex 1.

Ziel:

- shared Contract fuer `CanonicalPreparationStatus` und Publish-Guard anlegen.
- Contract-Tests fuer `autoPublish=false`, `reviewRequired=true`, `publish_ready !== published`.
- Keine Public-Action vor passendem Review.

### Codex 3 — Language Bridge / Trust / Format Recommendation

Ziel:

- Language Bridge Contract operationalisieren.
- Trust-Layer Status statt finalem Faktenrichter.
- Format Recommendation review-first und publish-safe.

### Codex 4 — Evidence/Source Pack

Ziel:

- gemeinsames SourcePack-Modell vorbereiten.
- Feed, Dossier, Claim, Social und Voxy spaeter darauf ausrichten.

### Codex 5 — Downstream Runtime Handoff

Ziel:

- Dossier-Runtime-Draft sauber in Graph-/Anlassraum-/Participation-Folgepfade tragen.
- Weiterhin kein Auto-Publish, kein Auto-Graph-Write, kein Auto-DeepSearch.

### Codex 6 — Review Queue / Dossier Workspace

Ziel:

- Unified Review Queue als zentrale Arbeitsflaeche.
- Dossier Workspace mit Claims, Gegenpositionen, Quellen, Fragen, Poll-/Social-/Voxy-Kandidaten.

### Codex 7 — Voxy Video Architecture + Types

Ziel:

- Issue #310 in `docs/E150/V3_VOXY_VIDEO_BRIEFING_FLOW_2026-07-06.md` ueberfuehren.
- `apps/web/src/features/voxyVideo/` vorbereiten.
- Types, Statusmodell, Provider-Interfaces und Contract-Tests anlegen.
- Keine Provider-Implementierung, kein Rendering, kein Publishing.

## Codex-Prompt fuer morgen: erster Slice

```text
Du arbeitest im Repo VOGADMINRGF/edebatte-org.

Ziel: Fuehre einen docs-only Canonical OpenTasks Sweep fuer V3 durch.

Ausgangslage:
- docs/E150/OpenTasks.md ist der operative SSOT.
- docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md enthaelt die neu kanonisierten Produktregeln.
- Issue #310 ist der Voxy Video Briefing Flow Mastertask.

Aufgabe:
1. Ergaenze docs/E150/OpenTasks.md um einen neuen operativen V3-Block fuer die naechsten Slices.
2. Nimm mindestens diese Tasks auf:
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
3. Fuehre fuer jeden Task Status, Priority, Depends on, Scope, Goal, Acceptance Criteria, Decision open und Evidence/Notes auf.
4. Halte fest: Auto-Prepare ja, Auto-Publish nein.
5. Halte fest: publish_ready ist nicht published.
6. Halte fest: One-click Publish/Activate erst nach passendem Review/Approval.
7. Halte fest: externe Provider bleiben Adapter, nicht Produktkern.
8. Keine Runtime-Implementierung, keine Status-Hochstufung, keine Produktlogik.
9. Aktualisiere docs/E150/ProductionReadinessMatrix.md nur falls dort ein docs-only Verweis sinnvoll ist; keine falsche Readiness behaupten.
10. Ergaenze oder aktualisiere Tests nur, falls bestehende Docs-/Guardrail-Tests zwingend einen neuen Verweis brauchen.

Validierung:
- git diff --check
- falls keine Codeaenderung: keine unnoetigen Build-/Typecheck-Laeufe
- falls Tests angepasst werden: gezielte relevante Tests laufen lassen

Ergebnis:
- PR mit knapper Summary
- klare Folgeempfehlung fuer den naechsten Contract-Type-Slice
```

## Heute bewusst nicht anfassen

- Keine direkte Aenderung an `OpenTasks.md` ohne vollstaendigen Kontextpatch.
- Keine Runtime-/Code-Implementierung.
- Keine Tests ohne Code-/Contract-Aenderung.
- Keine `ProductionReadinessMatrix`-Hochstufung.
- Kein Merge von Voxy/Provider/Render/Publish-Logik.

Heute reicht: diese Doku manifestieren, Issue #310 ergaenzen, PR oeffnen.
