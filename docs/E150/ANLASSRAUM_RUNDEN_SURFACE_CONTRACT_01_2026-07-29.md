# Anlassraum-/Runden-Surface-Contract 01

Datum: 2026-07-29

Task: `ANLASSRAUM-RUNDEN-SURFACE-CONTRACT-01`

Status: verbindlicher Decision-, Routing-, Entitäten-, Lifecycle-, Kontext-,
Berechtigungs-, UX- und Migrationsvertrag; Implementierung ausstehend

Scope: `/create`, `/anlassraum`, `/anlassraum/[id]`, `/dossier`,
`/dossier/[id]`, `/runden`, `/runden/[id]`, `/beteiligung/[slug]` und
`/swipes`

Nicht im Scope: Runtime-, UI-, Routing-, Persistenz-, Rollen- oder
Teständerungen

## 1. Zweck, Geltung und Entscheidungsgrundlage

Dieser Contract führt bereits getroffene Entscheidungen implementierbar
zusammen. Er trifft keine neue Produktentscheidung und erzeugt keine neue
Runtime, Collection, Queue, Rolle oder kanonische Datenhaltung.

Verbindliche Entscheidungsgrundlage:

- Issue `#461` und
  `docs/E150/V3_WORKSPACE_CONTRACT_01_2026-07-27.md` für den gemeinsamen
  Workspace-, Interaktions- und UX-Vertrag,
- Issue `#480` einschließlich Produktabnahme-Kommentar vom 2026-07-29 für das
  getrennte Endmodell und die Nichtabnahme des heutigen Mischflusses,
- Issue `#481` einschließlich beider Kommentare für Entitäten, Routing,
  Lifecycle, Kontext-Envelope und den rein dokumentarischen ersten Slice,
- Issues `#482`, `#463` und `#483` für Anlassraum, Runde und direkte
  Participation,
- Issue `#488` einschließlich Serialisierungskommentar für die
  Ausführungskette,
- Issue `#522` für `/swipes` als Modus derselben Participation-Wahrheit,
- der kanonische operative Kopf von `docs/E150/OpenTasks.md`.

Normative Begriffe in diesem Dokument beschreiben fachliche Zustände. Sie sind
nur dann persistierte Werte, wenn die jeweilige Ist-Zuordnung dies ausdrücklich
belegt. Eine mit **Mapping-Lücke** gekennzeichnete Phase darf nicht durch einen
neuen Stringwert, einen Client-Store oder ein Demo-Objekt vorgetäuscht werden.

## 2. Auflösung des bisherigen Vertragswiderspruchs

### 2.1 Bisherige Alias-Regel

Der ältere V3-Workspace-Contract respektiert die damalige
`/anlassraum`-Alias- und Query-Semantik als vorhandene Routing-Wahrheit. Im
aktuellen Repo kopiert `apps/web/src/app/anlassraum/page.tsx` alle
Query-Parameter und leitet nach `/runden` weiter. Diese Regel ist eine
kontrollierte Kompatibilitätsgrundlage, nicht mehr das fachliche Zielmodell.

### 2.2 Getrenntes Zielmodell

Die späteren Entscheidungen aus `#480`, `#481`, `#482`, `#463`, `#488` und
`#522` sind für den Endstate spezifischer und maßgeblich:

- Anlassraum und Runde sind getrennte fachliche Entitäten.
- `/anlassraum` wird Übersicht realer Anlassräume.
- `/anlassraum/[id]` wird dauerhafter Kontext-, Betreiber- und Begleitraum.
- `/runden` wird Übersicht konkreter Beteiligungsphasen.
- `/runden/[id]` wird genau eine Runde in genau einem Anlassraum.
- Direkte Beteiligung und Swipe-Modus verwenden dieselbe freigegebene
  Rundenphase.

### 2.3 Rangfolge

Bei einem Widerspruch gilt:

1. der kanonische operative Kopf von `OpenTasks.md` für Ausführbarkeit und
   Status,
2. die spezifischen, späteren Entscheidungen `#480`, `#481`, `#488` und
   `#522` für das fachliche Endmodell,
3. dieser zusammenführende Contract für die Umsetzung der beschlossenen
   Trennung,
4. der V3-Workspace-Contract weiterhin vollständig für UX, visuelle Grammatik,
   progressive Offenlegung und Interaktion,
5. dessen ältere Alias-Passage ausschließlich als Ist- und
   Kompatibilitätsbeschreibung.

Der ältere Contract wird in diesem Slice nicht verändert. Dieser Contract
ersetzt nicht dessen UX-Regeln, sondern präzisiert dessen überholte
Routing-Auslegung.

### 2.4 Kontrollierte Kompatibilitätsphase

Bis ein eigener Migrationsslice implementiert und geprüft ist:

- bleibt der vorhandene query-erhaltende Redirect technisch bestehen,
- dürfen bestehende Links nicht still gebrochen werden,
- ist der Redirect kein Beleg dafür, dass Anlassraum und Runde fachlich gleich
  sind,
- werden neue UI- oder Datenpfade nicht auf der Alias-Gleichsetzung aufgebaut,
- werden historische Zugriffe vor einer Ablösung inventarisiert und die
  spätere Migration beobachtbar gemacht.

Dieser Slice verändert keine Route, keinen Canonical und keinen Redirect.

## 3. Verbindliche Produktrollen

| Oberfläche | Verbindliche Rolle | Ausdrücklich nicht |
| --- | --- | --- |
| `/create` | Freier Einstieg zum Verstehen, Strukturieren, Klären, zur Formatempfehlung und zur Vorbereitung eines bewussten Handoffs. | Kein automatisches Dossier, kein automatischer Anlassraum, keine automatische Runde und keine Veröffentlichung. |
| `/anlassraum` | Übersicht realer, für die betrachtende Person berechtigter Anlassräume mit ehrlichem Leer-, Lade-, Fehler- und Nicht-berechtigt-Zustand. | Keine Runden-Landingpage, kein Demo-Fallback und keine Erstellung einer vermischten Entität. |
| `/anlassraum/[id]` | Dauerhafter Kontext-, Betreiber- und Begleitraum mit Ursprung, Organisation, Zweck, Zielgruppe, Material, Dossierbezug, Runden, Zugängen und Nachbereitung. | Nicht die einzelne Beteiligungsphase und nicht das analytische Dossier. |
| `/dossier` | Übersicht vorhandener und entsprechend ihrer Sichtbarkeit zugänglicher Dossiers. | Keine Demo-Liste und keine Anlassraum- oder Rundenübersicht. |
| `/dossier/[id]` | Analytischer Sach-, Quellen-, Evidenz-, Positions-, Widerspruchs- und Fragenstand. | Kein Betreiberraum, keine direkte Teilnahme und kein automatisches Ergebnisziel. |
| `/runden` | Übersicht konkreter Beteiligungsphasen mit Anlassraumbezug und je genau einer nächsten Aktion. | Keine Marketing-Landingpage, kein großer Hero und keine Anlassraum-Erstellung. |
| `/runden/[id]` | Genau eine zeitlich oder methodisch begrenzte Runde innerhalb genau eines Anlassraums. | Kein zweites Dossier, kein gesamter Anlassraum und keine freie `/create`-Strecke. |
| `/beteiligung/[slug]` | Reduzierte direkte Teilnahme für genau eine freigegebene Rundenphase über Link, QR, Embed, Einladung oder zulässigen Code. | Kein Betreiber-Dashboard und keine Teilnahme außerhalb der freigegebenen Phase. |
| `/swipes` | Schneller Discovery- und Beteiligungsmodus geeigneter freigegebener Rundenphasen. | Keine zweite Vote-, Ergebnis-, Lifecycle-, Moderations- oder Persistenzwelt. |

