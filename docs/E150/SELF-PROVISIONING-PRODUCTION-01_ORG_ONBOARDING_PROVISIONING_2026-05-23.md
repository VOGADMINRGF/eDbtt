# SELF-PROVISIONING-PRODUCTION-01

Stand: 2026-05-23
Issue: `#208`
Ausgangsbasis: `prod-green-20260522-2339`, Commit `44411dc`

## Ziel

Self-Provisioning fuer Organisationen, Regionen und Wirkraeume auf den bestehenden Flächen
`/account/organization`, `/account/organization/dashboard` und
`/admin/organization-claims` produktionsnah haerten, ohne falsche `production_ready`-Aussagen.

## Umgesetzt

### 1. Bestehender Claim-Pfad statt Parallelwelt

- Kein neues Produktmodul und keine neue Auth-Welt.
- Der bestehende persistente `organization_claims`-Pfad bleibt die Antragswahrheit.
- `OrganizationClaim` traegt jetzt zusaetzlich einen typed `OrganizationProvisioningRequest`.

Neue Domain-Vertraege:

- `OrganizationProvisioningRequest`
- `OrganizationProvisioningStatus`
- `OrganizationProvisioningDecision`
- `OrganizationProvisioningSource`
- `OrganizationProvisioningKind`

## 2. Status- und Entscheidungsmodell

### Status

- `draft`
- `submitted`
- `verification_required`
- `operator_review_required`
- `approved`
- `rejected`
- `suspended`

### Entscheidungen

- `save_draft`
- `submit`
- `request_verification`
- `approve`
- `reject`
- `suspend`

### Quellen

- `self_service`
- `operator_created`
- `migration`
- `fixture`

## 3. Nutzerfluss

### `/account/organization`

- Nutzer kann einen Antrag als Entwurf speichern oder bewusst einreichen.
- Erfasst werden:
  - Organisationsname
  - Organisationsart
  - Region/Wirkraum
  - Antragsteller
  - verantwortliche Person
  - Einheit/Rolle
  - optionaler Standort
  - Website/Nachweis
- Drafts bleiben `unverified` plus Provisioning-Status `draft`.
- Einreichungen bleiben `pending_review` plus Provisioning-Status `submitted`.

### `/account/organization/dashboard`

- zeigt jetzt einen eigenen Provisioning-Block
- benennt ehrlich:
  - Antrag gestartet
  - eingereicht
  - Prüfung erforderlich
  - Betreiberprüfung läuft
  - freigeschaltet
  - abgelehnt
  - gesperrt
- zeigt sichere nächste Schritte statt Admin-Sprache
- zeigt, ob der Claim-Store persistent oder nur lokaler/In-Memory-Fallback ist

### `/admin/organization-claims`

- Betreiber sehen weiterhin denselben Review-Pfad
- UI zeigt jetzt zusätzlich:
  - Provisioning-Status
  - Antragsteller
  - verantwortliche Person
- Betreiberentscheidung bleibt der einzige Pfad zu Membership/Org-Scope

## 4. Sicherheits- und Rechtegrenzen

Weiter explizit ausgeschlossen:

- kein automatisches `publication_approved`
- kein automatisches `public_official`
- kein Auto-Publish
- keine automatische Amtlichkeit
- keine Betreiberrechte aus Self-Provisioning
- keine Org-A/Org-B-Vermischung

Bestehende Rechtehaertung bleibt wirksam:

- Pending / `verification_required` / `operator_review_required` erhalten keine
  Moderations- oder Publish-Rechte
- `approved` fuehrt erst nach expliziter Betreiberentscheidung zu Membership und Org-Scope
- `rejected` und `suspended` blockieren Schreibrouten weiter

## 5. Reifestufe

Erreichte Reifestufe fuer `Self-Provisioning`:

- vorher: `foundation`
- jetzt: `production_candidate`

Begruendung:

- persistenter Antragspfad auf bestehender Runtime vorhanden
- ehrliche Statusfuehrung und Betreiberreview vorhanden
- Dashboard- und Review-Surfaces produktionsnah
- keine automatische Rollenerhoehung oder Sichtbarkeit

## Nicht production_ready

Weiter offen und deshalb kein `production_ready`-Claim:

- keine externe Register-/Directory-Wahrheit fuer Organisationsverifikation
- keine automatische Entitlement-/Freischaltungs-Provisionierung
- kein Checkout / Billing / Payment
- keine Missbrauchs-/Abuse- und SLA-Vollhärtung fuer breiten offenen Self-Service
- kein Upload-/Dokumenten- oder Register-Nachweispfad als autoritative Aussenwahrheit

## Validierung

Gruen:

- `pnpm -C apps/web exec vitest run tests/account-organization-claims.route.test.ts tests/admin-organization-claims.route.test.ts tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/request-scope-context.test.ts`
- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`
- nachgelagerte Vollvalidierung im Slice:
  - `pnpm -C apps/web exec vitest run tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/request-scope-context.test.ts`
  - `pnpm -C apps/web run typecheck`
  - `pnpm -C apps/web run lint`
  - `rm -rf apps/web/.next`
  - `pnpm --filter @vog/web build`

## Folgepunkte

- `AUTH-MEMBERSHIP-DIRECTORY-EXTERNAL-DIRECTORY-01`
- spaetere Self-Provisioning-Folge fuer externe Nachweis-/Registeranbindung
- automatische Entitlement-/Checkout-Provisionierung getrennt behandeln
