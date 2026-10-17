/**
 * Cached Intl formatters for render paths (table rows, post lists).
 *
 * toLocaleDateString, toLocaleTimeString and Number toLocaleString with options
 * build a new ICU formatter on every call, which adds up per row and per render.
 * These helpers return the same strings from one formatter per locale and
 * options. Like the toLocale* calls they follow the device time zone: the date
 * formatters are dropped when the zone or its offsets change (checked at most
 * once a second). Anything the cache would not format exactly like the original
 * call (an invalid Date or a non Date, a non number, options without a field of
 * the asked kind or with a style) goes through the original call, so
 * 'Invalid Date' and the errors stay the same.
 */

const DATE_FIELDS = ['weekday', 'year', 'month', 'day'] as const
const TIME_FIELDS = ['dayPeriod', 'hour', 'minute', 'second', 'fractionalSecondDigits'] as const

const dateFormats = new Map<string, Intl.DateTimeFormat>()
const numberFormats = new Map<string, Intl.NumberFormat>()
let zone = ''
let zoneCheckedAt = 0

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const now = Date.now()
  if (now - zoneCheckedAt >= 1000) {
    zoneCheckedAt = now
    const date = new Date(now)
    const current = `${new Intl.DateTimeFormat().resolvedOptions().timeZone} ${date.getTimezoneOffset()} ${new Date(date.getFullYear(), 0, 1).getTimezoneOffset()}`
    if (current !== zone) {
      zone = current
      dateFormats.clear()
    }
  }
  const key = locale + JSON.stringify(options)
  let format = dateFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    dateFormats.set(key, format)
  }
  return format
}

function cacheable(date: unknown, options: Intl.DateTimeFormatOptions, fields: readonly string[]): boolean {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || !options) return false
  const o = options as Record<string, unknown>
  return o.dateStyle === undefined && o.timeStyle === undefined && fields.some((field) => o[field] !== undefined)
}

/** Same as date.toLocaleDateString(locale, options). */
export function localeDateString(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return cacheable(date, options, DATE_FIELDS)
    ? dateFormat(locale, options).format(date)
    : date.toLocaleDateString(locale, options)
}

/** Same as date.toLocaleTimeString(locale, options). */
export function localeTimeString(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return cacheable(date, options, TIME_FIELDS)
    ? dateFormat(locale, options).format(date)
    : date.toLocaleTimeString(locale, options)
}

/** Same as value.toLocaleString(locale, options) for a number. */
export function localeNumberString(value: number, locale: string, options: Intl.NumberFormatOptions): string {
  if (typeof value !== 'number') return (value as any).toLocaleString(locale, options)
  const key = locale + JSON.stringify(options)
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, options)
    numberFormats.set(key, format)
  }
  return format.format(value)
}
