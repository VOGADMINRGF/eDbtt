# AI-ACT-ARTICLE-50-TRANSPARENCY-01 — Run-Pack

Datum: 2026-08-02
Task-ID: `AI-ACT-ARTICLE-50-TRANSPARENCY-01`
Status: `codex_ready`
Priorität: `P0`
Issue: `#559`
Repository: `VOGADMINRGF/edebatte-org`
Ausgangs-Head: `56aea8e4d336328482ad1ca886f8ed942f18dfe0`
Intake-Branch: `docs/ai-act-article-50-intake-01`
Abschlussstatus nach technischer Umsetzung: maximal `review`

## 1. Zweck und Autorisierung

Dieses Run-Pack nimmt den durch Issue `#559` und die menschlich bestätigte
rechtlich-produktseitige P0-Entscheidung autorisierten Implementierungstask in
den kanonischen operativen Kopf von `docs/E150/OpenTasks.md` auf.

Der vorliegende Slice ist ausschließlich Governance-, OpenTasks- und
Run-Pack-Intake. Er implementiert keine Produktfunktion, ändert keine Runtime
und erteilt keine Freigabe für Merge, Deployment oder Veröffentlichung.

## 2. Rechtlich-technische Prämisse

Die technische Prämisse orientiert sich an Artikel 50 der Verordnung (EU)
2024/1689 und den am 2026-07-20 veröffentlichten Leitlinien der Europäischen
Kommission:

- Bei direkter Interaktion mit einem KI-System muss die betroffene Person
  spätestens bei der ersten Interaktion klar und unterscheidbar informiert
  werden.
- Synthetische oder manipulierte Text-, Bild-, Audio- und Videoausgaben müssen
  im technisch anwendbaren Umfang maschinenlesbar und als künstlich erzeugt
  oder bearbeitet erkennbar sein.
- Deepfake-relevante Bild-, Audio- und Videoinhalte benötigen eine Offenlegung.
- KI-generierte oder -manipulierte Texte zur Information der Öffentlichkeit
  über Angelegenheiten von öffentlichem Interesse benötigen eine Offenlegung,
  soweit keine einschlägige Ausnahme nach menschlicher Prüfung oder
  redaktioneller Kontrolle mit redaktioneller Verantwortung greift.
- Informationen müssen klar, unterscheidbar und zugänglich bereitgestellt
  werden.

Amtliche Referenzen:

- [Verordnung (EU) 2024/1689, Artikel 50](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689)
- [Leitlinien der Europäischen Kommission zu Artikel 50](https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems)

Dieses Run-Pack ist keine Rechtsberatung und entscheidet nicht abschließend,
welche einzelne eDebatte-Ausgabe rechtlich in den Anwendungsbereich fällt. Es
übersetzt die bestätigte Produktentscheidung in einen konservativen
technischen Mindestvertrag. Ein menschliches Legal-/Produkt-Gate bleibt vor
Ready, Merge und Deployment zwingend.

## 3. Ausgangslage, SSOT und Kollisionsprüfung

### Repository-Wahrheit

- `origin/main` wurde vor dem Intake aktualisiert.
- `HEAD`, Merge-Base und `origin/main` lagen zu Beginn identisch auf
  `56aea8e4d336328482ad1ca886f8ed942f18dfe0`.
- Der Charlie-Worktree war sauber.
- Der bestehende Branch hatte vor diesem Intake keinen eigenen Diff und keinen
  bestehenden Pull Request.
- Es wurde kein weiterer Branch und kein weiterer Worktree erstellt.

### Operativer OpenTasks-Schreiber

Für Taskstatus ist ausschließlich der Abschnitt zwischen
`## Kanonischer Operativteil` und `## Historischer Katalog und Evidenz` in
`docs/E150/OpenTasks.md` maßgeblich. Dieser Intake schreibt genau eine neue
Taskzeile in diesen Kopf und ändert keine bestehende Taskzeile oder deren
Status.

