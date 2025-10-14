# VPM25 Script Bundle (e‑Debatte migration pack)

This bundle provides:
- A one‑shot orchestrator: `scripts/fix_vpm25.sh`
- Zero‑byte repair from a "Reparatur.zip": `scripts/helpers/replace_zero_kb.js`
- Brand rename VoiceOpenGov → e‑Debatte (keeps `VOG`): `scripts/helpers/bulk_rename_brand.js`
- Turquoise→Blue gradient & accent color injection: `scripts/helpers/apply_colors.js`
- Landing extraction to `_landing_extract`: `scripts/helpers/extract_landing.sh`
- Admin config & UI: `packages/config/admin-config.ts`, `apps/web/src/app/admin/settings/page.tsx`
- Gamification thresholds: `apps/web/src/lib/gamification/rules.ts`
- Fact/Trust badge: `apps/web/src/features/fact/FactBadge.tsx`
- Newsfeed pipeline (RSS→drafts): `apps/web/src/features/newsfeed/pipeline.ts` + `scripts/helpers/newsfeed_cron.js`
- Geo provider abstraction (Nominatim/GeoNames): `apps/web/src/lib/geo/provider.ts`

## Quickstart
```bash
# 1) Place this bundle at the root of your VPM25 repo
unzip vpm25_script_bundle.zip -d VPM25
cd VPM25

# 2) Run with your zips and options
bash scripts/fix_vpm25.sh --repo-root . \
  --repair-zip /path/to/Reparatur.zip \
  --incoming-zip /path/to/Incoming.zip \
  --brand "e‑Debatte" --old-brand "VoiceOpenGov" \
  --apply-colors --separate-landing \
  --newsfeed-limit 25 --region "DE:BE:11000000"
```

## ENV
- `VOG_PRICE_MEMBERSHIP`, `VOG_PRICE_POST_IMMEDIATE`, `VOG_SWIPE_THRESHOLDS`
- `VOG_NEWSFEED_MAX_PER_RUN`, `VOG_FACTCHECK_TOKENS`, `VOG_PIPELINE_AUTODRAFT`
- `VOG_DEFAULT_REGION`
- `GEONAMES_USERNAME` (optional; otherwise OSM/Nominatim only)

## Notes
- The newsfeed pipeline uses a naive trust score placeholder; plug in your KI orchestrator later.
- The admin settings page currently reads from env; wire up a PATCH API to persist changes.
- Zero‑byte repair matches by relative path; ensure the Reparatur ZIP mirrors your repo structure.
