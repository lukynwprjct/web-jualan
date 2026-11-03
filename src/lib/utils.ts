/** Utility functions */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function normalizeWhatsApp(number: string): string {
  // Remove +, 62, leading 0, spaces
  let cleaned = number.replace(/\D/g, '')
  
  // Remove leading 0 or 62
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2)
  }
  
  return cleaned
}

export function isValidWhatsApp(number: string): boolean {
  // Basic WhatsApp number validation
  const normalized = normalizeWhatsApp(number)
  return normalized.length >= 8 && normalized.length <= 15 && /^\d+$/.test(normalized)
}