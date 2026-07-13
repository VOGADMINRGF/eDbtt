# V3 Route Inventory Legacy Path Hardening 2026-07-13

## Scope

- `V3-ROUTE-INVENTORY-LEGACY-PATH-HARDENING-01`
- Cluster: Route Inventory / Public Navigation / Legacy-Fallback-Pfade

## Umsetzung

- Eine gemeinsame Routeninventur wurde unter `features/routes/routeInventoryContract.ts` eingefuehrt und beschreibt fuer aktive Public-, Auth- und Admin-Pfade jeweils `canonicalPath`, Audience, Lifecycle und Produktnotiz.
- Die zentrale Alias-Wahrheit markiert `/order` als kanonischen Paket- und Startpfad, `/vormerken` als erreichbaren Legacy-/Fallback-/Info-Pfad und behandelt `/mitglied-werden`, `/beitritt` sowie `/anlassraum` als explizite Alias-/Redirect-Pfade statt als zweite Hauptwelt.
- `apps/web/src/features/wrapper/productSurfaceLayoutContract.ts`, `apps/web/src/features/wrapper/mvpSurfaceContract.ts` und `apps/wrapper-android/src/mvpSurfacePolicy.ts` lesen dieselbe Pfadwahrheit, damit Wrapper-, Mobile- und Surface-Contracts `/order` nicht mehr wie den alten `/vormerken`-Funnel behandeln.
- Die bestehenden Legacy-Seiten `/mitglied-werden` und `/beitritt` behalten ihre Redirect-Funktion, rahmen sich aber im Fallback sichtbar als Bestands-/Legacy-Pfade statt als aktuelle Conversion-Strecke.
- `apps/web/src/features/access/productionEntryContract.ts` erkennt `/beitritt` jetzt wie die benachbarten Initiativpfade, ohne neue Produktlogik, neue Redirects oder neue Runtime einzufuehren.

## Gepruefte aktive Surfaces

- `/order`
  Bleibt der kanonische direkte Paket- und Startpfad und wird in Shared-Contracts nicht mehr unter `/vormerken` einsortiert.
- `/vormerken`
  Bleibt oeffentlich erreichbar, aber nur als Legacy-/Fallback-/Info-Surface und nicht als primaerer Funnel.
- `/pricing` und `/pricing/institutionen`
  Nutzen weiter den direkten Paketpfad; die institutionelle CTA-Wahrheit haengt nicht mehr an alter `Pilot vormerken`-Semantik.
- `/mitglied-werden` und `/beitritt`
  Bleiben als Legacy-Weiterleitungen erhalten, ohne neue Produktlogik oder Aufwertung zu einem aktuellen Hauptpfad.
- Wrapper-/Mobile-Surfaces
  Web-Wrapper und Android-MVP-Policy unterscheiden jetzt denselben kanonischen `/order`-Pfad und dieselben Alias-Pfade.
- Admin-Einstiege
  `/admin`, `/admin/review`, `/admin/editorial/queue`, `/admin/feeds` und `/admin/pricing/orders` sind im Routeninventar als Operator-Flaechen dokumentiert und damit explizit kein Public Funnel.

## Doppelstrukturen reduziert

- Alias-, Legacy- und Produktpfad-Wahrheiten leben nicht mehr getrennt in Wrapper-, Mobile- und Pricing-nahen Contracts, sondern in `routeInventoryContract.ts`.
- `productSurfaceLayoutContract.ts` hat keine Sonderbehandlung mehr, die `/order` stillschweigend als `/vormerken` einordnet.
- Route-nahe Redirect-Fallbacks lesen ihre Ziele aus derselben Quelle statt lokale String-Duplikate zu pflegen.

## Produktwahrheit

- `/order` bleibt der kanonische direkte Paket- und Startpfad.
- `/vormerken` bleibt Legacy-/Fallback-/Info-Pfad und nie Primaerfunnel.
- `/mitglied-werden` und `/beitritt` bleiben Bestands-/Alias-Pfade zum kanonischen Membership-/Pricing-Kontext.
- `/create` und `/register` bleiben produktive direkte Einstiege und werden durch diesen Slice nicht entwertet.
- Admin-Routen bleiben Operator-/Review-Flaechen und keine oeffentlichen Funnel.
- Es gibt weiterhin keine neue Produktlogik, keine stillen Redirects, keine Routeloeschung, kein Auto-Publish und keine Runtime-Aktivierung.

## Legacy- und Fallback-Pfade

- `/vormerken` bleibt bewusst erreichbar, weil der Pfad weiter als Legacy-/Fallback-Surface gebraucht werden kann.
- `/mitglied-werden` und `/beitritt` bleiben bewusst als Redirect-Aliasse bestehen; sie wurden nur expliziter als Bestandslinks markiert.
- `/anlassraum` bleibt als oeffentlicher Alias zu `/runden` inventarisiert, ohne eine zweite kanonische Anlassraum-Route zu erzeugen.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/route-inventory-legacy-path.contract.test.ts tests/product-surface-shell.contract.test.tsx tests/wrapper-mvp-surface-contract.test.ts tests/mobile-app-shell-contract.test.ts tests/wrapper-android-mvp-policy.test.ts tests/pricing-institutionen-b2b-partner.contract.test.ts tests/auth-registration-flow.contract.test.ts tests/register-flow-bridge.test.ts tests/order-entry.contract.test.ts tests/vormerken-page.contract.test.tsx tests/mitglied-werden.redirect.test.ts tests/beitritt.redirect.test.ts tests/pricing-page.contract.test.ts tests/pricing-main-page-simplified-decision-flow.contract.test.ts tests/pricing-vormerken-source-of-truth.contract.test.tsx tests/no-primary-vormerken-links-from-themenradar.contract.test.ts tests/themenradar-membership-entry.contract.test.ts tests/v1-production-ready-public-routes.contract.test.tsx`
  Ergebnis: `18` Testdateien gruen, `62/62` Tests gruen.
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
  Lokaler `typecheck` bleibt nur auf der bekannten `.next/types/**/*.ts`-Drift (`TS6053`) haengen und wird deshalb nicht als Slice-Regression gewertet, solange Build, Lint und die relevante Cluster-Suite gruen sind.

## Offene Punkte

- `V3-MEMBERSHIP-ENTITLEMENT-PACKAGE-ACTIVATION-HARDENING-01` bleibt der naechste unabhaengige Produktcluster nach Merge, weil dort die sichtbare Aktivierungs-, Entitlement- und Paketstart-Wahrheit ueber `/order`, Account-, Organization- und Admin-Surfaces harmonisiert werden soll.
- Keine Routen wurden entfernt; wenn spaeter ein echter Route-Remove oder Redirect-Wechsel noetig wird, braucht das weiterhin belastbare SSOT- und Testgrundlage.
