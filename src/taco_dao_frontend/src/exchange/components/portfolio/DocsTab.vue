<template>
  <div class="docs-tab">
    <!-- View mode toggle -->
    <div class="docs-tab__view-toggle">
      <span class="docs-tab__view-toggle-label">Show examples as:</span>
      <div class="docs-tab__view-toggle-group">
        <button
          class="docs-tab__view-toggle-btn"
          :class="{ 'docs-tab__view-toggle-btn--active': viewMode === 'frontend' }"
          @click="viewMode = 'frontend'"
        >
          Frontend
        </button>
        <button
          class="docs-tab__view-toggle-btn"
          :class="{ 'docs-tab__view-toggle-btn--active': viewMode === 'dfx' }"
          @click="viewMode = 'dfx'"
        >
          dfx
        </button>
      </div>
    </div>

    <!-- Overview -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Overview</h3>
      <p class="docs-tab__text">
        The TACO Exchange combines AMM pools, an orderbook, and OTC trades on a single
        canister. Read methods are anonymous, free, and run as IC <em>queries</em>, so you
        can fan out as many in parallel as you want. Write methods are signed and mutate
        state. All amounts are raw <code>nat</code> values in the token's smallest unit.
        <code>priceImpact</code> from the backend is a 0-1 ratio. Multiply by 100 for a
        percentage.
      </p>
      <p class="docs-tab__text">
        Every example below has a <strong>Frontend</strong> form (JavaScript using
        <code>@dfinity/agent</code>) and a <strong>dfx</strong> form (raw command-line
        call against the live canister, useful for scripts, audits, or clients in any
        language). Use the toggle above to switch.
      </p>
      <p class="docs-tab__text">
        Deposits use ICRC-2 approve and pull, called <strong>V2</strong>: you approve the
        exchange as spender for the gross amount and call the V2 method. No transfer to
        the treasury, no ledger block index, and a failed call leaves nothing to recover.
        The original V1 methods (transfer first, then pass the block index) keep working
        and are documented in each section under "the old way", for older integrations
        and for tokens that are not enabled for V2.
      </p>
      <div class="docs-tab__callout docs-tab__callout--warn">
        <strong>Critical Candid type note.</strong> All token identifiers in this canister
        are <code>text</code> (the principal as a string), <strong>not</strong>
        <code>principal</code>. <code>tokenIn</code>, <code>tokenOut</code>,
        <code>tokenSell</code>, <code>tokenInit</code>, and the
        <code>tokenIn</code>/<code>tokenOut</code> fields inside <code>SwapHop</code>
        records are bare <code>"ryjl3-tyaaa-aaaaa-aaaba-cai"</code> strings in dfx. Never
        wrap them in <code>principal "..."</code>.
      </div>
    </div>

    <!-- Generated bindings -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Generated bindings</h3>
      <p class="docs-tab__text">
        The IC dashboard auto-generates the canister's interface in Candid, Motoko, Rust,
        JavaScript, and TypeScript. Copy whichever flavour fits your client.
      </p>
      <div class="docs-tab__callout docs-tab__callout--info">
        <a :href="dashboardUrl" target="_blank" rel="noopener" class="docs-tab__link">
          {{ dashboardUrl }}
        </a>
        <ul class="docs-tab__bindings">
          <li><strong>Candid</strong>: canonical <code>.did</code> file.</li>
          <li><strong>Motoko / Rust</strong>: both are IC-native canister languages; pick whichever matches your service.</li>
          <li><strong>JavaScript / TypeScript</strong>: web and Node clients via <code>@dfinity/agent</code>.</li>
        </ul>
        <p class="docs-tab__text docs-tab__text--small">
          Canister id: <code class="num">{{ canisterId }}</code>
          (resolves from <code>getCanisterId('exchange', 'ic')</code>).
        </p>
      </div>
    </div>

    <!-- Deposits: approve and pull (V2) -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Deposits: approve and pull (V2)</h3>
      <p class="docs-tab__text">
        Every trade needs a deposit. In V2 you do not transfer anything yourself:
        you approve the exchange as spender on the token's ledger, then call the V2
        method. The exchange pulls the amount with <code>icrc2_transfer_from</code>
        as part of the call. If anything is wrong (bad route, paused token, amount
        too low), the call refuses before pulling and your balance is untouched.
      </p>

      <h4 class="docs-tab__subtitle">Feature detection: check both gates</h4>
      <p class="docs-tab__text">
        V2 is enabled per token behind two switches. Route to V2 only when
        <code>getV2Enabled()</code> returns true AND the token is in
        <code>getV2AllowedTokens()</code>. Both are free anonymous queries. Checking
        only the allowlist is a trap: it is not gated by the global switch, so it can
        be non-empty while V2 is off. When either gate is closed for your token, use
        the V1 flow instead. Right now both gates are open for every accepted token.
      </p>

      <h4 class="docs-tab__subtitle">Amounts are gross</h4>
      <p class="docs-tab__text">
        <code>amountIn</code> on every V2 method is what you hand over, fees included:
        <code>gross = net + net * feeBps / 10000 + transferFee</code>, where
        <code>net</code> is the amount that actually gets swapped (and the amount you
        quote with) and <code>feeBps</code> comes from <code>hmFee()</code>. The
        backend uses the same arithmetic, so a quote for <code>net</code> and an
        execution with <code>gross</code> always agree. If you prefer not to compute
        it yourself, <code>netToGrossV2(token, net)</code> returns it on-chain.
      </p>

      <h4 class="docs-tab__subtitle">The allowance</h4>
      <p class="docs-tab__text">
        Approve the <strong>exchange canister</strong>
        (<code class="num">{{ canisterId }}</code>) as spender. Never the treasury:
        that is a V1 transfer target, and an allowance for it does nothing. The
        allowance must be at least <code>gross + transferFee</code> (the pull costs
        one ledger fee on top, charged to you). <code>requiredAllowanceV2(token, gross)</code>
        returns that number. The pull draws from your default subaccount only.
      </p>
      <p class="docs-tab__text">
        What this frontend does, and a good default for any client: read
        <code>icrc2_allowance(you, exchange)</code> first and skip the approval when it
        already covers the trade. When a new approval is needed, approve a multiple of
        the trade (this app suggests 10x) so your next trades skip the approval fee.
        An approval is its own ledger transaction with its own fee.
      </p>

      <div class="docs-tab__callout docs-tab__callout--info">
        <strong>Cost per trade.</strong> First trade on a token: net + trading fee +
        3 transfer fees (the approval, the fee inside gross, and the pull fee). Repeat
        trades under a standing allowance: net + trading fee + 2 transfer fees, the
        same as V1. A Max style fill should keep back 3 transfer fees plus the trading
        fee so the pull can never overdraw.
      </div>

      <div class="docs-tab__callout docs-tab__callout--warn">
        <strong>Never mix V1 and V2 in one action.</strong> If you transfer to the
        treasury AND call a V2 method for the same trade, you pay twice: once with
        your own transfer and once with the pull. Pick one path per action.
        Also note: on the token ledger's <code>icrc2_approve</code> the spender IS a
        <code>principal</code>. The text-not-principal rule above applies to the
        exchange canister's own arguments, not to ledger calls.
      </div>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// The pattern this app ships (see exchange/utils/deposit.ts).
