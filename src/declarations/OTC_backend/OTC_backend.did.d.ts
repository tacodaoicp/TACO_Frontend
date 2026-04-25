import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ActionResult = { 'Ok' : string } |
  { 'Err' : ExchangeError };
export interface AddConcentratedOk {
  'priceLower' : bigint,
  'priceUpper' : bigint,
  'liquidity' : bigint,
  'amount0Used' : bigint,
  'positionId' : bigint,
  'token0' : string,
  'token1' : string,
  'refund0' : bigint,
  'refund1' : bigint,
  'amount1Used' : bigint,
}
export type AddConcentratedResult = { 'Ok' : AddConcentratedOk } |
  { 'Err' : ExchangeError };
export interface AddLiquidityOk {
  'liquidityMinted' : bigint,
  'amount0Used' : bigint,
  'token0' : string,
  'token1' : string,
  'refund0' : bigint,
  'refund1' : bigint,
  'amount1Used' : bigint,
}
export type AddLiquidityResult = { 'Ok' : AddLiquidityOk } |
  { 'Err' : ExchangeError };
export interface BatchProcessResult {
  'accesscodes' : Array<
    {
      'fee' : bigint,
      'accesscode' : string,
      'amountInit' : bigint,
      'amountSell' : bigint,
      'revokeFee' : bigint,
      'poolId' : [string, string],
    }
  >,
  'execMessage' : string,
  'processedTrades' : Array<ProcessedTrade>,
}
export interface ClaimFeesOk {
  'transferred0' : bigint,
  'transferred1' : bigint,
  'dust1ToDAO' : bigint,
  'dust0ToDAO' : bigint,
  'fees0' : bigint,
  'fees1' : bigint,
}
export type ClaimFeesResult = { 'Ok' : ClaimFeesOk } |
  { 'Err' : ExchangeError };
export interface ConcentratedPositionDetailed {
  'ratioUpper' : bigint,
  'lastFeeGrowth0' : bigint,
  'lastFeeGrowth1' : bigint,
  'fee0' : bigint,
  'fee1' : bigint,
  'liquidity' : bigint,
  'positionId' : bigint,
  'lastUpdateTime' : bigint,
  'token0' : string,
  'token1' : string,
  'token0Amount' : bigint,
  'token1Amount' : bigint,
  'ratioLower' : bigint,
}
export interface DetailedLiquidityPosition {
  'ratioUpper' : [] | [bigint],
  'fee0' : bigint,
  'fee1' : bigint,
  'liquidity' : bigint,
  'shareOfPool' : number,
  'positionType' : { 'concentrated' : null } |
    { 'fullRange' : null },
  'positionId' : [] | [bigint],
  'token0' : string,
  'token1' : string,
  'token0Amount' : bigint,
  'token1Amount' : bigint,
  'ratioLower' : [] | [bigint],
}
export type ExchangeError = { 'InvalidInput' : string } |
  { 'PoolNotFound' : string } |
  { 'SystemError' : string } |
  { 'OrderNotFound' : string } |
  { 'TokenPaused' : string } |
  { 'NotAuthorized' : null } |
  { 'RouteFailed' : { 'hop' : bigint, 'reason' : string } } |
  { 'Banned' : null } |
  { 'ExchangeFrozen' : null } |
  { 'TransferFailed' : string } |
  { 'SlippageExceeded' : { 'got' : bigint, 'expected' : bigint } } |
  { 'TokenNotAccepted' : string } |
  { 'InsufficientFunds' : string };