Der offene Draft-PR `#555` listet `docs/E150/OpenTasks.md` historisch in seinem
PR-Diff. Sein Head `29a20906bd32fe766f7e21f64809a5aa8be020c7`
enthält gegenüber dem aktuellen `origin/main` jedoch keinen verbleibenden Diff
für diese Datei. Es besteht deshalb keine effektive fremde Zeilenkollision.

### Run-Pack- und Taskformat

- Der Task steht in `Phase 0 — Governance und Production Gates`.
- Status und Priorität verwenden den operativen Wortschatz `codex_ready` und
  `P0`.
- Das Run-Pack ersetzt weder OpenTasks noch die bestehenden Architektur-,
  Provenienz-, Review- oder Publish-Canons.
- Historische OpenTasks-Abschnitte bleiben unverändert.

## 4. Verbindliche Abhängigkeiten

- `V3-FRONTEND-KI-ORCHESTRIERUNGS-TRANSPARENZ-03`
- `V3-CORE-AI-ORCHESTRATION-PROVENANCE-GRAPH-TRACE-01`
- `V3-DOWNSTREAM-KI-TRANSPARENZ-HANDOFF-04`
- menschlich bestätigter rechtlich-produktseitiger P0-Vertrag
- Issue `#559`

Folgende bestehende Wahrheiten sind wiederzuverwenden und nicht zu
duplizieren:

- `frontendAiTransparency.ts` für sichtbare KI-Schrittzustände
- `aiOrchestrationProvenanceTrace.ts` für reale Input-, Lauf-, Quellen-,
  Review- und Publish-Trace-Wahrheit
- `agentRunArtifactSafeTraceContract.ts` für user-safe Trace ohne Prompt-,
  Provider-, Token-, Secret-, Rohlog- oder Chain-of-Thought-Leaks
- `canonicalPreparationStatusContract.ts` für Draft-, Review-, Approval-,
  Publish- und Activation-Semantik
- `roleSpecificReviewContract.ts` und die bestehenden Review-Queues für
  menschliche Prüf- und Freigaberollen
- `publicationRiskLadder.ts` für Sichtbarkeit
- `dossierExportShareTruth.ts` und `contentReleaseWorkbench.ts` für die
  Trennung von Review, Export, Share, Publish-Readiness und Veröffentlichung
- bestehende Voxy-Render-Readiness-, Approval-, Storage-, Scheduling- und
  Distribution-Contracts als blockierende No-op-/Review-Wahrheit

## 5. Ist-Inventar der betroffenen Oberflächen

