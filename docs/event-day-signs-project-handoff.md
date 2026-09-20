# Event Day Signs — Project Handoff

This document is the starting point for a new session.

## Current state

- Repository: `C:\Users\steph\Documents\Event Day Signs`
- Branch: `main`
- Last implementation commit: Milestone 5 pricing foundation (to be created by
  the commit that accompanies this handoff).
- `origin/main` is synchronized before this handoff commit; push this commit to
  keep the remote continuation point current.
- Staging Worker is deployed at
  `https://event-day-signs-staging.stephen-8cc.workers.dev` with dedicated D1,
  public-image R2, private-files R2, SESSION KV, `AUTH_SECRET`, and `SECRETS_KEK`.
- Staging onboarding is not complete: open `/admin/setup`, set the admin
  password, and optionally load the demo catalog. Stripe remains unconfigured.
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
- Full `npm run verify`: currently blocked by known baseline issues on this Windows
  environment: Vitest cannot resolve `cloudflare:workers`, and the storefront
  boundary test has Windows path handling failures. These failures predate Milestone 2.
- The Milestone 2 migration has not yet been applied to staging D1.
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

## Next session: resume here

1. Finish staging onboarding at the deployed Worker URL and optionally load the
   demo catalog.
2. Enter Stripe test credentials in Admin → Settings → Payments and configure
   the Stripe webhook endpoint/signing secret.
3. Verify fresh-database and upgrade-database migration paths.
4. Create a published digital bundle and verify that only approved assets resolve.
5. Create a printed offer mapping and verify that no provider submission occurs.
6. Verify duplicate fulfillment attempts reuse the same idempotency key/job.
7. Wire Printify settings and persistence only after staging-only credentials are
   available; keep the explicit no-live-submit guard disabled by default.
8. Run one explicitly authorized provider test order, then reconcile its status.
9. Run the complete verification suite in Linux CI or another supported environment.
10. Verify Milestone 4's bounded output against a staging catalog larger than 50
   products and confirm that the complete paginated JSON feed maps to canonical
   sitemap URLs.
11. Resolve Milestone 5 owner decisions, then add Stripe membership state,
    event handling, admin configuration, and checkout integration.
12. Do not skip the open Milestone 1–4 staging gates while continuing later
    milestones.

Read `AGENTS.md` before editing. In particular: use Node 22, run `npm run verify`
after meaningful changes, keep migrations additive, keep payment and fulfillment
provider logic behind ports, and do not deploy or run remote migrations without
explicit authorization.
