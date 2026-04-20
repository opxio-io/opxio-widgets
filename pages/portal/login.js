import { useState } from 'react'
import Head from 'next/head'

export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | sent | error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send link')
      setStatus('sent')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <>
      <Head>
        <title>Opxio — Client Portal</title>
        <link href="https://api.fontshare.com/v2/css?f[]=syne@700,800&f[]=dm-sans@400,500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{height:100%;background:#0A0A0A;color:#fff;font-family:'DM Sans',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00;--gb:rgba(170,255,0,.2);--gm:rgba(170,255,0,.08)}
        .wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
        .logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.03em;color:#fff;margin-bottom:48px}
        .logo span{color:var(--g)}
        .card{width:100%;max-width:400px;background:#111;border:1px solid #1E1E1E;border-radius:16px;padding:36px 32px}
        .title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.03em;margin-bottom:6px}
        .sub{font-size:14px;color:#555;margin-bottom:28px;line-height:1.5}
        label{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#444;margin-bottom:8px}
        input{width:100%;background:#161616;border:1px solid #222;border-radius:10px;padding:12px 16px;font-size:14px;color:#fff;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .15s}
        input:focus{border-color:var(--g)}
        input::placeholder{color:#333}
        .btn{width:100%;margin-top:16px;background:var(--g);color:#000;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;padding:13px;border:none;border-radius:10px;cursor:pointer;transition:opacity .15s}
        .btn:hover{opacity:.9}
        .btn:disabled{opacity:.4;cursor:not-allowed}
        .success{text-align:center;padding:8px 0}
        .success-icon{width:44px;height:44px;border-radius:50%;background:var(--gm);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:18px}
        .success-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;letter-spacing:-.02em;margin-bottom:8px}
        .success-msg{font-size:13px;color:#555;line-height:1.6}
        .err{font-size:12px;color:#FF6B6B;margin-top:10px}
      `}</style>
      <div className="wrap">
        <div className="logo">op<span>x</span>io</div>
        <div className="card">
          {status === 'sent' ? (
            <div className="success">
              <div className="success-icon">✓</div>
              <div className="success-title">Check your email</div>
              <div className="success-msg">We sent a secure access link to <strong style={{color:'#fff'}}>{email}</strong>. Valid for 7 days.</div>
            </div>
          ) : (
            <>
              <div className="title">Access your portal</div>
              <div className="sub">Enter your email to receive a secure login link.</div>
              <form onSubmit={handleSubmit}>
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  required
                />
                {error && <div className="err">{error}</div>}
                <button className="btn" type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending…' : 'Send access link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
