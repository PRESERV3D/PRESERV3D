// services/report_charts.js
import { supabase } from 'boot/supabase.js'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement,
  ArcElement,
  DoughnutController,
  PieController,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js'

export async function renderReportCharts({
  startMonth,
  startDay,
  startYear,
  endMonth,
  endDay,
  endYear,
  userIds = null,
}) {
  // Register Chart.js components
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    BarController,
    BarElement,
    ArcElement,
    DoughnutController,
    PieController,
    Legend,
    Tooltip,
    Filler,
  )

  // Create canvases for different charts
  const canvases = {
    monthlyUsers: createCanvas('Monthly User Registrations'),
    monthlyUploads: createCanvas('Uploads per Month'),
    userTypes: createCanvas('User Types Distribution'),
    monthlyAppointments: createCanvas('Appointments per Month'),
    appointmentStatus: createCanvas('Appointment Status Distribution'),
    studentDepartments: createCanvas('Top Departments (Students)'),
    facultyDepartments: createCanvas('Top Departments (Faculty)'),
    visitorInstitutions: createCanvas('Top Institutions (Visitors)'),
    topArtifacts: createCanvas('Top Artifacts'),
    topDocuments: createCanvas('Top Documents'),
    uploadComparison: createCanvas('Artifacts vs Documents'),
  }

  const hiddenContainer = document.createElement('div')
  hiddenContainer.style.position = 'absolute'
  hiddenContainer.style.left = '-9999px'
  hiddenContainer.style.visibility = 'hidden'
  document.body.appendChild(hiddenContainer)

  Object.values(canvases).forEach((canvas) => hiddenContainer.appendChild(canvas))

  try {
    // Fetch all data
    const [
      monthlyUsersData,
      monthlyUploadsData,
      userTypesData,
      monthlyAppointmentsData,
      appointmentStatusData,
      studentDepartmentsData,
      facultyDepartmentsData,
      visitorInstitutionsData,
      topArtifactsData,
      topDocumentsData,
    ] = await Promise.all([
      prepareMonthlyUsersData(startMonth, startDay, startYear, endMonth, endDay, endYear, userIds),
      prepareMonthlyUploadsData(startMonth, startDay, startYear, endMonth, endDay, endYear),
      prepareUserTypesData(endMonth, endDay, endYear, startMonth, startDay, startYear, userIds),
      prepareMonthlyAppointmentsData(
        startMonth,
        startDay,
        startYear,
        endMonth,
        endDay,
        endYear,
        userIds,
      ),
      prepareAppointmentStatusData(
        startMonth,
        startDay,
        startYear,
        endMonth,
        endDay,
        endYear,
        userIds,
      ),
      prepareStudentDepartmentsData(
        endMonth,
        endDay,
        endYear,
        startMonth,
        startDay,
        startYear,
        userIds,
      ),
      prepareFacultyDepartmentsData(
        endMonth,
        endDay,
        endYear,
        startMonth,
        startDay,
        startYear,
        userIds,
      ),
      prepareVisitorInstitutionsData(
        endMonth,
        endDay,
        endYear,
        startMonth,
        startDay,
        startYear,
        userIds,
      ),
      prepareTopArtifactsData(userIds),
      prepareTopDocumentsData(userIds),
    ])

    const charts = []

    // Monthly User Registrations (Line Chart)
    charts.push(
      new Chart(canvases.monthlyUsers, {
        type: 'line',
        data: {
          labels: monthlyUsersData.monthLabels,
          datasets: [
            {
              label: 'PUP Students',
              data: monthlyUsersData.studentCounts,
              borderColor: '#880000',
              backgroundColor: 'rgba(136, 0, 0, 0.1)',
              fill: true,
              tension: 0.3,
              borderWidth: 3,
              pointBackgroundColor: '#880000',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'PUP Faculty',
              data: monthlyUsersData.facultyCounts,
              borderColor: '#efaf00',
              backgroundColor: 'rgba(239, 175, 0, 0.1)',
              fill: true,
              tension: 0.3,
              borderWidth: 3,
              pointBackgroundColor: '#efaf00',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Visitors',
              data: monthlyUsersData.visitorCounts,
              borderColor: '#3d86ff',
              backgroundColor: 'rgba(61, 134, 255, 0.1)',
              fill: true,
              tension: 0.3,
              borderWidth: 3,
              pointBackgroundColor: '#3d86ff',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        },
        options: getLineChartOptions('Users per Month'),
      }),
    )

    // Monthly Uploads (Bar Chart)
    charts.push(
      new Chart(canvases.monthlyUploads, {
        type: 'bar',
        data: {
          labels: monthlyUploadsData.monthLabels,
          datasets: [
            {
              label: 'Artifacts',
              data: monthlyUploadsData.artifactsCounts,
              backgroundColor: '#880000',
              borderColor: '#880000',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
            },
            {
              label: 'Documents',
              data: monthlyUploadsData.documentsCounts,
              backgroundColor: '#efaf00',
              borderColor: '#efaf00',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        },
        options: getBarChartOptions('Uploads per Month'),
      }),
    )

    // User Types Distribution (Doughnut Chart)
    charts.push(
      new Chart(canvases.userTypes, {
        type: 'doughnut',
        data: {
          labels: userTypesData.labels.map((label) => {
            if (label === 'student') return 'PUP Students'
            if (label === 'faculty') return 'PUP Faculty'
            if (label === 'visitor') return 'Visitors'
            return label
          }),
          datasets: [
            {
              data: userTypesData.counts,
              backgroundColor: [
                '#880000', // PUP Students - Primary maroon
                '#efaf00', // PUP Faculty - Gold
                '#3d86ff', // Visitors - Blue
                '#4CAF50', // Others - Green
                '#9C27B0', // Additional - Purple
              ],
              borderColor: '#ffffff',
              borderWidth: 3,
              hoverBorderWidth: 4,
            },
          ],
        },
        options: getPieChartOptions('User Types Distribution'),
      }),
    )

    // Monthly Appointments (Line Chart)
    if (monthlyAppointmentsData.appointmentCounts.some((count) => count > 0)) {
      charts.push(
        new Chart(canvases.monthlyAppointments, {
          type: 'line',
          data: {
            labels: monthlyAppointmentsData.monthLabels,
            datasets: [
              {
                label: 'Appointments',
                data: monthlyAppointmentsData.appointmentCounts,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 3,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
              },
            ],
          },
          options: getLineChartOptions('Appointments per Month'),
        }),
      )
    }

    // Appointment Status Distribution (Pie Chart)
    if (appointmentStatusData.labels.length > 0) {
      charts.push(
        new Chart(canvases.appointmentStatus, {
          type: 'pie',
          data: {
            labels: appointmentStatusData.labels.map(
              (label) => label.charAt(0).toUpperCase() + label.slice(1),
            ),
            datasets: [
              {
                data: appointmentStatusData.counts,
                backgroundColor: [
                  '#4CAF50', // Approved/Confirmed - Green
                  '#FFC107', // Pending - Yellow
                  '#F44336', // Cancelled/Rejected - Red
                  '#2196F3', // Completed - Blue
                  '#9C27B0', // Others - Purple
                ],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverBorderWidth: 4,
              },
            ],
          },
          options: getPieChartOptions('Appointment Status Distribution'),
        }),
      )
    }

    // Top Departments (Horizontal Bar Chart)
    // Students
    if (studentDepartmentsData.labels.length > 0) {
      charts.push(
        new Chart(canvases.studentDepartments, {
          type: 'bar',
          data: {
            labels: studentDepartmentsData.labels,
            datasets: [
              {
                label: 'Students',
                data: studentDepartmentsData.counts,
                backgroundColor: '#880000',
                borderColor: '#880000',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...getBarChartOptions('Top Departments (Students)'),
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  color: '#f0f0f0',
                  lineWidth: 1,
                },
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 11,
                  },
                  color: '#666666',
                },
              },
              y: {
                ticks: {
                  maxTicksLimit: 10,
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 10,
                  },
                  color: '#666666',
                },
              },
            },
          },
        }),
      )
    }

    // Faculty
    if (facultyDepartmentsData.labels.length > 0) {
      charts.push(
        new Chart(canvases.facultyDepartments, {
          type: 'bar',
          data: {
            labels: facultyDepartmentsData.labels,
            datasets: [
              {
                label: 'Faculty',
                data: facultyDepartmentsData.counts,
                backgroundColor: '#880000',
                borderColor: '#880000',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...getBarChartOptions('Top Departments (Faculty)'),
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  color: '#f0f0f0',
                  lineWidth: 1,
                },
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 11,
                  },
                  color: '#666666',
                },
              },
              y: {
                ticks: {
                  maxTicksLimit: 10,
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 10,
                  },
                  color: '#666666',
                },
              },
            },
          },
        }),
      )
    }

    // Visitors
    if (visitorInstitutionsData.labels.length > 0) {
      charts.push(
        new Chart(canvases.visitorInstitutions, {
          type: 'bar',
          data: {
            labels: visitorInstitutionsData.labels,
            datasets: [
              {
                label: 'Visitors',
                data: visitorInstitutionsData.counts,
                backgroundColor: '#880000',
                borderColor: '#880000',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...getBarChartOptions('Top Institutions (Visitors)'),
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  color: '#f0f0f0',
                  lineWidth: 1,
                },
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 11,
                  },
                  color: '#666666',
                },
              },
              y: {
                ticks: {
                  maxTicksLimit: 10,
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 10,
                  },
                  color: '#666666',
                },
              },
            },
          },
        }),
      )
    }

    // Top Artifacts (Horizontal Bar Chart)
    if (topArtifactsData.labels.length > 0) {
      charts.push(
        new Chart(canvases.topArtifacts, {
          type: 'bar',
          data: {
            labels: topArtifactsData.labels,
            datasets: [
              {
                label: 'Views',
                data: topArtifactsData.views,
                backgroundColor: '#880000',
                borderColor: '#880000',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...getBarChartOptions('Most Viewed Artifacts Materials'),
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  color: '#f0f0f0',
                  lineWidth: 1,
                },
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 11,
                  },
                  color: '#666666',
                },
              },
              y: {
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 10,
                  },
                  color: '#666666',
                  callback: function (value) {
                    const label = this.getLabelForValue(value)
                    return label.length > 25 ? label.substring(0, 25) + '...' : label
                  },
                },
              },
            },
          },
        }),
      )
    }

    // Top Documents (Horizontal Bar Chart)
    if (topDocumentsData.labels.length > 0) {
      charts.push(
        new Chart(canvases.topDocuments, {
          type: 'bar',
          data: {
            labels: topDocumentsData.labels,
            datasets: [
              {
                label: 'Views',
                data: topDocumentsData.views,
                backgroundColor: '#efaf00',
                borderColor: '#efaf00',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...getBarChartOptions('Most Viewed Documents'),
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  color: '#f0f0f0',
                  lineWidth: 1,
                },
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 11,
                  },
                  color: '#666666',
                },
              },
              y: {
                ticks: {
                  font: {
                    family: 'Poppins, sans-serif',
                    size: 10,
                  },
                  color: '#666666',
                  callback: function (value) {
                    const label = this.getLabelForValue(value)
                    return label.length > 25 ? label.substring(0, 25) + '...' : label
                  },
                },
              },
            },
          },
        }),
      )
    }

    // Upload Comparison (Pie Chart)
    const totalArtifacts = monthlyUploadsData.artifactsCounts.reduce((a, b) => a + b, 0)
    const totalDocuments = monthlyUploadsData.documentsCounts.reduce((a, b) => a + b, 0)

    charts.push(
      new Chart(canvases.uploadComparison, {
        type: 'pie',
        data: {
          labels: ['Artifacts', 'Documents'],
          datasets: [
            {
              data: [totalArtifacts, totalDocuments],
              backgroundColor: ['#880000', '#efaf00'],
              borderColor: '#ffffff',
              borderWidth: 3,
              hoverBorderWidth: 4,
            },
          ],
        },
        options: getPieChartOptions('Total Uploads Distribution'),
      }),
    )

    // Wait for all charts to render
    await new Promise((resolve) => {
      setTimeout(() => {
        charts.forEach((chart) => chart.update('none'))
        setTimeout(resolve, 800)
      }, 200)
    })

    // Convert to data URLs
    const images = {}
    Object.keys(canvases).forEach((key) => {
      images[key] = canvases[key].toDataURL('image/png', 1.0)
    })

    // Clean up
    charts.forEach((chart) => chart.destroy())
    document.body.removeChild(hiddenContainer)

    return images
  } catch (error) {
    console.error('Error rendering charts:', error)

    if (hiddenContainer && hiddenContainer.parentNode) {
      document.body.removeChild(hiddenContainer)
    }

    throw new Error('Failed to render charts: ' + error.message)
  }
}

