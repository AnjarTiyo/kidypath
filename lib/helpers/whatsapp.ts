export const KIRIMCHAT_ENDPOINT =
  'https://api-prod.kirim.chat/api/v1/public/messages/send'

export type WeeklyReportPayloadParams = {
  phoneNumber: string
  parentName: string
  childName: string
  startDate: string
  endDate: string
  reportLink: string
}

export const buildWeeklyReportPayload = ({
  phoneNumber,
  parentName,
  childName,
  startDate,
  endDate,
  reportLink,
}: WeeklyReportPayloadParams) => {
  const content = `Halo Ayah/Bunda ${parentName} 👋

Kami ingin menyampaikan bahwa laporan perkembangan mingguan ananda *${childName}* untuk periode *${startDate} s.d ${endDate}* telah tersedia di KidyPath.

Silakan Ayah/Bunda dapat melihat detail laporan melalui link berikut:
🔗 ${reportLink}

Terima kasih atas kerja sama dan dukungannya dalam mendampingi tumbuh kembang ananda 🌱`

  return {
    phone_number: phoneNumber,
    channel: 'whatsapp',
    message_type: 'text',
    content,
  }
}

/**
 * Normalizes Indonesian phone numbers to the 628xx format required by kirim.chat.
 * Examples: 08123456789 → 628123456789, +628123456789 → 628123456789
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1)
  }
  if (digits.startsWith('62')) {
    return digits
  }
  // Assume it's already a valid international number without country code
  return digits
}
