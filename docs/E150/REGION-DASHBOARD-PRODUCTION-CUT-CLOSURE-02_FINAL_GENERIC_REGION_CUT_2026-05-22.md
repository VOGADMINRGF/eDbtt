# REGION-DASHBOARD-PRODUCTION-CUT-CLOSURE-02

Stand: 2026-05-22
Status: done

## Ziel

Den offenen Klammer-Task `REGION-DASHBOARD-PRODUCTION-CUT` gegen die inzwischen abgeschlossenen
Scope-, Persistenz-, Review-, Visibility-, Auth-, Security- und Admin-Slices erneut pruefen und
nur dann auf `done` setzen, wenn die Parent-Akzeptanzkriterien fuer den generischen
Organisations-/Regionen-Rollout wirklich geschlossen sind.

## Gepruefte Parent-Restpunkte

1. AllowedActions-Paritaet ueber Region-Cockpit, Organisationsdashboard, Admin-Review und Content Release.
2. Region-/Org-Isolation ohne stille Reinickendorf-Sonderlogik.
3. Betreiber-Modus sichtbar und von organisationslokaler Sicht getrennt.
4. Pending/Unverified bleibt auf sichere naechste Schritte begrenzt.
5. Review-to-Publish bleibt review-first, ohne Auto-Publish und ohne automatisches `public_official`.

## Ergebnis

Der Parent-Task ist jetzt geschlossen.

### Was den Abschluss traegt

- `ORG-SCOPE-ISOLATION-01`
  - zentrale `OrganizationScopeContext`-, `RegionScopeContext`- und `ReviewQueueScopeContext`-Entscheidungen sind auf die produktiven Org-/Region-/Review-Pfade ausgerollt.
- `NON-ADMIN-MODERATION-PERMISSIONS-01`
  - verifizierte Organisationen koennen ihre eigenen Review-Aufgaben im Organisationsbereich bearbeiten, ohne globale Betreiberrechte.
- `AUTH-INTEGRATION-HARDENING-01` + `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`
  - RequestScope wird zentral aus Session plus Runtime-Adaptern aufgeloest; kein stiller Betreiber-Fallback in org-scoped Routen.
- `DB-BACKED-REVIEW-OPERATIONS-01` + `DB-BACKED-CONTENT-RELEASE-01`
  - Review-Operationen sowie Visibility-/Archive-Zustaende sind persistent-primary und auditierbar.
- `AUDIT-READSIDE-UNIFICATION-01`
  - derselbe Verlauf ist im Betreiber- und Organisationsblick scope-sicher sichtbar.
- `PR-CREATE-WORKFLOW-LIVE-QA-01`
  - `/create` fuehrt reviewfaehig in dieselbe Kette statt in einen losen Demo-Pfad.
- `GOV-SEC-02` + `GOV-SEC-03`
  - Route-/Auth-/AI- sowie PII-/Content-/AI-Zonen sind inventarisiert und guardrail-seitig dokumentiert.
- `PUBLIC-ROUTES-HARDENING-01`
  - Topic-/Dossier-/Anlassraum-Lesepfade zeigen keine internen Reviewdaten und keine falschen Public-Links.
- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`
  - die verbleibenden Betreiberhubs zeigen ehrliche Loading-/Empty-States, sichtbaren Betreiberkontext und keine `href="#"`-Sackgassen mehr.

## Nicht als `production_ready` missverstehen

Dieser Abschluss bedeutet:

- `REGION-DASHBOARD-PRODUCTION-CUT` ist als generischer, review-first Parent-Slice geschlossen.
- Der Organisations-/Regionen-Pfad ist damit weiter `production_candidate`, nicht `production_ready`.

Weiter bewusst ausserhalb dieses Parent-Slices:

- breitere externe Membership-/Directory-Aufloesung jenseits des lokalen Runtime-Stores
- Self-Provisionierung und Checkout-/Billing-Automatisierung
- breitere produktive Quellenabdeckung ueber explizit verbundene Einzel-URLs hinaus

## Zusaetzliche Closure-Regressionen

- AllowedActions-Paritaet zwischen `buildOrganizationDashboardReadModel(...)` und
  `getRegionalAdminCockpitReadModel(...)` fuer verifizierte Org-Scope-Rollen
- sichtbarer Betreiber-Modus im Organisationsblick bei globalem Admin-Kontext

## Verifikation

- `pnpm -C apps/web exec vitest run tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/admin-region-page.render.test.tsx tests/review-queue.readmodel.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/admin-review.page.test.tsx tests/content-release-workbench.test.ts tests/topic-public-page.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/request-scope-context.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

## Betroffene Dateien in diesem Closure-Slice

- `apps/web/tests/organization-dashboard.readmodel.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/REGION-DASHBOARD-PRODUCTION-CUT-CLOSURE-02_FINAL_GENERIC_REGION_CUT_2026-05-22.md`
