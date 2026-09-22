import { apiClient } from '../../lib/http/apiClient'

/**
 * Countries, states and cities, served by the API.
 *
 * Replaces the hardcoded copy that used to live in src/data/countries.ts. That
 * file and the partner portal's own copy drifted from the server's list — the
 * "Unknown" state and city entries exist only on the server — so the data is now
 * fetched from `GET /common/locations`, which reads config/locations.php.
 *
 * `countries` stays a plain array so every call site keeps reading it
 * synchronously, exactly as it read the old constant. It is filled in place by
 * loadLocations(), which main.jsx awaits before the app renders — so by the time
 * any component mounts, the array is populated.
 */

export interface State {
  name: string
  code: string
  cities: string[]
}

export interface Country {
  name: string
  code: string
  currency: string
  phone_code: string
  flag: string
  states: State[]
}

interface LocationResponse {
  status: boolean
  message: string
  data: Country[]
}

/**
 * The live list. Mutated in place rather than reassigned: importers bind to this
 * array, and replacing the binding would leave them holding the empty original.
 */
export const countries: Country[] = []

let request: Promise<Country[]> | null = null

/**
 * Fetch the tree once and fill `countries`.
 *
 * Safe to call repeatedly — concurrent callers share one request, and a failure
 * is not cached so the next caller retries.
 */
export const loadLocations = async (): Promise<Country[]> => {
  if (!request) {
    request = apiClient
      .get<LocationResponse>('/common/locations')
      .then((res) => {
        const data = res.data?.data ?? []
        countries.splice(0, countries.length, ...data)
        return countries
      })
      .catch((err) => {
        request = null
        throw err
      })
  }

  return request
}

/** True once the list has arrived. */
export const locationsLoaded = (): boolean => countries.length > 0

/** Drop the cached request and the loaded data. Only needed by tests. */
export const clearLocationCache = (): void => {
  request = null
  countries.splice(0, countries.length)
}
