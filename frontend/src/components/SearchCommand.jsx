import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookApi, memberApi } from '../lib/api.js'
import { IconBook, IconSearch, IconUsers, IconX } from './Icons.jsx'

/**
 * Kotak pencarian global pada topbar.
 *
 * Mencari buku dan anggota sekaligus (FR-03) lalu mengarahkan ke halaman
 * terkait dengan kata kunci yang sama, sehingga petugas tidak perlu berpindah
 * ke halaman pencarian tersendiri.
 */
export default function SearchCommand() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ books: [], members: [] })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const trimmed = query.trim()

  // Pencarian dengan penundaan agar tidak membanjiri API tiap ketukan tombol.
  useEffect(() => {
    if (trimmed.length === 0) {
      setResults({ books: [], members: [] })
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const [books, members] = await Promise.all([
          bookApi.list(trimmed),
          memberApi.list(trimmed),
        ])
        if (!cancelled) {
          setResults({ books: books.slice(0, 5), members: members.slice(0, 5) })
          setActiveIndex(0)
        }
      } catch {
        if (!cancelled) setResults({ books: [], members: [] })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed])

  // Pintasan papan ketik: Ctrl/Cmd + K memfokuskan pencarian.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const flat = useMemo(() => ([
    ...results.books.map((book) => ({ kind: 'book', id: book.id, item: book })),
    ...results.members.map((member) => ({ kind: 'member', id: member.id, item: member })),
  ]), [results])

  const go = useCallback((entry) => {
    if (!entry) return
    const path = entry.kind === 'book' ? '/buku' : '/anggota'
    navigate(`${path}?q=${encodeURIComponent(entry.id)}`)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }, [navigate])

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (flat.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, flat.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(flat[activeIndex])
    }
  }

  const showPanel = open && trimmed.length > 0
  const total = results.books.length + results.members.length

  return (
    <div className="searchbox" ref={rootRef}>
      <div className={`searchbox__field${open ? ' searchbox__field--focus' : ''}`}>
        <IconSearch className="searchbox__icon" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari buku, anggota, atau ID…"
          aria-label="Pencarian global"
          aria-expanded={showPanel}
          role="combobox"
          aria-controls="global-search-results"
        />
        {query ? (
          <button
            type="button"
            className="searchbox__clear"
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            aria-label="Bersihkan pencarian"
          >
            <IconX />
          </button>
        ) : (
          <kbd className="searchbox__kbd">Ctrl K</kbd>
        )}
      </div>

      {showPanel ? (
        <div className="searchpanel" id="global-search-results" role="listbox">
          {loading ? (
            <div className="searchpanel__state">Mencari…</div>
          ) : total === 0 ? (
            <div className="searchpanel__state">Tidak ada hasil untuk “{trimmed}”.</div>
          ) : (
            <>
              {results.books.length > 0 ? (
                <div className="searchpanel__group">
                  <div className="searchpanel__label">Buku</div>
                  {results.books.map((book) => {
                    const index = flat.findIndex((entry) => entry.kind === 'book' && entry.id === book.id)
                    return (
                      <button
                        type="button"
                        key={book.id}
                        className={`searchpanel__item${index === activeIndex ? ' searchpanel__item--active' : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go({ kind: 'book', id: book.id })}
                      >
                        <IconBook className="searchpanel__item-icon" />
                        <span className="searchpanel__item-main">
                          <span className="searchpanel__item-title">{book.title}</span>
                          <span className="searchpanel__item-sub">{book.author} · {book.category}</span>
                        </span>
                        <span className={`badge ${book.available ? 'badge--success' : 'badge--danger'}`}>
                          {book.available ? `Stok ${book.stock}` : 'Habis'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}

              {results.members.length > 0 ? (
                <div className="searchpanel__group">
                  <div className="searchpanel__label">Anggota</div>
                  {results.members.map((member) => {
                    const index = flat.findIndex((entry) => entry.kind === 'member' && entry.id === member.id)
                    return (
                      <button
                        type="button"
                        key={member.id}
                        className={`searchpanel__item${index === activeIndex ? ' searchpanel__item--active' : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go({ kind: 'member', id: member.id })}
                      >
                        <IconUsers className="searchpanel__item-icon" />
                        <span className="searchpanel__item-main">
                          <span className="searchpanel__item-title">{member.name}</span>
                          <span className="searchpanel__item-sub">{member.identityNumber}</span>
                        </span>
                        <span className="badge badge--info">{member.categoryLabel}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
