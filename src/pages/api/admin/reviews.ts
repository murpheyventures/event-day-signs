import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { moderateReview } from '../../../features/reviews/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const publicId = String(form.get('public_id') ?? '').trim();
  const action = String(form.get('_action') ?? '').trim();
  const state = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'hide' ? 'hidden' : null;
  if (!publicId || !state) return redirect('/admin/reviews?error=Invalid+review+action', 303);
  await moderateReview(env.DB, publicId, state, String(form.get('merchant_response') ?? '').trim() || null);
  return redirect('/admin/reviews?saved=1', 303);
};
