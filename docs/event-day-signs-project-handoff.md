# Event Day Signs — Project Handoff

This document is the starting point for a new session.

## Current state

- Repository: `C:\Users\steph\Documents\Event Day Signs`
- Branch: `main`
- Last implementation commit: `9169b31 feat: add delivery catalog fulfillment foundation`
- The Milestone 2 implementation has been committed and pushed to `origin/main`.
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

## Validation record

- Focused Milestone 2/catalog/public-ID tests: passed (19 tests in the final focused run).
- `git diff --check`: passed.
- Full `npm run verify`: currently blocked by known baseline issues on this Windows
  environment: Vitest cannot resolve `cloudflare:workers`, and the storefront
  boundary test has Windows path handling failures. These failures predate Milestone 2.
- The Milestone 2 migration has not yet been applied to staging D1.

## Next session: resume here

1. Apply `migrations/0041_delivery_catalog.sql` to the dedicated staging D1.
2. Verify fresh-database and upgrade-database migration paths.
3. Create a published digital bundle and verify that only approved assets resolve.
4. Create a printed offer mapping and verify that no provider submission occurs.
5. Verify duplicate fulfillment attempts reuse the same idempotency key/job.
6. Configure a staging-only Printify adapter and an explicit no-live-submit guard
   before implementing provider submission.
7. Run the complete verification suite in Linux CI or another supported environment.

Read `AGENTS.md` before editing. In particular: use Node 22, run `npm run verify`
after meaningful changes, keep migrations additive, keep payment and fulfillment
provider logic behind ports, and do not deploy or run remote migrations without
explicit authorization.
