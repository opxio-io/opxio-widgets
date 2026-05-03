// pages/admin/[clientId].jsx — Advanced widget config editor
import { useState, useEffect, useRef } from 'react'
import { useRouter }  from 'next/router'
import dynamic        from 'next/dynamic'
import Head           from 'next/head'
import { getConfig }  from '@/lib/configs'
import { WIDGET_SECTIONS, DEFAULT_ENABLED_SECTIONS } from '@/lib/configs/sections-registry'
import { MOCK_CRM_DATA } from '@/lib/mock-data'

const CRMPipeline = dynamic(() => import('@/components/widgets/crm-pipeline/CRMPipeline'), { ssr: false })

const API    = 'https://api.opxio.io/api/admin'
const LS_KEY = 'opxio_admin_key'

const DEFAULT_CONFIG = {
  eyebrow: '', widgetTitle: 'CRM & Pipeline',
  stages: [
    { key: 'New Lead',           label: 'New Lead',           color: '#6B7280' },
    { key: 'Quotation Sent',     label: 'Quotation Sent',     color: '#60A5FA' },
    { key: 'Negotiation',        label: 'Negotiation',        color: '#FBBF24' },
    { key: 'Sales Order Issued', label: 'Sales Order Issued', color: '#A78BFA' },
    { key: 'Closed Won',         label: 'Closed Won',         color: '#22C55E' },
    { key: 'Closed Lost',        label: 'Closed Lost',        color: '#FF6B6B' },
  ],
  terminology: { newLeads: 'New Leads', quotesSent: 'Quotations Sent', closedWon: 'Closed Won', closeRate: 'Close Rate' },
  enabledSections: DEFAULT_ENABLED_SECTIONS,
}

function mergeConfig(base, saved) {
  if (!saved) return { ...base }
  let enabledSections = saved.enabledSections
  if (!enabledSections && saved.sectionOrder) {
    enabledSections = saved.sectionOrder.filter(k => saved.sections?.[k] !== false)
    if (!enabledSections.includes('pipeline')) enabledSections.unshift('pipeline')
  }
  return { ...base, ...saved, stages: saved.stages || base.stages,
    terminology: { ...base.terminology, ...(saved.terminology||{}) },
    enabledSections: enabledSections || base.enabledSections }
}

function fmtMonth(fm) {
  return new Date(fm.year, fm.month, 1).toLocaleString('default', { month: 'short', year: 'numeric' })
}
function prevFm(fm) { const d = new Date(fm.year, fm.month-1, 1); return { year: d.getFullYear(), month: d.getMonth() } }
function nextFm(fm) {
  const now = new Date(); const d = new Date(fm.year, fm.month+1, 1)
  if (d >= new Date(now.getFullYear(), now.getMonth(), 1)) return fm
  return { year: d.getFullYear(), month: d.getMonth() }
}

