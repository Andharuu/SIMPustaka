/**
 * Klien API untuk backend Java SIMPustaka.
 *
 * Seluruh permintaan HTTP dipusatkan di sini agar komponen antarmuka tidak
 * berurusan langsung dengan detail request/response.
 */

const BASE_URL = '/api'

class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError(
      'Tidak dapat terhubung ke server SIMPustaka. Pastikan backend Java sudah berjalan.',
      0,
      'NETWORK_ERROR',
    )
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Permintaan gagal (HTTP ${response.status})`
    throw new ApiError(message, response.status, payload?.error || 'UNKNOWN')
  }

  return payload
}

const query = (params) => {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      search.set(key, value)
    }
  })
  const result = search.toString()
  return result ? `?${result}` : ''
}

export const bookApi = {
  list: (keyword) => request(`/books${query({ q: keyword })}`),
  create: (payload) => request('/books', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/books/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  remove: (id) => request(`/books/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const memberApi = {
  list: (keyword) => request(`/members${query({ q: keyword })}`),
  rules: () => request('/members/rules'),
  create: (payload) => request('/members', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/members/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  remove: (id) => request(`/members/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const loanApi = {
  list: (activeOnly) => request(`/loans${query({ active: activeOnly ? 'true' : undefined })}`),
  borrow: (payload) => request('/loans', { method: 'POST', body: JSON.stringify(payload) }),
  giveBack: (id, returnDate) => request(`/loans/${encodeURIComponent(id)}/return`, {
    method: 'POST',
    body: JSON.stringify({ returnDate: returnDate || null }),
  }),
}

export const dashboardApi = {
  stats: () => request('/dashboard/stats'),
}

export { ApiError }
