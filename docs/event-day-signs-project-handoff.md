# Event Day Signs — Project Handoff

This document is the starting point for a new session.

## Current state

- Repository: `C:\Users\steph\Documents\Event Day Signs`
- Branch: `main`
- Last implementation commit: `2dbe008` (`fix: avoid cache purge failure on credential saves`).
- `origin/main` is synchronized with local `main` at `2dbe008`.
- Staging Worker is deployed at
  `https://event-day-signs-staging.stephen-8cc.workers.dev` with dedicated D1,
  public-image R2, private-files R2, SESSION KV, `AUTH_SECRET`, and `SECRETS_KEK`.
- Staging onboarding is available at `/admin/setup`. The storefront currently
  has no published products, so there is nothing available for normal checkout
  testing yet.
- Stripe staging has separate webhook destinations configured for regular
  orders (`/api/webhook/stripe`) and memberships
  (`/api/webhook/stripe-membership`). The corresponding signing secrets are
  entered in the two separate Admin → Settings → Payments fields. The Stripe
  test secret key and membership Price ID still need confirmation/configuration.
- No production migration, deployment, provider credential, or live Printify submission has been performed.

## Completed milestones

- **Milestone 0:** architecture review and risk/decision record. See
  `docs/event-day-signs-milestone-0-architecture-review.md` and
  `docs/event-day-signs-milestone-0-checklist.md`.
- **Milestone 1:** normalized `Design → DesignVariant → Offer` catalog foundation,
  additive migration `0040_event_catalog.sql`, legacy compatibility, and API
  adapter. See `docs/event-day-signs-milestone-1-checklist.md`.
- **Milestone 2:** versioned digital bundles/assets, printed-offer mapping records,
  idempotent fulfillment jobs, fulfillment provider port, and public IDs for the
  new records. See `docs/event-day-signs-milestone-2-checklist.md`.
- **Milestone 3:** guarded Printify adapter and provider-status mapping. See
  `docs/event-day-signs-milestone-3-checklist.md`.
- **Milestone 4:** bounded `llms.txt` discovery index with the paginated JSON
  catalog as the complete feed, canonical discovery links, and pure unit
  coverage. See `docs/event-day-signs-milestone-4-checklist.md`.
- **Milestone 5 foundation:** additive pricing-rule and membership-plan schema,
  plus a pure member-price resolver with precedence, effective dates, format
  filtering, and contribution-floor protection. See
  `docs/event-day-signs-milestone-5-checklist.md`.
- **Milestone 5 membership integration:** Stripe subscription Checkout, portal,
  signed/idempotent membership webhook state, audit records, protected admin
  configuration, and a staging membership page are implemented. Remote
  migration 0043 and separate staging webhook destinations are in place.
  Stripe test credentials, a test Price ID, a published test catalog product,
  and end-to-end checkout verification remain.

## Validation record

- Focused Milestone 2/catalog/public-ID tests: passed (19 tests in the final focused run).
- Focused Milestone 3 fulfillment tests: passed (8 tests, including the disabled-by-default
  Printify submission guard, request mapping, and status mapping).
- `astro check` with telemetry disabled: passed with 0 errors and 2 pre-existing hints.
- `git diff --check`: passed.
- Milestone 4 focused discovery tests: passed (2 tests).
- `astro check` after Milestone 4: passed with 0 errors and 2 pre-existing hints.
- Milestone 5 pricing foundation tests: passed (3 tests).
- `astro check` after Milestone 5 foundation: passed with 0 errors and 2 pre-existing hints.
- Staging smoke test: Worker root and `/api/products?limit=1` both returned HTTP
  200; the fresh catalog is empty until onboarding seeds it.
- Current staging catalog state: no published products are available. Create or
  import the test product before attempting normal checkout or membership
  discount verification.
- Full `npm run verify`: currently blocked by known baseline issues on this Windows
  environment: Vitest cannot resolve `cloudflare:workers`, and the storefront
  boundary test has Windows path handling failures. These failures predate Milestone 2.
- Staging D1 has migrations `0001` through `0042` applied. The FTS5 migrations
  `0003` and `0039` were applied through Wrangler's direct file-execution
  workaround, then recorded in the migration ledger because the remote
  migration runner has a known trigger-splitting parser bug.
- The Printify adapter is intentionally not wired to runtime settings yet; do not enable
  provider submission until staging credentials, mapping persistence, and an explicit
  no-live-submit operational guard are in place.
- The normalized catalog and delivery tables are foundation-only. Digital bundle
  completeness for every approved variant and size, printed size/colorway
  selection, order snapshotting, and checkout integration remain open.
- The roadmap-defined Printify/ready-by work in
  `docs/event-day-signs-milestones-4-10-architecture.md` remains open; the
  current Milestone 4 checklist records the separate SEO/discovery slice that
  was implemented.
- Claude test-product intake requirements are documented in
  `docs/event-day-signs-test-product-package.md`. The next product request is
  “Suck it up princess,” with two designs, two verified Printify sizes, and one
  digital bundle containing all four design-size combinations.

## Next session: resume here

1. Review Claude's generated test-product package against
   `docs/event-day-signs-test-product-package.md`.
2. Finish staging onboarding at the deployed Worker URL and optionally load the
   demo catalog.
3. Create or import the “Suck it up princess” test product with its two designs,
   digital bundle, and two approved printed sizes; publish it in staging.
4. Enter the Stripe test secret key, regular webhook secret, membership webhook
   secret, and annual recurring test Price ID in the admin.
5. Verify one normal Stripe test checkout and one membership checkout, then
   confirm the corresponding webhook deliveries and admin state.
6. Verify fresh-database and upgrade-database migration paths.
7. Create a published digital bundle and verify that only approved assets resolve.
8. Create a printed offer mapping and verify that no provider submission occurs.
9. Verify duplicate fulfillment attempts reuse the same idempotency key/job.
10. Wire Printify settings and persistence only after staging-only credentials are
   available; keep the explicit no-live-submit guard disabled by default.
11. Run one explicitly authorized provider test order, then reconcile its status.
12. Run the complete verification suite in Linux CI or another supported environment.
13. Verify Milestone 4's bounded output against a staging catalog larger than 50
   products and confirm that the complete paginated JSON feed maps to canonical
   sitemap URLs.
14. Resolve the remaining Milestone 5 owner decisions and finish member-price
    snapshots plus server-side cart/checkout integration.
15. Do not skip the open Milestone 1–4 staging gates while continuing later
   milestones.

Read `AGENTS.md` before editing. In particular: use Node 22, run `npm run verify`
after meaningful changes, keep migrations additive, keep payment and fulfillment
provider logic behind ports, and do not deploy or run remote migrations without
explicit authorization.
