# ADMIN-REGION-PRODUCT-ACCEPTANCE-02

Stand: 2026-07-29
Issue: #528
Branch: `fix/admin-region-product-acceptance-02`
Kanonischer Taskstatus: `codex_ready`
Empfohlener technischer Endstatus: `review`

## Ausgangspunkt

PR #513 ist gemergt und bleibt die technische Basis. Dieser Slice korrigiert ausschließlich
die bei der Produktabnahme festgestellte Directory-Integration, Regionsauflösung,
Directory-Diagnose, Theme-Darstellung und die regionalen Handoffs. Es gibt keinen Revert,
keine neue Runtime, keine neue Persistenz und keine Änderung an Rollen, Entitlements oder
Governance.

Der korrektive Lauf integrierte `origin/main@d615149a25178ae1def02b7b20418cacaee75aec`
genau einmal per Merge in den bestehenden Branch. Beim erwarteten Konflikt wurde
`docs/E150/OpenTasks.md` vollständig aus `origin/main` übernommen. Die beiden neuen
`codex_ready`-Zeilen aus PR #542 blieben erhalten; danach wurde die Datei nicht weiter
verändert. Alpha bleibt alleiniger SSOT-Schreiber und setzt den Task nach Abschluss
gesammelt auf `review`.

## Korrektives Follow-up

### Amtliches Verwaltungsdirectory

`buildOfficialRegionsFromDirectory()` ist jetzt Bestandteil des operativen
Regionskatalogs. Die Quellenreihenfolge lautet:

1. Registry
2. amtliches Directory
3. Fixtures

Nur identische stabile IDs, AGS oder ARS führen zur Deduplizierung. Gleiche Namen allein
werden nicht zusammengeführt. Der kontrollierte Stand:

- 13.339 gelesene XLSX-Zeilen,
- 12.401 amtlich abgeleitete Regionen,
- 7 weiterhin technisch verfügbare Fixtures,
- 0 Registry-Einträge, weil `RegionRegistry.snapshot.json` nicht verbunden ist,
- 12.408 operative Regionen,
- 384 Gruppen beziehungsweise 481 überzählige Slug-Kollisionen vor der Korrektur,
- 0 doppelte Slugs nach deterministischer Ergänzung von AGS beziehungsweise ARS.

Die XLSX-Quelle wird weiterhin serverseitig gelesen und im Prozess gecacht. Ein
`missing`- oder `error`-Ergebnis bleibt mit Status, Nachricht und Fehlercode im Cache
nachvollziehbar. Registry und Fixtures bleiben in diesem Zustand technisch verfügbar;
die Oberfläche zeigt jedoch ausdrücklich, dass kein vollständiges amtliches Verzeichnis
geladen ist.

### Regionsauflösung

Die operative Auflösung akzeptiert ausschließlich eindeutige Treffer über ID, Slug, AGS,
ARS, Namen oder Verwaltungsbezeichnung. Mehrdeutige Namen liefern keinen heuristischen
Treffer. Hamburg ist belegt über:

- `Hamburg` → `region-land-02`,
- AGS `02000000` → `region-official-02000000`,
- ARS `020000000000` → `region-official-02000000`,
- ID `region-official-02000000`,
- Slug `hamburg-freie-und-hansestadt-02000000`,
- Verwaltungsbezeichnung `Senat der Freien und Hansestadt Hamburg`.

Die gleichnamigen amtlichen Einträge `Hamburg, Freie und Hansestadt` bleiben getrennt.
Die Verwaltungsbezeichnung bevorzugt nur dann den kanonischen kommunalen Eintrag, wenn
unter den sonst gleichlautenden amtlichen Treffern genau ein AGS-geführter Eintrag
existiert.

### Light/Dark und Diagnose

Selektor, operative Zusammenfassung, Eingabe, Placeholder, Fehlerzustand, Typ- und
Status-Badges sowie Fokuszustände verwenden lokale Theme-Tokens und explizite
Dark-Mode-Verträge. Der Selektor nutzt keine weißen Karten oder hellen
`from-cyan-50`-Verläufe mehr. Seine H1 trägt `no-grad`, sodass die globale H1-Regel
den lokalen Textkontrast nicht überschreibt. Es wurde keine globale CSS-Datei verändert
und keine zweite Designwelt eingeführt.

Der bestehende Beteiligungssignal-Regressionstest ist wieder geschlossen: Das Lagebild
zeigt die vorhandenen anonymisierten beziehungsweise aggregierten Readmodel-Werte kompakt,
ohne Personenprofile, Repräsentativitätsbehauptung oder automatische amtliche Übernahme.

## Operative Zusammenfassung

Nach einer Regionsauswahl ist der Auswahlkopf kompakt. Direkt danach zeigt eine
zusammenhängende operative Zusammenfassung:

- die ausgewählte Region und ihren Typ,
- das erste belegte Nicht-Fixture-Signal oder einen ehrlichen Signal-Leerstand,
- nachvollziehbare Herkunft und Reviewstatus des Signals,
- aktive und kontrolliert geprüfte Quellen,
- den letzten im Readmodel hinterlegten Quellen-/Prüfstand,
- eine qualitative Belastbarkeitsaussage ohne erfundene Coverage-Quote,
- offene Reviewhinweise und deduplizierte offene Fragen,
- die aus dem vorhandenen Stand abgeleitete Arbeitspriorität,
- genau eine dominante nächste Aktion.

Nicht-Fixture-Signale werden vor klar gekennzeichneten Pilot-/Fixture-Signalen gezeigt.
Fehlen Signale, Quellen, Prüfergebnisse, Aktualitätsangaben oder offene Fragen, erscheint
jeweils ein expliziter Leerzustand. Aus kontrollierten Dry Runs wird weder Live-Abdeckung
noch Veröffentlichung abgeleitet.

