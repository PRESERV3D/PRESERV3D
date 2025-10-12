<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Collections</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">Archival Materials grouped into a collection.</h5>
      </div>
    </div>

    <div class="artifact-btn">
      <q-btn-dropdown
        outline
        color="black"
        :label="`Sort by: ${sortOption}`"
        icon="sort"
        size="sm"
        class="q-ml-xs artifact-btn-style"
        dense
      >
        <q-list>
          <q-item
            v-for="option in sortOptions"
            :key="option"
            clickable
            v-close-popup
            class="collection-sort-menu"
            @click="setSortOption(option)"
          >
            <q-item-section>
              <q-item-label>{{ option }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-btn
        @click="showDialog = true"
        label="Add New"
        icon="add_circle"
        style="min-width: 9.375rem"
        class="add-new-btn"
        no-caps
        unelevated
      />
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center q-my-md">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Collection Display -->
    <div v-else>
      <div v-if="collections.length > 0" class="box-collections">
        <div
          v-for="(collection, index) in collections"
          :key="collection.collection_id"
          class="collection-item"
          :class="{
            'hide-on-tablet': index >= 6,
            'hide-on-mobile': index >= 4,
          }"
        >
          <router-link :to="`/collection/${collection.collection_id}`" class="collection-link">
            <!-- Updated book styling to match collections design -->
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
          </router-link>

          <div class="q-mt-md fade-title-container">
            <div
              class="sub-font fade-title row items-center"
              style="color: black; font-weight: 600; margin-left: 3rem"
            >
              {{ collection.collection_name }}
              <!-- Pinned icon for Favorites -->
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
      </div>

      <div v-else class="text-center q-mt-md">
        <p>No collections found.</p>
      </div>
    </div>

    <!-- Add New Collection Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="add-collection-card">
        <q-card-section class="row justify-center items-center">
          <div class="sub-font-3 text-center" style="font-size: 16px; font-weight: 700">
            Add New Collection
          </div>
        </q-card-section>

        <q-card-section class="row q-gutter-lg justify-center">
          <div class="col-auto">
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

          <div class="col-auto">
            <div class="sub-font-3" style="font-size: 16px; font-weight: 500">
              COLLECTION NAME <span class="required">*</span>
            </div>
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
            @click="resetForm"
            no-caps
          />
          <div v-if="!isGenerateCollectionLoading">
            <q-btn
              :disable="!newCollectionTitle"
              label="Save"
              class="q-mr-sm btn-save"
              @click="addCollection"
              no-caps
            />
          </div>
          <q-spinner v-else color="primary" size="2em" class="q-mx-lg" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { uploadFileToR2 } from 'boot/r2'
import { convertToWorkingUrl } from 'src/composables/useR2Url'
import { preloadPreviews } from 'src/utils/urlCache'

const user = ref({ first_name: '' })
const collections = ref([])
const isLoading = ref(true)
const showDialog = ref(false)
const isGenerateCollectionLoading = ref(false)
const fileInput = ref(null)
const previewImage = ref(null)
const newCollectionTitle = ref('')
const newCollectionDesc = ref('')
const newCollection = ref({
  coverFile: null,
})
const sortOption = ref('Newest to Oldest')
const sortOptions = ['Alphabetical', 'Oldest to Newest', 'Newest to Oldest', 'Recently Updated']

// Load user and collections
onMounted(async () => {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    console.error('Auth error:', authError)
    isLoading.value = false
    return
  }

  const { data: userData, error: userError } = await supabase
    .from('registered_users')
    .select('first_name')
    .eq('id', authUser.id)
    .single()

  if (userError) {
    console.error('Error fetching user data:', userError)
  } else {
    user.value = userData
  }

  await loadCollections(authUser.id)
})

