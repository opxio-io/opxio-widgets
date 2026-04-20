import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const PHASE_STATUS = {
  'Done':        { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.12)', border: 'rgba(170,255,0,.3)' },
  'Complete':    { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.12)', border: 'rgba(170,255,0,.3)' },
  'Completed':   { label: 'Complete',    color: '#AAFF00', dim: 'rgba(170,255,0,.12)', border: 'rgba(170,255,0,.3)' },
  'In Progress': { label: 'In Progress', color: '#fff',    dim: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.2)' },
  'Not Started': { label: 'Upcoming',    color: 'rgba(255,255,255,.3)', dim: 'transparent', border: 'rgba(255,255,255,.08)' },
}
const INV_STATUS = {
  'Paid':             { label: 'Paid', color: '#AAFF00', dim: 'rgba(170,255,0,.1)', border: 'rgba(170,255,0,.25)' },
  'Deposit Received': { label: 'Paid', color: '#AAFF00', dim: 'rgba(170,255,0,.1)', border: 'rgba(170,255,0,.25)' },
  'Awaiting Payment': { label: 'Due',  color: '#FFB84D', dim: 'rgba(255,184,77,.1)', border: 'rgba(255,184,77,.25)' },
}

// Strip "Phase N — " prefix for cleaner display
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
      padding: '4px 9px', borderRadius: 99,
      background: s.dim, border: `1px solid ${s.border}`, color: s.color,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: 'rgba(170,255,0,.5)', flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
    </div>
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
  const donePh   = phases.filter(p => ['Done','Complete','Completed'].includes(p.status)).length
  const activePh = phases.find(p => p.status === 'In Progress')
  const pct      = phases.length ? Math.round((donePh / phases.length) * 100) : 0
  const totalPaid = invoices.filter(i => ['Paid','Deposit Received'].includes(i.status)).reduce((s,i) => s+(i.amount||0), 0)
  const totalDue  = invoices.filter(i => i.status === 'Awaiting Payment').reduce((s,i) => s+(i.amount||0), 0)

  return (
    <>
      <Head>
        <title>Opxio — {company?.name || 'Your Portal'}</title>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{background:#0D0D0D;color:#fff;font-family:'Satoshi',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00}
        select option{background:#1E1E1E;color:#fff}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
        input:focus,textarea:focus,select:focus{border-color:rgba(170,255,0,.5)!important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .a1{animation:fadeUp .4s .04s both}.a2{animation:fadeUp .4s .10s both}
        .a3{animation:fadeUp .4s .16s both}.a4{animation:fadeUp .4s .22s both}
        .a5{animation:fadeUp .4s .28s both}
        .phase-card:hover{border-color:rgba(255,255,255,.12)!important}
      `}</style>

      {/* HEADER */}
      <div style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,.06)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#AAFF00' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Opxio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {company?.name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '3px 11px', borderRadius: 99 }}>{company.name}</span>}
          <button onClick={() => openModal('message')} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.03em', color: 'rgba(255,255,255,.5)', background: '#181818', border: '1px solid rgba(255,255,255,.1)', padding: '6px 13px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif" }}>
            Message us
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px 88px' }}>

        {/* HERO */}
        <div className="a1" style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(170,255,0,.55)', marginBottom: 10 }}>
            {company?.name} · Active Build
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.08, color: '#fff', marginBottom: 22 }}>
            {project.name.replace(/^.+?—\s*/, '')}
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 14px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>Progress</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.04em', color: '#AAFF00', lineHeight: 1 }}>{pct}<span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(170,255,0,.5)' }}>%</span></div>
            </div>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 14px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>Phases</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1 }}>{donePh}<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.25)' }}>/{phases.length}</span></div>
            </div>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 14px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>Status</div>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '-.01em', lineHeight: 1.2, color: '#fff' }}>{activePh ? cleanPhaseName(activePh.name) : donePh === phases.length ? 'Complete' : 'Starting soon'}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
            <div style={{ background: '#AAFF00', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .9s ease' }} />
          </div>
          {project.target_date && (
            <div style={{ marginTop: 9, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.3)' }}>
              Target delivery — <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{fmtDate(project.target_date)}</span>
            </div>
          )}
        </div>

        {/* TIMELINE */}
        <div className="a2" style={{ marginBottom: 44 }}>
          <SectionLabel>Build Timeline</SectionLabel>
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            {/* Vertical connector line */}
            <div style={{ position: 'absolute', left: 7, top: 12, bottom: 12, width: 1, background: 'rgba(255,255,255,.07)', zIndex: 0 }} />

            {phases.map((phase, i) => {
              const s        = PHASE_STATUS[phase.status] || PHASE_STATUS['Not Started']
              const isDone   = ['Done','Complete','Completed'].includes(phase.status)
              const isActive = phase.status === 'In Progress'
              const isLocked = phase.status === 'Not Started'
              const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
              const doneTasks  = phaseTasks.filter(t => ['Done','Complete','Completed'].includes(t.status)).length
              const displayName = cleanPhaseName(phase.name)

              return (
                <div key={phase.id} style={{ display: 'flex', gap: 16, marginBottom: 8, position: 'relative', zIndex: 1 }}>
                  {/* Node dot */}
                  <div style={{ position: 'absolute', left: -28, top: 18, width: 16, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      width: isDone ? 12 : isActive ? 12 : 8,
                      height: isDone ? 12 : isActive ? 12 : 8,
                      borderRadius: '50%', flexShrink: 0,
                      background: isDone ? '#AAFF00' : isActive ? '#fff' : '#222',
                      border: isDone ? '2px solid rgba(170,255,0,.3)' : isActive ? '2px solid rgba(255,255,255,.3)' : '1.5px solid rgba(255,255,255,.15)',
                      boxShadow: isActive ? '0 0 0 4px rgba(255,255,255,.05)' : isDone ? '0 0 0 3px rgba(170,255,0,.08)' : 'none',
                      marginTop: isDone || isActive ? 1 : 3,
                    }} />
                  </div>

                  {/* Card */}
                  <div
                    className={isLocked ? '' : 'phase-card'}
                    style={{
                      flex: 1,
                      background: isActive ? '#151515' : '#111',
                      border: `1px solid ${isActive ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)'}`,
                      borderRadius: 12, padding: '16px 18px',
                      opacity: isLocked ? 0.5 : 1,
                      transition: 'border-color .2s',
                    }}
                  >
                    {/* Phase header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.25)', marginBottom: 5 }}>Phase {i + 1}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', color: isLocked ? 'rgba(255,255,255,.4)' : '#fff', lineHeight: 1.3 }}>{displayName}</div>
                        {phase.target_date && !isLocked && (
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.3)', marginTop: 5 }}>{fmtDate(phase.target_date)}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <Pill status={phase.status} map={PHASE_STATUS} />
                        {phaseTasks.length > 0 && !isLocked && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.2)', letterSpacing: '.04em' }}>{doneTasks}/{phaseTasks.length} tasks</span>
                        )}
                      </div>
                    </div>

                    {/* Tasks */}
                    {!isLocked && phaseTasks.length > 0 && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                        {phaseTasks.map(t => {
                          const tDone = ['Done','Complete','Completed'].includes(t.status)
                          const tWip  = t.status === 'In Progress'
                          return (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                              <div style={{
                                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                                background: tDone ? '#AAFF00' : 'transparent',
                                border: `1.5px solid ${tDone ? '#AAFF00' : tWip ? 'rgba(255,184,77,.6)' : 'rgba(255,255,255,.12)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {tDone && <svg width="7" height="5" viewBox="0 0 7 5" fill="none"><path d="M1 2.5L2.8 4.2L6 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                {tWip && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFB84D' }} />}
                              </div>
                              <span style={{
                                fontSize: 12, fontWeight: 500, flex: 1, lineHeight: 1.4,
                                color: tDone ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.7)',
                                textDecoration: tDone ? 'line-through' : 'none',
                              }}>{t.name}</span>
                            </div>
                          )
                        })}
                        {(isActive || isDone) && (
                          <button
                            onClick={() => openModal('feedback', phase)}
                            style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: 'rgba(170,255,0,.65)', background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.15)', padding: '5px 13px', borderRadius: 7, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.03em' }}
                          >Leave feedback →</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* INVOICES */}
        {invoices.length > 0 && (
          <div className="a3" style={{ marginBottom: 44 }}>
            <SectionLabel>Invoices</SectionLabel>
            {(totalPaid > 0 || totalDue > 0) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {totalPaid > 0 && (
                  <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.15)', borderRadius: 10, padding: '12px 16px', flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(170,255,0,.45)', marginBottom: 5 }}>Paid</div>
                    <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.03em', color: '#AAFF00' }}>MYR {totalPaid.toLocaleString()}</div>
                  </div>
                )}
                {totalDue > 0 && (
                  <div style={{ background: 'rgba(255,184,77,.06)', border: '1px solid rgba(255,184,77,.15)', borderRadius: 10, padding: '12px 16px', flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,184,77,.5)', marginBottom: 5 }}>Due</div>
                    <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.03em', color: '#FFB84D' }}>MYR {totalDue.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invoices.map(inv => (
                <div key={inv.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.07em', color: 'rgba(255,255,255,.22)', marginBottom: 5 }}>{inv.number}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{inv.type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Pill status={inv.status} map={INV_STATUS} />
                    <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-.02em', color: '#fff' }}>MYR {(inv.amount||0).toLocaleString()}</span>
                    <a href={`/api/portal/download?type=${['Paid','Deposit Received'].includes(inv.status)?'receipt':'invoice'}&id=${inv.id}`} target="_blank"
                      style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', background: '#1A1A1A', border: '1px solid rgba(255,255,255,.1)', padding: '5px 12px', borderRadius: 7, textDecoration: 'none', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.03em' }}>
                      ↓ {['Paid','Deposit Received'].includes(inv.status)?'Receipt':'Invoice'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPANSIONS */}
        <div className="a4" style={{ marginBottom: 44 }}>
          <SectionLabel>Expansions</SectionLabel>
          {expansions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {expansions.map(exp => (
                <div key={exp.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.85)', marginBottom: 4 }}>{exp.name}</div>
                    {exp.target_date && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>Est. {fmtDate(exp.target_date)}</div>}
                  </div>
                  <Pill status={exp.status||'In Scope'} map={{ 'In Scope': { label: 'In Scope', color: 'rgba(170,255,0,.7)', dim: 'rgba(170,255,0,.07)', border: 'rgba(170,255,0,.18)' }, 'Requested': { label: 'Requested', color: 'rgba(255,255,255,.4)', dim: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.09)' } }} />
                </div>
              ))}
            </div>
          )}
          {expansions.length === 0 && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '16px 18px', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.35)', lineHeight: 1.65 }}>No expansions yet. Once your build is complete, you can request additional modules or features here.</div>
            </div>
          )}
          <button onClick={() => openModal('expansion')} style={{ width: '100%', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', background: 'transparent', border: '1px dashed rgba(255,255,255,.12)', padding: 14, borderRadius: 12, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.07em', textTransform: 'uppercase', transition: 'all .2s' }}>
            + Request an Expansion
          </button>
        </div>

        {/* FOOTER */}
        <div className="a5" style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.18)' }}>Built by <span style={{ color: 'rgba(170,255,0,.45)' }}>Opxio</span></span>
          <button onClick={() => openModal('message')} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', background: '#181818', border: '1px solid rgba(255,255,255,.1)', padding: '7px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: "'Satoshi',sans-serif", letterSpacing: '.04em' }}>
            Message the team
          </button>
        </div>
      </div>

      {/* FEEDBACK SHEET */}
      <BottomSheet open={modal==='feedback'} onClose={()=>setModal(null)} eyebrow="Feedback" title={fbPhase ? cleanPhaseName(fbPhase.name) : ''} sub="Tell us what to adjust or flag. We'll review and follow up.">
        {formStatus==='success' ? <SuccessView/> : <>
          <div style={{marginBottom:14}}><label style={labelSt}>Type</label>
            <select style={inputSt} value={fbType} onChange={e=>setFbType(e.target.value)}>
              <option>Revision Request</option><option>General Feedback</option><option>Issue Report</option>
            </select></div>
          <div style={{marginBottom:14}}><label style={labelSt}>Description</label>
            <textarea style={{...inputSt,minHeight:100,lineHeight:1.65}} value={fbDesc} onChange={e=>setFbDesc(e.target.value)} placeholder="What would you like changed or flagged…"/></div>
          <div><label style={labelSt}>Attachment link (optional)</label>
            <input style={inputSt} value={fbLink} onChange={e=>setFbLink(e.target.value)} placeholder="Google Drive / Loom URL"/></div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button onClick={()=>setModal(null)} style={btnGhost}>Cancel</button>
            <button onClick={async()=>{if(!fbDesc)return;const ok=await post('/api/portal/feedback',{portal_token:portalToken,phase_name:fbPhase?.name,type:fbType,description:fbDesc,attachment:fbLink});if(ok){setFormStatus('success');setSuccessMsg('Feedback submitted. We\'ll be in touch.')}}} disabled={formStatus==='loading'} style={{...btnPrimary,flex:1,marginTop:0,opacity:formStatus==='loading'?.4:1}}>
              {formStatus==='loading'?'Submitting…':'Submit feedback'}
            </button>
          </div>
        </>}
      </BottomSheet>

      {/* EXPANSION SHEET */}
      <BottomSheet open={modal==='expansion'} onClose={()=>setModal(null)} eyebrow="Expansion" title="Request an Expansion" sub="Tell us what you need. We'll scope it and send a quote.">
        {formStatus==='success' ? <SuccessView/> : <>
          <div style={{marginBottom:14}}><label style={labelSt}>What do you need?</label>
            <textarea style={{...inputSt,minHeight:100,lineHeight:1.65}} value={expDesc} onChange={e=>setExpDesc(e.target.value)} placeholder="Describe the system or module you'd like added…"/></div>
          <div style={{marginBottom:14}}><label style={labelSt}>Area</label>
            <select style={inputSt} value={expArea} onChange={e=>setExpArea(e.target.value)}>
              {['Revenue','Operations','Marketing','Finance','Team','Retention','Sales','Other'].map(a=><option key={a}>{a}</option>)}
            </select></div>
          <div><label style={labelSt}>Urgency</label>
            <select style={inputSt} value={expUrg} onChange={e=>setExpUrg(e.target.value)}>
              <option>When possible</option><option>Within this month</option><option>Urgent</option>
            </select></div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button onClick={()=>setModal(null)} style={btnGhost}>Cancel</button>
            <button onClick={async()=>{if(!expDesc)return;const ok=await post('/api/portal/expansion',{portal_token:portalToken,description:expDesc,area:expArea,urgency:expUrg});if(ok){setFormStatus('success');setSuccessMsg('Request sent. Kai will follow up with a scope and quote.')}}} disabled={formStatus==='loading'} style={{...btnPrimary,flex:1,marginTop:0,opacity:formStatus==='loading'?.4:1}}>
              {formStatus==='loading'?'Sending…':'Send request'}
            </button>
          </div>
        </>}
      </BottomSheet>

      {/* MESSAGE SHEET */}
      <BottomSheet open={modal==='message'} onClose={()=>setModal(null)} eyebrow="Message" title="Message Opxio" sub="We respond within 1 business day.">
        {formStatus==='success' ? <SuccessView/> : <>
          <div style={{marginBottom:14}}><label style={labelSt}>Subject</label>
            <input style={inputSt} value={msgSubj} onChange={e=>setMsgSubj(e.target.value)} placeholder="What's this about?"/></div>
          <div><label style={labelSt}>Message</label>
            <textarea style={{...inputSt,minHeight:100,lineHeight:1.65}} value={msgBody} onChange={e=>setMsgBody(e.target.value)} placeholder="Write your message here…"/></div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button onClick={()=>setModal(null)} style={btnGhost}>Cancel</button>
            <button onClick={async()=>{if(!msgSubj||!msgBody)return;const ok=await post('/api/portal/message',{portal_token:portalToken,subject:msgSubj,message:msgBody});if(ok){setFormStatus('success');setSuccessMsg('Message sent. We respond within 1 business day.')}}} disabled={formStatus==='loading'} style={{...btnPrimary,flex:1,marginTop:0,opacity:formStatus==='loading'?.4:1}}>
              {formStatus==='loading'?'Sending…':'Send message'}
            </button>
          </div>
        </>}
      </BottomSheet>
    </>
  )
}
