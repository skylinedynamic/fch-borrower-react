/**
 * Parsing and rendering API date values without shifting the day.
 *
 * The API sends two shapes, and they must be parsed differently:
 *
 *   date-only   "1985-04-12"            a calendar date (toDateOnly server-side)
 *   datetime    "2026-09-13 09:56:38"   already converted to the viewer's zone
 *                                       by toTimezone server-side
 *
 * `new Date("1985-04-12")` is specified to parse as **UTC midnight**, so
 * rendering it with toLocaleDateString() shows the previous day anywhere behind
 * UTC — 12 April becomes 11 April in Chicago. Appending a time makes the engine
 * parse it as local midnight instead, which is what a calendar date means.
 *
 * The datetime shape has no zone marker and is already local, so a plain parse
 * is correct for it.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse an API date value into a Date that represents the intended local day.
 */
export const parseApiDate = (value?: string | null): Date | null => {
    if (!value) return null;

    const raw = String(value).trim();

    // A bare calendar date: pin it to local midnight so the day cannot move.
    const normalised = DATE_ONLY.test(raw)
        ? `${raw}T00:00:00`
        : raw.includes('T') ? raw : raw.replace(' ', 'T');

    const date = new Date(normalised);

    return Number.isNaN(date.getTime()) ? null : date;
};

/** True when the value is a calendar date with no time component. */
export const isDateOnly = (value?: string | null): boolean =>
    !!value && DATE_ONLY.test(String(value).trim());

/**
 * Render an API date value. Falls back to the raw string when unparseable, so a
 * value in an unexpected shape is shown rather than swallowed.
 */
export const formatApiDate = (
    value?: string | null,
    withTime = false,
    fallback: string | null = null
): string | null => {
    if (!value) return fallback;

    const date = parseApiDate(value);
    if (!date) return String(value);

    // A calendar date has no time to show, whatever the caller asked for.
    const showTime = withTime && !isDateOnly(value);

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(showTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
};

/**
 * A calendar date in day-month-year order: "6 Jun 1981".
 *
 * Matches the `altFormat: "j M, Y"` the flatpickr pickers display, so a
 * read-only copy of a value reads the same as the picker sitting next to it.
 *
 * Use this rather than `new Date(value).toLocaleDateString(...)` for a date the
 * API sent as a bare calendar date. A date of birth or a business start date is
 * the same date in every timezone; parsing it with `new Date()` makes it UTC
 * midnight, which renders as the previous day anywhere behind UTC.
 *
 * Returns the raw string when unparseable, rather than "Invalid Date".
 */
export const formatCalendarDate = (value?: string | null): string => {
    if (!value) return '';

    const date = parseApiDate(value);

    return date
        ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : String(value);
};
