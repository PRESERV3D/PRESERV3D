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
              class="no-decoration"
            >
              <q-btn label="Now Read" class="now-read-btn" unelevated no-caps />
            </router-link>
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
import { supabase } from 'boot/supabase'

const modelStore = useModelStore()

onMounted(async () => {
  // Load artifacts metadata from Supabase
  try {
    const { data, error } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    console.log('Fetched artifacts:', data)

    if (error) {
      console.error('Supabase error fetching artifacts:', error)
      return
    }

    modelStore.setModels(data)
  } catch (err) {
    console.error('Unexpected error while loading artifacts:', err)
  }
})
</script>
