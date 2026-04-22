/**
 * Deposit helpers for transferring tokens to the exchange treasury.
 * Based on Section 4 of FRONTEND_DEV_GUIDE.md.
 *
 * Every trade, swap, and liquidity action requires the user to first
 * transfer tokens to the treasury, then pass the block number to the
 * exchange canister.
 */

import { Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { getCachedAgent } from '../../shared/auth-cache'

/** JSON replacer that converts BigInt to string (prevents "Do not know how to serialize a BigInt") */
const jsonSafe = (_: string, v: any) => typeof v === 'bigint' ? v.toString() : v

/**
 * Calculate the total required deposit amount including trading fee and transfer fee.
 */
export function calculateRequiredDeposit(
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
): bigint {
  const feeAmount = (tradeAmount * tradingFeeBps) / 10000n
  return tradeAmount + feeAmount + transferFee
}

// Minimal IDL for ICP ledger transfer
const icpLedgerIdl = ({ IDL }: { IDL: any }) => {
  const AccountIdentifier = IDL.Vec(IDL.Nat8)
  const Tokens = IDL.Record({ e8s: IDL.Nat64 })
  const TransferArgs = IDL.Record({
    to: AccountIdentifier,
    fee: Tokens,
    memo: IDL.Nat64,
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Record({ timestamp_nanos: IDL.Nat64 })),
    amount: Tokens,
  })
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat64,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: Tokens }),
      InsufficientFunds: IDL.Record({ balance: Tokens }),
      TxTooOld: IDL.Record({ allowed_window_nanos: IDL.Nat64 }),
      TxCreatedInFuture: IDL.Null,
      TxDuplicate: IDL.Record({ duplicate_of: IDL.Nat64 }),
    }),
  })
  return IDL.Service({
    transfer: IDL.Func([TransferArgs], [TransferResult], []),
  })
}

// Minimal IDL for ICRC1 transfer
const icrc1TransferIdl = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  })
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
      BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
      InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
      TooOld: IDL.Null,
      CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
      Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
      TemporarilyUnavailable: IDL.Null,
      GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
    }),
  })
  return IDL.Service({
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], []),
  })
}

/**
 * Convert a hex string to Uint8Array for ICP account identifiers.
 */
function hexToBytes(hex: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return bytes
}

const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const ICP_TRANSFER_FEE = 10_000n

/**
 * Deposit ICP to the exchange treasury.
 * Returns the block height of the transfer.
 *
 * WARNING: ICP transfers MUST come from the user's default subaccount.
 * Transfers from non-default subaccounts are permanently unrecoverable.
 */
export async function depositICP(
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  treasuryAccountIdHex: string,
): Promise<bigint> {
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, ICP_TRANSFER_FEE)

  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')

  const ledger = Actor.createActor(icpLedgerIdl, {
    agent,
    canisterId: ICP_LEDGER_CANISTER_ID,
  })

  const result = await ledger.transfer({
    to: hexToBytes(treasuryAccountIdHex),
    amount: { e8s: required },
    fee: { e8s: ICP_TRANSFER_FEE },
    memo: 0n,
    from_subaccount: [],
    created_at_time: [],
  })

  if ('Err' in (result as any)) {
    const err = (result as any).Err
    if ('InsufficientFunds' in err) {
      throw new Error(`Insufficient ICP balance. Available: ${Number(err.InsufficientFunds.balance.e8s) / 1e8} ICP`)
    }
    throw new Error(`ICP transfer failed: ${JSON.stringify(err, jsonSafe)}`)
  }

  return (result as any).Ok
}

/**
 * Deposit an ICRC token to the exchange treasury.
 * Returns the block index of the transfer.
 *
 * NOTE: ICRC-2 approve+transferFrom is NOT supported. Only direct icrc1_transfer.
 */
export async function depositICRC(
  tokenCanisterId: string,
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
  treasuryPrincipalText: string,
): Promise<bigint> {
  const required = calculateRequiredDeposit(tradeAmount, tradingFeeBps, transferFee)

  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')

  const tokenActor = Actor.createActor(icrc1TransferIdl, {
    agent,
    canisterId: tokenCanisterId,
  })

  const result = await tokenActor.icrc1_transfer({
    from_subaccount: [],
    to: {
      owner: Principal.fromText(treasuryPrincipalText),
      subaccount: [],
    },
    amount: required,
    fee: [],
    memo: [],
    created_at_time: [],
  })

  if ('Err' in (result as any)) {
    const err = (result as any).Err
    if ('InsufficientFunds' in err) {
      throw new Error(`Insufficient token balance.`)
    }
    throw new Error(`Token transfer failed: ${JSON.stringify(err, jsonSafe)}`)
  }

  return (result as any).Ok
}

/**
 * Save every deposit to localStorage for recovery.
 * Keeps the last 50 deposits. Entries older than 21 days are pruned.
 */
