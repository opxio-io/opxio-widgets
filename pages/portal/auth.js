import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function PortalAuth() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState('validating')

  useEffect(() => {
    if (!token) return
    fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.project_id) {
          router.replace(`/portal/${data.project_id}`)
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  return (
    <>
      <Head>
        <title>Opxio — Verifying access</title>
        <link href="https://api.fontshare.com/v2/css?f[]=syne@700,800&f[]=dm-sans@400,500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#0A0A0A;color:#fff;font-family:'DM Sans',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
        .logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.03em}
        .logo span{color:#AAFF00}
        .msg{font-size:14px;color:#555}
        .err-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;letter-spacing:-.02em;color:#fff;margin-top:24px}
        a{color:#AAFF00;text-decoration:none;font-size:13px}
      `}</style>
      <div className="logo">op<span>x</span>io</div>
      {status === 'validating' && <div className="msg">Verifying your access…</div>}
      {status === 'invalid' && (
        <>
          <div className="err-title">Link expired or invalid</div>
          <div className="msg">Request a new access link below.</div>
          <a href="/portal/login">Request new link →</a>
        </>
      )}
    </>
  )
}
