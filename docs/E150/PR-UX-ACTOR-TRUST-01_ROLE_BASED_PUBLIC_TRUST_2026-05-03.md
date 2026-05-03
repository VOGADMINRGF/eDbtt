# Evidence: PR-UX-ACTOR-TRUST-01 Role-Based Public Trust (2026-05-03)

## Scope

- Public actor language
- Contribution visibility (anonymous / nickname / real_name)
- Visible organisation labelling
- Representative answer responsibility in dossier questions
- Closed hosted-room and confidential-hint boundaries

Keine Architekturgrenzen verschoben.
Kein Kampagnen-/Parteitool-Pivot.

## Umsetzung

### 1) Rolle statt Parteien-Positionierung

Aktualisiert:
- `apps/web/src/app/faq/page.tsx`

Änderung:
- Öffentliche Grundsprache auf `Menschen, Organisationen und verantwortliche Personen` umgestellt.
- Partei-zentrierte Formulierungen aus Kern-FAQ-Antworten entfernt.

### 2) Öffentliche Beitrags-Attribution (persistenter Contract)

Erweitert:
- `core/communityContributions/types.ts`
- `core/communityContributions/store.ts`
- `apps/web/src/app/api/community/contributions/route.ts`
- `apps/web/src/app/community/contributions/page.tsx`

Neue Felder/Regeln:
- `authorVisibility`: `anonymous | nickname | real_name`
- `authorKind`: `person | organization | representative_person`
- `organizationLabel`, `representativeName`
- `hostedRoomScope`: `public_open | closed_hosted`
- `confidentialHint: boolean`

Guardrails:
- Bei `anonymous` wird `authorName` serverseitig nicht persistiert.
- Bei `nickname`/`real_name` ist `authorName` Pflicht.
- Organisationsbeiträge bleiben sichtbar gekennzeichnet.

### 3) Dossier-Trust-Hardening

Aktualisiert:
- `apps/web/src/components/dossier/DossierViewer.tsx`
- `apps/web/src/components/dossier/presentation.ts`
- `apps/web/src/components/dossier/VotePanel.tsx`
- `apps/web/src/components/dossier/MandatePanel.tsx`
- `features/dossier/data/demoDossier.ts`

Umsetzung:
- Claim-Karten zeigen vor prominenter Darstellung Evidenz- und Prüfstatus.
- Faktische Aussagen ohne Quellennachweis zeigen expliziten Warnhinweis.
- Bürgerabstimmungen bleiben sprachlich klar getrennt von Organisationspositionen.
- Closed hosted rooms sind explizit markiert und nicht als allgemeines Meinungsbild gerahmt.
- Closed-room Inputs bleiben als Fragen/Claims/Quellen/Varianten/Argumente/offene Punkte im Dossierfluss.
- Vertrauliche Hinweise: klare Aussage "keine automatische Weiterleitung an Host-Organisation".
- Antworten auf Bürgerfragen werden als benannte verantwortliche Person dokumentiert; fehlende Benennung wird markiert.

### 4) Kontakt-Kategorie entschärft

Aktualisiert:
- `apps/web/src/app/kontakt/KontaktForm.tsx`

Änderung:
- Partei-zentrierte Kategoriebezeichnung auf rollenbasierte Formulierung umgestellt.

## Validierung

Ausgeführt:
- `pnpm -C apps/web exec vitest run tests/ux-actor-trust.contract.test.tsx tests/community-contributions.route.actor-trust.test.ts tests/community-contributions.route.translation.test.ts tests/dossier-evidence-first-ux.test.tsx tests/dossier-demo-master-content.test.ts`

Ergebnis:
- 5 Test Files, 15 Tests: grün

## Decision Boundary

Offen und unverändert:
- Exaktes legales/security-rechtliches Wording zu vertraulichen Hinweisen bleibt `needs_decision` und wird nicht still als harte Schutzgarantie umgesetzt.
