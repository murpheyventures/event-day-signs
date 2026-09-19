-- 0040: normalized Event Day Signs catalog foundation.
-- Legacy products remain readable and purchasable during the catalog cutover.

CREATE TABLE designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  phrase TEXT,
  description TEXT,
  event_name TEXT,
  recipient TEXT,
  humor_family TEXT,
  readability_notes TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_designs_status_updated ON designs(status, updated_at DESC, id DESC);

CREATE TABLE design_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  design_id INTEGER NOT NULL REFERENCES designs(id),
  name TEXT NOT NULL,
  color_name TEXT,
  color_hex TEXT,
  preview_key TEXT,
  print_master_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_design_variants_design_order
  ON design_variants(design_id, status, sort_order, id);

CREATE TABLE offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  design_id INTEGER NOT NULL REFERENCES designs(id),
  variant_id INTEGER REFERENCES design_variants(id),
  format TEXT NOT NULL CHECK (format IN ('printed', 'digital')),
  sku TEXT,
  label TEXT,
  dimensions TEXT,
  material TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT 'available'
    CHECK (availability IN ('available', 'unavailable', 'archived')),
  stock INTEGER,
  requires_shipping INTEGER NOT NULL DEFAULT 0 CHECK (requires_shipping IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (format = 'digital' OR variant_id IS NOT NULL)
);

CREATE INDEX idx_offers_design_active ON offers(design_id, active, availability, id);
CREATE INDEX idx_offers_variant ON offers(variant_id);
