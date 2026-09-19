# Event Day Signs — Milestone 3 Checklist

Status: Provider boundary implementation complete; staging validation pending
Scope: guarded printed fulfillment submission and operational staging proof

## Completed

- [x] Add a Printify adapter behind the vendor-neutral `FulfillmentProvider` port.
- [x] Refuse provider submission unless `allowLiveSubmit` is explicitly enabled.
- [x] Preserve the order's idempotency reference as Printify's external order ID.
- [x] Map provider order statuses into the fulfillment job state vocabulary.
- [x] Add unit coverage for the no-submit guard, request mapping, and status mapping.

## Staging gate

- [ ] Apply `0041_delivery_catalog.sql` to the dedicated staging D1.
- [ ] Create a published digital bundle and verify only its approved assets resolve.
- [ ] Create a printed mapping without making a provider request.
- [ ] Verify duplicate fulfillment attempts reuse one `fulfillment_jobs.idempotency_key`.
- [ ] Configure staging-only Printify credentials and keep live submission disabled.
- [ ] Run one explicitly authorized provider test order, then reconcile its status.
- [ ] Run the complete verification suite in Linux CI or another supported environment.

No production migration or live Printify submission is part of this implementation.
