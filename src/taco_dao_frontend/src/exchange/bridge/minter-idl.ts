/**
 * Minimal IDL factories for the ckBTC and ckETH/ckERC20 minters.
 *
 * Hand-written from the live mainnet candid (fetched via
 * `dfx canister metadata <minter> candid:service`, 2026-07-23) covering only
 * the methods the bridge calls. Records are safe subsets (candid ignores
 * unknown wire fields); variants are copied in FULL because decoding fails on
 * an unknown tag.
 */

export const CKBTC_MINTER_ID = 'mqygn-kiaaa-aaaar-qaadq-cai'
export const CKBTC_LEDGER_ID = 'mxzaz-hqaaa-aaaar-qaada-cai'
export const CKETH_MINTER_ID = 'sv3dd-oaaaa-aaaar-qacoa-cai'
export const CKETH_LEDGER_ID = 'ss2fx-dyaaa-aaaar-qacoq-cai'

export const ckbtcMinterIDL = ({ IDL }: any) => {
  const Utxo = IDL.Record({
    outpoint: IDL.Record({ txid: IDL.Vec(IDL.Nat8), vout: IDL.Nat32 }),
    value: IDL.Nat64,
    height: IDL.Nat32,
  })
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  const UtxoStatus = IDL.Variant({
    ValueTooSmall: Utxo,
    Tainted: Utxo,
    Checked: Utxo,
    Minted: IDL.Record({ block_index: IDL.Nat64, minted_amount: IDL.Nat64, utxo: Utxo }),
  })
  const PendingUtxo = IDL.Record({
    outpoint: IDL.Record({ txid: IDL.Vec(IDL.Nat8), vout: IDL.Nat32 }),
    value: IDL.Nat64,
    confirmations: IDL.Nat32,
  })
  const SuspendedReason = IDL.Variant({ ValueTooSmall: IDL.Null, Quarantined: IDL.Null })
  const SuspendedUtxo = IDL.Record({
    utxo: Utxo,
    reason: SuspendedReason,
    earliest_retry: IDL.Nat64,
  })
  const UpdateBalanceError = IDL.Variant({
    NoNewUtxos: IDL.Record({
      current_confirmations: IDL.Opt(IDL.Nat32),
      required_confirmations: IDL.Nat32,
      pending_utxos: IDL.Opt(IDL.Vec(PendingUtxo)),
      suspended_utxos: IDL.Opt(IDL.Vec(SuspendedUtxo)),
    }),
    AlreadyProcessing: IDL.Null,
    TemporarilyUnavailable: IDL.Text,
    GenericError: IDL.Record({ error_message: IDL.Text, error_code: IDL.Nat64 }),
  })
  const RetrieveBtcWithApprovalError = IDL.Variant({
    MalformedAddress: IDL.Text,
    AlreadyProcessing: IDL.Null,
    AmountTooLow: IDL.Nat64,
    InsufficientFunds: IDL.Record({ balance: IDL.Nat64 }),
    InsufficientAllowance: IDL.Record({ allowance: IDL.Nat64 }),
    TemporarilyUnavailable: IDL.Text,
    GenericError: IDL.Record({ error_message: IDL.Text, error_code: IDL.Nat64 }),
  })
  const ReimbursementReason = IDL.Variant({
    CallFailed: IDL.Null,
    TaintedDestination: IDL.Record({ kyt_fee: IDL.Nat64, kyt_provider: IDL.Principal }),
  })
  const RetrieveBtcStatusV2 = IDL.Variant({
    Unknown: IDL.Null,
    Pending: IDL.Null,
    Signing: IDL.Null,
    Sending: IDL.Record({ txid: IDL.Vec(IDL.Nat8) }),
    Submitted: IDL.Record({ txid: IDL.Vec(IDL.Nat8) }),
    AmountTooLow: IDL.Null,
    Confirmed: IDL.Record({ txid: IDL.Vec(IDL.Nat8) }),
    Reimbursed: IDL.Record({
      account: Account,
      mint_block_index: IDL.Nat64,
      amount: IDL.Nat64,
      reason: ReimbursementReason,
    }),
    WillReimburse: IDL.Record({
      account: Account,
      amount: IDL.Nat64,
      reason: ReimbursementReason,
    }),
  })
  // subset of MinterInfo — candid ignores wire fields we don't declare
  const MinterInfo = IDL.Record({
    min_confirmations: IDL.Nat32,
    retrieve_btc_min_amount: IDL.Nat64,
    kyt_fee: IDL.Nat64,
  })
  const AddressArg = IDL.Record({
    owner: IDL.Opt(IDL.Principal),
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  })
  return IDL.Service({
    get_btc_address: IDL.Func([AddressArg], [IDL.Text], []),
    get_known_utxos: IDL.Func([AddressArg], [IDL.Vec(Utxo)], ['query']),
    update_balance: IDL.Func(
      [AddressArg],
      [IDL.Variant({ Ok: IDL.Vec(UtxoStatus), Err: UpdateBalanceError })],
      [],
    ),
    estimate_withdrawal_fee: IDL.Func(
      [IDL.Record({ amount: IDL.Opt(IDL.Nat64) })],
      [IDL.Record({ bitcoin_fee: IDL.Nat64, minter_fee: IDL.Nat64 })],
      ['query'],
    ),
    get_minter_info: IDL.Func([], [MinterInfo], ['query']),
    retrieve_btc_with_approval: IDL.Func(
      [IDL.Record({
        address: IDL.Text,
        amount: IDL.Nat64,
        from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
      })],
      [IDL.Variant({
        Ok: IDL.Record({ block_index: IDL.Nat64 }),
        Err: RetrieveBtcWithApprovalError,
      })],
      [],
    ),
    retrieve_btc_status_v2: IDL.Func(
      [IDL.Record({ block_index: IDL.Nat64 })],
      [RetrieveBtcStatusV2],
      ['query'],
    ),
  })
}

