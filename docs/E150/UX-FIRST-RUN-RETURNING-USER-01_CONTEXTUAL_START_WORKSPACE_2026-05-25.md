# UX-FIRST-RUN-RETURNING-USER-01

Datum: 2026-05-25
Status: done

## Ziel

`/start` und `/account/organization/dashboard` sollen nicht bei jedem Besuch wie eine generische Landingpage wirken. Erstbesucher brauchen Orientierung. Wiederkehrende oder angemeldete Nutzer brauchen direkten Zugriff auf ihre nächsten produktiven Schritte.

## Leitentscheidung

Es wurde bewusst **kein neues Tracking-System** und **kein fragiler Returning-Visitor-Hack** eingeführt.

Die Unterscheidung läuft deterministisch über vorhandene Signale:

- unknown visitor: keine gültige Session
- signed-in user: gültige Session ohne belastbaren Organisationskontext
- organization pending: Session plus bestehender Org-/Claim-/Membership-Kontext, aber noch keine volle produktive Freischaltung
- organization verified: Session plus bestehender produktiver Org-/Scope-Kontext
- organization blocked: Session plus gesperrter oder suspendierter Org-/Vertrags-/Entitlement-Kontext
- operator/admin context: expliziter Betreiberkontext

## Änderungen

### `/start`

- Erstbesucher sehen weiterhin die kurze Orientierung, aber mit klarerer Sprache und Trust-Hinweisen.
- Quick Actions bleiben auf bestehenden V1-Pfaden, werden aber in eine härtere CTA-Hierarchie gezwungen:
  - 1 primäre Aktion
  - höchstens 2 sichtbare sekundäre Aktionen
  - weitere Optionen als einfache Liste
- Angemeldete und vertraute Kontexte sehen Quick Actions vor dem Hero.
- Für signed-in-/Org-/Operator-Kontexte wird die Landing-Erklärung reduziert; die Seite wirkt stärker wie ein Wiedereinstieg in Arbeit statt wie ein voller Marketing-Flow.

### Organisations-Dashboard

- Quick Actions bleiben oben.
- Direkt danach folgt ein neuer Block `Nächster sicherer Schritt`.
- Pending-/verification-Kontexte sehen primär Status, Antrag und sichere nächste Wege.
- Verified-Kontexte sehen direkte produktive Aktionen.
- Blocked-/suspended-Kontexte sehen keine falschen aktiven Organisations-CTAs mehr, sondern Statusprüfung, Kontakt und sichere Alternativen.

## CTA-Hierarchie

Für die Quick-Action-Surfaces gilt jetzt:

- genau 1 hervorgehobene primäre Aktion
- höchstens 2 sichtbare sekundäre Aktionskarten
- weitere Aktionen als reduzierte Liste unter `Weitere passende Einstiege`

## Geänderte Dateien

- `apps/web/src/app/start/page.tsx`
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/src/components/quickActions/TaskFirstQuickActionCenter.tsx`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/start/startExperience.ts`
- `apps/web/tests/start-shared-create-composer.contract.test.tsx`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/UX-FIRST-RUN-RETURNING-USER-01_CONTEXTUAL_START_WORKSPACE_2026-05-25.md`

## Validierung

- `pnpm -C apps/web exec vitest run tests/start-shared-create-composer.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/header-mobile-navigation.contract.test.ts tests/e150-journey-routing.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`
- `pnpm run release:validate:production`

## Ergebnis

Die App unterscheidet jetzt ohne neues Tracking zwischen Orientierung und Wiedereinstieg. Neue Nutzer verstehen in wenigen Sekunden, was eDebatte ist und was sie tun können. Wiederkehrende und angemeldete Nutzer landen schneller in Arbeitsbereich, Anlassraum, Beitrag oder Review-nahen Pfaden. Alle Änderungen bleiben auf bestehenden production-ready-v1 Flächen, ohne Auto-Publish und ohne neue Produktparallelwelt.
