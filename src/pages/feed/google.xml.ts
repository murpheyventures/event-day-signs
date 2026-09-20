import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getConfig } from '../../config';
import { publicOrigin } from '../../features/http/origin';
import { listAllPublicCatalog } from '../../features/catalog/public';
import { PUBLIC_CACHE_CONTROL } from '../../features/cache/public';
import { toMajorUnits, currencyDecimals } from '../../money';

export const prerender = false;

const xml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ url }) => {
  const config = getConfig();
  const origin = publicOrigin(url.origin, env.CANONICAL_ORIGIN);
  const products = await listAllPublicCatalog(env.DB, origin, config.images.baseUrl);
  const items = products.flatMap((product) => {
    const offers = product.offers?.length
      ? product.offers.map((offer) => ({
          id: offer.id,
          url: `${product.url}#${offer.id}`,
          price: offer.price,
          inStock: offer.in_stock,
          format: offer.format,
        }))
      : [{ id: product.id, url: product.url, price: product.price, inStock: product.in_stock, format: 'printed' }];
    return offers.map((offer) => `<item>
      <g:id>${xml(offer.id)}</g:id>
      <g:title>${xml(product.name)}</g:title>
      <g:description>${xml(product.description ?? product.name)}</g:description>
      <g:link>${xml(offer.url)}</g:link>
      <g:image_link>${xml(product.image)}</g:image_link>
      <g:availability>${offer.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${toMajorUnits(offer.price.cents, offer.price.currency).toFixed(currencyDecimals(offer.price.currency))} ${xml(offer.price.currency)}</g:price>
      <g:condition>new</g:condition>
      <g:custom_label_0>${xml(offer.format)}</g:custom_label_0>
    </item>`);
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>
  <title>${xml(config.storeName)}</title>
  <link>${xml(origin)}</link>
  <description>${xml(config.storeName)} product feed</description>
${items.join('\n')}
</channel></rss>
`;
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': PUBLIC_CACHE_CONTROL },
  });
};
