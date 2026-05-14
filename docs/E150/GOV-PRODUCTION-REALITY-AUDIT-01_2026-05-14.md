# GOV-PRODUCTION-REALITY-AUDIT-01

Datum: 2026-05-14
Status: done

## Ziel

Kein neuer Feature-Bau, sondern ein ehrlicher Reality-/Production-Readiness-Schnitt fuer `edebatte-org`.

Der Slice beantwortet:

1. Was ist echte Runtime?
2. Was ist nur Contract, Demo, Fixture oder Local-State?
3. Was ist fuer einen kontrollierten regionalen Pilot nutzbar?
4. Was darf oeffentlich oder kommerziell behauptet werden?
5. Was muss vor einem Behoerdenpilot mit Reinickendorf zwingend geschlossen werden?

## Bearbeiteter Scope

- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/GOV-PRODUCTION-REALITY-AUDIT-01_2026-05-14.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/OpenTasks_ChatFollowups_2026-04-30.md`
- `docs/E150/GOV-REGION-ANLASSRAUM-01_REGIONAL_PARTICIPATION_ROOMS_2026-05-03.md`

Nicht im Scope:

- keine Runtime-Aenderungen
- keine neuen Routen
- keine neuen Claims
- kein neuer Pricing-/Vergabe-/Radar-Bau
- keine Testpflicht jenseits des Docs-Audits

## Relevante Repo-Evidenz

### Reale Runtime-Bausteine

- `/create` ist real als kanonischer Einstieg mit Entitlements, Planner, Follow-up und Handoffs.
  - `apps/web/src/app/create/page.tsx`
  - `apps/web/src/app/create/CreateClient.tsx`
  - `apps/web/src/app/api/create/analyze/route.ts`
  - `apps/web/src/app/api/create/intelligent-followup/route.ts`
  - `apps/web/src/lib/server/entitlements/createEntitlements.ts`
- Regionale Admin-Basis ist real:
  - `apps/web/src/app/admin/region/page.tsx`
  - `apps/web/src/app/api/admin/region/actors/route.ts`
  - `apps/web/src/app/api/admin/region/signals/route.ts`
  - `apps/web/src/app/api/admin/region/signals/[id]/review/route.ts`
  - `apps/web/src/app/api/admin/region/cockpit/[regionId]/route.ts`
- Dossier-Collections und Factcheck-Dossier-Sync sind real:
  - `apps/web/src/app/api/dossier/[id]/route.ts`
  - `apps/web/src/app/api/dossiers/[dossierId]/*`
  - `apps/web/src/app/api/factcheck/enqueue/route.ts`
- Mandat hat eine echte oeffentliche read-only Surface:
  - `apps/web/src/app/mandat/[id]/page.tsx`

### Demo-/Seed-/Local-State-Grenzen

- Dossier-Client startet mit Demo-Fallback und laedt erst danach Runtime-Daten:
  - `apps/web/src/app/dossier/[id]/ui.tsx`
- Studio arbeitet auf der Hauptseite mit `demoDossierForOutputEngine`:
  - `apps/web/src/app/dossier/[id]/studio/page.tsx`
- Studio-Drafts/Review/Plan liegen aktuell in `localStorage`:
  - `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
  - `apps/web/src/components/outputEngine/MasterPostActions.tsx`
- Swipes nutzt Seed-Fallback, wenn Proposal-Feed leer oder nicht verfuegbar ist:
  - `apps/web/src/features/swipes/service.ts`

### Rechte-/Isolationsgrenzen

- Regionale Admin-Pfade sind aktuell global ueber `requireAdminOrResponse` geschuetzt, nicht ueber Region-/Org-Isolation:
  - `apps/web/src/app/api/admin/region/actors/route.ts`
  - `apps/web/src/app/api/admin/region/signals/route.ts`
  - `apps/web/src/app/api/admin/region/cockpit/[regionId]/route.ts`
- Create-Entitlements sind account-/tierbezogen, aber noch kein Behoerden-Dashboard-Entitlement:
  - `apps/web/src/lib/server/entitlements/createEntitlements.ts`

### Factcheck-/Seal-Grenze

- Factcheck-Job und Dossier-Sync existieren.
- Seal-Route existiert, aber noch ohne fertige Review-/Produktkette:
  - `apps/web/src/app/api/factcheck/status/[jobId]/seal/route.ts`

## Zentrale Audit-Entscheidungen

- Reinickendorf bleibt der priorisierte erste regionale Pilotraum.
- Der naechste aktive Produktschnitt ist `REGION-DASHBOARD-PRODUCTION-CUT`.
- `RegionAccessContract`, `OrganizationAccessContract`, `PaidDashboardEntitlement`, `AllowedActions` und `RegionDashboardReadModel` sind Pflichtbestandteile dieses Schnitts.
- Demo-/Seed-/LocalStorage-Zustaende zaehlen nicht als produktive Persistenz.
- Route ohne UI/Review/Rechte zaehlt maximal als `pilot`.
- Contract ohne Runtime zaehlt nicht als `live`.
- Ausschreibungen/Vergabe sind fuer den aktuellen eDebatte-MVP eingefroren.

## Backlog-/Scope-Korrekturen

- Neuer erledigter Audit-Slice in `OpenTasks.md`:
  - `GOV-PRODUCTION-REALITY-AUDIT-01`
- Neuer priorisierter Folge-Slice in `OpenTasks.md`:
  - `REGION-DASHBOARD-PRODUCTION-CUT`
- `PR-BETEILIGUNGSRADAR-00` ist in `OpenTasks.md` jetzt `research_only` und ohne Ausschreibungs-/Vergabe-Fokus beschrieben.
- `GOV-B2G-REGIONAL-ROOM-01` ist in `OpenTasks.md` fuer den aktuellen MVP auf `research_only` geparkt.
- `PR-VOG-BETEILIGUNGSRADAR-01` ist in `OpenTasks_ChatFollowups_2026-04-30.md` auf spaeteren Themen-/Signalradar ohne Vergabe/Scraping bereinigt.
- `PR-RADAR-B2G-ACQUISITION-01` ist in `OpenTasks_ChatFollowups_2026-04-30.md` als `pause / out_of_scope_for_edebatte_mvp` markiert.

## Wichtigste Findings

1. `Create` ist der staerkste reale Produktpfad, aber noch kein geschlossener regionaler Verwaltungsworkflow.
2. Dossier und Studio sind fachlich stark, tragen aber noch Demo-/Seed-/Local-State-Altlasten in produktnahen Pfaden.
3. Region/Admin ist echt genug fuer einen Pilot-Readout, aber nicht fuer einen belastbaren Bezirksbetrieb ohne serverseitige Isolation.
4. Factcheck und Seal duerfen aktuell nur als Pilot-/Pruefpfad beschrieben werden.
5. Pricing/Order/Vormerken duerfen nicht als geschlossener Kauf-/Freischaltpfad fuer Dashboards behauptet werden.
6. Ausschreibungs-/Vergabelogik muss aus dem aktiven eDebatte-MVP draussen bleiben.

## Tests

Keine Tests erneut ausgefuehrt.

Begruendung:

- Dies ist ein Docs-/Audit-Slice.
- Die Matrix basiert auf Repo-/Docs-Abgleich und vorhandener Evidence.
- Keine Runtime-Logik wurde veraendert.

## Ergebnis

- Eine neue `ProductionReadinessMatrix.md` trennt `live`, `pilot`, `demo`, `concept`, `pause` und `blocker` fuer den aktuellen Produktstand.
- Der Reinickendorf-Pilotpfad ist als naechster Produktfokus sichtbar.
- Die Scope-Drift Richtung Ausschreibungen/Vergabe wurde fuer den eDebatte-MVP explizit zurueckgenommen.
- Die naechste sinnvolle Arbeit ist klar eingegrenzt: `REGION-DASHBOARD-PRODUCTION-CUT`.
