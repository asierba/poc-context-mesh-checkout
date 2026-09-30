# 0002 — Publish order events through a transactional outbox

Status: Accepted
Date: 2025-03-04

## Context

The first version published `order.placed` to Kafka straight after inserting the order. Twice in Q4 2024 the process died between the two steps: orders existed that fulfilment never heard about, and customers were charged for orders that never shipped.

## Decision

Write the event to an `outbox` table in the **same transaction** as the order insert. A separate relay process reads unpublished rows and publishes them to Kafka, then marks them published.

## Consequences

- An order and its event are committed atomically — no lost events.
- Events are delivered at least once (the relay can publish and then crash before marking the row). Consumers already dedupe on the CloudEvents `id`.
- One more process to run and monitor (`OutboxLagHigh` alert).
- Adds up to ~500 ms of publish latency (relay poll interval).

## Alternatives considered

- **Debezium CDC on the orders table:** no extra table, but ties the event schema to our table schema and adds a Kafka Connect cluster to operate.
- **Publish then insert:** creates events for orders that might not exist.
