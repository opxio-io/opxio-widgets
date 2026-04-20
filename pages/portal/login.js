import { useState } from 'react'
import Head from 'next/head'

export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
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
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{min-height:100%;background:#0D0D0D;color:#fff;font-family:'Satoshi',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00;--gm:rgba(170,255,0,.08);--gb:rgba(170,255,0,.2)}
        .wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
        .brand{display:flex;align-items:center;gap:8px;margin-bottom:48px}
        .brand-dot{width:8px;height:8px;border-radius:50%;background:var(--g)}
        .brand-name{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.35)}
        .card{width:100%;max-width:380px;background:#111;border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:32px 28px}
        .title{font-size:22px;font-weight:900;letter-spacing:-.03em;margin-bottom:6px}
        .sub{font-size:12px;font-weight:500;color:rgba(255,255,255,.3);margin-bottom:28px;line-height:1.6}
        label{display:block;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.25);margin-bottom:7px}
        input{width:100%;background:#1A1A1A;border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:11px 14px;font-size:13px;font-weight:500;color:#fff;outline:none;font-family:'Satoshi',sans-serif;transition:border-color .2s}
        input:focus{border-color:rgba(170,255,0,.4)}
        input::placeholder{color:rgba(255,255,255,.2)}
        .btn{width:100%;margin-top:14px;background:var(--g);color:#000;font-family:'Satoshi',sans-serif;font-size:12px;font-weight:900;padding:12px;border:none;border-radius:9px;cursor:pointer;transition:opacity .2s;letter-spacing:.01em}
        .btn:hover{opacity:.88}
        .btn:disabled{opacity:.4;cursor:not-allowed}
        .success{text-align:center;padding:8px 0}
        .success-icon{width:40px;height:40px;border-radius:50%;background:var(--gm);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:var(--g);font-size:15px;font-weight:900}
        .success-title{font-size:18px;font-weight:900;letter-spacing:-.02em;margin-bottom:8px}
        .success-msg{font-size:12px;font-weight:500;color:rgba(255,255,255,.3);line-height:1.6}
        .err{font-size:11px;font-weight:600;color:rgba(255,100,100,.7);margin-top:9px}
      `}</style>
      <div className="wrap">
        <div className="brand">
          <div className="brand-dot"/>
          <span className="brand-name">Opxio Client Portal</span>
        </div>
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
                <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
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
