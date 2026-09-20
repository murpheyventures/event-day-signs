# Event Day Signs — Milestone 8 Checklist

Status: implementation complete for the store-owned theme surface. The theme
is active through `theme.config.json` and keeps discovery server-owned: event,
recipient, tone, family-friendly, format, and deadline taxonomy remains
represented by configured category/search/catalog data rather than a second
client-side filtering authority.

## Completed

- [x] Add `src/themes/event-day-signs/` with tokens, shell, catalog, cards,
  product detail, content-page frame, footer, and responsive layouts.
- [x] Establish the visual direction: warm paper, race-day yellow, signal
  orange, teal utility color, readable system fonts, and strong focus states.
- [x] Keep templates props-only and compose the existing StoreNav, StoreSearch,
  StoreImage, ProductGallery, ProductPurchaseForm, CatalogSort, and
  CatalogPagination controls.
- [x] Add the event-oriented discovery rail. Category links remain canonical
  internal collection links, while search and sort remain available for phrase,
  format, and deadline-oriented catalog discovery.
- [x] Add editorial/internal-link modules through the discovery rail, related
  product section, footer navigation, and content-page frame.
- [x] Make product detail delivery intent explicit: complete digital bundle /
  instant download messaging, printed-size selection through the normalized
  purchase control, and ready-to-ship messaging for physical offers.
- [x] Preserve normal Add to cart and Buy now paths without replacing
  server-owned purchase controls.
- [x] Add reduced-motion handling, semantic landmarks/headings, visible focus
  states, responsive layouts, and StoreImage-provided alt/LCP behavior.
- [x] Pass the storefront contract suite, theme boundary check, Astro type
  check, production build, and built-CSS isolation check.

## Verification notes

- `npm run test:storefront-contract`: passed, 181 tests.
- `npm run theme:check`: passed.
- `npm run check`: passed with 0 errors and 2 existing hints.
- `npm run build`: passed.
- `node scripts/check-built-css.mjs`: passed; active theme present and all
  inactive themes excluded.
- The complete `npm run verify` command still encounters the repository's
  existing Windows-only Vitest resolution failures for `cloudflare:workers` in
  four non-storefront cache/email suites. No Milestone 8 storefront failures
  were observed.

## Deliberate boundary

Milestone 8 does not add schema, API, checkout, delivery-estimate, or client
filter authority. Those values belong in normalized catalog models and the
catalog loader. When deadline-aware estimates are added by the fulfillment
milestone, this theme's ready-by copy is the presentation slot for that model;
it must not calculate an estimate in Astro templates.
