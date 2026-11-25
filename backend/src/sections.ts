export const INVENTORY_SECTIONS = [
  'Maintenance 2W',
  'Maintenance 4W',
  'Warehouse 2w',
  'Warehouse 4w',
  'Maintenace Dies 2w',
  'Maintenace Dies 4w',
] as const

function sectionKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Samakan spasi, huruf besar/kecil, dan baris baru dari CSV ke nama section standar. */
export function canonicalSection(value: unknown): string {
  const cleaned = String(value ?? '').replace(/[\s\u00a0]+/g, ' ').trim()
  if (!cleaned) return 'Umum'
  const key = sectionKey(cleaned)
  const found = INVENTORY_SECTIONS.find((section) => sectionKey(section) === key)
  return found ?? cleaned
}
