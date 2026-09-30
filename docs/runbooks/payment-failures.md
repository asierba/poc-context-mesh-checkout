# Runbook: Payment failures

## Symptoms

- `CheckoutAvailabilityFastBurn` firing with most errors on the payments dependency panel, or
- `PaymentsDeclineRateHigh` firing, or
- Customers reporting "payment failed" but cards are fine.

## Triage

| What you see | Likely cause | Action |
|---|---|---|
| Lots of `503 dependency_unavailable`, payments 5xx/timeouts | Payments degraded | Page `payments-prod`; declare Sev1 if > 5% of checkouts fail |
| Lots of `429` from payments | We're over payments' rate limit (usually a traffic spike or retry storm) | Check checkout pod count; scale down HPA max if a retry storm; tell `#team-payments` |
| Decline rate spike, one card network | Issuer or acquirer problem | Nothing to fix on our side; post in `#incidents` so CS knows |
| Spike in `409 idempotency_conflict` | Frontend bug letting cart change mid-checkout | Check recent storefront deploys; roll back |
| `400` from payments, currency mismatch | Merchant currency lock vs. catalog currency | Page catalog on-call; it's a data problem |

## Orphan charges (charged, no order)

`OrphanChargesFound` ticket lists `payment_id`s with no matching order.

1. For each, look up the cart by idempotency key `chk_<cart_id>`.
2. If the cart is still `open` and items are in stock: re-run checkout for that cart via the admin tool — the same key re-uses the existing charge.
3. Otherwise refund with `POST /payments/refund`, reason `orphan_charge`, and ask CS to contact the customer.