const v2 = store.useV2Deposit(tokenIn)          // both gates, cached
const gross = calculateRequiredDeposit(net, store.tradingFeeBps, transferFee)

if (v2) {
  // Checks the standing allowance first; only approves (and only asks the
  // user) when the allowance does not cover gross + transferFee.
  await approveExchangeDeposit(tokenIn, gross, transferFee)
  // ...then call the V2 method, no block index. See the sections below.
}</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Both gates (anonymous queries, free):
dfx canister --network ic call {{ canisterId }} getV2Enabled '()'
dfx canister --network ic call {{ canisterId }} getV2AllowedTokens '()'

# What to approve for a given gross:
dfx canister --network ic call {{ canisterId }} requiredAllowanceV2 \
  '("&lt;TOKEN_LEDGER&gt;", 1_000_000_000 : nat)'

# Approve on the TOKEN LEDGER (spender is a principal here):
dfx canister --network ic --identity my-key call &lt;TOKEN_LEDGER&gt; icrc2_approve \
  '(record {
     spender = record { owner = principal "{{ canisterId }}"; subaccount = null };
     amount = 1_000_010_000 : nat;   // gross + transferFee
     fee = null; memo = null; from_subaccount = null;
     created_at_time = null; expected_allowance = null; expires_at = null })'</code></pre>

      <h4 class="docs-tab__subtitle">When a V2 call fails</h4>
      <ul class="docs-tab__list">
        <li>
          <code>InvalidInput "V2 disabled"</code> or
          <code>"Token not enabled for V2 ..."</code>: the gates are closed for this
          token. Nothing moved. Use the V1 flow.
        </li>
        <li>
          <code>InvalidInput "V2 temporarily unavailable ..."</code>: capacity limit.
          Nothing moved. Safe to retry in a few minutes.
        </li>
        <li>
          <code>InsufficientFunds "V2 pull ... declined"</code>: your allowance or
          balance was too low at pull time. Nothing was kept; on two-token calls a
          first pull that already landed is refunded automatically.
        </li>
        <li>
          <code>SystemError</code> naming a pull id with "outcome UNKNOWN":
          <strong>do not retry</strong>. The ledger did not confirm the pull either
          way. The deposit is tracked on chain, you can see it with
          <code>getMyPendingPulls()</code> (a signed query), and an admin resolves it
          exactly once.
        </li>
        <li>
          <code>SlippageExceeded</code> on V2 settles on chain: the below-minimum
          output was delivered, or only the net was refunded. Check your balance
          before assuming the funds are waiting for a retry.
        </li>
      </ul>
    </div>

    <!-- Quoting -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Quoting</h3>
      <p class="docs-tab__text">
        Four quote endpoints, all anonymous queries (free, no rate limit, no signature
        required):
      </p>
      <ul class="docs-tab__list">
        <li>
          <code>getExpectedReceiveAmount(tokenSell, tokenBuy, amount)</code>: tries the
          direct AMM+orderbook pool first, then falls back to a multi-hop route only if
          the direct pool can't absorb the size. Returns
          <code>{ fee, hopDetails, routeDescription, canFulfillFully, priceImpact, potentialOrderDetails?, expectedBuyAmount }</code>.
        </li>
        <li>
          <code>getExpectedReceiveAmountBatch(requests[])</code>: same shape as above but
          batched. Each request returns the canister's single best route. Requests are
          isolated, request <em>N</em> sees the same pre-swap state as request 0
          (snapshot/restore around <code>orderPairing</code>'s mutations of
          <code>AMMpools</code>, <code>poolV3Data</code>, <code>pool_history</code>,
          <code>tempTransferQueue</code>).
        </li>
        <li>
          <code>getExpectedReceiveAmountBatchMulti(requests[], maxRoutesPerRequest)</code>:
          <strong>multi-route variant</strong>. Returns the <em>top N routes</em> per
          request (sorted by <code>expectedBuyAmount</code> desc), capped at 10. Defaults
          to 5 if <code>maxRoutesPerRequest</code> is 0. Each route entry includes
          <code>routeTokens: [Text]</code> = <code>[tokenSell, …intermediates, tokenBuy]</code>
         , a stable identifier you can use to match the same physical route across
          different fractions when constructing splits. <strong>Use this for the
          split-route optimizer.</strong>
        </li>
        <li>
          <code>getExpectedMultiHopAmount(tokenIn, tokenOut, amountIn)</code>: pathfinder
          from the start; always returns a structured
          <code>bestRoute: SwapHop[]</code> ready to feed into <code>swapMultiHop</code>,
          even for 1-hop direct routes.
        </li>
      </ul>

      <div class="docs-tab__callout docs-tab__callout--info">
        <strong>Picking between them.</strong> For a single price preview use
        <code>getExpectedReceiveAmount</code> or <code>getExpectedMultiHopAmount</code>.
        For a single-route price grid (e.g. depth chart at multiple sizes) use
        <code>getExpectedReceiveAmountBatch</code>. <strong>For split-route discovery
        across the full route × fraction grid use
        <code>getExpectedReceiveAmountBatchMulti</code></strong>, the per-request
        <code>routes[]</code> array is what makes "50% via direct + 50% via 2hop"
        evaluable from a single round-trip.
      </div>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// Single quote (pathfinder, always returns bestRoute)
