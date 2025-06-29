<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Documents</div>
      <div class="q-mb-md sub-font-3 row items-baseline justify-between">
        <div>Browse selected digital books from the university archives.</div>
        <q-btn to="/artifacts" label="Add New" class="btn-add" no-caps />
      </div>
    </div>
    <div class="q-py-lg q-gutter-xl column">
      <div class="box-highlights">
        <p class="q-ml-lg admin-title-2" style="font-size: 16px">Book Highlights</p>
      </div>
      <div class="box-category">
        <div class="q-pa-lg">
          <p class="admin-title-2" style="font-size: 16px; margin-top: 0">Category</p>
          <div class="row q-gutter-md">
            <q-btn
              label="All"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'all' }"
              @click="activeFilter = 'all'"
            />
            <q-btn
              label="Journals"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'journals' }"
              @click="activeFilter = 'journals'"
            />
            <q-btn
              label="Documents"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'documents' }"
              @click="activeFilter = 'documents'"
            />
            <q-btn
              label="Historical Records"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'historical records' }"
              @click="activeFilter = 'historical records'"
            />
            <q-btn
              label="Manuscripts"
              no-caps
              class="btn-1"
              :class="{ active: activeFilter === 'manuscripts' }"
              @click="activeFilter = 'manuscripts'"
            />
          </div>
          <div class="row q-gutter-md q-mt-md justify-around">
            <div v-for="(doc, index) in documentsStore.documents" :key="index" class="card-wrapper">
              <q-card class="my-card documentCard" rounded bordered>
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                >
                  <PdfPreview :pdfUrl="doc.file_url" class="document" />
                </router-link>
              </q-card>

              <div class="q-mt-md fade-title-container">
                <div class="q-mt-md sub-font fade-title" style="color: black">
                  {{ doc.metadata.title }}
                  <div class="tooltip-box">{{ doc.metadata.title }}</div>
                </div>
              </div>
              <div class="q-mt-sm sub-font-2" style="color: black; font-weight: 200">
                Author: {{ doc.metadata.author }}
              </div>
            </div>
          </div>
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
