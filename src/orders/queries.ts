import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type OrderView = {
  order_id: string;
  status: string;
  total_cents: number;
  currency: string;
  items: { sku: string; quantity: number }[];
  created_at: string;
};

export async function findOrder(orderId: string, customerId: string): Promise<OrderView | null> {
  const { rows } = await pool.query(
    `SELECT o.id AS order_id, o.status, o.total_cents, o.currency, o.created_at,
            json_agg(json_build_object('sku', i.sku, 'quantity', i.quantity)) AS items
       FROM orders o JOIN cart_items i ON i.cart_id = o.cart_id
      WHERE o.id = $1 AND o.customer_id = $2
      GROUP BY o.id`,
    [orderId, customerId],
  );
  return rows[0] ?? null;
}