## 4. Entitäten, IDs und Beziehungen

### 4.1 Fachliche Entitäten

| Entität | Normative Bedeutung | Repo-nahe Ist-Wahrheit |
| --- | --- | --- |
| Handoff | Reviewpflichtige, bestätigungspflichtige Übergabe eines vorbereiteten Arbeitsstands an einen zulässigen Zielkontext. | `CreateHandoffDraft`, persistierte Handoff-Records und Unified-Review-Wiring; ein Handoff ist noch kein Zielobjekt. |
| Dossier | Analytischer Stand aus Aussagen, Positionen, Quellen, Evidenzen, Widersprüchen und offenen Fragen. | `features/dossier/*`, Dossier-Studio-Persistenz und öffentliche Dossier-Runtime. |
| Anlassraum | Dauerhafter situativer Kontext-, Betreiber- und Begleitraum zu einem Anlass. | `features/anlassraum/*`, Aktivierungsworkflow und öffentliche Anlassraum-Runtime. |
| Runde | Konkrete, begrenzte Beteiligungsphase eines Anlassraums. | Heute nur teilweise durch `TopicRound`, `output_seed` und abgeleitete `RundenEntryItem`-Readmodels belegt; eine vollständige persistierte Rundenentität fehlt. |
| Rundenphase | Aktuelle methodische und zeitliche Freigabe innerhalb einer Runde. | Phasenbegriffe sind in Issues und einzelnen Statusmodellen vorhanden, aber nicht als gemeinsames persistiertes Phasenobjekt durchgängig belegt. |
| Participation Space / Public Entry | Zugriff, Sichtbarkeit und reduzierte öffentliche Darstellung einer freigegebenen Participation. | Participation-Space-Container, Publish-Workflow und `/beteiligung/[slug]`; die Bindung an `roundId` und `phaseId` ist noch nicht E2E vorhanden. |
| Contribution | Eingabe einer Person, etwa Frage, Argument, Quelle, Perspektive oder Begründung, mit eigenem Review- und Sichtbarkeitsstatus. | Kanonische Server-Drafts und Contribution-Lifecycle; Legacy-Records bleiben nur Read-Fallback. |
| Antwort, Option oder Vote | Nur das durch die konkrete Rundenart zugelassene Antwortobjekt. Vote ist nicht Synonym für Beitrag, Option, Priorisierung oder Wahrheit. | Topic-Optionen, Participation-Kandidaten und bestehende Vote-Pfade sind vorhanden, aber noch nicht durch eine gemeinsame Rundenphasen-ID vereinheitlicht. |
| Review-Kontext | Zuständigkeit, Queue-Zustand, Prüftyp, Blocker und nächste zulässige Review-Aktion. | Bestehende Review Queue, persistierte Handoff-Review-Records und Unified-Review-Verträge. |
| Audit-Kontext | Akteur, Zeit, Scope, Aktion, Ziel, Ergebnis sowie optional Vorher/Nachher und Begründung. | `features/audit/*` und bestehende workflow-spezifische Audit-Trails. |

### 4.2 Verbindliche Beziehungen

- Ein Anlassraum besitzt eine stabile `anlassraumId`.
- Eine Runde besitzt eine stabile `roundId`.
- Jede Runde gehört zu genau einem Anlassraum.
- Ein Anlassraum kann null bis viele Runden enthalten.
- Ein Dossier kann mit mehreren Anlassräumen verbunden sein.
- Ein Anlassraum verwendet höchstens einen primären Dossierbezug. Im Ist ist
  dafür `dossierId` auf dem Anlassraum belegt. Weitere Bezüge dürfen nur als
  bereits belegte, rückverfolgbare Referenzen zusammengesetzt werden; dieser
  Contract führt dafür kein neues Persistenzfeld ein.
- Eine Runde kann mehrere Phasen oder Aufgaben im Verlauf besitzen, aber zu
  einem Zeitpunkt muss die freigegebene aktuelle Phase eindeutig sein.
- Direkte Beteiligung und Swipe-Modus referenzieren dieselbe `roundId`,
  `phaseId`, Frage, Optionen, Eligibility, Einwilligung, Moderationslogik,
  Ergebniswahrheit und dasselbe Zähl- beziehungsweise
  Idempotenz-/Mehrfachteilnahme-Regime.
- Eine öffentliche Participation-URL verweist auf genau eine freigegebene
  Phase, nicht pauschal auf den gesamten Betreiberraum.
- Ergebnisrückführungen erzeugen reviewpflichtige Vorschläge; sie
  überschreiben weder Anlassraum noch Dossier automatisch.
- Keine ID wird aus URL-Text, sichtbarem Titel, Kartenposition oder
  Listenreihenfolge abgeleitet.
- Es entsteht keine zweite kanonische Datenhaltung.

### 4.3 Strikte Trennung der Identifikatoren

| Begriff | Zweck | Regel |
| --- | --- | --- |
| fachliche Entität | Anlassraum, Dossier, Runde, Phase, Contribution oder Option | Besitzt eine stabile interne Identität unabhängig von Darstellung und URL. |
| öffentliche URL / Slug | Lesbarer oder nicht erratbarer öffentlicher Einstieg | Wird auf eine intern berechtigte Entität aufgelöst; der Slug ist nicht automatisch deren technische ID. |
| interne technische ID | Persistenz-, Referenz- und Korrelationsschlüssel | Bleibt stabil und wird nicht aus Titel oder Slug neu berechnet. |
| sichtbarer Titel | Veränderbare Nutzeranzeige | Darf ohne Identitätswechsel geändert oder übersetzt werden. |
| Review- oder Handoff-ID | Korrelation eines Übergabe- oder Prüfvorgangs | Ist kein Ersatz für `dossierId`, `anlassraumId`, `roundId` oder `phaseId`. |

Der heutige Ist-Stand verwendet an einzelnen öffentlichen Dossier- und
Participation-Pfaden ID und Slug gleich. Das ist eine Implementierungsform,
keine Erlaubnis, die Begriffe im Endvertrag zu vermischen.

## 5. Gemeinsames Kontext-Envelope

### 5.1 Normativer Typ

```ts
type SurfaceContextEnvelope = {
  topic: {
    key?: string | null;
    title?: string | null;
  } | null;
  region: {
    id?: string | null;
    label?: string | null;
    jurisdiction?: string | null;
  } | null;
  originalLanguage: string | null;
  readingLanguage: string | null;
  interfaceLanguage: string | null;
  outputLanguage: string | null;
  locale: string | null;
  handoffId: string | null;
  dossierId: string | null;
  anlassraumId: string | null;
  roundId: string | null;
  phaseId: string | null;
  reviewContext: {
    reviewItemId?: string | null;
    queueState?: string | null;
    requiredReviewType?: string | null;
    visibilityState?: string | null;
    allowedActions?: string[];
  } | null;
};
```

Dies ist ein normativer Übergabevertrag, kein Auftrag, diesen Typ in diesem
Slice zu persistieren. `phaseId` ergänzt die in `#481` und `#522` beschlossene
gemeinsame Phasenbindung.

### 5.2 Feldvertrag

