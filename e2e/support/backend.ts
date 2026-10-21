import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { BORROWER_EMAIL, BORROWER_PASSWORD } from './env'

// The submit-flow specs need a little local test data that the portal itself
// cannot create (an unpaid invoice) or restore (the account password). Both
// come from local-only seeders in fch-backend-api, run here through artisan.
export const BACKEND_PATH = process.env.E2E_BACKEND_PATH || path.resolve(process.cwd(), '../fch-backend-api')

export function runSeeder(seederClass: string): string {
  return execFileSync('php', ['artisan', 'db:seed', `--class=${seederClass}`, '--no-interaction'], {
    cwd: BACKEND_PATH,
    env: { ...process.env, E2E_BORROWER_EMAIL: BORROWER_EMAIL, E2E_BORROWER_PASSWORD: BORROWER_PASSWORD },
    encoding: 'utf8',
    timeout: 120_000,
  })
}
