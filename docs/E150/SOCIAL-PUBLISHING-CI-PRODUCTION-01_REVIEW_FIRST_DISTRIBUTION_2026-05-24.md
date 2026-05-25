# SOCIAL-PUBLISHING-CI-PRODUCTION-01

Stand: 2026-05-24  
Status: umgesetzt  
Issue: #216

## Ziel

Social Publishing / CI-Verteilung gilt fuer v1 als `production_ready`, wenn aus freigegebenen eDebatte-Inhalten kanalweise Verteilentwuerfe, Asset-Referenzen und manuelle Published-Marker entstehen koennen, die review-first, auditierbar, org-scoped und statusgefuehrt bleiben.

## Produktentscheidung v1

- Kein Auto-Publish
- Kein automatisches Scheduling
- Kein externes API-Posting
- Kein automatisches `public_official`
- Keine automatische `publication_approved`-Ableitung

V1-Verteilmodus:

- kanalweise Draft-Erstellung
- Review-/Freigabestatus
- manuelles `published_manual`
- persistenter Audit-Trail

## Umgesetzte Runtime-Haertung

### Domain / Status

- Persistente `SocialDistributionPost`-Runtime eingefuehrt
- Kanaele typisiert:
  - `website_update`
  - `newsletter_draft`
  - `embed_snippet`
  - `qr_asset`
  - `linkedin_draft`
  - `x_draft`
  - `mastodon_draft`
  - `instagram_asset`
  - `press_note`
- Status typisiert:
  - `draft`
  - `review_required`
  - `approved`
  - `scheduled`
  - `published_manual`
  - `failed`
  - `revoked`
  - `archived`

### Rechte / Gates

- Produktive Distribution bleibt org-scoped
- Org A sieht Org B nicht
- Produktive Drafts verlangen:
  - verifizierte Membership mit Schreibrechten
  - passende Entitlements
  - aktive operator-verifizierte Vertrags-/Billing-Lage
  - freigegebenen Quellkontext
- `internal_review` / `review_only` blockieren produktive Distribution

### Review / Audit

- Review Queue traegt Distribution-Kontext
- Organisationsdashboard zeigt ehrliche Distribution-States
- Audit-Events werden fuer mindestens folgende Aktionen geschrieben:
  - `create_draft`
  - `approve`
  - `schedule`
  - `mark_published`
  - `fail`
  - `revoke`
  - `archive`

### Safety / CI

- Kein Draft markiert Inhalte als geprueft, wenn Factcheck/Seal nicht real freigegeben ist
- Keine personenbezogenen Rohdaten in oeffentlichen Distribution-Readmodels
- Funding-/Partner-Hinweise werden nicht als Ergebnisbeweis gerahmt
- Klare Trennung zwischen Entwurf, Freigabe und manueller Veroeffentlichung

## Geaenderte Flaechen

- Dossier Studio / Output Engine
- `/api/dossier/[id]/studio/workspace`
- `/admin/review`
- `/account/organization/dashboard`
- Review Queue Readmodel

## Validierung

Erfolgreich ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/output-engine-social-carousel.test.ts tests/dossier-output-studio.page.contract.test.ts tests/admin-review.page.test.tsx tests/review-queue.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/dossier-public-route.contract.test.tsx tests/topic-public-page.contract.test.tsx tests/runden-public-sharing-guide.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/dossier-studio-workspace.route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`
- `pnpm run release:validate:production`

## Ergebnis

`Social Publishing / Distribution` ist fuer v1 jetzt begrenzt `production_ready`, wenn review-first Draft-Erstellung, org-scoped Freigaben, persistente Auditierung und manuelles Published-Markieren auf denselben bestehenden Studio-/Review-/Dashboard-Pfaden genutzt werden.

Optional spaeter:

- echte externe Social-API-Integrationen
- automatischer Scheduler
- automatische Bildgenerierung
- weitergehende kanalindividuelle Asset-Pipelines
