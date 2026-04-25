<template>
  <div class="sg tx-scroll">
    <div class="sg__shell">
      <ExchangeTopNav active="pool" />

      <!-- Hero -->
      <section>
        <div class="tx-eyebrow sg__eyebrow">Style Guide — Exchange</div>
        <h1 class="tx-h1" style="font-size: 40px; letter-spacing: -0.03em">
          A quieter <span class="tx-serif tx-orange">kitchen</span>. Same heat.
        </h1>
        <p class="tx-ink-2 sg__lede">
          Less gradient stacking. Fewer browns competing with each other.
          The burnt-orange stays the hero — but it sits on calmer surfaces,
          and every number picks up a proper monospace. Pro stays precise; Easy breathes.
        </p>
      </section>

      <hr class="tx-hr" />

      <!-- 01 · Palette -->
      <section>
        <div class="tx-eyebrow sg__section-title">01 · Palette</div>
        <div class="sg__swatches">
          <Swatch v-for="s in surfaces" :key="s.name" :name="s.name" :var-name="s.v" :note="s.note" />
        </div>
        <div class="sg__swatches">
          <Swatch v-for="s in accents" :key="s.name" :name="s.name" :var-name="s.v" :note="s.note" />
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 02 · Typography -->
      <section>
        <div class="tx-eyebrow sg__section-title">02 · Typography</div>
        <div class="sg__type-grid">
          <div class="tx-ink-3 sg__type-label">Inter · Display 40</div>
          <div style="font-size: 40px; letter-spacing: -0.03em; font-weight: 600">
            Together, we perfect the recipe.
          </div>

          <div class="tx-ink-3 sg__type-label">Inter · H1 · 28/600</div>
          <div style="font-size: 28px; font-weight: 600; letter-spacing: -0.02em">Portfolio</div>

          <div class="tx-ink-3 sg__type-label">Inter · H2 · 18/600</div>
          <div class="tx-h2">Open orders · 3</div>

          <div class="tx-ink-3 sg__type-label">Inter · Body · 13/400</div>
          <div>Best route across TACO pools. No wrappers, no bridges.</div>

          <div class="tx-ink-3 sg__type-label">Instrument Serif · Accent</div>
          <div class="tx-serif tx-orange" style="font-size: 28px">
            instantly · everywhere · on-chain
          </div>

          <div class="tx-ink-3 sg__type-label">JetBrains Mono · Numerics</div>
          <div class="tx-mono tx-tnum" style="font-size: 24px; font-weight: 500">
            0.01847 · 54,142.6 · $2,304.37
          </div>

          <div class="tx-ink-3 sg__type-label">Eyebrow · 11/600 · UPPER</div>
          <div class="tx-eyebrow">Order book · Depth</div>
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 03 · Buttons -->
      <section>
        <div class="tx-eyebrow sg__section-title">03 · Buttons</div>
        <div class="sg__row">
          <button class="ex-btn ex-btn--primary">Primary</button>
          <button class="ex-btn ex-btn--primary ex-btn--lg">Large CTA</button>
          <button class="ex-btn ex-btn--buy">Buy TACO</button>
          <button class="ex-btn ex-btn--sell">Sell TACO</button>
          <button class="ex-btn ex-btn--outline">Outline</button>
          <button class="ex-btn ex-btn--ghost">Ghost</button>
          <button class="ex-btn ex-btn--ghost ex-btn--sm">Small</button>
          <button class="ex-btn ex-btn--primary" disabled>Disabled</button>
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 04 · Inputs + segments + badges -->
      <section>
        <div class="tx-eyebrow sg__section-title">04 · Inputs & segments</div>
        <div class="sg__two-col">
          <div class="sg__stack">
            <input class="ex-input" placeholder="Search tokens…" />
            <input class="ex-input ex-input--mono" value="0.01847" />
            <input class="ex-input ex-input--mono ex-input--lg" value="50" />
          </div>
          <div class="sg__stack">
            <div class="ex-segment ex-segment--buysell">
              <button data-side="buy" aria-pressed="true">Buy</button>
              <button data-side="sell">Sell</button>
            </div>
            <div class="ex-segment">
              <button aria-pressed="true">Limit</button>
              <button>Market</button>
              <button>Stop</button>
            </div>
            <div class="sg__row" style="gap: 6px">
              <span class="ex-badge">Default</span>
              <span class="ex-badge ex-badge--orange">Featured</span>
              <span class="ex-badge ex-badge--buy">+4.82%</span>
              <span class="ex-badge ex-badge--sell">-1.24%</span>
              <span class="ex-badge ex-badge--square">AMM</span>
              <span class="ex-badge ex-badge--info">Info</span>
              <span class="ex-badge ex-badge--warning">Warn</span>
            </div>
          </div>
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 05 · Surfaces -->
      <section>
        <div class="tx-eyebrow sg__section-title">05 · Surfaces</div>
        <div class="sg__three-col">
          <div class="ex-panel" style="padding: 16px">
            <div class="tx-ink-3" style="font-size: 11px">Panel · surface-1</div>
            <div style="margin-top: 6px; font-weight: 600">Order Book</div>
            <div class="tx-ink-3" style="font-size: 12px; margin-top: 4px">
              The default chrome. Soft, settled.
            </div>
          </div>
          <div class="ex-card" style="padding: 16px">
            <div class="tx-ink-3" style="font-size: 11px">Card · elevated</div>
            <div style="margin-top: 6px; font-weight: 600">Swap Card</div>
            <div class="tx-ink-3" style="font-size: 12px; margin-top: 4px">
              Hero modules. Larger radius, soft shadow.
            </div>
          </div>
          <div style="padding: 16px; border: 1px solid var(--tx-orange-line); background: var(--tx-orange-dim); border-radius: var(--tx-r-lg)">
            <div class="tx-eyebrow tx-orange" style="letter-spacing: 0.08em">Accent</div>
            <div style="margin-top: 6px; font-weight: 600">Focus state</div>
            <div class="tx-ink-2" style="font-size: 12px; margin-top: 4px">
              Selected rows, highlighted promos.
            </div>
          </div>
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 06 · Depth rows -->
      <section>
        <div class="tx-eyebrow sg__section-title">06 · Depth rows</div>
        <div class="ex-panel" style="max-width: 380px; padding: 6px 0">
          <DepthRow
            v-for="(r, i) in asks"
            :key="'a-' + i"
            side="ask"
            :price="r[0]"
            :amount="r[1]"
            :total="r[2]"
            :depthPct="r[3]"
          />
          <div class="sg__spread">
            <div class="tx-row tx-row--between">
              <div class="tx-mono tx-tnum" style="font-size: 14px; color: var(--tx-buy); font-weight: 600">
                0.01847
              </div>
              <div class="tx-ink-3" style="font-size: 10px">
                Spread <span class="tx-mono">0.00002</span>
              </div>
            </div>
          </div>
          <DepthRow
            v-for="(r, i) in bids"
            :key="'b-' + i"
            side="bid"
            :price="r[0]"
            :amount="r[1]"
            :total="r[2]"
            :depthPct="r[3]"
          />
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 07 · States -->
      <section>
        <div class="tx-eyebrow sg__section-title">07 · States</div>
        <div class="sg__three-col">
          <ExchangeEmptyState
            icon="◎"
            title="No open orders"
            body="Place an order from the Pro or Easy view — it'll show up here instantly."
          >
            <template #cta>
              <button class="ex-btn ex-btn--primary ex-btn--sm">Open Easy Swap →</button>
            </template>
          </ExchangeEmptyState>
          <ExchangeErrorState
            title="Couldn't load orderbook"
            errorText="Request to exchange_backend timed out after 6 seconds."
            :onRetry="() => {}"
          />
          <ExchangeLoadingSkeleton label="Loading pools…" />
        </div>
      </section>

      <hr class="tx-hr" />

      <!-- 08 · Motion + radius -->
      <section>
        <div class="sg__two-col">
          <div>
            <div class="tx-eyebrow sg__section-title">08 · Radius</div>
            <div class="tx-mono" style="font-size: 12px; line-height: 2">
              <div>--tx-r-sm · small chips, hints</div>
              <div>--tx-r-md · buttons, inputs</div>
              <div>--tx-r-lg · panels, cards</div>
              <div>--tx-r-xl · hero cards, modals</div>
            </div>
          </div>
          <div>
            <div class="tx-eyebrow sg__section-title">09 · Motion</div>
            <div class="tx-ink-2" style="font-size: 12px; line-height: 1.8">
              <div>• 140–220ms for microinteractions</div>
              <div>• <span class="tx-mono">cubic-bezier(0.16, 1, 0.3, 1)</span> for panels + modals</div>
              <div>• Price flash: 600ms fade, buy/sell tinted bg</div>
              <div>• Full <span class="tx-mono">prefers-reduced-motion</span> honoured</div>
            </div>
          </div>
        </div>
      </section>

      <div class="tx-ink-3 sg__footer">
        Designed for taco·exchange — pipe these tokens back into
        <span class="tx-mono">_variables.scss</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'
