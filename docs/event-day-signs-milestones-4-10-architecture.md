# Event Day Signs — Milestones 4–10 Architecture Roadmap

Status: Architecture for continuation; implementation not started for these milestones
Repository state reviewed: `origin/main` at `863781a90d8d03ab4e4ef48dfcbbbab0307267fd`
Current implementation commits: `820cdeb`, `9169b31`, `863781a`
No staging migration, deployment, provider credential, or live Printify submission has been performed.

## How to use this document

Each milestone must be approved independently. At the beginning of each
milestone, confirm scope, expected files, schema/API changes, risks, and tests.
At the end, run the full supported verification suite, deploy only to staging,
provide manual tests and limitations, commit/tag the work, and stop for owner
approval. Never treat a focused unit-test pass as milestone acceptance.

The existing Milestones 1–3 implementation is foundation work, not complete
acceptance. Its open staging gates remain prerequisites for the later work.

## Current state and incomplete work carried forward

### Present on `origin/main`

- `0040_event_catalog.sql` adds `designs`, `design_variants`, and `offers`.
- `0041_delivery_catalog.sql` adds `digital_bundles`,
  `digital_bundle_assets`, `print_mappings`, and `fulfillment_jobs`.
- The normalized catalog reader adapts new designs and legacy products to a
  shared API shape.
- A vendor-neutral `FulfillmentProvider` port and guarded Printify adapter exist.
- Printify submission is disabled unless an explicit `allowLiveSubmit` option is
  enabled.
- Focused catalog, delivery, and Printify unit tests pass.

### Must not be missed before or during Milestone 4

- Apply and verify migrations `0040` and `0041` on a dedicated staging D1,
  including fresh-database and upgrade-database paths.
- The current digital asset table has a `variant_id` but does not yet encode
  size, file format, resolution, hashes, license version, or a completeness
  rule. Milestone 4 must preserve the owner decision that a digital purchase
  includes every approved variant and size.
- The current normalized serializer still projects new designs through the
  legacy product-shaped API and uses a placeholder image. It does not yet
  expose the complete design/variant/format/offer contract needed by later
  checkout, SEO, and agent work.
- The current Printify adapter submits orders and reads status, but does not yet
  provide catalog ingestion, asset upload, mapping administration, webhook
  authentication/normalization, retry/reconcile workflows, tracking updates, or
  runtime settings integration.
- `fulfillment_jobs` exists, but paid printed-order orchestration is not yet
  wired into verified payment settlement.
- Milestones 1–3 still have open staging and Linux-CI verification gates.

## Shared architecture rules

- New catalog data remains additive and authoritative for new designs. Legacy
  `products` remain purchasable through the compatibility adapter until all
  public and checkout contracts have migrated.
- A digital offer points to a complete, versioned design-level bundle. Checkout
  does not ask the customer to choose one variant or size for digital goods.
- A printed offer resolves exactly one approved DesignVariant/colorway and one
  printed size/material. The selected mapping and version are snapshotted on the
  order item.
- Prices, discounts, stock/availability, entitlements, and fulfillment state are
  server-authoritative. Provider calls remain behind ports.
- Webhooks and fulfillment operations are idempotent and safe under duplicates,
  retries, and out-of-order events.
- Private R2 objects are never exposed as direct public URLs.
- Staging is `workers.dev`, noindex, Stripe test mode, and Printify submission
  disabled unless an explicit, protected test flag is approved.
- Do not purchase a domain, enable live payments, or submit a live Printify
  order without explicit owner approval.

## Milestone 4 — Printify fulfillment and ready-by estimates

### Scope

Complete the provider boundary and integrate paid printed-line fulfillment. Add
event-date and destination-aware estimates that are conservative, explain their
assumptions, and recommend the digital bundle when the printed path is unlikely
to arrive in time.

### Expected components

- `src/features/fulfillment/` provider factory, Printify catalog client, asset
  upload/sync, order submission, webhook normalization, retry/reconcile, and
  tracking update logic.
