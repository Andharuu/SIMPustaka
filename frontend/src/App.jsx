import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import BooksPage from './pages/BooksPage.jsx'
import MembersPage from './pages/MembersPage.jsx'
import LoansPage from './pages/LoansPage.jsx'
import ReturnsPage from './pages/ReturnsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import SearchCommand from './components/SearchCommand.jsx'
import {
  IconArrowIn,
  IconArrowOut,
  IconBook,
  IconDashboard,
  IconHistory,
  IconSearch,
  IconUsers,
} from './components/Icons.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dasbor', Icon: IconDashboard, end: true },
  { to: '/buku', label: 'Data Buku', Icon: IconBook },
  { to: '/anggota', label: 'Data Anggota', Icon: IconUsers },
  { to: '/pencarian', label: 'Pencarian Data', Icon: IconSearch },
  { to: '/peminjaman', label: 'Peminjaman', Icon: IconArrowOut },
  { to: '/pengembalian', label: 'Pengembalian', Icon: IconArrowIn },
  { to: '/riwayat', label: 'Riwayat Transaksi', Icon: IconHistory },
]

export default function App() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">S</span>
          <span className="brand__text">
            <span className="brand__name">SIMPustaka</span>
            <span className="brand__sub">Library Management</span>
          </span>
        </div>

        <nav className="nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}
            >
              <item.Icon className="nav__icon" />
              <span className="nav__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__role">Petugas Perpustakaan</span>
          <span className="sidebar__meta">Admin / Operator</span>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <SearchCommand />
          <div className="topbar__user">
            <span className="topbar__avatar" aria-hidden="true">PP</span>
            <span className="topbar__usertext">
              <span className="topbar__username">Petugas Perpustakaan</span>
              <span className="topbar__userrole">Admin / Operator</span>
            </span>
          </div>
        </header>

        <main className="main">
          {/* Key berubah tiap route agar setiap halaman animasi masuk ulang. */}
          <div className="page" key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/buku" element={<BooksPage />} />
              <Route path="/anggota" element={<MembersPage />} />
              <Route path="/pencarian" element={<SearchPage />} />
              <Route path="/peminjaman" element={<LoansPage />} />
              <Route path="/pengembalian" element={<ReturnsPage />} />
              <Route path="/riwayat" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
