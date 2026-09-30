# SLOs

Checkout is a **Tier 1** service.

| SLO | Target | Window | Measured at |
|---|---|---|---|
| Availability of `POST /v1/checkout` (non-5xx) | 99.95% | 30 days rolling | API gateway |
| Latency of `POST /v1/checkout` | p95 < 1.5 s, p99 < 4 s | 30 days rolling | API gateway |
| Event freshness (commit → Kafka) | 99% under 5 s | 7 days rolling | Outbox relay metric `outbox_lag_seconds` |

4xx responses (declined cards, out of stock) don't count against availability.

## Error budget policy

- Budget burned > 50% in a window: feature work paused for reliability work until it recovers.
- Budget exhausted: deploy freeze except fixes, until the rolling window recovers.

## Alerts

| Alert | Condition | Severity |
|---|---|---|
| `CheckoutAvailabilityFastBurn` | 14.4× burn rate over 1 h | Page |
| `CheckoutAvailabilitySlowBurn` | 6× burn rate over 6 h | Page |
| `CheckoutLatencyP99High` | p99 > 4 s for 10 min | Page |
| `PaymentsDeclineRateHigh` | Decline rate > 15% for 15 min | Ticket (usually an issuer problem) |
| `OutboxLagHigh` | `outbox_lag_seconds` > 60 for 5 min | Page |
| `OrphanChargesFound` | Nightly reconciliation finds charges with no order | Ticket |

Dashboards are in Datadog under **Checkout / Overview**.
