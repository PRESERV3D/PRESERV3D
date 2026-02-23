<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-sm">
      <div class="q-mt-xs box-1 row items-center">
        <div class="col-7">
          <div class="q-ml-xl dash-title">Explore & Manage Cultural Heritage Assets</div>
          <div class="q-ml-xl dash-subtitle">
            Access digital artifacts, document, and research <br />
            tools — all in one place.
          </div>
          <div class="row q-ml-md q-gutter-lg">
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" no-caps />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" no-caps />
          </div>
        </div>
        <div class="col-5 gt-sm">
          <div class="row justify-center justify-md-end">
            <q-img src="/img/trophy-document.png" alt="Trophy and Document" class="trophies" />
          </div>
        </div>
      </div>

      <div class="q-mt-xs box-2">
        <p class="q-ml-lg title-font-2">Uploaded Archives</p>
        <div class="column">
          <div class="row q-gutter-md q-ml-sm items-center">
            <q-btn
              label="All"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'all' }"
              @click="activeFilter = 'all'"
            />
            <q-btn
              label="Artifacts"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'artifacts' }"
              @click="activeFilter = 'artifacts'"
            />
            <q-btn
              label="Documents"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'documents' }"
              @click="activeFilter = 'documents'"
            />

            <!-- Year Picker controlling analytics charts -->
            <q-select
              class="q-ml-md"
              outlined
              dense
              v-model="selectedYear"
              :options="yearOptions"
              label="Year"
            />
          </div>
          <!-- Uploaded Archives Line Graph -->
          <div class="q-mt-md graph">
            <canvas ref="uploadedArchives"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="q-my-lg reports-recently-container">
      <!-- Reports Section (box-3) -->
      <div class="column box-3 q-px-lg">
        <div class="row item-center justify-between q-pa-xs">
          <p class="title-font-2">Reports</p>
          <div class="q-mt-md">
            <q-btn
              label="Generate Report"
              class="btn-report"
              @click="reportDialog = true"
              no-caps
            />

            <q-dialog v-model="reportDialog">
              <q-card class="q-pa-md" style="min-width: 500px">
                <q-card-section>
                  <div class="text-h6">Generate Usage Report</div>
                </q-card-section>

                <q-card-section>
                  <!-- User Type and College Filters in a Row -->
                  <div class="row q-gutter-md q-mx-none q-mb-md">
                    <!-- User Type Filter -->
                    <div class="col q-px-none q-pr-sm">
                      <q-select
                        outlined
                        v-model="selectedUserType"
                        :options="userTypeOptions"
                        label="User Type"
                      />
                    </div>

                    <!-- College Filter -->
                    <div class="col q-px-none">
                      <q-select
                        outlined
                        v-model="selectedCollege"
                        :options="collegeOptions"
                        label="College"
                        @update:model-value="onCollegeChange"
                      />
                    </div>
                  </div>

                  <!-- Department Filter (conditionally shown)-->
                  <div
                    v-if="selectedCollege && selectedCollege !== 'All'"
                    class="filter-grid q-mx-none q-mb-md"
                  >
                    <div class="filter-span-2 q-px-none q-pr-sm">
                      <q-select
                        outlined
                        v-model="selectedDepartment"
                        :options="departmentOptions"
                        label="Department"
                      />
                    </div>
                  </div>

                  <div class="date-grid q-mx-none q-mb-md">
                    <div class="q-px-none q-pr-none" :class="{ 'date-span-2': !isRange }">
                      <q-input
                        outlined
                        v-model="startDate"
                        :label="isRange ? 'Date From' : 'Select Date'"
                        type="date"
                        :max="isRange ? endDate || today : today"
                      />
                    </div>

                    <div class="col q-px-none" v-if="isRange">
                      <q-input
                        outlined
                        v-model="endDate"
                        label="Date To"
                        type="date"
                        :min="startDate"
                        :max="today"
                      />
                    </div>
                  </div>

                  <q-checkbox v-model="isRange" label="Select a date range" class="q-mt-md" />
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn flat label="Cancel" color="negative" v-close-popup />

                  <div v-if="!isGenerateReportLoading">
                    <q-btn
                      label="Generate"
                      color="primary"
                      :disable="!isValid"
                      @click="generateReport"
                    />
                  </div>
                  <q-spinner v-else color="primary" size="2em" class="q-mx-lg" />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
        </div>
        <div class="row q-gutter-md q-px-sm">
          <div class="col box-report">
            <div class="number-report">{{ users }}</div>
            <div class="label">All Active Users</div>
          </div>
          <div class="col box-report">
            <div class="number-report">{{ artifacts }}</div>
            <div class="label">Total Artifacts</div>
          </div>
          <div class="col box-report">
            <div class="number-report">{{ documents }}</div>
            <div class="label">Total Documents</div>
          </div>
        </div>
        <div class="row q-mt-lg">
          <div class="col-6">
            <p class="sub-font">Users per Month</p>
            <div class="row q-py-sm legend-container">
              <!--users-->
              <div class="legend-item">
                <div class="box-legend" style="background-color: #880000"></div>
                <p class="sub-font" style="font-size: 12px">PUP Students</p>
              </div>
              <div class="legend-item">
                <div class="box-legend" style="background-color: #efaf00"></div>
                <p class="sub-font" style="font-size: 12px">PUP Faculty</p>
              </div>
              <div class="legend-item">
                <div class="box-legend" style="background-color: #3d86ff"></div>
                <p class="sub-font" style="font-size: 12px">Visitors</p>
              </div>
            </div>

            <!-- Users per Month Line Graph -->
            <div class="users-graph">
              <canvas ref="usersPerMonth"></canvas>
            </div>
          </div>
          <div class="col-6">
            <div class="q-mb-lg sub-font">Most Viewed Artifacts Materials</div>
            <div class="column">
              <div class="q-mb-md sub-font" style="font-size: 14px">Artifacts</div>

              <div v-for="(item, index) in topArtifacts" :key="index" class="row justify-between">
                <div class="row q-mb-md items-center q-gutter-sm">
                  <div class="number">{{ index + 1 }}</div>
                  <div class="fade-title-container" style="max-width: 12rem">
                    <div class="sub-font-2 fade-title">
                      <router-link
                        :to="{ name: 'view-artifact', params: { id: item.item_id } }"
                        class="sub-font-2"
                        style="text-decoration: none"
                      >
                        {{ item.title }}
                      </router-link>
                      <div class="tooltip-box">{{ item.title }}</div>
                    </div>
                  </div>
                </div>
                <div class="q-mr-md sub-font-2" style="font-size: 12px">{{ item.views }} views</div>
              </div>

              <div class="q-mt-sm q-mb-md sub-font" style="font-size: 14px">Documents</div>

              <div v-for="(item, index) in topDocuments" :key="index" class="row justify-between">
                <div class="row q-mb-md items-center q-gutter-sm">
                  <div class="number">{{ index + 1 }}</div>
                  <div class="fade-title-container" style="max-width: 12rem">
                    <div class="sub-font-2 fade-title">
                      <router-link
                        :to="{ name: 'view-document', params: { id: item.id } }"
                        class="sub-font-2"
                        style="text-decoration: none"
                      >
                        {{ item.title }}
                      </router-link>
                      <div class="tooltip-box">{{ item.title }}</div>
                    </div>
                  </div>
                </div>
                <div class="q-mr-md sub-font-2">{{ item.views }} views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recently Uploaded Section (box-4) -->
      <div class="box-4">
        <p class="q-ml-lg title-font-2">Recently Uploaded</p>

        <div class="column q-mt-lg items-center">
          <div class="recent-box q-pa-xs column items-center">
            <div class="recent-card">
              <div class="flex flex-center">
                <component
                  :is="isGLB(currentItem?.file_name) ? 'model-viewer' : 'img'"
                  v-bind="
                    isGLB(currentItem?.file_name)
                      ? modelViewerProps(currentItem.file_url)
                      : imgProps(currentItem)
                  "
                  class="q-mx-auto"
                  style="max-width: 200px; max-height: 240px"
                />
              </div>
            </div>
            <div class="q-mt-md self-start" style="margin-left: 1rem">
              <div class="fade-title-container" style="max-width: 10rem">
                <div class="sub-font-4 fade-title">
                  <router-link
                    v-if="currentItem"
                    :to="{
                      name: isGLB(currentItem.file_name) ? 'view-artifact' : 'view-document',
                      params: { id: currentItem.id },
                    }"
                    class="sub-font-4"
                    style="text-decoration: none"
                  >
                    {{ recentStore.recentItems[currentIndex]?.metadata?.title || 'Untitled' }}
                  </router-link>
                  <div class="tooltip-box">
                    {{ recentStore.recentItems[currentIndex]?.metadata?.title || 'Untitled' }}
                  </div>
                </div>
              </div>
              <div class="q-mt-sm self-start sub-font-2" style="color: #ffffff">
                {{
                  new Date(recentStore.recentItems[currentIndex]?.uploaded_at).toLocaleDateString()
                }}
              </div>
            </div>
          </div>

          <div class="row q-gutter-lg items-center justify-center">
            <q-btn
              flat
              round
              class="arrow-button"
              @click="
                currentIndex =
                  (currentIndex - 1 + recentStore.recentItems.length) %
                  recentStore.recentItems.length
              "
            >
              <q-img src="/icons/arrow_left.png" alt="back" class="btn-arrows" />
            </q-btn>

            <q-btn
              flat
              round
              class="arrow-button"
              @click="currentIndex = (currentIndex + 1) % recentStore.recentItems.length"
            >
              <q-img src="\icons\arrow_right.png" alt="next" class="btn-arrows" />
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onActivated, onUnmounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import '@google/model-viewer'
import { supabase } from 'boot/supabase'
import { useRecentStore } from 'stores/recentStore'
import { useUserStore } from 'src/stores/user'
import { generateMonthlyReport } from '/services/report_service.js'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
} from 'chart.js'

