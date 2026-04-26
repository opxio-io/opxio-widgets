// proposal_template.js — Opxio Proposal Template Engine v3
// CommonJS module — used by the Vercel serverless function
// Exports: renderProposal(data), mapNotionPayload(body)

// ─── MODULE LIBRARY ────────────────────────────────────────────────────────
const MODULE_LIBRARY = {
  'CRM & Pipeline':              'Lead tracking, stage management, deal visibility, follow-up log',
  'Product & Pricing Catalogue': 'Services and packages structured for reuse in proposals',
  'Proposal & Deal Tracker':     'Tracks every proposal per deal — status, version, outcome',
  'Payment Tracker':             'Expected vs. received payments, invoice reference, overdue flags',
  'Finance & Expense Tracker':   'Income and expense logging, project categorisation, monthly P&L',
  'Project Tracker':             'Active projects with phases, milestones, and client-facing delivery view',
  'Task Management':             'Team task assignment, due dates, ownership, status — by person and project',
  'SOP & Process Library':       'Documented operating procedures, searchable and linked to projects',
  'Client Onboarding Tracker':   'Structured checklist per client — no more verbal walkthroughs',
  'Team Responsibility Matrix':  'Who owns what, across every function and every client',
  'Retainer Management':         'Recurring clients, scope, billing cycle, and renewal tracking',
  'Campaign Tracker':            'Campaign overview, status, objectives, budget, timeline',
  'Ads Tracker':                 'Platform spend by channel, ROAS, CPL, CPC, creative performance',
  'Content Calendar':            'Planned posts by platform, publish date, status, assignee',
  'Content Production Tracker':  'Full asset workflow from brief through revision and approval to publish',
  'Brand & Asset Library':       'Brand guidelines, logos, templates, approved creative assets',
  'Hiring Pipeline':             'Open roles, applicant stages, interview notes, offer tracking',
  'Team Onboarding Tracker':     'Step-by-step onboarding checklist per new hire, with ownership',
  'Performance & Goals':         'Quarterly goals, check-ins, review notes, ratings',
  'Leave & Availability':        'Time-off requests, approval status, team calendar visibility',
  'Role & Compensation Log':     'Role history, salary records, increments — internal only',
  'Client Health Tracker':       'Health scores, satisfaction signals, last contact date, risk flags',
  'NPS & Feedback Log':          'Survey results, recurring themes, satisfaction trend',
  'Renewal Pipeline':            'Contract end dates, renewal probability, action items',
  'Upsell Opportunity Tracker':  'Expansion signals, upsell ideas, status per client',
  'Support & Issue Log':         'Client-raised issues, response time, resolution, escalation',
};

// ─── ADD-ON LIBRARY ────────────────────────────────────────────────────────
const ADDON_LIBRARY = {
  'Marketing OS': {
    desc:        'Campaign tracking, content production workflow, and ads performance — connected to your CRM so leads from campaigns land directly in the pipeline.',
    price_label: 'RM 3,800', price_num: 3800, cadence: 'one-time', type: 'once', timing: 'Anytime',
  },
  'Team OS': {
    desc:        'Hiring pipeline, team onboarding, performance goals, leave tracking, and compensation log — structured people ops in Notion. Requires Business OS + Notion Business plan.',
    price_label: 'RM 1,700', price_num: 1700, cadence: 'one-time', type: 'once', timing: 'Month 3–6',
  },
  'Retention OS': {
    desc:        'Client health scores, NPS tracking, renewal pipeline, and upsell opportunity tracker — built for retainer-heavy agencies. Requires Revenue OS.',
    price_label: 'RM 1,700', price_num: 1700, cadence: 'one-time', type: 'once', timing: 'Month 3–6',
  },
  'Enhanced Dashboard': {
    desc:        'Charts, trend lines, rankings, and target tracking on top of your existing OS data. Adds analytics your static dashboard hub doesn\'t have. Requires Notion Business plan for embedding.',
    price_label: 'RM 800–1,500', price_num: 800, cadence: 'from', type: 'once', timing: 'Anytime',
  },
  'Project Kickoff Automation': {
    desc:        'When a deal is marked Won → project created, tasks assigned, team notified automatically. No manual handoff between sales and delivery.',
    price_label: 'RM 1,200', price_num: 1200, monthly: 40, cadence: 'setup + RM 40/mo', type: 'setup+monthly', timing: 'Anytime',
  },
  'Campaign Kickoff Automation': {
    desc:        'When a campaign is set to Active → content tasks created and assigned automatically. Instant brief-to-execution handoff.',
    price_label: 'RM 1,000', price_num: 1000, monthly: 40, cadence: 'setup + RM 40/mo', type: 'setup+monthly', timing: 'Anytime',
  },
  'Client Onboarding Kickoff': {
    desc:        'When a new client is added → full onboarding checklist created and team assigned automatically. Every new client gets the same structured start.',
    price_label: 'RM 1,000', price_num: 1000, monthly: 40, cadence: 'setup + RM 40/mo', type: 'setup+monthly', timing: 'Anytime',
  },
  'Renewal Kickoff Automation': {
    desc:        'Daily check on contract end dates → renewal task created automatically 30 days before expiry. Never miss a renewal window again.',
    price_label: 'RM 900', price_num: 900, monthly: 40, cadence: 'setup + RM 40/mo', type: 'setup+monthly', timing: 'Anytime',
  },
  'Hiring Kickoff Automation': {
    desc:        'When a role is opened → screening tasks created and assigned automatically. Structured hiring process from day one.',
    price_label: 'RM 800', price_num: 800, monthly: 40, cadence: 'setup + RM 40/mo', type: 'setup+monthly', timing: 'Anytime',
  },
  'Document Generation': {
    desc:        'Branded PDF quotes and invoices auto-generated from your Notion data. One button in Notion generates and stores the document. Runs on Opxio\'s server.',
    price_label: 'RM 600', price_num: 600, monthly: 60, cadence: 'setup + RM 60/mo', type: 'setup+monthly', timing: 'Anytime',
  },
  'Lead Capture System': {
    desc:        'WhatsApp or form inquiries auto-populate your CRM pipeline without manual entry. Every lead captured, structured, and visible to the team immediately.',
    price_label: 'RM 500–900', price_num: 500, cadence: 'from', type: 'once', timing: 'Anytime',
  },
  'Ads Platform Integration': {
    desc:        'Real-time spend and performance data pulled automatically from Meta, Google, and TikTok into your Ads Tracker — no manual entry. Requires Marketing OS.',
    price_label: 'RM 1,000–2,000', price_num: 1000, cadence: 'from', type: 'once', timing: 'Anytime',
  },
  'Client Portal View': {
    desc:        'Read-only Notion view for clients to track project progress, delivery milestones, and shared assets without full workspace access.',
    price_label: 'RM 350–800', price_num: 350, cadence: 'from', type: 'once', timing: 'Anytime',
  },
};

