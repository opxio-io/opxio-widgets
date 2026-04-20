// GET /api/portal/data?project_id=xxx
// Returns project, phases, tasks, invoices, expansions, company
// Requires portal_session cookie

import { createClient } from '@supabase/supabase-js'
import { getPage, queryDB, plain, DB, hdrs } from '../../../lib/notion'
import { parse } from 'cookie'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function validateSession(req, projectId) {
  const cookies = parse(req.headers.cookie || '')
  const sessionToken = cookies.portal_session
  if (!sessionToken) return false

  const { data, error } = await supabase
    .from('portal_sessions')
    .select('project_id')
    .eq('token', sessionToken)
    .eq('project_id', projectId)
    .gt('expires_at', new Date().toISOString())
    .single()

  return !error && !!data
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return dateStr
}

function getStatus(props) {
  return props.Status?.status?.name ||
         props.Status?.select?.name ||
         props['Status']?.status?.name || null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { project_id } = req.query
  if (!project_id) return res.status(400).json({ error: 'project_id required' })

  const authorized = await validateSession(req, project_id)
  if (!authorized) return res.status(401).json({ error: 'unauthorized' })

  const nToken = process.env.NOTION_API_KEY

  try {
    // 1. Project
    const projectPage = await getPage(project_id, nToken)
    const pp = projectPage.properties

    const projectName = plain(pp['Project Name']?.title || pp.Name?.title || [])
    const projectStatus = getStatus(pp)
    const targetDate = pp['Target Date']?.date?.start || pp['Delivery Date']?.date?.start || null
    const companyRel = pp.Company?.relation?.[0]?.id?.replace(/-/g, '') || null

    // 2. Company
    let company = { name: '', id: companyRel }
    if (companyRel) {
      try {
        const cp = await getPage(companyRel, nToken)
        const name = Object.values(cp.properties).find(p => p.type === 'title')
        company.name = plain(name?.title || [])
      } catch {}
    }

    // 3. Phases
    const phaseResults = await queryDB(DB.PHASES, {
      property: 'Project', relation: { contains: project_id }
    }, nToken)

    const phases = phaseResults
      .map(p => ({
        id: p.id.replace(/-/g, ''),
        name: plain(p.properties['Phase Name']?.title || p.properties.Name?.title || []),
        status: getStatus(p.properties) || 'Not Started',
        order: p.properties.Order?.number || p.properties['Phase Number']?.number || 0,
        target_date: p.properties['Target Date']?.date?.start || null,
      }))
      .sort((a, b) => a.order - b.order)

    // 4. Tasks (for all phases)
    let tasks = []
    if (phases.length) {
      const taskResults = await queryDB(DB.TASKS, {
        property: 'Project', relation: { contains: project_id }
      }, nToken)

      tasks = taskResults.map(t => ({
        id: t.id.replace(/-/g, ''),
        name: plain(t.properties['Task Name']?.title || t.properties.Name?.title || []),
        status: getStatus(t.properties) || 'To Do',
        phase_id: t.properties.Phase?.relation?.[0]?.id?.replace(/-/g, '') || null,
        order: t.properties.Order?.number || 0,
      })).sort((a, b) => a.order - b.order)
    }

    // 5. Invoices
    const invoiceResults = await queryDB(DB.INVOICE, {
      property: 'Project', relation: { contains: project_id }
    }, nToken)

    const invoices = invoiceResults.map(inv => {
      const ip = inv.properties
      const numProp = plain(ip['Invoice Number']?.title || ip.Name?.title || [])
      return {
        id: inv.id.replace(/-/g, ''),
        number: numProp || 'INV',
        type: ip['Invoice Type']?.select?.name || 'Invoice',
        status: getStatus(ip) || 'Awaiting Payment',
        amount: ip['Amount (MYR)']?.number || ip.Amount?.number || 0,
        currency: 'MYR',
        date: ip['Issue Date']?.date?.start || ip.Date?.date?.start || null,
      }
    })

    // 6. Expansions
    const expansionResults = await queryDB(DB.EXPANSIONS, {
      property: 'Project', relation: { contains: project_id }
    }, nToken).catch(() => [])

    const expansions = expansionResults.map(exp => {
      const ep = exp.properties
      return {
        id: exp.id.replace(/-/g, ''),
        name: plain(ep.Name?.title || ep['Expansion Name']?.title || []),
        status: getStatus(ep) || 'In Scope',
        target_date: ep['Target Date']?.date?.start || ep['Delivery Date']?.date?.start || null,
      }
    })

    return res.json({ project: { id: project_id, name: projectName, status: projectStatus, target_date: targetDate }, phases, tasks, invoices, expansions, company })
  } catch (e) {
    console.error('[portal/data]', e)
    return res.status(500).json({ error: e.message })
  }
}
