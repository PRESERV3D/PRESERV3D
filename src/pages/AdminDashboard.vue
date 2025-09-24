<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-sm">
      <div class="q-mt-xs box-1 row items-center">
        <div class="col-7">
          <p class="q-ml-xl dash-title">Explore & Manage Cultural Heritage Assets</p>
          <p class="q-ml-xl dash-subtitle">
            Access digital artifacts, document, and research <br />
            tools — all in one place.
          </p>
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
          <div class="row q-gutter-md q-ml-sm">
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
        <div class="row item-center justify-between q-mb-sm">
          <p class="q-ml-md title-font-2">Reports</p>
          <div class="q-mt-md">
            <q-btn
              label="Generate Report"
              class="btn-report"
              @click="reportDialog = true"
              no-caps
            />

            <!-- Report Dialog -->
            <q-dialog v-model="reportDialog">
              <q-card class="q-pa-md" style="min-width: 400px">
                <q-card-section>
                  <div class="text-h6">Generate Monthly Usage Report</div>
                </q-card-section>

                <q-card-section>
                  <!-- Month & Year Selection -->
                  <div class="q-gutter-md">
                    <q-select
                      v-model="selectedMonth"
                      :options="months"
                      label="Select Month"
                      dense
                      outlined
                    />

                    <q-select
                      v-model="selectedYear"
                      :options="years"
                      label="Select Year"
                      dense
                      outlined
                    />
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn flat label="Cancel" color="negative" v-close-popup />
                  <q-btn
                    label="Generate"
                    color="primary"
                    @click="generateReport"
                    :disable="!selectedMonth || !selectedYear"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
        </div>
        <div class="row q-gutter-md q-px-sm">
          <div class="col box-report">
            <div class="number-report">{{ users }}</div>
            <div class="label">All Active User</div>
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
        <div class="row q-py-md">
          <div class="col-6">
            <p class="q-ml-md sub-font">Users per Month</p>
            <div class="row q-py-lg justify-center q-gutter-md">
              <!--users-->
              <div class="box-legend" style="background-color: #880000"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Students</p>
              <div class="box-legend" style="background-color: #efaf00"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Faculty</p>
              <div class="box-legend" style="background-color: #3d86ff"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">Visitors</p>

              <!-- Users per Month Line Graph -->
              <div class="users-graph">
                <canvas ref="usersPerMonth"></canvas>
              </div>
            </div>
          </div>

          <div class="col-6">
            <div class="q-mb-lg sub-font">Most Viewed Artifacts Materials</div>
            <div class="column">
              <div class="q-mb-md sub-font" style="font-size: 14px">Artifacts</div>

              <div
                v-for="(item, index) in topArtifacts"
                :key="index"
                class="row items-center justify-between"
              >
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

              <div
                v-for="(item, index) in topDocuments"
                :key="index"
                class="row items-center justify-between"
              >
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
    <!-- <div class="referral-box"></div> -->
    <div class="q-mt-md">
      <q-table
        class="referral-box"
        flat
        bordered
        title="Visitor Registrations"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
      >
        <!-- Document column -->
        <template v-slot:body-cell-letter_url="props">
          <q-td :props="props" align="center">
            <a
              v-if="props.row.letter_url"
              :href="props.row.letter_url"
              target="_blank"
              rel="noopener noreferrer"
              class="view-more-link"
            >
              Letter
            </a>
          </q-td>
        </template>

        <!-- Status column -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props" align="center">
            <!-- If pending -->
            <template v-if="props.row.status === 'Pending'">
              <q-btn
                flat
                dense
                round
                class="status-btn"
                @click="openConfirmDialog(props.row, 'Approved')"
              >
                <q-icon name="check" color="green" size="18px" />
              </q-btn>
              <q-btn
                flat
                dense
                round
                class="status-btn"
                @click="openConfirmDialog(props.row, 'Rejected')"
              >
                <q-icon name="close" color="red" size="18px" />
              </q-btn>
            </template>

            <!-- If decided -->
            <template v-else>
              <span
                class="status-text"
                :class="{
                  'text-green': props.row.status === 'Approved',
                  'text-red': props.row.status === 'Rejected',
                }"
              >
                {{ props.row.status }}
              </span>
            </template>
          </q-td>
        </template>
      </q-table>

      <!-- Confirmation Dialog -->
      <q-dialog v-model="confirmDialog.show">
        <q-card class="conf-box">
          <q-card-section class="sub-font" style="color: black">
            Are you sure you want to set this referral letter as {{ confirmDialog.action }}?
          </q-card-section>
          <q-card-actions align="center">
            <q-btn flat label="Yes" class="btn-save" @click="confirmAction" />
            <q-btn
              flat
              label="No"
              class="sub-font-2"
              style="color: #000000"
              v-close-popup
              no-caps
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <!-- <div>
        <div class="q-mt-lg">
          <q-table
            class="incomplete-box"
            flat
            bordered
            title="Incomplete Metadata List"
            :rows="incompleteRows"
            :columns="incompleteColumns"
            row-key="id"
          >

            <template v-slot:body-cell-materialLink="props">
              <q-td :props="props">
                <a :href="props.row.materialLink" target="_blank">
                  <q-icon name="link" color="primary" size="20px" />
                </a>
              </q-td>
            </template>

            <template v-slot:bottom>
              <div class="q-pa-sm full-width row justify-end">
                <q-btn
                  flat
                  label="SEE ALL"
                  class="incomplete-see-all"
                  :to="{ name: 'incomplete-metadata' }"
                />
              </div>
            </template>
          </q-table>
        </div>
      </div> -->
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import '@google/model-viewer'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'stores/user'
import { useRecentStore } from 'stores/recentStore'
import { generateMonthlyReport } from '/services/report_service.js'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
} from 'chart.js'

