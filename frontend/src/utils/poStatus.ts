/** Nilai status PO (untuk API dan state) */
export type POStatusValue =
  | 'Tahap 1'
  | 'Tahap 2'
  | 'Tahap 3'
  | 'Tahap 4'
  | 'Tahap 5'
  | 'Tahap 6'
  | 'Tahap 7'

/** Label tampilan untuk setiap status */
export const PO_STATUS_LABELS: Record<POStatusValue, string> = {
  'Tahap 1': 'Tahap 1: Request Penawaran',
  'Tahap 2': 'Tahap 2: Create SPB',
  'Tahap 3': 'Tahap 3: CHECK BUDGET',
  'Tahap 4': 'Tahap 4: Check Draft',
  'Tahap 5': 'Tahap 5: Send Produksi',
  'Tahap 6': 'Tahap 6: Release PO',
  'Tahap 7': 'Tahap 7: COMPLETED',
}

export const PO_STATUS_OPTIONS: { value: POStatusValue; label: string }[] = [
  { value: 'Tahap 1', label: PO_STATUS_LABELS['Tahap 1'] },
  { value: 'Tahap 2', label: PO_STATUS_LABELS['Tahap 2'] },
  { value: 'Tahap 3', label: PO_STATUS_LABELS['Tahap 3'] },
  { value: 'Tahap 4', label: PO_STATUS_LABELS['Tahap 4'] },
  { value: 'Tahap 5', label: PO_STATUS_LABELS['Tahap 5'] },
  { value: 'Tahap 6', label: PO_STATUS_LABELS['Tahap 6'] },
  { value: 'Tahap 7', label: PO_STATUS_LABELS['Tahap 7'] },
]

export function getPOStatusLabel(status: string): string {
  return PO_STATUS_LABELS[status as POStatusValue] ?? status
}