| Feld | Bedeutung und verantwortliche Quelle | Pflicht | Weitergabe, Fehlen und Reload |
| --- | --- | --- | --- |
| `topic` | Fachlicher Themenbezug aus kanonischem Handoff, Anlassraum oder Dossier; Label und Key bleiben getrennt. | Bedingt erforderlich, sobald ein Zielobjekt vorbereitet oder geöffnet wird. | Zwischen allen verbundenen Flächen erhalten. Fehlt der Wert, wird „Themenbezug noch offen“ gezeigt; kein Titel wird als ID verwendet. Server- oder URL-gebundene Rekonstruktion nach Reload. |
| `region` | Wirk-, Vergleichs- oder Zuständigkeitsraum aus Intake, Dossier-Workspace, Anlassraum oder bestätigtem Kontext. | Optional im freien Intake, bedingt erforderlich bei regionaler Berechtigung oder Veröffentlichung. | Nicht aus Sprache ableiten. Fehlend bleibt `null` und sichtbar offen. ID und Label getrennt erhalten; Reload aus persistiertem Objekt beziehungsweise sicherer Query. |
| `originalLanguage` | Sprache des unveränderten Ausgangsmaterials. Quelle ist Source-/Material- oder Language-Bridge-Wahrheit. | Erforderlich, sobald Originalmaterial vorliegt. | Nie durch Lese- oder UI-Sprache überschreiben. Fehlt die belegte Erkennung, `null`/„nicht bestimmt“ statt `de`. |
| `readingLanguage` | Gewählte Lesefassung der betrachtenden Person. Quelle ist die getrennte Lesepräferenz. | Optional. | Über Navigation erhalten; ohne Wert Original oder klar gekennzeichnete verfügbare Fassung zeigen, aber keine stille Übersetzung behaupten. |
| `interfaceLanguage` | Sprache der Bedienelemente. Quelle ist die UI-Präferenz beziehungsweise `uiLocale`. | Für Rendering erforderlich, darf aber getrennt vom Inhalt sein. | Aus Nutzer-/Sitzungspräferenz oder expliziter Locale auflösen. Kein Rückschluss auf Original- oder Ausgabesprache. |
| `outputLanguage` | Gewünschte Sprache eines vorbereiteten Outputs. Quelle ist die explizite Ausgabepräferenz oder der Handoff. | Optional bis zur Output-Vorbereitung, dann erforderlich. | Bei Fehlen vor Ausgabe nachfragen oder offen lassen; nicht auf Deutsch setzen. |
| `locale` | Formatierungs- und Routingkontext für Zahlen, Datum und regionale Darstellung. | Für lokalisiertes Rendering erforderlich. | Aus expliziter UI-/Routingpräferenz auflösen; ist nicht automatisch identisch mit einer der vier Sprachrollen. |
| `handoffId` | Korrelation des bewussten Übergabevorgangs. Quelle ist der persistierte Handoff. | Erforderlich bei Handoff-basiertem Einstieg, sonst optional. | Ziel muss die ID auswerten oder sichtbar erklären, dass der Handoff nicht geladen werden konnte. Query allein ist keine Persistenz. Reload darf den Handoff nicht verlieren. |
| `dossierId` | Stabile interne Dossieridentität. Quelle ist Dossier-SSOT oder bestätigter Handoff. | Erforderlich auf Dossierdetail; sonst optional. | Zwischen Dossier, Anlassraum und Runde erhalten. Fehlt ein optionaler Bezug, bleibt „ohne Dossier“ zulässig; keine Demo-ID einsetzen. |
| `anlassraumId` | Stabile interne Anlassraumidentität. Quelle ist Anlassraum-SSOT. | Erforderlich auf Anlassraumdetail und für jede reale Runde. | Zwischen Anlassraum, Runde, Participation und Rücknavigation erhalten. Fehlt sie bei Rundenerstellung, bleibt Erstellung blockiert; kein Titel-/Slug-Fallback. |
| `roundId` | Stabile interne Rundenidentität. Quelle ist die zukünftige kanonische Rundenwahrheit. | Erforderlich auf Rundendetail sowie direkter und Swipe-Participation. | Bei fehlender ID keine Teilnahme und keine Zählung. Reload und Wechsel zwischen direkt/Swipe müssen dieselbe ID rekonstruieren. |
| `phaseId` | Eindeutige freigegebene Phase der Runde. Quelle ist die kanonische Phasenabbildung. | Erforderlich für direkte oder Swipe-Participation. | Fehlt sie, ist Participation „nicht verfügbar“; niemals auf „aktuelle erste Phase“ raten. |
| `reviewContext` | Bestehender Queue-, Prüftyp-, Sichtbarkeits- und Aktionskontext. Quelle ist Review-SSOT. | Erforderlich in Review- und Freigabeflächen, sonst optional. | Nur berechtigte Details weitergeben. Fehlender Kontext blockiert Freigabe-/Publish-Aktionen fail-closed; nach Reload aus der Review-Wahrheit rekonstruieren. |

### 5.3 Bekannter Ist-Drift

Belegt und in diesem Slice nicht korrigiert:

- Der Dossier-Handoff ist in den öffentlichen Dossier-Komponenten nicht
  überall sichtbar nachvollziehbar.
- `handoffId` wird nicht auf allen Zieloberflächen ausgewertet; Typen führen
  ihn teilweise, ohne ihn in die Runtime-Abfrage zu binden.
- Region und Sprachkontext gehen zwischen Intake, Handoff und öffentlicher
  Darstellung teilweise verloren.
- Die öffentliche Dossier-Runtime setzt `region: undefined` und
  `analyze.language: "de"`.
- Teile des Unified-Review-Wirings erzeugen Language Bridges mit festem
  `sourceLanguage`, `contentLanguage` und `uiLocale` `"de"`.
- Create besitzt nebeneinander ein dreiteiliges Language-Context-Modell und
  neuere getrennte Präferenzen; das gemeinsame Envelope ist noch nicht E2E
  verdrahtet.
- Anlassraum-, Dossier-, Runden-, Phasen-, Handoff- und Review-ID bilden noch
  kein gemeinsames End-to-End-Envelope.

Keine dieser Lücken wird durch stille Defaults, Query-only-Zustand oder neue
Client-Persistenz verdeckt.

## 6. SSOT-Zuordnung

