<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Documents</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>
    <div>
      <div class="row q-gutter-md q-mt-md">
        <div v-for="(doc, index) in documentsStore.documents" :key="index" class="card-wrapper">
          <q-card
            class="my-card documentCard"
            rounded
            bordered
            scrollable
            clickable
            @click="goToDocument(doc)"
          >
            <PdfPreview :pdfUrl="doc.file_url" class="document" />

            <div class="metadata q-px-sm">
              <h6>{{ doc.metadata.title }}</h6>
              <p class="q-mb-sm">Author: {{ doc.metadata.author }}</p>
              <p class="q-mb-sm">Date: {{ doc.metadata.date }}</p>
              <p class="q-mb-sm">Upload at: {{ formatDate(doc.uploaded_at) }}</p>
              <p class="q-mb-sm">Updated at: {{ formatDate(doc.updated_at) }}</p>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useModelStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const documentsStore = useModelStore()

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const formatted = `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}`
  return formatted
}

function goToDocument(doc) {
  router.push({ name: 'view-document', params: { id: doc.id } })
}

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/documents')
    const docs = await res.json()
    documentsStore.setDocuments(docs)
  } catch (err) {
    console.error('Failed to load documents', err)
  }
})
</script>
