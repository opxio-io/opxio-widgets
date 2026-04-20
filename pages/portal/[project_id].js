import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ── Status config — matches catalogue pill logic ──────────────────────────
const STATUS = {
  'Build Started':    { bg:'rgba(170,255,0,.08)', border:'rgba(170,255,0,.2)',   color:'var(--g)' },
  'In Progress':      { bg:'rgba(170,255,0,.08)', border:'rgba(170,255,0,.2)',   color:'var(--g)' },
  'Complete':         { bg:'rgba(77,255,155,.07)',border:'rgba(77,255,155,.18)', color:'#4DFF9B' },
  'Completed':        { bg:'rgba(77,255,155,.07)',border:'rgba(77,255,155,.18)', color:'#4DFF9B' },
  'Done':             { bg:'rgba(77,255,155,.07)',border:'rgba(77,255,155,.18)', color:'#4DFF9B' },
  'Paid':             { bg:'rgba(77,255,155,.07)',border:'rgba(77,255,155,.18)', color:'#4DFF9B' },
  'Deposit Received': { bg:'rgba(77,255,155,.07)',border:'rgba(77,255,155,.18)', color:'#4DFF9B' },
  'Awaiting Payment': { bg:'rgba(255,154,60,.07)',border:'rgba(255,154,60,.2)',  color:'rgba(255,154,60,.9)' },
  'In Review':        { bg:'rgba(255,154,60,.07)',border:'rgba(255,154,60,.2)',  color:'rgba(255,154,60,.9)' },
  'Not Started':      { bg:'rgba(255,255,255,.04)',border:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.2)' },
  'Requested':        { bg:'rgba(170,255,0,.06)', border:'rgba(170,255,0,.15)',  color:'rgba(170,255,0,.6)' },
  'In Scope':         { bg:'rgba(170,255,0,.06)', border:'rgba(170,255,0,.15)',  color:'rgba(170,255,0,.6)' },
  'To Do':            { bg:'rgba(255,255,255,.03)',border:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.2)' },
}

function Pill({ status }) {
  const s = STATUS[status] || STATUS['Not Started']
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:5,
      fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:99,
      background:s.bg,border:`1px solid ${s.border}`,color:s.color,
      letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap'
    }}>
      <span style={{width:4,height:4,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>
      {status}
    </span>
  )
}

function SectionHeader({ title, count }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <div style={{width:3,height:14,borderRadius:2,background:'var(--g)',opacity:.5,flexShrink:0}}/>
      <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,.45)'}}>{title}</span>
      {count != null && (
        <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.25)',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.07)',borderRadius:99,padding:'1px 7px'}}>{count}</span>
      )}
      <div style={{flex:1,height:1,background:'rgba(255,255,255,.04)',marginLeft:4}}/>
    </div>
  )
}

