import { describe, expect, it } from 'vitest';
import { canonicalUrl } from './urls';

describe('canonicalUrl', () => {
  it('builds an origin-safe canonical URL and honors explicit overrides', () => {
    expect(canonicalUrl('https://shop.example', '/products/sign')).toBe('https://shop.example/products/sign');
    expect(canonicalUrl('https://shop.example', '/products/sign', 'https://shop.example/')).toBe('https://shop.example/');
  });
});
