// components/widgets/WidgetShell.jsx
import { useState, useEffect } from 'react'
import s from '@/styles/widget.module.css'

export default function WidgetShell({ children, theme, loading, error, bypass = false }) {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!bypass && typeof window !== 'undefined' && window.self === window.top) {
      setBlocked(true)
    }
  }, [bypass])

  if (blocked) return (
    <div className={`${s.shell} ${s.blocked}`} style={{ background: '#191919' }}>
      <div className={s.blockedTitle}>RESTRICTED ACCESS</div>
      <div className={s.blockedSub}>This widget is for Notion only.</div>
    </div>
  )

  return (
    <>
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      <div className={`${s.shell}${theme === 'light' ? ` ${s.light}` : ''}`}>
        {loading && !children && <div className={s.loading}>Loading…</div>}
        {error && <div className={s.loading}><span className={s.errMsg}>{error}</span></div>}
        {!loading && !error && children}
      </div>
    </>
  )
}
