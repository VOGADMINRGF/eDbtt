# ORG-DASHBOARD-01

Datum: 2026-05-17
Status: done
Task: `ORG-DASHBOARD-01`

## Ziel

Ein eigener Organisationsbereich fuer Verwaltungen, Vereine, Verbaende, Traeger, Medienpartner und andere Organisationen.

Kanonischer Pfad:

- `/account/organization` bleibt Antrag und Status
- `/account/organization/dashboard` wird Organisationsbereich
- `/admin` bleibt Betreiberbereich

## Umgesetzter Schnitt

Neu eingefuehrt:

- typed Readmodel `OrganizationDashboardReadModel`
- Route `/account/organization/dashboard`

Wiederverwendete Bausteine:

- `membershipRuntime`
- `paidEntitlements`
- `region store/readmodel`
- `region intelligence`
- `region participation signals`
- `region signal drafts`
- `publication risk ladder`
- `organization claims`

Keine neue Parallelwelt, keine neue API.

## Readmodel

Das Readmodel fuehrt zusammen:

- Organisation / Typ / Rolle
- Verifizierungsstatus
- Membership-Status
- Regionszuschnitt
- Freischaltung
- erlaubte Aktionen
- offene Organisationsantraege
- verifizierte Memberships
- offene Review-Items
- regionale Startlagen
- Dossier-Drafts
- Anlassraum-Drafts
- Beteiligungssignale
- naechste Schritte
- Guardrails

Guardrails:

- `noAutoOfficialClaim`
- `noAutoPublish`
- `noAutoDossierFinalization`
- `noAutoAnlassraumFinalization`
- `reviewRequiredForOfficialStatus`

## Sichtbare UI-Bloecke

Das Dashboard zeigt:

1. Meine Organisation
2. Freischaltung
3. Meine Aufgaben
4. Regionale Startlage
5. Dossier-Entwuerfe / Anlassraeume / Beteiligungssignale
6. Naechste Schritte

Copy:

- `Organisationsbereich`
- `Hier sieht deine Organisation ihre Region, Freischaltung, offenen Aufgaben und vorbereiteten Themen.`
- `KI-vorqualifizierte Startlage`
- `kuratierte Startlage`
- `Beteiligungssignal`
- `Aussage`

## Zugriffslogik

- `unverified` / nur pending claim:
  - sieht eigenen Antrag, Status, naechsten Schritt
  - sieht keine internen fremden Regionsdaten
- `verified`:
  - sieht eigene Organisation und eigene Regionenzuordnung
  - ohne Freischaltung bleibt der Bereich auf Status / Basiszuschnitt begrenzt
- `unit_verified`:
  - sieht arbeitsbezogene Aufgaben, Startlagen und reviewpflichtige Arbeitsstaende innerhalb der eigenen Region
- `publication_approved`:
  - kann spaeter explizite amtliche Freigaben sehen, aber in diesem Slice keine automatische Freigabe
- `admin`:
  - kann als Fallback sehen, aber sichtbar als Betreiber-Modus markiert

## Empty States

Produktnah sichtbar:

- `Noch keine Freischaltung aktiv.`
- `Noch keine regionale Startlage vorbereitet.`
- `Noch keine offenen Reviews.`
- `Noch keine Dossier-Entwürfe.`
- `Noch keine Anlassräume.`
- `Stelle zuerst einen Organisationsantrag oder warte auf Freigabe.`

## Nicht-Ziele

Nicht hinzugefuegt:

- kein Payment
- kein Checkout
- kein GeoReferenceLayer
- kein Social Publishing
- keine automatische amtliche Antwort
- keine automatische Dossier-/Anlassraum-Finalisierung
- keine neue AI-Kostenlogik
- kein Live-Crawler
- kein Scraping

## Geaenderte Dateien

- `features/region/organizationDashboard.ts`
- `features/region/index.ts`
- `apps/web/src/app/account/organization/page.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/tests/organization-dashboard.readmodel.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

Gruen ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/account-organization-claims.route.test.ts tests/organization-claims.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/paid-entitlements.contract.test.ts tests/region-participation-signals.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Offen

Als Follow-up explizit offen gehalten:

- `ANLASSRAUM-PUBLIC-INPUT-01`
- `PUBLICATION-RISK-LADDER-02`
- `REGION-INTELLIGENCE-02`
