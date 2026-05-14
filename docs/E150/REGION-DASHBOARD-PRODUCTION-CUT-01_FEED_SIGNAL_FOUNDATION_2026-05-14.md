# REGION-DASHBOARD-PRODUCTION-CUT-01

Stand: 2026-05-14

## Ziel

Den Reinickendorf-Pilot nicht mit einem leeren Regionalcockpit starten, sondern mit einer ehrlichen, reviewpflichtigen Feed-/Signal-Grundlage:

- keine automatische Veröffentlichung
- keine automatische Dossier-Erstellung
- keine automatische Anlassraum-Erstellung
- keine Vergabe-/Ausschreibungslogik
- keine Live-Scraping-Behauptung
- keine Demo-/Seed-Daten als produktive Behördendaten

Zusätzlich wurde die Linie `Selbstauskunft != verifizierte Behördenrolle` als Contract festgezogen.

## Gebaut

### 1. Region/Org/Unit Access + Onboarding Contract

Neue Contract-Dateien:

- `features/region/access.ts`
- `features/region/organizationOnboarding.ts`

Enthalten:

- `RegionAccessContext`
- `OrganizationAccessContext`
- `AdministrativeRegion`
- `Organization`
- `OrganizationUnit`
- `OrganizationMembership`
- `OrganizationClaim`
- `VerificationStatus`
- `AllowedActions` fuer Dashboard, Review, Drafts, Review-Submit und Publikationsfreigabe

Wesentliche Regel:

- Self-declared Organisations- oder Unit-Angaben werden als Claim/Membership gespeichert.
- Daraus entsteht **keine** verifizierte Behördenrolle.
- `pending_review` darf kein Behörden-Dashboard lesen.
- rohe Rollenstrings wie `region_staff:*` liefern hoechstens Region-Hinweise, aber keine offiziellen Rechte.
- `organization_verified` darf nur die eigene Region lesen.
- `unit_verified` darf regionbezogene Review-/Draft-Aktionen ausfuehren.
- `publication_approved` ist separat und restriktiv.
- `admin` bleibt als expliziter `admin_fallback` markiert.

### 2. Region Feed Signal Contract

Neue Contract-Datei:

- `features/region/regionFeedSignals.ts`

Enthalten:

- `RegionFeedSource`
- `RegionFeedItem`
- `RegionFeedSignal`
- `RegionTopicCluster`
- `RegionDossierSuggestion`
- `RegionAnlassraumSuggestion`
- `RegionSignalReviewState`

Guardrails sind hart im Contract:

- `noAutoPublish: true`
- `noAutoCreateDossier: true`
- `noAutoCreateAnlassraum: true`
- `noTenderMonitoring: true`
- `noProcurementMonitoring: true`
- `supportsRegionTenderSignalTypes(): false`

Tender-/Vergabe-Signaltypen sind damit fuer den MVP explizit ausgeschlossen.

### 3. Pilot-Fixtures fuer Reinickendorf und Magdeburg

Erweitert:

- `features/region/fixtures.ts`
- `features/region/regionFeedSignals.ts`

Neu bzw. praezisiert:

- Regionen: Reinickendorf, Spandau, Pankow, Magdeburg
- Anlassraum-Fixture fuer Magdeburg
- Pilotische Feed-/Signal-Faelle fuer Reinickendorf:
  - Schulsanierung / Schulgebaeude / Bauzustand
  - Schulwege / Verkehr / OePNV
  - Buergeramt / Verwaltungszugang
  - soziale Infrastruktur / Jugend / Sport / Kultur
  - Gruenflaechen / Sauberkeit / oeffentlicher Raum
- Getrennte Kommunal-Fixture fuer Magdeburg

Wichtig:

- Alle neuen Feed-Signale sind als `pilot_fixture` markiert.
- Sie sind **nicht** als echte Nachrichten oder Live-Verwaltungsinformationen modelliert.

### 4. RegionDashboardReadModel

Erweitert in:

- `features/region/store.ts`

Das Readmodel fuehrt jetzt zusammen:

- `region`
- `accessSummary`
- `feedSignals`
- `topicClusters`
- `suggestedAnlassraeume`
- `suggestedDossiers`
- `openReviewItems`
- `activeDossiers`
- `activeAnlassraeume`
- `communitySignals`
- `actorsSummary`
- `guardrails`

Der Cockpit-Pfad kann jetzt fuer Reinickendorf eine greifbare Themenlage ausgeben, inklusive:

- `Bildung & Schulinfrastruktur Reinickendorf`
- `Sanierung von Schulen im Bezirk`
- `Sichere Schulwege / Verkehr vor Schulen`
- offenen Rueckfragen zu Zustaendigkeit und Betroffenheit

### 5. Serverseitiger Cockpit-Gate

Aktualisiert:

- `apps/web/src/app/api/admin/region/cockpit/[regionId]/route.ts`

Neu:

- Governance-Gate statt rein globalem Admin-Gate
- `RegionAccessContract` als serverseitige Cockpit-Pruefung
- non-admin ohne verifizierten Membership-Kontext werden konservativ geblockt
- `region_not_found` / `region_dashboard_forbidden` sauber als API-Fehler

Damit ist der erste serverseitige Region-Dashboard-Enforcement-Pfad gelegt.

## Nachhaertung vor Freigabe

