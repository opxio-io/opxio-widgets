// pages/proposals/[id].jsx
// Proposal editor — pre-filled from Notion, editable, saves back to Notion.
// Access: app.opxio.io/proposals/[id]

import { useState, useEffect, useRef, useCallback } from "react"
import Head from "next/head"
import { useRouter } from "next/router"

// ─── OS type options ────────────────────────────────────────────────────────
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

// ─── Save status indicator ───────────────────────────────────────────────────
function SaveStatus({ status }) {
  const map = {
    idle:    { text: "",          color: "transparent" },
    saving:  { text: "Saving…",   color: "#AAFF00" },
    saved:   { text: "Saved ✓",   color: "#AAFF00" },
    error:   { text: "Save failed", color: "#FF4444" },
  }
  const s = map[status] || map.idle
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: s.color, letterSpacing: ".05em", opacity: status === "idle" ? 0 : 1, transition: "opacity .3s" }}>
      {s.text}
    </span>
  )
}

// ─── Form field components ───────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 11, color: "#666", marginBottom: 6, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  )
}

const inputStyle = {
  width: "100%", background: "#1A1A1A", border: "1px solid #2A2A2A",
  borderRadius: 4, color: "#FFFFFF", fontFamily: "inherit", fontSize: 13,
  padding: "8px 12px", outline: "none", boxSizing: "border-box",
  transition: "border-color .15s",
}

const textareaStyle = {
  ...inputStyle,
  resize: "vertical", minHeight: 80, lineHeight: 1.65,
}

function Input({ value, onChange, onBlur, placeholder, type = "text", disabled }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      style={{ ...inputStyle, color: disabled ? "#666" : "#FFF", cursor: disabled ? "not-allowed" : "text" }}
      onFocus={e => !disabled && (e.target.style.borderColor = "#AAFF00")}
    />
  )
}

function Textarea({ value, onChange, onBlur, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      style={textareaStyle}
      onFocus={e => (e.target.style.borderColor = "#AAFF00")}
    />
  )
}

function Select({ value, onChange, onBlur, options }) {
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      style={{ ...inputStyle, cursor: "pointer" }}
      onFocus={e => (e.target.style.borderColor = "#AAFF00")}
    >
      <option value="">— select —</option>
      {options.map(opt =>
        typeof opt === "string"
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  )
}

function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid #222" }}>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#AAFF00" }}>
        {title}
      </span>
    </div>
  )
}

function ReadonlyRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 13 }}>
      <span style={{ minWidth: 100, color: "#666", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", paddingTop: 1 }}>{label}</span>
      <span style={{ color: "#CCC", flex: 1 }}>{value || "—"}</span>
    </div>
  )
}

