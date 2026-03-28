export const idlFactory = ({ IDL }) => {
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
  const SwapHop = IDL.Record({ 'tokenIn' : IDL.Text, 'tokenOut' : IDL.Text });
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
  const Time = IDL.Int;
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
  const DetailedLiquidityPosition = IDL.Record({
    'liquidity' : IDL.Nat,
    'shareOfPool' : IDL.Float64,
    'token0' : IDL.Text,
    'token1' : IDL.Text,
    'token0Amount' : IDL.Nat,
    'token1Amount' : IDL.Nat,
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
  const create_trading_canister = IDL.Service({
    'ChangeReferralFees' : IDL.Func([IDL.Nat], [], []),
    'ChangeRevokefees' : IDL.Func([IDL.Nat], [], ['oneway']),
    'ChangeTradingfees' : IDL.Func([IDL.Nat], [], ['oneway']),
    'FinishSell' : IDL.Func([IDL.Nat64, IDL.Text, IDL.Nat], [IDL.Text], []),
    'FinishSellBatch' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Text), IDL.Vec(IDL.Nat), IDL.Text, IDL.Text],
        [IDL.Text],
        [],
      ),
    'FinishSellBatchDAO' : IDL.Func(
        [IDL.Vec(TradeData), IDL.Bool, IDL.Vec(IDL.Nat)],
        [IDL.Opt(BatchProcessResult)],
        [],
      ),
    'FixStuckTX' : IDL.Func([IDL.Text], [IDL.Text], []),
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
        [IDL.Text],
        [],
      ),
    'addLiquidity' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
        [IDL.Text],
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
        [IDL.Text],
        [],
      ),
    'addTimer' : IDL.Func([], [], []),
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
    'claimFeesReferrer' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        [],
      ),
    'collectFees' : IDL.Func([], [IDL.Text], []),
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
    'getExpectedMultiHopAmount' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [
          IDL.Record({
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
    'getKlineData' : IDL.Func(
        [IDL.Text, IDL.Text, TimeFrame, IDL.Bool],
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
    'getPrivateTrade' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(TradePosition)],
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
    'hmFee' : IDL.Func([], [IDL.Nat], ['query']),
    'hmRefFee' : IDL.Func([], [IDL.Nat], ['query']),
    'hmRevokeFee' : IDL.Func([], [IDL.Nat], ['query']),
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
    'removeLiquidity' : IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [IDL.Text], []),
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
        [IDL.Text],
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
    'setTest' : IDL.Func([IDL.Bool], [], []),
    'swapMultiHop' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Vec(SwapHop), IDL.Nat, IDL.Nat],
        [IDL.Text],
        [],
      ),
  });
  return create_trading_canister;
};
export const init = ({ IDL }) => { return []; };