| Wahrheit | Wiederzuverwendende Träger | Zusammensetzung / belegte Lücke | Zuständiger Folgeslice |
| --- | --- | --- | --- |
| Create-/Draft-/Handoff-Wahrheit | Kanonische `drafts`-Collection über `serverDrafts`, Create-Handoff-Verträge, persistierte Handoff-Review-Records | Session-Storage-Handoff existiert zusätzlich als UI-Hilfe; E2E ist der persistierte Record maßgeblich. IDs und Sprachkontext sind nicht vollständig verbunden. | Je Zieloberfläche, abschließend `ANLASSRAUM-RUNDEN-E2E-CLOSURE-01` |
| Dossier-SSOT | `features/dossier/*`, Dossier-Studio-Persistenz, Dossier-Publish-Workflow und öffentliche Runtime | Öffentliche Darstellung wird aus Dossier- und Publication-Wahrheit zusammengesetzt. Region/Sprache und Handoff-Sichtbarkeit driften. | Bestehende Dossier-Folgeslices; Cross-Surface-Schluss im E2E-Task |
| Anlassraum-Wahrheit | `features/anlassraum/*`, `anlassraum`, Quellen-/Struktur-Collections, Aktivierungsworkflow und Audit | Anlassraum besitzt heute einen primären `dossierId`. Übersicht und Detailroute fehlen; Alias zeigt nicht diese Wahrheit. | `ANLASSRAUM-WORKSPACE-02` |
| TopicRound-/Stream-/Session-Wahrheit | `features/topicRound/*`, bestehende Stream-/Session-Verträge | `TopicRound.Round` kennt nur `open`/`closed`; `RundenEntryItem` wird aus Anlassraum plus `output_seed` abgeleitet. Eine stabile persistierte `roundId` mit Parent und Phasen fehlt. | `RUNDEN-WORKSPACE-03`, Event-Flow |
| Participation Space / Public Entry | Participation-Space-Container, Runtime-/Publish-Workflow, `/beteiligung/[slug]` | Public Runtime ist heute read-only aus Publish-Records und kann Fixture-Fallback zeigen; `roundId`/`phaseId`, Zugang, Consent und Eligibility sind nicht durchgängig gebunden. | `PARTICIPATION-QR-SURFACE-01` |
| Contribution-Wahrheit | Kanonische Server-Drafts und User-Contribution-Lifecycle | Contribution kann `anlassraumId` tragen, aber noch keine gemeinsame Round-/Phase-Bindung. | Participation-, Runden- und Swipe-Slices |
| Antwort-/Option-/Vote-Wahrheit | Topic-Optionen, Participation-Kandidaten und bestehende Vote-Services/-APIs | Mehrere historische Vote-Pfade sind vorhanden. Welcher Pfad für eine konkrete Rundenart kanonisch ist, muss vor Write-Wiring belegt werden; keine Zusammenlegung durch Annahme. | `RUNDEN-WORKSPACE-03`, `PARTICIPATION-QR-SURFACE-01` |
| Review-Wahrheit | `features/reviewQueue.ts`, Review-Operations, persistierte Handoff-Queue und Unified-Review-Verträge | Review-Modelle sind vorhanden, aber noch nicht über ein gemeinsames Surface-Envelope korreliert. | Voxy-Foundation und jeweilige Surface-Slices |
| Audit-Wahrheit | `features/audit/*`, Unified-Audit-Readside und workflow-spezifische Audit-Trails | Audit-Schemas existieren; Round-/Phase-Ziele fehlen, solange die Entität fehlt. | Je schreibendem Folgeslice |
| Organisations- und Berechtigungswahrheit | Request-Scope, verifizierte Membership, bestehende Rollen, Entitlements, Vertrags-Scope und Review-Autorität | Keine neue Produktrolle nötig. Eine Fähigkeit entsteht nur aus vorhandener Scope-, Ownership-, Membership-, Entitlement- und Vertragswahrheit. | Anlassraum-, Runden- und Participation-Slices |
| Sprach- und Übersetzungskontext | Locale-Präferenzen, Language-Bridge- und multilingualer Trust-Vertrag | Noch kein einheitliches Envelope; feste `de`-Defaults sind belegter Drift. | jeweilige Surface-Slices, Abschluss im E2E-Task |

Es wird keine neue Collection, Queue, Parallelruntime oder zweite
Client-Wahrheit eingeführt.

## 7. Lifecycle-Vertrag

### 7.1 Anlassraum

| Normative Phase | Belegte Ist-Zuordnung | Bedeutung / Mapping-Lücke |
| --- | --- | --- |
| Entwurf | Anlassraum `draft`; Activation `draft` | Gespeichert, intern, nicht aktiviert und nicht öffentlich. |
| in Prüfung | `curated`, `review_required` sowie bestehender Review-Kontext | Prüfung ist weder Freigabe noch Aktivierung. Ein einzelner persistierter Sammelwert ist nicht erforderlich. |
| vorbereitet | `reviewed`, `approved`, `ready_for_public_link`; Activation `approved_for_activation` oder `approved_for_publication` | Welche technische Stufe gilt, hängt von der konkreten Aktion ab. Sichtbarkeit bleibt getrennt. |
| aktiv / nutzbar | Anlassraum `active`; Activation `activated` für intern oder `published` für bewusst öffentlich | Intern aktiv und öffentlich veröffentlicht sind verschiedene Zustände. |
| abgeschlossen | Anlassraum `closed` | Keine neue Teilnahme; Nacharbeit kann separat erforderlich sein. |
| archiviert | Anlassraum und Activation `archived` | Historisch nachvollziehbar, keine aktive Teilnahme. |

### 7.2 Runde

| Normative Phase | Belegte Ist-Zuordnung | Bedeutung / Mapping-Lücke |
| --- | --- | --- |
| Entwurf | `output_seed.status = draft`; manuelle Runden-/Anlassraum-Drafts | Noch keine eigenständige persistierte Runde. |
| Konfiguration | `draft`/`queued` und bestehende Draftfelder | **Mapping-Lücke:** kein kanonischer Rundenkonfigurationsstatus. |
| Review | `output_seed.status = review`, `reviewState = pending` und Review Queue | Review ist nicht Freigabe. |
| freigegeben | `output_seed.status = ready`, `reviewState = approved` als vorhandene Teilindizien | **Mapping-Lücke:** kein eindeutiger phasenbezogener Freigabestatus. |
| geplant | keine belastbare gemeinsame Persistenz | **Mapping-Lücke.** Datum oder UI-Text darf diesen Zustand nicht vortäuschen. |
| offen | `TopicRound.Round.status = open` als älterer Basisträger | **Mapping-Lücke:** keine belastbare Trennung `open_live` / `open_continuous` und keine gemeinsame Phase. |
| pausiert | abgeleiteter `RundenEntryProductionState = paused` aus Anlassraumstatus | **Mapping-Lücke:** derzeit keine eigenständige Rundenpause. |
| geschlossen | `TopicRound.Round.status = closed` beziehungsweise abgeleiteter `closed` | Die heutige Ableitung aus `output_seed` ist semantisch unzureichend und darf nicht als Endmodell gelten. |
| abgelaufen | keine belastbare gemeinsame Persistenz | **Mapping-Lücke.** Fristüberschreitung muss später deterministisch abgebildet werden. |
| Ergebnis in Prüfung | Review-Wahrheit und `follow_up_required` als Teilindizien | **Mapping-Lücke:** kein eindeutiger Runden-Ergebnisreview. |
| abgeschlossen | `closed` nach Ergebnis- und Reviewabschluss | **Mapping-Lücke:** „geschlossen“ und fachlich „abgeschlossen“ sind noch nicht sauber getrennt. |

`archived` bleibt ein nachgelagerter Aufbewahrungszustand und ersetzt
„abgeschlossen“ nicht.

### 7.3 Direkte Beteiligung

| Normative Phase | Belegte Ist-Zuordnung | Bedeutung / Mapping-Lücke |
| --- | --- | --- |
| nicht verfügbar | kein veröffentlichter Record, fehlende Phase oder Blocker | Kein Fixture- oder Demo-Ersatz in Production. |
| zugangsbeschränkt | Issue-Vertrag; bestehende Scope-/Access-Bausteine | **Mapping-Lücke:** Code-, Einladung-, Zielgruppen- und Eligibility-Vertrag ist nicht E2E verdrahtet. |
| offen | `ParticipationSpace.status = intake_open` plus `visibility = public_intake_open` | Öffentliche Runtime ist aktuell auf `public_read_only`-Publication ausgelegt; schreibende Teilnahme bleibt Folgescope. |
| pausiert | keine belastbare gemeinsame Participation-Phase | **Mapping-Lücke.** |
| geschlossen | `closed_archived` als heutiger kombinierter Status | Abschluss und Archiv sind im Container noch vermischt. |
| Ergebnis sichtbar | `public_feedback_live` plus explizit verfügbare öffentliche Rückmeldung | Ergebnisfreigabe bleibt von Teilnahmeende und Veröffentlichung getrennt. |

