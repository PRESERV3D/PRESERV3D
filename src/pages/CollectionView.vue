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
                <div class="book-content">
                  <div class="book-title-section">
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
              @click="editCollection"
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
                @click="addNewArtifact"
                icon="add_circle"
                label="Add New"
                class="add-new-btn"
                no-caps
                unelevated
              />
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
                          name="bookmark_border"
                          class="action-icon bookmark-icon"
                          size="18px"
                          @click.stop="toggleBookmark(artifact.id)"
                        />
                        <q-icon
                          name="star_border"
                          class="action-icon star-icon"
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
          <div class="documents-subsection">
            <div class="section-header">
              <h5 class="section-title">Documents</h5>
              <q-btn
                @click="addNewDocument"
                icon="add_circle"
                label="Add New"
                class="add-new-btn"
                no-caps
                unelevated
              />
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
                        <div class="text-subtitle2 document-title">{{ document.metadata?.title || document.file_name }}</div>
                      </router-link>
                      <div class="action-icons">
                        <q-icon
                          name="bookmark_border"
                          class="action-icon bookmark-icon"
                          size="18px"
                          @click.stop="toggleBookmark(document.id)"
                        />
                        <q-icon
                          name="star_border"
                          class="action-icon star-icon"
                          size="18px"
                          @click.stop="toggleStar(document.id)"
                        />
                      </div>
                    </div>
                    <p class="document-type">{{ document.metadata?.author || 'PDF Document' }}</p>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

// Sample collection data (keeping this as is)
const currentCollectionIndex = ref(0)
const collections = ref([
  {
    id: 1,
    name: 'Historical Artifacts Collection',
    description: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod Lorem.'
  },
  {
    id: 2,
    name: 'Cultural Heritage Collection',
    description: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod Lorem.'
  },
  {
    id: 3,
    name: 'Academic Awards Collection',
    description: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod. Gravida at praesent aliquam.elit lectus enim id euismod Lorem.'
  }
])

// Computed properties
const currentCollection = computed(() => collections.value[currentCollectionIndex.value])

// Get first 2 models for display (using real data from modelStore)
const displayedArtifacts = computed(() => {
  return modelStore.models.slice(0, 2)
})

// Get first 4 documents for display (using real data from documentsStore)
const displayedDocuments = computed(() => {
  return documentsStore.documents.slice(0, 4)
})

// Methods from reference file
const showArtifactInfo = (artifactId) => {
  console.log('Show artifact info:', artifactId)
  // Add logic to show artifact information
}

const toggleBookmark = (itemId) => {
  console.log('Toggle bookmark:', itemId)
  // Add bookmark logic here
}

const toggleStar = (itemId) => {
  console.log('Toggle star:', itemId)
  // Add star/favorite logic here
}

// Original methods
const goBack = () => {
  router.go(-1)
}

const editCollection = () => {
  console.log('Edit collection:', currentCollection.value.id)
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

const addNewArtifact = () => {
  console.log('Add new artifact to collection')
}

const addNewDocument = () => {
  console.log('Add new document to collection')
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

