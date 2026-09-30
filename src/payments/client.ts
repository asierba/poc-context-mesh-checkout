import { Money } from "@/lib/money";
import { withRetry } from "@/lib/retry";

export type ChargeRequest = {
  customer_id: string;
  amount: Money;
  idempotency_key: string;
};

export type ChargeResult = {
  payment_id: string;
  captured_at: string;
};

export class CardDeclinedError extends Error {}
export class IdempotencyConflictError extends Error {}
export class PaymentsRateLimitedError extends Error {}
export class PaymentsUnavailableError extends Error {}

export class PaymentsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  charge(request: ChargeRequest): Promise<ChargeResult> {
    return withRetry(
      {
        maxAttempts: 3,
        baseDelayMs: 200,
        isRetryable: (error) =>
          error instanceof PaymentsRateLimitedError || error instanceof PaymentsUnavailableError,
      },
      () => this.postCharge(request),
    );
  }

  private async postCharge(request: ChargeRequest): Promise<ChargeResult> {
    const response = await fetch(`${this.baseUrl}/payments/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: request.customer_id,
        amount_cents: request.amount.amount_cents,
        currency: request.amount.currency,
        idempotency_key: request.idempotency_key,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    }).catch((error) => {
      throw new PaymentsUnavailableError(`payments unreachable: ${error}`);
    });

    if (response.ok) {
      return response.json();
    }
    throw toPaymentsError(response.status);
  }
}

function toPaymentsError(status: number): Error {
  switch (status) {
    case 402:
      return new CardDeclinedError("card declined");
    case 409:
      return new IdempotencyConflictError("idempotency key reused with a different body");
    case 429:
      return new PaymentsRateLimitedError("payments rate limited");
    default:
      return new PaymentsUnavailableError(`payments returned ${status}`);
  }
}
