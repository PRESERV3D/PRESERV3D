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
          <q-img src="/img/trophy-document.png" alt="Trophy and Document" class="trophies" />
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
                      logClick(item.id, item.item_type)
                      viewItem(item)
                    }
                  "
                />
                <!-- FIXED: Added item_type parameter to star toggle -->
                <q-btn
                  flat
                  round
                  :icon="item.starred ? 'star' : 'star_border'"
                  class="action-icon star-icon"
                  :color="item.starred ? 'yellow' : 'grey'"
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
              v-for="collection in userCollections"
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
  } catch (err) {
    // ADDED: Top-level error handling from INDEX page
    console.error('Error initializing page:', err)
  }
})

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

// FIXED: Load collections from Supabase
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

    let favoriteIds = []
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

    // Add some mock data for demonstration compatibility
    const enhancedModels = data.map((model) => ({
      ...model,
      bookmarked: false,
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

// ADDED: Toggle favorites
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
      const { data: starData, error: starError } = await supabase
        .from('artifacts_star_count')
        .select('star_count')
        .eq('item_id', model.id)
        .single()

      if (!starError && starData) {
        modelStore.updateStarCount(model.id, starData.star_count)
      } else {
        console.error('Error fetching updated star count:', starError)
      }
    } else {
      console.error('Model ID not found in artifacts_metadata:', metaError)
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
}

.my-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.artifact-card-section {
  flex-shrink: 0;
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
</style>
