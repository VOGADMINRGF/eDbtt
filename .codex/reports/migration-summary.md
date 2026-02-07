# Migration Summary (apps Kopie/web -> apps/web)

## Adopted / Created
- apps/web/src/app/pricing/page.tsx
- apps/web/src/app/register/RegisterStepper.tsx
- apps/web/src/app/register/RegisterPageClient.tsx
- apps/web/src/app/register/identity/page.tsx
- apps/web/src/app/register/preorder/page.tsx (new)
- apps/web/src/app/api/edebatte/preorder/route.ts (new)
- apps/web/src/utils/emailTemplates.ts (added preorder mail)
- apps/web/src/app/account/page.tsx
- apps/web/src/app/account/AccountClient.tsx
- apps/web/src/app/api/edebatte/package/route.ts
- features/account/types.ts
- features/account/service.ts

## Key Changes
- /pricing no longer mentions Bewegung & Mitgliedschaft; VoiceOpenGov note added.
- Register flow now 3 Schritte (Konto -> Verifikation -> Vorbestellung) with preorder step and OTP redirect to /register/preorder.
- New preorder UI: package selection, 12/24 Monate, bank data, binding checkbox, success modal -> /account?preorder=thanks.
- Preorder API validates IBAN/BIC, stores masked payment profile, writes pledge + commitment data, sends confirmation mail.
- Account shows preorder banner and booking line (amount/interval, Laufzeit, Ref) and routes Start/Pro selection to preorder.
- /api/edebatte/package blocks Start/Pro without preorder (Basis only).
- Removed old PreorderPledgeCard (legacy “amount input” flow) to avoid conflicting UI with new preorder flow.

## i18n / Config Review
- Compared apps/web vs apps Kopie/web for i18n.ts, locales.ts, middleware.ts, next.config.ts, i18nTranslationsRepo.ts.
- Kept apps/web versions (config identical; locales list is richer in apps/web).

## Deletions
- Removed apps Kopie/web (entire directory).

## Commands Run
- pnpm -w typecheck (ok)
- pnpm -w lint (ok)
- pnpm -w build (ok)

Notes: Build warns about Node engine (expects 20.x), baseline-browser-mapping out of date, deprecated middleware convention, missing YOU_API_KEY, and MongoDB SRV connection refused during static data collection.
