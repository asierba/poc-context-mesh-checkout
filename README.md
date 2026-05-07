# checkout-service

Web checkout for the storefront. Owns the cart-to-confirmation flow: cart review, shipping selection, payment capture, order creation.

## What it does

- Renders the checkout pages (cart, address, payment, confirmation).
- Validates cart contents against inventory before payment.
- Calls the payments API to capture funds.
- Creates the order on success and emits `order.placed`.

## Stack

- Node 20 / TypeScript
- Next.js (App Router) for SSR pages and route handlers
- Postgres for cart + order state
- Redis for idempotency keys and short-lived session data
- Kafka for outbound `order.placed` / `order.cancelled` events

## Getting started

```bash
pnpm install
docker compose up -d         # postgres + redis + kafka
pnpm db:migrate
pnpm dev
```

App is on `http://localhost:3000`. Health: `GET /healthz`.

## Tests

```bash
pnpm test            # unit + integration
pnpm test:e2e        # Playwright, requires docker compose stack
```

## Architecture

- `src/app/checkout/*` — route handlers and server components (the user-facing pages).
- `src/cart/` — cart domain. Only mutated server-side; client state is derived.
- `src/payments/` — adapter to the platform payments API. Wraps `POST /payments/charge`, handles idempotency keys, retries, and `402` / `409` / `429` mapping.
- `src/orders/` — creates orders post-charge and emits the kafka event.
- `src/inventory/` — read-only client for the inventory service; called pre-charge to prevent overselling.

## Owned by

Checkout team. On-call rota in PagerDuty under `checkout-prod`.

## Related services

- **Payments** — Team A. Charge / refund.
- **Inventory** — Team B. Read-only stock checks.
- **Subscriptions** — Team C. Not used by checkout.
- **Payouts** — Team D. Not used by checkout.
