// components/widgets/WidgetShell.jsx
// Wrapper: iframe guard, theme, font, header slot, loading/error states
import { useState, useEffect } from 'react'
import s from '@/styles/widget.module.css'

export default function WidgetShell({ children, theme, onThemeToggle, loading, error }) {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    // Block direct browser access — must be in Notion iframe
    if (typeof window !== 'undefined' && window.self === window.top) {
      setBlocked(true)
    }
  }, [])

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
