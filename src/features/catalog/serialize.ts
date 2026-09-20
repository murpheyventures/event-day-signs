import type { Product } from '../products/db';
import type { ProductVariant, ProductExtra } from '../products/variants';
import { productImageUrl } from '../products/image';
import { toMajorUnits } from '../../money';
import type { NormalizedDesign } from './normalized';

/** A purchasable variant in catalog form (price in both major + minor units). */
export interface CatalogVariant {
  /** Prefixed public ID (`var_…`) — never a row ID. */
  id: string;
  label: string;
  price: { amount: number; cents: number; currency: string };
  in_stock: boolean;
  sku: string | null;
}

/** A checkbox add-on in catalog form — a price delta layered on the line. */
export interface CatalogExtra {
  /** Prefixed public ID (`xtra_…`) — never a row ID. */
  id: string;
  label: string;
  price_delta: { amount: number; cents: number; currency: string };
}

export interface CatalogOffer {
  id: string;
  format: 'printed' | 'digital';
  label: string | null;
  price: { amount: number; cents: number; currency: string };
  in_stock: boolean;
  requires_shipping: boolean;
  sku: string | null;
}

/**
 * The public, machine-readable shape of a product — what the `/api/products`
 * catalog endpoints return for agents/tools. Stable, self-describing, with
 * ABSOLUTE urls so a consumer needs no base-url knowledge. Pure (no bindings) so
 * it's unit-testable and reusable across the list + detail routes.
 *
 * `variant_label` flags products that have a variant group (so a list consumer
 * knows to fetch the detail). `variants`/`extras` are populated only on the
 * detail route — the list stays lightweight.
 *
 * Availability is exposed as `in_stock` only — NOT an exact count. A public,
 * pollable browse endpoint that returned exact quantities would leak sales
 * velocity (poll over time, watch it drop). Agents get the precise remaining
 * amount transactionally, in the checkout stock-shortfall error, not here.
 */
export interface CatalogProduct {
  /** Prefixed public ID (`prod_…`) — never a row ID. */
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: { amount: number; cents: number; currency: string };
  in_stock: boolean;
  variant_label: string | null;
  categories: string[];
  image: string;
  url: string;
  variants?: CatalogVariant[];
  extras?: CatalogExtra[];
  offers?: CatalogOffer[];
  source?: 'legacy_product' | 'design';
}

const money = (cents: number, currency: string) => ({
  amount: toMajorUnits(cents, currency), // major units (e.g. 24.0)
  cents, // minor units (Stripe-style)
  currency: currency.toUpperCase(),
});

/**
 * Serialize a product (+ its category names) into the catalog shape. Pass
 * `options.variants`/`options.extras` (detail route) to embed them; when variants
 * are present they are the inventory unit, so top-level `in_stock` derives from
 * them rather than the product row.
 */
export function toCatalogProduct(
  p: Product,
  categoryNames: string[],
  origin: string,
  options?: { variants?: ProductVariant[]; extras?: ProductExtra[]; imageBaseUrl?: string },
): CatalogProduct {
  const variants = options?.variants;
  const extras = options?.extras;
  const hasVariants = !!variants && variants.length > 0;

  const out: CatalogProduct = {
    id: requirePublicId(p.public_id, p.id, 'product'),
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: money(p.price_cents, p.currency),
    // With variants, availability comes from them (the variant is the SKU).
    in_stock: hasVariants ? variants!.some((v) => v.stock > 0) : p.stock > 0,
    variant_label: p.variant_label,
    categories: categoryNames,
    image: new URL(productImageUrl(p.image_key, options?.imageBaseUrl ?? ''), origin).href,
    url: new URL(`/products/${p.slug}`, origin).href,
  };

  if (variants) {
    out.variants = variants.map((v) => ({
      id: requirePublicId(v.public_id, v.id, 'variant'),
      label: v.label,
      price: money(v.price_cents, p.currency),
      in_stock: v.stock > 0,
      sku: v.sku,
    }));
  }
  if (extras) {
    out.extras = extras.map((e) => ({
      id: requirePublicId(e.public_id, e.id, 'extra'),
      label: e.label,
      price_delta: money(e.price_delta_cents, p.currency),
    }));
  }
  return out;
}

/** Serialize a normalized design into the backward-compatible public catalog shape. */
export function toCatalogDesign(
  design: NormalizedDesign,
  origin: string,
): CatalogProduct {
  const firstOffer = design.offers[0];
  if (!firstOffer) throw new Error(`Design ${design.id} has no active offers`);
  const variantNames = new Map(design.variants.map((variant) => [variant.id, variant.name]));
  const offers = design.offers;

  return {
    id: design.id,
    slug: design.slug,
    name: design.title,
    description: design.description,
    price: money(firstOffer.price_cents, firstOffer.currency),
    in_stock: offers.some((offer) => offer.in_stock),
    variant_label: design.variants.length > 0 ? 'Options' : null,
    categories: design.categories,
    image: new URL('/placeholder.png', origin).href,
    url: new URL(`/products/${design.slug}`, origin).href,
    source: design.source.kind,
    offers: offers.map((offer) => ({
      id: offer.id,
      format: offer.format,
      label: offer.label,
      price: money(offer.price_cents, offer.currency),
      in_stock: offer.in_stock,
      requires_shipping: offer.requires_shipping,
      sku: offer.sku,
    })),
    variants:
      design.variants.length > 0
        ? offers
            .filter((offer) => offer.variant_id !== null)
            .map((offer) => ({
              id: offer.id,
              label: variantNames.get(offer.variant_id!) ?? offer.label ?? 'Option',
              price: money(offer.price_cents, offer.currency),
              in_stock: offer.in_stock,
              sku: offer.sku,
            }))
        : undefined,
  };
}

/**
 * A row reaching a public serializer without its public ID is a deploy-order
 * bug (backfill must run before cutover) — fail loudly rather than leak the
 * numeric row ID.
 */
export function requirePublicId(publicId: string | null, rowId: number, kind: string): string {
  if (!publicId) throw new Error(`${kind} row ${rowId} has no public_id — run the backfill`);
  return publicId;
}
