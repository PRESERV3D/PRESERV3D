<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <div class="q-mt-xs title">Documents</div>
      <div class="row q-mb-md subtitle justify-between items-center">
        Browse selected digital books from the university archives.
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

    <!-- Upload Dialog -->
    <UploadDialog
      v-model="showDialog"
      upload-type="documents"
      accept=".pdf"
      :show-camera="true"
      :uploading="uploading"
      :upload-progress="uploadProgress"
      :pre-selected-file="selectedFile"
      @file-selected="onFileSelected"
      @file-dropped="onFileDropped"
      @upload-click="handleUpload"
      @cancel-click="handleCancel"
      @camera-click="handleScan"
    />

    <!-- <q-dialog v-model="showDialog" persistent>
      <q-card class="add-documentarti-card">
        <div class="upload-sections-container">
          // Camera Section
          <q-card-section
            class="two-box-upload-docuarti camera-section"
            v-if="!selectedFile"
            @click="handleScan"
          >
            <q-img src="/img/camera.png" alt="Camera" class="upload-icon-docu" />
            <q-btn
              outline
              label="Use Camera"
              class="camera-btn"
              @click="handleScan"
              no-caps
              style="color: #560505; border-radius: 4px; padding: 4px 24px"
            />
          </q-card-section>

          // Upload Section
          <q-card-section
            :class="[
              selectedFile ? 'box-upload-docuarti' : 'two-box-upload-docuarti',
              'upload-section',
              { 'drag-over': isDragging },
            ]"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onFileDrop"
          >
            <q-img src="/img/drag-drop-icon.png" alt="Upload-Document" class="upload-icon-docu" />
            <div
              v-if="!selectedFile"
              class="sub-font-3 text-center"
              style="font-size: 14px; font-weight: 200"
            >
              <div class="sub-font-3 text-center" style="font-size: 18px; font-weight: 200">
                DRAG and DROP files
              </div>
              or
              <a href="#" @click.prevent="triggerFileInput"><strong>Browse Files</strong></a>
              on your computer
            </div>
            <div v-else class="documentarti-preview text-center">
              <q-btn
                dense
                round
                flat
                icon="close"
                v-close-popup
                class="thumbnail-delete"
                @click="deleteSelectedFile"
              />
              <q-img src="/img/document-icon.png" alt="Document" class="document-icon" />
              <div class="selected-document-name q-mt-md">
                {{ selectedFile.name }}
              </div>
              // Upload progress bar
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
        </div>

        <q-card-actions class="row q-ml-lg justify-between items-center">
          <div></div>

          // Action Buttons
          <div class="action-buttons">
            <q-btn
              v-if="!uploading"
              label="Upload"
              :disabled="selectedFile === null"
              class="q-ml-xl q-mt-sm btn-save"
              @click="handleUpload"
              no-caps
            />

            <q-spinner v-else color="primary" size="2em" class="q-ml-xl q-mt-sm" />
          </div>

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
    </q-dialog> -->

    <!-- Document Highlights Section -->
    <div class="column q-py-md q-gutter-lg">
      <div class="box-highlights">
        <p class="q-ml-lg title-font-2" style="font-size: 16px">Document Highlights</p>
        <div class="row docs-gap justify-start">
          <div v-for="(doc, index) in topDocuments" :key="index">
            <div class="row q-mb-lg">
              <q-card class="my-card docCard" style="transform: rotate(-5deg)">
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                >
                  <q-img :src="doc.preview_url" alt="Document Preview" class="document" />
                </router-link>
                <div class="q-py-xs doc-align-items">
                  <!-- View Icon with Count -->
                  <q-icon name="visibility" color="grey" size="xs" class="action-icon" />
                  <span class="count-text">{{ documentsStore.viewCounts[doc.id] || 0 }}</span>

                  <!-- Star Icon with Count -->
                  <q-icon
                    :name="doc.starred ? 'star' : 'star_border'"
                    :class="{ starred: doc.starred }"
                    size="xs"
                    class="action-icon star-icon"
                    @click.stop="isAdmin ? null : toggleFavorite(doc, 'document')"
                  />
                  <span class="count-text">{{ documentsStore.starCounts[doc.id] || 0 }}</span>

                  <!-- Bookmark Icon -->
                  <q-icon
                    v-if="!isAdmin"
                    :name="doc.bookmarked ? 'bookmark' : 'bookmark_border'"
                    :class="{ bookmarked: doc.bookmarked }"
                    size="xs"
                    class="action-icon bookmark-icon"
                    @click="openBookmarkDialog(doc, 'document')"
                  />
                </div>
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
                    <q-btn label="Read Now" class="now-read-btn" unelevated no-caps />
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
          <p class="title-font-2" style="font-size: 16px; margin-top: 0">Category</p>
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
              <q-btn-dropdown
                outline
                color="black"
                label="Filter"
                icon="filter_list"
                size="sm"
                class="artifact-btn-style"
              >
                <q-list>
                  <q-item>
                    <q-item-section>
                      <q-select
                        v-model="author"
                        :options="authorOptions"
                        outlined
                        label="Select Author"
                        dense
                        clearable
                        @update:model-value="applyFilters"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-select
                        v-model="date"
                        :options="dateOptions"
                        outlined
                        label="Select Year"
                        dense
                        clearable
                        @update:model-value="applyFilters"
                      />
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="clearFilters">
                    <q-item-section>
                      <q-item-label>Clear All Filters</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="clear" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <!-- Sort Section -->
              <q-btn-dropdown
                outline
                color="black"
                :label="`Sort by: ${sortOption}`"
                icon="sort"
                size="sm"
                class="q-ml-md artifact-btn-style"
                dense
              >
                <q-list>
                  <q-item
                    v-for="option in sortOptions"
                    :key="option"
                    clickable
                    v-close-popup
                    class="collection-sort-menu"
                    @click="((sortOption = option), onSort(option))"
                  >
                    <q-item-section>{{ option }}</q-item-section>
                    <q-item-section side v-if="sortOption === option">
                      <q-icon name="check" color="primary" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
          </div>

          <!-- Document in Categories -->
          <div class="row q-gutter-md q-ma-md justify-between">
            <div
              v-for="(doc, i) in searchStore.query
                ? searchStore.results
                : documentsStore.filteredDocuments"
              :key="i"
              class="card-wrapper-2"
            >
              <q-card class="docCard" rounded bordered>
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                  @click="logClick(doc.id, 'document')"
                >
                  <q-img :src="doc.preview_url" alt="Document Preview" class="document" />
                </router-link>

                <div class="q-py-xs doc-align-items">
                  <!-- Visibility Icon (static) -->

                  <q-icon name="visibility" color="grey" size="xs" class="action-icon view-icon" />
                  <span class="count-text">{{ documentsStore.viewCounts[doc.id] || 0 }}</span>

                  <!-- Star Icon with Count -->
                  <q-icon
                    :name="doc.starred ? 'star' : 'star_border'"
                    :class="{ starred: doc.starred }"
                    size="xs"
                    class="action-icon star-icon"
                    @click.stop="isAdmin ? null : toggleFavorite(doc, 'document')"
                  />
                  <span class="count-text">{{ documentsStore.starCounts[doc.id] || 0 }}</span>

                  <!-- Bookmark Icon -->
                  <q-icon
                    v-if="!isAdmin"
                    :name="doc.bookmarked ? 'bookmark' : 'bookmark_border'"
                    :class="{ bookmarked: doc.bookmarked }"
                    size="xs"
                    class="action-icon bookmark-icon"
                    @click="openBookmarkDialog(doc, 'document')"
                  />
                </div>
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
                  <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
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
import { useSearchStore } from 'stores/searchStore'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import UploadDialog from 'src/components/UploadDialog.vue'
import Tesseract from 'tesseract.js'
import axios from 'axios'

