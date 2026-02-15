/**
 * Menghitung usia mesin dari tanggal instalasi (format YYYY-MM-DD atau YYYY-MM-01)
 * hingga bulan dan tahun sekarang.
 */
export function hitungUsiaMesin(tanggalInstalasi: string | undefined): string {
  if (!tanggalInstalasi) return '—'
  const install = new Date(tanggalInstalasi)
  const now = new Date()
  if (isNaN(install.getTime()) || install > now) return '—'
  let bulan = (now.getFullYear() - install.getFullYear()) * 12 + (now.getMonth() - install.getMonth())
  if (now.getDate() < install.getDate()) bulan -= 1
  if (bulan < 0) return '—'
  if (bulan < 12) return `${bulan} bulan`
  const tahun = Math.floor(bulan / 12)
  const sisaBulan = bulan % 12
  return sisaBulan === 0 ? `${tahun} tahun` : `${tahun} tahun ${sisaBulan} bulan`
}

/** Format "YYYY-MM-DD" ke "Bulan Tahun" (e.g. April 2022) */
export function formatBulanTahunInstalasi(installedAt: string | undefined): string {
  if (!installedAt) return '—'
  const d = new Date(installedAt)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}