const q = await store.getExpectedMultiHopAmount(
  tokenIn,
  tokenOut,
  1_000_000_000n,
)

// Multi-route batch, ONE round-trip, top-N routes per fraction.
// Use this for split discovery: the routes[] arrays carry the full
// route × fraction grid the combine logic needs.
const sizes = [1_000n, 5_000n, 10_000n].map(n =&gt; n * 1_000_000n)
const multi = await store.getExpectedReceiveAmountBatchMulti(
  sizes.map(amountSell =&gt; ({ tokenSell: tokenIn, tokenBuy: tokenOut, amountSell })),
  5n,                              // up to 5 routes per request, 0 = default 5
)
// Each entry: { routes: [{ expectedBuyAmount, fee, priceImpact,
//                          routeDescription, routeTokens, hopDetails, ... }, ...] }
// Routes are sorted by expectedBuyAmount desc; routes[0] is the canister's best
// pick (same as getExpectedReceiveAmountBatch would have returned).

// Single-route batch (legacy, still useful for non-split price grids).
const batch = await store.getExpectedReceiveAmountBatch(
  sizes.map(amountSell =&gt; ({ tokenSell: tokenIn, tokenBuy: tokenOut, amountSell })),
)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Single anonymous query (free)
dfx canister --network ic call {{ canisterId }} getExpectedMultiHopAmount \
  '("{{ icpLedger }}", "{{ ckusdcLedger }}", 1_000_000_000 : nat)'

# Multi-route batch, one call, top-N routes per fraction (split-route optimizer).
dfx canister --network ic call {{ canisterId }} getExpectedReceiveAmountBatchMulti \
  '(vec {
     record { tokenSell = "{{ icpLedger }}"; tokenBuy = "{{ ckusdcLedger }}"; amountSell = 100_000_000 : nat };
     record { tokenSell = "{{ icpLedger }}"; tokenBuy = "{{ ckusdcLedger }}"; amountSell = 1_000_000_000 : nat };
     record { tokenSell = "{{ icpLedger }}"; tokenBuy = "{{ ckusdcLedger }}"; amountSell = 10_000_000_000 : nat };
   },
   5 : nat)'

