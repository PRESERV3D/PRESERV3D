<template>
  <q-page class="q-pa-md">
    <!-- Header Section with User Greeting -->
    <div class="layout-container">
      <div class="box-1 row items-center">
        <!-- Text Content -->
        <div class="col-12 col-md-7 q-gutter-xs">
          <p class="q-ml-xl dash-title">
            <span v-if="userStore.profile"
              >Welcome Back, {{ userStore.profile?.first_name || '' }}!</span
            >
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
            <q-img
              src="/img/trophy-document.png"
              alt="Trophy and Document"
              class="trophies"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <!-- Recently Viewed Section -->
      <div class="box-2">
        <p class="q-ml-lg title-font-2">Recently Viewed</p>
        <div class="q-pb-md">
          <div v-if="recentItems.length > 0" class="column q-gutter-xs">
            <div
              v-for="(item, index) in recentItems.slice(0, 3)"
              :key="index"
              class="row items-center recently-viewed-item"
            >
              <div class="circular-holder">
                <q-img
                  :src="item.file_url || '/img/artifact1.png'"
                  :alt="item.metadata?.title || item.file_name"
                  class="circular-image"
                  loading="lazy"
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
      <div class="box-3 box-3-artifacts q-px-lg">
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
              'hide-on-mobile': i >= 1,
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
                <div class="title-row q-mt-sm">
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

    <!-- Documents Section (Replacing Collections) -->
    <div class="layout-container q-my-lg">
      <div class="box-3 collections-section q-px-lg">
        <div class="row items-center justify-between q-mb-sm q-mt-sm">
          <p class="q-ml-lg title-font-2">Documents</p>
        </div>
        <!-- Loading Spinner for Documents -->
        <div v-if="isLoadingDocuments" class="text-center q-my-md">
          <q-spinner color="primary" size="lg" />
        </div>

        <!-- Documents Display -->
        <div v-else>
          <div v-if="documents.length > 0" class="row q-gutter-xl q-pl-lg q-pr-sm q-mb-sm">
            <div
              v-for="(document, index) in visibleDocuments"
              :key="document.id"
              class="col card-wrapper"
              :class="{
                'hide-on-tablet': index >= 3,
                'hide-on-mobile': index >= 2,
              }"
            >
              <q-card
                class="docCard"
                rounded
                bordered
                @click="goToDocumentDetailsPage(document.id)"
              >
                <router-link
                  :to="{ name: 'view-document', params: { id: document.id } }"
                  class="document-link"
                >
                  <q-img
                    :src="document.preview_url || '/img/default-document.png'"
                    :alt="document.metadata?.title || document.file_name"
                    class="document"
                    loading="lazy"
                  />
                </router-link>

                <div class="q-py-xs doc-align-items">
                  <!-- View Icon with Count -->
                  <q-icon name="visibility" color="grey" size="xs" class="action-icon view-icon" />
                  <span class="count-text">{{ documentsStore.viewCounts[document.id] || 0 }}</span>

                  <!-- Star Icon with Count -->
                  <q-icon
                    :name="document.starred ? 'star' : 'star_border'"
                    :class="{ starred: document.starred }"
                    size="xs"
                    class="action-icon star-icon"
                    @click.stop="toggleFavoriteDocuments(document, 'document')"
                  />
                  <span class="count-text">{{ documentsStore.starCounts[document.id] || 0 }}</span>

                  <!-- Bookmark Icon -->
                  <q-icon
                    :name="document.bookmarked ? 'bookmark' : 'bookmark_border'"
                    :class="{ bookmarked: document.bookmarked }"
                    size="xs"
                    class="action-icon bookmark-icon"
                    @click.stop="openBookmarkDialog(document, 'document')"
                  />
                </div>
              </q-card>

              <div class="q-mt-md fade-title-container">
                <div class="sub-font fade-title" style="color: black; font-weight: 800">
                  {{ document.metadata?.title || document.file_name }}
                  <div class="tooltip-box">
                    {{ document.metadata?.title || document.file_name }}
                  </div>
                </div>
                <div class="q-mt-sm sub-font-2" style="color: black; font-weight: 200">
                  {{ document.metadata?.author || 'Unknown Author' }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center q-mt-md">
            <p>No documents found.</p>
          </div>
        </div>

        <!-- See All Link -->
        <div class="row justify-end q-pr-sm" style="margin-top: 2rem">
          <router-link to="/documents" class="see-all-link">
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
                <q-img src="/img/write.png" alt="Upload" class="upload-icon" loading="lazy" />
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
import { computed, onMounted, onActivated, ref } from 'vue'
import { supabase } from 'boot/supabase'
import { uploadFileToR2 } from 'boot/r2'
import { convertToWorkingUrl } from 'src/composables/useR2Url'
import { preloadPreviews } from 'src/utils/urlCache'
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
const documents = ref([]) // CHANGED: Added documents array
const recentItems = ref([])
const isLoading = ref(true)
const isLoadingModels = ref(true)
const isLoadingDocuments = ref(true) // CHANGED: Added loading state for documents
const showDialog = ref(false)
const fileInput = ref(null)
const previewImage = ref(null)
const newCollectionTitle = ref('')
const newCollectionDesc = ref('')
const newCollection = ref({ coverFile: null })

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

// Initialize page (extract to allow re-run on activation)
async function init() {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error('Auth error:', authError)
      router.replace('/user/login')
      return
    }

    // Load user profile if missing
    if (!userStore.profile && authUser?.id) {
      await userStore.fetchProfile(authUser.id)
    }

    // Parallelize ALL independent data fetching operations for better performance
    await Promise.all([
      loadCollections(authUser.id),
      loadRecentViews(authUser.id),
      loadModels(),
      loadDocuments(),
      modelStore.fetchViewCounts(),
      modelStore.fetchStarCounts(),
      documentsStore.fetchViewCounts(),
      documentsStore.fetchStarCounts(),
    ])

    // Load user collections after initial data (depends on collections being loaded)
    await loadUserCollections()
  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

onMounted(() => init())
onActivated(() => init())

//COLLECTIONS
const visibleCollections = computed(() => {
  const list = collections.value
  if ($q.screen.lt.sm) return list.slice(0, 2)
  if ($q.screen.lt.md) return list.slice(0, 3)
  if ($q.screen.lt.lg) return list.slice(0, 4)
  return list.slice(0, 5)
})

// CHANGED: Added visibleDocuments computed property
const visibleDocuments = computed(() => {
  const list = documents.value
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
  el.cameraOrbit = '0deg 75deg 105%'
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
    const { data, error } = await supabase
      .from('collections')
      .select('collection_name, cover_url, collection_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading collections:', error)
    } else {
      const favorites = data.find((c) => c.collection_name === 'Favorites')
      const others = data.filter((c) => c.collection_name !== 'Favorites')

      collections.value = favorites ? [favorites, ...others] : others
    }
  } catch (err) {
    console.error('Error loading collections:', err)
  }
  isLoading.value = false
}