const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()
const userStore = useUserStore()

// const category = ref('')
const scannedFile = ref(null)
const topDocuments = ref([])
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

// Initial load
onMounted(async () => {
  const { data: topDocus } = await supabase.from('documents_view').select('*').limit(3)

  // Get user's favorites for top documents too
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (userId) {
    const { data: favoritesCollection, error: favError } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    let favoriteIds = []
    if (favoritesCollection && !favError) {
      const { data: favItems, error: favItemsError } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', 'document')

      if (!favItemsError && favItems) {
        favoriteIds = favItems.map((i) => i.item_id)
      }
    }

    // Enhance topDocuments with starred property
    const enhancedTopDocs =
      topDocus?.map((doc) => ({
        ...doc,
        starred: favoriteIds.includes(doc.id), // Make sure to use the correct ID field
        bookmarked: false, // Add this too for consistency
      })) || []

    topDocuments.value = enhancedTopDocs
  } else {
    // If no user, just set without starred property
    topDocuments.value =
      topDocus?.map((doc) => ({
        ...doc,
        starred: false,
        bookmarked: false,
      })) || []
  }

  if (!searchStore.query) {
    await fetchAllDocuments()
  }

  // Handle scanned file from DocumentScannerPage
  const routeState = history.state

  if (routeState?.scannedFile) {
    console.log('Found scanned file in route state:', routeState.scannedFile)
    scannedFile.value = routeState.scannedFile
    selectedFile.value = routeState.scannedFile
    showDialog.value = true

    // Clear the state after using it
    history.replaceState({}, '', window.location.pathname)
  }

  await documentsStore.fetchViewCounts()
  await documentsStore.fetchStarCounts()
})

