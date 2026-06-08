# START-CREATE-LIGHT-SUBMIT-AND-RELEVANCE-GATE-03

## Ziel

Der `/start`-Create-Light-Einstieg sollte an zwei Stellen gehärtet werden:

1. Der Continue-Handoff nach Preview darf nicht wirkungslos bleiben.
2. Offensichtlich nicht oder noch nicht öffentlich relevante Eingaben brauchen eine faire, nicht abwertende Reframe- oder Review-Option.

Der Slice baut **keine** neue Produktwelt:

- kein Publish
- kein Vote
- kein Dossier
- kein Anlassraum
- kein Graph-Write als bestätigtes Thema
- kein DeepSearch
- keine automatische KI-Orchestrierung

## Umgesetzt

### 1. Continue-Handoff für `/start`

- `public_relevant`-Eingaben erzeugen weiter einen leichten Preview-Entwurf.
- Der Continue-CTA wird auth-sicher aufgelöst:
  - eingeloggte Nutzer: `Jetzt vertiefen` -> `/create?...`
  - Gäste: `Einloggen und weiterarbeiten` -> `/login?next=/create?...&draft=start`
- Der Start-Draft wird lokal in `sessionStorage` gesichert, damit Textverlust beim Weitergehen oder Zurückkehren vermieden wird.

### 2. Public-Relevance-Gate

`landingCreateLight.ts` klassifiziert jetzt konservativ in:

- `public_relevant`
- `needs_reframe`
- `personal_only`
- `spam_suspected`
- `abusive_or_empty`

Beispiel:

- `Freibier für alle` -> `needs_reframe`
- `Ich will ein neues Handy.` -> `personal_only`
- `Jetzt kaufen https://spam.example/a https://spam.example/b ...` -> `spam_suspected`
- `Bei uns fehlt ein sicherer Schulweg vor der Grundschule` -> `public_relevant`

### 3. Manueller Review-Pfad

Wenn das Gate eine Eingabe als `needs_reframe` oder `personal_only` einstuft, erscheint zusätzlich zur Überarbeitung ein fairer Ausweichpfad:

- `Beitrag überarbeiten`
- `Zur redaktionellen Prüfung geben`

Zusätzliche Details:

- `personal_only` verlangt eine kurze Begründung, warum das Anliegen öffentlich relevant sein könnte.
- Gäste dürfen keine anonyme Review-Bitte direkt absenden.
- Stattdessen sehen sie einen geschützten Login-/Registrierungs-Handoff.
- Der Review-Draft bleibt lokal erhalten.

### 4. Review-Draft-Contract

Neue review-first Persistenz über `/api/start/editorial-review` mit:

- `status: "pending_review"`
- `source: "start_create_light"`
- `noAutoPublish: true`
- `noAutoDossier: true`
- `noAutoAnlassraum: true`
- `noAutoGraphPromotion: true`

Zusätzlich:

- Dedupe für gleiche `normalizedText`-Einreichungen desselben Nutzers
- kleines Rate-Limit pro Nutzer/24h
- kein Aufruf teurer AI-/Orchestrierungslogik

## Warum der manuelle Review-Pfad existiert

Das leichte Start-Gate soll nicht arrogant oder endgültig wirken. Wenn eine Eingabe zugespitzt, unklar oder fälschlich als nicht öffentlich relevant eingeschätzt wird, braucht der Nutzer eine faire zweite Spur:

- ohne Veröffentlichung
- ohne Produktivbeitrag
- ohne Kostenprozess
- ohne automatisches Hochstufen in Dossier, Anlassraum oder Graph

## Welche Klassifikationen Review erlauben

- `needs_reframe`
- `personal_only`

## Welche Klassifikationen blockiert werden

- `spam_suspected` bei klarem Linkspam/Werbung/Scam-Muster
- `abusive_or_empty`
- `public_relevant` braucht keinen redaktionellen Review-Fallback an dieser Stelle

## Guardrails

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph-Promotion
- kein DeepSearch
- keine automatische KI-Orchestrierung
- keine anonyme Massen-Review-Einreichung

## Missbrauchsschutz

- Honeypot im Start-Formular bleibt aktiv
- Review-Route ist loginpflichtig
- kleines Rate-Limit pro Nutzer und 24h
- Dedupe für identische Pending-Review-Einreichungen
- eindeutiger Linkspam wird nicht an die Redaktion weitergereicht

## Geänderte Dateien

- `apps/web/src/features/start/landingCreateLight.ts`
- `apps/web/src/features/start/LandingCreateLightEntry.tsx`
- `apps/web/src/app/api/start/editorial-review/route.ts`
- `apps/web/tests/start-create-light-entry.contract.test.tsx`
- `apps/web/tests/start-editorial-review.route.test.ts`
- `docs/E150/OpenTasks.md`

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-create-light-entry.contract.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/start-privacy-gate-links.contract.test.ts tests/mobile-entry-routes.contract.test.tsx tests/start-editorial-review.route.test.ts`

Ergebnis: grün.

## Offen

- keine Gast-E-Mail-Variante für redaktionelle Prüfbitten in diesem Slice
- keine Redaktionsoberfläche für diese neuen Review-Drafts in diesem Slice
- keine produktive Folgeautomatik nach `pending_review`
