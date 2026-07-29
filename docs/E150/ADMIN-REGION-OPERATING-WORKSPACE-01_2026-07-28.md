# ADMIN-REGION-OPERATING-WORKSPACE-01

Stand: 2026-07-29
Issue: #495
Status: `review`

## Produktkorrektur in Draft-PR #513

Die erste Fassung begann zu stark als allgemeiner Workflow- und Navigationsraum. Die
Produktkorrektur richtet `/admin/region` jetzt am eigentlichen Operatorauftrag aus:

`Region auswählen → Regionsprofil und Erfahrungsstand → Fähigkeiten und Evidenzen → Lücken → genau eine nächste Aktion → nachgeordnete Arbeitsbereiche`

Der Einstieg zeigt keine fest verdrahtete Pilotregion mehr. Ohne `regionId` bleibt die Seite
auf `/admin/region` und bietet eine suchbare Auswahl aus `listOperationalRegions()`. Die
Auswahl enthält die vorhandenen Regionstypen und Regionseinträge; ihr Slug bleibt in allen
nachgeordneten Workspace-Links im URL-Kontext erhalten. Eine ungültige Eingabe erzeugt
keinen vermeintlichen Arbeitsraum, sondern einen erklärten Leerzustand.

Nach Auswahl zeigt das Regionsprofil ausschließlich repo-backed Angaben:

- Regionstyp, Bundesland, Land, zuständige Stelle und vorhandener amtlicher
  Verzeichniseintrag,
- Quellenverbindungen und kontrollierte Quellenprüfungen,
- Feed-Signale, Pilot-/Fixture-Herkunft und Themencluster,
- Claim-Kandidaten, Dossier-Vorschläge, aktive Dossier-Referenzen und Anlassräume,
- Beteiligungssignale, Community-Hinweise und Akteurszahlen,
- ehrliche Nicht-Anbindungen für Kampagnen, Initiativen-Aufschlüsselung und regionale
  Sprachkontexte.

## Status- und Evidenzmodell

Jeder Fähigkeitsbereich trägt genau einen verständlichen Erfahrungsstatus:

- `bereits erprobt`
- `teilweise vorbereitet`
- `noch ohne Erfahrung`
- `manuelle Freigabe erforderlich`

Jede Statusaussage nennt direkt:

1. die Grundlage aus dem vorhandenen Regionsreadmodel oder einen ehrlichen Leerstand,
2. die konkrete verbleibende Lücke.

Kontrollierte Dry Runs, kuratierte Pilot-/Fixture-Daten und produktive Live-Anbindungen werden
nicht gleichgesetzt. Insbesondere werden aus einem Prüfergebnis weder Live-Ingestion noch
Veröffentlichung abgeleitet.

## Eine priorisierte Hauptaktion

Der regionale Stand leitet deterministisch genau eine Hauptaktion ab:

1. fehlende Quellenverbindung → erste regionale Quelle vorbereiten,
2. vorhandene, noch ungeprüfte Verbindung → Quelle kontrolliert prüfen,
3. vorhandene Prüfergebnisse und offene Hinweise → Hinweise lokal im Lagebild prüfen,
4. Claim-Kandidaten ohne aktive Dossier-Referenz → Claims für ein Dossier prüfen,
5. sonst → regionalen internen Beitrag bewusst vorbereiten.

Die Hauptaktion bleibt im ausgewählten Regionskontext. Rohsignale werden nicht mehr in eine
globale Review-Queue geschickt, die sie nicht als Queue-Einträge führt.

## Nachgeordnete Arbeitsbereiche

Die vorhandenen Bereiche bleiben vollständig erreichbar:

- Lagebild
- Quellen & Feeds
- bewusste Recherche
- Claims & Dossiers
- Beiträge & Veröffentlichung
- regionale Kampagnen
- Einstellungen & Zugriff

Die Recherche-Aufgabenliste wird ohne erfundene Region-, Themen- oder Quellenparameter
geöffnet, weil ihr bestehender Consumer nur `taskId` verarbeitet. Die Marketing-Control-Plane
erhält nur ihre unterstützten Filter `lang`, `segment` und `reach`; die Oberfläche erklärt
ausdrücklich, dass die ausgewählte Region dort noch nicht automatisch angebunden ist. Der
bestehende Create-Flow behält seinen bereits unterstützten regionalen Draft-Kontext.

Die horizontale Workspace-Navigation bleibt auf kleinen Viewports scrollbar. Profil-, Status-
und Lückentexte verwenden mobile-sichere Mindestbreiten und Umbruchregeln.

## Neue Abnahmekriterien der Produktkorrektur

- die suchbare Regionsauswahl ist der dominante Seiteneinstieg,
- Wechsel zwischen mindestens zwei vorhandenen Regionen verändert das Regionsprofil,
- vorhandene Erfahrung und ehrliche Leerstände sind getrennt,
- jede Statusaussage hat Grundlage und Lücke,
- genau eine aus dem regionalen Stand abgeleitete Hauptaktion ist priorisiert,
- alle bestehenden Arbeitsbereiche bleiben ohne tote Links erreichbar,
- Regionskontext bleibt in der Workspace-URL erhalten,
- mobile Navigation und lange Texte brechen kontrolliert um,
- keine erfundenen Live-Daten, Providerverbindungen oder Kampagnen-/Sprachwerte,
- keine neue Persistenz, zweite Runtime, automatische Recherche oder Veröffentlichung.

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
  - 2 Testdateien, 5 Tests, grün
  - deckt suchbaren Einstieg, ungültigen Leerzustand, Wechsel Reinickendorf/Magdeburg,
    belegte Erfahrung versus fehlende Anbindung, genau eine Hauptaktion, Workspace-Links,
    mobile Navigation und Textumbruch ab
- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web run build`
  - Page-Contract, Paket-Builds, Next-Kompilierung, TypeScript, 322 statische Seiten und finale Build-Ausgabe grün
- `git diff --check`
  - grün

Die lokale Toolchain meldete Node `v25.9.0`, während das Repository Node `20.x` erwartet. Die Pflichtchecks liefen dennoch terminal grün; CI bleibt die maßgebliche Node-20-Bestätigung.

## Verbleibend

- manuelle Produktabnahme auf Desktop und Mobile,
- visuelle Prüfung der dominanten Regionsauswahl, Profilhierarchie, horizontalen mobilen
  Navigation und langen Evidenz-/Lückentexte,
- fachliche Prüfung, ob die gewählte dominante Aktion je realer Region die gewünschte Operatorpriorität trifft,
- Merge erst nach Review und Produktabnahme.

Der Task steht deshalb auf `review`, nicht auf `done`.
