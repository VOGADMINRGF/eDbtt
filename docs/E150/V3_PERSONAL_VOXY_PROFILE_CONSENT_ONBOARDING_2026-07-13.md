# V3 Personal Voxy Profile Consent Onboarding 2026-07-13

## Scope

- Task: `V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01`
- Batch branch: `pr/v3-agentic-consent-claims-dossier-participation-01`
- Primary role: `personal_voxy`
- Supporting: `governance_compliance`

## Ziel

Den B2C-Personal-Voxy-Pfad als typed Consent-/Mode-/Onboarding-Contract absichern, ohne eine echte Runtime, neue Profilpersistenz oder Notification-Ausfuehrung zu aktivieren.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/personalVoxyProfileConsentOnboardingContract.ts`

Der Contract macht testbar:

- active/passive modes bleiben explizit und B2C-only
- Relevanztiefe bleibt nutzersteuerbar
- Profil- und Relevanzpersistenz bleiben ohne expliziten Consent gesperrt
- Notifications bleiben ohne bewusste Auswahl und Consent aus
- kein hidden political profiling
- keine external profile sale
- keine strong counterarguments oder material facts hidden
- B2B/B2G erzwingen keinen persoenlichen Companion

## Guardrails

- keine Runtime-Aktivierung
- keine neue Persistenz
- keine Secrets
- keine externe Notification
- kein politisches Profiling

## Validierung

- Batch-validiert mit fokussierten Contract-Tests
- `pnpm -C apps/web exec vitest run tests/personal-voxy-profile-consent-onboarding.contract.test.ts ...`
- `lint`, `build` und `typecheck` im finalen Batch-Lauf