export interface ForeignPoolLiquidity {
  'forwardCursor' : Ratio,
  'pool' : [string, string],
  'liquidity' : PoolLiquidity,
  'backwardCursor' : Ratio,
}
export interface ForeignPoolsResponse {
  'nextPoolCursor' : [] | [PoolQuery],
  'pools' : Array<ForeignPoolLiquidity>,
}
export interface HopDetail {
  'fee' : bigint,
  'tokenIn' : string,
  'tokenOut' : string,
  'priceImpact' : number,
  'amountIn' : bigint,
  'amountOut' : bigint,
}
export interface KlineData {
  'low' : number,
  'high' : number,
  'close' : number,
  'open' : number,
  'volume' : bigint,
  'timestamp' : bigint,
}
export interface LogEntry {
  'component' : string,
  'context' : string,
  'level' : LogLevel,
  'message' : string,
  'timestamp' : bigint,
}
export type LogLevel = { 'INFO' : null } |
  { 'WARN' : null } |
  { 'ERROR' : null };
export interface OrderOk {
  'buyAmountReceived' : bigint,
  'tokenIn' : string,
  'tokenOut' : string,
  'accessCode' : string,
  'amountIn' : bigint,
  'filled' : bigint,
  'remaining' : bigint,
  'isPublic' : boolean,
  'swapId' : [] | [bigint],
}
export type OrderResult = { 'Ok' : OrderOk } |
  { 'Err' : ExchangeError };
export interface PoolDailySnapshot {
  'totalLiquidity' : bigint,
  'reserve0' : bigint,
  'reserve1' : bigint,
  'volume' : bigint,
  'activeLiquidity' : bigint,
  'timestamp' : bigint,
}
export interface PoolLiquidity {
  'backward' : Array<
    [
      Ratio,
      Array<
        {
          'Fee' : bigint,
          'allOrNothing' : boolean,
          'token_init_identifier' : string,
          'time' : bigint,
          'strictlyOTC' : boolean,
          'accesscode' : string,
          'OCname' : string,
          'amount_init' : bigint,
          'initPrincipal' : string,
          'RevokeFee' : bigint,
          'amount_sell' : bigint,
          'token_sell_identifier' : string,
        }
      >,
    ]
  >,
  'forward' : Array<
    [
      Ratio,
      Array<
        {
          'Fee' : bigint,
          'allOrNothing' : boolean,
          'token_init_identifier' : string,
          'time' : bigint,
          'strictlyOTC' : boolean,
          'accesscode' : string,
          'OCname' : string,
          'amount_init' : bigint,
          'initPrincipal' : string,
          'RevokeFee' : bigint,
          'amount_sell' : bigint,
          'token_sell_identifier' : string,
        }
      >,
    ]
  >,
}
export interface PoolQuery {
  'forwardCursor' : [] | [Ratio],
  'pool' : [string, string],
  'backwardCursor' : [] | [Ratio],
}
export interface PositionData {
  'decimals' : [bigint, bigint],
  'accesscode' : string,
  'ICPprice' : [bigint, bigint],
}
export interface ProcessedTrade {
  'amountSold' : bigint,
  'amountBought' : bigint,
  'identifier' : string,
}
export type Ratio = { 'Max' : null } |
  { 'Zero' : null } |
  { 'Value' : bigint };
export interface RecalibratedPosition {
  'fee' : bigint,
  'accesscode' : string,
  'amountInit' : bigint,
  'amountSell' : bigint,
  'revokeFee' : bigint,
  'poolId' : [string, string],
}
export interface RecoveryInput {
  'tType' : { 'ICP' : null } |
    { 'ICRC3' : null } |
    { 'ICRC12' : null },
  'block' : bigint,
  'identifier' : string,
}
export interface RecoveryResult {
  'error' : string,
  'block' : bigint,
  'success' : boolean,
  'identifier' : string,
}
export interface RemoveConcentratedOk {
  'liquidityRemaining' : bigint,
  'liquidityRemoved' : bigint,
  'amount0' : bigint,
  'amount1' : bigint,
  'fees0' : bigint,
  'fees1' : bigint,
}
export type RemoveConcentratedResult = { 'Ok' : RemoveConcentratedOk } |
  { 'Err' : ExchangeError };
export interface RemoveLiquidityOk {
  'amount0' : bigint,
  'amount1' : bigint,
  'liquidityBurned' : bigint,
  'fees0' : bigint,
  'fees1' : bigint,
}
export type RemoveLiquidityResult = { 'Ok' : RemoveLiquidityOk } |
  { 'Err' : ExchangeError };