function PhaseCard({ phase, tasks, onFeedback }) {
  const [open, setOpen] = useState(phase.status === 'In Progress')
  const locked = phase.status === 'Not Started'
  const done = (tasks||[]).filter(t=>t.status==='Done').length

  return (
    <div
      onClick={() => !locked && setOpen(o=>!o)}
      style={{
        background:'#111',border:'1px solid rgba(255,255,255,.06)',borderRadius:12,
        overflow:'hidden',cursor:locked?'default':'pointer',
        transition:'border-color .2s,transform .15s',
      }}
      onMouseEnter={e=>!locked&&(e.currentTarget.style.borderColor='rgba(255,255,255,.1)')}
      onMouseLeave={e=>!locked&&(e.currentTarget.style.borderColor='rgba(255,255,255,.06)')}
    >
      <div style={{padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'rgba(255,255,255,.15)',minWidth:20,flexShrink:0}}>
            {String(phase.order).padStart(2,'0')}
          </span>
          <span style={{
            fontSize:13,fontWeight:700,letterSpacing:'-.01em',
            color:locked?'rgba(255,255,255,.2)':'#fff',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
          }}>
            {phase.name}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          {tasks?.length > 0 && !locked && (
            <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.2)',letterSpacing:'.04em'}}>
              {done}/{tasks.length}
            </span>
          )}
          <Pill status={phase.status}/>
          {!locked && (
            <span style={{fontSize:8,color:'rgba(255,255,255,.2)',transition:'transform .2s',transform:open?'rotate(180deg)':'rotate(0)'}}>▼</span>
          )}
        </div>
      </div>

      {open && !locked && (
        <div style={{borderTop:'1px solid rgba(255,255,255,.04)',padding:'12px 18px 16px'}}>
          {(tasks||[]).map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.03)'}}>
              <div style={{
                width:14,height:14,borderRadius:4,flexShrink:0,
                border:`1.5px solid ${t.status==='Done'?'var(--g)':'rgba(255,255,255,.12)'}`,
                background:t.status==='Done'?'var(--g)':'transparent',
                display:'flex',alignItems:'center',justifyContent:'center'
              }}>
                {t.status==='Done'&&<svg width="7" height="5" viewBox="0 0 7 5" fill="none"><path d="M1 2.5L2.8 4.2L6 1" stroke="#000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {t.status==='In Progress'&&<div style={{width:4,height:4,borderRadius:'50%',background:'rgba(255,154,60,.8)'}}/>}
              </div>
              <span style={{
                fontSize:12,fontWeight:500,
                color:t.status==='Done'?'rgba(255,255,255,.2)':'rgba(255,255,255,.55)',
                textDecoration:t.status==='Done'?'line-through':'none',flex:1
              }}>{t.name}</span>
            </div>
          ))}
          {(phase.status==='In Progress'||phase.status==='Complete'||phase.status==='Done') && (
            <button
              onClick={e=>{e.stopPropagation();onFeedback(phase)}}
              style={{
                marginTop:12,fontSize:10,fontWeight:700,color:'rgba(170,255,0,.7)',
                background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.15)',
                padding:'5px 13px',borderRadius:7,cursor:'pointer',
                fontFamily:"'Satoshi',sans-serif",letterSpacing:'.02em',transition:'all .2s'
              }}
            >Submit feedback</button>
          )}
        </div>
      )}
    </div>
  )
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:200,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20
    }}>
      <div style={{
        background:'#111',border:'1px solid rgba(255,255,255,.08)',borderRadius:14,
        padding:'26px 24px 22px',width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto'
      }}>
        {children}
      </div>
    </div>
  )
}

const inputStyle = {
  width:'100%',background:'#1A1A1A',border:'1px solid rgba(255,255,255,.08)',
  borderRadius:8,padding:'10px 13px',fontSize:13,fontWeight:500,color:'#fff',
  outline:'none',fontFamily:"'Satoshi',sans-serif",transition:'border-color .2s'
}
const labelStyle = {
  display:'block',fontSize:9,fontWeight:700,letterSpacing:'.1em',
  textTransform:'uppercase',color:'rgba(255,255,255,.25)',marginBottom:6
}

