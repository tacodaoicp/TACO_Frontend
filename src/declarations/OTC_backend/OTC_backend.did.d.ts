import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

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
export interface DetailedLiquidityPosition {
  'liquidity' : bigint,
  'shareOfPool' : number,
  'token0' : string,
  'token1' : string,
  'token0Amount' : bigint,
  'token1Amount' : bigint,
}
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
export interface KlineData {
  'low' : number,
  'high' : number,
  'close' : number,
  'open' : number,
  'volume' : bigint,
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
export interface SwapHop { 'tokenIn' : string, 'tokenOut' : string }
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
  'FinishSell' : ActorMethod<[bigint, string, bigint], string>,
  'FinishSellBatch' : ActorMethod<
    [bigint, Array<string>, Array<bigint>, string, string],
    string
  >,
  'FinishSellBatchDAO' : ActorMethod<
    [Array<TradeData>, boolean, Array<bigint>],
    [] | [BatchProcessResult]
  >,
  'FixStuckTX' : ActorMethod<[string], string>,
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
    string
  >,
  'addLiquidity' : ActorMethod<
    [string, string, bigint, bigint, bigint, bigint],
    string
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
    string
  >,
  'addTimer' : ActorMethod<[], undefined>,
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
  'claimFeesReferrer' : ActorMethod<[], Array<[string, bigint]>>,
  'collectFees' : ActorMethod<[], string>,
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
  'getAllTradesPrivateCostly' : ActorMethod<
    [],
    [] | [[Array<string>, Array<TradePrivate>]]
  >,
  'getAllTradesPublic' : ActorMethod<
    [],
    [] | [[Array<string>, Array<TradePrivate>]]
  >,
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
  'getExpectedMultiHopAmount' : ActorMethod<
    [string, string, bigint],
    {
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
      'routeDescription' : string,
      'canFulfillFully' : boolean,
      'priceImpact' : number,
      'potentialOrderDetails' : [] | [
        { 'amount_init' : bigint, 'amount_sell' : bigint }
      ],
      'expectedBuyAmount' : bigint,
    }
  >,
  'getKlineData' : ActorMethod<
    [string, string, TimeFrame, boolean],
    Array<KlineData>
  >,
  'getLogging' : ActorMethod<
    [{ 'FinishSellBatchDAO' : null } | { 'addAcceptedToken' : null }, bigint],
    Array<[bigint, string]>
  >,
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
  'hmFee' : ActorMethod<[], bigint>,
  'hmRefFee' : ActorMethod<[], bigint>,
  'hmRevokeFee' : ActorMethod<[], bigint>,
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
  'removeLiquidity' : ActorMethod<[string, string, bigint], string>,
  'retrieveFundsDao' : ActorMethod<[Array<[string, bigint]>], undefined>,
  'returncontractprincipal' : ActorMethod<[], string>,
  'revokeTrade' : ActorMethod<
    [
      string,
      { 'DAO' : Array<string> } |
        { 'Seller' : null } |
        { 'Initiator' : null },
    ],
    string
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
  'setTest' : ActorMethod<[boolean], undefined>,
  'swapMultiHop' : ActorMethod<
    [string, string, bigint, Array<SwapHop>, bigint, bigint],
    string
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