# Single-route batch (still works; one quote per request).
dfx canister --network ic call {{ canisterId }} getExpectedReceiveAmountBatch \
  '(vec {
     record { tokenSell = "{{ icpLedger }}"; tokenBuy = "{{ ckusdcLedger }}"; amountSell = 100_000_000 : nat };
     record { tokenSell = "{{ icpLedger }}"; tokenBuy = "{{ ckusdcLedger }}"; amountSell = 1_000_000_000 : nat };
   })'</code></pre>

      <p class="docs-tab__text docs-tab__text--small">
        All four endpoints are anonymous queries, no rate limit, no fee, no signature.
        The single-route batch saves a round-trip vs <em>N</em> sequential calls; the
        multi-route batch additionally returns alternative routes the single-best variant
        would discard, which is exactly the data a split-route engine needs.
      </p>
      <div class="docs-tab__callout docs-tab__callout--info">
        <strong>Quotes take net, V2 execution takes gross.</strong> Keep quoting with
        the endpoints above using the net amount (what gets swapped), then compute
        <code>gross</code> for the V2 call as shown in the deposits section. The backend
        guarantees the two agree: executing <code>gross</code> swaps exactly the
        <code>net</code> you quoted, or slightly more from rounding in your favor.
      </div>
    </div>

    <!-- Split-route discovery -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Split-route discovery (route × fraction grid)</h3>
      <p class="docs-tab__text">
        The canister accepts split orders that route a single deposit through several
        independent paths via <code>swapSplitRoutesV2</code> (or the older
        <code>swapSplitRoutes</code>). To find the optimal split,
        fetch quotes for every 10% slice using the <strong>multi-route batch
        endpoint</strong>, then enumerate combinations. The endpoint returns top-N routes
        per fraction in one round-trip, so the full <em>route × fraction</em> grid
        comes back from a single canister call.
      </p>
      <div class="docs-tab__callout docs-tab__callout--warn">
        <strong>Distinct-pools constraint (edge-level, not path-level).</strong> Reject
        any combination where two legs touch the same pool, even if their full paths
        differ. Quotes are independent; the second leg through a shared pool would
        execute against state depleted by the first leg and deliver less than its quote
        promised. Decompose each route into its hop edges (<code>{tokenA, tokenB}</code>
        pairs, normalised by sort order) and reject any plan where any single edge
        appears in more than one leg. The route-level
        <code>routeTokens.join('→')</code> identifier is NOT sufficient: two legs with
        different overall paths can still share an individual pool edge, e.g.
        <code>cICP→ckUSDC→ckBTC→ICP</code> and <code>cICP→ckUSDC→ICP</code> both consume
        the <code>cICP/ckUSDC</code> pool on their first hop.
      </div>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// One round-trip: top-5 routes per fraction (10%, 20%, ..., 100%).
const splitBPs = [10000n, 1000n, 2000n, 3000n, 4000n, 5000n, 6000n, 7000n, 8000n, 9000n]
const requests = splitBPs
  .map(bp =&gt; ({ bp, amt: fullAmount * bp / 10000n }))
  .filter(r =&gt; r.amt &gt; 0n)

const results = await store.getExpectedReceiveAmountBatchMulti(
  requests.map(r =&gt; ({ tokenSell: tokenIn, tokenBuy: tokenOut, amountSell: r.amt })),
  5n,
)

// Flatten into one entry per (fraction, route). edgeKeys is the per-pool
// identifier used by the edge-level conflict filter below.
const edgeKey = (a, b) =&gt; a &lt; b ? `${a}|${b}` : `${b}|${a}`
const allQuotes = []
for (let i = 0; i &lt; requests.length; i++) {
  const req = requests[i]
  for (const r of results[i].routes ?? []) {
    if (r.expectedBuyAmount &lt;= 0n) continue
    allQuotes.push({
      bp: Number(req.bp),
      amountIn: req.amt,
      expectedOut: r.expectedBuyAmount,
      hopDetails: r.hopDetails,
      route: r.hopDetails.map(h =&gt; ({ tokenIn: h.tokenIn, tokenOut: h.tokenOut })),
      edgeKeys: r.hopDetails.map(h =&gt; edgeKey(h.tokenIn, h.tokenOut)),
    })
  }
}

// Baseline: the unsplit best is allQuotes[0] (fraction 100%, top route).
const fullOut = allQuotes.find(q =&gt; q.bp === 10000).expectedOut

// Enumerate 2/3/4/5-leg combos whose bps sum to 10000. Reject any plan
// where two legs share even a single pool edge, that's a double-execution
// against the same pool and would deliver less than the summed quotes.
function tryPlan(legs) {
  const seen = new Set()
  for (const leg of legs) {
    for (const e of leg.edgeKeys) {
      if (seen.has(e)) return null  // pool conflict, discard
      seen.add(e)
    }
  }
  const totalOut = legs.reduce((s, l) =&gt; s + l.expectedOut, 0n)
  if (totalOut &lt;= fullOut) return null  // doesn't beat unsplit
  return { legs, totalOut }
}

// Pick the plan with the largest totalOut and submit via swapSplitRoutes
// only if it beats fullOut by &gt; 0.1%.</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># One call returns the full route × fraction grid (top-5 routes per fraction).
dfx canister --network ic call {{ canisterId }} getExpectedReceiveAmountBatchMulti \
  '(vec {
     record { tokenSell = "$TOKEN_IN"; tokenBuy = "$TOKEN_OUT"; amountSell = '"$FULL_AMOUNT"' : nat };
     record { tokenSell = "$TOKEN_IN"; tokenBuy = "$TOKEN_OUT"; amountSell = '"$(( FULL_AMOUNT / 10 ))"' : nat };
     record { tokenSell = "$TOKEN_IN"; tokenBuy = "$TOKEN_OUT"; amountSell = '"$(( FULL_AMOUNT * 2 / 10 ))"' : nat };
     // ... repeat for 30, 40, 50, 60, 70, 80, 90 %
   },
   5 : nat)'