// ─── WIDGET MAP ────────────────────────────────────────────────────────────
const WIDGET_MAP = {
  'Revenue OS': [
    { name: 'Pipeline Overview',          page: 'CRM & Pipeline page',            answers: 'How healthy is my pipeline right now?' },
    { name: 'Payment Status',             page: 'Payment Tracker page',            answers: 'Where does money stand this month?' },
    { name: 'Finance Snapshot',           page: 'Finance & Expense page',          answers: 'Am I profitable this month?' },
  ],
  'Operations OS': [
    { name: 'Project Health',             page: 'Project Tracker page',            answers: 'What is the state of every active project?' },
    { name: 'Task Load',                  page: 'Task Management page',            answers: 'Who has what open, and what is overdue?' },
    { name: 'Delivery & Retainer Health', page: 'Retainer Management page',        answers: 'Are we delivering on time?' },
  ],
  'Marketing OS': [
    { name: 'Campaign Status',            page: 'Campaign Tracker page',           answers: 'What campaigns are running and where are they?' },
    { name: 'Ads Performance',            page: 'Ads Tracker page',                answers: 'How is paid spend performing?' },
    { name: 'Content Pipeline',           page: 'Content Production Tracker page', answers: 'What content is due, in production, or overdue?' },
  ],
  'Team OS': [
    { name: 'Team Overview',              page: 'Team & Staff Directory page',     answers: 'Who is available and what does headcount look like?' },
    { name: 'Hiring Pipeline',            page: 'Hiring Pipeline page',            answers: 'Where are we in filling open roles?' },
  ],
  'Retention OS': [
    { name: 'Client Health Board',        page: 'Client Health Tracker page',      answers: 'Which clients are healthy and which need attention?' },
    { name: 'Renewal Pipeline',           page: 'Renewal Pipeline page',           answers: 'What is expiring and what is the risk?' },
  ],
};

const RETAINER_LABELS = {
  hosting:     { label: 'Hosting Only',    fee: 150 },
  maintenance: { label: 'Maintenance',     fee: 400 },
  active:      { label: 'Active Retainer', fee: 900 },
};

const OS_MODULE_GROUPS = {
  'Revenue OS':     { badge: 'badge-revenue',    subtitle: 'Pipeline · Proposals · Payments · Finance' },
  'Operations OS':  { badge: 'badge-operations', subtitle: 'Projects · Tasks · SOPs · Retainers' },
  'Marketing OS':   { badge: 'badge-marketing',  subtitle: 'Campaigns · Ads · Content · Assets' },
  'Team OS':        { badge: 'badge-team',       subtitle: 'Hiring · Onboarding · Performance · Leave' },
  'Retention OS':   { badge: 'badge-retention',  subtitle: 'Health · NPS · Renewals · Upsell' },
  'Agency OS':      { badge: 'badge-agency',     subtitle: 'Revenue · Operations · Marketing' },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
function fmt(n) { return 'RM ' + Number(n).toLocaleString('en-MY'); }
function escape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function moduleItems(modules) {
  return modules.map(item => {
    // Accept either a plain string (legacy) or a { name, desc } object (live catalogue)
    const name = typeof item === 'string' ? item : (item.name || '')
    const desc = typeof item === 'string'
      ? (MODULE_LIBRARY[name] || '')
      : (item.desc || MODULE_LIBRARY[name] || '')
    return `<div class="module-item">
        <div class="module-dot"></div>
        <div>
          <div class="module-item-name">${escape(name)}</div>
          <div class="module-item-desc">${escape(desc)}</div>
        </div>
      </div>`;
  }).join('');
}

function moduleGroups(groupedModules) {
  return Object.entries(groupedModules).map(([osName, mods]) => {
    const meta = OS_MODULE_GROUPS[osName] || { badge: 'badge-operations', subtitle: '' };
    return `<div class="module-group">
        <div class="module-group-header">
          <div class="module-group-badge ${meta.badge}">${escape(osName)}</div>
          <div class="module-group-title">${escape(meta.subtitle)}</div>
        </div>
        <div class="module-list">${moduleItems(mods)}</div>
      </div>`;
  }).join('');
}

function widgetRows(osTypes) {
  const rows = []; let shade = false;
  for (const os of osTypes) {
    for (const w of (WIDGET_MAP[os] || [])) {
      rows.push(`<tr${shade ? ' class="shaded"' : ''}>
          <td>${escape(w.name)}</td><td>${escape(w.page)}</td><td>${escape(w.answers)}</td>
        </tr>`);
      shade = !shade;
    }
  }
  return rows.join('');
}

function addonCard(name) {
  const a = ADDON_LIBRARY[name];
  if (!a) return '';
  return `<div class="phase2-item">
      <div>
        <div class="phase2-name">${escape(name)}</div>
        <div class="phase2-timing">${escape(a.timing)}</div>
      </div>
      <div class="phase2-desc">${escape(a.desc)}</div>
      <div class="phase2-price">
        <span class="amount">${escape(a.price_label)}</span>
        <span class="cadence">${escape(a.cadence)}</span>
      </div>
    </div>`;
}

function renderCustomBlocks(blocks) {
  if (!blocks || blocks.length === 0) return '';

  let html = '';
  let bulletBuffer = []; // each entry: { idx, text }

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const type = block.type || 'paragraph';
    const text = block.text || '';

    // Flush bullet buffer if we hit a non-bullet block
    if (type !== 'bulleted_list_item' && bulletBuffer.length > 0) {
      html += `<ul class="block-list">${bulletBuffer.map(e => `<li data-block-idx="${e.idx}">${escape(e.text)}</li>`).join('')}</ul>`;
      bulletBuffer = [];
    }

    if (type === 'heading_1') {
      html += `<h2 class="block-h1" data-block-idx="${idx}">${escape(text)}</h2>`;
    } else if (type === 'heading_2') {
      html += `<h3 class="block-h2" data-block-idx="${idx}">${escape(text)}</h3>`;
    } else if (type === 'bulleted_list_item') {
      bulletBuffer.push({ idx, text });
    } else {
      // paragraph
      html += `<p class="section-lead" data-block-idx="${idx}">${escape(text)}</p>`;
    }
  }

  // Flush remaining bullets
  if (bulletBuffer.length > 0) {
    html += `<ul class="block-list">${bulletBuffer.map(e => `<li data-block-idx="${e.idx}">${escape(e.text)}</li>`).join('')}</ul>`;
  }

  return html;
}