export interface RevokeOk {
  'accessCode' : string,
  'revokeType' : { 'DAO' : null } |
    { 'Seller' : null } |
    { 'Initiator' : null },
  'refunds' : Array<{ 'token' : string, 'amount' : bigint }>,
}
export type RevokeResult = { 'Ok' : RevokeOk } |
  { 'Err' : ExchangeError };
export interface SplitLeg {
  'amountIn' : bigint,
  'route' : Array<SwapHop>,
  'minLegOut' : bigint,
}
export interface SwapHop { 'tokenIn' : string, 'tokenOut' : string }
export interface SwapOk {
  'fee' : bigint,
  'tokenIn' : string,
  'tokenOut' : string,
  'hops' : bigint,
  'firstHopOrderbookMatch' : boolean,
  'amountIn' : bigint,
  'amountOut' : bigint,
  'swapId' : bigint,
  'route' : Array<string>,
  'lastHopAMMOnly' : boolean,
}
export interface SwapRecord {
  'fee' : bigint,
  'tokenIn' : string,
  'tokenOut' : string,
  'amountIn' : bigint,
  'swapType' : { 'otc' : null } |
    { 'limit' : null } |
    { 'multihop' : null } |
    { 'direct' : null },
  'timestamp' : bigint,
  'amountOut' : bigint,
  'swapId' : bigint,
  'route' : Array<string>,
}
export type SwapResult = { 'Ok' : SwapOk } |
  { 'Err' : ExchangeError };
export type Time = bigint;
export type TimeFrame = { 'day' : null } |
  { 'fourHours' : null } |
  { 'hour' : null } |
  { 'week' : null } |
  { 'fivemin' : null };
