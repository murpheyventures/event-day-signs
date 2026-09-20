# Event Day Signs — Milestone 5 Checklist

Status: Membership integration implemented behind staging configuration; Stripe activation pending
Scope: deterministic category/member pricing and membership plan configuration

## Completed

- [x] Add additive pricing-rule and membership-plan tables in `0042_membership_pricing.sql`.
- [x] Add a pure member-price resolver with priority, category specificity,
  format filtering, effective dates, and contribution-floor protection.
- [x] Add unit coverage for precedence, margin protection, and inactive rules.
- [x] Add additive membership state, Stripe customer/subscription mapping,
  idempotent event inbox, and audit history.
- [x] Add Stripe subscription Checkout, customer portal, and dedicated webhook
  endpoints with raw-body signature verification.
- [x] Add the protected admin Membership configuration page and public staging
  membership page.

## Remaining acceptance gates

- [ ] Decide final category discounts, contribution/margin floor, refund policy,
  cancellation policy, and trial policy.
- [ ] Configure the annual Stripe Price ID and membership customer-portal policy.
- [ ] Apply migration 0043 to staging and configure Stripe test credentials,
  annual test Price ID, and the `/api/webhook/stripe-membership` endpoint.
- [ ] Add member benefit snapshots to one-time orders and wire the existing
  member-price resolver into cart and checkout repricing.
- [ ] Integrate server-side member pricing into cart and checkout; no client
  price or membership claim may be trusted.
- [ ] Run migration fresh/upgrade validation and the full supported verification suite.

No live Stripe payment change is part of this implementation step; staging
activation still requires Stripe test configuration.
