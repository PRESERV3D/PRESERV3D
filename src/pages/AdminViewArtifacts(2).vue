<template>
  <q-page class="q-pa-md">

    <router-link to="/artifacts" class="back-button-top">
      <q-btn flat icon="arrow_back" label="Back to Artifacts" />
    </router-link>

    <div v-if="loading" class="loading-container">
      <q-spinner size="xl" />
    </div>

    <div v-else-if="model" class="artifact-detail-container">

      <!-- Artifact Name/Title at the top -->
      <h2 class="a-title q-mb-lg">{{ model.metadata.title }}</h2>

      <div class="main-content">

        <!-- Left Side: 3D Model Viewer Card -->
        <div class="artifact-card">
          <model-viewer
            :src="model.file_url"
            camera-controls
            loading="lazy"
            auto-rotate
            auto-rotate-delay="1500"
            rotation-per-second="10deg"
            shadow-intensity="1"
            class="large-artifacts"
          />
        </div>

        <!-- Right Side: Information Panel -->
        <div class="info-section">

          <!-- Category Tag and Action Icons -->
          <div class="top-actions q-mb-lg">
            <div class="categories-container">
              <!-- Show categories if they exist, otherwise show fallback -->
              <template v-if="model.metadata.categories && model.metadata.categories.length > 0">
                <q-chip
                  v-for="(category, i) in model.metadata.categories"
                  :key="i"
                  class="category-tag"
                >
                  {{ category }}
                </q-chip>
              </template>
              <template v-else>
                <!-- Fallback placeholder category as there are no data yet -->
                <q-chip
                  class="q-mr-sm q-mt-xs category-tag"
                >
                  Uncategorized
                </q-chip>
              </template>

              <!-- Action buttons -->
              <div class="action-buttons">
                <q-btn
                  flat
                  label="Edit"
                  color="primary"
                  class="btn-save q-mr-sm"
                  @click="editArtifact"
                />
                <q-btn
                  flat
                  label="Delete"
                  color="negative"
                  class="btn-save"
                  @click="deleteArtifact"
                />
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="summary-section q-mb-md">
            <h6 class="a-info-title q-mb-sm q-mt-sm">Summary</h6>
            <p class="a-info-text">{{ model.metadata.summary }}</p>
          </div>

          <!-- Two-Column Section -->
          <div class="two-column-details q-mb-lg">
            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Author</div>
                <div class="a-info-subtitle">{{ model.metadata.author || '[Author Name]' }}</div>
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Date</div>
                <div class="a-info-subtitle">{{ model.metadata.date || '[Date]' }}</div>
              </div>
            </div>

            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Uploaded At</div>
                <div class="a-info-subtitle">{{ formatDate(model.uploaded_at) }}</div>
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Updated At</div>
                <div class="a-info-subtitle">{{ formatDate(model.updated_at) }}</div>
              </div>
            </div>

            <!-- Single Column Section -->
            <div class="detail-item q-mb-md">
              <div class="a-info-title2">Data Source</div>
              <div class="a-info-subtitle">Artifacts Metadata</div>
            </div>

            <!-- User Info with side-by-side layout -->
            <div class="side-by-side-details q-mb-lg">
              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Donated/Loaned By:</div>
                </div>
                <div class="detail-value">
                  <div class="a-info-subtitle">{{ model.donated_by || '[Donor/Lender Name]' }}</div>
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Date Received:</div>
                </div>
                <div class="detail-value">
                  <div class="a-info-subtitle">{{ formatDate(model.date_received || model.uploaded_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <q-banner type="negative">Artifact not found.</q-banner>
    </div>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="deleteDialogOpen">
      <q-card class="add-to-collections">
        <q-card-section class="collection-header">
          <div class="sub-font-3" style="font-size: 18px; font-weight: 800">
            Confirm Delete
          </div>
        </q-card-section>
        <q-card-section class="sub-font-3" style="font-weight: 400">
          Are you sure you want to delete "{{ model?.metadata?.title }}"? This action cannot be undone.
        </q-card-section>
        <q-card-actions class="collection-footer" align="center">
          <q-btn label="Delete" color="negative" @click="confirmDelete" />
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Collection Dialog -->
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
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useModelStore } from 'stores/modelStore'
// import { useUserStore } from 'stores/user'
import '@google/model-viewer'

const route = useRoute()
const router = useRouter()
const modelStore = useModelStore()
// const userStore = useUserStore()

const model = ref(null)
const loading = ref(true)

// Delete dialog state
const deleteDialogOpen = ref(false)

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

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

// Action button methods
const editArtifact = () => {
  router.push(`/admin-view-artifact/${model.value.id}`)
}

const deleteArtifact = () => {
  deleteDialogOpen.value = true
}

const confirmDelete = async () => {
  try {
    const { error } = await supabase
      .from('artifacts_metadata')
      .delete()
      .eq('id', model.value.id)

    if (error) {
      console.error('Delete error:', error)
      showNotifyDialog('Error', 'Failed to delete artifact.')
      return
    }

    // Remove from store if it exists there
    const storeIndex = modelStore.models.findIndex(m => m.id === model.value.id)
    if (storeIndex !== -1) {
      modelStore.models.splice(storeIndex, 1)
    }

    showNotifyDialog('Success', 'Artifact deleted successfully.')
    deleteDialogOpen.value = false

    // Navigate back to artifacts list after successful deletion
    setTimeout(() => {
      router.push('/artifacts')
    }, 1500)
  } catch (err) {
    console.error('Unexpected error during deletion:', err)
    showNotifyDialog('Error', 'An unexpected error occurred.')
  }
}

const toggleBookmark = async (modelId) => {
  if (!model.value) return

  // Toggle bookmark state
  model.value.bookmarked = !model.value.bookmarked

  // Update in store if model exists there
  const storeModel = modelStore.models.find(m => m.id === modelId)
  if (storeModel) {
    storeModel.bookmarked = model.value.bookmarked
  }

  // If bookmarked, open collection dialog
  if (model.value.bookmarked) {
    openBookmarkDialog(model.value, 'artifact')
  }
}

// const toggleStar = (modelId) => {
//   if (!model.value) return
//
//   // Toggle star state
//   model.value.starred = !model.value.starred
//
//   // Update in store if model exists there
//   const storeModel = modelStore.models.find(m => m.id === modelId)
//   if (storeModel) {
//     storeModel.starred = model.value.starred
//   }
// }

// Collection dialog methods
const openBookmarkDialog = async (modelItem, type = 'artifact') => {
  selectedModel.value = modelItem
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  // Check existing collections for this item
  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', modelItem.id)
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
    userCollections.value = data
  } else {
    console.error('Failed to load collections:', error)
  }
}

const saveToSelectedCollections = async () => {
  const modelItem = selectedModel.value

  if (!modelItem) return

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
        item_id: modelItem.id,
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
        .eq('item_id', modelItem.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
    }

    const itemName = modelItem.metadata?.title || modelItem.file_name
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

const resetForm = () => {
  selectedCollections.value = []
  existingCollectionIds.value = []
}

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('artifacts_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Artifact not found from Supabase:', error)
    // Fallback to modelStore if Supabase fails
    model.value = modelStore.models.find((m) => m.id == route.params.id) || null
    console.log('Fallback Model from Store:', model.value)
  } else {
    // Add some default values for compatibility
    model.value = {
      ...data,
      bookmarked: false,
      starred: false,
    }
  }

  loading.value = false
})
</script>
