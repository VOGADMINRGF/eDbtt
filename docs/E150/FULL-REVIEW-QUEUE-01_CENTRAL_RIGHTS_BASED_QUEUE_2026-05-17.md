# FULL-REVIEW-QUEUE-01

Stand: 2026-05-17
Status: done
Issue: #157

## Ziel

Eine zentrale, rechtebasierte Review-Queue fuer:

- Beteiligungssignale
- Anlassraum Public Input
- RegionSignalDrafts
- Dossier Studio Workspaces
- Output-/Distribution-Artefakte
- Create-Handoffs
- `public_official`-Freigaben

Wichtig:

- keine neue Parallel-Runtime
- Wiederverwendung bestehender Persistenz- und Review-Pfade
- keine Bulk-Approve-Funktion
- keine automatische Sammelentscheidung
- keine automatische Amtlichkeit
- kein Social Publishing
- keine automatische Dossier-/Anlassraum-Finalisierung

## Umsetzung

### 1. Zentraler Queue-Aggregator

Neu: `features/reviewQueue.ts`

Die Queue aggregiert ausschliesslich bestehende serverseitige Quellen:

- `features/region/server/participationSignalReviewRuntime.ts`
- `features/region/regionSignalDrafts.ts`
- `features/dossier/server/studioPersistence.ts`
- `apps/web/src/features/create/attachDraftReviewQueue.ts`

Der Aggregator erzeugt einen gemeinsamen Readmodel-Schnitt fuer:

- `participation_signal`
- `anlassraum_public_input`
- `region_signal_draft`
- `dossier_workspace`
- `output_artifact`
- `create_handoff`
- `public_official_approval`

Explizit nicht neu erfunden:

- keine eigene Review-Entscheidungsruntime
- keine eigene Persistenz fuer rohe Create-Handoffs
- keine neue Publish-/Amtlichkeitslogik

### 2. Betreiber-Surface

Neu: `/admin/review`

Der Betreiberbereich zeigt:

- Gesamtzahl offener Aufgaben
- Zahl expliziter amtlicher Freigabeschritte
- Verteilung nach Domain
- zentrale Liste mit Links zur jeweiligen Fach-Surface

Die Queue bleibt bewusst view-first:

- keine Sammelentscheidung
- keine Bulk-Freigabe
- Entscheidungen bleiben in den bestehenden Fachpfaden

### 3. Organisationsbereich

`/account/organization/dashboard` nutzt jetzt dieselbe Queue-Quelle fuer offene Review-Aufgaben.

Dadurch sieht die Organisation konsolidiert:

- reviewpflichtige Beteiligungssignale
- Anlassraum Public Input
- RegionSignalDrafts
- Studio-/Output-Aufgaben
- explizite amtliche Freigabeschritte, falls `approve_publication` vorhanden ist

Unverified/Pending bleibt weiterhin auf den eigenen Status und leere oder begrenzte States beschraenkt.

## Rechte- und Sichtbarkeitslogik

- `/admin/review` ist Betreiberbereich.
- Das Organisationsdashboard filtert auf sichtbare eigene Regionen/Organisationen.
- `public_official`-Eintraege erscheinen nur, wenn die Rolle bereits `approve_publication` hat oder Admin-Fallback greift.
- Create-Handoff-Eintraege in der zentralen Queue kommen bewusst nur aus der bestehenden persistierten Prepare-Attach-Queue.

## Bewusst offene Grenze

Rohe browserlokale Create-Handoffs aus `sessionStorage` werden nicht als global queue-faehig behauptet.

Aktuell gilt:

- global queue-faehig: persistierte Prepare-Attach-Drafts
- nicht global queue-faehig: rohe browserlokale Handoffs ohne Serverpersistenz

Dafuer wurde Follow-up `CREATE-HANDOFF-QUEUE-PERSISTENCE-01` in `OpenTasks.md` angelegt.

## Geaenderte Dateien

- `features/reviewQueue.ts`
- `features/dossier/server/studioPersistence.ts`
- `features/region/organizationDashboard.ts`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/organization-dashboard.readmodel.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

Ergebnis:

- Tests gruen
- Typecheck gruen
- Lint gruen
- Build gruen

Bekannte Restwarnung:

- Mongo-SRV-Warnungen bei `Collecting page data` bleiben in dieser Umgebung sichtbar, beenden den Build aber nicht.
