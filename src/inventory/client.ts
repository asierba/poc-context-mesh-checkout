import { CartItem } from "@/cart/cart";

export type AvailabilityResult = {
  available: boolean;
  unavailable_skus: string[];
};

export class InventoryClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async checkAvailability(items: CartItem[]): Promise<AvailabilityResult> {
    const response = await fetch(`${this.baseUrl}/v1/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(({ sku, quantity }) => ({ sku, quantity })) }),
      signal: AbortSignal.timeout(this.timeoutMs),
    }).catch((error) => {
      throw new InventoryUnavailableError(`inventory unreachable: ${error}`);
    });
    if (!response.ok) {
      throw new InventoryUnavailableError(`inventory returned ${response.status}`);
    }
    return response.json();
  }
}

export class InventoryUnavailableError extends Error {}