// FIXED: Sorting
function applySorting() {
  if (!Array.isArray(collections.value)) return

  // Clone the array to prevent mutation issues
  const allCollections = [...collections.value]

  // Separate "Favorites" collection first
  const favorites = allCollections.find((c) => c.collection_name === 'Favorites')
  const others = allCollections.filter((c) => c.collection_name !== 'Favorites')

  switch (sortOption.value) {
    case 'Recently Updated': {
      const updated = others.filter((c) => c.updated_at)
      const neverUpdated = others.filter((c) => !c.updated_at)

      updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      neverUpdated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      collections.value = favorites
        ? [favorites, ...updated, ...neverUpdated]
        : [...updated, ...neverUpdated]
      break
    }

    case 'Newest to Oldest':
      others.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      collections.value = favorites ? [favorites, ...others] : others
      break

    case 'Oldest to Newest':
      others.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      collections.value = favorites ? [favorites, ...others] : others
      break

    case 'Alphabetical':
      others.sort((a, b) => a.collection_name.localeCompare(b.collection_name))
      collections.value = favorites ? [favorites, ...others] : others
      break
  }
}

function setSortOption(option) {
  sortOption.value = option
  applySorting()
}

// FIXED: Load collections from Supabase
async function loadCollections(userId) {
  const { data, error } = await supabase
    .from('collections')
    .select('collection_name, cover_url, collection_id, created_at, updated_at')
    .eq('user_id', userId)

  if (error) {
    console.error('Error loading collections:', error)
  } else {
    // Convert cover URLs to presigned URLs
    const collectionsWithUrls = await Promise.all(
      (data || []).map(async (collection) => {
        let workingCoverUrl = collection.cover_url

        if (collection.cover_url) {
          try {
            workingCoverUrl = await convertToWorkingUrl(collection.cover_url)
          } catch (err) {
            console.warn(
              'Could not convert cover URL for collection:',
              collection.collection_id,
              err,
            )
          }
        }

        return {
          ...collection,
          cover_url: workingCoverUrl,
        }
      }),
    )

    // Separate and pin the "Favorites" collection
    const favorites = collectionsWithUrls.find((c) => c.collection_name === 'Favorites')
    const others = collectionsWithUrls.filter((c) => c.collection_name !== 'Favorites')

    // Combine and assign to collections
    collections.value = favorites ? [favorites, ...others] : others

    // Preload cover images for instant display
    const coverUrls = collections.value.map((c) => c.cover_url).filter(Boolean)
    if (coverUrls.length > 0) {
      preloadPreviews(coverUrls)
    }

    // Apply sorting
    applySorting()
  }

  isLoading.value = false
}

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
  isGenerateCollectionLoading.value = true

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
      description: description,
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
    isGenerateCollectionLoading.value = false
  }
}
</script>

<style scoped>
/* ========================
 RESPONSIVE BUTTON STYLES
======================== */

/* Responsive styles for buttons */
.subtitle-btn-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.subtitle-text {
  flex: 1;
  min-width: 200px;
}

.artifact-btn {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Mobile styles (max-width: 767px) */
@media (max-width: 767px) {
  .subtitle-btn-row {
    flex-direction: column;
    align-items: stretch;
  }

  .subtitle-text {
    margin-bottom: 1rem;
  }

  .artifact-btn {
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .artifact-btn-style {
    min-width: 100px;
    margin: 0.25rem !important;
  }
  /* Make filter dropdown responsive */
  .artifact-btn-style .q-list {
    width: 90vw !important;
    max-width: 400px !important;
  }

  .artifact-btn-style .row {
    flex-direction: column;
  }

  .artifact-btn-style .col {
    margin-bottom: 1rem;
  }

  .artifact-btn-style q-scroll-area {
    width: 100% !important;
  }
}

/* Tablet styles (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .subtitle-btn-row {
    align-items: center;
  }

  .artifact-btn {
    flex-wrap: wrap;
    justify-content: flex-end;
    margin-bottom: 1.5rem;
  }

  .artifact-btn-style {
    margin: 0.25rem 0.25rem 0.25rem 0.5rem !important;
  }

  .add-new-btn {
    margin: 0.25rem !important;
  }

  /* Adjust filter dropdown for tablets */
  .artifact-btn-style .q-list {
    width: 35rem !important;
  }
}

/* Small desktop styles (1024px - 1199px) */
@media (min-width: 1024px) and (max-width: 1199px) {
  .artifact-btn-style {
    margin-left: 0.5rem !important;
  }
}

/* Additional responsive adjustments for very small screens */
@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .artifact-btn {
    justify-content: space-around;
    margin-bottom: 2.5rem;
  }

  .artifact-btn-style,
  .add-new-btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
  }
}