onUnmounted(() => {
  searchStore.clear()
})

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

//Clear All Filters Function
const clearFilters = () => {
  author.value = null
  date.value = null
  applyFilters()
}
//

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

    // ADDED: Fetch Favorites collection items
    const { data: authData } = await supabase.auth.getUser()

    const userId = authData?.user?.id

    const { data: favoritesCollection, error: favError } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (favError) {
      console.error('Error fetching favorite items:', favError)
    }

    // Get ALL user collections (for bookmarked check)
    const { data: allUserCollections, error: allCollError } = await supabase
      .from('collections')
      .select('collection_id, collection_name')
      .eq('user_id', userId)

    let favoriteIds = []
    let bookmarkedIds = []

    if (favoritesCollection) {
      const { data: favItems, error: favItemsError } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', 'document')

      if (!favItemsError) {
        favoriteIds = favItems.map((i) => i.item_id)
      }
    }

    // Get bookmarked document IDs (from non-Favorites collections)
    if (allUserCollections && !allCollError) {
      const nonFavoritesCollections = allUserCollections.filter(
        (col) => col.collection_name !== 'Favorites',
      )

      if (nonFavoritesCollections.length > 0) {
        const collectionIds = nonFavoritesCollections.map((col) => col.collection_id)

        const { data: bookmarkedItems, error: bookmarkError } = await supabase
          .from('collection_items')
          .select('item_id')
          .in('collection_id', collectionIds)
          .eq('item_type', 'document')

        if (!bookmarkError && bookmarkedItems) {
          bookmarkedIds = [...new Set(bookmarkedItems.map((i) => i.item_id))]
        }
      }
    }

    // Add some mock data for demonstration compatibility
    const enhancedDocs = data.map((docs) => ({
      ...docs,
      bookmarked: bookmarkedIds.includes(docs.id),
      starred: favoriteIds.includes(docs.id),
    }))

    documentsStore.setDocuments(enhancedDocs)

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
// const fileInput = ref(null)
// const isDragging = ref(false)
const dialog = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const router = useRouter()
const user = userStore.profile.first_name + ' ' + userStore.profile.last_name

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

function sanitizeFileName(name) {
  return name.replace(/[^\w.-]/g, '_')
}

async function fileExists(fileName) {
  const { data, error } = await supabase
    .from('documents_metadata')
    .select('file_name')
    .eq('file_name', fileName)

  if (error) {
    console.error('Error checking file existence:', error)
    return false
  }

  return !!data?.length
}

async function uploadFileToSupabase(file, fileName) {
  const { error } = await supabase.storage.from('documents').upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'application/pdf',
  })
  return error
}

async function generatePdfPreview(file) {
  // Set the worker source
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${window.pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const page = await pdf.getPage(1)
  const scale = 1.5
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvasContext: context, viewport }).promise

  // Return base64 string (data URL)
  return canvas.toDataURL('image/png')
}

