import Stripe from 'stripe';
import type { D1Database } from '@cloudflare/workers-types';
import { getSecret } from '../secrets/store';
import { getEnabledPlan, recordStripeMembershipEvent, type MembershipStatus, type StripeMembershipUpdate } from './db';

function stripeClient(secret: string): Stripe {
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
}

function iso(unix: number | null | undefined): string | null {
  return unix == null ? null : new Date(unix * 1000).toISOString();
}

function status(value: string | null | undefined): MembershipStatus {
  const allowed: MembershipStatus[] = ['trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused'];
  return allowed.includes(value as MembershipStatus) ? (value as MembershipStatus) : 'incomplete';
}

export async function createMembershipCheckout(
  db: D1Database,
  origin: string,
  email: string,
): Promise<string> {
  const plan = await getEnabledPlan(db);
  if (!plan?.stripe_price_id || !plan.public_id) {
    throw new Error('Membership is not configured with a Stripe Price ID.');
  }
  const secret = await getSecret(db, 'stripe_secret_key');
  if (!secret) throw new Error('Stripe is not configured.');
  const session = await stripeClient(secret).checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    customer_email: email,
    success_url: `${origin}/membership?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/membership?status=cancelled`,
    metadata: { membership_plan_id: plan.public_id },
    subscription_data: { metadata: { membership_plan_id: plan.public_id } },
  });
  if (!session.url) throw new Error('Stripe did not return a membership checkout URL.');
  return session.url;
}

export async function createMembershipPortal(
  db: D1Database,
  origin: string,
  email: string,
): Promise<string> {
  const secret = await getSecret(db, 'stripe_secret_key');
  if (!secret) throw new Error('Stripe is not configured.');
  const row = await db
    .prepare(
      `SELECT c.stripe_customer_id FROM membership_customers c
       WHERE lower(c.email) = lower(?) LIMIT 1`,
    )
    .bind(email.trim())
    .first<{ stripe_customer_id: string }>();
  if (!row) throw new Error('No Stripe customer is associated with this email.');
  const session = await stripeClient(secret).billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${origin}/membership`,
  });
  return session.url;
}

export async function handleMembershipWebhook(
  db: D1Database,
  payload: string,
  headers: Headers,
): Promise<'processed' | 'duplicate'> {
  const secret = await getSecret(db, 'stripe_membership_webhook_secret');
  if (!secret) throw new Error('Stripe webhook signing secret is not configured.');
  const signature = headers.get('stripe-signature');
  if (!signature) throw new Error('Missing stripe-signature header.');
  const stripe = stripeClient(await getSecret(db, 'stripe_secret_key') ?? 'sk_test_placeholder');
  const event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  const object = event.data.object as unknown as Record<string, any>;
  const subscription = event.type.startsWith('customer.subscription.')
    ? object
    : event.type.startsWith('invoice.')
      ? object.subscription && typeof object.subscription === 'object' ? object.subscription : null
      : event.type === 'checkout.session.completed' && object.subscription ? null : null;
  const subscriptionId = typeof object.subscription === 'string'
    ? object.subscription
    : typeof object.id === 'string' && event.type.startsWith('customer.subscription.') ? object.id
    : subscription?.id;
  if (!subscriptionId) return 'processed';
  const customer = typeof object.customer === 'string' ? object.customer : subscription?.customer;
  if (typeof customer !== 'string') return 'processed';
  const item = subscription?.items?.data?.[0] ?? object.lines?.data?.[0];
  const planPublicId = object.metadata?.membership_plan_id ?? subscription?.metadata?.membership_plan_id ?? null;
  const email = object.customer_details?.email ?? object.customer_email ?? null;
  const update: StripeMembershipUpdate = {
    eventId: event.id,
    eventType: event.type,
    subscriptionId,
    customerId: customer,
    email,
    planPublicId,
    status: status(subscription?.status ?? object.status),
    periodStart: iso(subscription?.current_period_start ?? object.period_start),
    periodEnd: iso(subscription?.current_period_end ?? object.period_end),
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end ?? object.cancel_at_period_end),
    canceledAt: iso(subscription?.canceled_at ?? object.canceled_at),
    endedAt: iso(subscription?.ended_at ?? object.ended_at),
    details: { price_id: item?.price?.id ?? item?.price ?? null },
  };
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return recordStripeMembershipEvent(db, update, hash);
}
