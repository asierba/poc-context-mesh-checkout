# 0003 — Exception: 5 s timeout on payments calls

Status: Accepted (exception ADR — expires 2026-11-15)
Date: 2025-11-15

## Context

The architecture principles set a default outbound timeout of 2 s. Payments' `POST /payments/charge` p99 is 3.1 s because some charges include a 3-D Secure round-trip to the card issuer. With a 2 s timeout, ~1.4% of charges timed out on our side while succeeding on payments' side, causing retries (safe, thanks to idempotency keys) and a noticeably slower checkout for those customers.

## Decision

Use a 5 s per-attempt timeout for payments calls only. All other outbound calls keep the default (inventory uses 800 ms).

## Consequences

- Worst case for a charge with retries: 5 s × 3 attempts + backoff ≈ 15.6 s. The storefront shows a "still processing" state after 4 s.
- Pods can hold more in-flight requests during a payments slowdown; HPA max raised from 8 to 12 pods.

## Expiry

Exception ADRs expire after 12 months. Payments plans to move 3-D Secure to an async flow in 2026 Q4, at which point we'd drop back to 2 s. Renew or close before **2026-11-15**.
