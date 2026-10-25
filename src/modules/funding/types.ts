/**
 * The parts of GET /borrower/funding read outside the Funding page. The page
 * itself still reads the response untyped; widen these as it moves over.
 */

/** One funding program, as matched to the borrower by the funding engine. */
export interface FundingSequencing {
  id: number
  /** Active = likely eligible now; see ENGINE_STATUS_VALUES in config/funding. */
  engine_status?: string
  [key: string]: unknown
}

export interface FundingGroup {
  sequencings: FundingSequencing[]
  [key: string]: unknown
}

export interface FundingOptions {
  groups: FundingGroup[]
  types?: Array<{ id: number | string; name: string }>
  stats?: Record<string, unknown>
}

export interface FundingOptionsResponse {
  status: boolean
  message?: string
  data: FundingOptions
}
