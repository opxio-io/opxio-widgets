import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const PHASE_STATUS = {
  'Done':        { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.1)',  border: 'rgba(170,255,0,.25)' },
  'Complete':    { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.1)',  border: 'rgba(170,255,0,.25)' },
  'Completed':   { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.1)',  border: 'rgba(170,255,0,.25)' },
  'In Progress': { label: 'In Progress', color: '#fff',    dim: 'rgba(255,255,255,.07)', border: 'rgba(255,255,255,.2)' },
  'Not Started': { label: 'Upcoming',    color: 'rgba(255,255,255,.3)', dim: 'transparent', border: 'rgba(255,255,255,.07)' },
}
const INV_STATUS = {
  'Paid':             { label: 'Paid', color: '#AAFF00', dim: 'rgba(170,255,0,.1)', border: 'rgba(170,255,0,.25)' },
  'Deposit Received': { label: 'Paid', color: '#AAFF00', dim: 'rgba(170,255,0,.1)', border: 'rgba(170,255,0,.25)' },
  'Awaiting Payment': { label: 'Due',  color: '#FFB84D', dim: 'rgba(255,184,77,.1)', border: 'rgba(255,184,77,.25)' },
}

function cleanPhaseName(name) {
  return name.replace(/^phase\s+\d+\s*[—–-]\s*/i, '').trim()
}
function fmtDate(s) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Pill({ status, map }) {
  const s = (map||{})[status] || { label: status, color: 'rgba(255,255,255,.4)', dim: 'transparent', border: 'rgba(255,255,255,.1)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      fontSize: 9, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
      padding: '4px 10px', borderRadius: 99,
      background: s.dim, border: `1px solid ${s.border}`, color: s.color,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function BottomSheet({ open, onClose, eyebrow, title, sub, children }) {
  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#161616', borderTop: '1px solid rgba(255,255,255,.1)',
        borderRadius: '18px 18px 0 0', padding: '20px 24px 44px',
        width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto'
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.15)', margin: '0 auto 24px' }} />
        {eyebrow && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(170,255,0,.6)', marginBottom: 6 }}>{eyebrow}</div>}
        {title && <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-.03em', color: '#fff', marginBottom: sub ? 6 : 22 }}>{title}</div>}
        {sub && <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.4)', marginBottom: 24, lineHeight: 1.65 }}>{sub}</div>}
        {children}
      </div>
    </div>
  )
}

const inputSt = {
  display: 'block', width: '100%', marginTop: 7,
  background: '#1E1E1E', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 9, padding: '11px 14px', fontSize: 13, fontWeight: 500,
  color: '#fff', outline: 'none', fontFamily: "'Satoshi',sans-serif",
  transition: 'border-color .2s'
}
const labelSt = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }
const btnPrimary = {
  width: '100%', marginTop: 18, background: '#AAFF00', color: '#000',
  border: 'none', borderRadius: 10, padding: '13px', fontSize: 12, fontWeight: 900,
  cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.03em', textTransform: 'uppercase'
}
const btnGhost = {
  background: 'transparent', border: '1px solid rgba(255,255,255,.12)',
  color: 'rgba(255,255,255,.5)', borderRadius: 9, padding: '10px 18px',
  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif"
}

export default function PortalToken() {
  const router = useRouter()
  const { token: portalToken } = router.query

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [fbPhase, setFbPhase] = useState(null)
  const [formStatus, setFormStatus] = useState('idle')
  const [successMsg, setSuccessMsg] = useState('')

  const [fbType, setFbType]   = useState('Revision Request')
  const [fbDesc, setFbDesc]   = useState('')
  const [fbLink, setFbLink]   = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expArea, setExpArea] = useState('Revenue')
  const [expUrg, setExpUrg]   = useState('When possible')
  const [msgSubj, setMsgSubj] = useState('')
  const [msgBody, setMsgBody] = useState('')

  useEffect(() => {
    if (!portalToken) return
    fetch(`/api/portal/data?token=${portalToken}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [portalToken])

  function openModal(type, phase) {
    setModal(type); setFbPhase(phase || null)
    setFormStatus('idle'); setSuccessMsg('')
    setFbType('Revision Request'); setFbDesc(''); setFbLink('')
    setExpDesc(''); setExpArea('Revenue'); setExpUrg('When possible')
    setMsgSubj(''); setMsgBody('')
  }

  async function post(url, body) {
    setFormStatus('loading')
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (r.ok) return true
    } catch {}
    setFormStatus('error')
    return false
  }

  const SuccessView = () => (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(170,255,0,.1)', border: '1px solid rgba(170,255,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#AAFF00', fontSize: 18, fontWeight: 900 }}>✓</div>
      <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-.02em', color: '#fff', marginBottom: 8 }}>{successMsg}</div>
      <button onClick={() => setModal(null)} style={{ ...btnPrimary, width: 'auto', padding: '10px 32px', marginTop: 20 }}>Done</button>
    </div>
  )

  if (loading || !data) return (
    <>
      <Head><link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" /></Head>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#0D0D0D;font-family:'Satoshi',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}@keyframes p{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#AAFF00', animation: 'p 1.4s infinite' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>Loading your portal</span>
      </div>
    </>
  )

  const { project, phases, tasks, invoices, expansions, company } = data
  const donePh    = phases.filter(p => ['Done','Complete','Completed'].includes(p.status)).length
  const activePh  = phases.find(p => p.status === 'In Progress')
  const pct       = phases.length ? Math.round((donePh / phases.length) * 100) : 0
  const totalPaid = invoices.filter(i => ['Paid','Deposit Received'].includes(i.status)).reduce((s,i) => s+(i.amount||0), 0)
  const totalDue  = invoices.filter(i => i.status === 'Awaiting Payment').reduce((s,i) => s+(i.amount||0), 0)

  const projectTitle = project.name.replace(/^.+?[—–]\s*/, '')

  return (
    <>
      <Head>
        <title>Opxio — {company?.name || 'Your Portal'}</title>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{background:#0D0D0D;color:#fff;font-family:'Satoshi',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00;--gm:rgba(170,255,0,.1);--gb:rgba(170,255,0,.22);--card:#111111;--border:rgba(255,255,255,.07)}
        select option{background:#1E1E1E;color:#fff}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
        input:focus,textarea:focus,select:focus{border-color:rgba(170,255,0,.5)!important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .a1{animation:fadeUp .45s .04s both}
        .a2{animation:fadeUp .45s .12s both}
        .a3{animation:fadeUp .45s .20s both}
        .a4{animation:fadeUp .45s .28s both}
        .a5{animation:fadeUp .45s .34s both}
        .phase-card{transition:border-color .2s,background .2s}
        .phase-card:hover{border-color:rgba(255,255,255,.13)!important;background:#141414!important}
        .fb-btn:hover{background:rgba(170,255,0,.1)!important;border-color:rgba(170,255,0,.25)!important;color:#AAFF00!important}
        .dl-btn:hover{color:rgba(255,255,255,.7)!important;border-color:rgba(255,255,255,.2)!important}
        .msg-btn:hover{border-color:rgba(255,255,255,.2)!important;color:rgba(255,255,255,.7)!important}
        .exp-btn:hover{border-color:rgba(170,255,0,.2)!important;color:rgba(170,255,0,.7)!important}
        .layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:24px;align-items:start}
        @media(max-width:760px){.layout{grid-template-columns:1fr!important}}
        @media(max-width:480px){.stat-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>

      {/* HEADER */}
      <div style={{
        background: 'rgba(13,13,13,.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#AAFF00' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>Opxio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {company?.name && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.22)', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', padding: '3px 11px', borderRadius: 99 }}>
              {company.name}
            </span>
          )}
          <button className="msg-btn" onClick={() => openModal('message')} style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.02em',
            color: 'rgba(255,255,255,.4)', background: '#181818',
            border: '1px solid rgba(255,255,255,.1)', padding: '6px 14px',
            borderRadius: 8, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
            transition: 'all .2s',
          }}>
            Message us
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '44px 24px 100px' }}>

        {/* HERO */}
        <div className="a1" style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: 'rgba(170,255,0,.5)', marginBottom: 10 }}>
            {company?.name} · Active Build
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.06, color: '#fff', marginBottom: 28 }}>
            {projectTitle}
          </div>

          {/* Stat cards */}
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {/* Progress */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(170,255,0,.04) 0%, transparent 60%)`, pointerEvents: 'none' }} />
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginBottom: 10 }}>Progress</div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.05em', color: '#AAFF00', lineHeight: 1 }}>
                {pct}<span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(170,255,0,.45)' }}>%</span>
              </div>
            </div>

            {/* Phases */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginBottom: 10 }}>Phases Done</div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.05em', lineHeight: 1 }}>
                {donePh}<span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,.2)' }}>/{phases.length}</span>
              </div>
            </div>

            {/* Current phase / status */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginBottom: 10 }}>
                {activePh ? 'Now Building' : 'Status'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.25, color: activePh ? '#fff' : 'rgba(255,255,255,.5)' }}>
                {activePh ? cleanPhaseName(activePh.name) : donePh === phases.length ? 'Complete' : 'Starting soon'}
              </div>
              {project.target_date && (
                <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.22)', marginTop: 5 }}>
                  Est. {fmtDate(project.target_date)}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
            <div style={{ background: '#AAFF00', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width 1s cubic-bezier(.4,0,.2,1)', boxShadow: '0 0 8px rgba(170,255,0,.4)' }} />
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="layout">

          {/* LEFT — BUILD TIMELINE */}
          <div className="a2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 3, height: 14, borderRadius: 99, background: 'rgba(170,255,0,.5)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Build Timeline</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
            </div>

            <div style={{ position: 'relative', paddingLeft: 26 }}>
              {/* Connector line */}
              <div style={{ position: 'absolute', left: 6, top: 16, bottom: 16, width: 1, background: 'rgba(255,255,255,.06)', zIndex: 0 }} />

              {phases.map((phase, i) => {
                const isDone   = ['Done','Complete','Completed'].includes(phase.status)
                const isActive = phase.status === 'In Progress'
                const isLocked = phase.status === 'Not Started'
                const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
                const doneTasks  = phaseTasks.filter(t => ['Done','Complete','Completed'].includes(t.status)).length
                const displayName = cleanPhaseName(phase.name)

                return (
                  <div key={phase.id} style={{ display: 'flex', gap: 14, marginBottom: 8, position: 'relative', zIndex: 1 }}>
                    {/* Node — always lime green */}
                    <div style={{ position: 'absolute', left: -26, top: 20, width: 14, display: 'flex', justifyContent: 'center' }}>
                      {isDone ? (
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: '#AAFF00', border: '2px solid rgba(170,255,0,.4)',
                          boxShadow: '0 0 0 3px rgba(170,255,0,.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="6" height="5" viewBox="0 0 6 5" fill="none"><path d="M1 2.5L2.4 4L5 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      ) : isActive ? (
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', marginTop: 1,
                          background: '#AAFF00', border: '2px solid rgba(170,255,0,.5)',
                          boxShadow: '0 0 0 4px rgba(170,255,0,.1)',
                        }} />
                      ) : (
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', marginTop: 2,
                          background: 'transparent', border: '2px solid rgba(170,255,0,.25)',
                        }} />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={isLocked ? '' : 'phase-card'}
                      style={{
                        flex: 1,
                        background: isActive ? '#141414' : '#111',
                        border: `1px solid ${isActive ? 'rgba(255,255,255,.11)' : 'rgba(255,255,255,.06)'}`,
                        borderRadius: 14, padding: '16px 18px',
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: 'rgba(255,255,255,.2)', marginBottom: 5 }}>
                            Phase {i + 1}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', color: isLocked ? 'rgba(255,255,255,.35)' : '#fff', lineHeight: 1.3 }}>
                            {displayName}
                          </div>
                          {(phase.start_date || phase.target_date) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                              {phase.start_date && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.28)' }}>
                                  {fmtDate(phase.start_date)}
                                </span>
                              )}
                              {phase.start_date && phase.target_date && (
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.15)' }}>→</span>
                              )}
                              {phase.target_date && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: isDone ? 'rgba(170,255,0,.5)' : isActive ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.28)' }}>
                                  {fmtDate(phase.target_date)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <Pill status={phase.status} map={PHASE_STATUS} />
                        </div>
                      </div>

                      {/* Phase progress bar — only when active */}
                      {isActive && phaseTasks.length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 99, height: 3, overflow: 'hidden', marginBottom: 10 }}>
                            <div style={{ background: '#AAFF00', height: '100%', borderRadius: 99, width: `${Math.round((doneTasks / phaseTasks.length) * 100)}%`, transition: 'width .8s ease' }} />
                          </div>
                          <button
                            className="fb-btn"
                            onClick={() => openModal('feedback', phase)}
                            style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '.03em',
                              color: 'rgba(255,255,255,.35)', background: 'transparent',
                              border: '1px solid rgba(255,255,255,.1)', padding: '6px 13px',
                              borderRadius: 8, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
                              transition: 'all .2s',
                            }}
                          >
                            Leave feedback
                          </button>
                        </div>
                      )}

                      {/* Done phase — just feedback button */}
                      {isDone && (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.04)' }}>
                          <button
                            className="fb-btn"
                            onClick={() => openModal('feedback', phase)}
                            style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '.03em',
                              color: 'rgba(255,255,255,.25)', background: 'transparent',
                              border: '1px solid rgba(255,255,255,.07)', padding: '5px 13px',
                              borderRadius: 8, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
                              transition: 'all .2s',
                            }}
                          >
                            Leave feedback
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — INVOICES + EXPANSIONS */}
          <div>

            {/* INVOICES */}
            {invoices.length > 0 && (
              <div className="a3" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 99, background: 'rgba(170,255,0,.5)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Invoices</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
                </div>

                {/* Paid / Due summary */}
                {(totalPaid > 0 || totalDue > 0) && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {totalPaid > 0 && (
                      <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.14)', borderRadius: 12, padding: '13px 16px', flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(170,255,0,.45)', marginBottom: 6 }}>Paid</div>
                        <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.03em', color: '#AAFF00' }}>MYR {totalPaid.toLocaleString()}</div>
                      </div>
                    )}
                    {totalDue > 0 && (
                      <div style={{ background: 'rgba(255,184,77,.06)', border: '1px solid rgba(255,184,77,.14)', borderRadius: 12, padding: '13px 16px', flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,184,77,.5)', marginBottom: 6 }}>Due</div>
                        <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.03em', color: '#FFB84D' }}>MYR {totalDue.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {invoices.map(inv => {
                    const isPaid = ['Paid','Deposit Received'].includes(inv.status)
                    return (
                      <div key={inv.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', marginBottom: 4 }}>{inv.number}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{inv.type}</div>
                          </div>
                          <Pill status={inv.status} map={INV_STATUS} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-.025em', color: '#fff' }}>
                            MYR {(inv.amount||0).toLocaleString()}
                          </span>
                          <a
                            className="dl-btn"
                            href={`/api/portal/download?type=${isPaid ? 'receipt' : 'invoice'}&id=${inv.id}`}
                            target="_blank"
                            style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '.03em',
                              color: 'rgba(255,255,255,.35)', background: 'rgba(255,255,255,.04)',
                              border: '1px solid rgba(255,255,255,.09)', padding: '6px 12px',
                              borderRadius: 8, textDecoration: 'none', fontFamily: "'Satoshi',sans-serif",
                              transition: 'all .2s',
                            }}
                          >
                            ↓ {isPaid ? 'Receipt' : 'Invoice'}
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* EXPANSIONS */}
            <div className="a4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 3, height: 14, borderRadius: 99, background: 'rgba(170,255,0,.5)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Expansions</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
              </div>

              {expansions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {expansions.map(exp => (
                    <div key={exp.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: exp.target_date ? 4 : 0 }}>{exp.name}</div>
                          {exp.target_date && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.28)', fontWeight: 500 }}>Est. {fmtDate(exp.target_date)}</div>}
                        </div>
                        <Pill status={exp.status||'In Scope'} map={{
                          'In Scope':  { label: 'In Scope',  color: 'rgba(170,255,0,.7)', dim: 'rgba(170,255,0,.07)', border: 'rgba(170,255,0,.18)' },
                          'Requested': { label: 'Requested', color: 'rgba(255,255,255,.4)', dim: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.09)' },
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expansions.length === 0 && (
                <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.28)', lineHeight: 1.65 }}>
                    No expansions yet. Once your build is complete, you can request additional modules here.
                  </div>
                </div>
              )}

              <button
                className="exp-btn"
                onClick={() => openModal('expansion')}
                style={{
                  width: '100%', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.28)', background: 'transparent',
                  border: '1px dashed rgba(255,255,255,.1)', padding: 14,
                  borderRadius: 12, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
                  transition: 'all .2s',
                }}
              >
                + Request an Expansion
              </button>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="a5" style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 24, marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.15)' }}>
            Built by <span style={{ color: 'rgba(170,255,0,.4)' }}>Opxio</span>
          </span>
          <button className="msg-btn" onClick={() => openModal('message')} style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
            color: 'rgba(255,255,255,.3)', background: '#181818',
            border: '1px solid rgba(255,255,255,.09)', padding: '7px 16px',
            borderRadius: 99, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
            transition: 'all .2s',
          }}>
            Message the team
          </button>
        </div>
      </div>

      {/* FEEDBACK SHEET */}
      <BottomSheet open={modal==='feedback'} onClose={()=>setModal(null)} eyebrow="Feedback" title={fbPhase ? cleanPhaseName(fbPhase.name) : ''} sub="Tell us what to adjust or flag. We'll review and follow up within 1 business day.">
        {formStatus==='success' ? <SuccessView/> : <>
          <div style={{marginBottom:14}}><label style={labelSt}>Type</label>
            <select style={inputSt} value={fbType} onChange={e=>setFbType(e.target.value)}>
              <option>Revision Request</option><option>General Feedback</option><option>Issue Report</option>
            </select>
          </div>
          <div style={{marginBottom:14}}><label style={labelSt}>Description</label>
            <textarea style={{...inputSt,minHeight:110,lineHeight:1.65}} value={fbDesc} onChange={e=>setFbDesc(e.target.value)} placeholder="What would you like changed or flagged…"/>
          </div>
          <div><label style={labelSt}>Attachment link (optional)</label>
            <input style={inputSt} value={fbLink} onChange={e=>setFbLink(e.target.value)} placeholder="Google Drive / Loom URL"/>
          </div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button onClick={()=>setModal(null)} style={btnGhost}>Cancel</button>
            <button
              onClick={async()=>{
                if(!fbDesc)return
                const ok=await post('/api/portal/feedback',{portal_token:portalToken,phase_name:fbPhase?.name,type:fbType,description:fbDesc,attachment:fbLink})
                if(ok){setFormStatus('success');setSuccessMsg("Feedback submitted. We'll be in touch.")}
              }}
              disabled={formStatus==='loading'}
              style={{...btnPrimary,flex:1,marginTop:0,opacity:formStatus==='loading'?.4:1}}
            >
              {formStatus==='loading'?'Submitting…':'Submit feedback'}
            </button>
          </div>
        </>}
      </BottomSheet>

      {/* EXPANSION SHEET */}
      <BottomSheet open={modal==='expansion'} onClose={()=>setModal(null)} eyebrow="Expansion" title="Request an Expansion" sub="Tell us what you need. We'll scope it and send a quote.">
        {formStatus==='success' ? <SuccessView/> : <>
          <div style={{marginBottom:14}}><label style={labelSt}>What do you need?</label>
            <textarea style={{...inputSt,minHeight:110,lineHeight:1.65}} value={expDesc} onChange={e=>setExpDesc(e.target.value)} placeholder="Describe the system or module you'd like added…"/>
          </div>
          <div style={{marginBottom:14}}><label style={labelSt}>Area</label>
            <select style={inputSt} value={expArea} onChange={e=>setExpArea(e.target.value)}>
              {['Revenue','Operations','Marketing','Finance','Team','Retention','Sales','Other'].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div><label style={labelSt}>Urgency</label>
            <select style={inputSt} value={expUrg} onChange={e=>setExpUrg(e.target.value)}>
              <option>When possible</option><option>Within this month</option><option>Urgent</option>
            </select>
          </div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button onClick={()=>setModal(null)} style={btnGhost}>Cancel</button>
            <button
              onClick={async()=>{
                if(!expDesc)return
                const ok=await post('/api/portal/expansion',{portal_token:portalToken,description:expDesc,area:expArea,urgency:expUrg})
                if(ok){setFormStatus('success');setSuccessMsg('Request sent. Kai will follow up with a scope and quote.')}
              }}
              disabled={formStatus==='loading'}
              style={{...btnPrimary,flex:1,marginTop:0,opacity:formStatus==='loading'?.4:1}}
            >
              {formStatus==='loading'?'Sending…':'Send request'}
            </button>
          </div>
        </>}
      </BottomSheet>

      {/* MESSAGE SHEET */}
      <BottomSheet open={modal==='message'} onClose={()=>setModal(null)} eyebrow="Message" title="Message Opxio" sub="We respond within 1 business day.">
        {formStatus==='success' ? <SuccessView/> : <>
          <div style={{marginBottom:14}}><label style={labelSt}>Subject</label>
            <input style={inputSt} value={msgSubj} onChange={e=>setMsgSubj(e.target.value)} placeholder="What's this about?"/>
          </div>
          <div><label style={labelSt}>Message</label>
            <textarea style={{...inputSt,minHeight:110,lineHeight:1.65}} value={msgBody} onChange={e=>setMsgBody(e.target.value)} placeholder="Write your message here…"/>
          </div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button onClick={()=>setModal(null)} style={btnGhost}>Cancel</button>
            <button
              onClick={async()=>{
                if(!msgSubj||!msgBody)return
                const ok=await post('/api/portal/message',{portal_token:portalToken,subject:msgSubj,message:msgBody})
                if(ok){setFormStatus('success');setSuccessMsg('Message sent. We respond within 1 business day.')}
              }}
              disabled={formStatus==='loading'}
              style={{...btnPrimary,flex:1,marginTop:0,opacity:formStatus==='loading'?.4:1}}
            >
              {formStatus==='loading'?'Sending…':'Send message'}
            </button>
          </div>
        </>}
      </BottomSheet>
    </>
  )
}
