import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ── Status pill config ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  'Build Started':   { bg: 'rgba(170,255,0,.1)',   border: 'rgba(170,255,0,.25)',   color: '#AAFF00' },
  'In Progress':     { bg: 'rgba(170,255,0,.1)',   border: 'rgba(170,255,0,.25)',   color: '#AAFF00' },
  'Awaiting Build':  { bg: 'rgba(255,184,77,.08)', border: 'rgba(255,184,77,.2)',   color: '#FFB84D' },
  'In Review':       { bg: 'rgba(255,184,77,.08)', border: 'rgba(255,184,77,.2)',   color: '#FFB84D' },
  'Complete':        { bg: 'rgba(77,255,155,.08)', border: 'rgba(77,255,155,.2)',   color: '#4DFF9B' },
  'Completed':       { bg: 'rgba(77,255,155,.08)', border: 'rgba(77,255,155,.2)',   color: '#4DFF9B' },
  'Done':            { bg: 'rgba(77,255,155,.08)', border: 'rgba(77,255,155,.2)',   color: '#4DFF9B' },
  'Paid':            { bg: 'rgba(77,255,155,.08)', border: 'rgba(77,255,155,.2)',   color: '#4DFF9B' },
  'Deposit Received':{ bg: 'rgba(77,255,155,.08)', border: 'rgba(77,255,155,.2)',   color: '#4DFF9B' },
  'Awaiting Payment':{ bg: 'rgba(255,184,77,.08)', border: 'rgba(255,184,77,.2)',   color: '#FFB84D' },
  'Not Started':     { bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.08)', color: '#333' },
  'Requested':       { bg: 'rgba(170,255,0,.08)',  border: 'rgba(170,255,0,.15)',   color: 'rgba(170,255,0,.7)' },
  'In Scope':        { bg: 'rgba(170,255,0,.08)',  border: 'rgba(170,255,0,.15)',   color: 'rgba(170,255,0,.7)' },
  'To Do':           { bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.06)', color: '#444' },
}

function Pill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Started']
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:5,
      fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:100,
      background:s.bg,border:`1px solid ${s.border}`,color:s.color,
      letterSpacing:'.02em',whiteSpace:'nowrap'
    }}>
      <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>
      {status}
    </span>
  )
}

// ── Inline form component ────────────────────────────────────────────────────
function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,.85)',
      zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24
    }}>
      <div style={{
        background:'#111',border:'1px solid #222',borderRadius:16,
        padding:'28px 28px 24px',width:'100%',maxWidth:480,
        maxHeight:'90vh',overflowY:'auto'
      }}>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#444',marginBottom:6}}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width:'100%',background:'#161616',border:'1px solid #222',borderRadius:9,
  padding:'10px 13px',fontSize:13,color:'#fff',outline:'none',
  fontFamily:"'DM Sans',sans-serif",transition:'border-color .15s'
}