### 7.4 Getrennte Übergänge

Folgende Aktionen sind niemals Synonyme:

1. **Speichern** hält einen privaten oder internen Arbeitsstand.
2. **Zur Prüfung geben** erzeugt oder aktualisiert einen Reviewvorgang.
3. **Prüfen** bewertet Inhalt, Kontext, Regeln und Blocker.
4. **Freigeben** erlaubt ausschließlich den benannten nächsten Schritt.
5. **Aktivieren / öffnen** macht einen intern oder öffentlich zulässigen
   Laufzeitmodus nutzbar.
6. **Sichtbarkeit konfigurieren** legt den zulässigen Leserkreis fest.
7. **Veröffentlichen** macht eine ausdrücklich freigegebene Fassung
   öffentlich.
8. **Schließen** beendet weitere Teilnahme.
9. **Ergebnis prüfen** bewertet Datenbasis, Moderation und Grenzen.
10. **Ergebnis freigeben** erlaubt eine sichtbare Ergebnisfassung.
11. **Archivieren** beendet den aktiven Workflow unter Erhalt der
    Nachvollziehbarkeit.

Kein Auto-Publish, keine automatische Runde, keine automatische Aktivierung,
keine automatische Abstimmung und keine automatische Ergebnisübernahme in
Anlassraum oder Dossier.

## 8. Berechtigungs- und Aktionsvertrag

Dieser Contract erfindet keine Rollen. Er bindet Fähigkeiten an die bestehende
Wahrheit aus Sitzung, Resource Ownership, `ownerId`/`stewardUserId`,
verifizierter Organisationsmitgliedschaft, vorhandenen Managementrollen,
Request Scope, Entitlements, Vertrags-Scope, Review-Autorität und
veröffentlichter Sichtbarkeit.

| Phase / Kontext | Sichtbar | Erlaubt | Verboten | Primäre Aktion | Sekundär | Ohne Fähigkeit / Reviewpflicht |
| --- | --- | --- | --- | --- | --- | --- |
| Create-Arbeitsstand | Eigene Eingabe, Quellenlage, offene Fragen, vorgeschlagenes Format | verstehen, bearbeiten, speichern, Handoff vorbereiten | automatische Zielerstellung, Aktivierung oder Veröffentlichung | nächsten Klär- oder Handoff-Schritt ausführen | Arbeitsstand speichern, Quelle ergänzen | Nur eigene beziehungsweise zulässige Daten; Handoff bleibt bestätigungs- und reviewpflichtig. |
| Anlassraum-Entwurf | Kontext, Ursprung, Material, realer Dossierbezug, Blocker | mit vorhandener Manage-Fähigkeit bearbeiten und zur Prüfung geben | öffentlich teilen, Runde automatisch aktivieren | fehlenden Pflichtkontext vervollständigen oder zur Prüfung geben | speichern, Dossier öffnen | Read-only oder Nicht-berechtigt-Zustand; keine Operatorfelder leaken. |
| Anlassraum-Review | prüfbarer Stand, Provenienz, Sichtbarkeit, Risiken, Audit | mit vorhandener Review-Autorität prüfen, zurückgeben oder benannte Freigabe erteilen | Bulk-Approve, automatische Publikation | aktuelle Reviewentscheidung | Notiz, Quelle oder Kontext öffnen | Fehlende Autorität zeigt Entscheidung und zuständige nächste Stelle, aber keine mutierende Aktion. |
| Anlassraum aktiv / publizierbar | Status, Zugänge, Runden, erlaubte Sichtbarkeit | mit passender Fähigkeit aktivieren, Sichtbarkeit konfigurieren oder nach separater Freigabe veröffentlichen | Freigabe, Aktivierung und Publish in einem Klick | genau der nächste zulässige Übergang | Vorschau, Audit, zurück | Jeder Übergang erfordert eigene bestätigte Wirkung. |
| Runden-Entwurf / Konfiguration | Parent-Anlassraum, Frage, Format, Optionen, Zeitmodell, Regeln | mit Manage-Fähigkeit konfigurieren, speichern, Review anfordern | Parent entfernen, automatisch öffnen, Formate vermischen | nächste unvollständige Konfiguration oder Review anfordern | Vorschau, Anlassraum/Dossier öffnen | Ohne reale `anlassraumId` keine Erstellung; ohne Fähigkeit read-only. |
| Runde freigegeben / geplant | Frage, Phase, Freigabe, Startbedingungen | mit passender Fähigkeit planen oder öffnen | still veröffentlichen, automatisch abstimmen | Runde öffnen, wenn alle belegten Bedingungen erfüllt sind | Regeln prüfen, zurück zur Konfiguration | Fehlende Voraussetzungen blockieren fail-closed und werden konkret benannt. |
| Runde offen | aktuelle Aufgabe, Regeln, Laufzeit, echter eigener Stand | entsprechend Rundenart beitragen oder mit Betreiberfähigkeit pausieren/schließen | nicht freigegebene Antwortart, Mehrfachzählung, Ergebnis vorwegnehmen | zulässige aktuelle Beteiligungsaktion; für Betreiberansicht phasenbezogen genau eine Steueraktion | Quelle/Kontext öffnen, eigenen Entwurf speichern | Nicht berechtigt zeigt Grund und zulässigen Lesepfad; Contribution bleibt reviewpflichtig. |
| Runde pausiert / geschlossen / abgelaufen | Status, Grund, erlaubter Ergebnis- oder Lesestand | lesen; Betreiber mit Fähigkeit fortsetzen oder Ergebnisreview starten, soweit der Zustand es erlaubt | neue Teilnahme bei Pause/Schluss/Ablauf | zulässige Statusfolge oder Ergebnis ansehen | Anlassraum/Dossier öffnen | Kein versteckter Submit; Entwürfe werden nicht still veröffentlicht. |
| Direkte Beteiligung | Kernfrage, knapper Kontext, eigene Aufgabe, Consent-/Sichtbarkeitshinweis | nur die freigegebene Antwortart absenden | Betreiberaktionen, Teilnahme außerhalb Phase, behauptete Anonymität | Beitrag prüfen und bewusst absenden | Entwurf speichern, freiwillige Vertiefung | Ohne Eligibility/Zustimmung keine Mutation; verständlicher Zugangs- oder Schlusszustand. |
| Swipe-Modus | geeignete freigegebene Kernreaktion und knapper Kontext | dieselbe Participation-Aktion wie direkt, optional vertiefen | eigener Vote-Store, Like-Umdeutung, Doppelzählung | Kernreaktion bewusst absenden | begründen, Quelle/Perspektive, vertiefen | Gemeinsame Eligibility- und Consent-Grenze; fehlende Phase ergibt ehrlichen Leerzustand. |
| Ergebnisreview | Datenbasis, Moderation, Grenzen, Minderheiten, Audit | mit Review-Autorität prüfen, zurückgeben oder Ergebnisfassung freigeben | Rohtrend als Mandat/Wahrheit veröffentlichen, Dossier überschreiben | Ergebnisentscheidung | Datenbasis, Beiträge, Anlassraum/Dossier öffnen | Ohne Autorität read-only; Rückführung bleibt eigener Reviewvorgang. |

