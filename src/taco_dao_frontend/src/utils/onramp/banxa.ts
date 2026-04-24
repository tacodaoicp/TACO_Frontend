export interface BanxaParams {
  walletAddress: string
  fiatAmount?: number
  fiatCurrency?: string
}

export function buildBanxaUrl({ walletAddress, fiatAmount = 50, fiatCurrency = 'EUR' }: BanxaParams): string {
  const qs = new URLSearchParams({
    coinType: 'ICP',
    fiatType: fiatCurrency,
    fiatAmount: String(fiatAmount),
    walletAddress,
  })
  return `https://checkout.banxa.com/?${qs.toString()}`
}
