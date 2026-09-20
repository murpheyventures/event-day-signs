# Event Day Signs — Project Handoff

This document is the starting point for a new session.

## Current state

- Repository: `C:\Users\steph\Documents\Event Day Signs`
- Branch: `main`
- Last implementation commit: `863781a` guarded Printify fulfillment adapter.
- `origin/main` is synchronized with the local `main` branch.
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
- **Milestones 4–10 architecture:** continuation roadmap covering Printify
  completion, ready-by estimates, membership/pricing, reviews, SEO/AEO/GEO,
  theme, scale/AI/agentic-commerce spike, and final UAT. See
  `docs/event-day-signs-milestones-4-10-architecture.md`.

## Validation record

- Focused Milestone 2/catalog/public-ID tests: passed (19 tests in the final focused run).
- Focused Milestone 3 fulfillment tests: passed (8 tests, including the disabled-by-default
  Printify submission guard, request mapping, and status mapping).
- `astro check` with telemetry disabled: passed with 0 errors and 2 pre-existing hints.
- `git diff --check`: passed.
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

## Next session: resume here

1. Apply `migrations/0041_delivery_catalog.sql` to the dedicated staging D1.
2. Verify fresh-database and upgrade-database migration paths.
3. Create a published digital bundle and verify that only approved assets resolve.
4. Create a printed offer mapping and verify that no provider submission occurs.
5. Verify duplicate fulfillment attempts reuse the same idempotency key/job.
6. Wire Printify settings and persistence only after staging-only credentials are
   available; keep the explicit no-live-submit guard disabled by default.
7. Run one explicitly authorized provider test order, then reconcile its status.
8. Run the complete verification suite in Linux CI or another supported environment.
9. Use `docs/event-day-signs-milestones-4-10-architecture.md` as the approved
   roadmap. Do not skip the open Milestone 1–3 staging gates when beginning
   Milestone 4.

Read `AGENTS.md` before editing. In particular: use Node 22, run `npm run verify`
after meaningful changes, keep migrations additive, keep payment and fulfillment
provider logic behind ports, and do not deploy or run remote migrations without
explicit authorization.