import ExchangeTopNav from '../components/common/ExchangeTopNav.vue'
import ExchangeEmptyState from '../components/common/ExchangeEmptyState.vue'
import ExchangeErrorState from '../components/common/ExchangeErrorState.vue'
import ExchangeLoadingSkeleton from '../components/common/ExchangeLoadingSkeleton.vue'
import DepthRow from '../components/common/DepthRow.vue'

// Inline Swatch sub-component — local only, never exported.
const Swatch = defineComponent({
  name: 'Swatch',
  props: {
    name: { type: String, required: true },
    varName: { type: String, required: true },
    note: { type: String, default: '' },
  },
  setup(props) {
    return () =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, [
        h('div', {
          style: {
            height: '60px',
            borderRadius: 'var(--tx-r-md)',
            background: `var(${props.varName})`,
            border: '1px solid var(--tx-line)',
          },
        }),
        h('div', { style: { fontSize: '11px' } }, [
          h('div', { style: { fontWeight: '600' } }, props.name),
          h('div', { class: 'tx-mono tx-ink-3', style: { fontSize: '10px' } }, props.varName),
          props.note
            ? h('div', { class: 'tx-ink-3', style: { fontSize: '10px', marginTop: '2px' } }, props.note)
            : null,
        ])
      ])
  },
})

