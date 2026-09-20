import { catalogPath } from '../settings/home';

export interface SitemapEntry { loc: string; lastmod?: string; }

export function sitemapLocs(
  origin: string,
  homePage: string | null | undefined,
  data: { categories: { slug: string }[]; products: { slug: string }[]; pages: { slug: string }[] },
): string[] {
  return sitemapEntries(origin, homePage, data).map((entry) => entry.loc);
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
