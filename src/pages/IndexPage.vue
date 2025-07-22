<template>
  <q-page class="q-pa-md">
    <!-- Header Section with User Greeting -->
    <div class="layout-container">
      <div class="box-1 row items-center">
        <div class="col-7 q-gutter-xs">
          <p class="q-ml-xl dash-title">
            <span v-if="userStore.profile">Welcome Back, {{ userStore.profile.first_name }}!</span>
          </p>
          <p class="q-ml-xl dash-subtitle">
            <span v-if="userStore.profile?.role === 'admin'">(Admin Access) - </span>
            Explore University artifacts, historic documents, and <br />
            virtual museum exhibits.
          </p>
          <div class="q-ml-md q-gutter-lg">
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" no-caps />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" no-caps />
          </div>
        </div>
        <div class="col-5 q-gutter-xs">
          <q-img
            src="src/assets/img/trophy-document.png"
            alt="Trophy and Document"
            class="trophies"
          />
        </div>
      </div>

      <!-- Recently Viewed Section -->
      <div class="box-2">
        <p class="q-ml-lg title-font-2">Recently Viewed</p>
        <div class="q-px-md q-pb-md">
          <div v-if="recentItems.length > 0" class="column q-gutter-xs">
            <div
              v-for="(item, index) in recentItems.slice(0, 3)"
              :key="index"
              class="row items-center q-gutter-md recently-viewed-item"
            >
              <div class="circular-holder">
                <q-img
                  :src="item.file_url || 'src/assets/img/artifact1.png'"
                  :alt="item.metadata?.title || item.file_name"
                  class="circular-image"
                />
                <!-- Add span icons within the circle -->
                <span v-if="item.item_type === 'artifact'" class="circle-icon-center">🏆</span>
                <span v-else-if="item.item_type === 'document'" class="circle-icon-center">📄</span>
              </div>
              <div class="col item-details">
                <p class="artifact-name">{{ item.metadata?.title || item.file_name }}</p>
                <p class="view-info">Viewed {{ timeAgo(item.clicked_at) }}</p>
              </div>
              <div class="action-icons">
                <q-btn
                  flat
                  round
                  icon="visibility"
                  class="view-icon"
                  @click="
                    () => {
                      logClick(item.id, item.item_type)
                      viewItem(item)
                    }
                  "
                />
                <!-- FIXED: Added item_type parameter to star toggle -->
                <!--           <q-btn
                  flat
                  round
                  :icon="item.starred ? 'star' : 'star_border'"
                  class="star-icon"
                  @click="toggleStar(item.id, item.item_type)"
                /> -->
              </div>
            </div>
          </div>
          <div v-else class="text-caption text-grey q-ml-lg">No recent views.</div>
        </div>
      </div>
    </div>

    <!-- New in the Archives Section -->
    <div class="layout-container q-my-lg">
      <div class="box-3 q-px-lg">
        <div class="row item-center justify-between q-mb-sm">
          <p class="q-ml-lg title-font-2">New in the Archives</p>
        </div>

        <!-- Loading Spinner for Featured Models -->
        <div v-if="isLoadingModels" class="text-center q-my-md">
          <q-spinner color="primary" size="lg" />
        </div>

        <!-- Three Artifacts Section -->
        <div v-else class="row q-gutter-md q-px-sm q-mb-lg">
          <div v-for="(model, i) in featuredModels" :key="i" class="col card-wrapper">
            <q-card class="my-card" rounded bordered>
              <div class="card">
                <model-viewer
                  :src="model.file_url"
                  loading="lazy"
                  auto-rotate
                  auto-rotate-delay="1500"
                  rotation-per-second="10deg"
                  shadow-intensity="1"
                  class="artifacts"
                  style="width: 100%; height: 400px"
                />
              </div>
              <q-card-section class="q-pa-sm artifact-card-section">
                <div class="title-row">
                  <router-link
                    :to="{ name: 'view-artifact', params: { id: model.id } }"
                    class="artifact-title-link"
                    @click="logClick(model.id, 'artifact')"
                  >
                    <div class="text-subtitle2 artifact-title">
                      {{ model.metadata?.title || model.file_name }}
                    </div>
                  </router-link>
                  <div class="action-icons">
                    <!-- FIXED: Added 'artifact' parameter to bookmark toggle
                    <q-icon
                      :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                      class="action-icon bookmark-icon"
                      :class="{ bookmarked: model.bookmarked }"
                      size="18px"
                      @click.stop="toggleBookmark(model.id, 'artifact')"
                    /> -->
                    <!-- FIXED: Added 'artifact' parameter to star toggle -->
                    <!-- <q-icon
                      :name="model.starred ? 'star' : 'star_border'"
                      class="action-icon star-icon"
                      :class="{ starred: model.starred }"
                      size="18px"
                      @click.stop="toggleStar(model.id, 'artifact')"
                    /> -->
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Collections Section -->
    <div class="layout-container q-my-lg">
      <div class="box-3 q-px-lg">
        <div class="row items-center justify-between q-mb-sm q-mt-sm">
          <p class="q-ml-lg title-font-2">Collections</p>
          <!-- Filter, Sort, and Add New button in the upper right -->
          <div class="row q-gutter-sm items-center q-pr-sm">
            <q-btn
              @click="showDialog = true"
              label="Add New"
              icon="add_circle"
              style="min-width: 150px"
              class="add-new-btn"
              no-caps
              unelevated
            />
            <!-- Filter Icon Button with Menu -->
            <!-- <q-btn
              flat
              round
              icon="filter_list"
              class="filter-sort-btn"
              @click="showFilterMenu = !showFilterMenu"
            >
              <q-menu v-model="showFilterMenu" anchor="bottom right" self="top right">
                <q-list dense>
                  <q-item
                    v-for="option in filterOptions"
                    :key="option"
                    clickable
                    @click="selectFilter(option)"
                    :class="{ 'bg-grey-2': selectedFilter === option }"
                  >
                    <q-item-section>{{ option }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            Sort Icon Button with Menu
            <q-btn
              flat
              round
              icon="sort"
              class="filter-sort-btn"
              @click="showSortMenu = !showSortMenu"
            >
              <q-menu v-model="showSortMenu" anchor="bottom right" self="top right">
                <q-list dense>
                  <q-item
                    v-for="option in sortOptions"
                    :key="option"
                    clickable
                    @click="selectSort(option)"
                    :class="{ 'bg-grey-2': selectedSort === option }"
                  >
                    <q-item-section>{{ option }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>

            -->
          </div>
        </div>
        <!-- Loading Spinner for Collections -->
        <div v-if="isLoading" class="text-center q-my-md">
          <q-spinner color="primary" size="lg" />
        </div>

        <!-- Collections Display -->
        <div v-else>
          <div v-if="collections.length > 0" class="row q-gutter-xl q-pl-lg q-pr-sm q-mb-sm">
            <div
              v-for="collection in collections.slice(0, 5)"
              :key="collection.collection_id"
              class="col card-wrapper"
            >
              <q-card
                class="my-card collection-card"
                flat
                @click="goToCollectionDetailsPage(collection.collection_id)"
              >
                <div class="book-container">
                  <div class="book-cover">
                    <div class="book-spine"></div>
                    <div class="book-content" :class="{ 'has-image': collection.cover_url }">
                      <!-- Show uploaded image as background if available -->
                      <div v-if="collection.cover_url" class="book-image-overlay">
                        <img
                          :src="collection.cover_url"
                          :alt="collection.collection_name"
                          class="book-background-image"
                        />
                      </div>
                      <!-- Show default icon if no image -->
                      <div v-else class="book-title-section">
                        <div class="book-icon">
                          <q-icon name="collections_bookmark" size="2rem" color="white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <q-card-section class="q-pa-sm artifact-card-section">
                  <div class="title-row">
                    <div class="collection-title-link">
                      <div class="text-subtitle2 artifact-title">
                        {{ collection.collection_name }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div v-else class="text-center q-mt-md">
            <p>No collections found.</p>
          </div>
        </div>

        <!-- See All Link -->
        <div class="row justify-end q-pr-sm q-pb-sm">
          <router-link to="/collections" class="see-all-link" style="margin-top: 0.5rem">
            See All
            <q-icon name="arrow_forward" size="16px" class="q-ml-xs" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Add Collection Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="add-collection-card">
        <q-card-section class="row justify-center items-center">
          <div class="sub-font-3 text-center" style="font-size: 16px; font-weight: 700">
            Add New Collection
          </div>
        </q-card-section>

        <q-card-section class="row q-gutter-md" style="gap: 0.5rem">
          <div class="col-auto q-ml-md">
            <div class="upload-box" @click="triggerFileInput">
              <img v-if="previewImage" :src="previewImage" alt="Preview" class="preview-image" />
              <div v-else class="upload">
                <q-img src="src/assets/img/write.png" alt="Upload" class="upload-icon" />
                <div>Upload Photo</div>
              </div>
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="handleImageUpload"
                style="display: none"
              />
            </div>
          </div>

          <div class="col-5 q-ml-lg">
            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">COLLECTION NAME</div>
            <q-input
              v-model="newCollectionTitle"
              class="field-collection q-mb-md"
              label="Enter Collection Name"
              dense
              outlined
            />

            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
              SHORT DESCRIPTION
            </div>
            <q-input
              v-model="newCollectionDesc"
              type="textarea"
              class="field-collection"
              label="Enter Short Description"
              dense
              outlined
              style="min-height: 8rem"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            class="sub-font-2"
            style="color: #000000"
            v-close-popup
            no-caps
            @click="resetForm"
          />
          <q-btn label="Save" class="q-mr-sm btn-save" @click="addCollection" no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

const router = useRouter()
const userStore = useUserStore()
const modelStore = useModelStore()

// Reactive variables
const collections = ref([])
const recentItems = ref([])
const isLoading = ref(true)
const isLoadingModels = ref(true)
const showDialog = ref(false)
const fileInput = ref(null)
const previewImage = ref(null)
const newCollectionTitle = ref('')
const newCollectionDesc = ref('')
const newCollection = ref({ coverFile: null })

// ADDED: Filter and Sort reactive variables from INDEX page
// const selectedFilter = ref('All')
// const selectedSort = ref('Recent')
// // const showFilterMenu = ref(false)
// const showSortMenu = ref(false)

// ADDED: Filter and sort options from INDEX page
// const filterOptions = ['All', 'Documents', 'PDFs', 'Images', 'Recent']
// const sortOptions = ['Recent', 'Alphabetical', 'Author', 'Date Created']

// Get first 3 models for featured display
const featuredModels = computed(() => {
  return modelStore.models.slice(0, 3)
})

// Initialize page
onMounted(async () => {
  try {
    // ADDED: Better error handling structure from INDEX page
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error('Auth error:', authError)
      router.push('/user/login')
      return
    }

    // Load user profile
    await userStore.fetchProfile()

    // Load all data
    await Promise.all([loadCollections(authUser.id), loadRecentViews(authUser.id), loadModels()])
  } catch (err) {
    // ADDED: Top-level error handling from INDEX page
    console.error('Error initializing page:', err)
  }
})

// Load collections from Supabase
async function loadCollections(userId) {
  isLoading.value = true
  try {
    // ADDED: Try-catch wrapper for better error handling
    const { data, error } = await supabase
      .from('collections')
      .select('collection_name, cover_url, collection_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading collections:', error)
    } else {
      collections.value = data
    }
  } catch (err) {
    console.error('Error loading collections:', err)
  }
  isLoading.value = false
}

// FIXED: Load recent views with proper database fields and error handling
async function loadRecentViews(userId) {
  try {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('item_id, item_type, clicked_at')
      .eq('user_id', userId)
      .order('clicked_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Failed to fetch recent views:', error)
      return
    }

    const artifactIds = data.filter((d) => d.item_type === 'artifact').map((d) => d.item_id)
    const documentIds = data.filter((d) => d.item_type === 'document').map((d) => d.item_id)

    // FIXED: Added uploaded_at and updated_at fields like INDEX page
    const recentArtifactData = artifactIds.length
      ? await supabase
          .from('artifacts_metadata')
          .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
          .in('id', artifactIds)
      : { data: [] }

    const recentDocumentData = documentIds.length
      ? await supabase
          .from('documents_metadata')
          .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
          .in('id', documentIds)
      : { data: [] }

    // Combine and sort by original order
    const idToItem = {}
    for (const item of [...recentArtifactData.data, ...recentDocumentData.data]) {
      idToItem[item.id] = item
    }

    recentItems.value = data
      .map((d) => ({
        ...idToItem[d.item_id],
        item_type: d.item_type,
        clicked_at: d.clicked_at,
      }))
      .filter((item) => item?.file_url)
  } catch (err) {
    // ADDED: Better error handling
    console.error('Error loading recent views:', err)
  }
}

