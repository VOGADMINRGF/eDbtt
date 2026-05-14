# REGION-DASHBOARD-PRODUCTION-CUT-03

Stand: 2026-05-14  
Branch: `refactor/create-mobile-shell-cleanup`  
Vorgaenger: `REGION-DASHBOARD-PRODUCTION-CUT-02`

## Ziel

Aus akzeptierten regionalen Signalen kontrollierte, persistente Drafts erzeugen:

- Dossier-Draft
- Anlassraum-Draft

Ohne:

- Veröffentlichung
- automatische Veröffentlichung
- automatische Abstimmung
- automatische Amtsantwort
- automatisches Mandat
- Vergabe-/Ausschreibungslogik
- Social-Publishing

## Was wurde gebaut?

- Neuer typed Contract fuer Signal-zu-Draft-Aktionen in `features/region/regionSignalDrafts.ts`
- Neue Admin-Route:
  - `/api/admin/region/signals/[id]/draft`
- Serverseitige Draft-Erstellung aus akzeptierten Region-Signalen fuer:
  - `target = dossier`
  - `target = anlassraum`
- Typed Guardrails fuer jeden Draft:
  - `noAutoPublish`
  - `noAutoVote`
  - `noAutoMandate`
  - `noTenderMonitoring`
  - `noProcurementMonitoring`
  - `reviewRequired`
- Persistente Draft-Provenance aus Region-Signal:
  - `sourceSignalId`
  - `sourceRegionId`
  - `createdFrom = region_signal`
  - `pilotFixture`
  - `notProductionData`
  - `notRealNews`

## Welche bestehenden Bausteine wurden genutzt?

### Region

- `features/region/access.ts`
  - Access-Contract
  - Trennung `Selbstauskunft != verifizierte Behördenrolle`
- `features/region/store.ts`
  - RegionDashboardReadModel
  - Signal-Auflösung im bestehenden Region-/Cockpit-Pfad
- `features/region/regionFeedSignals.ts`
  - Signal-/Suggestion-Contract
  - Pilot-/Fixture-Markierung

### Dossier

- `features/dossier/db.ts`
  - bestehende Dossier-Collection
- `features/dossier/revisions.ts`
  - bestehende Revisions-/Audit-Logik
- `features/dossier/seed.ts`
  - offene Fragen in den Draft übernehmen

Dossier-Drafts werden als echte `draft`-Einträge in den bestehenden Dossier-Collections angelegt.

Wichtig:

- Das bestehende `DossierDoc` kennt kein vollständiges Region-/Signal-Provenance-Feld.
- Deshalb bleibt die vollständige Region-Signal-Provenance im neuen RegionSignalDraft-Record gespeichert.
- Das ist bewusst schema-konform und kein unsauberer Hack in das bestehende Dossier-Schema.

### Anlassraum

- `features/anlassraum/service.ts`
  - bestehende manuelle Anlassraum-Erstellung
- `features/anlassraum/types.ts`
  - bestehender Draft-/non-public Modellrahmen

Anlassraum-Drafts werden über die bestehende Anlassraum-Familie angelegt bzw. im Testpfad über typed In-Memory-Persistenz gespiegelt. Sie bleiben nicht öffentlich.

## Welche Draft-Ziele werden unterstützt?

- `dossier`
- `anlassraum`

Nicht unterstützt:

- andere Targets
- Vergabe-/Procurement-bezogene Ableitungen
- automatische Weitergabe an Veröffentlichung, Voting oder Mandat

## Welche Access-Regeln gelten?

Draft-Erstellung ist nur erlaubt für:

- `admin`
- `unit_verified` in der eigenen Region mit den passenden Allowed Actions

Nicht ausreichend:

- raw role `region_staff:*`
- `self_declared`
- `pending_review`
- `email_verified`
- `organization_verified`

`publication_approved` ist für Draft-Erstellung nicht nötig.
Es bleibt nur für spätere Veröffentlichungs-/Freigabeschritte relevant.

