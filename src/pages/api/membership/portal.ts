import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCustomerEmail } from '../../../features/auth/customer';
import { createMembershipPortal } from '../../../features/membership/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const email = await getCustomerEmail(cookies);
  if (!email) return Response.json({ error: 'Sign in before opening the membership portal.' }, { status: 401 });
  try {
    return Response.json({ portal_url: await createMembershipPortal(env.DB, new URL(request.url).origin, email) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 503 });
  }
};
