-- 0041: versioned digital bundles and provider fulfillment mappings.
-- These records are intentionally separate from checkout and payment state.

CREATE TABLE digital_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  design_id INTEGER NOT NULL REFERENCES designs(id),
  version INTEGER NOT NULL CHECK (version > 0),
  label TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (design_id, version)
);

CREATE INDEX idx_digital_bundles_design_status
  ON digital_bundles(design_id, status, version DESC);

CREATE TABLE digital_bundle_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  bundle_id INTEGER NOT NULL REFERENCES digital_bundles(id),
  variant_id INTEGER REFERENCES design_variants(id),
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_mime TEXT,
  file_size_bytes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bundle_assets_bundle_order
  ON digital_bundle_assets(bundle_id, sort_order, id);

ALTER TABLE offers ADD COLUMN digital_bundle_id INTEGER REFERENCES digital_bundles(id);

CREATE TABLE print_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  offer_id INTEGER NOT NULL REFERENCES offers(id),
  provider TEXT NOT NULL,
  external_product_id TEXT,
  blueprint_id TEXT,
  provider_variant_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'disabled', 'error')),
  metadata_json TEXT,
  last_error TEXT,
  synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider, offer_id)
);

CREATE INDEX idx_print_mappings_status ON print_mappings(provider, status, updated_at DESC);

CREATE TABLE fulfillment_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  offer_id INTEGER REFERENCES offers(id),
  provider TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'fulfilled', 'failed', 'cancelled')),
  external_order_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  submitted_at TEXT,
  fulfilled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fulfillment_jobs_status ON fulfillment_jobs(status, updated_at, id);
