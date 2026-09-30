# Checkout Glossary

Terms specific to checkout. Company-wide terms are in the tech standards glossary; payments terms (charge, refund, idempotency key) are in the payments glossary.

- **Abandoned cart** — a cart with no activity for 7 days. Marked `abandoned`; deleted after 30 days.
- **Availability check** — the pre-charge call to inventory. Not a reservation.
- **Checkout** — the single `POST /v1/checkout` call that turns an open cart into an order.
- **Fail closed** — when a dependency is down, stop checkout rather than risk a bad order.
- **Oversell** — selling a unit we don't have. Handled by fulfilment cancelling and refunding.
- **Orphan charge** — a successful charge with no matching order, usually from a crash between charging and saving the order.
- **Outbox** — the table holding events waiting to be published to Kafka.
- **Outbox lag** — seconds between an outbox row being committed and published.
