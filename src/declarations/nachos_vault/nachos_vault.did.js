export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const CircuitBreakerAction = IDL.Variant({
    'RejectOperation' : IDL.Null,
    'PauseBoth' : IDL.Null,
    'PauseBurn' : IDL.Null,
    'PauseMint' : IDL.Null,
  });
  const CircuitBreakerConditionType = IDL.Variant({
    'DecimalChange' : IDL.Null,
    'BalanceChange' : IDL.Null,
    'TokenPaused' : IDL.Null,
    'NavDrop' : IDL.Null,
    'PriceChange' : IDL.Null,
  });
  const CircuitBreakerConditionInput = IDL.Record({
    'direction' : IDL.Variant({
      'Up' : IDL.Null,
      'Both' : IDL.Null,
      'Down' : IDL.Null,
    }),
    'action' : CircuitBreakerAction,
    'timeWindowNS' : IDL.Nat,
    'conditionType' : CircuitBreakerConditionType,
    'enabled' : IDL.Bool,
    'thresholdPercent' : IDL.Float64,
    'applicableTokens' : IDL.Vec(IDL.Principal),
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const NachosError = IDL.Variant({
    'PriceStale' : IDL.Null,
    'DepositAlreadyConsumed' : IDL.Null,
    'MintingDisabled' : IDL.Null,
    'DepositNotFound' : IDL.Null,
    'TransferError' : IDL.Text,
    'InvalidPrice' : IDL.Null,
    'MintLimitExceeded' : IDL.Record({
      'requested' : IDL.Nat,
      'recentMints' : IDL.Nat,
      'maxPer4Hours' : IDL.Nat,
    }),
    'BlockAlreadyProcessed' : IDL.Null,
    'TokenNotActive' : IDL.Null,
    'GenesisNotComplete' : IDL.Null,
    'AboveMaximumValue' : IDL.Record({
      'max' : IDL.Nat,
      'requested' : IDL.Nat,
    }),
    'PortfolioTokenPaused' : IDL.Record({
      'pausedTokens' : IDL.Vec(
        IDL.Record({ 'token' : IDL.Principal, 'symbol' : IDL.Text })
      ),
    }),
    'UserBurnLimitExceeded' : IDL.Record({
      'requested' : IDL.Nat,
      'maxPer4Hours' : IDL.Nat,
      'recentBurns' : IDL.Nat,
    }),
    'BurningDisabled' : IDL.Null,
    'InsufficientBalance' : IDL.Null,
    'TokenPaused' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'BelowMinimumValue' : IDL.Null,
    'CircuitBreakerActive' : IDL.Null,
    'SystemPaused' : IDL.Null,
    'UnexpectedError' : IDL.Text,
    'BlockVerificationFailed' : IDL.Text,
    'DepositExpired' : IDL.Null,
    'RateLimitExceeded' : IDL.Null,
    'GenesisAlreadyDone' : IDL.Null,
    'PortfolioShareMismatch' : IDL.Record({
      'expected' : IDL.Vec(
        IDL.Record({ 'token' : IDL.Principal, 'basisPoints' : IDL.Nat })
      ),
      'received' : IDL.Vec(
        IDL.Record({ 'token' : IDL.Principal, 'basisPoints' : IDL.Nat })
      ),
    }),
    'BurnLimitExceeded' : IDL.Record({
      'requested' : IDL.Nat,
      'maxPer4Hours' : IDL.Nat,
      'recentBurns' : IDL.Nat,
    }),
    'NotDepositor' : IDL.Null,
    'InsufficientLiquidity' : IDL.Record({
      'token' : IDL.Principal,
      'requested' : IDL.Nat,
      'available' : IDL.Nat,
    }),
    'InvalidAllocation' : IDL.Null,
    'DepositAlreadyCancelled' : IDL.Null,
    'AllocationExceeded' : IDL.Null,
    'RollbackFailed' : IDL.Text,
    'SlippageExceeded' : IDL.Null,
    'UserMintLimitExceeded' : IDL.Record({
      'requested' : IDL.Nat,
      'recentMints' : IDL.Nat,
      'maxPer4Hours' : IDL.Nat,
    }),
    'TokenNotAccepted' : IDL.Null,
    'OperationInProgress' : IDL.Null,
  });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Record({ 'refundTaskId' : IDL.Nat }),
    'err' : NachosError,
  });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Record({
      'tokenPriceICP' : IDL.Nat,
      'depositValueICP' : IDL.Nat,
      'nachosEstimate' : IDL.Nat,
      'excessAmount' : IDL.Nat,
      'usedAmount' : IDL.Nat,
      'feeEstimate' : IDL.Nat,
      'excessValueICP' : IDL.Nat,
      'allocation' : IDL.Record({
        'wouldExceed' : IDL.Bool,
        'afterDepositBasisPoints' : IDL.Nat,
        'currentBasisPoints' : IDL.Nat,
        'maxAcceptableAmount' : IDL.Nat,
        'targetBasisPoints' : IDL.Nat,
      }),
      'navUsed' : IDL.Nat,
      'pendingMintValueICP' : IDL.Nat,
      'usedValueICP' : IDL.Nat,
    }),
    'err' : NachosError,
  });
  const MintMode = IDL.Variant({
    'ICP' : IDL.Null,
    'PortfolioShare' : IDL.Null,
    'SingleToken' : IDL.Null,
  });
  const TokenDeposit = IDL.Record({
    'token' : IDL.Principal,
    'priceUsed' : IDL.Nat,
    'amount' : IDL.Nat,
    'valueICP' : IDL.Nat,
  });
  const MintResult = IDL.Record({
    'totalDepositValueICP' : IDL.Nat,
    'feeValueICP' : IDL.Nat,
    'mintId' : IDL.Nat,
    'mintMode' : MintMode,
    'netValueICP' : IDL.Nat,
    'excessReturned' : IDL.Vec(TokenDeposit),
    'nachosLedgerTxId' : IDL.Opt(IDL.Nat),
    'success' : IDL.Bool,
    'nachosReceived' : IDL.Nat,
    'deposits' : IDL.Vec(TokenDeposit),
    'navUsed' : IDL.Nat,
  });
  const Result_3 = IDL.Variant({ 'ok' : MintResult, 'err' : NachosError });
  const AcceptedTokenConfig = IDL.Record({
    'enabled' : IDL.Bool,
    'addedAt' : IDL.Int,
    'addedBy' : IDL.Principal,
  });
  const CachedNAV = IDL.Record({
    'nachosSupply' : IDL.Nat,
    'navPerTokenE8s' : IDL.Nat,
    'timestamp' : IDL.Int,
    'portfolioValueICP' : IDL.Nat,
  });
  const CircuitBreakerCondition = IDL.Record({
    'id' : IDL.Nat,
    'direction' : IDL.Variant({
      'Up' : IDL.Null,
      'Both' : IDL.Null,
      'Down' : IDL.Null,
    }),
    'action' : CircuitBreakerAction,
    'timeWindowNS' : IDL.Nat,
    'createdAt' : IDL.Int,
    'createdBy' : IDL.Principal,
    'conditionType' : CircuitBreakerConditionType,
    'enabled' : IDL.Bool,
    'thresholdPercent' : IDL.Float64,
    'applicableTokens' : IDL.Vec(IDL.Principal),
  });
  const CircuitBreakerAlert = IDL.Record({
    'id' : IDL.Nat,
    'token' : IDL.Opt(IDL.Principal),
    'conditionId' : IDL.Nat,
    'conditionType' : CircuitBreakerConditionType,
    'tokenSymbol' : IDL.Text,
    'timestamp' : IDL.Int,
    'details' : IDL.Text,
    'actionTaken' : CircuitBreakerAction,
  });
  const FeeExemptConfig = IDL.Record({
    'enabled' : IDL.Bool,
    'addedAt' : IDL.Int,
    'addedBy' : IDL.Principal,
    'reason' : IDL.Text,
  });
  const TransferStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Sent' : IDL.Null,
    'Confirmed' : IDL.Nat64,
    'Pending' : IDL.Null,
  });
  const TransferOperationType = IDL.Variant({
    'MintReturn' : IDL.Null,
    'ExcessReturn' : IDL.Null,
    'BurnPayout' : IDL.Null,
    'Recovery' : IDL.Null,
    'ForwardToPortfolio' : IDL.Null,
    'CancelReturn' : IDL.Null,
  });
  const TransferRecipient = IDL.Variant({
    'principal' : IDL.Principal,
    'accountId' : IDL.Record({
      'owner' : IDL.Principal,
      'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    }),
  });
  const VaultTransferTask = IDL.Record({
    'id' : IDL.Nat,
    'status' : TransferStatus,
    'tokenPrincipal' : IDL.Principal,
    'fromSubaccount' : IDL.Nat8,
    'createdAt' : IDL.Int,
    'operationType' : TransferOperationType,
    'recipient' : TransferRecipient,
    'updatedAt' : IDL.Int,
    'retryCount' : IDL.Nat,
    'operationId' : IDL.Nat,
    'blockIndex' : IDL.Opt(IDL.Nat64),
    'caller' : IDL.Principal,
    'amount' : IDL.Nat,
    'actualAmountSent' : IDL.Opt(IDL.Nat),
  });
  const TokenTransferResult = IDL.Record({
    'token' : IDL.Principal,
    'txId' : IDL.Opt(IDL.Nat),
    'amount' : IDL.Nat,
  });
  const BurnRecord = IDL.Record({
    'id' : IDL.Nat,
    'partialFailure' : IDL.Bool,
    'feeValueICP' : IDL.Nat,
    'redemptionValueICP' : IDL.Nat,
    'netValueICP' : IDL.Nat,
    'timestamp' : IDL.Int,
    'nachosBurned' : IDL.Nat,
    'nachosLedgerTxId' : IDL.Opt(IDL.Nat),
    'caller' : IDL.Principal,
    'navUsed' : IDL.Nat,
    'tokensReceived' : IDL.Vec(TokenTransferResult),
    'skippedDustTokens' : IDL.Vec(IDL.Principal),
  });
  const DepositStatus = IDL.Variant({
    'Consumed' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Processing' : IDL.Null,
    'Verified' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const ActiveDeposit = IDL.Record({
    'status' : DepositStatus,
    'blockKey' : IDL.Text,
    'tokenPrincipal' : IDL.Principal,
    'blockNumber' : IDL.Nat,
    'cancellationTxId' : IDL.Opt(IDL.Nat64),
    'timestamp' : IDL.Int,
    'caller' : IDL.Principal,
    'amount' : IDL.Nat,
    'mintBurnId' : IDL.Opt(IDL.Nat),
  });
  const FeeRecord = IDL.Record({
    'feeAmountICP' : IDL.Nat,
    'feeType' : IDL.Variant({ 'Burn' : IDL.Null, 'Mint' : IDL.Null }),
    'operationId' : IDL.Nat,
    'userPrincipal' : IDL.Principal,
    'timestamp' : IDL.Int,
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
  const MintRecord = IDL.Record({
    'id' : IDL.Nat,
    'totalDepositValueICP' : IDL.Nat,
    'feeValueICP' : IDL.Nat,
    'mintMode' : MintMode,
    'netValueICP' : IDL.Nat,
    'timestamp' : IDL.Int,
    'excessReturned' : IDL.Vec(TokenDeposit),
    'nachosLedgerTxId' : IDL.Opt(IDL.Nat),
    'caller' : IDL.Principal,
    'nachosReceived' : IDL.Nat,
    'deposits' : IDL.Vec(TokenDeposit),
    'navUsed' : IDL.Nat,
  });
  const NavSnapshotReason = IDL.Variant({
    'Burn' : IDL.Null,
    'Mint' : IDL.Null,
    'Scheduled' : IDL.Null,
    'Manual' : IDL.Null,
  });
  const NavSnapshot = IDL.Record({
    'nachosSupply' : IDL.Nat,
    'navPerTokenE8s' : IDL.Nat,
    'timestamp' : IDL.Int,
    'reason' : NavSnapshotReason,
    'portfolioValueICP' : IDL.Nat,
  });
  const FailedTokenTransfer = IDL.Record({
    'token' : IDL.Principal,
    'error' : IDL.Text,
    'requestedAmount' : IDL.Nat,
  });
  const BurnResult = IDL.Record({
    'partialFailure' : IDL.Bool,
    'feeValueICP' : IDL.Nat,
    'redemptionValueICP' : IDL.Nat,
    'failedTokens' : IDL.Vec(FailedTokenTransfer),
    'netValueICP' : IDL.Nat,
    'nachosBurned' : IDL.Nat,
    'nachosLedgerTxId' : IDL.Opt(IDL.Nat),
    'success' : IDL.Bool,
    'navUsed' : IDL.Nat,
    'burnId' : IDL.Nat,
    'tokensReceived' : IDL.Vec(TokenTransferResult),
    'skippedDustTokens' : IDL.Vec(IDL.Principal),
  });
  const Result_2 = IDL.Variant({ 'ok' : BurnResult, 'err' : NachosError });
  const NachosUpdateConfig = IDL.Record({
    'maxMintICPWorthPer4Hours' : IDL.Opt(IDL.Nat),
    'minBurnValueICP' : IDL.Opt(IDL.Nat),
    'portfolioShareMaxDeviationBP' : IDL.Opt(IDL.Nat),
    'maxBurnNachosPerUser4Hours' : IDL.Opt(IDL.Nat),
    'cancellationFeeMultiplier' : IDL.Opt(IDL.Nat),
    'maxSlippageBasisPoints' : IDL.Opt(IDL.Nat),
    'maxMintOpsPerUser4Hours' : IDL.Opt(IDL.Nat),
    'maxMintAmountICP' : IDL.Opt(IDL.Nat),
    'maxBurnOpsPerUser4Hours' : IDL.Opt(IDL.Nat),
    'burnFeeBasisPoints' : IDL.Opt(IDL.Nat),
    'mintFeeBasisPoints' : IDL.Opt(IDL.Nat),
    'navDropThresholdPercent' : IDL.Opt(IDL.Float64),
    'navDropTimeWindowNS' : IDL.Opt(IDL.Nat),
    'PRICE_HISTORY_WINDOW' : IDL.Opt(IDL.Int),
    'maxNachosBurnPer4Hours' : IDL.Opt(IDL.Nat),
    'maxBurnAmountNachos' : IDL.Opt(IDL.Nat),
    'MAX_PRICE_STALENESS_NS' : IDL.Opt(IDL.Int),
    'maxMintICPPerUser4Hours' : IDL.Opt(IDL.Nat),
    'burningEnabled' : IDL.Opt(IDL.Bool),
    'minMintValueICP' : IDL.Opt(IDL.Nat),
    'mintingEnabled' : IDL.Opt(IDL.Bool),
  });
  const NachosVaultDAO = IDL.Service({
    'addAcceptedMintToken' : IDL.Func([IDL.Principal], [Result], []),
    'addCircuitBreakerCondition' : IDL.Func(
        [CircuitBreakerConditionInput],
        [Result_1],
        [],
      ),
    'addFeeExemptPrincipal' : IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    'addRateLimitExemptPrincipal' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [Result],
        [],
      ),
    'cancelDeposit' : IDL.Func([IDL.Principal, IDL.Nat], [Result_5], []),
    'claimBurnFees' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'claimCancellationFees' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Nat],
        [Result],
        [],
      ),
    'claimMintFees' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'emergencyPause' : IDL.Func([], [Result], []),
    'emergencyUnpause' : IDL.Func([], [Result], []),
    'enableCircuitBreakerCondition' : IDL.Func(
        [IDL.Nat, IDL.Bool],
        [Result],
        [],
      ),
    'estimateBurnTokens' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Record({
            'redemptionValueICP' : IDL.Nat,
            'tokens' : IDL.Vec(
              IDL.Record({
                'decimals' : IDL.Nat,
                'token' : IDL.Principal,
                'tokenFee' : IDL.Nat,
                'isDust' : IDL.Bool,
                'priceICP' : IDL.Nat,
                'amount' : IDL.Nat,
                'valueICP' : IDL.Nat,
                'symbol' : IDL.Text,
              })
            ),
            'netValueICP' : IDL.Nat,
            'feeEstimate' : IDL.Nat,
            'nachosAmount' : IDL.Nat,
            'navUsed' : IDL.Nat,
            'portfolioValueICP' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'estimateMintICP' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Record({
            'nachosEstimate' : IDL.Nat,
            'feeEstimate' : IDL.Nat,
            'navUsed' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'estimateMintWithToken' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [Result_4],
        ['query'],
      ),
    'estimateRedeem' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Record({
            'redemptionValueICP' : IDL.Nat,
            'netValueICP' : IDL.Nat,
            'feeEstimate' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'genesisMint' : IDL.Func([IDL.Nat], [Result_3], []),
    'getAcceptedMintTokens' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, AcceptedTokenConfig))],
        ['query'],
      ),
    'getActiveDepositsCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getAdminDashboard' : IDL.Func(
        [],
        [
          IDL.Record({
            'nav' : IDL.Opt(CachedNAV),
            'totalBurnVolumeICP' : IDL.Nat,
            'portfolio' : IDL.Vec(
              IDL.Record({
                'decimals' : IDL.Nat,
                'token' : IDL.Principal,
                'balance' : IDL.Nat,
                'currentBasisPoints' : IDL.Nat,
                'priceICP' : IDL.Nat,
                'priceUSD' : IDL.Float64,
                'valueICP' : IDL.Nat,
                'symbol' : IDL.Text,
                'targetBasisPoints' : IDL.Nat,
              })
            ),
            'totalBurnCount' : IDL.Nat,
            'claimableBurnFees' : IDL.Record({
              'claimed' : IDL.Nat,
              'claimable' : IDL.Nat,
              'accumulated' : IDL.Nat,
            }),
            'dataSource' : IDL.Text,
            'activeDepositCount' : IDL.Nat,
            'mintPausedByCircuitBreaker' : IDL.Bool,
            'minBurnValueICP' : IDL.Nat,
            'circuitBreakerConditions' : IDL.Vec(CircuitBreakerCondition),
            'totalMintCount' : IDL.Nat,
            'hasPausedTokens' : IDL.Bool,
            'mintsByMode' : IDL.Record({
              'icp' : IDL.Nat,
              'portfolioShare' : IDL.Nat,
              'singleToken' : IDL.Nat,
            }),
            'acceptedTokens' : IDL.Vec(
              IDL.Tuple(IDL.Principal, AcceptedTokenConfig)
            ),
            'globalBurnIn4h' : IDL.Nat,
            'maxBurnPer4h' : IDL.Nat,
            'circuitBreakerActive' : IDL.Bool,
            'totalMintVolumeICP' : IDL.Nat,
            'nachosLedger' : IDL.Opt(IDL.Principal),
            'totalFeesCollectedICP' : IDL.Nat,
            'maxMintPer4h' : IDL.Nat,
            'feeCount' : IDL.Nat,
            'burnFeeBasisPoints' : IDL.Nat,
            'nachosSupply' : IDL.Nat,
            'claimableMintFees' : IDL.Record({
              'claimed' : IDL.Nat,
              'claimable' : IDL.Nat,
              'accumulated' : IDL.Nat,
            }),
            'mintFeeBasisPoints' : IDL.Nat,
            'claimableCancellationFees' : IDL.Vec(
              IDL.Record({
                'token' : IDL.Principal,
                'claimed' : IDL.Nat,
                'claimable' : IDL.Nat,
                'accumulated' : IDL.Nat,
              })
            ),
            'mintFeesICP' : IDL.Nat,
            'genesisComplete' : IDL.Bool,
            'totalBurnVolumeNACHOS' : IDL.Nat,
            'recentAlerts' : IDL.Vec(CircuitBreakerAlert),
            'canisterCycles' : IDL.Nat,
            'globalMintIn4h' : IDL.Nat,
            'fullConfig' : IDL.Record({
              'maxMintICPWorthPer4Hours' : IDL.Nat,
              'portfolioShareMaxDeviationBP' : IDL.Nat,
              'maxBurnNachosPerUser4Hours' : IDL.Nat,
              'cancellationFeeMultiplier' : IDL.Nat,
              'maxSlippageBasisPoints' : IDL.Nat,
              'maxMintOpsPerUser4Hours' : IDL.Nat,
              'maxMintAmountICP' : IDL.Nat,
              'maxBurnOpsPerUser4Hours' : IDL.Nat,
              'navDropThresholdPercent' : IDL.Float64,
              'maxNachosBurnPer4Hours' : IDL.Nat,
              'maxBurnAmountNachos' : IDL.Nat,
              'maxMintICPPerUser4Hours' : IDL.Nat,
            }),
            'dataTimestamp' : IDL.Int,
            'burnPausedByCircuitBreaker' : IDL.Bool,
            'feeExemptPrincipals' : IDL.Vec(
              IDL.Tuple(IDL.Principal, FeeExemptConfig)
            ),
            'transferQueue' : IDL.Record({
              'tasks' : IDL.Vec(VaultTransferTask),
              'pending' : IDL.Nat,
              'completed' : IDL.Nat,
              'exhausted' : IDL.Nat,
            }),
            'pausedTokens' : IDL.Vec(
              IDL.Record({ 'token' : IDL.Principal, 'symbol' : IDL.Text })
            ),
            'systemPaused' : IDL.Bool,
            'burningEnabled' : IDL.Bool,
            'minMintValueICP' : IDL.Nat,
            'navChangePercent' : IDL.Opt(IDL.Float64),
            'pendingTransferCount' : IDL.Nat,
            'burnFeesICP' : IDL.Nat,
            'mintingEnabled' : IDL.Bool,
            'rateLimitExemptPrincipals' : IDL.Vec(
              IDL.Tuple(IDL.Principal, FeeExemptConfig)
            ),
            'portfolioValueICP' : IDL.Nat,
          }),
        ],
        ['composite_query'],
      ),
    'getBurnHistory' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(BurnRecord)],
        ['query'],
      ),
    'getCircuitBreakerAlerts' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(CircuitBreakerAlert)],
        ['query'],
      ),
    'getCircuitBreakerConditions' : IDL.Func(
        [],
        [IDL.Vec(CircuitBreakerCondition)],
        ['query'],
      ),
    'getClaimableBurnFees' : IDL.Func(
        [],
        [
          IDL.Record({
            'claimed' : IDL.Nat,
            'claimable' : IDL.Nat,
            'accumulated' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getClaimableCancellationFees' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'token' : IDL.Principal,
              'claimed' : IDL.Nat,
              'claimable' : IDL.Nat,
              'accumulated' : IDL.Nat,
            })
          ),
        ],
        ['query'],
      ),
    'getClaimableMintFees' : IDL.Func(
        [],
        [
          IDL.Record({
            'claimed' : IDL.Nat,
            'claimable' : IDL.Nat,
            'accumulated' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getConfig' : IDL.Func(
        [],
        [
          IDL.Record({
            'maxMintICPWorthPer4Hours' : IDL.Nat,
            'minBurnValueICP' : IDL.Nat,
            'portfolioShareMaxDeviationBP' : IDL.Nat,
            'maxBurnNachosPerUser4Hours' : IDL.Nat,
            'cancellationFeeMultiplier' : IDL.Nat,
            'maxSlippageBasisPoints' : IDL.Nat,
            'maxMintOpsPerUser4Hours' : IDL.Nat,
            'maxMintAmountICP' : IDL.Nat,
            'maxBurnOpsPerUser4Hours' : IDL.Nat,
            'burnFeeBasisPoints' : IDL.Nat,
            'mintFeeBasisPoints' : IDL.Nat,
            'navDropThresholdPercent' : IDL.Float64,
            'maxNachosBurnPer4Hours' : IDL.Nat,
            'maxBurnAmountNachos' : IDL.Nat,
            'maxMintICPPerUser4Hours' : IDL.Nat,
            'minMintValueICP' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getDeposit' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [IDL.Opt(ActiveDeposit)],
        ['query'],
      ),
    'getFeeExemptPrincipals' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, FeeExemptConfig))],
        ['query'],
      ),
    'getFeeHistory' : IDL.Func([IDL.Nat], [IDL.Vec(FeeRecord)], ['query']),
    'getGlobalRateLimitStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalBurnAmountIn4h' : IDL.Nat,
            'totalMintValueIn4h' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getMintHistory' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(MintRecord)],
        ['query'],
      ),
    'getNAV' : IDL.Func([], [IDL.Opt(CachedNAV)], ['query']),
    'getNAVHistory' : IDL.Func([IDL.Nat], [IDL.Vec(NavSnapshot)], ['query']),
    'getNAVHistoryAdaptive' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'navPerTokenE8s' : IDL.Nat,
              'timestamp' : IDL.Int,
              'reason' : NavSnapshotReason,
            })
          ),
        ],
        ['query'],
      ),
    'getPortfolioBreakdown' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'token' : IDL.Principal,
              'balance' : IDL.Nat,
              'basisPoints' : IDL.Nat,
              'priceICP' : IDL.Nat,
              'valueICP' : IDL.Nat,
              'symbol' : IDL.Text,
            })
          ),
        ],
        ['query'],
      ),
    'getRateLimitExemptPrincipals' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, FeeExemptConfig))],
        ['query'],
      ),
    'getRequiredPortfolioShares' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Record({
            'nachosEstimate' : IDL.Nat,
            'tokens' : IDL.Vec(
              IDL.Record({
                'decimals' : IDL.Nat,
                'token' : IDL.Principal,
                'tokenFee' : IDL.Nat,
                'basisPoints' : IDL.Nat,
                'requiredAmount' : IDL.Nat,
                'priceICP' : IDL.Nat,
                'valueICP' : IDL.Nat,
                'symbol' : IDL.Text,
              })
            ),
            'feeEstimate' : IDL.Nat,
            'navUsed' : IDL.Nat,
            'portfolioValueICP' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getSystemStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalMints' : IDL.Nat,
            'activeDepositCount' : IDL.Nat,
            'mintPausedByCircuitBreaker' : IDL.Bool,
            'hasPausedTokens' : IDL.Bool,
            'cachedNAV' : IDL.Opt(CachedNAV),
            'circuitBreakerActive' : IDL.Bool,
            'nachosLedger' : IDL.Opt(IDL.Principal),
            'genesisComplete' : IDL.Bool,
            'burnPausedByCircuitBreaker' : IDL.Bool,
            'totalBurns' : IDL.Nat,
            'pausedTokens' : IDL.Vec(
              IDL.Record({ 'token' : IDL.Principal, 'symbol' : IDL.Text })
            ),
            'systemPaused' : IDL.Bool,
            'burningEnabled' : IDL.Bool,
            'pendingTransferCount' : IDL.Nat,
            'mintingEnabled' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getTransferQueueStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'tasks' : IDL.Vec(VaultTransferTask),
            'pending' : IDL.Nat,
            'completed' : IDL.Nat,
            'exhausted' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getUserActivity' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'rateLimits' : IDL.Record({
              'maxBurnOps' : IDL.Nat,
              'maxBurnNachosPerUser4Hours' : IDL.Nat,
              'mintOpsIn4h' : IDL.Nat,
              'mintValueIn4h' : IDL.Nat,
              'maxMintOps' : IDL.Nat,
              'burnOpsIn4h' : IDL.Nat,
              'maxMintICPPerUser4Hours' : IDL.Nat,
              'burnValueIn4h' : IDL.Nat,
            }),
            'mints' : IDL.Vec(MintRecord),
            'totalMints' : IDL.Nat,
            'transfers' : IDL.Vec(
              IDL.Record({
                'id' : IDL.Nat,
                'status' : TransferStatus,
                'tokenPrincipal' : IDL.Principal,
                'createdAt' : IDL.Int,
                'operationType' : TransferOperationType,
                'updatedAt' : IDL.Int,
                'operationId' : IDL.Nat,
                'blockIndex' : IDL.Opt(IDL.Nat64),
                'amount' : IDL.Nat,
              })
            ),
            'userTotalMintVolumeICP' : IDL.Nat,
            'recentTransactions' : IDL.Vec(
              IDL.Record({
                'id' : IDL.Nat,
                'feeICP' : IDL.Nat,
                'mintMode' : IDL.Opt(MintMode),
                'timestamp' : IDL.Int,
                'nachosAmount' : IDL.Nat,
                'txType' : IDL.Variant({
                  'Burn' : IDL.Null,
                  'Mint' : IDL.Null,
                }),
                'valueICP' : IDL.Nat,
              })
            ),
            'userTotalFeesICP' : IDL.Nat,
            'burns' : IDL.Vec(BurnRecord),
            'totalBurns' : IDL.Nat,
            'activeDeposits' : IDL.Vec(ActiveDeposit),
            'userTotalBurnVolumeICP' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getUserBurnHistory' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(BurnRecord)],
        ['query'],
      ),
    'getUserDeposits' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(ActiveDeposit)],
        ['query'],
      ),
    'getUserMintHistory' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(MintRecord)],
        ['query'],
      ),
    'getUserRateLimitStatus' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Record({
            'mintOpsIn4h' : IDL.Nat,
            'mintValueIn4h' : IDL.Nat,
            'burnOpsIn4h' : IDL.Nat,
            'burnValueIn4h' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getUserTransferTasks' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Nat,
              'status' : TransferStatus,
              'tokenPrincipal' : IDL.Principal,
              'createdAt' : IDL.Int,
              'operationType' : TransferOperationType,
              'updatedAt' : IDL.Int,
              'operationId' : IDL.Nat,
              'blockIndex' : IDL.Opt(IDL.Nat64),
              'amount' : IDL.Nat,
            })
          ),
        ],
        ['query'],
      ),
    'getVaultAnalytics' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalBurnVolumeICP' : IDL.Nat,
            'totalBurnCount' : IDL.Nat,
            'totalMintCount' : IDL.Nat,
            'mintsByMode' : IDL.Record({
              'icp' : IDL.Nat,
              'portfolioShare' : IDL.Nat,
              'singleToken' : IDL.Nat,
            }),
            'globalBurnIn4h' : IDL.Nat,
            'maxBurnPer4h' : IDL.Nat,
            'totalMintVolumeICP' : IDL.Nat,
            'totalFeesCollectedICP' : IDL.Nat,
            'maxMintPer4h' : IDL.Nat,
            'feeCount' : IDL.Nat,
            'nachosSupply' : IDL.Nat,
            'initialNAVPerToken' : IDL.Nat,
            'mintFeesICP' : IDL.Nat,
            'totalBurnVolumeNACHOS' : IDL.Nat,
            'globalMintIn4h' : IDL.Nat,
            'currentNAV' : IDL.Opt(CachedNAV),
            'navChangePercent' : IDL.Opt(IDL.Float64),
            'burnFeesICP' : IDL.Nat,
            'portfolioValueICP' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getVaultDashboard' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [
          IDL.Record({
            'nav' : IDL.Opt(CachedNAV),
            'totalBurnVolumeICP' : IDL.Nat,
            'portfolio' : IDL.Vec(
              IDL.Record({
                'decimals' : IDL.Nat,
                'token' : IDL.Principal,
                'balance' : IDL.Nat,
                'currentBasisPoints' : IDL.Nat,
                'priceICP' : IDL.Nat,
                'priceUSD' : IDL.Float64,
                'valueICP' : IDL.Nat,
                'symbol' : IDL.Text,
                'targetBasisPoints' : IDL.Nat,
              })
            ),
            'totalBurnCount' : IDL.Nat,
            'dataSource' : IDL.Text,
            'mintPausedByCircuitBreaker' : IDL.Bool,
            'minBurnValueICP' : IDL.Nat,
            'totalMintCount' : IDL.Nat,
            'hasPausedTokens' : IDL.Bool,
            'mintsByMode' : IDL.Record({
              'icp' : IDL.Nat,
              'portfolioShare' : IDL.Nat,
              'singleToken' : IDL.Nat,
            }),
            'mintEstimate' : IDL.Opt(
              IDL.Record({
                'nachosEstimate' : IDL.Nat,
                'feeEstimate' : IDL.Nat,
                'navUsed' : IDL.Nat,
              })
            ),
            'acceptedTokens' : IDL.Vec(
              IDL.Tuple(IDL.Principal, AcceptedTokenConfig)
            ),
            'globalBurnIn4h' : IDL.Nat,
            'maxBurnPer4h' : IDL.Nat,
            'circuitBreakerActive' : IDL.Bool,
            'totalMintVolumeICP' : IDL.Nat,
            'totalFeesCollectedICP' : IDL.Nat,
            'maxMintPer4h' : IDL.Nat,
            'feeCount' : IDL.Nat,
            'burnFeeBasisPoints' : IDL.Nat,
            'nachosSupply' : IDL.Nat,
            'mintFeeBasisPoints' : IDL.Nat,
            'mintFeesICP' : IDL.Nat,
            'genesisComplete' : IDL.Bool,
            'burnEstimate' : IDL.Opt(
              IDL.Record({
                'redemptionValueICP' : IDL.Nat,
                'netValueICP' : IDL.Nat,
                'feeEstimate' : IDL.Nat,
              })
            ),
            'totalBurnVolumeNACHOS' : IDL.Nat,
            'globalMintIn4h' : IDL.Nat,
            'dataTimestamp' : IDL.Int,
            'burnPausedByCircuitBreaker' : IDL.Bool,
            'pausedTokens' : IDL.Vec(
              IDL.Record({ 'token' : IDL.Principal, 'symbol' : IDL.Text })
            ),
            'systemPaused' : IDL.Bool,
            'burningEnabled' : IDL.Bool,
            'minMintValueICP' : IDL.Nat,
            'navChangePercent' : IDL.Opt(IDL.Float64),
            'burnFeesICP' : IDL.Nat,
            'mintingEnabled' : IDL.Bool,
            'portfolioValueICP' : IDL.Nat,
          }),
        ],
        ['composite_query'],
      ),
    'get_canister_cycles' : IDL.Func([], [IDL.Nat], ['query']),
    'mintNachos' : IDL.Func([IDL.Nat, IDL.Nat], [Result_3], []),
    'mintNachosWithPortfolioShare' : IDL.Func(
        [
          IDL.Vec(
            IDL.Record({ 'token' : IDL.Principal, 'blockNumber' : IDL.Nat })
          ),
          IDL.Nat,
        ],
        [Result_3],
        [],
      ),
    'mintNachosWithToken' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Nat],
        [Result_3],
        [],
      ),
    'pauseBurning' : IDL.Func([], [Result], []),
    'pauseMinting' : IDL.Func([], [Result], []),
    'recoverStuckNachos' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'recoverWronglySentTokens' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Principal],
        [Result],
        [],
      ),
    'redeemNachos' : IDL.Func(
        [
          IDL.Nat,
          IDL.Opt(
            IDL.Vec(
              IDL.Record({ 'token' : IDL.Principal, 'minAmount' : IDL.Nat })
            )
          ),
        ],
        [Result_2],
        [],
      ),
    'refreshICPSwapPools' : IDL.Func([], [Result], []),
    'removeAcceptedMintToken' : IDL.Func([IDL.Principal], [Result], []),
    'removeCircuitBreakerCondition' : IDL.Func([IDL.Nat], [Result], []),
    'removeFeeExemptPrincipal' : IDL.Func([IDL.Principal], [Result], []),
    'removeRateLimitExemptPrincipal' : IDL.Func([IDL.Principal], [Result], []),
    'resetCircuitBreaker' : IDL.Func([], [Result], []),
    'retryFailedTransfers' : IDL.Func([], [Result_1], []),
    'setAcceptedMintTokenEnabled' : IDL.Func(
        [IDL.Principal, IDL.Bool],
        [Result],
        [],
      ),
    'setNachosLedgerPrincipal' : IDL.Func([IDL.Principal], [Result], []),
    'testRefreshPrices' : IDL.Func([], [Result], []),
    'unpauseBurning' : IDL.Func([], [Result], []),
    'unpauseMinting' : IDL.Func([], [Result], []),
    'updateCancellationFeeMultiplier' : IDL.Func([IDL.Nat], [Result], []),
    'updateCircuitBreakerCondition' : IDL.Func(
        [
          IDL.Nat,
          IDL.Opt(IDL.Float64),
          IDL.Opt(IDL.Nat),
          IDL.Opt(
            IDL.Variant({
              'Up' : IDL.Null,
              'Both' : IDL.Null,
              'Down' : IDL.Null,
            })
          ),
          IDL.Opt(CircuitBreakerAction),
          IDL.Opt(IDL.Vec(IDL.Principal)),
        ],
        [Result],
        [],
      ),
    'updateFees' : IDL.Func([IDL.Nat, IDL.Nat], [Result], []),
    'updateNachosConfig' : IDL.Func([NachosUpdateConfig], [Result], []),
  });
  return NachosVaultDAO;
};
export const init = ({ IDL }) => { return []; };
