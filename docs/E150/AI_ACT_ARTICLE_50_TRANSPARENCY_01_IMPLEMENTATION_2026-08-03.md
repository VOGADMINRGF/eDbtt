# AI-ACT-ARTICLE-50-TRANSPARENCY-01 — Implementation Evidence

Datum: 2026-08-03
Task-ID: `AI-ACT-ARTICLE-50-TRANSPARENCY-01`
Issue: `#559`
Branch: `hardening/ai-act-article-50-transparency-01`
Status: `review`
Implementation-Head: `137bcb5e8dca6f268832ad71808d6edd967f2fba`

Diese Evidence dokumentiert den kleinen realen P0-Slice des gemergten
Run-Packs. Sie ist keine Rechtsberatung und erteilt keine Freigabe für Ready,
Merge, Deployment oder Veröffentlichung.

## Reale Ausgangslage und Preflight

- Der vorgegebene Delta-Worktree war vor der Implementierung sauber.
- Der reale Ausgangs-Head war
  `174929af41b4d52a4834ac0322146172eed59e8a`; er entsprach zu diesem
  Zeitpunkt `origin/main`.
- Es wurde kein weiterer Branch und kein weiterer Worktree erstellt.
- Der Task steht im kanonischen operativen Kopf von `OpenTasks.md` als
  `codex_ready`, Priorität `P0`.
- Der Preflight wurde im bereits vorgegebenen Implementierungsbranch als
  erwarteter negativer Branch-Guard ausgeführt. Ergebnis:
  `branch_not_main:hardening/ai-act-article-50-transparency-01`. Das ist gemäß
  Run-Pack kein fachlicher Statusfehler und keine Autorisierung für einen
  zweiten Branch.
- Issue `#559` einschließlich der ergänzten menschlichen Produktentscheidung,
  alle im Run-Pack genannten Canons und die bestehenden Provenienz-, Review-,
  Publication-, Export-, Social- und Voxy-Verträge wurden vor der Änderung
  geprüft.
- Die offenen Pull Requests wurden samt Dateilisten geprüft. Der Slice meidet
  die konkreten offenen Kollisionen unter anderem in Voxy-Video-, Homepage-,
  Studio-, Ballot- und OpenTasks-Dateien. Die geänderten Dateien hatten beim
  Preflight keine direkte offene PR-Dateikollision.
- `docs/E150/OpenTasks.md` wurde absichtlich und entsprechend der
  Nutzeranweisung vollständig unverändert gelassen.

## Zentraler Status- und Labelvertrag

`features/ai/aiTransparencyContract.ts` ist die zentrale technische Wahrheit
für eDebatte sowie darauf aufbauende öffentliche VoiceOpenGov- und
Vote4Gov-Ausgaben. Er unterscheidet:

- `human_only`
- `ai_assisted`
- `ai_generated_unreviewed`
- `ai_generated_reviewed`
- `ai_manipulated_media`
- `deepfake_disclosure_required`

Die zentralen DE-/EN-Labels trennen KI-Unterstützung, redaktionelle Prüfung,
wesentliche KI-Erzeugung, ungeprüfte KI-Arbeitsstände sowie Bild, Audio, Video
und Deepfake-Offenlegung. Für die verbindliche Produktentscheidung gelten
insbesondere sichtbar:

- `Mit KI unterstützt`
- `Mit KI unterstützt · redaktionell geprüft`
- `KI-generiert · redaktionell geprüft`
- `KI-generierter Inhalt · nicht redaktionell geprüft`

`human_only` liefert ausdrücklich kein KI-Label. Menschliche Prüfung stuft
`ai_assisted` oder `ai_generated_reviewed` nicht auf `human_only` zurück.
Vote4Gov darf den strengeren Standard besonders sichtbar erklären; die
zentrale Status-, Label- und Guard-Wahrheit bleibt bei eDebatte.

## Geänderte Oberflächen

- `/create`: Der exakte Voxy-KI-Hinweis erscheint DE/EN zusammen mit dem
  ersten direkten Voxy-Kontakt.
- Gemeinsamer routegebundener Voxy-Companion: Der Hinweis steht vor dem
  Eingabefeld; Antworten tragen sichtbar den Status
  `ai_generated_unreviewed`.
- `/api/chat`: Antworten erhalten einen bestehenden user-safe Agent-Safe-Trace
  sowie eine sanitierte maschinenlesbare Transparenzsicht. Prompts,
  Provider-Rohdaten, Secrets, Token und Chain-of-Thought werden nicht
  ausgegeben.
- `/ki-transparenz`: Öffentliche DE-/EN-Erklärung des zentralen strengeren
  eDebatte-/VoiceOpenGov-/Vote4Gov-Standards, der Text- und Medienlabels, des
  Fail-closed-Gates und der belegten Metadatenfähigkeiten.