// ── Phase card ────────────────────────────────────────────────────────────────
function PhaseCard({ phase, tasks, projectId, onFeedback }) {
  const [open, setOpen] = useState(phase.status === 'In Progress')
  const locked = phase.status === 'Not Started'

  const doneTasks = (tasks || []).filter(t => t.status === 'Done').length
  const totalTasks = (tasks || []).length

  return (
    <div style={{
      background:'#111',border:`1px solid ${locked ? '#161616' : '#1E1E1E'}`,
      borderRadius:12,overflow:'hidden',
      transition:'transform .15s',
      ...(locked ? {} : {cursor:'pointer'})
    }}>
      <div
        onClick={() => !locked && setOpen(o => !o)}
        style={{
          padding:'15px 20px',display:'flex',alignItems:'center',
          justifyContent:'space-between',gap:12
        }}
      >
        <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
          <span style={{fontSize:10,color:'#333',fontFamily:"'DM Sans',monospace",minWidth:22,flexShrink:0,letterSpacing:'.05em'}}>
            {String(phase.order).padStart(2,'0')}
          </span>
          <span style={{fontSize:13,fontWeight:600,color: locked ? '#333' : '#fff',letterSpacing:'-.01em'}}>
            {phase.name}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          {totalTasks > 0 && !locked && (
            <span style={{fontSize:10,color:'#444',fontFamily:"'DM Sans',monospace"}}>
              {doneTasks}/{totalTasks}
            </span>
          )}
          <Pill status={phase.status} />
          {!locked && (
            <span style={{fontSize:9,color:'#333',transition:'transform .2s',transform: open ? 'rotate(180deg)':'rotate(0deg)'}}>▼</span>
          )}
        </div>
      </div>

      {open && !locked && (
        <div style={{borderTop:'1px solid #1A1A1A',padding:'12px 20px 16px'}}>
          {(tasks || []).map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #141414'}}>
              <div style={{
                width:15,height:15,borderRadius:4,border:`1.5px solid ${t.status==='Done'?'#AAFF00':'#2A2A2A'}`,
                background:t.status==='Done'?'#AAFF00':'transparent',flexShrink:0,
                display:'flex',alignItems:'center',justifyContent:'center',position:'relative'
              }}>
                {t.status==='Done' && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {t.status==='In Progress' && (
                  <div style={{width:5,height:5,borderRadius:'50%',background:'#FFB84D'}}/>
                )}
              </div>
              <span style={{
                fontSize:12,color: t.status==='Done' ? '#3A3A3A' : '#888',
                textDecoration: t.status==='Done' ? 'line-through' : 'none',
                flex:1
              }}>{t.name}</span>
            </div>
          ))}
          {(phase.status === 'In Progress' || phase.status === 'Complete' || phase.status === 'Done') && (
            <button
              onClick={() => onFeedback(phase)}
              style={{
                marginTop:12,fontSize:11,color:'#AAFF00',background:'transparent',
                border:'1px solid rgba(170,255,0,.2)',padding:'5px 13px',
                borderRadius:8,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                fontWeight:600,transition:'all .15s'
              }}
            >
              Submit feedback on this phase
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main portal ───────────────────────────────────────────────────────────────
export default function PortalProject() {
  const router = useRouter()
  const { project_id } = router.query

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  // Form states
  const [feedbackForm, setFeedbackForm] = useState(null) // phase object
  const [expansionForm, setExpansionForm] = useState(false)
  const [messageForm, setMessageForm] = useState(false)
  const [formStatus, setFormStatus] = useState('idle')
  const [formSuccess, setFormSuccess] = useState('')

  // Form field state
  const [fbType, setFbType] = useState('Revision Request')
  const [fbDesc, setFbDesc] = useState('')
  const [fbLink, setFbLink] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expArea, setExpArea] = useState('Revenue')
  const [expUrgency, setExpUrgency] = useState('When possible')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')

  useEffect(() => {
    if (!project_id) return
    fetch(`/api/portal/data?project_id=${project_id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === 'unauthorized') { setDenied(true); setLoading(false); return }
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [project_id])

  if (denied) return null
  if (loading || !data) {
    return (
      <>
        <Head><link href="https://api.fontshare.com/v2/css?f[]=syne@700,800&f[]=dm-sans@400,500&display=swap" rel="stylesheet" /></Head>
        <div style={{minHeight:'100vh',background:'#0A0A0A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",color:'#333',fontSize:13}}>
          Loading…
        </div>
      </>
    )
  }

  const { project, phases, tasks, invoices, expansions, company } = data

  const completedPhases = phases.filter(p => p.status === 'Complete' || p.status === 'Done' || p.status === 'Completed').length
  const progressPct = phases.length ? Math.round((completedPhases / phases.length) * 100) : 0

  function resetForms() {
    setFeedbackForm(null); setExpansionForm(false); setMessageForm(false)
    setFormStatus('idle'); setFormSuccess('')
    setFbType('Revision Request'); setFbDesc(''); setFbLink('')
    setExpDesc(''); setExpArea('Revenue'); setExpUrgency('When possible')
    setMsgSubject(''); setMsgBody('')
  }

  async function submitFeedback() {
    if (!fbDesc) return
    setFormStatus('loading')
    const res = await fetch('/api/portal/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id, phase_name: feedbackForm?.name, type: fbType, description: fbDesc, attachment: fbLink }),
    })
    if (res.ok) { setFormStatus('success'); setFormSuccess('Feedback submitted. We\'ll review and get back to you shortly.') }
    else setFormStatus('error')
  }

  async function submitExpansion() {
    if (!expDesc) return
    setFormStatus('loading')
    const res = await fetch('/api/portal/expansion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id, description: expDesc, area: expArea, urgency: expUrgency }),
    })
    if (res.ok) { setFormStatus('success'); setFormSuccess('Expansion request sent. Kai will be in touch to scope and quote this for you.') }
    else setFormStatus('error')
  }

  async function submitMessage() {
    if (!msgSubject || !msgBody) return
    setFormStatus('loading')
    const res = await fetch('/api/portal/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id, subject: msgSubject, message: msgBody }),
    })
    if (res.ok) { setFormStatus('success'); setFormSuccess('Message sent. We\'ll respond within 1 business day.') }
    else setFormStatus('error')
  }

  const SuccessView = ({ msg }) => (
    <div style={{textAlign:'center',padding:'16px 0'}}>
      <div style={{
        width:40,height:40,borderRadius:'50%',
        background:'rgba(170,255,0,.1)',border:'1px solid rgba(170,255,0,.2)',
        display:'flex',alignItems:'center',justifyContent:'center',
        margin:'0 auto 14px',color:'#AAFF00',fontSize:16
      }}>✓</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,letterSpacing:'-.02em',marginBottom:8}}>{msg}</div>
      <button onClick={resetForms} style={{
        marginTop:20,background:'#AAFF00',color:'#000',border:'none',
        padding:'10px 28px',borderRadius:9,fontSize:13,fontWeight:700,
        cursor:'pointer',fontFamily:"'DM Sans',sans-serif"
      }}>Done</button>
    </div>
  )

  return (
    <>
      <Head>
        <title>Opxio — {company?.name || 'Client Portal'}</title>
        <link href="https://api.fontshare.com/v2/css?f[]=syne@700,800&f[]=dm-sans@400,500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{background:#0A0A0A;color:#fff;font-family:'DM Sans',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00;--gb:rgba(170,255,0,.2);--gm:rgba(170,255,0,.08)}
        select option{background:#1A1A1A;color:#fff}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.07);border-radius:99px}
      `}</style>

      {/* Header */}
      <div style={{
        background:'#0A0A0A',borderBottom:'1px solid #141414',
        height:54,display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 28px',position:'sticky',top:0,zIndex:100
      }}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,letterSpacing:'-.03em'}}>
          op<span style={{color:'#AAFF00'}}>x</span>io
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {company?.name && (
            <span style={{fontSize:11,color:'#444',background:'#111',border:'1px solid #1E1E1E',padding:'3px 11px',borderRadius:100}}>
              {company.name}
            </span>
          )}
          <button
            onClick={() => setMessageForm(true)}
            style={{
              fontSize:11,color:'#666',background:'transparent',border:'1px solid #1E1E1E',
              padding:'5px 13px',borderRadius:100,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
              transition:'all .15s'
            }}
          >
            Need help?
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{maxWidth:700,margin:'0 auto',padding:'40px 24px 80px'}}>

        {/* PROJECT OVERVIEW */}
        <div style={{marginBottom:44}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#333',marginBottom:14}}>Project Overview</div>
          <div style={{background:'#111',border:'1px solid #1E1E1E',borderRadius:14,padding:'24px 24px 20px'}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:'-.04em',marginBottom:10}}>
              {project.name}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22,flexWrap:'wrap'}}>
              <Pill status={project.status || 'In Progress'} />
              {completedPhases > 0 && (
                <span style={{fontSize:11,color:'#444'}}>Phase {completedPhases + 1} of {phases.length}</span>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
              <span style={{fontSize:12,color:'#555'}}>Overall progress</span>
              <span style={{fontSize:11,color:'#444',fontFamily:"'DM Sans',monospace",letterSpacing:'.02em'}}>
                {completedPhases} / {phases.length} phases
              </span>
            </div>
            <div style={{background:'#1A1A1A',borderRadius:100,height:3,overflow:'hidden'}}>
              <div style={{background:'#AAFF00',height:'100%',width:`${progressPct}%`,borderRadius:100,transition:'width .6s ease'}}/>
            </div>
            {project.target_date && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:18,paddingTop:18,borderTop:'1px solid #161616'}}>
                <span style={{fontSize:11,color:'#3A3A3A'}}>Targeted completion</span>
                <span style={{fontSize:12,color:'#888',fontFamily:"'DM Sans',monospace",letterSpacing:'.02em'}}>
                  {new Date(project.target_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PHASES */}
        <div style={{marginBottom:44}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#333',marginBottom:14}}>Phases & Deliverables</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {phases.map((phase, idx) => (
              <PhaseCard
                key={phase.id}
                phase={{...phase, order: idx + 1}}
                tasks={tasks.filter(t => t.phase_id === phase.id)}
                projectId={project_id}
                onFeedback={p => { resetForms(); setFeedbackForm(p) }}
              />
            ))}
          </div>
        </div>

        {/* INVOICES */}
        {invoices.length > 0 && (
          <div style={{marginBottom:44}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#333',marginBottom:14}}>Invoices</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {invoices.map(inv => (
                <div key={inv.id} style={{
                  background:'#111',border:'1px solid #1E1E1E',borderRadius:12,
                  padding:'14px 20px',display:'flex',alignItems:'center',
                  justifyContent:'space-between',gap:12,flexWrap:'wrap'
                }}>
                  <div>
                    <div style={{fontSize:10,color:'#3A3A3A',fontFamily:"'DM Sans',monospace",letterSpacing:'.04em',marginBottom:4}}>
                      {inv.number}
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:'#ccc'}}>{inv.type}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <Pill status={inv.status} />
                    <span style={{fontSize:13,fontWeight:700,color:'#fff',fontFamily:"'DM Sans',monospace"}}>
                      {inv.currency || 'MYR'} {inv.amount?.toLocaleString()}
                    </span>
                    <a
                      href={`/api/portal/download?type=${inv.status==='Paid'||inv.status==='Deposit Received'?'receipt':'invoice'}&id=${inv.id}`}
                      target="_blank"
                      style={{
                        fontSize:11,color:'#555',background:'transparent',
                        border:'1px solid #222',padding:'5px 12px',borderRadius:8,
                        textDecoration:'none',fontFamily:"'DM Sans',sans-serif",
                        transition:'all .15s'
                      }}
                    >
                      ↓ {inv.status==='Paid'||inv.status==='Deposit Received'?'Receipt':'Invoice'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPANSIONS */}
        <div style={{marginBottom:44}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#333',marginBottom:14}}>Expansions</div>
          {expansions.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10}}>
              {expansions.map(exp => (
                <div key={exp.id} style={{
                  background:'#111',border:'1px solid #1E1E1E',borderRadius:12,
                  padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12
                }}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#ccc',marginBottom:4}}>{exp.name}</div>
                    {exp.target_date && (
                      <div style={{fontSize:11,color:'#3A3A3A',fontFamily:"'DM Sans',monospace"}}>
                        Est. {new Date(exp.target_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                      </div>
                    )}
                  </div>
                  <Pill status={exp.status || 'In Scope'} />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => { resetForms(); setExpansionForm(true) }}
            style={{
              width:'100%',fontSize:12,color:'#444',background:'transparent',
              border:'1px dashed #1E1E1E',padding:'13px',borderRadius:12,
              cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500,
              transition:'all .15s'
            }}
          >
            + Request an Expansion
          </button>
        </div>

        {/* Bottom message CTA */}
        <div style={{textAlign:'center',paddingTop:8}}>
          <button
            onClick={() => { resetForms(); setMessageForm(true) }}
            style={{
              fontSize:12,color:'#555',background:'transparent',
              border:'1px solid #1E1E1E',padding:'10px 22px',
              borderRadius:100,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
              transition:'all .15s'
            }}
          >
            Message the Opxio team
          </button>
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      <Modal open={!!feedbackForm} onClose={resetForms}>
        {formStatus === 'success' ? <SuccessView msg={formSuccess} /> : (
          <>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,letterSpacing:'-.02em',marginBottom:4}}>Submit Feedback</div>
            <div style={{fontSize:12,color:'#444',marginBottom:22}}>Phase: {feedbackForm?.name}</div>
            <FormField label="Feedback type">
              <select style={{...inputStyle}} value={fbType} onChange={e=>setFbType(e.target.value)}>
                <option>Revision Request</option>
                <option>General Feedback</option>
                <option>Issue Report</option>
              </select>
            </FormField>
            <FormField label="Description">
              <textarea style={{...inputStyle,minHeight:90,lineHeight:1.6}} value={fbDesc} onChange={e=>setFbDesc(e.target.value)} placeholder="Describe what you'd like to change or flag…"/>
            </FormField>
            <FormField label="Attachment link (optional)">
              <input style={inputStyle} value={fbLink} onChange={e=>setFbLink(e.target.value)} placeholder="Google Drive / Loom URL"/>
            </FormField>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={resetForms} style={{padding:'10px 16px',border:'1px solid #222',borderRadius:9,background:'transparent',color:'#555',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              <button onClick={submitFeedback} disabled={formStatus==='loading'} style={{flex:1,background:'#AAFF00',color:'#000',border:'none',borderRadius:9,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:formStatus==='loading'?.5:1}}>
                {formStatus==='loading'?'Submitting…':'Submit feedback'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* EXPANSION MODAL */}
      <Modal open={expansionForm} onClose={resetForms}>
        {formStatus === 'success' ? <SuccessView msg={formSuccess} /> : (
          <>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,letterSpacing:'-.02em',marginBottom:4}}>Request an Expansion</div>
            <div style={{fontSize:12,color:'#444',marginBottom:22}}>Tell us what you need. We'll scope and quote it.</div>
            <FormField label="What do you need?">
              <textarea style={{...inputStyle,minHeight:90,lineHeight:1.6}} value={expDesc} onChange={e=>setExpDesc(e.target.value)} placeholder="Describe the system or module you'd like added…"/>
            </FormField>
            <FormField label="Which area?">
              <select style={inputStyle} value={expArea} onChange={e=>setExpArea(e.target.value)}>
                {['Revenue','Operations','Marketing','Finance','Team','Retention','Sales','Other'].map(a=><option key={a}>{a}</option>)}
              </select>
            </FormField>
            <FormField label="Urgency">
              <select style={inputStyle} value={expUrgency} onChange={e=>setExpUrgency(e.target.value)}>
                <option>When possible</option>
                <option>Within this month</option>
                <option>Urgent</option>
              </select>
            </FormField>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={resetForms} style={{padding:'10px 16px',border:'1px solid #222',borderRadius:9,background:'transparent',color:'#555',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              <button onClick={submitExpansion} disabled={formStatus==='loading'} style={{flex:1,background:'#AAFF00',color:'#000',border:'none',borderRadius:9,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:formStatus==='loading'?.5:1}}>
                {formStatus==='loading'?'Sending…':'Send request'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* MESSAGE MODAL */}
      <Modal open={messageForm} onClose={resetForms}>
        {formStatus === 'success' ? <SuccessView msg={formSuccess} /> : (
          <>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,letterSpacing:'-.02em',marginBottom:4}}>Message the Opxio team</div>
            <div style={{fontSize:12,color:'#444',marginBottom:22}}>We respond within 1 business day.</div>
            <FormField label="Subject">
              <input style={inputStyle} value={msgSubject} onChange={e=>setMsgSubject(e.target.value)} placeholder="What's this about?"/>
            </FormField>
            <FormField label="Message">
              <textarea style={{...inputStyle,minHeight:100,lineHeight:1.6}} value={msgBody} onChange={e=>setMsgBody(e.target.value)} placeholder="Write your message here…"/>
            </FormField>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={resetForms} style={{padding:'10px 16px',border:'1px solid #222',borderRadius:9,background:'transparent',color:'#555',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              <button onClick={submitMessage} disabled={formStatus==='loading'} style={{flex:1,background:'#AAFF00',color:'#000',border:'none',borderRadius:9,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:formStatus==='loading'?.5:1}}>
                {formStatus==='loading'?'Sending…':'Send message'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
