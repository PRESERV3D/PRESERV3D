<template>
  <q-page class="q-pa-md">
    <!-- Header Section with User Greeting -->
    <div class="layout-container">
      <div class="box-1 row items-center">
        <!-- Text Content -->
        <div class="col-12 col-md-7 q-gutter-xs">
          <p class="q-ml-xl dash-title">
            <span v-if="userStore.profile">Welcome Back, {{ userStore.profile.first_name }}!</span>
          </p>
          <p class="q-ml-xl dash-subtitle">
            <span v-if="userStore.profile?.role === 'admin'">(Admin Access) - </span>
            Explore University artifacts, historic documents, and <br class="gt-sm" />
            virtual museum exhibits.
          </p>
          <!-- Responsive Button Layout -->
          <div class="q-ml-md q-gutter-lg row no-wrap gt-xs">
            <q-btn to="/artifacts" label="Explore Artifacts" class="btn-explore" no-caps />
            <q-btn to="/documents" label="Browse Documents" class="btn-document" no-caps />
          </div>
          <!-- Small Button Layout -->
          <div class="q-ml-sm q-gutter-sm column xs">
            <q-btn to="/artifacts" label="Artifacts" class="btn-explore full-width" no-caps />
            <q-btn to="/documents" label="Documents" class="btn-document full-width" no-caps />
          </div>
        </div>
        <!-- Image - Hidden on small view -->
        <div class="col-12 col-md-5 q-gutter-xs gt-sm">
          <div class="row justify-center justify-md-end">
            <q-img src="/img/trophy-document.png" alt="Trophy and Document" class="trophies" />
          </div>
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
                  :src="item.file_url || '/img/artifact1.png'"
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
                      const action =
                        item.item_type === 'artifact' ? 'view_artifact' : 'view_document'
                      logClick(item.id, item.item_type, action)
                      viewItem(item)
                    }
                  "
                />
                <q-btn
                  flat
                  round
                  :icon="item.starred ? 'star' : 'star_border'"
                  class="action-icon star-icon"
                  :style="item.starred ? 'color: #efaf00' : ''"
                  :color="!item.starred ? 'grey' : undefined"
                  @click.stop="toggleFavoriteRecents(item, item.item_type)"
                />
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
        <div v-else class="artifacts-grid q-px-sm q-mb-lg">
          <div
            v-for="(model, i) in featuredModels"
            :key="i"
            class="artifact-card-wrapper"
            :class="{
              'hide-on-tablet': i >= 2,
              'hide-on-mobile': i >= 1
            }"
          >
            <q-card class="my-card" rounded bordered>
              <div class="card">
                <model-viewer
                  :src="model.file_url"
                  loading="lazy"
                  shadow-intensity="1"
                  class="artifacts"
                  style="width: 100%; height: 400px"
                  @pointerenter="startRotate"
                  @pointerleave="stopRotate"
                />
              </div>
              <q-card-section class="q-pa-sm artifact-card-section">
                <div class="title-row">
                  <router-link
                    :to="{ name: 'view-artifact', params: { id: model.id } }"
                    class="artifact-title-link"
                    @click="logClick(model.id, 'artifact', 'view_artifact')"
                  >
                    <div class="text-subtitle2 artifact-title">
                      {{ model.metadata?.title || model.file_name }}
                    </div>
                  </router-link>
                  <!-- FIXED: Action icons-->
                  <div class="action-icons">
                    <!-- View Icon with Count -->
                    <div class="icon-with-count">
                      <q-icon name="visibility" class="action-icon view-icon" size="18px" />
                      <span class="count-text">{{ modelStore.viewCounts[model.id] || 0 }}</span>
                    </div>

                    <!-- Star Icon with Count -->
                    <div class="icon-with-count">
                      <q-icon
                        :name="model.starred ? 'star' : 'star_border'"
                        class="action-icon star-icon"
                        :class="{ starred: model.starred }"
                        size="18px"
                        @click.stop="toggleFavorite(model, 'artifact')"
                      />
                      <span class="count-text">{{ modelStore.starCounts[model.id] || 0 }}</span>
                    </div>

                    <!-- Bookmark Icon -->
                    <q-icon
                      :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                      class="action-icon bookmark-icon"
                      :class="{ bookmarked: model.bookmarked }"
                      size="18px"
                      @click.stop="openBookmarkDialog(model, 'artifact')"
                    />
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
      <div class="box-3 collections-section q-px-lg">
        <div class="row items-center justify-between q-mb-sm q-mt-sm">
          <p class="q-ml-lg title-font-2">Collections</p>
          <!-- Add New button in the upper right -->
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
              v-for="(collection, index) in visibleCollections"
              :key="collection.collection_id"
              class="col card-wrapper"
              :class="{
                'hide-on-tablet': index >= 3,
                'hide-on-mobile': index >= 2
              }"
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
                      <div
                        class="text-subtitle2 artifact-title row items-center title-with-tooltip"
                      >
                        {{ collection.collection_name }}

                        <!-- ADDED: Pinned icon for Favorites -->
                        <q-icon
                          v-if="collection.collection_name === 'Favorites'"
                          name="push_pin"
                          class="q-ml-xs text-primary"
                          size="18px"
                        />

                        <div class="tooltip-box">{{ collection.collection_name }}</div>
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
        <div class="row justify-end q-pr-sm" style="margin-top: -1.25rem">
          <router-link to="/collections" class="see-all-link">
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
                <q-img src="/img/write.png" alt="Upload" class="upload-icon" />
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
              v-for="collection in visibleCollections"
              :key="collection.collection_id"
              class="q-py-sm flex items-center justify-between"
              style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 500"
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
            You don't have any collections yet.
          </div>
        </q-card-section>

        <q-card-actions class="collection-footer" align="center">
          <q-btn label="Save" color="primary" @click="saveToSelectedCollections" />
          <q-btn flat label="Cancel" v-close-popup @click="resetForm2" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from 'boot/supabase'
