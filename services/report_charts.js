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

export async function renderReportCharts({ startMonth, startYear, endMonth, endYear }) {
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

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i).toLocaleString('default', { month: 'short' }),
  )

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
      prepareMonthlyUsersData(startMonth, startYear, endMonth, endYear),
      prepareMonthlyUploadsData(endMonth, endYear),
      prepareUserTypesData(endMonth, endYear),
      prepareMonthlyAppointmentsData(startMonth, startYear, endMonth, endYear),
      prepareAppointmentStatusData(startMonth, startYear, endMonth, endYear),
      prepareStudentDepartmentsData(endMonth, endYear),
      prepareFacultyDepartmentsData(endMonth, endYear),
      prepareVisitorInstitutionsData(endMonth, endYear),
      prepareTopArtifactsData(),
      prepareTopDocumentsData(),
    ])

    const charts = []

    // Monthly User Registrations (Line Chart)
    charts.push(
      new Chart(canvases.monthlyUsers, {
        type: 'line',
        data: {
          labels: monthLabels,
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
          labels: monthLabels,
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
            labels: monthLabels,
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
async function prepareMonthlyUsersData(startMonth, startYear, endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()
    const { data: users } = await supabase
      .from('all_users')
      .select('created_at, user_type')
      .lte('created_at', endDate)

    const studentCounts = Array(12).fill(0)
    const facultyCounts = Array(12).fill(0)
    const visitorCounts = Array(12).fill(0)

    if (users) {
      users.forEach((user) => {
        const date = new Date(user.created_at)
        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          if (user.user_type === 'student') studentCounts[monthIndex]++
          else if (user.user_type === 'faculty') facultyCounts[monthIndex]++
          else if (user.user_type === 'visitor') visitorCounts[monthIndex]++
        }
      })
    }

    return { studentCounts, facultyCounts, visitorCounts }
  } catch (error) {
    console.error('Error preparing users data:', error)
    return {
      studentCounts: Array(12).fill(0),
      facultyCounts: Array(12).fill(0),
      visitorCounts: Array(12).fill(0),
    }
  }
}

async function prepareMonthlyUploadsData(endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()

    const [artifactsResult, documentsResult] = await Promise.all([
      supabase.from('artifacts_metadata').select('uploaded_at').lte('uploaded_at', endDate),
      supabase.from('documents_metadata').select('uploaded_at').lte('uploaded_at', endDate),
    ])

    const artifactsCounts = Array(12).fill(0)
    const documentsCounts = Array(12).fill(0)

    function incrementCount(data, counter) {
      if (!data) return
      data.forEach((item) => {
        const date = new Date(item.uploaded_at)
        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          counter[monthIndex]++
        }
      })
    }

    incrementCount(artifactsResult.data, artifactsCounts)
    incrementCount(documentsResult.data, documentsCounts)

    return { artifactsCounts, documentsCounts }
  } catch (error) {
    console.error('Error preparing uploads data:', error)
    return {
      artifactsCounts: Array(12).fill(0),
      documentsCounts: Array(12).fill(0),
    }
  }
}

async function prepareUserTypesData(endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()
    const { data: users } = await supabase
      .from('all_users')
      .select('user_type')
      .lte('created_at', endDate)
      .neq('user_type', 'admin')

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

async function prepareMonthlyAppointmentsData(startMonth, startYear, endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()

    const { data: appointments } = await supabase
      .from('appointment_booking')
      .select('created_at')
      .lte('created_at', endDate)

    const appointmentCounts = Array(12).fill(0)

    // Counts appointments by month
    if (appointments) {
      appointments.forEach((appointment) => {
        const date = new Date(appointment.created_at)
        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          appointmentCounts[monthIndex]++
        }
      })
    }
    console.log(appointmentCounts)
    return { appointmentCounts }
  } catch (error) {
    console.error('Error preparing appointments data:', error)
    return { appointmentCounts: Array(12).fill(0) }
  }
}

async function prepareAppointmentStatusData(startMonth, startYear, endMonth, endYear) {
  try {
    const startDate = new Date(startYear, startMonth - 1, 1).toISOString()
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()

    const { data: appointments } = await supabase
      .from('appointment_booking')
      .select('status')
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

async function prepareStudentDepartmentsData(endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()
    const { data: departments } = await supabase
      .from('registered_users')
      .select('department')
      .lte('created_at', endDate)

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

async function prepareFacultyDepartmentsData(endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()
    const { data: departments } = await supabase
      .from('registered_faculty')
      .select('department')
      .lte('created_at', endDate)

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

async function prepareVisitorInstitutionsData(endMonth, endYear) {
  try {
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString()
    const { data: institutions } = await supabase
      .from('registration_visitors')
      .select('institution')
      .eq('status', 'Approved')
      .lte('created_at', endDate)

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

async function prepareTopArtifactsData() {
  try {
    const { data: artifactLogs } = await supabase
      .from('user_activity_log')
      .select('item_id')
      .eq('item_type', 'artifact')
      .eq('action', 'view_artifact')

    const artifactCount = {}
    artifactLogs?.forEach((log) => {
      artifactCount[log.item_id] = (artifactCount[log.item_id] || 0) + 1
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

async function prepareTopDocumentsData() {
  try {
    const { data: documentLogs } = await supabase
      .from('user_activity_log')
      .select('item_id')
      .eq('item_type', 'document')
      .eq('action', 'view_document')

    const documentCount = {}
    documentLogs?.forEach((log) => {
      documentCount[log.item_id] = (documentCount[log.item_id] || 0) + 1
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
