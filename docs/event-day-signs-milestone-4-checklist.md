# Event Day Signs — Milestone 4 Checklist

Status: SEO/discovery boundary implemented; deployment validation pending
Scope: bounded agent discovery and canonical crawl policy

## Completed

- [x] Bound `llms.txt` to the first 50 active products.
- [x] Keep the paginated JSON catalog as the authoritative complete feed and
  document how agents walk it.
- [x] Preserve canonical product, category, page, sitemap, and optional MCP
  discovery links.
- [x] Add pure unit coverage for bounded discovery output and MCP omission.

## Validation gate

- [ ] Verify the bounded output against a staging catalog larger than 50 items.
- [ ] Verify every product in the complete paginated JSON feed has one
  canonical sitemap URL.
- [ ] Run the complete verification suite in Linux CI or another supported
  environment.

No production deployment or remote data migration is part of Milestone 4.
