import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ── Status maps ──────────────────────────────────────────────────────────────
const PHASE_STATUS = {
  'Done':        { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.12)',  border: 'rgba(170,255,0,.25)' },
  'Complete':    { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.12)',  border: 'rgba(170,255,0,.25)' },
  'Completed':   { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.12)',  border: 'rgba(170,255,0,.25)' },
  'In Progress': { label: 'In Progress', color: '#fff',    dim: 'rgba(255,255,255,.08)', border: 'rgba(255,255,255,.15)' },
  'Not Started': { label: 'Upcoming',    color: 'rgba(255,255,255,.2)', dim: 'transparent', border: 'rgba(255,255,255,.06)' },
}

const INV_STATUS = {
  'Paid':             { label: 'Paid',             color: '#AAFF00', dim: 'rgba(170,255,0,.1)',  border: 'rgba(170,255,0,.2)' },
  'Deposit Received': { label: 'Paid',             color: '#AAFF00', dim: 'rgba(170,255,0,.1)',  border: 'rgba(170,255,0,.2)' },
  'Awaiting Payment': { label: 'Due',              color: '#FFB84D', dim: 'rgba(255,184,77,.1)', border: 'rgba(255,184,77,.2)' },
}

function fmtDate(s) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusPill({ status, map }) {
  const s = map[status] || { label: status, color: 'rgba(255,255,255,.3)', dim: 'transparent', border: 'rgba(255,255,255,.08)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 99,
      background: s.dim, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: 'nowrap', flexShrink: 0
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
      {s.label}
    </span>
  )
}

function Modal({ open, onClose, title, eyebrow, sub, children }) {
  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0
    }}>
      <div style={{
        background: '#111', borderTop: '1px solid rgba(255,255,255,.08)',
        borderRadius: '16px 16px 0 0', padding: '28px 24px 40px',
        width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.12)', margin: '0 auto 24px' }} />
        {eyebrow && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(170,255,0,.5)', marginBottom: 6 }}>{eyebrow}</div>}
        {title && <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.03em', marginBottom: sub ? 4 : 20 }}>{title}</div>}
        {sub && <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.3)', marginBottom: 22, lineHeight: 1.6 }}>{sub}</div>}
        {children}
      </div>
    </div>
  )
}

const inputSt = {
  width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 9, padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#fff',
  outline: 'none', fontFamily: "'Satoshi',sans-serif", transition: 'border-color .2s', marginTop: 6
}
const labelSt = { display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)' }
const btnPrimary = {
  width: '100%', marginTop: 16, background: '#AAFF00', color: '#000',
  border: 'none', borderRadius: 9, padding: 13, fontSize: 12, fontWeight: 900,
  cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.02em'
}
const btnGhost = {
  background: 'transparent', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.35)',
  borderRadius: 9, padding: '10px 16px', fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'Satoshi',sans-serif"
}

