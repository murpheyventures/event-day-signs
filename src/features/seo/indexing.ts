/** Routes whose contents are private, transactional, or query-specific. */
const NOINDEX_PATHS = [
  /^\/search(?:\/|$)/,
  /^\/cart(?:\/|$)/,
  /^\/checkout(?:\/|$)/,
  /^\/account(?:\/|$)/,
  /^\/express(?:\/|$)/,
  /^\/review(?:\/|$)/,
  /^\/pay(?:\/|$)/,
  /^\/payment-setup(?:\/|$)/,
];

export function shouldNoindex(pathname: string): boolean {
  return NOINDEX_PATHS.some((pattern) => pattern.test(pathname));
}

export function robotsContent(pathname: string): string | null {
  return shouldNoindex(pathname) ? 'noindex, nofollow' : null;
}