| Cluster | Bestehende Oberflächen und Pfade | Reale heutige Wahrheit | Integrationsziel |
| --- | --- | --- | --- |
| Create | `/runden/new`, `/create`, Planner-/Analyze-Handoffs | no-AI-Draft, bewusster KI-Start, Planner-/Analyze-Trace, Preview-Kandidaten, kein Auto-Publish | zentralen Transparenzstatus am Input, Ergebnis und Handoff tragen; Voxy-Ersthinweis vor oder mit der ersten direkten Antwort |
| Review | `/admin/review`, `/admin/editorial/queue`, bestehende Review-APIs und Queues | menschliche Review-, Approval-, Audit- und Blockerpfade; kein automatisches `public_official` | KI-Status, Kennzeichnungsbedarf, Provenienzbelastbarkeit und Freigaberolle als gemeinsame Prüfdimensionen zeigen |
| Studio | `/dossier/[id]/studio`, Output Engine, Export-/Share-Panels | `review_ready`, `approved_for_export`, `publish_ready` und `published` sind getrennt | KI-Transparenzvertrag vor Export, Share, Publish-Readiness und Veröffentlichung fail-closed auswerten |
| Dossier | `/dossier/[id]`, Dossier-Runtime und öffentliche Exportpfade | öffentliche Ausgabe nur aus realer veröffentlichter Dossier-Wahrheit; Review-only-Exporte blockiert | sichtbare KI-Kennzeichnung und Herkunftsreferenz an jeder betroffenen öffentlichen Aussage oder Ausgabe erhalten |
| Anlassraum und Runde | `/anlassraum`, `/anlassraum/[id]`, `/runden`, `/runden/[id]`, öffentliche Inputs | Publication Risk Ladder, review-first Handoffs, noch teilweise historische/zu migrierende Surface-Wahrheit | Vertrag additiv an vorhandene Draft-, Review-, Sichtbarkeits- und Public-Handoffs binden; keine neue Raum- oder Rundenruntime |
| Beteiligung | `/beteiligung/[slug]`, `/swipes`, regionale Participation-Signale und Organisationsdashboard, soweit real vorhanden | öffentliche und interne Sichtbarkeit sind getrennt; riskantere Beiträge bleiben reviewpflichtig | KI-unterstützte Beiträge und Medien erfassen, ohne menschliche Beiträge pauschal zu kennzeichnen oder Eligibility/Vote-Semantik zu ändern |
| Feed und Quellen | `/admin/feeds`, Themenradar-, Source-, Material- und Feed-Readmodels | Quellen-/Metadaten- und Review-Hinweise; fehlende Runtime-Wahrheit wird teilweise explizit markiert | Herkunft von Input, Transformation und abgeleitetem Output verbinden; keine Quelle, Extraktion oder KI-Nutzung erfinden |
| Social und Distribution | Output Social Workbench, Dossier Studio, `/admin/review`, `/atlas/social-review`, Social-Distribution-Drafts | kanalweise Drafts, Reviewstatus, manuelles `published_manual`; kein externes Posting, kein automatisches Scheduling | Kennzeichnung und Provenienz bis in Caption, Asset und manuellen Published-Marker erhalten; Upload-/Connector-Gates unverändert |
| Voxy | Homepage/Start, `/create`, `/chat`, Voxy-Docks/-Guides, Account, Admin Review, Dossier Studio, Voxy-Briefing-/Render-Kandidaten | sichtbare Begleitung und teilweise echte Planner-/Chat-Pfade; Voxy-Video-/Renderpfade überwiegend Candidate-, Review- oder No-op-Wahrheit | erster direkter KI-Hinweis DE/EN, konsistente Statusweitergabe und Medienkennzeichnung ohne Render-, Provider- oder Publish-Claim |

Die Umsetzung muss vor Änderung jeder Oberfläche deren reale Route,
Persistenz-, Review- und Veröffentlichungsträger erneut gegen `origin/main`
prüfen. Geplante oder blockierte Pfade dürfen nicht als vorhandene Runtime
behandelt werden.

## 6. Zentraler typed KI-Transparenzvertrag

Die Implementierung führt genau einen zentralen Vertrag oder einen klaren
Adapter über die bestehenden Statusverträge ein. Mindeststatus:

```ts
type AiTransparencyStatus =
  | "human_only"
  | "ai_assisted"
  | "ai_generated_unreviewed"
  | "ai_generated_reviewed"
  | "ai_manipulated_media"
  | "deepfake_disclosure_required";
```

Jeder betroffene Record oder Presenter muss mindestens folgende Wahrheiten
tragen beziehungsweise belastbar ableiten:

- stabile Artifact-/Content-ID und Inhaltstyp
- `createdAt` und, falls bearbeitet, `modifiedAt`
- `aiTransparencyStatus`
- menschliche Prüfung: Status, Zeitpunkt und prüfbare Audit-Referenz
- redaktionelle Freigabe: Status, Zeitpunkt und prüfbare Audit-Referenz
- verantwortliche Freigaberolle; öffentlich nur die notwendige Rollenangabe,
  keine unnötigen Namen oder sonstigen Personendaten
- Publish-Fähigkeit getrennt von Veröffentlichung
- sichtbarer Labelstatus und zentral lokalisierbarer Labelschlüssel
- technisch belegbare Herkunftsmetadaten mit Capability-/Verifikationsstatus
- nachvollziehbare Referenz auf Original und Bearbeitung beziehungsweise
  Parent-/Derivative-Beziehung
- fehlende oder widersprüchliche Wahrheit als expliziter Blocker, niemals als
  stiller positiver Default

Der Vertrag darf bestehende Felder und Status nicht ungeprüft ersetzen. Für
Create, Review Queue, Dossier, Publication Risk Ladder, Output/Social und Voxy
sind deterministische Adapter mit exhaustiven Tests vorzusehen.

