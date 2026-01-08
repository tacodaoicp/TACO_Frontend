/**
 * IndexedDB Wrapper for SharedWorker Data Caching
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { DataKey, DataState, CachedData, CACHE_VERSION } from '../types'

const DB_NAME = 'taco-dao-cache'
const DB_VERSION = 1
const STORE_NAME = 'dataCache'

interface TacoDBSchema {
  dataCache: {
    key: DataKey
    value: CachedData
  }
}

let dbInstance: IDBPDatabase<TacoDBSchema> | null = null

/**
 * Initialize or get the IndexedDB instance
 */
export async function getDB(): Promise<IDBPDatabase<TacoDBSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<TacoDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create data cache store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'dataKey' })
        store.createIndex('by-updated', 'lastUpdated')
      }
    },
    blocked() {
      console.warn('[IndexedDB] Database upgrade blocked - close other tabs')
    },
    blocking() {
      // Close current connection to allow upgrade in other tab
      dbInstance?.close()
      dbInstance = null
    },
    terminated() {
      dbInstance = null
    },
  })

  return dbInstance
}

/**
 * Get cached data for a specific key
 */
export async function getCached<T>(dataKey: DataKey): Promise<DataState<T> | null> {
  try {
    const db = await getDB()
    const cached = await db.get(STORE_NAME, dataKey)

    if (!cached) return null

    // Check if cache version matches
    if (cached.version !== 1) {
      // Outdated cache format, delete it
      await db.delete(STORE_NAME, dataKey)
      return null
    }

    return {
      data: cached.data as T,
      lastUpdated: cached.lastUpdated,
      loading: false,
      error: null,
      stale: false, // Will be recalculated by caller
    }
  } catch (error) {
    console.error(`[IndexedDB] Error getting cached data for ${dataKey}:`, error)
    return null
  }
}

/**
 * Store data in cache
 */
export async function setCached<T>(dataKey: DataKey, data: T): Promise<void> {
  try {
    const db = await getDB()
    const cached: CachedData<T> = {
      dataKey,
      data,
      lastUpdated: Date.now(),
      version: 1,
    }
    await db.put(STORE_NAME, cached)
  } catch (error) {
    console.error(`[IndexedDB] Error caching data for ${dataKey}:`, error)
  }
}

/**
 * Get all cached data
 */
export async function getAllCached(): Promise<Map<DataKey, DataState>> {
  const result = new Map<DataKey, DataState>()

  try {
    const db = await getDB()
    const all = await db.getAll(STORE_NAME)

    for (const cached of all) {
      if (cached.version === 1) {
        result.set(cached.dataKey, {
          data: cached.data,
          lastUpdated: cached.lastUpdated,
          loading: false,
          error: null,
          stale: false,
        })
      }
    }
  } catch (error) {
    console.error('[IndexedDB] Error getting all cached data:', error)
  }

  return result
}

/**
 * Delete cached data for a specific key
 */
export async function deleteCached(dataKey: DataKey): Promise<void> {
  try {
    const db = await getDB()
    await db.delete(STORE_NAME, dataKey)
  } catch (error) {
    console.error(`[IndexedDB] Error deleting cached data for ${dataKey}:`, error)
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCached(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear(STORE_NAME)
  } catch (error) {
    console.error('[IndexedDB] Error clearing cache:', error)
  }
}

/**
 * Clear stale data older than specified threshold
 */
export async function clearStaleData(olderThanMs: number): Promise<number> {
  let deleted = 0
  try {
    const db = await getDB()
    const threshold = Date.now() - olderThanMs
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const index = tx.store.index('by-updated')

    // Get all entries older than threshold
    const range = IDBKeyRange.upperBound(threshold)
    let cursor = await index.openCursor(range)

    while (cursor) {
      await cursor.delete()
      deleted++
      cursor = await cursor.continue()
    }

    await tx.done
  } catch (error) {
    console.error('[IndexedDB] Error clearing stale data:', error)
  }

  return deleted
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  count: number
  oldestEntry: number | null
  newestEntry: number | null
}> {
  try {
    const db = await getDB()
    const all = await db.getAll(STORE_NAME)

    if (all.length === 0) {
      return { count: 0, oldestEntry: null, newestEntry: null }
    }

    const timestamps = all.map((c) => c.lastUpdated)
    return {
      count: all.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    }
  } catch (error) {
    console.error('[IndexedDB] Error getting cache stats:', error)
    return { count: 0, oldestEntry: null, newestEntry: null }
  }
}
