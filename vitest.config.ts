import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      pool: 'threads',
      // As the admin portal: each worker boots its own jsdom+MSW environment, so an
      // uncapped pool (one per core, ~15 here) starves timers and findBy/waitFor calls
      // in a full run. CI's runner (4 vCPU) already uses fewer than this.
      maxWorkers: 4,
      minWorkers: 1,
      environment: 'jsdom',
      globals: true,
      setupFiles: ['tests/setup.ts'],
      include: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
      css: false,
      // The suite has grown large enough that a full run spins up many
      // concurrent jsdom/MSW environments; under that CPU contention,
      // individual findBy/waitFor calls can get timer-starved past the
      // 5000ms/1000ms defaults even though nothing is actually broken.
      testTimeout: 20000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx,js,jsx}'],
        exclude: ['src/**/*.d.ts', 'src/main.jsx'],
      },
    },
  })
)
