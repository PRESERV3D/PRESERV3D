<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Documents</div>
      <div class="q-mb-md sub-font-3 row items-baseline justify-between">
        <div class="q-ml-sm">Browse selected digital books from the university archives.</div>
        <q-btn
          v-if="isAdmin"
          @click="showDialog = true"
          label="Add New"
          icon="add_circle"
          style="min-width: 9.375rem"
          class="add-new-btn"
          no-caps
          unelevated
        />
      </div>
    </div>

    <q-dialog v-model="showDialog" persistent>
      <q-card class="add-document-card">
        <q-card-section
          class="box-upload-docu"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onFileDrop"
          :class="{ 'drag-over': isDragging }"
        >
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
            <!-- Upload progress bar -->
            <q-linear-progress
              v-if="uploading"
              :value="uploadProgress / 100"
              color="primary"
              class="q-mt-md full-width"
            />
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
          <q-btn
            v-if="!uploading"
            label="Upload"
            class="q-ml-xl q-mt-sm btn-save"
            @click="handleUpload"
            no-caps
          />

          <q-spinner v-else color="primary" size="2em" class="q-ml-xl q-mt-sm" />

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
    <!-- Document Highlights Section -->
    <div class="column q-py-md q-gutter-lg">
      <div class="box-highlights">
        <p class="q-ml-lg admin-title-2" style="font-size: 16px">Document Highlights</p>
        <div class="row docs-gap justify-start">
          <div v-for="(doc, index) in documentsStore.documents.slice(0, 3)" :key="index">
            <div class="row q-mb-lg">
              <q-card class="my-card documentCard" style="transform: rotate(-5deg)">
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                >
                  <q-img :src="doc.preview_url" alt="Document Preview" class="document" />
                </router-link>
                <q-btn
                  icon="bookmark_border"
                  dense
                  size="sm"
                  class="btn-bm"
                  @click="openBookmarkDialog(doc, 'document')"
                  flat
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
                <div class="q-mt-xs q-mb-xs flex justify-evenly">
                  <router-link
                    :to="{ name: 'view-document', params: { id: doc.id } }"
                    @click="logClick(doc.id, 'document')"
                  >
                    <q-btn label="Now Read" class="now-read-btn" unelevated no-caps />
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Box Category -->
      <div class="box-category">
        <div class="q-pa-lg">
          <p class="admin-title-2" style="font-size: 16px; margin-top: 0">Category</p>
          <div class="row q-col-gutter-md q-mb-md justify-between items-center">
            <!-- Category Section -->
            <div class="row q-gutter-sm col-auto">
              <q-btn
                v-for="cat in categoryOptions"
                :key="cat"
                :label="cat"
                class="btn-1"
                :class="{ active: selectedCategories.has(cat) }"
                unelevated
                @click="toggleCategory(cat)"
              />
            </div>
            <div class="row q-gutter-sm col-auto">
              <!-- Filter Section -->
              <q-btn
                flat
                round
                icon="filter_list"
                class="filter-sort-btn"
                @click="showFilterMenu = !showFilterMenu"
              >
                <q-menu
                  v-model="showFilterMenu"
                  anchor="bottom right"
                  self="top left"
                  style="width: 25.5rem"
                >
                  <div class="row q-pa-md">
                    <!-- Authors Column (Left) -->
                    <div class="col-7 q-pr-sm">
                      <div class="sub-font-3 q-mb-sm">Authors</div>
                      <q-scroll-area style="height: 12rem; max-height: 15rem">
                        <q-list dense>
                          <q-item
                            v-for="authorOption in authorOptions"
                            :key="authorOption"
                            clickable
                            class="sub-font-2"
                            style="color: #000000"
                            @click="toggleAuthor(authorOption)"
                          >
                            <q-item-section avatar>
                              <q-checkbox
                                :model-value="author === authorOption"
                                @update:model-value="toggleAuthor(authorOption)"
                              />
                            </q-item-section>
                            <q-item-section>{{ authorOption }}</q-item-section>
                          </q-item>
                        </q-list>
                      </q-scroll-area>
                      <!-- Clear Authors -->
                      <q-btn
                        v-if="author"
                        flat
                        dense
                        color="primary"
                        label="Clear Author"
                        @click="clearAuthor"
                        class="q-mt-xs sub-font-3 full-width"
                      />
                    </div>
                    <!-- Years Column (Right) -->
                    <div class="col-5">
                      <div class="sub-font-3 q-mb-sm">Year</div>
                      <q-scroll-area style="height: 12rem; max-height: 15rem">
                        <q-list dense>
                          <q-item
                            v-for="dateOption in dateOptions"
                            :key="dateOption"
                            clickable
                            class="sub-font-2"
                            style="color: #000000"
                            @click="toggleDate(dateOption)"
                          >
                            <q-item-section avatar>
                              <q-checkbox
                                :model-value="date === dateOption"
                                @update:model-value="toggleDate(dateOption)"
                              />
                            </q-item-section>
                            <q-item-section>{{ dateOption }}</q-item-section>
                          </q-item>
                        </q-list>
                      </q-scroll-area>
                      <!-- Clear Years -->
                      <q-btn
                        v-if="date"
                        flat
                        dense
                        color="primary"
                        label="Clear Year"
                        @click="clearDate"
                        class="q-mt-xs sub-font-3 full-width"
                      />
                    </div>
                  </div>
                </q-menu>
              </q-btn>
              <!-- Sort Section -->
              <q-btn flat round icon="sort" class="filter-sort-btn">
                <q-menu anchor="bottom right" self="top left" class="sort-menu">
                  <q-list dense>
                    <q-item
                      v-for="option in sortOptions"
                      :key="option"
                      clickable
                      v-close-popup
                      @click="((sortOption = option), onSort(option))"
                      :class="['sort-option-item', { 'selected-option': sortOption === option }]"
                    >
                      <q-item-section>{{ option }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>

          <!-- Document in Categories -->
          <div class="row q-gutter-md q-mt-md justify-around">
            <div
              v-for="(doc, i) in searchStore.query
                ? searchStore.results
                : documentsStore.filteredDocuments"
              :key="i"
              class="card-wrapper-2"
            >
              <q-card class="my-card documentCard" rounded bordered>
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                  @click="logClick(doc.id, 'document')"
                >
                  <q-img :src="doc.preview_url" alt="Document Preview" class="document" />
                </router-link>
                <q-btn
                  icon="bookmark_border"
                  dense
                  size="sm"
                  class="btn-bm"
                  @click="openBookmarkDialog(doc, 'document')"
                  flat
                />
              </q-card>

              <div class="q-mt-md fade-title-container">
                <div class="q-mt-md sub-font fade-title" style="color: black; font-weight: 800">
                  {{ doc.metadata.title }}
                  <div class="tooltip-box">{{ doc.metadata.title }}</div>
                </div>
              </div>
              <div
                class="q-mt-sm sub-font-2"
                style="color: black; font-weight: 200; max-width: 10rem"
              >
                {{ doc.metadata.author }}
              </div>

              <!-- Bookmark Dialog -->
              <q-dialog v-model="dialogOpen">
                <q-card class="add-to-collections">
                  <q-card-section class="collection-header">
                    <div class="sub-font-3" style="font-size: 18px; font-weight: 800">
                      Choose a Collection
                    </div>
                  </q-card-section>
                  <q-card-section class="collections-scroll-container">
                    <div v-if="userCollections.length > 0">
                      <div
                        v-for="collection in userCollections"
                        :key="collection.collection_id"
                        class="q-py-sm flex items-center justify-between"
                        style="
                          font-family: 'Poppins', sans-serif;
                          font-size: 16px;
                          font-weight: 500;
                        "
                      >
                        <span>{{ collection.collection_name }}</span>
                        <q-checkbox
                          v-model="selectedCollections"
                          :val="collection.collection_id"
                          dense
                          color="primary"
                        />
                      </div>
                    </div>

                    <div v-else class="text-caption text-grey text-center">
                      You don’t have any collections yet.
                    </div>
                  </q-card-section>

                  <q-card-actions class="collection-footer" align="center">
                    <q-btn label="Save" color="primary" @click="saveToSelectedCollections" />
                    <q-btn flat label="Cancel" v-close-popup @click="resetForm" />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <!-- Message Dialog -->
              <q-dialog v-model="notifyDialogOpen">
                <q-card class="sucess-add-to-collection">
                  <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
                    notifyDialogTitle
                  }}</q-card-section>
                  <q-card-section class="sub-font-3" style="font-weight: 400">{{
                    notifyDialogMessage
                  }}</q-card-section>
                  <q-card-actions>
                    <q-btn flat label="Close" class="btn-save" v-close-popup />
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useDocumentsStore } from 'stores/documentsStore'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import Tesseract from 'tesseract.js'
import axios from 'axios'

