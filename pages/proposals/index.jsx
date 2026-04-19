// pages/proposals/index.jsx
// Proposals index — app.opxio.io/proposals
// Lists all proposals from Notion with one-click access to the editor

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "Draft":     { color: "rgba(255,255,255,.25)", bg: "rgba(255,255,255,.06)" },
  "Sent":      { color: "#60A5FA",               bg: "rgba(96,165,250,.1)"   },
  "Reviewed":  { color: "#A78BFA",               bg: "rgba(167,139,250,.1)"  },
  "Approved":  { color: "#AAFF00",               bg: "rgba(170,255,0,.1)"    },
  "Won":       { color: "#AAFF00",               bg: "rgba(170,255,0,.12)"   },
  "Lost":      { color: "#F87171",               bg: "rgba(248,113,113,.1)"  },
  "Expired":   { color: "rgba(255,255,255,.2)",  bg: "rgba(255,255,255,.04)" },
}

function statusStyle(s) {
  return STATUS_CONFIG[s] || STATUS_CONFIG["Draft"]
}

// ─── Global CSS ──────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Satoshi', -apple-system, sans-serif;
    background: #0D0D0D;
    color: rgba(255,255,255,.87);
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }
  a { text-decoration: none; color: inherit; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`

function fmt(n) {
  if (n == null) return "—"
  return "RM " + Number(n).toLocaleString("en-MY")
}

function fmtDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
}

// ─── Proposal row ────────────────────────────────────────────────────────────
function ProposalRow({ p, idx }) {
  const router = useRouter()
  const st = statusStyle(p.status)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => router.push(`/proposals/${p.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr 160px 100px 90px 110px 36px",
        alignItems: "center",
        gap: 0,
        padding: "0 20px",
        height: 56,
        background: hovered ? "rgba(255,255,255,.03)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,.04)",
        cursor: "pointer",
        transition: "background .15s",
        animation: `fadeUp .3s ease both`,
        animationDelay: `${idx * 30}ms`,
      }}
    >
      {/* Ref */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(170,255,0,.7)", letterSpacing: ".04em" }}>
        {p.ref || "—"}
      </div>

      {/* Company + OS */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.87)", marginBottom: 2 }}>
          {p.company}
        </div>
        {p.os_type && (
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.3)" }}>
            {p.os_type}
          </div>
        )}
      </div>

      {/* Fee */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.6)", textAlign: "right", paddingRight: 20 }}>
        {fmt(p.fee)}
      </div>

      {/* Status */}
      <div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
          color: st.color, background: st.bg,
          padding: "3px 8px", borderRadius: 5,
        }}>
          {p.status || "Draft"}
        </span>
      </div>

      {/* Date */}
      <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.3)" }}>
        {fmtDate(p.issue_date)}
      </div>

      {/* Valid until */}
      <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.25)" }}>
        {p.valid_until ? fmtDate(p.valid_until) : "—"}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {p.pdf_url && (
          <a
            href={p.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="Open PDF"
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "rgba(255,255,255,.4)",
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#AAFF00"; e.currentTarget.style.borderColor = "rgba(170,255,0,.3)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)" }}
          >
            ↓
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Column header ───────────────────────────────────────────────────────────
function ColHdr({ children, align = "left", style: s }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
      color: "rgba(255,255,255,.2)", textAlign: align, ...s,
    }}>
      {children}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ProposalsIndex() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState("")

  useEffect(() => {
    fetch("/api/proposals/list")
      .then(r => r.json())
      .then(d => {
        setProposals(d.proposals || [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filtered = proposals.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.ref?.toLowerCase().includes(q) ||
      p.company?.toLowerCase().includes(q) ||
      p.os_type?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    )
  })

  const counts = {
    total:    proposals.length,
    draft:    proposals.filter(p => p.status === "Draft").length,
    sent:     proposals.filter(p => p.status === "Sent").length,
    approved: proposals.filter(p => ["Approved", "Won"].includes(p.status)).length,
  }

  return (
    <>
      <Head>
        <title>Proposals — Opxio</title>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
        <style>{GLOBAL_CSS}</style>
      </Head>

      <div style={{ minHeight: "100vh", background: "#0D0D0D" }}>

        {/* ── TOPBAR ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 52,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          position: "sticky", top: 0, background: "#0D0D0D", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#AAFF00" }} />
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".16em", color: "rgba(255,255,255,.3)", textTransform: "uppercase" }}>Opxio</span>
            </div>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,.06)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.2)", letterSpacing: ".06em" }}>Proposals</span>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, ref, OS…"
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 500,
              padding: "7px 14px", outline: "none", width: 260,
              fontFamily: "inherit", transition: "border-color .2s",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(170,255,0,.3)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.08)")}
          />
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

          {/* ── STAT PILLS ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
            {[
              { label: "Total",    value: counts.total,    color: "rgba(255,255,255,.5)"  },
              { label: "Drafts",   value: counts.draft,    color: "rgba(255,255,255,.3)"  },
              { label: "Sent",     value: counts.sent,     color: "#60A5FA"               },
              { label: "Won",      value: counts.approved, color: "#AAFF00"               },
            ].map(s => (
              <div key={s.label} style={{
                background: "#111", border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 10, padding: "12px 20px", minWidth: 90,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {loading ? "—" : s.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── TABLE ── */}
          <div style={{
            background: "#111",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            {/* Column headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 160px 100px 90px 110px 36px",
              gap: 0, padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              background: "rgba(255,255,255,.02)",
            }}>
              <ColHdr>Ref</ColHdr>
              <ColHdr>Client</ColHdr>
              <ColHdr align="right" style={{ paddingRight: 20 }}>Fee</ColHdr>
              <ColHdr>Status</ColHdr>
              <ColHdr>Issued</ColHdr>
              <ColHdr>Valid Until</ColHdr>
              <ColHdr></ColHdr>
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: "48px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#AAFF00", animation: "pulse 1.2s infinite" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", fontWeight: 600 }}>Loading proposals…</span>
              </div>
            ) : error ? (
              <div style={{ padding: "48px 20px", fontSize: 13, color: "#F87171" }}>
                Failed to load: {error}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "48px 20px", fontSize: 13, color: "rgba(255,255,255,.25)", fontWeight: 500 }}>
                {search ? "No proposals match your search." : "No proposals yet."}
              </div>
            ) : (
              filtered.map((p, i) => <ProposalRow key={p.id} p={p} idx={i} />)
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,.2)", fontWeight: 500 }}>
              {filtered.length} proposal{filtered.length !== 1 ? "s" : ""}
              {search ? ` matching "${search}"` : ""}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
