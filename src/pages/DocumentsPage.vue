<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Documents</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>
    <div>
      <div class="row q-gutter-md q-mt-md">
        <div v-for="(doc, index) in documentsStore.documents" :key="index" class="card-wrapper">
          <q-card class="my-card documentCard" rounded bordered scrollable>
            <PdfPreview :pdfUrl="doc.file_url" class="document" />

            <div class="metadata q-px-sm">
              <h6>{{ doc.metadata.title }}</h6>
              <p class="q-mb-sm">Author: {{ doc.metadata.author }}</p>
            </div>
            <router-link
              :to="{ name: 'view-document', params: { id: doc.id } }"
              class="text-primary q-px-sm"
            >
              View Document
            </router-link>
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

const documentsStore = useModelStore()

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
