# PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01

Stand: 2026-05-22
Status: done

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

## Operator-States / KPI-Ehrlichkeit (2026-05-21)

### Umgesetzte Nachhaertung

- `apps/web/src/app/admin/layout.tsx`
  - Betreiber-Modus ist jetzt im gemeinsamen Admin-Layout als globaler Zustand markiert.
  - Die Copy trennt ausdruecklich globale Betreiber-/Systemsicht von organisationslokalen Arbeitsstaenden.
- `apps/web/src/app/admin/page.tsx`
  - fehlende Dashboard-Werte werden nicht mehr als echte `0` ausgegeben.
  - KPI-Karten zeigen stattdessen `Nicht geladen` mit erklaerter Betriebszustands-Copy.
  - Paket- und Rollenbereiche haben jetzt ehrliche Leerdatenzustaende statt stiller Leerflaechen.
- `apps/web/src/app/admin/responsibility/page.tsx`
  - kaputte oder nicht-ok Antworten von Directory-/Path-APIs werden jetzt als sichtbarer Fehler behandelt.
  - der Screen darf damit keinen defekten Backendzustand mehr als normale Leerseite tarnen.

### Wirkung

- `/admin`, `/admin/review`, `/admin/region`, `/admin/regions`, `/admin/feeds`, `/admin/users`, `/admin/graph/*` und `/admin/responsibility` tragen ueber das gemeinsame Layout jetzt sichtbar einen Betreiberkontext.
- Fake-KPI-Drift auf dem Dashboard ist fuer fehlende Summary-Werte reduziert: unbekannte Werte sehen nicht mehr wie belastbare Echtzahlen aus.
- Responsibility ist fuer kaputte API-Antworten ehrlicher und fuehrt Betreiber nicht mehr in eine false-negative Empty-State-Diagnose.

### Tests / Verifikation

- `pnpm -C apps/web exec vitest run tests/admin-dashboard-graph-repairs-link.contract.test.ts tests/dashboard-role-contracts.test.ts tests/admin-responsibility.page.render.test.tsx tests/admin-review.page.test.tsx tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-feed-drafts.page.test.tsx tests/admin-graph-health.page.render.test.tsx tests/admin-graph-repairs.page.render.test.tsx tests/admin-users-page.contract.test.tsx` ✅
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm --filter @vog/web build` ✅

## Restschluss 2026-05-22

### Umgesetzte Restpunkte

- `apps/web/src/app/admin/reports/page.tsx`
  - `Öffnen`-CTAs fuer Topic- und Regions-Reports sind ohne Eingabe nicht mehr scheinbar aktiv, sondern sauber deaktiviert.
  - fehlende Eingaben werden direkt im Hub erklaert statt in eine no-op-Navigation zu laufen.
- `apps/web/src/app/admin/editorial/queue/page.tsx`
  - startet mit ehrlichem Loading-State statt initialer Leere.
  - leerer Datenzustand erklaert jetzt Filter-/Such- oder Datenbasisgruende sichtbar.
- `apps/web/src/app/admin/editorial/published/page.tsx`
  - startet ebenfalls mit ehrlichem Loading-State.
  - leere Datenlage wird nicht mehr wie eine normale inhaltsleere Erfolgssituation dargestellt.
- `apps/web/src/app/admin/feeds/anlassraum/AdminAnlassraumPageClient.tsx`
  - Listenansicht zeigt Count, Detailhinweis und leeren Zustand jetzt sichtbar auf derselben Datenrealitaet.
  - ohne reale Datensaetze gibt es keinen vorgetaeuschten Detailpfad; Detaillinks erscheinen nur fuer vorhandene Items.
- `apps/web/src/app/admin/feeds/anlassraum/page.tsx`
  - traegt den Anwendungsfall weiterhin ueber die bestehende Route, aber jetzt mit page-vertraeglichem `h1` und ausgelagertem Test-/Client-Readmodel.

### Abschlusslesart

1. Feed-Liste -> Detail ist fuer den aktuellen Betreiberpfad contractnah geschlossen: Counts, Empty-State und Detailverlinkung behaupten keine Datenbasis mehr, die nicht vorhanden ist.
2. Die noch offene Live-Datenvarianz gehoert nicht mehr zu diesem Parent-Task, sondern zu spaeterer produktiver Daten- und Rollout-Revalidierung im generischen `REGION-DASHBOARD-PRODUCTION-CUT`.
3. Reports-, Editorial-, Support- und Pricing-Adminhubs sind gegen sichtbare Sackgassen, irrefuehrende Placeholder und unehrliche Empty-/Loading-States weiter gehaertet.
4. Der Parent-Task ist damit abgeschlossen; verbleibende breite Rollout-Reste liegen ausserhalb dieses Admin-Repair-Slices.

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
- `pnpm -C apps/web exec vitest run tests/admin-hub-links.contract.test.ts tests/admin-reports.page.test.tsx tests/admin-anlassraum-list.page.test.tsx tests/admin-editorial-hubs.page.test.tsx tests/admin-support-pricing.page.test.tsx tests/admin-feeds-anlassraum-count-consistency.route.test.ts tests/admin-review.page.test.tsx tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-feed-drafts.page.test.tsx tests/admin-users-page.contract.test.tsx tests/admin-graph-health.page.render.test.tsx tests/admin-graph-repairs.page.render.test.tsx tests/admin-responsibility.page.render.test.tsx tests/admin-pricing-orders.route.test.ts tests/admin-pricing-control-contract.test.ts tests/admin-pricing-control-readmodel.test.ts tests/dashboard-role-contracts.test.ts` ✅

Ergebnis:

- `10` Testdateien
- `22` Tests gruen
- plus `5` weitere Admin-Graph-Testdateien / `5` Tests gruen
- plus `5` weitere Dashboard-/Responsibility-/Graph-Testdateien / `5` Tests gruen
- plus `18` weitere Admin-Hub-/Feed-/Pricing-/Review-/Region-Testdateien / `38` Tests gruen

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
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/api/admin/dashboard/summary/route.ts`
- `apps/web/src/app/admin/responsibility/page.tsx`
- `apps/web/src/app/admin/reports/page.tsx`
- `apps/web/src/app/admin/editorial/queue/page.tsx`
- `apps/web/src/app/admin/editorial/published/page.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/page.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/AdminAnlassraumPageClient.tsx`

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
- `apps/web/tests/dashboard-role-contracts.test.ts`
- `apps/web/tests/admin-hub-links.contract.test.ts`
- `apps/web/tests/admin-reports.page.test.tsx`
- `apps/web/tests/admin-anlassraum-list.page.test.tsx`
- `apps/web/tests/admin-editorial-hubs.page.test.tsx`
- `apps/web/tests/admin-support-pricing.page.test.tsx`

### Docs

- `docs/E150/OpenTasks.md`
- `docs/E150/PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01_2026-05-11.md`
