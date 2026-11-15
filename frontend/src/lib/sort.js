import { useMemo, useState } from 'react'

/**
 * Mengurutkan data tabel/galeri berdasarkan kolom terpilih.
 *
 * `columns` berisi definisi kolom: { key, get(row), type: 'text' | 'number' | 'date' }.
 * `key` berupa string agar identitasnya stabil antar-render.
 */
export function useSortable(rows, columns, initialKey = null, initialDir = 'asc') {
  const [sort, setSort] = useState({ key: initialKey, dir: initialDir })

  const getter = useMemo(() => {
    const map = new Map(columns.map((column) => [column.key, column]))
    return (row) => map.get(sort.key)
  }, [columns, sort.key])

  const sorted = useMemo(() => {
    const column = getter()
    if (!column) return rows

    const read = (row) => {
      const value = column.get(row)
      if (column.type === 'number') return Number(value ?? 0)
      if (column.type === 'date') return value ? new Date(`${value}T00:00:00`).getTime() : 0
      return String(value ?? '').toLowerCase()
    }

    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = read(a)
      const vb = read(b)
      if (va < vb) return -1 * factor
      if (va > vb) return 1 * factor
      return 0
    })
  }, [rows, getter, sort.dir])

  const toggle = (key) => {
    setSort((current) => (
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    ))
  }

  return { sorted, sort, toggle }
}

export function ariaSort(sort, key) {
  if (sort.key !== key) return 'none'
  return sort.dir === 'asc' ? 'ascending' : 'descending'
}