let chartInstance = null
let usersChartInstance = null
const activeFilter = ref('all')
const uploadedArchives = ref(null)
const usersPerMonth = ref(null)
const artifacts = ref(0)
const documents = ref(0)
const users = ref(0)
const monthLabels = [
  'Jan',
  'Feb',
  'March',
  'April',
  'May',
  'June',
  'July',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
]
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

let topArtifacts = ref([])
const topDocuments = ref([])

const recentStore = useRecentStore()
const currentIndex = ref(0)
const currentItem = computed(() => recentStore.recentItems[currentIndex.value])

// const userStore = useUserStore()
// const userProfile = computed(() => userStore.profile || {})

// Report Generation
const reportDialog = ref(false)
const selectedMonth = ref(null)
const selectedYear = ref(null)

const allMonths = Array.from({ length: 12 }, (_, i) => {
  const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  return { label: monthName, value: i + 1 }
})

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const months = computed(() => {
  if (selectedYear.value === currentYear) {
    return allMonths.filter((m) => m.value <= currentMonth)
  }
  return allMonths
})

const years = Array.from({ length: 10 }, (_, i) => {
  const year = currentYear - i
  return { label: year.toString(), value: year }
})

const generateReport = async () => {
  await generateMonthlyReport({
    month: selectedMonth.value,
    year: selectedYear.value,
  })
  reportDialog.value = false
}

onMounted(async () => {
  if (usersPerMonth.value) {
    const usersData = await prepareUsersData()
    initUsersPerMonthChart(usersData)
  }

  if (uploadedArchives.value) {
    const chartData = await prepareChartData()
    initChart(chartData)
  }

  const { data: topArts } = await supabase.from('artifacts_view').select('*').limit(3)
  const { data: topDocus } = await supabase.from('documents_view').select('*').limit(3)
  const { count: artifactsCount } = await supabase
    .from('artifacts_metadata')
    .select('*', { count: 'exact', head: true })

  const { count: documentsCount } = await supabase
    .from('documents_metadata')
    .select('*', { count: 'exact', head: true })

  const { count: userCount } = await supabase
    .from('all_users')
    .select('*', { count: 'exact', head: true })
    .neq('user_type', 'admin')

  await recentStore.fetchRecentUploads()

  topArtifacts.value = topArts
  topDocuments.value = topDocus

  // Update counts from chartData and usersData
  artifacts.value = artifactsCount
  documents.value = documentsCount
  users.value = userCount

  await fetchVisitors()
})

