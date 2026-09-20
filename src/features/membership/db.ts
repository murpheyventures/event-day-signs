import type { D1Database } from '@cloudflare/workers-types';
import { generatePublicId } from '../ids/publicId';

export type MembershipStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface MembershipPlan {
  id: number;
  public_id: string | null;
  name: string;
  currency: string;
  annual_price_cents: number;
  stripe_price_id: string | null;
  enabled: number;
}

export interface Membership {
  id: number;
  public_id: string;
  email: string;
  plan_id: number;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: MembershipStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  canceled_at: string | null;
  ended_at: string | null;
}

export interface MembershipEvent {
  id: number;
  stripe_event_id: string;
  event_type: string;
}

export interface StripeMembershipUpdate {
  eventId: string;
  eventType: string;
  subscriptionId: string;
  customerId: string;
  email: string | null;
  planPublicId: string | null;
  status: MembershipStatus;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  endedAt: string | null;
  details?: Record<string, unknown>;
}

export async function getEnabledPlan(db: D1Database): Promise<MembershipPlan | null> {
  return db
    .prepare('SELECT * FROM membership_plans WHERE enabled = 1 LIMIT 1')
    .first<MembershipPlan>();
}

export async function getPlanByPublicId(db: D1Database, publicId: string): Promise<MembershipPlan | null> {
  return db.prepare('SELECT * FROM membership_plans WHERE public_id = ?').bind(publicId).first<MembershipPlan>();
}

export async function getMembershipByEmail(db: D1Database, email: string): Promise<Membership | null> {
  return db
    .prepare(
      `SELECT m.*, c.email, c.stripe_customer_id
       FROM memberships m JOIN membership_customers c ON c.id = m.customer_id
       WHERE lower(c.email) = lower(?)
       ORDER BY CASE WHEN m.status IN ('active','trialing') THEN 0 ELSE 1 END, m.updated_at DESC
       LIMIT 1`,
    )
    .bind(email.trim())
    .first<Membership>();
}

export async function hasActiveMembership(db: D1Database, email: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS active FROM memberships m
       JOIN membership_customers c ON c.id = m.customer_id
       WHERE lower(c.email) = lower(?)
         AND m.status IN ('active','trialing')
         AND (m.current_period_end IS NULL OR m.current_period_end > datetime('now'))
       LIMIT 1`,
    )
    .bind(email.trim())
    .first<{ active: number }>();
  return row?.active === 1;
}

export async function recordStripeMembershipEvent(
  db: D1Database,
  update: StripeMembershipUpdate,
  payloadHash: string | null = null,
): Promise<'processed' | 'duplicate'> {
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO membership_events
       (stripe_event_id, event_type, payload_hash, status)
       VALUES (?, ?, ?, 'processed')`,
    )
    .bind(update.eventId, update.eventType, payloadHash)
    .run();
  if ((inserted.meta?.changes ?? 0) === 0) return 'duplicate';

  const customer = await db
    .prepare(
      `INSERT INTO membership_customers (email, stripe_customer_id)
       VALUES (?, ?)
       ON CONFLICT(stripe_customer_id) DO UPDATE SET
         email = COALESCE(excluded.email, membership_customers.email),
         updated_at = datetime('now')
       RETURNING id`,
    )
    .bind(update.email ?? `${update.customerId}@stripe.invalid`, update.customerId)
    .first<{ id: number }>();
  if (!customer) throw new Error('Could not persist Stripe customer.');

  const plan = update.planPublicId
    ? await getPlanByPublicId(db, update.planPublicId)
    : await getEnabledPlan(db);
  if (!plan) throw new Error('No membership plan is configured for this Stripe subscription.');

  const membership = await db
    .prepare(
      `INSERT INTO memberships (
         public_id, customer_id, plan_id, stripe_subscription_id, status,
         current_period_start, current_period_end, cancel_at_period_end,
         canceled_at, ended_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(stripe_subscription_id) DO UPDATE SET
         customer_id = excluded.customer_id,
         plan_id = excluded.plan_id,
         status = excluded.status,
         current_period_start = excluded.current_period_start,
         current_period_end = excluded.current_period_end,
         cancel_at_period_end = excluded.cancel_at_period_end,
         canceled_at = excluded.canceled_at,
         ended_at = excluded.ended_at,
         updated_at = datetime('now')
       RETURNING id`,
    )
    .bind(
      generatePublicId('membership'),
      customer.id,
      plan.id,
      update.subscriptionId,
      update.status,
      update.periodStart,
      update.periodEnd,
      update.cancelAtPeriodEnd ? 1 : 0,
      update.canceledAt,
      update.endedAt,
    )
    .first<{ id: number }>();
  if (!membership) throw new Error('Could not persist membership state.');

  const event = await db
    .prepare('SELECT id FROM membership_events WHERE stripe_event_id = ?')
    .bind(update.eventId)
    .first<MembershipEvent>();
  await db
    .prepare(
      `INSERT INTO membership_audit (membership_id, event_id, action, details_json)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(membership.id, event?.id ?? null, update.eventType, JSON.stringify(update.details ?? {}))
    .run();
  return 'processed';
}