## 7. Status- und Kennzeichnungswahrheit

| Status | Mindestwahrheit | Öffentliche Behandlung |
| --- | --- | --- |
| `human_only` | keine belegte inhaltliche KI-Erzeugung oder wesentliche KI-Bearbeitung | keine pauschale KI-Kennzeichnung; Herkunfts- und Reviewdaten bleiben normal erhalten |
| `ai_assisted` | KI hat unterstützt, der maßgebliche Inhalt bleibt menschlich verantwortet und geprüft | KI-Unterstützung nachvollziehbar und nach zentralem DE/EN-Labelvertrag sichtbar machen, soweit für die konkrete Ausgabe vorgesehen oder erforderlich |
| `ai_generated_unreviewed` | Inhalt wesentlich KI-generiert; menschliche Prüfung und/oder redaktionelle Freigabe fehlt | keine öffentliche Informationsveröffentlichung; deutlich als ungeprüfter KI-Arbeitsstand in internen Review-Flächen |
| `ai_generated_reviewed` | wesentliche KI-Erzeugung, dokumentierte menschliche Prüfung und redaktionelle Verantwortung | Veröffentlichung nur bei vollständigen Guardrails; sichtbarer Label- und Provenienzstatus bleibt erhalten |
| `ai_manipulated_media` | bestehendes Medium wurde wesentlich mit KI bearbeitet | Medienart, Bearbeitung und Originalreferenz sichtbar; Publish nur nach Medien-, Review-, Kennzeichnungs- und Provenienzgate |
| `deepfake_disclosure_required` | realistisch wirkender oder anderweitig deepfake-relevanter Bild-, Audio- oder Videoinhalt | klare Offenlegung zwingend; fehlende Offenlegung blockiert fail-closed |

Die exakten allgemeinen DE-/EN-Labeltexte außerhalb des unten festgelegten
Voxy-Hinweises müssen zentral, verständlich und rechtlich-produktseitig
abgenommen werden. Implementierungen dürfen keine flächenweisen Copy-Inseln
oder widersprüchlichen Labelnamen einführen.

## 8. Verbindlicher Voxy-Erstkontakt

Beim ersten direkten Kontakt mit Voxy muss spätestens vor oder zusammen mit
der ersten KI-Antwort klar erkennbar sein:

Deutsch:

> Voxy ist ein KI-System. Antworten und Vorschläge können unvollständig oder fehlerhaft sein. Inhalte werden nicht automatisch veröffentlicht.

Englisch:

> Voxy is an AI system. Responses and suggestions may be incomplete or incorrect. Content is never published automatically.

Verbindliche Grenzen:

- Wortlaut und Bedeutung dürfen pro Surface nicht verändert werden.
- Der Hinweis darf nicht nur in AGB, Tooltip, Hover, Offscreen-Hilfe oder einem
  nachgelagerten Menü stehen.
- Er muss bei der ersten direkten Interaktion klar, unterscheidbar und
  unabhängig von Farbe oder Voxy-Illustration verständlich sein.
- Er darf nicht behaupten, dass Voxy entscheidet, Fakten feststellt, Inhalte
  freigibt oder veröffentlicht.
- Die Implementierung darf keine neue Voxy-, Chat- oder Provider-Runtime
  einführen.

## 9. Accessibility- und Mobile-Vertrag

- Hinweis und Labels sind semantischer Text, nicht ausschließlich Icon, Farbe,
  Animation, Wasserzeichen oder Hintergrundgrafik.
- Tastaturreihenfolge und sichtbarer Fokus bleiben logisch; kein
  Tastatur-Fallen- oder Auto-Fokus-Verhalten.
- Screenreader erhalten Status, Inhaltstyp und erforderliche menschliche
  Aktion in verständlicher Reihenfolge; dekorative Wiederholungen bleiben
  verborgen.
- Live-Regionen dürfen den Hinweis nicht wiederholt oder aggressiv ansagen.
- Kontrast, Zoom, Textvergrößerung, Reflow, Reduced Motion, Dark Mode und RTL
  sind zu testen.
