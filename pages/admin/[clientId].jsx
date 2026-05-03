// pages/admin/[clientId].jsx — Widget config editor with live preview
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter }  from 'next/router'
import dynamic        from 'next/dynamic'
import Head           from 'next/head'
import { getConfig }  from '@/lib/configs'
import { WIDGET_SECTIONS, DEFAULT_ENABLED_SECTIONS } from '@/lib/configs/sections-registry'

// Import CRMPipeline dynamically (client-side only — iframe guard uses window)
const CRMPipeline = dynamic(
  () => import('@/components/widgets/crm-pipeline/CRMPipeline'),
  { ssr: false }
)

const API    = 'https://api.opxio.io/api/admin'
const LS_KEY = 'opxio_admin_key'

const DEFAULT_CONFIG = {
  eyebrow:         '',
  widgetTitle:     'CRM & Pipeline',
  stages: [
    { key: 'New Lead',           label: 'New Lead',           color: '#6B7280' },
    { key: 'Quotation Sent',     label: 'Quotation Sent',     color: '#60A5FA' },
    { key: 'Negotiation',        label: 'Negotiation',        color: '#FBBF24' },
    { key: 'Sales Order Issued', label: 'Sales Order Issued', color: '#A78BFA' },
    { key: 'Closed Won',         label: 'Closed Won',         color: '#22C55E' },
    { key: 'Closed Lost',        label: 'Closed Lost',        color: '#FF6B6B' },
  ],
  terminology: {
    newLeads:   'New Leads',
    quotesSent: 'Quotations Sent',
    closedWon:  'Closed Won',
    closeRate:  'Close Rate',
  },
  enabledSections: DEFAULT_ENABLED_SECTIONS,
}

function mergeConfig(base, saved) {
  if (!saved) return { ...base }
  let enabledSections = saved.enabledSections
  if (!enabledSections && saved.sectionOrder) {
    enabledSections = saved.sectionOrder.filter(k => saved.sections?.[k] !== false)
    if (!enabledSections.includes('pipeline')) enabledSections.unshift('pipeline')
  }
  return {
    ...base, ...saved,
    stages:          saved.stages       || base.stages,
    terminology:     { ...base.terminology, ...(saved.terminology || {}) },
    enabledSections: enabledSections    || base.enabledSections,
  }
}