export default function ConfigEditor() {
  const router   = useRouter()
  const clientId = router.query.clientId
  const adminKey = router.query.adminKey || (typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : '') || ''

  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [dirty,       setDirty]       = useState(false)
  const [saveMsg,     setSaveMsg]     = useState('')
  const [config,      setConfig]      = useState(DEFAULT_CONFIG)
  const [clientToken, setClientToken] = useState('')
  const [dragIdx,     setDragIdx]     = useState(null)
  const [overIdx,     setOverIdx]     = useState(null)
  const [dragSec,     setDragSec]     = useState(null)
  const [overSec,     setOverSec]     = useState(null)
  const [mockMode,    setMockMode]    = useState(true)
  const [previewMonth,setPreviewMonth]= useState(() => {
    const d = new Date(); d.setMonth(d.getMonth()-1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const REGISTRY      = WIDGET_SECTIONS['crm-pipeline']?.registry || {}
  const SECTION_ORDER = WIDGET_SECTIONS['crm-pipeline']?.order    || []
  const isPreviewCurrent = (() => {
    const now = new Date()
    return previewMonth.year === now.getFullYear() && previewMonth.month === now.getMonth()
  })()

  function upd(fn) { setConfig(c => { const next = fn(c); return next }); setDirty(true) }

  useEffect(() => {
    if (!clientId || !adminKey) return
    async function load() {
      setLoading(true)
      try {
        const cr = await fetch(`${API}/clients?adminKey=${encodeURIComponent(adminKey)}`)
        const cs = cr.ok ? await cr.json() : []
        const cl = cs.find(c => c.slug === clientId)
        if (cl) setClientToken(cl.access_token || '')
        const wr   = await fetch(`${API}/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`)
        const rows = wr.ok ? await wr.json() : []
        const saved = rows.find(r => r.widget_type === 'crm-pipeline')?.config || null
        const js  = getConfig(clientId)
        const base = { ...DEFAULT_CONFIG, eyebrow: js.eyebrow||'', widgetTitle: js.widgetTitle||'CRM & Pipeline',
          stages: js.stages||DEFAULT_CONFIG.stages, apiEndpoint: js.apiEndpoint }
        setConfig(mergeConfig(base, saved))
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [clientId, adminKey])

  async function save() {
    setSaving(true); setSaveMsg('')
    try {
      const r = await fetch(`${API}/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ widget_type: 'crm-pipeline', config }),
      })
      if (r.ok) { setSaveMsg('Saved'); setDirty(false); setTimeout(() => setSaveMsg(''), 2500) }
      else setSaveMsg('Failed')
    } catch { setSaveMsg('Error') }
    finally { setSaving(false) }
  }

  // Stage drag
  function dropStages() {
    if (dragIdx===null||overIdx===null||dragIdx===overIdx) return
    const next=[...config.stages]; const [it]=next.splice(dragIdx,1); next.splice(overIdx,0,it)
    upd(c=>({...c,stages:next})); setDragIdx(null); setOverIdx(null)
  }

  // Section drag (within active)
  function dropSection() {
    if (!dragSec||!overSec||dragSec===overSec) return
    const es=[...config.enabledSections]
    const fi=es.indexOf(dragSec),ti=es.indexOf(overSec)
    if (fi===-1||ti===-1) return
    es.splice(fi,1); es.splice(ti,0,dragSec)
    upd(c=>({...c,enabledSections:es})); setDragSec(null); setOverSec(null)
  }

  const enabledSet        = new Set(config.enabledSections)
  const availableSections = SECTION_ORDER.filter(id => !enabledSet.has(id))

  if (!clientId) return null

  return (
    <div style={S.page}>
      <Head><title>{clientId} · Widget Config | Opxio</title></Head>

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <div style={S.breadcrumb}>
          <span style={S.breadSlug}>{clientId}</span>
          <span style={S.breadSep}>·</span>
          <span style={S.breadWidget}>crm-pipeline</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {dirty && !saveMsg && <span style={S.dirtyDot} title="Unsaved changes" />}
          {saveMsg && <span style={{ fontSize:11, fontWeight:600, color: saveMsg==='Saved'?'#C8FF00':'#FF6B6B' }}>{saveMsg}</span>}
          <button style={{ ...S.saveBtn, opacity: saving?0.6:1 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={S.loadingWrap}><div style={S.spinner}/><span style={{color:'#555',fontSize:12,marginTop:12}}>Loading config…</span></div>
      ) : (
        <div style={S.body}>

          {/* ── Left: Config (scrollable) ────────────────────────── */}
          <div style={S.configPanel}>

            {/* Identity */}
            <ConfigSection icon="◈" title="Identity">
              <div style={S.fieldRow}>
                <Label>Eyebrow</Label>
                <input style={S.input} value={config.eyebrow}
                  onChange={e => upd(c=>({...c,eyebrow:e.target.value}))} placeholder="e.g. SHIN SUPPLIES · CUPTERRA" />
              </div>
              <div style={S.fieldRow}>
                <Label>Widget title</Label>
                <input style={S.input} value={config.widgetTitle}
                  onChange={e => upd(c=>({...c,widgetTitle:e.target.value}))} />
              </div>
            </ConfigSection>

            {/* Pipeline Stages */}
            <ConfigSection icon="▤" title="Pipeline Stages" action={
              <button style={S.addStageBtn} onClick={() => upd(c=>({...c,stages:[...c.stages,{key:'New Stage',label:'New Stage',color:'#6B7280'}]}))}>
                + Stage
              </button>
            }>
              <div style={{fontSize:11,color:'#999',marginBottom:10}}>Drag ⠿ to reorder · Color swatch = bar color · Name is display only</div>
              {config.stages.map((st,i) => (
                <div key={i} draggable
                  onDragStart={()=>setDragIdx(i)} onDragOver={e=>{e.preventDefault();setOverIdx(i)}}
                  onDrop={dropStages} onDragEnd={()=>{setDragIdx(null);setOverIdx(null)}}
                  style={{...S.stageRow, opacity:dragIdx===i?.35:1, background:overIdx===i&&dragIdx!==i?'#1A2800':'#161616',
                    borderColor:overIdx===i&&dragIdx!==i?'#C8FF00':'#1E1E1E'}}>
                  <span style={S.handle}>⠿</span>
                  <label style={S.colorWrap} title="Click to change color">
                    <div style={{...S.colorDot, background:st.color}}/>
                    <input type="color" value={st.color}
                      onChange={e=>upd(c=>({...c,stages:c.stages.map((s,j)=>j===i?{...s,color:e.target.value}:s)}))}
                      style={S.hiddenColor}/>
                  </label>
                  <input style={{...S.input,flex:1,margin:0,height:34,padding:'0 10px',fontSize:13}}
                    value={st.label} onChange={e=>upd(c=>({...c,stages:c.stages.map((s,j)=>j===i?{...s,label:e.target.value}:s)}))}/>
                  <button style={S.removeStageBtn} onClick={()=>upd(c=>({...c,stages:c.stages.filter((_,j)=>j!==i)}))}>×</button>
                </div>
              ))}
            </ConfigSection>

            {/* KPI Labels */}
            <ConfigSection icon="◉" title="KPI Labels">
              <div style={{fontSize:11,color:'#999',marginBottom:10}}>Rename cards to match the client's language</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {Object.entries(config.terminology).map(([k,v])=>(
                  <div key={k}>
                    <Label>{k}</Label>
                    <input style={{...S.input,marginTop:4}} value={v}
                      onChange={e=>upd(c=>({...c,terminology:{...c.terminology,[k]:e.target.value}}))}/>
                  </div>
                ))}
              </div>
            </ConfigSection>

            {/* Sections */}
            <ConfigSection icon="⊞" title="Sections">
              <div style={{fontSize:11,color:'#999',marginBottom:12}}>Drag active sections to reorder · Click available to add</div>

              {/* Active */}
              <div style={S.secGroupLabel}>ACTIVE</div>
              {config.enabledSections.map(id=>{
                const sec=REGISTRY[id]; if(!sec) return null
                return (
                  <div key={id} draggable={!sec.always}
                    onDragStart={()=>!sec.always&&setDragSec(id)}
                    onDragOver={e=>{e.preventDefault();setOverSec(id)}}
                    onDrop={dropSection} onDragEnd={()=>{setDragSec(null);setOverSec(null)}}
                    style={{...S.secRow,...S.secActive, opacity:dragSec===id?.35:1,
                      borderColor:overSec===id&&dragSec!==id?'#C8FF00':'rgba(200,255,0,.15)',
                      background:overSec===id&&dragSec!==id?'#1A2800':'rgba(200,255,0,.03)',
                      cursor:sec.always?'default':'grab'}}>
                    <span style={{...S.handle,opacity:sec.always?0:1}}>⠿</span>
                    <span style={{fontSize:16,flexShrink:0}}>{sec.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={S.secName}>{sec.label}</div>
                      <div style={S.secDesc}>{sec.description}</div>
                    </div>
                    {sec.always
                      ? <span style={S.coreBadge}>CORE</span>
                      : <button style={S.removeSec} onClick={()=>upd(c=>({...c,enabledSections:c.enabledSections.filter(s=>s!==id)}))}>Remove</button>}
                  </div>
                )
              })}

              {/* Available */}
              {availableSections.length>0&&(
                <>
                  <div style={{...S.secGroupLabel,marginTop:16}}>AVAILABLE</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {availableSections.map(id=>{
                      const sec=REGISTRY[id]; if(!sec) return null
                      const locked=sec.status==='coming-soon'
                      return (
                        <div key={id} onClick={()=>!locked&&upd(c=>({...c,enabledSections:[...c.enabledSections,id]}))}
                          style={{...S.secCard, opacity:locked?.4:1, cursor:locked?'default':'pointer',
                            borderColor:locked?'#1A1A1A':'#252525'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:18}}>{sec.icon}</span>
                            {locked
                              ? <span style={S.soonBadge}>SOON</span>
                              : <span style={S.addBadge}>+ Add</span>}
                          </div>
                          <div style={{fontSize:11,fontWeight:600,color:locked?'#777':'#ccc',marginBottom:2}}>{sec.label}</div>
                          <div style={{fontSize:10,color:'#555',lineHeight:1.4}}>{sec.description}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </ConfigSection>

          </div>

          {/* ── Right: Live preview ──────────────────────────────── */}
          <div style={S.previewPanel}>
            {/* Preview topbar */}
            <div style={S.previewBar}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={S.liveDot}/>
                <span style={{fontSize:11,fontWeight:700,color:'#aaa',letterSpacing:'.08em',textTransform:'uppercase'}}>Live Preview</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
                <button
                  onClick={()=>setMockMode(m=>!m)}
                  style={{...S.mnBtn, padding:'0 12px', width:'auto', fontSize:10, fontWeight:700, letterSpacing:'.06em',
                    background: mockMode ? 'rgba(200,255,0,.12)' : 'transparent',
                    borderColor: mockMode ? 'rgba(200,255,0,.3)' : '#222',
                    color: mockMode ? '#C8FF00' : '#888'}}>
                  {mockMode ? '◉ MOCK' : '◎ LIVE'}
                </button>
                <div style={{width:1,height:16,background:'#222'}}/>
                <button style={S.mnBtn} onClick={()=>setPreviewMonth(fm=>prevFm(fm))}>‹</button>
                <span style={{fontSize:11,fontWeight:700,color:'#ccc',minWidth:70,textAlign:'center'}}>{fmtMonth(previewMonth)}</span>
                <button style={{...S.mnBtn,opacity:isPreviewCurrent?.3:1}} onClick={()=>setPreviewMonth(fm=>nextFm(fm))} disabled={isPreviewCurrent}>›</button>
              </div>
            </div>

            {/* Widget renders here — no extra padding, fills panel */}
            <div style={S.previewInner}>
              {clientToken && config.apiEndpoint ? (
                <CRMPipeline config={config} token={clientToken} bypass={true} defaultFilterMonth={mockMode ? null : previewMonth} mockData={mockMode ? MOCK_CRM_DATA : null} />
              ) : (
                <div style={S.noPreview}>No API endpoint configured for this client</div>
              )}
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        input[type=color]{display:block;width:100%;height:100%;opacity:0;position:absolute;top:0;left:0;cursor:pointer}
      `}</style>
    </div>
  )
}

function ConfigSection({ icon, title, children, action }) {
  return (
    <div style={{borderBottom:'1px solid #161616',padding:'20px 20px 24px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:13,color:'#C8FF00'}}>{icon}</span>
          <span style={{fontSize:13,fontWeight:700,letterSpacing:'.02em',color:'#fff'}}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <div style={{fontSize:11,color:'#bbb',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:5}}>{children}</div>
}

export async function getServerSideProps() { return { props: {} } }

const S = {
  page:          { background:'#0E0E0E', height:'100vh', display:'flex', flexDirection:'column', fontFamily:"'Satoshi',-apple-system,sans-serif", color:'#fff', overflow:'hidden' },
  topbar:        { display:'flex', alignItems:'center', gap:12, padding:'0 16px', height:48, borderBottom:'1px solid #171717', flexShrink:0 },
  backBtn:       { width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid #222', borderRadius:7, color:'#666', cursor:'pointer', flexShrink:0 },
  breadcrumb:    { display:'flex', alignItems:'center', gap:8 },
  breadSlug:     { fontSize:14, fontWeight:700, color:'#fff' },
  breadSep:      { color:'#333', fontSize:13 },
  breadWidget:   { fontSize:12, color:'#aaa', fontFamily:'monospace' },
  dirtyDot:      { width:7, height:7, borderRadius:'50%', background:'#C8FF00', animation:'pulse 2s infinite' },
  saveBtn:       { background:'#C8FF00', color:'#000', border:'none', borderRadius:7, padding:'7px 16px', fontWeight:700, fontSize:12, cursor:'pointer', letterSpacing:'.02em' },
  loadingWrap:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  spinner:       { width:24, height:24, border:'2px solid #222', borderTopColor:'#C8FF00', borderRadius:'50%', animation:'spin .7s linear infinite' },
  body:          { flex:1, display:'grid', gridTemplateColumns:'360px 1fr', minHeight:0, overflow:'hidden' },
  configPanel:   { overflowY:'auto', borderRight:'1px solid #171717' },
  fieldRow:      { marginBottom:12 },
  input:         { background:'#141414', border:'1px solid #1E1E1E', borderRadius:7, padding:'8px 12px', color:'#ddd', fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color .15s' },
  stageRow:      { display:'flex', alignItems:'center', gap:8, padding:'8px', borderRadius:8, border:'1px solid #1E1E1E', marginBottom:6, transition:'background .1s, border-color .1s', userSelect:'none' },
  handle:        { color:'#2A2A2A', fontSize:15, cursor:'grab', flexShrink:0, userSelect:'none' },
  colorWrap:     { position:'relative', cursor:'pointer', flexShrink:0 },
  colorDot:      { width:28, height:28, borderRadius:6, flexShrink:0, border:'2px solid rgba(255,255,255,.08)' },
  hiddenColor:   { position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer', padding:0, border:'none' },
  removeStageBtn:{ background:'transparent', border:'none', color:'#888', fontSize:18, cursor:'pointer', padding:'0 2px', lineHeight:1 },
  addStageBtn:   { background:'transparent', border:'1px solid #222', borderRadius:6, padding:'4px 10px', color:'#555', fontSize:11, cursor:'pointer' },
  secGroupLabel: { fontSize:10, fontWeight:700, letterSpacing:'.12em', color:'#888', marginBottom:8, textTransform:'uppercase' },
  secRow:        { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, border:'1px solid transparent', marginBottom:6, transition:'all .1s' },
  secActive:     { },
  secName:       { fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 },
  secDesc:       { fontSize:10, color:'#3A3A3A', lineHeight:1.4 },
  coreBadge:     { fontSize:10, fontWeight:700, letterSpacing:'.08em', color:'#C8FF00', background:'rgba(200,255,0,.08)', padding:'3px 8px', borderRadius:5, flexShrink:0 },
  removeSec:     { background:'transparent', border:'1px solid #252525', borderRadius:5, padding:'3px 8px', color:'#aaa', fontSize:11, cursor:'pointer', flexShrink:0 },
  secCard:       { background:'#141414', border:'1px solid #1E1E1E', borderRadius:9, padding:12, transition:'border-color .15s, background .15s' },
  soonBadge:     { fontSize:9, fontWeight:700, color:'#666', letterSpacing:'.08em' },
  addBadge:      { fontSize:10, fontWeight:700, color:'#C8FF00' },
  previewPanel:  { display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden', background:'#111' },
  previewBar:    { display:'flex', alignItems:'center', padding:'0 16px', height:44, borderBottom:'1px solid #171717', flexShrink:0, gap:10 },
  liveDot:       { width:6, height:6, borderRadius:'50%', background:'#C8FF00', animation:'pulse 2s infinite', flexShrink:0 },
  mnBtn:         { background:'transparent', border:'1px solid #222', borderRadius:5, color:'#888', fontSize:16, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', lineHeight:1 },
  previewInner:  { flex:1, overflowY:'auto', minHeight:0 },
  noPreview:     { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#333', fontSize:12 },
}
