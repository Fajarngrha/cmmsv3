/**
 * Utility untuk export data ke file CSV agar bisa dibuka di Excel / print.
 */

export type CsvColumn<T> = {
  header: string
  key?: keyof T
  getValue?: (row: T) => string | number
}

function escapeCsvCell(value: string | number): string {
  const s = String(value ?? '')
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Generate string CSV dari array data dengan kolom yang diberikan.
 */
export function buildCsvContent<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerRow = columns.map((c) => escapeCsvCell(c.header)).join(',')
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const raw = col.getValue ? col.getValue(row) : (col.key ? (row as Record<string, unknown>)[col.key as string] : '')
        const val = raw !== null && raw !== undefined && (typeof raw === 'string' || typeof raw === 'number') ? raw : String(raw ?? '')
        return escapeCsvCell(val)
      })
      .join(',')
  )
  return [headerRow, ...dataRows].join('\r\n')
}

/**
 * Download string sebagai file CSV. Gunakan BOM agar Excel baca UTF-8 dengan benar.
 */
export function downloadCsv(content: string, filename: string): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export array of objects ke CSV dan trigger download.
 */
export function exportToCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string): void {
  const content = buildCsvContent(rows, columns)
  downloadCsv(content, filename)
}

/**
 * Parse CSV string menjadi array of rows (array of string[]).
 * Menangani BOM UTF-8, quoted field (dengan comma di dalam), dan \r\n.
 */
export function parseCsvToRows(csvText: string): string[][] {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\uFEFF/g, '')
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i]
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
      continue
    }
    if (c === ',' || c === '\n') {
      current.push(field.trim())
      field = ''
      if (c === '\n') {
        if (current.some((cell) => cell !== '')) rows.push(current)
        current = []
      }
      continue
    }
    field += c
  }
  if (field !== '' || current.length > 0) {
    current.push(field.trim())
    if (current.some((cell) => cell !== '')) rows.push(current)
  }
  return rows
}

/**
 * Parse CSV string dengan baris pertama sebagai header, mengembalikan array of object.
 */
export function parseCsvToObjects(csvText: string): Record<string, string>[] {
  const rows = parseCsvToRows(csvText)
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim())
  const result: Record<string, string>[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const obj: Record<string, string> = {}
    headers.forEach((header, j) => {
      obj[header] = (row[j] ?? '').trim()
    })
    result.push(obj)
  }
  return result
}
