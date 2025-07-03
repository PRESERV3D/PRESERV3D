<template>
  <q-page class="q-pa-md">
    <router-link to="/artifacts">Back</router-link>

    <div v-if="loading">
      <q-spinner color="primary" size="lg" />
    </div>

    <div v-else-if="model">
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
      <h2>{{ model.metadata.title }}</h2>
      <p><strong>Author:</strong> {{ model.metadata.author }}</p>
      <p><strong>Date:</strong> {{ model.metadata.date }}</p>
      <h6>Summary:</h6>
      <p>{{ model.metadata.summary }}</p>
      <h6>Category:</h6>
      <ul>
        <li v-for="(category, i) in model.metadata.categories" :key="i">{{ category }}</li>
      </ul>
      <p><strong>Uploaded At: </strong> {{ formatDate(model.uploaded_at) }}</p>
      <p><strong>Updated At: </strong> {{ formatDate(model.updated_at) }}</p>
    </div>

    <div v-else>
      <q-banner type="negative">Artifact not found.</q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

const route = useRoute()
const model = ref(null)
const loading = ref(true)

const modelStore = useModelStore()

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('artifacts_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Artifact not found from Supabase:', error)
    // Fallback to modelStore if Supabase fails
    model.value = modelStore.models.find((m) => m.id == route.params.id) || null
    console.log('Fallback Model from Store:', model.value)
  } else {
    model.value = data
    console.log('Model from Supabase:', model.value)
  }

  loading.value = false
})
</script>