// CHANGED: Added loadDocuments function
async function loadDocuments() {
  isLoadingDocuments.value = true
  try {
    // Utilize idx_documents_uploaded_at index with ORDER BY for better performance
    const { data, error } = await supabase
      .from('documents_metadata')
      .select('id, file_name, metadata, file_url, preview_url, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error loading documents:', error)
      documents.value = []
      return
    }

    // Convert URLs for documents with preview_url support
    documents.value = await Promise.all(
      (data || []).map(async (doc) => {
        let workingFileUrl = doc.file_url
        let workingPreviewUrl = doc.preview_url

        try {
          if (doc.file_url) {
            workingFileUrl = await convertToWorkingUrl(doc.file_url)
          }
          if (doc.preview_url) {
            workingPreviewUrl = await convertToWorkingUrl(doc.preview_url)
          }
        } catch (err) {
          console.warn('Could not convert document URLs:', doc.id, err)
        }

        return {
          ...doc,
          file_url: workingFileUrl,
          preview_url: workingPreviewUrl,
        }
      }),
    )

    // Preload preview images for instant display
    const previewUrls = documents.value.map((d) => d.preview_url).filter(Boolean)
    if (previewUrls.length > 0) {
      preloadPreviews(previewUrls)
    }
  } catch (err) {
    console.error('Failed to load documents:', err)
    documents.value = []
  } finally {
    isLoadingDocuments.value = false
  }
}

