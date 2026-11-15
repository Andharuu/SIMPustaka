/** Pembantu format tampilan (tanggal dan Rupiah). */

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return dateFormatter.format(date)
}

export function formatRupiah(value) {
  const number = Number(value ?? 0)
  return rupiahFormatter.format(Number.isFinite(number) ? number : 0)
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

export const MEMBER_TYPE_LABEL = {
  STUDENT: 'Mahasiswa',
  LECTURER: 'Dosen',
}

export const MEMBER_TYPE_IDENTITY_LABEL = {
  STUDENT: 'NIM',
  LECTURER: 'NIP',
}
