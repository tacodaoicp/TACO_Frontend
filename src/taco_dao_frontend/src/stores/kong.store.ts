/**
 * Kong Store - Frontend implementation for Kong swap functionality
 * Provides methods for ICRC1 and ICRC2 based swaps on Kong
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Actor } from '@dfinity/agent'
import { createAgent } from '@dfinity/utils'
import { Principal } from '@dfinity/principal'
import { AuthClient } from '@dfinity/auth-client'
import { useTacoStore } from './taco.store'
import { idlFactory as kongIdlFactory } from '../../../declarations/kongswap/kongswap.did.js'

// Kong canister ID
const KONG_CANISTER_ID = '2ipq2-uqaaa-aaaar-qailq-cai'

// Kong swap types
interface KongSwapArgs {
  pay_token: string
  pay_amount: bigint
  pay_tx_id: { BlockIndex: bigint }[] | [] // Array with value for ICRC1, empty array for ICRC2
  receive_token: string
  receive_amount?: bigint[] | []
  receive_address?: Principal[] | []
  max_slippage?: number[] | []
  referred_by?: Principal[] | []
}

interface SwapResult {
  Ok?: any
  Err?: string
}

interface SwapParams {
  sellTokenPrincipal: string
  sellTokenSymbol: string
  buyTokenPrincipal: string
  buyTokenSymbol: string
  amountIn: bigint
  minAmountOut: bigint
  slippageTolerance: number
  recipient?: Principal
  onStep?: (step: string) => void
}

interface QuoteParams {
  sellTokenSymbol: string
  buyTokenSymbol: string
  amountIn: bigint
}

interface KongQuoteResult {
  pay_chain: string
  pay_symbol: string
  pay_address: string
  pay_amount: bigint
  receive_chain: string
  receive_symbol: string
  receive_address: string
  receive_amount: bigint
  price: number
  mid_price: number
  slippage: number
  txs: any[]
}

export const useKongStore = defineStore('kong', () => {
  const tacoStore = useTacoStore()

  // # STATE #
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // # COMPUTED #
  const userPrincipal = computed(() => tacoStore.userPrincipal)
  const userLoggedIn = computed(() => tacoStore.userLoggedIn)

  // # KONG ACTOR #
  const createKongActor = async () => {
    const authClient = await AuthClient.create()
    const identity = await authClient.getIdentity()
    
    const agent = await createAgent({
      identity,
      host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
      fetchRootKey: process.env.DFX_NETWORK === "local",
    })



    return Actor.createActor(kongIdlFactory, {
      agent,
      canisterId: KONG_CANISTER_ID,
    })
  }

  // # ICRC TOKEN ACTOR #
  const createTokenActor = async (tokenPrincipal: string) => {
    const authClient = await AuthClient.create()
    const identity = await authClient.getIdentity()
    
    const agent = await createAgent({
      identity,
      host: process.env.DFX_NETWORK === "local" ? `http://localhost:4943` : "https://ic0.app",
      fetchRootKey: process.env.DFX_NETWORK === "local",
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
        'icrc1_fee': IDL.Func([], [IDL.Nat], ['query']),
      })
    }

    return Actor.createActor(icrcIDL, {
      agent,
      canisterId: tokenPrincipal,
    })
  }

  // # HELPER FUNCTIONS #
  const formatTokenSymbolForKong = (symbol: string): string => {
    // Kong expects tokens prefixed with "IC."
    return `IC.${symbol}`
  }

  // # QUOTE METHODS #

  /**
   * Get a quote for a swap from Kong
   */
  const getQuote = async (params: QuoteParams): Promise<KongQuoteResult> => {
    if (!userLoggedIn.value) {
      throw new Error('User not authenticated')
    }

    try {
      console.log('Kong quote request with params:', params)

      const kongActor = await createKongActor()

      // Kong expects tokens prefixed with "IC."
      const payToken = formatTokenSymbolForKong(params.sellTokenSymbol)
      const receiveToken = formatTokenSymbolForKong(params.buyTokenSymbol)

      console.log('Calling Kong swap_amounts with:', { payToken, amountIn: params.amountIn, receiveToken })
      const quoteResult = await kongActor.swap_amounts(payToken, params.amountIn, receiveToken) as any
      console.log('Kong quote result:', quoteResult)

      if ('Err' in quoteResult) {
        throw new Error(`Kong quote failed: ${quoteResult.Err}`)
      }

      const quote = quoteResult.Ok as KongQuoteResult
      console.log('Kong quote successful:', quote)

      return quote
    } catch (error: any) {
      console.error('Kong quote error:', error)
      lastError.value = error.message
      throw error
    }
  }

  // # SWAP METHODS #

  /**
   * Execute ICRC2-based swap on Kong
   * First approves the amount, then calls Kong swap without tx_id
   */
  const icrc2_swap = async (params: SwapParams): Promise<any> => {
    if (!userLoggedIn.value || !userPrincipal.value) {
      throw new Error('User not authenticated')
    }

    isLoading.value = true
    lastError.value = null

    try {
      console.log('Kong ICRC2 swap starting with params:', params)

      // Step 1: Get token fee for proper amount calculations
      params.onStep?.('Getting token fee...')
      console.log('Step 1: Getting token fee...')
      const tokenActor = await createTokenActor(params.sellTokenPrincipal)
      const feeResult = await tokenActor.icrc1_fee() as any
      const tokenFee = typeof feeResult === 'bigint' ? feeResult : BigInt(feeResult)
      console.log('Token fee:', tokenFee)

      // Step 2: Create ICRC2 approval for Kong
      // Approve amountIn + fee so Kong has enough allowance for the transfer + fee
      params.onStep?.('Approving tokens...')
      console.log('Step 2: Creating ICRC2 approval...')
      const approvalAmount = params.amountIn + tokenFee
      console.log('Approval amount (amountIn + fee):', approvalAmount)
      
      const approvalArgs = {
        spender: {
          owner: Principal.fromText(KONG_CANISTER_ID),
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

      console.log('Approval args:', approvalArgs)
      const approvalResult = await tokenActor.icrc2_approve(approvalArgs) as any
      console.log('Approval result:', approvalResult)

      if ('Err' in approvalResult) {
        throw new Error(`Approval failed: ${JSON.stringify(approvalResult.Err)}`)
      }

      // Extract approval transaction ID
      const approvalTxId = approvalResult.Ok
      console.log('Approval transaction ID:', approvalTxId)

      // Step 3: Execute Kong swap with approval tx_id (ICRC2 flow)
      // Reduce swap amount by transfer fee since Kong will do a transfer_from
      params.onStep?.('Executing swap...')
      console.log('Step 3: Executing Kong swap...')
      const kongActor = await createKongActor()
      const swapAmount = params.amountIn - tokenFee
      console.log('Swap amount after fee deduction:', swapAmount)

      const swapArgs: KongSwapArgs = {
        pay_token: formatTokenSymbolForKong(params.sellTokenSymbol),
        pay_amount: swapAmount,
        pay_tx_id: [], // Empty array for ICRC2 (null optional)
        receive_token: formatTokenSymbolForKong(params.buyTokenSymbol),
        receive_amount: [],
        receive_address: params.recipient ? [params.recipient] : [],
        max_slippage: [params.slippageTolerance * 100],
        referred_by: [],
      }

      console.log('Kong swap args:', swapArgs)
      const swapResult = await kongActor.swap(swapArgs) as any
      console.log('Kong swap result:', swapResult)

      if ('Err' in swapResult) {
        throw new Error(`Kong swap failed: ${swapResult.Err}`)
      }

      return swapResult.Ok
    } catch (error: any) {
      console.error('Kong ICRC2 swap error:', error)
      lastError.value = error.message
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Execute ICRC1-based swap on Kong
   * First transfers tokens to Kong, then calls swap with the tx_id
   */
  const icrc1_swap = async (params: SwapParams): Promise<any> => {
    if (!userLoggedIn.value || !userPrincipal.value) {
      throw new Error('User not authenticated')
    }

    isLoading.value = true
    lastError.value = null

    try {
      console.log('Kong ICRC1 swap starting with params:', params)

      // Step 1: Transfer tokens to Kong
      params.onStep?.('Transferring tokens...')
      console.log('Step 1: Transferring tokens to Kong...')
      const tokenActor = await createTokenActor(params.sellTokenPrincipal)

      const transferArgs = {
        to: {
          owner: Principal.fromText(KONG_CANISTER_ID),
          subaccount: [],
        },
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: params.amountIn,
      }

      console.log('Transfer args:', transferArgs)
      const transferResult = await tokenActor.icrc1_transfer(transferArgs) as any
      console.log('Transfer result:', transferResult)

      if ('Err' in transferResult) {
        throw new Error(`Transfer failed: ${JSON.stringify(transferResult.Err)}`)
      }

      const blockIndex = transferResult.Ok

      // Step 2: Execute Kong swap with tx_id
      params.onStep?.('Executing swap...')
      console.log('Step 2: Executing Kong swap with tx_id...')
      const kongActor = await createKongActor()

      const swapArgs: KongSwapArgs = {
        pay_token: formatTokenSymbolForKong(params.sellTokenSymbol),
        pay_amount: params.amountIn,
        pay_tx_id: [{ BlockIndex: BigInt(blockIndex) }],
        receive_token: formatTokenSymbolForKong(params.buyTokenSymbol),
        receive_amount: [],
        receive_address: params.recipient ? [params.recipient] : [],
        max_slippage: [params.slippageTolerance * 100],
        referred_by: [],
      }

      console.log('Kong swap args:', swapArgs)
      const swapResult = await kongActor.swap(swapArgs) as any
      console.log('Kong swap result:', swapResult)

      if ('Err' in swapResult) {
        throw new Error(`Kong swap failed: ${swapResult.Err}`)
      }

      return swapResult.Ok
    } catch (error: any) {
      console.error('Kong ICRC1 swap error:', error)
      lastError.value = error.message
      throw error
    } finally {
      isLoading.value = false
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
  }
})