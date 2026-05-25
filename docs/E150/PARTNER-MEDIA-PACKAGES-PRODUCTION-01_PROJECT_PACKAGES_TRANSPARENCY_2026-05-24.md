# PARTNER-MEDIA-PACKAGES-PRODUCTION-01

Stand: 2026-05-25
Status: umgesetzt

## Entscheidung

Partner-, Medien-, Funding- und Projektpakete gelten fuer v1 als `production_ready`, wenn sie auf demselben persistenten und auditierbaren Betreiber-Vertragsprozess wie Billing/Contract/Provisioning beruhen und nur explizit zugewiesene Scopes aktivieren.

Nicht zulaessig fuer v1:

- keine Einflussnahme auf Quellengewichtung
- keine Einflussnahme auf Abstimmungsergebnisse
- keine Einflussnahme auf Factcheck-/Seal-Entscheidungen
- kein automatisches `public_official`
- keine automatische `publication_approved`-Rolle
- keine Betreiberrechte fuer Partner
- keine behauptete externe CRM-/Accounting-Integration

## Umgesetzte Runtime

- `PartnerProjectPackage`, `PartnerPackageType`, `PartnerPackageStatus`, `PartnerPackageScope`, `PartnerFundingDisclosure`, `PartnerReportingState` und `PartnerPackageAuditEvent` sind auf der bestehenden Pricing-/Order-Runtime typisiert.
- Die persistente Wahrheit liegt auf denselben Pricing-/Order-Records wie die operator-verifizierte Vertragslage; es wurde keine zweite Paket-Parallelwelt eingefuehrt.
- `/admin/pricing/orders` fuehrt Pakettyp, Paketstatus, Reportingstatus, Transparenzhinweise und Paket-Audit-Trail als bewusste Admin-Entscheidung.
- `/account/organization/dashboard` zeigt ehrliche Paket-, Transparenz- und Reportingzustande fuer die eigene Organisation.
- `/pricing` und `/pricing/institutionen` rahmen Projektpakete als review-first, vertraglich gebundene und transparente Leistung statt als Einfluss- oder Checkout-Versprechen.

## Guardrails

- Paketfreischaltungen aktivieren nur explizit zugewiesene Scopes.
- `cancelled`, `archived` und nicht produktionsfaehige Vertragslagen blockieren schreibende Paketnutzung.
- Partnerstatus erzeugt keine Betreiberrechte.
- Funding- oder Partnerstatus setzt weder `public_official` noch `publication_approved`.
- Transparenzhinweise bleiben getrennt von Quelle, Organisator und Betreiberrolle sichtbar.
- Dossier Studio, Social Distribution, QR-/Share-Assets und aehnliche Paketleistungen bleiben review-first und scope-gebunden.

## Validierung

- `pnpm -C apps/web exec vitest run tests/pricing-institutionen-b2g-vergabe.contract.test.ts tests/pricing-communities-entry.contract.test.ts tests/admin-pricing-orders.route.test.ts tests/admin-pricing-control-contract.test.ts tests/admin-pricing-control-readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/output-engine-social-carousel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`
- `pnpm run release:validate:production`

## Spaeter optional

- externe CRM-/Accounting-Integration
- tiefere Reporting-/Export-Automation
- breitere Self-Service-Akquise- oder Paket-Automation