const $q = useQuasar()
let chartInstance = null
let usersChartInstance = null
const activeFilter = ref('all')
const uploadedArchives = ref(null)
const usersPerMonth = ref(null)
const artifacts = ref(0)
const documents = ref(0)
const users = ref(0)
// Year selection for analytics charts
const selectedYear = ref(new Date().getFullYear())
const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i)
const isGenerateReportLoading = ref(false)
const monthLabels = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i).toLocaleString('default', { month: 'short' }),
)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
)

let topArtifacts = ref([])
const topDocuments = ref([])

const recentStore = useRecentStore()
const userStore = useUserStore()
const currentIndex = ref(0)
const currentItem = computed(() => recentStore.recentItems[currentIndex.value])

// Report Generation
const reportDialog = ref(false)
const isRange = ref(false)
const isValid = ref(false)

const startDate = ref(null)
const endDate = ref(null)

// Filter options
const selectedUserType = ref('All')
const selectedCollege = ref('All')
const selectedDepartment = ref('All')

const userTypeOptions = ['All', 'student', 'faculty', 'visitor']
const collegeOptions = ref(['All'])
const departmentOptions = ref(['All'])
const allDepartments = ref([])

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = formatDate(new Date())

// validation
watch(
  [startDate, endDate, isRange],
  ([newStartDate, newEndDate, newIsRange]) => {
    // Reset
    isValid.value = false

    // Basic checks
    if (!newStartDate) return

    const start = new Date(newStartDate)
    const end = new Date(newEndDate)

    if (!newIsRange) {
      isValid.value = true
      return
    }

    // Range validation
    if (!newEndDate) return

    // Check if dates are the same
    if (start.getTime() === end.getTime()) {
      isRange.value = false
      endDate.value = null
      isValid.value = true
      $q.notify({
        type: 'info',
        message: 'Note: Start and End dates are the same. Switched to single date report.',
      })
      return
    }

    isValid.value = true
  },
  { immediate: true },
)

