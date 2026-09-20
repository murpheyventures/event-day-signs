# Event Day Signs — Milestone 5 Checklist

Status: Stripe staging webhooks configured; test catalog and end-to-end checkout validation remain
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
- [x] Add separate staging webhook destinations for regular orders and
  memberships: `/api/webhook/stripe` and `/api/webhook/stripe-membership`.
- [x] Add separate encrypted admin fields for the regular and membership Stripe
  webhook signing secrets.
- [x] Apply migration 0043 to staging.
- [x] Fix credential-only settings saves so a cache-purge failure cannot report
  a successfully stored Stripe secret as a failed save.

## Remaining acceptance gates

- [ ] Decide final category discounts, contribution/margin floor, refund policy,
  cancellation policy, and trial policy.
- [ ] Configure Stripe test credentials, the annual test Price ID, and the
  membership customer-portal policy.
- [ ] Create or import at least one published test product, including the
  approved digital and printed offers needed for checkout testing.
- [ ] Verify a normal Stripe test checkout and a membership test checkout,
  including signed webhook delivery and the resulting order/membership state.
- [ ] Add member benefit snapshots to one-time orders and wire the existing
  member-price resolver into cart and checkout repricing.
- [ ] Integrate server-side member pricing into cart and checkout; no client
  price or membership claim may be trusted.
- [ ] Run migration fresh/upgrade validation and the full supported verification suite.

No live Stripe payment change is part of this implementation step. Staging is
still intentionally limited to Stripe test mode and must not submit orders to
Printify.
