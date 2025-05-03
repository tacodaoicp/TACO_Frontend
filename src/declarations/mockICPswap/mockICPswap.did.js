export const idlFactory = ({ IDL }) => {
  const DepositArgs = IDL.Record({
    'fee' : IDL.Nat,
    'token' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Token = IDL.Record({ 'address' : IDL.Text, 'standard' : IDL.Text });
  const PoolMetadata = IDL.Record({
    'fee' : IDL.Nat,
    'key' : IDL.Text,
    'sqrtPriceX96' : IDL.Nat,
    'tick' : IDL.Int,
    'liquidity' : IDL.Nat,
    'token0' : Token,
    'token1' : Token,
    'maxLiquidityPerTick' : IDL.Nat,
    'nextPositionId' : IDL.Nat,
  });
  const GetPoolArgs = IDL.Record({
    'fee' : IDL.Nat,
    'token0' : Token,
    'token1' : Token,
  });
  const PoolData = IDL.Record({
    'fee' : IDL.Nat,
    'key' : IDL.Text,
    'tickSpacing' : IDL.Int,
    'token0' : Token,
    'token1' : Token,
    'canisterId' : IDL.Principal,
  });
  const Result_4 = IDL.Variant({ 'ok' : PoolData, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Vec(PoolData), 'err' : IDL.Text });
  const ICPSwapBalance = IDL.Record({
    'balance0' : IDL.Nat,
    'balance1' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({ 'ok' : ICPSwapBalance, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : PoolMetadata, 'err' : IDL.Text });
  const SwapArgs = IDL.Record({
    'amountIn' : IDL.Text,
    'zeroForOne' : IDL.Bool,
    'amountOutMinimum' : IDL.Text,
  });
  const WithdrawArgs = IDL.Record({
    'fee' : IDL.Nat,
    'token' : IDL.Text,
    'amount' : IDL.Nat,
  });
  return IDL.Service({
    'addPool' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Principal, IDL.Float64, IDL.Nat],
        [],
        [],
      ),
    'deposit2' : IDL.Func([IDL.Principal, DepositArgs], [Result], []),
    'getAllPoolMetadata' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, PoolMetadata))],
        ['query'],
      ),
    'getPool' : IDL.Func([GetPoolArgs], [Result_4], ['query']),
    'getPoolByPair' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'getPools' : IDL.Func(
        [],
        [IDL.Variant({ 'ok' : IDL.Vec(PoolData), 'err' : IDL.Text })],
        ['query'],
      ),
    'getPoolsByCanister' : IDL.Func([IDL.Principal], [Result_3], ['query']),
    'getUserUnusedBalance' : IDL.Func([IDL.Principal], [Result_2], ['query']),
    'initializeMockPools' : IDL.Func([], [], []),
    'metadata' : IDL.Func([], [Result_1], ['query']),
    'metadata2' : IDL.Func([IDL.Principal], [Result_1], ['query']),
    'quote' : IDL.Func([SwapArgs], [Result], ['query']),
    'quote2' : IDL.Func([SwapArgs, IDL.Principal], [Result], ['query']),
    'swap' : IDL.Func([SwapArgs], [Result], []),
    'swap2' : IDL.Func([IDL.Principal, SwapArgs], [Result], []),
    'updatePoolMetadata' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [], []),
    'withdraw' : IDL.Func([WithdrawArgs], [Result], []),
    'withdraw2' : IDL.Func([IDL.Principal, WithdrawArgs], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