const generateReport = async () => {
  isGenerateReportLoading.value = true

  // Parse dates to get components
  const start = new Date(startDate.value)
  const startMonth = start.getMonth() + 1
  const startDay = start.getDate()
  const startYear = start.getFullYear()

  let result
  if (!isRange.value) {
    // Single Date Report
    result = await generateMonthlyReport({
      startMonth: startMonth,
      startDay: startDay,
      startYear: startYear,
      endMonth: startMonth,
      endDay: startDay,
      endYear: startYear,
      userType: selectedUserType.value === 'All' ? null : selectedUserType.value,
      college: selectedCollege.value === 'All' ? null : selectedCollege.value,
      department: selectedDepartment.value === 'All' ? null : selectedDepartment.value,
    })
  } else {
    // Range Report
    const end = new Date(endDate.value)
    const endMonth = end.getMonth() + 1
    const endDay = end.getDate()
    const endYear = end.getFullYear()

    result = await generateMonthlyReport({
      startMonth: startMonth,
      startDay: startDay,
      startYear: startYear,
      endMonth: endMonth,
      endDay: endDay,
      endYear: endYear,
      userType: selectedUserType.value === 'All' ? null : selectedUserType.value,
      college: selectedCollege.value === 'All' ? null : selectedCollege.value,
      department: selectedDepartment.value,
    })
  }

  // Check if there's no data
  if (result?.noData) {
    $q.notify({
      type: 'warning',
      message: 'No data available for the selected date range.',
    })
  } else {
    $q.notify({
      type: 'positive',
      message: 'Report generated successfully!',
    })

    reportDialog.value = false
  }

  startDate.value = null
  endDate.value = null
  selectedUserType.value = 'All'
  selectedCollege.value = 'All'
  selectedDepartment.value = 'All'
  isGenerateReportLoading.value = false
}

// Fetch college and department options
const fetchFilterOptions = async () => {
  try {
    // Fetch unique colleges and departments from both tables
    const [studentsResult, facultyResult] = await Promise.all([
      supabase.from('registered_users').select('college, department'),
      supabase.from('registered_faculty').select('college, department'),
    ])

    const studentsData = studentsResult.data || []
    const facultyData = facultyResult.data || []
    const allData = [...studentsData, ...facultyData]

    // Extract unique colleges
    const colleges = new Set()
    allData.forEach((row) => {
      if (row.college) colleges.add(row.college)
    })
    collegeOptions.value = ['All', ...Array.from(colleges).sort()]

    // Store all departments with their college associations
    allDepartments.value = allData
      .filter((row) => row.college && row.department)
      .map((row) => ({ college: row.college, department: row.department }))
  } catch (error) {
    console.error('Error fetching filter options:', error)
  }
}

