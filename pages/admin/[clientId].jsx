// pages/admin/[clientId].jsx — Widget config editor
// Left: live config controls | Right: iframe preview (refreshes after save)
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getConfig } from '@/lib/configs'

const API = 'https://api.opxio.io/api/admin'

const SECTION_LABELS = {
  pipeline:   'Pipeline Stages',
  salesReps:  'Sales Reps',
  leadSources: 'Lead Sources',
  liveColumn: 'Live Column',
}

// ── Default config shape ──────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  eyebrow:     '',
  widgetTitle: 'CRM & Pipeline',
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
  sections: {
    pipeline:    true,
    salesReps:   true,
    leadSources: true,
    liveColumn:  true,
  },
  sectionOrder: ['pipeline', 'salesReps', 'leadSources', 'liveColumn'],
}

function mergeConfig(base, saved) {
  if (!saved) return { ...base }
  return {
    ...base,
    ...saved,
    stages:       saved.stages       || base.stages,
    terminology:  { ...base.terminology,  ...(saved.terminology  || {}) },
    sections:     { ...base.sections,     ...(saved.sections     || {}) },
    sectionOrder: saved.sectionOrder || base.sectionOrder,
  }
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ConfigEditor() {
  const router   = useRouter()
  const clientId = router.query.clientId
  const adminKey = router.query.adminKey || ''

  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [config,       setConfig]       = useState(DEFAULT_CONFIG)
  const [clientToken,  setClientToken]  = useState('')
  const [previewKey,   setPreviewKey]   = useState(0)
  const [dragIdx,      setDragIdx]      = useState(null)
  const [overIdx,      setOverIdx]      = useState(null)
  const [sdragIdx,     setSdragIdx]     = useState(null)
  const [soverIdx,     setSoverIdx]     = useState(null)

  // Load client + existing config
  useEffect(() => {
    if (!clientId || !adminKey) return
    async function load() {
      setLoading(true)
      try {
        // 1. Get client (for access_token + JS fallback config)
        const cr = await fetch(`${API}/clients?adminKey=${encodeURIComponent(adminKey)}`)
        const clients = cr.ok ? await cr.json() : []
        const client  = clients.find(c => c.slug === clientId)
        if (client) setClientToken(client.access_token || '')

        // 2. Get saved widget config from Supabase
        const wr = await fetch(`${API}/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`)
        const rows = wr.ok ? await wr.json() : []
        const saved = rows.find(r => r.widget_type === 'crm-pipeline')?.config || null

        // 3. Merge: JS fallback → saved Supabase overrides
        const jsConfig = getConfig(clientId)
        const base = { ...DEFAULT_CONFIG, ...{ eyebrow: jsConfig.eyebrow, widgetTitle: jsConfig.widgetTitle }, stages: jsConfig.stages || DEFAULT_CONFIG.stages }
        setConfig(mergeConfig(base, saved))
      } catch(e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId, adminKey])

  // ── Save ──────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true)
    setSaveMsg('')
    try {
      const r = await fetch(`${API}/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ widget_type: 'crm-pipeline', config }),
      })
      if (r.ok) {
        setSaveMsg('Saved')
        setPreviewKey(k => k + 1) // refresh iframe
        setTimeout(() => setSaveMsg(''), 3000)
      } else {
        setSaveMsg('Save failed')
      }
    } catch(e) {
      setSaveMsg('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Stage drag ────────────────────────────────────────────────────────
  function dropStages() {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) return
    const next = [...config.stages]
    const [item] = next.splice(dragIdx, 1)
    next.splice(overIdx, 0, item)
    setConfig(c => ({ ...c, stages: next }))
    setDragIdx(null); setOverIdx(null)
  }

  function updateStage(i, field, val) {
    const next = config.stages.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    setConfig(c => ({ ...c, stages: next }))
  }

  function addStage() {
    setConfig(c => ({ ...c, stages: [...c.stages, { key: 'New Stage', label: 'New Stage', color: '#6B7280' }] }))
  }

  function removeStage(i) {
    setConfig(c => ({ ...c, stages: c.stages.filter((_, idx) => idx !== i) }))
  }

  // ── Section order drag ────────────────────────────────────────────────
  function dropSections() {
    if (sdragIdx === null || soverIdx === null || sdragIdx === soverIdx) return
    const next = [...config.sectionOrder]
    const [item] = next.splice(sdragIdx, 1)
    next.splice(soverIdx, 0, item)
    setConfig(c => ({ ...c, sectionOrder: next }))
    setSdragIdx(null); setSoverIdx(null)
  }

  const previewUrl = clientToken
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
        <span style={{ color: '#444', fontSize: 12, fontFamily: 'monospace' }}>{clientId}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveMsg && <span style={{ fontSize: 12, color: saveMsg === 'Saved' ? '#C8FF00' : '#FF6B6B' }}>{saveMsg}</span>}
          <button style={S.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={S.loadingWrap}>Loading config…</div>
      ) : (
        <div style={S.body}>

          {/* ── Left: Config panel ────────────────────────────────── */}
          <div style={S.panel}>

            {/* Identity */}
            <Section title="Identity">
              <Field label="Eyebrow text">
                <input style={S.input} value={config.eyebrow}
                  onChange={e => setConfig(c => ({ ...c, eyebrow: e.target.value }))} />
              </Field>
              <Field label="Widget title">
                <input style={S.input} value={config.widgetTitle}
                  onChange={e => setConfig(c => ({ ...c, widgetTitle: e.target.value }))} />
              </Field>
            </Section>

            {/* Pipeline Stages */}
            <Section title="Pipeline Stages" action={<button style={S.addBtn} onClick={addStage}>+ Add stage</button>}>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>Drag to reorder</div>
              {config.stages.map((stage, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                  onDrop={dropStages}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{
                    ...S.dragRow,
                    opacity: dragIdx === i ? 0.4 : 1,
                    background: overIdx === i && dragIdx !== i ? '#1E2A00' : '#1A1A1A',
                    borderColor: overIdx === i && dragIdx !== i ? '#C8FF00' : '#252525',
                  }}
                >
                  <span style={S.dragHandle}>⠿</span>
                  <input
                    type="color"
                    value={stage.color}
                    onChange={e => updateStage(i, 'color', e.target.value)}
                    style={S.colorPicker}
                    title="Stage color"
                  />
                  <input
                    style={{ ...S.input, flex: 1, margin: 0 }}
                    value={stage.label}
                    onChange={e => { updateStage(i, 'label', e.target.value); updateStage(i, 'key', e.target.value) }}
                    placeholder="Stage name"
                  />
                  <button style={S.removeBtn} onClick={() => removeStage(i)}>×</button>
                </div>
              ))}
            </Section>

            {/* KPI Labels */}
            <Section title="KPI Labels">
              {Object.entries(config.terminology).map(([k, v]) => (
                <Field key={k} label={k}>
                  <input style={S.input} value={v}
                    onChange={e => setConfig(c => ({ ...c, terminology: { ...c.terminology, [k]: e.target.value } }))} />
                </Field>
              ))}
            </Section>

            {/* Sections */}
            <Section title="Sections">
              <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>Toggle visibility · Drag to reorder</div>
              {config.sectionOrder.map((key, i) => (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setSdragIdx(i)}
                  onDragOver={e => { e.preventDefault(); setSoverIdx(i) }}
                  onDrop={dropSections}
                  onDragEnd={() => { setSdragIdx(null); setSoverIdx(null) }}
                  style={{
                    ...S.dragRow,
                    opacity: sdragIdx === i ? 0.4 : 1,
                    background: soverIdx === i && sdragIdx !== i ? '#1E2A00' : '#1A1A1A',
                    borderColor: soverIdx === i && sdragIdx !== i ? '#C8FF00' : '#252525',
                  }}
                >
                  <span style={S.dragHandle}>⠿</span>
                  <span style={{ flex: 1, fontSize: 12, color: config.sections[key] ? '#fff' : '#555' }}>
                    {SECTION_LABELS[key] || key}
                  </span>
                  {key !== 'pipeline' && (
                    <button
                      style={{ ...S.toggleBtn, background: config.sections[key] ? '#C8FF00' : '#252525', color: config.sections[key] ? '#000' : '#555' }}
                      onClick={() => setConfig(c => ({ ...c, sections: { ...c.sections, [key]: !c.sections[key] } }))}
                    >
                      {config.sections[key] ? 'On' : 'Off'}
                    </button>
                  )}
                  {key === 'pipeline' && <span style={{ fontSize: 10, color: '#444' }}>always on</span>}
                </div>
              ))}
            </Section>

          </div>

          {/* ── Right: Preview iframe ─────────────────────────────── */}
          <div style={S.preview}>
            <div style={S.previewHdr}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#555' }}>
                Live Preview
              </span>
              <span style={{ fontSize: 10, color: '#444' }}>Refreshes after save</span>
            </div>
            {previewUrl ? (
              <iframe
                key={previewKey}
                src={previewUrl}
                style={S.iframe}
                title="Widget preview"
              />
            ) : (
              <div style={S.noPreview}>
                No access token — save client first
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1E1E1E' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#555' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 4, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  page:        { background: '#111', minHeight: '100vh', fontFamily: "'Satoshi', -apple-system, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' },
  topbar:      { padding: '12px 20px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  logo:        { fontSize: 18, fontWeight: 900, letterSpacing: '-.03em' },
  backBtn:     { background: 'transparent', border: '1px solid #252525', borderRadius: 7, padding: '5px 12px', color: '#666', fontSize: 11, cursor: 'pointer' },
  saveBtn:     { background: '#C8FF00', color: '#000', border: 'none', borderRadius: 7, padding: '7px 18px', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  loadingWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12 },
  body:        { flex: 1, display: 'grid', gridTemplateColumns: '360px 1fr', overflow: 'hidden' },
  panel:       { overflowY: 'auto', padding: 20, borderRight: '1px solid #1A1A1A' },
  input:       { background: '#1A1A1A', border: '1px solid #252525', borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  dragRow:     { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #252525', marginBottom: 6, cursor: 'grab', transition: 'background .1s, border-color .1s' },
  dragHandle:  { color: '#333', fontSize: 14, cursor: 'grab', flexShrink: 0 },
  colorPicker: { width: 28, height: 28, border: 'none', borderRadius: 6, padding: 0, cursor: 'pointer', background: 'transparent', flexShrink: 0 },
  removeBtn:   { background: 'transparent', border: 'none', color: '#444', fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  addBtn:      { background: 'transparent', border: '1px solid #252525', borderRadius: 6, padding: '4px 10px', color: '#666', fontSize: 11, cursor: 'pointer' },
  toggleBtn:   { border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  preview:     { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHdr:  { padding: '10px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  iframe:      { flex: 1, border: 'none', width: '100%', height: '100%' },
  noPreview:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12 },
}