- Admin- und Organisations-Content-Release: Reale öffentliche
  `make_visible`- und `prepare_publication`-Übergänge prüfen den zentralen
  Vertrag zusätzlich zu den bestehenden Berechtigungs-, Review-,
  Sichtbarkeits- und Publication-Gates.
- Content-Release-Workbench: Für jedes vorbereitete Ziel kann genau eine der
  freigegebenen Klassifizierungen `human_only`, `ai_assisted` oder
  `ai_generated_reviewed` gewählt werden. Die Oberfläche zeigt das daraus
  folgende Label, den serverseitig belegten menschlichen Review, die
  redaktionelle Freigabe und konkrete Publish-Blocker. `human_only` zeigt
  ausdrücklich kein KI-Label.
- Content-Release-Workbench: Ein validierter Transparenzrecord wird zusammen
  mit dem Release-Ziel persistiert; alte Records bleiben lesbar, erhalten aber
  keinen stillen positiven Default.

Der vorhandene Community-Pfad `/chat` ist keine aktive KI-Runtime. Der Slice
hat ihn nicht reaktiviert und keine zweite Chat-, KI- oder Provider-Runtime
eingeführt.

## Publish-Blocker und bestehende Verträge

Das neue Gate ist additiv und `autoPublish: false`. Öffentliche Sichtbarkeit,
manuelle Publication, Export, Share und Distribution werden fail-closed
blockiert, wenn unter anderem Record, Status, Review, Audit-Referenz,
redaktionelle Freigabe, verantwortliche Rolle, sichtbares und zugängliches
Label, Safe-Trace, Original-/Derivative-Referenz oder erforderliche
Deepfake-Offenlegung fehlen oder widersprüchlich sind.

`ai_generated_unreviewed` bleibt unabhängig vom sichtbaren internen Label
nicht veröffentlichbar. `undefined`, unbekannte oder alte Records werden nicht
positiv migriert. Bestehende Review-, Visibility-, Export-, Share-, Social-,
Scheduling-, Storage- und Distribution-Gates werden nicht ersetzt oder
gelockert. Es gibt kein Auto-Publish, Auto-Approve, externes Posting oder
automatisches `public_official`.

Die Release-Oberfläche sendet ausschließlich Source, Target, Aktion und die
Klassifizierungsentscheidung. Sie darf weder Review-/Approval-Zustände noch
Audit-Referenzen, Rollen, Provenienz oder Artifact-Bindungen einreichen. Die
beiden Routen akzeptieren diese Felder wegen ihrer strikten Request-Schemas
nicht. Manipulierte Vollrecords und unbekannte oder ungeprüfte
Klassifizierungen werden vor der Ausführung abgewiesen.

Der Server bindet öffentliche Aktionen an den tatsächlich vorbereiteten
Content-Release-Record, das kanonische Review-Queue-Item, ein persistiertes
`mark_ready`-Audit, den aktuell authentifizierten Actor samt autorisierter
Rolle und das reale Release-Audit. Der Integritätsvertrag umfasst:

- `sourceKind` und `sourceId`;
- `targetKind` und `targetId`;
- Content-Release-Record und stabile Artifact-ID;
- Actor-ID und serverseitig aufgelöste Rolle;
- Review- und Approval-Audit-Referenzen.

Die Bindung wird vor der Statusänderung geprüft. Nach der Persistierung wird
das Approval-Audit nochmals gegen Record, Source, Target, Artifact, Actor,
Rolle und Klassifizierung verifiziert. `retract_visibility` und
`archive_target` bleiben als konservative Rücknahmewege ohne neue
Klassifizierung nutzbar.

## Provenienz und Metadaten

- Der Adapter verwendet den bestehenden `AgentSafeTraceStep` und übernimmt
  ausschließlich user-safe Trace- und Evidence-Referenzen.
- Im Content-Release-Pfad werden ausschließlich IDs real persistierter
  Prepared-, Review- und Release-Audits als serverseitige Trace-Referenzen
  verwendet. Browserwerte werden nicht zu Provenienz erhoben.
- Der Vertrag führt Capability und Preservation je Standard getrennt.
- `safe_trace` wird nur mit konkreter Verifikationsreferenz als `supported`
  und `preserved` geführt.
- `c2pa`, `iptc` und `xmp` werden im aktuellen Slice ehrlich als
  `unsupported` geführt. Es wird keine Content-Credentials-, Datei-Metadaten-,
  Hash- oder Signaturunterstützung erfunden.
- Vorhandene Provider-Metadaten dürfen nicht als erhalten gelten, wenn eine
  Capability Verlust oder fehlenden Preservation-Beleg meldet; der
  Publish-Guard blockiert dann.
