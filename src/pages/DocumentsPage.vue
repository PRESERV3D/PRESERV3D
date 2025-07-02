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
          <q-img
            src="src/assets/img/drag-drop-icon.png"
            alt="Upload-Document"
            class="upload-icon-docu"
          />
          <div v-if="!selectedFile" class="sub-font-3 text-center" style="font-weight: 200">
            <div class="sub-font-3 text-center" style="font-size: 18px; font-weight: 200">
              DRAG and DROP files
            </div>
            or <a href="#" @click.prevent="triggerFileInput"><strong>Browse Files</strong></a> on
            your computer
          </div>
          <div v-else class="document-preview text-center">
            <q-img src="src/assets/img/document-icon.png" alt="Document" class="document-icon" />
            <div class="selected-document-name q-mt-md">
              {{ selectedFile.name }}
            </div>
          </div>
          <input
            type="file"
            ref="fileInput"
            accept=".pdf"
            style="display: none"
            @change="handleFileChange"
          />
        </q-card-section>

        <q-card-actions class="row q-ml-lg justify-between items-center">
          <div></div>
          <q-btn label="Upload" class="q-ml-xl q-mt-sm btn-save" @click="handleUpload" no-caps />
          <q-btn
            flat
            label="Cancel"
            class="q-mt-sm sub-font-2"
            style="color: #000000"
            v-close-popup
            no-caps
            @click="handleCancel"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="column q-py-md q-gutter-lg">
      <div class="box-highlights">
        <p class="q-ml-lg admin-title-2" style="font-size: 16px">Book Highlights</p>
        <div class="row docs-gap justify-start">
          <div v-for="(doc, index) in documentsStore.documents.slice(0, 3)" :key="index">
            <div class="row q-mb-lg">
              <q-card class="my-card documentCard" style="transform: rotate(-5deg)">
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                >
                  <PdfPreview :pdfUrl="doc.file_url" class="document" />
                </router-link>
                <q-btn
                  icon="bookmark_border"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  @click="openBookmarkDialog(doc, 'document')"
                />
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
                <q-btn
                  icon="bookmark_border"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  @click="openBookmarkDialog(doc, 'document')"
                />
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

              <!-- Bookmark Dialog -->
              <q-dialog v-model="dialogOpen">
                <q-card style="min-width: 300px; max-width: 400px">
                  <q-card-section>
                    <div class="text-h6">Add to Collections</div>
                  </q-card-section>

                  <q-separator />

                  <q-card-section>
                    <div v-if="userCollections.length > 0">
                      <q-checkbox
                        v-for="collection in userCollections"
                        :key="collection.collection_id"
                        v-model="selectedCollections"
                        :val="collection.collection_id"
                        :label="collection.collection_name"
                        dense
                        class="q-mb-sm"
                      />
                    </div>
                    <div v-else class="text-caption text-grey text-center">
                      You don’t have any collections yet.
                    </div>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn flat label="Cancel" v-close-popup @click="resetForm" />
                    <q-btn label="Save" color="primary" @click="saveToSelectedCollections" />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <!-- Message Dialog -->
              <q-dialog v-model="notifyDialogOpen">
                <q-card>
                  <q-card-section class="text-h6">{{ notifyDialogTitle }}</q-card-section>
                  <q-card-section>{{ notifyDialogMessage }}</q-card-section>
                  <q-card-actions align="right">
                    <q-btn flat label="OK" color="primary" v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useDocumentsStore } from 'stores/documentsStore'
import PdfPreview from 'components/PdfPreview.vue'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import Tesseract from 'tesseract.js'
import axios from 'axios'

const showDialog = ref(false)
import { useSearchStore } from 'stores/searchStore'

const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()

const dialogOpen = ref(false)
const selectedDocument = ref(null)
const selectedItemType = ref('document')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

