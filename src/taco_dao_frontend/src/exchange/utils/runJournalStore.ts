/**
 * The app's run journal instance: localStorage, written with cache eviction
 * on a full storage (the journal is a recovery record, cache data goes first).
 */
import { RunJournal } from './crossDexJournal'
import { realClock } from './crossDexLegRunner'
import { setItemWithCacheEviction } from './persistCache'

const ls = (): Storage | null => { try { return window.localStorage } catch { return null } }

/** localStorage, with setItem freeing exchange cache space and retrying once on a full storage. */
export const journalStorage: Storage = {
  get length() { try { return ls()?.length ?? 0 } catch { return 0 } },
  key: (i: number) => { try { return ls()?.key(i) ?? null } catch { return null } },
  getItem: (k: string) => { try { return ls()?.getItem(k) ?? null } catch { return null } },
  setItem: (k: string, v: string) => {
    if (!ls()) throw new Error('storage unavailable')
    setItemWithCacheEviction(k, v)
  },
  removeItem: (k: string) => { try { ls()?.removeItem(k) } catch { /* ignore */ } },
  clear: () => { /* never */ },
}

export const runJournal = new RunJournal(journalStorage, realClock)
