import type { APIRoute } from 'astro';
import { PUBLIC_CACHE_CONTROL } from '../features/cache/public';
import { env } from 'cloudflare:workers';
import { listProducts, countProducts } from '../features/products/db';
import { listCategories } from '../features/categories/db';
import { listPublishedPages } from '../features/pages/db';
import { listPublishedDesigns } from '../features/catalog/db';
import { catalogPath } from '../features/settings/home';
import { publicOrigin } from '../features/http/origin';

export const prerender = false;

/**
 * Every URL the sitemap should list, in order.
 *
 * The catalog is included at whichever address it actually lives at. When the
 * home page has been pointed at a page or product, `/` renders that target and
 * canonicals to it — so listing `/` would put a non-canonical duplicate in the
 * sitemap (the target is already listed on its own URL), while the real catalog
 * at `/products` would be missing entirely.
 *
 * Pure and exported so the rule is testable without standing up a request.
 */
export function sitemapLocs(
  origin: string,
  homePage: string | null | undefined,
  data: {
    categories: { slug: string }[];
    products: { slug: string }[];
    pages: { slug: string }[];
  },
): string[] {
  return [
    `${origin}${catalogPath(homePage)}`,
    ...data.categories.map((c) => `${origin}/categories/${c.slug}`),
    ...data.products.map((p) => `${origin}/products/${p.slug}`),
    // Published pages only — drafts must not be discoverable.
    ...data.pages.map((p) => `${origin}/pages/${p.slug}`),
  ];
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export function sitemapEntries(
  origin: string,
  homePage: string | null | undefined,
  data: {
    categories: { slug: string; created_at?: string }[];
    products: { slug: string; created_at?: string }[];
    pages: { slug: string; updated_at?: string }[];
    designs?: { slug: string; updated_at?: string }[];
  },
): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { loc: `${origin}${catalogPath(homePage)}` },
    ...data.categories.map((item) => ({ loc: `${origin}/categories/${item.slug}`, lastmod: item.created_at })),
    ...data.products.map((item) => ({ loc: `${origin}/products/${item.slug}`, lastmod: item.created_at })),
    ...(data.designs ?? []).map((item) => ({ loc: `${origin}/products/${item.slug}`, lastmod: item.updated_at })),
    ...data.pages.map((item) => ({ loc: `${origin}/pages/${item.slug}`, lastmod: item.updated_at })),
  ];
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Dynamic sitemap: storefront + every active product, category, and published page. Slugs are
// URL-safe (a-z0-9-), so no XML escaping is needed.
export const GET: APIRoute = async ({ url, locals }) => {
  const origin = publicOrigin(url.origin, env.CANONICAL_ORIGIN);
  const total = await countProducts(env.DB);
  const products = total > 0 ? await listProducts(env.DB, total, 0) : [];
  const categories = await listCategories(env.DB);
  const pages = await listPublishedPages(env.DB);
  let designs: Array<{ slug: string; updated_at?: string }> = [];
  try {
    designs = await listPublishedDesigns(env.DB);
  } catch (error) {
    if (!(error instanceof Error && /no such table: designs/i.test(error.message))) throw error;
  }

  const entries = sitemapEntries(origin, locals.settings?.homePage, { categories, products, pages, designs });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url><loc>${xml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${xml(entry.lastmod)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': PUBLIC_CACHE_CONTROL,
    },
  });
};
