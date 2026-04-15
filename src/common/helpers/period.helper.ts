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

/**
 * Pass-through. Money values must NEVER be rounded — the FE displays full precision.
 * Kept as a no-op so existing call sites remain valid; prefer removing usages over time.
 */
export function roundByCurrency(value: number, _currency: string): number {
  return value;
}