import { uploadFileToR2 } from 'boot/r2'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { useModelStore } from 'stores/modelStore'
import { useDocumentsStore } from 'stores/documentsStore'

import '@google/model-viewer'
import { useQuasar } from 'quasar'

const $q = useQuasar()


const router = useRouter()
const userStore = useUserStore()
const modelStore = useModelStore()
const documentsStore = useDocumentsStore()

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

// Collection dialog state
const dialogOpen = ref(false)
const selectedModel = ref(null)
const selectedItemType = ref('artifact')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

// Notification dialog state
const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

const userType = computed(() => userStore.profile?.user_type || 'Unknown')


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
      router.replace('/user/login')
      return
    }

    // Load user profile
    await userStore.fetchProfile()

    // Load all data
    await Promise.all([loadCollections(authUser.id), loadRecentViews(authUser.id), loadModels()])

    await loadUserCollections()
    await modelStore.fetchViewCounts()
    await modelStore.fetchStarCounts()
  } catch (err) {
    // ADDED: Top-level error handling from INDEX page
    console.error('Error initializing page:', err)
  }
})

//COLLECTIONS
const visibleCollections = computed(() => {
  const list = collections.value
  if ($q.screen.lt.sm) return list.slice(0, 2)
  if ($q.screen.lt.md) return list.slice(0, 3)
  if ($q.screen.lt.lg) return list.slice(0, 4)
  return list.slice(0, 5)
})

function startRotate(e) {
  const el = e.target
  el.autoRotate = true
  el.rotationPerSecond = '10deg'
  el.autoRotateDelay = 0
}

function stopRotate(e) {
  const el = e.target
  el.autoRotate = false
  el.cameraOrbit = '0deg 75deg 105%' // Reset back to original orientation
}

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

// Load collections from Supabase
async function loadCollections(userId) {
  isLoading.value = true
  try {
    // Try-catch wrapper for better error handling
    const { data, error } = await supabase
      .from('collections')
      .select('collection_name, cover_url, collection_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading collections:', error)
    } else {
      // Separate and pin the "Favorites" collection
      const favorites = data.find((c) => c.collection_name === 'Favorites')
      const others = data.filter((c) => c.collection_name !== 'Favorites')

      // Combine and assign to collections
      collections.value = favorites ? [favorites, ...others] : others
    }
  } catch (err) {
    console.error('Error loading collections:', err)
  }
  isLoading.value = false
}