// Handle college change to filter departments
const onCollegeChange = (college) => {
  selectedDepartment.value = 'All'
  if (!college || college === 'All') {
    departmentOptions.value = ['All']
    return
  }

  // Filter departments based on selected college
  const depts = new Set()
  allDepartments.value
    .filter((item) => item.college === college)
    .forEach((item) => {
      if (item.department) depts.add(item.department)
    })
  departmentOptions.value = ['All', ...Array.from(depts).sort()]
}

async function init() {
  try {
    // Ensure profile is loaded if we have a session
    if (userStore.session && !userStore.profile) {
      await userStore.fetchProfile(userStore.session.user.id)
    }

    // Parallelize all independent data fetching operations
    const [
      usersData,
      chartData,
      topArtsResult,
      topDocusResult,
      artifactsCountResult,
      documentsCountResult,
      userCountResult,
    ] = await Promise.all([
      prepareUsersData(selectedYear.value),
      prepareChartData(selectedYear.value),
      supabase.from('artifacts_view').select('*').limit(3),
      supabase.from('documents_view').select('*').limit(3),
      supabase.from('artifacts_metadata').select('*', { count: 'exact', head: true }),
      supabase.from('documents_metadata').select('*', { count: 'exact', head: true }),
      supabase
        .from('all_users')
        .select('*', { count: 'exact', head: true })
        .neq('user_type', 'admin'),
    ])

    // Fetch recent uploads and filter options in parallel with chart initialization
    const recentUploadsPromise = recentStore.fetchRecentUploads()
    const filterOptionsPromise = fetchFilterOptions()

    // Initialize charts with fetched data
    if (usersPerMonth.value && usersData) {
      initUsersPerMonthChart(usersData)
    }

    if (uploadedArchives.value && chartData) {
      initChart(chartData)
    }

    // Update state with fetched data
    topArtifacts.value = topArtsResult?.data || []
    topDocuments.value = topDocusResult?.data || []
    artifacts.value = artifactsCountResult?.count || 0
    documents.value = documentsCountResult?.count || 0
    users.value = userCountResult?.count || 0

    // Ensure recent uploads and filter options finish
    await Promise.all([recentUploadsPromise, filterOptionsPromise])
  } catch (err) {
    console.error('Error initializing AdminDashboard:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to load dashboard data. Please refresh the page.',
      position: 'top',
    })
  }
}

onMounted(() => init())
onActivated(() => init())

// Cleanup chart instances on unmount to prevent memory leaks
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  if (usersChartInstance) {
    usersChartInstance.destroy()
    usersChartInstance = null
  }
})

function initChart(data) {
  chartInstance = new Chart(uploadedArchives.value, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [], // will be filled by updateChart
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: (ctx) => {
            const max = Math.max(...ctx.chart.data.datasets.flatMap((d) => d.data))
            return max + 1 // add tick allowance
          },
          ticks: {
            stepSize: 1,
            precision: 0,
            callback: function (value) {
              return Number.isInteger(value) ? value : null
            },
          },
        },
      },
    },
  })

  updateChart(data)
}

async function prepareChartData() {
  // Default to current year if no explicit parameter is provided (backward safety)
  const year = selectedYear.value || new Date().getFullYear()

  const start = `${year}-01-01`
  const end = `${year}-12-31`

  const [artifactsResult, documentsResult] = await Promise.all([
    supabase
      .from('artifacts_metadata')
      .select('uploaded_at')
      .gte('uploaded_at', start)
      .lte('uploaded_at', end)
      .order('uploaded_at', { ascending: true }),
    supabase
      .from('documents_metadata')
      .select('uploaded_at')
      .gte('uploaded_at', start)
      .lte('uploaded_at', end)
      .order('uploaded_at', { ascending: true }),
  ])

  const artifacts = artifactsResult?.data || []
  const documents = documentsResult?.data || []

  const artifactsCounts = Array(12).fill(0)
  const documentsCounts = Array(12).fill(0)

  // Optimized single-pass counting
  artifacts.forEach((item) => {
    if (item.uploaded_at) {
      const monthIndex = new Date(item.uploaded_at).getMonth()
      artifactsCounts[monthIndex]++
    }
  })

  documents.forEach((item) => {
    if (item.uploaded_at) {
      const monthIndex = new Date(item.uploaded_at).getMonth()
      documentsCounts[monthIndex]++
    }
  })

  return {
    artifactsCounts,
    documentsCounts,
  }
}

