# Event Day Signs — Milestone 0 Architecture Review

Status: Approved by owner; committed in `be63aa8`
Baseline: `ddyy/minshop` at `c964bf746926ae039a97d69720eee26fb97ba06f`  
Fork: `https://github.com/murpheyventures/event-day-signs`  
Deployment target: Cloudflare Workers + D1 + R2 on `workers.dev`

## Scope and non-goals

This document proposes the durable seams and migration shape for the event-sign
catalog. It does not implement product features, create Cloudflare resources,
configure Stripe/Printify/Resend, or commit code. Business choices still marked
temporary must be confirmed at the milestone where they affect customer-facing
behavior.

## Baseline findings

- Astro SSR runs on Cloudflare Workers with D1 and R2 bindings.
- Provider ports already exist for payments, storage, email, shipping, and
  search. Stripe is an existing payment adapter; demo, Lightning, and OpenNode
  must remain available.
- The current catalog is `products` plus categories, product variants, extras,
  images, stock, and one optional digital file per product.
- Checkout already resolves public IDs, reserves inventory, reprices on the
  server, and records paid orders idempotently from verified webhooks.
- Digital delivery currently snapshots a file on `order_items` and serves it
  through a token-addressed download route. It needs a bundle/version/entitlement
  layer for the requested multi-file digital offers and revocation rules.
- Customer accounts are passwordless magic-link accounts keyed to order email.
- The public JSON catalog/checkout API and the separate MCP Worker already exist.
  MCP buyer tools proxy the public API; operator tools are bearer-token gated.
- Admin settings store encrypted provider credentials in D1; deployment-only
  secrets use Worker secrets.
- Migrations are numbered and additive. Existing migrations must not be edited.

## Proposed catalog model

The new event catalog becomes authoritative for new designs. The existing
product-centric catalog remains supported through a compatibility adapter until
all public catalog, checkout, admin, and MCP paths have moved to offers.

```text
Design
  └─ DesignVariant (colorway/treatment + preview/master versions)
       └─ Offer/SKU (printed size/material/availability/price + selected variant)
            └─ PrintMapping → Printify product/blueprint/provider/variant
  └─ DigitalBundle (all approved variants and sizes)
       └─ DigitalBundleFile[]
```

Proposed additive tables:

- `designs`: stable public ID, slug, phrase, title, description, event and
  recipient metadata, humor/family flags, readability guidance, SEO/social
  fields, publication state, timestamps.
- `design_variants`: design relationship, variant name/color metadata, preview
  object/version, print-master object/version, sort order, publication state.
- `offers`: printed variant relationship, format, SKU, dimensions/material,
  price and currency, availability, shipping requirement, production/shipping
  metadata, membership-price eligibility metadata, and lifecycle timestamps.
  Printed checkout must resolve both a size and a DesignVariant/colorway.
- `digital_bundles` and `digital_bundle_files`: design-level versioned manifests
  containing every approved variant and size in the bundle, plus format,
  resolution, object key, file hash/size, license version, and publication
  state. A digital purchase does not require selecting one variant or size;
  the customer receives the complete bundle. Private R2 keys never enter public
  API responses.
- `print_mappings`: offer-to-Printify mapping plus blueprint/provider/variant
  IDs, uploaded asset IDs, sync state, and mapping version.
- `design_categories`: many-to-many relationship to the existing category
  taxonomy, with category hierarchy retained for future event types.
- `category_discount_rules`: category, format, percentage, priority,
  effective window, enabled state, margin/contribution guard, and audit fields.

Orders should snapshot the resolved offer, price, format, design/variant
identity when printed, the complete digital bundle version and manifest when
digital, the print mapping version when printed, and the delivery estimate.
The server remains the only authority for prices, discounts, inventory,
entitlements, and fulfillment decisions.

### Compatibility strategy

Do not duplicate the new catalog as the long-term source of truth. During the
migration, legacy `products` remain readable and purchasable. A catalog adapter
will expose a normalized offer shape to storefront, API, checkout, and MCP.
New design offers use the new tables; legacy rows are represented as
compatibility offers. Existing numeric row IDs stay internal, while public
`prod_`/design/offer IDs are stable and non-sensitive.

This keeps the upstream demo store usable while avoiding a second permanent
product model. The compatibility layer can be retired only after existing
catalog, order-history, admin, and MCP contract tests are migrated.

## Provider and workflow seams

- Stripe: extend the existing `PaymentProvider` adapter for one-time offer
  checkout and add a separate membership service/adapter. Verified,
  idempotent webhooks update membership and order state; subscription purchase
  is not exposed through agent tools initially.
