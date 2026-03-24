export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const NachosClaimResult = IDL.Variant({
    'BelowMinimum' : IDL.Record({ 'balance' : IDL.Nat, 'minimum' : IDL.Nat }),
    'AlreadyProcessing' : IDL.Null,
    'NoDeposit' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'Success' : IDL.Record({
      'mintId' : IDL.Nat,
      'orderId' : IDL.Nat,
      'nachosAmount' : IDL.Nat,
    }),
    'SystemPaused' : IDL.Null,
    'RateLimited' : IDL.Null,
    'MintFailed' : IDL.Text,
  });
  const ClaimResult = IDL.Variant({
    'BelowMinimum' : IDL.Record({ 'balance' : IDL.Nat, 'minimum' : IDL.Nat }),
    'AlreadyProcessing' : IDL.Null,
    'NoDeposit' : IDL.Null,
    'SwapFailed' : IDL.Text,
    'NotAuthorized' : IDL.Null,
    'Success' : IDL.Record({
      'tacoAmount' : IDL.Nat,
      'txId' : IDL.Nat,
      'orderId' : IDL.Nat,
    }),
    'SystemPaused' : IDL.Null,
    'RateLimited' : IDL.Null,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Principal, 'err' : IDL.Text });
  const SwapStep = IDL.Variant({
    'Failed' : IDL.Null,
    'TransferringToWallet' : IDL.Null,
    'GettingQuote' : IDL.Null,
    'Complete' : IDL.Null,
    'DepositReceived' : IDL.Null,
    'SwappingTokens' : IDL.Null,
    'TransferringToPool' : IDL.Null,
    'WaitingForDeposit' : IDL.Null,
    'NotStarted' : IDL.Null,
  });
  const SwapProgress = IDL.Record({
    'startedAt' : IDL.Int,
    'errorMessage' : IDL.Opt(IDL.Text),
    'step' : SwapStep,
    'txId' : IDL.Opt(IDL.Nat),
    'description' : IDL.Text,
    'orderId' : IDL.Opt(IDL.Nat),
    'updatedAt' : IDL.Int,
    'retryCount' : IDL.Nat,
    'totalSteps' : IDL.Nat,
    'actualTaco' : IDL.Opt(IDL.Nat),
    'stepNumber' : IDL.Nat,
    'estimatedTaco' : IDL.Opt(IDL.Nat),
    'icpAmount' : IDL.Opt(IDL.Nat),
  });
  const SwapStats = IDL.Record({
    'totalSwapsCompleted' : IDL.Nat,
    'pendingSwapsCount' : IDL.Nat,
    'poolConfigured' : IDL.Bool,
    'systemPaused' : IDL.Bool,
    'completedOrdersCount' : IDL.Nat,
    'totalICPSwapped' : IDL.Nat,
    'totalTACODelivered' : IDL.Nat,
  });
  const ClaimPath = IDL.Variant({
    'TimerSweep' : IDL.Null,
    'ManualClaim' : IDL.Null,
    'FrontendClaim' : IDL.Null,
    'WebhookClaim' : IDL.Null,
    'CoinbaseWebhook' : IDL.Null,
  });
  const OrderRecord = IDL.Record({
    'id' : IDL.Nat,
    'transakOrderId' : IDL.Opt(IDL.Text),
    'principal' : IDL.Principal,
    'tacoReceived' : IDL.Nat,
    'tacoTxId' : IDL.Opt(IDL.Nat),
    'claimPath' : ClaimPath,
    'icpDeposited' : IDL.Nat,
    'timestamp' : IDL.Int,
    'fiatAmount' : IDL.Opt(IDL.Text),
    'fiatCurrency' : IDL.Opt(IDL.Text),
    'poolId' : IDL.Principal,
    'slippage' : IDL.Float64,
  });
  const NachosOrderRecord = IDL.Record({
    'id' : IDL.Nat,
    'principal' : IDL.Principal,
    'nachosMintId' : IDL.Opt(IDL.Nat),
    'feeICP' : IDL.Nat,
    'claimPath' : ClaimPath,
    'icpDeposited' : IDL.Nat,
    'timestamp' : IDL.Int,
    'fiatAmount' : IDL.Opt(IDL.Text),
    'nachosReceived' : IDL.Nat,
    'navUsed' : IDL.Nat,
    'fiatCurrency' : IDL.Opt(IDL.Text),
  });
  const NachosSwapStep = IDL.Variant({
    'Failed' : IDL.Null,
    'Complete' : IDL.Null,
    'DepositReceived' : IDL.Null,
    'MintingNachos' : IDL.Null,
    'TransferringToTreasury' : IDL.Null,
    'NotStarted' : IDL.Null,
  });
  const NachosSwapProgress = IDL.Record({
    'startedAt' : IDL.Int,
    'estimatedNachos' : IDL.Opt(IDL.Nat),
    'errorMessage' : IDL.Opt(IDL.Text),
    'step' : NachosSwapStep,
    'mintId' : IDL.Opt(IDL.Nat),
    'description' : IDL.Text,
    'orderId' : IDL.Opt(IDL.Nat),
    'updatedAt' : IDL.Int,
    'retryCount' : IDL.Nat,
    'totalSteps' : IDL.Nat,
    'stepNumber' : IDL.Nat,
    'actualNachos' : IDL.Opt(IDL.Nat),
    'icpAmount' : IDL.Opt(IDL.Nat),
  });
  const SwapDashboard = IDL.Record({
    'hasActiveLock' : IDL.Bool,
    'nachosStats' : IDL.Record({
      'nachosMintingEnabled' : IDL.Bool,
      'nachosPendingCount' : IDL.Nat,
      'totalNachosMints' : IDL.Nat,
      'totalNachosICPDeposited' : IDL.Nat,
      'nachosOrdersCount' : IDL.Nat,
      'totalNachosDelivered' : IDL.Nat,
    }),
    'nachosDepositSubaccount' : IDL.Vec(IDL.Nat8),
    'tacoDepositSubaccount' : IDL.Vec(IDL.Nat8),
    'hasPendingNachos' : IDL.Bool,
    'tacoStatus' : SwapProgress,
    'depositAddress' : IDL.Text,
    'stats' : SwapStats,
    'recentTacoOrders' : IDL.Vec(OrderRecord),
    'nachosDepositAddress' : IDL.Text,
    'hasPendingTaco' : IDL.Bool,
    'config' : IDL.Record({
      'minDepositICP' : IDL.Nat,
      'maxSlippageBasisPoints' : IDL.Nat,
      'maxRetries' : IDL.Nat,
      'icpTacoPoolId' : IDL.Opt(IDL.Principal),
      'tacoLedgerFee' : IDL.Nat,
      'poolZeroForOne' : IDL.Bool,
      'systemPaused' : IDL.Bool,
      'sweepIntervalNS' : IDL.Int,
    }),
    'recentNachosOrders' : IDL.Vec(NachosOrderRecord),
    'nachosStatus' : NachosSwapProgress,
  });
  const AdminAction = IDL.Variant({
    'Pause' : IDL.Null,
    'DiscoverPool' : IDL.Null,
    'Unpause' : IDL.Null,
    'UpdateConfig' : IDL.Null,
    'RecoverFunds' : IDL.Null,
    'RetryPending' : IDL.Null,
    'SetPoolId' : IDL.Null,
  });
  const AdminActionRecord = IDL.Record({
    'action' : AdminAction,
    'timestamp' : IDL.Int,
    'details' : IDL.Text,
    'caller' : IDL.Principal,
    'success' : IDL.Bool,
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
  const NachosSwapStage = IDL.Variant({
    'TransferredToTreasury' : IDL.Nat,
    'MintRequested' : IDL.Nat,
    'AwaitingDeposit' : IDL.Nat,
  });
  const NachosPendingSwap = IDL.Record({
    'principal' : IDL.Principal,
    'blockNumber' : IDL.Opt(IDL.Nat),
    'createdAt' : IDL.Int,
    'errorMessage' : IDL.Opt(IDL.Text),
    'attempts' : IDL.Nat,
    'stage' : NachosSwapStage,
    'icpAmount' : IDL.Nat,
    'lastAttempt' : IDL.Int,
  });
  const NachosQuoteResult = IDL.Variant({
    'Ok' : IDL.Record({
      'estimatedNachos' : IDL.Nat,
      'feeEstimate' : IDL.Nat,
      'navUsed' : IDL.Nat,
    }),
    'Err' : IDL.Text,
  });
  const SwapStage = IDL.Variant({
    'SwapCompleted' : IDL.Nat,
    'WithdrawnToSubaccount' : IDL.Nat,
    'TransferredToPool' : IDL.Nat,
    'DepositRegistered' : IDL.Nat,
    'AwaitingDeposit' : IDL.Nat,
  });
  const PendingSwap = IDL.Record({
    'principal' : IDL.Principal,
    'createdAt' : IDL.Int,
    'errorMessage' : IDL.Opt(IDL.Text),
    'attempts' : IDL.Nat,
    'stage' : SwapStage,
    'icpAmount' : IDL.Nat,
    'lastAttempt' : IDL.Int,
  });
  const QuoteResult = IDL.Variant({
    'Ok' : IDL.Record({
      'icpFee' : IDL.Nat,
      'estimatedTaco' : IDL.Nat,
      'tacoFee' : IDL.Nat,
      'slippage' : IDL.Float64,
    }),
    'Err' : IDL.Text,
  });
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'upgrade' : IDL.Opt(IDL.Bool),
    'status_code' : IDL.Nat16,
  });
  const SwapConfig = IDL.Record({
    'minDepositICP' : IDL.Opt(IDL.Nat),
    'maxSlippageBasisPoints' : IDL.Opt(IDL.Nat),
    'maxRetries' : IDL.Opt(IDL.Nat),
    'systemPaused' : IDL.Opt(IDL.Bool),
    'sweepIntervalNS' : IDL.Opt(IDL.Int),
  });
  const TacoSwapDAO = IDL.Service({
    'admin_clear_nachos_pending' : IDL.Func([IDL.Principal], [Result], []),
    'admin_clear_pending' : IDL.Func([IDL.Principal], [Result], []),
    'admin_transfer_icp' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Vec(IDL.Nat8)), IDL.Nat],
        [Result_1],
        [],
      ),
    'admin_transfer_taco' : IDL.Func([IDL.Principal, IDL.Nat], [Result_1], []),
    'claim_nachos' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [NachosClaimResult],
        [],
      ),
    'claim_taco' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [ClaimResult],
        [],
      ),
    'discover_pool' : IDL.Func([], [Result_2], []),
    'getSwapDashboard' : IDL.Func([], [SwapDashboard], ['query']),
    'get_admin_actions' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(AdminActionRecord)],
        ['query'],
      ),
    'get_all_nachos_swap_progress' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, NachosSwapProgress))],
        ['query'],
      ),
    'get_all_swap_progress' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, SwapProgress))],
        ['query'],
      ),
    'get_canister_cycles' : IDL.Func([], [IDL.Nat], ['query']),
    'get_config' : IDL.Func(
        [],
        [
          IDL.Record({
            'minDepositICP' : IDL.Nat,
            'maxSlippageBasisPoints' : IDL.Nat,
            'maxRetries' : IDL.Nat,
            'icpTacoPoolId' : IDL.Opt(IDL.Principal),
            'tacoLedgerFee' : IDL.Nat,
            'poolZeroForOne' : IDL.Bool,
            'systemPaused' : IDL.Bool,
            'sweepIntervalNS' : IDL.Int,
          }),
        ],
        ['query'],
      ),
    'get_deposit_address' : IDL.Func([], [IDL.Text], ['query']),
    'get_deposit_address_for' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Text],
        [],
      ),
    'get_full_swap_state' : IDL.Func(
        [],
        [
          IDL.Record({
            'hasActiveLock' : IDL.Bool,
            'nachosDepositSubaccount' : IDL.Vec(IDL.Nat8),
            'tacoDepositSubaccount' : IDL.Vec(IDL.Nat8),
            'hasPendingNachos' : IDL.Bool,
            'tacoStatus' : SwapProgress,
            'hasPendingTaco' : IDL.Bool,
            'nachosStatus' : NachosSwapProgress,
          }),
        ],
        ['query'],
      ),
    'get_logs' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Vec(LogEntry)],
        [],
      ),
    'get_my_nachos_orders' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(NachosOrderRecord)],
        ['query'],
      ),
    'get_my_orders' : IDL.Func([IDL.Nat], [IDL.Vec(OrderRecord)], ['query']),
    'get_nachos_deposit_address_for' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Text],
        [],
      ),
    'get_nachos_order_history' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(NachosOrderRecord)],
        ['query'],
      ),
    'get_nachos_pending_swaps' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, NachosPendingSwap))],
        ['query'],
      ),
    'get_nachos_quote' : IDL.Func([IDL.Nat], [NachosQuoteResult], []),
    'get_nachos_stats' : IDL.Func(
        [],
        [
          IDL.Record({
            'nachosMintingEnabled' : IDL.Bool,
            'nachosPendingCount' : IDL.Nat,
            'totalNachosMints' : IDL.Nat,
            'totalNachosICPDeposited' : IDL.Nat,
            'nachosOrdersCount' : IDL.Nat,
            'totalNachosDelivered' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'get_nachos_swap_status' : IDL.Func([], [NachosSwapProgress], ['query']),
    'get_order_history' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(OrderRecord)],
        ['query'],
      ),
    'get_pending_balance' : IDL.Func([], [IDL.Nat], []),
    'get_pending_nachos_balance' : IDL.Func([], [IDL.Nat], []),
    'get_pending_swaps' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, PendingSwap))],
        ['query'],
      ),
    'get_processed_coinbase_orders' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        ['query'],
      ),
    'get_processed_transak_orders' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        ['query'],
      ),
    'get_stats' : IDL.Func([], [SwapStats], ['query']),
    'get_swap_status' : IDL.Func([], [SwapProgress], ['query']),
    'get_taco_quote' : IDL.Func([IDL.Nat], [QuoteResult], []),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'http_request_update' : IDL.Func([HttpRequest], [HttpResponse], []),
    'pause' : IDL.Func([IDL.Text], [Result], []),
    'recover_icpswap_balances' : IDL.Func([], [Result], []),
    'recover_stuck_funds' : IDL.Func([IDL.Principal], [Result_1], []),
    'refund_nachos_pending' : IDL.Func([IDL.Principal], [Result_1], []),
    'refund_pending' : IDL.Func([IDL.Principal], [Result_1], []),
    'register_payment' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [
          IDL.Variant({
            'Ok' : IDL.Null,
            'AlreadyProcessing' : IDL.Null,
            'NotAuthorized' : IDL.Null,
          }),
        ],
        [],
      ),
    'retry_pending_swaps' : IDL.Func([], [Result_1], []),
    'set_nachos_minting_enabled' : IDL.Func([IDL.Bool], [Result], []),
    'set_pool_id' : IDL.Func([IDL.Principal, IDL.Bool], [Result], []),
    'unpause' : IDL.Func([IDL.Text], [Result], []),
    'update_config' : IDL.Func([SwapConfig], [Result], []),
  });
  return TacoSwapDAO;
};
export const init = ({ IDL }) => { return []; };
