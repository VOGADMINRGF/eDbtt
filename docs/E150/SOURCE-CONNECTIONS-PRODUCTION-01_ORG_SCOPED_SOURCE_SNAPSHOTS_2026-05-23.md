# SOURCE-CONNECTIONS-PRODUCTION-01

Stand: 2026-05-23  
Issue: #210  
Production anchor: `prod-green-entitlement-provisioning-20260523-0822`  
Startpunkt: Commit `a8e0b9d` (Vercel Ready)

## Ziel

Explizite Quellen sollen im bestehenden Organisations-/Regionen-Pfad kontrolliert angebunden, leicht getestet und als reviewpflichtige Snapshots weitergeführt werden können.

Nicht-Ziele dieses Slices:

- kein automatisches Crawling-Versprechen
- kein automatischer DeepSearch- oder Research-Lauf
- kein Auto-Publish
- kein automatisches `public_official`
- kein Payment/Checkout
- keine neue Produktparallelwelt

## Umsetzung

Die bestehende `Source Connections`-Runtime wurde auf denselben Flächen produktionsnäher gehärtet:

- `/account/organization/dashboard`
- `/admin/region`
- `/api/admin/region/source-connections`
- `/api/admin/region/source-connections/[id]/test`

Neu bzw. explizit typisiert:

- `OrganizationSourceConnection`
- `SourceConnectionStatus`
- `SourceConnectionScope`
- `SourceConnectionTestResult`
- `SourceSnapshot`
- `SourceSnapshotReviewState`
- `SourceConnectionAuditEvent`

## Verbindungstypen

Produktiv sichtbar für neue Org-Anträge:

- `website_url`
- `rss_feed`
- `atom_feed`
- `document_url`
- `press_page`
- `meeting_calendar`
- `social_profile_reference`
- `manual_snapshot`

Legacy-Typen bleiben nur kompatibel auf Runtime-Ebene erhalten:

- `manual_source`
- `curated_pilot_source`
- `official_feed`
- `municipal_news`

## Status

- `draft`
- `submitted`
- `testing`
- `test_failed`
- `active_review_required`
- `active_limited`
- `paused`
- `revoked`
- `archived`

## Produktverhalten

### Org- und Entitlement-Gates

Nicht-Betreiber brauchen jetzt für produktive Quellenarbeit beides:

- verifizierte Membership
- Entitlement-Scope `source_connection`

Ohne diese Kombination gilt:

- Quellen können höchstens beantragt oder erklärt werden
- keine produktive Aktivierung
- kein Testlauf
- keine neuen Snapshots

`pending`, `unverified`, `rejected` oder `suspended` auf Organisationsseite führen daher nicht in eine aktive Verbindung.

### Leichter Testpfad

Der Dry Run bleibt bewusst leichtgewichtig:

- nur Erreichbarkeit und Format
- höchstens Single-Page-Fetch oder manueller Snapshot
- kein DeepSearch
- kein automatischer AI-Research-Lauf
- keine kostenblinde Weiterverarbeitung

### Review-first

Ein erfolgreicher Test erzeugt nur:

- einen reviewpflichtigen Snapshot
- mögliche Aussagen
- Themencluster-/Dossier-/Anlassraum-Hinweise
- Audit-Events

Er erzeugt nie automatisch:

- Topic-/Dossier-Mutationen
- Veröffentlichung
- `public_official`
- Moderations- oder Publish-Rechte

## UI-Lesart

### Organisationsdashboard

`/account/organization/dashboard` zeigt jetzt ehrlich:

- Quellenzugang nicht freigeschaltet
- Prüfung erforderlich
- Quelle beantragt
- Quelle wird getestet
- Test fehlgeschlagen
- Quelle aktiv, aber reviewpflichtig
- Quelle pausiert oder gesperrt

Zusätzlich bleiben die Guardrails sichtbar:

- kein automatisches Crawling-Versprechen
- kein automatischer Research-Lauf
- kein Auto-Publish
- kein automatisches `public_official`

### Region-Cockpit

`/admin/region` zeigt pro Verbindung jetzt zusätzlich:

- Status
- Scope
- letzten Testzustand
- reviewpflichtigen Snapshot-Hinweis

Damit bleibt Betreiber- oder org-scoped Quellenarbeit nachvollziehbar, ohne neue Admin-Parallelfläche.

## Persistence / Runtime Truth

Die Runtime bleibt auf demselben persistenten Source-Store.

Wenn Mongo/In-Memory-Fallback aktiv ist, wird das jetzt explizit markiert:

- im Organisationsdashboard
- in den Connection-/Snapshot-Metadaten

Damit ist der Slice produktionsnah und auditierbar, aber nicht pauschal `production_ready`.

## Reifestufe

Erreicht: `production_candidate`

Begründung:

- persistente Source-Connection- und Snapshot-Wahrheit auf bestehender Runtime
- auditierbare Statuswechsel
- org-/entitlement-gesteuerte Aktivierung und Tests
- ehrliche Dashboard-States
- keine stillen Crawler-, Research- oder Publish-Behauptungen

Nicht erreicht: `production_ready`

Offene Gründe:

- noch keine breitere produktive Quellenabdeckung über explizite Einzelverbindungen hinaus
- keine externe Register-/Directory-Wahrheit als letzter Autoritätsanker
- keine automatisierte Entitlement-/Billing-/Research-Linkage
- Betreiberkante bleibt für Grenz- und Reviewfälle bewusst sichtbar

## Validierung

Grün:

- `pnpm -C apps/web exec vitest run tests/admin-region-source-connections.route.test.ts tests/source-connection-runtime.test.ts tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`

## Folgepunkte

- breitere produktive Quellenabdeckung über explizite Einzel-URLs hinaus
- spätere explizite Review-Anbindung für Snapshot-zu-Topic-/Dossier-Handoffs auf derselben Wahrheit
- externe Register-/Directory-Wahrheit statt lokaler Runtime als letzter `production_ready`-Blocker
- Billing-/Checkout-/Research-Automation bleibt bewusst separater Folgepfad