export default function PortalProject() {
  const router = useRouter()
  const { project_id } = router.query

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [feedbackPhase, setFeedbackPhase] = useState(null)
  const [expansionOpen, setExpansionOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [formStatus, setFormStatus] = useState('idle')
  const [successMsg, setSuccessMsg] = useState('')

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
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [project_id])

  function resetForms() {
    setFeedbackPhase(null); setExpansionOpen(false); setMessageOpen(false)
    setFormStatus('idle'); setSuccessMsg('')
    setFbType('Revision Request'); setFbDesc(''); setFbLink('')
    setExpDesc(''); setExpArea('Revenue'); setExpUrgency('When possible')
    setMsgSubject(''); setMsgBody('')
  }

  async function post(endpoint, body) {
    setFormStatus('loading')
    try {
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      if (res.ok) return true
    } catch {}
    setFormStatus('error')
    return false
  }

  async function submitFeedback() {
    if (!fbDesc) return
    const ok = await post('/api/portal/feedback', { project_id, phase_name: feedbackPhase?.name, type: fbType, description: fbDesc, attachment: fbLink })
    if (ok) { setFormStatus('success'); setSuccessMsg('Feedback submitted. We\'ll review and get back to you shortly.') }
  }
  async function submitExpansion() {
    if (!expDesc) return
    const ok = await post('/api/portal/expansion', { project_id, description: expDesc, area: expArea, urgency: expUrgency })
    if (ok) { setFormStatus('success'); setSuccessMsg('Expansion request sent. Kai will be in touch to scope and quote this.') }
  }
  async function submitMessage() {
    if (!msgSubject || !msgBody) return
    const ok = await post('/api/portal/message', { project_id, subject: msgSubject, message: msgBody })
    if (ok) { setFormStatus('success'); setSuccessMsg('Message sent. We\'ll respond within 1 business day.') }
  }

  if (loading || !data) {
    return (
      <>
        <Head><link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet"/></Head>
        <div style={{minHeight:'100vh',background:'#0D0D0D',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#AAFF00',animation:'pulse 1.5s infinite'}}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.25)',fontFamily:"'Satoshi',sans-serif"}}>Loading</span>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </div>
      </>
    )
  }

  const { project, phases, tasks, invoices, expansions, company } = data
  const completedPhases = phases.filter(p=>['Complete','Completed','Done'].includes(p.status)).length
  const progressPct = phases.length ? Math.round((completedPhases/phases.length)*100) : 0
  const activePhase = phases.find(p=>p.status==='In Progress')

  const SuccessView = () => (
    <div style={{textAlign:'center',padding:'12px 0'}}>
      <div style={{
        width:40,height:40,borderRadius:'50%',background:'rgba(170,255,0,.08)',
        border:'1px solid rgba(170,255,0,.2)',display:'flex',alignItems:'center',
        justifyContent:'center',margin:'0 auto 14px',color:'var(--g)',fontSize:14,fontWeight:900
      }}>✓</div>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:'-.03em',marginBottom:8}}>{successMsg}</div>
      <button onClick={resetForms} style={{
        marginTop:18,background:'var(--g)',color:'#000',border:'none',
        padding:'10px 28px',borderRadius:8,fontSize:12,fontWeight:900,
        cursor:'pointer',fontFamily:"'Satoshi',sans-serif",letterSpacing:'.01em'
      }}>Done</button>
    </div>
  )

  return (
    <>
      <Head>
        <title>Opxio — {company?.name||'Client Portal'}</title>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet"/>
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{background:#0D0D0D;color:#fff;font-family:'Satoshi',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        :root{--g:#AAFF00;--gm:rgba(170,255,0,.08);--gb:rgba(170,255,0,.2)}
        select option{background:#1A1A1A;color:#fff}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        input:focus,textarea:focus,select:focus{border-color:rgba(170,255,0,.4)!important;outline:none}
      `}</style>

      {/* Topbar */}
      <div style={{
        background:'#0D0D0D',borderBottom:'1px solid rgba(255,255,255,.05)',
        height:52,display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 24px',position:'sticky',top:0,zIndex:100
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'var(--g)'}}/>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.35)'}}>
            Opxio
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {company?.name && (
            <span style={{
              fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',
              background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',
              padding:'3px 10px',borderRadius:99,letterSpacing:'.04em'
            }}>{company.name}</span>
          )}
          <button onClick={()=>{resetForms();setMessageOpen(true)}} style={{
            fontSize:10,fontWeight:700,color:'rgba(255,255,255,.35)',
            background:'#1A1A1A',border:'1px solid rgba(255,255,255,.08)',
            padding:'5px 11px',borderRadius:7,cursor:'pointer',
            fontFamily:"'Satoshi',sans-serif",transition:'all .2s',letterSpacing:'.02em'
          }}>Need help?</button>
        </div>
      </div>

      {/* Body */}
      <div style={{maxWidth:680,margin:'0 auto',padding:'36px 20px 80px'}}>

        {/* PROJECT OVERVIEW */}
        <div style={{marginBottom:40}}>
          <SectionHeader title="Project Overview"/>
          <div style={{background:'#111',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,padding:'22px 22px 20px'}}>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(170,255,0,.5)',marginBottom:6}}>
                {company?.name||''}
              </div>
              <div style={{fontSize:26,fontWeight:900,letterSpacing:'-.03em',color:'#fff',lineHeight:1.1,marginBottom:10}}>
                {project.name}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
              <Pill status={project.status||'In Progress'}/>
              {activePhase && <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.25)'}}>— {activePhase.name}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
              <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.25)'}}>Overall progress</span>
              <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.2)',letterSpacing:'.04em'}}>
                {completedPhases} / {phases.length} phases
              </span>
            </div>
            <div style={{background:'rgba(255,255,255,.06)',borderRadius:99,height:3,overflow:'hidden'}}>
              <div style={{background:'var(--g)',height:'100%',width:`${progressPct}%`,borderRadius:99,transition:'width .6s ease'}}/>
            </div>
            {project.target_date && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:18,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.04)'}}>
                <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.2)'}}>Targeted completion</span>
                <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.35)',letterSpacing:'.02em'}}>
                  {new Date(project.target_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PHASES */}
        <div style={{marginBottom:40}}>
          <SectionHeader title="Phases & Deliverables" count={phases.length}/>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {phases.map((phase,i)=>(
              <PhaseCard
                key={phase.id}
                phase={{...phase,order:i+1}}
                tasks={tasks.filter(t=>t.phase_id===phase.id)}
                onFeedback={p=>{resetForms();setFeedbackPhase(p)}}
              />
            ))}
          </div>
        </div>

        {/* INVOICES */}
        {invoices.length>0 && (
          <div style={{marginBottom:40}}>
            <SectionHeader title="Invoices" count={invoices.length}/>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {invoices.map(inv=>(
                <div key={inv.id} style={{
                  background:'#111',border:'1px solid rgba(255,255,255,.06)',
                  borderRadius:12,padding:'14px 18px',
                  display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'
                }}>
                  <div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'rgba(255,255,255,.2)',marginBottom:5}}>
                      {inv.number}
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.7)'}}>{inv.type}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <Pill status={inv.status}/>
                    <span style={{fontSize:14,fontWeight:900,letterSpacing:'-.02em',color:'#fff'}}>
                      MYR {inv.amount?.toLocaleString()}
                    </span>
                    <a
                      href={`/api/portal/download?type=${['Paid','Deposit Received'].includes(inv.status)?'receipt':'invoice'}&id=${inv.id}`}
                      target="_blank"
                      style={{
                        fontSize:10,fontWeight:700,color:'rgba(255,255,255,.35)',
                        background:'#1A1A1A',border:'1px solid rgba(255,255,255,.08)',
                        padding:'5px 11px',borderRadius:7,textDecoration:'none',
                        fontFamily:"'Satoshi',sans-serif",letterSpacing:'.02em',
                        transition:'all .2s'
                      }}
                    >↓ {['Paid','Deposit Received'].includes(inv.status)?'Receipt':'Invoice'}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPANSIONS */}
        <div style={{marginBottom:40}}>
          <SectionHeader title="Expansions" count={expansions.length||undefined}/>
          {expansions.length>0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10}}>
              {expansions.map(exp=>(
                <div key={exp.id} style={{
                  background:'#111',border:'1px solid rgba(255,255,255,.06)',
                  borderRadius:12,padding:'14px 18px',
                  display:'flex',alignItems:'center',justifyContent:'space-between',gap:12
                }}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.7)',marginBottom:4}}>{exp.name}</div>
                    {exp.target_date && (
                      <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.2)'}}>
                        Est. {new Date(exp.target_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                      </div>
                    )}
                  </div>
                  <Pill status={exp.status||'In Scope'}/>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={()=>{resetForms();setExpansionOpen(true)}}
            style={{
              width:'100%',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.2)',
              background:'transparent',border:'1px dashed rgba(255,255,255,.08)',
              padding:'13px',borderRadius:12,cursor:'pointer',
              fontFamily:"'Satoshi',sans-serif",letterSpacing:'.06em',
              textTransform:'uppercase',transition:'all .2s'
            }}
          >+ Request an Expansion</button>
        </div>

        <div style={{textAlign:'center',paddingTop:4}}>
          <button
            onClick={()=>{resetForms();setMessageOpen(true)}}
            style={{
              fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',
              background:'#1A1A1A',border:'1px solid rgba(255,255,255,.08)',
              padding:'8px 20px',borderRadius:99,cursor:'pointer',
              fontFamily:"'Satoshi',sans-serif",letterSpacing:'.06em',
              textTransform:'uppercase',transition:'all .2s'
            }}
          >Message Opxio</button>
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      <Modal open={!!feedbackPhase} onClose={resetForms}>
        {formStatus==='success' ? <SuccessView/> : (
          <>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(170,255,0,.5)',marginBottom:6}}>Feedback</div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:'-.02em',marginBottom:4}}>{feedbackPhase?.name}</div>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.2)',marginBottom:22}}>Tell us what to adjust or flag.</div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Type</label>
              <select style={inputStyle} value={fbType} onChange={e=>setFbType(e.target.value)}>
                <option>Revision Request</option><option>General Feedback</option><option>Issue Report</option>
              </select></div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle,minHeight:90,lineHeight:1.6}} value={fbDesc} onChange={e=>setFbDesc(e.target.value)} placeholder="What would you like changed or flagged…"/></div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Attachment link (optional)</label>
              <input style={inputStyle} value={fbLink} onChange={e=>setFbLink(e.target.value)} placeholder="Google Drive / Loom URL"/></div>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={resetForms} style={{padding:'10px 14px',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,background:'transparent',color:'rgba(255,255,255,.3)',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Satoshi',sans-serif",letterSpacing:'.02em'}}>Cancel</button>
              <button onClick={submitFeedback} disabled={formStatus==='loading'} style={{flex:1,background:'var(--g)',color:'#000',border:'none',borderRadius:8,padding:'10px',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:"'Satoshi',sans-serif",opacity:formStatus==='loading'?.4:1,letterSpacing:'.01em'}}>
                {formStatus==='loading'?'Submitting…':'Submit feedback'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* EXPANSION MODAL */}
      <Modal open={expansionOpen} onClose={resetForms}>
        {formStatus==='success' ? <SuccessView/> : (
          <>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(170,255,0,.5)',marginBottom:6}}>Expansion</div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:'-.02em',marginBottom:4}}>Request an Expansion</div>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.2)',marginBottom:22}}>Tell us what you need. We'll scope and quote it.</div>
            <div style={{marginBottom:14}}><label style={labelStyle}>What do you need?</label>
              <textarea style={{...inputStyle,minHeight:90,lineHeight:1.6}} value={expDesc} onChange={e=>setExpDesc(e.target.value)} placeholder="Describe the system or module you'd like added…"/></div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Area</label>
              <select style={inputStyle} value={expArea} onChange={e=>setExpArea(e.target.value)}>
                {['Revenue','Operations','Marketing','Finance','Team','Retention','Sales','Other'].map(a=><option key={a}>{a}</option>)}
              </select></div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Urgency</label>
              <select style={inputStyle} value={expUrgency} onChange={e=>setExpUrgency(e.target.value)}>
                <option>When possible</option><option>Within this month</option><option>Urgent</option>
              </select></div>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={resetForms} style={{padding:'10px 14px',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,background:'transparent',color:'rgba(255,255,255,.3)',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Satoshi',sans-serif"}}>Cancel</button>
              <button onClick={submitExpansion} disabled={formStatus==='loading'} style={{flex:1,background:'var(--g)',color:'#000',border:'none',borderRadius:8,padding:'10px',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:"'Satoshi',sans-serif",opacity:formStatus==='loading'?.4:1,letterSpacing:'.01em'}}>
                {formStatus==='loading'?'Sending…':'Send request'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* MESSAGE MODAL */}
      <Modal open={messageOpen} onClose={resetForms}>
        {formStatus==='success' ? <SuccessView/> : (
          <>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(170,255,0,.5)',marginBottom:6}}>Message</div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:'-.02em',marginBottom:4}}>Message Opxio</div>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.2)',marginBottom:22}}>We respond within 1 business day.</div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Subject</label>
              <input style={inputStyle} value={msgSubject} onChange={e=>setMsgSubject(e.target.value)} placeholder="What's this about?"/></div>
            <div style={{marginBottom:14}}><label style={labelStyle}>Message</label>
              <textarea style={{...inputStyle,minHeight:100,lineHeight:1.6}} value={msgBody} onChange={e=>setMsgBody(e.target.value)} placeholder="Write your message here…"/></div>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={resetForms} style={{padding:'10px 14px',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,background:'transparent',color:'rgba(255,255,255,.3)',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Satoshi',sans-serif"}}>Cancel</button>
              <button onClick={submitMessage} disabled={formStatus==='loading'} style={{flex:1,background:'var(--g)',color:'#000',border:'none',borderRadius:8,padding:'10px',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:"'Satoshi',sans-serif",opacity:formStatus==='loading'?.4:1,letterSpacing:'.01em'}}>
                {formStatus==='loading'?'Sending…':'Send message'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
