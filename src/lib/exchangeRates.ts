// Configurable static exchange rates (Base: INR)
// In a real app, this would be fetched from a DB or API.
export const STATIC_RATES: Record<string, number> = {
  INR: 1,
  USD: 83.5, // 1 USD = 83.5 INR
  EUR: 89.2,
  GBP: 104.5,
};

export function getExchangeRate(currency: string): number {
  return STATIC_RATES[currency.toUpperCase()] || 1;
}

export function convertToINR(amount: number, currency: string): number {
  const rate = getExchangeRate(currency);
  return amount * rate;
}
