import type { D1Database } from '@cloudflare/workers-types';
import { withPublicId } from '../ids/publicId.ts';
import type {
  CatalogFormat,
  NormalizedDesign,
  NormalizedDesignVariant,
  NormalizedOffer,
} from './normalized';

export interface DesignRow {
  id: number;
  public_id: string;
  slug: string;
  title: string;
  phrase: string | null;
  description: string | null;
  event_name: string | null;
  recipient: string | null;
  humor_family: string | null;
  readability_notes: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface DesignVariantRow {
  id: number;
  public_id: string;
  design_id: number;
  name: string;
  color_name: string | null;
  color_hex: string | null;
  preview_key: string | null;
  print_master_key: string | null;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface OfferRow {
  id: number;
  public_id: string;
  design_id: number;
  variant_id: number | null;
  format: CatalogFormat;
  sku: string | null;
  label: string | null;
  dimensions: string | null;
  material: string | null;
  price_cents: number;
  currency: string;
  availability: 'available' | 'unavailable' | 'archived';
  stock: number | null;
  requires_shipping: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface DesignInput {
  slug: string;
  title: string;
  phrase?: string | null;
  description?: string | null;
  event_name?: string | null;
  recipient?: string | null;
  humor_family?: string | null;
  readability_notes?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface DesignVariantInput {
  design_id: number;
  name: string;
  color_name?: string | null;
  color_hex?: string | null;
  preview_key?: string | null;
  print_master_key?: string | null;
  sort_order?: number;
}

export interface OfferInput {
  design_id: number;
  variant_id: number | null;
  format: CatalogFormat;
  sku?: string | null;
  label?: string | null;
  dimensions?: string | null;
  material?: string | null;
  price_cents: number;
  currency: string;
  stock?: number | null;
  requires_shipping: boolean;
}

export async function listPublishedDesigns(db: D1Database): Promise<DesignRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM designs WHERE status = 'published' ORDER BY updated_at DESC, id DESC")
    .all<DesignRow>();
  return results ?? [];
}

export async function getDesignBySlug(db: D1Database, slug: string): Promise<DesignRow | null> {
  return db.prepare('SELECT * FROM designs WHERE slug = ?').bind(slug).first<DesignRow>();
}

export async function listPublishedVariants(
  db: D1Database,
  designId: number,
): Promise<DesignVariantRow[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM design_variants WHERE design_id = ? AND status = 'published' ORDER BY sort_order, id",
    )
    .bind(designId)
    .all<DesignVariantRow>();
  return results ?? [];
}

export async function listActiveOffers(db: D1Database, designId: number): Promise<OfferRow[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM offers WHERE design_id = ? AND active = 1 AND availability = 'available' ORDER BY id",
    )
    .bind(designId)
    .all<OfferRow>();
  return results ?? [];
}

/** Read one new design as the same normalized shape used by legacy products. */
export async function getNormalizedDesign(
  db: D1Database,
  slug: string,
): Promise<NormalizedDesign | null> {
  try {
    const design = await getDesignBySlug(db, slug);
    if (!design || design.status !== 'published') return null;
    const [variants, offers] = await Promise.all([
      listPublishedVariants(db, design.id),
      listActiveOffers(db, design.id),
    ]);
    if (offers.length === 0) return null;
    return {
      id: design.public_id,
      slug: design.slug,
      title: design.title,
      description: design.description,
      categories: [],
      variants: variants.map<NormalizedDesignVariant>((variant) => ({
        id: variant.public_id,
        name: variant.name,
        sort_order: variant.sort_order,
        active: true,
      })),
      offers: offers.map<NormalizedOffer>((offer) => ({
        id: offer.public_id,
        design_id: design.public_id,
        variant_id:
          variants.find((variant) => variant.id === offer.variant_id)?.public_id ?? null,
        format: offer.format,
        label: offer.label,
        sku: offer.sku,
        price_cents: offer.price_cents,
        currency: offer.currency.toUpperCase(),
        in_stock: offer.availability === 'available' && (offer.stock == null || offer.stock > 0),
        requires_shipping: offer.requires_shipping === 1,
        source: { kind: 'design_offer' },
      })),
      source: { kind: 'design' },
    };
  } catch (error) {
    // Deploys may briefly run against a database before 0040 is applied. Keep
    // the legacy API usable during that migration window.
    if (error instanceof Error && /no such table: designs/i.test(error.message)) return null;
    throw error;
  }
}

export async function createDesign(db: D1Database, input: DesignInput): Promise<number> {
  return withPublicId('design', async (publicId) => {
    const row = await db
      .prepare(
        `INSERT INTO designs (
           public_id, slug, title, phrase, description, event_name, recipient,
           humor_family, readability_notes, seo_title, seo_description
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(
        publicId,
        input.slug,
        input.title,
        input.phrase ?? null,
        input.description ?? null,
        input.event_name ?? null,
        input.recipient ?? null,
        input.humor_family ?? null,
        input.readability_notes ?? null,
        input.seo_title ?? null,
        input.seo_description ?? null,
      )
      .first<{ id: number }>();
    return row!.id;
  });
}

export async function createDesignVariant(
  db: D1Database,
  input: DesignVariantInput,
): Promise<number> {
  return withPublicId('designVariant', async (publicId) => {
    const row = await db
      .prepare(
        `INSERT INTO design_variants (
           public_id, design_id, name, color_name, color_hex, preview_key,
           print_master_key, sort_order
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(
        publicId,
        input.design_id,
        input.name,
        input.color_name ?? null,
        input.color_hex ?? null,
        input.preview_key ?? null,
        input.print_master_key ?? null,
        input.sort_order ?? 0,
      )
      .first<{ id: number }>();
    return row!.id;
  });
}

export async function createOffer(db: D1Database, input: OfferInput): Promise<number> {
  return withPublicId('offer', async (publicId) => {
    const row = await db
      .prepare(
        `INSERT INTO offers (
           public_id, design_id, variant_id, format, sku, label, dimensions,
           material, price_cents, currency, stock, requires_shipping
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(
        publicId,
        input.design_id,
        input.variant_id,
        input.format,
        input.sku ?? null,
        input.label ?? null,
        input.dimensions ?? null,
        input.material ?? null,
        input.price_cents,
        input.currency.toUpperCase(),
        input.stock ?? null,
        input.requires_shipping ? 1 : 0,
      )
      .first<{ id: number }>();
    return row!.id;
  });
}
