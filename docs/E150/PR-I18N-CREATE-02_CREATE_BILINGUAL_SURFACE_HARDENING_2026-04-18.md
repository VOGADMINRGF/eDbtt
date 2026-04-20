# PR-I18N-CREATE-02 — Create bilingual surface hardening (2026-04-18)

## Scope
- Surface: `/create` and `/demo/create`
- Goal: remove mixed DE/EN UI output and bind entry + followup copy to one locale-aware SSOT
- Out of scope: pricing/vormerken/runden product restructuring

## Problem before slice
- EN locale was active but central create copy still contained DE fragments.
- Entry and followup strings were split across multiple sources/hardcoded literals.
- Demo create contract test broke after locale hook adoption due missing provider context.

## Implemented hardening
1. **Canonical Create i18n bundle**
   - Extended `apps/web/src/features/create/createSurfaceConfig.ts` with locale bundles for:
     - mode labels/descriptions/helpers/placeholders/cta
     - context anchors
     - helper links
     - composer UI labels + aria labels + attachment/voice errors
     - followup/runden/guided/demo copy
   - Added locale resolver + typed getters consumed by both `/create` and `/demo/create`.

2. **Entry UI fully locale-driven**
   - `apps/web/src/features/create/SharedCreateComposer.tsx`
     - removed remaining hardcoded DE mode-switch aria string
     - consumes localized `modeSwitchAriaLabel` from composer texts
   - `apps/web/src/app/create/CreateClient.tsx`
     - uses locale bundle for entry and followup copy
     - guided workspace prefix now locale-aware (`Gefuehrter Fokus` / `Guided focus`)
   - `apps/web/src/app/demo/create/DemoCreateClient.tsx`
     - consumes same locale bundle as `/create` for parity

3. **Contract/test stabilization**
   - `apps/web/tests/demo-create.page.contract.test.ts`
     - wrapped in `LocaleProvider` for deterministic locale context in isolated page rendering.
   - Extended guided followup coverage for locale-aware workspace prefix.

## Verification
### Targeted vitest run
`pnpm vitest --run tests/create-i18n.contract.test.ts tests/create-mode-i18n.contract.test.ts tests/create-followup-i18n.contract.test.ts tests/create-entry-i18n.render.test.tsx tests/gradient-headline-i18n.render.test.tsx tests/no-de-strings-when-en-active-on-create.test.tsx tests/create-mode.page.test.ts tests/demo-create.page.contract.test.ts tests/create-mode-selector.contract.test.ts tests/create-orchestration-mode-mapping.contract.test.ts tests/no-duplicate-primary-worksurface-on-create.test.ts tests/analyze-workbench-hidden-until-start.test.ts`

- Result: **12 passed / 0 failed**

### Project checks
- `pnpm lint` (apps/web): passed
- `pnpm typecheck` (apps/web): passed
- `pnpm build` (apps/web): passed (`check-page-contracts` PASS)

## Result
- `/create` and `/demo/create` now use a shared bilingual SSOT for entry + followup UI copy.
- No central DE copy leaks remain on EN in tested create entry surface.
- Gradient headline remains localized and stable in DE/EN.
- No functional regression in create mode mapping/entry flow tests.

## Remaining followups
- None for PR-I18N-CREATE-02.
- Larger cross-surface harmonization (`/create`, `/pricing`, `/vormerken`, `/runden`) remains a separate product slice.
