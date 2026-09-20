# Event Day Signs — Milestone 6 Checklist

Status: implementation complete; policy and supported-environment validation remain
Scope: native verified-purchase reviews attached to normalized designs

## Completed in this slice

- [x] Add additive review, expiring-token, and audit tables in migration `0045`.
- [x] Add a repository that issues tokens only for paid order items.
- [x] Add one-review-per-order-item enforcement, expiry, redemption, pending
  moderation state, and approved-review reads.
- [x] Add the protected moderation list, approve/reject/hide actions, merchant
  responses, audit entries, and approved-review aggregate queries.
- [x] Add an approved-only public JSON projection with rating aggregates for
  normalized design IDs.

## Remaining

- [x] Add review submission page/API; rate limiting remains open.
- [x] Add bounded scheduled review-request delivery through the configured email seam.
- [x] Add moderation/admin list, approve/reject/hide, merchant reply, and audit UI.
- [x] Render approved reviews and aggregates on normalized design pages only.
- [x] Add abuse reports and the future customer-photo extension slot.
- [ ] Decide moderation default, request timing, display-name policy, and any
  incentive/disclosure language.
- [ ] Run fresh/upgrade migration validation and supported-environment verify.

Owner decisions remain placeholders until the review UI becomes customer-visible.