Die Abnahme-Findings fuer CUT-01 wurden vor Freigabe geschlossen:

- der Raw-Role-Bypass ist entfernt
- `region_staff:*` allein erzeugt keine Dashboard-/Draft-/Review-Rechte mehr
- nur `organization_verified`, `unit_verified`, `publication_approved` oder `admin_fallback` koennen offizielle Aktionen freischalten
- `canApprovePublication` ist jetzt auf `publication_approved` oder `admin` begrenzt
- `noProcurementMonitoring` wurde im Feed-Signal-Contract und im RegionDashboardReadModel ergaenzt

### 6. Kleines Dashboard-Readout

Aktualisiert:

- `apps/web/src/app/admin/region/page.tsx`

Keine grosse neue UI, aber jetzt sichtbar:

- neue Signale
- Themencluster
- Anlassraum-Vorschlaege
- Dossier-/Rueckfrage-Vorschlaege

Das Cockpit startet damit nicht mehr als abstrakte Leerflaeche.

## Wiederverwendete bestehende Bausteine

Wiederverwendet statt neuer Parallelpfade:

- `features/region/contracts.ts`
- `features/region/fixtures.ts`
- `features/region/server/repo.ts`
- `features/region/store.ts` als bestehender regionaler Readmodel-/Repo-Einstieg
- `/api/admin/region/cockpit/[regionId]`
- `/admin/region`
- bestehende `CommunitySignal`-Queue und Review-Status
- bestehende Anlassraum-Fixtures und -Links

Nicht neu aufgebaut wurden:

- kein eigener Feed-Crawler
- kein separates Tender-/Vergabe-Subsystem
- kein neues Publikationssystem
- kein automatischer Dossier-/Anlassraum-Erzeuger

## Bewusst offen gelassen

Dieser Slice ist **Foundation**, nicht der komplette Produktionsschnitt.

Weiter offen:

- echte PaidDashboardEntitlement-Runtime
- vollstaendige Region-/Org-Isolation ueber **alle** Admin-Routen, nicht nur Cockpit/Readmodel
- echte Verwaltungs-Draft-Erstellung fuer Dossier/Anlassraum
- Freigabe-/Publikationsrollen in Runtime
- Organization-Claim- und Membership-UI
- serverseitige Persistenz fuer Organization/Unit/Membership/Claim
- Entfernung aller Demo-/Fixture-Fallbacks aus allen produktiven Behoerdenpfaden

## Warum Ausschreibungen/Vergabe nicht Teil des MVP sind

Dieser Slice friert Vergabe-/Ausschreibungslogik weiterhin explizit aus:

- keine automatische Ausschreibungs-Ingestion
- kein Tender-/Vergabe-Signaltyp
- kein Monitoring laufender Vergabeverfahren
- keine Beschaffungsbewertung im eDebatte-Kern

Grund:

- der Reinickendorf-Pilot braucht zuerst einen ehrlichen regionalen Review-/Dossier-/Anlassraum-Pfad
- Vergabe-/Beschaffungsthemen wuerden den Produktkern wieder verbreitern
- der Audit-Slice `GOV-PRODUCTION-REALITY-AUDIT-01` hat diesen Scope explizit geparkt

## Tests und Validierung

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/region-access.contract.test.ts tests/regional-feed-signals.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/regional-admin-cockpit.contract.test.ts`

Abgedeckt:

- rohe Rollenstrings ohne verifizierte Membership geben kein Dashboard und keine Draft-Rechte
- Reinickendorf bekommt eigene Feed-/Themenvorschlaege
- Spandau/Pankow sehen keine Reinickendorf-internen Pilot-Signale
- Magdeburg bleibt getrennt und funktioniert analog
- `create_dossier` bleibt review-only
- `pending_review` bekommt kein Behörden-Dashboard
- `email_verified` bekommt kein Behörden-Dashboard
- `organization_verified` darf nur die eigene Region lesen
- `unit_verified` darf Review-/Draft-Aktionen in der eigenen Region ausfuehren
- `publication_approved` ist fuer Freigabe separat getestet
- fehlende optionale Location ist gueltig
- `Rathaus Reinickendorf` wird als optionale Location und nicht als Pflicht-Organisationsebene behandelt
- internationale Self-Declared-Profile funktionieren ohne deutsche Pflichtfelder
- Freitext wie `Dezernat 4` erzeugt keinen automatischen Amtsnachweis
- Tender-/Vergabe-Signaltypen sind im MVP ausgeschlossen
- `noAuto*`-Guardrails, `noTenderMonitoring`, `noProcurementMonitoring` und `pilot_fixture`-Markierung bleiben durchgaengig aktiv

## Ergebnis

`REGION-DASHBOARD-PRODUCTION-CUT-01` liefert jetzt die belastbare Grundlage fuer den Reinickendorf-Pilot:

- regionalspezifische Signal- und Themenlage
- klare Reviewpflicht
- erster serverseitiger Access-Contract
- saubere Trennung zwischen Selbstauskunft und verifizierter Behördenrolle
- geschlossener Raw-Role-Bypass vor der Freigabe

Der naechste sinnvolle Schritt bleibt:

- echte Draft-Aktionen aus dem Cockpit
- persistente Organization-/Membership-Pruefung
- breitere serverseitige Region-/Org-Isolation