// Load recent views with proper database fields and error handling
async function loadRecentViews(userId) {
  try {
    // Utilize idx_user_activity_recent composite index (user_id + clicked_at DESC)
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('item_id, item_type, clicked_at')
      .eq('user_id', userId)
      .order('clicked_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Failed to fetch recent views:', error)
      recentItems.value = []
      return
    }

    if (!data || data.length === 0) {
      recentItems.value = []
      return
    }

    const artifactIds = data.filter((d) => d.item_type === 'artifact').map((d) => d.item_id)
    const documentIds = data.filter((d) => d.item_type === 'document').map((d) => d.item_id)

    // Parallelize artifact, document, and favorites collection fetches
    const [artifactDataResult, documentDataResult, favoritesCollectionResult] = await Promise.all([
      artifactIds.length
        ? supabase
            .from('artifacts_metadata')
            .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
            .in('id', artifactIds)
        : Promise.resolve({ data: [] }),
      documentIds.length
        ? supabase
            .from('documents_metadata')
            .select('id, file_name, metadata, file_url, preview_url, uploaded_at, updated_at')
            .in('id', documentIds)
        : Promise.resolve({ data: [] }),
      // Utilize idx_collections_user_id and idx_collections_user_name composite indexes
      supabase
        .from('collections')
        .select('collection_id')
        .eq('user_id', userId)
        .eq('collection_name', 'Favorites')
        .maybeSingle(),
    ])

    const artifactData = artifactDataResult.data || []
    const documentData = documentDataResult.data || []
    const favoritesCollection = favoritesCollectionResult.data

    let favoriteKeySet = new Set()
    if (favoritesCollection) {
      // Utilize idx_collection_items_collection composite index
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

    // Convert URLs and combine with favorites check
    recentItems.value = await Promise.all(
      data
        .map(async (d) => {
          const item = idToItem[d.item_id]
          if (!item?.file_url) return null

          let workingUrl = item.file_url
          let workingPreviewUrl = item.preview_url

          try {
            workingUrl = await convertToWorkingUrl(item.file_url)
          } catch (err) {
            console.warn('Could not convert recent item URL:', item.id, err)
          }

          // Convert preview_url for documents
          if (d.item_type === 'document' && item.preview_url) {
            try {
              workingPreviewUrl = await convertToWorkingUrl(item.preview_url)
            } catch (err) {
              console.warn('Could not convert preview URL:', item.id, err)
            }
          }

          const key = `${d.item_type}:${d.item_id}`
          return {
            ...item,
            file_url: workingUrl,
            preview_url: workingPreviewUrl,
            item_type: d.item_type,
            clicked_at: d.clicked_at,
            starred: favoriteKeySet.has(key),
          }
        })
        .filter((promise) => promise !== null),
    )
    recentItems.value = recentItems.value.filter(Boolean)

    // Preload preview images for documents in recent items
    const documentPreviews = recentItems.value
      .filter((item) => item.item_type === 'document' && item.preview_url)
      .map((item) => item.preview_url)

    if (documentPreviews.length > 0) {
      preloadPreviews(documentPreviews)
    }
  } catch (err) {
    console.error('Error loading recent views:', err)
  }
}

// Load models with proper database structure and error handling
async function loadModels() {
  isLoadingModels.value = true
  try {
    // Parallelize auth check and model fetch
    const [authDataResult, modelsResult] = await Promise.all([
      supabase.auth.getUser(),
      // Utilize idx_artifacts_uploaded_at index with ORDER BY
      supabase
        .from('artifacts_metadata')
        .select('id, file_name, metadata, file_url, uploaded_at, updated_at')
        .order('uploaded_at', { ascending: false })
        .limit(3),
    ])

    const { data, error } = modelsResult
    const authData = authDataResult.data
    const userId = authData?.user?.id

    if (error) {
      console.error('Error loading models:', error)
      modelStore.setModels([])
      return
    }

    if (!userId) {
      // If no user, just set models without favorites
      const enhancedModels = await Promise.all(
        (data || []).map(async (model) => {
          let workingUrl = model.file_url
          try {
            workingUrl = await convertToWorkingUrl(model.file_url)
          } catch (err) {
            console.warn('Could not convert model URL:', model.id, err)
          }
          return {
            ...model,
            file_url: workingUrl,
            is_favorite: false,
            is_bookmarked: false,
          }
        }),
      )
      modelStore.setModels(enhancedModels)
      return
    }

    // Parallelize Favorites collection fetch and all user collections fetch
    const [favoritesCollectionResult, allUserCollectionsResult] = await Promise.all([
      // Utilize idx_collections_user_id and idx_collections_user_name composite indexes
      supabase
        .from('collections')
        .select('collection_id')
        .eq('user_id', userId)
        .eq('collection_name', 'Favorites')
        .maybeSingle(),
      supabase.from('collections').select('collection_id, collection_name').eq('user_id', userId),
    ])

    const favoritesCollection = favoritesCollectionResult.data
    const allUserCollections = allUserCollectionsResult.data || []

    let favoriteIds = []
    let bookmarkedIds = []

    // Parallelize favorite items and bookmarked items fetches
    const collectionItemsPromises = []

    if (favoritesCollection) {
      // Utilize idx_collection_items_collection composite index
      collectionItemsPromises.push(
        supabase
          .from('collection_items')
          .select('item_id')
          .eq('collection_id', favoritesCollection.collection_id)
          .eq('item_type', 'artifact')
          .then((result) => ({ type: 'favorites', data: result.data })),
      )
    }

    // Get bookmarked artifact IDs (from non-Favorites collections)
    const nonFavoritesCollections = allUserCollections.filter(
      (col) => col.collection_name !== 'Favorites',
    )

    if (nonFavoritesCollections.length > 0) {
      const collectionIds = nonFavoritesCollections.map((col) => col.collection_id)

      collectionItemsPromises.push(
        supabase
          .from('collection_items')
          .select('item_id')
          .in('collection_id', collectionIds)
          .eq('item_type', 'artifact')
          .then((result) => ({ type: 'bookmarks', data: result.data })),
      )
    }

    const collectionItemsResults = await Promise.all(collectionItemsPromises)

    collectionItemsResults.forEach((result) => {
      if (result.type === 'favorites' && result.data) {
        favoriteIds = result.data.map((i) => i.item_id)
      } else if (result.type === 'bookmarks' && result.data) {
        bookmarkedIds = [...new Set(result.data.map((i) => i.item_id))]
      }
    })

    const enhancedModels = await Promise.all(
      (data || []).map(async (model) => {
        let workingUrl = model.file_url
        try {
          workingUrl = await convertToWorkingUrl(model.file_url)
        } catch (err) {
          console.warn('Could not convert model URL:', model.id, err)
        }

        return {
          ...model,
          file_url: workingUrl,
          bookmarked: bookmarkedIds.includes(model.id),
          starred: favoriteIds.includes(model.id),
        }
      }),
    )

    modelStore.setModels(enhancedModels)
  } catch (err) {
    console.error('Failed to load models:', err)
    modelStore.setModels([])
  } finally {
    isLoadingModels.value = false
  }
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
    console.error('Error viewing item:', err)
  }
}

