import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Cart } from "@/cart/cart";
import { Money } from "@/lib/money";

export type ShippingAddress = {
  line1: string;
  city: string;
  postcode: string;
  country: string;
};

export type NewOrder = {
  cart: Cart;
  customer_email: string;
  shipping_address: ShippingAddress;
  total: Money;
  payment_id: string;
};

export async function placeOrder(pool: Pool, order: NewOrder): Promise<string> {
  const orderId = `ord_${randomUUID()}`;
  const db = await pool.connect();

  await db.query("BEGIN");
  try {
    await db.query(
      `INSERT INTO orders (id, cart_id, customer_id, customer_email, shipping_address, total_cents, currency, payment_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'placed')`,
      [
        orderId,
        order.cart.id,
        order.cart.customer_id,
        order.customer_email,
        order.shipping_address,
        order.total.amount_cents,
        order.total.currency,
        order.payment_id,
      ],
    );
    await db.query("UPDATE carts SET status = 'checked_out', updated_at = now() WHERE id = $1", [order.cart.id]);
    await db.query("INSERT INTO outbox (id, topic, payload) VALUES ($1, 'order.placed', $2)", [
      `evt_${randomUUID()}`,
      orderPlacedEvent(orderId, order),
    ]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }

  return orderId;
}

function orderPlacedEvent(orderId: string, order: NewOrder) {
  return {
    order_id: orderId,
    customer_id: order.cart.customer_id,
    customer_email: order.customer_email,
    items: order.cart.items.map(({ sku, quantity }) => ({ sku, quantity })),
    total_cents: order.total.amount_cents,
    currency: order.total.currency,
    payment_id: order.payment_id,
  };
}
