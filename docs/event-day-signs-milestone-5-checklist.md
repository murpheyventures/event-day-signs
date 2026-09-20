# Event Day Signs — Milestone 5 Checklist

Status: Pricing foundation implemented; membership integration pending owner decisions
Scope: deterministic category/member pricing and membership plan configuration

## Completed

- [x] Add additive pricing-rule and membership-plan tables in `0042_membership_pricing.sql`.
- [x] Add a pure member-price resolver with priority, category specificity,
  format filtering, effective dates, and contribution-floor protection.
- [x] Add unit coverage for precedence, margin protection, and inactive rules.

## Remaining acceptance gates

- [ ] Decide final category discounts, contribution/margin floor, refund policy,
  cancellation policy, and trial policy.
- [ ] Configure the annual Stripe Price ID and membership customer-portal policy.
- [ ] Add the Stripe subscription adapter, idempotent event inbox, membership
  state machine, admin editor, and benefit snapshots.
- [ ] Integrate server-side member pricing into cart and checkout; no client
  price or membership claim may be trusted.
- [ ] Run migration fresh/upgrade validation and the full supported verification suite.

No Stripe subscription purchase or live payment change is part of this foundation step.
