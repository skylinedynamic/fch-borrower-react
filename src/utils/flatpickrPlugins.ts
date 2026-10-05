/**
 * Year behavior plugin for Flatpickr.
 * Retains Flatpickr's native editable year input and dropdown month selection,
 * allowing input-wise editing (e.g. typing 2026 to 2010) and arrow navigation
 * across all date pickers without DOM hiding or CSS !important blocking.
 */
export const yearDropdownPlugin = (_minYear = 1900, _maxYear?: number) => {
  return () => ({})
}
