// Shared settings for the live-backend E2E suite. The suite runs against the
// local fch-backend-api dev server (matching .env's VITE_API_BASE_URL) and a
// borrower account that exists in the local `fch_dev` database. Override any
// of these with environment variables when your local data differs.
export const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

export const BORROWER_EMAIL = process.env.E2E_BORROWER_EMAIL || 'craig-borrower@fourcornerholdings.com'
export const BORROWER_PASSWORD = process.env.E2E_BORROWER_PASSWORD || '12345678'

// Saved by auth.setup.ts and reused by every authenticated spec.
export const AUTH_STATE_PATH = 'e2e/.auth/borrower.json'

// Local Passport token issuance and the un-pooled PHP dev server are slow.
export const SLOW_TIMEOUT = 30_000
