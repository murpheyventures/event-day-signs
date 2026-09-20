# Event Day Signs — Milestone 0 Checklist and Issue List

Status: Approved and committed in `be63aa8`
Repository: `murpheyventures/event-day-signs`  
Baseline commit: `c964bf746926ae039a97d69720eee26fb97ba06f`

## Checklist

- [x] Verify GitHub CLI authentication as `murpheyventures`.
- [x] Create fork `murpheyventures/event-day-signs` from `ddyy/minshop`.
- [x] Clone fork into the workspace.
- [x] Add `upstream` remote pointing to `https://github.com/ddyy/minshop.git`.
- [x] Record exact baseline commit.
- [x] Read repository guidance, README, customization guide, architecture,
  migrations, provider seams, catalog/order/checkout/digital/MCP code, and tests.
- [x] Install locked root and MCP dependencies; install scaffold dependencies.
- [x] Run untouched verification and individual remaining gates where the
  aggregate command stopped early.
- [x] Owner review and approval of the architecture record.
- [x] Owner approved the architecture with complete digital bundles containing
  all variants and sizes, and printed checkout requiring explicit size and
  variant selection.
- [ ] Decide whether baseline tooling defects should be fixed in a separate
  maintenance commit before Milestone 1, or carried as documented limitations.
- [x] After approval: commit/tag the Milestone 0 documents and begin Milestone 1
  only with explicit owner approval.

Milestone 1 implementation is tracked in
`docs/event-day-signs-milestone-1-checklist.md`; its staging and Linux-CI gates
remain open before production use.

## Baseline verification record

### Passed

- Vitest: 75 test files passed; 871 tests passed.
- Storefront contract subset: 11 files passed; 173 tests passed.
- Scaffold tests: 13 of 14 passed.
- Integration suites passed before the menu suite reached its migration error:
  reservations, refunds, and media.

### Failed or blocked

- Aggregate `npm run verify`: stopped in Vitest with 6 failed files / 5 failed
  tests and 5 import-resolution failures for `cloudflare:workers`.
- Storefront boundary checks: upstream checker rejects valid Windows paths and
  causes five assertion failures.
- `astro check` and `astro build`: Astro telemetry cannot create
  `%APPDATA%\astro\Config` in the managed environment.
- `npm run mcp:check`: script invokes Bash, unavailable in this Windows shell.
- Menu integration tests: D1 rejects the comment-heavy migration `0028` when
  executed through this Windows path; 27 menu checks failed at setup.
- Scaffold test: generated file has CRLF where the test expects LF.
- `test:storefront-equivalence`: blocked by the same Astro telemetry failure.

## Issues to track

| ID | Priority | Issue | Proposed disposition |
|---|---:|---|---|
| M0-01 | P0 | Owner architecture approval is still required. | Review this document before schema work. |
| M0-02 | P1 | Astro telemetry write is blocked outside the sandbox. | Run in a writable normal user profile or disable telemetry through the supported project/runtime mechanism; do not change product code yet. |
| M0-03 | P1 | `theme:check` and boundary tests mishandle Windows separators. | Upstream/tooling maintenance candidate; isolate from product architecture. |
| M0-04 | P1 | Vitest suites import `cloudflare:workers` despite the test invariant. | Upstream test/runtime compatibility candidate; determine whether the supported runner should provide a stub. |
| M0-05 | P1 | Integration runner depends on Bash and migration parsing is Windows-sensitive. | Add a supported Windows runner or execute the canonical suite in a Linux CI environment. |
| M0-06 | P2 | Scaffold output line endings differ from test expectation. | Normalize generated text output or make the test platform-neutral in a separate maintenance change. |
| M0-07 | P2 | `npm ci` reports 12 root and 3 MCP audit findings. | Review advisories; do not auto-fix before identifying lockfile and runtime impact. |
| M0-08 | P1 | New catalog model must coexist with legacy product/offer APIs. | Implement a normalized catalog adapter with compatibility tests before schema migration. |
| M0-09 | P1 | Printify API behavior and staging safeguards are not yet configured. | Validate official API details and account capabilities in the Printify milestone. |
| M0-10 | P1 | Stripe membership and pricing policy decisions are not final. | Keep configuration-driven placeholders until the membership milestone. |

## Approval gate

Milestone 0 is ready for owner review when the architecture record is accepted,
the baseline limitations are acknowledged, and the owner decides whether M0-02
through M0-06 are separate maintenance work or documented environment
limitations. No feature schema or storefront code should be added before that
approval.
