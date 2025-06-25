export const idlFactory = ({ IDL }) => {
  const PortfolioDirection__1 = IDL.Variant({
    'Up' : IDL.Null,
    'Down' : IDL.Null,
  });
  const PortfolioValueType__1 = IDL.Variant({
    'ICP' : IDL.Null,
    'USD' : IDL.Null,
  });
  const PortfolioCircuitBreakerError = IDL.Variant({
    'InvalidTimeWindow' : IDL.Null,
    'DuplicateName' : IDL.Null,
    'SystemError' : IDL.Text,
    'ConditionNotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidPercentage' : IDL.Null,
  });
  const Result_11 = IDL.Variant({
    'ok' : IDL.Nat,
    'err' : PortfolioCircuitBreakerError,
  });
  const PriceDirection__1 = IDL.Variant({ 'Up' : IDL.Null, 'Down' : IDL.Null });
  const PriceFailsafeError = IDL.Variant({
    'InvalidTimeWindow' : IDL.Null,
    'DuplicateName' : IDL.Null,
    'SystemError' : IDL.Text,
    'ConditionNotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidPercentage' : IDL.Null,
    'InvalidTokenList' : IDL.Null,
  });
  const Result_10 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : PriceFailsafeError });
  const RebalanceError = IDL.Variant({
    'LiquidityError' : IDL.Text,
    'TradeError' : IDL.Text,
    'SystemError' : IDL.Text,
    'ConfigError' : IDL.Text,
    'PriceError' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : RebalanceError });
  const Result_9 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const TradingPauseError = IDL.Variant({
    'TokenNotPaused' : IDL.Null,
    'TokenNotFound' : IDL.Null,
    'TokenAlreadyPaused' : IDL.Null,
    'SystemError' : IDL.Text,
    'NotAuthorized' : IDL.Null,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : TradingPauseError });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Text,
    'err' : PortfolioCircuitBreakerError,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : PriceFailsafeError });
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
  const PortfolioDirection = IDL.Variant({
    'Up' : IDL.Null,
    'Down' : IDL.Null,
  });
  const PortfolioValueType = IDL.Variant({
    'ICP' : IDL.Null,
    'USD' : IDL.Null,
  });
  const PortfolioCircuitBreakerCondition = IDL.Record({
    'id' : IDL.Nat,
    'direction' : PortfolioDirection,
    'timeWindowNS' : IDL.Nat,
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'createdBy' : IDL.Principal,
    'isActive' : IDL.Bool,
    'valueType' : PortfolioValueType,
    'percentage' : IDL.Float64,
  });
  const PortfolioTriggerData = IDL.Record({
    'maxValueInWindow' : IDL.Float64,
    'minValueInWindow' : IDL.Float64,
    'actualChangePercent' : IDL.Float64,
    'currentValue' : IDL.Float64,
    'valueType' : PortfolioValueType,
    'windowStartTime' : IDL.Int,
  });
  const PortfolioCircuitBreakerCondition__1 = IDL.Record({
    'id' : IDL.Nat,
    'direction' : PortfolioDirection,
    'timeWindowNS' : IDL.Nat,
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'createdBy' : IDL.Principal,
    'isActive' : IDL.Bool,
    'valueType' : PortfolioValueType,
    'percentage' : IDL.Float64,
  });
  const PortfolioCircuitBreakerLog = IDL.Record({
    'id' : IDL.Nat,
    'portfolioData' : PortfolioTriggerData,
    'timestamp' : IDL.Int,
    'pausedTokens' : IDL.Vec(IDL.Principal),
    'triggeredCondition' : PortfolioCircuitBreakerCondition__1,
  });
  const TokenSnapshot = IDL.Record({
    'decimals' : IDL.Nat,
    'token' : IDL.Principal,
    'balance' : IDL.Nat,
    'priceInICP' : IDL.Nat,
    'priceInUSD' : IDL.Float64,
    'valueInICP' : IDL.Nat,
    'valueInUSD' : IDL.Float64,
    'symbol' : IDL.Text,
  });
  const SnapshotReason = IDL.Variant({
    'PreTrade' : IDL.Null,
    'PostTrade' : IDL.Null,
    'Scheduled' : IDL.Null,
    'PriceUpdate' : IDL.Null,
    'Manual' : IDL.Null,
  });
  const PortfolioSnapshot = IDL.Record({
    'totalValueICP' : IDL.Nat,
    'totalValueUSD' : IDL.Float64,
    'tokens' : IDL.Vec(TokenSnapshot),
    'snapshotReason' : SnapshotReason,
    'timestamp' : IDL.Int,
  });
  const PortfolioHistoryResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'snapshots' : IDL.Vec(PortfolioSnapshot),
  });
  const PortfolioSnapshotError = IDL.Variant({
    'SystemError' : IDL.Text,
    'NotAuthorized' : IDL.Null,
    'InvalidLimit' : IDL.Null,
  });
  const Result_8 = IDL.Variant({
    'ok' : PortfolioHistoryResponse,
    'err' : PortfolioSnapshotError,
  });
  const ChangeType = IDL.Variant({
    'CurrentToMax' : IDL.Null,
    'CurrentToMin' : IDL.Null,
    'MinToMax' : IDL.Null,
  });
  const TriggerPriceData = IDL.Record({
    'currentPrice' : IDL.Nat,
    'actualChangePercent' : IDL.Float64,
    'changeType' : ChangeType,
    'windowStartTime' : IDL.Int,
    'maxPriceInWindow' : IDL.Nat,
    'minPriceInWindow' : IDL.Nat,
  });
  const PriceDirection = IDL.Variant({ 'Up' : IDL.Null, 'Down' : IDL.Null });
  const TriggerCondition__1 = IDL.Record({
    'id' : IDL.Nat,
    'direction' : PriceDirection,
    'timeWindowNS' : IDL.Nat,
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'createdBy' : IDL.Principal,
    'isActive' : IDL.Bool,
    'percentage' : IDL.Float64,
    'applicableTokens' : IDL.Vec(IDL.Principal),
  });
  const PriceAlertLog = IDL.Record({
    'id' : IDL.Nat,
    'token' : IDL.Principal,
    'tokenSymbol' : IDL.Text,
    'timestamp' : IDL.Int,
    'priceData' : TriggerPriceData,
    'triggeredCondition' : TriggerCondition__1,
  });
  const RebalanceConfig = IDL.Record({
    'tokenSyncTimeoutNS' : IDL.Nat,
    'maxSlippageBasisPoints' : IDL.Nat,
    'shortSyncIntervalNS' : IDL.Nat,
    'rebalanceIntervalNS' : IDL.Nat,
    'maxTradesStored' : IDL.Nat,
    'maxTradeValueICP' : IDL.Nat,
    'minTradeValueICP' : IDL.Nat,
    'portfolioRebalancePeriodNS' : IDL.Nat,
    'longSyncIntervalNS' : IDL.Nat,
    'maxTradeAttemptsPerInterval' : IDL.Nat,
    'maxKongswapAttempts' : IDL.Nat,
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
  const PricePoint__1 = IDL.Record({
    'usdPrice' : IDL.Float64,
    'time' : IDL.Int,
    'icpPrice' : IDL.Nat,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(PricePoint__1))),
    'err' : IDL.Text,
  });
  const TradingPauseReason = IDL.Variant({
    'PriceAlert' : IDL.Record({
      'conditionName' : IDL.Text,
      'alertId' : IDL.Nat,
      'triggeredAt' : IDL.Int,
    }),
    'CircuitBreaker' : IDL.Record({
      'triggeredAt' : IDL.Int,
      'severity' : IDL.Text,
      'reason' : IDL.Text,
    }),
  });
  const TradingPauseRecord__1 = IDL.Record({
    'pausedAt' : IDL.Int,
    'token' : IDL.Principal,
    'tokenSymbol' : IDL.Text,
    'reason' : TradingPauseReason,
  });
  const ExchangeType = IDL.Variant({
    'KongSwap' : IDL.Null,
    'ICPSwap' : IDL.Null,
  });
  const TradeRecord = IDL.Record({
    'error' : IDL.Opt(IDL.Text),
    'amountSold' : IDL.Nat,
    'amountBought' : IDL.Nat,
    'timestamp' : IDL.Int,
    'tokenSold' : IDL.Principal,
    'success' : IDL.Bool,
    'exchange' : ExchangeType,
    'tokenBought' : IDL.Principal,
    'slippage' : IDL.Float64,
  });
  const RebalanceStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Idle' : IDL.Null,
    'Trading' : IDL.Null,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Record({
      'executedTrades' : IDL.Vec(TradeRecord),
      'metrics' : IDL.Record({
        'avgSlippage' : IDL.Float64,
        'successRate' : IDL.Float64,
        'lastUpdate' : IDL.Int,
        'totalTradesExecuted' : IDL.Nat,
        'skipBreakdown' : IDL.Record({
          'tokensFiltered' : IDL.Nat,
          'insufficientCandidates' : IDL.Nat,
          'noExecutionPath' : IDL.Nat,
          'noPairsFound' : IDL.Nat,
          'pausedTokens' : IDL.Nat,
        }),
        'skipRate' : IDL.Float64,
        'totalTradesFailed' : IDL.Nat,
        'totalTradesSkipped' : IDL.Nat,
      }),
      'rebalanceStatus' : RebalanceStatus,
      'portfolioState' : IDL.Record({
        'currentAllocations' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
        'totalValueICP' : IDL.Nat,
        'totalValueUSD' : IDL.Float64,
        'targetAllocations' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
      }),
    }),
    'err' : IDL.Text,
  });
  const TriggerCondition = IDL.Record({
    'id' : IDL.Nat,
    'direction' : PriceDirection,
    'timeWindowNS' : IDL.Nat,
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'createdBy' : IDL.Principal,
    'isActive' : IDL.Bool,
    'percentage' : IDL.Float64,
    'applicableTokens' : IDL.Vec(IDL.Principal),
  });
  const TradingPauseRecord = IDL.Record({
    'pausedAt' : IDL.Int,
    'token' : IDL.Principal,
    'tokenSymbol' : IDL.Text,
    'reason' : TradingPauseReason,
  });
  const TradingPausesResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'pausedTokens' : IDL.Vec(TradingPauseRecord),
  });
  const Subaccount = IDL.Vec(IDL.Nat8);
  const TransferRecipient = IDL.Variant({
    'principal' : IDL.Principal,
    'accountId' : IDL.Record({
      'owner' : IDL.Principal,
      'subaccount' : IDL.Opt(Subaccount),
    }),
  });
  const SyncErrorTreasury = IDL.Variant({
    'NotDAO' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Text, 'err' : SyncErrorTreasury });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Text,
    'err' : PortfolioSnapshotError,
  });
  const PortfolioCircuitBreakerUpdate = IDL.Record({
    'direction' : IDL.Opt(PortfolioDirection),
    'timeWindowNS' : IDL.Opt(IDL.Nat),
    'name' : IDL.Opt(IDL.Text),
    'isActive' : IDL.Opt(IDL.Bool),
    'valueType' : IDL.Opt(PortfolioValueType),
    'percentage' : IDL.Opt(IDL.Float64),
  });
  const UpdateConfig = IDL.Record({
    'maxPriceHistoryEntries' : IDL.Opt(IDL.Nat),
    'priceUpdateIntervalNS' : IDL.Opt(IDL.Nat),
    'tokenSyncTimeoutNS' : IDL.Opt(IDL.Nat),
    'maxSlippageBasisPoints' : IDL.Opt(IDL.Nat),
    'shortSyncIntervalNS' : IDL.Opt(IDL.Nat),
    'rebalanceIntervalNS' : IDL.Opt(IDL.Nat),
    'maxTradesStored' : IDL.Opt(IDL.Nat),
    'maxTradeValueICP' : IDL.Opt(IDL.Nat),
    'minTradeValueICP' : IDL.Opt(IDL.Nat),
    'portfolioRebalancePeriodNS' : IDL.Opt(IDL.Nat),
    'longSyncIntervalNS' : IDL.Opt(IDL.Nat),
    'maxTradeAttemptsPerInterval' : IDL.Opt(IDL.Nat),
    'maxKongswapAttempts' : IDL.Opt(IDL.Nat),
  });
  const TriggerConditionUpdate = IDL.Record({
    'direction' : IDL.Opt(PriceDirection),
    'timeWindowNS' : IDL.Opt(IDL.Nat),
    'name' : IDL.Opt(IDL.Text),
    'isActive' : IDL.Opt(IDL.Bool),
    'percentage' : IDL.Opt(IDL.Float64),
    'applicableTokens' : IDL.Opt(IDL.Vec(IDL.Principal)),
  });
  const treasury = IDL.Service({
    'addPortfolioCircuitBreakerCondition' : IDL.Func(
        [
          IDL.Text,
          PortfolioDirection__1,
          IDL.Float64,
          IDL.Nat,
          PortfolioValueType__1,
        ],
        [Result_11],
        [],
      ),
    'addTriggerCondition' : IDL.Func(
        [
          IDL.Text,
          PriceDirection__1,
          IDL.Float64,
          IDL.Nat,
          IDL.Vec(IDL.Principal),
        ],
        [Result_10],
        [],
      ),
    'admin_executeTradingCycle' : IDL.Func([], [Result_1], []),
    'admin_recoverPoolBalances' : IDL.Func([], [Result_9], []),
    'admin_syncWithDao' : IDL.Func([], [Result_9], []),
    'clearAllTradingPauses' : IDL.Func([], [Result_3], []),
    'clearLogs' : IDL.Func([], [], []),
    'clearPortfolioCircuitBreakerLogs' : IDL.Func([], [Result_2], []),
    'clearPriceAlerts' : IDL.Func([], [Result], []),
    'getCurrentAllocations' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
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
    'getPortfolioCircuitBreakerCondition' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(PortfolioCircuitBreakerCondition)],
        ['query'],
      ),
    'getPortfolioCircuitBreakerLogs' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'logs' : IDL.Vec(PortfolioCircuitBreakerLog),
            'totalCount' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getPortfolioHistory' : IDL.Func([IDL.Nat], [Result_8], ['query']),
    'getPriceAlerts' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'alerts' : IDL.Vec(PriceAlertLog),
            'totalCount' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getPriceAlertsForToken' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [IDL.Vec(PriceAlertLog)],
        ['query'],
      ),
    'getSkipMetrics' : IDL.Func(
        [],
        [
          IDL.Record({
            'skipBreakdown' : IDL.Record({
              'tokensFiltered' : IDL.Nat,
              'insufficientCandidates' : IDL.Nat,
              'noExecutionPath' : IDL.Nat,
              'noPairsFound' : IDL.Nat,
              'pausedTokens' : IDL.Nat,
            }),
            'skipRate' : IDL.Float64,
            'totalTradesSkipped' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getSystemParameters' : IDL.Func([], [RebalanceConfig], ['query']),
    'getTokenDetails' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        ['query'],
      ),
    'getTokenPriceHistory' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [Result_7],
        ['query'],
      ),
    'getTradingPauseInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(TradingPauseRecord__1)],
        ['query'],
      ),
    'getTradingStatus' : IDL.Func([], [Result_6], ['query']),
    'getTriggerCondition' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(TriggerCondition)],
        ['query'],
      ),
    'listPortfolioCircuitBreakerConditions' : IDL.Func(
        [],
        [IDL.Vec(PortfolioCircuitBreakerCondition)],
        ['query'],
      ),
    'listTradingPauses' : IDL.Func([], [TradingPausesResponse], ['query']),
    'listTriggerConditions' : IDL.Func(
        [],
        [IDL.Vec(TriggerCondition)],
        ['query'],
      ),
    'pauseTokenFromTradingManual' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [Result_3],
        [],
      ),
    'receiveTransferTasks' : IDL.Func(
        [
          IDL.Vec(
            IDL.Tuple(TransferRecipient, IDL.Nat, IDL.Principal, IDL.Nat8)
          ),
          IDL.Bool,
        ],
        [IDL.Bool, IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat64)))],
        [],
      ),
    'removePortfolioCircuitBreakerCondition' : IDL.Func(
        [IDL.Nat],
        [Result_2],
        [],
      ),
    'removeTriggerCondition' : IDL.Func([IDL.Nat], [Result], []),
    'resetRebalanceState' : IDL.Func([], [Result_1], []),
    'setPortfolioCircuitBreakerConditionActive' : IDL.Func(
        [IDL.Nat, IDL.Bool],
        [Result_2],
        [],
      ),
    'setTest' : IDL.Func([IDL.Bool], [], []),
    'setTriggerConditionActive' : IDL.Func([IDL.Nat, IDL.Bool], [Result], []),
    'startRebalancing' : IDL.Func([], [Result_1], []),
    'stopRebalancing' : IDL.Func([], [Result_1], []),
    'syncTokenDetailsFromDAO' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        [Result_5],
        [],
      ),
    'takeManualPortfolioSnapshot' : IDL.Func([], [Result_4], []),
    'unpauseTokenFromTrading' : IDL.Func([IDL.Principal], [Result_3], []),
    'updatePortfolioCircuitBreakerCondition' : IDL.Func(
        [IDL.Nat, PortfolioCircuitBreakerUpdate],
        [Result_2],
        [],
      ),
    'updateRebalanceConfig' : IDL.Func(
        [UpdateConfig, IDL.Opt(IDL.Bool)],
        [Result_1],
        [],
      ),
    'updateTriggerCondition' : IDL.Func(
        [IDL.Nat, TriggerConditionUpdate],
        [Result],
        [],
      ),
  });
  return treasury;
};
export const init = ({ IDL }) => { return []; };
