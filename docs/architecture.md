# Architecture

## Components

| Component | Runs as | Responsibility |
|---|---|---|
| Web app + API | Next.js on EKS (3–12 pods, HPA on CPU) | Checkout pages and `POST /v1/checkout` |
| Outbox relay | Separate deployment, 2 pods (leader via `FOR UPDATE SKIP LOCKED`) | Publishes `outbox` rows to Kafka |
| Postgres 16 | RDS, Multi-AZ | Carts, orders, outbox |
| Redis 7 | ElastiCache | Short-lived session data |

## Place-order flow

```
Browser ──POST /v1/checkout──▶ checkout-service
                                  │
                                  ├─1─▶ load cart (Postgres)            ── 404 if not the caller's cart
                                  ├─2─▶ inventory: POST /v1/availability ── 422 out_of_stock
                                  ├─3─▶ payments: POST /payments/charge  ── 402 / 409 passed through
                                  └─4─▶ one DB transaction:
                                         insert order, close cart, insert outbox row
                                                    │
                          outbox relay ◀────────────┘
                                  └──▶ Kafka topic order.placed
```

Order matters: stock is checked **before** charging so customers are never charged for items we can't ship. The order row is written **after** the charge succeeds; see [adr/0002-transactional-outbox.md](adr/0002-transactional-outbox.md) for why the event is not published directly.

## Dependencies

| Dependency | Type | Why sync | Timeout | Retries | If it's down |
|---|---|---|---|---|---|
| inventory-service | Sync HTTP | Need a yes/no before charging | 800 ms | none | Fail closed — checkout returns 503 |
| payments API | Sync HTTP | Need the charge result to create the order | 5 s ([exception ADR](adr/0003-payments-timeout-exception.md)) | 3 attempts on 429/5xx | Checkout returns 503; cart stays open |
| Postgres | Direct | Own data | 1 s statement timeout | none | Checkout down (Sev1) |
| Kafka | Via outbox | Async | — | relay retries forever | Orders still placed; events delayed |

## Known failure mode: charged but no order

If the process dies between step 3 and step 4, the customer is charged but no order exists. Because the idempotency key is derived from the cart (`chk_<cart_id>`), a retry of the same checkout re-uses the charge instead of double-charging. A nightly reconciliation job compares payments' charges against orders and alerts on orphans; see [runbooks/payment-failures.md](runbooks/payment-failures.md).

## Not yet done

- No circuit breaker on outbound calls yet — tracked in [roadmap.md](roadmap.md).
