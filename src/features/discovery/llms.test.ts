import { describe, expect, it } from 'vitest';
import { buildLlmsText } from './llms';

describe('buildLlmsText', () => {
  it('explains bounded discovery and points agents to the complete feed', () => {
    const body = buildLlmsText({
      storeName: 'Event Day Signs', currency: 'USD', origin: 'https://shop.example',
      totalProducts: 51,
      products: [{ name: 'A [warm] sign', slug: 'warm-sign', price: '$12.00', description: '  A useful\n sign.  ' }],
      categories: [{ label: 'Signs', href: 'https://shop.example/categories/signs' }], pages: [],
    });
    expect(body).toContain('[A warm sign](https://shop.example/products/warm-sign): $12.00 — A useful sign.');
    expect(body).toContain('This index shows 1 products. Use the paginated catalog API for all 51 active products.');
    expect(body).toContain('https://shop.example/api/products');
  });

  it('does not advertise an unset MCP endpoint', () => {
    const body = buildLlmsText({
      storeName: 'Shop', currency: 'USD', origin: 'https://shop.example', totalProducts: 0,
      products: [], categories: [], pages: [], mcpUrl: '  ',
    });
    expect(body).not.toContain('Model Context Protocol');
  });
});
