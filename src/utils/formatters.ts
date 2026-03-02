/**
 * Formats a phone number string into (###) ###-#### format
 * @param value The raw phone number string
 * @returns The formatted phone number string
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '')

  // Format as (###) ###-####
  if (phoneNumber.length <= 3) {
    return phoneNumber
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }
}

/**
 * Formats the Last 4 SSN input to ensure only digits and max 4 characters
 * @param value The raw input string
 * @returns The formatted string
 */
export const formatLast4SSN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4)
}

/**
 * Formats a currency value with comma separators and supports decimal points
 * @param value The raw input string or number
 * @returns The formatted currency string with commas
 */
export const formatCurrency = (value: string | number): string => {
  if (value === null || value === undefined) return ''
  const stringValue = value.toString()
  if (!stringValue.trim()) return ''

  // Split into integer and decimal parts
  const parts = stringValue.split('.')

  // Remove all non-digit characters from the integer part
  let integerPart = parts[0].replace(/\D/g, '')

  // Handle case where user starts with a decimal point (e.g., .5 -> 0.5)
  if (integerPart === '' && parts.length > 1) {
    integerPart = '0'
  }

  // If empty and no decimal, return empty string
  if (integerPart === '' && parts.length === 1) return ''

  // Format integer part with commas
  const formattedInteger = Number(integerPart).toLocaleString('en-US')

  // Combine with decimal part if it exists
  if (parts.length > 1) {
    // Only allow digits in the decimal part (limit to 2 decimal places usually, but keeping it flexible here)
    const decimalPart = parts[1].replace(/\D/g, '')
    return `${formattedInteger}.${decimalPart}`
  }

  return formattedInteger
}

/**
 * Removes formatting from currency string to get raw numeric value, preserving the decimal point
 * @param value The formatted currency string
 * @returns The raw numeric string
 */
export const unformatCurrency = (value: string): string => {
  if (!value) return ''
  // Remove everything except digits and decimal point
  const cleaned = value.replace(/[^\d.]/g, '')

  // Ensure only the first decimal point is kept if there are multiple
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`
  }
  return cleaned
}

/**
 * Formats the SSN input to ensure only digits and max 9 characters in ###-###-### format
 * @param value The raw input string
 * @returns The formatted string
 */
export const formatSSN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`
}

/**
 * Removes hyphens from SSN string
 * @param value The formatted SSN string
 * @returns The raw numeric string
 */
export const unformatSSN = (value: string): string => {
  return value.replace(/\D/g, '')
}

/**
 * Formats the DUNS input to ensure only digits and max 9 characters
 * @param value The raw input string
 * @returns The formatted string
 */
export const formatDUNS = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9)
}

/**
 * Formats the EIN input to ensure only digits and max 9 characters
 * @param value The raw input string
 * @returns The formatted string
 */
export const formatEIN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9)
}
