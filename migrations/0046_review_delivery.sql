-- 0046: normalized design linkage and bounded review-request delivery state.
ALTER TABLE order_items ADD COLUMN design_id INTEGER REFERENCES designs(id);
ALTER TABLE review_request_tokens ADD COLUMN token TEXT;
ALTER TABLE review_request_tokens ADD COLUMN sent_at TEXT;
ALTER TABLE review_request_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE review_request_tokens ADD COLUMN last_error TEXT;
ALTER TABLE reviews ADD COLUMN photo_key TEXT;

CREATE TABLE IF NOT EXISTS review_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES reviews(id),
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  reporter_hint TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS review_reports_status ON review_reports(status, created_at DESC);
