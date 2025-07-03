<template>
  <q-page class="q-pa-md">
    <div v-if="loading">
      <q-spinner color="primary" size="lg" />
    </div>

    <div v-else-if="doc">
      <div class="row q-mt-xs q-gutter-md justify-center items-start">
        <div class="col-auto flex flex-column items-start q-mt-sm">
          <router-link to="/documents" class="back-button-top">
            <q-btn flat icon="arrow_back" label="Back to Documents" />
          </router-link>
        </div>
        <div class="col-auto">
          <q-img
            :src="doc.preview_url"
            class="document-img"
            style="margin-top: 1.5rem; z-index: 1"
          />
        </div>
        <div class="col">
          <h2 class="document-title">{{ doc.metadata.title }}</h2>
          <div class="row items-center justify-center">
            <p class="sub-font-3" style="font-size: 18px; margin: 0">
              {{ doc.metadata.author }}
            </p>
            <div class="edit-delete-btns row q-gutter-sm">
              <q-btn label="Edit" class="actions" no-caps flat @click="handleEdit" />

              <q-btn label="Delete" class="actions" no-caps flat @click="showDialog = true" />
            </div>

            <!-- Confirmation Dialog      -->
            <q-dialog v-model="showDialog" persistent>
              <q-card class="confirmation-delete">
                <q-card-section class="column items-center">
                  <q-img
                    src="src/assets/img/conf-delete.png"
                    alt="question icon"
                    class="question-icon"
                  />
                  <div class="q-mt-md sub-font" style="color: #000000">
                    Are you sure you want to delete this?
                  </div>
                </q-card-section>
                <q-card-actions align="center">
                  <q-btn label="Yes" class="btn-save" flat @click="handleDelete" />
                  <q-btn
                    flat
                    label="No"
                    class="sub-font-2"
                    style="color: #000000"
                    v-close-popup
                    no-caps
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
        </div>
      </div>

      <div class="preview-container">
        <div class="box-view">
          <div class="row-1">
            <q-btn class="start-reading-btn" no-caps>
              Start Reading
              <img
                src="src/assets/img/arrow-tilt.png"
                alt="Start Reading"
                class="q-ml-sm btn-arrow-tilt"
              />
            </q-btn>
          </div>
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
                <p><strong>Date:</strong> {{ doc.metadata.date }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <q-banner type="negative">Document not found.</q-banner>
    </div>
    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="handleCancelMetadata"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from 'boot/supabase'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const doc = ref(null)
const loading = ref(true)
const showDialog = ref(false)
const dialog = ref(false)
const metadata = ref(null)

async function handleEdit() {
  metadata.value = {
    ...doc.value.metadata,
    file_name: doc.value.file_name,
  }

  dialog.value = true
}

async function saveMetadata(newMetadata) {
  try {
    console.log(newMetadata.metadata)
    const { error } = await supabase
      .from('documents_metadata')
      .update({
        metadata: {
          title: newMetadata.title,
          author: newMetadata.author,
          date: newMetadata.date,
          summary: newMetadata.summary,
          keywords: newMetadata.keywords,
          categories: newMetadata.categories,
        },
        updated_at: new Date(),
      })
      .eq('file_name', newMetadata.file_name)

    if (error) {
      console.error('Failed to update metadata:', error)
      alert('Failed to update metadata.')
    } else {
      alert('Metadata saved successfully!')
      dialog.value = false

      location.reload()
    }
  } catch (err) {
    console.error('Error saving metadata:', err)
    alert('Unexpected error occurred.')
  }
}

async function handleDelete() {
  try {
    console.log('Trying to delete ID:', route.params.id)

    const { data, error } = await supabase
      .from('documents_metadata')
      .delete()
      .eq('id', route.params.id)

    console.log(data)

    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete the document.')
    } else {
      alert('Document deleted successfully.')
      showDialog.value = false
      router.push({ name: 'documents' })
    }
  } catch (err) {
    console.error('Unexpected error during delete:', err)
    alert('An unexpected error occurred.')
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('documents_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Failed to fetch document:', error)
    doc.value = null
  } else {
    doc.value = data
  }

  loading.value = false
})
</script>