export const ckethMinterIDL = ({ IDL }: any) => {
  const Subaccount = IDL.Vec(IDL.Nat8)
  const Account = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })
  const CkErc20Token = IDL.Record({
    ckerc20_token_symbol: IDL.Text,
    erc20_contract_address: IDL.Text,
    ledger_canister_id: IDL.Principal,
  })
  const GasFeeEstimate = IDL.Record({
    max_fee_per_gas: IDL.Nat,
    max_priority_fee_per_gas: IDL.Nat,
    timestamp: IDL.Nat64,
  })
  // subset of MinterInfo — candid ignores wire fields we don't declare
  const MinterInfo = IDL.Record({
    eth_helper_contract_address: IDL.Opt(IDL.Text),
    erc20_helper_contract_address: IDL.Opt(IDL.Text),
    deposit_with_subaccount_helper_contract_address: IDL.Opt(IDL.Text),
    supported_ckerc20_tokens: IDL.Opt(IDL.Vec(CkErc20Token)),
    minimum_withdrawal_amount: IDL.Opt(IDL.Nat),
    cketh_ledger_id: IDL.Opt(IDL.Principal),
    last_gas_fee_estimate: IDL.Opt(GasFeeEstimate),
  })
  const Eip1559TransactionPrice = IDL.Record({
    gas_limit: IDL.Nat,
    max_fee_per_gas: IDL.Nat,
    max_priority_fee_per_gas: IDL.Nat,
    max_transaction_fee: IDL.Nat,
    timestamp: IDL.Opt(IDL.Nat64),
  })
  const EthTransaction = IDL.Record({ transaction_hash: IDL.Text })
  const TxFinalizedStatus = IDL.Variant({
    Success: IDL.Record({
      transaction_hash: IDL.Text,
      effective_transaction_fee: IDL.Opt(IDL.Nat),
    }),
    Reimbursed: IDL.Record({
      transaction_hash: IDL.Text,
      reimbursed_amount: IDL.Nat,
      reimbursed_in_block: IDL.Nat,
    }),
    PendingReimbursement: EthTransaction,
  })
  const RetrieveEthStatus = IDL.Variant({
    NotFound: IDL.Null,
    Pending: IDL.Null,
    TxCreated: IDL.Null,
    TxSent: EthTransaction,
    TxFinalized: TxFinalizedStatus,
  })
  const WithdrawalStatus = IDL.Variant({
    Pending: IDL.Null,
    TxCreated: IDL.Null,
    TxSent: EthTransaction,
    TxFinalized: TxFinalizedStatus,
  })
  const WithdrawalDetail = IDL.Record({
    token_symbol: IDL.Text,
    withdrawal_amount: IDL.Nat,
    max_transaction_fee: IDL.Opt(IDL.Nat),
    withdrawal_id: IDL.Nat64,
    from: IDL.Principal,
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    recipient_address: IDL.Text,
    status: WithdrawalStatus,
  })
  const WithdrawalSearchParameter = IDL.Variant({
    ByRecipient: IDL.Text,
    BySenderAccount: Account,
    ByWithdrawalId: IDL.Nat64,
  })
  const WithdrawalError = IDL.Variant({
    AmountTooLow: IDL.Record({ min_withdrawal_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    InsufficientAllowance: IDL.Record({ allowance: IDL.Nat }),
    RecipientAddressBlocked: IDL.Record({ address: IDL.Text }),
    TemporarilyUnavailable: IDL.Text,
  })
  const LedgerError = IDL.Variant({
    InsufficientFunds: IDL.Record({
      balance: IDL.Nat, failed_burn_amount: IDL.Nat, token_symbol: IDL.Text, ledger_id: IDL.Principal,
    }),
    InsufficientAllowance: IDL.Record({
      allowance: IDL.Nat, failed_burn_amount: IDL.Nat, token_symbol: IDL.Text, ledger_id: IDL.Principal,
    }),
    AmountTooLow: IDL.Record({
      minimum_burn_amount: IDL.Nat, failed_burn_amount: IDL.Nat, token_symbol: IDL.Text, ledger_id: IDL.Principal,
    }),
    TemporarilyUnavailable: IDL.Text,
  })
  const WithdrawErc20Error = IDL.Variant({
    TokenNotSupported: IDL.Record({ supported_tokens: IDL.Vec(CkErc20Token) }),
    RecipientAddressBlocked: IDL.Record({ address: IDL.Text }),
    CkEthLedgerError: IDL.Record({ error: LedgerError }),
    CkErc20LedgerError: IDL.Record({ cketh_block_index: IDL.Nat, error: LedgerError }),
    TemporarilyUnavailable: IDL.Text,
  })
  return IDL.Service({
    get_minter_info: IDL.Func([], [MinterInfo], ['query']),
    eip_1559_transaction_price: IDL.Func(
      [IDL.Opt(IDL.Record({ ckerc20_ledger_id: IDL.Principal }))],
      [Eip1559TransactionPrice],
      ['query'],
    ),
    withdraw_eth: IDL.Func(
      [IDL.Record({ recipient: IDL.Text, amount: IDL.Nat, from_subaccount: IDL.Opt(Subaccount) })],
      [IDL.Variant({ Ok: IDL.Record({ block_index: IDL.Nat }), Err: WithdrawalError })],
      [],
    ),
    withdraw_erc20: IDL.Func(
      [IDL.Record({
        amount: IDL.Nat,
        ckerc20_ledger_id: IDL.Principal,
        recipient: IDL.Text,
        from_cketh_subaccount: IDL.Opt(Subaccount),
        from_ckerc20_subaccount: IDL.Opt(Subaccount),
      })],
      [IDL.Variant({
        Ok: IDL.Record({ cketh_block_index: IDL.Nat, ckerc20_block_index: IDL.Nat }),
        Err: WithdrawErc20Error,
      })],
      [],
    ),
    retrieve_eth_status: IDL.Func([IDL.Nat64], [RetrieveEthStatus], []),
    withdrawal_status: IDL.Func([WithdrawalSearchParameter], [IDL.Vec(WithdrawalDetail)], ['query']),
  })
}
