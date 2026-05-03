// pages/shin-supplies/[widget].js
// Flat routing for Shin Supplies custom widgets.
// Lookup order:
//   1. public/widgets/shin-supplies/[widget].html  (bespoke override)
//   2. public/widgets/revenue/[widget].html         (standard fallback)
//   3. public/widgets/operations/[widget].html
//   4. public/widgets/finance/[widget].html
// Pattern for all future custom clients: pages/[slug]/[widget].js

import fs from 'fs'
import path from 'path'

export default function WidgetPage() { return null }

export async function getServerSideProps({ params, res }) {
  const { widget } = params
  const publicDir = path.join(process.cwd(), 'public', 'widgets')

  const candidates = [
    path.join(publicDir, 'shin-supplies', `${widget}.html`),
    path.join(publicDir, 'revenue',       `${widget}.html`),
    path.join(publicDir, 'operations',    `${widget}.html`),
    path.join(publicDir, 'finance',       `${widget}.html`),
  ]

  let html = null
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      html = fs.readFileSync(candidate, 'utf8')
      break
    }
  }

  if (!html) return { notFound: true }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('X-Frame-Options', 'ALLOWALL')
  res.setHeader('Content-Security-Policy', 'frame-ancestors *')
  res.write(html)
  res.end()

  return { props: {} }
}