function createCanvas(title) {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 400
  canvas.title = title
  return canvas
}

function getLineChartOptions(title) {
  return {
    responsive: false,
    maintainAspectRatio: true,
    animation: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          family: 'Poppins, sans-serif',
          size: 18,
          weight: '800',
        },
        color: '#880000',
        padding: { bottom: 20 },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: 'Poppins, sans-serif',
            size: 16,
            weight: '600',
          },
          color: '#4a4a4a',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#f0f0f0',
          lineWidth: 1,
        },
        ticks: {
          font: {
            family: 'Poppins, sans-serif',
            size: 14,
            weight: '600',
          },
          color: '#666666',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
          lineWidth: 1,
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            family: 'Poppins, sans-serif',
            size: 14,
            weight: '600',
          },
          color: '#666666',
          callback: function (value) {
            return Number.isInteger(value) ? value : null
          },
        },
      },
    },
  }
}

function getBarChartOptions(title) {
  return {
    responsive: false,
    maintainAspectRatio: true,
    animation: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          family: 'Poppins, sans-serif',
          size: 18,
          weight: '800',
        },
        color: '#880000',
        padding: { bottom: 20 },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: 'Poppins, sans-serif',
            size: 14,
            weight: '600',
          },
          color: '#4a4a4a',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#f0f0f0',
          lineWidth: 1,
        },
        ticks: {
          font: {
            family: 'Poppins, sans-serif',
            size: 16,
            weight: '800',
          },
          color: '#666666',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
          lineWidth: 1,
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            family: 'Poppins, sans-serif',
            size: 12,
            weight: '600',
          },
          color: '#4a4a4a',
          callback: function (value) {
            return Number.isInteger(value) ? value : null
          },
        },
      },
    },
  }
}

