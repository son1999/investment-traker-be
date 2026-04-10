export function getPeriodStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case '1m':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3m':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6m':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getMonthKey(date: Date): string {
  return toDateStr(date).substring(0, 7);
}

const ZERO_DECIMAL_CURRENCIES = new Set(['VND', 'JPY', 'KRW']);

/**
 * Round a monetary value based on currency.
 * VND/JPY/KRW → 0 decimals, others (USD/USDT/EUR) → 2 decimals.
 */
export function roundByCurrency(value: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(value);
  }
  return Math.round(value * 100) / 100;
}
