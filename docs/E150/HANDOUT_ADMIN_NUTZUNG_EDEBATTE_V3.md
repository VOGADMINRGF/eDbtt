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
- V3 Automatisierung als review-first Vorbereitung

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

### 10. Fehlerfaelle / Rollback

- Fehlerbilder
- manueller Rollback-Pfad
- offene Observability-/Alerting-Abhaengigkeiten
