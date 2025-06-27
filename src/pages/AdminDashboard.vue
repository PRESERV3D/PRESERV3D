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
        </div>
      </div>
    </div>

    <div class="row q-my-lg">
      <div class="column box-3 q-px-lg">
        <div class="row item-center justify-between q-mb-sm">
          <p class="q-ml-md admin-title-2">Reports</p>
          <div class="q-mt-md">
            <q-btn label="Generate Report" class="btn-report" no-caps />
          </div>
        </div>
        <div class="row q-gutter-md q-px-sm">
          <div class="col box-report">
            <div class="number-report">3.2k</div>
            <div class="label">All Active User</div>
          </div>
          <div class="col box-report">
            <div class="number-report">2k</div>
            <div class="label">Total Artifacts</div>
          </div>
          <div class="col box-report">
            <div class="number-report">3.2k</div>
            <div class="label">Total Documents</div>
          </div>
        </div>
        <div class="row q-py-md">
          <div class="col-6">
            <p class="q-ml-md sub-font">Users per Month</p>
            <div class="row q-py-sm justify-center q-gutter-md">
              <div class="box-legend" style="background-color: #880000"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Students</p>
              <div class="box-legend" style="background-color: #efaf00"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">PUP Faculty</p>
              <div class="box-legend" style="background-color: #3d86ff"></div>
              <p class="q-ml-sm sub-font" style="font-size: 12px">Visitors</p>
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
            <div class="recent-box">
              <div class="recent-card"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
const activeFilter = ref('all')
</script>
