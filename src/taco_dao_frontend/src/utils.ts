/**
 * Formats a number as US dollar currency.
 * @param amount - The number to format.
 * @param minimumFractionDigits - The minimum number of fraction digits to use (default: 2).
 * @returns A string representing the formatted currency.
 */
export function formatUSD(amount: number, minimumFractionDigits: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2
    }).format(amount)
  }