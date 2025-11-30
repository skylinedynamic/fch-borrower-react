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
