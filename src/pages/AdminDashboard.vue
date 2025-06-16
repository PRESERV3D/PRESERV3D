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
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" />
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
            class="btn-1"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          />
          <q-btn
            label="Artifacts"
            class="btn-1"
            :class="{ active: activeFilter === 'artifacts' }"
            @click="activeFilter = 'artifacts'"
          />
          <q-btn
            label="Documents"
            class="btn-1"
            :class="{ active: activeFilter === 'documents' }"
            @click="activeFilter = 'documents'"
          />
        </div>
      </div>
    </div>

    <div class="row q-my-lg">
      <div class="row box-3 item-center justify-between q-px-lg">
        <p class="admin-title-2">Reports</p>
        <div class="q-my-xs q-gutter-md">
          <q-btn label="Generate Report" class="btn-report" />
        </div>
      </div>

      <div class="box-4">
        <p class="q-ml-lg admin-title-2">Recently Uploaded</p>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
const activeFilter = ref('all')
</script>
