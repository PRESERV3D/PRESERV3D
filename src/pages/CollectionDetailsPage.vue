<!--Collection Details Page-->
<template>
  <q-page class="q-pa-md">
    <div class="collection-container">
      <!-- Left Side - Collection Details -->
      <div class="collection-details-section">
        <!-- Collection Title -->
        <div class="collection-title-section">
          <h4 class="collection-name">{{ collection.collection_name }}</h4>
        </div>

        <!-- Collection Navigation -->
        <div class="collection-navigation">
          <!-- Collection Cover -->
          <div class="collection-cover-container">
            <div class="book-container">
              <div class="big-book-cover">
                <div class="big-book-spine"></div>
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
          </div>
        </div>

        <!-- Collection Description -->
        <div class="collection-description">
          <p>{{ collection.description }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <q-btn @click="goBack" label="Back" class="action-btn back-btn" no-caps unelevated />
          <div class="right-actions">
            <q-btn
              v-if="collection.collection_name !== 'Favorites'"
              @click="openEditDialog"
              label="Edit"
              class="action-btn edit-btn"
              no-caps
              unelevated
            />
            <q-btn
              v-if="collection.collection_name !== 'Favorites'"
              @click="confirmDelete"
              label="Delete"
              class="action-btn delete-btn"
              no-caps
              unelevated
            />
          </div>
        </div>
      </div>

      <!-- Right Side - Combined Content -->
      <div class="content-section">
        <!-- Combined Artifacts and Documents Section -->
        <div class="combined-content-section">
          <!-- Artifacts Section -->
          <div class="artifacts-subsection">
            <div class="section-header">
              <h5 class="section-title">Artifacts</h5>
              <q-btn
                icon="add_circle"
                label="Add New"
                class="add-new-btn"
                no-caps
                unelevated
                @click="goToAddArtifact"
              />
            </div>

            <div class="two-artifacts-grid">
              <div
                v-for="artifact in displayedArtifacts"
                :key="artifact.id"
                class="artifact-card-wrapper"
              >
                <q-card class="my-card artifact-preview-card" rounded bordered>
                  <div class="card">
                    <model-viewer
                      :src="artifact.file_url"
                      camera-controls
                      loading="lazy"
                      auto-rotate
                      auto-rotate-delay="1500"
                      rotation-per-second="10deg"
                      shadow-intensity="1"
                      class="artifacts"
                      style="width: 100%; height: 250px"
                    />
                  </div>
                  <q-card-section class="q-pa-sm artifact-card-section">
                    <div class="title-row q-mt-sm">
                      <router-link
                        :to="{ name: 'view-artifact', params: { id: artifact.id } }"
                        class="artifact-title-link"
                        @click="logClick(artifact.id, 'artifact', 'view_artifact')"
                      >
                        <div class="text-subtitle2 artifact-title">
                          {{ artifact.metadata?.title || artifact.file_name }}
                        </div>
                      </router-link>
                      <!-- ADDED: Action Icons with Counts -->
                      <div class="action-icons">
                        <!-- View Icon with Count -->
                        <div class="icon-with-count">
                          <q-icon name="visibility" color="grey" size="xs" class="action-icon" />
                          <span class="count-text">{{
                              modelStore.viewCounts[artifact.id] || 0
                            }}</span>
                        </div>
                        <!-- Star Icon with Count -->
                        <div class="icon-with-count">
                          <q-icon
                            :name="artifact.starred ? 'star' : 'star_border'"
                            class="action-icon star-icon"
                            :class="{ starred: artifact.starred }"
                            size="20px"
                            @click.stop="toggleFavorite(artifact.id, 'artifact')"
                          />
                          <span class="count-text">{{
                              modelStore.starCounts[artifact.id] || 0
                            }}</span>
                        </div>
                        <q-icon
                          v-if="collection.collection_name !== 'Favorites'"
                          :name="artifact.bookmarked ? 'bookmark' : 'bookmark_border'"
                          class="action-icon bookmark-icon"
                          :class="{ bookmarked: artifact.bookmarked }"
                          size="20px"
                          @click.stop="toggleBookmark(artifact.id, 'artifact')"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Artifacts Pagination -->
            <div v-if="totalArtifacts > artifactsPerPage" class="pagination-container">
              <div class="pagination-controls">
                <q-btn
                  flat
                  round
                  icon="chevron_left"
                  :disable="artifactsCurrentPage === 1"
                  @click="prevArtifactsPage"
                  class="pagination-btn"
                  size="sm"
                />
                <div class="pagination-info">
                  <span class="pagination-numbers">
                    <span
                      v-for="page in artifactsTotalPages"
                      :key="page"
                      @click="goToArtifactsPage(page)"
                      :class="['page-number', { active: page === artifactsCurrentPage }]"
                    >
                      {{ page }}
                    </span>
                  </span>
                </div>
                <q-btn
                  flat
                  round
                  icon="chevron_right"
                  :disable="artifactsCurrentPage === artifactsTotalPages"
                  @click="nextArtifactsPage"
                  class="pagination-btn"
                  size="sm"
                />
              </div>
            </div>

            <p v-if="!artifacts.length" class="text-grey">No artifacts in this collection.</p>
          </div>

          <!-- Documents Section with Previews -->
          <div class="documents-subsection" style="margin-top: 2rem">
            <div class="section-header">
              <h5 class="section-title">Documents</h5>
              <q-btn
                icon="add_circle"
                label="Add New"
                class="add-new-btn"
                no-caps
                unelevated
                @click="goToAddDocument"
              />
            </div>

            <div class="documents-grid">
              <div
                v-for="(document, index) in displayedDocuments"
                :key="document.id"
                class="document-card-wrapper"
                :class="{
                  'hide-on-tablet': index >= 3,
                  'hide-on-mobile': index >= 2
                }"
              >
                <q-card class="my-card document-preview-card" rounded bordered>
                  <router-link
                    :to="{ name: 'view-document', params: { id: document.id } }"
                    class="document-link"
                    @click="logClick(document.id, 'document', 'view_document')"
                  >
                    <!-- Document Preview Image -->
                    <div class="document-preview-container">
                      <q-img
                        :src="document.preview_url"
                        :alt="document.metadata?.title || document.file_name || 'Document Preview'"
                        class="document-preview-image"
                        loading="lazy"
                      >
                        <!-- Fallback if preview fails to load -->
                        <template v-slot:error>
                          <div class="document-preview-fallback">
                            <q-icon name="description" size="3rem" color="#560505" />
                            <div class="text-caption">Preview not available</div>
                          </div>
                        </template>
                      </q-img>
                    </div>
                  </router-link>
                  <q-card-section class="q-pa-sm document-card-section">
                    <div class="title-row">
                      <router-link
                        :to="{ name: 'view-document', params: { id: document.id } }"
                        class="document-title-link"
                        @click="logClick(document.id, 'document', 'view_document')"
                      >
                        <div class="text-subtitle2 document-title">
                          {{
                            document.metadata?.title || document.file_name || 'Untitled Document'
                          }}
                        </div>
                      </router-link>
                      <div class="action-icons">
                        <!-- View Icon with Count -->
                        <div class="icon-with-count">
                          <q-icon name="visibility" color="grey" size="xs" class="action-icon" />
                          <span class="count-text">{{
                              documentsStore.viewCounts[document.id] || 0
                            }}</span>
                        </div>
                        <!-- Star Icon with Count -->
                        <div class="icon-with-count">
                          <q-icon
                            :name="document.starred ? 'star' : 'star_border'"
                            :class="{ starred: document.starred }"
                            size="20px"
                            class="action-icon star-icon"
                            @click.stop="toggleFavorite(document.id, 'document')"
                          />
                          <span class="count-text">{{
                              documentsStore.starCounts[document.id] || 0
                            }}</span>
                        </div>
                        <q-icon
                          v-if="collection.collection_name !== 'Favorites'"
                          :name="document.bookmarked ? 'bookmark' : 'bookmark_border'"
                          class="action-icon bookmark-icon"
                          :class="{ bookmarked: document.bookmarked }"
                          size="20px"
                          @click.stop="toggleBookmark(document.id, 'document')"
                        />
                      </div>
                    </div>
                    <div class="document-author-container">
                      <p class="document-author">
                        {{ document.metadata?.author || 'Unknown Author' }}
                      </p>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Documents Pagination -->
            <div v-if="totalDocuments > documentsPerPage" class="pagination-container">
              <div class="pagination-controls">
                <q-btn
                  flat
                  round
                  icon="chevron_left"
                  :disable="documentsCurrentPage === 1"
                  @click="prevDocumentsPage"
                  class="pagination-btn"
                  size="sm"
                />
                <div class="pagination-info">
                  <span class="pagination-numbers">
                    <span
                      v-for="page in documentsTotalPages"
                      :key="page"
                      @click="goToDocumentsPage(page)"
                      :class="['page-number', { active: page === documentsCurrentPage }]"
                    >
                      {{ page }}
                    </span>
                  </span>
                </div>
                <q-btn
                  flat
                  round
                  icon="chevron_right"
                  :disable="documentsCurrentPage === documentsTotalPages"
                  @click="nextDocumentsPage"
                  class="pagination-btn"
                  size="sm"
                />
              </div>
            </div>

            <p v-if="!documents.length" class="text-grey">No documents in this collection.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Collection Dialog -->
    <q-dialog v-model="editDialogOpen" persistent>
      <q-card class="add-collection-card">
        <q-card-section class="row justify-center items-center">
          <div class="sub-font-3 text-center" style="font-size: 16px; font-weight: 700">
            Edit Collection
          </div>
        </q-card-section>

        <q-card-section class="row q-gutter-md" style="gap: 0.5rem">
          <div class="col-auto q-ml-md">
            <div class="upload-box" @click="triggerEditFileInput">
              <img
                v-if="editData.cover_url"
                :src="editData.cover_url"
                alt="Preview"
                class="preview-image"
              />
              <div v-else class="upload">
                <q-img src="/img/write.png" alt="Upload" class="upload-icon" />
                <div>Upload New Photo</div>
              </div>
              <input
                type="file"
                ref="editFileInput"
                accept="image/*"
                @change="handleEditImageUpload"
                style="display: none"
              />
            </div>
          </div>

          <div class="col-5 q-ml-lg">
            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">COLLECTION NAME</div>
            <q-input
              v-model="editData.collection_name"
              class="field-collection q-mb-md"
              label="Enter Collection Name"
              dense
              outlined
            />

            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
              SHORT DESCRIPTION
            </div>
            <q-input
              v-model="editData.description"
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
            @click="cancelEditCollection"
          />
          <q-btn label="Save" class="q-mr-sm btn-save" @click="updateCollection" no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirm Dialog -->
    <q-dialog v-model="confirmDeleteOpen" persistent>
      <q-card class="confirmation-delete">
        <q-card-section class="column items-center">
          <q-img src="/img/conf-delete.png" alt="question icon" class="question-icon" />
          <div class="q-mt-md sub-font" style="color: #000000">
            Are you sure you want to delete the collection "{{ collection.collection_name }}"?
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Yes" class="btn-save" flat @click="deleteCollection" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Message Dialog -->
    <q-dialog v-model="messageDialogOpen">
      <q-card class="delete-notice">
        <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
            messageDialogTitle
          }}</q-card-section>
        <q-card-section class="sub-font-3" style="font-weight: 400">{{
            messageDialogContent
          }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" class="btn-save" @click="handleMessageDialogClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirm Remove Item Dialog -->
    <q-dialog v-model="confirmRemoveOpen" persistent>
      <q-card class="confirmation-delete">
        <q-card-section class="column items-center">
          <q-img src="/img/conf-delete.png" alt="question icon" class="question-icon" />
          <div class="q-mt-md sub-font" style="color: #000000; text-align: center">
            Are you sure you want to remove "{{ itemToRemove.name }}" from the collection?
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Yes" class="btn-save" flat @click="removeItem" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Notify Dialog -->
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
import { ref, computed, onMounted } from 'vue'
import { useModelStore } from 'stores/modelStore'
import { useDocumentsStore } from 'stores/documentsStore'
import { useUserStore } from 'stores/user'
import { uploadFileToR2 } from 'boot/r2'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { uid } from 'quasar'
import '@google/model-viewer'

// const isFavorites = computed(() => collection.value.collection_name === 'Favorites')

const route = useRoute()
const router = useRouter()
const modelStore = useModelStore()
const documentsStore = useDocumentsStore()
const userStore = useUserStore()

const userType = computed(() => userStore.profile?.user_type || 'Unknown')

// Get collection ID from route params
const collectionId = route.params.id

// Data refs
const collection = ref({})
const documents = ref([])
const artifacts = ref([])

// Dialog states
const editDialogOpen = ref(false)
const confirmDeleteOpen = ref(false)
const messageDialogOpen = ref(false)
const messageDialogTitle = ref('')
const messageDialogContent = ref('')

// Notify dialog states
const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

// Confirm remove dialog states
const confirmRemoveOpen = ref(false)
const itemToRemove = ref({
  id: null,
  type: '',
  name: '',
})

// Edit dialog data
const editData = ref({
  collection_name: '',
  description: '',
  cover_url: '',
})
const editFileInput = ref(null)

// PAGINATION FOR ADDED ARTIFACTS/COLLECTIONS
const artifactsCurrentPage = ref(1)
const documentsCurrentPage = ref(1)
const artifactsPerPage = ref(2)
const documentsPerPage = ref(4)
const displayedArtifacts = computed(() => {
  const start = (artifactsCurrentPage.value - 1) * artifactsPerPage.value
  return artifacts.value.slice(start, start + artifactsPerPage.value)
})

const displayedDocuments = computed(() => {
  const start = (documentsCurrentPage.value - 1) * documentsPerPage.value
  return documents.value.slice(start, start + documentsPerPage.value)
})

const totalArtifacts = computed(() => {
  return artifacts.value.length
})

const totalDocuments = computed(() => {
  return documents.value.length
})

const artifactsTotalPages = computed(() => {
  return Math.ceil(totalArtifacts.value / artifactsPerPage.value)
})

const documentsTotalPages = computed(() => {
  return Math.ceil(totalDocuments.value / documentsPerPage.value)
})

function nextArtifactsPage() {
  if (artifactsCurrentPage.value < artifactsTotalPages.value) {
    artifactsCurrentPage.value++
  }
}

function prevArtifactsPage() {
  if (artifactsCurrentPage.value > 1) {
    artifactsCurrentPage.value--
  }
}

function goToArtifactsPage(page) {
  artifactsCurrentPage.value = page
}

function nextDocumentsPage() {
  if (documentsCurrentPage.value < documentsTotalPages.value) {
    documentsCurrentPage.value++
  }
}

function prevDocumentsPage() {
  if (documentsCurrentPage.value > 1) {
    documentsCurrentPage.value--
  }
}

function goToDocumentsPage(page) {
  documentsCurrentPage.value = page
}

// Helper function to show message dialogs
function showMessageDialog(title, content) {
  messageDialogTitle.value = title
  messageDialogContent.value = content
  messageDialogOpen.value = true
}

// Helper function to show notification dialogs
const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

// Mount lifecycle - fetch data
onMounted(async () => {
  await fetchCollectionInfo()
  await fetchCollectionItems()
  await modelStore.fetchViewCounts()
  await modelStore.fetchStarCounts()
  await documentsStore.fetchViewCounts()
  await documentsStore.fetchStarCounts()
})

// Fetch collection information
async function fetchCollectionInfo() {
  const { data, error } = await supabase
    .from('collections')
    .select('collection_name, description, cover_url')
    .eq('collection_id', collectionId)
    .single()

  if (error) {
    console.error('Failed to load collection info:', error)
  } else {
    collection.value = data
  }
}

// Fetch collection items (documents and artifacts) - Updated to include preview_url
async function fetchCollectionItems() {
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  // Fetch Favorites collection
  let favoriteIds = []
  const { data: favoritesCollection } = await supabase
    .from('collections')
    .select('collection_id')
    .eq('user_id', userId)
    .eq('collection_name', 'Favorites')
    .maybeSingle()

  if (favoritesCollection) {
    const { data: favItems } = await supabase
      .from('collection_items')
      .select('item_id, item_type')
      .eq('collection_id', favoritesCollection.collection_id)

    favoriteIds = favItems.map((i) => i.item_id)
  }

  const { data: items, error } = await supabase
    .from('collection_items')
    .select('item_id, item_type')
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Failed to load collection items:', error)
    return
  }

  const docIds = items.filter((i) => i.item_type === 'document').map((i) => i.item_id)
  const artIds = items.filter((i) => i.item_type === 'artifact').map((i) => i.item_id)

  if (docIds.length) {
    const { data: docs } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, preview_url, metadata')
      .in('id', docIds)

    documents.value = (docs || []).map((doc) => ({
      ...doc,
      bookmarked: true,
      starred: favoriteIds.includes(doc.id),
    }))
  }

  if (artIds.length) {
    const { data: arts } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata')
      .in('id', artIds)

    artifacts.value = (arts || []).map((art) => ({
      ...art,
      bookmarked: true,
      starred: favoriteIds.includes(art.id),
    }))
  }
}