function getPieChartOptions(title) {
  return {
    responsive: false,
    maintainAspectRatio: true,
    animation: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          family: 'Poppins, sans-serif',
          size: 18,
          weight: '800',
        },
        color: '#880000',
        padding: { bottom: 20 },
      },
      legend: {
        display: true,
        position: 'right',
        labels: {
          font: {
            family: 'Poppins, sans-serif',
            size: 14,
            weight: '600',
          },
          color: '#4a4a4a',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        titleFont: {
          family: 'Poppins, sans-serif',
          size: 14,
          weight: '800',
        },
        bodyFont: {
          family: 'Poppins, sans-serif',
          size: 12,
          weight: '600',
        },
        callbacks: {
          label: function (context) {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }
}

// Data preparation functions
async function prepareMonthlyUsersData(
  startMonth,
  startDay,
  startYear,
  endMonth,
  endDay,
  endYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()

    let query = supabase
      .from('all_users')
      .select('created_at, user_type')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userIds && userIds.length > 0) {
      query = query.in('id', userIds)
    }

    const { data: users } = await query

    // Generate month labels for the date range
    const monthLabels = []
    const studentCounts = []
    const facultyCounts = []
    const visitorCounts = []

    const start = new Date(startYear, startMonth - 1, 1)
    const end = new Date(endYear, endMonth - 1, 1)
    let current = new Date(start)

    while (current <= end) {
      const monthLabel = current.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthLabels.push(monthLabel)

      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59)

      const monthUsers =
        users?.filter((user) => {
          const userDate = new Date(user.created_at)
          return userDate >= monthStart && userDate <= monthEnd
        }) || []

      studentCounts.push(monthUsers.filter((u) => u.user_type === 'student').length)
      facultyCounts.push(monthUsers.filter((u) => u.user_type === 'faculty').length)
      visitorCounts.push(monthUsers.filter((u) => u.user_type === 'visitor').length)

      current.setMonth(current.getMonth() + 1)
    }

    return { monthLabels, studentCounts, facultyCounts, visitorCounts }
  } catch (error) {
    console.error('Error preparing users data:', error)
    return {
      monthLabels: [],
      studentCounts: [],
      facultyCounts: [],
      visitorCounts: [],
    }
  }
}