# Each response entry has a routes : vec { ... routeTokens : vec text; ... }.
# Build routeKey = string-join routeTokens with '→' (or any separator).
# Apply the distinct-routeKey rule client-side; dfx does not pick the combination for you.</code></pre>

      <p class="docs-tab__text docs-tab__text--small">
        The frontend's <code>useSwapFlow</code> composable implements exactly this
        algorithm, fetch the multi-route batch, flatten into a route × fraction grid,
        enumerate 2/3/4/5-way combinations, reject duplicate routes, and accept the best
        one that beats the unsplit baseline by more than 0.1%.
      </p>
      <div class="docs-tab__callout docs-tab__callout--info">
        <strong>Executing a split on V2.</strong>
        <code>swapSplitRoutesV2(tokenIn, tokenOut, splits, minAmountOut)</code> with
        <code>splits = vec { record { amountIn; route; minLegOut } }</code>.
        Each leg's <code>amountIn</code> is a <strong>gross share</strong>: scale your
        net legs so they sum to the gross total
        (<code>grossLeg[i] = netLeg[i] * grossTotal / netTotal</code>, floor, add the
        remainder to leg 0). One approval and one pull cover the whole sum; the backend
        nets the total once and re-apportions with the same rule, so the dust is
        sub-unit. <code>minLegOut</code> is accepted but not enforced; rely on the
        aggregate <code>minAmountOut</code>. On V1 the legs are net shares and the call
        takes the deposit block index as a fifth argument.
      </div>
    </div>

    <!-- Submitting a swap -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Submitting a swap</h3>
      <p class="docs-tab__text">
        <code>swapMultiHopV2</code> executes immediately against AMM/orderbook
        liquidity. Approve first (deposits section above), then call. Every field:
      </p>
      <ul class="docs-tab__list">
        <li><code>tokenIn: text</code>: canister id of the token you hand over.</li>
        <li><code>tokenOut: text</code>: canister id of the token you receive.</li>
        <li><code>amountIn: nat</code>: the <strong>gross</strong> amount in <code>tokenIn</code>'s smallest unit. The exchange pulls exactly this.</li>
        <li><code>route: vec SwapHop</code>: ordered hops <code>[{tokenIn, tokenOut}, ...]</code>. Use <code>bestRoute</code> from the quote.</li>
        <li><code>minAmountOut: nat</code>: slippage floor, derived from the quote for the net. Convention: <code>expectedAmountOut * (10000 - slippageBP) / 10000</code>.</li>
      </ul>
      <p class="docs-tab__text">
        Returns <code>{ Ok: SwapOk } | { Err: ExchangeError }</code> with
        <code>SwapOk = { fee, tokenIn, tokenOut, hops, firstHopOrderbookMatch, amountIn, amountOut, swapId, route, lastHopAMMOnly }</code>.
        On V2, <code>SwapOk.amountIn</code> echoes the gross you passed (on V1 it is
        the net). For multi-leg execution use <code>swapSplitRoutesV2</code>; see the
        split-route section above for how the legs are built.
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// Same flow the easy swap ships.
const v2 = store.useV2Deposit(tokenIn)
const gross = calculateRequiredDeposit(net, store.tradingFeeBps, transferFee)

let result
if (v2) {
  await approveExchangeDeposit(tokenIn, gross, transferFee)
  result = await store.swapMultiHopV2(
    tokenIn,
    tokenOut,
    gross,                              // gross, fees included
    quote.bestRoute,                    // [{ tokenIn, tokenOut }, ...]
    expectedOut * 9950n / 10000n,       // 0.5% slippage floor
  )
} else {
  const block = await depositToken(/* V1 transfer, see the old way below */)
  result = await store.swapMultiHop(tokenIn, tokenOut, net, quote.bestRoute,
    expectedOut * 9950n / 10000n, block)
}
if ('Err' in result) handleError(result.Err)
else console.log('filled', result.Ok.amountOut)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># 1. Approve on the token ledger (see the deposits section).
# 2. UPDATE call, five args, no block index. Sign with --identity.
dfx canister --network ic --identity my-key call {{ canisterId }} swapMultiHopV2 \
  '("&lt;TOKEN_IN&gt;",
    "&lt;TOKEN_OUT&gt;",
    1_000_510_000 : nat,
    vec {
      record { tokenIn = "&lt;TOKEN_IN&gt;"; tokenOut = "&lt;INTERMEDIATE&gt;" };
      record { tokenIn = "&lt;INTERMEDIATE&gt;"; tokenOut = "&lt;TOKEN_OUT&gt;" };
    },
    995_000_000 : nat)'
