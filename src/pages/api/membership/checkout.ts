import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCustomerEmail, isValidEmail } from '../../../features/auth/customer';
import { createMembershipCheckout } from '../../../features/membership/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { email?: unknown } = {};
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const email = (await getCustomerEmail(cookies)) ?? (typeof body.email === 'string' ? body.email.trim() : '');
  if (!isValidEmail(email)) return Response.json({ error: 'A valid email is required.' }, { status: 400 });
  try {
    return Response.json({ checkout_url: await createMembershipCheckout(env.DB, new URL(request.url).origin, email) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 503 });
  }
};
