<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Documents</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">
          Browse selected digital books from the university archives.
        </h5>
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
      @force-cancel="handleForceCancel"
      @camera-click="handleScan"
    />

    <!-- Document Highlights Section -->
    <div class="q-py-md q-gutter-lg">
      <div class="box-highlights">
        <div class="row justify-between q-px-lg q-pt-lg q-mb-md">
          <p class="title-font-2" style="font-size: 16px; margin: 0">Document Highlights</p>

          <!-- See All Link -->
          <router-link to="/highlights" class="see-all-link q-mt-xs">
            See All
            <q-icon name="arrow_forward" size="16px" class="q-ml-xs" />
          </router-link>
        </div>

        <div class="row docs-gap justify-center q-py-sm">
          <div v-for="(doc, index) in topDocuments" :key="index">
            <div class="row q-mb-lg doc-wrapper">
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
                    @click="logClick(doc.id, 'document', 'view_document')"
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
          <div class="row q-col-gutter-md items-center justify-between">
            <div class="title-font-2" style="font-size: 16px; margin-top: 0">Category</div>
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
                <q-list style="width: 40rem">
                  <div class="row q-pa-md">
                    <!-- Authors Column (Left) -->
                    <div class="col q-pr-sm">
                      <div class="sub-font-3 q-mb-sm">Author</div>
                      <q-scroll-area style="height: 12rem; width: 12rem">
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
                                :model-value="selectedAuthors.has(authorOption)"
                                @update:model-value="toggleAuthor(authorOption)"
                              />
                            </q-item-section>
                            <q-item-section>{{ authorOption }}</q-item-section>
                          </q-item>
                        </q-list>
                      </q-scroll-area>
                      <!-- Clear Authors -->
                      <q-btn
                        v-if="selectedAuthors.size > 0"
                        flat
                        dense
                        color="primary"
                        label="Clear Author"
                        @click="clearAuthor"
                        class="q-mt-xs sub-font-3 full-width"
                      />
                    </div>
                    <!-- Years Column (Right) -->
                    <div class="col">
                      <div class="sub-font-3 q-mb-sm">Year</div>
                      <q-scroll-area style="height: 12rem; width: 12rem">
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
                                :model-value="selectedDates.has(dateOption)"
                                @update:model-value="toggleDate(dateOption)"
                              />
                            </q-item-section>
                            <q-item-section>{{ dateOption }}</q-item-section>
                          </q-item>
                        </q-list>
                      </q-scroll-area>
                      <!-- Clear Years -->
                      <q-btn
                        v-if="selectedDates.size > 0"
                        flat
                        dense
                        color="primary"
                        label="Clear Year"
                        @click="clearDate"
                        class="q-mt-xs sub-font-3 full-width"
                      />
                    </div>
                    <!-- Categories Column -->
                    <div class="col">
                      <div class="sub-font-3 q-mb-sm">Category</div>
                      <q-scroll-area style="height: 12rem; width: 12rem">
                        <q-list dense>
                          <q-item
                            v-for="categoryOption in categoryOptions"
                            :key="categoryOption"
                            clickable
                            class="sub-font-2"
                            style="color: #000000"
                            @click="toggleCategory(categoryOption)"
                          >
                            <q-item-section avatar>
                              <q-checkbox
                                :model-value="selectedCategories.has(categoryOption)"
                                @update:model-value="toggleCategory(categoryOption)"
                              />
                            </q-item-section>
                            <q-item-section>{{ categoryOption }}</q-item-section>
                          </q-item>
                        </q-list>
                      </q-scroll-area>
                      <!-- Clear Categories -->
                      <q-btn
                        v-if="
                          selectedCategories.size > 0 &&
                          !(selectedCategories.size === 1 && selectedCategories.has('All'))
                        "
                        flat
                        dense
                        color="primary"
                        label="Clear Category"
                        @click="clearCategories"
                        class="q-mt-xs sub-font-3 full-width"
                      />
                    </div>
                  </div>
                  <q-separator />
                  <!-- <q-item clickable v-close-popup @click="applyFilters">
                    <q-item-section class="flex items-center">
                      <div class="sub-font-3" style="color: #008000; font-weight: 500">
                        APPLY FILTERS
                      </div>
                    </q-item-section>
                  </q-item> -->
                  <q-item clickable v-close-popup @click="clearFilters">
                    <q-item-section class="flex items-center">
                      <div class="sub-font-3" style="color: #880000; font-weight: 500">
                        CLEAR ALL FILTERS
                      </div>
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
                    @click="applySort(option)"
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
          <div>
            <!-- Category Section -->
            <div class="row q-mt-md q-gutter-sm">
              <q-btn
                v-for="categoryOption in categoryOptions"
                :key="categoryOption"
                :label="categoryOption"
                class="btn-1"
                :class="{ active: selectedCategories.has(categoryOption) }"
                unelevated
                @click="toggleCategory(categoryOption)"
              />
            </div>
          </div>

          <!-- Document in Categories -->
          <div class="row q-gutter-lg q-ma-md justify-between">
            <div
              v-for="(doc, i) in searchStore.query
                ? searchStore.searchedDocuments
                : documentsStore.filteredDocuments"
              :key="i"
              class="card-wrapper-2"
            >
              <q-card class="docCard" rounded bordered>
                <router-link
                  :to="{ name: 'view-document', params: { id: doc.id } }"
                  class="document-link"
                  @click="logClick(doc.id, 'document', 'view_document')"
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
import { useQuasar } from 'quasar'
import { useDocumentsStore } from 'stores/documentsStore'
import { useSearchStore } from 'stores/searchStore'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'
import { uploadFileToR2 } from 'boot/r2'
import { useRouter } from 'vue-router'
import { processOCRPages } from '/services/ocr_service'
import { PDFDocument } from 'pdf-lib'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import UploadDialog from 'src/components/UploadDialog.vue'
import axios from 'axios'