// Log user activity
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

// Edit dialog methods
const triggerEditFileInput = () => {
  editFileInput.value.click()
}

const handleEditImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !file.type.startsWith('image/')) return

  const fileExt = file.name.split('.').pop()
  const fileName = `${uid()}.${fileExt}`

  // Upload to R2
  const { error, publicUrl } = await uploadFileToR2(file, 'collection-covers', fileName)

  if (error) {
    console.error(error)
    showMessageDialog('Upload Failed', 'Cover image upload failed.')
    return
  }

  // Update the edit data with the new cover image URL
  editData.value.cover_url = publicUrl
  console.log('Filename: ', fileName)
  console.log('Cover image uploaded:', publicUrl)
}

const openEditDialog = () => {
  editData.value = { ...collection.value }
  editDialogOpen.value = true
}

const cancelEditCollection = () => {
  editData.value = {
    collection_name: '',
    description: '',
    cover_url: '',
  }
  editDialogOpen.value = false
}

// Update collection
async function updateCollection() {
  const { error } = await supabase
    .from('collections')
    .update({
      collection_name: editData.value.collection_name,
      description: editData.value.description,
      cover_url: editData.value.cover_url,
      updated_at: new Date(),
    })
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Update failed:', error)
    showMessageDialog('Update Failed', 'Failed to update collection.')
  } else {
    showMessageDialog('Success', 'Collection updated.')
    await fetchCollectionInfo()
    editDialogOpen.value = false
  }
}