- Printify: add a `FulfillmentProvider` port. Catalog synchronization, asset
  upload, order submission, webhook normalization, retries, and reconciliation
  stay outside checkout. A protected staging guard must prevent live orders.
- Storage: retain public preview storage and private deliverable/master storage
  as separate R2 bindings/buckets. Protected download tokens resolve through the
  application, never direct public R2 URLs.
- Email: use the existing `EmailProvider` and outbox. Resend review requests and
  tracking notifications must be idempotent and testable without uncontrolled
  sends.
- Delivery estimates: add a pure calculator port that consumes provider data or
  admin-configured production/transit/calendar assumptions. Snapshot quote and
  assumptions at cart/order time; label all results as estimates.
- Reviews: add a first-party D1 workflow keyed to paid order-item tokens and
  central design IDs. Only approved reviews can affect public aggregates or
  structured data.

## API and rendering direction

- Keep server-rendered Astro pages and near-zero client JavaScript.
- Add a normalized design/variant/offer representation to the existing public
  JSON API without leaking costs, private objects, or admin fields.
- Preserve current one-time MCP buyer tools and redirect checkout behavior.
  Subscription purchase remains unavailable to agents.
- Generate JSON-LD, sitemap, Merchant Center, `llms.txt`, and MCP/API data from
  the same normalized catalog reader.
- Keep staging `noindex` at both HTML and response-header layers once staging is
  deployed; do not emit a production canonical origin before a branded domain
  exists.

## Key conflicts and smallest durable responses

1. **Product-centric upstream model vs. central Design model.** Use the
   normalized catalog adapter and additive design/offer tables; preserve legacy
   product rows during migration instead of rewriting all upstream paths at once.
2. **One file per product vs. complete digital bundles.** Keep legacy file
   columns for compatibility and add a design-level versioned bundle/file model
   for new digital purchases. Digital bundles include all approved variants and
   sizes; printed purchases resolve one explicit variant and size.
3. **Product stock vs. printed provider availability.** Treat digital availability,
   legacy stock, and Printify/provider availability as separate offer-level
   states. Never infer Printify inventory from legacy product stock.
4. **Current checkout provider port vs. Printify fulfillment.** Add a fulfillment
   port rather than putting Printify calls in payment webhooks or checkout.
5. **Current unbounded `llms.txt` catalog behavior vs. bounded discovery.** Keep
   the paginated JSON API authoritative and change `llms.txt` to a bounded index
   plus complete-feed link in the SEO milestone.
6. **Current test/tooling assumptions on Windows.** Baseline currently exposes
   upstream path-separator, `cloudflare:workers` Vitest, Bash, telemetry-write,
   and D1 migration parsing issues. These are recorded as baseline blockers and
   should not be silently fixed as part of the first feature milestone.

## Risks and mitigations

- **Catalog migration scope:** move one read/write boundary at a time and keep
  compatibility contract tests green.
- **Price drift:** resolve offers and discount rules in one server-side pricing
  service immediately before checkout; snapshot the result.
- **Webhook duplication/out-of-order delivery:** use provider event IDs and
  state-transition guards for Stripe and Printify.
- **Private asset leakage:** separate bindings, opaque keys, short-lived scoped
  tokens, download limits, and refund/chargeback revocation.
- **Printify API variability:** persist mapping/version/request status and add a
  retry/reconcile path; never create products during paid checkout.
- **SEO duplication:** canonical design pages, noindex internal facets/search,
  factual visible content, and one generated structured-data graph.
- **1,000-design scale:** keyset pagination for jobs, idempotent resumable import,
  bounded feeds, and generated load-test fixtures instead of production files.

## Temporary assumptions

- Store/project name: Event Day Signs.
- Currency: USD.
- Initial shipping: United States only.
- Staging: `workers.dev`, Stripe test mode, no live Printify submission.
- Membership launch price: configurable placeholder of $29/year; not a final
  legal or pricing decision.
- Printed provider, sizes, materials, digital bundle contents, policies, and
  margin floors remain owner decisions before their milestones.

## Owner decisions requested for architecture approval

1. Approve the normalized `Design → DesignVariant → Offer` model and the
   compatibility adapter for existing Minshop products.
2. Confirm that new digital bundles and Printify mappings should be versioned
   entitlements/mappings rather than fields on a single product row.
3. Confirm that staging may use separate public/private R2 resources and that
   no live Printify submission is permitted by default.
4. Confirm that the existing public JSON API and MCP buyer tools remain backward
   compatible for legacy one-time products while the normalized catalog rolls out.
5. Confirm that the remaining business choices can stay temporary until the
   relevant milestone listed in the build prompt.
