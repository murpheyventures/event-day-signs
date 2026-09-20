import type { Product } from '../products/db';
import type { ProductVariant } from '../products/variants';
import { requirePublicId } from './serialize';

/** The two customer-facing offer types in the Event Day Signs catalog. */
export type CatalogFormat = 'printed' | 'digital';

/** A design-level variant. New catalog rows will use this for colorways/treatments. */
export interface NormalizedDesignVariant {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

/** A purchasable offer, independent of the legacy products table. */
export interface NormalizedOffer {
  id: string;
  design_id: string;
  variant_id: string | null;
  format: CatalogFormat;
  label: string | null;
  sku: string | null;
  price_cents: number;
  currency: string;
  in_stock: boolean;
  requires_shipping: boolean;
  /** Identifies the source while the compatibility adapter is in use. */
  source: { kind: 'legacy_product' } | { kind: 'design_offer' };
}

/** The stable internal contract shared by legacy and new catalog readers. */
export interface NormalizedDesign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categories: string[];
  variants: NormalizedDesignVariant[];
  offers: NormalizedOffer[];
  seo_title?: string | null;
  seo_description?: string | null;
  source: { kind: 'legacy_product' } | { kind: 'design' };
}

/**
 * Adapt one existing product into the design/variant/offer contract.
 *
 * This is deliberately pure. It lets storefront, API, and checkout readers
 * adopt the normalized shape before the additive design tables are introduced.
 * Legacy product variants remain offers; they are not guessed to be design
 * colorways. A product with no variants gets one implicit offer.
 */
export function normalizeLegacyProduct(
  product: Product,
  categoryNames: string[] = [],
  variants: ProductVariant[] = [],
): NormalizedDesign {
  const designId = requirePublicId(product.public_id, product.id, 'product');
  const format: CatalogFormat = product.requires_shipping ? 'printed' : 'digital';
  const activeVariants = variants.filter((variant) => variant.active === 1);

  const normalizedVariants = activeVariants.map((variant, index) => ({
    id: requirePublicId(variant.public_id, variant.id, 'variant'),
    name: variant.label,
    sort_order: variant.position ?? index,
    active: true,
  }));

  const offers: NormalizedOffer[] = activeVariants.length
    ? activeVariants.map((variant) => ({
        id: requirePublicId(variant.public_id, variant.id, 'variant'),
        design_id: designId,
        variant_id: requirePublicId(variant.public_id, variant.id, 'variant'),
        format,
        label: variant.label,
        sku: variant.sku,
        price_cents: variant.price_cents,
        currency: product.currency.toUpperCase(),
        in_stock: variant.stock > 0,
        requires_shipping: Boolean(product.requires_shipping),
        source: { kind: 'legacy_product' },
      }))
    : [
        {
          id: designId,
          design_id: designId,
          variant_id: null,
          format,
          label: null,
          sku: null,
          price_cents: product.price_cents,
          currency: product.currency.toUpperCase(),
          in_stock: product.stock > 0,
          requires_shipping: Boolean(product.requires_shipping),
          source: { kind: 'legacy_product' },
        },
      ];

  return {
    id: designId,
    slug: product.slug,
    title: product.name,
    description: product.description,
    categories: [...categoryNames],
    variants: normalizedVariants,
    offers,
    source: { kind: 'legacy_product' },
  };
}
