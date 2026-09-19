# Event Day Signs — Milestone 1 Checklist

Status: Implementation complete; staging validation pending
Scope: normalized catalog foundation and legacy compatibility

## Completed

- [x] Define the normalized `Design → DesignVariant → Offer` contract.
- [x] Add additive migration `0040_event_catalog.sql` for designs, variants,
  and offers.
- [x] Add `des_`, `dvar_`, and `off_` public-ID kinds.
- [x] Add binding-injected D1 readers and writers with published/active
  filtering and legacy-schema fallback.
- [x] Adapt legacy products into the normalized catalog shape.
- [x] Serialize new designs through the existing public product API shape.
- [x] Preserve legacy product API behavior when no normalized design matches.
- [x] Add focused unit tests for the adapter, D1 reader mapping, and existing
  catalog serializer.

## Validation record

- Focused catalog tests: 11 passed.
- TypeScript diagnostics: no errors reported for the new catalog or API files;
  the repository still has pre-existing Astro fixture diagnostics when run
  directly with `tsc`.
- `git diff --check`: passed.
- Local Wrangler migration: recognized `0040_event_catalog.sql`, but the
  Windows runner stalled while replaying the existing migration chain. No
  remote database was touched.
- Full `npm run verify`: remains blocked by the Milestone 0
  `cloudflare:workers` Vitest imports and Windows storefront-boundary path
  handling.

## Staging gate before declaring release-ready

- [ ] Apply `0040_event_catalog.sql` to the dedicated Cloudflare staging D1.
- [ ] Verify fresh-database and upgrade-database paths.
- [ ] Exercise a published printed design, a digital design, an unavailable
  offer, and a legacy product through `/api/products/:slug`.
- [ ] Confirm staging uses Stripe test mode and cannot submit live Printify
  orders.
- [ ] Run the complete verification suite in Linux CI or another supported
  environment.

No production migration or deployment is part of Milestone 1.