- Auf kleinen Viewports darf kein Label abgeschnitten, überlagert oder nur per
  Hover erreichbar sein; lange DE-/EN-Texte müssen umbrechen.
- Labels bleiben am zugehörigen Inhalt und vor relevanten Publish-/Share-CTAs
  wahrnehmbar.
- Die Accessibility-Anforderungen gelten zusätzlich zu den bereits
  verbindlichen Surface- und Workspace-Verträgen.

## 10. Text-, Medien- und Deepfake-Kennzeichnung

Die Implementierung muss mindestens unterscheiden:

| Inhalt | Mindestanforderung |
| --- | --- |
| KI-generierter Text | Status, Zeitpunkt, Review, redaktionelle Freigabe, verantwortliche Rolle, sichtbares Label, technische Provenienz und Ursprungsreferenz |
| KI-unterstützter und menschlich geprüfter Text | Unterstützung von wesentlicher Erzeugung trennen; menschliche Prüfung und Verantwortung belegen; keine falsche `human_only`-Rückstufung |
| KI-generiertes Bild | Generierungsstatus, Asset-/Output-Referenz, sichtbares Label, technische Herkunft und Mediengate |
| KI-bearbeitetes Bild | Originalreferenz, Bearbeitungsreferenz, wesentliche Bearbeitung, sichtbare Kennzeichnung und Metadaten-Pass-through |
| KI-generiertes oder bearbeitetes Audio | Original-/Output-Referenz, synthetische oder bearbeitete Segmente, sichtbare beziehungsweise im Player wahrnehmbare Kennzeichnung und Mediengate |
| KI-generiertes oder bearbeitetes Video | Script-, Asset-, Render-/Output- und Review-Referenzen trennen; Hinweis im unmittelbaren Ausgabekontext; kein Candidate als Video ausgeben |
| Deepfake-relevanter Inhalt | `deepfake_disclosure_required`, klare Offenlegung, menschliches Legal-/Safety-Review und fail-closed Block bei fehlender Kennzeichnung |

Vorhandene Herkunftsmetadaten dürfen weder beim Import noch bei Bearbeitung,
Export, Download, Share oder Distribution entfernt werden. Wenn eine Pipeline
Metadaten nicht nachweislich erhalten kann, muss sie blockieren oder den
Verlust vor einer menschlichen Entscheidung sichtbar machen.

## 11. Maschinenlesbare Provenienz und Capability-Wahrheit

Der aktuelle Repo-Stand enthält belastbare fachliche Trace-, Source-,
Artifact-, Review- und Audit-Referenzen, aber keinen belegten C2PA-, IPTC- oder
XMP-End-to-End-Pfad. Auch eine repo-weite Suche dieses Intakes fand keine
entsprechende Implementierungs- oder Testwahrheit.

Deshalb gilt:

- C2PA, Content Credentials, IPTC oder XMP dürfen nur dann als unterstützt
  markiert werden, wenn Import, Verarbeitung, Speicherung, Export und
  Verifikation für die konkrete Medienpipeline mit Tests und realen Artefakten
  belegt sind.
- Dateimetadaten und fachliche Provenienz sind getrennte, verknüpfte
  Wahrheiten; eine Datenbankreferenz darf nicht als eingebettete
  Medienkennzeichnung ausgegeben werden.
- Provider-Metadaten allein belegen weder menschliche Prüfung noch
  redaktionelle Freigabe.
- Fehlende Fähigkeit heißt `unsupported`, `unverified` oder
  `missing_runtime_truth`, nicht `supported`.
- Original-/Derivative-Referenzen, Hashes oder Signaturen dürfen nur getragen
  werden, wenn die tatsächliche Pipeline sie erzeugt und verifiziert.
- Der Safe-Trace bleibt frei von Prompts, Secrets, Chain-of-Thought,
  Provider-Rohantworten, Tokens und unnötigen Personendaten.

Fehlende Medienstandards oder Export-Pass-throughs werden nach dem
Implementierungsaudit als getrennte Follow-up-Tasks in OpenTasks aufgenommen;
sie dürfen nicht still in diesen P0-Slice hineingezogen werden.