// Load recent views with proper database fields and error handling
async function loadRecentViews(userId) {
  try {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('item_id, item_type, clicked_at')
      .eq('user_id', userId)
      .order('clicked_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Failed to fetch recent views:', error)
      return
    }

    const artifactIds = data.filter((d) => d.item_type === 'artifact').map((d) => d.item_id)
    const documentIds = data.filter((d) => d.item_type === 'document').map((d) => d.item_id)

    const { data: artifactData = [] } = artifactIds.length
      ? await supabase
          .from('artifacts_metadata')
          .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
          .in('id', artifactIds)
      : { data: [] }

    const { data: documentData = [] } = documentIds.length
      ? await supabase
          .from('documents_metadata')
          .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
          .in('id', documentIds)
      : { data: [] }

    // Fetch user favorites and bookmarks
    const { data: favoritesCollection, error: favError } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (favError) {
      console.error('Error fetching favorite items:', favError)
    }

    let favoriteKeySet = new Set()
    if (favoritesCollection) {
      const { data: favItems, error: favItemsError } = await supabase
        .from('collection_items')
        .select('item_id, item_type')
        .eq('collection_id', favoritesCollection.collection_id)

      if (!favItemsError && favItems) {
        favoriteKeySet = new Set(favItems.map((i) => `${i.item_type}:${i.item_id}`))
      }
    }

    // Combine and sort by original order
    const idToItem = {}
    for (const item of [...artifactData, ...documentData]) {
      idToItem[item.id] = item
    }

    // Combine and check if item is in Favorites
    recentItems.value = data
      .map((d) => {
        const item = idToItem[d.item_id]
        if (!item?.file_url) return null

        const key = `${d.item_type}:${d.item_id}`
        return {
          ...item,
          item_type: d.item_type,
          clicked_at: d.clicked_at,
          starred: favoriteKeySet.has(key),
        }
      })
      .filter(Boolean)
  } catch (err) {
    console.error('Error loading recent views:', err)
  }
}

// Load models with proper database structure and error handling
async function loadModels() {
  isLoadingModels.value = true
  try {
    // Added uploaded_at and updated_at fields like INDEX page
    const { data, error } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
      .limit(3)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error loading models:', error)
      return
    }

    // Fetch user favorites and bookmarks
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    // Fetch Favorites collection items
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
        .eq('item_type', 'artifact')

      if (!favItemsError) {
        favoriteIds = favItems.map((i) => i.item_id)
      }
    }

    // Get bookmarked artifact IDs (from non-Favorites collections)
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
          .eq('item_type', 'artifact')

        if (!bookmarkError && bookmarkedItems) {
          bookmarkedIds = [...new Set(bookmarkedItems.map((i) => i.item_id))]
        }
      }
    }

    const enhancedModels = data.map((model) => ({
      ...model,
      bookmarked: bookmarkedIds.includes(model.id),
      starred: favoriteIds.includes(model.id),
    }))

    modelStore.setModels(enhancedModels)
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
async function logClick(itemId, itemType, action) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error logging click:', authError)
    return
  }

  // Get model or document based on itemType
  let itemData
  if (itemType === 'artifact') {
    itemData = await modelStore.getModelById(itemId)
  } else if (itemType === 'document') {
    itemData = await documentsStore.getDocById(itemId)
  }

  if (!itemData) {
    console.error(`Item with ID ${itemId} not found in ${itemType} store.`)
    return
  }

  try {
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: userId,
      item_id: itemId,
      title: itemData.title || itemData.metadata?.title || 'Untitled',
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

// View item with proper error handling from INDEX page
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

// ADDED: Collection dialog methods
const openBookmarkDialog = async (model, type = 'artifact') => {
  selectedModel.value = model
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  // Check existing collections of an item
  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', model.id)
    .eq('item_type', type)

  if (error) {
    console.error('Error checking existing collections:', error)
    selectedCollections.value = []
    existingCollectionIds.value = []
    return
  }

  const existingIds = []
  for (const item of existingItems) {
    existingIds.push(item.collection_id)
  }

  selectedCollections.value = [...existingIds]
  existingCollectionIds.value = [...existingIds]
}

const loadUserCollections = async () => {
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
    // Exclude "Favorites" from the list
    userCollections.value = data.filter((c) => c.collection_name !== 'Favorites')
  } else {
    console.error('Failed to load collections:', error)
  }
}