function showNotifyDialog(title, message) {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

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

const selectedFile = ref(null)
const fileInput = ref(null)
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
let nlpMetadata = {}

function triggerFileInput() {
  fileInput.value?.click()
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

    if (alreadyExists) {
      alert(`A file named "${fileName}" already exists. Please rename or choose another file.`)
      return
    }

    // NLP processing for PDFs
    if (isPdf) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', file.name)

      const response = await axios.post('http://localhost:8000/process-text', formData)

      if (response.data.status === 'ocr_required') {
        console.log('Fallback to OCR...')
        const base64Image = response.data.image_base64

        // OCR the image
        const result = await Tesseract.recognize(`data:image/png;base64,${base64Image}`, 'eng', {
          tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}-_"\'',
        })
        const text = result.data.text

        // Send extracted text to FastAPI for NLP
        const nlpForm = new FormData()
        nlpForm.append('filename', file.name)
        nlpForm.append('raw_text', text)

        nlpMetadata = await axios.post('http://localhost:8000/process-text', nlpForm)
      }
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
    console.log('Metadata', nlpMetadata)
    // Open metadata confirmation dialog
    metadata.value = {
      file_name: fileName,
      file_url: fileUrl,
      title: nlpMetadata.data.title || '',
      author: nlpMetadata.data.author || '',
      date: nlpMetadata.data.date || '',
      summary: nlpMetadata.data.summary || '',
      keywords: nlpMetadata.data.keywords || [],
      categories: nlpMetadata.data.categories || [],
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

function handleCancel() {
  selectedFile.value = null
  showDialog.value = false
}

const openBookmarkDialog = async (doc, type = 'document') => {
  selectedDocument.value = doc
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', doc.id)
    .eq('item_type', type)

  if (error) {
    console.error('Error checking existing collections:', error)
    selectedCollections.value = []
    existingCollectionIds.value = []
    return
  }

  const existingIds = existingItems.map((item) => item.collection_id)
  selectedCollections.value = [...existingIds]
  existingCollectionIds.value = [...existingIds]
}

async function loadUserCollections() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error loading collections:', authError)
    return
  }

  const { data, error } = await supabase
    .from('collections')
    .select('collection_id, collection_name')
    .eq('user_id', userId)

  if (!error) {
    userCollections.value = data
  } else {
    console.error('Failed to load collections:', error)
  }
}

async function saveToSelectedCollections() {
  const doc = selectedDocument.value
  if (!doc) return

  try {
    const insertedCollections = []
    const removedCollections = []

    const toAdd = selectedCollections.value.filter(
      (id) => !existingCollectionIds.value.includes(id),
    )
    const toRemove = existingCollectionIds.value.filter(
      (id) => !selectedCollections.value.includes(id),
    )

    for (const collectionId of toAdd) {
      const collection = userCollections.value.find((c) => c.collection_id === collectionId)

      const { error: insertError } = await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: doc.id,
        item_type: selectedItemType.value,
      })

      if (insertError) {
        console.error('Insert failed:', insertError)
        showNotifyDialog('Error', 'Failed to save to collection(s).')
        return
      }

      if (collection) insertedCollections.push(collection.collection_name)
    }

    for (const collectionId of toRemove) {
      const collection = userCollections.value.find((c) => c.collection_id === collectionId)

      const { error: deleteError } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', doc.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
    }

    const itemName = doc.metadata?.title || doc.file_name
    let message = ''

    if (insertedCollections.length > 0) {
      message += `"${itemName}" was added to: ${insertedCollections.join(', ')}.\n`
    }

    if (removedCollections.length > 0) {
      message += `"${itemName}" was removed from: ${removedCollections.join(', ')}.`
    }

    if (message) {
      showNotifyDialog('Notice', message.trim())
    }

    dialogOpen.value = false
  } catch (err) {
    console.error('Unexpected error:', err)
    showNotifyDialog('Error', 'An unexpected error occurred.')
  }
}

function resetForm() {
  selectedCollections.value = []
  existingCollectionIds.value = []
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
</script>