- `src/features/delivery/` pure business-day/calendar and ready-by calculator.
- Admin pages/API for Printify shop/catalog mappings, failed jobs, retries,
  reconciliation, provider status, and staging safety state.
- Printed design detail/cart controls for event date, postal code, country,
  estimate assumptions, cutoff, and digital recommendation.
- Payment-settlement orchestration that creates one `fulfillment_job` per paid
  printed order item and leaves digital delivery independent.

### Schema/API changes

- Add provider mapping version, provider request/event IDs, status history,
  retry count, last request/response metadata, and reconciliation timestamps.
- Add provider webhook event inbox with signature/auth result, event ID,
  processing status, and immutable payload hash/limited diagnostic data.
- Add provider shipping/production quote snapshots and an order-item delivery
  estimate snapshot containing event date, destination, calendar, cutoff,
  safety buffer, source, quoted-at, and estimate wording/version.
- Add delivery estimate and printed selection fields to the normalized catalog
  and checkout request; reject stale or invalid variant/size selections.
- Add tracking carrier/number/status updates through the existing order model
  without changing payment status.

### Risks and acceptance tests

- Provider timeouts or ambiguous responses must leave a retryable job, never
  duplicate an order. Test stable idempotency keys and concurrent claims.
- Verify webhook signatures/authentication, duplicate/out-of-order events,
  cancellation, provider failure, variant unavailability, address rejection,
  replacement, and refund interaction.
- Test business-day cutoffs, weekends, holidays, missing provider data, safety
  buffers, impossible event dates, and timezone boundaries.
- Test mixed carts: digital entitlement is available after payment even when
  printed submission is delayed or fails.
- Prove staging cannot submit when the guard is absent or false; use a controlled
  provider test only after explicit authorization.

### Owner decisions needed

- Initial Printify shop/provider/blueprints and printed sizes/materials.
- Shipping countries (temporary default: US only), event-date timezone,
  holidays, production buffer, cutoff time, and estimate wording.

## Milestone 5 — Membership and category pricing engine

### Scope

Implement category-level member pricing and the configurable $29/year annual
membership. Deliver separate membership purchase first, then “join and save
today” in one checkout. Subscription purchase remains outside agent APIs.

### Expected components

- `src/features/pricing/` deterministic rule resolver, margin guard, price
  snapshot, and public/member display model.
- `src/features/membership/` Stripe subscription adapter, D1 state machine,
  portal links, event inbox, history/audit, and benefit eligibility.
- Admin rule editor and membership configuration/history views.
- Cart/product/checkout UI for regular price, member price, savings, and
  join-and-save messaging.

### Schema/API changes

- Add category/format discount rules with priority, effective dates, enabled
  state, contribution floor, and audit fields.
- Add membership plans/configuration, stable Stripe customer mapping,
  subscription state, current period, cancellation state, and membership audit
  history. Store the annual price as configuration and Stripe Price ID, not code.
- Add idempotent Stripe event records and membership benefit snapshots to orders.
- Extend checkout pricing responses with public/member prices and savings
  metadata without trusting client-provided values.

### Risks and acceptance tests

- Test category precedence: priority, deepest category, greatest valid discount,
  and margin-floor behavior.
- Test digital versus printed discounts, no shipping/tax discount, no stacking,
  inactive/expired/canceled/past-due/unpaid/trialing members, renewal, failed
  payment, refund, dispute, duplicate and out-of-order events.
- Test server-side repricing against tampered browser values.
- Test separate membership checkout, then combined membership plus one-time
  signs with both subscription and order created safely.
- Test a membership refund safeguard through configurable accounting state;
  final policy language remains owner/legal review, not invented by code.

### Owner decisions needed

- Final category discount percentages, contribution/margin floor, refund and
  cancellation policy, and whether trials are enabled.
- Stripe annual Price/account configuration and customer-portal settings.

## Milestone 6 — Native verified reviews

### Scope

Add D1-native verified-purchase reviews attached to the central Design. Start
with text and ratings; leave a clean extension path for customer photographs.

### Expected components

- Review tables/repository, expiring token service, submission route, rate
  limits, moderation/admin UI, merchant reply, abuse report, and audit history.