type SwatchSpec = { name: string; v: string; note?: string }

const surfaces: SwatchSpec[] = [
  { name: 'Background', v: '--tx-bg' },
  { name: 'Surface 1',  v: '--tx-surface-1' },
  { name: 'Surface 2',  v: '--tx-surface-2' },
  { name: 'Surface 3',  v: '--tx-surface-3' },
  { name: 'Line',       v: '--tx-line-2' },
  { name: 'Line hi',    v: '--tx-line-hi' },
]
const accents: SwatchSpec[] = [
  { name: 'Orange · brand', v: '--tx-orange',   note: 'CTAs, focus' },
  { name: 'Orange hover',   v: '--tx-orange-2' },
  { name: 'Amber',          v: '--tx-amber',    note: 'Titles, accents' },
  { name: 'Buy',            v: '--tx-buy' },
  { name: 'Sell',           v: '--tx-sell' },
  { name: 'Info',           v: '--tx-info' },
]

const asks: Array<[number, number, number, number]> = [
  [0.01858, 4560, 84.73, 15],
  [0.01854, 21800, 404.17, 70],
  [0.01852, 9410, 174.27, 30],
  [0.01850, 14230, 263.25, 45],
  [0.01848, 6820, 126.07, 22],
]
const bids: Array<[number, number, number, number]> = [
  [0.01846, 12480, 230.38, 40],
  [0.01845, 8420, 155.35, 28],
  [0.01843, 22110, 407.49, 65],
  [0.01842, 4180, 77.00, 14],
  [0.01840, 19230, 353.83, 58],
]
</script>

<style scoped lang="scss">
.sg {
  min-height: 100vh;
  background: var(--tx-bg);
  padding: 36px 40px 60px;
  overflow-y: auto;

  &__shell {
    max-width: 1080px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  &__eyebrow { margin-bottom: 8px; }
  &__lede {
    max-width: 620px;
    margin-top: 10px;
    font-size: 14px;
    line-height: 1.55;
  }
  &__section-title { margin-bottom: 14px; }

  &__swatches {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
    & + & { margin-top: 14px; }
  }
  &__type-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 20px;
    align-items: baseline;
  }
  &__type-label { font-size: 11px; }
  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  &__stack { display: flex; flex-direction: column; gap: 10px; }
  &__two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  &__three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  &__spread {
    padding: 6px 10px;
    border-top: 1px solid var(--tx-line);
    border-bottom: 1px solid var(--tx-line);
    background: var(--tx-surface-2);
  }
  &__footer {
    font-size: 11px;
    text-align: center;
    padding-top: 20px;
  }

  @media (max-width: 900px) {
    &__swatches { grid-template-columns: repeat(3, 1fr); }
    &__three-col { grid-template-columns: 1fr; }
    &__two-col { grid-template-columns: 1fr; }
    &__type-grid { grid-template-columns: 1fr; gap: 4px 0; }
  }
}
</style>
