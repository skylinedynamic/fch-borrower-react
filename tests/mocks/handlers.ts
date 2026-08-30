import type { HttpHandler } from 'msw'

/**
 * MSW request handlers, grouped by module namespace to mirror
 * src/lib/query/queryKeys.ts. Empty until a phase adds handlers for
 * the endpoints it covers — keeps unhandled requests failing loudly
 * (see onUnhandledRequest: 'error' in src/test/setup.ts) rather than
 * silently hitting the network.
 */
export const handlers: HttpHandler[] = []
