/**
 * Priority Queue for SharedWorker Data Fetching
 */

import type { DataKey, Priority } from '../types'
import { PRIORITY_VALUES } from '../types'

export interface QueueItem {
  dataKey: DataKey
  priority: Priority
  addedAt: number
  retryCount: number
}

/**
 * Priority Queue that sorts by priority (critical first) then by time added
 */
export class PriorityQueue {
  private items: QueueItem[] = []
  private processing = new Set<DataKey>()

  /**
   * Add item to queue or update its priority if already exists
   */
  enqueue(dataKey: DataKey, priority: Priority): void {
    // Remove existing entry for this dataKey (to update priority)
    const existingIndex = this.items.findIndex((item) => item.dataKey === dataKey)
    let retryCount = 0

    if (existingIndex !== -1) {
      retryCount = this.items[existingIndex].retryCount
      this.items.splice(existingIndex, 1)
    }

    this.items.push({
      dataKey,
      priority,
      addedAt: Date.now(),
      retryCount,
    })

    this.sort()
  }

  /**
   * Get next item to process (highest priority, not currently processing)
   */
  dequeue(): QueueItem | undefined {
    // Find first item not currently being processed
    const index = this.items.findIndex((item) => !this.processing.has(item.dataKey))

    if (index === -1) return undefined

    const item = this.items[index]
    this.processing.add(item.dataKey)
    return item
  }

  /**
   * Peek at next item without removing
   */
  peek(): QueueItem | undefined {
    return this.items.find((item) => !this.processing.has(item.dataKey))
  }

  /**
   * Mark item as completed (success) - removes from queue
   */
  complete(dataKey: DataKey): void {
    this.processing.delete(dataKey)
    this.items = this.items.filter((item) => item.dataKey !== dataKey)
  }

  /**
   * Mark item for retry (failure) - moves to back of same priority
   */
  retry(dataKey: DataKey): void {
    this.processing.delete(dataKey)
    const item = this.items.find((i) => i.dataKey === dataKey)
    if (item) {
      item.retryCount++
      item.addedAt = Date.now() // Move to back of same priority level
      this.sort()
    }
  }

  /**
   * Update priority of an item
   */
  updatePriority(dataKey: DataKey, newPriority: Priority): void {
    const item = this.items.find((i) => i.dataKey === dataKey)
    if (item) {
      item.priority = newPriority
      this.sort()
    }
  }

  /**
   * Check if a dataKey is in the queue (including processing)
   */
  has(dataKey: DataKey): boolean {
    return this.items.some((item) => item.dataKey === dataKey)
  }

  /**
   * Check if a dataKey is currently being processed
   */
  isProcessing(dataKey: DataKey): boolean {
    return this.processing.has(dataKey)
  }

  /**
   * Remove item from queue entirely
   */
  remove(dataKey: DataKey): void {
    this.processing.delete(dataKey)
    this.items = this.items.filter((item) => item.dataKey !== dataKey)
  }

  /**
   * Get current queue size
   */
  get size(): number {
    return this.items.length
  }

  /**
   * Check if queue is empty (no items waiting)
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Get number of items currently processing
   */
  get processingCount(): number {
    return this.processing.size
  }

  /**
   * Get all items (for debugging)
   */
  getAll(): QueueItem[] {
    return [...this.items]
  }

  /**
   * Clear the entire queue
   */
  clear(): void {
    this.items = []
    this.processing.clear()
  }

  /**
   * Clear only the processing set (for when connections reset)
   * Items stay in queue but are no longer marked as processing
   */
  clearProcessing(): void {
    this.processing.clear()
  }

  /**
   * Sort queue by priority (lower value = higher priority), then by addedAt
   */
  private sort(): void {
    this.items.sort((a, b) => {
      const priorityDiff = PRIORITY_VALUES[a.priority] - PRIORITY_VALUES[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.addedAt - b.addedAt
    })
  }

  /**
   * Bulk update priorities based on new route
   */
  updatePriorities(newPriorities: Map<DataKey, Priority>): void {
    for (const item of this.items) {
      const newPriority = newPriorities.get(item.dataKey)
      if (newPriority) {
        item.priority = newPriority
      }
    }
    this.sort()
  }

  /**
   * Enqueue multiple items at once
   */
  enqueueMany(items: Array<{ dataKey: DataKey; priority: Priority }>): void {
    for (const { dataKey, priority } of items) {
      this.enqueue(dataKey, priority)
    }
  }
}
