<template>
  <q-page class="q-pa-md">
    <div class="collection-container">
      <!-- Left Side - Collection Details -->
      <div class="collection-details-section">
        <!-- Collection Title -->
        <div class="collection-title-section">
          <h4 class="collection-name">{{ currentCollection.name }}</h4>
        </div>

        <!-- Collection Navigation -->
        <div class="collection-navigation">
          <q-btn
            flat
            round
            icon="chevron_left"
            class="collection-nav-btn"
            @click="previousCollection"
            :disable="currentCollectionIndex === 0"
          />

          <!-- Collection Cover -->
          <div class="collection-cover-container">
            <div class="book-container">
              <div class="big-book-cover">
                <div class="big-book-spine"></div>
                <div class="book-content" :class="{ 'has-image': currentCollection.image }">
                  <!-- Show uploaded image as background if available -->
                  <div v-if="currentCollection.image" class="book-image-overlay">
                    <img :src="currentCollection.image" :alt="currentCollection.name" class="book-background-image" />
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

          <q-btn
            flat
            round
            icon="chevron_right"
            class="collection-nav-btn"
            @click="nextCollection"
            :disable="currentCollectionIndex === collections.length - 1"
          />
        </div>

        <!-- Collection Description -->
        <div class="collection-description">
          <p>{{ currentCollection.description }}</p>
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
              @click="deleteCollection"
              label="Delete"
              class="action-btn delete-btn"
              no-caps
              unevated
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
              <router-link to="/artifacts" class="add-new-link">
                <q-btn
                  icon="add_circle"
                  label="Add New"
                  class="add-new-btn"
                  no-caps
                  unelevated
                />
              </router-link>
            </div>

            <div class="two-artifacts-grid">
              <div v-for="artifact in displayedArtifacts" :key="artifact.id" class="artifact-card-wrapper">
                <q-card class="my-card artifact-preview-card" rounded bordered>
                  <div class="card">
                    <q-btn
                      flat
                      round
                      icon="info_outline"
                      class="info-icon-overlay"
                      size="md"
                      @click.stop="showArtifactInfo(artifact.id)"
                    />
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
                      >
                        <div class="text-subtitle2 artifact-title">{{ artifact.metadata?.title || artifact.file_name }}</div>
                      </router-link>
                      <div class="action-icons">
                        <q-icon
                          :name="artifact.bookmarked ? 'bookmark' : 'bookmark_border'"
                          class="action-icon bookmark-icon"
                          :class="{ 'bookmarked': artifact.bookmarked }"
                          size="18px"
                          @click.stop="toggleBookmark(artifact.id)"
                        />
                        <q-icon
                          :name="artifact.starred ? 'star' : 'star_border'"
                          class="action-icon star-icon"
                          :class="{ 'starred': artifact.starred }"
                          size="18px"
                          @click.stop="toggleStar(artifact.id)"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Documents Section -->
          <div class="documents-subsection" style="margin-top: 2rem;">
            <div class="section-header">
              <h5 class="section-title">Documents</h5>
              <router-link to="/documents" class="add-new-link">
                <q-btn
                  icon="add_circle"
                  label="Add New"
                  class="add-new-btn"
                  no-caps
                  unelevated
                />
              </router-link>
            </div>

            <div class="documents-grid">
              <div v-for="document in displayedDocuments" :key="document.id" class="document-card-wrapper">
                <q-card class="my-card document-preview-card" flat bordered>
                  <div class="document-preview">
                    <q-icon name="description" size="3rem" color="#560505" />
                  </div>
                  <q-card-section class="q-pa-sm document-card-section">
                    <div class="title-row">
                      <router-link
                        :to="{ name: 'view-document', params: { id: document.id } }"
                        class="document-title-link"
                      >
                        <div class="text-subtitle2 document-title">
                          {{ document.metadata?.title || document.file_name || document.name || 'Untitled Document' }}
                        </div>
                      </router-link>
                      <div class="action-icons">
                        <q-icon
                          :name="document.bookmarked ? 'bookmark' : 'bookmark_border'"
                          class="action-icon bookmark-icon"
                          :class="{ 'bookmarked': document.bookmarked }"
                          size="18px"
                          @click.stop="toggleBookmark(document.id)"
                        />
                        <q-icon
                          :name="document.starred ? 'star' : 'star_border'"
                          class="action-icon star-icon"
                          :class="{ 'starred': document.starred }"
                          size="18px"
                          @click.stop="toggleStar(document.id)"
                        />
                      </div>
                    </div>
                    <p class="document-type">{{ document.metadata?.author || document.author || 'PDF Document' }}</p>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Collection Dialog -->
    <q-dialog v-model="showEditDialog" persistent>
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
                v-if="editPreviewImage"
                :src="editPreviewImage"
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
              v-model="editCollectionTitle"
              class="field-collection q-mb-md"
              label="Enter Collection Name"
              dense
              outlined
            />

            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
              SHORT DESCRIPTION
            </div>
            <q-input
              v-model="editCollectionDesc"
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
          <q-btn label="Save Changes" class="q-mr-sm btn-save" @click="saveEditCollection" no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useModelStore } from 'stores/modelStore'