function updateChart(allData) {
  let datasets = []

  if (!uploadedArchives.value) return

  if (activeFilter.value === 'all' || activeFilter.value === 'artifacts') {
    datasets.push({
      label: 'Artifacts',
      data: allData.artifactsCounts,
      borderColor: '#1E88E5',
      fill: false,
    })
  }

  if (activeFilter.value === 'all' || activeFilter.value === 'documents') {
    datasets.push({
      label: 'Documents',
      data: allData.documentsCounts,
      borderColor: '#43A047',
      fill: false,
    })
  }

  if (chartInstance) {
    chartInstance.data.datasets = datasets
    chartInstance.update()
  } else {
    initChart(allData)
  }
}

watch(activeFilter, async () => {
  const chartData = await prepareChartData()
  updateChart(chartData)
})

// Refresh both charts when year changes
watch(selectedYear, async (newYear) => {
  const [chartData, usersData] = await Promise.all([prepareChartData(), prepareUsersData(newYear)])
  updateChart(chartData)
  updateUsersChart(usersData)
})

// Users Per Month Chart
function initUsersPerMonthChart(data) {
  usersChartInstance = new Chart(usersPerMonth.value, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [], // will be filled by updateUsersChart
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0,
            callback: function (value) {
              return Number.isInteger(value) ? value : null
            },
          },
        },
      },
    },
  })

  updateUsersChart(data)
}

async function prepareUsersData(yearParam) {
  // Determine year range
  const year = yearParam || selectedYear.value || new Date().getFullYear()
  const start = `${year}-01-01`
  const end = `${year}-12-31`

  const { data: users, error } = await supabase
    .from('all_users')
    .select('created_at, user_type')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching users data:', error)
    return {
      studentCounts: Array(12).fill(0),
      facultyCounts: Array(12).fill(0),
      visitorCounts: Array(12).fill(0),
    }
  }

  // Initialize counters for each user type
  const studentCounts = Array(12).fill(0)
  const facultyCounts = Array(12).fill(0)
  const visitorCounts = Array(12).fill(0)

  // Optimized single-pass counting with null check
  users?.forEach((user) => {
    if (user.created_at) {
      const monthIndex = new Date(user.created_at).getMonth()

      switch (user.user_type) {
        case 'student':
          studentCounts[monthIndex]++
          break
        case 'faculty':
          facultyCounts[monthIndex]++
          break
        case 'visitor':
          visitorCounts[monthIndex]++
          break
      }
    }
  })

  return {
    studentCounts,
    facultyCounts,
    visitorCounts,
  }
}

function updateUsersChart(data) {
  if (!usersPerMonth.value) return

  const datasets = [
    {
      label: 'Students',
      data: data.studentCounts,
      borderColor: '#880000',
      fill: false,
    },
    {
      label: 'Faculty',
      data: data.facultyCounts,
      borderColor: '#efaf00',
      fill: false,
    },
    {
      label: 'Visitors',
      data: data.visitorCounts,
      borderColor: '#3d86ff',
      fill: false,
    },
  ]

  if (usersChartInstance) {
    usersChartInstance.data.datasets = datasets
    usersChartInstance.update()
  } else {
    initUsersPerMonthChart(data)
  }
}

// Recent Uploads
function isGLB(filename) {
  return filename?.toLowerCase().endsWith('.glb')
}

function modelViewerProps(url) {
  return {
    src: url,
    alt: '3D Model',
    autoRotate: true,
    style: 'width: 200px; height: 250px; margin: auto;',
  }
}

function imgProps(item) {
  const src = item?.preview_url
  const alt = item?.metadata?.title || 'No Title'

  return {
    src,
    alt,
  }
}
</script>

<style scoped>
.trophies {
  height: 15rem;
  width: 15rem;
}

.graph {
  width: 100%;
  max-width: 20rem;
  align-self: center;
  padding: 0 1rem;
}

.graph canvas {
  max-width: 100% !important;
  height: auto !important;
  width: 100% !important;
}

