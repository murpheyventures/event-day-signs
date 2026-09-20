-- 0043: Stripe membership state, idempotent events, and order benefit snapshots.
-- All rows are additive. Stripe is the source of payment truth; D1 is the
-- application read model used for eligibility and pricing.

CREATE TABLE IF NOT EXISTS membership_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES membership_customers(id),
  plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0, 1)),
  canceled_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS memberships_customer_status
  ON memberships (customer_id, status, current_period_end DESC);

CREATE TABLE IF NOT EXISTS membership_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload_hash TEXT,
  status TEXT NOT NULL DEFAULT 'processed'
    CHECK (status IN ('processed','failed')),
  error_message TEXT,
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS membership_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membership_id INTEGER REFERENCES memberships(id),
  event_id INTEGER REFERENCES membership_events(id),
  action TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO membership_plans
  (public_id, name, currency, annual_price_cents, enabled)
VALUES
  ('mplan_annual', 'Annual membership', 'USD', 2900, 0);

ALTER TABLE orders ADD COLUMN membership_snapshot_json TEXT;
