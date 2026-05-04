# PR-UX-PUBLIC-FUNNEL-01 – Evidence

Stand: 2026-05-03
Status: done

## Scope
- Home/Public-Funnel-Wording und CTA-Hierarchie.
- Mobile Header-Navigation inkl. Pricing-/Professional-Erreichbarkeit.
- Register-Default-Redirect von `/account` auf Swipe-Einstieg (`/swipes?welcome=1`) bei weiterhin priorisiertem internem `next`.

## Umsetzung
- Home-Clarity und CTA-Neugewichtung in `apps/web/src/app/start/LandingStart.tsx`.
- Mobile-/Header-Menü neu geordnet in `apps/web/src/app/(components)/SiteHeader.tsx`.
- Post-Registration-Default in `apps/web/src/features/auth/roleExperienceContract.ts` auf Swipe-Einstieg gesetzt.
- Verifikationsabschluss leitet standardmäßig zu `next`/`/swipes?welcome=1`; optionaler Paketpfad bleibt als Link (`apps/web/src/app/register/identity/page.tsx`).
- Welcome-Hinweis auf Swipe-Einstieg in `apps/web/src/app/swipes/page.tsx` + `apps/web/src/features/surfaces/swipes/SwipesSurface.tsx` + `apps/web/src/app/swipes/SwipesClient.tsx`.

## Tests
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/header-mobile-navigation.contract.test.ts`
- `apps/web/tests/auth-registration-flow.contract.test.ts`
- `apps/web/tests/role-routing.contract.test.ts`
- `apps/web/tests/e2e-critical-journeys.test.ts`

## Guardrails
- Keine Parteien-Positionierung.
- Actor-Trust-Slice `PR-UX-ACTOR-TRUST-01` bleibt unverändert und wird nicht dupliziert.
- `next`/return-Ziele bleiben intern/sanitized über bestehenden Redirect-Contract.
