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
                    <img :src="collection.cover_url" :alt="collection.collection_name" class="book-background-image" />
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
          <q-btn
            @click="goBack"
            label="Back"
            class="action-btn back-btn"
            no-caps
            unelevated
          />
          <div class="right-actions">
            <q-btn
              @click="openEditDialog"
              label="Edit"
              class="action-btn edit-btn"
              no-caps
              unelevated
            />
            <q-btn
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
              <div v-for="artifact in displayedArtifacts" :key="artifact.id" class="artifact-card-wrapper">
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
                    <div class="title-row">
                      <router-link
                        :to="{ name: 'view-artifact', params: { id: artifact.id } }"
                        class="artifact-title-link"
                        @click="logClick(artifact.id, 'artifact')"
                      >
                        <div class="text-subtitle2 artifact-title">{{ artifact.metadata?.title || artifact.file_name }}</div>
                      </router-link>
                      <div class="action-icons">
                        <q-icon
                          :name="artifact.bookmarked ? 'bookmark' : 'bookmark_border'"
                          class="action-icon bookmark-icon"
                          :class="{ 'bookmarked': artifact.bookmarked }"
                          size="18px"
                          @click.stop="toggleBookmark(artifact.id, 'artifact')"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
            <p v-if="!artifacts.length" class="text-grey">No artifacts in this collection.</p>
          </div>

          <!-- Documents Section with Previews -->
          <div class="documents-subsection" style="margin-top: 2rem;">
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
              <div v-for="document in displayedDocuments" :key="document.id" class="document-card-wrapper">
                <q-card class="my-card document-preview-card" rounded bordered>
                  <router-link
                    :to="{ name: 'view-document', params: { id: document.id } }"
                    class="document-link"
                    @click="logClick(document.id, 'document')"
                  >
                    <!-- Document Preview Image -->
                    <q-img
                      :src="document.preview_url"
                      :alt="document.metadata?.title || document.file_name || 'Document Preview'"
                      class="document-preview-image"
                      :style="{ width: '100%', height: '200px' }"
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
                  </router-link>
                  <q-card-section class="q-pa-sm document-card-section">
                    <div class="title-row">
                      <router-link
                        :to="{ name: 'view-document', params: { id: document.id } }"
                        class="artifact-title-link"
                        @click="logClick(document.id, 'document')"
                      >
                        <div class="text-subtitle2 artifact-title q-mr-sm">
                          {{ document.metadata?.title || document.file_name || 'Untitled Document' }}
                        </div>
                      </router-link>
                      <div class="action-icons">
                        <q-icon
                          :name="document.bookmarked ? 'bookmark' : 'bookmark_border'"
                          class="action-icon bookmark-icon"
                          :class="{ 'bookmarked': document.bookmarked }"
                          size="18px"
                          @click.stop="toggleBookmark(document.id, 'document')"
                        />
                      </div>
                    </div>
                    <p class="document-author" style="margin-left: 1.25rem">{{ document.metadata?.author || 'Unknown Author' }}</p>
                  </q-card-section>
                </q-card>
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
                <q-img src="src/assets/img/write.png" alt="Upload" class="upload-icon" />
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
            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
              COLLECTION NAME
            </div>
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
          <q-img src="src/assets/img/conf-delete.png" alt="question icon" class="question-icon" />
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
          <q-img src="src/assets/img/conf-delete.png" alt="question icon" class="question-icon" />
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
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { uid } from 'quasar'
import '@google/model-viewer'

const route = useRoute()
const router = useRouter()

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

// Computed properties for display
const displayedArtifacts = computed(() => {
  return artifacts.value.slice(0, 2) // Show first 2 artifacts
})

const displayedDocuments = computed(() => {
  return documents.value.slice(0, 4) // Show first 4 documents
})

// Helper function to show message dialogs
function showMessageDialog(title, content) {
  messageDialogTitle.value = title
  messageDialogContent.value = content
  messageDialogOpen.value = true
}

// Helper function to show notify dialogs
// function showNotifyDialog(title, message) {
//   notifyDialogTitle.value = title
//   notifyDialogMessage.value = message
//   notifyDialogOpen.value = true
// }

// Mount lifecycle - fetch data
onMounted(async () => {
  await fetchCollectionInfo()
  await fetchCollectionItems()
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

    documents.value = (docs || []).map((doc) => ({ ...doc, bookmarked: true, starred: false }))
  }

  if (artIds.length) {
    const { data: arts } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata')
      .in('id', artIds)

    artifacts.value = (arts || []).map((art) => ({ ...art, bookmarked: true, starred: false }))
  }
}

// Log user clicks for analytics
async function logClick(itemId, itemType) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error logging click:', authError)
    return
  }

  try {
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: userId,
      item_id: itemId,
      item_type: itemType,
      clicked_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error logging click:', error)
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
  const filePath = `collection-covers/${uid()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('collection-covers')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error(uploadError)
    showMessageDialog('Upload Failed', 'Cover image upload failed.')
    return
  }

  const { data: publicData } = supabase.storage.from('collection-covers').getPublicUrl(filePath)
  editData.value.cover_url = publicData.publicUrl
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
  showMessageDialog(
    'Removed',
    `${type.charAt(0).toUpperCase() + type.slice(1)} "${itemToRemove.value.name}" removed from collection.`,
  )
}

// Navigation methods
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
