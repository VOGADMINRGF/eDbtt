# V3 Voxy Render Asset Provider Registry Truth Audit

Date: 2026-07-08
Task: `V3-VOXY-RENDER-ASSET-PROVIDER-REGISTRY-TRUTH-01`
Status: done

## Scope

- Added a typed review-first registry layer for real Voxy render asset and provider truth.
- Reused existing script-candidate, provider-handoff, and render-preflight readmodels.
- Integrated the registry additively into `/create`, `/account`, `/admin/review`, and `/dossier/[id]/studio`.

## Real assets found

Repo- and code-visible Voxy truth currently includes:

- static Voxy raster assets in `apps/web/public/brand/voxy/`
  - `voxy-confident`
  - `voxy-mini-avatar`
  - `voxy-neutral`
  - `voxy-thinking`
  - `voxy-check`
  - `voxy-hint`
  - `voxy-welcome`
  - `voxy-presenting`
  - `voxy-open`
  - `voxy-wave`
  - `voxy-podcast-stage`
  - `voxy-create-guide`, `voxy-create-guide-light`, `voxy-create-guide-dark`
- static overlay assets
  - `overlays/voxy-wordmark.svg`
  - `overlays/edebatte-gradient.svg`
  - `overlays/vog-pin.svg`
- manifest truth in `apps/web/public/brand/voxy/manifest.json`
  - route usage hints
  - usage notes for background and placement
  - canonical ids for the core mascot variants

These assets are real repo truth, but not render-safe runtime truth.

## Missing required assets

The registry keeps the following as missing or requirement-only because no real file or config is belegt:

- no voice profile
- no subtitle template
- no lower-third template
- no source-caption template
- no export preset
- no real background template or scene asset, only manifest usage notes

## Real provider and adapter truth

Existing code truth for render providers remains limited to interfaces in `apps/web/src/features/voxyVideo/contracts.ts`:

- `VoiceProvider`
- `AvatarProvider`
- `RenderProvider`
- `PublishProvider`

This is only contract truth. There is still:

- no concrete Voxy render adapter
- no configured avatar provider
- no configured voice provider
- no render queue implementation for Voxy media work
- no provider name that can honestly be shown as configured
- no secret/runtime truth that would allow execution

## Cost, usage, and credit truth

The repo has generic entitlement and usage primitives:

- `apps/web/src/lib/server/entitlements/createEntitlements.ts`
- `apps/web/src/config/credits.ts`
- `apps/web/src/lib/metrics/usage.ts`
- `features/factcheck/entitlementGate.ts`

But there is still:

- no render-specific Voxy credit policy
- no render-specific cost estimate path
- no render-specific usage booking
- no credit debit for Voxy rendering

## Why fake truth is avoided

- Repo assets are shown only when a real checked-in public path is already referenced by code.
- Manifest notes are shown only as manifest truth, not as generated media templates.
- Provider items stay `missing`, `requirement_only`, `adapter_needed`, `configuration_needed`, or `blocked`.
- No fake provider names are injected.
- No fake asset paths are fabricated for subtitle, lower-third, caption, export, or voice assets.

## How preflight becomes more honest

- The new registry sits next to handoff and preflight and makes the underlying repo truth inspectable.
- Contribution and review surfaces can now distinguish:
  - existing mascot and overlay files
  - missing media templates
  - interface-only provider truth
  - blocked runtime truth
- This prevents `asset_registered` from reading as `render_safe` and `provider_requirement` from reading as `provider_available`.

## Runtime still missing

- no Voxy rendering runtime
- no media generation
- no provider execution
- no upload flow
- no scheduling
- no publishing
- no render queue runtime truth

## Next slice

- If a later slice introduces real adapter truth, it should stay server-only, review-first, and explicit about secrets, runtime, and billing boundaries.