## 12. Fail-closed Publish-Guardrail

Ungeprüfte, wesentlich KI-generierte öffentliche Informationsinhalte werden
fail-closed blockiert. Das zentrale Gate muss mindestens verhindern, dass ein
betroffener Inhalt öffentlich sichtbar, exportiert, geteilt, als
`published_manual` markiert oder an eine Distribution übergeben wird, wenn:

- menschliche Prüfung fehlt oder nicht belegbar ist,
- redaktionelle Freigabe fehlt oder nicht belegbar ist,
- die erforderliche sichtbare Kennzeichnung fehlt,
- der Provenienzstatus fehlt, widersprüchlich oder nicht belastbar ist,
- bei bearbeiteten Medien die Original-/Bearbeitungsreferenz fehlt,
- eine erforderliche Deepfake-Offenlegung fehlt,
- der bestehende Visibility-, Review-, Approval-, Legal-/Safety-, Source-,
  Accessibility-, Upload-, Scheduling- oder Distribution-Guard blockiert.

Das Gate darf nur explizite positive Wahrheit akzeptieren. `undefined`, alte
Records, unbekannte Enums, Mappingfehler und Adapterdrift werden nicht als
Freigabe behandelt. Blockgründe müssen user-safe für Reviewende und technisch
auditierbar sein.

## 13. No-Auto-Publish bleibt unverändert

Dieser Task lockert keinen bestehenden Guardrail:

- `review_ready` ist nicht `approved`.
- `approved_for_export` ist nicht `publish_ready`.
- `publish_ready` ist nicht `published`.
- `published_manual` bleibt ein bewusster menschlicher Marker und kein
  Provider-Posting-Beleg.
- Preview, Candidate, Handoff, Share-Vorschau, Export und Scheduling-Candidate
  sind keine Veröffentlichung.
- Es gibt kein Auto-Publish, kein automatisches `public_official`, kein
  automatisches Scheduling, kein externes Social Posting, keinen automatischen
  Renderlauf und keine automatische Dossier-/Anlassraum-/Rundenfinalisierung.

Die neue KI-Prüfung ist eine zusätzliche blockierende Voraussetzung. Sie darf
keinen bestehenden Review-, Approval-, Visibility-, Export-, Share-,
Distribution- oder Audit-Pfad ersetzen.

## 14. Altcontent-Audit rund um den 2. August 2026

Es wird ein review-first, zunächst read-only beziehungsweise dry-run-fähiger
Auditpfad für folgende Bestände spezifiziert:

- Voxy-Videos und Voxy-Video-/Renderkandidaten
- Social-Ausgaben und manuelle Published-Marker
- politische und öffentliche Informationstexte
- realistisch wirkende KI-generierte oder KI-bearbeitete Medien
- ungeprüfte wesentlich KI-generierte Texte

Mindestinventar je Fund:

- Inhalt/Asset, Typ, Erstellungs- und Bearbeitungszeit
- heutiger öffentlicher oder interner Sichtbarkeitsstatus
- belegter KI-, Provider-, Run-, Artifact- oder Source-Kontext
- menschliche Prüfung, redaktionelle Verantwortung und Freigaberolle
- sichtbare Kennzeichnung
- maschinenlesbare Provenienzfähigkeit und Erhaltungsstatus
- Original-/Derivative-Referenz
- Risikoklasse und empfohlene menschliche Aktion

Keine automatische Massenkennzeichnung, kein automatischer Backfill, keine
stille Statushoch- oder -rückstufung und keine automatische
Sichtbarkeitsänderung. Der Stichtagsbezug ist eine Auditpriorisierung und keine
eigenständige rechtliche Rückwirkungsbehauptung. Legal/Product entscheidet
nach Inventar und amtlicher Leitlinie über den konkreten Altcontent-Umgang.

## 15. Erwartete Testmatrix

### Zentraler Contract

- exhaustive Tests für alle sechs Mindeststatus
- Schema-/Parsertests für alte, fehlende, unbekannte und widersprüchliche Daten
- deterministische Adaptertests zu bestehenden Create-, Provenienz-, Review-,
  Visibility-, Publish- und Voxy-Statusverträgen
