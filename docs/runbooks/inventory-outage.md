# Runbook: Inventory outage

Checkout fails closed when inventory is unavailable ([inventory-integration.md](../inventory-integration.md)), so an inventory outage means **no checkouts** — treat it as Sev1.

## Triage

1. Confirm on Datadog: inventory panel shows timeouts or 5xx.
2. Page `inventory-prod` and declare Sev1.

## Emergency bypass

There's a LaunchDarkly flag `checkout-skip-inventory-check` that lets checkout proceed without the stock check.

- Only an incident commander can approve turning it on.
- Expect oversells; fulfilment will cancel and refund those orders.
- Turn it off as soon as inventory recovers, and note the window in the incident timeline so fulfilment can review orders placed during it.
