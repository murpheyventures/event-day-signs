import type { D1Database } from '@cloudflare/workers-types';
import { generatePublicId } from '../ids/publicId';

export type ReviewFormat = 'digital' | 'printed';
export type ReviewModerationState = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface Review {
  id: number;
  public_id: string;
  order_item_id: number;
  design_id: number;
  rating: number;
  body: string;
  display_name: string;
  format: ReviewFormat;
  moderation_state: ReviewModerationState;
  merchant_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRequestToken {
  token: string;
  orderItemId: number;
  designId: number;
  expiresAt: string;
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

/** Issue one expiring credential only for a paid order item. */
export async function createReviewRequestToken(
  db: D1Database,
  orderItemId: number,
  designId: number,
  expiresAt: string,
): Promise<ReviewRequestToken | null> {
  const token = randomToken();
  const inserted = await db
    .prepare(
      `INSERT INTO review_request_tokens (token_hash, order_item_id, design_id, expires_at)
       SELECT ?, oi.id, ?, ?
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.id = ? AND o.status = 'paid'
          AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = oi.id)
       RETURNING id`,
    )
    .bind(await hashToken(token), designId, expiresAt, orderItemId)
    .first<{ id: number }>();
  return inserted ? { token, orderItemId, designId, expiresAt } : null;
}

/** Consume a credential and create a pending review atomically. */
export async function submitVerifiedReview(
  db: D1Database,
  token: string,
  input: { rating: number; body: string; displayName: string; format: ReviewFormat },
): Promise<Review | null> {
  const tokenHash = await hashToken(token);
  const row = await db
    .prepare(
      `SELECT t.order_item_id, t.design_id
         FROM review_request_tokens t
        WHERE t.token_hash = ? AND t.redeemed_at IS NULL AND t.expires_at > datetime('now')
          AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = t.order_item_id)`,
    )
    .bind(tokenHash)
    .first<{ order_item_id: number; design_id: number }>();
  if (!row || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return null;
  const body = input.body.trim();
  const displayName = input.displayName.trim();
  if (body.length < 1 || body.length > 4000 || displayName.length < 1 || displayName.length > 120) return null;
  const reviewId = generatePublicId('review');
  const review = await db
    .prepare(
      `INSERT INTO reviews (public_id, order_item_id, design_id, rating, body, display_name, format)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(reviewId, row.order_item_id, row.design_id, input.rating, body, displayName, input.format)
    .first<Review>();
  if (!review) return null;
  await db.batch([
    db.prepare("UPDATE review_request_tokens SET redeemed_at = datetime('now') WHERE token_hash = ? AND redeemed_at IS NULL").bind(tokenHash),
    db.prepare('INSERT INTO review_audit (review_id, action, details_json) VALUES (?, ?, ?)').bind(review.id, 'submitted', JSON.stringify({ source: 'verified-order-item' })),
  ]);
  return review;
}

export async function listApprovedReviews(
  db: D1Database,
  designId: number,
  limit = 20,
): Promise<Review[]> {
  const { results } = await db
    .prepare("SELECT * FROM reviews WHERE design_id = ? AND moderation_state = 'approved' ORDER BY created_at DESC, id DESC LIMIT ?")
    .bind(designId, Math.max(1, Math.min(100, limit)))
    .all<Review>();
  return results ?? [];
}
