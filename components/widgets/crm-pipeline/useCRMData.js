// components/widgets/crm-pipeline/useCRMData.js
import { useState, useEffect, useRef, useCallback } from 'react'

const CURRENT_TTL = 6 * 60 * 1000
const PAST_TTL    = 30 * 60 * 1000
const _cache = new Map()

function cacheKey(endpoint, filterMonth) {
  return filterMonth ? `${endpoint}::${filterMonth.year}-${filterMonth.month}` : `${endpoint}::current`
}

export function useCRMData({ token, apiEndpoint, filterMonth, refreshSignal = 0, mockData = null }) {
  const [state, setState] = useState({ data: mockData || null, loading: !mockData, error: null })
  const abortRef = useRef(null)

  // If mock data provided — return it immediately, no fetch
  useEffect(() => {
    if (mockData) { setState({ data: mockData, loading: false, error: null }); return }
  }, [mockData])

  const fetch_ = useCallback(async (force = false) => {
    if (mockData) return  // skip fetch in mock mode
    if (!apiEndpoint || !token) return

    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const ck  = cacheKey(apiEndpoint, filterMonth)
    const hit = _cache.get(ck)
    const ttl = !filterMonth ? CURRENT_TTL : PAST_TTL

    if (!force && hit && (Date.now() - hit.ts) < ttl) {
      setState({ data: hit.data, loading: false, error: null })
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const params = new URLSearchParams({ token })
      if (filterMonth) { params.set('month', filterMonth.month); params.set('year', filterMonth.year) }
      const t = setTimeout(() => ctrl.abort(), 25000)
      ctrl.signal.addEventListener('abort', () => clearTimeout(t))
      const res = await fetch(`${apiEndpoint}?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      _cache.set(ck, { data, ts: Date.now() })
      if (!ctrl.signal.aborted) setState({ data, loading: false, error: null })
    } catch (e) {
      if (e.name === 'AbortError') return
      setState(s => ({ ...s, loading: false, error: e.message }))
    }
  }, [apiEndpoint, token, filterMonth?.year, filterMonth?.month, mockData])

  useEffect(() => {
    if (mockData) return
    const force = refreshSignal > 0
    if (force) _cache.delete(cacheKey(apiEndpoint, null))
    fetch_(force)
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [fetch_, refreshSignal])

  return state
}
