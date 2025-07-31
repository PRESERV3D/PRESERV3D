<!--View Artifact Page-->
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

          <!-- Control Buttons -->
          <div class="control-buttons">
            <button class="control-btn" title="Help">
              <img src="../../public/icons/help.png" alt="Help" class="control-icon" style="width: 19.5px; height: 19.5px;" />
            </button>
            <button class="control-btn" title="Reset View">
              <img src="../../public/icons/reset.png" alt="Reset View" class="control-icon" style="width: 20px; height: 20px;"/>
            </button>
            <button class="control-btn" title="Zoom">
              <img src="../../public/icons/zoom-in.png" alt="Zoom" class="control-icon" style="width: 16px; height: 16px;"/>
            </button>
          </div>
        </div>

        <!-- Right Side: Information Panel -->
        <div class="info-section">
          <!-- Category Tag and Action Icons -->
          <div class="top-actions q-mb-lg">
            <div class="categories-container">
              <!-- Show categories if they exist, otherwise show fallback -->
              <div class="categories-section">
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
                  <q-chip class="q-mr-sm q-mt-xs category-tag"> Uncategorized </q-chip>
                </template>
              </div>

              <!-- User Action icons (non-admin)-->
              <div v-if="!isAdmin" class="action-icons-top">
                <!-- View Icon with Count -->
                <div class="icon-with-count">
                  <q-icon name="visibility" class="action-icon view-icon" size="26px" />
                  <span class="count-text">{{ modelStore.viewCounts[model.id] || 0 }}</span>
                </div>

                <!-- Star Icon with Count -->
                <div class="icon-with-count">
                  <q-icon
                    :name="model.starred ? 'star' : 'star_border'"
                    class="action-icon star-icon"
                    :class="{ starred: model.starred }"
                    size="26px"
                    @click.stop="toggleFavorite(model, 'artifact')"
                  />
                  <span class="count-text">{{ modelStore.starCounts[model.id] || 0 }}</span>
                </div>

                <!-- Bookmark Icon -->
                <div class="icon-with-count">
                  <q-icon
                    :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                    class="action-icon bookmark-icon"
                    :class="{ bookmarked: model.bookmarked }"
                    size="24px"
                    @click.stop="toggleBookmark(model, 'artifact')"
                  />
                </div>
              </div>

              <!-- Admin Action buttons -->
              <div v-if="isAdmin" class="action-buttons">
                <q-btn
                  flat
                  label="Edit"
                  class="text-button q-mr-sm"
                  @click="editArtifact"
                  no-caps
                />
                <q-btn flat label="Delete" class="text-button" @click="showDialog = true" no-caps />
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
                  <div class="a-info-subtitle">
                    {{ formatDate(model.date_received || model.uploaded_at) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Back Button -->
            <div class="func-button">
              <router-link to="/artifacts">
                <q-btn flat label="Back" class="func-btn" no-caps />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <q-banner type="negative">Artifact not found.</q-banner>
    </div>

    <!-- Confirmation Dialog      -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="confirmation-delete">
        <q-card-section class="column items-center">
          <q-img src="/img/conf-delete.png" alt="question icon" class="question-icon" />
          <div class="q-mt-md sub-font" style="color: #000000">
            Are you sure you want to delete this?
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Yes" class="btn-save" flat @click="handleDelete" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
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
          <q-btn flat label="Cancel" v-close-popup />
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
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useModelStore } from 'stores/modelStore'
import { useUserStore } from 'stores/user'
import '@google/model-viewer'

const route = useRoute()
const router = useRouter()
const modelStore = useModelStore()
const userStore = useUserStore()

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')

const model = ref(null)
const loading = ref(true)

const dialogOpen = ref(false)
const selectedModel = ref(null)
const selectedItemType = ref('artifact')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')
const showDialog = ref(false)

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

// Action button methods
const editArtifact = () => {
  router.push(`/edit/artifacts/${model.value.id}`)
}

const toggleBookmark = async (modelId) => {
  if (!model.value) return

  // Toggle bookmark state
  model.value.bookmarked = !model.value.bookmarked

  // Update in store if model exists there
  const storeModel = modelStore.models.find((m) => m.id === modelId)
  if (storeModel) {
    storeModel.bookmarked = model.value.bookmarked
  }

  // If bookmarked, open collection dialog
  if (model.value.bookmarked) {
    openBookmarkDialog(model.value, 'artifact')
  }
}

// FIXED: Toggle favorite
const toggleFavorite = async (model, itemType = 'artifact') => {
  if (!model) return

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

    // FIXED: Star count
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
    // ADDED: Exclude "Favorites" from the list
    userCollections.value = data.filter((c) => c.collection_name !== 'Favorites')
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

  // ADDED: Check if the artifact is in user's Favorites collection
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (userId) {
    const { data: favoritesCollection } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (favoritesCollection) {
      const { data: favItems } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', 'artifact')
        .eq('item_id', route.params.id)

      if (favItems?.length > 0) {
        model.value.starred = true
      }
    }
  }

  await modelStore.fetchStarCounts()
  await modelStore.fetchViewCounts()
})
</script>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  margin-left: auto;
  color: #880000;
  font-family: 'Poppins', sans-serif !important;
  font-size: 16px !important;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.artifact-detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.a-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 64px;
  color: #560505;
  margin-top: 1rem;
  margin-left: 30rem;
}

