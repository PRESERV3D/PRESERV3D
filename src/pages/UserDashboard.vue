<template>
  <q-page class="q-pa-md">
    <div class="layout-container">
      <div class="box-1 row items-center">
        <div class="col-7 q-gutter-xs">
          <p class="q-ml-xl admin-title">Discover Cultural Heritage in 3D & Digital Archives</p>
          <p class="q-ml-xl admin-subtitle">
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

      <div class="box-2">
        <p class="q-ml-lg admin-title-2">Recently Viewed</p>
        <div class="q-px-md q-pb-md">
          <div class="column q-gutter-xs">
            <!-- Recently Viewed Item 1 -->
            <div class="row items-center q-gutter-md recently-viewed-item">
              <div class="circular-holder">
                <q-img src="src/assets/img/artifact1.png" alt="Artifact 1" class="circular-image" />
              </div>
              <div class="col item-details">
                <p class="artifact-name">PUP School Trophy</p>
                <p class="view-info">Viewed 3 days ago</p>
              </div>
              <div class="action-icons">
                <q-btn
                  flat
                  round
                  icon="visibility"
                  class="view-icon"
                  @click="viewArtifact('artifact1')"
                />
                <q-btn
                  flat
                  round
                  icon="star_border"
                  class="star-icon"
                  @click="toggleStar('artifact1')"
                />
              </div>
            </div>

            <!-- Recently Viewed Item 2 -->
            <div class="row items-center q-gutter-md recently-viewed-item">
              <div class="circular-holder">
                <q-img src="src/assets/img/artifact2.png" alt="Artifact 2" class="circular-image" />
              </div>
              <div class="col item-details">
                <p class="artifact-name">PUP School Trophy</p>
                <p class="view-info">Viewed 5 hours ago</p>
              </div>
              <div class="action-icons">
                <q-btn
                  flat
                  round
                  icon="visibility"
                  class="view-icon"
                  @click="viewArtifact('artifact2')"
                />
                <q-btn
                  flat
                  round
                  icon="star_border"
                  class="star-icon"
                  @click="toggleStar('artifact2')"
                />
              </div>
            </div>

            <!-- Recently Viewed Item 3 -->
            <div class="row items-center q-gutter-md recently-viewed-item">
              <div class="circular-holder">
                <q-img src="src/assets/img/artifact3.png" alt="Artifact 3" class="circular-image" />
              </div>
              <div class="col item-details">
                <p class="artifact-name">PUP School Trophy</p>
                <p class="view-info">Viewed 1 day ago</p>
              </div>
              <div class="action-icons">
                <q-btn
                  flat
                  round
                  icon="visibility"
                  class="view-icon"
                  @click="viewArtifact('artifact3')"
                />
                <q-btn
                  flat
                  round
                  icon="star_border"
                  class="star-icon"
                  @click="toggleStar('artifact3')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="layout-container q-my-lg">
      <div class="box-3 q-px-lg">
        <div class="row item-center justify-between q-mb-sm">
          <p class="q-ml-lg admin-title-2">New in the Archives</p>
        </div>

        <!-- Three Artifacts Section -->
        <div class="row q-gutter-md q-px-sm q-mb-lg">
          <div v-for="(model, i) in featuredModels" :key="i" class="col card-wrapper">
            <q-card class="my-card" rounded bordered>
              <div class="card">
                <!-- Information icon positioned in upper left -->
                <!-- <q-btn
                  flat
                  round
                  icon="info_outline"
                  class="info-icon-overlay"
                  size="md"
                  @click.stop="showModelInfo(model.id)"
                /> -->
                <model-viewer
                  :src="model.file_url"
                  camera-controls
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
                  >
                    <div class="text-subtitle2 artifact-title">
                      {{ model.metadata?.title || model.file_name }}
                    </div>
                  </router-link>
                  <div class="action-icons">
                    <q-icon
                      :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                      class="action-icon bookmark-icon"
                      :class="{ bookmarked: model.bookmarked }"
                      size="18px"
                      @click.stop="toggleBookmark(model.id)"
                    />
                    <q-icon
                      :name="model.starred ? 'star' : 'star_border'"
                      class="action-icon star-icon"
                      :class="{ starred: model.starred }"
                      size="18px"
                      @click.stop="toggleStar(model.id)"
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
          <p class="q-ml-lg admin-title-2">Collections</p>
          <!-- Filter, Sort, and Add New button in the upper right -->
          <div class="row q-gutter-sm items-center q-pr-sm">
            <q-btn
              @click="addNewCollection"
              label="Add New"
              icon="add_circle"
              style="min-width: 150px"
              class="add-new-btn"
              no-caps
              unelevated
            />
            <!-- Filter Icon Button with Menu -->
            <q-btn
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
                    @click="((selectedFilter = option), (showFilterMenu = false))"
                    :class="{ 'bg-grey-2': selectedFilter === option }"
                  >
                    <q-item-section>{{ option }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <!-- Sort Icon Button with Menu -->
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
                    @click="((selectedSort = option), (showSortMenu = false))"
                    :class="{ 'bg-grey-2': selectedSort === option }"
                  >
                    <q-item-section>{{ option }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <!-- Collections Section -->
        <div class="row q-gutter-xl q-pl-lg q-pr-sm q-mb-sm">
          <div v-for="collection in collections" :key="collection.id" class="col card-wrapper">
            <q-card class="my-card collection-card" flat>
              <div class="book-container">
                <div class="book-cover">
                  <div class="book-spine"></div>
                  <div class="book-content" :class="{ 'has-image': collection.image }">
                    <!-- Show uploaded image as background if available -->
                    <div v-if="collection.image" class="book-image-overlay">
                      <img
                        :src="collection.image"
                        :alt="collection.title"
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
                    <div class="text-subtitle2 artifact-title">{{ collection.title }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
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
            @click="cancelAddCollection"
          />
          <q-btn label="Save" class="q-mr-sm btn-save" @click="saveCollection" no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

// const activeFilter = ref('all')
const modelStore = useModelStore()

// Filter and Sort reactive variables
const selectedFilter = ref('All')
const selectedSort = ref('Recent')

// Menu visibility controls
const showFilterMenu = ref(false)
const showSortMenu = ref(false)

// Collection dialog variables
const showDialog = ref(false)
const newCollectionTitle = ref('')
const newCollectionDesc = ref('')
const fileInput = ref(null)
const previewImage = ref(null)

// Collections data
const collections = ref([
  {
    id: 1,
    title: 'Collection 1',
    description: 'Default collection',
    image: null,
  },
  {
    id: 2,
    title: 'Collection 2',
    description: 'Default collection',
    image: null,
  },
  {
    id: 3,
    title: 'Collection 3',
    description: 'Default collection',
    image: null,
  },
  {
    id: 4,
    title: 'Collection 4',
    description: 'Default collection',
    image: null,
  },
  {
    id: 5,
    title: 'Collection 5',
    description: 'Default collection',
    image: null,
  },
])

const filterOptions = ['All', 'Documents', 'PDFs', 'Images', 'Recent']
const sortOptions = ['Recent', 'Alphabetical', 'Author', 'Date Created']

// Get first 3 models for featured display
const featuredModels = computed(() => {
  return modelStore.models.slice(0, 3)
})

// Methods for recently viewed items
const viewArtifact = (artifactId) => {
  console.log('Viewing artifact:', artifactId)
  // Add view logic here
}

const toggleStar = (modelId) => {
  const model = modelStore.models.find((m) => m.id === modelId)
  if (model) {
    model.starred = !model.starred
  }
}

const toggleBookmark = (modelId) => {
  const model = modelStore.models.find((m) => m.id === modelId)
  if (model) {
    model.bookmarked = !model.bookmarked
  }
}

// Collection management methods
const addNewCollection = () => {
  console.log('Opening add collection dialog')
  showDialog.value = true
}

const saveCollection = () => {
  if (!newCollectionTitle.value.trim()) {
    console.log('Collection title is required')
    return
  }

  // Add new collection to the LEFT side (beginning of array)
  const newCollection = {
    id: Date.now(), // Use timestamp for unique ID
    title: newCollectionTitle.value,
    description: newCollectionDesc.value || 'No description provided',
    image: previewImage.value, // Store the uploaded image
  }

  // Add to the beginning and keep only 5 collections
  collections.value.unshift(newCollection)
  if (collections.value.length > 5) {
    collections.value = collections.value.slice(0, 5)
  }

  console.log('Collection added to left side:', newCollection)

  // Clear form and close dialog
  clearCollectionForm()
  showDialog.value = false
}

const cancelAddCollection = () => {
  clearCollectionForm()
  showDialog.value = false
}

const clearCollectionForm = () => {
  newCollectionTitle.value = ''
  newCollectionDesc.value = ''
  previewImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.log('Please select an image file')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
    console.log('Image loaded successfully')
  }
  reader.onerror = (error) => {
    console.error('Error reading file:', error)
  }
  reader.readAsDataURL(file)
}

onMounted(async () => {
  try {
    // Load models
    const modelsRes = await fetch('http://localhost:3000/models')
    const models = await modelsRes.json()
    modelStore.setModels(models)
  } catch (err) {
    console.error('Failed to load models:', err)
  }
})
</script>
