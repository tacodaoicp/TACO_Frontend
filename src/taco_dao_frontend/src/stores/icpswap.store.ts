/**
 * ICPSwap Store - Frontend implementation for ICPSwap functionality
 * Provides methods for ICRC1 and ICRC2 based swaps on ICPSwap, plus sweep functionality
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Actor } from '@dfinity/agent'
import { createAgent, principalToSubAccount } from '@dfinity/utils'
import { Principal } from '@dfinity/principal'
import { AuthClient } from '@dfinity/auth-client'
import { useTacoStore } from './taco.store'
import { getEffectiveNetwork } from '../config/network-config'

// Helper functions for runtime network detection
function shouldFetchRootKey(): boolean {
    return getEffectiveNetwork() === 'local'
}
function getNetworkHost(): string {
    const network = getEffectiveNetwork()
    if (network === 'local') {
        const port = import.meta.env.VITE_LOCAL_PORT || '4943'
        return `http://localhost:${port}`
    }
    return 'https://ic0.app'
}

// ICPSwap Factory canister ID
const ICPSWAP_FACTORY_ID = '4mmnk-kiaaa-aaaag-qbllq-cai'
const DEFAULT_FEE = 3000 // 0.3%

// Types
interface Token {
  address: string
  standard: string
}

interface PoolData {
  key: string
  token0: Token
  token1: Token
  fee: number
  tickSpacing: number
  canisterId: string // Changed from Principal to string to avoid type issues
}

interface SwapParams {
  sellTokenPrincipal: string
  buyTokenPrincipal: string
  amountIn: bigint
  minAmountOut: bigint
  slippageTolerance: number
  recipient?: Principal
  onStep?: (step: string) => void
}

interface QuoteParams {
  sellTokenPrincipal: string
  buyTokenPrincipal: string
  amountIn: bigint
  minAmountOut?: bigint // Optional for quote, defaults to 0
}

interface ICPSwapQuoteResult {
  amountOut: bigint
  slippage: number
  fee: number
  token0: Token
  token1: Token
  effectivePrice: number
  spotPrice: number
}

interface SweepParams {
  token0Principal: string
  token1Principal: string
  poolId?: string // Optional - if not provided, will lookup
}

export const useICPSwapStore = defineStore('icpswap', () => {
  const tacoStore = useTacoStore()

  // # STATE #
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)
  const poolCache = ref<Map<string, PoolData>>(new Map())

  // # COMPUTED #
  const userPrincipal = computed(() => tacoStore.userPrincipal)
  const userLoggedIn = computed(() => tacoStore.userLoggedIn)

  // # FACTORY ACTOR #
  const createFactoryActor = async () => {
    const authClient = await AuthClient.create()
    const identity = await authClient.getIdentity()
    
    const agent = await createAgent({
      identity,
      host: getNetworkHost(),
      fetchRootKey: shouldFetchRootKey(),
    })

    const factoryIDL = ({ IDL }: any) => {
      const Token = IDL.Record({
        'address': IDL.Text,
        'standard': IDL.Text,
      })

      const GetPoolArgs = IDL.Record({
        'token0': Token,
        'token1': Token,
        'fee': IDL.Nat,
      })

      const PoolData = IDL.Record({
        'key': IDL.Text,
        'token0': Token,
        'token1': Token,
        'fee': IDL.Nat,
        'tickSpacing': IDL.Int,
        'canisterId': IDL.Principal,
      })

      const PoolResult = IDL.Variant({
        'ok': PoolData,
        'err': IDL.Text,
      })

      return IDL.Service({
        'getPool': IDL.Func([GetPoolArgs], [PoolResult], ['query']),
      })
    }

    return Actor.createActor(factoryIDL, {
      agent,
      canisterId: ICPSWAP_FACTORY_ID,
    })
  }

  // # POOL ACTOR #
  const createPoolActor = async (poolId: string) => {
    const authClient = await AuthClient.create()
    const identity = await authClient.getIdentity()
    
    const agent = await createAgent({
      identity,
      host: getNetworkHost(),
      fetchRootKey: shouldFetchRootKey(),
    })

    const poolIDL = ({ IDL }: any) => {
      const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
      })

      const SwapArgs = IDL.Record({
        'amountIn': IDL.Text,
        'amountOutMinimum': IDL.Text,
        'zeroForOne': IDL.Bool,
      })

      const DepositArgs = IDL.Record({
        'amount': IDL.Nat,
        'fee': IDL.Nat,
        'token': IDL.Text,
      })

      const WithdrawArgs = IDL.Record({
        'amount': IDL.Nat,
        'fee': IDL.Nat,
        'token': IDL.Text,
      })

      const ICPSwapError = IDL.Variant({
        'CommonError': IDL.Null,
        'InternalError': IDL.Text,
        'UnsupportedToken': IDL.Text,
        'InsufficientFunds': IDL.Null,
      })

      const SwapResult = IDL.Variant({
        'ok': IDL.Nat,
        'err': ICPSwapError,
      })

      const DepositResult = IDL.Variant({
        'ok': IDL.Nat,
        'err': ICPSwapError,
      })

      const WithdrawResult = IDL.Variant({
        'ok': IDL.Nat,
        'err': ICPSwapError,
      })

      const UserBalance = IDL.Record({
        'balance0': IDL.Nat,
        'balance1': IDL.Nat,
      })

      const BalanceResult = IDL.Variant({
        'ok': UserBalance,
        'err': IDL.Text,
      })

      const PoolMetadata = IDL.Record({
        'token0': IDL.Record({
          'address': IDL.Text,
          'standard': IDL.Text,
        }),
        'token1': IDL.Record({
          'address': IDL.Text,
          'standard': IDL.Text,
        }),
        'fee': IDL.Nat,
        'tick': IDL.Int,
        'liquidity': IDL.Nat,
        'sqrtPriceX96': IDL.Nat,
      })

      const MetadataResult = IDL.Variant({
        'ok': PoolMetadata,
        'err': ICPSwapError,
      })

      const QuoteResult = IDL.Variant({
        'ok': IDL.Nat,
        'err': ICPSwapError,
      })

      return IDL.Service({
        'swap': IDL.Func([SwapArgs], [SwapResult], []),
        'deposit': IDL.Func([DepositArgs], [DepositResult], []),
        'depositFrom': IDL.Func([DepositArgs], [DepositResult], []),
        'withdraw': IDL.Func([WithdrawArgs], [WithdrawResult], []),
        'getUserUnusedBalance': IDL.Func([IDL.Principal], [BalanceResult], ['query']),
        'metadata': IDL.Func([], [MetadataResult], ['query']),
        'quote': IDL.Func([SwapArgs], [QuoteResult], ['query']),
      })
    }

    return Actor.createActor(poolIDL, {
      agent,
      canisterId: poolId,
    })
  }

  // # ICRC TOKEN ACTOR #
  const createTokenActor = async (tokenPrincipal: string) => {
    const authClient = await AuthClient.create()
    const identity = await authClient.getIdentity()
    
    const agent = await createAgent({
      identity,
      host: getNetworkHost(),
      fetchRootKey: shouldFetchRootKey(),
    })

    const icrcIDL = ({ IDL }: any) => {
      const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
      })

      const TransferArg = IDL.Record({
        'to': Account,
        'fee': IDL.Opt(IDL.Nat),
        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'created_at_time': IDL.Opt(IDL.Nat64),
        'amount': IDL.Nat,
      })

      const TransferFromArg = IDL.Record({
        'from': Account,
        'to': Account,
        'fee': IDL.Opt(IDL.Nat),
        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'created_at_time': IDL.Opt(IDL.Nat64),
        'amount': IDL.Nat,
      })

      const TransferError = IDL.Variant({
        'GenericError': IDL.Record({
          'message': IDL.Text,
          'error_code': IDL.Nat,
        }),
        'TemporarilyUnavailable': IDL.Null,
        'BadBurn': IDL.Record({ 'min_burn_amount': IDL.Nat }),
        'Duplicate': IDL.Record({ 'duplicate_of': IDL.Nat }),
        'BadFee': IDL.Record({ 'expected_fee': IDL.Nat }),
        'CreatedInFuture': IDL.Record({ 'ledger_time': IDL.Nat64 }),
        'TooOld': IDL.Null,
        'InsufficientFunds': IDL.Record({ 'balance': IDL.Nat }),
      })

      const TransferResult = IDL.Variant({
        'Ok': IDL.Nat,
        'Err': TransferError,
      })

      const ApproveArgs = IDL.Record({
        'fee': IDL.Opt(IDL.Nat),
        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'created_at_time': IDL.Opt(IDL.Nat64),
        'amount': IDL.Nat,
        'expected_allowance': IDL.Opt(IDL.Nat),
        'expires_at': IDL.Opt(IDL.Record({ 'timestamp_nanos': IDL.Nat64 })),
        'spender': Account,
      })

      const ApproveError = IDL.Variant({
        'GenericError': IDL.Record({
          'message': IDL.Text,
          'error_code': IDL.Nat,
        }),
        'TemporarilyUnavailable': IDL.Null,
        'Duplicate': IDL.Record({ 'duplicate_of': IDL.Nat }),
        'BadFee': IDL.Record({ 'expected_fee': IDL.Nat }),
        'CreatedInFuture': IDL.Record({ 'ledger_time': IDL.Nat64 }),
        'TooOld': IDL.Null,
        'InsufficientFunds': IDL.Record({ 'balance': IDL.Nat }),
        'AllowanceChanged': IDL.Record({ 'current_allowance': IDL.Nat }),
        'Expired': IDL.Record({ 'ledger_time': IDL.Nat64 }),
      })

      const ApproveResult = IDL.Variant({
        'Ok': IDL.Nat,
        'Err': ApproveError,
      })

      return IDL.Service({
        'icrc1_transfer': IDL.Func([TransferArg], [TransferResult], []),
        'icrc2_approve': IDL.Func([ApproveArgs], [ApproveResult], []),
        'icrc2_transfer_from': IDL.Func([TransferFromArg], [TransferResult], []),
        'icrc1_balance_of': IDL.Func([Account], [IDL.Nat], ['query']),
        'icrc1_fee': IDL.Func([], [IDL.Nat], ['query']),
      })
    }

    return Actor.createActor(icrcIDL, {
      agent,
      canisterId: tokenPrincipal,
    })
  }

  // # HELPER FUNCTIONS #
  
  // Using the standard DFINITY utility for subaccount generation
  // This matches the backend implementation exactly

  /**
   * Get pool canister ID for a token pair
   */
  const getPoolCanister = async (token0Principal: string, token1Principal: string): Promise<string> => {
    const cacheKey = `${token0Principal}-${token1Principal}`
    const cachedPool = poolCache.value.get(cacheKey)
    
    if (cachedPool) {
      return cachedPool.canisterId
    }

    // console.log('Looking up pool for tokens:', token0Principal, token1Principal)
    const factoryActor = await createFactoryActor()

    const poolArgs = {
      token0: {
        address: token0Principal,
        standard: token0Principal === 'ryjl3-tyaaa-aaaaa-aaaba-cai' ? 'ICP' : 'ICRC1',
      },
      token1: {
        address: token1Principal,
        standard: token1Principal === 'ryjl3-tyaaa-aaaaa-aaaba-cai' ? 'ICP' : 'ICRC1',
      },
      fee: DEFAULT_FEE,
    }

    const result = await factoryActor.getPool(poolArgs) as any
    // console.log('Pool lookup result:', result)

    if ('err' in result) {
      throw new Error(`Pool not found for token pair: ${result.err}`)
    }

    const poolData = {
      ...result.ok,
      canisterId: result.ok.canisterId.toText(), // Convert Principal to string
    }
    
    poolCache.value.set(cacheKey, poolData)
    return poolData.canisterId
  }

  /**
   * Determine if token0 is the "zero" token in the pair
   */
  const isZeroForOne = (sellTokenPrincipal: string, poolData: PoolData): boolean => {
    return sellTokenPrincipal === poolData.token0.address
  }

  // # QUOTE METHODS #

  /**
   * Get a quote for a swap from ICPSwap
   */
  const getQuote = async (params: QuoteParams): Promise<ICPSwapQuoteResult> => {
    if (!userLoggedIn.value) {
      throw new Error('User not authenticated')
    }

    try {
      // console.log('ICPSwap quote request with params:', params)

      // Step 1: Get pool canister
      const poolId = await getPoolCanister(params.sellTokenPrincipal, params.buyTokenPrincipal)
      // console.log('Pool canister ID for quote:', poolId)

      const poolActor = await createPoolActor(poolId)

      // Step 2: Get pool metadata for fee and price info
      // console.log('Getting pool metadata...')
      const metadataResult = await poolActor.metadata() as any
      // console.log('Metadata result:', metadataResult)

      if ('err' in metadataResult) {
        throw new Error(`Failed to get pool metadata: ${JSON.stringify(metadataResult.err)}`)
      }

      const metadata = metadataResult.ok

      // Step 3: Get pool data for zeroForOne determination
      const poolData = poolCache.value.get(`${params.sellTokenPrincipal}-${params.buyTokenPrincipal}`)!
      const zeroForOne = isZeroForOne(params.sellTokenPrincipal, poolData)

      // Step 4: Get quote
      // console.log('Getting quote...')
      const quoteArgs = {
        amountIn: params.amountIn.toString(),
        amountOutMinimum: (params.minAmountOut || 0n).toString(),
        zeroForOne: zeroForOne,
      }

      const quoteResult = await poolActor.quote(quoteArgs) as any
      // console.log('Quote result:', quoteResult)

      if ('err' in quoteResult) {
        throw new Error(`Quote failed: ${JSON.stringify(quoteResult.err)}`)
      }

      const amountOut = BigInt(quoteResult.ok)

      // Step 5: Calculate prices and slippage
      // Calculate spot price from sqrtPriceX96
      const sqrtPriceX96 = BigInt(metadata.sqrtPriceX96)
      const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96
      const spotPrice = Number(sqrtPriceX96Squared) / Math.pow(2, 192)

      // Calculate effective price from the quote
      const effectivePrice = Number(params.amountIn) / Number(amountOut)

      // Calculate slippage
      let normalizedSpotPrice: number
      if (zeroForOne) {
        // Trading token0 for token1, so we want token0/token1 (inverse of spot price)
        normalizedSpotPrice = spotPrice > 0 ? 1.0 / spotPrice : 0
      } else {
        // Trading token1 for token0, so we want token1/token0 (spot price)
        normalizedSpotPrice = spotPrice
      }

      const slippage = normalizedSpotPrice > 0 
        ? Math.abs(effectivePrice - normalizedSpotPrice) / normalizedSpotPrice * 100.0
        : 0

      const result: ICPSwapQuoteResult = {
        amountOut,
        slippage,
        fee: metadata.fee,
        token0: metadata.token0,
        token1: metadata.token1,
        effectivePrice,
        spotPrice: normalizedSpotPrice,
      }

      // console.log('ICPSwap quote successful:', result)
      return result

    } catch (error: any) {
      // console.error('ICPSwap quote error:', error)
      lastError.value = error.message
      throw error
    }
  }

  // # SWAP METHODS #

  /**
   * Execute ICRC2-based swap on ICPSwap
   * Since ICPSwap doesn't support depositFrom, we use ICRC2 approve + transfer + deposit flow
   */
  const icrc2_swap = async (params: SwapParams): Promise<any> => {
    if (!userLoggedIn.value || !userPrincipal.value) {
      throw new Error('User not authenticated')
    }

    isLoading.value = true
    lastError.value = null

    try {
      // console.log('ICPSwap ICRC2 swap starting with params:', params)

      // Step 1: Get pool canister
      params.onStep?.('Finding pool...')
      // console.log('Step 1: Getting pool canister...')
      const poolId = await getPoolCanister(params.sellTokenPrincipal, params.buyTokenPrincipal)
      // console.log('Pool canister ID:', poolId)

      // Step 2: Get token fee for proper amount calculations
      params.onStep?.('Getting token fee...')
      // console.log('Step 2: Getting token fee...')
      const tokenActor = await createTokenActor(params.sellTokenPrincipal)
      const feeResult = await tokenActor.icrc1_fee() as any
      const tokenFee = typeof feeResult === 'bigint' ? feeResult : BigInt(feeResult)
      // console.log('Token fee:', tokenFee)

      // Step 3: Create ICRC2 approval for pool
      // Approve amountIn + fee so pool has enough allowance for the transfer + fee
      params.onStep?.('Approving tokens...')
      // console.log('Step 3: Creating ICRC2 approval...')
      const approvalAmount = params.amountIn + tokenFee
      // console.log('Approval amount (amountIn + fee):', approvalAmount)
      
      const approvalArgs = {
        spender: {
          owner: Principal.fromText(poolId),
          subaccount: [],
        },
        amount: approvalAmount,
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
      }

      // console.log('Approval args:', approvalArgs)
      const approvalResult = await tokenActor.icrc2_approve(approvalArgs) as any
      // console.log('Approval result:', approvalResult)

      if ('Err' in approvalResult) {
        throw new Error(`Approval failed: ${JSON.stringify(approvalResult.Err)}`)
      }

      // Step 4: Deposit tokens using ICRC2 approval (depositFrom)
      // The pool canister will call icrc2_transfer_from internally
      params.onStep?.('Depositing tokens...')
      // console.log('Step 4: Calling depositFrom (pool will handle transfer_from)...')
      const poolActor = await createPoolActor(poolId)
      
      // Generate pool subaccount for the user
      const userSubaccount = principalToSubAccount(Principal.fromText(userPrincipal.value!))
      
      const depositFromArgs = {
        amount: params.amountIn,
        fee: tokenFee,
        token: params.sellTokenPrincipal,
      }

      // console.log('DepositFrom args:', depositFromArgs)
      const depositResult = await poolActor.depositFrom(depositFromArgs) as any
      // console.log('DepositFrom result:', depositResult)

      if ('err' in depositResult) {
        throw new Error(`DepositFrom failed: ${JSON.stringify(depositResult.err)}`)
      }

      // Step 6: Get pool data for zeroForOne determination
      const poolData = poolCache.value.get(`${params.sellTokenPrincipal}-${params.buyTokenPrincipal}`)!
      const zeroForOne = isZeroForOne(params.sellTokenPrincipal, poolData)

      // Step 5: Execute swap
      params.onStep?.('Executing swap...')
      // console.log('Step 5: Executing swap...')
      // Use the actual deposited amount from depositFrom result
      const depositedAmount = depositResult.ok
      const swapArgs = {
        amountIn: depositedAmount.toString(),
        amountOutMinimum: params.minAmountOut.toString(),
        zeroForOne: zeroForOne,
      }

      const swapResult = await poolActor.swap(swapArgs) as any
      // console.log('Swap result:', swapResult)

      if ('err' in swapResult) {
        // Try to sweep before throwing error
        await sweep({ token0Principal: params.sellTokenPrincipal, token1Principal: params.buyTokenPrincipal, poolId })
        throw new Error(`Swap failed: ${JSON.stringify(swapResult.err)}`)
      }

      const amountOut = swapResult.ok

      // Step 6: Withdraw the received tokens
      params.onStep?.('Withdrawing tokens...')
      // console.log('Step 6: Withdrawing received tokens...')
      
      // Get the output token fee for withdrawal
      const outputTokenActor = await createTokenActor(params.buyTokenPrincipal)
      const outputFeeResult = await outputTokenActor.icrc1_fee() as any
      const outputTokenFee = typeof outputFeeResult === 'bigint' ? outputFeeResult : BigInt(outputFeeResult)
      
      const withdrawArgs = {
        amount: amountOut,
        fee: outputTokenFee,
        token: params.buyTokenPrincipal,
      }

      const withdrawResult = await poolActor.withdraw(withdrawArgs) as any
      // console.log('Withdraw result:', withdrawResult)

      if ('err' in withdrawResult) {
        // Try to sweep before throwing error
        await sweep({ token0Principal: params.sellTokenPrincipal, token1Principal: params.buyTokenPrincipal, poolId })
        throw new Error(`Withdraw failed: ${JSON.stringify(withdrawResult.err)}`)
      }

      return {
        amountOut: amountOut,
        swapTxId: swapResult.ok,
        withdrawTxId: withdrawResult.ok,
      }

    } catch (error: any) {
      console.error('ICPSwap ICRC2 swap error:', error)
      lastError.value = error.message
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Execute ICRC1-based swap on ICPSwap
   * Transfers to pool subaccount, then calls deposit, swap, and withdraw
   */
  const icrc1_swap = async (params: SwapParams): Promise<any> => {
    if (!userLoggedIn.value || !userPrincipal.value) {
      throw new Error('User not authenticated')
    }

    isLoading.value = true
    lastError.value = null

    try {
      // console.log('ICPSwap ICRC1 swap starting with params:', params)

      // Step 1: Get pool canister
      params.onStep?.('Finding pool...')
      // console.log('Step 1: Getting pool canister...')
      const poolId = await getPoolCanister(params.sellTokenPrincipal, params.buyTokenPrincipal)
      // console.log('Pool canister ID:', poolId)

      // Step 2: Transfer tokens to pool subaccount
      params.onStep?.('Transferring tokens...')
      // console.log('Step 2: Transferring tokens to pool subaccount...')
      const tokenActor = await createTokenActor(params.sellTokenPrincipal)
      const userSubaccount = principalToSubAccount(Principal.fromText(userPrincipal.value!))
      
      // console.log('User principal:', userPrincipal.value)
      // console.log('Pool canister ID:', poolId)
      // console.log('Generated user subaccount:', Array.from(userSubaccount))
      
      const transferArgs = {
        to: {
          owner: Principal.fromText(poolId),
          subaccount: [Array.from(userSubaccount)],
        },
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: params.amountIn,
      }

      // console.log('Transfer args:', transferArgs)
      const transferResult = await tokenActor.icrc1_transfer(transferArgs) as any
      // console.log('Transfer result:', transferResult)

      if ('Err' in transferResult) {
        throw new Error(`Transfer failed: ${JSON.stringify(transferResult.Err)}`)
      }

      // Step 3: Deposit
      params.onStep?.('Depositing tokens...')
      // console.log('Step 3: Calling deposit...')
      const poolActor = await createPoolActor(poolId)
      
      // Get the token fee for the deposit
      const inputTokenActor = await createTokenActor(params.sellTokenPrincipal)
      const feeResult = await inputTokenActor.icrc1_fee() as any
      const tokenFee = typeof feeResult === 'bigint' ? feeResult : BigInt(feeResult)
      
      const depositArgs = {
        amount: params.amountIn,
        fee: tokenFee,
        token: params.sellTokenPrincipal,
      }

      // console.log('Deposit args:', depositArgs)
      const depositResult = await poolActor.deposit(depositArgs) as any
      // console.log('Deposit result:', depositResult)

      if ('err' in depositResult) {
        throw new Error(`Deposit failed: ${JSON.stringify(depositResult.err)}`)
      }

      // Step 5: Get pool data for zeroForOne determination
      const poolData = poolCache.value.get(`${params.sellTokenPrincipal}-${params.buyTokenPrincipal}`)!
      const zeroForOne = isZeroForOne(params.sellTokenPrincipal, poolData)

      // Step 6: Execute swap
      params.onStep?.('Executing swap...')
      // console.log('Step 5: Executing swap...')
      
      // The actual amount available for swap is the deposit result (amountIn - deposit fee)
      const availableAmount = depositResult.ok
      
      const swapArgs = {
        amountIn: availableAmount.toString(),
        amountOutMinimum: params.minAmountOut.toString(),
        zeroForOne: zeroForOne,
      }

      // console.log('Swap args:', swapArgs)
      const swapResult = await poolActor.swap(swapArgs) as any
      // console.log('Swap result:', swapResult)

      if ('err' in swapResult) {
        // Try to sweep before throwing error
        await sweep({ token0Principal: params.sellTokenPrincipal, token1Principal: params.buyTokenPrincipal, poolId })
        throw new Error(`Swap failed: ${JSON.stringify(swapResult.err)}`)
      }

      const amountOut = swapResult.ok

      // Step 7: Withdraw the received tokens
      params.onStep?.('Withdrawing tokens...')
      // console.log('Step 6: Withdrawing received tokens...')
      
      // Get the output token fee for withdrawal
      const outputTokenActor = await createTokenActor(params.buyTokenPrincipal)
      const outputFeeResult = await outputTokenActor.icrc1_fee() as any
      const outputTokenFee = typeof outputFeeResult === 'bigint' ? outputFeeResult : BigInt(outputFeeResult)
      
      const withdrawArgs = {
        amount: amountOut,
        fee: outputTokenFee,
        token: params.buyTokenPrincipal,
      }

      const withdrawResult = await poolActor.withdraw(withdrawArgs) as any
      // console.log('Withdraw result:', withdrawResult)

      if ('err' in withdrawResult) {
        // Try to sweep before throwing error
        await sweep({ token0Principal: params.sellTokenPrincipal, token1Principal: params.buyTokenPrincipal, poolId })
        throw new Error(`Withdraw failed: ${JSON.stringify(withdrawResult.err)}`)
      }

      return {
        amountOut: amountOut,
        transferTxId: transferResult.Ok,
        swapTxId: swapResult.ok,
        withdrawTxId: withdrawResult.ok,
      }

    } catch (error: any) {
      console.error('ICPSwap ICRC1 swap error:', error)
      lastError.value = error.message
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sweep function to recover any stranded funds in ICPSwap pool
   * 1) Check subaccount balances and deposit if any
   * 2) Check pool balances and withdraw if any
   */
  const sweep = async (params: SweepParams): Promise<void> => {
    if (!userLoggedIn.value || !userPrincipal.value) {
      throw new Error('User not authenticated')
    }

    try {
      // console.log('ICPSwap sweep starting with params:', params)

      // Get pool canister if not provided
      const poolId = params.poolId || await getPoolCanister(params.token0Principal, params.token1Principal)
      // console.log('Sweeping pool:', poolId)

      const poolActor = await createPoolActor(poolId)
      const userPrincipalObj = Principal.fromText(userPrincipal.value!)

      // Step 1: Check pool balances for the user
      // console.log('Step 1: Checking pool balances...')
      const balanceResult = await poolActor.getUserUnusedBalance(userPrincipalObj) as any
      // console.log('Balance result:', balanceResult)

      if ('ok' in balanceResult) {
        const balance = balanceResult.ok
        const balance0 = balance.balance0
        const balance1 = balance.balance1

        // Withdraw token0 if balance exists
        if (balance0 > 0n) {
          // console.log('Withdrawing token0 balance:', balance0)
          try {
            const withdrawResult0 = await poolActor.withdraw({
              amount: balance0,
              fee: 0n,
              token: params.token0Principal,
            })
            // console.log('Token0 withdraw result:', withdrawResult0)
          } catch (error) {
            console.error('Failed to withdraw token0:', error)
          }
        }

        // Withdraw token1 if balance exists
        if (balance1 > 0n) {
          // console.log('Withdrawing token1 balance:', balance1)
          try {
            const withdrawResult1 = await poolActor.withdraw({
              amount: balance1,
              fee: 0n,
              token: params.token1Principal,
            })
            // console.log('Token1 withdraw result:', withdrawResult1)
          } catch (error) {
            console.error('Failed to withdraw token1:', error)
          }
        }
      }

      // Step 2: Check subaccount balances and deposit if needed
      // console.log('Step 2: Checking subaccount balances...')
      const userSubaccount = principalToSubAccount(userPrincipalObj)
      
      // Check token0 balance in subaccount
      try {
        const token0Actor = await createTokenActor(params.token0Principal)
        const balance0Result = await token0Actor.icrc1_balance_of({
          owner: Principal.fromText(poolId),
          subaccount: [Array.from(userSubaccount)],
        }) as bigint
        
        if (balance0Result > 0n) {
          // console.log('Depositing token0 from subaccount:', balance0Result)
          const depositResult0 = await poolActor.deposit({
            amount: balance0Result,
            fee: 0n,
            token: params.token0Principal,
          })
          // console.log('Token0 deposit result:', depositResult0)
        }
      } catch (error) {
        console.error('Failed to check/deposit token0 from subaccount:', error)
      }

      // Check token1 balance in subaccount
      try {
        const token1Actor = await createTokenActor(params.token1Principal)
        const balance1Result = await token1Actor.icrc1_balance_of({
          owner: Principal.fromText(poolId),
          subaccount: [Array.from(userSubaccount)],
        }) as bigint
        
        if (balance1Result > 0n) {
          // console.log('Depositing token1 from subaccount:', balance1Result)
          const depositResult1 = await poolActor.deposit({
            amount: balance1Result,
            fee: 0n,
            token: params.token1Principal,
          })
          // console.log('Token1 deposit result:', depositResult1)
        }
      } catch (error) {
        console.error('Failed to check/deposit token1 from subaccount:', error)
      }

      // console.log('Sweep completed')

    } catch (error: any) {
      console.error('ICPSwap sweep error:', error)
      throw error
    }
  }

  // # RETURN #
  return {
    // State
    isLoading,
    lastError,
    
    // Methods
    getQuote,
    icrc2_swap,
    icrc1_swap,
    sweep,
    
    // Utilities
    getPoolCanister,
  }
})