async function prepareMonthlyUploadsData(
  startMonth,
  startDay,
  startYear,
  endMonth,
  endDay,
  endYear,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()

    const [artifactsResult, documentsResult] = await Promise.all([
      supabase
        .from('artifacts_metadata')
        .select('uploaded_at')
        .gte('uploaded_at', startDate)
        .lte('uploaded_at', endDate),
      supabase
        .from('documents_metadata')
        .select('uploaded_at')
        .gte('uploaded_at', startDate)
        .lte('uploaded_at', endDate),
    ])

    // Generate month labels for the date range
    const monthLabels = []
    const artifactsCounts = []
    const documentsCounts = []

    const start = new Date(startYear, startMonth - 1, 1)
    const end = new Date(endYear, endMonth - 1, 1)
    let current = new Date(start)

    while (current <= end) {
      const monthLabel = current.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthLabels.push(monthLabel)

      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59)

      const artifactsInMonth =
        artifactsResult.data?.filter((item) => {
          const uploadDate = new Date(item.uploaded_at)
          return uploadDate >= monthStart && uploadDate <= monthEnd
        }).length || 0

      const documentsInMonth =
        documentsResult.data?.filter((item) => {
          const uploadDate = new Date(item.uploaded_at)
          return uploadDate >= monthStart && uploadDate <= monthEnd
        }).length || 0

      artifactsCounts.push(artifactsInMonth)
      documentsCounts.push(documentsInMonth)

      current.setMonth(current.getMonth() + 1)
    }

    return { monthLabels, artifactsCounts, documentsCounts }
  } catch (error) {
    console.error('Error preparing uploads data:', error)
    return {
      monthLabels: [],
      artifactsCounts: [],
      documentsCounts: [],
    }
  }
}