export default function ConfigEditor() {
  const router   = useRouter()
  const clientId = router.query.clientId
  const adminKey = router.query.adminKey || (typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : '') || ''

  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [saveMsg,     setSaveMsg]     = useState('')
  const [config,      setConfig]      = useState(DEFAULT_CONFIG)
  const [clientToken, setClientToken] = useState('')
  const [dragIdx,     setDragIdx]     = useState(null)
  const [overIdx,     setOverIdx]     = useState(null)
  const [dragSec,     setDragSec]     = useState(null)
  const [overSec,     setOverSec]     = useState(null)
  const [activeTab,   setActiveTab]   = useState('identity')

  const REGISTRY      = WIDGET_SECTIONS['crm-pipeline']?.registry || {}
  const SECTION_ORDER = WIDGET_SECTIONS['crm-pipeline']?.order    || []

  // ── Load client + saved config ──────────────────────────────────────────
  useEffect(() => {
    if (!clientId || !adminKey) return
    async function load() {
      setLoading(true)
      try {
        const cr      = await fetch(`${API}/clients?adminKey=${encodeURIComponent(adminKey)}`)
        const clients = cr.ok ? await cr.json() : []
        const client  = clients.find(c => c.slug === clientId)
        if (client) setClientToken(client.access_token || '')

        const wr   = await fetch(`${API}/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`)
        const rows = wr.ok ? await wr.json() : []
        const saved = rows.find(r => r.widget_type === 'crm-pipeline')?.config || null

        const jsConfig = getConfig(clientId)
        const base = {
          ...DEFAULT_CONFIG,
          eyebrow:     jsConfig.eyebrow     || DEFAULT_CONFIG.eyebrow,
          widgetTitle: jsConfig.widgetTitle || DEFAULT_CONFIG.widgetTitle,
          stages:      jsConfig.stages      || DEFAULT_CONFIG.stages,
          apiEndpoint: jsConfig.apiEndpoint || DEFAULT_CONFIG.apiEndpoint,
        }
        setConfig(mergeConfig(base, saved))
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [clientId, adminKey])

  // ── Save ────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true); setSaveMsg('')
    try {
      const r = await fetch(`${API}/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ widget_type: 'crm-pipeline', config }),
      })
      setSaveMsg(r.ok ? 'Saved ✓' : 'Save failed')
      if (r.ok) setTimeout(() => setSaveMsg(''), 3000)
    } catch { setSaveMsg('Error') }
    finally { setSaving(false) }
  }

  // ── Stage drag ──────────────────────────────────────────────────────────
  function dropStages() {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) return
    const next = [...config.stages]
    const [item] = next.splice(dragIdx, 1)
    next.splice(overIdx, 0, item)
    setConfig(c => ({ ...c, stages: next }))
    setDragIdx(null); setOverIdx(null)
  }
  function updateStage(i, field, val) {
    setConfig(c => ({ ...c, stages: c.stages.map((s, j) => j === i ? { ...s, [field]: val } : s) }))
  }

  // ── Section drag ────────────────────────────────────────────────────────
  function dropSection() {
    if (!dragSec || !overSec || dragSec === overSec) return
    const enabled = config.enabledSections
    const fi = enabled.indexOf(dragSec), ti = enabled.indexOf(overSec)
    if (fi === -1 || ti === -1) return
    const next = [...enabled]; next.splice(fi, 1); next.splice(ti, 0, dragSec)
    setConfig(c => ({ ...c, enabledSections: next }))
    setDragSec(null); setOverSec(null)
  }
  const addSection    = id => !config.enabledSections.includes(id) && setConfig(c => ({ ...c, enabledSections: [...c.enabledSections, id] }))
  const removeSection = id => !REGISTRY[id]?.always && setConfig(c => ({ ...c, enabledSections: c.enabledSections.filter(s => s !== id) }))

  const enabledSet         = new Set(config.enabledSections)
  const availableSections  = SECTION_ORDER.filter(id => !enabledSet.has(id))

  if (!clientId) return null

  // Preview config needs apiEndpoint
  const previewConfig = { ...config, apiEndpoint: config.apiEndpoint }

  return (
    <div style={S.page}>
      <Head><title>Config — {clientId} | Opxio Admin</title></Head>

      {/* Topbar */}
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={() => router.back()}>← Back</button>
        <span style={S.logo}>Opxio<span style={{ color: '#C8FF00' }}>.</span></span>
        <span style={{ color: '#444', fontSize: 12, fontFamily: 'monospace' }}>{clientId} · crm-pipeline</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveMsg && <span style={{ fontSize: 12, color: saveMsg.includes('✓') ? '#C8FF00' : '#FF6B6B' }}>{saveMsg}</span>}
          <button style={S.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      {loading ? (
        <div style={S.loadingWrap}>Loading config…</div>
      ) : (
        <div style={S.body}>

          {/* ── Left: Config panel ─────────────────────────── */}
          <div style={S.panel}>
            <div style={S.tabs}>
              {[['identity','Identity'],['stages','Stages'],['labels','Labels'],['sections','Sections']].map(([k,l]) => (
                <button key={k} style={{ ...S.tab, ...(activeTab === k ? S.tabActive : {}) }} onClick={() => setActiveTab(k)}>{l}</button>
              ))}
            </div>

            {/* Identity */}
            {activeTab === 'identity' && (
              <div style={S.tabContent}>
                <Field label="Eyebrow text">
                  <input style={S.input} value={config.eyebrow}
                    onChange={e => setConfig(c => ({ ...c, eyebrow: e.target.value }))} />
                </Field>
                <Field label="Widget title">
                  <input style={S.input} value={config.widgetTitle}
                    onChange={e => setConfig(c => ({ ...c, widgetTitle: e.target.value }))} />
                </Field>
              </div>
            )}

            {/* Stages */}
            {activeTab === 'stages' && (
              <div style={S.tabContent}>
                <div style={S.hint}>Drag to reorder · Edit display label · Color swatch = bar color</div>
                {config.stages.map((stage, i) => (
                  <div key={i} draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                    onDrop={dropStages}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                    style={{ ...S.dragRow, opacity: dragIdx===i?.4:1, background: overIdx===i&&dragIdx!==i?'#1E2A00':'#181818', borderColor: overIdx===i&&dragIdx!==i?'#C8FF00':'#222' }}
                  >
                    <span style={S.dragHandle}>⠿</span>
                    <input type="color" value={stage.color} onChange={e => updateStage(i,'color',e.target.value)} style={S.colorPicker} />
                    <input style={{ ...S.input, flex:1, margin:0, fontSize:12 }} value={stage.label}
                      onChange={e => updateStage(i,'label',e.target.value)} placeholder="Stage name" />
                    <button style={S.removeBtn} onClick={() => setConfig(c => ({ ...c, stages: c.stages.filter((_,j)=>j!==i) }))}>×</button>
                  </div>
                ))}
                <button style={S.addBtn} onClick={() => setConfig(c => ({ ...c, stages: [...c.stages, { key:'New Stage', label:'New Stage', color:'#6B7280' }] }))}>
                  + Add stage
                </button>
              </div>
            )}

            {/* Labels */}
            {activeTab === 'labels' && (
              <div style={S.tabContent}>
                <div style={S.hint}>Rename KPI labels to match the client's language</div>
                {Object.entries(config.terminology).map(([k,v]) => (
                  <Field key={k} label={k}>
                    <input style={S.input} value={v}
                      onChange={e => setConfig(c => ({ ...c, terminology: { ...c.terminology, [k]: e.target.value } }))} />
                  </Field>
                ))}
              </div>
            )}

            {/* Sections */}
            {activeTab === 'sections' && (
              <div style={S.tabContent}>
                <div style={S.secLabel}>Active — drag to reorder</div>
                <div style={{ marginBottom: 16 }}>
                  {config.enabledSections.map(id => {
                    const sec = REGISTRY[id]; if (!sec) return null
                    return (
                      <div key={id} draggable={!sec.always}
                        onDragStart={() => !sec.always && setDragSec(id)}
                        onDragOver={e => { e.preventDefault(); setOverSec(id) }}
                        onDrop={dropSection}
                        onDragEnd={() => { setDragSec(null); setOverSec(null) }}
                        style={{ ...S.secRow, opacity: dragSec===id?.4:1, borderColor: overSec===id&&dragSec!==id?'#C8FF00':'rgba(200,255,0,.2)', background: overSec===id&&dragSec!==id?'#1E2A00':'rgba(200,255,0,.04)', cursor: sec.always?'default':'grab' }}
                      >
                        {!sec.always && <span style={S.dragHandle}>⠿</span>}
                        {sec.always  && <span style={{ ...S.dragHandle, color:'transparent' }}>⠿</span>}
                        <span style={{ fontSize:15 }}>{sec.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={S.secName}>{sec.label}</div>
                          <div style={S.secDesc}>{sec.description}</div>
                        </div>
                        {sec.always
                          ? <span style={{ fontSize:10, color:'#C8FF00', fontWeight:700 }}>CORE</span>
                          : <button style={S.removeSecBtn} onClick={() => removeSection(id)}>Remove</button>}
                      </div>
                    )
                  })}
                </div>
                {availableSections.length > 0 && (
                  <>
                    <div style={S.secLabel}>Available — click to add</div>
                    {availableSections.map(id => {
                      const sec = REGISTRY[id]; if (!sec) return null
                      const locked = sec.status === 'coming-soon'
                      return (
                        <div key={id} style={{ ...S.secRow, opacity:locked?.4:1, cursor:locked?'default':'pointer' }}
                          onClick={() => !locked && addSection(id)}>
                          <span style={{ fontSize:15 }}>{sec.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ ...S.secName, color:locked?'#555':'#888' }}>{sec.label}</div>
                            <div style={S.secDesc}>{sec.description}</div>
                          </div>
                          {locked
                            ? <span style={{ fontSize:10, color:'#444', fontWeight:700 }}>SOON</span>
                            : <span style={{ fontSize:11, color:'#C8FF00' }}>+ Add</span>}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Live preview (inline React, updates instantly) ── */}
          <div style={S.preview}>
            <div style={S.previewHdr}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#555' }}>Live Preview</span>
              <span style={{ fontSize:10, color:'#444' }}>Updates as you edit · Save to persist</span>
            </div>
            <div style={S.previewBody}>
              {clientToken && previewConfig.apiEndpoint ? (
                <CRMPipeline
                  config={previewConfig}
                  token={clientToken}
                  bypass={true}
                />
              ) : (
                <div style={S.noPreview}>
                  {!clientToken ? 'No access token for this client' : 'No API endpoint configured'}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize:10, color:'#555', marginBottom:4, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

export async function getServerSideProps() { return { props: {} } }

const S = {
  page:        { background:'#111', minHeight:'100vh', fontFamily:"'Satoshi', -apple-system, sans-serif", color:'#fff', display:'flex', flexDirection:'column' },
  topbar:      { padding:'12px 20px', borderBottom:'1px solid #1A1A1A', display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  logo:        { fontSize:18, fontWeight:900, letterSpacing:'-.03em' },
  backBtn:     { background:'transparent', border:'1px solid #222', borderRadius:7, padding:'5px 12px', color:'#555', fontSize:11, cursor:'pointer' },
  saveBtn:     { background:'#C8FF00', color:'#000', border:'none', borderRadius:7, padding:'7px 18px', fontWeight:700, fontSize:12, cursor:'pointer' },
  loadingWrap: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#444', fontSize:12 },
  body:        { flex:1, display:'grid', gridTemplateColumns:'320px 1fr', overflow:'hidden', minHeight:0 },
  panel:       { overflowY:'auto', borderRight:'1px solid #1A1A1A', display:'flex', flexDirection:'column', minHeight:0 },
  tabs:        { display:'flex', borderBottom:'1px solid #1A1A1A', flexShrink:0 },
  tab:         { flex:1, padding:'10px 0', background:'transparent', border:'none', borderBottom:'2px solid transparent', color:'#555', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' },
  tabActive:   { color:'#C8FF00', borderBottomColor:'#C8FF00' },
  tabContent:  { padding:16, overflowY:'auto', flex:1 },
  hint:        { fontSize:10, color:'#444', marginBottom:12, lineHeight:1.5 },
  input:       { background:'#181818', border:'1px solid #222', borderRadius:7, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' },
  dragRow:     { display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'1px solid #222', marginBottom:6, cursor:'grab', transition:'background .1s, border-color .1s' },
  dragHandle:  { color:'#333', fontSize:14, cursor:'grab', flexShrink:0 },
  colorPicker: { width:26, height:26, border:'none', borderRadius:5, padding:0, cursor:'pointer', background:'transparent', flexShrink:0 },
  removeBtn:   { background:'transparent', border:'none', color:'#444', fontSize:16, cursor:'pointer', padding:'0 4px' },
  addBtn:      { background:'transparent', border:'1px solid #222', borderRadius:6, padding:'6px 12px', color:'#555', fontSize:11, cursor:'pointer' },
  secLabel:    { fontSize:9, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#444', marginBottom:8 },
  secRow:      { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, border:'1px solid #1E1E1E', marginBottom:6, background:'#161616', transition:'border-color .1s, background .1s' },
  secName:     { fontSize:12, fontWeight:600, color:'#ccc', marginBottom:1 },
  secDesc:     { fontSize:10, color:'#444', lineHeight:1.4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  removeSecBtn:{ background:'transparent', border:'1px solid #2A2A2A', borderRadius:5, padding:'3px 8px', color:'#555', fontSize:10, cursor:'pointer' },
  preview:     { display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 },
  previewHdr:  { padding:'10px 16px', borderBottom:'1px solid #1A1A1A', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 },
  previewBody: { flex:1, overflowY:'auto', minHeight:0 },
  noPreview:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#333', fontSize:12, height:'100%' },
}
