# AUTH-PROVIDER-RUNTIME-INTEGRATION-01

Datum: 2026-05-21
Status: done

## Ziel

Den zentralen `RequestScopeContext` produktionsnäher an die vorhandenen Runtime-Quellen für Auth, Session, Membership und Region-Scope anbinden, ohne ein neues Login-System oder einen stillen Betreiber-Fallback einzuführen.

## Umsetzung

### 1. Runtime-Adapter statt Direktkopplung

Neu:

- `apps/web/src/lib/server/auth/runtimeAdapters.ts`

Der neue Layer kapselt:

- `AuthProviderRuntimeAdapter`
- `MembershipDirectoryAdapter`

und trennt damit sichtbar:

- Session-Actor-Auflösung
- Membership-/Organizations-Verzeichnis
- Region-Access-Auflösung

`requestScope.ts` greift nicht mehr direkt auf `getSessionUser(...)` und das Membership-Repo als implizite Wahrheit zu, sondern über diese Adapter.

### 2. Sichtbare Source-of-Truth- und Runtime-Marker

`RequestScopeContext` und die zugehörigen Teilkontexte tragen jetzt explizit:

- `sourceOfTruth`
- `confidence`
- `runtimeMarker`
- `sourceBreakdown`

Verwendete Marker:

- `session`
- `local_membership_store`
- `fixture_demo`
- `external_provider_pending`

Damit ist pro Request sichtbar, woher

- Actor
- Organisation
- Rolle
- Regionzugriff

tatsächlich stammen.

### 3. Demo-/Test- und Pending-Provider-Zustände bleiben explizit

- In-Memory-/Testlaufzeiten werden als `fixture_demo` bzw. `demo_or_test_runtime` markiert.
- Fehlende persistente Directory-/Region-Quelle fällt nicht still auf Admin zurück, sondern wird als `external_provider_pending` bzw. `limited` markiert.
- Operator/Admin bleibt ausschließlich ein expliziter Session-/Betreiberkontext.

### 4. Routen bleiben auf derselben zentralen Decision-Layer

Der Adapter-Layer hängt weiter an denselben bestehenden Guards:

- `/api/account/organization/review/items/[itemId]`
- `/api/account/organization/review/content-release`
- `/api/admin/review/items/[itemId]`
- `/api/create/handoffs`
- `/api/contributions/save`
- `/api/contributions/finalize`
- `/api/admin/region/source-connections`
- `/api/dossier/[id]/studio/workspace`

Wichtig:

- kein stiller Betreiber-Fallback auf Org-Routen
- Session-User ohne Membership erhalten keine Org-Rechte
- Pending/Unverified erhalten keine Moderationsrechte
- `public_official` wird nicht gesetzt

## Tests

Gezielt grün:

- `pnpm -C apps/web exec vitest run tests/request-scope-context.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/admin-review-item-ops.route.test.ts tests/create-mode.save.route.test.ts tests/create-mode.finalize.route.test.ts tests/create-handoff.persistence.route.test.ts tests/dossier-studio-workspace.route.test.ts`

Komplettvalidierung grün:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

## Ergebnis

`RequestScopeContext` ist jetzt produktionsnäher an reale Runtime-Quellen angeschlossen, ohne die vorhandene Architektur zu verdoppeln:

- Session bleibt Actor-Wahrheit
- Membership-/Organization-/Region-Scope laufen über einen expliziten Runtime-Provider-Layer
- Demo/Test und fehlende externe Provider-Anbindung bleiben sichtbar markiert
- Org-, Admin-, Create- und Studio-Routen nutzen dieselbe zentrale Scope-Entscheidung weiter

## Offen

Nicht Teil dieses Slices:

- ein neues Login-System
- Payment/Social Publishing
- automatische Veröffentlichung
- automatische `public_official`-Freigabe
- breite externe Directory-/Provider-Synchronisation jenseits des vorhandenen lokalen Runtime-Stores