import { useSearchStore } from 'stores/searchStore'

const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()
const userStore = useUserStore()

// const category = ref('')
const author = ref('')
const date = ref('')
const sortOption = ref('Newest')
const sortOptions = ['Newest', 'Oldest', 'Title A-Z', 'Title Z-A']
const selectedCategories = ref(new Set(['All']))
const categoryOptions = ref([])
const authorOptions = ref([])
const dateOptions = ref([])

const showDialog = ref(false)
const dialogOpen = ref(false)
const selectedDocument = ref(null)
const selectedItemType = ref('document')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

if (userStore.profile.role === undefined) {
  userStore.fetchProfile()
}

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')

function showNotifyDialog(title, message) {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

function onSort() {
  switch (sortOption.value) {
    case 'Newest':
      documentsStore.sortBy('uploaded_at', 'desc')
      break
    case 'Oldest':
      documentsStore.sortBy('uploaded_at', 'asc')
      break
    case 'Title A-Z':
      documentsStore.sortBy('title', 'desc')
      break
    case 'Title Z-A':
      documentsStore.sortBy('title', 'asc')
      break
  }
}

function applyFilters() {
  documentsStore.filterBy({
    categories: Array.from(selectedCategories.value),
    author: author.value,
    date: date.value,
  })
}

//add-start
function toggleAuthor(authorOption) {
  author.value = authorOption
  applyFilters()
}

function toggleDate(dateOption) {
  date.value = dateOption
  applyFilters()
}

function clearAuthor() {
  author.value = ''
  applyFilters()
}

function clearDate() {
  date.value = ''
  applyFilters()
}
//add -end

function toggleCategory(cat) {
  if (cat === 'All') {
    // If "All" is clicked, reset all categories
    selectedCategories.value = new Set(['All'])
    return
  }

  if (selectedCategories.value.has(cat)) {
    selectedCategories.value.delete(cat)
  } else {
    selectedCategories.value.add(cat)
    selectedCategories.value.delete('All') // Remove "All" if any specific category is selected
  }

  // Reassign to trigger reactivity
  selectedCategories.value = new Set(selectedCategories.value)

  applyFilters()
}

async function logClick(itemId, itemType) {
  if (!isAdmin.value) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    const docu = await documentsStore.getDocById(itemId)

    if (authError || !userId) {
      console.error('Auth error logging click:', authError)
      return
    }

    try {
      const { error } = await supabase.from('user_activity_log').insert({
        user_id: userId,
        item_id: itemId,
        title: docu.title || 'Untitled',
        item_type: itemType,
        clicked_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      if (error) {
        console.error('Error logging click:', error)
      } else {
        console.log('Click Logged')
      }
    } catch (err) {
      console.error('Error logging click:', err)
    }
  }
}

// Fetch all documents from Supabase
const fetchAllDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, preview_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching documents:', error)
      return
    }

    documentsStore.setDocuments(data)

    // Extract unique author and date values for filters
    const authors = new Set()
    const years = new Set()
    const categories = new Set(['All'])

    data.forEach((doc) => {
      if (doc.metadata?.author) {
        // Support multiple authors split by comma
        const authorList = doc.metadata.author.split(',').map((a) => a.trim())
        authorList.forEach((a) => authors.add(a))
      }

      if (doc.metadata?.date) years.add(doc.metadata.date?.slice(0, 4)) // get year part

      if (Array.isArray(doc.metadata?.categories)) {
        doc.metadata.categories.forEach((cat) => categories.add(cat))
      }
    })

    authorOptions.value = Array.from(authors)
    categoryOptions.value = [...Array.from(categories).sort()]
    dateOptions.value = Array.from(years).sort((a, b) => b - a)
  } catch (err) {
    console.error('Unexpected error while loading documents:', err)
  }
}

