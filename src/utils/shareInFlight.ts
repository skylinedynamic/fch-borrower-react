/**
 * Wraps an async call so that callers arriving while it is running get that
 * same call rather than starting another. Once it settles, the next caller
 * starts a fresh one.
 *
 * For start-up calls made outside TanStack Query (which already does this for
 * its queries): StrictMode runs effects twice in development, and two parts of
 * the app can ask for the same thing at once.
 */
export function shareInFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let running: Promise<T> | null = null
  return () => {
    if (!running) {
      running = fn().finally(() => {
        running = null
      })
    }
    return running
  }
}
