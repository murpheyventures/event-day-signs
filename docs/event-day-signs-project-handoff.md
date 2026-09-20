# Event Day Signs — Project Handoff

This document is the starting point for a new session.

## Current state

- Repository: `C:\Users\steph\Documents\Event Day Signs`
- Branch: `main`
- Last implementation commit: `7a5c9d2` (`feat: finalize review display policies`).
- `origin/main` is synchronized with local `main` at `7a5c9d2`.
- Staging Worker is deployed at
  `https://event-day-signs-staging.stephen-8cc.workers.dev` with dedicated D1,
  public-image R2, private-files R2, SESSION KV, `AUTH_SECRET`, and `SECRETS_KEK`.
- Staging onboarding is available at `/admin/setup`.
- A published staging test product, “Suck it up princess,” is available at
  `/products/suck-it-up-princess-7` with two designs and two printed sizes:
  12x18 in and 24x36 in. Its digital ZIP is attached to the product.
- Repeated submissions during the earlier product-save HTTP 500 created
  duplicate test rows. Do not delete them without explicit owner approval; the
  current product is public ID `prod_q1vz9276rd`.
- Stripe staging has separate webhook destinations configured for regular
  orders (`/api/webhook/stripe`) and memberships
  (`/api/webhook/stripe-membership`). The corresponding signing secrets are
  entered in the two separate Admin → Settings → Payments fields. The Stripe
  test secret key and membership Price ID still need confirmation/configuration.
- No production migration, deployment, provider credential, or live Printify submission has been performed.
- Product mutation redirect fix: staging now treats the intentionally disabled
  cache API as a no-op during admin product saves, updates, and deletes, so the
  mutation can reach its intended `/admin/products` redirect. Deployed as
  Worker version `4a863cc7-ca96-4e57-8501-aa31689596bc`.

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
  Stripe test credentials, a test Price ID, and end-to-end membership checkout
  verification remain.
- **Milestone 6:** verified-purchase reviews are implemented end to end: additive
  review/token/audit/report schema, paid-order-item credentials, one-review
  enforcement, scheduled email requests, protected moderation, approved-only
  public summaries and rendering, abuse reports, and the customer-photo slot.
  Review policy is finalized: pending reviews are hidden until approved, digital
  requests wait 7 days, printed requests wait 3 days after fulfillment, display
  names use first name plus last initial with anonymous allowed, and reviews are
  not incentivized. See `docs/event-day-signs-milestone-6-checklist.md`.

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
  200; the published test product storefront renders both designs and both size
  options.
- Normal staging checkout reaches Stripe Checkout. Membership-price and signed
  webhook end-to-end verification remain open.
- Authenticated cart checkout now resolves active membership and enabled pricing
  rules on the server, stores the member-price decision in the reservation, and
  snapshots it onto the settled order. Guest and buy-now flows remain at base
  price until identity is available.
- `npm run check`: passed after Milestone 6 policy work with 0 errors, 0 warnings,
  and 2 pre-existing hints.
- `git diff --check`: passed after Milestone 6 policy work.
- Full `npm run verify`: still blocked by the known Windows baseline issues:
  Vitest cannot resolve `cloudflare:workers`, storefront boundary tests have
  Windows path handling failures, and the existing rollout-gate expectation for
  trimmed `MCP_URL` remains. No new Milestone 6 type-check failures were found.
- Staging D1 has migrations `0001` through `0043` applied. The FTS5 migrations
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
  digital bundle containing all four design-size combinations. The staging
  product was created from the supplied package; no live Printify submission
  has been made.

## Next session: resume here

1. Apply and validate additive migrations `0044` through `0046` in a fresh and
   upgraded supported environment; do not run remote migrations without explicit
   authorization.
2. Verify the staging admin save/delete flows now return to the products page;
   avoid deleting duplicate rows unless explicitly approved.
3. Enter or confirm the Stripe test secret key, regular webhook secret,
   membership webhook secret, and annual recurring test Price ID in the admin.
4. Verify one normal Stripe test checkout and one membership checkout, then
   confirm the corresponding webhook deliveries and admin state.
5. Create a published digital bundle and verify that only approved assets resolve.
6. Create a printed offer mapping and verify that no provider submission occurs.
7. Verify duplicate fulfillment attempts reuse the same idempotency key/job.
8. Wire Printify settings and persistence only after staging-only credentials are
   available; keep the explicit no-live-submit guard disabled by default.
9. Run one explicitly authorized provider test order, then reconcile its status.
10. Run the complete verification suite in Linux CI or another supported environment.
11. Verify Milestone 4's bounded output against a staging catalog larger than 50
   products and confirm that the complete paginated JSON feed maps to canonical
   sitemap URLs.
12. Resolve the remaining Milestone 5 owner decisions and finish member-price
    messaging for buy-now/guest flows plus the combined join-and-save checkout.
13. Verify Milestone 6 review delivery, moderation, approved rendering, abuse
    reporting, and anonymous/name formatting against a supported local or staging
    environment once migration `0046` is applied.
14. Do not skip the open Milestone 1–5 staging gates while continuing later
   milestones.

Read `AGENTS.md` before editing. In particular: use Node 22, run `npm run verify`
after meaningful changes, keep migrations additive, keep payment and fulfillment
provider logic behind ports, and do not deploy or run remote migrations without
explicit authorization.