.box-legend {
  margin-top: 1.1rem;
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.number {
  background-color: rgba(204, 172, 0, 0.2);
  color: #560505;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.users-graph {
  margin: 2rem auto 0 auto;
  width: 22rem;
  max-width: 100%;
}

.users-graph canvas {
  max-width: 100%;
  height: auto;
  width: 100% !important;
}

.btn-report {
  border-radius: 7px;
  background-color: rgba(204, 172, 0, 0.7);
  color: #121212;
  font-size: 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  height: 2rem;
  width: 9rem;
  margin-right: 0.5rem;
}

.box-report {
  background-color: rgba(136, 0, 0, 0.07);
  border-radius: 12px;
  height: 4.5rem;
  font-family: 'Poppins', sans-serif;
  color: #7c7c7c;
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}

.number-report {
  font-weight: 600;
  font-size: 28px;
  color: #121212;
  margin-top: 1rem;
}

.label {
  font-size: 12px;
  margin-bottom: 1rem;
}

.box-4 {
  border-radius: 15px;
  background: linear-gradient(25deg, #ffffff 35%, #fdf9e7 78%, #fbf4d0 100%);
  margin-left: 3rem;
  flex: 1;
  min-width: 0;
  height: 35rem;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  justify-content: center;
}

.recent-box {
  width: 15rem;
  height: 22rem;
  background-color: #000000;
  border-radius: 10px;
  width: 15rem;
}

.recent-card {
  margin-top: 0.5rem;
  width: 13rem;
  height: 15rem;
  border-radius: 10px;
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  flex-shrink: 0;
  align-content: center;
}
.arrow-button {
  margin-top: 3.5rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  border: 2px solid transparent;
}

.arrow-button:hover {
  border: 2px solid rgba(0, 0, 0, 0.5);
  background-color: transparent;
}

.btn-arrows {
  width: 24px;
  height: 24px;
  object-fit: contain;
  pointer-events: none;
}

/*css referral letter*/

.referral-box,
.incomplete-box {
  font-family: 'Poppins', sans-serif;
  border-radius: 10px !important;
  height: auto;
  background: linear-gradient(127deg, #fff 0.9%, #fffce9 88.33%);
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
}

::v-deep(.referral-box .q-table__title),
::v-deep(.incomplete-box .q-table__title) {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #560505;
  margin-top: 1rem;
  margin-left: 1.5rem;
}

::v-deep(.referral-box .q-table__bottom) {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: black;
}

::v-deep(.referral-box thead tr th),
::v-deep(.incomplete-box thead tr th) {
  padding: 1rem;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.view-more-link {
  color: #880000;
  text-decoration: underline;
}

.conf-box {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  margin-top: 1rem;
  border-radius: 10px !important;
  background-color: #fbf4d0;
  padding: 1rem;
  text-align: center;
  width: 25rem;
}

/* ========================
 ADMIN DASH RESPONSIVE DESIGN
======================== */

/* Base styles (mobile first) */
.dash-title {
  font-size: 1.5rem; /* 24px */
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.dash-subtitle {
  font-size: 0.625rem; /* 10px */
  width: 70%;
  line-height: 1.3;
  margin-bottom: 1rem;
}

.btn-explore,
.btn-document {
  font-size: 0.5rem; /* 8px */
  padding: 0.25rem 0.5rem;
  min-height: 2rem;
  white-space: nowrap;
}

.title-font-2 {
  font-size: 0.875rem; /* 14px */
}

/* Hide trophy section on mobile */
.col-5 {
  display: none;
}

/* Full width main content on mobile */
.col-7 {
  width: 100%;
  flex: 0 0 100%;
  max-width: 100%;
}

/* Button layout adjustments for mobile */
.row.q-ml-md.q-gutter-lg {
  margin-left: 0.5rem;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

/* ========================
   TABLET (48rem / 768px+)
======================== */
@media (min-width: 48rem) {
  .dash-title {
    font-size: 1.625rem; /* 26px */
  }

  .dash-subtitle {
    font-size: 0.75rem; /* 12px */
    width: 90%;
  }

  .btn-explore,
  .btn-document {
    font-size: 0.8125rem; /* 13px */
    padding: 0.375rem 0.75rem;
    min-height: 2.25rem;
  }

  .title-font-2 {
    font-size: 0.875rem; /* 14px */
  }

  .trophies {
    max-width: 15rem;
  }

  .row.q-ml-md.q-gutter-lg {
    margin-left: 1rem;
    gap: 1rem;
  }
}

/* ========================
   DESKTOP (64rem / 1024px+)
======================== */
@media (min-width: 64rem) {
  .col-5 {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 0 0 41.666667%;
    max-width: 41.666667%;
  }

  .col-7 {
    width: auto;
    flex: 0 0 58.333333%;
    max-width: 58.333333%;
  }

  .dash-title {
    font-size: 1.5rem;
    line-height: 1.3;
  }

  .dash-subtitle {
    font-size: 0.75rem; /* 12px */
    width: auto;
  }

  .btn-explore,
  .btn-document {
    font-size: 0.8125rem; /* 13px */
    padding: 0.5rem 1rem;
    min-height: 2.5rem;
  }

  .title-font-2 {
    font-size: 1.125rem; /* 18px */
  }

  .trophies {
    height: 15rem;
    width: 15rem;
    max-width: 100%;
  }

  .row.q-ml-md.q-gutter-lg {
    margin-left: 1rem;
    gap: 1.5rem;
  }

  .users-graph {
    width: 19rem;
  }
}

/* ========================
   WIDE DESKTOP (75rem / 1200px+)
======================== */

@media (max-width: 82rem) {
  .trophies {
    height: 12rem;
    width: 12rem;
  }
}

/* ========================
   LARGE DESKTOP (90rem / 1440px+)
======================== */
@media (min-width: 90rem) {
  .dash-title {
    font-size: 2rem; /* 32px */
  }

  .dash-subtitle {
    font-size: 1rem; /* 16px */
  }

  .btn-explore,
  .btn-document {
    font-size: 1rem; /* 16px */
    padding: 0.625rem 1.25rem;
    min-height: 2.75rem;
  }

  .title-font-2 {
    font-size: 1.25rem; /* 20px */
  }

  .trophies {
    height: 16rem;
    width: 16rem;
  }

  .users-graph {
    width: 22rem;
  }
}

/* ========================
   EXTRA LARGE (120rem / 1920px+)
======================== */
@media (min-width: 120rem) {
  .dash-title {
    font-size: 2.125rem; /* 34px */
  }

  .dash-subtitle {
    font-size: 1.125rem; /* 18px */
  }

  .btn-explore,
  .btn-document {
    font-size: 1.125rem; /* 18px */
    padding: 0.75rem 1.5rem;
    min-height: 3rem;
  }

  .title-font-2 {
    font-size: 1.375rem; /* 22px */
  }

  .trophies {
    height: 17rem;
    width: 17rem;
  }
}

/* ========================
 BOX LAYOUT RESPONSIVE ADJUSTMENTS
======================== */

/* Mobile adjustments for box layouts */
@media (max-width: 767px) {
  .row.q-gutter-sm {
    flex-direction: column;
    gap: 1rem;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .box-1,
  .box-2 {
    width: 100%;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .box-1 {
    padding: 1rem;
  }

  .box-2 {
    margin-top: 1rem;
    padding: 1rem;
  }

  .box-2 .q-ml-lg {
    margin-left: 0.5rem !important;
  }

  .box-2 .q-ml-sm {
    margin-left: 0.5rem !important;
  }

  .q-ml-xl {
    margin-left: 1rem !important;
  }

  .q-pa-md {
    padding: 0.5rem;
  }

  @media (max-width: 480px) {
    .row.q-ml-md.q-gutter-lg {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      margin-left: 0.5rem;
    }

    .btn-explore,
    .btn-document {
      width: 100%;
      max-width: 200px;
    }
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .row.q-gutter-sm {
    gap: 1rem;
  }

  .trophies {
    height: 12rem;
    width: 12rem;
  }
}

/* ========================
 RECENTLY UPLOADED SECTION (box-4)
======================== */

.box-4 {
  margin-left: 0;
}

@media (min-width: 48rem) {
  .box-4 {
    margin-left: 1rem;
  }
}

@media (min-width: 64rem) {
  .box-4 {
    margin-left: 3rem;
    height: 35rem;
  }

  .recent-box {
    width: 15rem;
    height: 22rem;
  }

  .recent-card {
    width: 13rem;
    height: 15rem;
  }

  .arrow-button {
    width: 50px;
    height: 50px;
    margin-top: 3.5rem;
  }

  .btn-arrows {
    width: 24px;
    height: 24px;
  }
}

@media (min-width: 90rem) {
  .box-4 {
    margin-left: 3rem;
    height: 35rem;
  }

  .recent-box {
    width: 15rem;
    height: 22rem;
  }

  .recent-card {
    width: 13rem;
    height: 15rem;
  }
}

.legend-container {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-wrap: wrap !important;
  gap: 1.5rem !important;
}

.legend-item {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: baseline !important;
  gap: 0.5rem !important;
}

.legend-item .box-legend {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.legend-item p {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
  white-space: nowrap;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 25px;
  row-gap: 12px;
  margin-left: 1rem;
}

.date-span-2 {
  grid-column: 1 / span 2;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 25px;
  row-gap: 12px;
}

.filter-span-2 {
  grid-column: 1 / span 2;
  margin-left: 1rem;
  margin-right: -1rem;
}

/* ========================
 RESPONSIVE LAYOUT FOR REPORTS AND RECENTLY UPLOADED
======================== */

.reports-recently-container {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  width: 100%;
}

.box-3 {
  flex: 1 1 65%;
  min-width: 0;
  border-radius: 15px;
  background: linear-gradient(127deg, #fff 0.9%, #fffce9 88.33%);
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  height: 35rem;
}

.box-4 {
  border-radius: 15px;
  background: linear-gradient(25deg, #ffffff 35%, #fdf9e7 78%, #fbf4d0 100%);
  flex: 0 0 33%;
  width: 35%;
  height: 35rem;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  justify-content: center;
  margin-left: 0;
}

@media (max-width: 75rem) {
  .reports-recently-container {
    flex-direction: column;
    gap: 2rem;
  }

  .box-3 {
    width: 100%;
    flex: none;
    height: auto;
  }

  .box-4 {
    width: 100%;
    flex: none;
    margin-left: 0;
    margin-top: 0;
  }

  .box-3 .row.q-py-md {
    flex-direction: column;
    gap: 2rem;
  }

  .box-3 .col-6 {
    width: 100%;
    flex: none;
  }

  .box-3 .users-graph {
    width: 100% !important;
    max-width: 100%;
    margin-top: 1rem;
  }

  .box-3 .users-graph canvas {
    width: 100% !important;
    height: auto !important;
  }

  .box-3 .row.q-py-lg.justify-center.q-gutter-md {
    flex-wrap: wrap;
    justify-content: flex-start !important;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  /* Most Viewed Artifacts section responsive */
  .box-3 .fade-title-container {
    max-width: 12rem !important;
    min-width: 0; /* Allow shrinking */
  }

  .box-3 .row.items-center.justify-between {
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 0.5rem;
  }

  .box-3 .row.q-mb-md.items-center.q-gutter-sm {
    flex: 1;
    min-width: 0;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: flex-start !important;
  }

  .box-3 .number {
    flex-shrink: 0 !important;
  }

  .box-3 .fade-title {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .box-3 .q-mr-md.sub-font-2 {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .recent-box {
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .graph {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 0.5rem;
  }

  .graph canvas {
    width: 100% !important;
    height: auto !important;
  }

  .box-2 {
    padding: 1rem 0.5rem;
  }

  .box-2 .row.q-gutter-md.q-ml-sm {
    margin-left: 0.25rem;
    gap: 0.5rem;
  }

  .box-4 {
    padding: 1rem;
  }

  .recent-box {
    width: 12rem;
    height: 20rem;
  }

  .recent-card {
    width: 10rem;
    height: 13rem;
  }

  .arrow-button {
    width: 40px;
    height: 40px;
    margin-top: 2rem;
  }

  .btn-arrows {
    width: 20px;
    height: 20px;
  }

  .box-3 {
    padding: 1rem !important;
  }

  .box-3 .number-report {
    font-size: 1.5rem;
  }

  .box-3 .label {
    font-size: 10px;
  }

  .box-3 .users-graph {
    width: 100% !important;
    margin-top: 0.5rem;
  }

  .box-3 .row.q-py-lg.justify-center.q-gutter-md {
    justify-content: center !important;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .box-3 .row.q-py-lg.justify-center.q-gutter-md p {
    font-size: 10px !important;
    text-align: center;
  }

  .box-3 .box-legend {
    margin-right: 0.25rem !important;
  }

  .box-3 .number {
    width: 20px;
    height: 20px;
    font-size: 12px;
    flex-shrink: 0 !important;
    margin-right: 0.5rem !important;
  }

  .box-3 .sub-font-2 {
    font-size: 12px !important;
  }

  .box-3 .fade-title-container {
    max-width: 6rem !important;
    flex: 1 !important;
    min-width: 0 !important;
  }

  .box-3 div[class*='row items-center justify-between'] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: nowrap !important;
    width: 100% !important;
  }

  .box-3 div[class*='row q-mb-md items-center q-gutter-sm'] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    flex: 1 !important;
    min-width: 0 !important;
    margin-right: 1rem !important;
  }

  .box-3 div[class*='q-mr-md sub-font-2'] {
    flex-shrink: 0 !important;
    margin-left: auto !important;
    margin-right: 1rem !important;
    white-space: nowrap !important;
  }

  .box-3 .fade-title-container {
    max-width: 8rem !important;
  }

  .box-3 .row.items-center.justify-between {
    align-items: center !important;
    flex-wrap: nowrap !important;
    display: flex !important;
    justify-content: space-between !important;
  }

  .box-3 .row.q-mb-md.items-center.q-gutter-sm {
    gap: 0.5rem !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: flex-start !important;
    display: flex !important;
    flex-direction: row !important;
    text-align: left !important;
    flex: 1 !important;
    min-width: 0 !important;
  }

  .box-3 .number {
    flex-shrink: 0 !important;
    margin-right: 0 !important;
    align-self: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .box-3 .column {
    align-items: flex-start !important;
  }

  .box-3 .fade-title {
    font-size: 11px !important;
    text-align: left !important;
    line-height: 1.2 !important;
    display: inline !important;
  }

  .box-3 .fade-title-container {
    display: inline-flex !important;
    align-items: center !important;
    flex-direction: row !important;
    vertical-align: middle !important;
  }

  .box-3 .q-mr-md.sub-font-2 {
    align-self: center !important;
    line-height: 1.2 !important;
    margin-left: 0 !important;
    margin-right: 3rem !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
  }
}

@media (min-width: 610px) and (max-width: 768px) {
  .graph {
    width: 100% !important;
    max-width: 95% !important;
    padding: 0 1rem;
  }
}

@media (min-width: 769px) {
  .graph {
    width: 100% !important;
    max-width: 20rem !important;
    padding: 0 1rem;
  }

  .box-2 {
    padding: initial;
  }
}

@media (min-width: 1551px) and (max-width: 2048px) {
  .users-graph {
    width: 100% !important;
    padding: 0 1rem;
  }
}
</style>