// Delete collection
function confirmDelete() {
  confirmDeleteOpen.value = true
}

async function deleteCollection() {
  const { error: itemsError } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)

  if (itemsError) {
    console.error('Failed to delete related items:', itemsError)
    showMessageDialog('Delete Failed', 'Failed to remove related collection items.')
    return
  }

  const { error: collectionError } = await supabase
    .from('collections')
    .delete()
    .eq('collection_id', collectionId)

  if (collectionError) {
    console.error('Delete failed:', collectionError)
    showMessageDialog('Delete Failed', 'Failed to delete collection.')
  } else {
    confirmDeleteOpen.value = false
    showMessageDialog('Deleted', 'Collection deleted.')
    router.push({ name: 'collections' })
  }
}

// Remove from collection (function for actual removal)
// async function removeFromCollection(itemId, itemType) {
//   const { error } = await supabase
//     .from('collection_items')
//     .delete()
//     .match({ collection_id: collectionId, item_id: itemId, item_type: itemType })
//
//   if (error) {
//     console.error('Remove failed:', error)
//     showMessageDialog('Delete Failed', `Failed to remove ${itemType} from collection.`)
//     return
//   }
//
//   // Immediately remove item from display
//   if (itemType === 'document') {
//     documents.value = documents.value.filter((doc) => doc.id !== itemId)
//   } else if (itemType === 'artifact') {
//     artifacts.value = artifacts.value.filter((art) => art.id !== itemId)
//   }
//
//   showMessageDialog(
//     'Removed',
//     `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} removed from collection.`,
//   )
// }

