# CONTENT-PUBLISH-PREVIEW-01

Stand: 2026-05-20
Scope: bewusster letzter Publish-Preview-Schritt auf dem bestehenden Content-Release-Workbench-Layer

## Ziel

Bestehende reviewpflichtige Dossier- und Anlassraum-Arbeitsstaende sollten nicht automatisch veroeffentlicht werden, aber berechtigte Nutzer muessen sie bewusst sichtbar machen, oeffentlich verlinken, teilen, widerrufen und archivieren koennen.

## Umsetzung

- `features/contentReleaseWorkbench.ts` fuehrt jetzt einen expliziten Publish-Preview-Vertrag mit `ContentPublishPreview`, `ContentPublishStatus`, `ContentPublishAction`, `ContentPublishAuditEvent` und `PublicContentLink`.
- Dieselbe Workbench-Runtime erweitert die bestehenden Aktionen um bewusste Sichtbarkeitsfolgen:
  - `preparePublishPreview(...)`
  - `makeContentVisible(...)`
  - `archiveVisibleContent(...)`
  - `revokeVisibility(...)`
  - `getPublicContentLink(...)`
- `public_official` wird weiterhin nicht ueber diesen Pfad vergeben. Der Status bleibt ausschließlich dem bestehenden Official-Release-Pfad vorbehalten.
- Public URL, Share-Link und QR-Link erscheinen erst nach sichtbarem Status.
- Jede Sichtbarkeitsaenderung erzeugt Audit-Events.
- Archivierung bleibt revokabel und loescht keine Inhalte hart.

## UI-Flaechen

- `/admin/review`
  - Vorschau ansehen
  - Sichtbar machen
  - Veroeffentlichen vorbereiten
  - Sichtbarkeit zuruecknehmen
  - Archivieren
  - Oeffentliche URL / Share-Link / QR-Link erst bei sichtbarem Status
- `/account/organization/dashboard`
  - Zaehler fuer sichtbare, teilbare und archivierte Inhalte
  - Block `Veroeffentlichbare Inhalte`
  - naechste Schritte `Veroeffentlichung pruefen` und `Oeffentlichen Link teilen`

## Guardrails

- kein Auto-Publish
- kein automatisches `public_official`
- kein Social Publishing
- keine automatische amtliche Antwort
- keine automatische Dossier-/Anlassraum-Finalisierung
- Organisationsscope aus `ORG-SCOPE-ISOLATION-01` bleibt aktiv

## Validation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/content-release-workbench.test.ts tests/admin-review.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm --filter @vog/web build`

## Offene Folgepunkte

- spaetere `topic_page`-Finalisierung nur auf bestehender oeffentlicher Route, falls ein eigener produktiver Zielpfad benoetigt wird
- tiefere Factcheck-/Publish-Paritaet in derselben Queue bleibt separater Folgepfad
- Social Publishing bleibt weiterhin bewusst separat
