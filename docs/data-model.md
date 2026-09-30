# Data Model

Schema lives in [`migrations/`](../migrations). The database is private to checkout — other services get data through the API or events.

## Tables

| Table | Purpose |
|---|---|
| `carts` | One row per cart. `status`: `open`, `checked_out`, `abandoned` |
| `cart_items` | Lines in a cart. Price is captured when the item is added |
| `orders` | Orders created after a successful charge |
| `outbox` | Events waiting to be published to Kafka |

## Order states

```
placed ──▶ dispatched ──▶ delivered
   │
   └──▶ cancelled   (only before dispatched; triggers a full refund)
```

`dispatched` and `delivered` are set when checkout consumes fulfilment's `shipment.*` events.

## Data classification

| Field | Class | Handling |
|---|---|---|
| `orders.customer_email` | Confidential | Encrypted at rest (RDS); masked in logs |
| `orders.shipping_address` | Confidential | Encrypted at rest; never logged |
| `orders.payment_id`, `customer_id`, `cart_id` | Internal | — |
| SKUs, prices, totals | Internal | — |
| Card data | Restricted | **Never touches checkout.** The browser tokenises cards directly with the vault; checkout only sees `customer_id` |

## Retention

- `carts` in `abandoned` status are deleted after 30 days.
- `orders`: `customer_email` and `shipping_address` are anonymised 24 months after the order, or within 30 days of a verified GDPR erasure request (handled by the `privacy-erasure` consumer).
- `outbox` rows are deleted 7 days after `published_at`.
