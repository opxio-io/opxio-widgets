import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import s from '@/styles/nadia-life-hq.module.css'

const HUBS = [
  { label: 'Degree planner', eyebrow: 'University', href: 'https://app.notion.com/p/3210b68305f980628d3ffb49bec7e754', accent: 'purple' },
  { label: 'Fall 2026', eyebrow: 'Current term', href: 'https://app.notion.com/p/3210b68305f980838a7aef8b5978a34c', accent: 'amber' },
  { label: 'Courses', eyebrow: 'Academic library', href: 'https://app.notion.com/p/3210b68305f981c5b636c8482ab2719f', accent: 'blue' },
  { label: 'Plants', eyebrow: 'Home care', href: 'https://app.notion.com/p/99d22665d3d54ec886714d1b24daed53', accent: 'green' },
]

function Arrow() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4h9v9M16 4 5 15" /></svg>
}

function Moon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.3 12.2A6.6 6.6 0 0 1 7.8 3.7 6.7 6.7 0 1 0 16.3 12.2Z" /></svg>
}

function Sun() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.2"/><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16"/></svg>
}

export default function NadiaLifeHQ() {
  const [theme, setTheme] = useState('dark')
  const [now, setNow] = useState(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('nadia-life-hq-theme')
    if (saved === 'light') setTheme('light')
    setNow(new Date())
  }, [])

  const date = useMemo(() => {
    if (!now) return ''
    return new Intl.DateTimeFormat('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }).format(now)
  }, [now])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    window.localStorage.setItem('nadia-life-hq-theme', next)
  }

  return (
    <>
      <Head><title>Nadia Life HQ</title><meta name="robots" content="noindex" /></Head>
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      <main className={`${s.shell} ${theme === 'light' ? s.light : ''}`}>
        <header className={s.header}>
          <div>
            <div className={s.eyebrow}>Personal operating system</div>
            <h1>Nadia Life HQ</h1>
            <p>A calm home for the things worth keeping visible.</p>
          </div>
          <div className={s.headerRight}>
            <span className={s.date}>{date}</span>
            <button className={s.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? <Sun /> : <Moon />}</button>
          </div>
        </header>

        <section className={s.heroGrid}>
          <div className={`${s.card} ${s.hero}`}>
            <span className={s.cardEyebrow}>Right now</span>
            <div className={s.heroTitle}>Fall 2026</div>
            <p>Keep university in its existing system. Life HQ is the quiet layer above it.</p>
            <a className={s.textLink} href={HUBS[1].href} target="_blank" rel="noreferrer">Open semester <Arrow /></a>
          </div>
          <div className={s.card}>
            <span className={s.cardEyebrow}>Academic</span>
            <div className={s.bigValue}>4</div>
            <div className={s.valueLabel}>core academic hubs</div>
          </div>
          <div className={s.card}>
            <span className={s.cardEyebrow}>Plants</span>
            <div className={s.bigValue}>—</div>
            <div className={s.valueLabel}>ready for your first plant</div>
          </div>
        </section>

        <section className={s.card}>
          <div className={s.panelHeader}>
            <div><span className={s.cardEyebrow}>Navigation</span><h2>Core hubs</h2></div>
            <span className={s.quiet}>Open in Notion</span>
          </div>
          <div className={s.hubGrid}>
            {HUBS.map(hub => (
              <a key={hub.label} href={hub.href} target="_blank" rel="noreferrer" className={`${s.hub} ${s[hub.accent]}`}>
                <div><span>{hub.eyebrow}</span><strong>{hub.label}</strong></div><Arrow />
              </a>
            ))}
          </div>
        </section>

        <section className={s.twoCol}>
          <div className={s.card}>
            <div className={s.panelHeader}><div><span className={s.cardEyebrow}>Life areas</span><h2>Keep it light</h2></div></div>
            <div className={s.rows}>
              <div className={s.row}><span className={`${s.dot} ${s.purpleDot}`} /><div><strong>University</strong><small>Degree planning stays where it already works.</small></div></div>
              <div className={s.row}><span className={`${s.dot} ${s.greenDot}`} /><div><strong>Plant care</strong><small>Watering, health and home care without turning life into tasks.</small></div></div>
              <div className={s.row}><span className={`${s.dot} ${s.neutralDot}`} /><div><strong>Personal systems</strong><small>Space for routines, goals, admin and resources as they grow.</small></div></div>
            </div>
          </div>
          <div className={`${s.card} ${s.note}`}>
            <span className={s.cardEyebrow}>Principle</span>
            <blockquote>Visible, useful, calm — without duplicating the systems you already trust.</blockquote>
            <span className={s.signature}>Nadia Life HQ</span>
          </div>
        </section>
      </main>
    </>
  )
}
