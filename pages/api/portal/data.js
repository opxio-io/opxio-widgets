// GET /api/portal/data?project_id=xxx
// No auth in V1 — project_id acts as the access token (UUID, not guessable)

import { getPage, queryDB, plain, DB, hdrs } from '../../../lib/notion'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { project_id } = req.query
  if (!project_id) return res.status(400).json({ error: 'project_id required' })

  const nToken = process.env.NOTION_API_KEY

  try {
    // 1. Project
    const projectPage = await getPage(project_id, nToken)
    const pp = projectPage.properties

    const projectName = plain(pp['Project Name']?.title || pp.Name?.title || [])
    const projectStatus =
      pp.Status?.status?.name || pp.Status?.select?.name || null
    const targetDate =
      pp['Target Date']?.date?.start ||
      pp['Delivery Date']?.date?.start ||
      pp['Deadline']?.date?.start || null
    const companyRel = pp.Company?.relation?.[0]?.id?.replace(/-/g, '') || null

    // 2. Company name
    let company = { name: '', id: companyRel }
    if (companyRel) {
      try {
        const cp = await getPage(companyRel, nToken)
        const titleProp = Object.values(cp.properties).find(p => p.type === 'title')
        company.name = plain(titleProp?.title || [])
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
        status: p.properties.Status?.status?.name || p.properties.Status?.select?.name || 'Not Started',
        order: p.properties.Order?.number || p.properties['Phase Number']?.number || 0,
        target_date: p.properties['Target Date']?.date?.start || null,
      }))
      .sort((a, b) => a.order - b.order)

    // 4. Tasks
    const taskResults = await queryDB(DB.TASKS, {
      property: 'Project', relation: { contains: project_id }
    }, nToken).catch(() => [])

    const tasks = taskResults
      .map(t => ({
        id: t.id.replace(/-/g, ''),
        name: plain(t.properties['Task Name']?.title || t.properties.Name?.title || []),
        status: t.properties.Status?.status?.name || t.properties.Status?.select?.name || 'To Do',
        phase_id: t.properties.Phase?.relation?.[0]?.id?.replace(/-/g, '') || null,
        order: t.properties.Order?.number || 0,
      }))
      .sort((a, b) => a.order - b.order)

    // 5. Invoices
    const invoiceResults = await queryDB(DB.INVOICE, {
      property: 'Project', relation: { contains: project_id }
    }, nToken).catch(() => [])

    const invoices = invoiceResults.map(inv => {
      const ip = inv.properties
      return {
        id: inv.id.replace(/-/g, ''),
        number: plain(ip['Invoice Number']?.title || ip.Name?.title || []),
        type: ip['Invoice Type']?.select?.name || 'Invoice',
        status: ip.Status?.status?.name || ip.Status?.select?.name || 'Awaiting Payment',
        amount: ip['Amount (MYR)']?.number || ip.Amount?.number || 0,
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
        status: ep.Status?.status?.name || ep.Status?.select?.name || 'In Scope',
        target_date: ep['Target Date']?.date?.start || ep['Delivery Date']?.date?.start || null,
      }
    })

    return res.json({ project: { id: project_id, name: projectName, status: projectStatus, target_date: targetDate }, phases, tasks, invoices, expansions, company })
  } catch (e) {
    console.error('[portal/data]', e)
    return res.status(500).json({ error: e.message })
  }
}