const saveToSelectedCollections = async () => {
  const model = selectedModel.value

  if (!model) return

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
        item_id: model.id,
        item_type: selectedItemType.value,
      })

      // Mark model as bookmarked if added to a collection
      model.bookmarked = true

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
        .eq('item_id', model.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
    }

    const itemName = model.metadata?.title || model.file_name
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

    // Recheck if model is in any non-Favorites collection
    const { data: remainingItems, error: recheckError } = await supabase
      .from('collection_items')
      .select('collection_id, collections (collection_name)')
      .eq('item_id', model.id)
      .eq('item_type', selectedItemType.value)

    if (!recheckError) {
      model.bookmarked = remainingItems.some(
        (item) => item.collections?.collection_name !== 'Favorites',
      )
    } else {
      console.error('Error rechecking bookmark status:', recheckError)
    }

    dialogOpen.value = false
  } catch (err) {
    console.error('Unexpected error:', err)
    showNotifyDialog('Error', 'An unexpected error occurred.')
  }
}

const resetForm2 = () => {
  selectedCollections.value = []
  existingCollectionIds.value = []
}

// Toggle favorites - new in the archives
const toggleFavorite = async (model, itemType = 'artifact') => {
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
    const itemName = model.metadata?.title || model.file_name

    // Check if item already exists
    const { data: existing } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('item_id', model.id)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      // Remove from favorites
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', model.id)
        .eq('item_type', itemType)

      model.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: model.id,
        item_type: itemType,
      })

      model.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count
    const { data: metaCheck, error: metaError } = await supabase
      .from('artifacts_metadata')
      .select('id')
      .eq('id', model.id)
      .single()

    if (!metaError && metaCheck) {
      const { data: starData } = await supabase
        .from('artifacts_star_count')
        .select('star_count')
        .eq('item_id', model.id)
        .maybeSingle()

      if (starData && starData.star_count !== undefined) {
        modelStore.updateStarCount(model.id, starData.star_count)
      } else {
        // If no row exists, star count is 0
        modelStore.updateStarCount(model.id, 0)
      }
    } else {
      console.error('Model ID not found in artifacts_metadata:', metaError)
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

// Toggle favorites - recently viewed items
const toggleFavoriteRecents = async (item, itemType) => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error:', authError)
    return
  }

  const itemName = item.metadata?.title || item.file_name

  try {
    // Find or create Favorites collection
    let { data: favoritesCollection, error: favError } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (favError) {
      console.error('Error fetching favorites collection:', favError)
      return
    }

    if (!favoritesCollection) {
      const { data: newCollection, error: createError } = await supabase
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

      if (createError) {
        console.error('Error creating favorites collection:', createError)
        return
      }
      favoritesCollection = newCollection
    }

    // Check if item already exists
    const { data: existing, error: checkError } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', favoritesCollection.collection_id)
      .eq('item_id', item.id)
      .eq('item_type', itemType)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking favorite status:', checkError)
      return
    }

    if (existing) {
      // Remove from favorites
      console.log('Removing favorite:', {
        collection_id: favoritesCollection.collection_id,
        item_id: item.id,
        item_type: itemType,
      })

      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_id', item.id)
        .eq('item_type', itemType)

      item.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      console.log('Inserting favorite:', {
        collection_id: favoritesCollection.collection_id,
        item_id: item.id,
        item_type: itemType,
      })

      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: favoritesCollection.collection_id,
        item_id: item.id,
        item_type: itemType,
      })

      item.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count

    let metadataTable, starCountTable, store

    if (itemType === 'artifact') {
      metadataTable = 'artifacts_metadata'
      starCountTable = 'artifacts_star_count'
      store = modelStore
    } else if (itemType === 'document') {
      metadataTable = 'documents_metadata'
      starCountTable = 'documents_star_count'
      store = documentsStore
    }

    if (metadataTable && starCountTable) {
      const { data: metaCheck, error: metaError } = await supabase
        .from(metadataTable)
        .select('id')
        .eq('id', item.id)
        .single()

      if (!metaError && metaCheck) {
        const { data: starData } = await supabase
          .from(starCountTable)
          .select('star_count')
          .eq('item_id', item.id)
          .maybeSingle()

        if (starData && starData.star_count !== undefined) {
          store.updateStarCount(item.id, starData.star_count)
        } else {
          // If no row exists, star count is 0
          store.updateStarCount(item.id, 0)
        }
      } else {
        console.error('Item ID not found in metadata database:', metaError)
      }
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

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

      const { error, publicUrl } = await uploadFileToR2(file, 'collection-covers', fileName)

      if (error) {
        console.error('Upload error:', error)
      } else {
        coverUrl = publicUrl
        console.log('File uploaded successfully:', coverUrl)
      }
    }

    const defaultCover =
      'https://pub-8c8eb005cca947a7821974e5e66ea477.r2.dev/collection-covers/preservedcover.png'

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