Da es noch keine persistente Membership-/Claim-Runtime gibt, nutzt CUT-03 für non-admin Tests und Contract-Verifikation weiterhin den expliziten Fixture-/Contract-Pfad für verifizierte Membership-Kontexte.

## Warum dürfen nur akzeptierte Signale Drafts erzeugen?

Der Produktpfad soll bewusst sein:

Reinickendorf-Cockpit  
→ Signal prüfen  
→ Signal akzeptieren  
→ Dossier- oder Anlassraum-Draft erzeugen  
→ Draft bleibt reviewpflichtig

Deshalb blockt CUT-03:

- `draft`
- `needs_review`
- `rejected`
- `archived`

Für Pilot-Fixtures gibt es einen explizit akzeptierten Testfall. Auch daraus erzeugte Drafts bleiben:

- `pilotFixture`
- `notProductionData`
- `notRealNews`

## Welche Guardrails gelten?

- keine Veröffentlichung
- kein public/published Status
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Vote
- kein Auto-Mandat
- kein Tender-/Procurement-Monitoring
- keine Ableitung offizieller Amtsantworten

Procurement-/Vergabe-nahe Signale werden trotz `accepted` Reviewstatus weiterhin als `out_of_scope` geblockt.

## Warum gibt es weiterhin keine Veröffentlichung?

CUT-03 schließt nur den nächsten belastbaren Arbeitsstand:

- Signal zu Draft

Nicht:

- Draft zu Veröffentlichung
- Draft zu öffentlichem Dossier
- Draft zu offizieller Verwaltungsantwort

Diese Produktgrenze bleibt absichtlich hart.

## UI-Status

- Die bestehende `/admin/region`-Surface bleibt bewusst reduziert.
- Prepare-only Actions werden nicht zu einer neuen UI-Welt ausgebaut.
- Der Slice priorisiert die serverseitige Route und Persistenz.
- Die Oberfläche wurde nur textlich aktualisiert, damit sie nicht mehr auf dem Stand `Folgt in CUT-03` stehen bleibt.

Ein späterer UI-Slice muss die Draft-Route kontrolliert an die Cockpit-Aktionen anschließen.

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/region-access.contract.test.ts tests/regional-feed-signals.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/regional-admin-cockpit.contract.test.ts tests/region-signal-drafts.contract.test.ts tests/admin-region-signal-draft.route.test.ts`

Neu/erweitert in diesem Slice:

- `apps/web/tests/region-signal-drafts.contract.test.ts`
- `apps/web/tests/admin-region-signal-draft.route.test.ts`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/regional-dashboard-readmodel.test.ts`

Abgedeckt:

- Access-Gates für pending/email_verified/organization_verified/raw role/unit_verified/admin
- accepted vs. draft/rejected/archived
- Reinickendorf vs. Spandau/Pankow/Magdeburg
- Dossier- und Anlassraum-Draft-Ziel
- Procurement-/Vergabe-Out-of-scope
- Pilot-/Fixture-Provenance
- Guardrails bleiben immer `true`

## Was bleibt bewusst offen?

- PaidDashboardEntitlement / Behördenfreischaltung
- persistente Membership-/OrganizationClaim-Runtime
- vollständige Region-/Org-Isolation über alle Admin-Routen
- UI-nahe Aktivierung der Draft-Aktionen im Cockpit
- Review Queue / Freigabe / Veröffentlichung nach dem Draft
- Entfernung weiterer Demo-/Seed-Fallbacks aus produktiven Behördenpfaden

## Nächste Schnitte

- `REGION-DASHBOARD-PRODUCTION-CUT-04`
  - Paid Entitlement / Behördenfreischaltung
- `REGION-DASHBOARD-PRODUCTION-CUT-05`
  - Demo-/Seed-Fallbacks aus produktiven Behördenpfaden entfernen
- `REGION-DASHBOARD-PRODUCTION-CUT-06`
  - persistente Membership-/OrganizationClaim-Runtime
