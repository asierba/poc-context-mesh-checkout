export type Money = {
  amount_cents: number;
  currency: string;
};

export function sum(items: Money[], currency: string): Money {
  const mismatched = items.find((item) => item.currency !== currency);
  if (mismatched) {
    throw new Error(`currency mismatch: expected ${currency}, got ${mismatched.currency}`);
  }
  return {
    amount_cents: items.reduce((total, item) => total + item.amount_cents, 0),
    currency,
  };
}