- Review-request scheduler/outbox integration for digital and delivered printed
  orders using the existing `EmailProvider` seam.
- Design-page aggregate and approved-review rendering.

### Schema/API changes

- Add reviews keyed to paid `order_item_id` and central `design_id`, with one
  unique review per order item, rating, body, display name, format indicator,
  moderation state, merchant response, timestamps, and optional photo slot.
- Add hashed/expiring review tokens, redemption state, request schedule/status,
  abuse reports, and moderation audit records.
- Public APIs expose only approved visible reviews and aggregates.

### Risks and acceptance tests

- Only paid order-item tokens can submit; tokens expire, cannot be reused, and
  cannot cross orders/designs.
- Test one-review-per-line-item, refund/chargeback behavior, moderation,
  aggregate recalculation, abuse reporting, merchant reply, duplicate email
  scheduling, and failure/retry in the outbox.
- Verify no review content reaches JSON-LD or page output before approval.
- Test digital request delay and printed delivered/fallback delay without sending
  uncontrolled email.

### Owner decisions needed

- Review moderation default, request delays, display-name policy, and future
  incentive/disclosure policy.

## Milestone 7 — SEO, AEO, GEO, schema, and machine feeds

### Scope

Make the normalized catalog authoritative for server-rendered metadata,
structured data, sitemap, feeds, bounded `llms.txt`, JSON API, and MCP output.

### Expected components

- Shared structured-data graph builder and consistency tests.
- Canonical/redirect/robots/noindex helpers, accurate sitemap lastmod, and
  durable editorial collection pages.
- Merchant Center feed and complete catalog feed/API pagination.
- Normalized design API and MCP projections with stable IDs, variants, formats,
  offers, member-price eligibility metadata, availability, and delivery limits.

### Schema/API changes

- Add or derive editable SEO/social fields, breadcrumbs, collection metadata,
  shipping/returns references, and published-content timestamps.
- Emit `ProductGroup` → `Product` → `Offer` for printed and digital paths,
  truthful ratings/reviews, shipping, returns, and loyalty-program entities.
- Bound `llms.txt` to store explanation, categories, popular/recent links, API,
  MCP, sitemap, and complete-feed links.

### Risks and acceptance tests

- JSON-LD must match visible price, member eligibility, availability, reviews,
  shipping, and delivery estimates. Unknown values must be omitted.
- Test canonical URLs, slug redirects, pagination, noindex search/cart/checkout/
  account/facet pages, staging headers/meta, sitemap lastmod, and 1,000-design
  feed generation.
- Validate representative output with Google Rich Results Test and Schema.org
  Validator; do not treat rich-result eligibility as guaranteed.
- Confirm API/MCP compatibility for legacy products and new designs.

### Owner decisions needed

- Editorial page priorities, return/shipping policy content, and final public
  brand/store copy.

## Milestone 8 — Event-oriented theme and discovery experience

### Scope

Create a store-owned theme that makes race-day signs legible, funny, and easy to
discover while preserving Minshop’s SSR, accessibility, caching, and storefront
boundary contracts.

### Expected components

- New `src/themes/event-day-signs/` theme with tokens, shell, catalog, cards,
  product detail, cart, membership, footer, and responsive layouts.
- Event/relationship/tone/family-friendly/format/deadline discovery controls.
- Editorial collection templates and internal-link modules.
- Product detail selection UI: complete digital bundle messaging versus explicit
  printed variant + size selection, plus instant-download/ready-by messaging.

### Schema/API changes

- No new commerce authority in the theme. Consume normalized view models only.
- Keep the existing theme contract and controls; do not import bindings, D1,
  checkout, or admin code from theme components.

### Risks and acceptance tests

- Test keyboard operation, focus states, semantic headings, alt text, reduced
  motion, mobile/desktop layouts, and basic performance budgets.
- Test ordinary purchase paths and membership promotion without obscuring the
  normal purchase path.
- Run storefront boundary, theme contract, visual smoke, and critical checkout
  browser tests across representative digital/printed/mixed carts.

### Owner decisions needed

