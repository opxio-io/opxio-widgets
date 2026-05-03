// pages/admin/index.jsx — Opxio widget admin: password gate + client list
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const API = 'https://api.opxio.io/api/admin'

export default function AdminIndex() {
  const [pw,      setPw]      = useState('')
  const [authed,  setAuthed]  = useState(false)
  const [err,     setErr]     = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function login(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch(`${API}/clients?adminKey=${encodeURIComponent(pw)}`)
      if (r.ok) {
        const data = await r.json()
        setClients(data.filter(c => c.status === 'active'))
        setAuthed(true)
        setErr('')
      } else {
        setErr('Wrong password.')
      }
    } catch {
      setErr('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  if (!authed) return (
    <div style={S.page}>
      <Head><title>Opxio Admin</title></Head>
      <div style={S.gate}>
        <div style={S.logo}>Opxio<span style={{ color: '#C8FF00' }}>.</span></div>
        <div style={S.gateTitle}>Widget Admin</div>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            placeholder="Admin password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={S.input}
            autoFocus
          />
          {err && <div style={{ color: '#FF6B6B', fontSize: 12 }}>{err}</div>}
          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <Head><title>Opxio Admin</title></Head>
      <div style={S.topbar}>
        <span style={S.logo}>Opxio<span style={{ color: '#C8FF00' }}>.</span></span>
        <span style={{ color: '#444', fontSize: 12 }}>Widget Admin</span>
      </div>
      <div style={S.content}>
        <div style={S.sectionTitle}>Active Clients — {clients.length}</div>
        <div style={S.grid}>
          {clients.map(c => (
            <button
              key={c.slug}
              style={S.clientCard}
              onClick={() => router.push(`/admin/${c.slug}?adminKey=${encodeURIComponent(pw)}`)}
            >
              <div style={S.clientName}>{c.client_name}</div>
              <div style={S.clientSlug}>{c.slug}</div>
              <div style={S.clientPill}>Configure widgets →</div>
            </button>
          ))}
          {clients.length === 0 && (
            <div style={{ color: '#444', fontSize: 12 }}>No active clients found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}

const S = {
  page:        { background: '#111', minHeight: '100vh', fontFamily: "'Satoshi', -apple-system, sans-serif", color: '#fff' },
  gate:        { maxWidth: 320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, padding: '20vh 20px 0' },
  logo:        { fontSize: 22, fontWeight: 900, letterSpacing: '-.03em' },
  gateTitle:   { fontSize: 14, color: '#555', marginTop: -12 },
  input:       { background: '#1A1A1A', border: '1px solid #252525', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:         { background: '#C8FF00', color: '#000', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  topbar:      { padding: '16px 24px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', gap: 12 },
  content:     { padding: 24, maxWidth: 1000, margin: '0 auto' },
  sectionTitle:{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#555', marginBottom: 14 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  clientCard:  { background: '#1A1A1A', border: '1px solid #1E1E1E', borderRadius: 10, padding: 18, textAlign: 'left', cursor: 'pointer', color: '#fff', display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color .15s' },
  clientName:  { fontSize: 15, fontWeight: 700 },
  clientSlug:  { fontSize: 11, color: '#444', fontFamily: 'monospace' },
  clientPill:  { marginTop: 6, fontSize: 11, color: '#C8FF00', fontWeight: 600 },
}