// ─── Main editor ─────────────────────────────────────────────────────────────
export default function ProposalEditor() {
  const router     = useRouter()
  const { id }     = router.query

  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saveStatus, setSaveStatus] = useState("idle")
  const [previewKey, setPreviewKey] = useState(0)  // bump to reload iframe
  const [exporting, setExporting]  = useState(false)

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

  const saveTimerRef = useRef(null)
  const pendingRef   = useRef({})

  // ── Load proposal data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/proposals/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setSituation(d.situation      || "")
        setProblemsSolved(d.problems_solved || "")
        setGoals(d.goals             || "")
        setOsType(d.os_type          || "")
        setFee(d.fee !== undefined    ? String(d.fee) : "")
        setValidUntil(d.valid_until   || "")
        setIssueDate(d.issue_date     || "")
        setTimeline(d.timeline        || "3–4 weeks")
        setNotionPlan(d.notion_plan   || "Plus")
        setInstallTier(d.install_tier || "Standard")
        setRetainer(d.retainer        || "maintenance")
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [id])

  // ── Debounced auto-save ───────────────────────────────────────────────────
  const scheduleSave = useCallback((patch) => {
    // Merge pending patches
    pendingRef.current = { ...pendingRef.current, ...patch }
    setSaveStatus("saving")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const toSave = { ...pendingRef.current }
      pendingRef.current = {}
      try {
        const r = await fetch(`/api/proposals/${id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(toSave),
        })
        if (!r.ok) throw new Error(await r.text())
        setSaveStatus("saved")
        setPreviewKey(k => k + 1)  // refresh iframe after save
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch (e) {
        console.error("[save]", e.message)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 4000)
      }
    }, 1200)
  }, [id])

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPdf = async () => {
    if (!id || exporting) return
    setExporting(true)
    try {
      const r = await fetch(`/api/generate?type=proposal&page_id=${id}`, { method: "POST" })
      if (!r.ok) throw new Error("Generate failed")
      const json = await r.json()
      // Poll for a moment then reload to pick up the updated PDF URL
      await new Promise(res => setTimeout(res, 5000))
      const fresh = await fetch(`/api/proposals/${id}`).then(r => r.json())
      if (fresh.pdf_url) {
        window.open(fresh.pdf_url, "_blank")
      } else {
        alert("PDF is being generated. Check the Notion page for the PDF link in ~10 seconds.")
      }
    } catch (e) {
      alert("Export failed: " + e.message)
    } finally {
      setExporting(false)
    }
  }

  if (!id) return null

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", color: "#AAFF00", fontFamily: "sans-serif", fontSize: 14 }}>
        Loading proposal…
      </div>
    )
  }

  const notionUrl = `https://notion.so/${id.replace(/-/g, "")}`

  return (
    <>
      <Head>
        <title>Proposal Editor — {data?.company_name || id}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', -apple-system, sans-serif; background: #0D0D0D; color: #FFF; overflow: hidden; }
          select option { background: #1A1A1A; }
          input:focus, textarea:focus, select:focus { outline: none; border-color: #AAFF00 !important; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #111; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #444; }
        `}</style>
      </Head>

      {/* ── LAYOUT ── */}
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "#111", borderBottom: "1px solid #222", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: ".18em", color: "#AAFF00", textTransform: "uppercase" }}>Opxio</span>
            <span style={{ color: "#333", fontSize: 13 }}>|</span>
            <span style={{ fontSize: 12, color: "#888", letterSpacing: ".05em" }}>Proposal Editor</span>
            {data?.proposal_no && (
              <span style={{ fontSize: 12, color: "#555", background: "#1A1A1A", padding: "2px 8px", borderRadius: 3, fontFamily: "monospace" }}>
                {data.proposal_no}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <SaveStatus status={saveStatus} />
            <a
              href={notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#666", textDecoration: "none", padding: "6px 12px", border: "1px solid #2A2A2A", borderRadius: 4, transition: "all .15s" }}
              onMouseEnter={e => { e.target.style.color = "#FFF"; e.target.style.borderColor = "#555" }}
              onMouseLeave={e => { e.target.style.color = "#666"; e.target.style.borderColor = "#2A2A2A" }}
            >
              Open in Notion ↗
            </a>
            <button
              onClick={exportPdf}
              disabled={exporting}
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#000", background: exporting ? "#666" : "#AAFF00", border: "none", borderRadius: 4, padding: "8px 16px", cursor: exporting ? "not-allowed" : "pointer", transition: "background .15s" }}
            >
              {exporting ? "Generating…" : "Export PDF"}
            </button>
          </div>
        </div>

        {/* ── MAIN SPLIT ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT PANEL — FORM ── */}
          <div style={{ width: 380, minWidth: 320, background: "#111", borderRight: "1px solid #1E1E1E", overflowY: "auto", padding: "28px 24px", flexShrink: 0 }}>

            {/* Client info */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Client" icon="👤" />
              <ReadonlyRow label="Company"  value={data?.company_name} />
              <ReadonlyRow label="Contact"  value={data?.pic_name} />
              <ReadonlyRow label="WhatsApp" value={data?.pic_phone} />
              <p style={{ fontSize: 11, color: "#444", marginTop: 10 }}>Client details are pulled from Notion relations. Edit them in Notion directly.</p>
            </div>

            {/* Context */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Context" icon="💬" />
              <Field label="Situation" hint="What problem brought them here?">
                <Textarea
                  value={situation}
                  onChange={setSituation}
                  onBlur={() => scheduleSave({ situation })}
                  placeholder="Describe the client's current situation…"
                  rows={4}
                />
              </Field>
              <Field label="Problems Solved" hint="What does this OS solve for them?">
                <Textarea
                  value={problemsSolved}
                  onChange={setProblemsSolved}
                  onBlur={() => scheduleSave({ problems_solved: problemsSolved })}
                  placeholder="Key pain points this install addresses…"
                  rows={3}
                />
              </Field>
              <Field label="Goals" hint="What does success look like?">
                <Textarea
                  value={goals}
                  onChange={setGoals}
                  onBlur={() => scheduleSave({ goals })}
                  placeholder="What they want to achieve in 90 days…"
                  rows={3}
                />
              </Field>
            </div>

            {/* Install */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Install" icon="⚙️" />
              <Field label="OS Type">
                <Select
                  value={osType}
                  onChange={setOsType}
                  onBlur={() => scheduleSave({ os_type: osType })}
                  options={OS_OPTIONS}
                />
              </Field>
              <Field label="Install Tier">
                <Input
                  value={installTier}
                  onChange={setInstallTier}
                  onBlur={() => scheduleSave({ install_tier: installTier })}
                  placeholder="Standard"
                />
              </Field>
              <Field label="Notion Plan">
                <Input
                  value={notionPlan}
                  onChange={setNotionPlan}
                  onBlur={() => scheduleSave({ notion_plan: notionPlan })}
                  placeholder="Plus"
                />
              </Field>
              <Field label="Timeline">
                <Input
                  value={timeline}
                  onChange={setTimeline}
                  onBlur={() => scheduleSave({ timeline })}
                  placeholder="3–4 weeks"
                />
              </Field>
            </div>

            {/* Investment */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Investment" icon="💰" />
              <Field label="One-time Fee (MYR)">
                <Input
                  type="number"
                  value={fee}
                  onChange={setFee}
                  onBlur={() => scheduleSave({ fee: Number(fee) || 0 })}
                  placeholder="6000"
                />
              </Field>
              <Field label="Retainer Plan">
                <Select
                  value={retainer}
                  onChange={setRetainer}
                  onBlur={() => scheduleSave({ retainer })}
                  options={RETAINER_OPTIONS}
                />
              </Field>
              <Field label="Issue Date">
                <Input
                  type="date"
                  value={issueDate}
                  onChange={setIssueDate}
                  onBlur={() => scheduleSave({ issue_date: issueDate })}
                />
              </Field>
              <Field label="Valid Until">
                <Input
                  type="date"
                  value={validUntil}
                  onChange={setValidUntil}
                  onBlur={() => scheduleSave({ valid_until: validUntil })}
                />
              </Field>
            </div>

            {/* Refresh preview */}
            <button
              onClick={() => setPreviewKey(k => k + 1)}
              style={{ width: "100%", background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 4, color: "#888", fontSize: 12, fontWeight: 500, padding: "10px", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#AAFF00"; e.currentTarget.style.color = "#AAFF00" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "#888" }}
            >
              ↻ Refresh Preview
            </button>

          </div>

          {/* ── RIGHT PANEL — PREVIEW ── */}
          <div style={{ flex: 1, background: "#F0F0F0", overflow: "hidden", position: "relative" }}>
            <iframe
              key={previewKey}
              src={`/api/proposals/${id}/html`}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title="Proposal Preview"
            />
            {/* Overlay label */}
            <div style={{ position: "absolute", top: 12, right: 16, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#888", letterSpacing: ".06em", pointerEvents: "none" }}>
              Preview — saved state
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
