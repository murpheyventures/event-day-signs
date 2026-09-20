import { describe, expect, it } from 'vitest';
import { robotsContent, shouldNoindex } from './indexing';

describe('indexing policy', () => {
  it('noindexes transactional and query-specific routes', () => {
    for (const path of ['/search', '/cart', '/checkout', '/account', '/pay/x']) {
      expect(shouldNoindex(path)).toBe(true);
      expect(robotsContent(path)).toBe('noindex, nofollow');
    }
  });

  it('keeps canonical catalog and content routes indexable', () => {
    expect(shouldNoindex('/products/example')).toBe(false);
    expect(shouldNoindex('/pages/about')).toBe(false);
    expect(robotsContent('/products/example')).toBeNull();
  });
});
