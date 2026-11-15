const STATUS_LABEL = {
  BORROWED: 'Dipinjam',
  RETURNED: 'Dikembalikan',
}

export default function StatusBadge({ status, late }) {
  if (late) {
    return <span className="badge badge--danger">Terlambat</span>
  }
  if (status === 'BORROWED') {
    return <span className="badge badge--info">{STATUS_LABEL.BORROWED}</span>
  }
  if (status === 'RETURNED') {
    return <span className="badge badge--success">{STATUS_LABEL.RETURNED}</span>
  }
  return <span className="badge badge--neutral">{status || '-'}</span>
}
