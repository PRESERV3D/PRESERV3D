// services/report_service.js
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

  const startDate = new Date(year.value, month.value - 1, 1).toISOString()
  const endDate = new Date(year.value, month.value, 0, 23, 59, 59).toISOString()

  console.log('Generating report for:', startDate, endDate)

  // Supabase Queries
  // Total registered users
  const { count: totalUsers } = await supabase
    .from('all_approved_users')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', endDate.toString())
    .neq('user_type', 'admin')

  // New users for that month
  const { count: newUsers, error } = await supabase
    .from('all_approved_users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toString())
    .lte('created_at', endDate.toString())
    .neq('user_type', 'admin')

  if (error) console.error(error)

  // Active users (logged in that month)
  const { count: activeUsers } = await supabase
    .from('logins')
    .select('user_id', { count: 'exact', head: true })
    .gte('login_at', startDate.toString())
    .lte('login_at', endDate.toString())

  // Users by user type
  const { data: usersByTypeData } = await supabase
    .from('all_approved_users')
    .select('user_type')
    .lte('created_at', endDate.toString())
    .neq('user_type', 'admin')

  const userTypeCount = {}
  usersByTypeData?.forEach((u) => {
    userTypeCount[u.user_type] = (userTypeCount[u.user_type] || 0) + 1
  })
  const userTypeStats = Object.entries(userTypeCount).map(([type, count]) => ({ type, count }))

  // Students by department
  const { data: departments } = await supabase
    .from('registered_users')
    .select('department')
    .lte('created_at', endDate.toString())

  const deptCount = {}
  departments?.forEach((u) => {
    deptCount[u.department] = (deptCount[u.department] || 0) + 1
  })
  const departmentStats = Object.entries(deptCount).map(([name, users]) => ({ name, users }))

  // Faculty by department
  const { data: facultyDepartments } = await supabase
    .from('registered_faculty')
    .select('department')
    .lte('created_at', endDate.toString())

  const facultyDeptCount = {}
  facultyDepartments?.forEach((u) => {
    facultyDeptCount[u.department] = (facultyDeptCount[u.department] || 0) + 1
  })
  const facultyDepartmentStats = Object.entries(facultyDeptCount).map(([name, users]) => ({
    name,
    users,
  }))

  // Visitors by institution
  const { data: visitorDepartments } = await supabase
    .from('registration_visitors')
    .select('institution')
    .lte('created_at', endDate.toString())
    .eq('status', 'Approved')

  const visitorDeptCount = {}
  visitorDepartments?.forEach((u) => {
    visitorDeptCount[u.institution] = (visitorDeptCount[u.institution] || 0) + 1
  })
  const institutionStats = Object.entries(visitorDeptCount).map(([name, users]) => ({
    name,
    users,
  }))

  // Top viewed artifacts
  const { data: artifactLogs } = await supabase
    .from('user_activity_log')
    .select('item_id')
    .lte('clicked_at', endDate.toString())
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
    .select('item_id, title')
    .in(
      'item_id',
      sortedArtifacts.map(([id]) => id),
    )

  const topArtifacts = sortedArtifacts.map(([id, views]) => {
    const meta = artifactsMeta?.find((a) => a.item_id === id)
    return { name: meta?.title ?? `Artifact ${id}`, views }
  })

  // Top viewed documents
  const { data: documentLogs } = await supabase
    .from('user_activity_log')
    .select('item_id')
    .lte('clicked_at', endDate.toString())
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
    const meta = documentsMeta?.find((d) => d.id === id)
    return { name: meta?.title ?? `Document ${id}`, views }
  })

  // PDF Generation
  const doc = new jsPDF()
  const title = `Monthly Usage Report - ${months[month.value - 1]} ${year.value}`
  const pageWidth = doc.internal.pageSize.getWidth()
  const textWidth = doc.getTextWidth(title)

  // Title (centered)
  doc.setFontSize(16)
  doc.text(title, (pageWidth - textWidth) / 2, 20)

  // Summary section
  doc.setFontSize(12)
  doc.text(`Total Users: ${totalUsers ?? 0}`, 14, 35)
  doc.text(`New Users: ${newUsers ?? 0}`, 14, 42)
  doc.text(`Active Users: ${activeUsers ?? 0}`, 14, 49)

  // User type stats
  autoTable(doc, {
    startY: 60,
    head: [['User Type', 'Count']],
    body: userTypeStats.map((u) => [u.type, u.count]),
  })

  // Students section
  doc.setFontSize(12)
  doc.text('Students', 14, doc.lastAutoTable.finalY + 10)
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Department', 'Users']],
    body: departmentStats.map((d) => [d.name, d.users]),
  })

  // Faculty section
  doc.setFontSize(12)
  doc.text('Faculty', 14, doc.lastAutoTable.finalY + 10)
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Department', 'Users']],
    body: facultyDepartmentStats.map((d) => [d.name, d.users]),
  })

  // Visitors section
  doc.setFontSize(12)
  doc.text('Visitors', 14, doc.lastAutoTable.finalY + 10)
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Institution', 'Users']],
    body: institutionStats.map((i) => [i.name, i.users]),
  })

  // Top Artifacts
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Top Artifacts', 'Views']],
    body: topArtifacts?.map((a) => [a.name, a.views]) ?? [],
  })

  // Top Documents
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Top Documents', 'Views']],
    body: topDocuments?.map((d) => [d.name, d.views]) ?? [],
  })

  // Download
  doc.save(`UsageReport-${year.value}-${month.value}.pdf`)
}
