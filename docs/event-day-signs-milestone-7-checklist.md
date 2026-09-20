# Event Day Signs — Milestone 7 Checklist

Status: implementation complete; supported-environment validation remains an
and normalized catalog projection foundation.

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
- [ ] Validate representative JSON-LD with Schema.org and Rich Results tooling.
- [ ] Run supported-environment integration and staging verification.
