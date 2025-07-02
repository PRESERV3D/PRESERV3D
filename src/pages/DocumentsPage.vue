<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Documents</div>
      <div class="q-mb-md sub-font-3 row items-baseline justify-between">
        <div class="q-ml-sm">Browse selected digital books from the university archives.</div>
        <q-btn label="Add New" class="btn-add" no-caps @click="showDialog = true" />
      </div>
    </div>

    <q-dialog v-model="showDialog" persistent>
      <q-card class="add-document-card">
        <q-card-section class="box-upload-docu">
          <!-- Upload Icon -->
          <q-img
            src="src/assets/img/drag-drop-icon.png"
            alt="Upload-Document"
            class="upload-icon-docu"
          />
          <div class="sub-font-3 text-center" style="font-size: 18px; font-weight: 200">
            DRAG and DROP files
          </div>

          <!-- IF NO FILE SELECTED -->
          <div v-if="!selectedFile" class="sub-font-3 text-center" style="font-weight: 200">
            or <a href="#" @click.prevent="triggerFileInput"><strong>Browse Files</strong></a> on
            your computer
          </div>

          <!-- IF FILE SELECTED -->
          <div v-else class="document-preview text-center">
            <q-img
              src="src/assets/img/document-icon.png"
              alt="Document"
              class="document-icon"
              style="width: 80px; height: 80px; margin: 0 auto"
            />
            <div class="document-name q-mt-md sub-font-3" style="font-size: 16px; font-weight: 400">
              {{ selectedFile.name }}
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            type="file"
            ref="selectedFileInput"
            accept=".pdf"
            style="display: none"
            @change="handleFileChange"
          />
        </q-card-section>

        <q-card-actions class="row q-ml-lg justify-between items-center">
          <div></div>
          <q-btn label="Save" class="q-ml-xl q-mt-sm btn-save" @click="handleUpload" no-caps />
          <q-btn
            flat
            label="Cancel"
            class="q-mt-sm sub-font-2"
            style="color: #000000"
            v-close-popup
            no-caps
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="column q-py-md q-gutter-lg">
      <div class="box-highlights">
        <p class="q-ml-lg admin-title-2" style="font-size: 16px">Book Highlights</p>
        <div class="row q-ml-xs q-gutter-sm justify-around">
          <div
            v-for="(doc, index) in documentsStore.documents.slice(0, 3)"
            :key="index"
            class="card-wrapper"
          >
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

    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="handleCancelMetadata"
    />
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDocumentsStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { supabase } from 'boot/supabase'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const showDialog = ref(false)

//
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

const selectedFile = ref(null)
const dialog = ref(false)
const loading = ref(false)
const router = useRouter()

const metadata = ref({
  file_name: '',
  file_url: '',
  title: '',
  author: '',
  date: '',
  summary: '',
  keywords: [],
  categories: [],
})

function triggerFileInput() {
  selectedFile.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    console.log('Selected file:', file.name)
  } else {
    selectedFile.value = null
  }
}

const handleUpload = async () => {
  const file = selectedFile.value
  const fileName = file.name

  if (!file || (!fileName.endsWith('.pdf') && !fileName.endsWith('.glb'))) {
    alert('Only .pdf and .glb files are allowed.')
    return
  }

  loading.value = true
  const isPdf = fileName.endsWith('.pdf')
  const folder = isPdf ? 'documents' : 'artifacts'
  const bucket = folder
  try {
    const alreadyExists = await fileExists(fileName)
    let nlpMetadata = {}

    if (alreadyExists) {
      alert(`A file named "${fileName}" already exists. Please rename or choose another file.`)
      return
    }

    // NLP processing for PDFs
    if (isPdf) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('http://localhost:8000/process-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      nlpMetadata = response.data
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(`${fileName}`, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: isPdf ? 'application/pdf' : 'model/gltf-binary',
    })

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${fileName}`)
    const fileUrl = urlData.publicUrl

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Upload failed.')
      return
    }

    // Save metadata
    const supabaseTable = isPdf ? 'documents_metadata' : 'artifacts_metadata'

    const insertData = {
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date(),
      updated_at: new Date(),
      ...(isPdf && { metadata: nlpMetadata }),
    }

    const { error: dbError } = await supabase.from(supabaseTable).insert([insertData])
    if (dbError) {
      console.error('Supabase insert error:', dbError)
      alert('Upload succeeded but metadata failed to save.')
      return
    }

    // Open metadata confirmation dialog
    metadata.value = {
      file_name: fileName,
      file_url: fileUrl,
      title: nlpMetadata.title || '',
      author: nlpMetadata.author || '',
      date: nlpMetadata.date || '',
      summary: nlpMetadata.summary || '',
      keywords: nlpMetadata.keywords || [],
      categories: nlpMetadata.categories || [],
    }

    dialog.value = true
  } catch (err) {
    console.error('Upload failed:', err)
    alert('Upload failed. See console for details.')
  } finally {
    loading.value = false
  }
}

async function fileExists(fileName) {
  const isPDF = fileName.toLowerCase().endsWith('.pdf')
  const isGLB = fileName.toLowerCase().endsWith('.glb')
  const table = isPDF ? 'documents_metadata' : isGLB ? 'artifacts_metadata' : null

  if (!table) return false

  const { data, error } = await supabase.from(table).select('file_name').eq('file_name', fileName)

  if (!data || data.length === 0) return false

  if (error) {
    console.error('Error checking file existence:', error)
    return false
  }

  return !!data
}

async function saveMetadata(updatedMetadata) {
  const isPdf = metadata.value.file_name.endsWith('.pdf')
  const table = isPdf ? 'documents_metadata' : 'artifacts_metadata'
  console.log('Saving metadata: ', updatedMetadata)
  try {
    const { error } = await supabase
      .from(table)
      .update({
        metadata: {
          title: updatedMetadata.title,
          author: updatedMetadata.author,
          date: updatedMetadata.date,
          summary: updatedMetadata.summary,
          keywords: updatedMetadata.keywords,
          categories: updatedMetadata.categories,
        },
        updated_at: new Date(),
      })
      .eq('file_name', metadata.value.file_name)

    if (error) {
      console.error('Failed to update metadata:', error)
      alert('Failed to update metadata.')
    } else {
      alert('Metadata saved successfully!')
      dialog.value = false
      router.push({ name: 'dashboard' })
    }
  } catch (err) {
    console.error('Error saving metadata:', err)
    alert('Unexpected error occurred.')
  }
}

async function handleCancelMetadata(cancelledData) {
  try {
    const fileName = cancelledData.file_name
    const isPDF = fileName.toLowerCase().endsWith('.pdf')
    const isGLB = fileName.toLowerCase().endsWith('.glb')

    const table = isPDF ? 'documents_metadata' : isGLB ? 'artifacts_metadata' : null

    if (!table || !fileName) return

    const { error } = await supabase.from(table).delete().eq('file_name', fileName)

    if (error) {
      console.error('Error deleting cancelled metadata:', error)
    } else {
      console.log('Cancelled metadata removed successfully.')
    }
  } catch (err) {
    console.error('Failed to cancel and delete metadata:', err)
  } finally {
    dialog.value = false
  }
}
</script>