function saveDepositToCache(tokenCanisterId: string, block: bigint, amount: bigint, assetType: string) {
  try {
    const CACHE_KEY = 'taco_deposit_history'
    const MAX_ENTRIES = 50
    const MAX_AGE_MS = 21 * 86_400_000 // 21 days (block validity window)

    const raw = localStorage.getItem(CACHE_KEY)
    const history: Array<{ token: string; block: string; amount: string; type: string; timestamp: number }> =
      raw ? JSON.parse(raw) : []

    // Add new entry
    history.unshift({
      token: tokenCanisterId,
      block: block.toString(),
      amount: amount.toString(),
      type: assetType,
      timestamp: Date.now(),
    })

    // Prune old entries + cap size
    const now = Date.now()
    const pruned = history.filter(e => now - e.timestamp < MAX_AGE_MS).slice(0, MAX_ENTRIES)
    localStorage.setItem(CACHE_KEY, JSON.stringify(pruned))
  } catch { /* localStorage full or unavailable — ignore */ }
}

/**
 * Get cached deposit history for the Recover page.
 */
export function getDepositHistory(): Array<{ token: string; block: string; amount: string; type: string; timestamp: number }> {
  try {
    const raw = localStorage.getItem('taco_deposit_history')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/**
 * Remove a deposit from cache (after successful recovery or use).
 */
export function removeDepositFromCache(block: string) {
  try {
    const CACHE_KEY = 'taco_deposit_history'
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const history = JSON.parse(raw) as Array<{ block: string }>
    localStorage.setItem(CACHE_KEY, JSON.stringify(history.filter(e => e.block !== block)))
  } catch { /* ignore */ }
}

/**
 * Deposit for addLiquidity — transfers the EXACT amount with no fee additions.
 * The guide says: "amount: amount0 — exact amount — do NOT add transfer fee here"
 * The ledger charges the fee separately from the sender's balance.
 */
export async function depositTokenForLiquidity(
  tokenCanisterId: string,
  assetType: { ICP: null } | { ICRC12: null } | { ICRC3: null },
  amount: bigint,
  treasuryAccountIdHex: string,
  treasuryPrincipalText: string,
): Promise<bigint> {
  const agent = await getCachedAgent()
  if (!agent) throw new Error('Not authenticated')

  let block: bigint
  const typeStr = 'ICP' in assetType ? 'ICP' : 'ICRC3' in assetType ? 'ICRC3' : 'ICRC12'

  if ('ICP' in assetType) {
    const ledger = Actor.createActor(icpLedgerIdl, { agent, canisterId: ICP_LEDGER_CANISTER_ID })
    const result = await ledger.transfer({
      to: hexToBytes(treasuryAccountIdHex),
      amount: { e8s: amount },
      fee: { e8s: ICP_TRANSFER_FEE },
      memo: 0n,
      from_subaccount: [],
      created_at_time: [],
    })
    if ('Err' in (result as any)) throw new Error(`ICP transfer failed: ${JSON.stringify((result as any).Err, jsonSafe)}`)
    block = (result as any).Ok
  } else {
    const tokenActor = Actor.createActor(icrc1TransferIdl, { agent, canisterId: tokenCanisterId })
    const result = await tokenActor.icrc1_transfer({
      from_subaccount: [],
      to: { owner: Principal.fromText(treasuryPrincipalText), subaccount: [] },
      amount,
      fee: [],
      memo: [],
      created_at_time: [],
    })
    if ('Err' in (result as any)) throw new Error(`Token transfer failed: ${JSON.stringify((result as any).Err, jsonSafe)}`)
    block = (result as any).Ok
  }

  saveDepositToCache(tokenCanisterId, block, amount, typeStr)
  return block
}

/**
 * Universal deposit function that routes to the correct transfer method
 * based on the token's asset type.
 * Every successful deposit is automatically saved to localStorage for recovery.
 */
export async function depositToken(
  tokenCanisterId: string,
  assetType: { ICP: null } | { ICRC12: null } | { ICRC3: null },
  tradeAmount: bigint,
  tradingFeeBps: bigint,
  transferFee: bigint,
  treasuryAccountIdHex: string,
  treasuryPrincipalText: string,
): Promise<bigint> {
  let block: bigint
  const typeStr = 'ICP' in assetType ? 'ICP' : 'ICRC3' in assetType ? 'ICRC3' : 'ICRC12'

  if ('ICP' in assetType) {
    block = await depositICP(tradeAmount, tradingFeeBps, treasuryAccountIdHex)
  } else {
    block = await depositICRC(tokenCanisterId, tradeAmount, tradingFeeBps, transferFee, treasuryPrincipalText)
  }

  // Always save to cache — the next step (addPosition/addLiquidity/etc.) might fail
  saveDepositToCache(tokenCanisterId, block, tradeAmount, typeStr)

  return block
}
