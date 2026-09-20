-- 0042: configurable category pricing and membership plan foundations.
-- Rules are data, not code, so merchants can change pricing without deploys.

CREATE TABLE IF NOT EXISTS pricing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  format TEXT CHECK (format IS NULL OR format IN ('digital', 'printed')),
  priority INTEGER NOT NULL DEFAULT 0,
  discount_bps INTEGER NOT NULL CHECK (discount_bps BETWEEN 0 AND 10000),
  contribution_floor_cents INTEGER NOT NULL DEFAULT 0 CHECK (contribution_floor_cents >= 0),
  effective_from TEXT,
  effective_until TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_until > effective_from)
);

CREATE INDEX IF NOT EXISTS pricing_rules_lookup
  ON pricing_rules (enabled, category_id, format, priority DESC);

CREATE TABLE IF NOT EXISTS membership_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  annual_price_cents INTEGER NOT NULL CHECK (annual_price_cents >= 0),
  stripe_price_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_plans_one_enabled
  ON membership_plans (enabled)
  WHERE enabled = 1;
