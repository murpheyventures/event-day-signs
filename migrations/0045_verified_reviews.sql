-- 0045: verified-purchase reviews and expiring review-request credentials.
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  design_id INTEGER NOT NULL REFERENCES designs(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
  format TEXT NOT NULL CHECK (format IN ('digital', 'printed')),
  moderation_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_state IN ('pending', 'approved', 'rejected', 'hidden')),
  merchant_response TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(order_item_id)
);

CREATE INDEX IF NOT EXISTS reviews_design_visible
  ON reviews (design_id, moderation_state, created_at DESC);

CREATE TABLE IF NOT EXISTS review_request_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  design_id INTEGER NOT NULL REFERENCES designs(id),
  expires_at TEXT NOT NULL,
  redeemed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS review_tokens_expiry
  ON review_request_tokens (expires_at, redeemed_at);

CREATE TABLE IF NOT EXISTS review_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES reviews(id),
  action TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
