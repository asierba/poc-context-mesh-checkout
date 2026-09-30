# Events

Checkout publishes two events. Both use the CloudEvents envelope with `source: checkout-service`, are keyed by `order_id`, and are published through the transactional outbox ([adr/0002](adr/0002-transactional-outbox.md)).

## `order.placed` (v2)

Emitted once an order is created after a successful charge.

```json
{
  "order_id": "ord_5c2e…",
  "customer_id": "cus_abc123",
  "customer_email": "jane@example.com",
  "items": [{ "sku": "SKU-123", "quantity": 1 }],
  "total_cents": 4999,
  "currency": "GBP",
  "payment_id": "pay_xyz789"
}
```

Schema: `acme://schemas/order.placed/v2`. v1 (which had no `payment_id`) was retired 2026-06-01.

## `order.cancelled` (v1)

Emitted when an order is cancelled before dispatch (customer request or ops). Checkout also calls `POST /payments/refund` for the full amount with reason `order_cancelled`.

```json
{
  "order_id": "ord_5c2e…",
  "reason": "customer_request",
  "refund_payment_id": "pay_xyz789",
  "cancelled_at": "2026-09-30T11:02:00Z"
}
```

## Consumers

| Consumer | Event | Uses |
|---|---|---|
| fulfilment-service | `order.placed`, `order.cancelled` | Picks and ships; stops dispatch on cancel |
| inventory-service | `order.placed`, `order.cancelled` | Decrements / restores stock |
| notifications-service | `order.placed` | Sends the order confirmation email — **this is why `customer_email` is in the payload** |
| analytics pipeline | both | Revenue reporting |

`customer_email` is Confidential data. It's included only because notifications-service has a documented need; the analytics pipeline drops it on ingest.

## Delivery

- At-least-once. Consumers must dedupe on the CloudEvents `id`.
- Ordering is per `order_id` (Kafka partition key).
- Topic retention: 30 days (checkout is Tier 1).
- Typical publish lag from commit to Kafka: under 1 s. Alert if outbox lag > 60 s ([runbooks/outbox-backlog.md](runbooks/outbox-backlog.md)).
