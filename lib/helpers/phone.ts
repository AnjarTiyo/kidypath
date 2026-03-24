/**
 * Checks if the input looks like an Indonesian phone number.
 * Accepts formats: 08xxx, +628xxx, 628xxx
 */
export function isPhoneNumber(input: string): boolean {
  const digits = input.replace(/\D/g, '')
  return (
    /^08\d{7,12}$/.test(input.trim()) ||
    /^(\+62|62)8\d{7,11}$/.test(input.trim()) ||
    /^628\d{7,11}$/.test(digits)
  )
}

/**
 * Normalizes Indonesian phone numbers to the 08xxx local format for DB storage.
 * Examples:
 *   +628123456789 → 08123456789
 *   628123456789  → 08123456789
 *   08123456789   → 08123456789
 */
export function normalizePhoneToLocal(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('62')) {
    return '0' + digits.slice(2)
  }
  return digits
}
