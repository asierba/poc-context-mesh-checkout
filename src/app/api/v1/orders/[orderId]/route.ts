import { NextRequest, NextResponse } from "next/server";
import { findOrder } from "@/orders/queries";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  const customerId = request.headers.get("X-Acme-Customer-Id");
  if (!customerId) {
    return error(401, "unauthenticated", "missing customer identity");
  }

  const order = await findOrder(params.orderId, customerId);
  if (!order) {
    return error(404, "order_not_found", `order ${params.orderId} not found`);
  }
  return NextResponse.json(order);
}

function error(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message, request_id: crypto.randomUUID() } },
    { status },
  );
}
