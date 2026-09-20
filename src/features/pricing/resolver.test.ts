import { describe, expect, it } from 'vitest';
import { resolveMemberPrice, type PricingRule } from './resolver';

const rule = (overrides: Partial<PricingRule> = {}): PricingRule => ({
  id: 'r1', categoryId: null, format: null, priority: 0, discountBps: 1000,
  contributionFloorCents: 0, enabled: true, ...overrides,
});

describe('resolveMemberPrice', () => {
  it('selects priority, then the most specific category', () => {
    const result = resolveMemberPrice({
      basePriceCents: 10000, categoryIds: [20, 10], format: 'printed', now: '2026-01-01',
      rules: [rule({ id: 'parent', categoryId: 10, priority: 5, discountBps: 2000 }), rule({ id: 'child', categoryId: 20, priority: 5, discountBps: 1000 })],
    });
    expect(result).toMatchObject({ ruleId: 'child', memberPriceCents: 9000, savingsCents: 1000 });
  });

  it('skips a discount that violates the contribution floor', () => {
    const result = resolveMemberPrice({
      basePriceCents: 1000, costCents: 900, categoryIds: [], format: 'digital',
      rules: [rule({ discountBps: 2000, contributionFloorCents: 200 }), rule({ id: 'safe', discountBps: 500 })],
    });
    expect(result).toMatchObject({ ruleId: 'safe', memberPriceCents: 950 });
  });

  it('filters inactive, expired, and format-specific rules', () => {
    const result = resolveMemberPrice({
      basePriceCents: 1000, categoryIds: [], format: 'printed', now: '2026-06-01',
      rules: [rule({ id: 'off', enabled: false, discountBps: 9000 }), rule({ id: 'expired', effectiveUntil: '2026-01-01', discountBps: 9000 }), rule({ id: 'digital', format: 'digital', discountBps: 9000 })],
    });
    expect(result.eligible).toBe(false);
    expect(result.memberPriceCents).toBe(1000);
  });
});