### 8.1 Voxy-Grenzen

Voxy darf:

- erklären,
- strukturieren,
- beim Formulieren helfen,
- den nächsten zulässigen Schritt vorschlagen,
- auf fehlenden Kontext, Berechtigung oder Review hinweisen.

Voxy darf ohne explizite menschliche Bestätigung nicht:

- speichern,
- absenden,
- aktivieren,
- veröffentlichen,
- moderieren,
- abstimmen,
- Ergebnisse freigeben,
- Dossier- oder Anlassraumwahrheit überschreiben.

„Mit Voxy“ oder „ohne Voxy“ ist ein Assistenzmodus, niemals eine alternative
Speicher-, Review-, Aktivierungs- oder Veröffentlichungsaktion.

## 9. Routing- und Migrationsvertrag

### 9.1 Zielrouten

| Route | Zielzustand und Canonical | Ist / Migration |
| --- | --- | --- |
| `/anlassraum` | Kanonische Anlassraumübersicht. | Heute query-erhaltender Redirect nach `/runden`; bleibt bis zum Migrationsslice Kompatibilitätsweg. |
| `/anlassraum/[id]` | Kanonische Detailroute eines realen Anlassraums; öffentlicher Slug darf nach Auflösung auf dieselbe interne ID führen. | Route fehlt. Implementierung in `ANLASSRAUM-WORKSPACE-02`. |
| `/runden` | Kanonische Übersicht realer Runden; Filter dürfen Kontext erhalten, ändern aber nicht die Entitätsrolle. | Heute Landing-, Anlassraum- und Rundenlogik gemischt. |
| `/runden/[id]` | Kanonische Detailroute einer stabilen `roundId` mit sichtbarem Parent-Anlassraum. | Route und vollständige Entität fehlen. |
| `/dossier/[id]` | Kanonische Dossierdetailroute; ID/Slug wird gegen Dossier-SSOT aufgelöst. | Existiert; Handoff-/Envelope-Drift bleibt offen. |
| `/beteiligung/[slug]` | Kanonischer Public Entry für genau eine freigegebene `roundId`/`phaseId`. | Existiert als Participation-Space-Route; Phasenbindung, Zugriff und schreibende Participation sind unvollständig. |
| `/swipes` | Kanonischer schneller Modus geeigneter freigegebener Phasen; Round-/Phase-Kontext wird sicher aufgelöst. | Bestehende Query-/Handoff- und `/swipes/[id]`-Pfade müssen vor Wiring inventarisiert werden. Keine Breaking-Änderung in diesem Slice. |

### 9.2 Neue Runde und Demo-Routen

- `/runden/new` bleibt höchstens ein kontrollierter Kompatibilitätseinstieg.
  Er darf keine Mischentität aus Anlassraum, Event, Mitmachraum und Runde
  erzeugen.
- Vor dem Speichern einer neuen Runde muss ein realer, berechtigter
  `anlassraumId`-Kontext ausgewählt oder durch einen bestätigten Handoff
  aufgelöst sein. Das Ergebnis erhält eine reale `roundId` und führt später
  nach `/runden/[id]`.
- `/runden/demo` darf keine dossierartige Paralleloberfläche, keine
  Production-Zahlen und keine alternative Round-SSOT darstellen. Falls die
  Route nach Link-Audit erhalten bleibt, ist sie ausdrücklich Demo, nicht
  kanonisch für Produktionsobjekte und nicht als reale Runde verlinkt.
- `/dossier/demo` bleibt ausdrücklich Demo und darf keine
  Production-Dossierwahrheit simulieren.
- Fixture-Routen und Fixture-Fallbacks sind kein zulässiger Production-Ersatz.

### 9.3 Historische Links, Queries und Redirects

Die spätere Migration erfolgt in getrennten, testbaren Schritten:

1. alle internen und veröffentlichten `/anlassraum`-, `/runden`,
   `/runden/new`, Demo-, QR-, Embed- und Share-Caller inventarisieren,
2. historische Aufrufe und Queryformen messen, ohne sensible Inhalte zu
   loggen,
3. `anlassraumId` gegen die reale Anlassraumwahrheit auflösen,
4. eindeutige historische Anlassraumlinks query-erhaltend nach
   `/anlassraum/[id]` leiten,
5. reine Übersichtsaufrufe nach `/anlassraum` führen,
6. uneindeutige oder ungültige IDs fail-closed mit sichtbarem
   Nicht-gefunden-/Kontext-hinzufügen-Zustand behandeln,
7. Rundenlinks nur bei realer `roundId` nach `/runden/[id]` kanonisieren,
8. Canonicals, Sitemap, Navigation, QR, Embed und Share-Ziele gemeinsam
   aktualisieren,
9. Redirect-Schleifen, Queryverlust und Cross-Surface-Reload automatisiert und
   manuell prüfen,
10. erst danach den Alias als reine Legacy-Weiterleitung zurückbauen oder
    entfernen.

Nicht jeder bestehende `/runden?anlassraumId=…`-Link hat nachweislich dieselbe
Absicht. Deshalb darf kein pauschaler Redirect ohne Caller- und Link-Audit
eingeführt werden. Erlaubte Querywerte werden sicher übernommen; unbekannte,
sensitive oder objektfremde Parameter werden nicht blind in öffentliche URLs
propagiert. Kontextverlust muss sichtbar sein, nicht still.

Keine Runtime-, Redirect- oder Canonical-Änderung erfolgt in diesem Slice.

## 10. Navigations- und Handoff-Vertrag

Bei allen Übergängen werden `topic`, `region`, die vier Sprachrollen, `locale`
und der zulässige `reviewContext` erhalten, soweit sie vorhanden und am Ziel
sichtbar sein dürfen. IDs werden serverseitig beziehungsweise aus der
kanonischen Zielwahrheit rekonstruiert; Queryparameter sind Transport, nicht
SSOT.

