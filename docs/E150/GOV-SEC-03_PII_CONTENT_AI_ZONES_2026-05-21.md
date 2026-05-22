# GOV-SEC-03

Stand: 2026-05-22  
Slice: `GOV-SEC-03_PII_CONTENT_AI_ZONES_2026-05-21`

## Ziel

PII-, Content- und AI-Zonen fuer den generischen Organisations-/Regionen-Rollout maschinenlesbar klassifizieren und gegen die produktrelevanten Guardrails regressionssicher verankern.

Nicht-Ziele dieses Refreshs:
- kein neues Auth-System
- kein neues Login
- kein Payment
- kein Social Publishing
- kein Auto-Publish
- kein automatisches `public_official`
- keine neue AI-Logik
- keine neue Produktparallelwelt

## Umsetzung

Neu ist eine typed Inventur in `apps/web/src/features/security/contentZoneInventory.ts`.

Der Readmodel-Pfad klassifiziert fuer den aktuellen Rollout:
- `Create`
- `Save/Handoff`
- `Review Queue`
- `Source Results`
- `Content Release`
- `Topic Pages`
- `Dossier`
- `Anlassraum/Runden`
- `Public URL/QR/Share`
- `Unified Audit Trail`

Typisierte Achsen:
- `PIIZone`
- `ContentRiskZone`
- `AIProcessingZone`
- `HighImpactAuditRequirement`

Pflichtklassifikationen sind im Inventar explizit abgebildet:
- `public_content`
- `review_only`
- `organization_private`
- `operator_only`
- `pii_possible`
- `source_material`
- `ai_processing_allowed`
- `ai_processing_restricted`
- `high_impact_requires_audit`

## Guardrails

Die Inventur verankert und testet fuer die betroffenen Surfaces:
- keine automatische Veroeffentlichung
- keine automatische Amtlichkeit
- keine stille DeepSearch-/Research-Kosten
- keine oeffentliche PII-Leakage
- `review_only` bleibt intern
- Public URL/QR/Share nur bei sichtbarem Status
- AI-Ausgaben bleiben review-first
- `public_official` bleibt eigener Official-Release-Pfad

## Audit / Trace

High-impact-Aktionen bleiben als auditpflichtig markiert. Das Inventar referenziert die bestehende Unified-Audit-Readside und deckt insbesondere diese Ketten ab:
- Review Operations
- Content Release
- Visibility made public / revoked
- Content archived
- Source Results
- Create-Handoffs
- Official Release

## Testabdeckung

Neue Regression:
- `apps/web/tests/content-zone-inventory.test.ts`

Der Test prueft:
- Inventar vorhanden und versioniert
- alle geforderten Surfaces sind enthalten
- PII-/Content-/AI-Klassen sind vorhanden
- Public-/Review-/PII-/AI-Guardrails sind fuer Hochrisiko-Surfaces aktiv
- Quellenanker zeigen auf echte Runtime-/UI-/Route-Pfade und nicht auf Doku-Fiktionen

Mitvalidierte angrenzende Guardrails:
- `apps/web/tests/route-security-inventory.test.ts`
- `apps/web/tests/dossier-public-route.contract.test.tsx`
- `apps/web/tests/topic-public-page.contract.test.tsx`
- `apps/web/tests/runden-qr-participation-language.contract.test.tsx`
- `apps/web/tests/request-scope-context.test.ts`
- `apps/web/tests/create-mode.save.route.test.ts`
- `apps/web/tests/create-handoff.persistence.route.test.ts`

## Validierung

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run \
  tests/content-zone-inventory.test.ts \
  tests/route-security-inventory.test.ts \
  tests/dossier-public-route.contract.test.tsx \
  tests/topic-public-page.contract.test.tsx \
  tests/runden-qr-participation-language.contract.test.tsx \
  tests/request-scope-context.test.ts \
  tests/create-mode.save.route.test.ts \
  tests/create-handoff.persistence.route.test.ts
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm --filter @vog/web build
```

## Ergebnis

`GOV-SEC-03` ist fuer den aktuellen generischen Organisations-/Regionen-Rollout operationalisiert.

Das bedeutet nicht `production_ready`. Offen bleiben weiterhin vor allem:
- vollstaendige Admin-Gesamthaertung
- breitere externe Provider-/Membership-Aufloesung
- restliche Self-Service-Grenzen ausserhalb des jetzt inventarisierten Zonenmodells
