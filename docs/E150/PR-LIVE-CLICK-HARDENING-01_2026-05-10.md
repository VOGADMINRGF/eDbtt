# PR-LIVE-CLICK-HARDENING-01

Stand: 2026-05-10

## Ziel

Zentrale oeffentliche Einstiege und Conversion-Pfade duerfen keine Placeholder- oder Sackgassen-CTAs enthalten. Header, Mobile-Navigation und Pricing-/Institutionen-Handoffs muessen auf echte Routen zeigen und kontraktisch abgesichert sein.

## Umsetzung

- Neuer Contract [live-click-hardening.contract.test.ts](/Users/RF/Arbeitsmappe/edebatte-org/apps/web/tests/live-click-hardening.contract.test.ts)
  - prueft `SiteHeader` und `MobileAppShellChrome` auf fehlende `href="#"`-Links
  - prueft, dass zentrale Ziele als echte `page.tsx`-Routen vorhanden sind
  - verifiziert klickbare Handoffs auf `/pricing` und `/pricing/institutionen`
- Bestehende Routen-/CTA-Contracts fuer Pricing bleiben weiterhin aktiv, der neue Test zieht den Quercheck fuer Live-Go und Mobile-Navigation zusammen

## Gepruefte zentrale Ziele

- `/start`
- `/themen`
- `/swipes`
- `/community/contributions`
- `/howtoworks/edebatte`
- `/pricing`
- `/pricing/institutionen`
- `/stream`
- `/account`
- `/create`
- `/order`
- `/vormerken`
- `/kontakt`

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web exec vitest run tests/live-click-hardening.contract.test.ts`

