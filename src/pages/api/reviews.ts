import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { submitVerifiedReview, type ReviewFormat } from '../../features/reviews/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return Response.json({ error: 'JSON is required.' }, { status: 415 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const token = typeof input.token === 'string' ? input.token.trim() : '';
  const format = input.format === 'printed' ? 'printed' : input.format === 'digital' ? 'digital' : null;
  if (!token || !format || typeof input.body !== 'string' || typeof input.display_name !== 'string') {
    return Response.json({ error: 'token, body, display_name, and format are required.' }, { status: 400 });
  }
  const review = await submitVerifiedReview(env.DB, token, {
    rating: Number(input.rating),
    body: input.body,
    displayName: input.display_name,
    format: format as ReviewFormat,
  });
  if (!review) return Response.json({ error: 'This review link is invalid, expired, or already used.' }, { status: 400 });
  return Response.json({ review_id: review.public_id, status: review.moderation_state }, { status: 201 });
};
