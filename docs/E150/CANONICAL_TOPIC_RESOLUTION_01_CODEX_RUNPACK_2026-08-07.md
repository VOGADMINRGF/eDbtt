# CANONICAL-TOPIC-RESOLUTION-01 · Codex Run-Pack

Stand: 2026-08-07

Status: Governance-/Ausführungsvorbereitung. Dieser Run-Pack autorisiert noch keine Implementierung. Der technische Slice darf erst beginnen, wenn `CANONICAL-TOPIC-RESOLUTION-01` verlustfrei durch den kanonischen Single Writer in `docs/E150/OpenTasks.md` auf `codex_ready` serialisiert wurde und der taskbezogene Preflight `executable: true` sowie `branchCreationAllowed: true` bestätigt.

Bezug: Issue #586. Priorisierte fachliche Reihenfolge: #587 zuerst beziehungsweise konfliktfrei davor; keine zweite Themen-, Evidenz- oder Graph-SSOT.

## Ziel

Einen kleinen, read-only und fail-closed Resolver-Contract vorbereiten, der Nutzereingaben zuerst gegen vorhandene eDebatte-Themen-, Dossier-, Anlassraum-, Runden- und DecisionQuestion-Kandidaten auflöst und nur bei unzureichendem Bestand in den bestehenden `/create`-Ergänzungs-/Neuanlagepfad führt.

Der erste Slice bildet **keinen** vollständigen semantischen Voxy-Resolver und erzeugt weder automatisch Themen noch Fusionen, Abstimmungen, Akteurspositionen oder Finanzierungsentscheidungen.

## Bestehende Flächen, die wiederzuverwenden sind

Vor Implementierungsstart gegen den dann aktuellen `main` erneut verifizieren:

- `apps/web/src/features/create/analyzeContract.ts`;
- bestehende Matchtypen wie `exact_claim`, `related_claim`, `same_anlassraum`, `related_dossier`, `duplicate_risk`, `no_match`;
- bestehende Match-Entitäten wie `claim`, `anlassraum`, `dossier`, `perspective`, `question`;
- `matchingLanguageMode` und dessen derzeitige Sprachgrenzen;
- `sourceState`/degraded-Verhalten und bestehende Human-Review-Gates;
- `apps/web/src/features/create/matchService.ts` als Legacy-Matchpfad;
- vorhandene Dossier-, Anlassraum-, Runden-, Graph- und Create-Contracts;
- bestehende regionale Source-/Cluster- und Actor-/Organization-Handoffs nur als Read-Signale.

Der vorhandene Matchpfad darf nicht stillschweigend als vollständiger `CanonicalTopic`-Resolver umetikettiert werden.

## Kanonische Mindesttypen

### `CanonicalTopic`

Dauerhafter eDebatte-Themenkosmos mit stabiler ID. Ein lokales Ereignis oder eine andere Formulierung erzeugt nicht automatisch ein neues Thema.

Mindestens:

- stabile Topic-ID;
- kanonischer Titel/Key getrennt von Lesefassungen;
- sprachunabhängige Identität;
- Status und Reviewzustand;
- Referenzen auf vorhandene Dossiers/Anlassräume/DecisionQuestions;
- keine politische Position als Eigenschaft des Themas.

### `JurisdictionContext`

Mindestens:

- Ortsteil/Kiez;
- Kommune/Bezirk;
- Landkreis;
- Bundesland;
- Bund;
- EU;
- international.

Anderer Ort bedeutet grundsätzlich separaten Jurisdiktionskontext, nicht automatisch ein neues Grundthema.

### `DecisionQuestion`

Konkrete Entscheidungs-, Konsultations- oder Beteiligungsfrage unter einem Topic und gegebenenfalls einer Jurisdiktion.

Sie bleibt strikt getrennt von:

- dauerhaftem Thema;
- externer Petition;
- Veranstaltung;
- bloßer Meinungsumfrage;
- amtlicher/formaler Abstimmung.

### `ExternalParticipationSignal`

Read-only Kontextsignal, mindestens für:

- Petition;
- externe Umfrage;
- Bürgerinitiative/Bürgerbewegung;
- Vereinssignal;
- Beirats-/Ausschuss-/BVV-/Gemeinderats-/sonstige öffentliche Sitzung;
- Antrag/Beschlussvorlage/Verwaltungsverfahren;
- Veranstaltung/Runder Tisch/lokale Aktion.

Pflichtfelder mindestens:

- externe Herkunft und URL;
- Signaltyp;
- Initiator/Organisation;
- Region/Jurisdiktion;
- veröffentlichter/geplanter Zeitpunkt;
- Freshness/Gültigkeit;
- Quellen-/Vertrauensstatus;
- Beziehung zum Topic;
- Beziehung zu vorhandener eDebatte-Frage/Runde;
- Reviewstatus.

Keine automatische Vollständigkeits-, Wahrheits- oder Repräsentativitätsbehauptung.

## Resolver-Ergebnis

Der erste Contract soll deterministisch ausschließlich folgende Ergebnisfamilien modellieren:

- `existing_topic`
- `existing_decision_question`
- `ambiguous_candidates`
- `create_extension_required`
- `review_required`

