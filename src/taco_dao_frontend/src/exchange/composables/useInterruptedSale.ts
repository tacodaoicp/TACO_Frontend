/**
 * A Sell many sale that did not finish (the tab closed or crashed mid sale): its
 * run record was left 'running' with no lock holder anywhere. The CrossDEX card
 * and the Recover page show one note until Recover All ran or it is dismissed.
 */
import { ref, computed } from 'vue'
import { useExchangeStore } from '../store/exchange.store'
import { runJournal } from '../utils/runJournalStore'
import { findInterrupted, type RunRecord } from '../utils/crossDexJournal'
import { isFundsLockHeld, hasWebLocks } from '../utils/saleLock'
import { useMultiSell } from './useMultiSell'

const found = ref<RunRecord | null>(null)
const nowTick = ref(Date.now())

export function useInterruptedSale() {
  const store = useExchangeStore()
  const ms = useMultiSell()

  async function check(): Promise<void> {
    nowTick.value = Date.now()
    try {
      const r = findInterrupted(runJournal.list(), store.principalText, {
        anyLockHeld: await isFundsLockHeld(),
        hasWebLocks: hasWebLocks(),
        liveRunId: ms.run.value && !ms.run.value.settled ? ms.run.value.id : null,
        now: Date.now(),
      })
      if (r && r.phase === 'running') runJournal.markRun(r.id, { phase: 'interrupted' })
      found.value = r
    } catch { found.value = null }
  }

  /** Recover All ran, or the user dismissed the note. */
  function dismissInterrupted() {
    const r = found.value
    if (r) runJournal.markRun(r.id, { checked: true })
    found.value = null
  }

  const interruptedAgo = computed(() => {
    const r = found.value
    if (!r) return ''
    const s = Math.max(0, Math.round((nowTick.value - r.updatedAt) / 1000))
    if (s < 90) return `${s} seconds`
    const m = Math.round(s / 60)
    if (m < 90) return `${m} minutes`
    const h = Math.round(m / 60)
    if (h < 48) return `${h} hours`
    return `${Math.round(h / 24)} days`
  })

  return {
    interrupted: computed(() => found.value),
    interruptedAgo,
    interruptedTokens: computed(() => found.value?.assets.length ?? 0),
    check,
    dismissInterrupted,
  }
}