import { useModelStore as useDocumentsStore } from 'stores/documentsStore'
import '@google/model-viewer'

const router = useRouter()
const modelStore = useModelStore()
const documentsStore = useDocumentsStore()

// Sample collection data with image property
const currentCollectionIndex = ref(0)
const collections = ref([
  {
    id: 1,
    name: 'Historical Artifacts Collection',
    description: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod Lorem.',
    image: null
  },
  {
    id: 2,
    name: 'Cultural Heritage Collection',
    description: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod Lorem.',
    image: null
  },
  {
    id: 3,
    name: 'Academic Awards Collection',
    description: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod Lorem.',
    image: null
  }
])

// Dialog states (only keeping edit dialog)
const showEditDialog = ref(false)

// Edit dialog data
const editCollectionTitle = ref('')
const editCollectionDesc = ref('')
const editPreviewImage = ref(null)
const editFileInput = ref(null)

// Computed properties
const currentCollection = computed(() => collections.value[currentCollectionIndex.value])

// Get first 2 models for display (using real data from modelStore)
const displayedArtifacts = computed(() => {
  return modelStore.models.slice(0, 2)
})

// Get first 4 documents for display (using real data from documentsStore)
const displayedDocuments = computed(() => {
  const documents = documentsStore.documents || []
  console.log('Documents data:', documents) // Debug log
  return documents.slice(0, 4).filter(doc => doc && doc.id) // Filter out null/undefined items
})

// Toggle functions with your logic applied
const toggleBookmark = (itemId) => {
  // Try to find in artifacts/models first
  const artifact = modelStore.models.find(m => m.id === itemId)
  if (artifact) {
    artifact.bookmarked = !artifact.bookmarked
    return
  }

  // Try to find in documents
  const document = documentsStore.documents.find(d => d.id === itemId)
  if (document) {
    document.bookmarked = !document.bookmarked
    return
  }

  console.log('Item not found for bookmark toggle:', itemId)
}

const toggleStar = (itemId) => {
  // Try to find in artifacts/models first
  const artifact = modelStore.models.find(m => m.id === itemId)
  if (artifact) {
    artifact.starred = !artifact.starred
    return
  }

  // Try to find in documents
  const document = documentsStore.documents.find(d => d.id === itemId)
  if (document) {
    document.starred = !document.starred
    return
  }

  console.log('Item not found for star toggle:', itemId)
}

// Edit dialog methods
const triggerEditFileInput = () => {
  editFileInput.value.click()
}

const handleEditImageUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      editPreviewImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const saveEditCollection = () => {
  console.log('Save edited collection:', {
    id: currentCollection.value.id,
    title: editCollectionTitle.value,
    description: editCollectionDesc.value,
    image: editPreviewImage.value
  })

  // Update the current collection with new data INCLUDING the image
  collections.value[currentCollectionIndex.value] = {
    ...collections.value[currentCollectionIndex.value],
    name: editCollectionTitle.value,
    description: editCollectionDesc.value,
    image: editPreviewImage.value // Save the uploaded image
  }

  // Add your save logic here to persist to backend
  cancelEditCollection()
}

const cancelEditCollection = () => {
  editCollectionTitle.value = ''
  editCollectionDesc.value = ''
  editPreviewImage.value = null
  showEditDialog.value = false
}

// Populate edit form when edit dialog opens - now includes existing image
const openEditDialog = () => {
  editCollectionTitle.value = currentCollection.value.name
  editCollectionDesc.value = currentCollection.value.description
  editPreviewImage.value = currentCollection.value.image // Load existing image
  showEditDialog.value = true
}

// Other methods
const showArtifactInfo = (artifactId) => {
  console.log('Show artifact info:', artifactId)
  // Add logic to show artifact information
}

const goBack = () => {
  router.go(-1)
}

const deleteCollection = () => {
  console.log('Delete collection:', currentCollection.value.id)
}

const previousCollection = () => {
  if (currentCollectionIndex.value > 0) {
    currentCollectionIndex.value--
  }
}

const nextCollection = () => {
  if (currentCollectionIndex.value < collections.value.length - 1) {
    currentCollectionIndex.value++
  }
}

// Load models and documents on mounted
onMounted(async () => {
  try {
    // Load models
    const modelsRes = await fetch('http://localhost:3000/models')
    const models = await modelsRes.json()
    modelStore.setModels(models)

    // Load documents
    const documentsRes = await fetch('http://localhost:3000/documents')
    const documents = await documentsRes.json()
    documentsStore.setDocuments(documents)
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})
</script>