// ─── CSS ──────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#FFFFFF;--black:#111111;--white:#FFFFFF;
    --border:#D8D4CC;--muted:#888880;--faint:#E8E4DC;
    --fg:#1A1A18;--lime:#AAFF00;
    --fh:'Clash Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;
    --fb:'Helvetica Neue',Helvetica,Arial,sans-serif;
  }
  html{font-size:14px;background:#E8E8E8}
  body{font-family:var(--fb);color:var(--fg);background:#E8E8E8;-webkit-font-smoothing:antialiased}

  /* ── Page shell ─────────────────────────────────────────────────────────── */
  .page{width:840px;background:var(--bg);margin:32px auto;position:relative;display:flex;flex-direction:column}
  @media screen{.page{min-height:1122px;box-shadow:0 4px 32px rgba(0,0,0,.18)}}
  @media print{
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{background:#fff!important;margin:0;padding:0}
    @page{margin:0;size:A4}
    .page{margin:0!important;box-shadow:none!important;width:100%!important;height:297mm;overflow:hidden;page-break-after:always;background:#fff!important}
    .page:last-of-type{page-break-after:auto}
    .phase2-item,.os-block,.addon-item-row{page-break-inside:avoid;break-inside:avoid;-webkit-column-break-inside:avoid}
  }

  /* ── Page content area ──────────────────────────────────────────────────── */
  .page-body{padding:44px 60px 0;flex:1}
  .page-footer{display:flex;justify-content:space-between;align-items:center;background:var(--black);padding:14px 60px;margin-top:auto}
  .pf-left{font-family:var(--fh);font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--white);text-transform:uppercase}
  .pf-center{font-family:var(--fh);font-size:10px;font-weight:500;letter-spacing:.1em;color:#888;text-transform:uppercase;text-align:center}
  .pf-right{font-family:var(--fh);font-size:10px;font-weight:500;letter-spacing:.1em;color:#888;text-transform:uppercase;text-align:right}

  /* ── Page 1 — Header ────────────────────────────────────────────────────── */
  .doc-header{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:start;padding-bottom:28px;border-bottom:1.5px solid var(--black)}
  .doc-title{font-family:var(--fh);font-size:34px;font-weight:700;color:var(--black);line-height:1.1;letter-spacing:-.01em}
  .doc-subtitle{font-family:var(--fh);font-size:34px;font-weight:400;color:var(--black);line-height:1.1;letter-spacing:-.01em}
  .doc-meta{display:flex;flex-direction:column;gap:8px;text-align:right;padding-top:4px}
  .doc-meta-row{display:flex;gap:20px;justify-content:flex-end;align-items:baseline}
  .doc-meta-label{font-family:var(--fh);font-size:9.5px;font-weight:500;letter-spacing:.1em;color:var(--muted);text-transform:uppercase;min-width:70px;text-align:right}
  .doc-meta-value{font-size:12.5px;font-weight:400;color:var(--fg);min-width:140px;text-align:right}

  /* ── Problem sections ───────────────────────────────────────────────────── */
  .prob-section{margin-top:44px}
  .prob-heading{font-family:var(--fh);font-size:22px;font-weight:700;color:var(--black);margin-bottom:12px;letter-spacing:-.01em}
  .prob-body{font-size:13.5px;font-weight:400;color:#444440;line-height:1.75;max-width:580px}
  .prob-placeholder{font-size:13px;font-style:italic;color:var(--muted);line-height:1.7;max-width:560px}

  /* ── Page 2 — System ────────────────────────────────────────────────────── */
  .sys-heading{font-family:var(--fh);font-size:28px;font-weight:700;color:var(--black);margin-bottom:8px;letter-spacing:-.01em}
  .sys-subtitle{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:36px;max-width:520px}

  .os-block{margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--border)}
  .os-block:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
  .os-name-row{display:flex;align-items:baseline;gap:10px;margin-bottom:5px}
  .os-name{font-family:var(--fh);font-size:16px;font-weight:700;color:var(--black)}
  .os-badge{font-family:var(--fh);font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-style:italic}
  .os-desc{font-size:12.5px;color:#555551;font-style:italic;margin-bottom:14px;line-height:1.6}
  .modules-label{font-family:var(--fh);font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
  .modules-inline{font-size:12.5px;color:var(--fg);line-height:1.7}
  .modules-inline span{margin:0 2px}
  .modules-inline span:not(:last-child)::after{content:' ·';color:var(--muted);margin-left:2px}

  .addons-label{font-family:var(--fh);font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:14px;margin-bottom:7px}
  .addons-inline{font-size:12px;color:#555551;line-height:1.75}
  .addons-inline span{margin:0 2px}
  .addons-inline span:not(:last-child)::after{content:' ·';color:var(--muted);margin-left:2px}

  /* ── Page 3 — Investment ────────────────────────────────────────────────── */
  .inv-heading{font-family:var(--fh);font-size:26px;font-weight:700;color:var(--black);margin-bottom:20px;letter-spacing:-.01em}
  .inv-table{width:100%;border-collapse:collapse;margin-bottom:20px}
  .inv-table thead tr{border-bottom:1.5px solid var(--black)}
  .inv-table thead th{font-family:var(--fh);font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:0 0 10px;text-align:left}
  .inv-table thead th:last-child{text-align:right}
  .inv-table tbody td{padding:14px 0;border-bottom:1px solid var(--border);font-size:13.5px;color:#444440;vertical-align:top}
  .inv-table tbody td:last-child{text-align:right;font-weight:500;color:var(--black);white-space:nowrap}
  .inv-table tbody tr.total-row td{border-bottom:none;border-top:1.5px solid var(--black);padding-top:16px;font-family:var(--fh);font-weight:700;color:var(--black);font-size:15px}
  .inv-item-name{font-weight:500;color:var(--black);margin-bottom:3px}
  .inv-item-desc{font-size:11.5px;color:var(--muted);line-height:1.55}
  .inv-note{font-size:12px;color:var(--muted);font-style:italic;margin-top:16px;line-height:1.6}
  .inv-terms{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid var(--border)}
  .inv-term-item label{font-family:var(--fh);font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px}
  .inv-term-item span{font-size:13px;color:var(--fg)}

  /* ── Next steps ─────────────────────────────────────────────────────────── */
  .steps-heading{font-family:var(--fh);font-size:20px;font-weight:700;color:var(--black);margin-bottom:14px;letter-spacing:-.01em}
  .steps-list{display:flex;flex-direction:column;gap:0}
  .step-row{display:grid;grid-template-columns:40px 1fr;gap:12px;align-items:start;padding:11px 0;border-bottom:1px solid var(--border)}
  .step-row:last-child{border-bottom:none}
  .step-num{font-family:var(--fh);font-size:13px;font-weight:700;color:var(--muted)}
  .step-text-head{font-family:var(--fh);font-size:13.5px;font-weight:700;color:var(--black);margin-bottom:3px}
  .step-text-desc{font-size:12px;color:#555551;line-height:1.5}

  /* ── CTA ────────────────────────────────────────────────────────────────── */
  .cta-strip{background:var(--black);margin:28px -60px 0;padding:24px 60px;display:flex;justify-content:space-between;align-items:center;gap:24px}
  .cta-line{font-family:var(--fh);font-size:18px;font-weight:700;color:var(--white);letter-spacing:-.01em}
  .cta-contacts{display:flex;gap:32px;align-items:center}
  .cta-contact{font-size:12px;color:#888;text-align:center}
  .cta-contact label{font-family:var(--fh);font-size:8.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--lime);display:block;margin-bottom:3px}

  /* ── Phase 2 addons later (compact) ─────────────────────────────────────── */
  .phase2-item{display:grid;grid-template-columns:160px 1fr auto;gap:16px;align-items:center;padding:10px 14px;border:1px solid var(--border);border-radius:3px;margin-bottom:5px;background:var(--white);page-break-inside:avoid;break-inside:avoid}
  .phase2-name{font-family:var(--fh);font-size:11.5px;font-weight:700;color:var(--black);margin-bottom:2px}
  .phase2-timing{font-size:9px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
  .phase2-desc{font-size:11px;color:#666662;line-height:1.5}
  .phase2-price{text-align:right;white-space:nowrap}
  .phase2-price .amount{font-family:var(--fh);font-size:12.5px;font-weight:700;color:var(--black);display:block}
  .phase2-price .cadence{font-size:9.5px;color:var(--muted)}
`;

// ── OS short descriptions ─────────────────────────────────────────────────
const OS_DESCRIPTIONS = {
  'Revenue OS':    'Everything from first contact to final payment, tracked and visible in one place.',
  'Operations OS': 'Every project, task, and deliverable owned, managed, and moving without you chasing it.',
  'Marketing OS':  'Full visibility over campaigns, content, and leads — built for teams running their own marketing.',
  'Finance OS':    'Cash flow, payroll, and P&L in one place — no more guessing where the money is.',
  'Team OS':       'Hiring to offboarding to performance — your people infrastructure, fully structured.',
  'Retention OS':  'Client health, renewals, and upsell — tracked before they become problems.',
  'Sales OS':      'Your sales team\'s performance, targets, and pipeline — visible and manageable.',
};

const BASE_OS_MODULES = ['Companies & People', 'Client Accounts', 'Team Members', 'Company Profile', 'Dashboard Hub'];

// ─── RENDER ────────────────────────────────────────────────────────────────
function renderProposal(data) {
  const {
    ref_number    = 'PRO-0000-001',
    date          = new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' }),
    valid_until,
    company_name  = 'Client',
    contact_name  = '',
    contact_role  = '',
    whatsapp      = '',
    email         = 'hello@opxio.io',
    website       = 'opxio.io',
    os_type       = '',
    install_tier  = 'Standard',
    notion_plan   = 'Plus',
    timeline      = '3–4 weeks',
    fee,
    situation     = [],
    modules       = {},
    addons_now    = [],
    addons_later  = [],
  } = data;

  const coreFee   = Number(fee) || 0;
  const deposit   = Math.round(coreFee / 2);
  const osTypes   = Object.keys(modules);
  const refLabel  = `${escape(ref_number)} · ${escape(company_name)}`;

  const validUntilText = valid_until || (() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  // ── Map situation blocks to sections ──────────────────────────────────
  const situationText     = situation.find(s => !s.label || s.label === 'Situation')?.text
                          || (typeof situation[0] === 'string' ? situation[0] : situation[0]?.text) || '';
  const problemsText      = situation.find(s => s.label === 'Problems Solved')?.text
                          || (typeof situation[1] === 'string' ? situation[1] : situation[1]?.text) || '';
  const goalsText         = situation.find(s => s.label === 'Goals')?.text
                          || (typeof situation[2] === 'string' ? situation[2] : situation[2]?.text) || '';

  // ── Footer helper ─────────────────────────────────────────────────────
  const footer = `
    <div class="page-footer">
      <div class="pf-left">System Proposal</div>
      <div class="pf-center">${refLabel}</div>
      <div class="pf-right">Opxio · opxio.io</div>
    </div>`;

  // ── Addons now rows ───────────────────────────────────────────────────
  const addonNowRows = addons_now.map(item => {
    const isObj = typeof item === 'object' && item !== null;
    const name  = isObj ? (item.name || '') : String(item);
    const lib   = ADDON_LIBRARY[name] || {};
    const desc  = (isObj ? item.desc        : null) ?? lib.desc        ?? '';
    const price = (isObj ? item.price_label : null) ?? lib.price_label ?? '';
    const cad   = (isObj ? item.cadence     : null) ?? lib.cadence     ?? '';
    if (!name) return '';
    return `<div class="phase2-item">
      <div>
        <div class="phase2-name">${escape(name)}</div>
        <div class="phase2-timing">Included</div>
      </div>
      <div class="phase2-desc">${escape(desc)}</div>
      <div class="phase2-price">
        <span class="amount">${escape(price)}</span>
        <span class="cadence">${escape(cad)}</span>
      </div>
    </div>`;
  }).join('');

  // ── OS blocks for system page ─────────────────────────────────────────
  const osBlocks = osTypes.map(osName => {
    const mods = modules[osName] || [];
    const desc = OS_DESCRIPTIONS[osName] || '';
    // Recommended add-ons for this OS from addons_later that relate to it
    return `<div class="os-block">
      <div class="os-name-row">
        <div class="os-name">${escape(osName)}</div>
      </div>
      ${desc ? `<div class="os-desc">${escape(desc)}</div>` : ''}
      <div class="modules-label">Modules Included</div>
      <div class="modules-inline">
        ${mods.map(m => `<span>${escape(m)}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  // ── Addons later rows ─────────────────────────────────────────────────
  const addonLaterRows = addons_later.map(name => {
    const a = ADDON_LIBRARY[name];
    if (!a) return '';
    return `<div class="phase2-item">
      <div>
        <div class="phase2-name">${escape(name)}</div>
        <div class="phase2-timing">${escape(a.timing)}</div>
      </div>
      <div class="phase2-desc">${escape(a.desc)}</div>
      <div class="phase2-price">
        <span class="amount">${escape(a.price_label)}</span>
        <span class="cadence">${escape(a.cadence)}</span>
      </div>
    </div>`;
  }).filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Opxio — ${escape(os_type || 'System')} Proposal · ${escape(company_name)}</title>
<style>${CSS}</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════ PAGE 1 — PROBLEM -->
<div class="page">
  <div class="page-body">

    <div class="doc-header">
      <div>
        <div class="doc-title">${escape(company_name)}</div>
        <div class="doc-subtitle">System Installation</div>
      </div>
      <div class="doc-meta">
        ${contact_name ? `<div class="doc-meta-row"><span class="doc-meta-label">Contact</span><span class="doc-meta-value">${escape(contact_name)}</span></div>` : ''}
        <div class="doc-meta-row"><span class="doc-meta-label">Valid Until</span><span class="doc-meta-value">${escape(validUntilText)}</span></div>
        <div class="doc-meta-row"><span class="doc-meta-label">Prepared By</span><span class="doc-meta-value">Kai · Opxio</span></div>
      </div>
    </div>

    <div class="prob-section">
      <div class="prob-heading">What we heard:</div>
      ${situationText
        ? `<div class="prob-body">${escape(situationText)}</div>`
        : `<div class="prob-placeholder">[Root situation. What the client told us. Not lack of leads — lack of infrastructure.]</div>`}
    </div>

    <div class="prob-section">
      <div class="prob-heading">The Core Problem</div>
      ${problemsText
        ? `<div class="prob-body">${escape(problemsText)}</div>`
        : `<div class="prob-placeholder">[Root cause. What is actually broken underneath the surface.]</div>`}
    </div>

    <div class="prob-section">
      <div class="prob-heading">What This Costs</div>
      ${goalsText
        ? `<div class="prob-body">${escape(goalsText)}</div>`
        : `<div class="prob-placeholder">[Business consequence. Revenue, time, founder bottleneck. Numbers where possible.]</div>`}
    </div>

  </div>
  ${footer}
</div>

<!-- ═══════════════════════════════════════════════════════ PAGE 2 — SYSTEM -->
<div class="page">
  <div class="page-body">

    <div class="sys-heading">Your Recommended System</div>
    <div class="sys-subtitle">Every component connects into one system built around how ${escape(company_name)} actually operates.</div>

    <!-- Base OS — always complimentary -->
    <div class="os-block">
      <div class="os-name-row">
        <div class="os-name">Base OS</div>
        <div class="os-badge">(Complimentary — always included with every installation)</div>
      </div>
      <div class="os-desc">The core modules that shape the foundation of your system.</div>
      <div class="modules-label">Modules Included</div>
      <div class="modules-inline">
        ${BASE_OS_MODULES.map(m => `<span>${escape(m)}</span>`).join('')}
      </div>
    </div>

    <!-- Installed OS layers -->
    ${osBlocks || `<div class="os-block"><div class="os-name">System scope to be confirmed on discovery call.</div></div>`}

    <!-- Add-ons included in this proposal -->
    ${addons_now.length ? `
    <div style="margin-top:20px">
      <div class="modules-label" style="margin-bottom:10px">Included Add-Ons</div>
      ${addonNowRows}
    </div>` : ''}

    <!-- Available any time -->
    ${addons_later.length ? `
    <div style="margin-top:20px">
      <div class="modules-label" style="margin-bottom:10px">Recommended Add-Ons — Available Any Time</div>
      <div class="addons-inline">
        ${addons_later.map(n => `<span>${escape(n)}</span>`).join('')}
      </div>
    </div>` : ''}

  </div>
  ${footer}
</div>

<!-- ═══════════════════════════════════════════════════ PAGE 3 — INVESTMENT -->
<div class="page">
  <div class="page-body">

    <div class="inv-heading">Investment</div>

    <table class="inv-table">
      <thead>
        <tr>
          <th style="width:55%">Item</th>
          <th>Type</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="inv-item-name">Base OS</div>
            <div class="inv-item-desc">Companies & People · Client Accounts · Team Members · Company Profile · Dashboard Hub</div>
          </td>
          <td style="font-size:11px;color:var(--muted)">Complimentary</td>
          <td>—</td>
        </tr>
        ${osTypes.map(osName => {
          const mods = modules[osName] || [];
          return `<tr>
            <td>
              <div class="inv-item-name">${escape(osName)}</div>
              <div class="inv-item-desc">${mods.slice(0, 3).map(m => escape(m)).join(' · ')}${mods.length > 3 ? ' + more' : ''}</div>
            </td>
            <td style="font-size:11px;color:var(--muted)">One-time</td>
            <td>${coreFee && osTypes.length === 1 ? fmt(coreFee) : '—'}</td>
          </tr>`;
        }).join('')}
        ${addons_now.map(item => {
          const isObj = typeof item === 'object' && item !== null;
          const name  = isObj ? (item.name || '') : String(item);
          const lib   = ADDON_LIBRARY[name] || {};
          const price = (isObj ? item.price_label : null) ?? lib.price_label ?? '';
          const cad   = (isObj ? item.cadence     : null) ?? lib.cadence     ?? '';
          if (!name) return '';
          return `<tr>
            <td><div class="inv-item-name">${escape(name)}</div></td>
            <td style="font-size:11px;color:var(--muted)">${escape(cad || 'One-time')}</td>
            <td>${escape(price || '—')}</td>
          </tr>`;
        }).join('')}
        <tr>
          <td>
            <div class="inv-item-name">Notion ${escape(notion_plan)} Plan</div>
            <div class="inv-item-desc">Required for automations and widget embedding. Billed directly to your workspace.</div>
          </td>
          <td style="font-size:11px;color:var(--muted)">Monthly · client</td>
          <td>~RM 50/mo</td>
        </tr>
        ${coreFee ? `<tr class="total-row">
          <td colspan="2">Total Installation Fee</td>
          <td>${fmt(coreFee)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    ${coreFee ? `<div class="inv-note">50% deposit (${fmt(deposit)}) required to begin. Balance due on handover.</div>` : ''}

    <div class="inv-terms">
      <div class="inv-term-item"><label>Payment Terms</label><span>50% deposit · 50% on delivery</span></div>
      <div class="inv-term-item"><label>Delivery Timeline</label><span>${escape(timeline)} from deposit</span></div>
      <div class="inv-term-item"><label>Notion Workspace</label><span>Client-owned — yours permanently</span></div>
      <div class="inv-term-item"><label>Handover</label><span>Walkthrough session included</span></div>
    </div>

    <!-- Next steps -->
    <div style="margin-top:40px">
      <div class="steps-heading">How to proceed</div>
      <div class="steps-list">
        <div class="step-row">
          <div class="step-num">01</div>
          <div>
            <div class="step-text-head">Confirm scope</div>
            <div class="step-text-desc">Reply to this proposal or message Kai on WhatsApp to confirm the install and ask anything.</div>
          </div>
        </div>
        <div class="step-row">
          <div class="step-num">02</div>
          <div>
            <div class="step-text-head">Pay deposit</div>
            <div class="step-text-desc">${coreFee ? `${fmt(deposit)} (50%)` : '50% of installation fee'} to secure your implementation slot and begin the build.</div>
          </div>
        </div>
        <div class="step-row">
          <div class="step-num">03</div>
          <div>
            <div class="step-text-head">Onboarding call</div>
            <div class="step-text-desc">30 minutes to map your existing data, confirm workspace access, and set the build timeline.</div>
          </div>
        </div>
        <div class="step-row">
          <div class="step-num">04</div>
          <div>
            <div class="step-text-head">Build and handover</div>
            <div class="step-text-desc">${escape(timeline)} to full installation. Walkthrough session on delivery.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="cta-strip">
      <div class="cta-line">Ready to move forward?</div>
      <div class="cta-contacts">
        ${whatsapp ? `<div class="cta-contact"><label>WhatsApp</label>${escape(whatsapp)}</div>` : ''}
        <div class="cta-contact"><label>Email</label>${escape(email)}</div>
        <div class="cta-contact"><label>Website</label>${escape(website)}</div>
      </div>
    </div>

  </div>
  ${footer}
</div>

</body>
</html>`;
}

// ─── NOTION PAYLOAD MAPPER ─────────────────────────────────────────────────
// Maps a Notion automation webhook body to proposal data
// ─── DEFAULT MODULE SETS PER OS TYPE ──────────────────────────────────────
// Used to auto-fill module lists when none are explicitly selected in Notion.
// Explicitly selected modules always take precedence over these defaults.
const OS_DEFAULT_MODULES = {
  // ── Core OS layers (individual — combine freely) ──────────────────────
  'Revenue OS':    { 'Revenue OS':    ['CRM, Pipeline & Deals', 'Product & Pricing Catalogue', 'Billing & Payment Tracker', 'Retainer Management', 'Meetings & Calls Log'] },
  'Operations OS': { 'Operations OS': ['Project & Task Management', 'Client Delivery Tracker', 'Approval & QC Tracker', 'Internal Meeting & Action Log', 'Resource & Capacity Planner'] },
  'Marketing OS':  { 'Marketing OS':  ['Content Production Tracker', 'Campaign Tracker', 'Lead Generation Tracker', 'Marketing Performance Tracker', 'Brand & Asset Library'] },
  'Finance OS':    { 'Finance OS':    ['Finance Ledger', 'Cash Flow Tracker', 'Invoice & Payment Tracker', 'Payroll & Staff Costs', 'Profit & Loss Tracker'] },
  // ── Additional OS layers ──────────────────────────────────────────────
  'Team OS':       { 'Team OS':       ['Hiring Pipeline', 'Team Onboarding Tracker', 'Performance & Goals', 'Leave & Availability', 'Role & Compensation Log'] },
  'Retention OS':  { 'Retention OS':  ['Client Health Tracker', 'Client Communication Log', 'Renewal Pipeline', 'Upsell Opportunity Tracker', 'Retainer Health Tracker'] },
  'Sales OS':      { 'Sales OS':      ['Sales Team Performance Tracker', 'Outreach & Activity Log', 'Quota & Target Tracker', 'Win/Loss Analysis', 'Sales Playbook Library'] },
  // ── Legacy bundle names — kept for backward compat ───────────────────
  'Business OS':   { 'Revenue OS':    ['CRM, Pipeline & Deals', 'Product & Pricing Catalogue', 'Billing & Payment Tracker', 'Retainer Management', 'Meetings & Calls Log'],
                     'Operations OS': ['Project & Task Management', 'Client Delivery Tracker', 'Approval & QC Tracker', 'Internal Meeting & Action Log', 'Resource & Capacity Planner'] },
  'Agency OS':     { 'Revenue OS':    ['CRM, Pipeline & Deals', 'Product & Pricing Catalogue', 'Billing & Payment Tracker', 'Retainer Management', 'Meetings & Calls Log'],
                     'Operations OS': ['Project & Task Management', 'Client Delivery Tracker', 'Approval & QC Tracker', 'Internal Meeting & Action Log', 'Resource & Capacity Planner'],
                     'Marketing OS':  ['Content Production Tracker', 'Campaign Tracker', 'Lead Generation Tracker', 'Marketing Performance Tracker', 'Brand & Asset Library'] },
};

// Default add-ons to suggest as "available later" based on OS type.
// These are the natural expansion paths + standard add-ons for each installed OS.
const OS_DEFAULT_ADDONS_LATER = {
  'Revenue OS':    ['Operations OS', 'Finance OS', 'Retention OS', 'Sales OS', 'Enhanced Dashboard', 'Document Generation Suite', 'Lead Capture System', 'Payment Reminder Automation', 'Client Portal View'],
  'Operations OS': ['Revenue OS', 'Finance OS', 'Team OS', 'Enhanced Dashboard', 'Project Kickoff Automation', 'Client Onboarding Kickoff Automation', 'SOP & Playbook Library', 'Client Portal View'],
  'Marketing OS':  ['Revenue OS', 'Operations OS', 'Retention OS', 'Ads Platform Integration', 'Campaign Kickoff Automation', 'UTM & Link Tracker', 'Enhanced Dashboard', 'Client Portal View'],
  'Finance OS':    ['Revenue OS', 'Operations OS', 'Team OS', 'Enhanced Dashboard', 'Expense Management', 'Tax & Compliance Tracker', 'Client Profitability Tracker', 'Client Portal View'],
  'Team OS':       ['Revenue OS', 'Retention OS', 'Hiring Kickoff Automation', 'Training & Development Tracker', 'Enhanced Dashboard', 'Client Portal View'],
  'Retention OS':  ['Revenue OS', 'Marketing OS', 'Sales OS', 'Renewal Kickoff Automation', 'NPS & Feedback Log', 'Enhanced Dashboard', 'Client Portal View'],
  'Sales OS':      ['Revenue OS', 'Retention OS', 'Operations OS', 'Sales Forecast Tracker', 'Enhanced Dashboard', 'Client Portal View'],
  // Legacy bundle names
  'Business OS':   ['Marketing OS', 'Finance OS', 'Team OS', 'Retention OS', 'Enhanced Dashboard', 'Project Kickoff Automation', 'Client Onboarding Kickoff Automation', 'Document Generation Suite', 'Lead Capture System', 'Client Portal View'],
  'Agency OS':     ['Finance OS', 'Team OS', 'Retention OS', 'Enhanced Dashboard', 'Project Kickoff Automation', 'Campaign Kickoff Automation', 'Client Onboarding Kickoff Automation', 'Document Generation Suite', 'Client Portal View'],
};

function mapNotionPayload(body) {
  const props = body.data?.properties || body.properties || {};

  function text(key) {
    const p = props[key];
    if (!p) return '';
    if (p.title)                return p.title.map(t => t.plain_text).join('');
    if (p.rich_text)            return p.rich_text.map(t => t.plain_text).join('');
    if (p.select)               return p.select?.name || '';
    if (p.number !== undefined) return p.number ?? '';
    if (p.phone_number)         return p.phone_number;
    if (p.email)                return p.email;
    if (p.url)                  return p.url;
    if (p.date)                 return p.date?.start || '';
    if (p.formula)              return (p.formula?.string || p.formula?.number) ?? '';
    if (p.rollup)               return (p.rollup?.number ?? p.rollup?.array?.[0]?.plain_text) || '';
    return '';
  }

  function multiSelect(key) {
    const p = props[key];
    if (!p || !p.multi_select) return [];
    return p.multi_select.map(s => s.name);
  }

  const osType = text('OS Type');
  const defaults = OS_DEFAULT_MODULES[osType] || {};

  // For each OS group: use explicit Notion selection if present, otherwise
  // fall back to the full default module list for that OS type.
  const rev = multiSelect('Revenue Modules');
  const ops = multiSelect('Operations Modules');
  const mkt = multiSelect('Marketing Modules');
  const team = multiSelect('Team Modules');
  const ret  = multiSelect('Retention Modules');

  const modules = {};
  modules['Revenue OS']    = rev.length  ? rev  : (defaults['Revenue OS']    || []);
  modules['Operations OS'] = ops.length  ? ops  : (defaults['Operations OS'] || []);
  modules['Marketing OS']  = mkt.length  ? mkt  : (defaults['Marketing OS']  || []);
  modules['Team OS']       = team.length ? team : (defaults['Team OS']       || []);
  modules['Retention OS']  = ret.length  ? ret  : (defaults['Retention OS']  || []);

  // Remove empty groups (OS not included in this install)
  for (const key of Object.keys(modules)) {
    if (!modules[key].length) delete modules[key];
  }

  // For known OS types, strip any module groups not part of the installed package.
  // This prevents stale Notion field data (e.g. Team Modules filled from a rename)
  // from bleeding into proposals where that OS group wasn't sold.
  // Starter OS and Micro Install are flexible — don't filter them.
  const flexibleOS = new Set(['Starter OS', 'Micro Install', 'Micro Install — 1 Module', 'Micro Install — 2 Modules', 'Micro Install — 3 Modules']);
  if (osType && !flexibleOS.has(osType) && Object.keys(defaults).length > 0) {
    const allowedGroups = new Set(Object.keys(defaults));
    for (const key of Object.keys(modules)) {
      if (!allowedGroups.has(key)) delete modules[key];
    }
  }

  // Add-ons now: always explicit (scoped per deal)
  const addons_now = multiSelect('Add-Ons Now');

  // Add-ons later: explicit if set, otherwise auto-suggest based on OS type
  let addons_later = multiSelect('Add-Ons Later');
  if (!addons_later.length && osType) {
    addons_later = OS_DEFAULT_ADDONS_LATER[osType] || [];
  }

  return {
    ref_number:   text('Ref Number'),
    date:         text('Date'),
    valid_until:  text('Valid Until'),
    company_name: text('Company Name'),
    contact_name: text('Contact Name'),
    contact_role: text('Contact Role'),
    whatsapp:     text('WhatsApp'),
    email:        'hello@opxio.io',
    website:      'opxio.io',
    os_type:      osType,
    install_tier: text('Install Tier')  || 'Standard',
    notion_plan:  text('Notion Plan')   || 'Plus',
    timeline:     text('Timeline')      || '3\u20134 weeks',
    fee:          Number(text('Fee'))   || 0,
    retainer:     (text('Retainer Tier') || 'maintenance').toLowerCase(),
    situation:    [
      text('Situation Line 1'),
      text('Situation Line 2'),
      text('Situation Line 3'),
    ].filter(Boolean),
    modules,
    addons_now,
    addons_later,
  };
}
// ─── PREFILL PAYLOAD ───────────────────────────────────────────────────────
// Returns the Notion PATCH properties object to pre-populate a Proposal CRM
// page based on the OS Type. Call this when "Pre-fill" button fires.
// Each key maps to a Notion property name; values are Notion multi_select arrays.
function getPrefillPayload(osType) {
  const moduleDefs = OS_DEFAULT_MODULES[osType] || {};
  const addonsList = OS_DEFAULT_ADDONS_LATER[osType] || [];

  const properties = {};

  // Map OS group → Notion field name
  const fieldMap = {
    'Revenue OS':    'Revenue Modules',
    'Operations OS': 'Operations Modules',
    'Marketing OS':  'Marketing Modules',
    'Team OS':       'Team Modules',
    'Retention OS':  'Retention Modules',
  };

  for (const [osGroup, fieldName] of Object.entries(fieldMap)) {
    const mods = moduleDefs[osGroup] || [];
    properties[fieldName] = { multi_select: mods.map(n => ({ name: n })) };
  }

  properties['Add-Ons Later'] = {
    multi_select: addonsList.map(n => ({ name: n })),
  };

  return properties;
}

export { renderProposal, mapNotionPayload, getPrefillPayload, OS_DEFAULT_MODULES, OS_DEFAULT_ADDONS_LATER };






