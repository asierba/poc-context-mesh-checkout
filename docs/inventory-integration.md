# Inventory Integration

Checkout asks inventory-service whether every item in the cart is in stock **before** charging. Code: [`src/inventory/client.ts`](../src/inventory/client.ts).

## Call

`POST {INVENTORY_API_URL}/v1/availability`

```json
{ "items": [{ "sku": "SKU-123", "quantity": 2 }] }
```

Response:

```json
{ "available": false, "unavailable_skus": ["SKU-123"] }
```

## Behaviour

- **Timeout:** 800 ms. No retries — the customer is waiting and a slow inventory is usually an overloaded one.
- **Fail closed:** if inventory errors or times out, checkout returns `503` and does not charge. We'd rather lose a sale than oversell.
- **Not a reservation.** The availability check doesn't hold stock. Stock is decremented when inventory consumes `order.placed`. There's a small race window where two customers can buy the last unit; fulfilment handles it by cancelling the later order (`order.cancelled`, reason `out_of_stock_after_payment`), which refunds the customer.

## Why not reserve stock?

Considered and rejected in 2025: reservations need a TTL and a release path for abandoned checkouts, and the oversell rate without them is ~0.02% of orders. Revisit if that exceeds 0.1%.
