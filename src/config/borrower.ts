/**
 * A borrower's age range on the date-of-birth pickers (BUG-005). The API
 * refuses anything outside it (fch-api config borrower.date_of_birth).
 */
export const BORROWER_AGE = { MIN: 18, MAX: 120 } as const
