// pages/proposals/[id].jsx
// Proposal editor — app.opxio.io/proposals/[id]

import { useState, useEffect, useRef, useCallback } from "react"
import Head from "next/head"
import { useRouter } from "next/router"

const OS_OPTIONS = [
  "Revenue OS", "Operations OS", "Marketing OS", "Finance OS",
  "Business OS", "Agency OS", "Team OS", "Retention OS", "Sales OS",
  "Starter OS", "Intelligence OS",
]

const RETAINER_OPTIONS = [
  { value: "maintenance", label: "Maintenance — RM 400/mo" },
  { value: "hosting",     label: "Hosting Only — RM 150/mo" },
  { value: "active",      label: "Active Retainer — RM 900/mo" },
]

const BLOCK_TYPES = [
  { value: "paragraph",         label: "¶  Para" },
  { value: "heading_1",         label: "H1" },
  { value: "heading_2",         label: "H2" },
  { value: "bulleted_list_item",label: "•  Bullet" },
]

// ─── Global styles (catalogue widget aesthetic) ──────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; }
  body {
    font-family: 'Satoshi', -apple-system, sans-serif;
    background: #0D0D0D;
    color: rgba(255,255,255,.87);
    -webkit-font-smoothing: antialiased;
  }
  :root { --g: #AAFF00; --gm: rgba(170,255,0,.08); --gb: rgba(170,255,0,.2); }
  input, textarea, select { font-family: inherit; }
  select option { background: #1A1A1A; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.3); cursor: pointer; }

  /* Scrollbar — same as catalogue */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.15); }

  /* Input/textarea/select — catalogue .d-edit-input */
  .f-input, .f-textarea, .f-select {
    width: 100%;
    background: #1A1A1A;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    padding: 8px 11px;
    outline: none;
    transition: border-color .2s;
    box-sizing: border-box;
  }
  .f-input::placeholder, .f-textarea::placeholder { color: rgba(255,255,255,.2); }
  .f-input:focus, .f-textarea:focus, .f-select:focus { border-color: rgba(170,255,0,.4); }
  .f-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  .f-select { cursor: pointer; }
  .f-input:disabled { color: rgba(255,255,255,.2); cursor: not-allowed; }
  input[type="date"].f-input { color: rgba(255,255,255,.6); }

  /* Pill button for block type selector */
  .block-type-sel {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 7px;
    color: rgba(255,255,255,.4);
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 9px;
    outline: none;
    cursor: pointer;
    flex-shrink: 0;
    width: 90px;
    transition: border-color .2s;
  }
  .block-type-sel:focus { border-color: rgba(170,255,0,.3); }
