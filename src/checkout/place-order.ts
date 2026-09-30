import { Pool } from "pg";
import { Cart, assertCheckoutable, cartTotal } from "@/cart/cart";
import { InventoryClient } from "@/inventory/client";
import { ShippingAddress, placeOrder } from "@/orders/orders";
import { PaymentsClient } from "@/payments/client";

export type PlaceOrderInput = {
  cart: Cart;
  customer_email: string;
  shipping_address: ShippingAddress;
};

export class OutOfStockError extends Error {
  constructor(readonly skus: string[]) {
    super(`out of stock: ${skus.join(", ")}`);
  }
}

export class CheckoutService {
  constructor(
    private readonly db: Pool,
    private readonly inventory: InventoryClient,
    private readonly payments: PaymentsClient,
  ) {}

  async placeOrder(input: PlaceOrderInput): Promise<string> {
    assertCheckoutable(input.cart);

    const availability = await this.inventory.checkAvailability(input.cart.items);
    if (!availability.available) {
      throw new OutOfStockError(availability.unavailable_skus);
    }

    const total = cartTotal(input.cart);
    const charge = await this.payments.charge({
      customer_id: input.cart.customer_id,
      amount: total,
      idempotency_key: `chk_${input.cart.id}`,
    });

    return placeOrder(this.db, {
      cart: input.cart,
      customer_email: input.customer_email,
      shipping_address: input.shipping_address,
      total,
      payment_id: charge.payment_id,
    });
  }
}
