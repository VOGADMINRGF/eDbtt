# CREATE-HANDOFF-QUEUE-PERSISTENCE-01

Stand: 2026-05-19

## Ziel

Rohe `/create`-Handoffs sollten nicht nur browserlokal in `sessionStorage` liegen, sondern als
persistente, reviewpflichtige Arbeitsstaende in der zentralen Review Queue erscheinen und spaeter
wiederaufnehmbar sein.

## Umsetzung

- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  - serverseitiger Review-Store fuer rohe Create-Handoffs
  - Region-/Organisation-/Dossier-/Anlassraum-Kontext wird auf bestehende Runtimes aufgeloest
- `apps/web/src/app/api/create/handoffs/route.ts`
  - persistiert den Handoff vor dem Redirect aus `/create`
- `apps/web/src/app/api/create/handoffs/[handoffId]/route.ts`
  - laedt einen persistierten Handoff spaeter wieder fuer `resume=create_handoff`
- `apps/web/src/app/create/CreateClient.tsx`
  - speichert Handoffs vor dem Weiterleiten serverseitig
  - kann persistente Handoffs spaeter wieder in den lokalen Arbeitsstand zurueckladen
- `features/reviewQueue.ts`
  - fuehrt rohe persistierte Create-Handoffs zentral neben bestehenden Review-Domains
- `features/region/organizationDashboard.ts`
  - Organisationen sehen dieselben Create-Handoffs, wenn Region/Organisation passt
- `features/contentReleaseWorkbench.ts`
  - dieselbe Review-to-Publish-Workbench arbeitet jetzt auch fuer persistierte Create-Handoffs

## Guardrails

- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische amtliche Antwort
- keine automatische Dossier-/Anlassraum-Finalisierung
- keine neue AI-/Source-Adapter-Logik
- keine DeepSearch-Automatikkosten

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-handoff.persistence.route.test.ts tests/review-queue.readmodel.test.ts tests/organization-dashboard.readmodel.test.ts tests/content-release-workbench.test.ts tests/admin-review.page.test.tsx`

## Ergebnis

`/create` erzeugt jetzt einen echten serverseitigen reviewpflichtigen Arbeitsstand. Dieser taucht
in `/admin/review` und bei passendem Scope in `/account/organization/dashboard` auf, kann spaeter
wieder geladen werden und laesst sich ueber dieselbe Content-Release-Workbench bewusst als
Dossier- oder Anlassraum-Arbeitsstand weiterfuehren.
