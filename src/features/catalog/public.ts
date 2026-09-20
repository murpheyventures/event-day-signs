import type { D1Database } from '@cloudflare/workers-types';
import { categoriesForProducts } from '../categories/db';
import { listProducts, type Product } from '../products/db';
import { getNormalizedDesign, listPublishedDesigns } from './db';
import { toCatalogDesign, toCatalogProduct, type CatalogProduct } from './serialize';
import { normalizeSearchQuery } from '../search/query';
import type { NormalizedDesign } from './normalized';

export interface PublicCatalogPage {
  products: CatalogProduct[];
  total: number;
}

const MAX_PUBLIC_ROWS = 10_000;

function matches(design: NormalizedDesign, query: string): boolean {
  if (!query) return true;
  const haystack = [design.title, design.slug, design.description ?? '', ...design.categories]
    .join(' ')
    .toLowerCase();
  return query.split(/\s+/).every((token) => haystack.includes(token));
}

async function legacyDesigns(db: D1Database, query: string): Promise<Product[]> {
  // The public catalog is deliberately bounded. This keeps the union query
  // safe for a Worker while supporting the documented 1,000-design feed gate.
  const products = await listProducts(db, MAX_PUBLIC_ROWS, 0);
  if (!query) return products;
  const tokens = query.split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    const haystack = `${product.name} ${product.slug} ${product.description ?? ''}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

async function normalizedDesigns(db: D1Database, query: string): Promise<NormalizedDesign[]> {
  try {
    const rows = await listPublishedDesigns(db);
    const designs = (await Promise.all(rows.map((row) => getNormalizedDesign(db, row.slug))))
      .filter((design): design is NormalizedDesign => !!design && matches(design, query));
    return designs;
  } catch (error) {
    if (error instanceof Error && /no such table: designs/i.test(error.message)) return [];
    throw error;
  }
}

/** One public, paginated projection for legacy products and normalized designs. */
export async function listPublicCatalog(
  db: D1Database,
  origin: string,
  imageBaseUrl: string,
  limit: number,
  offset: number,
  rawQuery = '',
): Promise<PublicCatalogPage> {
  const query = normalizeSearchQuery(rawQuery);
  const [legacy, designs] = await Promise.all([legacyDesigns(db, query), normalizedDesigns(db, query)]);
  const normalizedSlugs = new Set(designs.map((design) => design.slug));
  const legacyVisible = legacy.filter((product) => !normalizedSlugs.has(product.slug));
  const categories = await categoriesForProducts(db, legacyVisible.map((product) => product.id));
  const legacyProducts = legacyVisible.map((product) =>
    toCatalogProduct(
      product,
      (categories.get(product.id) ?? []).map((category) => category.name),
      origin,
      { imageBaseUrl },
    ),
  );
  // Preserve the legacy catalog order for existing consumers; normalized
  // designs follow it in their updated-at order from the design reader.
  const products = [...legacyProducts, ...designs.map((design) => toCatalogDesign(design, origin))];
  return { products: products.slice(offset, offset + limit), total: products.length };
}

export async function listAllPublicCatalog(
  db: D1Database,
  origin: string,
  imageBaseUrl: string,
  rawQuery = '',
): Promise<CatalogProduct[]> {
  const page = await listPublicCatalog(db, origin, imageBaseUrl, MAX_PUBLIC_ROWS, 0, rawQuery);
  return page.products;
}