# amountIn here is the GROSS: net 1_000_000_000 + 0.05% trading fee + transfer fee.</code></pre>

      <h4 class="docs-tab__subtitle">The old way: transfer plus block index (V1)</h4>
      <p class="docs-tab__text">
        V2 is the better way to swap: fewer things to get wrong, one less unit
        conversion, and a refused call leaves nothing to recover. V1 keeps working and
        stays documented here for older integrations and for tokens that are not
        enabled for V2. The differences: you transfer the gross to the treasury
        yourself, pass the transfer's block index as a sixth argument, and
        <code>amountIn</code> is the <strong>net</strong>, not the gross.
      </p>
      <ul class="docs-tab__list">
        <li><code>amountIn: nat</code>: the net amount. Must already be deposited (transfer <code>gross</code>, pass <code>net</code>).</li>
        <li><code>blockNumber: nat</code>: ledger block index of your deposit transfer; the backend verifies it.</li>
      </ul>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>const result = await store.swapMultiHop(
  tokenIn,
  tokenOut,
  amountIn,                           // NET on V1
  quote.bestRoute,                    // [{ tokenIn, tokenOut }, ...]
  expectedOut * 9950n / 10000n,       // 0.5% slippage floor
  depositBlockNumber,
)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># V1: transfer gross to the TREASURY first, then pass net + block index.
dfx canister --network ic --identity my-key call {{ canisterId }} swapMultiHop \
  '("&lt;TOKEN_IN&gt;",
    "&lt;TOKEN_OUT&gt;",
    1_000_000_000 : nat,
    vec {
      record { tokenIn = "&lt;TOKEN_IN&gt;"; tokenOut = "&lt;INTERMEDIATE&gt;" };
      record { tokenIn = "&lt;INTERMEDIATE&gt;"; tokenOut = "&lt;TOKEN_OUT&gt;" };
    },
    995_000_000 : nat,
    42_000_000 : nat)'</code></pre>

      <p class="docs-tab__text docs-tab__text--small">
        V1 prerequisite: deposit your tokens via ICRC1 transfer to the treasury. The
        transfer's block index is the <code>blockNumber</code> argument.
      </p>
    </div>

    <!-- Limit / OTC -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Limit orders &amp; OTC trades (addPositionV2)</h3>
      <p class="docs-tab__text">
        <code>addPositionV2</code> is a single entry point for resting orders at a fixed
        price (its V1 twin <code>addPosition</code> is documented further down). The
        <code>pub</code> flag picks the mode:
      </p>
      <ul class="docs-tab__list">
        <li>
          <code>pub: true</code>: <strong>public limit order</strong>. Posted to the
          public orderbook; anyone can match against it. No access code needed by
          counterparties.
        </li>
        <li>
          <code>pub: false</code>: <strong>private OTC trade</strong>. Only fillable by
          someone who holds the access code returned at creation. Invisible to the
          orderbook.
        </li>
      </ul>
      <p class="docs-tab__text">
        Both modes share a fixed-ratio model (no AMM slippage; the price is locked at the
        ratio <code>amountSell / amountInit</code>, want per offer) and the same lifecycle
        (create → fill → optional revoke). Only the visibility differs.
      </p>

      <div class="docs-tab__callout docs-tab__callout--warn">
        <strong>Naming gotcha.</strong> In <code>addPosition</code>,
        <code>tokenInit</code> / <code>amountInit</code> is the <strong>offer</strong>
        (the token and amount you deposit to fund the order), and
        <code>tokenSell</code> / <code>amountSell</code> is what you <strong>want</strong>
        in return (the token and amount the counterparty must send to fill). "Init" is
        the side that <em>initiates</em> the trade by depositing; "sell" is the side the
        counterparty sells to you.
      </div>

      <h4 class="docs-tab__subtitle">1. Create</h4>
      <p class="docs-tab__text">
        <code>addPositionV2</code>: approve <code>tokenInit</code> for the gross of your
        offer (deposits section above), then call. Same arguments as the old
        <code>addPosition</code> minus the block index:
      </p>
      <ul class="docs-tab__list">
        <li><code>amountSell: nat</code>: what you <strong>want</strong> in return (in <code>tokenSell</code>'s smallest unit). The counterparty must send this much.</li>
        <li><code>amountInit: nat</code>: the <strong>gross</strong> of what you're offering (in <code>tokenInit</code>'s smallest unit). The exchange pulls exactly this; the order itself is stored net-sized, so <code>filled</code> and <code>remaining</code> are in net units.</li>
        <li><code>tokenSell: text</code>: canister id of the token you want in return.</li>
        <li><code>tokenInit: text</code>: canister id of the token you're offering (the one being pulled).</li>
        <li><code>pub: bool</code>: the limit-vs-OTC switch. <code>true</code> = public limit order, <code>false</code> = private OTC.</li>
        <li><code>excludeDAO: bool</code>: <code>true</code> blocks DAO automated matching.</li>
        <li><code>oc: opt text</code>: optional OTC name/label.</li>
        <li><code>referrer: text</code>: referrer principal as text, or <code>""</code>.</li>
        <li><code>allOrNothing: bool</code>: <code>true</code> requires the order be filled in one transaction.</li>
        <li><code>strictlyOTC: bool</code>: <code>true</code> disables AMM/orderbook matching entirely; only manual fills via access code. Pair with <code>pub: false</code> for the strictest peer-to-peer mode.</li>
      </ul>

      <div class="docs-tab__callout docs-tab__callout--info">
        <strong>DAO accessibility.</strong> For a private OTC order to be matchable by
        the TACO DAO, ALL THREE of these must be <code>false</code>:
        <code>excludeDAO</code>, <code>strictlyOTC</code>, <code>allOrNothing</code>.
        Setting ANY of them to <code>true</code> disables DAO matching, even when
        <code>pub = false</code>. The OTCView visibility radio sets
        <code>excludeDAO</code>; the Advanced Settings checkboxes set the other two.
        The exchange UI now surfaces the combined state next to the create form (live
        green/amber pill).
      </div>

      <p class="docs-tab__text">
        Returns <code>{ Ok: OrderOk } | { Err }</code>. <code>OrderOk.accessCode</code> is
        the 32+ char string. Share it with your counterparty for OTC, or keep it as your
        revoke handle for public limit orders. An empty string means the order filled
        instantly against existing liquidity.
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// Private OTC on V2. Approve tokenOffered first; share the returned accessCode.
// amountInit / tokenInit = what you OFFER (gross, pulled by the exchange).
// amountSell / tokenSell = what you WANT in return.
const grossOffer = calculateRequiredDeposit(amountOffered, store.tradingFeeBps, offerTransferFee)
await approveExchangeDeposit(tokenOffered, grossOffer, offerTransferFee)
const result = await store.addPositionV2(
  amountWanted,                // amountSell:  what counterparty must send
  grossOffer,                  // amountInit:  gross of what you offer
  tokenWanted,                 // tokenSell:   what you want
  tokenOffered,                // tokenInit:   what the exchange pulls
  /* pub */          false,    // false = private OTC, true = public limit
  /* excludeDAO */   false,
  /* oc */           [],       // or ['my-otc-label']
  /* referrer */     '',
  /* allOrNothing */ false,
  /* strictlyOTC */  true,
)
if ('Ok' in result) shareLink(`${origin}/otc/${result.Ok.accessCode}`)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Example: offer ~100 ICP gross (tokenInit), want 50 ckUSDC (tokenSell).
# Approve the exchange on the ICP ledger first (deposits section), then:
dfx canister --network ic --identity my-key call {{ canisterId }} addPositionV2 \
  '(50_000_000 : nat,         // amountSell:  what you WANT in return
    100_060_000 : nat,        // amountInit:  GROSS of what you offer
    "&lt;TOKEN_WANTED&gt;",        // tokenSell  (text, not principal)
    "&lt;TOKEN_OFFERED&gt;",       // tokenInit  (text, not principal)
    false,                    // pub: false = OTC, true = public limit
    false,                    // excludeDAO
    null,                     // oc: opt text. null or (opt "label")
    "",                       // referrer
    false,                    // allOrNothing
    true)'                    // strictlyOTC</code></pre>

      <h4 class="docs-tab__subtitle">2. Share (OTC only)</h4>
      <p class="docs-tab__text">
        Build a link: <code>{{ origin }}/otc/&lt;accessCode&gt;</code>. Anyone with the
        link can call <code>getPrivateTrade(accessCode)</code> to inspect the order before
        filling. Public limit orders skip this step; they're discoverable through normal
        orderbook queries.
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>const trade = await store.getPrivateTrade(accessCode) // [] | [TradePosition]</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Anonymous query. Works for both private OTC codes AND public-prefixed codes
# (public limit orders' access codes start with "Public"; the backend routes accordingly).
dfx canister --network ic call {{ canisterId }} getPrivateTrade '("&lt;ACCESS_CODE&gt;")'</code></pre>

      <h4 class="docs-tab__subtitle">3. Counterparty fills</h4>
      <p class="docs-tab__text">
        <code>FinishSellV2(accessCode, amountSelling)</code>. The filler approves and
        hands over <code>tokenSell</code> (the token the creator <em>wants</em>) and
        receives <code>tokenInit</code> (the token the creator <em>offered</em>) in
        return. <code>amountSelling</code> is the <strong>gross</strong> of what they
        send. Over-fills are clamped to the order's remainder and the excess pull is
        refunded automatically, so a max style fill cannot overshoot. With
        <code>allOrNothing = false</code> the same order can be partially filled by
        multiple counterparties until <code>filledSell == amountSell</code>.
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// Filler side on V2: approve the order's sell token, then fill with the gross.
const gross = calculateRequiredDeposit(fillAmount, store.tradingFeeBps, sellTransferFee)
await approveExchangeDeposit(orderSellToken, gross, sellTransferFee)
const result = await store.finishSellV2(accessCode, gross)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Approve the exchange on the order's sell-token ledger first, then:
dfx canister --network ic --identity my-key call {{ canisterId }} FinishSellV2 \
  '("&lt;ACCESS_CODE&gt;", 25_022_500 : nat)'
