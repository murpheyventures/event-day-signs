-- 0044: preserve the membership benefit decision made at checkout.
ALTER TABLE checkout_reservations ADD COLUMN membership_snapshot_json TEXT;