async function uploadPreviewImage(previewDataUrl, previewFileName) {
  // Remove base64 prefix and convert to binary
  const base64Data = previewDataUrl.replace(/^data:image\/png;base64,/, '')
  const byteArray = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
  const blob = new Blob([byteArray], { type: 'image/png' })

  // Upload using the correct filename
  const { error } = await supabase.storage.from('pdf-previews').upload(previewFileName, blob, {
    contentType: 'image/png',
    upsert: true,
  })

  return error
}

async function processFileWithNLP(file, fileName) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('filename', fileName)
  return await axios.post('http://localhost:8000/process-text', formData)
}

async function processImageWithOCR(base64Image, fileName) {
  const result = await Tesseract.recognize(`data:image/png;base64,${base64Image}`, 'eng', {
    tessedit_char_whitelist:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}-_"\'',
  })

  const text = result.data.text
  console.log('OCR Result:', text)

  if (!text || text.trim() === '') {
    alert('OCR failed — no text detected. Please try again.')
    return
  }

  const nlpForm = new FormData()
  nlpForm.append('filename', fileName)
  nlpForm.append('raw_text', text)

  return await axios.post('http://localhost:8000/process-text', nlpForm)
}

async function saveMetadataToDB(fileName, fileUrl, previewUrl, metadata) {
  return await supabase.from('documents_metadata').insert([
    {
      file_name: fileName,
      file_url: fileUrl,
      preview_url: previewUrl,
      metadata,
      uploaded_by: user,
      uploaded_at: new Date(),
      updated_at: new Date(),
    },
  ])
}

// function triggerFileInput() {
//   fileInput.value?.click()
// }

// function handleFileChange(event) {
//   selectedFile.value = event.target.files[0] || null
// }

// function onDragOver() {
//   isDragging.value = true
// }

// function onDragLeave() {
//   isDragging.value = false
// }

// function onFileDrop(e) {
//   isDragging.value = false
//   const file = e.dataTransfer.files[0]
//   if (file?.type === 'application/pdf') {
//     selectedFile.value = file
//   } else {
//     alert('Only PDF files are allowed.')
//     uploading.value = false
//   }
// }

// function deleteSelectedFile() {
//   selectedFile.value = null
//   isDragging.value = false
//   uploading.value = false
//   uploadProgress.value = 0
// }

// File selection handlers
function onFileSelected(file) {
  selectedFile.value = file
}

function onFileDropped(file) {
  if (file?.type === 'application/pdf') {
    onFileSelected(file)
  } else {
    alert('Only PDF files are allowed.')
    selectedFile.value = null
  }
}

function handleCancel() {
  selectedFile.value = null
  scannedFile.value = null // Also clear scanned file
  showDialog.value = false
  uploading.value = false
  uploadProgress.value = 0
}

async function handleCancelMetadata(cancelledData) {
  const fileName = cancelledData?.file_name
  if (!fileName) return

  try {
    const { error } = await supabase.from('documents_metadata').delete().eq('file_name', fileName)
    if (error) console.error('Error deleting cancelled metadata:', error)
    else console.log('Cancelled metadata removed.')
  } catch (err) {
    console.error('Failed to cancel and delete metadata:', err)
  } finally {
    dialog.value = false
    uploading.value = false
    uploadProgress.value = 0
  }
}

async function saveMetadata(updatedMetadata) {
  console.log('Saving metadata: ', updatedMetadata)
  try {
    const { error } = await supabase
      .from('documents_metadata')
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
      router.push({ name: 'admin-home' })
    }
  } catch (err) {
    console.error('Error saving metadata:', err)
    alert('Unexpected error occurred.')
  }
}

const handleScan = () => {
  router.push({ name: 'document-scanner' })
}

