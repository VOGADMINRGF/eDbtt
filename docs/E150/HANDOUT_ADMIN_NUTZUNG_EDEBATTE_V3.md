# HANDOUT Admin Nutzung eDebatte V3

Status: Draft / Zielbild

Hinweis:

- Dieses Dokument ist noch keine finale Nutzungsanleitung.
- Es muss spaeter mit dem tatsaechlichen Admin Dashboard, den echten
  V3-Flows und den finalen Guardrails abgeglichen werden.
- Es fuehrt keine neue Produktlogik ein.

## Geplante Struktur

### 1. Gesamtlogik V1 / V2 / V3

- V1 Produktivitaet
- V2 Plattformreife
- V3 gefuehrte Betriebs- und Automatisierungsreife

### 2. Admin Review starten

- Einstieg ueber `/admin` und `/admin/review`
- offene Review-Pfade lesen

### 3. Public Submissions pruefen

- Community Source Review Intake
- Moderationssignale und Guardrails

### 4. Moderation Queue lesen

- Queue, SLA/Aging, Owner State, Eskalation
- keine Wahrheit und keine automatische Verifikation

### 5. Dossier-, Anlassraum- und Beteiligungsraum-Pfade

- Dossier Publish Workflow
- Anlassraum Activation/Publish Workflow
- Beteiligungsraum Publish/Public Route

### 6. Automation Suggestions

- Vorschlaege lesen
- Review-first Freigaben
- was nie automatisch ausgefuehrt werden darf

### 7. DeepSearch / Cost Gate

- Freigeben oder ablehnen
- Audit und sichtbare Kostenpfade

### 8. Guardrail Warnings

- Warnungen lesen
- Block / Reject / Override

### 9. Production Validation

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

### 10. Voxy Guidance

- Voxy als Guide, Moderator und Copilot
- Guidance auf Start, Create, Review und Public Routes

### 11. Pricing / Credits / Limits

- Plaene, Pakete, Credits und Limits lesen
- keine hidden costs
- Cost Gates fuer spaetere V3-Pfade

### 12. Roles / Access / Entitlements

- Rollen, Rechte und Scope lesen
- Entitlements und Billing-Status verstehen

### 13. Notifications / Alerts

- Dashboard, In-App, Email
- wann Admin benachrichtigt werden muss

### 14. Incident / Recovery / Maintenance

- Fehlerstatus lesen
- Retry, Block, Reject, Wartungsmodus, Rollback

### 15. Manual Admin Ops

- manuelle Erstellung und Korrektur
- Auditpflicht und Override-Grenzen

### 16. Image / Assets / Outputs

- Voxy-Assets, Dossier-Cover, Share-/Social-Assets
- Review-first Asset-Freigabe

### 17. Templates / Output Standards

- Default-Templates
- Export-/PDF-/Visual-Zielbilder

### 18. QR / Sharing

- QR-, Share- und Public-Entry-Pfade
- Slug- und Public-Safety-Pruefung

### 19. Tests / Regression

- vorhandene Tests
- fehlende Tests
- E2E-, Smoke- und Guardrail-Sichten

### 20. Prompt-basierte Wartung

- gefuehrte Prompt-Eingaben im Review- und Rechtekontext
- keine stillen oeffentlichen Entscheidungen

### 21. Fehlerbehebung

- Fehlerbilder
- manueller Rollback-Pfad
- offene Observability-/Alerting-Abhaengigkeiten
- Diagnose und Support-Lesart
