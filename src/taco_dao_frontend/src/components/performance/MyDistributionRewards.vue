<template>
  <div class="my-distribution-rewards mx-3 mb-4">
    <div class="taco-container taco-container--l1">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 taco-text-brown-to-white">
          <i class="fas fa-coins me-2"></i>
          My Distribution Rewards
        </h5>
        <div class="d-flex align-items-center gap-2">
          <span v-if="isStagingHost" class="staging-badge">Demo data (staging)</span>
          <span v-if="totalRewardsEarned > 0n" class="total-badge">
            Total: {{ formatRewardAmount(totalRewardsEarned) }} TACO
          </span>
          <button
            class="btn taco-nav-btn"
            @click="refreshData"
            :disabled="isLoading"
          >
            <i class="fas fa-sync-alt me-1"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="(isLoading || resolvingNeurons) && distributions.length === 0" class="text-center py-4">
        <div class="spinner-border" role="status" style="color: var(--brown);">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 rewards-muted">Loading distribution rewards...</p>
      </div>

      <!-- No Neurons State -->
      <div v-else-if="effectiveNeuronIds.length === 0 && !resolvingNeurons && !isLoadingUserPerformance" class="text-center py-4">
        <i class="fas fa-coins fa-2x mb-3 rewards-muted"></i>
        <p class="rewards-muted">No neurons found. Participate in distributions to earn rewards.</p>
      </div>

      <!-- No Distributions Found -->
      <div v-else-if="!isLoading && distributions.length === 0 && hasLoaded" class="text-center py-4">
        <i class="fas fa-coins fa-2x mb-3 rewards-muted"></i>
        <p class="rewards-muted">No distribution rewards found for your neurons.</p>
      </div>

      <!-- Data Table -->
      <div v-else-if="distributions.length > 0">
        <div class="table-responsive">
          <table class="rewards-table">
            <thead>
              <tr>
                <th></th>
                <th>Dist #</th>
                <th>Date</th>
                <th>Period</th>
                <th>Your Reward</th>
                <th>Avg Perf</th>
                <th>DAO Avg</th>
                <th>Your VP</th>
                <th>Neurons</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(dist, index) in distributions" :key="dist.distributionId">
                <!-- Summary Row -->
                <tr class="summary-row" @click="toggleExpand(index)">
                  <td class="expand-cell">
                    <i class="fas" :class="expanded[index] ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                  </td>
                  <td>#{{ dist.distributionId }}</td>
                  <td>{{ formatDate(dist.distributionTime) }}</td>
                  <td>{{ formatDateRange(dist.startTime, dist.endTime) }}</td>
                  <td class="reward-amount">{{ formatRewardAmount(dist.userTotalReward) }}</td>
                  <td :class="getPerformanceClass(dist.avgPerformanceScore)">
                    {{ formatPerformanceScore(dist.avgPerformanceScore) }}
                  </td>
                  <td :class="getPerformanceClass(statsFor(dist.distributionId)?.usd.vpWeightedAvg)">
                    {{ statsFor(dist.distributionId) ? formatPerformanceScore(statsFor(dist.distributionId).usd.vpWeightedAvg) : '—' }}
                  </td>
                  <td>{{ formatVotingPower(dist.userTotalVotingPower) }}</td>
                  <td>{{ dist.neuronCount }}</td>
                </tr>
                <!-- Expanded Neuron Detail -->
                <tr v-if="expanded[index]" class="detail-row">
                  <td :colspan="9">
                    <div class="neuron-detail-container">
                      <!-- DAO-wide benchmarks for this cycle (you vs the whole DAO) -->
                      <template v-for="s in [statsFor(dist.distributionId)]" :key="`${dist.distributionId}-dao`">
                        <div class="dao-benchmarks">
                          <template v-if="s && Number(s.participantCount) > 0">
                            <div class="dao-bm-title"><i class="fas fa-users me-1"></i>DAO benchmarks</div>
                            <div class="dao-chips">
                              <span class="dao-chip__cur-tag">USD</span>
                              <span class="dao-chip" title="Average weighted by each neuron's voting power"><span class="dao-chip__lbl">By voting power</span><b :class="getPerformanceClass(s.usd.vpWeightedAvg)">{{ formatPerformanceScore(s.usd.vpWeightedAvg) }}</b></span>
                              <span class="dao-chip" title="Simple average — each neuron counts equally"><span class="dao-chip__lbl">By neuron</span><b :class="getPerformanceClass(s.usd.neuronCountAvg)">{{ formatPerformanceScore(s.usd.neuronCountAvg) }}</b></span>
                              <span class="dao-chip" title="The middle neuron's performance"><span class="dao-chip__lbl">Median</span><b :class="getPerformanceClass(s.usd.median)">{{ formatPerformanceScore(s.usd.median) }}</b></span>
                            </div>
                            <div v-if="s.icp.length" class="dao-chips dao-chips--icp">
                              <span class="dao-chip__cur-tag">ICP</span>
                              <span class="dao-chip" title="ICP — average weighted by voting power"><span class="dao-chip__lbl">By voting power</span><b :class="getPerformanceClass(s.icp[0].vpWeightedAvg)">{{ formatPerformanceScore(s.icp[0].vpWeightedAvg) }}</b></span>
                              <span class="dao-chip" title="ICP — simple average, each neuron equal"><span class="dao-chip__lbl">By neuron</span><b :class="getPerformanceClass(s.icp[0].neuronCountAvg)">{{ formatPerformanceScore(s.icp[0].neuronCountAvg) }}</b></span>
                              <span class="dao-chip" title="ICP — the middle neuron's performance"><span class="dao-chip__lbl">Median</span><b :class="getPerformanceClass(s.icp[0].median)">{{ formatPerformanceScore(s.icp[0].median) }}</b></span>
                            </div>
                            <template v-for="h in [histogramView(s.usd, dist.avgPerformanceScore)]" :key="`${dist.distributionId}-hist`">
                              <div v-if="h" class="histogram">
                                <span
                                  v-if="h.userPos !== null"
                                  class="hist-you-label"
                                  :style="{ left: h.userPos + '%' }"
                                >You {{ formatPerformanceScore(dist.avgPerformanceScore) }}</span>
                                <div class="hist-track">
                                  <div
                                    v-for="bar in h.bars"
                                    :key="bar.i"
                                    class="hist-bar"
                                    :style="{ height: bar.heightPct + '%' }"
                                    :title="bar.label"
                                  ></div>
                                  <div class="hist-marker hist-marker--breakeven" :style="{ left: h.breakEvenPos + '%' }" title="Break-even (0%)"></div>
                                  <div class="hist-marker hist-marker--median" :style="{ left: h.medianPos + '%' }" title="DAO median"></div>
                                  <div v-if="h.userPos !== null" class="hist-marker hist-marker--you" :style="{ left: h.userPos + '%' }"></div>
                                </div>
                                <div class="hist-axis">
                                  <span>{{ h.min >= 0 ? '+' : '' }}{{ h.min }}%</span>
                                  <span>0%</span>
                                  <span>{{ h.max >= 0 ? '+' : '' }}{{ h.max }}%</span>
                                </div>
                                <div class="hist-legend">
                                  <span class="hist-leg hist-leg--you">You</span>
                                  <span class="hist-leg hist-leg--median">DAO median</span>
                                  <span class="hist-leg hist-leg--breakeven">Break-even</span>
                                </div>
                              </div>
                            </template>
                          </template>
                          <div v-else-if="s" class="rewards-muted dao-bm-empty">No DAO data for this cycle</div>
                          <div v-else class="rewards-muted dao-bm-empty">DAO benchmarks unavailable</div>
                        </div>
                      </template>
                      <table class="neuron-detail-table">
                        <thead>
                          <tr>
                            <th>Neuron ID</th>
                            <th>Reward</th>
                            <th>Perf (USD)</th>
                            <th>Perf (ICP)</th>
                            <th>Voting Power</th>
                            <th>Reward Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="nr in dist.neuronRewards" :key="neuronIdToHex(nr.neuronId)">
                            <td><code class="neuron-id">{{ formatNeuronId(nr.neuronId) }}</code></td>
                            <td class="reward-amount">{{ formatRewardAmount(nr.rewardAmount) }}</td>
                            <td :class="getPerformanceClass(nr.performanceScore)">
                              {{ formatPerformanceScore(nr.performanceScore) }}
                            </td>
                            <td :class="getPerformanceClass(nr.performanceScoreICP?.length > 0 ? nr.performanceScoreICP[0] : null)">
                              {{ formatPerformanceScore(nr.performanceScoreICP?.length > 0 ? nr.performanceScoreICP[0] : null) }}
                            </td>
                            <td>{{ formatVotingPower(nr.votingPower) }}</td>
                            <td>{{ formatRewardScore(nr.rewardScore) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="rewards-muted">
            Showing {{ distributions.length }} of {{ Number(total) }} distributions
          </small>
          <button
            v-if="hasMore"
            class="btn taco-btn taco-btn--success btn-sm"
            @click="loadMore"
            :disabled="isLoadingMore"
          >
            <i v-if="isLoadingMore" class="fas fa-spinner fa-spin me-1"></i>
            Load More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useTacoStore } from '../../stores/taco.store'

// On the staging website (served from the staging canister) we always show this
// demo principal's rewards so testers see data even when logged out. Keyed off the
// literal hostname — NOT getEffectiveNetwork() (which a localStorage override can fake).
const STAGING_DEMO_PRINCIPAL = 'nfzo4-i26mj-e2tuj-bt3ba-cuco4-vcqxx-ybjw7-gzyzh-kvyp7-wjeyp-hqe'
const isStagingHost = typeof window !== 'undefined' && window.location.hostname.includes('wxunf-maaaa-aaaab-qbzga-cai')

export default {
  name: 'MyDistributionRewards',
  props: {
    userNeuronIds: {
      type: Array,
      default: () => []
    },
    isLoadingUserPerformance: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const tacoStore = useTacoStore()

    const rawRecords = ref([])
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const hasMore = ref(false)
    const hasLoaded = ref(false)
    const total = ref(BigInt(0))
    const currentOffset = ref(0)
    const expanded = reactive({})
    const PAGE_SIZE = 20

    // DAO-wide per-distribution benchmarks, keyed by distributionId.toString().
    const statsById = ref(new Map())
    // The neuron-id set the table actually queries: the prop normally, or the
    // staging demo principal's neurons on the staging website.
    const effectiveNeuronIds = ref([])
    const resolvingNeurons = ref(false)

    // Process raw records into display-ready rows
    const distributions = computed(() => {
      return rawRecords.value.map(record => {
        const rewards = record.neuronRewards || []
        const userTotalReward = rewards.reduce(
          (sum, nr) => sum + BigInt(nr.rewardAmount), BigInt(0)
        )
        const avgPerformanceScore = rewards.length > 0
          ? rewards.reduce((sum, nr) => sum + nr.performanceScore, 0) / rewards.length
          : null
        const userTotalVotingPower = rewards.reduce(
          (sum, nr) => sum + BigInt(nr.votingPower), BigInt(0)
        )

        return {
          distributionId: Number(record.distributionId),
          distributionTime: record.distributionTime,
          startTime: record.startTime,
          endTime: record.endTime,
          totalRewardPot: record.totalRewardPot,
          userTotalReward,
          avgPerformanceScore,
          userTotalVotingPower,
          neuronCount: rewards.length,
          neuronRewards: rewards
        }
      })
    })

    const totalRewardsEarned = computed(() => {
      return distributions.value.reduce(
        (sum, d) => sum + d.userTotalReward, BigInt(0)
      )
    })

    // Fetch DAO-wide benchmarks for a page of records (fail-soft; benchmarks are
    // decorative). Merges into a NEW Map so paginated loads accumulate + react.
    const loadStatsFor = async (records) => {
      const ids = (records || []).map(r => r.distributionId)
      if (ids.length === 0) return
      try {
        const actor = await tacoStore.createRewardsActorAnonymous()
        const stats = await actor.getDistributionStats(ids)
        const next = new Map(statsById.value)
        for (const s of stats) next.set(s.distributionId.toString(), s)
        statsById.value = next
      } catch (e) {
        console.error('getDistributionStats failed', e)
      }
    }

    // Row distributionId is a Number; stats are keyed by bigint.toString() — String() bridges them.
    const statsFor = (distId) => statsById.value.get(String(distId)) ?? null

    const fetchDistributions = async (reset = true) => {
      if (effectiveNeuronIds.value.length === 0) return

      if (reset) {
        isLoading.value = true
        currentOffset.value = 0
        rawRecords.value = []
      } else {
        isLoadingMore.value = true
      }

      try {
        const actor = await tacoStore.createRewardsActorAnonymous()
        const result = await actor.getUserDistributionRewards(
          effectiveNeuronIds.value,
          BigInt(currentOffset.value),
          BigInt(PAGE_SIZE)
        )

        if (reset) {
          rawRecords.value = result.records
        } else {
          rawRecords.value = [...rawRecords.value, ...result.records]
        }

        // DAO-wide benchmarks for this page — fire-and-forget so the user rows
        // render immediately; the DAO cells fill in reactively when stats land.
        loadStatsFor(result.records)

        currentOffset.value += result.records.length
        hasMore.value = result.hasMore
        total.value = result.total
        hasLoaded.value = true
      } catch (error) {
        console.error('Error loading distribution rewards:', error)
      } finally {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }

    const loadMore = () => fetchDistributions(false)
    const refreshData = () => fetchDistributions(true)

    // Resolve which neuron set to show: staging → demo principal's neurons; else → the prop.
    const resolveNeuronIds = async () => {
      if (isStagingHost) {
        resolvingNeurons.value = true
        try {
          effectiveNeuronIds.value = await tacoStore.getNeuronIdsForPrincipal(STAGING_DEMO_PRINCIPAL)
        } finally {
          resolvingNeurons.value = false
        }
      } else {
        effectiveNeuronIds.value = props.userNeuronIds
      }
      if (effectiveNeuronIds.value.length > 0) {
        fetchDistributions(true)
      }
    }

    // Build a 5-percentage-point-per-bin histogram view from a PerfStats (USD/ICP),
    // centered on break-even (0% in the middle). The backend window is adaptive and
    // often off-center, so we re-bin into a SYMMETRIC window [-M, +M] (M = the farther
    // edge), zero-filling the padded bins. Marker positions are left-% along that axis.
    const histogramView = (p, userScore) => {
      if (!p || !p.histogram) return null
      const raw = p.histogram.map(Number)
      const M = Math.max(5, Math.abs(p.histMinPercent), Math.abs(p.histMaxPercent))
      const min = -M, max = M
      const binCount = Math.round((max - min) / 5)
      const counts = new Array(binCount).fill(0)
      for (let i = 0; i < raw.length; i++) {
        const lo = p.histMinPercent + 5 * i           // left edge (%) of backend bin i
        const idx = Math.round((lo - min) / 5)          // its slot in the symmetric array
        if (idx >= 0 && idx < binCount) counts[idx] += raw[i]
      }
      const maxCount = Math.max(1, ...counts)
      const span = (max - min) || 1
      const clamp = (v) => Math.max(0, Math.min(100, v))
      const posFor = (pct) => clamp(((pct - min) / span) * 100)
      const fmt = (v) => `${v >= 0 ? '+' : ''}${v}%`
      const bars = counts.map((c, i) => {
        const lo = min + 5 * i
        return {
          i,
          count: c,
          heightPct: c > 0 ? Math.max(8, (c / maxCount) * 100) : 0,
          label: `${fmt(lo)}…${fmt(lo + 5)}: ${c}`,
        }
      })
      const userPct = (userScore !== null && userScore !== undefined) ? (userScore - 1) * 100 : null
      return {
        bars,
        min,
        max,
        breakEvenPos: posFor(0),   // always 50% now (centered)
        medianPos: posFor((p.median - 1) * 100),
        userPos: userPct !== null ? posFor(userPct) : null,
      }
    }

    const toggleExpand = (index) => {
      expanded[index] = !expanded[index]
    }

    // Watch for neuron IDs becoming available (off-staging only; on staging we use the demo set)
    watch(() => props.userNeuronIds, (newIds, oldIds) => {
      if (isStagingHost) return
      if (newIds.length > 0 && (!oldIds || oldIds.length === 0)) {
        resolveNeuronIds()
      }
    }, { deep: true })

    onMounted(() => {
      // Staging always resolves the demo set (even logged out); otherwise resolve when the prop has ids.
      if (isStagingHost || props.userNeuronIds.length > 0) {
        resolveNeuronIds()
      }
    })

    // ── Formatters ──

    const neuronIdToHex = (neuronId) => {
      const id = neuronId instanceof Uint8Array ? neuronId : new Uint8Array(neuronId)
      return Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const formatNeuronId = (neuronId) => {
      const hex = neuronIdToHex(neuronId)
      return hex.length > 12 ? hex.substring(0, 8) + '...' + hex.substring(hex.length - 4) : hex
    }

    const formatRewardAmount = (amount) => {
      const value = Number(amount) / 1e8
      if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
      if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K'
      if (value >= 1) return value.toFixed(2)
      return value.toFixed(4)
    }

    const formatDate = (timestamp) => {
      try {
        const ms = Number(BigInt(timestamp)) / 1_000_000
        return new Date(ms).toLocaleDateString()
      } catch { return 'N/A' }
    }

    const formatDateRange = (start, end) => {
      return `${formatDate(start)} - ${formatDate(end)}`
    }

    const formatVotingPower = (vp) => {
      if (!vp) return '0'
      const value = Number(vp) / 1e8
      if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B'
      if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
      if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K'
      return value.toFixed(2)
    }

    // Reward Score can reach the trillions — abbreviate K/M/B/T (raw number,
    // not e8s) instead of printing the full decimal.
    const formatRewardScore = (score) => {
      if (score === null || score === undefined) return 'N/A'
      const v = Number(score)
      const abs = Math.abs(v)
      if (abs >= 1e12) return (v / 1e12).toFixed(2) + 'T'
      if (abs >= 1e9) return (v / 1e9).toFixed(2) + 'B'
      if (abs >= 1e6) return (v / 1e6).toFixed(2) + 'M'
      if (abs >= 1e3) return (v / 1e3).toFixed(2) + 'K'
      return v.toFixed(2)
    }

    const formatPerformanceScore = (score) => {
      if (score === null || score === undefined) return 'N/A'
      const pct = (score - 1.0) * 100
      const sign = pct >= 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    const getPerformanceClass = (score) => {
      if (score === null || score === undefined) return 'text-muted'
      return score >= 1.0 ? 'text-success' : 'text-danger'
    }

    return {
      distributions,
      isLoading,
      isLoadingMore,
      hasMore,
      hasLoaded,
      total,
      totalRewardsEarned,
      expanded,
      loadMore,
      refreshData,
      toggleExpand,
      neuronIdToHex,
      formatNeuronId,
      formatRewardAmount,
      formatDate,
      formatDateRange,
      formatVotingPower,
      formatRewardScore,
      formatPerformanceScore,
      getPerformanceClass,
      statsFor,
      histogramView,
      isStagingHost,
      resolvingNeurons,
      effectiveNeuronIds
    }
  }
}
</script>

<style scoped>
.rewards-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
}

.rewards-table thead tr {
  background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
}

.rewards-table thead th {
  border-bottom: 2px solid var(--card-border);
  color: var(--text-cream);
  padding: 0.6rem 0.75rem;
  text-align: left;
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 600;
}

.rewards-table tbody td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--dark-orange);
  color: var(--brown-to-white);
  vertical-align: middle;
}

.summary-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.summary-row:hover {
  background: rgba(0, 0, 0, 0.1);
}

.expand-cell {
  width: 30px;
  text-align: center;
  color: var(--dark-brown-to-white);
  font-size: 0.7rem;
}

.reward-amount {
  color: var(--green);
  font-weight: 600;
}

.detail-row td {
  padding: 0 !important;
  border-bottom: 2px solid var(--dark-orange);
}

.neuron-detail-container {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.75rem;
  margin: 0;
}

.neuron-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
}

