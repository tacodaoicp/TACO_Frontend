/**
 * Singleton toast notification composable for the exchange UI.
 * Module-level state — all callers share the same toast array.
 */

import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ExchangeToast {
  id: number
  type: ToastType
  title: string
  message?: string
  duration: number
  createdAt: number
}

const toasts = ref<ExchangeToast[]>([])
const MAX_TOASTS = 5

const DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
}

function addToast(type: ToastType, title: string, message?: string, duration?: number) {
  const toast: ExchangeToast = {
    id: Date.now() + Math.random(),
    type,
    title,
    message,
    duration: duration ?? DURATIONS[type],
    createdAt: Date.now(),
  }
  toasts.value.push(toast)
  if (toasts.value.length > MAX_TOASTS) toasts.value.shift()
  setTimeout(() => removeToast(toast.id), toast.duration)
  return toast.id
}

function removeToast(id: number) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export function useExchangeToast() {
  return {
    toasts,
    removeToast,
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
  }
}