`

// ─── Section card wrapper ────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: "#111",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 12,
      padding: "18px 20px",
      marginBottom: 10,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Section header — catalogue .section-hdr style ───────────────────────────
function SectionHdr({ label, color = "#AAFF00" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.04)", marginLeft: 4 }} />
    </div>
  )
}

// ─── Field wrapper ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

// ─── Readonly row — catalogue .d-about-row style ─────────────────────────────
function ReadonlyRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "rgba(255,255,255,.18)", whiteSpace: "nowrap", paddingTop: 2, minWidth: 60 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>
        {value || "—"}
      </span>
    </div>
  )
}

// ─── Save indicator ──────────────────────────────────────────────────────────
function SaveDot({ status }) {
  const colors = { saving: "#AAFF00", saved: "#AAFF00", error: "#FF4444", idle: "transparent" }
  const labels = { saving: "Saving…", saved: "Saved", error: "Failed", idle: "" }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: status === "idle" ? 0 : 1, transition: "opacity .3s" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors[status] || "transparent", animation: status === "saving" ? "pulse 1.2s infinite" : "none" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: colors[status] || "transparent", letterSpacing: ".05em" }}>
        {labels[status] || ""}
      </span>
    </div>
  )
}

// ─── Main editor component ───────────────────────────────────────────────────
export default function ProposalEditor() {
  const router = useRouter()
  const { id } = router.query

  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saveStatus,  setSaveStatus]  = useState("idle")
  const [previewKey,  setPreviewKey]  = useState(0)
  const [exporting,   setExporting]   = useState(false)

  // Editable fields
  const [situation,      setSituation]      = useState("")
  const [problemsSolved, setProblemsSolved] = useState("")
  const [goals,          setGoals]          = useState("")
  const [osType,         setOsType]         = useState("")
  const [fee,            setFee]            = useState("")
  const [validUntil,     setValidUntil]     = useState("")
  const [issueDate,      setIssueDate]      = useState("")
  const [timeline,       setTimeline]       = useState("")
  const [notionPlan,     setNotionPlan]     = useState("")
  const [installTier,    setInstallTier]    = useState("")
  const [retainer,       setRetainer]       = useState("")
  const [blocks,         setBlocks]         = useState([])

  const saveTimerRef = useRef(null)
  const pendingRef   = useRef({})

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      fetch(`/api/proposals/${id}`).then(r => r.json()),
      fetch(`/api/proposals/${id}/blocks`).then(r => r.json()),
    ]).then(([d, b]) => {
      setData(d)
      setSituation(d.situation           || "")
      setProblemsSolved(d.problems_solved || "")
      setGoals(d.goals                   || "")
      setOsType(d.os_type                || "")
      setFee(d.fee != null               ? String(d.fee) : "")
      setValidUntil(d.valid_until        || "")
      setIssueDate(d.issue_date          || "")
      setTimeline(d.timeline             || "3–4 weeks")
      setNotionPlan(d.notion_plan        || "Plus")
      setInstallTier(d.install_tier      || "Standard")
      setRetainer(d.retainer             || "maintenance")
      setBlocks(b.blocks                 || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // ── Debounced auto-save to Notion ───────────────────────────────────────────
  const scheduleSave = useCallback((patch) => {
    pendingRef.current = { ...pendingRef.current, ...patch }
    setSaveStatus("saving")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const toSave = { ...pendingRef.current }
      pendingRef.current = {}
      try {
        const r = await fetch(`/api/proposals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toSave),
        })
        if (!r.ok) throw new Error()
        setSaveStatus("saved")
        setPreviewKey(k => k + 1)
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    }, 1200)
  }, [id])

  // ── Save blocks ─────────────────────────────────────────────────────────────
  const saveBlocks = async () => {
    setSaveStatus("saving")
    try {
      await fetch(`/api/proposals/${id}/blocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      })
      setSaveStatus("saved")
      setPreviewKey(k => k + 1)
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPdf = async () => {
    if (!id || exporting) return
    setExporting(true)
    try {
      await fetch(`/api/generate?type=proposal&page_id=${id}`, { method: "POST" })
      await new Promise(res => setTimeout(res, 5500))
      const fresh = await fetch(`/api/proposals/${id}`).then(r => r.json())
      if (fresh.pdf_url) window.open(fresh.pdf_url, "_blank")
      else alert("PDF generating — check Notion page in ~10s for the link.")
    } catch (e) {
      alert("Export failed: " + e.message)
    } finally {
      setExporting(false)
    }
  }

  if (!id) return null

  if (loading) {
    return (
      <div style={{ height: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#AAFF00", animation: "pulse 1.2s infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.4)", letterSpacing: ".06em" }}>Loading proposal…</span>
        </div>
      </div>
    )
  }

  const notionUrl = `https://notion.so/${(id || "").replace(/-/g, "")}`

  return (
    <>
      <Head>
        <title>{data?.company_name ? `${data.company_name} — Proposal` : "Proposal Editor"}</title>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
        <style>{GLOBAL_CSS}</style>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </Head>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0D0D0D" }}>

        {/* ── TOP BAR ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: 52,
          background: "#0D0D0D",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          flexShrink: 0,
        }}>
          {/* Left: brand + context */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#AAFF00" }} />
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".16em", color: "rgba(255,255,255,.3)", textTransform: "uppercase" }}>Opxio</span>
            </div>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,.06)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.2)", letterSpacing: ".06em" }}>Proposal Editor</span>
            {data?.proposal_no && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".06em",
                color: "rgba(170,255,0,.5)",
                background: "rgba(170,255,0,.06)",
                border: "1px solid rgba(170,255,0,.15)",
                borderRadius: 6, padding: "2px 8px",
              }}>
                {data.proposal_no}
              </span>
            )}
            {data?.company_name && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.35)" }}>
                — {data.company_name}
              </span>
            )}
          </div>

          {/* Right: save status + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SaveDot status={saveStatus} />
            <a
              href={notionUrl} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)",
                textDecoration: "none", padding: "6px 12px",
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 7, letterSpacing: ".04em",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.15)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)" }}
            >
              Notion ↗
            </a>
            <button
              onClick={exportPdf} disabled={exporting}
              style={{
                fontSize: 11, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase",
                color: exporting ? "rgba(0,0,0,.4)" : "#000",
                background: exporting ? "rgba(170,255,0,.4)" : "#AAFF00",
                border: "none", borderRadius: 7, padding: "7px 16px",
                cursor: exporting ? "not-allowed" : "pointer",
                transition: "all .2s",
              }}
            >
              {exporting ? "Generating…" : "Export PDF"}
            </button>
          </div>
        </div>

        {/* ── SPLIT PANE ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT PANEL ── */}
          <div style={{
            width: 360, minWidth: 300,
            background: "#0D0D0D",
            borderRight: "1px solid rgba(255,255,255,.05)",
            overflowY: "auto",
            padding: "16px 14px 32px",
            flexShrink: 0,
          }}>

            {/* ── CLIENT ── */}
            <Card>
              <SectionHdr label="Client" />
              <ReadonlyRow label="Company"  value={data?.company_name} />
              <ReadonlyRow label="Contact"  value={data?.pic_name} />
              <ReadonlyRow label="WhatsApp" value={data?.pic_phone} />
              <div style={{ marginTop: 10, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.15)", lineHeight: 1.5 }}>
                Edit client details in Notion directly.
              </div>
            </Card>

            {/* ── CONTEXT ── */}
            <Card>
              <SectionHdr label="Context" />
              <Field label="Situation">
                <textarea
                  className="f-textarea"
                  value={situation}
                  onChange={e => setSituation(e.target.value)}
                  onBlur={() => scheduleSave({ situation })}
                  placeholder="What problem brought them here?"
                  rows={4}
                />
              </Field>
              <Field label="Problems Solved">
                <textarea
                  className="f-textarea"
                  value={problemsSolved}
                  onChange={e => setProblemsSolved(e.target.value)}
                  onBlur={() => scheduleSave({ problems_solved: problemsSolved })}
                  placeholder="Key pain points this install addresses…"
                  rows={3}
                />
              </Field>
              <Field label="Goals">
                <textarea
                  className="f-textarea"
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  onBlur={() => scheduleSave({ goals })}
                  placeholder="What they want to achieve in 90 days…"
                  rows={3}
                />
              </Field>
            </Card>

            {/* ── INSTALL ── */}
            <Card>
              <SectionHdr label="Install" />
              <Field label="OS Type">
                <select
                  className="f-select"
                  value={osType}
                  onChange={e => setOsType(e.target.value)}
                  onBlur={() => scheduleSave({ os_type: osType })}
                >
                  <option value="">— select OS —</option>
                  {OS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Install Tier">
                  <input className="f-input" value={installTier} onChange={e => setInstallTier(e.target.value)} onBlur={() => scheduleSave({ install_tier: installTier })} placeholder="Standard" />
                </Field>
                <Field label="Notion Plan">
                  <input className="f-input" value={notionPlan} onChange={e => setNotionPlan(e.target.value)} onBlur={() => scheduleSave({ notion_plan: notionPlan })} placeholder="Plus" />
                </Field>
              </div>
              <Field label="Timeline">
                <input className="f-input" value={timeline} onChange={e => setTimeline(e.target.value)} onBlur={() => scheduleSave({ timeline })} placeholder="3–4 weeks" />
              </Field>
            </Card>

            {/* ── INVESTMENT ── */}
            <Card>
              <SectionHdr label="Investment" />
              <Field label="One-time Fee (MYR)">
                <input className="f-input" type="number" value={fee} onChange={e => setFee(e.target.value)} onBlur={() => scheduleSave({ fee: Number(fee) || 0 })} placeholder="6000" />
              </Field>
              <Field label="Retainer Plan">
                <select className="f-select" value={retainer} onChange={e => setRetainer(e.target.value)} onBlur={() => scheduleSave({ retainer })}>
                  {RETAINER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Issue Date">
                  <input className="f-input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} onBlur={() => scheduleSave({ issue_date: issueDate })} />
                </Field>
                <Field label="Valid Until">
                  <input className="f-input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} onBlur={() => scheduleSave({ valid_until: validUntil })} />
                </Field>
              </div>
            </Card>

            {/* ── PAGE BLOCKS ── */}
            <Card>
              <SectionHdr label="Page Content" color="rgba(170,255,0,.5)" />
              <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.2)", lineHeight: 1.6, marginBottom: 14 }}>
                Custom blocks appear as a Notes page in the proposal.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {blocks.map((block, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 6, alignItems: "flex-start",
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 8, padding: "8px 10px",
                  }}>
                    <select
                      className="block-type-sel"
                      value={block.type}
                      onChange={e => {
                        const nb = [...blocks]; nb[i] = { ...nb[i], type: e.target.value }; setBlocks(nb)
                      }}
                    >
                      {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <textarea
                      className="f-textarea"
                      value={block.text}
                      onChange={e => {
                        const nb = [...blocks]; nb[i] = { ...nb[i], text: e.target.value }; setBlocks(nb)
                      }}
                      rows={2}
                      style={{ minHeight: 48, fontSize: 12 }}
                      placeholder="Block content…"
                    />
                    <button
                      onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}
                      style={{
                        background: "none", border: "1px solid rgba(255,255,255,.08)",
                        borderRadius: 7, color: "rgba(255,255,255,.25)",
                        width: 28, height: 28, cursor: "pointer", flexShrink: 0,
                        fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s", marginTop: 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#FF4444"; e.currentTarget.style.borderColor = "rgba(255,68,68,.3)" }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.25)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)" }}
                    >×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  onClick={() => setBlocks([...blocks, { type: "paragraph", text: "" }])}
                  style={{
                    flex: 1, background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 7, color: "rgba(255,255,255,.35)",
                    fontSize: 11, fontWeight: 700, padding: "8px 10px", cursor: "pointer",
                    letterSpacing: ".06em", transition: "all .2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.6)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "rgba(255,255,255,.35)" }}
                >+ Add Block</button>
                <button
                  onClick={saveBlocks}
                  style={{
                    background: "var(--g)", border: "none", borderRadius: 7,
                    color: "#000", fontSize: 11, fontWeight: 900,
                    padding: "8px 16px", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase",
                    transition: "opacity .2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = ".85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >Save</button>
              </div>
            </Card>

            {/* ── REFRESH PREVIEW ── */}
            <button
              onClick={() => setPreviewKey(k => k + 1)}
              style={{
                width: "100%", marginTop: 4,
                background: "transparent",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 8, color: "rgba(255,255,255,.25)",
                fontSize: 11, fontWeight: 700, padding: "10px",
                cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gb)"; e.currentTarget.style.color = "var(--g)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "rgba(255,255,255,.25)" }}
            >
              ↻ Refresh Preview
            </button>

          </div>

          {/* ── RIGHT PANEL — PREVIEW ── */}
          <div style={{ flex: 1, background: "#1A1A1A", overflow: "hidden", position: "relative" }}>
            <iframe
              key={previewKey}
              src={`/api/proposals/${id}/html`}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title="Proposal Preview"
            />
            <div style={{
              position: "absolute", top: 12, right: 14,
              background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 7, padding: "3px 10px",
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.2)",
              letterSpacing: ".07em", textTransform: "uppercase",
              pointerEvents: "none",
            }}>
              Preview
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
