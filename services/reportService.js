// services/reportService.js
import { supabase } from 'boot/supabase.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateMonthlyReport({ month, year }) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  // Supabase Queries
  // Total registered users
  const { count: totalUsers } = await supabase
    .from('all_users')
    .select('*', { count: 'exact', head: true })

  // New users for that month
  const { count: newUsers } = await supabase
    .from('all_users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Active users (logged in that month)
  const { count: activeUsers } = await supabase
    .from('logins')
    .select('*', { count: 'exact', head: true })
    .gte('login_date', startDate)
    .lte('login_date', endDate)

  // Users by department
  const { data: departments } = await supabase
    .from('registered_users')
    .select('department')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const deptCount = {}
  departments?.forEach((u) => {
    deptCount[u.department] = (deptCount[u.department] || 0) + 1
  })
  const departmentStats = Object.entries(deptCount).map(([name, users]) => ({ name, users }))

  // Top viewed artifacts
  const { data: artifactLogs } = await supabase
    .from('user_activity_log')
    .select('item_id')
    .gte('clicked_at', startDate)
    .lte('clicked_at', endDate)
    .eq('item_type', 'artifact')

  const artifactCount = {}
  artifactLogs?.forEach((log) => {
    artifactCount[log.item_id] = (artifactCount[log.item_id] || 0) + 1
  })

  const sortedArtifacts = Object.entries(artifactCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const { data: artifactsMeta } = await supabase
    .from('artifacts_view')
    .select('id, title')
    .in(
      'id',
      sortedArtifacts.map(([id]) => id),
    )

  const topArtifacts = sortedArtifacts.map(([id, views]) => {
    const meta = artifactsMeta.find((a) => a.id === id)
    return { name: meta?.title ?? `Artifact ${id}`, views }
  })

  // Top viewed documents
  const { data: documentLogs } = await supabase
    .from('user_activity_log')
    .select('item_id')
    .gte('clicked_at', startDate)
    .lte('clicked_at', endDate)
    .eq('item_type', 'document')

  const documentCount = {}
  documentLogs?.forEach((log) => {
    documentCount[log.item_id] = (documentCount[log.item_id] || 0) + 1
  })

  const sortedDocuments = Object.entries(documentCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const { data: documentsMeta } = await supabase
    .from('documents_view')
    .select('id, title')
    .in(
      'id',
      sortedDocuments.map(([id]) => id),
    )

  const topDocuments = sortedDocuments.map(([id, views]) => {
    const meta = documentsMeta.find((d) => d.id === id)
    return { name: meta?.title ?? `Document ${id}`, views }
  })

  // PDF Generation
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Monthly Usage Report - ${months[month - 1]} ${year}`, 14, 20)

  doc.setFontSize(12)
  doc.text(`Total Users: ${totalUsers ?? 0}`, 14, 35)
  doc.text(`New Users: ${newUsers ?? 0}`, 14, 42)
  doc.text(`Active Users: ${activeUsers ?? 0}`, 14, 49)

  autoTable(doc, {
    startY: 60,
    head: [['Department', 'Users']],
    body: departmentStats.map((d) => [d.name, d.users]),
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Top Artifacts', 'Views']],
    body: topArtifacts?.map((a) => [a.name, a.views]) ?? [],
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Top Documents', 'Views']],
    body: topDocuments?.map((d) => [d.name, d.views]) ?? [],
  })

  // Download the PDF
  doc.save(`UsageReport-${year}-${month}.pdf`)
}
