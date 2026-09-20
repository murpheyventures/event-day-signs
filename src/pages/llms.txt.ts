import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { PUBLIC_CACHE_CONTROL } from '../features/cache/public';
import { getConfig, formatPrice } from '../config';
import { listPublicCatalog } from '../features/catalog/public';
import { listCategories } from '../features/categories/db';
import { listPublishedPages } from '../features/pages/db';
import { publicOrigin } from '../features/http/origin';
import { buildLlmsText } from '../features/discovery/llms';

export const prerender = false;

// Keep this discovery document bounded. The paginated JSON catalog is the
// authoritative complete feed and includes total/limit/offset metadata.
const DISCOVERY_PRODUCT_LIMIT = 50;

export const GET: APIRoute = async ({ url }) => {
  const origin = publicOrigin(url.origin, env.CANONICAL_ORIGIN);
  const { storeName, currency } = getConfig();
  const mcpUrl = (env.MCP_URL ?? '').trim();
  const advertisedMcpUrl = env.MCP_URL ? mcpUrl : '';
  const [catalog, categories, pages] = await Promise.all([
    listPublicCatalog(env.DB, origin, getConfig().images.baseUrl, DISCOVERY_PRODUCT_LIMIT, 0),
    listCategories(env.DB),
    listPublishedPages(env.DB),
  ]);

  const body = buildLlmsText({
    storeName,
    currency,
    origin,
    totalProducts: catalog.total,
    products: catalog.products.map((product) => ({
      name: product.name,
      slug: product.slug,
      price: formatPrice(product.price.cents, product.price.currency),
      description: product.description,
    })),
    categories: categories.map((category) => ({
      label: category.name,
      href: `${origin}/categories/${category.slug}`,
    })),
    pages: pages.map((page) => ({
      label: page.title,
      href: `${origin}/pages/${page.slug}`,
    })),
    mcpUrl: advertisedMcpUrl,
  });

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': PUBLIC_CACHE_CONTROL,
    },
  });
};
