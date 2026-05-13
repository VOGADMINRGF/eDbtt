# PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01

Stand: 2026-05-11
Status: in_progress

## Ziel

Das Admin-Dashboard einmal als zusammenhaengenden Betriebsstrang pruefen statt als Folge kleiner Einzel-Fixes:

- `/admin`
- `/admin/users`
- `/admin/feeds`
- `/admin/feeds/anlassraum`
- `/admin/themenradar`
- Admin-Suche / Navigation

## Hauptursachen

1. Nutzeranlage war im UI falsch an `accessTier.startsWith("institution")` gebunden, obwohl die eigentliche Admin-Create-API bereits vorhanden war.
2. Admin-Suche und Themenradar hatten keinen gemeinsamen Themen-Finder; Themen waren dadurch im Betrieb schwer auffindbar.
3. Feed-/Anlassraum-Count-Drift war im Live-Lauf nicht sauber beobachtbar, weil die aktuelle Datenbasis keine Anlassraum-Items lieferte. Der Risiko-Punkt bleibt aber relevant und wurde deshalb kontraktisch auf Count-vs-Detail gehaertet.
4. Ein sichtbarer Admin-Button (`Import`) war nur Platzhalter-UX statt erklaertem Disabled-Zustand.

## Umgesetzte Reparaturen

### Nutzerverwaltung

- `apps/web/src/app/admin/users/page.tsx`
  - `+ Nutzer anlegen` ist jetzt fuer echte Admins/Superadmins verfuegbar statt institution-only.
  - `Import` ist nicht mehr scheinbar aktiv, sondern explizit deaktiviert und erklaert.
  - Erfolg-/Fehlerfeedback fuer Create/Save ist deutsch und sichtbar.
  - Leerer Zustand fuer die Tabelle ist explizit.
- `apps/web/src/app/api/admin/dashboard/users/route.ts`
  - Rollen werden serverseitig normalisiert und validiert.
  - Das Entfernen des letzten Admin-Zugangs wird blockiert (`last_admin_required`).
  - `role` und `roles` bleiben bei Updates synchron.

### Themen / Admin-Suche

- `features/themenradar/server/repo.ts`
  - Themenradar unterstuetzt jetzt ein echtes Such-Query `q`.
- `apps/web/src/app/api/admin/themenradar/route.ts`
  - `q` wird bis in den Themenradar-Store durchgereicht.
- `apps/web/src/app/admin/themenradar/page.tsx`
  - neuer Suchfilter fuer Titel, ID, Status, Quelle und Verknuepfungen.
- `apps/web/src/app/api/admin/search/route.ts`
  - Themenradar-Treffer erscheinen jetzt als Gruppe `Themen`.
- `apps/web/src/app/admin/AdminSearchButton.tsx`
  - Gruppensortierung kennt `Themen`.

### Feed / Anlassraum

- kein neuer Feature-Scope.
- Route-Contract zieht jetzt explizit Count-vs-Detail-Paritaet fuer Anlassraum-Quellen nach:
  - Listen-`sourceCount`
  - Detail-`sources.length`

## Browser-Evidenz

CDP-gestuetzter Realbrowserlauf gegen `http://127.0.0.1:3001` mit Admin-Session-Cookies.

### Desktop

| Pfad | Ergebnis | Evidenz |
| --- | --- | --- |
| `/admin` | pass | Titel `Admin · eDebatte`, Dashboard `Steuerzentrale`, 52 Bereiche und Quicklinks sichtbar |
| `/admin/users` | pass | Seite laedt, `+ Nutzer anlegen` sichtbar und klickbar, Modal `Neuer Nutzer / Account anlegen` oeffnet |
| User-Create | pass | Browser-POST `/api/admin/dashboard/users` -> `200`, User `codex-admin-audit+1778518875@example.org` wurde angelegt |
| `/admin/themenradar` | pass | Themenradar laedt real, Create-Form und Filter sichtbar |
| Themenradar-Create | pass | Browser-POST `/api/admin/themenradar` -> `200`, Item `Codex Audit Thema 1778518875` wurde angelegt |
| Admin-Suche Themen | pass | Browser-GET `/api/admin/search?q=1778518875` liefert Gruppe `Themen` mit Link auf `/admin/themenradar/themenradar_1778518905641_52792` |
| `/admin/feeds` | pass | Feed-Leitstand laedt real, keine Crash-/Guard-Probleme |
| `/api/admin/feeds/anlassraum` | pass mit Datenluecke | Route antwortet `200`, aber `items: []`; deshalb kein Live-Detailklick moeglich |
| `/admin/graph/health` | pass als ehrlicher Diagnosezustand | keine Fake-0-KPIs mehr bei Graph-Ausfall; stattdessen Statusbox, `N/A`, Ursache, Read-/Write-Status und naechste Aktionen |
| `/admin/graph/repairs` | pass als Diagnoseflaeche | kein leerer Platzhalter mehr; `Diagnose aktualisieren` ist echte Aktion und unavailable-Graph erzeugt mindestens ein Systemticket |

### Mobile 390px

| Pfad | Ergebnis | Evidenz |
| --- | --- | --- |
| `/admin/users` | pass | reduzierte Mobile-Shell zeigt `Admin Nutzer`, CTA `+ Nutzer anlegen`, Import-Hinweis und Tabelle ohne Crash |

### Dashboard / Responsibility-Nachzug