.neuron-detail-table thead tr {
  background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
}

.neuron-detail-table thead th {
  color: var(--text-cream);
  padding: 0.4rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-bottom: 1px solid var(--dark-orange);
  text-align: left;
}

.neuron-detail-table tbody td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--brown-to-white);
}

.neuron-id {
  font-size: 0.8rem;
  color: var(--brown-to-white);
}

.total-badge {
  background: var(--green);
  color: var(--black);
  border-radius: 0.375rem;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.rewards-muted {
  color: var(--dark-brown-to-white);
  font-family: 'Space Mono', monospace;
}

.text-success {
  color: var(--green) !important;
}

.text-danger {
  color: #FF4444 !important;
}

.text-muted {
  color: var(--dark-brown-to-white) !important;
}

.staging-badge {
  background: var(--dark-orange);
  color: var(--text-cream);
  border-radius: 0.375rem;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

/* DAO benchmarks block inside the expanded row */
.dao-benchmarks {
  padding: 0.7rem 0.85rem 0.85rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid var(--dark-orange);
  font-family: 'Space Mono', monospace;
}

.dao-bm-title {
  display: flex;
  align-items: center;
  color: var(--text-cream);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 0.55rem;
}

.dao-bm-empty {
  font-size: 0.78rem;
}

.dao-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.5rem;
  font-size: 0.74rem;
  color: var(--brown-to-white);
}

.dao-chips--icp {
  margin-top: 0.4rem;
}

/* each metric as a subtle pill: muted label + bold coloured value */
.dao-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.18rem 0.55rem;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid var(--card-border);
  border-radius: 0.4rem;
}

