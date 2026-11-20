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
  // Excel Indonesia memakai pemisah ";". Baris sep=, memaksa Excel memecah kolom dengan koma.
  const excelHint = content.trimStart().toLowerCase().startsWith('sep=') ? '' : 'sep=,\r\n'
  const blob = new Blob([BOM + excelHint + content], { type: 'text/csv;charset=utf-8' })
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

function detectCsvDelimiter(text: string): ',' | ';' {
  const firstLine = text.split('\n').find((line) => {
    const t = line.trim()
    return t !== '' && !/^sep=/i.test(t)
  })
  if (!firstLine) return ','
  let commas = 0
  let semis = 0
  let inQuotes = false
  for (let i = 0; i < firstLine.length; i++) {
    const c = firstLine[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (inQuotes) continue
    if (c === ',') commas++
    if (c === ';') semis++
  }
  return semis > commas ? ';' : ','
}

function parseCsvWithDelimiter(text: string, delimiter: ',' | ';'): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
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
    if (c === delimiter || c === '\n') {
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
 * Parse CSV string menjadi array of rows (array of string[]).
 * Menangani BOM UTF-8, quoted field, \r\n, dan pemisah koma atau titik koma (Excel Indonesia).
 */
export function parseCsvToRows(csvText: string): string[][] {
  let normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\uFEFF/g, '')
  normalized = normalized
    .split('\n')
    .filter((line) => !/^sep=/i.test(line.trim()))
    .join('\n')
  let rows = parseCsvWithDelimiter(normalized, detectCsvDelimiter(normalized))
  const first = rows[0]
  if (first && first.length === 1 && /[,;]/.test(first[0])) {
    const innerDelim: ',' | ';' = first[0].includes(';') && first[0].split(';').length > first[0].split(',').length ? ';' : ','
    rows = parseCsvWithDelimiter(
      rows.map((r) => r.join(innerDelim)).join('\n'),
      innerDelim
    )
  }
  return rows
}

/**
 * Ambil nilai kolom CSV tanpa peduli huruf besar/kecil atau alias header.
 */
export function csvField(row: Record<string, string>, ...aliases: string[]): string {
  for (const alias of aliases) {
    const direct = row[alias]
    if (direct != null && String(direct).trim() !== '') return String(direct).trim()
  }
  const lowerMap = new Map<string, string>()
  for (const [key, value] of Object.entries(row)) {
    lowerMap.set(key.trim().toLowerCase(), value)
  }
  for (const alias of aliases) {
    const value = lowerMap.get(alias.trim().toLowerCase())
    if (value != null && value.trim() !== '') return value.trim()
  }
  return ''
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
