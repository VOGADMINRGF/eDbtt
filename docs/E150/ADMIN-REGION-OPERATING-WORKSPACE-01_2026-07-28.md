# ADMIN-REGION-OPERATING-WORKSPACE-01

Stand: 2026-07-28
Issue: #495
Status: `review`

## Ziel und Rollen

`/admin/region` ist als zusammenhängender Operator-Arbeitsraum umgesetzt:

`Region → Lagebild → Quellen & Feeds → bewusste Recherche → Claims/Dossiers → interne und externe Beiträge → regionale Kampagne → Wirkung`

Der Lauf folgt dem Single-Runner-Modell aus dem Issue-Run-Pack.

- Primary: `research_source`
- Supporting: `claims_factcheck`, `dossier_briefing`, `governance_compliance`

Die Rollen begrenzen Produktverhalten und Review. Es wurden keine parallelen Agentenprozesse, Stores, Review Queues oder Publishing-Pfade angelegt.

## Umgesetzter Arbeitsraum

Der erste sichtbare Bereich zeigt:

- die gewählte Region ohne technische ID- oder Routenerklärung,
- das aktuell priorisierte Signal aus dem bestehenden Region-Readmodel,
- aktive Quellen, vorhandene Prüfergebnisse, Signale, Cluster und offene Review-Hinweise,
- Pilot-/Fixture-Herkunft, sofern sie im Readmodel belegt ist,
- genau eine dominante nächste Aktion.

Die serverseitige Arbeitsnavigation nutzt den bestehenden Regionspfad mit `view=lagebild|quellen|recherche|claims|beitraege|kampagnen|einstellungen`. Jeder Eintrag zeigt einen echten Arbeitsbereich; Einstellungen, Zugriff, Limits und Diagnose bleiben vollständig erreichbar, stehen aber nicht mehr vor der eigentlichen Arbeit.

### Lagebild

Feed-Signale, Herkunft, Prüfstatus, Themencluster, offene Fragen und Quellenlage werden aus dem bestehenden Readmodel abgeleitet. Fixture- und Pilotdaten bleiben sichtbar gekennzeichnet.

### Quellen & Feeds

`RegionSourceConnectionsPanel` verwendet unverändert die vorhandenen Source-Connection- und Test-APIs. Die Oberfläche priorisiert Quelle, Herkunft, Relevanz, Test und Prüfergebnis. Snapshot- und Guardrail-Details sind progressiv nachgeordnet.

### Recherche

Die Übergabe führt bewusst zu `/admin/research/tasks` und trägt Region, Thema, Quelle und Herkunftskontext als Query-Kontext. Sie startet keinen Task, Provider, Deep Search, Crawler oder Scraper automatisch.

### Claims & Dossiers

Claim-Kandidaten, Belege, offene Fragen sowie Dossier- und Anlassraum-Vorschläge werden nur aus vorhandenen Quellenprüfungen und dem Region-Readmodel gezeigt. Review und der bestehende Create-Kontext sind die einzigen Übergaben; es gibt keine automatische Erstellung.

### Beiträge & Veröffentlichung

Interne eDebatte-Beiträge gehen mit Region-, Signal- und Themenkontext in den bestehenden Create-Flow. Externe Social-/Web-Inhalte gehen getrennt in bestehende Marketing-Review- und Freigabeflächen. Nicht belegte Draft-, Planungs-, Veröffentlichungs- oder Archivstatus werden nicht behauptet.

### Regionale Kampagnen

Region, Thema, B2G-Zielgruppe und regionaler Reichweitenraum werden an `/admin/marketing` übergeben. Performance verweist auf die bestehenden Insights. Das Region-Readmodel erfindet keine Kampagne, Marketing-Registry, Analytics-Runtime oder Kennzahl.

## Guardrails

- review-first für Claims, Dossiers, Beiträge, externe Sichtbarkeit und Kampagnen,
- kein Auto-Research oder automatischer Deep-Search-Start,
- kein Auto-Publish, Auto-Dossier, Auto-Anlassraum oder Auto-Kampagnenstart,
- keine neue externe API oder Providerintegration,
- keine neue Region-, Dossier-, Beitrags-, Review- oder Marketing-Persistenz,
- keine Rollen-, Entitlement- oder Governanceänderung,
- Übersetzung ist keine Evidenz,
- keine behaupteten Live-Daten oder Performancewerte.

## Geänderte Dateien

1. `apps/web/src/app/admin/region/page.tsx`
2. `apps/web/src/app/admin/region/RegionSourceConnectionsPanel.tsx`
3. `apps/web/tests/admin-region-page.render.test.tsx`
4. `apps/web/tests/admin-region-entitlement-ui.test.tsx`
5. `docs/E150/ADMIN-REGION-OPERATING-WORKSPACE-01_2026-07-28.md`
6. `docs/E150/OpenTasks.md`

Der Run-Pack-Scope von maximal sechs Dateien ist eingehalten.

## Automatische Evidenz

- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx tests/admin-region-entitlement-ui.test.tsx`
  - 2 Testdateien, 4 Tests, grün
- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `cp apps/web/.env.example apps/web/.env.local && pnpm -C apps/web run build`
  - Page-Contract, Paket-Builds, Next-Kompilierung, TypeScript, 321 statische Seiten und finale Build-Ausgabe grün
  - der erste Build ohne die im Repo-CI vorgeschriebene lokale Beispielumgebung scheiterte ausschließlich an fehlenden Runtime-Variablen; der CI-konforme Wiederholungslauf war grün
- `git diff --check`
  - grün

Die lokale Toolchain meldete Node `v25.9.0`, während das Repository Node `20.x` erwartet. Die Pflichtchecks liefen dennoch terminal grün; CI bleibt die maßgebliche Node-20-Bestätigung.

## Verbleibend

- manuelle Produktabnahme auf Desktop und Mobile,
- visuelle Prüfung der Sticky-Navigation, horizontalen mobilen Navigation und progressiven Details,
- fachliche Prüfung, ob die gewählte dominante Aktion je realer Region die gewünschte Operatorpriorität trifft,
- Merge erst nach Review und Produktabnahme.

Der Task steht deshalb auf `review`, nicht auf `done`.
