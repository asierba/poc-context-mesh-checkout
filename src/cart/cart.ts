import { Money, sum } from "@/lib/money";

export type CartItem = {
  sku: string;
  quantity: number;
  unit_price_cents: number;
};

export type Cart = {
  id: string;
  customer_id: string;
  currency: string;
  status: "open" | "checked_out" | "abandoned";
  items: CartItem[];
};

export function cartTotal(cart: Cart): Money {
  const lines = cart.items.map((item) => ({
    amount_cents: item.unit_price_cents * item.quantity,
    currency: cart.currency,
  }));
  return sum(lines, cart.currency);
}

export function assertCheckoutable(cart: Cart): void {
  if (cart.status !== "open") {
    throw new CartNotCheckoutableError(`cart ${cart.id} is ${cart.status}`);
  }
  if (cart.items.length === 0) {
    throw new CartNotCheckoutableError(`cart ${cart.id} is empty`);
  }
}

export class CartNotCheckoutableError extends Error {}