.dao-chip__lbl {
  color: var(--dark-brown-to-white);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.dao-chip b {
  font-weight: 700;
  font-size: 0.82rem;
}

/* USD / ICP badge — equal width so the two chip rows line up */
.dao-chip__cur-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.7em;
  padding: 0.2rem 0.45rem;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--card-border);
  border-radius: 0.4rem;
  color: var(--text-cream);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* Histogram: distribution of all neurons' performance for the cycle, centered on 0% */
.histogram {
  position: relative;
  max-width: 520px;
  margin: 1.1rem auto 0;   /* horizontally centered; top room for the "You" label */
  padding-top: 0.85rem;
}

.hist-track {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 70px;
  padding: 0 1px;
  background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
  border: 1px solid var(--card-border);
  border-radius: 0.3rem;
  overflow: hidden;
}

.hist-bar {
  flex: 1 1 0;
  min-height: 0;
  background: var(--green);
  background: linear-gradient(180deg, var(--green), color-mix(in srgb, var(--green) 45%, transparent));
  border-radius: 2px 2px 0 0;
}

.hist-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  pointer-events: none;
}

.hist-marker--breakeven {
  border-left: 1px dashed var(--dark-brown-to-white);
}

.hist-marker--median {
  border-left: 2px dashed var(--text-cream);
  opacity: 0.85;
}

.hist-marker--you {
  border-left: 2px solid #ffffff;
}

.hist-you-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.62rem;
  color: #ffffff;
  font-weight: 700;
}

.hist-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.62rem;
  color: var(--dark-brown-to-white);
}

.hist-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-top: 0.45rem;
  font-size: 0.62rem;
  color: var(--dark-brown-to-white);
}

.hist-leg {
  display: inline-flex;
  align-items: center;
}

.hist-leg::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 0;
  margin-right: 0.3rem;
}

.hist-leg--you::before {
  border-top: 2px solid #ffffff;
}

.hist-leg--median::before {
  border-top: 2px dashed var(--text-cream);
}

.hist-leg--breakeven::before {
  border-top: 1px dashed var(--dark-brown-to-white);
}

@media (max-width: 576px) {
  .rewards-table {
    font-size: 0.75rem;
  }

  .rewards-table thead th,
  .rewards-table tbody td {
    padding: 0.4rem 0.5rem;
  }

  .neuron-detail-table {
    font-size: 0.7rem;
  }

  .dao-chips {
    font-size: 0.7rem;
  }

  .hist-track {
    height: 48px;
  }
}
</style>
