export const idlFactory = ({ IDL }) => {
  const ExchangeError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'PoolNotFound' : IDL.Text,
    'SystemError' : IDL.Text,
    'OrderNotFound' : IDL.Text,
    'TokenPaused' : IDL.Text,
    'NotAuthorized' : IDL.Null,
    'RouteFailed' : IDL.Record({ 'hop' : IDL.Nat, 'reason' : IDL.Text }),
    'Banned' : IDL.Null,
    'ExchangeFrozen' : IDL.Null,
    'TransferFailed' : IDL.Text,
    'SlippageExceeded' : IDL.Record({ 'got' : IDL.Nat, 'expected' : IDL.Nat }),
    'TokenNotAccepted' : IDL.Text,
    'InsufficientFunds' : IDL.Text,
  });
  const ActionResult = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : ExchangeError });
  const TradeData = IDL.Record({
    'decimals' : IDL.Nat,
    'transferFee' : IDL.Nat,
    'amountSell' : IDL.Nat,
    'ICPPrice' : IDL.Nat,
    'block' : IDL.Nat64,
    'amountBuy' : IDL.Nat,
    'identifier' : IDL.Text,
  });
  const ProcessedTrade = IDL.Record({
    'amountSold' : IDL.Nat,
    'amountBought' : IDL.Nat,
    'identifier' : IDL.Text,
  });
  const BatchProcessResult = IDL.Record({
    'accesscodes' : IDL.Vec(
      IDL.Record({
        'fee' : IDL.Nat,
        'accesscode' : IDL.Text,
        'amountInit' : IDL.Nat,
        'amountSell' : IDL.Nat,
        'revokeFee' : IDL.Nat,
        'poolId' : IDL.Tuple(IDL.Text, IDL.Text),
      })
    ),
    'execMessage' : IDL.Text,
    'processedTrades' : IDL.Vec(ProcessedTrade),
  });
  const AddConcentratedOk = IDL.Record({
    'priceLower' : IDL.Nat,
    'priceUpper' : IDL.Nat,
    'liquidity' : IDL.Nat,
    'amount0Used' : IDL.Nat,
    'positionId' : IDL.Nat,
    'token0' : IDL.Text,
    'token1' : IDL.Text,
    'refund0' : IDL.Nat,
    'refund1' : IDL.Nat,
    'amount1Used' : IDL.Nat,
  });
  const AddConcentratedResult = IDL.Variant({
    'Ok' : AddConcentratedOk,
    'Err' : ExchangeError,
  });
  const AddLiquidityOk = IDL.Record({
    'liquidityMinted' : IDL.Nat,
    'amount0Used' : IDL.Nat,
    'token0' : IDL.Text,
    'token1' : IDL.Text,
    'refund0' : IDL.Nat,
    'refund1' : IDL.Nat,
    'amount1Used' : IDL.Nat,
  });
  const AddLiquidityResult = IDL.Variant({
    'Ok' : AddLiquidityOk,
    'Err' : ExchangeError,
  });
  const OrderOk = IDL.Record({
    'buyAmountReceived' : IDL.Nat,
    'tokenIn' : IDL.Text,
    'tokenOut' : IDL.Text,
    'accessCode' : IDL.Text,
    'amountIn' : IDL.Nat,
    'filled' : IDL.Nat,
    'remaining' : IDL.Nat,
    'isPublic' : IDL.Bool,
    'swapId' : IDL.Opt(IDL.Nat),
  });
  const OrderResult = IDL.Variant({ 'Ok' : OrderOk, 'Err' : ExchangeError });
  const HopDetail = IDL.Record({
    'fee' : IDL.Nat,
    'tokenIn' : IDL.Text,
    'tokenOut' : IDL.Text,
    'priceImpact' : IDL.Float64,
    'amountIn' : IDL.Nat,
    'amountOut' : IDL.Nat,
  });
  const SwapHop = IDL.Record({ 'tokenIn' : IDL.Text, 'tokenOut' : IDL.Text });
  const SwapOk = IDL.Record({
    'fee' : IDL.Nat,
    'tokenIn' : IDL.Text,
    'tokenOut' : IDL.Text,
    'hops' : IDL.Nat,
    'firstHopOrderbookMatch' : IDL.Bool,
    'amountIn' : IDL.Nat,
    'amountOut' : IDL.Nat,
    'swapId' : IDL.Nat,
    'route' : IDL.Vec(IDL.Text),
    'lastHopAMMOnly' : IDL.Bool,
  });
  const SwapResult = IDL.Variant({ 'Ok' : SwapOk, 'Err' : ExchangeError });
  const ClaimFeesOk = IDL.Record({
    'transferred0' : IDL.Nat,
    'transferred1' : IDL.Nat,
    'dust1ToDAO' : IDL.Nat,
    'dust0ToDAO' : IDL.Nat,
    'fees0' : IDL.Nat,
    'fees1' : IDL.Nat,
  });
  const ClaimFeesResult = IDL.Variant({
    'Ok' : ClaimFeesOk,
    'Err' : ExchangeError,
  });
  const pool = IDL.Record({
    'asset_minimum_amount' : IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Nat)),
    'price_day_before' : IDL.Vec(IDL.Float64),
    'volume_24h' : IDL.Vec(IDL.Nat),
    'amm_reserve0' : IDL.Vec(IDL.Nat),
    'amm_reserve1' : IDL.Vec(IDL.Nat),
    'asset_transferfees' : IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Nat)),
    'asset_symbols' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'last_traded_price' : IDL.Vec(IDL.Float64),
    'pool_canister' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'asset_names' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'asset_decimals' : IDL.Vec(IDL.Tuple(IDL.Nat8, IDL.Nat8)),
  });
  const TokenInfo = IDL.Record({
    'decimals' : IDL.Nat,
    'asset_type' : IDL.Variant({
      'ICP' : IDL.Null,
      'ICRC3' : IDL.Null,
      'ICRC12' : IDL.Null,
    }),
    'transfer_fee' : IDL.Nat,
    'name' : IDL.Text,
    'minimum_amount' : IDL.Nat,
    'address' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const TradePrivate = IDL.Record({
    'Fee' : IDL.Nat,
    'trade_number' : IDL.Nat,
    'allOrNothing' : IDL.Bool,
    'token_init_identifier' : IDL.Text,
    'seller_paid2' : IDL.Nat,
    'time' : IDL.Int,
    'trade_done' : IDL.Nat,
    'strictlyOTC' : IDL.Bool,
    'SellerPrincipal' : IDL.Text,
    'OCname' : IDL.Text,
    'init_paid' : IDL.Nat,
    'amount_init' : IDL.Nat,
    'init_paid2' : IDL.Nat,
    'initPrincipal' : IDL.Text,
    'RevokeFee' : IDL.Nat,
    'amount_sell' : IDL.Nat,
    'seller_paid' : IDL.Nat,
    'filledInit' : IDL.Nat,
    'token_sell_identifier' : IDL.Text,
    'filledSell' : IDL.Nat,
  });
  const Ratio = IDL.Variant({
    'Max' : IDL.Null,
    'Zero' : IDL.Null,
    'Value' : IDL.Nat,
  });
  const PoolQuery = IDL.Record({
    'forwardCursor' : IDL.Opt(Ratio),
    'pool' : IDL.Tuple(IDL.Text, IDL.Text),
    'backwardCursor' : IDL.Opt(Ratio),
  });
  const PoolLiquidity = IDL.Record({
    'backward' : IDL.Vec(
      IDL.Tuple(
        Ratio,
        IDL.Vec(
          IDL.Record({
            'Fee' : IDL.Nat,
            'allOrNothing' : IDL.Bool,
            'token_init_identifier' : IDL.Text,
            'time' : IDL.Int,
            'strictlyOTC' : IDL.Bool,
            'accesscode' : IDL.Text,
            'OCname' : IDL.Text,
            'amount_init' : IDL.Nat,
            'initPrincipal' : IDL.Text,
            'RevokeFee' : IDL.Nat,
            'amount_sell' : IDL.Nat,
            'token_sell_identifier' : IDL.Text,
          })
        ),
      )
    ),
    'forward' : IDL.Vec(
      IDL.Tuple(
        Ratio,
        IDL.Vec(
          IDL.Record({
            'Fee' : IDL.Nat,
            'allOrNothing' : IDL.Bool,
            'token_init_identifier' : IDL.Text,
            'time' : IDL.Int,
            'strictlyOTC' : IDL.Bool,
            'accesscode' : IDL.Text,
            'OCname' : IDL.Text,
            'amount_init' : IDL.Nat,
            'initPrincipal' : IDL.Text,
            'RevokeFee' : IDL.Nat,
            'amount_sell' : IDL.Nat,
            'token_sell_identifier' : IDL.Text,
          })
        ),
      )
    ),
  });
  const ForeignPoolLiquidity = IDL.Record({
    'forwardCursor' : Ratio,
    'pool' : IDL.Tuple(IDL.Text, IDL.Text),
    'liquidity' : PoolLiquidity,
    'backwardCursor' : Ratio,
  });
  const ForeignPoolsResponse = IDL.Record({
    'nextPoolCursor' : IDL.Opt(PoolQuery),
    'pools' : IDL.Vec(ForeignPoolLiquidity),
  });
  const TimeFrame = IDL.Variant({
    'day' : IDL.Null,
    'fourHours' : IDL.Null,
    'hour' : IDL.Null,
    'week' : IDL.Null,
    'fivemin' : IDL.Null,
  });
  const KlineData = IDL.Record({
    'low' : IDL.Float64,
    'high' : IDL.Float64,
    'close' : IDL.Float64,
    'open' : IDL.Float64,
    'volume' : IDL.Nat,
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
  const Time = IDL.Int;
  const PoolDailySnapshot = IDL.Record({
    'totalLiquidity' : IDL.Nat,
    'reserve0' : IDL.Nat,
    'reserve1' : IDL.Nat,
    'volume' : IDL.Nat,
    'activeLiquidity' : IDL.Nat,
    'timestamp' : IDL.Int,
  });
  const TradePosition = IDL.Record({
    'Fee' : IDL.Nat,
    'trade_number' : IDL.Nat,
    'allOrNothing' : IDL.Bool,
    'token_init_identifier' : IDL.Text,
    'time' : IDL.Int,
    'trade_done' : IDL.Nat,
    'strictlyOTC' : IDL.Bool,
    'OCname' : IDL.Text,
    'amount_init' : IDL.Nat,
    'initPrincipal' : IDL.Text,
    'amount_sell' : IDL.Nat,
    'filledInit' : IDL.Nat,
    'token_sell_identifier' : IDL.Text,
    'filledSell' : IDL.Nat,
  });
  const ConcentratedPositionDetailed = IDL.Record({
    'ratioUpper' : IDL.Nat,
    'lastFeeGrowth0' : IDL.Nat,
    'lastFeeGrowth1' : IDL.Nat,
    'fee0' : IDL.Nat,
    'fee1' : IDL.Nat,
    'liquidity' : IDL.Nat,
    'positionId' : IDL.Nat,
    'lastUpdateTime' : IDL.Int,
    'token0' : IDL.Text,
    'token1' : IDL.Text,
    'token0Amount' : IDL.Nat,
    'token1Amount' : IDL.Nat,
    'ratioLower' : IDL.Nat,
  });
  const DetailedLiquidityPosition = IDL.Record({
    'ratioUpper' : IDL.Opt(IDL.Nat),
    'fee0' : IDL.Nat,
    'fee1' : IDL.Nat,
    'liquidity' : IDL.Nat,
    'shareOfPool' : IDL.Float64,
    'positionType' : IDL.Variant({
      'concentrated' : IDL.Null,
      'fullRange' : IDL.Null,
    }),
    'positionId' : IDL.Opt(IDL.Nat),
    'token0' : IDL.Text,
    'token1' : IDL.Text,
    'token0Amount' : IDL.Nat,
    'token1Amount' : IDL.Nat,
    'ratioLower' : IDL.Opt(IDL.Nat),
  });
  const SwapRecord = IDL.Record({
    'fee' : IDL.Nat,
    'tokenIn' : IDL.Text,
    'tokenOut' : IDL.Text,
    'amountIn' : IDL.Nat,
    'swapType' : IDL.Variant({
      'otc' : IDL.Null,
      'limit' : IDL.Null,
      'multihop' : IDL.Null,
      'direct' : IDL.Null,
    }),
    'timestamp' : IDL.Int,
    'amountOut' : IDL.Nat,
    'swapId' : IDL.Nat,
    'route' : IDL.Vec(IDL.Text),
  });
  const TradePrivate2 = IDL.Record({
    'Fee' : IDL.Nat,
    'trade_number' : IDL.Nat,
    'allOrNothing' : IDL.Bool,
    'token_init_identifier' : IDL.Text,
    'seller_paid2' : IDL.Nat,
    'time' : IDL.Int,
    'trade_done' : IDL.Nat,
    'strictlyOTC' : IDL.Bool,
    'accesscode' : IDL.Text,
    'SellerPrincipal' : IDL.Text,
    'OCname' : IDL.Text,
    'init_paid' : IDL.Nat,
    'amount_init' : IDL.Nat,
    'init_paid2' : IDL.Nat,
    'initPrincipal' : IDL.Text,
    'RevokeFee' : IDL.Nat,
    'amount_sell' : IDL.Nat,
    'seller_paid' : IDL.Nat,
    'filledInit' : IDL.Nat,
    'token_sell_identifier' : IDL.Text,
    'filledSell' : IDL.Nat,
  });
  const PositionData = IDL.Record({
    'decimals' : IDL.Tuple(IDL.Nat, IDL.Nat),
    'accesscode' : IDL.Text,
    'ICPprice' : IDL.Tuple(IDL.Nat, IDL.Nat),
  });
  const RecalibratedPosition = IDL.Record({
    'fee' : IDL.Nat,
    'accesscode' : IDL.Text,
    'amountInit' : IDL.Nat,
    'amountSell' : IDL.Nat,
    'revokeFee' : IDL.Nat,
    'poolId' : IDL.Tuple(IDL.Text, IDL.Text),
  });
  const RecoveryInput = IDL.Record({
    'tType' : IDL.Variant({
      'ICP' : IDL.Null,
      'ICRC3' : IDL.Null,
      'ICRC12' : IDL.Null,
    }),
    'block' : IDL.Nat,
    'identifier' : IDL.Text,
  });
  const RecoveryResult = IDL.Record({
    'error' : IDL.Text,
    'block' : IDL.Nat,
    'success' : IDL.Bool,
    'identifier' : IDL.Text,
  });
  const RemoveConcentratedOk = IDL.Record({
    'liquidityRemaining' : IDL.Nat,
    'liquidityRemoved' : IDL.Nat,
    'amount0' : IDL.Nat,
    'amount1' : IDL.Nat,
    'fees0' : IDL.Nat,
    'fees1' : IDL.Nat,
  });
  const RemoveConcentratedResult = IDL.Variant({
    'Ok' : RemoveConcentratedOk,
    'Err' : ExchangeError,
  });
  const RemoveLiquidityOk = IDL.Record({
    'amount0' : IDL.Nat,
    'amount1' : IDL.Nat,
    'liquidityBurned' : IDL.Nat,
    'fees0' : IDL.Nat,
    'fees1' : IDL.Nat,
  });
  const RemoveLiquidityResult = IDL.Variant({
    'Ok' : RemoveLiquidityOk,
    'Err' : ExchangeError,
  });
  const RevokeOk = IDL.Record({
    'accessCode' : IDL.Text,
    'revokeType' : IDL.Variant({
      'DAO' : IDL.Null,
      'Seller' : IDL.Null,
      'Initiator' : IDL.Null,
    }),
    'refunds' : IDL.Vec(IDL.Record({ 'token' : IDL.Text, 'amount' : IDL.Nat })),
  });
  const RevokeResult = IDL.Variant({ 'Ok' : RevokeOk, 'Err' : ExchangeError });
  const SplitLeg = IDL.Record({
    'amountIn' : IDL.Nat,
    'route' : IDL.Vec(SwapHop),
    'minLegOut' : IDL.Nat,
  });
  const create_trading_canister = IDL.Service({
    'ChangeReferralFees' : IDL.Func([IDL.Nat], [], []),
    'ChangeRevokefees' : IDL.Func([IDL.Nat], [], ['oneway']),
    'ChangeTradingfees' : IDL.Func([IDL.Nat], [], ['oneway']),
    'FinishSell' : IDL.Func([IDL.Nat64, IDL.Text, IDL.Nat], [ActionResult], []),
    'FinishSellBatch' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Text), IDL.Vec(IDL.Nat), IDL.Text, IDL.Text],
        [ActionResult],
        [],
      ),
    'FinishSellBatchDAO' : IDL.Func(
        [IDL.Vec(TradeData), IDL.Bool, IDL.Vec(IDL.Nat)],
        [IDL.Opt(BatchProcessResult)],
        [],
      ),
    'FixStuckTX' : IDL.Func([IDL.Text], [ActionResult], []),
    'Freeze' : IDL.Func([], [], []),
    'addAcceptedToken' : IDL.Func(
        [
          IDL.Variant({
            'Add' : IDL.Null,
            'Remove' : IDL.Null,
            'Opposite' : IDL.Null,
          }),
          IDL.Text,
          IDL.Nat,
          IDL.Variant({
            'ICP' : IDL.Null,
            'ICRC3' : IDL.Null,
            'ICRC12' : IDL.Null,
          }),
        ],
        [ActionResult],
        [],
      ),
    'addConcentratedLiquidity' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
        ],
        [AddConcentratedResult],
        [],
      ),
    'addFeeCollector' : IDL.Func([IDL.Principal], [ActionResult], []),
    'addLiquidity' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Opt(IDL.Bool),
        ],
        [AddLiquidityResult],
        [],
      ),
    'addLiquidityDAO' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Opt(IDL.Bool),
        ],
        [AddLiquidityResult],
        [],
      ),
    'addPosition' : IDL.Func(
        [
          IDL.Nat,
          IDL.Nat,
          IDL.Nat,
          IDL.Text,
          IDL.Text,
          IDL.Bool,
          IDL.Bool,
          IDL.Opt(IDL.Text),
          IDL.Text,
          IDL.Bool,
          IDL.Bool,
        ],
        [OrderResult],
        [],
      ),
    'addTimer' : IDL.Func([], [], []),
    'adminAnalyzeRouteEfficiency' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat],
        [
          IDL.Vec(
            IDL.Record({
              'efficiency' : IDL.Int,
              'hopDetails' : IDL.Vec(HopDetail),
              'efficiencyBps' : IDL.Int,
              'outputAmount' : IDL.Nat,
              'route' : IDL.Vec(SwapHop),
            })
          ),
        ],
        ['query'],
      ),
    'adminDeleteKlinesBefore' : IDL.Func([IDL.Int, IDL.Nat], [IDL.Text], []),
    'adminDrainExchange' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'adminDrainStatus' : IDL.Func([], [IDL.Text], ['query']),
    'adminExecuteRouteStrategy' : IDL.Func(
        [IDL.Nat, IDL.Vec(SwapHop), IDL.Nat, IDL.Nat],
        [SwapResult],
        [],
      ),
    'adminRepairLastTradedPriceAndKlines' : IDL.Func(
        [IDL.Vec(IDL.Nat), IDL.Bool],
        [IDL.Text],
        [],
      ),
    'batchAdjustLiquidity' : IDL.Func(
        [
          IDL.Vec(
            IDL.Record({
              'action' : IDL.Variant({
                'Remove' : IDL.Record({ 'liquidityAmount' : IDL.Nat }),
              }),
              'token0' : IDL.Text,
              'token1' : IDL.Text,
            })
          ),
        ],
        [
          IDL.Vec(
            IDL.Record({
              'result' : IDL.Text,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'success' : IDL.Bool,
            })
          ),
        ],
        [],
      ),
    'batchClaimAllFees' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'transferred0' : IDL.Nat,
              'transferred1' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'fees0' : IDL.Nat,
              'fees1' : IDL.Nat,
            })
          ),
        ],
        [],
      ),
    'canTradeTokens' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ['query']),
    'changeOwner2' : IDL.Func([IDL.Principal], [], []),
    'changeOwner3' : IDL.Func([IDL.Principal], [], []),
    'checkDiffs' : IDL.Func(
        [IDL.Bool, IDL.Bool],
        [
          IDL.Opt(
            IDL.Tuple(
              IDL.Bool,
              IDL.Vec(IDL.Tuple(IDL.Int, IDL.Text)),
              IDL.Vec(
                IDL.Vec(
                  IDL.Record({
                    'accessCode' : IDL.Text,
                    'poolCanister' : IDL.Tuple(IDL.Text, IDL.Text),
                    'identifier' : IDL.Text,
                  })
                )
              ),
            )
          ),
        ],
        [],
      ),
    'checkFeesReferrer' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        ['query'],
      ),
    'claimConcentratedFees' : IDL.Func([IDL.Nat], [ClaimFeesResult], []),
    'claimFeesReferrer' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        [],
      ),
    'claimLPFees' : IDL.Func([IDL.Text, IDL.Text], [ClaimFeesResult], []),
    'cleanTokenIds' : IDL.Func([], [ActionResult], []),
    'clearAllBans' : IDL.Func([], [], []),
    'clearStuckLocks' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [IDL.Bool],
        [],
      ),
    'clearTokenArchiveOffset' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'collectFees' : IDL.Func([], [ActionResult], []),
    'debugV3Ticks' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Record({
            'ticks' : IDL.Vec(
              IDL.Record({
                'tick' : IDL.Nat,
                'liquidityNet' : IDL.Int,
                'liquidityGross' : IDL.Nat,
              })
            ),
            'reserveRatio' : IDL.Nat,
            'currentSqrtRatio' : IDL.Nat,
            'activeLiquidity' : IDL.Nat,
            'reserveSqrtRatio' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'exchangeInfo' : IDL.Func([], [IDL.Opt(pool)], ['query']),
    'getAMMPoolInfo' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Opt(
            IDL.Record({
              'reserve0' : IDL.Nat,
              'reserve1' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'price0' : IDL.Float64,
              'price1' : IDL.Float64,
            })
          ),
        ],
        ['query'],
      ),
    'getAcceptedTokens' : IDL.Func([], [IDL.Opt(IDL.Vec(IDL.Text))], ['query']),
    'getAcceptedTokensInfo' : IDL.Func(
        [],
        [IDL.Opt(IDL.Vec(TokenInfo))],
        ['query'],
      ),
    'getAllAMMPools' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'totalLiquidity' : IDL.Nat,
              'reserve0' : IDL.Nat,
              'reserve1' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'price0' : IDL.Float64,
              'price1' : IDL.Float64,
            })
          ),
        ],
        ['query'],
      ),
    'getAllPoolStats' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'decimals0' : IDL.Nat,
              'decimals1' : IDL.Nat,
              'symbol0' : IDL.Text,
              'symbol1' : IDL.Text,
              'totalLiquidity' : IDL.Nat,
              'reserve0' : IDL.Nat,
              'reserve1' : IDL.Nat,
              'volume24h' : IDL.Nat,
              'activeLiquidity' : IDL.Nat,
              'feeRateBps' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'priceChange24hPct' : IDL.Float64,
              'price0' : IDL.Float64,
              'price1' : IDL.Float64,
            })
          ),
        ],
        ['query'],
      ),
    'getAllTradesPrivateCostly' : IDL.Func(
        [],
        [IDL.Opt(IDL.Tuple(IDL.Vec(IDL.Text), IDL.Vec(TradePrivate)))],
        ['query'],
      ),
    'getAllTradesPublic' : IDL.Func(
        [],
        [IDL.Opt(IDL.Tuple(IDL.Vec(IDL.Text), IDL.Vec(TradePrivate)))],
        ['query'],
      ),
    'getAllowedCanisters' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'getCurrentLiquidity' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Variant({ 'backward' : IDL.Null, 'forward' : IDL.Null }),
          IDL.Nat,
          IDL.Opt(Ratio),
        ],
        [
          IDL.Record({
            'liquidity' : IDL.Vec(
              IDL.Tuple(
                Ratio,
                IDL.Vec(
                  IDL.Record({
                    'Fee' : IDL.Nat,
                    'allOrNothing' : IDL.Bool,
                    'token_init_identifier' : IDL.Text,
                    'time' : IDL.Int,
                    'strictlyOTC' : IDL.Bool,
                    'accesscode' : IDL.Text,
                    'OCname' : IDL.Text,
                    'amount_init' : IDL.Nat,
                    'initPrincipal' : IDL.Text,
                    'RevokeFee' : IDL.Nat,
                    'amount_sell' : IDL.Nat,
                    'token_sell_identifier' : IDL.Text,
                  })
                ),
              )
            ),
            'nextCursor' : Ratio,
          }),
        ],
        ['query'],
      ),
    'getCurrentLiquidityForeignPools' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Vec(PoolQuery)), IDL.Bool],
        [ForeignPoolsResponse],
        ['query'],
      ),
    'getDAOLPPerformance' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'poolVolume24h' : IDL.Nat,
              'totalFeesEarned0' : IDL.Nat,
              'totalFeesEarned1' : IDL.Nat,
              'currentValue0' : IDL.Nat,
              'currentValue1' : IDL.Nat,
              'shareOfPool' : IDL.Float64,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
            })
          ),
        ],
        ['query'],
      ),
    'getDAOLiquiditySnapshot' : IDL.Func(
        [],
        [
          IDL.Record({
            'pools' : IDL.Vec(
              IDL.Record({
                'totalLiquidity' : IDL.Nat,
                'reserve0' : IDL.Nat,
                'reserve1' : IDL.Nat,
                'token0' : IDL.Text,
                'token1' : IDL.Text,
                'price0' : IDL.Float64,
                'price1' : IDL.Float64,
              })
            ),
            'positions' : IDL.Vec(
              IDL.Record({
                'fee0' : IDL.Nat,
                'fee1' : IDL.Nat,
                'liquidity' : IDL.Nat,
                'shareOfPool' : IDL.Float64,
                'token0' : IDL.Text,
                'token1' : IDL.Text,
                'token0Amount' : IDL.Nat,
                'token1Amount' : IDL.Nat,
              })
            ),
          }),
        ],
        ['query'],
      ),
    'getDriftOpTracker' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Int))],
        ['query'],
      ),
    'getExpectedMultiHopAmount' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [
          IDL.Record({
            'hopDetails' : IDL.Vec(HopDetail),
            'expectedAmountOut' : IDL.Nat,
            'routeTokens' : IDL.Vec(IDL.Text),
            'hops' : IDL.Nat,
            'priceImpact' : IDL.Float64,
            'totalFee' : IDL.Nat,
            'bestRoute' : IDL.Vec(SwapHop),
          }),
        ],
        ['query'],
      ),
    'getExpectedReceiveAmount' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [
          IDL.Record({
            'fee' : IDL.Nat,
            'hopDetails' : IDL.Vec(HopDetail),
            'routeDescription' : IDL.Text,
            'canFulfillFully' : IDL.Bool,
            'priceImpact' : IDL.Float64,
            'potentialOrderDetails' : IDL.Opt(
              IDL.Record({ 'amount_init' : IDL.Nat, 'amount_sell' : IDL.Nat })
            ),
            'expectedBuyAmount' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getExpectedReceiveAmountBatch' : IDL.Func(
        [
          IDL.Vec(
            IDL.Record({
              'tokenBuy' : IDL.Text,
              'amountSell' : IDL.Nat,
              'tokenSell' : IDL.Text,
            })
          ),
        ],
        [
          IDL.Vec(
            IDL.Record({
              'fee' : IDL.Nat,
              'hopDetails' : IDL.Vec(HopDetail),
              'routeDescription' : IDL.Text,
              'canFulfillFully' : IDL.Bool,
              'priceImpact' : IDL.Float64,
              'potentialOrderDetails' : IDL.Opt(
                IDL.Record({ 'amount_init' : IDL.Nat, 'amount_sell' : IDL.Nat })
              ),
              'expectedBuyAmount' : IDL.Nat,
            })
          ),
        ],
        ['query'],
      ),
    'getExpectedReceiveAmountBatchMulti' : IDL.Func(
        [
          IDL.Vec(
            IDL.Record({
              'tokenBuy' : IDL.Text,
              'amountSell' : IDL.Nat,
              'tokenSell' : IDL.Text,
            })
          ),
          IDL.Nat,
        ],
        [
          IDL.Vec(
            IDL.Record({
              'routes' : IDL.Vec(
                IDL.Record({
                  'fee' : IDL.Nat,
                  'hopDetails' : IDL.Vec(HopDetail),
                  'routeDescription' : IDL.Text,
                  'canFulfillFully' : IDL.Bool,
                  'routeTokens' : IDL.Vec(IDL.Text),
                  'priceImpact' : IDL.Float64,
                  'potentialOrderDetails' : IDL.Opt(
                    IDL.Record({
                      'amount_init' : IDL.Nat,
                      'amount_sell' : IDL.Nat,
                    })
                  ),
                  'expectedBuyAmount' : IDL.Nat,
                })
              ),
            })
          ),
        ],
        ['query'],
      ),
    'getFeeCollectors' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getKlineData' : IDL.Func(
        [IDL.Text, IDL.Text, TimeFrame, IDL.Bool],
        [IDL.Vec(KlineData)],
        ['query'],
      ),
    'getKlineDataRange' : IDL.Func(
        [IDL.Text, IDL.Text, TimeFrame, IDL.Opt(IDL.Int), IDL.Nat],
        [IDL.Vec(KlineData)],
        ['query'],
      ),
    'getLogging' : IDL.Func(
        [
          IDL.Variant({
            'FinishSellBatchDAO' : IDL.Null,
            'addAcceptedToken' : IDL.Null,
          }),
          IDL.Nat,
        ],
        [IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Text))],
        ['query'],
      ),
    'getLogs' : IDL.Func([IDL.Nat], [IDL.Vec(LogEntry)], ['query']),
    'getOrderbookCombined' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'ammMidPrice' : IDL.Float64,
            'asks' : IDL.Vec(
              IDL.Record({
                'ammAmount' : IDL.Nat,
                'limitAmount' : IDL.Nat,
                'price' : IDL.Float64,
                'limitOrders' : IDL.Nat,
              })
            ),
            'bids' : IDL.Vec(
              IDL.Record({
                'ammAmount' : IDL.Nat,
                'limitAmount' : IDL.Nat,
                'price' : IDL.Float64,
                'limitOrders' : IDL.Nat,
              })
            ),
            'ammReserve0' : IDL.Nat,
            'ammReserve1' : IDL.Nat,
            'spread' : IDL.Float64,
          }),
        ],
        ['query'],
      ),
    'getPausedTokens' : IDL.Func([], [IDL.Opt(IDL.Vec(IDL.Text))], ['query']),
    'getPoolHistory' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [
          IDL.Vec(
            IDL.Tuple(
              Time,
              IDL.Vec(
                IDL.Record({
                  'allOrNothing' : IDL.Bool,
                  'token_init_identifier' : IDL.Text,
                  'strictlyOTC' : IDL.Bool,
                  'accesscode' : IDL.Text,
                  'sell_principal' : IDL.Text,
                  'amount_init' : IDL.Nat,
                  'amount_sell' : IDL.Nat,
                  'init_principal' : IDL.Text,
                })
              ),
            )
          ),
        ],
        ['query'],
      ),
    'getPoolRanges' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Vec(
            IDL.Record({
              'ratioUpper' : IDL.Nat,
              'token0Locked' : IDL.Nat,
              'liquidity' : IDL.Nat,
              'token1Locked' : IDL.Nat,
              'ratioLower' : IDL.Nat,
            })
          ),
        ],
        ['query'],
      ),
    'getPoolStats' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Opt(
            IDL.Record({
              'decimals0' : IDL.Nat,
              'decimals1' : IDL.Nat,
              'symbol0' : IDL.Text,
              'symbol1' : IDL.Text,
              'feesLifetimeToken0' : IDL.Nat,
              'feesLifetimeToken1' : IDL.Nat,
              'totalLiquidity' : IDL.Nat,
              'volume7d' : IDL.Nat,
              'reserve0' : IDL.Nat,
              'reserve1' : IDL.Nat,
              'volume24h' : IDL.Nat,
              'history' : IDL.Vec(PoolDailySnapshot),
              'activeLiquidity' : IDL.Nat,
              'feeRateBps' : IDL.Nat,
              'token0' : IDL.Text,
              'token1' : IDL.Text,
              'priceChange24hPct' : IDL.Float64,
              'lpFeeSharePct' : IDL.Nat,
              'price0' : IDL.Float64,
              'price1' : IDL.Float64,
            })
          ),
        ],
        ['query'],
      ),
    'getPrivateTrade' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(TradePosition)],
        ['query'],
      ),
    'getTokenArchiveOffset' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Nat)],
        ['query'],
      ),
    'getTokenUSDPrices' : IDL.Func(
        [IDL.Float64, IDL.Float64],
        [
          IDL.Opt(
            IDL.Record({
              'data' : IDL.Vec(
                IDL.Tuple(
                  IDL.Text,
                  IDL.Record({
                    'address' : IDL.Text,
                    'priceUSD' : IDL.Float64,
                    'timeLastValidUpdate' : IDL.Int,
                  }),
                )
              ),
              'error' : IDL.Bool,
            })
          ),
        ],
        ['query'],
      ),
    'getUserConcentratedPositions' : IDL.Func(
        [],
        [IDL.Vec(ConcentratedPositionDetailed)],
        ['query'],
      ),
    'getUserLiquidityDetailed' : IDL.Func(
        [],
        [IDL.Vec(DetailedLiquidityPosition)],
        ['query'],
      ),
    'getUserPreviousTrades' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Vec(
            IDL.Record({
              'allOrNothing' : IDL.Bool,
              'token_init_identifier' : IDL.Text,
              'strictlyOTC' : IDL.Bool,
              'accesscode' : IDL.Text,
              'sell_principal' : IDL.Text,
              'amount_init' : IDL.Nat,
              'amount_sell' : IDL.Nat,
              'init_principal' : IDL.Text,
              'timestamp' : IDL.Int,
            })
          ),
        ],
        ['query'],
      ),
    'getUserReferralInfo' : IDL.Func(
        [],
        [
          IDL.Record({
            'referrer' : IDL.Opt(IDL.Text),
            'isFirstTrade' : IDL.Bool,
            'referralEarnings' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
            'hasReferrer' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'getUserSwapHistory' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(SwapRecord)],
        ['query'],
      ),
    'getUserTradeHistory' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Vec(
            IDL.Record({
              'token_init_identifier' : IDL.Text,
              'accesscode' : IDL.Text,
              'counterparty' : IDL.Text,
              'amount_init' : IDL.Nat,
              'amount_sell' : IDL.Nat,
              'timestamp' : IDL.Int,
              'token_sell_identifier' : IDL.Text,
            })
          ),
        ],
        ['query'],
      ),
    'getUserTrades' : IDL.Func([], [IDL.Vec(TradePrivate2)], ['query']),
    'get_cycles' : IDL.Func([], [IDL.Nat], ['query']),
    'get_token_trends_7d' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [
          IDL.Variant({
            'ok' : IDL.Vec(
              IDL.Record({
                'token' : IDL.Principal,
                'change_pct_7d' : IDL.Float64,
                'change_pct_24h' : IDL.Float64,
                'price_now' : IDL.Float64,
                'points' : IDL.Vec(IDL.Float64),
              })
            ),
            'err' : IDL.Text,
          }),
        ],
        ['query'],
      ),
    'hmFee' : IDL.Func([], [IDL.Nat], ['query']),
    'hmRefFee' : IDL.Func([], [IDL.Nat], ['query']),
    'hmRevokeFee' : IDL.Func([], [IDL.Nat], ['query']),
    'isExchangeFrozen' : IDL.Func([], [IDL.Bool], ['query']),
    'p2a' : IDL.Func([], [IDL.Text], ['query']),
    'p2acannister' : IDL.Func([], [IDL.Text], ['query']),
    'p2athird' : IDL.Func([IDL.Text], [IDL.Text], []),
    'parameterManagement' : IDL.Func(
        [
          IDL.Record({
            'deleteAllowedCanisters' : IDL.Opt(IDL.Vec(IDL.Text)),
            'changeAllowedCalls' : IDL.Opt(IDL.Nat),
            'deleteFromDayBan' : IDL.Opt(IDL.Vec(IDL.Text)),
            'treasury_principal' : IDL.Opt(IDL.Text),
            'deleteFromAllTimeBan' : IDL.Opt(IDL.Vec(IDL.Text)),
            'addToAllTimeBan' : IDL.Opt(IDL.Vec(IDL.Text)),
            'addAllowedCanisters' : IDL.Opt(IDL.Vec(IDL.Text)),
            'changeallowedSilentWarnings' : IDL.Opt(IDL.Nat),
          }),
        ],
        [],
        [],
      ),
    'pauseToken' : IDL.Func([IDL.Text], [], []),
    'recalibrateDAOpositions' : IDL.Func(
        [IDL.Vec(PositionData)],
        [IDL.Vec(RecalibratedPosition)],
        [],
      ),
    'recoverBatch' : IDL.Func(
        [IDL.Vec(RecoveryInput)],
        [IDL.Vec(RecoveryResult)],
        [],
      ),
    'recoverWronglysent' : IDL.Func(
        [
          IDL.Text,
          IDL.Nat,
          IDL.Variant({
            'ICP' : IDL.Null,
            'ICRC3' : IDL.Null,
            'ICRC12' : IDL.Null,
          }),
        ],
        [IDL.Bool],
        [],
      ),
    'refundStuckFunds' : IDL.Func([], [IDL.Text], []),
    'removeConcentratedLiquidity' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat],
        [RemoveConcentratedResult],
        [],
      ),
    'removeFeeCollector' : IDL.Func([], [ActionResult], []),
    'removeLiquidity' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [RemoveLiquidityResult],
        [],
      ),
    'resetAllState' : IDL.Func([], [IDL.Text], []),
    'resetDriftOpTracker' : IDL.Func([], [], []),
    'retrieveFundsDao' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64))],
        [],
        [],
      ),
    'returncontractprincipal' : IDL.Func([], [IDL.Text], ['query']),
    'revokeTrade' : IDL.Func(
        [
          IDL.Text,
          IDL.Variant({
            'DAO' : IDL.Vec(IDL.Text),
            'Seller' : IDL.Null,
            'Initiator' : IDL.Null,
          }),
        ],
        [RevokeResult],
        [],
      ),
    'sendDAOInfo' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Text,
              IDL.Record({
                'Symbol' : IDL.Text,
                'Name' : IDL.Text,
                'TransferFee' : IDL.Nat,
                'Decimals' : IDL.Nat,
              }),
            )
          ),
        ],
        ['query'],
      ),
    'setMinimumAmount' : IDL.Func([IDL.Text, IDL.Nat], [ActionResult], []),
    'setTest' : IDL.Func([IDL.Bool], [], []),
    'swapMultiHop' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Vec(SwapHop), IDL.Nat, IDL.Nat],
        [SwapResult],
        [],
      ),
    'swapSplitRoutes' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Vec(SplitLeg), IDL.Nat, IDL.Nat],
        [SwapResult],
        [],
      ),
    'treasurySwap' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat],
        [SwapResult],
        [],
      ),
    'updateTokenType' : IDL.Func(
        [
          IDL.Text,
          IDL.Variant({
            'ICP' : IDL.Null,
            'ICRC3' : IDL.Null,
            'ICRC12' : IDL.Null,
          }),
        ],
        [ActionResult],
        [],
      ),
  });
  return create_trading_canister;
};
export const init = ({ IDL }) => { return []; };
