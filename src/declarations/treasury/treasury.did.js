export const idlFactory = ({ IDL }) => {
  const PortfolioDirection = IDL.Variant({
    'Up' : IDL.Null,
    'Down' : IDL.Null,
  });
  const PortfolioValueType = IDL.Variant({
    'ICP' : IDL.Null,
    'USD' : IDL.Null,
  });
  const PortfolioCircuitBreakerError = IDL.Variant({
    'InvalidTimeWindow' : IDL.Null,
    'DuplicateName' : IDL.Null,
    'SystemError' : IDL.Text,
    'InvalidParameters' : IDL.Text,
    'ConditionNotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidPercentage' : IDL.Null,
  });
  const Result_17 = IDL.Variant({
    'ok' : IDL.Nat,
    'err' : PortfolioCircuitBreakerError,
  });
  const PriceDirection = IDL.Variant({ 'Up' : IDL.Null, 'Down' : IDL.Null });
  const PriceFailsafeError = IDL.Variant({
    'InvalidTimeWindow' : IDL.Null,
    'DuplicateName' : IDL.Null,
    'SystemError' : IDL.Text,
    'ConditionNotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidPercentage' : IDL.Null,
    'InvalidTokenList' : IDL.Null,
  });
  const Result_16 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : PriceFailsafeError });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const RebalanceError = IDL.Variant({
    'LiquidityError' : IDL.Text,
    'TradeError' : IDL.Text,
    'SystemError' : IDL.Text,
    'ConfigError' : IDL.Text,
    'PriceError' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : RebalanceError });
  const ClaimsReply = IDL.Record({
    'ts' : IDL.Nat64,
    'fee' : IDL.Nat,
    'status' : IDL.Text,
    'claim_id' : IDL.Nat64,
    'desc' : IDL.Text,
    'chain' : IDL.Text,
    'canister_id' : IDL.Opt(IDL.Text),
    'to_address' : IDL.Text,
    'amount' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const Result_15 = IDL.Variant({
    'ok' : IDL.Vec(ClaimsReply),
    'err' : IDL.Text,
  });
  const TradingPauseError = IDL.Variant({
    'TokenNotPaused' : IDL.Null,
    'TokenNotFound' : IDL.Null,
    'TokenAlreadyPaused' : IDL.Null,
    'SystemError' : IDL.Text,
    'NotAuthorized' : IDL.Null,
  });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Text, 'err' : TradingPauseError });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Text,
    'err' : PortfolioCircuitBreakerError,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : PriceFailsafeError });
  const RebalanceConfigResponse = IDL.Record({
    'tokenSyncTimeoutNS' : IDL.Nat,
    'maxSlippageBasisPoints' : IDL.Nat,
    'shortSyncIntervalNS' : IDL.Nat,
    'rebalanceIntervalNS' : IDL.Nat,
    'maxTradesStored' : IDL.Nat,
    'maxTradeValueICP' : IDL.Nat,
    'minTradeValueICP' : IDL.Nat,
    'minAllocationDiffBasisPoints' : IDL.Nat,
    'portfolioRebalancePeriodNS' : IDL.Nat,
    'longSyncIntervalNS' : IDL.Nat,
    'maxTradeAttemptsPerInterval' : IDL.Nat,
    'maxKongswapAttempts' : IDL.Nat,
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
  const SkipBreakdown = IDL.Record({
    'tokensFiltered' : IDL.Nat,
    'insufficientCandidates' : IDL.Nat,
    'noExecutionPath' : IDL.Nat,
    'noPairsFound' : IDL.Nat,
    'pausedTokens' : IDL.Nat,
  });
  const RebalanceStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Idle' : IDL.Null,
    'Trading' : IDL.Null,
  });
  const EnhancedTreasuryDashboard = IDL.Record({
    'systemParameters' : RebalanceConfigResponse,
    'portfolioSnapshotStatus' : IDL.Record({
      'status' : IDL.Variant({ 'Stopped' : IDL.Null, 'Running' : IDL.Null }),
      'lastSnapshotTime' : IDL.Int,
      'intervalMinutes' : IDL.Nat,
    }),
    'longSyncTimerStatus' : IDL.Record({
      'nextScheduledTime' : IDL.Int,
      'lastRunTime' : IDL.Int,
      'intervalNS' : IDL.Nat,
      'timerId' : IDL.Nat,
      'isRunning' : IDL.Bool,
    }),
    'recentSnapshots' : IDL.Record({
      'totalCount' : IDL.Nat,
      'snapshots' : IDL.Vec(PortfolioSnapshot),
    }),
    'tradingPauses' : TradingPausesResponse,
    'tradingStatus' : IDL.Record({
      'executedTrades' : IDL.Vec(TradeRecord),
      'metrics' : IDL.Record({
        'avgSlippage' : IDL.Float64,
        'successRate' : IDL.Float64,
        'lastUpdate' : IDL.Int,
        'totalTradesExecuted' : IDL.Nat,
        'lastRebalanceAttempt' : IDL.Int,
        'skipBreakdown' : SkipBreakdown,
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
  });
  const Result_14 = IDL.Variant({
    'ok' : EnhancedTreasuryDashboard,
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
  const PortfolioCircuitBreakerLog = IDL.Record({
    'id' : IDL.Nat,
    'portfolioData' : PortfolioTriggerData,
    'timestamp' : IDL.Int,
    'pausedTokens' : IDL.Vec(IDL.Principal),
    'triggeredCondition' : PortfolioCircuitBreakerCondition,
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
  const Result_13 = IDL.Variant({
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
  const PriceAlertLog = IDL.Record({
    'id' : IDL.Nat,
    'token' : IDL.Principal,
    'tokenSymbol' : IDL.Text,
    'timestamp' : IDL.Int,
    'priceData' : TriggerPriceData,
    'triggeredCondition' : TriggerCondition,
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
  const Result_12 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(PricePoint))),
    'err' : IDL.Text,
  });
  const Result_11 = IDL.Variant({
    'ok' : IDL.Record({
      'executedTrades' : IDL.Vec(TradeRecord),
      'metrics' : IDL.Record({
        'avgSlippage' : IDL.Float64,
        'successRate' : IDL.Float64,
        'lastUpdate' : IDL.Int,
        'totalTradesExecuted' : IDL.Nat,
        'lastRebalanceAttempt' : IDL.Int,
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
  const Result_10 = IDL.Variant({
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
  const TreasuryAdminActionType = IDL.Variant({
    'StopRebalancing' : IDL.Null,
    'UpdatePortfolioCircuitBreaker' : IDL.Record({
      'newCondition' : IDL.Text,
      'conditionId' : IDL.Nat,
      'oldCondition' : IDL.Text,
    }),
    'ClearAllTradingPauses' : IDL.Null,
    'UnpauseToken' : IDL.Record({ 'token' : IDL.Principal }),
    'ExecuteTradingCycle' : IDL.Null,
    'PauseTokenManual' : IDL.Record({
      'token' : IDL.Principal,
      'pauseType' : IDL.Text,
    }),
    'CanisterStart' : IDL.Null,
    'SetPortfolioCircuitBreakerActive' : IDL.Record({
      'conditionId' : IDL.Nat,
      'isActive' : IDL.Bool,
    }),
    'StartRebalancing' : IDL.Null,
    'SetTestMode' : IDL.Record({ 'isTestMode' : IDL.Bool }),
    'ClearPortfolioCircuitBreakerLogs' : IDL.Null,
    'AddPortfolioCircuitBreaker' : IDL.Record({
      'conditionId' : IDL.Nat,
      'conditionType' : IDL.Text,
      'details' : IDL.Text,
    }),
    'UpdateTriggerCondition' : IDL.Record({
      'newCondition' : IDL.Text,
      'conditionId' : IDL.Nat,
      'oldCondition' : IDL.Text,
    }),
    'RemoveTriggerCondition' : IDL.Record({ 'conditionId' : IDL.Nat }),
    'TakeManualSnapshot' : IDL.Null,
    'UpdatePausedTokenThreshold' : IDL.Record({
      'newThreshold' : IDL.Nat,
      'oldThreshold' : IDL.Nat,
    }),
    'UpdateRebalanceConfig' : IDL.Record({
      'newConfig' : IDL.Text,
      'oldConfig' : IDL.Text,
    }),
    'StartPortfolioSnapshots' : IDL.Null,
    'UpdatePortfolioSnapshotInterval' : IDL.Record({
      'newIntervalNS' : IDL.Nat,
      'oldIntervalNS' : IDL.Nat,
    }),
    'StopPortfolioSnapshots' : IDL.Null,
    'AddTriggerCondition' : IDL.Record({
      'conditionId' : IDL.Nat,
      'conditionType' : IDL.Text,
      'details' : IDL.Text,
    }),
    'RemovePortfolioCircuitBreaker' : IDL.Record({ 'conditionId' : IDL.Nat }),
    'SetTriggerConditionActive' : IDL.Record({
      'conditionId' : IDL.Nat,
      'isActive' : IDL.Bool,
    }),
    'UpdateMaxPortfolioSnapshots' : IDL.Record({
      'oldLimit' : IDL.Nat,
      'newLimit' : IDL.Nat,
    }),
    'ResetRebalanceState' : IDL.Null,
    'ClearSystemLogs' : IDL.Null,
    'ClearPriceAlerts' : IDL.Null,
    'CanisterStop' : IDL.Null,
  });
  const TreasuryAdminActionRecord = IDL.Record({
    'id' : IDL.Nat,
    'admin' : IDL.Principal,
    'errorMessage' : IDL.Opt(IDL.Text),
    'actionType' : TreasuryAdminActionType,
    'timestamp' : IDL.Int,
    'success' : IDL.Bool,
    'reason' : IDL.Text,
  });
  const TreasuryAdminActionsSinceResponse = IDL.Record({
    'totalCount' : IDL.Nat,
    'actions' : IDL.Vec(TreasuryAdminActionRecord),
  });
  const Result_9 = IDL.Variant({
    'ok' : TreasuryAdminActionsSinceResponse,
    'err' : TradingPauseError,
  });
  const Subaccount = IDL.Vec(IDL.Nat8);
  const TransferRecipient = IDL.Variant({
    'principal' : IDL.Principal,
    'accountId' : IDL.Record({
      'owner' : IDL.Principal,
      'subaccount' : IDL.Opt(Subaccount),
    }),
  });
  const Result_8 = IDL.Variant({
    'ok' : IDL.Record({
      'icpPriceUSD' : IDL.Float64,
      'tokensRefreshed' : IDL.Nat,
      'timestamp' : IDL.Int,
    }),
    'err' : IDL.Text,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Record({
      'icpPriceUSD' : IDL.Float64,
      'tokenDetails' : IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails)),
      'tokensRefreshed' : IDL.Nat,
      'timestamp' : IDL.Int,
    }),
    'err' : IDL.Text,
  });
  const SyncErrorTreasury = IDL.Variant({
    'NotDAO' : IDL.Null,
    'UnexpectedError' : IDL.Text,
  });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Text, 'err' : SyncErrorTreasury });
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
    'minAllocationDiffBasisPoints' : IDL.Opt(IDL.Nat),
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
          PortfolioDirection,
          IDL.Float64,
          IDL.Nat,
          PortfolioValueType,
        ],
        [Result_17],
        [],
      ),
    'addTriggerCondition' : IDL.Func(
        [
          IDL.Text,
          PriceDirection,
          IDL.Float64,
          IDL.Nat,
          IDL.Vec(IDL.Principal),
        ],
        [Result_16],
        [],
      ),
    'admin_executeKongClaims' : IDL.Func([], [Result], []),
    'admin_executeTradingCycle' : IDL.Func([IDL.Opt(IDL.Text)], [Result_2], []),
    'admin_getKongClaims' : IDL.Func([], [Result_15], []),
    'admin_recoverPoolBalances' : IDL.Func([], [Result], []),
    'admin_refreshICPSwapPools' : IDL.Func([], [Result], []),
    'admin_startShortSyncTimer' : IDL.Func([], [IDL.Bool], []),
    'admin_syncToDao' : IDL.Func([], [Result], []),
    'admin_syncWithDao' : IDL.Func([], [Result], []),
    'admin_syncWithDaoNoPull' : IDL.Func([], [Result], []),
    'clearAllTradingPauses' : IDL.Func([IDL.Opt(IDL.Text)], [Result_5], []),
    'clearLogs' : IDL.Func([], [], []),
    'clearPortfolioCircuitBreakerLogs' : IDL.Func([], [Result_3], []),
    'clearPriceAlerts' : IDL.Func([], [Result_1], []),
    'getCurrentAllocations' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
        ['query'],
      ),
    'getEnhancedTreasuryDashboard' : IDL.Func([], [Result_14], ['query']),
    'getICPSwapPoolInfo' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [
          IDL.Opt(
            IDL.Record({
              'fee' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'canisterId' : IDL.Principal,
            })
          ),
        ],
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
    'getLongSyncTimerStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'nextScheduledTime' : IDL.Int,
            'lastRunTime' : IDL.Int,
            'intervalNS' : IDL.Nat,
            'timerId' : IDL.Nat,
            'isRunning' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getMaxPortfolioSnapshots' : IDL.Func([], [IDL.Nat], ['query']),
    'getMaxPriceHistoryEntries' : IDL.Func([], [IDL.Nat], ['query']),
    'getPausedTokenThresholdForCircuitBreaker' : IDL.Func(
        [],
        [IDL.Nat],
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
    'getPortfolioHistory' : IDL.Func([IDL.Nat], [Result_13], ['query']),
    'getPortfolioHistorySince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_13],
        ['query'],
      ),
    'getPortfolioSnapshotStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'status' : IDL.Variant({
              'Stopped' : IDL.Null,
              'Running' : IDL.Null,
            }),
            'lastSnapshotTime' : IDL.Int,
            'intervalMinutes' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
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
    'getSystemParameters' : IDL.Func([], [RebalanceConfigResponse], ['query']),
    'getTokenDetails' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        ['query'],
      ),
    'getTokenDetailsCache' : IDL.Func(
        [],
        [
          IDL.Record({
            'icpPriceUSD' : IDL.Float64,
            'tokenDetails' : IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails)),
            'timestamp' : IDL.Int,
            'tradingPauses' : IDL.Vec(TradingPauseRecord),
          }),
        ],
        [],
      ),
    'getTokenDetailsSince' : IDL.Func(
        [IDL.Int],
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        ['query'],
      ),
    'getTokenPriceHistory' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [Result_12],
        ['query'],
      ),
    'getTradingPauseInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(TradingPauseRecord)],
        ['query'],
      ),
    'getTradingStatus' : IDL.Func([], [Result_11], ['query']),
    'getTradingStatusSince' : IDL.Func([IDL.Int], [Result_10], ['query']),
    'getTreasuryAdminActionsSince' : IDL.Func(
        [IDL.Int, IDL.Nat],
        [Result_9],
        ['query'],
      ),
    'getTriggerCondition' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(TriggerCondition)],
        ['query'],
      ),
    'get_canister_cycles' : IDL.Func(
        [],
        [IDL.Record({ 'cycles' : IDL.Nat })],
        ['query'],
      ),
    'listICPSwapPools' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'fee' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'canisterId' : IDL.Principal,
            })
          ),
        ],
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
        [Result_5],
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
    'refreshAllPrices' : IDL.Func([], [Result_8], []),
    'refreshPricesAndGetDetails' : IDL.Func([], [Result_7], []),
    'removePortfolioCircuitBreakerCondition' : IDL.Func(
        [IDL.Nat],
        [Result_3],
        [],
      ),
    'removeTriggerCondition' : IDL.Func([IDL.Nat], [Result_1], []),
    'resetRebalanceState' : IDL.Func([IDL.Opt(IDL.Text)], [Result_2], []),
    'sendToken' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Principal, IDL.Opt(Subaccount)],
        [],
        [],
      ),
    'setPortfolioCircuitBreakerConditionActive' : IDL.Func(
        [IDL.Nat, IDL.Bool],
        [Result_3],
        [],
      ),
    'setTriggerConditionActive' : IDL.Func([IDL.Nat, IDL.Bool], [Result_1], []),
    'startPortfolioSnapshots' : IDL.Func([IDL.Opt(IDL.Text)], [Result], []),
    'startRebalancing' : IDL.Func([IDL.Opt(IDL.Text)], [Result_2], []),
    'stopPortfolioSnapshots' : IDL.Func([IDL.Opt(IDL.Text)], [Result], []),
    'stopRebalancing' : IDL.Func([IDL.Opt(IDL.Text)], [Result_2], []),
    'syncTokenDetailsFromDAO' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Principal, TokenDetails))],
        [Result_6],
        [],
      ),
    'takeManualPortfolioSnapshot' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [Result_4],
        [],
      ),
    'unpauseTokenFromTrading' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Text)],
        [Result_5],
        [],
      ),
    'updateMaxPortfolioSnapshots' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text)],
        [Result_4],
        [],
      ),
    'updatePausedTokenThresholdForCircuitBreaker' : IDL.Func(
        [IDL.Nat],
        [Result_3],
        [],
      ),
    'updatePortfolioCircuitBreakerCondition' : IDL.Func(
        [IDL.Nat, PortfolioCircuitBreakerUpdate],
        [Result_3],
        [],
      ),
    'updatePortfolioSnapshotInterval' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text)],
        [Result],
        [],
      ),
    'updateRebalanceConfig' : IDL.Func(
        [UpdateConfig, IDL.Opt(IDL.Bool), IDL.Opt(IDL.Text)],
        [Result_2],
        [],
      ),
    'updateTriggerCondition' : IDL.Func(
        [IDL.Nat, TriggerConditionUpdate],
        [Result_1],
        [],
      ),
    'withdrawAllCyclesToSelf' : IDL.Func([], [Result], []),
  });
  return treasury;
};
export const init = ({ IDL }) => { return []; };
