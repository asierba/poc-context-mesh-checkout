# Payments Integration

Checkout captures funds through the platform payments API (`POST /payments/charge`). Code: [`src/payments/client.ts`](../src/payments/client.ts).

## Idempotency key

`chk_<cart_id>`. Deterministic, so every retry of the same checkout — by our retry loop, the browser, or the customer double-clicking — hits payments with the same key and is charged at most once.

If the cart's contents change after a charge attempt (e.g. the customer adds an item in another tab), the body differs and payments returns `409 idempotency_conflict`. Checkout passes that through; the client reloads the cart.

## Retries

| Payments response | Checkout behaviour |
|---|---|
| `200` | Create the order |
| `402 card_declined` | No retry. Return `402` to the client |
| `409 idempotency_conflict` | No retry. Return `409` |
| `429 rate_limited` | Retry with exponential backoff: 200 ms, 400 ms (3 attempts total) |
| `5xx` / timeout | Same as 429 |
| Still failing after 3 attempts | Return `503 dependency_unavailable`; cart stays open |

## Timeout

5 seconds per attempt. Longer than the company default of 2 s because payments' p99 includes 3-D Secure round-trips to the card issuer. Approved in [adr/0003-payments-timeout-exception.md](adr/0003-payments-timeout-exception.md).

## Currency

Carts are single-currency. Checkout sends the cart's currency; if a merchant's currency is locked to something else, payments returns `400` and checkout surfaces it as `503` (it indicates a catalog misconfiguration, not a customer error) and pages checkout on-call.

## Refunds

On `order.cancelled`, checkout calls `POST /payments/refund` for the full order amount with reason `order_cancelled`. Partial refunds (returns) are handled by the returns team, not checkout.
