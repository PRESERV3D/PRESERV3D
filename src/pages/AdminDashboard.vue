<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-sm">
      <div class="q-mt-xs box-1 row items-center">
        <div class="col-7 q-gutter-xs">
          <p class="q-ml-xl admin-title">Explore & Manage Cultural Heritage Assets</p>
          <p class="q-ml-xl admin-subtitle">
            Access digital artifacts, document, and research <br />
            tools — all in one place.
          </p>
          <div class="q-ml-md q-gutter-lg">
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" no-caps />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" no-caps />
          </div>
        </div>
        <div class="col-5 q-gutter-xs">
          <q-img
            src="src/assets/img/trophy-document.png"
            alt="Trophy and Document"
            class="trophies"
          />
        </div>
      </div>

      <div class="q-mt-xs box-2">
        <p class="q-ml-lg admin-title-2">Uploaded Archives</p>
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
          <!-- Uploaded Archives Line Graph -->
          <div>
            <canvas ref="uploadedArchives"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="row q-my-lg">
      <div class="column box-3 q-px-lg">
        <div class="row item-center justify-between q-mb-sm">
          <p class="q-ml-md admin-title-2">Reports</p>
          <!-- <div class="q-mt-md">
              <q-btn label="Generate Report" class="btn-report" no-caps />
            </div> -->
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
            <div class="row q-py-sm justify-center q-gutter-md">
              <!-- To be removed -->
              <div class="box-legend" style="background-color: #880000"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Students</p>
              <div class="box-legend" style="background-color: #efaf00"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Faculty</p>
              <div class="box-legend" style="background-color: #3d86ff"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">Visitors</p>
              <!--  -->

              <!-- Users per Month Line Graph -->
              <div>
                <canvas ref="usersPerMonth"></canvas>
              </div>
            </div>
          </div>

          <div class="col-6">
            <p class="sub-font">Most Viewed Artifacts Materials</p>
            <div class="column">
              <p class="q-py-xs sub-font" style="font-size: 14px">Artifacts</p>

              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <p class="number">1</p>
                  <p class="sub-font-2">Artifact Title 1</p>
                </div>
                <p class="q-mr-md sub-font-2" style="font-size: 12px">9.5k views</p>
              </div>

              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <p class="number">2</p>
                  <p class="sub-font-2">Artifact Title 2</p>
                </div>
                <p class="q-mr-md sub-font-2" style="font-size: 12px">7.2k views</p>
              </div>

              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <p class="number">3</p>
                  <p class="sub-font-2">Artifact Title 3</p>
                </div>
                <p class="q-mr-md sub-font-2" style="font-size: 12px">6.8k views</p>
              </div>

              <p class="q-py-xs sub-font" style="font-size: 14px">Documents</p>

              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <p class="number">1</p>
                  <p class="sub-font-2">Document Title 1</p>
                </div>
                <p class="q-mr-md sub-font-2" style="font-size: 12px">12.4k views</p>
              </div>

              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <p class="number">2</p>
                  <p class="sub-font-2">Document Title 2</p>
                </div>
                <p class="q-mr-md sub-font-2" style="font-size: 12px">8.1k views</p>
              </div>

              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <p class="number">3</p>
                  <p class="sub-font-2">Document Title 3</p>
                </div>
                <p class="q-mr-md sub-font-2" style="font-size: 12px">5.9k views</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="box-4">
        <p class="q-ml-lg admin-title-2">Recently Uploaded</p>
        <div class="q-pa-md">
          <div class="col q-gutter-lg q-px-sm">
            <div class="recent-box q-pa-sm flex column items-center">
              <div class="recent-card"></div>
              <div class="q-mt-md self-start sub-font-4" style="margin-left: 1rem">Title</div>
              <div class="q-mt-sm self-start sub-font-2" style="margin-left: 1rem; color: #ffffff">
                Date Added
              </div>
            </div>
          </div>

          <div class="row q-gutter-lg items-center justify-center">
            <q-btn flat round class="arrow-button" @click="goBack">
              <img src="/icons/arrow_left.png" alt="back" class="btn-arrows" />
            </q-btn>

            <q-btn flat round class="arrow-button" @click="goNext">
              <img src="/icons/arrow_right.png" alt="next" class="btn-arrows" />
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from 'boot/supabase'
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

onMounted(async () => {
  const chartData = await prepareChartData()
  const usersData = await prepareUsersData()

  // Update counts from chartData and usersData
  artifacts.value = chartData.artifactsCounts.reduce((sum, val) => sum + val, 0)
  documents.value = chartData.documentsCounts.reduce((sum, val) => sum + val, 0)
  users.value = usersData.usersCounts.reduce((sum, val) => sum + val, 0)

  initChart(chartData)
  initUsersPerMonthChart(usersData)
})

function goBack() {}
function goNext() {}

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
  new Chart(usersPerMonth.value, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: 'Users per Month',
          data: data.usersCounts,
          borderColor: '#880000',
          fill: false,
        },
      ],
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
}

async function prepareUsersData() {
  const { data: users } = await supabase.from('registered_users').select('created_at')

  // Process the user data to get counts per month
  const usersCounts = Array(12).fill(0)
  function incrementCount(data, counter) {
    data.forEach((item) => {
      const date = new Date(item.created_at)
      const monthIndex = date.getMonth()
      counter[monthIndex]++
    })
  }

  incrementCount(users, usersCounts)

  return {
    usersCounts,
  }
}

// async function mostViewed() {
//   const { data: artifacts } = await supabase.from('artifacts_metadata').select('*')
//   const { data: documents } = await supabase.from('documents_metadata').select('views')

//   const artifactsViews = artifacts.reduce((sum, item) => sum + item.views, 0)
//   const documentsViews = documents.reduce((sum, item) => sum + item.views, 0)

//   return {
//     artifactsViews,
//     documentsViews,
//   }
// }
</script>
