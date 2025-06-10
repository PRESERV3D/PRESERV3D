<template>
  <q-page class="q-pa-md">
    <router-link to="/documents">Back</router-link>
    <div v-if="doc">
      <PdfPreview :pdfUrl="doc.file_url" style="width: 300px" />
      <h2>{{ doc.metadata.title }}</h2>
      <p><strong>Author:</strong> {{ doc.metadata.author }}</p>
      <p><strong>Date:</strong> {{ doc.metadata.date }}</p>
      <h6>Summary:</h6>
      <p>{{ doc.metadata.summary }}</p>
      <h6>Category:</h6>
      <ul>
        <li v-for="(category, i) in doc.metadata.categories" :key="i">{{ category }}</li>
      </ul>
      <p><strong>Uploaded At: </strong> {{ formatDate(doc.uploaded_at) }}</p>
      <p><strong>Updated At: </strong> {{ formatDate(doc.updated_at) }}</p>
    </div>
    <div v-else>
      <q-spinner />
    </div>
  </q-page>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useModelStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'

const route = useRoute()
const documentsStore = useModelStore()

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const formatted = `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}`
  return formatted
}

const doc = computed(() => documentsStore.documents.find((doc) => doc.id == route.params.id))
</script>
