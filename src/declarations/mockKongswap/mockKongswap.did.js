export const idlFactory = ({ IDL }) => {
  const PoolReply = IDL.Record({
    'tvl' : IDL.Nat,
    'lp_token_symbol' : IDL.Text,
    'name' : IDL.Text,
    'lp_fee_0' : IDL.Nat,
    'lp_fee_1' : IDL.Nat,
    'balance_0' : IDL.Nat,
    'balance_1' : IDL.Nat,
    'rolling_24h_volume' : IDL.Nat,
    'rolling_24h_apy' : IDL.Float64,
    'address_0' : IDL.Text,
    'address_1' : IDL.Text,
    'rolling_24h_num_swaps' : IDL.Nat,
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'pool_id' : IDL.Nat32,
    'price' : IDL.Float64,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'is_removed' : IDL.Bool,
    'symbol' : IDL.Text,
    'rolling_24h_lp_fee' : IDL.Nat,
    'lp_fee_bps' : IDL.Nat8,
  });
  const PoolsReply = IDL.Record({
    'total_24h_lp_fee' : IDL.Nat,
    'total_tvl' : IDL.Nat,
    'total_24h_volume' : IDL.Nat,
    'pools' : IDL.Vec(PoolReply),
    'total_24h_num_swaps' : IDL.Nat,
  });
  const TxId = IDL.Variant({
    'TransactionId' : IDL.Text,
    'BlockIndex' : IDL.Nat,
  });
  const KongSwapArgs__1 = IDL.Record({
    'receive_token' : IDL.Text,
    'max_slippage' : IDL.Opt(IDL.Float64),
    'pay_amount' : IDL.Nat,
    'referred_by' : IDL.Opt(IDL.Principal),
    'receive_amount' : IDL.Opt(IDL.Nat),
    'receive_address' : IDL.Opt(IDL.Principal),
    'pay_token' : IDL.Text,
    'pay_tx_id' : IDL.Opt(TxId),
  });
  const RequestRequest = IDL.Variant({
    'AddLiquidity' : IDL.Null,
    'Swap' : KongSwapArgs__1,
    'AddPool' : IDL.Null,
    'RemoveLiquidity' : IDL.Null,
  });
  const SwapTxReply = IDL.Record({
    'ts' : IDL.Nat64,
    'receive_chain' : IDL.Text,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'receive_address' : IDL.Text,
    'pool_symbol' : IDL.Text,
    'pay_address' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'lp_fee' : IDL.Nat,
    'gas_fee' : IDL.Nat,
  });
  const ICTransferReply = IDL.Record({
    'is_send' : IDL.Bool,
    'block_index' : IDL.Nat,
    'chain' : IDL.Text,
    'canister_id' : IDL.Text,
    'amount' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const TransferReply = IDL.Variant({ 'IC' : ICTransferReply });
  const TransferIdReply = IDL.Record({
    'transfer_id' : IDL.Nat64,
    'transfer' : TransferReply,
  });
  const SwapReply = IDL.Record({
    'ts' : IDL.Nat64,
    'txs' : IDL.Vec(SwapTxReply),
    'request_id' : IDL.Nat64,
    'status' : IDL.Text,
    'tx_id' : IDL.Nat64,
    'transfer_ids' : IDL.Vec(TransferIdReply),
    'receive_chain' : IDL.Text,
    'mid_price' : IDL.Float64,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'claim_ids' : IDL.Vec(IDL.Nat64),
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'receive_address' : IDL.Text,
    'pay_address' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'slippage' : IDL.Float64,
  });
  const RequestReply = IDL.Variant({
    'AddLiquidity' : IDL.Null,
    'Swap' : SwapReply,
    'AddPool' : IDL.Null,
    'RemoveLiquidity' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const RequestsReply = IDL.Record({
    'ts' : IDL.Nat64,
    'request_id' : IDL.Nat64,
    'request' : RequestRequest,
    'statuses' : IDL.Vec(IDL.Text),
    'reply' : RequestReply,
  });
  const SwapAmountsTxReply = IDL.Record({
    'receive_chain' : IDL.Text,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'receive_address' : IDL.Text,
    'pool_symbol' : IDL.Text,
    'pay_address' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'lp_fee' : IDL.Nat,
    'gas_fee' : IDL.Nat,
  });
  const SwapAmountsReply = IDL.Record({
    'txs' : IDL.Vec(SwapAmountsTxReply),
    'receive_chain' : IDL.Text,
    'mid_price' : IDL.Float64,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'receive_address' : IDL.Text,
    'pay_address' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'slippage' : IDL.Float64,
  });
  const KongSwapArgs = IDL.Record({
    'receive_token' : IDL.Text,
    'max_slippage' : IDL.Opt(IDL.Float64),
    'pay_amount' : IDL.Nat,
    'referred_by' : IDL.Opt(IDL.Principal),
    'receive_amount' : IDL.Opt(IDL.Nat),
    'receive_address' : IDL.Opt(IDL.Principal),
    'pay_token' : IDL.Text,
    'pay_tx_id' : IDL.Opt(TxId),
  });
  const ICTokenReply = IDL.Record({
    'fee' : IDL.Nat,
    'decimals' : IDL.Nat8,
    'token_id' : IDL.Nat32,
    'chain' : IDL.Text,
    'name' : IDL.Text,
    'canister_id' : IDL.Text,
    'icrc1' : IDL.Bool,
    'icrc2' : IDL.Bool,
    'icrc3' : IDL.Bool,
    'is_removed' : IDL.Bool,
    'symbol' : IDL.Text,
  });
  const LPTokenReply = IDL.Record({
    'fee' : IDL.Nat,
    'decimals' : IDL.Nat8,
    'token_id' : IDL.Nat32,
    'chain' : IDL.Text,
    'name' : IDL.Text,
    'address' : IDL.Text,
    'pool_id_of' : IDL.Nat32,
    'is_removed' : IDL.Bool,
    'total_supply' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const TokenReply = IDL.Variant({ 'IC' : ICTokenReply, 'LP' : LPTokenReply });
  return IDL.Service({
    'initializeMockData' : IDL.Func([], [], []),
    'pools' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [IDL.Variant({ 'Ok' : PoolsReply, 'Err' : IDL.Text })],
        ['query'],
      ),
    'requests' : IDL.Func(
        [IDL.Opt(IDL.Nat64)],
        [IDL.Variant({ 'Ok' : IDL.Vec(RequestsReply), 'Err' : IDL.Text })],
        ['query'],
      ),
    'swap' : IDL.Func(
        [KongSwapArgs__1],
        [IDL.Variant({ 'Ok' : SwapReply, 'Err' : IDL.Text })],
        [],
      ),
    'swap_amounts' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Text],
        [IDL.Variant({ 'Ok' : SwapAmountsReply, 'Err' : IDL.Text })],
        ['query'],
      ),
    'swap_async' : IDL.Func(
        [KongSwapArgs],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'tokens' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [IDL.Variant({ 'Ok' : IDL.Vec(TokenReply), 'Err' : IDL.Text })],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
