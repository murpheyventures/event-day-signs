import { describe, expect, it } from 'vitest';
import { normalizeLegacyProduct } from './normalized';
import type { Product } from '../products/db';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 7,
  public_id: 'prod_sign7',
  name: 'Best Dad Ever',
  slug: 'best-dad-ever',
  description: 'A printable event sign.',
  price_cents: 1800,
  currency: 'usd',
  image_key: null,
  stock: 4,
  active: 1,
  variant_label: null,
  weight_grams: null,
  requires_shipping: 0,
  file_key: null,
  file_name: null,
  file_mime: null,
  file_size_bytes: null,
  related_ids: null,
  created_at: '2026-09-19T00:00:00Z',
  ...overrides,
});

describe('normalizeLegacyProduct', () => {
  it('adapts a product without variants to one digital offer', () => {
    const design = normalizeLegacyProduct(product(), ['Father’s Day']);

    expect(design).toMatchObject({
      id: 'prod_sign7',
      slug: 'best-dad-ever',
      title: 'Best Dad Ever',
      categories: ['Father’s Day'],
      variants: [],
    });
    expect(design.offers).toEqual([
      expect.objectContaining({
        id: 'prod_sign7',
        format: 'digital',
        variant_id: null,
        price_cents: 1800,
        currency: 'USD',
        in_stock: true,
        requires_shipping: false,
      }),
    ]);
  });

  it('keeps legacy variants as separate printed offers', () => {
    const design = normalizeLegacyProduct(
      product({ requires_shipping: 1, price_cents: 2200 }),
      [],
      [
        {
          id: 11,
          public_id: 'var_small',
          product_id: 7,
          label: 'Small',
          price_cents: 2200,
          stock: 0,
          sku: 'DAD-S',
          position: 0,
          active: 1,
          image_id: null,
          weight_grams: null,
        },
      ],
    );

    expect(design.variants).toEqual([
      { id: 'var_small', name: 'Small', sort_order: 0, active: true },
    ]);
    expect(design.offers[0]).toMatchObject({
      id: 'var_small',
      variant_id: 'var_small',
      format: 'printed',
      sku: 'DAD-S',
      in_stock: false,
      requires_shipping: true,
    });
  });

  it('fails instead of exposing an internal row id', () => {
    expect(() => normalizeLegacyProduct(product({ public_id: null }))).toThrow(
      'product row 7 has no public_id',
    );
  });
});
