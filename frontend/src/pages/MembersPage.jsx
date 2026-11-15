import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Alert from '../components/Alert.jsx'
import Select from '../components/Select.jsx'
import SortHeader from '../components/SortHeader.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { memberApi } from '../lib/api.js'
import { formatRupiah, MEMBER_TYPE_IDENTITY_LABEL, MEMBER_TYPE_LABEL } from '../lib/format.js'
import { useSortable } from '../lib/sort.js'

const EMPTY_FORM = { id: '', type: 'STUDENT', name: '', identityNumber: '' }

const COLUMNS = [
  { key: 'id', get: (member) => member.id, type: 'text' },
  { key: 'name', get: (member) => member.name, type: 'text' },
  { key: 'type', get: (member) => member.categoryLabel, type: 'text' },
  { key: 'identity', get: (member) => member.identityNumber, type: 'text' },
  { key: 'active', get: (member) => member.activeLoanCount, type: 'number' },
  { key: 'quota', get: (member) => member.loanQuota, type: 'number' },
  { key: 'period', get: (member) => member.loanPeriodDays, type: 'number' },
  { key: 'fine', get: (member) => member.fineRatePerDay, type: 'number' },
]

const TYPE_OPTIONS = [
  { value: 'STUDENT', label: 'Mahasiswa', hint: 'Kuota 3 buku · 7 hari · Rp1.000/hari' },
  { value: 'LECTURER', label: 'Dosen', hint: 'Kuota 5 buku · 14 hari · Rp2.000/hari' },
]

