// components/widgets/crm-pipeline/useCRMData.js
import { useState, useEffect, useRef, useCallback } from 'react'

const CURRENT_TTL = 6 * 60 * 1000   // 6 min — current month changes
const PAST_TTL    = 30 * 60 * 1000  // 30 min — past months change slowly

// Module-level cache — persists across re-renders and month navigation
const _cache = new Map()

function cacheKey(endpoint, filterMonth) {
  if (!filterMonth) return `${endpoint}::current`
  return `${endpoint}::${filterMonth.year}-${filterMonth.month}`
}

function isCurrentMonth(fm) { return !fm }

export function useCRMData({ token, apiEndpoint, filterMonth, refreshSignal = 0 }) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const abortRef = useRef(null)

  const fetch_ = useCallback(async (force = false) => {
    if (!apiEndpoint || !token) return

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const ck  = cacheKey(apiEndpoint, filterMonth)
    const hit = _cache.get(ck)
    const ttl = isCurrentMonth(filterMonth) ? CURRENT_TTL : PAST_TTL

    // Cache hit — render immediately
    if (!force && hit && (Date.now() - hit.ts) < ttl) {
      setState({ data: hit.data, loading: false, error: null })
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))

    try {
      const params = new URLSearchParams({ token })
      if (filterMonth) {
        params.set('month', filterMonth.month)
        params.set('year',  filterMonth.year)
      }
      const res = await fetch(`${apiEndpoint}?${params}`, {
        signal: ctrl.signal,
        // 25s timeout
        ...(() => {
          const t = setTimeout(() => ctrl.abort(), 25000)
          ctrl.signal.addEventListener('abort', () => clearTimeout(t))
          return {}
        })(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      _cache.set(ck, { data, ts: Date.now() })
      if (!ctrl.signal.aborted) setState({ data, loading: false, error: null })
    } catch (e) {
      if (e.name === 'AbortError') return
      setState(s => ({ ...s, loading: false, error: e.message }))
    }
  }, [apiEndpoint, token, filterMonth?.year, filterMonth?.month])

  // Re-fetch when month changes or refreshSignal fires
  useEffect(() => {
    const force = refreshSignal > 0
    if (force) _cache.delete(cacheKey(apiEndpoint, null)) // only bust current month
    fetch_(force)
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [fetch_, refreshSignal])

  return state
}
