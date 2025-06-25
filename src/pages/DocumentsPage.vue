<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Documents</h2>
      <h5 class="q-mt-xs q-mb-lg">Lorem ipsum dolor sit, amet consectetur adipisicing elit.</h5>
    </div>
    <div>
      <div class="row q-gutter-md q-mt-md">
        <div v-for="(doc, index) in documentsStore.documents" :key="index" class="card-wrapper">
          <q-card class="my-card documentCard" rounded bordered>
            <PdfPreview :pdfUrl="doc.file_url" class="document" />
            <div class="metadata q-px-sm">
              <h6>{{ doc.metadata?.title || 'Untitled' }}</h6>
              <p class="q-mb-sm">Author: {{ doc.metadata?.author || 'Unknown' }}</p>
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
import { useDocumentsStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'
import { supabase } from 'boot/supabase'

const documentsStore = useDocumentsStore()

onMounted(async () => {
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
})
</script>
