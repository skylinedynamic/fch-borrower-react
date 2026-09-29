import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { server } from './mocks/server'

// Matches vitest.config.ts's testTimeout — a full suite run spins up many
// concurrent jsdom/MSW environments, and under that CPU contention findBy/
// waitFor's 1000ms default can get timer-starved even when nothing's broken.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())

// jsdom's Blob implements arrayBuffer() but not stream(). undici (Node's fetch,
// which MSW builds its Response objects with) duck-types blob-like values and
// calls .stream() on them, so a mocked XHR read with responseType 'blob' throws
// "object.stream is not a function" from inside the interceptor's load handler.
// That kills the dispatch before the request settles, so the caller's promise
// hangs forever and the test dies on the timeout instead of the real error.
if (typeof Blob !== 'undefined' && typeof (Blob.prototype as any).stream !== 'function') {
  (Blob.prototype as any).stream = function stream(this: Blob) {
    const arrayBufferPromise = this.arrayBuffer()
    return new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(new Uint8Array(await arrayBufferPromise))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
  }
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

if (!window.ResizeObserver) {
  class MockResizeObserver implements ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
}

if (!window.IntersectionObserver) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

// jsdom doesn't implement layout, so it has no scrollIntoView at all —
// components that auto-scroll to the latest message (e.g. SupportChatWidget)
// throw "scrollIntoView is not a function" the instant they mount in a test.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}