// for populating filter options
watch(
  () => documentsStore.filteredDocuments,
  (docs) => {
    const authors = new Set()
    const years = new Set()
    const categories = new Set(['All'])

    docs.forEach((doc) => {
      const meta = doc.metadata || {}

      // Author
      if (meta.author) {
        meta.author.split(',').forEach((a) => authors.add(a.trim()))
      }

      // Date
      if (meta.date) {
        const year = meta.date.slice(0, 4)
        years.add(year)
      }

      // Categories
      if (Array.isArray(meta.categories)) {
        meta.categories.forEach((cat) => categories.add(cat))
      }
    })

    authorOptions.value = [...authors].sort()
    categoryOptions.value = [...categories].sort()
    dateOptions.value = [...years].sort((a, b) => b - a) // descending
  },
  { immediate: true },
)

const selectedFile = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)
const dialog = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
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
  } else {
    selectedFile.value = null
  }
}

function onDragOver() {
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onFileDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0 && files[0].type === 'application/pdf') {
    selectedFile.value = files[0]
  } else {
    alert('Only PDF files are allowed.')
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^\w.-]/g, '_') // Replace all non-alphanumeric/underscore/dot/dash characters with _
}

const handleUpload = async () => {
  const file = selectedFile.value
  const fileName = sanitizeFileName(file.name)
  uploading.value = true
  uploadProgress.value = 0

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

    // Fake progress bar animation
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 1
      }
    }, 200)

    // NLP processing for PDFs
    if (isPdf) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', fileName)

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
      } else {
        // Use the metadata returned from FastAPI
        nlpMetadata = response.data
      }
      console.log('NLP Metadata:', nlpMetadata)
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(`${fileName}`, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: isPdf ? 'application/pdf' : 'model/gltf-binary',
    })

    const previewBlob = await (async () => {
      const base64 = nlpMetadata.preview
      const byteCharacters = atob(base64)
      const byteNumbers = Array.from(byteCharacters).map((char) => char.charCodeAt(0))
      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type: 'image/png' })
    })()

    const previewFileName = fileName.replace(/\.[^/.]+$/, '') + '_preview.png'

    const { data, error } = await supabase.storage
      .from('pdf-previews')
      .upload(previewFileName, previewBlob, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      alert('Failed to upload preview.')
      return
    }

    console.log('Upload successful:', data)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${fileName}`)
    const fileUrl = urlData.publicUrl

    const { data: previewData } = supabase.storage
      .from('pdf-previews')
      .getPublicUrl(`${previewFileName}`)
    const previewUrl = previewData.publicUrl

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
      ...(isPdf && { preview_url: previewUrl, metadata: nlpMetadata }),
    }

    const { error: dbError } = await supabase.from(supabaseTable).insert([insertData])
    if (dbError) {
      console.error('Supabase insert error:', dbError)
      alert('Upload succeeded but metadata failed to save.')
      return
    }

    console.log('Metadata', nlpMetadata)

    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
    }, 1000)

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
