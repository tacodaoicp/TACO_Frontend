/**
 * Composable for placing and managing limit orders.
 * Based on Sections 6.1-6.4 of FRONTEND_DEV_GUIDE.md.
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { createBuyOrderParams, createSellOrderParams, calculateRevokeFee } from '../utils/price-math'
import { depositToken, removeDepositFromCache, approveExchangeDeposit, calculateRequiredDeposit } from '../utils/deposit'
import { isApprovalDeclined } from '../utils/approvalPrompt'
import { classifyExchangeError, isTransportError, verifyAfterTransportError, type VerifyStatus } from '../utils/errors'
import { useExchangeToast } from './useExchangeToast'
import type { TokenInfo } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export type OrderSide = 'buy' | 'sell'
export type OrderPhase = 'idle' | 'depositing' | 'submitting' | 'success' | 'resting' | 'error'

export interface LimitOrderOptions {
  allOrNothing: boolean
  strictlyOTC: boolean
  ocLink: string
  pub: boolean
  excludeDAO: boolean
}

export function useLimitOrder(
  token0: Ref<string>,
  token1: Ref<string>,
  decimals0: Ref<number>,
  decimals1: Ref<number>,
) {
  const store = useExchangeStore()
  const toast = useExchangeToast()

  const side = ref<OrderSide>('buy')
  const price = ref('')
  const amount = ref('')
  const phase = ref<OrderPhase>('idle')
  const error = ref('')
  const resultAccesscode = ref('')
  const options = ref<LimitOrderOptions>({
    allOrNothing: false,
    strictlyOTC: false,
    ocLink: '',
    pub: true,
    excludeDAO: false,
  })

  // Computed: which token the user deposits
  const depositToken0 = computed(() => side.value === 'sell')
  const depositTokenAddress = computed(() =>
    depositToken0.value ? token0.value : token1.value
  )
  const depositDecimals = computed(() =>
    depositToken0.value ? decimals0.value : decimals1.value
  )

  // Warm the V2 allowance cache for whichever token this order would deposit.
  watch(depositTokenAddress, (t) => { if (t) store.prefetchExchangeAllowance(t) }, { immediate: true })

  // Computed total
  const total = computed(() => {
    const p = parseFloat(price.value)
    const a = parseFloat(amount.value)
    if (!p || !a || isNaN(p) || isNaN(a)) return 0
    return p * a
  })

  // Estimated fee (trading fee on the deposit amount)
  const estimatedFee = computed(() => {
    if (total.value <= 0) return 0
    const feeBps = Number(store.tradingFeeBps)
    if (side.value === 'buy') {
      return total.value * feeBps / 10000
    }
    const a = parseFloat(amount.value) || 0
    return a * feeBps / 10000
  })

  // Estimated revoke fee
  const estimatedRevokeFee = computed(() => {
    const a = parseFloat(amount.value) || 0
    if (a <= 0) return 0
    const depositAmount = side.value === 'buy' ? total.value : a
    const decimals = depositDecimals.value
    const rawAmount = BigInt(Math.round(depositAmount * 10 ** decimals))
    const fee = calculateRevokeFee(rawAmount, store.tradingFeeBps, store.revokeFeeDivisor)
    return Number(fee) / 10 ** decimals
  })

  function getTokenInfo(address: string) {
    return store.tokens.find((t: TokenInfo) => t.address === address)
  }

  async function placeOrder(): Promise<void> {
    const p = parseFloat(price.value)
    const a = parseFloat(amount.value)
    if (!p || !a || p <= 0 || a <= 0) {
      error.value = 'Enter a valid price and amount.'
      return
    }

    if (!store.isAuthenticated) {
      error.value = 'Connect your wallet first.'
      return
    }

    const quantityRaw = BigInt(Math.round(a * 10 ** decimals0.value))

    const params = side.value === 'buy'
      ? createBuyOrderParams(quantityRaw, p, decimals0.value, decimals1.value)
      : createSellOrderParams(quantityRaw, p, decimals0.value, decimals1.value)

    // Determine deposit token info
    const tokenInit = side.value === 'buy' ? token1.value : token0.value
    const depositAmount = params.amount_init
    const tokenInfo = getTokenInfo(tokenInit)
    if (!tokenInfo) {
      error.value = 'Token not found.'
      return
    }

    error.value = ''
    phase.value = 'depositing'

    try {
      // Path decided ONCE per action. V2 approves the exchange to pull the
      // gross (what V1 would transfer); V1 transfers to the treasury.
      const v2 = store.useV2Deposit(tokenInit)
      const transferFee = BigInt(tokenInfo.transfer_fee)
      const gross = calculateRequiredDeposit(depositAmount, store.tradingFeeBps, transferFee)

      // Step 1: Deposit tokens to treasury (V1) or approve the pull (V2)
      let blockNumber: bigint | null = null
      if (v2) {
        // Stale-amount guard: fees paid since the amount was set can make it
        // exceed the live balance. Fail here with a clear message instead of
        // letting the ledger decline the pull.
        let bal: bigint | null = null
        try { bal = await store.userBalanceQuery(tokenInit).refresh() } catch { /* unknown; let the ledger decide */ }
        if (bal != null && bal < gross + 2n * transferFee) {
          error.value = 'Your balance no longer covers this order and its fees. Lower the amount and try again.'
          phase.value = 'idle'
          toast.warning('Amount too high', error.value)
          return
        }
        await approveExchangeDeposit(tokenInit, gross, transferFee)
      } else {
        blockNumber = await depositToken(
          tokenInit,
          tokenInfo.asset_type as any,
          depositAmount,
          store.tradingFeeBps,
          transferFee,
          store.treasuryAccountId,
          store.treasuryPrincipal,
        )
      }

      phase.value = 'submitting'

      // Step 2: Place order on exchange
      const tokenSell = side.value === 'buy' ? token0.value : token1.value
      const oc: [] | [string] = options.value.ocLink ? [options.value.ocLink] : []
      const referrer = localStorage.getItem('taco_referrer') || ''

      // Snapshot of open-order accesscodes before submission — used by the
      // transport-error probe below to decide whether an order actually landed.
      // A network read (a saved list can miss orders placed since it was
      // saved), started before the order call but only awaited by the probe,
      // so the order is not delayed.
      const preCodesP: Promise<Set<string>> = store.userTradesQuery.refresh()
        .then(async (v) => new Set((v ?? await store.getUserTrades()).map((o: any) => o.accesscode)))
        .catch(() => new Set<string>())

      const onFilledImmediately = () => {
        phase.value = 'success'
        resultAccesscode.value = ''
        toast.success('Order Filled', 'Limit order filled immediately')
      }
      const onPartiallyFilled = (filled: bigint, remaining: bigint, accessCode: string) => {
        phase.value = 'resting'
        resultAccesscode.value = accessCode
        const filledPct = Number((filled * 100n) / (filled + remaining))
        toast.success('Partially Filled', `${filledPct}% filled; remainder resting on the book`)
      }
      const onResting = (accessCode: string) => {
        phase.value = 'resting'
        resultAccesscode.value = accessCode
        toast.info('Order Placed', 'Resting on the book')
      }

      try {
        const result = v2
          ? await store.addPositionV2(
              params.amount_sell,
              gross,
              tokenSell,
              tokenInit,
              options.value.pub,
              options.value.excludeDAO,
              oc,
              referrer,
              options.value.allOrNothing,
              options.value.strictlyOTC,
            )
          : await store.addPosition(
              blockNumber!,
              params.amount_sell,
              params.amount_init,
              tokenSell,
              tokenInit,
              options.value.pub,
              options.value.excludeDAO,
              oc,
              referrer,
              options.value.allOrNothing,
              options.value.strictlyOTC,
            )

        if ('Ok' in result) {
          const order = result.Ok
          if (blockNumber != null) removeDepositFromCache(blockNumber.toString())
          void store.refreshAfterMutation('order')
          if (order.remaining === 0n) {
            onFilledImmediately()
          } else if (order.filled > 0n) {
            onPartiallyFilled(order.filled, order.remaining, order.accessCode)
          } else {
            onResting(order.accessCode)
          }
        } else if (v2) {
          // V2 typed Err: there is no treasury deposit to recover. Refusals
          // and declined pulls moved nothing; a pull with an unknown outcome
          // is tracked on chain (the classifier says so and points at the
          // Recover page).
          const classified = classifyExchangeError(result.Err)
          error.value = classified.message
          phase.value = 'error'
          toast.error('Order Failed', error.value)
          if ('SystemError' in result.Err) void store.refreshAfterMutation('order')
        } else {
          // Typed Err — backend responded, recoverWronglysent is safe to try
          const classified = classifyExchangeError(result.Err)
          try {
            const recovered = await store.recoverWronglysent(
              tokenInit, blockNumber!, tokenInfo.asset_type as any,
            )
            if (recovered) {
              error.value = classified.message + ' — tokens recovered automatically'
              phase.value = 'error'
              toast.warning('Order Failed', error.value)
              return
            }
          } catch { /* recovery best-effort */ }
          error.value = classified.message + ' — use Recover Funds to retrieve tokens'
          phase.value = 'error'
          toast.error('Order Failed', error.value)
        }
      } catch (orderErr: any) {
        // Transport failure — do NOT blindly recover, the order may have landed.
        if (isTransportError(orderErr)) {
          const probe = async (): Promise<VerifyStatus> => {
            try {
              // A read that starts after the failed call (never a saved list).
              const preCodes = await preCodesP
              const post = await store.userTradesQuery.refetch()
              if (!post) return 'unknown'
              const newOrder = post.find((o: any) =>
                !preCodes.has(o.accesscode)
                && o.token_sell_identifier === tokenSell
                && o.token_init_identifier === tokenInit
                && o.amount_sell === params.amount_sell
                && o.amount_init === params.amount_init
              )
              if (newOrder) {
                if (newOrder.filledSell > 0n && newOrder.filledSell < newOrder.amount_sell) {
                  resultAccesscode.value = newOrder.accesscode
                  return 'partial'
                }
                resultAccesscode.value = newOrder.accesscode
                return 'succeeded'
              }
              return 'unknown'
            } catch {
              return 'unknown'
            }
          }
          const status = await verifyAfterTransportError(probe)
          if (status === 'succeeded' || status === 'partial') {
            if (blockNumber != null) removeDepositFromCache(blockNumber.toString())
            void store.refreshAfterMutation('order')
            if (status === 'partial') {
              toast.success('Partially Filled', 'Network hiccup during submit — confirmed via query.')
              phase.value = 'resting'
            } else {
              toast.success('Order Placed', 'Network hiccup during submit — confirmed via query.')
              phase.value = 'resting'
            }
            return
          }
          if (status === 'failed') {
            if (v2) {
              // Nothing left the wallet; the unused approval expires on its own.
              error.value = 'Network issue during submit. The order did not land and nothing was taken from your wallet. Please try again.'
              phase.value = 'error'
              toast.warning('Network issue', error.value)
              return
            }
            let recoveryNote = ' — use Recover Funds to retrieve tokens'
            try {
              const recovered = await store.recoverWronglysent(
                tokenInit, blockNumber!, tokenInfo.asset_type as any,
              )
              if (recovered) recoveryNote = ' — tokens recovered automatically'
            } catch { /* best effort */ }
            error.value = 'Network issue during submit — transaction did not land' + recoveryNote
            phase.value = 'error'
            toast.warning('Network issue', error.value)
            return
          }
          // unknown — order state is ambiguous. Do NOT attempt recovery; it
          // could burn a live resting order. Tell the user to refresh.
          error.value = v2
            ? 'Network issue during submit. Refresh to check whether your order was placed.'
            : 'Network issue during submit — refresh to check whether your order was placed.'
          phase.value = 'error'
          toast.warning('Network issue', error.value)
          return
        }
        // Non-transport throw — the old recovery path is still the best bet.
        if (v2) {
          error.value = (orderErr.message || 'Order failed.')
          phase.value = 'error'
          toast.error('Order Failed', error.value)
          return
        }
        let recoveryNote = ' — use Recover Funds to retrieve tokens'
        try {
          const recovered = await store.recoverWronglysent(
            tokenInit, blockNumber!, tokenInfo.asset_type as any,
          )
          if (recovered) recoveryNote = ' — tokens recovered automatically'
        } catch { /* recovery best-effort */ }
        error.value = (orderErr.message || 'Order failed.') + recoveryNote
        phase.value = 'error'
        toast.error('Order Failed', error.value)
        return
      }
    } catch (err: any) {
      if (isApprovalDeclined(err)) {
        error.value = ''
        phase.value = 'idle'
        toast.info('Approval cancelled', 'Nothing left your wallet.')
        return
      }
      error.value = err.message || 'Order failed.'
      phase.value = 'error'
      toast.error('Order Failed', error.value)
    }
  }

  function reset() {
    price.value = ''
    amount.value = ''
    phase.value = 'idle'
    error.value = ''
    resultAccesscode.value = ''
  }

  function toggleSide() {
    side.value = side.value === 'buy' ? 'sell' : 'buy'
  }

  function incrementPrice(direction: 1 | -1) {
    const p = parseFloat(price.value) || 0
    // Auto-calculate tick size based on price magnitude
    let tick = 0.0001
    if (p >= 1) tick = 0.001
    if (p >= 10) tick = 0.01
    if (p >= 100) tick = 0.1
    if (p >= 1000) tick = 1
    const newPrice = Math.max(0, p + tick * direction)
    price.value = newPrice.toString()
  }

  function bigIntToDecimal(amt: bigint, decimals: number, maxFrac: number): string {
    const divisor = 10n ** BigInt(decimals)
    const whole = amt / divisor
    const frac = amt % divisor
    if (maxFrac === 0) return whole.toString()
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac)
    return `${whole}.${fracStr}`
  }

  async function setAmountPercentage(pct: number) {
    // Calculate from user's balance of the deposit token, minus fees
    // For buy: deposit token is token1 (quote), amount is quantity of token0 (base)
    // For sell: deposit token is token0 (base), amount is quantity of token0 (base)
    if (side.value === 'sell') {
      const tokenInfo = getTokenInfo(token0.value)
      // Force a fresh ledger read so Max never computes from a stale cached balance.
      const balance = (await store.userBalanceQuery(token0.value).refresh()) ?? 0n
      if (balance > 0n && tokenInfo) {
        const transferFee = BigInt(tokenInfo.transfer_fee)
        const tradingFee = (balance * (store.tradingFeeBps as bigint)) / 10000n
        // Reserve 2× transfer fee: one is baked into calculateRequiredDeposit,
        // the second is charged by the ledger on top (same as SwapCard.setPercentage).
        // V2 (approve+pull) costs one more: the approval is its own ledger tx.
        const feeReserve = store.useV2Deposit(token0.value) ? 3n : 2n
        const maxAmount = balance - transferFee * feeReserve - tradingFee
        if (maxAmount <= 0n) return
        const useAmount = pct === 100 ? maxAmount : (maxAmount * BigInt(pct)) / 100n
        amount.value = bigIntToDecimal(useAmount, decimals0.value, Math.min(decimals0.value, 6))
      }
    } else {
      const p = parseFloat(price.value) || 0
      if (p <= 0) return
      const tokenInfo = getTokenInfo(token1.value)
      const balance = (await store.userBalanceQuery(token1.value).refresh()) ?? 0n
      if (balance > 0n && tokenInfo) {
        const transferFee = BigInt(tokenInfo.transfer_fee)
        const tradingFee = (balance * (store.tradingFeeBps as bigint)) / 10000n
        // 2× transfer fee (3× on the V2 approve+pull path), same as the sell branch.
        const feeReserve = store.useV2Deposit(token1.value) ? 3n : 2n
        const maxQuote = balance - transferFee * feeReserve - tradingFee
        if (maxQuote <= 0n) return
        const useQuote = pct === 100 ? maxQuote : (maxQuote * BigInt(pct)) / 100n
        const availableQuote = Number(useQuote) / 10 ** decimals1.value
        const maxBuy = availableQuote / p
        // Floor the buy amount to avoid rounding up
        const floorFactor = 10 ** Math.min(decimals0.value, 6)
        amount.value = (Math.floor(maxBuy * floorFactor) / floorFactor).toFixed(Math.min(decimals0.value, 6))
      }
    }
  }

  return {
    side,
    price,
    amount,
    total,
    estimatedFee,
    estimatedRevokeFee,
    phase,
    error,
    resultAccesscode,
    options,
    depositTokenAddress,
    placeOrder,
    reset,
    toggleSide,
    incrementPrice,
    setAmountPercentage,
  }
}
