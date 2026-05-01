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
    </div>

    <!-- Split-route discovery -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Split-route discovery (route × fraction grid)</h3>
      <p class="docs-tab__text">
        The canister accepts split orders that route a single deposit through several
        independent paths via <code>swapSplitRoutes</code>. To find the optimal split,
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
        one that beats the unsplit baseline by more than 0.1%. The same
        <code>swapSplitRoutes</code> update call executes the chosen plan atomically.
      </p>
    </div>

    <!-- Submitting a swap -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Submitting a swap</h3>
      <p class="docs-tab__text">
        <code>swapMultiHop</code> executes immediately against AMM/orderbook liquidity.
        Every field:
      </p>
      <ul class="docs-tab__list">
        <li><code>tokenIn: text</code>: canister id of the token you deposit.</li>
        <li><code>tokenOut: text</code>: canister id of the token you receive.</li>
        <li><code>amountIn: nat</code>: raw amount in <code>tokenIn</code>'s smallest unit. Must already be deposited.</li>
        <li><code>route: vec SwapHop</code>: ordered hops <code>[{tokenIn, tokenOut}, ...]</code>. Use <code>bestRoute</code> from the quote.</li>
        <li><code>minAmountOut: nat</code>: slippage floor. Convention: <code>expectedAmountOut * (10000 - slippageBP) / 10000</code>. Tx reverts if delivered amount falls below this.</li>
        <li><code>blockNumber: nat</code>: ledger block index of your prior deposit transfer; the backend verifies it.</li>
      </ul>
      <p class="docs-tab__text">
        Returns <code>{ Ok: SwapOk } | { Err: ExchangeError }</code> with
        <code>SwapOk = { fee, tokenIn, tokenOut, hops, firstHopOrderbookMatch, amountIn, amountOut, swapId, route, lastHopAMMOnly }</code>.
        For multi-leg execution use <code>swapSplitRoutes</code> (same first/last args, but
        <code>splits = vec { record { amountIn; route; minLegOut } }</code>).
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>const result = await store.swapMultiHop(
  tokenIn,
  tokenOut,
  amountIn,
  quote.bestRoute,                    // [{ tokenIn, tokenOut }, ...]
  expectedOut * 9950n / 10000n,       // 0.5% slippage floor
  depositBlockNumber,
)
if ('Err' in result) handleError(result.Err)
else console.log('filled', result.Ok.amountOut)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># UPDATE call. Sign with --identity.
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
        Prerequisite: deposit your tokens to the exchange canister via ICRC1/ICRC2
        transfer. The transfer's block index is the <code>blockNumber</code> argument.
      </p>
    </div>

    <!-- Limit / OTC -->
    <div class="docs-tab__section">
      <h3 class="docs-tab__title">Limit orders &amp; OTC trades (addPosition)</h3>
      <p class="docs-tab__text">
        <code>addPosition</code> is a single entry point for resting orders at a fixed
        price. The <code>pub</code> flag picks the mode:
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
      <ul class="docs-tab__list">
        <li><code>blockNumber: nat</code>: block index of your deposit of <code>tokenInit</code> to the exchange canister.</li>
        <li><code>amountSell: nat</code>: what you <strong>want</strong> in return (in <code>tokenSell</code>'s smallest unit). The counterparty must send this much.</li>
        <li><code>amountInit: nat</code>: what you're <strong>offering</strong> / depositing (in <code>tokenInit</code>'s smallest unit). This is the amount that funded the order.</li>
        <li><code>tokenSell: text</code>: canister id of the token you want in return.</li>
        <li><code>tokenInit: text</code>: canister id of the token you're offering (the one you deposited).</li>
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

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// Private OTC. You deposited offerToken first; share the returned accessCode.
// amountInit / tokenInit = what you OFFERED (deposited).
// amountSell / tokenSell = what you WANT in return.
const result = await store.addPosition(
  depositBlock,
  amountWanted,                // amountSell:  what counterparty must send
  amountOffered,               // amountInit:  what you deposited
  tokenWanted,                 // tokenSell:   what you want
  tokenOffered,                // tokenInit:   what you deposited
  /* pub */          false,    // false = private OTC, true = public limit
  /* excludeDAO */   false,
  /* oc */           [],       // or ['my-otc-label']
  /* referrer */     '',
  /* allOrNothing */ false,
  /* strictlyOTC */  true,
)
if ('Ok' in result) shareLink(`${origin}/otc/${result.Ok.accessCode}`)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Example: offer 100 ICP (tokenInit), want 50 ckUSDC (tokenSell).
dfx canister --network ic --identity my-key call {{ canisterId }} addPosition \
  '(42_000_000 : nat,         // blockNumber of your tokenInit deposit
    50_000_000 : nat,         // amountSell:  what you WANT in return
    100_000_000 : nat,        // amountInit:  what you OFFERED / deposited
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
        <code>finishSell(blockNumber, accessCode, amount)</code>. The filler deposits
        <code>tokenSell</code> (the token the creator <em>wants</em>) and receives
        <code>tokenInit</code> (the token the creator <em>offered</em>) in return. Their
        <code>amount</code> is how much of <code>tokenSell</code> they're sending; they
        receive <code>amount * amountInit / amountSell</code> of <code>tokenInit</code>.
        With <code>allOrNothing = false</code> the same order can be partially filled by
        multiple counterparties until <code>filledSell == amountSell</code>.
      </p>

      <pre v-if="viewMode === 'frontend'" class="docs-tab__code"><code>// Filler side
const result = await store.finishSell(depositBlock, accessCode, fillAmount)</code></pre>

      <pre v-if="viewMode === 'dfx'" class="docs-tab__code"><code># Method name on backend is `FinishSell` (capital F). Block here is NAT64
# (the only update method on this canister that uses nat64 instead of nat).
dfx canister --network ic --identity my-key call {{ canisterId }} FinishSell \
  '(42_000_000 : nat64, "&lt;ACCESS_CODE&gt;", 25_000_000 : nat)'</code></pre>

      <h4 class="docs-tab__subtitle">4. Cancel</h4>
      <p class="docs-tab__text">
        <code>revokeTrade(accessCode, { Initiator: null })</code>. A revoke fee is
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
