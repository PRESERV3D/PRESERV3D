<template>
  <q-page class="q-pa-md">
    <div v-if="doc">
      <div class="row q-mt-xs q-gutter-md justify-center items-start">
        <div class="col-auto flex flex-column items-start q-mt-sm">
          <router-link to="/documents">Back</router-link>
        </div>
        <div class="col-auto">
          <PdfPreview :pdfUrl="doc.file_url" class="document-img" style="z-index: 1" />
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

      <div class="preview-container">
        <div class="box-view">
          <div class="row">
            <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 10rem">Tags:</div>
            <div class="tags">
              <span class="tag-box" v-for="(category, i) in doc.metadata.categories" :key="i">
                {{ category }}
              </span>
            </div>
          </div>

          <div class="row description-row">
            <div class="description-section">
              <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 2rem">
                Description
              </div>
              <div class="q-ml-md summary">
                {{ doc.metadata.summary }}
              </div>
            </div>
            <div class="meta-section">
              <div class="font-label">
                <p><strong>Uploaded At:</strong> {{ formatDate(doc.uploaded_at) }}</p>
                <p><strong>Updated At:</strong> {{ formatDate(doc.updated_at) }}</p>
                <!-- <p><strong>Modified By:</strong>{{ doc.metadata.modified_by }}</p> -->
                <p><strong>Date:</strong> {{ doc.metadata.date }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <q-spinner />
    </div>
  </q-page>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useDocumentsStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'

const route = useRoute()
const documentsStore = useDocumentsStore()

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const formatted = `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}`
  return formatted
}

const doc = computed(() => documentsStore.documents.find((doc) => doc.id == route.params.id))
</script>
