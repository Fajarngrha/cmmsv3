/** Section produksi yang dipakai Inventory (data terpusat per area). */
export const INVENTORY_SECTIONS = [
  'Umum',
  'Molding',
  'Molding ZNDC',
  'Molding Sekei',
  'Die Casting',
  'PM Finishing',
  'PM Lathe Cam & Boss',
  'Heat Treatment',
  '3 Set Assy',
  'Machine 1',
  'Machine 2',
  'Press',
  'Pulley Assy',
  'Kariseikei',
  'QC',
] as const

export type InventorySection = (typeof INVENTORY_SECTIONS)[number]
