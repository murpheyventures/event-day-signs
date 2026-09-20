import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleMembershipWebhook } from '../../../features/membership/stripe';

export const prerender = false;

/** Separate from paid-order webhooks: subscription events never create orders. */
export const POST: APIRoute = async ({ request }) => {
  try {
    await handleMembershipWebhook(env.DB, await request.text(), request.headers);
    return new Response('ok', { status: 200 });
  } catch (error) {
    return new Response(`Membership webhook failed: ${(error as Error).message}`, { status: 400 });
  }
};