Die Profilkarten folgen erst nach der operativen Zusammenfassung und der horizontal
scrollbaren Workspace-Navigation. Ausführliche Fähigkeiten-, Evidenz-, Erfahrungs- und
Lückenkarten liegen in einem standardmäßig geschlossenen Diagnosebereich.

## Schnellaktionen und Handoffs

Fünf sichtbare sekundäre Schnellaktionen verwenden ausschließlich vorhandene Routen:

1. `Quellen sammeln` → regionaler Bereich `Quellen & Feeds`
2. `Recherche vertiefen` → `/admin/research/tasks`
3. `Beitrag erstellen` → `/create`
4. `Dossier vorbereiten` → `/create`
5. `Kampagne planen` → `/admin/marketing`

Es gibt keine `href="#"`, keine Dead Clicks und keinen automatischen Folgeschritt.

Der Research-Handoff trägt gefahrlos ignorierbar:

- `regionId=<regionaler Slug>`
- `topic=<vorhandenes Thema>`, soweit vorhanden
- `source=<vorhandene Quellenbezeichnung>`, soweit vorhanden
- `origin=admin-region`

`/admin/research/tasks` wertet weiterhin nur den bestehenden `taskId`-Pfad aktiv aus.
Die zusätzlichen Parameter starten keinen Provideraufruf, kein Crawling, Scraping oder
Deep Search.

Der Marketing-Handoff trägt:

- `lang=de`
- `segment=b2g`
- `reach=regional`
- `region=<regionaler Slug>`
- `topic=<vorhandenes Thema>`, soweit vorhanden
- `content=<vorhandener Signaltitel>`, soweit vorhanden
- `origin=admin-region`

Die Parameter sind Filter-/Handoff-Kontext. Sie erzeugen keine Kampagne, keine Registry,
keinen Publish-Vorgang und keine Persistenz.

Create- und Dossier-Handoffs behalten `source=admin_region`, den regionalen Slug,
`scope=regional`, vorhandenen Signal-/Themenkontext und `reviewState=needs_review`.

## Testabdeckung

`apps/web/tests/admin-region-page.render.test.tsx` prüft:

- operative Zusammenfassung vor Profil-, Erfahrungs-, Evidenz- und Diagnosebereichen,
- genau eine dominante Hauptaktion,
- genau fünf sichtbare Schnellaktionen,
- Research-Handoff mit Region, Thema, Quelle und `origin`,
- Marketing-Handoff mit Sprache, Segment, Reichweite, Region, Inhalt und `origin`,
- regionalen Create- und Dossier-Kontext,
- Erreichbarkeit aller sieben Workspace-Bereiche,
- horizontal nutzbare mobile Navigation,
- kontrollierten Umbruch langer Texte,
- keine Dead Clicks,
- keine Auto-Research-, Auto-Publish-, Draft-, Dossier- oder Provideraktivierung,
- sichtbare `missing`- und `error`-Diagnosezustände,
- lokale Light-/Dark-Verträge für Selektor, Eingabe, Placeholder, Fehler, Badges und Fokus,
- die Abgrenzung des Selektor-H1 von der globalen H1-Verlaufsregel.

`apps/web/tests/regional-official-directory.contract.test.ts` prüft:

- Hamburg per Name, ID, Slug, AGS, ARS und Verwaltungsbezeichnung,
- 13.339 gelesene Directory-Einträge und 12.401 amtlich abgeleitete Regionen,
- 12.408 operative Regionen statt einer stillen Reduktion auf sieben Fixtures,
- eindeutige Slugs nach der deterministischen AGS-/ARS-Ergänzung,
- Registry-/Directory-/Fixture-Priorität bei stabiler Identität,
- getrennte gleichnamige Orte und `null` bei mehrdeutiger Namensauflösung,
- weiterhin verfügbare Registry-/Fixture-Einträge bei fehlender oder fehlerhafter Quelle,
- nachvollziehbare `missing`- und `error`-Statusdaten.

## Automatische Checks

- `git diff --check`
  - grün
- fokussierte Directory-/Render-Verträge
  - 2 Testdateien, 12 Tests, grün
- bestehende Region-/Entitlement-/Navigation-Regression
  - 15 Testdateien, 57 Tests, grün
- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `set -a; source apps/web/.env.example; set +a; pnpm -C apps/web run build`
  - Page-Contract, Paket-Builds, Next-Kompilierung, TypeScript, 322 statische Seiten und
    finale Build-Ausgabe grün

Ein erster Build ohne Env-Bootstrap kompilierte erfolgreich, stoppte aber erwartbar beim
globalen Page-Data-Collect an fehlenden Pflichtvariablen. Der abschließende Build verwendete
wie die bestehende Web-CI ausschließlich die eingecheckte `apps/web/.env.example`; es wurde
keine lokale Env-Datei angelegt, gelesen oder verändert. Lokal lief Node `v25.9.0`, während
das Repository Node `20.x` erwartet. CI bleibt die maßgebliche Node-20-Bestätigung.

## Verbleibend

- Desktop-Produktabnahme der kompakten Above-the-fold-Hierarchie,
- Mobile-Produktabnahme von Dichte, horizontaler Navigation und Textumbrüchen,
- fachliche Sichtprüfung der aus realen Readmodels abgeleiteten Signal- und
  Arbeitspriorisierung,
- Merge erst nach Review und Produktabnahme.

Der Task steht deshalb maximal auf `review`, nicht auf `done`.
