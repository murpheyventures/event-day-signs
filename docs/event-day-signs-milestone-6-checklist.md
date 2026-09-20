# Event Day Signs — Milestone 6 Checklist

Status: review foundation started
Scope: native verified-purchase reviews attached to normalized designs

## Completed in this slice

- [x] Add additive review, expiring-token, and audit tables in migration `0045`.
- [x] Add a repository that issues tokens only for paid order items.
- [x] Add one-review-per-order-item enforcement, expiry, redemption, pending
  moderation state, and approved-review reads.

## Remaining

- [ ] Add review submission page/API and rate limiting.
- [ ] Add review-request scheduling through the email outbox.
- [ ] Add moderation/admin list, approve/reject/hide, merchant reply, and audit UI.
- [ ] Render approved reviews and aggregates on normalized design pages only.
- [ ] Add abuse reports and the future customer-photo extension slot.
- [ ] Decide moderation default, request timing, display-name policy, and any
  incentive/disclosure language.
- [ ] Run fresh/upgrade migration validation and supported-environment verify.

Owner decisions remain placeholders until the review UI becomes customer-visible.
