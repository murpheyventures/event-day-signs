import type { D1Database } from '@cloudflare/workers-types';
import { generatePublicId } from '../ids/publicId';
import { getEmailProvider } from '../email';
import { getConfig } from '../../config';

export type ReviewFormat = 'digital' | 'printed';
export type ReviewModerationState = 'pending' | 'approved' | 'rejected' | 'hidden';

export function formatReviewDisplayName(input: { firstName?: unknown; lastInitial?: unknown; anonymous?: unknown }): string | null {
  if (input.anonymous === true) return 'Anonymous';
  const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : '';
  const lastInitial = typeof input.lastInitial === 'string' ? input.lastInitial.trim() : '';
  if (!/^\p{L}[\p{L}' -]{0,59}$/u.test(firstName) || !/^\p{L}$/u.test(lastInitial)) return null;
  return `${firstName} ${lastInitial}.`;
}

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
      `INSERT INTO review_request_tokens (token_hash, token, order_item_id, design_id, expires_at)
       SELECT ?, ?, oi.id, ?, ?
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.id = ? AND o.status = 'paid'
          AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = oi.id)
       RETURNING id`,
    )
    .bind(await hashToken(token), token, orderItemId, designId, expiresAt)
    .first<{ id: number }>();
  return inserted ? { token, orderItemId, designId, expiresAt } : null;
}

export async function scheduleReviewRequests(db: D1Database, origin: string, limit = 10): Promise<number> {
  const emailer = await getEmailProvider();
  if (!emailer) return 0;
  const { results } = await db.prepare(`
    SELECT oi.id AS order_item_id, oi.design_id, oi.name, oi.file_key, o.email
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'paid' AND o.email IS NOT NULL AND oi.design_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = oi.id)
       AND NOT EXISTS (SELECT 1 FROM review_request_tokens t WHERE t.order_item_id = oi.id)
       AND ((oi.file_key IS NOT NULL AND o.created_at <= datetime('now', '-7 days'))
         OR (oi.file_key IS NULL AND o.fulfillment_status = 'fulfilled' AND o.fulfilled_at <= datetime('now', '-3 days')))
     ORDER BY o.created_at ASC LIMIT ?`).bind(Math.max(1, Math.min(50, limit))).all<{ order_item_id: number; design_id: number; name: string; email: string; }>();
  let sent = 0;
  for (const item of results ?? []) {
    const request = await createReviewRequestToken(db, item.order_item_id, item.design_id, new Date(Date.now() + 30 * 86400000).toISOString());
    if (!request) continue;
    const url = `${origin}/review?token=${encodeURIComponent(request.token)}`;
    try {
      await emailer.send({
        to: item.email,
        subject: `How was your ${getConfig().storeName} purchase?`,
        text: `We would love your feedback about ${item.name}. Leave a review: ${url}`,
        html: `<p>We would love your feedback about <strong>${item.name.replace(/[<>&]/g, '')}</strong>.</p><p><a href="${url}">Leave a verified review</a></p>`,
        idempotencyKey: `review-request/${item.order_item_id}`,
      });
      await db.prepare("UPDATE review_request_tokens SET sent_at = datetime('now'), attempts = attempts + 1 WHERE order_item_id = ?").bind(item.order_item_id).run();
      sent++;
    } catch (error) {
      await db.prepare("UPDATE review_request_tokens SET attempts = attempts + 1, last_error = ? WHERE order_item_id = ?").bind(String(error).slice(0, 500), item.order_item_id).run();
    }
  }
  return sent;
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

export async function listReviews(db: D1Database, state: ReviewModerationState | 'all' = 'all'): Promise<Review[]> {
  const where = state === 'all' ? '' : ' WHERE moderation_state = ?';
  const query = `SELECT * FROM reviews${where} ORDER BY created_at DESC, id DESC LIMIT 200`;
  const result = state === 'all' ? await db.prepare(query).all<Review>() : await db.prepare(query).bind(state).all<Review>();
  return result.results ?? [];
}

export async function moderateReview(db: D1Database, publicId: string, state: Exclude<ReviewModerationState, 'pending'>, merchantResponse?: string | null): Promise<boolean> {
  const result = await db.prepare("UPDATE reviews SET moderation_state = ?, merchant_response = COALESCE(?, merchant_response), updated_at = datetime('now') WHERE public_id = ?").bind(state, merchantResponse?.trim() || null, publicId).run();
  if ((result.meta.changes ?? 0) === 0) return false;
  const row = await db.prepare('SELECT id FROM reviews WHERE public_id = ?').bind(publicId).first<{ id: number }>();
  if (row) await db.prepare('INSERT INTO review_audit (review_id, action, details_json) VALUES (?, ?, ?)').bind(row.id, state, JSON.stringify({ merchantResponse: merchantResponse?.trim() || null })).run();
  return true;
}

export async function reviewSummary(db: D1Database, designId: number): Promise<{ count: number; average: number | null }> {
  const row = await db.prepare("SELECT COUNT(*) AS count, AVG(rating) AS average FROM reviews WHERE design_id = ? AND moderation_state = 'approved'").bind(designId).first<{ count: number; average: number | null }>();
  return { count: row?.count ?? 0, average: row?.average ?? null };
}

export async function reportReview(db: D1Database, reviewPublicId: string, reason: string, reporterHint: string | null): Promise<boolean> {
  const review = await db.prepare('SELECT id FROM reviews WHERE public_id = ?').bind(reviewPublicId).first<{ id: number }>();
  const clean = reason.trim();
  if (!review || clean.length < 1 || clean.length > 500) return false;
  await db.prepare('INSERT INTO review_reports (review_id, reason, reporter_hint) VALUES (?, ?, ?)').bind(review.id, clean, reporterHint).run();
  return true;
}