| Übergang | Erforderliche IDs | Ziel | Erlaubter Fallback | Berechtigung, Reload und Deep Link |
| --- | --- | --- | --- | --- |
| Create → Anlassraum | `handoffId`; nach Bestätigung reale `anlassraumId` | `/anlassraum/[id]` | Zurück zum persistierten Create-Handoff; kein neues Objekt bei Fehler | Handoff auswerten, Zielberechtigung prüfen, nach Reload über beide IDs korrelieren. |
| Create → Dossier | `handoffId`; nach Bestätigung reale `dossierId` | `/dossier/[id]` | Persistierter Handoff oder Dossierübersicht mit sichtbarem Hinweis | Kein Demo-Dossier; fehlende Berechtigung zeigt read-only/Nicht-berechtigt. |
| Dossier → Anlassraum | `dossierId`; vorhandene oder nach Review erzeugte `anlassraumId` | `/anlassraum/[id]` | Auswahl real verbundener Anlassräume oder bestätigter Handoff | Keine automatische Anlassraumerstellung; Bezug hält nach Reload. |
| Anlassraum → Dossier | `anlassraumId`; optional vorhandene `dossierId` | `/dossier/[id]` | Anlassraum bleibt mit sichtbarem „ohne Dossier“ | Nur reale primäre oder belegte weitere Referenz; fehlende Leseberechtigung fail-closed. |
| Anlassraum → Runde | `anlassraumId`, reale `roundId` | `/runden/[id]` | Rundenmodus im Anlassraum oder ehrlicher Leerzustand | Erstellen nur mit Manage-Fähigkeit und Review; Deep Link zeigt Parent immer. |
| Runde → Anlassraum | `roundId`, `anlassraumId` | `/anlassraum/[id]` | Kein Titel-/Slug-Raten; Nicht-gefunden-Zustand | Parentbezug unveränderlich, Reload aus Round-SSOT. |
| Runde → Dossier | `roundId`, `anlassraumId`, optional `dossierId` | `/dossier/[id]` | Runde bleibt geöffnet und erklärt fehlenden Dossierbezug | Nur zugängliche Dossierfassung; Kontext-/Sprachrollen erhalten. |
| Runde → direkte Beteiligung | `roundId`, `phaseId`, aufgelöster Public-Entry-Slug | `/beteiligung/[slug]` | Runde mit „Teilnahme nicht verfügbar“ | Nur freigegebene Phase und zulässiger Zugang; Reload löst Slug erneut gegen IDs auf. |
| direkte Beteiligung → Runde | `roundId`, `phaseId` | `/runden/[id]` | freiwillige Vertiefung im Public Entry, wenn Rundendetail nicht sichtbar ist | Betreiberfelder bleiben geschützt; öffentlicher Lesepfad nur soweit freigegeben. |
| Swipe → Runde | `roundId`, `phaseId` | `/runden/[id]` | im Swipe-Deck bleiben | Kein Verlust des gespeicherten Participation-Status; keine erneute Zählung. |
| Swipe → Dossier / Anlassraum | `roundId`, `phaseId`, plus reale `dossierId` oder `anlassraumId` | `/dossier/[id]` oder `/anlassraum/[id]` | freiwillige Vertiefung auslassen | Nur freigegebener Lesekontext; Rückkehr zum selben Swipe-/Participation-Stand. |
| Runde → Review → Aktivierung | `roundId`, `reviewItemId`; Parent- und Phasen-IDs | bestehende Reviewroute, danach `/runden/[id]` | Runde bleibt im vorherigen Zustand | Review, Freigabe und Aktivierung sind getrennte bestätigte Aktionen; Reload aus Queue und Round-SSOT. |
| Ergebnis → Review → Anlassraum/Dossier | `roundId`, `phaseId`, `reviewItemId`, Ziel-ID | Reviewroute, danach Zielobjekt | Ergebnis bleibt in Prüfung | Rückführung erzeugt Vorschlag/Revision, kein Überschreiben; Auditkorrelation hält nach Reload. |

## 11. Gemeinsamer UX- und Visual-Contract

`/create` und `V3-WORKSPACE-CONTRACT-01` bleiben Referenz.

Verbindlich:

- gemeinsamer ruhiger, hochwertiger V3-Seitenrahmen,
- konsistente Header-, Navigations-, Karten-, Typografie-, Abstands-, Status-
  und Aktionsgrammatik,
- stabiler Objektkopf mit Gegenstand, Parent-/Dossierkontext, Status und genau
  einer nächsten Aktion,
- genau eine dominante primäre Aktion pro Phase,
- progressive Offenlegung statt vollständig sichtbarer Formularwand,
- Nutzereingabe oder aktueller Arbeitsstand zuerst,
- Kontext, Vertrauensgrenzen und nächste Aktion sofort verständlich,
- keine zweite Marketing-Landingpage und kein großer Marketing-Hero im
  Arbeitsraum,
- keine konkurrierenden Speichern-, Voxy-, Review-, Aktivierungs- und
  Veröffentlichungspfade,
- Voxy als kontextbezogene Assistenz, nicht als zweite Anwendung,
- keine erfundenen KPIs, Beteiligungszahlen, Trends oder Fortschrittswerte,
- echte Leer-, Lade-, Fehler-, Nicht-berechtigt-, Pause-, Schluss- und
  abgelaufene Zustände,
- dieselbe Fach- und Zustandswahrheit auf Desktop und Mobile,
- vollständige Light-/Dark-Unterstützung ohne Farbe als einzigen
  Statusindikator,
- RTL-taugliche Reihenfolge, Abstände, Icons, Drawer und Fokuslogik,
- vollständige Tastaturbedienung und sichtbarer Fokus,
- kontrollierte Fokusführung beim Öffnen/Schließen von Drawer, Dialog oder
  Reviewfläche,
- semantische Landmarken, Überschriften, Accessible Names und verständliche
  Statusankündigungen für Screenreader,
- Reduced Motion ohne versteckten oder unzugänglichen Inhalt,
- getrennte Original-, Lese-, Bedien- und Ausgabesprache mit blockweisem
  `lang`/`dir`.

## 12. Scope-Grenzen der Folgeslices

Alle folgenden Implementierungen bleiben nach diesem Slice `blocked`;
`ORGANIZATION-CLAIMABLE-INBOX-01` bleibt `manual_gate`.

| Task-ID | Ausschließliche Zuständigkeit |
| --- | --- |
| `VOXY-SMART-PRESENCE-FOUNDATION-01` | Gemeinsame typisierte Hilfe-, Peek-, Dock- und Kontextfoundation; keine Surface-Endimplementierung. |
| `ANLASSRAUM-WORKSPACE-02` | `/anlassraum`, `/anlassraum/[id]`, reale Übersicht, Detail, Alias-/Linkmigration und Anlassraum-Envelope-Adoption. |
| `RUNDEN-WORKSPACE-03` | Stabile Runde mit Parent, `/runden`, `/runden/[id]`, Runden-/Phasenmapping und fokussierter Workspace. |
| `PARTICIPATION-QR-SURFACE-01` | `/beteiligung/[slug]`, Public-Entry-Auflösung, Zugang, Consent, Eligibility, QR/Link/Embed und direkte Participation. |
| `SWIPE-RUNDEN-PARTICIPATION-MODE-01` | `/swipes` auf derselben Round-/Phase-/Participation-Wahrheit ohne Doppelzählung. |
| `EVENT-ANLASSRAUM-FLOW-01` | Event, Agenda, mehrere Runden, Live-Steuerung, Participation und Nachbereitung im gemeinsamen Fluss. |
| `JOURNALISM-COMPANION-FLOW-01` | Medienanker, Anlassraum, Dossieranschluss, QR/Embed und reviewpflichtige Rückführung. |
| `VOXY-CROSS-SURFACE-AGENT-01` | Gemeinsame Sitzung, Navigation sowie sichere Chat-/Voice-Aktionen nach stabilen Surface-Verträgen. |
| `ANLASSRAUM-RUNDEN-E2E-CLOSURE-01` | Reale End-to-End-Abnahme aller IDs, Übergänge, Schutzverträge, Geräte- und Rückführungsszenarien. |

Keine dieser Implementierungen wird in diesem Contract-Slice ausgeführt.

## 13. Abnahme- und Testmatrix für spätere Implementierung