// FIXED: Load models with proper database structure and error handling
async function loadModels() {
  isLoadingModels.value = true
  try {
    // FIXED: Added uploaded_at and updated_at fields like INDEX page
    const { data, error } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
      .limit(3)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error loading models:', error)
    } else {
      modelStore.setModels(data)
    }
  } catch (err) {
    console.error('Failed to load models:', err)
  }
  isLoadingModels.value = false
}

// Time ago helper function
function timeAgo(dateString) {
  if (!dateString) return 'unknown time'

  const now = new Date()
  const viewed = new Date(dateString)
  const diffMs = now - viewed

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

// Log click activity
async function logClick(itemId, itemType) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id
  const model = await modelStore.getModelById(itemId)

  if (authError || !userId) {
    console.error('Auth error logging click:', authError)
    return
  }

  try {
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: userId,
      item_id: itemId,
      title: model.title || 'Untitled',
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

// FIXED: View item with proper error handling from INDEX page
async function viewItem(item) {
  try {
    if (item.item_type === 'artifact') {
      const { data, error } = await supabase
        .from('artifacts_metadata')
        .select('id')
        .eq('id', item.id)
        .single()

      if (error || !data) {
        console.error('Artifact not found:', error)
        return
      }

      router.push(`/artifacts/${item.id}`)
    }

    if (item.item_type === 'document') {
      const { data, error } = await supabase
        .from('documents_metadata')
        .select('id')
        .eq('id', item.id)
        .single()

      if (error || !data) {
        console.error('Document not found:', error)
        return
      }

      router.push(`/documents/${item.id}`)
    }
  } catch (err) {
    // ADDED: Better error handling
    console.error('Error viewing item:', err)
  }
}

// FIXED: Toggle star with proper parameter handling and database updates
// const toggleStar = async (itemId, itemType = 'artifact') => {
//   try {
//     if (itemType === 'artifact') {
//       const model = modelStore.models.find((m) => m.id === itemId)
//       if (model) {
//         model.starred = !model.starred
//         // ADDED: Database update from INDEX page logic
//         await supabase
//           .from('artifacts_metadata')
//           .update({ starred: model.starred })
//           .eq('id', itemId)
//       }
//     } else {
//       // ADDED: Handle recent items star toggle
//       const item = recentItems.value.find((i) => i.id === itemId)
//       if (item) {
//         item.starred = !item.starred
//         // Update in appropriate table
//         const tableName = itemType === 'artifact' ? 'artifacts_metadata' : 'documents_metadata'
//         await supabase.from(tableName).update({ starred: item.starred }).eq('id', itemId)
//       }
//     }
//   } catch (err) {
//     console.error('Error toggling star:', err)
//   }
// }

// FIXED: Toggle bookmark with proper parameter handling and database updates
// const toggleBookmark = async (itemId, itemType = 'artifact') => {
//   try {
//     if (itemType === 'artifact') {
//       const model = modelStore.models.find((m) => m.id === itemId)
//       if (model) {
//         model.bookmarked = !model.bookmarked
//         // ADDED: Database update from INDEX page logic
//         await supabase
//           .from('artifacts_metadata')
//           .update({ bookmarked: model.bookmarked })
//           .eq('id', itemId)
//       }
//     }
//   } catch (err) {
//     console.error('Error toggling bookmark:', err)
//   }
// }

// FIXED: Added proper filter and sort handler functions
// const selectFilter = (option) => {
//   selectedFilter.value = option
//   showFilterMenu.value = false
// }

// const selectSort = (option) => {
//   selectedSort.value = option
//   showSortMenu.value = false
// }

// Navigation functions
function goToCollectionDetailsPage(collectionId) {
  router.push(`/collection/${collectionId}`)
}

// Collection management
function triggerFileInput() {
  fileInput.value.click()
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  newCollection.value.coverFile = file

  const reader = new FileReader()
  reader.onload = () => {
    previewImage.value = reader.result
  }
  reader.readAsDataURL(file)
}

function resetForm() {
  newCollectionTitle.value = ''
  newCollectionDesc.value = ''
  previewImage.value = null
  newCollection.value.coverFile = null
}

async function addCollection() {
  try {
    // ADDED: Better error handling structure
    const title = newCollectionTitle.value.trim()
    const description = newCollectionDesc.value.trim()

    if (!title) {
      console.warn('Collection title is required')
      return
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    let coverUrl = ''

    if (newCollection.value.coverFile) {
      const file = newCollection.value.coverFile
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`

      const { error: uploadError } = await supabase.storage
        .from('collection-covers')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('collection-covers')
          .getPublicUrl(fileName)

        coverUrl = publicUrlData?.publicUrl ?? ''
      }
    }

    const defaultCover =
      'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers/preservedcover.png'

    const { error: insertError } = await supabase.from('collections').insert([
      {
        created_at: new Date().toISOString(),
        collection_name: title,
        description,
        user_id: authUser.id,
        cover_url: coverUrl || defaultCover,
      },
    ])

    if (insertError) {
      console.error('Insert error:', insertError)
    } else {
      showDialog.value = false
      resetForm()
      await loadCollections(authUser.id)
    }
  } catch (err) {
    // ADDED: Top-level error handling
    console.error('Error adding collection:', err)
  }
}
</script>