// Toggle bookmark - unified approach with confirmation dialog
const toggleBookmark = (itemId, itemType) => {
  const list = itemType === 'document' ? documents.value : artifacts.value
  const item = list.find((el) => el.id === itemId)

  if (item && item.bookmarked) {
    // Show confirmation dialog for removal
    itemToRemove.value = {
      id: itemId,
      type: itemType,
      name: item?.metadata?.title || item?.file_name || 'Untitled',
    }
    confirmRemoveOpen.value = true
  } else {
    // Just toggle the UI state (shouldn't happen in collection view)
    if (item) {
      item.bookmarked = !item.bookmarked
    }
  }
}

// Remove item after confirmation
async function removeItem() {
  const { id, type } = itemToRemove.value

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .match({ collection_id: collectionId, item_id: id, item_type: type })

  if (error) {
    console.error('Remove failed:', error)
    showMessageDialog('Delete Failed', `Failed to remove ${type} from collection.`)
    return
  }

  // Remove from display
  if (type === 'document') {
    documents.value = documents.value.filter((doc) => doc.id !== id)
  } else {
    artifacts.value = artifacts.value.filter((art) => art.id !== id)
  }

  confirmRemoveOpen.value = false
  showNotifyDialog('Notice', `"${itemToRemove.value.name}" was removed from the collection.`)

  await fetchCollectionItems()
}

