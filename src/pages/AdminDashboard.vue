<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-sm">
      <div class="q-mt-xs box-1 row items-center">
        <div class="col-7">
          <p class="q-ml-xl admin-title">Explore & Manage Cultural Heritage Assets</p>
          <p class="q-ml-xl admin-subtitle">
            Access digital artifacts, document, and research <br />
            tools — all in one place.
          </p>
          <div class="row q-ml-md q-gutter-lg">
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" no-caps />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" no-caps />
          </div>
        </div>
        <div class="col-5">
          <q-img
            src="src/assets/img/trophy-document.png"
            alt="Trophy and Document"
            class="trophies"
          />
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

    <div class="row q-my-lg">
      <div class="column box-3 q-px-lg">
        <div class="row item-center justify-between q-mb-sm">
          <p class="q-ml-md title-font-2">Reports</p>
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
              <!-- <div class="box-legend" style="background-color: #880000"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Students</p>
              <div class="box-legend" style="background-color: #efaf00"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Faculty</p>
              <div class="box-legend" style="background-color: #3d86ff"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">Visitors</p> -->
              <!--  -->

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
                      {{ item.title }}
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
                      {{ item.title }}
                      <div class="tooltip-box">{{ item.title }}</div>
                    </div>
                  </div>
                </div>
                <div class="q-mr-md sub-font-2" style="font-size: 12px">{{ item.views }} views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="box-4">
        <p class="q-ml-lg title-font-2">Recently Uploaded</p>

        <div class="column q-mt-lg items-center">
          <div class="recent-box q-pa-xs column items-center">
            <div class="recent-card">
              <component
                :is="isGLB(currentItem?.file_name) ? 'model-viewer' : 'img'"
                v-bind="
                  isGLB(currentItem?.file_name)
                    ? modelViewerProps(currentItem.file_url)
                    : imgProps(currentItem)
                "
                class="q-mx-auto"
                style="max-width: 200px; max-height: 250px"
              />
            </div>
            <div class="q-mt-md self-start" style="margin-left: 1rem">
              <div class="fade-title-container" style="max-width: 10rem">
                <div class="sub-font-4 fade-title">
                  {{ recentStore.recentItems[currentIndex]?.metadata?.title || 'Untitled' }}
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
              <img src="/icons/arrow_left.png" alt="back" class="btn-arrows" />
            </q-btn>

            <q-btn
              flat
              round
              class="arrow-button"
              @click="currentIndex = (currentIndex + 1) % recentStore.recentItems.length"
            >
              <img src="/icons/arrow_right.png" alt="next" class="btn-arrows" />
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.admin-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 32px;
  color: #fefcf3;
  margin-top: 1rem;
}

.admin-subtitle {
  font-family: 'Poppins', sans-serif;
  font-weight: 100;
  font-size: 16px;
  color: #fefcf3;
}

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
  margin-top: 5rem;
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
</style>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import '@google/model-viewer'
import { supabase } from 'boot/supabase'
import { useRecentStore } from 'stores/recentStore'
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

let topArtifacts = ref([])
const topDocuments = ref([])

const recentStore = useRecentStore()
const currentIndex = ref(0)
const currentItem = computed(() => recentStore.recentItems[currentIndex.value])

onMounted(async () => {
  const chartData = await prepareChartData()
  const usersData = await prepareUsersData()
  const { data: topArts } = await supabase.from('top_artifacts').select('*')
  const { data: topDocus } = await supabase.from('top_documents').select('*')
  await recentStore.fetchRecentUploads()

  topArtifacts.value = topArts
  topDocuments.value = topDocus

  // Update counts from chartData and usersData
  artifacts.value = chartData.artifactsCounts.reduce((sum, val) => sum + val, 0)
  documents.value = chartData.documentsCounts.reduce((sum, val) => sum + val, 0)
  users.value = usersData.usersCounts.reduce((sum, val) => sum + val, 0)

  initChart(chartData)
  initUsersPerMonthChart(usersData)
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