async function prepareUserTypesData(
  endMonth,
  endDay,
  endYear,
  startMonth,
  startDay,
  startYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()
    let query = supabase
      .from('all_users')
      .select('user_type')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('user_type', 'admin')

    if (userIds && userIds.length > 0) {
      query = query.in('id', userIds)
    }

    const { data: users } = await query

    const typeCount = {}
    users?.forEach((u) => {
      typeCount[u.user_type] = (typeCount[u.user_type] || 0) + 1
    })

    const labels = Object.keys(typeCount)
    const counts = Object.values(typeCount)

    return { labels, counts }
  } catch (error) {
    console.error('Error preparing user types data:', error)
    return { labels: [], counts: [] }
  }
}

async function prepareMonthlyAppointmentsData(
  startMonth,
  startDay,
  startYear,
  endMonth,
  endDay,
  endYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()

    let query = supabase
      .from('appointment_booking')
      .select('created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: appointments } = await query

    // Generate month labels for the date range
    const monthLabels = []
    const appointmentCounts = []

    const start = new Date(startYear, startMonth - 1, 1)
    const end = new Date(endYear, endMonth - 1, 1)
    let current = new Date(start)

    while (current <= end) {
      const monthLabel = current.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthLabels.push(monthLabel)

      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59)

      const appointmentsInMonth =
        appointments?.filter((apt) => {
          const aptDate = new Date(apt.created_at)
          return aptDate >= monthStart && aptDate <= monthEnd
        }).length || 0

      appointmentCounts.push(appointmentsInMonth)

      current.setMonth(current.getMonth() + 1)
    }

    return { monthLabels, appointmentCounts }
  } catch (error) {
    console.error('Error preparing appointments data:', error)
    return { monthLabels: [], appointmentCounts: [] }
  }
}

