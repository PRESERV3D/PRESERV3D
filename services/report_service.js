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
  const { data } = await supabase
    .from('logins')
    .select('user_id')
    .gte('login_at', startDate.toString())
    .lte('login_at', endDate.toString())

  const activeUsers = new Set((data || []).map((r) => r.user_id)).size

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

  // Total artifacts
  const { count: totalArtifacts } = await supabase
    .from('artifacts_metadata')
    .select('*', { count: 'exact', head: true })
    .lte('uploaded_at', endDate.toString())

  // Uploaded Artifacts
  const { count: uploadedArtifacts } = await supabase
    .from('artifacts_metadata')
    .select('*', { count: 'exact', head: true })
    .gte('uploaded_at', startDate.toString())
    .lte('uploaded_at', endDate.toString())

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

  // Total Documents
  const { count: totalDocuments } = await supabase
    .from('documents_metadata')
    .select('*', { count: 'exact', head: true })
    .lte('uploaded_at', endDate.toString())

  // Uploaded Documents
  const { count: uploadedDocuments } = await supabase
    .from('documents_metadata')
    .select('*', { count: 'exact', head: true })
    .gte('uploaded_at', startDate.toString())
    .lte('uploaded_at', endDate.toString())

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

  const TABLE_WIDTH = 150
  const pageWidth = doc.internal.pageSize.getWidth()
  const centeredMargin = {
    left: (pageWidth - TABLE_WIDTH) / 2,
    right: (pageWidth - TABLE_WIDTH) / 2,
  }

  const tableOptions = {
    theme: 'grid',
    styles: {
      halign: 'center', // text inside cells
      valign: 'middle',
      fontSize: 11,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 100 }, // label
      1: { halign: 'center', cellWidth: 50 }, // value
    },
    tableWidth: TABLE_WIDTH,
    margin: centeredMargin,
  }

  const tableOptions3Col = {
    theme: 'grid',
    styles: { fontSize: 11, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
    },
    tableWidth: TABLE_WIDTH,
    margin: centeredMargin,
  }

  const title = 'PRESERV3D Monthly Usage Report'
  const textWidth = doc.getTextWidth(title)

  // Title (centered)
  doc.setFontSize(16)
  doc.text(title, (pageWidth - textWidth) / 2, 20)
  doc.setFontSize(14)
  doc.text(`${months[month.value - 1]} ${year.value}`, pageWidth / 2, 27, {
    align: 'center',
  })
  let currentY = 40

  doc.setFontSize(14)
  doc.text('Users Overview', pageWidth / 2, currentY, { align: 'center' })
  currentY += 5

  // Summary table
  doc.setFontSize(12)
  autoTable(doc, {
    ...tableOptions3Col,
    startY: currentY,
    head: [['Total Users', 'New Users', 'Active Users']],
    body: [[totalUsers ?? 0, newUsers ?? 0, activeUsers ?? 0]],
  })
  currentY = doc.lastAutoTable.finalY + 5

  // User type stats
  if (userTypeStats && userTypeStats.length > 0) {
    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      head: [['User Type', 'Count']],
      body: userTypeStats.map((u) => [u.type, u.count]),
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  // Students section
  if (departmentStats && departmentStats.length > 0) {
    doc.setFontSize(12)
    doc.text('Students', pageWidth / 2, currentY, { align: 'center' })

    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      head: [['Department', 'Users']],
      body: departmentStats.map((d) => [d.name, d.users]),
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  // Faculty section
  if (facultyDepartmentStats && facultyDepartmentStats.length > 0) {
    doc.setFontSize(12)
    doc.text('Faculty', pageWidth / 2, currentY, { align: 'center' })

    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      head: [['Department', 'Users']],
      body: facultyDepartmentStats.map((d) => [d.name, d.users]),
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  // Visitors section
  if (institutionStats && institutionStats.length > 0) {
    doc.setFontSize(12)
    doc.text('Visitors', pageWidth / 2, currentY, { align: 'center' })
    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      head: [['Institution', 'Users']],
      body: institutionStats.map((i) => [i.name, i.users]),
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  doc.setFontSize(14)
  doc.text('Artifacts & Documents Overview', pageWidth / 2, currentY, { align: 'center' })
  currentY += 7

  // Combined Artifacts & Documents table
  autoTable(doc, {
    ...tableOptions3Col,
    columnStyles: {
      0: { halign: 'left' },
    },
    startY: currentY,
    head: [['Type', 'Uploaded', 'Total']],
    body: [
      ['Artifacts', uploadedArtifacts ?? 0, totalArtifacts ?? 0],
      ['Documents', uploadedDocuments ?? 0, totalDocuments ?? 0],
    ],
  })
  currentY = doc.lastAutoTable.finalY + 10

  // Top Artifacts
  doc.setFontSize(12)
  doc.text('Top Artifacts', pageWidth / 2, currentY, { align: 'center' })
  autoTable(doc, {
    ...tableOptions,
    startY: currentY + 5,
    head: [['Name', 'Views']],
    body: topArtifacts?.map((a) => [a.name, a.views]) ?? [],
  })
  currentY = doc.lastAutoTable.finalY + 10

  // Top Documents
  doc.setFontSize(12)
  doc.text('Top Documents', pageWidth / 2, currentY, { align: 'center' })
  autoTable(doc, {
    ...tableOptions,
    startY: currentY + 5,
    head: [['Name', 'Views']],
    body: topDocuments?.map((d) => [d.name, d.views]) ?? [],
  })
  currentY = doc.lastAutoTable.finalY + 10

  // Summary table
  doc.setFontSize(14)
  doc.text('Summary Overview', pageWidth / 2, currentY, { align: 'center' })
  autoTable(doc, {
    ...tableOptions,
    startY: currentY + 5,
    head: [['Category', 'Value']],
    body: [
      ['Total Users', totalUsers ?? 0],
      ['New Users', newUsers ?? 0],
      ['Active Users', activeUsers ?? 0],
      ['Total Artifacts', totalArtifacts ?? 0],
      ['Uploaded Artifacts', uploadedArtifacts ?? 0],
      ['Total Documents', totalDocuments ?? 0],
      ['Uploaded Documents', uploadedDocuments ?? 0],
    ],
  })

  // Download
  doc.save(`PRESERV3D_UsageReport_${year.value}-${months[month.value - 1]}.pdf`)
}
