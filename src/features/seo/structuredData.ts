import type { NormalizedDesign } from '../catalog/normalized';
import { markdownExcerpt } from '../pages/markdown';
import { toMajorUnits, currencyDecimals } from '../../money';

export interface StructuredDataOffer {
  id: string;
  format: 'printed' | 'digital';
  label: string | null;
  price_cents: number;
  currency: string;
  in_stock: boolean;
  requires_shipping: boolean;
  sku: string | null;
  url: string;
}

export interface StructuredDataInput {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  url: string;
  offers: StructuredDataOffer[];
  brand?: string | null;
  rating?: { value: number; count: number } | null;
}

const schemaAvailability = (inStock: boolean) =>
  `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`;

/** Build the single source of truth for product structured data. */
export function buildProductStructuredData(input: StructuredDataInput): Record<string, unknown> {
  const offers = input.offers.map((offer) => ({
    '@type': 'Offer',
    label: offer.label,
    ...(offer.sku ? { sku: offer.sku } : {}),
    name: offer.label ?? (offer.format === 'digital' ? 'Digital bundle' : 'Printed sign'),
    category: offer.format,
    price: toMajorUnits(offer.price_cents, offer.currency).toFixed(currencyDecimals(offer.currency)),
    priceCurrency: offer.currency.toUpperCase(),
    availability: schemaAvailability(offer.in_stock),
    url: offer.url,
    ...(offer.requires_shipping ? { shippingDetails: { '@type': 'OfferShippingDetails' } } : {}),
  }));

  const graph: Record<string, unknown> = {
    '@type': 'ProductGroup',
    '@id': `${input.url}#product-group`,
    productGroupID: input.id,
    name: input.name,
    ...(input.description ? { description: markdownExcerpt(input.description, 5000) } : {}),
    ...(input.image ? { image: input.image } : {}),
    url: input.url,
    ...(input.brand ? { brand: { '@type': 'Brand', name: input.brand } } : {}),
    hasVariant: offers.map((offer) => ({
      '@type': 'Product',
      name: offer.label ?? input.name,
      url: offer.url,
      offers: [offer],
    })),
  };

  if (input.rating && input.rating.count > 0) {
    graph.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.rating.value.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount: input.rating.count,
    };
  }

  return { '@context': 'https://schema.org', '@graph': [graph] };
}

/** JSON-safe script content; prevents a product value from closing the script tag. */
export function stringifyStructuredData(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function normalizedDesignStructuredData(
  design: NormalizedDesign,
  origin: string,
  rating?: { value: number; count: number } | null,
): Record<string, unknown> {
  return buildProductStructuredData({
    id: design.id,
    name: design.title,
    description: design.description,
    image: null,
    url: new URL(`/products/${design.slug}`, origin).href,
    rating,
    offers: design.offers.map((offer) => ({
      id: offer.id,
      format: offer.format,
      label: offer.label,
      price_cents: offer.price_cents,
      currency: offer.currency,
      in_stock: offer.in_stock,
      requires_shipping: offer.requires_shipping,
      sku: offer.sku,
      url: new URL(`/products/${design.slug}#${offer.id}`, origin).href,
    })),
  });
}
