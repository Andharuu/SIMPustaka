import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Skeleton, { SkeletonRows } from '../components/Skeleton.jsx'
import { dashboardApi, loanApi, memberApi } from '../lib/api.js'
import { formatDate, formatRupiah, todayISO } from '../lib/format.js'
import { useCountUp } from '../lib/hooks.js'

/** Kartu statistik dengan angka yang dianimasikan dari nilai sebelumnya. */
function StatCard({ label, value, hint, money = false }) {
  const animated = useCountUp(value ?? 0)
  const ready = Number.isFinite(Number(value))

  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      {ready ? (
        <div className={`stat__value${money ? ' stat__value--money' : ''}`}>
          {money ? formatRupiah(Math.round(animated)) : Math.round(animated)}
        </div>
      ) : (
        <Skeleton width="62%" height={22} style={{ marginTop: 8 }} />
      )}
      <div className="stat__hint">{hint}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [rules, setRules] = useState([])
  const [activeLoans, setActiveLoans] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, rulesData, loansData] = await Promise.all([
        dashboardApi.stats(),
        memberApi.rules(),
        loanApi.list(true),
      ])
      setStats(statsData)
      setRules(rulesData)
      setActiveLoans(loansData)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader
        title="Dasbor Petugas Perpustakaan"
        description="Ringkasan koleksi buku, keanggotaan, dan sirkulasi peminjaman SIMPustaka."
        actions={(
          <button type="button" className="btn btn--ghost btn--sm" onClick={load} disabled={loading}>
            {loading ? 'Memuat...' : 'Muat Ulang'}
          </button>
        )}
      />

      <Alert type="error">{error}</Alert>

      <div className="grid-stats">
        <StatCard
          label="Judul Buku"
          value={stats?.totalBooks}
          hint={stats ? `${stats.availableBooks} judul tersedia` : ' '}
        />
        <StatCard
          label="Total Stok"
          value={stats?.totalStock}
          hint="Eksemplar di rak"
        />
        <StatCard
          label="Anggota"
          value={stats?.totalMembers}
          hint="Mahasiswa dan Dosen"
        />
        <StatCard
          label="Peminjaman Aktif"
          value={stats?.activeLoans}
          hint={stats ? `${stats.totalLoans} transaksi tercatat` : ' '}
        />
        <StatCard
          label="Total Denda Tercatat"
          value={stats?.totalFine}
          hint="Akumulasi seluruh pengembalian"
          money
        />
      </div>

      <section className="rules">
        {rules.length === 0
          ? [0, 1].map((index) => (
            <div className="rule-card" key={`rule-skeleton-${index}`}>
              <Skeleton width="45%" height={10} />
              <div style={{ marginTop: 14, display: 'grid', gap: 9 }}>
                <Skeleton width="90%" height={10} />
                <Skeleton width="75%" height={10} />
                <Skeleton width="82%" height={10} />
              </div>
            </div>
          ))
          : rules.map((rule) => (
            <div className="rule-card" key={rule.type}>
              <h3>Ketentuan Kategori {rule.label}</h3>
              <dl>
                <dt>Kuota maksimal</dt>
                <dd>{rule.loanQuota} buku</dd>
                <dt>Batas waktu pinjam</dt>
                <dd>{rule.loanPeriodDays} hari</dd>
                <dt>Denda keterlambatan</dt>
                <dd>{formatRupiah(rule.fineRatePerDay)} / hari</dd>
              </dl>
            </div>
          ))}
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Peminjaman Aktif Terbaru</h2>
          <Link to="/pengembalian" className="btn btn--ghost btn--sm">Ke Pengembalian</Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Anggota</th>
                <th>Buku</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && activeLoans.length === 0 ? (
                <SkeletonRows columns={5} rows={3} />
              ) : (
                activeLoans.slice(0, 6).map((loan) => (
                  <tr key={loan.id}>
                    <td className="mono">{loan.id}</td>
                    <td>
                      {loan.memberName}
                      <div className="muted" style={{ fontSize: '11.5px' }}>{loan.memberCategory}</div>
                    </td>
                    <td>{loan.bookTitle}</td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td>
                      <StatusBadge
                        status={loan.status}
                        late={loan.active && loan.dueDate < todayISO()}
                      />
                    </td>
                  </tr>
                ))
              )}
              {!loading && activeLoans.length === 0 ? (
                <tr><td colSpan="5" className="empty">Belum ada peminjaman aktif.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
