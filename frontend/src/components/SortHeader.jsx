import { IconChevronDown } from './Icons.jsx'

/** Sel kepala tabel yang dapat diklik untuk mengurutkan data. */
export default function SortHeader({ label, sortKey, sort, onToggle, align = 'left' }) {
  const active = sort.key === sortKey
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th aria-sort={ariaSort} style={align === 'right' ? { textAlign: 'right' } : undefined}>
      <button
        type="button"
        className={`th-sort${active ? ' th-sort--active' : ''}`}
        onClick={() => onToggle(sortKey)}
        title={`Urutkan berdasarkan ${label.toLowerCase()}`}
      >
        <span>{label}</span>
        <IconChevronDown className="th-sort__icon" data-dir={active ? sort.dir : 'none'} />
      </button>
    </th>
  )
}
