# Event Day Signs — Milestone 2 Checklist

Status: Foundation implementation complete; staging validation pending
Scope: versioned digital delivery and printed fulfillment boundaries

## Completed

- [x] Add additive migration `0041_delivery_catalog.sql`.
- [x] Add versioned `digital_bundles` and `digital_bundle_assets` records.
- [x] Link digital offers to a versioned bundle without changing legacy products.
- [x] Add provider/version fields for printed-offer `print_mappings`.
- [x] Add idempotent `fulfillment_jobs` separate from payment and order status.
- [x] Add permanent public-ID kinds for bundles, assets, mappings, and jobs.
- [x] Add a vendor-neutral `FulfillmentProvider` port and input validation.
- [x] Add focused contract tests for the fulfillment boundary.

## Staging gate

- [ ] Apply `0041_delivery_catalog.sql` to dedicated staging D1.
- [ ] Verify a published digital bundle resolves only approved assets.
- [ ] Verify one printed offer can be mapped without submitting to Printify.
- [ ] Verify duplicate fulfillment submissions reuse the idempotency key.
- [ ] Add and test the Printify adapter only after staging credentials and a no-live-submit guard are configured.
- [ ] Run the complete verification suite in Linux CI or another supported environment.

No production migration, provider credential, or live fulfillment submission is part of Milestone 2.
