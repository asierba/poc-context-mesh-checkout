import { afterEach, describe, expect, it, vi } from "vitest";
import { CardDeclinedError, IdempotencyConflictError, PaymentsClient } from "./client";

const request = {
  customer_id: "cus_abc123",
  amount: { amount_cents: 4999, currency: "GBP" },
  idempotency_key: "chk_cart_123",
};

function respondWith(...statuses: number[]) {
  const fetchMock = vi.fn();
  for (const status of statuses) {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ payment_id: "pay_1", captured_at: "2026-09-30T10:31:00Z" }), { status }),
    );
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("PaymentsClient.charge", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the payment on success", async () => {
    respondWith(200);
    await expect(new PaymentsClient("http://payments", 5000).charge(request)).resolves.toMatchObject({
      payment_id: "pay_1",
    });
  });

  it("does not retry a declined card", async () => {
    const fetchMock = respondWith(402);
    await expect(new PaymentsClient("http://payments", 5000).charge(request)).rejects.toBeInstanceOf(
      CardDeclinedError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry an idempotency conflict", async () => {
    const fetchMock = respondWith(409);
    await expect(new PaymentsClient("http://payments", 5000).charge(request)).rejects.toBeInstanceOf(
      IdempotencyConflictError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries rate limiting up to 3 attempts", async () => {
    const fetchMock = respondWith(429, 429, 200);
    await expect(new PaymentsClient("http://payments", 5000).charge(request)).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