// Upload handler
const handleUpload = async () => {
  try {
    if (!selectedFile.value || !selectedFile.value.name.endsWith('.pdf')) {
      alert('Only .pdf files are allowed.')
      return
    }

    // Compress file
    const compressedFile = await compressPdf(selectedFile.value)
    if (!compressedFile) {
      alert('Compression failed. Please try again.')
      return
    }

    const fileName = sanitizeFileName(compressedFile.name)
    uploading.value = true
    uploadProgress.value = 0
    loading.value = true

    // Check for existing filename
    const exists = await fileExists(fileName)
    if (exists) {
      alert(`A file named "${fileName}" already exists.`)
      return
    }

    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) uploadProgress.value += 1
    }, 200)

    // NLP processing
    let response = await processFileWithNLP(compressedFile, fileName)

    if (response.data.status === 'ocr_required') {
      console.log('OCR required, processing...')
      response = await processImageWithOCR(response.data.image_base64, fileName)
    }

    const nlpData = response.data
    console.log('NLP Response:', nlpData)

    // Preview image
    const preview = await generatePdfPreview(compressedFile)
    const previewFileName = fileName.replace(/\.[^/.]+$/, '') + '_preview.png'

    const previewUploadError = await uploadPreviewImage(preview, previewFileName)
    if (previewUploadError) throw previewUploadError

    // Upload file
    try {
      const uploadError = await uploadFileToSupabase(compressedFile, fileName)
      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError)
        throw uploadError
      }
    } catch (err) {
      console.error('Upload failed (caught):', err.message, err)
    }

    clearInterval(progressInterval)
    uploadProgress.value = 100

    // Get public URLs
    const fileUrl = supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl
    const previewUrl = supabase.storage.from('pdf-previews').getPublicUrl(previewFileName)
      .data.publicUrl

    // Save metadata
    const { error: dbError } = await saveMetadataToDB(fileName, fileUrl, previewUrl, nlpData)
    if (dbError) {
      console.error('DB error:', dbError)
      alert('Upload succeeded but metadata failed to save.')
      return
    }

    // Success result
    metadata.value = {
      file_name: fileName,
      file_url: fileUrl,
      title: nlpData.title || '',
      author: nlpData.author || '',
      date: nlpData.date || '',
      summary: nlpData.summary || '',
      keywords: nlpData.keywords || [],
      categories: nlpData.categories || [],
    }

    dialog.value = true
  } catch (err) {
    console.error('Upload failed:', err)
    alert('Upload failed. See console for details.')
  } finally {
    uploading.value = false
    loading.value = false
    uploadProgress.value = 0
  }
}

// ADDED: Compress pdf on upload
import { PDFDocument } from 'pdf-lib'

