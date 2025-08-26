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

// Kong canister ID
const KONG_CANISTER_ID = '2ipq2-uqaaa-aaaar-qailq-cai'

// Kong swap types
interface KongSwapArgs {
  pay_token: string
  pay_amount: bigint
  pay_tx_id?: { BlockIndex: bigint } | null
  receive_token: string
  receive_amount?: bigint | null
  receive_address?: Principal | null
  max_slippage?: number | null
  referred_by?: Principal | null
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

    const kongIDL = ({ IDL }: any) => {
      const TxId = IDL.Variant({
        'BlockIndex': IDL.Nat,
        'TransactionId': IDL.Text,
      })

      const KongSwapArgs = IDL.Record({
        'pay_token': IDL.Text,
        'pay_amount': IDL.Nat,
        'pay_tx_id': IDL.Opt(TxId),
        'receive_token': IDL.Text,
        'receive_amount': IDL.Opt(IDL.Nat),
        'receive_address': IDL.Opt(IDL.Principal),
        'max_slippage': IDL.Opt(IDL.Float64),
        'referred_by': IDL.Opt(IDL.Principal),
      })

      const SwapReply = IDL.Record({
        'txid': IDL.Nat,
        'request_id': IDL.Nat64,
        'status': IDL.Text,
        'pay_chain': IDL.Text,
        'pay_symbol': IDL.Text,
        'pay_amount': IDL.Nat,
        'receive_chain': IDL.Text,
        'receive_symbol': IDL.Text,
        'receive_amount': IDL.Nat,
        'mid_price': IDL.Float64,
        'price': IDL.Float64,
        'slippage': IDL.Float64,
        'ts': IDL.Nat64,
      })

      const SwapResult = IDL.Variant({
        'Ok': SwapReply,
        'Err': IDL.Text,
      })

      const SwapAmountsReply = IDL.Record({
        'pay_chain': IDL.Text,
        'pay_symbol': IDL.Text,
        'pay_address': IDL.Text,
        'pay_amount': IDL.Nat,
        'receive_chain': IDL.Text,
        'receive_symbol': IDL.Text,
        'receive_address': IDL.Text,
        'receive_amount': IDL.Nat,
        'price': IDL.Float64,
        'mid_price': IDL.Float64,
        'slippage': IDL.Float64,
        'txs': IDL.Vec(IDL.Record({})), // Simplified for now
      })

      const SwapAmountsResult = IDL.Variant({
        'Ok': SwapAmountsReply,
        'Err': IDL.Text,
      })

      return IDL.Service({
        'swap': IDL.Func([KongSwapArgs], [SwapResult], []),
        'swap_amounts': IDL.Func([IDL.Text, IDL.Nat, IDL.Text], [SwapAmountsResult], ['query']),
      })
    }

    return Actor.createActor(kongIDL, {
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

      // Step 1: Create ICRC2 approval for Kong
      console.log('Step 1: Creating ICRC2 approval...')
      const tokenActor = await createTokenActor(params.sellTokenPrincipal)
      
      const approvalArgs = {
        spender: {
          owner: Principal.fromText(KONG_CANISTER_ID),
          subaccount: [],
        },
        amount: params.amountIn,
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

      // Step 2: Execute Kong swap without tx_id (will use ICRC2)
      console.log('Step 2: Executing Kong swap...')
      const kongActor = await createKongActor()

      const swapArgs: KongSwapArgs = {
        pay_token: formatTokenSymbolForKong(params.sellTokenSymbol),
        pay_amount: params.amountIn,
        pay_tx_id: null, // No tx_id means Kong will use ICRC2
        receive_token: formatTokenSymbolForKong(params.buyTokenSymbol),
        receive_amount: null,
        receive_address: params.recipient || null,
        max_slippage: params.slippageTolerance,
        referred_by: null,
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
      console.log('Step 2: Executing Kong swap with tx_id...')
      const kongActor = await createKongActor()

      const swapArgs: KongSwapArgs = {
        pay_token: formatTokenSymbolForKong(params.sellTokenSymbol),
        pay_amount: params.amountIn,
        pay_tx_id: { BlockIndex: BigInt(blockIndex) },
        receive_token: formatTokenSymbolForKong(params.buyTokenSymbol),
        receive_amount: null,
        receive_address: params.recipient || null,
        max_slippage: params.slippageTolerance,
        referred_by: null,
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