// Fetch visitors with status from DB
async function fetchVisitors() {
  const { data, error } = await supabase
    .from('registration_visitors')
    .select('*')
    .order('created_at', { descending: false })

  if (error) {
    console.error('Error fetching visitors:', error.message)
    return
  }
  rows.value = data
}

function initChart(data) {
  chartInstance = new Chart(uploadedArchives.value, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [], // will be filled by updateChart
    },
    options: {
      responsive: true,
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

  updateChart(data)
}

async function prepareChartData() {
  const { data: artifacts } = await supabase.from('artifacts_metadata').select('uploaded_at')
  const { data: documents } = await supabase.from('documents_metadata').select('uploaded_at')

  const artifactsCounts = Array(12).fill(0)
  const documentsCounts = Array(12).fill(0)

  function incrementCount(data, counter) {
    data.forEach((item) => {
      const date = new Date(item.uploaded_at)
      const monthIndex = date.getMonth() // 0 = Jan, 11 = Dec
      counter[monthIndex]++
    })
  }

  incrementCount(artifacts, artifactsCounts)
  incrementCount(documents, documentsCounts)

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

async function prepareUsersData() {
  const { data: users } = await supabase.from('all_users').select('created_at, user_type')

  // Initialize counters for each user type
  const studentCounts = Array(12).fill(0)
  const facultyCounts = Array(12).fill(0)
  const visitorCounts = Array(12).fill(0)

  users.forEach((user) => {
    const date = new Date(user.created_at)
    const monthIndex = date.getMonth()

    if (user.user_type === 'student') {
      studentCounts[monthIndex]++
    } else if (user.user_type === 'faculty') {
      facultyCounts[monthIndex]++
    } else if (user.user_type === 'visitor') {
      visitorCounts[monthIndex]++
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
  const src = item?.preview_url + '?t=' + Date.now()
  const alt = item?.metadata?.title || 'No Title'

  return {
    src,
    alt,
  }
}

const pagination = {
  page: 1,
  rowsPerPage: 8,
}

const rows = ref([])

const columns = [
  {
    name: 'name',
    label: 'Name',
    align: 'center',
    field: (row) => `${row.first_name} ${row.last_name}`,
  },
  { name: 'institution', label: 'Institution', align: 'center', field: 'institution' },
  { name: 'purpose', label: 'Purpose', align: 'center', field: 'purpose' },
  {
    name: 'letter_url',
    label: 'Letter',
    align: 'center',
    field: 'letter_url',
  },
  {
    name: 'created_at',
    label: 'Date Filed',
    align: 'center',
    field: (row) => new Date(row.created_at).toLocaleDateString('en-CA'),
  },
  { name: 'start_date', label: 'Start Date', align: 'center', field: 'start_date' },
  { name: 'end_date', label: 'End Date', align: 'center', field: 'end_date' },
  { name: 'status', label: 'Status', align: 'center', field: 'status' },
]

// function setStatus(row, status) {
//   row.status = status
//   row.showLabel = true

const confirmDialog = ref({
  show: false,
  action: '',
  row: null,
})

function openConfirmDialog(row, action) {
  confirmDialog.value.show = true
  confirmDialog.value.action = action
  confirmDialog.value.row = row
}

async function confirmAction() {
  if (!confirmDialog.value.row) return

  const row = confirmDialog.value.row
  const action = confirmDialog.value.action
  const userStore = useUserStore()

  const adminName =
    `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

  try {
    // Update registration_visitors status
    const updateResponse = await supabase
      .from('registration_visitors')
      .update({ status: action })
      .eq('id', row.id)
      .select()

    console.log('Update response:', updateResponse)

    if (updateResponse.error) {
      throw updateResponse.error
    }

    // If Approved, insert into approved_users
    if (action === 'Approved') {
      // Sign up the user in Supabase Auth and send confirmation email
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: row.email,
        password: generateTempPassword(), // generate a temporary password
        options: {
          data: {
            role: 'user',
            type: 'visitor',
            // start_date: row.start_date,
            // end_date: row.end_date,
          },
          emailRedirectTo: 'http://localhost:9000/resetpassword',
        },
      })

      if (signUpError) {
        alert(signUpError.message)
        return
      }

      console.log('SignUp confirmation email sent:', data)

      const now = new Date()

      const { data: insertData, error: insertError } = await supabase
        .from('approved_visitors')
        .insert([
          {
            id: data.user.id, // Use user ID from the sign-up response
            registration_id: row.id,
            approved_at: now,
            approved_by: adminName,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
          },
        ])

      if (insertError) {
        console.error('Error in inserting to approved_users: ', insertError)
        return
      }

      console.log('Inserting to approved users successful: ', insertData)

      const { error: allUserError } = await supabase.from('all_users').insert([
        {
          id: data.user.id,
          email: row.email,
          created_at: now,
          user_type: 'visitor',
        },
      ])

      if (allUserError) {
        console.error('Error in adding user to all users table: ', allUserError)
        return
      }

      confirmDialog.value.show = false

      await fetchVisitors()
    }
  } catch (err) {
    console.error('Error updating status:', err)
  }
}

// Generate a temporary password
function generateTempPassword(length = 12) {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{};\'":|<>?,./`~'

  // At least one character of each type
  let password = ''
  password += lower[Math.floor(Math.random() * lower.length)]
  password += upper[Math.floor(Math.random() * upper.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly from all characters
  const allChars = lower + upper + numbers + symbols
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  password = password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('')
  return password
}

//Sample backend for Incomplete metadata
// const incompleteColumns = [
//   {
//     name: 'materialNo',
//     label: 'Archival Material No.',
//     align: 'center',
//     field: 'materialNo',
//   },
//   {
//     name: 'materialType',
//     label: 'Archival Material Type',
//     align: 'center',
//     field: 'materialType',
//   },
//   {
//     name: 'materialName',
//     label: 'Archival Material Name',
//     align: 'center',
//     field: 'materialName',
//   },
//   {
//     name: 'materialIncompleteData',
//     label: 'Incomplete Data',
//     align: 'center',
//     field: 'materialIncompleteData',
//   },

//   {
//     name: 'materialLink',
//     label: 'Archival Material Link',
//     align: 'center',
//     field: 'materialLink',
//   },
// ]

// const incompleteRows = ref([
//   {
//     id: 1,
//     materialNo: 'AM-001',
//     materialType: 'Document',
//     materialName: 'Annual Report',
//     materialIncompleteData: 'Author, Date',
//     materialLink: 'http://example.com/notes',
//   },
//   {
//     id: 2,
//     materialNo: 'AM-002',
//     materialType: 'Artifact',
//     materialName: 'Cat Toy',
//     materialIncompleteData: 'Description',
//     materialLink: 'http://example.com/cattoy',
//   },
//   {
//     id: 3,
//     materialNo: 'AM-003',
//     materialType: 'Artifact',
//     materialName: 'Campus Plaque',
//     materialIncompleteData: 'Author',
//     materialLink: 'http://example.com/campus',
//   },
// ])
</script>

<style scoped>
.trophies {
  height: 15rem;
  width: 15rem;
}

.graph {
  width: 20rem;
  align-self: center;
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
  margin-top: 2rem;
  width: 22rem;
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
  height: auto;
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

/* .referral-box {
  border-radius: 15px;
  background: linear-gradient(127deg, #fff 0.9%, #fffce9 88.33%);
  height: 35rem;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
} */

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

/* .incomplete-see-all {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #880000;
  height: 2rem;
  width: 6rem;
} */


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

.trophies {
  max-width: 12.5rem; /* 200px */
  height: auto;
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
  /* Show trophy section with proper positioning */
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
    font-size: 1.5rem; /* Smaller for longer admin title */
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
    height: 15rem; /* Same as index page */
    width: 15rem;
    max-width: 100%;
  }

  .row.q-ml-md.q-gutter-lg {
    margin-left: 1rem;
    gap: 1.5rem;
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
  }

  .box-1, .box-2 {
    width: 100%;
  }

  .box-1 {
    padding: 1rem;
  }

  .box-2 {
    margin-top: 1rem;
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

/* Additional responsive adjustments for better mobile experience */
@media (max-width: 767px) {
  .q-ml-xl {
    margin-left: 1rem !important;
  }

  .q-pa-md {
    padding: 0.5rem;
  }

  /* Make buttons stack vertically on very small screens */
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

/* ========================
 RECENTLY UPLOADED SECTION (box-4)
======================== */

/* Keep original proportions - only minor adjustments for mobile */
.box-4 {
  margin-left: 0; /* Remove on mobile */
  margin-top: 1rem;
}

/* Tablet (768px+) */
@media (min-width: 48rem) {
  .box-4 {
    margin-left: 1rem;
  }
}

/* Desktop (1024px+) - restore original values */
@media (min-width: 64rem) {
  .box-4 {
    margin-left: 3rem; /* Original value */
    height: 35rem; /* Original value */
  }

  .recent-box {
    width: 15rem; /* Original value */
    height: 22rem; /* Original value */
  }

  .recent-card {
    width: 13rem; /* Original value */
    height: 15rem; /* Original value */
  }

  .arrow-button {
    width: 50px; /* Original value */
    height: 50px; /* Original value */
    margin-top: 3.5rem; /* Original value */
  }

  .btn-arrows {
    width: 24px; /* Original value */
    height: 24px; /* Original value */
  }
}

/* Large Desktop (1440px+) - keep originals */
@media (min-width: 90rem) {
  .box-4 {
    margin-left: 3rem; /* Keep original */
    height: 35rem; /* Keep original */
  }

  .recent-box {
    width: 15rem; /* Keep original */
    height: 22rem; /* Keep original */
  }

  .recent-card {
    width: 13rem; /* Keep original */
    height: 15rem; /* Keep original */
  }
}



/* Legend alignment fix */
.box-3 .row.q-py-lg.justify-center.q-gutter-md {
  align-items: center !important;
}

.box-3 .box-legend {
  vertical-align: middle !important;
  margin-right: 0.5rem !important;
}

.box-3 .row.q-py-lg.justify-center.q-gutter-md p {
  vertical-align: middle !important;
  margin: 0 !important;
}

/* Make graphs responsive by default */
.users-graph {
  width: 22rem;
  max-width: 100%;
}

.users-graph canvas {
  max-width: 100%;
  height: auto;
}

.graph {
  width: 20rem;
  max-width: 100%;
  align-self: center;
}

.graph canvas {
  max-width: 100%;
  height: auto;
}

/* ========================
 RESPONSIVE LAYOUT FOR REPORTS AND RECENTLY UPLOADED
======================== */

/* Default layout (above 1200px) - side by side */
.reports-recently-container {
  display: flex;
  align-items: flex-start; /* Align tops of both boxes */
  gap: 2rem; /* Increased gap for better spacing */
  width: 100%;
}

.box-3 {
  flex: 1 1 65%; /* Take 60% of available space */
  min-width: 0;
  border-radius: 15px;
  background: linear-gradient(127deg, #fff 0.9%, #fffce9 88.33%);
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  height: 35rem; /* Match box-4 height */
}

.box-4 {
  border-radius: 15px;
  background: linear-gradient(25deg, #ffffff 35%, #fdf9e7 78%, #fbf4d0 100%);
  flex: 0 0 33%;
  width: 35%;
  height: 35rem;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  justify-content: center;
  margin-left: 0; /* Remove default margin */
}

/* Stack layout (1200px and below) */
@media (max-width: 75rem) { /* 1200px */
  .reports-recently-container {
    flex-direction: column;
    gap: 2rem;
  }

  .box-3 {
    width: 100%;
    flex: none; /* Remove flex constraints */
    height: auto; /* Allow height to adjust */
  }

  .box-4 {
    width: 100%;
    flex: none; /* Remove flex constraints */
    margin-left: 0;
    margin-top: 0;
  }

  /* Make box-3 content responsive */
  .box-3 .row.q-py-md {
    flex-direction: column;
    gap: 2rem;
  }

  .box-3 .col-6 {
    width: 100%;
    flex: none;
  }

  /* Users per Month section responsive */
  .box-3 .users-graph {
    width: 100% !important;
    max-width: 100%;
    margin-top: 1rem;
  }

  .box-3 .users-graph canvas {
    width: 100% !important;
    height: auto !important;
  }

  /* Legend section responsive */
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
    flex-wrap: nowrap !important; /* Force single line */
    gap: 0.5rem;
  }

  .box-3 .row.q-mb-md.items-center.q-gutter-sm {
    flex: 1;
    min-width: 0; /* Allow shrinking */
    flex-wrap: nowrap !important; /* Keep number and title together */
    align-items: center !important; /* Keep number and title aligned */
    justify-content: flex-start !important; /* Keep number at start */
  }

  .box-3 .number {
    flex-shrink: 0 !important; /* Number shouldn't shrink */
  }

  .box-3 .fade-title {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .box-3 .q-mr-md.sub-font-2 {
    flex-shrink: 0; /* Don't shrink the view count */
    white-space: nowrap; /* Keep view count on one line */
  }

  /* Adjust recently uploaded content for full width */
  .recent-box {
    margin: 0 auto; /* Center the box */
  }
}

/* Mobile adjustments for recently uploaded */
@media (max-width: 48rem) { /* 768px */
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

  /* Additional mobile responsive for box-3 */
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

  /* Most viewed artifacts mobile adjustments */
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
    max-width: 6rem !important; /* Even smaller on mobile */
    flex: 1 !important;
    min-width: 0 !important;
  }

  /* Target the specific structure from your HTML */
  .box-3 div[class*="row items-center justify-between"] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: nowrap !important;
    width: 100% !important;
  }

  /* Target the left side (number + title) */
  .box-3 div[class*="row q-mb-md items-center q-gutter-sm"] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    flex: 1 !important;
    min-width: 0 !important;
    margin-right: 1rem !important;
  }

  /* Target the right side (views) specifically */
  .box-3 div[class*="q-mr-md sub-font-2"] {
    flex-shrink: 0 !important;
    margin-left: auto !important;
    margin-right: 1rem !important; /* Add some space from the right edge */
    white-space: nowrap !important;
  }

  .box-3 .fade-title-container {
    max-width: 8rem !important; /* Smaller on mobile */
  }

  /* Main container for each item row */
  .box-3 .row.items-center.justify-between {
    align-items: center !important;
    flex-wrap: nowrap !important; /* Keep single line on mobile too */
    display: flex !important;
    justify-content: space-between !important; /* Keep views on the right */
  }

  /* Left side: number + title container on mobile */
  .box-3 .row.q-mb-md.items-center.q-gutter-sm {
    gap: 0.5rem !important; /* Increase gap for better spacing */
    flex-wrap: nowrap !important;
    align-items: center !important; /* Center align all items */
    justify-content: flex-start !important;
    display: flex !important;
    flex-direction: row !important; /* Force horizontal layout */
    text-align: left !important;
    flex: 1 !important; /* Take available space but leave room for views */
    min-width: 0 !important; /* Allow shrinking */
  }

  /* Ensure number stays on the left and aligned */
  .box-3 .number {
    flex-shrink: 0 !important;
    margin-right: 0 !important;
    align-self: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Override any centering from parent containers but keep items aligned */
  .box-3 .column {
    align-items: flex-start !important;
  }

  .box-3 .fade-title {
    font-size: 11px !important;
    text-align: left !important;
    line-height: 1.2 !important;
    display: inline !important; /* Keep inline */
  }

  .box-3 .fade-title-container {
    display: inline-flex !important; /* Inline flex to stay beside number */
    align-items: center !important;
    flex-direction: row !important;
    vertical-align: middle !important;
  }

  /* Ensure view count stays on the right and aligned */
  .box-3 .q-mr-md.sub-font-2 {
    align-self: center !important;
    line-height: 1.2 !important;
    margin-left: 0 !important; /* Reset margin */
    margin-right: 3rem !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important; /* Keep on one line */
  }
}
</style>
