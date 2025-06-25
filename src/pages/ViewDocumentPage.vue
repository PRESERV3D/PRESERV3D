<template>
  <q-page class="q-pa-md">
    <div v-if="doc">
      <div class="row q-mt-xs q-gutter-md justify-center items-start">
        <div class="col-auto flex flex-column items-start q-mt-sm">
          <router-link to="/documents">Back</router-link>
        </div>
        <div class="col-auto">
          <PdfPreview :pdfUrl="doc.file_url" class="document-img" />
        </div>
        <div class="col">
          <h2 class="document-title">{{ doc.metadata.title }}</h2>
          <div class="row items-baseline">
            <p class="sub-font-3" style="font-size: 18px; margin-left: 0.5rem">
              {{ doc.metadata.author }}
            </p>
            <div class="edit-delete-btns">
              <p class="sub-font-5" style="font-size: 14px">Edit</p>
              <p class="sub-font-5" style="font-size: 14px">Delete</p>
            </div>
          </div>
        </div>
      </div>

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
