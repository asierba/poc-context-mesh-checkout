import { Pool } from "pg";
import { Cart } from "@/cart/cart";
import { InventoryClient } from "@/inventory/client";
import { PaymentsClient } from "@/payments/client";
import { CheckoutService } from "./place-order";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export function checkoutService(): CheckoutService {
  return new CheckoutService(
    pool,
    new InventoryClient(process.env.INVENTORY_API_URL!, Number(process.env.INVENTORY_TIMEOUT_MS ?? 800)),
    new PaymentsClient(process.env.PAYMENTS_API_URL!, Number(process.env.PAYMENTS_TIMEOUT_MS ?? 5000)),
  );
}

export async function loadCart(cartId: string, customerId: string): Promise<Cart | null> {
  const { rows } = await pool.query(
    `SELECT c.id, c.customer_id, c.currency, c.status,
            COALESCE(json_agg(json_build_object('sku', i.sku, 'quantity', i.quantity, 'unit_price_cents', i.unit_price_cents))
                     FILTER (WHERE i.sku IS NOT NULL), '[]') AS items
       FROM carts c LEFT JOIN cart_items i ON i.cart_id = c.id
      WHERE c.id = $1 AND c.customer_id = $2
      GROUP BY c.id`,
    [cartId, customerId],
  );
  return rows[0] ?? null;
}
