<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Documents</div>
      <div class="q-mb-md sub-font-3 row items-baseline justify-between">
        <div class="q-ml-sm">Browse selected digital books from the university archives.</div>
        <q-btn to="/upload" label="Add New" class="btn-add" no-caps />
      </div>
    </div>

    <div class="column q-py-md q-gutter-lg">
      <div class="box-highlights">
        <p class="q-ml-lg admin-title-2" style="font-size: 16px">Book Highlights</p>
        <div class="row q-ml-xs q-gutter-md justify-around">
          <div v-for="(doc, index) in documentsStore.documents" :key="index" class="card-wrapper">
            <div class="row no-wrap">
              <q-card class="my-card documentCard" style="transform: rotate(-5deg)">
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                >
                  <PdfPreview :pdfUrl="doc.file_url" class="document" />
                </router-link>
              </q-card>

              <div class="bg-highlights-details">
                <div class="fade-title-container">
                  <div class="title-highlight fade-title">
                    {{ doc.metadata.title }}
                    <div class="tooltip-box">{{ doc.metadata.title }}</div>
                  </div>
                </div>
                <div class="sub-details">
                  {{ doc.metadata.summary }}
                </div>
                <div class="q-mt-xs q-mb-xs flex justify-center">
                  <router-link :to="{ name: 'view-document', params: { id: doc.id } }">
                    <q-btn label="Now Read" class="now-read-btn" unelevated no-caps />
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <div
              v-for="(doc, i) in searchStore.query
                ? searchStore.results
                : documentsStore.documents.slice(0, 3)"
              :key="i"
              class="card-wrapper"
            >
              <q-card class="my-card documentCard" rounded bordered>
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                >
                  <PdfPreview :pdfUrl="doc.file_url" class="document" />
                </router-link>
              </q-card>

              <div class="q-mt-md fade-title-container">
                <div class="q-mt-md sub-font fade-title" style="color: black; font-weight: 800">
                  {{ doc.metadata.title }}
                  <div class="tooltip-box">{{ doc.metadata.title }}</div>
                </div>
              </div>
              <div class="q-mt-sm sub-font-2" style="color: black; font-weight: 200">
                {{ doc.metadata.author }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useDocumentsStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'
import { supabase } from 'boot/supabase'
import { useSearchStore } from 'stores/searchStore'

const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()

// Fetch all documents from Supabase
const fetchAllDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching documents:', error)
      return
    }

    documentsStore.setDocuments(data)
  } catch (err) {
    console.error('Unexpected error while loading documents:', err)
  }
}

// Initial load
onMounted(async () => {
  if (!searchStore.query) {
    await fetchAllDocuments()
  }
})

onUnmounted(() => {
  searchStore.clear()
})
// onMounted(async () => {
//   try {
//     const { data, error } = await supabase
//       .from('documents_metadata')
//       .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
//       .order('uploaded_at', { ascending: false })

//     if (error) {
//       console.error('Supabase error fetching documents:', error)
//       return
//     }

//     documentsStore.setDocuments(data)
//   } catch (err) {
//     console.error('Unexpected error while loading documents:', err)
//   }
// })
</script>