.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.artifact-card {
  border-radius: 20px;
  background: radial-gradient(
    110.32% 94.3% at 50% 57.87%,
    #b69f9f 0%,
    #640c0c 51.92%,
    #121212 95.67%
  );
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  width: 706px;
  height: 630px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.large-artifacts {
  width: 680px !important;
  height: 600px !important;
  border-radius: 8px;
}

/* Control Buttons Styles */
.control-buttons {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.control-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background-color: #757575;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.control-btn:hover {
  background-color: #616161;
  transform: translateY(-1px);
  filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.3));
}

.control-btn:active {
  transform: translateY(0);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
}

.control-icon {
  color: #d7d7d7 !important;
  font-size: 16px !important;
  object-fit: contain;
  }

.info-section {
  flex: 1;
  max-width: 500px;
}

.top-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.a-info-title,
.a-info-title2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  color: black;
  margin-bottom: 0.5rem;
}

.a-info-title {
  font-size: 18px;
}

.a-info-title2 {
  font-size: 16px;
}

.a-info-subtitle,
.a-info-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
  line-height: 1.4;
}

.two-column-details,
.side-by-side-details {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.detail-item {
  margin-bottom: 1.5rem;
}

.category-tag {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(204, 172, 0, 0.8), rgba(204, 172, 0, 0.6));
  color: #560505;
  font-weight: 600;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(204, 172, 0, 0.3);
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.categories-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: -4px;
}

.categories-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

/* New styles for repositioned action icons */
.action-icons-top {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  margin-left: auto;
  padding-left: 1rem;
}

.action-icons-top .action-icon {
  cursor: pointer;
  transition: color 0.3s ease;
  color: #7c7c7c;
}

.action-icons-top .bookmark-icon {
  cursor: pointer;
  transition: color 0.3s ease;
  color: #7c7c7c;
}

.action-icons-top .bookmark-icon:hover,
.action-icons-top .action-icon:hover {
  background-color: rgba(136, 0, 0, 0.1);
  border-radius: 4px;
  padding: 2px;
}

.action-icons-top,
.action-icons-top .star-icon.starred {
  color: #ccac00;
}

.action-icons-top  {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}


.icon-with-count {
  display: flex;
  align-items: center;
  gap: 0.21rem;
  font-family: 'Poppins', sans-serif;

}

.action-icons-top .count-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  min-width: 20px;
  text-align: left;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
}

.detail-label {
  flex: 0 0 auto;
  min-width: 150px;
  text-align: left;
}

.detail-value {
  flex: 1;
  text-align: right;
}

/* Two-column details specific styles */
.two-column-details .detail-row {
  gap: 4rem;
  align-items: flex-start;
}

.two-column-details .detail-label,
.two-column-details .detail-value {
  flex: 1;
}

.two-column-details .detail-value .a-info-title2,
.two-column-details .detail-value .a-info-subtitle {
  text-align: left;
}

.func-button {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  margin-top: 2rem !important;
  padding-top: 1rem !important;
  border-top: 1px solid #eee !important;
  width: 100% !important;
  clear: both !important;
}

.func-button .func-btn {
  color: #fbf4d0 !important;
  background: #880000 !important;
  border-radius: 5px !important;
  transition: all 0.3s ease !important;
  font-family: 'Poppins', sans-serif !important;
  font-weight: 600 !important;
  width: 100px !important;
  min-height: auto !important;
  padding: 8px 16px !important;
  margin-left: auto !important;
}

.func-button .func-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

/* Ensure the router-link doesn't interfere */
.func-button a {
  text-decoration: none !important;
  display: inline-block !important;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    align-items: center;
  }

  .artifact-card {
    width: 100%;
    max-width: 400px;
    height: 400px;
  }

  .large-artifacts {
    width: 300px !important;
    height: 300px !important;
  }

  .control-buttons {
    bottom: 15px;
    right: 15px;
    gap: 6px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }

  .control-icon {
    font-size: 14px !important;
  }

  .back-button-top {
    top: 0.5rem;
    left: 0.5rem;
  }

  .top-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .categories-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-icons-top {
    margin-top: 1rem;
    margin-left: 0;
    padding-left: 0;
    justify-content: flex-start;
  }

  /* Admin back button mobile positioning */
  .func-button {
    justify-content: center !important;
    margin-top: 1rem !important;
  }

  .a-title {
    font-size: 32px !important;
    margin-left: 0 !important;
    text-align: center !important;
  }
}

@media (max-width: 480px) {
  .title-input :deep(.q-field__native) {
    font-size: 32px !important;
    padding: 12px 0 !important;
  }

  .title-section {
    margin-bottom: 1rem;
  }

  .func-button {
    padding: 0.5rem !important;
    margin-top: 1rem !important;
  }

  .action-icons-top {
    gap: 0.75rem;
  }

  .action-icons-top .count-text {
    font-size: 11px;
  }

  .control-buttons {
    bottom: 10px;
    right: 10px;
    gap: 4px;
  }

  .control-btn {
    width: 26px;
    height: 26px;
  }

  .control-icon {
    font-size: 12px !important;
  }
}

</style>