Optional dürfen rein technische Untergründe ergänzt werden, solange sie keine neue Produktautomation erzeugen.

## Harte Entscheidungsregeln

1. Vorhandenes eDebatte-Thema/Dossier/Anlassraum hat Vorrang vor Neuerstellung.
2. Reine Umformulierung oder `duplicate_risk` darf keine Neuanlage auslösen.
3. Zwei oder mehr plausible Kandidaten führen zu `ambiguous_candidates` beziehungsweise `review_required`, nie zu Auto-Fusion.
4. Unklare Region/Jurisdiktion führt zu Review.
5. Sprachübergreifende Unsicherheit führt zu Review; Übersetzung darf keinen Matchgrad künstlich erhöhen.
6. Degradierte oder unzuverlässige Matchquelle darf keinen Resolver-Erfolg erzeugen.
7. Externe Petition/Umfrage/Sitzung bleibt `ExternalParticipationSignal` unter einem bestehenden oder zu prüfenden Topic; sie erzeugt keine parallele Themenwelt.
8. Anderer Ort erzeugt einen separaten `JurisdictionContext`, nicht automatisch ein neues `CanonicalTopic`.
9. Andere konkrete Entscheidung kann eine eigene `DecisionQuestion` unter demselben Topic erzeugen, jedoch im ersten Slice nur als Kandidatenklassifikation, nicht als Persistenzschreibzugriff.
10. Finanzielle oder sonstige Unterstützung verändert weder Ranking noch Matchresultat.
11. Keine Actor-Position oder Zuständigkeit aus Name, Partei, Organisation, Trägerschaft oder Kontakt ableiten.
12. Kein Auto-Merge, Auto-Publish, Auto-Poll, Auto-Anlassraum oder Graph-Write.

## Zulässiger Implementierungsscope nach positivem Preflight

Bevorzugt:

- neu: `apps/web/src/features/create/canonicalTopicResolutionContract.ts`;
- neu: `apps/web/tests/canonical-topic-resolution.contract.test.ts`;
- kleiner read-only Adapter an `matchService.ts` oder `analyzeContract.ts` nur, wenn rückwärtskompatibel und für die Typisierung zwingend;
- Evidence-Dokument unter `docs/E150/`.

Nicht zulässig:

- neue DB/Collection/Migration;
- Graph-Merge oder Graph-Write;
- UI-Redesign;
- produktive Voxy-Empfehlungslogik;
- Actor-/Organization-Automation;
- Funding-/Support-Slice;
- externe Providerintegration;
- Auto-Publish oder Deployment.

## Pflicht-Fixtures

Mindestens reproduzierbar nachweisen:

1. Gleicher Grundinhalt, anderer Ort → gleicher Topic-Kandidat + separater `JurisdictionContext`.
2. Andere konkrete Entscheidung → eigene `DecisionQuestion` unter demselben Topic, kein neues Grundthema.
3. Externe Petition → `ExternalParticipationSignal` unter vorhandenem Topic.
4. Reine Umformulierung → `duplicate_risk`/Review, keine Neuerstellung.
5. Zwei plausible Kandidaten → begründete Kandidatenliste, keine Fusion.
6. Fehlende Region → Review.
7. Sprachübergreifende Unsicherheit → Review.
8. Degradierte Matchquelle → kein Resolver-Erfolg.
9. Finanzielle Unterstützungspräferenz verändert weder Ranking noch Match.
10. Externe Initiative wird nicht abgewertet und nicht als von eDebatte übernommen dargestellt.
11. Fehlende belastbare Beziehung zu einem Topic → `create_extension_required` oder Review, nie stilles Auto-Topic.
12. Legacy-Matchresultate bleiben lesbar und rückwärtskompatibel.

## Erwartete technische Nachweise

Nach Implementierung mindestens:

- fokussierte Contract-/Fixture-Tests grün;
- `git diff --check` grün;
- Typecheck grün;
- Lint grün;
- relevante Security-/Guardrail-Tests grün;
- Build grün, sofern Build-relevante Type-Flächen berührt werden;
- Exact Head dokumentiert;
- PR-Scope gegen `main` geprüft;
- keine offenen Review-Threads;
- keine erfundenen Browser-/Production-Smokes.

## Branch- und PR-Vertrag nach Freigabe

Erst nach erfolgreicher OpenTasks-Serialisierung und positivem Preflight:

- isolierter Implementierungsbranch `feat/canonical-topic-resolution-01`;
- erster PR maximal Contract + Fixture + minimal notwendiger read-only Adapter + Evidence;
- Draft bis CI, Scope und Reviews vollständig geklärt sind;
- Ready for review nur bei grünem Exact-Head-Gate;
- kein Merge ohne ausdrückliche Betreiberfreigabe.

## Aktueller Blocker

Auf `main@eb41bc2d06c2bbee8ce23823604ee4a51d92dc17` fehlt `CANONICAL-TOPIC-RESOLUTION-01` weiterhin im kanonischen operativen Kopf von `docs/E150/OpenTasks.md`.

Dieser Run-Pack ersetzt den OpenTasks-Eintrag nicht. Er reduziert den noch offenen Governance-Schritt auf die verlustfreie Single-Writer-Serialisierung und den anschließenden taskbezogenen Preflight.