// CHANGED: Added goToDocumentDetailsPage function
function goToDocumentDetailsPage(documentId) {
  router.push(`/documents/${documentId}`)
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

// Toggle favorites - documents section
const toggleFavoriteDocuments = async (document, itemType = 'document') => {
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
    const itemName = document.metadata?.title || document.file_name

    // Check if item already exists
    const { data: existing } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('item_id', document.id)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      // Remove from favorites
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', document.id)
        .eq('item_type', itemType)

      document.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: document.id,
        item_type: itemType,
      })

      document.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count
    const { data: metaCheck, error: metaError } = await supabase
      .from('documents_metadata')
      .select('id')
      .eq('id', document.id)
      .single()

    if (!metaError && metaCheck) {
      const { data: starData } = await supabase
        .from('documents_star_count')
        .select('star_count')
        .eq('item_id', document.id)
        .maybeSingle()

      if (starData && starData.star_count !== undefined) {
        documentsStore.updateStarCount(document.id, starData.star_count)
      } else {
        documentsStore.updateStarCount(document.id, 0)
      }
    } else {
      console.error('Document ID not found in documents_metadata:', metaError)
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

// // Navigation functions
// function goToCollectionDetailsPage(collectionId) {
//   router.push(`/collection/${collectionId}`)
// }

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
  position: relative;
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
  font-size: 25px;
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
  line-clamp: 2;
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

/* When starred */
.star-icon.starred {
  color: #efaf00;
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
  font-size: 1.5rem;
}

.dash-subtitle {
  font-size: 0.625rem;
  width: 70%;
}

.btn-explore,
.btn-document {
  font-size: 0.5rem;
}

.recently-viewed-item {
  padding: 0 0.375rem 1rem;
  margin-bottom: -0.75rem;
  min-height: 2.5rem;
}

/* When starred */
.recently-viewed-item.starred {
  color: #efaf00;
}

.circular-holder {
  width: 2rem;
  height: 2rem;
}

.circle-icon-center {
  font-size: 0.875rem;
}

.artifact-name {
  font-size: 0.625rem;
  line-height: 1.5;
  margin-top: 1.25rem;
}

.view-info {
  font-size: 0.5rem;
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
  min-height: 11.25rem;
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
  max-width: 12.5rem;
}

.title-font-2 {
  font-size: 0.875rem;
  margin-bottom: -0.75rem;
}

/* ========================
   TABLET (48rem / 768px+)
======================== */
@media (min-width: 48rem) {
  .dash-title {
    font-size: 1.625rem;
  }

  .dash-subtitle {
    font-size: 0.75rem;
    width: 90%;
  }

  .btn-explore,
  .btn-document {
    font-size: 0.8125rem;
  }

  .recently-viewed-item {
    padding: 0.5rem 1.2rem;
    min-height: 3.75rem;

  }

  .circular-holder {
    width: 2.25rem;
    height: 2.25rem;
  }

  .circle-icon-center {
    font-size: 1.25rem;
  }

  .artifact-name {
    font-size: 0.6875rem;
    line-height: 1.1;
    margin-top: 1.25rem;
  }

  .view-info {
    font-size: 0.5rem;
  }

  .title-font-2 {
    font-size: 0.875rem;
    margin-bottom: -0.25rem;
  }

  .my-card {
    min-height: 17.5rem;
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
    font-size: 1.75rem;
    width: auto;
  }

  .dash-subtitle {
    font-size: 0.75rem;
    width: auto;
  }

  .btn-explore,
  .btn-document {
    font-size: 0.8125rem;
  }

  .recently-viewed-item {
    padding: 0.95rem 1.5rem;
    min-height: 3.4375rem;
  }

  .circular-holder {
    width: 2.625rem;
    height: 2.625rem;
  }

  .circle-icon-center {
    font-size: 1.375rem;
  }

  .artifact-name {
    font-size: 0.8125rem;
    margin-top: 0;
  }

  .view-info {
    font-size: 0.625rem;
  }

  .view-icon,
  .star-icon {
    display: inline;
    font-size: 0.9375rem;
  }

  .action-icons {
    display: flex;
    gap: 0.15rem;
  }

  .item-details {
    margin: 0 0.4rem;
  }

  .title-font-2 {
    font-size: 1.125rem;
    margin-bottom: -0.15rem !important;
  }

  .my-card {
    min-height: 18.75rem;
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
    font-size: 2rem;
  }

  .dash-subtitle {
    font-size: 1rem;
  }

  .recently-viewed-item {
    padding: 0.4rem 1.75rem;
    min-height: 4.0625rem;
  }

  .circular-holder {
    width: 3.125rem;
    height: 3.125rem;
    margin-top: -0.6rem;
  }

  .circle-icon-center {
    font-size: 1.75rem;
  }

  .title-font-2 {
    font-size: 1.125rem;
    margin-bottom: 0.25rem !important;
  }

  .artifact-name {
    font-size: 0.875rem;
  }

  .view-info {
    font-size: 0.8125rem;
  }

  .view-icon,
  .star-icon {
    font-size: 1.10rem;
  }

  .action-icons {
    gap: 0.07rem;
    margin-top: -0.6rem;
  }

  .item-details {
    margin: 0.5rem 0.6rem;
  }

  .my-card {
    min-height: 20rem;
  }
  .trophies {
    max-width: 355px;
  }
}

/* ========================
   EXTRA LARGE (120rem / 1920px+)
======================== */
@media (min-width: 120rem) {
  .dash-title {
    font-size: 2.125rem;
  }

  .dash-subtitle {
    font-size: 1.125rem;
  }

  .title-font-2 {
    margin-bottom: 0.25rem !important;
  }

  .recently-viewed-item {
    padding: 0 1.75rem ;
    margin-bottom: -0.75rem;
  }

  .circular-holder {
    width: 3rem;
    height: 3em;
  }

  .circle-icon-center {
    font-size: 1.8rem;
  }

  .artifact-name {
    font-size: 1rem;
  }

  .view-info {
    font-size: 0.875rem;
  }

  .view-icon,
  .star-icon {
    font-size: 1.2rem;
  }

  .action-icons {
    gap: 0.4rem;
    margin-top: -0.6rem;
  }

  .item-details {
    margin: 1.25rem 0.8rem;
  }

  .my-card {
    min-height: 21.875rem;
  }

  .artifact-card-section {
    padding: 1rem;
  }
  .trophies {
    max-width: 355px;
  }
}

/* Document card styles matching documents page */
.docCard {
  width: 12rem;
  height: 18rem;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(128, 128, 128, 0.8);
  border-radius: 10px;
  background-color: white;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.docCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(128, 128, 128, 0.9);
}

.document-link {
  text-decoration: none;
  display: block;
}

.document {
  height: 16rem;
  width: 100%;
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

.fade-title-container {
  max-width: 12rem;
  overflow: hidden;
}

.fade-title {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
}

.fade-title:hover .tooltip-box {
  visibility: visible;
  opacity: 1;
}

.tooltip-box {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  white-space: normal;
  max-width: 200px;
  z-index: 1000;
  font-size: 0.75rem;
  transition:
    opacity 0.3s,
    visibility 0.3s;
  pointer-events: none;
}

.tooltip-box::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.85);
}

.artifact-card-section {
  min-height: 4.375rem;
}

.artifact-title {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.box-3-artifacts {
  min-height: 600px;
  padding-bottom: 3rem;
}
</style>
