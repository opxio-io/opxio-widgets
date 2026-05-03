// pages/admin/[clientId].jsx — Widget config editor
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getConfig } from '@/lib/configs'
import { WIDGET_SECTIONS, DEFAULT_ENABLED_SECTIONS } from '@/lib/configs/sections-registry'

const API = 'https://api.opxio.io/api/admin'

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
  // Migrate old format (sections object + sectionOrder array) to new enabledSections array
  let enabledSections = saved.enabledSections
  if (!enabledSections && saved.sectionOrder) {
    enabledSections = saved.sectionOrder.filter(k => saved.sections?.[k] !== false)
    if (!enabledSections.includes('pipeline')) enabledSections.unshift('pipeline')
  }
  return {
    ...base,
    ...saved,
    stages:          saved.stages          || base.stages,
    terminology:     { ...base.terminology, ...(saved.terminology || {}) },
    enabledSections: enabledSections       || base.enabledSections,
  }
}

export default function ConfigEditor() {
  const router   = useRouter()
  const clientId = router.query.clientId
  const adminKey = router.query.adminKey || ''

  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [saveMsg,     setSaveMsg]     = useState('')
  const [config,      setConfig]      = useState(DEFAULT_CONFIG)
  const [clientToken, setClientToken] = useState('')
  const [previewKey,  setPreviewKey]  = useState(0)
  const [dragIdx,     setDragIdx]     = useState(null)  // stage drag
  const [overIdx,     setOverIdx]     = useState(null)
  const [dragSec,     setDragSec]     = useState(null)  // section drag (id being dragged)
  const [overSec,     setOverSec]     = useState(null)  // section drag over (id)
  const [activeTab,   setActiveTab]   = useState('identity') // identity | stages | labels | sections

  const REGISTRY = WIDGET_SECTIONS['crm-pipeline']?.registry || {}
  const SECTION_ORDER = WIDGET_SECTIONS['crm-pipeline']?.order || []

  useEffect(() => {
    if (!clientId || !adminKey) return
    async function load() {
      setLoading(true)
      try {
        const cr = await fetch(`${API}/clients?adminKey=${encodeURIComponent(adminKey)}`)
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
        }
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ widget_type: 'crm-pipeline', config }),
      })
      if (r.ok) { setSaveMsg('Saved ✓'); setPreviewKey(k => k + 1); setTimeout(() => setSaveMsg(''), 3000) }
      else setSaveMsg('Save failed')
    } catch(e) { setSaveMsg('Error') }
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
    setConfig(c => ({ ...c, stages: c.stages.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }))
  }

  // ── Section drag (within active list) ──────────────────────────────────
  function dropSection() {
    if (!dragSec || !overSec || dragSec === overSec) return
    const enabled = config.enabledSections
    const fromIdx = enabled.indexOf(dragSec)
    const toIdx   = enabled.indexOf(overSec)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...enabled]
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, dragSec)
    setConfig(c => ({ ...c, enabledSections: next }))
    setDragSec(null); setOverSec(null)
  }

  function addSection(id) {
    if (config.enabledSections.includes(id)) return
    setConfig(c => ({ ...c, enabledSections: [...c.enabledSections, id] }))
  }

  function removeSection(id) {
    if (REGISTRY[id]?.always) return // pipeline is locked
    setConfig(c => ({ ...c, enabledSections: c.enabledSections.filter(s => s !== id) }))
  }

  const enabledSet  = new Set(config.enabledSections)
  const availableSections = SECTION_ORDER.filter(id => !enabledSet.has(id))
  const previewUrl  = clientToken
    ? `https://widgets.opxio.io/r/${clientId}/crm-pipeline?token=${clientToken}&v=${previewKey}`
    : null

  if (!clientId) return null

  return (
    <div style={S.page}>
      <Head><title>Config — {clientId} | Opxio Admin</title></Head>

      {/* Topbar */}
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={() => router.push(`/admin?adminKey=${encodeURIComponent(adminKey)}`)}>← Back</button>
        <span style={S.logo}>Opxio<span style={{ color: '#C8FF00' }}>.</span></span>
        <span style={{ color: '#444', fontSize: 12, fontFamily: 'monospace' }}>{clientId} · crm-pipeline</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveMsg && <span style={{ fontSize: 12, color: saveMsg.includes('✓') ? '#C8FF00' : '#FF6B6B' }}>{saveMsg}</span>}
          <button style={S.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      {loading ? (
        <div style={S.loadingWrap}>Loading config…</div>
      ) : (
        <div style={S.body}>

          {/* ── Left: Config panel ───────────────────────── */}
          <div style={S.panel}>
            {/* Tab nav */}
            <div style={S.tabs}>
              {[['identity','Identity'],['stages','Stages'],['labels','KPI Labels'],['sections','Sections']].map(([k,l]) => (
                <button key={k} style={{ ...S.tab, ...(activeTab === k ? S.tabActive : {}) }} onClick={() => setActiveTab(k)}>{l}</button>
              ))}
            </div>

            {/* ── Identity tab ── */}
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

            {/* ── Stages tab ── */}
            {activeTab === 'stages' && (
              <div style={S.tabContent}>
                <div style={S.hint}>Drag to reorder · Edit display label · Color = bar color</div>
                <div style={{ marginBottom: 10 }}>
                  {config.stages.map((stage, i) => (
                    <div
                      key={i} draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                      onDrop={dropStages}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                      style={{ ...S.dragRow, opacity: dragIdx === i ? .4 : 1, background: overIdx === i && dragIdx !== i ? '#1E2A00' : '#181818', borderColor: overIdx === i && dragIdx !== i ? '#C8FF00' : '#222' }}
                    >
                      <span style={S.dragHandle}>⠿</span>
                      <input type="color" value={stage.color}
                        onChange={e => updateStage(i, 'color', e.target.value)}
                        style={S.colorPicker} />
                      <input style={{ ...S.input, flex: 1, margin: 0, fontSize: 12 }}
                        value={stage.label}
                        onChange={e => updateStage(i, 'label', e.target.value)}
                        placeholder="Stage display name" />
                      {!REGISTRY['pipeline']?.always && (
                        <button style={S.removeBtn} onClick={() => setConfig(c => ({ ...c, stages: c.stages.filter((_,j) => j !== i) }))}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button style={S.addBtn} onClick={() => setConfig(c => ({ ...c, stages: [...c.stages, { key: 'New Stage', label: 'New Stage', color: '#6B7280' }] }))}>
                  + Add stage
                </button>
                <div style={{ marginTop: 10, fontSize: 10, color: '#444' }}>
                  Note: stage labels are display-only. The key must match the exact Notion status name.
                </div>
              </div>
            )}

            {/* ── KPI Labels tab ── */}
            {activeTab === 'labels' && (
              <div style={S.tabContent}>
                <div style={S.hint}>Rename KPI cards to match the client's language</div>
                {Object.entries(config.terminology).map(([k, v]) => (
                  <Field key={k} label={k}>
                    <input style={S.input} value={v}
                      onChange={e => setConfig(c => ({ ...c, terminology: { ...c.terminology, [k]: e.target.value } }))} />
                  </Field>
                ))}
              </div>
            )}

            {/* ── Sections tab ── */}
            {activeTab === 'sections' && (
              <div style={S.tabContent}>
                {/* Active sections */}
                <div style={S.secLabel}>Active — drag to reorder</div>
                <div style={{ marginBottom: 16 }}>
                  {config.enabledSections.map(id => {
                    const sec = REGISTRY[id]
                    if (!sec) return null
                    return (
                      <div
                        key={id} draggable={!sec.always}
                        onDragStart={() => !sec.always && setDragSec(id)}
                        onDragOver={e => { e.preventDefault(); setOverSec(id) }}
                        onDrop={dropSection}
                        onDragEnd={() => { setDragSec(null); setOverSec(null) }}
                        style={{
                          ...S.secRow, ...S.secActive,
                          opacity: dragSec === id ? .4 : 1,
                          borderColor: overSec === id && dragSec !== id ? '#C8FF00' : 'rgba(200,255,0,.2)',
                          background: overSec === id && dragSec !== id ? '#1E2A00' : 'rgba(200,255,0,.04)',
                          cursor: sec.always ? 'default' : 'grab',
                        }}
                      >
                        {!sec.always && <span style={S.dragHandle}>⠿</span>}
                        {sec.always  && <span style={{ ...S.dragHandle, color: 'transparent' }}>⠿</span>}
                        <span style={{ fontSize: 15 }}>{sec.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.secName}>{sec.label}</div>
                          <div style={S.secDesc}>{sec.description}</div>
                        </div>
                        {sec.always
                          ? <span style={{ fontSize: 10, color: '#C8FF00', fontWeight: 700 }}>CORE</span>
                          : <button style={S.removeSecBtn} onClick={() => removeSection(id)}>Remove</button>
                        }
                      </div>
                    )
                  })}
                </div>

                {/* Available sections */}
                {availableSections.length > 0 && (
                  <>
                    <div style={S.secLabel}>Available — click to add</div>
                    {availableSections.map(id => {
                      const sec = REGISTRY[id]
                      if (!sec) return null
                      const locked = sec.status === 'coming-soon'
                      return (
                        <div
                          key={id}
                          style={{ ...S.secRow, opacity: locked ? .4 : 1, cursor: locked ? 'default' : 'pointer' }}
                          onClick={() => !locked && addSection(id)}
                        >
                          <span style={{ fontSize: 15 }}>{sec.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ ...S.secName, color: locked ? '#555' : '#888' }}>{sec.label}</div>
                            <div style={S.secDesc}>{sec.description}</div>
                          </div>
                          {locked
                            ? <span style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>SOON</span>
                            : <span style={{ fontSize: 11, color: '#C8FF00' }}>+ Add</span>
                          }
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Preview ────────────────────────────── */}
          <div style={S.preview}>
            <div style={S.previewHdr}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#555' }}>Live Preview</span>
              <span style={{ fontSize: 10, color: '#444' }}>Refreshes after Save</span>
            </div>
            {previewUrl ? (
              <iframe key={previewKey} src={previewUrl} style={S.iframe} title="Widget preview" />
            ) : (
              <div style={S.noPreview}>No access token found for this client</div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 4, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

export async function getServerSideProps() { return { props: {} } }

const S = {
  page:        { background: '#111', minHeight: '100vh', fontFamily: "'Satoshi', -apple-system, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' },
  topbar:      { padding: '12px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  logo:        { fontSize: 18, fontWeight: 900, letterSpacing: '-.03em' },
  backBtn:     { background: 'transparent', border: '1px solid #222', borderRadius: 7, padding: '5px 12px', color: '#555', fontSize: 11, cursor: 'pointer' },
  saveBtn:     { background: '#C8FF00', color: '#000', border: 'none', borderRadius: 7, padding: '7px 18px', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  loadingWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12 },
  body:        { flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden' },
  panel:       { overflowY: 'auto', borderRight: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column' },
  tabs:        { display: 'flex', borderBottom: '1px solid #1A1A1A', flexShrink: 0 },
  tab:         { flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: '#555', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '.04em', textTransform: 'uppercase' },
  tabActive:   { color: '#C8FF00', borderBottom: '2px solid #C8FF00' },
  tabContent:  { padding: 16, overflowY: 'auto' },
  hint:        { fontSize: 10, color: '#444', marginBottom: 12 },
  input:       { background: '#181818', border: '1px solid #222', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  dragRow:     { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid #222', marginBottom: 6, cursor: 'grab', transition: 'background .1s, border-color .1s' },
  dragHandle:  { color: '#333', fontSize: 14, cursor: 'grab', flexShrink: 0 },
  colorPicker: { width: 26, height: 26, border: 'none', borderRadius: 5, padding: 0, cursor: 'pointer', background: 'transparent', flexShrink: 0 },
  removeBtn:   { background: 'transparent', border: 'none', color: '#444', fontSize: 16, cursor: 'pointer', padding: '0 4px' },
  addBtn:      { background: 'transparent', border: '1px solid #222', borderRadius: 6, padding: '6px 12px', color: '#555', fontSize: 11, cursor: 'pointer' },
  secLabel:    { fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#444', marginBottom: 8 },
  secRow:      { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid #1E1E1E', marginBottom: 6, background: '#161616', transition: 'border-color .1s, background .1s' },
  secActive:   { },
  secName:     { fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 1 },
  secDesc:     { fontSize: 10, color: '#444', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  removeSecBtn:{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 5, padding: '3px 8px', color: '#555', fontSize: 10, cursor: 'pointer' },
  preview:     { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHdr:  { padding: '10px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  iframe:      { flex: 1, border: 'none', width: '100%', height: '100%' },
  noPreview:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12 },
}