- Brand direction, typography, color system, photography/assets, and final copy.

## Milestone 9 — Scale, AI-assisted administration, and optional agentic-commerce spike

### Scope

Complete resumable bulk catalog operations for approximately 1,000 designs,
load-test representative paths, optionally add deterministic AI-assisted drafts,
and investigate Stripe Agentic Commerce only if the account and current official
APIs support it.

### Expected components

- CSV/JSON manifest validator/importer with dry-run, idempotency, resume,
  partial-failure report, staged publication, asset association, and batch
  Printify mapping synchronization.
- Generated 1,000-design fixture/load tests for catalog, search, sitemap, API,
  feeds, and admin jobs without uploading production files.
- Provider interface for optional DeepSeek/LLM drafting, classification,
  tags, alt text, FAQ drafts, and content QA. Drafts require deterministic
  validation and human approval.
- Feature-gated Stripe Agentic Commerce spike limited to public one-time signs;
  no subscription purchase.

### Schema/API changes

- Add import jobs, source manifests, row results, checkpoints, suggestions,
  approvals, rollback references, and audit records.
- Add catalog-feed mapping/external references only if Stripe’s current seller
  APIs require them; keep Minshop SKU and price authority canonical.

### Risks and acceptance tests

- Missing rows in a partial import must never delete products. Retry/resume must
  be idempotent and produce a complete report.
- AI cannot publish, price, refund, change policy, or fulfill. Test approval,
  rollback, invalid/invented specifications, and auditability.
- Measure defined performance budgets for 1,000 designs and bounded feeds.
- If Stripe Agentic Commerce is unavailable, retain current agent-assisted
  redirect checkout and document the limitation; it must not affect normal
  checkout.

### Owner decisions needed

- Whether DeepSeek/LLM assistance is required before launch.
- Whether the Stripe account has approved Agentic Commerce access and whether to
  authorize the spike.

## Milestone 10 — Final pre-domain UAT and launch-readiness gate

### Scope

Run full end-to-end UAT and produce a GO/NO-GO recommendation while remaining
  on `workers.dev` with staging noindex. Do not purchase or configure a branded
  domain during this milestone.

### Expected components

- Full visitor/customer/member/admin test matrix for digital, printed, mixed,
  reviews, failures, retries, refunds, cancellations, and agent-assisted
  checkout.
- Security, accessibility, performance, SEO/schema, storage, cost, backup/
  export, retention/deletion, and operational reviews.
- Production configuration, rollback, incident, and legal/content checklists.
- Post-approval domain cutover document covering Worker domain,
  `CANONICAL_ORIGIN`, workers.dev disablement, Stripe live keys/webhooks,
  Printify webhook, Resend verification, Search Console, Merchant Center,
  analytics, sitemap, and removal of noindex.

### Acceptance tests

- No launch-blocking defect remains unresolved.
- Critical automated and manual tests pass in a supported environment.
- Staging remains noindex and no live payment/fulfillment path is accidentally
  enabled.
- Backup/export and restore procedures are demonstrated or explicitly accepted
  as operational follow-up.
- Owner receives an explicit GO/NO-GO recommendation and approves any cutover
  before domain work begins.

## Cross-milestone owner decision register

The following choices are intentionally deferred to the milestone where they
become irreversible or customer-visible:

1. Printify shop/provider/blueprints, printed sizes, materials, and shipping.
2. Digital bundle file formats, sizes, resolution, license text, and completeness
   rules for all variants/sizes.
3. Category discount percentages, margin floor, membership refund/cancellation
   policy, and final annual price.
4. Shipping countries, delivery calendar, cutoff/buffer, and estimate wording.
5. Review moderation and request timing.
6. Return/replacement and digital-refund policies.
7. Personalized text: launch scope or later release.
8. DeepSeek/LLM catalog operations: launch requirement or post-launch option.
9. Stripe Agentic Commerce spike approval and account availability.

## Explicitly beyond Milestone 10

There are no additional numbered milestones in the current product plan.
After Milestone 10 approval, the next work is the separately approved branded
domain cutover and launch operation, not an unplanned Milestone 11.