const $q = useQuasar()
const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()
const userStore = useUserStore()

const scannedFile = ref(null)
const topDocuments = ref([])
const sortOption = ref('Newest')
const sortOptions = ['Newest', 'Oldest', 'Title A-Z', 'Title Z-A']
const categoryOptions = ref([])
const authorOptions = ref([])
const dateOptions = ref([])
const selectedCategories = ref(new Set(['All']))
const selectedAuthors = ref(new Set())
const selectedDates = ref(new Set())

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
const userType = computed(() => userStore.profile.user_type || 'Unknown') // from userstore because some users dont have usertype on auth

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
        starred: favoriteIds.includes(doc.id),
        bookmarked: false,
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

  console.log('Sorting by: ', sortOption.value)
})

onUnmounted(() => {
  searchStore.clear()
})

function showNotifyDialog(title, message) {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

async function logClick(itemId, itemType, action) {
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
        user_type: userType.value,
        action: action,
        clicked_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      } else {
        console.log(`Click logged by ${userType.value} for ${action} action`)
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

    // Fetch Favorites collection items
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
// watch(
//   () => documentsStore.documents,
//   (docs) => {
//     const authors = new Set()
//     const years = new Set()
//     const categories = new Set(['All'])

//     docs.forEach((doc) => {
//       const meta = doc.metadata || {}

//       // Author
//       if (meta.author) {
//         meta.author.split(',').forEach((a) => authors.add(a.trim()))
//       }

//       // Date
//       if (meta.date) {
//         const year = meta.date.slice(0, 4)
//         years.add(year)
//       }

//       // Categories
//       if (Array.isArray(meta.categories)) {
//         meta.categories.forEach((cat) => categories.add(cat))
//       }
//     })

//     authorOptions.value = [...authors].sort()
//     categoryOptions.value = [...categories].sort()
//     dateOptions.value = [...years].sort((a, b) => b - a) // descending
//   },
//   { immediate: true },
// )

const selectedFile = ref(null)
const dialog = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const currentProcess = ref('')
let nlpAbortController = null
let ocrAbortController = null
let cancelRequested = false
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
  extracted_text: '',
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

async function uploadFileToStorage(file, fileName) {
  const { error } = await uploadFileToR2(file, 'documents', fileName)
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
  // Convert base64 PNG data to Blob
  const base64Data = previewDataUrl.replace(/^data:image\/png;base64,/, '')
  const byteArray = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
  const blob = new Blob([byteArray], { type: 'image/png' })

  // Upload to R2 in "pdf-previews" folder
  const { error } = await uploadFileToR2(blob, 'pdf-previews', previewFileName)

  return error
}

async function processFileWithNLP(file, fileName) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('filename', fileName)

  return await axios.post('http://localhost:8000/process-text', formData, {
    signal: nlpAbortController?.signal,
  })
}

// async function saveMetadataToDB(fileName, fileUrl, previewUrl, nlpData) {
//   // Ensure the metadata object structure matches your database schema
//   const metadataObject = {
//     title: nlpData.title || '',
//     author: nlpData.author || '',
//     date: nlpData.date || '',
//     summary: nlpData.summary || '',
//     keywords: Array.isArray(nlpData.keywords) ? nlpData.keywords : [],
//     categories: Array.isArray(nlpData.categories) ? nlpData.categories : [nlpData.categories],
//     extracted_text: nlpData.extracted_text || '',
//   }

//   console.log('Inserting metadata:', metadataObject)

//   return await supabase.from('documents_metadata').insert([
//     {
//       file_name: fileName,
//       file_url: fileUrl,
//       preview_url: previewUrl,
//       metadata: metadataObject,
//       uploaded_by: user,
//       uploaded_at: new Date().toISOString(), // Use ISO string format
//       updated_at: new Date().toISOString(),
//     },
//   ])
// }

async function saveMetadataToDB(fileName, fileUrl, previewUrl, nlpData, user) {
  // Ensure the metadata object structure matches your database schema
  const metadataObject = {
    title: nlpData.title || '',
    author: nlpData.author || '',
    date: nlpData.date || '',
    summary: nlpData.summary || '',
    keywords: Array.isArray(nlpData.keywords) ? nlpData.keywords : [],
    categories: Array.isArray(nlpData.categories) ? nlpData.categories : [nlpData.categories],
    extracted_text: nlpData.extracted_text || '',
  }

  console.log('Inserting metadata:', metadataObject)

  const { data, error } = await supabase
    .from('documents_metadata')
    .insert([
      {
        file_name: fileName,
        file_url: fileUrl,
        preview_url: previewUrl,
        metadata: metadataObject,
        uploaded_by: user,
        uploaded_at: new Date(), // ISO string format
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error inserting metadata:', error)
    throw error
  }

  return data
}

// File selection handlers
function onFileSelected(file) {
  selectedFile.value = file
}

function onFileDropped(file) {
  if (file?.type === 'application/pdf') {
    onFileSelected(file)
  } else {
    $q.notify({ type: 'negative', message: 'Only PDF files are allowed.' })
    selectedFile.value = null
  }
}

function handleCancel() {
  selectedFile.value = null
  scannedFile.value = null
  showDialog.value = false

  // If upload is in progress, this should trigger force cancel
  if (uploading.value) {
    handleForceCancel()
  } else {
    resetUploadState()
  }
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

// function normalizeValue(key, value) {
//   if (value === '') return null

//   if (Array.isArray(value)) {
//     return value
//   }

//   return value
// }

// function normalizeObject(obj) {
//   if (!obj || typeof obj !== 'object') return obj
//   const normalized = {}
//   for (const key in obj) {
//     normalized[key] = normalizeValue(key, obj[key])
//   }
//   return normalized
// }

async function saveMetadata(updatedMetadata) {
  try {
    const oldData = {
      ...currentDocumentData.value,
    }

    const now = new Date()

    const { data: updatedData, error: updateError } = await supabase
      .from('documents_metadata')
      .update({
        metadata: {
          title: updatedMetadata.title,
          author: updatedMetadata.author,
          date: updatedMetadata.date,
          summary: updatedMetadata.summary,
          keywords: updatedMetadata.keywords,
          categories: updatedMetadata.categories,
          extracted_text: updatedMetadata.extracted_text,
        },
        updated_at: now,
      })
      .eq('id', metadata.value.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update metadata:', updateError)
      $q.notify({ type: 'negative', message: 'Failed to update metadata.' })
      return
    }

    const newData = {
      ...updatedData,
    }

    const changes = getChanges(oldData, newData)

    await logItemHistory({
      itemId: metadata.value.id,
      itemType: 'document',
      action: 'update',
      oldData,
      newData,
      changes,
    })

    currentDocumentData.value = updatedData

    $q.notify({ type: 'positive', message: 'Metadata saved successfully!' })
    dialog.value = false
    router.push('/documents')
  } catch (err) {
    console.error('Error saving metadata:', err)
    $q.notify({ type: 'negative', message: 'Unexpected error occurred.' })
  }
}

const handleScan = () => {
  router.push({ name: 'document-scanner' })
}

let currentDocumentData = ref(null)

// Upload handler
const handleUpload = async () => {
  if (!selectedFile.value || !selectedFile.value.name.endsWith('.pdf')) {
    $q.notify({ type: 'negative', message: 'Only .pdf files are allowed.' })
    return
  }

  // Reset cancellation state
  cancelRequested = false
  nlpAbortController = null
  ocrAbortController = null

  // Compress file
  currentProcess.value = 'Compressing PDF...'
  const compressedFile = await compressPdf(selectedFile.value)
  if (!compressedFile) {
    $q.notify({ type: 'negative', message: 'Compression failed. Please try again.' })
    return
  }

  // Check if cancelled during compression
  if (cancelRequested) {
    console.log('Upload cancelled during compression')
    return
  }

  const fileName = sanitizeFileName(compressedFile.name)
  nlpAbortController = new AbortController()
  uploading.value = true
  uploadProgress.value = 0
  loading.value = true

  // Check for existing filename
  const exists = await fileExists(fileName)
  if (exists) {
    $q.notify({ type: 'negative', message: `A file named "${fileName}" already exists.` })
    resetUploadState()
    return
  }

  try {
    const progressInterval = setInterval(() => {
      if (cancelRequested) {
        clearInterval(progressInterval)
        return
      }
      if (uploadProgress.value < 90) uploadProgress.value += 1
    }, 200)

    // NLP processing
    currentProcess.value = 'Processing document with NLP...'
    let response = await processFileWithNLP(compressedFile, fileName, nlpAbortController.signal)
    console.log('NLP Response:', response)

    // Check if cancelled after NLP
    if (cancelRequested) {
      clearInterval(progressInterval)
      console.log('Upload cancelled after NLP processing')
      return
    }

    if (response.data.status === 'ocr_required') {
      console.log('OCR required, processing...')
      currentProcess.value = 'Extracting text from images...'
      ocrAbortController = new AbortController()

      const ocrResult = await processOCRPages(response.data, {
        minPages: 3,
        minCharacters: 5000,
        signal: ocrAbortController.signal,
      })

      if (ocrResult && ocrResult.canceled) {
        clearInterval(progressInterval)
        console.warn('OCR canceled.')
        $q.notify({ type: 'warning', message: 'Upload canceled.' })
        return
      }

      if (ocrResult && ocrResult.success) {
        // Update the NLP response with OCR results
        response.data = {
          ...response.data,
          extracted_text: ocrResult.nlpResponse?.extracted_text || '',
          title: ocrResult.nlpResponse?.title || response.data.title,
          author: ocrResult.nlpResponse?.author || response.data.author,
          summary: ocrResult.nlpResponse?.summary || response.data.summary,
          keywords: ocrResult.nlpResponse?.keywords || response.data.keywords,
          categories: ocrResult.nlpResponse?.categories || response.data.categories,
        }
        console.log('OCR processing completed successfully')
      } else {
        console.warn('OCR processing failed, continuing with limited data')
      }
    }

    // Check if cancelled before file operations
    if (cancelRequested) {
      clearInterval(progressInterval)
      console.log('Upload cancelled before file operations')
      return
    }

    const nlpData = response.data
    console.log('NLP Response:', nlpData)

    // Preview image
    currentProcess.value = 'Generating preview...'
    const preview = await generatePdfPreview(compressedFile)
    const previewFileName = fileName.replace(/\.[^/.]+$/, '') + '_preview.png'

    // Check if cancelled during preview generation
    if (cancelRequested) {
      clearInterval(progressInterval)
      console.log('Upload cancelled during preview generation')
      return
    }

    const previewUploadError = await uploadPreviewImage(preview, previewFileName)
    if (previewUploadError && !cancelRequested) {
      throw previewUploadError
    }

    // Upload file
    currentProcess.value = 'Uploading file...'
    const uploadError = await uploadFileToStorage(compressedFile, fileName)
    if (uploadError && !cancelRequested) {
      console.error('Supabase Upload Error:', uploadError)
      throw uploadError
    }

    // Check if cancelled during upload
    if (cancelRequested) {
      clearInterval(progressInterval)
      console.log('Upload cancelled during file upload')
      return
    }

    clearInterval(progressInterval)
    uploadProgress.value = 100

    // Get public URLs
    const fileUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/documents/${encodeURIComponent(fileName)}`
    const previewUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/pdf-previews/${encodeURIComponent(previewFileName)}`

    // Save metadata
    currentProcess.value = 'Saving metadata...'
    let insertedData
    try {
      insertedData = await saveMetadataToDB(fileName, fileUrl, previewUrl, nlpData, user)
    } catch (dbError) {
      if (!cancelRequested) {
        console.error('DB error:', dbError)
        $q.notify({ type: 'negative', message: 'Upload succeeded but metadata failed to save.' })
      }
      return
    }

    if (cancelRequested) {
      console.log('Upload cancelled before finalizing metadata')
      return
    }

    currentDocumentData.value = insertedData

    // // Log data
    // const newData = {
    //   id: insertedData.id,
    //   file_name: insertedData.file_name,
    //   file_url: insertedData.file_url,
    //   metadata: insertedData.metadata,
    //   uploaded_at: insertedData.uploaded_at,
    //   updated_at: insertedData.updated_at,
    //   preview_url: insertedData.preview_url,
    //   search_text: insertedData.search_text,
    //   related_links: insertedData.related_links,
    // }

    const changes = getChanges(null, insertedData)

    // Log history
    await logItemHistory({
      itemId: insertedData.id,
      itemType: 'document',
      action: 'upload',
      oldData: null,
      newData: insertedData,
      changes,
    })

    // Success result
    metadata.value = {
      id: insertedData.id,
      file_name: fileName,
      file_url: fileUrl,
      title: nlpData.title || '',
      author: nlpData.author || '',
      date: nlpData.date || '',
      summary: nlpData.summary || '',
      keywords: nlpData.keywords || [],
      categories: nlpData.categories || [],
      extracted_text: nlpData.extracted_text || '',
    }

    dialog.value = true
  } catch (err) {
    if (cancelRequested) {
      console.log('Upload process was cancelled')
      $q.notify({ type: 'warning', message: 'Upload canceled.' })
    } else {
      console.error('Unexpected upload error:', err)
      $q.notify({ type: 'negative', message: 'Upload failed. Please try again.' })
    }
  } finally {
    resetUploadState()
  }
}

function handleForceCancel() {
  console.log('Force cancel requested - stopping all processes')

  cancelRequested = true

  if (nlpAbortController) {
    console.log('Aborting NLP request...')
    nlpAbortController.abort()
    nlpAbortController = null
  }

  if (ocrAbortController) {
    console.log('Aborting OCR request...')
    ocrAbortController.abort()
    ocrAbortController = null
  }

  resetUploadState()

  console.log('All upload processes cancelled')
}

function resetUploadState() {
  uploading.value = false
  uploadProgress.value = 0
  currentProcess.value = ''
  loading.value = false

  // Clean up controllers
  if (nlpAbortController) {
    nlpAbortController = null
  }
  if (ocrAbortController) {
    ocrAbortController = null
  }
}

function getChanges(oldData = {}, newData = {}) {
  const safeOld = oldData || {}
  const safeNew = newData || {}

  const changes = {}

  if (safeNew.metadata) {
    const metadataChanges = {}
    for (const key in safeNew.metadata) {
      const oldValue = safeOld.metadata?.[key] ?? null
      const newValue = safeNew.metadata?.[key] ?? null
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        metadataChanges[key] = { old: oldValue, new: newValue }
      }
    }
    if (Object.keys(metadataChanges).length > 0) {
      changes.metadata = metadataChanges
    }
  }

  for (const key of Object.keys(safeNew)) {
    if (key === 'metadata') continue
    const oldValue = safeOld[key] ?? null
    const newValue = safeNew[key] ?? null
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue }
    }
  }

  return changes
}

async function logItemHistory({ itemId, itemType, action, oldData, newData, changes }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      console.error('Auth error:', authError)
      return
    }

    const adminName =
      `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

    const { error } = await supabase.from('item_history').insert({
      item_id: itemId,
      item_type: itemType,
      action: action,
      performed_by: adminName || 'Admin',
      old_data: oldData,
      new_data: newData,
      changes: changes,
    })

    if (error) {
      console.error('Error logging history:', error)
    } else {
      console.log('History logged successfully')
    }
  } catch (err) {
    console.error('Unexpected error logging history:', err)
  }
}

// Compress pdf on upload
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

// Toggle favorite icon
const toggleFavorite = async (doc, itemType = 'document') => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error:', authError)
    return
  }

  try {
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

    const { data: existing } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('item_id', doc.id)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', doc.id)
        .eq('item_type', itemType)

      doc.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: doc.id,
        item_type: itemType,
      })

      doc.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

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
        documentsStore.updateStarCount(doc.id, 0)
      }
    } else {
      console.error('Document ID not found in documents_metadata:', metaError)
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

// Filter and sort options
watch(
  () => documentsStore.documents,
  (docs) => {
    const authors = new Map()
    const years = new Set()
    const categories = new Map([['all', 'All']])

    docs.forEach((doc) => {
      const meta = doc.metadata || {}

      if (meta.author) {
        meta.author.split(',').forEach((a) => {
          const standardized = a.trim().toLowerCase()
          if (!authors.has(standardized)) {
            authors.set(standardized, a.trim())
          }
        })
      }

      if (meta.date) {
        const year = meta.date.slice(0, 4)
        years.add(year)
      }

      if (Array.isArray(meta.categories)) {
        meta.categories.forEach((cat) => {
          const standardized = cat.trim().toLowerCase()
          if (!categories.has(standardized)) {
            categories.set(standardized, cat.trim())
          }
        })
      }
    })

    authorOptions.value = [...authors.values()].sort()
    categoryOptions.value = [...categories.values()].sort()
    dateOptions.value = [...years].sort((a, b) => b - a)
  },
  { immediate: true },
)

function applyFilters() {
  searchStore.clear()

  const filterData = {
    categories: Array.from(selectedCategories.value),
    authors: Array.from(selectedAuthors.value),
    dates: Array.from(selectedDates.value),
  }
  console.log('Applying filters:', filterData)

  documentsStore.filterBy(filterData, sortOption.value)
}

const clearFilters = () => {
  selectedAuthors.value = new Set()
  selectedDates.value = new Set()
  selectedCategories.value = new Set(['All'])
  applyFilters()
}

function toggleCategory(categoryOption) {
  if (categoryOption === 'All') {
    selectedCategories.value = new Set(['All'])
  } else {
    selectedCategories.value.delete('All')
    if (selectedCategories.value.has(categoryOption)) {
      selectedCategories.value.delete(categoryOption)
    } else {
      selectedCategories.value.add(categoryOption)
    }
  }

  // selectedCategories.value = new Set(selectedCategories.value)
  applyFilters()
}

function toggleAuthor(authorOption) {
  if (selectedAuthors.value.has(authorOption)) {
    selectedAuthors.value.delete(authorOption)
  } else {
    selectedAuthors.value.add(authorOption)
  }

  // selectedAuthors.value = new Set(selectedAuthors.value)
  applyFilters()
}

function toggleDate(dateOption) {
  if (selectedDates.value.has(dateOption)) {
    selectedDates.value.delete(dateOption)
  } else {
    selectedDates.value.add(dateOption)
  }
  // selectedDates.value = new Set(selectedDates.value)
  applyFilters()
}

function clearAuthor() {
  selectedAuthors.value = new Set()
  applyFilters()
}

function clearDate() {
  selectedDates.value = new Set()
  applyFilters()
}

function clearCategories() {
  selectedCategories.value = new Set(['All'])
  applyFilters()
}

// function applySort() {
//   switch (sortOption.value) {
//     case 'Newest':
//       documentsStore.sortBy('uploaded_at', 'desc')
//       break
//     case 'Oldest':
//       documentsStore.sortBy('uploaded_at', 'asc')
//       break
//     case 'Title A-Z':
//       documentsStore.sortBy('title', 'desc')
//       break
//     case 'Title Z-A':
//       documentsStore.sortBy('title', 'asc')
//       break
//   }
// }

function applySort(option) {
  sortOption.value = option
  if (searchStore.query) {
    searchStore.sortResults(option, searchStore.searchedDocuments)
  } else {
    documentsStore.sortByField(option)
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
  gap: 2rem;
}

.card-wrapper-2 {
  flex: 0 1 200px;
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
  object-fit: cover;
  border-bottom: 2px solid #880000;
}

.doc-align-items {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.2rem;
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

/* Responsiveness */
@media (max-width: 615px) {
  .doc-wrapper {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
