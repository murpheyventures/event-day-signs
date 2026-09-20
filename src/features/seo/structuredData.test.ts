import { describe, expect, it } from 'vitest';
import { buildProductStructuredData, stringifyStructuredData } from './structuredData';

describe('structured product data', () => {
  it('emits one graph with separate digital and printed offers', () => {
    const data = buildProductStructuredData({
      id: 'des_demo', name: 'Go team', description: 'A **fun** sign.', image: null,
      url: 'https://shop.example/products/go-team',
      offers: [
        { id: 'off_digital', format: 'digital', label: null, price_cents: 900, currency: 'USD', in_stock: true, requires_shipping: false, sku: null, url: 'https://shop.example/products/go-team#off_digital' },
        { id: 'off_print', format: 'printed', label: '18 × 24', price_cents: 2400, currency: 'USD', in_stock: false, requires_shipping: true, sku: 'PRINT-18', url: 'https://shop.example/products/go-team#off_print' },
      ],
    });
    expect(data['@context']).toBe('https://schema.org');
    expect((data['@graph'] as Array<Record<string, unknown>>)[0]['@type']).toBe('ProductGroup');
    expect(JSON.stringify(data)).toContain('OutOfStock');
    expect(JSON.stringify(data)).toContain('fun');
  });

  it('escapes script-closing characters', () => {
    expect(stringifyStructuredData({ description: '</script>' })).toBe('{"description":"\\u003c/script>"}');
  });
});