| Pfad | Ergebnis | Evidenz |
| --- | --- | --- |
| `/admin` | pass | `Graph Repairs` verlinkt nicht mehr in einen `pending`-Only-Filter, der Systemblocker versteckt |
| `/api/admin/dashboard/summary` | pass | Graph-Repair-KPI zaehlt jetzt aktive Tickets (`pending`, `open`, `in_review`, `blocked`) statt nur `pending` |
| `/admin/responsibility` | pass | `Import / Export` ist kein `coming soon`-Scheinbutton mehr, sondern ein erklaerter Disabled-Zustand mit Batch-/Audit-Hinweis; Ladefehler werden im UI gezeigt |

## Live-Blocker / offen

1. Die Feed-/Anlassraum-Live-Datenbasis war in diesem Lauf leer. Deshalb konnte der reale Pfad `Feed-Liste -> Detail -> Statement-/Quellenzahl` nicht end-to-end mit echtem Inhalt bestaetigt werden.
2. Der Slice bleibt deshalb bewusst `in_progress`. Die Count-/Detail-Paritaet ist bereits testlich abgesichert, aber die echte Browser-Revalidierung mit vorhandenen Live-Items fehlt noch.
3. Graph Health/Repairs ist jetzt technisch ehrlich und testlich abgesichert, aber noch nicht browsernah gegen eine echte verfuegbare Graph-Instanz mit realen KPIs/Tickets revalidiert worden.
4. Der groessere Rest des vollstaendigen Admin-Audits ueber weitere Bereiche wie `editorial`, `reports`, `support`, `pricing orders` ist in diesem Slice noch nicht durchgeklickt worden.

## Tests / Verifikation

### Typecheck / Lint / Build

- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web run build` ✅

Build-Hinweise:

- wiederholter `baseline-browser-mapping`-Hinweis
- bekannte Mongo-SRV-Noise-Logs waehrend `Collecting page data`
- Build endet trotzdem erfolgreich mit Exit `0`

### Relevante Tests

- `pnpm -C apps/web exec vitest run tests/admin-users.route.test.ts tests/admin-users-page.contract.test.tsx tests/admin-search-topics.contract.test.ts tests/admin-nav-routes.contract.test.ts tests/admin-feeds-anlassraum-count-consistency.route.test.ts tests/themenradar-routing-status.route.test.ts tests/themenradar-admin-page.render.test.tsx tests/admin-governance-anlassraum.route.test.ts tests/anlassraum-operations.page.test.tsx tests/dashboard-role-contracts.test.ts` ✅
- `pnpm -C apps/web exec vitest run tests/admin-graph-health.route.test.ts tests/admin-graph-repairs.route.test.ts tests/admin-graph-health.page.render.test.tsx tests/admin-graph-repairs.page.render.test.tsx tests/admin-nav-routes.contract.test.ts` ✅
- `pnpm -C apps/web exec vitest run tests/admin-dashboard-graph-repairs-link.contract.test.ts tests/admin-responsibility.page.render.test.tsx tests/admin-graph-health.route.test.ts tests/admin-graph-repairs.route.test.ts tests/admin-nav-routes.contract.test.ts` ✅

Ergebnis:

- `10` Testdateien
- `22` Tests gruen
- plus `5` weitere Admin-Graph-Testdateien / `5` Tests gruen
- plus `5` weitere Dashboard-/Responsibility-/Graph-Testdateien / `5` Tests gruen

## Geaenderte Dateien

### Code

- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/app/api/admin/dashboard/users/route.ts`
- `apps/web/src/app/admin/themenradar/page.tsx`
- `apps/web/src/app/api/admin/themenradar/route.ts`
- `apps/web/src/app/api/admin/search/route.ts`
- `apps/web/src/app/admin/AdminSearchButton.tsx`
- `features/themenradar/server/repo.ts`
- `apps/web/src/app/admin/graph/health/page.tsx`
- `apps/web/src/app/admin/graph/repairs/page.tsx`
- `apps/web/src/app/api/admin/graph/health/route.ts`
- `apps/web/src/app/api/admin/graph/repairs/route.ts`
- `apps/web/src/app/api/admin/graph/repairs/run-diagnostics/route.ts`
- `apps/web/src/app/api/admin/graph/repairs/[ticketId]/apply/route.ts`
- `features/graphAdmin/diagnostics.ts`
- `features/graphAdmin/types.ts`
- `features/graphAdmin/schemas.ts`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/api/admin/dashboard/summary/route.ts`
- `apps/web/src/app/admin/responsibility/page.tsx`

### Tests

- `apps/web/tests/admin-users.route.test.ts`
- `apps/web/tests/admin-users-page.contract.test.tsx`
- `apps/web/tests/admin-search-topics.contract.test.ts`
- `apps/web/tests/admin-nav-routes.contract.test.ts`
- `apps/web/tests/admin-feeds-anlassraum-count-consistency.route.test.ts`
- `apps/web/tests/themenradar-routing-status.route.test.ts`
- `apps/web/tests/themenradar-admin-page.render.test.tsx`
- `apps/web/tests/admin-graph-health.route.test.ts`
- `apps/web/tests/admin-graph-repairs.route.test.ts`
- `apps/web/tests/admin-graph-health.page.render.test.tsx`
- `apps/web/tests/admin-graph-repairs.page.render.test.tsx`
- `apps/web/tests/admin-dashboard-graph-repairs-link.contract.test.ts`
- `apps/web/tests/admin-responsibility.page.render.test.tsx`

### Docs

- `docs/E150/OpenTasks.md`
- `docs/E150/PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01_2026-05-11.md`
