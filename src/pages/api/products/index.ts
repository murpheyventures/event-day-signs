import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { listPublicCatalog } from '../../../features/catalog/public';
import { catalogJson, catalogPreflight } from '../../../features/catalog/http';
import { parseCatalogListQuery } from '../../../features/catalog/query';
import { getConfig } from '../../../config';
import { publicOrigin } from '../../../features/http/origin';
import { addCacheTags, productCacheTags } from '../../../features/cache/tags';

export const prerender = false;

export const OPTIONS: APIRoute = () => catalogPreflight();

/**
 * GET /api/products — machine-readable catalog for agents/tools.
 *   ?q=<query>      semantic/keyword search (uses the active search backend)
 *   ?limit=<1-100>  page size (default 24)
 *   ?offset=<n>     pagination offset
 * Returns active products only. Absolute image + product urls.
 */
export const GET: APIRoute = async ({ url }) => {
  const { query: q, limit, offset } = parseCatalogListQuery(url.searchParams);
  const origin = publicOrigin(url.origin, env.CANONICAL_ORIGIN);

  const imageBaseUrl = getConfig().images.baseUrl;
  const { products, total } = await listPublicCatalog(env.DB, origin, imageBaseUrl, limit, offset, q);

  const response = catalogJson({ products, total, limit, offset, query: q || null });
  addCacheTags(response.headers, productCacheTags(products.map((product) => product.id)));
  return response;
};