/* ========================
 EXISTING STYLES
======================== */

.box-collections {
  border-radius: 10px;
  background: linear-gradient(-80deg, rgb(255, 251, 221) 10%, #fbfae9 30%, #ffffff 70%);
  width: 100%;
  height: auto;
  display: flex;
  flex-wrap: wrap;
  padding-top: 4rem;
  padding-bottom: 3.5rem;
  padding-left: 1.5rem;
  gap: 3rem;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
  justify-content: center;
}

.collection-item {
  display: flex;
  flex-direction: column;
}

.collection-link {
  text-decoration: none;
  color: inherit;
}

/* Book styling matching the details page */
.book-container {
  position: relative;
  perspective: 1000px;
  height: 330px;
}

.book-cover {
  width: 15rem;
  height: 21rem;
  margin-left: 2.1rem;
  position: relative;
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  border-radius: 0 15px 15px 0;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(8, 3, 0, 0.3);
  transform: rotateY(-5deg) rotateX(2deg);
  transition: all 0.3s ease;
  cursor: pointer;
}

.book-cover:hover {
  transform: rotateY(-2deg) rotateX(1deg) translateY(-5px);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(8, 3, 0, 0.3);
}

.book-spine {
  position: absolute;
  left: -10px;
  top: 0;
  bottom: 0;
  width: 10px;
  background: linear-gradient(to right, #523518 0%, #381c08 100%);
  border-radius: 0 0 0 12px;
  box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.3);
}

.book-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, #b59f9f 0%, #640c0c 90%, #121212 100%);
  border-radius: 0 15px 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

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
  border-radius: 0 15px 15px 0;
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

.book-title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.book-icon {
  color: white;
}

/* Title styling */
.fade-title-container {
  width: 220px;
  text-align: center;
}

.fade-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  position: relative;
  padding: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tooltip-box {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.fade-title:hover .tooltip-box {
  opacity: 1;
  visibility: visible;
}

/* Upload box styling for dialog */

.upload {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  text-align: center;
  padding: 1rem;
  text-align: center;
  color: #666;
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
  border: 2px dashed #ccc;
  transition: border-color 0.2s ease;
}

.upload-box:hover {
  border-color: #560505;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.upload {
  text-align: center;
  color: #666;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.5rem;
}

/* ========================
 RESPONSIVE DESIGN
======================== */

/* Hide collections based on screen size - similar to documents hiding */
/* Desktop - show all collections */
@media (min-width: 1025px) {
  .collection-item:nth-child(n) {
    display: flex;
  }

  .box-collections {
    justify-content: flex-start;
  }
}

/* Tablet view - limit collections display and center remaining */
@media (max-width: 1024px) and (min-width: 769px) {
  .hide-on-tablet {
    display: none;
  }

  .box-collections {
    justify-content: center;
  }
}

/* Mobile view - further limit collections and center remaining */
@media (max-width: 768px) {
  .box-collections {
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
  }

  .book-cover {
    width: 12rem;
    height: 16rem;
  }

  .fade-title-container {
    width: 12rem;
  }

  .fade-title {
    font-size: 0.85rem;
  }

  .hide-on-mobile {
    display: none;
  }
}

/* Extra small screens - center remaining collections */
@media (max-width: 480px) {
  .box-collections {
    padding: 1rem;
    gap: 1rem;
    justify-content: center;
  }

  .book-cover {
    width: 10rem;
    height: 16rem;
  }

  .fade-title-container {
    width: 10rem;
  }
}

/* General responsive adjustments for larger screens */
@media (max-width: 1200px) {
  .box-collections {
    gap: 2rem;
    padding: 2rem 1.5rem;
  }
}

/* Add New button and other existing styles */
.add-new-btn {
  border-radius: 8px;
  background: #560505;
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-new-btn:hover {
  background: #6b0707;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(86, 5, 5, 0.3);
}

/* Dialog styles */
.add-collection-card {
  background-color: #fbf4d0;
  padding: 1rem;
  min-width: 30rem;
  border-radius: 12px !important;
}

.btn-save {
  background: #560505;
  color: white;
  border-radius: 6px;
  font-weight: 500;
}

.btn-save:hover {
  background: #6b0707;
}

.field-collection {
  border-radius: 8px;
}
</style>
