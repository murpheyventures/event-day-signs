# Event Day Signs — Milestone 7 Checklist

Status: implementation complete; Cloudflare staging verification completed on
2026-09-20. Product snippets are valid in Google's Rich Results Test. Merchant
listings still require an image follow-up, and the supported Linux integration
gate remains open.

## Completed in this slice

- [x] Add a shared, pure structured-data builder for normalized product groups.
- [x] Emit separate digital and printed offers with truthful price, currency,
  availability, shipping, and optional approved-review aggregate data.
- [x] Escape structured-data script content so catalog values cannot close the
  JSON-LD script element.
- [x] Preserve editable normalized-design SEO title and description fields in
  the storefront model.
- [x] Expose normalized offer IDs, formats, availability, shipping requirement,
  and SKU in the public catalog detail projection without removing legacy keys.
- [x] Add focused unit coverage for the graph shape, offer availability, and
  script escaping.

## Remaining

- [x] Make normalized designs authoritative in paginated list/feed queries.
- [x] Add shared canonical/robots/noindex helpers and accurate sitemap lastmod.
- [x] Add Merchant Center and complete catalog feed projections.
- [x] Align MCP buyer projections with the public normalized catalog contract.
- [x] Validate the representative normalized product with Google's Rich Results
  Test: Product snippets are valid and eligible.
- [ ] Resolve Merchant listings' critical missing `image` field on the
  `ProductGroup` and each variant `Product`.
- [ ] Re-run Google's Rich Results Test after images are emitted and confirm all
  five Merchant listing items are valid.
- [ ] Run the Schema.org Markup Validator against the same representative page.
- [ ] Run the complete Linux-supported integration/MCP verification gate.
- [x] Complete Cloudflare staging verification; supported-environment integration
  remains open.

## Operational verification attempt — 2026-09-20

- [x] Confirm the staging Worker is reachable at
  `https://event-day-signs-staging.stephen-8cc.workers.dev/`.
- [x] Confirm the published staging product page renders the supplied test
  product, both printed sizes, and the purchase controls.
- [x] Deploy the Milestone 7 build to the dedicated staging Worker. The final
  deployed Worker version is `cb8ff5cc-78fc-4ad7-820a-a056312c96a0`.
- [x] Apply the authorized staging-only migrations `0044`, `0045`, and `0046`.
- [x] Verify `/api/products` returns the legacy product and normalized design
  projections, including normalized offers and `source: "design"`.
- [x] Verify the normalized design detail page returns HTTP 200 and emits
  `ProductGroup` JSON-LD with canonical metadata.
- [x] Verify `/llms.txt`, `/sitemap.xml`, `/robots.txt`, and
  `/feed/google.xml`; the feed includes Google product namespace, price, and
  availability, while the sitemap includes normalized URLs and `lastmod`.
- [x] Verify `/search` and `/cart` return `noindex, nofollow` metadata.
- [x] Validate representative JSON-LD with Google's Rich Results Test. The
  report at
  `https://search.google.com/test/rich-results/result?id=KcjqvblPx-MxbsnEsMwhxw`
  found one valid Product snippet item and five invalid Merchant listing items.
- [ ] Fix the Merchant listing critical issue: `image` is missing from the
  normalized `ProductGroup` and each variant `Product`. Google also reports
  optional warnings for variant descriptions, global identifiers, return
  policy, and shipping details; triage those after the critical image fix.
- [ ] Re-run the Rich Results Test and validate the final JSON-LD with the
  Schema.org Markup Validator.
- [ ] Run the complete verification suite on Linux CI or another supported
  environment.

The Cloudflare staging endpoint matrix passed after the migrations were
applied. The remaining validation requires a supported external/schema tool or
Linux CI; the local Windows `npm run verify` baseline remains documented in the
project handoff.