- keine pauschale KI-Kennzeichnung von `human_only`

### Voxy-Erstkontakt

- exakter deutscher und englischer Wortlaut
- Hinweis spätestens vor oder mit der ersten direkten Antwort
- alle realen direkten Voxy-Einstiege inventarisiert
- Tastatur, Screenreader, Fokus, Reflow, Mobile, Dark Mode, RTL und Reduced
  Motion
- kein Provider-/Prompt-/Secret-/Chain-of-Thought-Leak

### Publish-Guard

- vollständige Wahrheitsmatrix für menschliche Prüfung, redaktionelle
  Freigabe, Label, Provenienz, Originalreferenz und Deepfake-Offenlegung
- jede fehlende oder unbekannte Wahrheit blockiert
- bestehende Review-/Visibility-/Export-/Share-/Social-/Voxy-Gates bleiben
  zusätzlich wirksam
- kein automatischer positiver Migrationsdefault für Altcontent

### Text und Medien

- KI-generierter und KI-unterstützter Text bleiben getrennt
- Bild, Audio und Video unterscheiden Generierung und Bearbeitung
- Deepfake-relevante Inhalte verlangen Offenlegung
- vorhandene Metadaten bleiben über belegte Import-/Storage-/Exportpfade
  erhalten; nicht belegte Standards bleiben als fehlend ausgewiesen
- Original-/Derivative-Referenzen bleiben nachvollziehbar

### Surface-Regression

- `/runden/new` und `/create`
- `/admin/review` und relevante Editorial-Queue
- `/dossier/[id]/studio` und öffentliche Dossier-/Exportpfade
- reale Anlassraum-, Runden- und Beteiligungspfade
- Feed-/Source-/Material-Readmodels
- Output Social Workbench, Social Review und Distribution-Drafts
- Homepage/Start, `/chat`, `/create` und weitere reale direkte Voxy-Einstiege

### Abschlusschecks

- fokussierte Contract-, Presenter-, Route- und UI-Tests
- Typecheck
- Lint
- vollständiger Build
- `git diff --check`
- dokumentierter Desktop-/Mobile-/Screenreader-Smoke
- keine Ready-, Merge- oder Deployment-Aktion aus der Testsuite

## 16. Scope und Ausschlüsse

Im späteren Implementierungstask im Scope:

- zentraler typed Vertrag und Adapter auf vorhandene Pfade
- DE-/EN-Voxy-Ersthinweis
- sichtbare Text-/Medien-/Deepfake-Kennzeichnung
- technisch belegbare Provenienz und Capability-Anzeige
- fail-closed Publish-Guard
- read-only/review-first Altcontent-Audit
- erforderliche Tests und Evidence

Ausgeschlossen:

- neue KI-, Agenten-, Render-, Provider-, Upload-, Scheduling- oder
  Social-Posting-Runtime
- Providerwechsel oder neue Provider-Credentials
- neue parallele Persistenzwelt oder automatische Datenmigration
- Auto-Publish, Auto-Approve, Auto-Review oder Auto-`public_official`
- automatische Massenkennzeichnung oder Statusbackfills
- erfundene C2PA-, IPTC-, XMP-, Hash-, Signatur- oder
  Content-Credentials-Unterstützung
- neue Rollen-, Routing-, Dossier-, Anlassraum-, Runden-, Participation-,
  Pricing-, Entitlement- oder Packaging-Semantik
- Offenlegung von Prompts, Secrets, Chain-of-Thought, Rohlogs oder unnötigen
  personenbezogenen Daten
- Deployment oder Merge durch den technischen Task

Für diesen Intake-PR sind zusätzlich ausschließlich diese zwei Dateien
zulässig:

- `docs/E150/OpenTasks.md`
- `docs/E150/AI_ACT_ARTICLE_50_TRANSPARENCY_01_2026-08-02.md`

## 17. Offene rechtliche und technische Punkte

Vor beziehungsweise während der technischen Umsetzung zu inventarisieren und
vor Ready menschlich zu entscheiden:

