<template>
  <q-page class="q-pa-md">

    <div class="layout-container">
      <div class="box-1 row items-center">
        <div class="col-7 q-gutter-xs">
          <p class="q-ml-xl admin-title">Discover Cultural Heritage in 3D & Digital Archives</p>
          <p class="q-ml-xl admin-subtitle">
            Explore University artifacts, historic documents, and <br>
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
          <q-img
            src="src/assets/img/artifact1.png"
            alt="Artifact 1"
            class="circular-image"
          />
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
          <q-img
            src="src/assets/img/artifact2.png"
            alt="Artifact 2"
            class="circular-image"
          />
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
          <q-img
            src="src/assets/img/artifact3.png"
            alt="Artifact 3"
            class="circular-image"
          />
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
                <q-btn
                  flat
                  round
                  icon="info_outline"
                  class="info-icon-overlay"
                  size="md"
                  @click.stop="showModelInfo(model.id)"
                />
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
                    <div class="text-subtitle2 artifact-title">{{ model.metadata?.title || model.file_name }}</div>
                  </router-link>
                  <div class="action-icons">
                    <q-icon
                      name="bookmark_border"
                      class="action-icon bookmark-icon"
                      size="18px"
                      @click.stop="toggleBookmark(model.id)"
                    />
                    <q-icon
                      name="star_border"
                      class="action-icon star-icon"
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
                    @click="selectedFilter = option; showFilterMenu = false"
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
                    @click="selectedSort = option; showSortMenu = false"
                    :class="{ 'bg-grey-2': selectedSort === option }"
                  >
                    <q-item-section>{{ option }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <!-- Five Collections Section -->
        <div class="row q-gutter-xl q-pl-lg q-pr-sm q-mb-sm">
          <div v-for="i in 5" :key="i" class="col card-wrapper">
            <q-card class="my-card collection-card" flat>
              <div class="book-container">
                <div class="book-cover">
                  <div class="book-spine"></div>
                  <div class="book-content">
                    <div class="book-title-section">
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
                    <div class="text-subtitle2 artifact-title">Collection {{ i }}</div>
                  </div>
                  <div class="action-icons">
                    <q-icon
                      name="bookmark_border"
                      class="action-icon bookmark-icon"
                      size="18px"
                      @click.stop="toggleBookmark('collection' + i)"
                    />
                    <q-icon
                      name="star_border"
                      class="action-icon star-icon"
                      size="18px"
                      @click.stop="toggleStar('collection' + i)"
                    />

                  </div>
                </div>

              </q-card-section>

            </q-card>
          </div>
        </div>

        <!-- See All Link -->
        <div class="row justify-end q-pr-sm q-pb-sm">
          <router-link to="/collections" class="see-all-link" style="margin-top: 0.5rem;">
            See All
            <q-icon name="arrow_forward" size="16px" class="q-ml-xs" />
          </router-link>
        </div>

      </div>
    </div>



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

const toggleStar = (artifactId) => {
  console.log('Toggling star for:', artifactId)
  // Add star/favorite logic here
}

const toggleBookmark = (artifactId) => {
  console.log('Toggling bookmark for:', artifactId)
  // Add bookmark logic here

}

const addNewCollection = () => {
  console.log('Adding new collection')
  // Add logic here to create a new collection

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

<style scoped>







.artifacts {
  border-radius: 8px 8px 0 0;
}

.artifact-title {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #010101;
  line-height: 1.3;
  margin-bottom: 4px;
  margin-left: 20px;
}

.view-link {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  text-decoration: none;
  color: #880000;
}

.view-link:hover {
  color: #560505;
  text-decoration: underline;
}

.card-wrapper {
  min-width: 0;
  flex: 1;
}

/* Adjust box-3 height to accommodate artifacts */
.box-4 {
  border-radius: 15px;
  background: linear-gradient(10deg, #ffffff 35%, #fdf9e7 78%, #fbf4d0 100%);
  flex: 2;
  min-width: 0;
  height: auto;
  min-height: 35rem;
  box-shadow: 10px 4px 10px rgba(102, 102, 102, 0.25);
}

/* Collections Book Style */
.collection-card {
  border: none;
  background: transparent;
  box-shadow: none;
}

.book-container {
  perspective: 1000px;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-cover {
  width: 100%;
  height: 320px;
  position: relative;
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  border-radius: 0 20px 20px 0;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(8, 3, 0, 0.3);
  transform: rotateY(-5deg) rotateX(2deg);
  transition: all 0.3s ease;
  cursor: pointer;
}

.book-cover:hover {
  transform: rotateY(-2deg) rotateX(1deg) translateY(-15px);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(139, 69, 19, 0.3);
}

.book-spine {
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 15px;
  background: linear-gradient(to right, #523518 0%, #381c08 100%);
  border-radius: 0 0 0 15px;
  box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.3);
}

.book-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.book-title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.book-icon {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.collection-title-link {
  text-decoration: none;
  flex: 1;
}

.add-new-btn {
  background-color: #560505;
  color: white;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-new-btn:hover {
  background-color: #560505;
  transform: translateY(-1px);
}

/* See All Link and Filter/Sort Button Styles */
.see-all-link, .filter-sort-btn {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #560505;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #56050512;
  box-shadow: 0 2px 4px rgba(86, 5, 5, 0.15);
}

.see-all-link:hover, .filter-sort-btn:hover {
  color: #ffffff;
  background-color: #0000005f;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(86, 5, 5, 0.2);
}

.see-all-link .q-icon, .filter-sort-btn .q-icon {
  transition: transform 0.2s ease;
}

.see-all-link:hover .q-icon, .filter-sort-btn:hover .q-icon {
  transform: translateX(2px);
}


/* Information icon overlay */
.info-icon-overlay {
  position: absolute;
  top: 14px;
  left: 12px;
  z-index: 100;
  color: #d6d6d6 !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(86, 5, 5, 0.1);
  padding: 8px !important;
  margin: 4px !important;
  transition: all 0.2s ease;
}

.info-icon-overlay:hover {
  background-color: #560505 !important;
  color: white !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(86, 5, 5, 0.25);
}

</style>
