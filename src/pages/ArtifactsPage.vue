<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Artifacts</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>
    <div class="row q-gutter-md q-mt-md">
      <div v-for="(model, i) in modelStore.models" :key="i" class="card-wrapper">
        <q-card class="my-card" rounded bordered>
          <div class="card">
            <model-viewer
              :src="model.file_url"
              camera-controls
              loading="lazy"
              auto-rotate
              auto-rotate-delay="1500"
              rotation-per-second="10deg"
              shadow-intensity="1"
              class="artifacts"
              style="width: 300px; height: 300px"
            />
          </div>
          <q-card-section class="q-pa-sm">
            <div class="text-subtitle1">{{ model.metadata?.title || model.file_name }}</div>
            <router-link
              :to="{ name: 'view-artifact', params: { id: model.id } }"
              class="text-primary"
              >View Artifact</router-link
            >
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

const modelStore = useModelStore()

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/models')
    const models = await res.json()
    modelStore.setModels(models)
  } catch (err) {
    console.error('Failed to load models:', err)
  }
})
</script>
