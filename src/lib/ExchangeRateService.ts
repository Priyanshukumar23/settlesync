export class ExchangeRateService {
  static readonly STATIC_RATES: Record<string, number> = {
    'USD': 83.50, // 1 USD = 83.50 INR
    'INR': 1.0,
  };

  /**
   * Returns the exchange rate from the given currency to the base currency (INR)
   */
  static getRate(currency: string): number {
    return this.STATIC_RATES[currency?.toUpperCase()] || 1.0;
  }

  /**
   * Converts an amount to the base currency (INR)
   */
  static convertToINR(amount: number, currency: string): number {
    const rate = this.getRate(currency);
    return Number((amount * rate).toFixed(2));
  }
}
