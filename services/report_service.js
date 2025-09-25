// services/report_service.js
import { supabase } from 'boot/supabase.js'
import { renderReportCharts } from '/services/report_charts'
import { useUserStore } from 'src/stores/user.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateMonthlyReport({ startMonth, startYear, endMonth, endYear }) {
  const userStore = useUserStore()
  const user = `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i).toLocaleString('default', { month: 'long' }),
  )

  // Date Range Setup
  const startDate = new Date(startYear, startMonth - 1, 0, 23, 59, 59).toISOString()
  const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()

  // Generate charts first (this takes the longest)
  let chartImages = {}
  try {
    console.log('Generating charts...')
    chartImages = await renderReportCharts({ startMonth, startYear, endMonth, endYear })
    console.log('Charts generated successfully')
  } catch (error) {
    console.error('Failed to generate charts:', error)
    chartImages = {}
  }

  // Supabase Queries (run in parallel for better performance)
  const [
    totalUsersResult,
    newUsersResult,
    activeUsersResult,
    usersByTypeResult,
    departmentsResult,
    facultyDepartmentsResult,
    visitorDepartmentsResult,
    totalArtifactsResult,
    uploadedArtifactsResult,
    totalDocumentsResult,
    uploadedDocumentsResult,
    artifactLogsResult,
    documentLogsResult,
  ] = await Promise.all([
    supabase
      .from('all_users')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', endDate)
      .neq('user_type', 'admin'),
    supabase
      .from('all_users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('user_type', 'admin'),
    supabase.from('logins').select('user_id').gte('login_at', startDate).lte('login_at', endDate),
    supabase
      .from('all_users')
      .select('user_type')
      .lte('created_at', endDate)
      .neq('user_type', 'admin'),
    supabase.from('registered_users').select('department').lte('created_at', endDate),
    supabase.from('registered_faculty').select('department').lte('created_at', endDate),
    supabase
      .from('registration_visitors')
      .select('institution')
      .lte('created_at', endDate)
      .eq('status', 'Approved'),
    supabase
      .from('artifacts_metadata')
      .select('*', { count: 'exact', head: true })
      .lte('uploaded_at', endDate),
    supabase
      .from('artifacts_metadata')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', startDate)
      .lte('uploaded_at', endDate),
    supabase
      .from('documents_metadata')
      .select('*', { count: 'exact', head: true })
      .lte('uploaded_at', endDate),
    supabase
      .from('documents_metadata')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', startDate)
      .lte('uploaded_at', endDate),
    supabase
      .from('user_activity_log')
      .select('item_id')
      .lte('clicked_at', endDate)
      .eq('item_type', 'artifact')
      .eq('action', 'view_artifact'),
    supabase
      .from('user_activity_log')
      .select('item_id')
      .lte('clicked_at', endDate)
      .eq('item_type', 'document')
      .eq('action', 'view_document'),
  ])

  // Process results
  const totalUsers = totalUsersResult.count
  const newUsers = newUsersResult.count
  const activeUsers = new Set((activeUsersResult.data || []).map((r) => r.user_id)).size

  // User type statistics
  const userTypeCount = {}
  usersByTypeResult.data?.forEach((u) => {
    userTypeCount[u.user_type] = (userTypeCount[u.user_type] || 0) + 1
  })
  const userTypeStats = Object.entries(userTypeCount).map(([type, count]) => ({ type, count }))

  // Department statistics
  const deptCount = {}
  departmentsResult.data?.forEach((u) => {
    if (u.department) deptCount[u.department] = (deptCount[u.department] || 0) + 1
  })
  const departmentStats = Object.entries(deptCount).map(([name, users]) => ({ name, users }))

  const facultyDeptCount = {}
  facultyDepartmentsResult.data?.forEach((u) => {
    if (u.department) facultyDeptCount[u.department] = (facultyDeptCount[u.department] || 0) + 1
  })
  const facultyDepartmentStats = Object.entries(facultyDeptCount).map(([name, users]) => ({
    name,
    users,
  }))

  const visitorDeptCount = {}
  visitorDepartmentsResult.data?.forEach((u) => {
    if (u.institution) visitorDeptCount[u.institution] = (visitorDeptCount[u.institution] || 0) + 1
  })
  const institutionStats = Object.entries(visitorDeptCount).map(([name, users]) => ({
    name,
    users,
  }))

  const totalArtifacts = totalArtifactsResult.count
  const uploadedArtifacts = uploadedArtifactsResult.count
  const totalDocuments = totalDocumentsResult.count
  const uploadedDocuments = uploadedDocumentsResult.count

  // Top artifacts and documents
  const artifactCount = {}
  artifactLogsResult.data?.forEach((log) => {
    artifactCount[log.item_id] = (artifactCount[log.item_id] || 0) + 1
  })
  const sortedArtifacts = Object.entries(artifactCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const documentCount = {}
  documentLogsResult.data?.forEach((log) => {
    documentCount[log.item_id] = (documentCount[log.item_id] || 0) + 1
  })
  const sortedDocuments = Object.entries(documentCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Get metadata for top items
  const [artifactsMetaResult, documentsMetaResult] = await Promise.all([
    sortedArtifacts.length > 0
      ? supabase
          .from('artifacts_view')
          .select('item_id, title')
          .in(
            'item_id',
            sortedArtifacts.map(([id]) => id),
          )
      : Promise.resolve({ data: [] }),
    sortedDocuments.length > 0
      ? supabase
          .from('documents_view')
          .select('id, title')
          .in(
            'id',
            sortedDocuments.map(([id]) => id),
          )
      : Promise.resolve({ data: [] }),
  ])

  const topArtifacts = sortedArtifacts.map(([id, views]) => {
    const meta = artifactsMetaResult.data?.find((a) => a.item_id === id)
    return { name: meta?.title ?? `Artifact ${id}`, views }
  })

  const topDocuments = sortedDocuments.map(([id, views]) => {
    const meta = documentsMetaResult.data?.find((d) => d.id === id)
    return { name: meta?.title ?? `Document ${id}`, views }
  })

  // PDF Generation
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const TABLE_WIDTH = 150
  const centeredMargin = { left: (pageWidth - TABLE_WIDTH) / 2 }

  const tableOptions = {
    theme: 'grid',
    styles: { halign: 'center', valign: 'middle', fontSize: 11 },
    headStyles: { fillColor: [136, 0, 0], textColor: 255, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 100 }, 1: { halign: 'center', cellWidth: 50 } },
    tableWidth: TABLE_WIDTH,
    margin: centeredMargin,
  }

  const tableOptions3Col = {
    ...tableOptions,
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 } },
  }

  // Header
  let rangeText = ''
  const chartWidth = pageWidth - 50
  const center = (pageWidth - chartWidth) / 2
  const title = 'PRESERV3D Usage Report'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, pageWidth / 2, 20, { align: 'center' })

  if (startMonth + startYear === endMonth + endYear) {
    rangeText = `${monthNames[startMonth - 1]} ${startYear}`
  } else {
    rangeText = `${monthNames[startMonth - 1]} ${startYear} to ${monthNames[endMonth - 1]} ${endYear}`
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(rangeText, pageWidth / 2, 27, { align: 'center' })
  let currentY = 40

  // 1. User Overview Section
  doc.setFont('helvetica', 'bold')
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
  currentY = doc.lastAutoTable.finalY + 10

  // User type stats table
  if (userTypeStats && userTypeStats.length > 0) {
    autoTable(doc, {
      ...tableOptions,
      startY: currentY,
      head: [['User Type', 'Count']],
      body: userTypeStats.map((u) => [u.type, u.count]),
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  // Monthly Users Chart
  if (chartImages.monthlyUsers) {
    doc.addImage(chartImages.monthlyUsers, 'PNG', center, currentY, chartWidth, 80)
    currentY += 90
  }

  // User Types Chart
  if (chartImages.userTypes) {
    doc.addImage(chartImages.userTypes, 'PNG', center, currentY, pageWidth - 50, 80)
    currentY += 90
  }

  // 2. Departments Section
  if (chartImages.departments || (departmentStats && departmentStats.length > 0)) {
    // Add new page if needed
    if (currentY > 200) {
      doc.addPage()
      currentY = 30
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Departments Overview', pageWidth / 2, currentY, { align: 'center' })
    currentY += 10

    // Students by Department
    if (departmentStats && departmentStats.length > 0) {
      doc.setFontSize(12)
      doc.text('Students by Department', pageWidth / 2, currentY, { align: 'center' })
      autoTable(doc, {
        ...tableOptions,
        startY: currentY + 5,
        head: [['Department', 'Students']],
        body: departmentStats.slice(0, 10).map((d) => [d.name, d.users]), // Limit to top 10
      })
      currentY = doc.lastAutoTable.finalY + 10
    }

    if (chartImages.departments) {
      doc.addImage(chartImages.departments, 'PNG', center, currentY, chartWidth, 80)
      currentY += 90
    }

    // Faculty by Department
    if (facultyDepartmentStats && facultyDepartmentStats.length > 0) {
      doc.setFontSize(12)
      doc.text('Faculty by Department', pageWidth / 2, currentY, { align: 'center' })
      autoTable(doc, {
        ...tableOptions,
        startY: currentY + 5,
        head: [['Department', 'Faculty']],
        body: facultyDepartmentStats.slice(0, 10).map((d) => [d.name, d.users]),
      })
      currentY = doc.lastAutoTable.finalY + 10
    }

    // Visitors by Institution
    if (institutionStats && institutionStats.length > 0) {
      doc.setFontSize(12)
      doc.text('Visitors by Institution', pageWidth / 2, currentY, { align: 'center' })
      autoTable(doc, {
        ...tableOptions,
        startY: currentY + 5,
        head: [['Institution', 'Visitors']],
        body: institutionStats.slice(0, 10).map((i) => [i.name, i.users]),
      })
      currentY = doc.lastAutoTable.finalY + 10
    }
  }

  // 3. Content Overview Section
  // Add new page
  doc.addPage()
  currentY = 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Content Overview', pageWidth / 2, currentY, { align: 'center' })
  currentY += 5

  // Content Summary Table
  autoTable(doc, {
    ...tableOptions3Col,
    columnStyles: {
      0: { halign: 'left', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 35 },
    },
    startY: currentY,
    head: [['Content Type', 'New', 'Total']],
    body: [
      ['Artifacts', uploadedArtifacts ?? 0, totalArtifacts ?? 0],
      ['Documents', uploadedDocuments ?? 0, totalDocuments ?? 0],
    ],
  })
  currentY = doc.lastAutoTable.finalY + 10

  // Monthly Uploads Chart
  if (chartImages.monthlyUploads) {
    doc.addImage(chartImages.monthlyUploads, 'PNG', center, currentY, chartWidth, 80)
    currentY += 90
  }

  // Upload Distribution Chart
  if (chartImages.uploadComparison) {
    doc.addImage(chartImages.uploadComparison, 'PNG', center, currentY, chartWidth, 80)
    currentY += 90
  }

  // 4. Popular Content Section
  doc.addPage()
  currentY = 30
  if (chartImages.topArtifacts || chartImages.topDocuments) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Popular Content', pageWidth / 2, currentY, { align: 'center' })
    currentY += 5

    // Top Artifacts Chart
    if (chartImages.topArtifacts) {
      doc.addImage(chartImages.topArtifacts, 'PNG', center, currentY, chartWidth, 80)
      currentY += 90
    }

    // Check if we need a new page
    if (currentY > 200) {
      doc.addPage()
      currentY = 30
    }

    // Top Documents Chart
    if (chartImages.topDocuments) {
      doc.addImage(chartImages.topDocuments, 'PNG', center, currentY, chartWidth, 80)
      currentY += 90
    }
  }

  // Top Artifacts Table (if no chart)
  if (!chartImages.topArtifacts && topArtifacts && topArtifacts.length > 0) {
    doc.setFontSize(12)
    doc.text('Top Artifacts by Views', pageWidth / 2, currentY, { align: 'center' })
    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      head: [['Artifact Name', 'Views']],
      body: topArtifacts.map((a) => [
        a.name.length > 40 ? a.name.substring(0, 40) + '...' : a.name,
        a.views,
      ]),
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  // Top Documents Table (if no chart)
  if (!chartImages.topDocuments && topDocuments && topDocuments.length > 0) {
    doc.setFontSize(12)
    doc.text('Top Documents by Views', pageWidth / 2, currentY, { align: 'center' })
    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      head: [['Document Name', 'Views']],
      body: topDocuments.map((d) => [
        d.name.length > 40 ? d.name.substring(0, 40) + '...' : d.name,
        d.views,
      ]),
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  // 5. Final Summary Section
  // Add new page for summary
  doc.addPage()
  currentY = 30

  doc.setFontSize(16)
  doc.text('Summary Report', pageWidth / 2, currentY, { align: 'center' })
  currentY += 5

  // Key Metrics Summary
  autoTable(doc, {
    ...tableOptions,
    columnStyles: {
      0: { halign: 'left', cellWidth: 120 },
      1: { halign: 'center', cellWidth: 30 },
    },
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Registered Users', totalUsers ?? 0],
      ['New Users (This Period)', newUsers ?? 0],
      ['Active Users (This Period)', activeUsers ?? 0],
      ['Total Artifacts', totalArtifacts ?? 0],
      ['New Artifacts (This Period)', uploadedArtifacts ?? 0],
      ['Total Documents', totalDocuments ?? 0],
      ['New Documents (This Period)', uploadedDocuments ?? 0],
      ['Student Users', userTypeCount.student ?? 0],
      ['Faculty Users', userTypeCount.faculty ?? 0],
      ['Visitor Users', userTypeCount.visitor ?? 0],
    ],
  })

  // Add generation timestamp
  const now = new Date()
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(50)

  doc.text(`Generated on: ${timestamp}`, 15, doc.internal.pageSize.getHeight() - 15)
  doc.text(`Generated by: ${user}`, 15, doc.internal.pageSize.getHeight() - 10)

  // Download Generated Report
  const filename =
    startMonth + startYear === endMonth + endYear
      ? `PRESERV3D_UsageReport_${startYear}-${startMonth.toString().padStart(2, '0')}.pdf`
      : `PRESERV3D_UsageReport_${startYear}-${startMonth.toString().padStart(2, '0')}_to_${endYear}-${endMonth.toString().padStart(2, '0')}.pdf`

  doc.save(filename)

  return {
    success: true,
    message: 'Report generated successfully',
    filename,
    metrics: {
      totalUsers,
      newUsers,
      activeUsers,
      totalArtifacts,
      uploadedArtifacts,
      totalDocuments,
      uploadedDocuments,
    },
  }
}
