# checkout-service

Web checkout for the storefront. Owns the cart-to-confirmation flow: cart review, shipping selection, payment capture, order creation.

## What it does

- Renders the checkout pages (cart, address, payment, confirmation).
- Validates cart contents against inventory before payment.
- Calls the payments API to capture funds.
- Creates the order on success and emits `order.placed`.

## Stack

- Node 20 / TypeScript
- Next.js 14 (App Router) for SSR pages and route handlers
- Postgres 16 for cart + order state
- Redis 7 for short-lived session data
- Kafka for outbound `order.placed` / `order.cancelled` events (via transactional outbox)

## Getting started

```bash
cp .env.example .env
pnpm install
docker compose up -d         # postgres + redis + kafka
pnpm db:migrate
pnpm dev                     # web app + API
pnpm outbox:relay            # separate process: publishes outbox rows to Kafka
```

App is on `http://localhost:3000`. Health: `GET /api/healthz`.

## Tests

```bash
pnpm test            # unit + integration
pnpm test:e2e        # Playwright, requires docker compose stack
```

## Code layout

- `src/app/api/v1/checkout/` — `POST /v1/checkout` route handler.
- `src/checkout/` — orchestrates the flow: validate cart → check inventory → charge → place order.
- `src/cart/` — cart domain. Only mutated server-side; client state is derived.
- `src/payments/` — adapter to the platform payments API. Wraps `POST /payments/charge`, handles idempotency keys, retries, and `402` / `409` / `429` mapping.
- `src/inventory/` — read-only client for the inventory service; called pre-charge to prevent overselling.
- `src/orders/` — creates orders post-charge and writes `order.placed` to the outbox; `outbox-relay.ts` publishes it.
- `migrations/` — Postgres schema.

## Docs

| Doc | What's in it |
|---|---|
| [architecture.md](docs/architecture.md) | Components, checkout flow, dependencies, failure modes |
| [api.md](docs/api.md) | Public HTTP API: `POST /v1/checkout`, `GET /v1/orders/{id}` |
| [events.md](docs/events.md) | `order.placed` / `order.cancelled` schemas, consumers, delivery guarantees |
| [data-model.md](docs/data-model.md) | Tables, order states, data classification, retention |
| [payments-integration.md](docs/payments-integration.md) | How checkout calls payments: idempotency, retries, error mapping |
| [inventory-integration.md](docs/inventory-integration.md) | Pre-charge stock check, timeouts, fail-closed behaviour |
| [slos.md](docs/slos.md) | Tier, SLOs, alerts |
| [on-call.md](docs/on-call.md) | Rota, escalation, dashboards |
| [runbooks/](docs/runbooks/) | Payment failures, inventory outage, outbox backlog |
| [adr/](docs/adr/) | Architecture decisions |
| [roadmap.md](docs/roadmap.md) | Known gaps and planned work |
| [glossary.md](docs/glossary.md) | Checkout-domain terms |

## Owned by

Checkout team. On-call rota in PagerDuty under `checkout-prod`. Slack: `#team-checkout`.
