/** Section produksi yang dipakai Inventory (data terpusat per area). */
export const INVENTORY_SECTIONS = [
  'Maintenance 2W',
  'Maintenance 4W',
  'Warehouse 2w',
  'Warehouse 4w',
  'Maintenace Dies 2w',
  'Maintenace Dies 4w',
] as const

export type InventorySection = (typeof INVENTORY_SECTIONS)[number]
