# Checkout API

Base path `/v1`. Called by the storefront via the API gateway, which authenticates the customer and sets `X-Acme-Customer-Id`. Requests without that header get `401`.

## `POST /v1/checkout`

Places an order for an open cart.

**Request:**
```json
{
  "cart_id": "cart_7f3a9c",
  "customer_email": "jane@example.com",
  "shipping_address": {
    "line1": "1 High Street",
    "city": "London",
    "postcode": "N1 9GU",
    "country": "GB"
  }
}
```

**Response (201):**
```json
{ "order_id": "ord_5c2e…", "status": "placed" }
```

**Errors** (standard Acme error body):

| Status | `code` | Meaning | Client should |
|---|---|---|---|
| 400 | `invalid_request` | Body failed validation | Fix the request |
| 401 | `unauthenticated` | No customer identity from the gateway | Re-login |
| 402 | `card_declined` | Payments declined the card | Ask for another payment method |
| 404 | `cart_not_found` | Cart doesn't exist or isn't the caller's | Start a new cart |
| 409 | `idempotency_conflict` | Cart contents changed after a previous charge attempt | Reload the cart and retry |
| 422 | `out_of_stock` | One or more SKUs unavailable; message lists them | Remove items and retry |
| 422 | `cart_not_checkoutable` | Cart already checked out, abandoned, or empty | Show the existing order |
| 503 | `dependency_unavailable` | Inventory or payments unreachable | Retry after a few seconds |

**Idempotency:** the endpoint is idempotent per cart. A cart can only be checked out once, and the payments charge uses `chk_<cart_id>` as its idempotency key, so retrying after a timeout never double-charges. The endpoint does **not** yet accept a client `Idempotency-Key` header — see [roadmap.md](roadmap.md).

## `GET /v1/orders/{order_id}`

Returns an order owned by the calling customer.

```json
{
  "order_id": "ord_5c2e…",
  "status": "placed",
  "total_cents": 4999,
  "currency": "GBP",
  "items": [{ "sku": "SKU-123", "quantity": 1 }],
  "created_at": "2026-09-30T10:31:00Z"
}
```

`404` if the order doesn't exist or belongs to another customer.

## Rate limits

60 checkout attempts per customer per hour, enforced by the API gateway. Over the limit returns `429` with `Retry-After`.