export default function PortalToken() {
  const router = useRouter()
  const { token: portalToken } = router.query

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState(null) // 'feedback' | 'expansion' | 'message'
  const [feedbackPhase, setFeedbackPhase] = useState(null)
  const [formStatus, setFormStatus] = useState('idle')
  const [successMsg, setSuccessMsg] = useState('')

  const [fbType, setFbType]       = useState('Revision Request')
  const [fbDesc, setFbDesc]       = useState('')
  const [fbLink, setFbLink]       = useState('')
  const [expDesc, setExpDesc]     = useState('')
  const [expArea, setExpArea]     = useState('Revenue')
  const [expUrg, setExpUrg]       = useState('When possible')
  const [msgSubj, setMsgSubj]     = useState('')
  const [msgBody, setMsgBody]     = useState('')

  useEffect(() => {
    if (!portalToken) return
    fetch(`/api/portal/data?token=${portalToken}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [portalToken])

  function openModal(type, phase) {
    setModal(type)
    setFeedbackPhase(phase || null)
    setFormStatus('idle')
    setSuccessMsg('')
    setFbType('Revision Request'); setFbDesc(''); setFbLink('')
    setExpDesc(''); setExpArea('Revenue'); setExpUrg('When possible')
    setMsgSubj(''); setMsgBody('')
  }
  function closeModal() { setModal(null) }

  async function post(endpoint, body) {
    setFormStatus('loading')
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) return true
    } catch {}
    setFormStatus('error')
    return false
  }

  async function submitFeedback() {
    if (!fbDesc) return
    const ok = await post('/api/portal/feedback', { portal_token: portalToken, phase_name: feedbackPhase?.name, type: fbType, description: fbDesc, attachment: fbLink })
    if (ok) { setFormStatus('success'); setSuccessMsg('Feedback submitted. We\'ll be in touch.') }
  }
  async function submitExpansion() {
    if (!expDesc) return
    const ok = await post('/api/portal/expansion', { portal_token: portalToken, description: expDesc, area: expArea, urgency: expUrg })
    if (ok) { setFormStatus('success'); setSuccessMsg('Request sent. Kai will follow up with a scope and quote.') }
  }
  async function submitMessage() {
    if (!msgSubj || !msgBody) return
    const ok = await post('/api/portal/message', { portal_token: portalToken, subject: msgSubj, message: msgBody })
    if (ok) { setFormStatus('success'); setSuccessMsg('Message sent. We respond within 1 business day.') }
  }

  if (loading || !data) return (
    <>
      <Head><link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" /></Head>
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Satoshi',sans-serif" }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#AAFF00', animation: 'p 1.4s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)' }}>Loading</span>
        </div>
        <style>{`@keyframes p{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
      </div>
    </>
  )

  const { project, phases, tasks, invoices, expansions, company } = data
  const done    = phases.filter(p => ['Done','Complete','Completed'].includes(p.status)).length
  const active  = phases.find(p => p.status === 'In Progress')
  const pct     = phases.length ? Math.round((done / phases.length) * 100) : 0
  const totalPaid = invoices.filter(i => ['Paid','Deposit Received'].includes(i.status)).reduce((s,i) => s + (i.amount||0), 0)
  const totalDue  = invoices.filter(i => i.status === 'Awaiting Payment').reduce((s,i) => s + (i.amount||0), 0)

  const SuccessView = () => (
    <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(170,255,0,.1)', border: '1px solid rgba(170,255,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 16, color: '#AAFF00', fontWeight: 900 }}>✓</div>
      <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em', marginBottom: 8 }}>{successMsg}</div>
      <button onClick={closeModal} style={{ ...btnPrimary, marginTop: 20 }}>Done</button>
    </div>
  )

  return (
    <>
      <Head>
        <title>Opxio — {company?.name || 'Your Portal'}</title>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{background:#0D0D0D;color:#fff;font-family:'Satoshi',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00;--gm:rgba(170,255,0,.08);--gb:rgba(170,255,0,.2)}
        select option{background:#1A1A1A;color:#fff}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px}
        input:focus,textarea:focus,select:focus{border-color:rgba(170,255,0,.4)!important;outline:none}
        @keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .s1{animation:fadeUp .35s .05s both}
        .s2{animation:fadeUp .35s .12s both}
        .s3{animation:fadeUp .35s .19s both}
        .s4{animation:fadeUp .35s .26s both}
        .s5{animation:fadeUp .35s .33s both}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,.05)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#AAFF00' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>Opxio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {company?.name && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', padding: '3px 10px', borderRadius: 99, letterSpacing: '.04em' }}>{company.name}</span>
          )}
          <button onClick={() => openModal('message')} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', background: '#1A1A1A', border: '1px solid rgba(255,255,255,.08)', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.03em' }}>
            Message us
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* ── HERO ── */}
        <div className="s1" style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(170,255,0,.5)', marginBottom: 8 }}>
            {company?.name} · Active Build
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.05, marginBottom: 16 }}>
            {project.name}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', marginBottom: 6 }}>Progress</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.03em', color: '#AAFF00', lineHeight: 1 }}>{pct}%</div>
            </div>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', marginBottom: 6 }}>Phases</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1 }}>{done}<span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.3)' }}>/{phases.length}</span></div>
            </div>
            {project.target_date && (
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', marginBottom: 6 }}>Target</div>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1 }}>{fmtDate(project.target_date)}</div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
            <div style={{ background: '#AAFF00', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .8s ease' }} />
          </div>
          {active && (
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)' }}>
              Currently on — <span style={{ color: 'rgba(255,255,255,.7)' }}>{active.name}</span>
            </div>
          )}
        </div>

        {/* ── TIMELINE ── */}
        <div className="s2" style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: 'rgba(170,255,0,.4)' }} />
            Build Timeline
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.04)' }} />
          </div>

          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 1, background: 'rgba(255,255,255,.06)' }} />

            {phases.map((phase, i) => {
              const s     = PHASE_STATUS[phase.status] || PHASE_STATUS['Not Started']
              const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
              const doneTasks  = phaseTasks.filter(t => ['Done','Complete','Completed'].includes(t.status)).length
              const isLocked   = phase.status === 'Not Started'
              const isActive   = phase.status === 'In Progress'
              const isDone     = ['Done','Complete','Completed'].includes(phase.status)

              return (
                <div key={phase.id} style={{ display: 'flex', gap: 16, marginBottom: i < phases.length - 1 ? 4 : 0, position: 'relative' }}>
                  {/* Node */}
                  <div style={{ flexShrink: 0, width: 31, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? '#AAFF00' : isActive ? '#fff' : '#1A1A1A',
                      border: isDone ? 'none' : isActive ? '2px solid #fff' : '1.5px solid rgba(255,255,255,.15)',
                      boxShadow: isActive ? '0 0 0 4px rgba(255,255,255,.06)' : isDone ? '0 0 0 3px rgba(170,255,0,.1)' : 'none',
                      zIndex: 1
                    }} />
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, background: isActive ? 'rgba(255,255,255,.03)' : '#111',
                    border: `1px solid ${isActive ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.05)'}`,
                    borderRadius: 12, padding: '14px 16px', marginBottom: 8,
                    opacity: isLocked ? 0.45 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: phaseTasks.length && !isLocked ? 12 : 0 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.25)', marginBottom: 4 }}>Phase {i + 1}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em', color: isLocked ? 'rgba(255,255,255,.35)' : '#fff', lineHeight: 1.3 }}>{phase.name}</div>
                        {phase.target_date && !isLocked && (
                          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.2)', marginTop: 4 }}>{fmtDate(phase.target_date)}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {phaseTasks.length > 0 && !isLocked && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.2)', letterSpacing: '.04em' }}>{doneTasks}/{phaseTasks.length}</span>
                        )}
                        <StatusPill status={phase.status} map={PHASE_STATUS} />
                      </div>
                    </div>

                    {/* Tasks — only show for active + done phases */}
                    {!isLocked && phaseTasks.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {phaseTasks.map(t => {
                          const tDone = ['Done','Complete','Completed'].includes(t.status)
                          const tWip  = t.status === 'In Progress'
                          return (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                              <div style={{
                                width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                                background: tDone ? '#AAFF00' : 'transparent',
                                border: `1.5px solid ${tDone ? '#AAFF00' : tWip ? 'rgba(255,184,77,.5)' : 'rgba(255,255,255,.1)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {tDone && <svg width="7" height="5" viewBox="0 0 7 5" fill="none"><path d="M1 2.5L2.8 4.2L6 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                {tWip && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFB84D' }} />}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 500, color: tDone ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', textDecoration: tDone ? 'line-through' : 'none', flex: 1 }}>{t.name}</span>
                            </div>
                          )
                        })}
                        {(isActive || isDone) && (
                          <button
                            onClick={() => openModal('feedback', phase)}
                            style={{ marginTop: 10, fontSize: 10, fontWeight: 700, color: 'rgba(170,255,0,.6)', background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.15)', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.03em', alignSelf: 'flex-start' }}
                          >Leave feedback on this phase</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── INVOICES ── */}
        {invoices.length > 0 && (
          <div className="s3" style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 12, borderRadius: 2, background: 'rgba(170,255,0,.4)' }} />
              Invoices
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.04)' }} />
            </div>

            {/* Summary */}
            {(totalPaid > 0 || totalDue > 0) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {totalPaid > 0 && (
                  <div style={{ background: 'rgba(170,255,0,.05)', border: '1px solid rgba(170,255,0,.12)', borderRadius: 10, padding: '10px 14px', flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(170,255,0,.4)', marginBottom: 4 }}>Paid</div>
                    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.03em', color: '#AAFF00' }}>MYR {totalPaid.toLocaleString()}</div>
                  </div>
                )}
                {totalDue > 0 && (
                  <div style={{ background: 'rgba(255,184,77,.05)', border: '1px solid rgba(255,184,77,.12)', borderRadius: 10, padding: '10px 14px', flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,184,77,.5)', marginBottom: 4 }}>Due</div>
                    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.03em', color: '#FFB84D' }}>MYR {totalDue.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invoices.map(inv => (
                <div key={inv.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.18)', marginBottom: 4 }}>{inv.number}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>{inv.type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <StatusPill status={inv.status} map={INV_STATUS} />
                    <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-.02em' }}>MYR {(inv.amount||0).toLocaleString()}</span>
                    <a
                      href={`/api/portal/download?type=${['Paid','Deposit Received'].includes(inv.status) ? 'receipt' : 'invoice'}&id=${inv.id}`}
                      target="_blank"
                      style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', background: '#1A1A1A', border: '1px solid rgba(255,255,255,.08)', padding: '5px 11px', borderRadius: 7, textDecoration: 'none', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.03em' }}
                    >↓ {['Paid','Deposit Received'].includes(inv.status) ? 'Receipt' : 'Invoice'}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXPANSIONS ── */}
        <div className="s4" style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: 'rgba(170,255,0,.4)' }} />
            Expansions
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.04)' }} />
          </div>

          {expansions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {expansions.map(exp => (
                <div key={exp.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: 3 }}>{exp.name}</div>
                    {exp.target_date && <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.2)' }}>Est. {fmtDate(exp.target_date)}</div>}
                  </div>
                  <StatusPill status={exp.status || 'In Scope'} map={{ 'In Scope': { label: 'In Scope', color: 'rgba(170,255,0,.7)', dim: 'rgba(170,255,0,.06)', border: 'rgba(170,255,0,.15)' }, 'Requested': { label: 'Requested', color: 'rgba(255,255,255,.4)', dim: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.08)' } }} />
                </div>
              ))}
            </div>
          )}

          {expansions.length === 0 && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.05)', borderRadius: 12, padding: '16px', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.2)', lineHeight: 1.6 }}>
                No expansions yet. If you'd like to add more modules or features after the build, request one below.
              </div>
            </div>
          )}

          <button onClick={() => openModal('expansion')} style={{ width: '100%', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', background: 'transparent', border: '1px dashed rgba(255,255,255,.1)', padding: 14, borderRadius: 12, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.06em', textTransform: 'uppercase', transition: 'all .2s' }}>
            + Request an Expansion
          </button>
        </div>

        {/* ── FOOTER ── */}
        <div className="s5" style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.15)' }}>
            Built by Opxio · <span style={{ color: 'rgba(170,255,0,.4)' }}>opxio.io</span>
          </div>
          <button onClick={() => openModal('message')} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', background: '#1A1A1A', border: '1px solid rgba(255,255,255,.08)', padding: '7px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.04em' }}>
            Message the team
          </button>
        </div>
      </div>

      {/* ── FEEDBACK MODAL ── */}
      <Modal open={modal === 'feedback'} onClose={closeModal} eyebrow="Feedback" title={feedbackPhase?.name} sub="Tell us what to adjust or flag — we'll review and get back to you.">
        {formStatus === 'success' ? <SuccessView /> : <>
          <div style={{ marginBottom: 14 }}><label style={labelSt}>Type</label>
            <select style={inputSt} value={fbType} onChange={e => setFbType(e.target.value)}>
              <option>Revision Request</option><option>General Feedback</option><option>Issue Report</option>
            </select></div>
          <div style={{ marginBottom: 14 }}><label style={labelSt}>Description</label>
            <textarea style={{ ...inputSt, minHeight: 90, lineHeight: 1.6 }} value={fbDesc} onChange={e => setFbDesc(e.target.value)} placeholder="What would you like changed or flagged…" /></div>
          <div style={{ marginBottom: 4 }}><label style={labelSt}>Attachment link (optional)</label>
            <input style={inputSt} value={fbLink} onChange={e => setFbLink(e.target.value)} placeholder="Google Drive / Loom URL" /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={closeModal} style={btnGhost}>Cancel</button>
            <button onClick={submitFeedback} disabled={formStatus === 'loading'} style={{ ...btnPrimary, flex: 1, marginTop: 0, opacity: formStatus === 'loading' ? .4 : 1 }}>
              {formStatus === 'loading' ? 'Submitting…' : 'Submit feedback'}
            </button>
          </div>
        </>}
      </Modal>

      {/* ── EXPANSION MODAL ── */}
      <Modal open={modal === 'expansion'} onClose={closeModal} eyebrow="Expansion" title="Request an Expansion" sub="Tell us what you need. We'll scope and send you a quote.">
        {formStatus === 'success' ? <SuccessView /> : <>
          <div style={{ marginBottom: 14 }}><label style={labelSt}>What do you need?</label>
            <textarea style={{ ...inputSt, minHeight: 90, lineHeight: 1.6 }} value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Describe the system or module you'd like added…" /></div>
          <div style={{ marginBottom: 14 }}><label style={labelSt}>Area</label>
            <select style={inputSt} value={expArea} onChange={e => setExpArea(e.target.value)}>
              {['Revenue', 'Operations', 'Marketing', 'Finance', 'Team', 'Retention', 'Sales', 'Other'].map(a => <option key={a}>{a}</option>)}
            </select></div>
          <div style={{ marginBottom: 4 }}><label style={labelSt}>Urgency</label>
            <select style={inputSt} value={expUrg} onChange={e => setExpUrg(e.target.value)}>
              <option>When possible</option><option>Within this month</option><option>Urgent</option>
            </select></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={closeModal} style={btnGhost}>Cancel</button>
            <button onClick={submitExpansion} disabled={formStatus === 'loading'} style={{ ...btnPrimary, flex: 1, marginTop: 0, opacity: formStatus === 'loading' ? .4 : 1 }}>
              {formStatus === 'loading' ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </>}
      </Modal>

      {/* ── MESSAGE MODAL ── */}
      <Modal open={modal === 'message'} onClose={closeModal} eyebrow="Message" title="Message Opxio" sub="We respond within 1 business day.">
        {formStatus === 'success' ? <SuccessView /> : <>
          <div style={{ marginBottom: 14 }}><label style={labelSt}>Subject</label>
            <input style={inputSt} value={msgSubj} onChange={e => setMsgSubj(e.target.value)} placeholder="What's this about?" /></div>
          <div style={{ marginBottom: 4 }}><label style={labelSt}>Message</label>
            <textarea style={{ ...inputSt, minHeight: 100, lineHeight: 1.6 }} value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Write your message here…" /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={closeModal} style={btnGhost}>Cancel</button>
            <button onClick={submitMessage} disabled={formStatus === 'loading'} style={{ ...btnPrimary, flex: 1, marginTop: 0, opacity: formStatus === 'loading' ? .4 : 1 }}>
              {formStatus === 'loading' ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </>}
      </Modal>
    </>
  )
}
