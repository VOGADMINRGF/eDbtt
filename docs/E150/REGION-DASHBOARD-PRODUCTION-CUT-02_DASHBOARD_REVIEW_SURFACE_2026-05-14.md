# REGION-DASHBOARD-PRODUCTION-CUT-02

Stand: 2026-05-14  
Branch: `refactor/create-mobile-shell-cleanup`  
Vorgaenger: `REGION-DASHBOARD-PRODUCTION-CUT-01`

## Ziel

Die bestehende regionale Admin-/Cockpit-Oberflaeche fuer Reinickendorf sichtbar und nutzbar machen, ohne neue Fachlogik, neue Write-Routen oder eine zweite Dashboard-Architektur zu bauen.

## Was wurde gebaut?

- Die bestehende Seite `/admin/region` wurde als Review-first-Readout erweitert.
- Die Seite zeigt jetzt auf Basis des bestehenden RegionDashboardReadModels:
  - Access Summary mit `authoritySource`, `adminFallback`, `verificationStatus` und `allowedActions`
  - klare Authority-Hinweise fuer `admin_fallback`, `organization_verified`, `unit_verified`, `publication_approved` und unverifizierte Kontexte
  - aktuelle Themenlage fuer Reinickendorf
  - Feed-/Signal-Hinweise mit `sourceType`, `reviewStatus`, `suggestedAction`, `confidence`, Topics und Places
  - Themencluster
  - vorgeschlagene Anlassraeume
  - vorgeschlagene Dossiers
  - offene Review-Items
  - sichtbare Guardrails und Pilot-/Fixture-Hinweise
- Prepare-only Actions sind sichtbar, bleiben aber bewusst disabled und non-mutating:
  - `Dossier-Draft vorbereiten`
  - `Anlassraum-Draft vorbereiten`
  - `Quelle prüfen`
  - `Offene Frage markieren`

## Welche bestehenden CUT-01-Contracts wurden genutzt?

- `features/region/access.ts`
  - Access- und Verification-Contract
  - `adminFallback` / `authoritySource`
- `features/region/organizationOnboarding.ts`
  - Verification-Status und optionale Standortlogik
- `features/region/regionFeedSignals.ts`
  - Signal-/Suggestion-Contract
  - Pilot-/Fixture-/Not-real-news-Markierungen
- `features/region/store.ts`
  - RegionDashboardReadModel
  - Access Summary
  - Guardrails
  - Open Review Items
- bestehende Cockpit-Route:
  - `/api/admin/region/cockpit/[regionId]`

CUT-02 fuehrt keine neue Route-Familie ein. Die bestehende Region-Family wurde erweitert.

## Wie wurde die Admin-Region-Seite erweitert?

- Die Seite rendert die neuen Readmodel-Felder direkt aus dem bestehenden Cockpit-Readmodel.
- Feed-/Signal-, Cluster- und Suggestion-Bloecke sind als read-only Review-Oberflaeche sichtbar.
- Access-Hinweise machen die Trennung `Selbstauskunft != verifizierte Behoerdenrolle` explizit.
- Ein fester Hinweis stellt klar:
  - Self-declared ist nicht verifiziert.
  - Pending hat keine Behördenrechte.
  - Publication approval ist gesondert erforderlich.
  - Standortangaben wie Rathaus Reinickendorf bleiben optional.

## Welche Guardrails sind sichtbar?

- `reviewRequired`
- `noAutoPublish`
- `noAutoDossierCreation`
- `noAutoAnlassraumCreation`
- `noTenderMonitoring`
- `noProcurementMonitoring`

Zusatzhinweise im UI:

- Pilotdaten zur Demonstration der Themenlage
- keine echten Nachrichten
- keine produktiven Verwaltungsdaten
- keine automatische Veröffentlichung
- keine automatische Dossier-Erstellung
- keine automatische Anlassraum-Erstellung

## Warum sind die Aktionen nur prepare-only?

CUT-02 soll die Arbeitsoberflaeche fuer den Reinickendorf-Pilot greifbar machen, aber noch keine echte Verwaltungs-Mutation freischalten.

Deshalb bleiben die Aktionsflaechen:

- disabled
- non-mutating
- prepare-only
- ohne neue Write-API
- ohne DB-Mutation

Die UI verweist explizit auf `CUT-03` fuer die erste echte Draft-Erstellung aus akzeptierten Signalen.

## Warum sind Ausschreibungen/Vergabe nicht Teil des MVP?

Der regionale Pilot soll Themenlage, Signale, Dossiers und Anlassraeume haerten, nicht Beschaffungs- oder Vergabeprozesse aufmachen.

Deshalb bleibt explizit ausserhalb des MVP:

- kein Ausschreibungsradar
- kein Vergabe-Monitoring
- kein Procurement Monitoring
- kein Scraping-/Crawler-Versprechen
- keine Abstimmungen ueber laufende Vergabeverfahren

Die Guardrails `noTenderMonitoring` und `noProcurementMonitoring` sind sichtbar und testbar.

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/region-access.contract.test.ts tests/regional-feed-signals.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/regional-admin-cockpit.contract.test.ts`

Abgedeckt in diesem Slice:

- Cockpit-Readmodel enthaelt FeedSignals, Suggestions, Open Review Items und Access Summary
- Render-Surface zeigt Guardrails, Pilot-Hinweise und prepare-only Actions
- `noProcurementMonitoring` bleibt `true`
- unverifizierte/raw-role Kontexte erhalten keine offiziellen Region-Rechte
- Reinickendorf-Daten leaken nicht nach Spandau/Pankow/Magdeburg

## Was bleibt bewusst offen?

- persistente Membership-/Claim-Runtime
- echte Paid-/Entitlement-Runtime
- vollstaendige Region-/Org-Isolation ueber alle Admin-Routen
- erste echte Dossier-/Anlassraum-Draft-Erstellung aus akzeptierten Signalen
- produktive Entfernung aller Demo-/Seed-Fallbacks aus weiteren Behoerdenpfaden

## Folgepfade

- `REGION-DASHBOARD-PRODUCTION-CUT-03`
  - erste echte Dossier-/Anlassraum-Draft-Erstellung aus akzeptiertem Signal
- `REGION-DASHBOARD-PRODUCTION-CUT-04`
  - Paid Entitlement / Behoerdenfreischaltung
- `REGION-DASHBOARD-PRODUCTION-CUT-05`
  - Demo-/Seed-Fallbacks aus produktiven Behoerdenpfaden entfernen