export interface TokenInfo {
  'decimals' : bigint,
  'asset_type' : { 'ICP' : null } |
    { 'ICRC3' : null } |
    { 'ICRC12' : null },
  'transfer_fee' : bigint,
  'name' : string,
  'minimum_amount' : bigint,
  'address' : string,
  'symbol' : string,
}
export interface TradeData {
  'decimals' : bigint,
  'transferFee' : bigint,
  'amountSell' : bigint,
  'ICPPrice' : bigint,
  'block' : bigint,
  'amountBuy' : bigint,
  'identifier' : string,
}
export interface TradePosition {
  'Fee' : bigint,
  'trade_number' : bigint,
  'allOrNothing' : boolean,
  'token_init_identifier' : string,
  'time' : bigint,
  'trade_done' : bigint,
  'strictlyOTC' : boolean,
  'OCname' : string,
  'amount_init' : bigint,
  'initPrincipal' : string,
  'amount_sell' : bigint,
  'filledInit' : bigint,
  'token_sell_identifier' : string,
  'filledSell' : bigint,
}
export interface TradePrivate {
  'Fee' : bigint,
  'trade_number' : bigint,
  'allOrNothing' : boolean,
  'token_init_identifier' : string,
  'seller_paid2' : bigint,
  'time' : bigint,
  'trade_done' : bigint,
  'strictlyOTC' : boolean,
  'SellerPrincipal' : string,
  'OCname' : string,
  'init_paid' : bigint,
  'amount_init' : bigint,
  'init_paid2' : bigint,
  'initPrincipal' : string,
  'RevokeFee' : bigint,
  'amount_sell' : bigint,
  'seller_paid' : bigint,
  'filledInit' : bigint,
  'token_sell_identifier' : string,
  'filledSell' : bigint,
}
export interface TradePrivate2 {
  'Fee' : bigint,
  'trade_number' : bigint,
  'allOrNothing' : boolean,
  'token_init_identifier' : string,
  'seller_paid2' : bigint,
  'time' : bigint,
  'trade_done' : bigint,
  'strictlyOTC' : boolean,
  'accesscode' : string,
  'SellerPrincipal' : string,
  'OCname' : string,
  'init_paid' : bigint,
  'amount_init' : bigint,
  'init_paid2' : bigint,
  'initPrincipal' : string,
  'RevokeFee' : bigint,
  'amount_sell' : bigint,
  'seller_paid' : bigint,
  'filledInit' : bigint,
  'token_sell_identifier' : string,
  'filledSell' : bigint,
}
export interface create_trading_canister {
  'ChangeReferralFees' : ActorMethod<[bigint], undefined>,
  'ChangeRevokefees' : ActorMethod<[bigint], undefined>,
  'ChangeTradingfees' : ActorMethod<[bigint], undefined>,
  'FinishSell' : ActorMethod<[bigint, string, bigint], ActionResult>,
  'FinishSellBatch' : ActorMethod<
    [bigint, Array<string>, Array<bigint>, string, string],
    ActionResult
  >,
  'FinishSellBatchDAO' : ActorMethod<
    [Array<TradeData>, boolean, Array<bigint>],
    [] | [BatchProcessResult]
  >,
  'FixStuckTX' : ActorMethod<[string], ActionResult>,
  'Freeze' : ActorMethod<[], undefined>,
  'addAcceptedToken' : ActorMethod<
    [
      { 'Add' : null } |
        { 'Remove' : null } |
        { 'Opposite' : null },
      string,
      bigint,
      { 'ICP' : null } |
        { 'ICRC3' : null } |
        { 'ICRC12' : null },
    ],
    ActionResult
  >,
  'addConcentratedLiquidity' : ActorMethod<
    [string, string, bigint, bigint, bigint, bigint, bigint, bigint],
    AddConcentratedResult
  >,
  'addFeeCollector' : ActorMethod<[Principal], ActionResult>,
  'addLiquidity' : ActorMethod<
    [string, string, bigint, bigint, bigint, bigint, [] | [boolean]],
    AddLiquidityResult
  >,
  'addLiquidityDAO' : ActorMethod<
    [string, string, bigint, bigint, bigint, bigint, [] | [boolean]],
    AddLiquidityResult
  >,
  'addPosition' : ActorMethod<
    [
      bigint,
      bigint,
      bigint,
      string,
      string,
      boolean,
      boolean,
      [] | [string],
      string,
      boolean,
      boolean,
    ],
    OrderResult
  >,
  'addTimer' : ActorMethod<[], undefined>,
  'adminAnalyzeRouteEfficiency' : ActorMethod<
    [string, bigint, bigint],
    Array<
      {
        'efficiency' : bigint,
        'hopDetails' : Array<HopDetail>,
        'efficiencyBps' : bigint,
        'outputAmount' : bigint,
        'route' : Array<SwapHop>,
      }
    >
  >,
  'adminDrainExchange' : ActorMethod<[Principal], string>,
  'adminDrainStatus' : ActorMethod<[], string>,
  'adminExecuteRouteStrategy' : ActorMethod<
    [bigint, Array<SwapHop>, bigint, bigint],
    SwapResult
  >,
  'adminRepairLastTradedPriceAndKlines' : ActorMethod<
    [Array<bigint>, boolean],
    string
  >,
  'batchAdjustLiquidity' : ActorMethod<
    [
      Array<
        {
          'action' : { 'Remove' : { 'liquidityAmount' : bigint } },
          'token0' : string,
          'token1' : string,
        }
      >,
    ],
    Array<
      {
        'result' : string,
        'token0' : string,
        'token1' : string,
        'success' : boolean,
      }
    >
  >,
  'batchClaimAllFees' : ActorMethod<
    [],
    Array<
      {
        'transferred0' : bigint,
        'transferred1' : bigint,
        'token0' : string,
        'token1' : string,
        'fees0' : bigint,
        'fees1' : bigint,
      }
    >
  >,
  'canTradeTokens' : ActorMethod<[string, string], boolean>,
  'changeOwner2' : ActorMethod<[Principal], undefined>,
  'changeOwner3' : ActorMethod<[Principal], undefined>,
  'checkDiffs' : ActorMethod<
    [boolean, boolean],
    [] | [
      [
        boolean,
        Array<[bigint, string]>,
        Array<
          Array<
            {
              'accessCode' : string,
              'poolCanister' : [string, string],
              'identifier' : string,
            }
          >
        >,
      ]
    ]
  >,
  'checkFeesReferrer' : ActorMethod<[], Array<[string, bigint]>>,
  'claimConcentratedFees' : ActorMethod<[bigint], ClaimFeesResult>,
  'claimFeesReferrer' : ActorMethod<[], Array<[string, bigint]>>,
  'claimLPFees' : ActorMethod<[string, string], ClaimFeesResult>,
  'cleanTokenIds' : ActorMethod<[], ActionResult>,
  'clearAllBans' : ActorMethod<[], undefined>,
  'clearStuckLocks' : ActorMethod<[[] | [string], [] | [string]], boolean>,
  'collectFees' : ActorMethod<[], ActionResult>,
  'debugV3Ticks' : ActorMethod<
    [string, string],
    {
      'ticks' : Array<
        { 'tick' : bigint, 'liquidityNet' : bigint, 'liquidityGross' : bigint }
      >,
      'reserveRatio' : bigint,
      'currentSqrtRatio' : bigint,
      'activeLiquidity' : bigint,
      'reserveSqrtRatio' : bigint,
    }
  >,
  'exchangeInfo' : ActorMethod<[], [] | [pool]>,
  'getAMMPoolInfo' : ActorMethod<
    [string, string],
    [] | [
      {
        'reserve0' : bigint,
        'reserve1' : bigint,
        'token0' : string,
        'token1' : string,
        'price0' : number,
        'price1' : number,
      }
    ]
  >,
  'getAcceptedTokens' : ActorMethod<[], [] | [Array<string>]>,
  'getAcceptedTokensInfo' : ActorMethod<[], [] | [Array<TokenInfo>]>,
  'getAllAMMPools' : ActorMethod<
    [],
    Array<
      {
        'totalLiquidity' : bigint,
        'reserve0' : bigint,
        'reserve1' : bigint,
        'token0' : string,
        'token1' : string,
        'price0' : number,
        'price1' : number,
      }
    >
  >,
  'getAllPoolStats' : ActorMethod<
    [],
    Array<
      {
        'decimals0' : bigint,
        'decimals1' : bigint,
        'symbol0' : string,
        'symbol1' : string,
        'totalLiquidity' : bigint,
        'reserve0' : bigint,
        'reserve1' : bigint,
        'volume24h' : bigint,
        'activeLiquidity' : bigint,
        'feeRateBps' : bigint,
        'token0' : string,
        'token1' : string,
        'priceChange24hPct' : number,
        'price0' : number,
        'price1' : number,
      }
    >
  >,
  'getAllTradesPrivateCostly' : ActorMethod<
    [],
    [] | [[Array<string>, Array<TradePrivate>]]
  >,
  'getAllTradesPublic' : ActorMethod<
    [],
    [] | [[Array<string>, Array<TradePrivate>]]
  >,
  'getAllowedCanisters' : ActorMethod<[], Array<string>>,
  'getCurrentLiquidity' : ActorMethod<
    [
      string,
      string,
      { 'backward' : null } |
        { 'forward' : null },
      bigint,
      [] | [Ratio],
    ],
    {
      'liquidity' : Array<
        [
          Ratio,
          Array<
            {
              'Fee' : bigint,
              'allOrNothing' : boolean,
              'token_init_identifier' : string,
              'time' : bigint,
              'strictlyOTC' : boolean,
              'accesscode' : string,
              'OCname' : string,
              'amount_init' : bigint,
              'initPrincipal' : string,
              'RevokeFee' : bigint,
              'amount_sell' : bigint,
              'token_sell_identifier' : string,
            }
          >,
        ]
      >,
      'nextCursor' : Ratio,
    }
  >,
  'getCurrentLiquidityForeignPools' : ActorMethod<
    [bigint, [] | [Array<PoolQuery>], boolean],
    ForeignPoolsResponse
  >,
  'getDAOLPPerformance' : ActorMethod<
    [],
    Array<
      {
        'poolVolume24h' : bigint,
        'totalFeesEarned0' : bigint,
        'totalFeesEarned1' : bigint,
        'currentValue0' : bigint,
        'currentValue1' : bigint,
        'shareOfPool' : number,
        'token0' : string,
        'token1' : string,
      }
    >
  >,
  'getDAOLiquiditySnapshot' : ActorMethod<
    [],
    {
      'pools' : Array<
        {
          'totalLiquidity' : bigint,
          'reserve0' : bigint,
          'reserve1' : bigint,
          'token0' : string,
          'token1' : string,
          'price0' : number,
          'price1' : number,
        }
      >,
      'positions' : Array<
        {
          'fee0' : bigint,
          'fee1' : bigint,
          'liquidity' : bigint,
          'shareOfPool' : number,
          'token0' : string,
          'token1' : string,
          'token0Amount' : bigint,
          'token1Amount' : bigint,
        }
      >,
    }
  >,
  'getDriftOpTracker' : ActorMethod<[], Array<[string, bigint]>>,
  'getExpectedMultiHopAmount' : ActorMethod<
    [string, string, bigint],
    {
      'hopDetails' : Array<HopDetail>,
      'expectedAmountOut' : bigint,
      'routeTokens' : Array<string>,
      'hops' : bigint,
      'priceImpact' : number,
      'totalFee' : bigint,
      'bestRoute' : Array<SwapHop>,
    }
  >,
  'getExpectedReceiveAmount' : ActorMethod<
    [string, string, bigint],
    {
      'fee' : bigint,
      'hopDetails' : Array<HopDetail>,
      'routeDescription' : string,
      'canFulfillFully' : boolean,
      'priceImpact' : number,
      'potentialOrderDetails' : [] | [
        { 'amount_init' : bigint, 'amount_sell' : bigint }
      ],
      'expectedBuyAmount' : bigint,
    }
  >,
  'getExpectedReceiveAmountBatch' : ActorMethod<
    [
      Array<
        { 'tokenBuy' : string, 'amountSell' : bigint, 'tokenSell' : string }
      >,
    ],
    Array<
      {
        'fee' : bigint,
        'hopDetails' : Array<HopDetail>,
        'routeDescription' : string,
        'canFulfillFully' : boolean,
        'priceImpact' : number,
        'potentialOrderDetails' : [] | [
          { 'amount_init' : bigint, 'amount_sell' : bigint }
        ],
        'expectedBuyAmount' : bigint,
      }
    >
  >,
  'getFeeCollectors' : ActorMethod<[], Array<Principal>>,
  'getKlineData' : ActorMethod<
    [string, string, TimeFrame, boolean],
    Array<KlineData>
  >,
  'getKlineDataRange' : ActorMethod<
    [string, string, TimeFrame, [] | [bigint], bigint],
    Array<KlineData>
  >,
  'getLogging' : ActorMethod<
    [{ 'FinishSellBatchDAO' : null } | { 'addAcceptedToken' : null }, bigint],
    Array<[bigint, string]>
  >,
  'getLogs' : ActorMethod<[bigint], Array<LogEntry>>,
  'getOrderbookCombined' : ActorMethod<
    [string, string, bigint, bigint],
    {
      'ammMidPrice' : number,
      'asks' : Array<
        {
          'ammAmount' : bigint,
          'limitAmount' : bigint,
          'price' : number,
          'limitOrders' : bigint,
        }
      >,
      'bids' : Array<
        {
          'ammAmount' : bigint,
          'limitAmount' : bigint,
          'price' : number,
          'limitOrders' : bigint,
        }
      >,
      'ammReserve0' : bigint,
      'ammReserve1' : bigint,
      'spread' : number,
    }
  >,
  'getPausedTokens' : ActorMethod<[], [] | [Array<string>]>,
  'getPoolHistory' : ActorMethod<
    [string, string, bigint],
    Array<
      [
        Time,
        Array<
          {
            'allOrNothing' : boolean,
            'token_init_identifier' : string,
            'strictlyOTC' : boolean,
            'accesscode' : string,
            'sell_principal' : string,
            'amount_init' : bigint,
            'amount_sell' : bigint,
            'init_principal' : string,
          }
        >,
      ]
    >
  >,
  'getPoolRanges' : ActorMethod<
    [string, string],
    Array<
      {
        'ratioUpper' : bigint,
        'token0Locked' : bigint,
        'liquidity' : bigint,
        'token1Locked' : bigint,
        'ratioLower' : bigint,
      }
    >
  >,
  'getPoolStats' : ActorMethod<
    [string, string],
    [] | [
      {
        'decimals0' : bigint,
        'decimals1' : bigint,
        'symbol0' : string,
        'symbol1' : string,
        'feesLifetimeToken0' : bigint,
        'feesLifetimeToken1' : bigint,
        'totalLiquidity' : bigint,
        'volume7d' : bigint,
        'reserve0' : bigint,
        'reserve1' : bigint,
        'volume24h' : bigint,
        'history' : Array<PoolDailySnapshot>,
        'activeLiquidity' : bigint,
        'feeRateBps' : bigint,
        'token0' : string,
        'token1' : string,
        'priceChange24hPct' : number,
        'lpFeeSharePct' : bigint,
        'price0' : number,
        'price1' : number,
      }
    ]
  >,
  'getPrivateTrade' : ActorMethod<[string], [] | [TradePosition]>,
  'getTokenUSDPrices' : ActorMethod<
    [number, number],
    [] | [
      {
        'data' : Array<
          [
            string,
            {
              'address' : string,
              'priceUSD' : number,
              'timeLastValidUpdate' : bigint,
            },
          ]
        >,
        'error' : boolean,
      }
    ]
  >,
  'getUserConcentratedPositions' : ActorMethod<
    [],
    Array<ConcentratedPositionDetailed>
  >,
  'getUserLiquidityDetailed' : ActorMethod<
    [],
    Array<DetailedLiquidityPosition>
  >,
  'getUserPreviousTrades' : ActorMethod<
    [string, string],
    Array<
      {
        'allOrNothing' : boolean,
        'token_init_identifier' : string,
        'strictlyOTC' : boolean,
        'accesscode' : string,
        'sell_principal' : string,
        'amount_init' : bigint,
        'amount_sell' : bigint,
        'init_principal' : string,
        'timestamp' : bigint,
      }
    >
  >,
  'getUserReferralInfo' : ActorMethod<
    [],
    {
      'referrer' : [] | [string],
      'isFirstTrade' : boolean,
      'referralEarnings' : Array<[string, bigint]>,
      'hasReferrer' : boolean,
    }
  >,
  'getUserSwapHistory' : ActorMethod<[bigint], Array<SwapRecord>>,
  'getUserTradeHistory' : ActorMethod<
    [bigint],
    Array<
      {
        'token_init_identifier' : string,
        'accesscode' : string,
        'counterparty' : string,
        'amount_init' : bigint,
        'amount_sell' : bigint,
        'timestamp' : bigint,
        'token_sell_identifier' : string,
      }
    >
  >,
  'getUserTrades' : ActorMethod<[], Array<TradePrivate2>>,
  'get_cycles' : ActorMethod<[], bigint>,
  'get_token_trends_7d' : ActorMethod<
    [Array<Principal>],
    {
        'ok' : Array<
          {
            'token' : Principal,
            'change_pct_7d' : number,
            'change_pct_24h' : number,
            'price_now' : number,
            'points' : Array<number>,
          }
        >
      } |
      { 'err' : string }
  >,
  'hmFee' : ActorMethod<[], bigint>,
  'hmRefFee' : ActorMethod<[], bigint>,
  'hmRevokeFee' : ActorMethod<[], bigint>,
  'isExchangeFrozen' : ActorMethod<[], boolean>,
  'p2a' : ActorMethod<[], string>,
  'p2acannister' : ActorMethod<[], string>,
  'p2athird' : ActorMethod<[string], string>,
  'parameterManagement' : ActorMethod<
    [
      {
        'deleteAllowedCanisters' : [] | [Array<string>],
        'changeAllowedCalls' : [] | [bigint],
        'deleteFromDayBan' : [] | [Array<string>],
        'treasury_principal' : [] | [string],
        'deleteFromAllTimeBan' : [] | [Array<string>],
        'addToAllTimeBan' : [] | [Array<string>],
        'addAllowedCanisters' : [] | [Array<string>],
        'changeallowedSilentWarnings' : [] | [bigint],
      },
    ],
    undefined
  >,
  'pauseToken' : ActorMethod<[string], undefined>,
  'recalibrateDAOpositions' : ActorMethod<
    [Array<PositionData>],
    Array<RecalibratedPosition>
  >,
  'recoverBatch' : ActorMethod<[Array<RecoveryInput>], Array<RecoveryResult>>,
  'recoverWronglysent' : ActorMethod<
    [
      string,
      bigint,
      { 'ICP' : null } |
        { 'ICRC3' : null } |
        { 'ICRC12' : null },
    ],
    boolean
  >,
  'refundStuckFunds' : ActorMethod<[], string>,
  'removeConcentratedLiquidity' : ActorMethod<
    [string, string, bigint, bigint],
    RemoveConcentratedResult
  >,
  'removeFeeCollector' : ActorMethod<[], ActionResult>,
  'removeLiquidity' : ActorMethod<
    [string, string, bigint],
    RemoveLiquidityResult
  >,
  'resetAllState' : ActorMethod<[], string>,
  'resetDriftOpTracker' : ActorMethod<[], undefined>,
  'retrieveFundsDao' : ActorMethod<[Array<[string, bigint]>], undefined>,
  'returncontractprincipal' : ActorMethod<[], string>,
  'revokeTrade' : ActorMethod<
    [
      string,
      { 'DAO' : Array<string> } |
        { 'Seller' : null } |
        { 'Initiator' : null },
    ],
    RevokeResult
  >,
  'sendDAOInfo' : ActorMethod<
    [],
    Array<
      [
        string,
        {
          'Symbol' : string,
          'Name' : string,
          'TransferFee' : bigint,
          'Decimals' : bigint,
        },
      ]
    >
  >,
  'setMinimumAmount' : ActorMethod<[string, bigint], ActionResult>,
  'setTest' : ActorMethod<[boolean], undefined>,
  'swapMultiHop' : ActorMethod<
    [string, string, bigint, Array<SwapHop>, bigint, bigint],
    SwapResult
  >,
  'swapSplitRoutes' : ActorMethod<
    [string, string, Array<SplitLeg>, bigint, bigint],
    SwapResult
  >,
  'treasurySwap' : ActorMethod<
    [string, string, bigint, bigint, bigint],
    SwapResult
  >,
  'updateTokenType' : ActorMethod<
    [string, { 'ICP' : null } | { 'ICRC3' : null } | { 'ICRC12' : null }],
    ActionResult
  >,
}
export interface pool {
  'asset_minimum_amount' : Array<[bigint, bigint]>,
  'price_day_before' : Array<number>,
  'volume_24h' : Array<bigint>,
  'amm_reserve0' : Array<bigint>,
  'amm_reserve1' : Array<bigint>,
  'asset_transferfees' : Array<[bigint, bigint]>,
  'asset_symbols' : Array<[string, string]>,
  'last_traded_price' : Array<number>,
  'pool_canister' : Array<[string, string]>,
  'asset_names' : Array<[string, string]>,
  'asset_decimals' : Array<[number, number]>,
}
export interface _SERVICE extends create_trading_canister {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