async function prepareAppointmentStatusData(
  startMonth,
  startDay,
  startYear,
  endMonth,
  endDay,
  endYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()

    let query = supabase
      .from('appointment_booking')
      .select('status')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: appointments } = await query
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Count appointments by status
    const statusCount = {}
    appointments?.forEach((appointment) => {
      const status = appointment.status || 'pending'
      statusCount[status] = (statusCount[status] || 0) + 1
    })

    const labels = Object.keys(statusCount)
    const counts = Object.values(statusCount)

    return { labels, counts }
  } catch (error) {
    console.error('Error preparing appointment status data:', error)
    return { labels: [], counts: [] }
  }
}

async function prepareStudentDepartmentsData(
  endMonth,
  endDay,
  endYear,
  startMonth,
  startDay,
  startYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()
    let query = supabase
      .from('registered_users')
      .select('department')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userIds && userIds.length > 0) {
      query = query.in('id', userIds)
    }

    const { data: departments } = await query

    const deptCount = {}
    departments?.forEach((u) => {
      if (u.department) {
        deptCount[u.department] = (deptCount[u.department] || 0) + 1
      }
    })

    // Get top 10 departments
    const sorted = Object.entries(deptCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      labels: sorted.map(([name]) => name),
      counts: sorted.map(([, count]) => count),
    }
  } catch (error) {
    console.error('Error preparing departments data:', error)
    return { labels: [], counts: [] }
  }
}

async function prepareFacultyDepartmentsData(
  endMonth,
  endDay,
  endYear,
  startMonth,
  startDay,
  startYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()
    let query = supabase
      .from('registered_faculty')
      .select('department')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userIds && userIds.length > 0) {
      query = query.in('id', userIds)
    }

    const { data: departments } = await query

    const deptCount = {}
    departments?.forEach((u) => {
      if (u.department) {
        deptCount[u.department] = (deptCount[u.department] || 0) + 1
      }
    })

    // Get top 10 departments
    const sorted = Object.entries(deptCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      labels: sorted.map(([name]) => name),
      counts: sorted.map(([, count]) => count),
    }
  } catch (error) {
    console.error('Error preparing departments data:', error)
    return { labels: [], counts: [] }
  }
}

async function prepareVisitorInstitutionsData(
  endMonth,
  endDay,
  endYear,
  startMonth,
  startDay,
  startYear,
  userIds = null,
) {
  try {
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0).toISOString()
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59).toISOString()
    let query = supabase
      .from('registration_visitors')
      .select('institution, user_id')
      .eq('status', 'Approved')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: institutions } = await query

    const instCount = {}
    institutions?.forEach((u) => {
      if (u.institution) {
        instCount[u.institution] = (instCount[u.institution] || 0) + 1
      }
    })

    // Get top 10 institutions
    const sorted = Object.entries(instCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      labels: sorted.map(([name]) => name),
      counts: sorted.map(([, count]) => count),
    }
  } catch (error) {
    console.error('Error preparing institutions data:', error)
    return { labels: [], counts: [] }
  }
}

