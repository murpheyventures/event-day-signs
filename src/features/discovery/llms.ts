export interface LlmsProduct {
  name: string;
  slug: string;
  price: string;
  description?: string | null;
}

export interface LlmsLink {
  label: string;
  href: string;
}

export interface LlmsTextInput {
  storeName: string;
  currency: string;
  origin: string;
  products: LlmsProduct[];
  totalProducts: number;
  categories: LlmsLink[];
  pages: LlmsLink[];
  mcpUrl?: string | null;
}

const linkText = (value: string) => value.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
const oneLine = (value: string | null | undefined, max = 100) => {
  if (!value) return '';
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/** Build the bounded llms.txt discovery index. */
export function buildLlmsText(input: LlmsTextInput): string {
  const productLines = input.products.map((product) => {
    const description = oneLine(product.description);
    return `- [${linkText(product.name)}](${input.origin}/products/${product.slug}): ${product.price}${description ? ` — ${description}` : ''}`;
  });
  const categoryLines = input.categories.map(
    (category) => `- [${linkText(category.label)}](${category.href})`,
  );
  const pageLines = input.pages.map((page) => `- [${linkText(page.label)}](${page.href})`);
  const mcpUrl = (input.mcpUrl ?? '').trim();
  const mcpLine = mcpUrl
    ? `\n- [Model Context Protocol endpoint](${mcpUrl}): streamable HTTP. Browse and purchase need no credentials.`
    : '';
  const productNote = input.totalProducts > input.products.length
    ? `\n\nThis index shows ${input.products.length} products. Use the paginated catalog API for all ${input.totalProducts} active products.`
    : '';

  return `# ${input.storeName}

> ${input.storeName} is an online store you can browse and purchase from programmatically. All prices are in ${input.currency.toUpperCase()}. This file follows the llms.txt convention (https://llmstxt.org).

## Products
${productLines.length > 0 ? productLines.join('\n') : '- (no products listed)'}${productNote}

## Categories
${categoryLines.length > 0 ? categoryLines.join('\n') : '- (no categories)'}
${pageLines.length > 0 ? `\n## Pages\n${pageLines.join('\n')}\n` : ''}
## For agents
- [List payment methods](${input.origin}/api/checkout): \`GET\` → \`{ available_methods, default }\`.
- [Complete catalog as JSON](${input.origin}/api/products): paginated with \`?limit=\` and \`?offset=\`; follow pages until \`offset + products.length >= total\`.
- [Create a checkout](${input.origin}/api/checkout): \`POST\` JSON with catalog public IDs; pricing and stock are resolved server-side.
- [Search the catalog](${input.origin}/search?q=): append a query, e.g. \`/search?q=leather\`.
- [Sitemap](${input.origin}/sitemap.xml): every canonical product, category, and page URL.${mcpLine}
`;
}
