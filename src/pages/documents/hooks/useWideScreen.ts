import { useEffect, useState } from 'react'

/** Bootstrap's lg breakpoint: from here Documents shows the split view. */
const WIDE_SCREEN_QUERY = '(min-width: 992px)'

/** Whether the screen is wide enough for the split view, kept up to date as it resizes. */
export function useWideScreen(): boolean {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE_SCREEN_QUERY).matches)

  useEffect(() => {
    const query = window.matchMedia(WIDE_SCREEN_QUERY)
    const onChange = () => setWide(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return wide
}