- Der Altcontent-Vertrag erzeugt ausschließlich read-only Findings und
  Empfehlungen. Automatisches Relabeling, Backfill und Sichtbarkeitsänderungen
  sind ausdrücklich `false`.

## DE/EN, Mobile und Accessibility

- Der Voxy-Ersthinweis verwendet exakt den im Run-Pack festgelegten deutschen
  und englischen Wortlaut.
- Hinweise und Labels sind semantischer sichtbarer Text mit verständlichen
  Accessible Names und maschinenlesbaren Status-/Inhaltstyp-Attributen.
- Der Detail-Link ist per Tastatur erreichbar und hat einen sichtbaren
  Fokuszustand.
- Labels und Hinweise verwenden begrenzte Breite und umbrechenden Text; es
  gibt keinen Hover-only-Zugang und keinen Autofokus.
- Der Ersthinweis ist keine Live-Region und wird dadurch nicht bei jedem
  Statuswechsel erneut aggressiv angesagt.
- Die Komponenten nutzen bestehende responsive und Dark-Mode-Tokens; es wurde
  keine neue Animation eingeführt.
- Die Release-Auswahl besitzt ein explizites Label, ausreichende Touch-Höhe,
  sichtbare Fokusdarstellung und semantische Statuslisten. Fehler werden als
  Alert angekündigt; die statische Blockerliste ist keine aggressive
  Live-Region.

Ein realer manueller Screenreader-, RTL-, Zoom- und Geräte-Smoke bleibt Teil
der menschlichen Preview-Abnahme vor Ready/Merge/Deployment. Die automatischen
Render- und Source-Contracts prüfen Semantik, Reihenfolge, Fokusklassen,
Umbruch und das Fehlen von `aria-live`.

## Tests und Smokes

Ausgeführt mit Node `v20.20.2`:

- Gesamter fokussierter AI-Transparenz-, Content-Release-, Review-, Export-,
  Social-, Voxy-, Trace- und Security-Regressionssatz:
  **23 Dateien, 111 Tests grün**.
- Abschlusswiederholung der unmittelbar betroffenen Contract-, Render-,
  Route-, Persistence-, Manipulations- und Workbench-Tests:
  **7 Dateien, 54 Tests grün**.
- Die positiven End-to-End-Contract-Pfade decken `human_only`,
  `ai_assisted` und `ai_generated_reviewed` sowie `make_visible`,
  `prepare_publication`, Rücknahme und Archivierung ab.
- Die negativen Security-Pfade decken fremde Source-/Target-/Artifact-IDs,
  gefälschte Actor-/Rollen-, Review-/Approval-/Audit- und Provenienzwerte,
  fehlenden Review, unbekannte Klassifizierung und
  `ai_generated_unreviewed` ab.
- `pnpm -C apps/web run typecheck`: **grün**.
- `pnpm -C apps/web run lint`: **grün**.
- `git diff --check`: **grün**.
- `git diff --exit-code -- docs/E150/OpenTasks.md`: **grün, kein Diff**.
- `pnpm -C apps/web run build` mit im Prozess geladener, repositoryeigener
  `apps/web/.env.example`: **vollständig grün**. UI- und TRI-Pakete,
  256 Page-Contracts, Next.js-Kompilierung, TypeScript sowie 323 statische
  Seiten liefen erfolgreich. Es wurde keine `.env.local` angelegt und kein
  Deployment ausgelöst.

## Bewusst offene Legal-/Produkt-Gates

Vor Ready, Merge und Deployment bleiben menschlich zu entscheiden und real zu
prüfen:

- Provider-/Deployer-Rolle je konkretem Pfad und rechtliche Einordnung je
  Inhaltsfamilie;
- abschließende Label- und Platzierungsabnahme einschließlich VoiceOpenGov und
  Vote4Gov;
- Abgrenzung normaler von wesentlicher KI-Bearbeitung sowie Deepfake-Kriterien
  und Legal-/Safety-Eskalation;
- revisionssichere Langzeitaufbewahrung und organisationsweite
  Audit-Register-Anforderungen jenseits der im P0 real persistierten Review-
  und Release-Ereignisse;
- weitere Presenter-Adapter für alle öffentlichen Dossier-, Anlassraum-,
  Beteiligungs-, Social- und Medienausgaben;
- tatsächlicher Metadaten-Pass-through jeder Import-, Storage-, Export- und
  Distribution-Pipeline;
- menschliche Browser-, Mobile-, Screenreader-, RTL-, Zoom- und Dark-Mode-
  Preview mit produktionsnaher Env;
- Altcontent-Entscheidungen ausschließlich nach read-only Inventar, ohne
  automatische Massenkennzeichnung.

Der Abschlussstatus dieses technischen Slices bleibt daher maximal `review`.
Der finale Branch-Head nach dem Evidence-Commit wird im Draft-PR und in der
Übergabe als `Exact Head` dokumentiert.