# amountSelling is the GROSS (plain nat; the old nat64 block quirk is V1 only).</code></pre>

      <h4 class="docs-tab__subtitle">The old way: create and fill with a block index (V1)</h4>
      <p class="docs-tab__text">
        V2 is the better path for both sides: no treasury transfer, no block index, and
        a refused call costs nothing. V1 keeps working and stays documented here for
        older integrations and for tokens that are not enabled for V2. On V1 you
        transfer the gross to the treasury yourself and the amounts are
        <strong>net</strong>: <code>addPosition</code> takes the deposit's block index
        as its first argument, and <code>FinishSell(blockNumber, accessCode, amount)</code>
        takes the filler's deposit block as a <code>nat64</code> (the only update method
        on this canister that uses nat64 instead of nat).
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// V1 create (amountInit is what you deposited, net of nothing; block from your transfer)
const created = await store.addPosition(
  depositBlock,
  amountWanted, amountOffered,
  tokenWanted, tokenOffered,
  false, false, [], '', false, true,
)
// V1 fill
const filled = await store.finishSell(depositBlock, accessCode, fillAmount)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># V1 create: 11 args, block index first.
dfx canister --network ic --identity my-key call {{ canisterId }} addPosition \
  '(42_000_000 : nat,         // blockNumber of your tokenInit deposit
    50_000_000 : nat,         // amountSell:  what you WANT in return
    100_000_000 : nat,        // amountInit:  what you OFFERED / deposited
    "&lt;TOKEN_WANTED&gt;",
    "&lt;TOKEN_OFFERED&gt;",
    false, false, null, "", false, true)'

