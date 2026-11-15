import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { IconCheck, IconChevronDown, IconSearch } from './Icons.jsx'

/**
 * Combobox kustom pengganti <select> bawaan browser.
 *
 * Native select tidak dapat digayakan dan, pada daftar panjang (mis. 100 buku),
 * memunculkan panel OS yang menutupi tabel di belakangnya. Komponen ini
 * menyediakan pencarian di dalam daftar, navigasi keyboard, dan tampilan yang
 * konsisten dengan sistem desain.
 *
 * options: [{ value, label, hint?, meta? }]
 */
export default function Select({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih…',
  searchable = false,
  disabled = false,
  emptyText = 'Tidak ada pilihan',
  ariaLabel,
  searchPlaceholder = 'Cari…',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const rootRef = useRef(null)
  const listRef = useRef(null)
  const searchRef = useRef(null)
  const generatedId = useId()
  const listboxId = `${id || generatedId}-listbox`

  const selected = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => `${option.label} ${option.hint || ''} ${option.meta || ''}`
      .toLowerCase()
      .includes(needle))
  }, [options, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  // Tutup saat klik di luar komponen.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) close()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, close])

  // Fokuskan kolom pencarian saat daftar dibuka.
  useEffect(() => {
    if (open && searchable) {
      const timer = setTimeout(() => searchRef.current?.focus(), 20)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [open, searchable])

  // Posisikan sorotan pada opsi yang sedang terpilih.
  useEffect(() => {
    if (!open) return
    const index = filtered.findIndex((option) => option.value === value)
    setActiveIndex(index >= 0 ? index : 0)
  }, [open, filtered, value])

  // Jaga opsi aktif tetap terlihat saat digerakkan dengan keyboard.
  useEffect(() => {
    if (!open || !listRef.current) return
    const node = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const commit = (option) => {
    if (!option) return
    onChange(option.value)
    close()
  }

  const onKeyDown = (event) => {
    if (disabled) return

    if (!open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        close()
        break
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(filtered.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        commit(filtered[activeIndex])
        break
      default:
        break
    }
  }

  const activeOption = filtered[activeIndex]

  return (
    <div className={`select${open ? ' select--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`select__trigger${selected ? '' : ' select__trigger--empty'}`}
        onClick={() => (disabled ? undefined : setOpen((current) => !current))}
        onKeyDown={onKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={open && activeOption ? `${listboxId}-${activeIndex}` : undefined}
      >
        <span className="select__value">{selected ? selected.label : placeholder}</span>
        <IconChevronDown className="select__chevron" />
      </button>

      {open ? (
        <div className="select__popover">
          {searchable ? (
            <div className="select__search">
              <IconSearch className="select__search-icon" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listboxId}
              />
            </div>
          ) : null}

          <ul className="select__list" role="listbox" id={listboxId} ref={listRef}>
            {filtered.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex
              return (
                <li key={option.value} role="none">
                  <button
                    type="button"
                    id={`${listboxId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    className={`select__option${isActive ? ' select__option--active' : ''}${isSelected ? ' select__option--selected' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(option)}
                  >
                    <span className="select__option-main">
                      <span className="select__option-label">{option.label}</span>
                      {option.hint ? <span className="select__option-hint">{option.hint}</span> : null}
                    </span>
                    {option.meta ? <span className="select__option-meta">{option.meta}</span> : null}
                    {isSelected ? <IconCheck className="select__check" /> : null}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 ? (
              <li className="select__empty">{emptyText}</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
