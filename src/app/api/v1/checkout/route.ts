import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CartNotCheckoutableError } from "@/cart/cart";
import { OutOfStockError } from "@/checkout/place-order";
import { checkoutService, loadCart } from "@/checkout/wiring";
import { InventoryUnavailableError } from "@/inventory/client";
import {
  CardDeclinedError,
  IdempotencyConflictError,
  PaymentsRateLimitedError,
  PaymentsUnavailableError,
} from "@/payments/client";

const body = z.object({
  cart_id: z.string().startsWith("cart_"),
  customer_email: z.string().email(),
  shipping_address: z.object({
    line1: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string().length(2),
  }),
});

export async function POST(request: NextRequest) {
  const parsed = body.safeParse(await request.json());
  if (!parsed.success) {
    return error(400, "invalid_request", parsed.error.message);
  }

  const customerId = request.headers.get("X-Acme-Customer-Id");
  if (!customerId) {
    return error(401, "unauthenticated", "missing customer identity");
  }

  const cart = await loadCart(parsed.data.cart_id, customerId);
  if (!cart) {
    return error(404, "cart_not_found", `cart ${parsed.data.cart_id} not found`);
  }

  try {
    const orderId = await checkoutService().placeOrder({ ...parsed.data, cart });
    return NextResponse.json({ order_id: orderId, status: "placed" }, { status: 201 });
  } catch (e) {
    if (e instanceof OutOfStockError) return error(422, "out_of_stock", e.message);
    if (e instanceof CartNotCheckoutableError) return error(422, "cart_not_checkoutable", e.message);
    if (e instanceof CardDeclinedError) return error(402, "card_declined", e.message);
    if (e instanceof IdempotencyConflictError) return error(409, "idempotency_conflict", e.message);
    if (isDependencyFailure(e)) return error(503, "dependency_unavailable", (e as Error).message);
    throw e;
  }
}

function isDependencyFailure(e: unknown): boolean {
  return (
    e instanceof InventoryUnavailableError ||
    e instanceof PaymentsUnavailableError ||
    e instanceof PaymentsRateLimitedError
  );
}

function error(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message, request_id: crypto.randomUUID() } },
    { status },
  );
}
