import { useEffect, useRef, useState } from 'react'

/**
 * Menganimasikan angka dari nilai sebelumnya ke nilai baru.
 *
 * Dipakai pada kartu statistik dasbor agar perubahan angka terasa mengalir
 * dan bukan melompat. Menghormati prefers-reduced-motion: bila pengguna
 * meminta pengurangan gerak, nilai akhir langsung ditampilkan.
 */
export function useCountUp(target, duration = 620) {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const goal = Number(target)
    if (!Number.isFinite(goal)) {
      setValue(0)
      fromRef.current = 0
      return undefined
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setValue(goal)
      fromRef.current = goal
      return undefined
    }

    const from = fromRef.current
    const delta = goal - from
    if (delta === 0) {
      setValue(goal)
      return undefined
    }

    let frame = 0
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      // easeOutQuint agar angka melambat di akhir, terasa natural.
      const eased = 1 - Math.pow(1 - progress, 5)
      setValue(from + delta * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = goal
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

/** Menunda flag true agar skeleton tidak berkedip pada respons cepat. */
export function useDeferredLoading(loading, delay = 140) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!loading) {
      setVisible(false)
      return undefined
    }
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [loading, delay])

  return visible
}