| Prüfbereich | Verbindliche Abnahme |
| --- | --- |
| Route und Deep Link | Jede kanonische Route löst eine reale Entität auf; ungültige IDs/Slugs sind fail-closed. |
| Reload | Objekt, eigener Arbeitsstand, Phase, Sprache und zulässiger Rückweg bleiben erhalten. |
| Kontext-Envelope | Alle vorhandenen Felder bleiben erhalten; fehlende Werte werden sichtbar und nicht auf Deutsch oder eine Demo-ID gesetzt. |
| Berechtigung | Public Read, Participation, Manage, Review, Freigabe und Publish folgen vorhandenen Fähigkeiten; keine Operatorfelder leaken. |
| Lifecycle | Jede normative Phase ist entweder belegt gemappt oder bis zum Mapping blockiert. |
| Primärer CTA | Pro Phase und betrachteter Rolle genau eine dominante Aktion. |
| Review-/Aktivierungsgrenze | Speichern, Review, Freigabe, Aktivierung, Sichtbarkeit und Publish sind separat getestet. |
| Keine automatische Veröffentlichung | Create, Handoff, Anlassraum, Runde, Contribution, Ergebnis und Voxy bleiben review-first. |
| Keine Doppelzählung | Direkte Participation und Swipe verwenden dieselbe Personen-/Eligibility-/Idempotenz- und Ergebniswahrheit. |
| Desktop / Mobile | Gleiche fachliche Priorität, keine verdeckte zweite Primäraktion, Safe Areas und 200-Prozent-Zoom geprüft. |
| Light / Dark | Kontrast, Status, Fokus und Overlays in beiden Themes. |
| RTL | Layout, Navigation, Icons, Zahlen-/Datumsdarstellung, Drawer und Fokus geprüft. |
| Tastatur | Vollständige Bedienung, logische Reihenfolge, Escape-/Return-Fokus und sichtbarer Fokus. |
| Screenreader | Landmarken, Überschriften, Statuswechsel, Fehler und Aktionswirkung verständlich. |
| Mehrsprachigkeit | Original-, Lese-, Bedien- und Ausgabesprache getrennt; Übersetzung gekennzeichnet; keine stille `de`-Normierung. |
| Fehler- und Leerzustände | Laden, leer, nicht gefunden, nicht berechtigt, pausiert, geschlossen, abgelaufen und Runtimefehler ohne Fixture-Ersatz. |
| Historische Migration | Caller-, Query-, Canonical-, Redirect-, QR-, Embed- und Share-Audit; keine Schleife und kein Kontextverlust. |
| Reale Daten | Keine Production-Karte, Zahl, Phase oder Teilnahme aus Fixtures oder Demo-Stores. |
| E2E-Rückführung | Ergebnis erzeugt Review-/Audit-korrelierte Vorschläge und überschreibt Anlassraum/Dossier nie automatisch. |

## 14. Offene technische Lücken

### 14.1 Belegte Repo-Lücken

Ausschließlich belegte Ist-Lücken:

1. `/anlassraum` ist derzeit ein query-erhaltender Redirect nach `/runden`;
   `/anlassraum/[id]` existiert nicht.
2. `/runden/[id]` existiert nicht. Die Rundenübersicht leitet Einträge
   überwiegend aus `output_seed`, Anlassraum und weiteren Readmodels ab.
3. `TopicRound.Round` kennt nur `open` und `closed`; ein persistiertes
   kanonisches Runden- und Phasenmodell mit stabiler `roundId`/`phaseId`,
   Parentzwang und vollständigem Lifecycle ist nicht belegt.
4. `RundenEntryItem` führt als eigene ID die Output-Seed-ID und zusätzlich
   `anlassraumId`; das ist noch keine belegte fachliche `roundId`.
5. Der heutige Runden-Lifecycle setzt `output_seed.status = published` oder
   `discarded` auf `closed`; diese Ableitung reicht für den Zielvertrag nicht.
6. `paused` wird im Runden-Readmodel aus dem Anlassraumstatus abgeleitet und
   ist noch keine eigenständige Rundenphase.
7. `planned`, `open_live`, `open_continuous`, `expired` und ein eigener
   Ergebnisreview sind nicht als gemeinsames persistiertes Phasenmodell
   belegt.
8. `/beteiligung/[slug]` löst derzeit einen Participation Space auf, nicht
   nachweislich genau eine `roundId`/`phaseId`.
9. Die öffentliche Participation-Runtime kann Fixture-Fallbacks anzeigen und
   ist in der veröffentlichten Runtime auf read-only-Sichtbarkeit ausgelegt.
10. Code-/Einladungszugang, Zielgruppen-Eligibility, Consent,
    Mehrfachteilnahme, Pause und Ablauf sind noch nicht E2E an dieselbe
    Participation-Wahrheit gebunden.
11. Bestehende Contribution-, Option- und Vote-Pfade sind nicht durchgehend
    über dieselbe Round-/Phase-/Question-/Option-ID korreliert; ein
    kanonischer Write-Pfad darf nicht geraten werden.
12. `handoffId` ist in Zielkomponenten teilweise typisiert oder als Query
    vorhanden, wird aber nicht überall ausgewertet und sichtbar korreliert.
13. Persistierte Create-Handoffs führen Region, Dossier und Anlassraum, aber
    keine `roundId`/`phaseId` und kein vollständiges gemeinsames
    Sprach-Envelope.
14. Die öffentliche Dossier-Runtime setzt Region nicht und Sprache teilweise
    fest auf Deutsch; weitere Review-/Language-Bridge-Pfade tun dies ebenfalls.
15. ID/Slug sind in Teilen der öffentlichen Dossier- und Participation-Runtime
    identisch dargestellt, obwohl der Zielvertrag sie semantisch trennt.
16. Historische Caller, Queries, Canonicals, QR-/Embed-/Share-Ziele und
    `/swipes/[id]` sind vor einer Migration vollständig zu inventarisieren.

Diese Lücken sind Arbeitsgrenzen für die genannten Folgeslices. Sie sind keine
Freigabe, zusätzliche Architektur, Rollen, Statuswerte oder Persistenz zu
erfinden.

### 14.2 Operative PR- und Kollisionsgrenzen

- PR `#520` verändert `OpenTasks.md` sowie QR-, Studio-, Live- und
  rundennahe Runtime einschließlich
  `apps/web/src/app/runden/RundenShareActions.tsx`. Der spätere
  Participation-Slice muss dessen `/qr/[code]`-Resolver kollisionsfrei mit
  `/beteiligung/[slug]` verbinden: QR darf auf die freigegebene Rundenphase
  auflösen, aber keine zweite Participation-Wahrheit werden. Dieser Contract
  verändert PR `#520` nicht.
- PRs `#527` und `#529` verändern ebenfalls `OpenTasks.md`; `#529` berührt
  zusätzlich die `/create`-Referenzfläche. Dieser Slice übernimmt oder
  überschreibt keine ihrer Task-, Evidence-, UI- oder Runtime-Änderungen.
- PR `#536` verändert `OpenTasks.md` und `/admin/region`. Die Statusänderung
  dieses Slices bleibt auf die Contract-Zeile begrenzt; `/admin/region` bleibt
  vollständig unberührt.
- PR `#521` verändert `AGENTS.md` und Foundation-Dokumente, aber keine der
  beiden Slice-Dateien. Er bleibt unberührt; nach einem späteren Merge wären
  Agentenregeln vor Folgearbeit erneut zu lesen.
- Wegen der zentralen `OpenTasks.md`-Kollisionen muss jeder spätere Rebase oder
  Merge die jeweils aktuellen fremden Zeilen verlustfrei erhalten. Keine
  dieser offenen PRs wird durch diesen Docs-Slice gemergt, retargetet oder
  inhaltlich umgedeutet.
