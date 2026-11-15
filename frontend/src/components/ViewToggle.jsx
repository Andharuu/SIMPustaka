import { IconGrid, IconList } from './Icons.jsx'

/** Tombol beralih antara tampilan tabel dan galeri. */
export default function ViewToggle({ value, onChange }) {
  return (
    <div className="viewtoggle" role="group" aria-label="Pilih tampilan data">
      <button
        type="button"
        className={`viewtoggle__btn${value === 'table' ? ' viewtoggle__btn--active' : ''}`}
        onClick={() => onChange('table')}
        aria-pressed={value === 'table'}
        title="Tampilan tabel"
      >
        <IconList />
        <span>Tabel</span>
      </button>
      <button
        type="button"
        className={`viewtoggle__btn${value === 'gallery' ? ' viewtoggle__btn--active' : ''}`}
        onClick={() => onChange('gallery')}
        aria-pressed={value === 'gallery'}
        title="Tampilan galeri"
      >
        <IconGrid />
        <span>Galeri</span>
      </button>
    </div>
  )
}
