import { describe, expect, it } from 'vitest';
import { getNormalizedDesign } from './db';

function dbFrom(responses: Array<Record<string, unknown> | Record<string, unknown>[] | null>) {
  const statements: string[] = [];
  return {
    statements,
    prepare(sql: string) {
      statements.push(sql);
      return {
        bind() {
          return {
            first: async () => responses.shift() ?? null,
            all: async () => ({ results: responses.shift() ?? [] }),
          };
        },
        first: async () => responses.shift() ?? null,
      };
    },
  } as never;
}

describe('getNormalizedDesign', () => {
  it('reads published design data without exposing numeric IDs', async () => {
    const db = dbFrom([
      {
        id: 3,
        public_id: 'des_abc1234567',
        slug: 'best-dad-ever',
        title: 'Best Dad Ever',
        description: 'A sign',
        status: 'published',
      },
      [{
        id: 8,
        public_id: 'dvar_abc1234567',
        name: 'Blue',
        sort_order: 0,
        status: 'published',
      }],
      [{
        id: 12,
        public_id: 'off_abc1234567',
        variant_id: 8,
        format: 'printed',
        label: '12 × 18',
        sku: 'DAD-BLUE-12',
        price_cents: 2400,
        currency: 'usd',
        availability: 'available',
        stock: null,
        requires_shipping: 1,
        active: 1,
      }],
    ]);

    const result = await getNormalizedDesign(db, 'best-dad-ever');
    expect(result).toMatchObject({ id: 'des_abc1234567', slug: 'best-dad-ever' });
    expect(result?.variants[0]).toMatchObject({ id: 'dvar_abc1234567' });
    expect(result?.offers[0]).toMatchObject({
      id: 'off_abc1234567',
      design_id: 'des_abc1234567',
      variant_id: 'dvar_abc1234567',
      currency: 'USD',
      requires_shipping: true,
    });
    expect(JSON.stringify(result)).not.toContain('"id":3');
    expect(JSON.stringify(result)).not.toContain('"id":8');
    expect(JSON.stringify(result)).not.toContain('"id":12');
  });

  it('does not read draft designs', async () => {
    const db = dbFrom([
      { id: 3, public_id: 'des_abc1234567', slug: 'draft', title: 'Draft', status: 'draft' },
    ]);
    await expect(getNormalizedDesign(db, 'draft')).resolves.toBeNull();
  });
});