async function prepareTopArtifactsData(userIds = null) {
  try {
    let query = supabase
      .from('user_activity_log')
      .select('item_id, user_id')
      .eq('item_type', 'artifact')
      .eq('action', 'view_artifact')

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: artifactLogs } = await query

    // Get admin user IDs to exclude from view counts
    const { data: adminUsers } = await supabase
      .from('all_users')
      .select('id')
      .in('user_type', ['admin', 'super admin'])

    const adminUserIds = new Set((adminUsers || []).map((a) => a.id))

    // Get unique artifact IDs from logs (excluding admin views)
    const artifactLogIds = [
      ...new Set(
        (artifactLogs || [])
          .filter((log) => !adminUserIds.has(log.user_id))
          .map((log) => log.item_id),
      ),
    ]

    // Verify which artifacts still exist in the database
    const { data: existingArtifacts } = await supabase
      .from('artifacts_metadata')
      .select('id')
      .in('id', artifactLogIds)

    const existingArtifactIds = new Set((existingArtifacts || []).map((a) => a.id))

    // Count views only for artifacts that still exist and exclude admin views
    const artifactCount = {}
    artifactLogs?.forEach((log) => {
      if (existingArtifactIds.has(log.item_id) && !adminUserIds.has(log.user_id)) {
        artifactCount[log.item_id] = (artifactCount[log.item_id] || 0) + 1
      }
    })

    const sortedArtifacts = Object.entries(artifactCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    if (sortedArtifacts.length === 0) {
      return { labels: [], views: [] }
    }

    const { data: artifactsMeta } = await supabase
      .from('artifacts_view')
      .select('item_id, title')
      .in(
        'item_id',
        sortedArtifacts.map(([id]) => id),
      )

    const labels = []
    const views = []

    sortedArtifacts.forEach(([id, viewCount]) => {
      const meta = artifactsMeta?.find((a) => a.item_id === id)
      labels.push(meta?.title || `Artifact ${id}`)
      views.push(viewCount)
    })

    return { labels, views }
  } catch (error) {
    console.error('Error preparing top artifacts data:', error)
    return { labels: [], views: [] }
  }
}

async function prepareTopDocumentsData(userIds = null) {
  try {
    let query = supabase
      .from('user_activity_log')
      .select('item_id, user_id')
      .eq('item_type', 'document')
      .eq('action', 'view_document')

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: documentLogs } = await query

    // Get admin user IDs to exclude from view counts
    const { data: adminUsers } = await supabase
      .from('all_users')
      .select('id')
      .in('user_type', ['admin', 'super admin'])

    const adminUserIds = new Set((adminUsers || []).map((a) => a.id))

    // Get unique document IDs from logs (excluding admin views)
    const documentLogIds = [
      ...new Set(
        (documentLogs || [])
          .filter((log) => !adminUserIds.has(log.user_id))
          .map((log) => log.item_id),
      ),
    ]

    // Verify which documents still exist in the database
    const { data: existingDocuments } = await supabase
      .from('documents_metadata')
      .select('id')
      .in('id', documentLogIds)

    const existingDocumentIds = new Set((existingDocuments || []).map((d) => d.id))

    // Count views only for documents that still exist and exclude admin views
    const documentCount = {}
    documentLogs?.forEach((log) => {
      if (existingDocumentIds.has(log.item_id) && !adminUserIds.has(log.user_id)) {
        documentCount[log.item_id] = (documentCount[log.item_id] || 0) + 1
      }
    })

    const sortedDocuments = Object.entries(documentCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    if (sortedDocuments.length === 0) {
      return { labels: [], views: [] }
    }

    const { data: documentsMeta } = await supabase
      .from('documents_view')
      .select('id, title')
      .in(
        'id',
        sortedDocuments.map(([id]) => id),
      )

    const labels = []
    const views = []

    sortedDocuments.forEach(([id, viewCount]) => {
      const meta = documentsMeta?.find((d) => d.id === id)
      labels.push(meta?.title || `Document ${id}`)
      views.push(viewCount)
    })

    return { labels, views }
  } catch (error) {
    console.error('Error preparing top documents data:', error)
    return { labels: [], views: [] }
  }
}
