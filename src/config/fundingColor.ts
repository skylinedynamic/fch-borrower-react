import { FUNDING_COLOR_MAP } from './funding';

export interface ColorStyle {
    bg: string;
    text: string;
}

export const FUNDING_COLOR_STYLES: Record<string, ColorStyle> = {
    success: { bg: '#e8f9f0', text: '#1a7a4a' },
    primary: { bg: '#eef2ff', text: '#3b52d4' },
    info:    { bg: '#e0f2fe', text: '#0369a1' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    danger:  { bg: '#fee2e2', text: '#991b1b' },
    purple:  { bg: '#f3e8ff', text: '#6b21a8' },
    teal:    { bg: '#ccfbf1', text: '#0f766e' },
    orange:  { bg: '#ffedd5', text: '#9a3412' },
    pink:    { bg: '#fce7f3', text: '#9d174d' },
    indigo:  { bg: '#e0e7ff', text: '#3730a3' },
    cyan:    { bg: '#cffafe', text: '#155e75' },
    green:   { bg: '#dcfce7', text: '#15803d' },
    blue:    { bg: '#dbeafe', text: '#1d4ed8' },
    yellow:  { bg: '#fef9c3', text: '#854d0e' },
    red:     { bg: '#fee2e2', text: '#b91c1c' },
};

const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const isHexColor = (value: string) => hexColorRegex.test(value);

const normalizeColorKey = (value: string) =>
    value.toLowerCase().trim().replace(/[_\s]+/g, '-');

export const getFundingColorStyles = (color: any): ColorStyle => {
    const raw = String(color ?? '').trim();
    if (!raw) return FUNDING_COLOR_STYLES.primary;

    if (isHexColor(raw)) {
        return { bg: '#ffffff', text: raw };
    }

    const key = normalizeColorKey(raw);
    const mappedToken = FUNDING_COLOR_MAP[key]
        ? String(FUNDING_COLOR_MAP[key]).trim().toLowerCase()
        : key;

    return FUNDING_COLOR_STYLES[mappedToken] || FUNDING_COLOR_STYLES.primary;
};