# V1 fill: block is NAT64 here.
dfx canister --network ic --identity my-key call {{ canisterId }} FinishSell \
  '(42_000_000 : nat64, "&lt;ACCESS_CODE&gt;", 25_000_000 : nat)'</code></pre>

      <h4 class="docs-tab__subtitle">4. Cancel</h4>
      <p class="docs-tab__text">
        <code>revokeTrade(accessCode, { Initiator: null })</code>, identical on both
        paths: cancelling moves no deposit, so there is no V2 twin. A revoke fee is
        deducted (calculated as
        <code>(amount * tradingFeeBps / 10000) / revokeFeeDivisor</code>). DAO and Seller
        revoke variants exist for governance/dispute scenarios.
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>await store.revokeTrade(accessCode, { Initiator: null })</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># variant { Initiator } | variant { Seller } | variant { DAO = vec { "..." } }
dfx canister --network ic --identity my-key call {{ canisterId }} revokeTrade \
  '("&lt;ACCESS_CODE&gt;", variant { Initiator })'</code></pre>

      <div class="docs-tab__callout docs-tab__callout--info">
        <strong>swapMultiHop vs addPosition.</strong> <code>swapMultiHop</code> /
        <code>swapSplitRoutes</code> execute <em>immediately</em> against AMM/orderbook
        liquidity, with slippage. <code>addPosition</code> creates a <em>resting</em> order
        at a fixed price (limit or OTC) that waits for a counterparty.
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCanisterId } from '../../../constants/canisterIds'

type ViewMode = 'frontend' | 'dfx'
const viewMode = ref<ViewMode>('frontend')

const canisterId = computed(() => getCanisterId('exchange', 'ic'))
const dashboardUrl = computed(() => `https://dashboard.internetcomputer.org/canister/${canisterId.value}#interface`)
const origin = computed(() => (typeof window !== 'undefined' ? window.location.origin : 'https://exchange.tacodao.com'))

const icpLedger = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const ckusdcLedger = 'xevnm-gaaaa-aaaar-qafnq-cai'
</script>

<style scoped lang="scss">
.docs-tab {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 800px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__subtitle {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: var(--space-2) 0 0;
  }

  &__text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;

    &--small {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
  }

  &__list {
    margin: 0;
    padding-left: var(--space-5);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: 1.6;

    li {
      margin-bottom: var(--space-1);
    }
  }

  &__view-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--bg-secondary);
    padding: var(--space-2) 0;
    margin: calc(var(--space-2) * -1) 0 0;
  }

  &__view-toggle-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__view-toggle-group {
    display: inline-flex;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
  }

  &__view-toggle-btn {
    background: none;
    border: 0;
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: var(--space-1) var(--space-3);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover { color: var(--text-primary); }

    &--active {
      background: var(--accent-primary-muted, rgba(196, 90, 10, 0.15));
      color: var(--accent-primary, var(--gold));
    }
  }

  &__code {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    padding: var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.5;
    color: var(--text-primary);
    overflow-x: auto;
    margin: 0;
    white-space: pre;

    code {
      background: none;
      padding: 0;
      font-family: inherit;
      color: inherit;
    }
  }

  &__callout {
    padding: var(--space-3);
    border-radius: 6px;
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--text-secondary);

    &--warn {
      background: rgba(196, 90, 10, 0.08);
      border: 1px solid rgba(196, 90, 10, 0.3);
    }

    &--info {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
    }
  }

  &__link {
    color: var(--accent-primary);
    word-break: break-all;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  &__bindings {
    margin: var(--space-2) 0;
    padding-left: var(--space-5);
    font-size: var(--text-sm);
    line-height: 1.6;

    li { margin-bottom: var(--space-1); }
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--bg-tertiary);
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--text-primary);
  }
}
</style>