// Toggle favorite icon
const toggleFavorite = async (itemId, itemType) => {
  const model =
    itemType === 'artifact'
      ? artifacts.value.find((a) => a.id === itemId)
      : documents.value.find((d) => d.id === itemId)
  if (!itemType) {
    throw new Error('itemType is required for toggleBookmark')
  }

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
      .eq('item_id', itemId)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      // Remove from favorites
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)

      model.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)

      // Remove from displayed list if unstarred
      if (collection.value?.collection_name === 'Favorites') {
        if (itemType === 'document') {
          documents.value = documents.value.filter((doc) => doc.id !== itemId)
        } else {
          artifacts.value = artifacts.value.filter((art) => art.id !== itemId)
        }
      }
    } else {
      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: itemId,
        item_type: itemType,
      })

      model.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count
    if (itemType === 'artifact') {
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
      }
    } else if (itemType === 'document') {
      const { data: metaCheck, error: metaError } = await supabase
        .from('documents_metadata')
        .select('id')
        .eq('id', Document.id)
        .single()

      if (!metaError && metaCheck) {
        const { data: starData, error: starError } = await supabase
          .from('documents_star_count')
          .select('star_count')
          .eq('item_id', document.id)
          .single()

        if (!starError && starData) {
          documentsStore.updateStarCount(document.id, starData.star_count)
        } else {
          console.error('Error fetching updated star count:', starError)
        }
      } else {
        console.error('Item not found in the metadata database:', metaError)
      }
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

const goBack = () => {
  router.go(-1)
}

async function handleMessageDialogClose() {
  messageDialogOpen.value = false

  if (messageDialogTitle.value === 'Deleted' || messageDialogTitle.value === 'Removed') {
    if (!documents.value.length && !artifacts.value.length && !collection.value.collection_name) {
      router.push({ name: 'collections' })
    } else {
      await fetchCollectionItems()
    }
  }
}

function goToAddDocument() {
  router.push({ name: 'documents', query: { addToCollection: collectionId } })
}

function goToAddArtifact() {
  router.push({ name: 'artifacts', query: { addToCollection: collectionId } })
}
</script>

<style scoped>
/* Left Side - Collection Details */
.collection-details-section {
  flex: 1;
  max-width: 400px;
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.collection-title-section {
  margin-top: 1rem;
  margin-bottom: 3rem;
}

.collection-name {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: #000000;
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.3;
  text-align: left;
}

.collection-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  width: 100%;
  margin-bottom: 2rem;
}

.collection-cover-container {
  flex-shrink: 0;
}

.big-book-cover {
  width: 270px;
  height: 400px;
  position: relative;
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  border-radius: 0 15px 15px 0;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(8, 3, 0, 0.3);
  transform: rotateY(-5deg) rotateX(2deg);
  transition: all 0.3s ease;
}

.big-book-spine {
  position: absolute;
  left: -6px;
  top: 0;
  bottom: 0;
  width: 12px;
  background: linear-gradient(to right, #523518 0%, #381c08 100%);
  border-radius: 0 0 0 12px;
  box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.3);
}

/* Collection Description */
.collection-description {
  font-family: 'Poppins', sans-serif;
  color: #666;
  line-height: 1.6;
  font-size: 16px;
  margin-bottom: 5rem;
  margin-top: 2rem;
  text-align: left;
}

.collection-description p {
  margin: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.right-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.2s ease;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  font-size: 14px;
  min-width: 70px;
  border: 1px solid;
  background: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.back-btn,
.edit-btn,
.delete-btn {
  border: 1px solid #560505;
  border-radius: 0.5rem;
  background: transparent;
  color: #560505;
}

.back-btn:hover,
.edit-btn:hover,
.delete-btn:hover {
  background: #560505;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(86, 5, 5, 0.2);
}

.content-section {
  flex: 2;
  display: flex;
  flex-direction: column;
}

.combined-content-section {
  background: linear-gradient(10deg, #fbf4d0 0%, #fdf9e7 22%, #ffffff 65%);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.artifacts-subsection {
  margin-bottom: 2rem;
}

.documents-subsection {
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: #560505;
  margin: 0;
  font-size: 1.1rem;
}

/* Artifacts Grid */
.two-artifacts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.artifact-preview-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.artifact-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.artifact-card-section {
  min-height: 4.375rem;
}

.artifact-title {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: fit-content;
}

.icon-with-count {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex-shrink: 0;
  min-width: fit-content;
}

.count-text {
  font-size: 0.7rem;
  color: #666;
  white-space: nowrap;
  min-width: 1rem;
  text-align: center;
}

/* Documents Grid - Now Responsive */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  align-items: start;
}

.document-card-wrapper {
  min-width: 0;
  width: 100%;
}

.document-preview-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.document-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.document-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.document-preview-container {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
}

.document-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.document-preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #560505;
}

.document-card-section {
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 5rem;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  flex: 1;
  gap: 0.5rem;
}

.document-title-link {
  text-decoration: none;
  color: inherit;
  flex: 1;
  margin-right: 0.25rem;
  min-width: 0;
}

.document-title {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
  font-weight: 500;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.document-author-container {
  margin-top: auto;
}

.document-author {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Action Icons Styling - Fixed positioning */
.action-icon {
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.star-icon.starred {
  color: #ffc107;
}

.bookmark-icon.bookmarked {
  color: #560505;
}

/* Additional responsive fixes for action icons */
@media (max-width: 768px) {
  .action-icons {
    gap: 0.125rem;
  }

  .icon-with-count {
    gap: 0.1rem;
  }

  .count-text {
    font-size: 0.65rem;
    min-width: 0.8rem;
  }

  .action-icon {
    font-size: 16px !important;
  }
}

@media (max-width: 480px) {
  .count-text {
    font-size: 0.6rem;
    min-width: 0.7rem;
  }

  .action-icon {
    font-size: 14px !important;
  }
}

/* Pagination Styles */
.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  width: 100%;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 8px;
  padding: 0.5rem 1rem;
}

.pagination-btn {
  color: #560505;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not([disabled]) {
  background-color: #560505;
  color: white;
}

.pagination-btn[disabled] {
  color: #ccc;
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  align-items: center;
}

.pagination-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #666;
  font-size: 0.9rem;
  min-width: 32px;
  text-align: center;
}

.page-number:hover {
  background-color: #f5f5f5;
  color: #560505;
}

.page-number.active {
  background-color: #efefef66;
  color: black;
  font-weight: 600;
}

/* ========================
 RESPONSIVE DESIGN
======================== */

/* Hide documents based on screen size */
/* Tablet view - hide 4th document (index 3+) */
@media (max-width: 1024px) and (min-width: 769px) {
  .documents-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .hide-on-tablet {
    display: none;
  }
}

/* Mobile view - hide 3rd and 4th documents */
@media (max-width: 768px) {
  .documents-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .hide-on-mobile {
    display: none;
  }

  .two-artifacts-grid {
    grid-template-columns: 1fr;
  }

  .combined-content-section {
    padding: 1rem;
  }

  .collection-details-section {
    gap: 1rem;
  }

  .book-container {
    height: 250px;
  }

  .big-book-cover {
    width: 160px;
    height: 220px;
  }

  .document-preview-container {
    height: 160px;
  }

  .document-card-section {
    padding: 0.5rem;
    min-height: 4rem;
  }

  .document-title {
    font-size: 0.85rem;
  }

  .document-author {
    font-size: 0.75rem;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }

  .document-preview-container {
    height: 140px;
  }

  .collection-container {
    flex-direction: column;
  }

  .collection-details-section {
    max-width: none;
  }
}

/* General responsive adjustments for larger screens */
@media (max-width: 1200px) {
  .collection-container {
    flex-direction: column;
  }

  .collection-details-section {
    max-width: none;
  }
}

/* Collection Image Styles - Seamless integration with book design */
.book-content.has-image {
  background: none !important;
  padding: 0 !important;
}

.book-image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0 20px 20px 0;
  overflow: hidden;
  z-index: 1;
}

.book-image-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    transparent 100%
  );
  z-index: 2;
  border-top-left-radius: inherit;
  border-bottom-left-radius: inherit;
}

.book-background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.book-content:not(.has-image) {
  /* Keep original gradient and styling */
}

.upload-box {
  width: 11rem;
  height: 14.5rem;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.big-book-cover .book-content {
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  border-radius: 0 20px 20px 0;
}

.big-book-cover .book-content.has-image {
  background: none;
  border-radius: 0 20px 20px 0;
}

.big-book-cover .book-background-image {
  border-radius: 8px;
}
</style>
