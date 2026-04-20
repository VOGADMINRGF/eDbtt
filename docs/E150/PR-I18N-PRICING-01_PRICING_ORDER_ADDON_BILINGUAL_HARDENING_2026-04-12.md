# PR-I18N-PRICING-01 – Pricing/Order/Add-on Bilingual Hardening (2026-04-12)

## Ziel
Pricing-nahe Produktpfade (`/pricing`, `/vormerken`, `/pricing/institutionen`) inkl. Add-ons, Reifestands-Badges, CTA-Logik und Order-Followups in DE/EN semantisch deckungsgleich absichern.

## Entscheidungsrahmen
- Keine neue Pricing-Logik.
- Keine sprachspezifische Parallelarchitektur.
- Eine gemeinsame Pricing-SSOT mit Locale-getriebener Darstellung.
- EN darf nicht mehr versprechen als DE.

## Umsetzung

### 1) SSOT-Lokalisierung in der Pricing-Domain
- Locale-Contract eingeführt (`de`/`en`) und normalisiert.
- EN-Planwelt ergänzt.
- Journey-/Segment-/TargetGroup-/Content-/Institutional-/Followup-Domains locale-faehig gemacht.
- Add-on-Maturity-Mapping und CTA-Reife bleiben logisch identisch, nur sprachlich lokalisiert.

### 2) Pages und Komponenten auf locale-basierte Getter umgestellt
- `/pricing`, `/vormerken`, `/pricing/institutionen` lesen `lang` und rendern über zentrale Getter.
- Segmentfokus (`?segment=`) bleibt stabil, Links halten `lang=en` konsistent durch.
- Add-on-Karten und Badges nutzen die gleiche locale-faehige Reife-/CTA-Mappinglogik.
- Orderflow (`/vormerken`) sendet `locale` mit, Followup-UX bleibt semantisch konsistent.

### 3) Order-/Followup-Texte
- `createPreorderLead` erzeugt locale-spezifische public summary notes.
- Confirmation-Mail-Template wurde DE/EN-faehig erweitert (ohne neue Mail-Engine).

## Testabdeckung
Neu:
- `apps/web/tests/pricing-i18n.contract.test.ts`
- `apps/web/tests/vormerken-i18n.contract.test.tsx`
- `apps/web/tests/pricing-institutionen-i18n.contract.test.ts`
- `apps/web/tests/addon-i18n.contract.test.ts`
- `apps/web/tests/pricing-order-followup-i18n.contract.test.ts`

Ergaenzend verifiziert:
- bestehende Pricing-/Institutionen-/Vormerken-/Followup-Contract-Tests weiterhin gruen.
- Typecheck (`apps/web`) gruen.

## Produktgarantie nach Slice
- Kern-Pricingreisen sind DE/EN konsistent nutzbar.
- Add-on-Reifestand und CTA-Sprache sind in beiden Sprachen deckungsgleich.
- Keine internen Tier-/Reifestand-Keys user-facing.
- Segment- und Add-on-Query-Fokus bleibt funktional stabil.

## Out of scope (bewusst)
- Dritte Sprache.
- Neue Billing-/Booking-Engine.
- Neue Pricing-/Order-Fachlogik.
