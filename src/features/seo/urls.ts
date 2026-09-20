export function canonicalUrl(origin: string, pathname: string, override?: string): string {
  return override ?? new URL(pathname, origin).href;
}
