# PR-0047 - Account Dark-Mode Closure (2026-04-05)

## Scope

Small visual hardening slice for account surfaces only:
- no product logic change
- no routing/API/contract changes
- no new theme architecture
- no wrapper/app/store scope

## Rest matrix (closure check)

| Surface / file | Dark-mode drift | Token/theme issue | Functional impact | Small closable |
| --- | --- | --- | --- | --- |
| `apps/web/src/app/account/AccountClient.tsx` | yes | mixed light-only status badges, focus rings, selected state tokens | no | yes |
| `apps/web/src/app/account/payment/PaymentProfileForm.tsx` | yes | focus-ring parity + success/error text contrast | no | yes |
| `apps/web/src/app/account/payment/MicroTransferVerificationForm.tsx` | yes | focus-ring parity + success/error text contrast | no | yes |
| `apps/web/src/app/account/security/page.tsx` | yes | code input token drift + success/error dark contrast | no | yes |

## Implemented hardening

1. `AccountClient.tsx`
- replaced remaining light-only badge styles with dark-safe token pairs (emerald/amber/sky status chips)
- added dark focus-ring token parity for account form fields and checkboxes
- aligned one remaining inactive tab hover from `hover:bg-white/5` to token-based hover surface
- aligned identity document selected-option chip states with explicit dark variants
- aligned utility/action buttons with dark focus-ring parity

2. `PaymentProfileForm.tsx`
- added `dark:focus:ring-sky-500/30` on inputs
- added dark variants for success/error messages

3. `MicroTransferVerificationForm.tsx`
- added `dark:focus:ring-sky-500/30` on TAN input
- added dark variants for success/error messages
- kept logic unchanged; fixed only formatting around existing error branching

4. `account/security/page.tsx`
- hardened TOTP code input to token-based field styling with dark-safe focus ring
- added dark variants for success/error messages
- kept TOTP flow behavior unchanged

## Verification

- `pnpm -C apps/web run typecheck` (pass)
- `pnpm -C apps/web run lint` (pass)

## Result

`PR-0047` is closure-ready: account surfaces now use consistent dark-mode token patterns for remaining interactive input states, status badges, and feedback text, without functional changes.

## Explicitly not part of this slice

- no account feature logic changes
- no API/route/store changes
- no global design-system refactor
- no wrapper/app/store work