async function compressPdf(file) {
  console.log(`Starting PDF compression for: ${file.name}`)
  const originalSize = file.size

  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  // Remove optional metadata
  pdfDoc.setTitle('')
  pdfDoc.setAuthor('')
  pdfDoc.setSubject('')
  pdfDoc.setKeywords([])
  pdfDoc.setProducer('')
  pdfDoc.setCreator('')

  const compressedBytes = await pdfDoc.save()
  const compressedFile = new File([compressedBytes], file.name, { type: 'application/pdf' })

  const originalKB = originalSize / 1024
  const compressedKB = compressedFile.size / 1024
  const savedKB = originalKB - compressedKB

  console.log(`PDF Compression success: ${file.name}`)
  console.log(`Original size: ${originalKB.toFixed(2)} KB`)
  console.log(`Compressed size: ${compressedKB.toFixed(2)} KB`)
  console.log(
    `PDF Compression Saved: ${
      savedKB > 0 ? savedKB.toFixed(2) + ' KB' : 'no space (already optimized)'
    }`,
  )

  return compressedFile
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
    // ADDED: Exclude "Favorites" from the list
    userCollections.value = data.filter((c) => c.collection_name !== 'Favorites')
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

      // ADDED: Mark document as bookmarked if added to a collection
      doc.bookmarked = true

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

    // // ADDED: Recheck if document is in any non-Favorites collection
    // const { data: remainingItems, error: recheckError } = await supabase
    //   .from('collection_items')
    //   .select('collection_id, collections (collection_name)')
    //   .eq('item_id', doc.id)
    //   .eq('item_type', selectedItemType.value)

    // if (!recheckError) {
    //   doc.bookmarked = remainingItems.some(
    //     (item) => item.collections?.collection_name !== 'Favorites',
    //   )
    // } else {
    //   console.error('Error rechecking bookmark status:', recheckError)
    // }

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

// ADDED: Toggle favorite icon
const toggleFavorite = async (doc, itemType = 'document') => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error:', authError)
    return
  }

  try {
    // Find or create Favorites collection
    let { data: favoritesCollection } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (!favoritesCollection) {
      const { data: newCollection, error: insertError } = await supabase
        .from('collections')
        .insert([
          {
            collection_name: 'Favorites',
            description: 'Items you marked as favorite will appear here.',
            user_id: userId,
            is_default: true,
            is_locked: true,
            created_at: new Date(),
            updated_at: new Date(),
            cover_url:
              'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers//favoritescover.png',
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Insert collection failed:', insertError)
      } else {
        favoritesCollection = newCollection
      }
    }

    const collectionId = favoritesCollection.collection_id
    const itemName = doc.metadata?.title || doc.file_name

    // Check if item already exists
    const { data: existing } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('item_id', doc.id)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      // Remove from favorites
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', doc.id)
        .eq('item_type', itemType)

      doc.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: doc.id,
        item_type: itemType,
      })

      doc.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count
    const { data: metaCheck, error: metaError } = await supabase
      .from('documents_metadata')
      .select('id')
      .eq('id', doc.id)
      .single()

    if (!metaError && metaCheck) {
      const { data: starData } = await supabase
        .from('documents_star_count')
        .select('star_count')
        .eq('item_id', doc.id)
        .maybeSingle()

      if (starData && starData.star_count !== undefined) {
        documentsStore.updateStarCount(doc.id, starData.star_count)
      } else {
        // If no row exists, star count is 0
        documentsStore.updateStarCount(doc.id, 0)
      }
    } else {
      console.error('Document ID not found in documents_metadata:', metaError)
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}
</script>

<style scoped>
.box-highlights {
  border-radius: 10px;
  background-color: #ffffff;
  width: auto;
  height: auto;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
}

.box-category {
  border-radius: 10px;
  background-color: #ffffff;
  width: auto;
  height: auto;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
}

.bg-highlights-details {
  background-color: #880000;
  width: 13rem;
  height: 12rem;
  margin-top: 1.5rem;
  border-radius: 8px;
  box-shadow: 5px 5px 3px #bab7b7;
}

.title-highlight {
  font-family: 'Poppins', sans-serif;
  font-weight: 800;
  font-size: 18px;
  color: #ffffff;
  padding: 1.5rem 1rem 0.2rem 1rem;
}

.sub-details {
  font-family: 'Poppins', sans-serif;
  font-weight: 200;
  font-size: 10px;
  color: #ffffff;
  line-height: 1rem;
  padding: 0.5rem 1rem 1rem 1rem;
  height: 5rem;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  -webkit-mask-image: -webkit-linear-gradient(to bottom, black 60%, transparent 100%);
}

.now-read-btn {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 200;
  color: white;
  background-color: transparent;
  border: 1px solid white;
  padding: 0.3rem 1rem;
  width: 8rem;
  text-transform: none;
  transition: 0.3s ease;
}

.now-read-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: #ffffff;
}

.btn-bm {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  background-color: #880000;
  border-radius: 50%;
  color: white !important;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.docs-gap {
  margin-left: 2.5rem;
  margin-bottom: 0.5rem;
  gap: 2rem;
}

.card-wrapper-2 {
  perspective: 1000px;
}

.docCard {
  width: 12rem;
  height: 16rem;
  overflow-x: hidden;
  overflow-y: hidden;
  box-shadow: 0 5px 15px rgba(128, 128, 128, 0.8);
  border-radius: 10px;
  background-color: white;
}

.document {
  height: 14rem;
  border-bottom: 2px solid #880000;
}

.doc-align-items {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-right: 1rem;
}

.btn-bm-2 {
  bottom: 0.25rem;
  right: 0.75rem;
}

.thumbnail-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #666666 !important;
  background-color: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease !important;
}

.thumbnail-delete:hover {
  color: #ff4444 !important;
  background-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
  transform: translateY(-1px) !important;
}
</style>