<style scoped>
.layout-container {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.layout-container.no-gap {
  gap: 0;
}

.my-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  min-height: 300px;
}

.my-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.artifact-card-section {
  flex-shrink: 0;
  padding: 0.75rem;
}

/* STYLING
/* Recently Viewed Item Styles */
.recently-viewed-item {
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.recently-viewed-item:hover {
  background-color: rgba(136, 0, 0, 0.05);
}

.circular-holder {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  background-color: rgba(136, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.circle-icon-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 25px; /* Make it much bigger */
  z-index: 10;
}

.circular-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex-grow: 1;
  min-width: 0;
}

.artifact-name {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #560505;
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.view-info {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #7c7c7c;
  margin: 0;
  margin-top: 2px;
}

.view-icon {
  color: #7c7c7c;
  font-size: 18px;
}

.view-icon:hover {
  background-color: rgba(136, 0, 0, 0.1);
}

.artifact-title-link {
  text-decoration: none;
  flex: 1;
}

.artifact-title-link:hover {
  color: #560505;
}

.collection-card {
  border: none;
  background: transparent;
  box-shadow: none;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.star-icon {
  color: #7c7c7c;
  font-size: 18px;
}

.star-icon:hover {
  background-color: rgba(239, 175, 0, 0.1);
}


/* RESPONSIVE ARTIFACTS GRID */
.artifacts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  width: 100%;
}

.artifact-card-wrapper {
  display: flex;
  flex-direction: column;
}


/* ========================
 ARTIFACTS RESPONSIVE DESIGN
======================== */

/* Hide items based on screen size */
/* Tablet view */
@media (max-width: 1024px) and (min-width: 769px) {
  .artifacts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hide-on-tablet {
    display: none;
  }
}

/* Mobile view */
@media (max-width: 768px) {
  .artifacts-grid {
    grid-template-columns: 1fr;
  }

  .hide-on-mobile {
    display: none;
  }
}

/* ========================
 DASH & RECENTLY VIEWED RESPONSIVE DESIGN
======================== */

/* Base styles (mobile first) */
.dash-title {
  font-size: 1.5rem; /* 24px */
}

.dash-subtitle {
  font-size: 0.625rem; /* 10px */
  width: 70%;
}

.btn-explore,
.btn-document {
  font-size: 0.5rem; /* 8px */
}

.recently-viewed-item {
  padding: 0.25rem 0.375rem 1rem;
  margin-bottom: 0.125rem;
  min-height: 2.5rem; /* 40px */
}

.circular-holder {
  width: 2rem; /* 32px */
  height: 2rem;
}

.circle-icon-center {
  font-size: 0.875rem; /* 14px */
}

.artifact-name {
  font-size: 0.625rem; /* 10px */
  line-height: 1.5;
  margin-top: 1.25rem;
}

.view-info {
  font-size: 0.5rem; /* 8px */
}

.view-icon,
.star-icon,
.action-icons {
  display: none;
}

.item-details {
  margin: 0 0.25rem;
}

.my-card {
  min-height: 11.25rem; /* 180px */
  height: fit-content;
}

.artifact-card-section {
  padding: 0.5rem;
}

/* Hide trophy section on mobile */
.gt-sm {
  display: none;
}

/* Full width main content on mobile */
.col-md-7 {
  width: 100%;
  flex: 0 0 100%;
  max-width: 100%;
}

.trophies {
  max-width: 12.5rem; /* 200px */
}


.title-font-2 {
  font-size: 0.875rem; /* 14px */
}

/* ========================
   TABLET (48rem / 768px+)
======================== */
@media (min-width: 48rem) {
  .dash-title {
    font-size: 1.625rem; /* 26px */
  }

  .dash-subtitle {
    font-size: 0.75rem; /* 12px */
    width: 90%;
  }

  .btn-explore,
  .btn-document {
    font-size: 0.8125rem; /* 13px */
  }

  .recently-viewed-item {
    padding: 0.8rem 0.6rem;
    min-height: 3.75rem; /* 60px */
  }

  .circular-holder {
    width: 2.25rem; /* 36px */
    height: 2.25rem;
  }

  .circle-icon-center {
    font-size: 1.25rem; /* 20px */
  }

  .artifact-name {
    font-size: 0.6875rem; /* 11px */
    line-height: 1.1;
    margin-top: 1.25rem;
  }

  .view-info {
    font-size: 0.5rem; /* 8px */
  }

  .title-font-2 {
    font-size: 0.875rem; /* 14px */
  }

  .my-card {
    min-height: 17.5rem; /* 280px */
  }
}

/* ========================
   DESKTOP (64rem / 1024px+)
======================== */
@media (min-width: 64rem) {
  /* Show trophy section */
  .gt-sm {
    display: block;
  }

  /* Reset to Bootstrap grid behavior */
  .col-md-7 {
    width: auto;
    flex: 0 0 58.333333%;
    max-width: 58.333333%;
  }

  /* Trophy section responsive sizing */
  .trophies {
    max-width: 100%;
    width: 100%;
  }

  .dash-title {
    font-size: 1.75rem; /* 28px */
    width: auto;
  }

  .dash-subtitle {
    font-size: 0.75rem; /* 12px */
    width: auto;
  }

  .btn-explore,
  .btn-document {
    font-size: 0.8125rem; /* 13px */
  }

  .recently-viewed-item {
    padding: 0.7rem 0.5rem;
    min-height: 3.4375rem; /* 55px */
  }

  .circular-holder {
    width: 2.625rem; /* 42px */
    height: 2.625rem;
  }

  .circle-icon-center {
    font-size: 1.375rem; /* 22px */
  }

  .artifact-name {
    font-size: 0.8125rem; /* 13px */
    margin-top: 0;
  }

  .view-info {
    font-size: 0.625rem; /* 10px */
  }

  .view-icon,
  .star-icon {
    display: inline;
    font-size: 0.9375rem; /* 15px */
  }

  .action-icons {
    display: flex;
    gap: 0.2rem;
  }

  .item-details {
    margin: 0 0.4rem;
  }

  .title-font-2 {
    font-size: 1.125rem; /* 18px */
  }

  .my-card {
    min-height: 18.75rem; /* 300px */
  }

  .artifact-card-section {
    padding: 0.6rem;
  }

  .trophies {
    max-width: 100%;
    width: 100%;
  }
}

/* ========================
   LARGE DESKTOP (90rem / 1440px+)
======================== */
@media (min-width: 90rem) {
  .dash-title {
    font-size: 2rem; /* 32px */
  }

  .dash-subtitle {
    font-size: 1rem; /* 16px */
  }

  .recently-viewed-item {
    padding: 0.5rem 0.8rem;
    min-height: 4.0625rem; /* 65px */
  }

  .circular-holder {
    width: 3.125rem; /* 50px */
    height: 3.125rem;
  }

  .circle-icon-center {
    font-size: 1.75rem; /* 28px */
  }

  .artifact-name {
    font-size: 0.9375rem; /* 15px */
  }

  .view-info {
    font-size: 0.8125rem; /* 13px */
  }

  .view-icon,
  .star-icon {
    font-size: 1.25rem; /* 20px */
  }

  .action-icons {
    gap: 0.3rem;
  }

  .item-details {
    margin: 0 0.6rem;
  }

  .my-card {
    min-height: 20rem; /* 320px */
  }
}

/* ========================
   EXTRA LARGE (120rem / 1920px+)
======================== */
@media (min-width: 120rem) {
  .dash-title {
    font-size: 2.125rem; /* 34px */
  }

  .dash-subtitle {
    font-size: 1.125rem; /* 18px */
  }

  .recently-viewed-item {
    padding: 0.6rem 1rem;
    min-height: 4.375rem; /* 70px */
  }

  .circular-holder {
    width: 3.4375rem; /* 55px */
    height: 3.4375rem;
  }

  .circle-icon-center {
    font-size: 1.875rem; /* 30px */
  }

  .artifact-name {
    font-size: 1rem; /* 16px */
  }

  .view-info {
    font-size: 0.875rem; /* 14px */
  }

  .view-icon,
  .star-icon {
    font-size: 1.375rem; /* 22px */
  }

  .action-icons {
    gap: 0.4rem;
  }

  .item-details {
    margin: 0 0.8rem;
  }

  .my-card {
    min-height: 21.875rem; /* 350px */
  }

  .artifact-card-section {
    padding: 1rem;
  }
}


/*
  ========================
  MOBILE STYLES — TEMPORARILY DISABLED
  ========================

  Mobile landscape (480px - 599px)
  @media (min-width: 480px) and (max-width: 599px) {
    .dash-title {
      font-size: 1.4rem;
    }

    .dash-subtitle {
      font-size: 0.85rem;
    }

    .dash-subtitle br {
      display: none;
    }

    .btn-explore,
    .btn-document {
      font-size: 13px;
    }

    .recently-viewed-item {
      padding: 0.2rem 0.25rem;
      margin-bottom: 0.1rem;
      flex-wrap: nowrap;
      min-height: 42px;
    }

    .circular-holder {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .circle-icon-center {
      font-size: 14px;
    }

    .artifact-name {
      font-size: 9px;
      line-height: 1.0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      -webkit-line-clamp: 1;
    }

    .view-info {
      font-size: 7px;
      margin-top: 1px;
    }

    .view-icon,
    .star-icon {
      display: none !important;
    }

    .action-icons {
      display: none !important;
    }

    .item-details {
      min-width: 0;
      flex: 1;
      margin: 0 0.3rem;
    }

    .my-card {
      min-height: 240px;
    }

    .artifact-card-section {
      padding: 0.3rem;
    }

    .card-wrapper {
      width: 100% !important;
      max-width: none !important;
    }
  }

  Mobile portrait (320px - 479px)
  @media (max-width: 479px) {
    .dash-title {
      font-size: 1.2rem;
    }

    .dash-subtitle {
      font-size: 0.8rem;
    }

    .dash-subtitle br {
      display: none;
    }

    .btn-explore,
    .btn-document {
      font-size: 12px;
      min-height: 36px;
    }

    .recently-viewed-item {
      padding: 0.15rem 0.2rem;
      margin-bottom: 0.05rem;
      align-items: center;
      min-height: 38px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .recently-viewed-item:hover {
      background-color: rgba(136, 0, 0, 0.08);
      transform: translateX(2px);
    }

    .circular-holder {
      width: 28px;
      height: 28px;
    }

    .circle-icon-center {
      font-size: 12px;
    }

    .artifact-name {
      font-size: 8px;
      line-height: 1.0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 120px;
      -webkit-line-clamp: 1;
    }

    .view-info {
      font-size: 6px;
      margin-top: 0;
    }

    .view-icon,
    .star-icon {
      display: none !important;
    }

    .action-icons {
      display: none !important;
    }

    .item-details {
      margin: 0 0.2rem;
      min-width: 0;
      flex: 1;
    }

    .recently-viewed-item {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .recently-viewed-item .row {
      width: 100%;
      align-items: center;
    }

    .my-card {
      min-height: 240px;
    }

    .artifact-card-section {
      padding: 0.3rem;
    }

    .card-wrapper {
      width: 100% !important;
      max-width: none !important;
    }
  }

  Extra small screens (below 320px)
  @media (max-width: 319px) {
    .recently-viewed-item {
      padding: 0.1rem 0.15rem;
      flex-direction: row;
      align-items: center;
      gap: 0.15rem;
      min-height: 35px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .recently-viewed-item:hover {
      background-color: rgba(136, 0, 0, 0.08);
      transform: translateX(2px);
    }

    .circular-holder {
      width: 24px;
      height: 24px;
    }

    .circle-icon-center {
      font-size: 10px;
    }

    .artifact-name {
      font-size: 7px;
      max-width: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .view-info {
      font-size: 5px;
    }

    .action-icons {
      display: none !important;
    }

    .item-details {
      margin: 0 0.1rem;
      flex: 1;
      min-width: 0;
    }
  }

  UTILITY CLASSES FOR RESPONSIVE ICON HIDING
  @media (max-width: 1025px) {
    .hide-icons-tablet {
      display: none !important;
    }
  }

  @media (max-width: 599px) {
    .hide-star-mobile {
      display: none !important;
    }
  }

  @media (max-width: 479px) {
    .hide-icons-mobile {
      display: none !important;
    }

    .mobile-clickable-item {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mobile-clickable-item:hover {
      background-color: rgba(136, 0, 0, 0.08);
      transform: translateX(2px);
    }
  }
*/

</style>
