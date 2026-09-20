export type PricingFormat = 'digital' | 'printed';

export interface PricingRule {
  id: string | number;
  categoryId: number | null;
  /** Null applies to both digital and printed offers. */
  format: PricingFormat | null;
  priority: number;
  discountBps: number;
  contributionFloorCents: number;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  enabled: boolean;
}

export interface MemberPriceInput {
  basePriceCents: number;
  costCents?: number | null;
  categoryIds: number[];
  format: PricingFormat;
  rules: PricingRule[];
  now?: string;
}

export interface MemberPrice {
  basePriceCents: number;
  memberPriceCents: number;
  savingsCents: number;
  ruleId: string | number | null;
  eligible: boolean;
}

const activeAt = (rule: PricingRule, now: string) =>
  rule.enabled &&
  (!rule.effectiveFrom || rule.effectiveFrom <= now) &&
  (!rule.effectiveUntil || now < rule.effectiveUntil);

/**
 * Resolve one member price without trusting client input. Rules are chosen by
 * priority, then category specificity (the caller supplies deepest-first
 * category ids), then greatest valid discount. A contribution floor is a
 * hard guard: an invalid rule is skipped rather than producing an unsafe price.
 */
export function resolveMemberPrice(input: MemberPriceInput): MemberPrice {
  const basePriceCents = Math.max(0, Math.trunc(input.basePriceCents));
  const now = input.now ?? new Date().toISOString();
  const categoryRank = new Map(input.categoryIds.map((id, index) => [id, index]));
  const candidates = input.rules
    .filter((rule) =>
      activeAt(rule, now) &&
      (rule.categoryId === null || categoryRank.has(rule.categoryId)) &&
      (rule.format === null || rule.format === input.format),
    )
    .map((rule) => {
      const discountBps = Math.max(0, Math.min(10000, Math.trunc(rule.discountBps)));
      const discounted = Math.floor((basePriceCents * (10000 - discountBps)) / 10000);
      const floor = Math.max(0, Math.trunc(input.costCents ?? 0)) + Math.max(0, Math.trunc(rule.contributionFloorCents));
      return { rule, discounted, floor, specificity: rule.categoryId === null ? -1 : -categoryRank.get(rule.categoryId)! };
    })
    .filter(({ discounted, floor }) => discounted >= floor)
    .sort((a, b) => b.rule.priority - a.rule.priority || b.specificity - a.specificity || b.rule.discountBps - a.rule.discountBps);

  const selected = candidates[0];
  if (!selected || selected.discounted >= basePriceCents) {
    return { basePriceCents, memberPriceCents: basePriceCents, savingsCents: 0, ruleId: null, eligible: false };
  }
  return {
    basePriceCents,
    memberPriceCents: selected.discounted,
    savingsCents: basePriceCents - selected.discounted,
    ruleId: selected.rule.id,
    eligible: true,
  };
}
