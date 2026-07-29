# ADMIN-REGION-PRODUCT-ACCEPTANCE-02

Stand: 2026-07-29
Issue: #528
Branch: `fix/admin-region-product-acceptance-02`
Status: `review`

## Ausgangspunkt

PR #513 ist gemergt und bleibt die technische Basis. Dieser Slice korrigiert ausschließlich
die bei der Produktabnahme festgestellte Handlungshierarchie und die regionalen Handoffs.
Es gibt keinen Revert, keine neue Runtime, keine neue Persistenz und keine Änderung an Rollen,
Entitlements oder Governance.

Der Branch wurde vor der Umsetzung per Fast-forward mit `origin/main@a4723fb7` abgeglichen.
Der Worktree war sauber und befand sich am verlangten Pfad und Branch. Der Kollisionsscan
der offenen Pull Requests zeigte keine Berührung von
`apps/web/src/app/admin/region/page.tsx` oder
`apps/web/tests/admin-region-page.render.test.tsx`. Die Draft-PRs #527, #529 und #535
berühren ebenfalls `docs/E150/OpenTasks.md`; deshalb bleibt der Kopf-Sync dieses Slices auf
eine neue operative Zeile begrenzt.

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
- keine Auto-Research- oder Auto-Publish-Behauptung.

## Automatische Checks

- `git diff --check`
  - grün
- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx tests/admin-region-entitlement-ui.test.tsx`
  - 2 Testdateien, 5 Tests, grün
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
