# GO-LIVE-PUBLIC-COMMS-01

Stand: 2026-05-25

## Ziel

Die oeffentliche Website-Sprache erklaert eDebatte jetzt konsistent als `production_ready-v1` im definierten Produktmodus.

Dieser Slice baut keine neue Produktlogik. Er harmonisiert oeffentliche Copy, CTAs und Claims auf den realen Go-live-Zustand.

## Gepruefte Flaechen

- Startseite / Home
- `/pricing`
- `/pricing/institutionen`
- FAQ
- `So funktioniert's`
- Header- und Einstiegs-CTAs

## Oeffentliche V1-Kernbotschaft

- eDebatte ist eine review-first Informations- und Beteiligungsinfrastruktur.
- Themen, Hinweise, Material, Quellen, Factchecks und Distribution bleiben geprueft.
- Organisationen erhalten produktive Rechte erst nach Betreiber-Verifikation sowie manueller Zugangs- und Vertragsfreigabe.
- Factcheck und Siegel werden nicht automatisch vergeben.
- Social-/Distribution-Pfade bleiben gepruefte Entwuerfe oder bewusst manuell veroeffentlichte Schritte.
- Partner-, Medien- und Funding-Hinweise sind transparent, beeinflussen aber weder Quellengewichtung noch Ergebnisse oder Siegelentscheidungen.

## Claims-Audit

Entfernt oder klarer gerahmt wurden oeffentliche Formulierungen, die sonst zu starke Automations- oder Integrationszusagen implizieren koennten:

- keine Suggestion von Auto-Publish
- keine Suggestion von automatischer Amtlichkeit
- keine Suggestion von automatischem Factcheck-Siegel
- keine Suggestion von Vollcrawler-, Voll-PDF- oder Voll-YouTube-Automation
- keine Suggestion von externer Checkout-Integration
- keine Suggestion von externer Registerintegration
- keine Suggestion von externer CRM-/Accounting-Integration

## CTA-Logik

Die oeffentlichen Einstiege bleiben produktnah und ehrlich:

- `Thema pruefen`
- `Hinweis geben`
- `Professionell nutzen`
- bestehende Anfrage- und Freischaltungspfade statt Sofort-Vollzugriff

Nicht verwendet werden Vollautomations-Claims wie automatische Veroeffentlichung, automatisches Siegel, vollautomatisches Crawling oder sofortige Amtlichkeit.

## Trust- und Guardrail-Sprache

Sichtbar verankert:

- review-first
- auditierbar
- keine Datenverkaeufe
- keine versteckten AI-Kosten
- transparente Partner-/Funding-Hinweise ohne Einfluss auf Ergebnisse

## Validierung

```bash
pnpm -C apps/web exec vitest run tests/pricing-institutionen-b2g-vergabe.contract.test.ts tests/pricing-communities-entry.contract.test.ts tests/header-mobile-navigation.contract.test.ts tests/e150-journey-routing.contract.test.ts tests/faq-product-narrative.contract.test.ts tests/start-shared-create-composer.contract.test.tsx tests/pricing-page.contract.test.ts
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
rm -rf apps/web/.next
pnpm --filter @vog/web build
pnpm run release:validate:production
```

## Ergebnis

Die Public Go-live Copy ist jetzt konsistent mit `production_ready-v1` im definierten Produktmodus.