export default function MembersPage() {
  const [searchParams] = useSearchParams()
  const [members, setMembers] = useState([])
  const [rules, setRules] = useState([])
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const loadMembers = useCallback(async (search = '') => {
    setLoading(true)
    try {
      const data = await memberApi.list(search)
      setMembers(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fromUrl = searchParams.get('q') || ''
    setKeyword(fromUrl)
    loadMembers(fromUrl)
  }, [searchParams, loadMembers])

  useEffect(() => {
    memberApi.rules().then(setRules).catch((e) => setError(e.message))
  }, [])

  const { sorted, sort, toggle } = useSortable(members, COLUMNS, 'id', 'asc')

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const payload = {
      id: form.id.trim(),
      type: form.type,
      name: form.name.trim(),
      identityNumber: form.identityNumber.trim(),
    }
    try {
      if (editing) {
        await memberApi.update(editing, payload)
        setNotice(`Data anggota "${payload.name}" berhasil diperbarui.`)
      } else {
        await memberApi.create(payload)
        setNotice(`Anggota "${payload.name}" berhasil ditambahkan.`)
      }
      resetForm()
      await loadMembers(keyword)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleEdit = (member) => {
    setEditing(member.id)
    setForm({
      id: member.id,
      type: member.type,
      name: member.name,
      identityNumber: member.identityNumber,
    })
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (member) => {
    if (!window.confirm(`Hapus anggota "${member.name}" (${member.id})?`)) return
    setError('')
    setNotice('')
    try {
      await memberApi.remove(member.id)
      setNotice(`Anggota "${member.name}" berhasil dihapus.`)
      if (editing === member.id) resetForm()
      await loadMembers(keyword)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadMembers(keyword.trim())
  }

  const summary = useMemo(() => ({
    total: sorted.length,
    mahasiswa: sorted.filter((member) => member.type === 'STUDENT').length,
    dosen: sorted.filter((member) => member.type === 'LECTURER').length,
  }), [sorted])

  return (
    <>
      <PageHeader
        title="Pengelolaan Data Anggota"
        description="Menambahkan, menampilkan, mengubah, dan menghapus data anggota dengan kategori Mahasiswa atau Dosen."
      />

      <Alert type="error">{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <section className="rules">
        {rules.map((rule) => (
          <div className="rule-card" key={rule.type}>
            <h3>Kategori {rule.label}</h3>
            <dl>
              <dt>Kuota pinjam</dt>
              <dd>Maksimal {rule.loanQuota} buku</dd>
              <dt>Durasi pinjam</dt>
              <dd>{rule.loanPeriodDays} hari</dd>
              <dt>Denda keterlambatan</dt>
              <dd>{formatRupiah(rule.fineRatePerDay)} / hari</dd>
            </dl>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">{editing ? `Ubah Anggota: ${editing}` : 'Tambah Anggota Baru'}</h2>
          {editing ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={resetForm}>
              Batal Ubah
            </button>
          ) : null}
        </div>
        <div className="card__body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="member-id">ID Anggota</label>
                <input
                  id="member-id"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  placeholder="A-001"
                  disabled={Boolean(editing)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="member-type">Kategori Anggota</label>
                <Select
                  id="member-type"
                  value={form.type}
                  onChange={(value) => setForm((current) => ({ ...current, type: value }))}
                  options={TYPE_OPTIONS}
                  ariaLabel="Kategori anggota"
                />
                <span className="field__hint">
                  Kategori menentukan kuota, durasi pinjam, dan tarif denda anggota.
                </span>
              </div>
              <div className="field">
                <label htmlFor="member-name">Nama Lengkap</label>
                <input
                  id="member-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Putri Norma Yunita"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="member-identity">
                  {MEMBER_TYPE_IDENTITY_LABEL[form.type]} (Nomor Identitas)
                </label>
                <input
                  id="member-identity"
                  name="identityNumber"
                  value={form.identityNumber}
                  onChange={handleChange}
                  placeholder={form.type === 'STUDENT' ? '3125521010' : '198701012020121001'}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary">
                {editing ? 'Simpan Perubahan' : 'Tambah Anggota'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="card__header card__header--stack">
          <div className="card__heading">
            <h2 className="card__title">Daftar Anggota Perpustakaan</h2>
            <span className="card__meta">
              {summary.total} anggota · {summary.mahasiswa} mahasiswa · {summary.dosen} dosen
            </span>
          </div>
          <form className="toolbar" onSubmit={handleSearch}>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari ID, nama, atau NIM/NIP…"
              aria-label="Pencarian anggota"
            />
            <button type="submit" className="btn btn--ghost btn--sm">Cari</button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => { setKeyword(''); loadMembers('') }}
            >
              Reset
            </button>
          </form>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortHeader label="ID" sortKey="id" sort={sort} onToggle={toggle} />
                <SortHeader label="Nama" sortKey="name" sort={sort} onToggle={toggle} />
                <SortHeader label="Kategori" sortKey="type" sort={sort} onToggle={toggle} />
                <SortHeader label="NIM / NIP" sortKey="identity" sort={sort} onToggle={toggle} />
                <SortHeader label="Dipinjam" sortKey="active" sort={sort} onToggle={toggle} />
                <SortHeader label="Kuota" sortKey="quota" sort={sort} onToggle={toggle} />
                <SortHeader label="Durasi" sortKey="period" sort={sort} onToggle={toggle} />
                <SortHeader label="Denda / Hari" sortKey="fine" sort={sort} onToggle={toggle} />
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((member) => (
                <tr key={member.id}>
                  <td className="mono">{member.id}</td>
                  <td>{member.name}</td>
                  <td><span className="badge badge--info">{member.categoryLabel}</span></td>
                  <td className="mono">{member.identityNumber}</td>
                  <td>{member.activeLoanCount} / {member.loanQuota}</td>
                  <td>{member.remainingQuota} sisa</td>
                  <td>{member.loanPeriodDays} hari</td>
                  <td>{formatRupiah(member.fineRatePerDay)}</td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleEdit(member)}>Ubah</button>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDelete(member)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && members.length === 0 ? <SkeletonRows columns={9} rows={4} /> : null}
              {members.length === 0 && !loading ? (
                <tr><td colSpan="9" className="empty">Belum ada data anggota yang cocok.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
