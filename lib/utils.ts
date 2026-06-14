import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Split an array into consecutive chunks of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * True on local dev and Vercel preview deploys, false in production. Gates
 * dev-only test affordances (e.g. the `?force` flag on the notification crons).
 * Safe when `VERCEL_ENV` is unset (self-hosted prod): NODE_ENV stays "production".
 */
export function isNonProductionEnv(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview"
  )
}
