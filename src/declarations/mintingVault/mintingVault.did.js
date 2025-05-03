export const idlFactory = ({ IDL }) => {
  const Result_4 = IDL.Variant({
    'ok' : IDL.Record({
      'tacoPrice' : IDL.Nat,
      'premium' : IDL.Float64,
      'tokenPrice' : IDL.Nat,
      'maxAcceptedAmount' : IDL.Nat,
      'estimatedTacoAmount' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const LogLevel = IDL.Variant({
    'INFO' : IDL.Null,
    'WARN' : IDL.Null,
    'ERROR' : IDL.Null,
  });
  const LogEntry = IDL.Record({
    'component' : IDL.Text,
    'context' : IDL.Text,
    'level' : LogLevel,
    'message' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const PricePoint = IDL.Record({
    'usdPrice' : IDL.Float64,
    'time' : IDL.Int,
    'icpPrice' : IDL.Nat,
  });
  const TokenType = IDL.Variant({
    'ICP' : IDL.Null,
    'ICRC3' : IDL.Null,
    'ICRC12' : IDL.Null,
  });
  const TokenDetails = IDL.Record({
    'lastTimeSynced' : IDL.Int,
    'balance' : IDL.Nat,
    'isPaused' : IDL.Bool,
    'Active' : IDL.Bool,
    'epochAdded' : IDL.Int,
    'priceInICP' : IDL.Nat,
    'priceInUSD' : IDL.Float64,
    'tokenTransferFee' : IDL.Nat,
    'tokenDecimals' : IDL.Nat,
    'pastPrices' : IDL.Vec(PricePoint),
    'tokenSymbol' : IDL.Text,
    'tokenName' : IDL.Text,
    'pausedDueToSyncFailure' : IDL.Bool,
    'tokenType' : TokenType,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const SwapError = IDL.Variant({
    'InvalidBlock' : IDL.Null,
    'InvalidAmount' : IDL.Null,
    'TransferError' : IDL.Null,
    'InvalidPrice' : IDL.Null,
    'BlockAlreadyProcessed' : IDL.Null,
    'InsufficientBalance' : IDL.Null,
    'SwapAlreadyRunning' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'TokenNotTrusted' : IDL.Null,
  });
  const SwapResult = IDL.Record({
    'returnedSentAmount' : IDL.Nat,
    'blockNumber' : IDL.Nat,
    'wantedTokenAddress' : IDL.Text,
    'error' : IDL.Opt(SwapError),
    'sentTokenAddress' : IDL.Text,
    'usedSentAmount' : IDL.Nat,
    'success' : IDL.Bool,
    'returnedWantedAmount' : IDL.Nat,
    'swappedAmount' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({ 'ok' : SwapResult, 'err' : IDL.Text });
  const SyncError = IDL.Variant({
    'NotDAO' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : SyncError });
  const UpdateConfig = IDL.Record({
    'balanceUpdateInterval' : IDL.Opt(IDL.Int),
    'maxSlippageBasisPoints' : IDL.Opt(IDL.Nat),
    'blockCleanupInterval' : IDL.Opt(IDL.Int),
    'minSwapValueUSD' : IDL.Opt(IDL.Float64),
    'PRICE_HISTORY_WINDOW' : IDL.Opt(IDL.Int),
    'maxPremium' : IDL.Opt(IDL.Float64),
    'swappingEnabled' : IDL.Opt(IDL.Bool),
    'minPremium' : IDL.Opt(IDL.Float64),
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  return IDL.Service({
    'clearLogs' : IDL.Func([], [], []),
    'estimateSwapAmount' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_4],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getLogsByContext' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Vec(LogEntry)],
        ['query'],
      ),
    'getLogsByLevel' : IDL.Func(
        [LogLevel, IDL.Nat],
        [IDL.Vec(LogEntry)],
        ['query'],
      ),
    'getVaultStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'currentAllocations' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
            'totalValueICP' : IDL.Nat,
            'tokenDetails' : IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails)),
            'premiumRange' : IDL.Record({
              'max' : IDL.Float64,
              'min' : IDL.Float64,
            }),
            'targetAllocations' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
            'exchangeRates' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Float64)),
          }),
        ],
        ['query'],
      ),
    'recoverWronglySentTokens' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_3],
        [],
      ),
    'setLogAdmin' : IDL.Func([IDL.Principal], [], []),
    'setSnsGovernanceCanisterId' : IDL.Func([IDL.Principal], [], []),
    'setTest' : IDL.Func([IDL.Bool], [], []),
    'swapTokenForTaco' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Nat],
        [Result_2],
        [],
      ),
    'syncTokenDetailsFromDAO' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        [Result_1],
        [],
      ),
    'updateConfiguration' : IDL.Func([UpdateConfig], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
