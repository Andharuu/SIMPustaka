/** Placeholder shimmer untuk keadaan memuat. */
export default function Skeleton({ width = '100%', height = 10, radius, style }) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

/** Baris tabel placeholder dengan jumlah kolom tertentu. */
export function SkeletonRows({ columns, rows = 4 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={`skeleton-${rowIndex}`}>
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <td key={`cell-${columnIndex}`}>
          <Skeleton
            width={columnIndex === 0 ? '60%' : '85%'}
            height={11}
          />
        </td>
      ))}
    </tr>
  ))
}
