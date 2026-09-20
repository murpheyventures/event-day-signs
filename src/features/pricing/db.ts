import type { D1Database } from '@cloudflare/workers-types';
import { categoriesForProducts } from '../categories/db';
import { hasActiveMembership } from '../membership/db';
import { resolveMemberPrice, type PricingRule } from './resolver';

export interface MembershipBenefitSnapshot {
  eligible: boolean;
  email?: string;
  lines: Array<{ productId: number; basePriceCents: number; memberPriceCents: number; savingsCents: number; ruleId: string | number | null }>;
  savingsCents: number;
  resolvedAt: string;
}

async function listPricingRules(db: D1Database): Promise<PricingRule[]> {
  const { results } = await db.prepare('SELECT * FROM pricing_rules WHERE enabled = 1').all<PricingRule>();
  return (results ?? []).map((rule) => ({ ...rule, enabled: Boolean(rule.enabled) }));
}

async function categoryIdsForProducts(db: D1Database, productIds: number[]): Promise<Map<number, number[]>> {
  const categories = await categoriesForProducts(db, productIds);
  const out = new Map<number, number[]>();
  for (const [productId, direct] of categories) {
    const byId = new Map(direct.map((category) => [category.id, category]));
    const ids: number[] = [];
    for (const category of direct) {
      let current: typeof category | undefined = category;
      while (current) {
        ids.push(current.id);
        current = current.parent_id == null ? undefined : byId.get(current.parent_id);
      }
    }
    out.set(productId, [...new Set(ids)]);
  }
  return out;
}

export interface MemberPricedLine<T> {
  line: T;
  productId: number;
  basePriceCents: number;
  memberPriceCents: number;
  savingsCents: number;
  ruleId: string | number | null;
}

/** Apply configured member pricing for a verified customer, never client input. */
export async function priceLinesForMember<T extends { productId: number; unitPriceCents: number; quantity: number; format: 'digital' | 'printed' }>(
  db: D1Database,
  lines: T[],
  email: string | null,
): Promise<{ lines: MemberPricedLine<T>[]; snapshot: MembershipBenefitSnapshot | null }> {
  if (!email || !(await hasActiveMembership(db, email)) || lines.length === 0) {
    return {
      lines: lines.map((line) => ({ line, productId: line.productId, basePriceCents: line.unitPriceCents, memberPriceCents: line.unitPriceCents, savingsCents: 0, ruleId: null })),
      snapshot: email ? { eligible: false, lines: [], savingsCents: 0, resolvedAt: new Date().toISOString() } : null,
    };
  }
  const [rules, categoryIds] = await Promise.all([listPricingRules(db), categoryIdsForProducts(db, lines.map((line) => line.productId))]);
  const priced = lines.map((line) => {
    const result = resolveMemberPrice({ basePriceCents: line.unitPriceCents, categoryIds: categoryIds.get(line.productId) ?? [], format: line.format, rules });
    return { line, productId: line.productId, basePriceCents: result.basePriceCents, memberPriceCents: result.memberPriceCents, savingsCents: result.savingsCents, ruleId: result.ruleId };
  });
  return {
    lines: priced,
    snapshot: {
      eligible: true,
      email: email.trim().toLowerCase(),
      lines: priced.map(({ productId, basePriceCents, memberPriceCents, savingsCents, ruleId }) => ({ productId, basePriceCents, memberPriceCents, savingsCents, ruleId })),
      savingsCents: priced.reduce((sum, item) => sum + item.savingsCents * item.line.quantity, 0),
      resolvedAt: new Date().toISOString(),
    },
  };
}