- eDebattes konkrete Rollen als Provider, Deployer oder beides je Pfad
- genaue Anwendung der Kennzeichnungs- und Ausnahmeregeln je Text- und
  Medienfamilie
- verbindliche allgemeine DE-/EN-Labeltexte und Platzierung außerhalb des
  bereits festgelegten Voxy-Hinweises
- Abgrenzung von Standardbearbeitung zu wesentlicher KI-Bearbeitung
- Deepfake-Kriterien und Eskalationsweg für Grenzfälle
- öffentliche Sichtbarkeit der verantwortlichen Rolle bei minimaler
  Datenpreisgabe
- Aufbewahrung, Löschung, Korrektur und Widerruf von Provenienz-/Reviewdaten
- tatsächlicher Metadaten-Pass-through jeder Import-, Storage-, Export- und
  Distribution-Pipeline
- mögliche Unterstützung technischer Standards erst nach Capability-Beleg
- Behandlung von Altcontent nach tatsächlichem Erstellungs-, Bearbeitungs- und
  Veröffentlichungszeitpunkt
- Verhältnis zu Datenschutz-, Urheber-, Persönlichkeits-, Plattform- und
  sektorspezifischen Pflichten

Diese Punkte verhindern nicht den `codex_ready`-Status des technisch
begrenzten Tasks. Sie verhindern jedoch Ready, Merge und Deployment, soweit
die konkrete Umsetzung oder Abnahme davon abhängt.

## 18. Task-Lifecycle und menschliche Gates

1. Implementierung startet nur aus dem auf `main` gemergten operativen
   `codex_ready`-Eintrag und nach erfolgreichem Preflight auf sauberem `main`.
2. Der Implementierungs-PR bleibt klein, review-first und frei von
   Auto-Publish-/Runtime-Ausweitung.
3. Nach technischer Umsetzung darf der OpenTasks-Status höchstens auf
   `review` wechseln.
4. Vor Ready-for-Review im produktseitigen Sinn sind menschliche Legal- und
   Produktprüfung, Label-/Medienvertrag und Scope-Abnahme erforderlich.
5. Vor Merge sind Code Review, Legal-/Produktfreigabe, Testevidence und
   Kollisionsprüfung gegen aktuelles `origin/main` erforderlich.
6. Vor Deployment sind ein getrenntes menschliches Release-Gate, reale
   Preview-Abnahme und ein dokumentierter Rollback erforderlich.
7. Kein Codex-Run mergt oder deployt diesen Task automatisch.

## 19. Preflight-Vertrag für den späteren Implementierungsbranch

Nach Merge dieses Intake-PRs auf `main` muss auf einem sauberen `main`
ausgeführt werden:

```text
node scripts/codex-task-preflight.mjs AI-ACT-ARTICLE-50-TRANSPARENCY-01
```

Erwartete Ausgabe:

```json
{
  "taskId": "AI-ACT-ARTICLE-50-TRANSPARENCY-01",
  "status": "codex_ready",
  "executable": true,
  "branchCreationAllowed": true
}
```

Der Preflight-Vertrag selbst verlangt einen sauberen Branch `main`. Ein Lauf
im bereits vorgegebenen Intake-Branch ist daher nur als negativer
Branch-Guard-Beleg zulässig und darf nicht als fachlicher Statusfehler oder als
Freigabe für einen zweiten Branch missverstanden werden.

## 20. Intake-Abschlussgrenze

Dieser Intake ist abgeschlossen, wenn:

- die Task-ID genau einmal im kanonischen operativen Kopf steht,
- Status `codex_ready` und Priorität `P0` maschinell lesbar sind,
- dieses Run-Pack vollständig vorliegt,
- ausschließlich die zwei erlaubten Dokumentdateien geändert sind,
- `git diff --check` grün ist,
- der finale Diff gegen aktuelles `origin/main` geprüft ist,
- ein gezielter Commit und genau ein kleiner Draft-PR gegen `main` vorliegen.

Er beginnt keine Produktimplementierung, mergt nicht und deployt nicht.
