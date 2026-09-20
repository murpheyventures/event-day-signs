# Test Product Intake — “Suck it up princess”

Use the prompt below with Claude to create a staging-only product package. Send
the resulting files, manifest, and Printify catalog evidence back to Codex for
import and verification. Do not submit a live Printify order.

```text
Create a complete staging/test-product package for the Event Day Signs store.

Product title: “Suck it up princess”

Create one product with two clearly distinct design variants. Keep the phrase
exactly as written. Use legible typography, strong contrast, and no copyrighted
characters, logos, or third-party artwork.

Research the connected Printify catalog and select one appropriate printed
poster/sign product plus exactly two practical print sizes. Prefer common,
affordable US-friendly sizes with reliable availability, reasonable shipping,
consistent material/finish, and good readability. Do not invent Printify IDs.
If the catalog is unavailable, mark the missing values instead of guessing.

For each printed size, provide the human-readable size, inch dimensions, 300-DPI
pixel dimensions, Printify product/blueprint ID, variant ID, product name,
material, finish, base cost, shipping estimate, and source URL.

Create a digital bundle containing all four combinations:

- Design 1 / Size 1
- Design 1 / Size 2
- Design 2 / Size 1
- Design 2 / Size 2

Provide editable SVG source files, rendered previews, print-ready PDF and/or
300-DPI PNG files, and mockups when available. For every digital file provide
its path/name, design, size, pixel dimensions, physical dimensions, DPI, color
profile, format, file size, and SHA-256 hash when available.

Return these artifacts:

1. product-manifest.json
2. README.md
3. Two design preview images
4. Two editable design source files
5. Four print-ready digital files
6. One mockup per design when available
7. Printify catalog screenshots or source references

The product-manifest.json must include product title/description, two design
records, one Printify printed-product record with exactly two sizes, and a
digital_bundle.files array with exactly four design-size records. Use these
fields for each size: id, label, width_inches, height_inches,
width_px_300dpi, height_px_300dpi, variant_id, base_cost_cents, currency,
source_url. Use these fields for each digital file: design_id, size_id, file,
format, width_px, height_px, dpi, sha256.

At the end, report whether both designs exist, exactly two printed sizes exist,
all four digital combinations exist, all files open, Printify IDs are verified,
and no live Printify order was submitted. Clearly list unresolved issues.
```

Codex will use the package to create a staging test product, keep live Printify
submission disabled, and verify the printed variant/size mapping plus the
complete digital bundle before any provider test order is considered.
